export type Tipe = "pendapatan" | "pengeluaran";
export type Platform = "Shopee Drive" | "Grab" | "Lainnya" | null;
export type Kategori = "bensin" | "makan" | "servis" | "lainnya" | null;
export type SumberInput = "manual" | "screenshot";

export interface Transaksi {
  id: string;
  tipe: Tipe;
  tanggal: string; // YYYY-MM-DD
  waktu: string | null; // HH:mm
  nominal: number;
  platform: Platform;
  jarak_km: number | null;
  rp_per_km: number | null;
  kategori: Kategori;
  catatan: string | null;
  sumber_input: SumberInput;
  created_at: string; // ISO datetime
}

export interface RingkasanHarian {
  totalPendapatan: number;
  totalPengeluaran: number;
  pendapatanBersih: number;
  rataRpPerKm: number | null;
  rataRpPerKmPerPlatform: Record<string, number | null>;
  countPendapatan: number;
  countWithJarak: number;
}
