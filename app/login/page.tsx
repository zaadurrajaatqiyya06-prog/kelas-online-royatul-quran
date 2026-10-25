"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { AppNavbar } from "@/components/Navbar";
import {
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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

  // Testing accounts collapsible
  const [showTestAccounts, setShowTestAccounts] = useState(false);

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
        setSetupUserId(result.userId || "");
        setSetupNama(result.nama || "");
        setPageMode("setup-pin");
        return;
      }

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

  const fillTestAccount = (id: string, pinVal: string) => {
    setIdNumber(id);
    setPin(pinVal);
    setError("");
    setShowTestAccounts(false);
  };

  const testAccounts = [
    { label: "Admin", id: "admin", role: "Panel Pengelola" },
    { label: "Wali Kelas", id: "19850101", role: "Portal Walas" },
    { label: "Santri", id: "2024001", role: "Dashboard Murid" },
    { label: "Guru", id: "19900202", role: "Dashboard Guru" },
  ];

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <AppNavbar />

      {/* ── Centered outer shell ── */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-4">

          {/* ── BRAND MARK ── */}
          <div className="text-center mb-1">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/25">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
              {pageMode === "login" ? "Masuk Akun" : "Buat PIN Baru"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {pageMode === "login"
                ? "Kelas Online Royatul Qur'an"
                : `Hai, ${setupNama}! Buat PIN untuk login berikutnya.`}
            </p>
          </div>

          {/* ── MAIN CARD ── */}
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-xl shadow-slate-200/60">

            {/* Error Alert */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
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
                className="space-y-5"
              >
                {/* NIS / NIP Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    NIS (Santri) atau NIP (Guru / Admin)
                  </label>
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="username"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="Contoh: 2024001 atau 19850101"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    *Gunakan NIS — bukan NIK kependudukan
                  </p>
                </div>

                {/* PIN Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all tracking-widest font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Default: 123456 — bisa diubah setelah login
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 transition-all"
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
                    <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                    <p className="text-base font-bold text-slate-900">PIN Berhasil Dibuat!</p>
                    <p className="text-sm text-slate-500">Silakan login menggunakan PIN baru Anda.</p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSetupPin}
                    action="javascript:void(0);"
                    method="POST"
                    className="space-y-5"
                  >
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      ⚠️ Ini adalah login pertama Anda. Buat PIN untuk keamanan akun.
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                        style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all tracking-widest font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                        style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all tracking-widest font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 disabled:opacity-60 transition-all"
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
                      className="w-full rounded-xl border border-slate-200 py-2.5 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      ← Kembali ke Login
                    </button>
                  </form>
                )}
              </>
            )}
          </div>

          {/* ── Testing Accounts (collapsible) ── */}
          {pageMode === "login" && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setShowTestAccounts((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  Mode Demonstrasi — Klik untuk Akun Pengujian
                </span>
                {showTestAccounts ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              {showTestAccounts && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-2">
                  <p className="text-[11px] text-slate-400 mb-3">
                    Semua akun demo menggunakan PIN:{" "}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-bold text-slate-700">
                      123456
                    </code>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {testAccounts.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => fillTestAccount(acc.id, "123456")}
                        className="flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left hover:border-blue-300 hover:bg-blue-50/50 active:scale-[0.97] transition-all"
                      >
                        <span className="text-xs font-black text-slate-900">{acc.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">{acc.id}</span>
                        <span className="mt-1 inline-block rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {acc.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
