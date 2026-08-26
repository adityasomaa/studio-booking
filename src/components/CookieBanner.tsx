"use client";

import { useEffect, useState } from "react";
import { TransitionLink } from "@/components/primitives/TransitionLink";
import { useOverlayRegistry } from "@/components/providers/OverlayProvider";
import {
  CONSENT_DETAILS,
  type Consent,
  readConsent,
  writeConsent,
} from "@/lib/consent";
import { cn } from "@/lib/cn";

export const OPEN_COOKIE_SETTINGS_EVENT = "studio:open-cookie-settings";

/**
 * Cookie banner.
 *
 * The choice here changes what the site does. Refusing "Preferensi" means the
 * booking demo stops writing to localStorage and keeps its data in memory for
 * this tab only, which you can watch happen on the admin page.
 *
 * It sits on the cookie layer of the shared z-scale, but it is taken off screen
 * entirely while the mobile menu, the calendar panel or the lightbox is open,
 * so it never lands on top of them and never eats a tap meant for something
 * else. The wrapper does not take pointer events; only the card does.
 */
export function CookieBanner() {
  const [decided, setDecided] = useState<Consent | null | undefined>(undefined);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [draft, setDraft] = useState({ preferences: true, analytics: false });
  const { anyOpen } = useOverlayRegistry();

  useEffect(() => {
    setDecided(readConsent());
  }, []);

  useEffect(() => {
    const open = () => {
      const current = readConsent();
      setDraft({
        preferences: current?.preferences ?? true,
        analytics: current?.analytics ?? false,
      });
      setDetailsOpen(true);
      setDecided(null);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  if (decided === undefined || decided) return null;
  if (anyOpen) return null;

  const decide = (value: { preferences: boolean; analytics: boolean }) => {
    setDecided(writeConsent(value));
    setDetailsOpen(false);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 layer-cookie p-3 sm:p-5">
      <div
        role="dialog"
        aria-label="Pengaturan cookie"
        className="pointer-events-auto mx-auto w-full max-w-md rounded-2xl border border-line bg-paper p-5 shadow-[0_20px_60px_-30px_rgba(27,21,15,0.5)] sm:mx-0"
      >
        <h2 className="text-base font-medium">Cookie di situs ini</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          Situs ini memakai penyimpanan peramban untuk mengingat pilihan Anda dan untuk
          menjalankan demo pemesanan. Anda bisa memilih apa yang boleh disimpan.
        </p>

        {detailsOpen && (
          <ul className="mt-4 space-y-3 border-t border-line pt-4">
            {CONSENT_DETAILS.map((entry) => {
              const checked =
                entry.id === "necessary"
                  ? true
                  : entry.id === "preferences"
                    ? draft.preferences
                    : draft.analytics;
              return (
                <li key={entry.id} className="flex gap-3">
                  <input
                    id={"consent-" + entry.id}
                    type="checkbox"
                    checked={checked}
                    disabled={entry.locked}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [entry.id]: event.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--c-accent)]"
                  />
                  <label htmlFor={"consent-" + entry.id} className="min-w-0">
                    <span className="block text-sm font-medium">
                      {entry.label}
                      {entry.locked && (
                        <span className="ml-2 font-normal text-ink-2">selalu aktif</span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-ink-2">
                      {entry.description}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <div className={cn("mt-5 flex flex-wrap gap-2.5")}>
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={() => decide(detailsOpen ? draft : { preferences: true, analytics: true })}
          >
            {detailsOpen ? "Simpan pilihan" : "Terima semua"}
          </button>
          <button
            type="button"
            className="btn btn-secondary flex-1"
            onClick={() => decide({ preferences: false, analytics: false })}
          >
            Hanya yang diperlukan
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[0.8125rem] text-ink-2">
          <button
            type="button"
            className="underline underline-offset-2 hover:text-ink"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
          >
            {detailsOpen ? "Sembunyikan rincian" : "Atur sendiri"}
          </button>
          <TransitionLink href="/privacy" className="underline underline-offset-2 hover:text-ink">
            Kebijakan Privasi
          </TransitionLink>
        </div>
      </div>
    </div>
  );
}

/** Reopens the banner from anywhere, e.g. the footer. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
    >
      Pengaturan cookie
    </button>
  );
}
