// The Anleitung in the Handbuch: one chapter per page. The first chapters
// are there from the start; the others appear once the person has met
// what they explain (the first spirit, the trader, the Talentbaum …).
// A chapter that appeared later is marked as new until it has been read.

import { h } from './dom.js';
import { store } from '../store.js';
import { talentsOpen } from './talents.js';
import { BACKPACK_SIZE } from '../config.js';
import { depthsOpen } from '../world/depths.js';
import { jobsOpen } from '../world/jobs.js';

// The kind of a quest the Envoy has done; gathering and building at the camp are not in the table.
const kindOf = (game, id) => (id.startsWith('gather:') ? 'sammeln' : id.startsWith('bau:') ? 'bauen' : game.catalog.questById.get(id)?.kind);
const ran = (game, kind) => Object.keys(game.state.world.quests).some((id) => kindOf(game, id) === kind);

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
      'Jeden Tag gibt die App vier Aufgaben vor, eine für jeden Wert. Auswählen musst du nichts. Ein neuer Tag beginnt um 3 Uhr.',
      'Tippe auf eine Aufgabe: Sie dreht sich um wie eine Karte. Dort stehen die Übungen mit ihren Schritten und ein Timer, der durch jede Übung führt und ansagt, was kommt. Die nächste beginnt erst, wenn du sie antippst.',
    ],
  },
  {
    id: 'stufe',
    title: 'Die Stufe der Übungen',
    text: [
      'Jede Übung hat ihre Stufe. Danach fragt die App kurz, wie es ging. Zweimal in Folge gut, und die Übung geht eine Stufe weiter; zweimal in Folge zu viel, und sie geht eine Stufe zurück.',
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
      'Der Envoy hat vier Werte: Kraft, Ausdauer, Beweglichkeit und Gelassenheit. Jeder beginnt bei 1.',
      'Ein Wert steht als Zahl wie 1.375: vorn groß das Level, hinter dem Punkt klein, wie weit es bis zum nächsten ist. Jede erledigte Aufgabe zahlt auf ihren Wert ein.',
      'Die vier Ringe um das Portrait zeigen dasselbe. Ist ein Ring voll, steigt das Level. Zeigst du auf einen Ring oder berührst ihn, steht dort der Wert.',
    ],
  },
  {
    id: 'wirkung',
    title: 'Was die Werte bewirken',
    text: [
      'In der Welt bestimmt Kraft den Schaden im Kampf. Ausdauer gibt Leben und mehr Energie: zehn Energie je Level.',
      'Beweglichkeit macht Treffer und Ausweichen wahrscheinlicher. Gelassenheit hilft, Geister zu beruhigen, und lässt die Energie schneller wieder voll werden.',
    ],
  },
  {
    id: 'energie',
    title: 'Energie',
    text: [
      'Alles, was dein Envoy tut, kostet Energie: Sammeln, Erkunden, Bauen und Kämpfe. Wege kosten keine Energie, nur ein wenig Zeit.',
      'Je Level Ausdauer hat die Leiste zehn Energie. Sie füllt sich in etwa acht Stunden von selbst. Jede erledigte Aufgabe des Tageswerks gibt ein Viertel der Leiste dazu, auch über ihr Ende hinaus.',
    ],
  },
  {
    id: 'lager',
    title: 'Das Lager',
    text: [
      'Das Lager liegt auf der Trümmerebene.',
      'Zuerst braucht es ein Lagerfeuer. Danach lässt sich das Lager einrichten.',
    ],
  },
  {
    id: 'abenteuer',
    title: 'Abenteuer',
    text: [
      'Unter Abenteuer liegt die Karte der Zwischenwelt. Jeder Ort hat seine Quests: sammeln, erkunden, bauen, kämpfen. Ein Tipp auf den Ort zeigt sie.',
      'Eine Expedition dauert echte Zeit: Hinweg, vor Ort und Rückweg. Jede Energie dauert zehn Sekunden. Der Envoy ist immer nur auf einer Expedition zugleich.',
    ],
  },
  {
    id: 'reihe',
    title: 'In Reihe',
    when: (game) => game.state.world.journal.length > 0,
    text: [
      'Solange der Envoy unterwegs ist, kannst du ihm mehr aufgeben: Der Knopf heißt dann „Anhängen“. Er geht von Ort zu Ort und erst am Ende zurück ins Lager.',
      'Beim Sammeln rechnet die Reihe mit den besten Würfeln. Brauchen sie mehr, als die Energie hergibt, fällt das Letzte aus der Reihe.',
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
      'Ausrüstung hebt nie einen Wert. Sie hilft in der Welt: mehr Schaden, bessere Treffer, schnellere Energie, mehr Glück. Dafür verlangt sie Mindestwerte.',
      'Gefundene Kleidung hat eine Güte: schlicht, gut, selten oder prächtig. Je feiner, desto mehr Boni; je stärker der Envoy, desto größer sind sie.',
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
      'Gleich beim Lager, auf dem Trümmerfeld, sammelt der Envoy Stein und Pilzholz, ohne Weg. Du wählst, wie viel er sammelt, höchstens so viel, wie in den Vorrat passt.',
      'Für jede Energie bringt er zwei bis vier Stück; wie viele genau, entscheidet der Zufall. Kraft hilft bei Stein, Beweglichkeit bei Pilzholz.',
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
    title: 'Das Lager einrichten',
    when: (game) => game.state.world.camp.stage >= 1,
    text: [
      'Mit dem Lagerfeuer hat das Lager Stufe 1. Jetzt lassen sich vier Einrichtungen errichten: Steinstapel, Pilzholzstapel, Krempelplatz und Raspelnest. Jede gibt Hygge. Mit genug Hygge lässt sich das Lager aufwerten.',
      'Der Krempelplatz gibt Plätze für Gegenstände und Kleidung; unterwegs sieht der Envoy dort nur nach. Das Raspelnest gibt morgens um 6 Uhr einmal Energie dazu, auch über das Ende der Leiste hinaus. Auch in der Nacht gebaut zählt es schon am nächsten Morgen.',
    ],
  },
  {
    id: 'deko',
    title: 'Deko und Pläne',
    when: (game) => game.state.world.camp.stage >= 2,
    text: [
      'Mit jeder Lagerstufe lassen sich die Einrichtungen weiter ausbauen. Dazu gibt es Deko: Sie gibt mehr Hygge als die meisten Einrichtungen und bleibt beim Aufwerten stehen.',
      'Gebaut wird sie nach einem Plan. Einen je Stufe gibt es gleich, die anderen muss der Envoy finden: an bestimmten Orten, bei Geistern oder beim Händler. Manche sind selten.',
    ],
  },
  {
    id: 'aushang',
    title: 'Der Aushang',
    when: (game) => jobsOpen(game.state.world),
    text: [
      'Am Lager hängen jeden Tag drei Aufträge. Auf jedem steht, wohin er führt und was er bringt.',
      'Ein Auftrag kostet keine Energie, nur Zeit. Ist der Envoy schon unterwegs, hängt er ihn an. Am nächsten Tag hängen neue aus.',
    ],
  },
  {
    id: 'tiefen',
    title: 'Die Tiefen',
    when: (game) => depthsOpen(game.state.world),
    text: [
      'Unter dem Trümmerfeld führt ein alter Brunnen hinab. Auf jeder Ebene wartet ein Wächter. Der Weg hinein liegt oben auf der Abenteuer-Seite.',
      'Hinabsteigen kostet keine Energie. Danach ruht der Envoy eine Stunde, mit mehr Gelassenheit etwas kürzer.',
      'Wie weit er kommt, hängt an seinen Werten und an seiner Kleidung. Ist ein Wächter noch zu stark, zieht er sich zurück und versucht es nach der Rast noch einmal.',
    ],
  },
  {
    id: 'haendler',
    title: 'Der Händler',
    when: (game) => game.unlocked('haendler'),
    text: [
      'Der Händler bietet jeden Tag andere Ausrüstung an, passend zur Stärke des Envoy. Er zahlt in Bannsplittern und kauft auch, was der Envoy nicht mehr braucht.',
      'Dazu hat er jeden Tag zwei Pilztee und zwei Quellsud. Ein Trank füllt die Energie auf, höchstens bis ans Ende der Leiste.',
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
