import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// POST /api/admin/users → tambah user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, nis, nip, nisn, nik, noKK, noWa, role, kelasId, pin } = body;

    if (!nama || !role) {
      return NextResponse.json({ error: "Nama dan role wajib diisi." }, { status: 400 });
    }

    // Hash PIN jika ada
    let pin_hash = null;
    if (pin && pin.length >= 4) {
      pin_hash = await bcrypt.hash(pin, 10);
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        nama,
        nis: nis?.toUpperCase() || null,
        nip: nip?.toUpperCase() || null,
        nisn: nisn || null,
        nik: nik || null,
        no_kk: noKK || null,
        no_wa: noWa || null,
        role,
        kelas_id: kelasId || null,
        pin_hash,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (err: any) {
    console.error("[admin/users POST]", err);
    if (err.code === "23505") {
      return NextResponse.json({ error: "NIS/NIP sudah terdaftar." }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal menambah user." }, { status: 500 });
  }
}

// PUT /api/admin/users → update user
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, nama, nis, nip, nisn, nik, noKK, noWa, kelasId, pin } = body;

    if (!id) return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });

    const updateData: Record<string, any> = {
      nama,
      nis: nis?.toUpperCase() || null,
      nip: nip?.toUpperCase() || null,
      nisn: nisn || null,
      nik: nik || null,
      no_kk: noKK || null,
      no_wa: noWa || null,
      kelas_id: kelasId || null,
    };

    // Update PIN jika diisi
    if (pin && pin.length >= 4) {
      updateData.pin_hash = await bcrypt.hash(pin, 10);
    }

    const { error } = await supabase.from("users").update(updateData).eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[admin/users PUT]", err);
    return NextResponse.json({ error: "Gagal update user." }, { status: 500 });
  }
}

// DELETE /api/admin/users?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });

    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[admin/users DELETE]", err);
    return NextResponse.json({ error: "Gagal hapus user." }, { status: 500 });
  }
}
