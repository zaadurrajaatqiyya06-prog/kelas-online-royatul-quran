"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { AppNavbar } from "@/components/Navbar";
import { Lock, AlertCircle, KeyRound, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

type PageMode = "login" | "setup-pin";

export default function LoginPage() {
  const { login, setupPin } = useApp();
  const router = useRouter();

  const [pageMode, setPageMode] = useState<PageMode>("login");

  // Login state
  const [idNumber, setIdNumber] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup PIN state
  const [setupUserId, setSetupUserId] = useState("");
  const [setupNama, setSetupNama] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [setupDone, setSetupDone] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError("");

    if (!idNumber.trim()) { setError("Masukkan NIS atau NIP Anda."); return; }
    if (!pin || pin.length < 4) { setError("PIN minimal 4 digit."); return; }

    setIsSubmitting(true);
    try {
      const result = await login(idNumber.trim(), pin);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.needsSetupPin) {
        // First-time login: redirect to PIN setup
        setSetupUserId(result.userId || "");
        setSetupNama(result.nama || "");
        setPageMode("setup-pin");
        return;
      }

      // Successful login → redirect by role (use window.location for robust mobile navigation)
      const user = result.user || JSON.parse(localStorage.getItem("korq_session") || "{}");
      const target =
        user.role === "murid"
          ? "/murid"
          : user.role === "walas"
          ? "/walas"
          : user.role === "admin"
          ? "/admin"
          : "/guru";

      window.location.href = target;
    } catch (err: any) {
      setError(err?.message || "Gagal masuk. Periksa jaringan Anda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetupPin = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError("");

    if (newPin.length < 4) { setError("PIN minimal 4 digit."); return; }
    if (newPin !== confirmPin) { setError("PIN tidak cocok. Coba lagi."); return; }

    setIsSubmitting(true);
    try {
      const result = await setupPin(setupUserId, newPin);
      if (result.error) { setError(result.error); return; }
      setSetupDone(true);
      // After 2s, go back to login
      setTimeout(() => {
        setPageMode("login");
        setPin("");
        setNewPin("");
        setConfirmPin("");
        setSetupDone(false);
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Gagal membuat PIN.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col pb-12">
      <AppNavbar />

      <div className="px-6 pt-8 pb-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/30">
          <KeyRound className="h-7 w-7 text-white" />
        </div>
        <h1 className="mt-3 text-xl font-black tracking-tight text-slate-900">
          {pageMode === "login" ? "Masuk Akun" : "Buat PIN Baru"}
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          {pageMode === "login"
            ? "Kelas Online Royatul Quran"
            : `Hai, ${setupNama}! Buat PIN untuk login berikutnya.`}
        </p>
      </div>

      <div className="px-6 mt-2">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ── LOGIN FORM ── */}
        {pageMode === "login" && (
          <form
            onSubmit={handleLogin}
            action="javascript:void(0);"
            method="POST"
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                NIS (Murid) atau NIP (Guru/Admin)
              </label>
              <input
                type="text"
                inputMode="text"
                autoComplete="username"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Contoh: 2024001 atau 19850101"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                *Login menggunakan NIS — bukan NIK kependudukan
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                PIN (4–6 Digit)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  data-lpignore="true"
                  name="pin_code"
                  id="pin_code"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Masukkan PIN Anda"
                  style={{
                    WebkitTextSecurity: showPin ? "none" : "disc",
                  } as React.CSSProperties}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition tracking-widest font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Default: 123456 (Bisa diubah di menu profil setelah masuk)
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 active:scale-98 disabled:opacity-70 transition cursor-pointer"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Memverifikasi...</>
              ) : (
                <><Lock className="h-4 w-4" />Masuk Sekarang</>
              )}
            </button>
          </form>
        )}

        {/* ── SETUP PIN FORM ── */}
        {pageMode === "setup-pin" && (
          <>
            {setupDone ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <p className="text-sm font-bold text-slate-900">PIN Berhasil Dibuat!</p>
                <p className="text-xs text-slate-500">Silakan login menggunakan PIN baru Anda.</p>
              </div>
            ) : (
              <form
                onSubmit={handleSetupPin}
                action="javascript:void(0);"
                method="POST"
                className="space-y-4"
              >
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3 text-xs text-amber-800">
                  ⚠️ Ini adalah login pertama Anda. Buat PIN untuk keamanan akun.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    PIN Baru (4–6 Digit)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Buat PIN baru"
                    style={{
                      WebkitTextSecurity: "disc",
                    } as React.CSSProperties}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm focus:border-emerald-500 focus:outline-none transition tracking-widest font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Konfirmasi PIN
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ulangi PIN"
                    style={{
                      WebkitTextSecurity: "disc",
                    } as React.CSSProperties}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm focus:border-emerald-500 focus:outline-none transition tracking-widest font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Menyimpan...</>
                  ) : (
                    "Simpan PIN & Lanjut"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPageMode("login")}
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-xs text-slate-500 hover:bg-slate-50"
                >
                  ← Kembali ke Login
                </button>
              </form>
            )}
          </>
        )}

        {/* ── Akun Pengujian Cepat ── */}
        <div className="mt-8 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3.5 text-xs text-slate-600">
          <p className="font-bold text-slate-800 text-center mb-2 text-[11px] uppercase tracking-wider">
            ⚡ Klik untuk Coba Akun Pengujian:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setIdNumber("admin");
                setPin("123456");
                setError("");
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 active:scale-95 transition text-center shadow-xs"
            >
              <span className="font-black text-slate-900 text-xs">Admin</span>
              <span className="text-[10px] text-slate-400 mt-0.5 font-mono">admin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIdNumber("19850101");
                setPin("123456");
                setError("");
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 active:scale-95 transition text-center shadow-xs"
            >
              <span className="font-black text-slate-900 text-xs">Wali Kelas</span>
              <span className="text-[10px] text-slate-400 mt-0.5 font-mono">19850101</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIdNumber("2024001");
                setPin("123456");
                setError("");
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 active:scale-95 transition text-center shadow-xs"
            >
              <span className="font-black text-slate-900 text-xs">Santri</span>
              <span className="text-[10px] text-slate-400 mt-0.5 font-mono">2024001</span>
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            Semua akun pengujian menggunakan PIN default: <code className="font-bold text-slate-700 bg-slate-200 px-1 py-0.5 rounded">123456</code>
          </p>
        </div>
      </div>
    </div>
  );
}
