# Inventory Rental App — Panduan Setup Supabase & Deploy

> ⚠️ **Jangan upgrade `typescript` ke versi 7.x** — Next.js 16.2.10 saat ini tidak kompatibel dengan struktur package TypeScript 7 (tidak ada `lib/typescript.js`) dan akan menyebabkan build gagal secara **silent** khusus di lingkungan CI/Vercel (`exited with 1` tanpa pesan error apapun). Gunakan `typescript ^5.7.3`. Cek kembali kompatibilitas Next.js sebelum upgrade major version TypeScript di masa depan.


## 1. Setup Supabase

### 1.1 Buat Project Supabase
1. Buka https://supabase.com → New Project
2. Isi nama project, password database, pilih region (Singapore terdekat)
3. Salin **Project URL** dan **anon public key** dari Settings → API

### 1.2 Isi .env.local
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 1.3 Jalankan SQL Schema
Di Supabase → SQL Editor → New Query, paste dan jalankan:
1. Isi file `supabase/schema.sql` (buat semua tabel + trigger)
2. Isi file `supabase/rls.sql` (Row Level Security)

### 1.4 Buat Storage Bucket
Di Supabase → Storage → New bucket:
- Nama: `item-photos`
- Public: ✅ Yes (agar foto bisa diakses publik)

### 1.5 Setup Google OAuth (opsional tapi disarankan)
1. Buka https://console.cloud.google.com
2. Create Project → Enable Google+ API
3. Credentials → Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URI: `https://xxxxx.supabase.co/auth/v1/callback`
4. Di Supabase → Authentication → Providers → Google:
   - Paste Client ID dan Client Secret

### 1.6 Buat User Admin Pertama
Setelah register user pertama via email:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'email-anda@gmail.com';
```

---

## 2. Jalankan Development

```bash
npm run dev
```
Buka http://localhost:3000

---

## 3. Deploy ke Vercel (Gratis)

1. Push ke GitHub
2. Buka https://vercel.com → Import Repository
3. Tambahkan environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` = https://domain-vercel-anda.vercel.app
4. Deploy!

Setelah deploy, update Supabase Auth:
- Settings → URL Configuration → Site URL = `https://domain-vercel-anda.vercel.app`
- Redirect URLs = `https://domain-vercel-anda.vercel.app/auth/callback`

---

## 4. Install PWA di HP

1. Buka URL app di Chrome HP
2. Tap menu ⋮ → "Add to Home Screen" (Android)
3. iOS: Safari → Share → "Add to Home Screen"

---

## 5. Alur Penggunaan

### Tambah Barang
1. Login sebagai Admin
2. Menu Barang → Tambah Barang / Import Excel
3. QR code otomatis digenerate — print label dan tempel ke fisik barang

### Buat & Proses Surat Jalan
1. Buat Surat Jalan → isi data event + PIC + pilih barang
2. Scan Barang Keluar: Menu Scan → pilih SJ → scan tiap barang satu per satu
3. Scan Barang Masuk: Menu Scan → pilih SJ aktif → scan barang yang kembali

### Template Excel Import
| nama | kategori | kondisi | catatan |
|------|----------|---------|---------|
| LED Screen P3 | LED Screen | baik | 4x3m |
| Camera Sony | Broadcast Camera | baik | |
