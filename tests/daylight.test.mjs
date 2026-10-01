import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sunTimes, dayPhase } from '../js/daylight.js';

const minutes = (ms) => new Date(ms).getUTCHours() * 60 + new Date(ms).getUTCMinutes();

// Reference: Kassel (51.3° N, 9.5° E), almanac values, in UTC.
test('sunrise and sunset in the middle of Germany, to within a quarter of an hour', () => {
  const june = sunTimes(new Date(2026, 5, 21, 12), 51.3, 9.5);
  assert.ok(Math.abs(minutes(june.rise) - (3 * 60 + 20)) <= 15, `rise ${new Date(june.rise).toISOString()}`);
  assert.ok(Math.abs(minutes(june.set) - (19 * 60 + 42)) <= 15, `set ${new Date(june.set).toISOString()}`);
  const december = sunTimes(new Date(2026, 11, 21, 12), 51.3, 9.5);
  assert.ok(Math.abs(minutes(december.rise) - (7 * 60 + 20)) <= 15, `rise ${new Date(december.rise).toISOString()}`);
  assert.ok(Math.abs(minutes(december.set) - (15 * 60 + 15)) <= 15, `set ${new Date(december.set).toISOString()}`);
});

test('the four times of day follow the sun, around the clock', () => {
  const { rise, set } = sunTimes(new Date(2026, 9, 1, 12));
  const at = (ms) => dayPhase(new Date(ms));
  const min = 60000;
  assert.equal(at(rise - 60 * min), 'nacht');
  assert.equal(at(rise), 'morgen');
  assert.equal(at(rise + 60 * min), 'morgen');
  assert.equal(at(rise + 3 * 60 * min), 'tag');
  assert.equal(at((rise + set) / 2), 'tag');
  assert.equal(at(set - 60 * min), 'abend');
  assert.equal(at(set + 20 * min), 'abend');
  assert.equal(at(set + 90 * min), 'nacht');
});

test('in winter the day phases come earlier in the clock than in summer', () => {
  const winter = sunTimes(new Date(2026, 11, 21, 12));
  const summer = sunTimes(new Date(2026, 5, 21, 12));
  assert.ok(winter.set % 86400000 < summer.set % 86400000);
  assert.equal(dayPhase(new Date(winter.set + 5 * 60000)), 'abend');
});
