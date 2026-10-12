# Ghi chú dựng — Lột trần nghề môi giới: "Môi giới trả lời được mọi câu, trừ câu mã nào mai sẽ lên"

Video Hiếu quay (Drive, 138 s) → bản dựng 1:46 (105,8 s), 1080×1920, 30 fps, 17 thẻ đồ hoạ, giọng chuẩn hoá −19 LUFS trước khi gắn SFX, bản xem trước −14 LUFS.
Dựng bằng `videos/tools/th_*` (xem mục 17 của skill `hieu-talking-head-style`): `plan.json` → `th_cut.py` → `th_align.py` → `build.py` → render.

## Hiếu bỏ / đổi so với kịch bản series (`videos/scripts/series-lot-tran-nghe-moi-gioi-tap-mai-co-len-khong.md`)
Thẻ chỉ hiện những gì anh đã nói. Khác kịch bản:
- **Bỏ** câu "hai kiểu trả lời: cần anh chị mua theo / cần anh chị trả tiền để nghe" (câu [SUY LUẬN] của kịch bản) → không có thẻ hai nhánh.
- **Bỏ** "Phần xấu mình không giấu: vẫn có người nói chắc, vì khách thích nghe vậy" và "Ai trả lời được câu đó thì đáng để nói chuyện".
- **Bỏ** câu vòng lặp "Và đó cũng là lý do mình, người làm trong ngành, vẫn không biết mai mã nào lên" → không có thẻ vòng lặp.
- **Bỏ lời nói** câu rủi ro ("Video này giải thích, không phải khuyến nghị đầu tư. Đầu tư luôn có rủi ro mất vốn"): đã thêm bằng chữ ở 3,6 s cuối (có cả "Đầu tư luôn có rủi ro mất vốn").
- Câu hỏi "mã này mai có lên không?" ở đoạn mở nói thành **"mai mã nào sẽ lên"**; "không phải do một người" nói thành **"không có do một người"**; "bán cho anh chị cảm giác yên tâm" nói thành **"…được sự cảm giác yên tâm"**; "hãy hỏi người nói chắc một câu" nói thành **"hãy nói chắc một câu hỏi"** (mất "hỏi người", nghe hơi cụt); "khỏi bị lùa" mình ghi **"lùa"** theo kịch bản (nhận dạng nghe ra "lừa").
- Đoạn "Điều đó không có nghĩa là…" Hiếu nói "môi giới chỉ biết nói không biết" nhưng không nói câu "phần xấu".

## Số liệu hiện trên hình (kiểm 12/10/2026, ≥ 2 nguồn)
| Số liệu | Nguồn |
|---|---|
| VN-Index đóng cửa 28/9–2/10: 1.780,68 · 1.777,73 · 1.768,62 · 1.749,30 · 1.737,71; mỗi phiên giảm 4,43 · 2,95 · 9,11 · 19,32 · 11,59 = tổng 47,4 điểm (25/9 đóng cửa 1.785,11) | DNSE (`services.entrade.com.vn/chart-api/v2/ohlcs/index`) + [Finhay 2/10](https://www.finhay.com.vn/ban-tin-chung-khoan-02-10) (giảm 11,59 điểm, phiên giảm thứ năm liên tiếp, tổng hơn 47 điểm) + Tiền Phong (mất 47,4 điểm) |
| GDP quý 3/2026 +9,95% (số ước tính, họp báo Cục Thống kê 3/10) | [VietnamPlus](https://www.vietnamplus.vn/toc-do-tang-truong-gdp-chin-thang-nam-2026-uoc-dat-901-so-voi-cung-ky-post1139772.vnp), [Tạp chí Kinh tế Tài chính](https://tapchikinhtetaichinh.vn/tong-san-pham-trong-nuoc-gdp-quy-iii-2026-tang-9-95-168574.html), [Doanh nhân & Pháp luật](https://doanhnhan.baophapluat.vn/kinh-te-viet-nam-tang-toc-gdp-quy-iii-dat-muc-tang-9-95.html) (chưa đối chiếu bản gốc trên trang Cục Thống kê) |
| Công văn 3760/UBCK-QLKD ngày 7/5/2026: UBCKNN "đề nghị các công ty chứng khoán rà soát hoạt động của người hành nghề và nhân viên…"; "có trường hợp cá nhân giới thiệu nơi làm việc, chức danh hoặc quá trình công tác tại công ty chứng khoán khi thực hiện các nội dung nhận định và khuyến nghị đầu tư" | Trích nguyên văn [Dân trí 13/05/2026](https://dantri.com.vn/kinh-doanh/siet-quan-ly-nhan-vien-chung-khoan-ho-hao-mua-ban-co-phieu-tren-mang-xa-hoi-20260513074102201.htm); đối chiếu The Leader, Doanh nhân & Pháp luật, 24hmoney (chưa đọc nguyên văn công văn) |

Thứ tự thời gian đúng: 5 phiên giảm (28/9–2/10) nằm **trước** ngày công bố GDP (3/10); lời nói của Hiếu ("tuần ngay trước khi con số đó được công bố") đúng.

## Hiếu cần xem / xác nhận
1. Câu "hãy nói chắc một câu hỏi" (thiếu "hỏi người") và "bán cho anh chị được sự cảm giác yên tâm": nghe hơi vấp, muốn quay lại hai câu này không?
2. "Mình làm trong ngành chứng khoán" (không nói thực tập, không nêu công ty): đúng theo kịch bản, **công ty cần duyệt** (nhắc công văn của Ủy ban và nói thẳng "vẫn có người nói chắc").
3. Công ty duyệt chưa; chưa có câu rủi ro bằng lời (đã có chữ cuối video).
