/**
 * Site-level configuration.
 *
 * STUDIO_NAME is a working name. The studio's real name has not been provided
 * yet. Change it here and every page title, heading, wordmark, OG image and
 * structured-data entry follows.
 */
export const STUDIO_NAME = "Studio Booking";

/** Short descriptor used after the studio name in <title>. */
export const STUDIO_TAGLINE = "Sewa studio foto dan booking sesi";

/** Production origin. Used for canonical URLs, sitemap, robots and OG tags. */
export const SITE_URL = "https://studiobooking.onyxcreative.asia";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/paket", label: "Paket" },
  { href: "/galeri", label: "Galeri" },
  { href: "/jadwal", label: "Jadwal" },
  { href: "/booking", label: "Booking" },
] as const;

/** Routes that must never be indexed or listed in the sitemap. */
export const NOINDEX_ROUTES = ["/admin"] as const;

export const LEGAL_LINKS = [
  { href: "/privacy", label: "Kebijakan Privasi" },
  { href: "/terms", label: "Syarat dan Ketentuan" },
] as const;
