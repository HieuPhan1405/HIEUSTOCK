# Ảnh web CloudStock để dựng video giới thiệu (chụp 18/10/2026, dữ liệu 15:30 16/10/2026)

Chụp bằng `node videos/tools/capture_intro.mjs <thư mục>` (viewport 430 px, scale 2.5, tức rộng 1075 px). Không có tín hiệu MUA/BÁN, Mắt Thần, chốt lời, vùng mua/cắt lỗ, số điện thoại, Zalo, mục ủng hộ.

| File | Nội dung | Dùng cho đoạn |
|---|---|---|
| `header_logo.png` | Thanh trên có logo CloudStock, ô tìm mã, tab Thị trường | Mở cảnh web, badge logo |
| `hero_title.png` | "Tổng quan thị trường, đọc trong 5 giây." | Đoạn lợi ích (0:18–0:32 ở bản 2; 0:34–0:47 ở bản 3) |
| `tiles.png` | 390 mã đang theo dõi; xu hướng tăng 26% (101 mã) | Đoạn ví dụ (số ~26%) |
| `ketluan.png` | Kết luận thị trường: Xanh 101 · Sideway 32 · Đỏ 257 | Đoạn ví dụ |
| `dorong.png` | Độ rộng theo vốn hóa: VN30 9/30; Midcap 19/90; Smallcap 73/270 | Đoạn ví dụ |
| `ketluan_dorong.png` | Hai khối trên ghép một ảnh | Đoạn ví dụ (một cảnh) |
| `ptkt.png` | VN-Index 1.705,91 (+0,45%) và chỉ báo | Chỉ lấy dòng +0,45% (cắt ảnh); các số đường cân bằng/vùng cân bằng đừng đọc lên |
| `nhandinh.png` | Nhận định nhanh "GIẰNG CO" (30,3% giảm / 47,4% tăng) | **Không dùng cùng `ketluan.png`**: hai khối đo khác nhau (tăng/giảm điểm trong phiên và xu hướng), người xem dễ thấy mâu thuẫn |
| `capnhat.png` | "Dữ liệu cập nhật lúc 15:30 16/10/2026" | Chú thích nguồn dưới ảnh |

**Lưu ý khi dựng:** logo CloudStock hiện trên mọi cảnh lấy từ web (thêm badge logo + cloudstock.id.vn nếu cảnh chỉ có khối số). Nếu quay sau phiên mới, chạy lại script để lấy số mới, đổi lời "thứ Sáu" và các số trong kịch bản. Ảnh `hero_title.png` đã cắt bỏ dòng mô tả có chữ "backtest 11 năm" (trang Giới thiệu ghi 12 năm: chưa thống nhất).
