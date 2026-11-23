// Luyện Nghe / Đọc theo từng part của các đề trong cấp.
import { h, clear, pageHead, emptyState } from '../ui.js';
import { getLevel, getExam } from '../data.js';
import { getProgress, updateProgress, pushLimited } from '../storage.js';
import { createRunner } from '../exam/runner.js';
import { levelChips, levelName, dataProblem, settle } from './common.js';

export const TYPE_VI = {
  true_false_image: 'Đúng/sai với hình', choose_image: 'Chọn hình', match_image: 'Ghép với hình', choose_option: 'Chọn đáp án',
  true_false_statement: 'Phán đoán câu ★', match_sentence: 'Ghép câu', fill_blank_wordbank: 'Chọn từ điền trống', reorder_words: 'Sắp xếp từ',
  write_hanzi_from_pinyin: 'Viết chữ theo pinyin', write_sentence: 'Đặt câu', order_sentences: 'Sắp xếp câu', write_essay: 'Viết đoạn/bài luận',
  choose_reply: 'Chọn câu đáp', choose_component: 'Chọn bộ kiện', cloze_option: 'Điền từ vào đoạn', cloze_sentence: 'Điền câu vào đoạn',
  order_position: 'Sắp xếp đoạn', short_answer: 'Trả lời ngắn', picture_story_writing: 'Viết theo tranh', chart_description: 'Mô tả biểu đồ',
  translate_written: 'Dịch viết', translate_oral: 'Dịch nói',
};

const META = {
  listening: { zh: '听力', title: 'Luyện nghe', kicker: 'Nghe', desc: 'Chọn một phần để luyện. Âm thanh phát đúng số lần như đề thật, có khoảng nghỉ; nộp bài để xem transcript và giải thích.' },
  reading: { zh: '阅读', title: 'Luyện đọc', kicker: 'Đọc', desc: 'Luyện từng dạng bài đọc theo đề HSK. Bật/tắt pinyin ở thanh trên cùng.' },
};

export async function render(root, params, ctx) {
  const skill = params.skill;
  const lv = params.level || ctx.level;
  const meta = META[skill];
  root.append(pageHead(meta.kicker, meta.zh, `${meta.title} ${levelName(ctx, lv)}`, meta.desc));
  root.append(levelChips(ctx, skill, lv));
  const level = await getLevel(lv);
  const metas = level?.exams || [];
  if (!metas.length) { root.append(dataProblem({ missing: true }, 'Đề luyện')); return; }
  const loaded = await settle(metas.map((m) => getExam(m.id)));
  if (!ctx.isCurrent()) return;
  const parts = [];
  loaded.forEach((r, i) => {
    if (!r.ok) { root.append(h('div', { style: { marginBottom: '12px' } }, dataProblem(r.error, metas[i].title_vi))); return; }
    const ex = r.value;
    const sec = (ex.sections || []).find((s) => s.id === skill);
    (sec?.parts || []).forEach((p, pi) => parts.push({ exam: ex, sec, part: p, idx: pi }));
  });
  if (!parts.length) { root.append(emptyState('空', 'Chưa có phần luyện cho kỹ năng này ở cấp đã chọn.')); return; }

  const list = h('div', { class: 'grid c3' });
  const stage = h('div');
  root.append(list, stage);
  const hist = getProgress().exams.filter((r) => r.mode === 'practice' && r.skill === skill);
  for (const it of parts) {
    const n = (it.part.groups || []).reduce((s, g) => s + (g.questions || []).filter((q) => !q.is_example).length, 0);
    const key = `${it.exam.id}:${it.part.code}`;
    const last = hist.find((r) => r.key === key);
    list.append(h('button', { class: 'card topic-card', onclick: () => open(it) },
      h('div', { class: 'row between' }, h('span', { class: 'badge red' }, `Phần ${it.idx + 1} · ${it.part.code}`), last ? h('span', { class: 'badge jade' }, `Lần trước ${last.correct}/${last.count}`) : null),
      h('h3', { style: { margin: '10px 0 4px' } }, TYPE_VI[it.part.type] || it.part.type),
      h('div', { class: 'small muted' }, `${n} câu · ${it.exam.title_vi}`),
      h('p', { class: 'small', style: { margin: '6px 0 0' } }, it.part.instruction_vi || '')));
  }
  let runner = null;
  const open = (it) => {
    runner?.destroy();
    clear(list); list.hidden = true;
    clear(stage);
    stage.append(h('div', { class: 'row', style: { marginBottom: '12px' } }, h('button', { class: 'btn sm ghost', onclick: () => ctx.navigate(`#/${skill}/${encodeURIComponent(lv)}`) }, '‹ Chọn phần khác'), h('span', { class: 'muted small' }, it.exam.title_vi)));
    const box = h('div'); stage.append(box);
    runner = createRunner(box, {
      sections: [{ ...it.sec, parts: [it.part] }],
      mode: 'practice', title: `${meta.title} – ${TYPE_VI[it.part.type] || it.part.type}`,
      showPinyin: it.exam.show_pinyin !== false, level: it.exam.level, rubrics: it.exam.rubrics || [],
      timeLimitMin: null, limitPlays: true,
      onRestart: () => open(it),
      onFinish: (r) => updateProgress((p) => pushLimited(p.exams, { mode: 'practice', skill, key: `${it.exam.id}:${it.part.code}`, examId: it.exam.id, title: `${meta.title} ${it.part.code} – ${it.exam.title_vi}`, level: String(lv), date: r.date, total: r.total, maxTotal: r.maxTotal, correct: r.correct, count: r.count })),
    });
  };
  return () => runner?.destroy();
}
