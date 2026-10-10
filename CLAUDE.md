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
  „Envoy Test“ gekennzeichnet, mit eigenem Speicher, siehe `js/stage.js`, und eigenem
  Icon mit orangem Hintergrund aus `assets/app/test/`), den Zweig
  `main` in den echten Ordner. Auf `main` kommt nur, was die Nutzerin im Testordner
  angesehen und ausdrücklich freigegeben hat („freigeben“); dann den geprüften Stand
  unverändert auf `main` bringen. Nur die Testfassung zeigt Test-Knöpfe (am Schild
  „Test“, schwebend über der Seite: Energie auffüllen oder über die Leiste hinaus, Stein,
  Pilzholz, Bannsplitter und Ruhm dazu, Plan finden, Kleidung finden, Expedition beenden, Rast in
  den Tiefen beenden, den Hinweis
  nach einem Tag ohne Tageswerk zeigen, die Kleiderkammer in Safari
  öffnen oder ihren Link kopieren,
  `js/ui/testtools.js`);
  die echte Fassung nie.
- Formen der Oberfläche: kreisrund oder rechteckig, nicht oval.
- **Kein Zugriff auf Apple Health oder die Apple Watch.** Eine Webapp kann das nicht.
  Gemessene Werte (Strecke, Tempo, Haltezeit) werden von Hand eingetragen.
- UI-Texte auf Deutsch. Bezeichner und Kommentare im Code auf Englisch.
- Mobile first. Die App wird fast ausschließlich auf dem iPad und am Telefon benutzt.

## Was in Phase 1 gebaut wird

- Die vier Tagesaufgaben, ihre Auswahl und ihre Erledigung (nur in der Karte, eine Übung erst,
  wenn ihre Zeit gelaufen ist, dann klingt ein Ton, so gewünscht; ein Tipp auf den Haken nimmt
  eine Aufgabe zurück), Krankheitsmodus
- Stats, XP, Levelkurve, Malus, Bodensatz
- Lager als Startansicht (Bild nach Lagerstufe und Tageszeit, darauf das Hygge als Zahl,
  ohne Fortschrittsanzeige, und die Knöpfe „Lager einrichten“ und „Lager aufwerten“;
  Vorrat, Expedition, „Draußen“: ein paar Zeilen zu gesichteten Geistern, Aushang und Tiefen)
- Menü unten mit fünf Punkten (Abenteuer, Talentbaum, Lager, Händler, Handbuch; unter Abenteuer
  alles Draußen als Reiter: Karte, Aushang, Tiefen, Arena, so gewünscht, `js/ui/adventuretabs.js`); oben auf
  jeder Seite eine Leiste mit großem Portrait (vier Werte-Ringe, auch auf der
  Envoy-Seite), Tageswerk-Knopf und Einstellungen
- Handbuch als Buch: Anleitung (wächst mit dem Entdeckten), Tageswerk- und
  Quest-Rückblick, Kompendium, Erfolge; das Buch füllt das Fenster, ohne zu scrollen
  (lange Listen teilen sich auf so viele Seiten, wie das Fenster fasst)
- Charakterfenster mit Paperdoll-Darstellung, Ausrüstungsslots, Inventar-Box, dem
  Namen des Envoy, den Kampfwerten (was die Kleidung dazugibt, in Orange), den übrigen Boni
  und für die Arena dem eigenen Fleiß und den Kampf-Boni der Kleidung, die dort wirken; nach dem ersten Erstellen beginnt das Spiel dort mit einem kurzen,
  überspringbaren Rundgang (Overlay, fünf Schritte, der letzte zeigt auf das Tageswerk:
  „Durch das Tageswerk kannst du deinen Envoy stärken.“), jeder spätere Start ist im Lager
- Konten (Anmelden, Konto erstellen, ohne Konto spielen) und Envoy-Erstellung: Figur,
  Haut- und Haarfarbe, Name, Alter (gespeichert als Geburtsjahr; Kinder und Jugendliche
  bekommen eigene Übungen, Spalte `alter` in `uebungen.xlsx`)
- Speicherung und Geräteabgleich pro Konto
- Spielwelt: Karte mit Orten, Quests und täglichen Begegnungen (ein Tipp auf einen Ort
  fächert seine Quests auf; das Fenster einer Quest zeigt Text, Voraussetzung, Belohnung
  und die Energie als Leiste, keine Dauer; daneben alle Quests als Liste mit Belohnung,
  Filter und Reihenfolge, ein Tipp lässt den Ort aufleuchten), Energie (10 je Level
  Ausdauer, eine Energie = zehn Sekunden, Wege kosten nur Zeit), Expeditionen in echter
  Zeit (Hinweg, vor Ort, Rückweg; solange der Envoy unterwegs ist, lässt sich alles
  anhängen, er geht direkt weiter, solange die Energie für die Arbeit reicht; Sammeln
  plant mit den besten Würfeln, brauchen sie mehr, fällt die letzte Aktion heraus; die
  Kosten als ein Block in der Energie-Leiste),
  Kämpfe und Höhlen ohne Scheitern, Beute, Währung Bannsplitter, dazu Pilzholz und Stein;
  eine Expedition lässt sich live mitverfolgen (Weg, Kampf Runde für Runde, Sammeln,
  Tagebuch, Wörter auf der Karte, `js/ui/scene.js`; auf jeder anderen Seite ein Schild über
  dem Menü, aus dem jeder Fund aufsteigt, `js/ui/tripsign.js`), der Bericht entfaltet sich Fund für
  Fund; nach einer erledigten Aufgabe fliegt ein Licht zum Ring ihres Werts, der wächst
  und mit dem Portrait aufglimmt; Sammeln auf dem Trümmerfeld (eigener Ort gleich beim Lager) ohne
  Weg, Menge wählbar, mit Würfeln (2 bis 4 Stück je Energie, nie weniger als 2)
- Lager: die erste Quest ist das Lagerfeuer (Lagerstufe 1); fünf Lagerstufen
  (Provisorisches Lager, Unterstand, Wackelige Hütte, Stabile Hütte, Steinhäuschen),
  aufzuwerten mit genug Hygge (5, 14, 36, 90), Material und Energie am Stück (15, 40, 85,
  140, seit 5.19: die ersten leichter, so gewünscht), kein Muss;
  vier Einrichtungen in Stufen mit eigenen Namen (Steinlager und Pilzlager bis Stufe 3,
  Aufbewahrung bis 4, Schlafplatz bis 5; jede Stufe ab der gleichen Lagerstufe), keine
  Quests und nicht auf der Karte, nur über „Lager einrichten“ (Kacheln, Hygge als kleine
  Medaille); Deko ab Lagerstufe 2 (eine Kachel mit Liste, mehr Hygge als Lager und
  Aufbewahrung, mindestens so viel wie das Bett der Stufe, bleibt beim Aufwerten): je
  Stufe ein Plan gleich da, die anderen werden gefunden (an ihrem Ort, bei Geistern oder
  beim Händler; selten, sehr selten, kostbar; nach doppelt so vielen Chancen wie im
  Schnitt sicher), nicht gefundene grau und ohne Namen; gebaute lassen sich abbauen (halbes Material
  zurück, so gewünscht); die Lichterkette (Zeichnung der Nutzerin) am 9. Oktober 2026 sicher beim Händler, sonst mit Glück; Hygge als Summe von Einrichtungen
  und Deko, ab Stufe 2 reichen die Einrichtungen allein nicht; das Lagerbild aus Ebenen
  (Grundbild der Stufe, ab Stufe 2 das Gebäude, Einrichtungen, Deko, Vordergrund; ein Tipp
  zeigt es groß); Rundgänge durch Tageswerk und Abenteuer (je beim ersten Besuch)
  und Lager (nach dem Feuer)
- Startoutfit ohne Handschuhe und ohne Schuhe; die ersten Handwickel bringt die Quest „Stoff
  zwischen den Trümmern“ auf dem Trümmerfeld (ohne Voraussetzung, 2 Energie, am ersten Tag
  zu schaffen), die Bastsandalen die Quest „Bast aus dem Pilzhain“ (ohne Voraussetzung,
  2 Energie und je 1 Energie Weg)
- Kleidung als Fundstücke: die Teile der Kleiderkammer (Herkunft `fund`, ohne feste Fähigkeit)
  unterwegs bei jeder Quest außer Bauen (3 % je Energie, der erste nach 5 Energie sicher und
  sofort tragbar, sonst spätestens nach 66), bei Geistern und beim Händler; jedes Stück in einer
  eigenen Farbe (12 oder wie gezeichnet, Spalte `faerbbar`, `DYES` in `js/config.js`, umgefärbt
  in `js/ui/look.js`, Haut bleibt); nur, was der Figur passt (Spalte `figur`: Frau, Mann, beide);
  feste Questbelohnungen bleiben wenige; jedes gefundene, erbeutete oder angebotene Stück hat
  eine Güte (schlicht, gut, selten, prächtig) mit 0 bis 3 gewürfelten Boni (Schaden, Treffer,
  Ausweichen, Beruhigen, Erholung der Energie, Glück; größer bei stärkerem Envoy, `js/world/bonuses.js`;
  innerhalb der Güte schwächer oder stärker, `spread` in `QUALITIES`, so gewünscht;
  so gewünscht: was Anforderungen stellt, bietet in besonderem Maß etwas: Boni so groß, als wäre der
  Envoy um die Anforderung stärker, und nie schlicht), so gewünscht:
  Ausrüstung hebt nie einen Stat, soll aber wichtig sein;
  Einweben am Lagerfeuer (so gewünscht, `js/world/weave.js`): Güte und Boni eines Stücks gehen
  in ein anderes für denselben Platz, das sein Aussehen behält; das gebende zerfällt, kostet sonst
  nichts, und der Envoy muss es tragen können (so gewünscht)
- Rucksack (von Anfang an, 5 Plätze, am Start leer, nur für Dinge); Pilzholz und Stein
  liegen im Vorrat, ohne Lager 10 je Art, mit Stein- bzw. Pilzlager so viel, wie es fasst
  (gesammeltes ist sofort dort, ohne Erklärung); Händler (Quest ohne Voraussetzung, am ersten
  Tag zu schaffen; dazu jeden Tag je zwei Tränke für Energie, Pilztee +10 und Quellsud +25,
  nie über die Leiste), Kompendium der getroffenen Geister
- Erfolge: bisher einer („Angekommen“, +10 % auf Tageswerk und Sammeln, nur die ersten
  15 Minuten nach dem Start)
- Arena (so gewünscht): Ruhmeshalle mit laufender Rangliste der Abbilder aller Konten auf dem
  Server (Forderungsrangliste: bis drei Plätze über oder unter dem eigenen, jedes einmal am
  Tag, ohne Energie; Sieg gegen weiter oben nimmt den Platz), Kämpfe entscheidet der Server (`arena.php`)
  aus dem Fleiß, nicht der Begabung (so gewünscht): Fleiß = Tage mit erledigter Aufgabe in den
  letzten 28 Tagen, alle vier Bereiche zusammen, jede Aufgabe zählt gleich, egal welche Stufe;
  ein echter Kampf entscheidet, nichts steht vorher fest: jeder Tag Fleiß mehr gibt 15 % mehr
  Leben und härtere Treffer (so gewünscht: großer Abstand nahezu, aber nie ganz aussichtslos),
  Schaden, Treffer und Ausweichen der Kleidung wirken mit (so gewünscht), beide schlagen je
  Runde zugleich, fallen beide in derselben Runde, ist es unentschieden; Werte zählen dort nicht, eine Haltung
  gibt es nicht mehr; der Kampf wird Runde für Runde gezeigt; die App sagt nur, dass der Fleiß
  am meisten zählt, nicht wie viel, und nach dem Kampf nicht, warum (so gewünscht);
  Ruhm als eigene Währung nur der Arena, geht nie verloren (Kleidung mit Boni, jeden Tag drei
  Stücke, mindestens selten, und Farben für färbbare Kleidung; Titel kommen mit den Rängen aus
  allem verdienten Ruhm, nicht zum Kaufen, so gewünscht); keine echten Übungsdaten sichtbar
- Aushang (so gewünscht, nicht endlos, `js/world/jobs.js`, ein Reiter unter Abenteuer): jeden Tag drei Aufträge,
  ohne Energie, nur Zeit (der Envoy geht an einen Ort, als Aktion seiner Expedition); der Lohn
  steht darauf (ein bestimmtes Kleidungsstück mit Güte oder Bannsplitter, eins von beiden), kein Material; ein
  besonderes Stück kann ab einem Tag auf dem ersten Zettel hängen, bis der Envoy es hat
  (`JOB_FEATURED`, bisher der Steppenrock, gezeichnet von der Tochter der Nutzerin)
- Die Tiefen (so gewünscht, `js/world/depths.js`): unter dem Trümmerfeld, ab dem Lagerfeuer,
  drei Tiefen mit je zehn Ebenen, auf jeder ein Wächter (ein Geist der Welt, so stark wie die
  Ebene); hinabsteigen kostet keine Energie, danach ruht der Envoy (60 Minuten, je Level
  Gelassenheit eine weniger, mindestens 30); Werte und Kleidungsboni entscheiden; ist der
  Wächter zu stark, zieht er sich mit etwas Bannsplittern zurück; je Ebene einmal Bannsplitter,
  oft Kleidung mit Güte (Ebene 5 und 10 sicher)
- Neuigkeiten beim ersten Start einer neuen Fassung (`js/ui/news.js`, im Ton der Nutzerin:
  „Liebe Envoys!“, große Überschriften, ein, zwei Sätze); ein Envoy ohne Alter wird danach
  gefragt, das Fenster lässt sich nicht wegklicken
- Berichte einer Expedition erscheinen nur einmal, auch über Geräte hinweg (Ereignis `gesehen`)
- Hinweis am Tag nach einem ausgelassenen Tageswerk (so gewünscht, `js/ui/daynote.js`): einmal am
  Tag, nur für die Werte, die es morgen etwas kosten würde, wenn die Aufgabe heute wieder liegen
  bleibt; ruhig, ohne Zahl, „Ein Tag Pause kostet nichts.“

Freischaltung: Karte und Quests von Anfang an. Lagerfeuer und Händler über Quests,
Lagerausbau über Hygge.
Talentbaum bei allen vier Stats auf 10 (Inhalt folgt).

## Was in Phase 1 NICHT gebaut wird

- Talentbaum: existiert nur als Rundschild mit Schloss im Menü; Antippen öffnet eine eigene
  Seite, die den Abstand der vier Werte zu Level 10 zeigt, sonst keine Funktion dahinter
- Rundgänge für die anderen Seiten (folgen später)
- Mehrspieler über die Arena hinaus, Freunde, Chat
- Ernährungsmodul
- Weitere Erfolge (etwa „100 km spaziert“) und Freischaltungen über Erfolge: nach dem
  Konzept der Nutzerin; Erfolge für echte Übungen zählen nur Summen, nie Serien
- Lagerstufen über das Steinhäuschen hinaus (der Knopf sagt dort „Weitere Stufen folgen
  später.“)
- Schlafplatz mit Bonus auf Werte: nie. Er gibt Energie (Punkt 4 der Nicht-verhandelbar-
  Liste und das Konzept: Werte steigen nur durch echte Übungen)
- Der Envoy im Bild des Lagers (sitzend, im eigenen Lager-Outfit)
- Endgame: Inhalte reichen vorerst höchstens bis ins gute Midgame, damit Luft nach oben
  bleibt. Wo genau der jetzige Inhalt endet, ist noch offen.

Nicht vorgreifen. Keine Platzhalter-Implementierungen für diese Funktionen bauen,
solange nicht ausdrücklich danach gefragt wird.

## Die vier Stats

| Stat | Tagesaufgabe | Hauptwirkung (so gewünscht, wichtig) | Dazu |
| --- | --- | --- | --- |
| Kraft | Tiefenmuskulatur | Schaden im Kampf | Stein beim Sammeln |
| Ausdauer | Treppe oder im Wechsel Laufen, Knie heben, Ausfallschritte (Spazieren und Rad später über den Talentbaum) | Größe der Energieleiste | Leben im Kampf |
| Beweglichkeit | Stretching, Mobility | Ausweichen | Treffen, Pilzholz beim Sammeln |
| Gelassenheit | Entspannung, Atemübung | Energie füllt sich schneller | Geister beruhigen, kürzere Rast in den Tiefen |

Zeigt man auf einen Wert (Maus darüber, auf Telefon und iPad antippen), steht da, was er bewirkt
(`wirkung` in `STATS`, `js/ui/tips.js`).

Start bei 1, Obergrenze 100.

## Kernformeln

**XP pro Aufgabe:** 14 bis 28, Schnitt 20. Hängt am Umfang, nicht am Bereich: Jede
Übung trägt ihren Anteil bei (Spalte `xp`), die Aufgabe bringt die Summe ihrer Übungen,
bei jeder Mischung der Stufen zwischen 14 und 28. Erfolge können darauf einen Bonus geben (so gewünscht): „Angekommen“
+10 %, gerundet (14 → 15), aber nur in den ersten 15 Minuten nach dem Start. Als Zahl
angezeigt wird der Gewinn nie, nur wofür eine Aufgabe zählt („für Kraft“).

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

**Tagesaufgaben:** Jeder Bereich ist eine Einheit: alle seine Übungen, jeden Tag, in
derselben Reihenfolge (Kraft: Käfer, Vogelhund, Seitstütz; Ausdauer: Treppe;
Beweglichkeit: Katze-Kuh, Brücke, Brustöffner; Gelassenheit:
Innehalten). Übungen einer `gruppe` wechseln sich ab, die App wählt jeden Tag eine, eine Stufe
für alle (so gewünscht: Treppe, Laufen auf der Stelle, Knie heben, Ausfallschritte im Wechsel). Feste Zeit statt Menge, ein geführter Timer mit Stimme, Zeit zum Seitenwechsel, leisem
Klopfen zwischendurch und Tönen, die auch bei dunklem Bildschirm kommen (so gewünscht). Die App entscheidet
die Stufe jeder Übung. Jede Übung wird für sich abgehakt, die letzte erledigt die Aufgabe.
Kinder und Jugendliche haben eigene Einheiten nach Alter (Spalte `alter`, leer =
Erwachsene ab 16): bis 8 Bärengang, Flieger, Froschsprünge; Hampel-Runden (kurze Abschnitte mit Pausen); Baum, Hund,
Kobra; Teddy-Atmen. 9 bis 12 Bärengang, Brett, Flieger; Hampel-Runden; Hund, Kobra,
Schmetterling; Ballon-Atmen. 13 bis 15 Brett, Vogelhund, Seitstütz; Treppe; Hund, Kobra,
Schmetterling; Innehalten. Das Alter kommt aus der Erstellung (Geburtsjahr im Ereignis
`envoy`), ein Envoy ohne Alter gilt als erwachsen.

**Steigerung der Übungsintensität:** je Übung. Hoch nach zwei guten Durchgängen in Folge,
runter nach zwei zu schweren in Folge; gezählt werden Durchgänge, nicht Kalendertage.
Gut oder zu schwer ergibt sich aus der Frage gleich nach der Übung, die nach dem Empfinden
fragt, nicht nach richtiger Ausführung (Kraft und Treppe „Wie war es?“: Locker = gut, Gut
fordernd = zählt nicht, Zu viel = zu schwer; Gelassenheit Ja = gut, Nein = zählt nicht; „Das
war heute zu viel“ = zu schwer für die ganze Einheit). Gefragt wird nur, solange es eine
nächste Stufe gibt. Kinder bis 12 werden nicht gefragt (so gewünscht): Jeder Durchgang
zählt als gut, hoch nach drei. Nach 7 ausgelassenen Tagen in Folge jede Übung des Bereichs
eine Stufe runter. Der Timer begleitet je eine Übung; die nächste beginnt mit eigenem Tipp.

**Krankheitsmodus:** jede Übung auf Stufe 1, Übungen ohne Stufen halbe Zeit, jede
Aufgabe 14 XP, keine Fragen, zählt nicht für die Stufen. Keine Pausenregel für den Malus.

**Energie:** Größe der Leiste = 10 × Ausdauer. Alles, was der Envoy tut, kostet Energie,
eine Energie dauert zehn Sekunden; Wege kosten keine Energie, nur Zeit (zehn Sekunden je
20 Einheiten Entfernung). Jede erledigte Aufgabe des Tageswerks gibt ein Viertel der
Leiste dazu, auch über ihr Ende hinaus (so gewünscht, seit 5.12; vorher eine Minute je
Energie, Wege mit Energie, ein Achtel; ältere Ereignisse behalten diese Regeln, Feld
`regel`, `RULE_SETS` in `js/config.js`). Der Schlafplatz gibt seine Energie um
6 Uhr morgens; ein nachts gebauter zählt am selben Morgen. Das Lagerfeuer (8 Stein, 2 Pilzholz, 2 Energie) muss am
ersten Tag mit den 10 Energie des Starts sicher zu schaffen sein, auch bei den schlechtesten
Würfen und zusammen mit den ersten Handwickeln (2 Energie): 8 Stein höchstens 4 Energie,
2 Pilzholz höchstens 1.

**Sammeln auf dem Trümmerfeld:** je Energie 2 Stück und bis zu 2 weitere (zwei Würfel,
Chance 25 % bei Level 1, +1,5 Punkte je Level von Kraft für Stein, von Beweglichkeit für
Pilzholz, höchstens 90 %). Nie weniger als 2 je Energie, keine Fehlwürfe. Dazu je Energie mit
5 % ein Bannsplitter als Zufallsfund (eigene Würfel; Idee zum Ausprobieren).

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
Hemd, Hose und Handschuhen; seine Icons dazu in `assets/icons/zweite/`). Der Mann trägt
wie die Frau etwas obenherum: ein Unterhemd (`assets/figur/zweite/unterhemd.png`, von der
Nutzerin), direkt über der Basisfigur und unter der Hose, ohne Slot und nicht abzulegen;
in den Einstellungen lässt es sich abschalten (Feld `unterhemd` im Ereignis `envoy`,
`undershirt` in `FIGURES`). Figur und Ausrüstung zeichnet die Nutzerin; keine eigenen
Platzhalter erzeugen. Teile ohne Bild kommen nicht ins Spiel (so gewünscht): kein
Händler, keine Beute, kein Fundstück, keine Quest-Belohnung, bis die Nutzerin sie zeichnet
(`obtainable` in `js/world/clothes.js`); wer eins schon hat, behält es, es wird dann nicht
gezeichnet, als Icon dient das Slot-Symbol. Haut- und Haarfarbe färbt die App im Browser um (`js/ui/look.js`), ebenso
die eigene Farbe eines gefundenen Stücks (Ebene und Icon).

Dateinamen: `slot_name_stufe.png`, Icons mit Präfix `icon_`.

Weitere Bilder: Monster `assets/monster/<id>.png` (512 × 512), Lager
`assets/lager/stufe_<n>_<zeit>.jpg` (1792 × 672; Zeit = morgen, tag, abend, nacht; Stufe 0 =
ohne Feuer, bisher nur tag, die anderen Zeiten tönt die App; Stufe 1 = Lagerfeuer),
Portrait des Envoy
`portrait.png` im Ordner jeder Figur (quadratisch, freigestellt, wird umgefärbt), die Übungen
als bewegte Figuren `assets/uebungen/<id>.svg` (ein Abschnitt mit eigener Bewegung, etwa in den
Hampel-Runden: `<übung>-<abschnitt>.svg`, auf Wunsch der Nutzerin von Claude gezeichnet,
mit `tools/uebungsbilder.py`: Comic-Stil mit Umrisslinie, Hemd in der Farbe des Bereichs, ohne Gesicht; auf der Karte der Aufgabe und im Timer; eine Zeichnung
der Nutzerin im Ordner einer Figur geht vor: `uebungen/<übung>.png` für alle Stufen, `uebungen/<id>.png`
für eine; bisher `innehalten.png` für Gelassenheit, je Figur, freigestellt), Icon einer
Deko `assets/icons/icon_einrichtung_<id>.png` (256 × 256; ohne Bild das Deko-Zeichen),
Ebenen des Lagerbilds (1792 × 672, transparent, von der Nutzerin auf dem Tagesbild an
ihrem Platz gezeichnet und unverändert übernommen): Gebäude `assets/lager/gebaeude_<n>[_<teil>].png`,
Einrichtungen `einrichtung_<id>_<stufe>.png`, Deko `deko_<id>.png` und Ausschnitte aus dem
Bild (Felsen, Feuer, Säulen; ihre Teile in `tools/lager-ausschnitte/`, je Tageszeit
`ausschnitt_<name>_<zeit>.png`). Die Reihenfolge von hinten nach vorn ist die der Nutzerin
und steht als `ORDER` in `tools/lager_ebenen.py` (ein Eintrag kann Bedingungen haben: nur bis
zu einer Lagerstufe, nicht mit einer bestimmten Einrichtung); das Skript macht die Ausschnitte. Neue
Ebenen legt sie durchnummeriert in den Ordner `LagerPNGs` im Testordner auf dem Webspace.
Karte
`assets/welt/karte.jpg` (2400 × 1600, 3:2; von Claude gezeichnet mit `node tools/karte.mjs`, die Orte an
ihren Stellen aus `welt.xlsx`; was nicht ganz auf dem Land liegt, lässt das Skript weg und nennt es).

## Kleiderkammer

Austausch-Datenbank zwischen Nutzerin und Claude für alle Kleidungsteile, eine private
Seite auf claude.ai: https://claude.ai/artifact/92pbHMV3YqemSrC4s86ADj. Sie gehört nicht
zur App und ist für Spieler nicht erreichbar (Zugriffsregel: lesen und schreiben erst
ab `admin`). Quelltext der Seite: `tools/kleiderkammer.html`; Änderungen dort machen und
mit dem Werkzeug `Artifact` unter derselben Adresse neu veröffentlichen.

Lesen und Schreiben mit dem Werkzeug `ArtifactData`, Bilder mit `Artifact`
(`action: read`, `path: <Bild-Id>`). Sammlungen:

- `teile`: eine Zeichnung = ein Eintrag. `nr` ist eindeutig, `name` freiwillig (wenn
  vergeben, ebenfalls eindeutig; ohne Namen heißt ein Teil nach Slot und Nummer); wenn
  die Nutzerin über ein Teil spricht, meint sie diesen Namen oder „Nr. 7“. `figur`
  (`frau` = Figur `erste`, `mann` = `zweite`, `beide` = eine Zeichnung für beide Figuren,
  im Spiel nur in `assets/figur/`, ohne eigene Fassung in `zweite/`), `slot`, `ebene`
  (leer = wie der Slot), `bild` und `icon` (Bild-Ids), `gegenstueck`
  (Eintrag der anderen Figur, bei `beide` leer), `freigabe`, `vorgaben` (ihre Wünsche: `verwendung`,
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
- „XP“ und „Level“ gibt es nur je Stat, nie für den Helden selbst (Punkt 4 oben). Ein Wert
  steht als Zahl mit Punkt und drei Stellen, „1.375“: vorn groß das Level, dahinter klein,
  wie weit es bis zum nächsten ist, nie aufgerundet (`statValue` in `js/formulas.js`).
  Gewinne stehen nicht als Zahl da („+14 Kraft“ wäre neben „Kraft 1.375“ irreführend);
  eine Aufgabe zeigt nur, wofür sie zählt („für Kraft“).
- In der Spielwelt scheitert nichts. Stats bestimmen Zugang, Dauer und Ertrag.
