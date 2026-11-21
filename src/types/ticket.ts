/**
 * Shared TownThread domain contract.
 * Agreed with the team in the project README; do not change without coordinating.
 */

export type Severity = "Low" | "Medium" | "High" | "Critical";

export type TicketStatus = "Open" | "In Progress" | "Resolved";

export type TicketCategory =
  | "Roads"
  | "Waste"
  | "Water"
  | "Electricity"
  | "Trees"
  | "Drainage"
  | "Other";

export type Ticket = {
  id: string;
  databaseId?: string;
  description: string;
  language: string;
  photoUrl?: string;
  location: string;
  locality?: string;
  ward?: string;
  duplicateGroupId?: string;
  duplicateCount?: number;
  category: TicketCategory;
  severity: Severity;
  severityReason: string;
  department: string;
  status: TicketStatus;
  createdAt: string; // ISO-8601 timestamp
  needsReview?: boolean;
};

/** What the citizen form collects. Contact details stay in the private schema. */
export type ComplaintDraft = {
  description: string;
  language: string;
  photoUrl?: string;
  location: string;
  locality: string;
  ward: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
};

/** Recommendation returned by the triage step. */
export type TriageResult = Pick<
  Ticket,
  "category" | "severity" | "severityReason" | "department" | "needsReview"
>;

export const CATEGORIES: TicketCategory[] = [
  "Roads",
  "Waste",
  "Water",
  "Electricity",
  "Trees",
  "Drainage",
  "Other",
];

export const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];

export const STATUSES: TicketStatus[] = ["Open", "In Progress", "Resolved"];

export const DEPARTMENTS: Record<TicketCategory, string> = {
  Roads: "Public Works / Roads",
  Waste: "Sanitation",
  Water: "Water Supply",
  Electricity: "Electrical",
  Trees: "Parks / Horticulture",
  Drainage: "Drainage / Public Works",
  Other: "Manual review",
};

/** Lower number = higher priority. Used by the dashboard (Person 3). */
export const SEVERITY_RANK: Record<Severity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

/** Languages offered in the complaint form. */
export const LANGUAGES = [
  "English",
  "Hindi",
  "Kannada",
  "Tamil",
  "Telugu",
  "Bengali",
  "Marathi",
  "Other",
] as const;
