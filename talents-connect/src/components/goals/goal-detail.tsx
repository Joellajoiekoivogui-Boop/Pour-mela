"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Lightbulb, MessageSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "@/components/shared/action-button";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/misc";
import {
  addGoalCommentAction, addMilestoneAction, deleteGoalAction, deleteMilestoneAction, setMilestoneIntentionAction, toggleMilestoneAction, updateGoalAction,
} from "@/lib/actions/goals";
import { milestoneFeedback } from "@/lib/learning";
import { goalProgress } from "@/lib/goals";
import { timeAgo } from "@/lib/dates";
import { cn, fullName } from "@/lib/utils";
import type { Goal, GoalComment, Milestone, PersonSummary } from "@/types/db";

/** Étapes cochables (progression réelle), ajout d'étapes et commentaires mentor ↔ mentoré. */
export function GoalDetail({ goal, milestones, comments, people, canEdit, canDelete, afterDeleteHref }: {
  goal: Goal; milestones: Milestone[]; comments: GoalComment[]; people: Record<string, PersonSummary>;
  canEdit: boolean; canDelete: boolean; afterDeleteHref: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(milestones, (state, change: { id: string; done: boolean }) =>
    state.map((m) => (m.id === change.id ? { ...m, is_done: change.done } : m)));
  const [newStep, setNewStep] = useState("");
  const [comment, setComment] = useState("");
  const progress = goalProgress(optimistic);
  const done = optimistic.filter((m) => m.is_done).length;
  const nextId = [...optimistic].sort((a, b) => a.position - b.position).find((m) => !m.is_done)?.id;

  const toggle = (m: Milestone) => start(async () => {
    setOptimistic({ id: m.id, done: !m.is_done });
    const r = await toggleMilestoneAction(m.id, !m.is_done);
    if (!r.ok) toast.error(r.error);
    // Retour sur la compétence : un message qui nomme le progrès, sans points ni classement.
    else if (!m.is_done) toast.success(milestoneFeedback(optimistic.filter((x) => x.is_done).length + 1, optimistic.length));
    router.refresh();
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card>
          <CardContent>
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-sm text-muted">Progression</p><p className="text-3xl font-semibold text-navy">{progress} %</p></div>
              <p className="text-sm text-muted">{done} étape{done > 1 ? "s" : ""} sur {optimistic.length}</p>
            </div>
            <Progress value={progress} tone={progress === 100 ? "success" : "primary"} className="mt-3 h-2.5" label="Progression de l'objectif" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Étapes</CardTitle></CardHeader>
          <CardContent>
            {optimistic.length === 0 && <p className="mb-4 text-sm text-muted">Ajoutez des étapes : la progression est calculée à partir des étapes accomplies.</p>}
            <ol className="space-y-1.5">
              {optimistic.map((m, i) => (
                <li key={m.id} className="group flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-subtle/70">
                  <button type="button" disabled={!canEdit || pending} onClick={() => toggle(m)} aria-pressed={m.is_done} aria-label={`${m.is_done ? "Marquer comme non faite" : "Marquer comme faite"} : ${m.title}`} className="mt-0.5 shrink-0 disabled:cursor-default">
                    {m.is_done ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5 text-slate-300" />}
                  </button>
                  <span className="flex-1">
                    <span className={cn("text-sm", m.is_done && "text-muted line-through")}><span className="mr-1.5 text-xs text-muted">{i + 1}.</span>{m.title}</span>
                    {m.id === nextId && <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">Prochaine étape</span>}
                    {m.intention && !m.is_done && <span className="mt-0.5 block text-xs text-violet">Mon plan : {m.intention}</span>}
                    {m.id === nextId && canEdit && <IntentionEditor milestoneId={m.id} initial={m.intention ?? ""} />}
                  </span>
                  {canEdit && (
                    <button type="button" className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100" aria-label={`Supprimer l'étape ${m.title}`}
                      onClick={() => start(async () => { const r = await deleteMilestoneAction(m.id); if (!r.ok) toast.error(r.error); router.refresh(); })}>
                      <Trash2 className="size-4 text-slate-400 hover:text-danger" />
                    </button>
                  )}
                </li>
              ))}
            </ol>
            {canEdit && (
              <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await addMilestoneAction(goal.id, newStep); if (r.ok) { setNewStep(""); router.refresh(); } else toast.error(r.error); }); }}>
                <Input value={newStep} onChange={(e) => setNewStep(e.target.value)} placeholder="Nouvelle étape" maxLength={200} aria-label="Nouvelle étape" />
                <Button type="submit" variant="secondary" disabled={newStep.trim().length < 2} loading={pending}><Plus /> Ajouter</Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="size-4" /> Commentaires</CardTitle></CardHeader>
          <CardContent>
            {comments.length === 0 ? <p className="text-sm text-muted">Aucun commentaire. Le mentor peut y laisser ses conseils.</p> : (
              <ul className="space-y-4">
                {comments.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <Avatar person={people[c.author_id]} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm"><span className="font-medium">{fullName(people[c.author_id])}</span> <span className="text-xs text-muted">· {timeAgo(c.created_at)}</span></p>
                      <p className="mt-0.5 whitespace-pre-line text-sm text-slate-700">{c.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <form className="mt-4 space-y-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await addGoalCommentAction(goal.id, comment); if (r.ok) { setComment(""); router.refresh(); } else toast.error(r.error); }); }}>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Un point fort précis, puis une piste concrète pour la suite…" className="min-h-16" maxLength={2000} aria-label="Commentaire" />
              <div className="flex justify-end"><Button type="submit" size="sm" disabled={!comment.trim()} loading={pending}>Publier</Button></div>
            </form>
          </CardContent>
        </Card>
      </div>

      {canEdit && <GoalSettings goal={goal} canDelete={canDelete} afterDeleteHref={afterDeleteHref} />}
    </div>
  );
}

function GoalSettings({ goal, canDelete, afterDeleteHref }: { goal: Goal; canDelete: boolean; afterDeleteHref: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description ?? "");
  const [priority, setPriority] = useState(goal.priority);
  const [dueDate, setDueDate] = useState(goal.due_date ?? "");
  const [pending, start] = useTransition();
  const save = (abandoned?: boolean) => start(async () => {
    const r = await updateGoalAction({ goalId: goal.id, title, description, priority, dueDate, abandoned });
    if (r.ok) { toast.success(r.message); router.refresh(); } else toast.error(r.error);
  });
  return (
    <Card className="h-fit">
      <CardHeader><CardTitle>Paramètres de l&apos;objectif</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <label className="block text-sm font-medium" htmlFor="g-title">Titre</label>
        <Input id="g-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
        <label className="block text-sm font-medium" htmlFor="g-desc">Description</label>
        <Textarea id="g-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} className="min-h-16" />
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium" htmlFor="g-prio">Priorité</label>
            <select id="g-prio" value={priority} onChange={(e) => setPriority(e.target.value as Goal["priority"])} className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-2 text-sm">
              <option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option>
            </select></div>
          <div><label className="block text-sm font-medium" htmlFor="g-due">Date limite</label><Input id="g-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" /></div>
        </div>
        <Button className="w-full" loading={pending} onClick={() => save()}>Enregistrer</Button>
        {goal.status === "abandoned"
          ? <Button variant="secondary" className="w-full" loading={pending} onClick={() => save(false)}>Reprendre l&apos;objectif</Button>
          : goal.status !== "completed" && <Button variant="ghost" className="w-full" loading={pending} onClick={() => save(true)}>Abandonner l&apos;objectif</Button>}
        {canDelete && (
          <ActionButton variant="danger-ghost" className="w-full" confirm="Supprimer définitivement cet objectif et ses étapes ?" action={() => deleteGoalAction(goal.id)} onDone={() => router.push(afterDeleteHref)}>
            Supprimer
          </ActionButton>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Intention de mise en œuvre (« Quand…, je… ») sur la prochaine étape : relier
 * l'action à un moment précis augmente nettement les chances de la réaliser.
 */
function IntentionEditor({ milestoneId, initial }: { milestoneId: string; initial: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState("");
  const [what, setWhat] = useState("");
  const [pending, start] = useTransition();
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-violet hover:underline">
        <Lightbulb className="size-3" aria-hidden />{initial ? "Modifier mon plan" : "Planifier : quand vais-je m'y mettre ?"}
      </button>
    );
  }
  return (
    <form className="mt-2 grid gap-2 rounded-lg bg-violet-soft/60 p-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const r = await setMilestoneIntentionAction(milestoneId, `Quand ${when.trim()}, je ${what.trim()}.`);
        if (r.ok) { toast.success(r.message); setOpen(false); router.refresh(); } else toast.error(r.error);
      });
    }}>
      <label className="text-xs font-medium">Quand…
        <Input value={when} onChange={(e) => setWhen(e.target.value)} placeholder="je rentre des cours le lundi" maxLength={120} className="mt-1 h-9 bg-white" required />
      </label>
      <label className="text-xs font-medium">je…
        <Input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="fais 30 minutes d'exercices" maxLength={150} className="mt-1 h-9 bg-white" required />
      </label>
      <div className="flex items-end gap-1">
        <Button type="submit" size="sm" loading={pending}>Enregistrer</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
      </div>
    </form>
  );
}
