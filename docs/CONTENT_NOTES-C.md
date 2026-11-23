# CONTENT_NOTES-C — HSK 7–9 (Agent C)

## File đã ghi
- `data/vocab/hsk7-9.json` — 5 636 từ (đủ `target_count`), `complete: true`.
- `data/writing/characters-hsk7-9.json` — 1 199 chữ.
- `data/exams/hsk7-9-de1.json` — 86 câu (nghe 40, đọc 40, viết 2, dịch 4) + `speaking_paper: "hsk7-9-de1-speaking"` (5 mục nói do A soạn) = 91 mục.

## Nguồn
- Danh sách từ/chữ: GF0025-2021, repo `ivankra/hsk30` (MIT): `hsk30.csv` (cấp `7-9`), `hsk30-chars.csv`.
- Nghĩa tiếng Việt: dựng nháp từ CVDICT (`ph0ngp/CVDICT`, CC BY-SA 4.0), lọc sense rác (họ, biến thể, Đài Loan, lượng từ…), rồi rà soát thủ công toàn bộ danh sách; ~1 200 mục được viết lại tay (sai nghĩa, quá dài, sót tiếng Anh, tên thương hiệu…). Các nghĩa còn lại giữ bản CVDICT đã làm sạch — vẫn có thể còn diễn đạt chưa tự nhiên.
- Số nét, bộ thủ: `makemeahanzi` (dictionary.txt, graphics.txt — cùng dữ liệu nét với hanzi-writer-data).
- Pinyin của từ: lấy nguyên `hsk30` (dấu thanh, không ghi biến điệu). Pinyin câu ví dụ: sinh tự động bằng pypinyin + jieba, có đăng ký pinyin từ CEDICT cho từ HSK; có thể sai lẻ tẻ ở chữ đa âm/thanh nhẹ (vd. 东西 dōngxī), tách từ chưa hoàn hảo.

## Số liệu thực tế
- Vocab: 5 636/5 636 từ có `meaning_vi` (100%); 1 560 từ có `example` (27,7%) — ưu tiên 1 560 từ tần suất cao nhất (theo tần suất từ điển jieba). **Chưa đạt ngưỡng ≥ 50% ví dụ** của checklist chung (validator cảnh báo); đã đạt mục tiêu ≥ 1 500 được giao.
- Câu ví dụ và nội dung đề: tự soạn 100%.
- `pos`: theo POS của hsk30; mục trống POS → `động từ` nếu là từ ly hợp (∥), còn lại `cụm từ` (chủ yếu thành ngữ/cụm cố định). `Suffix` → `trợ từ` (giả định).
- Mục đa nghĩa / phụ tố trong GF0025: lấy dạng sạch (vd. `度（知名度）` → `度`, có `notes` ghi mục gốc).
- 15 hanzi lặp trong file (成年, 大意, 担, 地道, 缝, 哄, 晃, 率, 麻, 码, 闷, 拧, 且, 则, 之) là các mục riêng biệt trong danh sách gốc (khác âm/nghĩa) — giữ nguyên. Vài từ trùng hanzi với cấp thấp (该, 像, 痛…) cũng là mục riêng của GF0025 cho cấp 7–9 (nghĩa/cách dùng khác).
- Chữ Hán: 1 200 chữ cấp 7–9 trong hsk30-chars, bỏ 1 chữ (凌) đã có ở file cấp thấp hơn → 1 199 (≥ target 1 148, `complete: true`). Không đánh `handwrite` vì nguồn chỉ có danh sách viết tay cho cấp 1–3. Nghĩa chữ: dùng nghĩa từ đơn trong vocab 7–9 nếu có, còn lại từ CVDICT (cắt ≤ 60 ký tự) + ~35 mục sửa tay; mới rà soát lướt.

## Đề hsk7-9-de1 — giả định đã theo
- L2: 3 nhóm × 4 câu (3 `choose_option` + 1 `short_answer`); L3: 3 nhóm × 6 câu (5 + 1). Mỗi câu nghe có `audio` riêng (dòng 旁白 đọc câu hỏi), bài nghe chính ở `group.audio`, `repeat: 1`.
- R1: 3 bài × 7 câu; R2: `cloze_sentence` 5 chỗ trống (62)–(66), 7 phương án A–G (2 nhiễu) → validator cảnh báo "> 6 phương án" (đúng theo A.2, không phải lỗi); R3: 2 bài × 7 câu `short_answer` (≤ 10 chữ).
- Điểm câu chủ quan: short_answer 1; chart 40; essay 60; dịch viết 25×2; dịch nói 25×2. Rubric: `rb-short`, `rb-chart`, `rb-essay`, `rb-translate`, `rb-translate-oral`.
- Dịch: nguồn tiếng Anh (`source.lang: "en"`) + `source_vi` tóm tắt; `reference_zh` đầy đủ.
- Đã rà soát toàn bộ 30 câu khách quan nghe + 21 câu R1 + 5 câu R2 + 14 câu R3 đối chiếu transcript/bài đọc; phân bố đáp án mỗi part ≤ 40%; L1 5 đúng/5 sai.

## Đề nghị cho data/index.json (Agent A)
- Level "7-9" đã trỏ đúng `vocab/hsk7-9.json`, `writing/characters-hsk7-9.json`, `exams/hsk7-9-de1.json`; `practice: null` (C không có file practice).
- Cần A tạo paper `hsk7-9-de1-speaking` trong `speaking/hskk.json`.

## Đề xuất schema
- Cho phép `option` lên tới 7 (A–G) cho `cloze_sentence` 7-9 mà không cảnh báo.
- Field `homograph_of`/`sense` cho các mục trùng hanzi trong cùng cấp.

## Tồn tại
- Ví dụ mới 27,7% (cần thêm ~1 260 câu để đạt 50%).
- Nghĩa ~4 400 từ không viết tay là bản CVDICT đã lọc: chính xác về cơ bản nhưng cần hiệu đính thêm văn phong.
- Script sinh dữ liệu: `/home/claude/scripts-c/` (s1–s5), dữ liệu nguồn `/home/claude/srcdata-c/`, override/ví dụ `/home/claude/work-c/`.

## Bổ sung: đề 2 và đề 3
- `data/exams/hsk7-9-de2.json`, `hsk7-9-de3.json`: mỗi đề 86 câu, cấu trúc như đề 1, nội dung mới hoàn toàn. Đề 2: nghe về du lịch ngược, livestream nông sản, phục chế cổ vật, vi nhựa, giả dược, đảo nhiệt đô thị, đường cong quên; đọc về rác vũ trụ, hệ vi sinh đường ruột, kinh tế bạc, 24 tiết khí, cây tre, cá heo; biểu đồ cột về cơ cấu điện; luận về "nhanh và chậm". Đề 3: nghe về "rừng thẳng đứng", dịch văn học, AI chẩn đoán, số Dunbar, chống sa mạc hóa, kinh tế học hành vi; đọc về nghề làm giấy, kinh tế đêm, ong mật, gấu trúc, hải đăng, chủ nghĩa tối giản; biểu đồ tròn về chi tiêu; luận về nhận diện khuôn mặt và quyền riêng tư.
- Đã soát toàn bộ câu chọn đáp án ở L2, L3 và R1 của cả hai đề (24 + 21 câu mỗi đề); các câu đúng/sai, R2 và R3 soát lúc soạn.
- `speaking/hskk.json`: chỉ thêm 10 item `hsk7-9-s-21..25`, `hsk7-9-s-31..35` và 2 paper `hsk7-9-de2-speaking`, `hsk7-9-de3-speaking`. Đọc file ngay trước khi ghi; không đụng mục khác.
- Đề nghị A thêm vào `index.json` (level "7-9"): `{id:"hsk7-9-de2", file:"exams/hsk7-9-de2.json", title_vi:"Đề thi thử HSK 7–9 – Đề 2"}` và tương tự cho de3.
