import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/admin/kelas → tambah kelas
export async function POST(req: NextRequest) {
  try {
    const { nama, jenjang, rombel, waliId, totalMurid } = await req.json();
    if (!nama || !jenjang) return NextResponse.json({ error: "Nama dan jenjang wajib." }, { status: 400 });

    const { data, error } = await supabase
      .from("kelas")
      .insert({ nama, jenjang, rombel: rombel || null, wali_id: waliId || null, total_murid: totalMurid || 0 })
      .select().single();

    if (error) throw error;
    return NextResponse.json({ kelas: data }, { status: 201 });
  } catch (err) {
    console.error("[admin/kelas POST]", err);
    return NextResponse.json({ error: "Gagal tambah kelas." }, { status: 500 });
  }
}

// PUT /api/admin/kelas → update kelas
export async function PUT(req: NextRequest) {
  try {
    const { id, nama, jenjang, rombel, waliId, totalMurid } = await req.json();
    if (!id) return NextResponse.json({ error: "ID wajib." }, { status: 400 });

    const { error } = await supabase
      .from("kelas")
      .update({ nama, jenjang, rombel: rombel || null, wali_id: waliId || null, total_murid: totalMurid || 0 })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[admin/kelas PUT]", err);
    return NextResponse.json({ error: "Gagal update kelas." }, { status: 500 });
  }
}

// DELETE /api/admin/kelas?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib." }, { status: 400 });

    const { error } = await supabase.from("kelas").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[admin/kelas DELETE]", err);
    return NextResponse.json({ error: "Gagal hapus kelas." }, { status: 500 });
  }
}
