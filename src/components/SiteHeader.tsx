"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { TransitionLink } from "@/components/primitives/TransitionLink";
import { useBodyScrollLock, useEscape } from "@/components/primitives/hooks";
import { useOverlayRegistry } from "@/components/providers/OverlayProvider";
import { Wordmark } from "@/components/Wordmark";
import { NAV_LINKS } from "@/config/site";
import { cn } from "@/lib/cn";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { register } = useOverlayRegistry();

  useBodyScrollLock(menuOpen);
  useEscape(menuOpen, () => setMenuOpen(false));

  useEffect(() => {
    if (!menuOpen) return;
    return register();
  }, [menuOpen, register]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 layer-header border-b border-line bg-paper/88 backdrop-blur-md">
      <div className="shell flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
        <TransitionLink href="/" className="text-[0.9375rem] md:text-base" aria-label="Beranda">
          <Wordmark />
        </TransitionLink>

        <nav aria-label="Menu utama" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <TransitionLink
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center rounded-full px-3.5 text-[0.9375rem] transition-colors",
                    isActive(link.href)
                      ? "bg-paper-3 text-ink"
                      : "text-ink-2 hover:text-ink",
                  )}
                >
                  {link.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="btn btn-secondary -mr-1 h-11 w-11 min-h-0 !p-0 md:hidden"
          aria-expanded={menuOpen}
          aria-controls="menu-mobile"
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg viewBox="0 0 22 22" width="20" height="20" aria-hidden="true" fill="none">
            {menuOpen ? (
              <path
                d="M6 6l10 10M16 6L6 16"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M3.5 7h15M3.5 15h15"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      <div
        id="menu-mobile"
        hidden={!menuOpen}
        className="fixed inset-x-0 bottom-0 top-16 layer-mobile-menu flex flex-col overflow-y-auto overscroll-contain border-t border-line bg-paper px-5 pb-10 pt-4 md:hidden"
      >
        <nav aria-label="Menu utama seluler">
          <ul className="stack-lines">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <TransitionLink
                  href={link.href}
                  onNavigate={() => setMenuOpen(false)}
                  onClick={() => {
                    if (link.href === pathname) setMenuOpen(false);
                  }}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className="flex items-center justify-between py-4 text-xl"
                >
                  <span className={isActive(link.href) ? "text-accent" : undefined}>
                    {link.label}
                  </span>
                  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none">
                    <path
                      d="M5 3l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.5"
                    />
                  </svg>
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>
        <TransitionLink
          href="/booking"
          onNavigate={() => setMenuOpen(false)}
          className="btn btn-primary mt-8 w-full"
        >
          Mulai booking
        </TransitionLink>
      </div>
    </header>
  );
}
