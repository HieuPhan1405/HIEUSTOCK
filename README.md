# CloudStock — cloudstock.id.vn

Website tín hiệu kỹ thuật chứng khoán "Dao Găm" (Ichimoku 9-17-33 + Giao Găm
65-129), backtest 12 năm trên AmiBroker.

## Stack

- **Frontend + Backend:** Next.js (App Router, Route Handlers) + Tailwind
  CSS, deploy trên Vercel
- **Database:** Postgres (Neon, tạo qua Vercel → Storage → Create Database)
- **Nguồn dữ liệu:** AmiBroker quét toàn bộ thị trường (`amibroker/7_Export_LenWeb.afl`)
  → xuất CSV → `day_du_lieu_len_web.py` đẩy lên `/api/upload-signals` → lưu
  Postgres → hiển thị trên web qua `/api/signals`. Không phải dữ liệu
  real-time — cập nhật theo lần chủ động chạy (hoặc theo lịch Windows Task
  Scheduler nếu đã tự động hoá).

## Chạy local

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

Cần biến môi trường trong `.env.local` (không commit file này):

```
DATABASE_URL=postgres://...   # lấy từ Vercel Storage sau khi tạo Postgres
UPLOAD_API_KEY=chuoi-bi-mat-tuy-chon
```

## Cấu trúc

- `app/page.js` — trang chủ (dashboard tín hiệu + chi tiết mã cổ phiếu),
  fetch dữ liệu thật từ `/api/signals`, có dữ liệu mẫu dự phòng khi chưa có
  dữ liệu từ AmiBroker
- `app/api/upload-signals/route.js` — nhận CSV tín hiệu (cần header
  `x-api-key`), lưu/ghi đè vào bảng `tin_hieu`
- `app/api/signals/route.js` — trả JSON danh sách tín hiệu hiện tại cho
  frontend
- `lib/db.js` — kết nối Postgres (Neon) + tạo bảng nếu chưa có
- `amibroker/7_Export_LenWeb.afl` — chạy trong AmiBroker (Explore, Apply to:
  All Symbols) để quét toàn bộ thị trường và tự động xuất CSV
- `day_du_lieu_len_web.py` — đọc CSV vừa xuất, đẩy lên `/api/upload-signals`

## Luồng dữ liệu đầy đủ

```
AmiBroker (7_Export_LenWeb.afl, Explore)
  → xuất C:\DaoGam_Data\tin_hieu_hom_nay.csv
  → day_du_lieu_len_web.py (POST kèm x-api-key)
  → /api/upload-signals (Next.js, Vercel) → Postgres (Neon)
  → /api/signals (GET) → app/page.js hiển thị
```

Muốn tự động hoá hoàn toàn: dùng Windows Task Scheduler để (1) mở AmiBroker
chạy Batch chứa Explore này theo giờ cố định, và (2) chạy
`day_du_lieu_len_web.py` ngay sau đó — miễn máy tính đang bật và AmiBroker
đang kết nối data feed vào đúng giờ chạy.
