#!/usr/bin/env python3
"""Video 28/9/2026 — "Thị trường đỏ, ngành này vẫn tăng" (2:22 sau khi cắt khoảng lặng).

Sinh public/index.html + public/cards/*.html. Phong cách: .claude/skills/hieu-talking-head-style.
Giá: DNSE, đóng cửa phiên 28/9/2026 (xem PRICES). Chạy: python3 build.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent
PUB = ROOT / "public"
FPS, W, H = 30, 1080, 1920
DUR = 141.8

GOLD, GREEN, RED, WHITE, DARK = "#F5C542", "#22C55E", "#EF4444", "#FAFAFA", "#111111"
PURPLE, CYAN, YELLOW = "#C084FC", "#22D3EE", "#FACC15"

# Giá đóng cửa 28/9/2026 (DNSE): [tham chiếu, đóng cửa, %]
PRICES = json.loads((ROOT / "prices.json").read_text())


def q(t):
    return f"{round(t * FPS) / FPS:.4f}"


def pct(sym):
    return PRICES[sym][2]


def fmt_pct(v):
    s = f"{abs(v):.2f}".replace(".", ",")
    return ("+" if v > 0 else "−" if v < 0 else "") + s + "%"


def color_of(sym):
    ref, close, p = PRICES[sym]
    if sym == "BVH":
        return PURPLE  # trần
    if sym == "NVL":
        return CYAN  # sàn
    return GREEN if p > 0 else RED if p < 0 else YELLOW


# Các điểm nối (jump cut) sau khi cắt khoảng lặng — đổi khung zoom tại đây để giấu vết cắt
CUTS = [6.4667, 17.3333, 30.2, 39.4667, 65.0333, 72.4, 86.4667, 92.4667, 110.9333, 115.1, 120.3667, 135.8333]

# ───────────────────────── CAPTION ─────────────────────────
# (bắt đầu, dòng nhỏ, từ khoá, kiểu[, kết thúc]) — k: serif vàng, b: sans trắng, g: xanh, r: đỏ
CAPS = [
    (0.00, "sáng nay", "thị trường đỏ lửa", "r"),
    (1.25, "", "ngân hàng, chứng khoán", "b"),
    (2.48, "bất động sản", "đều giảm", "r"),
    (3.95, "nhưng có", "hai ngành", "k"),
    (5.08, "lại tăng", "mạnh nhất", "g"),
    (5.68, "trong", "nhiều tuần", "k", 6.45),
    (6.69, "hôm nay", "28/9", "b"),
    (8.28, "VN-Index", "giảm gần 4,5 điểm", "r"),
    (10.39, "nhưng cổ phiếu", "lọc dầu", "k"),
    (11.57, "BSR vẫn tăng", "gần 7%", "g"),
    (13.16, "còn Bảo Việt", "BVH", "b"),
    (14.33, "", "tăng hết biên độ", "g"),
    (15.28, "thanh khoản", "cao nhất 4 năm", "k", 17.3),
    (17.70, "đây không phải", "phiên giảm bình thường", "b"),
    (19.50, "là tuần đầu sau khi", "thị trường Việt Nam", "b"),
    (21.47, "chính thức được", "thăng hạng", "k"),
    (22.77, "lên thị trường", "mới nổi", "k"),
    (23.75, "và dòng tiền vẫn", "chưa quay lại", "r"),
    (25.38, "như", "kỳ vọng", "k"),
    (26.26, "vì vậy, nhìn", "ngành nào ngược dòng", "k"),
    (27.95, "lúc này", "quan trọng hơn", "b"),
    (29.16, "là nhìn", "chỉ số chung", "b", 30.2),
    (30.40, "trong", "2 phút tới", "b"),
    (31.49, "mình sẽ nói", "3 điều", "k"),
    (32.65, "", "ngành nào ngược dòng", "b"),
    (33.91, "vì sao", "lại là ngành đó", "b"),
    (35.27, "và điều thứ 3", "một nguyên nhân", "k"),
    (37.08, "đang vừa", "nuôi sống ngành này", "g"),
    (38.35, "và vừa", "đè ngành khác", "r", 39.45),
    (40.43, "nhóm dầu khí là bên", "tăng rõ nhất", "g"),
    (42.88, "BSR tăng", "gần 7%", "g"),
    (43.91, "PVS và PET", "tăng trên 5%", "g"),
    (45.90, "phân bón như", "DCM, BFC", "b"),
    (47.17, "", "cũng tăng theo", "g"),
    (48.06, "nhưng lý do không nằm ở", "nội tại doanh nghiệp", "b"),
    (51.13, "mà ở", "giá dầu thế giới", "k"),
    (52.37, "vừa vượt", "106 USD/thùng", "k"),
    (55.04, "vì vậy, khi", "Mỹ từ chối", "r"),
    (56.12, "đề xuất", "mở lại eo Hormuz", "k"),
    (57.50, "của Iran", "cuối tuần trước", "b"),
    (58.94, "thị trường lo", "nguồn cung dầu bị siết", "r"),
    (60.80, "", "lâu hơn dự kiến", "b"),
    (61.76, "nhóm khai thác", "và lọc hoá dầu", "b"),
    (63.36, "ở Việt Nam", "hưởng lợi trực tiếp", "g", 64.95),
    (65.70, "tiếp theo,", "ngành thứ hai", "k"),
    (66.47, "", "đi ngược dòng", "k"),
    (67.38, "chẳng liên quan", "gì đến dầu", "b"),
    (69.16, "BVH vẫn", "tăng hết biên độ", "g"),
    (70.73, "vốn hoá vượt", "2 tỷ USD", "k"),
    (72.72, "vì công ty này đang", "gửi ngân hàng", "b"),
    (74.52, "đến", "166 nghìn tỷ đồng", "k"),
    (76.20, "cộng thêm gần", "118 nghìn tỷ", "k"),
    (78.14, "đồng từ", "trái phiếu dài hạn", "b"),
    (79.70, "vì vậy khi", "lãi suất tiền gửi", "b"),
    (81.11, "vẫn", "neo cao", "k"),
    (82.00, "riêng tiền lãi", "gửi ngân hàng", "b"),
    (83.70, "nửa đầu năm", "của Bảo Việt", "b"),
    (85.20, "đã tăng", "42%", "g", 86.45),
    (86.72, "Vietcap dự báo", "lợi nhuận", "b"),
    (88.40, "của công ty này", "có thể tăng", "g"),
    (90.24, "tăng gần", "46%", "g"),
    (91.36, "", "trong năm nay", "b", 92.3),
    (94.02, "chi tiết", "ít ai nối lại", "k"),
    (95.48, "chính mức", "lãi suất cao", "r"),
    (96.65, "đã giúp Bảo Việt", "kiếm thêm tiền lãi", "g"),
    (98.37, "lại là thứ", "đang đè", "r"),
    (99.28, "", "ngân hàng, bất động sản", "b"),
    (100.66, "và", "chứng khoán hôm nay", "b", 102.5),
    (102.64, "Novaland", "giảm hơn 6%", "r"),
    (104.16, "nhóm chứng khoán như", "HCM giảm hơn 4%", "r"),
    (106.59, "đều là những ngành", "cần vốn rẻ", "k"),
    (108.47, "để tăng trưởng, nên", "bị thiệt", "r"),
    (110.32, "đúng lúc", "lãi suất cao", "r"),
    (111.93, "nói cách khác,", "thị trường hôm nay", "b"),
    (114.16, "không giảm hay tăng", "đồng loạt", "b"),
    (116.16, "nó", "chia phe", "k"),
    (117.52, "theo đúng", "một câu hỏi", "k"),
    (118.29, "", "ai được lợi?", "g"),
    (118.71, "", "ai bị thiệt?", "r"),
    (119.07, "khi", "giá dầu và lãi suất", "k"),
    (119.77, "", "cùng ở mức cao", "b", 120.4),
    (120.51, "vậy, câu trả lời", "cho câu hỏi ban đầu", "b"),
    (122.45, "ngành nào", "tăng ngược dòng", "g"),
    (124.15, "", "không phải tình cờ", "k"),
    (125.32, "mà là 2 ngành", "đang ăn theo đúng", "b"),
    (127.04, "", "2 rủi ro lớn nhất", "r"),
    (127.94, "của thị trường", "lúc này", "b"),
    (129.29, "", "giá dầu và lãi suất", "k", 131.4),
    (131.62, "", "ngân hàng, bất động sản", "b"),
    (133.03, "chứng khoán", "chịu đúng mặt trái", "r"),
    (135.43, "của", "2 rủi ro đó", "b", 136.5),
    (136.63, "anh chị đang cầm", "cổ phiếu nào", "k"),
    (137.89, "của ngành", "nhóm giảm hôm nay?", "r"),
    (138.81, "", "comment ngay ngành đó", "k"),
    (139.68, "mình sẽ phân tích", "kỹ hơn", "b"),
    (140.44, "trong", "video tiếp theo", "k", DUR),
]

# ───────────────────────── CARD ─────────────────────────
# Mỗi card: id -> dict(s, e, track, full(bool), pip(bool), html, js(list[str]))
CARDS = {}
PANEL = f"background:rgba(17,17,17,.86);border-radius:28px;box-shadow:0 18px 50px rgba(0,0,0,.35)"


def card(cid, s, e, body, css, js, full=False, pip=False, bg=None):
    root_bg = f"background:{bg};" if bg else ""
    html = (f'<div class="card" data-card-id="{cid}"><style>'
            f'.card[data-card-id="{cid}"] .root{{position:absolute;inset:0;{root_bg}}}'
            + css.replace("SEL", f'.card[data-card-id="{cid}"]') +
            f'</style><div class="root">{body}</div></div>')
    CARDS[cid] = dict(s=s, e=e, track=4 if full else 3, full=full, pip=pip, html=html, js=js)


def pop(sel, t, d=0.35):
    return f"tl.fromTo('{sel}',{{opacity:0,scale:.6}},{{opacity:1,scale:1,duration:{d},ease:'back.out(1.8)'}},{q(t)});"


def rise(sel, t, d=0.45, dist=40, stagger=0):
    st = f",stagger:{stagger}" if stagger else ""
    return f"tl.fromTo('{sel}',{{opacity:0,y:{dist}}},{{opacity:1,y:0,duration:{d},ease:'power3.out'{st}}},{q(t)});"


def slide(sel, t, d=0.45, dist=-120):
    return f"tl.fromTo('{sel}',{{opacity:0,x:{dist}}},{{opacity:1,x:0,duration:{d},ease:'power3.out'}},{q(t)});"


def draw(sel, t, d=0.6):
    return (f"(function(){{const el=document.querySelector('{sel}');if(el){{const L=el.getTotalLength();"
            f"tl.set('{sel}',{{strokeDasharray:L,strokeDashoffset:L}},0);"
            f"tl.to('{sel}',{{strokeDashoffset:0,duration:{d},ease:'power2.inOut'}},{q(t)});}}}})();")


def count(sel, t, to, d=0.9, dec=0, suffix=""):
    return (f"(function(){{const o={{v:0}};tl.to(o,{{v:{to},duration:{d},ease:'power2.out',onUpdate:function(){{"
            f"const el=document.querySelector('{sel}');if(el)el.textContent=o.v.toFixed({dec}).replace('.',',')+'{suffix}';}}}},{q(t)});}})();")


def cell(sym, idn):
    c = color_of(sym)
    tag = " TRẦN" if sym == "BVH" else " SÀN" if sym == "NVL" else ""
    return (f'<div class="cell" id="{idn}" style="--c:{c}"><b>{sym}</b><span>{fmt_pct(pct(sym))}{tag}</span></div>')


CELL_CSS = """
SEL .cell{position:relative;display:flex;flex-direction:column;justify-content:center;align-items:center;height:118px;border-radius:18px;
 background:color-mix(in srgb,var(--c) 16%,#161616);border:2px solid color-mix(in srgb,var(--c) 55%,transparent)}
SEL .cell b{font:800 40px 'Be Vietnam Pro';color:#fff;letter-spacing:1px}
SEL .cell span{font:700 30px 'Be Vietnam Pro';color:var(--c)}
"""

# 1) Hook: tiêu đề đỏ trên đầu
card("c01-hook", 0.0, 1.25, f'<div class="t" id="c01-t"><span>THỊ TRƯỜNG</span> <i>đỏ…</i></div>', f"""
SEL .t{{position:absolute;left:60px;right:60px;top:90px;padding:26px 36px;{PANEL};text-align:center;font:800 70px 'Be Vietnam Pro';color:{WHITE}}}
SEL .t i{{font:italic 700 92px 'Playfair Display';color:{RED}}}""", [rise("#c01-t", 0.05, 0.4, -40)])

# 2) Bảng điện 28/9 (cutaway, PiP)
groups = [("NGÂN HÀNG", ["TCB", "CTG", "ACB", "MBB"]), ("CHỨNG KHOÁN", ["SSI", "VND", "VIX", "HCM"]),
          ("BẤT ĐỘNG SẢN", ["NVL", "KDH", "VIC", "VHM"])]
rows = ""
for gi, (g, syms) in enumerate(groups):
    rows += f'<div class="g" id="c02-g{gi}"><div class="gl">{g}</div><div class="row">' + "".join(
        cell(s, f"c02-{s}") for s in syms) + "</div></div>"
rows += '<div class="g" id="c02-hot"><div class="gl" style="color:#fff">NGƯỢC DÒNG</div><div class="row two">' + cell("BSR", "c02-BSR") + cell("BVH", "c02-BVH") + "</div></div>"
card("c02-board", 1.25, 6.45, f'<div class="hd" id="c02-hd">BẢNG ĐIỆN <i>28/9</i></div>{rows}<div class="src">Giá đóng cửa · nguồn DNSE</div>', f"""
SEL .hd{{position:absolute;left:60px;top:110px;font:800 64px 'Be Vietnam Pro';color:{WHITE}}}
SEL .hd i{{font:italic 700 76px 'Playfair Display';color:{GOLD}}}
SEL .g{{position:absolute;left:60px;right:60px}}
SEL #c02-g0{{top:240px}} SEL #c02-g1{{top:440px}} SEL #c02-g2{{top:640px}} SEL #c02-hot{{top:860px}}
SEL .gl{{font:700 26px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:5px;margin-bottom:12px}}
SEL .row{{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}}
SEL .row.two{{grid-template-columns:1fr 1fr}}
SEL .row.two .cell{{height:150px}} SEL .row.two .cell b{{font-size:54px}} SEL .row.two .cell span{{font-size:38px}}
SEL .src{{position:absolute;left:60px;top:1060px;font:400 24px 'Be Vietnam Pro';color:#777}}
{CELL_CSS}""", [rise("#c02-hd", 1.3), rise("#c02-g0 .cell", 1.35, 0.3, 30, 0.05), rise("#c02-g1 .cell", 1.9, 0.3, 30, 0.05),
               rise("#c02-g2 .cell", 2.5, 0.3, 30, 0.05), rise("#c02-hot .gl", 3.95, 0.3, 20),
               pop("#c02-BSR", 4.05, 0.4), pop("#c02-BVH", 4.25, 0.4),
               f"tl.to('#c02-g0,#c02-g1,#c02-g2',{{opacity:.35,duration:.4,ease:'power2.out'}},{q(4.0)});"],
     full=True, pip=True, bg=f"radial-gradient(110% 70% at 50% 30%,#1d1d1f 0%,{DARK} 70%)")

# 3) "…ngành này vẫn tăng" + chỉ số trong phiên
card("c03-stats", 6.69, 17.3, f"""
<div class="t" id="c03-t"><i>…ngành này</i> VẪN TĂNG</div>
<div class="chips">
 <div class="chip" id="c03-vni" style="--c:{RED}"><b>VN-Index</b><span>−4,43 điểm</span></div>
 <div class="chip" id="c03-bsr" style="--c:{GREEN}"><b>BSR</b><span>{fmt_pct(pct('BSR'))}</span></div>
 <div class="chip" id="c03-bvh" style="--c:{PURPLE}"><b>BVH</b><span>TRẦN {fmt_pct(pct('BVH'))}</span></div>
</div>
<div class="note" id="c03-note">thanh khoản BVH cao nhất 4 năm!</div>""", f"""
SEL .t{{position:absolute;left:60px;right:60px;top:80px;padding:18px 30px;{PANEL};text-align:center;font:800 56px 'Be Vietnam Pro';color:{GREEN}}}
SEL .t i{{font:italic 700 70px 'Playfair Display';color:{WHITE}}}
SEL .chips{{position:absolute;left:60px;right:60px;top:222px;display:flex;gap:14px}}
SEL .chip{{flex:1;padding:12px 10px;border-radius:18px;background:rgba(17,17,17,.86);border:2px solid var(--c);text-align:center}}
SEL .chip b{{display:block;font:800 32px 'Be Vietnam Pro';color:#fff}}
SEL .chip span{{font:800 30px 'Be Vietnam Pro';color:var(--c)}}
SEL .note{{position:absolute;right:70px;top:372px;font:400 38px 'Pacifico';color:{GOLD};transform:rotate(-4deg);text-shadow:0 3px 12px rgba(0,0,0,.8)}}""",
     [rise("#c03-t", 6.72, 0.4, -30), pop("#c03-vni", 8.28), pop("#c03-bsr", 11.57), pop("#c03-bvh", 14.33), pop("#c03-note", 15.3, 0.4)])

# 4) Nâng hạng — dòng tiền chưa quay lại
card("c04-upgrade", 19.5, 30.1, f"""
<div class="p" id="c04-p"><div class="k">TUẦN ĐẦU TIÊN SAU KHI</div><div class="h">Việt Nam lên <i>thị trường mới nổi</i></div>
<div class="stamp" id="c04-stamp">NÂNG HẠNG</div></div>
<div class="flow" id="c04-flow"><span>Dòng tiền</span><svg width="70" height="60" viewBox="0 0 70 60"><path d="M10 10 L60 50 M60 50 L38 48 M60 50 L56 28" stroke="{RED}" stroke-width="7" fill="none" stroke-linecap="round"/></svg><b>chưa quay lại</b></div>
<div class="flow2" id="c04-f2">→ nhìn <b>ngành ngược dòng</b>, không nhìn chỉ số</div>""", f"""
SEL .p{{position:absolute;left:60px;right:60px;top:80px;padding:22px 34px;{PANEL}}}
SEL .k{{font:700 24px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:5px}}
SEL .h{{font:800 46px 'Be Vietnam Pro';color:{WHITE};margin-top:4px}}
SEL .h i{{font:italic 700 56px 'Playfair Display';color:{GOLD}}}
SEL .stamp{{position:absolute;right:26px;top:-26px;font:800 30px 'Be Vietnam Pro';color:{DARK};background:{GOLD};padding:6px 18px;border-radius:10px;transform:rotate(5deg)}}
SEL .flow{{position:absolute;left:60px;top:300px;display:flex;align-items:center;gap:12px;padding:12px 24px;border-radius:18px;background:rgba(17,17,17,.86)}}
SEL .flow span{{font:700 34px 'Be Vietnam Pro';color:#fff}} SEL .flow b{{font:800 34px 'Be Vietnam Pro';color:{RED}}}
SEL .flow2{{position:absolute;left:60px;top:300px;padding:12px 24px;border-radius:18px;background:rgba(17,17,17,.86);font:700 34px 'Be Vietnam Pro';color:#fff}}
SEL .flow2 b{{color:{GREEN}}}""",
     [rise("#c04-p", 19.55, 0.45, -30), pop("#c04-stamp", 21.6, 0.4), slide("#c04-flow", 23.8),
      f"tl.to('#c04-flow',{{opacity:0,duration:.25}},{q(26.1)});", slide("#c04-f2", 26.3)])

# 5) 3 điều
items = [("01", "Ngành nào đang ngược dòng"), ("02", "Vì sao lại là ngành đó"), ("03", "1 nguyên nhân — 2 chiều ngược nhau")]
lst = "".join(f'<div class="it" id="c05-i{i}"><b>{n}</b><span>{t}</span></div>' for i, (n, t) in enumerate(items))
card("c05-three", 30.4, 39.45, f'<div class="p" id="c05-p"><div class="k" id="c05-k">2 PHÚT · <i>3 điều</i></div>{lst}</div>', f"""
SEL .p{{position:absolute;left:60px;right:60px;top:60px;padding:20px 30px 16px;{PANEL}}}
SEL .k{{font:800 34px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px;margin-bottom:6px}}
SEL .k i{{font:italic 700 46px 'Playfair Display';color:{GOLD};letter-spacing:0}}
SEL .it{{display:flex;align-items:center;gap:18px;padding:7px 0}}
SEL .it b{{font:800 30px 'Be Vietnam Pro';color:{DARK};background:{GOLD};border-radius:10px;padding:2px 12px}}
SEL .it span{{font:700 34px 'Be Vietnam Pro';color:#fff}}""",
     [rise("#c05-p", 30.42, 0.4, -30), pop("#c05-k", 31.5), slide("#c05-i0", 32.65, 0.4, -60), slide("#c05-i1", 33.91, 0.4, -60),
      slide("#c05-i2", 35.27, 0.4, -60),
      f"tl.to('#c05-i2 span',{{color:'{GOLD}',duration:.3}},{q(37.08)});"])


# Thẻ chương (cutaway ngắn, nền kem)
def chapter(cid, s, e, num, title, sub):
    card(cid, s, e, f"""<div class="bT" id="{cid}-bt"></div><div class="bB" id="{cid}-bb"></div>
<div class="lbl" id="{cid}-l"><div class="n">{num}</div><div class="tt" id="{cid}-tt">{title}</div><div class="sb">{sub}</div></div>""", f"""
SEL .bT{{position:absolute;left:150px;top:0;width:130px;height:520px;background:#3a3a3a;border-radius:0 0 8px 8px}}
SEL .bB{{position:absolute;right:150px;bottom:0;width:130px;height:560px;background:#3a3a3a;border-radius:8px 8px 0 0}}
SEL .lbl{{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:30px 60px;border:3px dashed rgba(17,17,17,.45);border-radius:14px;background:rgba(255,255,255,.35);text-align:center;box-shadow:0 18px 40px rgba(0,0,0,.12);white-space:nowrap}}
SEL .n{{font:800 40px 'Be Vietnam Pro';color:{DARK};background:{GOLD};display:inline-block;padding:4px 20px;border-radius:12px}}
SEL .tt{{font:italic 700 110px 'Playfair Display';color:{DARK};line-height:1.15}}
SEL .sb{{font:400 40px 'Pacifico';color:#555}}""",
         [f"tl.fromTo('#{cid}-bt',{{y:-560}},{{y:0,duration:.3,ease:'power3.out'}},{q(s)});",
          f"tl.fromTo('#{cid}-bb',{{y:600}},{{y:0,duration:.3,ease:'power3.out'}},{q(s)});",
          f"tl.fromTo('#{cid}-l',{{opacity:0,scale:.85}},{{opacity:1,scale:1,duration:.3,ease:'power3.out'}},{q(s + 0.08)});",
          f"tl.fromTo('#{cid}-tt',{{clipPath:'inset(0 100% 0 0)'}},{{clipPath:'inset(0 0% 0 0)',duration:.4,ease:'power2.inOut'}},{q(s + 0.1)});"],
         full=True, bg="radial-gradient(120% 80% at 50% 45%,#FFFBF1 0%,#F3EBDA 100%)")


chapter("c06-ch1", 39.47, 40.43, "01", "Dầu khí", "ăn theo giá dầu")

# 7) Nhóm dầu khí + phân bón
oil = ["BSR", "PVS", "PET", "DCM", "BFC"]
card("c07-oil", 40.43, 51.0, f"""<div class="p" id="c07-p"><div class="k"><span id="c07-k1">DẦU KHÍ</span> <i id="c07-k2">tăng đồng loạt</i></div>
<div class="row5">{''.join(cell(s, 'c07-' + s) for s in oil)}</div></div>
<div class="note" id="c07-note">không phải nhờ nội tại DN!</div>""", f"""
SEL .p{{position:absolute;left:40px;right:40px;top:70px;padding:20px 22px;{PANEL}}}
SEL .k{{font:800 44px 'Be Vietnam Pro';color:#fff;margin-bottom:14px;padding-left:8px}}
SEL .k i{{font:italic 700 54px 'Playfair Display';color:{GREEN}}}
SEL .row5{{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}}
SEL .row5 .cell{{height:110px}} SEL .row5 .cell b{{font-size:32px}} SEL .row5 .cell span{{font-size:25px}}
SEL .note{{position:absolute;right:60px;top:330px;font:400 40px 'Pacifico';color:{GOLD};transform:rotate(-4deg);text-shadow:0 3px 12px rgba(0,0,0,.8)}}
{CELL_CSS}""", [rise("#c07-p", 40.45, 0.4, -30), pop("#c07-BSR", 45.9), pop("#c07-PVS", 46.05), pop("#c07-PET", 46.2),
                f"tl.set('#c07-oil .card',{{opacity:0}},{q(42.9)});", f"tl.set('#c07-oil .card',{{opacity:1}},{q(45.85)});", pop("#c07-DCM", 46.58), pop("#c07-BFC", 47.02), pop("#c07-note", 48.8, 0.4)])

# Logo CloudStock (web của Hiếu)
BRAND_HTML = '<div class="brand"><img src="img/logo.png"/><div><b>CloudStock</b><span>cloudstock.id.vn</span></div></div>'
BRAND_CSS = """
SEL .brand{position:absolute;left:60px;top:110px;display:flex;align-items:center;gap:18px;padding:10px 26px 10px 16px;border-radius:22px;background:rgba(167,139,250,.12);border:2px solid rgba(167,139,250,.45)}
SEL .brand img{height:84px;width:auto}
SEL .brand b{display:block;font:800 46px 'Be Vietnam Pro';color:#fff;line-height:1.05}
SEL .brand span{display:block;font:700 28px 'Be Vietnam Pro';color:#C4B5FD;letter-spacing:1px}"""

# 7b) B-roll từ CloudStock: biểu đồ BSR (cutaway có PiP)
WEB_CSS = f"""
SEL .hd{{position:absolute;left:60px;right:60px;top:228px;display:flex;align-items:center;justify-content:space-between}}
SEL .hd b{{font:800 58px 'Be Vietnam Pro';color:#fff}} SEL .hd span{{font:800 44px 'Be Vietnam Pro';padding:6px 20px;border-radius:14px;color:{DARK}}}
SEL .frame{{position:absolute;left:50px;right:50px;border-radius:28px;overflow:hidden;border:3px solid #2a2a2e;box-shadow:0 30px 80px rgba(0,0,0,.6);background:#131316}}
SEL .frame img{{display:block;width:100%}}
SEL .src{{position:absolute;left:60px;font:700 26px 'Be Vietnam Pro';color:#8b8bff;letter-spacing:1px}}"""
card("c07b-bsrweb", 42.88, 45.85, BRAND_HTML.replace('class="brand"','class="brand" id="c07b-br"') + f"""<div class="hd" id="c07b-hd"><b>BSR</b><span style="background:{GREEN}">{fmt_pct(pct('BSR'))}</span></div>
<div class="frame" id="c07b-f" style="top:330px;height:850px"><img id="c07b-img" src="img/chart_BSR.jpg"/></div>
<div class="src" style="top:1192px">Biểu đồ ngày · 3 tháng gần nhất</div>""", WEB_CSS + BRAND_CSS,
     [pop("#c07b-br", 42.9, 0.4), rise("#c07b-hd", 43.0), rise("#c07b-f", 43.05, 0.5, 80),
      f"tl.fromTo('#c07b-img',{{scale:1,transformOrigin:'100% 0%'}},{{scale:1.08,duration:2.8,ease:'power2.inOut'}},{q(43.0)});"],
     full=True, pip=True, bg=f"radial-gradient(110% 70% at 50% 30%,#1d1d1f 0%,{DARK} 70%)")

# 8) Giá dầu Brent
card("c08-brent", 51.13, 54.95, f"""<div class="p" id="c08-p"><div class="k">GIÁ DẦU BRENT</div>
<div class="big"><span class="gt">&gt;</span><span id="c08-n">0</span><small>USD/thùng</small></div>
<svg class="up" width="120" height="120" viewBox="0 0 120 120"><path id="c08-ar" d="M20 100 L100 20 M100 20 L60 22 M100 20 L98 60" stroke="{GREEN}" stroke-width="12" fill="none" stroke-linecap="round"/></svg></div>""", f"""
SEL .p{{position:absolute;left:60px;right:60px;top:80px;padding:22px 34px;{PANEL}}}
SEL .k{{font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:6px}}
SEL .big{{font:800 150px 'Be Vietnam Pro';color:{WHITE};line-height:1.1;margin-top:18px}}
SEL .big .gt{{color:{GREEN};margin-right:8px}}
SEL .big small{{font:700 40px 'Be Vietnam Pro';color:#bbb;margin-left:14px}}
SEL .up{{position:absolute;right:40px;top:60px}}""",
     [rise("#c08-p", 51.15, 0.4, -30), count("#c08-n", 52.4, 106, 0.9), draw("#c08-ar", 52.6, 0.5)])

# 9) Hormuz — cutaway có PiP: tin + chuỗi tác động
card("c09-hormuz", 55.0, 64.95, f"""
<div class="k" id="c09-k">CUỐI TUẦN TRƯỚC</div>
<div class="news" id="c09-news"><div class="tag">TIN QUỐC TẾ</div>
<div class="hl">Mỹ <b>từ chối</b> đề xuất của Iran mở lại <i>eo Hormuz</i></div>
<div class="warn" id="c09-w">Lưu ý: đề xuất vẫn đang đàm phán — chưa có thoả thuận chính thức</div></div>
<div class="chain">
 <div class="st" id="c09-s1"><b>Nguồn cung dầu</b><span style="color:{RED}">bị siết lâu hơn</span></div>
 <svg class="ar" id="c09-a1" width="60" height="70" viewBox="0 0 60 70"><path d="M30 5 L30 60 M30 60 L14 44 M30 60 L46 44" stroke="#777" stroke-width="7" fill="none" stroke-linecap="round"/></svg>
 <div class="st" id="c09-s2"><b>Giá dầu</b><span style="color:{GREEN}">tăng</span></div>
 <svg class="ar" id="c09-a2" width="60" height="70" viewBox="0 0 60 70"><path d="M30 5 L30 60 M30 60 L14 44 M30 60 L46 44" stroke="#777" stroke-width="7" fill="none" stroke-linecap="round"/></svg>
 <div class="st" id="c09-s3"><b>Khai thác &amp; lọc hoá dầu VN</b><span style="color:{GREEN}">hưởng lợi trực tiếp</span></div>
</div>""", f"""
SEL .k{{position:absolute;left:70px;top:130px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:6px}}
SEL .news{{position:absolute;left:60px;right:60px;top:180px;padding:30px 34px;border-radius:24px;background:#F7F3EA;box-shadow:0 20px 50px rgba(0,0,0,.4)}}
SEL .tag{{display:inline-block;font:800 24px 'Be Vietnam Pro';color:#fff;background:{RED};padding:4px 14px;border-radius:8px;letter-spacing:3px}}
SEL .hl{{font:800 58px 'Be Vietnam Pro';color:{DARK};line-height:1.2;margin-top:14px}}
SEL .hl b{{color:{RED}}} SEL .hl i{{font:italic 700 66px 'Playfair Display'}}
SEL .warn{{margin-top:16px;font:700 28px 'Be Vietnam Pro';color:#6b5d3a;background:#EFE2BD;border-radius:12px;padding:10px 16px}}
SEL .chain{{position:absolute;left:60px;right:60px;top:690px;display:flex;flex-direction:column;align-items:center}}
SEL .st{{width:100%;padding:14px 24px;border-radius:18px;background:#1e1e1e;border:2px solid #333;display:flex;justify-content:space-between;align-items:center}}
SEL .st b{{font:800 36px 'Be Vietnam Pro';color:#fff}} SEL .st span{{font:800 34px 'Be Vietnam Pro'}}
SEL .ar{{margin:4px 0}}""",
     [rise("#c09-k", 55.05), rise("#c09-news", 55.1, 0.5, 60), pop("#c09-w", 57.9, 0.4),
      slide("#c09-s1", 58.94, 0.4, -80), rise("#c09-a1", 60.6, 0.3, -20), slide("#c09-s2", 60.8, 0.4, -80),
      rise("#c09-a2", 61.6, 0.3, -20), slide("#c09-s3", 61.76, 0.4, -80),
      f"tl.to('#c09-s3',{{borderColor:'{GREEN}',duration:.3}},{q(63.36)});"],
     full=True, pip=True, bg=f"radial-gradient(110% 70% at 50% 30%,#1d1d1f 0%,{DARK} 70%)")

chapter("c10-ch2", 65.03, 65.7, "02", "Bảo hiểm", "ăn theo lãi suất cao")

# 11) BVH trần — B-roll từ CloudStock (thẻ giá + biểu đồ), cutaway có PiP
card("c11-bvh", 69.16, 72.6, BRAND_HTML.replace('class="brand"','class="brand" id="c11-br"') + f"""<div class="hd" id="c11-hd"><b>BVH · Bảo Việt</b><span style="background:{PURPLE}">TRẦN {fmt_pct(pct('BVH'))}</span></div>
<div class="frame" id="c11-pr" style="top:330px;height:330px"><img src="img/price_BVH.jpg"/></div>
<div class="frame" id="c11-f" style="top:680px;height:500px"><img id="c11-img" src="img/chart_BVH.jpg"/></div>
<div class="src" style="top:1192px">Phiên 28/9/2026 · biểu đồ ngày</div>
<div class="note" id="c11-n">vốn hoá &gt; 2 tỷ USD</div>""", WEB_CSS + BRAND_CSS + f"""
SEL .note{{position:absolute;right:80px;top:420px;font:400 40px 'Pacifico';color:{GOLD};transform:rotate(-4deg);text-shadow:0 3px 12px rgba(0,0,0,.9)}}""",
     [pop("#c11-br", 69.18, 0.4), rise("#c11-hd", 69.25), rise("#c11-pr", 69.25, 0.45, 60), rise("#c11-f", 69.4, 0.5, 80), pop("#c11-n", 70.8, 0.4),
      f"tl.fromTo('#c11-img',{{scale:1,transformOrigin:'100% 0%'}},{{scale:1.08,duration:3,ease:'power2.inOut'}},{q(69.5)});"],
     full=True, pip=True, bg=f"radial-gradient(110% 70% at 50% 30%,#1d1d1f 0%,{DARK} 70%)")

# 12) Bảng cân đối BVH — cutaway có PiP
card("c12-bs", 72.6, 86.45, f"""
<div class="k" id="c12-k">BẢO VIỆT (BVH) ĐANG NẮM</div>
<div class="bar" id="c12-b1"><div class="lb">Tiền gửi ngân hàng</div><div class="track"><div class="fill" id="c12-f1" style="background:{GOLD}"></div></div><div class="val"><span id="c12-n1">0</span> nghìn tỷ</div></div>
<div class="bar" id="c12-b2"><div class="lb">Trái phiếu dài hạn</div><div class="track"><div class="fill" id="c12-f2" style="background:#A3A3A3"></div></div><div class="val">~<span id="c12-n2">0</span> nghìn tỷ</div></div>
<div class="rate" id="c12-r"><span>Lãi suất tiền gửi</span><b>neo cao</b></div>
<div class="res" id="c12-res"><div class="rk">Lãi tiền gửi · 6 tháng đầu năm</div><div class="rv">+<span id="c12-n3">0</span>%</div></div>
<div class="src">Số liệu theo BCTC bán niên BVH</div>""", f"""
SEL .k{{position:absolute;left:70px;top:150px;font:700 30px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:5px}}
SEL .bar{{position:absolute;left:70px;right:70px}} SEL #c12-b1{{top:230px}} SEL #c12-b2{{top:420px}}
SEL .lb{{font:700 36px 'Be Vietnam Pro';color:#fff}}
SEL .track{{margin-top:12px;height:54px;border-radius:14px;background:#222;overflow:hidden}}
SEL .fill{{height:100%;width:0;border-radius:14px}}
SEL .val{{margin-top:8px;font:800 50px 'Be Vietnam Pro';color:#fff}}
SEL .rate{{position:absolute;left:70px;top:640px;display:flex;gap:16px;align-items:baseline}}
SEL .rate span{{font:700 36px 'Be Vietnam Pro';color:#bbb}} SEL .rate b{{font:italic 700 58px 'Playfair Display';color:{GOLD}}}
SEL .res{{position:absolute;left:70px;right:70px;top:760px;padding:24px 30px;border-radius:24px;background:color-mix(in srgb,{GREEN} 14%,#141414);border:2px solid {GREEN}}}
SEL .rk{{font:700 32px 'Be Vietnam Pro';color:#cfcfcf}} SEL .rv{{font:800 120px 'Be Vietnam Pro';color:{GREEN};line-height:1.05}}
SEL .src{{position:absolute;left:70px;top:1030px;font:400 24px 'Be Vietnam Pro';color:#777}}""",
     [rise("#c12-k", 72.65), rise("#c12-b1", 72.75), f"tl.fromTo('#c12-f1',{{width:0}},{{width:'100%',duration:1,ease:'power3.out'}},{q(74.52)});",
      count("#c12-n1", 74.52, 166, 1.0), rise("#c12-b2", 76.2),
      f"tl.fromTo('#c12-f2',{{width:0}},{{width:'71%',duration:1,ease:'power3.out'}},{q(77.0)});", count("#c12-n2", 77.0, 118, 1.0),
      slide("#c12-r", 79.7, 0.45, -80), rise("#c12-res", 82.0, 0.5, 60), count("#c12-n3", 85.2, 42, 0.9)],
     full=True, pip=True, bg=f"radial-gradient(110% 70% at 50% 30%,#1d1d1f 0%,{DARK} 70%)")

# 13) Vietcap dự báo
card("c13-vcap", 86.72, 92.3, f"""<div class="p" id="c13-p"><div class="k">VIETCAP DỰ BÁO · LỢI NHUẬN BVH 2026</div>
<div class="big">+<span id="c13-n">0</span>%</div>
<div class="d" id="c13-d">Đây là quan điểm của Vietcap, không phải nhận định cá nhân</div></div>""", f"""
SEL .p{{position:absolute;left:60px;right:60px;top:80px;padding:22px 34px;{PANEL}}}
SEL .k{{font:700 26px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:3px}}
SEL .big{{font:800 130px 'Be Vietnam Pro';color:{GREEN};line-height:1.05}}
SEL .d{{font:400 26px 'Be Vietnam Pro';color:#cfcfcf;font-style:italic}}""",
     [rise("#c13-p", 86.75, 0.4, -30), count("#c13-n", 90.24, 46, 0.9), rise("#c13-d", 88.5, 0.4, 20)])

chapter("c14-ch3", 92.47, 94.0, "03", "1 lãi suất", "— 2 chiều ngược nhau —")

# 15) Sơ đồ 2 chiều — cutaway có PiP
card("c15-twoway", 95.4, 102.55, f"""
<div class="center" id="c15-c"><div class="ck">MỘT NGUYÊN NHÂN</div><div class="cv">Lãi suất cao</div></div>
<svg class="lines" width="1080" height="1200" viewBox="0 0 1080 1200">
 <path id="c15-l1" d="M400 470 C 300 540, 260 600, 260 690" stroke="{GREEN}" stroke-width="8" fill="none" stroke-linecap="round"/>
 <path id="c15-l2" d="M680 470 C 780 540, 820 600, 820 690" stroke="{RED}" stroke-width="8" fill="none" stroke-linecap="round"/>
</svg>
<div class="side win" id="c15-w"><div class="sk" style="color:{GREEN}">ĐƯỢC LỢI</div><div class="sv">Bảo hiểm</div><div class="ss">BVH kiếm thêm tiền lãi</div></div>
<div class="side lose" id="c15-lo"><div class="sk" style="color:{RED}">BỊ ĐÈ</div><div class="sv">Ngân hàng<br>BĐS · Chứng khoán</div><div class="ss">cần vốn rẻ</div></div>""", f"""
SEL .center{{position:absolute;left:240px;right:240px;top:260px;padding:26px;border-radius:26px;background:#F7F3EA;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.4)}}
SEL .ck{{font:700 24px 'Be Vietnam Pro';color:#6b5d3a;letter-spacing:5px}}
SEL .cv{{font:italic 700 84px 'Playfair Display';color:{DARK}}}
SEL .lines{{position:absolute;left:0;top:0}}
SEL .side{{position:absolute;top:700px;width:440px;padding:24px;border-radius:24px;background:#1b1b1b;text-align:center}}
SEL .win{{left:40px;border:3px solid {GREEN}}} SEL .lose{{right:40px;border:3px solid {RED}}}
SEL .sk{{font:800 28px 'Be Vietnam Pro';letter-spacing:4px}}
SEL .sv{{font:800 46px 'Be Vietnam Pro';color:#fff;line-height:1.2;margin:6px 0}}
SEL .ss{{font:400 34px 'Pacifico';color:#bbb}}""",
     [pop("#c15-c", 95.48, 0.45), draw("#c15-l1", 96.65, 0.5), pop("#c15-w", 97.0, 0.4), draw("#c15-l2", 98.37, 0.5),
      pop("#c15-lo", 98.8, 0.4)],
     full=True, pip=True, bg=f"radial-gradient(110% 70% at 50% 30%,#1d1d1f 0%,{DARK} 70%)")

# 16) NVL / HCM
card("c16-losers", 102.64, 110.85, f"""<div class="p" id="c16-p"><div class="k">NGÀNH CẦN VỐN RẺ · <b>BỊ THIỆT</b></div>
<div class="row2"><div id="c16-a">{cell('NVL', 'c16-nvl')}</div><div id="c16-b">{cell('HCM', 'c16-hcm')}</div></div></div>""", f"""
SEL .p{{position:absolute;left:60px;right:60px;top:80px;padding:22px 26px;{PANEL}}}
SEL .k{{font:800 32px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:3px;margin-bottom:14px}} SEL .k b{{color:{RED}}}
SEL .row2{{display:grid;grid-template-columns:1fr 1fr;gap:16px}}
SEL .row2 .cell{{height:150px}} SEL .row2 .cell b{{font-size:52px}} SEL .row2 .cell span{{font-size:34px}}
{CELL_CSS}""", [rise("#c16-p", 102.66, 0.4, -30), pop("#c16-a", 102.7), pop("#c16-b", 105.28)])

# 17) Chia phe
card("c17-sides", 116.16, 120.4, f"""<div class="p" id="c17-p"><div class="k">THỊ TRƯỜNG <i>chia phe</i></div>
<div class="cols"><div class="col" id="c17-w" style="--c:{GREEN}"><b>ĐƯỢC LỢI</b><span>Dầu khí</span><span>Bảo hiểm</span></div>
<div class="col" id="c17-l" style="--c:{RED}"><b>BỊ THIỆT</b><span>Ngân hàng</span><span>BĐS · Chứng khoán</span></div></div></div>""", f"""
SEL .p{{position:absolute;left:60px;right:60px;top:70px;padding:20px 24px;{PANEL}}}
SEL .k{{font:800 40px 'Be Vietnam Pro';color:#fff;margin-bottom:12px}} SEL .k i{{font:italic 700 52px 'Playfair Display';color:{GOLD}}}
SEL .cols{{display:grid;grid-template-columns:1fr 1fr;gap:16px}}
SEL .col{{padding:14px 18px;border-radius:18px;border:2px solid var(--c);background:color-mix(in srgb,var(--c) 12%,#141414)}}
SEL .col b{{display:block;font:800 28px 'Be Vietnam Pro';color:var(--c);letter-spacing:3px}}
SEL .col span{{display:block;font:700 34px 'Be Vietnam Pro';color:#fff}}""",
     [rise("#c17-p", 116.18, 0.4, -30), pop("#c17-w", 118.29), pop("#c17-l", 118.71)])

# 18) Không phải tình cờ
card("c18-close", 122.45, 131.4, f"""<div class="p" id="c18-p"><div class="t">NGƯỢC DÒNG <i id="c18-i">không phải tình cờ</i></div>
<div class="risks" id="c18-r"><span class="lab">2 rủi ro lớn nhất:</span><span class="rk" id="c18-r1">Giá dầu</span><span class="rk" id="c18-r2">Lãi suất</span></div></div>""", f"""
SEL .p{{position:absolute;left:60px;right:60px;top:80px;padding:22px 30px;{PANEL}}}
SEL .t{{font:800 52px 'Be Vietnam Pro';color:{GREEN}}} SEL .t i{{font:italic 700 60px 'Playfair Display';color:{WHITE}}}
SEL .risks{{margin-top:14px;display:flex;gap:14px;align-items:center}}
SEL .lab{{font:700 32px 'Be Vietnam Pro';color:#bbb}}
SEL .rk{{font:800 34px 'Be Vietnam Pro';color:{DARK};background:{GOLD};padding:6px 18px;border-radius:12px}}""",
     [rise("#c18-p", 122.47, 0.4, -30), f"tl.fromTo('#c18-i',{{clipPath:'inset(0 100% 0 0)'}},{{clipPath:'inset(0 0% 0 0)',duration:.5,ease:'power2.inOut'}},{q(124.15)});",
      rise("#c18-r", 127.04, 0.35, 20), pop("#c18-r1", 129.29), pop("#c18-r2", 129.73)])

# 19) CTA + disclaimer
card("c19-cta", 136.63, DUR, f"""<div class="p" id="c19-p"><div class="q">Bạn đang cầm mã <i>nào?</i></div>
<div class="bub" id="c19-b">Comment ngành của bạn ↓</div></div>
<div class="lock" id="c19-l"><img src="img/icon.png"/><div><span>Xem biểu đồ &amp; tín hiệu tại</span><b>cloudstock.id.vn</b></div></div>
<div class="disc" id="c19-d">Nội dung chia sẻ thông tin thị trường, không phải khuyến nghị mua/bán cụ thể.<br>Dự báo lợi nhuận BVH là quan điểm của Vietcap. Giá: DNSE, đóng cửa 28/9/2026.</div>""", f"""
SEL .p{{position:absolute;left:60px;right:60px;top:80px;padding:22px 30px;{PANEL}}}
SEL .q{{font:800 56px 'Be Vietnam Pro';color:#fff}} SEL .q i{{font:italic 700 66px 'Playfair Display';color:{GOLD}}}
SEL .bub{{display:inline-block;margin-top:14px;font:800 36px 'Be Vietnam Pro';color:{DARK};background:{WHITE};padding:10px 24px;border-radius:40px 40px 40px 8px}}
SEL .lock{{position:absolute;left:60px;right:60px;top:1500px;display:flex;align-items:center;gap:22px;padding:16px 24px;border-radius:26px;background:rgba(17,17,17,.88);border:2px solid rgba(167,139,250,.55)}}
SEL .lock img{{width:120px;height:120px;border-radius:26px}}
SEL .lock span{{display:block;font:700 30px 'Be Vietnam Pro';color:#cfcfcf}} SEL .lock b{{display:block;font:800 54px 'Be Vietnam Pro';color:#C4B5FD}}
SEL .disc{{position:absolute;left:50px;right:50px;top:1700px;text-align:center;font:400 24px 'Be Vietnam Pro';color:rgba(255,255,255,.9);line-height:1.45;text-shadow:0 2px 8px rgba(0,0,0,.8)}}""",
     [rise("#c19-p", 136.65, 0.4, -30), rise("#c19-l", 139.6, 0.5, 60), pop("#c19-b", 138.81, 0.4), f"tl.fromTo('#c19-d',{{opacity:0}},{{opacity:1,duration:.4}},{q(138.6)});"])

# ───────────────────────── ZOOM & SFX ─────────────────────────
# Zoom: đổi khung tại mỗi jump cut (set tức thì) + đẩy nhẹ (ease inOut) ở các câu nhấn
PUSH = [(3.95, 0.05), (21.47, 0.05), (52.37, 0.05), (74.52, 0.0), (116.16, 0.06), (124.15, 0.06), (136.63, 0.05)]

SFX = []
for cid, c in CARDS.items():
    SFX.append((c["s"], "whoosh" if c["full"] else "pop", 0.3 if c["full"] else 0.25))
    if c["full"] and c["e"] < DUR - 0.1:
        SFX.append((c["e"] - 0.15, "whoosh", 0.22))
for t in [4.05, 4.25, 8.28, 11.57, 14.33, 42.88, 43.91, 44.27, 46.58, 47.02, 102.7, 105.28, 118.29, 118.71, 129.29, 129.73]:
    SFX.append((t, "click", 0.3))
for t in [52.4, 74.52, 85.2, 90.24, 21.6]:
    SFX.append((t, "ding", 0.22))
SFX.sort()

FONT_RANGES = {
    "latin": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    "latin-ext": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    "vietnamese": "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB",
}


def main():
    (PUB / "cards").mkdir(parents=True, exist_ok=True)
    hosts, js = [], []

    for cid, c in CARDS.items():
        s, e = c["s"], c["e"]
        (PUB / "cards" / f"{cid}.html").write_text(c["html"] + "\n")
        hosts.append(f'<div class="card-host clip" id="{cid}" data-card-id="{cid}" data-start="{q(s)}" data-duration="{q(e - s)}" '
                     f'data-track-index="{c["track"]}" style="left:0;top:0;width:1080px;height:1920px;visibility:hidden;opacity:0;">{c["html"]}</div>')
        sel = f'.card-host[data-card-id="{cid}"]'
        fi = 0.12 if c["full"] else 0.25
        js.append(f"tl.set('{sel}',{{visibility:'visible'}},{q(s)});")
        js.append(f"tl.fromTo('{sel}',{{opacity:0}},{{opacity:1,duration:{fi},ease:'power2.out'}},{q(s)});")
        js.extend(c["js"])
        if e < DUR - 0.05:
            js.append(f"tl.to('{sel}',{{opacity:0,duration:{fi},ease:'power2.in'}},{q(e - fi)});")
            js.append(f"tl.set('{sel}',{{visibility:'hidden'}},{q(e)});")

    # PiP: gộp các cutaway liền nhau thành một khoảng để PiP không nhảy ra vào
    wins = []
    for c in sorted(CARDS.values(), key=lambda c: c["s"]):
        if c["pip"]:
            if wins and c["s"] - wins[-1][1] < 0.6:
                wins[-1][1] = c["e"]
            else:
                wins.append([c["s"], c["e"]])
    for s0, e0 in wins:
        js.append(f"tl.set('#video-wrap',{{className:'video-wrapper pip'}},{q(s0)});")
        js.append(f"tl.fromTo('#video-wrap',{{x:0,y:0,scale:1}},{{x:810,y:1470,scale:.22,duration:.45,ease:'power3.inOut'}},{q(s0)});")
        js.append(f"tl.to('#video-wrap',{{x:0,y:0,scale:1,duration:.45,ease:'power3.inOut'}},{q(e0 - 0.3)});")
        js.append(f"tl.set('#video-wrap',{{className:'video-wrapper'}},{q(e0 + 0.15)});")

    # caption
    caps = []
    for i, cap in enumerate(CAPS):
        s, small, key, kind = cap[:4]
        nxt = CAPS[i + 1][0] if i + 1 < len(CAPS) else DUR
        e = cap[4] if len(cap) > 4 else min(nxt, s + 3.4)
        cls = {"k": "kk", "b": "kb", "g": "kg", "r": "kr"}[kind]
        words = "".join(f'<span class="w">{w}</span> ' for w in key.split())
        sm = f'<div class="sm">{small}</div>' if small else ""
        caps.append(f'<div class="cap clip" id="cap-{i}" data-start="{q(s)}" data-duration="{q(e - s)}" data-track-index="5">{sm}<div class="{cls}">{words}</div></div>')
        c = f"#cap-{i}"
        if small:
            js.append(f"tl.fromTo('{c} .sm',{{opacity:0,y:16}},{{opacity:1,y:0,duration:.2,ease:'power2.out'}},{q(s)});")
        js.append(f"tl.fromTo('{c} .w',{{opacity:0,y:20,scale:.85}},{{opacity:1,y:0,scale:1,duration:.26,ease:'back.out(1.7)',stagger:.06}},{q(s + (0.07 if small else 0))});")
        if e < DUR - 0.05:
            js.append(f"tl.to('{c}',{{opacity:0,duration:.08,ease:'power1.in'}},{q(e - 0.08)});")

    # zoom: xen kẽ 1.0 / 1.1 tại mỗi cut; đẩy thêm ở câu nhấn, về lại mức nền ở cut kế tiếp
    base = 1.0
    js.append("tl.set('#video-inner',{scale:1},0);")
    pushes = list(PUSH)
    for t in CUTS:
        base = 1.1 if base == 1.0 else 1.0
        js.append(f"tl.set('#video-inner',{{scale:{base}}},{q(t)});")
    zs = sorted([(t, "cut") for t in CUTS] + [(t, d) for t, d in pushes])
    lvl = 1.0
    for t, v in zs:
        if v == "cut":
            lvl = 1.1 if lvl < 1.05 else 1.0
        elif v:
            js.append(f"tl.to('#video-inner',{{scale:{lvl + v:.2f},duration:.45,ease:'power3.inOut'}},{q(t)});")

    sfx = "\n".join(
        f'<audio id="sfx-{i}" src="sfx/{f}.wav" data-start="{q(t)}" data-duration="{1.0 if f in ("ding", "whoosh") else 0.3}" data-track-index="{11 + i % 4}" data-volume="{v}"></audio>'
        for i, (t, f, v) in enumerate(SFX))

    ff = []
    for fam, slug, wt, st in [("Be Vietnam Pro", "be-vietnam-pro", 400, "normal"), ("Be Vietnam Pro", "be-vietnam-pro", 700, "normal"),
                              ("Be Vietnam Pro", "be-vietnam-pro", 800, "normal"), ("Playfair Display", "playfair-display", 700, "italic"),
                              ("Pacifico", "pacifico", 400, "normal")]:
        for sub, r in FONT_RANGES.items():
            ff.append(f"@font-face{{font-family:'{fam}';src:url('fonts/{slug}-{sub}-{wt}-{st}.woff2') format('woff2');font-weight:{wt};font-style:{st};font-display:block;unicode-range:{r}}}")

    index = f"""<!doctype html>
<html lang="vi"><head><meta charset="utf-8"/>
<style>
{chr(10).join(ff)}
*{{box-sizing:border-box}}
html,body{{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000;font-family:'Be Vietnam Pro','Playfair Display','Pacifico',sans-serif}}
#stage{{position:relative;width:1080px;height:1920px;overflow:hidden;background:{DARK}}}
.video-wrapper{{position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:hidden;transform-origin:0 0}}
.video-wrapper.pip{{z-index:6;border-radius:110px;box-shadow:0 0 0 22px rgba(255,255,255,.9),0 60px 160px rgba(0,0,0,.5)}}
#video-inner{{position:absolute;inset:0;transform-origin:35% 34%}}
#video-inner video{{width:100%;height:100%;object-fit:cover}}
.shade{{position:absolute;left:0;right:0;bottom:0;height:980px;background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.4) 35%,rgba(0,0,0,.66) 100%);pointer-events:none}}
.card-host{{position:absolute;pointer-events:none;overflow:hidden}}
.card-host .card{{position:relative;width:100%;height:100%;overflow:hidden}}
.cap{{position:absolute;z-index:10;left:40px;right:40px;top:1250px;text-align:center;text-shadow:0 4px 18px rgba(0,0,0,.7)}}
.cap .sm{{font:700 46px 'Be Vietnam Pro';color:{WHITE};margin-bottom:2px}}
.cap .w{{display:inline-block}}
.cap .kk{{font:italic 700 92px 'Playfair Display';color:{GOLD};line-height:1.12}}
.cap .kb{{font:800 72px 'Be Vietnam Pro';color:{WHITE};line-height:1.15}}
.cap .kg{{display:inline-block;font:800 80px 'Be Vietnam Pro';color:{GREEN};line-height:1.12;background:rgba(10,10,10,.72);padding:2px 26px 8px;border-radius:20px}}
.cap .kr{{display:inline-block;font:800 80px 'Be Vietnam Pro';color:#FF5A5A;line-height:1.12;background:rgba(10,10,10,.72);padding:2px 26px 8px;border-radius:20px}}
</style></head>
<body>
<div id="stage" data-composition-id="talking-head-recut" data-start="0" data-duration="{q(DUR)}" data-fps="{FPS}" data-width="{W}" data-height="{H}">
<div class="video-wrapper" id="video-wrap"><div id="video-inner">
<video id="bg-video" src="input-video.mp4" muted playsinline data-start="0" data-duration="{q(DUR)}" data-track-index="1"></video>
</div><div class="shade"></div></div>
<audio id="source-audio" src="input-video.mp4" data-start="0" data-duration="{q(DUR)}" data-track-index="10" data-volume="1"></audio>
{sfx}
{chr(10).join(hosts)}
{chr(10).join(caps)}
<script src="vendor/gsap.min.js"></script>
<script>
(function(){{
const tl=window.gsap.timeline({{paused:true}});
{chr(10).join(js)}
window.__timelines=window.__timelines||{{}};
window.__timelines["talking-head-recut"]=tl;
}})();
</script>
</div></body></html>
"""
    (PUB / "index.html").write_text(index)
    (ROOT / "storyboard.json").write_text(json.dumps({
        "schemaVersion": 3,
        "composition": {"fps": FPS, "width": W, "height": H, "durationSeconds": DUR, "layout": "portrait", "themeId": "noir", "seed": 42},
        "videoTrack": {"sourcePath": "input-video.mp4", "startSec": 0, "endSec": DUR},
        "subtitles": {"enabled": True, "style": "kinetic 2 dòng, ngang ngực"},
        "cards": [{"id": k, "startSec": v["s"], "endSec": v["e"], "zone": "fullscreen" if v["full"] else "video-overlay"} for k, v in CARDS.items()],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
