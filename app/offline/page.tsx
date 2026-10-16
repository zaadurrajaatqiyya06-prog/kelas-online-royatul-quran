"use client";

import React from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, BookOpen } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-xl shadow-amber-500/10">
          <WifiOff className="h-10 w-10 animate-pulse" />
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
        <BookOpen className="h-3.5 w-3.5" />
        Royatul Qur'an Digital
      </div>

      <h1 className="text-xl font-black text-white sm:text-2xl">
        Koneksi Internet Terputus
      </h1>

      <p className="mt-2 max-w-xs text-xs text-slate-300 leading-relaxed sm:text-sm">
        Aplikasi sedang dalam mode offline. Jangan khawatir, jawaban yang sudah Anda ketik tetap tersimpan aman di perangkat ini.
      </p>

      <div className="mt-6 flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 active:scale-95 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Coba Muat Ulang
        </button>

        <Link
          href="/murid"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/15 transition-all"
        >
          Buka Halaman Tugas Santri
        </Link>
      </div>

      <p className="mt-8 text-[11px] text-slate-500">
        KORQ PWA v1.0 • Offline Ready
      </p>
    </div>
  );
}
