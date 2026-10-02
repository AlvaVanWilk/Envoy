#!/usr/bin/env python3
"""Makes the front layer of each camp picture: what of the picture stands in
front of the facilities and the Deko (the pillars, rocks, the fire).

The pieces lie in tools/lager-vorn/stufe_<n>/, drawn on the day picture of
that stage: each a transparent picture of 1792 × 672 with the piece exactly
in its place. PIECES names them, back to front.

By day the pieces are laid together as they are:
    assets/lager/stufe_<n>_tag_vorn.png
For the other times of day the same outlines are cut out of that time's
picture (stufe_<n>_<zeit>.jpg), so that they have its light:
    assets/lager/stufe_<n>_<zeit>_vorn.png
Pieces in ONLY_DAY are left out there (the sparks fly differently in each
picture). The app lays the front layer over everything that is built (see
js/ui/camp.js); the conversion of the tables finds it on its own.

    python3 tools/lager_vorn.py

Needs Pillow (pip install pillow).
"""

from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "tools" / "lager-vorn"
TARGET = ROOT / "assets" / "lager"
SIZE = (1792, 672)
TIMES = ["morgen", "abend", "nacht"]

# stage: its pieces, back to front
PIECES = {
    1: ["feuer", "funken", "fels", "saeule_links", "saeule_rechts"],
}

ONLY_DAY = {"funken"}


def piece(stage, name):
    img = Image.open(SOURCE / f"stufe_{stage}" / f"{name}.png").convert("RGBA")
    if img.size != SIZE:
        raise SystemExit(f"{name}.png ist {img.size[0]} × {img.size[1]}, erwartet {SIZE[0]} × {SIZE[1]}")
    return img


def main():
    for stage, names in PIECES.items():
        pieces = {name: piece(stage, name) for name in names}

        day = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        for name in names:
            day.alpha_composite(pieces[name])
        target = TARGET / f"stufe_{stage}_tag_vorn.png"
        day.save(target, optimize=True)
        print(target.relative_to(ROOT))

        outline = Image.new("L", SIZE, 0)
        for name in names:
            if name not in ONLY_DAY:
                outline = ImageChops.lighter(outline, pieces[name].getchannel("A"))
        for time in TIMES:
            picture = TARGET / f"stufe_{stage}_{time}.jpg"
            if not picture.exists():
                continue
            front = Image.open(picture).convert("RGBA")
            if front.size != SIZE:
                raise SystemExit(f"{picture.name} ist {front.size[0]} × {front.size[1]}, erwartet {SIZE[0]} × {SIZE[1]}")
            # nothing of the picture where the outline is empty (keeps the file small)
            front = Image.composite(front, Image.new("RGBA", SIZE, (0, 0, 0, 0)), outline)
            front.putalpha(outline)
            target = TARGET / f"stufe_{stage}_{time}_vorn.png"
            front.save(target, optimize=True)
            print(target.relative_to(ROOT))


if __name__ == "__main__":
    main()
