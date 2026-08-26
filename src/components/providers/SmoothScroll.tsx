"use client";

import Lenis from "lenis";
import { useEffect, useRef } from "react";
import { useMediaQuery, usePrefersReducedMotion } from "@/components/primitives/hooks";
import { useOverlayRegistry } from "@/components/providers/OverlayProvider";
import { registerScroller } from "@/lib/scroller";

/**
 * Smooth scrolling, desktop only.
 *
 * It is switched off on tablets and phones, where the native momentum scroll is
 * better than anything a script can fake, and it is stopped outright while an
 * overlay is open so the page does not drift behind a dialog. Reduced-motion
 * users never get it at all.
 */
export function SmoothScroll() {
  const lenis = useRef<Lenis | null>(null);
  const frame = useRef<number | null>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px) and (pointer: fine)");
  const reducedMotion = usePrefersReducedMotion();
  const { anyOpen } = useOverlayRegistry();

  useEffect(() => {
    if (!isDesktop || reducedMotion) return;

    const instance = new Lenis({
      duration: 1.05,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      syncTouch: false,
    });
    lenis.current = instance;
    registerScroller(instance);

    const raf = (time: number) => {
      instance.raf(time);
      frame.current = requestAnimationFrame(raf);
    };
    frame.current = requestAnimationFrame(raf);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      instance.destroy();
      registerScroller(null);
      lenis.current = null;
    };
  }, [isDesktop, reducedMotion]);

  useEffect(() => {
    const instance = lenis.current;
    if (!instance) return;
    if (anyOpen) instance.stop();
    else instance.start();
  }, [anyOpen]);

  return null;
}
