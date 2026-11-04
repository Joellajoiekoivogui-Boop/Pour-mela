/* eslint-disable @next/next/no-img-element -- photos servies par Supabase Storage, tailles réduites */
import { cn, initials } from "@/lib/utils";

const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-base", xl: "size-20 text-xl" };

export function Avatar({
  person, size = "md", className,
}: {
  person: { first_name?: string | null; last_name?: string | null; avatar_url?: string | null } | null | undefined;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const label = `${person?.first_name ?? ""} ${person?.last_name ?? ""}`.trim();
  if (person?.avatar_url) {
    return <img src={person.avatar_url} alt={label ? `Photo de ${label}` : ""} className={cn("shrink-0 rounded-full object-cover", sizes[size], className)} loading="lazy" />;
  }
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet font-semibold text-white", sizes[size], className)}>
      {initials(person)}
    </span>
  );
}
