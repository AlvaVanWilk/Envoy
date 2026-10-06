<?php
// Envoy – accounts and sync between devices
//
// Every person has an account (name and password) with an own list of
// events. A device logs in once and gets a token. With it, the device sends
// the events the server does not know yet and gets back every event it has
// not seen. Nothing is ever overwritten, so there are no conflicts.
//
// Requests (POST, JSON) with a field "action":
//   register { user, password }             -> { ok, user, token }
//   login    { user, password }             -> { ok, user, token }
//   logout   { user, token }                -> { ok }
//   sync     { user, token, since, events } -> { ok, seq, events }
//   arena, arena_join, arena_leave, arena_fight: the arena, see arena.php
// Without "action", the older form with a device key still works:
//   { key, since, events }                  -> { ok, seq, events }
// The app uses it only once, to take a game from before the accounts along.
// GET returns a sign of life, so the app can check the connection.

declare(strict_types=1);

// Folder for all data. Created with the first request and locked against
// access from outside by an .htaccess file. It can also lie outside the
// web folder; then enter its path here.
const DATA_DIR = __DIR__ . '/sync-daten';
const ACCOUNT_DIR = DATA_DIR . '/konten';

// How many accounts this server accepts. Protects the web space from being
// filled by strangers. Raise it when more people join.
const MAX_ACCOUNTS = 30;
// How many old device keys (from before the accounts) are accepted.
const MAX_PROFILES = 3;

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 200;
const MAX_TOKENS = 10;            // devices logged in at the same time per account
const MAX_FAILS = 5;              // wrong passwords in a row, then a pause
const LOCK_MINUTES = 15;

const MAX_BODY_BYTES = 2000000;
const MAX_EVENT_BYTES = 16000;
// The same list as KNOWN_TYPES in js/events.js (a test compares them).
const EVENT_TYPES = [
    'plan', 'done', 'teil', 'undo', 'mode',
    'expedition', 'unqueue', 'buy', 'sell', 'drop', 'move', 'equip', 'unequip', 'place', 'unplace', 'build',
    'envoy', 'travel', 'quest', 'test',
    'kampf', 'abbild', 'ruhmkauf', 'gesehen', 'tiefe',
];

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function reply(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(int $status, string $error): void
{
    reply($status, ['ok' => false, 'error' => $error]);
}

function ensureDirs(): void
{
    foreach ([DATA_DIR, ACCOUNT_DIR] as $dir) {
        if (!is_dir($dir) && !mkdir($dir, 0700, true)) {
            fail(500, 'storage');
        }
    }
    $htaccess = DATA_DIR . '/.htaccess';
    if (!file_exists($htaccess)) {
        file_put_contents($htaccess, "Require all denied\nDeny from all\n");
    }
}

// --- files ------------------------------------------------------------------

// Runs $work while holding an exclusive lock that belongs to $file.
function withLock(string $file, callable $work)
{
    $lock = fopen($file . '.lock', 'c');
    if ($lock === false || !flock($lock, LOCK_EX)) {
        fail(500, 'lock');
    }
    try {
        return $work();
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

function readJson(string $file): ?array
{
    if (!file_exists($file)) return null;
    $data = json_decode((string)file_get_contents($file), true);
    if (!is_array($data)) fail(500, 'storage_damaged');
    return $data;
}

// Writes into a new file first, then swaps it in. The previous version
// stays as .bak.
function writeJson(string $file, array $data): void
{
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $tmp = $file . '.tmp';
    if ($json === false || file_put_contents($tmp, $json) === false) {
        fail(500, 'storage');
    }
    if (file_exists($file)) copy($file, $file . '.bak');
    rename($tmp, $file);
}

// --- events -----------------------------------------------------------------

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

// Adds the unknown events to the list in $file and returns everything the
// device has not seen yet (after its number $since).
function exchangeEvents(string $file, int $since, array $incoming): array
{
    return withLock($file, function () use ($file, $since, $incoming) {
        $data = readJson($file) ?? ['seq' => 0, 'events' => []];
        if (!isset($data['seq'], $data['events'])) fail(500, 'storage_damaged');

        $known = [];
        foreach ($data['events'] as $entry) $known[$entry['e']['id']] = true;
        $changed = false;
        foreach ($incoming as $event) {
            if (!isValidEvent($event) || isset($known[$event['id']])) continue;
            $data['seq'] += 1;
            $data['events'][] = ['s' => $data['seq'], 'e' => $event];
            $known[$event['id']] = true;
            $changed = true;
        }
        if ($changed) writeJson($file, $data);

        // The server knows less than the device (e.g. the file was lost):
        // send everything; the device then sends all it has again.
        if ($since > $data['seq']) $since = 0;
        $out = [];
        foreach ($data['events'] as $entry) {
            if ($entry['s'] > $since) $out[] = $entry['e'];
        }
        return ['ok' => true, 'seq' => $data['seq'], 'events' => $out];
    });
}

// --- accounts ---------------------------------------------------------------

// The name as typed (spaces tidied), or null if it is not allowed:
// 3 to 30 letters, digits, spaces, dots, dashes, underscores.
function cleanName($name): ?string
{
    $name = trim(preg_replace('/\s+/u', ' ', (string)$name));
    if (!preg_match('/^[\p{L}\p{N}][\p{L}\p{N} ._-]{1,28}[\p{L}\p{N}]$/u', $name)) return null;
    return $name;
}

// Upper and lower case do not matter for the login.
function accountId(string $name): string
{
    return hash('sha256', 'konto|' . mb_strtolower($name, 'UTF-8'));
}

function accountFile(string $id): string
{
    return ACCOUNT_DIR . '/' . $id . '.konto.json';
}

function eventsFile(string $id): string
{
    return ACCOUNT_DIR . '/' . $id . '.events.json';
}

function newToken(array &$account): string
{
    $token = bin2hex(random_bytes(32));
    $account['tokens'][hash('sha256', $token)] = time();
    // only the most recently used devices stay logged in
    arsort($account['tokens']);
    $account['tokens'] = array_slice($account['tokens'], 0, MAX_TOKENS, true);
    return $token;
}

function hasToken(array $account, $token): bool
{
    return is_string($token) && isset($account['tokens'][hash('sha256', $token)]);
}

function checkPassword($password): string
{
    if (!is_string($password) || strlen($password) < MIN_PASSWORD || strlen($password) > MAX_PASSWORD) {
        fail(400, 'bad_password');
    }
    return $password;
}

function register(array $request): void
{
    $name = cleanName($request['user'] ?? '');
    if ($name === null) fail(400, 'bad_user');
    $password = checkPassword($request['password'] ?? null);
    $id = accountId($name);

    $result = withLock(ACCOUNT_DIR . '/konten', function () use ($id, $name, $password) {
        if (file_exists(accountFile($id))) fail(409, 'user_taken');
        if (count(glob(ACCOUNT_DIR . '/*.konto.json') ?: []) >= MAX_ACCOUNTS) fail(403, 'account_limit');
        $account = [
            'user' => $name,
            'hash' => password_hash($password, PASSWORD_DEFAULT),
            'created' => time(),
            'tokens' => [],
            'fails' => 0,
            'lockedUntil' => 0,
        ];
        $token = newToken($account);
        writeJson(accountFile($id), $account);
        return ['ok' => true, 'user' => $name, 'token' => $token];
    });
    reply(200, $result);
}

function login(array $request): void
{
    $name = cleanName($request['user'] ?? '');
    $password = $request['password'] ?? '';
    $file = $name === null ? null : accountFile(accountId($name));
    if ($file === null || !file_exists($file) || !is_string($password)) {
        // about the same effort as a real check, so a wrong name is not recognisable
        password_hash('x', PASSWORD_DEFAULT);
        usleep(700000);
        fail(401, 'login_failed');
    }

    $result = withLock($file, function () use ($file, $password) {
        $account = readJson($file);
        if (($account['lockedUntil'] ?? 0) > time()) fail(429, 'locked');
        if (!password_verify($password, $account['hash'])) {
            $account['fails'] = ($account['fails'] ?? 0) + 1;
            if ($account['fails'] >= MAX_FAILS) {
                $account['fails'] = 0;
                $account['lockedUntil'] = time() + LOCK_MINUTES * 60;
            }
            writeJson($file, $account);
            usleep(700000);
            fail(401, 'login_failed');
        }
        $account['fails'] = 0;
        $account['lockedUntil'] = 0;
        if (password_needs_rehash($account['hash'], PASSWORD_DEFAULT)) {
            $account['hash'] = password_hash($password, PASSWORD_DEFAULT);
        }
        $token = newToken($account);
        writeJson($file, $account);
        return ['ok' => true, 'user' => $account['user'], 'token' => $token];
    });
    reply(200, $result);
}

// The account of a request with name and token, or a reply 401.
function accountOf(array $request): string
{
    $name = cleanName($request['user'] ?? '');
    $id = $name === null ? null : accountId($name);
    $account = $id === null ? null : readJson(accountFile($id));
    if ($account === null || !hasToken($account, $request['token'] ?? null)) fail(401, 'auth');
    return $id;
}

function logout(array $request): void
{
    $id = accountOf($request);
    withLock(accountFile($id), function () use ($id, $request) {
        $account = readJson(accountFile($id));
        unset($account['tokens'][hash('sha256', (string)$request['token'])]);
        writeJson(accountFile($id), $account);
    });
    reply(200, ['ok' => true]);
}

function syncAccount(array $request): void
{
    $id = accountOf($request);
    $since = max(0, (int)($request['since'] ?? 0));
    $incoming = is_array($request['events'] ?? null) ? $request['events'] : [];
    $result = exchangeEvents(eventsFile($id), $since, $incoming);
    // With an Abbild in the arena: keep it up to date, bring its fights along.
    $arena = arenaOnSync($id, $request);
    if ($arena !== null) $result['arena'] = $arena;
    reply(200, $result);
}

// The older form: one list per device key.
function syncKey(array $request): void
{
    $key = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string)($request['key'] ?? '')));
    if (!preg_match('/^[A-Z0-9]{20,64}$/', $key)) fail(400, 'bad_key');
    $file = DATA_DIR . '/' . hash('sha256', 'envoy|' . $key) . '.json';
    if (!file_exists($file) && count(glob(DATA_DIR . '/*.json') ?: []) >= MAX_PROFILES) {
        fail(403, 'profile_limit');
    }
    $since = max(0, (int)($request['since'] ?? 0));
    $incoming = is_array($request['events'] ?? null) ? $request['events'] : [];
    reply(200, exchangeEvents($file, $since, $incoming));
}

// --- request ----------------------------------------------------------------

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
    reply(200, ['ok' => true, 'app' => 'envoy', 'accounts' => true]);
}
if ($method !== 'POST') {
    fail(405, 'method');
}

$raw = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
if ($raw === false || strlen($raw) > MAX_BODY_BYTES) {
    fail(413, 'too_large');
}
$request = json_decode($raw, true);
if (!is_array($request)) {
    fail(400, 'bad_request');
}

ensureDirs();
define('ENVOY_SYNC', true);
require __DIR__ . '/arena.php';
switch ($request['action'] ?? '') {
    case 'register': register($request); break;
    case 'login': login($request); break;
    case 'logout': logout($request); break;
    case 'sync': syncAccount($request); break;
    case 'arena':
    case 'arena_join':
    case 'arena_leave':
    case 'arena_fight': arenaRequest($request, $request['action']); break;
    case '': syncKey($request); break;
    default: fail(400, 'bad_request');
}
