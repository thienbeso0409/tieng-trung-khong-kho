import { h, clear } from '../ui.js';
import { getVocab, getAllExams, levelKey, getCharacters } from '../data.js';
import { getProgress } from '../storage.js';
import { setSettings, hasKey } from '../settings.js';
import { levelStats } from '../srs.js';
import { levelName } from './common.js';

const SKILLS = [
  { zh: '听', zhname: '听力', title: 'Nghe', href: (l) => `#/listening/${l}`, items: ['Làm đề theo dạng HSK', 'Giọng nam/nữ, nghe 2 lần', 'Transcript + giải thích'] },
  { zh: '说', zhname: '口语', title: 'Nói', href: () => '#/speaking', items: ['Trò chuyện với AI', 'Shadowing video YouTube', 'Thi nói – AI chấm điểm'] },
  { zh: '读', zhname: '阅读', title: 'Đọc', href: (l) => `#/reading/${l}`, items: ['Bài đọc theo dạng HSK', 'Bật/tắt pinyin', 'Chấm điểm tức thì'] },
  { zh: '写', zhname: '书写', title: 'Viết', href: (l) => `#/writing/chars/${l}`, items: ['Thứ tự nét từng chữ', 'Tập viết trên 田字格', 'Bài viết HSK – AI chấm'] },
];

export async function render(root, params, ctx) {
  const lv = ctx.level;
  const p = getProgress();
  const statsBox = h('div', { class: 'stats' }, h('div', { class: 'stat' }, h('b', null, '…'), h('span', null, 'Đang tải tiến độ')));
  const examsBox = h('div', { class: 'grid c3' });

  root.append(
    h('section', { class: 'hero' },
      h('span', { class: 'bigzh', 'aria-hidden': 'true' }, '不难'),
      h('div', { class: 'kicker small', style: { color: '#f08a74', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '8px' } }, 'Luyện thi HSK 3.0 · 9 cấp · 4 kỹ năng'),
      h('h1', null, 'Tiếng Trung ', h('em', null, 'không khó'), '.'),
      h('p', null, 'Học từ vựng bằng thẻ ghi nhớ, luyện nghe – nói – đọc – viết đúng dạng đề HSK, trò chuyện với AI và thi thử có chấm điểm. Miễn phí, chạy ngay trên trình duyệt.'),
      h('div', { class: 'row' },
        h('a', { class: 'btn primary lg', href: `#/vocab/${encodeURIComponent(lv)}` }, 'Học từ vựng ' + levelName(ctx, lv)),
        h('a', { class: 'btn lg', href: '#/exam' }, 'Thi thử'))),
  );

  // Chọn cấp
  root.append(h('div', { class: 'section-title' }, h('h2', null, 'Bạn đang học cấp nào?')));
  const strip = h('div', { class: 'level-strip' });
  const drawStrip = (cur) => {
    clear(strip);
    for (const l of ctx.levels) {
      const k = levelKey(l);
      strip.append(h('button', { class: `level-chip${k === cur ? ' on' : ''}`, onclick: () => { setSettings({ level: k }); ctx.navigate('#/'); } },
        l.name_vi || `HSK ${k}`, h('small', null, tierOf(k))));
    }
  };
  drawStrip(String(lv));
  root.append(strip);

  // Kỹ năng
  root.append(h('div', { class: 'grid c4' },
    SKILLS.map((s) => h('a', { class: 'card skill-card', href: s.href(encodeURIComponent(lv)) },
      h('span', { class: 'glyph', 'aria-hidden': 'true' }, s.zh),
      h('div', { class: 'zhname' }, s.zhname),
      h('h3', null, s.title),
      h('ul', null, s.items.map((i) => h('li', null, i)))))));

  // Tiến độ
  root.append(h('div', { class: 'section-title' }, h('h2', null, `Tiến độ ${levelName(ctx, lv)}`)));
  root.append(h('div', { class: 'card' }, statsBox));

  if (!hasKey()) root.append(h('div', { class: 'card flat', style: { marginTop: '16px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' } },
    h('span', { style: { fontSize: '1.8rem' } }, '🤖'),
    h('div', { class: 'grow' }, h('strong', null, 'Bật tính năng AI miễn phí'), h('div', { class: 'small muted' }, 'Dán API key Gemini (lấy miễn phí trong 1 phút) để trò chuyện với AI, được chấm bài nói và bài viết.')),
    h('a', { class: 'btn', href: '#/settings' }, 'Hướng dẫn lấy key')));

  root.append(h('div', { class: 'section-title' }, h('h2', null, 'Đề thi thử')));
  root.append(examsBox);

  // Tải dữ liệu nền
  const exams = (await getAllExams().catch(() => [])).filter((e) => String(e.level) === String(lv));
  if (!ctx.isCurrent()) return;
  if (!exams.length) examsBox.append(h('p', { class: 'muted' }, 'Chưa có đề cho cấp này. ', h('a', { href: '#/exam' }, 'Xem đề các cấp khác')));
  for (const e of exams) {
    const best = p.exams.filter((r) => r.examId === e.id).sort((a, b) => b.total - a.total)[0];
    examsBox.append(h('div', { class: 'card exam-card' },
      h('div', { class: 'meta' }, h('span', { class: 'badge red' }, e.levelName || `HSK ${e.level}`), best ? h('span', { class: 'badge jade' }, `Cao nhất ${best.total}/${best.maxTotal}`) : null),
      h('h3', null, e.title_vi),
      h('a', { class: 'btn primary', href: `#/exam/${encodeURIComponent(e.id)}` }, 'Vào thi')));
  }

  let words = [];
  try { words = await getVocab(lv); } catch { /* đang soạn */ }
  const chars = await getCharacters(lv).catch(() => []);
  if (!ctx.isCurrent()) return;
  const st = levelStats(words);
  const written = chars.filter((c) => p.chars[c.hanzi]).length;
  const lastExam = p.exams.find((r) => String(r.level) === String(lv));
  clear(statsBox).append(
    stat(`${st.known}`, `/ ${st.total || '—'} từ đã thuộc`, st.total ? st.known / st.total : 0),
    stat(`${st.due}`, 'từ cần ôn hôm nay', null, st.due ? h('a', { href: `#/vocab/${encodeURIComponent(lv)}?tab=srs`, class: 'small' }, 'Ôn ngay →') : null),
    stat(`${written}`, `/ ${chars.length || '—'} chữ đã tập viết`, chars.length ? written / chars.length : 0),
    stat(lastExam ? `${lastExam.total}` : '—', lastExam ? `điểm thi gần nhất / ${lastExam.maxTotal}` : 'chưa thi thử'),
    stat(`${p.streak.days || 0}`, 'ngày học liên tiếp 🔥'));
}

function stat(big, label, ratio, extra) {
  return h('div', { class: 'stat' }, h('b', null, big), h('span', null, label),
    ratio != null ? h('div', { class: 'progress', style: { marginTop: '6px' } }, h('i', { style: { width: `${Math.round(ratio * 100)}%` } })) : null, extra);
}

function tierOf(k) {
  if (k === '7-9') return 'Cao cấp';
  const n = Number(k);
  return n <= 3 ? 'Sơ cấp' : n <= 6 ? 'Trung cấp' : 'Cao cấp';
}
