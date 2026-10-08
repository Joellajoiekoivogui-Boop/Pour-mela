"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { director } from "@/lib/director";
import { createRandom } from "@/lib/random";
import { petalFragment, petalVertex } from "./shaders";
import { glState } from "./state";

/**
 * Pétales de rose : une seule géométrie, dessinée des centaines de fois
 * (instanciation). Chute, tournoiement et courbure sont calculés par le GPU.
 */
export function Petals() {
  const count = director.quality.petals;

  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(0.8, 1, 3, 5);
    const g = new THREE.InstancedBufferGeometry();
    g.index = plane.index;
    g.setAttribute("position", plane.getAttribute("position"));
    g.setAttribute("uv", plane.getAttribute("uv"));
    const random = createRandom(97);
    const start = new Float32Array(count * 3);
    const seed = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      start[i * 3] = random() * 2 - 1;
      start[i * 3 + 1] = random() * 2 - 1;
      start[i * 3 + 2] = -7 + random() * 10;
      for (let k = 0; k < 4; k++) seed[i * 4 + k] = random();
    }
    g.setAttribute("aStart", new THREE.InstancedBufferAttribute(start, 3));
    g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seed, 4));
    g.instanceCount = count;
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: petalVertex,
        fragmentShader: petalFragment,
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uAmount: { value: 0 },
          uAspect: { value: 1 },
          uSkyScroll: { value: 0 },
          uWind: { value: 0 },
          uPointer: { value: new THREE.Vector2(5, 5) },
          uPointerForce: { value: 0 },
        },
      }),
    [],
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame(() => {
    const u = material.uniforms;
    u.uTime.value = glState.time;
    u.uAmount.value = glState.petals * 1.12;
    u.uAspect.value = glState.aspect;
    u.uSkyScroll.value = glState.skyScroll;
    u.uWind.value = glState.wind;
    (u.uPointer.value as THREE.Vector2).set(glState.pointer.x, glState.pointer.y);
    u.uPointerForce.value = glState.pointerForce;
    geometry.instanceCount = Math.max(1, Math.floor(count * Math.max(0.5, glState.detail)));
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} visible={count > 0} />;
}
