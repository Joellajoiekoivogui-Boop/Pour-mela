import { Lock } from "lucide-react";
import type { Badge } from "@/lib/progress/badges";
import { Icon } from "@/components/ui/CategoryIcon";
import { cx, tone } from "@/lib/utils/colors";

export function BadgeMedal({ badge, earned, size = "md" }: { badge: Badge; earned: boolean; size?: "md" | "lg" }) {
  const dim = size === "lg" ? "size-28" : "size-16";
  const ic = size === "lg" ? "size-12" : "size-7";
  return (
    <div
      className={cx(
        "relative grid place-items-center rounded-full ring-4",
        dim,
        earned ? cx("bg-linear-to-br shadow-lg", tone[badge.color].grad, "ring-white text-white") : "bg-encre/5 text-encre/30 ring-encre/5",
      )}
    >
      <Icon name={badge.icon} className={ic} />
      {!earned && <Lock className="absolute -bottom-1 -right-1 size-6 rounded-full bg-white p-1 text-encre/40 shadow" aria-hidden />}
    </div>
  );
}
