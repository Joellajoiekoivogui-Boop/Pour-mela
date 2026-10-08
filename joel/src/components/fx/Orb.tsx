"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { stage } from "@/lib/stage";

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPulse;
  attribute float aSeed;
  varying float vGlow;
  varying float vMix;
  void main() {
    vec3 p = position;
    // La surface respire : une onde lente parcourt la sphère.
    float wave = sin(p.y * 3.2 + uTime * 0.9 + aSeed * 6.28) * 0.04 + sin(p.x * 4.0 - uTime * 0.7) * 0.03;
    p *= 1.0 + wave + uPulse * 0.08;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.55 + 0.45 * sin(uTime * 2.0 + aSeed * 40.0);
    gl_PointSize = uSize * (0.6 + aSeed * 0.8) * twinkle / -mv.z;
    vGlow = twinkle * smoothstep(-4.2, -2.2, mv.z);
    vMix = p.y * 0.5 + 0.5;
  }
`;

const FRAGMENT = /* glsl */ `
  varying float vGlow;
  varying float vMix;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    vec3 violet = vec3(0.55, 0.36, 0.96);
    vec3 white = vec3(0.96, 0.95, 1.0);
    vec3 pink = vec3(0.98, 0.66, 0.83);
    vec3 col = mix(mix(violet, pink, smoothstep(0.0, 0.35, 1.0 - vMix) * 0.5), white, smoothstep(0.4, 1.0, vMix) * 0.7);
    gl_FragColor = vec4(col, a * (0.25 + vGlow * 0.85));
  }
`;

const GLOW_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform float uPulse;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = pow(max(0.0, 1.0 - d), 2.6) * (0.55 + uPulse * 0.4);
    gl_FragColor = vec4(vec3(0.62, 0.45, 1.0) * 1.2, a);
  }
`;

const GLOW_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

function fibonacciSphere(count: number, radius: number) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    positions[i * 3] = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;
    seeds[i] = Math.random();
  }
  return { positions, seeds };
}

function ring(count: number, radius: number) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const jitter = 1 + (Math.random() - 0.5) * 0.04;
    positions[i * 3] = Math.cos(a) * radius * jitter;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.03;
    positions[i * 3 + 2] = Math.sin(a) * radius * jitter;
    seeds[i] = Math.random();
  }
  return { positions, seeds };
}

function Cloud({ data, size, uniforms }: { data: { positions: Float32Array; seeds: Float32Array }; size: number; uniforms: Record<string, THREE.IUniform> }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: { ...uniforms, uSize: { value: size } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [size, uniforms],
  );
  return (
    <points material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[data.seeds, 1]} />
      </bufferGeometry>
    </points>
  );
}

function Sphere({ density }: { density: number }) {
  const group = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uPulse: { value: 0 } }), []);
  const shell = useMemo(() => fibonacciSphere(density, 1.25), [density]);
  const core = useMemo(() => fibonacciSphere(Math.round(density / 4), 0.55), [density]);
  const ringA = useMemo(() => ring(Math.round(density / 3), 1.85), [density]);
  const ringB = useMemo(() => ring(Math.round(density / 4), 2.2), [density]);
  const glow = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GLOW_VERTEX,
        fragmentShader: GLOW_FRAGMENT,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    uniforms.uTime.value = t;
    uniforms.uPulse.value += (stage.party - uniforms.uPulse.value) * 0.05;
    const g = group.current;
    if (g) {
      g.rotation.y += delta * 0.12 * (1 + stage.party * 3);
      // La sphère se penche doucement vers la souris.
      g.rotation.x += (stage.pointer.ny * 0.35 - g.rotation.x) * 0.04;
      g.rotation.z += (-stage.pointer.nx * 0.2 - g.rotation.z) * 0.04;
      g.position.x += (stage.pointer.nx * 0.18 - g.position.x) * 0.03;
      g.position.y += (-stage.pointer.ny * 0.12 + Math.sin(t * 0.6) * 0.06 - g.position.y) * 0.03;
    }
    if (rings.current) {
      rings.current.children[0].rotation.y = t * 0.25;
      rings.current.children[1].rotation.y = -t * 0.18;
    }
  });

  return (
    <>
      <mesh material={glow} scale={5.2}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <group ref={group}>
        <Cloud data={shell} size={34} uniforms={uniforms} />
        <Cloud data={core} size={46} uniforms={uniforms} />
        <group ref={rings}>
          <group rotation={[1.15, 0, 0.35]}>
            <Cloud data={ringA} size={26} uniforms={uniforms} />
          </group>
          <group rotation={[1.9, 0.4, -0.5]}>
            <Cloud data={ringB} size={22} uniforms={uniforms} />
          </group>
        </group>
      </group>
    </>
  );
}

/** La sphère lumineuse de l'accueil : particules, anneaux, halo. */
export default function Orb({ active }: { active: boolean }) {
  const q = stage.quality;
  const density = q.tier === "high" ? 2600 : q.tier === "mid" ? 1700 : 1000;
  return (
    <Canvas
      aria-hidden
      dpr={q.dpr}
      resize={{ offsetSize: true }}
      frameloop={active && !q.reducedMotion ? "always" : "demand"}
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ alpha: true, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <Sphere density={density} />
    </Canvas>
  );
}
