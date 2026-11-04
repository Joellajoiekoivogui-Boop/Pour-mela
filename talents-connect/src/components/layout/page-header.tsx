import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, className }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted sm:text-[15px]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = "primary" }: {
  label: string; value: React.ReactNode; hint?: string; icon: React.ComponentType<{ className?: string }>; tone?: "primary" | "violet" | "success" | "warning";
}) {
  const tones = { primary: "bg-primary-soft text-primary", violet: "bg-violet-soft text-violet", success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning" };
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        <span className={cn("inline-flex size-9 items-center justify-center rounded-lg", tones[tone])}><Icon className="size-4" /></span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-navy">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
