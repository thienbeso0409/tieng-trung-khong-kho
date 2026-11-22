# KẾ HOẠCH DỰ ÁN — "Tiếng Trung không khó"

Web học tiếng Trung 4 kỹ năng (Nghe – Nói – Đọc – Viết) giúp người Việt thi HSK. Giao diện tiếng Việt, nhiều người dùng (mỗi người dùng trên trình duyệt của mình, tiến độ lưu cục bộ).

Tài liệu liên quan: `docs/DATA_SCHEMA.md` (hợp đồng dữ liệu — NGUỒN CHÂN LÝ duy nhất giữa hai agent), `docs/CONTENT_NOTES.md` (ghi chú của Agent Chuyên môn).

---

## 1. Mục tiêu đợt 1

- HSK 1, 2, 3 theo cấu trúc **HSK 2.0** (đúng số phần, số câu, dạng câu từng cấp — xem bảng ở DATA_SCHEMA §4).
- Mỗi cấp có **1 đề thi thử đầy đủ**: HSK1 (nghe + đọc, 40 câu), HSK2 (nghe + đọc, 60 câu), HSK3 (nghe + đọc + viết, 80 câu).
- Từ vựng đầy đủ: HSK1 150 từ, HSK2 150 từ mới, HSK3 300 từ mới.
- Nói: hội thoại AI (Gemini), Shadowing (TTS + YouTube), luyện trả lời HSKK có chấm.
- Viết: luyện từng chữ bằng Hanzi Writer, bài tập viết theo dạng HSK.
- Schema mở rộng được HSK 4–6 mà không phải đổi code (chỉ thêm file + khai báo trong manifest).

## 2. Ràng buộc kỹ thuật (đã chốt, không thay đổi)

| Mục | Quyết định |
|---|---|
| Công nghệ | HTML/CSS/JavaScript thuần, **không build step**, không npm khi chạy. JS dạng ES module (`<script type="module">`). |
| Deploy | GitHub Pages: `https://thienbeso0409.github.io/tieng-trung-khong-kho/` → **mọi đường dẫn tương đối** (`data/index.json`, không bắt đầu bằng `/`). |
| Kiến trúc | SPA một `index.html`, router hash (`#/`, `#/listening`, ...). |
| Dữ liệu | `fetch()` file JSON trong `data/` (UTF-8, không BOM). Mọi đường dẫn trong JSON là tương đối so với `data/`. |
| Thư viện | Chỉ qua CDN jsdelivr. Bắt buộc: Hanzi Writer `https://cdn.jsdelivr.net/npm/hanzi-writer@3.7/dist/hanzi-writer.min.js` (dữ liệu nét tải mặc định từ jsdelivr `hanzi-writer-data`). Không thêm thư viện khác nếu không cần. |
| Backend | Không có. Tiến độ + cài đặt lưu `localStorage` (mọi truy cập bọc try/catch; lỗi thì chạy tiếp, không crash). Khóa có tiền tố `ttkk:`. |
| AI | Google Gemini REST gọi trực tiếp từ trình duyệt: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`, header `x-goog-api-key: <key>`. Model mặc định `gemini-2.5-flash`, cho nhập tên khác. Key do người dùng tự dán ở Cài đặt (lấy miễn phí tại aistudio.google.com), lưu `ttkk:settings`. Không có key → tính năng AI hiển thị hướng dẫn + dùng phương án dự phòng. |
| Giọng nói | Nhận dạng: Web Speech API (`SpeechRecognition`/`webkitSpeechRecognition`, `lang="zh-CN"`). Đọc: `speechSynthesis` với voice `zh-CN`. Ghi âm: `MediaRecorder`. Trình duyệt không hỗ trợ → thông báo tiếng Việt (gợi ý dùng Chrome/Edge). |
| Video | YouTube IFrame Player API (`https://www.youtube.com/iframe_api`). |

## 3. Kiến trúc thư mục

```
/
├── index.html                 # SPA, khung layout + menu
├── css/
│   └── style.css              # (có thể tách thêm file)
├── js/
│   ├── app.js                 # khởi động, router hash
│   ├── data.js                # loader: đọc data/index.json, cache fetch
│   ├── storage.js             # localStorage an toàn (try/catch), tiền tố ttkk:
│   ├── settings.js            # trang Cài đặt (Gemini key, model, giọng TTS, tốc độ)
│   ├── tts.js                 # speechSynthesis zh-CN, phân biệt 男/女/旁白
│   ├── speech.js              # SpeechRecognition + MediaRecorder
│   ├── gemini.js              # gọi Gemini REST, xử lý lỗi/quota
│   ├── compare.js             # so khớp chuỗi Hán tự (chấm cơ bản)
│   ├── exam/                  # renderer + chấm điểm theo từng type câu hỏi
│   └── pages/                 # home, vocab, listening, reading, writing, speaking/*, progress, settings
├── data/                      # ← CHỈ Agent Chuyên môn ghi
│   ├── index.json
│   ├── vocab/hsk1.json, hsk2.json, hsk3.json
│   ├── exams/hsk1-de1.json, hsk2-de1.json, hsk3-de1.json
│   ├── speaking/topics.json, hskk.json, shadowing.json
│   └── writing/characters.json, practice.json
├── test/                      # dữ liệu giả của Agent Web (cùng schema) + trang test
├── tools/
│   └── validate-data.mjs      # Agent Web viết: `node tools/validate-data.mjs [thư_mục_data]`
├── docs/PLAN.md, DATA_SCHEMA.md, CONTENT_NOTES.md
└── README.md                  # Agent Web: cách chạy local (python -m http.server) + deploy
```

## 4. Trang / tính năng (route)

| Route | Nội dung |
|---|---|
| `#/` | Trang chủ: chọn cấp HSK, 4 kỹ năng, tiến độ tóm tắt. |
| `#/vocab/{level}` | Danh sách từ (lọc, tìm), thẻ ghi nhớ (flashcard), nghe phát âm TTS, đánh dấu đã thuộc. |
| `#/exam/{examId}` | Làm đề thi thử đầy đủ (nghe → đọc → viết), có đồng hồ theo `duration_minutes`, nộp bài, điểm theo phần + tổng + đạt/không đạt (`pass_score`), xem lại từng câu: đáp án, transcript, pinyin, `explanation_vi`. |
| `#/listening/{level}` | Luyện nghe theo từng part của đề (chọn part), âm thanh TTS phát `repeat` lần (mặc định 2, có khoảng nghỉ), nộp → chấm → transcript + giải thích. |
| `#/reading/{level}` | Luyện đọc theo part, chấm + giải thích. Bật/tắt pinyin. |
| `#/writing/chars/{level}` | Luyện chữ: xem animation thứ tự nét, viết theo (quiz Hanzi Writer), hiện pinyin/nghĩa/số nét/bộ thủ. |
| `#/writing/practice/{level}` | Bài viết dạng HSK: reorder_words, write_hanzi_from_pinyin, write_sentence (AI chấm nếu có key, không có key → so với `sample_answers` + kiểm tra có dùng `keyword`). |
| `#/speaking/chat` | Hội thoại AI theo chủ đề (`topics.json`): AI đóng vai, nói tiếng Trung đúng cấp, kèm pinyin + dịch Việt (bật/tắt); người dùng nói (nhận dạng zh-CN) hoặc gõ; AI đọc to câu trả lời; nút "Sửa lỗi cho tôi" (nhận xét tiếng Việt). |
| `#/speaking/shadowing` | Danh sách bài (`shadowing.json`) + bài người dùng tự thêm (lưu localStorage): dán link YouTube → tự thêm đoạn (start/end/hanzi/pinyin/vi). Phát đoạn, lặp đoạn N lần, tốc độ, ghi âm nghe lại, nhận dạng giọng → % khớp, tô màu chữ sai. |
| `#/speaking/hskk` | Luyện HSKK theo cấp sơ/trung/cao và theo part: nghe/đọc đề, đếm giờ chuẩn bị/trả lời, ghi âm + nhận dạng → AI chấm theo rubric (điểm từng tiêu chí + nhận xét tiếng Việt); không key → chấm so khớp với `sample_answer`/`keywords`. |
| `#/progress` | Lịch sử làm đề, điểm, từ đã thuộc, chữ đã viết. Xuất/nhập JSON tiến độ (sao lưu). |
| `#/settings` | Gemini API key (ẩn/hiện, nút kiểm tra key), tên model, chọn voice zh-CN nam/nữ, tốc độ đọc, bật pinyin mặc định, xóa dữ liệu. |

Quy tắc chung UI: responsive (dùng tốt trên điện thoại 360px), tiếng Việt toàn bộ, chữ Hán dùng font hệ thống có fallback (`"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif`).

## 5. Phân công

### Agent Chuyên môn (nội dung)
- **CHỈ ghi** `data/**` và `docs/CONTENT_NOTES.md`. Không sửa file nào khác.
- Tuân thủ tuyệt đối `docs/DATA_SCHEMA.md`. Nếu thấy schema thiếu, KHÔNG tự thêm field bắt buộc mới; được dùng field `notes` (chuỗi tự do) và ghi đề xuất vào `CONTENT_NOTES.md`.
- Nội dung tự soạn (không chép nguyên văn đề thật có bản quyền), đúng phạm vi từ vựng cấp đó (đề HSK n chỉ dùng từ ≤ HSK n, tối đa ~5% từ ngoài, ghi chú lại).
- YouTube: chỉ đưa video nếu chắc chắn `videoId` có thật; không chắc → không đưa. `verified: true` chỉ khi đã kiểm tra được.

### Agent Web (code)
- Ghi mọi thứ **ngoài** `data/` (và không sửa `docs/DATA_SCHEMA.md`, `docs/CONTENT_NOTES.md`). Có thể sửa PLAN.md phần trạng thái.
- Không sửa `data/`. Dữ liệu test giả đặt trong `test/data/` cùng cấu trúc; app có tham số `?data=test/data/` để trỏ sang (mặc định `data/`).
- Viết `tools/validate-data.mjs` kiểm tra dữ liệu theo DATA_SCHEMA (cả hai bên dùng).
- Renderer phải xử lý MỌI `type` trong DATA_SCHEMA §5, kể cả type HSK4–6 đã liệt kê (render tối thiểu được), và bỏ qua an toàn type lạ (hiện "Dạng câu chưa hỗ trợ").

## 6. Checklist nghiệm thu

### 6.1 Agent Chuyên môn
- [ ] Tất cả file JSON parse được (`node -e "JSON.parse(require('fs').readFileSync(f,'utf8'))"`) và `node tools/validate-data.mjs` báo 0 lỗi (khi tool đã có).
- [ ] `data/index.json` liệt kê đúng mọi file tồn tại; không đường dẫn chết.
- [ ] Từ vựng: `hsk1.json` = 150 từ, `hsk2.json` = 150 từ mới, `hsk3.json` = 300 từ mới; `id` không trùng; mọi từ có `hanzi`, `pinyin` (dấu thanh), `meaning_vi`, `pos`; ≥ 50% từ mỗi cấp có `example`.
- [ ] Đề `hsk1-de1`: 40 câu (nghe 20 = 4 part × 5; đọc 20 = 4 part × 5). `hsk2-de1`: 60 câu (nghe 35 = 10/10/10/5; đọc 25 = 5/5/5/10). `hsk3-de1`: 80 câu (nghe 40 = 10/10/10/10; đọc 30 = 10/10/10; viết 10 = 5/5). Số `no` liên tục 1..N, đúng thứ tự.
- [ ] Mọi câu có `answer` hợp lệ (chữ cái nằm trong options; true/false là boolean) và `explanation_vi` không rỗng; mọi câu nghe có `audio.lines` không rỗng, `repeat: 2`.
- [ ] Phân bố đáp án hợp lý (không quá 40% cùng một chữ cái trong một part có ≥5 câu; true/false mỗi part có cả đúng và sai).
- [ ] HSK1, HSK2: mọi đoạn văn bản hiển thị có `pinyin`.
- [ ] `topics.json`: ≥ 6 chủ đề cho mỗi level 1, 2, 3 (tổng ≥ 18).
- [ ] `hskk.json`: ≥ 10 item mỗi cấp `so` và `trung`, phủ đủ mọi part của cấp đó; có rubric cho mỗi part; `cao` tùy chọn.
- [ ] `shadowing.json`: ≥ 15 segment nguồn `tts` (tổng các item), mỗi segment có `hanzi`, `pinyin`, `vi`. Item YouTube (nếu có) có `verified` đúng sự thật.
- [ ] `characters.json`: bao phủ 100% chữ Hán xuất hiện trong từ vựng HSK1, + ≥ 100 chữ mới HSK2, + ≥ 100 chữ mới HSK3; mỗi chữ có `strokes`, `radical`.
- [ ] `writing/practice.json`: level 3 có ≥ 15 `reorder_words`, ≥ 15 `write_hanzi_from_pinyin`, ≥ 10 `write_sentence`; level 1 và 2 mỗi cấp ≥ 10 `reorder_words` (luyện thêm).
- [ ] `docs/CONTENT_NOTES.md`: nguồn tham khảo, quy ước, danh sách từ ngoài phạm vi, đề xuất schema (nếu có).

### 6.2 Agent Web
- [ ] Mở bằng `python3 -m http.server` tại gốc và tại đường dẫn con (`/tieng-trung-khong-kho/`) đều chạy: không đường dẫn tuyệt đối, console không lỗi khi tải trang chủ.
- [ ] Mọi route ở §4 hoạt động, nút Back/Forward trình duyệt đúng, reload giữ nguyên trang.
- [ ] Renderer + chấm điểm cho từng `type` ở DATA_SCHEMA §5; có trang `test/` hoặc dữ liệu `test/data/` chứa ≥ 1 câu mỗi type và đều render/chấm đúng.
- [ ] Đề thi: đồng hồ, nộp bài, điểm từng phần quy về thang HSK (mỗi phần 100), tổng, đạt/không đạt; câu `is_example` không tính điểm; xem lại có transcript + giải thích.
- [ ] Nghe: phát đúng `repeat` lần với nghỉ giữa (mặc định 2 s), giọng 男/女 khác nhau (voice khác hoặc pitch khác rõ rệt), 旁白 dùng giọng trung tính.
- [ ] Hanzi Writer: animation + quiz cho mọi chữ trong `characters.json`; chữ không có dữ liệu nét → báo lỗi thân thiện.
- [ ] Gemini: lưu/xóa key, kiểm tra key, xử lý lỗi 400/403/429 bằng thông báo tiếng Việt; không key → phương án dự phòng chạy được (chấm so khớp).
- [ ] Hội thoại AI: system prompt dùng `ai_role_zh`, `level`, `key_vocab`; trả lời ở định dạng JSON có hanzi/pinyin/vi (xem DATA_SCHEMA §9.3); nói + nghe hoạt động trên Chrome.
- [ ] Shadowing: lặp đoạn TTS và YouTube (theo `start`/`end`), ghi âm + phát lại, % khớp; người dùng thêm/sửa/xóa bài YouTube của mình (lưu localStorage, parse được link `youtu.be/…`, `watch?v=…`, `shorts/…`).
- [ ] HSKK: đếm giờ chuẩn bị/trả lời theo item, ghi âm, AI chấm theo rubric trả điểm từng tiêu chí + nhận xét tiếng Việt.
- [ ] localStorage: mọi truy cập bọc try/catch (chạy được ở chế độ chặn storage); xuất/nhập tiến độ JSON.
- [ ] `tools/validate-data.mjs` kiểm tra: JSON hợp lệ, field bắt buộc, type hợp lệ, đáp án nằm trong options, số câu khớp `expected_count` của part, `no` liên tục; exit code ≠ 0 khi có lỗi.
- [ ] Giao diện dùng được ở 360px; README hướng dẫn chạy local + deploy GitHub Pages.

## 7. Thứ tự làm việc
1. Hai agent làm song song, chỉ dựa vào DATA_SCHEMA.md.
2. Agent Web làm trước `tools/validate-data.mjs` + `test/data/` mẫu.
3. Khi xong: chạy validator trên `data/` thật, mở web kiểm thử với dữ liệu thật, sửa lỗi theo phân quyền (lỗi dữ liệu → Agent Chuyên môn; lỗi code → Agent Web).
