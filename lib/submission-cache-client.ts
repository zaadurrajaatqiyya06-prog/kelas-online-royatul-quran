/**
 * Helper client-side murni untuk kalkulasi waktu cache submission.
 * TIDAK menggunakan fs/path — aman dipakai di Client Component.
 */

export const MAX_CACHE_DAYS = 7;

/**
 * Hitung berapa hari tersisa sebelum cache file kadaluarsa.
 * Digunakan di sisi client untuk menampilkan badge "Tersisa X hari".
 */
export function getDaysRemaining(waktuSubmit: string): number {
  const submitDate = new Date(waktuSubmit);
  const now = new Date();
  const diffMs = now.getTime() - submitDate.getTime();
  const usedDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(MAX_CACHE_DAYS - usedDays));
}

/**
 * Cek apakah file cache masih aktif berdasarkan waktu submit.
 */
export function isCacheActive(waktuSubmit: string): boolean {
  return getDaysRemaining(waktuSubmit) > 0;
}
