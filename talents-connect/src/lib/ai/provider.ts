import "server-only";

/**
 * Fournisseur de modèle de langage interchangeable, configuré uniquement par
 * variables d'environnement côté serveur (la clé n'est jamais envoyée au
 * navigateur) :
 *   AI_PROVIDER = anthropic | openai   (openai = toute API compatible OpenAI)
 *   AI_API_KEY, AI_MODEL, AI_BASE_URL (openai uniquement)
 */

export interface ChatMessage { role: "user" | "assistant"; content: string }
export interface CompletionRequest { system: string; messages: ChatMessage[]; maxTokens?: number }

export class AiError extends Error {
  constructor(message: string, readonly kind: "config" | "rate_limit" | "provider" | "timeout") {
    super(message);
  }
}

export function aiConfig() {
  const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase() === "openai" ? "openai" : "anthropic";
  const apiKey = process.env.AI_API_KEY || (provider === "anthropic" ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY) || "";
  const model = process.env.AI_MODEL || (provider === "anthropic" ? "claude-opus-5-5" : "gpt-4o-mini");
  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  return { provider, apiKey, model, baseUrl, enabled: Boolean(apiKey) } as const;
}

export const isAiConfigured = () => aiConfig().enabled;

const TIMEOUT_MS = 45_000;

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal: controller.signal });
    if (res.status === 429) throw new AiError("Le service d'IA est saturé.", "rate_limit");
    if (!res.ok) throw new AiError(`Erreur du fournisseur IA (${res.status}).`, "provider");
    return await res.json();
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Error && e.name === "AbortError") throw new AiError("Le service d'IA n'a pas répondu à temps.", "timeout");
    throw new AiError("Service d'IA injoignable.", "provider");
  } finally {
    clearTimeout(timer);
  }
}

export async function complete(req: CompletionRequest): Promise<string> {
  const cfg = aiConfig();
  if (!cfg.enabled) throw new AiError("Aucune clé d'API configurée.", "config");
  const maxTokens = req.maxTokens ?? 1200;

  if (cfg.provider === "anthropic") {
    const json = (await post("https://api.anthropic.com/v1/messages", { "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01" }, {
      model: cfg.model, max_tokens: maxTokens, system: req.system, messages: req.messages,
    })) as { content?: { type: string; text?: string }[]; stop_reason?: string };
    if (json.stop_reason === "refusal") throw new AiError("Le modèle a refusé de répondre.", "provider");
    return (json.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n").trim();
  }

  const json = (await post(`${cfg.baseUrl}/chat/completions`, { authorization: `Bearer ${cfg.apiKey}` }, {
    model: cfg.model, max_tokens: maxTokens, messages: [{ role: "system", content: req.system }, ...req.messages],
  })) as { choices?: { message?: { content?: string } }[] };
  return (json.choices?.[0]?.message?.content ?? "").trim();
}
