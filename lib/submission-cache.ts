import fs from "fs";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
// Submission Cache — Penyimpanan Cepat Lembar Jawaban Santri (Max 7 Hari)
//
// File santri (PDF / foto catatan) disimpan sementara di:
//   public/temp-submissions/<tugasId>/<muridId>/<filename>
//
// Setelah 7 hari, file lokal dihapus otomatis. Guru diarahkan ke Google Drive
// untuk melihat arsip permanen.
// ─────────────────────────────────────────────────────────────────────────────

export const MAX_CACHE_DAYS = 7;
const CACHE_BASE = path.join(process.cwd(), "public", "temp-submissions");

/**
 * Pastikan direktori cache ada, buat jika belum.
 */
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Simpan salinan buffer file ke cache lokal server.
 * Mengembalikan URL publik (relative ke /public) yang bisa diakses browser.
 */
export function saveSubmissionCache(params: {
  tugasId: string;
  muridId: string;
  fileName: string;
  buffer: Buffer;
  mimeType?: string;
}): { localUrl: string | null } {
  try {
    const dir = path.join(CACHE_BASE, params.tugasId, params.muridId);
    ensureDir(dir);

    // Sanitize nama file: hapus karakter berbahaya
    const safeFileName = params.fileName
      .replace(/[^a-zA-Z0-9._\-\s]/g, "_")
      .replace(/\s+/g, "_")
      .substring(0, 200);

    const filePath = path.join(dir, safeFileName);
    fs.writeFileSync(filePath, params.buffer);

    // URL publik: /temp-submissions/<tugasId>/<muridId>/<filename>
    const localUrl = `/temp-submissions/${params.tugasId}/${params.muridId}/${safeFileName}`;
    return { localUrl };
  } catch (err) {
    console.error("[submission-cache] Gagal simpan cache lokal:", err);
    return { localUrl: null };
  }
}

/**
 * Cek apakah file cache lokal masih tersedia (waktu submit < 7 hari).
 * Mengembalikan URL lokal jika masih valid, null jika sudah expired / tidak ada.
 */
export function getSubmissionCacheUrl(params: {
  tugasId: string;
  muridId: string;
  fileName: string;
  waktuSubmit: string; // ISO string
}): string | null {
  try {
    const submitDate = new Date(params.waktuSubmit);
    const now = new Date();
    const diffMs = now.getTime() - submitDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > MAX_CACHE_DAYS) {
      // Sudah expired — hapus file jika masih ada
      deleteSubmissionCache({
        tugasId: params.tugasId,
        muridId: params.muridId,
        fileName: params.fileName,
      });
      return null;
    }

    const safeFileName = params.fileName
      .replace(/[^a-zA-Z0-9._\-\s]/g, "_")
      .replace(/\s+/g, "_")
      .substring(0, 200);

    const filePath = path.join(
      CACHE_BASE,
      params.tugasId,
      params.muridId,
      safeFileName
    );

    if (fs.existsSync(filePath)) {
      return `/temp-submissions/${params.tugasId}/${params.muridId}/${safeFileName}`;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Hapus cache file tertentu.
 */
export function deleteSubmissionCache(params: {
  tugasId: string;
  muridId: string;
  fileName: string;
}) {
  try {
    const safeFileName = params.fileName
      .replace(/[^a-zA-Z0-9._\-\s]/g, "_")
      .replace(/\s+/g, "_")
      .substring(0, 200);

    const filePath = path.join(
      CACHE_BASE,
      params.tugasId,
      params.muridId,
      safeFileName
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn("[submission-cache] Gagal hapus file:", err);
  }
}

/**
 * Hitung berapa hari tersisa sebelum cache file kadaluarsa.
 * Berguna untuk menampilkan badge "Tersisa X hari" di halaman guru.
 */
export function getDaysRemaining(waktuSubmit: string): number {
  const submitDate = new Date(waktuSubmit);
  const now = new Date();
  const diffMs = now.getTime() - submitDate.getTime();
  const usedDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(MAX_CACHE_DAYS - usedDays));
}

/**
 * Auto-cleanup global: hapus semua folder cache yang lebih lama dari MAX_CACHE_DAYS.
 * Dipanggil saat ada request ke halaman guru untuk membersihkan disk secara pasif.
 */
export function cleanupOldSubmissions() {
  try {
    if (!fs.existsSync(CACHE_BASE)) return;

    const now = Date.now();
    const maxMs = MAX_CACHE_DAYS * 24 * 60 * 60 * 1000;

    // Iterasi folder tugas → folder murid → cek waktu modifikasi file
    const tugasDirs = fs.readdirSync(CACHE_BASE);
    for (const tugasId of tugasDirs) {
      const tugasDir = path.join(CACHE_BASE, tugasId);
      if (!fs.statSync(tugasDir).isDirectory()) continue;

      const muridDirs = fs.readdirSync(tugasDir);
      for (const muridId of muridDirs) {
        const muridDir = path.join(tugasDir, muridId);
        if (!fs.statSync(muridDir).isDirectory()) continue;

        const files = fs.readdirSync(muridDir);
        for (const file of files) {
          const filePath = path.join(muridDir, file);
          const stat = fs.statSync(filePath);
          const fileAgeMs = now - stat.mtimeMs;

          if (fileAgeMs > maxMs) {
            fs.unlinkSync(filePath);
          }
        }

        // Hapus folder murid jika sudah kosong
        if (fs.readdirSync(muridDir).length === 0) {
          fs.rmdirSync(muridDir);
        }
      }

      // Hapus folder tugas jika sudah kosong
      if (fs.readdirSync(tugasDir).length === 0) {
        fs.rmdirSync(tugasDir);
      }
    }
  } catch (err) {
    console.warn("[submission-cache] Auto-cleanup error:", err);
  }
}
