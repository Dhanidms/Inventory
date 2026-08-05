-- ============================================================
-- TABEL CATEGORIES (manajemen kategori barang dinamis)
-- Jalankan file ini di Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  color      TEXT DEFAULT '#6b7170',
  icon       TEXT DEFAULT '📦',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Semua authenticated user bisa baca categories
DROP POLICY IF EXISTS "categories_select_authenticated" ON public.categories;
CREATE POLICY "categories_select_authenticated" ON public.categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Hanya admin yang bisa insert, update, delete
DROP POLICY IF EXISTS "categories_insert_admin" ON public.categories;
CREATE POLICY "categories_insert_admin" ON public.categories
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "categories_update_admin" ON public.categories;
CREATE POLICY "categories_update_admin" ON public.categories
  FOR UPDATE USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "categories_delete_admin" ON public.categories;
CREATE POLICY "categories_delete_admin" ON public.categories
  FOR DELETE USING (public.get_user_role() = 'admin');

-- ─── INDEX ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- ─── SEED DATA (Kategori Khas Broadcast, Cinema & Event) ──
INSERT INTO public.categories (name, color, icon) VALUES
  ('Kamera & Camcorder',   '#3b82f6', '🎥'),
  ('Lensa & Filter',       '#8b5cf6', '🔍'),
  ('Lighting & Grip',      '#f2c438', '💡'),
  ('Audio & Sound',        '#f2a638', '🎙️'),
  ('Monitor & Display',    '#ec4899', '📺'),
  ('Switcher & Control',   '#49b7ab', '🎛️'),
  ('Wireless Transmission','#7c6fe0', '📡'),
  ('LED Screen & Visual',  '#4a90c4', '🖥️'),
  ('Tripod & Support',     '#10b981', '🏗️'),
  ('Komunikasi / Intercom','#06b6d4', '🎧'),
  ('Kabel & Kelistrikan',  '#9aa19f', '🔌'),
  ('Truss & Panggung',     '#6b7170', '🎪'),
  ('Lainnya',              '#6b7170', '📦')
ON CONFLICT (name) DO NOTHING;
