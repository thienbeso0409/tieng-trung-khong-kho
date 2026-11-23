// Gọi Google Gemini REST trực tiếp từ trình duyệt bằng API key của người dùng.
import { getSettings } from './settings.js';
import { SHARED_AI_URL } from './config.js';

const API = 'https://generativelanguage.googleapis.com/v1beta/models/';

export class GeminiError extends Error {
  constructor(message, status, code) { super(message); this.status = status; this.code = code; }
}

function friendlyError(status, body) {
  const msg = body?.error?.message || '';
  const reason = body?.error?.status || '';
  if (status === 400 && /API key not valid|API_KEY_INVALID/i.test(msg)) return 'API key không hợp lệ. Hãy kiểm tra lại key trong Cài đặt (dán đủ, không thừa khoảng trắng).';
  if (status === 400 && /location is not supported|User location/i.test(msg)) return 'Gemini API chưa hỗ trợ khu vực của bạn từ trình duyệt này.';
  if (status === 400) return 'Yêu cầu tới Gemini bị từ chối (400). ' + (msg ? 'Chi tiết: ' + msg : '');
  if (status === 401 || status === 403) return 'Key không có quyền dùng Gemini API (403). Hãy tạo key mới tại aistudio.google.com và bật Generative Language API.';
  if (status === 404) return `Không tìm thấy model "${getSettings().geminiModel}". Hãy chọn model khác trong Cài đặt (vd gemini-2.5-flash).`;
  if (status === 429) return 'Bạn đã dùng hết hạn mức miễn phí tạm thời của Gemini (429). Đợi khoảng 1 phút rồi thử lại, hoặc chọn model nhẹ hơn (gemini-2.5-flash-lite).';
  if (status >= 500) return 'Máy chủ Gemini đang bận hoặc lỗi (' + status + '). Thử lại sau ít phút.';
  return `Lỗi Gemini (${status} ${reason}). ${msg}`;
}

// contents: [{role:'user'|'model', parts:[{text}]}]
export async function generate({ system, contents, prompt, json = true, temperature = 0.7, maxTokens = 8192, signal, key, model } = {}) {
  const s = getSettings();
  const apiKey = (key ?? s.geminiKey ?? '').trim();
  const useShared = !apiKey && !!SHARED_AI_URL;
  if (!apiKey && !useShared) throw new GeminiError('Chưa có API key Gemini. Vào Cài đặt để dán key miễn phí.', 0, 'NO_KEY');
  const m = (model || s.geminiModel || 'gemini-2.5-flash').trim().replace(/^models\//, '');
  const body = {
    contents: contents || [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  };
  if (json) body.generationConfig.responseMimeType = 'application/json';
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  let res;
  try {
    res = useShared
      ? await fetch(SHARED_AI_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: m, body }),
          signal,
        })
      : await fetch(API + encodeURIComponent(m) + ':generateContent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify(body),
          signal,
        });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new GeminiError('Không kết nối được tới Gemini. Kiểm tra mạng Internet.', 0, 'NETWORK');
  }
  let data = null;
  try { data = await res.json(); } catch { /* */ }
  if (!res.ok) {
    if (useShared && data?.error?.status === 'DAILY_LIMIT') throw new GeminiError(data.error.message, 429, 'DAILY_LIMIT');
    if (useShared && res.status === 429) throw new GeminiError('AI chung đang quá tải vì nhiều người dùng cùng lúc. Đợi 1 phút rồi thử lại, hoặc dán key Gemini riêng trong Cài đặt.', 429);
    if (useShared && (res.status === 400 || res.status === 403) && /API key/i.test(data?.error?.message || '')) throw new GeminiError('Máy chủ AI chung đang gặp sự cố cấu hình. Bạn có thể dán key Gemini riêng trong Cài đặt để dùng tạm.', res.status);
    throw new GeminiError(friendlyError(res.status, data), res.status);
  }
  const cand = data?.candidates?.[0];
  if (!cand) {
    const block = data?.promptFeedback?.blockReason;
    throw new GeminiError(block ? 'Gemini từ chối trả lời nội dung này (' + block + ').' : 'Gemini không trả về kết quả.', 200, 'EMPTY');
  }
  const text = (cand.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('').trim();
  if (!text) throw new GeminiError(cand.finishReason === 'MAX_TOKENS' ? 'Câu trả lời của AI bị cắt do quá dài. Thử lại.' : 'AI trả về rỗng. Thử lại.', 200, 'EMPTY');
  if (!json) return text;
  return parseJSONLoose(text);
}

export function parseJSONLoose(text) {
  let t = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try { return JSON.parse(t); } catch { /* thử cắt đoạn {...} */ }
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch { /* */ } }
  throw new GeminiError('AI trả về dữ liệu không đúng định dạng. Hãy thử lại.', 200, 'BAD_JSON');
}

export async function testKey(key, model) {
  const r = await generate({ key, model, prompt: 'Trả về JSON {"ok": true, "zh": "你好"}', temperature: 0, maxTokens: 2048 });
  return r;
}

// ---------- Prompt dựng sẵn ----------
export function chatSystemPrompt(topic, levelName) {
  const vocab = (topic.key_vocab || []).map((v) => `${v.hanzi}(${v.pinyin}: ${v.vi})`).join('、');
  return [
    `Bạn là bạn luyện nói tiếng Trung cho người Việt đang học ${levelName || 'HSK ' + topic.level}.`,
    `Vai của bạn (luôn giữ vai, nói bằng tiếng Trung giản thể): ${topic.ai_role_zh}`,
    `Tình huống: ${topic.scenario_vi}. Mục tiêu người học: ${(topic.goals_vi || []).join('; ')}.`,
    `Từ vựng trọng tâm nên dùng: ${vocab}.`,
    `Quy tắc: câu ngắn (1–2 câu), chỉ dùng từ vựng và ngữ pháp trong phạm vi HSK ${topic.level} trở xuống; luôn kết thúc bằng một câu hỏi hoặc gợi ý để người học nói tiếp; tự nhiên, thân thiện.`,
    `Nếu câu gần nhất của người học có lỗi (ngữ pháp, từ, trật tự, hoặc người học nói tiếng Việt), ghi nhận xét ngắn bằng tiếng Việt trong "correction_vi" kèm câu đúng; nếu không có lỗi để null.`,
    `Luôn trả về DUY NHẤT JSON: {"zh": "câu trả lời tiếng Trung", "pinyin": "pinyin có dấu thanh", "vi": "dịch tiếng Việt", "correction_vi": "nhận xét lỗi hoặc null"}.`,
  ].join('\n');
}

export function rubricText(rubric) {
  return (rubric?.criteria || []).map((c) => `- ${c.key} (${c.name_vi}, trọng số ${c.weight}): ${c.description_vi || ''}`).join('\n');
}
