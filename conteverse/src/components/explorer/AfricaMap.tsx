"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { GeoJsonObject, Feature } from "geojson";
import "leaflet/dist/leaflet.css";
import { territoryByCode } from "@/data/africa";
import { isCountryCode } from "@/data/countries";
import { useProgress } from "@/components/progress/ProgressProvider";

// Carte interactive Leaflet SANS fonds de carte (tuiles) : seules les
// frontières sont chargées (~180 Ko, mises en cache par le service worker),
// ce qui la rend utilisable avec une connexion faible ou hors ligne.

type Status = "loading" | "ready" | "error";

const COLORS = { available: "#f26a0f", discovered: "#189557", soon: "#f1dcc2", disputed: "#e5e1da" };

export function AfricaMap({ onSelectSoon }: { onSelectSoon: (code: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { state } = useProgress();
  const [status, setStatus] = useState<Status>("loading");
  const discoveredRef = useRef(state.countries);
  const layerRef = useRef<import("leaflet").GeoJSON | null>(null);
  const onSoonRef = useRef(onSelectSoon);

  useEffect(() => {
    onSoonRef.current = onSelectSoon;
  }, [onSelectSoon]);

  const styleFor = (code: string) => {
    const t = territoryByCode[code];
    const available = isCountryCode(code);
    const fill = t?.disputed ? COLORS.disputed : available ? (discoveredRef.current[code] ? COLORS.discovered : COLORS.available) : COLORS.soon;
    return { color: "#ffffff", weight: 1, fillColor: fill, fillOpacity: 1 };
  };

  useEffect(() => {
    discoveredRef.current = state.countries;
    layerRef.current?.eachLayer((l) => {
      const layer = l as import("leaflet").Path & { feature?: Feature };
      const code = (layer.feature?.properties as { code: string } | undefined)?.code;
      if (code) layer.setStyle(styleFor(code));
    });
  }, [state.countries]);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    (async () => {
      try {
        const L = (await import("leaflet")).default;
        const res = await fetch("/data/africa.geojson");
        if (!res.ok) throw new Error("geojson");
        const data = (await res.json()) as GeoJsonObject;
        if (cancelled || !ref.current) return;
        map = L.map(ref.current, { zoomControl: true, attributionControl: true, minZoom: 2, maxZoom: 7, zoomSnap: 0.25, maxBounds: [[-45, -35], [45, 70]] });
        map.attributionControl.setPrefix(false).addAttribution("Frontières : Natural Earth");
        const layer = L.geoJSON(data, {
          style: (f) => styleFor((f?.properties as { code: string }).code),
          onEachFeature: (f, lyr) => {
            const code = (f.properties as { code: string }).code;
            const t = territoryByCode[code];
            const label = t ? (t.disputed ? `${t.name} (statut non réglé)` : `${t.name}${isCountryCode(code) ? " — fiche disponible" : ""}`) : code;
            lyr.bindTooltip(label, { sticky: true, className: "pays-tooltip" });
            lyr.on({
              mouseover: (e) => (e.target as import("leaflet").Path).setStyle({ weight: 3, color: "#1f1a2e" }),
              mouseout: (e) => (e.target as import("leaflet").Path).setStyle({ weight: 1, color: "#ffffff" }),
              click: () => {
                if (isCountryCode(code)) router.push(`/explorer/${code.toLowerCase()}`);
                else onSoonRef.current(code);
              },
            });
          },
        }).addTo(map);
        layerRef.current = layer;
        map.fitBounds(layer.getBounds(), { padding: [10, 10] });
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [router]);

  return (
    <div className="relative">
      <div ref={ref} className="carte-afrique h-[440px] w-full overflow-hidden rounded-3xl ring-1 ring-encre/10 sm:h-[560px]" aria-label="Carte interactive de l'Afrique. Utilise aussi la liste des pays pour naviguer au clavier." role="region" />
      {status === "loading" && (
        <div className="absolute inset-0 grid place-items-center rounded-3xl bg-bleu-50" role="status">
          <p className="animate-pulse font-extrabold text-bleu-700">Chargement de la carte…</p>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 grid place-items-center rounded-3xl bg-jaune-50 p-6 text-center" role="alert">
          <p className="font-bold text-jaune-600">La carte n&apos;a pas pu être chargée (connexion faible ?). Utilise la liste des pays ci-dessous : elle fonctionne toujours.</p>
        </div>
      )}
      <ul className="mt-3 flex flex-wrap gap-4 text-sm font-bold text-encre-doux" aria-label="Légende">
        <li className="flex items-center gap-2"><span className="size-4 rounded" style={{ background: COLORS.available }} /> Fiche disponible</li>
        <li className="flex items-center gap-2"><span className="size-4 rounded" style={{ background: COLORS.discovered }} /> Déjà découvert</li>
        <li className="flex items-center gap-2"><span className="size-4 rounded" style={{ background: COLORS.soon }} /> Bientôt</li>
      </ul>
    </div>
  );
}
