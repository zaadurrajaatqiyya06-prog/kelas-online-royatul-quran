"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { AppNavbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Users,
  ChevronRight,
  Sparkles,
  Award,
  Printer,
  FileSpreadsheet,
  GraduationCap,
  BookOpen,
  Folder,
  ArrowLeft,
  Calendar,
  Share2,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";

function WalasDashboardContent() {
  const { currentUser, tugasList, pengumpulanList, usersList, kelasList, mapelList } = useApp();

  // Tab: 'cek_walmu' (matrix checklist live walmu) | 'pengumpulan' | 'rapor'
  const [activeTab, setActiveTab] = useState<"cek_walmu" | "pengumpulan" | "rapor">("cek_walmu");
  // Mapel folder navigation in pengumpulan tab
  const [selectedMapelFolder, setSelectedMapelFolder] = useState<string | null>(null);
  const [copiedNotif, setCopiedNotif] = useState(false);

  // Default to homeroom class of logged-in user
  const kelasNama = currentUser?.kelasNama || "Kelas 6";
  const kelasId = currentUser?.kelasId || "66666666-6666-6666-6666-666666666666";
  // Slug pendek untuk URL publik: "Kelas 6" → "kelas-6"
  const kelasSlug = kelasNama.toLowerCase().replace(/\s+/g, "-");

  // ── States & Fetcher Matrix Cek Walmu ──
  const [matrixDate, setMatrixDate] = useState<string>("");

  useEffect(() => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
    setMatrixDate(today);
  }, []);

  const [matrixSelectedMapels, setMatrixSelectedMapels] = useState<string[]>([]);
  const [matrixSearch, setMatrixSearch] = useState("");
  const [matrixData, setMatrixData] = useState<any>(null);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [copiedWalmuLink, setCopiedWalmuLink] = useState(false);
  const [copiedWalmuWA, setCopiedWalmuWA] = useState(false);

  const fetchMatrix = useCallback(async () => {
    if (!kelasId) return;
    setLoadingMatrix(true);
    try {
      let url = `/api/walas/matrix-tugas?kelasId=${kelasId}&date=${matrixDate}`;
      if (matrixSelectedMapels.length > 0) {
        url += `&mapelIds=${matrixSelectedMapels.join(",")}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) setMatrixData(json);
    } catch (e) {
      console.error("Gagal load matrix walas:", e);
    } finally {
      setLoadingMatrix(false);
    }
  }, [kelasId, matrixDate, matrixSelectedMapels]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  const handleCopyWalmuLink = () => {
    const url = `${window.location.origin}/pantau/${kelasSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedWalmuLink(true);
    setTimeout(() => setCopiedWalmuLink(false), 2500);
  };

  const handleCopyWalmuWA = () => {
    if (!matrixData) return;
    const tglFormatted = new Date(`${matrixDate}T00:00:00`).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let text = `📢 *CEK PENGUMPULAN TUGAS — ${kelasNama.toUpperCase()}*\n`;
    text += `Tanggal: ${tglFormatted}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    const uncompleted = matrixData.students.filter((s: any) => !s.isAllCompleted);
    const completed = matrixData.students.filter((s: any) => s.isAllCompleted);

    text += `✅ *Sudah Lengkap Semua Mapel (${completed.length} Santri):*\n`;
    if (completed.length > 0) {
      text += completed.map((s: any, idx: number) => `${idx + 1}. ${s.nama}`).join("\n") + "\n\n";
    } else {
      text += `_Belum ada santri yang tuntas semua mapel._\n\n`;
    }

    text += `⚠️ *Belum Lengkap / Belum Kumpul (${uncompleted.length} Santri):*\n`;
    if (uncompleted.length > 0) {
      uncompleted.forEach((s: any, idx: number) => {
        const missingTasks = matrixData.tasks
          .filter((t: any) => !s.taskResults[t.id]?.submitted)
          .map((t: any) => t.mapelNama);
        text += `${idx + 1}. *${s.nama}* (Kurang: ${missingTasks.join(", ")})\n`;
      });
      text += `\n`;
    } else {
      text += `_Alhamdulillah seluruh santri sudah mengumpulkan semua tugas! 🎉_\n\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🔍 *Pantau Live Realtime Hasil Pengerjaan Ananda:*\n`;
    text += `👉 ${window.location.origin}/pantau/${kelasSlug}\n\n`;
    text += `_Mohon kerjasamanya Bapak/Ibu Wali Murid untuk mendampingi ananda. Terima kasih._\n_Wali Kelas ${kelasNama}_`;

    navigator.clipboard.writeText(text);
    setCopiedWalmuWA(true);
    setTimeout(() => setCopiedWalmuWA(false), 2500);
  };

  const handleExportMatrixCSV = () => {
    if (!matrixData || matrixData.tasks.length === 0) return;
    const headers = ["No", "NIS", "Nama Murid", ...matrixData.tasks.map((t: any) => `"${t.mapelNama}"`), "Kelengkapan"];
    const rows = matrixData.students.map((s: any, idx: number) => {
      const taskCols = matrixData.tasks.map((t: any) => s.taskResults[t.id]?.submitted ? "SUDAH" : "BELUM");
      return [
        idx + 1,
        s.nis || "-",
        `"${s.nama}"`,
        ...taskCols,
        `"${s.completedCount}/${s.totalTasks}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Cek_Tugas_${kelasNama.replace(/\s+/g, "_")}_${matrixDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Students of this homeroom class from reactive state
  const classStudents = usersList.filter(
    (u) => u.role === "murid" && u.kelasId === kelasId
  );
  const totalMuridKelas = classStudents.length || 30;

  // Filter tasks for this class
  const classTugas = tugasList.filter((t) => t.kelasId === kelasId);

  // Tasks filtered by selected mapel folder (null = all, for stats display)
  const filteredTugas = selectedMapelFolder
    ? classTugas.filter((t) => t.mapelId === selectedMapelFolder)
    : classTugas;

  // Compute stats per task
  const taskStats = filteredTugas.map((tugas) => {
    const submissions = pengumpulanList.filter((p) => p.tugasId === tugas.id);
    const sudahKumpul = submissions.length;
    const belumKumpul = Math.max(0, totalMuridKelas - sudahKumpul);

    // Graded submissions
    const graded = submissions.filter((p) => p.nilai !== undefined);
    const avgScore =
      graded.length > 0
        ? (graded.reduce((acc, curr) => acc + (curr.nilai || 0), 0) / graded.length).toFixed(1)
        : "-";

    // Find names of students who haven't submitted
    const submittedStudentIds = new Set(submissions.map((p) => p.muridId));
    const unsubmittedStudents = classStudents.filter((s) => !submittedStudentIds.has(s.id));

    return {
      tugas,
      sudahKumpul,
      belumKumpul,
      avgScore,
      unsubmittedStudents,
    };
  });

  // Calculate overall missing submissions
  const allMissingList: { mapel: string; tugasJudul: string; namaMurid: string[] }[] = [];

  taskStats.forEach((ts) => {
    if (ts.unsubmittedStudents.length > 0) {
      allMissingList.push({
        mapel: ts.tugas.mapelNama,
        tugasJudul: ts.tugas.judul,
        namaMurid: ts.unsubmittedStudents.map((s) => s.nama),
      });
    }
  });

  const totalBelumSemuaTugas = taskStats.reduce((acc, curr) => acc + curr.belumKumpul, 0);

  // ⭐ REKAP NILAI RAPOR PER SISWA (MATRIX LINTAS MAPEL OTOMATIS)
  // Ambil daftar mapel unik yang memiliki tugas / penilaian di kelas ini
  const uniqueMapelIds = Array.from(new Set(classTugas.map((t) => t.mapelId)));
  const relevantMapels = mapelList.filter((m) => uniqueMapelIds.includes(m.id));

  // Hitung nilai rapor setiap siswa untuk setiap mapel
  const studentRaporData = classStudents.map((student) => {
    const mapelScores: Record<string, { avg: number | null; count: number }> = {};
    let totalScoreSum = 0;
    let gradedMapelCount = 0;

    relevantMapels.forEach((m) => {
      // Cari semua tugas di mapel ini untuk kelas ini
      const tugasInMapel = classTugas.filter((t) => t.mapelId === m.id);
      const tugasIds = tugasInMapel.map((t) => t.id);

      // Cari nilai siswa untuk tugas-tugas ini (online + manual offline)
      const studentSubmissions = pengumpulanList.filter(
        (p) => p.muridId === student.id && tugasIds.includes(p.tugasId) && p.nilai !== undefined
      );

      if (studentSubmissions.length > 0) {
        const sum = studentSubmissions.reduce((acc, curr) => acc + (curr.nilai || 0), 0);
        const avg = Math.round(sum / studentSubmissions.length);
        mapelScores[m.id] = { avg, count: studentSubmissions.length };
        totalScoreSum += avg;
        gradedMapelCount += 1;
      } else {
        mapelScores[m.id] = { avg: null, count: 0 };
      }
    });

    const overallAvg =
      gradedMapelCount > 0 ? Math.round(totalScoreSum / gradedMapelCount) : null;

    let predikat = "-";
    let status = "Belum Ada Nilai";
    if (overallAvg !== null) {
      if (overallAvg >= 88) {
        predikat = "A (Sangat Baik)";
        status = "Tuntas";
      } else if (overallAvg >= 75) {
        predikat = "B (Baik)";
        status = "Tuntas";
      } else {
        predikat = "C (Cukup)";
        status = "Perlu Bimbingan";
      }
    }

    return {
      student,
      mapelScores,
      overallAvg,
      predikat,
      status,
    };
  });

  // Urutkan siswa berdasarkan peringkat nilai rata-rata tertinggi
  const sortedRaporData = [...studentRaporData].sort((a, b) => (b.overallAvg || 0) - (a.overallAvg || 0));

  // Hitung statistik kelas
  const studentsWithAvg = studentRaporData.filter((r) => r.overallAvg !== null);
  const classAvgScore =
    studentsWithAvg.length > 0
      ? Math.round(studentsWithAvg.reduce((acc, curr) => acc + (curr.overallAvg || 0), 0) / studentsWithAvg.length)
      : "-";

  // Copy WhatsApp Reminder Text
  const handleCopyReminder = () => {
    let text = `📢 *PENGINGAT TUGAS ${kelasNama.toUpperCase()} - ROYATUL QURAN*\n`;
    text += `Tanggal: ${new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}\n\n`;
    text += `Assalamu'alaikum wr. wb. Bapak/Ibu Wali Murid,\nBerikut daftar ananda yang belum mengumpulkan tugas:\n\n`;

    allMissingList.forEach((item, idx) => {
      text += `*${idx + 1}. ${item.mapel} — ${item.tugasJudul}*\n`;
      text += `⚠️ Belum kumpul (${item.namaMurid.length} murid): ${item.namaMurid.join(", ")}\n\n`;
    });

    text += `Mohon bantuan ananda segera mengumpulkan via aplikasi Kelas Online Royatul Quran. Terima kasih.\n_Wali Kelas ${kelasNama}_`;

    navigator.clipboard.writeText(text);
    setCopiedNotif(true);
    setTimeout(() => setCopiedNotif(false), 2500);
  };

  // Export Rekap Nilai Rapor Siswa ke Excel / CSV
  const handleExportRaporCSV = () => {
    const headers = [
      "No",
      "NIS",
      "Nama Siswa",
      ...relevantMapels.map((m) => `"${m.nama}"`),
      "Rata-rata Akhir",
      "Predikat",
      "Status Kelulusan",
    ];

    const rows = sortedRaporData.map((item, idx) => {
      const mapelVals = relevantMapels.map((m) => item.mapelScores[m.id]?.avg ?? "-");
      return [
        idx + 1,
        item.student.nis || "-",
        `"${item.student.nama}"`,
        ...mapelVals,
        item.overallAvg ?? "-",
        `"${item.predikat}"`,
        `"${item.status}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Nilai_Rapor_${kelasNama.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTugasCSV = () => {
    const headers = ["Mata Pelajaran", "Judul Tugas", "Deadline", "Sudah Kumpul", "Belum Kumpul", "Rata-rata Nilai"];
    const rows = taskStats.map((ts) => [
      ts.tugas.mapelNama,
      `"${ts.tugas.judul}"`,
      ts.tugas.deadline,
      ts.sudahKumpul,
      ts.belumKumpul,
      ts.avgScore,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Pengumpulan_Tugas_${kelasNama.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-1 flex-col pb-24">
      <AppNavbar />

      {/* Header Banner Walas */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-200 border border-emerald-500/30">
              <ShieldCheck className="h-3 w-3 text-emerald-300" />
              <span>Portal Wali Kelas</span>
            </div>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-white leading-tight">
              Rekap Semua Mapel • {kelasNama}
            </h2>
            <p className="text-xs text-emerald-300">
              Wali Kelas: {currentUser?.nama || "Ustadz Zaadurraja Atqiyya"}
            </p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs text-emerald-200">Total Siswa</span>
            <span className="text-2xl font-black text-white">{totalMuridKelas}</span>
          </div>
        </div>

        {/* Quick Stats Walas */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-sm">
            <p className="text-lg font-black text-emerald-200">{classTugas.length}</p>
            <p className="text-[10px] text-emerald-300">Total Tugas/UH</p>
          </div>

          <div className={`rounded-xl p-2.5 backdrop-blur-sm ${totalBelumSemuaTugas > 0 ? "bg-rose-500/20 border border-rose-500/30" : "bg-emerald-500/20"}`}>
            <p className={`text-lg font-black ${totalBelumSemuaTugas > 0 ? "text-rose-300" : "text-emerald-300"}`}>
              {totalBelumSemuaTugas}
            </p>
            <p className="text-[10px] text-slate-300">Belum Kumpul</p>
          </div>

          <div className="rounded-xl bg-emerald-500/20 p-2.5 backdrop-blur-sm border border-emerald-500/30">
            <p className="text-lg font-black text-emerald-300">{classAvgScore}</p>
            <p className="text-[10px] text-emerald-200">Rata² Rapor Kelas</p>
          </div>
        </div>

        {/* Top Tab Switcher */}
        <div className="mt-4 flex rounded-xl bg-emerald-950/60 p-1 border border-emerald-800/40 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("cek_walmu")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
              activeTab === "cek_walmu" ? "bg-white text-emerald-950 shadow-sm font-bold" : "text-emerald-200 hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>1. Cek Walmu (Live)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pengumpulan")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
              activeTab === "pengumpulan" ? "bg-white text-emerald-950 shadow-sm font-bold" : "text-emerald-200 hover:text-white"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span>2. Monitoring Mapel (WA)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rapor")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
              activeTab === "rapor" ? "bg-white text-emerald-950 shadow-sm font-bold" : "text-emerald-200 hover:text-white"
            }`}
          >
            <Award className="h-3.5 w-3.5 text-emerald-400" />
            <span>3. Rekap Rapor</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* ========================================================================= */}
        {/* TAB 0: CEK PENGUMPULAN TUGAS LIVE UNTUK WALI MURID (SPREADSHEET CHECKLIST) */}
        {/* ========================================================================= */}
        {activeTab === "cek_walmu" && (
          <div className="space-y-4">
            {/* Action Bar & Share to Parent Group */}
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 p-4 shadow-xs space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Realtime
                    </span>
                    <span className="text-xs font-bold text-slate-800">Cek Tugas Harian Santri</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Link publik dapat langsung dibagikan ke WhatsApp grup wali murid tanpa perlu login.
                  </p>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyWalmuLink}
                    className="flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
                  >
                    {copiedWalmuLink ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Share2 className="h-3.5 w-3.5" />}
                    <span>{copiedWalmuLink ? "Link Disalin!" : "Salin Link Walmu"}</span>
                  </button>

                  <Link
                    href={`/pantau/${kelasSlug}`}
                    target="_blank"
                    className="flex items-center gap-1 rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Lihat Halaman Walmu</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleCopyWalmuWA}
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                  >
                    {copiedWalmuWA ? <Check className="h-3.5 w-3.5 text-emerald-200" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedWalmuWA ? "Format WA Disalin!" : "Format WA Walmu"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportMatrixCSV}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    title="Export CSV"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span className="hidden sm:inline">CSV</span>
                  </button>
                </div>
              </div>

              {/* Filter controls: Tanggal & Search */}
              <div className="border-t border-emerald-100/80 pt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
                    <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-700">Tgl:</span>
                    <input
                      type="date"
                      value={matrixDate}
                      onChange={(e) => setMatrixDate(e.target.value)}
                      className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none"
                    />
                  </div>

                  {/* Button shortcut Hari Ini */}
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
                      setMatrixDate(today);
                    }}
                    className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 transition"
                  >
                    Hari Ini
                  </button>

                  <button
                    type="button"
                    onClick={() => fetchMatrix()}
                    disabled={loadingMatrix}
                    className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingMatrix ? "animate-spin text-emerald-600" : ""}`} />
                    <span>Perbarui</span>
                  </button>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari santri di tabel..."
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Active Dates Pills */}
              {matrixData?.activeDates && matrixData.activeDates.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-slate-600">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                    Pilih Tgl Tugas:
                  </span>
                  {matrixData.activeDates.slice(0, 7).map((d: string) => {
                    const isSelected = d === matrixDate;
                    const isToday = d === new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
                    const dLabel = new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    });

                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setMatrixDate(d)}
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold transition flex items-center gap-1 ${
                          isSelected
                            ? "bg-emerald-700 text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>{dLabel}</span>
                        {isToday && (
                          <span className={`text-[9px] px-1 rounded ${isSelected ? "bg-emerald-800 text-white" : "bg-emerald-100 text-emerald-800"}`}>
                            Hari ini
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Mapel Filter Chips */}
              {matrixData?.availableMapels && matrixData.availableMapels.length > 0 && (
                <div className="border-t border-emerald-100/60 pt-2.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                    <Filter className="h-3 w-3" /> Filter Mapel:
                  </span>
                  <button
                    type="button"
                    onClick={() => setMatrixSelectedMapels([])}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      matrixSelectedMapels.length === 0
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Semua ({matrixData.availableMapels.length})
                  </button>
                  {matrixData.availableMapels.map((m: any) => {
                    const isSelected = matrixSelectedMapels.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setMatrixSelectedMapels((prev: string[]) =>
                            prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                          );
                        }}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                          isSelected
                            ? "bg-emerald-700 text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {m.nama}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Spreadsheet Matrix Box */}
            <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
              <div className="bg-[#1e4b8a] text-white px-4 py-3 text-center border-b border-[#163868] flex items-center justify-between">
                <div className="w-12 hidden sm:block"></div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black tracking-wide uppercase">
                    CEK PENGUMPULAN TUGAS — {kelasNama.toUpperCase()}
                  </h3>
                  <p className="text-[10px] text-blue-200 mt-0.5">
                    {new Date(`${matrixDate}T00:00:00`).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] bg-blue-700/80 px-2 py-0.5 rounded font-mono">
                    {matrixData?.tasks?.length || 0} Mapel
                  </span>
                </div>
              </div>

              {loadingMatrix ? (
                <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                  <p>Memuat rekap matrix santri...</p>
                </div>
              ) : !matrixData || matrixData.tasks.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">Tidak ada tugas aktif pada tanggal ini.</p>
                  <p className="text-[11px] text-slate-400">
                    Kriteria: Tugas yang batas pengumpulannya masih berlaku pada tanggal ini.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#2563eb] text-white text-[11px] font-bold divide-x divide-blue-400">
                        <th className="py-2.5 px-3 bg-[#1d4ed8] min-w-[180px] sm:min-w-[220px]">
                          Nama Murid
                        </th>
                        {matrixData.tasks.map((task: any) => (
                          <th key={task.id} className="py-2.5 px-3 text-center min-w-[90px] sm:min-w-[110px]">
                            <div className="truncate font-black">{task.mapelNama}</div>
                            <div className="text-[9px] font-normal opacity-90 truncate max-w-[100px] mx-auto">
                              {task.judul}
                            </div>
                          </th>
                        ))}
                        <th className="py-2.5 px-3 text-center min-w-[80px]">Kelengkapan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {matrixData.students
                        .filter((s: any) =>
                          s.nama.toLowerCase().includes(matrixSearch.toLowerCase()) ||
                          (s.nis && s.nis.includes(matrixSearch))
                        )
                        .map((student: any, idx: number) => {
                          const rowBg = student.isNoneCompleted
                            ? "bg-[#ffe4e6] hover:bg-[#fecdd3]"
                            : idx % 2 === 0
                            ? "bg-white hover:bg-slate-50"
                            : "bg-slate-50/60 hover:bg-slate-100";

                          return (
                            <tr key={student.id} className={`${rowBg} transition divide-x divide-slate-200`}>
                              <td className="py-2.5 px-3 font-semibold text-slate-900">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 font-mono w-4 text-right">
                                    {idx + 1}.
                                  </span>
                                  <div className="truncate">
                                    <span className="font-bold text-slate-900">{student.nama}</span>
                                    {student.nis && (
                                      <span className="text-[10px] text-slate-500 block sm:inline sm:ml-1 font-mono">
                                        ({student.nis})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {matrixData.tasks.map((task: any) => {
                                const result = student.taskResults[task.id];
                                const isDone = result?.submitted;

                                return (
                                  <td
                                    key={task.id}
                                    className={`py-2 px-3 text-center font-bold ${
                                      isDone ? "bg-[#dcfce7]/60" : "bg-[#fee2e2]/60"
                                    }`}
                                  >
                                    {isDone ? (
                                      <span
                                        className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-emerald-600 text-white shadow-2xs"
                                        title={`Sudah Kumpul • Nilai: ${result.nilai ?? "-"}`}
                                      >
                                        ✓
                                      </span>
                                    ) : (
                                      <span
                                        className="inline-flex items-center justify-center h-6 w-6 rounded-lg border-2 border-rose-500 bg-white text-rose-600 font-bold"
                                        title="Belum Mengumpulkan"
                                      >
                                        ✕
                                      </span>
                                    )}
                                  </td>
                                );
                              })}

                              <td className="py-2 px-3 text-center font-bold text-[11px]">
                                <span
                                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] ${
                                    student.isAllCompleted
                                      ? "bg-emerald-100 text-emerald-800"
                                      : student.isNoneCompleted
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {student.completedCount}/{student.totalTasks}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── 3 Indicator Stats (after matrix) ── */}
            {matrixData?.summary && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 shadow-2xs">
                  <span className="text-xl sm:text-2xl font-black text-emerald-700">
                    {matrixData.summary.allCompletedCount}
                  </span>
                  <p className="text-[10px] sm:text-xs font-bold text-emerald-800">Lengkap Semua (✅)</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 shadow-2xs">
                  <span className="text-xl sm:text-2xl font-black text-amber-700">
                    {matrixData.summary.partialCount}
                  </span>
                  <p className="text-[10px] sm:text-xs font-bold text-amber-800">Kurang Sebagian</p>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 shadow-2xs">
                  <span className="text-xl sm:text-2xl font-black text-rose-700">
                    {matrixData.summary.noneCompletedCount}
                  </span>
                  <p className="text-[10px] sm:text-xs font-bold text-rose-800">Belum Kumpul (❌)</p>
                </div>
              </div>
            )}

            {/* Petunjuk & Panduan Walas */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-800">Petunjuk Wali Kelas:</p>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium text-emerald-800">
                  <span className="h-5 w-5 rounded bg-emerald-600 text-white inline-flex items-center justify-center text-[10px] font-bold">✓</span>
                  <span>Sudah Mengumpulkan</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium text-rose-800">
                  <span className="h-5 w-5 rounded border-2 border-rose-500 bg-white text-rose-600 inline-flex items-center justify-center text-[10px] font-bold">✕</span>
                  <span>Belum Mengumpulkan</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-3 w-6 rounded bg-[#ffe4e6] border border-rose-200 inline-block" />
                  <span>Baris merah muda = Belum mengumpulkan sama sekali di hari ini</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: MONITORING PENGUMPULAN TUGAS & PENGINGAT WA                        */}
        {/* ========================================================================= */}
        {activeTab === "pengumpulan" && (
          <div className="space-y-4">

            {/* ── LEVEL 0: Mapel Folder Grid (when no mapel selected) ── */}
            {!selectedMapelFolder ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Pilih Mata Pelajaran
                    </span>
                    <p className="text-[11px] text-slate-400">Klik folder untuk lihat detail tugas &amp; progress pengumpulan</p>
                  </div>
                  <button
                    onClick={handleExportTugasCSV}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition shrink-0"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Export</span>
                  </button>
                </div>

                {/* Alert WA ringkas (global) */}
                {allMissingList.length > 0 && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                      <p className="text-xs text-rose-800 font-semibold">
                        {totalBelumSemuaTugas} pengumpulan belum masuk
                      </p>
                    </div>
                    <button
                      onClick={handleCopyReminder}
                      className="flex items-center gap-1 rounded-xl bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition shrink-0"
                    >
                      {copiedNotif ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedNotif ? "Disalin!" : "Salin WA"}</span>
                    </button>
                  </div>
                )}

                {/* Mapel folder grid */}
                {relevantMapels.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                    Belum ada tugas di kelas ini. Guru belum membuat tugas.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {relevantMapels.map((m) => {
                      const mapelTugas = classTugas.filter((t) => t.mapelId === m.id);
                      const totalSubs = mapelTugas.reduce((acc, t) => acc + pengumpulanList.filter((p) => p.tugasId === t.id).length, 0);
                      const totalExpected = mapelTugas.length * totalMuridKelas;
                      const hasMissing = mapelTugas.some((t) => {
                        const subs = pengumpulanList.filter((p) => p.tugasId === t.id).length;
                        return subs < totalMuridKelas;
                      });
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMapelFolder(m.id)}
                          className={`flex flex-col items-start rounded-2xl border p-4 text-left shadow-xs transition active:scale-98 ${
                            hasMissing
                              ? "border-rose-200 bg-rose-50/60 hover:border-rose-400"
                              : "border-slate-200 bg-white hover:border-purple-400 hover:shadow-md"
                          }`}
                        >
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-2 ${
                            hasMissing ? "bg-rose-100 text-rose-700" : "bg-purple-50 text-purple-700"
                          }`}>
                            <Folder className="h-5 w-5" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">{m.nama}</h4>
                          <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{mapelTugas.length} Tugas</p>
                          {hasMissing && (
                            <span className="mt-1 text-[10px] font-bold text-rose-600">⚠️ Ada belum kumpul</span>
                          )}
                          {!hasMissing && mapelTugas.length > 0 && (
                            <span className="mt-1 text-[10px] font-bold text-emerald-700">✓ Semua kumpul</span>
                          )}
                          <span className="mt-2 text-[10px] text-purple-700 font-bold flex items-center gap-0.5 pt-1 border-t border-slate-100 w-full">
                            Buka Folder <ChevronRight className="h-3 w-3" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* ── LEVEL 1: Tugas list dalam mapel yang dipilih ── */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedMapelFolder(null)}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Semua Mapel</span>
                  </button>
                  <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-800">
                    {relevantMapels.find(m => m.id === selectedMapelFolder)?.nama}
                  </span>
                </div>

                {/* Alert WA untuk mapel ini */}
                {allMissingList.filter(x => {
                  const m = relevantMapels.find(m => m.id === selectedMapelFolder);
                  return x.mapel === m?.nama;
                }).length > 0 && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                        <p className="text-xs font-bold text-rose-900">Murid Belum Kumpul</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-[11px] text-rose-800">
                      {allMissingList
                        .filter(x => x.mapel === relevantMapels.find(m => m.id === selectedMapelFolder)?.nama)
                        .map((item, idx) => (
                          <div key={idx}>
                            <span className="font-bold">• {item.tugasJudul}:</span>{" "}
                            {item.namaMurid.join(", ")}
                          </div>
                        ))}
                    </div>
                    <button
                      onClick={handleCopyReminder}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700 transition"
                    >
                      {copiedNotif ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedNotif ? "Berhasil Disalin!" : "Salin Pesan WA Pengingat"}</span>
                    </button>
                  </div>
                )}

                {/* List tugas di mapel ini */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Daftar Tugas &amp; Penilaian
                    </h3>
                    <button
                      onClick={handleExportTugasCSV}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-500" />
                      <span>Export</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {taskStats.filter(ts => ts.tugas.mapelId === selectedMapelFolder).length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500">
                        Tidak ada tugas pada mapel ini.
                      </div>
                    ) : (
                      taskStats
                        .filter(ts => ts.tugas.mapelId === selectedMapelFolder)
                        .map(({ tugas, sudahKumpul, belumKumpul, avgScore, unsubmittedStudents }) => (
                          <div key={tugas.id} className="p-3.5 space-y-2 hover:bg-slate-50/50 transition">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400">Guru: {tugas.guruNama}</span>
                                  {tugas.isManualOffline && (
                                    <span className="rounded-md bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">Offline</span>
                                  )}
                                  {tugas.tanggalPenilaian && tugas.isManualOffline && (
                                    <span className="text-[10px] text-slate-400">{new Date(tugas.tanggalPenilaian).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                  )}
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 mt-0.5">{tugas.judul}</h4>
                              </div>
                              <Link
                                href={`/guru/tugas/${tugas.id}`}
                                className="rounded-lg p-1 text-slate-400 hover:text-purple-700 hover:bg-purple-50"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                              <div className="rounded-lg bg-emerald-50 py-1.5 px-2 border border-emerald-100">
                                <p className="text-[10px] text-emerald-800 font-medium">Sudah Kumpul</p>
                                <p className="text-sm font-black text-emerald-700">{sudahKumpul}/{totalMuridKelas}</p>
                              </div>
                              <div className={`rounded-lg py-1.5 px-2 border ${
                                belumKumpul > 0 ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-slate-50 border-slate-100 text-slate-600"
                              }`}>
                                <p className="text-[10px] font-medium">Belum Kumpul</p>
                                <p className="text-sm font-black">{belumKumpul}</p>
                              </div>
                              <div className="rounded-lg bg-slate-50 py-1.5 px-2 border border-slate-100">
                                <p className="text-[10px] text-slate-500 font-medium">Rata² Nilai</p>
                                <p className="text-sm font-black text-slate-800">{avgScore}</p>
                              </div>
                            </div>
                            {belumKumpul > 0 && (
                              <div className="rounded-lg bg-rose-50/50 px-2.5 py-1.5 text-[11px] text-rose-800 border border-rose-100/60">
                                <span className="font-semibold">⚠️ Belum:</span>{" "}
                                {unsubmittedStudents.map((s) => s.nama).join(", ")}
                              </div>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REKAP NILAI RAPOR PER SISWA (MATRIX NILAI OTOMATIS)                */}
        {/* ========================================================================= */}
        {activeTab === "rapor" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>Rekap Nilai Rapor Otomatis • {kelasNama}</span>
                </div>

                <button
                  onClick={handleExportRaporCSV}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Excel Rapor</span>
                </button>
              </div>

              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Nilai di bawah adalah rekapan otomatis dari seluruh tugas online dan ulangan tatap muka (offline) yang telah diinput oleh para guru. Siap disalin langsung ke lembar rapot siswa!
              </p>
            </div>

            {/* Matrix Table View */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Buku Nilai & Rapor Siswa
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {sortedRaporData.length} Murid terdaftar di {kelasNama}
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  <span>Cetak</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-700">
                      <th className="p-3 text-center w-10">No</th>
                      <th className="p-3 min-w-[140px]">Nama Siswa</th>
                      <th className="p-3 text-center min-w-[70px]">NIS</th>
                      {relevantMapels.map((m) => (
                        <th key={m.id} className="p-3 text-center min-w-[90px] whitespace-nowrap">
                          {m.nama}
                        </th>
                      ))}
                      <th className="p-3 text-center min-w-[90px] bg-emerald-50 text-emerald-950">
                        Rata² Akhir
                      </th>
                      <th className="p-3 text-center min-w-[100px]">Predikat</th>
                      <th className="p-3 text-center min-w-[100px]">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs">
                    {sortedRaporData.map(({ student, mapelScores, overallAvg, predikat, status }, idx) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">
                          <div className="truncate max-w-[160px]">{student.nama}</div>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-600">{student.nis || "-"}</td>

                        {/* Nilai per Mata Pelajaran */}
                        {relevantMapels.map((m) => {
                          const score = mapelScores[m.id]?.avg;
                          return (
                            <td key={m.id} className="p-3 text-center font-semibold">
                              {score !== null && score !== undefined ? (
                                <span
                                  className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${
                                    score >= 85
                                      ? "text-emerald-700 bg-emerald-50"
                                      : score >= 75
                                      ? "text-blue-700 bg-blue-50"
                                      : "text-rose-700 bg-rose-50"
                                  }`}
                                >
                                  {score}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Nilai Rata-rata Gabungan */}
                        <td className="p-3 text-center font-black bg-emerald-50/50">
                          {overallAvg !== null ? (
                            <span className="text-emerald-800 font-extrabold text-sm">{overallAvg}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Predikat */}
                        <td className="p-3 text-center font-medium text-slate-700">{predikat}</td>

                        {/* Status Ketuntasan */}
                        <td className="p-3 text-center">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              status === "Tuntas"
                                ? "bg-emerald-100 text-emerald-800"
                                : status === "Perlu Bimbingan"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function WalasDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100 text-xs text-slate-500">
          Memuat portal wali kelas...
        </div>
      }
    >
      <WalasDashboardContent />
    </Suspense>
  );
}
