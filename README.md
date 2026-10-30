# UMKM MANAGEMENT — Forum UMKM KUAT Kecamatan Tangerang

Sistem Informasi Manajemen Terpadu & Portal Publik Resmi untuk **Forum UMKM KUAT (Kreatif, Unggul, Aktif, Teladan) Kecamatan Tangerang, Kota Tangerang**.

Aplikasi ini menggabungkan:
1. **Portal Publik**: Akses informasi profil organisasi, direktori UMKM terverifikasi di 8 kelurahan, agenda kegiatan/bazar, kabar berita wirausaha, kontak, dan formulir pendaftaran anggota mandiri online dengan pencetakan Kartu Tanda Anggota (KTA) instan.
2. **Dashboard Manajemen Eksekutif & Admin (RBAC)**: Pengelolaan menyeluruh keanggotaan pelaku usaha, pencatatan buku kas umum (BKU), iuran bulanan anggota, persetujuan dan riwayat transaksi, upload nota/bukti transfer, laporan berstandar formal cetak/PDF, publikasi agenda & berita, serta pengaturan struktur kepengurusan resmi organisasi.

---

## 🏛️ Struktur Kepengurusan Resmi Organisasi

| No | Jabatan / Peran | Nama Lengkap & Gelar | Keterangan / Instansi |
|----|-----------------|----------------------|-----------------------|
| 1 | **Pelindung** | **Riswan Setyo Kardinto, S.STP** | Camat Kecamatan Tangerang |
| 2 | **Penasihat** | **Ibu Hj. DEWI SUBARSIH** | Tokoh Penggerak & Pembina UMKM Kota Tangerang |
| 3 | **Ketua** | **EMus Muslihant** | Ketua Forum UMKM KUAT Kecamatan Tangerang |
| 4 | **Wakil Ketua** | **Ferry Juni Purwanto** | Koordinator Pengembangan Usaha & Kemitraan |
| 5 | **Sekretaris** | **DIna Fatrian S.I.Kom** | Administrasi, Kesekretariatan & Kehumasan |
| 6 | **Bendahara** | **Peni Martin** | Pengelolaan Kas, Iuran & Keuangan Forum |

*(Dapat disunting dan diperbarui sewaktu-waktu oleh Super Admin melalui menu **Pengaturan & Struktur Organisasi** di Dashboard Admin)*.

---

## 🌟 Fitur Utama

### 1. Website Publik (Tanpa Perlu Login)
- **Beranda**:
  - Motto resmi: *"KUAT (Kreatif, Unggul, Aktif, Teladan)"*.
  - Redaksi resmi portal kemitraan 8 kelurahan.
  - Statistik langsung jumlah anggota, kelurahan, event, dan berita.
  - Sorotan agenda bazar Cisadane & kabar pembinaan UMKM terkini.
- **Profil Organisasi**:
  - Susunan 6 pimpinan resmi dengan foto profil, kartu nama, gelar, dan deskripsi jabatan.
  - Visi, Misi, dan penjabaran 4 pilar semboyan **K-U-A-T**.
  - Peta sebaran 8 kelurahan: *Babakan, Buaran Indah, Cikokol, Kelapa Indah, Suka Asih, Sukarasa, Sukasari, dan Tanah Tinggi*.
- **Direktori UMKM**:
  - Pencarian cepat nama usaha atau produk unggulan.
  - Filter kategori usaha (Kuliner, Fashion & Tekstil, Kriya, Jasa, Pertanian, dll) dan filter kelurahan.
  - Menjaga privasi: hanya data yang diizinkan tampil (`isPublicDirectory === true`) yang dapat dilihat publik.
  - Tombol WhatsApp langsung ke pelaku usaha.
- **Event & Agenda Kegiatan**:
  - Jadwal pelatihan digital marketing, kurasi produk, pameran, dan bazar UMKM Cisadane.
- **Kabar Berita & Edukasi Wirausaha**:
  - Artikel strategi bisnis, perizinan NIB, dan sertifikasi halal.
- **Formulir Pendaftaran Anggota Baru Online**:
  - Pelaku UMKM di 8 kelurahan dapat mendaftar mandiri.
  - Dilengkapi fitur upload pas foto 3x4 dan foto produk.
  - Validasi NIK dan No. HP anti-duplikasi.
  - **KTA Otomatis**: Seketika formulir tersimpan, Kartu Tanda Anggota langsung dibuat otomatis dengan nomor keanggotaan unik (`KUAT-TNG-2026-XXXX`) dan siap diunduh/dicetak depan-belakang sebagai PDF.
- **Kontak & Layanan**:
  - Saluran WhatsApp pengurus, alamat sekretariat Kecamatan Tangerang, dan formulir pesan masyarakat.

---

### 2. Dashboard Admin & Pengurus (Role-Based Access Control)
- **6 Tingkatan Hak Akses (RBAC)**:
  1. `super_admin`: Pemegang kewenangan penuh seluruh modul, konfigurasi pengguna, database, dan struktur organisasi.
  2. `pengurus_kecamatan`: Akses eksekutif, validasi keanggotaan, statistik wilayah, dan penerbitan event.
  3. `admin_keanggotaan`: Pendataan UMKM, legalitas usaha (NIB/Halal/P-IRT), dan manajemen direktori.
  4. `bendahara`: Pencatatan kas masuk/keluar, rekap iuran bulanan, upload nota/bukti transaksi, dan buku kas.
  5. `admin_informasi`: Pengelolaan artikel berita, dokumentasi kegiatan, dan publikasi agenda bazar.
  6. `pengurus_kelurahan`: Pendataan khusus pelaku usaha di kelurahannya.
- **Manajemen Keanggotaan**:
  - Tambah, ubah, nonaktifkan, dan hapus anggota.
  - Upload dan pratinjau pas foto anggota serta foto produk.
  - Tombol cetak KTA pada setiap baris data anggota.
  - Tombol **"Bagikan Link Pendaftaran"** dengan opsi Salin Tautan & Kirim langsung ke WhatsApp grup RT/RW.
  - Cetak Dokumen PDF resmi data anggota per kelurahan lengkap dengan tanda tangan Ketua & Sekretaris.
  - Ekspor data format CSV / Excel.
- **Manajemen Keuangan & Buku Kas**:
  - Pencatatan Pemasukan (Debit) & Pengeluaran (Kredit).
  - Upload gambar nota / foto bukti transfer langsung dari kamera atau galeri dengan thumbnail pratinjau.
  - Perhitungan saldo kumulatif (*running balance*) otomatis.
  - Tab Rekapitulasi Iuran Anggota.
  - Cetak Dokumen Formal Buku Kas Umum (BKU) dengan tanda tangan Ketua & Bendahara.
  - Ekspor rekapitulasi transaksi ke format CSV.
- **Laporan Komprehensif**:
  - 8 Format laporan: Keanggotaan, Kelurahan, Kategori Usaha, Pertumbuhan, Keuangan, Buku Kas, Iuran Anggota, dan Kegiatan.
  - Filter tahun dan bulan.
  - Cetak Dokumen Formal PDF siap tanda tangan dan ekspor data CSV.
- **Pengaturan & Struktur Organisasi**:
  - Form editor visual kepengurusan resmi organisasi: Ubah nama, jabatan, urutan, serta upload/ganti foto profil.
  - Tombol **"Reset Resmi"** untuk mengembalikan ke susunan 6 pengurus pimpinan.
  - Fitur Pencadangan (*Backup JSON*) & Pemulihan (*Restore JSON*) seluruh database.
  - Audit Trail Log: Melacak seluruh aktivitas perubahan data demi akuntabilitas pengurus.

---

## 🛠️ Teknologi & Dependensi

* **Frontend Framework**: React 19 + TypeScript + Vite
* **Styling**: Tailwind CSS v4 (Modern, responsif di ponsel, tablet, dan desktop)
* **Icons**: Lucide React
* **Grafik Statistik**: Recharts
* **Penyimpanan Data**: Firebase Firestore (terkoneksi otomatis dengan *fallback* Local Storage terenkripsi)
* **Cetak Dokumen**: Print Engine berstandar CSS Print Media & Isolated Print Iframe (menjamin tidak ada elemen web terpotong saat mencetak ke kertas atau *Save as PDF*)

---

## 🚀 Panduan Menjalankan Secara Lokal

1. **Clone repositori**:
   ```bash
   git clone <URL_REPOSITORI_ANDA>
   cd umkm-management
   ```

2. **Pasang dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

4. **Kompilasi produksi (Build)**:
   ```bash
   npm run build
   ```

5. **Pratinjau build produksi**:
   ```bash
   npm run preview
   ```

---

## 📦 Langkah Push ke GitHub & Deploy

### A. Inisialisasi Git & Push ke GitHub

Jalankan perintah berikut di terminal:

```bash
# 1. Inisialisasi git repository
git init

# 2. Tambahkan semua berkas
git add .

# 3. Buat commit perdana
git commit -m "feat: rilis sistem UMKM Management Forum UMKM KUAT Kec. Tangerang"

# 4. Ganti nama branch utama menjadi main
git branch -M main

# 5. Hubungkan ke repository GitHub Anda (ganti URL di bawah dengan milik Anda)
git remote add origin https://github.com/<username-anda>/umkm-management-tangerang.git

# 6. Push ke GitHub
git push -u origin main
```

### B. Opsi Deployment (Hosting Gratis & Cepat)

1. **Vercel**:
   - Masuk ke [vercel.com](https://vercel.com).
   - Klik **"Add New Project"** dan pilih repositori GitHub Anda.
   - Framework preset akan otomatis terdeteksi sebagai **Vite**.
   - Klik **Deploy**.

2. **Netlify**:
   - Masuk ke [netlify.com](https://netlify.com).
   - Pilih **"Import an existing project"** dari GitHub.
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Klik **Deploy Site**.

3. **Google Cloud Run / AI Studio**:
   - Terintegrasi penuh dengan runtime Node.js & Vite build.

---

## 🔐 Akun Demonstrasi & Hak Akses (Login Cepat)

Untuk menguji fitur admin di lingkungan pengembangan atau pengujian:
* Tombol **"Login Pengurus"** di pojok kanan atas portal publik menyediakan akses langsung dengan pilihan simulasi peran:
  - **Super Admin** (`umkmkectangerang@gmail.com`)
  - **Ketua Forum**
  - **Bendahara**
  - **Admin Keanggotaan**
  - **Admin Informasi**
  - **Pengurus Kelurahan**

Setiap peran memiliki pembatasan navigasi dan proteksi menu sesuai Role-Based Access Control (RBAC).

---

## 📝 Lisensi & Hak Cipta
Hak Cipta © 2026 **Forum UMKM KUAT Kecamatan Tangerang, Kota Tangerang**.
Dilindungi Undang-Undang.
