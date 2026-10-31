# TapLink • Google Tap Review Card System

Sistem manajemen dan aktivasi kartu pintar Google Review (NFC + QR Code) untuk bisnis `bancrovtt.web.id`.

---

## 🌟 Fitur Utama

1. **Smart Link Resolver (Otomatis)**:
   - Klien cukup menempelkan link Google Maps usaha mereka (`maps.app.goo.gl/...`, `g.page/...`, atau URL web maps).
   - Sistem otomatis mendeteksi dan mengonversinya menjadi tautan ulasan langsung (`search.google.com/local/writereview?placeid=...` atau `.../review`).
   - Saat pengunjung toko menempelkan HP ke kartu NFC, pop-up bintang 5 langsung muncul seketika!

2. **Aktivasi Mandiri Klien (`/activate`)**:
   - Tampilan mobile-first yang elegan & mudah dipahami.
   - Dilengkapi tutorial 5 detik cara mengambil link profil bisnis dari Google Maps.
   - Ada tombol uji coba langsung sebelum aktivasi disimpan.
   - Opsional: Proteksi kode PIN pada kemasan kartu agar tidak diklaim pihak lain.

3. **Dynamic Redirect Engine (`/c/[id]`)**:
   - Kecepatan redirect kilat (< 200ms).
   - Menghitung counter tap secara realtime (*hit analytics*).
   - Jika kartu belum aktif, otomatis dialihkan ke formulir aktivasi.

4. **Admin Portal & Batch Generator (`/admin`)**:
   - Dilindungi Admin Secret Key (default: `bancroftt2026`).
   - Buat puluhan hingga ratusan kartu baru sekaligus (misal: `TAP-001` s/d `TAP-050`).
   - Ekspor tabel ke file CSV untuk mempermudah penulisan chip NFC dan cetak QR code ke percetakan.
   - Pantau statistik jumlah tap review per klien dan ubah link ulasan kapan saja jika toko pindah lokasi.

---

## 🚀 Panduan Menghubungkan Subdomain DomaiNesia (`taplink.bancrovtt.web.id`)

Karena Anda memiliki domain murni tanpa hosting cPanel, Anda dapat menghosting aplikasi ini di **Vercel** secara **100% GRATIS**:

### Langkah 1: Deploy ke Vercel
1. Upload folder `taplink` ini ke repository GitHub Anda (bisa private).
2. Buka [https://vercel.com](https://vercel.com) (login dengan akun GitHub).
3. Klik **"Add New Project"** dan pilih repository `taplink`.
4. Masukkan Environment Variable (opsional):
   - `ADMIN_SECRET`: Kata sandi rahasia admin Anda (misal: `bancroftt2026`).
5. Klik **"Deploy"** (selesai dalam 1 menit).

### Langkah 2: Setting DNS di DomaiNesia
1. Buka [Client Area DomaiNesia](https://client.domainesia.com).
2. Masuk ke menu **Domains** -> Pilih `bancrovtt.web.id` -> Klik **DNS Management**.
3. Tambahkan 1 DNS Record baru:
   - **Type**: `CNAME`
   - **Host Name / Subdomain**: `taplink`
   - **Value / Destination**: `cname.vercel-dns.com`
   - **TTL**: `14400` atau `Default`
4. Simpan record.
5. Kembali ke Dashboard Vercel project Anda -> Buka **Settings** -> **Domains** -> Masukkan `taplink.bancrovtt.web.id`.
6. Selesai! Subdomain Anda langsung aktif dengan SSL HTTPS gratis otomatis.

---

## 📱 Panduan Produksi Kartu Fisik NFC

1. **Beli Kartu NFC:**
   - Gunakan tipe chip **NTAG213** (kapasitas 144 bytes) atau **NTAG215** (504 bytes). Keduanya kompatibel dengan semua iPhone dan Android yang mendukung NFC.
2. **Cara Mengisi Link ke Chip NFC:**
   - Download aplikasi gratis **NFC Tools** di Google Play Store atau Apple App Store.
   - Buka NFC Tools -> Pilih tab **Write** -> **Add a record** -> **URL / URI**.
   - Masukkan link kartu unik Anda, contoh:
     `https://taplink.bancrovtt.web.id/c/TAP-001`
   - Tempelkan kartu NFC ke belakang HP Anda -> Klik **Write**.
3. **Cetak QR Code di Belakang Kartu:**
   - Di balik kartu fisik, sertakan QR Code yang mengarah ke link yang sama (`https://taplink.bancrovtt.web.id/c/TAP-001`) sebagai alternatif jika HP pelanggan tidak memiliki fitur NFC.
