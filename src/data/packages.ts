import { type Pending } from "@/lib/unset";

/**
 * Session packages.
 *
 * The four categories below are the ones the studio owner named. Everything
 * numeric about them is not confirmed:
 *
 *  - `priceIdr` is null on purpose. No price is displayed anywhere on this site.
 *  - `durationMinutes` and `maxPeople` are marked provisional. They are needed
 *    for the slot maths to run at all, so they carry placeholder values and the
 *    UI labels them as examples.
 */
export const PACKAGE_NUMBERS_PROVISIONAL = true;

export type Package = {
  id: string;
  name: string;
  /** Neutral one-liner. Says what the session is, not how good it is. */
  summary: string;
  /** Minutes of studio time the booking occupies. PROVISIONAL. */
  durationMinutes: number;
  /** Maximum people in the room for this package. PROVISIONAL. */
  maxPeople: number;
  /** Always null until the owner sets prices. Never guess. */
  priceIdr: Pending<number>;
  /** What is included. Empty until the owner confirms it. */
  includes: string[];
  /** Gallery category this package maps to. */
  galleryCategory: string;
  graphic: string;
};

export const PACKAGES: Package[] = [
  {
    id: "self-photo",
    name: "Self Photo",
    summary:
      "Sesi foto mandiri di dalam ruang studio. Kamera dan pencahayaan sudah disiapkan, pengunjung mengatur pose sendiri.",
    durationMinutes: 30,
    maxPeople: 4,
    priceIdr: null,
    includes: [],
    galleryCategory: "self-photo",
    graphic: "/graphics/package-self-photo.svg",
  },
  {
    id: "foto-keluarga",
    name: "Foto Keluarga",
    summary:
      "Sesi foto bersama untuk keluarga atau kelompok kecil, dengan latar dan penataan cahaya yang disiapkan sebelum sesi dimulai.",
    durationMinutes: 60,
    maxPeople: 10,
    priceIdr: null,
    includes: [],
    galleryCategory: "keluarga",
    graphic: "/graphics/package-foto-keluarga.svg",
  },
  {
    id: "foto-produk",
    name: "Foto Produk",
    summary:
      "Pemotretan barang untuk katalog atau toko online, memakai meja produk dan latar polos di dalam studio.",
    durationMinutes: 90,
    maxPeople: 3,
    priceIdr: null,
    includes: [],
    galleryCategory: "produk",
    graphic: "/graphics/package-foto-produk.svg",
  },
  {
    id: "sewa-ruangan",
    name: "Sewa Ruangan per Jam",
    summary:
      "Menyewa ruang studio beserta perlengkapan yang tersedia, untuk pemotretan yang dibawa sendiri oleh penyewa.",
    durationMinutes: 60,
    maxPeople: 8,
    priceIdr: null,
    includes: [],
    galleryCategory: "sewa-ruangan",
    graphic: "/graphics/package-sewa-ruangan.svg",
  },
];

export function getPackage(id: string): Package | undefined {
  return PACKAGES.find((pkg) => pkg.id === id);
}

export const DEFAULT_PACKAGE_ID = PACKAGES[0]?.id ?? "";
