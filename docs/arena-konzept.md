# Arena und Ruhmeshalle – Entwurf

Stand: gebaut in Version 5.11.0, so wie in der Spezifikation („Arena und Ruhmeshalle“)
beschrieben. Dieser Entwurf bleibt als Hintergrund. Was anders kam als hier gedacht (die
Nutzerin: „mach das mal so, wie du es gut findest“, eine laufende Liste, Ruhm als Währung,
die Arena für sich):

- Statt Klassen und Saisons eine laufende Forderungsrangliste: herausfordern bis drei
  Plätze über oder unter dem eigenen, jedes Abbild einmal am Tag; ein Sieg gegen weiter
  oben nimmt den Platz. Wer 14 Tage nicht da war, ruht und beginnt wieder am Ende.
- Stark macht Fleiß, nicht Begabung: Der Server zählt je Bereich die Tage der letzten
  28 mit erledigter Aufgabe; Stufe, XP, Werte und Kleidung zählen in der Arena nicht. Er
  entscheidet den Kampf (acht Runden, danach nach Punkten; gleich fleißige gehen etwa zur
  Hälfte unentschieden aus, so gewünscht).
- Ruhm kauft vorerst Farben für färbbare Kleidung und Titel; Arena-Kleidung, Trophäen
  und eine Chronik können später dazukommen.
- Die Halle zeigt Platz, Name, Titel und das Abbild mit Kleidung; keine Werte.

## Grundgedanke: Sparring mit Abbildern

In der waffenlosen Kampfkunst gibt es den Übungskampf: man verbeugt sich vorher und
nachher, und wer unterliegt, hat trotzdem geübt. So soll die Arena sein.

Niemand kämpft gegen eine Person, sondern gegen ihr **Abbild**: Wer die Arena betritt,
stellt dort ein Abbild seines Envoy auf (Aussehen, Kleidung, Werte zu diesem Zeitpunkt,
eine gewählte Haltung). Andere fordern dieses Abbild heraus, wann es ihnen passt. Die
Person selbst muss dafür nicht online sein und erfährt später, wie es ausging.

Das passt zur Welt: Die Geister sind innere Dämonen, die Abbilder sind Spiegel – man
trifft in der Arena auf andere Wege, stark zu werden.

## Was es bringt

1. **Gesehen werden.** In der Ruhmeshalle steht das Abbild mit seiner Kleidung. Gesammelte
   und schöne Kleidung wird damit für andere sichtbar.
2. **Ruhm.** Eine eigene Währung, die es nur in der Arena gibt. Dafür gibt es Dinge, die
   man sonst nicht bekommt: Arena-Kleidung (wie immer nur Fähigkeiten, nie Werte),
   Trophäen und Banner als Deko fürs Lager (mit Hygge) und Titel für das eigene Abbild.
3. **Chronik.** Wer eine Saison in seiner Klasse anführt, bekommt eine Statue in der Halle,
   in der Kleidung, die er damals trug. Sie bleibt für immer.

Ruhm ist kein Heldenlevel: Er steigt nicht in Stufen, macht den Envoy nicht stärker und
ist nur ein Zähler der Arena.

## Kein Leistungsdruck (Punkt 2)

- **Klassen wie in der Kampfkunst.** Wer gegen wen antritt, bestimmt die Summe der vier
  Werte: Klasse I bis 20, II bis 40, III bis 80, IV bis 160, V darüber (Grenzen noch
  offen). Die Klasse gilt die ganze Saison, so wie sie zu Beginn war. Gekämpft wird in
  der eigenen Klasse. Mehr Training verschafft also keinen Vorteil in der Rangliste,
  es führt nur in der nächsten Saison in eine höhere Klasse, wo man wieder unten anfängt.
- **Ruhm geht nie verloren.** Sieg +3, unentschieden +2, unterlegen +1 (fürs Antreten).
  Wird das eigene Abbild herausgefordert, gibt es nur etwas dazu, nie etwas weg.
- **Keine echten Übungsdaten.** Die Halle zeigt nie Werte, Tageswerk, Serien oder wie oft
  jemand trainiert. Sichtbar sind Name, Abbild, Klasse, Titel und Ruhm der Saison.
- **Begrenzt durch Energie.** Ein Kampf kostet Energie wie alles (etwa 6 mit Weg), es gibt
  keine zusätzlichen Pflichten und nichts, was man täglich tun müsste.
- **Unterliegen kostet nur Zeit** (Punkt 5), nie Training.

## Der Kampf

- Die Arena ist ein Ort auf der Karte. Man wählt in der Ruhmeshalle ein Abbild, der Envoy
  geht hin, und der Kampf läuft Runde für Runde wie bei den Geistern, live zu verfolgen
  (Lebensleisten, Treffer, Ausweichen, Tagebuch).
- **Haltung.** Jedes Abbild hat eine Haltung, die man selbst wählt: *Angriff*, *Abwehr*
  oder *Ruhe*. Abwehr kontert Angriff, Ruhe löst Abwehr auf, Angriff überrumpelt Ruhe
  (je ein kleiner Vorteil). Wer herausfordert, wählt seine Haltung, ohne die des Abbilds
  zu kennen. So entscheidet nicht nur, wer mehr Werte hat.
- Ausgang: Sieg, unentschieden (nach 12 Runden ohne Entscheidung) oder unterlegen. Danach
  verbeugen sich beide; das ist auch das Bild im Bericht.
- Gelassenheit wirkt wie sonst: Ein ruhiges Abbild kann einen Kampf in Ehren beenden
  (unentschieden).

## Die Ruhmeshalle (eine Seite)

- Rangliste der Saison in der eigenen Klasse, die anderen Klassen zum Umschalten
- Galerie der Abbilder (kleine Figur in ihrer Kleidung, Name, Titel); ein Tipp:
  herausfordern
- Chronik mit den Statuen früherer Saisons
- Das eigene Abbild: Haltung und Titel wählen, aktualisieren, aus der Arena zurückziehen
- Nachrichten an das eigene Abbild: „Jonas hat dein Abbild herausgefordert. Unentschieden,
  +2 Ruhm.“

Eine Saison dauert einen Monat. Danach beginnt die Rangliste neu; gesammelter Ruhm als
Währung bleibt.

## Kinder und Privatsphäre

- Nur mit Konto und nur Konten auf dem eigenen Server (Familie, Freunde; bisher höchstens
  30).
- Sichtbar ist nur der Name des Envoy und sein Abbild. Kein Chat, keine freien Nachrichten.
- Mitmachen ist freiwillig: Abbild aufstellen oder zurückziehen, jederzeit.
- Die Verwalterin kann ein Abbild aus der Halle nehmen (etwa bei einem unpassenden Namen).

## Technik (kurz)

- `sync.php` bekommt eine gemeinsame Liste: die Abbilder (Name, Aussehen, getragene Teile,
  Werte, Klasse, Haltung, Titel) und die Kämpfe. Neue Aktionen: Abbild aufstellen oder
  zurückziehen, Halle holen, Kampf eintragen.
- Ein Kampf wird aus beiden Abbildern und einer Zufallszahl berechnet; jedes Gerät kann
  ihn nachrechnen, alle sehen dasselbe.
- Vertrauen: Die App meldet ihre Werte selbst. Für eine Familie reicht das; Mogeln wäre
  technisch möglich.
- Die Arena-Kämpfe sind Ereignisse im eigenen Konto wie alles andere; Ruhm ergibt sich
  daraus und aus den Herausforderungen durch andere.

## Offene Fragen an die Nutzerin

1. Klassen nach der Summe der Werte, festgelegt zu Saisonbeginn – passt das?
2. Ruhm auch fürs Unterliegen (+1) und für Herausforderungen des eigenen Abbilds?
3. Was gibt es für Ruhm: Arena-Kleidung (braucht Zeichnungen), Lager-Deko, Titel?
4. Saison ein Monat?
5. Die drei Haltungen Angriff, Abwehr, Ruhe – passt das zur Kampfkunst, wie du sie dir
   vorstellst?
6. Ab wann offen: gleich mit dem Lagerfeuer, oder später?
