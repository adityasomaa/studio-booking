# Studio Booking

Situs pemesanan sesi untuk studio foto. Inti situs ini adalah **jadwal yang tidak
boleh bentrok**: satu ruangan hanya bisa dipakai satu pemesan pada satu rentang
waktu, dan seluruh sisi lain dari situs dibangun mengelilingi aturan itu.

- Produksi: https://studiobooking.onyxcreative.asia
- Stack: Next.js 16 (App Router) - React 19 - TypeScript - Tailwind CSS v4 - Lenis
- Tanpa payment gateway, tanpa basis data. Lihat "Apa yang nyata dan apa yang
  masih lokal" di bawah.

---

## 1. Nama studio masih sementara

Nama resmi studio belum diberikan. Situs ini memakai nama kerja **"Studio Booking"**
sebagai satu konstanta:

```ts
// src/config/site.ts
export const STUDIO_NAME = "Studio Booking";
```

Mengganti satu baris itu akan mengubah judul halaman, wordmark di header dan
footer, gambar Open Graph, structured data, dan seluruh pesan WhatsApp sekaligus.

## 2. Riset kontak

Instruksinya jelas: cari dulu kontak resmi di Google sebelum memakai placeholder.
**Riset itu tidak bisa dilakukan, dan hasilnya nol.**

Alasannya: studio ini belum teridentifikasi. Yang diketahui hanya bahwa
pemiliknya memasang lowongan di Threads. Tidak ada nama studio, tidak ada
username, tidak ada kota, tidak ada tautan postingan. Pencarian yang dilakukan
("studio foto cari jasa website booking, kirim portofolio", lewat Threads dan
Google) hanya mengembalikan artikel jasa pembuatan website dan direktori studio
umum, tidak ada satu pun yang bisa dipastikan milik klien ini.

Konsekuensinya, dan ini disengaja:

- Nomor WhatsApp, alamat, tautan Google Maps, Instagram, dan surel semuanya
  `null` di `src/config/studio.ts`.
- Tidak ada nomor yang diambil dari direktori pihak ketiga, tidak ada nomor
  pribadi yang dipakai, dan tidak ada tebakan.
- Begitu nama studio diberikan, riset ini bisa dilakukan dalam hitungan menit dan
  hasilnya cukup ditulis ke satu file konfigurasi.

Kalau nanti data diambil dari halaman resmi milik studio, catat sumbernya di sini
(misal: "nomor WhatsApp dari bio Instagram @namastudio, diakses 26 Agustus 2026").

## 3. Data yang belum diisi, dan data yang masih contoh

Ada dua kategori berbeda, dan keduanya ditandai jelas di antarmuka.

### Kosong sama sekali, tidak ditebak

Ditampilkan sebagai lencana "Belum diisi", tidak pernah sebagai angka.

| Data | Lokasi |
|---|---|
| Harga tiap paket | `src/data/packages.ts` (`priceIdr: null`) |
| Nomor WhatsApp | `src/config/studio.ts` (`CONTACT.whatsappNumber`) |
| Alamat, Maps, Instagram, surel | `src/config/studio.ts` (`CONTACT`) |
| Ketentuan uang muka | `src/config/studio.ts` (`POLICY.deposit`) |
| Ketentuan pembatalan | `src/config/studio.ts` (`POLICY.cancellation`) |
| Ketentuan penjadwalan ulang | `src/config/studio.ts` (`POLICY.reschedule`) |
| Ketentuan keterlambatan | `src/config/studio.ts` (`POLICY.lateArrival`) |
| Zona waktu studio | `src/config/studio.ts` (`TIMEZONE`) |
| Deskripsi tiap ruangan | `src/data/rooms.ts` |

Ketentuan pembatalan dan uang muka sengaja dibiarkan kosong. Dua hal itu yang
paling sering jadi sengketa, dan salah tulis di sana lebih berbahaya daripada
tidak menulis apa pun. Halaman `/terms` menyebutkan secara netral bahwa keduanya
akan diisi pemilik studio.

### Contoh sementara, supaya sistem bisa jalan

Angka-angka ini dibutuhkan agar slot bisa dihitung sama sekali. Semuanya diberi
label "Data contoh" di halaman yang menampilkannya.

| Data | Nilai sekarang | Lokasi |
|---|---|---|
| Jam operasional | Sen-Kam 10.00-20.00, Jum 10.00-21.00, Sab 09.00-21.00, Min 10.00-18.00 | `OPENING_HOURS` |
| Durasi paket | 30 / 60 / 90 / 60 menit | `src/data/packages.ts` |
| Maksimal orang | 4 / 10 / 3 / 8 | `src/data/packages.ts` |
| Jumlah ruangan | 2 (Ruang 1, Ruang 2) | `src/data/rooms.ts` |
| Jeda antar sesi | 15 menit | `BOOKING_RULES.bufferMinutes` |
| Jarak minimal pemesanan | 3 jam | `BOOKING_RULES.minLeadTimeHours` |
| Jarak maksimal pemesanan | 60 hari | `BOOKING_RULES.maxAdvanceDays` |

Situs tetap masuk akal kalau `ROOMS` hanya berisi satu entri: pemilih ruangan
menyusut jadi satu nilai tetap dan jadwal terbaca sebagai satu kolom.

### Yang sengaja tidak ada

Tidak ada nama fotografer, jumlah klien, daftar brand, testimoni, rating, tahun
berdiri, maupun klaim "terbaik" atau "terlengkap" di mana pun. Tidak satu pun dari
itu diketahui, jadi tidak satu pun ditulis.

---

## 4. Mesin jadwal

Semua aturan ada di `src/lib/schedule.ts`, dan dipakai ulang apa adanya oleh
formulir, kalender, halaman admin, serta route `/api/booking`.

Slot dihitung dari **jam operasional dibagi (durasi paket + jeda)**. Satu slot
terkunci kalau salah satu benar:

1. **Bentrok penuh atau sebagian** dengan pemesanan aktif di ruangan yang sama.
   Pemesanan dilebarkan sebesar jeda ke kiri dan ke kanan, lalu diuji dengan
   perbandingan rentang setengah terbuka, sehingga slot yang hanya menabrak
   sebagian ikut terkunci, bukan cuma yang jamnya persis sama.
2. **Kena blokir manual** dari halaman admin. Blokir tidak dilebarkan dengan
   jeda: kalau pemilik memblokir 13.00 sampai 15.00, itulah yang diblokir.
3. **Sudah lewat**, termasuk jam yang sudah berlalu di hari ini.
4. **Terlalu dekat**, yaitu mulai kurang dari `minLeadTimeHours` dari sekarang.

Mengganti paket berarti durasi berubah, jadi daftar slot **dihitung ulang dari
nol**, bukan disaring dari pilihan sebelumnya. Kisi 30 menit dan kisi 60 menit
menghasilkan jam-jam yang berbeda, bukan subset satu sama lain. Slot yang sudah
dipilih akan dilepas otomatis kalau tidak ada di kisi yang baru.

Perhitungan "sudah lewat" memakai jam sungguhan lewat `useNow()`, yang menyegarkan
diri dengan `setInterval` dan pada setiap `visibilitychange` serta `focus`. Tidak
ada akumulasi frame di mana pun, jadi tab yang ditinggal berjam-jam tetap benar
saat dibuka lagi.

Zona waktu memakai jam perangkat pengunjung selama `TIMEZONE` masih `null`. Ini
benar untuk pengunjung lokal dan meleset sebesar selisih zona untuk pengunjung
dari luar. Isi `TIMEZONE` untuk mengunci ke jam studio.

## 5. Apa yang nyata dan apa yang masih lokal

Jujur soal ini penting, jadi ditulis lugas.

**Nyata dan berjalan:**

- Seluruh perhitungan slot, aturan bentrok, aturan jam lewat, dan aturan jarak
  pemesanan.
- Validasi formulir, di peramban **dan** di server (`/api/booking`), memakai
  fungsi yang sama persis (`src/lib/validation.ts`), jadi aturannya tidak bisa
  berbeda antara keduanya.
- Penyusunan pesan WhatsApp, lengkap dengan URL halaman asal.
- Cookie consent yang benar-benar mengubah perilaku penyimpanan.

**Masih lokal:**

- Pemesanan disimpan di **penyimpanan lokal peramban pengunjung**, bukan di
  server. Dua orang di dua perangkat tidak saling melihat pemesanan masing-masing.
  Halaman admin juga hanya melihat data di perangkat yang sedang dipakai.
- Karena penyimpanan server masih kosong, yang bisa dibuktikan `/api/booking` hari
  ini adalah bentuk data, keberadaan paket dan ruangan, jam operasional,
  keselarasan dengan kisi slot, aturan jam lewat, dan aturan jarak pemesanan.
  Deteksi bentrok dengan pemesanan orang lain aktif begitu basis data tersambung,
  tanpa mengubah route itu.
- Halaman `/admin` tidak terkunci dan tidak ada login.

**Cara menyambungkan basis data:** isi `src/lib/store/remote.ts` (kontrak
endpoint-nya sudah ditulis di komentar file itu), lalu ubah satu baris:

```ts
// src/lib/store/index.ts
export const STORE_MODE: "local" | "remote" = "remote";
```

Formulir booking, kalender, pemilih slot, dan halaman admin tidak perlu disentuh.

## 6. Pembayaran

Tidak ada payment gateway, dan itu disengaja. Kalau nanti ada uang muka, urusannya
lewat WhatsApp.

Lapisan adapter kosongnya sudah disiapkan di `src/lib/payment/adapter.ts`. Alur
booking sudah memanggil `requestPayment()` dan memperlakukan `"not-configured"`
sebagai hasil normal, jadi menambahkan penyedia pembayaran nanti berarti mengisi
satu adapter dan memanggil `registerPaymentAdapter()`, bukan membongkar alur
booking.

## 7. Gambar

Semua gambar dibuat sendiri oleh `scripts/generate-graphics.mjs`, deterministik
dari seed, dan mengambil warnanya langsung dari token di `globals.css`. Jalankan
ulang kapan saja:

```bash
npm run graphics
```

- Bahasa bentuknya bidang, cahaya, dan bingkai. Kedalaman visual datang dari
  gradasi halus, garis tipis, dan permainan kontras.
- **Tidak ada grain, noise, film grain, atau tekstur bintik** di mana pun, baik di
  loader maupun di bagian lain situs.
- Tidak ada gambar yang berpura-pura jadi foto hasil sesi sungguhan, dan tidak ada
  wajah orang. Memakai foto hasil studio lain adalah masalah nyata di industri
  ini, jadi galeri sengaja berisi bingkai kosong yang ditandai jelas sebagai
  contoh susunan.
- Gambar Open Graph memakai wordmark studio, dirender oleh `next/og` dengan
  Neue Montreal. Site icon berlatar transparan, tanpa plat di belakangnya.

`images.unoptimized = true` diset sejak awal di `next.config.ts`. Kuota Vercel
Image Optimization di akun ini sudah habis; kalau optimizer menyala, setiap
permintaan `/_next/image` menjawab 402 dan produksi tampil tanpa satu pun gambar.

## 8. Font

Neue Montreal, di-host sendiri sebagai WOFF2.

```bash
npm run fonts
```

Skrip itu membaca `C:\Users\User\Downloads\NEUE MONTREAL\` dan menulis
`public/fonts/*.woff2`. Dua berat dipakai: Regular (400) untuk teks dan Medium
(500) untuk judul, supaya hierarki datang dari berat dan ukuran, bukan dari ukuran
saja. Berkas `.ttf` di `src/assets/` hanya dipakai oleh route gambar Open Graph,
yang butuh format non-WOFF2.

## 9. Aksesibilitas

- Seluruh 17 pasangan warna yang benar-benar dipakai antarmuka diperiksa satu per
  satu terhadap WCAG AA lewat `npm run audit:contrast`. Semuanya lolos.
- Status slot (tersedia, dipilih, terisi, diblokir, lewat, terlalu dekat) dan
  status hari (kosong, sebagian, penuh, tutup) selalu punya **label teks**, tidak
  pernah dibedakan lewat warna saja.
- Pemilih slot bisa dioperasikan penuh dari papan ketik: panah empat arah,
  Home, End, Enter, dan Spasi. Slot yang tidak tersedia tetap bisa difokus dan
  ditandai `aria-disabled`, supaya pembaca layar menyebutkan alasannya, bukan
  melompatinya diam-diam.
- Semua dropdown adalah pola ARIA listbox sungguhan, bukan `<select>` bawaan:
  panah, Home, End, type-ahead, Enter, Spasi, Escape, dan fokus kembali ke
  pemicu.
- Animasi teks per huruf memakai satu `aria-label` di induk, dengan setiap huruf
  `aria-hidden`.
- Ada skip link, dan `prefers-reduced-motion` mematikan animasi serta smooth
  scroll.

## 10. Lapisan, overflow, dan scroll

- Satu skala z-index sebagai token di `globals.css`, urutannya: konten <
  popover dalam alur < sticky header < menu seluler < lightbox dan kalender <
  cookie banner < tirai transisi < skip link. **Nol z-index mentah** di seluruh
  kode, dijaga oleh `npm run audit:layers`.
- Lightbox galeri dan panel tanggal kalender dirender lewat portal ke `body`,
  sehingga tidak terpotong induk yang memotong overflow dan tidak terkubur
  konteks penumpukan induk. Keduanya mengunci scroll body saat terbuka dan
  mengembalikannya saat ditutup.
- Grid kalender tujuh kolom diganti **daftar tanggal berurutan** di bawah 640px,
  bukan dipaksa muat.
- Cookie banner tidak pernah muncul di atas menu seluler atau di atas overlay:
  banner disembunyikan selama salah satunya terbuka. Pembungkusnya tidak menerima
  pointer event, hanya kartunya, jadi tidak menelan ketukan.
- Honeypot formulir memakai `clip-path`, bukan `left: -9999px`.
- Semua CSS custom ada di dalam `@layer`, jadi tidak menimpa utility Tailwind.
- Lenis hanya aktif di desktop dengan pointer presisi, dan berhenti selama ada
  overlay terbuka.

## 11. Transisi

Urutannya selalu: halaman menutup, konten berganti di balik tirai, scroll kembali
ke atas, halaman membuka. Ada dua tirai: yang panjang dengan wordmark untuk
kunjungan pertama dan untuk perpindahan ke halaman Home, dan yang pendek dengan
nama halaman tujuan untuk perpindahan lain.

Setiap langkah menunggu lewat `settle()`, yang **membalapkan `setTimeout` dengan
loop `requestAnimationFrame`**. rAF berhenti total kalau tab dipindah ke latar
belakang; rangkaian yang bergantung pada rAF saja akan membeku dan tirainya
tersangkut selamanya. Ada juga watchdog 2,6 detik yang membuka tirai apa pun yang
terjadi pada rute.

## 12. Perintah

```bash
npm run dev              # pengembangan
npm run build            # regenerasi grafis lalu build produksi
npm run start            # jalankan hasil build
npm run graphics         # regenerasi seluruh SVG placeholder
npm run fonts            # konversi ulang TTF ke WOFF2
npm run audit            # audit kontras warna dan audit z-index
```

## 13. Struktur

```
src/
  config/    site.ts, studio.ts        <- ganti data studio di sini
  data/      rooms.ts, packages.ts, gallery.ts
  lib/
    schedule.ts     aturan bentrok
    validation.ts   dipakai klien dan server
    whatsapp.ts     penyusun pesan
    store/          adapter data: local.ts, remote.ts (kosong), index.ts
    payment/        adapter pembayaran kosong
  components/
  app/       route, sitemap, robots, icon, opengraph-image, api/booking
scripts/     generate-graphics.mjs, convert-fonts.py, audit-*.mjs
```
