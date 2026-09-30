// The tours of the pages (see tour.js). The Envoy's page has one; it starts
// by itself the first time the page is opened, which is right after the
// Envoy has been created. Once it has been seen or skipped it stays away;
// the settings can start it again.

import { store } from '../store.js';
import { BACKPACK_SIZE } from '../config.js';
import { runTour } from './tour.js';

const ENVOY_TOUR = [
  { selector: '.char-grid .paperdoll', text: 'Hier siehst du deinen Envoy.' },
  { selector: '.doll-frame .slot-column', text: 'Du kannst ihm andere Kleidung anlegen.' },
  { selector: '.char-grid .pack', text: `In deinem Rucksack ist Platz für ${BACKPACK_SIZE} Gegenstände.` },
  { selector: '.topbar .portrait-rings', text: 'Mit einem Tipp auf das Portrait kommst du jederzeit hierher zurück.', round: true },
];

const seen = () => new Set(store.loadUi().toursSeen || []);

function setSeen(id, value) {
  const ui = store.loadUi();
  const set = new Set(ui.toursSeen || []);
  if (value) set.add(id); else set.delete(id);
  ui.toursSeen = [...set];
  store.saveUi(ui);
}

// Called when the Envoy's page has been drawn: starts the tour if it is new.
export function startEnvoyTourIfNew(stillHere) {
  if (seen().has('envoy')) return;
  // the images of the figure need a moment to take their place
  setTimeout(() => {
    if (stillHere()) runTour(ENVOY_TOUR, { onEnd: () => setSeen('envoy', true) });
  }, 450);
}

// From the settings: the tour is shown again on the Envoy's page.
export function resetEnvoyTour() {
  setSeen('envoy', false);
}
