/**
 * Demo seed.
 *
 * These rows exist so the schedule is not empty on a first visit and so the
 * conflict rules can be seen working. They are not real customers: the names
 * say so, and `seed: true` marks them in the admin list.
 *
 * The dates are computed from today, so the demo never rots into the past.
 */
import type { Block, Booking } from "@/lib/schedule";
import { addDays, parseClock, toDateKey } from "@/lib/time";

export function buildSeed(now: Date): { bookings: Booking[]; blocks: Block[] } {
  const today = toDateKey(now);
  const createdAt = now.getTime();

  const rows: Omit<Booking, "id" | "createdAt">[] = [
    {
      dateKey: addDays(today, 1),
      roomId: "ruang-1",
      packageId: "foto-keluarga",
      startMinutes: parseClock("11:00"),
      endMinutes: parseClock("12:00"),
      name: "Pemesan Contoh A",
      whatsapp: "",
      people: 5,
      notes: "Data contoh bawaan demo.",
      status: "confirmed",
      seed: true,
    },
    {
      dateKey: addDays(today, 1),
      roomId: "ruang-2",
      packageId: "foto-produk",
      startMinutes: parseClock("13:00"),
      endMinutes: parseClock("14:30"),
      name: "Pemesan Contoh B",
      whatsapp: "",
      people: 2,
      notes: "Data contoh bawaan demo.",
      status: "pending",
      seed: true,
    },
    {
      dateKey: addDays(today, 3),
      roomId: "ruang-1",
      packageId: "self-photo",
      startMinutes: parseClock("15:00"),
      endMinutes: parseClock("15:30"),
      name: "Pemesan Contoh C",
      whatsapp: "",
      people: 2,
      notes: "Data contoh bawaan demo.",
      status: "confirmed",
      seed: true,
    },
  ];

  return {
    bookings: rows.map((row, index) => ({
      ...row,
      id: "seed_" + (index + 1),
      createdAt,
    })),
    blocks: [],
  };
}
