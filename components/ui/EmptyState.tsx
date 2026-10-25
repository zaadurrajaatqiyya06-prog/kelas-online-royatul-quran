import React from "react";
import Link from "next/link";
import { ShieldOff, Inbox } from "lucide-react";

interface EmptyStateProps {
  /** "restricted" | "empty" | "not-found" */
  type?: "restricted" | "empty" | "not-found";
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  type = "empty",
  title,
  description,
  actionLabel,
  actionHref,
  icon,
}: EmptyStateProps) {
  const defaults: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
    restricted: {
      title: "Akses Khusus",
      description: "Silakan login dengan akun yang sesuai untuk mengakses halaman ini.",
      icon: <ShieldOff className="h-9 w-9 text-slate-400" />,
    },
    empty: {
      title: "Belum Ada Data",
      description: "Belum ada data yang tersedia saat ini.",
      icon: <Inbox className="h-9 w-9 text-slate-400" />,
    },
    "not-found": {
      title: "Data Tidak Ditemukan",
      description: "Tidak ada yang cocok dengan pencarianmu.",
      icon: <Inbox className="h-9 w-9 text-slate-400" />,
    },
  };

  const resolved = defaults[type];

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 shadow-inner">
        {icon ?? resolved.icon}
      </div>
      <div className="max-w-xs">
        <p className="text-base font-bold text-slate-800">{title ?? resolved.title}</p>
        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{description ?? resolved.description}</p>
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-1 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
