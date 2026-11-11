export function LegalPage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto grid max-w-3xl gap-4 px-4 py-12">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-sm text-ink-3">Version du {updated}</p>
      <div className="prose-mm grid gap-1 text-ink-2 [&_h2]:text-ink">{children}</div>
    </article>
  );
}

/** Information que l'éditeur du site doit renseigner avant la mise en ligne publique. */
export function ToFill({ children }: { children: React.ReactNode }) {
  return <mark className="rounded bg-warn-soft px-1 text-warn">[À compléter : {children}]</mark>;
}
