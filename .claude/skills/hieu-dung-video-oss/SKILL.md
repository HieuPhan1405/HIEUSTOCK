---
name: hieu-dung-video-oss
description: Quy trình và bộ công cụ mã nguồn mở đã dùng để dựng video talking head dọc cho kênh "Phan Hiếu Stock" (cắt khoảng lặng, nhận dạng lời, phụ đề, chỉnh màu/làm đẹp da, thẻ đồ họa HyperFrames, ảnh bìa, xuất bản xem trước). Dùng khi Hiếu gửi video để dựng, hoặc khi cần biết lệnh, thư mục, lỗi hay gặp. Phần phong cách/hình ảnh xem /hieu-talking-head-style, phần viết lời xem /hieu-viet-kich-ban.
---

# Dựng video talking head với công cụ mã nguồn mở (Phan Hiếu Stock)

Mọi script nằm ở `videos/tools/`, mỗi video có thư mục `videos/<ngày>-<slug>/`. Video nặng không commit (`videos/.gitignore`).

## 1. Công cụ mã nguồn mở và việc từng cái làm
| Công cụ | Dùng để làm gì | Cài / gọi |
|---|---|---|
| [HyperFrames](https://github.com/heygen-com/hyperframes) (+ GSAP) | Dựng thẻ đồ họa, caption động, zoom, SFX bằng HTML → render mp4 | `npx hyperframes snapshot|check|render public …`; skill `/hyperframes-*`, `/talking-head-recut` |
| [FFmpeg](https://ffmpeg.org) | Cắt, scale 1080×1920, loudnorm, `silencedetect`, đốt phụ đề ASS | có sẵn |
| [whisper.cpp](https://github.com/ggerganov/whisper.cpp) | Nhận dạng lời theo từng đoạn ~10 s (`whisper-cli -m ggml-medium.bin -l vi -ml 1 -sow -oj --prompt "<thuật ngữ>"`); đoạn nghi ngờ chạy `ggml-large-v3-q5_0` | cần file mô hình `.bin` |
| [faster-whisper](https://github.com/SYSTRAN/faster-whisper) | Nhận dạng lời bằng Python (CPU int8), lấy mốc từng chữ; `WHISPER_MODEL=large-v3` chính xác hơn `medium` | `python3 -m pip install faster-whisper` |
| [OpenCV](https://github.com/opencv/opencv) | Dò mặt (Haar `videos/tools/haar.xml`), mặt nạ da, làm mịn, làm nét | `python3 -m pip install "opencv-python-headless==4.10.0.84" "numpy<2.1"` |
| [Playwright](https://github.com/microsoft/playwright) (`playwright-core`) | Chụp trang CloudStock, render ảnh bìa HTML → PNG | `cd /tmp/claude-0/shot && npm i playwright-core` |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) + [curl_cffi](https://github.com/lexiforest/curl_cffi) | Lấy số liệu công khai TikTok (`--impersonate chrome`) khi nghiên cứu | pip |
| Phông [Inter](https://github.com/rsms/inter), Be Vietnam Pro, Playfair Display | Phụ đề (Inter Bold, `/usr/share/fonts/opentype/inter`), thẻ và ảnh bìa (woff2 trong `fonts/`) | |

## 2. Hai đường dựng
**A. Đường nhanh (video đơn giản, ~40 phút cho 2 video):** `th_quick.py`
1. Tải Drive: `curl -L -o x.mp4 "https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t"` (tệp >30 MB cũng tải được).
2. `python3 th_quick.py cut x.mp4 x_cut.mp4` → bỏ khoảng lặng >0,45 s (−38 dB), xen zoom 1,0 ↔ 1,1 tại chỗ nối, 1080×1920 30 fps, giọng −16 LUFS.
3. `WHISPER_MODEL=large-v3 python3 th_quick.py transcribe x_cut.mp4 words.json` (rồi tự sửa chữ sai bằng bảng thay thế; mô hình `medium` hay sai "trái phiếu", "Fed", "USD", "bất động sản").
4. `python3 th_enhance.py x_cut.mp4 x_enh.mp4 --haar haar.xml --jobs 3 [--pad 1.8]` → chỉnh màu, làm nét, da (nhẹ), vignette; `--jobs 3` chạy 3 tiến trình (~3,7 khung/s tổng, 4 lõi); `--preview 12,40` xuất ảnh trước/sau.
5. `python3 th_quick.py caption words.json x_enh.mp4 x_final.mp4` → phụ đề 2–3 chữ, ngang ngực (MarginV 500), trong vùng an toàn TikTok.
6. `python3 th_preview.py x_final.mp4 x_chat.mp4 28mb` → loudnorm −14 LUFS, nén ≤28 MB để gửi chat.

**B. Đường đầy đủ (thẻ đồ họa, video ghim, nội dung quan trọng):** `th_cut.py` → `th_align.py` → `build.py` (`th_lib.Builder`) → `th_measure.mjs` → render
1. Whisper từng đoạn → `subs.json`, `sw??.json`; viết `plan.json` (chỉ liệt kê đoạn GIỮ; bỏ lần nói nháp; đoạn có `range` để vá/kéo dài).
2. `python3 th_cut.py <thư mục>` → `public/input-video.mp4` + `offs.json` (giọng −19 LUFS). Chạy `th_enhance.py` lên file này rồi chép đè lại (kèm `--pad` nếu cần giữ khung cuối cho thẻ kết).
3. `python3 th_align.py <thư mục>` → `tokens.json`, `script.txt`.
4. `build.py` khai thẻ bằng `B.card/B.chapter`, mốc `B.T("cụm")` / `B.E("cụm")` lấy từ lời nói; `B.write()`.
5. Kiểm: `node th_measure.mjs <thư mục>` (hộp chữ trong vùng an toàn y 170–1430, x 60–940) và `npx hyperframes snapshot public --at 3,9,20 --no-end -o <tmp>`.
6. Render (chạy nền, KHÔNG dùng `nohup … &`): `npx hyperframes render public --skill=talking-head-recut -o output.mp4 --fps 30` (~5–15 phút).
7. `th_preview.py output.mp4 preview.mp4 [28mb]`.

**Ảnh bìa:** `videos/covers/make_covers.py` (thêm mục vào `COVERS`, đặt ảnh trong `img/`) rồi `PREFIX=cover_<khóa> node shoot.mjs` (cần `playwright-core` ở `/tmp/claude-0/shot`; tự tìm Chromium). Chọn khung nhìn thẳng ống kính, miệng khép, tay không che cằm; chữ nằm trên đầu, `dy` đẩy ảnh xuống. Chạy `make_covers.py` sẽ làm đổi html các bìa cũ: `git checkout --` những file đó, **đừng** checkout `make_covers.py`.

## 3. Lỗi hay gặp (đã gặp thật)
- `pkill -f <tên script>` tự giết shell vì lệnh chứa tên đó → dùng `pkill -x whisper-cli`.
- Render bị huỷ `render_cancelled_parent_exited` khi chạy `nohup … &` trong lệnh nền → chạy trực tiếp với `run_in_background`.
- `opencv` bản 5.x không có `cv2.CascadeClassifier` → ghim `4.10.0.84`.
- Máy mới: `pip` và `python3` có thể khác phiên bản → dùng `python3 -m pip install`; chưa có `whisper-cli` hay mô hình `.bin`; phải cài lại opencv/playwright; `playwright-core` ở `/tmp/claude-0/shot`.
- Lệnh >120 s bị đẩy nền; tác vụ nền tối đa 30 phút mặc định → đặt `timeout` lớn (≤7200000 ms) cho `th_enhance.py` video dài (≈1,25 khung/s mỗi tiến trình).
- `loudnorm` hai lượt; nguồn quá nhỏ (−25 LUFS) cần kéo lên trước khi dựng; bản gửi chat ≤28 MB.
- Mô hình nhận dạng sai mã cổ phiếu (SELL/SEAL, CEE): hỏi Hiếu mã đúng, không đoán lên màn hình.
- Chữ ngược trên màn hình máy tính phía sau là do video gốc quay gương, không phải lỗi dựng.
- Nhiều nguồn Drive dạng 576×1024 (tải từ TikTok): phóng lên 1080×1920 sẽ mềm hơn nguồn 1080p.
- Firecrawl hết credit và DNSE ngắt kết nối là chuyện có thật: báo "thiếu công cụ", không bịa số.

## 4. Quy tắc nội dung (nhắc ngắn, chi tiết ở `/hieu-viet-kich-ban`)
Công văn 3760: không "phím hàng", không giá mục tiêu, không dự đoán giá, một CTA, rủi ro + miễn trừ ở 3,6 s cuối, số liệu ≥2 nguồn, không lặp mã 7 ngày. Video nêu danh sách mã kèm "đáng chú ý/tạo đáy/cơ hội": nhắc Hiếu để công ty duyệt. Chỉ dựng, không tự sửa lời của Hiếu.
