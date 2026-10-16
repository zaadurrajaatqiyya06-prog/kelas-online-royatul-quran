import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/guru/nilai → input nilai oleh guru
// Body: { pengumpulanId, nilai, catatan, guruId }
export async function POST(req: NextRequest) {
  try {
    const { pengumpulanId, nilai, catatan, guruId } = await req.json();

    if (!pengumpulanId || nilai === undefined) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const { error } = await supabase
      .from("pengumpulan")
      .update({
        nilai,
        catatan_guru: catatan || null,
        status: "dinilai",
        dinilai_oleh: guruId || null,
        waktu_nilai: new Date().toISOString(),
      })
      .eq("id", pengumpulanId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[guru/nilai]", err);
    return NextResponse.json({ error: "Gagal menyimpan nilai." }, { status: 500 });
  }
}
