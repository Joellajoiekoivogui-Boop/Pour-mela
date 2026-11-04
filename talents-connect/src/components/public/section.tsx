import { cn } from "@/lib/utils";

export function Section({ id, eyebrow, title, description, children, className, muted }: {
  id?: string; eyebrow?: string; title: string; description?: string; children: React.ReactNode; className?: string; muted?: boolean;
}) {
  return (
    <section id={id} className={cn("py-16 sm:py-24", muted && "bg-background", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          {eyebrow && <p className="mb-3 text-sm font-semibold text-primary">{eyebrow}</p>}
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-navy sm:text-4xl">{title}</h2>
          {description && <p className="mt-4 text-pretty text-base text-muted sm:text-lg">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

export function PageHero({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
      <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
        {eyebrow && <p className="mb-3 text-sm font-semibold text-primary">{eyebrow}</p>}
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-navy sm:text-5xl">{title}</h1>
        {description && <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted sm:text-lg">{description}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 text-[15px] leading-relaxed text-slate-700 sm:px-6 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-navy [&_li]:mb-1.5 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5">
      {children}
    </div>
  );
}
