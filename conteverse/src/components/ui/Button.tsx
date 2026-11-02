import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/utils/colors";

type Variant = "primary" | "secondary" | "ghost" | "vert" | "violet";
const styles: Record<Variant, string> = {
  primary: "bg-orange-500 text-white hover:bg-orange-600 shadow-[0_4px_0_0_var(--color-orange-700)] active:translate-y-0.5 active:shadow-none",
  vert: "bg-vert-500 text-white hover:bg-vert-600 shadow-[0_4px_0_0_var(--color-vert-700)] active:translate-y-0.5 active:shadow-none",
  violet: "bg-violet-500 text-white hover:bg-violet-600 shadow-[0_4px_0_0_var(--color-violet-700)] active:translate-y-0.5 active:shadow-none",
  secondary: "bg-white text-encre ring-2 ring-encre/10 hover:ring-orange-300 hover:bg-orange-50",
  ghost: "text-encre hover:bg-encre/5",
};
const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-extrabold transition disabled:opacity-50 disabled:pointer-events-none min-h-12";

export function ButtonLink({ href, variant = "primary", className, children, ...rest }: { href: string; variant?: Variant; className?: string; children: ReactNode } & Omit<ComponentProps<typeof Link>, "href">) {
  return (
    <Link href={href} className={cx(base, styles[variant], className)} {...rest}>
      {children}
    </Link>
  );
}

export function Button({ variant = "primary", className, ...rest }: { variant?: Variant } & ComponentProps<"button">) {
  return <button type="button" className={cx(base, styles[variant], className)} {...rest} />;
}
