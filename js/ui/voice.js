// The voice of the timer. It says what comes next (the next exercise, the
// other side, faster or slower) and, where the table has them, the sentences
// of an exercise (column `ansagen`), so nothing needs to be read with the
// eyes closed. It is the German voice of the device and works without
// internet. It can be switched off; the choice is kept.

import { store } from '../store.js';

const synth = () => window.speechSynthesis || null;
export const canSpeak = () => Boolean(synth()) && typeof window.SpeechSynthesisUtterance === 'function';

// On unless it was switched off once.
export const voiceWanted = () => store.loadUi().voice !== false;
export function saveVoiceWanted(on) {
  store.saveUi({ ...store.loadUi(), voice: on });
}

let german = null;
function germanVoice() {
  if (!german) {
    const voices = synth().getVoices();
    german = voices.find((v) => v.lang === 'de-DE' && v.localService)
      || voices.find((v) => v.lang?.toLowerCase().startsWith('de')) || null;
  }
  return german;
}

function utterance(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  const voice = germanVoice();
  if (voice) u.voice = voice;
  u.rate = 0.92;
  return u;
}

export function say(text) {
  if (!canSpeak() || !text) return;
  synth().speak(utterance(text));
}

// Stops what is being said.
export function hush() {
  if (canSpeak()) synth().cancel();
}

// A device may speak only after a tap: call this from one.
export function unlockVoice() {
  if (!canSpeak()) return;
  const u = utterance(' ');
  u.volume = 0;
  synth().speak(u);
}
