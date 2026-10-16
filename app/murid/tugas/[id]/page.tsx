"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import type { SoalPG } from "@/lib/store";
import { AppNavbar } from "@/components/Navbar";
import {
  ArrowLeft,
  Clock,
  Send,
  Camera,
  Video,
  Upload,
  CheckCircle2,
  AlertCircle,
  Printer,
  X,
  XCircle,
  Eye,
  RefreshCw,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Helper: Kompresi Gambar di Sisi Klien (Maks 1920px & <= 500KB)
───────────────────────────────────────────────────────────── */
async function compressImageFile(file: File, maxDimension = 1920, quality = 0.8): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size < 500 * 1024) return file; // Sudah < 500KB

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/* ─────────────────────────────────────────────────────────────
   Komponen utama pengerjaan tugas
───────────────────────────────────────────────────────────── */
function KerjakanTugasContent() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, tugasList, pengumpulanList, submitTugas } = useApp();

  const tugasId = params?.id as string;
  const tugas = tugasList.find((t) => t.id === tugasId);

  const existingSubmission = pengumpulanList.find(
    (p) => p.tugasId === tugasId && p.muridId === currentUser?.id
  );

  // States
  const [jawabanPG, setJawabanPG] = useState<Record<number, "A" | "B" | "C" | "D">>(
    existingSubmission?.jawabanPG || {}
  );
  const [jawabanEsai, setJawabanEsai] = useState<Record<number, string>>(
    existingSubmission?.jawabanEsaiList || {}
  );
  const [jawabanTeks, setJawabanTeks] = useState(existingSubmission?.jawabanTeks || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultPDF, setShowResultPDF] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Auto-Save Draft states
  const draftKey = `korq_draft_${currentUser?.id || "anon"}_${tugasId}`;
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);

  // ── Auto-Save Step 1: Restore draft on initial load if belum submit ──
  useEffect(() => {
    if (existingSubmission && existingSubmission.status !== "ditolak") return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        let restoredAny = false;
        if (parsed.jawabanPG && Object.keys(parsed.jawabanPG).length > 0) {
          setJawabanPG(parsed.jawabanPG);
          restoredAny = true;
        }
        if (parsed.jawabanEsai && Object.keys(parsed.jawabanEsai).length > 0) {
          setJawabanEsai(parsed.jawabanEsai);
          restoredAny = true;
        }
        if (parsed.jawabanTeks && parsed.jawabanTeks.trim().length > 0) {
          setJawabanTeks(parsed.jawabanTeks);
          restoredAny = true;
        }
        if (restoredAny) {
          setIsDraftRestored(true);
        }
      }
    } catch (e) {
      console.warn("Gagal memulihkan draf lokal:", e);
    }
  }, [draftKey, existingSubmission]);

  // ── Auto-Save Step 2: Simpan draf otomatis tiap ada perubahan jawaban ──
  useEffect(() => {
    if (existingSubmission && existingSubmission.status !== "ditolak") return;

    const hasContent =
      Object.keys(jawabanPG).length > 0 ||
      Object.keys(jawabanEsai).length > 0 ||
      jawabanTeks.trim().length > 0;

    if (!hasContent) return;

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            jawabanPG,
            jawabanEsai,
            jawabanTeks,
            updatedAt: new Date().toISOString(),
          })
        );
        const timeStr = new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
        setLastAutoSave(`Draf tersimpan pk ${timeStr}`);
      } catch (err) {
        console.warn("Gagal menyimpan draf otomatis:", err);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [jawabanPG, jawabanEsai, jawabanTeks, draftKey, existingSubmission]);

  if (!tugas) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-slate-600">Tugas tidak ditemukan.</p>
        <Link href="/murid" className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const handleSelectPG = (nomor: number, opsi: "A" | "B" | "C" | "D") => {
    setJawabanPG({ ...jawabanPG, [nomor]: opsi });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const original = e.target.files[0];
      let finalFile = original;

      if (original.type.startsWith("image/")) {
        setIsCompressing(true);
        try {
          finalFile = await compressImageFile(original);
        } catch {
          finalFile = original;
        } finally {
          setIsCompressing(false);
        }
      }

      setSelectedFile(finalFile);
      if (finalFile.type.startsWith("image/") || finalFile.type.startsWith("video/")) {
        setPreviewUrl(URL.createObjectURL(finalFile));
      }
    }
  };

  const calculateScorePG = () => {
    if (!tugas.soalPGList || tugas.soalPGList.length === 0) return 100;
    let correct = 0;
    tugas.soalPGList.forEach((s) => {
      if (jawabanPG[s.nomor] === s.kunciJawaban) correct++;
    });
    return Math.round((correct / tugas.soalPGList.length) * 100);
  };

  // ── Step 1: Tombol submit → buka modal review terlebih dahulu ─────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowReviewModal(true);
  };

  const [submittedDriveUrl, setSubmittedDriveUrl] = useState<string | null>(
    existingSubmission?.gdriveFileUrl || null
  );

  // ── Step 2: Konfirmasi dari modal → lakukan submit sebenarnya ─────────────
  const handleConfirmSubmit = async () => {
    setShowReviewModal(false);
    setIsSubmitting(true);

    const fileSizeMb = selectedFile ? selectedFile.size / (1024 * 1024) : 0;
    const isLarge = fileSizeMb > 40;
    if (isLarge || (selectedFile && selectedFile.type.startsWith("image/"))) {
      setIsCompressing(true);
    }

    const autoNilai = tugas.jenis === "pg" ? calculateScorePG() : undefined;
    const pdfFileName = `Lembar_Jawaban_${currentUser?.nama.replace(/\s+/g, "_")}_${tugas.mapelNama}.pdf`;
    let driveLink: string | null = null;

    // Upload ke Google Drive
    try {
      const fd = new FormData();
      if (selectedFile) {
        fd.append("file", selectedFile);
        fd.append("fileName", `${currentUser?.nama.replace(/\s+/g, "_")}_${selectedFile.name}`);
      } else {
        // Buat file ringkasan jawaban untuk diarsipkan ke Google Drive
        let content = `LEMBAR JAWABAN TUGAS SANTRI\n` +
          `Royatul Qur'an Digital\n` +
          `===================================\n` +
          `Santri : ${currentUser?.nama} (NIS: ${currentUser?.nis})\n` +
          `Kelas  : ${tugas.kelasNama || "Kelas"}\n` +
          `Mapel  : ${tugas.mapelNama}\n` +
          `Tugas  : ${tugas.judul}\n` +
          `Waktu  : ${new Date().toLocaleString("id-ID")}\n` +
          `===================================\n\n`;

        if (tugas.jenis === "pg" && tugas.soalPGList) {
          content += `HASIL PILIHAN GANDA (Skor: ${autoNilai}/100):\n`;
          tugas.soalPGList.forEach((s) => {
            const ans = jawabanPG[s.nomor] || "-";
            const correct = ans === s.kunciJawaban ? "BENAR" : `SALAH (Kunci: ${s.kunciJawaban})`;
            content += `${s.nomor}. Jawaban: ${ans} [${correct}]\n`;
          });
        } else if (tugas.jenis === "esai") {
          content += `JAWABAN ESAI:\n`;
          if (tugas.soalEsaiList && tugas.soalEsaiList.length > 0) {
            tugas.soalEsaiList.forEach((s) => {
              content += `Soal ${s.nomor}: ${s.pertanyaan}\nJawaban:\n${jawabanEsai[s.nomor] || "-"}\n\n`;
            });
          } else {
            content += `${jawabanTeks}\n`;
          }
        }

        const blob = new Blob([content], { type: "text/plain" });
        fd.append("file", blob, `Lembar_Jawaban_${currentUser?.nama.replace(/\s+/g, "_")}.txt`);
      }

      fd.append("kelasNama", tugas.kelasNama || "Kelas");
      fd.append("mapelNama", tugas.mapelNama || "Mapel");
      fd.append("tugasJudul", tugas.judul || "Tugas");
      if (tugas.gdriveFolderId) {
        fd.append("folderId", tugas.gdriveFolderId);
      }

      const upRes = await fetch("/api/drive/upload", { method: "POST", body: fd });
      if (upRes.ok) {
        const upData = await upRes.json();
        if (upData.webViewLink) {
          driveLink = upData.webViewLink;
          setSubmittedDriveUrl(driveLink);
        }
      }
    } catch (upErr) {
      console.warn("Upload Google Drive background error:", upErr);
    }

    setIsCompressing(false);

    await submitTugas({
      tugasId: tugas.id,
      jawabanTeks: jawabanTeks.trim(),
      jawabanPG: tugas.jenis === "pg" ? jawabanPG : undefined,
      jawabanEsaiList: tugas.jenis === "esai" ? jawabanEsai : undefined,
      fileName: selectedFile
        ? `${currentUser?.nama.replace(/\s+/g, "_")}_${selectedFile.name}`
        : pdfFileName,
      fileSizeMb: selectedFile ? (isLarge ? 38.5 : fileSizeMb) : 0.35,
      isLargeVideo: isLarge,
      autoNilai,
      pdfUrl: driveLink || undefined,
      gdriveFileUrl: driveLink || undefined,
    });

    setIsSubmitting(false);
    setShowResultPDF(true);

    // Hapus draf setelah tugas berhasil dikumpulkan
    try {
      localStorage.removeItem(draftKey);
      setLastAutoSave(null);
    } catch {
      // ignore
    }
  };

  const formatDeadline = (isoString: string) =>
    new Date(isoString).toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    });

  const totalSoalPG = tugas.soalPGList?.length || 0;
  const sudahDijawabPG = Object.keys(jawabanPG).length;

  /* ── CETAK PDF: buka jendela print dengan dokumen lengkap ── */
  const handleCetakPDF = () => {
    const tglSubmit = new Date().toLocaleString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    let soalContent = "";

    if (tugas.jenis === "pg" && tugas.soalPGList) {
      const skorPG = calculateScorePG();
      const benar = tugas.soalPGList.filter((s) => jawabanPG[s.nomor] === s.kunciJawaban).length;
      soalContent += `<div class="score-box"><div class="score-label">Skor Akhir (Auto-Grading)</div><div class="score-value">${skorPG}</div><div class="score-sub">${benar} benar dari ${tugas.soalPGList.length} soal</div></div>
        <h3 style="font-size:11px;font-weight:800;color:#1e293b;margin:20px 0 10px;text-transform:uppercase;letter-spacing:1px;">Rincian Soal &amp; Jawaban Pilihan Ganda</h3>
        <table><thead><tr><th>No</th><th style="text-align:left;padding-left:8px;">Pertanyaan</th><th>A</th><th>B</th><th>C</th><th>D</th><th>Jawaban Anda</th><th>Kunci</th><th>Ket.</th></tr></thead><tbody>`;
      tugas.soalPGList.forEach((s) => {
        const ans = jawabanPG[s.nomor] || "-";
        const isRight = ans === s.kunciJawaban;
        soalContent += `<tr><td style="text-align:center;font-weight:700;">${s.nomor}</td><td style="padding:6px 8px;font-size:10px;">${s.pertanyaan}</td><td style="text-align:center;font-size:10px;">${s.opsiA}</td><td style="text-align:center;font-size:10px;">${s.opsiB}</td><td style="text-align:center;font-size:10px;">${s.opsiC || "-"}</td><td style="text-align:center;font-size:10px;">${s.opsiD || "-"}</td><td style="text-align:center;font-weight:800;color:${isRight ? "#15803d" : "#dc2626"};">${ans}</td><td style="text-align:center;font-weight:700;color:#15803d;">${s.kunciJawaban}</td><td style="text-align:center;font-size:11px;">${isRight ? "✅" : "❌"}</td></tr>`;
      });
      soalContent += `</tbody></table>`;
    } else if (tugas.jenis === "esai" && tugas.soalEsaiList && tugas.soalEsaiList.length > 0) {
      soalContent += `<h3 style="font-size:11px;font-weight:800;color:#1e293b;margin:20px 0 10px;text-transform:uppercase;">Lembar Jawaban Esai</h3>`;
      tugas.soalEsaiList.forEach((item) => {
        soalContent += `<div class="esai-item"><div class="esai-no">Soal ${item.nomor}</div><div class="esai-q">${item.nomor}. ${item.pertanyaan}</div><div class="esai-label">Jawaban:</div><div class="esai-a">${jawabanEsai[item.nomor] || "(Tidak dijawab)"}</div></div>`;
      });
    } else if (tugas.jenis === "esai") {
      soalContent += `<h3 style="font-size:11px;font-weight:800;color:#1e293b;margin:10px 0 8px;">Jawaban Esai</h3><div class="esai-a" style="min-height:80px;">${jawabanTeks || "(Tidak diisi)"}</div>`;
    } else {
      soalContent += `<p style="font-size:11px;color:#64748b;margin-top:16px;">Tugas berupa unggahan file (foto/video). Tersimpan di Google Drive Sekolah.</p>`;
    }

    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"/><title>Lembar Jawaban — ${tugas.judul}</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;color:#1e293b;}.page{max-width:780px;margin:0 auto;background:white;padding:40px;}.header{border-bottom:3px solid #059669;padding-bottom:18px;margin-bottom:20px;}.header-top{display:flex;align-items:flex-start;justify-content:space-between;}.sekolah-name{font-size:16px;font-weight:900;color:#065f46;}.stamp{background:#059669;color:white;padding:6px 14px;border-radius:8px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;}.meta-table{width:100%;border-collapse:collapse;margin-bottom:18px;}.meta-table td{padding:5px 8px;font-size:11px;}.meta-table .label{color:#64748b;font-weight:600;width:130px;}.meta-table .value{font-weight:700;color:#0f172a;}.score-box{background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:2px solid #6ee7b7;border-radius:14px;padding:20px;text-align:center;margin-bottom:18px;}.score-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#065f46;}.score-value{font-size:56px;font-weight:900;color:#059669;line-height:1;margin:6px 0 4px;}.score-sub{font-size:11px;color:#065f46;font-weight:600;}table{width:100%;border-collapse:collapse;font-size:10px;}th{background:#f1f5f9;padding:7px 6px;font-weight:700;text-align:center;border:1px solid #e2e8f0;font-size:9px;text-transform:uppercase;}td{padding:5px 6px;border:1px solid #e2e8f0;vertical-align:middle;}tr:nth-child(even) td{background:#f8fafc;}.esai-item{border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:14px;}.esai-no{font-size:9px;font-weight:700;text-transform:uppercase;color:#059669;margin-bottom:4px;}.esai-q{font-size:11px;font-weight:700;color:#0f172a;margin-bottom:8px;}.esai-label{font-size:9px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:4px;}.esai-a{font-size:11px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;min-height:50px;line-height:1.6;}.footer{margin-top:36px;padding-top:14px;border-top:1px dashed #cbd5e1;display:flex;justify-content:space-between;align-items:flex-end;}.footer-left{font-size:10px;color:#94a3b8;}.ttd-box{text-align:center;}.ttd-label{font-size:10px;color:#64748b;margin-bottom:40px;}.ttd-line{border-top:1px solid #334155;width:140px;margin:0 auto;}.ttd-name{font-size:10px;font-weight:700;margin-top:4px;}@media print{body{background:white;}.page{padding:20px;margin:0;max-width:100%;}@page{margin:1cm;}}</style></head><body><div class="page"><div class="header"><div class="header-top"><div><div class="sekolah-name">Kelas Online Royatul Quran</div><div style="font-size:11px;font-weight:600;color:#475569;margin-top:2px;">Lembar Jawaban Tugas — Dokumen Resmi</div></div><div class="stamp">Telah Dikumpulkan</div></div></div><table class="meta-table"><tr><td class="label">Nama Murid</td><td class="value">${currentUser?.nama || "-"}</td></tr><tr><td class="label">NIS / Kelas</td><td class="value">${currentUser?.nis || "-"} &nbsp;•&nbsp; ${currentUser?.kelasNama || "-"}</td></tr><tr><td class="label">Mata Pelajaran</td><td class="value">${tugas.mapelNama}</td></tr><tr><td class="label">Judul Tugas</td><td class="value">${tugas.judul}</td></tr><tr><td class="label">Jenis Tugas</td><td class="value">${tugas.jenis === "pg" ? "Pilihan Ganda" : tugas.jenis === "esai" ? "Esai" : tugas.jenis}</td></tr><tr><td class="label">Guru Pengampu</td><td class="value">${tugas.guruNama}</td></tr><tr><td class="label">Tanggal Kumpul</td><td class="value">${tglSubmit}</td></tr><tr><td class="label">Deadline</td><td class="value">${new Date(tugas.deadline).toLocaleString("id-ID")}</td></tr></table><hr style="border:none;border-top:1px solid #e2e8f0;margin-bottom:16px;"/>${soalContent}<div class="footer"><div class="footer-left">Dokumen ini dibuat otomatis oleh Sistem Kelas Online Royatul Quran<br/>dan tersimpan di Google Drive Sekolah sebagai arsip resmi.</div><div class="ttd-box"><div class="ttd-label">Murid yang Bersangkutan</div><div class="ttd-line"></div><div class="ttd-name">${currentUser?.nama || "-"}</div></div></div></div><script>window.onload=function(){window.print();}</script></body></html>`;

    const w = window.open("", "_blank", "width=900,height=700");
    if (w) { w.document.write(html); w.document.close(); }
  };

  // Apakah form perlu ditampilkan (belum submit ATAU ditolak)
  const showForm = !existingSubmission || existingSubmission.status === "ditolak";

  return (
    <div className="flex flex-1 flex-col pb-24">
      <AppNavbar />

      {/* Header Bar */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-4 py-3">
        <Link href="/murid" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            {tugas.mapelNama} • {tugas.kelasNama}
          </span>
          <h1 className="text-sm font-bold text-slate-900 leading-tight truncate">Lembar Pengerjaan Tugas</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Info Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
              {tugas.jenis === "pg" ? "Pilihan Ganda" : tugas.jenis === "esai" ? "Esai" : tugas.jenis}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
              <Clock className="h-3.5 w-3.5" />
              {formatDeadline(tugas.deadline)}
            </span>
          </div>
          <h2 className="mt-2 text-base font-bold text-slate-900 leading-snug">{tugas.judul}</h2>
          <p className="mt-1 text-xs text-slate-500">Guru: {tugas.guruNama}</p>
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 border border-slate-100">
            <p className="font-semibold text-slate-900 mb-0.5">Petunjuk:</p>
            {tugas.instruksi}
          </div>
        </div>

        {/* ── Banner DITOLAK ── */}
        {existingSubmission?.status === "ditolak" && (
          <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span className="text-sm font-black text-rose-800">Tugas Ditolak oleh Guru</span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">
              <span className="font-bold">Alasan: </span>
              {existingSubmission.alasanTolak || "Jawaban belum sesuai ketentuan."}
            </p>
            {existingSubmission.waktuTolak && (
              <p className="text-[10px] text-rose-400">
                Ditolak: {new Date(existingSubmission.waktuTolak).toLocaleString("id-ID")}
              </p>
            )}
            <div className="rounded-xl bg-rose-100 border border-rose-200 p-2.5 text-[11px] text-rose-900 font-semibold flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 shrink-0" />
              <span>Silakan kerjakan kembali dan kumpulkan ulang di bawah ini.</span>
            </div>
          </div>
        )}

        {/* ── Banner SUDAH DIKUMPULKAN (hanya jika bukan ditolak) ── */}
        {existingSubmission && existingSubmission.status !== "ditolak" && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-950 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2 font-bold">
              <div className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Tugas Sudah Dikumpulkan</span>
              </div>
              {existingSubmission.nilai !== undefined && (
                <span className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-black text-white">
                  Nilai: {existingSubmission.nilai}/100
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-700">
              Waktu Submit: {new Date(existingSubmission.waktuSubmit || "").toLocaleString("id-ID")}
            </p>
            <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] text-emerald-900 font-medium">📄 Lembar Jawaban PDF:</span>
              <button
                type="button"
                onClick={handleCetakPDF}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition shadow-sm"
              >
                <Printer className="h-3 w-3" />
                <span>Cetak / Download PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Form Pengerjaan (tampil jika belum kumpul atau ditolak) ── */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Banner Draf Dipulihkan */}
            {isDraftRestored && (
              <div className="flex items-center justify-between rounded-2xl bg-amber-50 border border-amber-200/90 px-3.5 py-2.5 text-xs text-amber-900 shadow-sm animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-base">💾</span>
                  <div>
                    <p className="font-bold">Draf Pengerjaan Dipulihkan</p>
                    <p className="text-[11px] text-amber-700">Jawaban ketikan Anda sebelumnya tersimpan aman.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDraftRestored(false)}
                  className="rounded-lg bg-amber-100 hover:bg-amber-200 px-2 py-1 text-[11px] font-bold text-amber-900 transition"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Indikator Status Auto-Save */}
            {lastAutoSave && (
              <div className="flex items-center justify-end text-[11px] text-slate-500 font-medium px-1">
                <span className="inline-flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {lastAutoSave}
                </span>
              </div>
            )}

            {/* PILIHAN GANDA */}
            {tugas.jenis === "pg" && tugas.soalPGList && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                  <span>Progress Jawaban:</span>
                  <span className={sudahDijawabPG < totalSoalPG ? "text-amber-700" : "text-emerald-700"}>
                    {sudahDijawabPG} / {totalSoalPG} Soal
                  </span>
                </div>

                {tugas.soalPGList.map((soal) => {
                  const selected = jawabanPG[soal.nomor];
                  return (
                    <div key={soal.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Soal {soal.nomor}</span>
                        <p className="mt-1 text-xs font-semibold text-slate-900 leading-relaxed">
                          {soal.nomor}. {soal.pertanyaan}
                        </p>
                      </div>
                      <div className="space-y-2 pt-1">
                        {(["A", "B", "C", "D"] as const).map((opt) => {
                          const optText = (soal as any)[`opsi${opt}`] as string;
                          if (!optText) return null;
                          const isChosen = selected === opt;
                          return (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => handleSelectPG(soal.nomor, opt)}
                              className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                                isChosen
                                  ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 font-semibold shadow-sm"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                                isChosen ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                              }`}>
                                {opt}
                              </span>
                              <span className="text-xs leading-normal flex-1">{optText}</span>
                            </button>
                          );
                        })}
                      </div>
                      {selected && (
                        <p className="text-[11px] font-bold text-emerald-700 pt-1">✓ Jawaban: ({selected})</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ESAI */}
            {tugas.jenis === "esai" && (
              <div className="space-y-3">
                {tugas.soalEsaiList && tugas.soalEsaiList.length > 0 ? (
                  tugas.soalEsaiList.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                      <p className="text-xs font-bold text-slate-900">{item.nomor}. {item.pertanyaan}</p>
                      <textarea
                        rows={3}
                        required
                        value={jawabanEsai[item.nomor] || ""}
                        onChange={(e) => setJawabanEsai({ ...jawabanEsai, [item.nomor]: e.target.value })}
                        placeholder={`Ketik jawaban soal ${item.nomor}...`}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Teks Jawaban Esai</label>
                    <textarea
                      rows={5}
                      required
                      value={jawabanTeks}
                      onChange={(e) => setJawabanTeks(e.target.value)}
                      placeholder="Ketik teks jawaban Anda secara lengkap di sini..."
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* FOTO */}
            {tugas.jenis === "foto" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <label className="block text-xs font-semibold text-slate-700">Foto Hasil Kerja / Buku Tulis</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-4 text-center cursor-pointer hover:bg-emerald-100/60 transition">
                    <Camera className="h-6 w-6 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-800">Buka Kamera</span>
                    <span className="text-[10px] text-emerald-600">Jepret Langsung</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                  </label>
                  <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center cursor-pointer hover:bg-slate-100 transition">
                    <Upload className="h-6 w-6 text-slate-600" />
                    <span className="text-xs font-bold text-slate-800">Pilih Galeri</span>
                    <span className="text-[10px] text-slate-500">File Foto HP</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
                {isCompressing && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-center text-xs font-semibold text-amber-800 animate-pulse">
                    ⚡ Sedang mengompres foto agar hemat kuota & cepat terkirim...
                  </div>
                )}
                {previewUrl && (
                  <div className="space-y-1.5">
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <img src={previewUrl} alt="Preview" className="h-44 w-full object-cover" />
                    </div>
                    {selectedFile && (
                      <p className="text-[11px] font-semibold text-emerald-700 flex items-center justify-between px-1">
                        <span>✓ Foto siap dikumpulkan</span>
                        <span className="font-mono text-slate-500">{(selectedFile.size / 1024).toFixed(0)} KB</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* VIDEO */}
            {tugas.jenis === "video" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <label className="block text-xs font-semibold text-slate-700">Rekam atau Unggah Video Tugas</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/50 p-4 text-center cursor-pointer hover:bg-purple-100/60 transition">
                    <Video className="h-6 w-6 text-purple-700" />
                    <span className="text-xs font-bold text-purple-800">Rekam Video</span>
                    <span className="text-[10px] text-purple-600">Durasi Bebas</span>
                    <input type="file" accept="video/*" capture="environment" onChange={handleFileChange} className="hidden" />
                  </label>
                  <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center cursor-pointer hover:bg-slate-100 transition">
                    <Upload className="h-6 w-6 text-slate-600" />
                    <span className="text-xs font-bold text-slate-800">Pilih Video</span>
                    <span className="text-[10px] text-slate-500">Dari Galeri HP</span>
                    <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
                {previewUrl && selectedFile?.type.startsWith("video/") && (
                  <div className="space-y-1.5">
                    <video src={previewUrl} controls className="w-full max-h-48 rounded-xl bg-black" />
                    <p className="text-[11px] font-semibold text-purple-800 flex items-center justify-between px-1">
                      <span>✓ Video siap dikumpulkan</span>
                      <span className="font-mono text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </p>
                  </div>
                )}
                <div className="rounded-xl bg-purple-50 p-3 text-[11px] text-purple-900 border border-purple-100 leading-relaxed">
                  <span className="font-bold">Ketentuan:</span>
                  <ul className="mt-1 list-disc list-inside space-y-0.5 text-purple-800">
                    <li>Durasi bebas (tanpa batasan).</li>
                    <li>Otomatis tersimpan ke Google Drive kelas & dikirimkan ke Telegram.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TOMBOL: buka modal review */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-xs font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 active:scale-[0.98] transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>{isCompressing ? "Mengompres & Menyiapkan PDF..." : "Mengirim Tugas..."}</span>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>
                    {existingSubmission?.status === "ditolak"
                      ? "Tinjau Jawaban & Kumpulkan Ulang"
                      : "Tinjau Jawaban & Kumpulkan"}
                  </span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL REVIEW SEBELUM SUBMIT (Bottom Sheet)
      ═══════════════════════════════════════════════════════════════ */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-3xl bg-white shadow-2xl max-h-[92vh] flex flex-col">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-900">Tinjau Jawaban Anda</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pastikan semua jawaban sudah benar sebelum dikumpulkan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 ml-2 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scroll area */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {/* Ringkasan identitas */}
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama:</span>
                  <span className="font-bold text-slate-900">{currentUser?.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mata Pelajaran:</span>
                  <span className="font-bold text-slate-900">{tugas.mapelNama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tugas:</span>
                  <span className="font-bold text-slate-900 text-right max-w-[55%]">{tugas.judul}</span>
                </div>
              </div>

              {/* Warning jika ada soal belum dijawab */}
              {tugas.jenis === "pg" && tugas.soalPGList && sudahDijawabPG < totalSoalPG && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 flex items-center gap-2 text-xs text-amber-800">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-semibold">
                    {totalSoalPG - sudahDijawabPG} soal belum dijawab! Anda masih bisa kumpulkan tapi nilai bisa berkurang.
                  </span>
                </div>
              )}

              {/* Review PG */}
              {tugas.jenis === "pg" && tugas.soalPGList && (
                <div className="space-y-2">
                  {tugas.soalPGList.map((s) => {
                    const ans = jawabanPG[s.nomor];
                    return (
                      <div
                        key={s.id}
                        className={`rounded-xl border p-3 space-y-2 ${
                          ans ? "border-emerald-200 bg-emerald-50/30" : "border-rose-200 bg-rose-50/30"
                        }`}
                      >
                        <p className="text-[11px] font-bold text-slate-800">
                          {s.nomor}. {s.pertanyaan}
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          {(["A", "B", "C", "D"] as const).map((opt) => {
                            const txt = (s as any)[`opsi${opt}`] as string;
                            if (!txt) return null;
                            const isChosen = ans === opt;
                            return (
                              <div
                                key={opt}
                                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] border ${
                                  isChosen
                                    ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                                    : "bg-white text-slate-500 border-slate-200"
                                }`}
                              >
                                <span className={`font-black ${isChosen ? "text-white" : "text-slate-400"}`}>{opt}.</span>
                                <span className="truncate">{txt}</span>
                              </div>
                            );
                          })}
                        </div>
                        {!ans && <p className="text-[10px] font-bold text-rose-500">⚠️ Belum dijawab</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Review Esai per-soal */}
              {tugas.jenis === "esai" && tugas.soalEsaiList && tugas.soalEsaiList.length > 0 && (
                <div className="space-y-2">
                  {tugas.soalEsaiList.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                      <p className="text-[11px] font-bold text-slate-700">{item.nomor}. {item.pertanyaan}</p>
                      <p className="text-[11px] text-slate-900 bg-white rounded-lg p-2 border border-slate-200 min-h-[32px]">
                        {jawabanEsai[item.nomor] || <span className="italic text-slate-400">Belum dijawab</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Review Esai teks bebas */}
              {tugas.jenis === "esai" && (!tugas.soalEsaiList || tugas.soalEsaiList.length === 0) && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold text-slate-600 mb-1">Jawaban Esai:</p>
                  <p className="text-xs text-slate-900 min-h-[32px]">
                    {jawabanTeks || <span className="italic text-slate-400">Belum diisi</span>}
                  </p>
                </div>
              )}

              {/* File upload status */}
              {(tugas.jenis === "foto" || tugas.jenis === "video") && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                  {selectedFile ? (
                    <span className="font-semibold text-emerald-700">✅ File dipilih: {selectedFile.name}</span>
                  ) : (
                    <span className="text-amber-700 font-semibold">⚠️ Belum ada file yang dipilih.</span>
                  )}
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="px-5 pb-6 pt-3 border-t border-slate-100 space-y-2 shrink-0">
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 transition"
              >
                <Send className="h-4 w-4" />
                <span>Ya, Kumpulkan Sekarang</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                Kembali & Periksa Lagi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL SUKSES + CETAK PDF
      ═══════════════════════════════════════════════════════════════ */}
      {showResultPDF && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="text-center border-b border-slate-200 pb-4">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-base font-black text-slate-900">Tugas Berhasil Dikumpulkan!</h3>
              <p className="mt-1 text-xs text-slate-500">
                Lembar jawaban tersimpan otomatis di Google Drive Sekolah
              </p>
            </div>

            {tugas.jenis === "pg" && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                <p className="text-xs font-semibold text-emerald-800">Skor Pilihan Ganda (Auto-Grading)</p>
                <p className="text-4xl font-black text-emerald-600 mt-1">{calculateScorePG()}</p>
                <p className="text-[10px] text-emerald-700 mt-1">dari 100</p>
              </div>
            )}

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama:</span>
                <span className="font-bold text-slate-900">{currentUser?.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mata Pelajaran:</span>
                <span className="font-bold text-slate-900">{tugas.mapelNama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tugas:</span>
                <span className="font-bold text-slate-900 text-right max-w-[60%]">{tugas.judul}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleCetakPDF}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 transition"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak / Download Lembar Jawaban PDF</span>
              </button>
              {submittedDriveUrl && (
                <a
                  href={submittedDriveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-50 border border-sky-200 py-2.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition"
                >
                  <Eye className="h-4 w-4" />
                  <span>Lihat File di Google Drive</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => { setShowResultPDF(false); router.push("/murid"); }}
                className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                Tutup & Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KerjakanTugasPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Memuat halaman tugas...</div>}>
      <KerjakanTugasContent />
    </Suspense>
  );
}
