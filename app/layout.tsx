import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { PWAProvider } from "@/components/PWAProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kelas Online Royatul Quran",
  description: "Aplikasi Pengumpulan dan Rekap Tugas Terpusat Royatul Quran",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Royatul Quran",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#059669" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
      </head>
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-200`}>
        <AppProvider>
          <PWAProvider>
            <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-xl sm:border-x sm:border-slate-200">
              {children}
            </div>
          </PWAProvider>
        </AppProvider>
      </body>
    </html>
  );
}
