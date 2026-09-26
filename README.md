# Envoy

Webapp, die eine gesunde Alltagsroutine als Rollenspiel belohnt. Jeden Tag teilt die
App vier reale Übungen zu, eine je Bereich. Nur davon steigen die Werte des Envoy.

Regeln und Formeln: [`docs/spezifikation.md`](docs/spezifikation.md).
Arbeitsanweisung für die Weiterentwicklung: [`CLAUDE.md`](CLAUDE.md).

## Auf den Webspace bringen

1. Den ganzen Ordner per FTP/SFTP in ein Verzeichnis auf dem IONOS-Webspace laden,
   z. B. `envoy/`. Die `.htaccess` sperrt Tabellen, Werkzeuge, Tests und Doku gegen
   Aufruf von außen.
2. PHP muss aktiv sein (bei IONOS Standard). `sync.php` legt beim ersten Abgleich
   den Ordner `sync-daten/` an. Dafür braucht das Verzeichnis Schreibrechte.
3. Adresse in Safari öffnen, Teilen-Symbol → **Zum Home-Bildschirm**.

Die App läuft danach auch ohne Verbindung. Einträge werden nachgeholt, sobald das
Gerät wieder online ist.

## Geräte verbinden

1. Auf dem ersten Gerät: **Einstellungen → Neuen Schlüssel erzeugen**.
2. Schlüssel kopieren und auf dem zweiten Gerät unter **Einstellungen** eingeben,
   **Verbinden**.

Beide Geräte zeigen danach denselben Stand. Der Server nimmt höchstens drei
verschiedene Schlüssel an (einstellbar oben in `sync.php`).

## Übungen und Ausrüstung pflegen

Die Quellen sind die beiden Tabellen:

- `data/uebungen.xlsx` — Übungskatalog
- `data/ausruestung.xlsx` — Ausrüstung mit Voraussetzungen und Dateinamen

Jede Tabelle hat ein Blatt **Erklärung** mit allen Spalten. Nach einer Änderung
müssen die Tabellen in das Format umgewandelt werden, das die App liest:

- **Auf dem Mac:** im Terminal im Projektordner `python3 tools/convert_data.py`.
  Braucht nur Python 3, sonst nichts.
- **Über GitHub:** die geänderte Tabelle ins Repository hochladen. Der Ablauf
  „Prüfen und Daten umwandeln“ wandelt sie um und legt die JSON-Dateien dazu.

Danach `data/uebungen.json` und `data/ausruestung.json` auf den Webspace laden.
Findet die Umwandlung einen Fehler, schreibt sie nichts und nennt Tabelle und Zeile.

## Bilder

| Was | Ort | Größe |
| --- | --- | --- |
| Basisfigur | `assets/figur/basisfigur.png` | 1024 × 1536, transparent |
| Ausrüstung auf der Figur | `assets/figur/slot_name_stufe.png` | 1024 × 1536, transparent, nie zuschneiden |
| Icons | `assets/icons/icon_slot_name_stufe.png` | 256 × 256, transparent |
| App-Symbol | `assets/app/` | 180, 192, 512 |

Die mitgelieferten Bilder sind Platzhalter. Neue Bilder mit gleichem Namen
ersetzen sie einfach. Die Umwandlung meldet fehlende Bilder und falsche Maße.

## Aufbau

| Ordner | Inhalt |
| --- | --- |
| `index.html`, `css/`, `js/` | die App, ohne Framework und ohne Build-Schritt |
| `js/formulas.js` | Levelkurve, Malus, Bodensatz |
| `js/replay.js` | berechnet den Spielstand aus allen Einträgen |
| `js/planner.js` | wählt die Übungen des Tages |
| `sync.php` | Geräteabgleich |
| `data/` | Tabellen (Quelle) und JSON (für die App) |
| `tools/convert_data.py` | Umwandlung der Tabellen |
| `tests/` | Prüfungen der Spielregeln, `npm test` mit Node.js |
