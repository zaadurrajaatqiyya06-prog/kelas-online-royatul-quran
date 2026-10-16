import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/data/master
// Returns: { users, kelas, mapel, assignments, tugasList, pengumpulanList, nilaiManualList }
// Dipanggil saat app pertama kali load (setelah login)
export async function GET(req: NextRequest) {
  try {
    // Parallel fetch semua data master
    const [usersRes, kelasRes, mapelRes, assignRes, tugasRes, pengumpulanRes, nilaiManualRes] =
      await Promise.all([
        supabase.from("users").select("*").order("nama"),
        supabase.from("kelas").select("*, wali:wali_id(id,nama)").order("jenjang,rombel"),
        supabase.from("mapel").select("*").order("nama"),
        supabase.from("guru_mapel_kelas").select("*, guru:guru_id(id,nama), mapel:mapel_id(id,nama), kelas:kelas_id(id,nama,jenjang,rombel)"),
        supabase.from("tugas").select("*, mapel:mapel_id(id,nama), kelas:kelas_id(id,nama,jenjang,rombel), guru:guru_id(id,nama)").order("created_at", { ascending: false }),
        supabase.from("pengumpulan").select("*, murid:murid_id(id,nama,nis)").order("waktu_submit", { ascending: false }),
        supabase.from("nilai_manual").select("*").order("created_at", { ascending: false }),
      ]);

    if (usersRes.error) throw usersRes.error;
    if (kelasRes.error) throw kelasRes.error;
    if (mapelRes.error) throw mapelRes.error;
    if (assignRes.error) throw assignRes.error;
    if (tugasRes.error) throw tugasRes.error;
    if (pengumpulanRes.error) throw pengumpulanRes.error;
    if (nilaiManualRes.error) throw nilaiManualRes.error;

    // Transform ke format yang dipakai store (compatible dengan mock-data types)
    const users = (usersRes.data || []).map(transformUser);
    const kelas = (kelasRes.data || []).map(transformKelas);
    const mapel = (mapelRes.data || []).map((m: any) => ({ id: m.id, nama: m.nama, kode: m.kode }));
    const assignments = (assignRes.data || []).map(transformAssignment);
    const tugasList = (tugasRes.data || []).map(transformTugas);
    const pengumpulanList = (pengumpulanRes.data || []).map(transformPengumpulan);
    const nilaiManualList = (nilaiManualRes.data || []).map(transformNilaiManual);

    return NextResponse.json({
      users, kelas, mapel, assignments, tugasList, pengumpulanList, nilaiManualList,
    });
  } catch (err) {
    console.error("[data/master]", err);
    return NextResponse.json({ error: "Gagal memuat data." }, { status: 500 });
  }
}

// ─── Transform functions (DB → App format) ──────────────────────────────────

function transformUser(u: any) {
  const kelas = u.kelas as { id: string; nama: string; jenjang: number; rombel: string | null } | null;
  return {
    id: u.id,
    nama: u.nama,
    role: u.role,
    nis: u.nis,
    nip: u.nip,
    nisn: u.nisn,
    nik: u.nik,
    noKK: u.no_kk,
    noWa: u.no_wa,
    fotoUrl: u.foto_url,
    kelasId: u.kelas_id,
    kelasNama: kelas ? `Kelas ${kelas.jenjang}${kelas.rombel || ""}` : undefined,
  };
}

function transformKelas(k: any) {
  return {
    id: k.id,
    nama: k.nama,
    jenjang: k.jenjang,
    tingkat: k.jenjang,
    rombel: k.rombel,
    waliId: k.wali_id,
    waliNama: k.wali?.nama,
    totalMurid: k.total_murid || 0,
  };
}

function transformAssignment(a: any) {
  return {
    id: a.id,
    guruId: a.guru_id,
    guruNama: a.guru?.nama || "",
    mapelId: a.mapel_id,
    mapelNama: a.mapel?.nama || "",
    kelasId: a.kelas_id,
    kelasNama: a.kelas
      ? `Kelas ${a.kelas.jenjang}${a.kelas.rombel || ""}`
      : "",
  };
}

function transformTugas(t: any) {
  return {
    id: t.id,
    judul: t.judul,
    mapelId: t.mapel_id,
    mapelNama: t.mapel?.nama || "",
    kelasId: t.kelas_id,
    kelasNama: t.kelas ? `Kelas ${t.kelas.jenjang}${t.kelas.rombel || ""}` : "",
    guruId: t.guru_id,
    guruNama: t.guru?.nama || "",
    jenis: t.jenis,
    instruksi: t.instruksi,
    deadline: t.deadline,
    soalPGList: t.soal_pg
      ? t.soal_pg.map((s: any) => ({
          id: s.id,
          nomor: s.nomor,
          pertanyaan: s.pertanyaan,
          opsiA: s.opsi_a,
          opsiB: s.opsi_b,
          opsiC: s.opsi_c,
          opsiD: s.opsi_d,
          kunciJawaban: s.kunci_jawaban,
        }))
      : undefined,
    soalEsaiList: t.soal_esai
      ? t.soal_esai.map((s: any) => ({
          id: s.id,
          nomor: s.nomor,
          pertanyaan: s.pertanyaan,
        }))
      : undefined,
    isManualOffline: t.is_manual_offline,
    tanggalPenilaian: t.tanggal_penilaian,
    gdriveFolderId: t.gdrive_folder_id,
    driveFolderUrl: t.gdrive_folder_id ? `https://drive.google.com/drive/folders/${t.gdrive_folder_id}` : undefined,
    createdAt: t.created_at,
  };
}

function transformPengumpulan(p: any) {
  return {
    id: p.id,
    tugasId: p.tugas_id,
    muridId: p.murid_id,
    muridNama: p.murid?.nama,
    muridNis: p.murid?.nis,
    status: p.status,
    jawabanTeks: p.jawaban_teks,
    jawabanPG: p.jawaban_pg,
    jawabanEsaiList: p.jawaban_esai,
    fileName: p.file_name,
    fileSizeMb: p.file_size_mb,
    isLargeVideo: p.is_large_video,
    autoNilai: p.auto_nilai,
    pdfUrl: p.pdf_url,
    gdriveFileUrl: p.gdrive_file_url,
    telegramFileId: p.telegram_file_id,
    nilai: p.nilai,
    catatanGuru: p.catatan_guru,
    dinilaiOleh: p.dinilai_oleh,
    waktuNilai: p.waktu_nilai,
    alasanTolak: p.alasan_tolak,
    waktuTolak: p.waktu_tolak,
    waktuSubmit: p.waktu_submit,
  };
}

function transformNilaiManual(n: any) {
  return {
    id: n.id,
    guruId: n.guru_id,
    kelasId: n.kelas_id,
    mapelId: n.mapel_id,
    judul: n.judul,
    tanggalPenilaian: n.tanggal_penilaian,
    scores: n.scores || [],
    createdAt: n.created_at,
  };
}
