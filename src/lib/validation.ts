/**
 * Booking form validation.
 *
 * This module is imported by the form and by the API route, so the browser and
 * the server apply exactly the same rules. The client copy exists to give fast
 * feedback; the server copy is the one that decides.
 */
import { BOOKING_RULES } from "@/config/studio";
import { PACKAGES, getPackage } from "@/data/packages";
import { ROOMS, getRoom } from "@/data/rooms";
import { type Block, type Booking, validateSlot } from "@/lib/schedule";
import { type DateKey, isValidDateKey } from "@/lib/time";

export type BookingInput = {
  name: string;
  whatsapp: string;
  packageId: string;
  roomId: string;
  dateKey: string;
  startMinutes: number | null;
  people: number | null;
  notes: string;
  /** Anti-spam trap. A real person leaves this empty. */
  company?: string;
};

export type FieldErrors = Partial<Record<keyof BookingInput | "form", string>>;

/** A booking input that has passed every check. No nulls left. */
export type ValidatedBooking = {
  name: string;
  whatsapp: string;
  packageId: string;
  roomId: string;
  dateKey: DateKey;
  startMinutes: number;
  people: number;
  notes: string;
};

export const EMPTY_BOOKING_INPUT: BookingInput = {
  name: "",
  whatsapp: "",
  packageId: "",
  roomId: "",
  dateKey: "",
  startMinutes: null,
  people: null,
  notes: "",
  company: "",
};

const NAME_MAX = 80;
const NOTES_MAX = 500;

/**
 * Accepts the shapes Indonesians actually type: 08xx, 8xx, +628xx, 628xx, with
 * spaces or dashes. Returns digits only in 62-prefixed international form.
 */
export function normaliseWhatsapp(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  let value = digits.startsWith("+") ? digits.slice(1) : digits;
  if (value.startsWith("0")) value = "62" + value.slice(1);
  else if (value.startsWith("8")) value = "62" + value;
  if (!/^62\d{8,13}$/.test(value)) return null;
  return value;
}

export function formatWhatsappForDisplay(normalised: string): string {
  return "+" + normalised;
}

/** Field-level checks that do not need the schedule. */
export function validateShape(input: BookingInput): FieldErrors {
  const errors: FieldErrors = {};

  const name = input.name.trim();
  if (name.length < 2) errors.name = "Isi nama minimal 2 huruf.";
  else if (name.length > NAME_MAX) errors.name = "Nama maksimal " + NAME_MAX + " huruf.";

  if (!input.whatsapp.trim()) errors.whatsapp = "Isi nomor WhatsApp.";
  else if (!normaliseWhatsapp(input.whatsapp))
    errors.whatsapp = "Nomor WhatsApp belum benar. Contoh format: 0812xxxxxxx.";

  const pkg = getPackage(input.packageId);
  if (!input.packageId) errors.packageId = "Pilih paket.";
  else if (!pkg) errors.packageId = "Paket itu tidak ada.";

  if (!input.roomId) errors.roomId = "Pilih ruangan.";
  else if (!getRoom(input.roomId)) errors.roomId = "Ruangan itu tidak ada.";

  if (!input.dateKey) errors.dateKey = "Pilih tanggal.";
  else if (!isValidDateKey(input.dateKey)) errors.dateKey = "Tanggal tidak terbaca.";

  if (input.startMinutes === null) errors.startMinutes = "Pilih slot waktu.";
  else if (!Number.isInteger(input.startMinutes) || input.startMinutes < 0 || input.startMinutes > 1439)
    errors.startMinutes = "Slot waktu tidak terbaca.";

  if (input.people === null) errors.people = "Isi jumlah orang.";
  else if (!Number.isInteger(input.people) || input.people < 1)
    errors.people = "Jumlah orang minimal 1.";
  else if (input.people > BOOKING_RULES.absoluteMaxPeople)
    errors.people = "Jumlah orang maksimal " + BOOKING_RULES.absoluteMaxPeople + ".";
  else if (pkg && input.people > pkg.maxPeople)
    errors.people =
      "Paket " + pkg.name + " menampung maksimal " + pkg.maxPeople + " orang.";

  if (input.notes.length > NOTES_MAX)
    errors.notes = "Catatan maksimal " + NOTES_MAX + " huruf.";

  return errors;
}

/**
 * Full validation: shape, then the schedule itself. `bookings` and `blocks` are
 * passed in so the same function serves the browser (local store) and the API
 * route (whatever store is wired in later).
 */
export function validateBooking(
  input: BookingInput,
  context: { bookings: Booking[]; blocks: Block[]; now: Date },
): { ok: boolean; errors: FieldErrors; value?: ValidatedBooking } {
  if (input.company && input.company.trim() !== "") {
    return { ok: false, errors: { form: "Pengiriman ditolak." } };
  }

  const errors = validateShape(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const pkg = getPackage(input.packageId)!;
  const room = getRoom(input.roomId)!;

  const check = validateSlot(
    {
      dateKey: input.dateKey,
      room,
      pkg,
      bookings: context.bookings,
      blocks: context.blocks,
      now: context.now,
    },
    input.startMinutes!,
  );

  if (!check.ok) {
    return { ok: false, errors: { startMinutes: check.reason ?? "Slot itu tidak bisa dipakai." } };
  }

  return {
    ok: true,
    errors: {},
    value: {
      name: input.name.trim(),
      whatsapp: normaliseWhatsapp(input.whatsapp)!,
      packageId: pkg.id,
      roomId: room.id,
      dateKey: input.dateKey,
      startMinutes: input.startMinutes!,
      people: input.people!,
      notes: input.notes.trim(),
    },
  };
}

/** Parses an untrusted JSON body into the input shape without throwing. */
export function coerceBookingInput(raw: unknown): BookingInput {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const str = (key: string) => (typeof source[key] === "string" ? (source[key] as string) : "");
  const num = (key: string) => {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)))
      return Number(value);
    return null;
  };
  return {
    name: str("name"),
    whatsapp: str("whatsapp"),
    packageId: str("packageId"),
    roomId: str("roomId"),
    dateKey: str("dateKey"),
    startMinutes: num("startMinutes"),
    people: num("people"),
    notes: str("notes"),
    company: str("company"),
  };
}

export const KNOWN_PACKAGE_IDS = PACKAGES.map((p) => p.id);
export const KNOWN_ROOM_IDS = ROOMS.map((r) => r.id);
