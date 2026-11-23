// Máy trung gian AI cho "Tiếng Trung không khó" (Cloudflare Worker).
// Giữ API key Gemini bí mật ở máy chủ; người dùng web không cần key riêng.
//
// Cài đặt trong Cloudflare (Settings → Variables and Secrets):
//   GEMINI_API_KEY  (Secret)  — key Gemini của chủ web, bắt buộc
//   ALLOWED_ORIGIN  (Text)    — vd https://thienbeso0409.github.io  (mặc định giá trị này)
//   DAILY_LIMIT     (Text)    — số lượt AI tối đa mỗi người/ngày, mặc định 60
//   YOUTUBE_API_KEY (Secret)  — tùy chọn: bật tìm video YouTube ngay trong web (YouTube Data API v3)
//   YT_DAILY_LIMIT  (Text)    — số lượt tìm video mỗi người/ngày, mặc định 20
// Tùy chọn: thêm KV namespace với tên biến RL để giới hạn lượt chính xác hơn.

const DEFAULT_ORIGIN = 'https://thienbeso0409.github.io';
const ALLOWED_MODELS = /^gemini-[a-z0-9.\-]+$/i;
const MAX_BODY = 200_000; // byte
const memCount = new Map(); // dự phòng khi không có KV (chỉ tương đối)
const ytCache = new Map(); // q → {t, data}: giảm tốn quota YouTube (100 đơn vị/lượt tìm)
const YT_URI = /^https:\/\/(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[A-Za-z0-9_-]{11}([&?#].*)?$/;

// Chỉ cho phép part văn bản hoặc file_data là link YouTube công khai
function badPart(contents) {
  for (const c of contents) {
    for (const part of c?.parts || []) {
      const fd = part.file_data || part.fileData;
      if (fd) {
        const uri = fd.file_uri || fd.fileUri || '';
        if (!YT_URI.test(uri)) return 'Chỉ cho phép file_data là link YouTube';
      }
      if (part.inline_data || part.inlineData) return 'Không hỗ trợ inline_data qua máy trung gian';
    }
  }
  return null;
}

async function ytSearch(req, env, ip, h) {
  if (!env.YOUTUBE_API_KEY) return json({ error: { status: 'NO_YOUTUBE_KEY', message: 'Máy trung gian chưa bật tìm video YouTube.' } }, 501, h);
  const q = String(req.q || '').trim().slice(0, 100);
  if (!q) return json({ error: { message: 'Thiếu từ khóa tìm kiếm' } }, 400, h);
  const max = Math.min(25, Math.max(1, parseInt(req.maxResults || '12', 10) || 12));
  const ck = `${q}|${max}`;
  const hit = ytCache.get(ck);
  if (hit && Date.now() - hit.t < 6 * 3600e3) return json(hit.data, 200, h);
  const limit = parseInt(env.YT_DAILY_LIMIT || '20', 10);
  if (await overLimit(env, ip, limit, 'yt')) return json({ error: { status: 'DAILY_LIMIT', message: `Bạn đã tìm video ${limit} lần hôm nay. Hãy dán link YouTube trực tiếp hoặc quay lại ngày mai.` } }, 429, h);
  const u = new URL('https://www.googleapis.com/youtube/v3/search');
  const params = { part: 'snippet', type: 'video', videoEmbeddable: 'true', relevanceLanguage: 'zh', safeSearch: 'strict', maxResults: String(max), q, key: env.YOUTUBE_API_KEY };
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u.toString());
  let d = null;
  try { d = await r.json(); } catch { /* */ }
  if (!r.ok) {
    const quota = /quota/i.test(d?.error?.message || '') || r.status === 403;
    return json({ error: { status: quota ? 'YT_QUOTA' : 'YT_ERROR', message: quota ? 'Hạn mức tìm kiếm YouTube hôm nay đã hết. Hãy dán link trực tiếp.' : 'YouTube báo lỗi khi tìm kiếm.' } }, quota ? 429 : 502, h);
  }
  const items = (d?.items || []).filter((it) => it.id?.videoId).map((it) => ({
    videoId: it.id.videoId,
    title: it.snippet?.title || '',
    channel: it.snippet?.channelTitle || '',
    publishedAt: it.snippet?.publishedAt || '',
    description: (it.snippet?.description || '').slice(0, 160),
    thumbnail: it.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${it.id.videoId}/mqdefault.jpg`,
  }));
  const data = { items };
  ytCache.set(ck, { t: Date.now(), data });
  if (ytCache.size > 500) ytCache.clear();
  return json(data, 200, h);
}

function cors(origin, allowed) {
  const ok = origin === allowed || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });
}

async function overLimit(env, ip, limit, prefix = 'rl') {
  const day = new Date().toISOString().slice(0, 10);
  const k = `${prefix}:${day}:${ip}`;
  if (env.RL) {
    const n = parseInt((await env.RL.get(k)) || '0', 10) + 1;
    await env.RL.put(k, String(n), { expirationTtl: 90000 });
    return n > limit;
  }
  const n = (memCount.get(k) || 0) + 1;
  memCount.set(k, n);
  if (memCount.size > 5000) memCount.clear();
  return n > limit;
}

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGIN || DEFAULT_ORIGIN).replace(/\/$/, '');
    const origin = request.headers.get('Origin') || '';
    const h = cors(origin, allowed);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (request.method === 'GET') return json({ ok: true, service: 'ttkk-ai' }, 200, h);
    if (request.method !== 'POST') return json({ error: { message: 'Method not allowed' } }, 405, h);
    if (origin && h['Access-Control-Allow-Origin'] !== origin) return json({ error: { message: 'Origin không được phép' } }, 403, h);
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ error: { message: 'Yêu cầu quá lớn' } }, 413, h);
    let req;
    try { req = JSON.parse(raw); } catch { return json({ error: { message: 'JSON không hợp lệ' } }, 400, h); }
    const ipAddr = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (req.action === 'yt_search') return ytSearch(req, env, ipAddr, h);
    if (req.action != null && req.action !== 'generate') return json({ error: { message: 'action không hợp lệ' } }, 400, h);
    if (!env.GEMINI_API_KEY) return json({ error: { message: 'Máy trung gian chưa được cài GEMINI_API_KEY' } }, 500, h);
    const model = String(req.model || 'gemini-2.5-flash').replace(/^models\//, '');
    if (!ALLOWED_MODELS.test(model)) return json({ error: { message: 'Model không hợp lệ' } }, 400, h);
    if (!req.body || !Array.isArray(req.body.contents)) return json({ error: { message: 'Thiếu nội dung' } }, 400, h);
    const bp = badPart(req.body.contents);
    if (bp) return json({ error: { message: bp } }, 400, h);

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const limit = parseInt(env.DAILY_LIMIT || '60', 10);
    if (await overLimit(env, ip, limit)) {
      return json({ error: { status: 'DAILY_LIMIT', message: `Bạn đã dùng hết ${limit} lượt AI chung hôm nay. Hãy quay lại ngày mai, hoặc dán key Gemini riêng trong Cài đặt để dùng không giới hạn.` } }, 429, h);
    }

    const body = {
      contents: req.body.contents,
      generationConfig: req.body.generationConfig || {},
      ...(req.body.systemInstruction ? { systemInstruction: req.body.systemInstruction } : {}),
    };
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify(body),
    });
    const text = await upstream.text();
    return new Response(text, { status: upstream.status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...h } });
  },
};
