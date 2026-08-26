import type { Metadata, Viewport } from "next";
import { CookieBanner } from "@/components/CookieBanner";
import { OverlayProvider } from "@/components/providers/OverlayProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { TransitionProvider } from "@/components/providers/TransitionProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_URL, STUDIO_NAME, STUDIO_TAGLINE } from "@/config/site";
import { JsonLd, localBusinessJsonLd } from "@/lib/jsonld";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: STUDIO_NAME + " | " + STUDIO_TAGLINE,
    template: "%s | " + STUDIO_NAME,
  },
  description:
    "Cek jadwal studio foto per ruangan, pilih paket dan slot waktu yang masih kosong, lalu kirim permintaan booking lewat WhatsApp.",
  keywords: [
    "studio foto",
    "booking studio foto",
    "sewa studio foto",
    "jadwal studio foto",
    "self photo studio",
    "foto keluarga",
    "foto produk",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: STUDIO_NAME,
    title: STUDIO_NAME + " | " + STUDIO_TAGLINE,
    description:
      "Cek jadwal studio foto per ruangan, pilih paket dan slot waktu yang masih kosong, lalu kirim permintaan booking lewat WhatsApp.",
  },
  twitter: {
    card: "summary_large_image",
    title: STUDIO_NAME + " | " + STUDIO_TAGLINE,
    description:
      "Cek jadwal studio foto per ruangan, pilih paket dan slot waktu yang masih kosong, lalu kirim permintaan booking lewat WhatsApp.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#fcfaf8",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <a href="#konten" className="skip-link layer-skip">
          Lewati ke konten utama
        </a>

        <OverlayProvider>
          <StoreProvider>
            <TransitionProvider>
              <SmoothScroll />
              <SiteHeader />
              <main id="konten">{children}</main>
              <SiteFooter />
              <CookieBanner />
            </TransitionProvider>
          </StoreProvider>
        </OverlayProvider>

        <JsonLd data={localBusinessJsonLd()} />
      </body>
    </html>
  );
}
