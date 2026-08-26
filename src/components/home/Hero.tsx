import Image from "next/image";
import { TransitionLink } from "@/components/primitives/TransitionLink";

/**
 * The hero.
 *
 * Exactly one screen tall, measured with svh rather than vh so it does not jump
 * when the browser chrome hides on a phone. The graphic is a still: it does not
 * scale, translate or parallax on scroll, so scrolling past it is calm.
 *
 * Everything in it points at one place, the availability calendar.
 */
export function Hero() {
  return (
    <section className="relative flex h-[calc(100svh-4rem)] min-h-[34rem] flex-col md:h-[calc(100svh-4.5rem)]">
      <div className="shell flex flex-1 flex-col justify-center py-8 md:py-10">
        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-14">
          <div className="flex flex-col items-start">
            <p className="type-eyebrow">Studio foto</p>
            <h1 className="type-display mt-5">Booking studio foto sesuai jadwal</h1>
            <p className="type-body mt-6 max-w-xl">
              Lihat ruangan mana yang masih kosong, pilih paket dan slot waktunya, lalu
              kirim permintaan lewat WhatsApp. Slot yang sudah terisi terkunci otomatis,
              termasuk jam yang bentrok sebagian.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <TransitionLink href="/jadwal" className="btn btn-primary">
                Lihat kalender ketersediaan
              </TransitionLink>
              <TransitionLink href="/paket" className="btn btn-secondary">
                Lihat paket
              </TransitionLink>
            </div>
          </div>

          <div className="relative hidden aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line lg:block">
            <Image
              src="/graphics/hero.svg"
              alt="Ilustrasi geometris bidang studio, cahaya, dan bingkai. Bukan foto hasil sesi."
              fill
              priority
              sizes="(min-width: 1024px) 44vw, 0px"
              className="object-cover"
            />
          </div>
        </div>
      </div>

      <div className="shell pb-6 md:pb-8">
        <a
          href="#jadwal"
          className="inline-flex items-center gap-2 text-sm text-ink-2 transition-colors hover:text-ink"
        >
          <span>Gulir ke kalender</span>
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none">
            <path
              d="M8 3v10M4 9l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
