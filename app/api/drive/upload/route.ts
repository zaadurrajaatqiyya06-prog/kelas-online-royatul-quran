import { NextRequest, NextResponse } from "next/server";
import { uploadFileToDrive, getOrCreateTaskFolderHierarchy } from "@/lib/gdrive";

// POST /api/drive/upload
// Endpoint upload file tugas santri ke Google Drive sekolah
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const tugasId = formData.get("tugasId") as string | null;
    const folderId = formData.get("folderId") as string | null;
    const kelasNama = (formData.get("kelasNama") as string) || "Kelas";
    const mapelNama = (formData.get("mapelNama") as string) || "Mapel";
    const tugasJudul = (formData.get("tugasJudul") as string) || "Tugas";
    const customFileName = formData.get("fileName") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }

    // Tentukan folder tujuan di Google Drive
    let targetFolderId = folderId;
    if (!targetFolderId) {
      const hierarchy = await getOrCreateTaskFolderHierarchy({
        kelasNama,
        mapelNama,
        tugasJudul,
      });
      targetFolderId = hierarchy.folderId;
    }

    // Baca buffer file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = customFileName || file.name;

    // Upload ke Google Drive
    const result = await uploadFileToDrive({
      fileName,
      mimeType: file.type || "application/octet-stream",
      buffer,
      folderId: targetFolderId,
    });

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      webViewLink: result.webViewLink,
      downloadUrl: result.downloadUrl,
      targetFolderId,
    }, { status: 200 });

  } catch (err: any) {
    console.error("[api/drive/upload]", err);
    return NextResponse.json({ error: "Gagal mengunggah file ke Google Drive." }, { status: 500 });
  }
}
