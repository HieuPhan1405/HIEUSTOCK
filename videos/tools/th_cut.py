#!/usr/bin/env python3
"""Cắt khoảng lặng + nối đoạn nói → public/input-video.mp4 (1080x1920, 30 fps, h264 CRF17, GOP 30) và offs.json.

Dùng:  python3 th_cut.py <thư mục video>      (cần <thư mục video>/plan.json)

plan.json:
{
  "src":  "/đường/dẫn/video-gốc",          # không commit
  "work": "/đường/dẫn/thư-mục-whisper",     # có subs.json (các đoạn nói [pi, a, b]) và sw??.json
  "pre": 0.15, "post": 0.30,                # đệm trước / sau mỗi đoạn nói (giây)
  "gain_target": -19.0,                     # LUFS giọng sau khi chuẩn hoá (khớp các video trước ≈ -19)
  "merge_gap": 0.2,                         # đoạn cách nhau ≤ giá trị này thì nối liền (không cắt)
  "pieces": [ {"sw": 0, "text": "…lời Hiếu nói…"}, ... ]   # chỉ liệt kê đoạn GIỮ LẠI (bỏ đoạn vấp / nói lại)
}
Đoạn có thêm "range": [a, b] (giây trên video gốc) thì cắt đúng khoảng đó, KHÔNG đệm: dùng để vá một chữ nói nhầm
bằng cách ghép đoạn đúng từ chỗ khác (chọn điểm cắt ở chỗ lặng, tin vào mức dB quanh điểm cắt), "sw" khi đó chỉ để lấy từ whisper.

Các đoạn kề nhau (đệm chồng lên nhau) được gộp thành một lần cắt liền mạch để không lặp tiếng.
offs.json: [[i, offset, duration, [a, b]], ...] — mốc nối đoạn trên timeline đã cắt (zoom đổi khung tại các mốc này).
"""
import json
import subprocess
import sys
from pathlib import Path

VF = "scale=1080:1920:flags=lanczos:out_range=tv,format=yuv420p,fps=30"
VENC = ["-c:v", "libx264", "-crf", "17", "-g", "30", "-keyint_min", "30",
        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709"]


def run(cmd):
    subprocess.run(cmd, check=True)


def probe_dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]).decode())


def main():
    vd = Path(sys.argv[1])
    plan = json.loads((vd / "plan.json").read_text())
    work = Path(plan["work"])
    subs = json.loads((work / "subs.json").read_text())
    pre, post = plan.get("pre", 0.15), plan.get("post", 0.30)

    # 1) khoảng giữ (có đệm), gộp nếu chồng/kề nhau
    ranges = []
    for pc in plan["pieces"]:
        _, a, b = subs[pc["sw"]]
        if "range" in pc:
            a2, b2 = pc["range"]
        else:
            a2, b2 = max(0.0, a - pre), b + post
        if ranges and ranges[-1][0] <= a2 <= ranges[-1][1] + plan.get("merge_gap", 0.05):
            ranges[-1][1] = max(ranges[-1][1], b2)
            ranges[-1][2].append(pc["sw"])
        else:
            ranges.append([a2, b2, [pc["sw"]]])
    pcs = work / "pcs"
    pcs.mkdir(exist_ok=True)
    kf = pcs / "keys.json"
    old_keys = json.loads(kf.read_text()) if kf.exists() else {}
    new_keys = {}

    # 2) cắt từng đoạn (encode lại, chính xác từng khung), rồi nối; đoạn không đổi so với lần trước thì dùng lại file cũ
    lst = []
    for i, (a, b, _) in enumerate(ranges):
        d = b - a
        out = pcs / f"p{i:02d}.mp4"
        key = f"{plan['src']}|{a:.3f}|{d:.3f}"
        new_keys[out.name] = key
        if not (out.exists() and old_keys.get(out.name) == key):
            run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.3f}", "-i", plan["src"], "-t", f"{d:.3f}", "-vf", VF, *VENC,
                 "-af", f"afade=t=in:d=0.02,afade=t=out:st={max(d - 0.03, 0):.3f}:d=0.03",
                 "-c:a", "aac", "-b:a", "192k", "-ar", "48000", str(out)])
        lst.append(f"file '{out.name}'")
    for f in pcs.glob("p*.mp4"):
        if f.name not in new_keys:
            f.unlink()
    kf.write_text(json.dumps(new_keys))
    (pcs / "list.txt").write_text("\n".join(lst) + "\n")
    cat = work / "concat.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(pcs / "list.txt"), "-c", "copy", str(cat)])

    # 3) offs.json
    off, offs = 0.0, []
    for i, (a, b, _) in enumerate(ranges):
        dd = probe_dur(pcs / f"p{i:02d}.mp4")
        offs.append([i, round(off, 3), round(dd, 3), [round(a, 3), round(b, 3)]])
        off += dd
    (vd / "offs.json").write_text(json.dumps(offs))

    # 4) chuẩn hoá tiếng (2 lượt loudnorm trên cả đoạn nối) rồi ghép lại với hình (copy)
    tgt = plan.get("gain_target", -19.0)
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(cat), "-vn",
                        "-af", f"highpass=f=70,loudnorm=I={tgt}:TP=-1.5:LRA=9:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    blob = r.stderr[r.stderr.rfind("{"):r.stderr.rfind("}") + 1]
    m = json.loads(blob)
    af = (f"highpass=f=70,loudnorm=I={tgt}:TP=-1.5:LRA=9:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    pub = vd / "public"
    pub.mkdir(exist_ok=True)
    run(["ffmpeg", "-v", "error", "-y", "-i", str(cat), "-map", "0:v", "-map", "0:a", "-c:v", "copy", "-af", af,
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000", str(pub / "input-video.mp4")])
    total = probe_dur(pub / "input-video.mp4")
    print(f"{len(ranges)} đoạn, dài {off:.2f}s (file {total:.2f}s); chuẩn hoá giọng {m['input_i']} → {tgt} LUFS")
    for i, (a, b, sws) in enumerate(ranges):
        print(f"  p{i:02d} nguồn {a:7.2f}–{b:7.2f}  → timeline {offs[i][1]:7.2f}  (sw {sws})")


if __name__ == "__main__":
    main()
