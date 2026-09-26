<?php
// Envoy – Geräteabgleich
//
// Speichert die Ereignisliste eines Profils als JSON-Datei auf dem Webspace.
// Jedes Gerät schickt die Ereignisse, die der Server noch nicht kennt, und
// bekommt alle zurück, die es selbst noch nicht hat. Es wird nie etwas
// überschrieben, darum gibt es keine Konflikte.
//
// Anfrage (POST, JSON):  { "key": "...", "since": 12, "events": [ ... ] }
// Antwort:                { "ok": true, "seq": 20, "events": [ ... ] }
// GET liefert nur ein Lebenszeichen, damit die App die Verbindung prüfen kann.

declare(strict_types=1);

// Ordner für die Daten. Er wird beim ersten Abgleich angelegt und per
// .htaccess gegen Aufruf von außen gesperrt. Wer mag, legt ihn außerhalb
// des Web-Ordners an und trägt den Pfad hier ein.
const DATA_DIR = __DIR__ . '/sync-daten';

// Wie viele verschiedene Schlüssel (Profile) dieser Server annimmt.
// Schützt den Webspace davor, von Fremden vollgeschrieben zu werden.
const MAX_PROFILES = 3;

const MAX_BODY_BYTES = 2000000;
const MAX_EVENT_BYTES = 4000;
const EVENT_TYPES = ['plan', 'done', 'undo', 'equip', 'unequip'];

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function reply(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ensureDataDir(): void
{
    if (!is_dir(DATA_DIR) && !mkdir(DATA_DIR, 0700, true)) {
        reply(500, ['ok' => false, 'error' => 'storage']);
    }
    $htaccess = DATA_DIR . '/.htaccess';
    if (!file_exists($htaccess)) {
        file_put_contents($htaccess, "Require all denied\nDeny from all\n");
    }
}

function isValidEvent($e): bool
{
    if (!is_array($e)) return false;
    if (!isset($e['id'], $e['t'], $e['d'], $e['type'])) return false;
    if (!is_string($e['id']) || strlen($e['id']) === 0 || strlen($e['id']) > 80) return false;
    if (!is_int($e['t']) && !is_float($e['t'])) return false;
    if (!is_string($e['d']) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $e['d'])) return false;
    if (!in_array($e['type'], EVENT_TYPES, true)) return false;
    return strlen(json_encode($e)) <= MAX_EVENT_BYTES;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
    reply(200, ['ok' => true, 'app' => 'envoy']);
}
if ($method !== 'POST') {
    reply(405, ['ok' => false, 'error' => 'method']);
}

$raw = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
if ($raw === false || strlen($raw) > MAX_BODY_BYTES) {
    reply(413, ['ok' => false, 'error' => 'too_large']);
}
$request = json_decode($raw, true);
if (!is_array($request)) {
    reply(400, ['ok' => false, 'error' => 'bad_request']);
}

$key = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string)($request['key'] ?? '')));
if (!preg_match('/^[A-Z0-9]{20,64}$/', $key)) {
    reply(400, ['ok' => false, 'error' => 'bad_key']);
}
$since = max(0, (int)($request['since'] ?? 0));
$incoming = is_array($request['events'] ?? null) ? $request['events'] : [];

ensureDataDir();
$name = hash('sha256', 'envoy|' . $key);
$file = DATA_DIR . '/' . $name . '.json';
$lockFile = DATA_DIR . '/' . $name . '.lock';

if (!file_exists($file)) {
    $profiles = glob(DATA_DIR . '/*.json') ?: [];
    if (count($profiles) >= MAX_PROFILES) {
        reply(403, ['ok' => false, 'error' => 'profile_limit']);
    }
}

$lock = fopen($lockFile, 'c');
if ($lock === false || !flock($lock, LOCK_EX)) {
    reply(500, ['ok' => false, 'error' => 'lock']);
}

$data = ['seq' => 0, 'events' => []];
if (file_exists($file)) {
    $stored = json_decode((string)file_get_contents($file), true);
    if (!is_array($stored) || !isset($stored['seq'], $stored['events'])) {
        flock($lock, LOCK_UN);
        reply(500, ['ok' => false, 'error' => 'storage_damaged']);
    }
    $data = $stored;
}

$known = [];
foreach ($data['events'] as $entry) {
    $known[$entry['e']['id']] = true;
}

$changed = false;
foreach ($incoming as $event) {
    if (!isValidEvent($event) || isset($known[$event['id']])) continue;
    $data['seq'] += 1;
    $data['events'][] = ['s' => $data['seq'], 'e' => $event];
    $known[$event['id']] = true;
    $changed = true;
}

if ($changed) {
    // Erst in eine neue Datei schreiben, dann austauschen. Die vorige
    // Fassung bleibt als .bak liegen.
    $tmp = $file . '.tmp';
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false || file_put_contents($tmp, $json) === false) {
        flock($lock, LOCK_UN);
        reply(500, ['ok' => false, 'error' => 'storage']);
    }
    if (file_exists($file)) {
        copy($file, $file . '.bak');
    }
    rename($tmp, $file);
}

// Server-Daten jünger als der Stand des Geräts (z. B. Datei gelöscht):
// alles schicken, das Gerät liefert dann seinerseits alles nach.
if ($since > $data['seq']) {
    $since = 0;
}

$out = [];
foreach ($data['events'] as $entry) {
    if ($entry['s'] > $since) $out[] = $entry['e'];
}

flock($lock, LOCK_UN);
fclose($lock);

reply(200, ['ok' => true, 'seq' => $data['seq'], 'events' => $out]);
