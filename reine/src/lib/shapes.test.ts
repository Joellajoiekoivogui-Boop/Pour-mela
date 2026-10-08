// Tests des générateurs de formes : npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { createRandom } from "./random.ts";
import {
  CAMERA_Z,
  crownShape,
  galaxyShape,
  GALAXY_RADIUS,
  heartShape,
  seeds,
  SKY_FAR,
  SKY_NEAR,
  skyShape,
  TAN_HALF_FOV,
} from "./shapes.ts";

const COUNT = 5000;

function bounds(points: Float32Array) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < points.length; i++) {
    const axis = i % 3;
    assert.ok(Number.isFinite(points[i]), `valeur non finie à l'indice ${i}`);
    min[axis] = Math.min(min[axis], points[i]);
    max[axis] = Math.max(max[axis], points[i]);
  }
  return { min, max };
}

test("le hasard est reproductible d'un chargement à l'autre", () => {
  const a = createRandom(42);
  const b = createRandom(42);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
});

test("chaque forme remplit exactement le nombre de points demandé", () => {
  for (const shape of [skyShape(COUNT, 0.5), crownShape(COUNT), galaxyShape(COUNT), heartShape(COUNT)]) {
    assert.equal(shape.length, COUNT * 3);
    bounds(shape);
  }
  assert.equal(seeds(COUNT).length, COUNT * 4);
});

test("le cœur tient dans une largeur de 2, centré", () => {
  const { min, max } = bounds(heartShape(COUNT));
  assert.ok(min[0] >= -1.05 && max[0] <= 1.05);
  assert.ok(Math.abs((min[1] + max[1]) / 2) < 0.15, "centré verticalement");
});

test("la couronne a un rayon d'environ 1 et reste centrée", () => {
  const { min, max } = bounds(crownShape(COUNT));
  assert.ok(max[0] > 0.9 && max[0] < 1.2);
  assert.ok(min[0] < -0.9 && min[0] > -1.2);
  assert.ok(Math.abs((min[1] + max[1]) / 2) < 0.2, "centrée verticalement");
});

test("la galaxie reste plate et dans son rayon", () => {
  const { min, max } = bounds(galaxyShape(COUNT));
  assert.ok(max[1] - min[1] < 2, "disque fin");
  assert.ok(max[0] < GALAXY_RADIUS * 1.6 && min[0] > -GALAXY_RADIUS * 1.6);
});

test("le ciel reste dans le champ de la caméra", () => {
  const aspect = 0.46;
  const sky = skyShape(COUNT, aspect);
  for (let i = 0; i < COUNT; i++) {
    const [x, y, z] = [sky[i * 3], sky[i * 3 + 1], sky[i * 3 + 2]];
    assert.ok(z >= SKY_FAR && z <= SKY_NEAR);
    const halfH = TAN_HALF_FOV * (CAMERA_Z - z) * 1.15;
    assert.ok(Math.abs(y) <= halfH + 1e-6);
    assert.ok(Math.abs(x) <= halfH * aspect + 0.6 + 1e-6);
  }
});
