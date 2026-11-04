import { cn } from "@/lib/utils";

const field =
  "w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:bg-subtle aria-[invalid=true]:border-danger";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, "min-h-24 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(field, "h-10 pr-8", className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}

/** Champ de formulaire : libellé, aide, contrôle et message d'erreur accessible. */
export function Field({
  label, htmlFor, error, hint, children, className, required,
}: {
  label: string; htmlFor: string; error?: string; hint?: string; children: React.ReactNode; className?: string; required?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-danger" aria-hidden> *</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
