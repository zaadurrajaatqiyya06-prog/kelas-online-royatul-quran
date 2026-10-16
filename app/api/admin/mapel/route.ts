import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/admin/mapel
export async function POST(req: NextRequest) {
  try {
    const { nama, kode } = await req.json();
    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama mapel wajib diisi." }, { status: 400 });
    }
    const cleanNama = nama.trim();

    // 1. Buat topik Telegram Forum terlebih dahulu
    let threadId: number | null = null;
    let telegramError: string | null = null;
    try {
      const { createTelegramTopic } = await import("@/lib/telegram");
      const tgRes = await createTelegramTopic(cleanNama);
      if (tgRes.success && tgRes.threadId) {
        threadId = tgRes.threadId;
      } else if (tgRes.error) {
        telegramError = tgRes.error;
      }
    } catch (e: any) {
      console.warn("[admin/mapel] createTelegramTopic error:", e?.message || e);
      telegramError = e?.message || "Telegram error";
    }

    // 2. Simpan ke database Supabase
    // Coba dengan kolom telegram_topic_id, jika belum ada di schema fallback simpan threadId di kode
    let insertData: any = {
      nama: cleanNama,
      kode: kode || (threadId ? `tg:${threadId}` : null),
    };
    if (threadId) {
      insertData.telegram_topic_id = String(threadId);
    }

    let mapelRow: any = null;
    const firstTry = await supabase.from("mapel").insert(insertData).select().single();

    if (firstTry.error) {
      // Jika error karena kolom telegram_topic_id belum dibuat di database, simpan tanpa kolom itu
      if (firstTry.error.message && firstTry.error.message.includes("telegram_topic_id")) {
        const fallbackData = {
          nama: cleanNama,
          kode: threadId ? `tg:${threadId}` : (kode || null),
        };
        const secondTry = await supabase.from("mapel").insert(fallbackData).select().single();
        if (secondTry.error) {
          if (secondTry.error.code === "23505") {
            return NextResponse.json({ error: "Mapel sudah ada." }, { status: 409 });
          }
          throw secondTry.error;
        }
        mapelRow = secondTry.data;
      } else if (firstTry.error.code === "23505") {
        return NextResponse.json({ error: "Mapel sudah ada." }, { status: 409 });
      } else {
        throw firstTry.error;
      }
    } else {
      mapelRow = firstTry.data;
    }

    // 3. Otomatis buat folder Google Drive untuk semua kelas yang terdaftar
    let driveResult: { success: boolean; createdCount: number; errors: string[] } = {
      success: false,
      createdCount: 0,
      errors: [],
    };
    try {
      const { data: kelasRows } = await supabase.from("kelas").select("nama").order("jenjang");
      const kelasNames = (kelasRows && kelasRows.length > 0)
        ? kelasRows.map((k) => k.nama)
        : ["Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6"];

      const { createMapelFoldersForAllClasses } = await import("@/lib/gdrive");
      driveResult = await createMapelFoldersForAllClasses(cleanNama, kelasNames);
    } catch (e: any) {
      console.warn("[admin/mapel] createMapelFoldersForAllClasses error:", e?.message || e);
      driveResult.errors.push(e?.message || "GDrive error");
    }

    return NextResponse.json({
      mapel: mapelRow,
      telegram: {
        success: !!threadId,
        threadId,
        error: telegramError,
      },
      gdrive: driveResult,
    }, { status: 201 });

  } catch (err: any) {
    console.error("[admin/mapel POST]", err);
    return NextResponse.json({ error: err.message || "Gagal tambah mapel." }, { status: 500 });
  }
}

// DELETE /api/admin/mapel?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib." }, { status: 400 });

    // 1. Ambil data mapel untuk cek apakah ada thread telegram yang perlu dibersihkan
    const { data: mapelData } = await supabase.from("mapel").select("*").eq("id", id).single();
    let threadId: number | null = null;
    if (mapelData) {
      if (mapelData.telegram_topic_id) {
        const parsed = parseInt(mapelData.telegram_topic_id, 10);
        if (!isNaN(parsed)) threadId = parsed;
      } else if (mapelData.kode && mapelData.kode.startsWith("tg:")) {
        const parsed = parseInt(mapelData.kode.replace("tg:", ""), 10);
        if (!isNaN(parsed)) threadId = parsed;
      }
    }

    // 2. Hapus dari database
    const { error } = await supabase.from("mapel").delete().eq("id", id);
    if (error) throw error;

    // 3. Bersihkan topik Telegram jika ada
    if (threadId) {
      try {
        const { deleteTelegramTopic } = await import("@/lib/telegram");
        await deleteTelegramTopic(threadId);
      } catch (tgErr) {
        console.warn("[admin/mapel DELETE] deleteTelegramTopic error:", tgErr);
      }
    }

    // 4. Bersihkan folder Google Drive di semua kelas untuk mapel ini
    if (mapelData && mapelData.nama) {
      try {
        const { data: kelasRows } = await supabase.from("kelas").select("nama").order("jenjang");
        const kelasNames = (kelasRows && kelasRows.length > 0)
          ? kelasRows.map((k) => k.nama)
          : ["Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6"];

        const { deleteMapelFoldersForAllClasses } = await import("@/lib/gdrive");
        await deleteMapelFoldersForAllClasses(mapelData.nama, kelasNames);
      } catch (driveErr) {
        console.warn("[admin/mapel DELETE] deleteMapelFoldersForAllClasses error:", driveErr);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[admin/mapel DELETE]", err);
    return NextResponse.json({ error: err.message || "Gagal hapus mapel." }, { status: 500 });
  }
}
