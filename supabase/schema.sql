-- ============================================================
-- SCHEMA: Inventory Rental Equipment
-- Jalankan file ini di Supabase SQL Editor
-- ============================================================

-- 1. TABEL USERS (extend auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT,
  role        TEXT NOT NULL DEFAULT 'pic' CHECK (role IN ('admin', 'pic')),
  auth_provider TEXT DEFAULT 'email',
  avatar_url  TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL ITEMS (inventaris barang)
CREATE TABLE IF NOT EXISTS public.items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  qr_code     TEXT UNIQUE NOT NULL,
  condition   TEXT DEFAULT 'baik' CHECK (condition IN ('baik','rusak','maintenance')),
  status      TEXT DEFAULT 'tersedia' CHECK (status IN ('tersedia','disewa','maintenance')),
  photo_url   TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL SURAT_JALAN
CREATE TABLE IF NOT EXISTS public.surat_jalan (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_sj                  TEXT UNIQUE NOT NULL,
  pic_user_id               UUID REFERENCES public.users(id),
  pic_name                  TEXT NOT NULL,
  pic_phone                 TEXT NOT NULL,
  event_name                TEXT NOT NULL,
  tanggal_ambil             DATE NOT NULL,
  tanggal_rencana_kembali   DATE NOT NULL,
  tanggal_aktual_kembali    TIMESTAMPTZ,
  status                    TEXT DEFAULT 'draft' CHECK (status IN ('draft','keluar','sebagian_kembali','selesai','overdue')),
  created_by                UUID NOT NULL REFERENCES public.users(id),
  notes                     TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL SURAT_JALAN_ITEMS
CREATE TABLE IF NOT EXISTS public.surat_jalan_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surat_jalan_id  UUID NOT NULL REFERENCES public.surat_jalan(id) ON DELETE CASCADE,
  item_id         UUID NOT NULL REFERENCES public.items(id),
  status_keluar   BOOLEAN DEFAULT FALSE,
  waktu_keluar    TIMESTAMPTZ,
  status_masuk    BOOLEAN DEFAULT FALSE,
  waktu_masuk     TIMESTAMPTZ,
  UNIQUE(surat_jalan_id, item_id)
);

-- 5. TABEL SCAN_LOGS
CREATE TABLE IF NOT EXISTS public.scan_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES public.items(id),
  surat_jalan_id  UUID REFERENCES public.surat_jalan(id),
  action          TEXT NOT NULL CHECK (action IN ('keluar','masuk')),
  scanned_by      UUID NOT NULL REFERENCES public.users(id),
  scanned_at      TIMESTAMPTZ DEFAULT NOW(),
  notes           TEXT
);

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER surat_jalan_updated_at
  BEFORE UPDATE ON public.surat_jalan
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: Auto-create user record saat login
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, auth_provider, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'pic',
    CASE WHEN NEW.app_metadata->>'provider' = 'google' THEN 'google' ELSE 'email' END,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- INDEXES untuk performa
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_items_qr_code ON public.items(qr_code);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_sj_status ON public.surat_jalan(status);
CREATE INDEX IF NOT EXISTS idx_sj_pic_user ON public.surat_jalan(pic_user_id);
CREATE INDEX IF NOT EXISTS idx_sji_sj_id ON public.surat_jalan_items(surat_jalan_id);
CREATE INDEX IF NOT EXISTS idx_sji_item_id ON public.surat_jalan_items(item_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_item ON public.scan_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_sj ON public.scan_logs(surat_jalan_id);
