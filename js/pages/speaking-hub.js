import { h, pageHead, notice } from '../ui.js';
import { recognitionSupported, SR_UNSUPPORTED_MSG } from '../speech.js';
import { hasKey } from '../settings.js';

export async function render(root) {
  root.append(pageHead('Nói', '口语', 'Luyện nói', 'Ba cách luyện nói: trò chuyện với AI, nhại theo người bản xứ (shadowing) và làm đề thi nói có chấm điểm.'));
  if (!recognitionSupported()) root.append(h('div', { style: { marginBottom: '16px' } }, notice('warn', '🎙', SR_UNSUPPORTED_MSG)));
  root.append(h('div', { class: 'grid c3' },
    card('#/speaking/chat', '聊', '对话', 'Hội thoại với AI', ['AI đóng vai theo chủ đề', 'Nói hoặc gõ, AI đọc to câu trả lời', 'Pinyin + dịch, sửa lỗi bằng tiếng Việt'], !hasKey() ? 'Cần API key' : null),
    card('#/speaking/shadowing', '影', '跟读', 'Shadowing', ['Nghe mẫu TTS hoặc video YouTube', 'Lặp đoạn, chỉnh tốc độ, ghi âm', 'Tô màu chữ đúng/sai, % khớp']),
    card('#/speaking/hskk', '考', '口试', 'Thi nói HSK', ['Đề nói HSK 3.0 theo cấp + HSKK', 'Đếm giờ chuẩn bị / trả lời', 'AI chấm theo tiêu chí, nhận xét tiếng Việt'])));
}

function card(href, glyph, zh, title, items, badge) {
  return h('a', { class: 'card skill-card', href }, h('span', { class: 'glyph' }, glyph), h('div', { class: 'zhname' }, zh), h('h3', null, title, badge ? h('span', { class: 'badge gold', style: { marginLeft: '8px', verticalAlign: '3px' } }, badge) : null), h('ul', null, items.map((i) => h('li', null, i))));
}
