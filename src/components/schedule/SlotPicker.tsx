"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Slot, SlotStatus } from "@/lib/schedule";

/**
 * The slot picker.
 *
 * This is the control people actually use on this site, so it is fully operable
 * from the keyboard: arrow keys in both axes, Home and End, Enter or Space to
 * choose. Unavailable slots keep their place in the order and stay focusable,
 * marked aria-disabled, so a screen reader announces why they cannot be taken
 * instead of silently skipping them.
 *
 * Status is never carried by colour alone. Every slot prints its state in
 * words underneath the time.
 */
const STATUS_CLASS: Record<SlotStatus, string> = {
  available: "border-line-strong bg-paper hover:border-ink hover:bg-paper-2",
  booked: "border-line bg-paper-3 text-ink-2",
  blocked: "border-ink bg-ink text-on-ink",
  past: "border-dashed border-line-strong bg-paper text-ink-2",
  "too-soon": "border-line bg-paper-2 text-ink-2",
};

export function SlotPicker({
  slots,
  value,
  onChange,
  labelledBy,
  emptyMessage = "Tidak ada slot pada tanggal ini.",
  columns = "auto",
}: {
  slots: Slot[];
  value: number | null;
  onChange: (startMinutes: number) => void;
  labelledBy?: string;
  emptyMessage?: string;
  columns?: "auto" | "two";
}) {
  const container = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(() => {
    const selected = slots.findIndex((slot) => slot.startMinutes === value);
    if (selected >= 0) return selected;
    const firstOpen = slots.findIndex((slot) => slot.selectable);
    return firstOpen >= 0 ? firstOpen : 0;
  });

  /* The list is rebuilt whenever package, room or date changes. Keep the roving
     focus inside the new list rather than pointing past its end. */
  useEffect(() => {
    setFocusIndex((index) => {
      if (index < slots.length) return index;
      const firstOpen = slots.findIndex((slot) => slot.selectable);
      return firstOpen >= 0 ? firstOpen : 0;
    });
  }, [slots]);

  const focusAt = (index: number) => {
    const clamped = Math.max(0, Math.min(slots.length - 1, index));
    setFocusIndex(clamped);
    const node = container.current?.querySelector<HTMLButtonElement>(
      '[data-slot-index="' + clamped + '"]',
    );
    node?.focus();
  };

  const columnCount = () => {
    if (!container.current) return 1;
    const styles = window.getComputedStyle(container.current);
    return Math.max(1, styles.gridTemplateColumns.split(" ").filter(Boolean).length);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const columnsNow = columnCount();
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusAt(focusIndex + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusAt(focusIndex - 1);
        break;
      case "ArrowDown":
        event.preventDefault();
        focusAt(focusIndex + columnsNow);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusAt(focusIndex - columnsNow);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(slots.length - 1);
        break;
      default:
        break;
    }
  };

  if (slots.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-ink-2">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div
      ref={container}
      role="radiogroup"
      aria-labelledby={labelledBy}
      onKeyDown={onKeyDown}
      className={cn(
        "grid gap-2.5",
        columns === "two"
          ? "grid-cols-2"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
      )}
    >
      {slots.map((slot, index) => {
        const isSelected = slot.startMinutes === value;
        return (
          <button
            key={slot.id}
            type="button"
            role="radio"
            data-slot-index={index}
            data-slot-status={slot.status}
            data-slot-start={slot.startMinutes}
            aria-checked={isSelected}
            aria-disabled={!slot.selectable || undefined}
            tabIndex={index === focusIndex ? 0 : -1}
            onFocus={() => setFocusIndex(index)}
            onClick={() => {
              if (!slot.selectable) return;
              onChange(slot.startMinutes);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
                event.preventDefault();
                if (slot.selectable) onChange(slot.startMinutes);
              }
            }}
            className={cn(
              "flex min-h-[4.25rem] flex-col items-start justify-center gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors duration-200",
              isSelected
                ? "border-accent bg-accent text-on-accent"
                : STATUS_CLASS[slot.status],
              !slot.selectable && "cursor-not-allowed",
            )}
          >
            <span className="text-[0.9375rem] font-medium tabular-nums">{slot.label}</span>
            <span
              className={cn(
                "text-[0.75rem] leading-tight",
                isSelected ? "text-on-accent/85" : "opacity-80",
              )}
            >
              {isSelected ? "Dipilih" : slot.statusLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Shared legend so the words attached to each state are explained once. */
export function SlotLegend({ className }: { className?: string }) {
  const items: { status: SlotStatus | "selected"; label: string; note: string }[] = [
    { status: "available", label: "Tersedia", note: "bisa dipilih" },
    { status: "selected", label: "Dipilih", note: "pilihan Anda" },
    { status: "booked", label: "Terisi", note: "sudah dipesan" },
    { status: "blocked", label: "Diblokir", note: "ditutup studio" },
    { status: "past", label: "Lewat", note: "jam sudah berlalu" },
    { status: "too-soon", label: "Terlalu dekat", note: "kurang dari batas pemesanan" },
  ];
  return (
    <ul className={cn("flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] text-ink-2", className)}>
      {items.map((item) => (
        <li key={item.status} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn(
              "h-3 w-3 shrink-0 rounded-[4px] border",
              item.status === "selected"
                ? "border-accent bg-accent"
                : STATUS_CLASS[item.status as SlotStatus],
            )}
          />
          <span>
            <span className="text-ink">{item.label}</span> &mdash; {item.note}
          </span>
        </li>
      ))}
    </ul>
  );
}
