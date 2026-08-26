import { NextResponse } from "next/server";
import { bookingStore } from "@/lib/store";
import { coerceBookingInput, validateBooking } from "@/lib/validation";

/**
 * Server-side validation of a booking request.
 *
 * The browser's checks exist to give quick feedback. This is the copy that
 * decides. It runs the same validateBooking() the form runs, so the rules
 * cannot drift apart, against the server's own view of the schedule.
 *
 * Honest limitation while there is no database: the server store is empty, so
 * what this route can prove today is shape, package and room existence,
 * opening hours, grid alignment, the lead-time rule and the past-slot rule.
 * Clash detection against other people's bookings starts working the moment
 * src/lib/store/remote.ts is filled in, with no change to this file.
 */
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: { form: "Isi permintaan tidak terbaca." } },
      { status: 400 },
    );
  }

  const input = coerceBookingInput(body);
  const store = bookingStore();
  const snapshot = store.read();

  const result = validateBooking(input, {
    bookings: snapshot.bookings,
    blocks: snapshot.blocks,
    now: new Date(),
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, errors: result.errors }, { status: 422 });
  }

  return NextResponse.json({
    ok: true,
    value: result.value,
    storage: {
      mode: "local",
      note:
        "Pemesanan disimpan di peramban pengunjung. Server belum menyimpan apa pun " +
        "sampai src/lib/store/remote.ts disambungkan ke basis data.",
    },
  });
}

export function GET() {
  return NextResponse.json(
    { ok: false, errors: { form: "Gunakan metode POST." } },
    { status: 405 },
  );
}
