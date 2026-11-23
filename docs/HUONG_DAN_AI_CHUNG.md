# Hướng dẫn bật AI dùng chung (máy trung gian Cloudflare)

Sau khi làm xong, mọi người vào web là dùng AI được ngay, không cần tự dán key.

## Bước 1 — Lấy key Gemini API

1. Mở https://aistudio.google.com/app/apikey, đăng nhập Gmail.
2. Bấm **Create API key** → sao chép chuỗi bắt đầu bằng `AIza…`.
3. (Khuyến nghị nếu có gói Google AI Pro) Trong AI Studio, bật **Billing** cho dự án và nhận **Google Cloud credits hằng tháng** của gói Pro để key có hạn mức cao hơn gói miễn phí. Nhớ đặt **giới hạn ngân sách** (budget alert) để không bị trừ tiền ngoài ý muốn.

> Gói Google AI Pro (Gemini Pro trong app) **không tự cộng** hạn mức cho API key. Key dùng hạn mức miễn phí, hoặc credits/billing nếu bạn bật ở bước 3.

## Bước 2 — Tạo máy trung gian trên Cloudflare (miễn phí)

1. Đăng ký https://dash.cloudflare.com/sign-up (miễn phí, xác nhận email).
2. Menu trái: **Compute (Workers)** → **Workers & Pages** → **Create** → **Create Worker** (mẫu "Hello World").
3. Đặt tên: `ttkk-ai` → **Deploy**.
4. Bấm **Edit code**, xóa hết code mẫu, dán toàn bộ nội dung file [`worker/worker.js`](../worker/worker.js) → **Deploy**.
5. Quay lại trang Worker → **Settings** → **Variables and Secrets** → **Add**:
   - Type **Secret**, Name `GEMINI_API_KEY`, Value: key `AIza…` ở bước 1.
   - (Tùy chọn) Type **Text**, Name `DAILY_LIMIT`, Value: số lượt AI mỗi người/ngày (mặc định 60).
   - Bấm **Deploy**/**Save**.
6. Sao chép địa chỉ Worker, dạng `https://ttkk-ai.<tên-bạn>.workers.dev`.

## Bước 3 — Gắn vào web

Gửi địa chỉ Worker cho Claude, hoặc tự sửa file `js/config.js`:

```js
export const SHARED_AI_URL = 'https://ttkk-ai.<tên-bạn>.workers.dev';
```

## Bước 4 (tùy chọn) — Bật tìm video YouTube ngay trong web

Không bắt buộc: thiếu bước này, trang Shadowing vẫn có nút **"Mở tìm kiếm trên YouTube"** và ô dán link.

1. Mở https://console.cloud.google.com/ (cùng tài khoản Google), chọn hoặc tạo một dự án.
2. Menu **APIs & Services → Library** → tìm **YouTube Data API v3** → **Enable**.
3. **APIs & Services → Credentials → + Create credentials → API key** → sao chép key.
4. (Khuyến nghị) Bấm **Edit API key** → *API restrictions* → **Restrict key** → chỉ chọn *YouTube Data API v3* → Save.
5. Trong Cloudflare Worker → **Settings → Variables and Secrets → Add**:
   - Type **Secret**, Name `YOUTUBE_API_KEY`, Value: key vừa tạo.
   - (Tùy chọn) Type **Text**, Name `YT_DAILY_LIMIT`: số lượt tìm mỗi người/ngày (mặc định 20).
   - Bấm **Deploy**.
6. Dán lại toàn bộ `worker/worker.js` mới nhất vào Worker nếu bạn đã tạo Worker từ bản cũ (bản mới có route `yt_search`).

Ghi chú: hạn mức miễn phí của YouTube Data API là 10 000 đơn vị/ngày, mỗi lượt tìm tốn 100 đơn vị (≈ 100 lượt tìm/ngày cho cả web). Worker tự lưu tạm kết quả tìm giống nhau trong 6 giờ để tiết kiệm.

## Tạo câu shadowing bằng AI

Ở trang Shadowing, video chưa có câu luyện sẽ có nút **"Tạo câu shadowing bằng AI"**: Gemini xem trực tiếp video YouTube (chỉ video công khai) và chia câu kèm mốc thời gian. Mỗi lần tạo tính 1 lượt AI. Kết quả lưu trên trình duyệt theo từng video nên lần sau không gọi lại. Worker chỉ cho phép đính kèm link YouTube (không nhận file khác).

## Ghi chú an toàn

- Key nằm trong Secret của Cloudflare, người dùng web không thấy được.
- Worker chỉ nhận yêu cầu từ `https://thienbeso0409.github.io` và giới hạn số lượt mỗi người/ngày.
- Ai muốn dùng nhiều hơn vẫn có thể dán key riêng ở trang Cài đặt; key riêng được ưu tiên.
