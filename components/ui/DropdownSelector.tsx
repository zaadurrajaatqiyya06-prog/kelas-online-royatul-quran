"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  description?: string;
}

interface DropdownSelectorProps {
  options: DropdownOption[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

export function DropdownSelector({ options, value, onChange, className = "" }: DropdownSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.key === value) || options[0];

  // Click-outside listener
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 active:bg-slate-100 transition-all select-none"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected?.icon && (
          <span className="shrink-0 text-base leading-none">{selected.icon}</span>
        )}
        <span className="truncate max-w-[160px]">{selected?.label}</span>
        {selected?.badge !== undefined && (
          <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-black text-white">
            {selected.badge}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60"
          style={{
            animation: "dropdownFadeIn 0.15s ease-out",
          }}
        >
          {options.map((opt) => {
            const isActive = opt.key === value;
            return (
              <button
                key={opt.key}
                role="option"
                aria-selected={isActive}
                type="button"
                onClick={() => {
                  onChange(opt.key);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {opt.icon && (
                  <span className="shrink-0 text-base leading-none w-5 text-center">
                    {opt.icon}
                  </span>
                )}
                <span className="flex-1">
                  <span className="block font-semibold leading-tight">{opt.label}</span>
                  {opt.description && (
                    <span className="block text-[11px] text-slate-400 mt-0.5 font-normal">
                      {opt.description}
                    </span>
                  )}
                </span>
                {opt.badge !== undefined && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-[10px] font-black text-blue-700">
                    {opt.badge}
                  </span>
                )}
                {isActive && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
