"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { CheckSquare, Award, UserCheck, PlusCircle, BarChart3, Users } from "lucide-react";

export function BottomNav() {
  const { currentUser } = useApp();
  const pathname = usePathname();

  if (!currentUser) return null;

  if (currentUser.role === "murid") {
    const items = [
      { href: "/murid", label: "Tugas", icon: CheckSquare },
      { href: "/murid/nilai", label: "Nilai", icon: Award },
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md border-t border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="flex justify-around py-2">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-1 px-4 text-xs font-medium transition ${
                  isActive ? "text-emerald-600" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  if (currentUser.role === "guru" || currentUser.role === "walas") {
    const items = [
      { href: "/guru", label: "Kelas Guru", icon: CheckSquare },
      { href: "/guru/tugas/baru", label: "Buat Tugas", icon: PlusCircle },
      ...(currentUser.role === "walas"
        ? [{ href: "/walas", label: "Rekap Walas", icon: BarChart3 }]
        : []),
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md border-t border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="flex justify-around py-2">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium transition ${
                  isActive ? "text-emerald-600" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  if (currentUser.role === "admin") {
    const items = [
      { href: "/admin", label: "Kelola Data", icon: Users },
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md border-t border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="flex justify-around py-2">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-1 px-4 text-xs font-medium transition ${
                  isActive ? "text-amber-600" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return null;
}
