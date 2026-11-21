import { useSyncExternalStore } from "react";
import { sampleTickets } from "../data/sampleTickets";
import { triage } from "./triage";
import type { ComplaintDraft, Ticket } from "../types/ticket";

/**
 * Shared ticket data interface used by the complaint form and the dashboard.
 * Demo persistence: localStorage + an in-memory cache. Replace with a real API
 * in `src/services/` without changing the exported functions.
 */

const STORAGE_KEY = "townthread.tickets.v1";

type TicketPatch = Partial<
  Pick<Ticket, "category" | "severity" | "severityReason" | "department" | "status" | "needsReview">
>;

let cache: Ticket[] | undefined;
const listeners = new Set<() => void>();

function read(): Ticket[] {
  if (cache) return cache;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        cache = parsed as Ticket[];
        return cache;
      }
    }
  } catch {
    // Storage may be unavailable or corrupted — fall back to sample data.
  }

  cache = [...sampleTickets];
  return cache;
}

function write(tickets: Ticket[]): void {
  cache = tickets;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch {
    // Quota errors (e.g. a large photo) should not break the in-memory demo.
  }
  listeners.forEach((listener) => listener());
}

function makeId(): string {
  const year = new Date().getFullYear();
  const suffix = Math.floor(10000 + Math.random() * 90000).toString();
  const id = `CL-${year}-${suffix}`;
  return read().some((ticket) => ticket.id === id) ? makeId() : id;
}

export function getTickets(): Ticket[] {
  return read();
}

export function getTicket(id: string): Ticket | undefined {
  return read().find((ticket) => ticket.id === id);
}

export function createTicket(draft: ComplaintDraft): Ticket {
  const ticket: Ticket = {
    id: makeId(),
    description: draft.description.trim(),
    language: draft.language,
    ...(draft.photoUrl ? { photoUrl: draft.photoUrl } : {}),
    location: draft.location.trim(),
    ...triage(draft),
    status: "Open",
    createdAt: new Date().toISOString(),
  };

  write([ticket, ...read()]);
  return ticket;
}

export function updateTicket(id: string, patch: TicketPatch): Ticket | undefined {
  const current = read();
  const index = current.findIndex((ticket) => ticket.id === id);
  if (index === -1) return undefined;

  const updated = { ...current[index], ...patch };
  const next = [...current];
  next[index] = updated;
  write(next);
  return updated;
}

/** Clears demo data and restores the sample tickets. Useful for testing. */
export function resetTickets(): void {
  write([...sampleTickets]);
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** React hook so pages re-render when tickets are created or updated. */
export function useTickets(): Ticket[] {
  return useSyncExternalStore(subscribe, getTickets, getTickets);
}
