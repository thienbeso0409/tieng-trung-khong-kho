# CONTENT NOTES — Agent Chuyên môn A (HSK 1–3 + toàn bộ phần Nói + Shadowing)

Cập nhật: 2026-11-23. Chuẩn: HSK 3.0 (Phụ lục A của DATA_SCHEMA). Kết quả `node tools/validate-data.mjs`: **0 lỗi**. Các cảnh báo còn lại trong vùng của A chỉ là "từ đã có ở cấp thấp hơn / từ lặp trong file" (giải thích ở mục 3.2).

## 1. Số lượng thực tế

| File | Số lượng |
|---|---|
| `data/index.json` | Đủ 7 level (1–6, "7-9"), đường dẫn theo quy ước §2, kèm speaking |
| `vocab/hsk1.json` | 500 từ (target 500, complete), 468 có ví dụ (93%) |
| `vocab/hsk2.json` | 772 từ (target 772, complete), 485 có ví dụ (62%) |
| `vocab/hsk3.json` | 973 từ (target 973, complete), 578 có ví dụ (59%) |
| `exams/hsk1-de1.json` | 40 câu (L1–L4 5×4, R1–R4 5×4) + 3 câu ví dụ |
| `exams/hsk2-de1.json` | 60 câu (nghe 5/10/10, đọc 5/5/10/5, viết 5/5) + 5 câu ví dụ |
| `exams/hsk3-de1.json` | 70 câu (nghe 10/10/10, đọc 10/10/10, viết 5/5) + 4 câu ví dụ; `speaking_paper: "hsk3-de1-speaking"` |
| `writing/characters-hsk1.json` | 326 chữ (target 246) |
| `writing/characters-hsk2.json` | 291 chữ mới (target 125) |
| `writing/characters-hsk3.json` | 334 chữ mới (target 284) |
| `writing/practice-hsk1.json` | 12 reorder_words + 10 write_hanzi_from_pinyin |
| `writing/practice-hsk2.json` | 12 choose_component + 10 write_hanzi_from_pinyin + 10 reorder_words |
| `writing/practice-hsk3.json` | 16 write_hanzi_from_pinyin + 11 write_sentence + 15 reorder_words |
| `speaking/topics.json` | 42 chủ đề (6 mỗi level 1–6 và "7-9") |
| `speaking/hskk.json` | 5 papers (hsk3…hsk6, hsk7-9 `-de1-speaking`) + 78 item: HSK3 15 đề + 11 luyện; HSK4/5/6 mỗi cấp 5 đề + 10 luyện; 7-9 5 đề + 2 luyện; 5 rubric |
| `speaking/shadowing.json` | 9 bài TTS, 40 segment (L1 8, L2 8, L3 9, L4 5, L5 5, L6 5); 0 YouTube |

## 2. Nguồn tham khảo
- Cấu trúc đề HSK 2.0 (đã kiểm chứng trước khi đổi phạm vi): bản giới thiệu HSK 3 của Confucius Institute UK (confuciusinstitute.ac.uk, PDF "HSK-level-3"); chinesetest.cn trang HSK/1, HSK/3 (đã hiển thị cấu trúc HSK 3.0: HSK1 40 câu/35 phút, HSK3 70 câu/78 phút) — khớp với Phụ lục A của điều phối.
- HSKK sơ/trung (cấu trúc cũ, để tham khảo): LSE CIBL PDF "HSKK-1", "HSKK-2" — khớp bảng §7.
- Đại cương thi 2025: studycli.org ("The New HSK"), hsklord.com/dictionary/hsk/1–3 (danh sách từ theo đại cương CLEC 11/2025: 300 / 197 / 489 mục).
- Danh sách từ GF0025-2021: **ivankra/hsk30** (`hsk30.csv`, đúng 500/772/973) — nguồn chính của vocab. Đối chiếu thêm drkameleon/complete-hsk-vocabulary.
- Số nét, bộ thủ: **Make Me a Hanzi** (skishore/makemeahanzi, `graphics.txt`, `dictionary.txt`) — cùng nguồn dữ liệu nét với hanzi-writer-data nên số nét khớp animation.
- CVDICT (ph0ngp/CVDICT) chỉ dùng để tham chiếu; nghĩa tiếng Việt, Hán Việt, câu ví dụ đều do tôi viết tay.
- Pinyin câu ví dụ/đề: sinh tự động (pypinyin + jieba) rồi ghi đè bằng pinyin chính thức của danh sách từ, luật biến điệu 一/不, thanh nhẹ, 儿化, câu hỏi A不A; các chữ đa âm (还, 长, 得, 地, 了, 着, 过, 只, 为, 干…) đã rà tay toàn bộ và sửa bằng ký hiệu ép âm.

## 3. Quyết định & quy ước
1. **Danh sách từ**: theo [CHỐT] của điều phối — GF0025-2021 (500/772/973). Field tùy chọn `syllabus2025: true` + `syllabus2025_level` gắn cho từ có trong danh sách đại cương 2025 (theo hsklord.com). `standard` của file vocab là `"HSK3.0-2021"` (khác ví dụ `"HSK3.0-2025"` trong schema — cố ý, để không nhầm hai bộ).
2. **Mục từ trùng mặt chữ** (validator cảnh báo): danh sách chính thức có các mục cùng chữ khác âm/nghĩa (地 de/dì, 还 hái/huán, 干 gān/gàn, 长 cháng/zhǎng, 得 dé/de, 把 giới từ/lượng từ, 为 wéi…) và một số chữ được liệt kê lại ở cấp cao với nghĩa mới (过去, 头, 生, 叫…). Tôi giữ nguyên để đủ đúng số lượng chính thức; mỗi mục như vậy có `notes` "Cùng mặt chữ với hsk?-???? … khác nghĩa/cách dùng".
3. Mục có dạng biến thể (`爸爸|爸`, `第（第二）`, `有（一）些`, `…极了`, `称1`, `面1/面2`): `hanzi` lấy dạng chính (爸爸, 第, 有些, 极了, 称, 面), dạng khác ghi trong `notes`. `pos` cho phụ tố (们, 子, 家, 员, 者, 性, 化, 第, 老, 小, 初) = `trợ từ` + notes "Phụ tố (词缀)"; mục không có từ loại trong nguồn (cụm động-tân như 打电话) = `cụm từ`.
4. Pinyin vocab giữ đúng dạng chính thức (thanh gốc của 一/不, ví dụ `yīqǐ`, `bù kèqì`); pinyin câu (ví dụ, đề, nói) ghi theo biến điệu thực tế (`yìqǐ`, `bú kèqi`) để hỗ trợ phát âm.
5. **Chữ Hán**: cấp của chữ = cấp thấp nhất chữ xuất hiện trong vocab (2021) hoặc đại cương 2025 → bao phủ 100% chữ của vocab HSK1–2 và toàn bộ chữ nhận biết đại cương 2025 cấp 1–3. Vì vậy số chữ vượt `target_count` (246/125/284 theo đại cương 2025). Không gắn `handwrite` vì chưa có danh sách chữ viết tay 2025 tin cậy (cột WritingLevel của ivankra là chuẩn 2021, không khớp số 100/100/250).
6. **Đề thi**: theo đúng Phụ lục A.2; độ khó và từ vựng bám đại cương 2025 (kiểm tra tự động: mọi Text trong đề chỉ dùng từ ≤ cấp theo GF0025-2021 hoặc đại cương 2025; ngoài phạm vi: 行李箱, 熊猫 trong HSK3 L1 (có trong đại cương 2025 cấp 3), 跑步/踢足球 trong HSK2 (đại cương 2025 cấp 2)). `section.duration_minutes`: HSK1 15+20; HSK2 20+25+15; HSK3 28+35+20 (tổng 83 theo A.2). HSK3 W2 `write_sentence` có `max_points: 2`, `rubric_id: "rb-w-sentence"` (rubric nằm trong `exam.rubrics`). HSK3 có pinyin trong dữ liệu (để xem lại) nhưng `show_pinyin: false`; riêng stem phần viết HSK3 không có pinyin.
7. Đáp án: trong mọi part ≥ 5 câu, không chữ cái nào > 40%; match-type mỗi key một lần. Đã kiểm tra tự động: key nằm trong options, chữ cái nêu trong `explanation_vi` trùng `answer` (183 câu, 0 lỗi), và soát logic đáp án từng câu khi soạn (bẫy số, thời gian, phủ định); chưa có người thứ hai rà độc lập.
8. **Nói**: `hskk.json` theo A.4. Item thuộc đề có `in_paper: true` (field thêm, web có thể bỏ qua). Âm thanh `repeat: 1`. `keywords` 2–8 từ. HSK6, 7-9 không có pinyin trên prompt/sample (trình độ cao). Không soạn cấp HSKK độc lập `so/trung/cao` (tùy chọn theo schema mới).
9. **Topics**: thêm field `system_prompt` (tiếng Việt, mô tả nhập vai, giới hạn trình độ, cách sửa lỗi nhẹ nhàng bằng tiếng Việt vào `correction_vi`, định dạng JSON §9.3). `key_vocab` cấp 1–3 đã kiểm tra nằm trong phạm vi cấp.
10. **Shadowing**: chỉ TTS. **Không đưa video YouTube** vì không xác minh được videoId + mốc start/end chính xác trong phiên này.
11. `practice-hsk2` choose_component: vì practice không có group, mỗi câu có `options` (6 bộ kiện) và set có thêm `shared_options` giống hệt — đề xuất schema chính thức hóa (mục 5).

## 4. Hạn chế còn tồn tại
- `han_viet` chỉ có trong file chữ Hán; vocab chưa có `han_viet`, `topic`.
- Câu ví dụ vocab ~59–62% ở HSK2–3 (đạt ≥ 50%, chưa đủ 100%).
- Pinyin sinh tự động đã rà các chữ đa âm, nhưng cách tách từ (word spacing) đôi chỗ chưa thống nhất (vd `lù shàng`/`lùshang`, `qù guo`).
- Danh sách đại cương 2025 lấy từ trang thứ ba (hsklord.com), chưa có bản PDF chính thức → `syllabus2025` là "theo khả năng".
- Câu chủ quan HSKK/viết chỉ có 1–2 bài mẫu; chấm phụ thuộc AI.
- Script sinh dữ liệu (Python) nằm ở `/tmp/ttkk_build/` của phiên làm việc (do giới hạn chỉ được ghi `data/` và CONTENT_NOTES) — không lưu trong repo.

## 5. Đề xuất schema
- Cho phép `shared_options` ở cấp set trong `practice-*.json` (cho `choose_component`).
- Chính thức hóa `in_paper` (hskk items), `system_prompt` (topics), `syllabus2025`/`syllabus2025_level` (vocab).
- `target_count` của file chữ: nên ghi rõ theo chuẩn nào (2021 = 300/300/300, đại cương 2025 = 246/125/284).

## 6. Bổ sung 2026-11-23 (yêu cầu mới)
- `data/writing/radicals.json`: đủ 214 bộ Khang Hy (id, radical, variants, pinyin, han_viet, meaning_vi, strokes theo nhóm nét chuẩn, common = 72 bộ). `variant_to_radical` 306 khóa; đã kiểm: 100% giá trị `radical` trong mọi `characters-*.json` (cả cấp 4–9) map được. Quy ước 阝 → 阜, 15 chữ 阝 bên phải (都, 那, 部, 邮, 邻…) → 邑 qua `char_radical_override`. Đã thêm khóa `radicals` vào `index.json`, mô tả ở DATA_SCHEMA A.6.
- `shadowing.json`: thêm 26 video YouTube (cấp 1–2: 8, 3–4: 8, 5–6: 5, 7–9: 5), tất cả xác minh bằng YouTube oEmbed ngày 2026-11-23 (title/channel lấy từ oEmbed). `segments: []`, `auto_segments: true` — không bịa mốc thời gian. Một số video có giải thích tiếng Anh hoặc giọng Đài Loan (ghi ở `description_vi`). Schema: DATA_SCHEMA A.7.
- Validator hiện báo lỗi "segments rỗng" cho 26 item này → cần Agent Web cho phép `segments: []` khi `auto_segments: true`.
