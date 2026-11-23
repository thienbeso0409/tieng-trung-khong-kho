import { h, pageHead } from '../ui.js';
import { getManifest, levelKey } from '../data.js';
import { getProgress } from '../storage.js';
import { dataProblem } from './common.js';

export async function render(root) {
  root.append(pageHead('Thi thử', '模拟考试', 'Đề thi thử HSK 3.0', 'Làm đề đầy đủ có đồng hồ, chấm điểm từng phần theo thang HSK và xem lại lời giải chi tiết.'));
  let m;
  try { m = await getManifest(); } catch (e) { root.append(dataProblem(e, 'Danh sách đề')); return; }
  const p = getProgress();
  for (const lv of m.levels || []) {
    const k = levelKey(lv);
    root.append(h('div', { class: 'section-title' }, h('h2', null, lv.name_vi || `HSK ${k}`)));
    const exams = lv.exams || [];
    if (!exams.length) { root.append(h('p', { class: 'muted' }, 'Đề đang được soạn.')); continue; }
    root.append(h('div', { class: 'grid c3' }, exams.map((e) => {
      const hist = p.exams.filter((r) => r.examId === e.id);
      const best = hist.sort((a, b) => b.total - a.total)[0];
      return h('div', { class: 'card exam-card' },
        h('div', { class: 'meta' }, h('span', { class: 'badge red' }, lv.name_vi), hist.length ? h('span', { class: 'badge' }, `Đã làm ${hist.length} lần`) : null,
          best ? h('span', { class: 'badge jade' }, best.band ? best.band.label : `Cao nhất ${best.total}/${best.maxTotal}`) : null),
        h('h3', null, e.title_vi),
        h('a', { class: 'btn primary', href: `#/exam/${encodeURIComponent(e.id)}` }, 'Xem đề & bắt đầu'));
    })));
  }
}
