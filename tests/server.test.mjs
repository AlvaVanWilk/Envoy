// sync.php: accounts, login, sync between devices. Starts PHP's own small
// web server in a temporary folder; skipped where PHP is not installed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const hasPhp = spawnSync('php', ['-v']).status === 0;

async function startServer(t) {
  const dir = mkdtempSync(join(tmpdir(), 'envoy-server-'));
  copyFileSync(fileURLToPath(new URL('../sync.php', import.meta.url)), join(dir, 'sync.php'));
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
