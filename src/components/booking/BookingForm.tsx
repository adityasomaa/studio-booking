"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Listbox } from "@/components/form/Listbox";
import { Overlay, OverlayHeader } from "@/components/primitives/Overlay";
import { isClockReady, useNow } from "@/components/primitives/hooks";
import { useBookingStore } from "@/components/providers/StoreProvider";
import { AvailabilityCalendar } from "@/components/schedule/AvailabilityCalendar";
import { SlotLegend, SlotPicker } from "@/components/schedule/SlotPicker";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { BOOKING_RULES } from "@/config/studio";
import { DEFAULT_PACKAGE_ID, PACKAGES, getPackage } from "@/data/packages";
import { DEFAULT_ROOM_ID, ROOMS, getRoom } from "@/data/rooms";
import { cn } from "@/lib/cn";
import { requestPayment } from "@/lib/payment/adapter";
import { generateSlots } from "@/lib/schedule";
import { formatClock, formatDateLong, formatDuration, isValidDateKey, toDateKey } from "@/lib/time";
import {
  type BookingInput,
  type FieldErrors,
  normaliseWhatsapp,
  validateBooking,
} from "@/lib/validation";
import { bookingDetails } from "@/lib/whatsapp";

type Submitted = {
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

/**
 * The booking form.
 *
 * Package, room, date and slot arrive prefilled when the visitor came from the
 * calendar or from a package card. Changing the package rebuilds the slot list
 * from scratch, because a different duration means a different grid, and any
 * previously chosen time that is not on the new grid is dropped rather than
 * carried over.
 *
 * Nothing is trusted from the browser alone: the same validateBooking() runs
 * here for immediate feedback and again in /api/booking before the booking is
 * accepted.
 */
export function BookingForm() {
  const params = useSearchParams();
  const now = useNow();
  const clockReady = isClockReady(now);
  const store = useBookingStore();

  const formId = useId();
  const slotsHeadingId = formId + "-slots";

  const [values, setValues] = useState<BookingInput>(() => ({
    name: "",
    whatsapp: "",
    packageId: DEFAULT_PACKAGE_ID,
    roomId: DEFAULT_ROOM_ID,
    dateKey: "",
    startMinutes: null,
    people: null,
    notes: "",
    company: "",
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [paymentNote, setPaymentNote] = useState<string | null>(null);
  const prefilled = useRef(false);
  const errorSummary = useRef<HTMLDivElement>(null);

  /* Prefill from the calendar or a package card, once. */
  useEffect(() => {
    if (prefilled.current) return;
    prefilled.current = true;
    const packageId = params.get("paket");
    const roomId = params.get("ruangan");
    const dateKey = params.get("tanggal");
    const start = params.get("mulai");
    setValues((current) => ({
      ...current,
      packageId: packageId && getPackage(packageId) ? packageId : current.packageId,
      roomId: roomId && getRoom(roomId) ? roomId : current.roomId,
      dateKey: dateKey && isValidDateKey(dateKey) ? dateKey : current.dateKey,
      startMinutes:
        start !== null && Number.isInteger(Number(start)) ? Number(start) : current.startMinutes,
    }));
  }, [params]);

  const pkg = getPackage(values.packageId) ?? PACKAGES[0];
  const room = getRoom(values.roomId) ?? ROOMS[0];

  /* The slot grid. Rebuilt whenever package, room, date, the schedule or the
     clock changes; never filtered down from a previous list. */
  const slots = useMemo(() => {
    if (!clockReady || !values.dateKey || !isValidDateKey(values.dateKey)) return [];
    return generateSlots({
      dateKey: values.dateKey,
      room,
      pkg,
      bookings: store.bookings,
      blocks: store.blocks,
      now,
    });
  }, [clockReady, values.dateKey, room, pkg, store.bookings, store.blocks, now]);

  /* Drop a chosen time that the new grid no longer offers. */
  useEffect(() => {
    setValues((current) => {
      if (current.startMinutes === null) return current;
      const stillThere = slots.some(
        (slot) => slot.startMinutes === current.startMinutes && slot.selectable,
      );
      return stillThere ? current : { ...current, startMinutes: null };
    });
  }, [slots]);

  const set = <K extends keyof BookingInput>(key: K, value: BookingInput[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const local = validateBooking(values, {
      bookings: store.bookings,
      blocks: store.blocks,
      now: new Date(),
    });
    if (!local.ok) {
      setErrors(local.errors);
      errorSummary.current?.focus();
      return;
    }

    setBusy(true);
    setErrors({});
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local.value),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        errors?: FieldErrors;
      };

      if (!payload.ok) {
        setErrors(payload.errors ?? { form: "Pemesanan ditolak server." });
        errorSummary.current?.focus();
        return;
      }

      const value = local.value!;
      const endMinutes = value.startMinutes + pkg.durationMinutes;

      await store.createBooking({
        dateKey: value.dateKey,
        roomId: value.roomId,
        packageId: value.packageId,
        startMinutes: value.startMinutes,
        endMinutes,
        name: value.name,
        whatsapp: value.whatsapp,
        people: value.people,
        notes: value.notes,
        status: "pending",
      });

      /* The empty payment seam. It returns "not-configured" today and the flow
         carries on to WhatsApp, which is where a deposit would be arranged. */
      const payment = await requestPayment({
        bookingId: value.dateKey + "-" + value.startMinutes,
        amount: null,
        currency: "IDR",
        description: pkg.name,
      });
      setPaymentNote(
        payment.status === "not-configured"
          ? "Tidak ada pembayaran online. Uang muka, jika ada, diatur lewat WhatsApp."
          : null,
      );

      setSubmitted({
        name: value.name,
        whatsapp: value.whatsapp,
        packageId: value.packageId,
        roomId: value.roomId,
        dateKey: value.dateKey,
        startMinutes: value.startMinutes,
        endMinutes,
        people: value.people,
        notes: value.notes,
      });
    } catch {
      setErrors({ form: "Gagal menghubungi server. Coba lagi." });
      errorSummary.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    const details = bookingDetails(submitted);
    return (
      <div className="surface p-6 sm:p-8" data-booking-success="true">
        <p className="type-eyebrow">Langkah terakhir</p>
        <h2 className="type-subhead mt-3">Slot sudah ditahan di jadwal.</h2>
        <p className="type-body mt-4">
          Kirim rinciannya lewat WhatsApp supaya studio bisa memastikan sesi Anda.
          Pemesanan belum final sebelum studio membalas.
        </p>

        <dl className="mt-6 divide-y divide-line border-y border-line">
          {details
            .filter((detail) => detail.value)
            .map((detail) => (
              <div key={detail.label} className="flex justify-between gap-6 py-2.5 text-sm">
                <dt className="text-ink-2">{detail.label}</dt>
                <dd className="text-right">{detail.value}</dd>
              </div>
            ))}
        </dl>

        {paymentNote && <p className="note mt-5">{paymentNote}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppLink label="Kirim rincian booking" details={details} />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSubmitted(null);
              setValues((current) => ({ ...current, startMinutes: null, notes: "" }));
            }}
          >
            Pesan sesi lain
          </button>
        </div>
      </div>
    );
  }

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
      {/* Trap for automated submissions. Positioned off sight with clip, which
          needs no positioned ancestor and cannot drag the page sideways. */}
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor={formId + "-company"}>Perusahaan</label>
        <input
          id={formId + "-company"}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.company}
          onChange={(event) => set("company", event.target.value)}
        />
      </div>

      <div className="space-y-6">
        <div
          ref={errorSummary}
          tabIndex={-1}
          role={hasErrors ? "alert" : undefined}
          className={cn(!hasErrors && "hidden")}
        >
          {errors.form && <p className="note">{errors.form}</p>}
        </div>

        <div>
          <label className="field-label" htmlFor={formId + "-name"}>
            Nama <span className="text-accent">*</span>
          </label>
          <input
            id={formId + "-name"}
            className="input"
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? formId + "-name-error" : undefined}
            placeholder="Nama yang dipakai saat sesi"
          />
          {errors.name && (
            <p className="field-error" id={formId + "-name-error"}>
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor={formId + "-wa"}>
            Nomor WhatsApp <span className="text-accent">*</span>
          </label>
          <input
            id={formId + "-wa"}
            className="input"
            inputMode="tel"
            value={values.whatsapp}
            onChange={(event) => set("whatsapp", event.target.value)}
            autoComplete="tel"
            aria-invalid={errors.whatsapp ? true : undefined}
            aria-describedby={
              errors.whatsapp ? formId + "-wa-error" : formId + "-wa-hint"
            }
            placeholder="0812..."
          />
          {errors.whatsapp ? (
            <p className="field-error" id={formId + "-wa-error"}>
              {errors.whatsapp}
            </p>
          ) : (
            <p className="field-hint" id={formId + "-wa-hint"}>
              {values.whatsapp && normaliseWhatsapp(values.whatsapp)
                ? "Terbaca sebagai +" + normaliseWhatsapp(values.whatsapp)
                : "Boleh ditulis 0812..., 62812... atau +62812..."}
            </p>
          )}
        </div>

        <Listbox
          label="Paket"
          required
          value={values.packageId}
          onChange={(value) => set("packageId", value)}
          error={errors.packageId}
          hint={"Durasi " + formatDuration(pkg.durationMinutes) + ", maksimal " + pkg.maxPeople + " orang. Angka ini masih contoh."}
          options={PACKAGES.map((entry) => ({
            value: entry.id,
            label: entry.name,
            hint: formatDuration(entry.durationMinutes) + " . maks " + entry.maxPeople + " orang",
          }))}
        />

        <Listbox
          label="Ruangan"
          required
          value={values.roomId}
          onChange={(value) => set("roomId", value)}
          error={errors.roomId}
          hint={ROOMS.length === 1 ? "Studio ini punya satu ruangan." : undefined}
          options={ROOMS.map((entry) => ({ value: entry.id, label: entry.name }))}
        />

        <div>
          <label className="field-label" htmlFor={formId + "-people"}>
            Jumlah orang <span className="text-accent">*</span>
          </label>
          <input
            id={formId + "-people"}
            className="input"
            type="number"
            min={1}
            max={Math.min(pkg.maxPeople, BOOKING_RULES.absoluteMaxPeople)}
            inputMode="numeric"
            value={values.people ?? ""}
            onChange={(event) =>
              set("people", event.target.value === "" ? null : Number(event.target.value))
            }
            aria-invalid={errors.people ? true : undefined}
            aria-describedby={errors.people ? formId + "-people-error" : undefined}
          />
          {errors.people && (
            <p className="field-error" id={formId + "-people-error"}>
              {errors.people}
            </p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor={formId + "-notes"}>
            Catatan
          </label>
          <textarea
            id={formId + "-notes"}
            className="input min-h-28 resize-y"
            value={values.notes}
            onChange={(event) => set("notes", event.target.value)}
            aria-invalid={errors.notes ? true : undefined}
            placeholder="Misalnya kebutuhan latar, properti, atau jumlah anak yang ikut."
          />
          {errors.notes && <p className="field-error">{errors.notes}</p>}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <span className="field-label">
            Tanggal <span className="text-accent">*</span>
          </span>
          <button
            type="button"
            className="input flex w-full items-center justify-between gap-3 text-left"
            onClick={() => setCalendarOpen(true)}
            aria-invalid={errors.dateKey ? true : undefined}
            data-open-calendar="true"
          >
            <span className={cn(!values.dateKey && "text-ink-2")}>
              {values.dateKey && isValidDateKey(values.dateKey)
                ? formatDateLong(values.dateKey)
                : "Pilih tanggal dari kalender"}
            </span>
            <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true" fill="none">
              <rect
                x="2.5"
                y="3.5"
                width="13"
                height="12"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M2.5 7.5h13M6 2v3M12 2v3"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {errors.dateKey ? (
            <p className="field-error">{errors.dateKey}</p>
          ) : (
            <p className="field-hint">
              Bisa dipesan sampai {BOOKING_RULES.maxAdvanceDays} hari ke depan, paling
              cepat {BOOKING_RULES.minLeadTimeHours} jam dari sekarang.
            </p>
          )}
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <span className="field-label mb-0" id={slotsHeadingId}>
              Slot waktu <span className="text-accent">*</span>
            </span>
            <span className="text-[0.8125rem] text-ink-2">
              {room.name} . {formatDuration(pkg.durationMinutes)}
            </span>
          </div>

          {!values.dateKey ? (
            <p className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-2">
              Pilih tanggal dulu untuk melihat slot yang tersedia.
            </p>
          ) : !clockReady || !store.ready ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[4.25rem] rounded-xl bg-paper-3" />
              ))}
            </div>
          ) : (
            <SlotPicker
              slots={slots}
              labelledBy={slotsHeadingId}
              value={values.startMinutes}
              onChange={(startMinutes) => set("startMinutes", startMinutes)}
              emptyMessage="Studio tutup atau tidak ada slot yang muat untuk paket ini pada tanggal tersebut."
            />
          )}
          {errors.startMinutes && <p className="field-error">{errors.startMinutes}</p>}
          <SlotLegend className="mt-4" />
        </div>

        <div className="surface p-5">
          <h3 className="text-sm font-medium">Ringkasan</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Paket" value={pkg.name} />
            <Row label="Ruangan" value={room.name} />
            <Row
              label="Tanggal"
              value={
                values.dateKey && isValidDateKey(values.dateKey)
                  ? formatDateLong(values.dateKey)
                  : "Belum dipilih"
              }
            />
            <Row
              label="Slot"
              value={
                values.startMinutes !== null
                  ? formatClock(values.startMinutes) +
                    " sampai " +
                    formatClock(values.startMinutes + pkg.durationMinutes)
                  : "Belum dipilih"
              }
            />
            <Row label="Jumlah orang" value={values.people ? String(values.people) : "Belum diisi"} />
          </dl>
          <p className="mt-4 text-[0.8125rem] leading-relaxed text-ink-2">
            Harga belum ditetapkan di situs ini, jadi tidak ada nominal yang ditampilkan.
            Studio akan mengonfirmasi biaya lewat WhatsApp.
          </p>
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Memeriksa slot..." : "Kirim permintaan booking"}
        </button>
      </div>

      <Overlay
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        labelledBy={formId + "-calendar-title"}
        align="bottom"
        className="sm:max-w-2xl"
      >
        <OverlayHeader
          id={formId + "-calendar-title"}
          title="Pilih tanggal"
          subtitle={"Ketersediaan dihitung untuk paket " + pkg.name}
          onClose={() => setCalendarOpen(false)}
        />
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {clockReady && (
            <AvailabilityCalendar
              pkg={pkg}
              bookings={store.bookings}
              blocks={store.blocks}
              now={now}
              selectedDate={values.dateKey || null}
              onSelectDate={(dateKey) => {
                set("dateKey", dateKey);
                set("startMinutes", null);
                setCalendarOpen(false);
              }}
              className="border-0 bg-transparent"
            />
          )}
        </div>
      </Overlay>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-2">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

/** Exposed for the schedule page, which needs today's key on the client. */
export function todayKey(now: Date): string {
  return toDateKey(now);
}
