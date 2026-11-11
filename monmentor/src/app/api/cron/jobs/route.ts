import { runJobs } from "@/lib/jobs";

// Appelée toutes les 15 minutes par le planificateur (Vercel Cron ou cron système) avec
// l'en-tête « Authorization: Bearer <CRON_SECRET> ».
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Non autorisé", { status: 401 });
  }
  return Response.json(await runJobs());
}
