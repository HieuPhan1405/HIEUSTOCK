# Quy trình nội dung hằng ngày của kênh "Phan Hiếu Stock"

Hai lịch chạy tự động (giờ Việt Nam), đều ra **bản nháp** cho Hiếu duyệt, **không tự đăng ở đâu cả**, công ty phải duyệt trước khi đăng:
- **A. 07:00 mỗi ngày: 8 bài Facebook** (5 bài nền + 3 bài mã cụ thể; nội dung + ảnh cho từng bài).
- **B. 17:00 mỗi ngày: 2 kịch bản quay video** (talking head 2–3 phút).

Hai lịch chạy ngay trong phiên Claude Code của Hiếu (đã có sẵn DNSE và Firecrawl). Nếu không gọi được DNSE hoặc Firecrawl thì **dừng và báo "thiếu công cụ"**, không bịa số liệu, không viết từ trí nhớ.

## 0. Chuẩn bị (cả A và B)
1. Nhánh làm việc: `claude/exciting-bardeen-toacbf` (đang đứng sẵn trong phiên; nếu không, `git fetch origin claude/exciting-bardeen-toacbf && git checkout claude/exciting-bardeen-toacbf && git pull`). Commit rồi push về đúng nhánh này, **không tạo PR**. Trailer commit: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` và `Claude-Session: https://claude.ai/code/session_014GxSeC1NwqDQnvs7PVNM85`.
2. Ngày hôm nay (giờ VN): `TZ=Asia/Ho_Chi_Minh date`. Thứ 2–6: có phiên giao dịch (trừ lễ; kiểm bằng dữ liệu phiên DNSE). Thứ 7, Chủ nhật, ngày lễ: **không có phiên mới**, làm theo mục "Ngày nghỉ" của A và B.
3. Văn phong: đọc `.claude/skills/hieu-talking-head-style/SKILL.md` mục 15–16 (viết lời nói tự nhiên, "một luận điểm – một phép tính"). Xưng "mình" và "anh chị", câu ngắn, có tình huống người đọc gặp, không "văn máy", không "Mình sẽ nói thẳng…".
4. Xem `videos/posts/` và `videos/scripts/`: **không lặp mã** đã làm trong 7 ngày gần nhất; không lặp luận điểm đã làm.
5. Đọc `videos/posts/dem-tap.md` (bộ đếm chuyên mục: TỔNG KẾT TUẦN, KIẾN THỨC 60 GIÂY #n, LỘT TRẦN NGHỀ MÔI GIỚI #n) và mục "Học từ nền tảng" bên dưới. Chạy xong nhớ cập nhật bộ đếm trong cùng commit.

## 1. Quy định bắt buộc (Công văn 3760/UBCK-QLKD, 7/5/2026): vi phạm là bỏ bài
- Không "phím hàng": không mua/bán, điểm vào/cắt lỗ/chốt lời, giá mục tiêu của chính mình; **không dùng khuyến nghị MUA/BÁN hay giá mục tiêu của công ty chứng khoán khác**; không nói "rẻ/đắt"; không dự đoán giá hay "mai tăng/giảm".
- Không hứa lợi nhuận, không tự xưng "chuyên gia", không mời vào nhóm/phòng trả phí, không gây FOMO hay áp lực.
- Dự báo/nhận định bên thứ ba chỉ nêu khi có **tên nguồn** và có câu "có thể sai".
- Không lặp lại tin đồn chưa kiểm chứng về ngân hàng/doanh nghiệp.
- Có phần rủi ro + miễn trừ; chỉ **một** CTA (thường là "Lưu bài/video để đối chiếu khi …"). Ghi "công ty duyệt trước khi đăng".
- Nhắc đến pháp luật chỉ khi đã kiểm điều khoản; điều khoản chưa chắc thì ghi [CẦN XÁC MINH] và không đưa số điều vào bài.

## 2. Nghiên cứu và kiểm chứng (dùng chung)
- DNSE: gọi `get_workflow_guide(market_analysis)` hoặc `get_workflow_guide(stock_analysis)` **trước tiên**; rồi `market_get_overview`, `market_get_stock_influences`, `sector_get_overview`, `price_get_history` (giá nghìn đồng, chuỗi đã điều chỉnh thưởng cổ phiếu/cổ tức; đổi mốc thời gian +7 giờ để ra ngày VN), `financial_get_business_result`, `company_get_company_events`, `company_get_profile_with_news`. Kết quả `company_get_profile_with_news` rất lớn: lưu ra file rồi đọc bằng python, không dán cả vào hội thoại.
- Firecrawl: `firecrawl_search` rồi `firecrawl_scrape` với `formats:["query"]` và `queryOptions.prompt` để lấy câu trả lời gọn (~5 credit/trang; chỉ scrape trang cần).
- Mọi con số gắn nhãn: [ĐÃ XÁC MINH] ≥2 nguồn · [1 NGUỒN] · [TỰ TÍNH] (ghi công thức) · [SUY LUẬN] · [LỆCH NGUỒN] (nêu cả hai số) · [CẦN XÁC MINH]. **Số lệch nguồn thì không đưa vào bài/kịch bản.**
- Không giải thích "vì sao giá giảm/tăng" bằng lý do không có nguồn. Nguyên nhân chỉ nêu khi gắn tên báo/công bố, kèm "đây là nhận định của …, chưa ai đo được từng yếu tố".
- Đề tài tốt = có **nghịch lý hoặc hai mặt** người xem dễ hỏi "sao lại thế" (lãi tăng mà giá giảm, tin tốt mà giá giảm, hai tổ chức dự báo khác nhau, con số dễ đọc nhầm) và kiểm được bằng ≥2 nguồn độc lập. Không kiểm được số cốt lõi thì đổi đề tài; không có đề tài đủ nguồn thì **không viết cho có**, ghi rõ lý do trong tin nhắn cuối.

---

## A. 07:00: 8 bài Facebook (5 bài nền + 3 bài mã cụ thể; nội dung + ảnh)

Thư mục: `videos/posts/<YYYY-MM-DD>/` gồm `README.md` (bảng mục lục: STT, loại, tiêu đề, câu mở bài, các chỗ Hiếu phải kiểm) và các thư mục con `bai-1-<slug>/` … `bai-8-<slug>/`, mỗi thư mục có `bai.md`, `spec.json` và ảnh (`post.png` hoặc `post_1..3.png`). Mẫu ngày 12/10: `videos/posts/2026-10-12/`.

**5 bài nền (ngày có phiên; dữ liệu là phiên gần nhất):**
1. **Tổng kết phiên hôm qua** (ảnh đơn): VN-Index đóng cửa và % thay đổi, thanh khoản, nhóm ngành mạnh/yếu, khối ngoại mua/bán ròng; thêm "lịch sự kiện cần theo dõi hôm nay" nếu có (ngày không hưởng quyền, đại hội, công bố kết quả kinh doanh). **Chỉ ghi số đã xảy ra, không dự đoán phiên tới.**
2. **Dòng tiền / khối ngoại / tự doanh** (ảnh đơn): một nghịch lý ở cấp thị trường có ≥2 nguồn (ví dụ "ngoại bán ròng lớn nhưng phần lớn là một lô thỏa thuận").
3. **Ngành** (ảnh đơn): cả ngành đi một hướng nhưng từng mã đi nhiều hướng, hoặc ngược lại.
4. **Kiến thức đầu tư gắn với một tin thật** trong tuần (ảnh đơn dạng "kiến thức 60 giây": 3 ý + ví dụ số + một ví dụ thật có nguồn).
5. **"Lột trần nghề môi giới"** (ảnh đơn): luân phiên giữa một luận điểm của series (xem `videos/scripts/series-*.md`) và một câu hỏi người mới hay gặp (phí giao dịch, margin, nhóm đóng phí, tin nội bộ…). Dùng định nghĩa của Hiếu: "Lùa gà là lùa những người thiếu kiến thức làm người ta thua tiền."
   Ba dạng luân phiên (xem `HOC-TU-NEN-TANG.md`): (a) luận điểm của series; (b) **"Nếu là bạn thì sao?"**: một tình huống người xem thật sự gặp (nhận tin nhắn "mã này sắp tăng", bị mời vào nhóm…) rồi đi từng bước cái gì kiểm được; (c) **trả lời câu hỏi thật** do Hiếu gửi (ẩn danh); không có câu hỏi thì không làm dạng này. Bài 4 có thể thay bằng "sai lầm phổ biến" gắn một tin thật của tuần.

**3 bài mã cụ thể (bài 6–8; ảnh đơn `type:"card"` hoặc carousel 3 ảnh nếu đủ chất):**
- Mỗi bài một mã (hoặc một cặp mã cùng câu chuyện), **ưu tiên có nghịch lý/hai mặt kiểm được ≥2 nguồn**: giá ngược với tin, giá ngược với dòng tiền ngoại, hai mã cùng hệ đi hai hướng, tin công bố đặt cạnh diễn biến giá, ngày không hưởng quyền gây hiểu nhầm giá.
- Chọn mã từ: top giá trị/khối lượng giao dịch, tăng/giảm mạnh nhất VN30 và mã vốn hóa lớn, top mua/bán ròng khối ngoại và tự doanh, mã có tin công bố trong tuần (đăng ký mua/bán, cổ tức, kết quả kinh doanh, thay đổi sở hữu).
- Khác mã với bài nền cùng ngày và **không lặp mã trong 7 ngày** (tính cả video/kịch bản). Ba mã nên thuộc ba ngành khác nhau.
- **Khung 3 điều:** (1) giá/diễn biến so với chỉ số hoặc mã cùng nhóm, (2) tin hoặc dòng tiền (nêu tên nguồn), (3) chỗ dễ đọc nhầm hoặc điều chưa kiểm chứng được. Kết: "mình không dự đoán giá" + một CTA.
- Ảnh: dùng khối `stats` (3 ô số), `lines` (giá thật, hoặc nhiều mã quy về 100), `list`, `hbars`, `note`. Mẫu: `videos/posts/2026-10-12/bai-6-pnj`, `bai-7-vic-vhm`, `bai-8-mch` (card) và `videos/posts/2026-10-11-fpt` (carousel 3 ảnh).
- **Mã đang có biến cố** (điều tra, kiện tụng, bê bối, lo ngại chất lượng sản phẩm, tin đồn): chỉ nêu giá và thông tin do **doanh nghiệp hoặc cơ quan chức năng công bố**, có tên nguồn; không suy đoán nguyên nhân hay trách nhiệm; không dùng số liệu từ bài đăng mạng xã hội; ghi "công ty duyệt kỹ" ở đầu `bai.md`.
- Giao dịch của người nội bộ/bên liên quan: chỉ nêu đúng như công bố; không viết "bên mua là…" nếu chưa có xác nhận.

**Ngày nghỉ (thứ 7, Chủ nhật, lễ):** bài 1 = tổng kết tuần + lịch sự kiện tuần tới; bài 6–8 = ba mã nổi bật của tuần; bài 2–3 = dòng tiền/ngành của tuần; 4 = kiến thức; 5 = series. Ngày lễ giữa tuần: bài 1 ghi "thị trường nghỉ" và nêu lịch mở cửa lại.

**Mỗi `bai.md`:** (1) nội dung đăng (copy nguyên khối), (2) alt text ảnh, (3) kiểm chứng (số nào, nguồn nào, nhãn gì, chỗ Hiếu phải kiểm), (4) trước khi đăng. Mẫu: `videos/posts/2026-10-11-fpt/bai-facebook.md`.
**Bài đăng (mục 1 trong `bai.md`) viết như một bài phân tích ngắn, 400–550 chữ** (mẫu: `videos/posts/2026-10-12/bai-2-khoi-ngoai-mch/bai.md`):
- Câu mở bài: nghịch lý hoặc câu hỏi + một con số, 1–2 câu.
- Thân bài: 3–5 mục có biểu tượng 📌 và tiêu đề ngắn (Điều 1/2/3 hoặc "Bối cảnh", "Phép tính cho thấy điều gì", "Cách đọc số này"), mỗi mục một đoạn 3–5 câu **giải thích số liệu nghĩa là gì và đọc thế nào**, không chỉ liệt kê số. Mỗi con số quan trọng ghi tên nguồn trong ngoặc; phép tính của mình ghi rõ "phép tính của mình" và chỉ rõ chỗ xấp xỉ.
- Một mục **"Điều mình chưa biết"** (hoặc "chưa kiểm chứng được"): nêu số lệch nguồn, chỗ chưa có xác nhận, không đoán nguyên nhân.
- Một mục **"Nên theo dõi"** nếu có sự kiện/số liệu sắp công bố (không phải dự đoán giá).
- Kết: "mình không dự đoán giá / không nói mã nào nên mua hay bán" + **một** CTA ("Lưu bài để…") + dòng rủi ro, miễn trừ, "số liệu đến hết phiên dd/mm/yyyy" + nguồn + 5–6 hashtag có #PhanHieuStock.
- Văn nói tự nhiên, xưng "mình" và "bạn"; câu ngắn; mỗi đoạn một ý; không "văn máy".
- Ngoài bản dài, thêm **mục "1b. Bản rút gọn" (~100–150 chữ)** để đăng nhanh khi cần.

**Học từ nền tảng (rút từ `HOC-TU-NEN-TANG.md`, áp cho mọi bài):**
- **Ảnh tự đứng được:** người lướt không mở lời đăng vẫn hiểu nghịch lý. Tiêu đề ảnh = nghịch lý + đúng một con số, không dùng cả đoạn chữ.
- **Hook nằm ở hai dòng đầu của lời đăng** (Facebook cắt chữ ở đó): nghịch lý hoặc câu hỏi + một con số. Cấm mở bằng "Hôm nay mình…", "Chào mọi người…", "Mình xin chia sẻ…".
- **Chuyên mục đánh số** theo `dem-tap.md`: nhãn ngắn đặt đầu tiêu đề ảnh và dòng đầu ("KIẾN THỨC 60 GIÂY #2 | …"); bài tổng kết tuần ghi "TỔNG KẾT TUẦN <số tuần ISO>".
- **Tiêu đề là một căng thẳng giữa hai thứ** hoặc một sự kiện đo được ("VIC và VHM: cùng hệ, hai hướng"), không phải lời đoán.
- **Câu người xem đang hỏi** ("đã có đáy chưa", "mai lên không", "tin tốt sao giá vẫn giảm") là đề tài tốt, nhưng trả lời bằng "đo được gì, không đo được gì", **không bằng dự đoán**.
- **Không bắt chước:** tiêu đề đoán đáy/đỉnh, "top cổ phiếu sắp nổ", khuyến mại mở tài khoản, IN HOA hàng loạt, từ cam kết lợi nhuận, và **"bình luận TÔI để được tư vấn"** (chỉ dùng khi công ty duyệt riêng cho từng bài). Không chép lời của trang khác.
- **A/B bản dài và rút gọn** (13–24/10, bảng ghi ở cuối `HOC-TU-NEN-TANG.md`): tuần 1 đăng mục 1, tuần 2 đăng mục 1b; Hiếu ghi lại số lưu/chia sẻ/bình luận trên reach. Trong lúc đó vẫn viết đủ cả hai bản như hiện nay.

**Dựng ảnh:** `python3 videos/covers/make_post.py <thư mục>/spec.json` (dùng Chromium có sẵn, không cần cài thêm). Mẫu thông số:
- carousel 3 ảnh (mặc định): `videos/posts/2026-10-11-fpt/spec.json` (slide1 tiêu đề + biểu đồ đường quy về 100, slide2 các thẻ lớn + ghi chú, slide3 hai ô số + giải thích + biểu đồ cột). Mã chính màu `gold`, đường tham chiếu `blue`.
- ảnh đơn `"type":"card"` với các khối `stats` / `list` / `table` / `claim` / `bars` / `note`: mẫu trong `videos/posts/_mau/` (`tong-ket-tuan`, `kien-thuc`, `lot-tran-moi-gioi`). Giảm dùng `red` + ▼ + dấu −; tăng dùng `green` + ▲ + dấu +. Tùy chọn: khối `stats` nhận thêm `size` (cỡ chữ số, mặc định 88 cho 2 ô, 50 cho 3 ô; số dài như "100.687,5" dùng 66); khối `bars` nhận thêm `decimals` (số chữ số thập phân của nhãn cột, mặc định 1; thị phần dùng 2).
- Lệnh in "cách chân trang: Npx" cho từng ảnh; **N < 10 hoặc có cảnh báo ⚠ là chữ đang đè chân trang**: rút ngắn chữ rồi chạy lại. Sau khi chạy vẫn **mở xem từng ảnh** (Read): chữ không tràn/đè, số khớp bài, dòng nguồn + miễn trừ còn đọc được. Tràn thì rút ngắn chữ trong spec rồi chạy lại (không sửa `make_post.py` nếu không cần).

**Giao:** `git add videos/posts/<ngày>`; commit "Bài Facebook <ngày>: 8 bài (<mã/chủ đề>)"; `git push -u origin claude/exciting-bardeen-toacbf` (lỗi mạng thì thử lại tối đa 4 lần, chờ 2s/4s/8s/16s). Tin nhắn cuối (tiếng Việt, gọn): bảng 8 bài (loại, câu mở bài), **các chỗ phải kiểm trước khi đăng**, đường dẫn. **Lời đăng phải tới tay Hiếu cùng ảnh:** chạy `python3 videos/posts/combine_captions.py videos/posts/<ngày>` (tạo `noi-dung-dang.md` gom lời đăng của mọi bài) rồi gửi file đó **và** ảnh chính của mỗi bài bằng SendUserFile; trong tin nhắn cuối dán luôn lời đăng của 1–2 bài đầu để Hiếu thấy ngay chữ.

---

## B. 17:00: 2 kịch bản quay video

Hai file `videos/scripts/<YYYY-MM-DD>-<slug>.md`. Dùng kỹ năng `talking-head-chung-khoan` nếu có; khung bắt buộc như `videos/scripts/2026-10-11-hpg-du-bao-lai-q3.md` và `videos/scripts/2026-10-11-fpt-lai-deu-nhung-giam-11-phien.md`:
1) 3 tiêu đề/caption mở đầu; 2) 3 phương án hook (câu nói + chữ màn hình); 3) kịch bản có mốc thời gian và cue (giọng / [CHỮ] / [B-ROLL] / [CẮT] / [DỪNG] / [SFX]), 2–3 phút (~450–600 tiếng nói), khung "3 điều, điều 3 là chỗ cần để ý", twist ở ý 3, đóng vòng lặp ở cuối, đúng **một** CTA, câu rủi ro + disclaimer ở 3,6 giây cuối, bản rút ~90 giây; 4) danh sách B-roll; 5) caption + hashtag; 6) bảng kiểm chứng (số, giá trị, nguồn, nhãn) + số/ý để dành không đưa vào lời; 7) nguồn có liên kết (tin chỉ có mã DNSE thì ghi chữ thường, không dựng liên kết giả); 8) "Hiếu cần chọn/xác nhận".
- **Kịch bản 1:** mã/ngành/sự kiện nổi bật của phiên (ngày nghỉ: nổi bật của tuần). Ưu tiên khác mã với bài 2–3 buổi sáng, nếu trùng phải khác góc.
- **Kịch bản 2:** luân phiên giữa (a) tập tiếp theo của series "Lột trần nghề môi giới" (đọc `videos/scripts/series-be-lai-nhan-dinh-ve-nghe-moi-gioi.md` để lấy tập chưa làm: phí tính theo giao dịch, tiền không nằm trong túi môi giới, margin, tin nội bộ, nhóm đóng phí, học lại hàng năm, một ngày làm môi giới; kiểm điều luật trước khi nêu) và (b) một chủ đề vĩ mô/kiến thức gắn tin thật trong tuần. Tập series phải theo mẫu "một luận điểm, một phép tính hoặc tình huống", ≤5 con số nói ra, có "gây sốc" ngay câu đầu.
- Mọi lời nói đã đọc lại như người xem ("người xem có muốn xem tiếp không?"), không "văn máy".
- Giao: commit "Kịch bản <ngày>: <2 chủ đề>" và push như trên; tin nhắn cuối: 2 hook A, 3 ý mỗi kịch bản, chỗ Hiếu phải kiểm, đường dẫn; gửi 2 file bằng SendUserFile.
