import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// POST /api/admin/users/ganti-pin
// Admin mengubah/mereset PIN user secara manual
// Body: { userId: string, newPin: string }
export async function POST(req: NextRequest) {
  try {
    const { userId, newPin } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "ID user wajib diisi." }, { status: 400 });
    }

    if (!newPin || typeof newPin !== "string" || newPin.trim().length < 4) {
      return NextResponse.json({ error: "PIN baru minimal 4 karakter (disarankan 6 digit angka)." }, { status: 400 });
    }

    // Hash PIN baru dengan bcrypt
    const pin_hash = await bcrypt.hash(newPin.trim(), 10);

    const { error } = await supabase
      .from("users")
      .update({
        pin_hash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "PIN user berhasil diperbarui.",
    }, { status: 200 });

  } catch (err: any) {
    console.error("[admin/users/ganti-pin]", err);
    return NextResponse.json({ error: "Gagal mengganti PIN. Coba lagi." }, { status: 500 });
  }
}
