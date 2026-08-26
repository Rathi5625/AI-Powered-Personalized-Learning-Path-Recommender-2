/**
 * Display formatters. Backend timestamps are `java.time.Instant`, i.e. ISO-8601 UTC
 * strings like "2026-08-23T04:11:09.482Z" — always parse, never string-slice.
 */

/** "23 Aug 2026". Returns an em dash for missing/unparseable values. */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "23 Aug 2026, 14:11" — for attempt/activity timestamps where the time matters. */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "just now" / "4h ago" / "3d ago", falling back to an absolute date past a month. */
export function formatRelative(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const secs = Math.round((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

/** `durationHours` is a nullable Integer on CourseResponse. */
export function formatDuration(hours?: number | null): string | null {
  if (hours === null || hours === undefined || hours <= 0) return null;
  if (hours < 1) return '< 1 hr';
  return hours === 1 ? '1 hr' : `${hours} hrs`;
}

/**
 * Milestone completion percentage. The backend does NOT send a percentage on
 * DashboardResponse — derive it here so every surface agrees on the number.
 */
export function percentComplete(completed: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

/** Initials for avatar chips, e.g. "Parth Sharma" -> "PS". */
export function initials(name?: string | null): string {
  if (!name?.trim()) return '·';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Turn a SCREAMING_SNAKE enum into "Screaming snake" for display. */
export function humanizeEnum(value?: string | null): string {
  if (!value) return '—';
  const lower = value.replace(/_/g, ' ').toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
