export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function summaryOf(description: string, max = 110): string {
  const text = description.trim().replace(/\s+/g, " ");
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
