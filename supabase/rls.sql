-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Jalankan SETELAH schema.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat_jalan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat_jalan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

-- ─── Helper function: get current user role ────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================
-- User bisa baca profil sendiri
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid());

-- Admin bisa baca semua user
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT USING (public.get_user_role() = 'admin');

-- Admin bisa update semua user
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE USING (public.get_user_role() = 'admin');

-- System (trigger) bisa insert user baru (SECURITY DEFINER handle_new_user)
CREATE POLICY "users_insert_system" ON public.users
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- ITEMS TABLE POLICIES
-- ============================================================
-- Semua authenticated user bisa baca items (untuk scan & pilih barang)
CREATE POLICY "items_select_authenticated" ON public.items
  FOR SELECT USING (auth.role() = 'authenticated');

-- Hanya admin yang bisa insert, update, delete
CREATE POLICY "items_insert_admin" ON public.items
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "items_update_admin" ON public.items
  FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "items_delete_admin" ON public.items
  FOR DELETE USING (public.get_user_role() = 'admin');

-- ============================================================
-- SURAT_JALAN TABLE POLICIES
-- ============================================================
-- Admin: akses penuh
CREATE POLICY "sj_admin_all" ON public.surat_jalan
  FOR ALL USING (public.get_user_role() = 'admin');

-- PIC: hanya bisa SELECT baris miliknya
CREATE POLICY "sj_pic_select_own" ON public.surat_jalan
  FOR SELECT USING (
    public.get_user_role() = 'pic' AND pic_user_id = auth.uid()
  );

-- ============================================================
-- SURAT_JALAN_ITEMS TABLE POLICIES
-- ============================================================
-- Admin: akses penuh
CREATE POLICY "sji_admin_all" ON public.surat_jalan_items
  FOR ALL USING (public.get_user_role() = 'admin');

-- PIC: bisa SELECT item dari surat jalan miliknya
CREATE POLICY "sji_pic_select_own" ON public.surat_jalan_items
  FOR SELECT USING (
    public.get_user_role() = 'pic' AND EXISTS (
      SELECT 1 FROM public.surat_jalan sj
      WHERE sj.id = surat_jalan_id AND sj.pic_user_id = auth.uid()
    )
  );

-- ============================================================
-- SCAN_LOGS TABLE POLICIES
-- ============================================================
-- Admin: akses penuh
CREATE POLICY "scan_logs_admin_all" ON public.scan_logs
  FOR ALL USING (public.get_user_role() = 'admin');

-- PIC: bisa SELECT log dari surat jalan miliknya
CREATE POLICY "scan_logs_pic_select" ON public.scan_logs
  FOR SELECT USING (
    public.get_user_role() = 'pic' AND EXISTS (
      SELECT 1 FROM public.surat_jalan sj
      WHERE sj.id = surat_jalan_id AND sj.pic_user_id = auth.uid()
    )
  );
