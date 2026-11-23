// Hội thoại AI theo chủ đề (Gemini).
import { h, clear, pageHead, notice, toast, icon, emptyState } from '../ui.js';
import { getSpeaking, levelKey, sameLevel } from '../data.js';
import { hasKey } from '../settings.js';
import { generate, chatSystemPrompt } from '../gemini.js';
import { speak, stopSpeaking } from '../tts.js';
import { startRecognition, recognitionSupported, SR_UNSUPPORTED_MSG } from '../speech.js';
import { updateProgress } from '../storage.js';
import { dataProblem, levelName } from './common.js';

export async function render(root, params, ctx) {
  root.append(pageHead('Nói', '对话', 'Hội thoại với AI', 'Chọn một chủ đề. AI sẽ đóng vai và nói chuyện với bạn bằng tiếng Trung đúng trình độ.'));
  let data;
  try { data = await getSpeaking('topics'); } catch (e) { root.append(dataProblem(e, 'Chủ đề hội thoại')); return; }
  if (!ctx.isCurrent()) return;
  const topics = data.topics || [];
  let level = ctx.level;
  const body = h('div');
  root.append(body);
  let cleanupChat = null;

  const pick = () => {
    cleanupChat?.(); cleanupChat = null;
    clear(body);
    if (!hasKey()) body.append(h('div', { style: { marginBottom: '16px' } }, notice('warn', '🔑', 'Tính năng này cần API key Gemini miễn phí. ', h('a', { href: '#/settings' }, 'Hướng dẫn lấy key trong 1 phút →'))));
    body.append(h('div', { class: 'level-strip' }, ctx.levels.map((l) => h('button', { class: `level-chip${levelKey(l) === String(level) ? ' on' : ''}`, onclick: () => { level = levelKey(l); pick(); } }, l.name_vi))));
    const list = topics.filter((t) => sameLevel(t.level, level));
    if (!list.length) { body.append(emptyState('话', `Chưa có chủ đề cho ${levelName(ctx, level)}.`)); return; }
    body.append(h('div', { class: 'grid c3' }, list.map((t) => h('button', { class: 'card topic-card', onclick: () => { cleanupChat = chat(body, t, ctx, pick); } },
      h('div', { class: 'tzh' }, t.title_zh),
      h('h3', { style: { margin: '4px 0' } }, t.title_vi),
      h('p', { class: 'small muted', style: { margin: 0 } }, t.scenario_vi),
      h('div', { class: 'vocab-chips', style: { marginTop: '10px' } }, (t.key_vocab || []).slice(0, 4).map((v) => h('span', { class: 'badge' }, v.hanzi)))))));
  };
  pick();
  return () => cleanupChat?.();
}

function chat(root, topic, ctx, back) {
  clear(root);
  const history = []; // {role:'model'|'user', data}
  let showVi = false;
  let autoSpeak = true;
  let busy = false;
  let rec = null;
  let userTurns = 0;
  const maxTurns = topic.max_turns || 10;
  const log = h('div', { class: 'chat-log', 'aria-live': 'polite' });
  const input = h('textarea', { class: 'textarea zh', rows: 1, placeholder: 'Nói hoặc gõ tiếng Trung…', lang: 'zh-CN', 'aria-label': 'Câu trả lời của bạn' });
  const micBtn = h('button', { class: 'btn round rec', title: 'Nói', 'aria-label': 'Bấm để nói' }, icon('mic'));
  const sendBtn = h('button', { class: 'btn round primary', 'aria-label': 'Gửi' }, icon('send'));
  const box = h('div', { class: 'card chat-box' }, log, h('div', { class: 'chat-input' }, micBtn, input, sendBtn));
  if (!hasKey()) { input.disabled = true; sendBtn.disabled = true; micBtn.disabled = true; }
  const fbBox = h('div');
  const side = h('aside', { class: 'card stack' },
    h('button', { class: 'btn sm ghost', onclick: back }, '‹ Đổi chủ đề'),
    h('div', null, h('div', { class: 'tzh zh-serif', style: { color: 'var(--red)', fontWeight: 700 } }, topic.title_zh), h('h3', { style: { margin: '2px 0 6px' } }, topic.title_vi), h('p', { class: 'small', style: { margin: 0 } }, topic.scenario_vi)),
    topic.ai_role_vi ? h('div', { class: 'small' }, h('strong', null, 'AI đóng vai: '), topic.ai_role_vi) : null,
    h('div', null, h('div', { class: 'small muted' }, 'Mục tiêu'), h('ul', { class: 'small', style: { margin: '4px 0 0', paddingLeft: '18px' } }, (topic.goals_vi || []).map((g) => h('li', null, g)))),
    h('div', null, h('div', { class: 'small muted', style: { marginBottom: '6px' } }, 'Từ vựng gợi ý (chạm để nghe & chèn)'),
      h('div', { class: 'vocab-chips' }, (topic.key_vocab || []).map((v) => h('button', { class: 'vchip', onclick: () => { speak(v.hanzi).catch(() => {}); input.value += v.hanzi; input.focus(); } }, h('span', { class: 'py' }, v.pinyin), h('span', { class: 'zh' }, v.hanzi), h('span', { class: 'small muted' }, v.vi))))),
    h('div', { class: 'stack small' },
      h('label', null, h('input', { type: 'checkbox', onchange: (e) => { showVi = e.target.checked; box.classList.toggle('hide-vi', !showVi); } }), ' Hiện dịch tiếng Việt'),
      h('label', null, h('input', { type: 'checkbox', checked: true, onchange: (e) => { autoSpeak = e.target.checked; } }), ' AI tự đọc to')),
    h('button', { class: 'btn ink', disabled: !hasKey(), onclick: () => feedback() }, '📝 Sửa lỗi cho tôi'),
    fbBox);
  box.classList.add('hide-vi');
  root.append(h('div', { class: 'chat-shell' }, side, h('div', null,
    !hasKey() ? h('div', { style: { marginBottom: '12px' } }, notice('warn', '🔑', 'Chưa có API key — bạn chỉ xem được câu mở đầu. ', h('a', { href: '#/settings' }, 'Thêm key'))) : null,
    !recognitionSupported() ? h('div', { style: { marginBottom: '12px' } }, notice('warn', '🎙', SR_UNSUPPORTED_MSG)) : null,
    box)));

  function aiMsg(d) {
    const el = h('div', { class: 'msg ai' },
      h('div', { class: 'who' }, topic.ai_role_vi || 'AI', h('button', { class: 'btn ghost sm', style: { minHeight: '24px', padding: '0 6px' }, 'aria-label': 'Nghe lại', onclick: () => speak(d.zh, { speaker: '女' }).catch(() => {}) }, icon('speaker'))),
      h('div', { class: 'bubble' }, d.pinyin ? h('span', { class: 'py' }, d.pinyin) : null, h('div', { class: 'zh', lang: 'zh-CN' }, d.zh), d.vi ? h('span', { class: 'vi' }, d.vi) : null));
    log.append(el); log.scrollTop = log.scrollHeight;
    if (autoSpeak) speak(d.zh, { speaker: '女' }).catch(() => {});
  }
  function userMsg(text) {
    const corr = h('div');
    const el = h('div', { class: 'msg me' }, h('div', { class: 'who' }, 'Bạn'), h('div', { class: 'bubble' }, h('div', { class: 'zh', lang: 'zh-CN' }, text)), corr);
    log.append(el); log.scrollTop = log.scrollHeight;
    return corr;
  }
  const typing = () => { const t = h('div', { class: 'msg ai' }, h('div', { class: 'bubble' }, h('span', { class: 'typing' }, h('i'), h('i'), h('i')))); log.append(t); log.scrollTop = log.scrollHeight; return t; };

  // câu mở đầu
  history.push({ role: 'model', data: { zh: topic.starter.zh, pinyin: topic.starter.pinyin, vi: topic.starter.vi, correction_vi: null } });
  aiMsg(topic.starter);

  async function send() {
    const text = input.value.trim();
    if (!text || busy) return;
    if (!hasKey()) { toast('Cần API key Gemini – vào Cài đặt.', 'err'); return; }
    stopSpeaking();
    busy = true; sendBtn.disabled = true;
    input.value = '';
    const corrBox = userMsg(text);
    history.push({ role: 'user', data: text });
    userTurns++;
    const t = typing();
    try {
      // Gemini yêu cầu lượt đầu là user → thêm lượt mở đầu giả
      const contents = [{ role: 'user', parts: [{ text: '（开始对话）' }] }, ...history.map((m) => ({ role: m.role, parts: [{ text: m.role === 'model' ? JSON.stringify(m.data) : m.data }] }))];
      const sys = chatSystemPrompt(topic, levelName(ctx, topic.level)) + (userTurns >= maxTurns ? '\nCuộc hội thoại sắp kết thúc: hãy chào tạm biệt tự nhiên.' : '');
      const r = await generate({ system: sys, contents, temperature: 0.8 });
      t.remove();
      const d = { zh: String(r.zh || '').trim() || '……', pinyin: r.pinyin || '', vi: r.vi || '', correction_vi: r.correction_vi || null };
      if (d.correction_vi && d.correction_vi !== 'null') corrBox.append(h('div', { class: 'correction' }, '✏️ ', d.correction_vi));
      history.push({ role: 'model', data: d });
      aiMsg(d);
      if (userTurns === maxTurns) log.append(h('div', { class: 'small muted', style: { textAlign: 'center' } }, `Bạn đã nói ${maxTurns} lượt 🎉 Bấm "Sửa lỗi cho tôi" để nhận nhận xét tổng kết.`));
      updateProgress((p) => { p.chat.messages++; if (userTurns === 1) p.chat.sessions++; });
    } catch (e) {
      t.remove();
      history.pop(); userTurns--;
      log.append(h('div', null, notice('err', '⚠️', e.message)));
      input.value = text;
    }
    busy = false; sendBtn.disabled = false;
    log.scrollTop = log.scrollHeight;
  }

  async function feedback() {
    const mine = history.filter((m) => m.role === 'user').map((m) => m.data);
    if (!mine.length) { toast('Hãy nói vài câu trước đã nhé!'); return; }
    clear(fbBox).append(h('p', { class: 'small' }, h('span', { class: 'spinner' }), ' AI đang xem lại các câu của bạn…'));
    try {
      const transcript = history.map((m) => (m.role === 'user' ? `Học viên: ${m.data}` : `AI: ${m.data.zh}`)).join('\n');
      const r = await generate({ prompt: `Bạn là giáo viên tiếng Trung cho người Việt (trình độ HSK ${topic.level}). Đây là đoạn hội thoại luyện nói:\n${transcript}\n\nHãy nhận xét các câu của HỌC VIÊN bằng tiếng Việt. Trả về JSON: {"score": số 0-10, "summary_vi": "nhận xét chung ngắn", "mistakes": [{"you": "câu học viên", "better": "câu sửa tiếng Trung", "pinyin": "pinyin câu sửa", "note_vi": "giải thích lỗi"}], "tips_vi": ["mẹo 1", "mẹo 2"]}`, temperature: 0.3 });
      clear(fbBox).append(h('div', { class: 'ai-box' },
        h('strong', null, `Điểm: ${r.score ?? '—'}/10`), h('p', { style: { margin: '4px 0' } }, r.summary_vi || ''),
        (r.mistakes || []).map((m) => h('div', { style: { borderTop: '1px dashed var(--line-2)', paddingTop: '6px', marginTop: '6px' } },
          h('div', { class: 'zh small', style: { textDecoration: 'line-through', opacity: 0.7 } }, m.you), h('div', { class: 'zh' }, '→ ', m.better), m.pinyin ? h('div', { class: 'py' }, m.pinyin) : null, h('div', { class: 'small' }, m.note_vi))),
        (r.tips_vi || []).length ? h('ul', { class: 'small', style: { paddingLeft: '18px', margin: '6px 0 0' } }, r.tips_vi.map((x) => h('li', null, x))) : null));
    } catch (e) { clear(fbBox).append(notice('err', '⚠️', e.message)); }
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  micBtn.addEventListener('click', async () => {
    if (!recognitionSupported()) { toast(SR_UNSUPPORTED_MSG, 'err'); return; }
    if (rec) { rec.stop(); return; }
    stopSpeaking();
    micBtn.classList.add('on');
    const base = input.value;
    rec = startRecognition({ onInterim: (t) => { input.value = base + t; } });
    try {
      const t = await rec.promise;
      input.value = base + t;
      if (t) send();
    } catch (e) { toast(e.message, 'err'); }
    rec = null; micBtn.classList.remove('on');
  });
  return () => { rec?.abort(); stopSpeaking(); };
}
