"use client";

import { Canvas } from "@react-three/fiber";
import { director } from "@/lib/director";
import { CAMERA_FOV, CAMERA_Z } from "@/lib/shapes";
import { Driver } from "./Driver";
import { Petals } from "./Petals";
import { Sparks } from "./Sparks";
import { Streaks } from "./Streaks";
import { Universe } from "./Universe";

/**
 * La scène WebGL, fixe derrière tout le contenu. Chargée à part (code
 * splitting) : l'introduction s'affiche sans attendre Three.js.
 */
export default function Stage() {
  const quality = director.quality;
  return (
    <Canvas
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}
      dpr={quality.dpr}
      flat
      linear
      frameloop="always"
      camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV, near: 0.1, far: 80 }}
      gl={{
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        const canvas = gl.domElement;
        canvas.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          director.setGlActive(false);
        });
        canvas.addEventListener("webglcontextrestored", () => director.setGlActive(true));
        director.setGlActive(true);
      }}
    >
      <Driver />
      <Universe />
      <Petals />
      <Sparks />
      <Streaks />
    </Canvas>
  );
}
