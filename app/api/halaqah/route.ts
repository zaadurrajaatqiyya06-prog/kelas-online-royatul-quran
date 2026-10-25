import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ─── GET /api/halaqah — Ambil semua halaqah ───────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("halaqah")
      .select("*, musyrif:musyrif_id(id,nama), anggota:halaqah_anggota(count)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const halaqahList = (data || []).map((h: any) => ({
      id: h.id,
      nama: h.nama,
      jenis: h.jenis,
      musyrifId: h.musyrif_id,
      musyrifNama: h.musyrif?.nama ?? null,
      targetSurah: h.target_surah,
      jadwal: h.jadwal,
      totalAnggota: h.anggota?.[0]?.count ?? 0,
      createdAt: h.created_at,
    }));

    return NextResponse.json({ halaqahList }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/halaqah — Buat halaqah baru ───────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, jenis = "tahsin", musyrifId, targetSurah, jadwal } = body;

    if (!nama?.trim()) {
      return NextResponse.json({ error: "Nama halaqah wajib diisi." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("halaqah")
      .insert({
        nama,
        jenis,
        musyrif_id: musyrifId || null,
        target_surah: targetSurah || null,
        jadwal: jadwal || null,
      })
      .select("*, musyrif:musyrif_id(id,nama)")
      .single();

    if (error) throw error;

    const halaqah = {
      id: data.id,
      nama: data.nama,
      jenis: data.jenis,
      musyrifId: data.musyrif_id,
      musyrifNama: data.musyrif?.nama ?? null,
      targetSurah: data.target_surah,
      jadwal: data.jadwal,
      totalAnggota: 0,
      createdAt: data.created_at,
    };

    return NextResponse.json({ halaqah }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH /api/halaqah — Update musyrif ────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const { halaqahId, musyrifId } = await req.json();
    if (!halaqahId) return NextResponse.json({ error: "halaqahId wajib." }, { status: 400 });

    const { error } = await supabase
      .from("halaqah")
      .update({ musyrif_id: musyrifId || null })
      .eq("id", halaqahId);

    if (error) throw error;

    // Ambil nama musyrif
    let musyrifNama: string | null = null;
    if (musyrifId) {
      const { data: guru } = await supabase.from("users").select("nama").eq("id", musyrifId).single();
      musyrifNama = guru?.nama ?? null;
    }

    return NextResponse.json({ ok: true, musyrifNama }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE /api/halaqah?id=... — Hapus halaqah ─────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id wajib." }, { status: 400 });

    // Cascade: hapus anggota & catatan terkait dulu
    await supabase.from("halaqah_catatan").delete().eq("halaqah_id", id);
    await supabase.from("halaqah_anggota").delete().eq("halaqah_id", id);
    const { error } = await supabase.from("halaqah").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
