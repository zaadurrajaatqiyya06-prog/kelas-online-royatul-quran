"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import type { JenisTugas, SoalPG, SoalEsai } from "@/lib/store";
import { SAMPLE_SOAL_PG } from "@/lib/mock-data";
import { AppNavbar } from "@/components/Navbar";
import { DropdownSelector } from "@/components/ui/DropdownSelector";
import { SandwichActionMenu } from "@/components/ui/SandwichActionMenu";
import {
  ArrowLeft,
  Save,
  PlusCircle,
  Trash2,
  Sparkles,
  FolderPlus,
  CheckCircle2,
  Camera,
  Video,
  Image as ImageIcon,
  X,
  FileText,
} from "lucide-react";

/* ─── Compress image before storing ─────────────────────────── */
async function compressImageFile(file: File, maxDim = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(ev.target?.result as string);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(ev.target?.result as string);
    };
    reader.onerror = reject;
  });
}

export default function BuatTugasBaruPage() {
  const router = useRouter();
  const { currentUser, kelasList, mapelList, assignmentList, addTugas } = useApp();

  const myAssignments = useMemo(
    () => (assignmentList || []).filter((a) => a.guruId === currentUser?.id),
    [assignmentList, currentUser?.id]
  );
  const hasTeacherAssignments = myAssignments.length > 0;

  const allowedKelasList = useMemo(() => {
    if (!hasTeacherAssignments) return kelasList;
    const filtered = kelasList.filter((k) => myAssignments.some((p) => p.kelasId === k.id));
    return filtered.length > 0 ? filtered : kelasList;
  }, [hasTeacherAssignments, myAssignments, kelasList]);

  const [judul, setJudul] = useState("");
  const [kelasId, setKelasId] = useState("");

  const allowedMapelList = useMemo(() => {
    if (!hasTeacherAssignments) return mapelList;
    const filteredForClass = mapelList.filter((m) =>
      myAssignments.some((p) => p.kelasId === kelasId && p.mapelId === m.id)
    );
    if (filteredForClass.length > 0) return filteredForClass;
    const teacherMapels = mapelList.filter((m) =>
      myAssignments.some((p) => p.mapelId === m.id)
    );
    return teacherMapels.length > 0 ? teacherMapels : mapelList;
  }, [hasTeacherAssignments, myAssignments, mapelList, kelasId]);

  const [mapelId, setMapelId] = useState("");

  useEffect(() => {
    if (allowedKelasList.length > 0) {
      if (!kelasId || !allowedKelasList.some((k) => k.id === kelasId)) {
        setKelasId(allowedKelasList[0].id);
      }
    }
  }, [allowedKelasList, kelasId]);

  useEffect(() => {
    if (allowedMapelList.length > 0) {
      if (!mapelId || !allowedMapelList.some((m) => m.id === mapelId)) {
        setMapelId(allowedMapelList[0].id);
      }
    }
  }, [allowedMapelList, mapelId]);

  const [jenis, setJenis] = useState<JenisTugas>("pg");
  const [deadlineDate, setDeadlineDate] = useState("2026-10-20");
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [instruksi, setInstruksi] = useState("Pilihlah salah satu jawaban yang paling tepat. Hasil pengerjaan akan otomatis terkonversi menjadi file PDF dan tersimpan di Google Drive.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Media Lampiran Soal Guru ──────────────────────────────────
  const [mediaType, setMediaType] = useState<"none" | "image" | "video">("none");
  const [mediaDataUrl, setMediaDataUrl] = useState<string | null>(null);
  const [mediaVideoLink, setMediaVideoLink] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaLoading, setMediaLoading] = useState(false);
  const mediaImageInputRef = useRef<HTMLInputElement>(null);
  const mediaVideoInputRef = useRef<HTMLInputElement>(null);

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaLoading(true);
    try {
      const dataUrl = await compressImageFile(file);
      setMediaDataUrl(dataUrl);
    } finally {
      setMediaLoading(false);
      e.target.value = "";
    }
  };

  const handlePickVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMediaDataUrl(url);
    e.target.value = "";
  };

  const clearMedia = () => {
    setMediaDataUrl(null);
    setMediaVideoLink("");
    setMediaCaption("");
  };

  // ── Soal PG ───────────────────────────────────────────────────
  const [soalPGList, setSoalPGList] = useState<SoalPG[]>([
    { id: "spg-1", nomor: 1, pertanyaan: "", opsiA: "", opsiB: "", opsiC: "", opsiD: "", kunciJawaban: "A" },
  ]);

  const [soalEsaiList, setSoalEsaiList] = useState<SoalEsai[]>([
    { id: "se-1", nomor: 1, pertanyaan: "" },
  ]);

  const handleAddSoalPG = () => {
    const nextNomor = soalPGList.length + 1;
    setSoalPGList([...soalPGList, {
      id: `spg-${Date.now()}`, nomor: nextNomor,
      pertanyaan: "", opsiA: "", opsiB: "", opsiC: "", opsiD: "", kunciJawaban: "A",
    }]);
  };

  const handleRemoveSoalPG = (id: string) => {
    if (soalPGList.length <= 1) { alert("Minimal harus ada 1 butir soal."); return; }
    const filtered = soalPGList.filter((s) => s.id !== id);
    setSoalPGList(filtered.map((s, idx) => ({ ...s, nomor: idx + 1 })));
  };

  const handleUpdateSoalPG = (id: string, field: keyof SoalPG, value: any) => {
    setSoalPGList(soalPGList.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleLoadSamplePG = () => {
    setJudul("Ulangan Harian: Pilihan Ganda Bahasa Indonesia");
    setInstruksi("Jawablah dengan benar soal-soal berikut ini! Klik opsi jawaban yang benar.");
    setSoalPGList(SAMPLE_SOAL_PG);
  };

  const handleAddSoalEsai = () => {
    setSoalEsaiList([...soalEsaiList, { id: `se-${Date.now()}`, nomor: soalEsaiList.length + 1, pertanyaan: "" }]);
  };

  const handleRemoveSoalEsai = (id: string) => {
    if (soalEsaiList.length <= 1) { alert("Minimal harus ada 1 soal esai."); return; }
    setSoalEsaiList(soalEsaiList.filter((s) => s.id !== id).map((s, idx) => ({ ...s, nomor: idx + 1 })));
  };

  // ── Submit Handler ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !instruksi.trim()) { alert("Mohon lengkapi judul dan instruksi tugas."); return; }
    if (!kelasId) { alert("Mohon pilih kelas tujuan tugas."); return; }
    if (!mapelId) { alert("Mohon pilih mata pelajaran tugas."); return; }
    if (jenis === "pg") {
      const hasEmpty = soalPGList.some((s) => !s.pertanyaan.trim() || !s.opsiA.trim() || !s.opsiB.trim());
      if (hasEmpty) { alert("Mohon lengkapi pertanyaan dan minimal opsi A dan B pada semua soal pilihan ganda."); return; }
    }
    if (jenis === "esai") {
      const hasEmpty = soalEsaiList.some((s) => !s.pertanyaan.trim());
      if (hasEmpty) { alert("Mohon lengkapi seluruh pertanyaan soal esai."); return; }
    }
    if (!currentUser?.id) { alert("Sesi login tidak valid. Silakan login kembali."); router.push("/login"); return; }

    setIsSubmitting(true);
    try {
      const selectedKelas = kelasList.find((k) => k.id === kelasId);
      const selectedMapel = mapelList.find((m) => m.id === mapelId);
      const deadlineISO = `${deadlineDate}T${deadlineTime}:00`;

      await addTugas({
        judul: judul.trim(),
        kelasId, kelasNama: selectedKelas?.nama || "Kelas",
        mapelId, mapelNama: selectedMapel?.nama || "Mata Pelajaran",
        guruId: currentUser.id, guruNama: currentUser.nama || "Guru",
        jenis, instruksi: instruksi.trim(), deadline: deadlineISO,
        soalPGList: jenis === "pg" ? soalPGList : undefined,
        soalEsaiList: jenis === "esai" ? soalEsaiList : undefined,
      });

      alert("✅ Berhasil! Tugas baru berhasil diterbitkan.");
      router.push("/guru");
    } catch (err: any) {
      alert("❌ Gagal menerbitkan tugas: " + (err?.message || "Terjadi kesalahan pada sistem."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Dropdown options for jenis tugas ─────────────────────────
  const jenisOptions = [
    { key: "pg",    label: "Pilihan Ganda (Auto Nilai & PDF)", icon: "🎯", description: "Murid tinggal klik A/B/C/D, auto terkoreksi" },
    { key: "esai",  label: "Soal Esai Bertahap",              icon: "✍️", description: "Pertanyaan uraian per nomor" },
    { key: "foto",  label: "Foto Buku / LKS",                 icon: "📷", description: "Murid jepret kamera langsung" },
    { key: "video", label: "Rekam Video Hafalan / Tugas",     icon: "🎥", description: "Upload video atau link YouTube" },
    { key: "file",  label: "Upload Dokumen / File",           icon: "📁", description: "Upload file tugas (PDF, Word, dll)" },
  ];

  // ── Sandwich menu items for soal PG ─────────────────────────
  const pgSandwichItems = [
    { key: "add",     label: "Tambah Butir Soal Baru",  icon: "➕", onClick: handleAddSoalPG },
    { key: "sample",  label: "Gunakan 5 Soal Contoh",   icon: "✨", onClick: handleLoadSamplePG },
    {
      key: "reset", label: "Reset Semua Butir Soal", icon: "🗑️", danger: true,
      onClick: () => {
        if (confirm("Reset semua soal? Data yang sudah diisi akan hilang.")) {
          setSoalPGList([{ id: "spg-1", nomor: 1, pertanyaan: "", opsiA: "", opsiB: "", opsiC: "", opsiD: "", kunciJawaban: "A" }]);
        }
      },
    },
  ];

  const esaiSandwichItems = [
    { key: "add",   label: "Tambah Pertanyaan Baru",  icon: "➕", onClick: handleAddSoalEsai },
    {
      key: "reset", label: "Reset Semua Pertanyaan", icon: "🗑️", danger: true,
      onClick: () => {
        if (confirm("Reset semua pertanyaan esai?")) {
          setSoalEsaiList([{ id: "se-1", nomor: 1, pertanyaan: "" }]);
        }
      },
    },
  ];

  return (
    <div className="flex flex-1 flex-col pb-24">
      <AppNavbar />

      {/* ── Header Bar ── */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-4 py-3">
        <Link href="/guru" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-slate-900 leading-tight">Buat Tugas Baru</h1>
          {hasTeacherAssignments && (
            <p className="text-[10px] text-emerald-700 font-semibold">
              ✓ Menampilkan kelas & mapel sesuai penugasan Anda
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">

        {/* ── Card: Info Utama ── */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-4">

          {/* Judul */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Tugas</label>
            <input
              type="text"
              required
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Ulangan Harian Bab 2 Pilihan Ganda"
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Kelas & Mapel */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas Tujuan</label>
              <select
                value={kelasId}
                onChange={(e) => {
                  const newKId = e.target.value;
                  setKelasId(newKId);
                  const matching = hasTeacherAssignments
                    ? mapelList.filter((m) => myAssignments.some((p) => p.kelasId === newKId && p.mapelId === m.id))
                    : mapelList;
                  if (matching[0]) setMapelId(matching[0].id);
                }}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white focus:border-emerald-500 focus:outline-none"
              >
                {allowedKelasList.length === 0
                  ? <option value="" disabled>-- Memuat kelas... --</option>
                  : allowedKelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)
                }
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
              <select
                value={mapelId}
                onChange={(e) => setMapelId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white focus:border-emerald-500 focus:outline-none"
              >
                {allowedMapelList.length === 0
                  ? <option value="" disabled>-- Memuat mapel... --</option>
                  : allowedMapelList.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)
                }
              </select>
            </div>
          </div>

          {/* ── JENIS TUGAS → Dropdown Selector ── */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Tugas / Soal</label>
            <DropdownSelector
              options={jenisOptions}
              value={jenis}
              onChange={(k) => setJenis(k as JenisTugas)}
              className="w-full"
            />
            {/* Deskripsi jenis aktif */}
            <p className="mt-1.5 text-[11px] text-slate-500">
              {jenisOptions.find((o) => o.key === jenis)?.description}
            </p>
          </div>

          {/* Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Deadline</label>
              <input
                type="date" required value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Deadline</label>
              <input
                type="time" required value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Instruksi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Instruksi / Petunjuk Pengerjaan</label>
            <textarea
              rows={2} required value={instruksi}
              onChange={(e) => setInstruksi(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* ── Card: Lampiran Media Soal Guru (Foto / Video Panduan) ── */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800">📎 Lampiran Media Soal <span className="font-normal text-slate-400">(Opsional)</span></h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tambahkan foto materi, gambar soal, atau video panduan guru — akan tampil di atas soal saat murid mengerjakan.
              </p>
            </div>
          </div>

          {/* Tab pemilih tipe media */}
          <div className="flex gap-1.5">
            {([
              { id: "none",  label: "Tanpa Media",   icon: <X className="h-3 w-3" /> },
              { id: "image", label: "📷 Foto / Gambar", icon: null },
              { id: "video", label: "🎥 Video",          icon: null },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { setMediaType(opt.id); clearMedia(); }}
                className={`flex-1 flex items-center justify-center gap-1 rounded-xl border py-2 text-[11px] font-bold transition ${
                  mediaType === opt.id
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Foto Upload */}
          {mediaType === "image" && (
            <div className="space-y-2">
              <input ref={mediaImageInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
              {!mediaDataUrl ? (
                <button
                  type="button"
                  onClick={() => mediaImageInputRef.current?.click()}
                  disabled={mediaLoading}
                  className="w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 py-6 text-xs text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-50"
                >
                  <ImageIcon className="h-8 w-8 text-emerald-400" />
                  <span className="font-semibold">{mediaLoading ? "Memproses gambar..." : "Ketuk untuk pilih foto soal"}</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG — Otomatis dikompres &lt; 1MB</span>
                </button>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaDataUrl} alt="Preview lampiran soal" className="w-full max-h-52 object-contain bg-slate-50" />
                  <button
                    type="button"
                    onClick={clearMedia}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <input
                type="text"
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                placeholder="Keterangan gambar (opsional)"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          {/* Video Upload / Link */}
          {mediaType === "video" && (
            <div className="space-y-2">
              <input ref={mediaVideoInputRef} type="file" accept="video/*" className="hidden" onChange={handlePickVideo} />
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <p className="text-[11px] font-semibold text-slate-700">Pilih salah satu:</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => mediaVideoInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                  >
                    <Video className="h-4 w-4" />
                    Upload File Video
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[10px] text-slate-400">atau</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <input
                  type="url"
                  value={mediaVideoLink}
                  onChange={(e) => setMediaVideoLink(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... atau link video lainnya"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                />
                {(mediaDataUrl || mediaVideoLink) && (
                  <div className="rounded-xl border border-slate-200 bg-white p-2 flex items-center gap-2">
                    <Video className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px] text-slate-700 font-medium truncate">
                      {mediaDataUrl ? "Video siap ditampilkan ke murid" : mediaVideoLink}
                    </span>
                    <button type="button" onClick={clearMedia} className="ml-auto text-slate-400 hover:text-rose-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <input
                type="text"
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                placeholder="Keterangan video panduan (opsional)"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          {mediaType !== "none" && (mediaDataUrl || mediaVideoLink) && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <p className="text-[11px] text-emerald-800 font-semibold">
                Media ini akan tampil di atas soal saat murid membuka tugas.
              </p>
            </div>
          )}
        </div>

        {/* ── Card: Builder Soal Pilihan Ganda ── */}
        {jenis === "pg" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 shadow-sm space-y-4">
            {/* Header dengan Sandwich Menu */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Daftar Soal Pilihan Ganda
                </h3>
                <p className="text-[11px] text-emerald-700">{soalPGList.length} butir soal</p>
              </div>
              <SandwichActionMenu
                label="Opsi Soal"
                align="right"
                items={pgSandwichItems}
              />
            </div>

            {/* Daftar Butir Soal */}
            <div className="space-y-4">
              {soalPGList.map((soal) => (
                <div key={soal.id} className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[11px]">
                      {soal.nomor}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSoalPG(soal.id)}
                      className="text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Pertanyaan Soal #{soal.nomor}
                    </label>
                    <textarea
                      rows={2} required value={soal.pertanyaan}
                      onChange={(e) => handleUpdateSoalPG(soal.id, "pertanyaan", e.target.value)}
                      placeholder="Ketik teks pertanyaan soal..."
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="block text-[11px] font-semibold text-slate-700">Pilihan Jawaban (A, B, C, D)</label>
                    {(["A", "B", "C", "D"] as const).map((opt) => {
                      const fieldKey = `opsi${opt}` as keyof SoalPG;
                      return (
                        <div key={opt} className="flex items-center gap-2">
                          <span className="w-5 text-center text-xs font-bold text-slate-600">{opt}.</span>
                          <input
                            type="text" required={opt === "A" || opt === "B"}
                            value={soal[fieldKey] as string}
                            onChange={(e) => handleUpdateSoalPG(soal.id, fieldKey, e.target.value)}
                            placeholder={`Pilihan jawaban ${opt}`}
                            className="flex-1 rounded-lg border border-slate-200 p-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <span className="text-xs font-bold text-emerald-800">Kunci Jawaban Benar:</span>
                    <div className="flex gap-1.5">
                      {(["A", "B", "C", "D"] as const).map((opt) => (
                        <button
                          type="button" key={opt}
                          onClick={() => handleUpdateSoalPG(soal.id, "kunciJawaban", opt)}
                          className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                            soal.kunciJawaban === opt
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddSoalPG}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-emerald-400 bg-white py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Tambah Butir Soal Nomor {soalPGList.length + 1}</span>
            </button>
          </div>
        )}

        {/* ── Card: Builder Soal Esai ── */}
        {jenis === "esai" && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">Daftar Soal Esai</h3>
                <p className="text-[11px] text-blue-700">{soalEsaiList.length} pertanyaan</p>
              </div>
              <SandwichActionMenu
                label="Opsi Soal"
                align="right"
                items={esaiSandwichItems}
              />
            </div>

            <div className="space-y-3">
              {soalEsaiList.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Soal Nomor {item.nomor}</span>
                    <button type="button" onClick={() => handleRemoveSoalEsai(item.id)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2} required value={item.pertanyaan}
                    onChange={(e) => {
                      setSoalEsaiList(soalEsaiList.map((se) => se.id === item.id ? { ...se, pertanyaan: e.target.value } : se));
                    }}
                    placeholder="Tuliskan pertanyaan esai..."
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <button
              type="button" onClick={handleAddSoalEsai}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-blue-400 bg-white py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-50 transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Tambah Soal Esai Nomor {soalEsaiList.length + 1}</span>
            </button>
          </div>
        )}

        {/* ── Info Google Drive & PDF Output ── */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <FolderPlus className="h-4 w-4 text-emerald-600" />
            <span>Otomatisasi PDF & Google Drive:</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Ketika murid mengumpulkan, sistem akan otomatis menilai (PG), menghasilkan <strong>dokumen PDF resmi</strong>, dan mengarsipkannya ke folder Google Drive kelas.
          </p>
        </div>

        {/* ── Submit Button ── */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 active:scale-98 transition disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isSubmitting ? "Menerbitkan Tugas..." : "Terbitkan Tugas ke Kelas"}</span>
        </button>
      </form>
    </div>
  );
}
