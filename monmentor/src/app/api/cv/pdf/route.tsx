import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { getCurrentUser } from "@/lib/auth";
import { cvUrl, loadCv, qrDataUrl } from "@/lib/cv";
import { formatDate } from "@/lib/format";

export const runtime = "nodejs";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10.5, fontFamily: "Helvetica", color: "#15202e", lineHeight: 1.45 },
  head: { backgroundColor: "#1b2533", color: "white", padding: 18, marginBottom: 16, borderRadius: 6 },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  sub: { fontSize: 11, marginTop: 4, color: "#d6dde6" },
  h: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#c25a07", letterSpacing: 1.2, marginTop: 12, marginBottom: 5 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  chip: { backgroundColor: "#e5f4ec", color: "#1e7a4c", paddingVertical: 2, paddingHorizontal: 6, borderRadius: 8, fontSize: 9.5 },
  item: { marginBottom: 6 },
  bold: { fontFamily: "Helvetica-Bold" },
  muted: { color: "#6b7888", fontSize: 9 },
  quote: { borderLeftWidth: 2, borderLeftColor: "#c25a07", paddingLeft: 8, marginBottom: 6, fontFamily: "Helvetica-Oblique" },
  foot: { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center", fontSize: 8, color: "#6b7888" },
});

// PDF du CV, réservé à son titulaire (spécification F1 : moins de 300 Ko, A4).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Connexion requise", { status: 401 });
  const d = await loadCv({ userId: user.id });
  if (!d) return new Response("CV introuvable", { status: 404 });
  const url = cvUrl(d);
  const qr = await qrDataUrl(url);
  const hide = new Set(d.cv.hidden);
  const approved = d.recommendations.filter((r) => r.status === "APPROVED");
  const doc = (
    <Document title={`CV ${d.user.name}`} author={d.user.name} creator="MonMentor" language={d.cv.language}>
      <Page size="A4" style={s.page}>
        <View style={s.head}>
          <Text style={s.name}>{d.user.name}</Text>
          {d.cv.headline ? <Text style={s.sub}>{d.cv.headline}</Text> : null}
          {!hide.has("city") ? <Text style={s.sub}>{d.user.city}, {d.user.country}</Text> : null}
        </View>
        {d.cv.summary ? <Text>{d.cv.summary}</Text> : null}
        {d.endorsed.length > 0 && (
          <View>
            <Text style={s.h}>COMPÉTENCES VALIDÉES PAR UN MENTOR</Text>
            <View style={s.row}>{d.endorsed.map((e) => <Text key={e.skill} style={s.chip}>{e.skill} ({e.by.join(", ")})</Text>)}</View>
          </View>
        )}
        {d.user.role === "MENTEE" && !hide.has("sessions") && d.sessionsCount > 0 && (
          <View>
            <Text style={s.h}>PARCOURS DE MENTORAT</Text>
            <Text>{d.sessionsCount} séance(s), {d.hours} h d&apos;accompagnement{d.mentors.length ? `, avec ${d.mentors.map((m) => m.name).join(", ")}` : ""}.</Text>
            {!hide.has("goals") && d.objectives.map((o) => <Text key={o.id}>• {o.title} : {o.progress} %</Text>)}
          </View>
        )}
        {d.impact && (
          <View>
            <Text style={s.h}>IMPACT COMME MENTOR</Text>
            <Text>{d.impact.mentees} jeune(s) accompagné(s), {d.impact.hours} h données, {d.impact.resources} ressource(s) publiée(s).</Text>
          </View>
        )}
        {approved.length > 0 && (
          <View>
            <Text style={s.h}>RECOMMANDATIONS</Text>
            {approved.map((r) => <View key={r.id} style={s.quote}><Text>« {r.body} »</Text><Text style={[s.bold, { fontFamily: "Helvetica-Bold" }]}>{r.mentorName}{r.mentorTitle ? `, ${r.mentorTitle}` : ""}</Text></View>)}
          </View>
        )}
        {(["EXPERIENCE", "EDUCATION"] as const).map((k) => {
          const list = d.experiences.filter((e) => e.kind === k);
          return list.length ? (
            <View key={k}>
              <Text style={s.h}>{k === "EXPERIENCE" ? "EXPÉRIENCES" : "FORMATION"}</Text>
              {list.map((e) => (
                <View key={e.id} style={s.item}>
                  <Text><Text style={s.bold}>{e.title}</Text> · {e.organization}</Text>
                  <Text style={s.muted}>{e.start} – {e.end ?? "aujourd'hui"}</Text>
                  {e.description ? <Text>{e.description}</Text> : null}
                </View>
              ))}
            </View>
          ) : null;
        })}
        {d.certificates.length > 0 && (
          <View>
            <Text style={s.h}>CERTIFICATS</Text>
            {d.certificates.map((c) => <Text key={c.id}>{c.title} · {formatDate(c.issuedAt)} · n° {c.code}</Text>)}
          </View>
        )}
        <View style={s.foot} fixed>
          <Text>CV vérifiable en ligne : {url}</Text>
          <Image src={qr} style={{ width: 54, height: 54 }} />
        </View>
      </Page>
    </Document>
  );
  const pdf = await renderToBuffer(doc);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="CV-${d.cv.slug}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
