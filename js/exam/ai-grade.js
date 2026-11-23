// Chấm câu tự luận (viết câu, viết đoạn, dịch, nói) bằng Gemini.
import { generate, rubricText } from '../gemini.js';

const TYPE_VI = {
  write_sentence: 'đặt câu với từ cho sẵn',
  write_essay: 'viết đoạn văn/bài luận',
  picture_story_writing: 'viết đoạn văn kể chuyện theo tranh',
  chart_description: 'viết đoạn văn mô tả biểu đồ',
  translate_written: 'dịch viết',
  translate_oral: 'dịch nói (视译), văn bản do nhận dạng giọng nói chuyển thành',
};

export async function gradeOpenAI(q, answer, { level, rubric } = {}) {
  const max = q.max_points || 10;
  const samples = [...(q.sample_answers || []), q.sample_answer?.zh || q.sample_answer].filter((x) => typeof x === 'string');
  const src = q.source || q.source_text || q.text;
  const kws = [q.keyword?.zh, ...(q.keywords || []).map((k) => (typeof k === 'string' ? k : k?.zh))].filter(Boolean);
  const r = rubric || q.rubric;
  const prompt = [
    `Bạn là giám khảo HSK chấm bài cho học viên người Việt (trình độ HSK ${level ?? q.level ?? ''}). Dạng bài: ${TYPE_VI[q.type] || q.type}.`,
    q.prompt_vi ? `Yêu cầu (tiếng Việt): ${q.prompt_vi}` : '',
    q.prompt_zh ? `Yêu cầu (tiếng Trung): ${q.prompt_zh}` : '',
    src ? `Văn bản nguồn: ${typeof src === 'string' ? src : JSON.stringify(src)}` : '',
    q.image ? `Hình minh họa: ${q.image.alt_vi}` : '',
    Array.isArray(q.images) ? `Chuỗi tranh: ${q.images.map((i, k) => `${k + 1}) ${i.alt_vi}`).join('; ')}` : '',
    q.chart ? `Dữ liệu biểu đồ: ${JSON.stringify(q.chart)}` : '',
    kws.length ? `Từ bắt buộc dùng: ${kws.join('、')}` : '',
    q.min_chars ? `Độ dài tối thiểu: ${q.min_chars} chữ Hán.` : '',
    samples.length ? `Đáp án mẫu tham khảo: ${samples.join(' | ')}` : '',
    r ? `Tiêu chí chấm (rubric):\n${rubricText(r)}` : 'Tiêu chí: ngữ pháp, dùng đúng từ khóa, đúng yêu cầu đề, độ tự nhiên, độ dài.',
    `Bài làm của học viên: """${answer}"""`,
    `Chấm thang 0–10 (score). Viết nhận xét ngắn gọn, cụ thể, thân thiện BẰNG TIẾNG VIỆT, chỉ ra lỗi và cách sửa.`,
    `Trả về DUY NHẤT JSON: {"score": số 0-10, "criteria": {${r ? r.criteria.map((c) => `"${c.key}": số 0-10`).join(', ') : ''}}, "corrected_zh": "bài đã sửa (tiếng Trung)", "pinyin": "pinyin của bài đã sửa", "feedback_vi": "nhận xét tiếng Việt"}`,
  ].filter(Boolean).join('\n');
  const res = await generate({ prompt, temperature: 0.3 });
  let score = Number(res.score);
  if (!Number.isFinite(score) && r && res.criteria) score = r.criteria.reduce((s, c) => s + (Number(res.criteria[c.key]) || 0) * c.weight, 0);
  score = Math.max(0, Math.min(10, Number.isFinite(score) ? score : 0));
  const points = Math.round((score / 10) * max * 10) / 10;
  return { correct: score >= 6, score: points, max, ai: { ...res, score } };
}
