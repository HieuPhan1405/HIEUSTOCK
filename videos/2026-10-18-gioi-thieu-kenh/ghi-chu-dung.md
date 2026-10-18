# Ghi chú dựng – Video ghim "Mình là Hiếu" (18/10/2026, ~59 giây)

Footage: Hiếu quay 85 giây (1080×1920, HEVC), tự đọc theo `videos/scripts/2026-10-18-video-ghim-1-hieu-la-ai-v3.md` nhưng có đổi lời. File gốc không commit (178 MB, ở Drive của Hiếu).

## Việc đã làm
1. **Cắt:** bỏ khoảng lặng dài giữa các câu (3–5 giây mỗi chỗ) và **bỏ lần đọc nháp** câu "Mình không nói mã nào nên mua nên bán…" (đọc lại ở lần 2, có thêm câu Follow). 85 s → 57 s + 1,8 s giữ khung cuối cho thẻ kết. (`plan.json`, `th_cut.py`.)
2. **Chỉnh màu + làm nét + làm đẹp da (nhẹ)** bằng `videos/tools/th_enhance.py`: cân trắng nhẹ (tường hơi ngả vàng), đường cong tương phản, bão hòa +8%, làm nét (ít hơn trên da), vignette nhẹ; da: làm mượt giữ 35% chi tiết, giảm bóng dầu vùng T, hơi ấm da, nâng nhẹ vùng tối quanh mắt. Không biến dạng khuôn mặt. Dò mặt bằng Haar, xử lý 3 tiến trình song song.
3. **Giọng:** chuẩn hóa −19 LUFS (nguồn −24,8 LUFS, quá nhỏ) rồi loudnorm −14 LUFS khi xuất bản đăng.
4. **Thẻ đồ họa + caption** theo `/hieu-talking-head-style` (`build.py`, `th_lib.py`): hook "KHÔNG BIẾT NHÌN VÀO ĐÂU TRƯỚC?", thẻ tên "HIẾU" + "TƯ VẤN ĐẦU TƯ · ĐỌC SỐ LIỆU · TRÒ CHUYỆN VỚI NHÀ ĐẦU TƯ CÁ NHÂN", "KHÔNG THIẾU THÔNG TIN / THIẾU MỘT CÁCH NHÌN GỌN", cảnh web CloudStock (logo + tiêu đề trang Thị trường), ví dụ 16/10 (VN-Index +0,45%; 26% mã xu hướng tăng, ảnh `public/img/ketluan.png`), "QUYẾT ĐỊNH LÀ CỦA BẠN", FOLLOW `@phanhieustock`, thẻ kết thanh tìm kiếm TikTok + miễn trừ bằng chữ.

## Lời Hiếu nói khác kịch bản (đã dựng đúng theo lời nói)
| Kịch bản v3 | Hiếu nói |
|---|---|
| "tốt nghiệp ngành Tài chính – Ngân hàng, và hằng ngày làm việc trong ngành chứng khoán, ở mảng tư vấn đầu tư" | "Mình có vai trò tư vấn đầu tư ở **công ty chứng khoán MBS**" (bỏ câu Tài chính – Ngân hàng, nêu tên công ty) |
| "xây kênh Phan Hiếu Stock … " | "xây một kênh TikTok để kể lại số liệu…" |
| "Follow Phan Hiếu Stock nhé" | "Follow kênh TikTok để có thể xem những clip và buổi livestream mới nhất nhé" |
| Rủi ro + miễn trừ đọc 3,6 s cuối | **Không đọc**; thể hiện bằng chữ ở thẻ kết |

## Cần Hiếu/công ty quyết định trước khi đăng
1. **Tên công ty MBS nói trên video.** Công văn 3760/UBCK-QLKD (theo bản đã tóm tắt trong `videos/posts/README.md`): không dùng tên công ty/chức danh làm bằng cấp; thực tập sinh không tự gọi là người hành nghề. Công ty phải duyệt câu "Mình có vai trò tư vấn đầu tư ở công ty chứng khoán MBS". Nếu không được nói tên: có thể cắt cụm "ở công ty chứng khoán MBS" (khoảng 1,9 s; cắt ở "tư … công" không liền hơi hoàn toàn, nên quay lại câu này cho mượt).
2. **Miễn trừ không đọc thành tiếng.** Hiện bằng chữ ở thẻ kết 3,2 s cuối (đã có câu "Ý kiến cá nhân, không đại diện công ty"). Nếu công ty yêu cầu đọc, quay thêm câu: "Nội dung tổng hợp thông tin, không phải khuyến nghị đầu tư. Đầu tư luôn có rủi ro mất vốn."
3. **"Buổi livestream mới nhất":** chỉ nên giữ nếu buổi livestream không đưa mã mua/bán (đúng tinh thần không "phím hàng").
4. **Số liệu:** VN-Index 16/10 +0,45% đã xác minh 4 nguồn; "một phần tư mã xu hướng tăng" là số của hệ thống CloudStock lúc 15:30 16/10 (một nguồn). Quay lại sau phiên mới thì thay.
5. **Ảnh quảng cáo CloudStock Hiếu gửi (4 ảnh):** KHÔNG dùng trong video này vì ảnh 2 và 4 có "Mua 77,4 – 79,18, cắt lỗ 75…", "vùng mua", "chốt lời TP1/TP2", ảnh 3 ghi "Tín hiệu MUA / BÁN", ảnh 1 có nút "Đăng ký dùng thử" (sẽ thành lời kêu gọi thứ hai). Đó là phần Công văn 3760 coi là "phím hàng".
