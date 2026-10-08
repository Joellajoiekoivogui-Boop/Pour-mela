// Tous les calculs de mouvement se font sur la carte graphique : le
// processeur n'envoie que quelques valeurs par image (temps, scène, pointeur)
// et chaque particule calcule elle-même sa position, sa taille, sa couleur.

/* ------------------------------------------------------------------ */
/* Le nuage principal : ciel, prénom, couronne, galaxie, cœur           */
/* ------------------------------------------------------------------ */

export const universeVertex = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uProj;
uniform float uSize;
uniform float uBrightness;
uniform vec4 uFrom;
uniform vec2 uFromE; // cœur, portrait
uniform vec4 uTo;
uniform vec2 uToE;
uniform float uMorph;
uniform float uChaos;
uniform vec4 uFit;
uniform float uFitPortrait;
uniform vec3 uOffset;
uniform float uSpin;
uniform float uTilt;
uniform float uBeat;
uniform float uAudio;
uniform vec2 uPointer;
uniform float uPointerForce;
uniform vec2 uPointerVel;
uniform float uAspect;
uniform float uWarp;
uniform float uTravel;
uniform float uSkyScroll;
uniform float uSkyShare;

attribute vec4 aSeed;
attribute vec3 aSky;
attribute vec3 aText;
attribute vec3 aCrown;
attribute vec3 aGalaxy;
attribute vec3 aHeart;
attribute vec3 aPortrait;
attribute vec3 aPortraitColor;

varying vec3 vColor;
varying float vAlpha;
varying float vSpark;

const float CAM_Z = 10.0;
const float TAN_HALF = 0.46631;
const float SKY_NEAR = 4.0;
const float SKY_FAR = -26.0;

mat3 rotY(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
}

mat3 rotX(float a) {
  float c = cos(a), s = sin(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
}

void main() {
  float t = uTime;

  // Morphing : chaque particule part avec un léger décalage (aSeed.x),
  // la forme se dessine comme une vague plutôt que d'un bloc.
  float isSky = step(aSeed.w, uSkyShare);
  float m = smoothstep(0.0, 1.0, clamp((uMorph - aSeed.x * 0.35) / 0.65, 0.0, 1.0));
  vec4 w = mix(uFrom, uTo, m);
  vec2 e = mix(uFromE, uToE, m) * (1.0 - isSky);
  w = mix(w, vec4(1.0, 0.0, 0.0, 0.0), isSky);
  float total = max(w.x + w.y + w.z + w.w + e.x + e.y, 0.0001);
  w /= total;
  float wh = e.x / total;
  float wp = e.y / total;
  float shapeW = 1.0 - w.x;

  vec3 drift = vec3(
    sin(t * 0.9 + aSeed.y * 30.0),
    cos(t * 0.8 + aSeed.z * 30.0),
    sin(t * 0.7 + aSeed.x * 30.0)
  );

  // Ciel : voyage vers l'avant, défilement de la page, dérive lente.
  vec3 sky = aSky;
  float depthRange = SKY_NEAR - SKY_FAR;
  sky.z = SKY_FAR + mod(sky.z - SKY_FAR + uTravel * (0.55 + aSeed.y * 0.9), depthRange);
  float halfH = TAN_HALF * (CAM_Z - sky.z) * 1.15;
  sky.y = mod(sky.y + uSkyScroll * (0.6 + aSeed.z * 0.4) + halfH, 2.0 * halfH) - halfH;
  sky.x += sin(t * 0.05 + aSeed.y * 40.0) * 0.2;
  sky.y += cos(t * 0.04 + aSeed.z * 40.0) * 0.2;

  // Les formes.
  vec3 nameP = aText * uFit.x + drift * 0.008 * uFit.x;
  vec3 crownP = rotX(0.32) * (rotY(uSpin) * aCrown) * uFit.y + drift * 0.01;
  vec3 galP = rotX(uTilt) * (rotY(uSpin * 0.9) * aGalaxy) * uFit.z + drift * 0.02;
  float beat = 1.0 + uBeat * 0.09 + uAudio * 0.05;
  vec3 heartP = rotY(sin(uSpin) * 0.5) * aHeart * uFit.w * beat + drift * 0.008;

  // Son visage : une mosaïque de lumière, chaque particule a la couleur
  // du point de la photo qu'elle représente.
  vec3 portraitP = aPortrait * uFitPortrait + drift * 0.004 * uFitPortrait;

  vec3 shape = nameP * w.y + crownP * w.z + galP * w.w + heartP * wh + portraitP * wp;
  vec3 p = sky * w.x + shape + uOffset * shapeW;

  // Énergie des transitions et des explosions.
  vec3 dir = normalize(aSeed.xyz - 0.5 + 0.0001);
  float chaos = uChaos * ((0.35 + aSeed.y) * shapeW + 0.12 * w.x);
  p += dir * chaos * 2.4 + drift * chaos * 0.6;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;

  // Le doigt (ou la souris) écarte et fait tourbillonner la lumière.
  vec2 ndc = clip.xy / clip.w;
  vec2 d = (ndc - uPointer) * vec2(uAspect, 1.0);
  float dist = length(d);
  float fall = exp(-dist * dist * 9.0) * uPointerForce;
  vec2 n = d / (dist + 0.0001);
  vec2 push = (n * 0.1 + vec2(-n.y, n.x) * 0.06) * fall + uPointerVel * fall * 0.012;
  push.x /= uAspect;
  clip.xy = (ndc + push) * clip.w;
  gl_Position = clip;

  float depth = max(-mv.z, 0.5);
  float big = pow(aSeed.y, 7.0);
  float skySize = 0.028 + big * 0.12;
  float shapeSize = mix(0.02 + aSeed.y * 0.022, 0.034 + aSeed.y * 0.012, wp);
  float worldSize = mix(skySize, shapeSize, shapeW) * uSize;
  worldSize *= 1.0 + uAudio * 0.5 * aSeed.z + uBeat * 0.3 * shapeW + uWarp * 1.4 * w.x;
  gl_PointSize = clamp(worldSize * uProj / depth, 1.3, 46.0);

  float twinkle = 0.6 + 0.4 * sin(t * (0.8 + aSeed.z * 2.6) + aSeed.x * 60.0);
  float nearFade = smoothstep(0.8, 3.0, depth);
  float farFade = 1.0 - smoothstep(26.0, 36.0, depth) * 0.6;
  vAlpha = uBrightness * mix(twinkle, 0.82 + 0.18 * twinkle, shapeW) * nearFade * farFade;
  vAlpha = mix(vAlpha, uBrightness * nearFade, wp * 0.7);
  vAlpha *= 1.0 + uBeat * 0.35 * shapeW;

  vec3 gold = vec3(1.0, 0.76, 0.38);
  vec3 champagne = vec3(1.0, 0.92, 0.78);
  vec3 rose = vec3(1.0, 0.42, 0.6);
  vec3 deep = vec3(0.86, 0.16, 0.38);
  vec3 lilac = vec3(0.7, 0.6, 1.0);
  vec3 skyCol = aSeed.z < 0.55 ? mix(champagne, vec3(1.0), aSeed.x)
    : aSeed.z < 0.8 ? mix(gold, champagne, aSeed.x)
    : aSeed.z < 0.92 ? rose : lilac;
  vec3 goldCol = aSeed.y > 0.94 ? rose : mix(gold, champagne, aSeed.z * aSeed.z);
  vec3 heartCol = aSeed.z < 0.72 ? mix(deep, rose, aSeed.x) : mix(rose, champagne, aSeed.x);
  float gr = length(aGalaxy.xz) / 3.0;
  vec3 armCol = aSeed.z < 0.5 ? rose : aSeed.z < 0.8 ? lilac : gold;
  vec3 galCol = mix(champagne, armCol, smoothstep(0.05, 0.6, gr));
  vColor = skyCol * w.x + goldCol * (w.y + w.z) + galCol * w.w + heartCol * wh + aPortraitColor * wp;
  vColor = mix(vColor, vec3(1.0), uWarp * 0.5 * w.x);
  vSpark = step(0.985, aSeed.y);
}
`;

export const glowFragment = /* glsl */ `
precision highp float;

varying vec3 vColor;
varying float vAlpha;
varying float vSpark;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d2 = dot(uv, uv);
  float a = exp(-d2 * 18.0) - 0.011;
  if (vSpark > 0.5) {
    float rays = max(0.0, 1.0 - abs(uv.x) * 16.0) * smoothstep(0.5, 0.0, abs(uv.y))
      + max(0.0, 1.0 - abs(uv.y) * 16.0) * smoothstep(0.5, 0.0, abs(uv.x));
    a = max(exp(-d2 * 60.0) + a * 0.4, rays * 0.85);
  }
  a *= vAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor, a);
}
`;

/* ------------------------------------------------------------------ */
/* Étincelles : cœurs, étoiles, anneaux, feux d'artifice               */
/* ------------------------------------------------------------------ */

export const sparkVertex = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uProj;

attribute vec3 aOrigin;
attribute vec3 aVelocity;
attribute vec4 aInfo; // naissance, durée de vie, sorte, taille
attribute vec3 aColor;

varying vec3 vColor;
varying float vAlpha;
varying float vKind;
varying float vRot;

void main() {
  float age = uTime - aInfo.x;
  float life = aInfo.y;
  float kind = aInfo.z;
  float x = age / life;
  if (age < 0.0 || x >= 1.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    return;
  }

  // 0 poussière · 1 cœur · 2 étoile · 3 anneau · 4 étincelle de feu d'artifice
  float drag = kind > 2.5 && kind < 3.5 ? 0.001 : 1.35;
  vec3 p = aOrigin + aVelocity * (1.0 - exp(-drag * age)) / drag;
  float gravity = kind < 0.5 ? -0.08 : kind < 1.5 ? -0.42 : kind < 2.5 ? 0.16 : kind < 3.5 ? 0.0 : 1.05;
  p.y -= 0.5 * gravity * age * age;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float size = aInfo.w;
  if (kind > 2.5 && kind < 3.5) size *= 0.15 + 0.85 * sqrt(x);
  else size *= smoothstep(0.0, 0.08, x) * (1.0 - x * x * 0.55);
  gl_PointSize = clamp(size * uProj / max(-mv.z, 0.5), 0.0, 260.0);

  float fade = kind > 2.5 && kind < 3.5 ? (1.0 - x) * (1.0 - x) : pow(1.0 - x, 1.3);
  if (kind > 3.5) fade *= 0.65 + 0.35 * sin(age * 38.0 + aOrigin.x * 50.0);
  vAlpha = fade;
  vColor = aColor;
  vKind = kind;
  vRot = aVelocity.x * 0.35 + sin(age * 3.0 + aOrigin.y * 9.0) * 0.3;
}
`;

export const sparkFragment = /* glsl */ `
precision highp float;

varying vec3 vColor;
varying float vAlpha;
varying float vKind;
varying float vRot;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d2 = dot(uv, uv);
  float a;
  vec3 color = vColor;
  if (vKind > 0.5 && vKind < 1.5) {
    float c = cos(vRot), s = sin(vRot);
    vec2 r = mat2(c, -s, s, c) * uv;
    vec2 p = vec2(r.x, -r.y) * 2.55 + vec2(0.0, 0.12);
    float q = p.x * p.x + p.y * p.y - 1.0;
    float f = q * q * q - p.x * p.x * p.y * p.y * p.y;
    float body = 1.0 - smoothstep(-0.03, 0.03, f);
    color = mix(color, vec3(1.0, 0.92, 0.95), body * smoothstep(0.1, 0.9, p.y) * 0.45);
    a = body * 0.95 + exp(-d2 * 9.0) * 0.28;
  } else if (vKind > 1.5 && vKind < 2.5) {
    float rays = max(0.0, 1.0 - abs(uv.x) * 14.0) * smoothstep(0.5, 0.0, abs(uv.y))
      + max(0.0, 1.0 - abs(uv.y) * 14.0) * smoothstep(0.5, 0.0, abs(uv.x));
    a = max(exp(-d2 * 70.0), rays) + exp(-d2 * 14.0) * 0.25;
  } else if (vKind > 2.5 && vKind < 3.5) {
    float ring = abs(sqrt(d2) - 0.42);
    a = smoothstep(0.05, 0.0, ring) * 0.9 + smoothstep(0.16, 0.0, ring) * 0.25;
  } else {
    a = exp(-d2 * 20.0) - 0.007;
  }
  a *= vAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(color, a);
}
`;

/* ------------------------------------------------------------------ */
/* Pétales de rose (instanciés)                                         */
/* ------------------------------------------------------------------ */

export const petalVertex = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uAmount;
uniform float uAspect;
uniform float uSkyScroll;
uniform float uWind;
uniform vec2 uPointer;
uniform float uPointerForce;

attribute vec3 aStart;
attribute vec4 aSeed;

varying vec2 vUv;
varying float vShade;
varying float vAlpha;

const float CAM_Z = 10.0;
const float TAN_HALF = 0.46631;

mat3 rotation(vec3 a) {
  float cx = cos(a.x), sx = sin(a.x);
  float cy = cos(a.y), sy = sin(a.y);
  float cz = cos(a.z), sz = sin(a.z);
  mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cx, sx, 0.0, -sx, cx);
  mat3 ry = mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
  mat3 rz = mat3(cz, sz, 0.0, -sz, cz, 0.0, 0.0, 0.0, 1.0);
  return rz * ry * rx;
}

void main() {
  vUv = uv;
  float visible = smoothstep(aSeed.w, aSeed.w + 0.12, uAmount);
  vAlpha = visible;

  vec3 local = position;
  local.z += local.x * local.x * (0.7 + aSeed.x * 0.8) - local.y * local.y * 0.18;
  local *= (0.11 + aSeed.y * 0.13) * (0.4 + 0.6 * visible);

  float t = uTime;
  vec3 angles = vec3(
    t * (0.35 + aSeed.x * 0.9) + aSeed.z * 6.28,
    t * (0.25 + aSeed.y * 0.7) + aSeed.x * 6.28,
    t * (0.18 + aSeed.z * 0.5) + aSeed.y * 6.28
  );
  mat3 r = rotation(angles);
  local = r * local;
  vShade = 0.55 + 0.45 * abs((r * vec3(0.0, 0.0, 1.0)).z);

  float halfH = TAN_HALF * (CAM_Z - aStart.z) + 0.6;
  float halfW = halfH * uAspect;
  float fall = t * (0.32 + aSeed.y * 0.42) - uSkyScroll * 0.8;
  float y = mod(aStart.y * halfH - fall + halfH, 2.0 * halfH) - halfH;
  float x = aStart.x * halfW
    + sin(t * (0.45 + aSeed.z * 0.6) + aSeed.x * 10.0) * 0.55
    + uWind * (0.6 + aSeed.z);
  vec3 world = vec3(x, y, aStart.z) + local;

  vec4 clip = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
  vec2 ndc = clip.xy / clip.w;
  vec2 d = (ndc - uPointer) * vec2(uAspect, 1.0);
  float dist = length(d);
  float push = exp(-dist * dist * 7.0) * uPointerForce * 0.14;
  vec2 n = d / (dist + 0.0001);
  ndc += vec2(n.x / uAspect, n.y) * push;
  clip.xy = ndc * clip.w;
  gl_Position = clip;
}
`;

export const petalFragment = /* glsl */ `
precision highp float;

varying vec2 vUv;
varying float vShade;
varying float vAlpha;

void main() {
  float y = vUv.y;
  float x = vUv.x - 0.5;
  float halfWidth = sin(pow(y, 0.72) * 3.14159) * 0.48;
  float notch = smoothstep(0.07, 0.0, abs(x)) * smoothstep(0.86, 1.0, y) * 0.12;
  float edge = smoothstep(halfWidth, halfWidth - 0.05, abs(x)) * smoothstep(1.0 - notch, 0.97 - notch, y);
  if (edge < 0.01 || vAlpha < 0.01) discard;

  vec3 base = vec3(0.5, 0.04, 0.16);
  vec3 middle = vec3(0.93, 0.27, 0.45);
  vec3 tip = vec3(1.0, 0.7, 0.78);
  vec3 color = mix(base, middle, smoothstep(0.0, 0.45, y));
  color = mix(color, tip, smoothstep(0.5, 1.0, y) * 0.8);
  color *= 1.0 - 0.1 * smoothstep(0.025, 0.0, abs(x)) * (1.0 - y);
  color *= vShade;
  color += vec3(1.0, 0.8, 0.85) * smoothstep(halfWidth - 0.06, halfWidth, abs(x)) * 0.12;

  float alpha = edge * vAlpha * 0.92;
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

/* ------------------------------------------------------------------ */
/* Traînées « vitesse lumière » (dessinées directement à l'écran)       */
/* ------------------------------------------------------------------ */

export const streakVertex = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uWarp;
uniform float uAspect;

attribute vec4 aSeed;

varying float vAlpha;
varying float vAlong;
varying float vHue;

void main() {
  float angle = aSeed.x * 6.28318;
  float r = fract(aSeed.z + uTime * (0.25 + aSeed.y * 0.9) * (0.4 + uWarp * 1.6));
  float r2 = r * r;
  vec2 dir = vec2(cos(angle), sin(angle));
  float len = (0.04 + r2 * 1.1) * uWarp * (0.4 + aSeed.w);
  float radius = 0.04 + r2 * 2.3;
  vec2 along = dir * (radius + position.x * len);
  vec2 across = vec2(-dir.y, dir.x) * position.y * (0.002 + r2 * 0.007);
  vec2 pos = along + across;
  pos.x /= uAspect;
  gl_Position = vec4(pos, 0.0, 1.0);
  vAlong = position.x;
  vAlpha = uWarp * smoothstep(0.0, 0.25, r);
  vHue = aSeed.w;
}
`;

export const streakFragment = /* glsl */ `
precision highp float;

varying float vAlpha;
varying float vAlong;
varying float vHue;

void main() {
  vec3 color = vHue < 0.6 ? vec3(1.0, 0.9, 0.75) : vHue < 0.85 ? vec3(1.0, 0.55, 0.7) : vec3(0.75, 0.68, 1.0);
  float a = vAlpha * (1.0 - vAlong) * 0.85;
  gl_FragColor = vec4(color, a);
}
`;
