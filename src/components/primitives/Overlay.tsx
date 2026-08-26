"use client";

import { useEffect, useRef } from "react";
import { Portal } from "@/components/primitives/Portal";
import {
  useBodyScrollLock,
  useEscape,
  useFocusTrap,
} from "@/components/primitives/hooks";
import { useOverlayRegistry } from "@/components/providers/OverlayProvider";
import { cn } from "@/lib/cn";

/**
 * The one overlay used by the calendar day panel, the gallery lightbox and the
 * WhatsApp message preview.
 *
 * All of them are portalled to <body> so no parent's clipped overflow can crop
 * them and no parent's stacking context can bury them, all of them lock body
 * scroll while open and hand it back on close, and all of them sit on the
 * shared layer scale rather than on an invented z-index.
 */
export function Overlay({
  open,
  onClose,
  labelledBy,
  children,
  align = "center",
  className,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
  align?: "center" | "bottom";
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const { register } = useOverlayRegistry();

  useBodyScrollLock(open);
  useEscape(open, onClose);
  useFocusTrap(open, panel);

  useEffect(() => {
    if (!open) return;
    return register();
  }, [open, register]);

  if (!open) return null;

  return (
    <Portal>
      <div
        className={cn(
          "fixed inset-0 layer-overlay flex justify-center overscroll-contain",
          align === "center" ? "items-center p-4 sm:p-6" : "items-end p-0 sm:items-center sm:p-6",
        )}
      >
        <button
          type="button"
          aria-label="Tutup"
          onClick={onClose}
          className="absolute inset-0 h-full w-full cursor-default bg-ink/45 backdrop-blur-[2px]"
        />
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          tabIndex={-1}
          className={cn(
            "relative flex max-h-[calc(100svh-2rem)] w-full flex-col overflow-hidden bg-paper shadow-[0_24px_80px_-32px_rgba(27,21,15,0.45)]",
            align === "center"
              ? "max-w-2xl rounded-2xl"
              : "max-h-[88svh] rounded-t-2xl sm:max-w-2xl sm:rounded-2xl",
            className,
          )}
        >
          {children}
        </div>
      </div>
    </Portal>
  );
}

/** Standard dialog header with a title and a close control. */
export function OverlayHeader({
  id,
  title,
  subtitle,
  onClose,
}: {
  id: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-medium leading-tight">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="btn btn-ghost -mr-2 shrink-0"
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
  );
}
