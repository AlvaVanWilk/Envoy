"""Reads tables from .xlsx files without any extra library.

An .xlsx file is a zip archive of XML files. This module only reads cell
values; formatting, formulas and pictures are ignored.
"""

import re
import zipfile
from xml.etree import ElementTree

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_ID = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"


def _text(node):
    return "".join(t.text or "" for t in node.iter(f"{{{NS['m']}}}t"))


def _column_index(ref):
    letters = re.match(r"[A-Z]+", ref).group(0)
    index = 0
    for ch in letters:
        index = index * 26 + (ord(ch) - 64)
    return index - 1


def sheet_names(path):
    with zipfile.ZipFile(path) as z:
        workbook = ElementTree.fromstring(z.read("xl/workbook.xml"))
    return [s.get("name") for s in workbook.findall("m:sheets/m:sheet", NS)]


def read_rows(path, sheet_name=None):
    """Rows of one sheet (the first one if no name is given) as lists."""
    with zipfile.ZipFile(path) as z:
        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ElementTree.fromstring(z.read("xl/sharedStrings.xml"))
            shared = [_text(si) for si in root.findall("m:si", NS)]

        workbook = ElementTree.fromstring(z.read("xl/workbook.xml"))
        sheets = workbook.findall("m:sheets/m:sheet", NS)
        if sheet_name is None:
            sheet = sheets[0]
        else:
            matches = [s for s in sheets if s.get("name", "").strip().lower() == sheet_name.lower()]
            if not matches:
                raise KeyError(sheet_name)
            sheet = matches[0]

        rels = ElementTree.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        target = next(rel.get("Target") for rel in rels if rel.get("Id") == sheet.get(REL_ID))
        target = target.lstrip("/")
        if not target.startswith("xl/"):
            target = "xl/" + target
        xml = ElementTree.fromstring(z.read(target))

    rows = []
    for row in xml.iter(f"{{{NS['m']}}}row"):
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


def records(path, sheet_name=None):
    """Rows as (row number, dict) pairs, keyed by the header row.

    The header row is the first row that contains a column called 'id'
    (or 'stufe' for sheets without ids). Empty rows are skipped.
    """
    rows = read_rows(path, sheet_name)
    for start, row in enumerate(rows):
        header = [str(h).strip().lower() for h in row]
        if "id" in header or "stufe" in header:
            break
    else:
        raise ValueError(f"{path.name}: keine Kopfzeile gefunden.")
    result = []
    for number, row in enumerate(rows[start + 1:], start=start + 2):
        record = {header[i]: row[i] for i in range(min(len(header), len(row))) if header[i]}
        if any(str(v).strip() for v in record.values()):
            result.append((number, record))
    return result
