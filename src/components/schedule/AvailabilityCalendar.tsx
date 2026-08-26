"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { BOOKING_RULES } from "@/config/studio";
import type { Package } from "@/data/packages";
import { ROOMS } from "@/data/rooms";
import {
  type Block,
  type Booking,
  type DayStatus,
  type DaySummary,
  summariseDay,
} from "@/lib/schedule";
import {
  type DateKey,
  MONTH_LONG,
  WEEKDAY_GRID_LABELS,
  WEEKDAY_SHORT,
  addDays,
  diffInDays,
  fromDateKey,
  monthGrid,
  toDateKey,
} from "@/lib/time";

/**
 * One month of availability.
 *
 * The seven-column grid is the most common source of sideways scroll on a
 * phone, so below 640px it is replaced outright by a running list of dates
 * rather than squeezed. Both views render the same summaries.
 *
 * Every day states its condition in words as well as in tone: full, partly
 * booked, open, closed, past.
 */
const STATUS_SHORT: Record<DayStatus, string> = {
  open: "Kosong",
  partial: "Sebagian",
  full: "Penuh",
  closed: "Tutup",
  past: "Lewat",
  outside: "Di luar",
};

const STATUS_CLASS: Record<DayStatus, string> = {
  open: "border-line-strong bg-paper hover:border-ink hover:bg-paper-2",
  partial: "border-line-strong bg-accent-soft text-accent-deep hover:border-accent",
  full: "border-line bg-paper-3 text-ink-2",
  closed: "border-dashed border-line bg-paper text-ink-2",
  past: "border-dashed border-line bg-paper text-ink-2 opacity-70",
  outside: "border-dashed border-line bg-paper text-ink-2 opacity-70",
};

export function AvailabilityCalendar({
  pkg,
  bookings,
  blocks,
  now,
  selectedDate,
  onSelectDate,
  className,
}: {
  pkg: Package;
  bookings: Booking[];
  blocks: Block[];
  now: Date;
  selectedDate: DateKey | null;
  onSelectDate: (dateKey: DateKey) => void;
  className?: string;
}) {
  const today = toDateKey(now);
  const todayParts = fromDateKey(today);
  const [cursor, setCursor] = useState(() => ({
    year: todayParts.year,
    month: todayParts.month,
  }));

  const cells = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);

  const summaries = useMemo(() => {
    const map = new Map<DateKey, DaySummary>();
    for (const cell of cells) {
      if (!cell) continue;
      map.set(cell, summariseDay(cell, ROOMS, pkg, bookings, blocks, now));
    }
    return map;
  }, [cells, pkg, bookings, blocks, now]);

  const lastAllowed = addDays(today, BOOKING_RULES.maxAdvanceDays);
  const lastAllowedParts = fromDateKey(lastAllowed);

  const canGoBack =
    cursor.year > todayParts.year ||
    (cursor.year === todayParts.year && cursor.month > todayParts.month);
  const canGoForward =
    cursor.year < lastAllowedParts.year ||
    (cursor.year === lastAllowedParts.year && cursor.month < lastAllowedParts.month);

  const shift = (amount: number) => {
    setCursor((current) => {
      const next = new Date(current.year, current.month + amount, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  /* The running list: every remaining bookable day, in order. */
  const listDays = useMemo(() => {
    return cells
      .filter((cell): cell is DateKey => cell !== null)
      .filter((cell) => diffInDays(today, cell) >= 0);
  }, [cells, today]);

  const monthLabel = MONTH_LONG[cursor.month] + " " + cursor.year;

  return (
    <div className={cn("surface overflow-visible", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <button
          type="button"
          className="btn btn-secondary h-10 w-10 min-h-0 !p-0"
          onClick={() => shift(-1)}
          disabled={!canGoBack}
          aria-label="Bulan sebelumnya"
        >
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none">
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h3 className="text-center text-base font-medium" aria-live="polite">
          {monthLabel}
        </h3>
        <button
          type="button"
          className="btn btn-secondary h-10 w-10 min-h-0 !p-0"
          onClick={() => shift(1)}
          disabled={!canGoForward}
          aria-label="Bulan berikutnya"
        >
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none">
            <path
              d="M6 3l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Wide screens: the month grid. */}
      <div className="hidden p-3 sm:block sm:p-4">
        <div className="grid grid-cols-7 gap-1.5" role="presentation">
          {WEEKDAY_GRID_LABELS.map((day) => (
            <div
              key={day.index}
              className="pb-1 text-center text-[0.75rem] font-medium uppercase tracking-wider text-ink-2"
            >
              <abbr title={day.long} className="no-underline">
                {day.short}
              </abbr>
            </div>
          ))}
          {cells.map((cell, index) => {
            if (!cell) return <div key={"empty-" + index} aria-hidden="true" />;
            const summary = summaries.get(cell)!;
            const day = fromDateKey(cell).day;
            const disabled =
              summary.status === "past" ||
              summary.status === "outside" ||
              summary.status === "closed";
            const isSelected = cell === selectedDate;
            const isToday = cell === today;
            return (
              <button
                key={cell}
                type="button"
                data-day={cell}
                data-day-status={summary.status}
                disabled={disabled}
                aria-current={isToday ? "date" : undefined}
                aria-pressed={isSelected}
                onClick={() => onSelectDate(cell)}
                className={cn(
                  "flex min-h-[4.5rem] min-w-0 flex-col items-start justify-between rounded-lg border p-2 text-left transition-colors duration-200",
                  isSelected
                    ? "border-accent bg-accent text-on-accent"
                    : STATUS_CLASS[summary.status],
                  disabled && "cursor-not-allowed",
                )}
              >
                <span className="flex w-full items-center justify-between gap-1">
                  <span className="text-sm font-medium tabular-nums">{day}</span>
                  {isToday && (
                    <span
                      className={cn(
                        "rounded px-1 text-[0.625rem] uppercase tracking-wide",
                        isSelected ? "bg-white/20" : "bg-ink text-on-ink",
                      )}
                    >
                      Hari ini
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-[0.6875rem] leading-tight">
                  {STATUS_SHORT[summary.status]}
                </span>
                {summary.total > 0 && (
                  <span className="w-full truncate text-[0.6875rem] leading-tight opacity-80">
                    {summary.available}/{summary.total} slot
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Small screens: a running list, so nothing has to fit into seven columns. */}
      <ul className="stack-lines px-4 sm:hidden">
        {listDays.length === 0 && (
          <li className="py-6 text-center text-sm text-ink-2">
            Tidak ada tanggal tersisa di bulan ini.
          </li>
        )}
        {listDays.map((cell) => {
          const summary = summaries.get(cell)!;
          const parts = fromDateKey(cell);
          const weekday = new Date(parts.year, parts.month, parts.day).getDay();
          const disabled = summary.status === "closed" || summary.status === "outside";
          const isSelected = cell === selectedDate;
          return (
            <li key={cell}>
              <button
                type="button"
                data-day={cell}
                data-day-status={summary.status}
                disabled={disabled}
                aria-pressed={isSelected}
                onClick={() => onSelectDate(cell)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 py-3.5 text-left",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <span className="flex min-w-0 items-baseline gap-3">
                  <span
                    className={cn(
                      "w-9 shrink-0 text-xl font-medium tabular-nums",
                      isSelected && "text-accent",
                    )}
                  >
                    {parts.day}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm">
                      {WEEKDAY_SHORT[weekday]}
                      {cell === today ? " . Hari ini" : ""}
                    </span>
                    <span className="block truncate text-[0.8125rem] text-ink-2">
                      {STATUS_SHORT[summary.status]}
                      {summary.total > 0
                        ? " . " + summary.available + " dari " + summary.total + " slot"
                        : ""}
                    </span>
                  </span>
                </span>
                <svg
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  aria-hidden="true"
                  fill="none"
                  className="shrink-0 text-ink-2"
                >
                  <path
                    d="M6 3l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-line px-4 py-3.5 sm:px-5">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] text-ink-2">
          {(["open", "partial", "full", "closed"] as DayStatus[]).map((status) => (
            <li key={status} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn("h-3 w-3 shrink-0 rounded-[4px] border", STATUS_CLASS[status])}
              />
              {STATUS_SHORT[status]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
