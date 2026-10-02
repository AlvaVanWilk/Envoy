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
- Veröffentlichung: Ein GitHub-Ablauf testet, wandelt die Tabellen um und lädt per SFTP
  auf den IONOS-Webspace: den Arbeitszweig in den Testordner (`<Ordner>-test`, dort als
  „Envoy Test“ gekennzeichnet, mit eigenem Speicher, siehe `js/stage.js`), den Zweig
  `main` in den echten Ordner. Auf `main` kommt nur, was die Nutzerin im Testordner
  angesehen und ausdrücklich freigegeben hat („freigeben“); dann den geprüften Stand
  unverändert auf `main` bringen. Nur die Testfassung zeigt Test-Knöpfe (am Schild
  „Test“, schwebend über der Seite: Energie auffüllen, Stein, Pilzholz und Bannsplitter
  dazu, Expedition beenden, `js/ui/testtools.js`); die echte Fassung nie.
- Formen der Oberfläche: kreisrund oder rechteckig, nicht oval.
- **Kein Zugriff auf Apple Health oder die Apple Watch.** Eine Webapp kann das nicht.
  Gemessene Werte (Strecke, Tempo, Haltezeit) werden von Hand eingetragen.
- UI-Texte auf Deutsch. Bezeichner und Kommentare im Code auf Englisch.
- Mobile first. Die App wird fast ausschließlich auf dem iPad und am Telefon benutzt.

## Was in Phase 1 gebaut wird

- Die vier Tagesaufgaben, ihre Auswahl und ihre Erledigung, Krankheitsmodus
- Stats, XP, Levelkurve, Malus, Bodensatz
- Lager als Startansicht (Bild nach Lagerstufe und Tageszeit, darauf das Hygge als Zahl,
  ohne Fortschrittsanzeige, und die Knöpfe „Lager einrichten“ und „Lager aufwerten“;
  Vorrat, Expedition, gesichtete Geister)
- Menü unten mit fünf Punkten (Abenteuer, Talentbaum, Lager, Händler, Handbuch); oben auf
  jeder Seite eine Leiste mit großem Portrait (vier Werte-Ringe, auch auf der
  Envoy-Seite), Tageswerk-Knopf und Einstellungen
- Handbuch als Buch: Anleitung (wächst mit dem Entdeckten), Tageswerk- und
  Quest-Rückblick, Kompendium, Erfolge; das Buch füllt das Fenster, ohne zu scrollen
  (lange Listen teilen sich auf so viele Seiten, wie das Fenster fasst)
- Charakterfenster mit Paperdoll-Darstellung, Ausrüstungsslots, Inventar-Box und dem
  Namen des Envoy; nach dem ersten Erstellen beginnt das Spiel dort mit einem kurzen,
  überspringbaren Rundgang (Overlay, vier Schritte), jeder spätere Start ist im Lager
- Konten (Anmelden, Konto erstellen, ohne Konto spielen) und Envoy-Erstellung: Figur,
  Haut- und Haarfarbe, Name
- Speicherung und Geräteabgleich pro Konto
- Spielwelt: Karte mit Orten, Quests und täglichen Begegnungen (ein Tipp auf einen Ort
  fächert seine Quests auf; das Fenster einer Quest zeigt Text, Voraussetzung, Belohnung
  und die Energie als Leiste, keine Dauer), Energie (10 je Level
  Ausdauer, eine Energie = eine Minute), Expeditionen in echter Zeit (Hinweg, vor Ort,
  Rückweg; solange der Envoy unterwegs ist, lässt sich alles anhängen, er geht direkt
  weiter, nur solange die Energie mit dem Rückweg reicht; Sammeln plant mit den besten
  Würfeln, brauchen sie mehr, fällt die letzte Aktion heraus; die Kosten als ein Block
  mit Weg-Anteil in der Energie-Leiste),
  Kämpfe und Höhlen ohne Scheitern, Beute, Währung Bannsplitter, dazu Pilzholz und Stein; Sammeln auf dem Trümmerfeld (eigener Ort gleich beim Lager) ohne
  Weg, Menge wählbar, mit Würfeln (2 bis 4 Stück je Energie, nie weniger als 2)
- Lager: die erste Quest ist das Lagerfeuer (Lagerstufe 1); danach vier Einrichtungen
  (Steinlager, Pilzlager, Aufbewahrung, Schlafplatz) auf ihrer Stufe 1, keine Quests und
  nicht auf der Karte, nur über „Lager einrichten“ (Kacheln); Hygge als Summe der
  Einrichtungen (1, 1, 2, 3, als kleine Medaille an jeder Kachel; die Aufbewahrung heißt
  auf Stufe 1 Krempelplatz), ab 5 kann
  das Lager aufgewertet werden, muss aber nicht; Rundgänge durch Abenteuer (erster Besuch) und Lager (nach dem Feuer)
- Rucksack (von Anfang an, 5 Plätze, am Start leer; Pilzholz und Stein belegen Plätze,
  2 Stück je Platz), Händler, Kompendium der getroffenen Geister
- Erfolge: bisher einer („Angekommen“, +10 % auf Tageswerk und Sammeln, nur die ersten
  15 Minuten nach dem Start)

Freischaltung: Karte und Quests von Anfang an. Lagerausbau und Händler über Quests.
Talentbaum bei allen vier Stats auf 10 (Inhalt folgt).

## Was in Phase 1 NICHT gebaut wird

- Talentbaum: existiert nur als Rundschild mit Schloss im Menü; Antippen öffnet eine eigene
  Seite, die den Abstand der vier Werte zu Level 10 zeigt, sonst keine Funktion dahinter
- Rundgänge für die anderen Seiten (folgen später)
- Arena, Mehrspieler, Freunde
- Ernährungsmodul
- Weitere Erfolge (etwa „100 km spaziert“) und Freischaltungen über Erfolge: nach dem
  Konzept der Nutzerin; Erfolge für echte Übungen zählen nur Summen, nie Serien
- Lagerausbau ab Stufe 2 und höhere Stufen der Einrichtungen, Deko: nach dem Konzept der
  Nutzerin (Deko erst ab Lagerstufe 2). Bis dahin zeigt das Lager das Hygge und einen
  Knopf „Lager aufwerten“ (glimmt, sobald das Hygge reicht), der beim Antippen sagt, warum
  es noch nicht geht; das Blatt `Deko`
  in `welt.xlsx` ist vorbereitet, nichts wird gesammelt
- Schlafplatz mit Bonus auf Werte: nie. Er gibt Energie (Punkt 4 der Nicht-verhandelbar-
  Liste und das Konzept: Werte steigen nur durch echte Übungen)
- Der Envoy im Bild des Lagers (sitzend, im eigenen Lager-Outfit)
- Endgame: Inhalte reichen vorerst höchstens bis ins gute Midgame, damit Luft nach oben
  bleibt. Wo genau der jetzige Inhalt endet, ist noch offen.

Nicht vorgreifen. Keine Platzhalter-Implementierungen für diese Funktionen bauen,
solange nicht ausdrücklich danach gefragt wird.

## Die vier Stats

| Stat | Tagesaufgabe | Kampfrolle (Phase 2) |
| --- | --- | --- |
| Kraft | Tiefenmuskulatur | Schadenshöhe |
| Ausdauer | Spazieren, Treppe, Rad | max. Leben, Energieleiste |
| Beweglichkeit | Stretching, Mobility | Treffer- und Ausweichchance |
| Gelassenheit | Entspannung, Atemübung | verkürzt Ruhezeiten |

Start bei 1, Obergrenze 100.

## Kernformeln

**XP pro Übung:** 14 bis 28, Schnitt 20. Hängt am Umfang der konkreten Übung, nicht
am Bereich. Erfolge können darauf einen Bonus geben (so gewünscht): „Angekommen“
+10 %, gerundet (14 → 15), aber nur in den ersten 15 Minuten nach dem Start. Angezeigt
wird immer der Gewinn mit Bonus.

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

**Energie:** Größe der Leiste = 10 × Ausdauer. Alles, was der Envoy tut, kostet Energie,
eine Energie ist eine Minute. Das Lagerfeuer (8 Stein, 2 Pilzholz, 2 Energie) muss am
ersten Tag mit den 10 Energie des Starts sicher zu schaffen sein, auch bei den schlechtesten
Würfen: 8 Stein höchstens 4 Energie, 2 Pilzholz höchstens 1.

**Sammeln auf dem Trümmerfeld:** je Energie 2 Stück und bis zu 2 weitere (zwei Würfel,
Chance 25 % bei Level 1, +1,5 Punkte je Level von Kraft für Stein, von Beweglichkeit für
Pilzholz, höchstens 90 %). Nie weniger als 2 je Energie, keine Fehlwürfe.

## Daten

- `data/uebungen.xlsx` — Übungskatalog, von der Nutzerin gepflegt
- `data/ausruestung.xlsx` — Ausrüstung mit Voraussetzungen, Effekten und Dateinamen
- `data/welt.xlsx` — Orte, Monster, Quests, Lagerstufen, Einrichtungen (mit Hygge), Deko

Alle drei Dateien sind Quelle, nicht Ziel. Nie hineinschreiben. Beim Bauen in ein Format
einlesen, das die App zur Laufzeit nutzt, und die Konvertierung wiederholbar halten.

## Assets

Paperdoll-Ebenen, alle mit identischer Leinwand **1024 × 1536**, PNG mit Alphakanal,
nie zugeschnitten. Reihenfolge hinten nach vorn:

1. Accessoire (Platz für Besonderes: Umhang, Schal, Tasche; liegt je nach Teil)
2. Basisfigur
3. Beinkleidung
4. Schuhe
5. Torso
6. Handwickel (das Gegenstück zur Waffe in der waffenlosen Kampfkunst)
7. Frisur / Kopfbedeckung

Kein Waffen-Slot, kein Gürtel, keine Schulterstücke.

Ein Teil kann an anderer Stelle liegen als sein Slot (Spalte `ebene` in
`ausruestung.xlsx`, Feld `ebene` in der Kleiderkammer, `EBENEN` in `js/config.js`):
Hinter der Figur, Unter der Hose (eingestecktes Hemd), Über den Schuhen (weite Hose),
Über jeder Hose (hohe Stiefel), Unter dem Oberteil, Über dem Oberteil, Ganz vorn.
Das entscheidet die Nutzerin; aus dem Bild allein lässt es sich nicht sicher ablesen.

Icons sind 256 × 256 und werden aus den Zeichnungen der Ebenen freigestellt (so gewünscht).

Wird die Voraussetzung eines getragenen Teils unterschritten, fliegt es aus dem Slot
und wird **nicht mehr gerendert** — die Figur sieht dort aus, als trüge sie nichts.

Zwei Figuren stehen zur Wahl, beide von der Nutzerin gezeichnet: eine Frau
(`assets/figur/`) und ein Mann (`assets/figur/zweite/`, mit eigenen Fassungen von
Hemd, Hose und Handschuhen). Figur und Ausrüstung zeichnet die Nutzerin; keine eigenen
Platzhalter erzeugen. Teile ohne Bild werden nicht gezeichnet, als Icon dient das
Slot-Symbol. Haut- und Haarfarbe färbt die App im Browser um (`js/ui/look.js`).

Dateinamen: `slot_name_stufe.png`, Icons mit Präfix `icon_`.

Weitere Bilder: Monster `assets/monster/<id>.png` (512 × 512), Lager
`assets/lager/stufe_<n>_<zeit>.jpg` (1792 × 672; Zeit = morgen, tag, abend, nacht; Stufe 0 =
ohne Feuer, bisher nur tag, die anderen Zeiten tönt die App; Stufe 1 = Lagerfeuer),
Portrait des Envoy
`portrait.png` im Ordner jeder Figur (quadratisch, freigestellt, wird umgefärbt), Einrichtung
`assets/icons/icon_einrichtung_<id>.png` (256 × 256), Karte `assets/welt/karte.jpg` (3:2).

## Kleiderkammer

Austausch-Datenbank zwischen Nutzerin und Claude für alle Kleidungsteile, eine private
Seite auf claude.ai: https://claude.ai/artifact/92pbHMV3YqemSrC4s86ADj. Sie gehört nicht
zur App und ist für Spieler nicht erreichbar (Zugriffsregel: lesen und schreiben erst
ab `admin`). Quelltext der Seite: `tools/kleiderkammer.html`; Änderungen dort machen und
mit dem Werkzeug `Artifact` unter derselben Adresse neu veröffentlichen.

Lesen und Schreiben mit dem Werkzeug `ArtifactData`, Bilder mit `Artifact`
(`action: read`, `path: <Bild-Id>`). Sammlungen:

- `teile`: eine Zeichnung = ein Eintrag. `nr` und `name` sind eindeutig; wenn die
  Nutzerin über ein Teil spricht, meint sie diesen Namen oder „Nr. 7“. `figur` (`frau`
  = Figur `erste`, `mann` = `zweite`), `slot`, `ebene` (leer = wie der Slot), `bild` und
  `icon` (Bild-Ids), `gegenstueck`
  (Eintrag der anderen Figur), `freigabe`, `vorgaben` (ihre Wünsche: `verwendung`,
  `questThemen`, `questThemaFrei`, `erfolg`, `bereich`, `stats`, `idee`), `imSpiel`,
  `spiel` (Claudes Angaben: `kennung`, `stufe`, `herkunft`, `voraussetzung`,
  `faehigkeit`, `wirkung`, `seit`, `notiz`).
- `wuensche`: Teile, für die Claude eine Zeichnung braucht (`titel`, `slot`, `figuren`,
  `aussehen`, `bereich`, `stats`, `wofuer`, `kennung`, `teile`, `entscheidung`, `notiz`).
  `entscheidung: "nicht"` heißt: sie will es nicht zeichnen, etwas anderes suchen.
- `config/figuren`: die beiden Basisfiguren für die Vorschau.

Regeln für Claude:

- Nur Teile mit `freigabe: true` verwenden.
- Einträge nicht verändern, außer die Nutzerin bittet ausdrücklich darum. Ausnahme:
  Wird ein Teil ins Spiel genommen (oder wieder heraus), `imSpiel` und `spiel` füllen —
  Anforderung, Fundort, Wirkung. Das ist ihr Spoilerschutz: `spiel` und `wofuer` im Chat
  nicht ungefragt ausbreiten; sie deckt sie in der Datenbank gezielt auf.
- Fehlende Angaben in `vorgaben` darf Claude selbst entscheiden; das Ergebnis steht
  dann in `spiel`, nicht in `vorgaben`.
- Fehlt für einen Fall ein passendes Teil, einen Eintrag in `wuensche` anlegen.
- Vor jedem Schreiben lesen und mit `if_version` schreiben, damit keine Änderung der
  Nutzerin verloren geht.

## Arbeitsweise

- Kernformeln und die sieben Punkte oben nicht eigenmächtig ändern. Vorschlagen ja,
  umsetzen erst nach Rückfrage.
- Wenn eine Entscheidung getroffen wird, die von der Spezifikation abweicht: die
  Spezifikation nachziehen, nicht stillschweigend auseinanderlaufen lassen.
- Kleine, lesbare Module. Die Nutzerin ist keine Entwicklerin und muss den Code lesen
  können, um Vertrauen zu haben.
- Deutsche UI-Texte knapp und ohne erklärende Kleingedruckte. Keine Motivationssprüche,
  keine Ausrufezeichen, kein Coaching-Ton.
- „XP“ und „Level“ gibt es nur je Stat, nie für den Helden selbst (Punkt 4 oben). Damit
  darf „XP“ in der Oberfläche stehen, wenn es um einen Stat geht („noch 30 XP bis
  Level 2“). Gewinne heißen weiterhin nach ihrem Stat („+14 Kraft“).
- In der Spielwelt scheitert nichts. Stats bestimmen Zugang, Dauer und Ertrag.
