# Tuân thủ và kiểm chứng – bản đầy đủ cho kịch bản

Gốc: `videos/posts/README.md` mục 1–2. Các nội dung dưới đây là **bản nháp để công ty duyệt**; skill không thay thế bộ phận tuân thủ.

## A. Công văn 3760/UBCK-QLKD (7/5/2026)
- Không "phím hàng": không mua/bán, điểm vào / cắt lỗ / chốt lời, giá mục tiêu của chính mình.
- Không dùng khuyến nghị MUA/BÁN hay giá mục tiêu của công ty chứng khoán khác.
- Không "rẻ/đắt"; không dự đoán giá hay "mai tăng/giảm"; không hứa lợi nhuận; không FOMO/áp lực.
- Không tự xưng "chuyên gia"; không mời vào nhóm/phòng trả phí; không dùng tên công ty hay chức danh làm bằng cấp.
- Thực tập sinh không tự gọi là "người hành nghề/môi giới"; trạng thái chứng chỉ là **[HIẾU ĐIỀN]**.
- Nhận định/dự báo bên thứ ba: nêu **tên nguồn** + "có thể sai".
- Không lặp tin đồn chưa kiểm chứng (ngân hàng/doanh nghiệp).
- Mỗi nội dung: có rủi ro + miễn trừ; **một** CTA.
- Điều luật: chỉ dẫn số điều khi đã xác minh; Luật Chứng khoán 54/2019/QH14 đã ghi trong bản đồ 11/10 (Điều 3 khoản 29–30, Điều 12, Điều 89, Điều 97–98, xem `series-be-lai-…md`). Chưa chắc → [CẦN XÁC MINH], không đưa số điều.

## B. Dữ liệu
- DNSE: `get_workflow_guide(market_analysis|stock_analysis)` **trước**; tiếp `market_get_overview`, `market_get_stock_influences`, `sector_get_overview`, `price_get_history` (nghìn đồng, đã điều chỉnh; +7 giờ ra ngày VN; thường trễ ~1 phiên), `financial_get_business_result` (code BUSINESS_RESULT), `company_get_company_events`, `company_get_profile_with_news` (kết quả lớn → lưu file rồi đọc bằng python).
- Entrade (giá ngày): `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=<unix>&to=<unix>&symbol=<MÃ>&resolution=1D` (thời gian VN = UTC+7).
- Firecrawl: `firecrawl_search` rồi `firecrawl_scrape` với `formats:["query"]` + `queryOptions.prompt` (chỉ scrape trang cần). Tool mất kết nối → tải lại schema bằng ToolSearch `select:`.
- Công cụ không gọi được → dừng và báo "thiếu công cụ"; không dùng trí nhớ thay số liệu.
- Số cốt lõi cần ≥2 nguồn độc lập; không kiểm được → đổi đề tài. Không có đề tài đủ nguồn → không viết cho có, báo lý do.
- Số lệch (ví dụ VN-Index tuần −1,68% vs −1,58%) → [LỆCH NGUỒN], chỉ nêu số điểm hoặc bỏ.
- Không giải thích nguyên nhân giá khi chưa có nguồn.

## C. Quay/hiển thị web CloudStock (cloudstock.id.vn)
- Chỉ trang **Thị trường** ("Tổng quan thị trường, đọc trong 5 giây", Xanh/Sideway/Đỏ, độ rộng theo vốn hóa, dòng "Không phải khuyến nghị đầu tư").
- Chụp bằng `node videos/tools/capture_cloudstock.mjs` (tắt "Vùng lệnh", khung 3T, bỏ nhãn MUA/BÁN). **Không** hiện tín hiệu MUA/BÁN, "Mắt Thần", vùng mua/cắt lỗ.
- Logo CloudStock (badge + cloudstock.id.vn) hiện trên mọi cảnh lấy từ web.
- **Không nói trong video**: số mã quét, "backtest 11 năm", nhóm Zalo, tín hiệu thành viên. Web có các mục này → nhắc Hiếu hỏi công ty về cách trình bày trên web.
- Số lấy từ CloudStock gắn nhãn [1 NGUỒN, SỐ CỦA HỆ THỐNG]; Hiếu mở lại web trước khi quay. Ví dụ phiên 16/10: VN-Index +0,45%; 101 mã xanh / 32 sideway / 257 đỏ trên 390; VN30 9/30 xanh.

## D. Lưu ý riêng cho video ghim/giới thiệu
- Chỉ "Mình là Hiếu"; không chức danh, không tên công ty; không nói đang thực tập/đang học.
- CTA duy nhất: "Follow Phan Hiếu Stock nhé"; end card thanh tìm kiếm + `@phanhieustock` (Hiếu xác nhận handle).
- Không nêu số người theo dõi, không hứa lợi nhuận.

## E. Cờ cần ghi ở mục 8 của mỗi kịch bản
Công ty duyệt (nêu rõ phần nào: mã cụ thể, margin, CloudStock, tên doanh nghiệp); số cần mở lại; phần [HIẾU ĐIỀN]; hook mặc định.
