// The time of day at the camp, from where the sun stands: the picture of the
// camp shows dawn, day, dusk or night. Sunrise and sunset are worked out for
// the place of the camp (see config.js) with the usual approximation of the
// sun's path; it is good to a few minutes, which is plenty for a picture.

import { CAMP_LATITUDE, CAMP_LONGITUDE } from './config.js';

const RAD = Math.PI / 180;
const MINUTE = 60000;

// Sunrise and sunset of the day `date` falls on, in ms.
export function sunTimes(date = new Date(), lat = CAMP_LATITUDE, lon = CAMP_LONGITUDE) {
  const year = date.getFullYear();
  const midnight = Date.UTC(year, date.getMonth(), date.getDate());
  const dayOfYear = Math.round((midnight - Date.UTC(year, 0, 1)) / 86400000) + 1;
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1);
  // equation of time (minutes) and the sun's declination (radians)
  const equation = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
    - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const declination = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
    - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
    - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const cosHour = Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(declination))
    - Math.tan(lat * RAD) * Math.tan(declination);
  const hour = Math.acos(Math.min(1, Math.max(-1, cosHour))) / RAD;   // half the day's length, in degrees
  return {
    rise: midnight + (720 - 4 * (lon + hour) - equation) * MINUTE,
    set: midnight + (720 - 4 * (lon - hour) - equation) * MINUTE,
  };
}

// 'morgen' around sunrise, 'tag', 'abend' around sunset, otherwise 'nacht'.
export function dayPhase(now = new Date()) {
  const t = now.getTime();
  const { rise, set } = sunTimes(now);
  if (t >= rise - 40 * MINUTE && t < rise + 80 * MINUTE) return 'morgen';
  if (t >= rise + 80 * MINUTE && t < set - 90 * MINUTE) return 'tag';
  if (t >= set - 90 * MINUTE && t < set + 40 * MINUTE) return 'abend';
  return 'nacht';
}
