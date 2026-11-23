// Thi nói HSK 3.0 (papers) + luyện theo part (kể cả HSKK sơ/trung/cao).
import { h, clear, pageHead, notice, toast, textBlock, imageBox, fmtTime, emptyState, icon } from '../ui.js';
import { getSpeaking, sameLevel } from '../data.js';
import { hasKey } from '../settings.js';
import { generate, rubricText } from '../gemini.js';
import { playAudio, stopSpeaking, speak } from '../tts.js';
import { startCapture, recognitionSupported, SR_UNSUPPORTED_MSG } from '../speech.js';
import { matchRatio, keywordRatio, countHan } from '../compare.js';
import { updateProgress, pushLimited } from '../storage.js';
import { dataProblem } from './common.js';

const TYPE_VI = { repeat: 'Nghe và nhắc lại', listen_answer: 'Nghe và trả lời', answer_question: 'Trả lời câu hỏi', describe_picture: 'Nói về tranh', retell: 'Nghe và thuật lại', read_aloud: 'Đọc to', picture_story: 'Kể chuyện theo tranh', present_material: 'Trình bày theo tài liệu' };
const HIDDEN_PROMPT = ['repeat', 'listen_answer', 'retell'];
const LEVEL_NAME = { so: 'HSKK Sơ cấp', trung: 'HSKK Trung cấp', cao: 'HSKK Cao cấp' };

export async function render(root, params, ctx) {
  root.append(pageHead('Nói', '口试', 'Thi nói HSK', 'Làm đề nói hoàn chỉnh theo HSK 3.0 hoặc luyện từng phần. Có đếm giờ chuẩn bị/trả lời, ghi âm và chấm điểm theo tiêu chí.'));
  let data;
  try { data = await getSpeaking('hskk'); } catch (e) { root.append(dataProblem(e, 'Đề thi nói')); return; }
  if (!ctx.isCurrent()) return;
  if (!recognitionSupported()) root.append(h('div', { style: { marginBottom: '12px' } }, notice('warn', '🎙', SR_UNSUPPORTED_MSG)));
  if (!hasKey()) root.append(h('div', { style: { marginBottom: '12px' } }, notice('warn', '🤖', 'Chưa có API key Gemini: bài nói sẽ được chấm sơ bộ bằng so khớp với đáp án mẫu. ', h('a', { href: '#/settings' }, 'Thêm key để AI chấm chi tiết'))));
  const body = h('div');
  root.append(body);
  const items = data.items || [];
  const parts = new Map();
  for (const lv of data.levels || []) for (const p of lv.parts || []) parts.set(p.code, { ...p, level: String(lv.level), levelName: lv.name_vi });
  const rubrics = new Map((data.rubrics || []).map((r) => [r.id, r]));
  const env = { items, parts, rubrics, ctx };
  let cleanup = null;
  const q = new URLSearchParams(location.hash.split('?')[1] || '');

  const home = () => {
    cleanup?.(); cleanup = null;
    clear(body);
    const papers = data.papers || [];
    body.append(h('div', { class: 'section-title' }, h('h2', null, 'Đề thi nói hoàn chỉnh')));
    if (!papers.length) body.append(h('p', { class: 'muted' }, 'Đề nói đang được soạn.'));
    else body.append(h('div', { class: 'grid c3' }, papers.map((pp) => {
      const n = (pp.item_ids || []).length;
      const mine = sameLevel(pp.level, ctx.level);
      return h('div', { class: 'card exam-card' },
        h('div', { class: 'meta' }, h('span', { class: `badge ${mine ? 'red' : ''}` }, `HSK ${pp.level}`), h('span', { class: 'badge' }, `${n} mục`)),
        h('h3', null, pp.title_vi),
        h('button', { class: 'btn primary', onclick: () => { cleanup = runPaper(body, pp, env, home); } }, 'Bắt đầu thi nói'));
    })));
    body.append(h('div', { class: 'section-title' }, h('h2', null, 'Luyện theo phần')));
    for (const lv of data.levels || []) {
      const lp = (lv.parts || []).map((p) => ({ p, list: items.filter((it) => it.part === p.code) })).filter((x) => x.list.length);
      if (!lp.length) continue;
      body.append(h('h3', { style: { margin: '18px 0 10px' } }, lv.name_vi || LEVEL_NAME[lv.level] || `HSK ${lv.level}`));
      body.append(h('div', { class: 'grid c3' }, lp.map(({ p, list }) => h('button', { class: 'card topic-card', onclick: () => { cleanup = runSet(body, list, env, home, { title: `${lv.name_vi} – ${p.name_vi}` }); } },
        h('div', { class: 'row between' }, h('span', { class: 'badge red' }, p.code), h('span', { class: 'small muted' }, `${list.length} mục`)),
        h('h3', { style: { margin: '8px 0 2px' } }, p.name_vi, ' ', h('span', { class: 'zh muted small' }, p.name_zh || '')),
        h('p', { class: 'small muted', style: { margin: 0 } }, `${p.instruction_vi || ''} · chuẩn bị ${p.prep_seconds}s · trả lời ${p.answer_seconds}s`)))));
    }
  };

  const pid = q.get('paper');
  const paper = pid && (data.papers || []).find((p) => p.id === pid);
  if (pid && !paper) { body.append(dataProblem({ missing: true }, `Đề nói "${pid}"`)); body.append(h('button', { class: 'btn', style: { marginTop: '12px' }, onclick: home }, 'Xem các đề nói khác')); }
  else if (paper) cleanup = runPaper(body, paper, env, home);
  else home();
  return () => cleanup?.();
}

// ---------- Đề hoàn chỉnh ----------
function runPaper(root, paper, env, back) {
  const list = (paper.item_ids || []).map((id) => env.items.find((it) => it.id === id)).filter(Boolean);
  return runSet(root, list, env, back, { title: paper.title_vi, paper });
}

function runSet(root, list, env, back, { title, paper } = {}) {
  let i = -1;
  let stopper = null;
  const results = [];
  const top = h('div', { class: 'row', style: { marginBottom: '12px' } }, h('button', { class: 'btn sm ghost', onclick: () => { stopper?.(); back(); } }, '‹ Thoát'), h('strong', null, title));
  const stage = h('div');
  clear(root).append(top, stage);
  if (!list.length) { stage.append(emptyState('空', 'Chưa có mục nào.')); return () => {}; }

  const next = () => {
    stopper?.(); stopper = null;
    i++;
    if (i >= list.length) return summary();
    const it = list[i];
    const part = env.parts.get(it.part) || {};
    const rubric = env.rubrics.get(it.rubric_id || part.rubric_id);
    stopper = runItem(stage, it, part, rubric, {
      index: i, total: list.length, paper: !!paper,
      onDone: (r) => { results[i] = { it, ...r }; },
      onNext: next,
    });
  };

  const warmup = () => {
    const qs = [['你好！你叫什么名字？', 'Bạn tên là gì?'], ['你是哪国人？', 'Bạn là người nước nào?'], ['你的序号是多少？（请说最后五位）', 'Số báo danh của bạn (5 số cuối)?']];
    let k = 0; let timer = null;
    const step = async () => {
      clearInterval(timer);
      if (k >= qs.length) { next(); return; }
      const [zh, vi] = qs[k];
      let left = 10;
      const cd = h('div', { class: 'countdown' }, left);
      clear(stage).append(h('div', { class: 'card shadow-stage' },
        h('div', { class: 'phase' }, `Khởi động ${k + 1}/3 – không chấm điểm`), h('div', { class: 'big' }, zh), h('div', { class: 'vi' }, vi), cd,
        h('div', { class: 'controls' }, h('button', { class: 'btn', onclick: () => { k++; step(); } }, 'Tiếp ›'), h('button', { class: 'btn ghost', onclick: () => { k = qs.length; step(); } }, 'Bỏ qua khởi động'))));
      await speak(zh, { speaker: '女' }).catch(() => {});
      timer = setInterval(() => { left--; cd.textContent = left; if (left <= 0) { k++; step(); } }, 1000);
    };
    stopper = () => clearInterval(timer);
    step();
  };

  const summary = () => {
    const done = results.filter(Boolean);
    const sum = done.reduce((s, r) => s + (r.total || 0), 0);
    const max = done.reduce((s, r) => s + (r.max || 0), 0);
    const pct = max ? Math.round((100 * sum) / max) : 0;
    if (paper) updateProgress((p) => pushLimited(p.hskk, { id: paper.id, title: paper.title_vi, score: Math.round(sum * 10) / 10, max, date: new Date().toISOString() }));
    clear(stage).append(h('div', { class: 'card result-hero' },
      h('div', { class: 'muted small' }, title), h('div', { class: 'score' }, pct, h('small', null, ' / 100')),
      h('p', { class: 'muted' }, `Tổng ${Math.round(sum * 10) / 10}/${max} điểm theo tiêu chí · ${done.length}/${list.length} mục đã chấm`),
      h('div', { class: 'tbl-wrap', style: { textAlign: 'left' } }, h('table', { class: 'tbl' }, h('thead', null, h('tr', null, h('th', null, '#'), h('th', null, 'Dạng'), h('th', null, 'Bạn nói'), h('th', null, 'Điểm'))),
        h('tbody', null, list.map((it, k) => h('tr', null, h('td', null, k + 1), h('td', null, TYPE_VI[it.type] || it.type), h('td', { class: 'zh small' }, results[k]?.text || '—'), h('td', null, results[k] ? `${results[k].total}/${results[k].max}` : '—')))))),
      h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '16px' } }, h('button', { class: 'btn primary', onclick: () => { i = -1; results.length = 0; paper?.warmup ? warmup() : next(); } }, '↺ Làm lại'), h('button', { class: 'btn', onclick: back }, 'Về danh sách'))));
  };

  clear(stage).append(h('div', { class: 'card stack' },
    h('h2', null, title),
    h('p', null, `${list.length} mục. Mỗi mục: ${paper ? 'âm thanh phát 1 lần' : 'nghe/đọc đề'} → chuẩn bị → nói (máy ghi âm + nhận dạng) → chấm điểm.`),
    h('ul', { class: 'small', style: { margin: 0, paddingLeft: '18px' } }, h('li', null, 'Cho phép trình duyệt dùng micro khi được hỏi.'), h('li', null, 'Nói to, rõ, ngồi nơi yên tĩnh. Dùng Chrome/Edge để nhận dạng tốt nhất.'), h('li', null, 'Nếu máy nhận dạng sai, bạn có thể sửa lại văn bản trước khi chấm.')),
    h('button', { class: 'btn primary lg', onclick: () => (paper?.warmup ? warmup() : next()) }, paper?.warmup ? 'Bắt đầu (có phần khởi động)' : 'Bắt đầu')));
  return () => stopper?.();
}

// ---------- Một mục ----------
function runItem(stage, it, part, rubric, { index, total, paper, onDone, onNext }) {
  const prep = it.prep_seconds ?? part.prep_seconds ?? 0;
  const ans = it.answer_seconds ?? part.answer_seconds ?? 30;
  let timer = null; let capture = null; let dead = false;
  let rec = null;
  const hideUntilReview = HIDDEN_PROMPT.includes(it.type);
  const card = h('div', { class: 'card shadow-stage' });
  clear(stage).append(card);
  const head = () => h('div', null, h('div', { class: 'phase' }, `Mục ${index + 1}/${total} · ${TYPE_VI[it.type] || it.type}`), part.instruction_vi ? h('p', { class: 'small muted', style: { margin: '4px 0 10px' } }, part.instruction_vi) : null);
  const material = (reveal) => h('div', { class: 'stack', style: { textAlign: 'center' } },
    it.image ? imageBox(it.image, true) : null,
    Array.isArray(it.images) && it.images.length ? h('div', { class: 'pic-strip' }, it.images.map((im, k) => h('div', { class: 'pic' }, h('span', { class: 'pn' }, k + 1), imageBox(im, true)))) : null,
    (!hideUntilReview || reveal) && it.prompt ? textBlock(it.prompt, { pinyin: !paper || reveal, vi: reveal, cls: 'big-prompt' }) : null);
  const clearT = () => { clearInterval(timer); timer = null; };

  const countdown = (sec, label, onEnd, extra) => {
    clearT();
    let left = sec;
    const cd = h('div', { class: 'countdown' }, fmtTime(left));
    clear(card).append(head(), material(false), h('div', { class: 'phase', style: { marginTop: '14px' } }, label), cd, extra || null);
    timer = setInterval(() => { left--; cd.textContent = fmtTime(left); if (left <= 5) cd.style.color = 'var(--wrong)'; if (left <= 0) { clearT(); onEnd(); } }, 1000);
  };

  const intro = () => {
    clear(card).append(head(), material(false),
      h('div', { class: 'controls' },
        it.audio ? h('button', { class: 'btn primary', onclick: listen }, icon('play'), 'Nghe đề') : h('button', { class: 'btn primary', onclick: startPrep }, prep ? `Bắt đầu chuẩn bị (${fmtTime(prep)})` : 'Bắt đầu nói')));
  };
  const listen = async () => {
    clear(card).append(head(), material(false), h('div', { class: 'wave', 'aria-hidden': 'true' }, Array.from({ length: 9 }, () => h('i'))), h('p', { class: 'muted' }, 'Đang phát đề…'));
    const ctl = playAudio(it.audio, { repeat: paper ? 1 : (it.audio.repeat || 1) });
    await ctl.promise;
    if (!dead) startPrep();
  };
  const startPrep = () => {
    if (prep > 0) countdown(prep, 'Thời gian chuẩn bị', startAnswer, h('div', { class: 'controls' }, h('button', { class: 'btn', onclick: () => { clearT(); startAnswer(); } }, 'Bỏ qua, nói ngay')));
    else startAnswer();
  };
  const startAnswer = async () => {
    try { capture = await startCapture({ continuous: true, onInterim: (t) => { const el = card.querySelector('.interim'); if (el) el.textContent = t; } }); }
    catch (e) { toast(e.message, 'err'); capture = null; }
    if (dead) { capture?.cancel(); return; }
    if (capture?.recorderError) toast(capture.recorderError.message, 'err');
    countdown(ans, '🎙 Đang ghi âm – hãy nói', finishAnswer, h('div', null,
      h('div', { class: 'wave', 'aria-hidden': 'true' }, Array.from({ length: 9 }, () => h('i'))),
      h('div', { class: 'interim zh muted', style: { minHeight: '1.5em' } }),
      h('div', { class: 'controls' }, h('button', { class: 'btn rec on', onclick: () => { clearT(); finishAnswer(); } }, icon('stop'), 'Nói xong'))));
  };
  const finishAnswer = async () => {
    clear(card).append(head(), h('p', null, h('span', { class: 'spinner' }), ' Đang xử lý bản ghi…'));
    let text = ''; let error = null;
    if (capture) { const r = await capture.stop(); text = r.text; error = r.error; rec = r.audio; capture = null; }
    if (dead) return;
    review(text, error);
  };
  const review = (text, error) => {
    const ta = h('textarea', { class: 'textarea zh', rows: 3, value: text, placeholder: recognitionSupported() ? 'Máy không nhận ra – hãy gõ lại điều bạn đã nói' : 'Gõ lại câu trả lời của bạn (trình duyệt không nhận dạng được giọng nói)' });
    const res = h('div');
    clear(card).append(head(), material(true),
      h('div', { style: { textAlign: 'left', marginTop: '14px' } },
        error ? notice('warn', '🎙', error.message) : null,
        h('label', { class: 'field' }, h('span', null, 'Máy nghe được (có thể sửa):'), ta),
        h('div', { class: 'row' },
          rec ? h('button', { class: 'btn sm', onclick: () => new Audio(rec.url).play().catch(() => {}) }, '▶ Nghe lại giọng tôi') : null,
          it.audio ? h('button', { class: 'btn sm', onclick: () => playAudio(it.audio, { repeat: 1 }) }, '▶ Nghe lại đề') : null,
          h('button', { class: 'btn sm ghost', onclick: () => intro() }, '↺ Làm lại mục này'),
          h('span', { class: 'grow' }),
          h('button', { class: 'btn primary', onclick: async (e) => { e.currentTarget.disabled = true; await grade(ta.value.trim(), res); e.currentTarget.disabled = false; } }, 'Chấm điểm')),
        res,
        h('div', { class: 'row end', style: { marginTop: '14px' } }, h('button', { class: 'btn ink', onclick: () => onNext() }, index + 1 < total ? 'Mục tiếp theo ›' : 'Xem kết quả'))));
  };

  const grade = async (text, box) => {
    clear(box).append(h('p', { class: 'small' }, h('span', { class: 'spinner' }), hasKey() ? ' AI đang chấm…' : ' Đang chấm…'));
    let r = null; let aiErr = null;
    if (hasKey() && text) { try { r = await gradeAI(it, part, rubric, text); } catch (e) { aiErr = e.message; } }
    if (!r) r = gradeFallback(it, rubric, text);
    if (dead) return;
    onDone({ ...r, text });
    clear(box).append(h('div', { class: 'card flat', style: { marginTop: '12px' } },
      h('div', { class: 'row between' }, h('strong', null, r.ai ? '🤖 AI chấm' : '📝 Chấm sơ bộ (không AI)'), h('span', { class: 'badge red', style: { fontSize: '1rem' } }, `${r.total}/${r.max}`)),
      aiErr ? h('p', { class: 'small', style: { color: 'var(--wrong)' } }, 'AI lỗi: ' + aiErr) : null,
      h('div', { style: { marginTop: '10px' } }, (rubric?.criteria || []).map((c) => {
        const v = Math.max(0, Math.min(10, Number(r.scores?.[c.key]) || 0));
        return h('div', { class: 'crit' }, h('span', { class: 'small' }, c.name_vi, h('span', { class: 'muted' }, ` (×${c.weight})`)), h('b', null, `${Math.round(v * 10) / 10}/10`), h('div', { class: 'progress' }, h('i', { style: { width: `${v * 10}%` } })));
      })),
      r.transcript_note_vi ? h('p', { class: 'small muted' }, r.transcript_note_vi) : null,
      r.feedback_vi ? h('p', null, r.feedback_vi) : null,
      r.suggested_answer_zh ? h('div', { class: 'ai-box' }, h('div', { class: 'small muted' }, 'Gợi ý câu trả lời'), h('div', { class: 'zh' }, r.suggested_answer_zh)) : null,
      it.sample_answer ? h('div', { class: 'review' }, h('div', { class: 'rl' }, 'Đáp án mẫu'), textBlock(it.sample_answer, { vi: true, forcePinyin: true }), h('button', { class: 'btn sm', style: { marginTop: '6px' }, onclick: () => speak(it.sample_answer.zh).catch(() => {}) }, '▶ Nghe mẫu')) : null));
  };

  intro();
  return () => { dead = true; clearT(); capture?.cancel(); stopSpeaking(); };
}

function totalFrom(scores, rubric) {
  const max = rubric?.max_score || 10;
  const crit = rubric?.criteria || [];
  if (!crit.length) return { total: Math.round(((scores._ || 0) / 10) * max * 10) / 10, max };
  const t = crit.reduce((s, c) => s + (c.weight || 0) * Math.max(0, Math.min(10, Number(scores[c.key]) || 0)), 0) * (max / 10);
  return { total: Math.round(t * 10) / 10, max };
}

function gradeFallback(it, rubric, text) {
  const ref = it.sample_answer?.zh || it.prompt?.zh || '';
  let ratio; let note;
  if (!text) { ratio = 0; note = 'Chưa có câu trả lời.'; }
  else if (['repeat', 'read_aloud'].includes(it.type)) { ratio = matchRatio(ref, text); note = `Khớp ${Math.round(ratio * 100)}% với câu mẫu.`; }
  else {
    const kw = keywordRatio(it.keywords || [], text);
    const len = Math.min(1, countHan(text) / Math.max(8, countHan(ref) * 0.7));
    ratio = (it.keywords || []).length ? 0.6 * kw.ratio + 0.4 * len : len;
    note = `${(it.keywords || []).length ? `Dùng ${kw.hit.length}/${it.keywords.length} từ khóa${kw.miss.length ? ` (thiếu: ${kw.miss.join('、')})` : ''}. ` : ''}Độ dài ${countHan(text)} chữ.`;
  }
  const scores = { _: ratio * 10 };
  for (const c of rubric?.criteria || []) scores[c.key] = Math.round(ratio * 100) / 10;
  return { scores, ...totalFrom(scores, rubric), feedback_vi: note + ' (Chấm tự động đơn giản – thêm API key để AI nhận xét chi tiết.)', ai: false };
}

async function gradeAI(it, part, rubric, text) {
  const prompt = [
    'Bạn là giám khảo thi nói HSK (HSK 3.0 / HSKK) chấm cho học viên người Việt.',
    `Dạng bài: ${TYPE_VI[it.type] || it.type} (${part.name_zh || ''}). Cấp: ${it.level}. Thời gian trả lời: ${it.answer_seconds ?? part.answer_seconds}s.`,
    it.audio ? `Nội dung đề nghe: ${it.audio.lines.map((l) => l.text).join(' ')}` : '',
    it.prompt?.zh ? `Đề / yêu cầu: ${it.prompt.zh}` : '',
    it.image ? `Tranh: ${it.image.alt_vi}` : '',
    Array.isArray(it.images) ? `Chuỗi tranh: ${it.images.map((x, k) => `${k + 1}) ${x.alt_vi}`).join('; ')}` : '',
    it.sample_answer?.zh ? `Đáp án mẫu: ${it.sample_answer.zh}` : '',
    (it.keywords || []).length ? `Từ khóa nên có: ${it.keywords.join('、')}` : '',
    `Tiêu chí (mỗi tiêu chí chấm 0–10):\n${rubricText(rubric)}`,
    `Bài nói của học viên (văn bản do nhận dạng giọng nói chuyển thành, có thể có lỗi nhận dạng; lỗi nhận dạng nhiều thường do phát âm chưa chuẩn): """${text}"""`,
    'Nhận xét bằng TIẾNG VIỆT, cụ thể, thân thiện; chỉ ra lỗi ngữ pháp/từ và gợi ý câu hay hơn.',
    `Trả về DUY NHẤT JSON: {"scores": {${(rubric?.criteria || []).map((c) => `"${c.key}": số`).join(', ')}}, "total": số 0-${rubric?.max_score || 10}, "transcript_note_vi": "...", "feedback_vi": "...", "suggested_answer_zh": "..."}`,
  ].filter(Boolean).join('\n');
  const r = await generate({ prompt, temperature: 0.3 });
  const scores = r.scores || {};
  const calc = totalFrom(scores, rubric);
  const t = Number(r.total);
  return { ...r, scores, total: Number.isFinite(t) && t >= 0 && t <= calc.max ? Math.round(t * 10) / 10 : calc.total, max: calc.max, ai: true };
}
