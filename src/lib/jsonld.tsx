import { SITE_URL, STUDIO_NAME } from "@/config/site";
import { CONTACT, OPENING_HOURS } from "@/config/studio";
import { isSet } from "@/lib/unset";

/**
 * LocalBusiness structured data.
 *
 * Address, phone and opening hours are only emitted once they are actually set
 * in src/config/studio.ts. Publishing a guessed address or a guessed phone
 * number in structured data is worse than publishing none: search engines
 * repeat it, and it is hard to take back. Fill the config in and this file
 * starts including them with no other change.
 */
const DAY_URI = [
  "https://schema.org/Sunday",
  "https://schema.org/Monday",
  "https://schema.org/Tuesday",
  "https://schema.org/Wednesday",
  "https://schema.org/Thursday",
  "https://schema.org/Friday",
  "https://schema.org/Saturday",
];

export function localBusinessJsonLd(): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "PhotographyBusiness",
    "@id": SITE_URL + "/#studio",
    name: STUDIO_NAME,
    url: SITE_URL,
    description:
      "Studio foto dengan pemesanan sesi berdasarkan ruangan, paket, dan slot waktu yang tersedia.",
    image: SITE_URL + "/opengraph-image",
    logo: SITE_URL + "/icon.svg",
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: SITE_URL + "/booking",
        actionPlatform: [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform",
        ],
      },
      result: { "@type": "Reservation", name: "Sesi foto studio" },
    },
  };

  if (isSet(CONTACT.address)) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: CONTACT.address.streetAddress,
      addressLocality: CONTACT.address.addressLocality,
      addressRegion: CONTACT.address.addressRegion,
      postalCode: CONTACT.address.postalCode,
      addressCountry: CONTACT.address.addressCountry,
    };
  }

  if (isSet(CONTACT.whatsappNumber)) {
    data.telephone = "+" + CONTACT.whatsappNumber;
  }

  const sameAs = [CONTACT.instagramUrl, CONTACT.mapsUrl].filter(isSet);
  if (sameAs.length > 0) data.sameAs = sameAs;

  const specification = Object.entries(OPENING_HOURS)
    .filter(([, hours]) => hours !== null)
    .map(([day, hours]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_URI[Number(day)],
      opens: hours!.open,
      closes: hours!.close,
    }));
  if (specification.length > 0) data.openingHoursSpecification = specification;

  return data;
}

export function breadcrumbJsonLd(
  trail: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: SITE_URL + entry.path,
    })),
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
