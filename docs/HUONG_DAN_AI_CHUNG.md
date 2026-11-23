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

## Ghi chú an toàn

- Key nằm trong Secret của Cloudflare, người dùng web không thấy được.
- Worker chỉ nhận yêu cầu từ `https://thienbeso0409.github.io` và giới hạn số lượt mỗi người/ngày.
- Ai muốn dùng nhiều hơn vẫn có thể dán key riêng ở trang Cài đặt; key riêng được ưu tiên.
