"use client";

import { usePathname } from "next/navigation";
import { CookieSettingsButton } from "@/components/CookieBanner";
import { PendingValue } from "@/components/Pending";
import { TransitionLink } from "@/components/primitives/TransitionLink";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { Wordmark } from "@/components/Wordmark";
import { LEGAL_LINKS, NAV_LINKS, STUDIO_NAME } from "@/config/site";
import { CONTACT, OPENING_HOURS, OPENING_HOURS_PROVISIONAL } from "@/config/studio";
import { WEEKDAY_LONG } from "@/lib/time";
import { isSet } from "@/lib/unset";

/**
 * Every page ends with a call to action.
 *
 * The target swaps when the visitor is already standing on it: no page offers a
 * button to itself. On the booking page the footer points back at the schedule,
 * and on the schedule it points at the form.
 */
function footerCta(pathname: string): { href: string; label: string; headline: string } {
  if (pathname.startsWith("/booking")) {
    return {
      href: "/jadwal",
      label: "Lihat kalender ketersediaan",
      headline: "Belum yakin jamnya?",
    };
  }
  if (pathname.startsWith("/jadwal")) {
    return {
      href: "/booking",
      label: "Isi formulir booking",
      headline: "Sudah menemukan slot yang cocok?",
    };
  }
  if (pathname.startsWith("/galeri")) {
    return {
      href: "/paket",
      label: "Lihat daftar paket",
      headline: "Lihat jenis sesi yang tersedia",
    };
  }
  return {
    href: "/booking",
    label: "Mulai booking",
    headline: "Siap memesan sesi foto?",
  };
}

export function SiteFooter() {
  const pathname = usePathname();
  const cta = footerCta(pathname);
  const year = 2026;

  return (
    <footer className="mt-24 bg-ink text-on-ink md:mt-32">
      <div className="shell py-16 md:py-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="type-eyebrow text-on-ink-2">Langkah berikutnya</p>
            <h2 className="type-headline mt-4">{cta.headline}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <TransitionLink href={cta.href} className="btn btn-primary">
              {cta.label}
            </TransitionLink>
            <WhatsAppLink
              label="Tanya lewat WhatsApp"
              variant="secondary"
              className="border-line-on-ink text-on-ink hover:bg-white/10 hover:border-on-ink-2"
            />
          </div>
        </div>

        <hr className="my-12 border-0 border-t border-line-on-ink" />

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark className="text-base" markClassName="text-accent-on-ink" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-on-ink-2">
              Studio foto dengan pemesanan sesi berdasarkan ruangan, paket, dan slot
              waktu yang tersedia.
            </p>
          </div>

          <nav aria-label="Menu footer">
            <h3 className="text-sm font-medium">Halaman</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-on-ink-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <TransitionLink href={link.href} className="hover:text-on-ink">
                    {link.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-medium">Kontak</h3>
            <ul className="mt-4 space-y-3 text-sm text-on-ink-2">
              <li>
                <span className="block text-on-ink">Alamat</span>
                {isSet(CONTACT.address) ? (
                  <span>
                    {CONTACT.address.streetAddress}, {CONTACT.address.addressLocality}
                  </span>
                ) : (
                  <PendingValue className="mt-1 border-line-on-ink text-on-ink-2" />
                )}
              </li>
              <li>
                <span className="block text-on-ink">WhatsApp</span>
                {isSet(CONTACT.whatsappNumber) ? (
                  <a href={"https://wa.me/" + CONTACT.whatsappNumber} className="hover:text-on-ink">
                    +{CONTACT.whatsappNumber}
                  </a>
                ) : (
                  <PendingValue className="mt-1 border-line-on-ink text-on-ink-2" />
                )}
              </li>
              <li>
                <span className="block text-on-ink">Instagram</span>
                {isSet(CONTACT.instagramUrl) ? (
                  <a href={CONTACT.instagramUrl} className="hover:text-on-ink">
                    Profil Instagram
                  </a>
                ) : (
                  <PendingValue className="mt-1 border-line-on-ink text-on-ink-2" />
                )}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium">Jam operasional</h3>
            <ul className="mt-4 space-y-1.5 text-sm text-on-ink-2">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const hours = OPENING_HOURS[day];
                return (
                  <li key={day} className="flex justify-between gap-4">
                    <span>{WEEKDAY_LONG[day]}</span>
                    <span className="tabular-nums">
                      {hours ? hours.open + " - " + hours.close : "Tutup"}
                    </span>
                  </li>
                );
              })}
            </ul>
            {OPENING_HOURS_PROVISIONAL && (
              <p className="mt-3 text-[0.8125rem] leading-relaxed text-on-ink-2">
                Jam di atas masih contoh dan belum dikonfirmasi pemilik studio.
              </p>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line-on-ink pt-6 text-sm text-on-ink-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {STUDIO_NAME}
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <TransitionLink href={link.href} className="hover:text-on-ink">
                  {link.label}
                </TransitionLink>
              </li>
            ))}
            <li>
              <CookieSettingsButton className="hover:text-on-ink" />
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
