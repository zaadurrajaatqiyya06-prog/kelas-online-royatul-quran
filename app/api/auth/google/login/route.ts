import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// GET /api/auth/google/login
// Memulai alur otorisasi OAuth 2.0 untuk mendapatkan Refresh Token Google Drive
export async function GET(req: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "GOOGLE_CLIENT_ID atau GOOGLE_CLIENT_SECRET belum dikonfigurasi di .env.local" },
        { status: 500 }
      );
    }

    // Ambil origin (misal http://localhost:3001 atau http://localhost:3000)
    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent", // Wajib agar Google selalu mengirimkan refresh_token
      scope: [
        "https://www.googleapis.com/auth/drive.file",
      ],
    });

    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error("[google/login]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
