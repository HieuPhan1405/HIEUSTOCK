#!/usr/bin/env python3
"""Video 1/10/2026 — "Gần 300 cổ phiếu HNX sang HOSE: 28/12" (talking head 9:16, ~53s sau khi cắt khoảng lặng).

Sinh public/index.html + public/cards/*.html. Phong cách: .claude/skills/hieu-talking-head-style.
Mốc thời gian lấy từ tokens.json (align.py gióng script.txt với whisper) nên thẻ luôn bám đúng lời nói.
Nguồn: thông báo VNX 30/9/2026 + báo chí. Chạy: python3 build.py
VÙNG AN TOÀN TIKTOK (1080x1920): trên ≥170px, dưới ≤1430px, trái ≥60px, phải ≤940px.
"""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).parent
PUB = ROOT / "public"
FPS, W, H = 30, 1080, 1920
DUR = 44.3

GOLD, GREEN, RED, WHITE, DARK = "#F5C542", "#22C55E", "#EF4444", "#FAFAFA", "#111111"
COLORS = {"@GOLD@": GOLD, "@GREEN@": GREEN, "@RED@": RED, "@WHITE@": WHITE, "@DARK@": DARK}

# Vùng an toàn
SX, SW = 60, 880      # x từ 60, rộng 880 (biên phải 940)
TOP, BOT = 170, 1430  # y an toàn
CAP_TOP = 1170        # caption nằm trong 1170–1430

# Giá đóng cửa 29/9/2026 (DNSE): [đóng cửa, %]
PRICES = {"TRC": (23.8, 3.93), "GVR": (33.3, 3.42), "DPR": (38.75, 3.20), "PHR": (32.7, 2.51)}
NAMES = {"TRC": "Cao su Tây Ninh", "GVR": "Tập đoàn Cao su VN", "DPR": "Cao su Đồng Phú", "PHR": "Cao su Phước Hòa"}

# ───────────────────────── MỐC THỜI GIAN TỪ LỜI NÓI ─────────────────────────
TOK = json.loads((ROOT / "tokens.json").read_text())
OFFS = json.loads((ROOT / "offs.json").read_text())


def _n(w):
    w = unicodedata.normalize("NFD", w.lower().replace("đ", "d"))
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", w)


NT = [_n(t["w"]) for t in TOK]


def _find(phrase, nth=0):
    ws = [_n(x) for x in phrase.split()]
    hits = [i for i in range(len(NT) - len(ws) + 1) if NT[i:i + len(ws)] == ws]
    if len(hits) <= nth:
        raise KeyError(f"không thấy cụm: {phrase!r} (lần {nth})")
    return hits[nth], len(ws)


def T(phrase, nth=0, off=0.0):
    """Thời điểm bắt đầu cụm từ."""
    i, _ = _find(phrase, nth)
    return TOK[i]["s"] + off


def E(phrase, nth=0, off=0.0):
    """Thời điểm kết thúc cụm từ."""
    i, n = _find(phrase, nth)
    return TOK[i + n - 1]["e"] + off


def q(t):
    return f"{round(t * FPS) / FPS:.4f}"


def qd(s, e):
    return f"{round(e * FPS) / FPS - round(s * FPS) / FPS:.4f}"


def fmt_pct(v):
    return ("+" if v > 0 else "−" if v < 0 else "") + f"{abs(v):.2f}".replace(".", ",") + "%"


# ───────────────────────── HELPER JS ─────────────────────────
def fromto(sel, a, b, t):
    return f"tl.fromTo({json.dumps(sel)},{json.dumps(a)},{json.dumps(b)},{q(t)});"


def pop(sel, t, d=0.35):
    return fromto(sel, {"opacity": 0, "scale": .6}, {"opacity": 1, "scale": 1, "duration": d, "ease": "back.out(1.8)"}, t)


def rise(sel, t, d=0.45, dist=40, stagger=0):
    b = {"opacity": 1, "y": 0, "duration": d, "ease": "power3.out"}
    if stagger:
        b["stagger"] = stagger
    return fromto(sel, {"opacity": 0, "y": dist}, b, t)


def slide(sel, t, d=0.45, dist=-120):
    return fromto(sel, {"opacity": 0, "x": dist}, {"opacity": 1, "x": 0, "duration": d, "ease": "power3.out"}, t)


def fade_out(sel, t, d=0.25):
    return f"tl.to({json.dumps(sel)},{{opacity:0,duration:{d},ease:'power2.in'}},{q(t)});"


def draw(sel, t, d=0.6):
    return ("(function(){const el=document.querySelector(%s);if(el){const L=el.getTotalLength();"
            "tl.set(%s,{strokeDasharray:L,strokeDashoffset:L,opacity:0},0);tl.set(%s,{opacity:1},%s);"
            "tl.to(%s,{strokeDashoffset:0,duration:%s,ease:'power2.inOut'},%s);}})();"
            % (json.dumps(sel), json.dumps(sel), json.dumps(sel), q(t), json.dumps(sel), d, q(t)))


def count(sel, t, to, d=0.9, dec=0, suffix="", wrap=None):
    """Đếm số; `wrap` (khối chứa số) ẩn tới lúc bắt đầu đếm để không hiện "0" chờ sẵn."""
    pre = ""
    if wrap:
        pre = (f"tl.set({json.dumps(wrap)},{{opacity:0}},0);"
               f"tl.fromTo({json.dumps(wrap)},{{opacity:0,y:20}},{{opacity:1,y:0,duration:.25,ease:'power2.out'}},{q(t)});")
    return pre + ("(function(){const o={v:0};tl.to(o,{v:%s,duration:%s,ease:'power2.out',onUpdate:function(){"
                  "const el=document.querySelector(%s);if(el)el.textContent=o.v.toFixed(%s).replace('.',',')+%s;}},%s);})();"
                  % (to, d, json.dumps(sel), dec, json.dumps(suffix), q(t)))


# ───────────────────────── CARD ─────────────────────────
CARDS = {}
PANEL = "background:rgba(17,17,17,.86);border-radius:28px;box-shadow:0 18px 50px rgba(0,0,0,.35)"
DARKBG = "radial-gradient(110% 70% at 50% 30%,#1d1d1f 0%,#111111 70%)"


def card(cid, s, e, body, css, js, full=False, bg=None, dy=0):
    css = css.replace("SEL", f'.card[data-card-id="{cid}"]').replace("PANEL", PANEL)
    for k, v in COLORS.items():
        css = css.replace(k, v)
    root_bg = f"background:{bg};" if bg else ""
    if dy:
        body = f'<div style="position:absolute;inset:0;transform:translateY({dy}px)">{body}</div>'
    html = (f'<div class="card" data-card-id="{cid}"><style>'
            f'.card[data-card-id="{cid}"] .root{{position:absolute;inset:0;{root_bg}}}{css}'
            f'</style><div class="root">{body}</div></div>')
    CARDS[cid] = dict(s=s, e=e, track=4 if full else 3, full=full, html=html, js=js)


CELL_CSS = """
SEL .cell{position:relative;display:flex;justify-content:space-between;align-items:center;height:170px;padding:0 34px;border-radius:26px;
 background:color-mix(in srgb,var(--c) 16%,#161616);border:2px solid color-mix(in srgb,var(--c) 55%,transparent)}
SEL .cell .l b{display:block;font:800 64px 'Be Vietnam Pro';color:#fff;letter-spacing:1px;line-height:1.05}
SEL .cell .l span{font:400 28px 'Be Vietnam Pro';color:#a8a8a8}
SEL .cell .r{font:800 72px 'Be Vietnam Pro';color:var(--c)}
"""

BRAND_HTML = '<div class="brand" id="%s"><img src="img/logo.png"/><div><b>CloudStock</b><span>cloudstock.id.vn</span></div></div>'
BRAND_CSS = """
SEL .brand{position:absolute;left:60px;top:190px;display:flex;align-items:center;gap:18px;padding:10px 26px 10px 16px;border-radius:22px;background:rgba(167,139,250,.12);border:2px solid rgba(167,139,250,.45)}
SEL .brand img{height:84px;width:auto}
SEL .brand b{display:block;font:800 46px 'Be Vietnam Pro';color:#fff;line-height:1.05}
SEL .brand span{display:block;font:700 28px 'Be Vietnam Pro';color:#C4B5FD;letter-spacing:1px}"""
FRAME_CSS = """
SEL .frame{position:absolute;left:60px;width:880px;border-radius:28px;overflow:hidden;border:3px solid #2a2a2e;box-shadow:0 30px 80px rgba(0,0,0,.6);background:#131318}
SEL .frame img{display:block;width:100%}
SEL .frame.price img{width:128%}
SEL .frame.chart img{height:100%;object-fit:cover;object-position:50% 30%}
SEL .src{position:absolute;left:60px;font:700 26px 'Be Vietnam Pro';color:#8b8bff;letter-spacing:1px}"""

# ── 1) HOOK: HNX → SANG HOSE → 28/12 (chữ xếp chồng, mỗi từ một màu, hiện dần theo lời) ──
t_h1, t_h2, t_h3 = T("Hà Nội") - 0.35, T("sắp đổi sàn") - 0.05, E("cụ thể") - 0.6
t_hook_end = E("cụ thể", off=0.05)
card("c01-hook", 0.0, t_hook_end, '<div class="s"><div id="h1">HNX</div><div id="h2">SANG HOSE</div><div id="h3">28/12</div></div>', """
SEL .s{position:absolute;left:60px;width:880px;top:185px;text-align:center;line-height:1}
SEL .s div{font-family:'Be Vietnam Pro';font-weight:800;text-shadow:0 5px 0 rgba(0,0,0,.55),0 12px 34px rgba(0,0,0,.65);opacity:0}
SEL #h1{font-size:150px;color:@GOLD@} SEL #h2{display:inline-block;font-size:100px;color:@GREEN@;margin:6px 0;padding:0 28px 6px;background:rgba(10,10,10,.78);border-radius:22px;text-shadow:none} SEL #h3{font-size:150px;color:#FF4D4D}""",
     [fromto("#c01-hook #h1", {"opacity": 0, "scale": 1.6, "y": -30}, {"opacity": 1, "scale": 1, "y": 0, "duration": .35, "ease": "back.out(2)"}, max(t_h1, 0.05)),
      fromto("#c01-hook #h2", {"opacity": 0, "scale": 1.6, "y": -30}, {"opacity": 1, "scale": 1, "y": 0, "duration": .35, "ease": "back.out(2)"}, t_h2),
      fromto("#c01-hook #h3", {"opacity": 0, "scale": 1.6, "y": -30}, {"opacity": 1, "scale": 1, "y": 0, "duration": .35, "ease": "back.out(2)"}, t_h3)])

# ── 2) B-roll: tiêu đề báo 30/9 (thẻ trắng ngà 1/3 trên) ──
t_nw_s, t_nw_e = t_hook_end - 0.1, T("ngày 23/12") + 0.1
card("c02-news", t_nw_s, t_nw_e, """<div class="paper" id="c02-p"><div class="tag">BÁO CHÍ · 30/9/2026</div>
<div class="hl" id="c02-a">Toàn bộ cổ phiếu trên HNX sẽ chuyển sang HOSE từ 28-12<span>Tuổi Trẻ</span></div>
<div class="hl" id="c02-b">Toàn bộ cổ phiếu niêm yết trên sàn HNX sẽ chuyển sang HoSE từ ngày 28/12<span>Dân trí</span></div></div>""", """
SEL .paper{position:absolute;left:60px;width:880px;top:190px;padding:22px 28px 14px;border-radius:24px;background:#F7F3EA;box-shadow:0 20px 50px rgba(0,0,0,.4)}
SEL .tag{display:inline-block;font:800 24px 'Be Vietnam Pro';color:#fff;background:@RED@;padding:4px 14px;border-radius:8px;letter-spacing:3px;margin-bottom:8px}
SEL .hl{font:800 36px 'Be Vietnam Pro';color:@DARK@;line-height:1.22;padding:8px 0;border-top:2px solid rgba(0,0,0,.12)}
SEL .hl span{display:block;font:700 24px 'Be Vietnam Pro';color:#7a6d4a;margin-top:2px}""",
     [rise("#c02-p", t_nw_s + 0.02, 0.45, -40), rise("#c02-a", t_nw_s + 0.2, 0.4, 20), rise("#c02-b", t_nw_s + 0.7, 0.4, 20)])

# ── 3) Sơ đồ 3 mốc (cutaway) ──
t_st_s, t_st_e = T("ngày 23/12") - 0.15, E("sàn HOSE", off=0.35)
steps = [("c03-s1", "23/12", "Thứ Tư", "PHIÊN CUỐI TRÊN HNX", GOLD), ("c03-s2", "24–25/12", "Thứ Năm – Thứ Sáu", "NGỪNG GIAO DỊCH", "#FF4D4D"),
         ("c03-s3", "28/12", "Thứ Hai", "PHIÊN ĐẦU TRÊN HOSE", GREEN)]
rows = "".join(f'<div class="st" id="{i}" style="--c:{c}"><div class="d"><b>{d}</b><span>{w}</span></div><div class="lb">{lb}</div></div>' for i, d, w, lb, c in steps)
card("c03-steps", t_st_s, t_st_e, f"""<div class="k" id="c03-k">LỊCH CHUYỂN SÀN · HNX → HOSE</div>
<div class="line" id="c03-line"></div>{rows}""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:5px}
SEL .line{position:absolute;left:92px;top:400px;width:6px;height:600px;background:linear-gradient(#F5C542,#EF4444,#22C55E);border-radius:3px;transform-origin:top;transform:scaleY(0)}
SEL .st{position:absolute;left:60px;width:880px;display:flex;align-items:center;gap:28px;padding:28px 26px 28px 52px;border-radius:26px;background:color-mix(in srgb,var(--c) 12%,#151515);border:2px solid color-mix(in srgb,var(--c) 60%,transparent)}
SEL #c03-s1{top:300px} SEL #c03-s2{top:580px} SEL #c03-s3{top:860px}
SEL .d b{display:block;font:800 80px 'Be Vietnam Pro';color:var(--c);line-height:1.1;white-space:nowrap} SEL .d span{font:400 30px 'Be Vietnam Pro';color:#a8a8a8}
SEL .lb{font:800 34px 'Be Vietnam Pro';color:#fff;line-height:1.2}""",
     [rise("#c03-k", t_st_s + 0.03),
      slide("#c03-s1", t_st_s + 0.1, 0.45, -80),
      fromto("#c03-line", {"scaleY": 0}, {"scaleY": 1, "duration": E("sàn HOSE") - T("ngày 23/12"), "ease": "none"}, T("ngày 23/12")),
      slide("#c03-s2", T("Hai ngày 24") - 0.1, 0.45, -80), slide("#c03-s3", T("Thứ 2") - 0.1, 0.45, -80)], full=True, bg=DARKBG)

# ── 4) Cổ phiếu giữ nguyên ──
t_kp_s, t_kp_e = t_st_e - 0.05, E("nơi giao dịch", off=0.35)
card("c04-same", t_kp_s, t_kp_e, """<div class="p" id="c04-p"><div class="a">Cổ phiếu bạn đang cầm: <b>giữ nguyên</b></div>
<div class="b" id="c04-b">chỉ đổi nơi giao dịch ✓</div></div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:24px 30px;PANEL}
SEL .a{font:800 44px 'Be Vietnam Pro';color:@WHITE@} SEL .a b{color:@GREEN@}
SEL .b{font:400 48px 'Pacifico';color:@GOLD@;margin-top:6px}""", [rise("#c04-p", t_kp_s + 0.02, 0.4, -30), pop("#c04-b", T("chỉ đổi") - 0.05, 0.4)])

# ── 5) Biên độ ±10% → ±7% (cutaway) ──
t_bd_s, t_bd_e = T("Nhưng có một thứ") - 0.05, E("hẹp lại", off=0.35)
card("c05-band", t_bd_s, t_bd_e, """<div class="k" id="c05-k">BIÊN ĐỘ GIÁ TRONG PHIÊN</div>
<div class="row" id="c05-r1"><div class="nm">HNX</div><div class="track"><div class="fill a" id="c05-f1"></div></div><div class="v">±10%</div></div>
<div class="row" id="c05-r2"><div class="nm">HOSE</div><div class="track"><div class="fill b" id="c05-f2"></div></div><div class="v">±7%</div></div>
<div class="ex" id="c05-ex"><div class="et">Ví dụ minh hoạ · giá tham chiếu 10.000đ</div>
<div class="er"><span>HNX</span><b>9.000 – 11.000</b></div><div class="er"><span>HOSE</span><b>9.300 – 10.700</b></div></div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:5px}
SEL .row{position:absolute;left:60px;width:880px;display:flex;align-items:center;gap:20px}
SEL #c05-r1{top:300px} SEL #c05-r2{top:470px}
SEL .nm{width:170px;font:800 54px 'Be Vietnam Pro';color:#fff}
SEL .track{flex:1;height:110px;border-radius:18px;background:#202020;overflow:hidden}
SEL .fill{height:100%;width:0;border-radius:18px} SEL .fill.a{background:@GOLD@} SEL .fill.b{background:@GREEN@}
SEL .v{width:210px;text-align:right;font:800 72px 'Be Vietnam Pro';color:#fff}
SEL .ex{position:absolute;left:60px;width:880px;top:700px;padding:22px 28px;border-radius:24px;background:#1b1b1b;border:2px solid #333}
SEL .et{font:700 28px 'Be Vietnam Pro';color:#9a9a9a;margin-bottom:8px}
SEL .er{display:flex;justify-content:space-between;align-items:baseline;padding:6px 0} SEL .er span{font:700 40px 'Be Vietnam Pro';color:#cfcfcf} SEL .er b{font:800 62px 'Be Vietnam Pro';color:#fff}""",
     [rise("#c05-k", t_bd_s + 0.03), rise("#c05-r1", T("HNX đang") - 0.1, 0.4, 30),
      fromto("#c05-f1", {"width": 0}, {"width": "100%", "duration": .8, "ease": "power3.out"}, T("HNX đang")),
      rise("#c05-r2", T("sang sàn HOSE") - 0.1, 0.4, 30),
      fromto("#c05-f2", {"width": 0}, {"width": "70%", "duration": .8, "ease": "power3.out"}, T("sang sàn HOSE")),
      rise("#c05-ex", T("Vì vậy") - 0.1, 0.5, 40)], full=True, bg=DARKBG)

# ── 6) Chi tiết kỹ thuật chưa nêu ──
t_dt_s, t_dt_e = T("Chi tiết kỹ thuật") - 0.05, E("công ty chứng khoán", off=0.4)
card("c06-detail", t_dt_s, t_dt_e, """<div class="p" id="c06-p"><div class="k">CHI TIẾT KỸ THUẬT PHIÊN ĐẦU TIÊN</div>
<div class="big">CHƯA <i>công bố</i></div>
<div class="b" id="c06-b">→ theo dõi thông báo của Sở &amp; công ty chứng khoán</div></div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:22px 30px;PANEL}
SEL .k{font:700 24px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:3px}
SEL .big{font:800 78px 'Be Vietnam Pro';color:@RED@;line-height:1.15;margin:4px 0} SEL .big i{font:italic 700 88px 'Playfair Display';color:@WHITE@}
SEL .b{font:700 32px 'Be Vietnam Pro';color:@GOLD@}""", [rise("#c06-p", t_dt_s + 0.02, 0.4, -30), pop("#c06-b", T("anh chị theo dõi") - 0.1, 0.4)])

# ── 7) CTA + disclaimer ──
t_cta_s = T("Anh chị đang cầm mã") - 0.05
t_disc = DUR - 3.6
card("c07-cta", t_cta_s, DUR, """<div class="p" id="c07-p"><div class="q">Bạn đang cầm mã nào trên <i>HNX?</i></div>
<div class="bub" id="c07-b">Comment mã ↓</div></div>
<div class="lock" id="c07-l"><img src="img/icon.png"/><div><span>Biểu đồ &amp; dữ liệu tại</span><b>cloudstock.id.vn</b></div></div>
<div class="disc" id="c07-d">Thông tin tổng hợp từ thông báo của VNX ngày 30/9/2026.<br>Không phải khuyến nghị đầu tư.</div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:22px 30px;PANEL}
SEL .q{font:800 52px 'Be Vietnam Pro';color:#fff} SEL .q i{font:italic 700 62px 'Playfair Display';color:@GOLD@}
SEL .bub{display:inline-block;margin-top:12px;font:800 38px 'Be Vietnam Pro';color:@DARK@;background:@WHITE@;padding:10px 24px;border-radius:40px 40px 40px 8px}
SEL .lock{position:absolute;left:60px;width:880px;top:1150px;display:flex;align-items:center;gap:22px;padding:12px 22px;border-radius:26px;background:rgba(17,17,17,.88);border:2px solid rgba(167,139,250,.55)}
SEL .lock img{width:100px;height:100px;border-radius:22px}
SEL .lock span{display:block;font:700 28px 'Be Vietnam Pro';color:#cfcfcf} SEL .lock b{display:block;font:800 50px 'Be Vietnam Pro';color:#C4B5FD}
SEL .disc{position:absolute;left:60px;width:880px;top:1290px;padding:12px 16px;border-radius:16px;background:rgba(17,17,17,.78);text-align:center;font:400 27px 'Be Vietnam Pro';color:rgba(255,255,255,.95);line-height:1.4}""",
     [rise("#c07-p", t_cta_s + 0.02, 0.4, -30), pop("#c07-b", T("Comment mã") - 0.05, 0.4), rise("#c07-l", t_disc - 0.1, 0.5, 40),
      fromto("#c07-d", {"opacity": 0}, {"opacity": 1, "duration": .4}, t_disc + 0.05)])

# ───────────────────────── ZOOM & SFX ─────────────────────────
CUTS = [round(o[1], 3) for o in OFFS[1:]]
PUSH = [(T("Nhưng có một thứ"), 0.06), (T("HNX đang"), 0.04), (T("Chi tiết kỹ thuật"), 0.04), (T("Anh chị đang cầm mã"), 0.05)]

SFX = []
for cid, c in CARDS.items():
    SFX.append((c["s"], "whoosh" if c["full"] else "pop", 0.3 if c["full"] else 0.25))
    if c["full"] and c["e"] < DUR - 0.1:
        SFX.append((c["e"] - 0.15, "whoosh", 0.22))
for t in [max(t_h1, 0.05), t_h2, t_h3, T("ngày 23/12") - 0.05, T("Hai ngày 24") - 0.05, T("Thứ 2") - 0.05, T("HNX đang"), T("sang sàn HOSE")]:
    SFX.append((t, "click", 0.3))
SFX.sort()

# ───────────────────────── CAPTION TỰ ĐỘNG TỪ TOKENS ─────────────────────────
GOOD = {"tang", "xanh", "lai", "that", "dinh", "lon"}
BAD = {"giam", "thieu", "nham", "xau", "quay"}
KEYS = {"hnx", "hose", "vnx", "bien do", "phien", "thong bao", "gioi han", "gia"}


def chunk_tokens():
    """Chia lời nói thành cụm 1–4 từ theo dấu câu / khoảng ngắt."""
    chunks, cur = [], []
    for i, t in enumerate(TOK):
        cur.append(t)
        w = t["w"]
        nxt = TOK[i + 1] if i + 1 < len(TOK) else None
        gap = (nxt["s"] - t["e"]) if nxt else 9
        chars = sum(len(x["w"]) + 1 for x in cur)
        end = bool(re.search(r"[.,:?!]$", w)) or gap > 0.3 or len(cur) >= 4 or chars > 24
        if end and not (len(cur) == 1 and nxt and gap <= 0.3 and not re.search(r"[.?!]$", w) and len(cur[0]["w"]) < 4):
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    return chunks


def caption_list():
    out = []
    for ch in chunk_tokens():
        words = [re.sub(r"[.,:?!]+$", "", x["w"]) for x in ch]
        text = " ".join(words)
        nt = _n(text)
        n = len(words)
        if n <= 2:
            small, key = "", text
        elif n == 3:
            small, key = words[0], " ".join(words[1:])
        else:
            small, key = " ".join(words[:2]), " ".join(words[2:])
        bad = any(_n(w) in BAD for w in words)
        good = any(_n(w) in GOOD for w in words)
        has_key = any(k in nt for k in KEYS) or bool(re.search(r"\d", text))
        kind = "r" if bad else "g" if good and re.search(r"\d|tang|lai", nt) else "k" if has_key else "b"
        out.append((ch[0]["s"] - 0.03, small, key, kind, ch[-1]["e"] + 0.12))
    # nối cuối với cụm kế: kéo dài tới khi cụm sau bắt đầu nếu khoảng trống ngắn
    fixed = []
    for i, c in enumerate(out):
        s, small, key, kind, e = c
        if i + 1 < len(out):
            e = min(max(e, s + 0.5), out[i + 1][0] - 0.02)
            if out[i + 1][0] - c[4] < 0.25:
                e = out[i + 1][0] - 0.02
        fixed.append((s, small, key, kind, max(e, s + 0.35)))
    return fixed


FONT_RANGES = {
    "latin": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    "latin-ext": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    "vietnamese": "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB",
}


def key_size(text, kind):
    """Cỡ chữ từ khoá: ngắn → to; dài → nhỏ để vừa 880px, tối đa 2 dòng."""
    n = len(text)
    base = 92 if kind == "k" else 80
    if n <= 12:
        return base
    if n <= 17:
        return int(base * 0.86)
    return int(base * 0.72)


def main():
    (PUB / "cards").mkdir(parents=True, exist_ok=True)
    hosts, js = [], []
    chapters = [(c["s"], c["e"]) for cid, c in CARDS.items() if "-ch" in cid]

    for cid, c in CARDS.items():
        s, e = c["s"], c["e"]
        assert e > s + 0.5, (cid, s, e)
        (PUB / "cards" / f"{cid}.html").write_text(c["html"] + "\n")
        hosts.append(f'<div class="card-host clip" id="{cid}" data-card-id="{cid}" data-start="{q(s)}" data-duration="{qd(s, e)}" '
                     f'data-track-index="{c["track"]}" style="left:0;top:0;width:1080px;height:1920px;visibility:hidden;opacity:0;">{c["html"]}</div>')
        sel = f'.card-host[data-card-id="{cid}"]'
        fi = 0.12 if c["full"] else 0.25
        js.append(f"tl.set('{sel}',{{visibility:'visible'}},{q(s)});")
        js.append(f"tl.fromTo('{sel}',{{opacity:0}},{{opacity:1,duration:{fi},ease:'power2.out'}},{q(s)});")
        js.extend(c["js"])
        if e < DUR - 0.05:
            js.append(f"tl.to('{sel}',{{opacity:0,duration:{fi},ease:'power2.in'}},{q(e - fi)});")
            js.append(f"tl.set('{sel}',{{visibility:'hidden'}},{q(e)});")

    # caption (bỏ khi thẻ chương che màn hình và ở 3,6s cuối dành cho disclaimer)
    caps = []
    for i, (s, small, key, kind, e) in enumerate(caption_list()):
        if any(a - 0.05 <= s < b for a, b in chapters) or s >= t_disc - 0.05:
            continue
        for a, b in chapters:
            if s < a < e:
                e = a
        e = min(e, t_disc) if s < t_disc else e
        if e - s < 0.2:
            continue
        cls = {"k": "kk", "b": "kb", "g": "kg", "r": "kr"}[kind]
        fs = key_size(key, kind)
        words = "".join(f'<span class="w">{w}</span> ' for w in key.split())
        sm = f'<div class="sm">{small}</div>' if small else ""
        caps.append(f'<div class="cap clip" id="cap-{i}" data-start="{q(s)}" data-duration="{qd(s, e)}" data-track-index="5">{sm}<div class="{cls}" style="font-size:{fs}px">{words}</div></div>')
        c = f"#cap-{i}"
        if small:
            js.append(f"tl.fromTo('{c} .sm',{{opacity:0,y:16}},{{opacity:1,y:0,duration:.2,ease:'power2.out'}},{q(s)});")
        js.append(f"tl.fromTo('{c} .w',{{opacity:0,y:20,scale:.85}},{{opacity:1,y:0,scale:1,duration:.26,ease:'back.out(1.7)',stagger:.06}},{q(s + (0.07 if small else 0))});")
        if e < DUR - 0.05:
            js.append(f"tl.to('{c}',{{opacity:0,duration:.08,ease:'power1.in'}},{q(e - 0.08)});")

    # zoom: xen kẽ 1.0 / 1.1 tại mỗi jump cut; đẩy nhẹ ở câu nhấn
    js.append("tl.set('#video-inner',{scale:1},0);")
    lvl = 1.0
    events = sorted([(t, None) for t in CUTS] + [(t, v) for t, v in PUSH])
    for t, v in events:
        if v is None:
            lvl = 1.1 if lvl < 1.05 else 1.0
            js.append(f"tl.set('#video-inner',{{scale:{lvl}}},{q(t)});")
        else:
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
#video-inner{{position:absolute;inset:0;transform-origin:35% 34%}}
#video-inner video{{width:100%;height:100%;object-fit:cover}}
.shade{{position:absolute;left:0;right:0;bottom:0;height:980px;background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.4) 35%,rgba(0,0,0,.66) 100%);pointer-events:none}}
.card-host{{position:absolute;pointer-events:none;overflow:hidden}}
.card-host .card{{position:relative;width:100%;height:100%;overflow:hidden}}
.cap{{position:absolute;z-index:10;left:{SX}px;width:{SW}px;top:{CAP_TOP}px;height:{BOT - CAP_TOP}px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;text-align:center;text-shadow:0 4px 18px rgba(0,0,0,.7)}}
.cap .sm{{font:700 46px 'Be Vietnam Pro';color:{WHITE};margin-bottom:2px}}
.cap .w{{display:inline-block}}
.cap .kk{{font-family:'Playfair Display';font-style:italic;font-weight:700;color:{GOLD};line-height:1.1}}
.cap .kb{{font-family:'Be Vietnam Pro';font-weight:800;color:{WHITE};line-height:1.12}}
.cap .kg{{display:inline-block;font-family:'Be Vietnam Pro';font-weight:800;color:{GREEN};line-height:1.1;background:rgba(10,10,10,.72);padding:2px 26px 8px;border-radius:20px}}
.cap .kr{{display:inline-block;font-family:'Be Vietnam Pro';font-weight:800;color:#FF5A5A;line-height:1.1;background:rgba(10,10,10,.72);padding:2px 26px 8px;border-radius:20px}}
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
        "subtitles": {"enabled": True, "style": "kinetic 2 dòng, trong vùng an toàn TikTok"},
        "cards": [{"id": k, "startSec": round(v["s"], 2), "endSec": round(v["e"], 2), "zone": "fullscreen" if v["full"] else "video-overlay"} for k, v in CARDS.items()],
    }, ensure_ascii=False, indent=2))
    print(f"{len(CARDS)} thẻ, {len(caps)} caption, {len(SFX)} sfx")


if __name__ == "__main__":
    main()
