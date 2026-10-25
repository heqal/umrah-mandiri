# Panduan Umrah Mandiri (webapp statis)

Tanpa build, tanpa server. Bisa dibuka langsung dari `index.html` di komputer, dan bisa diupload ke Netlify.

## Upload ke Netlify
1. Buka https://app.netlify.com/drop
2. Seret folder `umrah-webapp` (atau file ZIP-nya setelah di-ekstrak) ke halaman itu.
3. Selesai. Buka alamatnya di HP, lalu "Tambahkan ke layar utama" agar bisa dipakai offline.

Untuk memperbarui: seret lagi folder yang sudah diedit ke Netlify (di situs yang sama: Deploys → drag & drop).

## Mengedit isi
Semua isi ada di **`data/content.js`** (format JSON biasa).
- `meta`: judul, subjudul, catatan kaki.
- `tabs`: daftar tab. Hapus satu baris untuk menyembunyikan tab itu, atau ubah `label` untuk mengganti namanya.
- `hariInfo`: nama kota dan judul tiap hari.
- `itinerary`: langkah-langkah. Setiap langkah punya `id` unik (dipakai untuk centang). Untuk menambah langkah, salin satu blok `{ ... }` dan beri `id` baru, misalnya `"h3-9"`.
- `bacaan`: bacaan dan doa. Kode seperti `B8` yang ditulis di kolom `bacaan`/`doa` pada itinerary otomatis menjadi tombol yang membuka bacaan tersebut.
- `shalat`, `lokasi`, `rukun`, `catatan`: sisa tab.

Tips: gunakan tanda kutip ganda `"`, jangan taruh koma setelah elemen terakhir, dan tulis baris baru sebagai `\n`.
Jika aplikasi tampil kosong setelah diedit, biasanya ada tanda kutip atau koma yang salah; periksa file di https://jsonlint.com (salin isi setelah `window.UMRAH_DATA =` tanpa titik koma).

## Mengedit tema
Buka **`css/theme.css`**. Ubah warna (`--accent`, `--gold`, `--bg`, dst.), font (`--font-body`, `--font-arab`), ukuran teks, dan lebar konten. Ada bagian terpisah untuk mode gelap.
Tata letak ada di `css/style.css` (biasanya tidak perlu diubah). Warna di `manifest.webmanifest` dan `<meta name="theme-color">` di `index.html` mengatur warna bilah browser di HP.

## Fitur
- Itinerary per hari dengan centang kemajuan (tersimpan di perangkat), pencarian, dan tombol kode bacaan.
- Bacaan dan doa (Arab, Latin, arti) dengan tombol A−/A+ dan saklar Latin/Arti.
- Shalat fardhu dan sunnah, lokasi berdoa, rukun dan larangan, catatan.
- Mode terang/gelap/otomatis, bisa dipasang sebagai aplikasi, dan bisa dipakai offline setelah dibuka sekali dengan internet.

## Struktur folder
```
index.html              kerangka halaman
css/theme.css           TEMA (warna, font, ukuran)
css/style.css           tata letak
data/content.js         ISI (itinerary, bacaan, shalat, lokasi, ...)
js/app.js               logika
sw.js                   cache offline
manifest.webmanifest    pengaturan "pasang sebagai aplikasi"
icon.svg                ikon
_headers                aturan cache untuk Netlify
```
