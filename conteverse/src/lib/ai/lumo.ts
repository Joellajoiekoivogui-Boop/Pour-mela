import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { checkAnswer } from "./safety";
import { contextFor, demoAnswer, searchArticles, type AgeLevel, type LumoAnswer } from "./knowledge";
import { systemPrompt } from "./prompt";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Vrai si une clé API est configurée côté serveur. La clé n'est jamais envoyée au navigateur. */
export const isAiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

let client: Anthropic | null = null;

export async function askLumo(question: string, level: AgeLevel, history: ChatTurn[]): Promise<LumoAnswer> {
  if (!isAiConfigured()) return demoAnswer(question, level);

  client ??= new Anthropic();
  const context = contextFor(question);
  const suggestions = searchArticles(question, 3).map(({ article }) => ({ slug: article.slug, title: article.title }));

  const recent = history.slice(-6);
  while (recent[0]?.role === "assistant") recent.shift();
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...recent.map((t) => ({ role: t.role, content: t.content.slice(0, 1200) })),
    { role: "user", content: question },
  ];

  try {
    const response = await client.beta.messages.create({
      model: process.env.LUMO_MODEL || "claude-opus-5-5",
      max_tokens: 1024,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        { type: "text", text: systemPrompt(level) },
        { type: "text", text: context ? `Contenus CONTEVERSE pertinents :\n\n${context}` : "Aucun contenu CONTEVERSE ne correspond directement à cette question." },
      ],
      messages,
    });

    if (response.stop_reason === "refusal") {
      return { text: "Je préfère ne pas répondre à cette question. Pose-la à un adulte de confiance, ou demande-moi autre chose sur l'Afrique, les sciences ou un mot difficile !", suggestions: [], mode: "safety" };
    }
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (!text || !checkAnswer(text)) return demoAnswer(question, level);
    return { text, suggestions, mode: "ai", uncertain: !context };
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) console.warn("LUMO : limite de requêtes atteinte, repli sur le mode démonstration.");
    else if (err instanceof Anthropic.APIError) console.error("LUMO : erreur API", err.status);
    else console.error("LUMO : erreur inattendue");
    // Repli : on ne bloque jamais l'enfant, on répond avec les contenus vérifiés.
    return demoAnswer(question, level);
  }
}
