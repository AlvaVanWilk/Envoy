# Envoy – Spezifikation Kernmechanik

Stand 26.09.2026 · Sandra

Übernommen aus dem Dokument „Envoy – Spezifikation Kernmechanik“ vom 19.09.2026.
Stellen, die beim Bau von Phase 1 präzisiert oder angeglichen wurden, sind mit
**[Phase 1]** markiert und im Abschnitt [Entscheidungen beim Bau von Phase 1](#entscheidungen-beim-bau-von-phase-1)
begründet.

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

**Reihenfolge des Baus.** Die Gesundheits-Seite ist der wahre, wenn auch weniger
betonte Kern und wird zuerst vollständig umgesetzt. Die RPG-Seite ist die Hülle und
folgt darauf. Der Skilltree existiert in Phase 1 nur als ausgegrautes Symbol ohne
Funktion dahinter.

Look eines modernen, professionellen RPGs mit Held (Envoy) im Mittelpunkt.

## Die vier Stats

Alle vier starten bei 1, Obergrenze 100. Der Held sammelt keine allgemeine
Erfahrung: es gibt kein Helden-XP und kein Heldenlevel. XP existiert nur pro Stat.

| Stat | Reale Entsprechung | Kampfrolle |
| --- | --- | --- |
| Kraft | Kraftübungen, Tiefenmuskulatur | Schadenshöhe |
| Ausdauer | Gehen, Radfahren, Grundausdauer | maximales Leben, Ausdauerleiste |
| Gelassenheit | Meditation, Atemübungen, Ruhe | Regenerationstempo |
| Beweglichkeit | Dehnen, Mobility, Yoga | Treffer- und Ausweichchance |

## Tagesaufgaben

Jeden Tag gibt die App genau vier Aufgaben(päckchen) vor, eine je Bereich. Sie sind
**nicht auswählbar**. Welche konkrete Übung zugeteilt wird, berechnet die App anhand
von Übungsergebnissen der letzten Tage und nach Bedarf Feedback.

| Bereich | Stat | Beispiele in Phase 1 |
| --- | --- | --- |
| Tiefenmuskulatur | Kraft | Beckenboden, Rumpfstabilität |
| Stretching / Mobility | Beweglichkeit | Strecken, Fuß im Sitzen aufs Knie |
| Ausdauer | Ausdauer | 10 / 20 / 30 Minuten spazieren, Treppensteigen |
| Entspannung | Gelassenheit | 3 Minuten Atemübung, Augen schließen. Entspannungsübungen |

### Auswahl der Übung [Phase 1]

Reihenfolge der Regeln, mit der die App je Bereich die Übung des Tages bestimmt:

1. Übungen der aktuellen Intensitätsstufe des Bereichs (siehe unten). Gibt es auf
   dieser Stufe keine, gilt die nächstniedrigere vorhandene.
2. Nicht dieselbe Übung wie gestern, sofern es eine andere gibt.
3. Nicht dieselbe Muskelgruppe wie gestern, sofern es eine andere gibt.
4. Von den übrigen die, die am längsten nicht dran war.
5. Gleichstand entscheidet eine aus dem Datum abgeleitete Zahl, damit alle Geräte
   dieselbe Übung zeigen.

Einmal zugeteilt, bleibt die Übung für den Tag bestehen.

**Steigerung der Übungsintensität:** hoch nach drei erfolgreichen Durchgängen in
Folge, runter schon nach zwei zu schweren. Langsam hoch, schnell runter.

Nach jeder Übung fragt die App „Wie war es?“ mit **Leicht**, **Passend** oder
**Zu viel**. Leicht und Passend zählen als erfolgreicher Durchgang, Zu viel als zu
schwer. Die neue Stufe gilt ab dem nächsten Tag. **[Phase 1]**

Gemessene Werte (Dauer, Strecke, Tempo, Stockwerke, Haltezeit, Wiederholungen)
können nach der Übung von Hand eingetragen werden, immer freiwillig. Welche Felder
erscheinen, steht im Übungskatalog. **[Phase 1]**

### Muskelgruppen und Regenerationslogik

In Phase 1: Jede Übung kann eine Muskelgruppe (bei Beweglichkeit: Körperregion)
tragen. Die App vermeidet dieselbe Gruppe an zwei Tagen hintereinander, solange eine
Alternative auf derselben Stufe existiert. **[Phase 1]**

## XP und Levelkurve

Jede erledigte Tagesaufgabe gibt XP auf ihren Stat. Der Stat steigt eine Stufe,
sobald die XP-Leiste voll ist.

**XP pro Übung: 14 bis 28, Schnitt 20.** Die Höhe hängt am Umfang der konkreten
Übung, nicht am Bereich. 10 Minuten spazieren = 14, 20 Minuten = 20, 30 Minuten = 28.
Gleiches Prinzip in allen vier Bereichen. Dass die Stats unterschiedlich schnell
steigen, ergibt sich allein daraus, welche Übungen zugeteilt werden.

Die XP-Höhe steht bei jeder Übung sichtbar dabei.

### Formel

```latex
\text{XP}(n \rightarrow n+1) = 45 \cdot n^{0{,}45} \cdot \left(1 + \left(\frac{\max(0,\; n-9)}{6}\right)^{2}\right)
```

Das Ergebnis wird auf ganze XP gerundet. **[Phase 1]**

Bis Level 10 wirkt nur der erste Teil, die Kurve läuft flach. Ab Level 10 greift der
zweite Faktor und die Kurve zieht an. Der Knick liegt genau auf der
Skilltree-Freischaltung, also dort, wo höherwertige Übungen dazukommen.

| Level | XP bis zum nächsten |
| --- | --- |
| 1 → 2 | 45 |
| 2 → 3 | 61 |
| 3 → 4 | 74 |
| 5 → 6 | 93 |
| 9 → 10 | 121 |
| 10 → 11 | 130 |
| 15 → 16 | 304 **[Phase 1]** |
| 20 → 21 | 756 **[Phase 1]** |
| 30 → 31 | 2755 **[Phase 1]** |

Summe bis Level 10: 802 XP.

### Gegenprobe

- **Erstes Levelup:** Zwei starke Tage (2 × 28 = 56) reichen für die 45 — frühestens
  Tag 2. Vier schwache Tage (4 × 14 = 56) reichen ebenfalls — spätestens Tag 4. Im
  Schnitt fällt es auf Tag 3.
- **Level 10, schnellster Fall:** 802 ÷ 28 = 29 Tage, gut 4 Wochen.
- **Level 10, langsamster Fall:** 802 ÷ 14 = 57 Tage, 8,2 Wochen — unter der Grenze
  von 9 Wochen.
- **Normalfall:** erster Stat auf 10 nach etwa 5,5 Wochen, letzter nach 7 bis 8 Wochen.

### Anzeige

Im Charakterfenster steht unter jedem Stat der Fortschritt als Zahl (z. B. 4/45).
Eine spätere Umstellung auf einen Balken ist rein visuell.

In Phase 1 stehen Zahl und Balken zusammen. **[Phase 1]**

## Malus bei Nichterledigung

Die Regel gilt pro Stat und pro Tag, an dem die zugehörige Tagesaufgabe weder
erledigt noch (ab Phase 2) durch eine Skillübung desselben Bereichs ersetzt wurde.

| Tag | Wirkung |
| --- | --- |
| 1 | kein Zuwachs, kein Abzug |
| 2 bis 7 | Malus = 0,25 × durchschnittlicher Tagesgewinn |
| ab Tag 8 | Malus = 1,0 × durchschnittlicher Tagesgewinn |

**Bezugsgröße.** Der durchschnittliche XP-Gewinn dieses Stats über die letzten
sieben aktiven Tage. Nicht die Leistung eines einzelnen Tages, sonst bestraft ein
Ausfall nach einem starken Tag härter als nach einem schwachen.

„Aktiver Tag“ heißt: ein Tag, an dem die Aufgabe dieses Stats erledigt wurde. Gibt
es noch keine sieben, zählen die vorhandenen; gibt es keinen, ist der Malus 0. Der
Malus wird auf ganze XP gerundet. **[Phase 1]**

**Einheitlicher Faktor für alle vier Stats.** Physiologisch zerfällt Kraft langsamer
und Ausdauer schneller, aber der Unterschied ist über wenige Fehltage marginal, und
ein einheitlicher Wert bezieht den Gewohnheitsanteil mit ein.

**Der Stat kann sinken.** Läuft die XP-Leiste leer, fällt der Stat eine Stufe und die
Leiste läuft dort weiter rückwärts.

**Bodensatz: 60 % des jemals höchsten erreichten Levels.** Wer nie über 3 kam, fällt
auf 1 bis 2 zurück. Wer 30 erreicht hat, fällt nie unter 18. Das bildet
Muskelgedächtnis ab und trifft die Forschungslage: kürzlich erworbene Zugewinne gehen
vollständig verloren, während Trainierte nie auf das Ausgangsniveau zurückfallen.

Der Bodensatz wird als Level mit Nachkommastelle gelesen: 60 % von 3 = 1,8, also
Level 1 mit zu 80 % gefüllter Leiste. **[Phase 1]**

**Untergrenze:** Level 1, 0 XP.

### Einordnung

Der Malus ab Tag 2 ist Spielmechanik, keine Physiologie — messbarer Abbau setzt je
nach Bereich erst nach 10 bis 21 Tagen ein. Die Staffelung bildet das ab: klein
während der Schonfrist, voll danach.

### Tagesgrenze [Phase 1]

Ein Tag beginnt um 3:00 Uhr Ortszeit, nicht um Mitternacht. Eine Atemübung um
0:30 Uhr zählt damit noch für den Tag, zu dem sie gehört. Ein Tag gilt als
abgeschlossen, sobald der nächste beginnt; erst dann greift der Malus.

## Skilltree (Phase 2)

In Phase 1 nur als ausgegrautes Symbol im Menü vorhanden, ohne Funktion dahinter.

**Freischaltung: alle vier Stats auf Level 10.** Fällt ein Stat wieder unter 10,
schließt sich der Baum. Es gibt keinen separaten Fortschrittsbalken — die Stats sind
das einzige Fortschrittssystem.

### Aufbau

Je ein Baum pro Stat, kuratiert statt vollständig. Nur Übungen mit echter
Progression erscheinen; Spazieren und Treppensteigen sind immer verfügbar und stehen
in keinem Baum.

Die Form folgt dem Wesen des Bereichs:

| Stat | Form | Begründung |
| --- | --- | --- |
| Kraft | verzweigt | Bewegungsmuster bauen aufeinander auf |
| Ausdauer | parallele Wege | Modalitäten sind austauschbar (Schwimmen, Radfahren, Joggen, Skateboard, Ropeskipping, Zumba) |
| Beweglichkeit | verzweigt nach Körperregion | Spezialisierungsäste weiter oben: Yoga, Animal-like, Mobility |
| Gelassenheit **[Phase 1: vorher „Konzentration“]** | schmal und tief | Meditation wird länger und tiefer, nicht breiter |

### Zwei Ebenen

**Zwischen Übungen ein Netz, innerhalb einer Übung eine Leiter.**

- **Knoten** = eine Übung mit eigener Position im Netz. Trägt Voraussetzungen,
  Muskelgruppen, Cooldown-Klasse, bediente Stats, Widerstands-Basiswert.
- **Stufe** = schwerere Version derselben Bewegung, ohne eigene Netzposition. Trägt
  Zielvorgabe, Plateau je Stat, Dauer, Zubehör, Widerstands-Versatz,
  Meisterungskriterium, Bild.

Abgrenzungsregel: gleiche Bewegung, gleiche Muskeln, gleiches Zubehör → Stufe. Andere
Bewegung oder andere Voraussetzungen → eigener Knoten. Handstand an der Wand und
freier Handstand sind Stufen. Kniebeuge und Ausfallschritt sind Knoten.

Stufen erscheinen nicht auf der Karte, sondern stecken im Knoten.

### Durchlässigkeit

- **Ab 3/5 öffnen sich die darüberliegenden Knoten, bei 5/5 gibt es die
  Auszeichnung.** Wer eine Endstufe nie schafft, hängt nicht fest.
- Eine nicht schaffbare Stufe blockiert die Übung nicht, sie deckelt sie nur auf dem
  Plateau der letzten erreichbaren Stufe.
- Voraussetzungen sind ODER-fähig („X oder Y gemeistert“).
- **Jede Muskelgruppe und jede Beweglichkeitsregion muss über mindestens zwei bis drei
  unabhängige Übungen erreichbar sein.** Redundanz der Wege ist die eigentliche
  Lösung, nicht die Form des Netzes.

### Plateau

Jede Stufe hat ein Plateau je Stat. Der Statwert nähert sich ihm asymptotisch:
schnell am Anfang, immer langsamer. Wer mehr macht, kommt schneller ans Plateau, nie
darüber. Weiterkommen erfordert Progression, nicht Volumen.

Damit ist Farmen kein Problem: Meditation und Yoga dürfen unbegrenzt gemacht und voll
belohnt werden. Mobility bleibt begrenzt, weil grenzenloses Dehnen ungesund ist.

Mehrfachwirkung ist erlaubt und erwünscht: Yoga zahlt anteilig in Beweglichkeit und
Gelassenheit ein, mit je eigener Rate und eigenem Plateau. Yoga trägt in Gelassenheit
weniger weit als Meditation und in Beweglichkeit weniger weit als eine reine
Mobility-Übung.

### Verhältnis zu den Tagesaufgaben

- Die vier Tagesaufgaben bleiben bestehen und geben weiter Stat-XP.
- Eine Skillübung des passenden Bereichs kann die Tagesaufgabe **ersetzen**. Dann
  greift kein Malus. Es zählt nur die XP der Skillübung, was unproblematisch ist, weil
  sie höher liegt.
- Die ersetzte Tagesaufgabe wird **grün gefärbt, aber nicht abgehakt** und kann
  zusätzlich erledigt werden.
- Fehlt beides, greift der Malus wie beschrieben.
- Auf die Skills selbst gibt es keinen Malus. Der Rückschritt ergibt sich von selbst,
  weil nach langer Pause die nötigen Wiederholungen schwerer fallen.

### Meisterung einer Stufe

Beide Bedingungen müssen erfüllt sein: die objektive Zielvorgabe erreicht
(Wiederholungen, Zeit, Sätze) **und** die Anstrengungsrückmeldung unter der Schwelle,
dreimal hintereinander.

## Ausrüstung und Kampf

**Ausrüstung erhöht nie Stats.** Sie stellt Voraussetzungen und gibt besondere
Fähigkeiten (zusätzlicher Schaden, Ausweichrolle, verkürzte Ruhezeit).

**Voraussetzung.** Jedes Teil verlangt Mindestwerte in einem oder mehreren Stats. Wer
sie nicht erfüllt, kann es nicht tragen.

**Bei Unterschreitung** fliegt das Teil automatisch aus dem Slot, bleibt aber im
Inventar / Schrank. Die Figur sieht dort aus, als trüge sie nichts. Die App zeigt
im Charakterfenster, was abgelegt wurde und warum. **[Phase 1]**

**Schrank in Phase 1.** Solange es keine Welt gibt, in der Kleidung gefunden wird,
stehen alle Teile aus der Ausrüstungstabelle im Schrank. Anlegen lässt sich ein Teil,
sobald die Voraussetzungen erfüllt sind. **[Phase 1, offene Frage]**

### Zugang zu Inhalten

Es gibt kein Heldenlevel. Inhalte werden über vier Bedingungstypen freigeschaltet,
beliebig kombinierbar:

1. **Statschwelle** — „Beweglichkeit ≥ 14, um durch den Spalt zu passen“
2. **Übungslevel** (Skilltree) — „Liegestütz-Progression Stufe 4“, etwa wenn man
   jemandem etwas beweisen muss
3. **Kumulierte reale Leistung** — „200 Treppenstufen insgesamt“, um einen Turm zu
   erreichen
4. **Besitz** — ein bestimmtes Item oder eine abgeschlossene Quest

### Kampf

Kämpfe werden gewürfelt. Stats und Ausrüstung beeinflussen den Wurf über die Rollen
aus dem Stat-Abschnitt.

Erkundungen verbrauchen Ausdauer aus der Leiste. Ist sie leer, braucht der Held
Regeneration. Ruhezeiten lassen sich durch hohe Gelassenheit, reale regenerative
Übungen und Item-Boni verkürzen.

Eine Niederlage kostet nie zusätzliche reale Aufgaben.

## Charakterfenster und Paperdoll

Die Figur wird aus übereinandergelegten transparenten Ebenen in identischem
Bildausschnitt zusammengesetzt. Es wird nie eine Kombination gezeichnet, nur
Einzelteile, die immer an derselben Stelle sitzen. Kombinatorische Explosion gibt es
dadurch nicht.

### Technische Vorgaben

| Eigenschaft | Vorgabe |
| --- | --- |
| Format | PNG-24 mit Alphakanal |
| Hintergrund | vollständig transparent, auch bei der Basisfigur |
| Leinwand | 1024 × 1536 px, für jede Ebene identisch |
| Auflösung | 72 dpi (nur die Pixelmaße zählen) |
| Dateigröße | Master beliebig, Auslieferung später als WebP |
| Beschnitt | nie zuschneiden — jede Ebene behält die volle Leinwand |

Der letzte Punkt ist der wichtigste: Ein Brustpanzer wird als 1024 × 1536 großes, zu
90 % leeres Bild gespeichert. Zuschneiden zerstört die Positionsinformation.

### Ebenenreihenfolge (hinten nach vorn) [Phase 1]

1. Umhang hinten
2. Basisfigur (Körper, Kopf, Grundkleidung)
3. Beinkleidung
4. Schuhe
5. Torso
6. Gürtel
7. Handschuhe / Unterarme
8. Schulterstücke
9. Frisur / Kopfbedeckung

Es gibt keinen Waffen-Slot — der Envoy kämpft waffenlos.

### Icons

Icons werden **nicht** aus der getragenen Grafik ausgeschnitten. Sie sind
eigenständige, stilisierte, neutrale Ansichten des Gegenstands.

- 256 × 256 px, transparent, PNG-24

### Ausrüstungstabelle

Wird als Tabellendatei gepflegt (Numbers oder Excel), nicht von Hand als CSV
geschrieben: `data/ausruestung.xlsx`. Spalten:

`id`, `slot`, `name`, `stufe`, `req_kraft`, `req_ausdauer`, `req_gelassenheit`,
`req_beweglichkeit`, `faehigkeit`, `datei_figur`, `datei_icon`, `notiz`

`req_gelassenheit` hieß vorher `req_konzentration`; der alte Name wird weiter
gelesen. **[Phase 1]**

Slots: torso, beine, schuhe, guertel, handschuhe, schultern, kopf, umhang.
**[Phase 1: kein Slot „waffe“]**

`faehigkeit` gibt nie Stats. Leer bedeutet keine Fähigkeit. Eine `req_`-Spalte mit 0
bedeutet keine Voraussetzung.

Dateinamen: `slot_name_stufe.png` in `assets/figur/`, Icons mit Präfix `icon_` in
`assets/icons/`. Bleiben `datei_figur` oder `datei_icon` leer, setzt die Umwandlung
diese Namen ein. **[Phase 1]**

### Übungstabelle [Phase 1]

`data/uebungen.xlsx`, eine Zeile je Übung:

| Spalte | Bedeutung |
| --- | --- |
| `id` | eindeutiger Name, nach der ersten Nutzung nicht mehr ändern |
| `bereich` | Kraft, Ausdauer, Beweglichkeit oder Gelassenheit |
| `stufe` | Intensität innerhalb des Bereichs, 1 = leichteste |
| `name` | Titel in der App |
| `xp` | 14 bis 28, nach Umfang |
| `anleitung` | ein Schritt pro Zeile |
| `muskelgruppe` | optional, für die Regenerationslogik |
| `messung` | optional: dauer_min, strecke_km, tempo_kmh, stockwerke, haltezeit_s, wiederholungen |
| `timer_min` | optional, zeigt einen Timer |
| `atemtakt` | optional, z. B. 4-6 oder 4-4-4-4 (Sekunden je Atemphase) |
| `aktiv` | nein = wird nicht mehr zugeteilt |
| `notiz` | nur für die Pflege, erscheint nicht in der App |

Beide Tabellen sind Quelle, nicht Ziel. `tools/convert_data.py` liest sie und
schreibt `data/uebungen.json` und `data/ausruestung.json`. Bei einem Fehler in einer
Zeile wird nichts geschrieben.

## Speicherung und Geräteabgleich [Phase 1]

Gespeichert wird eine Liste von Ereignissen (Übung zugeteilt, erledigt, rückgängig,
angelegt, abgelegt), nie ein fertiger Spielstand. Der Spielstand wird bei jedem Start
aus dieser Liste neu berechnet, Tag für Tag, inklusive Malus und Bodensatz.

Die Liste liegt im Browser. `sync.php` auf dem eigenen Webspace gleicht sie zwischen
Geräten ab: Jedes Gerät schickt, was der Server noch nicht kennt, und bekommt, was es
selbst noch nicht hat. Es wird nie etwas überschrieben, darum gibt es keine
Konflikte. Zugeteilt ist bei zwei Geräten am selben Tag die zuerst zugeteilte Übung.

Ein Schlüssel verbindet die Geräte. Er wird in den Einstellungen erzeugt und auf dem
zweiten Gerät eingegeben.

## Entscheidungen beim Bau von Phase 1

| Punkt | Entscheidung | Grund |
| --- | --- | --- |
| Tabellenwerte der Levelkurve | 15 → 16 = 304, 20 → 21 = 756, 30 → 31 = 2755 | So rechnet die Formel; vorher standen 305, 754, 2756. Formel unverändert. |
| Rundung | XP-Schwellen und Malus auf ganze XP gerundet | Die Anzeige „4/45“ braucht ganze Zahlen; Summe bis Level 10 bleibt 802. |
| Bodensatz | als Level mit Nachkommastelle | trifft „fällt auf 1 bis 2 zurück“ genau |
| Aktiver Tag | Tag, an dem die Aufgabe des Stats erledigt wurde | Bezugsgröße des Malus |
| Tagesgrenze | 3:00 Uhr | späte Übungen zählen für ihren Tag |
| Stat-Name | Gelassenheit statt Konzentration, auch in `req_` | einheitlich mit dem Rest der Spezifikation |
| Slots | 8 Slots, kein Waffen-Slot, Ebenenreihenfolge mit 9 Ebenen | Arbeitsanweisung, waffenlose Kampfkunst |
| Rückmeldung | Leicht / Passend / Zu viel nach jeder Übung | Grundlage für „drei erfolgreich, zwei zu schwer“ |
| Intensitätsstufe | wird nirgends als Zahl angezeigt | keine Leistungsdarstellung der Grundübungen |
| Schrank | alle Teile sichtbar, anlegbar ab erfüllter Voraussetzung | es gibt in Phase 1 keine Welt zum Finden |
| Rückgängig | nur am selben Tag | Tippfehler korrigieren, Vergangenheit bleibt fest |
