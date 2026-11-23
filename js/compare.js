// So khớp chuỗi Hán tự (chấm cơ bản, không cần AI).
const PUNCT = /[\s，。？！、：；“”‘’「」『』（）《》〈〉【】…—·,.?!:;"'()\[\]<>\-~～]/g;
export const normalize = (s) => String(s || '').replace(PUNCT, '').toLowerCase();

// Chuẩn hóa thêm cho nhận dạng giọng nói: chữ số Ả Rập → chữ Hán đơn giản.
const DIGITS = { 0: '零', 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九' };
export function normalizeSpoken(s) {
  return normalize(s).replace(/\d+/g, (num) => {
    const n = parseInt(num, 10);
    if (n >= 10 && n < 100) {
      const t = Math.floor(n / 10), u = n % 10;
      return (t > 1 ? DIGITS[t] : '') + '十' + (u ? DIGITS[u] : '');
    }
    return [...num].map((d) => DIGITS[d]).join('');
  }).replace(/两/g, '二');
}

// LCS + đánh dấu ký tự của chuỗi mẫu có khớp hay không.
export function lcsAlign(ref, hyp) {
  const a = [...ref], b = [...hyp];
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const matched = new Array(n).fill(false);
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { matched[i] = true; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
  }
  return { length: dp[0][0], matched };
}

// Tỷ lệ khớp 0..1 = LCS / độ dài mẫu (sau khi bỏ dấu câu, khoảng trắng).
export function matchRatio(reference, spoken) {
  const r = normalizeSpoken(reference), s = normalizeSpoken(spoken);
  if (!r.length) return 0;
  return lcsAlign(r, s).length / r.length;
}

// Tô màu từng ký tự của câu mẫu: trả về mảng {ch, ok, punct}
export function markChars(reference, spoken) {
  const s = normalizeSpoken(spoken);
  const chars = [...String(reference || '')];
  const core = [];
  chars.forEach((ch, idx) => { if (normalizeSpoken(ch)) core.push(idx); });
  const coreStr = core.map((idx) => normalizeSpoken(chars[idx])).join('');
  const { matched } = lcsAlign(coreStr, s);
  const okSet = new Set(core.filter((_, k) => matched[k]));
  return chars.map((ch, idx) => ({ ch, punct: !normalizeSpoken(ch), ok: okSet.has(idx) }));
}

export function keywordRatio(keywords, text) {
  if (!Array.isArray(keywords) || !keywords.length) return { ratio: 0, hit: [], miss: [] };
  const t = normalizeSpoken(text);
  const hit = keywords.filter((k) => t.includes(normalizeSpoken(k)));
  return { ratio: hit.length / keywords.length, hit, miss: keywords.filter((k) => !hit.includes(k)) };
}

export function countHan(s) { return (String(s || '').match(/[㐀-鿿]/g) || []).length; }

// Bỏ dấu thanh pinyin để tìm kiếm.
export function stripTones(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ü/g, 'u').replace(/ /g, '').toLowerCase();
}
