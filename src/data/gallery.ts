/**
 * Gallery.
 *
 * Every entry is an empty slot. The graphics are generated geometric
 * placeholders, not photographs: nothing here pretends to be the result of a
 * real session and no faces appear anywhere. Using another studio's photos is a
 * real problem in this industry, so the slots stay empty until the studio hands
 * over its own files.
 */
export type GalleryCategory = { id: string; label: string };

export const GALLERY_CATEGORIES: GalleryCategory[] = [
  { id: "semua", label: "Semua" },
  { id: "self-photo", label: "Self Photo" },
  { id: "keluarga", label: "Keluarga" },
  { id: "produk", label: "Produk" },
  { id: "sewa-ruangan", label: "Sewa Ruangan" },
];

export type GalleryItem = {
  id: string;
  category: string;
  /** Aspect ratio of the slot, so the layout is final before the photos land. */
  ratio: "3:4" | "4:3" | "1:1";
  graphic: string;
  /** Describes the placeholder, never a photo that does not exist. */
  alt: string;
};

const RATIOS: GalleryItem["ratio"][] = ["3:4", "4:3", "1:1", "4:3", "1:1", "3:4"];

function build(category: string, count: number, offset: number): GalleryItem[] {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    return {
      id: `${category}-${n}`,
      category,
      ratio: RATIOS[(index + offset) % RATIOS.length],
      graphic: `/graphics/gallery-${category}-${n}.svg`,
      alt: `Slot galeri kosong untuk kategori ${category}, nomor ${n}. Belum diisi foto.`,
    };
  });
}

export const GALLERY_ITEMS: GalleryItem[] = [
  ...build("self-photo", 4, 0),
  ...build("keluarga", 4, 2),
  ...build("produk", 4, 4),
  ...build("sewa-ruangan", 3, 1),
];

export const GALLERY_IS_PLACEHOLDER = true;
