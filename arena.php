<?php
// Envoy – the arena. A part of sync.php, not called on its own.
//
// Nobody fights a person, only the Abbild of their Envoy: name, look, the
// clothes worn (with the bonuses of each piece) and a Titel. The app sends it
// along with every sync. The server decides every fight itself, so all
// devices see the same.
//
// Diligence decides, not talent (so gewünscht, since 5.17 always): the Fleiß
// of an Abbild is on how many of the last 28 days the task of each of the four
// areas was done, all four together. The server counts that in the account's
// own list of events. Every task counts the same, at any stage, for children
// as for adults: who finds the exercises easy rises to higher stages and more
// XP, but not to more strength in the arena. The more diligent Abbild wins.
// Equally diligent: the one whose clothes have more for the fight (ARENA_GEAR).
// Equal in that as well: a draw, both strike the last blow at once.
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
//   arena_fight { user, token, abbild, gegner }             -> hall + { kampf }
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
const ARENA_ROUNDS = 24;          // at most, in the bout as it is shown
const ARENA_TRIES = 400;          // bouts tried until one ends as decided
// What the clothes count for in the arena, when both are equally diligent:
// their bonuses (and abilities) for the fight, a point of damage as much as
// three of hitting, dodging or calming (the same as GEAR_WEIGHTS in js/config.js).
const ARENA_GEAR = ['schaden' => 3, 'treffer' => 1, 'ausweichen' => 1, 'beruhigen' => 1];
const ARENA_WINDOW_DAYS = 28;     // the strength: tasks done in this many days, up to today
const ARENA_NAME_MAX = 24;
const ARENA_STATS = ['kraft', 'ausdauer', 'beweglichkeit', 'gelassenheit'];
const ARENA_BONUS_MAX = 100;
const RUHM_CHALLENGER = ['sieg' => 3, 'remis' => 2, 'niederlage' => 1];
const RUHM_CHALLENGED = ['sieg' => 2, 'remis' => 1, 'niederlage' => 1];
const ARENA_OTHER_VIEW = ['sieg' => 'niederlage', 'remis' => 'remis', 'niederlage' => 'sieg'];

// --- the fight ----------------------------------------------------------------
// First the result: the more diligent Abbild wins; equally diligent, the one
// whose clothes count for more (gearOf); equal in that too, a draw. Then the
// bout to show it, round by round: both sides are measured against each
// other, area by area, as before (twice as many days of Kraft hit about a
// fifth harder, of Ausdauer last about a fifth longer, of Beweglichkeit hit
// and dodge more often). Bouts are rolled until one ends as decided: the
// winner strikes the last blow; in a draw both are worn down and strike the
// last blow at the same time. (Before 5.17 the bout itself decided, with the
// Haltung and a bow of the one behind, which ended it as a draw.)

function clampTo(float $v, float $lo, float $hi): float
{
    return min($hi, max($lo, $v));
}

function chance(): float
{
    return random_int(0, 999999) / 1000000;
}

function fightSide(array $self, array $other): array
{
    $x = fn(string $stat) => log($self['strength'][$stat] / $other['strength'][$stat]);
    $damage = 5 * exp(0.25 * $x('kraft'));
    return [
        'life' => (int)round(30 * exp(0.25 * $x('ausdauer'))),
        'damage' => $damage,
        'most' => max(1, (int)round($damage * 1.8)),
        'hit' => clampTo(0.7 + 0.12 * $x('beweglichkeit'), 0.35, 0.95),
        'dodge' => clampTo(0.1 + 0.06 * $x('beweglichkeit'), 0, 0.4),
    ];
}

// What the clothes of an Abbild count for in the fight: the bonuses of each
// piece worn and the abilities from the table.
function gearOf(array $abbild): int
{
    $items = equipmentById();
    $sum = 0;
    foreach ($abbild['worn'] ?? [] as $w) {
        $effects = $items[$w['id']]['effekt'] ?? [];
        foreach (ARENA_GEAR as $key => $weight) {
            $sum += $weight * ((int)($effects[$key] ?? 0) + (int)($w['bonus'][$key] ?? 0));
        }
    }
    return $sum;
}

// One bout as it could go, or null if it did not end as decided.
// Rounds: [{ n, zuerst, a, b, la, lb, gleichzeitig? }] with a/b = what the blow of
// that side did (damage, 'daneben', 'ausgewichen', or null when it did not come to it),
// la/lb = life after the round.
function boutFor(array $sa, array $sb, string $result): ?array
{
    $life = ['a' => $sa['life'], 'b' => $sb['life']];
    $side = ['a' => $sa, 'b' => $sb];
    $rounds = [];
    for ($n = 1; $n <= ARENA_ROUNDS; $n++) {
        $first = $n % 2 === 1 ? 'a' : 'b';
        $round = ['n' => $n, 'zuerst' => $first, 'a' => null, 'b' => null];
        if ($result === 'remis' && $n > 2 && $life['a'] <= $sb['most'] && $life['b'] <= $sa['most']) {
            // both worn down: the last blow of both at the same time
            $round['a'] = $life['b'];
            $round['b'] = $life['a'];
            $round['gleichzeitig'] = true;
            $round['la'] = 0;
            $round['lb'] = 0;
            $rounds[] = $round;
            return $rounds;
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
        if ($life['a'] === 0 || $life['b'] === 0) {
            return ($life['b'] === 0 ? 'sieg' : 'niederlage') === $result ? $rounds : null;
        }
    }
    return null;
}

// If no bout rolled ends as decided (hardly ever): the winner strikes, the other misses.
function plainBout(array $sa, array $sb, string $result): array
{
    $life = ['a' => $sa['life'], 'b' => $sb['life']];
    $rounds = [];
    for ($n = 1; $life['a'] > 0 && $life['b'] > 0; $n++) {
        $round = ['n' => $n, 'zuerst' => 'a', 'a' => 'daneben', 'b' => 'daneben'];
        if ($result === 'remis' || $result === 'sieg') {
            $round['a'] = min($life['b'], max(1, (int)round($sa['damage'])));
            $life['b'] -= $round['a'];
        }
        if ($result === 'remis' || $result === 'niederlage') {
            $round['b'] = min($life['a'], max(1, (int)round($sb['damage'])));
            $life['a'] -= $round['b'];
        }
        if ($result === 'remis' && ($life['a'] === 0 || $life['b'] === 0)) {
            $round['gleichzeitig'] = true;
            $life = ['a' => 0, 'b' => 0];
        }
        $round['la'] = $life['a'];
        $round['lb'] = $life['b'];
        $rounds[] = $round;
    }
    return $rounds;
}

// a challenges b: { strength (per area), gear } each. Returns the result from
// a's view, how it was decided ('fleiss', 'kleidung' or 'gleich'), the life of
// both and the rounds of the bout.
function fightOut(array $a, array $b): array
{
    $days = array_sum($a['strength']) - array_sum($b['strength']);
    $gear = $a['gear'] - $b['gear'];
    if ($days != 0) {
        $result = $days > 0 ? 'sieg' : 'niederlage';
        $how = 'fleiss';
    } elseif ($gear != 0) {
        $result = $gear > 0 ? 'sieg' : 'niederlage';
        $how = 'kleidung';
    } else {
        $result = 'remis';
        $how = 'gleich';
    }
    $sa = fightSide($a, $b);
    $sb = fightSide($b, $a);
    $rounds = null;
    for ($try = 0; $try < ARENA_TRIES && $rounds === null; $try++) $rounds = boutFor($sa, $sb, $result);
    return [
        'ergebnis' => $result,
        'entscheid' => $how,
        'leben' => ['a' => $sa['life'], 'b' => $sb['life']],
        'runden' => $rounds ?? plainBout($sa, $sb, $result),
    ];
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
// ones, fitting the figure, with the bonuses of each piece for the fight) and
// the Titel. Stats the app may send are not taken: the strength is counted
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
        $bonus = [];
        foreach (ARENA_GEAR as $key => $weight) {
            $value = $w['bonus'][$key] ?? 0;
            if (is_int($value) && $value > 0) $bonus[$key] = min($value, ARENA_BONUS_MAX);
        }
        $worn[$item['slot']] = ['id' => $item['id'], 'farbe' => word($w['farbe'] ?? '', 12)] + ($bonus ? ['bonus' => $bonus] : []);
    }

    return [
        'name' => $name,
        'figur' => $figur,
        'haut' => word($raw['haut'] ?? '', 20),
        'haar' => word($raw['haar'] ?? '', 20),
        'unterhemd' => ($raw['unterhemd'] ?? true) !== false,
        'worn' => array_values($worn),
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
    $from = $me === null ? null : placeOf($arena, $me);
    $to = isset($arena['fighters'][$other]) ? placeOf($arena, $other) : null;
    if ($from === null) fail(409, 'not_in_list');
    if ($to === null || $other === $me || abs($to - $from) > ARENA_REACH) fail(409, 'out_of_reach');
    if (challengedToday($arena, $me, $other)) fail(409, 'today');

    $a = $arena['fighters'][$me]['abbild'];
    $b = $arena['fighters'][$other]['abbild'];
    $strengthA = effortOf($arena['fighters'][$me]['account']);
    $strengthB = effortOf($arena['fighters'][$other]['account']);
    $fight = fightOut(['strength' => $strengthA, 'gear' => gearOf($a)], ['strength' => $strengthB, 'gear' => gearOf($b)]);
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
        'e' => $result,
        'ra' => RUHM_CHALLENGER[$result],
        'rb' => RUHM_CHALLENGED[ARENA_OTHER_VIEW[$result]],
        'pa' => [$from, placeOf($arena, $me)],
        'pb' => [$to, placeOf($arena, $other)],
    ];
    $arena['fights'][] = $record;
    return fightView($record, $me) + [
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
