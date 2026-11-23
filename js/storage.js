// localStorage an toàn: mọi truy cập bọc try/catch, lỗi → dùng bộ nhớ tạm. Khóa tiền tố "ttkk:".
const PREFIX = 'ttkk:';
const mem = new Map();
let available = true;
try {
  const k = PREFIX + '__test';
  localStorage.setItem(k, '1');
  localStorage.removeItem(k);
} catch { available = false; }

export const storageAvailable = () => available;

export function load(key, fallback = null) {
  const full = PREFIX + key;
  try {
    const raw = available ? localStorage.getItem(full) : mem.get(full);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch { return fallback; }
}

export function save(key, value) {
  const full = PREFIX + key;
  const raw = JSON.stringify(value);
  try {
    if (available) localStorage.setItem(full, raw); else mem.set(full, raw);
    return true;
  } catch {
    mem.set(full, raw);
    return false;
  }
}

export function remove(key) {
  const full = PREFIX + key;
  try { if (available) localStorage.removeItem(full); } catch { /* bỏ qua */ }
  mem.delete(full);
}

export function allKeys() {
  const out = new Set();
  try {
    if (available) for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) out.add(k.slice(PREFIX.length));
    }
  } catch { /* bỏ qua */ }
  for (const k of mem.keys()) out.add(k.slice(PREFIX.length));
  return [...out];
}

// ---------- Tiến độ ----------
const PKEY = 'progress';
const emptyProgress = () => ({ version: 1, vocab: {}, exams: [], chars: {}, shadowing: [], hskk: [], writing: [], chat: { sessions: 0, messages: 0 }, streak: { last: null, days: 0 } });

export function getProgress() {
  const p = load(PKEY, null);
  const base = emptyProgress();
  if (!p || typeof p !== 'object') return base;
  return { ...base, ...p, chat: { ...base.chat, ...(p.chat || {}) }, streak: { ...base.streak, ...(p.streak || {}) } };
}

export function updateProgress(fn) {
  const p = getProgress();
  fn(p);
  touchStreak(p);
  save(PKEY, p);
  return p;
}

function touchStreak(p) {
  const today = new Date().toISOString().slice(0, 10);
  if (p.streak.last === today) return;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  p.streak.days = p.streak.last === y ? p.streak.days + 1 : 1;
  p.streak.last = today;
}

export function pushLimited(arr, item, max = 200) {
  arr.unshift(item);
  if (arr.length > max) arr.length = max;
}

export function exportAll() {
  const data = {};
  for (const k of allKeys()) {
    if (k === 'settings') {
      const s = load(k, {});
      data[k] = { ...s, geminiKey: '' }; // không xuất API key
    } else data[k] = load(k);
  }
  return { app: 'tieng-trung-khong-kho', exported: new Date().toISOString(), data };
}

export function importAll(obj) {
  if (!obj || obj.app !== 'tieng-trung-khong-kho' || typeof obj.data !== 'object') throw new Error('File không đúng định dạng sao lưu của Tiếng Trung không khó.');
  for (const [k, v] of Object.entries(obj.data)) {
    if (k === 'settings') {
      const cur = load('settings', {});
      save(k, { ...v, geminiKey: cur.geminiKey || v.geminiKey || '' });
    } else save(k, v);
  }
}

export function clearAll({ keepSettings = false } = {}) {
  for (const k of allKeys()) if (!(keepSettings && k === 'settings')) remove(k);
}
