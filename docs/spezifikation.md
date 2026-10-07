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
| Ausdauer | Treppe | Leben im Kampf (tiefer in Höhlen), Größe der Energieleiste (10 Energie je Level), kürzere Wege |
| Beweglichkeit | Dehnen, Mobility | Treffer- und Ausweichchance, Zugang zu schwierigem Gelände |
| Gelassenheit | Atemübungen, Entspannung | Füllgeschwindigkeit der Energie, Geister beruhigen, kürzere Rast in den Tiefen, Zugang zu stillen Orten |

Die Hauptwirkung jedes Werts (so gewünscht, wichtig): **Kraft** macht mehr Schaden, **Ausdauer**
eine größere Energie-Leiste, **Beweglichkeit** besseres Ausweichen (und Treffen),
**Gelassenheit** füllt die Energie schneller (+3 % je Level). Zeigt man auf einen Wert, steht da,
was er bewirkt (seit 5.18, `wirkung` in `STATS`, `js/ui/tips.js`): mit der Maus beim
Darüberfahren, auf Telefon und iPad beim Antippen. So bei den Ringen um das Portrait, den Werten
auf der Envoy-Seite, den Kampfwerten (welcher Wert sie wachsen lässt), der Energie-Leiste und
der Kampftabelle in den Tiefen. Das Fenster eines Werts zeigt dazu die Zahlen für das Level jetzt
(ohne Kleidung): Kraft Schaden je Treffer und Steinwürfel, Ausdauer Energie-Leiste und Leben,
Beweglichkeit Ausweichen, Treffer und Pilzholzwürfel, Gelassenheit wie viel schneller die
Energie sich füllt, Beruhigen und Rast in den Tiefen. Die Kampfwerte auf der Envoy-Seite gelten
gegen einen Geist der Stufe 1, damit das Wachsen der Werte sichtbar bleibt.

## Tagesaufgaben

Jeden Tag gibt die App genau vier Aufgaben vor, eine je Bereich. Sie sind **nicht
auswählbar**. Jeder Bereich ist **eine Einheit**: alle seine Übungen, jeden Tag, in
derselben Reihenfolge. Nichts rotiert; Konstanz trägt. Die App entscheidet, auf welcher
Stufe jede Übung gemacht wird.

| Bereich | Stat | Einheit | Stufen |
| --- | --- | --- | --- |
| Tiefenmuskulatur | Kraft | Der halbe Käfer, Der Vogelhund, Der Seitstütz, je 1 Minute | je Übung 3 |
| Treppe | Ausdauer | Treppensteigen: 3 Minuten, 5 Minuten, 5 Minuten mit Tempowechsel | 3 |
| Stretching / Mobility | Beweglichkeit | Katze und Kuh 1 Minute, kniender Ausfallschritt und Brustöffner je Seite 1 Minute | keine |
| Entspannung | Gelassenheit | Innehalten: Ankommen 2 Minuten, Der Atem 3 Minuten, Durch den Körper 5 Minuten | 3 |

Spazieren und Rad gibt es vorerst nicht im Tageswerk; sie können später über den
Talentbaum dazukommen. Die Übungen stehen in `data/uebungen.xlsx`, eine Zeile je Übung
und Stufe (siehe Tabellen).

### Kinder und Jugendliche

Bei der Erstellung des Envoy wird das Alter gefragt (4 bis 120, Kinder können das leichter
als ein Geburtsjahr). Die App behält daraus das Geburtsjahr (Feld `geburtsjahr` im
Ereignis `envoy`) und rechnet das Alter jedes Jahr neu: Alter = Jahr des Tages −
Geburtsjahr. Danach richten sich die Übungen; die Spalte `alter` der Tabelle sagt, für wen
eine Übung ist („bis 8“, „9-12“, „ab 13“, „alle“; leer = Erwachsene ab 16). Jedes Alter hat
in jedem Bereich eine Einheit von 14 bis 28 XP; der Konverter prüft das für jedes Alter.

| Alter | Kraft | Ausdauer | Beweglichkeit | Gelassenheit |
| --- | --- | --- | --- | --- |
| bis 8 | Bärengang, Flieger, Froschsprünge | Hampel-Runden | Baum, Hund, Kobra | Teddy-Atmen |
| 9 bis 12 | Bärengang, Brett, Flieger | Hampel-Runden | Hund, Kobra, Schmetterling | Ballon-Atmen |
| 13 bis 15 | Brett, Vogelhund, Seitstütz | Treppe | Hund, Kobra, Schmetterling | Innehalten |
| ab 16 | Käfer, Vogelhund, Seitstütz | Treppe | Katze-Kuh, Ausfallschritt, Brustöffner | Innehalten |

Die Kinderübungen sind bildhaft und ohne Becken-Anweisungen (Tiere, Springen, ein
Kuscheltier auf dem Bauch); Jugendliche haben teils die Übungen der Erwachsenen, statt
Käfer, Ausfallschritt und Brustöffner aber einfachere. XP gelten wie für alle. Kinder (bis
12) werden nach einer Übung nichts gefragt: Jeder Durchgang zählt als gut, nach drei
Durchgängen auf einer Stufe kommt die nächste („Das war heute zu viel“ gibt es auch für
sie). Jugendliche ab 13 werden gefragt wie Erwachsene. Die Hampel-Runden wechseln
Hampelmann, Laufen und Knie hoch; jeder Abschnitt hat im Timer seine eigene Figur. Ein Envoy
ohne Alter (aus der Zeit davor) wird beim ersten Start einmal gefragt: „Wie alt bist du?“.
Das Fenster liegt über allem und lässt sich nicht wegklicken; mit der Antwort richtet sich
das offene Tageswerk sofort nach dem Alter. Das Alter lässt sich in den Einstellungen
ändern (Aussehen, Name und Alter).

### Feste Zeit statt Menge

Jede Übung hat eine feste Zeit, keine Wiederholungszahl. Gemacht wird langsam und nur
so viel, wie sauber geht; Pausen sind in Ordnung. Ein **geführter Timer** begleitet
jeweils eine Übung: kurz bereit machen, die Übung, eine Seite und die andere (siehe
Timer). Die nächste Übung beginnt erst mit einem eigenen Tipp, damit Zeit bleibt, zu
lesen, wie sie geht. Messwerte werden nicht mehr eingetragen.

### Rückfrage nach der Übung

Jede Übung einer Einheit wird für sich abgehakt („Käfer erledigt“), damit keine aus
Versehen mit erledigt wird; die letzte erledigt die Aufgabe. Gleich nach einer Übung
(auch nach dem Timer) fragt die App ihre Frage, aber nur, solange es für diese Übung eine
nächste Stufe gibt, nie im Krankheitsmodus und nie Kinder (siehe Kinder und Jugendliche).
Die Antworten zählen für die Stufen, sobald die ganze Aufgabe erledigt ist; eine halb
erledigte Aufgabe zählt am nächsten Tag nicht. Die Fragen fragen nach dem Empfinden,
nicht danach, ob die Übung richtig gemacht wurde; jede Antwort ist eine ehrliche:

- Kraft (auch Brett, Bärengang, Flieger, Froschsprünge) und Treppe: „Wie war es?“ mit
  Locker (gut), Gut fordernd (zählt nicht), Zu viel (zu schwer).
- Gelassenheit: „Hätten es auch ein paar Minuten mehr sein dürfen?“ Ja oder Nein. Ob die
  Gedanken abgeschweift sind, wird nicht gefragt; das wäre eine Bewertung.
- Beweglichkeit: keine Frage, ein Tipp genügt.

Steht eine Übung der Einheit über Stufe 1, gibt es auf der Karte dazu „Das war heute zu
viel“: Das erledigt die Aufgabe und zählt für jede Übung der Einheit als zu schwer.

### Steigerung der Übungsintensität

- Jede Übung hat ihre eigene Stufe. **Hoch nach zwei guten Durchgängen in Folge, runter
  nach zwei zu schweren in Folge.** Ein Durchgang, der keins von beiden ist, beginnt die
  Zählung neu. Gezählt werden Durchgänge, nicht Kalendertage: Ein ausgelassener Tag
  setzt nichts zurück.
- Nach 7 ausgelassenen Tagen in Folge geht jede Übung des Bereichs eine Stufe runter
  (nach 14 Tagen noch eine usw.), damit der Wiedereinstieg leicht ist.
- Die neue Stufe gilt ab dem nächsten Tag. Auf der Karte steht sie mit ihrem Namen
  („Stufe 1 · Der Fußtipp“), nach einem Wechsel mit „Neue Stufe“. Die höchste Stufe ist
  kein Ende: Die Übung geht dort einfach weiter.
- Wer vor diesem Umbau schon Übungen gemacht hat, beginnt die neuen auf Stufe 1; die XP
  von damals bleiben.

### Krankheitsmodus

Es gibt keine Pausenregel für den Malus: Die Grundaufgaben sind absichtlich so
niedrigschwellig, dass sie auch bei kleiner Krankheit machbar sind. Der
Krankheitsmodus (Schalter auf der Tageswerk-Seite) setzt jede Übung auf Stufe 1; eine
Übung mit nur einer Stufe (Beweglichkeit) bekommt die halbe Zeit. Jede Aufgabe bringt
dann 14 XP. Es wird nichts gefragt, und Durchgänge im Krankheitsmodus zählen nicht für
die Stufen. Der Modus bleibt an, bis er ausgeschaltet wird.

## XP und Levelkurve

Jede erledigte Tagesaufgabe gibt XP auf ihren Stat. Der Stat steigt eine Stufe,
sobald die XP-Leiste voll ist.

**XP pro Aufgabe: 14 bis 28, Schnitt 20.** Die Höhe hängt am Umfang, nicht am Bereich.
Jede Übung trägt ihren Anteil bei (Spalte `xp`), die Aufgabe bringt die Summe ihrer
Übungen, bei jeder Mischung der Stufen zwischen 14 und 28: Kraft 14 (alle auf Stufe 1)
bis 26 (alle auf Stufe 3), Treppe 14, 20, 24, Beweglichkeit 20, Gelassenheit 14, 18, 24.

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

Ein Stat steht als Zahl mit drei Stellen nach dem Punkt, etwa **1.375**: vorn groß das
Level, hinter dem Punkt klein, wie weit es bis zum nächsten ist (der Anteil der XP dieses
Levels, in Tausendsteln). Es wird nie aufgerundet: Kurz vor dem nächsten Level steht 1.999,
die Zahl vorn ist immer das Level. Beim Höchstwert steht nur 100. Neben der Zahl liegt ein
Balken, der dasselbe zeigt. Wie viel eine Aufgabe bringt, steht nirgends als Zahl, denn
„+14 Kraft“ neben „Kraft 1.375“ wäre irreführend; eine Aufgabe zeigt nur, wofür sie zählt
(„für Kraft“). Nach dem Erledigen steigt der neue Wert aus ihrer Zeile auf („Kraft 1.375“),
ein kleines Licht in der Farbe des Werts fliegt von der Zeile zu seinem Ring am Portrait,
der Ring wächst dort sichtbar vom alten zum neuen Stand (nach einem neuen Level erst voll,
dann von vorn), mit einem hellen Punkt an seinem Ende, und Ring und Portrait glimmen kurz
in dieser Farbe auf (`topbar.js`, `celebrateStat`; ohne Bewegung, wenn das Gerät es so
eingestellt hat),
der Verlauf eines Werts zeigt je Tag „Erledigt“ oder „Pause“ und den Wert danach. Es gibt
kein Helden-XP und kein Heldenlevel, nur XP und Level je Stat.

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

**Hinweis am Tag danach** (so gewünscht, `js/ui/daynote.js`). Ist eine Aufgabe gestern
liegen geblieben und würde es den Wert etwas kosten, wenn sie auch heute liegen bleibt
(also nicht am ersten Tag in Folge, nicht am Bodensatz, nicht ohne bisherigen Gewinn;
`atStake` aus `js/replay.js`), erscheint beim ersten Öffnen des Tages einmal ein Fenster,
nach den Neuigkeiten und dem Alter: die Zeichen der betroffenen Werte, „Gestern blieb die
Aufgabe für Kraft liegen“ (mehrere: „Gestern blieben die Aufgaben für Kraft und
Gelassenheit liegen“, alle vier: „Gestern blieb das Tageswerk liegen“), darunter „Ein Tag
Pause kostet nichts. Bleibt sie heute auch liegen, verliert dein Envoy ab morgen etwas von
dem, was er sich bei Kraft erarbeitet hat.“ Den ersten Satz nur, wenn gestern der erste
Tag ohne die Aufgabe war. Knöpfe „Später“ und „Zum Tageswerk“; Esc oder ein Tipp daneben
schließt es. Einmal am Tag je Gerät (`dayNote` in den Einstellungen des Geräts). Ruhig und
sachlich, ohne Ausrufezeichen und ohne Zahl: Es soll warnen, nicht drängen (Punkt 2).

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

**Ausrüstung erhöht nie Stats** (Kraft, Ausdauer, Beweglichkeit, Gelassenheit). Sie stellt
Voraussetzungen und hilft in der Welt, mit Fähigkeiten und Boni. Sie soll wichtig sein, kein
optisches Extra (so gewünscht, 5.13):

| Effekt | Wirkung |
| --- | --- |
| schaden | mehr Schaden je Treffer |
| treffer | Trefferchance in Prozentpunkten |
| ausweichen | Ausweichchance in Prozentpunkten |
| beruhigen | Chance, einen Geist zu beruhigen |
| reise | kürzere Wege (mindestens 1); bis 5.11 auch weniger Energie je Weg |
| erholung | Energie füllt sich schneller |
| glueck | mehr Bannsplitter und öfter ein Fundstück |

### Güte und Boni (seit 5.13)

Jedes Stück Kleidung, das unterwegs gefunden wird, ein Geist fallen lässt oder der Händler
anbietet, bekommt eine **Güte**: schlicht (keine Boni), gut (1), selten (2), prächtig (3).
Wie wahrscheinlich welche Güte ist, hängt an der Herkunft (`QUALITY_CHANCES` in
`js/config.js`): unterwegs 35/40/19/6 % (seit 5.19 wie bei Geistern, vorher 55/30/12/3 %: was
Energie kostet, soll nicht schlechter sein als der Aushang ohne Energie), bei Geistern
35/40/19/6 %, beim Händler 25/45/24/6 %.
Die Boni werden aus den Effekten oben gezogen, jeder höchstens einmal je Stück (`BONUSES`):

| Bonus | bei Stärke 1 | je Level mehr |
| --- | --- | --- |
| schaden | 1 | 0,2 |
| treffer | 3 % | 0,6 |
| ausweichen | 3 % | 0,5 |
| beruhigen | 4 % | 0,8 |
| erholung | 8 % | 1,2 |
| glueck | 5 % | 1 |

Stärke = die des Envoy (Durchschnitt der vier Level, wenn das Stück auftaucht) plus die
Anforderung des Stücks (sein höchster verlangter Wert, ohne Anforderung 0). Seit 5.20.5, so
gewünscht: Was etwas verlangt, bietet in besonderem Maß etwas; es tragen kann nur, wer die
Werte durch das Tageswerk hat. Ein Stück mit Anforderung ist außerdem nie schlicht (der Anteil
von schlicht geht an gut). Ein Envoy mit Stärke 5 findet also ein Stück ohne Anforderung mit
Boni wie bei Stärke 5 (Treffer etwa +5 %, Glück +9 %), eins mit Kraft 8 wie bei Stärke 13
(Treffer etwa +10 %, Glück +17 %). Die Größe schwankt um ±20 %, mindestens 1. (5.20.4 kurz im
Testordner: halb Envoy, halb Anforderung.) Güte und Boni gehören dem Stück (`guete`, `bonus` am Ding, im Ereignis
gespeichert, `js/world/bonuses.js`) und zählen, solange es getragen wird, zusammen mit den
festen Effekten des Teils. Der Rahmen zeigt die Güte in Farbe (gut grün, selten blau,
prächtig gold), der Name steht klein beim Teil („Torso · Stufe 1 · Selten“). Jeder Bonus
macht das Stück beim Händler 40 % teurer, beim Verkauf ebenso mehr wert (`BONUS_PRICE`).
Ältere Stücke ohne Güte bleiben schlicht.

**Einweben** (seit 5.16, so gewünscht: ein Lieblingsteil behalten, ohne auf bessere Boni zu
verzichten): Am Lagerfeuer (Lagerstufe 1, nicht unterwegs) webt der Envoy die Kraft eines
Stücks in ein anderes für denselben Platz. Das behaltene Stück bleibt, wie es ist (Aussehen,
Farbe, Name, Voraussetzung) und übernimmt Güte und Boni des anderen; seine eigenen Boni gehen.
Das gebende Stück zerfällt zu Fäden und ist weg, auch wenn es getragen wurde. Es braucht Boni,
und der Envoy muss es jetzt tragen können (Voraussetzung erfüllt, passt zur Figur; seit 5.20.4,
so gewünscht: sonst ginge die Kraft eines Stücks, das er noch nicht tragen kann, in eins, das er
trägt; frühere Ereignisse ohne Feld `tragbar` zählen weiter);
eine feste Fähigkeit aus der Tabelle bleibt bei ihrem Stück und geht mit ihm. Es kostet nichts
weiter. Im Fenster eines Stücks: „Kraft einweben“, dann das gebende Stück wählen, vorher und
danach nebeneinander sehen, „Einweben“. Ereignis `weben` (`ziel`, `quelle`, `tragbar`, `js/world/weave.js`).

**Sechs Slots:** Kopf, Torso, Handwickel, Accessoire, Beinkleidung, Schuhe. Kein
Waffen-Slot, kein Gürtel, keine Schulterstücke. Die **Handwickel** sind das Gegenstück
zur Waffe: Wickelbandagen der Kampfkunst, sie tragen den Schadensbonus. Das
**Accessoire** ist der Platz für Besonderes: ein Umhang, ein Schal, eine Tasche (früher
hieß er Umhang; alte Kennungen beginnen noch mit `umhang_`).

**Voraussetzung.** Jedes Teil verlangt Mindestwerte in einem oder mehreren Stats.
**Bei Unterschreitung** fliegt das Teil nach Tagesende aus dem Slot, liegt danach im
Rucksack und wird nicht mehr gezeichnet. Das Charakterfenster zeigt, was abgelegt wurde
und warum.

### Kleidung: viele Fundstücke in eigenen Farben

Die meiste Kleidung bringt keine feste Fähigkeit, sondern Vielfalt und gewürfelte Boni (siehe Güte und Boni): Die Teile der Kleiderkammer
(bisher 55, Oberteile, Hosen, Sandalen, Armwickel) werden **unterwegs gefunden** (Herkunft
`fund`), auch bei Geistern und beim Händler. Feste Questbelohnungen, die für alle gleich
sind, bleiben wenige (Handwickel, Bastsandalen, Griffhandschuhe …).

- **Fund unterwegs:** jede Quest außer Bauen ist eine Chance, 3 % je Energie Arbeit, höchstens
  30 % je Quest. Der erste Fund kommt spätestens nach 5 Energie Arbeit (am ersten Tag) und ist
  sofort tragbar, jeder weitere spätestens nach 66 Energie ohne Fund (doppelter Schnitt).
  Welches Teil: eines, das zur Stärke des Envoy passt (±3 Level) und zu seiner Figur, meist
  (drei von vier) eines, das er gleich anziehen kann. `world.clothes` zählt mit.
- **Fußballtrikots:** Die drei Trikots der Kleiderkammer (Nr. 54, 65 und 81, mit echten
  Logos; die Nutzerin will sie drin haben, die App ist für die Familie) sind Fundstücke wie
  die anderen, aber immer wie gezeichnet (`faerbbar` nein): „Trikot mit der Acht“ (nur die
  Frau) und „Trikot mit der Null“ (beide Figuren). Wird die App größer, kommen sie wieder heraus.
- **Farben:** Ein Teil mit `faerbbar` bekommt beim Fund oder im Angebot des Händlers eine
  eigene Farbe, eine von zwölf (Moosgrün, Salbei, Petrol, Nachtblau, Taubenblau, Pflaume,
  Rostrot, Kupfer, Ocker, Sand, Altrosa, Schiefer) oder wie gezeichnet, alle gleich wahrscheinlich.
  Die Farbe gehört dem Stück (`farbe` am Ding, im Ereignis gespeichert); dasselbe Teil gibt es
  so in vielen Formen. Die App färbt die Zeichnung im Browser um: Muster, Schatten und Linien
  bleiben, ein buntes Teil dreht alle Farbtöne mit, ein schlichtes nimmt die Farbe ganz an; Haut
  in Sandalen und Armwickeln bleibt Haut. Das Icon wird aus der gefärbten Zeichnung geschnitten.
  Die Farbe steht klein beim Teil („Oberteil · Stufe 1 · Moosgrün“), im Bericht „Bandshirt in
  Moosgrün“.
- **Figur:** Jede Zeichnung passt einer Figur oder beiden (Spalte `figur`: Frau, Mann, beide).
  Teile für die andere Figur werden nicht gefunden, nicht angeboten, nicht angezogen und nicht
  gezeichnet („Passt nicht zu dieser Figur.“).
- Die Startkleidung und feste Questbelohnungen sind nicht färbbar.

## Spielwelt

Die Zwischenwelt ist steinig, trümmerhaft und ätherisch: Geröll, umgestürzte Säulen,
Riesenpilze, Nebel. Regionen: Trümmerebene, Nebelmark, Grenzland, Aschenland, Nordland.

### Grundsatz: nichts scheitert

Scheitern spielt keine Rolle. Die Stats entscheiden, **ob** eine Quest überhaupt offen
ist (Voraussetzung), **wie lange** sie dauert und **wie viel** sie bringt. Wer eine
Quest beginnen kann, bringt immer etwas zurück.

### Expeditionen in Echtzeit

Jede Unternehmung ist eine Expedition vom Lager aus: Hinweg, die Arbeit vor Ort,
Rückweg. Alle drei Teile dauern echte Zeit; eine dreiteilige Leiste zeigt, wo der
Envoy gerade ist und wann die Expedition endet. Auf der Karte wandert seine Marke den Weg
entlang. Es läuft immer nur eine Expedition; solange sie läuft, lässt sich ihr aber mehr
**anhängen** (siehe „In Reihe“ unten): dann geht der Envoy von Ort zu Ort und erst am
Ende zurück ins Lager.

**Zeit folgt Energie: Jede Energie dauert zehn Sekunden.** Was viel Energie kostet,
dauert entsprechend länger; was wenig kostet, ist in Sekunden erledigt. Die Spanne reicht
von zehn Sekunden (etwas auflesen gleich neben dem Lager) bis gut eine Viertelstunde (eine
Nacht am Mondsee, bis zum Horizont). Lange Quests brauchen eine lange Leiste und damit
den Wert Ausdauer. Die Leiste begrenzt, wie viel an einem Stück geht; ist sie leer, ist
Pause. **Wege kosten keine Energie, nur Zeit.** (Der Begriff „Energie“ steht für das, was
verbraucht wird; „Ausdauer“ bleibt der Wert. Im Code heißt die Energie weiter `stamina`.)

Bis Version 5.11 dauerte jede Energie eine Minute, und die Wege kosteten Energie wie die
Arbeit. Die Nutzerin fand das in der Praxis langweilig: Alles dauerte Minuten, und mehr als
zwei, drei Sachen am Tag gingen nicht. Seit 5.12 gelten die neuen Regeln; ein Ereignis trägt
dafür `regel: 2` (`RULE_SETS` in `js/config.js`). Ältere Ereignisse behalten die alten Regeln,
so dass ein Spielstand von vorher genau so bleibt, wie er war.

- **Weg** (je Richtung) = Entfernung ÷ 20, gerundet, mindestens 1, je Punkt zehn Sekunden.
  Mit jedem Level Ausdauer 3 % kürzer, höchstens auf die Hälfte. Stiefel und Umhänge können
  ihn kürzer machen, ein überfüllter Rucksack verlängert jeden Weg um 1. Die Karte ist
  1,5-mal so breit wie hoch, das fließt in die Entfernung ein. Am Lager selbst und auf
  dem Trümmerfeld gleich daneben gibt es keinen Weg; ein Weg vom Trümmerfeld aus ist
  ein Weg vom Lager aus, ein Weg zum Trümmerfeld ist der Weg ins Lager.
- **Vor Ort** = die Kosten aus der Tabelle. Bei Sammeln, Erkunden und Bauen macht jedes
  Level der unter „Tempo“ genannten Stats die Arbeit 4 % kürzer und damit billiger,
  höchstens auf die Hälfte. Kämpfe dauern so lange, wie die Tabelle sagt, gleich wie
  viele Runden sie gehen.
- **Energie** der Expedition = vor Ort, **Dauer** = (2 × Weg + vor Ort) × zehn Sekunden.
  Die Energie wird beim Aufbruch beiseitegelegt (beim Sammeln, was die besten Würfel
  brauchen; den Rest nimmt sich der Envoy, wenn er dort ankommt).
- Das Ergebnis wird beim Aufbruch berechnet und als Ereignis gespeichert und zählt,
  sobald die Arbeit dort getan ist: Material liegt dann schon im Vorrat, auch wenn der
  Envoy noch unterwegs ist. Material zum Bauen nimmt er mit, wenn er dafür aufbricht.
- **Mitverfolgen.** Über der Leiste zeigt ein Bild, was der Envoy gerade tut
  (`js/ui/scene.js`): auf dem Weg ein kleiner Pfad vom einen Ort zum nächsten, auf dem er
  läuft; bei einem Kampf er und der Geist mit ihren Lebensleisten, Runde für Runde
  (Treffer und Gegentreffer steigen als Zahl auf, wer getroffen wird, wackelt; ein
  beruhigter Geist leuchtet auf und verblasst; die Zeile darunter sagt, was in der Runde
  geschah, am Ende „besiegt“, „beruhigt“ oder „Der Envoy zieht sich zurück“); beim Sammeln
  ein Zähler, der mit jeder Energie um den Wurf wächst; sonst die Suche (oder das Bauen) mit
  einer Leiste; auf dem Rückweg, was er trägt. Unter der Leiste das **Tagebuch** der Reise
  mit Uhrzeit: Aufbruch, Ankunft, Geist taucht auf, wie der Kampf ausging, gesammelt,
  gefunden, Rückweg (die letzten vier Zeilen, die neueste hebt sich kurz hervor). Auf der
  Karte steigt bei jedem Fund und jedem überstandenen Kampf ein kurzes Wort vom Envoy auf
  („+3 Stein“, „Nebelwicht besiegt“). Alles folgt aus dem beim Aufbruch berechneten
  Ergebnis: Kämpfe füllen gut vier Fünftel der Zeit vor Ort, die Runden gleichmäßig verteilt,
  Funde erscheinen am Ende der Arbeit. Es ist auf jedem Gerät und nach jedem Neuladen
  gleich und ändert nichts am Spiel.
- **Unterwegs-Schild.** Solange der Envoy unterwegs ist, schwebt auf jeder Seite außer
  der Karte ein Schild über dem Menü (`js/ui/tripsign.js`): ein Bild (der laufende Envoy,
  das Material, der Geist, die Suche), was er gerade tut („Sammelt Pilzholz“, „Auf dem Weg:
  Pilzhain“, „Kampf: Nebelwicht“), beim Sammeln der Stand („5 / 8“), die Restzeit und eine
  dünne Leiste für die ganze Reise. Jeder Fund steigt daraus auf („+3 Pilzholz“); fallen
  beim Sammeln beide Würfel, heißt er „Glücksgriff“ und leuchtet golden (auch auf der
  Karte). Ein Tipp führt zur Karte. Ist er zurück und der Bericht wartet, glimmt das
  Schild („Der Envoy ist zurück · Bericht ansehen“) und führt ins Lager.
- Zurück im Lager erscheint einmal ein Bericht: Kämpfe, Mitgebrachtes, Neues im
  Kompendium, bei zu wenig Platz auch, was liegen blieb. Er entfaltet sich: erst die Geister,
  dann jeder Fund einzeln, der kurz aufleuchtet, die Mengen zählen hoch, Neues (das
  Lagerfeuer, der Händler) leuchtet zuletzt. Nach mehreren Stationen ein
  Bericht mit einem Abschnitt je Station; im Handbuch steht jede Quest einzeln.

**In Reihe.** Solange der Envoy unterwegs ist, lässt sich ihm alles anhängen, was er tun
kann: Quests, Begegnungen, Sammeln auf dem Trümmerfeld, das Lagerfeuer und die
Einrichtungen. Er geht dann vom letzten Ort direkt zum nächsten statt zwischendurch ins
Lager; das spart Zeit, und eine lange Reihe füllt eine lange Zeit ohne App.

- Der erste Schritt ist ein ganz normaler Aufbruch. Während der Envoy unterwegs ist,
  heißt derselbe Knopf in jedem Fenster „Anhängen“ (im Quest-Fenster, beim Sammeln und
  bei den Einrichtungen).
- **Der Weg** zur angehängten Aktion beginnt am Ort der letzten. Ist er schon auf dem
  Rückweg, kehrt er dort um, wo er gerade ist (für etwas am Lager geht er einfach weiter).
  (Hängt etwas an einer Aktion nach den alten Regeln, kommt deren Energie für den Rückweg
  zurück, den er nun nicht mehr geht.)
- **Anhängen geht, solange die Energie jetzt für die Arbeit dort reicht.** Beim Sammeln
  zählt dabei, was die besten Würfel brauchen. Brauchen die
  Würfel dort mehr, als die Leiste dann hergibt, fällt die letzte Aktion der Reihe heraus
  (ihre Energie kommt zurück), so dass eingeplantes Material sicher gesammelt wird; erst
  wenn nichts mehr herausfallen kann, sammelt der Envoy, solange die Energie reicht. Was
  sofort beginnt (ein Aufbruch aus dem Lager), muss auch mit den schlechtesten Würfeln
  passen.
- **Was die Reihe bringt, zählt für das Spätere schon mit**: Material, das sie sammelt,
  erfüllt die Voraussetzung einer späteren Quest (Stein, Pilzholz, dann das Lagerfeuer),
  und beim Platz im Vorrat zählt, was vorher hinzukommt. Ebenso eine Lagerstufe: Während das
  Lager aufgewertet wird, zeigen die Einrichtungen schon ihren Ausbau, und die Deko der neuen
  Stufe lässt sich anhängen. Fehlt beim Aufbruch zu einem Bau doch
  Material, fällt der Bau heraus und die Energie kommt zurück. Das Fenster zeigt die Welt,
  wie sie nach der Reihe sein wird („Nach der Reihe im Vorrat …“).
- Unterwegs zeigt die Leiste einen Block je Aktion (Weg kupfern, Arbeit hell), jeden mit
  seiner Dauer („10 Sek.“, „2 Min.“), und den
  Rückweg, darüber die gerade laufende Aktion und den Weg „Das Lager – Stilles Ufer –
  Pilzhain – Das Lager“, darunter die Reihe: erledigt (Haken), jetzt (kupfern), wartend.
  Die letzte wartende lässt sich mit × herausnehmen, ihre Energie kommt zurück. Auf der
  Karte trägt jeder Ort, der noch dran ist, seine Nummer in der Reihe, auch im Fächer.
- Nach der Rückkehr ein Bericht mit einem Abschnitt je Station; was herausgefallen ist,
  steht dort („Ausgelassen: … Dafür reichte die Energie nicht mehr.“).

**Quests als Liste.** Neben der Karte (auf dem Telefon darunter) stehen alle Quests der
offenen Orte als Liste (`js/ui/questlist.js`): Name, Ort, Energie und was sie bringt, als
kleine Zeichen (Material mit Menge, Bannsplitter, ein Kleidungsstück mit Namen,
„vielleicht ein Fundstück“ bei Geistern, „vielleicht ein Plan“, wo einer liegen kann,
„Neues“ für Freischaltungen). Was gerade nicht geht, steht blasser mit dem Grund („Braucht:
Kraft 4“, „Wieder ab Mo., 6. Okt.“, „Gerade zu wenig Energie“). Darüber Filter nach dem,
was man gerade braucht (Alle, Pilzholz, Stein, Bannsplitter, Kleidung, Pläne, Neues, je mit
Anzahl; nur die, die es gibt) und die Reihenfolge (Machbar zuerst, Wenig Energie zuerst,
Nach Ort); beides merkt sich das Gerät. Ein Tipp auf eine Quest lässt ihren Ort auf der
Karte aufleuchten, öffnet dort den Fächer und hebt die Quest darin hervor; auf dem Telefon
kommt die Karte dafür ins Bild. Auf dem iPad quer steht die Liste rechts unter Vorrat und
Expedition und scrollt für sich.

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
die Quest kostet als ein Block, dazu „kostet 3 von 10“. Wege kosten keine Energie und
stehen dort nicht (bis 5.11 war der Weg im Block kupfern getönt, „davon Weg 2“). Passt die
Belohnung nicht mehr ganz in den Vorrat, steht dort „In den Vorrat passen davon nur
6 Stein.“ Keine Dauer, kein „etwa“ oder
„höchstens“, keine Stats für Tempo oder Ertrag: Die Dauer folgt der Energie, und
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
- Jede erledigte Aufgabe des Tageswerks gibt ein Viertel der Leiste dazu, auch über ihr
  Ende hinaus: Wer sein Tageswerk morgens mit voller Leiste macht, verschenkt nichts.
  Alle vier zusammen sind eine ganze Leiste. (Bis 5.11 ein Achtel; eine Aufgabe von
  vorher behält ihr Achtel, siehe `regel` im Ereignis.)
- Der **Schlafplatz** gibt dem Envoy jeden Morgen um 6 Uhr einmal
  Energie dazu, über das Ende der Leiste hinaus, je nach Stufe 20 bis 40 % der Leiste:
  beim Raspelnest und 10 Energie wären es 12 von 10. Der
  Zusatz wird verbraucht, bevor die Leiste unter ihr Ende sinkt; während des Tages füllt
  sich die Leiste nur bis zum normalen Ende. Erst am nächsten Morgen kommt er wieder; er
  sammelt sich nicht über mehrere Nächte. Die Leiste zeigt den Zusatz als kupferfarbenes
  Ende und darunter „Ausgeschlafen: 2 extra“. Was in der Testfassung über die Test-Knöpfe
  darüber hinausgeht, heißt dort „32 über der Leiste“ und wird morgens nicht gekürzt.
  Ein Schlafplatz, der in der Nacht (vor 6 Uhr) gebaut wird, zählt schon an diesem Morgen;
  das Tageswerk lässt sich bis 3 Uhr erledigen, der Schlafbonus kommt danach.
  (Der Schlafplatz gibt Energie, keine Werte: Werte steigen nur durch die echten Aufgaben.)

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
der Minuten der Ausdauer-Aufgabe aus dem Tageswerk, Treppe oder Hampel-Runden; ein
Stockwerk aus früheren Versionen zählt als eine Minute). „Der Turm der Stufen“ braucht 60 Minuten, „Die lange Straße“ 150. Manche Quests sind
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

- Je Energie (also je zehn Sekunden) bringt er **2 Stück** und dazu bis zu **2 weitere**: zwei
  Würfel, jeder gelingt mit einer Chance und bringt dann 1 Stück mehr. Bei Level 1 ist
  die Chance 25 % (im Schnitt 2,5 Stück je Energie, selten 4), sie steigt mit jedem
  Level um 1,5 Punkte, höchstens auf 90 %. Weniger als 2 Stück je Energie gibt es nie,
  Fehlwürfe gibt es nicht. Fallen beide Würfel, heißt der Fund „Glücksgriff“.
- **Zufallsfund:** Bei jeder Energie beim Sammeln liegt mit 5 % ein Bannsplitter dabei
  (eigene Würfel, das Material bleibt davon unberührt; zum Ausprobieren der Idee, auf
  Wunsch der Nutzerin). Er steigt als „Fund: 1 Bannsplitter“ auf, steht im Tagebuch und
  im Bericht.
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
  Stück), 2 Pilzholz höchstens 1, dazu 2 zum Bauen. Das sind höchstens 7 von 10, auch bei
  schlechtesten Würfen. Die 2 Energie für die ersten Handwickel („Stoff zwischen den
  Trümmern“) passen noch dazu. Die Bastsandalen („Bast aus dem Pilzhain“, 2 Energie, der
  Weg kostet keine) kommen je nach Würfeln gleich danach oder nach etwas Erholung, noch am
  selben Tag; mit dem Tageswerk reicht es fast immer sofort.

**Weitere Sammelorte.** Am Pilzhain und im Steinbruch gibt es noch je drei Quests mit
festem Ertrag und einem kurzen Weg (je zehn Sekunden hin und zurück, ohne Energie). Sie
bringen mehr Stück je Energie als das Trümmerfeld (bis 5.11 kostete der Weg je 1 Energie
hin und zurück, dann waren es gut 2 bis 4 Stück je Energie wie dort):

| Quest | Energie | Ertrag |
| --- | --- | --- |
| Pilzholz auflesen / Lose Steine auflesen | 1 | 7–9 |
| Pilzholz schlagen / Steine brechen | 4 | 16–20 |
| große Quest (Kraft 4 für Pilzholz, Kraft 5 für Stein) | 10 | 38–44 |

Ohne Stein- und Pilzlager passt nur ein Teil davon in den Vorrat; das sagt das Fenster
der Quest vorher („In den Vorrat passen davon nur 6 Stein.“). Wie die Orte weiterwachsen, plant die Nutzerin.

**Bannsplitter aus Quests.** Seit 5.19 bringen die Erkunden-Quests (und die Brücke) etwa
zwei Bannsplitter je Energie (5.12 bis 5.18 einen, davor teils nur einen für fünf Energie).
Warum (so entschieden, die Nutzerin hat es Claude überlassen): Mit Aushang und Tiefen kamen
Bannsplitter ohne Energie dazu, und ein Bannsplitter je Energie war genau, was Energie beim
Händler kostet (Pilztee: 12 für 10); Energie in diese Quests zu stecken lohnte sich kaum. Die
Quests bleiben die einzige Quelle für Stein, Pilzholz, Pläne und neue Orte; Sammeln ändert
sich nicht. Einmalige Quests: Durch den Spalt 30, Über den Dornengrat 40, Die Brücke 60,
Der Turm der Stufen 120, Die lange Straße 80 (vorher die Hälfte). Kampf- und Höhlenquests
blieben, wie sie waren (5 bis 12 je Energie).

| Quest | Energie | Bannsplitter | wieder nach |
| --- | --- | --- | --- |
| Splitter im Uferkies (Stilles Ufer) | 3 | 6–8 (5.12: 3–4) | sofort |
| Die umgestürzte Säule (dazu 4–6 Stein) | 8 | 14–18 (5.12: 7–9) | 1 Tag |
| Die stille Quelle (dazu die Leiste voll) | 10 | 20–24 (5.12: 10–12) | 3 Tagen |
| Wache an der Furt | 40 | 72–88 (5.12: 36–44) | 1 Tag |
| Eine Nacht am Mondsee | 60 | 110–130 (5.12: 55–65) | 1 Tag |
| Bis zum Horizont | 90 | 170–200 (5.12: 85–100) | 1 Tag |

Die stille Quelle bleibt bei drei Tagen, weil sie die Leiste ganz auffüllt.

**Tempo der Wirtschaft.** Die Quests der Welt bleiben an die Werte und an echte Minuten
Treppe gebunden; die schnelleren Aktionen öffnen sie nicht früher. Der Ausbau des Lagers
sollte mit 5.12 nicht schneller gehen als vorher (so gewünscht, „das soll nicht so schnell zu
maximieren sein“). Deshalb brauchte das Aufwerten mehr Energie am Stück (30, 70, 115, 165
statt 22, 45, 85, 130). **Seit 5.19** (so gewünscht: am Lager fehlte nur die Energie, nach drei
Tagen Spielen sollte die erste Aufwertung gehen, die ersten dürfen leichter sein als die
späteren) kostet es 15, 40, 85 und 140 Energie am Stück: die erste passt in eine volle Leiste
mit Ausdauer 2, die zweite in eine mit Ausdauer 4 (oder mit Ausdauer 3 und dem Tageswerk über die
Leiste), die späteren brauchen etwas Ansparen. Seit 5.12 braucht außerdem ein Plan für Deko
anderthalbmal so viele Chancen (9, 18, 36 statt 6, 12, 24), und die beiden Pläne beim Händler
kosten dreimal so viel (Teppich 120, Pilzholztisch 180). Eine Rechnung zu 5.12, die ein eifriges
Spielen Tag für Tag nachstellt (alle vier Aufgaben, ein- bis dreimal am Tag gespielt, ganz aufs
Lager hin), kam mit den damaligen Regeln meist am selben Tag auf eine Lagerstufe wie mit den
älteren (18 von 28 Fällen), in einigen zwei bis fünf Tage später, in wenigen einen Tag früher;
seit 5.19 gehen die ersten Stufen schneller.

**Begegnungen:** Jeden Tag erscheinen an wilden Orten Geister (je Ort 55 % Chance,
mindestens eine an einem von Anfang an offenen Ort). Welcher Geist kommt, richtet sich
nach der Stärke des Helden (Durchschnitt der Stats zu Tagesbeginn): meist gleich stark,
manchmal eine Stufe darüber. Eine Begegnung kostet 3 Energie vor Ort (der Weg nur Zeit). Das Lager listet die Geister des Tages.

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
- Ausrüstung: wenige feste Quest-Belohnungen, sonst mit einer Chance je Geist und als
  Fundstück unterwegs (siehe Kleidung). Beute liegt in der Nähe der Stärke des Helden
  (±3 Level) und passt zu seiner Figur; färbbare Teile kommen in einer eigenen Farbe.
- Pläne für Deko: an ihrem Fundort, mit Glück (siehe Das Lager).
- Glück erhöht Bannsplitter und die Chance auf Fundstücke.

### Händler

Wird durch die Quest „Der Händler im Nebel“ freigeschaltet (den Händler retten). Seit 5.13
hat sie keine Voraussetzung mehr und ist am ersten Tag zu schaffen (6 Energie, der
Nebelwächter auf Stufe 2).
Bietet jeden Tag 5 Dinge an, an manchen Tagen dazu einen Plan für Deko (siehe Das Lager). Die
Ausrüstung ist zufällig, aber immer im Bereich der Stärke des Helden (Voraussetzung
höchstens 3 Level darunter oder darüber) und passend zur Figur; färbbare Kleidung hat eine
eigene Farbe, die beim Kauf bleibt, dazu eine Güte mit Boni (siehe Ausrüstung). Preis in Bannsplittern = 12 + 4 × n + n² + 8 × Stufe
(n = höchste Voraussetzung), falls in der Tabelle nicht anders angegeben. Er kauft
alles für ein Drittel des Preises zurück.

**Tränke** (seit 5.13, `POTIONS`): jeden Tag zwei **Pilztee** (+10 Energie, 12 Bannsplitter)
und zwei **Quellsud** (+25 Energie, 28 Bannsplitter). Ein Trank wird beim Kauf getrunken und
füllt die Energie auf, nie über das Ende der Leiste hinaus (so bleibt das Tempo des
Lagerausbaus, der Energie am Stück braucht). Gekauft als Ereignis `buy` mit `kind: 'trank'`.

### Rucksack, Vorrat und Aufbewahrung

Der Rucksack hat von Anfang an **5 Plätze** und der Envoy hat ihn immer bei sich. Er ist
nur für Dinge (Kleidung, Fundstücke). Getragenes zählt nicht mit. Das Startoutfit
(Leinenhemd, Leinenhose) trägt er von Anfang an, der Rucksack ist am Start leer.
Handschuhe und Schuhe hat er am Anfang keine, er geht barfuß. Die ersten Handwickel bringt
die Quest „Stoff zwischen den Trümmern“ auf dem Trümmerfeld (ohne Voraussetzung,
2 Energie, ohne Weg), die Bastsandalen die Quest „Bast aus dem Pilzhain“ (ohne
Voraussetzung, 2 Energie und ein kurzer Weg). Beides landet im Rucksack und wird von
dort angelegt.

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
| 1 | Provisorisches Lager | 5 | 20 Stein, 20 Pilzholz, 30 Energie |
| 2 | Unterstand | 14 | 50 + 50, 70 Energie |
| 3 | Wackelige Hütte | 36 | 80 + 80, 115 Energie |
| 4 | Stabile Hütte | 90 | 100 + 100, 165 Energie |
| 5 | Steinhäuschen | – | – |

Aufwerten ist kein Muss. Es kostet immer etwa eine volle Ladung der Lager der Stufe davor,
und die **Energie wird am Stück** gebraucht: Die Leiste muss lang genug sein, und die
wächst nur mit der echten Ausdauer-Aufgabe (der Schlafplatz hilft, weil er morgens über
das Ende der Leiste füllt, und das Tageswerk). Wer jeden Tag alle vier Aufgaben macht und
ganz aufs Lager hin spielt, kommt frühestens etwa an Tag 4, 8, 18 und 26 bis 32 auf die
Stufen 2 bis 5, je nachdem, wie oft am Tag er spielt; wer Tage auslässt, später. Mehr
Training verlangt das nicht, nur Regelmäßigkeit. (Bis 5.11 kostete das Aufwerten 22, 45, 85
und 130 Energie; seit 5.12 gibt es mehr Energie am Tag, der Ausbau soll aber nicht schneller
gehen, siehe Tempo der Wirtschaft.) Einrichtungen und Deko bleiben beim
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
| Steinlager | Steinstapel (fasst 20, 1), Steinpferch (50, 2), Steinschuppen (100, 3) |
| Pilzlager | Pilzholzstapel (20, 1), Pilzholzgestell (50, 2), Pilzholzschuppen (100, 3) |
| Aufbewahrung | Krempelplatz (6 Plätze, 2), Kiste (10, 3), Truhe (15, 4), Kleiderschrank (24, 5) |
| Schlafplatz | Raspelnest (+20 % Energie am Morgen, 3), Pilzmatte (+25 %, 4), Schlafpodest (+30 %, 5), Bett (+35 %, 6), Himmelbett (+40 %, 7) |

Stein- und Pilzlager enden mit dem Schuppen auf Stufe 3; ein Schuppen kann neben dem Haus
jeder späteren Stufe stehen bleiben. Mehr Hygge gibt es danach vor allem über Deko. Der
Reiter im Rucksack heißt weiter „Aufbewahrung“, die Kacheln heißen nach ihrer Stufe.

**„Lager einrichten“** (Knopf auf dem Bild des Lagers) öffnet die vier Einrichtungen als
Kacheln, ab Lagerstufe 2 dazu eine fünfte für die Deko. **Im Vordergrund steht, was man
haben kann:** Lässt sich die nächste Stufe einer Einrichtung auf dieser Lagerstufe bauen
(oder steht sie noch gar nicht), zeigt die Kachel diese Stufe: ein großes Zeichen, hell
umrandet, bei einem Ausbau mit einem Pfeil nach oben, daran eine kleine Medaille mit ihrem
Hygge (wie die große auf dem Bild), darüber „Ausbau · Stufe 2“, ihren Namen, darunter die
Kosten als kleine Bilder (Pilzholz, Stein, Energie mit Zahl; was fehlt, orange) und ganz
klein, was jetzt steht („Jetzt: Steinstapel“). Was gerade gebaut werden kann, glimmt. Geht
der nächste Schritt erst mit einer höheren Lagerstufe, zeigt die Kachel die stehende
Einrichtung: das Zeichen kupfern mit Haken, darunter ihre Stufe. Ein Tipp öffnet die
gezeigte Stufe: Text, was sie bringt, Hygge („2 statt 1“), Kosten, eine Zeile zu dem, was
jetzt steht, die Energie-Leiste und „Ausbauen“; geht der Ausbau erst mit der nächsten
Lagerstufe, steht das da. Der Knopf „Lager einrichten“
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
| 3 | Teppich (7) | Händler, selten (120 Bannsplitter) |
| 4 | Kamin (8) | gleich da |
| 4 | Laterne (6) | Die lange Straße, sehr selten |
| 4 | Leuchtmooskasten (6) | Pilzhain, sehr selten |
| 4 | Pilzholztisch (7) | Händler, selten (180 Bannsplitter) |
| 4 | Steinregal (7) | Alter Steinbruch, sehr selten |
| 4 | Wandbehang (7) | Wache an der Furt, sehr selten |
| 4 | Nebelspiegel (8) | Mondsee, kostbar |
| 4 | Sternkarte (8) | Eine Nacht am Mondsee, sehr selten |
| 4 | Klangschale (9) | Echohöhle, selten |
| 4 | Splitterschale (9) | Geister, kostbar |

**Pläne finden** (`js/world/plans.js`): Gesucht wird erst, wenn das Lager die Stufe der
Deko erreicht hat, und nur an ihrem Fundort. Dort ist jede Arbeit eine Chance: je **10
Energie Arbeit** an dem Ort (die Energie aus der Tabelle, nicht durch Werte verringert; als
Fundort kann auch eine einzelne wiederholbare Quest stehen), bei `geister` **jeder
Geist**, dem der Envoy begegnet, beim Händler **jeder Tag**. Ein seltener Plan braucht im
Schnitt 9 Chancen, ein sehr seltener 18, ein kostbarer 36 (bis 5.11: 6, 12, 24). Pech hält nicht an: Nach
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
(`assets/lager/stufe_<n>_<zeit>.jpg`; fehlt es, das der Stufe davor, bisher also ab Stufe 1
immer das Bild mit dem Feuer; fehlt die Tageszeit, das Tagesbild getönt) und darauf ein
Stapel von Ebenen in genau der Reihenfolge, in der die Nutzerin sie angelegt hat. Alle
Ebenen sind 1792 × 672 wie das Grundbild, transparent, auf dem Tagesbild an ihrem Platz
gezeichnet, wie bei Anziehpuppen. Der Stapel steht als Liste `ORDER` in
`tools/lager_ebenen.py`, von hinten nach vorn:

| Art | Datei | Im Bild |
| --- | --- | --- |
| Gebäude | `gebaeude_<stufe>.png`, manche in Teilen (`gebaeude_3_hinten`, `gebaeude_3_vorn`, `gebaeude_5_stiel`) | alle Teile des Gebäudes der Lagerstufe; fehlt es, das der Stufe davor |
| Einrichtung | `einrichtung_<id>_<stufe>.png` | jede Einrichtung auf ihrer Stufe; fehlt die Zeichnung, die der Stufe davor |
| Deko | `deko_<id>.png` (Platz `deko` im Stapel) | jede gebaute Deko mit Zeichnung |
| Ausschnitt | aus dem Grundbild ausgeschnitten: Felsen, Feuer, Funken, Säulen | damit sie vor dem stehen, was im Stapel davor kommt; manche nur unter Bedingungen (siehe unten) |

Die Reihenfolge ist: die Gebäude, dahinter liegende Teile zuerst (die Wackelige Hütte in
einem hinteren Teil hinter den Betten), die Schlafplätze, vor ihnen der Stängel im
Steinhäuschen und der vordere Teil der Wackeligen Hütte, die Pilzlager, der große Felsen
hinter dem Feuer, die Aufbewahrung, Feuer und Funken, die Steinlager, die Deko, zuletzt der
Felsen rechts vom Feuer, die beiden Säulen und der Felsen ganz vorn.

Ein Eintrag im Stapel kann Bedingungen haben: nur bis zu einer Lagerstufe (`bis_lager`) oder
nicht, solange eine bestimmte Zeichnung zu sehen ist (`nicht_mit`). So stehen die beiden
hinteren Felsen (hinter dem Feuer und rechts davon) nur bis zur Wackeligen Hütte vorn; ab der
Stabilen Hütte steht das Haus vor ihnen. Der Felsen rechts vom Feuer steht vor der Kiste und
der Truhe, aber hinter dem Krempelplatz (Aufbewahrung 1).

Die Ausschnitte zeichnet die Nutzerin aus dem Tagesbild aus; sie liegen in
`tools/lager-ausschnitte/`. `tools/lager_ebenen.py` legt Ausschnitte, die im Stapel
aufeinander folgen, zu einer Datei zusammen (`assets/lager/ausschnitt_<name>_<zeit>.png`):
bei Tag so, wie sie gezeichnet sind, zu den anderen Tageszeiten mit denselben Umrissen aus
dem Bild dieser Zeit geschnitten, damit sie dessen Licht haben (die Funken nur am Tag, sie
fliegen in jedem Bild anders). Die Umwandlung der Tabellen liest den Stapel und findet die
Dateien selbst. Die Gebäude und Einrichtungen sind bei Tag gezeichnet: auf dem Bild einer
anderen Tageszeit bekommen sie dessen Licht (eine Tönung, an die Bilder von Stufe 1
angepasst), auf dem getönten Tagesbild dieselbe Tönung wie das Bild.

Neue Ebenen exportiert die Nutzerin aus ihrer Zeichnung als einzelne Dateien, durchnummeriert
von hinten nach vorn, und legt sie in den Ordner `LagerPNGs` im Testordner auf dem Webspace.
Von dort holt sie Claude (über die Netzwerkfreigabe von alva-van-wilk.de oder per SFTP) und
trägt sie unter ihren Namen in `ORDER` ein.

Am Telefon zeigt das Lager nur die Mitte des Bilds, und die Knöpfe liegen unten darüber.
**Ein Tipp auf das Bild zeigt es groß**, ganz, ohne Knöpfe: so hoch, wie der Bildschirm
erlaubt; ist er hochkant, als Streifen, der sich seitlich schieben lässt, beginnend beim
Feuer. Ein Tipp schließt es wieder. Ein kleines Zeichen (vier Ecken) neben dem Hygge zeigt,
dass es das gibt.

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
| Handwickel (die ersten Handschuhe) | Quest „Stoff zwischen den Trümmern“ auf dem Trümmerfeld, ohne Voraussetzung |
| Bastsandalen (die ersten Schuhe) | Quest „Bast aus dem Pilzhain“, ohne Voraussetzung |
| Lagerstufe 1, die vier Einrichtungen | Quest „Ein Lagerfeuer errichten“ (die erste Quest) |
| Lagerstufen 2 bis 5, höhere Stufen der Einrichtungen, Deko | Hygge (siehe Das Lager) |
| Händler | Quest „Der Händler im Nebel“, ohne Voraussetzung (seit 5.13) |
| Aschenhang, Turm der Stufen, lange Straße | Quest „Die Brücke über die Schlucht“ |
| Weißes Tal | Quest „Die lange Straße“ (30 km reale Strecke) |
| Talentbaum | alle vier Stats auf 10 (Inhalt Phase 2) |

## Arena und Ruhmeshalle

Ein Ort für alle Envoys auf dem eigenen Server (nur mit Konto, ab dem Lagerfeuer), erreichbar
über „Arena“ oben auf der Abenteuer-Seite. Niemand kämpft gegen eine Person, sondern gegen
ihr **Abbild**: Name, Aussehen, getragene Kleidung (mit Farbe und den Boni jedes Stücks) und
ein Titel. Die App schickt das Abbild bei jedem Abgleich mit. Echte Übungen, Tageswerk,
Werte oder Serien der anderen zeigt die Arena nie; den eigenen Fleiß zeigt die Envoy-Seite. Der Server (`arena.php`, Teil von `sync.php`)
entscheidet jeden Kampf selbst.

**Stark macht Fleiß, nicht Begabung** (so gewünscht): Die Stärke eines Abbilds in jedem der
vier Bereiche ist, an wie vielen der letzten 28 Tage die Aufgabe dieses Bereichs erledigt
wurde. Der Server zählt das in der Ereignisliste des Kontos; zurückgenommene Aufgaben zählen
nicht, eine Aufgabe je Bereich und Tag. Jede Aufgabe zählt gleich, auf jeder Stufe, für Kinder
wie für Erwachsene: Wem die Übungen leichter fallen, der kommt auf höhere Stufen und mehr XP,
aber nicht zu mehr Stärke in der Arena. Die Werte (Level) spielen in der Arena keine Rolle.

**Der Fleiß zählt am meisten** (so gewünscht): Der **Fleiß** eines Abbilds sind die Tage mit
erledigter Aufgabe in allen vier Bereichen zusammen (0 bis 112). Es entscheidet immer ein
einziger, echter Kampf; nichts steht vorher fest (seit 5.20.3, so gewünscht). Jeder Tag Fleiß
mehr als die andere Seite gibt im Kampf 15 % mehr Leben und 15 % härtere Treffer
(`ARENA_FLEISS_EDGE`): Ein großer Abstand ist nahezu, aber nie ganz aussichtslos, ein kleiner
lässt sich mit Glück und guter Kleidung wettmachen. Die Boni der Kleidung wirken im Kampf
mit: **Schaden** trifft härter, **Treffer** trifft öfter, **Ausweichen** weicht öfter aus (aus
festen Fähigkeiten und Boni der getragenen Stücke; Energie, Glück, Wege und Beruhigen wirken
dort nicht; `ARENA_FIGHT_BONUSES`). Fallen beide in derselben Runde, ist es unentschieden.

Chancen der weniger fleißigen Seite (je 3000 Probekämpfe, sonst gleich stark; „etwas besser“
= Schaden +2, Treffer +5; „sehr stark“ = Schaden +6, Treffer +10, Ausweichen +10):

| Abstand | gleich gekleidet | etwas besser gekleidet | sehr stark gekleidet |
| --- | --- | --- | --- |
| 0 Tage | 46 % | 72 % | 94 % |
| 1 Tag | 21 % | 45 % | 81 % |
| 3 Tage | 2 % | 11 % | 47 % |
| 5 Tage | 0,2 % | 3 % | 21 % |
| 7 Tage | nie | 0,3 % | 8 % |
| 10 Tage | nie | nie | 1,5 % |
| 14 Tage | nie | nie | 0,1 % |

Die **Haltung** gibt es nicht mehr; frühere Ereignisse mit Haltung bleiben gültig, sie zählt nur
nicht mehr. (5.17 bis 5.20.2: Der Fleißigere gewann immer, der gezeigte Kampf wurde passend
ausgesucht; bei gleichem Fleiß entschied bis 5.19 eine Summe der Kampf-Boni, ohne dass sie im
Kampf wirkten, ab 5.20 der Kampf. 5.16: Haltung im Kampf wenig, knappe Kämpfe nach Fleiß; bis
5.15 entschied der Kampf selbst, gleich fleißige zur Hälfte unentschieden.)

**Die Rangliste läuft ständig** (eine Forderungsrangliste wie im Sportverein):

- Wer ein Abbild aufstellt, beginnt am Ende. Herausfordern lassen sich die Abbilder bis drei
  Plätze über oder unter dem eigenen, jedes einmal am Tag. Eine Herausforderung kostet
  keine Energie (seit 5.13, so gewünscht; vorher 5, ältere Kämpfe ohne Feld `energie`
  behalten das); unterwegs geht es nicht.
- Wer gegen jemanden weiter oben gewinnt, nimmt dessen Platz; die dazwischen rücken einen
  nach unten. Unentschieden oder unterlegen ändert nichts an der Liste.
- Wessen App 14 Tage nicht offen war, dessen Abbild ruht: Es verlässt die Liste und beginnt
  wieder am Ende, sobald die App zurück ist. Zurückziehen geht jederzeit.

**Der Kampf** zeigt, wie es ausgeht, Runde für Runde (Lebensleisten, Treffer, Ausweichen).
Beide Seiten werden dabei aneinander gemessen, Bereich für Bereich (Stärke = 1 + Tage mit
erledigter Aufgabe): doppelt so viel Kraft trifft etwa ein Fünftel härter, doppelt so viel
Ausdauer hält etwa ein Fünftel länger, mehr Beweglichkeit trifft und weicht öfter aus. Dazu
die Boni der Kleidung: Schaden zählt auf jeden Treffer, Treffer und Ausweichen als
Prozentpunkte, wie in der Welt. Leben (40) und Schaden (7) sind etwa die eines Envoy um Level
10, damit ein Punkt Schaden hier so viel ausmacht wie draußen. In jeder Runde schlagen beide
zugleich; wer fällt, fällt. Nach 30 Runden gewinnt, wer mehr Leben übrig hat (kommt kaum vor).
Dazu der Vorsprung im Fleiß (siehe oben). Gleich starke Seiten ohne Boni gewinnen je etwa zur
Hälfte, etwa jeder zehnte Kampf endet unentschieden.
Niemand verbeugt sich vorzeitig (bis 5.16 konnte ein Abbild, das zurücklag, sich verbeugen;
dann endete der Kampf unentschieden, auch wenn nur eine Seite getroffen worden war). Am Ende
verbeugen sich beide. Warum ein Kampf so ausging, steht nicht da (seit 5.20.2, so gewünscht):
Die Spieler wissen, dass der Fleiß am meisten zählt, aber nicht, wie viel. Auch die Texte der
App sagen nur „Im Kampf in der Arena zählt vor allem der Fleiß.“ (bis 5.20.1 stand am Ende
etwa „Mehr Fleiß auf deiner Seite.“).

**Ruhm** ist die Währung der Arena und nur dort: herausfordern bringt 3 für einen Sieg,
2 für unentschieden, 1 fürs Antreten; das herausgeforderte Abbild bekommt 2, wenn es hält,
sonst 1. Ruhm geht nie verloren, macht den Envoy nie stärker und ist kein Heldenlevel. Für
Ruhm gibt es (seit 5.15, so gewünscht: Kleidung mit Boni statt gekaufter Titel):

- **Ausrüstung der Halle**: jeden Tag drei Kleidungsstücke um die Stärke des Envoy, jedes
  mindestens selten (65 % selten, 35 % prächtig), selten 20 Ruhm, prächtig 35 (`ARENA_OFFERS`,
  `ARENA_PRICES`). Jedes Angebot einmal.
- ein färbbares Kleidungsstück in einer der zwölf Farben oder wieder wie gezeichnet (8 Ruhm).

**Ränge und Titel**: Titel werden nicht mehr gekauft. Aller jemals verdiente Ruhm (`earned`,
Ausgeben senkt ihn nie) ergibt den Rang: Neu in der Halle (0), Bekannt in der Halle (15),
Geachtet (40), Gefeiert (80), Unvergessen (150), Legende der Halle (250). Jeder Rang ab dem
zweiten bringt Titel für das Abbild („mit leisem Schritt“ …, `TITLES` mit `rang`). Ein vor 5.15
gekaufter Titel bleibt. Die Halle zeigt den Rang beim eigenen Abbild und eine Tafel aller
Ränge mit ihren Titeln.

Jeder
Kampf steht als Ereignis `kampf` in der Liste des eigenen Kontos (die Id kommt vom Server,
so schreibt jedes Gerät denselben), der Titel als `abbild`, Käufe als `ruhmkauf`
(`ware`: `farbe`, `kleidung`, früher `titel`).
Kämpfe, die das eigene Abbild erlebt hat, kommen mit dem nächsten Abgleich und stehen in der
Halle als neu.

## Der Aushang

Seit 5.15 (so gewünscht: ein Aushang, aber nicht endlos). Am Lager, ab dem Lagerfeuer, hängen
jeden Tag **drei Aufträge** (`js/world/jobs.js`, `js/ui/jobboard.js`, `JOBS` in `js/config.js`),
für alle gleich ausgewählt, den ganzen Tag dieselben (mit den Werten vom Tagesbeginn).

- Jeder Auftrag führt an einen offenen Ort und dauert dort einige Minuten (je Auftrag 4 bis
  14). Er **kostet keine Energie, nur Zeit**: Der Envoy geht hin, ist eine Weile beschäftigt
  und kommt zurück, als eine Aktion seiner Expedition. Ist er schon unterwegs, wird der
  Auftrag angehängt.
- **Der Lohn steht auf dem Zettel**: Bannsplitter (6 + 2 je Minute, je Level Stärke 8 % mehr)
  und mit 60 % ein bestimmtes Kleidungsstück, in seiner Farbe und mit seiner Güte (20/45/27/8 %),
  passend zur Figur und Stärke. Kein Material und keine Pläne, damit der Lagerausbau nicht
  schneller geht.
- Jeder Auftrag einmal; erledigte bleiben durchgestrichen hängen. Am nächsten Tag hängen neue.
- **Besondere Stücke** (`JOB_FEATURED`, seit 5.20.6): Ein Stück kann ab einem Tag auf dem ersten
  Zettel hängen, mindestens selten, bis der Envoy es hat (wenn es zu seiner Figur passt). Bisher
  der Steppenrock, gezeichnet von der Tochter der Nutzerin, ab dem 8. Oktober 2026 (so gewünscht).
  Er bleibt danach auch als Fundstück im Spiel, immer wie gezeichnet.
- Ereignis: `expedition` mit `q` = `aus:<Tag>:<Nummer>`, ohne Energie. Es zählt nur am eigenen
  Tag und nur einmal.

## Die Tiefen

Seit 5.14 (so gewünscht: etwas, das immer zu tun ist und bei dem Werte **und** Ausrüstung
zählen). Unter dem Trümmerfeld führt ein Schacht hinab, offen ab dem Lagerfeuer, erreichbar
über „Die Tiefen“ oben auf der Abenteuer-Seite (`js/world/depths.js`, `js/ui/depths.js`,
Zahlen in `DEPTHS` in `js/config.js`).

- **Drei Tiefen** nacheinander, je zehn Ebenen: Der alte Brunnen, Die Wurzelhallen, Das
  Aschengewölbe. Eine Tiefe öffnet sich, wenn die darüber bezwungen ist. Weiter unten noch
  nichts („Tiefer geht es noch nicht.“), damit Luft nach oben bleibt.
- **Auf jeder Ebene ein Wächter**: einer der Geister der Welt (mit seinem Bild), so stark
  wie die Stufe der Ebene. Stufe = Anfang + Schritt × (Ebene − 1), der letzte Wächter einer
  Tiefe eine Stufe mehr (Brunnen 1 bis 6,5, Wurzelhallen 6 bis 12, Aschengewölbe 11,5 bis
  17,5). Leben 6 + 4,6 × Stufe, Kraft 0,5 + 0,75 × Stufe, Gewandtheit 0,8 × Stufe.
- **Der Kampf** wie unterwegs (`combat.js`, höchstens zwölf Runden), mit den Werten des
  Envoy und den Boni seiner Kleidung. Gerechnet: Gegen einen Wächter seiner eigenen Stufe
  gewinnt ein Envoy ohne Boni etwa jeden dritten Kampf, mit üblicher Kleidung (fünf Teile,
  Güte wie bei Geistern) drei von vier oder mehr; Kleidung ist so etwa eine Stufe wert.
- **Hinabsteigen kostet keine Energie.** Danach ruht der Envoy 60 Minuten, je Level
  Gelassenheit über 1 eine Minute weniger, mindestens 30 (Gelassenheit verkürzt Ruhezeiten).
  Unterwegs auf einer Expedition geht es nicht.
- **Nichts scheitert**: Ist der Wächter zu stark, zieht sich der Envoy zurück, bringt ein
  Viertel der Bannsplitter der Ebene mit und versucht es nach der Rast noch einmal.
- **Belohnung**, je Ebene einmal: Bannsplitter (Brunnen 10 + 3 je Ebene, Wurzelhallen
  25 + 4, Aschengewölbe 45 + 6; der letzte Wächter 80, 160, 300; mit Glück mehr) und mit
  40 % ein Kleidungsstück (mit Glück öfter), auf Ebene 5 und 10 sicher. Es passt zur Stärke
  und Figur des Envoy und hat immer eine Güte: mindestens gut (55/33/12 %), beim letzten
  Wächter mindestens selten (70/30 %).
- **Die Seite** zeigt den nächsten Wächter mit Bild und Stufe, in Worten, wie der Envoy
  gegen ihn stünde (aus 120 gedachten Kämpfen, immer mit denselben Würfeln, so ändern nur
  Werte und Kleidung die Aussicht), die Werte beider im Kampf und, was davon die Kleidung
  dazugibt (in Orange), was die Ebene bringt, und den Knopf „Hinabsteigen“ oder bis wann der
  Envoy ruht. Der Kampf läuft Runde für Runde in einem Fenster, danach der Fund. Darunter alle
  Tiefen mit ihren Ebenen. Der Knopf auf der Abenteuer-Seite leuchtet, solange der Envoy
  hinabsteigen könnte.
- Ereignis `tiefe` (`tiefe`, `ebene`, `outcome` mit dem Kampf und der Belohnung, beim
  Hinabsteigen gewürfelt). Es zählt nur für die nächste Ebene, nach der Rast und nicht
  unterwegs; sonst bleibt es ohne Wirkung. Im Testordner beendet ein Test-Knopf die Rast.

## Neuigkeiten beim Start

Beim ersten Start einer neuen Fassung erscheint einmal über allem, was neu ist: oben
„Liebe Envoys!“ und ein kurzer Gruß, dann je Neuerung eine große Überschrift mit ein, zwei
kurzen Sätzen (`js/ui/news.js`, je Fassung eine eigene Id). Ein neu erstellter Envoy bekommt
sie nicht. Danach fragt die App, falls nötig, nach dem Alter (siehe Kinder und
Jugendliche). Rundgänge warten, bis diese Fenster zu sind.

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
  (Maus) oder Berühren (Touch) eines Rings nennt den Wert („Kraft 1.375“); ein Antippen
  des Rings tut sonst nichts. Das Portrait öffnet
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
- **Tageswerk**: die vier Aufgaben als schmale Zeilen mit dem, wofür sie zählen („für Kraft“), und
  einem Haken zum Erledigen. **Antippen dreht eine Aufgabe um wie eine Karte**: Sie wächst
  aus ihrer Zeile in die Mitte, erst ist die Rückseite mit dem Zeichen des Werts zu sehen,
  dann die Vorderseite: oben wofür sie zählt und die Gesamtzeit, die Übung als bewegte Figur, die sie im
  Takt vormacht (Comic-Stil mit dunkler Umrisslinie wie die Bilder der Nutzerin, Hemd in der
  Farbe des Bereichs, mit Hals und ohne Gesicht: nur das Haar zeigt, wohin der Kopf schaut;
  meist von der Seite, der Seitstütz von vorn, der Brustöffner („das offene Buch“) vom Kopf
  her schräg von oben, damit der Bogen des Arms zu sehen ist) (je Übung und Stufe, `assets/uebungen/<id>.svg`, gezeichnet mit
  `tools/uebungsbilder.py`; ein eigenes Bild der Nutzerin je Figur geht vor und wird in den
  Farben des Envoy gezeigt, bei der Gelassenheit die Frau und der Mann im Schneidersitz;
  ohne beides das Zeichen des Werts), bei mehreren Übungen Reiter mit ihren kurzen
  Namen, dann Name, Stufe („Stufe 1 · Der Fußtipp“), Zeit, wofür sie gut ist und die
  Schritte; unten „Mit Timer“ (für die gezeigte Übung) und bei
  mehreren Übungen ein Knopf mit dem Namen der gezeigten („Käfer erledigt“), bei einer
  „Erledigt“ (und „Das war heute zu viel“ für die ganze Aufgabe, siehe Rückfrage). Eine
  erledigte Übung bekommt einen Haken an ihrem Reiter, die Karte geht zur nächsten offenen;
  auf dem Reiter einer erledigten steht „Rückgängig“ für diese Übung. Die Fragen füllen die
  Karte: bei einer Frage genügt ein Tipp, bei mehreren kommt „Fertig“. Ist die letzte Übung
  erledigt, dreht sich die Karte zurück und wird dabei kleiner, ohne
  sich zu verziehen, bis sie über ihrer Zeile verblasst; die Zeile leuchtet kurz auf, und
  der neue Wert steigt dort auf („Kraft 1.375“). Die Zeile nennt die Übung oder die kurzen
  Namen aller („Käfer · Vogelhund · Seitstütz“), wofür sie zählt, die Zeit und, wenn schon ein Teil erledigt ist, wie
  viel („2 von 3“). Der Haken an der Zeile erledigt, was von der Aufgabe noch offen ist, ohne
  Karte; gibt es dazu Fragen, öffnet er die Karte bei den Fragen. Eine erledigte
  Aufgabe zeigt auf der Karte „Erledigt“, die Energie, die sie gebracht hat („+4 Energie“),
  und „Rückgängig“. Mit
  reduzierter Bewegung erscheint die Karte ohne Drehen. Ein Fragezeichen klappt eine kurze Erklärung auf
  (wozu das Tageswerk da ist, dass Werte bei liegengebliebenen Aufgaben langsam sinken,
  aber nie ganz verloren gehen) mit Verweis ins Handbuch. Läuft ein befristeter Bonus,
  steht er mit seinem Ende in einer Zeile darüber. Ist alles erledigt, steht oben
  „Das Tageswerk ist erledigt.“ und ein Ausblick auf morgen, mit den Übungen, die dann
  auf einer neuen Stufe sind.
- **Timer**: führt durch eine Übung, Teil für Teil: kurz bereit machen (Kraft und
  Beweglichkeit 10 Sekunden, Treppe 5), dann ihre Abschnitte (eine Seite, die andere;
  normal, zügig). Danach kommt ihre Frage, und die Karte zeigt die nächste Übung; deren
  Timer beginnt erst mit einem neuen Tipp. Groß stehen der Name der Übung und die
  Restzeit des Teils in einem Ring, darüber die Figur, die die Übung mitmacht, darunter
  „Insgesamt noch …“. Bei jedem neuen Teil klingt ein leiser Ton, und eine Stimme sagt an,
  was kommt („Als Nächstes: Der Vogelhund.“, „Andere Seite“, „Zügig“). Bei der
  Gelassenheit spricht sie die Sätze der Übung zu ihrer Sekunde (Spalte `ansagen`), denn
  die Augen sind zu; die Schritte auf der Karte liest man vorher. Die Stimme ist die
  deutsche Stimme des Geräts, braucht kein Internet und lässt sich im Timer abschalten
  („Stimme“); die Wahl bleibt gespeichert. Bei Übungen mit Atemtakt ein Kreis, der wächst
  und schrumpft. Solange die Zeit läuft, spielt ein ruhiger Klang: leises Rauschen wie
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
    welche Übung, erledigt oder nicht (ohne Zahl).
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

**Unterhemd des Mannes:** Die Frau trägt in ihrer Basisfigur etwas obenherum, der Mann
deshalb von Anfang an ein Unterhemd (Zeichnung der Nutzerin, `assets/figur/zweite/
unterhemd.png`, 1024 × 1536). Es liegt direkt über der Basisfigur und unter allem, was
er anzieht, auch unter der Hose (wie eingesteckt). Es belegt keinen Slot und lässt sich
nicht ablegen. In den Einstellungen unter „Envoy“ schaltet der Schalter „Unterhemd“ es
ab und wieder an; die Wahl steht im Ereignis `envoy` (`unterhemd: false`), gilt also auf
jedem Gerät, und bleibt beim Ändern des Aussehens erhalten. Den Schalter gibt es nur,
wenn der Envoy der Mann ist.

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
Envoy trägt sie von Anfang an (Herkunft `angezogen`), damit der Rucksack am Start leer
ist (Herkunft `start` legt Dinge in den Rucksack; es gibt vorerst keine). Handschuhe und
Schuhe trägt er am Anfang nicht: Die Handwickel (Zeichnungen der Nutzerin, Nr. 7 und 8
der Kleiderkammer) sind die Belohnung der Quest „Stoff zwischen den Trümmern“ auf dem
Trümmerfeld, die Bastsandalen (Nr. 9, für beide Figuren dieselbe Zeichnung, sie passt
an beide Füße) die der Quest „Bast aus dem Pilzhain“, beide ohne Voraussetzung. Die
Griffhandschuhe sind die Belohnung für die Brücke über die Schlucht.

**Teile ohne Bild kommen nicht ins Spiel** (so gewünscht): Ein Teil, das die Nutzerin
noch nicht gezeichnet hat (keine Ebene für die Figur des Envoy), bietet der Händler nicht
an, kein Geist lässt es fallen, es liegt nicht unterwegs, und eine Quest, die es als
Belohnung nennt, gibt es nicht und zeigt es nicht (sie bleibt, mit dem Rest ihrer
Belohnung). Das betrifft bisher die Echohöhle (Kampfhose), Durch den Spalt (Stirnband),
Spiegel im Mondsee (Stillemaske), den Turm der Stufen (Leichte Stiefel) und den
Aschenthron (Nebelwickel) sowie zehn Teile von Händler und Geistern (`obtainable` in
`js/world/clothes.js`). Wer ein solches Teil schon hat, behält es; es wird getragen, aber
nicht gezeichnet, als Icon dient das Symbol des Slots. Sobald die Zeichnung da und in der
Tabelle eingetragen ist, kommt das Teil von selbst ins Spiel. Die Umwandlung listet
fehlende Bilder als Hinweis, ohne abzubrechen.

Icons sind 256 × 256 px, transparent. Sie werden aus den Zeichnungen der Ebenen
freigestellt und mittig gesetzt (so gewünscht); ein eigenes Icon mit gleichem Namen
ersetzt das jederzeit. Weitere
Bilder: Monster 512 × 512, Lager `assets/lager/stufe_<n>_<zeit>.jpg` (1792 × 672, Seitenverhältnis 8:3; Zeit = `morgen`, `tag`, `abend`, `nacht`; Stufe 0 = ohne Feuer, bisher nur `tag`; Stufe 1 = Lagerfeuer; fehlt eine Stufe, gilt die davor), Ebenen des Lagers `assets/lager/gebaeude_<n>[_<teil>].png`, `assets/lager/einrichtung_<id>_<stufe>.png`, `assets/lager/deko_<id>.png` und die Ausschnitte `assets/lager/ausschnitt_<name>_<zeit>.png` (1792 × 672, transparent, Reihenfolge in `tools/lager_ebenen.py`, siehe Das Lager), Portraits `portrait.png` im Ordner jeder Figur (quadratisch, Hintergrund frei), die Übungen als bewegte Figuren `assets/uebungen/<id>.svg` (3:2, gemacht von `tools/uebungsbilder.py`; ein Abschnitt der Zeit mit eigener Bewegung, etwa „Hampelmann“ in den Hampel-Runden oder „Pause“ beim Brett, hat `assets/uebungen/<übung>-<abschnitt>.svg`, das der Timer in diesem Abschnitt zeigt) oder, falls es sie gibt, ein Bild der Nutzerin im Ordner einer Figur: `uebungen/<übung>.png` für alle Stufen einer Übung, `uebungen/<id>.png` für eine Stufe (geht vor; Hintergrund frei; Haut und Haare in den Farben der Figur, damit die App sie umfärbt). Bisher gibt es `innehalten.png` für beide Figuren: die Frau und der Mann im Schneidersitz, für alle drei Stufen der Gelassenheit, Karte im Seitenverhältnis 3:2
(`assets/welt/karte.jpg`, 2400 × 1600, gezeichnet von `node tools/karte.mjs`: eine Insel im
Nebelmeer, jedes Land mit eigener Farbe und eigenen Zeichen, der Fluss von der Stillen Quelle
durch die Nebelfurt in den Mondsee und weiter ins Meer; nichts liegt halb außerhalb der Küste). Die Orte auf der Karte liegen über dem Bild (Position in
Prozent aus `welt.xlsx`), ein neues Kartenbild braucht also nur passende Koordinaten.

## Tabellen

Alle drei Tabellen sind Quelle, nie Ziel. `tools/convert_data.py` liest sie und
schreibt `data/*.json`. Bei einem Fehler wird nichts geschrieben. Jede Tabelle hat ein
Blatt „Erklärung“ mit allen Spalten.

- `data/uebungen.xlsx`: eine Zeile je Übung und Stufe: id (Übung-Stufe, etwa
  `kaefer-1`; zugleich der Name des Bilds), bereich, teil (Platz in der Einheit), name,
  kurz, stufe, stufenname, xp (Anteil an der Aufgabe), zeit (Sekunden, auch in
  Abschnitten: „Erste Seite 30 | Andere Seite 30“), anleitung, wofuer, frage, antwort
  (ja-nein oder anstrengung), ansagen („0 Augen zu. | 30 Schultern fallen lassen.“),
  atemtakt, aktiv, notiz
- `data/ausruestung.xlsx`: id, slot, name, stufe, req_kraft, req_ausdauer,
  req_gelassenheit, req_beweglichkeit, faehigkeit, effekt, herkunft, preis,
  datei_figur, datei_icon, notiz
- `data/welt.xlsx`: Blätter Orte, Monster, Quests, Lagerstufen, Einrichtungen, Deko. Orte
  haben einen typ: lager (genau einer), truemmerfeld (höchstens einer: gleich beim Lager,
  dort wird ohne Weg gesammelt), wild, sammeln, ort, hoehle. Das Blatt Quests hat: id, name, ort, art (sammeln, erkunden, bauen, kampf, hoehle), text
  (mehrere Absätze durch Zeilenumbruch), monster, voraussetzung (auch `lager>=1`),
  tempo, ertrag, verbrauch, kosten (Energie vor Ort, je Energie zehn Sekunden), belohnung
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

- **Teile.** Jede Zeichnung ist ein Eintrag mit fortlaufender Nummer, für eine Figur
  (Frau, Mann oder beide) und einen Slot. Ein Name ist freiwillig; ohne heißt das Teil
  nach Slot und Nummer, ein vergebener Name ist eindeutig. Bei Frau oder Mann wird das
  Gegenstück für die andere Figur verknüpft; eine Zeichnung für beide trägt jede Figur
  gleich (die Vorschau lässt sich zwischen ihnen umschalten). Mehrere Zeichnungen lassen
  sich auf einmal hochladen: eine Liste mit Figur und Slot für alle oder je Zeile, dann
  „Alle anlegen“. Beim Hochladen entsteht das Icon im Browser: das Kleidungsstück
  allein, auf 256 × 256, weit auseinanderliegende Teile (zwei Handschuhe) rücken
  zusammen. Die Leinwand wird geprüft (1024 × 1536, durchsichtiger Hintergrund).
- **Vorgaben der Nutzerin**, alle freiwillig: Verwendung (Quest mit Thema, Erfolg,
  Zufallsbeute, Händlerware, Startausrüstung), Fortschritt (Anfänger 1–10, frühes
  Midgame 10–50, spätes Midgame 50–100, Endgame 100+; da die Stats bei 100 enden,
  heißt 100+: am Ziel), wichtige Werte und eine freie Idee.
- **Filter** nach Figur, Slot und Stand: freigegeben, gesperrt, im Spiel, nicht im Spiel,
  ohne Gegenstück (ein Teil für Frau oder Mann, dessen Fassung für die andere Figur
  nicht verknüpft ist; Teile für beide brauchen keins).
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
nennt ihn mit Uhrzeit, solange er läuft.

Der Bonus aufs Tageswerk wird auf die Punkte der Übung gerechnet und gerundet (14 → 15,
20 → 22, 28 → 31); als Zahl angezeigt wird der Gewinn nicht (siehe Anzeige). Da der Malus am
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
  und Haarfarbe (mit Vorschau), einen Namen und das Alter (Pflicht; es wählt die Übungen,
  siehe Kinder und Jugendliche). Der Name steht als Titel auf dem Charakterblatt. Aussehen,
  Name und Alter lassen sich in den Einstellungen ändern. Danach öffnet sich die
  Envoy-Seite mit dem Rundgang.
- **Rundgang** auf der Envoy-Seite: Beim ersten Öffnen der Seite (also gleich nach dem
  Erstellen) wird die Seite abgedunkelt, ein Teil leuchtet auf, daneben steht eine Karte
  mit einem Satz. Fünf Schritte: „Hier siehst du deinen Envoy.“ (die Figur), „Du kannst
  ihm andere Kleidung anlegen.“ (die Plätze), „In deinem Rucksack ist Platz für 5
  Gegenstände.“ (der Rucksack), „Mit einem Tipp auf das Portrait kommst du jederzeit
  hierher zurück.“ (das Portrait), „Durch das Tageswerk kannst du deinen Envoy stärken.“
  (der Tageswerk-Knopf; so früh wie möglich, auf Wunsch der Nutzerin). Jede Karte hat
  „Weiter“ und „Überspringen“ (auch die Esc-Taste), „1 von 5“ und beim letzten Schritt
  „Fertig“. Gesehen oder übersprungen
  kommt er nicht wieder (je Profil gemerkt); in den Einstellungen unter „Envoy“ lassen
  sich alle mit „Rundgänge ansehen“ wiederholen. Er ist kein Tutorial für die Übungen, nur ein
  Rundgang durch die Oberfläche.
- **Rundgang durch das Tageswerk** beim ersten Öffnen der Seite, drei Schritte: „Mach
  jeden Tag mit deinem Envoy diese Übungen. Nur so wird er besser, und du nebenbei auch.“
  (die vier Aufgaben), „Ein Tipp auf eine Aufgabe zeigt dir, wie ihre Übungen gehen.“ (die
  erste Aufgabe), „Vorsicht: Wenn du nichts machst, sinken die Werte deines Envoy langsam
  wieder.“ (die Werte). Die Sätze stammen von der Nutzerin.
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
  alle wieder. Für die anderen Seiten (Händler, Handbuch) folgen sie später.
- **Einstellungen:** angemeldet als, Stand des Abgleichs, „Jetzt abgleichen“,
  „Abmelden“ (die Daten bleiben auf dem Gerät und auf dem Server); ohne Konto „Konto
  erstellen“ und „Profil wechseln“. Unter „Envoy“ beim Mann der Schalter „Unterhemd“.

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
  gefundene der erreichten Lagerstufen), „Expedition beenden“ (Ereignis `test`;
  Material nur so viel, wie passt) und „Hinweis: Tageswerk liegen geblieben“ (zeigt den
  Hinweis am Tag danach, als wären Kraft und Gelassenheit gestern liegen geblieben),
  damit sich alles ohne Warten ausprobieren lässt, dazu
  „Kleiderkammer“: öffnet die Seite der Kleiderkammer auf claude.ai, auf iPad und Telefon
  in Safari statt in der Claude-App (Adresse mit `x-safari-https`, ab iOS 17), und „Link
  kopieren“ für die Adressleiste von Safari (beides auch schon vor dem ersten Envoy). In
  einem Fenster der App selbst geht es nicht: claude.ai lässt sich nicht einbetten. Die echte Fassung zeigt es nie, ohne dass jemand
  daran denken muss.
- **Echter Ordner**: nur der Zweig `main`. Dorthin kommt eine Fassung erst, wenn die
  Nutzerin sie im Testordner angesehen und freigegeben hat.

Die App fragt bei jedem Laden beim Server nach, ob sich eine Datei geändert hat, und
Bilder werden mit der App-Version angefragt. Eine neue Zeichnung unter altem Namen
erscheint so beim nächsten Öffnen, statt dass ein Gerät eine alte Kopie weiter zeigt.

## Entscheidungen

| Punkt | Entscheidung |
| --- | --- |
| Tagesaufgaben | je Bereich eine Einheit, jeden Tag dieselben Übungen, Stufe je Übung; nur Treppe für Ausdauer |
| Zeit statt Menge | feste Zeit je Übung, langsam und nur so viel wie sauber geht; geführter Timer mit Stimme |
| Rückfrage | je Übung gleich nach ihr, solange es eine nächste Stufe gibt; nicht im Krankheitsmodus, nicht bei Kindern bis 12; „Wie war es?“ statt „richtig gemacht?“ |
| Timer | je Übung; die nächste beginnt mit eigenem Tipp |
| Erledigen | jede Übung einer Einheit für sich („Käfer erledigt“), die letzte erledigt die Aufgabe; Haken der Zeile: alles Offene |
| Stufen | hoch nach zwei guten Durchgängen in Folge, runter nach zwei zu schweren in Folge; Durchgänge, nicht Kalendertage; Kinder: hoch nach drei Durchgängen |
| Energie vom Tageswerk | jede erledigte Aufgabe ein Viertel der Leiste, auch über ihr Ende hinaus (bis 5.11 ein Achtel) |
| Zeit und Wege | eine Energie dauert zehn Sekunden (bis 5.11 eine Minute); Wege kosten keine Energie, nur Zeit; ältere Ereignisse behalten die alten Regeln (`regel`, `RULE_SETS`) |
| Ausbau des Lagers | Aufwerten 15, 40, 85, 140 Energie am Stück (seit 5.19; die ersten leichter), Pläne 9, 18, 36 Chancen, Händler-Pläne 120 und 180 Bannsplitter |
| Bannsplitter aus Quests | Erkunden etwa zwei je Energie (seit 5.19), Kleidung von unterwegs mit der Güte wie bei Geistern |
| Schlafplatz | gibt seine Energie um 6 Uhr morgens; nachts gebaut zählt am selben Morgen |
| Ausrüstung | hebt nie einen Stat, ist aber wichtig: Güte (schlicht, gut, selten, prächtig) mit gewürfelten Boni für Kampf, Energie und Glück, größer bei stärkerem Envoy; ein Stück mit Anforderung hat deutlich größere Boni und ist nie schlicht |
| Tränke | Pilztee (+10) und Quellsud (+25) beim Händler, je zwei am Tag, nie über die Leiste |
| Aushang | drei Aufträge am Tag am Lager, ohne Energie, nur Zeit; der Lohn (Bannsplitter, oft Kleidung mit Güte) steht darauf; jeder einmal |
| Ruhm | kauft Kleidung mit Boni (mindestens selten) und Farben; Titel kommen mit den Rängen aus allem verdienten Ruhm |
| Die Tiefen | drei Tiefen mit je zehn Wächtern, ohne Energie, danach Rast (60 Minuten, mit Gelassenheit kürzer); Werte und Kleidung entscheiden, wie weit der Envoy kommt; zu stark heißt zurückziehen, nie scheitern |
| Arena | Forderungsrangliste mit Abbildern, Kämpfe vom Server entschieden, ohne Energie (seit 5.13); Stärke = Tage mit erledigter Aufgabe in den letzten 28 Tagen je Bereich (Fleiß, nicht Begabung); Ruhm als eigene Währung (Farben, Titel) |
| Berichte | jeder nur einmal, auch über Geräte hinweg |
| Lange Pause | nach je 7 Fehltagen jede Übung des Bereichs eine Stufe runter |
| Krankheitsmodus | Stufe 1, Übungen ohne Stufen halbe Zeit, 14 XP, zählt nicht für die Stufen, kein Malus-Erlass |
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
| Lagerbild aus Ebenen | Grundbild der Stufe, darauf ein Stapel in der Reihenfolge der Nutzerin: Gebäude (auch in Teilen), Einrichtungen, Deko und Ausschnitte aus dem Bild (Felsen, Feuer, Säulen) dazwischen; zu anderen Tageszeiten in deren Licht |
| Lagerbild groß | Tipp aufs Bild zeigt es ganz und so groß wie möglich, hochkant seitlich verschiebbar; ein Tipp schließt |
| Quests auf der Karte | Ort antippen fächert seine Quests auf (Siegel mit Namen), ein Tipp öffnet eine; der Fächer auch bei nur einer Quest |
| Ortsbeschreibung | Kartusche am Kartenrand zusammen mit dem Fächer: Region, Name, Text, bei verschlossenen Orten, was sie öffnet |
| Quest-Fenster | Text, Voraussetzung, Belohnung, Energie als Leiste: die Kosten als ein Block (ohne Weg, der kostet keine Energie); keine Dauer, keine Tempo- und Ertrag-Stats |
| Einrichtungen-Kacheln | Hygge als kleine Medaille am Zeichen; was sich bauen lässt, steht vorn (nächste Stufe mit Pfeil, Kosten, „Jetzt: …“ klein) |
| In Reihe | während der Envoy unterwegs ist, alles anhängen (Quests, Sammeln, Bauen); er geht direkt weiter; solange die Energie für die Arbeit reicht; Sammeln plant mit den besten Würfeln, brauchen sie mehr, fällt die letzte Aktion heraus |
| Energie | Name für die Leiste, 10 je Level Ausdauer, 1 Energie = 10 Sekunden (bis 5.11: 1 Minute) |
| Sammeln | auf dem Trümmerfeld (eigener Ort gleich beim Lager) ohne Weg, 2 bis 4 Stück je Energie gewürfelt, nie weniger als 2; Menge wählen, beginnt bei 1 |
| Mehr sammeln als tragbar | geht nicht: + stoppt an der Grenze und sagt warum (statt hinterher etwas liegen lassen zu müssen) |
| Lagerfeuer | die erste Quest: 8 Stein, 2 Pilzholz, 2 Energie; macht Lagerstufe 1 |
| Hygge | Summe der Einrichtungen und der Deko; ab Stufe 2 reichen die Einrichtungen allein nicht; als Zahl auf dem Bild, ohne Fortschrittsanzeige |
| Test-Knöpfe | am Schild „Test“ oben links, schwebend über der Seite (verschiebt nichts): Energie auffüllen, +50 Energie (über die Leiste hinaus, zum Aufwerten), +25 Stein, +25 Pilzholz, +50 Bannsplitter, Plan finden (ab Lagerstufe 2), Expedition beenden, Hinweis: Tageswerk liegen geblieben, Kleiderkammer öffnen (in Safari) und ihren Link kopieren; nur in der Testfassung |
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
| Wortwahl | „XP“ und „Level“ gibt es nur je Stat, nie für den Helden; ein Wert steht als 1.375 (Punkt, drei Stellen, nie aufgerundet); Gewinne ohne Zahl, nur „für Kraft“ |
| Talentbaum | Schild mit Schloss statt ausgegraut; eigene Seite, kein Fenster über der alten Ansicht |
| Rückgängig | nur für Tagesaufgaben am selben Tag |
