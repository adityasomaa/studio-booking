import { STUDIO_NAME } from "@/config/site";
import { cn } from "@/lib/cn";

/**
 * The mark is a viewfinder: an open frame with one lit corner. It is drawn, not
 * photographed, and it has no background of its own so it can sit on the site
 * icon, the dark curtain and the paper header without a plate behind it.
 *
 * The studio has not given us a logo. If one arrives, replace this file and the
 * icon route; nothing else refers to the drawing.
 */
export function WordmarkMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="2.75"
        y="2.75"
        width="18.5"
        height="18.5"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
      <path
        d="M7 2.75H5.75A3 3 0 0 0 2.75 5.75V7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M17 21.25h1.25a3 3 0 0 0 3-3V17"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function Wordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <WordmarkMark className={cn("h-[1.35em] w-[1.35em] text-accent", markClassName)} />
      <span className="font-medium tracking-tight">{STUDIO_NAME}</span>
    </span>
  );
}
