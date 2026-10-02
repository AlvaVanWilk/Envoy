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
entlang. Es läuft immer nur eine Expedition; solange sie läuft, lässt sich ihr aber mehr
**anhängen** (siehe „In Reihe“ unten): dann geht der Envoy von Ort zu Ort und erst am
Ende zurück ins Lager.

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
  1,5-mal so breit wie hoch, das fließt in die Entfernung ein. Am Lager selbst und auf
  dem Trümmerfeld gleich daneben gibt es keinen Weg; ein Weg vom Trümmerfeld aus ist
  ein Weg vom Lager aus, ein Weg zum Trümmerfeld ist der Weg ins Lager.
- **Vor Ort** = die Kosten aus der Tabelle. Bei Sammeln, Erkunden und Bauen macht jedes
  Level der unter „Tempo“ genannten Stats die Arbeit 4 % kürzer und damit billiger,
  höchstens auf die Hälfte. Kämpfe dauern so lange, wie die Tabelle sagt, gleich wie
  viele Runden sie gehen.
- **Energie** der Expedition = 2 × Weg + vor Ort, **Dauer** = ebenso viele Minuten.
  Die Energie wird beim Aufbruch beiseitegelegt (beim Sammeln, was die besten Würfel
  brauchen; den Rest nimmt sich der Envoy, wenn er dort ankommt).
- Das Ergebnis wird beim Aufbruch berechnet und als Ereignis gespeichert und zählt,
  sobald die Arbeit dort getan ist: Material liegt dann schon im Vorrat, auch wenn der
  Envoy noch unterwegs ist. Material zum Bauen nimmt er mit, wenn er dafür aufbricht.
- Zurück im Lager erscheint einmal ein Bericht: Kämpfe, Mitgebrachtes, Neues im
  Kompendium, bei zu wenig Platz auch, was liegen blieb. Nach mehreren Stationen ein
  Bericht mit einem Abschnitt je Station; im Handbuch steht jede Quest einzeln.

**In Reihe.** Solange der Envoy unterwegs ist, lässt sich ihm alles anhängen, was er tun
kann: Quests, Begegnungen, Sammeln auf dem Trümmerfeld, das Lagerfeuer und die
Einrichtungen. Er geht dann vom letzten Ort direkt zum nächsten statt zwischendurch ins
Lager; das spart Wege, und eine lange Reihe füllt eine lange Zeit ohne App.

- Der erste Schritt ist ein ganz normaler Aufbruch. Während der Envoy unterwegs ist,
  heißt derselbe Knopf in jedem Fenster „Anhängen“ (im Quest-Fenster, beim Sammeln und
  bei den Einrichtungen).
- **Der Weg** zur angehängten Aktion beginnt am Ort der letzten; die Energie für den
  Rückweg von dort, die er nun nicht mehr geht, kommt zurück. Ist er schon auf dem
  Rückweg, kehrt er dort um, wo er gerade ist (für etwas am Lager geht er einfach weiter).
- **Anhängen geht, solange die Energie jetzt dafür reicht, mit dem Rückweg vom neuen
  letzten Ort.** Beim Sammeln zählt dabei, was die besten Würfel brauchen. Brauchen die
  Würfel dort mehr, als die Leiste dann hergibt, fällt die letzte Aktion der Reihe heraus
  (ihre Energie kommt zurück), so dass eingeplantes Material sicher gesammelt wird; erst
  wenn nichts mehr herausfallen kann, sammelt der Envoy, solange die Energie reicht. Was
  sofort beginnt (ein Aufbruch aus dem Lager), muss auch mit den schlechtesten Würfeln
  passen.
- **Was die Reihe bringt, zählt für das Spätere schon mit**: Material, das sie sammelt,
  erfüllt die Voraussetzung einer späteren Quest (Stein, Pilzholz, dann das Lagerfeuer),
  und beim Platz im Vorrat zählt, was vorher hinzukommt. Fehlt beim Aufbruch zu einem Bau doch
  Material, fällt der Bau heraus und die Energie kommt zurück. Das Fenster zeigt die Welt,
  wie sie nach der Reihe sein wird („Nach der Reihe im Vorrat …“).
- Unterwegs zeigt die Leiste einen Block je Aktion (Weg kupfern, Arbeit hell) und den
  Rückweg, darüber die gerade laufende Aktion und den Weg „Das Lager – Stilles Ufer –
  Pilzhain – Das Lager“, darunter die Reihe: erledigt (Haken), jetzt (kupfern), wartend.
  Die letzte wartende lässt sich mit × herausnehmen, ihre Energie kommt zurück. Auf der
  Karte trägt jeder Ort, der noch dran ist, seine Nummer in der Reihe, auch im Fächer.
- Nach der Rückkehr ein Bericht mit einem Abschnitt je Station; was herausgefallen ist,
  steht dort („Ausgelassen: … Dafür reichte die Energie nicht mehr.“).

**Quests auf der Karte.** Ein Tipp auf einen Ort fächert seine Quests auf: neben dem
Ort ein Bogen aus kleinen Siegeln, je Quest eines mit ihrem Namen daneben (ein Geist mit
seinem Bild, Sammeln mit dem Material, verschlossene mit Schloss), die Karte dahinter
abgedunkelt. Ein Tipp auf ein Siegel öffnet das Fenster der Quest; ein Tipp daneben, auf
den Ort oder Esc schließt den Fächer. Die Namen stehen gleich da (statt erst beim
Antippen), damit ein Tipp zum Öffnen reicht. Der Fächer öffnet sich auch bei nur einer
Quest. Einmalige Quests, die erledigt sind, stehen nicht mehr im Fächer (der Rückblick
steht im Handbuch).

**Die Kartusche eines Ortes.** Zusammen mit dem Fächer erscheint am Rand der Karte ein
Schild im Stil der Karte selbst (Tinte auf Papier, doppelter Rahmen) mit der Region, dem
Namen und der Beschreibung des Ortes; es liegt am oberen oder unteren Rand, je nachdem,
welcher weiter vom Ort weg ist, und die Karte rückt Ort und Fächer aus seinem Bereich.
Ein verschlossener Ort sagt dort mit Schloss, was ihn öffnet („Öffnet sich mit: …“);
ein Ort ohne offene Quest „Hier ist alles getan.“ oder „Heute ist es hier still.“

**Das Fenster einer Quest** zeigt nur, was man zum Entscheiden braucht: den Text, die
Voraussetzung (erfüllt oder nicht; Material, das die Quest verbraucht, gehört dazu, etwa
„8 Stein, 2 Pilzholz“ beim Lagerfeuer), den Geist, die Belohnung und die Energie als
Leiste: was sicher bleibt (voll), was die Würfel vielleicht brauchen (gestreift) und was
die Quest kostet als ein Block, darin ihr Weg kupfern getönt, dazu „kostet 5 von 10“
und darunter „davon Weg 2“. In der Reihe steht dort, wie viel Weg es allein wäre („davon
Weg 2 statt 4“), so dass das Verrechnen der Wege zu sehen ist. Passt die
Belohnung nicht mehr ganz in den Vorrat, steht dort „In den Vorrat passen davon nur
6 Stein.“ Keine Dauer, kein „etwa“ oder
„höchstens“, keine Stats für Tempo oder Ertrag: Energie und Minuten sind dasselbe, und
die Stats wirken auch ungesagt. Reicht die Energie gerade nicht, steht auf dem Knopf,
wann sie reicht; ist die Leiste insgesamt zu kurz, steht dort, dass sie mit Ausdauer
wächst. Der Knopf heißt „Aufbrechen“, beim Bauen am Lager „Errichten“, beim Sammeln
„Sammeln“. Während am Lager gebaut wird, steht in der Leiste „Bauen“ und „fertig um“
(statt „zurück um“).

### Energie

- Größe = 10 × Ausdauer (10 bei Level 1, 100 bei Level 10). Eine Kerbe je Punkt, auf
  einer langen Leiste je 5, 10 oder 20.
- Sie füllt sich in etwa 8 Stunden, schneller mit Gelassenheit (+3 % je Level) und
  Erholung aus der Ausrüstung.
- Die erledigte Gelassenheits-Aufgabe ist eine echte Rast: +50 % der Leiste.
- Der **Schlafplatz** gibt dem Envoy jeden Morgen (ab 3 Uhr, mit dem neuen Tag) einmal
  Energie dazu, über das Ende der Leiste hinaus, je nach Stufe 20 bis 40 % der Leiste:
  beim Raspelnest und 10 Energie wären es 12 von 10. Der
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

**Sammeln auf dem Trümmerfeld.** Gleich neben dem Lager liegt das Trümmerfeld, ein
eigener Ort auf der Karte (Typ `truemmerfeld`, ohne Weg). Dort kann der Envoy immer
Steine und Pilzholz sammeln (zwei Quests, die es immer gibt). Das Lagerfeuer verrät nicht,
wo; es sagt nur, dass man es in der Gegend sammeln kann. Man wählt die Menge; die
Arbeit läuft in echter Zeit weiter, auch wenn die App zu ist, und die Marke des Envoy
läuft solange auf dem Trümmerfeld umher. Was er mitbringt, wird gewürfelt, aber nie
schlecht:

- Je Energie (also je Minute) bringt er **2 Stück** und dazu bis zu **2 weitere**: zwei
  Würfel, jeder gelingt mit einer Chance und bringt dann 1 Stück mehr. Bei Level 1 ist
  die Chance 25 % (im Schnitt 2,5 Stück je Energie, selten 4), sie steigt mit jedem
  Level um 1,5 Punkte, höchstens auf 90 %. Weniger als 2 Stück je Energie gibt es nie,
  Fehlwürfe gibt es nicht.
- **Stein** hängt an Kraft, **Pilzholz** an Beweglichkeit. Ein Erfolg-Bonus („Angekommen“)
  erhöht die Chance.
- Die Menge wird mit − und + gewählt und beginnt bei 1 (nichts ist vorausgewählt). Sie
  geht höchstens so weit, wie in den Vorrat passt und wie seine Energie auch bei den
  schlechtesten Würfen sicher bringt (2 Stück je Energie). Ein Tipp auf + darüber hinaus
  (oder darauf zeigen) sagt, warum nicht: „Mehr passt nicht in den Vorrat.“ oder „Für
  mehr reicht die Energie nicht.“ Gesammelt wird genau diese Menge (was beim letzten Wurf
  übrig wäre, bleibt liegen). So muss hinterher nichts liegen gelassen werden. Unter der
  Menge steht der Vorrat („Im Vorrat 0 / 10 Stein“), darunter die Energie-Leiste mit dem, was die Menge kostet (bei 8 Stein
  „kostet 2–4 von 10“). „Bis die Energie reicht“ gibt es nicht mehr.
- **Sicher am ersten Tag:** Das Lagerfeuer (8 Stein, 2 Pilzholz, 2 Energie) ist mit den
  10 Energie des Starts immer zu schaffen: 8 Stein kosten höchstens 4 Energie (4 × 2
  Stück), 2 Pilzholz höchstens 1, dazu 2 zum Bauen. Das sind höchstens 7 von 10, es
  bleibt Luft, auch bei schlechtesten Würfen.

**Weitere Sammelorte.** Am Pilzhain und im Steinbruch gibt es noch je drei Quests mit
festem Ertrag und Weg (je 1 Energie hin und zurück). Sie folgen derselben Rechnung wie
das Trümmerfeld, gut 2 bis 4 Stück je Energie, damit sich der Weg lohnt, wenn das Lager
große Mengen aufnimmt:

| Quest | vor Ort | Ertrag | mit Weg |
| --- | --- | --- | --- |
| Pilzholz auflesen / Lose Steine auflesen | 1 | 7–9 | 3 Energie |
| Pilzholz schlagen / Steine brechen | 4 | 16–20 | 6 Energie |
| große Quest (Kraft 4 für Pilzholz, Kraft 5 für Stein) | 10 | 38–44 | 12 Energie |

Ohne Stein- und Pilzlager passt nur ein Teil davon in den Vorrat; das sagt das Fenster
der Quest vorher („In den Vorrat passen davon nur 6 Stein.“). Wie die Orte weiterwachsen, plant die Nutzerin. Bannsplitter lassen sich im Uferkies am Stillen Ufer
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
- Ausrüstung: feste Quest-Belohnungen oder mit einer Chance je Geist. Beute-Ausrüstung
  liegt in der Nähe der Stärke des Helden (±3 Level).
- Pläne für Deko: an ihrem Fundort, mit Glück (siehe Das Lager).
- Glück erhöht Bannsplitter und die Chance auf Fundstücke.

### Händler

Wird durch die Quest „Der Händler im Nebel“ freigeschaltet (den Händler retten).
Bietet jeden Tag 5 Dinge an, an manchen Tagen dazu einen Plan für Deko (siehe Das Lager). Die
Ausrüstung ist zufällig, aber immer im Bereich der Stärke des Helden (Voraussetzung
höchstens 3 Level darunter oder darüber). Preis in Bannsplittern = 12 + 4 × n + n² + 8 × Stufe
(n = höchste Voraussetzung), falls in der Tabelle nicht anders angegeben. Er kauft
alles für ein Drittel des Preises zurück.

### Rucksack, Vorrat und Aufbewahrung

Der Rucksack hat von Anfang an **5 Plätze** und der Envoy hat ihn immer bei sich. Er ist
nur für Dinge (Kleidung, Fundstücke). Getragenes zählt nicht mit. Das Startoutfit
(Leinenhemd, Leinenhose, Bastsandalen, Handwickel) trägt er von Anfang an, der Rucksack
ist am Start leer.

**Pilzholz und Stein liegen im Vorrat**, nicht im Rucksack: was der Envoy sammelt oder
findet, ist dort, sobald die Arbeit getan ist, auch wenn er noch unterwegs ist. Das wird
nicht erklärt (die Lager sind sozusagen magisch; man merkt es einfach). Ohne Lager fasst
der Vorrat **10 Stück je Art**, genug für das erste Lagerfeuer (8 Stein, 2 Pilzholz). Mit
**Steinlager** bzw. **Pilzlager** fasst er so viel, wie das Lager hält (Stufe 1: 20,
Stufe 2: 50, Stufe 3: 100). Der Vorrat zeigt es als „8 / 10“ bzw. „8 / 20“. Was nicht
mehr hineinpasst, bleibt liegen; das Fenster sagt es vorher, der Bericht nennt es.
Bannsplitter haben keine Grenze. Gebaut wird aus dem Vorrat.

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
Reiter „Rucksack“ mit seinen fünf Plätzen und, sobald es
sie gibt, Reiter „Aufbewahrung“. „Alle“ öffnet die Seite Inventar mit Suche, Filter nach
Slot und Sortierung (Slot, Stufe, Name, Neueste) und dem Getragenen.

### Das Lager

Das Lager liegt auf dem Trümmerfeld. Es hat eine **Stufe**: Stufe 0 ist der offene
Platz. Die erste Quest des Spiels ist „Ein Lagerfeuer errichten“ (8 Stein, 2 Pilzholz, 2
Energie); sie ist zugleich der Schluss der Führung durch Abenteuer (siehe Rundgänge).
Ist das Feuer errichtet, hat das Lager Stufe 1, das Bild zeigt das Feuer, und das Lager
kann eingerichtet werden.

**Fünf Lagerstufen** (Blatt `Lagerstufen` in `welt.xlsx`). Jede Zeile nennt, was das
Aufwerten auf die nächste Stufe braucht:

| Stufe | Name | Aufwerten auf die nächste: Hygge | Kosten |
| --- | --- | --- | --- |
| 1 | Provisorisches Lager | 5 | 20 Stein, 20 Pilzholz, 22 Energie |
| 2 | Unterstand | 14 | 50 + 50, 45 Energie |
| 3 | Wackelige Hütte | 36 | 80 + 80, 85 Energie |
| 4 | Stabile Hütte | 90 | 100 + 100, 130 Energie |
| 5 | Steinhäuschen | – | – |

Aufwerten ist kein Muss. Es kostet immer etwa eine volle Ladung der Lager der Stufe davor,
und die **Energie wird am Stück** gebraucht: Die Leiste muss lang genug sein, und die
wächst nur mit der echten Ausdauer-Aufgabe (der Schlafplatz hilft, weil er morgens über
das Ende der Leiste füllt). Wer jeden Tag die Ausdauer-Aufgabe macht, kommt frühestens
etwa an Tag 5, 12, 22 und 34 auf die Stufen 2 bis 5; wer Tage auslässt, später. Mehr
Training verlangt das nicht, nur Regelmäßigkeit. Einrichtungen und Deko bleiben beim
Aufwerten stehen.

**„Lager aufwerten“** (Knopf auf dem Bild) trägt ein Schloss, solange das Hygge nicht
reicht; Antippen oder darauf zeigen sagt, wie viel es braucht („Dafür braucht das Lager 14
Hygge.“). Reicht es, glimmt der Knopf und öffnet ein Fenster: die neue Stufe mit ihrem
Text, was es braucht (Hygge, Stein, Pilzholz, mit Haken oder Schloss), „Einrichtungen und
Deko bleiben stehen.“, die Energie-Leiste und „Aufwerten“. Gebaut wird es wie alles im
Lager, in echter Zeit; die Quest heißt nach der neuen Stufe („Unterstand bauen“), der
Bericht sagt „Das Lager ist jetzt: Unterstand.“ Auf der höchsten Stufe sagt der Knopf
„Weitere Stufen folgen später.“

**Vier Einrichtungen**, jede in Stufen mit eigenem Namen (Blatt `Einrichtungen`). Sie sind
keine Quests und stehen nicht auf der Karte, nur auf der Lager-Seite. Gebaut wird wie
eine Quest am Lager: aus Material und Energie, in echter Zeit („fertig um“). Jede Stufe
einer Einrichtung braucht die gleiche Lagerstufe (Stufe 2 der Einrichtung ab
Lagerstufe 2 usw.). Eine Stufe ersetzt die vorige, auch beim Hygge. Die Kosten einer
Stufe passen immer in die Lager der Stufe davor.

| Einrichtung | Stufen (Name, Wirkung, Hygge) |
| --- | --- |
| Steinlager | Steinstapel (fasst 20, 1), Steinkiste (50, 2), Steinschuppen (100, 3) |
| Pilzlager | Pilzholzstapel (20, 1), Pilzholzgestell (50, 2), Pilzholzschuppen (100, 3) |
| Aufbewahrung | Krempelplatz (6 Plätze, 2), Kiste (10, 3), Truhe (15, 4), Kleiderschrank (24, 5) |
| Schlafplatz | Raspelnest (+20 % Energie am Morgen, 3), Pilzmatte (+25 %, 4), Schlafpodest (+30 %, 5), Bett (+35 %, 6), Himmelbett (+40 %, 7) |

Stein- und Pilzlager enden mit dem Schuppen auf Stufe 3; ein Schuppen kann neben dem Haus
jeder späteren Stufe stehen bleiben. Mehr Hygge gibt es danach vor allem über Deko. Der
Reiter im Rucksack heißt weiter „Aufbewahrung“, die Kacheln heißen nach ihrer Stufe.

**„Lager einrichten“** (Knopf auf dem Bild des Lagers) öffnet die vier Einrichtungen als
Kacheln, ab Lagerstufe 2 dazu eine fünfte für die Deko. Eine Kachel zeigt ein großes
Zeichen, daran eine kleine Medaille mit dem Hygge der jetzigen Stufe (wie die große auf
dem Bild), den Namen und darunter die Kosten des nächsten Schritts als kleine Bilder
(Pilzholz, Stein, Energie mit Zahl; was fehlt, orange), bei einer stehenden Einrichtung
mit „Ausbau: Steinkiste“ darüber. Stehende Einrichtungen leuchten (das Zeichen kupfern mit
Haken), was gerade gebaut werden kann, glimmt, das andere ist dunkler. Ein Tipp zeigt
mehr: Text, was sie bringt, Hygge; bei einem möglichen Ausbau darunter die nächste Stufe
mit Text, Wirkung, „Hygge 2 statt 1“, Kosten, die Energie-Leiste und „Ausbauen“; geht der
Ausbau erst mit der nächsten Lagerstufe, steht das da. Der Knopf „Lager einrichten“
glimmt, solange gerade etwas gebaut werden kann.

**Hygge** ist die Summe der Einrichtungen und der gebauten Deko. Es steht auf dem Bild des
Lagers als runde Medaille mit der Zahl und „Hygge“, ohne Fortschrittsanzeige und ohne
Ziel. Ab Stufe 2 reichen die Einrichtungen nicht mehr: Auf Stufe 2 muss die eine Deko der
Stufe gebaut werden, auf Stufe 3 braucht es 2 bis 3 gefundene Pläne mehr, auf Stufe 4 etwa
5 der dortigen (und alle der Stufen davor). Knöpfe und Anzeigen folgen dem Stil der App:
kreisrund oder rechteckig, nicht oval.

**Deko** (Blatt `Deko`) gibt es ab Lagerstufe 2. Eine Deko gibt mindestens so viel Hygge wie
das Bett ihrer Stufe und mehr als ein Lager oder die Aufbewahrung. Sie wird gebaut wie eine
Einrichtung (Material, Energie, Zeit) und bleibt beim Aufwerten stehen. Gebaut werden kann
sie nur mit ihrem **Plan**. Je Stufe ist ein Plan gleich da (Fundort `start`), die anderen
muss der Envoy finden:

| Stufe | Deko (Hygge) | Plan |
| --- | --- | --- |
| 2 | Pilzkappenschale (4) | gleich da |
| 3 | Steinbank (5) | gleich da |
| 3 | Wasserkrug (5) | Stilles Ufer, selten |
| 3 | Kräuterbund (6) | Stille Quelle, selten |
| 3 | Windspiel (6) | Geister, sehr selten |
| 3 | Teppich (7) | Händler, selten (40 Bannsplitter) |
| 4 | Kamin (8) | gleich da |
| 4 | Laterne (6) | Die lange Straße, sehr selten |
| 4 | Leuchtmooskasten (6) | Pilzhain, sehr selten |
| 4 | Pilzholztisch (7) | Händler, selten (60 Bannsplitter) |
| 4 | Steinregal (7) | Alter Steinbruch, sehr selten |
| 4 | Wandbehang (7) | Wache an der Furt, sehr selten |
| 4 | Nebelspiegel (8) | Mondsee, kostbar |
| 4 | Sternkarte (8) | Eine Nacht am Mondsee, sehr selten |
| 4 | Klangschale (9) | Echohöhle, selten |
| 4 | Splitterschale (9) | Geister, kostbar |

**Pläne finden** (`js/world/plans.js`): Gesucht wird erst, wenn das Lager die Stufe der
Deko erreicht hat, und nur an ihrem Fundort. Dort ist jede Zeit eine Chance: je **10
Minuten Arbeit** an dem Ort (die Minuten aus der Tabelle, nicht durch Werte verkürzt; als
Fundort kann auch eine einzelne wiederholbare Quest stehen), bei `geister` **jeder
Geist**, dem der Envoy begegnet, beim Händler **jeder Tag**. Ein seltener Plan braucht im
Schnitt 6 Chancen, ein sehr seltener 12, ein kostbarer 24. Pech hält nicht an: Nach
doppelt so vielen Chancen ist der Plan sicher da (das sieht man nicht). Gewürfelt wird mit
dem Rest der Quest, wenn sie beginnt; gefunden ist der Plan, wenn die Arbeit getan ist.
Der Bericht sagt „Plan gefunden: Windspiel“. Beim Händler liegt ein Plan an manchen Tagen
mit im Angebot („Plan: Teppich“, mit Hygge und Preis); gekauft ist er gefunden und kein
Ding im Rucksack. Wo ein Plan liegt, sagt das Spiel nicht.

Die Kachel **„Deko“** zeigt, wie viele stehen („3 / 6“), und öffnet die Liste aller Deko der
erreichten Stufen, in der Reihenfolge der Tabelle. Bekannte zeigen Bild (oder das
Deko-Zeichen, solange es keins gibt), Name, Hygge-Medaille und Kosten, gebaute leuchten;
solche ohne Plan sind grau, gestrichelt, mit Schloss, „?“ und „Plan fehlt“, ohne Namen und
Bild. Ein Tipp auf eine bekannte öffnet sie mit Text, Hygge, Kosten, Energie-Leiste und
„Bauen“.

**Das Bild des Lagers** setzt sich aus Ebenen zusammen: das Grundbild der Stufe
(`assets/lager/stufe_<n>_<zeit>.jpg`; fehlt es, das der Stufe davor; fehlt die Tageszeit,
das Tagesbild getönt), darauf jede stehende Einrichtung auf ihrer Stufe
(`assets/lager/einrichtung_<id>_<stufe>.png`; fehlt die Zeichnung, die der Stufe davor)
und jede gebaute Deko (`assets/lager/deko_<id>.png`), wo es eine Zeichnung gibt. Ebenen
sind 1792 × 672 wie das Grundbild, transparent, an ihrem Platz gezeichnet; zu anderen
Tageszeiten werden sie getönt wie das Bild. Ab Stufe 2 ist das Lager ein Haus mit offener
Vorderseite: Der Boden liegt auf jeder Stufe an derselben Stelle, nur Wände und Dach
wachsen; das Feuer bleibt vor dem Haus, die Schuppen stehen daneben, jede Deko hat einen
festen Platz (Vorschlag in `tools/vorlagen/lager-schablone.png`).

Die Zeichnungen der Einrichtungen (von der Nutzerin mit Midjourney erzeugt, alle 15
Stufen) liegen freigestellt in `tools/lager-ebenen/` (`steinlager_2.png` usw.).
`tools/lager_ebenen.py` setzt jede an ihren Platz und in ihre Größe (Tabelle `PLACES`:
Mitte, Bodenlinie, Breite in Pixeln des Lagerbilds), legt einen weichen Schatten darunter
und schreibt die Ebene nach `assets/lager/`. Solange es nur das Bild des offenen Lagers
gibt, stehen alle in der hinteren Reihe hinter Felsen und Feuer: links das Steinlager,
in der Mitte Schlafplatz und Aufbewahrung, rechts das Pilzlager. Gibt es das Haus, werden
nur die Zahlen der Tabelle angepasst.

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
| Lagerstufen 2 bis 5, höhere Stufen der Einrichtungen, Deko | Hygge (siehe Das Lager) |
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
  der Envoy sitzen, wenn er da ist); sobald das Feuer brennt, darauf das Hygge (als Zahl
  in einer runden Medaille) und die Knöpfe „Lager einrichten“ und „Lager aufwerten“ (siehe
  Das Lager). Darunter Datum, ob der Envoy da oder unterwegs ist, und die Stufe („Stufe
  1 · Provisorisches Lager“). Solange es kein Feuer gibt, steht oben „Als Erstes“: „Dein Envoy
  wird eine Weile hier bleiben. Am besten errichtest du ein Lagerfeuer.“ mit einem Knopf
  zur Quest. Dann laufende Expedition oder Bericht, Vorrat mit Energie und, auf dem iPad
  daneben, heute gesichtete Geister und Hinweise. Auf dem Telefon ist das Bild 4:3, damit
  Hygge und Knöpfe Platz haben, auf dem iPad 8:3.
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
  und Expedition. Keine unerklärten Zahlen auf der Karte. Ein Tipp auf einen Ort fächert
  seine Quests auf (siehe Quests auf der Karte).
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
    Sammelquest, „In Reihe“ nach der ersten Rückkehr, Erfolge, Lagerausbau, Händler,
    Talentbaum) und tragen „Neu“, bis sie
    gelesen sind. Das Handbuch im Menü glüht, bis man es geöffnet hat.
  - **Tageswerk**: zuerst heute, dann alle früheren Tage, so viele je Seite, wie passen:
    welche Übung, erledigt oder nicht, mit Gewinn.
  - **Quests**: jede beendete Quest, neueste zuerst, mit Ort, Zeit und Ausgang (die
    Quests einer Reihe einzeln).
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
sie die der ersten. Für Icons gilt dasselbe: eine eigene Fassung mit gleichem Namen in
`assets/icons/<Ordner der Figur>/`, sonst das Icon der ersten Figur. Der Mann hat eigene
Fassungen von Leinenhemd, Leinenhose und Griffhandschuhen, jeweils mit eigenem Icon.

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
Bilder: Monster 512 × 512, Lager `assets/lager/stufe_<n>_<zeit>.jpg` (1792 × 672, Seitenverhältnis 8:3; Zeit = `morgen`, `tag`, `abend`, `nacht`; Stufe 0 = ohne Feuer, bisher nur `tag`; Stufe 1 = Lagerfeuer; fehlt eine Stufe, gilt die davor), Ebenen des Lagers `assets/lager/einrichtung_<id>_<stufe>.png` und `assets/lager/deko_<id>.png` (1792 × 672, transparent, siehe Das Lager), Portraits `portrait.png` im Ordner jeder Figur (quadratisch, Hintergrund frei), Karte im Seitenverhältnis 3:2
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
- `data/welt.xlsx`: Blätter Orte, Monster, Quests, Lagerstufen, Einrichtungen, Deko. Orte
  haben einen typ: lager (genau einer), truemmerfeld (höchstens einer: gleich beim Lager,
  dort wird ohne Weg gesammelt), wild, sammeln, ort, hoehle. Das Blatt Quests hat: id, name, ort, art (sammeln, erkunden, bauen, kampf, hoehle), text
  (mehrere Absätze durch Zeilenumbruch), monster, voraussetzung (auch `lager>=1`),
  tempo, ertrag, verbrauch, kosten (Energie vor Ort, zugleich Minuten), belohnung
  (auch `freischaltung:lagerfeuer`), wiederholbar, abklingzeit, aktiv (nein = vorerst
  nicht im Spiel); in der belohnung auch `plan:<id>` (ein Plan für Deko, sicher).
  Lagerstufen: stufe, name, hygge_bis_naechste, stein, pilzholz, energie (was das
  Aufwerten auf die nächste Stufe braucht; leer auf der letzten), beschreibung.
  Einrichtungen (eine Zeile je Stufe): id (steinlager, pilzlager, aufbewahrung,
  schlafplatz), stufe, name, lagerstufe, pilzholz, stein, energie, hygge, kapazitaet,
  bonus, beschreibung. Deko: id, name, lagerstufe (ab 2), hygge, fundort (start,
  geister, haendler, eine Orts-id oder die id einer wiederholbaren Quest), seltenheit
  (selten, sehr selten, kostbar), preis (nur beim Händler), pilzholz, stein, energie,
  beschreibung, datei_icon. Die Umwandlung prüft, dass jeder Fundort sich wieder und
  wieder absuchen lässt, und findet die Ebenen des Lagerbilds selbst.

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
  der Vorrat, die Energie („Alles, was er tut, kostet
  Energie. Steigt seine Ausdauer, steigt auch seine Energie.“), die laufende Expedition,
  die Legende und zuletzt das Lager: „Dein Envoy wird eine Weile hier bleiben. Am
  besten errichtest du ein Lagerfeuer.“ Tippt man das Lager an, nennt die Quest „Ein
  Lagerfeuer errichten“, was der Envoy braucht, dass alles Energie kostet, dass die
  Energie mit der Ausdauer wächst, und was zu sammeln ist (8 Steine, 2 Pilzholz).
- **Rundgang durch das Lager** beim ersten Öffnen, nachdem das Feuer brennt, drei
  Schritte: „Dein Envoy hat das Lagerfeuer errichtet.“ (das Bild), „Ab jetzt kannst du
  das Lager einrichten.“ (der Knopf „Lager einrichten“), „Hat es genug Hygge, kannst du es
  aufwerten.“ (das Hygge auf dem Bild). Die Ausrufezeichen der ersten Fassung sind weg
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
  Auf dem Server hat sie ihr eigenes `sync-daten/`, also eigene Konten. Nur dort öffnet
  das Schild „Test“ ein Menü über der Seite: „Energie auffüllen“, „+50 Energie“ (über die
  Leiste hinaus, damit sich das Aufwerten ohne hohe Ausdauer ausprobieren lässt), „+25
  Stein“, „+25 Pilzholz“, „+50 Bannsplitter“, „Plan finden“ (der nächste noch nicht
  gefundene der erreichten Lagerstufen) und „Expedition beenden“ (Ereignis `test`;
  Material nur so viel, wie passt), damit sich alles ohne Warten ausprobieren lässt. Die
  echte Fassung zeigt es nie, ohne dass jemand daran denken muss.
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
| Rucksack | 5 Plätze, am Start leer, nur für Dinge; die Aufbewahrung (Einrichtung des Lagers) unterwegs nur einsehbar |
| Vorrat | Pilzholz und Stein nicht im Rucksack, sondern im Vorrat: ohne Lager 10 je Art, mit Stein- bzw. Pilzlager dessen Fassungsvermögen; gesammeltes ist sofort dort, ohne Erklärung |
| Konten | Name und Passwort auf dem eigenen Server; ohne Konto nur auf einem Gerät |
| Figuren | Frau und Mann zur Wahl, Haut- und Haarfarbe werden im Browser umgefärbt |
| Icons | aus den Zeichnungen der Ebenen freigestellt |
| Kleidung verwalten | Kleiderkammer auf claude.ai, mit Freigabe und verdeckten Spielangaben |
| Menü | fünf Punkte: Abenteuer, Talentbaum, Lager (Mitte, Start), Händler, Handbuch |
| Obere Leiste | Portrait mit vier Werte-Ringen (auch beim Envoy), Tageswerk-Knopf, Einstellungen |
| Handbuch | Buch mit Reitern: Anleitung, Tageswerk, Quests, Kompendium, Erfolge; füllt das Fenster, ohne zu scrollen |
| Einrichtungen | Steinlager, Pilzlager (je 3 Stufen), Aufbewahrung (4), Schlafplatz (5), jede Stufe mit eigenem Namen und ab der gleichen Lagerstufe; keine Quests, nur auf der Lager-Seite („Lager einrichten“, Kacheln) |
| Lagerstufen | Provisorisches Lager, Unterstand, Wackelige Hütte, Stabile Hütte, Steinhäuschen; Aufwerten mit Hygge 5, 14, 36, 90, Material und Energie am Stück |
| Deko | ab Lagerstufe 2, eine Kachel „Deko“ mit Liste; je Stufe ein Plan gleich da, die anderen gefunden (Ort, Geister, Händler), selten, sehr selten oder kostbar, nach doppelt so vielen Chancen sicher; nicht gefundene grau, ohne Namen; bleibt beim Aufwerten |
| Lagerbild aus Ebenen | Grundbild der Stufe, darauf Einrichtungen und Deko als eigene Ebenen; ab Stufe 2 ein Haus mit offener Vorderseite |
| Quests auf der Karte | Ort antippen fächert seine Quests auf (Siegel mit Namen), ein Tipp öffnet eine; der Fächer auch bei nur einer Quest |
| Ortsbeschreibung | Kartusche am Kartenrand zusammen mit dem Fächer: Region, Name, Text, bei verschlossenen Orten, was sie öffnet |
| Quest-Fenster | Text, Voraussetzung, Belohnung, Energie als Leiste: die Kosten als ein Block, der Weg darin kupfern getönt, „davon Weg 2“ (in der Reihe „statt 4“); keine Dauer, keine Tempo- und Ertrag-Stats |
| Einrichtungen-Kacheln | Hygge als kleine Medaille am Zeichen |
| In Reihe | während der Envoy unterwegs ist, alles anhängen (Quests, Sammeln, Bauen); er geht direkt weiter, der Rückweg dazwischen wird verrechnet; nur solange die Energie mit dem Rückweg reicht; Sammeln plant mit den besten Würfeln, brauchen sie mehr, fällt die letzte Aktion heraus |
| Energie | Name für die Leiste, 10 je Level Ausdauer, 1 Energie = 1 Minute |
| Sammeln | auf dem Trümmerfeld (eigener Ort gleich beim Lager) ohne Weg, 2 bis 4 Stück je Energie gewürfelt, nie weniger als 2; Menge wählen, beginnt bei 1 |
| Mehr sammeln als tragbar | geht nicht: + stoppt an der Grenze und sagt warum (statt hinterher etwas liegen lassen zu müssen) |
| Lagerfeuer | die erste Quest: 8 Stein, 2 Pilzholz, 2 Energie; macht Lagerstufe 1 |
| Hygge | Summe der Einrichtungen und der Deko; ab Stufe 2 reichen die Einrichtungen allein nicht; als Zahl auf dem Bild, ohne Fortschrittsanzeige |
| Test-Knöpfe | am Schild „Test“ oben links, schwebend über der Seite (verschiebt nichts): Energie auffüllen, +50 Energie (über die Leiste hinaus, zum Aufwerten), +25 Stein, +25 Pilzholz, +50 Bannsplitter, Plan finden (ab Lagerstufe 2), Expedition beenden; nur in der Testfassung |
| Bilder beim Neuzeichnen | schon geladene Bilder werden übernommen statt neu geladen, damit nichts aufblitzt (Kleidung des Envoy, Karte) |
| Formen | Knöpfe und Anzeigen kreisrund oder rechteckig, nicht oval |
| Lagerbild | nach Stufe und Tageszeit (Sonnenstand) |
| Erster Erfolg | „Angekommen“: +10 % Tageswerk und Sammeln, nur die ersten 15 Minuten |
| Lager aufwerten | Knopf auf dem Bild; Schloss, solange das Hygge nicht reicht (sagt beim Antippen, wie viel es braucht), glimmt, sobald es reicht, und öffnet dann das Fenster zum Aufwerten |
| Währung | Bannsplitter; dazu Pilzholz und Stein |
| Leichter Werkstoff | Pilzholz statt Holz (Quarz war zu schwer und zu spröde) |
| Optik | Petrol, Elfenbein, gebranntes Orange, Taubenblau; Adern über Stein; Menü aus runden Schilden |
| Scheitern | gibt es nicht; Stats bestimmen Zugang, Dauer und Ertrag |
| Expeditionen | echte Zeit für Hinweg, vor Ort und Rückweg, eine zur Zeit, beliebig verlängerbar; das Ergebnis zählt, sobald die Arbeit getan ist |
| Kampfergebnis | beim Aufbruch berechnet und gespeichert, zählt bei der Rückkehr |
| Startansicht | Lager; nur direkt nach dem ersten Erstellen eines Envoy die Envoy-Seite mit Rundgang |
| Wortwahl | „XP“ und „Level“ gibt es nur je Stat, nie für den Helden; Gewinne heißen „+14 Kraft“ |
| Talentbaum | Schild mit Schloss statt ausgegraut; eigene Seite, kein Fenster über der alten Ansicht |
| Rückgängig | nur für Tagesaufgaben am selben Tag |
