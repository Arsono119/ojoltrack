"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
export default function HeaderAuth() {
  const { user, loading, signOut } = useAuth();
  if (loading) return <div className="h-8 bg-zinc-50 border-b border-zinc-100" />;
  if (!user) return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs">
      <span>🔒 <b>Login</b> untuk sync HP ↔ Laptop (data per email terpisah)</span>
      <Link href="/login" className="rounded-full bg-zinc-900 text-white px-3 py-1 font-semibold">Login</Link>
    </div>
  );
  return (
    <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between text-xs">
      <span className="truncate">👤 {user.email}</span>
      <button onClick={signOut} className="rounded-full bg-white border border-green-200 px-3 py-1 font-semibold">Logout</button>
    </div>
  );
}
