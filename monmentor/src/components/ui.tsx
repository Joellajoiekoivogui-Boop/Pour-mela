import Link from "next/link";
import { domainLabel } from "@/lib/domains";
import { initials } from "@/lib/format";

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  // Couleur stable dérivée du nom, sans photo à charger.
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span
      aria-hidden="true"
      className="inline-grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${h} 45% 38%)` }}
    >
      {initials(name)}
    </span>
  );
}

export function DomainChips({ ids, short = true }: { ids: string[]; short?: boolean }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {ids.map((d) => (
        <span key={d} className="chip">{domainLabel(d, short)}</span>
      ))}
    </span>
  );
}

const TONES = {
  neutral: "bg-surface-2 text-ink-2",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  accent: "bg-accent-soft text-accent",
  info: "bg-info-soft text-ink",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>{children}</span>;
}

export function VerifiedBadge({ level }: { level: number }) {
  if (level >= 3) return <Badge tone="ok">✓ Vérifié·e</Badge>;
  if (level === 2) return <Badge tone="info">Parcours vérifié</Badge>;
  return <Badge tone="warn">Vérification en cours</Badge>;
}

export function DemoBadge({ show }: { show: boolean }) {
  return show ? <Badge tone="warn">Démo</Badge> : null;
}

export function PageHeader({ eyebrow, title, lead, actions }: { eyebrow?: string; title: string; lead?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="grid max-w-2xl gap-2">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {lead && <p className="text-ink-2">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="card grid justify-items-start gap-2 p-6">
      <p className="font-semibold">{title}</p>
      {children && <div className="text-sm text-ink-2">{children}</div>}
      {action && <Link href={action.href} className="btn-primary mt-2">{action.label}</Link>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="card grid gap-1 p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-3">{label}</span>
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      {hint && <span className="text-xs text-ink-3">{hint}</span>}
    </div>
  );
}

export function Progress({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="grid gap-1">
      <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-ok" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "ok" | "warn" | "bad"; children: React.ReactNode }) {
  const cls = { info: "bg-info-soft", ok: "bg-ok-soft text-ok", warn: "bg-warn-soft text-warn", bad: "bg-bad-soft text-bad" }[tone];
  return <div role={tone === "bad" ? "alert" : "status"} className={`rounded-lg px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

/** Rendu léger du texte des ressources : titres « ## », listes « - » et « 1. », gras « ** ». */
export function RichText({ text }: { text: string }) {
  const inline = (str: string) =>
    str.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
    );
  type Block = { kind: "h" | "p" | "ul" | "ol"; lines: string[] };
  const blocks: Block[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const last = blocks.at(-1);
    if (!line) { blocks.push({ kind: "p", lines: [] }); continue; }
    if (line.startsWith("## ")) { blocks.push({ kind: "h", lines: [line.slice(3)] }); continue; }
    const kind = /^- /.test(line) ? "ul" : /^\d+\. /.test(line) ? "ol" : "p";
    const content = line.replace(/^(- |\d+\. )/, "");
    if (last && last.kind === kind) last.lines.push(content);
    else blocks.push({ kind, lines: [content] });
  }
  return (
    <div className="prose-mm">
      {blocks.filter((b) => b.lines.length).map((b, i) =>
        b.kind === "h" ? <h2 key={i}>{b.lines[0]}</h2>
          : b.kind === "ul" ? <ul key={i}>{b.lines.map((l, j) => <li key={j}>{inline(l)}</li>)}</ul>
          : b.kind === "ol" ? <ol key={i}>{b.lines.map((l, j) => <li key={j}>{inline(l)}</li>)}</ol>
          : <p key={i}>{inline(b.lines.join(" "))}</p>,
      )}
    </div>
  );
}
