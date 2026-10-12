#!/usr/bin/env python3
"""Bản đăng/xem trước từ output.mp4: chuẩn hoá tiếng (loudnorm 2 lượt, -14 LUFS, đỉnh ≤ -1 dBTP) + h264 CRF 21, giữ 1080x1920.
Dùng: python3 th_preview.py <output.mp4> <preview.mp4> [crf | maxMB]
  - số nguyên ≤ 40 hiểu là CRF (mặc định 21); thêm hậu tố "mb" (vd 28mb) để khống chế dung lượng file (gửi qua chat giới hạn 30 MiB)
(preview*.mp4 nằm trong .gitignore; chỉ commit mã dựng.)"""
import json
import subprocess
import sys

src, dst = sys.argv[1], sys.argv[2]
arg = sys.argv[3] if len(sys.argv) > 3 else "21"
maxmb = float(arg[:-2]) if arg.endswith("mb") else None
crf = arg if maxmb is None else "21"
I, TP, LRA = -14.0, -1.0, 11.0
r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", src, "-vn",
                    "-af", f"loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json", "-f", "null", "-"],
                   capture_output=True, text=True)
m = json.loads(r.stderr[r.stderr.rfind("{"):r.stderr.rfind("}") + 1])
af = (f"loudnorm=I={I}:TP={TP}:LRA={LRA}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
      f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,"
      "alimiter=limit=0.89:attack=3:release=40:level=disabled")   # AAC có thể vượt đỉnh sau mã hoá → chặn ở ≈ -1 dBFS
if maxmb:
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src]).decode())
    vb = int((maxmb * 1024 * 1024 * 8 / dur - 128_000) * 0.93)          # bit/s cho hình, chừa 7% cho khung mp4
    venc = ["-b:v", str(vb), "-maxrate", str(int(vb * 1.3)), "-bufsize", str(vb * 2)]
    abr = "128k"
else:
    venc = ["-crf", crf, "-maxrate", "6M", "-bufsize", "12M"]
    abr = "160k"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", af, "-c:v", "libx264", "-preset", "medium", *venc,
                "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "aac", "-b:a", abr, "-ar", "48000", dst], check=True)
print(f"{src}: {m['input_i']} LUFS → {I} LUFS; ghi {dst}")
