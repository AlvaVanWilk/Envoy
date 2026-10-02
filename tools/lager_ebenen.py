#!/usr/bin/env python3
"""Lays the drawings of the facilities onto the camp picture, as layers.

Each drawing in tools/lager-ebenen/ is cut out (transparent background) and
named after its facility and level, e.g. steinlager_2.png for the Steinkiste.
This script scales it and puts it in its place on a transparent canvas of the
size of the camp picture (1792 × 672), with a soft shadow under it, and saves
it as assets/lager/einrichtung_<id>_<stufe>.png. The app lays these over the
picture of the camp (see js/ui/camp.js); the conversion of the tables finds
them on its own.

Level 1 of each facility is not made here: those layers are drawn by hand in
their place on the whole picture and lie in assets/lager/ as they are.

Where each one stands is the table PLACES: the middle (x), the line on the
ground it stands on (y) and its width, in pixels of the camp picture. The
places follow tools/vorlagen/lager-schablone.png: the stores beside the house,
the Aufbewahrung and the Schlafplatz inside on its floor. Change a number and
run it again:

    python3 tools/lager_ebenen.py

Needs Pillow (pip install pillow).
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "tools" / "lager-ebenen"
TARGET = ROOT / "assets" / "lager"
SIZE = (1792, 672)

# (facility, level): (x of the middle, y of the ground line, width)
PLACES = {
    ("steinlager", 2): (548, 476, 160),
    ("steinlager", 3): (548, 476, 140),
    ("pilzlager", 2): (1215, 458, 125),
    ("pilzlager", 3): (1215, 458, 215),
    ("aufbewahrung", 2): (1035, 455, 135),
    ("aufbewahrung", 3): (1035, 455, 120),
    ("aufbewahrung", 4): (1035, 455, 92),
    ("schlafplatz", 2): (800, 453, 180),
    ("schlafplatz", 3): (800, 453, 185),
    ("schlafplatz", 4): (800, 453, 190),
    ("schlafplatz", 5): (800, 453, 195),
}

# drawings that bring their own shadow
OWN_SHADOW = {("aufbewahrung", 3), ("steinlager", 3)}


def shadow(width, height):
    """A soft dark ellipse for under a drawing, so it stands on the ground."""
    pad = 12
    img = Image.new("RGBA", (width + 2 * pad, height + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(img).ellipse([pad, pad, pad + width, pad + height], fill=(8, 16, 18, 120))
    return img.filter(ImageFilter.GaussianBlur(6)), pad


def layer(facility, level, place):
    drawing = Image.open(SOURCE / f"{facility}_{level}.png").convert("RGBA")
    x, ground, width = place
    height = round(drawing.height * width / drawing.width)
    drawing = drawing.resize((width, height), Image.LANCZOS)
    canvas = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    left = round(x - width / 2)
    if (facility, level) not in OWN_SHADOW:
        w, h = round(width * 0.9), max(10, round(width * 0.12))
        img, pad = shadow(w, h)
        canvas.alpha_composite(img, (round(x - w / 2) - pad, ground - h + 2 - pad))
    canvas.alpha_composite(drawing, (left, ground - height))
    return canvas


def main():
    for (facility, level), place in PLACES.items():
        source = SOURCE / f"{facility}_{level}.png"
        if not source.exists():
            print(f"fehlt: {source.relative_to(ROOT)}")
            continue
        target = TARGET / f"einrichtung_{facility}_{level}.png"
        layer(facility, level, place).save(target, optimize=True)
        print(f"{target.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
