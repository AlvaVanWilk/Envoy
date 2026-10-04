// The tours of the pages (see tour.js). Each page has one; it starts by itself
// the first time the page is opened (for the Lager only once it has its fire):
//   Envoy      right after the Envoy has been created: the figure, clothes, backpack,
//              portrait, and the Tageswerk, which alone makes the Envoy stronger
//   Tageswerk  the first visit: the exercises each day, a tap shows them, and the
//              values sink slowly when nothing is done
//   Abenteuer  the first visit of the map: what is on the page, and the first task
//   Lager      the first visit after the Lagerfeuer stands: furnishing the camp, and the Hygge
// Once a tour has been seen or skipped it stays away; the settings can show them again.

import { store } from '../store.js';
import { BACKPACK_SIZE } from '../config.js';
import { runTour } from './tour.js';
import { isSheetOpen } from './sheet.js';

const TOURS = {
  envoy: () => [
    { selector: '.char-grid .paperdoll', text: 'Hier siehst du deinen Envoy.' },
    { selector: '.doll-frame .slot-column', text: 'Du kannst ihm andere Kleidung anlegen.' },
    { selector: '.char-grid .pack', text: `In deinem Rucksack ist Platz für ${BACKPACK_SIZE} Gegenstände.` },
    { selector: '.topbar .portrait-rings', text: 'Mit einem Tipp auf das Portrait kommst du jederzeit hierher zurück.', round: true },
    { selector: '.topbar .daywork', text: 'Durch das Tageswerk kannst du deinen Envoy stärken.' },
  ],

  tageswerk: () => [
    { selector: '.today .task-list', text: 'Mach jeden Tag mit deinem Envoy diese Übungen. Nur so wird er besser, und du nebenbei auch.' },
    { selector: '.today .task-row:first-child .task-summary', text: 'Ein Tipp auf eine Aufgabe zeigt dir, wie ihre Übungen gehen.' },
    { selector: '.today .today-side', text: 'Vorsicht: Wenn du nichts machst, sinken die Werte deines Envoy langsam wieder.' },
  ],

  abenteuer: (game) => [
    { selector: '.map-frame', text: 'Das ist die Karte der Zwischenwelt. Tippe auf einen Ort, um zu sehen, was es dort zu tun gibt.' },
    { selector: '.world-supplies .supplies', text: 'Das ist der Vorrat deines Envoy: was er gesammelt hat.' },
    { selector: '.world-supplies .stamina', text: 'Das ist die Energie deines Envoy. Alles, was er tut, kostet Energie. Steigt seine Ausdauer, steigt auch seine Energie.' },
    { selector: '.world-expedition', text: 'Hier siehst du, was dein Envoy gerade tut. Das geht auch weiter, wenn du die App schließt.' },
    { selector: '.world-legend', text: 'Die Legende erklärt die Zeichen auf der Karte.' },
    {
      selector: '.place-marker[data-place="lager"]',
      round: true,
      text: game.state.world.camp.stage === 0
        ? 'Dein Envoy wird eine Weile hier bleiben. Am besten errichtest du ein Lagerfeuer.'
        : 'Das ist das Lager. Von hier bricht dein Envoy auf.',
    },
  ],

  lager: () => [
    { selector: '.camp-hero', text: 'Dein Envoy hat das Lagerfeuer errichtet.' },
    { selector: '.camp-build', text: 'Ab jetzt kannst du das Lager einrichten.' },
    { selector: '.camp-hygge', text: 'Hat es genug Hygge, kannst du es aufwerten.' },
  ],
};

const seen = () => new Set(store.loadUi().toursSeen || []);

function setSeen(id, value) {
  const ui = store.loadUi();
  const set = new Set(ui.toursSeen || []);
  if (value) set.add(id); else set.delete(id);
  ui.toursSeen = [...set];
  store.saveUi(ui);
}

// Called when a page has been drawn: starts its tour if it is new. stillHere()
// tells whether the person is still on that page. A report or another window
// that is open first gets closed by the person; the tour waits for that.
export function startTourIfNew(id, game, stillHere) {
  if (seen().has(id)) return;
  let tries = 0;
  const attempt = () => {
    if (!stillHere()) return;
    if (isSheetOpen() && tries < 60) { tries += 1; setTimeout(attempt, 500); return; }
    runTour(TOURS[id](game), { onEnd: () => setSeen(id, true) });
  };
  // the pictures of the page need a moment to take their place
  setTimeout(attempt, 450);
}

// From the settings: all tours are shown again, each on its page.
export function resetTours() {
  const ui = store.loadUi();
  ui.toursSeen = [];
  store.saveUi(ui);
}
