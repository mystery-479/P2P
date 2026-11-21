-- TownThread authentication, ticket ownership, and conservative duplicate grouping.
-- Anonymous submissions and privileged account creation must go through trusted
-- Supabase Edge Functions. Never expose the service-role key to the browser.

create extension if not exists pg_trgm with schema extensions;

do $$ begin
  create type public.app_role as enum ('citizen', 'official', 'admin');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role public.app_role not null default 'citizen',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    'citizen'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.user_id = (select auth.uid())
$$;

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number bigint generated always as identity unique,
  ticket_code text generated always as ('CL-' || lpad(ticket_number::text, 6, '0')) stored unique,
  owner_id uuid references public.profiles(user_id) on delete set null,
  description text not null check (char_length(description) between 10 and 2000),
  language text not null,
  photo_path text,
  location text not null,
  locality text not null,
  ward text not null default '',
  area_key text generated always as (
    lower(trim(regexp_replace(coalesce(locality, '') || ' ' || coalesce(ward, ''), '\s+', ' ', 'g')))
  ) stored,
  category text not null check (category in ('Roads', 'Waste', 'Water', 'Electricity', 'Trees', 'Drainage', 'Other')),
  severity text not null check (severity in ('Low', 'Medium', 'High', 'Critical')),
  severity_reason text not null,
  department text not null,
  status text not null default 'Open' check (status in ('Open', 'In Progress', 'Resolved')),
  needs_review boolean not null default false,
  duplicate_group_id uuid references public.tickets(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on column public.tickets.owner_id is
  'Null for unclaimed anonymous reports; set only by trusted server code after verified-email claim.';
comment on column public.tickets.duplicate_group_id is
  'Root ticket ID for likely duplicates. Tickets remain separate and are never auto-deleted or merged.';
comment on column public.tickets.area_key is
  'Normalized locality + ward key used to find likely duplicates; not a precise geospatial boundary.';

create index if not exists tickets_owner_created_idx
  on public.tickets (owner_id, created_at desc);
create index if not exists tickets_queue_idx
  on public.tickets (severity, created_at);
create index if not exists tickets_area_category_created_idx
  on public.tickets (area_key, category, created_at desc);
create index if not exists tickets_duplicate_group_idx
  on public.tickets (duplicate_group_id);
create index if not exists tickets_description_trgm_idx
  on public.tickets using gin (lower(description) extensions.gin_trgm_ops);

-- These server-only tables live in the exposed public schema because Supabase
-- Edge Functions use PostgREST. They have no browser grants and RLS is enabled.
create table if not exists public.ticket_private (
  ticket_id uuid primary key references public.tickets(id) on delete cascade,
  reporter_email text,
  reporter_phone text,
  reporter_name text,
  created_at timestamptz not null default now()
);

revoke all on public.ticket_private from public, anon, authenticated;
grant select, insert, update, delete on public.ticket_private to service_role;

create table if not exists public.ticket_claims_private (
  ticket_id uuid primary key references public.tickets(id) on delete cascade,
  claim_token_hash text unique not null,
  expires_at timestamptz not null default now() + interval '30 days',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  claimed_by uuid references public.profiles(user_id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
revoke all on public.ticket_claims_private from public, anon, authenticated;
grant select, insert, update, delete on public.ticket_claims_private to service_role;

create table if not exists public.public_report_rate_limits_private (
  key_hash text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0)
);
revoke all on public.public_report_rate_limits_private from public, anon, authenticated;
grant select, insert, update, delete on public.public_report_rate_limits_private to service_role;

create or replace function public.consume_public_report_rate_limit(
  p_key_hash text,
  p_max_requests integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  insert into public.public_report_rate_limits_private as limits (key_hash, window_started_at, request_count)
  values (p_key_hash, now(), 1)
  on conflict (key_hash) do update
  set
    request_count = case
      when now() - limits.window_started_at >= make_interval(secs => p_window_seconds)
        then 1
      else limits.request_count + 1
    end,
    window_started_at = case
      when now() - limits.window_started_at >= make_interval(secs => p_window_seconds)
        then now()
      else limits.window_started_at
    end
  returning request_count into current_count;

  return current_count <= p_max_requests;
end;
$$;

create or replace function public.claim_anonymous_ticket(p_token_hash text, p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_ticket_id uuid;
  claimed_ticket_code text;
begin
  select c.ticket_id into claimed_ticket_id
  from public.ticket_claims_private as c
  where c.claim_token_hash = p_token_hash
    and c.claimed_at is null
    and c.expires_at > now()
    and c.attempt_count < 10
  for update;

  if claimed_ticket_id is null then
    raise exception 'Invalid or expired claim code';
  end if;

  update public.tickets
  set owner_id = p_user_id
  where id = claimed_ticket_id
    and owner_id is null;

  if not found then
    raise exception 'Report has already been claimed';
  end if;

  update public.ticket_claims_private
  set claimed_by = p_user_id, claimed_at = now(), claim_token_hash = 'claimed:' || claimed_ticket_id::text
  where ticket_id = claimed_ticket_id;

  select t.ticket_code into claimed_ticket_code
  from public.tickets as t
  where t.id = claimed_ticket_id;

  return claimed_ticket_code;
end;
$$;

create table if not exists public.ticket_audit_log (
  id bigint generated always as identity primary key,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  actor_id uuid references public.profiles(user_id) on delete set null,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.audit_ticket_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.ticket_audit_log (ticket_id, actor_id, action, old_values, new_values)
  values (
    new.id,
    auth.uid(),
    'ticket_updated',
    jsonb_build_object(
      'category', old.category,
      'severity', old.severity,
      'severity_reason', old.severity_reason,
      'department', old.department,
      'status', old.status,
      'needs_review', old.needs_review
    ),
    jsonb_build_object(
      'category', new.category,
      'severity', new.severity,
      'severity_reason', new.severity_reason,
      'department', new.department,
      'status', new.status,
      'needs_review', new.needs_review
    )
  );
  return new;
end;
$$;

drop trigger if exists tickets_audit_changes on public.tickets;
create trigger tickets_audit_changes
  after update of category, severity, severity_reason, department, status, needs_review
  on public.tickets
  for each row
  when (
    old.category is distinct from new.category
    or old.severity is distinct from new.severity
    or old.severity_reason is distinct from new.severity_reason
    or old.department is distinct from new.department
    or old.status is distinct from new.status
    or old.needs_review is distinct from new.needs_review
  )
  execute function public.audit_ticket_changes();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'complaint-photos',
  'complaint-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Officials and admins read complaint photos" on storage.objects;
create policy "Officials and admins read complaint photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'complaint-photos'
    and (select public.current_app_role()) in ('official', 'admin')
  );

drop policy if exists "Citizens read their own complaint photos" on storage.objects;
create policy "Citizens read their own complaint photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'complaint-photos'
    and exists (
      select 1
      from public.tickets as t
      where t.photo_path = storage.objects.name
        and t.owner_id = (select auth.uid())
    )
  );

create or replace function public.group_likely_duplicate()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  matched_root uuid;
begin
  select coalesce(t.duplicate_group_id, t.id)
  into matched_root
  from public.tickets as t
  where t.category = new.category
    and t.area_key = lower(trim(regexp_replace(coalesce(new.locality, '') || ' ' || coalesce(new.ward, ''), '\s+', ' ', 'g')))
    and t.status <> 'Resolved'
    and t.created_at >= now() - interval '30 days'
    and extensions.similarity(lower(t.description), lower(new.description)) >= 0.32
  order by extensions.similarity(lower(t.description), lower(new.description)) desc, t.created_at asc
  limit 1;

  if matched_root is not null then
    new.duplicate_group_id := matched_root;
  end if;
  return new;
end;
$$;

drop trigger if exists tickets_group_likely_duplicate on public.tickets;
create trigger tickets_group_likely_duplicate
  before insert on public.tickets
  for each row execute function public.group_likely_duplicate();

alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_audit_log enable row level security;
alter table public.ticket_private enable row level security;
alter table public.ticket_claims_private enable row level security;
alter table public.public_report_rate_limits_private enable row level security;

grant select, insert, update, delete on
  public.profiles,
  public.tickets,
  public.ticket_private,
  public.ticket_claims_private,
  public.public_report_rate_limits_private,
  public.ticket_audit_log
to service_role;
grant usage, select on all sequences in schema public to service_role;

drop policy if exists "Users read own profile; admins read all" on public.profiles;
create policy "Users read own profile; admins read all"
  on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');

drop policy if exists "Users update own display name" on public.profiles;
create policy "Users update own display name"
  on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Citizens read their own tickets" on public.tickets;
create policy "Citizens read their own tickets"
  on public.tickets for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "Officials and admins read all tickets" on public.tickets;
create policy "Officials and admins read all tickets"
  on public.tickets for select to authenticated
  using ((select public.current_app_role()) in ('official', 'admin'));

drop policy if exists "Officials and admins update tickets" on public.tickets;
create policy "Officials and admins update tickets"
  on public.tickets for update to authenticated
  using ((select public.current_app_role()) in ('official', 'admin'))
  with check ((select public.current_app_role()) in ('official', 'admin'));

drop policy if exists "Officials and admins read audit log" on public.ticket_audit_log;
create policy "Officials and admins read audit log"
  on public.ticket_audit_log for select to authenticated
  using ((select public.current_app_role()) in ('official', 'admin'));

-- Explicit column grants prevent self-service role changes and direct public
-- ticket creation. Server Edge Functions use the server-only service role.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

revoke all on public.tickets from anon, authenticated;
grant select on public.tickets to authenticated;
grant update (category, severity, severity_reason, department, status, needs_review)
  on public.tickets to authenticated;
revoke all on public.ticket_audit_log from public, anon, authenticated;
grant select on public.ticket_audit_log to authenticated;
revoke all on public.ticket_private from public, anon, authenticated;
revoke all on public.ticket_claims_private from public, anon, authenticated;
revoke all on public.public_report_rate_limits_private from public, anon, authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.current_app_role() from public, anon;
grant execute on function public.current_app_role() to authenticated;
revoke all on function public.group_likely_duplicate() from public, anon, authenticated;
revoke all on function public.audit_ticket_changes() from public, anon, authenticated;
revoke all on function public.consume_public_report_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_public_report_rate_limit(text, integer, integer) to service_role;
revoke all on function public.claim_anonymous_ticket(text, uuid) from public, anon, authenticated;
grant execute on function public.claim_anonymous_ticket(text, uuid) to service_role;
