import type { Metadata } from "next";
import Image from "next/image";
import { DataNotice } from "@/components/DataNotice";
import { PackageCard } from "@/components/PackageCard";
import { PendingValue } from "@/components/Pending";
import { Reveal, SectionHeader } from "@/components/SectionHeader";
import { BOOKING_RULES, POLICY } from "@/config/studio";
import { PACKAGES } from "@/data/packages";
import { ROOMS } from "@/data/rooms";
import { JsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { formatDuration } from "@/lib/time";
import { isSet } from "@/lib/unset";

export const metadata: Metadata = {
  title: "Paket sesi foto studio",
  description:
    "Daftar paket sesi di studio foto: self photo, foto keluarga, foto produk, dan sewa ruangan per jam, lengkap dengan durasi dan jumlah orang maksimal.",
  alternates: { canonical: "/paket" },
};

export default function PaketPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Paket", path: "/paket" },
        ])}
      />

      <section className="shell pt-14 md:pt-20">
        <SectionHeader
          as="h1"
          eyebrow="Paket"
          headline="Paket sesi foto studio"
          description="Empat jenis sesi dengan durasi masing-masing. Durasi paket menentukan panjang slot di kalender, jadi mengganti paket akan mengubah daftar jam yang tersedia."
          cta={{ href: "/jadwal", label: "Cek jadwal" }}
        />
        <DataNotice className="mt-8" />
      </section>

      <section className="shell mt-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((pkg, index) => (
            <Reveal key={pkg.id} delay={index * 70}>
              <PackageCard pkg={pkg} className="h-full" />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell mt-24 md:mt-32">
        <SectionHeader
          eyebrow="Ruangan"
          headline="Setiap sesi memakai satu ruangan"
          description="Satu ruangan hanya bisa dipakai satu pemesan pada satu rentang waktu, jadi ketersediaan selalu dihitung per ruangan, bukan per studio."
          cta={{ href: "/jadwal", label: "Lihat ketersediaan per ruangan" }}
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {ROOMS.map((room, index) => (
            <Reveal key={room.id} delay={index * 80}>
              <article className="overflow-hidden rounded-2xl border border-line bg-paper">
                <div className="relative aspect-[16/10] border-b border-line">
                  <Image
                    src={room.graphic}
                    alt={"Grafis penanda " + room.name + ". Bukan foto ruangan sebenarnya."}
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="text-xl font-medium">{room.name}</h3>
                  <div className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
                    {isSet(room.description) ? (
                      <p>{room.description}</p>
                    ) : (
                      <p>
                        Keterangan ruangan <PendingValue />
                      </p>
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell mt-24 md:mt-32">
        <SectionHeader
          eyebrow="Ketentuan"
          headline="Aturan pemesanan yang berlaku"
          description="Aturan teknis di bawah sudah aktif di sistem. Ketentuan pembatalan dan uang muka menunggu keputusan pemilik studio."
          cta={{ href: "/terms", label: "Baca syarat dan ketentuan" }}
        />
        <dl className="mt-10 grid gap-x-10 gap-y-6 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-sm text-ink-2">Jeda antar sesi</dt>
            <dd className="mt-1.5 text-lg">{formatDuration(BOOKING_RULES.bufferMinutes)}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-2">Pemesanan paling cepat</dt>
            <dd className="mt-1.5 text-lg">
              {BOOKING_RULES.minLeadTimeHours} jam dari sekarang
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-2">Pemesanan paling jauh</dt>
            <dd className="mt-1.5 text-lg">
              {BOOKING_RULES.maxAdvanceDays} hari ke depan
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-2">Pembayaran online</dt>
            <dd className="mt-1.5 text-lg">Tidak tersedia</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-2">Uang muka</dt>
            <dd className="mt-1.5">
              {isSet(POLICY.deposit) ? POLICY.deposit : <PendingValue />}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-2">Pembatalan</dt>
            <dd className="mt-1.5">
              {isSet(POLICY.cancellation) ? POLICY.cancellation : <PendingValue />}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-2">Penjadwalan ulang</dt>
            <dd className="mt-1.5">
              {isSet(POLICY.reschedule) ? POLICY.reschedule : <PendingValue />}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-2">Keterlambatan</dt>
            <dd className="mt-1.5">
              {isSet(POLICY.lateArrival) ? POLICY.lateArrival : <PendingValue />}
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}
