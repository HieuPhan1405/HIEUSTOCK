# CloudStock — cloudstock.id.vn

Website tín hiệu kỹ thuật chứng khoán "Dao Găm" (Ichimoku 9-17-33 + Giao Găm
65-129), backtest 12 năm trên AmiBroker.

## Stack

- **Frontend:** Next.js (App Router) + Tailwind CSS, deploy trên Vercel
- **Backend:** FastAPI (kế hoạch deploy trên Railway)
- **Database:** Postgres (kế hoạch, trên Railway)
- **Nguồn dữ liệu:** xuất CSV thủ công từ AmiBroker (dữ liệu Fialda) → script
  Python đẩy lên API → lưu Postgres → hiển thị trên web. Không phải dữ liệu
  real-time — cập nhật theo lần chủ động chạy.

## Chạy local

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Cấu trúc

- `app/page.js` — trang chủ (dashboard tín hiệu + chi tiết mã cổ phiếu)
- `api_nhan_du_lieu.py` — khung backend FastAPI nhận CSV tín hiệu (chưa deploy)
