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
| Ausdauer | Spazieren, Treppe, Rad | Leben im Kampf (tiefer in Höhlen), Größe der Ausdauerleiste, kürzere Wege |
| Beweglichkeit | Dehnen, Mobility | Treffer- und Ausweichchance, Zugang zu schwierigem Gelände |
| Gelassenheit | Atemübungen, Entspannung | Füllgeschwindigkeit der Ausdauerleiste, Geister beruhigen, Zugang zu stillen Orten |

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
Die Oberfläche schreibt nie „XP“: Ein Gewinn heißt „+14 Kraft“, ein Abzug
„Pause · −5 Kraft“. So ist sofort sichtbar, welcher Stat wächst.

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
| reise | weniger Ausdauer je Weg (mindestens 1), damit auch kürzer unterwegs |
| erholung | Ausdauerleiste füllt sich schneller |
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

**Zeit folgt Ausdauer: Jeder Punkt Ausdauer ist eine Minute unterwegs.** Was lange
dauert, kostet entsprechend viel Ausdauer; was wenig kostet, geht schnell. Die Spanne
reicht von drei Minuten (etwas auflesen gleich neben dem Lager) bis weit über eine
Stunde (eine Nacht am Mondsee, bis zum Horizont). Lange Quests brauchen eine lange
Leiste und damit den Wert Ausdauer. Die Leiste begrenzt, wie viel an einem Stück geht;
ist sie leer, ist Pause.

- **Weg** (je Richtung) = Entfernung ÷ 20 Ausdauer, gerundet, mindestens 1. Mit jedem
  Level Ausdauer 3 % kürzer, höchstens auf die Hälfte. Stiefel und Umhänge können ihn
  billiger machen, ein überfüllter Rucksack verteuert jeden Weg um 1. Die Karte ist
  1,5-mal so breit wie hoch, das fließt in die Entfernung ein.
- **Vor Ort** = die Kosten aus der Tabelle. Bei Sammeln, Erkunden und Bauen macht jedes
  Level der unter „Tempo“ genannten Stats die Arbeit 4 % kürzer und damit billiger,
  höchstens auf die Hälfte. Kämpfe dauern so lange, wie die Tabelle sagt, gleich wie
  viele Runden sie gehen.
- **Ausdauer** der Expedition = 2 × Weg + vor Ort, **Dauer** = ebenso viele Minuten.
- Das Ergebnis wird beim Aufbruch berechnet und als Ereignis gespeichert, zählt aber
  erst, wenn der Envoy zurück ist. Material zum Bauen wird gleich mitgenommen.
- Zurück im Lager erscheint einmal ein Bericht: Kämpfe, Mitgebrachtes, Neues im
  Kompendium.

Vor dem Aufbruch zeigt jede Quest: Voraussetzung (erfüllt oder nicht), Dauer mit
Hinweg, vor Ort und Rückweg, Ausdauer, welche Stats sie kürzer machen, welche den
Ertrag erhöhen, und den möglichen Ertrag. Reicht die Ausdauer gerade nicht, steht dort,
wann sie reicht. Ist die Leiste insgesamt zu kurz, steht dort, dass sie mit Ausdauer
wächst.

### Ausdauerleiste

- Größe = 20 + 4 × Ausdauer (24 bei Level 1, 60 bei Level 10). Eine Kerbe je 5 Punkte,
  auf einer langen Leiste je 10 oder 20.
- Sie füllt sich in etwa 8 Stunden, schneller mit Gelassenheit (+3 % je Level) und
  Erholung aus Zuhause, Einrichtung und Ausrüstung.
- Die erledigte Gelassenheits-Aufgabe ist eine echte Rast: +50 % der Leiste.

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

**Sammeln in drei Größen.** Am Pilzhain und im Steinbruch gibt es je eine kurze Quest
(1 Ausdauer vor Ort, 1 Stück), eine mittlere (6, 2 bis 3 Stücke) und eine lange
(20, 7 bis 9 Stücke, mit Kraft-Voraussetzung). Kurze Quests sind zum Spielen zwischendurch,
lange lohnen sich etwas mehr, weil der Weg nur einmal anfällt. Bannsplitter lassen sich
im Uferkies am Stillen Ufer sammeln (1 Stück). Wiederholbare lange Quests (Wache an der
Furt, Eine Nacht am Mondsee, Bis zum Horizont) bringen mehr Bannsplitter, dauern aber
40 bis 90 Minuten vor Ort und haben eine Abklingzeit.

**Tempo der Wirtschaft.** Die Erträge sind bewusst klein, damit schnelle Quests nicht
alles in wenigen Tagen öffnen. Wer täglich alle vier Aufgaben macht und dreimal am Tag
die ganze Leiste verbraucht, hat die Steinhütte nach etwa 5 Tagen, das Turmhaus nach
etwa vier Wochen. Die Quests der Welt bleiben an die Werte und an echte Kilometer und
Stockwerke gebunden.

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

### Rucksack und Kiste

Der Rucksack hat von Anfang an **5 Plätze**. Getragenes zählt nicht mit. Die **Kiste**
kommt mit der Quest „Ein Platz zum Bleiben“ (12 Plätze) und steht im Lager, dem
Ausgangspunkt jeder Expedition. Neues landet im Rucksack, ist der voll in der Kiste, ist
auch die voll oder der Envoy unterwegs, wird der Rucksack überfüllt (nichts geht
verloren, aber jeder Weg kostet 1 mehr).

**Unterwegs** (solange eine Expedition läuft) lässt sich in die Kiste nur hineinschauen:
ihre Teile sind ausgegraut. Nichts lässt sich daraus anlegen, hineinlegen,
herausnehmen, verkaufen oder liegen lassen. Das geht erst, wenn der Envoy zurück im
Lager ist. Was unterwegs abgelegt wird, kommt in den Rucksack.

Das Charakterblatt zeigt unter der Figur (auf dem iPad rechts oben) eine Inventar-Box:
Reiter „Rucksack“ mit seinen fünf Plätzen und, sobald es sie gibt, Reiter „Kiste“.
„Alle“ öffnet die Seite Inventar mit Suche, Filter nach Slot und Sortierung (Slot, Stufe,
Name, Neueste) und dem Getragenen. Das Housing mit eigener Einteilung folgt.

### Lagerausbau

Das Lager ist am Anfang nur ein Lagerfeuer. Die Quest „Ein Platz zum Bleiben“ (6 Pilzholz
und 6 Stein) schaltet den Ausbau frei und bringt die Kiste. Wie das Lager wächst
(Stufen, Unterstufen, Ausbau und Einrichtung, sichtbar wie eine Anziehpuppe), plant die
Nutzerin; bis dahin ist der Knopf „Lager verbessern“ ohne Inhalt.

**Einrichtung** wird vorerst nicht gesammelt: Sie kommt weder als Beute noch aus Quests
noch beim Händler. Die alten Zuhause-Stufen (Zelt bis Turmhaus) und die Einrichtung
stehen noch in `welt.xlsx`, werden aber nicht gezeigt.

### Kompendium

Steht im Handbuch: zuerst alle Geister auf einer Seite, noch nicht getroffene als dunkle
Silhouette mit Stufe; dann für jeden getroffenen eine eigene Seite mit Bild,
Beschreibung, Werten, Orten und Zählern (Begegnungen, besiegt, beruhigt, vertrieben,
zuerst gesehen).

### Freischaltungen

| Was | Wann |
| --- | --- |
| Karte, Quests, Begegnungen, Rucksack, Handbuch | von Anfang an |
| Lagerausbau, Kiste | Quest „Ein Platz zum Bleiben“ |
| Händler | Quest „Der Händler im Nebel“ |
| Aschenhang, Turm der Stufen, lange Straße | Quest „Die Brücke über die Schlucht“ |
| Weißes Tal | Quest „Die lange Straße“ (30 km reale Strecke) |
| Talentbaum | alle vier Stats auf 10 (Inhalt Phase 2) |

## Menü und Ansichten

**Unten** ein Sims aus Stein mit einer Kupferleiste; die fünf Menüpunkte sind runde
Schilde (Kupferrand, Fläche aus Stein mit feinen Adern, das Emblem eingehauen; der
gewählte Schild hell wie Elfenbein), die zur Hälfte über den Sims ragen: **Abenteuer**,
**Talentbaum**, in der Mitte größer das **Lager**, **Händler**, **Handbuch**. Noch
verschlossene Bereiche tragen ein kupfernes Schloss.

**Oben** eine Leiste über jeder Ansicht außer dem Envoy selbst und dem Handbuch:

- links das runde **Portrait** des Envoy (von der Nutzerin gezeichnet, in Haut- und
  Haarfarbe umgefärbt wie die Figur). Um das Portrait liegen vier dünne Ringe, innen
  Kraft, dann Ausdauer, Beweglichkeit, Gelassenheit, jeder in seiner Farbe. Ein Ring
  füllt sich auf dem Weg zum nächsten Level; ist er voll, steigt der Wert. Zeigen
  (Maus) oder Berühren (Touch) eines Rings nennt Level und Rest („Kraft · Level 1 ·
  noch 30 bis Level 2“); ein Antippen des Rings tut sonst nichts. Das Portrait öffnet
  den Envoy.
- in der Mitte das **Tageswerk** als großer Knopf: orange mit pulsierendem Schimmer und
  „2 / 4“, solange Aufgaben offen sind; ist alles erledigt, ruhig und dunkel mit dem
  Emblem der App und „ENVOY“ quer darüber. Er führt immer zur Tageswerk-Seite.
- rechts die **Einstellungen** (Zahnrad).

- **Lager** (Startansicht): das Bild des Lagers (am Anfang ein Lagerfeuer, später je
  Stufe ein eigenes; einmal soll dort der Envoy sitzen, wenn er da ist), ob der Envoy da
  oder unterwegs ist, der Knopf „Lager verbessern“ (verschlossen bis zur Quest „Ein
  Platz zum Bleiben“), laufende Expedition oder Bericht, Vorrat mit Ausdauerleiste,
  heute gesichtete Geister, Hinweise.
- **Tageswerk**: die vier Aufgaben als schmale Zeilen mit dem Gewinn („+15 Kraft“) und
  einem Haken zum Erledigen. Antippen klappt eine Aufgabe auf (Timer, Erledigt); die
  Anleitung erscheint nur auf Wunsch. Ein Fragezeichen klappt eine kurze Erklärung auf
  (wozu das Tageswerk da ist, dass Werte bei liegengebliebenen Aufgaben langsam sinken,
  aber nie ganz verloren gehen) mit Verweis ins Handbuch. Ist alles erledigt, steht oben
  „Das Tageswerk ist erledigt.“ und ein Ausblick auf die vier Übungen von morgen.
- **Timer**: Ring mit Restzeit, bei Übungen mit Atemtakt ein Kreis, der wächst und
  schrumpft. Solange die Zeit läuft, spielt ein ruhiger Klang: leises Rauschen wie
  Wellen, ein tiefer Akkord, ab und zu eine Klangschale. Mit Atemtakt kommen und gehen
  die Wellen mit dem Atem. Am Ende verklingt der Hintergrund und ein Ton sagt, dass die
  Zeit um ist. Der Klang lässt sich im Timer abschalten; die Wahl bleibt gespeichert.
  Alles wird im Browser erzeugt, es gibt keine Tondateien.
- **Abenteuer**: gezeichnete Landkarte mit Tintensiegeln für die Orte, Legende, Vorrat
  und Expedition. Keine unerklärten Zahlen auf der Karte.
- **Envoy**: das Charakterblatt (siehe unten), mit Rucksack; ohne obere Leiste.
- **Handbuch**: ein Buch mit Papierseiten, orangen Reitern an der Oberkante und
  umgeknickten Ecken unten zum Blättern (Wischen und Pfeiltasten gehen auch). Hinter dem
  letzten Blatt eines Reiters geht es mit dem nächsten Reiter weiter.
  - **Anleitung**: ein Kapitel je Seite. Die Grundkapitel sind von Anfang an da; weitere
    erscheinen erst, wenn man das Erklärte trifft (erster Geist, erste Höhle, erste
    Sammelquest, Erfolge, Lagerausbau, Händler, Talentbaum) und tragen „Neu“, bis sie
    gelesen sind. Dann trägt auch das Handbuch im Menü einen Punkt.
  - **Tageswerk**: zuerst heute, dann alle früheren Tage, sieben je Seite: welche Übung,
    erledigt oder nicht, mit Gewinn.
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
Envoy trägt sie von Anfang an (Herkunft `angezogen`). Handwickel und Bastsandalen liegen
beim Start im Rucksack (Herkunft `start`). Die Griffhandschuhe sind die Belohnung für
die Brücke über die Schlucht.

**Teile ohne Bild:** Fehlt die Ebene eines Teils noch, wird es getragen, aber nicht
gezeichnet; fehlt sein Icon, zeigt die App das Symbol des Slots. Die Umwandlung listet
fehlende Bilder als Hinweis, ohne abzubrechen. Sobald eine Datei mit dem Namen aus der
Tabelle da ist, erscheint sie.

Icons sind 256 × 256 px, transparent. Sie werden aus den Zeichnungen der Ebenen
freigestellt und mittig gesetzt (so gewünscht); ein eigenes Icon mit gleichem Namen
ersetzt das jederzeit. Weitere
Bilder: Monster 512 × 512, Lager `assets/lager/stufe_<n>.jpg` im Seitenverhältnis 16:9 (Stufe 0 = Lagerfeuer), Portraits `portrait.png` im Ordner jeder Figur (quadratisch, Hintergrund frei), Karte im Seitenverhältnis 3:2
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
- `data/welt.xlsx`: Blätter Orte, Monster, Quests, Zuhause, Einrichtung. Das Blatt
  Quests hat: id, name, ort, art (sammeln, erkunden, bauen, kampf, hoehle), text,
  monster, voraussetzung, tempo, ertrag, verbrauch, kosten (Ausdauer vor Ort, zugleich
  Minuten), belohnung, wiederholbar, abklingzeit

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
| Angekommen: „Der Envoy ist in der Zwischenwelt angekommen.“ | mit der Erstellung des Envoy | +10 % auf jeden Gewinn im Tageswerk, +10 % Ertrag beim Sammeln |

Der Bonus aufs Tageswerk wird auf die Punkte der Übung gerechnet und gerundet (14 → 15,
20 → 22, 28 → 31); angezeigt wird immer der Gewinn mit Bonus. Da der Malus am
durchschnittlichen Tagesgewinn hängt, wächst er im selben Verhältnis mit.

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
  Charakterblatt. Aussehen und Name lassen sich in den Einstellungen ändern.
- **Einstellungen:** angemeldet als, Stand des Abgleichs, „Jetzt abgleichen“,
  „Abmelden“ (die Daten bleiben auf dem Gerät und auf dem Server); ohne Konto „Konto
  erstellen“ und „Profil wechseln“.

Im Browser hat jedes Profil (ein Envoy) seinen eigenen Speicher; Geräte-Kennung und die
Liste der Profile teilt sich das Gerät.

## Speicherung, Abgleich, Veröffentlichung

Gespeichert wird eine Liste von Ereignissen, nie ein fertiger Spielstand. Der Stand
wird bei jedem Start aus dieser Liste neu berechnet, Tag für Tag, inklusive Malus,
Bodensatz, Ausdauerleiste und Welt. Auch Name und Aussehen des Envoy sind ein Ereignis
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
| Rucksack | 5 Plätze; das Lager (bisher Schrank) nur im Lager nutzbar |
| Konten | Name und Passwort auf dem eigenen Server; ohne Konto nur auf einem Gerät |
| Figuren | Frau und Mann zur Wahl, Haut- und Haarfarbe werden im Browser umgefärbt |
| Icons | aus den Zeichnungen der Ebenen freigestellt |
| Kleidung verwalten | Kleiderkammer auf claude.ai, mit Freigabe und verdeckten Spielangaben |
| Menü | fünf Punkte: Abenteuer, Talentbaum, Lager (Mitte, Start), Händler, Handbuch |
| Obere Leiste | Portrait mit vier Werte-Ringen, Tageswerk-Knopf, Einstellungen |
| Handbuch | Buch mit Reitern: Anleitung, Tageswerk, Quests, Kompendium, Erfolge |
| Einrichtung | vorerst nicht sammelbar; das Housing der Nutzerin folgt |
| Erster Erfolg | „Angekommen“: +10 % Tageswerk und Sammeln |
| Währung | Bannsplitter; dazu Pilzholz und Stein |
| Leichter Werkstoff | Pilzholz statt Holz (Quarz war zu schwer und zu spröde) |
| Optik | Petrol, Elfenbein, gebranntes Orange, Taubenblau; Adern über Stein; Menü aus runden Schilden |
| Scheitern | gibt es nicht; Stats bestimmen Zugang, Dauer und Ertrag |
| Expeditionen | echte Zeit für Hinweg, vor Ort und Rückweg, eine zur Zeit |
| Kampfergebnis | beim Aufbruch berechnet und gespeichert, zählt bei der Rückkehr |
| Startansicht | Lager |
| Wortwahl | kein „XP“ in der Oberfläche, sondern „+14 Kraft“ |
| Talentbaum | Schild mit Schloss statt ausgegraut |
| Rückgängig | nur für Tagesaufgaben am selben Tag |
