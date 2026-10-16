import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// POST /api/admin/users/bulk → import batch dari Excel template
// Body: { users: [{nama,nis,nisn,nik,noKK,noWa,kelasId}] }
export async function POST(req: NextRequest) {
  try {
    const { users } = await req.json();

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: "Data kosong." }, { status: 400 });
    }

    // Default PIN = NIS (murid bisa ganti nanti)
    const rows = await Promise.all(
      users.map(async (u: any) => {
        const defaultPin = (u.nis || u.nip || "1234").toString();
        const pin_hash = await bcrypt.hash(defaultPin, 10);
        return {
          nama: u.nama,
          nis: u.nis?.toString().toUpperCase() || null,
          nip: u.nip?.toString().toUpperCase() || null,
          nisn: u.nisn?.toString() || null,
          nik: u.nik?.toString() || null,
          no_kk: u.noKK?.toString() || null,
          no_wa: u.noWa?.toString() || null,
          role: u.role || "murid",
          kelas_id: u.kelasId || null,
          pin_hash,
        };
      })
    );

    const { data, error } = await supabase
      .from("users")
      .upsert(rows, { onConflict: "nis", ignoreDuplicates: false })
      .select();

    if (error) throw error;

    return NextResponse.json({ inserted: data?.length || 0, users: data }, { status: 200 });
  } catch (err) {
    console.error("[admin/users/bulk]", err);
    return NextResponse.json({ error: "Gagal import data." }, { status: 500 });
  }
}
