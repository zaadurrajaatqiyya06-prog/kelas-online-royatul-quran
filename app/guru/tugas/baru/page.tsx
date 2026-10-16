"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import type { JenisTugas, SoalPG, SoalEsai } from "@/lib/store";
import { SAMPLE_SOAL_PG } from "@/lib/mock-data";
import { AppNavbar } from "@/components/Navbar";
import {
  ArrowLeft,
  Save,
  PlusCircle,
  Trash2,
  Sparkles,
  FolderPlus,
  HelpCircle,
  CheckCircle2,
  FileCheck,
} from "lucide-react";

export default function BuatTugasBaruPage() {
  const router = useRouter();
  const { currentUser, kelasList, mapelList, assignmentList, addTugas } = useApp();

  // Assignments guru saat ini
  const myAssignments = useMemo(
    () => (assignmentList || []).filter((a) => a.guruId === currentUser?.id),
    [assignmentList, currentUser?.id]
  );
  const hasTeacherAssignments = myAssignments.length > 0;

  // Kelas yang diampu oleh guru ini (dengan fallback ke kelasList jika belum ada batasan khusus)
  const allowedKelasList = useMemo(() => {
    if (!hasTeacherAssignments) return kelasList;
    const filtered = kelasList.filter((k) => myAssignments.some((p) => p.kelasId === k.id));
    return filtered.length > 0 ? filtered : kelasList;
  }, [hasTeacherAssignments, myAssignments, kelasList]);

  const [judul, setJudul] = useState("");
  const [kelasId, setKelasId] = useState("");

  // Mapel yang diampu oleh guru ini di kelas yang sedang dipilih
  const allowedMapelList = useMemo(() => {
    if (!hasTeacherAssignments) return mapelList;
    // 1. Cek mapel yang di-assign untuk kelas yang sedang dipilih
    const filteredForClass = mapelList.filter((m) =>
      myAssignments.some((p) => p.kelasId === kelasId && p.mapelId === m.id)
    );
    if (filteredForClass.length > 0) return filteredForClass;

    // 2. Fallback: semua mapel yang diampu oleh guru ini di kelas manapun
    const teacherMapels = mapelList.filter((m) =>
      myAssignments.some((p) => p.mapelId === m.id)
    );
    if (teacherMapels.length > 0) return teacherMapels;

    // 3. Fallback terakhir: semua mapel yang ada agar dropdown tidak pernah blank
    return mapelList;
  }, [hasTeacherAssignments, myAssignments, mapelList, kelasId]);

  const [mapelId, setMapelId] = useState("");

  // Otomatis sinkronkan kelasId saat daftar kelas tersedia
  useEffect(() => {
    if (allowedKelasList.length > 0) {
      if (!kelasId || !allowedKelasList.some((k) => k.id === kelasId)) {
        setKelasId(allowedKelasList[0].id);
      }
    }
  }, [allowedKelasList, kelasId]);

  // Otomatis sinkronkan mapelId saat daftar mapel tersedia/berubah
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


  // Soal Pilihan Ganda (PG) State
  const [soalPGList, setSoalPGList] = useState<SoalPG[]>([
    {
      id: "spg-1",
      nomor: 1,
      pertanyaan: "Penggunaan kata-kata asing yang mengandung arti pertempuran dapat ditemukan dalam jumlah kata.",
      opsiA: "(1)",
      opsiB: "(2)",
      opsiC: "(3)",
      opsiD: "(4)",
      kunciJawaban: "C",
    },
    {
      id: "spg-2",
      nomor: 2,
      pertanyaan: "Penambahan asing yang mengandung lebih banyak atau berbeda arti dapat ditemukan di nomor kata.",
      opsiA: "(1)",
      opsiB: "(2)",
      opsiC: "(3)",
      opsiD: "(4)",
      kunciJawaban: "A",
    },
  ]);

  // Soal Esai State
  const [soalEsaiList, setSoalEsaiList] = useState<SoalEsai[]>([
    { id: "se-1", nomor: 1, pertanyaan: "Jelaskan perbedaan antara teks prosedur dan teks deskripsi!" },
    { id: "se-2", nomor: 2, pertanyaan: "Sebutkan 3 contoh kata baku dan tidak baku dalam bahasa Indonesia!" },
  ]);

  const handleAddSoalPG = () => {
    const nextNomor = soalPGList.length + 1;
    const newSoal: SoalPG = {
      id: `spg-${Date.now()}`,
      nomor: nextNomor,
      pertanyaan: "",
      opsiA: "",
      opsiB: "",
      opsiC: "",
      opsiD: "",
      kunciJawaban: "A",
    };
    setSoalPGList([...soalPGList, newSoal]);
  };

  const handleRemoveSoalPG = (id: string) => {
    if (soalPGList.length <= 1) {
      alert("Minimal harus ada 1 butir soal.");
      return;
    }
    const filtered = soalPGList.filter((s) => s.id !== id);
    // Renumber
    const renumbered = filtered.map((s, idx) => ({ ...s, nomor: idx + 1 }));
    setSoalPGList(renumbered);
  };

  const handleUpdateSoalPG = (id: string, field: keyof SoalPG, value: any) => {
    const updated = soalPGList.map((s) => (s.id === id ? { ...s, [field]: value } : s));
    setSoalPGList(updated);
  };

  const handleLoadSamplePG = () => {
    setJudul("Ulangan Harian: Pilihan Ganda Bahasa Indonesia");
    setInstruksi("Jawablah dengan benar soal-soal berikut ini! Klik opsi jawaban yang benar.");
    setSoalPGList(SAMPLE_SOAL_PG);
  };

  const handleAddSoalEsai = () => {
    const nextNomor = soalEsaiList.length + 1;
    setSoalEsaiList([
      ...soalEsaiList,
      { id: `se-${Date.now()}`, nomor: nextNomor, pertanyaan: "" },
    ]);
  };

  const handleRemoveSoalEsai = (id: string) => {
    if (soalEsaiList.length <= 1) {
      alert("Minimal harus ada 1 soal esai.");
      return;
    }
    const filtered = soalEsaiList.filter((s) => s.id !== id);
    setSoalEsaiList(filtered.map((s, idx) => ({ ...s, nomor: idx + 1 })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !instruksi.trim()) {
      alert("Mohon lengkapi judul dan instruksi tugas.");
      return;
    }

    if (!kelasId) {
      alert("Mohon pilih kelas tujuan tugas.");
      return;
    }

    if (!mapelId) {
      alert("Mohon pilih mata pelajaran tugas.");
      return;
    }

    if (jenis === "pg") {
      const hasEmpty = soalPGList.some(
        (s) => !s.pertanyaan.trim() || !s.opsiA.trim() || !s.opsiB.trim()
      );
      if (hasEmpty) {
        alert("Mohon lengkapi pertanyaan dan minimal opsi A dan B pada semua soal pilihan ganda.");
        return;
      }
    }

    if (jenis === "esai") {
      const hasEmpty = soalEsaiList.some((s) => !s.pertanyaan.trim());
      if (hasEmpty) {
        alert("Mohon lengkapi seluruh pertanyaan soal esai.");
        return;
      }
    }

    if (!currentUser?.id) {
      alert("Sesi login Anda tidak valid atau telah berakhir. Silakan login kembali.");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedKelas = kelasList.find((k) => k.id === kelasId);
      const selectedMapel = mapelList.find((m) => m.id === mapelId);
      const deadlineISO = `${deadlineDate}T${deadlineTime}:00`;

      await addTugas({
        judul: judul.trim(),
        kelasId,
        kelasNama: selectedKelas?.nama || "Kelas",
        mapelId,
        mapelNama: selectedMapel?.nama || "Mata Pelajaran",
        guruId: currentUser.id,
        guruNama: currentUser.nama || "Guru",
        jenis,
        instruksi: instruksi.trim(),
        deadline: deadlineISO,
        soalPGList: jenis === "pg" ? soalPGList : undefined,
        soalEsaiList: jenis === "esai" ? soalEsaiList : undefined,
      });

      alert("✅ Berhasil! Tugas baru berhasil diterbitkan.");
      router.push("/guru");
    } catch (err: any) {
      console.error("Gagal membuat tugas:", err);
      alert("❌ Gagal menerbitkan tugas: " + (err?.message || "Terjadi kesalahan pada sistem."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col pb-24">
      <AppNavbar />

      <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-4 py-3">
        <Link href="/guru" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-sm font-bold text-slate-900 leading-tight">Buat Tugas Baru</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Info Utama Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kelas Tujuan {hasTeacherAssignments && <span className="text-emerald-700 font-bold">✓ (Sesuai Penugasan)</span>}
              </label>
              <select
                value={kelasId}
                onChange={(e) => {
                  const newKId = e.target.value;
                  setKelasId(newKId);
                  const matchingMapels = hasTeacherAssignments
                    ? mapelList.filter((m) =>
                        myAssignments.some((p) => p.kelasId === newKId && p.mapelId === m.id)
                      )
                    : mapelList;
                  if (matchingMapels[0]) setMapelId(matchingMapels[0].id);
                }}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white focus:border-emerald-500 focus:outline-none"
              >
                {allowedKelasList.length === 0 ? (
                  <option value="" disabled>-- Memuat kelas... --</option>
                ) : (
                  allowedKelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Pelajaran {hasTeacherAssignments && <span className="text-emerald-700 font-bold">✓ (Diampu)</span>}
              </label>
              <select
                value={mapelId}
                onChange={(e) => setMapelId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white focus:border-emerald-500 focus:outline-none"
              >
                {allowedMapelList.length === 0 ? (
                  <option value="" disabled>-- Memuat mapel... --</option>
                ) : (
                  allowedMapelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Jenis Tugas Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Tugas</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: "pg", label: "✅ Pilihan Ganda (Auto Nilai & PDF)", desc: "Satu per satu, murid tinggal klik" },
                { id: "esai", label: "📝 Soal Esai Bertahap", desc: "Pertanyaan teks per nomor" },
                { id: "foto", label: "📷 Foto Buku Tulis / LKS", desc: "Jepret kamera langsung" },
                { id: "video", label: "🎥 Rekam Video Tugas", desc: "Durasi bebas, kompres >40MB" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setJenis(opt.id as JenisTugas)}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    jenis === opt.id
                      ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <p className="text-xs">{opt.label}</p>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Deadline</label>
              <input
                type="date"
                required
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Deadline</label>
              <input
                type="time"
                required
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Instruksi / Petunjuk Pengerjaan</label>
            <textarea
              rows={2}
              required
              value={instruksi}
              onChange={(e) => setInstruksi(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* ⭐ BUILDER SOAL PILIHAN GANDA (LENGKAP & DETAIL) */}
        {jenis === "pg" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Daftar Soal Pilihan Ganda ({soalPGList.length} Butir Soal)
                </h3>
                <p className="text-[11px] text-emerald-700">Murid tinggal klik opsi A/B/C/D saat mengerjakan.</p>
              </div>

              <button
                type="button"
                onClick={handleLoadSamplePG}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-200 transition"
              >
                <Sparkles className="h-3 w-3" />
                <span>Isi 5 Soal Contoh</span>
              </button>
            </div>

            <div className="space-y-4">
              {soalPGList.map((soal, idx) => (
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
                      rows={2}
                      required
                      value={soal.pertanyaan}
                      onChange={(e) => handleUpdateSoalPG(soal.id, "pertanyaan", e.target.value)}
                      placeholder="Ketik teks pertanyaan soal..."
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Opsi A, B, C, D */}
                  <div className="space-y-2 pt-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Pilihan Jawaban (A, B, C, D)
                    </label>

                    {(["A", "B", "C", "D"] as const).map((opt) => {
                      const fieldKey = `opsi${opt}` as keyof SoalPG;
                      return (
                        <div key={opt} className="flex items-center gap-2">
                          <span className="w-5 text-center text-xs font-bold text-slate-600">{opt}.</span>
                          <input
                            type="text"
                            required
                            value={soal[fieldKey] as string}
                            onChange={(e) => handleUpdateSoalPG(soal.id, fieldKey, e.target.value)}
                            placeholder={`Teks pilihan jawaban ${opt}`}
                            className="flex-1 rounded-lg border border-slate-200 p-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Kunci Jawaban Benar */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <span className="text-xs font-bold text-emerald-800">Kunci Jawaban Benar:</span>
                    <div className="flex gap-1.5">
                      {(["A", "B", "C", "D"] as const).map((opt) => (
                        <button
                          type="button"
                          key={opt}
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

        {/* ⭐ BUILDER SOAL ESAI */}
        {jenis === "esai" && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Daftar Soal Esai ({soalEsaiList.length} Pertanyaan)
            </h3>

            <div className="space-y-3">
              {soalEsaiList.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Soal Nomor {item.nomor}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSoalEsai(item.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={item.pertanyaan}
                    onChange={(e) => {
                      const updated = soalEsaiList.map((se) =>
                        se.id === item.id ? { ...se, pertanyaan: e.target.value } : se
                      );
                      setSoalEsaiList(updated);
                    }}
                    placeholder="Tuliskan pertanyaan esai..."
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddSoalEsai}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-blue-400 bg-white py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-50 transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Tambah Soal Esai Nomor {soalEsaiList.length + 1}</span>
            </button>
          </div>
        )}

        {/* Info Google Drive & PDF Output */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <FolderPlus className="h-4 w-4 text-emerald-600" />
            <span>Otomatisasi PDF & Google Drive:</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Ketika murid mengumpulkan, sistem akan:
            <br />
            1. Menilai otomatis (jika Pilihan Ganda).
            <br />
            2. Mengubah lembar kerja murid menjadi <strong>file dokumen PDF resmi</strong>.
            <br />
            3. Mengarsipkannya langsung ke folder Google Drive kelas & mengirim notifikasi ke Telegram mapel.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 active:scale-98 transition disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isSubmitting ? "Menerbitkan Tugas..." : "Terbitkan Tugas ke Kelas"}</span>
        </button>
      </form>
    </div>
  );
}
