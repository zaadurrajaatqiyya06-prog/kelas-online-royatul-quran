"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Share2,
  Copy,
  Check,
  GraduationCap,
  BookOpen,
  Filter,
  ChevronDown,
  Users,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface TaskItem {
  id: string;
  judul: string;
  jenis: string;
  deadline: string;
  mapelId: string;
  mapelNama: string;
  mapelKode: string;
}

interface StudentItem {
  id: string;
  nama: string;
  nis?: string | null;
  fotoUrl?: string | null;
  taskResults: Record<string, {
    submitted: boolean;
    status: string;
    nilai?: number | null;
    waktuSubmit?: string | null;
    fileUrl?: string | null;
  }>;
  completedCount: number;
  totalTasks: number;
  isAllCompleted: boolean;
  isNoneCompleted: boolean;
}

interface MatrixData {
  kelas: { id: string; nama: string };
  targetDate: string;
  activeDates?: string[];
  availableMapels: { id: string; nama: string; kode?: string }[];
  tasks: TaskItem[];
  students: StudentItem[];
  summary: {
    totalStudents: number;
    totalTasks: number;
    allCompletedCount: number;
    noneCompletedCount: number;
    partialCount: number;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", opts || {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function todayWIB() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

// ── Avatar initials ───────────────────────────────────────────────────────────

function AvatarInitials({ name, size = 32 }: { name: string; size?: number }) {
  const parts = name.trim().split(" ");
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : parts[0][0] || "?";
  const colors = [
    "from-emerald-500 to-teal-600",
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-orange-500 to-amber-600",
    "from-rose-500 to-pink-600",
    "from-indigo-500 to-blue-600",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br ${color} text-white font-bold uppercase shrink-0 select-none`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

// ── Main Content Component ────────────────────────────────────────────────────

function PantauTugasWalmuContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const kelasId = params?.kelasId as string;

  // Baca ?date= dari URL. Jika ada → mode Rekap Khusus (terkunci).
  // Jika tidak ada → mode Universal (selalu hari ini, live).
  const presetDate = searchParams?.get("date") || null;
  const isPresetMode = !!presetDate;

  const [date, setDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (presetDate) {
      setDate(presetDate);
    } else {
      setDate(todayWIB());
    }
  }, [presetDate]);

  const [selectedMapelIds, setSelectedMapelIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<MatrixData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!kelasId || !date) return;
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      let url = `/api/walas/matrix-tugas?kelasId=${kelasId}&date=${date}`;
      if (selectedMapelIds.length > 0) {
        url += `&mapelIds=${selectedMapelIds.join(",")}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (err) {
      console.error("Gagal memuat data pantau walmu:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [kelasId, date, selectedMapelIds]);

  useEffect(() => {
    if (date) fetchData();
  }, [fetchData, date]);

  // Auto-refresh tiap 30 detik (mode Universal maupun Preset)
  useEffect(() => {
    const timer = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const handleToggleMapel = (mapelId: string) => {
    setSelectedMapelIds((prev) =>
      prev.includes(mapelId) ? prev.filter((id) => id !== mapelId) : [...prev, mapelId]
    );
  };

  // Salin link universal (tanpa parameter tanggal)
  const handleCopyLink = () => {
    const universalUrl = `${window.location.origin}${window.location.pathname}`;
    navigator.clipboard.writeText(universalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filteredStudents = (data?.students || []).filter((s) =>
    s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.nis && s.nis.includes(searchTerm))
  );

  const today = todayWIB();

  // ── Skeleton loading ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-32 rounded bg-slate-200 animate-pulse" />
            <div className="h-4 w-52 rounded bg-slate-100 animate-pulse" />
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 text-emerald-500 animate-spin" />
          </div>
          <p className="text-sm font-medium text-slate-500">Memuat data pengumpulan tugas…</p>
        </main>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans" style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}>

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            {/* Branding */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 truncate">
                  Royatul Qur'an Digital · Portal Wali Murid
                </p>
                <h1 className="text-sm font-extrabold sm:text-base truncate text-slate-900">
                  Pantau Tugas {data?.kelas.nama || "Kelas"}
                </h1>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Mode Badge: Live Universal vs Rekap Preset */}
              {isPresetMode ? (
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                  <Calendar className="h-3 w-3" />
                  {date ? formatDate(date, { day: "numeric", month: "short" }) : "Rekap"}
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Hari Ini
                </span>
              )}

              <button
                type="button"
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition disabled:opacity-40"
                title="Refresh data"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  copiedLink
                    ? "bg-emerald-500 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{copiedLink ? "Disalin!" : "Bagikan"}</span>
              </button>
            </div>
          </div>

          {/* Banner Mode Info */}
          {isPresetMode ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2">
              <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <p className="text-xs font-semibold text-blue-700">
                📅 Rekap Tugas: {date ? formatDate(date) : ""}
              </p>
              <span className="ml-auto text-[10px] text-blue-500 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                Update Otomatis
              </span>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <p className="text-xs font-semibold text-emerald-700">
                🟢 Pantauan Live Tugas Hari Ini — Update Otomatis Setiap 30 Detik
              </p>
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <main className="mx-auto max-w-4xl px-3 py-5 sm:px-5 space-y-4">

        {/* ── SEARCH BAR — PROMINENTLY AT TOP ── */}
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nama santri atau NIS…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── FILTER PANEL ── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Baris atas: info tanggal aktif + accordion Lihat Hari Lain */}
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Badge tanggal aktif — read only, tidak bisa di-klik walmu */}
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-800">
                  {date ? formatDate(date, { weekday: "short", day: "numeric", month: "short" }) : "Memuat…"}
                </span>
              </div>
              {!isPresetMode && date !== today && (
                <button
                  type="button"
                  onClick={() => setDate(today)}
                  className="rounded-xl border border-emerald-400 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                >
                  Hari Ini
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Tombol Lihat Hari Lain (accordion date picker tersembunyi) */}
              <button
                type="button"
                onClick={() => setShowDatePicker((v) => !v)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
                  showDatePicker
                    ? "bg-slate-200 text-slate-700"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                title="Lihat tugas hari lain"
              >
                <Calendar className="h-3 w-3" />
                <span className="hidden sm:inline text-[10px]">Hari Lain</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showDatePicker ? "rotate-180" : ""}`} />
              </button>
              {/* Tombol Filter Mapel */}
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition"
              >
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filter</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                {selectedMapelIds.length > 0 && (
                  <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-black text-white">
                    {selectedMapelIds.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Accordion: Date Picker Lihat Hari Lain */}
          {showDatePicker && (
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lihat hari lain:</span>
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setShowDatePicker(false); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => { setDate(today); setShowDatePicker(false); }}
                className="rounded-xl border border-emerald-400 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
              >
                Kembali ke Hari Ini
              </button>
            </div>
          )}

          {/* Active Date Pills */}
          {data?.activeDates && data.activeDates.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap border-t border-slate-100 px-4 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">Tanggal aktif:</span>
              {data.activeDates.slice(0, 10).map((d) => {
                const isSelected = d === date;
                const isToday = d === today;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDate(d)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold transition ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  >
                    {new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    {isToday && (
                      <span className={`rounded text-[9px] px-1 font-black ${isSelected ? "bg-emerald-700 text-emerald-200" : "bg-emerald-100 text-emerald-700"}`}>
                        Hari ini
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Mapel Chips (collapsible) */}
          {showFilters && data?.availableMapels && data.availableMapels.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedMapelIds([])}
                  className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                    selectedMapelIds.length === 0
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Semua Mapel
                </button>
                {data.availableMapels.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleToggleMapel(m.id)}
                    className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                      selectedMapelIds.includes(m.id)
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {m.kode || m.nama}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── STAT CARDS ── */}
        {data?.summary && data.tasks.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 leading-none">
                {data.summary.allCompletedCount}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs font-semibold text-emerald-800">Tuntas Semua</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-amber-700 leading-none">
                {data.summary.partialCount}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs font-semibold text-amber-800">Sebagian</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertCircle className="h-4 w-4 text-rose-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-rose-700 leading-none">
                {data.summary.noneCompletedCount}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs font-semibold text-rose-800">Belum Kumpul</p>
            </div>
          </div>
        )}

        {/* ── TABEL MATRIX ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Table header bar */}
          <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">
                {data?.kelas.nama || "Kelas"} — Cek Pengumpulan Tugas
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">{date ? formatDate(date) : ""}</p>
            </div>
            {searchTerm && (
              <span className="rounded-full bg-emerald-600/20 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                {filteredStudents.length} hasil
              </span>
            )}
          </div>

          {/* Empty state: no tasks */}
          {!data || data.tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <BookOpen className="h-7 w-7 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Tidak ada tugas aktif</p>
                <p className="mt-1 text-xs text-slate-500">
                  Tidak ada tugas yang aktif pada tanggal ini.<br />Pilih tanggal lain di atas.
                </p>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Users className="h-7 w-7 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Santri tidak ditemukan</p>
                <p className="mt-1 text-xs text-slate-500">
                  Tidak ada nama yang cocok dengan "<strong>{searchTerm}</strong>"
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                {/* Thead */}
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="py-3 px-3 text-left text-[11px] font-bold text-slate-600 min-w-[180px] sticky left-0 bg-slate-50 border-r border-slate-200">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Santri ({filteredStudents.length})
                      </div>
                    </th>
                    {data.tasks.map((task) => (
                      <th key={task.id} className="py-3 px-2 text-center text-[10px] font-bold text-slate-700 min-w-[90px] border-r border-slate-100 last:border-r-0">
                        <span className="inline-block rounded-lg bg-emerald-100 px-2 py-0.5 text-emerald-800 font-black uppercase tracking-wide">
                          {task.mapelKode || task.mapelNama.slice(0, 5)}
                        </span>
                        <div className="mt-1 text-[9px] font-normal text-slate-500 line-clamp-2 max-w-[80px] mx-auto leading-tight">
                          {task.judul}
                        </div>
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center text-[11px] font-bold text-slate-600 min-w-[76px]">
                      Progress
                    </th>
                  </tr>
                </thead>

                {/* Tbody */}
                <tbody>
                  {filteredStudents.map((student, idx) => {
                    const pct = student.totalTasks > 0
                      ? Math.round((student.completedCount / student.totalTasks) * 100)
                      : 0;
                    const rowClass = student.isNoneCompleted
                      ? "bg-rose-50/70 hover:bg-rose-50"
                      : student.isAllCompleted
                      ? "bg-emerald-50/40 hover:bg-emerald-50/60"
                      : idx % 2 === 0
                      ? "bg-white hover:bg-slate-50"
                      : "bg-slate-50/50 hover:bg-slate-100/50";

                    return (
                      <tr key={student.id} className={`${rowClass} border-b border-slate-100 last:border-b-0 transition-colors`}>
                        {/* Nama Santri */}
                        <td className="py-2.5 px-3 sticky left-0 border-r border-slate-100" style={{ background: "inherit" }}>
                          <div className="flex items-center gap-2">
                            <AvatarInitials name={student.nama} size={28} />
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 text-xs truncate block">
                                {student.nama}
                              </span>
                              {student.nis && (
                                <span className="text-[10px] text-slate-400 font-mono">{student.nis}</span>
                              )}
                            </div>
                            {student.isAllCompleted && (
                              <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-auto" />
                            )}
                          </div>
                        </td>

                        {/* Status per tugas */}
                        {data.tasks.map((task) => {
                          const result = student.taskResults[task.id];
                          const isDone = result?.submitted;
                          return (
                            <td key={task.id} className="py-2.5 px-2 text-center border-r border-slate-100 last:border-r-0">
                              {isDone ? (
                                <span
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm mx-auto"
                                  title="Sudah Mengumpulkan"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </span>
                              ) : (
                                <span
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-xl border-2 border-rose-300 bg-rose-50 text-rose-500 mx-auto"
                                  title="Belum Mengumpulkan"
                                >
                                  <XCircle className="h-4 w-4" />
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Progress bar */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-[11px] font-black ${
                              pct === 100 ? "text-emerald-700" : pct === 0 ? "text-rose-600" : "text-amber-700"
                            }`}>
                              {student.completedCount}/{student.totalTasks}
                            </span>
                            <div className="h-1.5 w-12 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct === 100 ? "bg-emerald-500" : pct === 0 ? "bg-rose-400" : "bg-amber-500"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── LEGENDA ── */}
        {data && data.tasks.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-[11px] font-bold text-slate-600 mb-2">Keterangan:</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                Sudah mengumpulkan
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl border-2 border-rose-300 bg-rose-50 text-rose-500">
                  <XCircle className="h-3.5 w-3.5" />
                </span>
                Belum mengumpulkan
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="h-4 w-8 rounded bg-rose-50 border border-rose-200 inline-block" />
                Baris merah = belum tuntas semua
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-600">
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                Tuntas semua tugas hari ini
              </span>
            </div>
            <p className="mt-2.5 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
              Halaman ini terperbarui otomatis setiap 30 detik secara realtime dari sistem Kelas Online Royatul Qur'an.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Page Export ───────────────────────────────────────────────────────────────

export default function PantauTugasWalmuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin" />
            </div>
            <p className="text-sm font-medium text-slate-500">Memuat portal wali murid…</p>
          </div>
        </div>
      }
    >
      <PantauTugasWalmuContent />
    </Suspense>
  );
}
