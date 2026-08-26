"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePageTransition } from "@/components/providers/TransitionProvider";

type Props = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: string;
  /** Called after the navigation is handed over, e.g. to close the menu. */
  onNavigate?: () => void;
};

/**
 * Internal navigation. Hands the route change to the transition sequence so the
 * new page is only swapped in while the cover is down.
 *
 * Same-page anchors, external links and modified clicks fall through to normal
 * browser behaviour.
 */
export function TransitionLink({ href, onNavigate, onClick, ...rest }: Props) {
  const { navigate } = usePageTransition();
  const pathname = usePathname();

  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }
        if (href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) {
          return;
        }
        event.preventDefault();
        onNavigate?.();
        if (href.split("?")[0].split("#")[0] === pathname) return;
        navigate(href);
      }}
      {...rest}
    />
  );
}
