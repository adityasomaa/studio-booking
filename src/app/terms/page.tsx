import type { Metadata } from "next";
import { PendingValue } from "@/components/Pending";
import { SectionHeader } from "@/components/SectionHeader";
import { STUDIO_NAME } from "@/config/site";
import { BOOKING_RULES, POLICY } from "@/config/studio";
import { formatDuration } from "@/lib/time";
import { isSet } from "@/lib/unset";

export const metadata: Metadata = {
  title: "Syarat dan Ketentuan",
  description:
    "Syarat dan ketentuan pemesanan sesi di studio foto: cara pemesanan, konfirmasi, aturan jadwal, serta ketentuan pembatalan dan uang muka.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "26 Agustus 2026";

export default function TermsPage() {
  return (
    <>
      <section className="shell pt-14 md:pt-20">
        <SectionHeader
          as="h1"
          eyebrow="Legal"
          headline="Syarat dan Ketentuan"
          description="Ketentuan penggunaan situs ini dan tata cara pemesanan sesi. Dengan mengirim permintaan booking, Anda dianggap telah membaca halaman ini."
          cta={{ href: "/booking", label: "Ke formulir booking" }}
        />
        <p className="mt-8 text-sm text-ink-2">Terakhir diperbarui: {UPDATED}</p>
      </section>

      <section className="shell mt-12 max-w-3xl space-y-10 pb-4">
        <Block title="Tentang situs ini">
          <p>
            Situs ini dikelola atas nama {STUDIO_NAME} untuk menampilkan informasi layanan
            dan menerima permintaan pemesanan sesi foto. Nama studio yang tertera saat ini
            masih nama kerja dan akan diganti dengan nama resmi studio.
          </p>
        </Block>

        <Block title="Cara pemesanan">
          <p>
            Permintaan dikirim melalui formulir booking, lalu diteruskan ke studio melalui
            WhatsApp. Mengirim formulir berarti mengajukan permintaan, bukan memastikan
            sesi. Pemesanan dianggap sah setelah studio memberi konfirmasi.
          </p>
        </Block>

        <Block title="Aturan jadwal">
          <p>Aturan berikut berlaku otomatis di sistem pemesanan:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Satu ruangan hanya dapat dipakai oleh satu pemesan pada satu rentang waktu.</li>
            <li>
              Slot yang bertabrakan dengan pemesanan lain, termasuk yang bertabrakan
              sebagian, tidak dapat dipilih.
            </li>
            <li>
              Antar sesi di ruangan yang sama diberi jeda{" "}
              {formatDuration(BOOKING_RULES.bufferMinutes)} untuk persiapan.
            </li>
            <li>
              Pemesanan paling cepat {BOOKING_RULES.minLeadTimeHours} jam sebelum sesi
              dimulai, dan paling jauh {BOOKING_RULES.maxAdvanceDays} hari ke depan.
            </li>
            <li>
              Studio dapat menutup slot tertentu untuk keperluan internal atau perawatan
              peralatan.
            </li>
          </ul>
          <p>
            Jam operasional, durasi paket, jumlah orang maksimal, dan jumlah ruangan yang
            saat ini tampil di situs masih berupa nilai contoh dan akan disesuaikan dengan
            data resmi studio.
          </p>
        </Block>

        <Block title="Pembatalan, penjadwalan ulang, dan uang muka">
          <p>
            Ketentuan berikut akan diisi oleh pemilik studio dan berlaku sejak dicantumkan
            di halaman ini. Sampai saat itu, hal-hal tersebut disepakati langsung antara
            pemesan dan studio melalui WhatsApp.
          </p>
          <ul className="mt-4 space-y-3">
            <Term label="Uang muka" value={POLICY.deposit} />
            <Term label="Pembatalan" value={POLICY.cancellation} />
            <Term label="Penjadwalan ulang" value={POLICY.reschedule} />
            <Term label="Keterlambatan" value={POLICY.lateArrival} />
          </ul>
        </Block>

        <Block title="Pembayaran">
          <p>
            Situs ini tidak memproses pembayaran dan tidak menerima data kartu maupun
            rekening. Jika studio meminta uang muka, pengaturannya dilakukan di luar situs,
            melalui WhatsApp.
          </p>
        </Block>

        <Block title="Hak atas gambar">
          <p>
            Seluruh gambar di situs ini saat ini berupa grafis penanda yang dibuat khusus
            untuk situs ini. Tidak ada foto hasil sesi milik studio lain yang digunakan.
            Foto hasil sesi studio akan menggantikan grafis tersebut setelah diserahkan
            beserta izin penggunaannya. Penggunaan foto pemesan untuk keperluan promosi
            memerlukan persetujuan pemesan terlebih dahulu.
          </p>
        </Block>

        <Block title="Batasan tanggung jawab">
          <p>
            Informasi di situs ini disediakan sebagaimana adanya. Studio berhak mengubah
            jadwal, paket, dan ketentuan sewaktu-waktu. Jika terjadi perbedaan antara
            informasi di situs dan konfirmasi tertulis dari studio, konfirmasi studio yang
            berlaku.
          </p>
        </Block>

        <Block title="Perubahan ketentuan">
          <p>
            Ketentuan ini dapat diperbarui. Tanggal pembaruan terakhir dicantumkan di
            bagian atas halaman.
          </p>
        </Block>
      </section>
    </>
  );
}

function Term({ label, value }: { label: string; value: string | null }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
      <span className="font-medium text-ink">{label}:</span>
      {isSet(value) ? <span>{value}</span> : <PendingValue label="Belum ditentukan" />}
    </li>
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
