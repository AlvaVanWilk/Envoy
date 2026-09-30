// The Anleitung in the Handbuch: one chapter per page. The first chapters
// are there from the start; the others appear once the person has met
// what they explain (the first spirit, the trader, the Talentbaum …).
// A chapter that appeared later is marked as new until it has been read.

import { h } from './dom.js';
import { store } from '../store.js';
import { talentsOpen } from './talents.js';
import { BACKPACK_SIZE } from '../config.js';

const ran = (game, kind) => Object.keys(game.state.world.quests)
  .some((id) => game.catalog.questById.get(id)?.kind === kind);

// when(game): the chapter is there; without `when` it is there from the start.
// text: paragraphs.
const CHAPTERS = [
  {
    id: 'zwischenwelt',
    title: 'Die Zwischenwelt',
    text: [
      'Dein Envoy lebt in der Zwischenwelt, einer Welt aus Trümmern, Nebel und stillen Orten. Dort zieht er los, sammelt, erkundet und begegnet Geistern.',
      'Stärker wird er nur auf eine Weise: durch dein Tageswerk. Jede echte Übung, die du machst, geht in seine Werte ein. Alles andere geschieht in der Welt.',
    ],
  },
  {
    id: 'tageswerk',
    title: 'Das Tageswerk',
    text: [
      'Jeden Tag wählt die App vier Aufgaben aus, eine für jeden Wert. Auswählen musst du nichts. Ein neuer Tag beginnt um 3 Uhr.',
      'Tippe auf eine Aufgabe, um sie zu öffnen. Dort stehen die Anleitung und, wo es passt, ein Zeitmesser. Manche Aufgaben fragen danach nach einem Messwert, etwa der Strecke.',
    ],
  },
  {
    id: 'stufe',
    title: 'Die Stufe der Übungen',
    text: [
      'Nach drei guten Durchgängen in Folge wird es etwas mehr, nach zwei zu schweren gleich wieder weniger. Bei einer neuen Übung fragt die App einmal, wie es war.',
      'Nach einer Woche Pause geht es eine Stufe leichter weiter.',
    ],
  },
  {
    id: 'liegenbleiben',
    title: 'Wenn etwas liegen bleibt',
    text: [
      'Bleibt eine Aufgabe liegen, passiert am ersten Tag nichts. Ab dem zweiten Tag sinkt ihr Wert langsam, ab dem achten schneller.',
      'Ganz verloren geht er nie: 60 % des besten Levels bleiben immer.',
    ],
  },
  {
    id: 'krankheit',
    title: 'Krankheit und Versehen',
    text: [
      'Im Krankheitsmodus gibt es nur die leichtesten Übungen, und sie zählen nicht für die Stufe.',
      'Aus Versehen abgehakt? Am selben Tag lässt es sich rückgängig machen.',
    ],
  },
  {
    id: 'werte',
    title: 'Werte und Level',
    text: [
      'Der Envoy hat vier Werte: Kraft, Ausdauer, Beweglichkeit und Gelassenheit. Jeder beginnt bei Level 1.',
      'Die vier Ringe um das Portrait zeigen, wie weit es bis zum nächsten Level ist. Ist ein Ring voll, steigt der Wert. Zeigst du auf einen Ring oder berührst ihn, steht dort das Level und wie viele XP noch fehlen.',
    ],
  },
  {
    id: 'wirkung',
    title: 'Was die Werte bewirken',
    text: [
      'In der Welt bestimmt Kraft den Schaden im Kampf. Ausdauer gibt Leben und eine längere Ausdauerleiste.',
      'Beweglichkeit macht Treffer und Ausweichen wahrscheinlicher. Gelassenheit hilft, Geister zu beruhigen, und lässt die Ausdauerleiste schneller wieder voll werden.',
    ],
  },
  {
    id: 'lager',
    title: 'Das Lager',
    text: [
      'Das Lager ist der Ort, an dem jede Expedition beginnt und endet. Dort siehst du, ob der Envoy da ist, was er an Vorrat hat und welche Geister heute gesichtet wurden.',
      'Die Ausdauerleiste zeigt, wie viel der Envoy noch unterwegs sein kann. Sie füllt sich mit der Zeit von selbst; die Aufgabe für Gelassenheit füllt sie zur Hälfte auf.',
    ],
  },
  {
    id: 'abenteuer',
    title: 'Abenteuer',
    text: [
      'Unter Abenteuer liegt die Karte der Zwischenwelt. Jeder Ort hat seine Quests: sammeln, erkunden, bauen, kämpfen.',
      'Eine Expedition dauert echte Zeit: Hinweg, vor Ort und Rückweg. Jeder Punkt Ausdauer ist eine Minute. Der Envoy ist immer nur auf einer Expedition zugleich.',
    ],
  },
  {
    id: 'nichts-scheitert',
    title: 'Nichts scheitert',
    text: [
      'In der Zwischenwelt scheitert nichts. Die Werte bestimmen, wohin der Envoy kommt, wie lange es dauert und wie viel er mitbringt.',
    ],
  },
  {
    id: 'rucksack',
    title: 'Der Rucksack',
    text: [
      `Im Rucksack ist Platz für ${BACKPACK_SIZE} Dinge. Du findest ihn beim Envoy.`,
    ],
  },
  {
    id: 'ausruestung',
    title: 'Ausrüstung',
    text: [
      'Ausrüstung macht den Envoy nie stärker. Sie gibt Fähigkeiten, etwa mehr Schaden oder weniger Ausdauer für lange Wege. Dafür verlangt sie Mindestwerte.',
      'Sinkt ein Wert unter die Voraussetzung, legt der Envoy das Teil ab. Es liegt dann wieder im Rucksack.',
    ],
  },
  {
    id: 'geister',
    title: 'Geister',
    when: (game) => Object.keys(game.state.world.bestiary).length > 0,
    text: [
      'Unterwegs begegnet der Envoy den Geistern der Zwischenwelt. Man kann sie besiegen, manche auch beruhigen. Ist einer zu stark, zieht sich der Envoy zurück; das kostet nur Zeit.',
      'Wen der Envoy getroffen hat, steht im Kompendium dieses Buchs.',
    ],
  },
  {
    id: 'hoehlen',
    title: 'Höhlen',
    when: (game) => ran(game, 'hoehle'),
    text: [
      'In einer Höhle warten mehrere Geister hintereinander. Der Envoy geht so weit, wie sein Leben reicht, und kehrt rechtzeitig um. Die Belohnung der Höhle gibt es, wenn alle Geister bezwungen sind.',
    ],
  },
  {
    id: 'sammeln',
    title: 'Sammeln',
    when: (game) => ran(game, 'sammeln'),
    text: [
      'Pilzholz und Stein bringt der Envoy von Sammelquests mit. Je höher die Werte, die bei einer Quest zählen, desto schneller geht die Arbeit und desto mehr bringt sie.',
    ],
  },
  {
    id: 'erfolge',
    title: 'Erfolge',
    when: (game) => Object.keys(game.state.achievements).length > 0,
    text: [
      'Manches, was der Envoy erreicht, wird zum Erfolg. Ein Erfolg bleibt für immer. Manche bringen eine Belohnung, die von da an gilt.',
      'Alle Erfolge stehen unter Erfolge in diesem Buch.',
    ],
  },
  {
    id: 'lagerausbau',
    title: 'Das Lager ausbauen',
    when: (game) => game.unlocked('zuhause'),
    text: [
      'Der Ausbau des Lagers ist freigeschaltet. Im Lager ist nun auch eine Kiste für Dinge, die nicht in den Rucksack passen. An sie kommt der Envoy nur, wenn er im Lager ist.',
    ],
  },
  {
    id: 'haendler',
    title: 'Der Händler',
    when: (game) => game.unlocked('haendler'),
    text: [
      'Der Händler bietet jeden Tag andere Ausrüstung an, passend zur Stärke des Envoy. Er zahlt in Bannsplittern und kauft auch, was der Envoy nicht mehr braucht.',
    ],
  },
  {
    id: 'talentbaum',
    title: 'Der Talentbaum',
    when: (game) => talentsOpen(game),
    text: [
      'Alle vier Werte haben Level 10 erreicht. Der Talentbaum ist offen.',
    ],
  },
];

const seen = () => new Set(store.loadUi().guideSeen || []);

export function markChapterRead(id) {
  const ui = store.loadUi();
  if ((ui.guideSeen || []).includes(id)) return;
  ui.guideSeen = [...(ui.guideSeen || []), id];
  store.saveUi(ui);
}

// Chapters that appeared later and have not been read yet.
export function newChapters(game) {
  const read = seen();
  return CHAPTERS.filter((c) => c.when && c.when(game) && !read.has(c.id));
}

// The menu point glows while there is a chapter the person has not been
// told about yet. Opening the Handbuch tells them; the chapter itself keeps
// its mark „Neu“ until it is read.
const announced = () => new Set(store.loadUi().guideAnnounced || []);

export function hasUnannouncedChapters(game) {
  const told = announced();
  return newChapters(game).some((c) => !told.has(c.id));
}

export function announceChapters(game) {
  const ui = store.loadUi();
  const told = new Set(ui.guideAnnounced || []);
  let changed = false;
  for (const c of newChapters(game)) {
    if (!told.has(c.id)) { told.add(c.id); changed = true; }
  }
  if (changed) {
    ui.guideAnnounced = [...told];
    store.saveUi(ui);
  }
}

// The pages of the Anleitung, for the book.
export function guidePages(game) {
  const unread = new Set(newChapters(game).map((c) => c.id));
  return CHAPTERS.filter((c) => !c.when || c.when(game)).map((c) => ({
    id: c.id,
    title: c.title,
    isNew: unread.has(c.id),
    onShow: () => markChapterRead(c.id),
    body: () => c.text.map((p) => h('p', {}, p)),
  }));
}
