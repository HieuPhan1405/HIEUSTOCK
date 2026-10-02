#!/usr/bin/env python3
"""Whisper dồn cục mốc từ ở đoạn "Sáu tháng đầu năm … 48.000 tỷ" (41–49s): ghi đè bằng mốc chạy lại từ file cắt 40.9s.
Chạy sau align.py: python3 fix_clump.py"""
import json
from pathlib import Path

R = Path(__file__).parent
tok = json.loads((R / "tokens.json").read_text())
fix = [("Sáu", 41.0), ("tháng", 41.3), ("đầu", 41.6), ("năm,", 41.85), ("Sacombank", 42.1), ("lãi", 42.5), ("sau", 42.6), ("thuế", 42.8), ("khoảng", 43.0),
       ("2.931", 43.7), ("tỷ,", 44.6), ("giảm", 45.0), ("49,4%,", 45.5), ("nợ", 46.7), ("xấu", 47.3), ("lên", 47.9), ("gần", 48.1), ("48.000", 48.3), ("tỷ,", 49.0)]
i0 = next(i for i, t in enumerate(tok) if t["w"] == "Sáu")
for k, (w, s) in enumerate(fix):
    t = tok[i0 + k]
    assert t["w"] == w, (t["w"], w)
    t["s"], t["e"] = s, round(s + 0.25, 3)
(R / "tokens.json").write_text(json.dumps(tok, ensure_ascii=False, indent=0))
print("ok")
