import type { Transaksi, RingkasanHarian } from "./types";

export function calcRpPerKm(nominal: number, jarak_km: number | null): number | null {
  if (jarak_km == null || jarak_km <= 0 || nominal <= 0) return null;
  return Math.round(nominal / jarak_km);
}

export function ringkasanHarian(transaksi: Transaksi[], tanggal: string): RingkasanHarian {
  const filtered = transaksi.filter((t) => t.tanggal === tanggal);
  const pendapatan = filtered.filter((t) => t.tipe === "pendapatan");
  const pengeluaran = filtered.filter((t) => t.tipe === "pengeluaran");

  const totalPendapatan = pendapatan.reduce((s, t) => s + t.nominal, 0);
  const totalPengeluaran = pengeluaran.reduce((s, t) => s + t.nominal, 0);
  const pendapatanBersih = totalPendapatan - totalPengeluaran;

  const withJarak = pendapatan.filter((t) => t.rp_per_km != null);
  const rataRpPerKm =
    withJarak.length > 0 ? Math.round(withJarak.reduce((s, t) => s + (t.rp_per_km as number), 0) / withJarak.length) : null;

  const platforms = ["Shopee Drive", "Grab", "Lainnya"] as const;
  const rataRpPerKmPerPlatform: Record<string, number | null> = {};
  for (const p of platforms) {
    const byP = withJarak.filter((t) => t.platform === p);
    rataRpPerKmPerPlatform[p] = byP.length > 0 ? Math.round(byP.reduce((s, t) => s + (t.rp_per_km as number), 0) / byP.length) : null;
  }

  return {
    totalPendapatan,
    totalPengeluaran,
    pendapatanBersih,
    rataRpPerKm,
    rataRpPerKmPerPlatform,
    countPendapatan: pendapatan.length,
    countWithJarak: withJarak.length,
  };
}

export function aggregateByDay(
  transaksi: Transaksi[],
  days: number,
  endDate: Date = new Date(),
): { tanggal: string; totalPendapatan: number; totalPengeluaran: number; bersih: number; rataRpPerKm: number | null }[] {
  const result: { tanggal: string; totalPendapatan: number; totalPengeluaran: number; bersih: number; rataRpPerKm: number | null }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const tanggal = d.toISOString().slice(0, 10);
    const r = ringkasanHarian(transaksi, tanggal);
    result.push({
      tanggal,
      totalPendapatan: r.totalPendapatan,
      totalPengeluaran: r.totalPengeluaran,
      bersih: r.pendapatanBersih,
      rataRpPerKm: r.rataRpPerKm,
    });
  }
  return result;
}

export function histogramJam(transaksi: Transaksi[]): { jam: number; count: number }[] {
  const counts = Array.from({ length: 24 }, (_, jam) => ({ jam, count: 0 }));
  for (const t of transaksi.filter((x) => x.tipe === "pendapatan" && x.waktu)) {
    const h = parseInt((t.waktu as string).split(":")[0], 10);
    if (!isNaN(h) && h >= 0 && h < 24) counts[h].count++;
  }
  return counts;
}
