import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { homeForRole } from "@/lib/labels";

export const dynamic = "force-dynamic";

/** Redirige l'utilisateur connecté vers le tableau de bord de son rôle. */
export default async function SpaceRedirect() {
  const { profile } = await requireSession("/espace");
  redirect(homeForRole(profile.role));
}
