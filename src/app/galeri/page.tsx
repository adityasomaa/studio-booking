import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { JsonLd, breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Galeri hasil sesi studio foto",
  description:
    "Galeri hasil sesi studio foto, dikelompokkan per jenis sesi: self photo, foto keluarga, foto produk, dan sewa ruangan per jam.",
  alternates: { canonical: "/galeri" },
};

export default function GaleriPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Galeri", path: "/galeri" },
        ])}
      />

      <section className="shell pt-14 md:pt-20">
        <SectionHeader
          as="h1"
          eyebrow="Galeri"
          headline="Galeri hasil sesi studio foto"
          description="Saring berdasarkan jenis sesi untuk melihat contoh yang paling mendekati kebutuhan Anda, lalu klik satu gambar untuk memperbesar."
          cta={{ href: "/booking", label: "Mulai booking" }}
        />

        <aside className="mt-8 rounded-xl border border-line bg-paper-2 px-4 py-3.5 text-sm leading-relaxed text-ink-2 sm:px-5">
          <span className="font-medium text-ink">Slot masih kosong.</span> Semua bingkai di
          halaman ini adalah grafis penanda, bukan foto. Tidak ada foto hasil sesi studio
          lain yang dipakai sebagai contoh, dan tidak ada wajah orang. Foto asli studio akan
          menggantikannya begitu diserahkan.
        </aside>
      </section>

      <section className="shell mt-10">
        <GalleryGrid />
      </section>
    </>
  );
}
