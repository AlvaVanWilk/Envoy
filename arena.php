<?php
// Envoy – the arena. A part of sync.php, not called on its own.
//
// Nobody fights a person, only the Abbild of their Envoy: name, look, the
// clothes worn (only to be seen), a Haltung and a Titel. The app sends it
// along with every sync. The server decides every fight itself, so all
// devices see the same.
//
// What makes an Abbild strong is diligence, not talent: for each of the four
// areas, on how many of the last 28 days its task was done. The server counts
// that in the account's own list of events. Every task counts the same, at
// any stage, for children as for adults: who finds the exercises easy rises
// to higher stages and more XP, but not to more strength in the arena.
//
// The list runs all the time (a challenge list as in a sports club):
// - Who sets up an Abbild starts at the end.
// - One may challenge the Abbilder up to three places above or below, each
//   of them once a day.
// - Who wins against someone above takes that place; the ones between move
//   down one. A draw or a defeat changes nothing in the list.
// - An Abbild whose app has not been opened for 14 days rests: it leaves the
//   list and starts at the end again once its app is back.
//
// Ruhm, the currency of the arena: the challenger gets 3 for a win, 2 for a
// draw, 1 for a defeat; the challenged Abbild 2 if it holds, else 1. Ruhm is
// never taken away. The app writes each fight into the account's own list of
// events (type `kampf`), so the Ruhm follows from them like everything else.
//
// Requests (see sync.php):
//   arena       { user, token, abbild?, arenaId?, since? }  -> hall
//   arena_join  { user, token, abbild }                     -> hall
//   arena_leave { user, token }                             -> hall
//   arena_fight { user, token, abbild, gegner, haltung }    -> hall + { kampf }
//   sync        may also carry { abbild, arenaId, arenaSince } -> also { arena: { id, seq, fights } }
// hall = { ok, id, seq, me, list, fights }: see hall() below. The fights are
// those after number `since` of the list `arenaId` (all, if the list is new).

declare(strict_types=1);

if (!defined('ENVOY_SYNC')) {
    http_response_code(404);
    exit;
}

const ARENA_FILE = DATA_DIR . '/arena.json';
const ARENA_REACH = 3;
const ARENA_REST_DAYS = 14;
const ARENA_KEEP_DAYS = 90;
const ARENA_ROUNDS = 8;
const ARENA_MARGIN = 0.2;         // a lead smaller than a fifth of the life is a draw
const ARENA_WINDOW_DAYS = 28;     // the strength: tasks done in this many days, up to today
const ARENA_NAME_MAX = 24;
const ARENA_STATS = ['kraft', 'ausdauer', 'beweglichkeit', 'gelassenheit'];
const ARENA_HALTUNGEN = ['angriff', 'abwehr', 'ruhe'];
// Each Haltung has the edge over one other: Abwehr catches Angriff, Ruhe
// dissolves Abwehr, Angriff takes Ruhe by surprise.
const ARENA_EDGE = ['abwehr' => 'angriff', 'ruhe' => 'abwehr', 'angriff' => 'ruhe'];
const RUHM_CHALLENGER = ['sieg' => 3, 'remis' => 2, 'niederlage' => 1];
const RUHM_CHALLENGED = ['sieg' => 2, 'remis' => 1, 'niederlage' => 1];
const ARENA_OTHER_VIEW = ['sieg' => 'niederlage', 'remis' => 'remis', 'niederlage' => 'sieg'];

// --- the fight ----------------------------------------------------------------
// A sparring bout of eight rounds. Both sides are measured against each other,
// area by area (the strength from diligence, see effortOf): twice as many
// days of Kraft hit about a fifth harder, of Ausdauer last about a fifth
// longer, of Beweglichkeit hit and dodge more often, of Gelassenheit let an
// Abbild that is behind bow out in honour (a draw). Who still stands after the last round
// wins on points only with a clear lead (more than a fifth of the life);
// otherwise it is a draw. Equally strong: about half the bouts end in a
// draw, a quarter each in a win; a fifth stronger: about 45 % win, 45 %
// draw, 10 % defeat; twice as strong: about 90 % win.

function clampTo(float $v, float $lo, float $hi): float
{
    return min($hi, max($lo, $v));
}

function chance(): float
{
    return random_int(0, 999999) / 1000000;
}

function fightSide(array $self, array $other, bool $edge): array
{
    $x = fn(string $stat) => log($self['strength'][$stat] / $other['strength'][$stat]);
    return [
        'life' => (int)round(40 * exp(0.25 * $x('ausdauer'))),
        'damage' => 5 * exp(0.25 * $x('kraft')),
        'hit' => clampTo(0.7 + 0.12 * $x('beweglichkeit') + ($edge ? 0.1 : 0), 0.35, 0.95),
        'dodge' => clampTo(0.1 + 0.06 * $x('beweglichkeit') + ($edge ? 0.05 : 0), 0, 0.4),
        'calm' => clampTo(0.02 + 0.06 * $x('gelassenheit'), 0, 0.3),
    ];
}

// a challenges b. Returns the result from a's view, how it was decided
// ('ko', 'punkte' or 'ruhe') and the rounds: [{ n, zuerst, a, b, la, lb, ruhe? }]
// with a/b = what the blow of that side did (damage, 'daneben', 'ausgewichen',
// or null when it did not come to it), la/lb = life after the round,
// ruhe = the side that bowed out.
function fightOut(array $a, array $b, string $ha, string $hb): array
{
    $sa = fightSide($a, $b, ARENA_EDGE[$ha] === $hb);
    $sb = fightSide($b, $a, ARENA_EDGE[$hb] === $ha);
    $life = ['a' => $sa['life'], 'b' => $sb['life']];
    $side = ['a' => $sa, 'b' => $sb];
    $rounds = [];
    $result = null;
    $how = 'punkte';
    for ($n = 1; $n <= ARENA_ROUNDS; $n++) {
        $first = $n % 2 === 1 ? 'a' : 'b';
        $round = ['n' => $n, 'zuerst' => $first, 'a' => null, 'b' => null];
        $shareA = $life['a'] / $sa['life'];
        $shareB = $life['b'] / $sb['life'];
        $behind = $shareA < $shareB ? 'a' : ($shareB < $shareA ? 'b' : null);
        if ($n > 1 && $behind !== null && chance() < $side[$behind]['calm']) {
            $round['ruhe'] = $behind;
            $round['la'] = $life['a'];
            $round['lb'] = $life['b'];
            $rounds[] = $round;
            $result = 'remis';
            $how = 'ruhe';
            break;
        }
        foreach ([$first, $first === 'a' ? 'b' : 'a'] as $who) {
            $target = $who === 'a' ? 'b' : 'a';
            if (chance() >= $side[$who]['hit']) {
                $round[$who] = 'daneben';
            } elseif (chance() < $side[$target]['dodge']) {
                $round[$who] = 'ausgewichen';
            } else {
                $damage = max(1, (int)round($side[$who]['damage'] * (0.2 + 1.6 * chance())));
                $round[$who] = $damage;
                $life[$target] = max(0, $life[$target] - $damage);
                if ($life[$target] === 0) break;
            }
        }
        $round['la'] = $life['a'];
        $round['lb'] = $life['b'];
        $rounds[] = $round;
        if ($life['b'] === 0) { $result = 'sieg'; $how = 'ko'; break; }
        if ($life['a'] === 0) { $result = 'niederlage'; $how = 'ko'; break; }
    }
    if ($result === null) {
        $lead = $life['a'] / $sa['life'] - $life['b'] / $sb['life'];
        $result = abs($lead) <= ARENA_MARGIN ? 'remis' : ($lead > 0 ? 'sieg' : 'niederlage');
    }
    return ['ergebnis' => $result, 'entscheid' => $how, 'leben' => ['a' => $sa['life'], 'b' => $sb['life']], 'runden' => $rounds];
}

// --- the Abbild -----------------------------------------------------------------

// The strength of an account in each area: 1 + the days of the last 28 on
// which its task was done (taken back ones do not count). Every task counts
// the same, whatever its stage; one a day per area.
function effortOf(string $accountId, ?float $now = null): array
{
    $data = readJson(eventsFile($accountId)) ?? ['events' => []];
    $today = new DateTime('@' . (int)floor(($now ?? nowMs()) / 1000 - 3 * 3600));
    $today->setTimezone(new DateTimeZone('Europe/Berlin'));
    $from = (clone $today)->modify('-' . (ARENA_WINDOW_DAYS - 1) . ' days')->format('Y-m-d');
    $until = $today->format('Y-m-d');
    $undone = [];
    foreach ($data['events'] as $entry) {
        $e = $entry['e'];
        if (($e['type'] ?? '') === 'undo' && is_string($e['ref'] ?? null)) $undone[$e['ref']] = true;
    }
    $days = array_fill_keys(ARENA_STATS, []);
    foreach ($data['events'] as $entry) {
        $e = $entry['e'];
        if (($e['type'] ?? '') !== 'done' || isset($undone[$e['id']])) continue;
        $stat = $e['stat'] ?? '';
        $day = $e['d'] ?? '';
        if (!is_string($stat) || !isset($days[$stat]) || !is_string($day) || $day < $from || $day > $until) continue;
        $days[$stat][$day] = true;
    }
    return array_map(fn($d) => 1 + count($d), $days);
}

// The clothing of the game (data/ausruestung.json), by id.
function equipmentById(): array
{
    static $items = null;
    if ($items !== null) return $items;
    $items = [];
    $file = __DIR__ . '/data/ausruestung.json';
    $data = file_exists($file) ? json_decode((string)file_get_contents($file), true) : null;
    foreach (($data['equipment'] ?? []) as $item) $items[$item['id']] = $item;
    return $items;
}

function word($value, int $max): string
{
    return is_string($value) && preg_match('/^[a-z0-9-]{0,' . $max . '}$/', $value) ? $value : '';
}

// What the app sent, made safe: a name, the look, the clothes (only real
// ones, fitting the figure; in the arena they are only to be seen), Haltung
// and Titel. Stats the app may send are not taken: the strength is counted
// on the server (effortOf).
function cleanAbbild($raw): ?array
{
    if (!is_array($raw)) return null;
    $name = is_string($raw['name'] ?? null) ? $raw['name'] : '';
    $name = trim(preg_replace('/\s+/u', ' ', preg_replace('/\p{C}+/u', '', $name) ?? '') ?? '');
    $name = mb_substr($name, 0, ARENA_NAME_MAX, 'UTF-8');
    if ($name === '') return null;

    $figur = word($raw['figur'] ?? '', 20);
    $items = equipmentById();
    $worn = [];
    foreach (is_array($raw['worn'] ?? null) ? array_slice($raw['worn'], 0, 10) : [] as $w) {
        $item = is_array($w) && is_string($w['id'] ?? null) ? ($items[$w['id']] ?? null) : null;
        if ($item === null || isset($worn[$item['slot']])) continue;
        if (!empty($item['passt']) && !in_array($figur, $item['passt'], true)) continue;
        $worn[$item['slot']] = ['id' => $item['id'], 'farbe' => word($w['farbe'] ?? '', 12)];
    }

    $haltung = $raw['haltung'] ?? '';
    return [
        'name' => $name,
        'figur' => $figur,
        'haut' => word($raw['haut'] ?? '', 20),
        'haar' => word($raw['haar'] ?? '', 20),
        'unterhemd' => ($raw['unterhemd'] ?? true) !== false,
        'worn' => array_values($worn),
        'haltung' => in_array($haltung, ARENA_HALTUNGEN, true) ? $haltung : 'abwehr',
        'titel' => word($raw['titel'] ?? '', 30),
    ];
}

// --- the list -------------------------------------------------------------------

function arenaLoad(): array
{
    return readJson(ARENA_FILE) ?? ['id' => bin2hex(random_bytes(4)), 'seq' => 0, 'fighters' => [], 'ladder' => [], 'fights' => []];
}

// The day of the app (it begins at 03:00), in Germany.
function arenaDay(float $ms): string
{
    $date = new DateTime('@' . (int)floor($ms / 1000 - 3 * 3600));
    $date->setTimezone(new DateTimeZone('Europe/Berlin'));
    return $date->format('Y-m-d');
}

function nowMs(): float
{
    return floor(microtime(true) * 1000);
}

function fighterOf(array $arena, string $accountId): ?string
{
    foreach ($arena['fighters'] as $pid => $f) {
        if ($f['account'] === $accountId) return (string)$pid;
    }
    return null;
}

// Abbilder whose app has not been here for a while rest; old fights go.
function tidy(array &$arena): void
{
    $now = nowMs();
    $arena['ladder'] = array_values(array_filter($arena['ladder'], function ($pid) use ($arena, $now) {
        $f = $arena['fighters'][$pid] ?? null;
        return $f !== null && $f['active'] && $f['seen'] >= $now - ARENA_REST_DAYS * 86400000;
    }));
    $arena['fights'] = array_values(array_filter($arena['fights'], fn($f) => $f['t'] >= $now - ARENA_KEEP_DAYS * 86400000));
}

// The Abbild as the app sends it now; an active one that rested is back at the end.
function refresh(array &$arena, string $pid, ?array $abbild): void
{
    if ($abbild !== null) $arena['fighters'][$pid]['abbild'] = $abbild;
    $arena['fighters'][$pid]['seen'] = nowMs();
    if ($arena['fighters'][$pid]['active'] && !in_array($pid, $arena['ladder'], true)) $arena['ladder'][] = $pid;
}

function lookOf(array $abbild): array
{
    return ['name' => $abbild['name'], 'figur' => $abbild['figur'], 'haut' => $abbild['haut'], 'haar' => $abbild['haar'], 'unterhemd' => $abbild['unterhemd']];
}

function placeOf(array $arena, string $pid): ?int
{
    $i = array_search($pid, $arena['ladder'], true);
    return $i === false ? null : $i + 1;
}

function challengedToday(array $arena, string $from, string $to): bool
{
    $today = arenaDay(nowMs());
    foreach ($arena['fights'] as $f) {
        if ($f['a'] === $from && $f['b'] === $to && arenaDay($f['t']) === $today) return true;
    }
    return false;
}

// The number after which the fights are new to the app: the one it sends,
// unless it knows another list (this one is new, e.g. after a loss of data).
function sinceFor(array $arena, array $request, string $key): int
{
    if (($request['arenaId'] ?? null) !== $arena['id']) return 0;
    return max(0, (int)($request[$key] ?? 0));
}

// One fight as an Abbild sees it.
function fightView(array $f, string $pid): array
{
    $mine = $f['a'] === $pid;
    return [
        's' => $f['s'],
        't' => $f['t'],
        'rolle' => $mine ? 'fordert' : 'verteidigt',
        'gegner' => $mine ? $f['lb'] : $f['la'],
        'ergebnis' => $mine ? $f['e'] : ARENA_OTHER_VIEW[$f['e']],
        'ruhm' => $mine ? $f['ra'] : $f['rb'],
        'platz' => $mine ? $f['pa'] : $f['pb'],
    ];
}

// The fights of one Abbild after number $since.
function fightsOf(array $arena, string $pid, int $since): array
{
    $out = [];
    foreach ($arena['fights'] as $f) {
        if ($f['s'] > $since && ($f['a'] === $pid || $f['b'] === $pid)) $out[] = fightView($f, $pid);
    }
    return $out;
}

// What the hall shows: the list in order (name, look, clothes, Titel; never
// strength or Haltung of others), the own Abbild, and its fights after $since.
function hall(array $arena, ?string $me, int $since): array
{
    $myPlace = $me === null ? null : placeOf($arena, $me);
    $list = [];
    foreach ($arena['ladder'] as $i => $pid) {
        $a = $arena['fighters'][$pid]['abbild'];
        $place = $i + 1;
        $reach = $myPlace !== null && $pid !== $me && abs($place - $myPlace) <= ARENA_REACH;
        $list[] = lookOf($a) + [
            'id' => $pid,
            'platz' => $place,
            'titel' => $a['titel'],
            'worn' => $a['worn'],
            'ich' => $pid === $me,
            'erreichbar' => $reach,
            'heute' => $reach && challengedToday($arena, $me, $pid),
        ];
    }
    $mine = $me === null ? null : $arena['fighters'][$me];
    return [
        'ok' => true,
        'id' => $arena['id'],
        'seq' => $arena['seq'],
        'me' => $mine === null ? null : [
            'id' => $me,
            'aktiv' => $mine['active'],
            'platz' => $myPlace,
            'haltung' => $mine['abbild']['haltung'],
            'titel' => $mine['abbild']['titel'],
        ],
        'list' => $list,
        'fights' => $me === null ? [] : fightsOf($arena, $me, $since),
    ];
}

// --- requests -------------------------------------------------------------------

function arenaRequest(array $request, string $action): void
{
    $id = accountOf($request);
    $result = withLock(ARENA_FILE, function () use ($id, $request, $action) {
        $arena = arenaLoad();
        tidy($arena);
        $me = fighterOf($arena, $id);
        $abbild = array_key_exists('abbild', $request) ? cleanAbbild($request['abbild']) : null;
        $since = sinceFor($arena, $request, 'since');
        $extra = [];

        if ($action === 'arena_join') {
            if ($abbild === null) fail(400, 'bad_abbild');
            if ($me === null) {
                $me = 'p' . bin2hex(random_bytes(5));
                $arena['fighters'][$me] = ['account' => $id, 'abbild' => $abbild, 'active' => true, 'seen' => nowMs()];
            }
            $arena['fighters'][$me]['active'] = true;
        } elseif ($action === 'arena_leave') {
            if ($me !== null) $arena['fighters'][$me]['active'] = false;
            $arena['ladder'] = array_values(array_filter($arena['ladder'], fn($pid) => $pid !== $me));
        }
        if ($me !== null && $action !== 'arena_leave') refresh($arena, $me, $abbild);
        if ($action === 'arena_fight') $extra = ['kampf' => challenge($arena, $me, $request)];

        writeJson(ARENA_FILE, $arena);
        return hall($arena, $me, $since) + $extra;
    });
    reply(200, $result);
}

// The own Abbild challenges another one.
function challenge(array &$arena, ?string $me, array $request): array
{
    $other = is_string($request['gegner'] ?? null) ? $request['gegner'] : '';
    $haltung = $request['haltung'] ?? '';
    $from = $me === null ? null : placeOf($arena, $me);
    $to = isset($arena['fighters'][$other]) ? placeOf($arena, $other) : null;
    if ($from === null) fail(409, 'not_in_list');
    if ($to === null || $other === $me || abs($to - $from) > ARENA_REACH) fail(409, 'out_of_reach');
    if (!in_array($haltung, ARENA_HALTUNGEN, true)) fail(400, 'bad_haltung');
    if (challengedToday($arena, $me, $other)) fail(409, 'today');

    $a = $arena['fighters'][$me]['abbild'];
    $b = $arena['fighters'][$other]['abbild'];
    $strengthA = effortOf($arena['fighters'][$me]['account']);
    $strengthB = effortOf($arena['fighters'][$other]['account']);
    $fight = fightOut(['strength' => $strengthA], ['strength' => $strengthB], $haltung, $b['haltung']);
    $result = $fight['ergebnis'];

    // A win against someone above: that place is taken, the others move down one.
    if ($result === 'sieg' && $to < $from) {
        array_splice($arena['ladder'], $from - 1, 1);
        array_splice($arena['ladder'], $to - 1, 0, [$me]);
    }
    $arena['seq'] += 1;
    $record = [
        's' => $arena['seq'],
        't' => nowMs(),
        'a' => $me,
        'b' => $other,
        'la' => lookOf($a),
        'lb' => lookOf($b),
        'ha' => $haltung,
        'hb' => $b['haltung'],
        'e' => $result,
        'ra' => RUHM_CHALLENGER[$result],
        'rb' => RUHM_CHALLENGED[ARENA_OTHER_VIEW[$result]],
        'pa' => [$from, placeOf($arena, $me)],
        'pb' => [$to, placeOf($arena, $other)],
    ];
    $arena['fights'][] = $record;
    return fightView($record, $me) + [
        'haltung' => $haltung,
        'gegnerHaltung' => $b['haltung'],
        'gegnerTitel' => $b['titel'],
        'entscheid' => $fight['entscheid'],
        'leben' => $fight['leben'],
        'runden' => $fight['runden'],
    ];
}

// Along with a sync: the Abbild is kept up to date, and the fights since the
// last time come back (the app writes them into the account's list).
function arenaOnSync(string $id, array $request): ?array
{
    if (!file_exists(ARENA_FILE)) return null;
    return withLock(ARENA_FILE, function () use ($id, $request) {
        $arena = arenaLoad();
        $me = fighterOf($arena, $id);
        if ($me === null) return null;
        tidy($arena);
        refresh($arena, $me, array_key_exists('abbild', $request) ? cleanAbbild($request['abbild']) : null);
        writeJson(ARENA_FILE, $arena);
        $since = sinceFor($arena, $request, 'arenaSince');
        return ['id' => $arena['id'], 'seq' => $arena['seq'], 'fights' => fightsOf($arena, $me, $since)];
    });
}
