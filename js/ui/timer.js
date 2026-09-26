// Timer for exercises with a duration. With a breathing rhythm (e.g. 4-6)
// a circle grows and shrinks to set the pace. Keeps the screen awake where
// the browser allows it and plays a soft tone at the end. While it runs, a
// calm background sound plays (can be switched off, see sound.js); with a
// breathing rhythm its waves follow the breath.

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';
import { store } from '../store.js';
import { unlockSound, chime, startAmbience } from './sound.js';

const PHASE_NAMES = { 2: ['Ein', 'Aus'], 3: ['Ein', 'Halten', 'Aus'], 4: ['Ein', 'Halten', 'Aus', 'Halten'] };

// The background sound is on unless it was switched off once.
const soundWanted = () => store.loadUi().timerSound !== false;
function saveSoundWanted(on) {
  store.saveUi({ ...store.loadUi(), timerSound: on });
}

const pad = (n) => String(n).padStart(2, '0');
const clock = (sec) => `${Math.floor(sec / 60)}:${pad(Math.floor(sec % 60))}`;

export function openTimer(exercise, { onFinish }) {
  let soundOn = soundWanted();
  unlockSound({ withAmbience: soundOn });
  const total = exercise.timer_min * 60;
  const rhythm = exercise.atemtakt;
  const cycle = rhythm ? rhythm.reduce((a, b) => a + b, 0) : 0;

  let startedAt = performance.now();
  let pausedTotal = 0;
  let pausedAt = null;
  let finished = false;
  let frame = null;
  let wakeLock = null;
  let ambience = soundOn ? startAmbience({ breathing: Boolean(rhythm) }) : null;
  let breathKey = null; // which breath phase the sound last heard about

  const R = 108;
  const CIRC = 2 * Math.PI * R;
  const ring = h('span', { class: 'timer-ring', html:
    `<svg viewBox="0 0 240 240"><circle class="ring-track" cx="120" cy="120" r="${R}"/>`
    + `<circle class="ring-fill" cx="120" cy="120" r="${R}" stroke-dasharray="${CIRC}" stroke-dashoffset="0"/></svg>` });
  const breath = h('span', { class: 'breath-orb' });
  const phaseLabel = h('span', { class: 'breath-phase' }, rhythm ? 'Ein' : '');
  const time = h('span', { class: 'timer-time' }, clock(total));
  const pauseBtn = h('button', { class: 'btn ghost', onclick: togglePause }, icon(UI_ICONS.pause), 'Pause');
  const soundBtn = h('button', { class: 'btn ghost', onclick: toggleSound });
  showSound();
  const doneBtn = h('button', { class: 'btn primary', hidden: true, onclick: () => { close(); onFinish(); } }, 'Erledigt');
  const closeBtn = h('button', { class: 'btn text', onclick: close }, 'Schließen');

  const overlay = h('div', { class: 'timer-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': exercise.name },
    h('div', { class: 'timer-inner' },
      h('p', { class: 'eyebrow' }, 'Timer'),
      h('h2', { class: 'timer-title' }, exercise.name),
      h('div', { class: `timer-stage ${rhythm ? 'with-breath' : ''}` }, ring, rhythm ? breath : null,
        h('span', { class: 'timer-center' }, phaseLabel, time)),
      h('div', { class: 'timer-actions' }, pauseBtn, soundBtn, doneBtn, closeBtn)));
  // Browsers may silence the sound in the background; a tap brings it back.
  overlay.addEventListener('pointerdown', () => { if (soundOn) unlockSound({ withAmbience: true }); });

  document.body.append(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  requestWakeLock();
  document.addEventListener('visibilitychange', onVisible);

  function elapsed() {
    const now = pausedAt ?? performance.now();
    return (now - startedAt - pausedTotal) / 1000;
  }

  function tick() {
    const e = Math.min(elapsed(), total);
    time.textContent = clock(Math.ceil(total - e));
    ring.querySelector('.ring-fill').setAttribute('stroke-dashoffset', String(CIRC * (e / total)));
    if (rhythm) updateBreath(e);
    if (e >= total && !finished) finish();
    if (!finished) frame = requestAnimationFrame(tick);
  }

  function updateBreath(e) {
    let t = e % cycle;
    let phase = 0;
    while (t >= rhythm[phase]) { t -= rhythm[phase]; phase += 1; }
    const progress = t / rhythm[phase];
    const names = PHASE_NAMES[rhythm.length];
    const name = names[phase];
    const key = `${Math.floor(e / cycle)}.${phase}`;
    if (key !== breathKey) {
      breathKey = key;
      ambience?.breath(name, rhythm[phase] - t);
    }
    let scale;
    if (name === 'Ein') scale = 0.55 + 0.45 * ease(progress);
    else if (name === 'Aus') scale = 1 - 0.45 * ease(progress);
    else scale = phase === 1 ? 1 : 0.55;
    breath.style.transform = `translate(-50%, -50%) scale(${scale})`;
    phaseLabel.textContent = name;
  }

  function ease(x) { return 0.5 - Math.cos(Math.PI * x) / 2; }

  function togglePause() {
    if (finished) return;
    if (pausedAt === null) {
      pausedAt = performance.now();
      pauseBtn.replaceChildren(icon(UI_ICONS.play), 'Weiter');
      overlay.classList.add('paused');
      ambience?.pause();
    } else {
      pausedTotal += performance.now() - pausedAt;
      pausedAt = null;
      pauseBtn.replaceChildren(icon(UI_ICONS.pause), 'Pause');
      overlay.classList.remove('paused');
      ambience?.resume();
      breathKey = null;
    }
  }

  function toggleSound() {
    soundOn = !soundOn;
    saveSoundWanted(soundOn);
    showSound();
    if (finished) return;
    if (soundOn) {
      unlockSound({ withAmbience: true });
      ambience = startAmbience({ breathing: Boolean(rhythm) });
      if (pausedAt !== null) ambience?.pause();
      breathKey = null;
    } else {
      stopSound();
    }
  }

  function showSound() {
    soundBtn.replaceChildren(icon(soundOn ? UI_ICONS.soundOn : UI_ICONS.soundOff), 'Klang');
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.classList.toggle('is-off', !soundOn);
  }

  function stopSound() {
    ambience?.stop();
    ambience = null;
  }

  function finish() {
    finished = true;
    stopSound();
    chime();
    overlay.classList.add('finished');
    phaseLabel.textContent = '';
    time.textContent = 'Zeit um';
    pauseBtn.hidden = true;
    soundBtn.hidden = true;
    doneBtn.hidden = false;
    doneBtn.focus();
    releaseWakeLock();
  }

  function close() {
    cancelAnimationFrame(frame);
    finished = true;
    stopSound();
    releaseWakeLock();
    document.removeEventListener('visibilitychange', onVisible);
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 250);
  }

  async function requestWakeLock() {
    try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { wakeLock = null; }
  }
  function releaseWakeLock() {
    try { wakeLock?.release(); } catch { /* ignore */ }
    wakeLock = null;
  }
  function onVisible() {
    if (document.visibilityState !== 'visible' || finished) return;
    requestWakeLock();
    if (soundOn) unlockSound({ withAmbience: true });
  }

  frame = requestAnimationFrame(tick);
  pauseBtn.focus();
}
