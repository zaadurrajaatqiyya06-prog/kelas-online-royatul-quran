// ─── mock-data.ts ──────────────────────────────────────────────────────────
// File ini sudah tidak digunakan. Semua data sekarang dari Supabase.
// Re-export types saja untuk backward compat jika masih ada import lama.

import type { SoalPG, Assignment } from "./store";

export type { JenisTugas, StatusPengumpulan, UserRole } from "./store";
export type { Tugas, Pengumpulan, User, Kelas, Mapel, Assignment, NilaiManual, SoalPG, SoalEsai } from "./store";
export type PenugasanGuru = Assignment;

export const SAMPLE_SOAL_PG: SoalPG[] = [
  {
    id: "spg-1",
    nomor: 1,
    pertanyaan: "Bacalah teks berikut dengan cermat! Manakah kalimat utama pada paragraf di atas?",
    opsiA: "Kalimat (1)",
    opsiB: "Kalimat (2)",
    opsiC: "Kalimat (3)",
    opsiD: "Kalimat (4)",
    kunciJawaban: "A",
  },
];

