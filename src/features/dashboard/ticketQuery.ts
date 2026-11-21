import {
  SEVERITY_RANK,
  type Severity,
  type Ticket,
  type TicketCategory,
  type TicketStatus,
} from "../../types/ticket";

export type TicketFilters = {
  search: string;
  severity: Severity | "All";
  category: TicketCategory | "All";
  department: string;
  status: TicketStatus | "All";
  needsReviewOnly: boolean;
};

export const EMPTY_FILTERS: TicketFilters = {
  search: "",
  severity: "All",
  category: "All",
  department: "All",
  status: "All",
  needsReviewOnly: false,
};

/** Critical → High → Medium → Low, then oldest first. */
export function sortByPriority(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function filterTickets(tickets: Ticket[], filters: TicketFilters): Ticket[] {
  const query = filters.search.trim().toLowerCase();

  return sortByPriority(
    tickets.filter((ticket) => {
      if (filters.severity !== "All" && ticket.severity !== filters.severity) return false;
      if (filters.category !== "All" && ticket.category !== filters.category) return false;
      if (filters.department !== "All" && ticket.department !== filters.department) return false;
      if (filters.status !== "All" && ticket.status !== filters.status) return false;
      if (filters.needsReviewOnly && !ticket.needsReview) return false;
      if (!query) return true;

      return [ticket.id, ticket.description, ticket.location]
        .join(" ")
        .toLowerCase()
        .includes(query);
    }),
  );
}

export function countByStatus(tickets: Ticket[]) {
  return {
    Open: tickets.filter((ticket) => ticket.status === "Open").length,
    "In Progress": tickets.filter((ticket) => ticket.status === "In Progress").length,
    Resolved: tickets.filter((ticket) => ticket.status === "Resolved").length,
  };
}
