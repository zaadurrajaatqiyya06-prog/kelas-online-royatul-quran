"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { CheckSquare, Award, UserCheck, PlusCircle, BarChart3, Users, Home } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

function NavLink({ item, activeColor }: { item: NavItem; activeColor: string }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && item.href.split("/").length > 2 ? pathname === item.href : pathname === item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 px-1 text-[10px] font-semibold transition-colors ${
        isActive ? activeColor : "text-slate-400 hover:text-slate-600"
      }`}
    >
      {isActive && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-current" />
      )}
      <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
      <span>{item.label}</span>
    </Link>
  );
}

export function BottomNav() {
  const { currentUser } = useApp();

  if (!currentUser) return null;

  let items: NavItem[] = [];
  let activeColor = "text-emerald-600";

  if (currentUser.role === "murid") {
    items = [
      { href: "/murid", label: "Tugas", icon: CheckSquare },
      { href: "/murid/nilai", label: "Nilai Saya", icon: Award },
    ];
    activeColor = "text-emerald-600";
  } else if (currentUser.role === "guru") {
    items = [
      { href: "/guru", label: "Dashboard", icon: Home },
      { href: "/guru/tugas/baru", label: "Buat Tugas", icon: PlusCircle },
    ];
    activeColor = "text-blue-600";
  } else if (currentUser.role === "walas") {
    items = [
      { href: "/guru", label: "Kelas Guru", icon: CheckSquare },
      { href: "/guru/tugas/baru", label: "Buat Tugas", icon: PlusCircle },
      { href: "/walas", label: "Rekap Walas", icon: BarChart3 },
    ];
    activeColor = "text-purple-600";
  } else if (currentUser.role === "admin") {
    items = [
      { href: "/admin", label: "Kelola Data", icon: Users },
    ];
    activeColor = "text-amber-600";
  }

  if (items.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-lg border-t border-slate-100 bg-white/96 backdrop-blur-xl shadow-[0_-1px_12px_rgba(0,0,0,0.06)]">
      {/* Safe area for iOS */}
      <div className="flex items-stretch pb-safe">
        {items.map((item) => (
          <NavLink key={item.href} item={item} activeColor={activeColor} />
        ))}
      </div>
    </nav>
  );
}
