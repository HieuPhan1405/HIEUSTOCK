#!/usr/bin/env python3
"""Chỉnh màu + làm nét + làm đẹp da NHẸ cho video talking head dọc (OpenCV).

Dùng:  python3 th_enhance.py <vào.mp4> <ra.mp4> [--haar haar.xml] [--preview giây1,giây2,...]
- Dò mặt bằng Haar (haarcascade_frontalface_default.xml), làm mượt hộp mặt theo thời gian.
- Mặt nạ da (YCrCb) trong vùng quanh mặt: làm mượt da (bilateral, giữ 35% chi tiết), giảm bóng dầu ở vùng sáng,
  hơi ấm da, sáng mắt/vùng tối; KHÔNG biến dạng khuôn mặt.
- Toàn khung: cân trắng nhẹ, đường cong tương phản, làm nét (unsharp, ít hơn trên da), vignette nhẹ.
- --preview: chỉ xuất ảnh trước/sau tại các giây đó (thư mục cạnh file ra).
Yêu cầu: pip install opencv-python-headless==4.10.0.84 numpy ; ffmpeg.
"""
import argparse
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

W, H = 1080, 1920


def s_curve(x, k=0.35):
    """x∈[0,1] → đường cong chữ S nhẹ."""
    return x + k * (x - 0.5) * (1 - np.abs(2 * x - 1)) * 0.5 * 2 * 0.5


def enhance(bgr, face):
    img = bgr.astype(np.float32) / 255.0
    h, w = img.shape[:2]

    # --- cân trắng nhẹ: kéo tường (vùng trái-trên) về trung tính, tối đa ±4%
    wall = img[40:300, 30:260].reshape(-1, 3).mean(0)
    g = wall.mean() / np.maximum(wall, 1e-3)
    g = np.clip(g, 0.96, 1.04)
    img = np.clip(img * g, 0, 1)

    # --- mặt nạ da trong vùng quanh mặt
    fx, fy, fw, fh = face
    cx, cy = fx + fw / 2, fy + fh / 2
    region = np.zeros((h, w), np.float32)
    cv2.ellipse(region, (int(cx), int(cy + fh * 0.12)), (int(fw * 0.78), int(fh * 0.98)), 0, 0, 360, 1.0, -1)
    ycc = cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_BGR2YCrCb)
    Y, Cr, Cb = ycc[..., 0], ycc[..., 1], ycc[..., 2]
    skin = ((Cr > 133) & (Cr < 175) & (Cb > 75) & (Cb < 128) & (Y > 70)).astype(np.float32)
    skin = cv2.morphologyEx(skin, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    skin = cv2.GaussianBlur(skin * region, (0, 0), 7)
    skin = np.clip(skin * 1.15, 0, 1)[..., None]

    # --- làm mượt da (ở nửa độ phân giải), giữ lại 35% chi tiết
    small = cv2.resize(img, (w // 2, h // 2), interpolation=cv2.INTER_AREA)
    sm = cv2.bilateralFilter(small, 9, 0.09, 7)
    sm = cv2.bilateralFilter(sm, 9, 0.07, 5)
    sm = cv2.resize(sm, (w, h), interpolation=cv2.INTER_CUBIC)
    detail = img - cv2.GaussianBlur(img, (0, 0), 2.2)
    smooth = sm + 0.35 * detail
    img = img * (1 - 0.62 * skin) + smooth * (0.62 * skin)

    # --- giảm bóng dầu (vùng sáng trên da) + hơi ấm da
    lum = img.mean(2, keepdims=True)
    shine = np.clip((lum - 0.62) / 0.3, 0, 1) * skin
    img = img - 0.16 * shine
    warm = np.array([0.985, 1.0, 1.02], np.float32)  # BGR: bớt xanh lá/vàng, thêm đỏ nhẹ
    img = img * (1 - 0.35 * skin) + img * warm[None, None, :] * (0.35 * skin)
    # nâng nhẹ vùng tối của mặt (mắt, dưới cằm)
    img = img + 0.035 * skin * (1 - lum) ** 2

    # --- toàn khung: tương phản (đường cong S) + bão hoà nhẹ
    img = np.clip(img, 0, 1)
    img = img + 0.5 * 0.22 * (img - 0.5) * (1 - np.abs(2 * img - 1))
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.08, 0, 1)
    img = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

    # --- vignette nhẹ (đưa mắt người xem vào mặt)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx - cx) / (w * 0.75)) ** 2 + ((yy - (cy + 120)) / (h * 0.62)) ** 2)
    img = img * (1 - 0.16 * np.clip(d - 0.35, 0, 1)[..., None])

    # --- làm nét: unsharp trên độ sáng, ít hơn trên da
    ycc = cv2.cvtColor(np.clip(img, 0, 1), cv2.COLOR_BGR2YCrCb)
    yl = ycc[..., 0]
    blur = cv2.GaussianBlur(yl, (0, 0), 1.4)
    amt = 0.75 * (1 - skin[..., 0]) + 0.28 * skin[..., 0]
    ycc[..., 0] = np.clip(yl + amt * (yl - blur), 0, 1)
    img = cv2.cvtColor(ycc, cv2.COLOR_YCrCb2BGR)
    return (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)


class FaceTrack:
    def __init__(self, haar):
        self.c = cv2.CascadeClassifier(haar)
        self.box = None

    def update(self, bgr, i):
        if self.box is None or i % 10 == 0:
            g = cv2.cvtColor(cv2.resize(bgr, None, fx=.5, fy=.5), cv2.COLOR_BGR2GRAY)
            r = self.c.detectMultiScale(g, 1.1, 6, minSize=(120, 120))
            if len(r):
                b = max(r, key=lambda t: t[2] * t[3]) * 2
                b = np.array(b, np.float32)
                self.box = b if self.box is None else 0.6 * self.box + 0.4 * b
            elif self.box is None:
                self.box = np.array([252, 502, 576, 576], np.float32)
        return self.box


def run_parallel(a):
    """Chia video thành a.jobs đoạn (theo số khung), mỗi đoạn một tiến trình, rồi nối + ghép tiếng (+ giữ khung cuối)."""
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.src]).decode())
    nfr = round(dur * 30)
    step = -(-nfr // a.jobs)
    procs, parts = [], []
    for j in range(a.jobs):
        f0, f1 = j * step, min(nfr, (j + 1) * step)
        part = f"{a.dst}.part{j}.mp4"
        parts.append(part)
        procs.append(subprocess.Popen([sys.executable, __file__, a.src, part, "--haar", a.haar, "--crf", a.crf,
                                       "--ss", f"{f0 / 30:.4f}", "--t", f"{(f1 - f0) / 30:.4f}", "--video-only"]))
    for p in procs:
        p.wait()
    lst = f"{a.dst}.list.txt"
    Path(lst).write_text("".join(f"file '{Path(x).resolve()}'\n" for x in parts))
    if a.pad:
        vargs = ["-vf", f"tpad=stop_mode=clone:stop_duration={a.pad}", "-c:v", "libx264", "-crf", a.crf, "-preset", "medium", "-pix_fmt", "yuv420p", "-g", "30",
                 "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709"]
        aargs = ["-af", f"apad=pad_dur={a.pad}", "-c:a", "aac", "-b:a", "192k", "-ar", "48000"]
    else:
        vargs, aargs = ["-c:v", "copy"], ["-c:a", "copy"]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-i", a.src, "-map", "0:v", "-map", "1:a?",
                    *vargs, *aargs, "-shortest", a.dst], check=True)
    for x in parts + [lst]:
        Path(x).unlink()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--haar", default=str(Path(__file__).with_name("haar.xml")))
    ap.add_argument("--preview", default="")
    ap.add_argument("--crf", default="16")
    ap.add_argument("--jobs", type=int, default=1, help="chia video thành N đoạn xử lý song song")
    ap.add_argument("--ss", type=float, default=0.0)
    ap.add_argument("--t", type=float, default=0.0)
    ap.add_argument("--video-only", action="store_true")
    ap.add_argument("--pad", type=float, default=0.0, help="giữ khung cuối thêm N giây (hình đứng + im lặng) cho thẻ kết/miễn trừ")
    a = ap.parse_args()
    if a.preview:
        out = Path(a.dst).parent
        for t in a.preview.split(","):
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", t, "-i", a.src, "-frames:v", "1", "-vf", f"scale={W}:{H}", f"{out}/_f{t}.png"], check=True)
            im = cv2.imread(f"{out}/_f{t}.png")
            box = FaceTrack(a.haar).update(im, 0)
            cv2.imwrite(f"{out}/cmp_{t}.jpg", np.hstack([im, enhance(im, box)]), [cv2.IMWRITE_JPEG_QUALITY, 90])
        return
    if a.jobs > 1:
        run_parallel(a)
        return
    ft = FaceTrack(a.haar)
    dec = subprocess.Popen(["ffmpeg", "-v", "error", *(["-ss", str(a.ss)] if a.ss else []), *(["-t", str(a.t)] if a.t else []), "-i", a.src,
                            "-vf", f"scale={W}:{H}:flags=lanczos,fps=30", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
    # âm thanh (đã chuẩn hoá ở th_cut.py) ghép lại từ file nguồn; --video-only: chỉ xuất hình (dùng cho chế độ song song)
    enc_in = ["-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "30", "-i", "-"]
    audio = ["-an"] if a.video_only else ["-i", a.src, "-map", "0:v", "-map", "1:a?", "-c:a", "copy"]
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", *enc_in, *audio,
                            "-c:v", "libx264", "-crf", a.crf, "-preset", "medium", "-pix_fmt", "yuv420p", "-g", "30",
                            "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", a.dst], stdin=subprocess.PIPE)
    n = 0
    fsz = W * H * 3
    while True:
        buf = dec.stdout.read(fsz)
        if len(buf) < fsz:
            break
        im = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        enc.stdin.write(enhance(im, ft.update(im, n)).tobytes())
        n += 1
        if n % 150 == 0:
            print(f"{n} khung", file=sys.stderr, flush=True)
    enc.stdin.close()
    enc.wait()
    dec.wait()


if __name__ == "__main__":
    main()
