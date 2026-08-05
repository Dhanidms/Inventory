# Inventory Web App

Aplikasi Inventory berbasis Next.js dengan arsitektur Database menggunakan Supabase. Aplikasi ini mendukung dua mode deployment untuk databasenya: **Supabase Cloud** atau **Supabase Local** (Self-Hosted).

---

## Opsi 1: Menggunakan Supabase Cloud (Default)
Opsi ini paling mudah jika kamu sudah memiliki project di [supabase.com](https://supabase.com). Database dan Auth diatur oleh server Supabase.

### 1. Persiapan Build (di aaPanel / Ubuntu)
Clone repository ini ke server kamu:
```bash
git clone https://github.com/username-kamu/nama-repo.git
cd nama-repo
```

Buat file bernama `.env.production` di dalam folder project ini. File ini **HANYA** boleh berisi variabel Public agar bisa dibaca saat proses build Docker:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[URL-PROJECT-CLOUD-KAMU].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[KEY-ANON-CLOUD-KAMU]
NEXT_PUBLIC_APP_URL=https://[URL-APP-KAMU]
```

### 2. Build Image
Jalankan perintah build. Next.js otomatis membaca `.env.production` di atas.
```bash
docker build -t inventory-app:v1 .
```

### 3. Run Container
Jalankan container-nya dan masukkan **Secret Key** (Service Role Key dari Supabase Cloud).
```bash
docker run -d \
  --name inventory-app \
  -p 8080:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY="[SECRET-KEY-CLOUD-KAMU]" \
  inventory-app:v1
```
Selesai! Aplikasi berjalan di port `8080` dan siap disambungkan ke Domain melalui Reverse Proxy.

---

## Opsi 2: Menggunakan Supabase Lokal (Tanpa Cloud)
Opsi ini cocok untuk Local Development di PC atau Self-Hosting murni. Database, Auth, dan Storage akan berjalan di komputermu sendiri via Docker.

### Syarat Tambahan:
- Docker & Docker Compose harus sudah terinstall dan aktif.

### 1. Inisialisasi & Jalankan Supabase
Buka terminal di dalam folder project ini, lalu jalankan perintah CLI Supabase:
```bash
npx supabase init
```
Setelah itu, pindahkan semua file SQL database kamu (seperti `schema.sql`) ke dalam folder `supabase/migrations/` (buat foldernya jika belum ada). 

Lalu jalankan Supabase lokal:
```bash
npx supabase start
```
*(Proses ini akan mendownload semua docker image milik Supabase seperti Postgres dan GoTrue. Tunggu hingga selesai).*

### 2. Atur Environment Variables
Setelah `supabase start` selesai, terminal akan menampilkan **API URL**, **anon key**, dan **service_role key** versi lokal milikmu.

Buat/edit file `.env.local` (untuk development) atau `.env.production` (untuk build docker server) dengan data lokal tersebut:
```env
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321" # URL Lokal
NEXT_PUBLIC_SUPABASE_ANON_KEY="[KEY-ANON-LOKAL-DARI-TERMINAL]"
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Atau domainmu
# Untuk service role key, jangan masukkan ke .env.production jika build docker, tapi masukkan saat 'docker run' seperti di Opsi 1.
```

### 3. Jalankan Aplikasi
Jika hanya untuk Local Development, kamu bisa langsung:
```bash
npm run dev
```

Jika untuk deploy ke server menggunakan Supabase lokal, ikuti langkah build `docker build` dan `docker run` seperti pada **Opsi 1**, namun pastikan URL dan Key yang dimasukkan adalah URL/Key lokal milikmu.
