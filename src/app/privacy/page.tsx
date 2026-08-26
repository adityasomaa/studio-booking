import type { Metadata } from "next";
import { PendingValue } from "@/components/Pending";
import { SectionHeader } from "@/components/SectionHeader";
import { STUDIO_NAME } from "@/config/site";
import { CONTACT } from "@/config/studio";
import { isSet } from "@/lib/unset";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan privasi situs booking studio foto: data apa yang dikumpulkan lewat formulir booking, di mana disimpan, dan bagaimana cookie dipakai.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "26 Agustus 2026";

export default function PrivacyPage() {
  return (
    <>
      <section className="shell pt-14 md:pt-20">
        <SectionHeader
          as="h1"
          eyebrow="Legal"
          headline="Kebijakan Privasi"
          description="Halaman ini menjelaskan data apa yang situs ini terima dari Anda, di mana data itu berada, dan pilihan apa yang Anda punya atas data tersebut."
          cta={{ href: "/terms", label: "Baca syarat dan ketentuan" }}
        />
        <p className="mt-8 text-sm text-ink-2">Terakhir diperbarui: {UPDATED}</p>
      </section>

      <section className="shell mt-12 max-w-3xl space-y-10 pb-4">
        <Block title="Data yang dikumpulkan">
          <p>
            Ketika Anda mengisi formulir booking, situs ini memproses nama, nomor
            WhatsApp, paket dan ruangan yang dipilih, tanggal dan slot waktu, jumlah orang,
            serta catatan yang Anda tulis sendiri. Situs ini tidak meminta alamat rumah,
            data identitas, maupun data pembayaran.
          </p>
        </Block>

        <Block title="Ke mana data itu pergi">
          <p>
            Saat ini situs belum memakai basis data. Data pemesanan disimpan di peramban
            Anda sendiri agar alur pemesanan bisa berjalan, dan tidak dikirim ke server
            mana pun untuk disimpan. Data hanya berpindah keluar dari perangkat Anda ketika
            Anda sendiri menekan tombol untuk mengirim rinciannya melalui WhatsApp.
          </p>
          <p>
            Pengiriman lewat WhatsApp tunduk pada kebijakan privasi WhatsApp. Isi pesannya
            disusun lebih dulu di layar Anda, sehingga Anda bisa membacanya sebelum
            mengirim.
          </p>
        </Block>

        <Block title="Cookie dan penyimpanan peramban">
          <p>
            Situs ini menyimpan satu cookie untuk mencatat pilihan cookie Anda, dan
            menggunakan penyimpanan lokal peramban untuk menyimpan data demo pemesanan.
            Jika Anda menolak kategori Preferensi, data pemesanan hanya bertahan selama tab
            terbuka dan penyimpanan lokal tidak dipakai.
          </p>
          <p>
            Situs ini belum memuat alat statistik, iklan, maupun pelacak pihak ketiga.
            Kategori Statistik disediakan supaya izin Anda tetap dihormati jika alat
            semacam itu ditambahkan kemudian.
          </p>
        </Block>

        <Block title="Berapa lama data disimpan">
          <p>
            Data pemesanan yang tersimpan di peramban Anda bertahan sampai Anda menghapus
            data situs, atau sampai tombol Reset Demo di halaman admin ditekan. Percakapan
            WhatsApp tersimpan di akun WhatsApp Anda dan akun studio.
          </p>
        </Block>

        <Block title="Hak Anda">
          <p>
            Anda dapat menghapus data yang tersimpan di peramban kapan saja melalui
            pengaturan peramban, dan mengubah pilihan cookie lewat tautan Pengaturan Cookie
            di footer. Untuk permintaan terkait data yang sudah dikirim ke studio melalui
            WhatsApp, hubungi studio secara langsung.
          </p>
        </Block>

        <Block title="Kontak">
          <p>
            Pertanyaan mengenai kebijakan ini dapat disampaikan kepada {STUDIO_NAME}{" "}
            melalui kontak berikut:
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              WhatsApp:{" "}
              {isSet(CONTACT.whatsappNumber) ? (
                "+" + CONTACT.whatsappNumber
              ) : (
                <PendingValue />
              )}
            </li>
            <li>
              Surel: {isSet(CONTACT.email) ? CONTACT.email : <PendingValue />}
            </li>
            <li>
              Alamat:{" "}
              {isSet(CONTACT.address) ? (
                CONTACT.address.streetAddress + ", " + CONTACT.address.addressLocality
              ) : (
                <PendingValue />
              )}
            </li>
          </ul>
          <p className="mt-3">
            Kontak resmi studio belum diserahkan kepada pembuat situs, sehingga bagian di
            atas sengaja dibiarkan kosong dan akan diisi oleh pemilik studio.
          </p>
        </Block>
      </section>
    </>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-8">
      <h2 className="text-xl font-medium">{title}</h2>
      <div className="mt-4 space-y-4 text-[1.0625rem] leading-relaxed text-ink-2">
        {children}
      </div>
    </div>
  );
}
