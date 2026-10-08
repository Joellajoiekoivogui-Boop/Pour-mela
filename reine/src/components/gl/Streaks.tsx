"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { director } from "@/lib/director";
import { createRandom } from "@/lib/random";
import { additive } from "./blending";
import { streakFragment, streakVertex } from "./shaders";
import { glState } from "./state";

/** Les traînées de lumière du saut en « vitesse lumière ». */
export function Streaks() {
  const count = director.quality.streaks;
  const mesh = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([0, -0.5, 0, 1, -0.5, 0, 1, 0.5, 0, 0, 0.5, 0]), 3),
    );
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const random = createRandom(131);
    const seed = new Float32Array(count * 4);
    for (let i = 0; i < seed.length; i++) seed[i] = random();
    g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seed, 4));
    g.instanceCount = count;
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: streakVertex,
        fragmentShader: streakFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        ...additive,
        uniforms: { uTime: { value: 0 }, uWarp: { value: 0 }, uAspect: { value: 1 } },
      }),
    [],
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame(() => {
    const visible = glState.warp > 0.01;
    if (mesh.current) mesh.current.visible = visible;
    if (!visible) return;
    material.uniforms.uTime.value = glState.time;
    material.uniforms.uWarp.value = glState.warp;
    material.uniforms.uAspect.value = glState.aspect;
  });

  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} visible={false} />;
}
