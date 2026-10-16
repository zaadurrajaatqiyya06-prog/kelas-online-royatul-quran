import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getOrCreateTaskFolderHierarchy } from "@/lib/gdrive";

// POST /api/guru/tugas → buat tugas baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      judul, mapelId, kelasId, guruId, jenis, instruksi, deadline,
      soalPGList, soalEsaiList, isManualOffline, tanggalPenilaian,
    } = body;

    if (!judul || !mapelId || !kelasId || !guruId || !jenis || !deadline) {
      return NextResponse.json({ error: "Data tugas tidak lengkap." }, { status: 400 });
    }

    // Transform soal ke format DB
    const soal_pg = soalPGList?.map((s: any) => ({
      id: s.id,
      nomor: s.nomor,
      pertanyaan: s.pertanyaan,
      opsi_a: s.opsiA,
      opsi_b: s.opsiB,
      opsi_c: s.opsiC || null,
      opsi_d: s.opsiD || null,
      kunci_jawaban: s.kunciJawaban,
    })) || null;

    const soal_esai = soalEsaiList?.map((s: any) => ({
      id: s.id,
      nomor: s.nomor,
      pertanyaan: s.pertanyaan,
    })) || null;

    // Otomatis siapkan folder di Google Drive jika terkonfigurasi
    let gdrive_folder_id = body.gdriveFolderId || null;
    if (!gdrive_folder_id && body.kelasNama && body.mapelNama) {
      try {
        const hierarchy = await getOrCreateTaskFolderHierarchy({
          kelasNama: body.kelasNama,
          mapelNama: body.mapelNama,
          tugasJudul: judul,
        });
        gdrive_folder_id = hierarchy.folderId;
      } catch (e) {
        console.warn("[tugas/create] GDrive folder creation skipped:", e);
      }
    }

    const { data, error } = await supabase
      .from("tugas")
      .insert({
        judul,
        mapel_id: mapelId,
        kelas_id: kelasId,
        guru_id: guruId,
        jenis,
        instruksi: instruksi || "",
        deadline,
        soal_pg,
        soal_esai,
        is_manual_offline: isManualOffline || false,
        tanggal_penilaian: tanggalPenilaian || null,
        gdrive_folder_id,
      })
      .select()
      .single();

    if (error) throw error;

    // Kirim pengumuman tugas baru ke Telegram jika terkonfigurasi
    (async () => {
      try {
        const { sendTelegramMessage } = await import("@/lib/telegram");
        const deadlineStr = new Date(deadline).toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
          dateStyle: "medium",
          timeStyle: "short",
        });
        const text = `📢 <b>TUGAS BARU DITERBITKAN</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🏫 <b>Kelas:</b> ${body.kelasNama || "Kelas"}\n` +
          `📚 <b>Mapel:</b> ${body.mapelNama || "Mapel"}\n` +
          `📝 <b>Judul:</b> ${judul}\n` +
          `📌 <b>Jenis:</b> ${jenis.toUpperCase()}\n` +
          `⏰ <b>Deadline:</b> ${deadlineStr} WIB\n` +
          (instruksi ? `📋 <b>Instruksi:</b> <i>${instruksi}</i>\n` : "") +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `<i>Silakan santri segera mengerjakan di aplikasi Kelas Online.</i>`;
        await sendTelegramMessage(text);
      } catch (tgErr) {
        console.warn("[telegram new task announcement skipped]", tgErr);
      }
    })();

    return NextResponse.json({ tugas: data }, { status: 201 });
  } catch (err) {
    console.error("[guru/tugas POST]", err);
    return NextResponse.json({ error: "Gagal membuat tugas." }, { status: 500 });
  }
}

// DELETE /api/guru/tugas?id=xxx → hapus tugas (cascade ke pengumpulan)
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID tugas wajib diisi." }, { status: 400 });

    const { error } = await supabase.from("tugas").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[guru/tugas DELETE]", err);
    return NextResponse.json({ error: "Gagal hapus tugas." }, { status: 500 });
  }
}
