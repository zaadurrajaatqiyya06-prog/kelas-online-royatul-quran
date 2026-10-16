import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/guru/tolak → guru menolak jawaban murid
export async function POST(req: NextRequest) {
  try {
    const { pengumpulanId, alasan } = await req.json();
    if (!pengumpulanId || !alasan?.trim()) {
      return NextResponse.json({ error: "Pengumpulan ID dan alasan wajib diisi." }, { status: 400 });
    }

    const { error } = await supabase
      .from("pengumpulan")
      .update({
        status: "ditolak",
        alasan_tolak: alasan.trim(),
        waktu_tolak: new Date().toISOString(),
        nilai: null,
        catatan_guru: null,
      })
      .eq("id", pengumpulanId);

    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[guru/tolak]", err);
    return NextResponse.json({ error: "Gagal menolak tugas." }, { status: 500 });
  }
}
