import { h, pageHead, fmtDate, fmtTime, emptyState } from '../ui.js';
import { getProgress } from '../storage.js';
import { getVocab, levelKey } from '../data.js';
import { levelStats } from '../srs.js';
import { downloadBackup } from './settings.js';
import { settle } from './common.js';

export async function render(root, params, ctx) {
  const p = getProgress();
  root.append(pageHead('Tiến độ', '进度', 'Tiến độ học tập', 'Lịch sử làm bài, từ đã thuộc và chữ đã tập viết.',
    h('div', { class: 'row' }, h('button', { class: 'btn', onclick: downloadBackup }, '⬇ Sao lưu tiến độ (tải tệp)'), h('a', { class: 'btn ghost', href: '#/settings' }, 'Khôi phục / xóa dữ liệu'))));
  const chars = Object.keys(p.chars || {}).length;
  root.append(h('div', { class: 'card' }, h('div', { class: 'stats' },
    st(Object.values(p.vocab).filter((v) => v.known).length, 'từ đã thuộc (mọi cấp)'),
    st(chars, 'chữ Hán đã tập viết'),
    st(p.exams.filter((e) => e.mode === 'exam').length, 'lượt thi thử'),
    st(p.exams.filter((e) => e.mode === 'practice').length + (p.writing || []).length, 'lượt luyện kỹ năng'),
    st((p.hskk || []).length + (p.shadowing || []).length, 'lượt luyện nói'),
    st(p.streak.days || 0, 'ngày học liên tiếp 🔥'))));

  // Từ vựng theo cấp
  root.append(h('div', { class: 'section-title' }, h('h2', null, 'Từ vựng theo cấp')));
  const vbox = h('div', { class: 'card' }, h('p', { class: 'muted' }, 'Đang tính…'));
  root.append(vbox);

  const exams = p.exams.filter((e) => e.mode === 'exam');
  root.append(h('div', { class: 'section-title' }, h('h2', null, 'Lịch sử thi thử')));
  root.append(exams.length ? table(['Ngày', 'Đề', 'Điểm', 'Kết quả', 'Thời gian'], exams.map((e) => [fmtDate(e.date), e.title, `${e.total}/${e.maxTotal}`,
    e.band ? h('span', { class: 'badge red' }, e.band.label) : e.pass == null ? '—' : h('span', { class: `badge ${e.pass ? 'jade' : 'red'}` }, e.pass ? 'Đạt' : 'Chưa đạt'), e.durationSec ? fmtTime(e.durationSec) : '—']))
    : h('div', { class: 'card' }, emptyState('考', 'Chưa làm đề thi thử nào.', h('a', { class: 'btn primary', href: '#/exam' }, 'Thi thử ngay'))));

  const prac = [...p.exams.filter((e) => e.mode === 'practice'), ...(p.writing || [])].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 30);
  root.append(h('div', { class: 'section-title' }, h('h2', null, 'Luyện Nghe · Đọc · Viết')));
  root.append(prac.length ? table(['Ngày', 'Bài', 'Đúng', 'Điểm'], prac.map((e) => [fmtDate(e.date), e.title, `${e.correct ?? '—'}/${e.count ?? '—'}`, `${e.total}/${e.maxTotal}`])) : h('p', { class: 'muted' }, 'Chưa có.'));

  const speak = [...(p.hskk || []).map((x) => ({ ...x, kind: 'Thi nói' })), ...(p.shadowing || []).map((x) => ({ ...x, kind: 'Shadowing' }))].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 30);
  root.append(h('div', { class: 'section-title' }, h('h2', null, 'Luyện Nói')));
  root.append(speak.length ? table(['Ngày', 'Loại', 'Bài', 'Điểm'], speak.map((e) => [fmtDate(e.date), e.kind, e.title || e.id, e.max ? `${e.score}/${e.max}` : `${e.score}%`])) : h('p', { class: 'muted' }, 'Chưa có.'));

  // Chỉ tải file từ vựng của cấp đã học (tránh tải file lớn như HSK 7–9 khi không cần)
  const ids = Object.keys(p.vocab || {});
  const studied = (l) => ids.some((id) => id.startsWith(`hsk${levelKey(l)}-`));
  const res = await settle(ctx.levels.map((l) => (studied(l) ? getVocab(levelKey(l)) : Promise.resolve(null))));
  if (!ctx.isCurrent()) return;
  vbox.replaceChildren(...ctx.levels.map((l, i) => {
    if (res[i].ok && res[i].value === null) return h('div', { class: 'kv' }, h('strong', null, l.name_vi), h('a', { class: 'small', href: `#/vocab/${encodeURIComponent(levelKey(l))}` }, 'Chưa học – bắt đầu →'));
    const words = res[i].ok ? res[i].value : [];
    const s = levelStats(words);
    return h('div', { class: 'kv' },
      h('div', null, h('strong', null, l.name_vi), h('div', { class: 'progress', style: { marginTop: '6px' } }, h('i', { style: { width: `${s.total ? (100 * s.known) / s.total : 0}%` } }))),
      h('span', { class: 'small muted' }, res[i].ok ? `${s.known}/${s.total} thuộc · ${s.due} cần ôn` : 'đang soạn'));
  }));
}

const st = (n, l) => h('div', { class: 'stat' }, h('b', null, n), h('span', null, l));
function table(head, rows) {
  return h('div', { class: 'card tbl-wrap' }, h('table', { class: 'tbl' }, h('thead', null, h('tr', null, head.map((x) => h('th', null, x)))), h('tbody', null, rows.map((r) => h('tr', null, r.map((c) => h('td', null, c)))))));
}
