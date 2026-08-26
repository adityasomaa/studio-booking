import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { SectionHeader } from "@/components/SectionHeader";

/**
 * Admin is deliberately kept out of the nav and out of the sitemap, and told
 * not to be indexed. It is a demo surface, not a product.
 */
export const metadata: Metadata = {
  title: "Admin demo",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPage() {
  return (
    <>
      <section className="shell pt-14 md:pt-20">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent bg-accent-soft px-4 py-1.5 text-sm text-accent-deep">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          Halaman demo, tanpa login dan tanpa keamanan
        </div>

        <SectionHeader
          as="h1"
          eyebrow="Admin"
          headline="Panel admin demo"
          description="Daftar pemesanan per tanggal, ubah status, dan blokir slot secara manual saat studio dipakai sendiri atau tutup mendadak. Semua perubahan langsung terlihat di sisi pemesan."
          cta={{ href: "/jadwal", label: "Lihat dampaknya di jadwal" }}
        />

        <aside className="mt-8 rounded-xl border border-line bg-paper-2 px-4 py-3.5 text-sm leading-relaxed text-ink-2 sm:px-5">
          <span className="font-medium text-ink">Yang perlu diketahui.</span> Halaman ini
          tidak terkunci dan tidak muncul di menu, karena belum ada backend maupun sistem
          login. Data pemesanan disimpan di peramban pengunjung, bukan di server, jadi
          panel ini hanya melihat data di perangkat ini saja. Untuk penggunaan sungguhan,
          rute ini harus dipindahkan ke belakang autentikasi dan disambungkan ke basis
          data.
        </aside>
      </section>

      <section className="shell mt-10 md:mt-12">
        <AdminPanel />
      </section>
    </>
  );
}
