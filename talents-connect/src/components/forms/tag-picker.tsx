"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TagOption { id: number; label: string; group?: string }

/** Sélection multiple sous forme de puces, avec recherche si la liste est longue. */
export function TagPicker({ options, value, onChange, max = 40, searchable = false, label }: {
  options: TagOption[]; value: number[]; onChange: (ids: number[]) => void; max?: number; searchable?: boolean; label: string;
}) {
  const [q, setQ] = useState("");
  const selected = useMemo(() => new Set(value), [value]);
  const filtered = useMemo(() => {
    const n = q.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    return n ? options.filter((o) => `${o.label} ${o.group ?? ""}`.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().includes(n)) : options;
  }, [options, q]);

  const toggle = (id: number) => {
    if (selected.has(id)) onChange(value.filter((v) => v !== id));
    else if (value.length < max) onChange([...value, id]);
  };

  return (
    <div className="space-y-2.5">
      {searchable && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer…" className="pl-9" aria-label={`Filtrer : ${label}`} />
        </div>
      )}
      <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto p-0.5" role="group" aria-label={label}>
        {filtered.map((o) => {
          const on = selected.has(o.id);
          return (
            <button
              key={o.id} type="button" onClick={() => toggle(o.id)} aria-pressed={on}
              className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                on ? "border-primary bg-primary text-white" : "border-border bg-white text-slate-700 hover:border-slate-300 hover:bg-subtle")}
            >
              {on && <Check className="size-3.5" aria-hidden />}
              {o.label}
            </button>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-muted">Aucun résultat.</p>}
      </div>
      <p className="text-xs text-muted">{value.length} sélectionné{value.length > 1 ? "s" : ""}{max < 40 ? ` (maximum ${max})` : ""}</p>
    </div>
  );
}
