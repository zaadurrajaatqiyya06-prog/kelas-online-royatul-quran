"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { AppNavbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Kelas, Tugas } from "@/lib/mock-data";
import { SandwichActionMenu } from "@/components/ui/SandwichActionMenu";
import {
  PlusCircle,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Folder,
  FolderOpen,
  ArrowLeft,
  FileEdit,
  BookOpen,
  Sparkles,
  X,
  Save,
  Award,
  Layers,
  Home,
  Download,
  Calendar,
  FileText,
  User as UserIcon,
  Trash2,
  XCircle,
} from "lucide-react";

export default function GuruDashboard() {
  const { currentUser, tugasList, pengumpulanList, usersList, kelasList, mapelList, assignmentList, inputNilaiManualBatch, tolakTugas, deleteTugas, deletePengumpulan } = useApp();

  // Navigation hierarchy state:
  // Level 0: selectedJenjang (jenjang/tingkat folder)
  // Level 1: selectedKelasId (rombel folder, if parallel classes)
  // Level 2: selectedMapelId (mapel folder)
  // Level 3: selectedTugasId (tugas detail: submissions + download rekap)
  const [selectedJenjang, setSelectedJenjang] = useState<number | null>(null);
  const [selectedKelasId, setSelectedKelasId] = useState<string | null>(null);
  const [selectedMapelId, setSelectedMapelId] = useState<string | null>(null);
  const [selectedTugasId, setSelectedTugasId] = useState<string | null>(null);

  // Modal Input Nilai Manual (Offline) State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualKelasId, setManualKelasId] = useState<string>("");
  const [manualMapelId, setManualMapelId] = useState<string>("");
  const [manualJudul, setManualJudul] = useState("");
  const [manualTanggal, setManualTanggal] = useState("");
  const [manualNilaiScores, setManualNilaiScores] = useState<Record<string, { nilai: number; catatan: string }>>({})

  // Modal Tolak Tugas State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectPengumpulanId, setRejectPengumpulanId] = useState("");
  const [rejectAlasan, setRejectAlasan] = useState("");;

  if (!currentUser) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-slate-600">Silakan login sebagai guru atau wali kelas.</p>
        <Link href="/login" className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">
          Masuk
        </Link>
      </div>
    );
  }

  // Ambil penugasan guru yang disetting oleh admin
  const teacherAssignments = (assignmentList || []).filter((a: any) => a.guruId === currentUser.id);
  const assignments = teacherAssignments.length > 0
    ? teacherAssignments
    : (assignmentList && assignmentList.length > 0)
    ? assignmentList.slice(0, 3)
    : [
        { id: "def-1", guruId: currentUser.id, guruNama: currentUser.nama, mapelId: "m-arab", mapelNama: "Bahasa Arab", kelasId: "k-6", kelasNama: "Kelas 6" },
        { id: "def-2", guruId: currentUser.id, guruNama: currentUser.nama, mapelId: "m-tahfidz", mapelNama: "Tahfidz & Tajwid", kelasId: "k-6", kelasNama: "Kelas 6" },
      ];

  // Daftar unik kelas yang diajar oleh guru ini
  const uniqueKelasIds = Array.from(new Set(assignments.map((a) => a.kelasId)));
  const guruClasses = kelasList.filter((k) => uniqueKelasIds.includes(k.id));

  // Kelompokkan kelas yang diajar berdasarkan Jenjang (tingkat: 1, 2, 3, 5, 6, dsb.)
  const jenjangMap = new Map<number, Kelas[]>();
  guruClasses.forEach((k) => {
    const list = jenjangMap.get(k.tingkat) || [];
    list.push(k);
    jenjangMap.set(k.tingkat, list);
  });
  const jenjangList = Array.from(jenjangMap.entries()).sort((a, b) => a[0] - b[0]);

  // Kelas dalam jenjang yang sedang dipilih
  const classesInSelectedJenjang = selectedJenjang !== null ? jenjangMap.get(selectedJenjang) || [] : [];

  // Kelas yang sedang dibuka saat ini
  const currentOpenKelas = kelasList.find((k) => k.id === selectedKelasId);

  // Mapel yang diajar di kelas yang sedang dibuka
  const mapelInCurrentKelas = assignments.filter((a) => a.kelasId === selectedKelasId);

  // Students of selected kelas (for Level 3 download rekap)
  const classStudents = selectedKelasId
    ? usersList.filter((u) => u.role === "murid" && u.kelasId === selectedKelasId)
    : [];

  // Tugas in selected mapel (Level 2 → Level 3)
  const tugasInSelectedMapel = selectedKelasId && selectedMapelId
    ? tugasList.filter((t) => t.kelasId === selectedKelasId && t.mapelId === selectedMapelId)
    : [];

  // Selected tugas detail (Level 3 view)
  const currentViewTugas = selectedTugasId ? tugasList.find((t) => t.id === selectedTugasId) : null;
  const submissionsForViewTugas = selectedTugasId
    ? pengumpulanList.filter((p) => p.tugasId === selectedTugasId)
    : [];

  // ── Navigation Handlers ──────────────────────────────────────────────────────
  const handleResetToRoot = () => {
    setSelectedJenjang(null);
    setSelectedKelasId(null);
    setSelectedMapelId(null);
    setSelectedTugasId(null);
  };

  const handleBackToJenjangSubfolders = () => {
    setSelectedKelasId(null);
    setSelectedMapelId(null);
    setSelectedTugasId(null);
  };

  const handleBackToMapelList = () => {
    setSelectedMapelId(null);
    setSelectedTugasId(null);
  };

  const handleBackToTugasList = () => {
    setSelectedTugasId(null);
  };

  const handleSelectJenjangFolder = (tingkat: number, classes: Kelas[]) => {
    if (classes.length > 1) {
      setSelectedJenjang(tingkat);
      setSelectedKelasId(null);
    } else if (classes.length === 1) {
      setSelectedJenjang(tingkat);
      setSelectedKelasId(classes[0].id);
    }
    setSelectedMapelId(null);
    setSelectedTugasId(null);
  };

  // ── Download Rekap Nilai CSV ─────────────────────────────────────────────────
  const handleDownloadRekapNilai = () => {
    if (!currentViewTugas || !selectedKelasId) return;
    const students = usersList.filter((u) => u.role === "murid" && u.kelasId === selectedKelasId);
    const csvHeader = "No,NIS,Nama Siswa,Nilai,Catatan,Status,Waktu Submit\n";
    const rows = students.map((s, idx) => {
      const sub = submissionsForViewTugas.find((p) => p.muridId === s.id);
      return [
        idx + 1,
        s.nis || "-",
        `"${s.nama}"`,
        sub?.nilai ?? "-",
        `"${sub?.catatanGuru || "-"}"`,
        sub ? sub.status : "belum",
        sub?.waktuSubmit
          ? new Date(sub.waktuSubmit).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
          : "-",
      ].join(",");
    }).join("\n");

    const blob = new Blob([csvHeader + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Rekap_${currentViewTugas.mapelNama}_${currentViewTugas.judul.slice(0, 20).replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Manual Grade Modal ───────────────────────────────────────────────────────
  const handleOpenManualModal = (preselectedKelasId?: string, preselectedMapelId?: string) => {
    const kId = preselectedKelasId || assignments[0]?.kelasId || "k-6";
    const mId = preselectedMapelId || assignments.find((a) => a.kelasId === kId)?.mapelId || assignments[0]?.mapelId;

    setManualKelasId(kId);
    setManualMapelId(mId);
    setManualJudul("Ulangan Harian Tatap Muka (Offline)");
    setManualTanggal(new Date().toISOString().split("T")[0]);

    const students = usersList.filter((u) => u.role === "murid" && u.kelasId === kId);
    const initialScores: Record<string, { nilai: number; catatan: string }> = {};
    students.forEach((s) => {
      initialScores[s.id] = { nilai: 85, catatan: "Tuntas" };
    });

    setManualNilaiScores(initialScores);
    setIsManualModalOpen(true);
  };

  const handleSaveManualGrades = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualJudul.trim()) {
      alert("Masukkan judul penilaian atau ulangan.");
      return;
    }

    const targetK = kelasList.find((k) => k.id === manualKelasId);
    const targetM = assignments.find((a) => a.mapelId === manualMapelId);
    const students = usersList.filter((u) => u.role === "murid" && u.kelasId === manualKelasId);

    const nilaiList = students.map((s) => ({
      muridId: s.id,
      muridNama: s.nama,
      muridNis: s.nis || "-",
      nilai: manualNilaiScores[s.id]?.nilai ?? 80,
      catatan: manualNilaiScores[s.id]?.catatan || "Tugas Offline",
    }));

    inputNilaiManualBatch({
      kelasId: manualKelasId,
      kelasNama: targetK?.nama || "Kelas",
      mapelId: manualMapelId,
      mapelNama: targetM?.mapelNama || "Mata Pelajaran",
      judulTugas: manualJudul.trim(),
      tanggalPenilaian: manualTanggal,
      nilaiList,
    });

    setIsManualModalOpen(false);
    alert(`Nilai manual untuk ${students.length} murid berhasil disimpan dan otomatis masuk ke rekap rapor Wali Kelas!`);
  };

  // ── Helper ───────────────────────────────────────────────────────────────────
  const getNilaiColor = (nilai: number) => {
    if (nilai >= 88) return "text-emerald-700 bg-emerald-50";
    if (nilai >= 75) return "text-blue-700 bg-blue-50";
    return "text-rose-700 bg-rose-50";
  };

  const handleOpenReject = (pengumpulanId: string) => {
    setRejectPengumpulanId(pengumpulanId);
    setRejectAlasan("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!rejectAlasan.trim()) {
      alert("Masukkan alasan penolakan terlebih dahulu.");
      return;
    }
    tolakTugas(rejectPengumpulanId, rejectAlasan);
    setIsRejectModalOpen(false);
    setRejectPengumpulanId("");
    setRejectAlasan("");
  };

  const handleDeleteTugas = (tugasId: string, judulTugas: string) => {
    if (confirm(`Hapus tugas "${judulTugas}" beserta semua jawaban murid? Tindakan ini tidak dapat dibatalkan.`)) {
      deleteTugas(tugasId);
      setSelectedTugasId(null);
    }
  };

  const handleDeletePengumpulan = (pengumpulanId: string, muridNama: string) => {
    if (confirm(`Hapus jawaban dari ${muridNama}? Data ini tidak dapat dikembalikan.`)) {
      deletePengumpulan(pengumpulanId);
    }
  };

  return (
    <div className="flex flex-1 flex-col pb-24">
      <AppNavbar />

      {/* Header Banner Guru */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
              {currentUser.role === "walas" ? "Wali Kelas & Guru" : "Guru"}
            </span>
            <h2 className="mt-1 text-base font-bold tracking-tight text-white">{currentUser.nama}</h2>
            <p className="text-xs text-slate-400">NIP: {currentUser.nip || "2001"}</p>
          </div>

          {/* Sandwich Action Menu — Tindakan Guru */}
          <SandwichActionMenu
            label="Tindakan"
            align="right"
            className="text-white"
            items={[
              {
                key: "buat_tugas",
                label: "Buat Tugas Baru",
                icon: "📝",
                onClick: () => (window.location.href = "/guru/tugas/baru"),
              },
              {
                key: "input_nilai",
                label: "Input Nilai Manual (Offline)",
                icon: "✏️",
                onClick: () => handleOpenManualModal(selectedKelasId || undefined, selectedMapelId || undefined),
                divider: true,
              },
              {
                key: "unduh_rekap",
                label: selectedTugasId ? "Unduh Rekap Nilai Tugas" : "Unduh Rekap (Pilih Tugas Dulu)",
                icon: "📥",
                disabled: !selectedTugasId,
                onClick: handleDownloadRekapNilai,
                divider: true,
              },
              {
                key: "halaqah",
                label: "Halaqah Al-Qur'an Saya",
                icon: "📖",
                onClick: () => (window.location.href = "/guru/halaqah"),
              },
            ]}
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* ⭐ BREADCRUMB NAVIGASI FOLDER */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1 px-1 text-slate-600">
          <button
            onClick={handleResetToRoot}
            className={`flex items-center gap-1 hover:text-emerald-700 transition font-semibold ${
              selectedJenjang === null ? "text-emerald-700 font-bold" : "text-slate-500"
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            <span>Semua Jenjang</span>
          </button>

          {selectedJenjang !== null && (
            <>
              <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
              <button
                onClick={() => {
                  if (classesInSelectedJenjang.length > 1) handleBackToJenjangSubfolders();
                  else handleResetToRoot();
                }}
                className={`hover:text-emerald-700 transition font-semibold whitespace-nowrap ${
                  selectedKelasId === null ? "text-emerald-700 font-bold" : "text-slate-500"
                }`}
              >
                Kelas {selectedJenjang}
              </button>
            </>
          )}

          {selectedKelasId !== null && currentOpenKelas && classesInSelectedJenjang.length > 1 && (
            <>
              <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
              <button
                onClick={handleBackToMapelList}
                className={`hover:text-emerald-700 transition font-semibold whitespace-nowrap ${
                  !selectedMapelId ? "text-emerald-700 font-bold" : "text-slate-500"
                }`}
              >
                {currentOpenKelas.nama}
              </button>
            </>
          )}

          {selectedMapelId !== null && (
            <>
              <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
              <button
                onClick={handleBackToTugasList}
                className={`hover:text-emerald-700 transition font-semibold whitespace-nowrap ${
                  !selectedTugasId ? "text-emerald-700 font-bold" : "text-slate-500"
                }`}
              >
                {mapelInCurrentKelas.find((m) => m.mapelId === selectedMapelId)?.mapelNama}
              </button>
            </>
          )}

          {selectedTugasId !== null && currentViewTugas && (
            <>
              <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="text-emerald-800 font-bold truncate max-w-[120px]">
                {currentViewTugas.judul}
              </span>
            </>
          )}
        </div>

        {/* ===================================================================== */}
        {/* ⭐ LEVEL 0: FOLDER JENJANG                                             */}
        {/* ===================================================================== */}
        {selectedJenjang === null && (
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Folder Utama Jenjang ({jenjangList.length} Jenjang)
              </h3>
              <p className="text-[11px] text-slate-400">Folder otomatis dikelompokkan per jenjang dari penugasan Admin</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {jenjangList.map(([tingkat, classes]) => {
                const mapelInJenjang = assignments.filter((a) =>
                  classes.some((c) => c.id === a.kelasId)
                );
                const uniqueMapelNames = Array.from(new Set(mapelInJenjang.map((m) => m.mapelNama)));
                const tugasInJenjang = tugasList.filter((t) =>
                  classes.some((c) => c.id === t.kelasId)
                );
                const hasSubClasses = classes.length > 1;

                return (
                  <button
                    key={tingkat}
                    onClick={() => handleSelectJenjangFolder(tingkat, classes)}
                    className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs hover:border-emerald-500 hover:shadow-md transition active:scale-98"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 mb-2.5">
                      <Folder className="h-6 w-6" />
                    </div>

                    <div className="w-full">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                        Jenjang Tingkat {tingkat}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        Kelas {tingkat}
                      </h4>
                    </div>

                    <div className="mt-2 space-y-1 text-xs w-full">
                      {hasSubClasses ? (
                        <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200/60">
                          {classes.length} Rombel: {classes.map((c) => c.nama.replace("Kelas ", "")).join(", ")}
                        </span>
                      ) : (
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Kelas Tunggal
                        </span>
                      )}
                      <p className="text-slate-500 text-[11px] truncate">{uniqueMapelNames.join(", ")}</p>
                      <p className="text-slate-400 text-[10px]">{tugasInJenjang.length} Tugas Dikelola</p>
                    </div>

                    <span className="mt-3 text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 pt-1 border-t border-slate-100 w-full">
                      {hasSubClasses ? "Buka Rombel Kelas ➜" : "Buka Mapel Langsung ➜"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* ⭐ LEVEL 1: SUB-KELAS (ROMBEL A, B, C) — jika jenjang punya paralel   */}
        {/* ===================================================================== */}
        {selectedJenjang !== null && selectedKelasId === null && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={handleResetToRoot}
                className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Semua Jenjang</span>
              </button>
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                Jenjang Kelas {selectedJenjang}
              </span>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pilih Rombongan Belajar:</h3>
              <p className="text-[11px] text-slate-400">Pilih salah satu kelas untuk melihat mata pelajaran dan tugas</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {classesInSelectedJenjang.map((k) => {
                const mapelsDiKelas = assignments.filter((a) => a.kelasId === k.id);
                const tugasDiKelas = tugasList.filter((t) => t.kelasId === k.id);
                return (
                  <button
                    key={k.id}
                    onClick={() => {
                      setSelectedKelasId(k.id);
                      setSelectedMapelId(null);
                      setSelectedTugasId(null);
                    }}
                    className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs hover:border-emerald-500 hover:shadow-md transition active:scale-98"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 mb-2">
                      <Folder className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">{k.nama}</h4>
                    <div className="mt-1 space-y-0.5 text-xs">
                      <p className="text-blue-700 font-semibold text-[11px]">
                        {mapelsDiKelas.map((m) => m.mapelNama).join(", ")}
                      </p>
                      <p className="text-slate-400 text-[10px]">{tugasDiKelas.length} Tugas Dikelola</p>
                    </div>
                    <span className="mt-2 text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                      Buka Mapel <ChevronRight className="h-3 w-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* ⭐ LEVEL 2: MAPEL FOLDERS DALAM KELAS                                 */}
        {/* ===================================================================== */}
        {selectedKelasId !== null && currentOpenKelas && !selectedMapelId && !selectedTugasId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={() => {
                  if (classesInSelectedJenjang.length > 1) handleBackToJenjangSubfolders();
                  else handleResetToRoot();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>
                  {classesInSelectedJenjang.length > 1 ? `Rombel Kelas ${selectedJenjang}` : "Semua Jenjang"}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenManualModal(selectedKelasId)}
                  className="flex items-center gap-1 rounded-xl bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-2xs"
                >
                  <FileEdit className="h-3.5 w-3.5" />
                  <span>Nilai Offline</span>
                </button>
                <Link
                  href="/guru/tugas/baru"
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>+ Tugas</span>
                </Link>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Mata Pelajaran</span>
              <h3 className="text-base font-bold text-slate-900">{currentOpenKelas.nama}</h3>
              <p className="text-[11px] text-slate-500">{mapelInCurrentKelas.length} Mata Pelajaran — Klik folder untuk lihat tugas</p>
            </div>

            {mapelInCurrentKelas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                Guru belum ditetapkan ke mapel apapun di kelas ini. Hubungi Admin.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {mapelInCurrentKelas.map((m) => {
                  const tugasCount = tugasList.filter(
                    (t) => t.kelasId === selectedKelasId && t.mapelId === m.mapelId
                  ).length;
                  return (
                    <button
                      key={m.mapelId}
                      onClick={() => {
                        setSelectedMapelId(m.mapelId);
                        setSelectedTugasId(null);
                      }}
                      className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs hover:border-emerald-500 hover:shadow-md transition active:scale-98"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 mb-2">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">{m.mapelNama}</h4>
                      <p className="mt-1 text-[11px] text-slate-500 font-semibold">{tugasCount} Tugas</p>
                      <span className="mt-2 text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 pt-1 border-t border-slate-100 w-full">
                        Buka Daftar Tugas <ChevronRight className="h-3 w-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* ⭐ LEVEL 3: TUGAS LIST DALAM MAPEL YANG DIPILIH                        */}
        {/* ===================================================================== */}
        {selectedKelasId !== null && selectedMapelId !== null && !selectedTugasId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={handleBackToMapelList}
                className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali ke Mapel</span>
              </button>
              <Link
                href="/guru/tugas/baru"
                className="flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>+ Buat Tugas</span>
              </Link>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                {mapelInCurrentKelas.find((m) => m.mapelId === selectedMapelId)?.mapelNama}
              </span>
              <h3 className="text-base font-bold text-slate-900">{currentOpenKelas?.nama}</h3>
              <p className="text-[11px] text-slate-500">{tugasInSelectedMapel.length} Tugas — Klik folder untuk lihat jawaban murid</p>
            </div>

            {tugasInSelectedMapel.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-2">
                <Folder className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-400">Belum ada tugas untuk mapel ini.</p>
                <Link
                  href="/guru/tugas/baru"
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Buat Tugas Pertama
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {tugasInSelectedMapel.map((tugas) => {
                  const subs = pengumpulanList.filter((p) => p.tugasId === tugas.id);
                  const totalMurid = currentOpenKelas?.totalMurid || classStudents.length || 25;
                  const kumpul = subs.length;
                  const belum = Math.max(0, totalMurid - kumpul);
                  const sudahNilai = subs.filter((p) => p.nilai !== undefined).length;
                  const ditolak = subs.filter((p) => p.status === "ditolak").length;

                  return (
                    <div key={tugas.id} className="flex items-center rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-emerald-400 hover:shadow-md transition">
                      <button
                        onClick={() => setSelectedTugasId(tugas.id)}
                        className="flex items-center gap-3 flex-1 p-4 text-left min-w-0"
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          tugas.isManualOffline ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          <Folder className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 truncate">{tugas.judul}</span>
                            {tugas.isManualOffline && (
                              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">Offline</span>
                            )}
                            {ditolak > 0 && (
                              <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">{ditolak} Ditolak</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {tugas.isManualOffline
                              ? `Tgl: ${tugas.tanggalPenilaian ? new Date(tugas.tanggalPenilaian).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"} • ${subs.length} dinilai`
                              : `${kumpul}/${totalMurid} kumpul • ${belum > 0 ? `${belum} belum` : "semua kumpul"}`}
                          </p>
                          {sudahNilai > 0 && !tugas.isManualOffline && (
                            <p className="text-[10px] text-emerald-700 font-semibold">{sudahNilai} sudah dinilai</p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                      </button>
                      {/* Delete button for this tugas folder */}
                      <button
                        onClick={() => handleDeleteTugas(tugas.id, tugas.judul)}
                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-r-2xl transition shrink-0"
                        title="Hapus tugas ini"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* ⭐ LEVEL 4: JAWABAN MURID + DOWNLOAD REKAP NILAI                       */}
        {/* ===================================================================== */}
        {selectedKelasId !== null && selectedMapelId !== null && selectedTugasId !== null && currentViewTugas && (
          <div className="space-y-4">
            {/* Header + Back + Download */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={handleBackToTugasList}
                className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Daftar Tugas</span>
              </button>
              <button
                onClick={handleDownloadRekapNilai}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Rekap</span>
              </button>
            </div>

            {/* Tugas Info Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    {currentViewTugas.mapelNama}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{currentViewTugas.judul}</h3>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {currentViewTugas.isManualOffline && (
                    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">Offline</span>
                  )}
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 capitalize">
                    {currentViewTugas.jenis}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-emerald-50 py-2 px-1 border border-emerald-100">
                  <p className="text-lg font-black text-emerald-700">{submissionsForViewTugas.length}</p>
                  <p className="text-[10px] text-emerald-800">Sudah Kumpul</p>
                </div>
                <div className={`rounded-xl py-2 px-1 border ${
                  classStudents.length - submissionsForViewTugas.length > 0
                    ? "bg-rose-50 border-rose-200"
                    : "bg-slate-50 border-slate-100"
                }`}>
                  <p className={`text-lg font-black ${
                    classStudents.length - submissionsForViewTugas.length > 0 ? "text-rose-600" : "text-slate-600"
                  }`}>
                    {Math.max(0, classStudents.length - submissionsForViewTugas.length)}
                  </p>
                  <p className="text-[10px] text-slate-600">Belum Kumpul</p>
                </div>
                <div className="rounded-xl bg-blue-50 py-2 px-1 border border-blue-100">
                  <p className="text-lg font-black text-blue-700">
                    {submissionsForViewTugas.filter((p) => p.nilai !== undefined).length}
                  </p>
                  <p className="text-[10px] text-blue-800">Sudah Dinilai</p>
                </div>
              </div>

              {currentViewTugas.tanggalPenilaian && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Calendar className="h-3 w-3" />
                  <span>Tanggal Penilaian: {new Date(currentViewTugas.tanggalPenilaian).toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
                </div>
              )}
            </div>

            {/* List Murid + Nilai */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Hasil Pengumpulan Siswa ({currentOpenKelas?.nama})
                </h4>
              </div>

              <div className="divide-y divide-slate-100">
                {classStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">Tidak ada siswa terdaftar di kelas ini.</div>
                ) : (
                  classStudents.map((student, idx) => {
                    const sub = submissionsForViewTugas.find((p) => p.muridId === student.id);
                    const isDitolak = sub?.status === "ditolak";
                    return (
                      <div key={student.id} className={`p-3 transition ${ isDitolak ? "bg-rose-50/50" : "hover:bg-slate-50" }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{student.nama}</p>
                              <p className="text-[10px] text-slate-400">NIS: {student.nis || "-"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {sub ? (
                              <>
                                {/* Badge status */}
                                {isDitolak ? (
                                  <span className="rounded-lg bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 flex items-center gap-0.5">
                                    <XCircle className="h-3 w-3" />Ditolak
                                  </span>
                                ) : sub.nilai !== undefined && sub.nilai !== null ? (
                                  <span className={`rounded-lg px-2 py-0.5 text-xs font-black ${getNilaiColor(sub.nilai)}`}>
                                    {sub.nilai}
                                  </span>
                                ) : (
                                  <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                    Belum Dinilai
                                  </span>
                                )}

                                {/* Tombol Lihat */}
                                <Link
                                  href={`/guru/tugas/${currentViewTugas.id}`}
                                  className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-200 shrink-0"
                                >
                                  Lihat
                                </Link>

                                {/* Tombol Tolak — hanya tampil jika belum ditolak */}
                                {!isDitolak && (
                                  <button
                                    onClick={() => handleOpenReject(sub.id)}
                                    className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 border border-rose-200 shrink-0 flex items-center gap-0.5"
                                    title="Tolak jawaban ini"
                                  >
                                    <XCircle className="h-3 w-3" />Tolak
                                  </button>
                                )}

                                {/* Tombol Delete submission */}
                                <button
                                  onClick={() => handleDeletePengumpulan(sub.id, student.nama)}
                                  className="rounded-lg p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition shrink-0"
                                  title="Hapus jawaban ini"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="rounded-lg bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                                ⚠️ Belum Kumpul
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Alasan tolak */}
                        {isDitolak && sub?.alasanTolak && (
                          <div className="mt-2 ml-10 rounded-lg bg-rose-100 border border-rose-200 px-2.5 py-1.5 text-[10px] text-rose-800">
                            <span className="font-bold">Alasan: </span>{sub.alasanTolak}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL TOLAK TUGAS MURID
      ═══════════════════════════════════════════════════════════ */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-rose-800 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4" /> Tolak Jawaban Murid
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tugas akan dikembalikan ke portal murid untuk dikerjakan ulang.
                </p>
              </div>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-[11px] text-rose-800 leading-relaxed">
              ⚠️ Setelah ditolak, murid akan mendapat notifikasi merah dan bisa mengumpulkan ulang.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alasan Penolakan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectAlasan}
                onChange={(e) => setRejectAlasan(e.target.value)}
                placeholder="Contoh: Jawaban soal no. 3 kurang lengkap. Tulis ulang dengan lebih detail."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL INPUT NILAI MANUAL (OFFLINE / RAPOR) ── */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Input Nilai Manual (Offline)</h3>
                <p className="text-[11px] text-slate-500">Nilai langsung tersimpan ke rekap rapor Wali Kelas</p>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualGrades} className="space-y-3 text-xs">
              {/* Kelas + Mapel */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={manualKelasId}
                    onChange={(e) => {
                      const newKId = e.target.value;
                      setManualKelasId(newKId);
                      const matchingM = assignments.find((a) => a.kelasId === newKId);
                      if (matchingM) setManualMapelId(matchingM.mapelId);
                      const students = usersList.filter((u) => u.role === "murid" && u.kelasId === newKId);
                      const initialScores: Record<string, { nilai: number; catatan: string }> = {};
                      students.forEach((s) => {
                        initialScores[s.id] = { nilai: 85, catatan: "Tuntas" };
                      });
                      setManualNilaiScores(initialScores);
                    }}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white text-slate-900"
                  >
                    {guruClasses.map((k) => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
                  <select
                    value={manualMapelId}
                    onChange={(e) => setManualMapelId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white text-slate-900"
                  >
                    {assignments
                      .filter((a) => a.kelasId === manualKelasId)
                      .map((a) => (
                        <option key={a.mapelId} value={a.mapelId}>{a.mapelNama}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Judul Penilaian */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Penilaian / Ulangan</label>
                <input
                  type="text"
                  required
                  value={manualJudul}
                  onChange={(e) => setManualJudul(e.target.value)}
                  placeholder="Contoh: Ulangan Harian Bab 1 Tatap Muka"
                  className="w-full rounded-xl border border-slate-200 p-2 text-slate-900"
                />
              </div>

              {/* Tanggal Penilaian */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>Tanggal Penilaian</span>
                </label>
                <input
                  type="date"
                  value={manualTanggal}
                  onChange={(e) => setManualTanggal(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-slate-900 bg-white"
                />
              </div>

              {/* Daftar Siswa & Input Nilai Cepat */}
              <div className="space-y-1.5 pt-1">
                <span className="font-semibold text-slate-700 block">Daftar Nilai Siswa (0 - 100):</span>
                <div className="max-h-56 overflow-y-auto space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-2">
                  {usersList
                    .filter((u) => u.role === "murid" && u.kelasId === manualKelasId)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-white p-2 border border-slate-200 shadow-2xs"
                      >
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">{s.nama}</p>
                          <p className="text-[10px] text-slate-400">NIS: {s.nis || "-"}</p>
                        </div>

                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={manualNilaiScores[s.id]?.nilai ?? 80}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setManualNilaiScores({
                              ...manualNilaiScores,
                              [s.id]: {
                                nilai: val,
                                catatan: manualNilaiScores[s.id]?.catatan || "Tuntas",
                              },
                            });
                          }}
                          className="w-14 rounded-lg border border-slate-200 p-1 text-center font-bold text-slate-900 bg-slate-50 focus:bg-white shrink-0"
                        />
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700"
                >
                  Simpan Nilai Rapor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
