// Timer for exercises with a duration. With a breathing rhythm (e.g. 4-6)
// a circle grows and shrinks to set the pace. Keeps the screen awake where
// the browser allows it and plays a soft tone at the end.

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';

const PHASE_NAMES = { 2: ['Ein', 'Aus'], 3: ['Ein', 'Halten', 'Aus'], 4: ['Ein', 'Halten', 'Aus', 'Halten'] };

let audio = null;

function chime() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const now = audio.currentTime;
    for (const [freq, delay] of [[523.25, 0], [659.25, 0.18], [783.99, 0.36]]) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.18, now + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.6);
      osc.connect(gain).connect(audio.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 1.7);
    }
  } catch { /* no sound available */ }
}

function unlockAudio() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch { /* ignore */ }
}

const pad = (n) => String(n).padStart(2, '0');
const clock = (sec) => `${Math.floor(sec / 60)}:${pad(Math.floor(sec % 60))}`;

export function openTimer(exercise, { onFinish }) {
  unlockAudio();
  const total = exercise.timer_min * 60;
  const rhythm = exercise.atemtakt;
  const cycle = rhythm ? rhythm.reduce((a, b) => a + b, 0) : 0;

  let startedAt = performance.now();
  let pausedTotal = 0;
  let pausedAt = null;
  let finished = false;
  let frame = null;
  let wakeLock = null;

  const R = 108;
  const CIRC = 2 * Math.PI * R;
  const ring = h('span', { class: 'timer-ring', html:
    `<svg viewBox="0 0 240 240"><circle class="ring-track" cx="120" cy="120" r="${R}"/>`
    + `<circle class="ring-fill" cx="120" cy="120" r="${R}" stroke-dasharray="${CIRC}" stroke-dashoffset="0"/></svg>` });
  const breath = h('span', { class: 'breath-orb' });
  const phaseLabel = h('span', { class: 'breath-phase' }, rhythm ? 'Ein' : '');
  const time = h('span', { class: 'timer-time' }, clock(total));
  const pauseBtn = h('button', { class: 'btn ghost', onclick: togglePause }, icon(UI_ICONS.pause), 'Pause');
  const doneBtn = h('button', { class: 'btn primary', hidden: true, onclick: () => { close(); onFinish(); } }, 'Erledigt');
  const closeBtn = h('button', { class: 'btn text', onclick: close }, 'Schließen');

  const overlay = h('div', { class: 'timer-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': exercise.name },
    h('div', { class: 'timer-inner' },
      h('p', { class: 'eyebrow' }, 'Timer'),
      h('h2', { class: 'timer-title' }, exercise.name),
      h('div', { class: `timer-stage ${rhythm ? 'with-breath' : ''}` }, ring, rhythm ? breath : null,
        h('span', { class: 'timer-center' }, phaseLabel, time)),
      h('div', { class: 'timer-actions' }, pauseBtn, doneBtn, closeBtn)));

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
    } else {
      pausedTotal += performance.now() - pausedAt;
      pausedAt = null;
      pauseBtn.replaceChildren(icon(UI_ICONS.pause), 'Pause');
      overlay.classList.remove('paused');
    }
  }

  function finish() {
    finished = true;
    chime();
    overlay.classList.add('finished');
    phaseLabel.textContent = '';
    time.textContent = 'Zeit um';
    pauseBtn.hidden = true;
    doneBtn.hidden = false;
    doneBtn.focus();
    releaseWakeLock();
  }

  function close() {
    cancelAnimationFrame(frame);
    finished = true;
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
    if (document.visibilityState === 'visible' && !finished) requestWakeLock();
  }

  frame = requestAnimationFrame(tick);
  pauseBtn.focus();
}
