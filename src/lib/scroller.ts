/**
 * One place that knows how to move the page to the top.
 *
 * With smooth scrolling active the browser and the smooth-scroll library keep
 * separate ideas of where the page is, so both have to be told.
 */
type Scroller = { scrollTo: (target: number, options?: { immediate?: boolean }) => void };

let scroller: Scroller | null = null;

export function registerScroller(instance: Scroller | null): void {
  scroller = instance;
}

export function scrollToTopInstant(): void {
  try {
    scroller?.scrollTo(0, { immediate: true });
  } catch {
    /* the smooth scroller may already be torn down */
  }
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
}
