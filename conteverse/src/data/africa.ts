import type { FlagSpec } from "../types/content.ts";

/** Les 54 États africains membres de l'ONU + le Sahara occidental (territoire au statut non réglé). */
export interface AfricanTerritory {
  code: string;
  name: string;
  capital?: string;
  /** Territoire au statut contesté (affiché sans fiche). */
  disputed?: boolean;
}

export const africanTerritories: AfricanTerritory[] = [
  { code: "DZ", name: "Algérie", capital: "Alger" },
  { code: "AO", name: "Angola", capital: "Luanda" },
  { code: "BJ", name: "Bénin", capital: "Porto-Novo" },
  { code: "BW", name: "Botswana", capital: "Gaborone" },
  { code: "BF", name: "Burkina Faso", capital: "Ouagadougou" },
  { code: "BI", name: "Burundi", capital: "Gitega" },
  { code: "CV", name: "Cap-Vert", capital: "Praia" },
  { code: "CM", name: "Cameroun", capital: "Yaoundé" },
  { code: "CF", name: "République centrafricaine", capital: "Bangui" },
  { code: "TD", name: "Tchad", capital: "N'Djaména" },
  { code: "KM", name: "Comores", capital: "Moroni" },
  { code: "CG", name: "République du Congo", capital: "Brazzaville" },
  { code: "CD", name: "République démocratique du Congo", capital: "Kinshasa" },
  { code: "CI", name: "Côte d'Ivoire", capital: "Yamoussoukro" },
  { code: "DJ", name: "Djibouti", capital: "Djibouti" },
  { code: "EG", name: "Égypte", capital: "Le Caire" },
  { code: "GQ", name: "Guinée équatoriale", capital: "Malabo" },
  { code: "ER", name: "Érythrée", capital: "Asmara" },
  { code: "SZ", name: "Eswatini", capital: "Mbabane" },
  { code: "ET", name: "Éthiopie", capital: "Addis-Abeba" },
  { code: "GA", name: "Gabon", capital: "Libreville" },
  { code: "GM", name: "Gambie", capital: "Banjul" },
  { code: "GH", name: "Ghana", capital: "Accra" },
  { code: "GN", name: "Guinée", capital: "Conakry" },
  { code: "GW", name: "Guinée-Bissau", capital: "Bissau" },
  { code: "KE", name: "Kenya", capital: "Nairobi" },
  { code: "LS", name: "Lesotho", capital: "Maseru" },
  { code: "LR", name: "Liberia", capital: "Monrovia" },
  { code: "LY", name: "Libye", capital: "Tripoli" },
  { code: "MG", name: "Madagascar", capital: "Antananarivo" },
  { code: "MW", name: "Malawi", capital: "Lilongwe" },
  { code: "ML", name: "Mali", capital: "Bamako" },
  { code: "MR", name: "Mauritanie", capital: "Nouakchott" },
  { code: "MU", name: "Maurice", capital: "Port-Louis" },
  { code: "MA", name: "Maroc", capital: "Rabat" },
  { code: "MZ", name: "Mozambique", capital: "Maputo" },
  { code: "NA", name: "Namibie", capital: "Windhoek" },
  { code: "NE", name: "Niger", capital: "Niamey" },
  { code: "NG", name: "Nigeria", capital: "Abuja" },
  { code: "RW", name: "Rwanda", capital: "Kigali" },
  { code: "ST", name: "Sao Tomé-et-Principe", capital: "Sao Tomé" },
  { code: "SN", name: "Sénégal", capital: "Dakar" },
  { code: "SC", name: "Seychelles", capital: "Victoria" },
  { code: "SL", name: "Sierra Leone", capital: "Freetown" },
  { code: "SO", name: "Somalie", capital: "Mogadiscio" },
  { code: "ZA", name: "Afrique du Sud", capital: "Pretoria (siège du gouvernement)" },
  { code: "SS", name: "Soudan du Sud", capital: "Djouba" },
  { code: "SD", name: "Soudan", capital: "Khartoum" },
  { code: "TZ", name: "Tanzanie", capital: "Dodoma" },
  { code: "TG", name: "Togo", capital: "Lomé" },
  { code: "TN", name: "Tunisie", capital: "Tunis" },
  { code: "UG", name: "Ouganda", capital: "Kampala" },
  { code: "ZM", name: "Zambie", capital: "Lusaka" },
  { code: "ZW", name: "Zimbabwe", capital: "Harare" },
  { code: "EH", name: "Sahara occidental", disputed: true },
];

export const territoryByCode = Object.fromEntries(africanTerritories.map((t) => [t.code, t])) as Record<
  string,
  AfricanTerritory
>;

/** Nombre d'États africains membres de l'ONU. */
export const AFRICAN_UN_MEMBERS = africanTerritories.filter((t) => !t.disputed).length;

/**
 * Drapeaux dessinés en SVG (géométrie simplifiée, couleurs officielles
 * approchées). Utilisés par les fiches pays et le quiz des drapeaux.
 */
export const flags: Record<string, FlagSpec> = {
  GN: { orientation: "vertical", stripes: ["#CE1126", "#FCD116", "#009460"] },
  ML: { orientation: "vertical", stripes: ["#14B53A", "#FCD116", "#CE1126"] },
  CI: { orientation: "vertical", stripes: ["#F77F00", "#FFFFFF", "#009E60"] },
  SN: { orientation: "vertical", stripes: ["#00853F", "#FDEF42", "#E31B23"], emblem: { shape: "star", color: "#00853F" } },
  GH: { orientation: "horizontal", stripes: ["#CE1126", "#FCD116", "#006B3F"], emblem: { shape: "star", color: "#000000" } },
  NG: { orientation: "vertical", stripes: ["#008751", "#FFFFFF", "#008751"] },
  CM: { orientation: "vertical", stripes: ["#007A5E", "#CE1126", "#FCD116"], emblem: { shape: "star", color: "#FCD116" } },
  TD: { orientation: "vertical", stripes: ["#002664", "#FECB00", "#C60C30"] },
  GA: { orientation: "horizontal", stripes: ["#009E60", "#FCD116", "#3A75C4"] },
  SL: { orientation: "horizontal", stripes: ["#1EB53A", "#FFFFFF", "#0072C6"] },
  NE: { orientation: "horizontal", stripes: ["#E05206", "#FFFFFF", "#0DB02B"], emblem: { shape: "circle", color: "#E05206" } },
  BF: { orientation: "horizontal", stripes: ["#EF2B2D", "#009E49"], emblem: { shape: "star", color: "#FCD116" } },
  BJ: { orientation: "benin", stripes: ["#008751", "#FCD116", "#E8112D"] },
};
