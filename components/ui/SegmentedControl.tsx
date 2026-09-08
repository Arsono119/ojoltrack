"use client";
export function SegmentedControl({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-xl bg-zinc-100 p-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${value === opt ? "bg-white shadow text-zinc-900" : "text-zinc-500"}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
