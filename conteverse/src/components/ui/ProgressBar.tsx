import { cx } from "@/lib/utils/colors";

export function ProgressBar({ value, className, label, color = "bg-orange-500" }: { value: number; className?: string; label: string; color?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className={cx("h-3 w-full overflow-hidden rounded-full bg-encre/10", className)} role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx("h-full rounded-full transition-[width] duration-700", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
