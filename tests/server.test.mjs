// sync.php: accounts, login, sync between devices. Starts PHP's own small
// web server in a temporary folder; skipped where PHP is not installed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const hasPhp = spawnSync('php', ['-v']).status === 0;

async function startServer(t) {
  const dir = mkdtempSync(join(tmpdir(), 'envoy-server-'));
  for (const file of ['sync.php', 'arena.php', 'data/ausruestung.json']) {
    mkdirSync(join(dir, file, '..'), { recursive: true });
    copyFileSync(fileURLToPath(new URL(`../${file}`, import.meta.url)), join(dir, file));
  }
  const port = 8800 + Math.floor(Math.random() * 900);
  const server = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', dir], { stdio: 'ignore' });
  t.after(() => {
    server.kill();
    rmSync(dir, { recursive: true, force: true });
  });
  const url = `http://127.0.0.1:${port}/sync.php`;
  for (let i = 0; i < 50; i += 1) {
    try {
      if ((await fetch(url)).ok) break;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  return async (body) => {
    const response = await fetch(url, { method: 'POST', body: JSON.stringify(body) });
    return { status: response.status, ...(await response.json()) };
  };
}

const event = (id, type = 'envoy') => ({ id, t: 1, d: '2026-09-27', type, name: 'Mira' });

// Every kind of event the app writes must also be kept by the server, or it
// would be lost on the way to another device.
test('server: knows every type of event the app knows', async () => {
  const { KNOWN_TYPES } = await import('../js/events.js');
  const php = readFileSync(new URL('../sync.php', import.meta.url), 'utf8');
  const list = /const EVENT_TYPES = \[([^\]]*)\]/.exec(php)[1];
  const server = new Set([...list.matchAll(/'([a-z]+)'/g)].map((m) => m[1]));
  assert.deepEqual([...KNOWN_TYPES].sort(), [...server].sort());
});

test('server: accounts, login and sync between devices', { skip: !hasPhp && 'PHP ist nicht installiert' }, async (t) => {
  const call = await startServer(t);

  const created = await call({ action: 'register', user: 'Sandra', password: 'geheim123' });
  assert.equal(created.ok, true);
  assert.equal(created.user, 'Sandra');
  assert.match(created.token, /^[0-9a-f]{64}$/);

  assert.equal((await call({ action: 'register', user: 'sandra', password: 'geheim123' })).error, 'user_taken');
  assert.equal((await call({ action: 'register', user: 'x', password: 'geheim123' })).error, 'bad_user');
  assert.equal((await call({ action: 'register', user: 'Kim', password: 'kurz' })).error, 'bad_password');

  const wrong = await call({ action: 'login', user: 'Sandra', password: 'falsch999' });
  assert.equal(wrong.status, 401);
  assert.equal(wrong.error, 'login_failed');
  assert.equal((await call({ action: 'login', user: 'Niemand', password: 'geheim123' })).error, 'login_failed');

  // two devices of the same account see each other's events
  const second = await call({ action: 'login', user: 'SANDRA', password: 'geheim123' });
  assert.equal(second.ok, true);
  const up = await call({ action: 'sync', user: 'Sandra', token: created.token, since: 0, events: [event('a-1'), { id: 'bad' }] });
  assert.equal(up.seq, 1);
  const down = await call({ action: 'sync', user: 'sandra', token: second.token, since: 0, events: [] });
  assert.deepEqual(down.events.map((e) => e.id), ['a-1']);

  // other accounts and wrong tokens get nothing
  const other = await call({ action: 'register', user: 'Kim', password: 'geheim456' });
  const empty = await call({ action: 'sync', user: 'Kim', token: other.token, since: 0, events: [] });
  assert.deepEqual(empty.events, []);
  assert.equal((await call({ action: 'sync', user: 'Sandra', token: other.token, since: 0, events: [] })).error, 'auth');

  // after logging out, the token no longer works
  assert.equal((await call({ action: 'logout', user: 'Sandra', token: second.token })).ok, true);
  assert.equal((await call({ action: 'sync', user: 'Sandra', token: second.token, since: 0, events: [] })).status, 401);

  // the old device key still works, for taking a game along
  const old = await call({ key: 'ABCD-EFGH-JKLM-NPQR-STUV', since: 0, events: [event('k-1', 'done')] });
  assert.equal(old.seq, 1);
});

test('server: a pause after five wrong passwords', { skip: !hasPhp && 'PHP ist nicht installiert' }, async (t) => {
  const call = await startServer(t);
  await call({ action: 'register', user: 'Robin', password: 'geheim123' });
  for (let i = 0; i < 5; i += 1) {
    assert.equal((await call({ action: 'login', user: 'Robin', password: `falsch-${i}-x` })).error, 'login_failed');
  }
  const locked = await call({ action: 'login', user: 'Robin', password: 'geheim123' });
  assert.equal(locked.status, 429);
  assert.equal(locked.error, 'locked');
});

// --- the arena (arena.php) ---------------------------------------------------------

const abbild = (name, extra = {}) => ({
  name, figur: 'erste', haut: '', haar: '', unterhemd: true, worn: [],
  stats: { kraft: 1, ausdauer: 1, beweglichkeit: 1, gelassenheit: 1 }, haltung: 'abwehr', titel: '', ...extra,
});

test('server: arena list, challenges, Ruhm and fights for the challenged', { skip: !hasPhp && 'PHP ist nicht installiert' }, async (t) => {
  const call = await startServer(t);
  const login = {};
  for (const user of ['Anna', 'Bodo', 'Cleo']) login[user] = { user, token: (await call({ action: 'register', user, password: 'geheim123' })).token };

  const empty = await call({ action: 'arena', ...login.Anna });
  assert.equal(empty.me, null);
  assert.deepEqual(empty.list, []);

  // Who sets up an Abbild starts at the end.
  await call({ action: 'arena_join', ...login.Anna, abbild: abbild('Anna\u0007', { worn: [{ id: 'handschuhe_handwickel_1', farbe: 'moos' }, { id: 'gibt-es-nicht' }] }) });
  await call({ action: 'arena_join', ...login.Bodo, abbild: abbild('Bodo') });
  const hall = await call({ action: 'arena_join', ...login.Cleo, abbild: abbild('Cleo') });
  assert.deepEqual(hall.list.map((x) => [x.name, x.platz]), [['Anna', 1], ['Bodo', 2], ['Cleo', 3]]);
  assert.deepEqual(hall.list[0].worn, [{ id: 'handschuhe_handwickel_1', farbe: 'moos' }]);
  assert.equal(hall.list[0].stats, undefined);      // the others never see the stats
  assert.equal(hall.me.platz, 3);
  assert.ok(hall.list.every((x) => x.ich || x.erreichbar));

  // Cleo challenges Anna: the server decides, the rounds come along.
  const anna = hall.list[0].id;
  const fought = await call({ action: 'arena_fight', ...login.Cleo, abbild: abbild('Cleo'), gegner: anna, haltung: 'ruhe' });
  const k = fought.kampf;
  assert.equal(k.rolle, 'fordert');
  assert.ok(['sieg', 'remis', 'niederlage'].includes(k.ergebnis));
  assert.equal(k.ruhm, { sieg: 3, remis: 2, niederlage: 1 }[k.ergebnis]);
  assert.ok(k.runden.length >= 1 && k.runden.length <= 8);
  assert.ok(['ko', 'punkte', 'ruhe'].includes(k.entscheid));
  assert.equal(k.gegner.name, 'Anna');
  if (k.ergebnis === 'sieg') {
    assert.deepEqual(fought.list.map((x) => x.name), ['Cleo', 'Anna', 'Bodo']);
    assert.deepEqual(k.platz, [3, 1]);
  } else {
    assert.deepEqual(fought.list.map((x) => x.name), ['Anna', 'Bodo', 'Cleo']);
  }
  // once a day per Abbild, and only real ones
  assert.equal((await call({ action: 'arena_fight', ...login.Cleo, gegner: anna, haltung: 'ruhe' })).error, 'today');
  assert.equal((await call({ action: 'arena_fight', ...login.Cleo, gegner: 'p000', haltung: 'ruhe' })).error, 'out_of_reach');

  // Anna's app learns of it with the next sync, from her view, with Ruhm that is never taken away.
  const synced = await call({ action: 'sync', ...login.Anna, since: 0, events: [], abbild: abbild('Anna'), arenaId: null, arenaSince: 0 });
  assert.equal(synced.arena.fights.length, 1);
  const seen = synced.arena.fights[0];
  assert.equal(seen.rolle, 'verteidigt');
  assert.equal(seen.gegner.name, 'Cleo');
  assert.equal(seen.ergebnis, { sieg: 'niederlage', remis: 'remis', niederlage: 'sieg' }[k.ergebnis]);
  assert.ok(seen.ruhm >= 1);
  const again = await call({ action: 'sync', ...login.Anna, since: 0, events: [], arenaId: synced.arena.id, arenaSince: synced.arena.seq });
  assert.deepEqual(again.arena.fights, []);
  // without an Abbild in the arena, the sync stays as it was
  const dave = await call({ action: 'register', user: 'Dave', password: 'geheim123' });
  assert.equal((await call({ action: 'sync', user: 'Dave', token: dave.token, since: 0, events: [], abbild: abbild('Dave') })).arena, undefined);

  // Taking the Abbild back: out of the list; set up again, it starts at the end.
  const left = await call({ action: 'arena_leave', ...login.Bodo });
  assert.equal(left.me.platz, null);
  assert.equal(left.list.length, 2);
  const back = await call({ action: 'arena_join', ...login.Bodo, abbild: abbild('Bodo') });
  assert.equal(back.me.platz, 3);
});

// The strength in the arena is diligence, not talent: on how many of the last
// 28 days each task was done, whatever its stage and XP; stats sent are ignored.
test('server: arena strength counts the days with the task done, not the stage', { skip: !hasPhp && 'PHP ist nicht installiert' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'envoy-arena-'));
  try {
    const now = Date.parse('2026-10-05T12:00:00Z');
    const day = (n) => new Date(now - n * 86400000).toISOString().slice(0, 10);
    const done = (id, stat, d, xp) => ({ s: 1, e: { id, type: 'done', stat, d, xp } });
    const events = [
      done('a', 'kraft', day(0), 26), done('b', 'kraft', day(1), 14), done('b2', 'kraft', day(1), 14),   // twice on one day counts once
      done('c', 'kraft', day(40), 26),                                                                // too long ago
      done('d', 'ausdauer', day(2), 24), { s: 2, e: { id: 'u', type: 'undo', ref: 'd' } },            // taken back
      done('e', 'gelassenheit', day(3), 14),
    ];
    writeFileSync(join(dir, 'konto.events.json'), JSON.stringify({ seq: 3, events }));
    const php = `
      const DATA_DIR = ${JSON.stringify(dir)};
      define('ENVOY_SYNC', true);
      function readJson($f) { return file_exists($f) ? json_decode(file_get_contents($f), true) : null; }
      function eventsFile($id) { return DATA_DIR . '/' . $id . '.events.json'; }
      require ${JSON.stringify(fileURLToPath(new URL('../arena.php', import.meta.url)))};
      echo json_encode(['strength' => effortOf('konto', ${now}),
        'abbild' => cleanAbbild(['name' => 'Kim', 'figur' => 'erste', 'stats' => ['kraft' => 50]])]);
    `;
    const out = spawnSync('php', ['-r', php], { encoding: 'utf8' });
    const result = JSON.parse(out.stdout);
    assert.deepEqual(result.strength, { kraft: 3, ausdauer: 1, beweglichkeit: 1, gelassenheit: 2 });
    assert.equal(result.abbild.stats, undefined);
    assert.equal(result.abbild.haltung, 'abwehr');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
