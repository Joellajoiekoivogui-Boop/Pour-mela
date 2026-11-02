import { NextResponse } from "next/server";
import { askLumo, isAiConfigured, type ChatTurn } from "@/lib/ai/lumo";
import { checkQuestion } from "@/lib/ai/safety";
import { rateLimit } from "@/lib/ai/rate-limit";
import type { AgeLevel } from "@/lib/ai/knowledge";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ mode: isAiConfigured() ? "ai" : "demo" });
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(ip)) {
    return NextResponse.json({ text: "Tu poses beaucoup de questions ! Prends le temps de lire les réponses, puis réessaie dans une minute. 😊", suggestions: [], mode: "safety" }, { status: 429 });
  }

  let body: { question?: unknown; level?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const verdict = checkQuestion(typeof body.question === "string" ? body.question : "");
  if (!verdict.ok) return NextResponse.json({ text: verdict.reply, suggestions: [], mode: "safety" });

  const level: AgeLevel = body.level === "10-12" ? "10-12" : "7-9";
  const history: ChatTurn[] = Array.isArray(body.history)
    ? body.history
        .filter((t): t is ChatTurn => !!t && typeof t === "object" && (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
        // Les anciens messages de l'enfant repassent aussi par les garde-fous.
        .filter((t) => t.role === "assistant" || checkQuestion(t.content).ok)
        .slice(-6)
    : [];

  const answer = await askLumo(verdict.text, level, history);
  return NextResponse.json(answer);
}
