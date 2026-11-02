"use client";

import { CircleCheck } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";

export function ReadMarker({ slug }: { slug: string }) {
  const { state } = useProgress();
  if (!state.articlesRead[slug]) return null;
  return (
    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-extrabold text-vert-600">
      <CircleCheck className="size-4" aria-hidden /> Lu
    </span>
  );
}
