import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/admin/mapel
export async function POST(req: NextRequest) {
  try {
    const { nama, kode } = await req.json();
    if (!nama) return NextResponse.json({ error: "Nama mapel wajib." }, { status: 400 });

    const { data, error } = await supabase
      .from("mapel")
      .insert({ nama, kode: kode || null })
      .select().single();

    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Mapel sudah ada." }, { status: 409 });
      throw error;
    }
    // Otomatis buat topik Telegram & buat folder Google Drive di background
    try {
      const { createTelegramTopic } = await import("@/lib/telegram");
      await createTelegramTopic(nama);
    } catch (e) {
      console.warn("[admin/mapel] createTelegramTopic skipped:", e);
    }

    (async () => {
      try {
        const { createMapelFoldersForAllClasses } = await import("@/lib/gdrive");
        await createMapelFoldersForAllClasses(nama);
      } catch (e) {
        console.warn("[admin/mapel] createMapelFoldersForAllClasses skipped:", e);
      }
    })();

    return NextResponse.json({ mapel: data }, { status: 201 });
  } catch (err) {
    console.error("[admin/mapel POST]", err);
    return NextResponse.json({ error: "Gagal tambah mapel." }, { status: 500 });
  }
}

// DELETE /api/admin/mapel?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib." }, { status: 400 });

    const { error } = await supabase.from("mapel").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[admin/mapel DELETE]", err);
    return NextResponse.json({ error: "Gagal hapus mapel." }, { status: 500 });
  }
}
