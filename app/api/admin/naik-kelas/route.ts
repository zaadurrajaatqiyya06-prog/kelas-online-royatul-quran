import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/admin/naik-kelas → proses kenaikan kelas
// Modes:
//   "serempak"  : semua murid di kelas X naik ke kelas Y
//   "manual"    : list specific murid pindah ke kelas tertentu
//   "pengecualian" : semua naik KECUALI list murid tertentu (tinggal kelas)

export async function POST(req: NextRequest) {
  try {
    const { mode, kelasAsalId, kelasTargetId, muridIds, pengecualianIds } = await req.json();

    let targetIds: string[] = [];

    if (mode === "serempak") {
      // Ambil semua murid di kelas asal
      const { data: murid, error } = await supabase
        .from("users")
        .select("id")
        .eq("kelas_id", kelasAsalId)
        .eq("role", "murid");

      if (error) throw error;
      targetIds = (murid || []).map((m) => m.id);

    } else if (mode === "manual") {
      // Pindahkan murid yang dipilih saja
      targetIds = muridIds || [];

    } else if (mode === "pengecualian") {
      // Semua murid kelas asal KECUALI yang dikecualikan (tinggal kelas)
      const { data: murid, error } = await supabase
        .from("users")
        .select("id")
        .eq("kelas_id", kelasAsalId)
        .eq("role", "murid");

      if (error) throw error;
      const excluded = new Set(pengecualianIds || []);
      targetIds = (murid || []).filter((m) => !excluded.has(m.id)).map((m) => m.id);
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ message: "Tidak ada murid yang dipindahkan.", moved: 0 }, { status: 200 });
    }

    // Update kelas_id semua target murid
    const { error: updateError } = await supabase
      .from("users")
      .update({ kelas_id: kelasTargetId })
      .in("id", targetIds);

    if (updateError) throw updateError;

    // Update total_murid kedua kelas jika function rpc ada
    try {
      await supabase.rpc("refresh_total_murid", { kelas_id_param: kelasAsalId });
    } catch {}
    try {
      await supabase.rpc("refresh_total_murid", { kelas_id_param: kelasTargetId });
    } catch {}

    return NextResponse.json({ success: true, moved: targetIds.length }, { status: 200 });
  } catch (err) {
    console.error("[admin/naik-kelas]", err);
    return NextResponse.json({ error: "Gagal proses kenaikan kelas." }, { status: 500 });
  }
}
