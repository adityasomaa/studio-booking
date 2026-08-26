"use client";

import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { Overlay, OverlayHeader } from "@/components/primitives/Overlay";
import { SITE_URL } from "@/config/site";
import { cn } from "@/lib/cn";
import {
  buildWhatsappMessage,
  buildWhatsappUrl,
  hasWhatsappNumber,
} from "@/lib/whatsapp";

/**
 * The only way this site opens WhatsApp.
 *
 * Every button routes through here, so the message always carries the label of
 * the button that was pressed and the address of the page it was pressed on,
 * without each call site having to remember.
 *
 * The studio's business number has not been given to us yet. Until it is,
 * pressing the button opens the composed message so it can be read and copied,
 * and says plainly that the number is missing. Inventing a number, or lifting
 * one off a third-party directory, would send real people to a stranger.
 */
export type WhatsAppLinkProps = {
  /** Button label. Also becomes the "Aksi" line in the message. */
  label: string;
  /** Extra lines for the message body. */
  details?: { label: string; value: string }[];
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  children?: React.ReactNode;
};

function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="currentColor">
      <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.16-1.35a9.9 9.9 0 0 0 4.88 1.27h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2Zm0 18.17h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.1.81.83-3.02-.2-.31a8.16 8.16 0 0 1-1.26-4.36c0-4.55 3.7-8.25 8.26-8.25 2.2 0 4.28.86 5.84 2.42a8.2 8.2 0 0 1 2.42 5.84c0 4.56-3.71 8.2-8.3 8.2Zm4.53-6.15c-.25-.13-1.47-.72-1.7-.8-.22-.09-.39-.13-.55.12-.16.25-.63.8-.77.96-.14.16-.28.19-.53.06-.25-.12-1.05-.38-2-1.24-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.41.09-.17.04-.31-.02-.44-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.43h-.47c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.17 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.19 1.1.16 1.52.1.46-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.15-1.18-.06-.11-.23-.17-.48-.29Z" />
    </svg>
  );
}

export function WhatsAppLink({
  label,
  details = [],
  variant = "primary",
  className,
  children,
}: WhatsAppLinkProps) {
  const pathname = usePathname();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const titleId = useId();

  const configured = hasWhatsappNumber();
  const fallbackUrl = SITE_URL + (pathname === "/" ? "/" : pathname);
  const context = { action: label, sourceUrl: fallbackUrl, details };

  const classes = cn(
    "btn",
    variant === "primary" && "btn-primary",
    variant === "secondary" && "btn-secondary",
    variant === "ghost" && "btn-ghost",
    className,
  );

  if (configured) {
    return (
      <a
        href={buildWhatsappUrl(context)}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        data-wa-action={label}
        onClick={(event) => {
          // Use the real address of the page, including any query string.
          event.currentTarget.href = buildWhatsappUrl({
            ...context,
            sourceUrl: window.location.href,
          });
        }}
      >
        <WhatsAppMark />
        {children ?? label}
      </a>
    );
  }

  const message = buildWhatsappMessage({
    ...context,
    sourceUrl: typeof window === "undefined" ? fallbackUrl : window.location.href,
  });

  return (
    <>
      <button
        type="button"
        className={classes}
        data-wa-action={label}
        onClick={() => {
          setCopied(false);
          setPreviewOpen(true);
        }}
      >
        <WhatsAppMark />
        {children ?? label}
      </button>

      <Overlay open={previewOpen} onClose={() => setPreviewOpen(false)} labelledBy={titleId}>
        <OverlayHeader
          id={titleId}
          title="Nomor WhatsApp belum diisi"
          subtitle="Pesan di bawah sudah lengkap dan siap dikirim."
          onClose={() => setPreviewOpen(false)}
        />
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <p className="type-body text-sm">
            Situs ini belum memuat nomor WhatsApp resmi studio, jadi tombolnya belum
            menyambung ke percakapan. Isi{" "}
            <code className="rounded bg-paper-3 px-1.5 py-0.5 text-[0.8125rem]">
              CONTACT.whatsappNumber
            </code>{" "}
            di{" "}
            <code className="rounded bg-paper-3 px-1.5 py-0.5 text-[0.8125rem]">
              src/config/studio.ts
            </code>{" "}
            dan semua tombol WhatsApp langsung aktif.
          </p>
          <p className="type-eyebrow mt-6">Isi pesan</p>
          <pre
            data-wa-preview={label}
            className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-paper-2 p-4 text-sm leading-relaxed text-ink"
          >
            {message}
          </pre>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-5 py-4 sm:px-6">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(message);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Tersalin" : "Salin pesan"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setPreviewOpen(false)}
          >
            Tutup
          </button>
        </div>
      </Overlay>
    </>
  );
}
