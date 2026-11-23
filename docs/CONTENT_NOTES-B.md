# CONTENT NOTES – Agent B (HSK 4, 5, 6)

## Số lượng thực tế

| File | Số lượng | Ghi chú |
|---|---|---|
| `vocab/hsk4.json` | 1 000 / 1 000 (`complete: true`) | 100 % có `example` |
| `vocab/hsk5.json` | 1 071 / 1 071 (`complete: true`) | 100 % có `example` |
| `vocab/hsk6.json` | 1 140 / 1 140 (`complete: true`) | 100 % có `example` |
| `writing/characters-hsk4.json` | 264 chữ (target 441 → `complete: false`) | 163 chữ `handwrite: true` |
| `writing/characters-hsk5.json` | 289 chữ (target 431 → `complete: false`) | 91 chữ `handwrite` |
| `writing/characters-hsk6.json` | 296 chữ (target 413 → `complete: false`) | 25 chữ `handwrite` |
| `exams/hsk4-de1.json` | 70 câu (L 14+18, R 10+15+7, W 5+1) | `speaking_paper: hsk4-de1-speaking` |
| `exams/hsk5-de1.json` | 72 câu (L 19+16, R 10+10+15, W 1+1) | `speaking_paper: hsk5-de1-speaking` |
| `exams/hsk6-de1.json` | 82 câu (L 8+20+12, R 10+10+20, W 1+1) | `speaking_paper: hsk6-de1-speaking` |
| `writing/practice-hsk4.json` | 12 `write_sentence` + 3 `write_essay` | |
| `writing/practice-hsk5.json` | 3 `picture_story_writing` + 3 `write_essay` | |
| `writing/practice-hsk6.json` | 3 `write_essay` practical + 3 argumentative | |

`node tools/validate-data.mjs`: 0 lỗi. Phần của B chỉ còn cảnh báo "từ đã có ở cấp thấp hơn / từ lặp trong file" (xem bên dưới).

## Nguồn
- Danh sách từ, chữ: GF0025-2021, repo `ivankra/hsk30` (`hsk30.csv`, `hsk30-chars.csv`), lấy về ngày 23/11/2026.
- Số nét, bộ thủ: `skishore/makemeahanzi` (`dictionary.txt`, `graphics.txt` — số nét = số stroke trong dữ liệu Hanzi Writer).
- Nghĩa tiếng Việt, Hán Việt, câu ví dụ, đề thi, bài viết mẫu: B tự soạn (không dùng CVDICT, không chép đề thật).
- Pinyin của câu ví dụ: sinh tự động bằng `pypinyin` + `jieba`, từ đích ép theo pinyin chuẩn của hsk30, kèm luật sửa 得/地/长/儿hóa. **Có thể còn lỗi đa âm hoặc thanh nhẹ ở một số từ phụ (ước tính dưới 2 % số câu)**; pinyin của chính từ vựng (`word.pinyin`) lấy nguyên từ nguồn nên chính xác.

## Các giả định đã theo
- Từ vựng: theo [CHỐT] GF0025-2021 (1000/1071/1140). `syllabus2025` chưa đánh vì không có danh sách đối chiếu tin cậy.
- Chữ Hán: `hsk30-chars.csv` chỉ có 300 chữ mỗi cấp 4–6 (theo GF0025). Bỏ các chữ đã có trong `characters-hsk1..3` của A (36 / 11 / 4 chữ), nên còn 264 / 289 / 296 chữ. `target_count` vẫn ghi 441/431/413 theo Phụ lục A.1 nên `complete: false`. `handwrite: true` = chữ có cột `WritingLevel` trong nguồn.
- Đề: `repeat: 1` và `pass_score: 180` cho HSK5–6 là giả định theo Phụ lục A. HSK4 R2 câu 51–57 chia thành đoạn 2 + 2 + 3 câu (Phụ lục nói "mỗi đoạn 2 câu", nhưng 7 câu là số lẻ). HSK4 R3 (7 câu) tách thành 2 đoạn: 4 chỗ trống với 5 câu chọn, 3 chỗ trống với 4 câu chọn (mỗi đoạn có 1 câu thừa). HSK5 L2: 4 đoạn × 3 câu + 2 đoạn × 2 câu.
- Rubric: mỗi mức điểm có một rubric riêng, với `max_score` = `max_points` của câu (`rb-sentence-4`, `rb-essay-20`, `rb-essay-40`, `rb-essay-60`, `rb-practical-40`, `rb-argument-60`).
- Phương án trắc nghiệm được xếp vị trí bằng script để chia đều đáp án. Không part nào có một chữ cái chiếm quá 30 %. `explanation_vi` ghi chữ cái đáp án đúng sau khi đã xếp.

## Cảnh báo từ vựng còn lại (cố ý giữ lại)
GF0025 có những mục cùng mặt chữ với từ ở cấp thấp nhưng là nghĩa, từ loại hoặc âm đọc mới (vd 别 bié "cài, ghim", 次 "kém", 才 "tài năng", 好 hào, 种 zhòng; 批 có cả động từ và lượng từ; 界/族/品 vừa là từ vừa là hậu tố). Giữ lại cho đủ số lượng chính thức. Mỗi mục có `notes` giải thích, `meaning_vi` ghi đúng nghĩa mới. Hậu tố (品/界/力/长/族) có `pos: "danh từ"` và `meaning_vi` mở đầu bằng "(hậu tố …)". Nếu muốn, có thể thêm `pos` "hậu tố" vào schema.

## Phạm vi từ vựng trong đề
Kiểm bằng jieba so với từ ≤ cấp trong hsk30: số token ngoài danh sách thô là 4.5 % (HSK4), 3.2 % (HSK5), 3.7 % (HSK6). Phần lớn là số đếm, cụm ghép từ hai từ trong danh sách (多长时间, 四十分钟…), tên riêng (苏州园林, 孔子) và thành ngữ có chú giải trong câu hỏi (守株待兔, 应运而生). Từ ngoài phạm vi thật sự nằm dưới 3 %, ví dụ: 拖延, 骆驼, 驼峰, 脂肪, 免疫力, 急诊科, 天赋.

## Rà soát
- Đã đọc lại ngẫu nhiên 20 câu mỗi đề, đối chiếu đáp án với transcript hoặc đoạn văn: đều khớp. Đã sửa các phương án nhiễu có thể gây tranh cãi (宝贵/珍贵, 帮忙/帮助, 安心/放心, 体验/体会…).
- Mọi câu nghe đều có speaker (男/女/旁白). Câu hỏi của đoạn nghe nhiều câu nằm trong `audio` riêng của câu đó (旁白).

## Đề nghị cho A (data/index.json)
`index.json` hiện đã có đủ đường dẫn level 4–6 (`vocab`, `characters`, `practice`, `exams`), không cần thêm mục. Đề nói HSK 4–6 cần có id `hsk4-de1-speaking`, `hsk5-de1-speaking`, `hsk6-de1-speaking` trong `speaking/hskk.json`.

## Script (ngoài repo)
`/home/claude/scripts-b/` (gen_vocab.py, gen_chars.py, gen_practice.py, exams/hsk4|5|6.py, oov.py). Nội dung thô nằm ở `/home/claude/scripts-b/content/`.

## Bổ sung: đề 2 và đề 3 (HSK 4–6)
- `exams/hsk4-de2.json`, `hsk4-de3.json` (mỗi đề 70 câu); `hsk5-de2.json`, `hsk5-de3.json` (72 câu); `hsk6-de2.json`, `hsk6-de3.json` (82 câu). Cấu trúc giống đề 1 (Phụ lục A.2), nội dung mới hoàn toàn: công việc, môi trường, khoa học, văn hóa, xã hội, giáo dục.
- Mỗi đề: đáp án chia đều (không part nào có một chữ cái quá 40 %), `explanation_vi` cho từng câu, rubric và bài mẫu cho câu tự luận. Đã rà 25 câu ngẫu nhiên mỗi đề.
- `speaking/hskk.json`: chỉ **thêm** 6 paper `hsk{4,5,6}-de{2,3}-speaking` vào mảng `papers`, ghép từ các item luyện tập có sẵn của A, không tạo item mới. `hsk4-de3` dùng lại item `hsk4-s-11` (cũng có trong đề 1).
- Validator (chạy trên bản sao data có index đã thêm đề 2–3): 0 lỗi.
- Script: `/home/claude/scripts-b/exams/assemble.py` cùng `hsk{4,5,6}_de{2,3}.py`.
