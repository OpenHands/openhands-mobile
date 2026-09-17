function parseDateAsUtc(dateString: string): Date {
  const hasTimezone =
    dateString.includes("Z") || dateString.match(/[+-]\d{2}:\d{2}$/) !== null;
  if (hasTimezone) return new Date(dateString);
  return new Date(`${dateString}Z`);
}

/** Compact relative time, matching Canvas `formatTimeDelta`. */
export function formatTimeDelta(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseDateAsUtc(date) : date;
  if (Number.isNaN(dateObj.getTime())) return "";
  const delta = Date.now() - dateObj.getTime();
  const seconds = Math.floor(delta / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  if (seconds < 60) return `${Math.max(seconds, 0)}s`;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 30) return `${days}d`;
  if (months < 12) return `${months}mo`;
  return `${years}y`;
}
