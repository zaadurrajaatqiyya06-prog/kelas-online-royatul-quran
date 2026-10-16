"use client";

import React from "react";
import Link from "next/link";
import { AppNavbar } from "@/components/Navbar";
import { BookOpen, CheckCircle2, ShieldCheck, ArrowRight, Smartphone, Sparkles, FolderKanban } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col pb-12">
      <AppNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-700 via-emerald-800 to-teal-950 px-6 pt-10 pb-16 text-white">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-teal-400/10 blur-2xl" />

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/50 px-3 py-1 text-xs font-medium text-emerald-200 border border-emerald-400/30 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>PWA Pengumpulan & Rekap Tugas</span>
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-white leading-tight">
            Kelas Online <br />
            <span className="text-emerald-300">Royatul Quran</span>
          </h1>

          <p className="mt-3 text-sm text-emerald-100/90 leading-relaxed max-w-sm mx-auto">
            Satu tempat pengumpulan tugas terpusat. Murid kumpul mandiri, guru nilai seketika, dan wali kelas bebas dari tumpukan chat WA.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-300 active:scale-95 transition"
            >
              <span>Masuk Aplikasi (Single-ID)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <span className="text-[11px] text-emerald-300/80">
              Cukup masukkan NIS (Murid) atau NIP (Guru) + PIN
            </span>
          </div>
        </div>
      </section>

      {/* Fitur Utama Cards */}
      <section className="px-5 -mt-6 z-20 space-y-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/50">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Login Single-ID Tanpa Ribet</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Murid cukup hafal NIS sendiri. Langsung terbuka profil, kelas, dan tugas yang belum selesai tanpa perlu mencari kelas manual.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/50">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Rekap Walas 1 Layar</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Wali kelas bisa melihat progres tugas SEMUA mapel di kelasnya sekaligus. Otomatis tahu siapa murid yang belum mengumpulkan.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/50">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Telegram Topic & GDrive Rapi</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Tugas langsung terkirim ke topik Telegram mapel terkait dan terarsip otomatis ke folder Google Drive per kelas & tugas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Alur Sederhana */}
      <section className="px-6 mt-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Alur Penggunaan</h2>
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold text-white text-[11px]">1</span>
            <span>Guru mapel buat tugas di web (esai, foto, video, dll)</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold text-white text-[11px]">2</span>
            <span>Murid buka HP, kerjakan & submit foto/video langsung</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold text-white text-[11px]">3</span>
            <span>Rekap otomatis tersaji untuk guru & wali kelas tanpa file WA berceceran</span>
          </div>
        </div>
      </section>
    </div>
  );
}
