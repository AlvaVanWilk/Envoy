// The guided timer of a task. It runs through the parts one after another
// (getting ready, each exercise, one side and the other, the change to the
// next exercise), shows the Envoy doing the exercise where there is a
// picture, and a ring with the time of the part. At every new part a soft
// tone sounds and the voice says what comes (see voice.js); the sentences of
// an exercise (column `ansagen`) are said at their second. With a breathing
// rhythm (e.g. 4-6) a circle grows and shrinks to set the pace. Keeps the
// screen awake where the browser allows it and plays a soft tone at the end.
// While it runs, a calm background sound plays; with a breathing rhythm its
// waves follow the breath. Sound and voice can be switched off.
//
// segments: [{ name, label, seconds, say, prompts: [{ at, text }], figure }]
//   name    big, the exercise; label: small above it ("Andere Seite")
//   say     said when the part begins; prompts: said at their second in it
//   figure  an element to show (the Envoy doing it), or null

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';
import { store } from '../store.js';
import { unlockSound, chime, ping, startAmbience } from './sound.js';
import { canSpeak, voiceWanted, saveVoiceWanted, say, hush, unlockVoice } from './voice.js';

const PHASE_NAMES = { 2: ['Ein', 'Aus'], 3: ['Ein', 'Halten', 'Aus'], 4: ['Ein', 'Halten', 'Aus', 'Halten'] };
const LATE = 2; // seconds: a sentence that is due longer ago is left out (after a pause in the background)

// The background sound is on unless it was switched off once.
const soundWanted = () => store.loadUi().timerSound !== false;
function saveSoundWanted(on) {
  store.saveUi({ ...store.loadUi(), timerSound: on });
}

const pad = (n) => String(n).padStart(2, '0');
const clock = (sec) => `${Math.floor(sec / 60)}:${pad(Math.floor(sec % 60))}`;

export function openTimer({ title, segments, rhythm = null, onFinish }) {
  let soundOn = soundWanted();
  let voiceOn = voiceWanted() && canSpeak();
  unlockSound({ withAmbience: soundOn });
  if (voiceOn) unlockVoice();

  // when each part begins, and everything to be said, in seconds from the start
  const starts = [];
  let total = 0;
  for (const seg of segments) { starts.push(total); total += seg.seconds; }
  const cues = segments.flatMap((seg, i) => [
    ...(seg.say ? [{ at: starts[i], text: seg.say }] : []),
    ...(seg.prompts || []).map((p) => ({ at: starts[i] + p.at, text: p.text })),
  ]).sort((a, b) => a.at - b.at);
  let nextCue = 0;
  const cycle = rhythm ? rhythm.reduce((a, b) => a + b, 0) : 0;

  let startedAt = performance.now();
  let pausedTotal = 0;
  let pausedAt = null;
  let finished = false;
  let frame = null;
  let wakeLock = null;
  let current = -1;
  let ambience = soundOn ? startAmbience({ breathing: Boolean(rhythm) }) : null;
  let breathKey = null; // which breath phase the sound last heard about

  const R = 108;
  const CIRC = 2 * Math.PI * R;
  const ring = h('span', { class: 'timer-ring', html:
    `<svg viewBox="0 0 240 240"><circle class="ring-track" cx="120" cy="120" r="${R}"/>`
    + `<circle class="ring-fill" cx="120" cy="120" r="${R}" stroke-dasharray="${CIRC}" stroke-dashoffset="0"/></svg>` });
  const breath = h('span', { class: 'breath-orb' });
  const phaseLabel = h('span', { class: 'breath-phase' });
  const time = h('span', { class: 'timer-time' }, clock(segments[0]?.seconds || 0));
  const figureFrame = h('div', { class: 'timer-figure', hidden: true });
  const partLabel = h('p', { class: 'eyebrow timer-part' });
  const partName = h('h2', { class: 'timer-title' }, title);
  const rest = h('p', { class: 'timer-rest' });
  const pauseBtn = h('button', { class: 'btn ghost', onclick: togglePause }, icon(UI_ICONS.pause), 'Pause');
  const soundBtn = h('button', { class: 'btn ghost', onclick: toggleSound });
  const voiceBtn = canSpeak() ? h('button', { class: 'btn ghost', onclick: toggleVoice }) : null;
  showSwitches();
  const doneBtn = h('button', { class: 'btn primary', hidden: true, onclick: () => { close(); onFinish(); } }, 'Erledigt');
  const closeBtn = h('button', { class: 'btn text', onclick: close }, 'Schließen');

  const overlay = h('div', { class: 'timer-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'timer-inner' },
      figureFrame,
      partLabel,
      partName,
      h('div', { class: `timer-stage ${rhythm ? 'with-breath' : ''}` }, ring, rhythm ? breath : null,
        h('span', { class: 'timer-center' }, phaseLabel, time)),
      segments.length > 1 ? rest : null,
      h('div', { class: 'timer-actions' }, pauseBtn, soundBtn, voiceBtn, doneBtn, closeBtn)));
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

  // the part running at second e
  function segmentAt(e) {
    let i = 0;
    while (i < segments.length - 1 && e >= starts[i + 1]) i += 1;
    return i;
  }

  function enter(i) {
    if (current >= 0) ping();
    current = i;
    const seg = segments[i];
    partLabel.textContent = seg.label || '';
    partName.textContent = seg.name || title;
    figureFrame.replaceChildren(...(seg.figure ? [seg.figure] : []));
    figureFrame.hidden = !seg.figure;
  }

  function speakDue(e) {
    while (nextCue < cues.length && cues[nextCue].at <= e) {
      const cue = cues[nextCue];
      nextCue += 1;
      if (voiceOn && e - cue.at < LATE) say(cue.text);
    }
  }

  function tick() {
    const e = Math.min(elapsed(), total);
    const i = segmentAt(e);
    if (i !== current) enter(i);
    speakDue(e);
    const seg = segments[i];
    const inSeg = e - starts[i];
    time.textContent = clock(Math.ceil(seg.seconds - inSeg));
    rest.textContent = `Insgesamt noch ${clock(Math.ceil(total - e))}`;
    ring.querySelector('.ring-fill').setAttribute('stroke-dashoffset', String(CIRC * (inSeg / seg.seconds)));
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
      hush();
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
    showSwitches();
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

  function toggleVoice() {
    voiceOn = !voiceOn;
    saveVoiceWanted(voiceOn);
    showSwitches();
    if (voiceOn) unlockVoice(); else hush();
  }

  function showSwitches() {
    soundBtn.replaceChildren(icon(soundOn ? UI_ICONS.soundOn : UI_ICONS.soundOff), 'Klang');
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.classList.toggle('is-off', !soundOn);
    if (!voiceBtn) return;
    voiceBtn.replaceChildren(icon(voiceOn ? UI_ICONS.voiceOn : UI_ICONS.voiceOff), 'Stimme');
    voiceBtn.setAttribute('aria-pressed', String(voiceOn));
    voiceBtn.classList.toggle('is-off', !voiceOn);
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
    rest.textContent = '';
    pauseBtn.hidden = true;
    soundBtn.hidden = true;
    if (voiceBtn) voiceBtn.hidden = true;
    doneBtn.hidden = false;
    doneBtn.focus();
    releaseWakeLock();
  }

  function close() {
    cancelAnimationFrame(frame);
    finished = true;
    stopSound();
    hush();
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
