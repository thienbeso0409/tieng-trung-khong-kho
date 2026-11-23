// Ôn tập ngắt quãng (Leitner đơn giản) + đánh dấu đã thuộc. Lưu trong progress.vocab[wordId].
import { getProgress, updateProgress } from './storage.js';

const DAY = 864e5;
const INTERVAL = [0, 1, 2, 4, 8, 16, 32, 64]; // ngày theo hộp

export function vocabState() { return getProgress().vocab || {}; }

export function isKnown(id, st = vocabState()) { return !!st[id]?.known; }

export function setKnown(id, known) {
  updateProgress((p) => {
    const c = p.vocab[id] || { box: 0, due: 0, reviews: 0 };
    c.known = known;
    if (known && c.box < 4) { c.box = 4; c.due = Date.now() + INTERVAL[4] * DAY; }
    p.vocab[id] = c;
  });
}

// rating: 0 = Quên, 1 = Khó, 2 = Nhớ, 3 = Dễ
export function review(id, rating) {
  let out;
  updateProgress((p) => {
    const c = p.vocab[id] || { box: 0, due: 0, reviews: 0 };
    const now = Date.now();
    if (rating === 0) { c.box = 0; c.due = now; }
    else if (rating === 1) { c.box = Math.max(1, c.box); c.due = now + INTERVAL[c.box] * DAY * 0.5; }
    else if (rating === 2) { c.box = Math.min(INTERVAL.length - 1, c.box + 1); c.due = now + INTERVAL[c.box] * DAY; }
    else { c.box = Math.min(INTERVAL.length - 1, c.box + 2); c.due = now + INTERVAL[c.box] * DAY; }
    c.reviews = (c.reviews || 0) + 1;
    c.last = now;
    if (c.box >= 4) c.known = true;
    p.vocab[id] = c;
    out = c;
  });
  return out;
}

export const nextIntervalLabel = (id, rating) => {
  const c = vocabState()[id] || { box: 0 };
  const box = rating === 0 ? 0 : rating === 1 ? Math.max(1, c.box) : Math.min(INTERVAL.length - 1, c.box + (rating === 2 ? 1 : 2));
  const d = rating === 1 ? INTERVAL[box] * 0.5 : INTERVAL[box];
  if (rating === 0) return 'ngay';
  return d < 1 ? `${Math.round(d * 24)} giờ` : `${d} ngày`;
};

// Hàng đợi ôn: từ đến hạn + tối đa `newLimit` từ mới chưa học
export function buildQueue(words, { newLimit = 10 } = {}) {
  const st = vocabState();
  const now = Date.now();
  const due = words.filter((w) => st[w.id] && st[w.id].reviews && st[w.id].due <= now && !(st[w.id].known && st[w.id].box >= 6));
  const fresh = words.filter((w) => !st[w.id] || !st[w.id].reviews).filter((w) => !st[w.id]?.known).slice(0, newLimit);
  return { due, fresh, queue: [...due.sort((a, b) => st[a.id].due - st[b.id].due), ...fresh] };
}

export function levelStats(words) {
  const st = vocabState();
  const now = Date.now();
  let known = 0, learning = 0, due = 0;
  for (const w of words) {
    const c = st[w.id];
    if (!c) continue;
    if (c.known) known++; else if (c.reviews) learning++;
    if (c.reviews && c.due <= now) due++;
  }
  return { total: words.length, known, learning, due };
}
