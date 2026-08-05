# Inventory Rental App

Aplikasi Inventory berbasis Next.js dengan arsitektur Database menggunakan Supabase. Aplikasi ini mendukung dua mode deployment: **Supabase Cloud** atau **Supabase Local** (Self-Hosted via Docker di aaPanel).

> ⚠️ **Peringatan TypeScript**: Jangan upgrade `typescript` ke versi 7.x — Next.js 16.2.10 saat ini tidak kompatibel dengan struktur package TypeScript 7 (tidak ada `lib/typescript.js`) dan akan menyebabkan build gagal secara **silent** khusus di lingkungan CI/Docker. Gunakan `typescript ^5.7.3`.

---

## 1. Setup Kebutuhan Aplikasi (Wajib)
Sebelum mendeploy atau menggunakan aplikasi, pastikan fitur-fitur wajib ini sudah terkonfigurasi di Supabase kamu (baik versi Cloud maupun Lokal).

### 1.1 Buat Storage Bucket
Aplikasi butuh tempat menyimpan foto barang.
Di Supabase Dashboard (Cloud) atau Local Studio (`http://127.0.0.1:54323`) → Storage → New bucket:
- **Name:** `item-photos`
- **Public:** ✅ Yes *(agar foto bisa diakses publik tanpa login)*

### 1.2 Setup Google OAuth (Opsional)
Jika butuh fitur "Login with Google":
1. Buka Google Cloud Console → Create Credentials → OAuth 2.0 Client ID (Web application)
2. Authorized redirect URI: `https://[URL-SUPABASE-KAMU]/auth/v1/callback`
3. Di menu Supabase → Authentication → Providers → Google: Masukkan Client ID & Secret yang didapat dari Google.

### 1.3 Buat User Admin Pertama
Secara default, user yang mendaftar bukan seorang admin. Setelah mendaftar user pertama di aplikasi, jalankan SQL ini di Supabase SQL Editor untuk menjadikannya Admin:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'email-anda@gmail.com';
```

---

## 2. Cara Deploy (Docker & aaPanel)

### Opsi A: Menggunakan Supabase Cloud (Default)
Database numpang di layanan cloud Supabase, server hanya menghosting website.

1. Clone repo ini di server (misal di terminal aaPanel): 
   ```bash
   git clone https://github.com/username-kamu/nama-repo.git
   cd nama-repo
   ```
2. Buat file `.env.production` dan isi **HANYA** variabel Public:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[URL-PROJECT-CLOUD].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[KEY-ANON-CLOUD]
   NEXT_PUBLIC_APP_URL=https://[URL-APP-KAMU]
   ```
3. Build image Docker-nya:
   ```bash
   docker build -t inventory-app:v1 .
   ```
4. Jalankan container (sertakan Secret Key di sini agar aman): 
   ```bash
   docker run -d --name inventory-app -p 8080:3000 -e SUPABASE_SERVICE_ROLE_KEY="[SECRET-KEY-CLOUD]" inventory-app:v1
   ```

### Opsi B: Menggunakan Supabase Lokal (Tanpa Cloud)
Seluruh database, auth, storage, dan website berjalan 100% di server/komputer sendiri. *(Butuh Docker & Docker Compose).*

1. Di terminal komputer, jalankan `npx supabase init`.
2. Pindahkan file `.sql` (seperti `schema.sql`, `rls.sql`, `categories.sql`) ke dalam folder baru `supabase/migrations/`.
3. Jalankan `npx supabase start`. Tunggu proses selesai hingga muncul API URL dan Keys lokal.
4. Buat file `.env.production` (atau `.env.local`) menggunakan kredensial lokal tersebut (contoh URL: `http://127.0.0.1:54321`).
5. Lakukan `docker build` dan `docker run` persis seperti Opsi A, namun menggunakan key dan url versi lokal.

---

## 3. Fitur & Penggunaan

### Install PWA di HP
Agar terasa seperti aplikasi native tanpa lewat Play Store/App Store:
1. Buka URL app di browser HP (Chrome/Safari).
2. Android: Tap menu ⋮ → "Add to Home Screen".
3. iOS: Tap ikon Share → "Add to Home Screen".

### Alur Penggunaan Aplikasi
- **Tambah Barang**: Login sebagai Admin → Buka Menu Barang → Tambah Barang (atau Import Excel) → QR Code akan otomatis digenerate (Print label dan tempel ke fisik barang).
- **Proses Surat Jalan (Barang Keluar)**: Buat Surat Jalan (Isi nama event & PIC) → Buka Menu Scan → Pilih SJ aktif → Scan QR tiap barang yang akan keluar.
- **Proses Pengembalian (Barang Masuk)**: Buka Menu Scan → Pilih SJ aktif tadi → Scan QR barang yang kembali untuk update statusnya.

#### Template Excel Import
Saat melakukan import massal, pastikan file Excel mematuhi header berikut:
| nama | kategori | kondisi | catatan |
|------|----------|---------|---------|
| LED Screen P3 | LED Screen | baik | 4x3m |
| Camera Sony | Broadcast Camera | baik | Lensa 50mm |
