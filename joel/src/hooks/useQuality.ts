"use client";

import { createContext, useContext } from "react";
import { SERVER_QUALITY, type Quality } from "@/lib/quality";

export const QualityContext = createContext<Quality>(SERVER_QUALITY);

export function useQuality() {
  return useContext(QualityContext);
}
