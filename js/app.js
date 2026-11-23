// Khởi động ứng dụng + router hash.
import { h, clear, notice, toast } from './ui.js';
import { getSettings, setSettings, onSettings } from './settings.js';
import { getLevels, levelKey, DATA_BASE } from './data.js';
import { stopSpeaking } from './tts.js';

const NAV = [
  { group: null, items: [
    { href: '#/', zh: '家', label: 'Trang chủ', match: /^$/ },
    { href: '#/vocab', zh: '词', label: 'Từ vựng', match: /^vocab/ },
  ] },
  { group: 'Bốn kỹ năng', items: [
    { href: '#/listening', zh: '听', label: 'Nghe', match: /^listening/ },
    { href: '#/speaking', zh: '说', label: 'Nói', match: /^speaking/ },
    { href: '#/reading', zh: '读', label: 'Đọc', match: /^reading/ },
    { href: '#/writing', zh: '写', label: 'Viết', match: /^writing/ },
  ] },
  { group: 'Thi & theo dõi', items: [
    { href: '#/exam', zh: '考', label: 'Thi thử', match: /^exam/ },
    { href: '#/progress', zh: '进', label: 'Tiến độ', match: /^progress/ },
    { href: '#/settings', zh: '设', label: 'Cài đặt', match: /^settings/ },
  ] },
];

// [pattern, module, tên tham số]
const ROUTES = [
  [/^$/, 'home'],
  [/^vocab(?:\/([^/]+))?$/, 'vocab', ['level']],
  [/^exam$/, 'exams'],
  [/^exam\/([^/]+)$/, 'exam', ['id']],
  [/^listening(?:\/([^/]+))?$/, 'skill', ['level'], { skill: 'listening' }],
  [/^reading(?:\/([^/]+))?$/, 'skill', ['level'], { skill: 'reading' }],
  [/^writing$/, 'writing-hub'],
  [/^writing\/chars(?:\/([^/]+))?$/, 'writing-chars', ['level']],
  [/^writing\/practice(?:\/([^/]+))?$/, 'writing-practice', ['level']],
  [/^speaking$/, 'speaking-hub'],
  [/^speaking\/chat$/, 'chat'],
  [/^speaking\/shadowing$/, 'shadowing'],
  [/^speaking\/hskk$/, 'hskk'],
  [/^progress$/, 'progress'],
  [/^settings$/, 'settings'],
];

const main = document.getElementById('main');
let cleanup = null;
let renderSeq = 0;
let levels = [];

export function currentLevel() {
  const s = getSettings();
  if (levels.some((l) => levelKey(l) === String(s.level))) return String(s.level);
  return levels.length ? levelKey(levels[0]) : '1';
}
export const allLevels = () => levels;
export const navigate = (hash) => { if (location.hash !== hash) location.hash = hash; else route(); };

function currentPath() {
  return decodeURIComponent((location.hash || '#/').replace(/^#\/?/, '').replace(/\/+$/, '').split('?')[0]);
}

function buildNav() {
  const nav = document.getElementById('nav');
  clear(nav);
  for (const g of NAV) {
    if (g.group) nav.append(h('div', { class: 'nav-group' }, g.group));
    for (const it of g.items) nav.append(h('a', { href: it.href, 'data-match': it.match.source }, h('span', { class: 'ni', 'aria-hidden': 'true' }, it.zh), it.label));
  }
}

function markNav(path) {
  for (const a of document.querySelectorAll('#nav a')) {
    const on = new RegExp(a.dataset.match).test(path);
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
}

async function route() {
  const seq = ++renderSeq;
  const path = currentPath();
  closeMenu();
  markNav(path);
  if (cleanup) { try { cleanup(); } catch (e) { console.warn(e); } cleanup = null; }
  stopSpeaking();
  let found = null;
  for (const [re, mod, names = [], extra = {}] of ROUTES) {
    const m = re.exec(path);
    if (m) {
      const params = { ...extra };
      names.forEach((n, i) => { if (m[i + 1] != null) params[n] = m[i + 1]; });
      found = { mod, params };
      break;
    }
  }
  const container = h('div', { class: 'page' });
  clear(main).append(container);
  if (!found) {
    container.append(h('div', { class: 'empty' }, h('span', { class: 'zh-serif' }, '迷路'), h('h2', null, 'Không tìm thấy trang'), h('p', null, 'Đường dẫn này không tồn tại.'), h('a', { class: 'btn primary', href: '#/' }, 'Về trang chủ')));
    return;
  }
  // Nếu route có tham số level mà người dùng chọn cấp ở URL → đồng bộ lựa chọn
  if (found.params.level && levels.some((l) => levelKey(l) === found.params.level) && found.params.level !== currentLevel()) {
    setSettings({ level: found.params.level });
    syncLevelSelect();
  }
  container.append(h('div', { class: 'boot' }, h('span', { class: 'spinner' }), 'Đang tải…'));
  try {
    const mod = await import(`./pages/${found.mod}.js`);
    if (seq !== renderSeq) return;
    clear(container);
    const ctx = { level: found.params.level || currentLevel(), levels, navigate, isCurrent: () => seq === renderSeq };
    const c = await mod.render(container, found.params, ctx);
    if (seq !== renderSeq) { if (typeof c === 'function') c(); return; }
    cleanup = typeof c === 'function' ? c : null;
  } catch (e) {
    if (seq !== renderSeq) return;
    console.warn(e);
    clear(container).append(h('div', { class: 'card' },
      notice('err', '⚠️', h('p', null, h('strong', null, 'Không mở được trang này. ')), h('p', null, e.message || String(e))),
      h('div', { class: 'row', style: { marginTop: '14px' } },
        h('button', { class: 'btn primary', onclick: () => route() }, 'Thử lại'),
        h('a', { class: 'btn', href: '#/' }, 'Về trang chủ'))));
  }
  try { main.focus({ preventScroll: true }); } catch { /* */ }
  window.scrollTo(0, 0);
}

// ---------- Topbar ----------
function syncLevelSelect() {
  const sel = document.getElementById('levelSelect');
  clear(sel);
  for (const l of levels) sel.append(h('option', { value: levelKey(l) }, l.name_vi || `HSK ${l.level}`));
  sel.value = currentLevel();
  sel.parentElement.hidden = !levels.length;
}

function setupTopbar() {
  const sel = document.getElementById('levelSelect');
  sel.addEventListener('change', () => {
    setSettings({ level: sel.value });
    const path = currentPath();
    const m = /^(vocab|listening|reading|writing\/chars|writing\/practice)(\/[^/]+)?$/.exec(path);
    if (m) navigate(`#/${m[1]}/${encodeURIComponent(sel.value)}`); else route();
    toast(`Đã chuyển sang ${sel.selectedOptions[0]?.textContent}`);
  });
  const py = document.getElementById('pinyinToggle');
  const applyPy = () => {
    const on = getSettings().showPinyin !== false;
    document.documentElement.classList.toggle('hide-pinyin', !on);
    py.setAttribute('aria-pressed', String(on));
  };
  py.addEventListener('click', () => setSettings({ showPinyin: getSettings().showPinyin === false }));
  const th = document.getElementById('themeToggle');
  th.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    setSettings({ theme: cur === 'dark' ? 'light' : 'dark' });
  });
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
  const applyTheme = () => {
    let t = getSettings().theme || 'auto';
    if (t === 'auto') t = mq?.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
  };
  mq?.addEventListener?.('change', applyTheme);
  onSettings((s, patch) => {
    if ('showPinyin' in patch) applyPy();
    if ('theme' in patch) applyTheme();
    if ('level' in patch) { const sel = document.getElementById('levelSelect'); if (sel && sel.value !== String(patch.level)) sel.value = currentLevel(); }
  });
  applyPy(); applyTheme();
  // menu mobile
  const btn = document.getElementById('menuBtn');
  btn.addEventListener('click', () => (document.getElementById('sidebar').classList.contains('open') ? closeMenu() : openMenu()));
  document.getElementById('scrim').addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
}
function openMenu() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('scrim').hidden = false;
  document.getElementById('menuBtn').setAttribute('aria-expanded', 'true');
}
function closeMenu() {
  document.getElementById('sidebar')?.classList.remove('open');
  const s = document.getElementById('scrim'); if (s) s.hidden = true;
  document.getElementById('menuBtn')?.setAttribute('aria-expanded', 'false');
}

async function start() {
  buildNav();
  setupTopbar();
  try {
    levels = await getLevels();
  } catch (e) {
    console.warn(e);
    levels = [];
    toast('Không tải được danh sách cấp độ (' + DATA_BASE + 'index.json).', 'err');
  }
  syncLevelSelect();
  window.addEventListener('hashchange', route);
  route();
}

start();
