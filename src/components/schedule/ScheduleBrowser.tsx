"use client";

import { useEffect, useState } from "react";
import { Listbox } from "@/components/form/Listbox";
import { isClockReady, useNow } from "@/components/primitives/hooks";
import { useBookingStore } from "@/components/providers/StoreProvider";
import { AvailabilityCalendar } from "@/components/schedule/AvailabilityCalendar";
import { DayDetailOverlay } from "@/components/schedule/DayDetailOverlay";
import { BOOKING_RULES } from "@/config/studio";
import { DEFAULT_PACKAGE_ID, PACKAGES, getPackage } from "@/data/packages";
import { ROOMS } from "@/data/rooms";
import type { DateKey } from "@/lib/time";
import { formatDuration } from "@/lib/time";

/**
 * Calendar plus day panel, shared by the home page and the schedule page.
 *
 * Changing the package changes the length of a session, which changes how many
 * slots fit into a day, which changes what the month looks like. That is why
 * the package selector sits above the calendar and not inside the day panel:
 * the whole month is recomputed, not filtered.
 */
export function ScheduleBrowser({ compact = false }: { compact?: boolean }) {
  const now = useNow();
  const clockReady = isClockReady(now);
  const store = useBookingStore();

  const [packageId, setPackageId] = useState(DEFAULT_PACKAGE_ID);
  const [openDay, setOpenDay] = useState<DateKey | null>(null);
  const pkg = getPackage(packageId) ?? PACKAGES[0];

  /* A day panel left open while the package changes would be showing a grid
     that no longer exists. Close it. */
  useEffect(() => {
    setOpenDay(null);
  }, [packageId]);

  if (!clockReady || !store.ready) {
    return (
      <div
        className="surface h-[26rem] animate-pulse bg-paper-3"
        aria-label="Memuat kalender ketersediaan"
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
        <Listbox
          label="Hitung ketersediaan untuk paket"
          value={packageId}
          onChange={setPackageId}
          options={PACKAGES.map((entry) => ({
            value: entry.id,
            label: entry.name,
            hint: formatDuration(entry.durationMinutes) + " per sesi",
          }))}
        />
        <div className="flex flex-col justify-end pb-1">
          <p className="text-[0.8125rem] leading-relaxed text-ink-2">
            {ROOMS.length} ruangan, sesi {formatDuration(pkg.durationMinutes)}, jeda{" "}
            {BOOKING_RULES.bufferMinutes} menit antar sesi.
          </p>
        </div>
      </div>

      <AvailabilityCalendar
        pkg={pkg}
        bookings={store.bookings}
        blocks={store.blocks}
        now={now}
        selectedDate={openDay}
        onSelectDate={setOpenDay}
      />

      {!compact && (
        <p className="text-sm text-ink-2">
          Pilih satu tanggal untuk melihat slot per ruangan. Slot yang sudah dipesan,
          diblokir studio, atau sudah lewat tidak bisa dipilih.
        </p>
      )}

      <DayDetailOverlay
        dateKey={openDay}
        pkg={pkg}
        bookings={store.bookings}
        blocks={store.blocks}
        now={now}
        onClose={() => setOpenDay(null)}
      />
    </div>
  );
}
