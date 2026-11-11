import type { CvData } from "@/lib/cv";
import { Avatar, Badge, Progress } from "./ui";
import { domainLabel } from "@/lib/domains";
import { formatDate, plural } from "@/lib/format";

const T = {
  fr: { skills: "Compétences", validated: "validée par", journey: "Parcours de mentorat", reco: "Recommandations", exp: "Expériences", edu: "Formation", certs: "Certificats", impact: "Impact comme mentor", today: "aujourd'hui", sessions: "séances", hours: "h d'accompagnement", mentors: "Accompagné·e par", verify: "Vérifier ce CV" },
  en: { skills: "Skills", validated: "endorsed by", journey: "Mentoring journey", reco: "Recommendations", exp: "Experience", edu: "Education", certs: "Certificates", impact: "Impact as a mentor", today: "present", sessions: "sessions", hours: "h of mentoring", mentors: "Mentored by", verify: "Verify this CV" },
};

export function CvView({ d, qr, verifyUrl }: { d: CvData; qr?: string; verifyUrl?: string }) {
  const t = T[d.cv.language];
  const hide = new Set(d.cv.hidden);
  const approved = d.recommendations.filter((r) => r.status === "APPROVED");
  const exp = d.experiences.filter((e) => e.kind === "EXPERIENCE");
  const edu = d.experiences.filter((e) => e.kind === "EDUCATION");
  const accent = d.cv.template === "entrepreneur" ? "bg-[#7a3d05]" : d.cv.template === "academique" ? "bg-[#1f3f68]" : "bg-[#1b2533]";
  const declared = d.mentorProfile?.skills ?? [];
  return (
    <article className="card overflow-hidden" lang={d.cv.language}>
      <header className={`${accent} flex flex-wrap items-center gap-4 p-6 text-white`}>
        <Avatar name={d.user.name} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{d.user.name}</h1>
          {d.cv.headline && <p className="opacity-85">{d.cv.headline}</p>}
          {!hide.has("city") && <p className="text-sm opacity-70">{d.user.city}, {d.user.country}</p>}
        </div>
      </header>
      <div className="grid gap-6 p-6">
        {d.cv.summary && <p className="text-ink-2">{d.cv.summary}</p>}

        {(d.endorsed.length > 0 || declared.length > 0) && (
          <section className="grid gap-2">
            <h2 className="eyebrow">{t.skills}</h2>
            <div className="flex flex-wrap gap-2">
              {d.endorsed.map((e) => <span key={e.skill} className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-3 py-1 text-sm font-semibold text-ok">✓ {e.skill} <span className="font-normal opacity-80">· {t.validated} {e.by.join(", ")}</span></span>)}
              {declared.filter((s) => !d.endorsed.some((e) => e.skill === s)).map((s) => <span key={s} className="chip">{s}</span>)}
            </div>
          </section>
        )}

        {d.impact && (
          <section className="grid gap-2">
            <h2 className="eyebrow">{t.impact}</h2>
            <p>{plural(d.impact.mentees, "jeune accompagné", "jeunes accompagnés")} · {d.impact.hours.toLocaleString("fr-FR")} h · {plural(d.impact.resources, "ressource publiée", "ressources publiées")}</p>
            {d.mentorProfile && <div className="flex flex-wrap gap-1.5">{d.mentorProfile.domains.map((x) => <Badge key={x}>{domainLabel(x)}</Badge>)}</div>}
          </section>
        )}

        {d.user.role === "MENTEE" && (!hide.has("sessions") || (!hide.has("goals") && d.objectives.length > 0)) && (
          <section className="grid gap-3">
            <h2 className="eyebrow">{t.journey}</h2>
            {!hide.has("sessions") && d.sessionsCount > 0 && (
              <p className="text-sm">{plural(d.sessionsCount, "séance", t.sessions)} · {d.hours.toLocaleString("fr-FR")} {t.hours}{d.mentors.length ? ` · ${t.mentors} ${d.mentors.map((m) => m.name).join(", ")}` : ""}</p>
            )}
            {!hide.has("goals") && d.objectives.map((o) => (
              <div key={o.id} className="grid gap-1">
                <div className="flex justify-between gap-3 text-sm"><span>{o.title}</span><span className="tabular-nums text-ink-2">{o.progress} %</span></div>
                <Progress value={o.progress} label={o.title} />
              </div>
            ))}
          </section>
        )}

        {approved.length > 0 && (
          <section className="grid gap-3">
            <h2 className="eyebrow">{t.reco}</h2>
            {approved.map((r) => (
              <blockquote key={r.id} className="border-l-4 border-accent pl-4">
                <p className="italic text-ink-2">« {r.body} »</p>
                <footer className="mt-1 text-sm font-semibold">{r.mentorName}{r.mentorTitle ? <span className="font-normal text-ink-3"> · {r.mentorTitle}</span> : null}</footer>
              </blockquote>
            ))}
          </section>
        )}

        {[[t.exp, exp], [t.edu, edu]].map(([label, list]) => (list as typeof exp).length > 0 && (
          <section key={label as string} className="grid gap-3">
            <h2 className="eyebrow">{label as string}</h2>
            {(list as typeof exp).map((e) => (
              <div key={e.id}>
                <p className="font-semibold">{e.title} · <span className="font-normal">{e.organization}</span></p>
                <p className="text-xs text-ink-3">{e.start} – {e.end ?? t.today}</p>
                {e.description && <p className="text-sm text-ink-2">{e.description}</p>}
              </div>
            ))}
          </section>
        ))}

        {d.certificates.length > 0 && (
          <section className="grid gap-2">
            <h2 className="eyebrow">{t.certs}</h2>
            <ul className="grid gap-1 text-sm">
              {d.certificates.map((c) => <li key={c.id}>🏅 {c.title} · {formatDate(c.issuedAt)} · <a href={`/verif/${c.code}`} className="link font-mono text-xs">{c.code}</a></li>)}
            </ul>
          </section>
        )}
      </div>
      {(qr || verifyUrl) && (
        <footer className="flex items-center justify-between gap-4 border-t border-line px-6 py-4 text-xs text-ink-3">
          <span>{t.verify} : <span className="break-all">{verifyUrl}</span></span>
          {qr && <img src={qr} alt="QR code de vérification" width={72} height={72} className="rounded bg-white p-1" />}
        </footer>
      )}
    </article>
  );
}
