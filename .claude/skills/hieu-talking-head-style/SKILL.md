---
name: hieu-talking-head-style
description: Phong cách dựng video talking head dọc (9:16 TikTok/Reels) của Hiếu cho kênh "Phan Hiếu Stock" — rút ra từ 3 video mẫu. Dùng khi Hiếu gửi video talking head để edit, hoặc hỏi cách dựng cho "giống mấy video mẫu". Áp dụng cùng /talking-head-recut, /embedded-captions, /hyperframes-keyframes, /media-use.
---

# Phong cách talking head của Hiếu

Phân tích từ 3 video mẫu (9:16, 576x1024, 25–84s). Khi dựng video mới cho Hiếu,
áp dụng toàn bộ quy tắc dưới đây trừ khi Hiếu nói khác.

## 1. Nhịp dựng (pacing)

- **Hook 0–3s phải có tiêu đề lớn**: 1–3 chữ khổng lồ + 1 dòng phụ nhỏ.
  Ví dụ mẫu: "talking head **VIDEO**" (chữ nằm *sau đầu* người nói), "**NEVER** post…",
  "ĐỪNG LÀM **3 ĐIỀU NÀY** — Video talking head *cao cấp hơn!*".
- Có nhãn series nhỏ ("ep.1") nếu là loạt bài.
- **Đổi hình ảnh mỗi 3–5 giây**: cắt cảnh, cutaway full màn hình, PiP, hoặc punch-in. *(Khảo sát mục 14: không bắt buộc nếu trong khung có chuyển động – quy tắc chính là "ý mới = hình mới".)*
  Video mẫu mạnh nhất có ~20 lần đổi cảnh trong 72s.
- Kết bằng CTA chữ lớn: "follow mình", "hẹn gặp lại".

## 2. Caption (quy tắc quan trọng nhất)

- **Tối đa 2 dòng**, không bao giờ 3 dòng.
- **Cỡ chữ vừa phải**: không quá to, không quá nhỏ.
- **Vị trí: ngang vai / ngực** (không che mặt, không sát đáy màn hình vì UI TikTok che).
- Mỗi lần hiện **1–4 chữ**, bật theo từng cụm lời nói (kinetic, word-by-word).
- **Phối 2 font trong cùng một cụm**:
  - chữ thường/chữ nối → sans nhỏ, trắng (`#FAFAFA`)
  - **từ khoá** → serif nghiêng to (hoặc sans đậm to) bằng **màu nhấn**
  - ví dụ: "tất tần tật / *bạn cần biết* / những thứ", "everyone's / *obsessed* / with fixing"
- Thỉnh thoảng đặt từ khoá **phía sau người nói** (text-behind-subject) cho cảnh hook.
- Có thể dùng caption dạng hộp màu (nền đỏ/xanh bo nhẹ, viền nét đứt) khi so sánh Đúng/Sai.

## 3. Font & màu

- **3 vai trò font** (không dùng nhiều hơn):
  | Vai trò | Mẫu dùng | Thay thế miễn phí có dấu tiếng Việt |
  |---|---|---|
  | Sans — nội dung | SF Pro Display | Inter, Be Vietnam Pro |
  | Serif — nhấn mạnh | Playfair Display Italic, IvyPresto | Playfair Display, Cormorant Garamond |
  | Script — sáng tạo, thỉnh thoảng | Whisper | Whisper, Dancing Script (kiểm tra dấu) |
  | Viết tay — nhãn chương | (kiểu Pacifico) | Pacifico, Kaushan Script |
- **Màu: 1 trắng + 1 tối + 1 màu nhấn.** Mẫu: `#FAFAFA` + `#111111` + tím/đỏ.
- Gợi ý cho kênh chứng khoán: nhấn **vàng `#F5C542`** hoặc **tím `#8B5CF6`**;
  xanh `#22C55E` / đỏ `#EF4444` **chỉ** dùng cho số liệu tăng/giảm.
- **Drop shadow nhẹ** (opacity thấp, blur nhỏ) để chữ tách nền, không dùng viền dày.
- Đừng làm quá phức tạp.

## 4. Các loại "card" đồ hoạ lặp lại

1. **Cutaway full màn hình**: nền trơn (trắng ngà / gradient tím nhạt / đỏ đậm / lụa tối)
   + 1 từ khoá hoặc 1 tên chủ đề ("fonts", "SF Pro Display 03", "how do I get more").
2. **Thẻ chương (chapter card)**: nền kem, 2 thanh xám trượt vào từ trên/dưới, nhãn khung
   nét đứt + icon nhỏ, chữ gõ dần ("Caption" → "Sound Effect" → "Animation").
3. **PiP bo góc**: người nói thu nhỏ vào thẻ bo tròn trên nền sáng, chữ bao quanh
   ("mình là … Việt … một editor").
4. **Montage/bằng chứng**: khung hình video/screenshot cong nhẹ, trượt qua;
   thẻ UI giả lập (số view, bảng giá) — với kênh chứng khoán: bảng giá, biểu đồ nến, % thay đổi.
5. **Nhãn chú thích tay**: chữ viết tay + mũi tên cong chỉ vào đồ hoạ ("Quan trọng!", "Chủ chốt!").
6. **Cutout người đen trắng** trên nền trắng + dấu "?" màu nhấn cho câu hỏi tu từ.

## 5. Chuyển cảnh & chuyển động

- **Keyframe là chủ chốt — và phải MƯỢT**: mọi keyframe dùng easing (tương đương
  "Easy Ease / F9" + chỉnh đồ thị tốc độ trong After Effects) → trong HyperFrames dùng
  ease `power2/power3.inOut` hoặc `expo.out`, không dùng `linear`. Video "clean" = animation mượt.
- Punch-in/zoom nhẹ giữa các câu (100% → 115%), không để cảnh người nói đứng yên quá ~5s.
- Chuyển cảnh: flash trắng/light leak, glitch/pixel dissolve, dấu X đỏ khi nói "sai".
- Đổi sang đen trắng + vignette cho khoảnh khắc nhấn mạnh/tiêu cực.
- Gradient tối ở đáy khung để chữ dễ đọc.

## 6. Âm thanh

- **Không bỏ SFX "đại" vào.** SFX phải hợp với chuyển động và element trên màn hình
  (whoosh khi trượt, pop khi chữ bật, click khi gõ chữ, ding khi hiện số).
- **Bản thân SFX cũng cần hiệu ứng**: thêm **Studio Reverb** lên SFX để nó hoà vào không gian,
  không bị "khô" và tách rời giọng nói.
- Giọng nói: lọc ồn, âm lượng đều.
- Nhạc nền nhỏ, duck (giảm) khi đang nói.

## 7. Áp dụng với HyperFrames

- Caption kinetic + text-behind-subject → `/embedded-captions`.
- Card, PiP, cutaway, CTA → `/talking-head-recut`.
- Punch-in / zoom → `/hyperframes-keyframes`.
- SFX, nhạc nền, lọc giọng → `/media-use` + `/hyperframes-audio`.
- Hiệu ứng có sẵn (glitch, light leak, biểu đồ) → tìm trong `/hyperframes-registry` trước.

## 7b. VÙNG AN TOÀN TIKTOK (bắt buộc, khung 1080×1920)

UI của TikTok che: thanh trên (tên/tìm kiếm), cột nút bên phải (tim/bình luận/chia sẻ),
và khối mô tả + tên nhạc + nút ở đáy. Mọi chữ / thẻ / số liệu / logo **phải nằm trong**:

| Cạnh | Chừa trống | Giới hạn nội dung |
|---|---|---|
| Trên | 130px (dùng 170px cho đẹp) | y ≥ 170 |
| Dưới | 484px (dùng 490px) | y ≤ ~1430 |
| Trái | 44–60px | x ≥ 60 |
| Phải | 140px | x ≤ 940 |

→ vùng dùng được ≈ 880 × 1260. Caption nằm trong y 1170–1430 (canh đáy 1430, không sát mép dưới);
disclaimer / CTA cuối phải ở y ≤ 1430; **không** đặt PiP ở góc dưới phải (nơi UI đè).
Nền / ảnh full màn hình thì được tràn ra ngoài, chỉ *nội dung đọc được* mới phải nằm trong vùng.
Nguồn tham khảo: hướng dẫn safe zone 2026 (130 top / 484 bottom / 44 left / 140 right).

## 8. Quy trình đã chạy tốt (video 28/9/2026 — `videos/2026-09-28-nganh-nguoc-dong/build.py` làm mẫu)

- **Nhận video >30 MB**: Hiếu gửi link Google Drive (chia sẻ "bất kỳ ai có link") → tải bằng
  `https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t`.
- **Cắt khoảng lặng > 0,5s** (đo mức dB mỗi 100ms, ngưỡng −40 dB, đệm 0,15s trước / 0,2s sau,
  bỏ khúc nói vấp) → cắt từng đoạn bằng ffmpeg rồi concat (filter_complex một lần bị hết RAM).
  Tại mỗi điểm nối đổi khung zoom 1.0 ↔ 1.1 để giấu jump cut.
- **Tách lời**: whisper.cpp `ggml-medium` + `--prompt` chứa mã CK/thuật ngữ; kịch bản của Hiếu
  dùng để sửa chữ. Đoạn nào timestamp dồn cục → tách riêng đoạn đó chạy lại.
- **Kiểm chứng số liệu** bằng API DNSE (`services.entrade.com.vn/chart-api/v2/ohlcs/stock|index`)
  — so từng con số trong kịch bản; đánh dấu **trần (tím) / sàn (xanh lơ)** đúng giá trần/sàn HOSE.
- **B-roll từ web CloudStock của Hiếu** (`https://www.cloudstock.id.vn/ma/<MÃ>`): chụp bằng
  Playwright (viewport 430×932, scale 2.5; tin CA proxy qua NSS `certutil`, không tắt TLS),
  ẩn header sticky, **tắt lớp "Vùng lệnh"**, khung 3T, chuột ra ngoài biểu đồ. Chỉ lấy khối giá
  (giá/%/KL/vốn hoá) + biểu đồ — **không đưa "NẮM GIỮ", "Có lệnh mua mới", vùng mua/chốt lời/cắt lỗ**
  vào video công khai (dễ bị hiểu là khuyến nghị).
- **Logo CloudStock phải hiện rõ** trên mọi cảnh lấy từ web (badge logo + "CloudStock" +
  `cloudstock.id.vn`) và ở CTA cuối (icon 512px bo góc + domain). Logo gốc: `public/logo-bieu-tuong-toi.png`
  (260px, chỉ dùng cỡ nhỏ), `public/icon-512.png` (dùng cỡ lớn).
- **Whisper: chạy từng khúc ~10s** cắt ở chỗ lặng (không chạy cả đoạn dài): đoạn dài làm timestamp từng từ
  dồn cục hoặc lệch vài giây. Gióng kịch bản với whisper bằng `align.py` → `tokens.json`, rồi đặt mốc thẻ bằng
  `T("cụm từ")` / `E("cụm từ")` trong `build.py` (video 30/9) — thẻ bám đúng lời nói, không phải canh tay.
- **Chụp web bằng script có sẵn**: `videos/tools/capture_cloudstock.mjs` (tắt Vùng lệnh + chỉ báo, khung 3T, bỏ nhãn MUA/BÁN).
- **Số liệu trong kịch bản của Hiếu có thể lệch** (video 30/9: kịch bản ghi TRC +5,68% nhưng DNSE/CloudStock là +3,93%):
  luôn đối chiếu DNSE + tìm báo (WebSearch) trước khi đưa lên màn hình; dùng số đã kiểm chứng và báo lại cho Hiếu.
- Caption **xanh/đỏ** trên áo sáng màu → thêm nền tối bo góc để đủ tương phản.

## 10. Bài học từ video mẫu #4 ("3 mẹo ép khách coi hết video", kênh u40hoc.xay.kenh, 48s)

**Nội dung 3 mẹo của video** (áp dụng khi dựng cho Hiếu):
1. **Xoá sạch khoảng đứng yên** — khung hình phải luôn chuyển động; não người ghét chờ đợi, mắt vừa định hình thì hình đã đổi.
2. **Cắt trên chuyển động (match cut on action)** — cuối chuyển động ở clip này = đầu chuyển động ở clip sau
   (tay đưa lên → cắt ngay lúc tay đang đưa, clip sau bắt đầu giữa động tác). Não bị "đơ" nên không nhận ra đã chuyển cảnh.
3. **Khung hình bận rộn** — vừa nói vừa làm gì đó (tay ra hiệu, cầm mic/sách/đồ vật, cầm cốc), hậu cảnh có vật chuyển động
   / ánh sáng. Bản năng tò mò với thứ di chuyển giữ người xem lại.

**Công thức hình ảnh quan sát được:**
- **Hook 0–3s**: chữ KHỔNG LỒ xếp chồng từng từ, mỗi từ một màu (vàng "3 MẸO", đỏ "ÉP", xanh "COI HẾT", trắng "VIDEO"),
  nằm *sau đầu* người nói (text-behind-subject) + punch-in mạnh theo từng từ. Đây là ngoại lệ hợp lý của quy tắc "1 màu nhấn":
  hook được phép 3–4 màu, phần thân vẫn giữ 1 màu nhấn.
- **Thẻ đồ hoạ kiểu tạp chí / báo in**: nền trắng ngà, chiếm **1/3 trên** màn hình, người nói vẫn thấy ở 2/3 dưới.
  Gồm: tiêu đề đậm ("Kỹ thuật 1: Xoá sổ khoảng chết") + hình minh hoạ đen-trắng-đỏ (mắt phát tia đỏ, kéo cắt sóng âm,
  sơ đồ vòng lặp, hình người đấm — *một hình = một ý*) + 1–2 câu chú thích nhỏ + con dấu đỏ tròn ở góc (logo series).
  Thẻ trượt vào từ trên, đổi **mỗi ~3s**, và luôn là hình *giải thích đúng câu đang nói*, không trang trí.
- **Caption karaoke**: nhỏ, ngang ngực (~60–66% chiều cao), tối đa 2 dòng, chữ thường sans trắng;
  **từ đang nói nằm trong ô bo tròn màu xanh dương**, các từ còn lại mờ đi. Không dùng chữ to che cảnh.
- **Nhiều "góc máy" từ một buổi quay**: mỗi lần cắt đổi cỡ cảnh (cận mặt choán khung ↔ trung cảnh thấy giá sách ↔ hơi nghiêng),
  đổi hậu cảnh/tư thế. Người xem tưởng có nhiều máy quay.
- **Đạo cụ + cử chỉ liên tục**: cầm mic lông, cầm sách, chỉ tay vào ống kính, nghiêng người; hậu cảnh có đèn, cây, mèo thần tài.
- **Kết**: màn hình đen với thanh tìm kiếm TikTok + @tên-kênh (end card 2–3s), thay vì chữ CTA dài.

**Áp dụng cho video chứng khoán của Hiếu:**
- Khi quay: quay 2–3 cỡ cảnh/tư thế khác nhau trong cùng buổi; giữ tay cử động hoặc cầm đồ vật; đừng ngồi im giữa các câu.
- Khi dựng: ưu tiên cắt ở giữa cử động tay; xen kẽ zoom 1.0 ↔ 1.25 (không chỉ 1.1); mỗi ~3s đổi một thứ (thẻ, zoom, B-roll).
- Thẻ số liệu: thử kiểu thẻ trắng ngà 1/3 trên (tiêu đề + 1 hình + 1 câu) thay vì khối tối; biểu đồ CloudStock vẫn đưa vào cạnh đó.
- Caption: chuyển sang karaoke nhỏ (từ đang nói được bo ô), chỉ để chữ to ở từ khoá/số liệu quan trọng.

## 11. Bài học từ 5 video mẫu #5–#9 (kênh rawjamintran, hoangnghetuban, hoangnghekinhdoanh — talking head + B-roll điện ảnh)

Quan sát từ contact sheet 1 khung/3s của 5 video (55–120s). Chia làm **3 kiểu**, chọn kiểu theo nội dung:

**Kiểu A — "Phim hoá" (rawjamintran, 66–107s):** cứ ≤3s đổi một hình. Người nói chỉ chiếm ~25% thời lượng,
còn lại là **cảnh phim/clip minh hoạ đúng ý câu** (Joker, Wolf of Wall Street, The Social Network…). Clip nằm trong
**khung 16:9 bo góc giữa canvas dọc nền tối có lưới mờ**, không full-screen. Chữ là **kinetic typography chồng lên cảnh**:
- Từ khoá cỡ KHỔNG LỒ, chữ in hoa đỏ/vàng, mờ xuyên (opacity ~.7) nằm *sau/trên* nhân vật ("NGHIỆN", "HÌNH THÀNH", "CHÍNH XÁC");
- Từ phụ nhỏ trắng ghim quanh từ khoá ("vẫn đang", "có thể là"), có font script mảnh (Creator *economy*);
- Mỗi cụm 1–3 từ, đổi theo nhịp nói, KHÔNG dùng câu dài. Ghép màu: trắng thường, đỏ/vàng cho từ cảm xúc.
- Mở bằng người nói (2 cụm) → vào cảnh phim ngay ở câu thứ 2; kết bằng end card đen + logo + link.

**Kiểu B — Karaoke vàng (hoangnghetuban, 25–66s):** người nói trong khung 16:9 bo góc giữa nền đen; **caption chữ vàng
đậm, nghiêng nhẹ, viền tối, nằm sát đáy khung video**, 2–4 từ; xen **cutaway phim 1–2s** (cảnh liên quan: kho tiền, nhà hàng,
tàu) mỗi ~6–8s, caption vẫn chạy trên cutaway. Nền đen để tập trung vào mặt.

**Kiểu C — Cận mặt tốc độ (hoangnghekinhdoanh, 55–120s):** full-frame dọc, người nói sát camera, tay ra hiệu liên tục.
- Caption **1–2 từ, in thường đậm trắng, ngang ngực**, đổi từng từ (≈0.3–0.5s/từ) — nhịp nhanh nên không bao giờ "đứng chữ".
- Mỗi **8–15s chèn 1 B-roll 2–4s**: infographic nền lưới đen (icon người 10.000$ > ông Buffett, mũi tên, số xanh/vàng/đỏ),
  ảnh chụp màn hình nguồn tin, clip YouTube của người được nhắc tên (kèm ảnh+tên nhỏ ở góc), ảnh chụp chứng từ/sao kê.
- Tiêu đề hook = **thẻ vàng chữ đen 2 dòng ở đỉnh** (3s đầu) rồi biến mất.
- Có **zoom nhảy (jump punch-in ~1.1→1.2) ở mỗi chỗ cắt** để che jump cut; cắt cả hơi thở.
- Kết: màn hình đen thanh tìm kiếm TikTok + @kênh (đã có ở mục 10).

**Những thứ chung của cả 5 video (nên áp dụng cho Hiếu):**
1. **Âm thanh to và đều**: mean −11…−14 dB (video mẫu #1 −16, #2 −21 là yếu nhất). Mục tiêu loudness ≈ −14 LUFS, đỉnh ≤ −1 dB. Hiếu có video mic nhỏ (thuế Việt–Mỹ) → nên nén + normalize giọng trước khi dựng.
2. **Nhịp thay đổi hình ≤3s** với kiểu A/B, ≤4s với kiểu C. Cảnh đứng yên >4s là mất người xem.
3. **B-roll luôn "giải thích đúng câu đang nói"** (nhắc người → ảnh/clip người đó; nhắc con số → infographic; nhắc nguồn → ảnh chụp bài báo). Không để clip trang trí.
4. **Chữ ít, to, đổi theo từng từ** — không đưa câu dài lên màn hình; số liệu to, đơn vị nhỏ.
5. **Nền tối + lưới mờ + khung bo góc** cho cảnh infographic tạo cảm giác "tài liệu", dễ đọc, hợp chủ đề tài chính.
6. **Hook mở bằng câu gây tò mò hoặc mâu thuẫn** trước khi giải thích (VD "GDP +9,95% mà VN-Index vẫn giảm").

**Áp dụng cho video chứng khoán của Hiếu (đề xuất, giữ quy tắc an toàn/bản quyền):**
- Mặc định dùng **kiểu C** (nhanh, rẻ, hợp video số liệu): caption 1–2 từ + infographic nền lưới đen (cột GDP, CPI, giá cổ phiếu) mỗi 8–12s + ảnh chụp CloudStock/nguồn tin có logo.
- **Kiểu A/B chỉ dùng khi có clip phim**: clip phim thương mại thường dính bản quyền và có thể bị gỡ/chặn tiếng trên TikTok; chỉ dùng
  cảnh ngắn có lời giải thích, hoặc thay bằng B-roll tự quay / stock miễn phí (Pexels, Pixabay) / ảnh chụp tin tức. Hỏi Hiếu trước khi dùng clip phim.
- Thêm bước **chuẩn hoá âm thanh** (`loudnorm=I=-14:TP=-1`, hoặc `acompressor` + `loudnorm`) vào pipeline trước khi render.
- Thẻ hook vàng chữ đen 2 dòng ở đỉnh 3s đầu là một lựa chọn gọn, nhanh (phù hợp yêu cầu "edit nhanh và đơn giản").
- Zoom nhảy 1.0 ↔ 1.15 tại mỗi jump cut; cắt cả khoảng thở giữa câu.

## 12. Lời nói/kịch bản của 5 video mẫu #5–#9 + tóm tắt bài nghiên cứu video ngắn

*(Phiên âm bằng whisper medium nên có lỗi chính tả; chỉ dùng để học cấu trúc, không trích nguyên văn.)*

**Cấu trúc lời nói quan sát được:**
- **#8 (trader/môi giới, 2 phút — gần chủ đề của Hiếu nhất):** Hook = *mệnh đề ngược tư duy* ("Trader giỏi không bao giờ đi làm môi giới") →
  ngay sau đó **tự hỏi thay người xem** ("Hả? Ý là…") → giải thích bằng **ví dụ số đơn giản từng bậc** (10.000$, lãi 5%/tháng = 500$;
  muốn 10.000$/tháng cần ~200.000$ vốn) → **bằng chứng bằng người thật có tên** → **chốt công thức một câu** ("Đơn giản!") →
  kết bằng câu **điều kiện** ("Nếu mục tiêu của bạn là… thì ok; còn nếu…"). Không có CTA ép buộc.
- **#7 (info business, 80s):** mở bằng *dự báo ngược* ("sẽ không hiệu quả nữa") → **định nghĩa thuật ngữ ngay trong câu** ("gọi là info business, có nghĩa là bạn kinh doanh thông tin") →
  **chuỗi nguyên nhân** (mô hình cũ → vì sao hỏng) → nhượng bộ ("tạm dùng vẫn được, nhưng sau này") → **hướng đi mới** (2–3 phương án) → điều kiện để thắng.
- **#5 (rawjamintran, nói về nghiện):** cảm xúc, dùng **điệp cấu trúc** "Các em có thể là… / Các em có thể là…" 4–5 lần rồi **đảo chiều** ("Nhớ sau này…") — câu ngắn, lặp, tăng dần.
- **#6/#9 (phỏng vấn):** dạng hỏi–đáp: một câu hỏi ngắn → trả lời bằng "Có nghĩa là…", kể trải nghiệm ngôi thứ nhất, kết bằng nguyên tắc sống.

**Thói quen câu chữ chung:** tiếng Việt nói chuyện, xưng hô trực tiếp (anh em/các bạn), **câu hỏi láy "đúng không?"** sau mỗi ý chính,
**"Có nghĩa là…"** để dịch jargon, ví dụ con số tròn dễ nhẩm, người thật làm chứng, kết bằng câu điều kiện thay vì "hãy mua/theo tôi".

**Từ bài nghiên cứu (người dùng gửi; nguồn chưa kiểm chứng — các con số như "40% xem tắt tiếng", "âm thanh chiếm 50%" chỉ tham khảo):**
- Khung kịch bản 4 tầng: **Hook 0–3s** (khẳng định ngược / kết quả lên trước) → **Khoảng trống tò mò 4–12s** (vì sao cách thông thường thất bại) → **Giá trị + bằng chứng 13–22s** → **CTA + vòng lặp 23–30s+** (câu cuối nối ngữ pháp với câu mở để người xem tua lại).
- 3 kiểu hook: *thông tin chưa đủ* (nêu sai lầm chết người, chưa nói cách sửa) · *thách thức niềm tin* · *bằng chứng trực tiếp* (đưa kết quả lên trước).
- **Pattern interrupt mỗi 2–4s:** punch-in 115–120% tại từ khoá, cắt góc máy thứ hai/B-roll flash, caption từng từ đổi màu ở từ trọng tâm,
  **ngắt nhạc nền ngay trước thông tin cốt lõi** (im lặng rồi mới nói), SFX whoosh/pop/riser trùng điểm cắt, đổi bối cảnh bằng đồ hoạ/meme ngắn.
- Quay: 4K/30fps cho thoại, khoá cân bằng trắng + khoá nét, ánh sáng 3 điểm, đèn RGB lệch góc lên tường sau để có dải màu tương phản.
- Vòng lặp phản hồi: xem biểu đồ giữ chân của từng video, tìm giây tụt người xem để sửa hook/nhịp ở video sau.

**Áp dụng khi Hiếu gửi kịch bản/viết kịch bản mới:**
1. Hook = câu ngược ý hoặc mâu thuẫn số liệu (VD "GDP +9,95% mà VN-Index vẫn giảm"), 1 câu, trước giây thứ 3.
2. Câu 2 tự hỏi thay người xem ("Vì sao?"/"Nghĩa là sao?").
3. Mỗi khái niệm khó: "…có nghĩa là…" + 1 ví dụ số tròn.
4. 3 ý chính, mỗi ý ≤ 25s, kết bằng công thức/nguyên tắc một câu.
5. Kết bằng câu điều kiện hoặc câu hỏi mở (comment mã) + disclaimer; cân nhắc câu cuối nối với câu đầu để tạo vòng lặp.
6. Dựng: interrupt 2–4s, punch-in 1.15, im lặng 0.2–0.3s trước con số quan trọng rồi SFX click.

## 13. 4 chỉ số thuật toán & cách tối ưu (tóm tắt Hiếu gửi; chưa kiểm chứng nguồn)

| Chỉ số | Việc cần làm trong video chứng khoán |
|---|---|
| Dừng lướt (1–3s đầu) | Hook ngược ý / kết quả lên trước / chừa khoảng trống tò mò — đã có ở mục 12 |
| Giữ chân | Đổi thị giác/âm thanh mỗi 2–4s (punch-in 115–120%, caption từng từ, SFX, im lặng trước con số) |
| Xem lại | Câu cuối nối ngữ pháp vào câu hook (VD cuối: "…và đó là lý do" → đầu: "GDP tăng gần 10% mà chỉ số vẫn giảm") |
| Chia sẻ / Lưu | **Mật độ giá trị cao** (danh sách 3 ý, checklist, mốc ngày cần theo dõi → người xem bấm Lưu); **đồng điệu bản sắc** (chạm đúng nỗi đau của nhà đầu tư F0: "mua đúng tin mà vẫn lỗ" → bấm Chia sẻ) |

Lưu ý: chỉ số "hoàn thành >100% nhờ loop" là cách nói của bài viết, không phải số liệu đã kiểm chứng.

## 14. Khảo sát 14 video tài chính nổi bật trên TikTok (11/10/2026) – ưu tiên các quy tắc ở đây khi mâu thuẫn với mục 10–13

Báo cáo đầy đủ (link từng video, phân tích 8 mục, số liệu): `videos/research/2026-10-11-khao-sat-buoc-2-3.md`; bảng 39 ứng viên: `…-buoc-1.md`.
Cách khảo sát: số liệu công khai TikTok (yt-dlp + curl_cffi), phụ đề tự động `vie-VN.vtt`, khung hình 1s/khung, ebur128. Bình luận và retention không lấy được.

**Đã kiểm thực tế (khác lý thuyết ở mục 12–13):**
- "Đổi hình mỗi 2–4s" KHÔNG bắt buộc: 4/14 video gần như một khung (bản tin VTV, bảng Excel, webcam + bảng giá, quay trong xe) vẫn ×12 đến ×106 lượt xem trung vị kênh.
  Quy tắc thay thế: **mỗi ý mới phải có hình mới; trong khung luôn có thứ đang chuyển động** (con trỏ, tay, phụ đề); không để khung đứng yên hoàn toàn >5s.
- Vòng lặp "câu cuối nối câu đầu": 0/14 video dùng → không bắt buộc.
- Độ to âm thanh không liên quan lượt xem (−13,7 đến −29,7 LUFS đều có video nổi); vẫn giữ đỉnh ≤ −1 dBTP để khỏi rè.
- Tốc độ nói video nổi tiếng Việt: 218–352 tiếng/phút (trung vị ~258). Video của Hiếu: 165–223 → khi viết kịch bản nhắm 220–260 (gọn câu, bớt từ đệm).

**Lặp lại nhiều (dùng mặc định):** tiêu đề/hook lớn cố định trên màn hình (12/14) · hook là câu người xem tự hỏi hoặc gọi đúng đối tượng (7/14) ·
con số trong 5s đầu (6/14) · nêu nguồn trên màn hình (6/14) · ẩn dụ đời thường cho khái niệm (5/14) · ví dụ số tròn/phép tính (5/14) · liệt kê 3 ý (4/14) · series đánh số (4/14).

**5 khung kịch bản đã chuẩn hoá** (mốc giây trong báo cáo, mục 3.3): A "Một con số – ba tác động" (60s, vĩ mô) · B "Bảng tính bằng chứng" (45–60s, tài chính cá nhân) ·
C "A và B khác nhau ở đâu" (35–45s, dùng được linh vật Mây) · D "Chính sách → 3 nhóm" (2–3 phút, ngành) · E "Câu chuyện cảnh báo" (2–2,5 phút, rủi ro).

**Đừng bắt chước:** dự báo không nguồn + "chắc chắn"; nêu mã kèm "upside lớn"/xếp hạng mã/"5 cổ phiếu nên…"; khoe lợi nhuận cá nhân; nút subscribe nhấp nháy; làm mờ số liệu;
"nhắn Bio" về nhóm; livestream gõ M/B; tiêu đề "vỡ…", "ALL IN", "tăng X lần".

**Chỉ số tự đo:** (lưu + chia sẻ) ÷ lượt xem – trung vị các kênh VN trong mẫu 0,09–0,80% → ≥0,5% tốt, ≥1% rất tốt; video "nổi" = ≥3× trung vị 20 video gần nhất của kênh.
Retention: không có ngưỡng công khai đáng tin → so với trung vị 10 video gần nhất của chính kênh.

## 15. Viết lời nói tự nhiên, bớt "văn máy" (học từ github.com/blader/humanizer, MIT, v3.1.0)

Repo đó là bộ 26 dấu hiệu "văn AI" (dựa trên trang Wikipedia "Signs of AI writing"), viết cho văn bản tiếng Anh. Tác giả nói công thức cấu trúc "xuất hiện ở mọi ngôn ngữ", nên các mục dưới đây là bản mình chuyển sang **lời nói tiếng Việt**; danh sách từ/cụm tiếng Việt là do mình tự thêm, không phải của repo.

**Hai nguyên tắc lõi của repo**
- Mỗi câu giữ lại phải thêm một thông tin người xem chưa có. Câu chỉ để "làm nặng" ý hoặc nhắc lại ý trước thì bỏ.
- Nếu có mẫu giọng thật của người viết thì mẫu đó **thắng** mọi quy tắc. Mẫu giọng của Hiếu: script các video trong `videos/*/script.txt`. Đặc điểm: câu ngắn xen câu dài; vào thẳng sự việc kèm số/ngày/tên ("Ngày 30/9, STB giảm 2,37%…"); tự hỏi rồi trả lời ("Vì sao?"); "nói nôm na", "tức là", "nghĩa là"; nhắc người xem phân biệt chắc/chưa chắc ("anh chị nhớ phân biệt giúp mình"); chốt bằng một ý có thông tin, không chốt bằng câu triết lý.

**Dấu hiệu cần bắt trong lời đọc (đánh dấu từ mạnh nhất; thấy 1 lần đã nên sửa ở 1–5)**
1. *Không phải X mà là Y*: "đây không chỉ là… mà còn", "điều này không có nghĩa là A, nó có nghĩa là B", đuôi cụt kiểu "…, không đoán mò". Chỉ giữ khi vế phủ định sửa một niềm tin có thật của người xem (như 3 câu "lùa gà/tiếp khách/vào tù" của Tập 0) hoặc cả hai vế đều có thông tin.
2. *Câu chốt một dòng / câu cụt kịch tính*: "Đó mới là điều quan trọng.", "Hãy suy ngẫm.", "Không A. Không B. Không C." Gộp thành 1 câu có ý cụ thể.
3. *Câu nghe sâu*: "cốt lõi của vấn đề", "điều thực sự quan trọng", "bản chất là", "X là tấm gương của Y". Thay bằng chính ý cụ thể.
4. *Dạo đầu dàn dựng*: "Mình sẽ nói thẳng", "Sự thật là", "Điều khó nghe nhất", "Hãy cùng khám phá", "Có một điều ít ai nói". Bỏ phần dạo, nói luôn ý. (Giữ dòng lộ trình "Mình sẽ đi qua 3 điều" của khung cũ vì nó là kỹ thuật giữ người xem.)
5. *Cãi với người không có mặt*: "Mình không nói là…", "Đừng hiểu lầm", "Nhiều người sẽ nói… nhưng". Chỉ giữ khi câu bị cãi thật sự là câu người xem hay nói.
6. *Bộ ba gượng*: ba ví dụ/ba tính từ cho đủ nhịp. Giữ khi nội dung đúng là có 3 phần.
7. *Mở câu lặp theo khuôn*: "Câu này cũng có phần thật." lặp ở mỗi đoạn. Đổi cách vào hoặc vào thẳng sự việc.
9. *Rào đón chồng chất*: "có thể", "phần nào", "dường như" chồng nhau. Giữ rào đón có nguồn, **giữ nguyên** câu rủi ro và disclaimer.
12–13, 16. *Từ khuếch đại*: "đóng vai trò then chốt", "bức tranh toàn cảnh", "không thể phủ nhận", "bước ngoặt", "tương lai đầy hứa hẹn", "đáng chú ý" nói ở mọi câu. Bỏ phần tô vẽ, giữ sự việc.
17. *Nguồn không tên*: "các chuyên gia cho rằng…" → nêu tên nguồn và ngày, hoặc bỏ (quy tắc "Nguồn:" đã có).
22. *Dấu vết chatbot*: "Tuyệt vời!", "Hy vọng hữu ích", "Bạn muốn mình…?".
Hình thức: lời đọc không có dấu gạch ngang, ngoặc đơn, in đậm; số đọc thành chữ dễ đọc (ví dụ "ngày 28 tháng 8").

**Quy trình 4 bước** (của repo): đánh dấu → viết lại (giữ mọi số liệu, tên, nguồn, không bịa thêm) → **đọc to** và hỏi "chỗ nào nghe như đọc bài?" → tìm lại các dấu hiệu hay sót (1, 2, 3, 4, 6, 7) rồi mới chốt.

**Đừng sửa quá tay:** giữ ý kiến có đánh dấu "mình nghĩ", chi tiết cụ thể, câu hỏi tự nhiên; không bịa chuyện cá nhân hay chi tiết để cho "giống người"; không bỏ câu tuân thủ (không hô mã, không hứa lãi, rủi ro, không phải khuyến nghị).

## 16. Khung "một luận điểm – một phép tính" (học từ clip @hoangnghekinhdoanh, Hiếu yêu cầu 11/10/2026)

Hiếu chê bản kịch bản kiểu "bản tin nhiều nguồn". Clip mẫu thuyết phục vì **chỉ có một ý, đi hết đường**:
1. Tuyên bố ngược 1 câu (0–5 s) → 2. "Hả? Ý là…" + so sánh nhanh (5–15 s) → 3. "Tại sao thế? Bởi vì…" + **một cơ chế bằng một phép tính người xem tự nhẩm được** ("Giả sử…", 15–45 s) → 4. bằng chứng người thật (1 ví dụ) → 5. "Điều đó không có nghĩa là…" chặn hiểu lầm + nhận phần xấu → 6. công thức một câu → 7. "Nếu… thì ok. Đừng tin lời mình, hãy xem…" + câu cuối nối về câu đầu.
Số đo: ~250 tiếng/phút, câu trung vị 11–12 tiếng, ~6 câu hỏi tự đặt/2 phút, ~11 con số, đổi cảnh ~1 lần/4 s, hầu như không nghỉ.
**Áp dụng cho Hiếu:** mỗi tập chỉ 1 luận điểm + 1 phép tính (đánh dấu "VÍ DỤ GIẢ ĐỊNH" trên hình) + ≤2 nguồn thật; điều luật dùng làm bằng chứng cho đúng 1 ý, không rải 7 điều. Hook dùng "không cần/hiếm khi" thay "không bao giờ" khi có ngoại lệ đã biết. Giữ nguyên rào tuân thủ (không hô mã, không hứa lãi, rủi ro, disclaimer).
**Bài học sau khi Hiếu chê bản 3 ("cần ít con số hơn"):** nói ra ≤5 con số; nếu cơ chế không cần phép tính thì thay bằng **một tình huống người xem tự hình dung** (ví dụ: mua theo lời khuyên, lỗ, nhắn lại thì bị chặn); ≤2 nguồn đặt tên trong lời; một câu hỏi tự kiểm duy nhất. **Trước khi gửi, đọc lại bằng mắt người xem:** 3 giây đầu có liên quan đến tiền/nỗi sợ của họ không? Có chỗ nào nghe như bản tin/báo cáo không?
Kịch bản mẫu: `videos/scripts/series-lot-tran-nghe-moi-gioi-tap-1-lua-ga.md` (bản 4).

## 9. Checklist trước khi xuất

- [ ] Âm lượng file xuất: mean ≈ −13…−15 dB, đỉnh ≤ −0.3 dB (file < −18 dB thì điện thoại nghe rất nhỏ): sau khi nén chạy `-af volume=4.5dB,alimiter=limit=0.9` hoặc loudnorm + gain
- [ ] Hook có tiêu đề lớn trong 3s đầu
- [ ] Mọi chữ/thẻ/logo nằm trong vùng an toàn TikTok (mục 7b)
- [ ] Không caption nào quá 2 dòng, caption ở ngang vai
- [ ] ≤ 3 font, ≤ 1 màu nhấn (+ xanh/đỏ cho số liệu)
- [ ] Ý mới = hình mới; không khung nào đứng yên hoàn toàn >5s (mục 14)
- [ ] Mỗi animation có SFX đi kèm, SFX có reverb
- [ ] Mọi keyframe có easing mượt (không linear)
- [ ] Số liệu tài chính đã kiểm chứng từ ≥ 2 nguồn; có dòng "không phải khuyến nghị đầu tư"
- [ ] CTA ở cuối
- [ ] Kịch bản chỉ có MỘT luận điểm + MỘT phép tính tự nhẩm được; có "Hả? Ý là…", "Tại sao thế?", chặn hiểu lầm, công thức 1 câu, kết có điều kiện nối về câu đầu (mục 16)
- [ ] Đã đọc lại bằng mắt người xem: ≤5 con số nói ra, 3 giây đầu liên quan đến họ, không nghe như bản tin (mục 16)
- [ ] Lời đọc đã rà "văn máy" (mục 15) và đọc to thử một lượt: không còn dạo đầu dàn dựng, câu chốt lặp ý, câu nghe sâu
