import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { ComplaintDraft, Severity, Ticket, TicketCategory, TicketStatus } from "../types/ticket";

type TicketRow = {
  id: string;
  ticket_code: string;
  description: string;
  language: string;
  photo_path: string | null;
  location: string;
  locality: string;
  ward: string;
  category: TicketCategory;
  severity: Severity;
  severity_reason: string;
  department: string;
  status: TicketStatus;
  needs_review: boolean;
  duplicate_group_id: string | null;
  created_at: string;
};

export type ReportSubmission = {
  ticket: Ticket;
  claimCode?: string;
};

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function throwIfError(error: PostgrestError | null): void {
  if (error) throw new Error(error.message);
}

async function mapTicket(row: TicketRow): Promise<Ticket> {
  let photoUrl: string | undefined;
  if (row.photo_path) {
    const { data, error } = await requireSupabase()
      .storage.from("complaint-photos")
      .createSignedUrl(row.photo_path, 60 * 30);
    if (!error) photoUrl = data.signedUrl;
  }
  return {
    id: row.ticket_code,
    databaseId: row.id,
    description: row.description,
    language: row.language,
    ...(photoUrl ? { photoUrl } : {}),
    location: row.location,
    locality: row.locality,
    ward: row.ward,
    category: row.category,
    severity: row.severity,
    severityReason: row.severity_reason,
    department: row.department,
    status: row.status,
    createdAt: row.created_at,
    needsReview: row.needs_review,
    ...(row.duplicate_group_id ? { duplicateGroupId: row.duplicate_group_id } : {}),
  };
}

export async function listTickets(): Promise<Ticket[]> {
  const { data, error } = await requireSupabase()
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: true });
  throwIfError(error);
  const tickets = await Promise.all(((data ?? []) as TicketRow[]).map(mapTicket));
  const grouped = new Map<string, number>();
  tickets.forEach((ticket) => {
    const key = ticket.duplicateGroupId ?? ticket.databaseId ?? ticket.id;
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  });
  return tickets.map((ticket) => {
    const key = ticket.duplicateGroupId ?? ticket.databaseId ?? ticket.id;
    const count = grouped.get(key) ?? 1;
    return { ...ticket, duplicateCount: count };
  });
}

export async function getTicket(ticketCode: string): Promise<Ticket | undefined> {
  const { data, error } = await requireSupabase()
    .from("tickets")
    .select("*")
    .eq("ticket_code", ticketCode)
    .maybeSingle();
  throwIfError(error);
  return data ? mapTicket(data as TicketRow) : undefined;
}

export async function updateTicket(
  ticketCode: string,
  patch: Partial<Pick<Ticket, "category" | "severity" | "severityReason" | "department" | "status" | "needsReview">>,
): Promise<Ticket> {
  const dbPatch = {
    ...(patch.category !== undefined ? { category: patch.category } : {}),
    ...(patch.severity !== undefined ? { severity: patch.severity } : {}),
    ...(patch.severityReason !== undefined ? { severity_reason: patch.severityReason } : {}),
    ...(patch.department !== undefined ? { department: patch.department } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.needsReview !== undefined ? { needs_review: patch.needsReview } : {}),
  };
  const { data, error } = await requireSupabase()
    .from("tickets")
    .update(dbPatch)
    .eq("ticket_code", ticketCode)
    .select("*")
    .single();
  throwIfError(error);
  return mapTicket(data as TicketRow);
}

export async function submitReport(draft: ComplaintDraft): Promise<ReportSubmission> {
  const { data, error } = await requireSupabase().functions.invoke("submit-report", {
    body: draft,
  });
  if (error) throw new Error(error.message || "Could not submit the report.");
  if (!data?.ticket) throw new Error("The report service returned an invalid response.");
  return data as ReportSubmission;
}

export async function claimReport(claimCode: string): Promise<string> {
  const { data, error } = await requireSupabase().functions.invoke("claim-report", {
    body: { claimCode: claimCode.trim() },
  });
  if (error) throw new Error(error.message || "Could not claim that report.");
  if (typeof data?.ticketCode !== "string") {
    throw new Error("The claim service returned an invalid response.");
  }
  return data.ticketCode;
}
