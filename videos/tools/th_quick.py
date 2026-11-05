#!/usr/bin/env python3
"""Dựng nhanh talking head 9:16 (đơn giản, ít tốn tài nguyên):
  cut    <src> <out.mp4>              cắt khoảng lặng > 0,45 s (ngưỡng −38 dB), đổi khung zoom 1,0 ↔ 1,1 tại mỗi điểm nối,
                                       1080×1920 30 fps, chuẩn hoá giọng −16 LUFS (2 lượt)
  caption <out_words.json> <video> <ra.mp4>   đốt phụ đề 2–3 chữ (Inter Bold, ngang ngực, trong vùng an toàn TikTok)
words.json: [{"w":"chữ","s":giây,"e":giây}] trên timeline video đã cắt (lấy từ faster-whisper, xem transcribe)
  transcribe <video> <words.json>      faster-whisper medium (CPU int8) → words.json
"""
import json
import re
import subprocess
import sys
from pathlib import Path

VF = "scale=1080:1920:flags=lanczos:out_range=tv,format=yuv420p,fps=30"
VENC = ["-c:v", "libx264", "-crf", "17", "-g", "30", "-keyint_min", "30", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709"]


def run(c):
    subprocess.run(c, check=True)


def speech_ranges(src, th=-38, d=0.45, pre=0.12, post=0.22):
    wav = Path(src).with_suffix(".tmp.wav")
    run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", "16000", str(wav)])
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(wav), "-af", f"silencedetect=noise={th}dB:d={d}", "-f", "null", "-"], capture_output=True, text=True).stderr
    wav.unlink()
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src]).decode())
    sil = list(zip([float(x) for x in re.findall(r"silence_start: ([\d.]+)", r)], [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r)]))
    rng, t = [], 0.0
    for a, b in sil:
        if a - t > 0.2:
            rng.append([max(0, t - pre), min(a + post, dur)])
        t = b
    if dur - t > 0.2:
        rng.append([max(0, t - pre), dur])
    # gộp đoạn chồng nhau
    out = []
    for a, b in rng:
        if out and a <= out[-1][1] + 0.05:
            out[-1][1] = max(out[-1][1], b)
        else:
            out.append([a, b])
    return out


def cut(src, out):
    work = Path(out).with_suffix(".pieces")
    work.mkdir(exist_ok=True)
    rng = speech_ranges(src)
    lst = []
    for i, (a, b) in enumerate(rng):
        vf = VF if i % 2 == 0 else VF.replace("scale=1080:1920", "scale=1188:2112").replace("format=yuv420p", "crop=1080:1920:54:60,format=yuv420p")
        p = work / f"p{i:03d}.mp4"
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.3f}", "-i", src, "-t", f"{b - a:.3f}", "-vf", vf, *VENC,
             "-af", f"afade=t=in:d=0.02,afade=t=out:st={max(b - a - 0.03, 0):.3f}:d=0.03", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", str(p)])
        lst.append(f"file '{p.name}'")
    (work / "list.txt").write_text("\n".join(lst) + "\n")
    cat = work / "concat.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(work / "list.txt"), "-c", "copy", str(cat)])
    tgt = -16.0
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(cat), "-vn", "-af", f"highpass=f=70,loudnorm=I={tgt}:TP=-1.5:LRA=9:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    m = json.loads(r.stderr[r.stderr.rfind("{"):r.stderr.rfind("}") + 1])
    af = (f"highpass=f=70,loudnorm=I={tgt}:TP=-1.5:LRA=9:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    run(["ffmpeg", "-v", "error", "-y", "-i", str(cat), "-map", "0:v", "-map", "0:a", "-c:v", "copy", "-af", af, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", out])
    tot = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]).decode())
    print(f"{len(rng)} đoạn, {tot:.1f}s (gốc {rng[-1][1]:.0f}s)")


def transcribe(video, words_json):
    from faster_whisper import WhisperModel
    m = WhisperModel("medium", device="cpu", compute_type="int8")
    segs, _ = m.transcribe(video, language="vi", word_timestamps=True, vad_filter=True,
                           initial_prompt="VN-Index, cổ phiếu, chứng khoán, ngân hàng, lãi suất, khối ngoại, nhà đầu tư.")
    words = []
    for s in segs:
        for w in s.words:
            t = w.word.strip()
            if t:
                words.append({"w": t, "s": round(w.start, 3), "e": round(w.end, 3)})
    Path(words_json).write_text(json.dumps(words, ensure_ascii=False))
    print(len(words), "từ")


def ass_time(t):
    h, rem = divmod(t, 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def caption(words_json, video, out):
    words = json.loads(Path(words_json).read_text())
    chunks, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        gap = (words[i + 1]["s"] - w["e"]) if i + 1 < len(words) else 9
        if re.search(r"[.,?!;:]$", w["w"]) or gap > 0.35 or len(cur) >= 3 or sum(len(x["w"]) + 1 for x in cur) > 20:
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    ev = []
    for i, ch in enumerate(chunks):
        s, e = ch[0]["s"], ch[-1]["e"] + 0.1
        if i + 1 < len(chunks):
            e = min(max(e, s + 0.4), chunks[i + 1][0]["s"] - 0.02)
        txt = " ".join(re.sub(r"[.,?!;:]+$", "", x["w"]) for x in ch)
        ev.append(f"Dialogue: 0,{ass_time(s)},{ass_time(max(e, s + 0.3))},C,,0,0,0,,{txt}")
    hdr = ("[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 2\n\n[V4+ Styles]\n"
           "Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\n"
           "Style: C,Inter,72,&H00FAFAFA,&H00FAFAFA,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,5,2,2,100,100,500,1\n\n"
           "[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n")
    ass = Path(out).with_suffix(".ass")
    ass.write_text(hdr + "\n".join(ev) + "\n")
    run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf", f"ass={ass}:fontsdir=/usr/share/fonts/opentype/inter", "-c:v", "libx264", "-crf", "18", "-preset", "medium",
         "-pix_fmt", "yuv420p", "-g", "30", "-c:a", "copy", out])
    print(len(chunks), "cụm phụ đề")


if __name__ == "__main__":
    {"cut": lambda a: cut(*a[:2]), "transcribe": lambda a: transcribe(*a[:2]), "caption": lambda a: caption(*a[:3])}[sys.argv[1]](sys.argv[2:])
