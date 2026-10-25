import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ─── GET /api/halaqah/anggota?halaqahId=... — Ambil anggota halaqah ──────────
export async function GET(req: NextRequest) {
  try {
    const halaqahId = req.nextUrl.searchParams.get("halaqahId");
    if (!halaqahId) return NextResponse.json({ error: "halaqahId wajib." }, { status: 400 });

    const { data, error } = await supabase
      .from("halaqah_anggota")
      .select("*, murid:murid_id(id,nama,nis,kelas_id,kelas:kelas_id(nama,jenjang))")
      .eq("halaqah_id", halaqahId)
      .order("joined_at", { ascending: true });

    if (error) throw error;

    const anggota = (data || []).map((a: any) => ({
      id: a.id,
      halaqahId: a.halaqah_id,
      muridId: a.murid_id,
      muridNama: a.murid?.nama,
      muridNis: a.murid?.nis,
      kelasNama: a.murid?.kelas?.nama ?? null,
      jenjang: a.murid?.kelas?.jenjang ?? null,
      joinedAt: a.joined_at,
    }));

    return NextResponse.json({ anggota }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/halaqah/anggota — Tambah anggota (batch) ──────────────────────
export async function POST(req: NextRequest) {
  try {
    const { halaqahId, muridIds } = await req.json();
    if (!halaqahId || !muridIds?.length) {
      return NextResponse.json({ error: "halaqahId dan muridIds wajib." }, { status: 400 });
    }

    // Filter: jangan tambah murid yang sudah ada di halaqah ini
    const { data: existing } = await supabase
      .from("halaqah_anggota")
      .select("murid_id")
      .eq("halaqah_id", halaqahId)
      .in("murid_id", muridIds);

    const existingIds = new Set((existing || []).map((e: any) => e.murid_id));
    const newIds = muridIds.filter((id: string) => !existingIds.has(id));

    if (newIds.length === 0) {
      return NextResponse.json({ ok: true, added: 0, message: "Semua murid sudah terdaftar." }, { status: 200 });
    }

    const rows = newIds.map((muridId: string) => ({
      halaqah_id: halaqahId,
      murid_id: muridId,
    }));

    const { error } = await supabase.from("halaqah_anggota").insert(rows);
    if (error) throw error;

    return NextResponse.json({ ok: true, added: newIds.length }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE /api/halaqah/anggota?halaqahId=...&muridId=... — Hapus anggota ──
export async function DELETE(req: NextRequest) {
  try {
    const halaqahId = req.nextUrl.searchParams.get("halaqahId");
    const muridId = req.nextUrl.searchParams.get("muridId");
    if (!halaqahId || !muridId) {
      return NextResponse.json({ error: "halaqahId dan muridId wajib." }, { status: 400 });
    }

    const { error } = await supabase
      .from("halaqah_anggota")
      .delete()
      .eq("halaqah_id", halaqahId)
      .eq("murid_id", muridId);

    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
