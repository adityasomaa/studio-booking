import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingForm } from "@/components/booking/BookingForm";
import { DataNotice } from "@/components/DataNotice";
import { SectionHeader } from "@/components/SectionHeader";
import { JsonLd, breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Booking sesi studio foto",
  description:
    "Formulir booking studio foto: pilih paket, ruangan, tanggal, dan slot waktu, lalu kirim permintaan lengkap lewat WhatsApp.",
  alternates: { canonical: "/booking" },
};

export default function BookingPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Booking", path: "/booking" },
        ])}
      />

      <section className="shell pt-14 md:pt-20">
        <SectionHeader
          as="h1"
          eyebrow="Booking"
          headline="Formulir booking sesi studio"
          description="Isi data sesi Anda. Slot yang bentrok dengan pemesanan lain tidak akan bisa dipilih, dan pilihan Anda diperiksa ulang di server sebelum diterima."
          cta={{ href: "/jadwal", label: "Lihat kalender dulu" }}
        />
        <DataNotice className="mt-8" />
      </section>

      <section className="shell mt-10 md:mt-12">
        <Suspense
          fallback={
            <div
              className="surface h-96 animate-pulse bg-paper-3"
              aria-label="Memuat formulir booking"
            />
          }
        >
          <BookingForm />
        </Suspense>
      </section>
    </>
  );
}
