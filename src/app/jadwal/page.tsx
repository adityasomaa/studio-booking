import type { Metadata } from "next";
import { DataNotice } from "@/components/DataNotice";
import { SectionHeader } from "@/components/SectionHeader";
import { ScheduleBrowser } from "@/components/schedule/ScheduleBrowser";
import { JsonLd, breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Jadwal dan ketersediaan studio foto",
  description:
    "Kalender ketersediaan studio foto per ruangan. Lihat hari yang penuh, sebagian terisi, dan masih kosong, lalu pilih slot waktu yang masih tersedia.",
  alternates: { canonical: "/jadwal" },
};

export default function JadwalPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Jadwal", path: "/jadwal" },
        ])}
      />

      <section className="shell pt-14 md:pt-20">
        <SectionHeader
          as="h1"
          eyebrow="Jadwal"
          headline="Ketersediaan studio per ruangan"
          description="Slot dihitung dari jam operasional dibagi durasi paket. Jam yang sudah dipesan, diblokir studio, atau sudah lewat otomatis terkunci."
          cta={{ href: "/booking", label: "Isi formulir booking" }}
        />
        <DataNotice className="mt-8" />
      </section>

      <section className="shell mt-10 md:mt-12">
        <ScheduleBrowser />
      </section>
    </>
  );
}
