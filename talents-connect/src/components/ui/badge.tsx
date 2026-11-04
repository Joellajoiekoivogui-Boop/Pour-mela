import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3", {
  variants: {
    tone: {
      neutral: "bg-subtle text-slate-700",
      primary: "bg-primary-soft text-primary",
      violet: "bg-violet-soft text-violet",
      success: "bg-success-soft text-success",
      warning: "bg-warning-soft text-warning",
      danger: "bg-danger-soft text-danger",
      navy: "bg-navy text-white",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ className, tone, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;
