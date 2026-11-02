import { flags } from "@/data/africa";

function Star({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.4;
    return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
  }).join(" ");
  return <polygon points={pts} fill={color} />;
}

/** Drapeau dessiné en SVG (léger, net à toutes les tailles). */
export function Flag({ code, className = "h-8 w-12", title }: { code: string; className?: string; title?: string }) {
  const spec = flags[code];
  if (!spec) return null;
  const W = 60;
  const H = 40;
  const n = spec.stripes.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`${className} rounded-md shadow-sm ring-1 ring-black/10`} role="img" aria-label={title ?? "Drapeau"}>
      {spec.orientation === "benin" ? (
        <>
          <rect width={W} height={H / 2} fill={spec.stripes[1]} />
          <rect y={H / 2} width={W} height={H / 2} fill={spec.stripes[2]} />
          <rect width={W * 0.4} height={H} fill={spec.stripes[0]} />
        </>
      ) : (
        spec.stripes.map((c, i) =>
          spec.orientation === "vertical" ? (
            <rect key={i} x={(W / n) * i} width={W / n + 0.5} height={H} fill={c} />
          ) : (
            <rect key={i} y={(H / n) * i} width={W} height={H / n + 0.5} fill={c} />
          ),
        )
      )}
      {spec.emblem?.shape === "star" && <Star cx={W / 2} cy={H / 2} r={n === 2 ? 8 : 6.5} color={spec.emblem.color} />}
      {spec.emblem?.shape === "circle" && <circle cx={W / 2} cy={H / 2} r={4.5} fill={spec.emblem.color} />}
    </svg>
  );
}
