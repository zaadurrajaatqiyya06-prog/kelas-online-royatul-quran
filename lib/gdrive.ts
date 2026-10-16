import { google } from "googleapis";
import { Readable } from "stream";
import fs from "fs";
import path from "path";

// ─── Inisialisasi Google Drive Client ─────────────────────────────────────────
// Mendukung:
// 1. OAuth 2.0 (Rekomendasi Utama): GOOGLE_REFRESH_TOKEN + GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
// 2. Service Account: File service-account.json di root atau GOOGLE_SERVICE_ACCOUNT_EMAIL + KEY
export function getDriveClient() {
  try {
    // 1. Prioritas Utama: OAuth 2.0 (Refresh Token Akun Google Pribadi/Sekolah)
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (refreshToken && clientId && clientSecret) {
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        "http://localhost:3000/api/auth/google/callback"
      );
      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });
      return google.drive({ version: "v3", auth: oauth2Client });
    }

    // 2. Fallback: Service Account JSON di root proyek
    const jsonPath = path.join(process.cwd(), "service-account.json");
    if (fs.existsSync(jsonPath)) {
      const auth = new google.auth.GoogleAuth({
        keyFile: jsonPath,
        scopes: ["https://www.googleapis.com/auth/drive"],
      });
      return google.drive({ version: "v3", auth });
    }

    // 3. Fallback: Variabel lingkungan Service Account
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (clientEmail && privateKey) {
      privateKey = privateKey.replace(/\\n/g, "\n");
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/drive"],
      });
      return google.drive({ version: "v3", auth });
    }

    return null;
  } catch (err) {
    console.error("[gdrive] Gagal menginisialisasi Google Drive Client:", err);
    return null;
  }
}

const getRootFolderId = () => process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.GDRIVE_ROOT_FOLDER_ID;

// ─── Helper: Dapatkan atau Buat Folder di Google Drive ───────────────────────
export async function getOrCreateFolder(
  folderName: string,
  parentFolderId?: string
): Promise<string | null> {
  const drive = getDriveClient();
  if (!drive) return null;

  try {
    const parent = parentFolderId || getRootFolderId();
    let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and trashed = false`;
    if (parent) {
      query += ` and '${parent}' in parents`;
    }

    const res = await drive.files.list({
      q: query,
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id!;
    }

    // Jika belum ada, buat folder baru
    const fileMetadata: any = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (parent) {
      fileMetadata.parents = [parent];
    }

    const created = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id",
    });

    return created.data.id || null;
  } catch (err) {
    console.error(`[gdrive] Gagal getOrCreateFolder (${folderName}):`, err);
    return null;
  }
}

// ─── Helper: Buat Hierarki Folder Tugas (Kelas / Mapel / Tugas) ──────────────
export async function getOrCreateTaskFolderHierarchy(params: {
  kelasNama: string;
  mapelNama: string;
  tugasJudul: string;
}): Promise<{ folderId: string | null; folderUrl: string | null }> {
  try {
    const rootId = getRootFolderId();

    // 1. Folder Kelas (e.g. "Kelas 6")
    const kelasFolderId = await getOrCreateFolder(params.kelasNama, rootId);
    if (!kelasFolderId) return { folderId: null, folderUrl: null };

    // 2. Folder Mapel (e.g. "Bahasa Arab")
    const mapelFolderId = await getOrCreateFolder(params.mapelNama, kelasFolderId);
    if (!mapelFolderId) return { folderId: kelasFolderId, folderUrl: `https://drive.google.com/drive/folders/${kelasFolderId}` };

    // 3. Folder Tugas (e.g. "Tugas 1 - Percakapan Arab")
    const tugasFolderId = await getOrCreateFolder(params.tugasJudul, mapelFolderId);
    const finalFolderId = tugasFolderId || mapelFolderId;

    return {
      folderId: finalFolderId,
      folderUrl: `https://drive.google.com/drive/folders/${finalFolderId}`,
    };
  } catch (err) {
    console.error("[gdrive] Gagal membuat hierarki folder tugas:", err);
    return { folderId: null, folderUrl: null };
  }
}

// Alias sesuai Panduan Bagian 3.2
export async function buatFolderTugas(kelas: string, mapel: string, judulTugas: string) {
  const result = await getOrCreateTaskFolderHierarchy({
    kelasNama: kelas,
    mapelNama: mapel,
    tugasJudul: judulTugas,
  });
  return result.folderId;
}

// ─── Helper: Upload File / Buffer ke Google Drive ────────────────────────────
export async function uploadFileToDrive(params: {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  folderId?: string | null;
}): Promise<{ fileId: string | null; webViewLink: string | null; downloadUrl: string | null }> {
  const drive = getDriveClient();
  if (!drive) {
    console.warn("[gdrive] Google Drive Client belum dikonfigurasi. File disimpan lokal sementara.");
    return { fileId: null, webViewLink: null, downloadUrl: null };
  }

  try {
    const targetFolder = params.folderId || getRootFolderId();
    const fileMetadata: any = {
      name: params.fileName,
    };
    if (targetFolder) {
      fileMetadata.parents = [targetFolder];
    }

    const stream = new Readable();
    stream.push(params.buffer);
    stream.push(null);

    const res = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: params.mimeType,
        body: stream,
      },
      fields: "id, webViewLink, webContentLink",
    });

    const fileId = res.data.id || null;
    let webViewLink = res.data.webViewLink || null;
    let downloadUrl = res.data.webContentLink || null;

    // Set permission agar bisa dibaca (view) oleh siapapun yang memiliki link
    if (fileId) {
      try {
        await drive.permissions.create({
          fileId,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        });
      } catch (permErr) {
        console.warn("[gdrive] Gagal set public permission:", permErr);
      }
    }

    return {
      fileId,
      webViewLink: webViewLink || (fileId ? `https://drive.google.com/file/d/${fileId}/view` : null),
      downloadUrl,
    };
  } catch (err) {
    console.error("[gdrive] Upload file gagal:", err);
    return { fileId: null, webViewLink: null, downloadUrl: null };
  }
}

// Alias sesuai Panduan Bagian 3.3
export async function uploadTugasMurid(
  fileBuffer: Buffer,
  namaMurid: string,
  namaFile: string,
  folderId: string
) {
  const ext = namaFile.includes(".") ? namaFile.substring(namaFile.lastIndexOf(".")) : "";
  const finalName = `${namaMurid}${ext}`;
  const res = await uploadFileToDrive({
    fileName: finalName,
    mimeType: "application/pdf",
    buffer: fileBuffer,
    folderId,
  });
  return res.fileId;
}

// ─── Helper: Otomatis buat folder Mapel di setiap kelas di Google Drive ────────
export async function createMapelFoldersForAllClasses(
  mapelNama: string,
  kelasNames: string[] = ["Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6"]
): Promise<{ success: boolean; createdCount: number; errors: string[] }> {
  const rootId = getRootFolderId();
  if (!rootId) {
    console.warn("[gdrive] Root folder ID belum dikonfigurasi.");
    return { success: false, createdCount: 0, errors: ["Root folder ID belum dikonfigurasi."] };
  }

  const errors: string[] = [];
  let createdCount = 0;

  // Eksekusi paralel per kelas agar cepat dan tidak terkena timeout Vercel (10 detik)
  const tasks = kelasNames.map(async (kelas) => {
    try {
      const kelasFolderId = await getOrCreateFolder(kelas, rootId);
      if (kelasFolderId) {
        const mapelFolderId = await getOrCreateFolder(mapelNama, kelasFolderId);
        if (mapelFolderId) {
          createdCount++;
        }
      }
    } catch (e: any) {
      console.warn(`[gdrive] Gagal buat folder ${mapelNama} di ${kelas}:`, e?.message || e);
      errors.push(`${kelas}: ${e?.message || "Gagal"}`);
    }
  });

  await Promise.allSettled(tasks);
  return { success: createdCount > 0, createdCount, errors };
}

