// Sounds for the exercise timer. Everything is made in the browser from
// simple tones and noise: there are no sound files.
//
// - chime(): the soft tone when the time is up.
// - ping(): one soft tone when the timer goes on to the next part.
// - startAmbience(): a calm background while the timer runs, so that it is
//   audible with closed eyes that the time is still running. Three layers:
//   waves (filtered noise that swells and ebbs, following the breath when
//   the exercise has a breathing rhythm), a low quiet chord, and now and
//   then a singing bowl.

let ctx = null;
let playing = 0; // how many backgrounds are running
let noise = null; // made once, then reused

function context() {
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  return ctx;
}

// On iPad and iPhone: 'playback' plays like music, also when the device is
// set to silent; 'auto' leaves it to the device's own setting.
function setSession(type) {
  try { if (navigator.audioSession) navigator.audioSession.type = type; } catch { /* ignore */ }
}

// Browsers allow sound only after a tap, so this is called from one.
export function unlockSound({ withAmbience = false } = {}) {
  setSession(withAmbience ? 'playback' : 'auto');
  try {
    const c = context();
    if (c && c.state !== 'running') c.resume();
  } catch { /* no sound available */ }
}

export function chime() {
  const c = context();
  if (!c) return;
  try {
    const now = c.currentTime;
    for (const [freq, delay] of [[523.25, 0], [659.25, 0.18], [783.99, 0.36]]) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.18, now + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.6);
      osc.connect(gain).connect(c.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 1.7);
    }
  } catch { /* no sound available */ }
}

export function ping() {
  const c = context();
  if (!c) return;
  try {
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = 659.25;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 1.2);
  } catch { /* no sound available */ }
}

// ---------------------------------------------------------------------------
// Ambience

const VOLUME = 1;
const FADE_IN = 3;
const WAVE_LOW = { gain: 0.05, cutoff: 350 };
const WAVE_HIGH = { gain: 0.26, cutoff: 1300 };
// The chord and the bowls stay in C, like the chime at the end.
const CHORD = [130.81, 196.0, 261.63]; // C3, G3, C4
const BOWLS = [196.0, 220.0, 261.63, 293.66, 329.63]; // G3 A3 C4 D4 E4

const between = (a, b) => a + Math.random() * (b - a);

// Returns controls for the running sound, or null without sound.
// breathing: the timer tells the waves when a breath phase begins.
export function startAmbience({ breathing = false } = {}) {
  const c = context();
  if (!c) return null;
  try {
    return ambience(c, breathing);
  } catch {
    return null;
  }
}

function ambience(c, breathing) {
  playing += 1;
  const master = c.createGain();
  master.gain.value = 0;
  master.connect(c.destination);
  fadeTo(VOLUME, FADE_IN);

  const waves = makeWaves(c, master);
  const chord = makeChord(c, master);
  const sources = [waves.source, ...chord];
  const timers = new Set();
  let stopped = false;

  // Calls fn after a while, unless the sound has stopped by then.
  function later(seconds, fn) {
    const id = setTimeout(() => { timers.delete(id); if (!stopped) fn(); }, seconds * 1000);
    timers.add(id);
  }

  // Without a breathing rhythm the waves come and go on their own.
  function nextWave() {
    const length = between(8, 12);
    waves.swell(length * 0.4);
    later(length * 0.4, () => waves.ebb(length * 0.6));
    later(length, nextWave);
  }

  function nextBowl() {
    bowl(c, master, BOWLS[Math.floor(Math.random() * BOWLS.length)]);
    later(between(24, 40), nextBowl);
  }

  if (!breathing) nextWave();
  later(between(6, 10), nextBowl);

  // Glides from wherever the volume is now; near the goal after the seconds.
  function fadeTo(value, seconds) {
    master.gain.setTargetAtTime(value, c.currentTime, seconds / 3);
  }

  return {
    // name: 'Ein', 'Aus' or 'Halten'; seconds: how long the phase lasts.
    breath(name, seconds) {
      if (name === 'Ein') waves.swell(seconds);
      else if (name === 'Aus') waves.ebb(seconds);
    },
    pause() { fadeTo(0, 0.8); },
    resume() { fadeTo(VOLUME, 1.5); },
    stop() {
      if (stopped) return;
      stopped = true;
      for (const id of timers) clearTimeout(id);
      fadeTo(0, 1.2);
      setTimeout(() => {
        for (const s of sources) { try { s.stop(); } catch { /* already stopped */ } }
        master.disconnect();
        playing -= 1;
        if (playing === 0) setSession('auto');
      }, 2500);
    },
  };
}

// Waves: soft noise through a filter. Louder and brighter means the wave
// comes in; quieter and darker means it goes out.
function makeWaves(c, out) {
  const source = c.createBufferSource();
  noise = noise || brownNoise(c, 12);
  source.buffer = noise;
  source.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.4;
  filter.frequency.value = WAVE_LOW.cutoff;
  const gain = c.createGain();
  gain.gain.value = WAVE_LOW.gain;
  source.connect(filter).connect(gain).connect(out);
  source.start();

  // setTargetAtTime starts from wherever the sound is at that moment, so a
  // new phase never jumps. Near the goal after the given seconds.
  function glide(to, seconds) {
    const now = c.currentTime;
    gain.gain.setTargetAtTime(to.gain, now, seconds / 3);
    filter.frequency.setTargetAtTime(to.cutoff, now, seconds / 3);
  }
  return {
    source,
    swell: (seconds) => glide(WAVE_HIGH, seconds),
    ebb: (seconds) => glide(WAVE_LOW, seconds),
  };
}

// Brown noise, the deep rushing of water or wind. Two channels that differ,
// so it sounds wide. The ends are matched so the loop has no seam.
function brownNoise(c, seconds) {
  const length = Math.floor(c.sampleRate * seconds);
  const buffer = c.createBuffer(2, length, c.sampleRate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = buffer.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last;
    }
    const step = (data[length - 1] - data[0]) / (length - 1);
    let peak = 0;
    for (let i = 0; i < length; i += 1) {
      data[i] -= step * i;
      peak = Math.max(peak, Math.abs(data[i]));
    }
    for (let i = 0; i < length; i += 1) data[i] /= peak;
  }
  return buffer;
}

// A low, quiet open chord. Each tone is two slightly detuned sines, which
// makes it float gently.
function makeChord(c, out) {
  const gain = c.createGain();
  gain.gain.value = 0.014;
  gain.connect(out);

  // A very slow swell of the whole chord.
  const lfo = c.createOscillator();
  const depth = c.createGain();
  lfo.frequency.value = 0.06;
  depth.gain.value = 0.004;
  lfo.connect(depth).connect(gain.gain);
  lfo.start();

  const oscillators = [lfo];
  for (const freq of CHORD) {
    for (const cents of [-1.5, 1.5]) {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = cents;
      osc.connect(gain);
      osc.start();
      oscillators.push(osc);
    }
  }
  return oscillators;
}

// A singing bowl: a soft onset and a long fade. The overtones of a bowl
// are not in whole numbers, which gives it its sound.
function bowl(c, out, freq) {
  const now = c.currentTime;
  for (const [ratio, level, decay] of [[1, 0.05, 8], [2.71, 0.016, 5], [5.1, 0.005, 3]]) {
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(level, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    gain.connect(out);
    // Two tones a hair apart: the slow wobble of a bowl.
    for (const offset of [0, 0.8]) {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * ratio + offset;
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + decay + 0.1);
    }
  }
}
