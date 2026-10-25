"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";

export interface ActionMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  divider?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

interface SandwichActionMenuProps {
  items: ActionMenuItem[];
  label?: string;
  align?: "left" | "right";
  className?: string;
}

export function SandwichActionMenu({
  items,
  label,
  align = "right",
  className = "",
}: SandwichActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        id={`sandwich-menu-${label?.replace(/\s/g, "-") ?? "action"}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:bg-slate-100 transition-all select-none"
      >
        <MoreVertical className="h-4 w-4" />
        {label && <span>{label}</span>}
      </button>

      {/* Dropdown Menu Panel */}
      {open && (
        <div
          role="menu"
          className={`absolute top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-2xl border border-slate-100 bg-white py-1 shadow-xl shadow-slate-200/60 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          style={{
            animation: "sandwichFadeIn 0.15s ease-out",
          }}
        >
          {items.map((item, idx) => (
            <React.Fragment key={item.key}>
              {item.divider && idx > 0 && (
                <div className="my-1 border-t border-slate-100" />
              )}
              <button
                role="menuitem"
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick();
                    setOpen(false);
                  }
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  item.disabled
                    ? "cursor-not-allowed text-slate-300"
                    : item.danger
                    ? "text-rose-600 hover:bg-rose-50"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.icon && (
                  <span className="shrink-0 w-5 text-center text-base leading-none">
                    {item.icon}
                  </span>
                )}
                <span className="flex-1 font-medium">{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      <style>{`
        @keyframes sandwichFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
