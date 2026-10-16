import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// POST /api/auth/setup-pin
// Body: { userId: string, pin: string }
export async function POST(req: NextRequest) {
  try {
    const { userId, pin } = await req.json();

    if (!userId || !pin || pin.length < 4) {
      return NextResponse.json({ error: "PIN minimal 4 digit." }, { status: 400 });
    }

    const hash = await bcrypt.hash(pin, 10);

    const { error } = await supabase
      .from("users")
      .update({ pin_hash: hash })
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[auth/setup-pin]", err);
    return NextResponse.json({ error: "Gagal menyimpan PIN." }, { status: 500 });
  }
}
