"use client";

import React, { useState } from "react";
import { Plus, Trash2, Layers } from "lucide-react";
import { useApp } from "@/lib/store";
import type { Halaqah } from "@/lib/store";

export function HalaqahAdminPanel() {
  const { halaqahList, addHalaqah, deleteHalaqah } = useApp();

  const [formNama, setFormNama] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleTambah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) {
      alert("Silakan ketik nama halaqah terlebih dahulu.");
      return;
    }
    setIsSaving(true);
    setErrMsg("");
    setSuccessMsg("");
    try {
      const created = await addHalaqah({ nama: formNama.trim(), jenis: "tahsin" });
      const namaHasil = created?.nama || formNama.trim();
      setSuccessMsg(`Halaqah "${namaHasil}" berhasil ditambahkan!`);
      alert(`Berhasil! Halaqah "${namaHasil}" telah ditambahkan.`);
      setFormNama("");
    } catch (err: any) {
      const msg = err.message || "Gagal menambah halaqah. Pastikan tabel Supabase sudah dibuat.";
      setErrMsg(msg);
      alert("❌ " + msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleHapus = async (h: Halaqah) => {
    if (!confirm(`Hapus halaqah "${h.nama}"?\nSemua data anggota & catatan akan ikut terhapus.`)) return;
    try {
      await deleteHalaqah(h.id);
    } catch (err: any) {
      alert(err.message || "Gagal menghapus.");
    }
  };

  return (
    <div className="space-y-4">

      {/* Info banner */}
      <div className="rounded-xl bg-purple-50 border border-purple-100 px-3 py-2.5 text-[11px] text-purple-800 leading-relaxed">
        <span className="font-bold">📖 Halaqah Al-Qur'an</span> — Kelompok belajar Al-Qur'an lintas kelas.<br />
        <span className="text-purple-600">
          • <strong>Musyrif / Guru</strong> diatur di menu <strong>Guru</strong> → detail guru.<br />
          • <strong>Anggota santri</strong> diatur di menu <strong>Murid</strong> → detail murid.
        </span>
      </div>

      {/* Form tambah — hanya nama */}
      <form onSubmit={handleTambah} className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Nama Halaqah Baru
          </label>
          <input
            type="text"
            value={formNama}
            onChange={(e) => { setFormNama(e.target.value); setErrMsg(""); setSuccessMsg(""); }}
            placeholder="misal: Halaqah Al-Fatihah / Juz Amma"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-200"
          />
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-700 active:scale-95 transition disabled:opacity-50 shrink-0 cursor-pointer shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          {isSaving ? "Menyimpan..." : "Tambah"}
        </button>
      </form>

      {/* Success feedback */}
      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-[11px] text-emerald-800 font-bold">
          ✅ {successMsg}
        </div>
      )}

      {/* Error message */}
      {errMsg && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-[11px] text-rose-700 font-medium">
          ❌ {errMsg}
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {halaqahList.length} Halaqah Terdaftar
        </span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      {/* List */}
      {halaqahList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-purple-100 bg-purple-50/30 p-8 text-center">
          <Layers className="h-8 w-8 text-purple-200 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-400">Belum ada halaqah.</p>
          <p className="text-[10px] text-slate-300 mt-0.5">Isi nama di atas lalu klik Tambah.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {halaqahList.map((h) => (
            <div
              key={h.id}
              className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:border-purple-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-lg">
                  📖
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{h.nama}</h4>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Musyrif:{" "}
                    <span className="font-semibold text-slate-700">
                      {h.musyrifNama || "Belum diatur"}
                    </span>
                    {" · "}
                    <span className="font-semibold text-slate-700">
                      {h.totalAnggota} santri
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleHapus(h)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition opacity-0 group-hover:opacity-100"
                title="Hapus Halaqah"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
