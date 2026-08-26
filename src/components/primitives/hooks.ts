"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* -------------------------------------------------------------------------- */
/*  Waiting                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Waits roughly `ms`, resolving on whichever of a timer or a frame loop gets
 * there first.
 *
 * requestAnimationFrame stops entirely when the tab goes to the background. A
 * transition sequence that chains on frames alone therefore freezes mid-way and
 * the curtain never lifts. The timer is the safety net; the frame loop keeps
 * the timing honest when the tab is visible.
 */
export function settle(ms: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, ms);
    const started = performance.now();
    const tick = () => {
      if (done) return;
      if (performance.now() - started >= ms) {
        finish();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* -------------------------------------------------------------------------- */
/*  Clock                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A Date that refreshes on a real timer and on every return to the tab.
 *
 * Whether a slot has passed is measured against the actual clock, never against
 * accumulated frames, so leaving the tab open all afternoon and coming back
 * still shows the right thing.
 *
 * It starts at epoch zero so the server and the first client render agree; the
 * real time arrives in the first effect. Call sites gate on `nowReady`.
 */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState<Date>(() => new Date(0));

  useEffect(() => {
    const refresh = () => setNow(new Date());
    refresh();
    const id = window.setInterval(refresh, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, [intervalMs]);

  return now;
}

export function isClockReady(now: Date): boolean {
  return now.getTime() > 0;
}

/* -------------------------------------------------------------------------- */
/*  Scroll lock                                                                */
/* -------------------------------------------------------------------------- */

const locks = new Set<symbol>();
let savedScrollY = 0;

/**
 * Locks body scrolling while an overlay is open and gives it back on close.
 *
 * Reference counted, so two overlapping overlays do not fight over the same
 * flag. `restore` exists for the page curtain: a transition deliberately ends
 * at the top of the new page, so putting the old scroll position back would
 * undo it.
 */
export function useBodyScrollLock(active: boolean, restore = true): void {
  useEffect(() => {
    if (!active) return;
    const key = Symbol("scroll-lock");
    if (locks.size === 0) {
      savedScrollY = window.scrollY;
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      document.body.dataset.scrollLocked = "true";
      if (scrollbar > 0) document.body.style.paddingRight = scrollbar + "px";
    }
    locks.add(key);
    return () => {
      locks.delete(key);
      if (locks.size === 0) {
        delete document.body.dataset.scrollLocked;
        document.body.style.paddingRight = "";
        if (restore) window.scrollTo({ top: savedScrollY, behavior: "auto" });
      }
    };
  }, [active, restore]);
}

/* -------------------------------------------------------------------------- */
/*  Escape and focus                                                           */
/* -------------------------------------------------------------------------- */

export function useEscape(active: boolean, onEscape: () => void): void {
  const handler = useRef(onEscape);
  handler.current = onEscape;
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        handler.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keeps Tab inside an open dialog and returns focus where it came from. */
export function useFocusTrap(
  active: boolean,
  container: React.RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = container.current;
    if (node) {
      const first = node.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? node).focus({ preventScroll: true });
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !container.current) return;
      const items = Array.from(
        container.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((item) => item.offsetParent !== null || item === document.activeElement);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [active, container]);
}

/* -------------------------------------------------------------------------- */
/*  Viewport                                                                   */
/* -------------------------------------------------------------------------- */

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/* -------------------------------------------------------------------------- */
/*  Reveal                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Marks an element as revealed once it enters the viewport.
 *
 * Three things reveal an element, and any one of them is enough:
 *
 *   1. It is already within, or above, the viewport when it mounts. Checked
 *      synchronously, so content that starts on screen never waits.
 *   2. IntersectionObserver reports it entering.
 *   3. A fallback timer, in case the observer never reports anything.
 *
 * The third one matters. An observer attached inside an overflow-hidden
 * ancestor keeps an intersection ratio of zero forever, and in a tab that is
 * not painting, entries may not be delivered at all. Content that is invisible
 * until an observer says otherwise is content that can vanish. Reveal is a
 * decoration; it is never allowed to be the reason something cannot be read.
 *
 * All section wrappers in this project also keep overflow visible, so case 2
 * is the one that normally runs.
 */
export function useReveal<T extends HTMLElement>(fallbackMs = 1200): {
  ref: (node: T | null) => void;
  revealed: boolean;
} {
  const [revealed, setRevealed] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const timer = useRef<number | null>(null);

  const finish = useCallback(() => {
    setRevealed(true);
    observer.current?.disconnect();
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const ref = useCallback(
    (node: T | null) => {
      observer.current?.disconnect();
      if (timer.current !== null) window.clearTimeout(timer.current);
      if (!node) return;

      const box = node.getBoundingClientRect();
      if (box.top < window.innerHeight && box.bottom > 0) {
        finish();
        return;
      }

      if (typeof IntersectionObserver === "undefined") {
        finish();
        return;
      }

      observer.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) finish();
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
      );
      observer.current.observe(node);

      timer.current = window.setTimeout(finish, fallbackMs);
    },
    [finish, fallbackMs],
  );

  useEffect(
    () => () => {
      observer.current?.disconnect();
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  return { ref, revealed };
}
