#!/usr/bin/env python3
"""Sau khi bỏ lần nói vấp câu "Nhưng khoảng 58%…" (cắt lại p07, xem README/work log):
dịch các mốc từ ≥ 107.833s (đầu p08 cũ) lùi DELTA giây, và lấy mốc "Nhưng khoảng 58% … quý đó"
từ lần nói lại (đầu p08). Chạy sau align.py, một lần: python3 fix_retake.py"""
import json
import re
import unicodedata
from pathlib import Path

R = Path(__file__).parent
OLD_P8, NEW_P8 = 107.833, 99.867
D = OLD_P8 - NEW_P8
tok = json.loads((R / "tokens.json").read_text())


def n(w):
    w = unicodedata.normalize("NFD", w.lower().replace("đ", "d"))
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in w if unicodedata.category(c) != "Mn"))


i0 = next(i for i in range(len(tok)) if [n(x["w"]) for x in tok[i:i + 3]] == ["nhung", "khoang", "58"])
# lần nói lại (mốc cũ, từ chunk cw10)
second = {"Nhưng": 107.9, "khoảng": 108.28, "58%": 108.74, "lợi": 109.29, "nhuận": 109.48, "trước": 109.85, "thuế": 110.0, "quý": 110.23, "đó": 110.5}
for k in range(i0, i0 + 9):
    w = re.sub(r"[.,:?!]", "", tok[k]["w"])
    tok[k]["s"] = round(second[w] - D, 3)
    tok[k]["e"] = round(second[w] - D + 0.2, 3)
for t in tok[i0 + 9:]:
    if t["s"] >= OLD_P8 - 0.01:
        t["s"] = round(t["s"] - D, 3)
        t["e"] = round(t["e"] - D, 3)
(R / "tokens.json").write_text(json.dumps(tok, ensure_ascii=False, indent=0))
print("đã dịch", D, "giây")
