#!/usr/bin/env python3
"""Converts the spreadsheets in data/ into the JSON files the app reads.

    python3 tools/convert_data.py

Reads   data/uebungen.xlsx     -> writes data/uebungen.json
        data/ausruestung.xlsx  -> writes data/ausruestung.json
        data/welt.xlsx         -> writes data/welt.json

The spreadsheets are only read, never changed. Needs nothing but Python 3.
If a row has an error, nothing is written and the old JSON stays in place,
so the app keeps working. Warnings (e.g. a missing picture) do not stop it.
"""

import json
import re
import struct
import sys
from datetime import datetime, timezone
from pathlib import Path

from xlsx_reader import records

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

STATS = ["kraft", "ausdauer", "beweglichkeit", "gelassenheit"]
AREA_NAMES = {
    "kraft": "kraft", "tiefenmuskulatur": "kraft",
    "ausdauer": "ausdauer",
    "beweglichkeit": "beweglichkeit", "stretching": "beweglichkeit", "mobility": "beweglichkeit",
    "gelassenheit": "gelassenheit", "entspannung": "gelassenheit", "konzentration": "gelassenheit",
}
SLOTS = ["accessoire", "beine", "schuhe", "torso", "handschuhe", "kopf"]
# older slot names still read: the Umhang slot became Accessoire
SLOT_ALIASES = {"umhang": "accessoire", "besonderes": "accessoire", "accessoires": "accessoire"}
# where a layer may lie instead of its slot's place (see EBENEN in js/config.js);
# the table may give the key or the name
LAYERS = {
    "hinten": "Hinter der Figur",
    "unter_hose": "Unter der Hose",
    "ueber_schuhen": "Über den Schuhen",
    "ueber_jeder_hose": "Über jeder Hose",
    "unter_oberteil": "Unter dem Oberteil",
    "ueber_oberteil": "Über dem Oberteil",
    "vorn": "Ganz vorn",
}
MEASUREMENTS = ["strecke_km", "stockwerke", "haltezeit_s", "wiederholungen", "dauer_min"]
EFFECTS = ["schaden", "treffer", "ausweichen", "beruhigen", "reise", "erholung", "glueck"]
ORIGINS = ["start", "angezogen", "haendler", "beute", "quest"]
PLACE_TYPES = ["lager", "truemmerfeld", "wild", "sammeln", "ort", "hoehle"]
QUEST_KINDS = ["sammeln", "erkunden", "kampf", "hoehle", "bauen"]
FEATURES = ["lagerfeuer", "haendler"]
# the facilities of the camp, each in levels (sheet Einrichtungen)
FACILITIES = ["steinlager", "pilzlager", "aufbewahrung", "schlafplatz"]
# where the plan of a Deko comes from, besides a place or a quest (sheet Deko)
PLAN_SOURCES = ["start", "geister", "haendler"]
RARITIES = ["selten", "sehr selten", "kostbar"]
CAMP_TIMES = ["morgen", "tag", "abend", "nacht"]
MATERIALS = ["pilzholz", "stein", "splitter"]
# older names still read: Holz and Quarz became Pilzholz; Glimmer and Äther became Bannsplitter
MATERIAL_ALIASES = {"holz": "pilzholz", "quarz": "pilzholz", "glimmer": "splitter", "aether": "splitter",
                    "äther": "splitter", "traumsplitter": "splitter", "bannsplitter": "splitter"}
TOTALS = {"summe_km": "km", "summe_stockwerke": "stockwerke"}
XP_MIN, XP_MAX = 14, 28

PICTURES = {
    "figur": ("assets/figur", (1024, 1536)),
    "icon": ("assets/icons", (256, 256)),
    "monster": ("assets/monster", (512, 512)),
    "lager": ("assets/lager", (1792, 672)),
}


# --- helpers ----------------------------------------------------------------

class Report:
    def __init__(self, name):
        self.name = name
        self.errors = []
        self.warnings = []

    def error(self, row, message):
        self.errors.append(f"{self.name}, Zeile {row}: {message}")

    def warn(self, row, message):
        self.warnings.append(f"{self.name}, Zeile {row}: {message}")


def text(value):
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return str(value).strip()


def number(value):
    """A number from a cell, or None if empty, or 'invalid'."""
    value = text(value)
    if value == "":
        return None
    try:
        return float(value.replace(",", "."))
    except ValueError:
        return "invalid"


def whole_number(value):
    n = number(value)
    if n is None or n == "invalid":
        return n
    return int(n) if n.is_integer() else "invalid"


def slug(value):
    value = text(value).lower()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        value = value.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "", value)


def layer_words():
    return {slug(word): key for key, name in LAYERS.items() for word in (key, name)}


def split_list(value):
    return [p.strip() for p in re.split(r"[,;\n]", text(value)) if p.strip()]


def is_yes(value, default=False):
    v = text(value).lower()
    if v == "":
        return default
    return v in ("ja", "yes", "1", "true", "wahr", "x")


def png_size(path):
    with open(path, "rb") as f:
        head = f.read(24)
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    return struct.unpack(">II", head[16:24])


# Returns the path the app uses, or "" when the picture does not exist yet:
# then the app draws nothing for it and shows the symbol of the slot.
def check_picture(report, row, kind, filename):
    folder, size = PICTURES[kind]
    path = ROOT / folder / filename
    if not path.exists():
        report.warn(row, f"Bild fehlt noch: {folder}/{filename}")
        return ""
    if path.suffix.lower() == ".png":
        actual = png_size(path)
        if actual != size:
            report.warn(row, f"{filename} ist {actual[0]} × {actual[1]}, erwartet {size[0]} × {size[1]}")
    return f"{folder}/{filename}"


def own_versions(report, row, kind, filename):
    """Other figures (sub folders, e.g. assets/figur/zweite) may have their
    own version of a picture; without one they use the first figure's.
    -> {'zweite': 'assets/figur/zweite/<filename>'}"""
    folder, size = PICTURES[kind]
    own = {}
    for sub in sorted(p for p in (ROOT / folder).iterdir() if p.is_dir()):
        path = sub / filename
        if not path.exists():
            continue
        actual = png_size(path) if path.suffix.lower() == ".png" else size
        if actual != size:
            report.warn(row, f"{sub.name}/{filename} ist {actual[0]} × {actual[1]}, erwartet {size[0]} × {size[1]}")
        own[sub.name] = f"{folder}/{sub.name}/{filename}"
    return own


def optional_picture(report, row, kind, filename):
    """A picture that may be there or not (layers of the camp picture):
    its path if the file exists, else None. A wrong size is reported."""
    folder, size = PICTURES[kind]
    path = ROOT / folder / filename
    if not path.exists():
        return None
    actual = png_size(path) if path.suffix.lower() == ".png" else size
    if actual != size:
        report.warn(row, f"{filename} ist {actual[0]} × {actual[1]}, erwartet {size[0]} × {size[1]}")
    return f"{folder}/{filename}"


def camp_pictures(pattern=r"stufe_(\d+)_([a-z]+)\.jpg"):
    """Which pictures of the camp there are, by stage: {'1': ['morgen', 'tag', ...]}."""
    found = {}
    for path in sorted((ROOT / PICTURES["lager"][0]).glob("stufe_*")):
        m = re.fullmatch(pattern, path.name)
        if m and m.group(2) in CAMP_TIMES:
            found.setdefault(m.group(1), []).append(m.group(2))
    return {stage: [t for t in CAMP_TIMES if t in times] for stage, times in found.items()}


def camp_fronts():
    """Which pictures of the camp have a front layer (what of the picture
    stands in front of the facilities, stufe_<n>_<zeit>_vorn.png, made by
    tools/lager_vorn.py), by stage like camp_pictures."""
    return camp_pictures(r"stufe_(\d+)_([a-z]+)_vorn\.png")


# --- small languages used in cells -----------------------------------------
# All of them are comma separated lists like "holz:2-4, glimmer:10".

def parse_pairs(report, row, value, column):
    """'a:1, b:2-4' -> [('a', '1'), ('b', '2-4')]"""
    pairs = []
    for part in split_list(value):
        if ":" not in part:
            report.error(row, f"{column}: '{part}' – erwartet name:wert")
            continue
        key, val = part.split(":", 1)
        key = key.strip().lower()
        pairs.append((MATERIAL_ALIASES.get(key, key), val.strip()))
    return pairs


def parse_range(report, row, value, column):
    m = re.fullmatch(r"(\d+)\s*(?:-\s*(\d+))?", value)
    if not m:
        report.error(row, f"{column}: '{value}' ist keine Zahl oder Spanne wie 2-4")
        return [0, 0]
    low = int(m.group(1))
    high = int(m.group(2)) if m.group(2) else low
    return [min(low, high), max(low, high)]


def parse_effects(report, row, value, allowed):
    effects = {}
    for key, val in parse_pairs(report, row, value, "effekt"):
        if key not in allowed:
            report.error(row, f"effekt: unbekannt '{key}' (möglich: {', '.join(allowed)})")
            continue
        try:
            effects[key] = int(val.replace("+", ""))
        except ValueError:
            report.error(row, f"effekt: '{val}' ist keine ganze Zahl")
    return effects


def parse_conditions(report, row, value):
    conditions = []
    for part in split_list(value):
        m = re.fullmatch(r"([a-z_]+)\s*>=\s*(\d+)", part)
        if m:
            key, amount = MATERIAL_ALIASES.get(m.group(1), m.group(1)), int(m.group(2))
            if key == "lager":
                conditions.append({"type": "camp", "min": amount})
            elif key in STATS:
                conditions.append({"type": "stat", "stat": key, "min": amount})
            elif key in TOTALS:
                conditions.append({"type": "total", "key": TOTALS[key], "min": amount})
            elif key in MATERIALS:
                conditions.append({"type": "material", "key": key, "min": amount})
            else:
                report.error(row, f"bedingung: unbekannt '{key}'")
            continue
        m = re.fullmatch(r"quest:([a-z0-9_-]+)", part)
        if m:
            conditions.append({"type": "quest", "id": m.group(1)})
            continue
        m = re.fullmatch(r"lager\s*>=\s*(\d+)", part)
        if m:
            conditions.append({"type": "camp", "min": int(m.group(1))})
            continue
        report.error(row, f"bedingung: '{part}' nicht verstanden (z. B. kraft>=3, quest:q-spalt, summe_km>=30, lager>=1)")
    return conditions


def parse_stats(report, row, value, column):
    stats = []
    for part in split_list(value):
        key = part.lower()
        if key not in STATS:
            report.error(row, f"{column}: '{part}' ist kein Wert (möglich: {', '.join(STATS)})")
        else:
            stats.append(key)
    return stats


def parse_materials(report, row, value, column):
    cost = {}
    for key, val in parse_pairs(report, row, value, column):
        if key not in MATERIALS:
            report.error(row, f"{column}: unbekannt '{key}'")
            continue
        cost[key] = parse_range(report, row, val, column)[0]
    return cost


def parse_rewards(report, row, value):
    reward = {"splitter": [0, 0], "pilzholz": [0, 0], "stein": [0, 0],
              "items": [], "plans": [], "unlocks": [], "rest": False}
    for key, val in parse_pairs(report, row, value, "belohnung"):
        if key in MATERIALS:
            reward[key] = parse_range(report, row, val, "belohnung")
        elif key == "item":
            reward["items"].append(val)
        elif key in ("plan", "einrichtung"):
            # the plan of a Deko (einrichtung: the older name)
            reward["plans"].append(val)
        elif key == "freischaltung":
            if val not in FEATURES:
                report.error(row, f"belohnung: freischaltung '{val}' unbekannt (möglich: {', '.join(FEATURES)})")
            reward["unlocks"].append(val)
        elif key == "rast":
            reward["rest"] = True
        else:
            report.error(row, f"belohnung: unbekannt '{key}'")
    return reward


def parse_loot(report, row, value):
    loot = {"splitter": [0, 0], "pilzholz": [0, 0], "stein": [0, 0], "itemChance": 0}
    for key, val in parse_pairs(report, row, value, "beute"):
        if key in MATERIALS:
            loot[key] = parse_range(report, row, val, "beute")
        elif key == "item":
            loot["itemChance"] = parse_range(report, row, val, "beute")[0]
        else:
            report.error(row, f"beute: unbekannt '{key}'")
    return loot


def parse_origin(report, row, value):
    origin = [o.lower() for o in split_list(value)]
    for o in origin:
        if o not in ORIGINS:
            report.error(row, f"herkunft: unbekannt '{o}' (möglich: {', '.join(ORIGINS)})")
    return origin


def check_ids(report, row, ids, known, what):
    for i in ids:
        if i not in known:
            report.error(row, f"{what} '{i}' gibt es nicht")


def unique_id(report, row, value, seen):
    item_id = text(value)
    if not item_id:
        report.error(row, "id fehlt")
        return None
    if item_id in seen:
        report.error(row, f"id '{item_id}' kommt doppelt vor")
    seen.add(item_id)
    return item_id


# --- exercises --------------------------------------------------------------

def convert_exercises(path):
    report = Report(path.name)
    exercises = []
    seen = set()
    for row, r in records(path):
        ex_id = unique_id(report, row, r.get("id", ""), seen)
        if ex_id is None:
            continue
        if not re.fullmatch(r"[a-z0-9_-]+", ex_id):
            report.warn(row, f"id '{ex_id}' enthält Zeichen außer a–z, 0–9, - und _")
        if not is_yes(r.get("aktiv", ""), default=True):
            continue

        stat = AREA_NAMES.get(text(r.get("bereich", "")).lower())
        if not stat:
            report.error(row, f"unbekannter Bereich '{text(r.get('bereich', ''))}'")

        level = whole_number(r.get("stufe", ""))
        if not isinstance(level, int) or level < 1:
            report.error(row, "stufe muss eine ganze Zahl ab 1 sein")

        xp = whole_number(r.get("xp", ""))
        if not isinstance(xp, int) or not XP_MIN <= xp <= XP_MAX:
            report.error(row, f"xp muss zwischen {XP_MIN} und {XP_MAX} liegen")

        name = text(r.get("name", ""))
        if not name:
            report.error(row, "name fehlt")

        steps = [s.strip() for s in re.split(r"\r?\n|\|", text(r.get("anleitung", ""))) if s.strip()]

        measurement = text(r.get("messung", "")).lower() or None
        target = number(r.get("ziel", ""))
        if measurement and measurement not in MEASUREMENTS:
            report.error(row, f"unbekannte Messung '{measurement}' (möglich: {', '.join(MEASUREMENTS)})")
        if measurement and (target is None or target == "invalid" or target <= 0):
            report.error(row, "ziel fehlt: bei einer Messung braucht es ein Ziel größer 0")
        if not measurement:
            target = None

        timer_min = number(r.get("timer_min", ""))
        if timer_min == "invalid" or (timer_min is not None and timer_min <= 0):
            report.error(row, "timer_min muss eine Zahl größer 0 sein")
            timer_min = None

        rhythm = text(r.get("atemtakt", ""))
        breath = None
        if rhythm:
            if not re.fullmatch(r"\d+(-\d+){1,3}", rhythm):
                report.error(row, "atemtakt wie 4-6 oder 4-4-4-4 angeben")
            else:
                breath = [int(p) for p in rhythm.split("-")]

        exercises.append({
            "id": ex_id,
            "stat": stat,
            "stufe": level,
            "name": name,
            "xp": xp,
            "steps": steps,
            "muskelgruppe": slug(r.get("muskelgruppe", "")) or None,
            "messung": measurement,
            "ziel": target,
            "timer_min": timer_min,
            "atemtakt": breath,
        })

    for stat in STATS:
        if not any(x["stat"] == stat for x in exercises):
            report.error("-", f"keine aktive Übung im Bereich {stat}")
    return {"exercises": exercises}, report


# --- equipment --------------------------------------------------------------

REQ_COLUMNS = {
    "kraft": ["req_kraft"],
    "ausdauer": ["req_ausdauer"],
    "beweglichkeit": ["req_beweglichkeit"],
    "gelassenheit": ["req_gelassenheit", "req_konzentration"],
}


def convert_equipment(path):
    report = Report(path.name)
    items = []
    seen = set()
    for row, r in records(path):
        item_id = unique_id(report, row, r.get("id", ""), seen)
        if item_id is None:
            continue

        slot = slug(r.get("slot", ""))
        slot = SLOT_ALIASES.get(slot, slot)
        if slot == "waffe":
            report.error(row, "es gibt keinen Waffen-Slot, der Envoy kämpft waffenlos")
        elif slot not in SLOTS:
            report.error(row, f"unbekannter Slot '{text(r.get('slot', ''))}' (möglich: {', '.join(SLOTS)})")

        name = text(r.get("name", ""))
        if not name:
            report.error(row, "name fehlt")

        level = whole_number(r.get("stufe", ""))
        if level is None:
            level = 1
        if not isinstance(level, int) or level < 1:
            report.error(row, "stufe muss eine ganze Zahl ab 1 sein")

        req = {}
        for stat, columns in REQ_COLUMNS.items():
            value = None
            for column in columns:
                if text(r.get(column, "")) != "":
                    value = whole_number(r.get(column))
            if value is None:
                value = 0
            if not isinstance(value, int) or not 0 <= value <= 100:
                report.error(row, f"Voraussetzung {stat} muss zwischen 0 und 100 liegen")
                continue
            if value > 0:
                req[stat] = value

        price = whole_number(r.get("preis", ""))
        if price == "invalid" or (price is not None and price < 0):
            report.error(row, "preis muss eine ganze Zahl sein")
            price = None

        given = text(r.get("ebene", ""))
        layer = layer_words().get(slug(given)) if given else None
        if given and not layer:
            report.error(row, f"ebene: unbekannt '{given}' (möglich: {', '.join(LAYERS.values())}; leer = wie der Slot)")

        figure = text(r.get("datei_figur", "")) or f"{slot}_{slug(name)}_{level}.png"
        icon = text(r.get("datei_icon", "")) or f"icon_{figure}"
        figure_path = check_picture(report, row, "figur", figure)
        icon_path = check_picture(report, row, "icon", icon)

        items.append({
            "id": item_id,
            "slot": slot,
            "name": name,
            "stufe": level,
            "req": req,
            "faehigkeit": text(r.get("faehigkeit", "")) or None,
            "effekt": parse_effects(report, row, r.get("effekt", ""), EFFECTS),
            "herkunft": parse_origin(report, row, r.get("herkunft", "")),
            "preis": price,
            "figur": figure_path,
            "figuren": own_versions(report, row, "figur", figure),
            "icon": icon_path,
            "icons": own_versions(report, row, "icon", icon),
            "ebene": layer,
        })
    return {"equipment": items}, report


# --- world ------------------------------------------------------------------

def convert_world(path, item_ids):
    report = Report(path.name)
    place_seen, monster_seen, quest_seen, deko_seen = set(), set(), set(), set()

    places = []
    for row, r in records(path, "Orte"):
        pid = unique_id(report, row, r.get("id", ""), place_seen)
        if pid is None:
            continue
        x, y = number(r.get("x", "")), number(r.get("y", ""))
        if not all(isinstance(v, float) and 0 <= v <= 100 for v in (x, y)):
            report.error(row, "x und y müssen zwischen 0 und 100 liegen")
        kind = text(r.get("typ", "")).lower()
        if kind not in PLACE_TYPES:
            report.error(row, f"typ '{kind}' unbekannt (möglich: {', '.join(PLACE_TYPES)})")
        places.append({
            "id": pid, "name": text(r.get("name", "")), "region": text(r.get("region", "")),
            "x": x, "y": y, "typ": kind,
            "encounters": is_yes(r.get("begegnungen", "")),
            "monsters": split_list(r.get("monster", "")),
            "unlock": parse_conditions(report, row, r.get("freischaltung", "")),
            "text": text(r.get("beschreibung", "")),
            "_row": row,
        })
    if sum(1 for p in places if p["typ"] == "lager") != 1:
        report.error("-", "es muss genau einen Ort vom typ lager geben")
    if sum(1 for p in places if p["typ"] == "truemmerfeld") > 1:
        report.error("-", "es darf höchstens einen Ort vom typ truemmerfeld geben")

    monsters = []
    for row, r in records(path, "Monster"):
        mid = unique_id(report, row, r.get("id", ""), monster_seen)
        if mid is None:
            continue
        values = {k: whole_number(r.get(k, "")) for k in ("stufe", "leben", "kraft", "gewandtheit")}
        for k, v in values.items():
            if not isinstance(v, int) or v < 0:
                report.error(row, f"{k} muss eine ganze Zahl sein")
        picture = text(r.get("datei_bild", "")) or f"{mid}.png"
        check_picture(report, row, "monster", picture)
        monsters.append({
            "id": mid, "name": text(r.get("name", "")),
            "stufe": values["stufe"], "leben": values["leben"],
            "kraft": values["kraft"], "gewandtheit": values["gewandtheit"],
            "calmable": is_yes(r.get("beruhigbar", "")),
            "loot": parse_loot(report, row, r.get("beute", "")),
            "text": text(r.get("beschreibung", "")),
            "bild": f"{PICTURES['monster'][0]}/{picture}",
        })

    deko = []
    for row, r in records(path, "Deko"):
        did = unique_id(report, row, r.get("id", ""), deko_seen)
        if did is None:
            continue
        values = {}
        for column in ("lagerstufe", "hygge", "pilzholz", "stein", "energie", "preis"):
            value = whole_number(r.get(column, ""))
            if value is None:
                value = 0
            if not isinstance(value, int) or value < 0:
                report.error(row, f"{column} muss eine ganze Zahl sein")
                value = 0
            values[column] = value
        if values["lagerstufe"] < 2:
            report.error(row, "lagerstufe muss mindestens 2 sein (Deko gibt es ab Lagerstufe 2)")
        if values["energie"] < 1:
            report.error(row, "energie muss mindestens 1 sein")
        source = text(r.get("fundort", "")).lower()
        rarity = text(r.get("seltenheit", "")).lower()
        if source != "start" and rarity not in RARITIES:
            report.error(row, f"seltenheit '{rarity}' unbekannt (möglich: {', '.join(RARITIES)})")
        if source == "haendler" and values["preis"] < 1:
            report.error(row, "preis fehlt: was der Plan beim Händler kostet")
        icon = text(r.get("datei_icon", "")) or f"icon_einrichtung_{did}.png"
        deko.append({
            "id": did, "name": text(r.get("name", "")),
            "lagerstufe": values["lagerstufe"], "hygge": values["hygge"],
            "fundort": source, "seltenheit": rarity if source != "start" else "",
            "preis": values["preis"],
            "cost": {"pilzholz": values["pilzholz"], "stein": values["stein"]},
            "energie": values["energie"],
            "text": text(r.get("beschreibung", "")),
            "icon": check_picture(report, row, "icon", icon),
            "bild": optional_picture(report, row, "lager", f"deko_{did}.png"),
            "_row": row,
        })

    stages = []
    stage_rows = records(path, "Lagerstufen")
    for n, (row, r) in enumerate(stage_rows):
        stage = whole_number(r.get("stufe", ""))
        if not isinstance(stage, int) or stage != len(stages) + 1:
            report.error(row, "stufe muss bei 1 beginnen und lückenlos steigen")
        last = n == len(stage_rows) - 1
        need = whole_number(r.get("hygge_bis_naechste", ""))
        upgrade = None
        if last:
            # the highest stage: nothing to raise it to
            need = None
        elif not isinstance(need, int) or need < 0:
            report.error(row, "hygge_bis_naechste muss eine ganze Zahl sein")
            need = 0
        if not last:
            cost = {}
            for column in ("stein", "pilzholz", "energie"):
                value = whole_number(r.get(column, ""))
                if not isinstance(value, int) or value < 0:
                    report.error(row, f"{column} muss eine ganze Zahl sein (Kosten für das Aufwerten)")
                    value = 0
                cost[column] = value
            if cost["energie"] < 1:
                report.error(row, "energie muss mindestens 1 sein")
            upgrade = {"cost": {"pilzholz": cost["pilzholz"], "stein": cost["stein"]}, "energie": cost["energie"]}
        stages.append({
            "stufe": stage, "name": text(r.get("name", "")),
            "hyggeBisNaechste": need, "upgrade": upgrade, "text": text(r.get("beschreibung", "")),
            # the building of the stage, a layer on the camp picture (see js/ui/camp.js)
            "bild": optional_picture(report, row, "lager", f"gebaeude_{stage}.png"),
        })

    facilities = []
    levels = {}
    for row, r in records(path, "Einrichtungen"):
        fid = text(r.get("id", "")).lower()
        if fid not in FACILITIES:
            report.error(row, f"id '{fid}' unbekannt (möglich: {', '.join(FACILITIES)})")
            continue
        level = whole_number(r.get("stufe", ""))
        levels[fid] = levels.get(fid, 0) + 1
        if not isinstance(level, int) or level != levels[fid]:
            report.error(row, f"stufe muss bei 1 beginnen und lückenlos steigen ({fid})")
        row_values = {}
        for column in ("lagerstufe", "pilzholz", "stein", "energie", "hygge"):
            value = whole_number(r.get(column, ""))
            if value is None:
                value = 0
            if not isinstance(value, int) or value < 0:
                report.error(row, f"{column} muss eine ganze Zahl sein")
                value = 0
            row_values[column] = value
        if row_values["lagerstufe"] < 1:
            report.error(row, "lagerstufe muss mindestens 1 sein")
        if row_values["energie"] < 1:
            report.error(row, "energie muss mindestens 1 sein")
        capacity = whole_number(r.get("kapazitaet", ""))
        bonus = whole_number(r.get("bonus", ""))
        if fid != "schlafplatz" and (not isinstance(capacity, int) or capacity <= 0):
            report.error(row, "kapazitaet muss eine ganze Zahl größer 0 sein")
        if fid == "schlafplatz" and (not isinstance(bonus, int) or bonus <= 0):
            report.error(row, "bonus muss eine ganze Zahl größer 0 sein (Prozent der Energieleiste)")
        facilities.append({
            "id": fid, "stufe": level, "name": text(r.get("name", "")),
            "lagerstufe": row_values["lagerstufe"],
            "cost": {"pilzholz": row_values["pilzholz"], "stein": row_values["stein"]},
            "energie": row_values["energie"], "hygge": row_values["hygge"],
            "kapazitaet": capacity if isinstance(capacity, int) else 0,
            "bonus": bonus if isinstance(bonus, int) else 0,
            "text": text(r.get("beschreibung", "")),
            "bild": optional_picture(report, row, "lager", f"einrichtung_{fid}_{level}.png"),
        })
    for fid in FACILITIES:
        if fid not in levels:
            report.error("-", f"Blatt Einrichtungen: {fid} fehlt")

    quests = []
    quest_rows = records(path, "Quests")
    all_quest_ids = {text(r.get("id", "")) for _, r in quest_rows}
    for row, r in quest_rows:
        qid = unique_id(report, row, r.get("id", ""), quest_seen)
        if qid is None:
            continue
        # kosten: stamina for the work on site. It is also its minutes, so an
        # old column "dauer" is no longer read.
        cost = whole_number(r.get("kosten", ""))
        cooldown = whole_number(r.get("abklingzeit", "")) or 0
        kind = text(r.get("art", "")).lower()
        if kind not in QUEST_KINDS:
            report.error(row, f"art '{kind}' unbekannt (möglich: {', '.join(QUEST_KINDS)})")
        if not isinstance(cost, int) or cost <= 0:
            report.error(row, "kosten muss eine ganze Zahl größer 0 sein (Ausdauer vor Ort, zugleich Minuten)")
            cost = 5
        quest = {
            "id": qid, "name": text(r.get("name", "")), "place": text(r.get("ort", "")),
            "kind": kind,
            "text": text(r.get("text", "")),
            "monsters": split_list(r.get("monster", "")),
            "conditions": parse_conditions(report, row, r.get("voraussetzung", "") or r.get("bedingung", "")),
            "speedStats": parse_stats(report, row, r.get("tempo", ""), "tempo"),
            "yieldStats": parse_stats(report, row, r.get("ertrag", ""), "ertrag"),
            "consumes": parse_materials(report, row, r.get("verbrauch", ""), "verbrauch"),
            "cost": cost,
            "reward": parse_rewards(report, row, r.get("belohnung", "")),
            "repeatable": is_yes(r.get("wiederholbar", "")),
            "cooldown": cooldown if isinstance(cooldown, int) else 0,
            # aktiv = nein: stays in the table but is not offered in the game for now
            "active": is_yes(r.get("aktiv", ""), default=True),
        }
        if kind == "kampf" and len(quest["monsters"]) != 1:
            report.error(row, "art kampf braucht genau einen Geist in der Spalte monster")
        if kind == "hoehle" and len(quest["monsters"]) < 2:
            report.error(row, "art hoehle braucht mindestens zwei Geister in der Spalte monster")
        if kind == "bauen" and not quest["consumes"]:
            report.error(row, "art bauen braucht Material in der Spalte verbrauch")
        check_ids(report, row, [quest["place"]], place_seen, "Ort")
        check_ids(report, row, quest["monsters"], monster_seen, "Monster")
        check_ids(report, row, quest["reward"]["items"], item_ids, "Ausrüstung")
        check_ids(report, row, quest["reward"]["plans"], deko_seen, "Deko")
        check_ids(report, row, [c["id"] for c in quest["conditions"] if c["type"] == "quest"], all_quest_ids, "Quest")
        quests.append(quest)

    # where the plans are found: a place, a quest that can be done again, or start, geister, haendler
    repeatable = {q["id"] for q in quests if q["repeatable"]}
    for d in deko:
        source = d["fundort"]
        if source in PLAN_SOURCES or source in place_seen:
            pass
        elif source in quest_seen:
            if source not in repeatable:
                report.error(d["_row"], f"fundort: die Quest '{source}' ist nicht wiederholbar, dort ließe sich nicht weitersuchen")
        else:
            report.error(d["_row"], f"fundort '{source}' unbekannt (möglich: {', '.join(PLAN_SOURCES)}, eine Orts-id oder eine Quest-id)")
        del d["_row"]

    for p in places:
        check_ids(report, p["_row"], p["monsters"], monster_seen, "Monster")
        check_ids(report, p["_row"], [c["id"] for c in p["unlock"] if c["type"] == "quest"], quest_seen, "Quest")
        del p["_row"]

    return {"places": places, "monsters": monsters, "quests": quests,
            "camp": {"stages": stages, "facilities": facilities, "pictures": camp_pictures(), "fronts": camp_fronts()}, "deko": deko}, report


# --- main -------------------------------------------------------------------

def unchanged(target, source_name, data):
    """True if the existing JSON already holds exactly this data."""
    try:
        old = json.loads(target.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return False
    old.pop("generated", None)
    return old == {"source": source_name, **data}


def main():
    sources = {
        "uebungen": DATA / "uebungen.xlsx",
        "ausruestung": DATA / "ausruestung.xlsx",
        "welt": DATA / "welt.xlsx",
    }
    missing = [p for p in sources.values() if not p.exists()]
    for p in missing:
        print(f"Fehlt: {p.relative_to(ROOT)}")
    if missing:
        return 1

    results = []
    reports = []
    data, report = convert_exercises(sources["uebungen"])
    results.append(("uebungen", data)); reports.append(report)
    data, report = convert_equipment(sources["ausruestung"])
    results.append(("ausruestung", data)); reports.append(report)
    item_ids = {i["id"] for i in data["equipment"]}
    data, report = convert_world(sources["welt"], item_ids)
    results.append(("welt", data)); reports.append(report)

    failed = False
    for report in reports:
        for w in report.warnings:
            print("Hinweis:", w)
        for e in report.errors:
            print("Fehler: ", e)
        failed = failed or bool(report.errors)
    if failed:
        print("Nichts geschrieben. Die bisherigen JSON-Dateien bleiben unverändert.")
        return 1

    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for name, data in results:
        source = sources[name]
        target = DATA / f"{name}.json"
        count = sum(len(v) for v in data.values())
        if unchanged(target, source.name, data):
            print(f"{target.relative_to(ROOT)}: {count} Einträge, unverändert")
            continue
        output = {"generated": stamp, "source": source.name, **data}
        target.write_text(json.dumps(output, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"{target.relative_to(ROOT)}: {count} Einträge")
    return 0


if __name__ == "__main__":
    sys.exit(main())
