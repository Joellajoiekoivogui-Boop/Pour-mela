import type { SceneName } from "@/types/content";

// Illustrations vectorielles légères (quelques Ko, aucune image à charger) :
// paysages africains stylisés, utilisés comme couvertures d'articles,
// d'histoires et de catégories.

const SKY: Record<SceneName, [string, string]> = {
  savane: ["#ffd9a8", "#ffefd6"],
  fouta: ["#bfe6ff", "#e9f7ff"],
  foret: ["#bfeccf", "#e6f9ec"],
  mer: ["#9fd8ff", "#e3f4ff"],
  ville: ["#ffd2b8", "#fff0e6"],
  sahel: ["#ffc98a", "#ffe8c4"],
  nuit: ["#2b2156", "#4b3a8f"],
  montagne: ["#c8dcff", "#eef4ff"],
  fleuve: ["#bfe9e4", "#effcf9"],
  monument: ["#ffd79a", "#fff1d6"],
  techno: ["#d8ccff", "#f2edff"],
  musique: ["#ffc6d9", "#fff0f5"],
};

function Sun({ x = 320, y = 60, r = 28, color = "#ffd84a" }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * 1.6} fill={color} opacity=".25" />
      <circle cx={x} cy={y} r={r} fill={color} />
    </g>
  );
}

function Baobab({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-12 0 C-10 -30 -14 -55 -8 -70 L8 -70 C14 -55 10 -30 12 0 Z" fill="#8a5a3b" />
      <path d="M-8 -68 L-30 -86 M-4 -70 L-12 -95 M4 -70 L14 -96 M8 -68 L32 -84" stroke="#8a5a3b" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="-30" cy="-90" rx="16" ry="9" fill="#5f9e45" />
      <ellipse cx="-10" cy="-100" rx="16" ry="9" fill="#6fb24f" />
      <ellipse cx="16" cy="-100" rx="18" ry="10" fill="#5f9e45" />
      <ellipse cx="34" cy="-88" rx="14" ry="8" fill="#6fb24f" />
    </g>
  );
}

function Acacia({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 L2 -40 M2 -40 L-14 -52 M2 -40 L16 -54" stroke="#6b4a33" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="0" cy="-58" rx="34" ry="9" fill="#4f8f3a" />
    </g>
  );
}

function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 C2 -25 6 -45 14 -70" stroke="#8a5a3b" strokeWidth="5" fill="none" strokeLinecap="round" />
      {[-60, -20, 20, 60, 100].map((a) => (
        <path key={a} d="M14 -70 q20 -6 34 8" stroke="#2f9e5a" strokeWidth="6" fill="none" strokeLinecap="round" transform={`rotate(${a} 14 -70)`} />
      ))}
    </g>
  );
}

function Tree({ x, y, s = 1, c = "#2f9e5a" }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-3" y="-20" width="6" height="20" fill="#6b4a33" />
      <circle cx="0" cy="-34" r="20" fill={c} />
      <circle cx="-12" cy="-26" r="13" fill={c} />
      <circle cx="12" cy="-26" r="13" fill={c} />
    </g>
  );
}

function Hut({ x, y, wall = "#e8a46a", roof = "#b5793e" }: { x: number; y: number; wall?: string; roof?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-18" y="-26" width="36" height="26" rx="4" fill={wall} />
      <path d="M-26 -24 L0 -50 L26 -24 Z" fill={roof} />
      <rect x="-5" y="-14" width="10" height="14" rx="5" fill="#6b4a33" />
    </g>
  );
}

function Stars() {
  const pts = [
    [30, 30], [80, 18], [140, 40], [200, 22], [250, 50], [300, 20], [360, 38], [60, 70], [180, 70], [380, 80],
  ];
  return (
    <g fill="#fff">
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.1} opacity={0.6 + (i % 3) * 0.15} />
      ))}
    </g>
  );
}

function Ground({ color, d }: { color: string; d?: string }) {
  return <path d={d ?? "M0 190 C80 175 160 200 240 186 S360 178 400 190 V240 H0 Z"} fill={color} />;
}

function Content({ name }: { name: SceneName }) {
  switch (name) {
    case "savane":
      return (
        <>
          <Sun />
          <path d="M0 170 C100 150 200 165 400 150 V240 H0 Z" fill="#f2c27a" />
          <Ground color="#e4a85a" />
          <Baobab x={110} y={200} s={1.1} />
          <Acacia x={300} y={196} s={0.9} />
          <Acacia x={360} y={192} s={0.6} />
          <path d="M20 215 l4 -10 l4 10 M40 220 l3 -8 l3 8 M230 222 l4 -10 l4 10" stroke="#c98a3c" strokeWidth="2" fill="none" />
        </>
      );
    case "fouta":
      return (
        <>
          <Sun x={70} y={55} r={22} />
          <path d="M0 150 L40 110 L120 110 L150 140 L210 100 L300 100 L330 130 L400 115 V240 H0 Z" fill="#7cc48a" />
          <path d="M0 175 L60 150 L150 150 L190 170 L280 140 L400 160 V240 H0 Z" fill="#4fa86a" />
          <path d="M228 102 C232 140 226 170 232 205" stroke="#bfe9ff" strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M228 102 C232 140 226 170 232 205" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7" />
          <Ground color="#3b8f57" d="M0 205 C90 195 180 215 260 205 S360 198 400 205 V240 H0 Z" />
          <Tree x={60} y={210} s={0.8} />
          <Tree x={330} y={208} s={0.9} c="#2f8a4e" />
        </>
      );
    case "foret":
      return (
        <>
          <Sun x={340} y={50} r={20} />
          {[20, 70, 120, 170, 220, 270, 320, 370].map((x, i) => (
            <Tree key={x} x={x} y={175 + (i % 2) * 8} s={1.3} c={i % 2 ? "#2f8a4e" : "#3fa462"} />
          ))}
          <Ground color="#2b7a45" />
          {[40, 140, 250, 350].map((x, i) => (
            <Tree key={x} x={x} y={232} s={1} c={i % 2 ? "#1f6b3a" : "#257a42"} />
          ))}
        </>
      );
    case "mer":
      return (
        <>
          <Sun x={300} y={70} r={26} />
          <path d="M210 150 C240 120 300 120 340 150 Z" fill="#6fbf73" />
          <path d="M0 150 H400 V240 H0 Z" fill="#3f93ec" />
          <path d="M0 165 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" stroke="#cfe6ff" strokeWidth="3" fill="none" />
          <path d="M0 195 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" stroke="#cfe6ff" strokeWidth="3" fill="none" opacity=".7" />
          <path d="M100 178 h70 l-10 12 h-50 Z" fill="#a8410b" />
          <path d="M135 178 v-34 l22 30 Z" fill="#fff8ef" />
          <path d="M0 215 C60 205 120 225 200 220 V240 H0 Z" fill="#f2d39a" />
          <Palm x={40} y={222} s={1} />
        </>
      );
    case "ville":
      return (
        <>
          <Sun x={60} y={60} r={22} />
          {[
            [20, 120, 50, "#ff8a2b"], [75, 100, 45, "#8f6cf0"], [125, 130, 55, "#ffd84a"], [185, 90, 50, "#3f93ec"], [240, 115, 60, "#2fb36d"], [305, 105, 45, "#ff8a2b"], [355, 125, 45, "#8f6cf0"],
          ].map(([x, y, w, c]) => (
            <g key={x as number}>
              <rect x={x as number} y={y as number} width={w as number} height={200 - (y as number)} rx="4" fill={c as string} />
              {Array.from({ length: 3 }).map((_, i) => (
                <rect key={i} x={(x as number) + 8 + i * ((w as number) / 3 - 2)} y={(y as number) + 14} width="8" height="10" rx="2" fill="#fff8ef" opacity=".85" />
              ))}
            </g>
          ))}
          <Ground color="#d9b48a" d="M0 200 H400 V240 H0 Z" />
          <Palm x={170} y={205} s={0.8} />
        </>
      );
    case "sahel":
      return (
        <>
          <Sun x={90} y={60} r={30} color="#ffe27a" />
          <path d="M0 160 C80 130 160 150 240 140 S360 130 400 145 V240 H0 Z" fill="#f3c27e" />
          <path d="M0 190 C100 170 200 195 300 180 S380 175 400 185 V240 H0 Z" fill="#e8a85f" />
          <g transform="translate(250 180)">
            <rect x="-40" y="-40" width="80" height="40" fill="#c98a52" />
            {[-40, -12, 16].map((x) => (
              <path key={x} d={`M${x} -40 v-22 q12 -8 24 0 v22 Z`} fill="#b97a44" />
            ))}
          </g>
          <Acacia x={60} y={196} s={0.8} />
        </>
      );
    case "nuit":
      return (
        <>
          <Stars />
          <circle cx="320" cy="55" r="22" fill="#fff4c2" />
          <circle cx="330" cy="48" r="20" fill="#3a2c74" />
          <path d="M0 180 C120 165 260 185 400 172 V240 H0 Z" fill="#241a49" />
          <Baobab x={330} y={200} s={0.9} />
          <g transform="translate(160 205)">
            <circle r="34" fill="#ffb347" opacity=".25" />
            <path d="M-12 0 L12 0 L0 -26 Z" fill="#ff8a2b" />
            <path d="M-6 0 L6 0 L0 -14 Z" fill="#ffd84a" />
            <path d="M-18 4 h36" stroke="#6b4a33" strokeWidth="4" strokeLinecap="round" />
          </g>
          {[100, 125, 200, 222].map((x, i) => (
            <g key={x} transform={`translate(${x} 212)`} fill="#120c2b">
              <circle cy={-28 + (i % 2) * 6} r="8" />
              <rect x="-9" y={-20 + (i % 2) * 6} width="18" height={22 - (i % 2) * 6} rx="8" />
            </g>
          ))}
        </>
      );
    case "montagne":
      return (
        <>
          <Sun x={80} y={60} r={20} />
          <path d="M0 200 L90 90 L150 150 L230 60 L320 160 L360 120 L400 160 V240 H0 Z" fill="#5f8f6a" />
          <path d="M230 60 L250 84 L236 80 L222 92 L212 82 Z" fill="#e9f3ec" />
          <path d="M0 210 L80 160 L160 200 L260 150 L400 200 V240 H0 Z" fill="#3b7a50" />
          <path d="M0 150 h400" stroke="#fff" strokeWidth="14" opacity=".25" />
          <Tree x={340} y={226} s={0.8} c="#2b6b40" />
        </>
      );
    case "fleuve":
      return (
        <>
          <Sun x={330} y={55} r={22} />
          <path d="M0 140 C100 130 300 150 400 135 V240 H0 Z" fill="#8fd18f" />
          <path d="M170 140 C140 170 260 190 200 240 H290 C320 200 210 175 240 140 Z" fill="#3f93ec" />
          <path d="M200 160 q10 4 20 0 M215 190 q12 5 24 0" stroke="#cfe6ff" strokeWidth="3" fill="none" />
          <Tree x={70} y={200} s={0.9} />
          <Tree x={340} y={205} s={1} c="#2f8a4e" />
          <path d="M120 222 v-18 M126 222 v-24 M132 222 v-16" stroke="#4f8f3a" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "monument":
      return (
        <>
          <Sun x={330} y={55} r={24} />
          <path d="M0 200 H400 V240 H0 Z" fill="#e8b878" />
          <g transform="translate(200 200)">
            <rect x="-110" y="-60" width="220" height="60" fill="#c98a52" />
            {[-100, -40, 20, 80].map((x) => (
              <g key={x}>
                <path d={`M${x} -60 v-40 q10 -14 20 0 v40 Z`} fill="#b97a44" />
                {[0, 1, 2].map((j) => (
                  <path key={j} d={`M${x - 4} ${-70 - j * 10} h28`} stroke="#8a5a3b" strokeWidth="2.5" />
                ))}
              </g>
            ))}
            <rect x="-14" y="-30" width="28" height="30" rx="14" fill="#7a4a2a" />
          </g>
          <Palm x={40} y={205} s={0.8} />
        </>
      );
    case "techno":
      return (
        <>
          <Sun x={70} y={60} r={26} />
          <Ground color="#b6a3f0" d="M0 190 H400 V240 H0 Z" />
          {[150, 230, 310].map((x) => (
            <g key={x} transform={`translate(${x} 190)`}>
              <path d="M-30 -10 L30 -10 L22 -45 L-38 -45 Z" fill="#1f74d1" />
              <path d="M-23 -45 l-4 35 M-8 -45 l-2 35 M7 -45 v35 M-34 -28 h60" stroke="#cfe6ff" strokeWidth="1.5" />
              <rect x="-3" y="-10" width="6" height="12" fill="#4a4560" />
            </g>
          ))}
          <g stroke="#6f48de" strokeWidth="2" fill="none" opacity=".6">
            <path d="M200 40 h40 v20 h30" />
            <path d="M250 30 v-10 h50" />
            <circle cx="270" cy="60" r="4" fill="#6f48de" />
            <circle cx="300" cy="20" r="4" fill="#6f48de" />
          </g>
          <Hut x={60} y={192} wall="#ffc48f" roof="#a8410b" />
        </>
      );
    case "musique":
      return (
        <>
          <Sun x={320} y={55} r={22} />
          <Ground color="#f2a0bd" d="M0 195 H400 V240 H0 Z" />
          <g transform="translate(120 190)">
            <path d="M-70 -30 L70 -30 L60 -20 L-60 -20 Z" fill="#8a5a3b" />
            {Array.from({ length: 9 }).map((_, i) => (
              <rect key={i} x={-62 + i * 14} y={-44} width="11" height="14" rx="2" fill={i % 2 ? "#c98a52" : "#b97a44"} />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <circle key={i} cx={-48 + i * 24} cy={-8} r="8" fill="#e8b878" />
            ))}
          </g>
          <g transform="translate(290 195)">
            <path d="M-18 0 L-24 -40 C-24 -50 24 -50 24 -40 L18 0 Z" fill="#a8410b" />
            <ellipse cx="0" cy="-44" rx="24" ry="6" fill="#f6ead8" />
          </g>
          <g fill="#6f48de">
            <circle cx="200" cy="80" r="6" />
            <path d="M206 80 V50 h14" stroke="#6f48de" strokeWidth="3" fill="none" />
            <circle cx="240" cy="100" r="5" />
            <path d="M245 100 V76" stroke="#6f48de" strokeWidth="3" />
          </g>
        </>
      );
  }
}

export function Scene({ name, className = "", label }: { name: SceneName; className?: string; label?: string }) {
  const [top, bottom] = SKY[name];
  const id = `sky-${name}`;
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#${id})`} />
      <Content name={name} />
    </svg>
  );
}
