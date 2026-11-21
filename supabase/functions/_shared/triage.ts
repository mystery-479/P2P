const departmentByCategory: Record<string, string> = {
  Roads: "Public Works / Roads",
  Waste: "Sanitation",
  Water: "Water Supply",
  Electricity: "Electrical",
  Trees: "Parks / Horticulture",
  Drainage: "Drainage / Public Works",
  Other: "Manual review",
};

const categoryKeywords: Array<[Exclude<keyof typeof departmentByCategory, "Other">, string[]]> = [
  ["Electricity", ["wire", "electric", "streetlight", "street light", "lamp", "power", "transformer", "current", "pole"]],
  ["Roads", ["pothole", "road", "street", "footpath", "pavement", "asphalt", "traffic", "bus stop"]],
  ["Waste", ["garbage", "trash", "rubbish", "waste", "dustbin", "litter", "smell", "sanitation"]],
  ["Drainage", ["drain", "drainage", "sewer", "sewage", "manhole", "flood", "water logging", "waterlogged", "blocked"]],
  ["Water", ["water", "pipe", "tap", "leak", "supply", "tank"]],
  ["Trees", ["tree", "branch", "plant", "leaf", "leaves", "garden", "park"]],
];

const criticalSignals = [
  "live wire", "exposed wire", "electrocution", "gas leak", "fire", "collapse",
  "accident", "open manhole", "sewage overflow", "child", "school", "hospital",
];
const highSignals = [
  "pothole", "swerving", "fallen", "overflowing", "flood", "blocked", "leaking",
  "dangerous", "unstable", "hanging", "broken", "entering houses",
];
const lowSignals = ["minor", "small", "slight", "cosmetic", "no urgency", "little"];

function firstSignal(text: string, signals: string[]): string | undefined {
  return signals.find((signal) => text.includes(signal));
}

export function triage(description: string, language: string) {
  const text = description.toLocaleLowerCase();
  const matches = categoryKeywords
    .map(([category, words]) => [category, words.filter((word) => text.includes(word)).length] as const)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const category = (matches[0]?.[0] ?? "Other") as keyof typeof departmentByCategory;
  const clearCategory = category !== "Other";
  const critical = firstSignal(text, criticalSignals);
  const high = firstSignal(text, highSignals);
  const low = firstSignal(text, lowSignals);
  const supportedLanguage = language === "English";
  let severity: "Low" | "Medium" | "High" | "Critical" = "Medium";
  let reason = "Reported service issue needs attention; no immediate hazard is described.";

  if (!clearCategory) {
    reason = "Complaint is unclear or too vague to classify — an officer needs to review it.";
  } else if (critical) {
    severity = "Critical";
    reason = `Mention of "${critical}" may indicate an immediate public-safety risk.`;
  } else if (high) {
    severity = "High";
    reason = `Mention of "${high}" suggests a significant hazard or disruption.`;
  } else if (low) {
    severity = "Low";
    reason = `Described as ${low}, so the reported impact appears limited.`;
  }

  const needsReview = !clearCategory || !supportedLanguage || text.length < 40;
  if (!supportedLanguage) reason += ` ${language} report needs human review; automated rules currently support English only.`;
  else if (clearCategory && text.length < 40) reason += " Short description — officer review recommended.";

  return {
    category,
    severity,
    severity_reason: reason,
    department: departmentByCategory[category],
    needs_review: needsReview,
  };
}
