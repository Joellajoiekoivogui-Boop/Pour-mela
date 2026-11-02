"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Enregistre le service worker (PWA, lecture hors connexion) et signale la perte de réseau. */
export function ServiceWorker() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div role="status" className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-encre px-4 py-2 text-sm font-bold text-white shadow-lg">
      <WifiOff className="size-4" aria-hidden /> Hors connexion : tes articles enregistrés restent disponibles.
    </div>
  );
}
