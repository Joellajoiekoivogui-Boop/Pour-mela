"use client";

import { Stamp } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";

export function DiscoveredMarker({ code }: { code: string }) {
  const { state } = useProgress();
  if (!state.countries[code]) return null;
  return (
    <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-vert-50 px-2 py-1 text-xs font-extrabold text-vert-700" title="Pays tamponné dans ton passeport">
      <Stamp className="size-4" aria-hidden /> Visité
    </span>
  );
}
