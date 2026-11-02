import type { ReactNode } from "react";

export function SectionTitle({ eyebrow, title, children, id }: { eyebrow?: string; title: string; children?: ReactNode; id?: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      {eyebrow && <p className="mb-2 text-sm font-extrabold uppercase tracking-widest text-orange-600">{eyebrow}</p>}
      <h2 id={id} className="text-3xl font-black leading-tight sm:text-4xl">
        {title}
      </h2>
      {children && <p className="mt-3 text-lg text-encre-doux">{children}</p>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, children, aside }: { eyebrow?: string; title: string; children?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="motif border-b border-encre/5">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:py-14">
        <div className="max-w-2xl">
          {eyebrow && <p className="mb-2 text-sm font-extrabold uppercase tracking-widest text-orange-600">{eyebrow}</p>}
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">{title}</h1>
          {children && <div className="mt-3 text-lg text-encre-doux">{children}</div>}
        </div>
        {aside}
      </div>
    </header>
  );
}
