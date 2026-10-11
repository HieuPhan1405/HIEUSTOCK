#!/usr/bin/env python3
"""Ảnh bài đăng Facebook (carousel 1080x1350, tỉ lệ 4:5) làm hoàn toàn từ số liệu, không cần ảnh người.
Chạy: python3 make_posts.py && PREFIX=post node shoot.mjs
Bảng màu theo nhận diện kênh (nền tối, vàng #F5C542); đường VN-Index dùng xanh #5BA8F5 để tách khỏi vàng
(ΔE ≥ 28 trong mô phỏng mù màu; vàng #F5C542 nằm ngoài dải sáng của validator vì là màu thương hiệu bắt buộc)."""
from pathlib import Path

R = Path(__file__).parent
FONTS = "".join(
    f"@font-face{{font-family:'{f}';src:url('fonts/{s}-{sub}-{w}-{st}.woff2') format('woff2');font-weight:{w};font-style:{st};unicode-range:{r}}}"
    for f, s, w, st in [("Be Vietnam Pro", "be-vietnam-pro", 800, "normal"), ("Be Vietnam Pro", "be-vietnam-pro", 700, "normal"), ("Be Vietnam Pro", "be-vietnam-pro", 400, "normal"), ("Playfair Display", "playfair-display", 700, "italic")]
    for sub, r in [("latin", "U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20AC,U+2212"), ("latin-ext", "U+0100-02BA,U+1E00-1EFF"), ("vietnamese", "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0309,U+0323,U+1EA0-1EF9,U+20AB")])

GOLD, RED, GREEN, BLUE = "#F5C542", "#FF5A5A", "#22C55E", "#5BA8F5"
INK, MUTED, BG = "#FAFAFA", "#9AA4B2", "#0B0F17"
DISC = "Nội dung tổng hợp thông tin, không phải khuyến nghị đầu tư. Giá đến hết phiên 9/10/2026."

CSS = f"""{FONTS}
*{{box-sizing:border-box;margin:0}}html,body{{width:1080px;height:1350px;overflow:hidden}}
body{{background:radial-gradient(1200px 700px at 80% -10%,#1A2233 0%,{BG} 60%);font-family:'Be Vietnam Pro';color:{INK};position:relative}}
.tag{{position:absolute;left:60px;top:56px;font:800 28px 'Be Vietnam Pro';letter-spacing:5px;color:#111;background:{GOLD};padding:8px 22px;border-radius:12px}}
.stamp{{position:absolute;right:60px;top:64px;font:700 24px 'Be Vietnam Pro';color:{MUTED};letter-spacing:1px}}
.foot{{position:absolute;left:60px;right:60px;bottom:44px;font:400 22px/1.4 'Be Vietnam Pro';color:{MUTED}}}
.foot b{{color:{INK};font-weight:700}}
.card{{position:absolute;left:60px;width:960px;background:rgba(255,255,255,.045);border:2px solid rgba(255,255,255,.09);border-radius:28px}}
.sw{{position:absolute;right:60px;bottom:124px;font:800 30px 'Be Vietnam Pro';color:{GOLD}}}
"""

# ---------- số liệu (DNSE, đóng cửa 22/9 → 9/10/2026) ----------
fpt = [66.6, 66.1, 65.3, 64.7, 63.7, 63.2, 63.0, 62.7, 62.1, 61.9, 60.4, 59.7, 59.7, 57.9]
vni = [1816.93, 1801.65, 1775.09, 1785.11, 1780.68, 1777.73, 1768.62, 1749.30, 1737.71, 1753.20, 1759.08, 1753.39, 1738.97, 1735.09]
nf = [v / fpt[0] * 100 for v in fpt]
nv = [v / vni[0] * 100 for v in vni]
def vi(x, d=1):
    return f"{x:.{d}f}".replace(".", ",")

def slide1():
    W, H, ml, mr, mt, mb = 900, 480, 56, 190, 24, 46
    pw, ph = W - ml - mr, H - mt - mb
    lo, hi = 84.0, 101.0
    X = lambda i: ml + i / 13 * pw
    Y = lambda v: mt + (hi - v) / (hi - lo) * ph
    pts = lambda s: " ".join(f"{X(i):.1f},{Y(v):.1f}" for i, v in enumerate(s))
    DASH = 'stroke-dasharray="4 6"'
    grid = "".join(
        f'<line x1="{ml}" x2="{ml+pw}" y1="{Y(g):.1f}" y2="{Y(g):.1f}" stroke="{MUTED if g == 100 else "#2A3345"}" stroke-width="{2 if g == 100 else 1}" {"" if g == 100 else DASH}/>'
        f'<text x="{ml-12}" y="{Y(g)+7:.1f}" text-anchor="end" font-size="22" fill="{MUTED}">{g}</text>'
        for g in (85, 90, 95, 100))
    xt = "".join(f'<text x="{X(i):.1f}" y="{H-12}" text-anchor="{a}" font-size="22" fill="{MUTED}">{t}</text>' for i, t, a in [(0, "22/9", "start"), (8, "2/10", "middle"), (13, "9/10", "end")])
    band = f'<rect x="{X(0):.1f}" y="{mt}" width="{X(11)-X(0):.1f}" height="{ph}" fill="{RED}" fill-opacity=".09"/><text x="{(X(0)+X(11))/2:.1f}" y="{Y(85)-14:.1f}" text-anchor="middle" font-size="22" font-weight="700" fill="{INK}">▼ 11 phiên giảm liên tiếp (23/9–7/10)</text>'
    ends = ""
    for s, col, name, dy in [(nf, GOLD, "FPT", 0), (nv, BLUE, "VN-Index", 0)]:
        x, y = X(13), Y(s[-1])
        ends += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="9" fill="{col}" stroke="{BG}" stroke-width="3"/>'
        ends += f'<text x="{x+22:.1f}" y="{y-4:.1f}" font-size="28" font-weight="800" fill="{INK}">{vi(s[-1])}</text><text x="{x+22:.1f}" y="{y+26:.1f}" font-size="24" font-weight="700" fill="{INK}">{"−"+vi(100-s[-1])}%</text>'
    svg = f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="font-family:\'Be Vietnam Pro\'">{band}{grid}<polyline points="{pts(nv)}" fill="none" stroke="{BLUE}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><polyline points="{pts(nf)}" fill="none" stroke="{GOLD}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>{ends}{xt}</svg>'
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}
.t{{position:absolute;left:60px;width:960px;top:122px;line-height:1.02;font-weight:800}}
.pre{{font:700 25px 'Be Vietnam Pro';letter-spacing:2px;color:{MUTED};margin-bottom:18px}}
.l1{{font-size:80px;color:{GOLD};text-shadow:0 6px 0 rgba(0,0,0,.45);white-space:nowrap}}
.l2{{display:inline-block;font-size:70px;color:{RED};background:rgba(8,10,14,.85);padding:2px 26px 10px;border-radius:22px;margin-top:10px;border:2px solid rgba(255,90,90,.35)}}
.l3{{margin-top:22px;font:italic 700 44px/1.15 'Playfair Display';color:{INK}}}
.leg{{position:absolute;left:30px;top:20px;display:flex;gap:34px;font:700 26px 'Be Vietnam Pro'}}
.leg i{{display:inline-block;width:38px;height:6px;border-radius:3px;margin-right:12px;vertical-align:middle}}
.cap{{position:absolute;left:30px;top:66px;font:400 24px 'Be Vietnam Pro';color:{MUTED}}}
</style></head><body>
<div class="tag">PHAN HIẾU STOCK</div><div class="stamp">FPT · HẾT PHIÊN 9/10</div>
<div class="t"><div class="pre">LÃI TRƯỚC THUẾ BÌNH QUÂN, 8 THÁNG ĐẦU NĂM</div><div class="l1">HƠN 31 TỶ MỖI NGÀY</div><div class="l2">GIẢM 11 PHIÊN LIỀN</div><div class="l3">Báo chí nói gì, và con số nào đáng để so sánh?</div></div>
<div class="card" style="top:500px;height:680px">
 <div class="leg"><span><i style="background:{GOLD}"></i>FPT</span><span><i style="background:{BLUE}"></i>VN-Index</span></div>
 <div class="cap">Giá đóng cửa, quy về 100 tại ngày 22/9</div>
 <div style="position:absolute;left:30px;top:104px">{svg}</div>
 <div style="position:absolute;left:30px;bottom:22px;right:30px;font:700 27px/1.3 'Be Vietnam Pro';color:{INK}">FPT giảm nhanh hơn thị trường chung khoảng 2,9 lần.</div>
</div>
<div class="sw">Vuốt → 3 điều</div>
<div class="foot"><b>Nguồn:</b> DNSE (giá, VN-Index); lãi trước thuế 8 tháng ÷ 243 ngày (CafeF 21/9). {DISC}</div>
</body></html>"""

def slide2():
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}
.h{{position:absolute;left:60px;top:128px;width:960px;font-weight:800;line-height:1.05}}
.h small{{display:block;font:800 30px 'Be Vietnam Pro';letter-spacing:4px;color:{GOLD};margin-bottom:12px}}
.h div{{font-size:60px}}
.stack{{position:absolute;left:60px;top:352px;width:960px;display:flex;flex-direction:column;gap:20px}}
.stack .card{{position:static;padding:30px 40px}}
.lab{{font:800 26px 'Be Vietnam Pro';letter-spacing:4px;color:{GOLD}}}
.big{{font:800 104px/1 'Be Vietnam Pro';color:{INK};margin:10px 0 8px}}
.big span{{font-size:48px;color:{MUTED}}}
.p{{font:400 31px/1.35 'Be Vietnam Pro';color:{INK}}}
.chip{{display:inline-block;margin-top:14px;font:700 23px 'Be Vietnam Pro';color:{INK};background:rgba(255,255,255,.1);border-radius:999px;padding:6px 20px}}
.note{{border:3px solid {GOLD};border-radius:22px;padding:20px 28px;font:700 31px/1.3 'Be Vietnam Pro';color:{INK};background:rgba(245,197,66,.08)}}
</style></head><body>
<div class="tag">PHAN HIẾU STOCK</div><div class="stamp">ĐIỀU 2 / 3</div>
<div class="h"><small>HAI SỨC ÉP THEO BÁO CHÍ</small><div>Vì sao giá giảm?<br>Mỗi báo nói một vế.</div></div>
<div class="stack">
<div class="card">
 <div class="lab">KHỐI NGOẠI</div>
 <div class="big">~14.700<span> tỷ</span></div>
 <div class="p">bán ròng cổ phiếu FPT từ đầu năm (~180 triệu cp).</div>
 <span class="chip">CafeF · 8/10</span>
</div>
<div class="card">
 <div class="lab">ÁP LỰC TỪ AI</div>
 <div class="big" style="font-size:74px;margin:16px 0 10px">Làn sóng AI</div>
 <div class="p">được nêu là thách thức lớn với tập đoàn kiếm tiền chủ yếu từ công nghệ. Mặt còn lại: 2 cụm AI Factory (Việt Nam, Nhật Bản) có lãi từ quý 2.</div>
 <span class="chip">Vietnamnet · 9/10 &nbsp;|&nbsp; Vietstock · 17/7</span>
</div>
<div class="note">Đây là nhận định của báo. Chưa ai đo được từng yếu tố góp bao nhiêu vào cú giảm.</div>
</div>
<div class="foot" style="bottom:32px"><b>Nguồn:</b> CafeF 8/10; Vietnamnet 9/10; Vietstock 17/7. {DISC}</div>
</body></html>"""

def slide3():
    q = ["Q3/24", "Q4/24", "Q1/25", "Q2/25", "Q3/25", "Q4/25", "Q1/26", "Q2/26"]
    g = [20.1, 21.6, 20.9, 20.4, 16.6, 19.8, 14.4, 13.7]
    W, H, ml, mt, mb = 900, 262, 56, 36, 44
    pw, ph = W - ml - 10, H - mt - mb
    mx = 25.0
    bw, gap = 62, (pw - 8 * 62) / 7
    bars, lbl = "", ""
    for i, (a, v) in enumerate(zip(q, g)):
        x = ml + i * (bw + gap)
        h = v / mx * ph
        y = mt + ph - h
        col = GOLD if i >= 6 else "#4B5870"
        bars += f'<path d="M{x:.1f},{mt+ph} V{y+4:.1f} a4,4 0 0 1 4,-4 h{bw-8} a4,4 0 0 1 4,4 V{mt+ph} Z" fill="{col}"/>'
        if i in (3, 6, 7):
            bars += f'<text x="{x+bw/2:.1f}" y="{y-10:.1f}" text-anchor="middle" font-size="26" font-weight="800" fill="{INK}">{vi(v)}</text>'
        lbl += f'<text x="{x+bw/2:.1f}" y="{H-14}" text-anchor="middle" font-size="21" fill="{MUTED}">{a}</text>'
    grid = "".join(f'<line x1="{ml}" x2="{W-10}" y1="{mt+ph-gv/mx*ph:.1f}" y2="{mt+ph-gv/mx*ph:.1f}" stroke="#2A3345" stroke-width="1" stroke-dasharray="4 6"/><text x="{ml-12}" y="{mt+ph-gv/mx*ph+7:.1f}" text-anchor="end" font-size="22" fill="{MUTED}">{gv}</text>' for gv in (10, 20))
    svg = f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="font-family:\'Be Vietnam Pro\'">{grid}<line x1="{ml}" x2="{W-10}" y1="{mt+ph}" y2="{mt+ph}" stroke="{MUTED}" stroke-width="2"/>{bars}{lbl}</svg>'
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}
.h{{position:absolute;left:60px;top:124px;width:960px;font-weight:800;line-height:1.05}}
.h small{{display:block;font:800 30px 'Be Vietnam Pro';letter-spacing:4px;color:{GOLD};margin-bottom:12px}}
.h div{{font-size:56px}}
.tile{{position:absolute;top:340px;width:462px;height:290px;padding:26px 30px}}
.tile .lab{{font:700 25px/1.25 'Be Vietnam Pro';color:{INK}}}
.tile .v{{font:800 88px/1 'Be Vietnam Pro';margin-top:16px;color:{INK};white-space:nowrap}}
.tile .v i{{font-style:normal;font-size:44px;vertical-align:10px;margin-right:10px}}
.tile .s{{font:400 24px/1.3 'Be Vietnam Pro';color:{MUTED};margin-top:10px}}
.why{{position:absolute;left:60px;top:654px;width:960px;font:700 30px/1.35 'Be Vietnam Pro';color:{INK}}}
.why b{{color:{GOLD}}}
.ct{{position:absolute;left:30px;top:20px;font:700 27px/1.3 'Be Vietnam Pro';color:{INK}}}
.ct span{{display:block;font:400 22px 'Be Vietnam Pro';color:{MUTED}}}
</style></head><body>
<div class="tag">PHAN HIẾU STOCK</div><div class="stamp">ĐIỀU 3 / 3</div>
<div class="h"><small>CON SỐ DỄ ĐỌC NHẦM</small><div>Một bảng ghi −17%.<br>FPT công bố +12,6%.</div></div>
<div class="card tile" style="left:60px;border-color:rgba(255,90,90,.45)"><div class="lab">Doanh thu quý 2/2026 trên bảng số liệu</div><div class="v"><i style="color:{RED}">▼</i>−17,1%</div><div class="s">Nguồn dữ liệu: DNSE</div></div>
<div class="card tile" style="left:558px;border-color:rgba(34,197,94,.45)"><div class="lab">Doanh thu 6 tháng đầu năm FPT công bố</div><div class="v"><i style="color:{GREEN}">▲</i>+12,6%</div><div class="s">Đã tính lại số năm trước để so cùng cơ sở</div></div>
<div class="why"><b>Vì sao lệch?</b> Từ 2026 FPT chỉ ghi phần lãi của FPT Telecom theo tỷ lệ sở hữu, không cộng toàn bộ doanh thu nữa. Nhiều khả năng bảng nào chưa tính lại kỳ cũ sẽ thấy doanh thu “giảm”.</div>
<div class="card" style="top:846px;height:350px">
 <div class="ct">Lợi nhuận sau thuế công ty mẹ, tăng so cùng kỳ (%)<span>Con số không bị đổi cách ghi làm lệch · chậm lại còn ~14%</span></div>
 <div style="position:absolute;left:30px;top:72px">{svg}</div>
</div>
<div class="foot" style="bottom:26px"><b>Nguồn:</b> DNSE (KQKD theo quý); Vietstock 17/7; Vietnamnet 16/7. Nguyên nhân chênh là suy luận, cần đối chiếu BCTC. {DISC}</div>
</body></html>"""

for i, f in enumerate((slide1, slide2, slide3), 1):
    (R / f"post_fpt_{i}_1080x1350.html").write_text(f())
print("ok")
