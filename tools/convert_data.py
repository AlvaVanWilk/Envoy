#!/usr/bin/env python3
"""Converts the two spreadsheets in data/ into the JSON files the app reads.

    python3 tools/convert_data.py

Reads   data/uebungen.xlsx     -> writes data/uebungen.json
        data/ausruestung.xlsx  -> writes data/ausruestung.json

The spreadsheets are only read, never changed. Needs nothing but Python 3.
If a row has an error, nothing is written and the old JSON stays in place,
so the app keeps working. Warnings (e.g. a missing picture) do not stop it.
"""

import json
import re
import struct
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
FIGURE_DIR = "assets/figur"
ICON_DIR = "assets/icons"

STATS = ["kraft", "ausdauer", "beweglichkeit", "gelassenheit"]
AREA_NAMES = {
    "kraft": "kraft", "tiefenmuskulatur": "kraft",
    "ausdauer": "ausdauer",
    "beweglichkeit": "beweglichkeit", "stretching": "beweglichkeit", "mobility": "beweglichkeit",
    "gelassenheit": "gelassenheit", "entspannung": "gelassenheit", "konzentration": "gelassenheit",
}
SLOTS = ["umhang", "beine", "schuhe", "torso", "guertel", "handschuhe", "schultern", "kopf"]
MEASUREMENTS = ["dauer_min", "strecke_km", "tempo_kmh", "stockwerke", "haltezeit_s", "wiederholungen"]
XP_MIN, XP_MAX = 14, 28
FIGURE_SIZE = (1024, 1536)
ICON_SIZE = (256, 256)

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"


# --- reading xlsx without extra libraries ---------------------------------

def _text(node):
    return "".join(t.text or "" for t in node.iter(f"{{{NS['m']}}}t"))


def _column_index(ref):
    letters = re.match(r"[A-Z]+", ref).group(0)
    index = 0
    for ch in letters:
        index = index * 26 + (ord(ch) - 64)
    return index - 1


def read_first_table(path):
    """Returns the rows of the first sheet as lists of strings/numbers."""
    with zipfile.ZipFile(path) as z:
        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ElementTree.fromstring(z.read("xl/sharedStrings.xml"))
            shared = [_text(si) for si in root.findall("m:si", NS)]

        workbook = ElementTree.fromstring(z.read("xl/workbook.xml"))
        first_sheet = workbook.find("m:sheets/m:sheet", NS)
        rels = ElementTree.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        target = None
        for rel in rels:
            if rel.get("Id") == first_sheet.get(REL_NS):
                target = rel.get("Target")
        target = target.lstrip("/")
        if not target.startswith("xl/"):
            target = "xl/" + target
        sheet = ElementTree.fromstring(z.read(target))

    rows = []
    for row in sheet.iter(f"{{{NS['m']}}}row"):
        values = {}
        for c in row.findall("m:c", NS):
            kind = c.get("t")
            v = c.find("m:v", NS)
            if kind == "s" and v is not None:
                value = shared[int(v.text)]
            elif kind == "inlineStr":
                value = _text(c)
            elif kind in ("str", "b", "e") and v is not None:
                value = v.text or ""
            elif v is not None:
                number = float(v.text)
                value = int(number) if number.is_integer() else number
            else:
                continue
            values[_column_index(c.get("r"))] = value
        if values:
            rows.append([values.get(i, "") for i in range(max(values) + 1)])
    return rows


def records(path):
    """Rows as dictionaries, keyed by the header row (the first row with 'id')."""
    rows = read_first_table(path)
    for start, row in enumerate(rows):
        header = [str(h).strip().lower() for h in row]
        if "id" in header:
            break
    else:
        raise SystemExit(f"{path.name}: keine Kopfzeile mit der Spalte 'id' gefunden.")
    result = []
    for number, row in enumerate(rows[start + 1:], start=start + 2):
        record = {header[i]: row[i] for i in range(min(len(header), len(row))) if header[i]}
        if any(str(v).strip() for v in record.values()):
            result.append((number, record))
    return result


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


def whole_number(value):
    value = text(value)
    if value == "":
        return None
    try:
        number = float(value.replace(",", "."))
    except ValueError:
        return "invalid"
    return int(number) if number.is_integer() else "invalid"


def slug(value):
    value = text(value).lower()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        value = value.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "", value)


def png_size(path):
    with open(path, "rb") as f:
        head = f.read(24)
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    return struct.unpack(">II", head[16:24])


def check_picture(report, row, folder, filename, size):
    path = ROOT / folder / filename
    if not path.exists():
        report.warn(row, f"Bild fehlt: {folder}/{filename}")
        return
    if path.suffix.lower() == ".png":
        actual = png_size(path)
        if actual != size:
            report.warn(row, f"{filename} ist {actual[0]} × {actual[1]}, erwartet {size[0]} × {size[1]}")


# --- exercises --------------------------------------------------------------

def convert_exercises(path):
    report = Report(path.name)
    exercises = []
    seen = set()
    for row, r in records(path):
        ex_id = text(r.get("id", ""))
        if not ex_id:
            report.error(row, "id fehlt")
            continue
        if ex_id in seen:
            report.error(row, f"id '{ex_id}' kommt doppelt vor")
        seen.add(ex_id)
        if not re.fullmatch(r"[a-z0-9_-]+", ex_id):
            report.warn(row, f"id '{ex_id}' enthält Zeichen außer a–z, 0–9, - und _")

        if text(r.get("aktiv", "")).lower() in ("nein", "no", "0", "false", "falsch"):
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

        measurements = [m.strip() for m in text(r.get("messung", "")).split(",") if m.strip()]
        for m in measurements:
            if m not in MEASUREMENTS:
                report.error(row, f"unbekannte Messung '{m}' (möglich: {', '.join(MEASUREMENTS)})")

        timer = text(r.get("timer_min", ""))
        timer_min = None
        if timer:
            try:
                timer_min = float(timer.replace(",", "."))
                if timer_min <= 0:
                    raise ValueError
            except ValueError:
                report.error(row, "timer_min muss eine Zahl größer 0 sein")

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
            "messung": measurements,
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
        item_id = text(r.get("id", ""))
        if not item_id:
            report.error(row, "id fehlt")
            continue
        if item_id in seen:
            report.error(row, f"id '{item_id}' kommt doppelt vor")
        seen.add(item_id)

        slot = slug(r.get("slot", ""))
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

        figure = text(r.get("datei_figur", "")) or f"{slot}_{slug(name)}_{level}.png"
        icon = text(r.get("datei_icon", "")) or f"icon_{figure}"
        check_picture(report, row, FIGURE_DIR, figure, FIGURE_SIZE)
        check_picture(report, row, ICON_DIR, icon, ICON_SIZE)

        items.append({
            "id": item_id,
            "slot": slot,
            "name": name,
            "stufe": level,
            "req": req,
            "faehigkeit": text(r.get("faehigkeit", "")) or None,
            "figur": f"{FIGURE_DIR}/{figure}",
            "icon": f"{ICON_DIR}/{icon}",
        })
    return {"equipment": items}, report


# --- main -------------------------------------------------------------------

def main():
    jobs = [
        (DATA / "uebungen.xlsx", DATA / "uebungen.json", convert_exercises),
        (DATA / "ausruestung.xlsx", DATA / "ausruestung.json", convert_equipment),
    ]
    results = []
    failed = False
    for source, target, convert in jobs:
        if not source.exists():
            print(f"Fehlt: {source.relative_to(ROOT)}")
            failed = True
            continue
        data, report = convert(source)
        for w in report.warnings:
            print("Hinweis:", w)
        for e in report.errors:
            print("Fehler: ", e)
        failed = failed or bool(report.errors)
        results.append((source, target, data))

    if failed:
        print("Nichts geschrieben. Die bisherigen JSON-Dateien bleiben unverändert.")
        return 1

    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for source, target, data in results:
        count = len(next(iter(data.values())))
        if unchanged(target, source.name, data):
            print(f"{target.relative_to(ROOT)}: {count} Einträge, unverändert")
            continue
        output = {"generated": stamp, "source": source.name, **data}
        target.write_text(json.dumps(output, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"{target.relative_to(ROOT)}: {count} Einträge")
    return 0


def unchanged(target, source_name, data):
    """True if the existing JSON already holds exactly this data."""
    try:
        old = json.loads(target.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return False
    old.pop("generated", None)
    return old == {"source": source_name, **data}


if __name__ == "__main__":
    sys.exit(main())
