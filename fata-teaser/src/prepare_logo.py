"""Prépare le logo Fata en pièces nettes et haute définition.

Le logo fourni est un petit JPEG (478 × 215). On sépare ses deux couleurs
(jaune des accolades, noir du mot « fata »), on agrandit chaque masque ×6 puis
on resserre les bords : le logo reste fidèle à l'original mais net en 1080p.

Sorties (assets/logo/) : brace-left.png, brace-right.png, f.png, a1.png,
t.png, a2.png, full.png + parts.json (positions dans le repère du logo
agrandi).
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "logo-fata-source.jpg"
OUT = ROOT / "assets" / "logo"
SCALE = 6

# Couleurs du logo officiel (mesurées dans le fichier source)
YELLOW = (254, 224, 72)
BLACK = (17, 17, 17)


def crisp(mask: np.ndarray) -> np.ndarray:
    """Agrandit un masque 0..1 puis resserre l'anticrénelage."""
    h, w = mask.shape
    im = Image.fromarray((mask * 255).astype(np.uint8))
    big = im.resize((w * SCALE, h * SCALE), Image.BICUBIC)
    # lisse le bruit de compression JPEG avant de resserrer le bord
    big = np.asarray(big.filter(ImageFilter.GaussianBlur(SCALE * 0.75))).astype(float) / 255
    lo, hi = 0.40, 0.60
    x = np.clip((big - lo) / (hi - lo), 0, 1)
    return x * x * (3 - 2 * x)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    a = np.asarray(Image.open(SRC).convert("RGB")).astype(float) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # jaune : fort en rouge/vert, faible en bleu ; noir : faible luminance
    yellow = np.clip((r - b - 0.15) / 0.55, 0, 1) * (r > 0.45)
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    black = np.clip((0.75 - lum) / 0.6, 0, 1) * (1 - yellow)
    my, mb = crisp(yellow), crisp(black)

    H, W = my.shape

    def layer(mask, color, x0, x1, name):
        x0, x1 = x0 * SCALE, x1 * SCALE
        sub = mask[:, x0:x1]
        rows = np.where(sub.max(1) > 0.02)[0]
        y0, y1 = int(rows.min()), int(rows.max()) + 1
        sub = sub[y0:y1]
        rgba = np.zeros(sub.shape + (4,), np.uint8)
        rgba[..., :3] = color
        rgba[..., 3] = (sub * 255).astype(np.uint8)
        Image.fromarray(rgba, "RGBA").save(OUT / f"{name}.png", optimize=True)
        return {"x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0}

    parts = {
        "W": W,
        "H": H,
        "brace-left": layer(my, YELLOW, 0, 66, "brace-left"),
        "brace-right": layer(my, YELLOW, 404, 478, "brace-right"),
        "f": layer(mb, BLACK, 62, 135, "f"),
        "a1": layer(mb, BLACK, 135, 231, "a1"),
        "t": layer(mb, BLACK, 231, 306, "t"),
        "a2": layer(mb, BLACK, 306, 408, "a2"),
    }
    # version complète (contrôle visuel)
    full = np.zeros((H, W, 4), np.uint8)
    alpha = np.clip(my + mb, 0, 1)
    col = (my[..., None] * np.array(YELLOW) + mb[..., None] * np.array(BLACK)) / np.maximum(alpha, 1e-6)[..., None]
    full[..., :3] = np.clip(col, 0, 255).astype(np.uint8)
    full[..., 3] = (alpha * 255).astype(np.uint8)
    Image.fromarray(full, "RGBA").save(OUT / "full.png", optimize=True)
    (OUT / "parts.json").write_text(json.dumps(parts, indent=2))
    print(json.dumps(parts), file=sys.stderr)


if __name__ == "__main__":
    main()
