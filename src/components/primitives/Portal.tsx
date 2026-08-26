"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children straight into <body>.
 *
 * The calendar overlay and the gallery lightbox both live inside sections that
 * clip their own overflow. Rendered in place they would be cropped, and their
 * stacking context would sit below the header no matter what z-index they
 * asked for. Portalling sidesteps both.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
