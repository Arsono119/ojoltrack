"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function LoginForm() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const redirect = sp.get("redirect") || "/";
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) { setError("Email tidak valid"); return; }
    if (password.length < 6) { setError("Password min 6 karakter"); return; }
    setLoading(true);
    try {
      if (mode === "login") await signIn(email, password);
      else await signUp(email, password);
      router.push(redirect);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setLoading(false); }
  };
  return (
    <Card>
      <form onSubmit={handle} className="space-y-3">
        <div className="flex gap-2 text-sm">
          <button type="button" onClick={()=>setMode("login")} className={`flex-1 py-2 rounded-xl font-semibold ${mode==="login" ? "bg-zinc-900 text-white" : "bg-zinc-100"}`}>Masuk</button>
          <button type="button" onClick={()=>setMode("signup")} className={`flex-1 py-2 rounded-xl font-semibold ${mode==="signup" ? "bg-zinc-900 text-white" : "bg-zinc-100"}`}>Daftar</button>
        </div>
        <div className="space-y-1"><Label>Email</Label><Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="budi@email.com" /></div>
        <div className="space-y-1"><Label>Password</Label><Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="min 6 karakter" /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {mode==="signup" && <p className="text-xs text-zinc-500">Setelah daftar, cek email jika verifikasi aktif, lalu login.</p>}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? "..." : mode==="login" ? "Masuk" : "Daftar"}</Button>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Login OjolTrack</h1>
      <p className="text-sm text-zinc-500">Login agar data sync di HP &amp; laptop (per-user, tidak tertabrak).</p>
      <Suspense fallback={<Card><p className="text-sm text-zinc-500">Memuat...</p></Card>}><LoginForm /></Suspense>
      <p className="text-xs text-zinc-400 text-center">Data per email terpisah — email beda tidak akan tertabrak.</p>
    </div>
  );
}
