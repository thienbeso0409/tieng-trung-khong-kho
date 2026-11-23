// Từ vựng: danh sách (tìm/lọc/phân trang), thẻ ghi nhớ, ôn tập SRS.
import { h, clear, pageHead, toast, shuffle, icon, emptyState } from '../ui.js';
import { getVocabFile } from '../data.js';
import { speak, ttsSupported } from '../tts.js';
import { stripTones } from '../compare.js';
import { isKnown, setKnown, review, buildQueue, levelStats, vocabState, nextIntervalLabel } from '../srs.js';
import { levelChips, levelName, dataProblem } from './common.js';

const PAGE = 40;

const say = (text) => {
  if (!ttsSupported()) { toast('Trình duyệt không hỗ trợ đọc. Hãy dùng Chrome/Edge.', 'err'); return; }
  speak(text).catch((e) => toast(e.message, 'err'));
};

export async function render(root, params, ctx) {
  const lv = params.level || ctx.level;
  const q = new URLSearchParams((location.hash.split('?')[1]) || '');
  let tab = q.get('tab') || 'list';
  root.append(pageHead('Từ vựng', '词汇', `Từ vựng ${levelName(ctx, lv)}`, 'Tra cứu, nghe phát âm, học bằng thẻ ghi nhớ và ôn tập ngắt quãng để nhớ lâu.'));
  root.append(levelChips(ctx, 'vocab', lv));
  let file;
  try { file = await getVocabFile(lv); } catch (e) { root.append(dataProblem(e, 'Từ vựng')); return; }
  if (!ctx.isCurrent()) return;
  const words = Array.isArray(file.words) ? file.words : [];
  if (!words.length) { root.append(dataProblem({ missing: true }, 'Từ vựng')); return; }

  const info = h('div', { class: 'row', style: { marginBottom: '14px' } });
  const drawInfo = () => {
    const st = levelStats(words);
    clear(info).append(
      h('span', { class: 'badge' }, `${words.length} từ${file.target_count ? ` / mục tiêu ${file.target_count}` : ''}`),
      file.complete === false ? h('span', { class: 'badge gold' }, 'Đang bổ sung thêm từ') : null,
      h('span', { class: 'badge jade' }, `Đã thuộc ${st.known}`),
      st.due ? h('span', { class: 'badge red' }, `${st.due} từ đến hạn ôn`) : null);
  };
  drawInfo();
  const tabs = h('div', { class: 'tabs', role: 'tablist' });
  const body = h('div');
  root.append(info, tabs, body);
  const TABS = [['list', 'Danh sách'], ['cards', 'Thẻ ghi nhớ'], ['srs', 'Ôn tập (SRS)']];
  let cleanupTab = null;
  const show = (t) => {
    tab = t;
    if (cleanupTab) cleanupTab();
    clear(tabs).append(...TABS.map(([k, l]) => h('button', { class: k === t ? 'on' : '', role: 'tab', 'aria-selected': String(k === t), onclick: () => show(k) }, l)));
    clear(body);
    cleanupTab = (t === 'list' ? listView : t === 'cards' ? cardsView : srsView)(body, words, drawInfo);
  };
  show(TABS.some(([k]) => k === tab) ? tab : 'list');
  return () => cleanupTab && cleanupTab();
}

// ---------- Danh sách ----------
function listView(root, words, onChange) {
  const topics = [...new Set(words.map((w) => w.topic).filter(Boolean))].sort();
  let page = 0;
  const search = h('input', { class: 'input', type: 'search', placeholder: 'Tìm chữ Hán, pinyin (không cần dấu) hoặc nghĩa…', 'aria-label': 'Tìm từ' });
  const filter = h('select', { class: 'select', 'aria-label': 'Lọc' }, h('option', { value: 'all' }, 'Tất cả'), h('option', { value: 'unknown' }, 'Chưa thuộc'), h('option', { value: 'known' }, 'Đã thuộc'));
  const topic = topics.length ? h('select', { class: 'select', 'aria-label': 'Chủ đề' }, h('option', { value: '' }, 'Mọi chủ đề'), topics.map((t) => h('option', { value: t }, t))) : null;
  const list = h('div', { class: 'word-list' });
  const pager = h('div', { class: 'pager' });
  const count = h('div', { class: 'small muted', style: { margin: '-6px 0 10px' } });
  root.append(h('div', { class: 'toolbar' }, search, filter, topic), count, list, pager);

  let filtered = words;
  const apply = () => {
    const s = search.value.trim().toLowerCase();
    const st = vocabState();
    const ns = stripTones(s);
    filtered = words.filter((w) => {
      if (filter.value === 'known' && !st[w.id]?.known) return false;
      if (filter.value === 'unknown' && st[w.id]?.known) return false;
      if (topic && topic.value && w.topic !== topic.value) return false;
      if (!s) return true;
      return w.hanzi.includes(s) || stripTones(w.pinyin).includes(ns) || (w.meaning_vi || '').toLowerCase().includes(s) || (w.han_viet || '').toLowerCase().includes(s);
    });
    page = 0; draw();
  };
  let t;
  search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(apply, 180); });
  filter.addEventListener('change', apply);
  topic && topic.addEventListener('change', apply);

  const draw = () => {
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
    page = Math.min(page, pages - 1);
    count.textContent = `${filtered.length} từ · trang ${page + 1}/${pages}`;
    clear(list);
    if (!filtered.length) list.append(emptyState('无', 'Không tìm thấy từ nào.'));
    const st = vocabState();
    for (const w of filtered.slice(page * PAGE, page * PAGE + PAGE)) list.append(wordRow(w, st, () => { onChange(); }));
    clear(pager);
    if (pages > 1) {
      const go = (p) => { page = p; draw(); list.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
      pager.append(h('button', { class: 'btn sm', disabled: page === 0, onclick: () => go(page - 1) }, '‹ Trước'));
      const nums = new Set([0, pages - 1, page - 1, page, page + 1].filter((x) => x >= 0 && x < pages));
      let last = -1;
      for (const n of [...nums].sort((a, b) => a - b)) {
        if (n - last > 1) pager.append(h('span', { class: 'muted' }, '…'));
        pager.append(h('button', { class: `btn sm${n === page ? ' ink' : ''}`, onclick: () => go(n) }, n + 1));
        last = n;
      }
      pager.append(h('button', { class: 'btn sm', disabled: page >= pages - 1, onclick: () => go(page + 1) }, 'Sau ›'));
    }
  };
  draw();
}

function wordRow(w, st, onChange) {
  const known = !!st[w.id]?.known;
  const row = h('div', { class: `word-row${known ? ' known' : ''}` });
  const kb = h('button', { class: 'btn sm known-btn', 'aria-pressed': String(known), title: 'Đánh dấu đã thuộc', onclick: () => {
    const now = !isKnown(w.id); setKnown(w.id, now);
    kb.setAttribute('aria-pressed', String(now)); kb.textContent = now ? '✓ Đã thuộc' : 'Đánh dấu thuộc';
    row.classList.toggle('known', now); onChange();
  } }, known ? '✓ Đã thuộc' : 'Đánh dấu thuộc');
  row.append(
    h('div', { class: 'hz', lang: 'zh-CN' }, w.hanzi, h('span', { class: 'py' }, w.pinyin)),
    h('div', null,
      h('div', { class: 'meaning' }, w.meaning_vi),
      h('div', { class: 'meta' }, h('span', null, w.pos), w.han_viet ? h('span', null, `Hán Việt: ${w.han_viet}`) : null, w.topic ? h('span', null, `#${w.topic}`) : null, w.traditional ? h('span', { class: 'zh' }, `Phồn thể: ${w.traditional}`) : null),
      w.example ? h('div', { class: 'ex' }, h('span', { class: 'zh' }, w.example.zh), ' ', h('button', { class: 'btn ghost sm', style: { minHeight: '26px', padding: '0 6px' }, 'aria-label': 'Nghe câu ví dụ', onclick: () => say(w.example.zh) }, icon('speaker')), h('div', { class: 'py' }, w.example.pinyin), h('div', { class: 'vi' }, w.example.vi)) : null),
    h('div', { class: 'acts' }, h('button', { class: 'btn sm round', 'aria-label': `Nghe ${w.hanzi}`, onclick: () => say(w.hanzi) }, icon('speaker')), kb));
  return row;
}

// ---------- Thẻ ghi nhớ ----------
function cardsView(root, words, onChange) {
  let onlyUnknown = false;
  let deck = [...words];
  let i = 0;
  let flipped = false;
  let autoSay = true;
  const stage = h('div', { class: 'flash-wrap' });
  root.append(stage);
  const rebuild = (shuf) => {
    const st = vocabState();
    deck = words.filter((w) => !onlyUnknown || !st[w.id]?.known);
    if (shuf) deck = shuffle(deck);
    i = 0; flipped = false; draw();
  };
  const draw = () => {
    clear(stage);
    const ctrl = h('div', { class: 'row', style: { justifyContent: 'center', marginBottom: '14px' } },
      h('label', { class: 'small' }, h('input', { type: 'checkbox', checked: onlyUnknown, onchange: (e) => { onlyUnknown = e.target.checked; rebuild(false); } }), ' Chỉ từ chưa thuộc'),
      h('label', { class: 'small' }, h('input', { type: 'checkbox', checked: autoSay, onchange: (e) => { autoSay = e.target.checked; } }), ' Tự đọc'),
      h('button', { class: 'btn sm', onclick: () => rebuild(true) }, '🔀 Trộn thẻ'));
    stage.append(ctrl);
    if (!deck.length) { stage.append(emptyState('棒', 'Bạn đã thuộc hết các từ! 🎉')); return; }
    const w = deck[i];
    const known = isKnown(w.id);
    const card = h('div', { class: `flashcard${flipped ? ' flipped' : ''}`, tabindex: 0, role: 'button', 'aria-label': 'Lật thẻ', onclick: () => flip() },
      h('div', { class: 'inner' },
        h('div', { class: 'face front' }, h('div', { class: 'hz', lang: 'zh-CN' }, w.hanzi), h('span', { class: 'tap' }, 'Chạm để lật · phím Space')),
        h('div', { class: 'face back' },
          h('div', { class: 'hz', lang: 'zh-CN' }, w.hanzi),
          h('div', { class: 'pyl' }, w.pinyin),
          h('div', { class: 'mn' }, w.meaning_vi),
          h('div', { class: 'small muted' }, [w.pos, w.han_viet ? `Hán Việt: ${w.han_viet}` : null].filter(Boolean).join(' · ')),
          w.example ? h('div', { style: { marginTop: '10px' } }, h('div', { class: 'zh' }, w.example.zh), h('div', { class: 'small muted' }, w.example.pinyin), h('div', { class: 'small vi' }, w.example.vi)) : null)));
    stage.append(card,
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        h('button', { class: 'btn', disabled: i === 0, onclick: () => go(-1), 'aria-label': 'Thẻ trước' }, '‹'),
        h('button', { class: 'btn round', onclick: () => say(w.hanzi), 'aria-label': 'Nghe' }, icon('speaker')),
        h('span', { class: 'muted small', style: { minWidth: '70px', textAlign: 'center' } }, `${i + 1} / ${deck.length}`),
        h('button', { class: `btn known-btn`, 'aria-pressed': String(known), onclick: () => { setKnown(w.id, !known); onChange(); draw(); } }, known ? '✓ Đã thuộc' : 'Đánh dấu thuộc'),
        h('button', { class: 'btn', disabled: i >= deck.length - 1, onclick: () => go(1), 'aria-label': 'Thẻ sau' }, '›')));
    if (autoSay && !flipped) say(w.hanzi);
  };
  const flip = () => { flipped = !flipped; stage.querySelector('.flashcard')?.classList.toggle('flipped', flipped); };
  const go = (d) => { i = Math.max(0, Math.min(deck.length - 1, i + d)); flipped = false; draw(); };
  const onKey = (e) => {
    if (e.target.matches('input,textarea,select')) return;
    if (e.key === ' ') { e.preventDefault(); flip(); } else if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1);
  };
  document.addEventListener('keydown', onKey);
  draw();
  return () => document.removeEventListener('keydown', onKey);
}

// ---------- Ôn tập SRS ----------
function srsView(root, words, onChange) {
  let { queue, due, fresh } = buildQueue(words);
  let idx = 0; let revealed = false; let done = 0;
  const stage = h('div', { class: 'flash-wrap' });
  root.append(h('p', { class: 'muted', style: { textAlign: 'center' } }, `Hôm nay: ${due.length} từ đến hạn + ${fresh.length} từ mới. Tự đánh giá mức nhớ — từ khó sẽ quay lại sớm hơn.`), stage);
  const draw = () => {
    clear(stage);
    if (idx >= queue.length) {
      stage.append(h('div', { class: 'card', style: { textAlign: 'center' } }, emptyState('好', done ? `Xong! Bạn đã ôn ${done} lượt hôm nay.` : 'Không có từ nào cần ôn lúc này.'),
        h('button', { class: 'btn primary', onclick: () => { ({ queue, due, fresh } = buildQueue(words, { newLimit: 10 })); idx = 0; draw(); } }, 'Học thêm 10 từ mới')));
      return;
    }
    const w = queue[idx];
    stage.append(h('div', { class: 'progress', style: { marginBottom: '14px' } }, h('i', { style: { width: `${(100 * idx) / queue.length}%` } })));
    stage.append(h('div', { class: `flashcard${revealed ? ' flipped' : ''}`, onclick: () => { if (!revealed) { revealed = true; draw(); } } },
      h('div', { class: 'inner' },
        h('div', { class: 'face front' }, h('div', { class: 'hz' }, w.hanzi), h('span', { class: 'tap' }, 'Nhớ nghĩa & pinyin rồi chạm để xem')),
        h('div', { class: 'face back' }, h('div', { class: 'hz' }, w.hanzi), h('div', { class: 'pyl' }, w.pinyin), h('div', { class: 'mn' }, w.meaning_vi),
          w.example ? h('div', { class: 'small', style: { marginTop: '8px' } }, h('div', { class: 'zh' }, w.example.zh), h('div', { class: 'vi' }, w.example.vi)) : null))));
    if (!revealed) {
      stage.append(h('div', { class: 'row', style: { justifyContent: 'center' } }, h('button', { class: 'btn round', onclick: () => say(w.hanzi), 'aria-label': 'Nghe' }, icon('speaker')), h('button', { class: 'btn primary lg', onclick: () => { revealed = true; draw(); say(w.hanzi); } }, 'Hiện đáp án')));
    } else {
      const R = [['Quên', 0], ['Khó', 1], ['Nhớ', 2], ['Dễ', 3]];
      stage.append(h('div', { class: 'srs-btns' }, R.map(([l, r]) => h('button', { class: `btn${r === 2 ? ' primary' : ''}`, onclick: () => {
        review(w.id, r); done++; onChange();
        if (r === 0) queue.push(w); // ôn lại trong phiên
        idx++; revealed = false; draw();
      } }, l, h('small', null, nextIntervalLabel(w.id, r))))));
    }
  };
  draw();
}
