# Envoy

Webapp, die eine gesunde Alltagsroutine als Rollenspiel belohnt. Jeden Tag gibt die
App vier reale Aufgaben vor, eine je Bereich, jede eine kleine Einheit von Übungen. Nur davon steigen die Werte des Envoy. Mit
diesen Werten zieht er durch eine Welt aus Orten, Quests und Geistern. Jede und jeder,
die mitspielt, hat ein eigenes Konto und einen eigenen Envoy.

Regeln und Formeln: [`docs/spezifikation.md`](docs/spezifikation.md).
Arbeitsanweisung für die Weiterentwicklung: [`CLAUDE.md`](CLAUDE.md).

## Testfassung und echte App

Es gibt zwei Fassungen auf dem Webspace:

- **Testfassung** im Ordner neben dem echten, mit „-test“ am Ende (zum Beispiel
  `envoy-test`). Jede neue Arbeit landet zuerst hier. Sie heißt „Envoy Test“, trägt
  oben ein kleines Schild „Test“, hat ein eigenes Icon (oranger Hintergrund, aus
  `assets/app/test/`) und speichert alles getrennt von der echten App, auch die Konten.
  Hier wird angesehen und ausprobiert. Ein neues Icon zeigt der Homebildschirm erst,
  wenn man die App dort entfernt und neu hinzufügt.
- **Echte App** im eigenen Ordner (zum Beispiel `envoy`). Sie ändert sich nur, wenn
  eine geprüfte Fassung freigegeben wird: dann kommt der Stand der Testfassung auf den
  Zweig `main`, und genau dieser wird hochgeladen.

Freigeben: Claude sagen „freigeben“. Mehr braucht es nicht.

## Automatisch auf IONOS hochladen (einmal einrichten)

Nach der Einrichtung landet jede Änderung von selbst auf dem Webspace: der
Arbeitszweig im Testordner, der Zweig `main` im echten Ordner.

**1. SFTP-Zugang bei IONOS anlegen**

IONOS-Konto → Hosting → dein Webspace → **SFTP & SSH** → Zugang anlegen. Notieren:
Server (z. B. `access-5012345678.webspace-host.com`), Benutzername, Passwort.

Wichtig: Der Ordner muss in dem Ordner liegen, auf den die Domain zeigt. Welcher das
ist, steht bei IONOS unter **Domains & SSL** → die Domain → Ziel (zum Beispiel
`/wordpress`). Läuft auf der Domain WordPress, ist es der Ordner, in dem `wp-admin` und
`wp-content` liegen. Envoy kommt dann dort hinein, z. B. `/wordpress/envoy`, und ist
unter `https://deine-domain.de/envoy` zu erreichen (WordPress lässt echte Ordner in Ruhe).
Ein Ordner daneben, ganz oben im Webspace, ist über die Domain nicht zu erreichen.

**2. Die Daten bei GitHub hinterlegen**

Repository auf github.com → **Settings → Secrets and variables → Actions → New
repository secret**. Vier Einträge:

| Name | Wert |
| --- | --- |
| `IONOS_SFTP_HOST` | der Server aus Schritt 1 |
| `IONOS_SFTP_USER` | der Benutzername |
| `IONOS_SFTP_PASSWORD` | das Passwort |
| `IONOS_SFTP_PATH` | der Ordner, z. B. `/wordpress/envoy` (der Testordner wird daraus `/wordpress/envoy-test`) |

GitHub zeigt die Werte danach nie wieder an, auch nicht in Protokollen.

**3. Fertig**

Unter **Actions** siehst du jeden Lauf. Ein grüner Haken heißt: getestet, umgewandelt,
hochgeladen. Der Testordner wird beim ersten Mal von selbst angelegt. Tabellen, Werkzeuge, Tests und Doku werden nicht hochgeladen. Der Ordner
`sync-daten/` auf dem Server wird nie angefasst.

Ohne diese Einrichtung geht es weiter wie bisher von Hand: alle Dateien außer `tools/`,
`tests/`, `docs/` und den `.xlsx`-Tabellen mit dem IONOS-Explorer hochladen. Die
`.htaccess` muss mit, sie sperrt alles, was nicht öffentlich sein soll.

## Auf das iPad

Adresse in Safari öffnen, Teilen-Symbol → **Zum Home-Bildschirm**. Die App startet dann
im Vollbild und läuft auch ohne Verbindung; Einträge werden nachgeholt.

## Konten

Beim ersten Öffnen erscheint der Startbildschirm: **Neues Konto** (Name und Passwort),
danach Figur, Haut- und Haarfarbe und Name des Envoy wählen. Auf jedem weiteren Gerät
mit demselben Namen und Passwort **Anmelden**; der Spielstand kommt vom Server.

- Gab es auf dem Gerät schon einen Spielstand von vor den Konten, ist „Den bisherigen
  Spielstand dieses Geräts übernehmen“ angekreuzt. Er wandert dann ins neue Konto,
  zusammen mit allem, was der alte Geräteschlüssel auf dem Server kennt.
- **Ohne Konto spielen** geht auch; dann bleibt der Envoy auf diesem Gerät. Unter
  Einstellungen → Konto lässt sich später ein Konto dazu erstellen.
- Konten brauchen PHP auf dem Webspace (bei IONOS vorhanden). Auf einem Webspace ohne
  PHP, etwa GitHub Pages, meldet die App „Der Server für Konten ist hier nicht
  erreichbar“; „Ohne Konto spielen“ funktioniert dort trotzdem.
- Der Server nimmt höchstens 30 Konten an (`MAX_ACCOUNTS` oben in `sync.php`). Nach fünf
  falschen Passwörtern ist ein Konto 15 Minuten gesperrt. Passwörter liegen nur als Hash
  auf dem Server, in `sync-daten/konten/`.

## Übungen, Ausrüstung und Welt pflegen

Die Quellen sind drei Tabellen in `data/`, jede mit einem Blatt **Erklärung**:

- `uebungen.xlsx` — Übungen je Bereich mit ihren Stufen, Zeit, Frage, Ansagen und XP
- `ausruestung.xlsx` — Ausrüstung mit Voraussetzungen, Fähigkeiten, Herkunft, Preis
- `welt.xlsx` — Orte der Karte, Monster, Quests (mit `aktiv`: nein nimmt eine Quest vorerst aus
  dem Spiel, ohne sie zu löschen), Lagerstufen, Einrichtungen (mit Hygge), Deko

Nach einer Änderung die Tabelle auf github.com hochladen (im Ordner `data` → **Add
file → Upload files**). Der Ablauf wandelt sie um. Findet er einen Fehler, bleibt der
Haken rot und das Protokoll nennt Tabelle und Zeile; die App arbeitet dann mit dem
alten Stand weiter.

Auf dem Mac geht es auch direkt: im Projektordner `python3 tools/convert_data.py`.

## Bilder

| Was | Ort | Größe |
| --- | --- | --- |
| Basisfigur (erste Figur) | `assets/figur/basisfigur.png` | 1024 × 1536, transparent |
| Zweite Figur (Mann) | `assets/figur/zweite/basisfigur.png` | seine eigene Kleidung mit gleichem Namen in diesen Ordner |
| Ausrüstung auf der Figur | `assets/figur/slot_name_stufe.png` | 1024 × 1536, transparent, nie zuschneiden |
| Icons | `assets/icons/icon_slot_name_stufe.png` | 256 × 256, transparent, aus der Zeichnung freigestellt |
| Icons der zweiten Figur | `assets/icons/zweite/icon_slot_name_stufe.png` | wie oben; nur für Teile mit eigener Fassung |
| Deko (ab Lagerstufe 2) | `assets/icons/icon_einrichtung_<id>.png` | 256 × 256, transparent; ohne Bild das Deko-Zeichen |
| Monster | `assets/monster/<id>.png` | 512 × 512, transparent |
| Lager | `assets/lager/stufe_<n>_<zeit>.jpg` | 1792 × 672; Zeit morgen, tag, abend, nacht; Stufe 0 ohne Feuer (bisher nur tag), Stufe 1 mit Lagerfeuer; fehlt eine Stufe, zeigt die App die davor |
| Gebäude im Lagerbild | `assets/lager/gebaeude_<n>[_<teil>].png` | 1792 × 672, transparent, das Gebäude der Lagerstufe ab 2, an seinem Platz gezeichnet, auch in Teilen (hinter und vor den Betten); fehlt eine Stufe, das der Stufe davor |
| Einrichtung im Lagerbild | `assets/lager/einrichtung_<id>_<stufe>.png` | 1792 × 672, transparent, an ihrem Platz gezeichnet; fehlt eine Stufe, die davor |
| Deko im Lagerbild | `assets/lager/deko_<id>.png` | 1792 × 672, transparent, an ihrem Platz gezeichnet |
| Ausschnitte im Lagerbild | `assets/lager/ausschnitt_<name>_<zeit>.png` | 1792 × 672, transparent: Felsen, Feuer, Säulen aus dem Bild, damit sie vor dem stehen, was dahinter liegt, manche nur bis zu einer Lagerstufe oder nicht mit einer bestimmten Einrichtung; macht `tools/lager_ebenen.py` |
| Portrait des Envoy | `portrait.png` im Ordner jeder Figur | quadratisch, Hintergrund frei; wird wie die Figur umgefärbt |
| Die Übungen als Linienfiguren | `assets/uebungen/<id>.svg` | bewegt, 3:2; macht `tools/uebungsbilder.py` (`python3 tools/uebungsbilder.py`); auf der Karte der Aufgabe und im Timer |
| Der Envoy bei einer Übung | `uebungen/<id>.png` im Ordner jeder Figur | eine eigene Zeichnung, falls es einmal eine gibt: geht vor der Linienfigur; am besten 3:2 quer, Hintergrund frei; wird wie die Figur umgefärbt |
| Karte | `assets/welt/karte.jpg` | Seitenverhältnis 3:2, z. B. 2400 × 1600 |
| App-Symbol | `assets/app/` | 180, 192, 512, dazu `icon-maskable-512.png` mit mehr Rand für runde Masken |

Die Figur des Envoy und ihre Kleidung sind eigene Zeichnungen. Für Ausrüstung ohne
Bild gibt es keine Platzhalter: Das Teil wird getragen, aber nicht gezeichnet, und als
Icon steht das Symbol des Slots. Ein neues Bild mit dem Namen aus der Tabelle erscheint
sofort. Die Umwandlung meldet fehlende Bilder und falsche Maße als Hinweis. Karte,
Monster und Einrichtung sind noch vorläufige Bilder. Bei einer neuen
Karte die Positionen der Orte (x, y in Prozent) in `welt.xlsx` anpassen.

Haut- und Haarfarbe färbt die App selbst um. Dafür muss sie wissen, in welcher Haut- und
Haarfarbe eine Figur gezeichnet ist; das steht in `js/config.js` unter `FIGURES`. Bleibt
eine neue Zeichnung einer Figur bei denselben Farben, ist nichts zu tun.

## Aufbau

| Ort | Inhalt |
| --- | --- |
| `index.html`, `css/`, `js/` | die App, ohne Framework und ohne Build-Schritt |
| `js/config.js` | alle Zahlen der Regeln an einer Stelle |
| `js/formulas.js` | Levelkurve, Malus, Bodensatz |
| `js/replay.js` | berechnet den Spielstand aus allen Einträgen |
| `js/tasks.js` | die Aufgabe jedes Bereichs: seine Übungen auf ihrer Stufe, Fragen danach, XP |
| `js/world/` | Karte, Expeditionen, Energie, Kampf, Quests, Händler, Inventar, Lager |
| `js/achievements.js` | die Erfolge und ihre Belohnungen |
| `js/ui/` | die Ansichten; `today.js` das Tageswerk, `taskcard.js` die Karte einer Aufgabe (dreht sich auf, Reiter je Übung, Fragen), `timer.js` der geführte Timer, `voice.js` seine Stimme, `topbar.js` die Leiste oben, `camp.js` das Lager (sein Bild aus Ebenen, ein Tipp zeigt es groß), `handbook.js` das Handbuch (`room.js` rechnet aus, wie viele Einträge auf eine Seite passen), `tour.js` und `tours.js` die Rundgänge, `worldmap.js` die Karte mit dem Fächer der Quests, `questsheet.js` das Fenster einer Quest, `facilities.js` „Lager einrichten“, `deko.js` die Deko-Liste, `upgrade.js` „Lager aufwerten“, `testtools.js` das Menü am Schild „Test“, das nur die Testfassung zeigt; `journey.js` die Leiste einer laufenden Expedition mit ihrer Reihe und den Bericht; `js/world/expedition.js` Expeditionen als Reihe von Aktionen (Wege, Zeiten, Fortschritt), der Ablauf unterwegs steht in `js/world/worldstate.js`; `js/world/camp.js` das Lager (Stufen, Einrichtungen, Deko, Hygge), `js/world/plans.js` das Finden der Pläne für Deko, `js/daylight.js` die Tageszeit |
| `sync.php` | Geräteabgleich |
| `data/` | Tabellen (Quelle) und JSON (für die App) |
| `tools/` | Umwandlung der Tabellen; `tools/uebungsbilder.py` zeichnet die Übungen als bewegte Linienfiguren; `tools/lager_ebenen.py` hält die Reihenfolge der Ebenen im Lagerbild (`ORDER`, von hinten nach vorn) und macht aus den Teilen in `tools/lager-ausschnitte/` die Ausschnitte für jede Tageszeit |
| `tests/` | Prüfungen der Spielregeln, `npm test` mit Node.js |
