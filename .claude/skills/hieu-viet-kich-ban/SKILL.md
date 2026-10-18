---
name: hieu-viet-kich-ban
description: Viết kịch bản video talking head dọc (TikTok/Reels, tiếng Việt) cho kênh "Phan Hiếu Stock" của Hiếu — theo khung 8 phần, giọng đồng cảm, đúng Công văn 3760/UBCK-QLKD, số liệu có nguồn, một CTA. Dùng khi Hiếu nhờ "viết kịch bản", "viết script video", "kịch bản tổng kết phiên/tuần", "kịch bản kiến thức 60 giây", "Lột trần nghề môi giới", "video ghim/giới thiệu kênh". Phần dựng video thì dùng /hieu-talking-head-style.
---

# Viết kịch bản video cho Hiếu (Phan Hiếu Stock)

Skill này gom: (1) báo cáo nghiên cứu TikTok chứng khoán VN
`videos/research/2026-10-18-nghien-cuu-tiktok-chung-khoan-viet-nam-2026.md`,
(2) quy định `videos/posts/README.md` mục 1–2, (3) các kịch bản đã làm trong `videos/scripts/`,
(4) góp ý của Hiếu qua các lần duyệt. **Mọi kịch bản là BẢN NHÁP, công ty duyệt trước khi quay/đăng.**
Phần quay/dựng/caption/phông chữ/vùng an toàn: dùng `/hieu-talking-head-style` (+ `/talking-head-recut`,
`/embedded-captions`, `/hyperframes-keyframes`, `/media-use`). Skill này **không lặp lại** các quy tắc dựng.

Chi tiết tra cứu: `references/khung-8-phan.md` · `references/hook-hashtag-cong-thuc.md` ·
`references/tuan-thu-va-kiem-chung.md` · `references/vi-du-mau.md`.

## 0. Quy trình mỗi lần viết (làm theo thứ tự)

1. **Xác định loại video** (bảng mục 1) và đề tài. Hiếu chưa nói đề tài → đề xuất 3 đề (kèm lý do, học từ mục 6 báo cáo), đợi chọn, **trừ khi Hiếu giao "tự chọn"**.
2. **Quét lặp mã**: `grep -ril` mã trong `videos/posts/` và `videos/scripts/` 7 ngày gần nhất; mã đã dùng thì đổi mã.
3. **Lấy dữ liệu**: nếu cần số thị trường → DNSE `get_workflow_guide` trước, rồi tool; giá lịch sử có thể trễ 1 phiên → Entrade API; tin/nguồn → Firecrawl. **DNSE hoặc Firecrawl không gọi được → dừng, báo "thiếu công cụ"**, không bịa số.
4. **Kiểm chứng**: mỗi số ≥2 nguồn độc lập, gắn nhãn (mục 5). Số lệch nguồn → **không đưa vào lời nói**.
5. **Viết đủ 8 phần** (mục 2), đếm chữ, tính thời lượng (220–260 tiếng/phút).
6. **Tự duyệt** bằng checklist mục 8, đọc lại như người xem (có tự nhiên? có chỗ nào nghe như quảng cáo hay như đọc báo cáo?).
7. Lưu `videos/scripts/<YYYY-MM-DD>-<slug>.md`, cập nhật `videos/posts/dem-tap.md` nếu là series đánh số, commit + push nhánh đang làm (không tạo PR trừ khi Hiếu bảo), gửi file cho Hiếu.
8. Tin nhắn cuối cho Hiếu (tiếng Việt, ngắn): chọn hook nào, số nào cần mở lại, công ty cần duyệt gì.

## 1. Loại video và công thức (từ báo cáo mục 8, 5 công thức)

| Loại | Công thức | Độ dài | Ghi chú |
|---|---|---|---|
| Tổng kết phiên/tuần | Đồng cảm → số liệu → cách nhìn | 60–150 s | Chỉ số đã xảy ra, không dự đoán phiên tới |
| Kiến thức 60 giây #n | Series 3 ý + 1 ví dụ số tròn | 45–65 s | Nhãn cố định "KIẾN THỨC 60 GIÂY #n" |
| Nghịch lý hai con số | Giá ≠ kết quả kinh doanh, điểm ≠ danh mục | 60–120 s | Nêu cả hai số + khung thời gian |
| Chuỗi sự kiện đo được | "giảm n phiên liên tiếp" + nguồn | 60–150 s | Có mã → công ty duyệt kỹ |
| Lột trần nghề môi giới #n | "Nếu là bạn thì sao?" hoặc luận điểm BẺ | 90–150 s | Dùng `series-be-lai-nhan-dinh-ve-nghe-moi-gioi.md` |
| Video ghim/giới thiệu | Đồng cảm → lợi ích → chia sẻ → Follow | ≈ 60–65 s (≈ 235–255 chữ) | Xem `references/vi-du-mau.md` |

Độ dài: không ép 2–3 phút. Dữ liệu báo cáo: hit-rate viral thấp nhất ở 120–300 s (0,96%), cao ở <20 s (2,27%) và >300 s (1,90%) [mẫu nhỏ, hạng B]. Mặc định **60–90 s**; tổng kết tuần/lột trần có thể 120–150 s nếu mỗi ý có hình mới.

## 2. Khung 8 phần (bắt buộc, xem mẫu `videos/scripts/2026-10-11-fpt-lai-deu-nhung-giam-11-phien.md`)

1. **3 tiêu đề/caption mở đầu** (mỗi cái một góc: đồng cảm / lợi ích / chia sẻ hoặc nghịch lý).
2. **3 phương án hook**: câu nói + chữ màn hình. Đánh dấu hook mặc định (A).
3. **Kịch bản có mốc giờ**: cue `[CHỮ]` `[B-ROLL]` `[CẮT]` `[DỪNG]` `[SFX]`; ghi giọng điệu trong ngoặc nghiêng. Cấu trúc thân: hook → đồng cảm/ngữ cảnh → "3 điều" (điều 3 là chỗ cần để ý, có twist) → khép vòng hook → **đúng 1 CTA** → rủi ro + miễn trừ ở 3,6 s cuối. Có bản cắt ~90 s nếu bản gốc dài hơn.
4. **Danh sách B-roll/đồ họa** (nêu cảnh nào chụp từ đâu; web CloudStock xem `references/tuan-thu-va-kiem-chung.md` mục C).
5. **Caption đăng + hashtag** (≤6, xem `references/hook-hashtag-cong-thuc.md`).
6. **Bảng kiểm chứng**: số / giá trị / nguồn / nhãn + "số lưu nhưng không dùng" + "cố ý không nói".
7. **Nguồn kèm link**.
8. **Hiếu cần chọn/xác nhận** (hook nào, số nào mở lại, câu [HIẾU ĐIỀN], công ty duyệt gì).

## 3. Giọng của Hiếu (góp ý đã nhận — luôn áp dụng)

1. **Không nói thẳng/không rao.** Không mở bằng "Mình là…, kênh này làm…". Mở bằng **cảm giác người xem đang có** ("Có những hôm VN-Index xanh mà danh mục vẫn đỏ…").
2. **Nói lợi ích mình mang lại** (bạn nhìn thị trường bình tĩnh hơn, bớt phải đoán, tự kiểm được số) thay vì liệt kê tính năng/số mã.
3. **Đồng cảm rồi chia sẻ cách nhìn**: "Cảm giác đó có thật, và nó rất bình thường." → "Điều mình thấy hay là…".
4. **Không bày to sự non nớt**: không nói "mình là thực tập sinh", "mình mới học", "mình đang học Python", "mình không phải chuyên gia". (Cũng không tự xưng chuyên gia, không dùng tên công ty/chức danh làm bằng cấp.) Chỉ "Mình là Hiếu" khi thật sự cần.
5. **Tôn trọng quyết định của người xem**: "quyết định đó là của bạn" thay cho khai báo kiểu "không phím hàng, không đoán giá" nói dồn.
6. **Nhận định kỹ thuật/triển vọng**: đưa nhận định dưới dạng **kịch bản có điều kiện** ("nếu giữ được vùng…, thì…; nếu mất, thì…"), **không ghi "chưa rõ"**, vẫn không giá mục tiêu, không mua/bán.
7. **Mỗi lần một ví dụ** (Hiếu: "chỉ cần 1 vd"): một ví dụ cụ thể, kể trọn, không dồn ba ví dụ.
8. **Tiếng Việt nói**: "mình/bạn", câu ngắn (≤ ~20 chữ), "có nghĩa là…" để dịch thuật ngữ, ẩn dụ đời thường, số tròn dễ nhẩm. Số đọc thành tiếng **≤ ~8**; số còn lại hiện bằng chữ màn hình.
9. Sai chính tả/gõ vội của Hiếu trong tin nhắn là bình thường; hiểu ý, không hỏi lại những gì có thể suy ra.

## 4. Quy tắc cứng (vi phạm = bỏ bản nháp) — tóm tắt, chi tiết ở `references/tuan-thu-va-kiem-chung.md`

- Không "phím hàng": không mua/bán, điểm vào/cắt lỗ/chốt lời, giá mục tiêu; không dùng khuyến nghị/giá mục tiêu của công ty chứng khoán khác; không "rẻ/đắt"; không "mai tăng/giảm"; không hứa lợi nhuận; không FOMO; không mời nhóm/Zalo trả phí; không tự xưng chuyên gia.
- Dự báo bên thứ ba: có **tên nguồn** + "có thể sai".
- Không giải thích "vì sao giá tăng/giảm" nếu không có nguồn; có thì nói "đây là nhận định của …, chưa ai đo được từng yếu tố".
- Mỗi video: **rủi ro + miễn trừ** ("Nội dung tổng hợp thông tin, không phải khuyến nghị đầu tư. Đầu tư luôn có rủi ro mất vốn.") ở 3,6 s cuối, và **đúng 1 CTA** (Follow hoặc "Lưu video để…").
- Không lặp mã trong 7 ngày (bài + video). Mã có biến cố → chỉ dùng thông tin doanh nghiệp/cơ quan chức năng công bố.
- Điều luật chỉ dẫn số điều khi đã xác minh; chưa chắc → [CẦN XÁC MINH], không đưa số điều.

## 5. Nhãn số liệu

[ĐÃ XÁC MINH] ≥2 nguồn · [1 NGUỒN] · [TỰ TÍNH] (ghi công thức) · [LỆCH NGUỒN] (nêu cả hai số, không dùng) · [CẦN XÁC MINH] · [HIẾU ĐIỀN] (thông tin cá nhân/chứng chỉ/trải nghiệm thật của Hiếu — **không viết thay**).

## 6. Điều báo cáo cho biết (dùng để chọn hướng, không phải luật)

- Viral chỉ **2,43%** video chứng khoán (1,49% nếu bỏ kênh công ty KIS); 33 video ≥100K đã xác minh [A].
- Tiêu đề **đánh số/series** viral 22% vs 5%; **có tên mã** 29% vs 11%; **từ cảnh báo** 11% vs 4% [B]. Hook dạng câu hỏi **không** có lợi thế (27% vs 31%).
- Chủ đề **đồng cảm** (gồng lỗ, "VN-Index giảm nhẹ nhưng NĐT lỗ nặng", meme) đạt ~62–174K lượt xem; video có tỷ lệ lưu cao nhất là "cách xem bảng giá 30 ngày cho người mới" (2,21%).
- Mô tả video viral của kênh độc lập **không** có CTA follow/comment (0/45), "nhóm/Zalo" 2% vs 8% → không cần ép CTA dài; một CTA nhẹ là đủ.
- `#fyp`, `#viral` không có lợi thế; hashtag trung bình 4,8 ở nhóm viral → dùng 5–6 hashtag có nghĩa.
- Mức tin cậy: A (đo trực tiếp) · B (thống kê mẫu lớn) · C (mẫu nhỏ) · D (đề xuất của mình). Khi trích, nói rõ mức.

## 7. Cấm trong lời thoại (danh sách quét nhanh)

"mua", "bán", "gom", "xả", "chốt lời", "cắt lỗ", "vùng mua", "mục tiêu <giá>", "rẻ", "đắt", "ngày mai sẽ", "chắc chắn", "đảm bảo lãi", "cơ hội ngàn năm", "kèo", "múc", "phím", "nhóm kín", "tham gia ngay", "chuyên gia", "mình là thực tập", "mình mới học", "mình đang học". Câu có các từ này → viết lại hoặc xóa. (Từ "mua/bán" được phép khi nói **dữ liệu** như "khối ngoại bán ròng", "mua ròng", hoặc khi nói **không** ("mình không nói mã nào nên mua hay bán").)

## 8. Checklist trước khi giao

- [ ] Đủ 8 phần; có bản 90 s nếu >100 s.
- [ ] Hook ≤ 8 s, chữ màn hình có; hook nói cảm giác/nghịch lý/con số, không rao kênh.
- [ ] Số chữ lời nói ↔ thời lượng khớp (220–260 chữ/phút); tính lại.
- [ ] Số đọc thành tiếng ≤ ~8; mỗi số đã có nhãn; không số lệch nguồn trong lời nói.
- [ ] Một ví dụ, một CTA, rủi ro + miễn trừ ở cuối.
- [ ] Quét mục 7: không từ cấm; không "chưa rõ" trong nhận định; không bày non nớt.
- [ ] Không lặp mã 7 ngày; mã có biến cố đã xử lý đúng.
- [ ] Mỗi cue hình có nguồn gốc rõ (ảnh web CloudStock: logo hiện, không tín hiệu MUA/BÁN, tắt "Vùng lệnh").
- [ ] Mục 8 ghi rõ những gì Hiếu phải mở lại/điền/công ty duyệt.
