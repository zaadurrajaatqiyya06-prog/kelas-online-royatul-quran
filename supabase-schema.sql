-- ==============================================================================
-- KELAS ONLINE ROYATUL QUR'AN - DATABASE SCHEMA & SEED DATA
-- Jalankan script SQL ini di Supabase SQL Editor:
-- Dashboard Supabase -> SQL Editor -> New Query -> Paste -> Run (Ctrl+Enter)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Hapus tabel lama jika ingin reset bersih (opsional)
-- DROP TABLE IF EXISTS pengumpulan CASCADE;
-- DROP TABLE IF EXISTS tugas CASCADE;
-- DROP TABLE IF EXISTS guru_mapel_kelas CASCADE;
-- DROP TABLE IF EXISTS nilai_manual CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS kelas CASCADE;
-- DROP TABLE IF EXISTS mapel CASCADE;

-- ==============================================================================
-- TABEL: KELAS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.kelas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  jenjang INT NOT NULL,
  rombel TEXT,
  wali_id UUID,
  total_murid INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABEL: USERS (Murid, Guru, Walas, Admin)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  nis TEXT UNIQUE,
  nip TEXT UNIQUE,
  nisn TEXT,
  nik TEXT,
  no_kk TEXT,
  pin_hash TEXT,
  role TEXT NOT NULL CHECK (role IN ('murid', 'guru', 'walas', 'admin')),
  no_wa TEXT,
  foto_url TEXT,
  kelas_id UUID REFERENCES public.kelas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign key wali_id di kelas mengarah ke users(id)
ALTER TABLE public.kelas
  DROP CONSTRAINT IF EXISTS fk_kelas_wali;
ALTER TABLE public.kelas
  ADD CONSTRAINT fk_kelas_wali FOREIGN KEY (wali_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- ==============================================================================
-- TABEL: MAPEL
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.mapel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL UNIQUE,
  kode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABEL: GURU_MAPEL_KELAS (Penugasan Guru)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.guru_mapel_kelas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guru_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mapel_id UUID NOT NULL REFERENCES public.mapel(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_guru_mapel_kelas UNIQUE (guru_id, mapel_id, kelas_id)
);

-- ==============================================================================
-- TABEL: TUGAS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tugas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  judul TEXT NOT NULL,
  mapel_id UUID NOT NULL REFERENCES public.mapel(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  guru_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN ('esai', 'pg', 'foto', 'video', 'file')),
  instruksi TEXT NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  soal_pg JSONB,
  soal_esai JSONB,
  is_manual_offline BOOLEAN DEFAULT FALSE,
  tanggal_penilaian DATE,
  gdrive_folder_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABEL: PENGUMPULAN (Jawaban Tugas Siswa)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pengumpulan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tugas_id UUID NOT NULL REFERENCES public.tugas(id) ON DELETE CASCADE,
  murid_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'sudah' CHECK (status IN ('belum', 'sudah', 'dinilai', 'ditolak')),
  jawaban_teks TEXT,
  jawaban_pg JSONB,
  jawaban_esai_list JSONB,
  file_name TEXT,
  file_size_mb NUMERIC(8, 2),
  is_large_video BOOLEAN DEFAULT FALSE,
  auto_nilai NUMERIC(5, 2),
  pdf_url TEXT,
  gdrive_file_url TEXT,
  telegram_file_id TEXT,
  nilai NUMERIC(5, 2),
  catatan_guru TEXT,
  dinilai_oleh UUID REFERENCES public.users(id) ON DELETE SET NULL,
  waktu_nilai TIMESTAMPTZ,
  alasan_tolak TEXT,
  waktu_tolak TIMESTAMPTZ,
  waktu_submit TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_tugas_murid UNIQUE (tugas_id, murid_id)
);

-- ==============================================================================
-- TABEL: NILAI_MANUAL (Rekap Nilai Offline Batch)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.nilai_manual (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guru_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  mapel_id UUID NOT NULL REFERENCES public.mapel(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  tanggal_penilaian DATE NOT NULL DEFAULT CURRENT_DATE,
  scores JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- STORED FUNCTION: REFRESH TOTAL MURID PER KELAS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.refresh_total_murid(kelas_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.kelas
  SET total_murid = (
    SELECT COUNT(*) FROM public.users
    WHERE kelas_id = kelas_id_param AND role = 'murid'
  )
  WHERE id = kelas_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Karena autentikasi murid/guru menggunakan NIS/NIP + bcrypt PIN di Next.js API,
-- izinkan akses melalui anon/service_role untuk tabel-tabel ini.
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guru_mapel_kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tugas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumpulan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nilai_manual ENABLE ROW LEVEL SECURITY;

-- Grant Full Access to Anon and Authenticated
DROP POLICY IF EXISTS "Public full access users" ON public.users;
CREATE POLICY "Public full access users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access kelas" ON public.kelas;
CREATE POLICY "Public full access kelas" ON public.kelas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access mapel" ON public.mapel;
CREATE POLICY "Public full access mapel" ON public.mapel FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access guru_mapel_kelas" ON public.guru_mapel_kelas;
CREATE POLICY "Public full access guru_mapel_kelas" ON public.guru_mapel_kelas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access tugas" ON public.tugas;
CREATE POLICY "Public full access tugas" ON public.tugas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access pengumpulan" ON public.pengumpulan;
CREATE POLICY "Public full access pengumpulan" ON public.pengumpulan FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access nilai_manual" ON public.nilai_manual;
CREATE POLICY "Public full access nilai_manual" ON public.nilai_manual FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- INITIAL SEED DATA (DATA AWAL)
-- PIN Default: 123456 (hash: $2b$10$.IltghQ.P5eOHeTnifjj..pl2Yz0bXGK9F9UEcT9MZcJhTL16GySO)
-- ==============================================================================

-- 1. Buat Kelas Awal
INSERT INTO public.kelas (id, nama, jenjang, rombel, total_murid)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Kelas 1', 1, NULL, 0),
  ('22222222-2222-2222-2222-222222222222', 'Kelas 2', 2, NULL, 0),
  ('33333333-3333-3333-3333-333333333333', 'Kelas 3', 3, NULL, 0),
  ('44444444-4444-4444-4444-444444444444', 'Kelas 4', 4, NULL, 0),
  ('55555555-5555-5555-5555-555555555555', 'Kelas 5', 5, NULL, 0),
  ('66666666-6666-6666-6666-666666666666', 'Kelas 6', 6, NULL, 0)
ON CONFLICT (id) DO NOTHING;

-- 2. Buat Akun Default: Admin & Guru/Walas
INSERT INTO public.users (id, nama, nip, pin_hash, role, no_wa)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Administrator Utama',
    'admin',
    '$2b$10$.IltghQ.P5eOHeTnifjj..pl2Yz0bXGK9F9UEcT9MZcJhTL16GySO', -- PIN: 123456
    'admin',
    '081234567890'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Ustadz Zaadurraja Atqiyya',
    '19850101',
    '$2b$10$.IltghQ.P5eOHeTnifjj..pl2Yz0bXGK9F9UEcT9MZcJhTL16GySO', -- PIN: 123456
    'walas',
    '081298765432'
  )
ON CONFLICT (nip) DO NOTHING;

-- Update wali kelas 6 ke Ustadz Zaadurraja
UPDATE public.kelas
SET wali_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
WHERE id = '66666666-6666-6666-6666-666666666666';

-- 3. Buat Mata Pelajaran Awal
INSERT INTO public.mapel (id, nama, kode)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Bahasa Arab', 'ARB'),
  ('c2222222-2222-2222-2222-222222222222', 'Tahfidz & Tajwid', 'TFZ'),
  ('c3333333-3333-3333-3333-333333333333', 'Pendidikan Agama Islam', 'PAI'),
  ('c4444444-4444-4444-4444-444444444444', 'Bahasa Indonesia', 'IND'),
  ('c5555555-5555-5555-5555-555555555555', 'Matematika', 'MTK'),
  ('c6666666-6666-6666-6666-666666666666', 'Ilmu Pengetahuan Alam', 'IPA')
ON CONFLICT (nama) DO NOTHING;

-- 4. Assign Guru ke Mapel & Kelas
INSERT INTO public.guru_mapel_kelas (guru_id, mapel_id, kelas_id)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c1111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666')
ON CONFLICT DO NOTHING;
