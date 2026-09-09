"use client";
/* eslint-disable react-hooks/set-state-in-effect -- intentional hydration from localStorage */
import { useState, useMemo, useEffect } from "react";
import { nanoid } from "nanoid";
import { calcRpPerKm } from "@/lib/calc";
import { parseJarak, parseRupiah } from "@/lib/parse";
import { categorize } from "@/lib/categorize";
import { storage } from "@/lib/storage";
import type { Platform, Kategori } from "@/lib/types";
import { SegmentedControl } from "./ui/SegmentedControl";
import { Input, Textarea, Label } from "./ui/Input";
import { Button } from "./ui/Button";
import { useRouter } from "next/navigation";
import { ENABLE_VISION } from "@/lib/config";
import ScreenshotConfirm from "./ScreenshotConfirm";
import type { ExtractResult } from "@/lib/vision";

function today(): string { return new Date().toISOString().slice(0,10); }
function nowTime(): string { return `${String(new Date().getHours()).padStart(2,"0")}:${String(new Date().getMinutes()).padStart(2,"0")}`; }

export default function TransactionForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [tipe, setTipe] = useState<"pendapatan"|"pengeluaran">("pendapatan");
  const [platform, setPlatform] = useState<Platform>("Grab");
  const [nominalStr, setNominalStr] = useState("");
  const [jarakStr, setJarakStr] = useState("");
  const [tanggal, setTanggal] = useState(today());
  const [waktu, setWaktu] = useState(nowTime());
  const [kategori, setKategori] = useState<Kategori>("bensin");

  // Memory: load last form prefs — type-aware, avoids cross-type pollution (W3)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("ojoltrack_last_form");
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const m = parsed as Record<string, unknown>;
          if (m.tipe === "pendapatan" || m.tipe === "pengeluaran") setTipe(m.tipe as "pendapatan" | "pengeluaran");
          if (typeof m.platform === "string" && ["Shopee Drive","Grab","Lainnya"].includes(m.platform)) setPlatform(m.platform as Platform);
        }
      }
      const rawKat = localStorage.getItem("ojoltrack_last_kategori");
      if (rawKat) {
        const kat = JSON.parse(rawKat) as unknown;
        if (typeof kat === "string" && ["bensin","makan","servis","lainnya"].includes(kat)) setKategori(kat as Kategori);
      }
    } catch {}
  }, []);
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState("");
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionResult, setVisionResult] = useState<ExtractResult | null>(null);
  const [visionPreview, setVisionPreview] = useState<string>("");

  const nominal = parseRupiah(nominalStr);
  const jarak_km = parseJarak(jarakStr);
  const rp_per_km = useMemo(() => calcRpPerKm(nominal, jarak_km), [nominal, jarak_km]);

  const handleCatatanChange = (v: string) => {
    setCatatan(v);
    if (tipe === "pengeluaran") {
      const cat = categorize(v);
      if (cat) setKategori(cat);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nominal || nominal <= 0) { setError("Nominal harus > 0"); return; }
    if (nominal > 100_000_000) { setError("Nominal terlalu besar (max 100 jt)"); return; }
    if (jarakStr && (jarak_km == null || jarak_km <= 0)) { setError("Jarak harus > 0"); return; }
    if (tipe === "pendapatan" && !platform) { setError("Pilih platform"); return; }

    const t = {
      id: nanoid(),
      tipe,
      tanggal,
      waktu: waktu || null,
      nominal,
      platform: tipe === "pendapatan" ? platform : null,
      jarak_km: tipe === "pendapatan" ? jarak_km : null,
      rp_per_km: tipe === "pendapatan" ? rp_per_km : null,
      kategori: tipe === "pengeluaran" ? kategori : null,
      catatan: catatan || null,
      sumber_input: "manual" as const,
      created_at: new Date().toISOString(),
    };
    try {
      storage.add(t as never);
      // save memory type-aware (W3): platform for pendapatan, kategori for pengeluaran separately
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("ojoltrack_last_form", JSON.stringify({ tipe, platform }));
          localStorage.setItem("ojoltrack_last_kategori", JSON.stringify(kategori));
        }
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal simpan — penyimpanan penuh");
      return;
    }
    if (onSuccess) onSuccess();
    router.push("/");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <SegmentedControl options={["pendapatan","pengeluaran"]} value={tipe} onChange={(v)=>setTipe(v as never)} />

      {tipe === "pendapatan" ? (
        <>
          <div className="space-y-1">
            <Label>Platform</Label>
            <SegmentedControl options={["Shopee Drive","Grab","Lainnya"]} value={platform as string} onChange={(v)=>setPlatform(v as Platform)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Argo (Rp)</Label>
              <Input inputMode="numeric" placeholder="18000" value={nominalStr} onChange={(e)=>setNominalStr(e.target.value)} maxLength={12} />
              {nominal > 0 && <p className="text-xs text-zinc-500">{nominal.toLocaleString("id-ID")}</p>}
            </div>
            <div className="space-y-1">
              <Label>Jarak (KM, opsional)</Label>
              <Input inputMode="decimal" placeholder="6.2" value={jarakStr} onChange={(e)=>setJarakStr(e.target.value)} maxLength={6} />
              <p className="text-[11px] text-zinc-400">Salin dari estimasi aplikasi</p>
            </div>
          </div>
          {rp_per_km != null && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
              → Rp/KM: <b>{rp_per_km.toLocaleString("id-ID")}</b>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-1">
            <Label>Nominal (Rp)</Label>
            <Input inputMode="numeric" placeholder="25000" value={nominalStr} onChange={(e)=>setNominalStr(e.target.value)} maxLength={12} />
            {nominal > 0 && <p className="text-xs text-zinc-500">{nominal.toLocaleString("id-ID")}</p>}
          </div>
          <div className="space-y-1">
            <Label>Kategori</Label>
            <SegmentedControl options={["bensin","makan","servis","lainnya"]} value={kategori as string} onChange={(v)=>setKategori(v as Kategori)} />
            <p className="text-[11px] text-zinc-400">Otomatis dari catatan, bisa diedit</p>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Tanggal</Label>
          <Input type="date" value={tanggal} onChange={(e)=>setTanggal(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Waktu (HH:mm)</Label>
          <Input type="time" value={waktu} onChange={(e)=>setWaktu(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Catatan</Label>
        <Textarea rows={2} maxLength={200} placeholder={tipe==="pendapatan" ? "Orderan GrabBike" : "Isi bensin pagi"} value={catatan} onChange={(e)=>handleCatatanChange(e.target.value)} />
      </div>

      {ENABLE_VISION ? (
        <div className="space-y-2">
          <Button type="button" variant="ghost" className="w-full justify-center border border-dashed border-zinc-300" disabled={visionLoading} onClick={()=>document.getElementById("screenshot-input")?.click()}>
            {visionLoading ? "Membaca struk..." : "📷 Upload Screenshot (otomatis isi)"}
          </Button>
          <input id="screenshot-input" type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e)=>{
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) { setError("File max 10MB"); return; }
            if (!file.type.startsWith("image/")) { setError("Harus gambar (JPG/PNG/WebP)"); return; }
            const preview = URL.createObjectURL(file);
            setVisionPreview(preview);
            setVisionLoading(true);
            setError("");
            try {
              const form = new FormData();
              form.append("image", file);
              const res = await fetch("/api/extract", { method: "POST", body: form });
              const json = await res.json();
              if (json.ok) {
                setVisionResult(json.data);
              } else {
                setError(json.error || "Gagal membaca screenshot — silakan isi manual");
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : "Gagal upload — isi manual");
            } finally {
              setVisionLoading(false);
              (e.target as HTMLInputElement).value = "";
            }
          }} />
          {error && !visionResult && <p className="text-xs text-amber-600">{error} — isi manual tetap bisa</p>}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-3 text-center">
          <p className="text-xs text-zinc-500">📷 Fitur screenshot segera hadir — Fase 2</p>
          <p className="text-[11px] text-zinc-400">Untuk sekarang isi manual dulu</p>
        </div>
      )}

      {ENABLE_VISION && visionResult && (
        <ScreenshotConfirm result={visionResult} preview={visionPreview} onClose={()=>{ if (visionPreview) URL.revokeObjectURL(visionPreview); setVisionResult(null); setVisionPreview(""); }} />
      )}

      {error && !visionResult && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" size="lg" className="w-full">Simpan</Button>
    </form>
  );
}
