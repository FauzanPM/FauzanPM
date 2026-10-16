# Fauzan Prima Mukti — Portfolio

Portofolio DevOps dengan identitas visual **Infrastructure. Made human.** Dibangun ulang menggunakan React, TypeScript, dan Vite. Hasil build berupa berkas statis yang dapat ditempatkan pada hosting statis tanpa backend atau kredensial aplikasi.

## Menjalankan proyek

Gunakan Node.js **22.12 atau lebih baru**.

```bash
npm ci
npm run dev
```

Server pengembangan menggunakan port **5173**. Untuk lingkungan cloud dengan direktori cache bawaan yang tidak dapat ditulis, gunakan `npm ci --cache /tmp/fauzanpm-npm-cache`.

```bash
npm run build        # Pemeriksaan TypeScript dan build ke dist/
npm run preview      # Menjalankan hasil build
npm run typecheck    # Memeriksa tipe tanpa build
npm run format:check # Memeriksa format kode
npm test             # Pengujian browser terhadap hasil build
```

Jalankan `npm run build` sebelum `npm test`. Playwright menjalankan server preview sendiri pada port **4173**. Chromium sistem di `/usr/bin/chromium` digunakan otomatis bila tersedia. Pada mesin lain, pasang browser dengan `npx playwright install chromium`, atau tentukan executable melalui `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

## Pengalaman interaktif

- Visual jaringan dengan proyeksi 3D, tiga lapisan tematik, respons pointer, dan kontrol jeda.
- Filter proyek dan studi kasus yang terhubung ke repositori serta dokumentasi PDF asli.
- Panel keahlian dengan navigasi tab melalui keyboard.
- Simulasi pipeline dengan tahap commit, build, verify, deploy, dan observe. Kegagalan verifikasi menghentikan simulasi sebelum deployment; simulasi tidak menjalankan deployment sungguhan.
- Command palette melalui `Ctrl+K` / `⌘K`, pencarian, panah keyboard, dan Enter.
- Résumé dengan unduhan langsung, email dengan salin ke clipboard, serta profil GitHub dan LinkedIn.
- Layout responsif, native modal dialog, pemulihan fokus, skip link, dan dukungan reduced motion.

## Arsitektur

```text
src/
├── App.tsx                   Komposisi halaman dan satu state overlay
├── components/               Komponen UI berdasarkan fitur
│   ├── Dialog.tsx            Siklus modal, scroll lock, dan fokus
│   ├── CommandPalette.tsx    Pencarian serta navigasi keyboard
│   ├── PipelineLab.tsx       Antarmuka simulasi delivery
│   └── SystemScene.tsx       Adapter React untuk visualisasi
├── data/portfolio.ts         Konten bertipe: profil, proyek, keahlian, pengalaman
├── hooks/                    Preferensi gerak sistem
├── lib/
│   ├── assets.ts             Resolusi aset sesuai base path deployment
│   ├── network-scene.ts      Renderer Canvas dan manajemen resource
│   └── pipeline.ts           Reducer deterministik untuk alur simulasi
└── styles.css                Token desain, cascade layers, dan breakpoint
public/
├── img/                      Gambar asli
└── pdf/                      CV dan dokumentasi proyek asli
tests/portfolio.spec.ts       Tes perilaku dan pemeriksaan aksesibilitas
```

Konten dipisahkan dari tampilan. Satu discriminated union mengelola overlay sehingga command palette, studi kasus, dan résumé tidak terbuka bersamaan. Reducer pipeline memisahkan transisi proses dari waktu dan tampilan.

Renderer visualisasi dimuat melalui lazy import. Ukuran canvas mengikuti container dengan pixel ratio maksimal 2. Render berkelanjutan berhenti ketika visualisasi tidak terlihat, tab browser tersembunyi, pengguna menjeda, atau reduced motion aktif. Observer, timer, dan event listener dibersihkan saat komponen dilepas. Font di-host bersama aplikasi; halaman tidak membutuhkan CDN font.

## Memperbarui konten

Ubah `src/data/portfolio.ts` untuk informasi profil, proyek, keahlian, dan pengalaman. Materi awal bersumber dari situs serta CV yang sudah ada. Letakkan aset publik di `public/`; gunakan `assetUrl()` agar tautan mengikuti base path deployment. Diagram proyek merupakan ilustrasi konseptual, bukan dashboard produksi.

## Validasi

Suite Playwright menjalankan skenario yang sama di desktop dan emulasi mobile: aset/PDF, navigasi, filter proyek, dialog dan fokus, unduhan résumé, command palette, keyboard tabs, kontrol animasi, clipboard, lebar layar kecil, serta keberhasilan dan kegagalan pipeline. Axe memeriksa aturan WCAG A/AA pada halaman dan command palette. Pemeriksaan otomatis ini tidak menggantikan evaluasi manual menggunakan pembaca layar dan perangkat nyata.

CI menjalankan instalasi berdasarkan lockfile, pemeriksaan format, build, dan tes browser. Laporan serta trace kegagalan tersedia sebagai artifact workflow.

## Deployment

Publikasikan isi `dist/` setelah `npm run build`. Untuk hosting di subdirektori, tentukan base path saat build, misalnya:

```bash
npm run build -- --base=/FauzanPM/
```

Navigasi menggunakan hash anchor sehingga tidak membutuhkan rewrite routing. Tidak ada deploy atau publikasi otomatis dalam workflow CI. Kontak menggunakan tautan email; tidak ada layanan pengiriman pesan di server.
