"use client";

import { useId, useMemo, useState } from "react";
import { Overlay, OverlayHeader } from "@/components/primitives/Overlay";
import { TransitionLink } from "@/components/primitives/TransitionLink";
import { SlotLegend, SlotPicker } from "@/components/schedule/SlotPicker";
import type { Package } from "@/data/packages";
import { ROOMS } from "@/data/rooms";
import { type Block, type Booking, generateSlots } from "@/lib/schedule";
import { type DateKey, formatDateLong, formatClock, formatDuration } from "@/lib/time";

/**
 * The panel behind a calendar day: what is open, room by room.
 *
 * It is an overlay rather than an inline panel so it works the same on a phone
 * and on a desktop, and it goes through the shared Overlay, which portals it to
 * the body, locks the page behind it and puts it on the agreed layer.
 */
export function DayDetailOverlay({
  dateKey,
  pkg,
  bookings,
  blocks,
  now,
  onClose,
}: {
  dateKey: DateKey | null;
  pkg: Package;
  bookings: Booking[];
  blocks: Block[];
  now: Date;
  onClose: () => void;
}) {
  const titleId = useId();
  const [picked, setPicked] = useState<{ roomId: string; startMinutes: number } | null>(null);

  const perRoom = useMemo(() => {
    if (!dateKey) return [];
    return ROOMS.map((room) => ({
      room,
      slots: generateSlots({ dateKey, room, pkg, bookings, blocks, now }),
    }));
  }, [dateKey, pkg, bookings, blocks, now]);

  const open = dateKey !== null;

  const bookingHref = (() => {
    if (!dateKey || !picked) return null;
    const params = new URLSearchParams({
      paket: pkg.id,
      ruangan: picked.roomId,
      tanggal: dateKey,
      mulai: String(picked.startMinutes),
    });
    return "/booking?" + params.toString();
  })();

  return (
    <Overlay
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      align="bottom"
      className="sm:max-w-3xl"
    >
      {dateKey && (
        <>
          <OverlayHeader
            id={titleId}
            title={formatDateLong(dateKey)}
            subtitle={
              "Paket " + pkg.name + " . " + formatDuration(pkg.durationMinutes) + " per sesi"
            }
            onClose={onClose}
          />

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
            {perRoom.every((entry) => entry.slots.length === 0) ? (
              <p className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-2">
                Studio tutup pada tanggal ini, jadi tidak ada slot yang bisa dipesan.
              </p>
            ) : (
              <div className="space-y-8">
                {perRoom.map(({ room, slots }) => {
                  const available = slots.filter((slot) => slot.selectable).length;
                  const headingId = titleId + "-" + room.id;
                  return (
                    <section key={room.id}>
                      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                        <h3 id={headingId} className="text-base font-medium">
                          {room.name}
                        </h3>
                        <p className="text-[0.8125rem] text-ink-2">
                          {available} dari {slots.length} slot tersedia
                        </p>
                      </div>
                      <SlotPicker
                        slots={slots}
                        labelledBy={headingId}
                        columns="two"
                        value={picked?.roomId === room.id ? picked.startMinutes : null}
                        onChange={(startMinutes) => setPicked({ roomId: room.id, startMinutes })}
                        emptyMessage="Tidak ada slot untuk ruangan ini."
                      />
                    </section>
                  );
                })}
              </div>
            )}

            <SlotLegend className="mt-8 border-t border-line pt-5" />
          </div>

          <div className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-ink-2">
              {picked
                ? "Dipilih: " +
                  (ROOMS.find((room) => room.id === picked.roomId)?.name ?? picked.roomId) +
                  ", " +
                  formatClock(picked.startMinutes)
                : "Pilih satu slot untuk melanjutkan."}
            </p>
            {bookingHref ? (
              <TransitionLink href={bookingHref} className="btn btn-primary" onNavigate={onClose}>
                Lanjut ke formulir
              </TransitionLink>
            ) : (
              <span className="btn btn-primary" aria-disabled="true">
                Lanjut ke formulir
              </span>
            )}
          </div>
        </>
      )}
    </Overlay>
  );
}
