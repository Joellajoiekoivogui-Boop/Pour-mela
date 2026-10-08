import { test } from "node:test";
import assert from "node:assert/strict";
import { birthdayInfo, splitDuration } from "./birthday.ts";

test("avant le 10 octobre : compte à rebours vers cette année", () => {
  const info = birthdayInfo(new Date(2026, 9, 8, 12, 0, 0), 10, 10);
  assert.equal(info.phase, "before");
  assert.equal(info.next.getFullYear(), 2026);
  assert.deepEqual(splitDuration(info.remaining), { days: 1, hours: 12, minutes: 0, seconds: 0 });
});

test("le jour J, de minuit à minuit", () => {
  assert.equal(birthdayInfo(new Date(2026, 9, 10, 0, 0, 0), 10, 10).phase, "today");
  assert.equal(birthdayInfo(new Date(2026, 9, 10, 23, 59, 59), 10, 10).phase, "today");
  assert.equal(birthdayInfo(new Date(2026, 9, 10, 9), 10, 10).next.getFullYear(), 2027);
});

test("juste après : une nouvelle année vient de commencer", () => {
  const info = birthdayInfo(new Date(2026, 9, 11, 0, 0, 1), 10, 10);
  assert.equal(info.phase, "after");
  assert.equal(info.next.getFullYear(), 2027);
});

test("longtemps après : on attend de nouveau le prochain", () => {
  assert.equal(birthdayInfo(new Date(2027, 2, 1), 10, 10).phase, "before");
  assert.equal(birthdayInfo(new Date(2026, 11, 31), 10, 10, 30).phase, "before");
});

test("un anniversaire en début d'année : l'« après » traverse le 1er janvier", () => {
  assert.equal(birthdayInfo(new Date(2027, 0, 10), 12, 28).phase, "after");
});

test("découpage d'une durée", () => {
  assert.deepEqual(splitDuration(90_061_000), { days: 1, hours: 1, minutes: 1, seconds: 1 });
  assert.deepEqual(splitDuration(-5), { days: 0, hours: 0, minutes: 0, seconds: 0 });
});
