import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/guru/nilai-manual → input nilai offline batch
export async function POST(req: NextRequest) {
  try {
    const { guruId, kelasId, mapelId, judul, tanggalPenilaian, scores } = await req.json();

    if (!guruId || !kelasId || !mapelId || !judul || !scores?.length) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("nilai_manual")
      .insert({
        guru_id: guruId,
        kelas_id: kelasId,
        mapel_id: mapelId,
        judul,
        tanggal_penilaian: tanggalPenilaian || new Date().toISOString().split("T")[0],
        scores,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ nilaiManual: data }, { status: 201 });
  } catch (err) {
    console.error("[guru/nilai-manual]", err);
    return NextResponse.json({ error: "Gagal menyimpan nilai manual." }, { status: 500 });
  }
}
