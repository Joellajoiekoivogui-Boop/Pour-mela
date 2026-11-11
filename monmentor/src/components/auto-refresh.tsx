"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Rafraîchit la page toutes les `seconds` secondes tant qu'elle est visible (messagerie en direct). */
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
