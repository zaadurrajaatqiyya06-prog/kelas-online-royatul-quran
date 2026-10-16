"use client";

import React, { useEffect, useState } from "react";
import { Download, WifiOff, Wifi, X, Smartphone, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // 1. Service Worker & Online/Offline Status
  useEffect(() => {
    // Check initial online status
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      // Register Service Worker
      if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker terdaftar:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] SW register error:", err);
          });
      }

      // Online/Offline Listeners
      const handleOnline = () => {
        setIsOnline(true);
        setShowOnlineToast(true);
        setTimeout(() => setShowOnlineToast(false), 4000);
      };

      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // PWA Install Prompt Listener
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        // Only show banner if user hasn't dismissed it in this session
        const dismissed = sessionStorage.getItem("pwa_banner_dismissed");
        if (!dismissed) {
          setShowInstallBanner(true);
        }
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);

      // Detect if already installed (standalone mode)
      if (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
      ) {
        setIsInstalled(true);
      }

      // Detect iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isApple = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isApple);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("pwa_banner_dismissed", "true");
  };

  return (
    <>
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg animate-in slide-in-from-top duration-300">
          <WifiOff className="h-4 w-4 animate-bounce" />
          <span>Mode Offline: Sinyal terputus. Jawaban ketikan Anda tetap tersimpan otomatis.</span>
        </div>
      )}

      {/* Online Restored Toast */}
      {isOnline && showOnlineToast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top duration-300">
          <Wifi className="h-4 w-4" />
          <span>Koneksi internet terhubung kembali!</span>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && !isInstalled && (
        <div className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-sm z-40 rounded-2xl border border-emerald-500/30 bg-slate-900/95 p-3.5 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-sm shadow-md">
              RQ
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                Pasang Aplikasi Royatul Qur'an
              </h4>
              <p className="mt-0.5 text-[11px] text-slate-300 line-clamp-2">
                Akses lebih cepat langsung dari layar utama HP tanpa perlu ketik alamat web.
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow hover:bg-emerald-500 active:scale-95 transition-all"
                >
                  <Download className="h-3 w-3" />
                  Install Sekarang
                </button>
                <button
                  onClick={dismissBanner}
                  className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-slate-400 hover:text-white"
                >
                  Nanti Saja
                </button>
              </div>
            </div>
            <button
              onClick={dismissBanner}
              className="text-slate-400 hover:text-white p-1"
              title="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Cara Pasang di iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ol className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                  1
                </span>
                <span>Buka halaman ini menggunakan browser <b>Safari</b>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                  2
                </span>
                <span>
                  Ketuk tombol <b>Bagikan (Share 📤)</b> di bagian bawah layar Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                  3
                </span>
                <span>
                  Gulir ke bawah dan pilih <b>"Tambahkan ke Layar Utama" (Add to Home Screen ➕)</b>.
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
