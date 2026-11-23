// Shadowing: nghe mẫu (TTS hoặc YouTube) → nhại theo → ghi âm, nhận dạng, tô màu chữ đúng/sai.
import { h, clear, pageHead, notice, toast, icon, emptyState, confirmDialog, loadScript } from '../ui.js';
import { generate, aiAvailable, sharedAvailable, ytSearch } from '../gemini.js';
import { getSpeaking, sameLevel, levelKey } from '../data.js';
import { load, save, updateProgress, pushLimited } from '../storage.js';
import { speak, stopSpeaking, ttsSupported } from '../tts.js';
import { getSettings } from '../settings.js';
import { startCapture, recognitionSupported, recorderSupported, SR_UNSUPPORTED_MSG } from '../speech.js';
import { matchRatio, markChars } from '../compare.js';
import { dataProblem } from './common.js';

const USER_KEY = 'shadowing:user';
export const loadUser = () => { const v = load(USER_KEY, []); return Array.isArray(v) ? v : []; };
const saveUser = (items) => save(USER_KEY, items);
// Câu do AI tạo cho từng video (theo videoId) — không gọi AI lại lần sau
const AI_KEY = 'shadowing:ai';
const loadAI = () => { const v = load(AI_KEY, {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; };
const saveAI = (m) => save(AI_KEY, m);

export function parseClock(s) {
  const t = String(s || '').trim();
  if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
  const m = /^(?:(\d+):)?(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/.exec(t);
  return m ? (Number(m[1] || 0) * 3600 + Number(m[2]) * 60 + Number(m[3])) : null;
}
export const fmtClock = (sec) => { sec = Math.max(0, Math.round(sec)); const m = Math.floor(sec / 60), s = sec % 60; return `${m}:${String(s).padStart(2, '0')}`; };

// Gemini nghe video YouTube (file_data) và chia câu shadowing
export function cleanSegments(raw, from, to) {
  let segs = (Array.isArray(raw) ? raw : []).map((x) => ({ start: Number(x.start), end: Number(x.end), hanzi: String(x.hanzi || '').trim(), pinyin: String(x.pinyin || '').trim(), vi: String(x.vi || '').trim() }))
    .filter((x) => x.hanzi && /[\u3400-\u9fff]/.test(x.hanzi) && Number.isFinite(x.start) && Number.isFinite(x.end) && x.end > x.start);
  // Một số model trả mốc tính từ đầu đoạn cắt → cộng thêm `from`
  if (from > 0 && segs.length && segs.every((x) => x.end <= to - from + 3) && Math.min(...segs.map((x) => x.start)) < from - 1) segs = segs.map((x) => ({ ...x, start: x.start + from, end: x.end + from }));
  segs = segs.map((x) => ({ ...x, start: Math.round(x.start * 10) / 10, end: Math.round(Math.min(x.end, x.start + 20) * 10) / 10 })).sort((a, b) => a.start - b.start).slice(0, 40);
  return segs;
}

async function aiSegments(videoId, from, to) {
  const prompt = [
    `Đây là một video YouTube. Hãy nghe phần lời nói tiếng Trung (Quan thoại) từ giây ${from} đến giây ${to}.`,
    'Chia lời nói thành các câu ngắn, mỗi câu dài 3–12 giây, phù hợp để người Việt luyện shadowing (nhại theo). Tối đa 40 câu.',
    'Với mỗi câu ghi: start, end = số giây (số thực) TÍNH TỪ ĐẦU VIDEO; hanzi = đúng lời nói, chữ giản thể, có dấu câu; pinyin = pinyin có dấu thanh; vi = dịch tiếng Việt tự nhiên.',
    'Mốc thời gian phải khớp chính xác lúc câu bắt đầu và kết thúc được nói. Không bịa nội dung không có trong video.',
    'Nếu đoạn video không có lời nói tiếng Trung hoặc bạn không xem được video, trả về segments rỗng và giải thích ngắn bằng tiếng Việt trong error_vi.',
    'Trả về DUY NHẤT JSON: {"title": "tiêu đề ngắn tiếng Việt", "segments": [{"start": 12.3, "end": 16.8, "hanzi": "…", "pinyin": "…", "vi": "…"}], "error_vi": null}',
  ].join('\n');
  const contents = [{ role: 'user', parts: [
    { fileData: { fileUri: `https://www.youtube.com/watch?v=${videoId}` }, videoMetadata: { startOffset: `${Math.floor(from)}s`, endOffset: `${Math.ceil(to)}s` } },
    { text: prompt },
  ] }];
  let r;
  try { r = await generate({ contents, temperature: 0.2, maxTokens: 16384 }); }
  catch (e) {
    const m = e.message || '';
    if (/private|not found|unavailable|could not|cannot access|invalid.*(url|uri)|INVALID_ARGUMENT.*(file|uri)/i.test(m)) throw new Error('AI không mở được video này (video riêng tư, bị giới hạn hoặc không tồn tại). Hãy thử video công khai khác.');
    if (/token|too (long|large)|exceed|limit/i.test(m) && e.status !== 429) throw new Error('Đoạn video quá dài so với hạn mức AI. Hãy chọn đoạn ngắn hơn (khoảng 1–3 phút).');
    throw e;
  }
  const segs = cleanSegments(Array.isArray(r) ? r : r?.segments, from, to);
  if (!segs.length) throw new Error(r?.error_vi || 'AI không tìm thấy lời nói tiếng Trung trong đoạn này. Hãy chọn đoạn khác hoặc video khác.');
  return { segments: segs, title: r?.title };
}

export function parseYouTube(input) {
  const s = String(input || '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const pats = [/youtu\.be\/([A-Za-z0-9_-]{11})/, /[?&]v=([A-Za-z0-9_-]{11})/, /\/shorts\/([A-Za-z0-9_-]{11})/, /\/embed\/([A-Za-z0-9_-]{11})/, /\/live\/([A-Za-z0-9_-]{11})/];
  for (const p of pats) { const m = p.exec(s); if (m) return m[1]; }
  return null;
}

let ytReady = null;
function loadYT() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!ytReady) ytReady = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev && prev(); resolve(window.YT); };
    loadScript('https://www.youtube.com/iframe_api').catch((e) => { ytReady = null; reject(e); });
    setTimeout(() => { if (!window.YT?.Player) { ytReady = null; reject(new Error('timeout')); } }, 15000);
  });
  return ytReady;
}
const YT_ERR = { 2: 'Mã video không hợp lệ.', 5: 'Trình duyệt không phát được video này.', 100: 'Video không tồn tại hoặc đã bị xóa/đặt riêng tư.', 101: 'Chủ video không cho phép nhúng vào trang khác.', 150: 'Chủ video không cho phép nhúng vào trang khác.' };

export async function render(root, params, ctx) {
  root.append(pageHead('Nói', '跟读', 'Shadowing – nhại theo', 'Nghe một câu mẫu, nói theo ngay, máy sẽ so sánh và tô màu chữ bạn nói đúng/sai. Có thể tự thêm video YouTube yêu thích.'));
  let data = { items: [] }; let err = null;
  try { data = await getSpeaking('shadowing'); } catch (e) { err = e; }
  if (!ctx.isCurrent()) return;
  if (!recognitionSupported()) root.append(h('div', { style: { marginBottom: '14px' } }, notice('warn', '🎙', SR_UNSUPPORTED_MSG)));
  const body = h('div');
  root.append(body);
  let filterLevel = 'all';
  let showUnverified = false;
  let cleanup = null;

  const ytItem = (meta) => ({ id: 'yt-' + meta.videoId, level: meta.level ?? (/^\d+$/.test(String(ctx.level)) ? Number(ctx.level) : ctx.level), title: meta.title || 'Video YouTube', source: 'youtube', youtube: { videoId: meta.videoId, verified: false, channel: meta.channel || '', url: `https://www.youtube.com/watch?v=${meta.videoId}` }, segments: [] });
  const openItem = (it) => {
    cleanup?.(); cleanup = null;
    if (it.source === 'youtube' && !(it.segments || []).length) { const cached = loadAI()[it.youtube.videoId]; if (cached?.segments?.length) it = cached; else { workspace(it); return; } }
    cleanup = player(body, it, listView, { onEdit: (x) => editor(x, true), onRegen: it.source === 'youtube' ? () => workspace(it, true) : null });
  };

  const listView = () => {
    cleanup?.(); cleanup = null;
    clear(body);
    if (err) body.append(h('div', { style: { marginBottom: '14px' } }, dataProblem(err, 'Bài shadowing có sẵn')));
    const all = data.items || [];
    const levels = [...new Set(all.map((i) => String(i.level)))];
    body.append(h('div', { class: 'row between', style: { marginBottom: '12px' } },
      h('div', { class: 'level-strip', style: { margin: 0 } },
        h('button', { class: `level-chip${filterLevel === 'all' ? ' on' : ''}`, onclick: () => { filterLevel = 'all'; listView(); } }, 'Tất cả'),
        ctx.levels.filter((l) => levels.some((x) => sameLevel(x, levelKey(l)))).map((l) => h('button', { class: `level-chip${filterLevel === levelKey(l) ? ' on' : ''}`, onclick: () => { filterLevel = levelKey(l); listView(); } }, l.name_vi))),
      h('button', { class: 'btn primary', onclick: () => editor(null) }, '+ Tự soạn bài')));
    const byLevel = (it) => filterLevel === 'all' || sameLevel(it.level, filterLevel);

    // 1) Tìm / dán video
    body.append(searchCard());

    // 2) Thư viện video
    const vids = all.filter((it) => it.source === 'youtube' && it.youtube?.videoId && (it.youtube.verified === true || showUnverified)).filter(byLevel);
    body.append(h('div', { class: 'section-title' }, h('h2', null, 'Thư viện video')));
    body.append(h('label', { class: 'small', style: { display: 'block', marginBottom: '12px' } }, h('input', { type: 'checkbox', checked: showUnverified, onchange: (e) => { showUnverified = e.target.checked; listView(); } }), ' Hiện cả video chưa xác minh'));
    body.append(vids.length ? h('div', { class: 'grid c3' }, vids.map((it) => videoCard({ videoId: it.youtube.videoId, title: it.title, channel: it.youtube.channel, level: it.level, count: (it.segments || []).length, unverified: it.youtube.verified === false }, () => openItem(it))))
      : h('p', { class: 'muted' }, 'Chưa có video cho bộ lọc này — hãy tìm hoặc dán link YouTube ở trên.'));

    // 3) Bài của tôi + video đã tạo câu bằng AI
    const mine = loadUser();
    const ai = Object.values(loadAI());
    if (mine.length || ai.length) {
      body.append(h('div', { class: 'section-title' }, h('h2', null, 'Bài của tôi')));
      body.append(h('div', { class: 'grid c3' }, mine.map((it) => itemCard(it, 'mine')), ai.map((it) => itemCard(it, 'ai'))));
    }
    // 4) Bài giọng máy
    const tts = all.filter((it) => it.source !== 'youtube').filter(byLevel);
    body.append(h('div', { class: 'section-title' }, h('h2', null, 'Bài giọng máy đọc')));
    body.append(tts.length ? h('div', { class: 'grid c3' }, tts.map((it) => itemCard(it, null))) : emptyState('影', 'Chưa có bài cho bộ lọc này.'));
  };

  const videoCard = (v, onOpen) => h('button', { class: 'card vcard', onclick: onOpen },
    h('div', { class: 'thumb' }, h('img', { src: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`, alt: '', loading: 'lazy', onerror: (e) => { e.target.style.visibility = 'hidden'; } }), h('span', { class: 'play' }, '▶')),
    h('div', { class: 'vbody' },
      h('div', { class: 'row', style: { gap: '6px' } }, v.level != null ? h('span', { class: 'badge red' }, `HSK ${v.level}`) : null, v.count ? h('span', { class: 'badge' }, `${v.count} câu`) : h('span', { class: 'badge gold' }, 'chưa có câu'), v.unverified ? h('span', { class: 'badge gold' }, 'chưa xác minh') : null),
      h('div', { class: 'vtitle' }, v.title),
      v.channel ? h('div', { class: 'small muted' }, v.channel) : null));

  const SUGGEST = { 1: ['HSK 1 听力', '中文 慢速 对话 初级', '学中文 儿歌'], 2: ['HSK 2 听力', '中文 慢速 对话', '学中文 日常用语'], 3: ['HSK 3 听力', '中文 慢速 对话', '中文 日常 口语'], 4: ['HSK 4 听力', '中文 日常 对话', '中文 vlog 字幕'], 5: ['HSK 5 听力', '中文 新闻 慢速', '中文 播客'], 6: ['HSK 6 听力', '中文 新闻', '中文 访谈'], '7-9': ['中文 新闻联播', '中文 演讲', '中文 纪录片'] };
  let lastQuery = ''; let lastResults = null; let lastErr = null;
  function searchCard() {
    const lv = filterLevel === 'all' ? String(ctx.level) : filterLevel;
    const sugg = SUGGEST[lv] || SUGGEST[3];
    const input = h('input', { class: 'input', type: 'search', value: lastQuery, placeholder: 'Tìm video tiếng Trung, vd: HSK 3 听力', 'aria-label': 'Tìm video YouTube' });
    const results = h('div');
    const ytLink = (q) => h('a', { class: 'btn', href: `https://www.youtube.com/results?search_query=${encodeURIComponent(q || sugg[0])}`, target: '_blank', rel: 'noopener' }, '↗ Mở tìm kiếm trên YouTube');
    const fallback = (msg) => { clear(results).append(notice('warn', '🔎', h('div', null, msg, ' Bạn vẫn có thể tìm trên YouTube rồi dán link vào ô bên dưới.', h('div', { style: { marginTop: '8px' } }, ytLink(input.value.trim()))))); };
    const drawResults = () => {
      clear(results);
      if (lastErr) return fallback(lastErr);
      if (!lastResults) return;
      if (!lastResults.length) { results.append(h('p', { class: 'muted' }, 'Không tìm thấy video phù hợp.')); return; }
      results.append(h('div', { class: 'grid c3', style: { marginTop: '12px' } }, lastResults.map((r) => videoCard({ videoId: r.videoId, title: r.title, channel: r.channel }, () => openItem(ytItem(r))))));
    };
    const run = async (q) => {
      q = (q || input.value).trim(); if (!q) return;
      input.value = q; lastQuery = q;
      if (!sharedAvailable()) { lastErr = null; fallback('Tìm video ngay trong web cần máy trung gian AI của chủ web (chưa cấu hình).'); return; }
      clear(results).append(h('p', { class: 'small' }, h('span', { class: 'spinner' }), ' Đang tìm…'));
      try { lastResults = await ytSearch(q, 12); lastErr = null; }
      catch (e) { lastResults = null; lastErr = e.code === 'NO_YOUTUBE_KEY' ? 'Máy trung gian chưa bật tìm video YouTube.' : e.message; }
      drawResults();
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
    const paste = h('input', { class: 'input', placeholder: 'Dán link: youtube.com/watch?v=…, youtu.be/…, /shorts/…', 'aria-label': 'Dán link YouTube' });
    const openPaste = () => {
      const id = parseYouTube(paste.value);
      if (!id) { toast('Không đọc được mã video từ link này', 'err'); return; }
      const lib = (data.items || []).find((x) => x.youtube?.videoId === id);
      openItem(lib || ytItem({ videoId: id }));
    };
    paste.addEventListener('keydown', (e) => { if (e.key === 'Enter') openPaste(); });
    drawResults();
    return h('div', { class: 'card' },
      h('h2', { style: { marginBottom: '10px' } }, '🔎 Chọn video YouTube'),
      h('div', { class: 'row', style: { flexWrap: 'nowrap' } }, input, h('button', { class: 'btn primary', onclick: () => run() }, 'Tìm')),
      h('div', { class: 'vocab-chips', style: { marginTop: '8px' } }, h('span', { class: 'small muted', style: { alignSelf: 'center' } }, 'Gợi ý:'), sugg.map((q) => h('button', { class: 'vchip', onclick: () => run(q) }, h('span', { class: 'zh' }, q)))),
      results,
      h('div', { class: 'row', style: { flexWrap: 'nowrap', marginTop: '14px' } }, paste, h('button', { class: 'btn', onclick: openPaste }, 'Mở video')),
      h('p', { class: 'hint' }, 'Video chưa có câu luyện? Web sẽ giúp bạn tạo câu shadowing bằng AI từ lời nói trong video.'));
  }

  const itemCard = (it, kind) => h('div', { class: 'card topic-card', style: { cursor: 'default' } },
    h('div', { class: 'row between' }, h('div', { class: 'row', style: { gap: '6px' } },
      h('span', { class: `badge ${it.source === 'youtube' ? 'red' : 'blue'}` }, it.source === 'youtube' ? '▶ YouTube' : '🔊 Giọng đọc'),
      it.level ? h('span', { class: 'badge' }, `HSK ${it.level}`) : null,
      kind === 'ai' ? h('span', { class: 'badge gold' }, '🤖 AI tạo câu') : null)),
    h('h3', { style: { margin: '10px 0 4px' } }, it.title),
    h('div', { class: 'small muted' }, `${(it.segments || []).length} câu${it.youtube?.channel ? ' · ' + it.youtube.channel : ''}`),
    h('div', { class: 'zh small', style: { margin: '6px 0 10px', color: 'var(--ink-2)' } }, it.segments?.[0]?.hanzi || ''),
    h('div', { class: 'row' }, h('button', { class: 'btn primary sm', onclick: () => openItem(it) }, 'Luyện'),
      kind ? h('button', { class: 'btn sm', onclick: () => editor(it, kind === 'ai') }, 'Sửa') : null,
      kind ? h('button', { class: 'btn sm ghost danger', onclick: async () => {
        if (!(await confirmDialog('Xóa bài này?', it.title, 'Xóa', true))) return;
        if (kind === 'ai') { const a = loadAI(); delete a[it.youtube.videoId]; saveAI(a); } else saveUser(loadUser().filter((x) => x.id !== it.id));
        listView();
      } }, 'Xóa') : null));

  // ---------- Video chưa có câu → tạo bằng AI ----------
  const workspace = (it, regen = false) => {
    cleanup?.(); cleanup = null;
    clear(body);
    const id = it.youtube.videoId;
    const holder = h('div');
    const status = h('div', { 'aria-live': 'polite' });
    let yt = null;
    const fromIn = h('input', { class: 'input', value: '0:00', style: { width: '90px' }, 'aria-label': 'Bắt đầu' });
    const toIn = h('input', { class: 'input', value: '3:00', style: { width: '90px' }, 'aria-label': 'Kết thúc' });
    const now = (inp) => { try { inp.value = fmtClock(yt.getCurrentTime()); } catch { toast('Trình phát chưa sẵn sàng'); } };
    const go = async (btn) => {
      const a = parseClock(fromIn.value), b = parseClock(toIn.value);
      if (a == null || b == null || b <= a) { toast('Thời gian không hợp lệ (dạng phút:giây, kết thúc > bắt đầu)', 'err'); return; }
      if (b - a > 600) { toast('Hãy chọn đoạn tối đa 10 phút (khuyến nghị 2–5 phút).', 'err'); return; }
      btn.disabled = true;
      clear(status).append(h('p', null, h('span', { class: 'spinner' }), ` AI đang nghe video (${fmtClock(a)}–${fmtClock(b)}) và chia câu… có thể mất 20–60 giây.`));
      try {
        const res = await aiSegments(id, a, b);
        const item = { ...it, id: 'ai-' + id, title: it.title && it.title !== 'Video YouTube' ? it.title : (res.title || 'Video YouTube'), segments: res.segments, ai: { from: a, to: b, date: new Date().toISOString() } };
        const all = loadAI(); all[id] = item; saveAI(all);
        toast(`Đã tạo ${res.segments.length} câu`, 'ok');
        cleanup?.(); cleanup = player(body, item, listView, { onEdit: (x) => editor(x, true), onRegen: () => workspace(item, true) });
      } catch (e) { clear(status).append(notice('err', '⚠️', e.message)); btn.disabled = false; }
    };
    body.append(h('div', { class: 'row', style: { marginBottom: '12px' } }, h('button', { class: 'btn sm ghost', onclick: listView }, '‹ Quay lại'), h('strong', null, it.title)),
      h('div', { class: 'grid c2' },
        h('div', null, h('div', { class: 'yt-wrap' }, holder), it.youtube.channel ? h('p', { class: 'small muted' }, it.youtube.channel) : null),
        h('div', { class: 'card stack' },
          h('h3', null, regen ? '🤖 Tạo lại câu bằng AI' : '🤖 Video này chưa có câu luyện'),
          h('p', { class: 'small', style: { margin: 0 } }, 'AI sẽ nghe lời nói tiếng Trung trong video, chia thành câu ngắn 3–12 giây kèm chữ Hán, pinyin, nghĩa tiếng Việt và mốc thời gian. Video dài: hãy chọn một đoạn 2–5 phút.'),
          h('div', { class: 'row' }, h('label', { class: 'small' }, 'Từ ', fromIn), h('button', { class: 'btn sm', title: 'Lấy thời điểm đang phát', onclick: () => now(fromIn) }, '⏱'), h('label', { class: 'small' }, 'đến ', toIn), h('button', { class: 'btn sm', title: 'Lấy thời điểm đang phát', onclick: () => now(toIn) }, '⏱')),
          aiAvailable() ? h('button', { class: 'btn primary', onclick: (e) => go(e.currentTarget) }, '🤖 Tạo câu shadowing bằng AI')
            : notice('warn', '🔑', 'Cần AI (API key Gemini hoặc máy trung gian) để tạo câu. ', h('a', { href: '#/settings' }, 'Vào Cài đặt')),
          status,
          h('div', { class: 'small muted' }, 'Hoặc ', h('button', { class: 'btn sm ghost', onclick: () => editor({ ...it, segments: [] }) }, 'tự nhập câu và mốc thời gian'), '.'))));
    loadYT().then((YT) => { yt = new YT.Player(holder, { videoId: id, playerVars: { playsinline: 1, rel: 0 }, events: { onError: (e) => status.append(notice('err', '⚠️', YT_ERR[e.data] || 'Video lỗi.')) } }); })
      .catch(() => status.append(notice('err', '⚠️', 'Không tải được trình phát YouTube (cần Internet).')));
    cleanup = () => { try { yt?.destroy(); } catch { /* */ } };
  };

  // ---------- Trình soạn bài người dùng ----------
  const editor = (item, fromAI = false) => {
    cleanup?.(); cleanup = null;
    clear(body);
    const it = item ? JSON.parse(JSON.stringify(item)) : { id: 'user-' + Date.now().toString(36), level: Number(ctx.level) || ctx.level, title: '', source: 'youtube', youtube: { videoId: '', verified: true, channel: '', url: '' }, segments: [] };
    const title = h('input', { class: 'input', value: it.title, placeholder: 'Ví dụ: Phim hoạt hình – tập 1' });
    const url = h('input', { class: 'input', value: it.youtube?.url || '', placeholder: 'Dán link: youtube.com/watch?v=…, youtu.be/…, youtube.com/shorts/…' });
    const src = h('select', { class: 'select' }, h('option', { value: 'youtube', selected: it.source === 'youtube' }, 'Video YouTube'), h('option', { value: 'tts', selected: it.source === 'tts' }, 'Chỉ văn bản (máy đọc)'));
    const lvl = h('select', { class: 'select' }, ctx.levels.map((l) => h('option', { value: levelKey(l), selected: String(it.level) === levelKey(l) }, l.name_vi)));
    const ytBox = h('div', { style: { marginBottom: '12px' } });
    const segBox = h('div', { class: 'stack' });
    let yt = null;
    const loadPreview = async () => {
      const id = parseYouTube(url.value);
      clear(ytBox);
      if (src.value !== 'youtube') return;
      if (!id) { if (url.value.trim()) ytBox.append(notice('err', '⚠️', 'Không đọc được mã video từ link này.')); return; }
      const holder = h('div');
      ytBox.append(h('div', { class: 'yt-wrap' }, holder), h('p', { class: 'hint' }, 'Phát video, dừng ở đầu/cuối câu rồi bấm "⏱" để lấy thời điểm.'));
      try { const YT = await loadYT(); yt = new YT.Player(holder, { videoId: id, playerVars: { playsinline: 1, rel: 0 }, events: { onError: (e) => ytBox.append(notice('err', '⚠️', YT_ERR[e.data] || 'Video lỗi.')) } }); }
      catch { ytBox.append(notice('err', '⚠️', 'Không tải được trình phát YouTube (cần Internet, hoặc bị chặn).')); }
    };
    url.addEventListener('change', loadPreview);
    src.addEventListener('change', () => { drawSegs(); loadPreview(); });
    const now = () => { try { return Math.round(yt.getCurrentTime() * 10) / 10; } catch { toast('Trình phát chưa sẵn sàng'); return null; } };
    const drawSegs = () => {
      clear(segBox);
      const isYT = src.value === 'youtube';
      it.segments.forEach((sg, i) => {
        const f = (k, ph, cls = '') => h('input', { class: `input ${cls}`, value: sg[k] ?? '', placeholder: ph, oninput: (e) => { sg[k] = e.target.value; } });
        const tnum = (k) => h('div', { class: 'row', style: { flexWrap: 'nowrap', gap: '4px' } },
          h('input', { class: 'input', type: 'number', step: '0.1', min: 0, value: sg[k] ?? '', placeholder: k === 'start' ? 'Bắt đầu (giây)' : 'Kết thúc (giây)', style: { width: '120px' }, oninput: (e) => { sg[k] = e.target.value === '' ? null : Number(e.target.value); } }),
          h('button', { class: 'btn sm', type: 'button', title: 'Lấy thời điểm hiện tại của video', onclick: () => { const t = now(); if (t != null) { sg[k] = t; drawSegs(); } } }, '⏱'));
        segBox.append(h('div', { class: 'card flat', style: { padding: '12px' } },
          h('div', { class: 'row between', style: { marginBottom: '8px' } }, h('strong', null, `Câu ${i + 1}`), h('button', { class: 'btn sm ghost danger', onclick: () => { it.segments.splice(i, 1); drawSegs(); } }, 'Xóa câu')),
          isYT ? h('div', { class: 'row', style: { marginBottom: '8px' } }, tnum('start'), tnum('end')) : null,
          h('div', { class: 'stack' }, f('hanzi', 'Chữ Hán (bắt buộc)', 'zh'), f('pinyin', 'Pinyin (tùy chọn)'), f('vi', 'Nghĩa tiếng Việt (tùy chọn)'))));
      });
      segBox.append(h('button', { class: 'btn', onclick: () => { const last = it.segments[it.segments.length - 1]; it.segments.push({ start: isYT ? (last?.end ?? 0) : null, end: null, hanzi: '', pinyin: '', vi: '' }); drawSegs(); } }, '+ Thêm câu'));
    };
    body.append(h('div', { class: 'card' },
      h('div', { class: 'row between' }, h('h2', { style: { margin: 0 } }, item?.segments?.length ? 'Sửa bài / mốc thời gian' : 'Soạn bài shadowing'), h('button', { class: 'btn ghost sm', onclick: listView }, '‹ Quay lại')),
      h('div', { class: 'grid c2', style: { marginTop: '14px' } },
        h('label', { class: 'field' }, h('span', null, 'Tên bài'), title),
        h('div', { class: 'row' }, h('label', { class: 'field grow' }, h('span', null, 'Nguồn'), src), h('label', { class: 'field grow' }, h('span', null, 'Cấp'), lvl))),
      h('label', { class: 'field' }, h('span', null, 'Link YouTube'), url),
      ytBox, h('h3', null, 'Các câu'), segBox,
      h('div', { class: 'row end', style: { marginTop: '16px' } },
        h('button', { class: 'btn ghost', onclick: listView }, 'Hủy'),
        h('button', { class: 'btn primary', onclick: () => {
          it.title = title.value.trim() || 'Bài của tôi';
          it.source = src.value;
          it.level = /^\d+$/.test(lvl.value) ? Number(lvl.value) : lvl.value;
          if (it.source === 'youtube') {
            const id = parseYouTube(url.value);
            if (!id) { toast('Link YouTube không hợp lệ', 'err'); return; }
            it.youtube = { videoId: id, verified: true, channel: '', url: url.value.trim() };
          } else it.youtube = null;
          it.segments = it.segments.filter((s) => (s.hanzi || '').trim()).map((s) => ({ ...s, hanzi: s.hanzi.trim(), start: it.source === 'youtube' ? Number(s.start) || 0 : null, end: it.source === 'youtube' ? Number(s.end) || null : null }));
          if (!it.segments.length) { toast('Cần ít nhất 1 câu có chữ Hán', 'err'); return; }
          if (it.source === 'youtube' && it.segments.some((s) => !(s.end > s.start))) { toast('Mỗi câu cần thời điểm kết thúc lớn hơn bắt đầu', 'err'); return; }
          if (fromAI && it.source === 'youtube') {
            const a = loadAI(); a[it.youtube.videoId] = { ...it, id: 'ai-' + it.youtube.videoId }; saveAI(a);
          } else {
            if (!String(it.id).startsWith('user-')) it.id = 'user-' + Date.now().toString(36);
            const all = loadUser().filter((x) => x.id !== it.id);
            all.unshift(it); saveUser(all);
          }
          toast('Đã lưu bài', 'ok'); listView();
        } }, 'Lưu bài'))));
    if (!it.segments.length) it.segments.push({ start: it.source === 'youtube' ? 0 : null, end: null, hanzi: '', pinyin: '', vi: '' });
    drawSegs(); loadPreview();
    cleanup = () => { try { yt?.destroy(); } catch { /* */ } };
  };

  listView();
  return () => cleanup?.();
}

// ---------- Trình luyện ----------
function player(root, item, back, { onEdit, onRegen } = {}) {
  clear(root);
  const segs = item.segments || [];
  let idx = 0;
  let loops = 1;
  let speed = 1;
  let showVi = true;
  let yt = null; let ytOk = false; let ytTimer = null;
  let capture = null;
  let lastRec = null;
  let playing = false;
  const scores = {};
  const isYT = item.source === 'youtube' && item.youtube?.videoId;

  const stage = h('div', { class: 'card shadow-stage' });
  const list = h('div', { class: 'seg-list' });
  const ytBox = h('div', { style: { marginBottom: '16px' } });
  root.append(h('div', { class: 'row', style: { marginBottom: '12px' } }, h('button', { class: 'btn sm ghost', onclick: back }, '‹ Danh sách bài'), h('strong', { class: 'grow' }, item.title),
      onEdit && item.source === 'youtube' ? h('button', { class: 'btn sm', onclick: () => { stopAll(); onEdit(item); } }, '✏️ Sửa mốc thời gian') : null,
      onRegen ? h('button', { class: 'btn sm ghost', onclick: () => { stopAll(); onRegen(); } }, '🤖 Tạo lại bằng AI') : null),
    isYT ? ytBox : null,
    h('div', { class: 'char-layout' }, stage, h('div', null, h('div', { class: 'small muted', style: { marginBottom: '8px' } }, 'Các câu'), list)));

  if (isYT) {
    const holder = h('div');
    ytBox.append(h('div', { class: 'yt-wrap' }, holder));
    loadYT().then((YT) => {
      yt = new YT.Player(holder, {
        videoId: item.youtube.videoId, playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => { ytOk = true; },
          onError: (e) => { ytOk = false; ytBox.append(h('div', { style: { marginTop: '8px' } }, notice('err', '⚠️', (YT_ERR[e.data] || 'Video không phát được.') + ' Bạn có thể bấm "Nghe mẫu" để nghe bằng giọng máy thay thế.'))); },
        },
      });
    }).catch(() => ytBox.append(notice('err', '⚠️', 'Không tải được trình phát YouTube. Kiểm tra mạng; tạm thời dùng giọng máy đọc.')));
  }

  const stopAll = () => { stopSpeaking(); clearInterval(ytTimer); playing = false; try { yt?.pauseVideo?.(); } catch { /* */ } };

  async function playModel() {
    if (playing) { stopAll(); drawStage(); return; }
    const sg = segs[idx];
    playing = true; drawStage();
    const total = loops === 0 ? Infinity : loops;
    if (isYT && ytOk && sg.start != null && sg.end > sg.start) {
      let n = 0;
      try { yt.setPlaybackRate(speed); } catch { /* */ }
      const startOnce = () => { yt.seekTo(sg.start, true); yt.playVideo(); };
      startOnce();
      clearInterval(ytTimer);
      ytTimer = setInterval(() => {
        let t = 0; try { t = yt.getCurrentTime(); } catch { /* */ }
        if (t >= sg.end) {
          n++;
          if (n < total && playing) { yt.pauseVideo(); setTimeout(() => playing && startOnce(), 700); } else { yt.pauseVideo(); clearInterval(ytTimer); playing = false; drawStage(); }
        }
      }, 80);
      return;
    }
    if (!ttsSupported()) { toast('Trình duyệt không hỗ trợ đọc văn bản.', 'err'); playing = false; drawStage(); return; }
    const rate = (Number(getSettings().rate) || 0.9) * speed;
    for (let n = 0; n < total && playing; n++) {
      try { await speak(sg.hanzi, { speaker: sg.speaker || '女', rate }); } catch (e) { toast(e.message, 'err'); break; }
      if (n < total - 1) await new Promise((r) => setTimeout(r, 700));
    }
    playing = false; drawStage();
  }

  async function record() {
    if (capture) {
      const c = capture; capture = null;
      drawStage(true);
      const { audio, text, error } = await c.stop();
      if (audio) lastRec = audio;
      if (error) toast(error.message, 'err');
      const sg = segs[idx];
      if (text) {
        const score = Math.round(matchRatio(sg.hanzi, text) * 100);
        scores[idx] = { score, text };
        updateProgress((p) => pushLimited(p.shadowing, { id: item.id, title: `${item.title} – câu ${idx + 1}`, score, date: new Date().toISOString() }));
      } else if (!error && recognitionSupported()) toast('Không nhận ra câu nói. Hãy nói to, rõ hơn.', 'err');
      drawStage(); drawList();
      return;
    }
    stopAll();
    if (!recognitionSupported() && !recorderSupported()) { toast(SR_UNSUPPORTED_MSG, 'err'); return; }
    try {
      capture = await startCapture({ continuous: true, onInterim: (t) => { const el = stage.querySelector('.interim'); if (el) el.textContent = t; } });
      if (capture.recorderError) toast(capture.recorderError.message, 'err');
      drawStage();
      const sg = segs[idx];
      const limit = Math.max(6000, [...sg.hanzi].length * 650 + 4000);
      const me = capture;
      setTimeout(() => { if (capture === me) record(); }, limit);
    } catch (e) { toast(e.message, 'err'); capture = null; }
  }

  const playRec = () => { if (!lastRec) return; const a = new Audio(lastRec.url); a.play().catch(() => toast('Không phát được bản ghi', 'err')); return a; };
  const compare = async () => {
    await playModel();
    if (lastRec) { const a = playRec(); if (a) await new Promise((r) => { a.onended = r; }); }
  };

  function drawStage(processing = false) {
    const sg = segs[idx];
    clear(stage);
    if (!sg) { stage.append(emptyState('影', 'Bài này chưa có câu nào.')); return; }
    const sc = scores[idx];
    const big = h('div', { class: 'big', lang: 'zh-CN' });
    if (sc) markChars(sg.hanzi, sc.text).forEach((m) => big.append(h('span', { class: m.punct ? '' : m.ok ? 'ch-ok' : 'ch-bad' }, m.ch)));
    else big.textContent = sg.hanzi;
    stage.append(
      h('div', { class: 'phase' }, `Câu ${idx + 1} / ${segs.length}`),
      sg.pinyin ? h('span', { class: 'py' }, sg.pinyin) : null, big,
      showVi && sg.vi ? h('div', { class: 'vi' }, sg.vi) : null,
      capture ? h('div', { style: { marginTop: '14px' } }, h('div', { class: 'wave', 'aria-hidden': 'true' }, Array.from({ length: 9 }, () => h('i'))), h('div', { class: 'interim zh muted' }, ''), h('div', { class: 'small muted' }, 'Đang nghe… nói xong bấm Dừng')) : null,
      processing ? h('p', { class: 'small' }, h('span', { class: 'spinner' }), ' Đang xử lý…') : null,
      sc ? h('div', { class: 'match-meter', style: { marginTop: '14px' } }, h('div', { class: 'ring', style: { '--p': sc.score, '--c': sc.score >= 80 ? 'var(--jade)' : sc.score >= 50 ? 'var(--gold)' : 'var(--wrong)' } }, h('span', null, `${sc.score}%`)),
        h('div', { style: { textAlign: 'left' } }, h('div', null, sc.score >= 90 ? 'Xuất sắc! 👏' : sc.score >= 70 ? 'Tốt lắm!' : sc.score >= 50 ? 'Khá – luyện thêm nhé' : 'Thử lại chậm hơn'), h('div', { class: 'small muted zh' }, `Máy nghe được: ${sc.text}`))) : null,
      h('div', { class: 'controls' },
        h('button', { class: 'btn primary', onclick: playModel }, icon(playing ? 'stop' : 'play'), playing ? 'Dừng' : 'Nghe mẫu'),
        h('button', { class: `btn rec${capture ? ' on' : ''}`, onclick: record, disabled: processing }, icon(capture ? 'stop' : 'mic'), capture ? 'Dừng' : 'Nói theo'),
        h('button', { class: 'btn', disabled: !lastRec, onclick: playRec }, '▶ Nghe lại giọng tôi'),
        h('button', { class: 'btn', disabled: !lastRec, onclick: compare }, '⇄ So sánh')),
      h('div', { class: 'controls' },
        h('label', null, 'Lặp', h('select', { class: 'select', onchange: (e) => { loops = Number(e.target.value); } }, [[1, '1 lần'], [2, '2 lần'], [3, '3 lần'], [5, '5 lần'], [0, '∞']].map(([v, l]) => h('option', { value: v, selected: v === loops }, l)))),
        h('label', null, 'Tốc độ', h('select', { class: 'select', onchange: (e) => { speed = Number(e.target.value); } }, [0.5, 0.75, 0.9, 1, 1.25].map((v) => h('option', { value: v, selected: v === speed }, `${v}×`)))),
        h('label', null, h('input', { type: 'checkbox', checked: showVi, onchange: (e) => { showVi = e.target.checked; drawStage(); } }), ' Nghĩa'),
        h('button', { class: 'btn sm', disabled: idx === 0, onclick: () => go(idx - 1) }, '‹ Trước'),
        h('button', { class: 'btn sm', disabled: idx >= segs.length - 1, onclick: () => go(idx + 1) }, 'Tiếp ›')));
  }
  const go = (i) => { stopAll(); if (capture) { capture.cancel(); capture = null; } idx = i; lastRec = null; drawStage(); drawList(); };
  function drawList() {
    clear(list);
    segs.forEach((sg, i) => list.append(h('button', { class: `seg${i === idx ? ' on' : ''}`, onclick: () => go(i) },
      h('span', { class: 'n' }, i + 1),
      h('span', null, h('span', { class: 'zh' }, sg.hanzi), scores[i] ? h('span', { class: `badge ${scores[i].score >= 80 ? 'jade' : scores[i].score >= 50 ? 'gold' : 'red'}`, style: { marginLeft: '8px' } }, `${scores[i].score}%`) : null,
        isYT && sg.start != null ? h('span', { class: 'small muted', style: { display: 'block' } }, `${sg.start}s – ${sg.end}s`) : null))));
  }
  drawStage(); drawList();
  return () => { stopAll(); capture?.cancel(); try { yt?.destroy(); } catch { /* */ } };
}
