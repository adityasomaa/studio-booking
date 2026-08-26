import { BOOKING_RULES, OPENING_HOURS_PROVISIONAL } from "@/config/studio";
import { PACKAGE_NUMBERS_PROVISIONAL } from "@/data/packages";
import { ROOMS_PROVISIONAL } from "@/data/rooms";
import { cn } from "@/lib/cn";

/**
 * States plainly which numbers on this page are not yet real.
 *
 * Opening hours, session lengths, group sizes and the number of rooms are
 * needed for the schedule to run at all, so they carry placeholder values. They
 * are labelled here rather than left to look like facts. Prices, the address,
 * the WhatsApp number and the cancellation terms carry no placeholder at all.
 */
export function DataNotice({ className }: { className?: string }) {
  const items: string[] = [];
  if (OPENING_HOURS_PROVISIONAL) items.push("jam operasional");
  if (PACKAGE_NUMBERS_PROVISIONAL) items.push("durasi dan kapasitas paket");
  if (ROOMS_PROVISIONAL) items.push("jumlah dan nama ruangan");
  if (BOOKING_RULES.provisional) items.push("jeda antar sesi dan batas waktu pemesanan");

  if (items.length === 0) return null;

  return (
    <aside
      className={cn(
        "rounded-xl border border-line bg-paper-2 px-4 py-3.5 text-sm leading-relaxed text-ink-2 sm:px-5",
        className,
      )}
    >
      <span className="font-medium text-ink">Data contoh.</span> Nilai untuk {items.join(", ")}{" "}
      di halaman ini masih sementara dan menunggu konfirmasi pemilik studio. Harga,
      alamat, nomor WhatsApp, serta ketentuan pembatalan dan uang muka sengaja
      dibiarkan kosong, bukan ditebak.
    </aside>
  );
}
