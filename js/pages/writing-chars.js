// Luyện chữ Hán với Hanzi Writer: animation thứ tự nét, quiz tự viết, lưới 田字格.
// Hai chế độ: theo cấp HSK, hoặc theo bộ thủ (214 bộ Khang Hy, gom chữ của mọi cấp).
import { h, clear, pageHead, toast, loadScript, notice, icon, emptyState } from '../ui.js';
import { getCharacters, getManifest, fetchJSON, levelKey } from '../data.js';
import { getProgress, updateProgress } from '../storage.js';
import { speak } from '../tts.js';
import { stripTones } from '../compare.js';
import { levelChips, levelName, dataProblem, settle } from './common.js';

const HW_URL = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.7/dist/hanzi-writer.min.js';
const PAGE = 120;

const tzgSVG = () => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('class', 'grid-bg'); s.setAttribute('viewBox', '0 0 100 100'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<g stroke="var(--red)" stroke-opacity=".35" stroke-width=".5" stroke-dasharray="2 2"><line x1="0" y1="50" x2="100" y2="50"/><line x1="50" y1="0" x2="50" y2="100"/><line x1="0" y1="0" x2="100" y2="100"/><line x1="100" y1="0" x2="0" y2="100"/></g>';
  return s;
};
const done = () => getProgress().chars || {};

export async function render(root, params, ctx) {
  const lv = params.level || ctx.level;
  const q = new URLSearchParams(location.hash.split('?')[1] || '');
  const radicalMode = q.get('mode') === 'radical';
  root.append(pageHead('Viết', '汉字', radicalMode ? 'Luyện chữ theo bộ thủ' : `Luyện chữ Hán ${levelName(ctx, lv)}`,
    radicalMode ? 'Học chữ Hán theo từng bộ thủ: hiểu nghĩa bộ, viết chính bộ thủ, rồi luyện các chữ chứa bộ đó qua mọi cấp.' : 'Chọn một chữ để xem thứ tự nét, rồi tự viết theo trên ô 田字格 – máy sẽ nhắc khi bạn viết sai nét.'));
  const base = `#/writing/chars/${encodeURIComponent(lv)}`;
  root.append(h('div', { class: 'tabs', role: 'tablist' },
    h('a', { href: base, class: radicalMode ? '' : 'on', role: 'tab' }, 'Theo cấp HSK'),
    h('a', { href: `${base}?mode=radical`, class: radicalMode ? 'on' : '', role: 'tab' }, 'Theo bộ thủ 部首')));
  return radicalMode ? radicalView(root, ctx, lv, q.get('r')) : levelView(root, ctx, lv);
}

// ---------- Khung luyện viết dùng chung ----------
function makePractice(panel, onProgress) {
  let writer = null; let HanziWriter = null; let current = null;
  const colors = () => {
    const cs = getComputedStyle(document.documentElement);
    return { ink: cs.getPropertyValue('--ink').trim() || '#222', red: cs.getPropertyValue('--red').trim() || '#b8322a', line: cs.getPropertyValue('--line-2').trim() || '#ddd', jade: cs.getPropertyValue('--jade').trim() || '#2d7a5a' };
  };
  async function select(c, { extra } = {}) {
    current = c;
    clear(panel);
    const hwBox = h('div', { class: 'hw' });
    const status = h('div', { class: 'small muted', style: { textAlign: 'center', minHeight: '1.4em' }, 'aria-live': 'polite' });
    const steps = h('div', { class: 'stroke-steps', 'aria-label': 'Thứ tự từng nét' });
    panel.append(
      h('div', { class: 'char-big-meta' }, h('span', { class: 'pyl' }, c.pinyin || ''), h('span', { style: { fontWeight: 600 } }, c.meaning_vi || ''), h('button', { class: 'btn sm round', 'aria-label': 'Nghe', onclick: () => speak(c.hanzi).catch((e) => toast(e.message, 'err')) }, icon('speaker'))),
      extra || null,
      h('div', { class: 'tzg' }, tzgSVG(), hwBox),
      status);
    const btns = h('div', { class: 'row', style: { justifyContent: 'center', marginBottom: '12px' } });
    panel.append(btns, h('div', { class: 'char-info' }, h('dl', null,
      c.han_viet ? [h('dt', null, 'Hán Việt'), h('dd', null, c.han_viet)] : null,
      c.strokes ? [h('dt', null, 'Số nét'), h('dd', null, c.strokes)] : null,
      c.radical ? [h('dt', null, 'Bộ thủ'), h('dd', null, h('span', { class: 'zh' }, c.radical), c.radical_meaning_vi ? ` – ${c.radical_meaning_vi}` : '')] : null,
      c.level ? [h('dt', null, 'Cấp'), h('dd', null, `HSK ${c.level}`, c.handwrite ? ' · cần viết tay' : '')] : null,
      c.words?.length ? [h('dt', null, 'Từ ghép'), h('dd', { class: 'zh' }, c.words.join('、'))] : null)),
      h('div', { class: 'small muted', style: { marginTop: '12px' } }, 'Thứ tự nét'), steps);
    try { HanziWriter = HanziWriter || await loadScript(HW_URL, 'HanziWriter'); }
    catch { status.append(notice('err', '⚠️', 'Không tải được thư viện Hanzi Writer (cần Internet). Hãy kiểm tra mạng rồi thử lại.')); return; }
    if (current !== c) return;
    const size = Math.min(300, hwBox.clientWidth || 280);
    const col = colors();
    try { writer?.cancelQuiz?.(); } catch { /* */ }
    writer = HanziWriter.create(hwBox, c.hanzi, {
      width: size, height: size, padding: 12, showOutline: true, showCharacter: true,
      strokeColor: col.ink, radicalColor: col.red, outlineColor: col.line, drawingColor: col.red, highlightColor: col.jade,
      strokeAnimationSpeed: 1, delayBetweenStrokes: 220, drawingWidth: 22,
      onLoadCharDataError: () => { status.textContent = ''; status.append(notice('warn', '🈳', `Chưa có dữ liệu thứ tự nét cho "${c.hanzi}" (hoặc mất mạng).${c.isRadical ? ' Với bộ thủ dạng biến thể, hãy thử dạng chữ đầy đủ.' : ' Hãy thử chữ khác.'}`)); clear(btns); },
    });
    let looping = false;
    const anim = () => { status.textContent = 'Đang vẽ thứ tự nét…'; writer.showCharacter(); writer.animateCharacter({ onComplete: () => { status.textContent = looping ? '' : 'Xong! Bấm "Tự viết" để luyện.'; if (looping && current === c) setTimeout(() => looping && anim(), 900); } }); };
    const quiz = () => {
      looping = false;
      writer.hideCharacter();
      status.textContent = 'Viết từng nét theo đúng thứ tự trong ô…';
      let mistakes = 0;
      writer.quiz({
        showHintAfterMisses: 2, leniency: 1.1,
        onMistake: () => { mistakes++; status.textContent = `Sai nét rồi, thử lại (${mistakes} lỗi). Sai 2 lần sẽ có gợi ý.`; },
        onCorrectStroke: (d) => { status.textContent = `Đúng! Nét ${d.strokeNum + 1}/${d.strokeNum + 1 + d.strokesRemaining}`; },
        onComplete: (d) => {
          const m = d.totalMistakes;
          status.textContent = m === 0 ? '🎉 Hoàn hảo! Không sai nét nào.' : `✓ Hoàn thành với ${m} lỗi. Viết lại để nhớ hơn!`;
          updateProgress((p) => { const r = p.chars[c.hanzi] || { count: 0, best: null }; r.count++; r.last = Date.now(); r.best = r.best == null ? m : Math.min(r.best, m); p.chars[c.hanzi] = r; });
          onProgress && onProgress();
        },
      });
    };
    clear(btns).append(
      h('button', { class: 'btn sm primary', onclick: () => { looping = false; anim(); } }, '▶ Thứ tự nét'),
      h('button', { class: 'btn sm', onclick: () => { looping = !looping; if (looping) anim(); } }, '🔁 Lặp'),
      h('button', { class: 'btn sm ink', onclick: quiz }, '✍️ Tự viết'),
      h('button', { class: 'btn sm', 'aria-label': 'Đặt lại', onclick: () => { looping = false; writer.cancelQuiz(); writer.showCharacter(); status.textContent = ''; } }, '↺'));
    HanziWriter.loadCharacterData(c.hanzi).then((data) => {
      if (current !== c) return;
      const tr = HanziWriter.getScalingTransform(44, 44, 2);
      data.strokes.forEach((_, i) => {
        const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', tr.transform);
        for (let k = 0; k <= i; k++) {
          const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          p.setAttribute('d', data.strokes[k]); p.setAttribute('fill', k === i ? col.red : col.ink);
          g.append(p);
        }
        s.append(g); s.setAttribute('aria-label', `Nét ${i + 1}`);
        steps.append(s);
      });
    }).catch(() => { /* đã báo ở trên */ });
    anim();
  }
  return { select, get current() { return current; }, destroy: () => { current = null; try { writer?.cancelQuiz?.(); } catch { /* */ } } };
}

function charGrid(list, practice, redraw, { showLevel = false } = {}) {
  const d = done();
  return h('div', { class: 'char-grid' }, list.map((c) =>
    h('button', { class: `char-cell${practice.current?.hanzi === c.hanzi ? ' on' : ''}${d[c.hanzi] ? ' done' : ''}`, lang: 'zh-CN', 'aria-label': `${c.hanzi} ${c.pinyin}`, onclick: () => { practice.select(c); redraw(); } },
      showLevel ? h('span', { class: 'lv' }, c.level) : null, c.hanzi, h('span', { class: 'py' }, c.pinyin))));
}

// ---------- Theo cấp ----------
async function levelView(root, ctx, lv) {
  root.append(levelChips(ctx, 'writing/chars', lv));
  let chars;
  try { chars = await getCharacters(lv); } catch (e) { root.append(dataProblem(e, 'Danh sách chữ Hán')); return; }
  if (!ctx.isCurrent()) return;
  const panel = h('div', { class: 'card char-panel' });
  const gridBox = h('div');
  const search = h('input', { class: 'input', type: 'search', placeholder: 'Tìm chữ, pinyin, nghĩa… hoặc gõ chữ bất kỳ rồi Enter', 'aria-label': 'Tìm chữ' });
  const pager = h('div', { class: 'pager' });
  root.append(h('div', { class: 'char-layout' }, h('div', null, h('div', { class: 'toolbar' }, search), gridBox, pager), panel));
  let page = 0; let filtered = chars;
  const practice = makePractice(panel, () => drawGrid());
  const drawGrid = () => {
    clear(gridBox); clear(pager);
    if (!chars.length) { gridBox.append(dataProblem({ missing: true }, 'Danh sách chữ Hán'), h('p', { class: 'muted small' }, 'Bạn vẫn có thể gõ một chữ bất kỳ vào ô tìm kiếm để luyện.')); return; }
    if (!filtered.length) { gridBox.append(emptyState('无', 'Không có chữ phù hợp. Nhấn Enter để luyện chữ vừa gõ.')); return; }
    const pages = Math.ceil(filtered.length / PAGE);
    gridBox.append(charGrid(filtered.slice(page * PAGE, page * PAGE + PAGE), practice, drawGrid));
    const d = done();
    if (pages > 1) pager.append(h('button', { class: 'btn sm', disabled: page === 0, onclick: () => { page--; drawGrid(); } }, '‹'), h('span', { class: 'small muted' }, `Trang ${page + 1}/${pages} · ${filtered.length} chữ`), h('button', { class: 'btn sm', disabled: page >= pages - 1, onclick: () => { page++; drawGrid(); } }, '›'));
    else pager.append(h('span', { class: 'small muted' }, `${filtered.length} chữ · đã tập ${filtered.filter((c) => d[c.hanzi]).length}`));
  };
  search.addEventListener('input', () => {
    const s = search.value.trim().toLowerCase(); const ns = stripTones(s);
    filtered = !s ? chars : chars.filter((c) => c.hanzi === s || s.includes(c.hanzi) || stripTones(c.pinyin).startsWith(ns) || (c.meaning_vi || '').toLowerCase().includes(s) || (c.han_viet || '').toLowerCase().includes(s));
    page = 0; drawGrid();
  });
  search.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const ch = [...search.value.trim()].find((x) => /[㐀-鿿]/.test(x));
    if (ch) { practice.select(chars.find((c) => c.hanzi === ch) || { hanzi: ch, pinyin: '', meaning_vi: '(chữ ngoài danh sách)' }); drawGrid(); }
  });
  drawGrid();
  if (chars.length) { practice.select(chars[0]); drawGrid(); }
  return () => practice.destroy();
}

// ---------- Theo bộ thủ ----------
let radCache = null;
async function loadRadicalData(ctx) {
  if (radCache) return radCache;
  const m = await getManifest();
  let meta = null;
  const radPath = m.radicals || m.writing?.radicals;
  if (radPath) { try { meta = await fetchJSON(radPath); } catch { meta = null; } }
  const res = await settle(ctx.levels.map((l) => getCharacters(levelKey(l))));
  const chars = [];
  const missingLevels = [];
  res.forEach((r, i) => {
    const k = levelKey(ctx.levels[i]);
    if (!r.ok) { missingLevels.push(ctx.levels[i].name_vi); return; }
    for (const c of r.value) chars.push({ ...c, level: c.level ?? k });
  });
  const v2r = meta?.variant_to_radical || {};
  const over = meta?.char_radical_override || {};
  const norm = (c) => over[c.hanzi] ?? v2r[c.radical] ?? c.radical;
  const groups = new Map();
  for (const c of chars) {
    const R = norm(c);
    if (!R) continue;
    if (!groups.has(R)) groups.set(R, []);
    groups.get(R).push(c);
  }
  let radicals;
  if (Array.isArray(meta?.radicals) && meta.radicals.length) {
    radicals = meta.radicals.map((r) => ({ ...r, chars: groups.get(r.radical) || [] }));
    const known = new Set(radicals.map((r) => r.radical));
    for (const [R, list] of groups) if (!known.has(R)) radicals.push({ radical: R, variants: [], strokes: null, chars: list, meaning_vi: list[0]?.radical_meaning_vi || '' });
  } else {
    // Chưa có radicals.json: tạm nhóm theo trường radical của chữ
    radicals = [...groups].map(([R, list]) => ({ radical: R, variants: [], strokes: null, meaning_vi: list.find((c) => c.radical_meaning_vi)?.radical_meaning_vi || '', chars: list, common: list.length >= 5 }));
  }
  radCache = { radicals, hasMeta: !!meta, missingLevels };
  return radCache;
}

async function radicalView(root, ctx, lv, selected) {
  const box = h('div');
  root.append(box);
  box.append(h('p', { class: 'muted' }, h('span', { class: 'spinner' }), ' Đang tải bộ thủ và chữ Hán của mọi cấp…'));
  let data;
  try { data = await loadRadicalData(ctx); } catch (e) { clear(box).append(dataProblem(e, 'Bộ thủ')); return; }
  if (!ctx.isCurrent()) return;
  clear(box);
  if (!data.hasMeta) box.append(h('div', { style: { marginBottom: '12px' } }, notice('warn', 'ℹ️', 'Danh sách 214 bộ thủ đang được soạn — tạm nhóm chữ theo bộ ghi trong dữ liệu chữ Hán.')));
  const rad = selected ? data.radicals.find((r) => r.radical === selected || (r.variants || []).includes(selected)) : null;
  if (rad) return radicalDetail(box, ctx, lv, rad);

  let filter = 'common'; let term = '';
  const search = h('input', { class: 'input', type: 'search', placeholder: 'Tìm bộ: 水, thủy, nước…', 'aria-label': 'Tìm bộ thủ' });
  const filt = h('div', { class: 'tabs', style: { margin: 0 } });
  const grid = h('div');
  box.append(h('div', { class: 'toolbar' }, search, filt), grid);
  const draw = () => {
    clear(filt).append(...[['common', 'Bộ thường gặp'], ['used', 'Bộ có chữ HSK'], ['all', 'Tất cả 214 bộ']].map(([k, l]) => h('button', { class: filter === k ? 'on' : '', onclick: () => { filter = k; draw(); } }, l)));
    const s = term.toLowerCase(); const ns = stripTones(s);
    let list = data.radicals.filter((r) => (filter === 'all' ? true : filter === 'used' ? r.chars.length > 0 : (data.hasMeta ? r.common === true : r.chars.length >= 5)));
    if (s) list = data.radicals.filter((r) => r.radical === s || (r.variants || []).includes(s) || (r.han_viet || '').toLowerCase().includes(s) || (r.meaning_vi || '').toLowerCase().includes(s) || (r.pinyin && stripTones(r.pinyin) === ns));
    list = [...list].sort((a, b) => (a.strokes ?? 99) - (b.strokes ?? 99) || (a.id ?? 999) - (b.id ?? 999) || b.chars.length - a.chars.length);
    clear(grid);
    if (!list.length) { grid.append(emptyState('部', 'Không tìm thấy bộ thủ phù hợp.')); return; }
    const cells = [];
    let lastStroke;
    for (const r of list) {
      if (r.strokes != null && r.strokes !== lastStroke) { cells.push(h('div', { class: 'stroke-head' }, `${r.strokes} nét`)); lastStroke = r.strokes; }
      cells.push(h('a', { class: 'rad-cell', href: `#/writing/chars/${encodeURIComponent(lv)}?mode=radical&r=${encodeURIComponent(r.radical)}`, style: { textDecoration: 'none', opacity: r.chars.length ? 1 : 0.55 } },
        h('span', { class: 'rz', lang: 'zh-CN' }, r.radical),
        (r.variants || []).length ? h('span', { class: 'rv' }, r.variants.join(' ')) : null,
        r.han_viet ? h('span', { class: 'rn' }, r.han_viet) : null,
        r.meaning_vi ? h('span', { class: 'rm' }, r.meaning_vi) : null,
        h('span', { class: `badge ${r.chars.length ? 'jade' : ''} rc` }, `${r.chars.length} chữ`)));
    }
    grid.append(h('div', { class: 'rad-grid' }, cells));
  };
  let t;
  search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { term = search.value.trim(); draw(); }, 150); });
  draw();
}

function radicalDetail(box, ctx, lv, r) {
  const levels = [...new Set(r.chars.map((c) => String(c.level)))];
  let lvFilter = 'all';
  const panel = h('div', { class: 'card char-panel' });
  const gridBox = h('div');
  const chips = h('div', { class: 'level-strip' });
  const practice = makePractice(panel, () => drawGrid());
  const radChar = (form) => ({ hanzi: form, pinyin: r.pinyin || '', meaning_vi: r.meaning_vi || '', han_viet: r.han_viet, strokes: form === r.radical ? r.strokes : null, isRadical: true });
  const practiceRadical = (form) => {
    practice.select(radChar(form), { extra: (r.variants || []).length ? h('div', { class: 'row', style: { justifyContent: 'center', marginBottom: '8px' } }, h('span', { class: 'small muted' }, 'Dạng:'), [r.radical, ...r.variants].map((f) => h('button', { class: `btn sm${f === form ? ' ink' : ''}`, onclick: () => practiceRadical(f) }, h('span', { class: 'zh' }, f)))) : null });
    drawGrid();
  };
  box.append(
    h('div', { class: 'row', style: { marginBottom: '10px' } }, h('a', { class: 'btn sm ghost', href: `#/writing/chars/${encodeURIComponent(lv)}?mode=radical` }, '‹ Tất cả bộ thủ')),
    h('div', { class: 'card rad-hero' },
      h('span', { class: 'rz', lang: 'zh-CN' }, r.radical),
      h('div', { class: 'grow' },
        h('h2', { style: { margin: 0 } }, `Bộ ${r.han_viet || r.radical}`, r.pinyin ? h('span', { class: 'muted', style: { fontWeight: 400, fontSize: '.8em' } }, ` · ${r.pinyin}`) : null),
        r.meaning_vi ? h('div', null, r.meaning_vi) : null,
        h('div', { class: 'row', style: { marginTop: '6px', gap: '6px' } },
          r.strokes ? h('span', { class: 'badge' }, `${r.strokes} nét`) : null,
          (r.variants || []).length ? h('span', { class: 'badge' }, 'Biến thể: ', h('span', { class: 'zh' }, r.variants.join(' '))) : null,
          h('span', { class: 'badge jade' }, `${r.chars.length} chữ HSK`))),
      h('button', { class: 'btn ink', onclick: () => practiceRadical(r.radical) }, '✍️ Luyện viết bộ thủ')),
    chips,
    h('div', { class: 'char-layout' }, gridBox, panel));
  const drawChips = () => {
    clear(chips);
    if (levels.length < 2) return;
    chips.append(h('button', { class: `level-chip${lvFilter === 'all' ? ' on' : ''}`, onclick: () => { lvFilter = 'all'; drawChips(); drawGrid(); } }, 'Mọi cấp'),
      ...ctx.levels.filter((l) => levels.includes(levelKey(l))).map((l) => h('button', { class: `level-chip${lvFilter === levelKey(l) ? ' on' : ''}`, onclick: () => { lvFilter = levelKey(l); drawChips(); drawGrid(); } }, l.name_vi, h('small', null, r.chars.filter((c) => String(c.level) === levelKey(l)).length))));
  };
  const order = (c) => ctx.levels.findIndex((l) => levelKey(l) === String(c.level));
  const drawGrid = () => {
    clear(gridBox);
    const list = r.chars.filter((c) => lvFilter === 'all' || String(c.level) === lvFilter).sort((a, b) => order(a) - order(b));
    if (!list.length) { gridBox.append(emptyState('部', 'Chưa có chữ HSK nào thuộc bộ này. Bạn vẫn có thể luyện viết chính bộ thủ.')); return; }
    gridBox.append(charGrid(list, practice, drawGrid, { showLevel: true }), h('p', { class: 'small muted', style: { marginTop: '8px' } }, `${list.length} chữ · số nhỏ góc trái = cấp HSK`));
  };
  drawChips(); drawGrid();
  practiceRadical(r.radical);
  return () => practice.destroy();
}
