"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { LogOut, BookOpen, HelpCircle } from "lucide-react";

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  murid: { label: "Murid", color: "bg-emerald-100 text-emerald-800" },
  walas: { label: "Wali Kelas", color: "bg-purple-100 text-purple-800" },
  guru: { label: "Guru", color: "bg-blue-100 text-blue-800" },
  admin: { label: "Admin", color: "bg-amber-100 text-amber-900 border border-amber-300" },
};

export function AppNavbar() {
  const { currentUser, logout } = useApp();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const roleConfig = currentUser ? ROLE_CONFIG[currentUser.role] : null;
  const firstName = currentUser?.nama?.split(" ")[0] || "";
  const avatarLetter = currentUser?.nama?.charAt(0)?.toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100/80 bg-white/96 px-4 py-2.5 backdrop-blur-xl shadow-sm shadow-slate-100/60">
      {/* Logo */}
      <Link
        href={currentUser ? `/${currentUser.role}` : "/"}
        className="flex items-center gap-2.5 min-w-0"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-200">
          <BookOpen className="h-5 w-5" />
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
            {/* Role badge — hidden on mobile */}
            {roleConfig && (
              <span
                className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${roleConfig.color}`}
              >
                {roleConfig.label}
              </span>
            )}

            {/* User avatar + name */}
            <div className="flex items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 font-bold text-xs shrink-0">
                {avatarLetter}
              </div>
              <span className="hidden sm:block text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                {firstName}
              </span>
            </div>

            {/* Manual Book Link */}
            <a
              href="/manual-book.html"
              target="_blank"
              rel="noopener noreferrer"
              title="Buka Buku Panduan (Manual Book)"
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden md:inline">Panduan</span>
            </a>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Keluar"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition"
          >
            Masuk
          </Link>
        )}
      </div>
    </header>
  );
}
