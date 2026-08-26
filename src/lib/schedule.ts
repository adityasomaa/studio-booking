/**
 * The conflict engine.
 *
 * A photo studio sells time. One room can only hold one customer for one range
 * of time, so this file is the part of the site that has to be right. Every
 * rule below is enforced here and re-enforced on the server in
 * src/app/api/booking/route.ts; the UI never decides availability on its own.
 *
 * Rules:
 *   1. A slot that is already booked cannot be picked again for the same room.
 *   2. A slot that only partly overlaps a booking is locked too, not just the
 *      one with identical start and end.
 *   3. Slots in the past cannot be picked, including hours that have already
 *      passed today.
 *   4. Changing package changes duration, so the slot list is recomputed from
 *      scratch rather than filtered down from the previous list.
 *   5. A booking must start at least BOOKING_RULES.minLeadTimeHours from now.
 *   6. Sessions in the same room are separated by BOOKING_RULES.bufferMinutes.
 */
import { BOOKING_RULES, OPENING_HOURS } from "@/config/studio";
import type { Package } from "@/data/packages";
import type { Room } from "@/data/rooms";
import {
  type DateKey,
  addDays,
  dateAt,
  diffInDays,
  formatClock,
  formatRange,
  parseClock,
  toDateKey,
  weekdayOf,
} from "@/lib/time";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export type Booking = {
  id: string;
  dateKey: DateKey;
  roomId: string;
  packageId: string;
  startMinutes: number;
  endMinutes: number;
  name: string;
  whatsapp: string;
  people: number;
  notes: string;
  status: BookingStatus;
  createdAt: number;
  /** True for the rows that ship with the demo, so they can be told apart. */
  seed?: boolean;
};

export type Block = {
  id: string;
  dateKey: DateKey;
  roomId: string;
  startMinutes: number;
  endMinutes: number;
  reason: string;
  createdAt: number;
};

export type SlotStatus = "available" | "booked" | "blocked" | "past" | "too-soon";

export type Slot = {
  /** Stable identity: room + date + start. */
  id: string;
  dateKey: DateKey;
  roomId: string;
  packageId: string;
  startMinutes: number;
  endMinutes: number;
  label: string;
  status: SlotStatus;
  /**
   * Status as words. Availability is never communicated by colour alone, so
   * this string is rendered next to every slot.
   */
  statusLabel: string;
  selectable: boolean;
};

export const SLOT_STATUS_LABEL: Record<SlotStatus, string> = {
  available: "Tersedia",
  booked: "Terisi",
  blocked: "Diblokir",
  past: "Lewat",
  "too-soon": "Terlalu dekat",
};

type Interval = { start: number; end: number };

function overlaps(a: Interval, b: Interval): boolean {
  // Half-open ranges: touching ends do not overlap.
  return a.start < b.end && b.start < a.end;
}

export function isActiveBooking(booking: Booking): boolean {
  return booking.status !== "cancelled";
}

/** Opening hours for a date, or null when the studio is closed that day. */
export function hoursFor(dateKey: DateKey): Interval | null {
  const hours = OPENING_HOURS[weekdayOf(dateKey)];
  if (!hours) return null;
  const start = parseClock(hours.open);
  const end = parseClock(hours.close);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  return { start, end };
}

export function isWithinBookingWindow(dateKey: DateKey, now: Date): boolean {
  const today = toDateKey(now);
  const delta = diffInDays(today, dateKey);
  return delta >= 0 && delta <= BOOKING_RULES.maxAdvanceDays;
}

export function bookingWindow(now: Date): { first: DateKey; last: DateKey } {
  const first = toDateKey(now);
  return { first, last: addDays(first, BOOKING_RULES.maxAdvanceDays) };
}

/**
 * Ranges that a new session in this room cannot touch.
 *
 * Existing bookings are padded by the buffer on both sides so that two sessions
 * always have a clean gap between them. Manual blocks are not padded: when the
 * owner blocks 13.00 to 15.00 they mean exactly that window.
 */
export function busyIntervals(
  dateKey: DateKey,
  roomId: string,
  bookings: Booking[],
  blocks: Block[],
): { interval: Interval; kind: "booked" | "blocked" }[] {
  const buffer = BOOKING_RULES.bufferMinutes;
  const fromBookings = bookings
    .filter((b) => b.dateKey === dateKey && b.roomId === roomId && isActiveBooking(b))
    .map((b) => ({
      interval: { start: b.startMinutes - buffer, end: b.endMinutes + buffer },
      kind: "booked" as const,
    }));
  const fromBlocks = blocks
    .filter((b) => b.dateKey === dateKey && b.roomId === roomId)
    .map((b) => ({
      interval: { start: b.startMinutes, end: b.endMinutes },
      kind: "blocked" as const,
    }));
  return [...fromBookings, ...fromBlocks];
}

export type SlotContext = {
  dateKey: DateKey;
  room: Pick<Room, "id">;
  pkg: Pick<Package, "id" | "durationMinutes">;
  bookings: Booking[];
  blocks: Block[];
  /** Real clock. Passed in so it can be frozen in tests and refreshed on focus. */
  now: Date;
};

/**
 * Builds the slot list for one room, one date and one package.
 *
 * The grid is opening hours divided by (duration + buffer), so changing the
 * package produces a different grid rather than a subset of the previous one.
 */
export function generateSlots({
  dateKey,
  room,
  pkg,
  bookings,
  blocks,
  now,
}: SlotContext): Slot[] {
  const hours = hoursFor(dateKey);
  if (!hours) return [];
  if (!isWithinBookingWindow(dateKey, now)) return [];

  const duration = pkg.durationMinutes;
  if (!Number.isFinite(duration) || duration <= 0) return [];

  const step = duration + BOOKING_RULES.bufferMinutes;
  const busy = busyIntervals(dateKey, room.id, bookings, blocks);
  const earliestStart = now.getTime() + BOOKING_RULES.minLeadTimeHours * 3_600_000;

  const slots: Slot[] = [];
  for (let start = hours.start; start + duration <= hours.end; start += step) {
    const candidate: Interval = { start, end: start + duration };
    const clash = busy.find((entry) => overlaps(candidate, entry.interval));
    const startsAt = dateAt(dateKey, start).getTime();

    let status: SlotStatus;
    if (startsAt <= now.getTime()) {
      status = "past";
    } else if (clash) {
      status = clash.kind;
    } else if (startsAt < earliestStart) {
      status = "too-soon";
    } else {
      status = "available";
    }

    slots.push({
      id: room.id + "__" + dateKey + "__" + formatClock(start),
      dateKey,
      roomId: room.id,
      packageId: pkg.id,
      startMinutes: start,
      endMinutes: candidate.end,
      label: formatRange(start, candidate.end),
      status,
      statusLabel: SLOT_STATUS_LABEL[status],
      selectable: status === "available",
    });
  }
  return slots;
}

/**
 * Server-side truth check for one requested slot. The form cannot talk its way
 * past this: it re-derives the grid and requires an exact, still-open match.
 */
export function validateSlot(
  context: SlotContext,
  startMinutes: number,
): { ok: boolean; reason?: string; slot?: Slot } {
  const slots = generateSlots(context);
  if (slots.length === 0) {
    return { ok: false, reason: "Tidak ada slot pada tanggal itu." };
  }
  const slot = slots.find((entry) => entry.startMinutes === startMinutes);
  if (!slot) {
    return {
      ok: false,
      reason: "Jam yang dipilih tidak ada di jadwal untuk paket dan ruangan ini.",
    };
  }
  if (!slot.selectable) {
    return { ok: false, reason: "Slot itu " + slot.statusLabel.toLowerCase() + ".", slot };
  }
  return { ok: true, slot };
}

export type DayStatus = "open" | "partial" | "full" | "closed" | "past" | "outside";

export const DAY_STATUS_LABEL: Record<DayStatus, string> = {
  open: "Kosong",
  partial: "Sebagian terisi",
  full: "Penuh",
  closed: "Tutup",
  past: "Sudah lewat",
  outside: "Di luar jangkauan",
};

export type DaySummary = {
  dateKey: DateKey;
  status: DayStatus;
  statusLabel: string;
  total: number;
  available: number;
  perRoom: { roomId: string; total: number; available: number }[];
};

/** Availability of one calendar day, summed across every room. */
export function summariseDay(
  dateKey: DateKey,
  rooms: Room[],
  pkg: Pick<Package, "id" | "durationMinutes">,
  bookings: Booking[],
  blocks: Block[],
  now: Date,
): DaySummary {
  const today = toDateKey(now);
  const delta = diffInDays(today, dateKey);
  const empty = { total: 0, available: 0, perRoom: [] as DaySummary["perRoom"] };

  if (delta < 0) {
    return { dateKey, status: "past", statusLabel: DAY_STATUS_LABEL.past, ...empty };
  }
  if (delta > BOOKING_RULES.maxAdvanceDays) {
    return { dateKey, status: "outside", statusLabel: DAY_STATUS_LABEL.outside, ...empty };
  }
  if (!hoursFor(dateKey)) {
    return { dateKey, status: "closed", statusLabel: DAY_STATUS_LABEL.closed, ...empty };
  }

  const perRoom = rooms.map((room) => {
    const slots = generateSlots({ dateKey, room, pkg, bookings, blocks, now });
    return {
      roomId: room.id,
      total: slots.length,
      available: slots.filter((slot) => slot.selectable).length,
    };
  });

  const total = perRoom.reduce((sum, entry) => sum + entry.total, 0);
  const available = perRoom.reduce((sum, entry) => sum + entry.available, 0);

  let status: DayStatus;
  if (total === 0) status = "closed";
  else if (available === 0) status = "full";
  else if (available < total) status = "partial";
  else status = "open";

  return {
    dateKey,
    status,
    statusLabel: DAY_STATUS_LABEL[status],
    total,
    available,
    perRoom,
  };
}

export { addDays };
