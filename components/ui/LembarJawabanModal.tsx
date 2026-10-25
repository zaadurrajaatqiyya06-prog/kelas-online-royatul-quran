"use client";

import React, { useState, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Clock,
  FileText,
  CheckCircle2,
  Award,
  Image as ImageIcon,
  AlertCircle,
  ClipboardList,
  Download,
} from "lucide-react";
import type { Pengumpulan, Tugas } from "@/lib/store";
import { getDaysRemaining } from "@/lib/submission-cache-client";

// ─────────────────────────────────────────────────────────────────────────────
// Tipe Props
// ─────────────────────────────────────────────────────────────────────────────

interface LembarJawabanModalProps {
  /** Daftar semua submission dari kelas ini (untuk navigasi prev/next santri) */
  submissions: Array<{
    student: { id: string; nama: string; nis?: string | null };
    submission: Pengumpulan | undefined;
    hasSubmitted: boolean;
  }>;
  /** Indeks santri yang sedang dilihat */
  initialIndex: number;
  /** Detail tugas (untuk konteks tampilan soal PG/Esai) */
  tugas: Tugas;
  /** Callback saat modal ditutup */
  onClose: () => void;
  /** Callback saat guru simpan nilai */
  onSaveGrade: (submissionId: string, nilai: number, catatan: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: menentukan apakah URL adalah gambar
// ─────────────────────────────────────────────────────────────────────────────
function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
}

function isPdfUrl(url: string): boolean {
  return /\.pdf$/i.test(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Komponen Utama
// ─────────────────────────────────────────────────────────────────────────────

export function LembarJawabanModal({
  submissions,
  initialIndex,
  tugas,
  onClose,
  onSaveGrade,
}: LembarJawabanModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [inputNilai, setInputNilai] = useState<number>(
    submissions[initialIndex]?.submission?.nilai ?? 80
  );
  const [inputCatatan, setInputCatatan] = useState(
    submissions[initialIndex]?.submission?.catatanGuru ?? ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const currentRow = submissions[currentIndex];
  const { student, submission, hasSubmitted } = currentRow;

  // Navigasi ke santri lain yang sudah submit
  const submittedOnly = submissions
    .map((s, idx) => ({ ...s, originalIdx: idx }))
    .filter((s) => s.hasSubmitted);

  const currentSubmittedIdx = submittedOnly.findIndex(
    (s) => s.originalIdx === currentIndex
  );

  const goNext = () => {
    const next = submittedOnly[currentSubmittedIdx + 1];
    if (next) {
      setCurrentIndex(next.originalIdx);
      setZoom(1);
      setRotation(0);
      setInputNilai(next.submission?.nilai ?? 80);
      setInputCatatan(next.submission?.catatanGuru ?? "");
      setSavedFeedback(false);
    }
  };

  const goPrev = () => {
    const prev = submittedOnly[currentSubmittedIdx - 1];
    if (prev) {
      setCurrentIndex(prev.originalIdx);
      setZoom(1);
      setRotation(0);
      setInputNilai(prev.submission?.nilai ?? 80);
      setInputCatatan(prev.submission?.catatanGuru ?? "");
      setSavedFeedback(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!submission) return;
    setIsSaving(true);
    onSaveGrade(submission.id, inputNilai, inputCatatan.trim());
    await new Promise((r) => setTimeout(r, 400));
    setIsSaving(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  }, [submission, inputNilai, inputCatatan, onSaveGrade]);

  // Tentukan sumber file yang tersedia
  const localUrl = submission?.localFileUrl || null;
  const driveUrl = submission?.gdriveFileUrl || submission?.pdfUrl || null;
  const daysRemaining = submission?.waktuSubmit
    ? getDaysRemaining(submission.waktuSubmit)
    : 0;
  const hasLocalCache = !!localUrl && daysRemaining > 0;

  // Label waktu cache
  const cacheLabel =
    daysRemaining > 1
      ? `⏱️ Cache tersisa ${daysRemaining} hari`
      : daysRemaining === 1
      ? "⏱️ Cache tersisa 1 hari lagi"
      : "⏱️ Cache habis";

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-slate-900/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ── MODAL BOX ── */}
      <div className="relative m-auto flex h-[95dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700">Lembar Jawaban</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{student.nama}</p>
              <p className="text-[10px] text-slate-500">
                NIS: {student.nis || "–"} ·{" "}
                <span className="font-semibold text-slate-600">{tugas.mapelNama}</span>
              </p>
            </div>
          </div>

          {/* Navigasi Santri */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
              {currentSubmittedIdx + 1}/{submittedOnly.length} santri
            </span>
            <button
              onClick={goPrev}
              disabled={currentSubmittedIdx === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition"
              title="Santri Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              disabled={currentSubmittedIdx >= submittedOnly.length - 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition"
              title="Santri Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
              title="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── BODY: SPLIT VIEW ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── PANEL KIRI: Viewer Lembar Jawaban ── */}
          <div className="flex flex-1 flex-col overflow-hidden border-r border-slate-100">
            {/* Toolbar viewer */}
            {hasLocalCache && isImageUrl(localUrl!) && (
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition"
                  title="Putar 90°"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </button>
                <span className="ml-auto text-[10px] text-slate-400">
                  Zoom: {Math.round(zoom * 100)}%
                </span>
                {driveUrl && (
                  <a
                    href={driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Drive</span>
                  </a>
                )}
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-4">
              {!hasSubmitted ? (
                /* Belum submit */
                <div className="text-center space-y-2">
                  <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-600">Belum Mengumpulkan</p>
                  <p className="text-xs text-slate-400">Santri ini belum mengumpulkan tugas.</p>
                </div>
              ) : hasLocalCache ? (
                /* File lokal tersedia — tampilkan langsung */
                isImageUrl(localUrl!) ? (
                  <div className="overflow-auto w-full h-full flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={localUrl!}
                      alt={`Lembar jawaban ${student.nama}`}
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transformOrigin: "center",
                        transition: "transform 0.2s ease",
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        borderRadius: "8px",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                      }}
                    />
                  </div>
                ) : isPdfUrl(localUrl!) ? (
                  <iframe
                    src={localUrl!}
                    className="w-full h-full rounded-xl border border-slate-200"
                    title="Preview PDF Jawaban"
                  />
                ) : (
                  /* File lain — tampilkan ikon download */
                  <div className="text-center space-y-3">
                    <FileText className="h-12 w-12 text-amber-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">{submission?.fileName}</p>
                    <a
                      href={localUrl!}
                      download
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Unduh File
                    </a>
                  </div>
                )
              ) : submission?.jawabanTeks || submission?.jawabanPG || submission?.jawabanEsaiList ? (
                /* Tidak ada file — tapi ada jawaban teks/PG/Esai online */
                <JawabanOnlineView submission={submission} tugas={tugas} />
              ) : driveUrl ? (
                /* Cache habis — arahkan ke Drive */
                <div className="text-center space-y-3 max-w-xs">
                  <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-amber-50 border border-amber-200">
                    <Clock className="h-7 w-7 text-amber-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Cache Preview Habis</p>
                  <p className="text-xs text-slate-500">
                    Preview cepat (7 hari) sudah habis. File tetap aman tersimpan di Google Drive.
                  </p>
                  <a
                    href={driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Buka Arsip di Google Drive
                  </a>
                </div>
              ) : (
                /* Tidak ada file sama sekali */
                <div className="text-center space-y-2">
                  <ImageIcon className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400">Tidak ada file lampiran.</p>
                  {submission?.jawabanTeks && (
                    <p className="text-xs text-slate-600 italic max-w-xs">
                      "{submission.jawabanTeks}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Status bar bawah */}
            {hasSubmitted && submission && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-3 py-2">
                <span className="text-[10px] text-slate-500">
                  📎 {submission.fileName || "Jawaban online"}
                </span>
                {hasLocalCache ? (
                  <span className="text-[10px] font-semibold text-emerald-700">{cacheLabel}</span>
                ) : driveUrl ? (
                  <span className="text-[10px] font-semibold text-amber-600">
                    📦 Tersimpan di Drive
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* ── PANEL KANAN: Form Nilai ── */}
          <div className="flex w-64 shrink-0 flex-col overflow-y-auto bg-white sm:w-72">
            <div className="p-4 space-y-4">

              {/* Info Santri */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1">
                <p className="text-xs font-black text-slate-900">{student.nama}</p>
                <p className="text-[10px] text-slate-500">NIS: {student.nis || "–"}</p>
                {hasSubmitted && submission?.waktuSubmit && (
                  <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Dikumpulkan:{" "}
                    {new Date(submission.waktuSubmit).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>

              {/* Input Nilai */}
              {hasSubmitted ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      <Award className="inline h-3.5 w-3.5 text-amber-500 mr-1" />
                      Nilai (0 – 100)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={inputNilai}
                        onChange={(e) => setInputNilai(Number(e.target.value))}
                        className="flex-1 accent-emerald-600"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={inputNilai}
                        onChange={(e) => setInputNilai(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-14 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-sm font-black text-emerald-700 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    {/* Visual grade badge */}
                    <div
                      className={`mt-2 rounded-xl px-3 py-2 text-center text-lg font-black ${
                        inputNilai >= 90
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : inputNilai >= 75
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : inputNilai >= 60
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {inputNilai}
                      <span className="text-xs font-semibold ml-1">
                        {inputNilai >= 90 ? "A+" : inputNilai >= 80 ? "A" : inputNilai >= 70 ? "B" : inputNilai >= 60 ? "C" : "D"}
                      </span>
                    </div>
                  </div>

                  {/* Catatan Guru */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Catatan / Komentar Guru
                    </label>
                    <textarea
                      rows={4}
                      value={inputCatatan}
                      onChange={(e) => setInputCatatan(e.target.value)}
                      placeholder="Tuliskan masukan atau apresiasi untuk santri..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition"
                    />
                  </div>

                  {/* Tombol Simpan */}
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`w-full rounded-xl py-2.5 text-xs font-black transition ${
                      savedFeedback
                        ? "bg-emerald-500 text-white"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95"
                    } disabled:opacity-60`}
                  >
                    {isSaving
                      ? "Menyimpan..."
                      : savedFeedback
                      ? "✓ Nilai Tersimpan!"
                      : "Simpan Nilai"}
                  </button>

                  {/* Tombol Santri Berikutnya */}
                  {currentSubmittedIdx < submittedOnly.length - 1 && (
                    <button
                      onClick={goNext}
                      className="w-full rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition flex items-center justify-center gap-1"
                    >
                      Santri Berikutnya <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </>
              ) : (
                <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-center text-xs text-rose-600 font-semibold">
                  Santri ini belum mengumpulkan tugas.
                </div>
              )}

              {/* Link Drive sebagai alternatif */}
              {driveUrl && (
                <a
                  href={driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">Buka di Google Drive</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-komponen: tampilan jawaban online (PG / Esai / Teks)
// ─────────────────────────────────────────────────────────────────────────────

function JawabanOnlineView({
  submission,
  tugas,
}: {
  submission: Pengumpulan;
  tugas: Tugas;
}) {
  const kunciPG = tugas.soalPGList?.reduce<Record<number, string>>((acc, s, i) => {
    if (s.kunci) acc[i] = s.kunci;
    return acc;
  }, {});

  return (
    <div className="w-full max-w-lg space-y-4 py-2">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-emerald-600" />
        <p className="text-sm font-bold text-slate-800">Lembar Jawaban Digital</p>
      </div>

      {/* Jawaban Teks */}
      {submission.jawabanTeks && (
        <div className="rounded-xl bg-white border border-slate-200 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Jawaban Teks</p>
          <p className="text-xs text-slate-700 whitespace-pre-wrap">{submission.jawabanTeks}</p>
        </div>
      )}

      {/* Jawaban PG */}
      {submission.jawabanPG && tugas.soalPGList && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Pilihan Ganda</p>
          {tugas.soalPGList.map((soal, idx) => {
            const jawaban = (submission.jawabanPG as Record<number, string>)?.[idx];
            const kunci = kunciPG?.[idx];
            const isBenar = jawaban && kunci && jawaban === kunci;
            const isSalah = jawaban && kunci && jawaban !== kunci;
            return (
              <div
                key={idx}
                className={`rounded-xl p-3 text-xs border ${
                  isBenar
                    ? "bg-emerald-50 border-emerald-200"
                    : isSalah
                    ? "bg-rose-50 border-rose-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <p className="font-semibold text-slate-700 mb-1">
                  {idx + 1}. {soal.pertanyaan}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`font-black ${isBenar ? "text-emerald-700" : isSalah ? "text-rose-700" : "text-slate-600"}`}>
                    {isBenar ? "✓" : isSalah ? "✗" : "–"} Jawaban: {jawaban || "Tidak dijawab"}
                  </span>
                  {kunci && jawaban !== kunci && (
                    <span className="text-emerald-700 text-[10px]">(Kunci: {kunci})</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Jawaban Esai */}
      {submission.jawabanEsaiList && tugas.soalEsaiList && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Esai</p>
          {tugas.soalEsaiList.map((soal, idx) => {
            const jawaban = (submission.jawabanEsaiList as Record<number, string>)?.[idx];
            return (
              <div key={idx} className="rounded-xl bg-white border border-slate-200 p-3 text-xs">
                <p className="font-semibold text-slate-700 mb-1">
                  {idx + 1}. {soal.pertanyaan}
                </p>
                <p className="text-slate-600 italic">
                  {jawaban || <span className="text-rose-400">Tidak dijawab</span>}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
