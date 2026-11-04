import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const PAGE_SIZE = 20;

export function pageFrom(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function DataTable({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-subtle/70 text-xs uppercase tracking-wide text-slate-500">
            <tr>{head.map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">{children}</tbody>
        </table>
      </div>
      {empty && <p className="p-8 text-center text-sm text-muted">Aucun résultat.</p>}
    </div>
  );
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-top", className)} {...props} />;
}

/** Barre de filtres en GET : recherche texte et listes déroulantes. */
export function FilterBar({ search, selects = [], hidden = {} }: {
  search?: { name?: string; value?: string; placeholder: string };
  selects?: { name: string; value?: string; label: string; options: [string, string][] }[];
  hidden?: Record<string, string>;
}) {
  return (
    <form className="mb-4 flex flex-col gap-3 sm:flex-row" role="search">
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {search && <Input name={search.name ?? "q"} defaultValue={search.value} placeholder={search.placeholder} aria-label="Rechercher" className="sm:max-w-sm" />}
      {selects.map((s) => (
        <Select key={s.name} name={s.name} defaultValue={s.value ?? ""} aria-label={s.label} className="sm:max-w-56">
          <option value="">{s.label} : tous</option>
          {s.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      ))}
      <Button type="submit" variant="navy"><Search /> Filtrer</Button>
    </form>
  );
}

export function Pagination({ page, total, params, basePath }: { page: number; total: number; params: Record<string, string | undefined>; basePath: string }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted">
      <p>{total} résultat{total > 1 ? "s" : ""} · page {Math.min(page, pages)}/{pages}</p>
      <div className="flex gap-2">
        {page > 1 ? <Link href={href(page - 1)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-3 hover:bg-subtle"><ChevronLeft className="size-4" />Précédent</Link> : null}
        {page < pages ? <Link href={href(page + 1)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-3 hover:bg-subtle">Suivant<ChevronRight className="size-4" /></Link> : null}
      </div>
    </div>
  );
}
