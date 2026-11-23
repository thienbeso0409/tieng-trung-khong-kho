# Tiếng Trung không khó 不难

Web luyện thi **HSK 3.0 (9 cấp: 1–6 và 7–9)** cho người Việt, đủ 4 kỹ năng Nghe – Nói – Đọc – Viết. Miễn phí, không cần đăng ký: mỗi người học trên trình duyệt của mình, tiến độ lưu ngay trên máy.

🌐 Bản chạy online: https://thienbeso0409.github.io/tieng-trung-khong-kho/

## Tính năng

| Mục | Có gì |
|---|---|
| **Từ vựng** | Danh sách có tìm kiếm (chữ Hán, pinyin không dấu, nghĩa, Hán Việt), lọc, phân trang (dùng được cả với ~5 600 từ HSK 7–9); nghe phát âm; thẻ ghi nhớ lật; ôn tập ngắt quãng (SRS); đánh dấu đã thuộc. |
| **Nghe** | Luyện từng phần theo dạng đề HSK; giọng nam/nữ/dẫn khác nhau; phát đúng số lần như đề thật, nghỉ giữa các lần; giới hạn lượt nghe; nộp bài → điểm, transcript, giải thích. |
| **Đọc** | Luyện từng phần, bật/tắt pinyin, đoạn văn có chỗ trống đánh số, chấm + giải thích. |
| **Viết** | Hanzi Writer: animation thứ tự nét, tự viết trên ô 田字格 (máy kiểm từng nét), các bước nét; bài viết dạng HSK (sắp xếp câu, viết chữ theo pinyin, chọn bộ kiện, đặt câu, viết đoạn, kể chuyện theo tranh, mô tả biểu đồ, dịch) – AI chấm khi có key. |
| **Nói** | Hội thoại với AI theo chủ đề (nói bằng micro hoặc gõ, AI đọc to, pinyin + dịch, "Sửa lỗi cho tôi"); Shadowing bằng giọng máy hoặc video YouTube (lặp đoạn, chỉnh tốc độ, ghi âm nghe lại, tô màu chữ đúng/sai, tự thêm video của bạn); Thi nói HSK 3.0/HSKK (đếm giờ chuẩn bị/trả lời, ghi âm, AI chấm theo tiêu chí). |
| **Thi thử** | Đề đầy đủ có đồng hồ, tự nộp khi hết giờ, điểm từng phần + tổng, Đạt/Chưa đạt (HSK 1–6) hoặc xếp bậc 7/8/9 ước lượng (HSK 7–9), xem lại từng câu. |
| **Tiến độ** | Lịch sử thi/luyện, từ đã thuộc, chữ đã viết, chuỗi ngày học; xuất/nhập file JSON để chuyển máy. |
| **Cài đặt** | API key Gemini (có hướng dẫn lấy miễn phí), chọn model, giọng đọc nam/nữ, tốc độ, giao diện sáng/tối. |

## Cách dùng nhanh

1. Mở trang web bằng **Chrome hoặc Edge** (nhận dạng giọng nói tiếng Trung chỉ chạy tốt trên 2 trình duyệt này).
2. Chọn cấp HSK ở góc trên.
3. (Khuyến nghị) Vào **Cài đặt** → dán **API key Gemini miễn phí** để dùng AI:
   - Vào https://aistudio.google.com/app/apikey, đăng nhập Google, bấm **Create API key**, sao chép key (`AIza…`), dán vào Cài đặt → **Lưu** → **Kiểm tra key**.
   - Không có key: vẫn học được mọi thứ; câu tự luận và bài nói được chấm sơ bộ bằng so khớp đáp án mẫu.
4. Nếu máy không có giọng đọc tiếng Trung: xem hướng dẫn trong Cài đặt (Edge có sẵn giọng tự nhiên).

## Chạy trên máy (local)

Trang dùng `fetch()` để đọc dữ liệu nên **không mở trực tiếp file `index.html`** — cần một máy chủ web tĩnh:

```bash
cd tieng-trung-khong-kho
python3 -m http.server 8000
# mở http://localhost:8000
```

Dữ liệu kiểm thử (đủ mọi dạng câu): http://localhost:8000/?data=test/data/

Không cần cài gì thêm, không có bước build. Thư viện ngoài (Hanzi Writer, YouTube IFrame API, Google Fonts) tải qua CDN.

## Deploy GitHub Pages

1. Đẩy mã lên nhánh `main` của repo `tieng-trung-khong-kho`.
2. GitHub → **Settings → Pages** → Source: *Deploy from a branch* → Branch `main`, thư mục `/ (root)` → Save.
3. Sau 1–2 phút trang có ở `https://<tên-tài-khoản>.github.io/tieng-trung-khong-kho/`.

Mọi đường dẫn đều tương đối nên chạy được ở gốc lẫn thư mục con. File `.nojekyll` đã có sẵn.

## Thêm / sửa nội dung

Toàn bộ nội dung nằm trong `data/` (JSON), định dạng mô tả chi tiết ở [`docs/DATA_SCHEMA.md`](docs/DATA_SCHEMA.md).

- **Thêm đề mới**: tạo `data/exams/hsk{L}-de{k}.json` theo schema, rồi khai báo trong `data/index.json` ở `levels[].exams`:
  ```json
  { "id": "hsk1-de2", "file": "exams/hsk1-de2.json", "title_vi": "Đề thi thử HSK 1 – Đề 2" }
  ```
- **Thêm cấp / từ vựng / chữ Hán / bài viết**: thêm hoặc sửa file khai báo trong `levels[]` (`vocab`, `characters`, `practice`). Web lấy danh sách cấp hoàn toàn từ manifest; file khai báo mà chưa có sẽ hiện "Đang soạn".
- **Chủ đề hội thoại, đề nói, shadowing**: `data/speaking/topics.json`, `hskk.json`, `shadowing.json`.
- **Kiểm tra dữ liệu** trước khi đẩy lên (Node 18+, không cần cài gì):
  ```bash
  node tools/validate-data.mjs            # kiểm tra data/
  node tools/validate-data.mjs test/data  # kiểm tra thư mục khác
  ```
  Báo lỗi (✗, exit code 1) và cảnh báo (⚠): JSON hợp lệ, trường bắt buộc, type hợp lệ, đáp án nằm trong phương án, số câu khớp `expected_count` và cấu trúc HSK 3.0, `no` liên tục, rubric, chỗ trống đánh số, file thiếu…

## Cấu trúc mã

```
index.html            khung trang (SPA, router hash #/...)
css/style.css         giao diện (sáng/tối, responsive)
js/app.js             khởi động + router
js/data.js            đọc manifest & dữ liệu (?data=… để đổi thư mục)
js/storage.js         localStorage an toàn (tiền tố ttkk:), xuất/nhập
js/settings.js tts.js speech.js gemini.js compare.js srs.js ui.js
js/exam/              types.js (render + chấm từng dạng câu), runner.js (làm bài, đồng hồ, chấm), ai-grade.js
js/pages/             từng trang: home, vocab, exam(s), skill, writing-*, chat, shadowing, hskk, progress, settings
tools/validate-data.mjs
test/                 dữ liệu kiểm thử + script Playwright (e2e_routes.py, e2e_flow.py) + ảnh chụp
```

## Quyền riêng tư

Không có máy chủ riêng. Tiến độ, cài đặt và API key chỉ lưu trong trình duyệt (localStorage). Khi dùng AI, nội dung câu trả lời được gửi trực tiếp tới Google Gemini bằng key của chính bạn. Nhận dạng giọng nói của Chrome/Edge xử lý qua dịch vụ của trình duyệt.
