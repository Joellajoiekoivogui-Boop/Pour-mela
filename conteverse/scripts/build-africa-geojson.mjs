// Génère public/data/africa.geojson à partir de world-atlas (Natural Earth, domaine public).
// Usage : npm run geo
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { feature } from "topojson-client";

// Codes ISO 3166-1 numériques -> code alpha-2 (pays africains + Sahara occidental).
const AFRICA = {
  "012": "DZ", "024": "AO", "204": "BJ", "072": "BW", "854": "BF", "108": "BI", "132": "CV",
  "120": "CM", "140": "CF", "148": "TD", "174": "KM", "178": "CG", "180": "CD", "384": "CI",
  "262": "DJ", "818": "EG", "226": "GQ", "232": "ER", "748": "SZ", "231": "ET", "266": "GA",
  "270": "GM", "288": "GH", "324": "GN", "624": "GW", "404": "KE", "426": "LS", "430": "LR",
  "434": "LY", "450": "MG", "454": "MW", "466": "ML", "478": "MR", "480": "MU", "504": "MA",
  "508": "MZ", "516": "NA", "562": "NE", "566": "NG", "646": "RW", "678": "ST", "686": "SN",
  "690": "SC", "694": "SL", "706": "SO", "710": "ZA", "728": "SS", "729": "SD", "834": "TZ",
  "768": "TG", "788": "TN", "800": "UG", "894": "ZM", "716": "ZW", "732": "EH",
};

const topo = JSON.parse(readFileSync(new URL("../node_modules/world-atlas/countries-50m.json", import.meta.url)));
const all = feature(topo, topo.objects.countries).features;

const round = (c) => (typeof c[0] === "number" ? [Math.round(c[0] * 100) / 100, Math.round(c[1] * 100) / 100] : c.map(round));
// Retire les points consécutifs identiques après arrondi.
const dedupe = (ring) => ring.filter((p, i) => i === 0 || p[0] !== ring[i - 1][0] || p[1] !== ring[i - 1][1]);
const clean = (geom) => {
  if (geom.type === "Polygon") return { type: "Polygon", coordinates: round(geom.coordinates).map(dedupe).filter((r) => r.length >= 4) };
  return { type: "MultiPolygon", coordinates: round(geom.coordinates).map((poly) => poly.map(dedupe).filter((r) => r.length >= 4)).filter((p) => p.length) };
};

const out = [];
for (const f of all) {
  let code = AFRICA[f.id];
  // Natural Earth isole le Somaliland sans code ISO : il fait partie de la Somalie (reconnaissance internationale).
  if (!code && f.properties.name === "Somaliland") code = "SO";
  if (!code) continue;
  out.push({ type: "Feature", properties: { code }, geometry: clean(f.geometry) });
}

const missing = Object.values(AFRICA).filter((c) => !out.some((f) => f.properties.code === c));
mkdirSync(new URL("../public/data/", import.meta.url), { recursive: true });
writeFileSync(new URL("../public/data/africa.geojson", import.meta.url), JSON.stringify({ type: "FeatureCollection", features: out }));
console.log(`${out.length} entités écrites. Manquants : ${missing.join(", ") || "aucun"}`);
