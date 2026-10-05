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
- **Đổi hình ảnh mỗi 3–5 giây**: cắt cảnh, cutaway full màn hình, PiP, hoặc punch-in.
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

## 9. Checklist trước khi xuất

- [ ] Hook có tiêu đề lớn trong 3s đầu
- [ ] Mọi chữ/thẻ/logo nằm trong vùng an toàn TikTok (mục 7b)
- [ ] Không caption nào quá 2 dòng, caption ở ngang vai
- [ ] ≤ 3 font, ≤ 1 màu nhấn (+ xanh/đỏ cho số liệu)
- [ ] Đổi hình mỗi 3–5s
- [ ] Mỗi animation có SFX đi kèm, SFX có reverb
- [ ] Mọi keyframe có easing mượt (không linear)
- [ ] Số liệu tài chính đã kiểm chứng từ ≥ 2 nguồn; có dòng "không phải khuyến nghị đầu tư"
- [ ] CTA ở cuối
