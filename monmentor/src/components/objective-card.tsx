import { Progress } from "./ui";
import { domainLabel } from "@/lib/domains";
import { daysUntil, formatDate } from "@/lib/format";
import type { objectivesWithSteps } from "@/lib/queries";

type Obj = Awaited<ReturnType<typeof objectivesWithSteps>>[number];

export function ObjectiveCard({ o, editable, toggle, addStep, remove, commenter, children }: {
  o: Obj; editable?: boolean; toggle?: (f: FormData) => Promise<void>; addStep?: (f: FormData) => Promise<void>; remove?: (f: FormData) => Promise<void>; commenter?: string | null; children?: React.ReactNode;
}) {
  const left = o.dueDate ? daysUntil(o.dueDate) : null;
  return (
    <article className="card grid gap-4 p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-accent">{domainLabel(o.domain, true)}</span>
          <h3 className="text-lg font-semibold">{o.title}</h3>
          {o.dueDate && <span className="text-xs text-ink-3">Échéance : {formatDate(o.dueDate)} · {left! >= 0 ? `${left} jours restants` : "dépassée"}</span>}
        </div>
        <span className="whitespace-nowrap text-2xl font-bold tabular-nums">{o.progress} %</span>
      </header>
      <Progress value={o.progress} label={o.title} />
      <ul className="grid gap-1.5">
        {o.steps.map((s) => (
          <li key={s.id} className="flex items-start gap-2">
            {editable && toggle ? (
              <form action={toggle}>
                <input type="hidden" name="stepId" value={s.id} />
                <button aria-label={s.done ? `Rouvrir l'étape ${s.title}` : `Marquer comme faite : ${s.title}`} aria-pressed={s.done}
                  className={`mt-0.5 grid h-5 w-5 place-items-center rounded border ${s.done ? "border-ok bg-ok text-white" : "border-line"}`}>{s.done ? "✓" : ""}</button>
              </form>
            ) : <span aria-hidden="true" className={`mt-0.5 grid h-5 w-5 place-items-center rounded border text-xs ${s.done ? "border-ok bg-ok text-white" : "border-line"}`}>{s.done ? "✓" : ""}</span>}
            <span className={`text-sm ${s.done ? "text-ink-3 line-through" : ""}`}>{s.title}{s.fromSessionId && <>{" "}<span className="ml-1 text-xs text-ink-3 no-underline">(compte rendu de séance)</span></>}</span>
          </li>
        ))}
      </ul>
      {o.mentorComment && <p className="rounded-lg bg-accent-soft p-3 text-sm">« {o.mentorComment} »{commenter && <span className="block text-xs text-ink-2">— {commenter}</span>}</p>}
      {editable && addStep && (
        <form action={addStep} className="flex gap-2">
          <input type="hidden" name="objectiveId" value={o.id} />
          <label className="sr-only" htmlFor={`step-${o.id}`}>Nouvelle étape</label>
          <input id={`step-${o.id}`} name="title" required maxLength={140} placeholder="Ajouter une étape" className="input min-h-9 py-1 text-sm" />
          <button className="btn-ghost btn-sm">Ajouter</button>
        </form>
      )}
      {children}
      {editable && remove && (
        <form action={remove} className="justify-self-end"><input type="hidden" name="objectiveId" value={o.id} /><button className="text-xs font-semibold text-ink-3 hover:text-bad">Supprimer l&apos;objectif</button></form>
      )}
    </article>
  );
}
