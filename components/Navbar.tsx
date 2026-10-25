"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { LogOut, BookOpen, HelpCircle } from "lucide-react";

const roleBadge: Record<string, { label: string; cls: string }> = {
  murid:  { label: "Santri",    cls: "bg-emerald-100 text-emerald-700" },
  guru:   { label: "Guru",      cls: "bg-blue-100   text-blue-700" },
  walas:  { label: "Wali Kelas",cls: "bg-violet-100 text-violet-700" },
  admin:  { label: "Admin",     cls: "bg-amber-100  text-amber-700" },
};

export function AppNavbar() {
  const { currentUser, logout } = useApp();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const badge = currentUser ? roleBadge[currentUser.role] : null;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/97 px-4 py-2.5 backdrop-blur-xl shadow-sm shadow-slate-100/60">
      {/* Logo */}
      <Link
        href={currentUser ? `/${currentUser.role}` : "/"}
        className="flex items-center gap-2.5 min-w-0"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200/60">
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold tracking-tight text-slate-900 leading-none">
            Royatul Quran
          </p>
          <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5 hidden sm:block">
            Kelas Online &amp; Rekap Tugas
          </p>
        </div>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {currentUser ? (
          <>
            {/* Role badge */}
            {badge && (
              <span className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${badge.cls}`}>
                {badge.label}
              </span>
            )}

            {/* Manual Book Link */}
            <a
              href="/manual-book.html"
              target="_blank"
              rel="noopener noreferrer"
              title="Buka Buku Panduan (Manual Book)"
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden md:inline">Panduan</span>
            </a>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Keluar dari akun"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-slate-400 hover:border-red-100 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 transition-colors"
          >
            Masuk
          </Link>
        )}
      </div>
    </header>
  );
}
