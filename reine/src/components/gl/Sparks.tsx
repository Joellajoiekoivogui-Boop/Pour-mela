"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { director, type SparkRequest } from "@/lib/director";
import { TAN_HALF_FOV } from "@/lib/shapes";
import { additive } from "./blending";
import { sparkFragment, sparkVertex } from "./shaders";
import { glState } from "./state";

// Sortes d'étincelles, comprises par le shader.
const Kind = { Dust: 0, Heart: 1, Star: 2, Ring: 3, Spark: 4 } as const;
type Kind = (typeof Kind)[keyof typeof Kind];

const PALETTES = {
  gold: ["#ffd27a", "#ffe9b8", "#f6c062", "#fff4dc"],
  rose: ["#ff6f9a", "#ff9bb8", "#ff4d7d", "#ffc2d4"],
  lilac: ["#c3b1ff", "#e3d9ff", "#ffd27a"],
  white: ["#ffffff", "#fff4dc", "#ffe9b8"],
} as const;
type Palette = keyof typeof PALETTES;

const COLORS = Object.fromEntries(
  Object.entries(PALETTES).map(([name, list]) => [name, list.map((hex) => new THREE.Color(hex))]),
) as Record<Palette, THREE.Color[]>;

/**
 * Le système d'étincelles : un anneau de milliers d'emplacements sur la
 * carte graphique. Chaque étincelle est écrite une seule fois (position,
 * vitesse, naissance) ; son vol entier est ensuite calculé par le GPU.
 */
export function Sparks() {
  const capacity = director.quality.sparks;
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const { geometry, origin, velocity, info, color } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const origin = new THREE.BufferAttribute(new Float32Array(capacity * 3), 3).setUsage(THREE.DynamicDrawUsage);
    const velocity = new THREE.BufferAttribute(new Float32Array(capacity * 3), 3).setUsage(THREE.DynamicDrawUsage);
    const infoArray = new Float32Array(capacity * 4);
    for (let i = 0; i < capacity; i++) infoArray[i * 4 + 1] = 1; // durée de vie > 0, naissance 0 : invisibles
    for (let i = 0; i < capacity; i++) infoArray[i * 4] = -10;
    const info = new THREE.BufferAttribute(infoArray, 4).setUsage(THREE.DynamicDrawUsage);
    const color = new THREE.BufferAttribute(new Float32Array(capacity * 3), 3).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(capacity * 3), 3));
    g.setAttribute("aOrigin", origin);
    g.setAttribute("aVelocity", velocity);
    g.setAttribute("aInfo", info);
    g.setAttribute("aColor", color);
    return { geometry: g, origin, velocity, info, color };
  }, [capacity]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sparkVertex,
        fragmentShader: sparkFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        ...additive,
        uniforms: { uTime: { value: 0 }, uProj: { value: 1000 } },
      }),
    [],
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  const emitter = useMemo(() => {
    let cursor = 0;
    let written = 0;
    let first = -1;
    const scratch = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const scale = director.quality.tier === "low" ? 0.5 : director.quality.tier === "mid" ? 0.75 : 1;

    const toWorld = (request: SparkRequest) => {
      if (request.world) return scratch.set(request.x, request.y, 0).clone();
      const nx = (request.x / window.innerWidth) * 2 - 1;
      const ny = -(request.y / window.innerHeight) * 2 + 1;
      scratch.set(nx, ny, 0.5).unproject(camera);
      direction.copy(scratch).sub(camera.position).normalize();
      const distance = -camera.position.z / direction.z;
      return camera.position.clone().addScaledVector(direction, distance);
    };

    const pick = (palette: Palette) => {
      const list = COLORS[palette];
      return list[Math.floor(Math.random() * list.length)];
    };

    const write = (
      x: number, y: number, z: number,
      vx: number, vy: number, vz: number,
      life: number, kind: Kind, size: number, tint: THREE.Color,
    ) => {
      const i = cursor;
      if (first < 0) first = i;
      origin.array[i * 3] = x;
      origin.array[i * 3 + 1] = y;
      origin.array[i * 3 + 2] = z;
      velocity.array[i * 3] = vx;
      velocity.array[i * 3 + 1] = vy;
      velocity.array[i * 3 + 2] = vz;
      info.array[i * 4] = glState.time;
      info.array[i * 4 + 1] = life;
      info.array[i * 4 + 2] = kind;
      info.array[i * 4 + 3] = size;
      color.array[i * 3] = tint.r;
      color.array[i * 3 + 1] = tint.g;
      color.array[i * 3 + 2] = tint.b;
      cursor = (cursor + 1) % capacity;
      written++;
      director.stats.sparks++;
    };

    const radial = (
      at: THREE.Vector3, n: number, speed: [number, number], life: [number, number],
      kind: Kind, sizeRange: [number, number], palette: Palette, upward = 0, depth = 0.4,
    ) => {
      for (let k = 0; k < n; k++) {
        const angle = Math.random() * Math.PI * 2;
        const s = speed[0] + Math.random() * (speed[1] - speed[0]);
        write(
          at.x + (Math.random() - 0.5) * 0.1, at.y + (Math.random() - 0.5) * 0.1, at.z + (Math.random() - 0.5) * depth,
          Math.cos(angle) * s, Math.sin(angle) * s + upward, (Math.random() - 0.5) * s * 0.6,
          life[0] + Math.random() * (life[1] - life[0]), kind,
          sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]), pick(palette),
        );
      }
    };

    const emit = (request: SparkRequest) => {
      const at = toWorld(request);
      const amount = (request.amount ?? 1) * scale;
      const n = (base: number) => Math.max(1, Math.round(base * amount));
      switch (request.kind) {
        case "hearts":
          radial(at, n(9), [0.8, 2.4], [1.6, 2.8], Kind.Heart, [0.2, 0.4], Math.random() < 0.8 ? "rose" : "gold", 0.6);
          radial(at, n(10), [1, 3], [0.9, 1.6], Kind.Star, [0.1, 0.2], "gold", 0.3);
          radial(at, n(14), [0.3, 1.6], [1, 2.2], Kind.Dust, [0.05, 0.11], "rose");
          write(at.x, at.y, at.z, 0, 0, 0, 0.9, Kind.Ring, 1.5, pick("white"));
          break;
        case "stars":
          radial(at, n(14), [1.2, 3.4], [1, 1.8], Kind.Star, [0.12, 0.24], "gold", 0.2);
          radial(at, n(18), [0.4, 2], [1.2, 2.4], Kind.Dust, [0.05, 0.12], "white");
          write(at.x, at.y, at.z, 0, 0, 0, 0.8, Kind.Ring, 1.2, pick("gold"));
          break;
        case "gold":
          radial(at, n(10), [0.2, 1.1], [1.4, 2.6], Kind.Dust, [0.06, 0.14], "gold", 0.2);
          radial(at, n(3), [0.4, 1.4], [1, 1.6], Kind.Star, [0.1, 0.18], "white");
          break;
        case "dust":
          radial(at, n(4), [0.15, 0.6], [1.4, 2.6], Kind.Dust, [0.05, 0.1], Math.random() < 0.7 ? "gold" : "rose", 0.35, 0.2);
          break;
        case "trail": {
          const k = glState.viewH / window.innerHeight;
          const vx = (request.vx ?? 0) * k * 0.08;
          const vy = -(request.vy ?? 0) * k * 0.08;
          for (let j = 0; j < n(2); j++) {
            const kind = Math.random() < 0.18 ? Kind.Star : Kind.Dust;
            write(
              at.x + (Math.random() - 0.5) * 0.08, at.y + (Math.random() - 0.5) * 0.08, at.z,
              vx + (Math.random() - 0.5) * 0.5, vy + (Math.random() - 0.5) * 0.5 + 0.15, (Math.random() - 0.5) * 0.3,
              0.7 + Math.random() * 0.7, kind, kind === Kind.Star ? 0.09 + Math.random() * 0.08 : 0.04 + Math.random() * 0.06,
              pick(Math.random() < 0.75 ? "gold" : "rose"),
            );
          }
          break;
        }
        case "ring":
          write(at.x, at.y, at.z, 0, 0, 0, 1.1, Kind.Ring, 2.4, pick("gold"));
          radial(at, n(8), [0.6, 1.8], [1, 2], Kind.Dust, [0.06, 0.12], "gold");
          break;
        case "firework": {
          const palette: Palette = (["gold", "rose", "lilac", "white"] as const)[Math.floor(Math.random() * 4)];
          const sparks = n(150);
          for (let k = 0; k < sparks; k++) {
            // Direction uniforme sur la sphère.
            const u = Math.random() * 2 - 1;
            const theta = Math.random() * Math.PI * 2;
            const r = Math.sqrt(1 - u * u);
            const s = 2.6 + Math.random() * 2.2;
            write(
              at.x, at.y, at.z,
              r * Math.cos(theta) * s, r * Math.sin(theta) * s, u * s * 0.6,
              1.6 + Math.random() * 1.1, Kind.Spark, 0.07 + Math.random() * 0.07, pick(palette),
            );
          }
          radial(at, n(8), [0.4, 1.4], [2, 3], Kind.Heart, [0.22, 0.36], "rose", 0.4);
          write(at.x, at.y, at.z, 0, 0, 0, 1.2, Kind.Ring, 4.5, pick(palette));
          break;
        }
      }
    };

    const flush = () => {
      if (written === 0) return;
      const attributes = [origin, velocity, info, color];
      for (const attribute of attributes) {
        attribute.clearUpdateRanges();
        if (written >= capacity || first + written > capacity) {
          attribute.addUpdateRange(0, capacity * attribute.itemSize);
        } else {
          attribute.addUpdateRange(first * attribute.itemSize, written * attribute.itemSize);
        }
        attribute.needsUpdate = true;
      }
      written = 0;
      first = -1;
    };

    return { emit, flush };
  }, [camera, capacity, origin, velocity, info, color]);

  useFrame(() => {
    const queue = director.sparks;
    while (queue.length) emitter.emit(queue.shift()!);
    emitter.flush();
    material.uniforms.uTime.value = glState.time;
    material.uniforms.uProj.value = (size.height * dpr) / (2 * TAN_HALF_FOV);
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
