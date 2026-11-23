import { h, clear, pageHead, toast, notice, confirmDialog } from '../ui.js';
import { getSettings, setSettings } from '../settings.js';
import { testKey } from '../gemini.js';
import { zhVoices, speak, ttsSupported, voiceFor } from '../tts.js';
import { recognitionSupported, recorderSupported } from '../speech.js';
import { exportAll, importAll, clearAll, storageAvailable } from '../storage.js';

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro', 'gemini-flash-latest', 'gemini-flash-lite-latest'];

export async function render(root) {
  const s = getSettings();
  root.append(pageHead('Cài đặt', '设置', 'Cài đặt', 'Mọi cài đặt và tiến độ chỉ lưu trên trình duyệt này.'));
  if (!storageAvailable()) root.append(h('div', { style: { marginBottom: '16px' } }, notice('warn', '⚠️', 'Trình duyệt đang chặn bộ nhớ cục bộ (chế độ riêng tư?). Cài đặt và tiến độ chỉ giữ đến khi đóng tab.')));

  // ---------- AI ----------
  const keyInput = h('input', { class: 'input', type: 'password', value: s.geminiKey || '', placeholder: 'Dán API key dạng AIza…', autocomplete: 'off', spellcheck: false, 'aria-label': 'API key Gemini' });
  const modelInput = h('input', { class: 'input', value: s.geminiModel || 'gemini-2.5-flash', list: 'modelList', 'aria-label': 'Tên model' });
  const keyStatus = h('div', { 'aria-live': 'polite' });
  const saveKey = () => { setSettings({ geminiKey: keyInput.value.trim(), geminiModel: modelInput.value.trim() || 'gemini-2.5-flash' }); toast('Đã lưu cài đặt AI', 'ok'); };
  root.append(h('div', { class: 'grid c2' },
    h('div', { class: 'card' },
      h('h2', null, '🤖 Trí tuệ nhân tạo (Gemini)'),
      h('label', { class: 'field' }, h('span', null, 'API key Gemini'),
        h('div', { class: 'row', style: { flexWrap: 'nowrap' } }, keyInput,
          h('button', { class: 'btn sm', type: 'button', onclick: (e) => { keyInput.type = keyInput.type === 'password' ? 'text' : 'password'; e.target.textContent = keyInput.type === 'password' ? 'Hiện' : 'Ẩn'; } }, 'Hiện')),
        h('div', { class: 'hint' }, 'Key chỉ lưu trong trình duyệt của bạn và được gửi thẳng tới Google, không qua máy chủ nào khác. Khi xuất tiến độ, key không được xuất.')),
      h('label', { class: 'field' }, h('span', null, 'Model'), modelInput, h('datalist', { id: 'modelList' }, MODELS.map((m) => h('option', { value: m }))), h('div', { class: 'hint' }, 'Mặc định gemini-2.5-flash. Hết hạn mức (lỗi 429) thì thử gemini-2.5-flash-lite.')),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', onclick: saveKey }, 'Lưu'),
        h('button', { class: 'btn', onclick: async (e) => {
          saveKey();
          const b = e.currentTarget; b.disabled = true;
          clear(keyStatus).append(h('p', { class: 'small' }, h('span', { class: 'spinner' }), ' Đang kiểm tra…'));
          try { await testKey(keyInput.value.trim(), modelInput.value.trim()); clear(keyStatus).append(notice('ok', '✅', 'Key hoạt động! Các tính năng AI đã sẵn sàng.')); }
          catch (err) { clear(keyStatus).append(notice('err', '❌', err.message)); }
          b.disabled = false;
        } }, 'Kiểm tra key'),
        h('button', { class: 'btn ghost danger', onclick: () => { keyInput.value = ''; setSettings({ geminiKey: '' }); clear(keyStatus); toast('Đã xóa key'); } }, 'Xóa key')),
      h('div', { style: { marginTop: '12px' } }, keyStatus)),
    h('div', { class: 'card' },
      h('h2', null, 'Lấy API key miễn phí (≈1 phút)'),
      h('ol', { class: 'steps' },
        h('li', null, h('div', null, 'Mở ', h('a', { href: 'https://aistudio.google.com/app/apikey', target: '_blank', rel: 'noopener' }, 'aistudio.google.com/app/apikey'), ' và đăng nhập bằng tài khoản Google (Gmail).')),
        h('li', null, h('div', null, 'Nếu được hỏi, đồng ý điều khoản sử dụng của Google AI Studio.')),
        h('li', null, h('div', null, 'Bấm nút ', h('strong', null, '"Create API key"'), ' (Tạo khóa API). Chọn dự án mặc định hoặc tạo dự án mới.')),
        h('li', null, h('div', null, 'Sao chép chuỗi key (bắt đầu bằng ', h('code', null, 'AIza'), ').')),
        h('li', null, h('div', null, 'Dán vào ô bên cạnh → bấm ', h('strong', null, 'Lưu'), ' rồi ', h('strong', null, 'Kiểm tra key'), '.'))),
      h('p', { class: 'small muted', style: { marginTop: '12px' } }, 'Gói miễn phí có giới hạn số lượt mỗi phút/ngày — đủ cho học cá nhân. Không chia sẻ key cho người khác. Trên máy dùng chung, hãy xóa key sau khi học.'))));

  // ---------- Giọng đọc ----------
  const voiceCard = h('div', { class: 'card' }, h('h2', null, '🔊 Giọng đọc & nhận dạng giọng nói'));
  root.append(h('div', { class: 'spacer' }), voiceCard);
  const support = h('div', { class: 'stack', style: { marginBottom: '14px' } },
    ttsSupported() ? null : notice('err', '🔇', 'Trình duyệt không hỗ trợ đọc văn bản. Hãy dùng Chrome, Edge hoặc Safari.'),
    recognitionSupported() ? null : notice('warn', '🎙', 'Trình duyệt chưa hỗ trợ nhận dạng giọng nói tiếng Trung. Dùng Google Chrome hoặc Microsoft Edge để luyện nói (vẫn có thể gõ câu trả lời).'),
    recorderSupported() ? null : notice('warn', '⏺', 'Trình duyệt không hỗ trợ ghi âm.'));
  voiceCard.append(support);
  const voices = await zhVoices();
  if (!voices.length && ttsSupported()) voiceCard.append(notice('warn', '🈳', h('div', null, h('p', null, 'Máy chưa có giọng đọc tiếng Trung (zh-CN).'),
    h('ul', { class: 'small', style: { margin: 0, paddingLeft: '18px' } },
      h('li', null, 'Windows: Cài đặt → Thời gian & ngôn ngữ → Giọng nói → Thêm giọng → 中文(中华人民共和国).'),
      h('li', null, 'Android: Cài đặt → Hệ thống → Ngôn ngữ → Chuyển văn bản thành giọng nói → cài dữ liệu tiếng Trung.'),
      h('li', null, 'iPhone/Mac: Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Trung.'),
      h('li', null, 'Cách nhanh nhất: dùng Microsoft Edge (có sẵn giọng Xiaoxiao/Yunxi tự nhiên).')))));
  const opts = (cur) => [h('option', { value: '' }, 'Tự động'), ...voices.map((v) => h('option', { value: v.voiceURI, selected: v.voiceURI === cur || v.name === cur }, `${v.name} (${v.lang})`))];
  const vf = h('select', { class: 'select', style: { width: '100%' } }, opts(s.voiceFemale));
  const vm = h('select', { class: 'select', style: { width: '100%' } }, opts(s.voiceMale));
  const vn = h('select', { class: 'select', style: { width: '100%' } }, opts(s.voiceNarrator));
  const rate = h('input', { type: 'range', min: 0.5, max: 1.3, step: 0.05, value: s.rate ?? 0.9 });
  const rateLbl = h('span', null, `${s.rate ?? 0.9}×`);
  const pause = h('input', { type: 'range', min: 1, max: 5, step: 0.5, value: s.pauseSeconds ?? 2 });
  const pauseLbl = h('span', null, `${s.pauseSeconds ?? 2} giây`);
  const test = async (sp, text) => { try { await speak(text, { speaker: sp }); } catch (e) { toast(e.message, 'err'); } };
  const save = () => setSettings({ voiceFemale: vf.value, voiceMale: vm.value, voiceNarrator: vn.value, rate: Number(rate.value), pauseSeconds: Number(pause.value) });
  [vf, vm, vn].forEach((x) => x.addEventListener('change', save));
  rate.addEventListener('input', () => { rateLbl.textContent = `${rate.value}×`; save(); });
  pause.addEventListener('input', () => { pauseLbl.textContent = `${pause.value} giây`; save(); });
  const vrow = (label, sel, sp, text) => h('label', { class: 'field' }, h('span', null, label), h('div', { class: 'row', style: { flexWrap: 'nowrap' } }, sel, h('button', { class: 'btn sm', type: 'button', onclick: () => test(sp, text) }, '▶ Thử')));
  const sameNote = h('p', { class: 'hint' });
  voiceFor('男').then(async (m) => { const f = await voiceFor('女'); if (m.voice && f.voice && m.voice === f.voice) sameNote.textContent = 'Máy chỉ có 1 giọng tiếng Trung: giọng nam được giả lập bằng cách hạ cao độ.'; });
  voiceCard.append(h('div', { class: 'grid c2' },
    h('div', null, vrow('Giọng nữ (女)', vf, '女', '你好，我是小月。今天天气很好。'), vrow('Giọng nam (男)', vm, '男', '你好，我叫李明，很高兴认识你。'), vrow('Giọng dẫn (旁白)', vn, '旁白', '问：他们在哪儿？'), sameNote),
    h('div', null,
      h('label', { class: 'field' }, h('span', null, 'Tốc độ đọc: ', rateLbl), rate),
      h('label', { class: 'field' }, h('span', null, 'Nghỉ giữa các lần nghe: ', pauseLbl), pause),
      h('label', { class: 'field' }, h('span', null, 'Hiển thị'),
        h('div', null, h('label', null, h('input', { type: 'checkbox', checked: s.showPinyin !== false, onchange: (e) => setSettings({ showPinyin: e.target.checked }) }), ' Hiện pinyin mặc định')),
        h('div', { style: { marginTop: '8px' } }, 'Giao diện: ', h('select', { class: 'select', onchange: (e) => setSettings({ theme: e.target.value }) },
          [['auto', 'Theo hệ thống'], ['light', 'Sáng'], ['dark', 'Tối']].map(([v, l]) => h('option', { value: v, selected: (s.theme || 'auto') === v }, l))))))));

  // ---------- Dữ liệu ----------
  const file = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: async () => {
    const f = file.files[0]; if (!f) return;
    try { importAll(JSON.parse(await f.text())); toast('Đã nhập tiến độ. Đang tải lại…', 'ok'); setTimeout(() => location.reload(), 800); }
    catch (e) { toast(e.message || 'File không hợp lệ', 'err'); }
    file.value = '';
  } });
  root.append(h('div', { class: 'spacer' }), h('div', { class: 'card' },
    h('h2', null, '💾 Sao lưu dữ liệu'),
    h('p', { class: 'muted' }, 'Xuất tiến độ ra file JSON để chuyển sang máy khác hoặc sao lưu. Nhập lại file để khôi phục.'),
    h('div', { class: 'row' },
      h('button', { class: 'btn primary', onclick: downloadBackup }, '⬇ Xuất tiến độ (JSON)'),
      h('button', { class: 'btn', onclick: () => file.click() }, '⬆ Nhập từ file'), file,
      h('span', { class: 'grow' }),
      h('button', { class: 'btn ghost danger', onclick: async () => {
        if (await confirmDialog('Xóa toàn bộ tiến độ?', 'Từ đã thuộc, lịch sử thi, bài shadowing tự thêm… sẽ bị xóa. Cài đặt và API key được giữ lại.', 'Xóa hết', true)) { clearAll({ keepSettings: true }); toast('Đã xóa tiến độ'); }
      } }, 'Xóa tiến độ'),
      h('button', { class: 'btn ghost danger', onclick: async () => {
        if (await confirmDialog('Xóa mọi dữ liệu?', 'Xóa cả cài đặt và API key trên trình duyệt này.', 'Xóa tất cả', true)) { clearAll(); toast('Đã xóa'); setTimeout(() => location.reload(), 600); }
      } }, 'Xóa tất cả'))));
}

export function downloadBackup() {
  const data = exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `tieng-trung-khong-kho-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
