import { test } from "node:test";
import assert from "node:assert/strict";
import { isReviewDue, milestoneFeedback, nextAction, profileChecklist } from "../learning.ts";

const now = new Date("2026-11-10T12:00:00Z");
const base = { mentee_takeaways: "Découper en étapes", takeaways_at: "2026-11-09T12:00:00Z", reviewed_at: null, review_count: 0 };

test("révision espacée : J+2, puis tous les 7 jours, 4 fois au plus", () => {
  assert.equal(isReviewDue(base, now), false);
  assert.equal(isReviewDue({ ...base, takeaways_at: "2026-11-08T11:00:00Z" }, now), true);
  assert.equal(isReviewDue({ ...base, takeaways_at: "2026-11-01T00:00:00Z", reviewed_at: "2026-11-05T00:00:00Z", review_count: 1 }, now), false);
  assert.equal(isReviewDue({ ...base, takeaways_at: "2026-10-01T00:00:00Z", reviewed_at: "2026-11-02T00:00:00Z", review_count: 1 }, now), true);
  assert.equal(isReviewDue({ ...base, takeaways_at: "2026-10-01T00:00:00Z", reviewed_at: "2026-10-02T00:00:00Z", review_count: 4 }, now), false);
  assert.equal(isReviewDue({ ...base, mentee_takeaways: null }, now), false);
});

test("prochaine action : objectif prioritaire, première étape non faite", () => {
  const ms = (done: boolean[]) => done.map((d, i) => ({ id: `m${i}`, title: `Étape ${i + 1}`, is_done: d, position: i + 1 }));
  const r = nextAction([
    { id: "a", title: "Bas", status: "in_progress", priority: "low", due_date: null, milestones: ms([false]) },
    { id: "b", title: "Haut", status: "in_progress", priority: "high", due_date: null, milestones: ms([true, false, false]) },
    { id: "c", title: "Fini", status: "completed", priority: "high", due_date: null, milestones: ms([true]) },
  ]);
  assert.equal(r?.goal.id, "b");
  assert.equal(r?.step.title, "Étape 2");
  assert.equal(r?.done, 1);
  assert.equal(nextAction([]), null);
});

test("profil : 6 éléments utiles au matching", () => {
  const list = profileChecklist({ avatar: false, bio: true, education: true, domains: 1, wanted: 0, goals: true });
  assert.equal(list.length, 6);
  assert.equal(list.filter((x) => x.done).length, 4);
});

test("retour sur la compétence : début, mi-parcours, fin", () => {
  assert.match(milestoneFeedback(1, 6), /Première étape/);
  assert.match(milestoneFeedback(3, 6), /moitié/);
  assert.match(milestoneFeedback(6, 6), /Objectif atteint/);
  assert.match(milestoneFeedback(4, 6), /4 sur 6/);
});
