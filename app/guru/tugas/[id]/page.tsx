"use client";

import React, { useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import type { Pengumpulan } from "@/lib/store";
import { AppNavbar } from "@/components/Navbar";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Award,
  Clock,
  FolderOpen,
  FileCheck,
  Send,
  X,
  Search,
} from "lucide-react";

function DetailTugasGuruContent() {
  const params = useParams();
  const tugasId = params?.id as string;
  const { tugasList, pengumpulanList, usersList, nilaiTugas } = useApp();

  const tugas = tugasList.find((t) => t.id === tugasId);

  // Selected submission for grading modal
  const [selectedSub, setSelectedSub] = useState<Pengumpulan | null>(null);
  const [inputNilai, setInputNilai] = useState<number>(85);
  const [inputCatatan, setInputCatatan] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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

  // Get all students of this class
  const classStudents = usersList.filter(
    (u) => u.role === "murid" && u.kelasId === tugas.kelasId
  );

  // Map each student with their submission (if any)
  const studentRows = classStudents.map((student) => {
    const submission = pengumpulanList.find(
      (p) => p.tugasId === tugas.id && p.muridId === student.id
    );
    return {
      student,
      submission,
      hasSubmitted: !!submission,
    };
  });

  const filteredRows = studentRows.filter((r) =>
    r.student.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.student.nis && r.student.nis.includes(searchTerm))
  );

  const totalKumpul = studentRows.filter((r) => r.hasSubmitted).length;
  const totalBelum = studentRows.length - totalKumpul;

  const handleOpenGradeModal = (sub: Pengumpulan) => {
    setSelectedSub(sub);
    setInputNilai(sub.nilai ?? 85);
    setInputCatatan(sub.catatanGuru || "");
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    nilaiTugas(selectedSub.id, Number(inputNilai), inputCatatan.trim());
    setSelectedSub(null);
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
          <h1 className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[240px]">{tugas.judul}</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Stats & GDrive Link */}
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

          {/* Shortcut Buka Folder Google Drive */}
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

          {filteredRows.map(({ student, submission, hasSubmitted }) => (
            <div
              key={student.id}
              className={`rounded-2xl border p-3.5 transition ${
                hasSubmitted
                  ? "border-slate-100 bg-white shadow-sm"
                  : "border-rose-100 bg-rose-50/20"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{student.nama}</span>
                    <span className="text-[10px] text-slate-400">NIS: {student.nis}</span>
                  </div>

                  {hasSubmitted && submission ? (
                    <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                      <p className="flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Kumpul: {new Date(submission.waktuSubmit || "").toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                      </p>
                      {submission.fileName && (
                        <p className="truncate max-w-[200px] text-slate-600 font-mono text-[10px]">
                          📎 {submission.fileName}
                        </p>
                      )}
                      {(submission.gdriveFileUrl || submission.pdfUrl) && (
                        <a
                          href={submission.gdriveFileUrl || submission.pdfUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline mt-0.5"
                        >
                          <ExternalLink className="h-2.5 w-2.5" />
                          <span>Buka File di Google Drive</span>
                        </a>
                      )}
                      {submission.jawabanTeks && (
                        <p className="italic text-slate-600 line-clamp-1">"{submission.jawabanTeks}"</p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>Belum Mengumpulkan</span>
                    </p>
                  )}
                </div>

                {/* Action / Grade Badge */}
                <div>
                  {hasSubmitted && submission ? (
                    submission.status === "dinilai" ? (
                      <button
                        onClick={() => handleOpenGradeModal(submission)}
                        className="flex flex-col items-end rounded-xl bg-emerald-50 px-2.5 py-1 text-right hover:bg-emerald-100 transition"
                      >
                        <span className="text-base font-black text-emerald-700 leading-none">
                          {submission.nilai}
                        </span>
                        <span className="text-[9px] font-semibold text-emerald-800">Ubah Nilai</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenGradeModal(submission)}
                        className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition"
                      >
                        Beri Nilai
                      </button>
                    )
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Beri Nilai */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Beri Nilai Tugas</h3>
                <p className="text-xs text-slate-500">{selectedSub.muridNama} (NIS {selectedSub.muridNis})</p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nilai Angka (Skala 0 - 100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={inputNilai}
                  onChange={(e) => setInputNilai(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-3 text-lg font-bold text-emerald-700 text-center focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Evaluasi / Komentar Guru
                </label>
                <textarea
                  rows={3}
                  value={inputCatatan}
                  onChange={(e) => setInputCatatan(e.target.value)}
                  placeholder="Contoh: Sangat baik, makhraj tajwid jelas dan lancar."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700"
                >
                  Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
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
