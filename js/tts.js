// Đọc tiếng Trung bằng speechSynthesis, phân biệt giọng 男 / 女 / 旁白.
import { getSettings } from './settings.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
export const ttsSupported = () => !!synth && typeof SpeechSynthesisUtterance !== 'undefined';

let voicesP = null;
export function loadVoices() {
  if (!ttsSupported()) return Promise.resolve([]);
  if (voicesP) return voicesP;
  voicesP = new Promise((resolve) => {
    const done = () => resolve(synth.getVoices() || []);
    const v = synth.getVoices();
    if (v && v.length) return resolve(v);
    let settled = false;
    synth.addEventListener?.('voiceschanged', () => { if (!settled) { settled = true; done(); } }, { once: true });
    setTimeout(() => { if (!settled) { settled = true; done(); } }, 1500);
  }).then((v) => { if (!v.length) voicesP = null; return v; });
  return voicesP;
}

const isZh = (v) => /^(zh|cmn)([-_](CN|Hans|SG))?/i.test(v.lang) && !/(HK|TW|yue)/i.test(v.lang);
const anyZh = (v) => /^(zh|cmn|yue)/i.test(v.lang);

export async function zhVoices() {
  const all = await loadVoices();
  const main = all.filter(isZh);
  return main.length ? main : all.filter(anyZh);
}

const FEMALE_RE = /(female|woman|xiaoxiao|xiaoyi|xiaohan|xiaomo|xiaorui|xiaoshuang|xiaoxuan|xiaoyan|xiaozhen|huihui|yaoyao|tingting|ting-ting|meijia|sinji|lili|lisa|女)/i;
const MALE_RE = /(male|man|yunxi|yunyang|yunjian|yunye|yunze|yunfeng|yunhao|kangkang|li-mu|limu|男)/i;

function guessGender(v) {
  const n = v.name;
  if (/female/i.test(n)) return 'f';
  if (MALE_RE.test(n) && !/female/i.test(n)) return 'm';
  if (FEMALE_RE.test(n)) return 'f';
  return '?';
}

// Trả về {voice, pitch} cho từng vai.
export async function voiceFor(speaker) {
  const s = getSettings();
  const list = await zhVoices();
  const byName = (name) => (name ? list.find((v) => v.voiceURI === name || v.name === name) : null);
  const females = list.filter((v) => guessGender(v) === 'f');
  const males = list.filter((v) => guessGender(v) === 'm');
  const female = byName(s.voiceFemale) || females.find((v) => /xiaoxiao|natural|online/i.test(v.name)) || females[0] || list[0] || null;
  const male = byName(s.voiceMale) || males.find((v) => /yunxi|natural|online/i.test(v.name)) || males[0] || list.find((v) => v !== female) || female;
  const narrator = byName(s.voiceNarrator) || list.find((v) => v !== female && v !== male) || female;
  if (speaker === '男') {
    // cùng một giọng với nữ → hạ pitch rõ rệt để phân biệt
    return { voice: male, pitch: male === female ? 0.62 : 1 };
  }
  if (speaker === '旁白') return { voice: narrator, pitch: narrator === female || narrator === male ? 0.95 : 1 };
  return { voice: female, pitch: female === male ? 1.3 : 1.05 };
}

export async function hasZhVoice() { return (await zhVoices()).length > 0; }

let currentToken = 0;
export function stopSpeaking() {
  currentToken++;
  try { synth && synth.cancel(); } catch { /* bỏ qua */ }
}

// Đọc một câu. Promise resolve khi xong (hoặc bị dừng → resolve false).
export async function speak(text, { speaker = '女', rate, token } = {}) {
  if (!ttsSupported()) throw new Error('Trình duyệt không hỗ trợ đọc văn bản (Text-to-Speech). Hãy dùng Chrome, Edge hoặc Safari mới.');
  const myToken = token ?? currentToken;
  const { voice, pitch } = await voiceFor(speaker);
  if (myToken !== currentToken) return false;
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang || 'zh-CN';
    if (voice) u.voice = voice;
    u.pitch = pitch;
    u.rate = rate ?? (Number(getSettings().rate) || 0.9);
    let finished = false;
    const end = (ok) => { if (!finished) { finished = true; clearTimeout(guard); resolve(ok); } };
    // Bảo hiểm: một số trình duyệt không bắn onend
    const guard = setTimeout(() => end(true), 1500 + text.length * 450 / Math.max(0.3, u.rate));
    u.onend = () => end(true);
    u.onerror = (e) => end(e.error === 'interrupted' || e.error === 'canceled' ? false : true);
    try { synth.speak(u); } catch { end(false); }
  });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Phát Audio {lines, repeat}: mỗi lượt đọc tuần tự các dòng; giữa các lượt nghỉ pauseSeconds.
export function playAudio(audio, { repeat, pause, rate, onLine, onRound } = {}) {
  stopSpeaking();
  const token = currentToken;
  const rounds = repeat ?? audio?.repeat ?? 1;
  const gap = (pause ?? Number(getSettings().pauseSeconds ?? 2)) * 1000;
  const lines = audio?.lines || [];
  const promise = (async () => {
    for (let r = 0; r < rounds; r++) {
      if (token !== currentToken) return false;
      onRound && onRound(r + 1, rounds);
      for (let i = 0; i < lines.length; i++) {
        if (token !== currentToken) return false;
        onLine && onLine(i, lines[i]);
        const ok = await speak(lines[i].text, { speaker: lines[i].speaker, rate, token });
        if (!ok && token !== currentToken) return false;
        if (i < lines.length - 1) await wait(350);
      }
      if (r < rounds - 1) await wait(gap);
    }
    return token === currentToken;
  })();
  return { promise, cancel: stopSpeaking };
}
