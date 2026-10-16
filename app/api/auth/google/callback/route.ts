import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

// GET /api/auth/google/callback
// Menangani redirect dari Google, menukarkan auth code dengan Refresh Token,
// dan otomatis menyimpannya ke .env.local
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const errorParam = req.nextUrl.searchParams.get("error");

    if (errorParam) {
      return new NextResponse(
        `<html><body style="font-family:sans-serif;padding:40px;text-align:center;">
          <h2 style="color:#e11d48;">❌ Otorisasi Dibatalkan</h2>
          <p>Google mengembalikan pesan: <b>${errorParam}</b></p>
          <a href="/api/auth/google/login" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#059669;color:#fff;border-radius:8px;text-decoration:none;">Coba Lagi</a>
        </body></html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
      );
    }

    if (!code) {
      return new NextResponse(
        `<html><body style="font-family:sans-serif;padding:40px;text-align:center;">
          <h2 style="color:#e11d48;">❌ Kode Otorisasi Tidak Ditemukan</h2>
        </body></html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      return new NextResponse(
        `<html><body style="font-family:sans-serif;padding:40px;text-align:center;">
          <h2 style="color:#d97706;">⚠️ Refresh Token Tidak Diberikan oleh Google</h2>
          <p>Hal ini terjadi jika kamu sudah pernah memberikan izin sebelumnya tanpa prompt consent.</p>
          <p>Silakan klik tombol di bawah untuk meminta token baru dengan paksa:</p>
          <a href="/api/auth/google/login" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#059669;color:#fff;border-radius:8px;text-decoration:none;">Minta Izin Ulang (Force Consent)</a>
        </body></html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
      );
    }

    // Update .env.local
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, "utf-8");
      if (envContent.includes("GOOGLE_REFRESH_TOKEN=")) {
        envContent = envContent.replace(
          /GOOGLE_REFRESH_TOKEN=.*/,
          `GOOGLE_REFRESH_TOKEN=${refreshToken}`
        );
      } else {
        envContent += `\nGOOGLE_REFRESH_TOKEN=${refreshToken}\n`;
      }
      fs.writeFileSync(envPath, envContent, "utf-8");
      // Juga pasang di process.env saat runtime
      process.env.GOOGLE_REFRESH_TOKEN = refreshToken;
    }

    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Google Drive Berhasil Terhubung</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #ffffff; max-width: 520px; width: 100%; border-radius: 20px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01); text-align: center; border: 1px solid #e2e8f0; }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h1 { color: #0f172a; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; }
          p { color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; }
          .token-box { background: #f1f5f9; padding: 12px; border-radius: 12px; font-family: monospace; font-size: 12px; color: #0f172a; word-break: break-all; margin-bottom: 24px; text-align: left; }
          .btn { display: inline-block; padding: 12px 24px; background: #059669; color: #ffffff; font-weight: 600; font-size: 14px; border-radius: 12px; text-decoration: none; transition: background 0.2s; }
          .btn:hover { background: #047857; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🎉</div>
          <h1>Google Drive Berhasil Terhubung!</h1>
          <p>Alhamdulillah! Akun Google kamu sudah resmi terhubung dengan aplikasi <b>Kelas Online Royatul Quran</b>. Refresh token berhasil didapatkan dan otomatis disimpan ke <code>.env.local</code>.</p>
          <div class="token-box">
            <b>Refresh Token:</b><br />
            ${refreshToken.substring(0, 20)}...${refreshToken.substring(refreshToken.length - 10)}
          </div>
          <p style="font-size: 13px; color: #64748b;">Sekarang tinggal pastikan kamu membuat folder induk <b>Tugas Royatul Quran</b> di Google Drive, lalu salin ID foldernya ke sistem.</p>
          <a href="/admin" class="btn">Kembali ke Dashboard Admin</a>
        </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
    );
  } catch (err: any) {
    console.error("[google/callback]", err);
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;text-align:center;">
        <h2 style="color:#e11d48;">❌ Terjadi Kesalahan Penukaran Token</h2>
        <p style="color:#64748b;">${err.message}</p>
        <a href="/api/auth/google/login" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#059669;color:#fff;border-radius:8px;text-decoration:none;">Coba Lagi</a>
      </body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 500 }
    );
  }
}
