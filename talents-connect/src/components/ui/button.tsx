import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white shadow-sm hover:bg-primary-hover",
        secondary: "border border-border bg-surface text-foreground shadow-sm hover:bg-subtle",
        ghost: "text-foreground hover:bg-subtle",
        navy: "bg-navy text-white hover:bg-navy-900",
        success: "bg-success text-white hover:bg-green-700",
        danger: "bg-danger text-white hover:bg-red-700",
        "danger-ghost": "text-danger hover:bg-danger-soft",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Variants = VariantProps<typeof buttonVariants>;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, Variants {
  loading?: boolean;
}

export function Button({ className, variant, size, loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({ className, variant, size, ...props }: React.ComponentProps<typeof Link> & Variants) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
