export type Tipe = "pendapatan" | "pengeluaran";
export type Platform = "Shopee Drive" | "Grab" | "Lainnya" | null;
export type Kategori = "bensin" | "makan" | "servis" | "lainnya" | null;
export type SumberInput = "manual" | "screenshot";

export const JENIS_LAYANAN_GRAB = ["GrabBike","GrabFood","GrabExpress Instant","GrabExpress Sameday"] as const;
export const JENIS_LAYANAN_SHOPEE = ["Instant","Sameday","Food"] as const;
export const JENIS_LAYANAN_ALL = [...JENIS_LAYANAN_GRAB, ...JENIS_LAYANAN_SHOPEE] as const;

export type JenisLayananGrab = typeof JENIS_LAYANAN_GRAB[number];
export type JenisLayananShopee = typeof JENIS_LAYANAN_SHOPEE[number];
export type JenisLayanan = JenisLayananGrab | JenisLayananShopee;

/**
 * Daftar opsi jenis layanan per platform.
 * Single source of truth untuk UI dan validasi storage.
 */
export function getOpsiJenisLayanan(platform: Platform): readonly JenisLayanan[] {
  if (platform === "Grab") return JENIS_LAYANAN_GRAB;
  if (platform === "Shopee Drive") return JENIS_LAYANAN_SHOPEE;
  return [];
}

export interface Transaksi {
  id: string;
  tipe: Tipe;
  tanggal: string; // YYYY-MM-DD
  waktu: string | null; // HH:mm
  nominal: number;
  platform: Platform;
  jenis_layanan: JenisLayanan | null;
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
