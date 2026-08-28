import type { Metadata } from "next";
import { TransitionLink } from "@/components/primitives/TransitionLink";
import { NAV_LINKS } from "@/config/site";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  description:
    "Halaman yang dituju tidak ada. Kembali ke beranda, lihat jadwal ketersediaan studio, atau langsung ke formulir booking.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="shell flex min-h-[60svh] flex-col justify-center py-20">
      <p className="type-eyebrow">Error 404</p>
      <h1 className="type-display mt-5">Halaman ini tidak ada</h1>
      <p className="type-body mt-6">
        Tautannya mungkin salah ketik atau halamannya sudah dipindahkan. Semua yang
        Anda butuhkan untuk memesan sesi ada di halaman berikut.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <TransitionLink href="/jadwal" className="btn btn-primary">
          Lihat kalender ketersediaan
        </TransitionLink>
        <TransitionLink href="/" className="btn btn-secondary">
          Kembali ke beranda
        </TransitionLink>
      </div>

      <nav aria-label="Halaman lain" className="mt-12 border-t border-line pt-6">
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem] text-ink-2">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <TransitionLink href={link.href} className="hover:text-ink">
                {link.label}
              </TransitionLink>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
