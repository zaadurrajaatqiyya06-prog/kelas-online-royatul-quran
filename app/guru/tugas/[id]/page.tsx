"use client";

import React, { useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import type { Pengumpulan } from "@/lib/store";
import { AppNavbar } from "@/components/Navbar";
import { LembarJawabanModal } from "@/components/ui/LembarJawabanModal";
import { getDaysRemaining } from "@/lib/submission-cache-client";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Award,
  FolderOpen,
  Eye,
  Clock,
  Archive,
  Search,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────

function DetailTugasGuruContent() {
  const params = useParams();
  const tugasId = params?.id as string;
  const { tugasList, pengumpulanList, usersList, nilaiTugas } = useApp();

  const tugas = tugasList.find((t) => t.id === tugasId);

  const [searchTerm, setSearchTerm] = useState("");
  // Modal lembar jawaban: simpan indeks santri yang sedang dilihat
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (!tugas) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-slate-600">Tugas tidak ditemukan.</p>
        <Link href="/guru" className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">
          Kembali
        </Link>
      </div>
    );
  }

  // Semua murid di kelas ini
  const classStudents = usersList.filter(
    (u) => u.role === "murid" && u.kelasId === tugas.kelasId
  );

  // Pasangkan tiap murid dengan submission-nya
  const studentRows = classStudents.map((student) => {
    const submission = pengumpulanList.find(
      (p) => p.tugasId === tugas.id && p.muridId === student.id
    );
    return { student, submission, hasSubmitted: !!submission };
  });

  const filteredRows = studentRows.filter((r) =>
    r.student.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.student.nis && r.student.nis.includes(searchTerm))
  );

  const totalKumpul = studentRows.filter((r) => r.hasSubmitted).length;
  const totalBelum = studentRows.length - totalKumpul;

  // Callback dari modal lembar jawaban: simpan nilai
  const handleSaveGrade = (submissionId: string, nilai: number, catatan: string) => {
    nilaiTugas(submissionId, nilai, catatan);
  };

  // Helper: cek apakah cache lokal masih tersedia & berapa hari tersisa
  const getCacheInfo = (sub: Pengumpulan | undefined) => {
    if (!sub || !sub.waktuSubmit) return { hasCache: false, daysLeft: 0 };
    const hasCacheFile = !!sub.localFileUrl;
    const daysLeft = getDaysRemaining(sub.waktuSubmit);
    return {
      hasCache: hasCacheFile && daysLeft > 0,
      daysLeft,
    };
  };

  return (
    <div className="flex flex-1 flex-col pb-16">
      <AppNavbar />

      {/* Header Bar */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-4 py-3">
        <Link href="/guru" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            {tugas.kelasNama} • {tugas.mapelNama}
          </span>
          <h1 className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[240px]">
            {tugas.judul}
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* Quick Stats */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-emerald-50 p-2.5 border border-emerald-100">
              <span className="text-xl font-black text-emerald-700">{totalKumpul}</span>
              <p className="text-[10px] font-semibold text-emerald-800">Sudah Kumpul</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-2.5 border border-rose-100">
              <span className="text-xl font-black text-rose-700">{totalBelum}</span>
              <p className="text-[10px] font-semibold text-rose-800">Belum Kumpul</p>
            </div>
          </div>

          {/* Shortcut Folder Google Drive */}
          {tugas.driveFolderUrl && (
            <a
              href={tugas.driveFolderUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 transition"
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-amber-600" />
                <span>Buka Folder Tugas di Google Drive</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama murid atau NIS..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Student Submission List */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Daftar Murid ({filteredRows.length})
          </h3>

          {filteredRows.map(({ student, submission, hasSubmitted }, idx) => {
            const { hasCache, daysLeft } = getCacheInfo(submission);
            const driveUrl = submission?.gdriveFileUrl || submission?.pdfUrl;
            const hasOnlineAnswer = !!(
              submission?.jawabanTeks ||
              submission?.jawabanPG ||
              submission?.jawabanEsaiList
            );
            const canPreview = hasSubmitted && (hasCache || hasOnlineAnswer);

            // Cari index di filteredRows untuk buka modal
            const globalIdx = studentRows.findIndex(
              (r) => r.student.id === student.id
            );

            return (
              <div
                key={student.id}
                className={`rounded-2xl border p-3.5 transition ${
                  hasSubmitted
                    ? "border-slate-100 bg-white shadow-sm"
                    : "border-rose-100 bg-rose-50/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Info Kiri */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">{student.nama}</span>
                      <span className="text-[10px] text-slate-400">NIS: {student.nis}</span>
                    </div>

                    {hasSubmitted && submission ? (
                      <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                        <p className="flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>
                            Kumpul:{" "}
                            {new Date(submission.waktuSubmit || "").toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </p>
                        {submission.fileName && (
                          <p className="truncate max-w-[180px] text-slate-500 font-mono text-[10px]">
                            📎 {submission.fileName}
                          </p>
                        )}

                        {/* Badge status cache */}
                        {hasCache ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                            <Clock className="h-2.5 w-2.5" />
                            Tersisa {daysLeft} hari
                          </span>
                        ) : driveUrl ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                            <Archive className="h-2.5 w-2.5" />
                            Di Google Drive
                          </span>
                        ) : hasOnlineAnswer ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                            📝 Jawaban Online
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <AlertCircle className="h-3 w-3" />
                        <span>Belum Mengumpulkan</span>
                      </p>
                    )}
                  </div>

                  {/* Tombol Aksi Kanan */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {/* Tombol Cek Lembar Jawaban (cache lokal / online) */}
                    {canPreview && (
                      <button
                        onClick={() => setViewerIndex(globalIdx)}
                        className="flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
                        title="Cek Lembar Jawaban"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Cek Jawaban</span>
                      </button>
                    )}

                    {/* Tombol Drive (fallback jika cache habis dan ada URL Drive) */}
                    {!hasCache && driveUrl && !hasOnlineAnswer && hasSubmitted && (
                      <a
                        href={driveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-700 hover:bg-amber-100 transition"
                        title="Buka di Google Drive"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Drive</span>
                      </a>
                    )}

                    {/* Badge Nilai / Tombol Beri Nilai */}
                    {hasSubmitted && submission ? (
                      submission.status === "dinilai" ? (
                        <button
                          onClick={() => setViewerIndex(globalIdx)}
                          className="flex flex-col items-end rounded-xl bg-emerald-50 px-2.5 py-1 text-right hover:bg-emerald-100 transition"
                          title="Ubah Nilai"
                        >
                          <span className="text-base font-black text-emerald-700 leading-none">
                            {submission.nilai}
                          </span>
                          <span className="text-[9px] font-semibold text-emerald-800">
                            <Award className="inline h-2.5 w-2.5 mr-0.5" />Ubah
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setViewerIndex(globalIdx)}
                          className="rounded-xl bg-amber-500 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm hover:bg-amber-600 transition"
                        >
                          Beri Nilai
                        </button>
                      )
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Lembar Jawaban Modal (Split-Screen Viewer) ── */}
      {viewerIndex !== null && (
        <LembarJawabanModal
          submissions={studentRows}
          initialIndex={viewerIndex}
          tugas={tugas}
          onClose={() => setViewerIndex(null)}
          onSaveGrade={handleSaveGrade}
        />
      )}
    </div>
  );
}

export default function DetailTugasGuruPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Memuat data tugas...</div>}>
      <DetailTugasGuruContent />
    </Suspense>
  );
}
