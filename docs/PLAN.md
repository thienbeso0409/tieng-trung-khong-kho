# KẾ HOẠCH DỰ ÁN — "Tiếng Trung không khó"

Web học tiếng Trung 4 kỹ năng (Nghe – Nói – Đọc – Viết) giúp người Việt thi HSK. Giao diện tiếng Việt, nhiều người dùng (mỗi người dùng trên trình duyệt của mình, tiến độ lưu cục bộ).

Tài liệu liên quan: `docs/DATA_SCHEMA.md` (hợp đồng dữ liệu — NGUỒN CHÂN LÝ duy nhất giữa các agent; cấu trúc HSK 3.0 ở Phụ lục A), `docs/CONTENT_NOTES-{A,B,C}.md` (ghi chú của từng người trong đội Chuyên môn).

---

## 1. Mục tiêu (đã đổi phạm vi: 9 cấp, chuẩn HSK 3.0)

- **Chuẩn HSK 3.0** (đề chính thức từ 13/12/2026); HSK 2.0 bỏ hoàn toàn. Cấu trúc đề từng cấp: `docs/DATA_SCHEMA.md` **Phụ lục A**.
- Đủ 9 cấp: HSK 1, 2, 3, 4, 5, 6 và đề gộp HSK 7–9 (`level: "7-9"`).
- Mỗi cấp **1 đề thi thử đầy đủ** đúng cấu trúc thật: HSK1 40 câu · HSK2 60 · HSK3 70 · HSK4 70 · HSK5 72 · HSK6 82 · HSK7–9 91 (nghe, đọc, viết, dịch); bài thi nói riêng cho HSK3–6 và 7–9.
- **[CHỐT bởi điều phối chính]** File từ vựng theo chuẩn GF0025-2021 (nguồn mở ivankra/hsk30), từ mới mỗi cấp: 500 / 772 / 973 / 1 000 / 1 071 / 1 140 / 5 636 (7–9, gộp một file). Từ thuộc đại cương thi 2025 đánh field tùy chọn `"syllabus2025": true` khi xác định được. Đề thi thử bám độ khó đại cương 2025.
- Nói: hội thoại AI (Gemini), Shadowing (TTS + YouTube), luyện + thi nói HSK 3.0 có AI chấm.
- Viết: luyện từng chữ bằng Hanzi Writer, bài viết theo dạng HSK (đến viết luận, mô tả biểu đồ, dịch).

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
├── data/                      # ← CHỈ đội Chuyên môn (A/B/C) ghi, theo phân vùng §5
│   ├── index.json             # A (đủ 7 level ngay từ đầu)
│   ├── vocab/hsk1..hsk6.json, hsk7-9.json
│   ├── exams/hsk1-de1.json … hsk6-de1.json, hsk7-9-de1.json
│   ├── speaking/topics.json, hskk.json, shadowing.json      # A
│   └── writing/characters-hsk{L}.json, practice-hsk{L}.json
├── test/                      # dữ liệu giả của Agent Web (cùng schema) + trang test
├── tools/
│   └── validate-data.mjs      # Agent Web viết: `node tools/validate-data.mjs [thư_mục_data]`
├── docs/PLAN.md, DATA_SCHEMA.md, CONTENT_NOTES-A.md, CONTENT_NOTES-B.md, CONTENT_NOTES-C.md
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
| `#/speaking/hskk` | Thi nói HSK 3.0 (paper theo cấp 3–6, 7–9) và luyện theo part (kể cả HSKK sơ/trung/cao nếu có dữ liệu): nghe/đọc đề, đếm giờ chuẩn bị/trả lời, ghi âm + nhận dạng → AI chấm theo rubric (điểm từng tiêu chí + nhận xét tiếng Việt); không key → chấm so khớp với `sample_answer`/`keywords`. |
| `#/progress` | Lịch sử làm đề, điểm, từ đã thuộc, chữ đã viết. Xuất/nhập JSON tiến độ (sao lưu). |
| `#/settings` | Gemini API key (ẩn/hiện, nút kiểm tra key), tên model, chọn voice zh-CN nam/nữ, tốc độ đọc, bật pinyin mặc định, xóa dữ liệu. |

Quy tắc chung UI: responsive (dùng tốt trên điện thoại 360px), tiếng Việt toàn bộ, chữ Hán dùng font hệ thống có fallback (`"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif`).

## 5. Phân công

### Đội Chuyên môn (nội dung) — 3 agent song song

Quy tắc chung cho A, B, C:
- Chỉ ghi file trong **vùng của mình** (bảng dưới) và `docs/CONTENT_NOTES-{X}.md` của mình. Không sửa file của người khác, không sửa `docs/DATA_SCHEMA.md`.
- Tuân thủ tuyệt đối `docs/DATA_SCHEMA.md` (Phụ lục A thắng mọi chỗ mâu thuẫn). Schema thiếu → dùng field `notes`, ghi đề xuất vào CONTENT_NOTES của mình.
- Nội dung tự soạn (không chép nguyên văn đề thật), đúng phạm vi từ vựng (đề cấp n chỉ dùng từ ≤ cấp n, ngoài phạm vi ≤ 5%, ghi lại). Từ vựng cấp sau không lặp cấp trước.
- Chữ Hán không trùng giữa các file `characters-hsk{L}.json`: người cấp cao hơn kiểm tra file cấp thấp hơn trước khi thêm (nếu file đó chưa có thì bỏ qua và ghi chú để rà soát cuối).

| Người | Vùng ghi |
|---|---|
| **A** — HSK1–3 + toàn bộ NÓI + shadowing | `data/index.json`; `vocab/hsk1..3.json`; `exams/hsk1-de1.json`, `hsk2-de1.json`, `hsk3-de1.json`; `writing/characters-hsk1..3.json`, `writing/practice-hsk1..3.json`; `speaking/topics.json`, `speaking/hskk.json` (gồm **mọi** đề nói HSK3–6 và 7–9), `speaking/shadowing.json` |
| **B** — HSK4–6 | `vocab/hsk4..6.json`; `exams/hsk4-de1.json`, `hsk5-de1.json`, `hsk6-de1.json` (nghe, đọc, viết; `speaking_paper` ghi id do A đặt: `hsk{n}-de1-speaking`); `writing/characters-hsk4..6.json`; `writing/practice-hsk4..6.json` (đề viết luyện tập) |
| **C** — HSK7–9 | `vocab/hsk7-9.json`; `exams/hsk7-9-de1.json` (nghe, đọc, viết, dịch viết + dịch nói; `speaking_paper: "hsk7-9-de1-speaking"`); `writing/characters-hsk7-9.json` |

- YouTube (A): chỉ đưa video nếu chắc chắn `videoId` có thật; `verified: true` chỉ khi đã kiểm tra được.

### Agent Web (code)
- Ghi mọi thứ **ngoài** `data/` (và không sửa `docs/DATA_SCHEMA.md`, `docs/CONTENT_NOTES-*.md`). Có thể sửa PLAN.md phần trạng thái.
- Không sửa `data/`. Dữ liệu test giả đặt trong `test/data/` cùng cấu trúc; app có tham số `?data=test/data/` để trỏ sang (mặc định `data/`).
- Viết `tools/validate-data.mjs` kiểm tra dữ liệu theo DATA_SCHEMA (cả hai bên dùng).
- Renderer phải xử lý MỌI `type` trong DATA_SCHEMA §5 và Phụ lục A.3, `group.audio`/`group.passage`, chỗ trống đánh số `（41）`, `level: "7-9"`, `score_mode: "bands"`, `speaking_paper`; bỏ qua an toàn type lạ (hiện "Dạng câu chưa hỗ trợ"). File trong manifest bị 404 → hiện "Đang soạn".

## 6. Checklist nghiệm thu

### 6.1 Đội Chuyên môn

**Chung (A, B, C)** — áp cho mọi file mình ghi:
- [ ] JSON parse được; `node tools/validate-data.mjs` 0 lỗi (khi tool đã có).
- [ ] Đề: số part, số câu từng part, `type`, `no` liên tục 1..N khớp **đúng bảng Phụ lục A.2**; `expected_count` đúng; `standard: "HSK3.0"`.
- [ ] Mọi câu có `answer` hợp lệ (key nằm trong options; boolean cho đúng/sai; `null` cho câu chủ quan), `explanation_vi` không rỗng; câu chủ quan có `max_points`, `rubric_id` trỏ tới `exam.rubrics`, ≥ 1 `sample_answers`/`reference_zh`.
- [ ] Câu nghe có `audio.lines` (hoặc `group.audio`), `repeat` theo A.2.
- [ ] Phân bố đáp án: trong part ≥ 5 câu, không chữ cái nào > 40%; part đúng/sai có cả hai.
- [ ] Vocab: `count` = độ dài `words`, `id` duy nhất dạng `hsk{L}-{stt:04}`, mọi từ có `hanzi`, `pinyin` (dấu thanh), `pos`, `meaning_vi`; ≥ 50% có `example`; không trùng từ cấp thấp hơn.
- [ ] Chữ Hán: mỗi chữ có `strokes`, `radical`, `pinyin`, `meaning_vi`; không trùng giữa các cấp.

**A — HSK1–3 + Nói**
- [ ] `index.json` đủ 7 level, đúng tên file quy ước (DATA_SCHEMA §2).
- [ ] Vocab: `hsk1` = 500, `hsk2` = 772, `hsk3` = 973 từ mới (`complete: true`).
- [ ] Đề `hsk1-de1` (40), `hsk2-de1` (60), `hsk3-de1` (70); HSK1–2 mọi Text có `pinyin`; `hsk3-de1.speaking_paper = "hsk3-de1-speaking"`.
- [ ] Chữ: `characters-hsk1` = 246 chữ, `-hsk2` ≥ 125 mới, `-hsk3` ≥ 284 mới (đánh `handwrite` theo khả năng).
- [ ] `practice-hsk1..3`: mỗi cấp ≥ 10 câu luyện viết (HSK2: `choose_component` + `write_hanzi_from_pinyin`; HSK3: ≥ 15 `write_hanzi_from_pinyin`, ≥ 10 `write_sentence`).
- [ ] `topics.json`: ≥ 6 chủ đề mỗi level 1–6 và "7-9" (tổng ≥ 42).
- [ ] `hskk.json`: đủ 5 `papers` (`hsk3-de1-speaking` … `hsk6-de1-speaking`, `hsk7-9-de1-speaking`) đúng số mục/thời gian bảng A.4; thêm ngân hàng luyện ≥ 10 item mỗi level 3–6 (ngoài paper); rubric cho mọi part.
- [ ] `shadowing.json`: ≥ 15 segment `tts` (phủ level 1–3) + ≥ 5 segment mỗi level 4–6; YouTube chỉ khi chắc chắn, `verified` đúng sự thật.

**B — HSK4–6**
- [ ] Vocab: `hsk4` 1 000, `hsk5` 1 600, `hsk6` 1 800 từ mới. Tối thiểu nghiệm thu đợt này: `hsk4` đủ 1 000; `hsk5`, `hsk6` mỗi file ≥ 800 với `complete` phản ánh đúng thực tế.
- [ ] Đề `hsk4-de1` (70), `hsk5-de1` (72), `hsk6-de1` (82) đúng A.2, có `speaking_paper` đúng id, có `rubrics`.
- [ ] Chữ: `characters-hsk4..6` mỗi file ≥ 200 chữ mới (mục tiêu 441 / 431 / 413).
- [ ] `practice-hsk4..6`: HSK4 ≥ 10 `write_sentence` + ≥ 3 `write_essay`; HSK5 ≥ 3 `picture_story_writing` + ≥ 3 `write_essay`; HSK6 ≥ 3 `write_essay` practical + ≥ 3 argumentative. Mỗi câu có `sample_answers` + `outline_vi`.

**C — HSK7–9**
- [ ] `vocab/hsk7-9.json`: mục tiêu ~5 600; tối thiểu nghiệm thu đợt này ≥ 1 500 từ, `complete` đúng thực tế.
- [ ] `exams/hsk7-9-de1.json`: 91 câu đúng A.2 (nghe 40, đọc 40, viết 2, dịch 4), `score_mode: "bands"`, `band_rules` có `official: false`, `chart` hợp lệ, `translate_*` có `source.lang: "en"` + `reference_zh`.
- [ ] `characters-hsk7-9`: ≥ 300 chữ mới (mục tiêu 1 148).

**Báo cáo**: mỗi người ghi `docs/CONTENT_NOTES-{X}.md`: nguồn tham khảo, các điểm "(giả định)" đã theo, từ ngoài phạm vi, số lượng thực tế, đề xuất schema.

### 6.2 Agent Web
- [ ] Mở bằng `python3 -m http.server` tại gốc và tại đường dẫn con (`/tieng-trung-khong-kho/`) đều chạy: không đường dẫn tuyệt đối, console không lỗi khi tải trang chủ.
- [ ] Mọi route ở §4 hoạt động, nút Back/Forward trình duyệt đúng, reload giữ nguyên trang.
- [ ] Renderer + chấm điểm cho từng `type` ở DATA_SCHEMA §5; có trang `test/` hoặc dữ liệu `test/data/` chứa ≥ 1 câu mỗi type và đều render/chấm đúng.
- [ ] Đề thi: đồng hồ, nộp bài, điểm từng phần (mỗi phần 100), tổng, đạt/không đạt (`score_mode: pass`) hoặc xếp bậc 7/8/9 kèm cảnh báo "không chính thức" (`bands`); câu chủ quan chấm AI theo rubric; nút chuyển sang đề nói (`speaking_paper`); câu `is_example` không tính điểm; xem lại có transcript + giải thích.
- [ ] Biểu đồ `chart_description` vẽ được (bar/line/pie/table); dịch nói `translate_oral` ghi âm + chấm.
- [ ] Nghe: phát đúng `repeat` lần với nghỉ giữa (mặc định 2 s), giọng 男/女 khác nhau (voice khác hoặc pitch khác rõ rệt), 旁白 dùng giọng trung tính.
- [ ] Hanzi Writer: animation + quiz cho mọi chữ trong `characters-hsk{L}.json`; chữ không có dữ liệu nét → báo lỗi thân thiện.
- [ ] Gemini: lưu/xóa key, kiểm tra key, xử lý lỗi 400/403/429 bằng thông báo tiếng Việt; không key → phương án dự phòng chạy được (chấm so khớp).
- [ ] Hội thoại AI: system prompt dùng `ai_role_zh`, `level`, `key_vocab`; trả lời ở định dạng JSON có hanzi/pinyin/vi (xem DATA_SCHEMA §9.3); nói + nghe hoạt động trên Chrome.
- [ ] Shadowing: lặp đoạn TTS và YouTube (theo `start`/`end`), ghi âm + phát lại, % khớp; người dùng thêm/sửa/xóa bài YouTube của mình (lưu localStorage, parse được link `youtu.be/…`, `watch?v=…`, `shorts/…`).
- [ ] Đề nói HSK 3.0 (`hskk.json` papers): phần khởi động, phát âm thanh 1 lần, đếm giờ chuẩn bị/trả lời theo item, `picture_story` nhiều ảnh, ghi âm, AI chấm theo rubric trả điểm từng tiêu chí + nhận xét tiếng Việt.
- [ ] localStorage: mọi truy cập bọc try/catch (chạy được ở chế độ chặn storage); xuất/nhập tiến độ JSON.
- [ ] `tools/validate-data.mjs` kiểm tra: JSON hợp lệ, field bắt buộc, type hợp lệ, đáp án nằm trong options, số câu khớp `expected_count` của part, `no` liên tục; exit code ≠ 0 khi có lỗi.
- [ ] Giao diện dùng được ở 360px; README hướng dẫn chạy local + deploy GitHub Pages.

## 7. Thứ tự làm việc
1. Bốn agent (Web, A, B, C) làm song song, chỉ dựa vào DATA_SCHEMA.md (Phụ lục A).
2. Agent Web làm trước `tools/validate-data.mjs` + `test/data/` mẫu.
3. Khi xong: chạy validator trên `data/` thật, mở web kiểm thử với dữ liệu thật, sửa lỗi theo phân quyền (lỗi dữ liệu → A/B/C theo vùng; lỗi code → Agent Web).
