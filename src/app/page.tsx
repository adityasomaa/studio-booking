import { DataNotice } from "@/components/DataNotice";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { Hero } from "@/components/home/Hero";
import { PackageCard } from "@/components/PackageCard";
import { Reveal, SectionHeader } from "@/components/SectionHeader";
import { ScheduleBrowser } from "@/components/schedule/ScheduleBrowser";
import { PACKAGES } from "@/data/packages";

export default function HomePage() {
  return (
    <>
      <Hero />

      <div className="shell">
        <DataNotice />
      </div>

      <section className="shell mt-20 md:mt-28">
        <SectionHeader
          eyebrow="Paket"
          headline="Pilih jenis sesi yang sesuai"
          description="Setiap paket punya durasi dan jumlah orang maksimal sendiri, dan durasi itulah yang menentukan slot mana yang muncul di kalender."
          cta={{ href: "/paket", label: "Lihat semua paket" }}
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
          {PACKAGES.map((pkg, index) => (
            <Reveal key={pkg.id} delay={index * 70}>
              <PackageCard pkg={pkg} className="h-full" />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell mt-24 md:mt-32">
        <SectionHeader
          eyebrow="Galeri"
          headline="Lihat hasil sesi sebelum memesan"
          description="Susunan galeri sudah siap dan menunggu foto asli dari studio. Sementara ini isinya bingkai kosong, bukan foto milik studio lain."
          cta={{ href: "/galeri", label: "Buka galeri" }}
        />
        <GalleryGrid limit={6} showFilter={false} className="mt-10 lg:mt-12" />
      </section>

      <section id="jadwal" className="shell mt-24 scroll-mt-24 md:mt-32">
        <SectionHeader
          eyebrow="Jadwal"
          headline="Cek slot yang masih kosong"
          description="Kalender menandai hari yang penuh, sebagian terisi, dan masih kosong. Klik satu tanggal untuk melihat slot per ruangan."
          cta={{ href: "/jadwal", label: "Buka halaman jadwal" }}
        />
        <div className="mt-10 lg:mt-12">
          <ScheduleBrowser compact />
        </div>
      </section>
    </>
  );
}
