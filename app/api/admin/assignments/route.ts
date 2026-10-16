import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/admin/assignments → assign guru ke mapel+kelas
export async function POST(req: NextRequest) {
  try {
    const { guruId, mapelId, kelasId } = await req.json();
    if (!guruId || !mapelId || !kelasId) {
      return NextResponse.json({ error: "guruId, mapelId, kelasId wajib." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("guru_mapel_kelas")
      .upsert({ guru_id: guruId, mapel_id: mapelId, kelas_id: kelasId }, { onConflict: "guru_id,mapel_id,kelas_id" })
      .select("*, guru:guru_id(id,nama), mapel:mapel_id(id,nama), kelas:kelas_id(id,nama,jenjang,rombel)")
      .single();

    if (error) throw error;
    return NextResponse.json({ assignment: data }, { status: 201 });
  } catch (err) {
    console.error("[admin/assignments POST]", err);
    return NextResponse.json({ error: "Gagal assign guru." }, { status: 500 });
  }
}

// DELETE /api/admin/assignments?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib." }, { status: 400 });

    const { error } = await supabase.from("guru_mapel_kelas").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[admin/assignments DELETE]", err);
    return NextResponse.json({ error: "Gagal hapus assignment." }, { status: 500 });
  }
}

// PUT /api/admin/assignments → assign guru ke multiple kelas/mapel sekaligus
// Body: { guruId?: string, assignments: [{guruId?, mapelId, kelasId}] }
export async function PUT(req: NextRequest) {
  try {
    const { guruId, assignments } = await req.json();
    if (!Array.isArray(assignments)) {
      return NextResponse.json({ error: "Data kosong." }, { status: 400 });
    }

    // If guruId is specified, replace all assignments for that guru
    if (guruId) {
      await supabase.from("guru_mapel_kelas").delete().eq("guru_id", guruId);
      if (assignments.length === 0) {
        return NextResponse.json({ success: true, count: 0 }, { status: 200 });
      }
      const rows = assignments.map((a: any) => ({
        guru_id: guruId,
        mapel_id: a.mapelId,
        kelas_id: a.kelasId,
      }));
      const { data, error } = await supabase.from("guru_mapel_kelas").insert(rows).select();
      if (error) throw error;
      return NextResponse.json({ success: true, count: data?.length || 0 }, { status: 200 });
    }

    const rows = assignments.map((a: any) => ({
      guru_id: a.guruId,
      mapel_id: a.mapelId,
      kelas_id: a.kelasId,
    }));

    const { data, error } = await supabase
      .from("guru_mapel_kelas")
      .upsert(rows, { onConflict: "guru_id,mapel_id,kelas_id" })
      .select();

    if (error) throw error;
    return NextResponse.json({ inserted: data?.length || 0 }, { status: 200 });
  } catch (err) {
    console.error("[admin/assignments PUT]", err);
    return NextResponse.json({ error: "Gagal bulk assign." }, { status: 500 });
  }
}
