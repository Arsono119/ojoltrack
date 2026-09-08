"use client";
import { useMemo, useState } from "react";
import { useTransaksi } from "@/hooks/useTransaksi";
import { ringkasanHarian } from "@/lib/calc";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { formatRupiahShort, todayISODate } from "@/lib/parse";
import { seedDemoData } from "@/lib/seed";

function formatDateLong(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
}

export default function DashboardPage() {
  const { data, refresh } = useTransaksi();
  const [tanggal, setTanggal] = useState(todayISODate());
  const ringkasan = useMemo(() => ringkasanHarian(data, tanggal), [data, tanggal]);

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">OjolTrack</h1>
        <span className="text-xs text-zinc-500">{formatDateLong(tanggal)}</span>
      </div>

      <div className="flex gap-2">
        <input type="date" value={tanggal} onChange={(e)=>setTanggal(e.target.value)} className="flex-1 h-9 rounded-xl border border-zinc-200 px-3 text-sm" />
        {data.length === 0 && (
          <Button variant="ghost" onClick={()=>{seedDemoData(); refresh();}}>Isi contoh</Button>
        )}
      </div>

      {/* Net Income besar — Wireframe §1 */}
      <Card className="bg-gradient-to-br from-green-600 to-emerald-700 text-white border-0">
        <p className="text-sm opacity-90">Pendapatan Bersih</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">{formatRupiahShort(ringkasan.pendapatanBersih)}</p>
        <p className="mt-1 text-xs opacity-80">{ringkasan.countPendapatan} order · {ringkasan.countWithJarak} ada jarak</p>
      </Card>

      {/* 2 kartu kecil */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-zinc-500">Pemasukan</p>
          <p className="mt-1 text-lg font-bold text-green-600">{formatRupiahShort(ringkasan.totalPendapatan)}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Pengeluaran</p>
          <p className="mt-1 text-lg font-bold text-red-600">{formatRupiahShort(ringkasan.totalPengeluaran)}</p>
        </Card>
      </div>

      {/* Rata-rata Rp/KM */}
      <Card>
        <p className="text-sm font-semibold">Rata-rata Rp/KM</p>
        <p className="mt-1 text-xl font-bold">{ringkasan.rataRpPerKm != null ? formatRupiahShort(ringkasan.rataRpPerKm) + " /km" : "—"}</p>
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-zinc-500">Shopee Drive</span><span className="font-semibold">{ringkasan.rataRpPerKmPerPlatform["Shopee Drive"] != null ? formatRupiahShort(ringkasan.rataRpPerKmPerPlatform["Shopee Drive"] as number) : "—"}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Grab</span><span className="font-semibold">{ringkasan.rataRpPerKmPerPlatform["Grab"] != null ? formatRupiahShort(ringkasan.rataRpPerKmPerPlatform["Grab"] as number) : "—"}</span></div>
        </div>
        {ringkasan.countWithJarak === 0 && ringkasan.countPendapatan > 0 && (
          <p className="mt-2 text-xs text-amber-600">Isi jarak KM di transaksi agar Rp/KM terhitung</p>
        )}
      </Card>

      {data.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-sm text-zinc-500">Belum ada transaksi</p>
          <Link href="/tambah" className="mt-3 inline-block rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white">＋ Tambah Transaksi</Link>
        </Card>
      ) : (
        <Link href="/tambah" className="flex h-12 items-center justify-center rounded-xl bg-green-600 font-semibold text-white shadow">＋ Tambah Transaksi</Link>
      )}
    </div>
  );
}
