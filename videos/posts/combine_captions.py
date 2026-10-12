#!/usr/bin/env python3
"""Gom lời đăng (mục "1. Nội dung đăng") của mọi bai-*/bai.md trong một ngày thành noi-dung-dang.md để Hiếu sao chép.
Chạy: python3 videos/posts/combine_captions.py videos/posts/<YYYY-MM-DD>"""
import re
import sys
from pathlib import Path

d = Path(sys.argv[1])
out = [f"# Nội dung đăng Facebook ngày {d.name} (sao chép nguyên khối; ảnh nằm trong thư mục từng bài)\n",
       "Bản nháp, công ty duyệt trước khi đăng. Chỗ cần kiểm trước khi đăng ghi trong `bai.md` của từng bài và `README.md` của ngày.\n"]
for f in sorted(d.glob("bai-*/bai.md"), key=lambda f: int(re.match(r"bai-(\d+)", f.parent.name).group(1))):
    t = f.read_text(encoding="utf-8")
    title = re.search(r"^# (.+)$", t, re.M).group(1)
    warn = "\n".join(l for l in t.splitlines() if l.startswith("**⚠"))
    m = re.search(r"## 1\. Nội dung đăng\n(.*?)\n## 2\.", t, re.S)
    body = m.group(1).strip() if m else "(thiếu mục 1. Nội dung đăng)"
    out.append(f"\n---\n\n## {title}\n\nẢnh: `{f.parent.name}/" + ("post.png`" if (f.parent / "post.png").exists() else "post_1.png, post_2.png, post_3.png`") + "\n")
    if warn:
        out.append(f"\n{warn}\n")
    out.append(f"\n{body}\n")
(d / "noi-dung-dang.md").write_text("".join(out), encoding="utf-8")
print(d / "noi-dung-dang.md", len(out) // 1, "khối")
