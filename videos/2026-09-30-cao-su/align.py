#!/usr/bin/env python3
"""Gióng lời kịch bản (script.txt) với timestamp từ whisper (mỗi khúc ~10s một file cw??.json)
→ tokens.json: [{w, s, e}] theo mốc thời gian của input-video.mp4 (đã cắt khoảng lặng).
Chạy: python3 align.py <thư mục làm việc chứa chunks.json, cw??.json, script.txt>"""
import difflib
import json
import re
import sys
import unicodedata
from pathlib import Path

WORK = Path(sys.argv[1])


def norm(w):
    w = unicodedata.normalize("NFD", w.lower().replace("đ", "d"))
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", w)


# whisper: các từ + mốc tuyệt đối. Whisper chạy TỪNG KHÚC ~10s cắt ở chỗ lặng (chunks.json + cw??.json):
# chạy cả đoạn dài thì timestamp dồn cục/lệch vài giây, khúc ngắn thì chính xác.
wh = []
cuts = json.loads((WORK / "chunks.json").read_text())
for i in range(len(cuts) - 1):
    off = cuts[i]
    for s in json.loads((WORK / f"cw{i:02d}.json").read_text())["transcription"]:
        t = s["text"].strip()
        if not t or t.startswith("["):
            continue
        for part in t.split():
            wh.append((norm(part), off + s["offsets"]["from"] / 1000, off + s["offsets"]["to"] / 1000))
wh = [w for w in wh if w[0]]

toks = (WORK / "script.txt").read_text().split()
sn = [norm(t) for t in toks]
wn = [w[0] for w in wh]
res = [None] * len(toks)
for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, sn, wn, autojunk=False).get_opcodes():
    if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
        for k in range(i2 - i1):
            res[i1 + k] = (wh[j1 + k][1], wh[j1 + k][2])
    elif tag == "replace" and j2 > j1:
        n, m = i2 - i1, j2 - j1
        for k in range(n):
            a = wh[j1 + int(k * m / n)]
            res[i1 + k] = (a[1], a[2])
# nội suy các từ còn trống
known = [i for i, r in enumerate(res) if r]
for i, r in enumerate(res):
    if r:
        continue
    lo = max([k for k in known if k < i], default=None)
    hi = min([k for k in known if k > i], default=None)
    if lo is None:
        res[i] = (res[hi][0] - 0.3 * (hi - i), res[hi][0] - 0.3 * (hi - i - 1))
    elif hi is None:
        res[i] = (res[lo][1] + 0.3 * (i - lo - 1), res[lo][1] + 0.3 * (i - lo))
    else:
        a, b = res[lo][1], res[hi][0]
        n = hi - lo
        res[i] = (a + (b - a) * (i - lo - 1) / (n - 1) if n > 1 else a, a + (b - a) * (i - lo) / (n - 1) if n > 1 else b)
# đảm bảo tăng dần
out = []
last = 0.0
for t, (s, e) in zip(toks, res):
    s = max(s, last)
    e = max(e, s + 0.05)
    out.append({"w": t, "s": round(s, 3), "e": round(e, 3)})
    last = s
(WORK / "tokens.json").write_text(json.dumps(out, ensure_ascii=False, indent=0))
match = sum(1 for k in known)
print(f"{len(toks)} từ kịch bản, khớp trực tiếp {match} ({100*match//len(toks)}%)")
