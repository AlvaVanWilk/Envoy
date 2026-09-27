# Envoy

Webapp, die eine gesunde Alltagsroutine als RPG belohnt. Der Nutzer erledigt täglich
vier reale Gesundheitsaufgaben; davon — und nur davon — steigen die Werte einer
Spielfigur, des Envoy. Der Envoy zieht in einer Parallelwelt los, erkundet, sammelt
Kleidung und kämpft in einer waffenlosen Kampfkunst gegen Geister, die als innere
Dämonen gelesen werden können. Die Spielwelt muss groß und umfangreich genug sein, um nicht als Belohnung, sondern als Kernelement verstanden zu werden. Die Verbesserung des Envoy durch eigene echte Übungen aber alternativlos.

Vollständige Spezifikation: siehe `docs/spezifikation.md`. Bei Widersprüchen zwischen
dieser Datei und der Spezifikation gilt die Spezifikation.

## Nicht verhandelbar

Diese Punkte sind das Konzept. Wenn eine Änderung einen davon verletzt, erst nachfragen.

1. **Die App entscheidet, was heute zu tun ist.** Der Nutzer wählt seine Tagesaufgaben
   nie selbst aus. Das ist der Kernmechanismus, nicht eine Komfortfunktion.
2. **Widerstand abbauen, nicht Leistung steigern.** Löst eine vorgegebene Aufgabe den
   Gedanken „das will ich gar nicht machen" aus, hat das System versagt. Kein Wording,
   keine Mechanik und kein Vorschlag darf Richtung Leistungsdruck kippen.
3. **Ausrüstung erhöht nie Stats.** Sie stellt Voraussetzungen und gibt Fähigkeiten.
4. **Es gibt kein Helden-XP und kein Heldenlevel.** XP existiert nur pro Stat.
5. **Spielverluste kosten nie zusätzliche reale Aufgaben.** Eine Kampfniederlage kostet
   Zeit im Spiel, nie mehr Training.
6. **Die Grundübungen sind nie „fertig".** Sie werden an keiner Stelle als Startphase,
   Tutorial oder Vorstufe dargestellt. Sie sind der dauerhafte Kern.
7. **Die App gibt keine medizinischen Ratschläge** und stellt keine Diagnosen.

## Technik

- Reine Webapp: HTML, CSS, JavaScript. Kein Framework, kein Build-Step, keine
  externen Abhängigkeiten zur Laufzeit.
- Läuft auf dem IONOS-Webspace der Nutzerin, aufs iPad als Homescreen-Icon.
- Speicherung lokal im Browser plus Abgleich über einen eigenen `sync.php`-Endpunkt.
  Gespeichert wird eine Ereignisliste, der Spielstand wird daraus berechnet. Jedes Konto
  (Name und Passwort) hat seine eigene Liste; ohne Konto bleibt ein Envoy auf dem Gerät.
- Veröffentlichung: Ein GitHub-Ablauf testet, wandelt die Tabellen um und lädt den
  Zweig `main` per SFTP auf den IONOS-Webspace.
- **Kein Zugriff auf Apple Health oder die Apple Watch.** Eine Webapp kann das nicht.
  Gemessene Werte (Strecke, Tempo, Haltezeit) werden von Hand eingetragen.
- UI-Texte auf Deutsch. Bezeichner und Kommentare im Code auf Englisch.
- Mobile first. Die App wird fast ausschließlich auf dem iPad und am Telefon benutzt.

## Was in Phase 1 gebaut wird

- Die vier Tagesaufgaben, ihre Auswahl und ihre Erledigung, Krankheitsmodus
- Stats, XP, Levelkurve, Malus, Bodensatz
- Übersicht als Startansicht
- Charakterfenster mit Paperdoll-Darstellung, Ausrüstungsslots, Inventar-Box und dem
  Namen des Envoy
- Konten (Anmelden, Konto erstellen, ohne Konto spielen) und Envoy-Erstellung: Figur,
  Haut- und Haarfarbe, Name
- Speicherung und Geräteabgleich pro Konto
- Spielwelt: Karte mit Orten, Quests und täglichen Begegnungen, Ausdauerleiste,
  Expeditionen in echter Zeit (Hinweg, vor Ort, Rückweg), Kämpfe und Höhlen ohne
  Scheitern, Beute, Währung Bannsplitter, dazu Pilzholz und Stein
- Rucksack (von Anfang an, 5 Plätze), Lager (mit dem Zuhause, nur im Lager nutzbar), Händler, Zuhause mit Ausbau
  und Einrichtung, Kompendium der getroffenen Geister

Freischaltung: Karte und Quests von Anfang an. Zuhause und Händler über Quests.
Talentbaum bei allen vier Stats auf 10 (Inhalt folgt).

## Was in Phase 1 NICHT gebaut wird

- Talentbaum: existiert nur als Rundschild mit Schloss im Menü; Antippen zeigt den Abstand
  der vier Werte zu Level 10, sonst keine Funktion dahinter
- Arena, Mehrspieler, Freunde
- Ernährungsmodul

Nicht vorgreifen. Keine Platzhalter-Implementierungen für diese Funktionen bauen,
solange nicht ausdrücklich danach gefragt wird.

## Die vier Stats

| Stat | Tagesaufgabe | Kampfrolle (Phase 2) |
| --- | --- | --- |
| Kraft | Tiefenmuskulatur | Schadenshöhe |
| Ausdauer | Spazieren, Treppe, Rad | max. Leben, Ausdauerleiste |
| Beweglichkeit | Stretching, Mobility | Treffer- und Ausweichchance |
| Gelassenheit | Entspannung, Atemübung | verkürzt Ruhezeiten |

Start bei 1, Obergrenze 100.

## Kernformeln

**XP pro Übung:** 14 bis 28, Schnitt 20. Hängt am Umfang der konkreten Übung, nicht
am Bereich.

**XP bis zum nächsten Level:**

```
xpToNext(n) = 45 * n**0.45 * (1 + (Math.max(0, n - 9) / 6)**2)
```

Bis Level 10 wirkt nur der erste Teil. Summe bis Level 10: 802 XP.

**Malus** pro Stat und pro Tag, an dem die zugehörige Aufgabe nicht erledigt wurde:

| Tag | Wirkung |
| --- | --- |
| 1 | kein Zuwachs, kein Abzug |
| 2 bis 7 | 0,25 × durchschnittlicher Tagesgewinn |
| ab 8 | 1,0 × durchschnittlicher Tagesgewinn |

Bezugsgröße ist der durchschnittliche XP-Gewinn dieses Stats über die letzten sieben
aktiven Tage. Einheitlicher Faktor für alle vier Stats.

**Absinken:** Läuft die XP-Leiste leer, fällt der Stat eine Stufe und die Leiste läuft
dort rückwärts weiter.

**Bodensatz:** 60 % des jemals höchsten erreichten Levels. Untergrenze Level 1, 0 XP.

**Steigerung der Übungsintensität:** hoch nach drei erfolgreichen Durchgängen in Folge,
runter schon nach zwei zu schweren. Langsam hoch, schnell runter. Ob ein Durchgang
erfolgreich war, ergibt sich wo möglich aus dem Pflicht-Messwert (ab 90 % des Ziels gut,
unter 70 % zu schwer). Ohne Messwert wird nur bei neuen Übungen und nach einem
Stufenwechsel gefragt. Nach 7 ausgelassenen Tagen in Folge eine Stufe runter.

**Krankheitsmodus:** Tagesaufgaben auf der niedrigsten Stufe, XP entsprechend dem
kleineren Umfang, zählt nicht für die Intensität. Keine Pausenregel für den Malus.

## Daten

- `data/uebungen.xlsx` — Übungskatalog, von der Nutzerin gepflegt
- `data/ausruestung.xlsx` — Ausrüstung mit Voraussetzungen, Effekten und Dateinamen
- `data/welt.xlsx` — Orte, Monster, Quests, Zuhause-Stufen, Einrichtung

Alle drei Dateien sind Quelle, nicht Ziel. Nie hineinschreiben. Beim Bauen in ein Format
einlesen, das die App zur Laufzeit nutzt, und die Konvertierung wiederholbar halten.

## Assets

Paperdoll-Ebenen, alle mit identischer Leinwand **1024 × 1536**, PNG mit Alphakanal,
nie zugeschnitten. Reihenfolge hinten nach vorn:

1. Umhang hinten
2. Basisfigur
3. Beinkleidung
4. Schuhe
5. Torso
6. Handwickel (das Gegenstück zur Waffe in der waffenlosen Kampfkunst)
7. Frisur / Kopfbedeckung

Kein Waffen-Slot, kein Gürtel, keine Schulterstücke.

Icons sind 256 × 256 und werden aus den Zeichnungen der Ebenen freigestellt (so gewünscht).

Wird die Voraussetzung eines getragenen Teils unterschritten, fliegt es aus dem Slot
und wird **nicht mehr gerendert** — die Figur sieht dort aus, als trüge sie nichts.

Zwei Figuren stehen zur Wahl, beide von der Nutzerin gezeichnet: eine Frau
(`assets/figur/`) und ein Mann (`assets/figur/zweite/`, mit eigenen Fassungen von
Hemd, Hose und Handschuhen). Figur und Ausrüstung zeichnet die Nutzerin; keine eigenen
Platzhalter erzeugen. Teile ohne Bild werden nicht gezeichnet, als Icon dient das
Slot-Symbol. Haut- und Haarfarbe färbt die App im Browser um (`js/ui/look.js`).

Dateinamen: `slot_name_stufe.png`, Icons mit Präfix `icon_`.

Weitere Bilder: Monster `assets/monster/<id>.png` (512 × 512), Zuhause
`assets/zuhause/stufe_<n>.png` (1200 × 800), Einrichtung
`assets/icons/icon_einrichtung_<id>.png` (256 × 256), Karte `assets/welt/karte.jpg` (3:2).

## Arbeitsweise

- Kernformeln und die sieben Punkte oben nicht eigenmächtig ändern. Vorschlagen ja,
  umsetzen erst nach Rückfrage.
- Wenn eine Entscheidung getroffen wird, die von der Spezifikation abweicht: die
  Spezifikation nachziehen, nicht stillschweigend auseinanderlaufen lassen.
- Kleine, lesbare Module. Die Nutzerin ist keine Entwicklerin und muss den Code lesen
  können, um Vertrauen zu haben.
- Deutsche UI-Texte knapp und ohne erklärende Kleingedruckte. Keine Motivationssprüche,
  keine Ausrufezeichen, kein Coaching-Ton.
- In der Oberfläche steht nie „XP“: Gewinne heißen nach ihrem Stat („+14 Kraft“).
- In der Spielwelt scheitert nichts. Stats bestimmen Zugang, Dauer und Ertrag.
