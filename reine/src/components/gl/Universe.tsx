"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { reine } from "@/config/reine";
import { director } from "@/lib/director";
import { crownShape, galaxyShape, heartShape, seeds, skyShape, TAN_HALF_FOV, textShape } from "@/lib/shapes";
import { additive } from "./blending";
import { glowFragment, universeVertex } from "./shaders";
import { glState, refit } from "./state";

/** Part des particules qui restent toujours des étoiles dans le ciel. */
const SKY_SHARE = 0.3;

/**
 * Le nuage principal : des dizaines de milliers de particules dans un seul
 * appel de dessin. Chacune connaît sa place dans chaque forme (ciel, prénom,
 * couronne, galaxie, cœur) et la carte graphique les fait voyager de l'une
 * à l'autre.
 */
export function Universe() {
  const count = director.quality.particles;
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const aspect = typeof window === "undefined" ? 1 : window.innerWidth / Math.max(1, window.innerHeight);
    const heart = heartShape(count);
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds(count), 4));
    g.setAttribute("aSky", new THREE.BufferAttribute(skyShape(count, aspect), 3));
    g.setAttribute("aText", new THREE.BufferAttribute(heart.slice(), 3));
    g.setAttribute("aCrown", new THREE.BufferAttribute(crownShape(count), 3));
    g.setAttribute("aGalaxy", new THREE.BufferAttribute(galaxyShape(count), 3));
    g.setAttribute("aHeart", new THREE.BufferAttribute(heart, 3));
    g.userData.aspect = aspect;
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: universeVertex,
        fragmentShader: glowFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        ...additive,
        uniforms: {
          uTime: { value: 0 },
          uProj: { value: 1000 },
          uSize: { value: 1 },
          uBrightness: { value: 0 },
          uFrom: { value: new THREE.Vector4(1, 0, 0, 0) },
          uFromH: { value: 0 },
          uTo: { value: new THREE.Vector4(1, 0, 0, 0) },
          uToH: { value: 0 },
          uMorph: { value: 1 },
          uChaos: { value: 0 },
          uFit: { value: new THREE.Vector4(3, 1, 1, 1) },
          uOffset: { value: new THREE.Vector3() },
          uSpin: { value: 0 },
          uTilt: { value: 1.15 },
          uBeat: { value: 0 },
          uAudio: { value: 0 },
          uPointer: { value: new THREE.Vector2(5, 5) },
          uPointerForce: { value: 0 },
          uPointerVel: { value: new THREE.Vector2() },
          uAspect: { value: 1 },
          uWarp: { value: 0 },
          uTravel: { value: 0 },
          uSkyScroll: { value: 0 },
          uSkyShare: { value: SKY_SHARE },
        },
      }),
    [],
  );

  // Le prénom : échantillonné dès que la police manuscrite est chargée.
  useEffect(() => {
    let cancelled = false;
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-great-vibes").trim() || "cursive";
    const sample = () => {
      if (cancelled) return;
      const text = textShape(count, reine.prenom, family);
      if (!text) return;
      const attribute = geometry.getAttribute("aText") as THREE.BufferAttribute;
      (attribute.array as Float32Array).set(text.positions);
      attribute.needsUpdate = true;
      glState.textRatio = text.ratio;
      refit();
    };
    document.fonts.load(`100px ${family}`).then(sample, sample);
    return () => {
      cancelled = true;
    };
  }, [count, geometry]);

  // Le ciel est recalculé si la forme de l'écran change nettement
  // (téléphone tourné), pour ne pas gaspiller de particules hors champ.
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const previous = geometry.userData.aspect as number;
    if (Math.abs(aspect - previous) / previous < 0.15) return;
    const timer = window.setTimeout(() => {
      const attribute = geometry.getAttribute("aSky") as THREE.BufferAttribute;
      (attribute.array as Float32Array).set(skyShape(count, aspect));
      attribute.needsUpdate = true;
      geometry.userData.aspect = aspect;
    }, 300);
    return () => window.clearTimeout(timer);
  }, [size.width, size.height, count, geometry]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame(() => {
    const u = material.uniforms;
    const g = glState;
    u.uTime.value = g.time;
    u.uProj.value = (size.height * dpr) / (2 * TAN_HALF_FOV);
    u.uSize.value = director.quality.tier === "low" ? 1.25 : 1;
    u.uBrightness.value = g.brightness;
    (u.uFrom.value as THREE.Vector4).set(g.from[0], g.from[1], g.from[2], g.from[3]);
    u.uFromH.value = g.from[4];
    (u.uTo.value as THREE.Vector4).set(g.to[0], g.to[1], g.to[2], g.to[3]);
    u.uToH.value = g.to[4];
    u.uMorph.value = g.morph;
    u.uChaos.value = g.chaos;
    (u.uFit.value as THREE.Vector4).set(g.fit.text, g.fit.crown, g.fit.galaxy, g.fit.heart);
    (u.uOffset.value as THREE.Vector3).set(0, g.offsetY, 0);
    u.uSpin.value = g.spin;
    u.uTilt.value = g.tilt;
    u.uBeat.value = g.beat;
    u.uAudio.value = g.audio;
    (u.uPointer.value as THREE.Vector2).set(g.pointer.x, g.pointer.y);
    u.uPointerForce.value = g.pointerForce;
    (u.uPointerVel.value as THREE.Vector2).set(g.pointer.vx, g.pointer.vy);
    u.uAspect.value = g.aspect;
    u.uWarp.value = g.warp;
    u.uTravel.value = g.travel;
    u.uSkyScroll.value = g.skyScroll;
    geometry.setDrawRange(0, Math.floor(count * g.detail));
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
