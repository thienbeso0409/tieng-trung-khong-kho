// Thi thử một đề đầy đủ.
import { h, clear, pageHead, notice, fmtTime } from '../ui.js';
import { getExam } from '../data.js';
import { updateProgress, pushLimited } from '../storage.js';
import { hasKey } from '../settings.js';
import { createRunner } from '../exam/runner.js';
import { isOpen, handlerFor } from '../exam/types.js';
import { dataProblem } from './common.js';

export async function render(root, params, ctx) {
  let exam;
  try { exam = await getExam(params.id); } catch (e) { root.append(pageHead('Thi thử', '模拟考试', 'Đề thi thử', null), dataProblem(e, 'Đề thi')); return; }
  if (!ctx.isCurrent()) return;
  let runner = null;
  const unload = (e) => { if (runner && !runner.submitted) { e.preventDefault(); e.returnValue = ''; } };
  window.addEventListener('beforeunload', unload);

  const intro = () => {
    clear(root);
    const secs = exam.sections || [];
    const qCount = (sec) => (sec.parts || []).reduce((n, p) => n + (p.groups || []).reduce((m, g) => m + (g.questions || []).filter((q) => !q.is_example).length, 0), 0);
    const hasOpen = secs.some((s) => (s.parts || []).some((p) => (p.groups || []).some((g) => (g.questions || []).some((q) => isOpen(handlerFor(q, g))))));
    const bands = exam.score_mode === 'bands';
    root.append(pageHead('Thi thử', '模拟考试', exam.title_vi, `${exam._meta?.levelName || ''} · chuẩn ${exam.standard || 'HSK'} · ${exam.duration_minutes || '?'} phút`));
    root.append(h('div', { class: 'grid c2' },
      h('div', { class: 'card' },
        h('h3', null, 'Cấu trúc đề'),
        h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' },
          h('thead', null, h('tr', null, h('th', null, 'Phần'), h('th', null, 'Số part'), h('th', null, 'Số câu'), h('th', null, 'Điểm'))),
          h('tbody', null, secs.map((s) => h('tr', null, h('td', null, s.name_vi, ' ', h('span', { class: 'zh muted' }, s.name_zh || '')), h('td', null, (s.parts || []).length), h('td', null, qCount(s)), h('td', null, s.max_score ?? 100)))))),
        h('p', { class: 'small muted', style: { marginTop: '10px' } }, bands
          ? 'Mỗi kỹ năng chấm 0–100; kết quả xếp bậc HSK 7 / 8 / 9 (ước lượng, không chính thức).'
          : `Tổng ${exam.total_score ?? '—'} điểm · Đạt từ ${exam.pass_score ?? '—'} điểm.`)),
      h('div', { class: 'card stack' },
        h('h3', null, 'Lưu ý trước khi thi'),
        h('ul', { style: { margin: 0, paddingLeft: '20px' } },
          h('li', null, `Thời gian làm bài: ${exam.duration_minutes || '?'} phút. Hết giờ bài tự nộp.`),
          h('li', null, 'Phần nghe: mỗi đoạn chỉ được bấm nghe 1 lượt (phát đủ số lần như đề thật). Có thể bấm "Phát tự động" để nghe lần lượt.'),
          h('li', null, 'Bật loa, dùng Chrome hoặc Edge để có giọng đọc tiếng Trung tốt nhất.'),
          exam.show_pinyin === false ? h('li', null, 'Đề cấp này không có pinyin (như đề thật).') : null),
        hasOpen && !hasKey() ? notice('warn', '🤖', 'Đề có câu tự luận. Chưa có API key Gemini nên sẽ chấm sơ bộ + hiện đáp án mẫu. ', h('a', { href: '#/settings' }, 'Thêm key')) : null,
        exam.speaking_paper ? notice('', '🎤', 'Đề này có bài thi nói riêng: ', h('a', { href: `#/speaking/hskk?paper=${encodeURIComponent(exam.speaking_paper)}` }, 'làm đề nói')) : null,
        h('button', { class: 'btn primary lg', onclick: start }, 'Bắt đầu làm bài'))));
  };

  const start = () => {
    clear(root);
    root.append(h('h1', { style: { fontSize: '1.4rem' } }, exam.title_vi));
    const box = h('div');
    root.append(box);
    runner = createRunner(box, {
      sections: exam.sections || [],
      mode: 'exam',
      title: exam.title_vi,
      showPinyin: exam.show_pinyin !== false,
      level: exam.level,
      timeLimitMin: exam.duration_minutes || null,
      passScore: exam.score_mode === 'bands' ? null : exam.pass_score,
      scoreMode: exam.score_mode || 'pass',
      bandRules: exam.band_rules,
      rubrics: exam.rubrics || [],
      limitPlays: true,
      onRestart: () => { runner?.destroy(); intro(); },
      extraResult: () => exam.speaking_paper ? h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '16px' } },
        h('a', { class: 'btn ink', href: `#/speaking/hskk?paper=${encodeURIComponent(exam.speaking_paper)}` }, '🎤 Sang bài thi nói')) : null,
      onFinish: (r) => updateProgress((p) => pushLimited(p.exams, {
        examId: exam.id, title: exam.title_vi, level: String(exam.level), mode: 'exam', date: r.date, durationSec: r.durationSec,
        total: r.total, maxTotal: r.maxTotal, pass: r.pass, band: r.band, sections: r.sections.map((s) => ({ id: s.id, name: s.name, score: s.score, max: s.max })),
      })),
    });
  };

  intro();
  return () => { window.removeEventListener('beforeunload', unload); runner?.destroy(); };
}
export { fmtTime };
