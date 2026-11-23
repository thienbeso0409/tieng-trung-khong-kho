// Luyện chữ Hán với Hanzi Writer: animation thứ tự nét, quiz tự viết, lưới 田字格.
import { h, clear, pageHead, toast, loadScript, notice, icon, emptyState } from '../ui.js';
import { getCharacters } from '../data.js';
import { getProgress, updateProgress } from '../storage.js';
import { speak } from '../tts.js';
import { stripTones } from '../compare.js';
import { levelChips, levelName, dataProblem } from './common.js';

const HW_URL = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.7/dist/hanzi-writer.min.js';
const PAGE = 120;

const tzgSVG = () => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('class', 'grid-bg'); s.setAttribute('viewBox', '0 0 100 100'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<g stroke="var(--red)" stroke-opacity=".35" stroke-width=".5" stroke-dasharray="2 2"><line x1="0" y1="50" x2="100" y2="50"/><line x1="50" y1="0" x2="50" y2="100"/><line x1="0" y1="0" x2="100" y2="100"/><line x1="100" y1="0" x2="0" y2="100"/></g>';
  return s;
};

export async function render(root, params, ctx) {
  const lv = params.level || ctx.level;
  root.append(pageHead('Viết', '汉字', `Luyện chữ Hán ${levelName(ctx, lv)}`, 'Chọn một chữ để xem thứ tự nét, rồi tự viết theo trên ô 田字格 – máy sẽ nhắc khi bạn viết sai nét.'));
  root.append(levelChips(ctx, 'writing/chars', lv));
  let chars;
  try { chars = await getCharacters(lv); } catch (e) { root.append(dataProblem(e, 'Danh sách chữ Hán')); return; }
  if (!ctx.isCurrent()) return;

  const panel = h('div', { class: 'card char-panel' });
  const gridBox = h('div');
  const search = h('input', { class: 'input', type: 'search', placeholder: 'Tìm chữ, pinyin, nghĩa… hoặc gõ chữ bất kỳ để luyện', 'aria-label': 'Tìm chữ' });
  const pager = h('div', { class: 'pager' });
  root.append(h('div', { class: 'char-layout' },
    h('div', null, h('div', { class: 'toolbar' }, search), gridBox, pager),
    panel));

  let writer = null;
  let HanziWriter = null;
  let current = null;
  let page = 0;
  let filtered = chars;
  const done = () => getProgress().chars || {};

  const drawGrid = () => {
    clear(gridBox); clear(pager);
    if (!chars.length) { gridBox.append(dataProblem({ missing: true }, 'Danh sách chữ Hán'), h('p', { class: 'muted small' }, 'Bạn vẫn có thể gõ một chữ bất kỳ vào ô tìm kiếm để luyện.')); return; }
    if (!filtered.length) { gridBox.append(emptyState('无', 'Không có chữ phù hợp. Nhấn Enter để luyện chữ vừa gõ.')); return; }
    const d = done();
    const pages = Math.ceil(filtered.length / PAGE);
    gridBox.append(h('div', { class: 'char-grid' }, filtered.slice(page * PAGE, page * PAGE + PAGE).map((c) =>
      h('button', { class: `char-cell${current?.hanzi === c.hanzi ? ' on' : ''}${d[c.hanzi] ? ' done' : ''}`, lang: 'zh-CN', 'aria-label': `${c.hanzi} ${c.pinyin}`, onclick: () => select(c) }, c.hanzi, h('span', { class: 'py' }, c.pinyin)))));
    if (pages > 1) {
      pager.append(h('button', { class: 'btn sm', disabled: page === 0, onclick: () => { page--; drawGrid(); } }, '‹'), h('span', { class: 'small muted' }, `Trang ${page + 1}/${pages} · ${filtered.length} chữ`), h('button', { class: 'btn sm', disabled: page >= pages - 1, onclick: () => { page++; drawGrid(); } }, '›'));
    } else pager.append(h('span', { class: 'small muted' }, `${filtered.length} chữ · đã tập ${filtered.filter((c) => d[c.hanzi]).length}`));
  };
  search.addEventListener('input', () => {
    const s = search.value.trim().toLowerCase();
    const ns = stripTones(s);
    filtered = !s ? chars : chars.filter((c) => c.hanzi === s || s.includes(c.hanzi) || stripTones(c.pinyin).startsWith(ns) || (c.meaning_vi || '').toLowerCase().includes(s) || (c.han_viet || '').toLowerCase().includes(s));
    page = 0; drawGrid();
  });
  search.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const ch = [...search.value.trim()].find((x) => /[㐀-鿿]/.test(x));
    if (ch) select(chars.find((c) => c.hanzi === ch) || { hanzi: ch, pinyin: '', meaning_vi: '(chữ ngoài danh sách)' });
  });

  const colors = () => {
    const cs = getComputedStyle(document.documentElement);
    return { ink: cs.getPropertyValue('--ink').trim() || '#222', red: cs.getPropertyValue('--red').trim() || '#b8322a', line: cs.getPropertyValue('--line-2').trim() || '#ddd', jade: cs.getPropertyValue('--jade').trim() || '#2d7a5a' };
  };

  async function select(c) {
    current = c;
    drawGrid();
    clear(panel);
    const hwBox = h('div', { class: 'hw' });
    const status = h('div', { class: 'small muted', style: { textAlign: 'center', minHeight: '1.4em' }, 'aria-live': 'polite' });
    const steps = h('div', { class: 'stroke-steps', 'aria-label': 'Thứ tự từng nét' });
    panel.append(
      h('div', { class: 'char-big-meta' }, h('span', { class: 'pyl' }, c.pinyin), h('span', { style: { fontWeight: 600 } }, c.meaning_vi), h('button', { class: 'btn sm round', 'aria-label': 'Nghe', onclick: () => speak(c.hanzi).catch((e) => toast(e.message, 'err')) }, icon('speaker'))),
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
    try {
      HanziWriter = HanziWriter || await loadScript(HW_URL, 'HanziWriter');
    } catch {
      status.append(notice('err', '⚠️', 'Không tải được thư viện Hanzi Writer (cần Internet). Hãy kiểm tra mạng rồi thử lại.'));
      return;
    }
    if (current !== c) return;
    const size = Math.min(300, hwBox.clientWidth || 280);
    const col = colors();
    try { writer?.cancelQuiz?.(); } catch { /* */ }
    writer = HanziWriter.create(hwBox, c.hanzi, {
      width: size, height: size, padding: 12, showOutline: true, showCharacter: true,
      strokeColor: col.ink, radicalColor: col.red, outlineColor: col.line, drawingColor: col.red, highlightColor: col.jade,
      strokeAnimationSpeed: 1, delayBetweenStrokes: 220, drawingWidth: 22,
      onLoadCharDataError: () => { status.textContent = ''; status.append(notice('warn', '🈳', `Chưa có dữ liệu thứ tự nét cho chữ "${c.hanzi}" (hoặc mất mạng). Hãy thử chữ khác.`)); clear(btns); },
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
          drawGrid();
        },
      });
    };
    clear(btns).append(
      h('button', { class: 'btn sm primary', onclick: () => { looping = false; anim(); } }, '▶ Thứ tự nét'),
      h('button', { class: 'btn sm', onclick: () => { looping = !looping; if (looping) anim(); } }, '🔁 Lặp'),
      h('button', { class: 'btn sm ink', onclick: quiz }, '✍️ Tự viết'),
      h('button', { class: 'btn sm', onclick: () => { looping = false; writer.cancelQuiz(); writer.showCharacter(); status.textContent = ''; } }, '↺'));
    // các bước nét
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

  drawGrid();
  if (chars.length) select(chars[0]);
  return () => { try { writer?.cancelQuiz?.(); } catch { /* */ } };
}
