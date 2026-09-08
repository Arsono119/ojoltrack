"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTransaksi } from "@/hooks/useTransaksi";
import { aggregateByDay, histogramJam } from "@/lib/calc";
import { Card } from "@/components/ui/Card";

// Recharts dynamic to avoid SSR issues
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false }) as never;
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false }) as never;
const LineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false }) as never;
const Line = dynamic(() => import("recharts").then(m => m.Line), { ssr: false }) as never;
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false }) as never;
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false }) as never;
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false }) as never;
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false }) as never;
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false }) as never;

export default function GrafikPage() {
  const { data } = useTransaksi();
  const [range, setRange] = useState<7|30>(7);
  const byDay = useMemo(() => aggregateByDay(data, range), [data, range]);
  const jam = useMemo(() => histogramJam(data), [data]);
  const topJam = [...jam].sort((a,b)=>b.count-a.count).slice(0,3);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-bold">Grafik & Insight</h1>

      <div className="flex gap-2">
        <button onClick={()=>setRange(7)} className={`flex-1 rounded-xl py-2 text-sm font-semibold ${range===7 ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}>Minggu ini</button>
        <button onClick={()=>setRange(30)} className={`flex-1 rounded-xl py-2 text-sm font-semibold ${range===30 ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}>Bulan ini</button>
      </div>

      <Card>
        <p className="text-sm font-semibold">Tren Pendapatan Bersih</p>
        {byDay.every(d=>d.bersih===0 && d.totalPendapatan===0) ? (
          <p className="py-8 text-center text-sm text-zinc-400">Belum ada data — tambah transaksi dulu</p>
        ) : (
          <div className="h-48 mt-3">
            {/* @ts-expect-error recharts dynamic */}
            <ResponsiveContainer width="100%" height="100%">
              {/* @ts-expect-error */}
              <LineChart data={byDay}>
                {/* @ts-expect-error */}
                <CartesianGrid strokeDasharray="3 3" />
                {/* @ts-expect-error */}
                <XAxis dataKey="tanggal" tick={{fontSize:10}} tickFormatter={(v:string)=>v.slice(5)} />
                {/* @ts-expect-error */}
                <YAxis tick={{fontSize:10}} />
                {/* @ts-expect-error */}
                <Tooltip />
                {/* @ts-expect-error */}
                <Line type="monotone" dataKey="bersih" stroke="#16a34a" strokeWidth={2} dot={false} name="Bersih" />
                {/* @ts-expect-error */}
                <Line type="monotone" dataKey="totalPendapatan" stroke="#3b82f6" strokeWidth={1} dot={false} name="Pendapatan" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <p className="text-sm font-semibold">Perbandingan Rp/KM</p>
        {byDay.filter(d=>d.rataRpPerKm!=null).length===0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">Isi jarak KM agar Rp/KM terhitung</p>
        ) : (
          <div className="h-40 mt-3">
            {/* @ts-expect-error */}
            <ResponsiveContainer width="100%" height="100%">
              {/* @ts-expect-error */}
              <BarChart data={byDay}>
                {/* @ts-expect-error */}
                <CartesianGrid strokeDasharray="3 3" />
                {/* @ts-expect-error */}
                <XAxis dataKey="tanggal" tick={{fontSize:10}} tickFormatter={(v:string)=>v.slice(5)} />
                {/* @ts-expect-error */}
                <YAxis tick={{fontSize:10}} />
                {/* @ts-expect-error */}
                <Tooltip />
                {/* @ts-expect-error */}
                <Bar dataKey="rataRpPerKm" fill="#f59e0b" name="Rp/KM" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-2 text-xs text-zinc-500">Platform detail ada di Dashboard per hari.</div>
      </Card>

      <Card>
        <p className="text-sm font-semibold">Jam Tersibuk</p>
        {topJam[0]?.count === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">Belum ada order — data jam akan muncul setelah ada transaksi dengan waktu</p>
        ) : (
          <>
            <div className="h-40 mt-3">
              {/* @ts-expect-error */}
              <ResponsiveContainer width="100%" height="100%">
                {/* @ts-expect-error */}
                <BarChart data={jam}>
                  {/* @ts-expect-error */}
                  <XAxis dataKey="jam" tick={{fontSize:10}} />
                  {/* @ts-expect-error */}
                  <YAxis allowDecimals={false} tick={{fontSize:10}} />
                  {/* @ts-expect-error */}
                  <Tooltip />
                  {/* @ts-expect-error */}
                  <Bar dataKey="count" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Top jam: {topJam.filter(j=>j.count>0).map(j=>`${String(j.jam).padStart(2,"0")}:00 (${j.count})`).join(" · ")}</p>
          </>
        )}
      </Card>
    </div>
  );
}
