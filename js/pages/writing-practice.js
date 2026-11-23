// Bài viết dạng HSK (practice-hsk{L}.json + phần Viết/Dịch trong đề của cấp).
import { h, clear, pageHead, emptyState, notice } from '../ui.js';
import { getPracticeSets, getLevel, getExam } from '../data.js';
import { updateProgress, pushLimited } from '../storage.js';
import { hasKey } from '../settings.js';
import { createRunner } from '../exam/runner.js';
import { levelChips, levelName, dataProblem, settle } from './common.js';
import { TYPE_VI } from './skill.js';

export async function render(root, params, ctx) {
  const lv = params.level || ctx.level;
  root.append(pageHead('Viết', '写作', `Bài viết ${levelName(ctx, lv)}`, 'Luyện các dạng bài viết của đề HSK. Câu tự luận được AI chấm và nhận xét bằng tiếng Việt (cần API key), không có key sẽ chấm sơ bộ + hiện bài mẫu.'));
  root.append(levelChips(ctx, 'writing/practice', lv));
  if (!hasKey()) root.append(h('div', { style: { marginBottom: '16px' } }, notice('warn', '🤖', 'Chưa có API key Gemini – câu tự luận sẽ chấm sơ bộ. ', h('a', { href: '#/settings' }, 'Thêm key miễn phí'))));
  const items = [];
  let setsErr = null;
  try {
    for (const s of await getPracticeSets(lv)) items.push({
      title: s.title_vi, type: s.type, source: 'Bài luyện', key: s.id, showPinyin: ['1', '2'].includes(String(lv)), rubrics: s.rubrics || [],
      section: { id: 'writing', name_vi: 'Viết', max_score: 100, parts: [{ code: s.id, type: s.type, instruction_vi: s.instruction_vi || s.title_vi, groups: [{ id: s.id + '-g', shared_options: s.shared_options || null, passage: s.passage || null, questions: s.questions || [] }] }] },
      count: (s.questions || []).length,
    });
  } catch (e) { setsErr = e; }
  const level = await getLevel(lv);
  const exams = await settle((level?.exams || []).map((m) => getExam(m.id)));
  if (!ctx.isCurrent()) return;
  for (const r of exams) {
    if (!r.ok) continue;
    const ex = r.value;
    for (const sec of (ex.sections || []).filter((s) => s.id === 'writing' || s.id === 'translation')) {
      (sec.parts || []).forEach((p) => items.push({
        title: `${sec.name_vi} ${p.code} – ${TYPE_VI[p.type] || p.type}`, type: p.type, source: ex.title_vi, key: `${ex.id}:${p.code}`, showPinyin: ex.show_pinyin !== false, rubrics: ex.rubrics || [],
        section: { ...sec, parts: [p] }, count: (p.groups || []).reduce((n, g) => n + (g.questions || []).filter((q) => !q.is_example).length, 0),
      }));
    }
  }
  if (!items.length) { root.append(setsErr && !setsErr.missing ? dataProblem(setsErr) : dataProblem({ missing: true }, 'Bài luyện viết')); return; }
  const list = h('div', { class: 'grid c3' });
  const stage = h('div');
  root.append(list, stage);
  for (const it of items) list.append(h('button', { class: 'card topic-card', onclick: () => open(it) },
    h('span', { class: `badge ${it.source === 'Bài luyện' ? 'gold' : 'red'}` }, it.source),
    h('h3', { style: { margin: '10px 0 4px' } }, it.title),
    h('div', { class: 'small muted' }, `${TYPE_VI[it.type] || it.type} · ${it.count} câu`)));
  let runner = null;
  const open = (it) => {
    runner?.destroy();
    list.hidden = true;
    clear(stage).append(h('div', { class: 'row', style: { marginBottom: '12px' } }, h('button', { class: 'btn sm ghost', onclick: () => ctx.navigate(`#/writing/practice/${encodeURIComponent(lv)}`) }, '‹ Chọn bài khác'), h('strong', null, it.title)));
    const box = h('div'); stage.append(box);
    runner = createRunner(box, {
      sections: [it.section], mode: 'practice', title: it.title, showPinyin: it.showPinyin, level: lv, rubrics: it.rubrics, timeLimitMin: null,
      onRestart: () => open(it),
      onFinish: (r) => updateProgress((p) => pushLimited(p.writing, { key: it.key, title: it.title, level: String(lv), date: r.date, total: r.total, maxTotal: r.maxTotal, correct: r.correct, count: r.count })),
    });
  };
  if (!items.length) root.append(emptyState('空', 'Chưa có bài.'));
  return () => runner?.destroy();
}
