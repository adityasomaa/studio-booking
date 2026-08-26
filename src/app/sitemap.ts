import type { MetadataRoute } from "next";
import { LEGAL_LINKS, NAV_LINKS, NOINDEX_ROUTES, SITE_URL } from "@/config/site";

/**
 * Sitemap.
 *
 * Built from the same nav config the header uses, so a new page cannot be added
 * to the menu and forgotten here. Anything listed in NOINDEX_ROUTES, which is
 * the admin demo, is filtered out.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const entries = [
    ...NAV_LINKS.map((link) => ({
      path: link.href,
      priority: link.href === "/" ? 1 : 0.8,
      changeFrequency: (link.href === "/jadwal" ? "daily" : "weekly") as
        | "daily"
        | "weekly",
    })),
    ...LEGAL_LINKS.map((link) => ({
      path: link.href,
      priority: 0.3,
      changeFrequency: "yearly" as const,
    })),
  ].filter((entry) => !NOINDEX_ROUTES.some((route) => entry.path.startsWith(route)));

  return entries.map((entry) => ({
    url: SITE_URL + (entry.path === "/" ? "" : entry.path),
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
