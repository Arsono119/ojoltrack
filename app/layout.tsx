import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "OjolTrack — Pencatat Pendapatan Ojol",
  description: "Pencatat & analisis pendapatan ojol otomatis — hitung Rp/KM, bandingkan Shopee Drive vs Grab",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "OjolTrack", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-zinc-50 antialiased">
        <div className="mx-auto w-full max-w-md flex-1 flex flex-col min-h-screen bg-white shadow-sm">
          <main className="flex-1 pb-20">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
