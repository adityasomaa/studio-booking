/**
 * Date and time helpers.
 *
 * Everything is expressed as a "date key" (`YYYY-MM-DD`) plus "minutes since
 * midnight". Slot arithmetic never touches Date objects, which keeps it free of
 * timezone drift; Date is only built at the edges, when a slot has to be
 * compared against the real clock.
 */

export const WEEKDAY_LONG = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

export const WEEKDAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] as const;

export const MONTH_LONG = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export type DateKey = string;

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(key: DateKey): { year: number; month: number; day: number } {
  const [year, month, day] = key.split("-").map((part) => Number.parseInt(part, 10));
  return { year, month: month - 1, day };
}

export function isValidDateKey(key: unknown): key is DateKey {
  if (typeof key !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const { year, month, day } = fromDateKey(key);
  const probe = new Date(year, month, day);
  return (
    probe.getFullYear() === year && probe.getMonth() === month && probe.getDate() === day
  );
}

/** Builds a local Date for a given date key at a given minute of the day. */
export function dateAt(key: DateKey, minutes: number): Date {
  const { year, month, day } = fromDateKey(key);
  return new Date(year, month, day, Math.floor(minutes / 60), minutes % 60, 0, 0);
}

export function weekdayOf(key: DateKey): number {
  const { year, month, day } = fromDateKey(key);
  return new Date(year, month, day).getDay();
}

/** "HH:MM" -> minutes since midnight. */
export function parseClock(value: string): number {
  const [hours, minutes] = value.split(":").map((part) => Number.parseInt(part, 10));
  return hours * 60 + minutes;
}

/** minutes since midnight -> "10.30", the usual Indonesian clock format. */
export function formatClock(minutes: number): string {
  const normalised = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(normalised / 60))}.${pad(normalised % 60)}`;
}

export function formatRange(startMinutes: number, endMinutes: number): string {
  return `${formatClock(startMinutes)}\u2013${formatClock(endMinutes)}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours} jam ${rest} menit`;
  if (hours) return `${hours} jam`;
  return `${rest} menit`;
}

export function formatDateLong(key: DateKey): string {
  const { year, month, day } = fromDateKey(key);
  const date = new Date(year, month, day);
  return `${WEEKDAY_LONG[date.getDay()]}, ${day} ${MONTH_LONG[month]} ${year}`;
}

export function formatDateShort(key: DateKey): string {
  const { year, month, day } = fromDateKey(key);
  return `${day} ${MONTH_LONG[month]} ${year}`;
}

export function addDays(key: DateKey, amount: number): DateKey {
  const { year, month, day } = fromDateKey(key);
  return toDateKey(new Date(year, month, day + amount));
}

export function diffInDays(from: DateKey, to: DateKey): number {
  const a = fromDateKey(from);
  const b = fromDateKey(to);
  const start = Date.UTC(a.year, a.month, a.day);
  const end = Date.UTC(b.year, b.month, b.day);
  return Math.round((end - start) / 86_400_000);
}

/** Days of a month, padded to whole weeks starting on Monday. */
export function monthGrid(year: number, month: number): (DateKey | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay(): 0 = Sunday. Shift so Monday is column 0.
  const leading = (first.getDay() + 6) % 7;
  const cells: (DateKey | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toDateKey(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Weekday labels for a Monday-first grid. */
export const WEEKDAY_GRID_LABELS = [1, 2, 3, 4, 5, 6, 0].map((day) => ({
  index: day,
  short: WEEKDAY_SHORT[day],
  long: WEEKDAY_LONG[day],
}));
