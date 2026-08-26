"use client";

import { useReveal } from "@/components/primitives/hooks";
import { TransitionLink } from "@/components/primitives/TransitionLink";
import { cn } from "@/lib/cn";

/**
 * Every section on this site opens the same way: what the section is, one
 * headline, one short description, one call to action. Using a single component
 * is what keeps that promise, rather than each page reinventing its own header.
 *
 * Headline size and measure come from the .type-* classes, which set a
 * different limit per breakpoint. There are no manual line breaks anywhere.
 */
export type SectionHeaderProps = {
  /** Small label above the headline. The name of the section. */
  eyebrow: string;
  headline: string;
  description: string;
  cta?: { href: string; label: string } | null;
  /** Secondary action, when a section genuinely has two next steps. */
  secondaryCta?: { href: string; label: string } | null;
  as?: "h1" | "h2";
  align?: "start" | "between";
  className?: string;
  id?: string;
};

export function SectionHeader({
  eyebrow,
  headline,
  description,
  cta,
  secondaryCta,
  as = "h2",
  align = "between",
  className,
  id,
}: SectionHeaderProps) {
  const Heading = as;
  const { ref, revealed } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-revealed={revealed}
      className={cn("reveal", className)}
      id={id}
    >
      <p className="type-eyebrow">{eyebrow}</p>
      <div
        className={cn(
          "mt-5 flex flex-col gap-6",
          align === "between" && "lg:flex-row lg:items-end lg:justify-between lg:gap-10",
        )}
      >
        <Heading className={as === "h1" ? "type-display" : "type-headline"}>{headline}</Heading>
        <div className="flex flex-col items-start gap-6 lg:max-w-sm lg:shrink-0">
          <p className="type-body">{description}</p>
          {(cta || secondaryCta) && (
            <div className="flex flex-wrap items-center gap-3">
              {cta && (
                <TransitionLink href={cta.href} className="btn btn-primary">
                  {cta.label}
                </TransitionLink>
              )}
              {secondaryCta && (
                <TransitionLink href={secondaryCta.href} className="btn btn-secondary">
                  {secondaryCta.label}
                </TransitionLink>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Wrapper that reveals its children on scroll. Keeps overflow visible. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, revealed } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-revealed={revealed}
      className={cn("reveal", className)}
      style={{ ["--reveal-delay" as string]: delay + "ms" }}
    >
      {children}
    </div>
  );
}
