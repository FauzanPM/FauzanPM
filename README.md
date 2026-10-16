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

- Globe dengan proyeksi 3D, respons arah kursor, drag dua sumbu, momentum, serta kontrol jeda/reset. Di ponsel, geser horizontal untuk memutar dan vertikal untuk scroll halaman; keyboard mendukung panah serta Home.
- Delapan node tools ikut berputar bersama globe dan tertutup bertahap oleh siluet globe saat berada di belakangnya. Klik bagian yang terlihat untuk membaca fungsi, penggunaan dalam workflow, dan dokumentasi resmi. Fokus keyboard membawa tools yang tertutup ke depan. Rotasi berhenti saat node disorot, difokuskan melalui keyboard, atau panel deskripsi dibaca.
- Light/dark mode dengan animasi lingkaran yang menyebar dari tombol tema. Pilihan tersimpan antar kunjungan; browser tanpa View Transitions memakai gelombang dan transisi warna, sedangkan reduced motion menonaktifkan animasi.
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
│   ├── ThemeToggle.tsx       Tema persisten dan transisi radial
│   └── SystemScene.tsx       Adapter React untuk visualisasi
├── data/
│   ├── portfolio.ts          Konten bertipe: profil, proyek, keahlian, pengalaman
│   └── technologies.ts       Posisi node, fungsi tools, penggunaan, dan dokumentasi
├── hooks/                    Preferensi gerak sistem
├── lib/
│   ├── assets.ts             Resolusi aset sesuai base path deployment
│   ├── network-scene.ts      Renderer Canvas dan manajemen resource
│   ├── scene-math.ts         Rotasi quaternion dan proyeksi koordinat bersama
│   └── pipeline.ts           Reducer deterministik untuk alur simulasi
├── styles.css                Token desain, cascade layers, dan breakpoint
└── theme.css                 Palet terang dan animasi perpindahan tema
public/
├── img/                      Gambar asli
└── pdf/                      CV dan dokumentasi proyek asli
tests/                       Tes halaman, interaksi globe, tema, dan aksesibilitas
```

Konten dipisahkan dari tampilan. Satu discriminated union mengelola overlay sehingga command palette, studi kasus, dan résumé tidak terbuka bersamaan. Reducer pipeline memisahkan transisi proses dari waktu dan tampilan.

Renderer visualisasi dimuat melalui lazy import. Ukuran canvas mengikuti container dengan pixel ratio maksimal 2. Render berkelanjutan berhenti ketika visualisasi tidak terlihat, tab browser tersembunyi, pengguna menjeda, atau reduced motion aktif. Observer, timer, dan event listener dibersihkan saat komponen dilepas. Font di-host bersama aplikasi; halaman tidak membutuhkan CDN font.

Canvas dan tombol tools menggunakan transformasi quaternion yang sama, sehingga orientasi bertahan saat lapisan atau tema berubah. Clip path mengikuti siluet perspektif globe untuk menutup bagian kartu di belakangnya sekaligus mengecualikan area tersebut dari klik. Tombol tetap berupa elemen HTML untuk fokus keyboard dan pembaca layar. Tema dipulihkan sebelum halaman digambar untuk menghindari kilatan palet yang salah saat reload. Saat transisi tema, canvas mengganti palet sebelum snapshot diambil dan rotasi ditahan sampai snapshot dihapus agar tampilan tidak melompat di akhir animasi.

## Memperbarui konten

Ubah `src/data/portfolio.ts` untuk informasi profil, proyek, keahlian, dan pengalaman. Materi awal bersumber dari situs serta CV yang sudah ada. Letakkan aset publik di `public/`; gunakan `assetUrl()` agar tautan mengikuti base path deployment. Diagram proyek merupakan ilustrasi konseptual, bukan dashboard produksi.

Ubah `src/data/technologies.ts` untuk node tools, deskripsi penggunaan, tautan dokumentasi, dan posisi awal dalam ruang 3D.

## Validasi

Suite Playwright mencakup desktop dan emulasi mobile: aset/PDF, navigasi, filter proyek, dialog dan fokus, unduhan résumé, command palette, keyboard tabs, clipboard, lebar layar kecil, serta keberhasilan dan kegagalan pipeline. Tes globe memeriksa drag mouse, gesture sentuh, proyeksi node, jeda/reset, reduced motion, dan deskripsi tools. Tes tema memeriksa animasi radial, fallback, persistensi, serta storage yang tidak tersedia. Axe memeriksa aturan WCAG A/AA pada halaman dan dialog dalam kedua tema. Pemeriksaan otomatis ini tidak menggantikan evaluasi manual menggunakan pembaca layar dan perangkat nyata.

CI menjalankan instalasi berdasarkan lockfile, pemeriksaan format, build, dan tes browser. Laporan serta trace kegagalan tersedia sebagai artifact workflow.

## Deployment

Publikasikan isi `dist/` setelah `npm run build`. Untuk hosting di subdirektori, tentukan base path saat build, misalnya:

```bash
npm run build -- --base=/FauzanPM/
```

Navigasi menggunakan hash anchor sehingga tidak membutuhkan rewrite routing. Tidak ada deploy atau publikasi otomatis dalam workflow CI. Kontak menggunakan tautan email; tidak ada layanan pengiriman pesan di server.
