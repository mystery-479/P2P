/**
 * DEMO TRIAGE — keyword rules, NOT an AI model.
 *
 * Person 2 owns the real classification step. This file exists only so the
 * citizen flow can be demonstrated end-to-end before that service is wired in.
 * Replace the import in `src/lib/ticketStore.ts` when real triage is available.
 */

import {
  DEPARTMENTS,
  type ComplaintDraft,
  type TicketCategory,
  type TriageResult,
} from "../../types/ticket";

const CATEGORY_KEYWORDS: Array<[Exclude<TicketCategory, "Other">, string[]]> = [
  ["Electricity", ["wire", "electric", "streetlight", "street light", "lamp", "power", "transformer", "current", "pole"]],
  ["Roads", ["pothole", "road", "street", "footpath", "pavement", "asphalt", "traffic", "bus stop"]],
  ["Waste", ["garbage", "trash", "rubbish", "waste", "dustbin", "litter", "smell", "sanitation"]],
  ["Drainage", ["drain", "drainage", "sewer", "sewage", "manhole", "flood", "water logging", "waterlogged", "blocked"]],
  ["Water", ["water", "pipe", "tap", "leak", "supply", "mixture", "tank"]],
  ["Trees", ["tree", "branch", "plant", "leaf", "leaves", "garden", "park"]],
];

const CRITICAL_SIGNALS = [
  "live wire",
  "exposed wire",
  "electrocution",
  "gas leak",
  "fire",
  "collapse",
  "accident",
  "open manhole",
  "sewage overflow",
  "child",
  "school",
  "hospital",
];

const HIGH_SIGNALS = [
  "pothole",
  "swerving",
  "fallen",
  "overflowing",
  "flood",
  "blocked",
  "leaking",
  "dangerous",
  "unstable",
  "hanging",
  "broken",
  "entering houses",
];

const LOW_SIGNALS = ["minor", "small", "slight", "cosmetic", "no urgency", "little"];

function includesAny(text: string, signals: string[]): string | undefined {
  return signals.find((signal) => text.includes(signal));
}

export function triageComplaint(draft: ComplaintDraft): TriageResult {
  const text = draft.description.trim().toLowerCase();
  const languageIsSupported = draft.language === "English";

  const matches = CATEGORY_KEYWORDS.map(
    ([category, keywords]) =>
      [category, keywords.filter((keyword) => text.includes(keyword)).length] as const,
  ).filter(([, count]) => count > 0);

  const best = matches.sort((a, b) => b[1] - a[1])[0];
  const hasClearCategory = Boolean(best && best[1] > 0);
  const category: TicketCategory = hasClearCategory ? best[0] : "Other";

  const critical = includesAny(text, CRITICAL_SIGNALS);
  const high = includesAny(text, HIGH_SIGNALS);
  const low = includesAny(text, LOW_SIGNALS);

  let severity: TriageResult["severity"] = "Medium";
  let severityReason = "Reported service issue needs attention but no immediate hazard is described.";

  if (!hasClearCategory) {
    severity = "Medium";
    severityReason = "Complaint is too vague to classify — an officer needs to review it.";
  } else if (critical) {
    severity = "Critical";
    severityReason = `Mention of "${critical}" indicates a possible immediate public-safety risk.`;
  } else if (high) {
    severity = "High";
    severityReason = `Mention of "${high}" suggests a significant hazard or disruption.`;
  } else if (low) {
    severity = "Low";
    severityReason = `Described as ${low}, so impact appears limited.`;
  }

  const needsReview = !hasClearCategory || !languageIsSupported || !draft.photoUrl && text.length < 40;

  if (needsReview && hasClearCategory && languageIsSupported) {
    severityReason += " Short description — officer review recommended.";
  }
  if (!languageIsSupported) {
    severityReason += ` ${draft.language} text needs human review (demo supports English keywords only).`;
  }

  return {
    category,
    severity,
    severityReason,
    department: needsReview && !hasClearCategory ? DEPARTMENTS.Other : DEPARTMENTS[category],
    needsReview,
  };
}
