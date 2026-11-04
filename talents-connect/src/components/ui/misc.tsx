import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200/70", className)} {...props} />;
}

export function Progress({ value, className, tone = "primary", label }: { value: number; className?: string; tone?: "primary" | "success" | "violet"; label?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const color = tone === "success" ? "bg-success" : tone === "violet" ? "bg-violet" : "bg-primary";
  return (
    <div role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label} className={cn("h-2 w-full overflow-hidden rounded-full bg-subtle", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Separator({ className }: { className?: string }) {
  return <hr className={cn("border-border", className)} />;
}

const alertTones = {
  info: { icon: Info, cls: "border-blue-200 bg-primary-soft text-blue-900" },
  success: { icon: CheckCircle2, cls: "border-green-200 bg-success-soft text-green-900" },
  warning: { icon: TriangleAlert, cls: "border-amber-200 bg-warning-soft text-amber-900" },
  danger: { icon: AlertCircle, cls: "border-red-200 bg-danger-soft text-red-900" },
};

export function Alert({ tone = "info", title, children, className }: { tone?: keyof typeof alertTones; title?: string; children?: React.ReactNode; className?: string }) {
  const { icon: Icon, cls } = alertTones[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg border p-4 text-sm", cls, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }: {
  icon: React.ComponentType<{ className?: string }>; title: string; description?: string; action?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-6 py-12 text-center", className)}>
      <span className="mb-3 inline-flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon className="size-5" />
      </span>
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
