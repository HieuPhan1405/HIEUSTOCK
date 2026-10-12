# Ghi chú dựng — HPG: "Bán 3,8 triệu tấn, tăng 54%: hơn một nửa mức tăng đến từ một loại thép"

Video Hiếu quay (Drive, 134 s) → bản dựng 1:50 (109,8 s), 1080×1920, 30 fps, 15 thẻ đồ hoạ, giọng chuẩn hoá −19 LUFS trước khi gắn SFX, bản xem trước −14 LUFS.
Kịch bản: `videos/scripts/2026-10-12-hpg-san-luong-q3-9t26.md` (Hiếu đọc gần như nguyên văn). Dựng bằng `videos/tools/th_*`.

## Lỗi trong bản quay đã xử lý
- **Hook nói "tăng 25%"** (kịch bản và số công bố là **54%**). Mô hình nhận dạng whisper large-v3 nghe ra "25" với xác suất 0,985 (cùng cụm đó ở câu sau, "tăng 54% so với cùng kỳ năm ngoái", nhận đúng 54 với xác suất 1,0). Mình **vá** bằng đúng đoạn "54%" Hiếu nói ở câu sau (điểm cắt ở chỗ lặng −44…−54 dB; xem `plan.json`, đoạn có `range`). Hình hook ghi "+54%". Nếu muốn chắc tai/mắt hơn: quay lại riêng câu "Quý 3, Hòa Phát bán 3,8 triệu tấn thép, tăng 54% so với cùng kỳ" rồi thay.
- Đoạn "Quay lại câu đầu" bị nói hỏng giữa chừng (1 s) → bỏ, giữ lần nói lại.

## Hiếu bỏ khi quay (so với kịch bản)
- Câu "Giá cổ phiếu sắp tới thế nào, mình không biết, và không ai biết trước" và "Mình theo dõi ba thứ: báo cáo quý 3, giá thép cuộn cán nóng, chi phí nguyên liệu" → **không có thẻ "3 mốc theo dõi"**. Câu "không dự đoán giá" nay chỉ còn ở chữ cuối video và câu "Mình không nói hai việc liên quan".
- Vế "vì chưa có nguồn nào nói vậy" sau "Mình không nói hai việc liên quan".
- Đoạn tuỳ chọn về giá thép 560–570 USD/tấn (cần tên nguồn): không dùng, như kịch bản.
- Lời nói khác kịch bản: "nhanh hơn gấp 2 lần" (kịch bản: "nhanh gấp hơn hai lần"; thực tế 64 ÷ 26 ≈ 2,5 lần, thẻ ghi "~2,5 lần, tự tính"); "thép cuộn cán nóng" (nhận dạng nghe ra "cán mỏng", mình ghi theo kịch bản).

## Số liệu hiện trên hình (kiểm 12/10/2026)
| Số liệu | Nguồn |
|---|---|
| Quý 3/2026 bán hàng 3,8 triệu tấn (+54% so quý 3/2025); 9 tháng 10,3 triệu tấn (+39%) | [hoaphat.com.vn, 12/10](https://www.hoaphat.com.vn/tin-tuc/hoa-phat-ban-hon-10-3-trieu-tan-thep-trong-9-thang-tang-39-so-voi-cung-ky-nam-truoc.html) (đọc lại trang gốc 12/10) + CafeF + Công Luận (đã kiểm ở kịch bản) |
| HRC trên 2 triệu tấn (+64%); thép xây dựng + cuộn chất lượng cao hơn 1,3 triệu tấn (+26%); HRC xuất khẩu 24,6% | cùng bản công bố của Hòa Phát |
| HRC chiếm hơn một nửa sản lượng bán hàng; đóng góp hơn một nửa mức tăng quý 3 (vòng 53% và 59%) | **TỰ TÍNH** (2,0 ÷ 3,8; mức tăng HRC ≈ 0,78 ÷ tổng ≈ 1,33 triệu tấn; số "trên 2" và "3,8" đã làm tròn); thẻ ghi "theo phép tính của mình" |
| Quý 2/2026 công bố ngày 29/7 | Vietstock + CafeF 29/7 (đã kiểm ở kịch bản HPG 11/10) |
| HPG đóng cửa 12/10: 20,7 (+2,99%), KL 31,13 triệu cp | chụp CloudStock (có logo) + DNSE |

Không dùng số của bản tin công ty chứng khoán (tổng 4 triệu tấn +36%; 9 tháng 11 triệu tấn +30%; "Dung Quất 2 full công suất"; giá thép 560–570 USD/tấn): lệch số công bố của Hòa Phát hoặc không nêu tên nguồn (Công văn 3760).

## Hiếu cần xem / xác nhận
1. Nghe lại giây 2–4 của bản dựng (chỗ vá "54%"): có tự nhiên không, hay muốn quay lại câu hook.
2. Cân nhắc đăng cách video HPG 11/10 vài ngày; công ty duyệt (có nêu mã HPG và giá +2,99% ngày 12/10; đã có câu "không nói hai việc liên quan").
3. Giá HPG trong hình là phiên 12/10 — nếu đăng sau 13/10 thì cập nhật hoặc bỏ thẻ giá.
