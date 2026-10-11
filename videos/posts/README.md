# Quy trình bài Facebook hằng ngày (chạy tự động lúc 17:15 các ngày thứ 2–6, giờ Việt Nam)

Mục tiêu: mỗi ngày giao cho Hiếu **một bản nháp** bài Facebook (nội dung + carousel 3 ảnh) về một mã/sự kiện của phiên hôm đó. **Chỉ là bản nháp**: không tự đăng ở đâu cả, công ty phải duyệt trước khi đăng. Mẫu chuẩn: `videos/posts/2026-10-11-fpt/` (bai-facebook.md, spec.json, post_1–3.png).

## 0. Chuẩn bị
1. Làm việc trên nhánh `claude/exciting-bardeen-toacbf`: `git fetch origin claude/exciting-bardeen-toacbf && git checkout claude/exciting-bardeen-toacbf && git pull origin claude/exciting-bardeen-toacbf`. Commit và push về đúng nhánh này, **không tạo PR**. Trailer commit: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` và `Claude-Session: <đường dẫn phiên hiện tại>` nếu có.
2. Đọc `.claude/skills/hieu-talking-head-style/SKILL.md` mục 15–16 (viết lời nói tự nhiên, "một luận điểm – một phép tính"), và `videos/posts/2026-10-11-fpt/bai-facebook.md` + `spec.json` làm mẫu.
3. Ngày hôm nay (giờ VN): `TZ=Asia/Ho_Chi_Minh date`. Nếu hôm nay không có phiên giao dịch (lễ, thị trường nghỉ — kiểm bằng dữ liệu phiên của DNSE), **dừng**, không tạo file, báo ngắn "hôm nay nghỉ".

## 1. Chọn đề tài (một đề tài/ngày)
- DNSE: gọi `get_workflow_guide(market_analysis)` **trước tiên**, rồi `market_get_overview`, `market_get_stock_influences`, `sector_get_overview` để thấy phiên hôm nay. Lập danh sách vài mã/sự kiện nổi bật (ưu tiên VN30, mã biến động mạnh hoặc có tin lớn trong ngày).
- Xem `videos/posts/` và `videos/scripts/`: **không lặp mã** đã làm trong 7 ngày gần nhất.
- Ưu tiên đề tài có **nghịch lý hoặc hai mặt** người xem dễ hỏi "sao lại thế" (ví dụ lãi tăng mà giá giảm, tin tốt mà giá giảm, hai tổ chức dự báo khác nhau, con số dễ đọc nhầm), và có thể kiểm bằng **≥2 nguồn độc lập** (DNSE + ít nhất một bài báo/công bố qua Firecrawl).
- Nếu hôm đó thị trường chung có biến động đặc biệt (VN-Index đổi ≥2% trong phiên, tin vĩ mô lớn), được phép làm bài tổng kết thị trường với cùng 3 loại ảnh.
- Không kiểm chứng được số cốt lõi → đổi đề tài; nếu không có đề tài nào đủ nguồn thì **không viết bài**, báo "hôm nay không đủ nguồn" và nêu lý do.

## 2. Nghiên cứu và kiểm chứng
- DNSE: `price_get_history` (giá trả về nghìn đồng, chuỗi đã điều chỉnh cổ tức cổ phiếu; đổi mốc thời gian +7 giờ để ra ngày VN), `financial_get_business_result`, `company_get_company_events`, `company_get_profile_with_news`. Kết quả `company_get_profile_with_news` rất lớn: lưu ra file rồi đọc bằng python, không dán cả vào hội thoại.
- Firecrawl: `firecrawl_search` rồi `firecrawl_scrape` với `formats:["query"]` và `queryOptions.prompt` để lấy câu trả lời gọn (tốn ~5 credit/trang, chỉ scrape trang cần).
- Mọi con số gắn nhãn: [ĐÃ XÁC MINH] ≥2 nguồn · [1 NGUỒN] · [TỰ TÍNH] (ghi công thức) · [SUY LUẬN] · [LỆCH NGUỒN] (nêu cả hai số) · [CẦN XÁC MINH]. Chỗ nào lệch nguồn thì **không** đưa số đó vào bài.
- Không giải thích "vì sao giá giảm/tăng" bằng lý do không có nguồn. Nguyên nhân chỉ nêu khi gắn tên báo/công bố, kèm "đây là nhận định của …, chưa ai đo được".

## 3. Viết `bai-facebook.md` trong `videos/posts/<YYYY-MM-DD>-<mã>/`
Cấu trúc như mẫu FPT: (1) nội dung đăng (copy nguyên khối), (2) alt text 3 ảnh, (3) kiểm chứng (số nào, nguồn nào, nhãn gì, chỗ cần Hiếu kiểm), (4) trước khi đăng.
Bài: dòng đầu là nghịch lý + một con số; "3 điều" (điều 3 là chỗ cần để ý/twist); câu "mình không dự đoán giá"; **một** CTA ("Lưu bài để đối chiếu khi …"); dòng rủi ro + miễn trừ + "giá đến hết phiên dd/mm/yyyy"; nguồn; 5–6 hashtag có #PhanHieuStock. Tối đa ~8 con số nói ra trong bài; ưu tiên một tình huống người xem gặp. Văn nói tự nhiên (không "văn máy", không "Mình sẽ nói thẳng…").

**Quy định bắt buộc (Công văn 3760/UBCK-QLKD, 7/5/2026) — vi phạm là bỏ bài:**
- Không "phím hàng": không mua/bán, điểm vào/cắt lỗ/chốt lời, giá mục tiêu của chính mình; không dùng khuyến nghị MUA/BÁN hay giá mục tiêu của công ty chứng khoán khác; không nói "rẻ/đắt", không dự đoán giá.
- Không hứa lợi nhuận, không tự xưng "chuyên gia", không mời vào nhóm/phòng trả phí, không gây FOMO/áp lực.
- Dự báo/nhận định bên thứ ba chỉ nêu khi có tên nguồn và có câu "có thể sai".
- Không lặp lại tin đồn chưa kiểm chứng về ngân hàng/doanh nghiệp.
- Có phần rủi ro + miễn trừ; chỉ **một** CTA. Bản nháp phải ghi "công ty duyệt trước khi đăng".

## 4. Dựng ảnh
1. Tạo `spec.json` (sao chép từ mẫu FPT rồi đổi nội dung): slide1 = tiêu đề + biểu đồ đường (≥2 chuỗi, tự quy về 100), slide2 = các thẻ lớn + ghi chú, slide3 = hai ô số + giải thích + biểu đồ cột. Mã chính dùng màu `gold`, đường tham chiếu `blue`. Ô số: giảm dùng `red` + ▼ + dấu −, tăng dùng `green` + ▲ + dấu +.
2. Chạy `python3 videos/covers/make_post.py videos/posts/<thư mục>/spec.json` (dùng Chromium có sẵn, không cần cài thêm).
3. **Mở xem từng ảnh** (Read): chữ không tràn/đè, biểu đồ khớp số liệu, dòng nguồn + miễn trừ còn đọc được. Lỗi tràn thì rút ngắn chữ trong spec rồi chạy lại (không sửa make_post.py nếu không cần).

## 5. Giao
- `git add videos/posts/<thư mục>`; commit "Bài Facebook <mã> <ngày>: …"; `git push -u origin claude/exciting-bardeen-toacbf` (lỗi mạng thì thử lại tối đa 4 lần, chờ 2s/4s/8s/16s).
- Tin nhắn cuối (tiếng Việt, ngắn): đề tài + hook; 3 ý; **các chỗ Hiếu phải kiểm trước khi đăng** (nhãn [SUY LUẬN]/[LỆCH NGUỒN]/[CẦN XÁC MINH]); đường dẫn file. Có thể gửi file bằng SendUserFile.
