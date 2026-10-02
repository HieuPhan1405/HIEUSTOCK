#!/usr/bin/env python3
"""Ảnh bìa video: TikTok/Reels 1080x1920 (9:16) và Facebook feed 1080x1350 (4:5).
Mỗi bìa = 1 khung hình từ video + tiêu đề lớn. Chữ nằm trong vùng an toàn TikTok (y 170–1430, x 60–940)
và trong khung lưới profile 3:4 (y 240–1680). Chạy: python3 make_covers.py && node shoot.mjs"""
from pathlib import Path

R = Path(__file__).parent
FONTS = "".join(
    f"@font-face{{font-family:'{f}';src:url('fonts/{s}-{sub}-{w}-{st}.woff2') format('woff2');font-weight:{w};font-style:{st};unicode-range:{r}}}"
    for f, s, w, st in [("Be Vietnam Pro", "be-vietnam-pro", 800, "normal"), ("Be Vietnam Pro", "be-vietnam-pro", 700, "normal"), ("Playfair Display", "playfair-display", 700, "italic")]
    for sub, r in [("latin", "U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20AC,U+2212"), ("latin-ext", "U+0100-02BA,U+1E00-1EFF"), ("vietnamese", "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0309,U+0323,U+1EA0-1EF9,U+20AB")])

COVERS = {
    "stb": dict(photo="img/stb.jpg", l1="STB", c1="#F5C542", l2="2 PHIÊN ĐỎ", c2="#FF5A5A", l3="Điều đáng chú ý nằm ở đâu?"),
    "msn": dict(photo="img/msn.jpg", l1="MSN", c1="#F5C542", l2="TRÊN 110.000đ", c2="#22C55E", l3="2 tổ chức bất đồng ở đâu?"),
}
# (rộng, cao, offset y của ảnh, cỡ chữ l1, l2, l3, top của khối chữ)
SIZES = {
    "tiktok_1080x1920": (1080, 1920, 150, 190, 80, 56, 190),
    "facebook_1080x1350": (1080, 1350, -90, 150, 72, 54, 56),
}
for key, c in COVERS.items():
    for name, (w, h, dy, s1, s2, s3, top) in SIZES.items():
        html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{FONTS}
*{{box-sizing:border-box;margin:0}}html,body{{width:{w}px;height:{h}px;overflow:hidden;background:#000}}
.bg{{position:absolute;inset:-40px;background:url('{c['photo']}') center/cover;filter:blur(28px) brightness(.55)}}
.ph{{position:absolute;left:0;top:{dy}px;width:1080px;height:1920px;background:url('{c['photo']}') center/cover}}
.sh{{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.82) 0%,rgba(0,0,0,.55) 38%,rgba(0,0,0,0) 62%),linear-gradient(to top,rgba(0,0,0,.45),rgba(0,0,0,0) 22%)}}
.t{{position:absolute;left:60px;width:960px;top:{top}px;text-align:center;font-family:'Be Vietnam Pro';font-weight:800;line-height:1}}
.tag{{display:inline-block;font:800 30px 'Be Vietnam Pro';letter-spacing:5px;color:#111;background:#F5C542;padding:8px 24px;border-radius:12px;margin-bottom:22px}}
.l1{{font-size:{s1}px;color:{c['c1']};text-shadow:0 6px 0 rgba(0,0,0,.5),0 16px 40px rgba(0,0,0,.6)}}
.l2{{display:inline-block;font-size:{s2}px;color:{c['c2']};background:rgba(10,10,10,.82);padding:0 30px 8px;border-radius:24px;margin-top:6px}}
.l3{{margin-top:26px;font:italic 700 {s3}px 'Playfair Display';color:#FAFAFA;text-shadow:0 4px 22px rgba(0,0,0,.8);line-height:1.1}}
</style></head><body><div class="bg"></div><div class="ph"></div><div class="sh"></div>
<div class="t"><div class="tag">CHỨNG KHOÁN CÙNG MÂY</div><div class="l1">{c['l1']}</div><div class="l2">{c['l2']}</div><div class="l3">{c['l3']}</div></div></body></html>"""
        (R / f"cover_{key}_{name}.html").write_text(html)
print("ok")
