-- ============================================================
-- MIGRASI: Sistem Halaqah Al-Qur'an (Idempotent / Aman Dijalankan Berulang Kali)
-- Jalankan di Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabel utama halaqah
CREATE TABLE IF NOT EXISTS public.halaqah (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama          TEXT NOT NULL,
  jenis         TEXT NOT NULL DEFAULT 'tahsin',
  musyrif_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  target_surah  TEXT,
  jadwal        TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Pastikan kolom yang mungkin belum ada ditambahkan jika tabel sudah pernah dibuat sebelumnya
ALTER TABLE public.halaqah ADD COLUMN IF NOT EXISTS jenis TEXT NOT NULL DEFAULT 'tahsin';
ALTER TABLE public.halaqah ADD COLUMN IF NOT EXISTS musyrif_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.halaqah ADD COLUMN IF NOT EXISTS target_surah TEXT;
ALTER TABLE public.halaqah ADD COLUMN IF NOT EXISTS jadwal TEXT;

-- 2. Keanggotaan halaqah (murid lintas kelas)
CREATE TABLE IF NOT EXISTS public.halaqah_anggota (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  halaqah_id    UUID NOT NULL REFERENCES public.halaqah(id) ON DELETE CASCADE,
  murid_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (halaqah_id, murid_id)
);

-- 3. Catatan harian kehadiran dan capaian
CREATE TABLE IF NOT EXISTS public.halaqah_catatan (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  halaqah_id    UUID NOT NULL REFERENCES public.halaqah(id) ON DELETE CASCADE,
  murid_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  musyrif_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  tanggal       DATE NOT NULL,
  jenis         TEXT NOT NULL DEFAULT 'hadir',
  capaian       TEXT,
  catatan       TEXT,
  nilai         INTEGER CHECK (nilai >= 0 AND nilai <= 100),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (halaqah_id, murid_id, tanggal)
);

-- 4. Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_halaqah_anggota_halaqah ON public.halaqah_anggota(halaqah_id);
CREATE INDEX IF NOT EXISTS idx_halaqah_anggota_murid   ON public.halaqah_anggota(murid_id);
CREATE INDEX IF NOT EXISTS idx_halaqah_catatan_halaqah ON public.halaqah_catatan(halaqah_id);
CREATE INDEX IF NOT EXISTS idx_halaqah_catatan_tanggal ON public.halaqah_catatan(tanggal);

-- 5. RLS: aktifkan Row Level Security
ALTER TABLE public.halaqah         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaqah_anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaqah_catatan ENABLE ROW LEVEL SECURITY;

-- 6. Policy: Drop dulu jika sudah ada agar tidak muncul error 42710
DROP POLICY IF EXISTS "public_all_halaqah"         ON public.halaqah;
DROP POLICY IF EXISTS "public_all_halaqah_anggota" ON public.halaqah_anggota;
DROP POLICY IF EXISTS "public_all_halaqah_catatan" ON public.halaqah_catatan;

-- Buat ulang policy
CREATE POLICY "public_all_halaqah"         ON public.halaqah         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_halaqah_anggota" ON public.halaqah_anggota FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_halaqah_catatan" ON public.halaqah_catatan FOR ALL USING (true) WITH CHECK (true);
