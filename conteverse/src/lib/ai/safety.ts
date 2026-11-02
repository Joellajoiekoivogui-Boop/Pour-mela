// Garde-fous de LUMO, appliqués AVANT tout appel au modèle de langage
// (et aussi en mode démonstration). Ils ne remplacent pas une modération
// humaine, mais évitent les situations les plus évidentes.

export const MAX_QUESTION_LENGTH = 400;

export type SafetyVerdict =
  | { ok: true; text: string }
  | { ok: false; reason: "empty" | "too-long" | "personal-info" | "unsafe-topic" | "distress"; reply: string };

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

// Informations personnelles : téléphone, e-mail, adresse, mot de passe.
const PERSONAL_PATTERNS: RegExp[] = [
  /\b(?:\+?\d[\s.-]?){8,}\b/, // numéro de téléphone
  /[\w.+-]+@[\w-]+\.[\w.]+/, // e-mail
  /\b(j'?habite|mon adresse|mon numero|mot de passe|mon code secret)\b/,
];

// Thèmes inadaptés aux enfants : LUMO redirige vers un adulte de confiance.
const UNSAFE_WORDS = [
  "sexe", "sexuel", "porno", "drogue", "cannabis", "cocaine", "alcool", "arme a feu", "fusil",
  "bombe", "fabriquer une arme", "tuer quelqu", "pirater", "hacker un compte", "insulte", "raciste",
];

// Signes de détresse : réponse bienveillante, orientation vers un adulte.
const DISTRESS_WORDS = ["je veux mourir", "me suicider", "on me frappe", "on me fait du mal", "je suis en danger", "harcele", "harcelement"];

export function checkQuestion(raw: string): SafetyVerdict {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return { ok: false, reason: "empty", reply: "Pose-moi une question sur l'Afrique, la Guinée, les sciences ou un mot difficile !" };
  if (text.length > MAX_QUESTION_LENGTH)
    return { ok: false, reason: "too-long", reply: `Ta question est un peu longue. Essaie de l'écrire en moins de ${MAX_QUESTION_LENGTH} caractères.` };
  const n = normalize(text);
  if (DISTRESS_WORDS.some((w) => n.includes(w)))
    return {
      ok: false,
      reason: "distress",
      reply:
        "Ce que tu ressens est important. Parle tout de suite à un adulte de confiance : un parent, un enseignant, un membre de ta famille. Tu n'es pas seul(e), et demander de l'aide, c'est courageux. 💛",
    };
  if (PERSONAL_PATTERNS.some((p) => p.test(n)))
    return {
      ok: false,
      reason: "personal-info",
      reply:
        "Attention ! Ne partage jamais ton numéro de téléphone, ton adresse, ton e-mail ou ton mot de passe, même avec moi. Je n'en ai pas besoin pour t'aider. Pose-moi plutôt une question de découverte !",
    };
  if (UNSAFE_WORDS.some((w) => n.includes(w)))
    return {
      ok: false,
      reason: "unsafe-topic",
      reply:
        "Cette question n'est pas un sujet pour LUMO. Tu peux en parler avec un adulte de confiance. Moi, je peux t'aider à découvrir l'histoire, les cultures, la nature ou les sciences !",
    };
  return { ok: true, text };
}

/** Vérification légère de la réponse générée avant affichage. */
export function checkAnswer(answer: string): boolean {
  const n = normalize(answer);
  return !UNSAFE_WORDS.some((w) => n.includes(w)) && !PERSONAL_PATTERNS.slice(0, 2).some((p) => p.test(n));
}
