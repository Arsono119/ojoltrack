import React from "react";

export function Button({ variant = "primary", size = "md", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "secondary"; size?: "md" | "lg" }) {
  const base = "inline-flex items-center justify-center rounded-xl font-semibold transition active:scale-[0.98] disabled:opacity-50";
  const variants: Record<string, string> = {
    primary: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
    secondary: "bg-zinc-900 text-white hover:bg-zinc-800",
    ghost: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200",
  };
  const sizes: Record<string, string> = {
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
