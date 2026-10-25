import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ─── GET /api/halaqah/catatan?halaqahId=...&tanggal=... ──────────────────────
export async function GET(req: NextRequest) {
  try {
    const halaqahId = req.nextUrl.searchParams.get("halaqahId");
    const tanggal = req.nextUrl.searchParams.get("tanggal");
    if (!halaqahId) return NextResponse.json({ error: "halaqahId wajib." }, { status: 400 });

    let query = supabase
      .from("halaqah_catatan")
      .select("*, murid:murid_id(id,nama,nis)")
      .eq("halaqah_id", halaqahId)
      .order("tanggal", { ascending: false });

    if (tanggal) query = query.eq("tanggal", tanggal);

    const { data, error } = await query;
    if (error) throw error;

    const catatan = (data || []).map((c: any) => ({
      id: c.id,
      halaqahId: c.halaqah_id,
      muridId: c.murid_id,
      musyrifId: c.musyrif_id,
      tanggal: c.tanggal,
      jenis: c.jenis,
      capaian: c.capaian,
      catatan: c.catatan,
      nilai: c.nilai,
      muridNama: c.murid?.nama,
      muridNis: c.murid?.nis,
      createdAt: c.created_at,
    }));

    return NextResponse.json({ catatan }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/halaqah/catatan — Tambah/update catatan kehadiran & capaian ───
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { halaqahId, muridId, tanggal, jenis, capaian, catatan, nilai, musyrifId } = body;

    if (!halaqahId || !muridId || !tanggal || !jenis) {
      return NextResponse.json({ error: "halaqahId, muridId, tanggal, jenis wajib." }, { status: 400 });
    }

    // Upsert: jika sudah ada catatan hari ini untuk murid ini, update; jika tidak, insert baru
    const { error } = await supabase
      .from("halaqah_catatan")
      .upsert(
        {
          halaqah_id: halaqahId,
          murid_id: muridId,
          tanggal,
          jenis,
          capaian: capaian ?? null,
          catatan: catatan ?? null,
          nilai: nilai ?? null,
          musyrif_id: musyrifId ?? null,
        },
        {
          onConflict: "halaqah_id,murid_id,tanggal",
          ignoreDuplicates: false,
        }
      );

    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
