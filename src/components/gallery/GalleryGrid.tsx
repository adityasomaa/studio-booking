"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";
import { Overlay } from "@/components/primitives/Overlay";
import { Reveal } from "@/components/SectionHeader";
import { GALLERY_CATEGORIES, GALLERY_ITEMS, type GalleryItem } from "@/data/gallery";
import { cn } from "@/lib/cn";

const RATIO_CLASS: Record<GalleryItem["ratio"], string> = {
  "3:4": "aspect-[3/4]",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
};

const RATIO_SIZE: Record<GalleryItem["ratio"], { width: number; height: number }> = {
  "3:4": { width: 900, height: 1200 },
  "4:3": { width: 1200, height: 900 },
  "1:1": { width: 1000, height: 1000 },
};

/**
 * The gallery.
 *
 * People choose a studio by looking at its work, so the shape of this page is
 * finished and waiting. What is in it is not: every tile is an empty slot drawn
 * from the placeholder generator, labelled as such. No photograph from another
 * studio appears here, and nothing is dressed up to look like a real session.
 */
export function GalleryGrid({
  limit,
  showFilter = true,
  className,
}: {
  limit?: number;
  showFilter?: boolean;
  className?: string;
}) {
  const [category, setCategory] = useState("semua");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const titleId = useId();

  const items = useMemo(() => {
    const filtered =
      category === "semua"
        ? GALLERY_ITEMS
        : GALLERY_ITEMS.filter((item) => item.category === category);
    return limit ? filtered.slice(0, limit) : filtered;
  }, [category, limit]);

  /* Filtering shortens the list; never leave the lightbox pointing past its end. */
  useEffect(() => {
    setOpenIndex((index) => (index !== null && index >= items.length ? null : index));
  }, [items.length]);

  const active = openIndex !== null ? items[openIndex] : null;

  const step = (delta: number) => {
    setOpenIndex((index) => {
      if (index === null) return index;
      return (index + delta + items.length) % items.length;
    });
  };

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex, items.length]);

  return (
    <div className={className}>
      {showFilter && (
        <div
          role="tablist"
          aria-label="Saring galeri berdasarkan jenis sesi"
          className="-mx-1 flex flex-wrap gap-2 px-1"
        >
          {GALLERY_CATEGORIES.map((entry) => {
            const selected = entry.id === category;
            return (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={selected}
                data-gallery-filter={entry.id}
                onClick={() => setCategory(entry.id)}
                className={cn(
                  "inline-flex h-10 items-center rounded-full border px-4 text-[0.9375rem] transition-colors duration-200",
                  selected
                    ? "border-ink bg-ink text-on-ink"
                    : "border-line-strong text-ink-2 hover:border-ink hover:text-ink",
                )}
              >
                {entry.label}
              </button>
            );
          })}
        </div>
      )}

      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3",
          showFilter && "mt-8",
        )}
      >
        {items.map((item, index) => (
          <Reveal key={item.id} delay={(index % 6) * 60}>
            <button
              type="button"
              data-gallery-item={item.id}
              onClick={() => setOpenIndex(index)}
              className="group block w-full overflow-hidden rounded-xl border border-line bg-paper-2 text-left transition-colors duration-300 hover:border-line-strong"
            >
              <span className={cn("relative block w-full", RATIO_CLASS[item.ratio])}>
                <Image
                  src={item.graphic}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  /* Every graphic here is a static SVG of about 1.5 KB served
                     without the image optimizer, so lazy loading saves nothing
                     and Chrome sometimes declines to load them at all inside
                     the reveal wrappers. Fetch them outright. */
                  loading="eager"
                  className="object-cover"
                />
              </span>
              <span className="flex items-center justify-between gap-2 px-3 py-2.5 text-[0.75rem] text-ink-2">
                <span>Slot kosong</span>
                <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Perbesar
                </span>
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      <Overlay
        open={active !== null}
        onClose={() => setOpenIndex(null)}
        labelledBy={titleId}
        className="max-w-4xl bg-paper"
      >
        {active && (
          <>
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
              <h2 id={titleId} className="text-sm font-medium">
                Contoh susunan galeri
                <span className="ml-2 font-normal text-ink-2">
                  {(openIndex ?? 0) + 1} dari {items.length}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setOpenIndex(null)}
                className="btn btn-ghost -mr-2"
                aria-label="Tutup"
              >
                <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none">
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-paper-2 p-4 sm:p-6">
              <Image
                src={active.graphic}
                alt={active.alt}
                width={RATIO_SIZE[active.ratio].width}
                height={RATIO_SIZE[active.ratio].height}
                sizes="(min-width: 768px) 60vw, 90vw"
                className="mx-auto h-auto w-full max-w-lg rounded-lg border border-line"
              />
              <p className="mx-auto mt-4 max-w-lg text-center text-sm text-ink-2">
                Ini bingkai kosong, bukan hasil sesi. Foto asli studio akan menggantikan
                gambar ini.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3.5">
              <button type="button" className="btn btn-secondary" onClick={() => step(-1)}>
                Sebelumnya
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => step(1)}>
                Berikutnya
              </button>
            </div>
          </>
        )}
      </Overlay>
    </div>
  );
}
