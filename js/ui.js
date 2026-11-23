// Tiện ích DOM nhỏ gọn.
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv; } }
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k in el && typeof v !== 'string') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

export function toast(msg, type = '') {
  const box = document.getElementById('toasts');
  if (!box) return;
  const t = h('div', { class: `toast ${type}`, role: 'status' }, msg);
  box.append(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 3600);
  setTimeout(() => t.remove(), 4000);
}

export function notice(type, icon, ...content) {
  return h('div', { class: `notice ${type}`, role: type === 'err' ? 'alert' : null }, h('span', { class: 'ic', 'aria-hidden': 'true' }, icon), h('div', null, ...content));
}

export function modal(contentFn) {
  return new Promise((resolve) => {
    const close = (v) => { wrap.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') close(null); };
    const box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' });
    const wrap = h('div', { class: 'modal-wrap', onclick: (e) => { if (e.target === wrap) close(null); } }, box);
    box.append(contentFn(close));
    document.body.append(wrap);
    document.addEventListener('keydown', onKey);
    const f = box.querySelector('input,textarea,button.primary,button');
    if (f) setTimeout(() => f.focus(), 30);
  });
}

export function confirmDialog(title, text, okLabel = 'Đồng ý', danger = false) {
  return modal((close) => h('div', null,
    h('h3', null, title),
    h('p', { class: 'muted' }, text),
    h('div', { class: 'row end' },
      h('button', { class: 'btn ghost', onclick: () => close(false) }, 'Hủy'),
      h('button', { class: `btn ${danger ? 'ink' : 'primary'}`, onclick: () => close(true) }, okLabel)),
  )).then((v) => !!v);
}

// Text {zh, pinyin, vi} → khối hiển thị
export function textBlock(t, { pinyin = true, vi = false, cls = '', blank = null, forcePinyin = false } = {}) {
  if (!t) return null;
  if (typeof t === 'string') t = { zh: t };
  const zh = h('div', { class: 'zh', lang: 'zh-CN' });
  if (blank) renderWithBlank(zh, t.zh || '', blank); else zh.textContent = t.zh || '';
  return h('div', { class: `text-block ${cls}` },
    pinyin && t.pinyin ? h('span', { class: `py${forcePinyin ? ' py-force' : ''}` }, t.pinyin) : null,
    zh,
    vi && t.vi ? h('span', { class: 'vi' }, t.vi) : null);
}

export const BLANK = '（ ）';
function renderWithBlank(el, s, blankNodeFn) {
  const parts = s.split(BLANK);
  parts.forEach((p, i) => {
    el.append(document.createTextNode(p));
    if (i < parts.length - 1) el.append(blankNodeFn());
  });
}

export function imageBox(img, large = false) {
  if (!img) return null;
  return h('div', { class: `img-box${large ? ' lg' : ''}`, role: 'img', 'aria-label': img.alt_vi || '' },
    h('span', { class: 'emo', 'aria-hidden': 'true' }, img.emoji || '🖼️'),
    h('span', { class: 'alt' }, img.alt_vi || ''));
}

export function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function fmtDate(iso) {
  try { return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }); } catch { return iso; }
}

export function pageHead(kicker, zh, title, desc, right) {
  return h('header', { class: 'page-head' },
    h('div', null,
      h('div', { class: 'kicker' }, h('span', { class: 'zh' }, zh), kicker),
      h('h1', null, title),
      desc ? h('p', null, desc) : null),
    right || null);
}

export function emptyState(zh, msg, ...extra) {
  return h('div', { class: 'empty' }, h('span', { class: 'zh-serif' }, zh), h('p', null, msg), ...extra);
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function icon(name) {
  const paths = {
    play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
    pause: '<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/>',
    mic: '<path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-2.1A7 7 0 0 0 19 12z" fill="currentColor"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
    speaker: '<path d="M4 9v6h4l5 4V5L8 9zm12.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4z" fill="currentColor"/>',
    send: '<path d="M3 20l18-8L3 4v6l12 2-12 2z" fill="currentColor"/>',
    loop: '<path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z" fill="currentColor"/>',
  };
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', '18'); s.setAttribute('height', '18'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = paths[name] || '';
  return s;
}

export function loadScript(src, globalName) {
  if (globalName && window[globalName]) return Promise.resolve(window[globalName]);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`);
    const s = existing || h('script', { src, async: true, 'data-src': src });
    s.addEventListener('load', () => resolve(globalName ? window[globalName] : true));
    s.addEventListener('error', () => reject(new Error('Không tải được thư viện: ' + src)));
    if (!existing) document.head.append(s);
  });
}
