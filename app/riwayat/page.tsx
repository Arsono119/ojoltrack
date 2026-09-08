"use client";
import { useState, useMemo } from "react";
import { useTransaksi } from "@/hooks/useTransaksi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { exportToCSV } from "@/lib/export";

function groupByTanggal(data: ReturnType<typeof useTransaksi>["data"]) {
  const map = new Map<string, typeof data>();
  for (const t of [...data].sort((a,b)=> (b.tanggal+b.waktu!).localeCompare(a.tanggal+a.waktu!))) {
    const arr = map.get(t.tanggal) || [];
    arr.push(t);
    map.set(t.tanggal, arr);
  }
  return Array.from(map.entries()).sort((a,b)=> b[0].localeCompare(a[0]));
}

export default function RiwayatPage() {
  const { data, remove } = useTransaksi();
  const [filter, setFilter] = useState<"Semua"|"Shopee Drive"|"Grab"|"Pengeluaran">("Semua");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let r = data;
    if (filter === "Pengeluaran") r = r.filter(t=>t.tipe==="pengeluaran");
    else if (filter !== "Semua") r = r.filter(t=>t.platform===filter);
    if (q) r = r.filter(t=> (t.catatan||"").toLowerCase().includes(q.toLowerCase()));
    return r;
  }, [data, filter, q]);

  const groups = groupByTanggal(filtered);

  const handleExport = () => {
    const csv = exportToCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ojoltrack-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Riwayat</h1>
        <Button variant="ghost" onClick={handleExport}>Export CSV</Button>
      </div>

      <input placeholder="Cari catatan..." value={q} onChange={(e)=>setQ(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["Semua","Shopee Drive","Grab","Pengeluaran"] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold border ${filter===f ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200"}`}>{f}</button>
        ))}
      </div>

      {groups.length === 0 ? (
        <Card className="text-center py-8 text-sm text-zinc-500">Tidak ada transaksi</Card>
      ) : groups.map(([tanggal, items])=>(
        <div key={tanggal} className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500">{tanggal === new Date().toISOString().slice(0,10) ? "Hari ini" : tanggal}</p>
          {items.map(t=>(
            <Card key={t.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{t.waktu ? t.waktu + " " : ""}{t.tipe==="pendapatan" ? t.platform : t.kategori}</p>
                <p className={`text-sm font-bold ${t.tipe==="pendapatan" ? "text-green-600" : "text-red-600"}`}>{t.tipe==="pendapatan" ? "+" : "-"}{t.nominal.toLocaleString("id-ID")} {t.jarak_km ? `· ${t.jarak_km}km` : ""}</p>
                {t.rp_per_km != null && <p className="text-xs text-zinc-500">Rp/KM: {t.rp_per_km.toLocaleString("id-ID")}</p>}
                {t.catatan && <p className="text-xs text-zinc-500 truncate">{t.catatan}</p>}
              </div>
              <button onClick={()=>{ if(confirm("Hapus transaksi ini?")) remove(t.id); }} className="ml-2 text-xs text-red-600">Hapus</button>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
