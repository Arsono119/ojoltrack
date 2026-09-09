import { nanoid } from "nanoid";
import { calcRpPerKm } from "./calc";
import { storage } from "./storage";
import type { Transaksi } from "./types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function seedDemoData() {
  const now = new Date().toISOString();
  const data: Transaksi[] = [
    { id: nanoid(), tipe: "pendapatan", tanggal: daysAgo(0), waktu: "08:15", nominal: 18000, platform: "Grab", jenis_layanan: "GrabBike", jarak_km: 6.2, rp_per_km: calcRpPerKm(18000, 6.2), kategori: null, catatan: "GrabBike pagi", sumber_input: "manual", created_at: now },
    { id: nanoid(), tipe: "pendapatan", tanggal: daysAgo(0), waktu: "09:40", nominal: 12000, platform: "Shopee Drive", jenis_layanan: "Instant", jarak_km: 3.5, rp_per_km: calcRpPerKm(12000, 3.5), kategori: null, catatan: "Shopee Drive", sumber_input: "manual", created_at: now },
    { id: nanoid(), tipe: "pendapatan", tanggal: daysAgo(0), waktu: "14:20", nominal: 25000, platform: "Grab", jenis_layanan: "GrabExpress Instant", jarak_km: 8.0, rp_per_km: calcRpPerKm(25000, 8.0), kategori: null, catatan: "Grab jarak jauh", sumber_input: "manual", created_at: now },
    { id: nanoid(), tipe: "pendapatan", tanggal: daysAgo(1), waktu: "10:00", nominal: 15000, platform: "Shopee Drive", jenis_layanan: "Food", jarak_km: 4.0, rp_per_km: calcRpPerKm(15000, 4.0), kategori: null, catatan: "Shopee", sumber_input: "manual", created_at: now },
    { id: nanoid(), tipe: "pendapatan", tanggal: daysAgo(1), waktu: "18:30", nominal: 20000, platform: "Grab", jenis_layanan: "GrabFood", jarak_km: 5.5, rp_per_km: calcRpPerKm(20000, 5.5), kategori: null, catatan: "Grab sore", sumber_input: "manual", created_at: now },
    { id: nanoid(), tipe: "pendapatan", tanggal: daysAgo(2), waktu: "07:30", nominal: 10000, platform: "Grab", jenis_layanan: "GrabExpress Sameday", jarak_km: 2.0, rp_per_km: calcRpPerKm(10000, 2.0), kategori: null, catatan: "Grab pendek worth it", sumber_input: "manual", created_at: now },
    { id: nanoid(), tipe: "pengeluaran", tanggal: daysAgo(0), waktu: "07:50", nominal: 25000, platform: null, jenis_layanan: null, jarak_km: null, rp_per_km: null, kategori: "bensin", catatan: "Isi bensin pagi", sumber_input: "manual", created_at: now },
    { id: nanoid(), tipe: "pengeluaran", tanggal: daysAgo(0), waktu: "12:00", nominal: 18000, platform: null, jenis_layanan: null, jarak_km: null, rp_per_km: null, kategori: "makan", catatan: "Makan siang warteg", sumber_input: "manual", created_at: now },
    { id: nanoid(), tipe: "pendapatan", tanggal: daysAgo(0), waktu: "19:00", nominal: 16000, platform: "Shopee Drive", jenis_layanan: "Sameday", jarak_km: null, rp_per_km: null, kategori: null, catatan: "Shopee tanpa jarak", sumber_input: "manual", created_at: now },
    { id: nanoid(), tipe: "pengeluaran", tanggal: daysAgo(1), waktu: "13:00", nominal: 15000, platform: null, jenis_layanan: null, jarak_km: null, rp_per_km: null, kategori: "makan", catatan: "Ayam geprek", sumber_input: "manual", created_at: now },
  ];

  if (typeof window !== "undefined") {
    localStorage.setItem(storage.KEY, JSON.stringify(data));
  }
  return data;
}
