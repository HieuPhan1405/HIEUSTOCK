#!/usr/bin/env python3
"""Whisper dồn cục mốc từ ở đoạn cuối "vonfram là nền mới hay là đỉnh chu kỳ. Giá mục tiêu chỉ trả lời … giả định điều gì" (144–154s):
ghi đè bằng mốc chạy lại từ file cắt riêng. Chạy sau align.py: python3 fix_clump.py"""
import json
from pathlib import Path

R = Path(__file__).parent
tok = json.loads((R / "tokens.json").read_text())
times = [144.7, 145.2, 145.3, 145.5, 145.7, 146.0, 146.1, 146.3, 146.5,  # vonfram là nền mới hay là đỉnh chu kỳ.
         147.0, 147.3, 147.6, 148.0, 148.7, 149.0, 149.4, 149.8, 150.2, 150.8,  # Giá mục tiêu chỉ trả lời câu hỏi bao nhiêu.
         151.0, 151.5, 151.6, 151.9, 152.3, 152.6, 152.8, 153.0, 153.2, 153.5, 153.8]  # Còn điều đáng theo dõi là họ giả định điều gì.
i_bd = max(i for i, t in enumerate(tok) if t["w"] == "bất" and t["s"] > 100)
i0 = next(i for i in range(i_bd, len(tok)) if tok[i]["w"] == "vonfram")
words = [t["w"] for t in tok[i0:i0 + len(times)]]
assert words[0] == "vonfram" and words[-1] == "gì.", words
for k, s in enumerate(times):
    tok[i0 + k]["s"], tok[i0 + k]["e"] = s, round(s + 0.25, 3)
(R / "tokens.json").write_text(json.dumps(tok, ensure_ascii=False, indent=0))
print("ok")
