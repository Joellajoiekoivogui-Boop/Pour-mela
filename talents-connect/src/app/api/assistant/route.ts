import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { runAssistant } from "@/lib/ai/service";

const bodySchema = z.object({
  mode: z.enum(["orientation", "career", "path", "mentor_prep"]),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(4000) })).min(1).max(12),
});

/** Assistant IA : réservé aux utilisateurs connectés ; les appels au modèle restent côté serveur. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.profile.is_suspended) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const { mode, messages } = parsed.data;
  if (mode === "mentor_prep" && session.profile.role !== "mentor") return NextResponse.json({ error: "Mode réservé aux mentors." }, { status: 403 });
  if (messages.at(-1)?.role !== "user") return NextResponse.json({ error: "Le dernier message doit venir de l'utilisateur." }, { status: 400 });
  const reply = await runAssistant(session, mode, messages);
  return NextResponse.json(reply);
}
