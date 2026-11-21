-- CivicLens authentication, ticket ownership, and conservative duplicate grouping.
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

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists private.ticket_private (
  ticket_id uuid primary key references public.tickets(id) on delete cascade,
  reporter_email text,
  created_at timestamptz not null default now()
);

revoke all on private.ticket_private from public, anon, authenticated;
grant select, insert, update, delete on private.ticket_private to service_role;

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
alter table private.ticket_private enable row level security;

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

-- Explicit column grants prevent self-service role changes and direct public
-- ticket creation. Server Edge Functions use the server-only service role.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

revoke all on public.tickets from anon, authenticated;
grant select on public.tickets to authenticated;
grant update (category, severity, severity_reason, department, status, needs_review)
  on public.tickets to authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.current_app_role() from public, anon;
grant execute on function public.current_app_role() to authenticated;
revoke all on function public.group_likely_duplicate() from public, anon, authenticated;
