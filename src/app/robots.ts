import type { MetadataRoute } from "next";
import { NOINDEX_ROUTES, SITE_URL } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The admin demo is also marked noindex in its own metadata.
      disallow: [...NOINDEX_ROUTES, "/api/"],
    },
    sitemap: SITE_URL + "/sitemap.xml",
    host: SITE_URL,
  };
}
