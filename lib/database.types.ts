// ─── Supabase Database Types (auto-generated style, manual) ─────────────────
// Sesuai dengan schema yang kita buat di Supabase SQL Editor

export type UserRole = "murid" | "guru" | "walas" | "admin";
export type StatusPengumpulan = "belum" | "sudah" | "dinilai" | "ditolak";
export type JenisTugas = "esai" | "pg" | "foto" | "video" | "file";

// ─── Tabel: users ───────────────────────────────────────────────────────────
export interface DbUser {
  id: string; // uuid
  nama: string;
  nis: string | null;      // Nomor Induk Siswa (murid)
  nip: string | null;      // Nomor Induk Pegawai (guru/admin)
  nisn: string | null;     // NISN (murid)
  nik: string | null;      // NIK KTP (murid, opsional)
  no_kk: string | null;    // No. Kartu Keluarga (murid, opsional)
  pin_hash: string | null; // bcrypt hash PIN
  role: UserRole;
  no_wa: string | null;
  foto_url: string | null;
  kelas_id: string | null; // FK → kelas.id (untuk murid)
  created_at: string;
  updated_at: string;
}

// ─── Tabel: kelas ───────────────────────────────────────────────────────────
export interface DbKelas {
  id: string;
  nama: string;         // e.g. "Kelas 6A", "Kelas 1"
  jenjang: number;      // 1, 2, 3, ... (tingkat kelas)
  rombel: string | null; // "A", "B", "C" atau null jika tidak ada paralel
  wali_id: string | null; // FK → users.id (walas)
  total_murid: number;
  created_at: string;
}

// ─── Tabel: mapel ───────────────────────────────────────────────────────────
export interface DbMapel {
  id: string;
  nama: string;           // e.g. "Bahasa Arab", "Matematika"
  kode: string | null;    // e.g. "ARB", "MTK"
  created_at: string;
}

// ─── Tabel: guru_mapel_kelas (assignment guru mengajar mapel di kelas) ───────
export interface DbGuruMapelKelas {
  id: string;
  guru_id: string;   // FK → users.id
  mapel_id: string;  // FK → mapel.id
  kelas_id: string;  // FK → kelas.id
  created_at: string;
  // Joined fields (from queries)
  guru?: DbUser;
  mapel?: DbMapel;
  kelas?: DbKelas;
}

// ─── Tabel: tugas ───────────────────────────────────────────────────────────
export interface DbTugas {
  id: string;
  judul: string;
  mapel_id: string;        // FK → mapel.id
  kelas_id: string;        // FK → kelas.id
  guru_id: string;         // FK → users.id
  jenis: JenisTugas;
  instruksi: string;
  deadline: string;        // ISO timestamp
  soal_pg: SoalPGData[] | null;    // JSONB: array soal PG
  soal_esai: SoalEsaiData[] | null; // JSONB: array soal esai
  is_manual_offline: boolean;
  tanggal_penilaian: string | null; // Untuk nilai manual
  gdrive_folder_id: string | null;
  created_at: string;
  // Joined fields
  mapel?: DbMapel;
  kelas?: DbKelas;
  guru?: DbUser;
}

export interface SoalPGData {
  id: string;
  nomor: number;
  pertanyaan: string;
  opsi_a: string;
  opsi_b: string;
  opsi_c: string | null;
  opsi_d: string | null;
  kunci_jawaban: "A" | "B" | "C" | "D";
}

export interface SoalEsaiData {
  id: string;
  nomor: number;
  pertanyaan: string;
}

// ─── Tabel: pengumpulan ─────────────────────────────────────────────────────
export interface DbPengumpulan {
  id: string;
  tugas_id: string;   // FK → tugas.id
  murid_id: string;   // FK → users.id
  status: StatusPengumpulan;
  jawaban_teks: string | null;
  jawaban_pg: Record<number, "A" | "B" | "C" | "D"> | null;    // JSONB
  jawaban_esai: Record<number, string> | null;                   // JSONB
  file_name: string | null;
  file_size_mb: number | null;
  is_large_video: boolean;
  auto_nilai: number | null;
  pdf_url: string | null;
  gdrive_file_url: string | null;
  telegram_file_id: string | null;
  nilai: number | null;
  catatan_guru: string | null;
  dinilai_oleh: string | null;
  waktu_nilai: string | null;
  alasan_tolak: string | null;
  waktu_tolak: string | null;
  waktu_submit: string;
  created_at: string;
  // Joined
  murid?: DbUser;
  tugas?: DbTugas;
}

// ─── Tabel: nilai_manual ────────────────────────────────────────────────────
export interface DbNilaiManual {
  id: string;
  guru_id: string;
  kelas_id: string;
  mapel_id: string;
  judul: string;
  tanggal_penilaian: string;
  scores: NilaiManualScore[]; // JSONB
  created_at: string;
}

export interface NilaiManualScore {
  murid_id: string;
  nilai: number;
  catatan: string;
}

// ─── Database type wrapper ──────────────────────────────────────────────────
export type Database = {
  public: {
    Tables: {
      users: { Row: DbUser; Insert: Omit<DbUser, "id" | "created_at" | "updated_at">; Update: Partial<DbUser>; };
      kelas: { Row: DbKelas; Insert: Omit<DbKelas, "id" | "created_at">; Update: Partial<DbKelas>; };
      mapel: { Row: DbMapel; Insert: Omit<DbMapel, "id" | "created_at">; Update: Partial<DbMapel>; };
      guru_mapel_kelas: { Row: DbGuruMapelKelas; Insert: Omit<DbGuruMapelKelas, "id" | "created_at">; Update: Partial<DbGuruMapelKelas>; };
      tugas: { Row: DbTugas; Insert: Omit<DbTugas, "id" | "created_at">; Update: Partial<DbTugas>; };
      pengumpulan: { Row: DbPengumpulan; Insert: Omit<DbPengumpulan, "id" | "created_at">; Update: Partial<DbPengumpulan>; };
      nilai_manual: { Row: DbNilaiManual; Insert: Omit<DbNilaiManual, "id" | "created_at">; Update: Partial<DbNilaiManual>; };
    };
  };
};
