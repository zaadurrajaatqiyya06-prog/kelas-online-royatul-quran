"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { LogOut, BookOpen, ShieldCheck, GraduationCap } from "lucide-react";

export function AppNavbar() {
  const { currentUser, logout } = useApp();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getRoleBadge = () => {
    if (!currentUser) return null;
    switch (currentUser.role) {
      case "murid":
        return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Murid • {currentUser.kelasNama}</span>;
      case "walas":
        return <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800">Wali Kelas</span>;
      case "guru":
        return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">Guru</span>;
      case "admin":
        return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 border border-amber-300">Administrator</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md">
      <Link href={currentUser ? `/${currentUser.role}` : "/"} className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-200">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">Royatul Quran</h1>
          <p className="text-[10px] text-slate-500">Kelas Online & Rekap Tugas</p>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {currentUser ? (
          <>
            <div className="hidden sm:block">{getRoleBadge()}</div>
            <button
              onClick={handleLogout}
              title="Keluar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            Masuk
          </Link>
        )}
      </div>
    </header>
  );
}
