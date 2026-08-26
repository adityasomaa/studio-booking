/**
 * WhatsApp message composition.
 *
 * Every outbound WhatsApp action on this site goes through here, so the message
 * always carries the page it came from and the label of the button that was
 * pressed. There is no payment gateway: WhatsApp is where the conversation
 * continues.
 */
import { CONTACT } from "@/config/studio";
import { STUDIO_NAME } from "@/config/site";
import { getPackage } from "@/data/packages";
import { getRoom } from "@/data/rooms";
import { isSet } from "@/lib/unset";
import { formatClock, formatDateLong, formatDuration } from "@/lib/time";

/** Shown in place of the number until the studio confirms its business line. */
export const WHATSAPP_PLACEHOLDER = "[NOMOR-WHATSAPP-BELUM-DIISI]";

export function whatsappNumber(): string | null {
  return isSet(CONTACT.whatsappNumber) ? CONTACT.whatsappNumber : null;
}

export function hasWhatsappNumber(): boolean {
  return whatsappNumber() !== null;
}

export type WhatsappContext = {
  /** Label of the button that was pressed. */
  action: string;
  /** Absolute URL of the page the visitor was on. */
  sourceUrl: string;
  /** Extra lines, in order. Entries with an empty value are dropped. */
  details?: { label: string; value: string }[];
};

/** Builds the message body, one field per line. */
export function buildWhatsappMessage({ action, sourceUrl, details = [] }: WhatsappContext): string {
  const lines: string[] = [
    "Halo " + STUDIO_NAME + ", saya mau bertanya lewat website.",
    "",
    "Aksi: " + action,
  ];
  for (const detail of details) {
    if (detail.value && detail.value.trim() !== "") {
      lines.push(detail.label + ": " + detail.value.trim());
    }
  }
  lines.push("", "Halaman asal: " + sourceUrl);
  return lines.join("\n");
}

/**
 * Full wa.me URL. When the number is still unset the placeholder token is left
 * in the path so the composed message can still be reviewed and copied, and so
 * it is obvious that the link is not wired up yet.
 */
export function buildWhatsappUrl(context: WhatsappContext): string {
  const number = whatsappNumber() ?? WHATSAPP_PLACEHOLDER;
  return "https://wa.me/" + number + "?text=" + encodeURIComponent(buildWhatsappMessage(context));
}

export type BookingMessageInput = {
  name: string;
  whatsapp: string;
  packageId: string;
  roomId: string;
  dateKey: string;
  startMinutes: number;
  endMinutes: number;
  people: number;
  notes: string;
};

/** The detail lines for a completed booking form. */
export function bookingDetails(input: BookingMessageInput): { label: string; value: string }[] {
  const pkg = getPackage(input.packageId);
  const room = getRoom(input.roomId);
  return [
    { label: "Nama", value: input.name },
    { label: "Nomor WhatsApp", value: input.whatsapp ? "+" + input.whatsapp : "" },
    { label: "Paket", value: pkg ? pkg.name : input.packageId },
    {
      label: "Durasi",
      value: pkg ? formatDuration(pkg.durationMinutes) : "",
    },
    { label: "Ruangan", value: room ? room.name : input.roomId },
    { label: "Tanggal", value: formatDateLong(input.dateKey) },
    {
      label: "Slot",
      value: formatClock(input.startMinutes) + " sampai " + formatClock(input.endMinutes),
    },
    { label: "Jumlah orang", value: String(input.people) },
    { label: "Catatan", value: input.notes },
  ];
}
