import { UNSET_LABEL } from "@/lib/unset";
import { cn } from "@/lib/cn";

/**
 * The visible face of "we have not been told this yet".
 *
 * Prices, the address, opening hours and the cancellation terms are all blank
 * on purpose. Showing an obvious gap is safer than showing a plausible number
 * the studio never agreed to.
 */
export function PendingValue({
  children,
  label = UNSET_LABEL,
  className,
}: {
  children?: React.ReactNode;
  label?: string;
  className?: string;
}) {
  if (children) return <>{children}</>;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-dashed border-line-strong px-2 py-0.5 text-[0.8125rem] text-ink-2",
        className,
      )}
      data-pending="true"
    >
      <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" fill="none">
        <path d="M6 2v4l2.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
      </svg>
      {label}
    </span>
  );
}

/** A short line that marks numbers standing in until the owner confirms them. */
export function ProvisionalNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-[0.8125rem] leading-relaxed text-ink-2", className)}>
      <span className="mr-1.5 font-medium text-accent-deep">Contoh:</span>
      {children}
    </p>
  );
}
