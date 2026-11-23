// Nhận dạng giọng nói (Web Speech API, zh-CN) + ghi âm (MediaRecorder).
const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
export const recognitionSupported = () => !!SR;
export const recorderSupported = () => typeof window !== 'undefined' && !!window.MediaRecorder && !!navigator.mediaDevices?.getUserMedia;

export const SR_UNSUPPORTED_MSG = 'Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Hãy dùng Google Chrome hoặc Microsoft Edge trên máy tính/Android (cần mạng). Bạn vẫn có thể gõ câu trả lời.';

const SR_ERRORS = {
  'not-allowed': 'Bạn chưa cho phép dùng micro. Bấm biểu tượng ổ khóa cạnh thanh địa chỉ → cho phép Micro, rồi thử lại.',
  'service-not-allowed': 'Trình duyệt chặn dịch vụ nhận dạng giọng nói. Hãy thử Chrome/Edge.',
  'no-speech': 'Không nghe thấy giọng nói. Hãy nói to, rõ hơn và gần micro.',
  'audio-capture': 'Không tìm thấy micro. Kiểm tra lại thiết bị thu âm.',
  network: 'Lỗi mạng khi nhận dạng giọng nói (dịch vụ cần Internet).',
  'language-not-supported': 'Trình duyệt không hỗ trợ nhận dạng tiếng Trung (zh-CN).',
};
export const srErrorMessage = (code) => SR_ERRORS[code] || `Lỗi nhận dạng giọng nói (${code}).`;

// Bắt đầu nhận dạng. Trả về controller { stop(), abort(), promise } — promise resolve chuỗi cuối cùng.
export function startRecognition({ continuous = false, onInterim, lang = 'zh-CN' } = {}) {
  if (!SR) return { promise: Promise.reject(new Error(SR_UNSUPPORTED_MSG)), stop() {}, abort() {} };
  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = continuous;
  rec.maxAlternatives = 1;
  let finalText = '';
  let interim = '';
  let error = null;
  const promise = new Promise((resolve, reject) => {
    rec.onresult = (e) => {
      interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript;
      }
      onInterim && onInterim(finalText + interim);
    };
    rec.onerror = (e) => { error = e.error; };
    rec.onend = () => {
      const text = (finalText + interim).trim();
      if (error && error !== 'aborted' && !(error === 'no-speech' && text)) reject(Object.assign(new Error(srErrorMessage(error)), { code: error }));
      else resolve(text);
    };
    try { rec.start(); } catch (e) { reject(e); }
  });
  return { promise, stop: () => { try { rec.stop(); } catch { /* */ } }, abort: () => { try { rec.abort(); } catch { /* */ } } };
}

// Ghi âm. Trả về { stop(): Promise<{blob,url}>, cancel() }
export async function startRecording() {
  if (!recorderSupported()) throw new Error('Trình duyệt không hỗ trợ ghi âm (MediaRecorder). Hãy dùng Chrome, Edge, Firefox hoặc Safari mới.');
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch (e) {
    throw new Error(e.name === 'NotAllowedError' ? 'Bạn chưa cấp quyền micro cho trang này. Hãy cho phép micro trong cài đặt trình duyệt.' : 'Không mở được micro: ' + e.message);
  }
  const chunks = [];
  const mr = new MediaRecorder(stream);
  mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  mr.start();
  const release = () => stream.getTracks().forEach((t) => t.stop());
  return {
    stop: () => new Promise((resolve) => {
      mr.onstop = () => {
        release();
        const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        resolve({ blob, url: URL.createObjectURL(blob) });
      };
      try { mr.state !== 'inactive' ? mr.stop() : mr.onstop(); } catch { release(); resolve(null); }
    }),
    cancel: () => { try { mr.state !== 'inactive' && mr.stop(); } catch { /* */ } release(); },
  };
}

// Ghi âm + nhận dạng đồng thời (mỗi phần thất bại độc lập).
export async function startCapture({ continuous = true, onInterim } = {}) {
  let recorder = null; let recErr = null;
  try { recorder = await startRecording(); } catch (e) { recErr = e; }
  const recog = recognitionSupported() ? startRecognition({ continuous, onInterim }) : null;
  return {
    recorderError: recErr,
    recognitionAvailable: !!recog,
    async stop() {
      recog && recog.stop();
      const audio = recorder ? await recorder.stop() : null;
      let text = ''; let error = null;
      if (recog) { try { text = await recog.promise; } catch (e) { error = e; } }
      return { audio, text, error };
    },
    cancel() { recog && recog.abort(); recorder && recorder.cancel(); },
  };
}
