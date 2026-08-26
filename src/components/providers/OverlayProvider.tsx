"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Counts how many overlays are open.
 *
 * Smooth scrolling has to stand down while a calendar, a lightbox or the mobile
 * menu is up, otherwise the page keeps gliding underneath the dialog.
 */
type OverlayContextValue = {
  openCount: number;
  anyOpen: boolean;
  register: () => () => void;
};

const OverlayContext = createContext<OverlayContextValue>({
  openCount: 0,
  anyOpen: false,
  register: () => () => {},
});

export function OverlayProvider({ children }: { children: React.ReactNode }) {
  const [openCount, setOpenCount] = useState(0);

  const register = useCallback(() => {
    setOpenCount((count) => count + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      setOpenCount((count) => Math.max(0, count - 1));
    };
  }, []);

  const value = useMemo(
    () => ({ openCount, anyOpen: openCount > 0, register }),
    [openCount, register],
  );

  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
}

export function useOverlayRegistry(): OverlayContextValue {
  return useContext(OverlayContext);
}
