"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { ExtractResult } from "@/lib/vision";
import { calcRpPerKm } from "@/lib/calc";
import { parseRupiah } from "@/lib/parse";
import { Input, Textarea, Label } from "./ui/Input";
import { Button } from "./ui/Button";
import { SegmentedControl } from "./ui/SegmentedControl";
import { storage } from "@/lib/storage";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import type { Platform } from "@/lib/types";

export default function ScreenshotConfirm({ result, preview, onClose }: { result: ExtractResult; preview: string; onClose: () => void }) {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>((result.platform as Platform) || "Grab");
  const [nominalStr, setNominalStr] = useState(result.nominal ? String(result.nominal) : "");
  const [jarakStr, setJarakStr] = useState(result.jarak_km ? String(result.jarak_km) : "");
  const [waktu, setWaktu] = useState(result.waktu || "");
  const [catatan, setCatatan] = useState(result.keterangan || "");
  const [tanggal] = useState(new Date().toISOString().slice(0,10));

  const nominal = parseRupiah(nominalStr);
  const jarak_km = jarakStr ? parseFloat(jarakStr.replace(",",".")) : null;
  const rp_per_km = calcRpPerKm(nominal, jarak_km);

  const handleSave = () => {
    if (!nominal || nominal <= 0) { alert("Nominal harus >0"); return; }
    storage.add({
      id: nanoid(),
      tipe: "pendapatan",
      tanggal,
      waktu: waktu || null,
      nominal,
      platform,
      jarak_km: jarak_km && jarak_km > 0 ? jarak_km : null,
      rp_per_km,
      kategori: null,
      catatan: catatan || null,
      sumber_input: "screenshot",
      created_at: new Date().toISOString(),
    } as never);
    onClose();
    router.push("/");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
          <h2 className="font-bold">Konfirmasi Data</h2>
          <button onClick={onClose} className="text-zinc-500">✕</button>
        </div>
        <div className="p-4 space-y-4">
          {preview && <img src={preview} alt="preview" className="w-full rounded-xl border" />}
          <p className="text-sm text-zinc-600">Terdeteksi otomatis — cek kembali sebelum simpan ✏️</p>

          <div className="space-y-1">
            <Label>Platform</Label>
            <SegmentedControl options={["Shopee Drive","Grab","Lainnya"]} value={platform as string} onChange={(v)=>setPlatform(v as Platform)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Argo (Rp)</Label><Input inputMode="numeric" value={nominalStr} onChange={(e)=>setNominalStr(e.target.value)} /></div>
            <div className="space-y-1"><Label>Jarak (KM)</Label><Input inputMode="decimal" value={jarakStr} onChange={(e)=>setJarakStr(e.target.value)} placeholder="opsional" /></div>
          </div>
          {rp_per_km != null && <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">→ Rp/KM: <b>{rp_per_km.toLocaleString("id-ID")}</b></div>}
          {jarak_km == null && <p className="text-xs text-amber-600">Jarak tidak terdeteksi — isi manual dari estimasi di aplikasi (opsional)</p>}
          <div className="space-y-1"><Label>Waktu (HH:mm)</Label><Input type="time" value={waktu} onChange={(e)=>setWaktu(e.target.value)} /></div>
          <div className="space-y-1"><Label>Catatan</Label><Textarea rows={2} value={catatan} onChange={(e)=>setCatatan(e.target.value)} /></div>
          <p className="text-xs text-amber-600">⚠️ Cek kembali sebelum simpan</p>
          <Button size="lg" className="w-full" onClick={handleSave}>Simpan Data</Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>Batal</Button>
        </div>
      </div>
    </div>
  );
}
