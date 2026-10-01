# Envoy – Spezifikation

Stand 26.09.2026 · Sandra

Grundlage ist das Dokument „Envoy – Spezifikation Kernmechanik“ vom 19.09.2026,
ergänzt um die Entscheidungen aus zwei Rückmelderunden vom 26.09.2026. Diese Datei ist
die maßgebliche Fassung.
Alle Zahlen stehen im Code an einer Stelle: `js/config.js`.

## Zweck und Grundidee

Die App verbindet zwei Seiten, die sich gegenseitig tragen.

Die **Gesundheits-Seite** ist der eigentliche Zweck: eine gesunde Lebensweise in
machbaren Schritten etablieren. Oberste Priorität ist der Abbau von Widerständen,
nicht Leistungssteigerung. Näher an der 1-%-Methode als an Freeletics.

Die **RPG-Seite** ist die äußere Gaming-Schicht. Ein Held, dessen Werte (Stats)
ausschließlich durch reale gesunde Aufgaben steigen, nie durch Kämpfe. Sie liefert
den unmittelbaren Dopamin-Effekt, den Übungen von sich aus oft nicht haben.

Der Envoy zieht in einer Parallelwelt los, erkundet, sammelt Kleidung und kämpft in
einer waffenlosen Kampfkunst gegen Geister, die als innere Dämonen gelesen werden
können. Die Spielwelt muss groß und umfangreich genug sein, um nicht als Belohnung,
sondern als Kernelement verstanden zu werden. Die Verbesserung des Envoy durch
eigene echte Übungen aber alternativlos.

Look eines modernen, professionellen RPGs mit Held (Envoy) im Mittelpunkt. Matt, eine
Mischung aus organisch und steinig: dunkles Petrol wie verwitterter Stein, Elfenbein,
gebranntes Orange (es stammt aus den Riesenpilzen) und ein staubiges Taubenblau. Feine
Adern wie in Blättern oder altem Stein liegen über der Körnung. Kein Braun, kein Sepia.
Symbole sind Embleme wie in Stein gehauen, keine flachen App-Symbole.

## Die vier Stats

Alle vier starten bei 1, Obergrenze 100. Der Held sammelt keine allgemeine
Erfahrung: es gibt kein Helden-XP und kein Heldenlevel. XP existiert nur pro Stat.

| Stat | Reale Entsprechung | Rolle in der Welt |
| --- | --- | --- |
| Kraft | Tiefenmuskulatur, Rumpf | Schaden je Treffer, Zugang, schnelleres Arbeiten und mehr Ertrag beim Sammeln |
| Ausdauer | Spazieren, Treppe, Rad | Leben im Kampf (tiefer in Höhlen), Größe der Energieleiste (10 Energie je Level), kürzere Wege |
| Beweglichkeit | Dehnen, Mobility | Treffer- und Ausweichchance, Zugang zu schwierigem Gelände |
| Gelassenheit | Atemübungen, Entspannung | Füllgeschwindigkeit der Energie, Geister beruhigen, Zugang zu stillen Orten |

## Tagesaufgaben

Jeden Tag gibt die App genau vier Aufgaben(päckchen) vor, eine je Bereich. Sie sind
**nicht auswählbar**.

| Bereich | Stat | Beispiele |
| --- | --- | --- |
| Tiefenmuskulatur | Kraft | Beckenboden, Rumpfstabilität |
| Stretching / Mobility | Beweglichkeit | Strecken, Fuß im Sitzen aufs Knie |
| Ausdauer | Ausdauer | 10 / 20 / 30 Minuten spazieren, Treppe, Rad |
| Entspannung | Gelassenheit | 3 Minuten Atemübung, Augen schließen |

### Auswahl der Übung

1. Übungen der aktuellen Intensitätsstufe des Bereichs. Gibt es dort keine, gilt die
   nächstniedrigere vorhandene.
2. Nicht dieselbe Übung wie gestern, sofern es eine andere gibt.
3. Nicht dieselbe Muskelgruppe (bei Beweglichkeit: Körperregion) wie gestern, sofern
   es eine andere gibt.
4. Von den übrigen die, die am längsten nicht dran war.
5. Gleichstand entscheidet eine aus dem Datum abgeleitete Zahl, damit alle Geräte
   dieselbe Übung zeigen.

Einmal zugeteilt, bleibt die Übung für den Tag. Nur der Krankheitsmodus teilt offene
Aufgaben neu zu.

### Messwerte und Rückfrage

Werte werden nicht freiwillig erfasst. Entweder eine Übung hat einen Messwert, dann ist
er Pflicht, oder sie hat keinen.

- **Mit Messwert** (z. B. „15 Minuten spazieren“ → Strecke, „7 Minuten Treppe“ →
  Stockwerke, „Unterarmstütz so lange es angenehm geht“ → längste Haltezeit): Nach
  „Erledigt“ wird genau dieser Wert eingetragen. Er wird mit einem Ziel verglichen,
  das nie angezeigt wird. Ab 90 % des Ziels zählt der Durchgang als erfolgreich,
  unter 70 % als zu schwer, dazwischen als keins von beiden.
- **Ohne Messwert:** Ein Tippen genügt. „Wie war es?“ (Leicht / Passend / Zu viel)
  wird nur gefragt, wenn die Übung zum ersten Mal dran ist oder sich die
  Intensitätsstufe des Bereichs gerade geändert hat.

Die Ziele sind großzügig gesetzt (Spazieren: 3,5 km/h, Rad: 12 km/h, Treppe: ein
Stockwerk pro Minute), damit ruhiges Gehen als erfolgreich zählt.

Gesammelte Strecken und Stockwerke fließen zusätzlich in die Welt ein
(„kumulierte reale Leistung“, siehe Quests).

### Steigerung der Übungsintensität

- Hoch nach drei erfolgreichen Durchgängen in Folge, runter schon nach zwei zu
  schweren. Langsam hoch, schnell runter. Ein Durchgang „keins von beiden“ beginnt die
  Zählung neu.
- Nach 7 ausgelassenen Tagen in Folge geht die Intensität eine Stufe runter (nach 14
  Tagen noch eine usw.), damit der Wiedereinstieg leicht ist.
- Die neue Stufe gilt ab dem nächsten Tag. Sie wird nirgends als Zahl angezeigt.

### Krankheitsmodus

Es gibt keine Pausenregel für den Malus: Die Grundaufgaben sind absichtlich so
niedrigschwellig, dass sie auch bei kleiner Krankheit machbar sind. Der
Krankheitsmodus (Schalter auf der Tageswerk-Seite) verlegt die Aufgaben auf die niedrigste
Stufe. Die XP sinken dabei von selbst, weil die Übungen kleiner sind (14 statt bis zu
28). Durchgänge im Krankheitsmodus zählen nicht für die Intensität. Der Modus bleibt
an, bis er ausgeschaltet wird.

## XP und Levelkurve

Jede erledigte Tagesaufgabe gibt XP auf ihren Stat. Der Stat steigt eine Stufe,
sobald die XP-Leiste voll ist.

**XP pro Übung: 14 bis 28, Schnitt 20.** Die Höhe hängt am Umfang der konkreten
Übung, nicht am Bereich. 10 Minuten spazieren = 14, 20 Minuten = 20, 30 Minuten = 28.

```latex
\text{XP}(n \rightarrow n+1) = 45 \cdot n^{0{,}45} \cdot \left(1 + \left(\frac{\max(0,\; n-9)}{6}\right)^{2}\right)
```

Auf ganze XP gerundet. Bis Level 10 wirkt nur der erste Teil, die Kurve läuft flach.
Ab Level 10 zieht sie an.

| Level | XP bis zum nächsten |
| --- | --- |
| 1 → 2 | 45 |
| 2 → 3 | 61 |
| 5 → 6 | 93 |
| 9 → 10 | 121 |
| 10 → 11 | 130 |
| 15 → 16 | 304 |
| 20 → 21 | 756 |
| 25 → 26 | 1554 |
| 30 → 31 | 2755 |

Summe bis Level 10: 802 XP.

### Plateau

Die Kurve erzeugt das Plateau von selbst: Mit den Grundübungen (höchstens 28 XP am
Tag) ist Level 10 nach 4 bis 6 Wochen erreicht, Level 15 nach gut 2 Monaten, Level 20
nach 5 Monaten; danach dauert jedes Level rund 2 Monate. Wer weiter will, braucht die
höherwertigen Übungen des Talentbaums. Gelegentliche Fehltage mit Malus halten den
Wert zusätzlich in einem Gleichgewicht.

### Anzeige

Unter jedem Stat steht der Fortschritt als Zahl (z. B. 4 / 45), darüber ein Balken.
Gewinne stehen mit dem Namen ihres Stats: „+14 Kraft“, ein Abzug „Pause · −5 Kraft“.
So ist sofort sichtbar, welcher Stat wächst. „XP“ darf in der Oberfläche stehen, aber nur
für einen Stat (etwa „noch 30 XP bis Level 2“ an den Ringen), nie für den Helden selbst:
Es gibt kein Helden-XP und kein Heldenlevel, nur XP und Level je Stat.

## Malus bei Nichterledigung

Die Regel gilt pro Stat und pro Tag, an dem die zugehörige Tagesaufgabe weder
erledigt noch (ab Phase 2) durch eine Talentübung desselben Bereichs ersetzt wurde.

| Tag | Wirkung |
| --- | --- |
| 1 | kein Zuwachs, kein Abzug |
| 2 bis 7 | Malus = 0,25 × durchschnittlicher Tagesgewinn |
| ab Tag 8 | Malus = 1,0 × durchschnittlicher Tagesgewinn |

**Bezugsgröße.** Der durchschnittliche XP-Gewinn dieses Stats über die letzten
sieben aktiven Tage (Tage, an denen die Aufgabe erledigt wurde). Gibt es noch keine
sieben, zählen die vorhandenen; gibt es keinen, ist der Malus 0. Auf ganze XP gerundet.

**Einheitlicher Faktor für alle vier Stats.**

**Der Stat kann sinken.** Läuft die XP-Leiste leer, fällt der Stat eine Stufe und die
Leiste läuft dort weiter rückwärts.

**Bodensatz: 60 % des jemals höchsten erreichten Levels**, als Level mit
Nachkommastelle: 60 % von 3 = 1,8, also Level 1 mit zu 80 % gefüllter Leiste. Wer 30
erreicht hat, fällt nie unter 18. **Untergrenze:** Level 1, 0 XP.

Die Anzeige nennt ausgelassene Tage „Pause“, mit dem Abzug (z. B. „−5 Kraft“).

### Tagesgrenze

Ein Tag beginnt um 3:00 Uhr Ortszeit. Ein Tag gilt als abgeschlossen, sobald der
nächste beginnt; erst dann greift der Malus.

## Talentbaum (Phase 2)

Im Menü als Schild mit Schloss. Antippen zeigt nur, wie weit die vier Werte noch von
Level 10 entfernt sind; eine Funktion steht noch nicht dahinter. **Freischaltung: alle
vier Stats auf Level 10.** Fällt ein Stat wieder unter 10, schließt sich der Baum.

Der Aufbau (Netz aus Knoten, Stufen innerhalb eines Knotens, Plateau je Stufe,
Durchlässigkeit ab 3/5, Meisterung, Ersetzen der Tagesaufgabe) bleibt wie im
Ausgangsdokument beschrieben und wird in Phase 2 umgesetzt.

| Stat | Form | Begründung |
| --- | --- | --- |
| Kraft | verzweigt | Bewegungsmuster bauen aufeinander auf |
| Ausdauer | parallele Wege | Modalitäten sind austauschbar |
| Beweglichkeit | verzweigt nach Körperregion | Spezialisierungsäste: Yoga, Animal-like, Mobility |
| Gelassenheit | schmal und tief | Meditation wird länger und tiefer, nicht breiter |

## Ausrüstung

**Ausrüstung erhöht nie Stats.** Sie stellt Voraussetzungen und gibt Fähigkeiten:

| Effekt | Wirkung |
| --- | --- |
| schaden | mehr Schaden je Treffer |
| treffer | Trefferchance in Prozentpunkten |
| ausweichen | Ausweichchance in Prozentpunkten |
| beruhigen | Chance, einen Geist zu beruhigen |
| reise | weniger Energie je Weg (mindestens 1), damit auch kürzer unterwegs |
| erholung | Energie füllt sich schneller |
| glueck | mehr Bannsplitter und öfter ein Fundstück |

**Sechs Slots:** Kopf, Torso, Handwickel, Accessoire, Beinkleidung, Schuhe. Kein
Waffen-Slot, kein Gürtel, keine Schulterstücke. Die **Handwickel** sind das Gegenstück
zur Waffe: Wickelbandagen der Kampfkunst, sie tragen den Schadensbonus. Das
**Accessoire** ist der Platz für Besonderes: ein Umhang, ein Schal, eine Tasche (früher
hieß er Umhang; alte Kennungen beginnen noch mit `umhang_`).

**Voraussetzung.** Jedes Teil verlangt Mindestwerte in einem oder mehreren Stats.
**Bei Unterschreitung** fliegt das Teil nach Tagesende aus dem Slot, liegt danach im
Rucksack und wird nicht mehr gezeichnet. Das Charakterfenster zeigt, was abgelegt wurde
und warum.

## Spielwelt

Die Zwischenwelt ist steinig, trümmerhaft und ätherisch: Geröll, umgestürzte Säulen,
Riesenpilze, Nebel. Regionen: Trümmerebene, Nebelmark, Grenzland, Aschenland, Nordland.

### Grundsatz: nichts scheitert

Scheitern spielt keine Rolle. Die Stats entscheiden, **ob** eine Quest überhaupt offen
ist (Voraussetzung), **wie lange** sie dauert und **wie viel** sie bringt. Wer eine
Quest beginnen kann, bringt immer etwas zurück.

### Expeditionen in Echtzeit

Jede Unternehmung ist eine Expedition vom Lager aus: Hinweg, die Arbeit vor Ort,
Rückweg. Alle drei Teile dauern echte Minuten; eine dreiteilige Leiste zeigt, wo der
Envoy gerade ist und wann die Expedition endet. Auf der Karte wandert seine Marke den Weg
entlang. Es läuft immer nur eine Expedition.

**Zeit folgt Energie: Jede Energie ist eine Minute unterwegs.** Was lange dauert,
kostet entsprechend viel Energie; was wenig kostet, geht schnell. Die Spanne reicht von
drei Minuten (etwas auflesen gleich neben dem Lager) bis weit über eine Stunde (eine
Nacht am Mondsee, bis zum Horizont). Lange Quests brauchen eine lange Leiste und damit
den Wert Ausdauer. Die Leiste begrenzt, wie viel an einem Stück geht; ist sie leer, ist
Pause. (Der Begriff „Energie“ steht für das, was verbraucht wird; „Ausdauer“ bleibt der
Wert. Im Code heißt die Energie weiter `stamina`.)

- **Weg** (je Richtung) = Entfernung ÷ 20 Energie, gerundet, mindestens 1. Mit jedem
  Level Ausdauer 3 % kürzer, höchstens auf die Hälfte. Stiefel und Umhänge können ihn
  billiger machen, ein überfüllter Rucksack verteuert jeden Weg um 1. Die Karte ist
  1,5-mal so breit wie hoch, das fließt in die Entfernung ein. Am Lager selbst gibt es
  keinen Weg.
- **Vor Ort** = die Kosten aus der Tabelle. Bei Sammeln, Erkunden und Bauen macht jedes
  Level der unter „Tempo“ genannten Stats die Arbeit 4 % kürzer und damit billiger,
  höchstens auf die Hälfte. Kämpfe dauern so lange, wie die Tabelle sagt, gleich wie
  viele Runden sie gehen.
- **Energie** der Expedition = 2 × Weg + vor Ort, **Dauer** = ebenso viele Minuten.
- Das Ergebnis wird beim Aufbruch berechnet und als Ereignis gespeichert, zählt aber
  erst, wenn der Envoy zurück ist. Material zum Bauen wird gleich mitgenommen.
- Zurück im Lager erscheint einmal ein Bericht: Kämpfe, Mitgebrachtes, Neues im
  Kompendium, bei zu wenig Platz auch, was liegen blieb.

Vor dem Aufbruch zeigt jede Quest: Voraussetzung (erfüllt oder nicht), Dauer mit
Hinweg, vor Ort und Rückweg, Energie, welche Stats sie kürzer machen, welche den
Ertrag erhöhen, und den möglichen Ertrag. Reicht die Energie gerade nicht, steht dort,
wann sie reicht. Ist die Leiste insgesamt zu kurz, steht dort, dass sie mit Ausdauer
wächst.

### Energie

- Größe = 10 × Ausdauer (10 bei Level 1, 100 bei Level 10). Eine Kerbe je Punkt, auf
  einer langen Leiste je 5, 10 oder 20.
- Sie füllt sich in etwa 8 Stunden, schneller mit Gelassenheit (+3 % je Level) und
  Erholung aus der Ausrüstung.
- Die erledigte Gelassenheits-Aufgabe ist eine echte Rast: +50 % der Leiste.
- Der **Schlafplatz** gibt dem Envoy jeden Morgen (ab 3 Uhr, mit dem neuen Tag) einmal
  Energie dazu, über das Ende der Leiste hinaus: bei 10 Energie wären es 12 von 10. Der
  Zusatz wird verbraucht, bevor die Leiste unter ihr Ende sinkt; während des Tages füllt
  sich die Leiste nur bis zum normalen Ende. Erst am nächsten Morgen kommt er wieder. Die
  Leiste zeigt den Zusatz als kupferfarbenes Ende. (Der Schlafplatz gibt Energie, keine
  Werte: Werte steigen nur durch die echten Aufgaben.)

### Quests

Quests stehen an festen Orten. Arten:

| Art | Was geschieht | Was die Stats bewirken |
| --- | --- | --- |
| Sammeln | Pilzholz oder Stein | +5 % Stücke je Level der Ertrag-Stats, kürzer mit den Tempo-Stats |
| Erkunden | feste Belohnung, oft Bannsplitter | +5 % Bannsplitter je Level der Ertrag-Stats, kürzer mit den Tempo-Stats |
| Bauen | verbraucht Pilzholz und Stein, schaltet frei | kürzer mit den Tempo-Stats |
| Kampf | ein Geist | siehe Kampf |
| Höhle | mehrere Geister nacheinander | so viele, wie die Kraft des Envoy reicht |

Voraussetzungen: Mindestwerte in Stats, erledigte Quests oder reale Leistung (Summe
echter Kilometer oder Stockwerke aus den Tagesaufgaben). Manche Quests sind
wiederholbar, mit Abklingzeit in Tagen.

Ein Bonus wird bei kleinen Mengen zufällig auf- oder abgerundet: 1 Stück mit +30 %
ergibt in drei von zehn Fällen 2. So lohnt er sich auch bei kurzen Quests.

**Sammeln auf dem Trümmerfeld.** Direkt am Lager, ohne Weg, kann der Envoy immer Steine
und Pilzholz sammeln (zwei Quests, die es immer gibt). Man wählt, ob er bis zu einer
Menge sammelt oder bis die Energie reicht; die Arbeit läuft in echter Zeit weiter, auch
wenn die App zu ist. Was er mitbringt, wird gewürfelt, aber nie schlecht:

- Je Energie (also je Minute) bringt er **2 Stück** und dazu bis zu **2 weitere**: zwei
  Würfel, jeder gelingt mit einer Chance und bringt dann 1 Stück mehr. Bei Level 1 ist
  die Chance 25 % (im Schnitt 2,5 Stück je Energie, selten 4), sie steigt mit jedem
  Level um 1,5 Punkte, höchstens auf 90 %. Weniger als 2 Stück je Energie gibt es nie,
  Fehlwürfe gibt es nicht.
- **Stein** hängt an Kraft, **Pilzholz** an Beweglichkeit. Ein Erfolg-Bonus („Angekommen“)
  erhöht die Chance.
- „Bis zu einer Menge“ bringt genau diese Menge (was beim letzten Wurf übrig wäre,
  bleibt liegen), „bis die Energie reicht“ so viel, wie in den Rucksack passt. Vor dem
  Start steht: Vorrat („0 / 10 Stein“), Dauer („etwa 3 Min., höchstens 4“), Ertrag je
  Energie. Ist kein Platz mehr, steht dort: „Dein Envoy kann nicht mehr als 10 Stein
  tragen.“
- **Sicher am ersten Tag:** Das Lagerfeuer (8 Stein, 2 Pilzholz, 2 Energie) ist mit den
  10 Energie des Starts immer zu schaffen: 8 Stein kosten höchstens 4 Energie (4 × 2
  Stück), 2 Pilzholz höchstens 1, dazu 2 zum Bauen. Das sind höchstens 7 von 10, es
  bleibt Luft, auch bei schlechtesten Würfen.

**Weitere Sammelorte.** Am Pilzhain und im Steinbruch gibt es noch je drei Quests (1,
6 und 20 Energie vor Ort, bei Kraft-Voraussetzung für die lange) mit festem Ertrag
und Weg. Neben dem Trümmerfeld sind sie vorerst die schwächere Wahl; wie sie
weiterwachsen, plant die Nutzerin. Bannsplitter lassen sich im Uferkies am Stillen Ufer
sammeln (1 Stück). Wiederholbare lange Quests (Wache an der Furt, Eine Nacht am
Mondsee, Bis zum Horizont) bringen mehr Bannsplitter, dauern aber 40 bis 90 Minuten vor
Ort und haben eine Abklingzeit.

**Tempo der Wirtschaft.** Die Erträge sind bewusst klein, damit schnelle Quests nicht
alles in wenigen Tagen öffnen. Die Quests der Welt bleiben an die Werte und an echte
Kilometer und Stockwerke gebunden. Der Start ist bewusst eng (10 Energie, 10 Stück
tragbar); es ist leichter, später etwas zu vereinfachen, als es nachträglich
schwerer zu machen.

**Begegnungen:** Jeden Tag erscheinen an wilden Orten Geister (je Ort 55 % Chance,
mindestens eine an einem von Anfang an offenen Ort). Welcher Geist kommt, richtet sich
nach der Stärke des Helden (Durchschnitt der Stats zu Tagesbeginn): meist gleich stark,
manchmal eine Stufe darüber. Eine Begegnung kostet 3 Ausdauer vor Ort plus Wege. Das Lager listet die Geister des Tages.

### Kampf

Bis zu 12 Runden, gerechnet beim Aufbruch:

- Leben des Helden = 8 + 3 × Ausdauer
- Schaden je Treffer = 1 + 0,6 × Kraft (gerundet) + 0 bis 2 + Handwickel
- Trefferchance = 65 % + 4 % je Level Beweglichkeit über der Gewandtheit des Geistes
- Ausweichen = 8 % + 3 % je Level Beweglichkeit über der Gewandtheit des Geistes
- Beruhigen (nur manche Geister) = 4 % + 4 % je Level Gelassenheit über der Stufe des
  Geistes, jede Runde zuerst geprüft
- Der Geist trifft in 75 % der Runden, Schaden = seine Kraft + 0 bis 1

Drei Ausgänge, keiner davon ist eine Niederlage:

| Ausgang | Beute |
| --- | --- |
| besiegt | Bannsplitter und Material, Chance auf ein Fundstück |
| beruhigt | 1,5-mal so viele Bannsplitter, Chance auf ein Fundstück |
| vertrieben (der Geist war zu stark, der Envoy zieht sich zurück) | die Hälfte, kein Fundstück |

**Höhlen:** Die Geister kommen nacheinander, das Leben des Envoy bleibt dabei, wie es
ist. Vor jedem weiteren Geist kehrt er um, wenn weniger als 35 % seines Lebens übrig
sind; ein Geist, der ihn vertreibt, beendet die Höhle ebenfalls. Jeder überwundene Geist
bringt seine Beute, die feste Belohnung der Höhle gibt es erst, wenn alle überwunden
sind. Vorher zeigt die Quest, wie viele Geister der Envoy mit den jetzigen Werten etwa
schafft.

Spielverluste kosten nie zusätzliche reale Aufgaben; das Schlimmste, was passiert,
ist weniger Beute.

### Beute und Währung

- **Bannsplitter**: was zurückbleibt, wenn ein Geist gebannt ist, ob besiegt, beruhigt
  oder vertrieben. Blass leuchtend. Einzige Währung.
- **Pilzholz**: die Stiele der Riesenpilze, die zwischen den Trümmern wachsen, mit
  orangefarbenen Hüten. Leicht und zäh, lässt sich sägen und schnitzen wie Holz; für
  Balken, Dächer, Brücken, Möbel.
- **Stein**: Blöcke aus den alten Ruinen, für Mauern.
- Ausrüstung und Einrichtung: feste Quest-Belohnungen oder mit einer Chance je Geist.
  Beute-Ausrüstung liegt in der Nähe der Stärke des Helden (±3 Level).
- Glück erhöht Bannsplitter und die Chance auf Fundstücke.

### Händler

Wird durch die Quest „Der Händler im Nebel“ freigeschaltet (den Händler retten).
Bietet jeden Tag 5 Dinge an, darunter 1 bis 2 Einrichtungsgegenstände. Die
Ausrüstung ist zufällig, aber immer im Bereich der Stärke des Helden (Voraussetzung
höchstens 3 Level darunter oder darüber). Preis in Bannsplittern = 12 + 4 × n + n² + 8 × Stufe
(n = höchste Voraussetzung), falls in der Tabelle nicht anders angegeben. Er kauft
alles für ein Drittel des Preises zurück.

### Rucksack, Material und Aufbewahrung

Der Rucksack hat von Anfang an **5 Plätze** und der Envoy hat ihn immer bei sich.
Getragenes zählt nicht mit. Das Startoutfit (Leinenhemd, Leinenhose, Bastsandalen,
Handwickel) trägt er von Anfang an, der Rucksack ist am Start leer.

**Pilzholz und Stein belegen Plätze:** Ein Platz fasst **2 Stück einer Art**. Mit leerem
Rucksack trägt der Envoy also 10 Stück, und genau das braucht das erste Lagerfeuer
(8 Stein = 4 Plätze, 2 Pilzholz = 1 Platz). Bannsplitter belegen keinen Platz. Mehr, als
er tragen kann, lässt der Envoy liegen; der Bericht nennt es. (Später kann Kraft die
Platzgröße erhöhen; nicht gebaut.)

**Das Lager nimmt ab:** Ein **Steinlager** oder **Pilzlager** (siehe Das Lager) nimmt
auf, was der Envoy heimbringt, bis es voll ist (Stufe 1: je 20 Stück); erst was dort
nicht mehr Platz hat, bleibt im Rucksack. Der Vorrat zeigt, wie viel von jeder Art
insgesamt noch hineinpasst („8 / 10“, mit Lager z. B. „8 / 30“). Gebaut wird aus dem
Vorrat insgesamt.

Die **Aufbewahrung** ist eine Einrichtung des Lagers und gibt Plätze für Gegenstände und
Kleidung (Stufe 1: 6), zusätzlich zum Rucksack. Sie steht im Lager, dem Ausgangspunkt
jeder Expedition. Neues landet im Rucksack, ist der voll in der Aufbewahrung, ist auch
die voll oder der Envoy unterwegs, wird der Rucksack überfüllt (nichts geht verloren,
aber jeder Weg kostet 1 mehr).

**Unterwegs** (solange eine Expedition läuft) lässt sich in die Aufbewahrung nur
hineinschauen, als erinnere sich der Envoy: ihre Teile sind ausgegraut. Nichts lässt
sich daraus anlegen, hineinlegen, herausnehmen, verkaufen oder liegen lassen. Das geht
erst, wenn der Envoy zurück im Lager ist. Rucksackplätze dagegen sind immer nutzbar.
Was unterwegs abgelegt wird, kommt in den Rucksack.

Das Charakterblatt zeigt unter der Figur (auf dem iPad rechts oben) eine Inventar-Box:
Reiter „Rucksack“ mit seinen fünf Plätzen (Material als Stapel mit Menge) und, sobald es
sie gibt, Reiter „Aufbewahrung“. „Alle“ öffnet die Seite Inventar mit Suche, Filter nach
Slot und Sortierung (Slot, Stufe, Name, Neueste) und dem Getragenen.

### Das Lager

Das Lager liegt auf dem Trümmerfeld. Es hat eine **Stufe**: Stufe 0 ist der offene
Platz, **Stufe 1 „Lagerfeuer“**. Die erste Quest des Spiels ist „Ein Lagerfeuer
errichten“ (8 Stein, 2 Pilzholz, 2 Energie). Sie ersetzt „Ein Platz zum Bleiben“. Sie ist
zugleich der Schluss der Führung durch Abenteuer (siehe Rundgänge). Ist das Feuer
errichtet, hat das Lager Stufe 1, das Bild zeigt das Feuer, und das Lager kann
eingerichtet werden.

**Vier Einrichtungen**, jede in Stufen (Blatt `Einrichtungen` in `welt.xlsx`), jede ein
Bauen-Quest am Lager aus Material und Energie. Auf Lagerstufe 1 lassen sich alle vier
auf ihre Stufe 1 errichten, nicht weiter ausbauen; die nächste Stufe einer Einrichtung
gibt es erst, wenn das ganze Lager die nächste Stufe hat.

| Einrichtung | Kosten Stufe 1 | Wirkung Stufe 1 | Hygge |
| --- | --- | --- | --- |
| Steinlager | 4 Pilzholz, 2 Energie | fasst 20 Steine | 10 |
| Pilzlager | 4 Pilzholz, 2 Energie | fasst 20 Pilzholz | 10 |
| Aufbewahrung | 4 Pilzholz, 4 Stein, 3 Energie | 6 Plätze für Gegenstände und Kleidung | 10 |
| Schlafplatz | 6 Pilzholz, 3 Energie | morgens 20 % der Energieleiste zusätzlich, einmal am Tag | 10 |

**Hygge:** Jede Einrichtung hat einen Hyggewert, je höher ihre Stufe, desto höher. Das
Lager hat die Summe. Das Lager kann erst auf die nächste Stufe ausgebaut werden, wenn
sein Hygge reicht; für Stufe 1 auf 2 verlangt es 30, die Summe von drei der vier
Einrichtungen auf Stufe 1. Die höchsten Hyggewerte bringt später die Deko (erst ab
Lagerstufe 2). Spätere Stufen regelt die Nutzerin, wenn es so weit ist. Der Ausbau
selbst ist **noch nicht gebaut**: Das Lager zeigt Hygge „20 / 30“ und, wenn es reicht,
dass der Ausbau mit einem späteren Update folgt; einen Knopf „Lager verbessern“ gibt
es nicht. Deko wird nicht gesammelt (das Blatt `Deko` in `welt.xlsx` ist vorbereitet).

Der Schlafplatz wirkt auf die Energie (siehe Energie). Ein Bonus auf Kraft wäre ein Bonus
auf einen Wert und widerspricht dem Konzept: Werte steigen nur durch echte Übungen.

### Kompendium

Steht im Handbuch: zuerst das Verzeichnis aller Geister (so viele Seiten, wie das Fenster
fasst), noch nicht getroffene als dunkle Silhouette mit Stufe; dann für jeden getroffenen
eine eigene Seite mit Bild, Beschreibung, Werten, Orten und Zählern (Begegnungen,
besiegt, beruhigt, vertrieben, zuerst gesehen), kompakt, damit sie ohne Scrollen passt.

### Freischaltungen

| Was | Wann |
| --- | --- |
| Karte, Quests, Begegnungen, Rucksack, Handbuch | von Anfang an |
| Lagerstufe 1, die vier Einrichtungen | Quest „Ein Lagerfeuer errichten“ (die erste Quest) |
| Händler | Quest „Der Händler im Nebel“ |
| Aschenhang, Turm der Stufen, lange Straße | Quest „Die Brücke über die Schlucht“ |
| Weißes Tal | Quest „Die lange Straße“ (30 km reale Strecke) |
| Talentbaum | alle vier Stats auf 10 (Inhalt Phase 2) |

## Menü und Ansichten

**Unten** ein Sims aus Stein mit einer Kupferleiste; die fünf Menüpunkte sind runde
Schilde (Kupferrand, Fläche aus Stein mit feinen Adern, das Emblem eingehauen; der
gewählte Schild hell wie Elfenbein), die zur Hälfte über den Sims ragen: **Abenteuer**,
**Talentbaum**, in der Mitte größer das **Lager**, **Händler**, **Handbuch**. Noch
verschlossene Bereiche tragen ein rundes, helles Silberschloss. Ist hinter einem
Menüpunkt etwas Neues (ein Bericht einer Expedition, ein neues Kapitel der Anleitung),
glüht sein Kupferrand pulsierend auf; öffnet man den Bereich, erlischt das Glühen.

**Oben** eine Leiste über jeder Ansicht (auch Envoy und Handbuch; nicht beim Erstellen
des Envoy):

- links das runde **Portrait** des Envoy, groß (120 px am Telefon, 168 px am iPad) und
  aus der Leiste in die Seite hängend; Überschriften rücken daneben, das Lagerbild
  reicht darunter. Von der Nutzerin gezeichnet, in Haut- und Haarfarbe umgefärbt wie die
  Figur. Es bleibt auch auf der Envoy-Seite; ein Antippen dort lässt die Seite, wie sie
  ist. Um das Portrait liegen vier dünne Ringe, innen
  Kraft, dann Ausdauer, Beweglichkeit, Gelassenheit, jeder in seiner Farbe. Ein Ring
  füllt sich auf dem Weg zum nächsten Level; ist er voll, steigt der Wert. Zeigen
  (Maus) oder Berühren (Touch) eines Rings nennt Level und Rest („Kraft · Level 1 ·
  noch 30 XP bis Level 2“); ein Antippen des Rings tut sonst nichts. Das Portrait öffnet
  den Envoy.
- in der Mitte das **Tageswerk** als großer Knopf in dunklem Stein wie Sims und Boxen,
  mit „2 / 4“. Solange Aufgaben offen sind, pulsiert ein großer oranger Schimmer um ihn;
  ist alles erledigt, ruht er: niedriger als der offene Knopf, ohne Glühen und ohne helle
  Kante, mit dem Emblem der App und dem Schriftzug „ENVOY“ nebeneinander (so von der
  Nutzerin vorerst gewählt; zur Wahl standen auch Schriftzug über dem Emblem, nur
  Emblem, nur Schriftzug). Er führt immer zur Tageswerk-Seite.
- rechts die **Einstellungen** (Zahnrad).

- **Lager** (Startansicht): das Bild des Lagers nach Stufe und Tageszeit (einmal soll dort
  der Envoy sitzen, wenn er da ist), ob der Envoy da oder unterwegs ist, die Stufe
  („Stufe 1 · Lagerfeuer“). Solange es kein Feuer gibt, steht oben „Als Erstes“: „Dein
  Envoy wird eine Weile hier bleiben. Am besten errichtest du ein Lagerfeuer.“ mit einem
  Knopf zur Quest. Dann laufende Expedition oder Bericht, Vorrat mit Energie, die
  Einrichtungen mit Hygge (je Einrichtung: Wirkung, Kosten, „Errichten“, bei Mangel was
  fehlt oder wann die Energie reicht) und heute gesichtete Geister, Hinweise.
  **Tageszeit:** Das Bild folgt der Sonne am Ort des Lagers (Mitte Deutschlands, aus
  Datum und Uhrzeit berechnet, auf Minuten genau genug): Sonnenaufgang (von 40 Minuten
  vor bis 80 Minuten nach dem Aufgang), Tag, Sonnenuntergang (von 90 Minuten vor bis 40
  nach dem Untergang), Nacht. Ohne Feuer gibt es bisher nur das Tagesbild; zu anderen
  Zeiten wird es dunkler oder wärmer getönt, bis die Nutzerin Bilder dafür hat.
- **Tageswerk**: die vier Aufgaben als schmale Zeilen mit dem Gewinn („+15 Kraft“) und
  einem Haken zum Erledigen. Antippen klappt eine Aufgabe auf (Timer, Erledigt); die
  Anleitung erscheint nur auf Wunsch. Ein Fragezeichen klappt eine kurze Erklärung auf
  (wozu das Tageswerk da ist, dass Werte bei liegengebliebenen Aufgaben langsam sinken,
  aber nie ganz verloren gehen) mit Verweis ins Handbuch. Läuft ein befristeter Bonus,
  steht er mit seinem Ende in einer Zeile darüber. Ist alles erledigt, steht oben
  „Das Tageswerk ist erledigt.“ und ein Ausblick auf die vier Übungen von morgen.
- **Timer**: Ring mit Restzeit, bei Übungen mit Atemtakt ein Kreis, der wächst und
  schrumpft. Solange die Zeit läuft, spielt ein ruhiger Klang: leises Rauschen wie
  Wellen, ein tiefer Akkord, ab und zu eine Klangschale. Mit Atemtakt kommen und gehen
  die Wellen mit dem Atem. Am Ende verklingt der Hintergrund und ein Ton sagt, dass die
  Zeit um ist. Der Klang lässt sich im Timer abschalten; die Wahl bleibt gespeichert.
  Alles wird im Browser erzeugt, es gibt keine Tondateien.
- **Abenteuer**: gezeichnete Landkarte mit Tintensiegeln für die Orte, Legende, Vorrat
  und Expedition. Keine unerklärten Zahlen auf der Karte.
- **Envoy**: das Charakterblatt (siehe unten), mit Rucksack und oberer Leiste. Nach dem
  ersten Erstellen eines Envoy beginnt das Spiel hier, nicht im Lager; dort läuft der
  Rundgang (siehe unten). Jeder spätere Start ist im Lager.
- **Talentbaum**: eine eigene Seite (nicht ein Fenster über der alten Ansicht): das Schild
  mit Schloss und der Abstand der vier Werte zu Level 10.
- **Handbuch**: ein Buch mit Papierseiten, orangen Reitern an der Oberkante und
  umgeknickten Ecken unten zum Blättern (Wischen und Pfeiltasten gehen auch). Hinter dem
  letzten Blatt eines Reiters geht es mit dem nächsten Reiter weiter. Das Buch hat die
  Höhe des Fensters (höchstens 680 px), scrollt nicht und zeigt unten die Kante des
  Seitenstapels. Lange Listen teilen sich auf so viele Seiten, wie das Fenster fasst: am
  Telefon weniger je Seite als am iPad; dreht man das Gerät, ordnen sich die Seiten neu.
  Kurze Kapitel stehen je Seite, nicht mehrere untereinander.
  - **Anleitung**: ein Kapitel je Seite. Die Grundkapitel sind von Anfang an da; weitere
    erscheinen erst, wenn man das Erklärte trifft (erster Geist, erste Höhle, erste
    Sammelquest, Erfolge, Lagerausbau, Händler, Talentbaum) und tragen „Neu“, bis sie
    gelesen sind. Das Handbuch im Menü glüht, bis man es geöffnet hat.
  - **Tageswerk**: zuerst heute, dann alle früheren Tage, so viele je Seite, wie passen:
    welche Übung, erledigt oder nicht, mit Gewinn.
  - **Quests**: jede beendete Expedition, neueste zuerst, mit Ort, Zeit und Ausgang.
  - **Kompendium**: siehe oben.
  - **Erfolge**: was erreicht ist, wann und mit welcher Belohnung.

## Charakterfenster und Paperdoll

Die Figur wird aus übereinandergelegten transparenten Ebenen in identischem
Bildausschnitt zusammengesetzt.

| Eigenschaft | Vorgabe |
| --- | --- |
| Format | PNG-24 mit Alphakanal |
| Hintergrund | vollständig transparent, auch bei der Basisfigur |
| Leinwand | 1024 × 1536 px, für jede Ebene identisch |
| Beschnitt | nie zuschneiden — jede Ebene behält die volle Leinwand |

Ebenenreihenfolge (hinten nach vorn): 1 Accessoire, 2 Basisfigur (Körper, Kopf,
Grundkleidung), 3 Beinkleidung, 4 Schuhe, 5 Torso, 6 Handwickel, 7 Frisur /
Kopfbedeckung.

**Zwei Figuren** stehen bei der Erstellung zur Wahl, beide von der Nutzerin im
Comicstil mit schwarzer Kontur gezeichnet: eine Frau mit blondem Haar im Dutt und ein
Mann mit kurzem, aschblondem Haar, beide in grauer Unterwäsche als Grundkleidung. Jede
Figur hat einen eigenen Ordner mit `basisfigur.png` (die Frau `assets/figur/`, der Mann
`assets/figur/zweite/`). Kleidung liegt im Ordner der ersten Figur; braucht eine andere
Figur eine eigene Fassung, kommt sie mit gleichem Dateinamen in deren Ordner, sonst trägt
sie die der ersten. Der Mann hat eigene Fassungen von Leinenhemd, Leinenhose und
Griffhandschuhen.

**Haut- und Haarfarbe** wählt man bei der Erstellung (6 Hauttöne, 7 Haarfarben). Jede
Figur ist in einer Haut- und einer Haarfarbe gezeichnet; die App färbt diese Stellen im
Browser um. Die erste Wahl jeder Reihe ist die gezeichnete Farbe der gewählten Figur
(ihr eigenes Blond, ihre eigene Haut). Was Haut und was Haar ist, ergibt sich aus dem Farbton: Haut ist orange,
Haar gelblicher und nur im oberen Viertel des Bildes. Schattierung und Linien bleiben,
wie gezeichnet. In Kleidungsebenen werden nur Stellen im genauen Hautton umgefärbt, etwa
Fingerspitzen in fingerlosen Handschuhen. Die gezeichneten Farben stehen in
`js/config.js` (FIGURES); zeichnet die Nutzerin in anderen Farben, werden sie dort
eingetragen.

**Startoutfit:** Leinenhemd und Leinenhose, ohne Voraussetzung und ohne Fähigkeit. Der
Envoy trägt sie von Anfang an (Herkunft `angezogen`), ebenso Handwickel und
Bastsandalen, damit der Rucksack am Start leer ist und Platz für 10 Stück Material hat
(Herkunft `start` legt Dinge in den Rucksack; es gibt vorerst keine). Die
Griffhandschuhe sind die Belohnung für die Brücke über die Schlucht.

**Teile ohne Bild:** Fehlt die Ebene eines Teils noch, wird es getragen, aber nicht
gezeichnet; fehlt sein Icon, zeigt die App das Symbol des Slots. Die Umwandlung listet
fehlende Bilder als Hinweis, ohne abzubrechen. Sobald eine Datei mit dem Namen aus der
Tabelle da ist, erscheint sie.

Icons sind 256 × 256 px, transparent. Sie werden aus den Zeichnungen der Ebenen
freigestellt und mittig gesetzt (so gewünscht); ein eigenes Icon mit gleichem Namen
ersetzt das jederzeit. Weitere
Bilder: Monster 512 × 512, Lager `assets/lager/stufe_<n>_<zeit>.jpg` (1792 × 672, Seitenverhältnis 8:3; Zeit = `morgen`, `tag`, `abend`, `nacht`; Stufe 0 = ohne Feuer, bisher nur `tag`; Stufe 1 = Lagerfeuer), Portraits `portrait.png` im Ordner jeder Figur (quadratisch, Hintergrund frei), Karte im Seitenverhältnis 3:2
(`assets/welt/karte.jpg`). Die Orte auf der Karte liegen über dem Bild (Position in
Prozent aus `welt.xlsx`), ein neues Kartenbild braucht also nur passende Koordinaten.

## Tabellen

Alle drei Tabellen sind Quelle, nie Ziel. `tools/convert_data.py` liest sie und
schreibt `data/*.json`. Bei einem Fehler wird nichts geschrieben. Jede Tabelle hat ein
Blatt „Erklärung“ mit allen Spalten.

- `data/uebungen.xlsx`: id, bereich, stufe, name, xp, anleitung, muskelgruppe,
  messung, ziel, timer_min, atemtakt, aktiv, notiz
- `data/ausruestung.xlsx`: id, slot, name, stufe, req_kraft, req_ausdauer,
  req_gelassenheit, req_beweglichkeit, faehigkeit, effekt, herkunft, preis,
  datei_figur, datei_icon, notiz
- `data/welt.xlsx`: Blätter Orte, Monster, Quests, Lagerstufen, Einrichtungen, Deko. Das
  Blatt Quests hat: id, name, ort, art (sammeln, erkunden, bauen, kampf, hoehle), text
  (mehrere Absätze durch Zeilenumbruch), monster, voraussetzung (auch `lager>=1`),
  tempo, ertrag, verbrauch, kosten (Energie vor Ort, zugleich Minuten), belohnung
  (auch `freischaltung:lagerfeuer`), wiederholbar, abklingzeit, aktiv (nein = vorerst
  nicht im Spiel). Lagerstufen: stufe, name, hygge_bis_naechste, beschreibung.
  Einrichtungen (eine Zeile je Stufe): id (steinlager, pilzlager, aufbewahrung,
  schlafplatz), stufe, name, lagerstufe, pilzholz, stein, energie, hygge, kapazitaet,
  bonus, beschreibung. Deko ist vorbereitet für Lagerstufe 2.

## Kleiderkammer

Eine private Seite auf claude.ai (https://claude.ai/artifact/92pbHMV3YqemSrC4s86ADj),
nicht Teil der App: die Austausch-Datenbank zwischen Nutzerin und Claude für alle
Kleidungsteile. Quelltext in `tools/kleiderkammer.html`.

- **Teile.** Jede Zeichnung ist ein Eintrag mit eindeutigem Namen und fortlaufender
  Nummer, für eine Figur (Frau oder Mann) und einen Slot. Das Gegenstück für die andere
  Figur wird verknüpft. Beim Hochladen entsteht das Icon im Browser: das Kleidungsstück
  allein, auf 256 × 256, weit auseinanderliegende Teile (zwei Handschuhe) rücken
  zusammen. Die Leinwand wird geprüft (1024 × 1536, durchsichtiger Hintergrund).
- **Vorgaben der Nutzerin**, alle freiwillig: Verwendung (Quest mit Thema, Erfolg,
  Zufallsbeute, Händlerware, Startausrüstung), Fortschritt (Anfänger 1–10, frühes
  Midgame 10–50, spätes Midgame 50–100, Endgame 100+; da die Stats bei 100 enden,
  heißt 100+: am Ziel), wichtige Werte und eine freie Idee.
- **Freigabe.** Nur freigegebene Teile verwendet Claude.
- **Im Spiel.** Claude trägt ein, ob und wie ein Teil verwendet wird (Kennung,
  Voraussetzung, Fundort, Wirkung). Diese Angaben sind verdeckt und werden erst auf
  Antippen gezeigt.
- **Fehlt noch.** Teile, für die Claude eine Zeichnung braucht. Die Nutzerin kann eine
  Zeichnung dafür hochladen, ein vorhandenes Teil verbinden oder „Nicht zeichnen“
  wählen.

## Erfolge

Erfolge werden erreicht und nie wieder verloren. Sie ergeben sich aus den Ereignissen
(`js/achievements.js`): beim Nachrechnen wird festgehalten, wann ein Erfolg erreicht
wurde, und seine Belohnung gilt ab diesem Moment. Deshalb zählen später hinzukommende
Erfolge auch rückwirkend.

| Erfolg | Wann | Belohnung |
| --- | --- | --- |
| Angekommen: „Der Envoy ist in der Zwischenwelt angekommen.“ | mit der Erstellung des Envoy | +10 % auf jeden Gewinn im Tageswerk, +10 % Ertrag beim Sammeln, **nur die ersten 15 Minuten** |

Der Bonus ist stark befristet: Er soll dazu bringen, die App gleich nach dem Einrichten
zu nutzen. Er zählt ab dem Moment, in dem der Erfolg erreicht wurde, 15 Minuten lang
(`bonusMinutes` in `js/achievements.js`). Für eine erledigte Aufgabe zählt der Zeitpunkt,
zu dem sie erledigt wurde, für eine Sammel-Expedition der des Aufbruchs. Die Tageswerk-Seite
nennt ihn mit Uhrzeit, solange er läuft; danach steht der normale Gewinn da.

Der Bonus aufs Tageswerk wird auf die Punkte der Übung gerechnet und gerundet (14 → 15,
20 → 22, 28 → 31); angezeigt wird immer der Gewinn mit Bonus. Da der Malus am
durchschnittlichen Tagesgewinn hängt, wirkt der kurze Bonus dort kaum nach.

Weitere Erfolge (etwa „100 Steine gesammelt“, „an jedem Slot ein Teil“, später auch für
echte Summen wie „100 km spaziert“) und Freischaltungen über Erfolge folgen nach dem
Konzept der Nutzerin. Erfolge für echte Übungen zählen nur Summen, nie Serien oder
Tagesbestwerte.

## Konten und Envoy-Erstellung

Mehrere Menschen können die App nutzen, jede und jeder mit einem eigenen Envoy.

- **Startbildschirm**, solange auf dem Gerät niemand angemeldet ist: Reiter „Anmelden“
  und „Neues Konto“ (Name und Passwort), darunter die Envoys, die schon auf diesem Gerät
  sind, und „Ohne Konto spielen“.
- **Konto:** Name mit 3 bis 30 Zeichen (Groß- und Kleinschreibung zählt beim Anmelden
  nicht), Passwort mit mindestens 8 Zeichen. Der Server speichert nur einen Hash des
  Passworts. Ein Gerät bekommt beim Anmelden einen Schlüssel (Token) und bleibt
  angemeldet, bis es sich abmeldet. Nach fünf falschen Passwörtern in Folge ist das Konto
  15 Minuten gesperrt. Der Server nimmt höchstens 30 Konten an (in `sync.php`
  einstellbar).
- **Ohne Konto:** Der Envoy bleibt auf diesem Gerät. In den Einstellungen lässt sich
  später ein Konto dazu erstellen; dann geht alles auf den Server.
- **Bisheriger Spielstand:** Gibt es auf dem Gerät einen Spielstand von vor den Konten,
  bietet der Startbildschirm an, ihn zu übernehmen (vorausgewählt). Er wird mit allem,
  was sein alter Geräteschlüssel auf dem Server kennt, in das neue Konto übernommen. Die
  alten Daten bleiben als Reserve liegen.
- **Envoy-Erstellung**, wenn es noch keinen Envoy gibt: erst die Figur wählen, dann Haut-
  und Haarfarbe (mit Vorschau) und einen Namen. Der Name steht als Titel auf dem
  Charakterblatt. Aussehen und Name lassen sich in den Einstellungen ändern. Danach
  öffnet sich die Envoy-Seite mit dem Rundgang.
- **Rundgang** auf der Envoy-Seite: Beim ersten Öffnen der Seite (also gleich nach dem
  Erstellen) wird die Seite abgedunkelt, ein Teil leuchtet auf, daneben steht eine Karte
  mit einem Satz. Vier Schritte: „Hier siehst du deinen Envoy.“ (die Figur), „Du kannst
  ihm andere Kleidung anlegen.“ (die Plätze), „In deinem Rucksack ist Platz für 5
  Gegenstände.“ (der Rucksack), „Mit einem Tipp auf das Portrait kommst du jederzeit
  hierher zurück.“ (das Portrait). Jede Karte hat „Weiter“ und „Überspringen“ (auch die
  Esc-Taste), „1 von 4“ und beim letzten Schritt „Fertig“. Gesehen oder übersprungen
  kommt er nicht wieder (je Profil gemerkt); in den Einstellungen unter „Envoy“ lassen
  sich alle mit „Rundgänge ansehen“ wiederholen. Er ist kein Tutorial für die Übungen, nur ein
  Rundgang durch die Oberfläche.
- **Rundgang durch Abenteuer** beim ersten Öffnen der Karte, sechs Schritte: die Karte,
  der Vorrat (Pilzholz und Stein belegen Plätze), die Energie („Alles, was er tut, kostet
  Energie. Steigt seine Ausdauer, steigt auch seine Energie.“), die laufende Expedition,
  die Legende und zuletzt das Lager: „Dein Envoy wird eine Weile hier bleiben. Am
  besten errichtest du ein Lagerfeuer.“ Tippt man das Lager an, nennt die Quest „Ein
  Lagerfeuer errichten“, was der Envoy braucht, dass alles Energie kostet, dass die
  Energie mit der Ausdauer wächst, und was zu sammeln ist (8 Steine, 2 Pilzholz).
- **Rundgang durch das Lager** beim ersten Öffnen, nachdem das Feuer brennt, drei
  Schritte: „Dein Envoy hat das Lagerfeuer errichtet.“ (das Bild), „Ab jetzt kannst du
  das Lager einrichten.“ (die Einrichtungen), „Wenn es genug Hygge hat, kannst du es
  sogar ausbauen.“ (das Hygge). Die Ausrufezeichen der ersten Fassung sind weg
  (Regel: keine Ausrufezeichen). Ist ein Bericht oder anderes Fenster offen, wartet
  der Rundgang, bis es geschlossen ist. In den Einstellungen zeigt „Rundgänge ansehen“
  alle wieder. Für die anderen Seiten (Händler, Handbuch, Tageswerk) folgen sie später.
- **Einstellungen:** angemeldet als, Stand des Abgleichs, „Jetzt abgleichen“,
  „Abmelden“ (die Daten bleiben auf dem Gerät und auf dem Server); ohne Konto „Konto
  erstellen“ und „Profil wechseln“.

Im Browser hat jedes Profil (ein Envoy) seinen eigenen Speicher; Geräte-Kennung und die
Liste der Profile teilt sich das Gerät.

## Speicherung, Abgleich, Veröffentlichung

Gespeichert wird eine Liste von Ereignissen, nie ein fertiger Spielstand. Der Stand
wird bei jedem Start aus dieser Liste neu berechnet, Tag für Tag, inklusive Malus,
Bodensatz, Energie und Welt. Auch Name und Aussehen des Envoy sind ein Ereignis
(`envoy`), damit sie auf allen Geräten gleich sind.

`sync.php` hält für jedes Konto eine eigene Liste und gleicht sie zwischen den Geräten
des Kontos ab: Jedes Gerät schickt, was der Server noch nicht kennt, und bekommt, was es
selbst noch nicht hat. Es wird nie etwas überschrieben. Die Daten liegen in
`sync-daten/` (von außen gesperrt), die Konten in `sync-daten/konten/`.

Ein GitHub-Ablauf testet bei jeder Änderung, wandelt die Tabellen um und lädt per SFTP
auf den IONOS-Webspace, in zwei Ordner:

- **Testordner** (Name des echten Ordners mit „-test“): jede neue Arbeit. Beim
  Hochladen wird sie als Testfassung gekennzeichnet (`js/stage.js`): Sie heißt „Envoy
  Test“, zeigt oben ein kleines Schild „Test“, und alles, was sie im Browser speichert,
  liegt unter eigenen Namen (`envoy-test.…` statt `envoy.…`), ebenso ihr Offline-Speicher.
  Auf dem Server hat sie ihr eigenes `sync-daten/`, also eigene Konten.
- **Echter Ordner**: nur der Zweig `main`. Dorthin kommt eine Fassung erst, wenn die
  Nutzerin sie im Testordner angesehen und freigegeben hat.

Die App fragt bei jedem Laden beim Server nach, ob sich eine Datei geändert hat, und
Bilder werden mit der App-Version angefragt. Eine neue Zeichnung unter altem Namen
erscheint so beim nächsten Öffnen, statt dass ein Gerät eine alte Kopie weiter zeigt.

## Entscheidungen

| Punkt | Entscheidung |
| --- | --- |
| Messwerte | Pflicht, wenn die Übung einen hat; sonst keine Eingabe |
| Rückfrage | nur bei neuer Übung oder nach Stufenwechsel |
| Lange Pause | nach je 7 Fehltagen eine Intensitätsstufe runter |
| Krankheitsmodus | niedrigste Stufe, zählt nicht für die Intensität, kein Malus-Erlass |
| Plateau | ergibt sich aus der Levelkurve, Formel unverändert |
| Tabellenwerte der Levelkurve | so, wie die Formel rechnet (304, 756, 2755) |
| Bodensatz | Level mit Nachkommastelle |
| Tagesgrenze | 3:00 Uhr |
| Slots | 6, kein Gürtel, keine Schulterstücke, kein Waffen-Slot; Accessoire statt Umhang |
| Ebene je Teil | wählbar (Spalte `ebene`), sonst die Stelle des Slots |
| Inhaltsumfang | vorerst höchstens bis ins gute Midgame; Luft nach oben |
| Veröffentlichung | erst Testordner, echter Ordner nur nach Freigabe (Zweig `main`) |
| Rucksack | 5 Plätze, am Start leer; Pilzholz und Stein belegen Plätze (2 Stück je Platz); die Aufbewahrung (Einrichtung des Lagers) unterwegs nur einsehbar |
| Konten | Name und Passwort auf dem eigenen Server; ohne Konto nur auf einem Gerät |
| Figuren | Frau und Mann zur Wahl, Haut- und Haarfarbe werden im Browser umgefärbt |
| Icons | aus den Zeichnungen der Ebenen freigestellt |
| Kleidung verwalten | Kleiderkammer auf claude.ai, mit Freigabe und verdeckten Spielangaben |
| Menü | fünf Punkte: Abenteuer, Talentbaum, Lager (Mitte, Start), Händler, Handbuch |
| Obere Leiste | Portrait mit vier Werte-Ringen (auch beim Envoy), Tageswerk-Knopf, Einstellungen |
| Handbuch | Buch mit Reitern: Anleitung, Tageswerk, Quests, Kompendium, Erfolge; füllt das Fenster, ohne zu scrollen |
| Einrichtungen | Steinlager, Pilzlager, Aufbewahrung, Schlafplatz; Stufe 1 auf Lagerstufe 1; Deko erst ab Lagerstufe 2 |
| Energie | Name für die Leiste, 10 je Level Ausdauer, 1 Energie = 1 Minute |
| Sammeln | auf dem Trümmerfeld ohne Weg, 2 bis 4 Stück je Energie gewürfelt, nie weniger als 2 |
| Lagerfeuer | die erste Quest: 8 Stein, 2 Pilzholz, 2 Energie; macht Lagerstufe 1 |
| Hygge | Summe der Einrichtungen; 30 für Stufe 2 (Ausbau noch nicht gebaut) |
| Lagerbild | nach Stufe und Tageszeit (Sonnenstand) |
| Erster Erfolg | „Angekommen“: +10 % Tageswerk und Sammeln, nur die ersten 15 Minuten |
| Lager verbessern | kein Knopf, bis Lagerstufe 2 gebaut wird |
| Währung | Bannsplitter; dazu Pilzholz und Stein |
| Leichter Werkstoff | Pilzholz statt Holz (Quarz war zu schwer und zu spröde) |
| Optik | Petrol, Elfenbein, gebranntes Orange, Taubenblau; Adern über Stein; Menü aus runden Schilden |
| Scheitern | gibt es nicht; Stats bestimmen Zugang, Dauer und Ertrag |
| Expeditionen | echte Zeit für Hinweg, vor Ort und Rückweg, eine zur Zeit |
| Kampfergebnis | beim Aufbruch berechnet und gespeichert, zählt bei der Rückkehr |
| Startansicht | Lager; nur direkt nach dem ersten Erstellen eines Envoy die Envoy-Seite mit Rundgang |
| Wortwahl | „XP“ und „Level“ gibt es nur je Stat, nie für den Helden; Gewinne heißen „+14 Kraft“ |
| Talentbaum | Schild mit Schloss statt ausgegraut; eigene Seite, kein Fenster über der alten Ansicht |
| Rückgängig | nur für Tagesaufgaben am selben Tag |
