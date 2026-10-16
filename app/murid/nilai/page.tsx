"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { AppNavbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Award, ArrowLeft, CheckCircle2, MessageSquare, BookOpen } from "lucide-react";

export default function MuridNilaiPage() {
  const { currentUser, pengumpulanList, tugasList, isLoading } = useApp();

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
        <p className="text-sm text-slate-600">Silakan login terlebih dahulu.</p>
        <Link href="/login" className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">
          Masuk
        </Link>
      </div>
    );
  }

  // Filter graded submissions for this student
  const dinilaiList = pengumpulanList.filter(
    (p) => p.muridId === currentUser.id && p.status === "dinilai" && p.nilai !== undefined
  );

  const totalNilai = dinilaiList.reduce((acc, curr) => acc + (curr.nilai || 0), 0);
  const rataRata = dinilaiList.length > 0 ? (totalNilai / dinilaiList.length).toFixed(1) : "-";

  return (
    <div className="flex flex-1 flex-col pb-24">
      <AppNavbar />

      {/* Header Bar */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-4 py-3">
        <Link href="/murid" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-sm font-bold text-slate-900 leading-tight">Rekap Nilai Saya</h1>
      </div>

      {/* Summary Card */}
      <div className="p-4">
        <div className="rounded-2xl bg-gradient-to-tr from-emerald-800 to-teal-700 p-5 text-white shadow-md shadow-emerald-900/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-200">Rata-rata Nilai Tugas</p>
              <h2 className="text-3xl font-black tracking-tight text-white mt-0.5">{rataRata}</h2>
              <p className="text-[11px] text-emerald-200 mt-1">Dari total {dinilaiList.length} tugas yang telah dinilai</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md">
              <Award className="h-7 w-7 text-amber-300" />
            </div>
          </div>
        </div>

        {/* List Nilai */}
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Rincian Nilai Per Tugas</h3>

          {dinilaiList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <Award className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs font-bold text-slate-700">Belum Ada Nilai Masuk</p>
              <p className="mt-0.5 text-xs text-slate-400">Tugas yang telah Anda kumpulkan sedang dalam proses evaluasi guru.</p>
            </div>
          ) : (
            dinilaiList.map((p) => {
              const tugas = tugasList.find((t) => t.id === p.tugasId);
              return (
                <div key={p.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        {tugas?.mapelNama || "Mata Pelajaran"}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{tugas?.judul || "Tugas"}</h4>
                      <p className="text-[11px] text-slate-400">
                        Dinilai oleh: {p.dinilaiOleh || "Guru"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-black text-emerald-600 leading-none">{p.nilai}</span>
                      <span className="text-[10px] text-slate-400 mt-1">Skor / 100</span>
                    </div>
                  </div>

                  {p.catatanGuru && (
                    <div className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-100">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 mb-0.5">
                        <MessageSquare className="h-3 w-3 text-emerald-600" />
                        <span>Catatan Guru:</span>
                      </div>
                      <p className="text-slate-600 italic">"{p.catatanGuru}"</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
