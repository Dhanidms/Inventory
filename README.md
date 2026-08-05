# Inventory Web App

Aplikasi Inventory berbasis Next.js dengan Supabase.

## Cara Deploy via Docker (Server aaPanel atau Ubuntu)

Karena project ini menggunakan Next.js, ada pemisahan antara Public Environment (dibutuhkan saat build) dan Secret Environment (dibutuhkan saat run). 

### 1. Persiapan Build
Clone repository ini ke server kamu:
```bash
git clone https://github.com/username-kamu/nama-repo.git
cd nama-repo
```

Buat file bernama `.env.production` di dalam folder project ini. File ini **HANYA** boleh berisi variabel Public agar bisa dibaca saat proses build:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[URL-KAMU].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[KEY-ANON-KAMU]
NEXT_PUBLIC_APP_URL=https://[URL-APP-KAMU]
```

### 2. Build Image
Jalankan perintah ini untuk membuat Docker image. (Karena ada `.env.production`, kamu tidak perlu repot mengetik `--build-arg` yang panjang).
```bash
docker build -t inventory-app:v1 .
```

### 3. Run Container
Setelah build selesai, jalankan container-nya. Di tahap inilah kamu memasukkan **Secret Key** (jangan pernah menaruh secret key di dalam file .env.production).
```bash
docker run -d \
  --name inventory-app \
  -p 8080:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY="[SECRET-KEY-KAMU]" \
  inventory-app:v1
```

Aplikasi sekarang sudah berjalan di port `8080` dan siap disambungkan ke Domain melalui Reverse Proxy!
