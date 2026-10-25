import React from "react";

interface BadgeStatusProps {
  /** "sudah" | "belum" | "dinilai" | "ditolak" | "info" | "neutral" */
  status: "sudah" | "belum" | "dinilai" | "ditolak" | "info" | "neutral";
  label?: string;
  className?: string;
}

const config: Record<string, { bg: string; text: string; ring: string; defaultLabel: string }> = {
  sudah:    { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-600/20", defaultLabel: "Sudah Kumpul" },
  belum:    { bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-600/20",    defaultLabel: "Belum Kumpul" },
  dinilai:  { bg: "bg-blue-50",    text: "text-blue-700",    ring: "ring-blue-600/20",    defaultLabel: "Sudah Dinilai" },
  ditolak:  { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-600/20",   defaultLabel: "Ditolak" },
  info:     { bg: "bg-indigo-50",  text: "text-indigo-700",  ring: "ring-indigo-600/20",  defaultLabel: "Info" },
  neutral:  { bg: "bg-slate-50",   text: "text-slate-600",   ring: "ring-slate-400/20",   defaultLabel: "Netral" },
};

export function BadgeStatus({ status, label, className = "" }: BadgeStatusProps) {
  const { bg, text, ring, defaultLabel } = config[status] ?? config.neutral;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${bg} ${text} ${ring} ${className}`}
    >
      {label ?? defaultLabel}
    </span>
  );
}
