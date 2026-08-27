import Image from "next/image";
import { PendingValue } from "@/components/Pending";
import { TransitionLink } from "@/components/primitives/TransitionLink";
import type { Package } from "@/data/packages";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/time";
import { isSet } from "@/lib/unset";

/**
 * One package.
 *
 * The price slot is empty and stays empty until the studio sets prices. Showing
 * "Belum diisi" is the honest state; a number here would be invented.
 */
export function PackageCard({ pkg, className }: { pkg: Package; className?: string }) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-line bg-paper transition-colors duration-300 hover:border-line-strong",
        className,
      )}
    >
      <div className="relative aspect-[3/2] w-full border-b border-line">
        <Image
          src={pkg.graphic}
          alt={"Grafis penanda paket " + pkg.name + ". Bukan foto hasil sesi."}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          loading="eager"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-xl font-medium">{pkg.name}</h3>
        <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-2">{pkg.summary}</p>

        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-2">Durasi</dt>
            <dd>{formatDuration(pkg.durationMinutes)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-2">Maksimal orang</dt>
            <dd>{pkg.maxPeople}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-2">Harga</dt>
            <dd>
              {isSet(pkg.priceIdr) ? (
                "Rp" + pkg.priceIdr.toLocaleString("id-ID")
              ) : (
                <PendingValue />
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3 pt-1">
          <TransitionLink
            href={"/booking?paket=" + pkg.id}
            className="btn btn-primary flex-1"
          >
            Pilih paket ini
          </TransitionLink>
          <TransitionLink href="/jadwal" className="btn btn-secondary">
            Cek jadwal
          </TransitionLink>
        </div>
      </div>
    </article>
  );
}
