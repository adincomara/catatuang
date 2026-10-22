# CatatUang - Financial Tracking Engine (Astro + Cloudflare Pages)

Aplikasi pencatatan keuangan pribadi modern berbasis framework **Astro** dengan desain editorial utilitarian sesuai panduan `desain.md` (Spruce `#008254`, Mint ladder, dan sudut tegas). Mendukung tampilan responsif Web Desktop (1200px container) dan Mobile App Shell, Progressive Web App (PWA) untuk Android & iOS, serta deployment statis ke Cloudflare Pages.

---

## 🔒 Fitur Autentikasi Google Wajib & Isolasi Akun
- **Mandatory Login Gate:** Aplikasi **HANYA** dapat diakses setelah berhasil login dengan akun Google Anda.
- **Partisi Data Mandiri:** Setiap akun Google memiliki ruang penyimpanan `localStorage` terisolasi (`catatuang_u_<email>_*`). Saat berganti akun, data transaksi tidak akan bercampur.
- **Konfigurasi Client ID:** Pengguna dapat menggunakan Google Client ID default atau memasukkan Client ID kustom melalui modal setelan.

---

## 📅 Fitur Custom Periode Tanggal (Date Range)
- **Rentang Waktu Kustom:** Bebas menentukan tanggal mulai (`Dari Tanggal`) dan tanggal selesai (`Sampai Tanggal`).
- **Pilihan Cepat (Presets):**
  - *Bulan Ini*
  - *Bulan Lalu*
  - *7 Hari Terakhir*
  - *30 Hari Terakhir*
  - *Tahun Ini (Januari - Desember)*
- **Kalkulasi Reaktif:** Seluruh saldo, ringkasan arus kas, mutasi transaksi, grafik kategori pengeluaran, dan ekspor spreadsheet otomatis menyesuaikan periode aktif yang dipilih.

---

## 🎨 Desain Berbasis `desain.md` (NerdWallet Style)
- **Palet Warna:** Spruce Green `#008254`, Deep Spruce `#006642`, dan tangga mint (`#effcf8`, `#e3faf2`, `#b7ecda`).
- **Aksen Tegas:** Lime panel `#e8fdac` untuk sorotan badge.
- **Geometri:** Sudut tombol tegas `rounded-[2px]` dengan padding 16px, kartu `rounded-[8px]` dengan hairline border halus, tanpa bayangan tebal.
- **Tipografi:** Kontras tinggi antara heading hitam pekat `#000000` (weight 700) dan teks isi `#3d4045` (weight 300).

---

## 📱 Progressive Web App (PWA) Android & iOS
- **Android:** Dapat diinstal langsung ke Layar Utama (*Add to Home Screen*) melalui prompt browser atau menu Chrome.
- **iOS (Safari):** Mendukung tampilan layar penuh mandiri (`standalone`), safe-area notch padding, dan icon home screen.
- **Service Worker:** Caching network-first untuk performa instan dan ketersediaan offline.

---

## 🚀 Menjalankan Secara Lokal

Pastikan Node.js v18+ atau v20+ terpasang (tersedia `.nvmrc` untuk Node 20):

```bash
# Gunakan node versi 20
nvm use 20

# Install dependensi
npm install

# Jalankan server lokal
npm run dev
```

Buka browser di `http://localhost:4321`.

---

## ☁️ Deployment ke Cloudflare Pages

1. **Push ke Git Repository** (GitHub / GitLab).
2. Di dashboard **Cloudflare Pages**:
   - Klik **Create a project** > **Connect to Git**.
   - Pilih repository `catatuang`.
   - **Framework preset:** `Astro`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variables:** Tambahkan `NODE_VERSION` = `20`
3. Klik **Save and Deploy**. Selesai!

---

## 🧪 Pengujian & Self-Check

Jalankan test assertion logika tanggal dan isolasi storage:

```bash
npm test
```
