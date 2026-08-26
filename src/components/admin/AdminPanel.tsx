"use client";

import { useMemo, useState } from "react";
import { Listbox } from "@/components/form/Listbox";
import { isClockReady, useNow } from "@/components/primitives/hooks";
import { useBookingStore } from "@/components/providers/StoreProvider";
import { getPackage } from "@/data/packages";
import { DEFAULT_ROOM_ID, ROOMS, getRoom } from "@/data/rooms";
import { cn } from "@/lib/cn";
import { type BookingStatus, hoursFor } from "@/lib/schedule";
import {
  addDays,
  formatClock,
  formatDateLong,
  formatRange,
  toDateKey,
} from "@/lib/time";

/**
 * Admin, demo grade.
 *
 * This is deliberately plain: no login, no roles, no audit trail. It exists so
 * the studio can see the two things it will need on day one, a list of what is
 * booked and a way to close off time it wants for itself, and so the conflict
 * rules can be proved from the other side of the counter.
 *
 * Blocking is here because studios really do use their own room at short
 * notice, or shut without warning. A block removes those slots from the public
 * schedule immediately.
 */
const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Menunggu konfirmasi",
  confirmed: "Dikonfirmasi",
  cancelled: "Dibatalkan",
};

const STATUS_CLASS: Record<BookingStatus, string> = {
  pending: "border-line-strong bg-paper-2 text-ink",
  confirmed: "border-ink bg-ink text-on-ink",
  cancelled: "border-dashed border-line-strong bg-paper text-ink-2 line-through",
};

const DURATION_OPTIONS = [30, 60, 90, 120, 180, 240];

export function AdminPanel() {
  const now = useNow();
  const clockReady = isClockReady(now);
  const store = useBookingStore();

  const [dateKey, setDateKey] = useState<string>("");
  const activeDate = dateKey || (clockReady ? toDateKey(now) : "");

  const [blockRoom, setBlockRoom] = useState(DEFAULT_ROOM_ID);
  const [blockStart, setBlockStart] = useState("");
  const [blockDuration, setBlockDuration] = useState("60");
  const [blockReason, setBlockReason] = useState("");
  const [blockError, setBlockError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const hours = activeDate ? hoursFor(activeDate) : null;

  const startOptions = useMemo(() => {
    if (!hours) return [];
    const options: { value: string; label: string }[] = [];
    for (let minute = hours.start; minute < hours.end; minute += 15) {
      options.push({ value: String(minute), label: formatClock(minute) });
    }
    return options;
  }, [hours]);

  const dayBookings = useMemo(
    () =>
      store.bookings
        .filter((booking) => booking.dateKey === activeDate)
        .sort((a, b) => a.startMinutes - b.startMinutes),
    [store.bookings, activeDate],
  );

  const dayBlocks = useMemo(
    () =>
      store.blocks
        .filter((block) => block.dateKey === activeDate)
        .sort((a, b) => a.startMinutes - b.startMinutes),
    [store.blocks, activeDate],
  );

  const upcomingCount = useMemo(() => {
    if (!clockReady) return 0;
    const today = toDateKey(now);
    return store.bookings.filter(
      (booking) => booking.dateKey >= today && booking.status !== "cancelled",
    ).length;
  }, [store.bookings, now, clockReady]);

  const addBlock = async () => {
    setBlockError(null);
    if (!activeDate) return;
    if (!blockStart) {
      setBlockError("Pilih jam mulai.");
      return;
    }
    const start = Number(blockStart);
    const end = start + Number(blockDuration);
    if (hours && end > hours.end) {
      setBlockError(
        "Blokir melewati jam tutup (" + formatClock(hours.end) + "). Perpendek durasinya.",
      );
      return;
    }
    await store.createBlock({
      dateKey: activeDate,
      roomId: blockRoom,
      startMinutes: start,
      endMinutes: end,
      reason: blockReason.trim() || "Dipakai studio",
    });
    setBlockStart("");
    setBlockReason("");
  };

  if (!clockReady || !store.ready) {
    return (
      <div className="surface h-72 animate-pulse bg-paper-3" aria-label="Memuat data" />
    );
  }

  return (
    <div className="space-y-10">
      <section className="surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-medium">Status penyimpanan</h2>
            <p className="mt-1.5 text-sm text-ink-2">
              {store.storeName}
              {store.isPersistent
                ? ". Data bertahan setelah halaman dimuat ulang."
                : ". Data hanya bertahan selama tab ini terbuka, karena kategori cookie Preferensi belum diizinkan."}
            </p>
            <p className="mt-1 text-sm text-ink-2">
              {upcomingCount} pemesanan aktif mulai hari ini.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {confirmReset ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  data-reset-confirm="true"
                  onClick={async () => {
                    await store.resetDemo();
                    setConfirmReset(false);
                  }}
                >
                  Ya, kembalikan
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setConfirmReset(false)}
                >
                  Batal
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                data-reset-demo="true"
                onClick={() => setConfirmReset(true)}
              >
                Reset demo
              </button>
            )}
          </div>
        </div>
        {confirmReset && (
          <p className="note mt-4">
            Semua pemesanan dan blokir yang dibuat selama demo akan dihapus, lalu data
            contoh bawaan dipasang kembali.
          </p>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium">{formatDateLong(activeDate)}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary h-10 w-10 min-h-0 !p-0"
              aria-label="Hari sebelumnya"
              onClick={() => setDateKey(addDays(activeDate, -1))}
            >
              <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDateKey(toDateKey(now))}
            >
              Hari ini
            </button>
            <button
              type="button"
              className="btn btn-secondary h-10 w-10 min-h-0 !p-0"
              aria-label="Hari berikutnya"
              onClick={() => setDateKey(addDays(activeDate, 1))}
            >
              <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <p className="mt-2 text-sm text-ink-2">
          {hours
            ? "Jam operasional " + formatClock(hours.start) + " sampai " + formatClock(hours.end)
            : "Studio tutup pada hari ini."}
        </p>

        <div className="mt-6 space-y-8">
          {ROOMS.map((room) => {
            const bookings = dayBookings.filter((booking) => booking.roomId === room.id);
            const blocks = dayBlocks.filter((block) => block.roomId === room.id);
            return (
              <div key={room.id}>
                <h3 className="text-base font-medium">{room.name}</h3>
                {bookings.length === 0 && blocks.length === 0 ? (
                  <p className="mt-3 rounded-xl border border-dashed border-line-strong px-4 py-6 text-sm text-ink-2">
                    Belum ada pemesanan atau blokir di ruangan ini pada tanggal tersebut.
                  </p>
                ) : (
                  <ul className="mt-3 stack-lines rounded-xl border border-line">
                    {bookings.map((booking) => (
                      <li
                        key={booking.id}
                        data-booking-id={booking.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-medium tabular-nums">
                            {formatRange(booking.startMinutes, booking.endMinutes)}
                            <span className="ml-3 font-normal text-ink-2">
                              {getPackage(booking.packageId)?.name ?? booking.packageId}
                            </span>
                          </p>
                          <p className="mt-1 truncate text-sm text-ink-2">
                            {booking.name}
                            {booking.seed && " (data contoh)"} . {booking.people} orang
                            {booking.whatsapp ? " . +" + booking.whatsapp : ""}
                          </p>
                          {booking.notes && (
                            <p className="mt-1 text-sm text-ink-2">{booking.notes}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full border px-3 py-1 text-[0.75rem]",
                              STATUS_CLASS[booking.status],
                            )}
                          >
                            {STATUS_LABEL[booking.status]}
                          </span>
                          {(["pending", "confirmed", "cancelled"] as BookingStatus[])
                            .filter((status) => status !== booking.status)
                            .map((status) => (
                              <button
                                key={status}
                                type="button"
                                className="btn btn-ghost h-9 min-h-0 text-[0.8125rem]"
                                onClick={() => store.setBookingStatus(booking.id, status)}
                              >
                                {STATUS_LABEL[status]}
                              </button>
                            ))}
                        </div>
                      </li>
                    ))}
                    {blocks.map((block) => (
                      <li
                        key={block.id}
                        data-block-id={block.id}
                        className="flex flex-col gap-3 bg-paper-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-medium tabular-nums">
                            {formatRange(block.startMinutes, block.endMinutes)}
                            <span className="ml-3 font-normal text-ink-2">Diblokir</span>
                          </p>
                          <p className="mt-1 truncate text-sm text-ink-2">{block.reason}</p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary h-9 min-h-0 shrink-0 text-[0.8125rem]"
                          onClick={() => store.removeBlock(block.id)}
                        >
                          Buka blokir
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="surface p-5 sm:p-6">
        <h2 className="text-base font-medium">Blokir slot secara manual</h2>
        <p className="mt-1.5 max-w-prose text-sm text-ink-2">
          Untuk sesi internal, perawatan alat, atau tutup mendadak. Slot yang tercakup
          langsung hilang dari sisi pemesan.
        </p>

        {!hours ? (
          <p className="note mt-5">
            Studio tutup pada {formatDateLong(activeDate)}, jadi tidak ada yang perlu
            diblokir.
          </p>
        ) : (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Listbox
                label="Ruangan"
                value={blockRoom}
                onChange={setBlockRoom}
                options={ROOMS.map((room) => ({ value: room.id, label: room.name }))}
              />
              <Listbox
                label="Mulai"
                value={blockStart}
                onChange={setBlockStart}
                placeholder="Pilih jam"
                options={startOptions}
              />
              <Listbox
                label="Durasi"
                value={blockDuration}
                onChange={setBlockDuration}
                options={DURATION_OPTIONS.map((minutes) => ({
                  value: String(minutes),
                  label: minutes < 60 ? minutes + " menit" : minutes / 60 + " jam",
                }))}
              />
              <div>
                <label className="field-label" htmlFor="block-reason">
                  Alasan
                </label>
                <input
                  id="block-reason"
                  className="input"
                  value={blockReason}
                  onChange={(event) => setBlockReason(event.target.value)}
                  placeholder="Dipakai studio"
                />
              </div>
            </div>

            {blockError && <p className="field-error mt-3">{blockError}</p>}

            <button
              type="button"
              className="btn btn-primary mt-5"
              data-add-block="true"
              onClick={addBlock}
            >
              Blokir slot ini
            </button>
          </>
        )}
      </section>

      <p className="text-sm text-ink-2">
        Ruangan terdaftar:{" "}
        {ROOMS.map((room) => getRoom(room.id)?.name).filter(Boolean).join(", ")}. Daftar
        ini diambil dari src/data/rooms.ts dan masih contoh.
      </p>
    </div>
  );
}
