// Máy trung gian AI cho "Tiếng Trung không khó" (Cloudflare Worker).
// Giữ API key Gemini bí mật ở máy chủ; người dùng web không cần key riêng.
//
// Cài đặt trong Cloudflare (Settings → Variables and Secrets):
//   GEMINI_API_KEY  (Secret)  — key Gemini của chủ web, bắt buộc
//   ALLOWED_ORIGIN  (Text)    — vd https://thienbeso0409.github.io  (mặc định giá trị này)
//   DAILY_LIMIT     (Text)    — số lượt AI tối đa mỗi người/ngày, mặc định 60
// Tùy chọn: thêm KV namespace với tên biến RL để giới hạn lượt chính xác hơn.

const DEFAULT_ORIGIN = 'https://thienbeso0409.github.io';
const ALLOWED_MODELS = /^gemini-[a-z0-9.\-]+$/i;
const MAX_BODY = 200_000; // byte
const memCount = new Map(); // dự phòng khi không có KV (chỉ tương đối)

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

async function overLimit(env, ip, limit) {
  const day = new Date().toISOString().slice(0, 10);
  const k = `rl:${day}:${ip}`;
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
    if (!env.GEMINI_API_KEY) return json({ error: { message: 'Máy trung gian chưa được cài GEMINI_API_KEY' } }, 500, h);

    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ error: { message: 'Yêu cầu quá lớn' } }, 413, h);
    let req;
    try { req = JSON.parse(raw); } catch { return json({ error: { message: 'JSON không hợp lệ' } }, 400, h); }
    const model = String(req.model || 'gemini-2.5-flash').replace(/^models\//, '');
    if (!ALLOWED_MODELS.test(model)) return json({ error: { message: 'Model không hợp lệ' } }, 400, h);
    if (!req.body || !Array.isArray(req.body.contents)) return json({ error: { message: 'Thiếu nội dung' } }, 400, h);

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
