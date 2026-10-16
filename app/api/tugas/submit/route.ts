import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendTelegramSubmission } from "@/lib/telegram";

// POST /api/tugas/submit
// Murid mengumpulkan jawaban tugas
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tugasId, muridId, jawabanTeks, jawabanPG, jawabanEsaiList,
      fileName, fileSizeMb, isLargeVideo, autoNilai, pdfUrl, gdriveFileUrl
    } = body;

    if (!tugasId || !muridId) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const finalDriveUrl = gdriveFileUrl || pdfUrl || null;

    // Upsert pengumpulan (jika sudah ada → update, belum ada → insert)
    const { data, error } = await supabase
      .from("pengumpulan")
      .upsert({
        tugas_id: tugasId,
        murid_id: muridId,
        status: autoNilai !== undefined ? "dinilai" : "sudah",
        jawaban_teks: jawabanTeks || null,
        jawaban_pg: jawabanPG || null,
        jawaban_esai_list: jawabanEsaiList || null,
        file_name: fileName || null,
        file_size_mb: fileSizeMb || null,
        is_large_video: isLargeVideo || false,
        auto_nilai: autoNilai ?? null,
        nilai: autoNilai ?? null,
        pdf_url: pdfUrl || null,
        gdrive_file_url: finalDriveUrl,
        waktu_submit: new Date().toISOString(),
        // Reset rejection fields
        alasan_tolak: null,
        waktu_tolak: null,
      }, {
        onConflict: "tugas_id,murid_id",
      })
      .select()
      .single();

    if (error) throw error;

    // Kirim notifikasi Telegram ke topik mapel yang sesuai
    let telegramResult = null;
    try {
      const [userRes, tugasRes] = await Promise.all([
        supabase.from("users").select("nama, nis").eq("id", muridId).single(),
        supabase.from("tugas").select("judul, jenis, kelas:kelas_id(nama), mapel:mapel_id(*)").eq("id", tugasId).single(),
      ]);

      const u = userRes.data;
      const t = tugasRes.data as any;

      if (u && t) {
        let threadId: number | null = null;
        if (t.mapel?.telegram_topic_id) {
          const parsed = parseInt(String(t.mapel.telegram_topic_id), 10);
          if (!isNaN(parsed)) threadId = parsed;
        }
        if (!threadId && t.mapel?.kode && t.mapel.kode.startsWith("tg:")) {
          const parsed = parseInt(t.mapel.kode.replace("tg:", ""), 10);
          if (!isNaN(parsed)) threadId = parsed;
        }

        telegramResult = await sendTelegramSubmission({
          namaMurid: u.nama,
          nis: u.nis,
          kelasNama: t.kelas?.nama || "Kelas",
          mapelNama: t.mapel?.nama || "Mapel",
          tugasJudul: t.judul,
          jenisTugas: t.jenis || "tugas",
          fileName: fileName || null,
          fileUrl: finalDriveUrl,
          autoNilai: autoNilai ?? null,
          isLargeVideo: !!isLargeVideo,
          threadId,
        });
      }
    } catch (tgErr) {
      console.warn("[telegram notification error]", tgErr);
    }

    return NextResponse.json({ pengumpulan: data, telegram: telegramResult }, { status: 200 });
  } catch (err) {
    console.error("[tugas/submit]", err);
    return NextResponse.json({ error: "Gagal menyimpan jawaban." }, { status: 500 });
  }
}
