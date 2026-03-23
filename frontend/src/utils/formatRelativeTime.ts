/**
 * Formats a date string as relative time (e.g. "2 years ago", "3 months ago")
 */
export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days < 30) return rtf.format(-days, "day");
  if (days < 365) return rtf.format(-Math.floor(days / 30), "month");
  return rtf.format(-Math.floor(days / 365), "year");
}
