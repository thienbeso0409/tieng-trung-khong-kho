import { SHARED_AI_URL } from './config.js';
// Cài đặt người dùng (ttkk:settings).
import { load, save } from './storage.js';

const DEFAULTS = {
  geminiKey: '',
  geminiModel: 'gemini-2.5-flash',
  voiceFemale: '',
  voiceMale: '',
  voiceNarrator: '',
  rate: 0.9,
  showPinyin: true,
  theme: 'auto',
  level: '',
  pauseSeconds: 2,
};

let cache = null;
const listeners = new Set();

export function getSettings() {
  if (!cache) cache = { ...DEFAULTS, ...(load('settings', {}) || {}) };
  return cache;
}

export function setSettings(patch) {
  cache = { ...getSettings(), ...patch };
  save('settings', cache);
  for (const fn of listeners) { try { fn(cache, patch); } catch { /* bỏ qua */ } }
  return cache;
}

export function onSettings(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export const hasPersonalKey = () => !!(getSettings().geminiKey || '').trim();
export const hasKey = () => hasPersonalKey() || !!SHARED_AI_URL;
export { DEFAULTS as SETTINGS_DEFAULTS };
