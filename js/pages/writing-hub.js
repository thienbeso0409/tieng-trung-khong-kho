import { h, pageHead } from '../ui.js';
import { levelName } from './common.js';

export async function render(root, params, ctx) {
  const lv = encodeURIComponent(ctx.level);
  root.append(pageHead('Viết', '书写', 'Luyện viết', `Tập viết chữ Hán đúng thứ tự nét và làm bài viết theo dạng đề ${levelName(ctx, ctx.level)}.`));
  root.append(h('div', { class: 'grid c2' },
    h('a', { class: 'card skill-card', href: `#/writing/chars/${lv}` }, h('span', { class: 'glyph' }, '永'), h('div', { class: 'zhname' }, '汉字'), h('h3', null, 'Luyện chữ Hán'),
      h('ul', null, h('li', null, 'Xem animation thứ tự nét'), h('li', null, 'Tự viết trên ô 田字格, máy chấm từng nét'), h('li', null, 'Pinyin, nghĩa, bộ thủ, số nét'))),
    h('a', { class: 'card skill-card', href: `#/writing/practice/${lv}` }, h('span', { class: 'glyph' }, '文'), h('div', { class: 'zhname' }, '写作'), h('h3', null, 'Bài viết dạng HSK'),
      h('ul', null, h('li', null, 'Sắp xếp câu, viết chữ theo pinyin, chọn bộ kiện'), h('li', null, 'Đặt câu, viết đoạn, mô tả biểu đồ, dịch'), h('li', null, 'AI chấm + nhận xét tiếng Việt')))));
}
