"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import type { HalaqahAnggota, HalaqahCatatan } from "@/lib/store";
import { AppNavbar } from "@/components/Navbar";
import {
  BookOpen,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Award,
  Save,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function todayWIB() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function formatTanggal(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

const KEHADIRAN_OPTS: { value: "hadir" | "absen" | "izin"; label: string; icon: string; cls: string }[] = [
  { value: "hadir", label: "Hadir",  icon: "✓", cls: "border-emerald-400 bg-emerald-50 text-emerald-700" },
  { value: "izin",  label: "Izin",   icon: "🔖", cls: "border-amber-400 bg-amber-50 text-amber-700" },
  { value: "absen", label: "Absen",  icon: "✗", cls: "border-rose-400 bg-rose-50 text-rose-700" },
];

// ─────────────────────────────────────────────────────────────────────────────

function GuruHalaqahContent() {
  const { currentUser, halaqahList, fetchHalaqahAnggota, addHalaqahCatatan, fetchHalaqahCatatan } = useApp();

  // Cari halaqah yang ditugaskan ke guru ini
  const myHalaqah = halaqahList.filter((h) => h.musyrifId === currentUser?.id);
  const [selectedHalaqahId, setSelectedHalaqahId] = useState<string>(myHalaqah[0]?.id || "");

  const selectedHalaqah = halaqahList.find((h) => h.id === selectedHalaqahId);

  const [date, setDate] = useState(todayWIB());
  const [anggota, setAnggota] = useState<HalaqahAnggota[]>([]);
  const [catatan, setCatatan] = useState<HalaqahCatatan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state per murid: { muridId -> {jenis, capaian, catatan, nilai} }
  const [formData, setFormData] = useState<Record<string, {
    jenis: "hadir" | "absen" | "izin";
    capaian: string;
    catatan: string;
    nilai: string;
  }>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  // ── Load anggota & catatan ────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!selectedHalaqahId) return;
    setIsLoading(true);
    try {
      const [ang, cat] = await Promise.all([
        fetchHalaqahAnggota(selectedHalaqahId),
        fetchHalaqahCatatan(selectedHalaqahId, date),
      ]);
      setAnggota(ang);
      setCatatan(cat);

      // Inisialisasi form dari catatan yang sudah ada
      const initial: typeof formData = {};
      for (const a of ang) {
        const existing = cat.find((c) => c.muridId === a.muridId);
        initial[a.muridId] = {
          jenis: existing?.jenis || "hadir",
          capaian: existing?.capaian || "",
          catatan: existing?.catatan || "",
          nilai: existing?.nilai != null ? String(existing.nilai) : "",
        };
      }
      setFormData(initial);
    } finally {
      setIsLoading(false);
    }
  }, [selectedHalaqahId, date, fetchHalaqahAnggota, fetchHalaqahCatatan]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Simpan semua catatan ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedHalaqahId) return;
    setIsSaving(true);
    try {
      await Promise.all(
        Object.entries(formData).map(([muridId, d]) =>
          addHalaqahCatatan({
            halaqahId: selectedHalaqahId,
            muridId,
            tanggal: date,
            jenis: d.jenis,
            capaian: d.capaian.trim() || undefined,
            catatan: d.catatan.trim() || undefined,
            nilai: d.nilai ? Number(d.nilai) : undefined,
            musyrifId: currentUser?.id || undefined,
          })
        )
      );
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  // Navigasi tanggal
  const moveDays = (n: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d.toISOString().slice(0, 10));
  };

  // ── Stats ringkasan ───────────────────────────────────────────────────────
  const totalHadir = Object.values(formData).filter((d) => d.jenis === "hadir").length;
  const totalIzin  = Object.values(formData).filter((d) => d.jenis === "izin").length;
  const totalAbsen = Object.values(formData).filter((d) => d.jenis === "absen").length;

  if (myHalaqah.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <BookOpen className="h-12 w-12 text-purple-200 mb-3" />
        <p className="text-sm font-bold text-slate-700">Tidak Ada Halaqah</p>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          Kamu belum ditugaskan sebagai musyrif halaqah apapun. Hubungi admin untuk pengaturan.
        </p>
        <Link href="/guru" className="mt-4 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col pb-20">
      <AppNavbar />

      {/* ── Page Header ── */}
      <div className="bg-gradient-to-br from-purple-700 to-purple-900 px-4 pt-5 pb-8">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/guru" className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div>
            <p className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Halaqah Al-Qur'an</p>
            <h1 className="text-sm font-black text-white">Catatan Harian Musyrif</h1>
          </div>
        </div>

        {/* Selector Halaqah (jika punya lebih dari satu) */}
        {myHalaqah.length > 1 && (
          <div className="flex gap-1.5 flex-wrap mt-2">
            {myHalaqah.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelectedHalaqahId(h.id)}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
                  selectedHalaqahId === h.id
                    ? "border-white bg-white text-purple-800"
                    : "border-purple-400 text-purple-200 hover:bg-white/10"
                }`}
              >
                {h.nama}
              </button>
            ))}
          </div>
        )}

        {selectedHalaqah && (
          <div className="mt-3 flex items-center gap-3 text-purple-200 text-[10px]">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {anggota.length} santri
            </span>
            {selectedHalaqah.targetSurah && (
              <span className="flex items-center gap-1">
                🎯 {selectedHalaqah.targetSurah}
              </span>
            )}
            {selectedHalaqah.jadwal && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {selectedHalaqah.jadwal}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="px-4 -mt-4 space-y-4">

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Hadir", count: totalHadir, cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
            { label: "Izin",  count: totalIzin,  cls: "bg-amber-50 border-amber-200 text-amber-700" },
            { label: "Absen", count: totalAbsen, cls: "bg-rose-50 border-rose-200 text-rose-700" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-2.5 text-center ${s.cls}`}>
              <span className="text-xl font-black">{s.count}</span>
              <p className="text-[10px] font-bold">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Navigasi Tanggal ── */}
        <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-3 py-2.5 shadow-sm">
          <button onClick={() => moveDays(-1)} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 transition">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <div className="flex-1 text-center">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 text-center focus:outline-none cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">{formatTanggal(date)}</p>
          </div>
          <button onClick={() => moveDays(1)} disabled={date >= todayWIB()} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 transition disabled:opacity-30">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button onClick={loadData} disabled={isLoading} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 transition">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* ── Daftar Santri + Form Catatan ── */}
        {isLoading ? (
          <div className="text-center py-8 text-xs text-slate-400">Memuat data...</div>
        ) : anggota.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Users className="h-10 w-10 text-slate-200 mx-auto" />
            <p className="text-xs text-slate-400">Belum ada anggota di halaqah ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anggota
              .sort((a, b) => (a.jenjang ?? 99) - (b.jenjang ?? 99) || (a.muridNama || "").localeCompare(b.muridNama || ""))
              .map((a) => {
                const form = formData[a.muridId] || { jenis: "hadir", capaian: "", catatan: "", nilai: "" };
                const updateForm = (field: string, val: string) => {
                  setFormData((prev) => ({
                    ...prev,
                    [a.muridId]: { ...prev[a.muridId], [field]: val },
                  }));
                };

                return (
                  <div key={a.muridId} className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    {/* Santri header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{a.muridNama}</p>
                        <p className="text-[9px] text-slate-400">{a.kelasNama} · NIS: {a.muridNis || "–"}</p>
                      </div>
                      {/* Kehadiran toggle */}
                      <div className="flex gap-1">
                        {KEHADIRAN_OPTS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => updateForm("jenis", opt.value)}
                            className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition ${
                              form.jenis === opt.value ? opt.cls : "border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            {opt.icon} {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Form detail (hanya tampil jika hadir) */}
                    {form.jenis === "hadir" && (
                      <div className="px-3 py-2.5 space-y-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Capaian Bacaan / Hafalan</label>
                          <input
                            type="text"
                            value={form.capaian}
                            onChange={(e) => updateForm("capaian", e.target.value)}
                            placeholder="misal: Al-Baqarah ayat 1-5, Juz 30 halaman 3..."
                            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Catatan Musyrif</label>
                            <input
                              type="text"
                              value={form.catatan}
                              onChange={(e) => updateForm("catatan", e.target.value)}
                              placeholder="Komentar kelancaran, tajwid, dll..."
                              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                          <div className="w-16">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Nilai</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={form.nilai}
                              onChange={(e) => updateForm("nilai", e.target.value)}
                              placeholder="0–100"
                              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-center font-bold text-purple-700 focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {form.jenis !== "hadir" && (
                      <div className="px-3 py-2">
                        <input
                          type="text"
                          value={form.catatan}
                          onChange={(e) => updateForm("catatan", e.target.value)}
                          placeholder={form.jenis === "izin" ? "Keterangan izin (opsional)..." : "Keterangan absen (opsional)..."}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* ── Floating Save Button ── */}
      {anggota.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full rounded-2xl py-3.5 text-sm font-black shadow-lg transition ${
              savedOk
                ? "bg-emerald-500 text-white"
                : "bg-purple-600 text-white hover:bg-purple-700 active:scale-95 shadow-purple-600/40"
            } disabled:opacity-60`}
          >
            {isSaving
              ? "Menyimpan..."
              : savedOk
              ? "✓ Catatan Tersimpan!"
              : `💾 Simpan Catatan — ${formatTanggal(date)}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function GuruHalaqahPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat...</div>}>
      <GuruHalaqahContent />
    </Suspense>
  );
}
