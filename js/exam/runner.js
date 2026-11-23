// Bộ chạy bài làm: dùng chung cho Thi thử, Luyện Nghe/Đọc theo phần, Luyện viết.
import { h, clear, toast, confirmDialog, notice, fmtTime, textBlock, imageBox, icon } from '../ui.js';
import { handlerFor, isOpen, fallbackOpen } from './types.js';
import { gradeOpenAI } from './ai-grade.js';
import { playAudio, stopSpeaking, ttsSupported, hasZhVoice } from '../tts.js';
import { hasKey } from '../settings.js';

const CN_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

/**
 * opts: {
 *   sections: [{ id, name_vi, name_zh, max_score, parts: [...] }],
 *   mode: 'exam' | 'practice',
 *   showPinyin: bool, level, timeLimitMin: number|null,
 *   limitPlays: bool, onFinish(result), onRestart(), title
 * }
 */
export function createRunner(root, opts) {
  const answers = new Map();
  const grades = new Map();
  const entries = [];
  const playStats = new Map(); // audio key → số lượt đã nghe
  let submitted = false;
  let onlyWrong = false;
  let timerId = null;
  const startedAt = Date.now();
  const limitSec = opts.timeLimitMin ? opts.timeLimitMin * 60 : null;
  let limitPlays = opts.limitPlays !== false;
  let autoPlaying = null;

  const sectionsEls = [];
  const bar = h('div', { class: 'exam-bar' });
  const resultBox = h('div');
  const body = h('div');
  clear(root).append(bar, resultBox, body);

  // ---------- Index câu hỏi ----------
  let seqNo = 0;
  for (const sec of opts.sections) {
    for (const part of sec.parts || []) {
      for (const group of part.groups || []) {
        for (const q of group.questions || []) {
          const handler = handlerFor(q, group);
          const e = { q, handler, group, part, sec, el: h('div', { class: 'q', id: 'q-' + q.id }), listening: sec.id === 'listening' || !!q.audio && sec.id !== 'reading' };
          e.display = q.is_example ? 'Ví dụ' : (Number.isInteger(q.no) && q.no > 0 ? q.no : ++seqNo);
          entries.push(e);
        }
      }
    }
  }
  const rubricFor = (q) => (opts.rubrics || []).find((r) => r.id === q.rubric_id) || q.rubric || null;
  const scorable = () => entries.filter((e) => !e.q.is_example && e.handler.kind !== 'unsupported');

  // ---------- Audio ----------
  function audioButton(audio, key, label = 'Nghe') {
    const repeat = audio?.repeat || 1;
    const btn = h('button', { type: 'button', class: 'play-btn' });
    const cnt = h('span', { class: 'cnt' });
    const lbl = h('span', null, label);
    btn.append(h('span', { class: 'pi' }, icon('play')), lbl, cnt);
    const refresh = (playing = false, round = 0) => {
      const used = playStats.get(key) || 0;
      const exhausted = limitPlays && !submitted && used >= 1;
      btn.disabled = exhausted && !playing;
      btn.classList.toggle('playing', playing);
      cnt.textContent = playing ? `lượt ${round}/${repeat}` : (exhausted ? 'đã nghe xong' : (repeat > 1 ? `phát ${repeat} lần` : ''));
    };
    btn.play = async () => {
      if (!ttsSupported()) { toast('Trình duyệt không hỗ trợ đọc tiếng Trung (TTS). Hãy dùng Chrome hoặc Edge.', 'err'); return; }
      if (!(await hasZhVoice())) toast('Máy chưa có giọng đọc tiếng Trung (zh-CN). Âm thanh có thể sai. Xem hướng dẫn ở Cài đặt.', 'err');
      playStats.set(key, (playStats.get(key) || 0) + 1);
      refresh(true, 1);
      const ctl = playAudio(audio, { repeat: submitted ? 1 : repeat, onRound: (r) => refresh(true, r) });
      await ctl.promise;
      refresh(false);
    };
    btn.addEventListener('click', () => { if (btn.classList.contains('playing')) { stopSpeaking(); refresh(false); } else btn.play(); });
    btn.refresh = refresh;
    refresh();
    return btn;
  }

  // ---------- Render ----------
  function ctxFor(e) {
    return {
      value: answers.get(e.q.id) ?? null,
      review: submitted || !!e.q.is_example,
      showPinyin: opts.showPinyin !== false,
      group: e.group,
      listening: e.listening,
      set: (v, { silent } = {}) => setAnswer(e, v, silent),
    };
  }

  function setAnswer(e, v, silent) {
    if (submitted) return;
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) answers.delete(e.q.id); else answers.set(e.q.id, v);
    if (!silent) renderQ(e);
    refreshGroup(e.group);
    updateBar();
  }

  function refreshGroup(group) {
    const box = groupEls.get(group);
    if (!box) return;
    const used = new Set(entries.filter((x) => x.group === group).map((x) => (x.q.is_example ? x.q.answer : answers.get(x.q.id))).filter((v) => typeof v === 'string'));
    box.querySelectorAll('.sopt').forEach((el) => el.classList.toggle('used', used.has(el.dataset.key)));
    refreshBlanks(group);
  }

  function renderQ(e) {
    const c = ctxFor(e);
    const { q } = e;
    const g = grades.get(q.id);
    e.el.className = 'q' + (q.is_example ? ' example' : '') + (submitted && g ? (g.correct === true ? ' correct' : g.correct === false ? ' wrong' : '') : '');
    const head = h('div', { class: 'q-head' }, h('span', { class: 'q-no' }, e.display));
    if (q.audio) head.append(audioButton(q.audio, q.id));
    if (submitted && g) {
      if (g.correct === true) head.append(h('span', { class: 'badge jade' }, '✓ Đúng'));
      else if (g.correct === false) head.append(h('span', { class: 'badge red' }, answers.has(q.id) ? '✗ Sai' : '— Bỏ trống'));
      if (g.max != null && isOpen(e.handler)) head.append(h('span', { class: 'badge gold' }, `${g.score}/${g.max} điểm`));
    }
    if (e.handler.guessed) head.append(h('span', { class: 'badge', title: 'Dạng câu mới – hiển thị chung' }, q.type));
    let bodyEl;
    try { bodyEl = e.handler.render(q, c); } catch (err) { console.warn(err); bodyEl = h('div', { class: 'unsupported' }, 'Không hiển thị được câu này (dữ liệu chưa đúng định dạng).'); }
    clear(e.el).append(head, bodyEl);
    if (submitted || q.is_example) e.el.append(reviewBlock(e, g));
    if (submitted && onlyWrong) e.el.hidden = !(g && g.correct === false);
    else e.el.hidden = false;
  }

  function reviewBlock(e, g) {
    const { q } = e;
    const box = h('div', { class: 'review' });
    if (!q.is_example) {
      box.append(h('div', { class: 'rl' }, 'Đáp án'), h('div', { class: 'zh' }, e.handler.answerText(q, e.group)));
      if (e.handler.userText && answers.has(q.id)) box.append(h('div', { class: 'rl' }, 'Bạn trả lời'), h('div', { class: 'zh' }, e.handler.userText(q, answers.get(q.id))));
    }
    const lines = [...(e.group.audio && e.group.questions[0] === q ? e.group.audio.lines : []), ...(q.audio?.lines || [])];
    if (lines.length) {
      box.append(h('div', { class: 'rl' }, 'Lời thoại (transcript)'));
      for (const l of lines) box.append(h('div', { class: 'transcript-line' },
        h('span', { class: `sp ${l.speaker === '男' ? 'm' : l.speaker === '女' ? 'f' : ''}` }, l.speaker),
        h('div', null, l.pinyin ? h('span', { class: 'py py-force', style: { display: 'block' } }, l.pinyin) : null, h('span', { class: 'zh' }, l.text), l.vi ? h('div', { class: 'vi' }, l.vi) : null)));
    }
    if (e.listening && q.question && e.handler.kind !== 'choice') box.append(h('div', { class: 'rl' }, 'Câu hỏi'), textBlock(q.question, { vi: true }));
    if (q.explanation_vi) box.append(h('div', { class: 'rl' }, 'Giải thích'), h('div', null, q.explanation_vi));
    if (g?.ai) {
      box.append(h('div', { class: 'ai-box' },
        h('strong', null, `🤖 AI chấm: ${Math.round(g.ai.score * 10) / 10}/10`),
        g.ai.criteria && Object.keys(g.ai.criteria).length ? h('div', { class: 'small muted' }, Object.entries(g.ai.criteria).map(([k, v]) => `${k}: ${v}`).join(' · ')) : null,
        g.ai.corrected_zh ? h('div', { style: { marginTop: '6px' } }, h('div', { class: 'small muted' }, 'Bản sửa'), g.ai.pinyin ? h('span', { class: 'py', style: { display: 'block' } }, g.ai.pinyin) : null, h('div', { class: 'zh' }, g.ai.corrected_zh)) : null,
        g.ai.feedback_vi ? h('p', { style: { margin: '6px 0 0' } }, g.ai.feedback_vi) : null));
    } else if (g?.fallback) {
      box.append(h('div', { class: 'ai-box' }, h('strong', null, '📝 Chấm sơ bộ: '), g.feedback_vi,
        g.aiError ? h('div', { class: 'small', style: { color: 'var(--wrong)', marginTop: '4px' } }, 'AI chưa chấm được: ' + g.aiError) : null,
        !hasKey() ? h('div', { class: 'small', style: { marginTop: '4px' } }, 'Thêm API key Gemini ở ', h('a', { href: '#/settings' }, 'Cài đặt'), ' để AI chấm chi tiết.') : null));
    }
    return box;
  }

  const groupEls = new Map();
  // Đoạn văn có chỗ trống đánh số （41）→ ô hiển thị đáp án đang chọn
  function passageBlock(group) {
    const t = group.passage;
    const showPy = opts.showPinyin !== false || submitted;
    const zh = h('div', { class: 'zh', lang: 'zh-CN' });
    String(t.zh || '').split(/(（\d+）)/).forEach((part) => {
      const m = /^（(\d+)）$/.exec(part);
      if (m) zh.append(h('span', { class: 'cloze-blank', 'data-no': m[1] }, h('b', null, m[1]), h('span', { class: 'cv' }, '\u00a0'))); else zh.append(document.createTextNode(part));
    });
    return h('div', { class: 'text-block' }, showPy && t.pinyin ? h('span', { class: 'py' }, t.pinyin) : null, zh, submitted && t.vi ? h('span', { class: 'vi' }, t.vi) : null);
  }
  function refreshBlanks(group) {
    const box = groupEls.get(group);
    if (!box) return;
    box.querySelectorAll('.cloze-blank').forEach((el) => {
      const n = Number(el.dataset.no);
      const e = entries.find((x) => x.group === group && (x.q.blank_no ?? x.q.no) === n);
      if (!e) return;
      const v = e.q.is_example || submitted ? (answers.get(e.q.id) ?? (e.q.is_example ? e.q.answer : null)) : answers.get(e.q.id);
      const txt = v != null ? (e.handler.blankText ? e.handler.blankText(e.q, v, group) : v) : null;
      el.querySelector('.cv').textContent = txt || '\u00a0';
      el.classList.toggle('filled', !!txt);
      const g = grades.get(e.q.id);
      el.classList.toggle('ok', submitted && g?.correct === true);
      el.classList.toggle('bad', submitted && g?.correct === false);
      el.onclick = () => e.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  function renderAll() {
    clear(body);
    sectionsEls.length = 0;
    for (const sec of opts.sections) {
      const secEl = h('section', { class: 'exam-section', id: 'sec-' + sec.id });
      if (opts.sections.length > 1) secEl.append(h('div', { class: 'section-title' }, h('h2', null, sec.name_vi, ' ', h('span', { class: 'zh muted', style: { fontSize: '.8em' } }, sec.name_zh || ''))));
      (sec.parts || []).forEach((part, pi) => {
        const partEl = h('div', { class: 'part' },
          h('div', { class: 'part-head' },
            h('span', { class: 'part-no', title: part.code }, CN_NUM[pi] || pi + 1),
            h('div', null,
              h('h3', null, `Phần ${pi + 1}`, part.code ? h('span', { class: 'badge', style: { marginLeft: '8px', verticalAlign: '2px' } }, part.code) : null),
              h('div', null, part.instruction_vi || ''),
              part.instruction_zh ? h('div', { class: 'zhi' }, part.instruction_zh) : null)));
        for (const group of part.groups || []) {
          const gEl = h('div', { class: 'group' });
          groupEls.set(group, gEl);
          if (group.audio) gEl.append(h('div', { class: 'row', style: { marginBottom: '12px' } }, audioButton(group.audio, 'g:' + group.id, 'Nghe đoạn hội thoại')));
          if (group.passage) gEl.append(h('div', { class: 'card flat passage', style: { marginBottom: '14px', background: 'var(--card-2)' } }, passageBlock(group)));
          if (Array.isArray(group.shared_options) && group.shared_options.length) {
            const isImg = group.shared_options.every((o) => o.image && !o.text);
            gEl.append(h('div', { class: `shared-opts${isImg ? '' : ' text'}` }, group.shared_options.map((o) =>
              h('div', { class: 'sopt', 'data-key': o.key }, h('span', { class: 'k' }, o.key),
                o.image ? imageBox(o.image) : null,
                o.text ? textBlock(o.text, { pinyin: opts.showPinyin !== false || submitted, vi: submitted }) : null))));
          }
          for (const e of entries.filter((x) => x.group === group)) { renderQ(e); gEl.append(e.el); }
          partEl.append(gEl);
          refreshGroup(group);
        }
        secEl.append(partEl);
      });
      sectionsEls.push(secEl);
      body.append(secEl);
    }
  }

  // ---------- Thanh công cụ ----------
  const timerEl = h('span', { class: 'timer', role: 'timer', 'aria-live': 'off' });
  const countEl = h('span', { class: 'small muted' });
  function updateBar() {
    const total = scorable().length;
    const done = scorable().filter((e) => answers.has(e.q.id)).length;
    countEl.textContent = `Đã làm ${done}/${total}`;
  }
  function tick() {
    const el = (Date.now() - startedAt) / 1000;
    if (limitSec) {
      const left = limitSec - el;
      timerEl.textContent = '⏱ ' + fmtTime(left);
      timerEl.classList.toggle('low', left < 300);
      if (left <= 0) { toast('Hết giờ! Bài được nộp tự động.', 'err'); submit(true); }
    } else timerEl.textContent = '⏱ ' + fmtTime(el);
  }
  function buildBar() {
    clear(bar);
    if (!submitted) {
      bar.append(timerEl, countEl);
      if (opts.sections.length > 1) bar.append(h('div', { class: 'sec-tabs' }, opts.sections.map((s) => h('button', { type: 'button', onclick: () => document.getElementById('sec-' + s.id)?.scrollIntoView({ behavior: 'smooth' }) }, s.name_vi))));
      const hasAudio = entries.some((e) => e.q.audio || e.group.audio);
      if (hasAudio) {
        const ap = h('button', { type: 'button', class: 'btn sm', onclick: () => autoPlay(ap) }, '▶ Phát tự động phần nghe');
        bar.append(ap);
        if (opts.mode === 'practice') bar.append(h('label', { class: 'small', style: { display: 'inline-flex', gap: '6px', alignItems: 'center' } },
          h('input', { type: 'checkbox', checked: limitPlays, onchange: (ev) => { limitPlays = ev.target.checked; body.querySelectorAll('.play-btn').forEach((b) => b.refresh && b.refresh()); } }), 'Giới hạn lượt nghe'));
      }
      bar.append(h('span', { class: 'grow' }), h('button', { type: 'button', class: 'btn primary', onclick: () => submit(false) }, 'Nộp bài'));
      updateBar(); tick();
    } else {
      bar.append(h('strong', null, 'Xem lại bài làm'),
        h('div', { class: 'tabs', style: { margin: 0 } },
          h('button', { class: onlyWrong ? '' : 'on', onclick: () => { onlyWrong = false; buildBar(); entries.forEach(renderQ); } }, 'Tất cả'),
          h('button', { class: onlyWrong ? 'on' : '', onclick: () => { onlyWrong = true; buildBar(); entries.forEach(renderQ); } }, 'Chỉ câu sai')),
        h('span', { class: 'grow' }),
        opts.onRestart ? h('button', { type: 'button', class: 'btn', onclick: opts.onRestart }, '↺ Làm lại') : null);
    }
  }

  async function autoPlay(btn) {
    if (autoPlaying) { autoPlaying.stop = true; stopSpeaking(); btn.textContent = '▶ Phát tự động phần nghe'; autoPlaying = null; return; }
    const me = { stop: false }; autoPlaying = me;
    btn.textContent = '■ Dừng phát tự động';
    const buttons = [...body.querySelectorAll('.play-btn')];
    for (const b of buttons) {
      if (me.stop || submitted) break;
      if (b.disabled) continue;
      b.closest('.q, .group')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await b.play();
      if (!me.stop) await new Promise((r) => setTimeout(r, 4000)); // thời gian chọn đáp án
    }
    if (autoPlaying === me) { autoPlaying = null; btn.textContent = '▶ Phát tự động phần nghe'; }
  }

  // ---------- Nộp & chấm ----------
  async function submit(force) {
    if (submitted) return;
    const left = scorable().filter((e) => !answers.has(e.q.id)).length;
    if (!force && left > 0 && !(await confirmDialog('Nộp bài?', `Bạn còn ${left} câu chưa làm. Câu bỏ trống sẽ tính sai.`, 'Nộp bài'))) return;
    if (!force && left === 0 && !(await confirmDialog('Nộp bài?', 'Bạn chắc chắn muốn nộp bài?', 'Nộp bài'))) return;
    submitted = true;
    clearInterval(timerId);
    if (autoPlaying) autoPlaying.stop = true;
    stopSpeaking();
    // chấm câu khách quan + chấm sơ bộ câu mở
    for (const e of scorable()) {
      const a = answers.get(e.q.id);
      try { grades.set(e.q.id, e.handler.grade(e.q, a)); } catch { grades.set(e.q.id, { correct: false }); }
    }
    const open = scorable().filter((e) => isOpen(e.handler) && answers.has(e.q.id));
    clear(resultBox);
    if (open.length && hasKey()) {
      const prog = h('span', null, `0/${open.length}`);
      resultBox.append(h('div', { class: 'card', style: { marginBottom: '16px' } }, h('span', { class: 'spinner' }), ' AI đang chấm câu tự luận… ', prog));
      let done = 0;
      for (const e of open) {
        try { grades.set(e.q.id, await gradeOpenAI(e.q, answers.get(e.q.id), { level: opts.level, rubric: rubricFor(e.q) })); }
        catch (err) { const fb = fallbackOpen(e.q, answers.get(e.q.id)); fb.aiError = err.message; grades.set(e.q.id, fb); }
        prog.textContent = `${++done}/${open.length}`;
      }
    }
    const result = computeResult();
    showResult(result);
    buildBar();
    renderAll();
    resultBox.scrollIntoView({ behavior: 'smooth' });
    try { opts.onFinish && opts.onFinish(result); } catch (err) { console.warn(err); }
  }

  // Điểm section = round(max_score × điểm đạt / tổng điểm tối đa); câu khách quan = 1 điểm, câu chủ quan = max_points.
  function computeResult() {
    const secs = opts.sections.map((sec) => {
      const list = scorable().filter((e) => e.sec === sec);
      let earned = 0, possible = 0, correct = 0, subj = 0;
      for (const e of list) {
        const g = grades.get(e.q.id) || {};
        const open = isOpen(e.handler);
        const pts = e.q.max_points || (open ? (g.max || 10) : 1);
        possible += pts;
        if (open) { subj++; earned += Math.min(pts, Number(g.score) || 0); } else if (g.correct === true) { earned += pts; correct++; }
      }
      const max = Number.isFinite(sec.max_score) ? sec.max_score : 100;
      const score = possible ? Math.round((max * earned) / possible) : 0;
      return { id: sec.id, name: sec.name_vi, score, max, correct, total: list.length - subj, subj };
    });
    const total = secs.reduce((s, x) => s + x.score, 0);
    const maxTotal = secs.reduce((s, x) => s + x.max, 0);
    const objective = scorable().filter((e) => !isOpen(e.handler));
    const correctAll = objective.filter((e) => grades.get(e.q.id)?.correct === true).length;
    let band = null;
    if (opts.scoreMode === 'bands') {
      const avg = secs.length ? secs.reduce((s, x) => s + (100 * x.score) / (x.max || 100), 0) / secs.length : 0;
      const bands = [...(opts.bandRules?.bands || [])].sort((a, b) => a.min - b.min);
      const hit = bands.filter((b) => avg >= b.min).pop();
      band = { avg: Math.round(avg * 10) / 10, label: hit?.label_vi || '—', official: opts.bandRules?.official === true };
    }
    return {
      date: new Date().toISOString(),
      durationSec: Math.round((Date.now() - startedAt) / 1000),
      sections: secs, total, maxTotal, correct: correctAll, count: objective.length,
      pass: opts.scoreMode !== 'bands' && opts.passScore != null ? total >= opts.passScore : null,
      passScore: opts.passScore ?? null,
      band,
      wrong: scorable().filter((e) => grades.get(e.q.id)?.correct === false).map((e) => e.q.id),
    };
  }

  function showResult(r) {
    clear(resultBox);
    const pct = r.maxTotal ? Math.round((100 * r.total) / r.maxTotal) : 0;
    resultBox.append(h('div', { class: 'card result-hero', style: { marginBottom: '18px' } },
      h('div', { class: 'muted small' }, opts.title || 'Kết quả'),
      h('div', { class: 'score' }, r.total, h('small', null, ` / ${r.maxTotal}`)),
      r.band ? h('div', null, h('div', { class: 'result-stamp pass', style: { color: 'var(--red)' } }, r.band.label),
        h('p', { class: 'muted', style: { margin: '4px 0' } }, `Điểm trung bình các kỹ năng: ${r.band.avg}/100`),
        !r.band.official ? notice('warn', '⚠️', 'Xếp bậc HSK 7–9 ở đây là ƯỚC LƯỢNG, KHÔNG CHÍNH THỨC (ngưỡng do web tạm đặt).') : null)
      : r.pass != null
        ? h('div', { class: `result-stamp ${r.pass ? 'pass' : 'fail'}` }, r.pass ? '合格 ĐẠT' : '不合格 CHƯA ĐẠT')
        : h('div', { class: 'muted' }, `Đúng ${r.correct}/${r.count} câu · ${pct}%`),
      r.pass != null ? h('p', { class: 'muted' }, `Điểm đạt: ${r.passScore} · Đúng ${r.correct}/${r.count} câu trắc nghiệm · Thời gian ${fmtTime(r.durationSec)}`) : h('p', { class: 'muted' }, `Thời gian ${fmtTime(r.durationSec)}`),
      r.sections.length > 1 || r.pass != null || r.band ? h('div', { class: 'sec-scores' }, r.sections.map((s) => h('div', { class: 'sec-score' },
        h('div', { class: 'small muted' }, s.name), h('b', null, s.score), h('span', { class: 'muted' }, ` / ${s.max}`),
        h('div', { class: 'progress', style: { marginTop: '6px' } }, h('i', { style: { width: `${(100 * s.score) / (s.max || 1)}%` } })),
        h('div', { class: 'small muted', style: { marginTop: '4px' } }, `${s.correct}/${s.total} câu đúng${s.subj ? ` + ${s.subj} câu tự luận` : ''}`)))) : null,
      opts.extraResult ? opts.extraResult(r) : null,
      !hasKey() && scorable().some((e) => isOpen(e.handler)) ? h('div', { style: { marginTop: '14px', textAlign: 'left' } }, notice('warn', '💡', 'Câu tự luận đang được chấm sơ bộ (không AI). Thêm API key Gemini miễn phí ở ', h('a', { href: '#/settings' }, 'Cài đặt'), ' để được chấm và nhận xét chi tiết.')) : null));
  }

  // ---------- Khởi động ----------
  buildBar();
  renderAll();
  if (!entries.length) body.append(notice('warn', '📭', 'Phần này chưa có câu hỏi.'));
  timerId = setInterval(tick, 1000);

  return {
    destroy() { clearInterval(timerId); if (autoPlaying) autoPlaying.stop = true; stopSpeaking(); },
    submit: () => submit(true),
    get submitted() { return submitted; },
    _answers: answers,
  };
}
