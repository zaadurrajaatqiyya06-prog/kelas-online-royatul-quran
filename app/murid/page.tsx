"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { AppNavbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { JenisTugas } from "@/lib/mock-data";
import { Clock, CheckCircle2, AlertCircle, FileText, Camera, Video, File, ChevronRight, Award, Calendar } from "lucide-react";

export default function MuridDashboard() {
  const { currentUser, tugasList, pengumpulanList, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState<"belum" | "sudah" | "dinilai">("belum");

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-slate-600">Sesi telah berakhir atau Anda belum login.</p>
        <Link href="/login" className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">
          Masuk ke Akun
        </Link>
      </div>
    );
  }

  // Filter tasks for this student's class
  const classTugas = tugasList.filter((t) => t.kelasId === (currentUser.kelasId || "k-6"));

  // Check student submission status for each task
  const tugasWithStatus = classTugas.map((t) => {
    const submission = pengumpulanList.find(
      (p) => p.tugasId === t.id && p.muridId === currentUser.id
    );

    let status: "belum" | "sudah" | "dinilai" | "ditolak" = "belum";
    if (submission) {
      status = submission.status;
    }

    return {
      ...t,
      submissionStatus: status,
      submission,
    };
  });

  // Tugas yang ditolak harus muncul di list "belum" agar bisa dikerjakan ulang
  const belumList = tugasWithStatus.filter((t) => t.submissionStatus === "belum" || t.submissionStatus === "ditolak");
  const sudahList = tugasWithStatus.filter((t) => t.submissionStatus === "sudah");
  const dinilaiList = tugasWithStatus.filter((t) => t.submissionStatus === "dinilai");

  const getJenisBadge = (jenis: JenisTugas) => {
    switch (jenis) {
      case "video":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
            <Video className="h-3 w-3" /> Video
          </span>
        );
      case "foto":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            <Camera className="h-3 w-3" /> Foto Tugas
          </span>
        );
      case "esai":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
            <FileText className="h-3 w-3" /> Esai
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
            <File className="h-3 w-3" /> Dokumen
          </span>
        );
    }
  };

  const formatDeadline = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-1 flex-col pb-24">
      <AppNavbar />

      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <span className="rounded-full bg-emerald-600/60 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-100 border border-emerald-400/30">
              {currentUser.kelasNama || "Kelas 6"}
            </span>
            <h2 className="mt-1 text-base font-bold tracking-tight text-white">{currentUser.nama}</h2>
            <p className="text-xs text-emerald-200">NIS: {currentUser.nis || "1001"}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold backdrop-blur-md">
            {currentUser.nama.charAt(0)}
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm">
            <p className="text-lg font-black text-rose-300">{belumList.length}</p>
            <p className="text-[10px] text-emerald-100">Belum Kumpul</p>
          </div>
          <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm">
            <p className="text-lg font-black text-amber-300">{sudahList.length}</p>
            <p className="text-[10px] text-emerald-100">Menunggu Nilai</p>
          </div>
          <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm">
            <p className="text-lg font-black text-emerald-300">{dinilaiList.length}</p>
            <p className="text-[10px] text-emerald-100">Sudah Dinilai</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[57px] z-20 flex border-b border-slate-200 bg-white text-xs font-semibold">
        <button
          onClick={() => setActiveTab("belum")}
          className={`flex-1 py-3 text-center border-b-2 transition ${
            activeTab === "belum"
              ? "border-rose-500 text-rose-600 bg-rose-50/30"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          🔴 Belum ({belumList.length})
        </button>
        <button
          onClick={() => setActiveTab("sudah")}
          className={`flex-1 py-3 text-center border-b-2 transition ${
            activeTab === "sudah"
              ? "border-amber-500 text-amber-700 bg-amber-50/30"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          🟡 Dikumpul ({sudahList.length})
        </button>
        <button
          onClick={() => setActiveTab("dinilai")}
          className={`flex-1 py-3 text-center border-b-2 transition ${
            activeTab === "dinilai"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/30"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          🟢 Dinilai ({dinilaiList.length})
        </button>
      </div>

      {/* Content List */}
      <div className="p-4 space-y-3">
        {activeTab === "belum" && (
          <>
            {belumList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-2 text-xs font-bold text-slate-800">Alhamdulillah!</p>
                <p className="mt-0.5 text-xs text-slate-500">Semua tugas Anda sudah dikumpulkan.</p>
              </div>
            ) : (
              belumList.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-2xl border p-4 shadow-sm transition ${
                    t.submissionStatus === "ditolak"
                      ? "border-rose-300 bg-rose-50/40 hover:border-rose-400"
                      : "border-rose-100 bg-white hover:border-rose-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.mapelNama}</span>
                    <div className="flex items-center gap-1.5">
                      {t.submissionStatus === "ditolak" && (
                        <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                          ❌ Ditolak
                        </span>
                      )}
                      {getJenisBadge(t.jenis)}
                    </div>
                  </div>

                  <h3 className="mt-1.5 text-sm font-bold text-slate-900 leading-snug">{t.judul}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{t.instruksi}</p>

                  {t.submissionStatus === "ditolak" && t.submission?.alasanTolak && (
                    <div className="mt-2 rounded-xl bg-rose-100 border border-rose-200 px-3 py-2 text-[11px] text-rose-800">
                      <span className="font-bold">Alasan guru: </span>{t.submission.alasanTolak}
                    </div>
                  )}

                  <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDeadline(t.deadline)}</span>
                    </div>

                    <Link
                      href={`/murid/tugas/${t.id}`}
                      className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-sm active:scale-95 transition ${
                        t.submissionStatus === "ditolak"
                          ? "bg-rose-700 hover:bg-rose-800 shadow-rose-700/20"
                          : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                      }`}
                    >
                      <span>{t.submissionStatus === "ditolak" ? "Kerjakan Ulang" : "Kerjakan"}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))

            )}
          </>
        )}

        {activeTab === "sudah" && (
          <>
            {sudahList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <p className="text-xs text-slate-500">Belum ada tugas yang sedang menunggu penilaian guru.</p>
              </div>
            ) : (
              sudahList.map((t) => (
                <div key={t.id} className="rounded-2xl border border-amber-200/80 bg-amber-50/20 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.mapelNama}</span>
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      Menunggu Nilai
                    </span>
                  </div>

                  <h3 className="mt-1.5 text-sm font-bold text-slate-900">{t.judul}</h3>

                  <div className="mt-3 flex items-center justify-between border-t border-amber-200/50 pt-2.5 text-xs text-slate-500">
                    <span>Dikirim: {t.submission?.waktuSubmit ? formatDeadline(t.submission.waktuSubmit) : "-"}</span>
                    <Link
                      href={`/murid/tugas/${t.id}`}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      Lihat Kiriman ➜
                    </Link>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === "dinilai" && (
          <>
            {dinilaiList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <p className="text-xs text-slate-500">Belum ada tugas yang dinilai oleh guru.</p>
              </div>
            ) : (
              dinilaiList.map((t) => (
                <div key={t.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.mapelNama}</span>
                      <h3 className="mt-1 text-sm font-bold text-slate-900">{t.judul}</h3>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xl font-black text-emerald-600">{t.submission?.nilai}</span>
                      <span className="text-[10px] text-slate-400">Skor / 100</span>
                    </div>
                  </div>

                  {t.submission?.catatanGuru && (
                    <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs border border-slate-100">
                      <p className="font-semibold text-slate-700">Catatan Ustadz/Ustadzah:</p>
                      <p className="mt-0.5 text-slate-600 italic">"{t.submission.catatanGuru}"</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
