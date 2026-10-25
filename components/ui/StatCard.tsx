import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  /** "default" | "success" | "danger" | "warning" | "info" */
  variant?: "default" | "success" | "danger" | "warning" | "info";
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "bg-white border-slate-200 text-slate-700",
  success: "bg-emerald-50/60 border-emerald-200 text-emerald-800",
  danger:  "bg-rose-50/60   border-rose-200   text-rose-800",
  warning: "bg-amber-50/60  border-amber-200  text-amber-800",
  info:    "bg-blue-50/60   border-blue-200   text-blue-800",
};

const valueStyles: Record<string, string> = {
  default: "text-slate-900",
  success: "text-emerald-700",
  danger:  "text-rose-700",
  warning: "text-amber-700",
  info:    "text-blue-700",
};

export function StatCard({ label, value, icon, variant = "default", className = "" }: StatCardProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center shadow-xs transition-shadow hover:shadow-sm ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="mb-1 opacity-70">{icon}</span>}
      <p className={`text-xl font-black leading-none ${valueStyles[variant]}`}>{value}</p>
      <p className="mt-1 text-[10px] font-semibold leading-tight opacity-75">{label}</p>
    </div>
  );
}
