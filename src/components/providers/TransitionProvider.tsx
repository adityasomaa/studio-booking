"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { settle, useBodyScrollLock } from "@/components/primitives/hooks";
import { NAV_LINKS, STUDIO_NAME } from "@/config/site";
import { cn } from "@/lib/cn";
import { scrollToTopInstant } from "@/lib/scroller";

/**
 * Page transitions.
 *
 * Order, every time: the page closes, the content changes behind the cover,
 * the scroll goes back to the top, then the page opens. Nothing is allowed to
 * change while the visitor can still see the old page.
 *
 * Two covers share one element. The long one, with the wordmark, plays on the
 * first visit and on any navigation to the home page. The short one carries the
 * name of the page being opened.
 *
 * Every step waits with `settle`, which races a timer against a frame loop.
 * A sequence chained on requestAnimationFrame alone stops dead when the tab
 * goes to the background, and the cover would then stay up forever.
 */

type Phase = "intro" | "idle" | "closing" | "covered" | "opening";

const DURATION = {
  intro: 1_500,
  close: 620,
  open: 720,
  /** If a route somehow never commits, open anyway rather than trap the visitor. */
  watchdog: 2_600,
} as const;

type TransitionContextValue = {
  phase: Phase;
  navigate: (href: string) => void;
  isBusy: boolean;
};

const TransitionContext = createContext<TransitionContextValue>({
  phase: "idle",
  navigate: () => {},
  isBusy: false,
});

function labelFor(href: string): string {
  const match = NAV_LINKS.find((link) => link.href === href);
  if (match) return match.label;
  if (href.startsWith("/admin")) return "Admin";
  if (href.startsWith("/privacy")) return "Kebijakan Privasi";
  if (href.startsWith("/terms")) return "Syarat dan Ketentuan";
  return STUDIO_NAME;
}

/** Splits a word into letters. One label on the parent, letters hidden. */
function SplitWord({ text }: { text: string }) {
  return (
    <span aria-label={text} className="inline-flex flex-wrap justify-center">
      {Array.from(text).map((character, index) => (
        <span
          aria-hidden="true"
          key={index}
          className="curtain-letter"
          style={{ ["--letter-index" as string]: String(index) }}
        >
          {character === " " ? " " : character}
        </span>
      ))}
    </span>
  );
}

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [phase, setPhase] = useState<Phase>("intro");
  const [destination, setDestination] = useState<string>("/");
  const pending = useRef<string | null>(null);

  const isHomeCover = destination === "/";
  const covering = phase !== "idle";

  useBodyScrollLock(phase === "intro" || phase === "covered" || phase === "closing", false);

  /* Phase timers. */
  useEffect(() => {
    let cancelled = false;
    const run = async (ms: number, next: Phase) => {
      await settle(ms);
      if (!cancelled) setPhase(next);
    };
    if (phase === "intro") void run(DURATION.intro, "opening");
    if (phase === "closing") void run(DURATION.close, "covered");
    if (phase === "opening") void run(DURATION.open, "idle");
    return () => {
      cancelled = true;
    };
  }, [phase]);

  /* Fully covered: swap the route, then put the scroll back to the top. */
  useEffect(() => {
    if (phase !== "covered") return;
    let cancelled = false;
    const target = pending.current;
    if (target && target !== pathname) {
      router.push(target);
      scrollToTopInstant();
    }
    const watchdog = window.setTimeout(() => {
      if (cancelled) return;
      pending.current = null;
      scrollToTopInstant();
      setPhase("opening");
    }, DURATION.watchdog);
    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
    };
    // `pathname` is deliberately not a dependency: this must run once per cover.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, router]);

  /* The new route has committed behind the cover. Scroll up, then open. */
  useEffect(() => {
    if (phase !== "covered") return;
    if (pending.current !== null && pathname !== pending.current) return;
    pending.current = null;
    scrollToTopInstant();
    setPhase("opening");
  }, [phase, pathname]);

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname) return;
      if (phase === "closing" || phase === "covered") return;
      pending.current = href;
      setDestination(href);
      setPhase("closing");
    },
    [pathname, phase],
  );

  const value = useMemo<TransitionContextValue>(
    () => ({ phase, navigate, isBusy: covering }),
    [phase, navigate, covering],
  );

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <div
        className="curtain layer-curtain"
        data-phase={phase}
        aria-hidden={!covering}
        role={covering ? "status" : undefined}
        aria-live="polite"
      >
        <div className="curtain-frame" aria-hidden="true" />
        {phase === "intro" || isHomeCover ? (
          <div className="flex flex-col items-center gap-6 px-6 text-center">
            <span className="type-eyebrow text-on-ink-2">Studio foto</span>
            <span className="type-display font-medium">
              <SplitWord text={STUDIO_NAME} />
            </span>
            <span className="curtain-rule w-40 max-w-[60vw]" aria-hidden="true" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 px-6 text-center">
            <span className="curtain-rule w-24" aria-hidden="true" />
            <span className={cn("type-headline font-medium")}>
              <SplitWord text={labelFor(destination)} />
            </span>
          </div>
        )}
      </div>
    </TransitionContext.Provider>
  );
}

export function usePageTransition(): TransitionContextValue {
  return useContext(TransitionContext);
}
