import type { SceneName } from "../types/content.ts";

export type NaturalRegion = "maritime" | "moyenne" | "haute" | "forestiere";

export const naturalRegions: { id: NaturalRegion; name: string; also?: string; scene: SceneName; text: string }[] = [
  { id: "maritime", name: "Guinée maritime", also: "Basse-Guinée", scene: "mer", text: "La côte atlantique : climat chaud et humide, mangroves, rizières et ports." },
  { id: "moyenne", name: "Moyenne-Guinée", also: "Fouta-Djalon", scene: "fouta", text: "Plateaux, falaises et cascades ; un climat plus frais ; les sources de grands fleuves." },
  { id: "haute", name: "Haute-Guinée", scene: "savane", text: "Savanes traversées par le Niger et ses affluents ; le cœur de l'ancien Manding." },
  { id: "forestiere", name: "Guinée forestière", scene: "foret", text: "Forêts humides et montagnes, dont le mont Nimba, point culminant du pays." },
];

/** Les huit régions administratives (Conakry a un statut de zone spéciale). */
export const cities: { name: string; region: NaturalRegion; text: string }[] = [
  { name: "Conakry", region: "maritime", text: "La capitale, née sur l'île de Tombo et étendue sur la presqu'île de Kaloum. C'est le principal port du pays." },
  { name: "Kindia", region: "maritime", text: "Ville réputée pour ses fruits (mangues, ananas, bananes). Non loin se trouve la cascade du « Voile de la Mariée »." },
  { name: "Boké", region: "maritime", text: "Ancien comptoir sur le Rio Nunez, au nord-ouest. La région possède d'immenses gisements de bauxite." },
  { name: "Labé", region: "moyenne", text: "Grande ville du Fouta-Djalon, ancien chef-lieu d'une province importante de l'Imamat du Fouta-Djalon." },
  { name: "Mamou", region: "moyenne", text: "Ville carrefour, sur les routes qui relient la côte, le Fouta-Djalon et la Haute-Guinée." },
  { name: "Kankan", region: "haute", text: "Grande ville de Haute-Guinée sur la rivière Milo, ancien centre de commerce et d'enseignement. Elle accueille l'université Julius-Nyerere." },
  { name: "Faranah", region: "haute", text: "Région proche des sources du Niger, avec le parc national du Haut-Niger. Ahmed Sékou Touré y est né en 1922." },
  { name: "N'Zérékoré", region: "forestiere", text: "La plus grande ville de Guinée forestière, connue pour son grand marché, non loin du mont Nimba." },
];

export const timeline: { when: string; title: string; text: string; uncertain?: boolean }[] = [
  { when: "XIIIe siècle", title: "L'Empire du Mali", text: "Une partie de la Haute-Guinée appartient au Manding, cœur de l'Empire du Mali fondé selon la tradition par Soundiata Keïta." },
  { when: "XVe siècle", title: "Les navigateurs européens", text: "Des navigateurs portugais longent la côte. Le commerce atlantique commence, y compris, plus tard, la traite des esclaves." },
  { when: "XVIIIe siècle", title: "L'Imamat du Fouta-Djalon", text: "Un État musulman se forme dans le Fouta-Djalon, avec Timbo pour capitale. Sa date de fondation, souvent placée vers 1725, est discutée.", uncertain: true },
  { when: "XIXe siècle", title: "Samory Touré", text: "L'almamy Samory Touré bâtit un vaste État et résiste longtemps à la conquête française. Il est capturé en 1898." },
  { when: "Fin XIXe siècle", title: "La Guinée française", text: "Le territoire devient une colonie française, intégrée à l'Afrique-Occidentale française (AOF)." },
  { when: "28 septembre 1958", title: "Le « non » au référendum", text: "Les Guinéens votent massivement « non » à la Communauté proposée par la France. Les femmes jouent un grand rôle dans la mobilisation." },
  { when: "2 octobre 1958", title: "L'indépendance", text: "La Guinée devient indépendante. Ahmed Sékou Touré est le premier président, jusqu'à sa mort en 1984 ; son régime fut aussi marqué par une dure répression." },
  { when: "1984-2008", title: "Lansana Conté", text: "Après la mort de Sékou Touré, l'armée prend le pouvoir ; Lansana Conté dirige le pays jusqu'en 2008." },
  { when: "2010", title: "Une élection pluraliste", text: "Alpha Condé est élu lors d'une élection présidentielle où plusieurs candidats s'affrontent." },
  { when: "Depuis 2021", title: "Une période de transition", text: "En septembre 2021, un coup d'État militaire ouvre une période de transition. Pour les événements les plus récents, consulte des sources d'actualité fiables avec un adulte." },
];

export const communities: { name: string; text: string }[] = [
  { name: "Peuls", text: "Nombreux en Moyenne-Guinée (Fouta-Djalon), ils parlent le pular. Leur histoire est liée à l'Imamat du Fouta-Djalon. Aujourd'hui, les Peuls vivent partout en Guinée et exercent tous les métiers." },
  { name: "Malinkés", text: "Nombreux en Haute-Guinée, ils parlent le maninka. Ils sont héritiers de l'histoire du Manding, où les griots (djéli) transmettent la mémoire." },
  { name: "Soussous", text: "Nombreux en Guinée maritime, ils parlent le susu, langue très utilisée dans les échanges à Conakry." },
  { name: "Kissis, Tomas, Guerzés et autres", text: "En Guinée forestière vivent notamment les Kissis, les Tomas (Lomas), les Guerzés (Kpelle) et les Manons, avec leurs propres langues et traditions." },
  { name: "Bagas, Nalus, Landoumas…", text: "Sur la côte vivent plusieurs communautés. Le grand masque D'mba (ou Nimba) des Bagas est admiré dans les musées du monde entier." },
  { name: "Coniaguis, Bassaris, Diakhankés…", text: "Au nord-ouest et ailleurs, d'autres communautés enrichissent encore la mosaïque guinéenne." },
];

export const languages: { name: string; also?: string; where: string }[] = [
  { name: "Pular", also: "peul, fulfulde", where: "Surtout en Moyenne-Guinée, et dans toute l'Afrique de l'Ouest" },
  { name: "Maninka", also: "malinké", where: "Surtout en Haute-Guinée ; proche du bambara et du dioula" },
  { name: "Susu", also: "soussou", where: "Surtout en Guinée maritime et à Conakry" },
  { name: "Kpelle", also: "guerzé", where: "Guinée forestière (aussi parlé au Liberia)" },
  { name: "Kissi", where: "Guinée forestière (aussi en Sierra Leone et au Liberia)" },
  { name: "Loma", also: "toma", where: "Guinée forestière (aussi au Liberia)" },
  { name: "Et d'autres…", where: "Baga, nalu, landuma, coniagui, bassari, mano…" },
];

export const naturalSites: { name: string; text: string; scene: SceneName }[] = [
  { name: "Le Fouta-Djalon", text: "Le « château d'eau de l'Afrique de l'Ouest », où naissent la Gambie et le Bafing (fleuve Sénégal).", scene: "fouta" },
  { name: "Le mont Nimba", text: "Point culminant (environ 1 752 m), réserve inscrite au patrimoine mondial de l'UNESCO, partagée avec la Côte d'Ivoire et le Liberia.", scene: "montagne" },
  { name: "Les îles de Loos", text: "Archipel au large de Conakry : Kassa, Tamara (Fotoba) et Room, avec plages et forêts.", scene: "mer" },
  { name: "Les fleuves", text: "Le Niger, le Bafing, la Gambie, le Konkouré… La Guinée est un pays d'eau, ce qui permet de produire de l'électricité avec des barrages.", scene: "fleuve" },
  { name: "Les forêts", text: "Le massif du Ziama, en Guinée forestière, est une réserve de biosphère reconnue par l'UNESCO, refuge d'éléphants de forêt et de nombreuses espèces.", scene: "foret" },
  { name: "Les parcs nationaux", text: "Le parc national du Haut-Niger protège des forêts sèches et des chimpanzés ; le parc du Badiar prolonge le Niokolo-Koba du Sénégal.", scene: "savane" },
];
