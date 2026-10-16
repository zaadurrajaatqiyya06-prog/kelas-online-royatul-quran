import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// POST /api/auth/login
// Body: { identifier: string (NIS/NIP), pin: string }
export async function POST(req: NextRequest) {
  try {
    const { identifier, pin } = await req.json();

    if (!identifier || !pin) {
      return NextResponse.json({ error: "Identitas dan PIN wajib diisi." }, { status: 400 });
    }

    const id = identifier.trim();

    // Cari user berdasarkan NIS atau NIP (case-insensitive)
    const { data: users, error } = await supabase
      .from("users")
      .select("*, kelas:kelas_id(id, nama, jenjang, rombel)")
      .or(`nis.ilike.${id},nip.ilike.${id}`)
      .limit(1);

    if (error) throw error;

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "Identitas tidak ditemukan." }, { status: 401 });
    }

    const user = users[0];

    // Cek PIN
    if (!user.pin_hash) {
      // User belum punya PIN → arahkan setup PIN
      return NextResponse.json({
        needsSetupPin: true,
        userId: user.id,
        nama: user.nama,
        role: user.role,
      }, { status: 200 });
    }

    const isValid = await bcrypt.compare(pin, user.pin_hash);
    if (!isValid) {
      return NextResponse.json({ error: "PIN salah. Coba lagi." }, { status: 401 });
    }

    // Bangun session user
    const kelasData = user.kelas as { id: string; nama: string; jenjang: number; rombel: string | null } | null;

    const sessionUser = {
      id: user.id,
      nama: user.nama,
      role: user.role,
      nis: user.nis,
      nip: user.nip,
      nisn: user.nisn,
      no_wa: user.no_wa,
      foto_url: user.foto_url,
      kelasId: user.kelas_id,
      kelasNama: kelasData
        ? `Kelas ${kelasData.jenjang}${kelasData.rombel ? kelasData.rombel : ""}`
        : null,
    };

    return NextResponse.json({ user: sessionUser }, { status: 200 });

  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Server error. Coba lagi." }, { status: 500 });
  }
}
