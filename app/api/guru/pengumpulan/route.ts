import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// DELETE /api/guru/pengumpulan?id=xxx → hapus satu jawaban murid
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib." }, { status: 400 });

    const { error } = await supabase.from("pengumpulan").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[guru/pengumpulan DELETE]", err);
    return NextResponse.json({ error: "Gagal hapus jawaban." }, { status: 500 });
  }
}
