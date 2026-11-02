"use client";

import { useEffect } from "react";
import { useProgress } from "@/components/progress/ProgressProvider";

/** Tamponne le pays dans le passeport dès l'ouverture de sa fiche. */
export function DiscoverOnView({ code }: { code: string }) {
  const { dispatch, ready } = useProgress();
  useEffect(() => {
    if (ready) dispatch({ type: "discoverCountry", code });
  }, [ready, code, dispatch]);
  return null;
}
