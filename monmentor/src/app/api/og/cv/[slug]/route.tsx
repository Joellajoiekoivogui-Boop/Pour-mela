import { ImageResponse } from "next/og";
import { loadCv, canViewCv } from "@/lib/cv";
import { domainLabel } from "@/lib/domains";

// Image d'aperçu 1200 × 630 lue par LinkedIn, Facebook et WhatsApp au partage du CV.
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const token = new URL(req.url).searchParams.get("t") ?? undefined;
  const d = await loadCv({ slug });
  const visible = !!d && canViewCv(d, token, undefined);
  const name = visible ? d!.user.name : "MonMentor";
  const headline = visible ? d!.cv.headline ?? "" : "Un mentor pour vos ambitions";
  const domains = visible ? (d!.mentorProfile?.domains ?? d!.menteeProfile?.domains ?? []).slice(0, 3).map((x) => domainLabel(x, true)) : [];
  const facts = visible
    ? d!.user.role === "MENTOR"
      ? `${d!.impact?.mentees ?? 0} jeunes accompagnés · ${d!.impact?.hours ?? 0} h données`
      : `${d!.endorsed.length} compétence(s) validée(s) · ${d!.sessionsCount} séance(s) de mentorat`
    : "";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#1b2533", color: "white", padding: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 700 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#f08c35", display: "flex" }} />
          <span>Mon</span><span style={{ color: "#f5a35b", marginLeft: -16 }}>Mentor</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>{name}</div>
          {headline && <div style={{ fontSize: 34, opacity: 0.85 }}>{headline.slice(0, 90)}</div>}
          {domains.length > 0 && (
            <div style={{ display: "flex", gap: 12 }}>
              {domains.map((x) => <div key={x} style={{ fontSize: 26, padding: "6px 18px", borderRadius: 999, background: "rgba(255,255,255,0.12)" }}>{x}</div>)}
            </div>
          )}
        </div>
        <div style={{ fontSize: 28, color: "#f5a35b" }}>{facts || "monmentor · mentorat en Guinée"}</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
