"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { AppNavbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { User, Kelas, PenugasanGuru } from "@/lib/mock-data";
import {
  Users,
  GraduationCap,
  School,
  PlusCircle,
  Trash2,
  KeyRound,
  ShieldCheck,
  Search,
  CheckCircle2,
  X,
  Sparkles,
  Folder,
  ArrowLeft,
  FileSpreadsheet,
  Download,
  Upload,
  ArrowRightCircle,
  UserCheck,
  AlertTriangle,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  Settings,
  BookOpen,
  Edit3,
  Printer,
  BarChart2,
  Library,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

export default function AdminPage() {
  const {
    currentUser,
    usersList,
    kelasList,
    mapelList,
    assignmentList,
    addUser,
    importUsersBatch,
    updateUser,
    deleteUser,
    updatePenugasanGuru,
    addKelas,
    deleteKelas,
    addMapel,
    deleteMapel,
    naikKelasSerempak,
    pindahKelasManual,
    kelulusanSiswa,
    gantiPinUser,
  } = useApp();

  const [selectedGuruForAssignment, setSelectedGuruForAssignment] = useState<User | null>(null);
  const [tempPenugasan, setTempPenugasan] = useState<PenugasanGuru[]>([]);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);


  // Modal Ganti PIN Manual State
  const [pinModalUser, setPinModalUser] = useState<User | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinShow, setPinShow] = useState(false);
  const [pinIsLoading, setPinIsLoading] = useState(false);

  const handleOpenGantiPin = (user: User) => {
    setPinModalUser(user);
    setPinInput("");
    setPinShow(false);
  };

  const handleSaveGantiPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModalUser) return;
    if (pinInput.trim().length < 4) {
      alert("PIN minimal 4 karakter (disarankan 6 digit angka).");
      return;
    }
    setPinIsLoading(true);
    try {
      await gantiPinUser(pinModalUser.id, pinInput.trim());
      alert(`PIN untuk ${pinModalUser.nama} (${pinModalUser.nis || pinModalUser.nip || "User"}) berhasil diubah menjadi: ${pinInput.trim()}`);
      setPinModalUser(null);
      setPinInput("");
    } catch (err: any) {
      alert(err.message || "Gagal mengganti PIN.");
    } finally {
      setPinIsLoading(false);
    }
  };

  // Top Tabs
  const [activeTab, setActiveTab] = useState<"murid" | "guru" | "kelas" | "kenaikan" | "mapel" | "rekap_nilai">("murid");

  // Folder View state for Murid
  const [selectedFolderKelasId, setSelectedFolderKelasId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Murid Detail Popup
  const [selectedMuridDetail, setSelectedMuridDetail] = useState<User | null>(null);
  const [isMuridEditMode, setIsMuridEditMode] = useState(false);
  const [isKartuMode, setIsKartuMode] = useState(false);
  const [editMuridNama, setEditMuridNama] = useState("");
  const [editMuridNis, setEditMuridNis] = useState("");
  const [editMuridNisn, setEditMuridNisn] = useState("");
  const [editMuridNik, setEditMuridNik] = useState("");
  const [editMuridNoKk, setEditMuridNoKk] = useState("");
  const [editMuridJk, setEditMuridJk] = useState<"L" | "P">("L");
  const [editMuridKelasId, setEditMuridKelasId] = useState("");

  // Guru Detail Popup
  const [selectedGuruDetail, setSelectedGuruDetail] = useState<User | null>(null);

  // Modal State for Add User/Kelas/Mapel
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"murid" | "guru" | "kelas" | "mapel">("murid");

  // Import Excel/CSV Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState("");
  const [parsedPreview, setParsedPreview] = useState<Omit<User, "id">[]>([]);

  // Kenaikan Kelas State
  const [kenaikanMode, setKenaikanMode] = useState<"serempak" | "pengecualian" | "manual">("serempak");
  const [dariKelasId, setDariKelasId] = useState(kelasList[0]?.id || "k-5");
  const [keKelasId, setKeKelasId] = useState(kelasList[1]?.id || "k-6");
  const [muridTinggalIds, setMuridTinggalIds] = useState<string[]>([]);
  const [manualMuridId, setManualMuridId] = useState("");
  const [manualKeKelasId, setManualKeKelasId] = useState(kelasList[0]?.id || "k-6");

  // Form Fields for Add Murid/Guru/Kelas/Mapel
  const [nama, setNama] = useState("");
  const [nis, setNis] = useState("");
  const [nisn, setNisn] = useState("");
  const [nik, setNik] = useState("");
  const [noKk, setNoKk] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<"L" | "P">("L");
  const [nip, setNip] = useState("");
  const [kelasId, setKelasId] = useState(kelasList[0]?.id || "k-6");
  const [waliKelasId, setWaliKelasId] = useState(kelasList[0]?.id || "k-6");
  const [role, setRole] = useState<"murid" | "guru" | "walas">("murid");
  const [fotoUrl, setFotoUrl] = useState<string | undefined>(undefined);


  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-amber-500 mb-2" />
        <h2 className="text-base font-bold text-slate-900">Akses Khusus Administrator</h2>
        <p className="mt-1 text-xs text-slate-500">Silakan login menggunakan akun administrator sekolah.</p>
        <Link href="/login" className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">
          Ke Halaman Login
        </Link>
      </div>
    );
  }

  const allMurid = usersList.filter((u) => u.role === "murid");
  const guruList = usersList.filter((u) => u.role === "guru" || u.role === "walas");

  const currentFolderMurid = selectedFolderKelasId
    ? allMurid.filter((m) => m.kelasId === selectedFolderKelasId)
    : [];

  const filteredFolderMurid = currentFolderMurid.filter(
    (m) =>
      m.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.nis && m.nis.includes(searchTerm)) ||
      (m.nisn && m.nisn.includes(searchTerm))
  );

  const filteredGuru = guruList.filter(
    (g) =>
      g.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.nip && g.nip.includes(searchTerm))
  );

  // ── Open Modal Helpers ───────────────────────────────────────────────────────
  const handleOpenModal = (type: "murid" | "guru" | "kelas" | "mapel") => {
    setModalType(type);
    setNama(""); setNis(""); setNisn(""); setNik(""); setNoKk(""); setNip("");
    setFotoUrl(undefined);
    setRole(type === "guru" ? "guru" : "murid");
    setWaliKelasId(kelasList[0]?.id || "k-6");
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) { alert("Mohon lengkapi nama."); return; }

    if (modalType === "murid") {
      if (!nis.trim()) { alert("NIS wajib diisi karena digunakan sebagai ID Login siswa."); return; }
      const targetKId = selectedFolderKelasId || kelasId;
      const targetKelas = kelasList.find((k) => k.id === targetKId);
      addUser({
        nama: nama.trim(), nis: nis.trim(),
        nisn: nisn.trim() || undefined, nik: nik.trim() || undefined,
        noKk: noKk.trim() || undefined, jenisKelamin, fotoUrl,
        role: "murid", kelasId: targetKId, kelasNama: targetKelas?.nama || "Kelas 6",
      });
    } else if (modalType === "guru") {
      if (!nip.trim()) { alert("NIP wajib diisi untuk login guru."); return; }
      addUser({
        nama: nama.trim(), nip: nip.trim(), role,
        kelasId: role === "walas" ? waliKelasId : undefined,
        kelasNama: role === "walas" ? kelasList.find((k) => k.id === waliKelasId)?.nama : undefined,
      });
    } else if (modalType === "kelas") {
      addKelas(nama.trim(), 6, guruList[0]?.id || "");
    } else if (modalType === "mapel") {
      addMapel({
        nama: nama.trim(),
        guruId: "",
        guruNama: "Belum Ditentukan",
      });
    }

    setIsModalOpen(false);
  };

  // ── Murid Detail Popup ────────────────────────────────────────────────────────
  const openMuridDetail = (murid: User) => {
    setSelectedMuridDetail(murid);
    setIsMuridEditMode(false);
    setIsKartuMode(false);
  };

  const openMuridEdit = () => {
    if (!selectedMuridDetail) return;
    setEditMuridNama(selectedMuridDetail.nama);
    setEditMuridNis(selectedMuridDetail.nis || "");
    setEditMuridNisn(selectedMuridDetail.nisn || "");
    setEditMuridNik(selectedMuridDetail.nik || "");
    setEditMuridNoKk(selectedMuridDetail.noKk || "");
    setEditMuridJk((selectedMuridDetail.jenisKelamin as "L" | "P") || "L");
    setEditMuridKelasId(selectedMuridDetail.kelasId || kelasList[0]?.id || "");
    setIsMuridEditMode(true);
    setIsKartuMode(false);
  };

  const handleSaveMuridEdit = () => {
    if (!selectedMuridDetail) return;
    const targetKelas = kelasList.find((k) => k.id === editMuridKelasId);
    updateUser(selectedMuridDetail.id, {
      nama: editMuridNama.trim(),
      nis: editMuridNis.trim(),
      nisn: editMuridNisn.trim() || undefined,
      nik: editMuridNik.trim() || undefined,
      noKk: editMuridNoKk.trim() || undefined,
      jenisKelamin: editMuridJk,
      kelasId: editMuridKelasId,
      kelasNama: targetKelas?.nama,
    });
    const updated = { ...selectedMuridDetail, nama: editMuridNama, nis: editMuridNis, nisn: editMuridNisn || undefined, nik: editMuridNik || undefined, noKk: editMuridNoKk || undefined, jenisKelamin: editMuridJk, kelasId: editMuridKelasId, kelasNama: targetKelas?.nama };
    setSelectedMuridDetail(updated);
    setIsMuridEditMode(false);
    alert("Data murid berhasil diperbarui!");
  };

  const handlePrintKartu = (murid: User) => {
    const kelas = kelasList.find((k) => k.id === murid.kelasId);
    const html = `<!DOCTYPE html><html><head><style>
      body { margin: 0; font-family: 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8f8f8; }
      .kartu { width: 340px; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.18); background: white; }
      .kartu-header { background: linear-gradient(135deg, #065f46, #047857); color: white; padding: 20px; text-align: center; }
      .kartu-header h1 { margin: 0; font-size: 14px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
      .kartu-header p { margin: 4px 0 0; font-size: 10px; opacity: 0.8; }
      .kartu-avatar { width: 70px; height: 70px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin: 12px auto 0; font-size: 28px; font-weight: 900; color: white; border: 3px solid rgba(255,255,255,0.5); }
      .kartu-body { padding: 20px; }
      .field { margin-bottom: 10px; }
      .field-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 700; }
      .field-value { font-size: 13px; font-weight: 700; color: #111827; margin-top: 1px; }
      .field-nis { font-size: 20px; font-weight: 900; color: #065f46; text-align: center; margin: 10px 0; letter-spacing: 2px; }
      .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .kartu-footer { background: #f3f4f6; padding: 10px 20px; text-align: center; font-size: 9px; color: #6b7280; }
      @media print { body { background: white; } }
    </style></head><body>
    <div class="kartu">
      <div class="kartu-header">
        <h1>Kartu Pelajar</h1>
        <p>Royatul Quran</p>
        <div class="kartu-avatar">${murid.nama.charAt(0)}</div>
      </div>
      <div class="kartu-body">
        <div class="field"><div class="field-label">Nama Lengkap</div><div class="field-value">${murid.nama}</div></div>
        <div class="field-nis">NIS: ${murid.nis || "-"}</div>
        <div class="grid2">
          <div class="field"><div class="field-label">Kelas</div><div class="field-value">${kelas?.nama || murid.kelasNama || "-"}</div></div>
          <div class="field"><div class="field-label">Jenis Kelamin</div><div class="field-value">${murid.jenisKelamin === "P" ? "Perempuan" : "Laki-laki"}</div></div>
          <div class="field"><div class="field-label">NISN</div><div class="field-value">${murid.nisn || "-"}</div></div>
          <div class="field"><div class="field-label">Status</div><div class="field-value">Aktif</div></div>
        </div>
      </div>
      <div class="kartu-footer">Tahun Pelajaran 2025/2026 • Royatul Quran</div>
    </div>
    <script>window.onload = function() { window.print(); }</script>
    </body></html>`;

    const w = window.open("", "_blank", "width=500,height=650");
    if (w) { w.document.write(html); w.document.close(); }
  };

  // ── CSV Import ───────────────────────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const csvHeader = "Nama_Lengkap,NIS,NISN,NIK,NO_KK,Jenis_Kelamin,Nama_Kelas\n";
    const sampleRows = [
      "Muhammad Rayhan,1011,0091122334,3201012345670001,3201012345670000,L,Kelas 6\n",
      "Aisyah Zahira,1012,0091122335,3201012345670002,3201012345670000,P,Kelas 6\n",
      "Rizky Pratama,1013,0091122336,3201012345670003,3201012345670000,L,Kelas 5\n",
    ].join("");
    const blob = new Blob([csvHeader + sampleRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Template_Data_Murid_Royatul_Quran.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleParseCsv = (text: string) => {
    setImportCsvText(text);
    const lines = text.trim().split("\n");
    if (lines.length <= 1) return;
    const parsed: Omit<User, "id">[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const kelasTarget = kelasList.find((k) =>
          parts[6] ? k.nama.toLowerCase().includes(parts[6].toLowerCase()) : false
        ) || kelasList[0];
        parsed.push({
          nama: parts[0], nis: parts[1],
          nisn: parts[2] || undefined, nik: parts[3] || undefined, noKk: parts[4] || undefined,
          jenisKelamin: parts[5]?.toUpperCase() === "P" ? "P" : "L",
          role: "murid", kelasId: kelasTarget.id, kelasNama: kelasTarget.nama,
        });
      }
    }
    setParsedPreview(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (event) => handleParseCsv(event.target?.result as string);
      reader.readAsText(e.target.files[0]);
    }
  };

  const handleExecuteBatchImport = () => {
    if (parsedPreview.length === 0) return;
    importUsersBatch(parsedPreview);
    setIsImportModalOpen(false);
    setParsedPreview([]);
    setImportCsvText("");
    alert(`Berhasil mengimpor ${parsedPreview.length} data murid baru!`);
  };

  // ── Kenaikan Handlers ────────────────────────────────────────────────────────
  const handleEksekusiSerempak = () => {
    if (dariKelasId === keKelasId) { alert("Kelas asal dan kelas tujuan tidak boleh sama."); return; }
    const asal = kelasList.find((k) => k.id === dariKelasId)?.nama;
    const tujuan = kelasList.find((k) => k.id === keKelasId)?.nama;
    if (confirm(`Yakin ingin menaikkan SEMUA murid dari ${asal} ke ${tujuan}?`)) {
      naikKelasSerempak(dariKelasId, keKelasId, []);
      alert(`Seluruh murid ${asal} telah dinaikkan ke ${tujuan}.`);
    }
  };

  const handleEksekusiPengecualian = () => {
    if (dariKelasId === keKelasId) { alert("Kelas asal dan kelas tujuan tidak boleh sama."); return; }
    const asal = kelasList.find((k) => k.id === dariKelasId)?.nama;
    const tujuan = kelasList.find((k) => k.id === keKelasId)?.nama;
    naikKelasSerempak(dariKelasId, keKelasId, muridTinggalIds);
    alert(`Proses selesai: Murid ${asal} dinaikkan ke ${tujuan}, dengan ${muridTinggalIds.length} murid berstatus tinggal kelas.`);
    setMuridTinggalIds([]);
  };

  const handleEksekusiManual = () => {
    if (!manualMuridId) { alert("Pilih siswa yang akan dipindahkan."); return; }
    pindahKelasManual(manualMuridId, manualKeKelasId);
    alert("Data murid berhasil diperbarui ke kelas baru.");
  };

  const selectedFolderKelas = kelasList.find((k) => k.id === selectedFolderKelasId);

  return (
    <div className="flex flex-1 flex-col pb-24">
      <AppNavbar />

      {/* Header Admin */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-amber-200 border border-amber-400/30">
              Panel Pengelola Sekolah
            </span>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-white leading-tight">
              Portal Admin Royatul Quran
            </h2>
            <p className="text-xs text-amber-200">Kelola Data Murid, Guru, Kelas, & Mata Pelajaran</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => currentUser && handleOpenGantiPin(currentUser as any)}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-2 text-xs font-semibold text-white transition backdrop-blur-sm shadow-sm"
              title="Ganti PIN Akun Admin"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-300" />
              <span>Ganti PIN Admin</span>
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
              <School className="h-6 w-6 text-amber-300" />
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm">
            <p className="text-lg font-black text-amber-300">{allMurid.length}</p>
            <p className="text-[10px] text-amber-100">Murid</p>
          </div>
          <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm">
            <p className="text-lg font-black text-white">{guruList.length}</p>
            <p className="text-[10px] text-amber-100">Guru</p>
          </div>
          <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm">
            <p className="text-lg font-black text-emerald-300">{kelasList.length}</p>
            <p className="text-[10px] text-amber-100">Kelas</p>
          </div>
          <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm">
            <p className="text-lg font-black text-blue-300">{mapelList.length}</p>
            <p className="text-[10px] text-amber-100">Mapel</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigasi Utama Admin */}
      <div className="sticky top-[57px] z-20 flex border-b border-slate-200 bg-white text-xs font-semibold overflow-x-auto scrollbar-none">
        {[
          { key: "murid", label: "📁 Murid" },
          { key: "kenaikan", label: "🚀 Naik Kelas" },
          { key: "guru", label: "👨‍🏫 Guru" },
          { key: "kelas", label: "🏫 Kelas" },
          { key: "mapel", label: "📚 Mapel" },
          { key: "rekap_nilai", label: "📊 Rekap Nilai" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as typeof activeTab);
              if (tab.key === "murid") setSelectedFolderKelasId(null);
              setSearchTerm("");
            }}
            className={`shrink-0 px-3 py-3 text-center border-b-2 transition whitespace-nowrap ${
              activeTab === tab.key
                ? "border-amber-600 text-amber-800 bg-amber-50/40"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">

        {/* ===================================================================== */}
        {/* ⭐ TAB 1: DATA MURID DENGAN FOLDER PER KELAS                           */}
        {/* ===================================================================== */}
        {activeTab === "murid" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {selectedFolderKelasId ? `Folder: ${selectedFolderKelas?.nama}` : "Pilih Folder Kelas"}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Template CSV</span>
                </button>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Import CSV</span>
                </button>
              </div>
            </div>

            {/* Folder Grid View */}
            {!selectedFolderKelasId ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Data murid dikelompokkan per folder kelas. Klik untuk membuka dan mengelola murid:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {kelasList.map((k) => {
                    const studentCount = allMurid.filter((m) => m.kelasId === k.id).length;
                    return (
                      <button
                        key={k.id}
                        onClick={() => { setSelectedFolderKelasId(k.id); setSearchTerm(""); }}
                        className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs hover:border-amber-400 hover:shadow-md transition active:scale-98"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-2">
                          <Folder className="h-6 w-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">{k.nama}</h4>
                        <p className="mt-1 text-xs text-slate-500 font-semibold">{studentCount} Siswa</p>
                        <p className="text-[10px] text-slate-400">Wali: {k.waliNama}</p>
                        <span className="mt-2 text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                          Buka Folder <ChevronRight className="h-3 w-3" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedFolderKelasId(null)}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Kembali ke Folder Kelas</span>
                  </button>
                  <button
                    onClick={() => handleOpenModal("murid")}
                    className="flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Tambah Murid</span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Cari siswa di ${selectedFolderKelas?.nama}...`}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* COMPACT Murid List — click to expand detail */}
                <div className="space-y-2">
                  {filteredFolderMurid.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                      Folder ini masih kosong. Klik "Tambah Murid" atau "Import CSV".
                    </div>
                  ) : (
                    filteredFolderMurid.map((murid, idx) => (
                      <button
                        key={murid.id}
                        onClick={() => openMuridDetail(murid)}
                        className="w-full flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 text-left shadow-xs hover:border-amber-300 hover:shadow-sm transition active:scale-98"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-black text-sm">
                            {murid.nama.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{murid.nama}</p>
                            <p className="text-[10px] text-slate-500">
                              NIS: <span className="font-bold text-emerald-700">{murid.nis}</span>
                              {" · "}{murid.jenisKelamin === "P" ? "Pr" : "Lk"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">#{idx + 1}</span>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* ⭐ TAB 2: NAIK KELAS                                                   */}
        {/* ===================================================================== */}
        {activeTab === "kenaikan" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>Fitur Manajemen Kenaikan & Pindah Kelas</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Kelola kenaikan kelas tahun ajaran baru. Tersedia opsi naik serempak, pengecualian tinggal kelas, atau pemindahan manual per siswa.
              </p>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              {(["serempak", "pengecualian", "manual"] as const).map((m, i) => (
                <button
                  key={m}
                  onClick={() => setKenaikanMode(m)}
                  className={`flex-1 rounded-lg py-2 transition ${kenaikanMode === m ? "bg-white text-amber-900 shadow-sm" : "text-slate-600"}`}
                >
                  {i + 1}. {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            {kenaikanMode === "serempak" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-900">Kenaikan Kelas Serempak (Seluruh Siswa)</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Dari Kelas Asal:</label>
                    <select value={dariKelasId} onChange={(e) => setDariKelasId(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-900">
                      {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama} ({allMurid.filter((m) => m.kelasId === k.id).length} Siswa)</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Naik Ke Kelas Tujuan:</label>
                    <select value={keKelasId} onChange={(e) => setKeKelasId(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-900">
                      {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={handleEksekusiSerempak} className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-xs font-bold text-white shadow-md shadow-amber-600/30 hover:bg-amber-700">
                  <ArrowRightCircle className="h-4 w-4" />
                  <span>Proses Naik Kelas Serempak</span>
                </button>
              </div>
            )}

            {kenaikanMode === "pengecualian" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-900">Naik Kelas dengan Siswa Tinggal Kelas</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Kelas Asal:</label>
                    <select value={dariKelasId} onChange={(e) => { setDariKelasId(e.target.value); setMuridTinggalIds([]); }} className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-900">
                      {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Naik Ke Kelas:</label>
                    <select value={keKelasId} onChange={(e) => setKeKelasId(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-900">
                      {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-rose-700">Centang Siswa yang Tinggal Kelas:</label>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs">
                    {allMurid.filter((m) => m.kelasId === dariKelasId).map((s) => {
                      const isChecked = muridTinggalIds.includes(s.id);
                      return (
                        <label key={s.id} className="flex items-center justify-between p-2 cursor-pointer hover:bg-slate-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={isChecked} onChange={(e) => {
                              if (e.target.checked) setMuridTinggalIds([...muridTinggalIds, s.id]);
                              else setMuridTinggalIds(muridTinggalIds.filter((id) => id !== s.id));
                            }} className="h-4 w-4 rounded text-rose-600" />
                            <span className="font-semibold text-slate-800">{s.nama}</span>
                          </div>
                          <span className={`text-[10px] font-bold ${isChecked ? "text-rose-600" : "text-emerald-700"}`}>
                            {isChecked ? "⚠️ Tinggal" : "Naik"}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <button onClick={handleEksekusiPengecualian} className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-xs font-bold text-white shadow-md shadow-amber-600/30 hover:bg-amber-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Proses Kenaikan Kelas (Simpan)</span>
                </button>
              </div>
            )}

            {kenaikanMode === "manual" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-900">Pindah / Kenaikan Manual Per Murid</h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Pilih Siswa:</label>
                    <select value={manualMuridId} onChange={(e) => setManualMuridId(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-900">
                      <option value="">-- Pilih Siswa --</option>
                      {allMurid.map((m) => <option key={m.id} value={m.id}>{m.nama} (Saat ini: {m.kelasNama || "Tanpa Kelas"})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Pindahkan ke Kelas Baru:</label>
                    <select value={manualKeKelasId} onChange={(e) => setManualKeKelasId(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-900">
                      {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                    </select>
                  </div>
                  <button onClick={handleEksekusiManual} className="w-full rounded-xl bg-amber-600 py-3 font-bold text-white shadow-md hover:bg-amber-700">
                    Pindahkan Siswa
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* ⭐ TAB 3: GURU — COMPACT LIST + POPUP DETAIL                           */}
        {/* ===================================================================== */}
        {activeTab === "guru" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Daftar Tenaga Pengajar ({filteredGuru.length})
              </h3>
              <button
                onClick={() => handleOpenModal("guru")}
                className="flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Tambah Guru</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari guru / NIP..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* COMPACT Guru List — click to expand detail */}
            <div className="space-y-2">
              {filteredGuru.map((guru) => (
                <button
                  key={guru.id}
                  onClick={() => setSelectedGuruDetail(guru)}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 text-left shadow-xs hover:border-amber-300 hover:shadow-sm transition active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-black text-sm">
                      {guru.nama.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{guru.nama}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-md px-1.5 py-0.2 text-[9px] font-semibold ${
                          guru.role === "walas" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {guru.role === "walas" ? `Wali Kelas ${guru.kelasNama || ""}` : "Guru"}
                        </span>
                        <span className="text-[10px] text-slate-400">NIP: {guru.nip}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {guru.penugasan && guru.penugasan.length > 0 ? (
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                        {guru.penugasan.length} Mapel
                      </span>
                    ) : (
                      <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                        ⚠ Belum diatur
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* ⭐ TAB 4: KELAS                                                         */}
        {/* ===================================================================== */}
        {activeTab === "kelas" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Daftar Kelas ({kelasList.length})
              </h3>
              <button
                onClick={() => handleOpenModal("kelas")}
                className="flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Tambah Kelas</span>
              </button>
            </div>
            <div className="space-y-2">
              {kelasList.map((k) => {
                const jumlahMurid = allMurid.filter((m) => m.kelasId === k.id).length;
                return (
                  <div key={k.id} className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:border-amber-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{k.nama}</h4>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Wali: <span className="font-semibold text-purple-700">{k.waliNama || "Belum diatur"}</span>
                          {" · "}
                          <span className="font-semibold text-slate-700">{jumlahMurid} Murid</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                        {jumlahMurid} Siswa
                      </span>
                      <button
                        onClick={() => {
                          if (jumlahMurid > 0) {
                            alert(`Tidak dapat menghapus "${k.nama}" karena masih ada ${jumlahMurid} murid di dalamnya. Pindahkan atau hapus murid terlebih dahulu.`);
                            return;
                          }
                          if (confirm(`Hapus kelas "${k.nama}"? Tindakan ini tidak dapat dibatalkan.`)) {
                            deleteKelas(k.id);
                          }
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition opacity-0 group-hover:opacity-100"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {kelasList.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  Belum ada kelas. Klik "Tambah Kelas".
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* ⭐ TAB 5: MAPEL — LIST + TAMBAH MAPEL (tanpa guru pengampu)             */}
        {/* ===================================================================== */}
        {activeTab === "mapel" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Mata Pelajaran ({mapelList.length})
              </h3>
              <button
                onClick={() => handleOpenModal("mapel")}
                className="flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Tambah Mapel</span>
              </button>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 text-[11px] text-blue-700 leading-relaxed">
              <span className="font-bold">ℹ️ Info:</span> Guru pengampu diatur di menu{" "}
              <button onClick={() => setActiveTab("guru")} className="font-bold underline underline-offset-2">Guru</button>{" "}
              → klik guru → <strong>Atur Mapel &amp; Kelas</strong>.
            </div>
            <div className="space-y-2">
              {mapelList.map((m, idx) => (
                <div key={m.id} className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3 hover:border-blue-200 hover:shadow-md transition-all">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-sm shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900">{m.nama}</h4>
                    {m.telegramTopic && (
                      <p className="text-[10px] text-slate-400 mt-0.5">📡 Telegram Topic: #{m.telegramTopic}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus mata pelajaran "${m.nama}"?\nSemua penugasan guru untuk mapel ini juga akan terhapus. Lanjutkan?`)) {
                        deleteMapel(m.id);
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition opacity-0 group-hover:opacity-100 shrink-0"
                    title="Hapus Mata Pelajaran"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {mapelList.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  Belum ada mata pelajaran. Klik "Tambah Mapel".
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* ⭐ TAB 6: REKAP NILAI — RINGKASAN PENGUMPULAN & NILAI PER KELAS         */}
        {/* ===================================================================== */}
        {activeTab === "rekap_nilai" && (
          <div className="space-y-4">
            {/* Statistik Cepat */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-2xl font-black text-amber-700">{allMurid.length}</p>
                <p className="text-xs text-amber-800 font-semibold">Total Siswa</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-2xl font-black text-blue-700">{mapelList.length}</p>
                <p className="text-xs text-blue-800 font-semibold">Mata Pelajaran</p>
              </div>
            </div>

            {/* Rekap per Kelas */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Rekap Nilai & Pengumpulan per Kelas</h3>
              {kelasList.map((k) => {
                const muridDiKelas = allMurid.filter((m) => m.kelasId === k.id);
                const walis = guruList.find((g) => g.role === "walas" && g.kelasId === k.id);
                return (
                  <div key={k.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{k.nama}</h4>
                        <p className="text-[10px] text-slate-400">Wali Kelas: <span className="font-semibold text-purple-700">{walis?.nama || k.waliNama || "Belum diatur"}</span></p>
                      </div>
                      <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {muridDiKelas.length} Siswa
                      </span>
                    </div>

                    {/* Distribusi Siswa Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Proporsi Siswa</span>
                        <span>{allMurid.length > 0 ? Math.round((muridDiKelas.length / allMurid.length) * 100) : 0}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all"
                          style={{ width: allMurid.length > 0 ? `${(muridDiKelas.length / allMurid.length) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>

                    {/* Ringkasan Mapel */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {mapelList.slice(0, 4).map((mp) => (
                        <div key={mp.id} className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5">
                          <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{mp.nama}</p>
                          <p className="text-xs font-bold text-emerald-700">—</p>
                        </div>
                      ))}
                    </div>
                    {mapelList.length > 4 && (
                      <p className="text-[10px] text-slate-400 text-right">+{mapelList.length - 4} mapel lainnya</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-center space-y-1">
              <p className="text-xs font-bold text-blue-900">💡 Rekap Nilai Lengkap Ada di Portal Wali Kelas</p>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Setiap wali kelas dapat melihat rekap nilai dan pengumpulan tugas seluruh muridnya secara real-time melalui portal masing-masing.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* ⭐ POPUP DETAIL MURID                                                   */}
      {/* ===================================================================== */}
      {selectedMuridDetail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {isKartuMode && <button onClick={() => setIsKartuMode(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /></button>}
                <h3 className="text-sm font-bold text-slate-900">
                  {isKartuMode ? "Kartu Pelajar" : isMuridEditMode ? "Edit Data Murid" : "Detail Murid"}
                </h3>
              </div>
              <button onClick={() => { setSelectedMuridDetail(null); setIsMuridEditMode(false); setIsKartuMode(false); }} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* KARTU MODE */}
            {isKartuMode && (
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
                  <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-6 text-center text-white">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">Kartu Pelajar Royatul Quran</p>
                    <div className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl font-black border-2 border-white/40">
                      {selectedMuridDetail.nama.charAt(0)}
                    </div>
                    <h4 className="mt-2 text-lg font-black">{selectedMuridDetail.nama}</h4>
                    <p className="text-2xl font-black text-emerald-200 tracking-widest">NIS: {selectedMuridDetail.nis}</p>
                  </div>
                  <div className="bg-white p-4 grid grid-cols-2 gap-3 text-xs">
                    <div><p className="text-[10px] text-slate-400 uppercase font-bold">Kelas</p><p className="font-bold text-slate-900">{selectedMuridDetail.kelasNama || "-"}</p></div>
                    <div><p className="text-[10px] text-slate-400 uppercase font-bold">Jenis Kelamin</p><p className="font-bold text-slate-900">{selectedMuridDetail.jenisKelamin === "P" ? "Perempuan" : "Laki-laki"}</p></div>
                    <div><p className="text-[10px] text-slate-400 uppercase font-bold">NISN</p><p className="font-bold text-slate-900">{selectedMuridDetail.nisn || "-"}</p></div>
                    <div><p className="text-[10px] text-slate-400 uppercase font-bold">Status</p><p className="font-bold text-emerald-700">Aktif</p></div>
                  </div>
                  <div className="bg-slate-50 p-2 text-center text-[9px] text-slate-400">TA 2025/2026 • Royatul Quran</div>
                </div>
                <button onClick={() => handlePrintKartu(selectedMuridDetail)} className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700">
                  <Printer className="h-4 w-4" />
                  <span>Cetak / Download PDF Kartu</span>
                </button>
              </div>
            )}

            {/* EDIT MODE */}
            {!isKartuMode && isMuridEditMode && (
              <div className="space-y-3 text-xs">
                <div><label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input type="text" value={editMuridNama} onChange={(e) => setEditMuridNama(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-none" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block font-semibold text-slate-700 mb-1">NIS (Login)</label>
                    <input type="text" value={editMuridNis} onChange={(e) => setEditMuridNis(e.target.value)} className="w-full rounded-xl border border-emerald-300 p-2 bg-emerald-50/20 text-slate-900" /></div>
                  <div><label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                    <select value={editMuridJk} onChange={(e) => setEditMuridJk(e.target.value as "L" | "P")} className="w-full rounded-xl border border-slate-200 p-2 bg-white text-slate-900">
                      <option value="L">Laki-laki</option><option value="P">Perempuan</option>
                    </select></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block font-semibold text-slate-600 mb-1">NISN</label><input type="text" value={editMuridNisn} onChange={(e) => setEditMuridNisn(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2 text-slate-900" /></div>
                  <div><label className="block font-semibold text-slate-600 mb-1">NIK</label><input type="text" value={editMuridNik} onChange={(e) => setEditMuridNik(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2 text-slate-900" /></div>
                </div>
                <div><label className="block font-semibold text-slate-600 mb-1">No. Kartu Keluarga</label><input type="text" value={editMuridNoKk} onChange={(e) => setEditMuridNoKk(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2 text-slate-900" /></div>
                <div><label className="block font-semibold text-slate-700 mb-1">Pindah ke Kelas</label>
                  <select value={editMuridKelasId} onChange={(e) => setEditMuridKelasId(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2 bg-white text-slate-900">
                    {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                  </select></div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsMuridEditMode(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 font-semibold text-slate-700 hover:bg-slate-200">Batal</button>
                  <button type="button" onClick={handleSaveMuridEdit} className="flex-1 rounded-xl bg-amber-600 py-2.5 font-bold text-white shadow-md hover:bg-amber-700">Simpan Perubahan</button>
                </div>
              </div>
            )}

            {/* VIEW MODE */}
            {!isKartuMode && !isMuridEditMode && (
              <div className="space-y-4">
                {/* Avatar + Name */}
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 text-2xl font-black">
                    {selectedMuridDetail.nama.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{selectedMuridDetail.nama}</h4>
                    <p className="text-xs text-slate-500">{selectedMuridDetail.kelasNama} • {selectedMuridDetail.jenisKelamin === "P" ? "Perempuan" : "Laki-laki"}</p>
                    <span className="mt-0.5 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      NIS: {selectedMuridDetail.nis} (ID Login)
                    </span>
                  </div>
                </div>

                {/* Data Grid */}
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 grid grid-cols-2 gap-3 text-xs">
                  {[
                    ["NISN", selectedMuridDetail.nisn || "-"],
                    ["NIK", selectedMuridDetail.nik || "-"],
                    ["No. KK", selectedMuridDetail.noKk || "-"],
                    ["Status", selectedMuridDetail.statusKenaikan || "Aktif"],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{label}</p>
                      <p className="font-semibold text-slate-900 truncate">{val}</p>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={openMuridEdit} className="flex flex-col items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 p-3 hover:bg-amber-100 transition">
                    <Edit3 className="h-5 w-5 text-amber-700" />
                    <span className="text-[10px] font-bold text-amber-900">Edit Data</span>
                  </button>
                  <button onClick={() => setIsKartuMode(true)} className="flex flex-col items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 p-3 hover:bg-emerald-100 transition">
                    <UserCheck className="h-5 w-5 text-emerald-700" />
                    <span className="text-[10px] font-bold text-emerald-900">Kartu Siswa</span>
                  </button>
                  <button
                    onClick={() => { if (confirm(`Hapus ${selectedMuridDetail.nama}?`)) { deleteUser(selectedMuridDetail.id); setSelectedMuridDetail(null); } }}
                    className="flex flex-col items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 p-3 hover:bg-rose-100 transition"
                  >
                    <Trash2 className="h-5 w-5 text-rose-600" />
                    <span className="text-[10px] font-bold text-rose-700">Hapus</span>
                  </button>
                </div>

                <button
                  onClick={() => handleOpenGantiPin(selectedMuridDetail)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-sm"
                >
                  <KeyRound className="h-4 w-4 text-blue-600" />
                  <span>Ganti / Reset PIN Siswa Ini</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ⭐ POPUP DETAIL GURU                                                    */}
      {/* ===================================================================== */}
      {selectedGuruDetail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Detail Guru</h3>
              <button onClick={() => setSelectedGuruDetail(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Guru Profile */}
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 text-2xl font-black">
                {selectedGuruDetail.nama.charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{selectedGuruDetail.nama}</h4>
                <p className="text-xs text-slate-500">NIP: {selectedGuruDetail.nip} (ID Login)</p>
                <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  selectedGuruDetail.role === "walas"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-blue-100 text-blue-800"
                }`}>
                  {selectedGuruDetail.role === "walas"
                    ? `Wali Kelas • ${selectedGuruDetail.kelasNama || "Belum diatur"}`
                    : "Guru Mata Pelajaran"}
                </span>
              </div>
            </div>

            {/* Penugasan Mapel */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mata Pelajaran yang Diampu:</span>
              {selectedGuruDetail.penugasan && selectedGuruDetail.penugasan.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedGuruDetail.penugasan.map((p, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-800 border border-blue-200/60">
                      <BookOpen className="h-3 w-3" />
                      {p.mapelNama} ({p.kelasNama})
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-[11px] text-amber-700 italic">
                  ⚠️ Belum diatur. Klik "Atur Mapel & Kelas" di bawah.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSelectedGuruForAssignment(selectedGuruDetail);
                  const initialPenugasan = (selectedGuruDetail.penugasan && selectedGuruDetail.penugasan.length > 0)
                    ? selectedGuruDetail.penugasan
                    : assignmentList
                        .filter((a) => a.guruId === selectedGuruDetail.id)
                        .map((a) => ({
                          mapelId: a.mapelId,
                          mapelNama: a.mapelNama,
                          kelasId: a.kelasId,
                          kelasNama: a.kelasNama,
                        }));
                  setTempPenugasan(initialPenugasan);
                  setSelectedGuruDetail(null);
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700"
              >
                <Settings className="h-4 w-4" />
                <span>Atur Mapel & Kelas</span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`Hapus akun guru ${selectedGuruDetail.nama}?`)) {
                    deleteUser(selectedGuruDetail.id);
                    setSelectedGuruDetail(null);
                  }
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 py-3 text-xs font-bold text-rose-700 hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" />
                <span>Hapus Guru</span>
              </button>
            </div>
            <button
              onClick={() => handleOpenGantiPin(selectedGuruDetail)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-sm"
            >
              <KeyRound className="h-4 w-4 text-blue-600" />
              <span>Ganti / Reset PIN Guru Ini</span>
            </button>
          </div>
        </div>
      )}

      {/* ⭐ MODAL IMPORT BATCH EXCEL / CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Import Data Murid (Excel/CSV)</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200 leading-relaxed">
              <p className="font-bold text-slate-800 mb-1">Petunjuk:</p>
              1. Download template CSV terlebih dahulu.<br />
              2. Isi data di Excel/GSheets lalu Save As CSV.<br />
              3. Upload file CSV Anda di bawah:
            </div>
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/40 p-4 text-center cursor-pointer hover:bg-emerald-50">
              <Upload className="h-6 w-6 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-800">Pilih File CSV</span>
              <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
            </label>
            {parsedPreview.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-emerald-800">Pratinjau ({parsedPreview.length} Murid):</p>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white p-2 text-[11px]">
                  {parsedPreview.map((item, idx) => (
                    <div key={idx} className="py-1"><span className="font-bold text-slate-900">{item.nama}</span> — NIS: {item.nis} ({item.kelasNama})</div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setIsImportModalOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700">Batal</button>
              <button disabled={parsedPreview.length === 0} onClick={handleExecuteBatchImport} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-50">
                Simpan ({parsedPreview.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ MODAL TAMBAH DATA (MURID / GURU / KELAS / MAPEL) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Tambah {modalType === "murid" ? "Murid Baru" : modalType === "guru" ? "Guru Baru" : modalType === "kelas" ? "Kelas Baru" : "Mata Pelajaran"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {modalType === "kelas" ? "Nama Kelas (Contoh: Kelas 7A)" : modalType === "mapel" ? "Nama Mata Pelajaran" : "Nama Lengkap"}
                </label>
                <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Ketik nama..." className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-none" />
              </div>

              {/* Data Khusus Murid */}
              {modalType === "murid" && (
                <>
                  <div>
                    <label className="block font-bold text-emerald-800 mb-1">NIS <span className="text-rose-500">*Wajib untuk Login Murid</span></label>
                    <input type="text" required value={nis} onChange={(e) => setNis(e.target.value)} placeholder="Contoh: 1009" className="w-full rounded-xl border border-emerald-300 p-2.5 text-slate-900 bg-emerald-50/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block font-semibold text-slate-600 mb-1">NISN</label><input type="text" value={nisn} onChange={(e) => setNisn(e.target.value)} placeholder="0091234567" className="w-full rounded-xl border border-slate-200 p-2 text-slate-900" /></div>
                    <div><label className="block font-semibold text-slate-600 mb-1">Jenis Kelamin</label>
                      <select value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value as "L" | "P")} className="w-full rounded-xl border border-slate-200 p-2 text-slate-900 bg-white">
                        <option value="L">Laki-laki</option><option value="P">Perempuan</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block font-semibold text-slate-600 mb-1">NIK Siswa</label><input type="text" value={nik} onChange={(e) => setNik(e.target.value)} placeholder="16 digit NIK" className="w-full rounded-xl border border-slate-200 p-2 text-slate-900" /></div>
                    <div><label className="block font-semibold text-slate-600 mb-1">No. KK</label><input type="text" value={noKk} onChange={(e) => setNoKk(e.target.value)} placeholder="16 digit No KK" className="w-full rounded-xl border border-slate-200 p-2 text-slate-900" /></div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pilih Kelas</label>
                    <select value={selectedFolderKelasId || kelasId} onChange={(e) => setKelasId(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2 text-slate-900 bg-white">
                      {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Foto Profil (Opsional)</label>
                    <label className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 p-2.5 cursor-pointer hover:bg-slate-50">
                      <ImageIcon className="h-4 w-4 text-slate-400" />
                      <span className="text-[11px] text-slate-500">Pilih foto (Opsional)</span>
                      <input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) setFotoUrl(URL.createObjectURL(e.target.files[0])); }} className="hidden" />
                    </label>
                  </div>
                </>
              )}

              {/* Data Khusus Guru */}
              {modalType === "guru" && (
                <>
                  <div>
                    <label className="block font-bold text-blue-900 mb-1">NIP (ID Login Guru) <span className="text-rose-500">*Wajib</span></label>
                    <input type="text" required value={nip} onChange={(e) => setNip(e.target.value)} placeholder="Contoh: 2005" className="w-full rounded-xl border border-blue-200 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Peran</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setRole("guru")} className={`flex-1 rounded-xl border p-2 text-center transition ${role === "guru" ? "border-blue-600 bg-blue-50 text-blue-900 font-bold" : "border-slate-200 text-slate-600"}`}>Guru</button>
                      <button type="button" onClick={() => setRole("walas")} className={`flex-1 rounded-xl border p-2 text-center transition ${role === "walas" ? "border-purple-600 bg-purple-50 text-purple-900 font-bold" : "border-slate-200 text-slate-600"}`}>Wali Kelas</button>
                    </div>
                  </div>
                  {role === "walas" && (
                    <div>
                      <label className="block font-semibold text-purple-800 mb-1">Kelas yang Diwalikan</label>
                      <select value={waliKelasId} onChange={(e) => setWaliKelasId(e.target.value)} className="w-full rounded-xl border border-purple-300 p-2.5 bg-purple-50/20 text-slate-900">
                        {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Data Khusus Mapel — tidak ada guru pengampu, diatur via menu Guru */}
              {modalType === "mapel" && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-[11px] text-blue-800 leading-relaxed">
                  <span className="font-bold">ℹ️ Info:</span> Guru pengampu untuk mata pelajaran ini diatur melalui menu <strong>Guru</strong> → klik guru → <strong>Atur Mapel &amp; Kelas</strong>.
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 font-semibold text-slate-700 hover:bg-slate-200">Batal</button>
                <button type="submit" className="flex-1 rounded-xl bg-amber-600 py-2.5 font-bold text-white shadow-md shadow-amber-600/30 hover:bg-amber-700">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⭐ MODAL ATUR MAPEL & KELAS PENUGASAN GURU */}
      {selectedGuruForAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Atur Penugasan Mengajar</h3>
                <p className="text-xs text-blue-700 font-semibold">{selectedGuruForAssignment.nama}</p>
              </div>
              <button onClick={() => setSelectedGuruForAssignment(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-xs text-slate-500">Centang mata pelajaran dan kelas yang diampu. Saat guru membuat tugas, hanya pilihan ini yang muncul.</p>
            <div className="space-y-3">
              {mapelList.map((m) => (
                <div key={m.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                    <span>{m.nama}</span>
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {kelasList.map((k) => {
                      const isAssigned = tempPenugasan.some((p) => p.mapelId === m.id && p.kelasId === k.id);
                      return (
                        <label key={k.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${isAssigned ? "bg-blue-50 border-blue-300 text-blue-950 font-semibold" : "bg-white border-slate-200 text-slate-600"}`}>
                          <input type="checkbox" checked={isAssigned} onChange={(e) => {
                            if (e.target.checked) setTempPenugasan([...tempPenugasan, { mapelId: m.id, mapelNama: m.nama, kelasId: k.id, kelasNama: k.nama }]);
                            else setTempPenugasan(tempPenugasan.filter((p) => !(p.mapelId === m.id && p.kelasId === k.id)));
                          }} className="h-3.5 w-3.5 rounded text-blue-600" />
                          <span className="text-[11px] truncate">{k.nama}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isSavingAssignment}
                onClick={() => setSelectedGuruForAssignment(null)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingAssignment}
                onClick={async () => {
                  try {
                    setIsSavingAssignment(true);
                    await updatePenugasanGuru(selectedGuruForAssignment.id, tempPenugasan);
                    setSelectedGuruForAssignment(null);
                    alert(`Penugasan mengajar untuk ${selectedGuruForAssignment.nama} berhasil disimpan!`);
                  } catch (err: any) {
                    alert("Gagal menyimpan penugasan: " + (err?.message || "Terjadi kesalahan."));
                  } finally {
                    setIsSavingAssignment(false);
                  }
                }}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white shadow-md transition ${
                  isSavingAssignment
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 shadow-blue-600/30 hover:bg-blue-700"
                }`}
              >
                {isSavingAssignment ? "Menyimpan..." : "Simpan Penugasan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 🔐 MODAL GANTI PIN MANUAL                                            */}
      {/* ===================================================================== */}
      {pinModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ganti PIN Manual</h3>
                  <p className="text-[10px] text-slate-500">Perbarui PIN akses login pengguna</p>
                </div>
              </div>
              <button
                onClick={() => setPinModalUser(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Target Info */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{pinModalUser.nama}</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700 uppercase">
                  {pinModalUser.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-mono">
                ID Login: <span className="font-bold text-slate-900">{pinModalUser.nis || pinModalUser.nip || "-"}</span>
              </p>
            </div>

            <form onSubmit={handleSaveGantiPin} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Ketik PIN Baru:
                </label>
                <div className="relative">
                  <input
                    type={pinShow ? "text" : "password"}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Contoh: 123456"
                    maxLength={12}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono tracking-wider focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setPinShow(!pinShow)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {pinShow ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-slate-400">Minimal 4 digit angka (direkomendasikan 6 digit).</p>
              </div>

              {/* Shortcut Cepat */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Shortcut PIN Cepat:
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPinInput("123456")}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Set 123456
                  </button>
                  {(pinModalUser.nis || pinModalUser.nip) && (
                    <button
                      type="button"
                      onClick={() => setPinInput((pinModalUser.nis || pinModalUser.nip || "").toString())}
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 transition truncate px-1"
                    >
                      Sama dg ID ({pinModalUser.nis || pinModalUser.nip})
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPinModalUser(null)}
                  disabled={pinIsLoading}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pinIsLoading || !pinInput.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {pinIsLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  <span>Simpan PIN Baru</span>
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
