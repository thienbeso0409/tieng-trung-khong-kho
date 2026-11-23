// Renderer + chấm điểm cho từng `type` câu hỏi (DATA_SCHEMA §5.3 + Phụ lục A.3).
// Mỗi handler: { kind: 'choice'|'tf'|'input'|'open', render(q, c), grade(q, ans) → {correct, score?, max?}, answerText(q) }
// c = { value, set(v), review, showPinyin, group, listening, mic? }
import { h, textBlock, imageBox, BLANK, shuffle } from '../ui.js';
import { normalize, keywordRatio, countHan, matchRatio } from '../compare.js';
import { recognitionSupported, startRecognition, SR_UNSUPPORTED_MSG } from '../speech.js';

const T = (t, c, opt = {}) => textBlock(t, { pinyin: c.showPinyin || c.review, vi: c.review && opt.vi !== false, ...opt });

// ---------- Khối chọn ----------
export function choiceList(options, c, { layout = 'text', answerKey } = {}) {
  const wrap = h('div', { class: `choices ${layout}`, role: 'radiogroup' });
  for (const o of options || []) {
    const sel = c.value === o.key;
    let cls = 'choice';
    if (c.review) {
      if (o.key === answerKey) cls += ' is-right';
      else if (sel) cls += ' is-wrong';
    } else if (sel) cls += ' sel';
    const btn = h('button', { type: 'button', class: cls, role: 'radio', 'aria-checked': String(sel), disabled: c.review, onclick: () => c.set(sel ? null : o.key) },
      h('span', { class: 'k' }, o.key),
      layout === 'imgs' ? imageBox(o.image) : null,
      layout === 'text' && o.text ? T(o.text, c, { vi: true }) : null,
      layout === 'text' && !o.text && o.image ? imageBox(o.image) : null);
    wrap.append(btn);
  }
  return wrap;
}

function keyPicker(shared, c, answerKey) {
  // Chỉ hiện chữ cái A–F (nội dung đã hiện ở shared_options)
  return choiceList((shared || []).map((o) => ({ key: o.key })), c, { layout: 'keys', answerKey });
}

function tfPicker(c, answer) {
  const opts = [{ v: true, label: '✓', aria: 'Đúng' }, { v: false, label: '✗', aria: 'Sai' }];
  return h('div', { class: 'choices tf', role: 'radiogroup' }, opts.map((o) => {
    const sel = c.value === o.v;
    let cls = 'choice';
    if (c.review) { if (o.v === answer) cls += ' is-right'; else if (sel) cls += ' is-wrong'; } else if (sel) cls += ' sel';
    return h('button', { type: 'button', class: cls, 'aria-label': o.aria, 'aria-checked': String(sel), role: 'radio', disabled: c.review, onclick: () => c.set(sel ? null : o.v) }, o.label, h('span', { class: 'small muted', style: { fontSize: '.8rem' } }, o.aria));
  }));
}

const letterGrade = (q, a) => ({ correct: a != null && a === q.answer });
const optText = (opts, key) => {
  const o = (opts || []).find((x) => x.key === key);
  if (!o) return key ?? '—';
  return `${key}. ${o.text?.zh || o.image?.alt_vi || ''}`;
};

// ---------- Ô nhập trả lời có micro (dùng cho câu mở + dịch nói) ----------
function openInput(c, { placeholder = 'Nhập câu trả lời bằng chữ Hán…', rows = 4, mic = false, minChars } = {}) {
  const ta = h('textarea', { class: 'textarea zh', rows, placeholder, lang: 'zh-CN', disabled: c.review, value: c.value || '', oninput: () => { c.set(ta.value, { silent: true }); counter.textContent = countLabel(); } });
  const countLabel = () => `${countHan(ta.value)} chữ Hán${minChars ? ` / tối thiểu ${minChars}` : ''}`;
  const counter = h('span', { class: 'small muted' }, countLabel());
  const row = h('div', { class: 'row between', style: { marginTop: '6px' } }, counter);
  if (mic && !c.review) {
    if (recognitionSupported()) {
      let rec = null;
      const btn = h('button', { type: 'button', class: 'btn sm rec', onclick: async () => {
        if (rec) { rec.stop(); return; }
        const base = ta.value;
        btn.classList.add('on'); btn.textContent = '■ Dừng';
        rec = startRecognition({ continuous: true, onInterim: (t) => { ta.value = base + t; } });
        try { const t = await rec.promise; ta.value = base + t; } catch (e) { row.append(h('span', { class: 'small', style: { color: 'var(--wrong)' } }, e.message)); }
        rec = null; btn.classList.remove('on'); btn.textContent = '🎙 Nói';
        c.set(ta.value, { silent: true }); counter.textContent = countLabel();
      } }, '🎙 Nói');
      row.append(btn);
    } else row.append(h('span', { class: 'small muted' }, SR_UNSUPPORTED_MSG));
  }
  return h('div', null, ta, row);
}

// Chấm dự phòng cho câu mở (không có key AI)
export function fallbackOpen(q, text) {
  const t = String(text || '').trim();
  const max = q.max_points || 10;
  if (!t) return { correct: false, score: 0, max, fallback: true, feedback_vi: 'Bạn chưa trả lời.' };
  const kws = [q.keyword?.zh, ...(Array.isArray(q.keywords) ? q.keywords.map((k) => (typeof k === 'string' ? k : k?.zh)) : [])].filter(Boolean);
  const minChars = q.min_chars || 0;
  const len = countHan(t);
  const lenOk = len >= minChars;
  const kw = keywordRatio(kws, t);
  const samples = [q.reference_zh, ...(q.sample_answers || []), q.sample_answer?.zh, typeof q.sample_answer === 'string' ? q.sample_answer : null].filter(Boolean);
  const isTranslate = /^translate/.test(q.type);
  let ratio;
  const notes = [];
  if (isTranslate && samples.length) {
    ratio = Math.max(...samples.map((s) => matchRatio(s, t)));
    notes.push(`Mức trùng với bản dịch mẫu: ${Math.round(ratio * 100)}%.`);
  } else if (kws.length) {
    ratio = 0.6 * kw.ratio + 0.4 * (lenOk ? 1 : len / Math.max(1, minChars));
    notes.push(kw.miss.length ? `Thiếu từ khóa: ${kw.miss.join('、')}.` : 'Đã dùng đủ từ khóa.');
  } else ratio = lenOk ? 0.7 : 0.7 * len / Math.max(1, minChars);
  if (minChars) notes.push(lenOk ? `Độ dài đạt (${len}/${minChars} chữ).` : `Chưa đủ độ dài (${len}/${minChars} chữ).`);
  const score = Math.round(Math.min(1, ratio) * max * 10) / 10;
  const correct = q.type === 'write_sentence' ? (kw.ratio === 1 || !kws.length) && lenOk : score >= max * 0.6;
  return { correct, score, max, fallback: true, feedback_vi: notes.join(' ') + ' (Chấm sơ bộ không dùng AI — hãy tự so với đáp án mẫu.)' };
}

const LANG_VI = { en: 'tiếng Anh', vi: 'tiếng Việt', zh: 'tiếng Trung' };
const openHandler = (opts = {}) => ({
  kind: 'open',
  render(q, c) {
    const body = h('div', { class: 'q-body' });
    const meta = [];
    if (q.min_chars) meta.push(`≥ ${q.min_chars} chữ`);
    if (q.max_chars) meta.push(`≤ ${q.max_chars} chữ`);
    if (q.time_minutes) meta.push(`gợi ý ${q.time_minutes} phút`);
    if (q.prep_seconds) meta.push(`chuẩn bị ${q.prep_seconds}s`);
    if (q.answer_seconds) meta.push(`nói ${q.answer_seconds}s`);
    if (q.max_points) meta.push(`${q.max_points} điểm`);
    if (meta.length) body.append(h('div', { class: 'row' }, meta.map((m) => h('span', { class: 'badge' }, m))));
    if (q.prompt_vi) body.append(h('p', { style: { margin: 0, fontWeight: 600 } }, q.prompt_vi));
    const prompt = q.prompt && typeof q.prompt === 'object' ? q.prompt : (q.prompt_zh ? { zh: q.prompt_zh } : (typeof q.prompt === 'string' ? { zh: q.prompt } : null));
    if (prompt) body.append(T(prompt, c));
    const src = q.source;
    if (src) {
      const txt = typeof src === 'string' ? src : (src.text || src.zh || '');
      body.append(h('div', { class: 'card flat', style: { padding: '12px 14px', background: 'var(--card-2)' } },
        h('div', { class: 'small muted' }, opts.sourceLabel || 'Văn bản nguồn', src.lang ? ` (${LANG_VI[src.lang] || src.lang})` : ''),
        h('div', { lang: src.lang || null, style: { fontSize: '1.05rem', lineHeight: 1.6 } }, txt),
        q.source_vi ? h('details', { class: 'more', style: { marginTop: '6px' } }, h('summary', { class: 'small' }, 'Xem bản tiếng Việt tương đương'), h('div', { class: 'vi' }, q.source_vi)) : null));
    }
    if (q.image) body.append(imageBox(q.image, true));
    if (Array.isArray(q.images) && q.images.length) body.append(h('div', { class: 'pic-strip' }, q.images.map((im, i) => h('div', { class: 'pic' }, h('span', { class: 'pn' }, i + 1), imageBox(im, true)))));
    if (q.chart) body.append(renderChart(q.chart));
    if (q.passage) body.append(T(q.passage, c));
    const kws = [q.keyword, ...(Array.isArray(q.keywords) ? q.keywords : [])].filter(Boolean);
    if (kws.length) body.append(h('div', { class: 'vocab-chips' }, h('span', { class: 'small muted', style: { alignSelf: 'center' } }, 'Từ cho sẵn:'), kws.map((k) => h('span', { class: 'vchip' }, typeof k === 'string' ? h('span', { class: 'zh' }, k) : [k.pinyin ? h('span', { class: 'py' }, k.pinyin) : null, h('span', { class: 'zh' }, k.zh)]))));
    if (Array.isArray(q.outline_vi) && q.outline_vi.length) body.append(h('details', { class: 'more' }, h('summary', { class: 'small' }, '💡 Gợi ý dàn ý'), h('ul', { class: 'small', style: { margin: '4px 0 0', paddingLeft: '20px' } }, q.outline_vi.map((x) => h('li', null, x)))));
    body.append(openInput(c, { mic: opts.mic, minChars: q.min_chars, rows: opts.rows || (q.min_chars > 60 ? 8 : 4), placeholder: opts.placeholder }));
    return body;
  },
  grade: (q, a) => fallbackOpen(q, a),
  answerText: (q) => [q.reference_zh, ...(q.sample_answers || []), q.sample_answer?.zh || (typeof q.sample_answer === 'string' ? q.sample_answer : null)].filter(Boolean).join('\n— ') || '(câu mở – xem gợi ý)',
});

// Biểu đồ: { kind: bar|line|pie|table, title_zh, unit, labels: [], series: [{name, values: []}] }
const PALETTE = ['var(--red)', 'var(--gold)', 'var(--blue)', 'var(--jade)', '#8a5a9e', '#7a6d61'];
export function renderChart(chart) {
  const labels = chart.labels || (chart.items || []).map((i) => i.label);
  const series = chart.series || [{ name: '', values: (chart.items || []).map((i) => i.value) }];
  const unit = chart.unit || '';
  const fig = h('figure', { class: 'chart card flat' });
  fig.append(h('figcaption', { class: 'zh' }, chart.title_zh || chart.title || '', unit ? h('span', { class: 'small muted' }, ` （单位：${unit}）`) : null));
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs = {}, text) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (text != null) e.textContent = text; return e; };
  const kind = chart.kind || 'bar';
  if (kind === 'table') {
    fig.append(h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl zh' },
      h('thead', null, h('tr', null, h('th', null, ''), labels.map((l) => h('th', null, l)))),
      h('tbody', null, series.map((s) => h('tr', null, h('th', null, s.name), (s.values || []).map((v) => h('td', null, v))))))));
    return fig;
  }
  if (kind === 'pie') {
    const vals = series[0]?.values || [];
    const sum = vals.reduce((a, b) => a + (Number(b) || 0), 0) || 1;
    const root = svg('svg', { viewBox: '0 0 340 200', role: 'img', 'aria-label': chart.title_zh || 'biểu đồ tròn' });
    let ang = -Math.PI / 2;
    vals.forEach((v, i) => {
      const a2 = ang + (2 * Math.PI * (Number(v) || 0)) / sum;
      const large = a2 - ang > Math.PI ? 1 : 0;
      const p = (a) => `${100 + 80 * Math.cos(a)},${100 + 80 * Math.sin(a)}`;
      root.append(svg('path', { d: `M100,100 L${p(ang)} A80,80 0 ${large} 1 ${p(a2)} Z`, fill: PALETTE[i % PALETTE.length], stroke: 'var(--card)', 'stroke-width': 2 }));
      root.append(svg('rect', { x: 200, y: 30 + i * 24, width: 12, height: 12, rx: 2, fill: PALETTE[i % PALETTE.length] }));
      root.append(svg('text', { x: 218, y: 41 + i * 24, 'font-size': 12, fill: 'var(--ink)' }, `${labels[i]} ${Math.round((100 * v) / sum)}%`));
      ang = a2;
    });
    fig.append(root);
    return fig;
  }
  const all = series.flatMap((s) => s.values || []).map(Number);
  const max = Math.max(1, ...all) * 1.12;
  const W = 360, H = 210, L = 38, B = 26, top = 12;
  const iw = W - L - 10, ih = H - B - top;
  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': chart.title_zh || 'biểu đồ' });
  for (let k = 0; k <= 4; k++) {
    const y = top + ih - (ih * k) / 4;
    root.append(svg('line', { x1: L, x2: W - 10, y1: y, y2: y, stroke: 'var(--line)', 'stroke-width': 1 }));
    root.append(svg('text', { x: L - 6, y: y + 4, 'font-size': 10, 'text-anchor': 'end', fill: 'var(--ink-3)' }, Math.round(((max * k) / 4) * 10) / 10));
  }
  const n = labels.length || 1;
  const step = iw / n;
  labels.forEach((lb, i) => root.append(svg('text', { x: L + step * i + step / 2, y: H - 8, 'font-size': 11, 'text-anchor': 'middle', fill: 'var(--ink-2)' }, lb)));
  series.forEach((s, si) => {
    const color = PALETTE[si % PALETTE.length];
    const vals = (s.values || []).map(Number);
    if (kind === 'line') {
      const pts = vals.map((v, i) => `${L + step * i + step / 2},${top + ih - (ih * v) / max}`);
      root.append(svg('polyline', { points: pts.join(' '), fill: 'none', stroke: color, 'stroke-width': 2.5 }));
      vals.forEach((v, i) => {
        root.append(svg('circle', { cx: L + step * i + step / 2, cy: top + ih - (ih * v) / max, r: 3.5, fill: color }));
        root.append(svg('text', { x: L + step * i + step / 2, y: top + ih - (ih * v) / max - 8, 'font-size': 10, 'text-anchor': 'middle', fill: 'var(--ink)' }, v));
      });
    } else {
      const bw = (step * 0.7) / series.length;
      vals.forEach((v, i) => {
        const x = L + step * i + step * 0.15 + bw * si;
        const bh = (ih * v) / max;
        root.append(svg('rect', { x, y: top + ih - bh, width: Math.max(1, bw - 2), height: bh, rx: 3, fill: color }));
        root.append(svg('text', { x: x + bw / 2 - 1, y: top + ih - bh - 4, 'font-size': 10, 'text-anchor': 'middle', fill: 'var(--ink)' }, v));
      });
    }
  });
  fig.append(root);
  if (series.length > 1 || series[0]?.name) fig.append(h('div', { class: 'row small', style: { justifyContent: 'center' } }, series.map((s, i) => h('span', { class: 'zh' }, h('span', { style: { display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: PALETTE[i % PALETTE.length], marginRight: '4px' } }), s.name))));
  return fig;
}

// choose_component: hiển thị chữ bị khuyết một bộ phận
function componentWord(q, c, chosen) {
  const chars = [...(q.word?.zh || '')];
  const wrap = h('div', { class: 'cc-word' });
  chars.forEach((ch, i) => {
    if (i !== q.target_index) { wrap.append(h('span', { class: 'cc-ch zh-serif' }, ch)); return; }
    const layout = q.layout || 'other';
    wrap.append(h('span', { class: `cc-target ${layout}`, title: 'Chữ cần hoàn thành' },
      c.review ? h('span', { class: 'cc-full zh-serif' }, q.target_char) : [h('span', { class: 'cc-part zh-serif' }, q.shown_part || ''), h('span', { class: `cc-miss zh-serif${chosen ? ' on' : ''}` }, chosen || '?')]));
  });
  return h('div', { class: 'q-body' }, q.word?.pinyin && (c.showPinyin || c.review) ? h('span', { class: 'py' }, q.word.pinyin) : null, wrap);
}

// ---------- Registry ----------
export const TYPES = {
  true_false_image: {
    kind: 'tf',
    render(q, c) {
      return h('div', { class: 'q-body side' }, imageBox(q.image, true),
        h('div', { class: 'stack' }, !c.listening && q.stem ? T(q.stem, c) : null, tfPicker(c, q.answer)));
    },
    grade: (q, a) => ({ correct: typeof a === 'boolean' && a === q.answer }),
    answerText: (q) => (q.answer ? '✓ Đúng' : '✗ Sai'),
  },
  choose_image: {
    kind: 'choice',
    render: (q, c) => h('div', { class: 'q-body' }, q.stem ? T(q.stem, c) : null, choiceList(q.options, c, { layout: 'imgs', answerKey: q.answer })),
    grade: letterGrade,
    answerText: (q) => optText(q.options, q.answer),
  },
  match_image: {
    kind: 'choice',
    render: (q, c) => h('div', { class: 'q-body' }, !c.listening && q.stem ? T(q.stem, c) : null, keyPicker(c.group?.shared_options, c, q.answer)),
    grade: letterGrade,
    answerText: (q, g) => optText(g?.shared_options, q.answer),
  },
  match_sentence: {
    kind: 'choice',
    render: (q, c) => h('div', { class: 'q-body' }, q.stem ? T(q.stem, c) : null, keyPicker(c.group?.shared_options, c, q.answer)),
    grade: letterGrade,
    answerText: (q, g) => optText(g?.shared_options, q.answer),
  },
  fill_blank_wordbank: {
    kind: 'choice',
    render(q, c) {
      const shared = c.group?.shared_options || q.options;
      const chosen = (shared || []).find((o) => o.key === c.value);
      const blank = () => h('span', { class: 'blank' }, chosen ? chosen.text?.zh || chosen.key : ' ');
      return h('div', { class: 'q-body' }, textBlock(q.stem, { pinyin: c.showPinyin || c.review, vi: c.review, blank }), keyPicker(shared, c, q.answer));
    },
    grade: letterGrade,
    answerText: (q, g) => optText(g?.shared_options || q.options, q.answer),
  },
  choose_option: {
    kind: 'choice',
    render(q, c) {
      const showQ = !c.listening || c.review;
      return h('div', { class: 'q-body' },
        q.passage ? h('div', { class: 'card flat', style: { padding: '12px 14px', background: 'var(--card-2)' } }, T(q.passage, c)) : null,
        q.image ? imageBox(q.image, true) : null,
        showQ && q.question ? T(q.question, c, { cls: 'statement' }) : null,
        !q.question ? h('div', { class: 'small muted' }, 'Chọn đáp án phù hợp') : null,
        choiceList(q.options, c, { layout: q.options?.every((o) => !o.text && o.image) ? 'imgs' : 'text', answerKey: q.answer }));
    },
    grade: letterGrade,
    answerText: (q) => optText(q.options, q.answer),
  },
  true_false_statement: {
    kind: 'tf',
    render: (q, c) => h('div', { class: 'q-body' },
      q.passage ? h('div', { class: 'card flat', style: { padding: '12px 14px', background: 'var(--card-2)' } }, T(q.passage, c)) : null,
      T(q.statement, c, { cls: 'statement' }), tfPicker(c, q.answer)),
    grade: (q, a) => ({ correct: typeof a === 'boolean' && a === q.answer }),
    answerText: (q) => (q.answer ? '✓ Đúng' : '✗ Sai'),
  },
  reorder_words: {
    kind: 'input',
    render(q, c) {
      // value: mảng chỉ số các mảnh đã chọn
      const order = Array.isArray(c.value) ? c.value : [];
      const built = h('div', { class: 'tiles built', 'aria-label': 'Câu bạn ghép' });
      const pool = h('div', { class: 'tiles pool', 'aria-label': 'Các mảnh từ' });
      const words = q.words || [];
      order.forEach((idx, pos) => built.append(h('button', { type: 'button', class: 'tile', disabled: c.review, title: 'Bấm để bỏ', onclick: () => c.set(order.filter((_, p) => p !== pos)) }, words[idx])));
      if (!order.length) built.append(h('span', { class: 'muted small', style: { alignSelf: 'center', padding: '0 6px' } }, c.review ? '(chưa làm)' : 'Bấm các mảnh từ bên dưới theo đúng thứ tự…'));
      if (!c.review) words.forEach((w, i) => pool.append(h('button', { type: 'button', class: `tile${order.includes(i) ? ' used' : ''}`, onclick: () => c.set([...order, i]) }, w)));
      return h('div', { class: 'q-body' }, built, c.review ? null : pool,
        !c.review && order.length ? h('div', null, h('button', { type: 'button', class: 'btn sm ghost', onclick: () => c.set([]) }, '↺ Làm lại')) : null);
    },
    grade(q, a) {
      const words = q.words || [];
      const s = normalize((Array.isArray(a) ? a : []).map((i) => words[i]).join(''));
      if (!s) return { correct: false };
      const ok = [q.answer, ...(q.accepted_answers || [])].some((x) => normalize(x) === s);
      return { correct: ok };
    },
    answerText: (q) => q.answer,
    userText: (q, a) => (Array.isArray(a) ? a.map((i) => q.words[i]).join('') : ''),
  },
  write_hanzi_from_pinyin: {
    kind: 'input',
    render(q, c) {
      const blank = () => {
        const inp = h('input', { class: 'blank-input', maxlength: 4, value: c.value || '', disabled: c.review, lang: 'zh-CN', 'aria-label': `Viết chữ Hán cho "${q.blank_pinyin}"`, oninput: () => c.set(inp.value, { silent: true }) });
        return h('span', { class: 'blank-wrap' }, h('span', { class: 'bp py-force' }, q.blank_pinyin), inp);
      };
      return h('div', { class: 'q-body' }, textBlock(q.stem, { pinyin: c.review, vi: c.review, blank }));
    },
    grade: (q, a) => ({ correct: String(a || '').trim() === String(q.answer || '').trim() && !!a }),
    answerText: (q) => q.answer,
  },
  order_sentences: {
    kind: 'input',
    render(q, c) {
      const order = Array.isArray(c.value) ? c.value : [];
      const sents = q.sentences || q.options || [];
      const built = h('div', { class: 'stack' });
      order.forEach((k, pos) => {
        const o = sents.find((s) => s.key === k);
        built.append(h('button', { type: 'button', class: 'choice sel', style: { width: '100%' }, disabled: c.review, onclick: () => c.set(order.filter((_, p) => p !== pos)) }, h('span', { class: 'k' }, pos + 1), T(o?.text, c, { vi: true })));
      });
      const pool = h('div', { class: 'choices text' }, sents.filter((s) => !order.includes(s.key)).map((s) => h('button', { type: 'button', class: 'choice', disabled: c.review, onclick: () => c.set([...order, s.key]) }, h('span', { class: 'k' }, s.key), T(s.text, c, { vi: true }))));
      return h('div', { class: 'q-body' }, h('div', { class: 'small muted' }, 'Bấm các câu theo đúng thứ tự:'), built, c.review ? null : pool);
    },
    grade: (q, a) => ({ correct: Array.isArray(a) && a.join('') === q.answer }),
    answerText: (q) => q.answer,
    userText: (q, a) => (Array.isArray(a) ? a.join('') : ''),
  },
  short_answer: {
    kind: 'input',
    render(q, c) {
      const inp = h('input', { class: 'input zh', value: c.value || '', disabled: c.review, placeholder: q.max_chars ? `Trả lời ngắn (≤ ${q.max_chars} chữ)…` : 'Câu trả lời…', lang: 'zh-CN', oninput: () => c.set(inp.value, { silent: true }) });
      return h('div', { class: 'q-body' },
        q.passage ? h('div', { class: 'card flat', style: { padding: '12px 14px', background: 'var(--card-2)' } }, T(q.passage, c)) : null,
        (q.question || q.stem) ? T(q.question || q.stem, c, { cls: 'statement' }) : null, inp);
    },
    grade(q, a) {
      const s = normalize(a);
      if (!s) return { correct: false };
      const acc = [q.answer, ...(q.accepted_answers || [])].filter((x) => typeof x === 'string');
      const kw = Array.isArray(q.keywords) && q.keywords.length && q.keywords.every((k) => s.includes(normalize(k)));
      const tooLong = q.max_chars && countHan(a) > q.max_chars;
      return { correct: !!(acc.some((x) => normalize(x) === s) || kw) && !tooLong };
    },
    answerText: (q) => [q.answer, ...(q.accepted_answers || [])].filter(Boolean).join(' / '),
  },
  write_sentence: openHandler(),
  write_essay: openHandler({ rows: 8 }),
  picture_story_writing: openHandler({ rows: 8 }),
  chart_description: openHandler({ rows: 7 }),
  translate_written: openHandler({ sourceLabel: 'Dịch sang tiếng Trung / tiếng Việt', placeholder: 'Nhập bản dịch…', rows: 6 }),
  translate_oral: openHandler({ sourceLabel: 'Đọc và dịch miệng (视译)', mic: true, placeholder: 'Bấm "Nói" để dịch miệng, hoặc gõ bản dịch…', rows: 5 }),
};

// ---------- Type HSK 3.0 ----------
TYPES.choose_reply = { ...TYPES.choose_option };
TYPES.choose_component = {
  kind: 'choice',
  render(q, c) {
    const shared = c.group?.shared_options || q.options;
    const chosen = (shared || []).find((o) => o.key === c.value)?.text?.zh;
    const el = componentWord(q, c, chosen);
    el.append(keyPicker(shared, c, q.answer));
    return el;
  },
  grade: letterGrade,
  answerText: (q, g) => `${optText(g?.shared_options || q.options, q.answer)} → ${q.target_char}`,
};
const blankLabel = (q) => `Chỗ trống （${q.blank_no ?? q.no}）`;
TYPES.cloze_option = {
  kind: 'choice',
  render: (q, c) => h('div', { class: 'q-body' }, h('div', { class: 'small muted' }, blankLabel(q)), choiceList(q.options, c, { layout: 'text', answerKey: q.answer })),
  grade: letterGrade,
  answerText: (q) => optText(q.options, q.answer),
  blankText: (q, v) => (q.options || []).find((o) => o.key === v)?.text?.zh,
};
TYPES.cloze_sentence = {
  kind: 'choice',
  render: (q, c) => h('div', { class: 'q-body' }, h('div', { class: 'small muted' }, blankLabel(q)), keyPicker(c.group?.shared_options, c, q.answer)),
  grade: letterGrade,
  answerText: (q, g) => optText(g?.shared_options, q.answer),
  blankText: (q, v) => v,
};
TYPES.order_position = {
  kind: 'choice',
  render: (q, c) => h('div', { class: 'q-body' }, h('div', { class: 'small muted' }, `Vị trí thứ ${q.position ?? '?'}`), keyPicker(c.group?.shared_options, c, q.answer)),
  grade: letterGrade,
  answerText: (q, g) => optText(g?.shared_options, q.answer),
};

// Type lạ: đoán theo cấu trúc, nếu không được → "chưa hỗ trợ"
export function handlerFor(q, group) {
  if (TYPES[q.type]) return TYPES[q.type];
  if (Array.isArray(q.options) && typeof q.answer === 'string') return { ...TYPES.choose_option, guessed: true };
  if (Array.isArray(group?.shared_options) && typeof q.answer === 'string') return { ...TYPES.match_sentence, guessed: true };
  if (typeof q.answer === 'boolean') return { ...TYPES.true_false_statement, guessed: true, render: (qq, c) => h('div', { class: 'q-body' }, qq.statement || qq.stem ? T(qq.statement || qq.stem, c) : null, tfPicker(c, qq.answer)) };
  if (q.answer == null && (q.sample_answers || q.prompt_vi || q.prompt_zh)) return { ...openHandler({ mic: /oral|speak/.test(q.type) }), guessed: true };
  return UNSUPPORTED;
}

export const UNSUPPORTED = {
  kind: 'unsupported',
  render: (q) => h('div', { class: 'unsupported' }, `⚙️ Dạng câu chưa hỗ trợ ("${q.type}"). Câu này không tính điểm.`),
  grade: () => ({ correct: null }),
  answerText: (q) => (typeof q.answer === 'string' ? q.answer : '—'),
};

export const isOpen = (handler) => handler.kind === 'open';
export { shuffle, BLANK };
