// Transforme un mot en nuage de points : on l'écrit sur un canevas caché,
// puis on relève les pixels allumés. Sert aux particules qui forment
// « JOËL », « 10.10 » et « HAPPY BIRTHDAY ».

export function sampleText(text: string, width: number, height: number, count: number, font = "Sora, system-ui, sans-serif"): Float32Array {
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 900 / width);
  const w = Math.max(1, Math.floor(width * scale));
  const h = Math.max(1, Math.floor(height * scale));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const out = new Float32Array(count * 2);
  if (!ctx) return out;

  // La taille de police s'ajuste pour que chaque ligne tienne en largeur.
  // « \n » coupe le texte en plusieurs lignes (écrans en hauteur).
  const lines = text.split("\n");
  let size = (h * 0.42) / Math.max(1, lines.length * 0.8);
  ctx.font = `800 ${size}px ${font}`;
  const measured = Math.max(...lines.map((line) => ctx.measureText(line).width));
  const maxWidth = w * 0.86;
  if (measured > maxWidth) size *= maxWidth / measured;
  ctx.font = `800 ${size}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  const lineHeight = size * 1.05;
  lines.forEach((line, i) => ctx.fillText(line, w / 2, h / 2 + (i - (lines.length - 1) / 2) * lineHeight));

  const data = ctx.getImageData(0, 0, w, h).data;
  const step = Math.max(1, Math.round(Math.sqrt((w * h) / (count * 9))));
  const hits: number[] = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 128) hits.push(x, y);
    }
  }
  const total = hits.length / 2;
  for (let i = 0; i < count; i++) {
    if (total === 0) {
      out[i * 2] = width / 2;
      out[i * 2 + 1] = height / 2;
      continue;
    }
    const j = Math.floor(Math.random() * total);
    out[i * 2] = (hits[j * 2] + (Math.random() - 0.5) * step) / scale;
    out[i * 2 + 1] = (hits[j * 2 + 1] + (Math.random() - 0.5) * step) / scale;
  }
  return out;
}
