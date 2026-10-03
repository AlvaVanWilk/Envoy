#!/usr/bin/env python3
"""The layers of the camp picture, back to front, and the cut-outs among them.

ORDER is the stack the app draws on the picture of the camp, from the back
to the front, as the user arranged her layers (all 1792 × 672, transparent,
each drawn in its place on the day picture):

    gebaeude_<stufe>[_<teil>]     the building of a camp stage (some in parts:
                                  gebaeude_3_hinten behind the beds,
                                  gebaeude_3_vorn and gebaeude_5_stiel in front)
    einrichtung_<id>_<stufe>      a facility at its level
    deko                          where the built Deko lies
    ausschnitt:<name>             a piece cut out of the camp picture itself
                                  (a rock, the fire, a pillar), so that it
                                  stands in front of what lies behind it

An entry can come with conditions, as (entry, {...}):
    "bis_lager": n                only up to camp stage n
    "nicht_mit": ["einrichtung_<id>_<stufe>", ...]
                                  not while that drawing is shown

The app shows of each kind what is built: the building of the camp stage,
each facility at its level (else the level below with a drawing), the
cut-outs whose conditions hold. The tables do not name these pictures; the
conversion (tools/convert_data.py) reads ORDER and finds the files.

The cut-outs come from the user's pieces in tools/lager-ausschnitte/<name>.png.
Running this script lays each run of cut-outs that follow each other in ORDER
with the same conditions together, by day as they are:
    assets/lager/ausschnitt_<first name>_tag.png
and for the other times of day the same outlines cut out of that time's
picture (stufe_1_<zeit>.jpg), so that they have its light:
    assets/lager/ausschnitt_<first name>_<zeit>.png
Pieces in ONLY_DAY are left out there (the sparks fly differently in each
picture).

    python3 tools/lager_ebenen.py

Needs Pillow (pip install pillow).
"""

from pathlib import Path

# Pillow is loaded only for making the cut-outs: the conversion of the tables
# reads ORDER from here and runs without it.

ROOT = Path(__file__).resolve().parent.parent
PIECES = ROOT / "tools" / "lager-ausschnitte"
TARGET = ROOT / "assets" / "lager"
SIZE = (1792, 672)
TIMES = ["morgen", "abend", "nacht"]
PICTURE_STAGE = 1      # the camp picture the cut-outs belong to

# Back to front. The numbers are those of the user's export IMG_1290-<n>.png.
ORDER = [
    "gebaeude_5",                    # 1  Steinhäuschen
    "gebaeude_4",                    # 2  Stabile Hütte
    "gebaeude_3_hinten",             # 3  Wackelige Hütte, back part (behind the beds)
    "gebaeude_2",                    # 4  Unterstand
    "einrichtung_schlafplatz_5",     # 5  Himmelbett
    "einrichtung_schlafplatz_4",     # 6  Bett
    "einrichtung_schlafplatz_3",     # 7  Schlafpodest
    "einrichtung_schlafplatz_2",     # 8  Pilzmatte
    "einrichtung_schlafplatz_1",     # 9  Raspelnest
    "gebaeude_5_stiel",              # 10 the stem inside the Steinhäuschen
    "gebaeude_3_vorn",               # 11 Wackelige Hütte, front part
    "einrichtung_pilzlager_3",       # 12 Pilzholzschuppen
    "einrichtung_pilzlager_2",       # 13 Pilzholzgestell
    "einrichtung_pilzlager_1",       # 14 Pilzholzstapel
    # 15 the big rock behind the fire: in front of the beds up to the Wackelige
    # Hütte; from the Stabile Hütte on the house stands in front of it
    ("ausschnitt:fels_mitte", {"bis_lager": 3}),
    "einrichtung_aufbewahrung_4",    # 16 Kleiderschrank
    "einrichtung_aufbewahrung_3",    # 17 Truhe
    "einrichtung_aufbewahrung_2",    # 18 Kiste
    "einrichtung_aufbewahrung_1",    # 19 Krempelplatz
    "ausschnitt:feuer",              # 20
    "ausschnitt:funken",             # 21
    "einrichtung_steinlager_3",      # 22 Steinschuppen
    "einrichtung_steinlager_2",      # 23 Steinpferch
    "einrichtung_steinlager_1",      # 24 Steinstapel
    "deko",
    # 25 the rock right of the fire: in front of the Truhe, behind the
    # Krempelplatz, and from the Stabile Hütte on behind the house
    ("ausschnitt:fels_rechts", {"bis_lager": 3, "nicht_mit": ["einrichtung_aufbewahrung_1"]}),
    "ausschnitt:saeule_links",       # 26
    "ausschnitt:saeule_rechts",      # 27
    "ausschnitt:fels_vorn",          # 28 the rock at the bottom
]

ONLY_DAY = {"funken"}


def stack():
    """ORDER as [(entry, conditions), ...]."""
    return [(e, {}) if isinstance(e, str) else e for e in ORDER]


def cutout_runs():
    """The runs of cut-outs that follow each other in ORDER with the same
    conditions: [([name, ...], conditions), ...]."""
    runs, run, run_cond = [], [], None
    for entry, cond in stack():
        if entry.startswith("ausschnitt:") and (not run or cond == run_cond):
            run.append(entry.split(":", 1)[1])
            run_cond = cond
            continue
        if run:
            runs.append((run, run_cond))
            run, run_cond = [], None
        if entry.startswith("ausschnitt:"):
            run, run_cond = [entry.split(":", 1)[1]], cond
    if run:
        runs.append((run, run_cond))
    return runs


def piece(name):
    from PIL import Image
    img = Image.open(PIECES / f"{name}.png").convert("RGBA")
    if img.size != SIZE:
        raise SystemExit(f"{name}.png ist {img.size[0]} × {img.size[1]}, erwartet {SIZE[0]} × {SIZE[1]}")
    return img


def main():
    from PIL import Image, ImageChops
    for names, _ in cutout_runs():
        pieces = {name: piece(name) for name in names}
        first = names[0]

        day = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        for name in names:
            day.alpha_composite(pieces[name])
        target = TARGET / f"ausschnitt_{first}_tag.png"
        day.save(target, optimize=True)
        print(target.relative_to(ROOT))

        outline = Image.new("L", SIZE, 0)
        for name in names:
            if name not in ONLY_DAY:
                outline = ImageChops.lighter(outline, pieces[name].getchannel("A"))
        if outline.getbbox() is None:
            continue
        for time in TIMES:
            picture = TARGET / f"stufe_{PICTURE_STAGE}_{time}.jpg"
            if not picture.exists():
                continue
            front = Image.open(picture).convert("RGBA")
            if front.size != SIZE:
                raise SystemExit(f"{picture.name} ist {front.size[0]} × {front.size[1]}, erwartet {SIZE[0]} × {SIZE[1]}")
            # nothing of the picture where the outline is empty (keeps the file
            # small); where it is soft, the colours stay whole
            inside = outline.point(lambda v: 255 if v > 0 else 0)
            front = Image.composite(front, Image.new("RGBA", SIZE, (0, 0, 0, 0)), inside)
            front.putalpha(outline)
            target = TARGET / f"ausschnitt_{first}_{time}.png"
            front.save(target, optimize=True)
            print(target.relative_to(ROOT))


if __name__ == "__main__":
    main()
