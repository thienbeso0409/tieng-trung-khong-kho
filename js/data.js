// Loader dữ liệu: đọc manifest data/index.json, cache fetch. Hỗ trợ ?data=test/data/ để trỏ sang thư mục khác.
function resolveBase() {
  let b = 'data/';
  try {
    const q = new URLSearchParams(location.search).get('data');
    // chỉ cho phép đường dẫn tương đối an toàn (không giao thức, không bắt đầu bằng / hoặc //)
    if (q && /^[A-Za-z0-9_\-./]+$/.test(q) && !q.startsWith('/') && !q.includes('..')) b = q.endsWith('/') ? q : q + '/';
  } catch { /* bỏ qua */ }
  return b;
}
export const DATA_BASE = resolveBase();

const cache = new Map();

export class DataError extends Error {
  constructor(path, cause, status = 0) {
    super(status === 404 ? `Nội dung "${path}" đang được soạn, chưa có trên máy chủ.` : `Không tải được dữ liệu "${path}"${cause ? ': ' + cause : ''}`);
    this.path = path;
    this.status = status;
    this.missing = status === 404 || /manifest chưa khai báo/.test(cause || '');
  }
}

export function fetchJSON(rel) {
  if (!rel) return Promise.reject(new DataError('(trống)', 'manifest chưa khai báo file này'));
  const url = DATA_BASE + rel;
  if (!cache.has(url)) {
    const p = fetch(url, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new DataError(rel, `HTTP ${r.status}`, r.status);
        return r.text();
      })
      .then((t) => {
        try { return JSON.parse(t.replace(/^﻿/, '')); } catch (e) { throw new DataError(rel, 'JSON không hợp lệ (' + e.message + ')'); }
      })
      .catch((e) => {
        cache.delete(url);
        throw e instanceof DataError ? e : new DataError(rel, location.protocol === 'file:' ? 'hãy chạy qua máy chủ web (python3 -m http.server), không mở trực tiếp file' : e.message);
      });
    cache.set(url, p);
  }
  return cache.get(url);
}

export const getManifest = () => fetchJSON('index.json');

// Cấp được định danh bằng chuỗi (vd "1", "7" hoặc "7-9") để không hard-code 1–6.
export const levelKey = (lv) => String(lv?.level ?? lv);

export async function getLevels() {
  const m = await getManifest();
  return Array.isArray(m.levels) ? m.levels : [];
}

export async function getLevel(key) {
  const levels = await getLevels();
  return levels.find((l) => levelKey(l) === String(key)) || null;
}

export async function getVocab(key) {
  const lv = await getLevel(key);
  if (!lv) throw new DataError(`cấp ${key}`, 'không có trong manifest');
  const d = await fetchJSON(lv.vocab);
  return Array.isArray(d.words) ? d.words : [];
}

export async function getAllExams() {
  const levels = await getLevels();
  return levels.flatMap((l) => (l.exams || []).map((e) => ({ ...e, level: l.level, levelName: l.name_vi })));
}

export async function getExam(id) {
  const all = await getAllExams();
  const meta = all.find((e) => e.id === id);
  if (!meta) throw new DataError(`đề ${id}`, 'không có trong manifest');
  const ex = await fetchJSON(meta.file);
  return { ...ex, _meta: meta };
}

export async function getSpeaking(kind) {
  const m = await getManifest();
  return fetchJSON(m.speaking?.[kind]);
}

export async function getWriting(kind) {
  const m = await getManifest();
  return fetchJSON(m.writing?.[kind]);
}

// So khớp cấp số với cấp của dữ liệu khác (topics level là số, có thể là 7 cho 7–9).
export function sameLevel(a, b) {
  const sa = String(a), sb = String(b);
  if (sa === sb) return true;
  const rng = (s) => { const m = /^(\d+)\s*[-–]\s*(\d+)$/.exec(s); return m ? [+m[1], +m[2]] : null; };
  const ra = rng(sa), rb = rng(sb);
  if (ra && /^\d+$/.test(sb)) return +sb >= ra[0] && +sb <= ra[1];
  if (rb && /^\d+$/.test(sa)) return +sa >= rb[0] && +sa <= rb[1];
  return false;
}

// HSK 3.0: mỗi cấp có file chữ Hán / luyện viết riêng (level.characters, level.practice);
// tương thích manifest cũ có manifest.writing.characters / practice dùng chung.
export async function getCharacters(key) {
  const lv = await getLevel(key);
  const m = await getManifest();
  if (lv && lv.characters) {
    const d = await fetchJSON(lv.characters);
    return d.characters || [];
  }
  if (m.writing?.characters) {
    const d = await fetchJSON(m.writing.characters);
    return (d.characters || []).filter((c) => sameLevel(c.level, key));
  }
  return [];
}

export async function getPracticeSets(key) {
  const lv = await getLevel(key);
  const m = await getManifest();
  if (lv && lv.practice) {
    const d = await fetchJSON(lv.practice);
    return d.sets || [];
  }
  if (lv && lv.practice === null) return [];
  if (m.writing?.practice) {
    const d = await fetchJSON(m.writing.practice);
    return (d.sets || []).filter((s) => sameLevel(s.level, key));
  }
  return [];
}

export async function getVocabFile(key) {
  const lv = await getLevel(key);
  if (!lv) throw new DataError(`cấp ${key}`, 'không có trong manifest');
  return fetchJSON(lv.vocab);
}
