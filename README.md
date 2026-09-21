# CloudStock — cloudstock.id.vn

Website tín hiệu kỹ thuật chứng khoán (Ichimoku 9-17-33 + đường cân bằng dài hạn 65-129), quét toàn bộ
HOSE/HNX/UPCOM, backtest nhiều năm trên AmiBroker. Dữ liệu **không phải thời gian thực** — cập nhật khi chủ
web đẩy lên sau mỗi phiên (trang có nhãn "Dữ liệu cập nhật lúc …").

## Stack

- **Frontend + Backend:** Next.js (App Router, Route Handlers) + Tailwind CSS, deploy trên Vercel
  (push lên `main` là tự deploy, mất khoảng 1–2 phút).
- **Database:** Postgres (Neon). Bảng tạo/nâng cấp tự động (`ADD COLUMN IF NOT EXISTS`) trong `lib/db.js`.
- **Nguồn dữ liệu:** AmiBroker Explore toàn thị trường → CSV → script Python đẩy lên API → lưu Postgres.

## Chạy local

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Cần `.env.local` (không commit):

```
DATABASE_URL=postgres://...   # từ Vercel Storage (Neon)
UPLOAD_API_KEY=chuoi-bi-mat   # phải khớp API_KEY trong day_tat_ca_len_web.py
```

Không có `DATABASE_URL` thì các trang vẫn mở được nhưng báo "Lỗi tải dữ liệu".

Kiểm tra trước khi push:

```bash
npx eslint .
npm run build
```

## Luồng dữ liệu (2 việc mỗi phiên)

```
AmiBroker Explore (All Symbols, Analysis threads = 1)
  7_Export_LenWeb.afl  → C:\DaoGam_Data\tin_hieu_hom_nay.csv   (46 cột, header khớp theo tên)
  8_Export_ChecklistBatDay.afl → C:\DaoGam_Data\bat_day_hom_nay.csv
        ↓
day_tat_ca_len_web.py  (hoặc bấm đúp DAY_LEN_WEB.bat)
        ↓  POST + header x-api-key
/api/upload-signals , /api/upload-bat-day  → Postgres (Neon)
        ↓
Các trang đọc trực tiếp từ DB (lib/tinHieu.js, lib/batDay.js, lib/lenhDaDong.js)
```

Chạy từ dòng lệnh, thoát ngay không chờ Enter:

```bash
python C:/Users/hieu/web/day_tat_ca_len_web.py --khong-doi
```

Lưu ý khi đẩy dữ liệu:

- Analysis phải để **1 thread** — nhiều thread làm AmiBroker ghi dính dòng CSV, dòng lỗi bị web bỏ qua (script
  cảnh báo trước khi gửi).
- Route chỉ xoá các mã cũ không còn trong CSV khi nhận ≥ 100 dòng và không có dòng lỗi.
- **Không backtest bằng file 7** (file 7 ghi CSV); backtest dùng `9_XemChart_FULL.afl`. Hai file giữ logic tín
  hiệu giống nhau, sửa file này thì sửa file kia.

## Cấu trúc chính

- `app/` — trang: Tổng quan (`page.js`), Bộ lọc (`bo-loc`), Sổ lệnh đang mở (`lenh-mo`), **Lệnh đã đóng**
  (`lenh-da-dong`), Checklist bắt đáy (`bat-day`), Thông tin thị trường (`thi-truong`), Chi tiết mã (`ma/[ma]`),
  Hướng dẫn (`huong-dan`), Liên hệ (`lien-he`), Quản trị (`quan-tri`, noindex). Có `not-found.js`, `error.js`,
  `robots.js`, `sitemap.js`.
- `app/bieu-do` + `components/BieuDoKyThuat.js` — biểu đồ kỹ thuật (thư viện lightweight-charts của TradingView): nến, khối lượng,
  Ichimoku 9-17-33, đường cân bằng dài hạn 65/129, MA, vùng mua/SL/TP. Chỉ báo tính ở `lib/chiBaoKyThuat.js` (giống AFL, đã đối chiếu
  Kijun / đường cân bằng với giá trị AFL xuất lên web). Giá lấy qua `/api/gia-lich-su` → `lib/lichSuGia.js` (API công khai VNDirect: finfo
  cho cổ phiếu, dùng giá ĐÃ điều chỉnh adOpen/adHigh/adLow/adClose vì khớp AmiBroker ~345/389 mã; dchart cho VN-Index) — bên thứ ba không chính thức, có thể đổi/chặn.
- `app/danh-muc` — Danh mục cá nhân: mã người dùng đã "tham gia" (bảng `tham_gia_ma`) + lệnh hiện tại của mã đó + lệnh đã đóng từ ngày tham gia.
  `/api/backfill-tp3` (cần x-api-key; GET xem trước, POST `?ap-dung=1` ghi) nạp một lần các lệnh đã chạm TP3 từ trước vào `lenh_da_dong`.
- `app/api/upload-signals/route.js` — nhận CSV tín hiệu: upsert theo mã, đóng băng giá vào/SL/TP lần đầu MUA,
  phát hiện lệnh vừa đóng, gửi Zalo khi có mã MUA mới.
- `lib/db.js` — kết nối Postgres, tạo/nâng cấp bảng (`tin_hieu`, `lenh_da_dong`, …).
- `lib/giaVaoWeb.js` — đóng băng giá vào lệnh, SL, TP1–3 theo vòng đời lệnh.
- `lib/lenhDaDong.js` — phát hiện lệnh đóng (NẮM GIỮ → BÁN/thoát), ghi và thống kê. Ngày/giá bán lấy theo lần
  upload lúc lệnh đổi trạng thái (xấp xỉ giá đóng cửa, không phải giá khớp thật).
- `components/dungChung.js` — hàm dùng chung: vùng mua/SL/TP (`tinhVungLenh`), chuẩn mã ưu tiên
  (giá > 10.000đ, vốn hoá ≥ 3.000 tỷ, KL ≥ 500.000 cp, GTGD > 10 tỷ/phiên), mốc chuyển mua, định dạng số.
- `lib/soCoPhieuLuuHanh.js` — số cổ phiếu lưu hành (tính vốn hoá). Sinh lại bằng
  `node scripts/capNhatSoCoPhieu.mjs`.
- `amibroker/` — các file AFL (7 = xuất CSV, 8 = bắt đáy, 9 = xem chart + backtest).
- `day_tat_ca_len_web.py`, `DAY_LEN_WEB.bat` — đẩy cả hai CSV lên web bằng một lần bấm.

## Lưu ý phiên bản Next

Đây là Next 16 (có breaking changes so với bản cũ): ví dụ `error.js` nhận prop `retry` thay cho `reset`. Xem
`node_modules/next/dist/docs/` trước khi viết code theo thói quen của bản cũ.
