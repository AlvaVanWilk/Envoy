# Envoy

Webapp, die eine gesunde Alltagsroutine als Rollenspiel belohnt. Jeden Tag teilt die
App vier reale Übungen zu, eine je Bereich. Nur davon steigen die Werte des Envoy. Mit
diesen Werten zieht er durch eine Welt aus Orten, Quests und Geistern.

Regeln und Formeln: [`docs/spezifikation.md`](docs/spezifikation.md).
Arbeitsanweisung für die Weiterentwicklung: [`CLAUDE.md`](CLAUDE.md).

## Automatisch auf IONOS hochladen (einmal einrichten)

Nach der Einrichtung landet jede Änderung am Zweig `main` von selbst auf dem Webspace.

**1. SFTP-Zugang bei IONOS anlegen**

IONOS-Konto → Hosting → dein Webspace → **SFTP & SSH** → Zugang anlegen. Notieren:
Server (z. B. `access-5012345678.webspace-host.com`), Benutzername, Passwort.
Im IONOS-Explorer den Ordner anlegen, in dem Envoy liegen soll, z. B. `envoy`.

**2. Die Daten bei GitHub hinterlegen**

Repository auf github.com → **Settings → Secrets and variables → Actions → New
repository secret**. Vier Einträge:

| Name | Wert |
| --- | --- |
| `IONOS_SFTP_HOST` | der Server aus Schritt 1 |
| `IONOS_SFTP_USER` | der Benutzername |
| `IONOS_SFTP_PASSWORD` | das Passwort |
| `IONOS_SFTP_PATH` | der Ordner, z. B. `/envoy` |

GitHub zeigt die Werte danach nie wieder an, auch nicht in Protokollen.

**3. Fertig**

Unter **Actions** siehst du jeden Lauf. Ein grüner Haken heißt: getestet, umgewandelt,
hochgeladen. Tabellen, Werkzeuge, Tests und Doku werden nicht hochgeladen. Der Ordner
`sync-daten/` auf dem Server wird nie angefasst.

Ohne diese Einrichtung geht es weiter wie bisher von Hand: alle Dateien außer `tools/`,
`tests/`, `docs/` und den `.xlsx`-Tabellen mit dem IONOS-Explorer hochladen. Die
`.htaccess` muss mit, sie sperrt alles, was nicht öffentlich sein soll.

## Auf das iPad

Adresse in Safari öffnen, Teilen-Symbol → **Zum Home-Bildschirm**. Die App startet dann
im Vollbild und läuft auch ohne Verbindung; Einträge werden nachgeholt.

## Geräte verbinden

1. Auf dem ersten Gerät: Zahnrad oben rechts → **Neuen Schlüssel erzeugen**.
2. Schlüssel kopieren und auf dem zweiten Gerät eingeben, **Verbinden**.

Der Server nimmt höchstens drei verschiedene Schlüssel an (oben in `sync.php`).

## Übungen, Ausrüstung und Welt pflegen

Die Quellen sind drei Tabellen in `data/`, jede mit einem Blatt **Erklärung**:

- `uebungen.xlsx` — Übungskatalog mit Stufen, XP, Messwert und Ziel
- `ausruestung.xlsx` — Ausrüstung mit Voraussetzungen, Fähigkeiten, Herkunft, Preis
- `welt.xlsx` — Orte der Karte, Monster, Quests, Zuhause-Stufen, Einrichtung

Nach einer Änderung die Tabelle auf github.com hochladen (im Ordner `data` → **Add
file → Upload files**). Der Ablauf wandelt sie um. Findet er einen Fehler, bleibt der
Haken rot und das Protokoll nennt Tabelle und Zeile; die App arbeitet dann mit dem
alten Stand weiter.

Auf dem Mac geht es auch direkt: im Projektordner `python3 tools/convert_data.py`.

## Bilder

| Was | Ort | Größe |
| --- | --- | --- |
| Basisfigur | `assets/figur/basisfigur.png` | 1024 × 1536, transparent |
| Ausrüstung auf der Figur | `assets/figur/slot_name_stufe.png` | 1024 × 1536, transparent, nie zuschneiden |
| Icons | `assets/icons/icon_slot_name_stufe.png` | 256 × 256, transparent |
| Einrichtung | `assets/icons/icon_einrichtung_<id>.png` | 256 × 256, transparent |
| Monster | `assets/monster/<id>.png` | 512 × 512, transparent |
| Zuhause | `assets/zuhause/stufe_<n>.png` | 1200 × 800, transparent |
| Karte | `assets/welt/karte.jpg` | Seitenverhältnis 3:2, z. B. 2400 × 1600 |
| App-Symbol | `assets/app/` | 180, 192, 512 |

Alle mitgelieferten Bilder sind Platzhalter. Neue Bilder mit gleichem Namen ersetzen
sie einfach. Die Umwandlung meldet fehlende Bilder und falsche Maße. Bei einer neuen
Karte die Positionen der Orte (x, y in Prozent) in `welt.xlsx` anpassen.

## Aufbau

| Ort | Inhalt |
| --- | --- |
| `index.html`, `css/`, `js/` | die App, ohne Framework und ohne Build-Schritt |
| `js/config.js` | alle Zahlen der Regeln an einer Stelle |
| `js/formulas.js` | Levelkurve, Malus, Bodensatz |
| `js/replay.js` | berechnet den Spielstand aus allen Einträgen |
| `js/planner.js` | wählt die Übungen des Tages |
| `js/world/` | Karte, Expeditionen, Ausdauerleiste, Kampf, Quests, Händler, Inventar, Zuhause |
| `js/ui/` | die Ansichten |
| `sync.php` | Geräteabgleich |
| `data/` | Tabellen (Quelle) und JSON (für die App) |
| `tools/` | Umwandlung der Tabellen |
| `tests/` | Prüfungen der Spielregeln, `npm test` mit Node.js |
