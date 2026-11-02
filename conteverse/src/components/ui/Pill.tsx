import type { ReactNode } from "react";
import { cx } from "@/lib/utils/colors";

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold", className ?? "bg-encre/5 text-encre-doux")}>{children}</span>;
}
