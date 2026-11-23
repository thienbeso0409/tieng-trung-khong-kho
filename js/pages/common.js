// Thành phần dùng chung giữa các trang.
import { h, notice, emptyState } from '../ui.js';
import { levelKey } from '../data.js';

export const isMissing = (e) => !!e?.missing;

// Khối "Đang soạn" (404) hoặc lỗi tải dữ liệu
export function dataProblem(e, what = 'Nội dung') {
  if (isMissing(e)) return h('div', { class: 'card' }, emptyState('编写中', `${what} cho cấp này đang được soạn. Bạn quay lại sau nhé!`, h('span', { class: 'badge gold' }, 'Đang soạn')));
  return notice('err', '⚠️', h('p', null, h('strong', null, 'Không tải được dữ liệu. ')), h('p', null, e?.message || String(e)), h('p', { class: 'small muted' }, 'Kiểm tra kết nối mạng rồi tải lại trang.'));
}

// Hàng chip chọn cấp, dẫn tới `${base}/${level}`
export function levelChips(ctx, base, current) {
  return h('div', { class: 'level-strip', role: 'tablist', 'aria-label': 'Chọn cấp' },
    ctx.levels.map((l) => {
      const k = levelKey(l);
      return h('a', { class: `level-chip${k === String(current) ? ' on' : ''}`, href: `#/${base}/${encodeURIComponent(k)}`, role: 'tab', 'aria-selected': String(k === String(current)) }, l.name_vi || `HSK ${k}`);
    }));
}

export const levelName = (ctx, key) => ctx.levels.find((l) => levelKey(l) === String(key))?.name_vi || `HSK ${key}`;

// Chạy song song, gom lỗi theo từng phần
export async function settle(promises) {
  const r = await Promise.allSettled(promises);
  return r.map((x) => (x.status === 'fulfilled' ? { ok: true, value: x.value } : { ok: false, error: x.reason }));
}
