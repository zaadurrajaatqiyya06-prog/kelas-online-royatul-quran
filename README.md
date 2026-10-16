# 🕌 Kelas Online Royatul Qur'an (KORQ) - Progressive Web App

Aplikasi terpadu manajemen kelas online, penugasan mandiri santri, auto-grading, monitoring matriks wali kelas secara realtime, integrasi Telegram Supergroup Topics & Google Drive, serta tautan pantau langsung bagi wali murid.

---

## 🌟 Fitur Utama Sistem

1. **Autentikasi Single-ID & PIN**:
   - Santri: Login cukup memasukkan **NIS** + PIN.
   - Guru / Wali Kelas: Login dengan **NIP** + PIN.
   - Admin: Akses data master, kenaikan kelas, dan akun.
2. **Penugasan & Pengumpulan Mandiri Santri**:
   - Mendukung jenis tugas: Pilihan Ganda (Auto-Grading), Esai bertingkat, Foto berkas tugas, dan Video setoran hafalan **tanpa batasan durasi**.
   - Kompresi foto otomatis di browser ($\le 500$ KB).
   - **Auto-Save Draf Jawaban**: Jawaban tersimpan otomatis secara lokal di perangkat, mencegah hilangnya ketikan santri saat sinyal internet drop.
3. **PWA (Progressive Web App) & Offline Ready**:
   - Dapat diinstall langsung ke layar utama Android & iOS (Add to Home Screen).
   - Dilengkapi Service Worker (`/sw.js`) dan halaman fallback khusus offline (`/offline`).
   - Indikator koneksi internet realtime.
4. **Matriks Pengumpulan Tugas Live untuk Wali Murid (`/pantau/[kelasSlug]`)**:
   - Tautan publik ramah wali murid (cth: `/pantau/kelas-6`) tanpa perlu login / PIN.
   - Checklist realtime (✅ Sudah Kumpul / ❌ Belum Kumpul).
   - Bilah pencarian nama santri yang cepat dan responsif.
   - Generator format laporan ringkasan WhatsApp 1-klik untuk wali kelas.
5. **Integrasi Media & Cloud Storage Hybrid**:
   - **Telegram Supergroup Bot**: Notifikasi pengumpulan tugas otomatis diteruskan ke topik forum Telegram per mapel.
   - **Google Drive API (OAuth 2.0)**: Pengarsipan file & video setoran ke hierarki folder terstruktur: `[Kelas] / [Mapel] / [Nama Santri]`.

---

## 🚀 Panduan Deployment ke Vercel

### 1. Push ke GitHub / Git Repository
Pastikan kode project sudah di-push ke repositori Git (GitHub/GitLab).

### 2. Import Project di Vercel
1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan klik **Add New Project**.
2. Pilih repositori `kelas-online-royatul-quran`.
3. Framework Preset akan otomatis terdeteksi sebagai **Next.js**.

### 3. Konfigurasi Environment Variables di Vercel
Masukkan variabel lingkungan berikut di bagian **Environment Variables** (lihat file [`.env.example`](file:///c:/Users/User/.gemini/antigravity-ide/scratch/kelas-online-royatul-quran/.env.example)):

| Variabel | Sumber Nilai |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Proyek Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Key Supabase |
| `NEXT_PUBLIC_APP_NAME` | `Kelas Online Royatul Quran` |
| `TELEGRAM_BOT_TOKEN` | Token Bot Telegram dari `@BotFather` |
| `TELEGRAM_SUPERGROUP_ID` | ID Supergroup (Format: `-100xxxxxxxxxx`) |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID dari Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret dari Google Cloud Console |
| `GOOGLE_REFRESH_TOKEN` | Refresh Token OAuth 2.0 Google Drive |
| `GOOGLE_DRIVE_FOLDER_ID` | ID Folder Induk "Tugas Royatul Quran" di Google Drive |
| `GDRIVE_ROOT_FOLDER_ID` | ID Folder Induk yang sama dengan di atas |

### 4. Deploy!
Klik tombol **Deploy**. Next.js 16 dengan Turbopack akan mengompilasi seluruh halaman static, API routes, dan partial prerender.

---

## 🔑 Akun Default untuk Pengujian

| Peran | ID Login (NIS / NIP) | PIN Default | Keterangan |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `123456` | Manajemen data master, kenaikan kelas, dan reset PIN |
| **Guru / Walas** | `19850101` | `123456` | Ustadz Zaadurraja Atqiyya (Wali Kelas 6 & Pengampu Bahasa Arab) |
| **Santri (Murid)** | `2024001` | `123456` | Ahmad Santri (Murid Kelas 6) |

---

## 🛠️ Menjalankan Secara Lokal (Development)

```bash
# Install dependensi (jika baru clone)
npm install

# Jalankan server development
npm run dev

# Validasi build produksi
npm run build
```

Aplikasi berjalan di [http://localhost:3000](http://localhost:3000) (atau port yang aktif).
Tautan live wali murid: [http://localhost:3000/pantau/kelas-6](http://localhost:3000/pantau/kelas-6).
