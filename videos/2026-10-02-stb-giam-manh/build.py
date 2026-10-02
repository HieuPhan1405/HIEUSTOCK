#!/usr/bin/env python3
"""Video 2/10/2026 — "STB giảm mạnh 2 phiên: điều đáng chú ý không nằm ở 2 cây nến đỏ" (talking head 9:16, ~1:50).

Sinh public/index.html + public/cards/*.html. Phong cách: .claude/skills/hieu-talking-head-style.
Mốc thời gian lấy từ tokens.json (align.py gióng script.txt với whisper) nên thẻ luôn bám đúng lời nói.
Giá: DNSE (đóng cửa 1/10/2026); số liệu khác theo báo chí/BCTC/báo cáo phân tích. Chạy: python3 build.py
VÙNG AN TOÀN TIKTOK (1080x1920): trên ≥170px, dưới ≤1430px, trái ≥60px, phải ≤940px.
"""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).parent
PUB = ROOT / "public"
FPS, W, H = 30, 1080, 1920
DUR = (lambda o: round(o[-1][1] + o[-1][2], 2))(json.loads((Path(__file__).parent / 'offs.json').read_text()))

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
                  "const el=document.querySelector(%s);if(el)el.textContent=(function(v){const p=v.toFixed(%s).split('.');p[0]=p[0].replace(/\\B(?=(\\d{3})+(?!\\d))/g,'.');return p.join(',');})(o.v)+%s;}},%s);})();"
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


# ── 1) HOOK: STB / 2 PHIÊN ĐỎ / NHƯNG…? ──
t_h1, t_h2, t_h3 = max(T("STB") - 0.1, 0.05), T("hai phiên") - 0.05, T("nhưng điều") - 0.05
t_hook_end = E("nến đỏ", off=0.1)
card("c01-hook", 0.0, t_hook_end, '<div class="s"><div id="h1">STB</div><div id="h2">2 PHIÊN ĐỎ</div><div id="h3">nhưng…?</div></div>', """
SEL .s{position:absolute;left:60px;width:880px;top:185px;text-align:center;line-height:1}
SEL .s div{font-family:'Be Vietnam Pro';font-weight:800;text-shadow:0 5px 0 rgba(0,0,0,.55),0 12px 34px rgba(0,0,0,.65);opacity:0}
SEL #h1{font-size:170px;color:@GOLD@}
SEL #h2{display:inline-block;font-size:100px;color:#FF5A5A;margin:6px 0;padding:0 28px 6px;background:rgba(10,10,10,.78);border-radius:22px;text-shadow:none}
SEL #h3{font:italic 700 110px 'Playfair Display';color:@WHITE@;margin-top:6px}""",
     [fromto("#c01-hook #h1", {"opacity": 0, "scale": 1.6, "y": -30}, {"opacity": 1, "scale": 1, "y": 0, "duration": .35, "ease": "back.out(2)"}, t_h1),
      fromto("#c01-hook #h2", {"opacity": 0, "scale": 1.6, "y": -30}, {"opacity": 1, "scale": 1, "y": 0, "duration": .35, "ease": "back.out(2)"}, t_h2),
      fromto("#c01-hook #h3", {"opacity": 0, "scale": 1.5, "y": -30}, {"opacity": 1, "scale": 1, "y": 0, "duration": .35, "ease": "back.out(2)"}, t_h3)])

# ── 2) Biểu đồ STB (CloudStock) + 2 phiên giảm ──
t_ch_s, t_ch_e = t_hook_end - 0.05, E("gần 7%", off=0.35)
card("c02-chart", t_ch_s, t_ch_e, BRAND_HTML % "c02-br" + """
<div class="chips">
 <div class="chip" id="c02-d1" style="--c:#EF4444"><span>30/9</span><b>−2,37%</b></div>
 <div class="chip" id="c02-d2" style="--c:#EF4444"><span>1/10</span><b>−5,00%</b></div>
 <div class="chip g" id="c02-px"><span>giá còn</span><b>70.300đ</b></div></div>
<div class="frame chart" id="c02-f" style="top:520px;height:700px"><img src="img/chart_STB.jpg" style="object-position:50% 12%"/></div>
<div class="src" style="top:1232px">STB · biểu đồ ngày · khung 3 tháng</div>""", BRAND_CSS + FRAME_CSS + """
SEL .chips{position:absolute;left:60px;width:880px;top:310px;display:flex;gap:14px}
SEL .chip{flex:1;text-align:center;padding:14px 8px;border-radius:20px;background:color-mix(in srgb,var(--c,#555) 16%,#161616);border:2px solid color-mix(in srgb,var(--c,#555) 60%,transparent)}
SEL .chip span{display:block;font:700 28px 'Be Vietnam Pro';color:#bbb} SEL .chip b{font:800 56px 'Be Vietnam Pro';color:var(--c,#fff)}
SEL .chip.g{--c:#F5C542} SEL .chip.g b{color:#F5C542;font-size:50px}""",
     [pop("#c02-br", t_ch_s + 0.05, 0.4), rise("#c02-f", t_ch_s + 0.15, 0.5, 60),
      pop("#c02-d1", T("ngày 30/9") + 0.3, 0.4), pop("#c02-d2", T("sang 1/10") - 0.05, 0.4), pop("#c02-px", T("giá còn") - 0.05, 0.4)],
     full=True, bg=DARKBG)

# ── 3) Câu hỏi: tại sao bị bán mạnh? ──
t_q_s, t_q_e = T("Nhưng câu hỏi") - 0.05, E("như vậy", off=0.3)
card("c03-why", t_q_s, t_q_e, """<div class="p" id="c03-p"><div class="k">CÂU HỎI</div><div class="q">Tại sao STB bị bán <i>mạnh</i> như vậy?</div></div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:22px 30px;PANEL}
SEL .k{font:800 26px 'Be Vietnam Pro';color:@GOLD@;letter-spacing:6px;margin-bottom:4px}
SEL .q{font:800 54px 'Be Vietnam Pro';color:@WHITE@;line-height:1.2} SEL .q i{font:italic 700 66px 'Playfair Display';color:#FF5A5A}""",
     [rise("#c03-p", t_q_s + 0.02, 0.4, -30)])

# ── 4) 01 · Giảm mạnh hơn thị trường + khối ngoại ──
t_c4_s, t_c4_e = T("Đầu tiên") - 0.05, E("36 tỷ", off=0.4)
card("c04-vs", t_c4_s, t_c4_e, """<div class="k" id="c04-k"><b>01</b> · MẠNH HƠN CẢ THỊ TRƯỜNG</div>
<div class="row" id="c04-r1"><div class="nm">VN-Index</div><div class="track"><div class="fill a" id="c04-f1"></div></div><div class="v">−1,09%</div></div>
<div class="row" id="c04-r2"><div class="nm">STB</div><div class="track"><div class="fill b" id="c04-f2"></div></div><div class="v">−5,00%</div></div>
<div class="fx" id="c04-fx"><div class="fl">KHỐI NGOẠI</div><div class="fv">bán ròng ≈ <span id="c04-n">0</span> tỷ</div></div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px} SEL .k b{color:@GOLD@}
SEL .row{position:absolute;left:60px;width:880px;display:flex;align-items:center;gap:20px}
SEL #c04-r1{top:300px} SEL #c04-r2{top:470px}
SEL .nm{width:230px;font:800 46px 'Be Vietnam Pro';color:#fff}
SEL .track{flex:1;height:96px;border-radius:18px;background:#202020;overflow:hidden}
SEL .fill{height:100%;width:0;border-radius:18px} SEL .fill.a{background:#8B8BA8} SEL .fill.b{background:#EF4444}
SEL .v{width:190px;text-align:right;font:800 54px 'Be Vietnam Pro';color:#FF5A5A}
SEL .fx{position:absolute;left:60px;width:880px;top:720px;padding:22px 30px;border-radius:26px;background:color-mix(in srgb,#EF4444 14%,#141414);border:2px solid #EF4444}
SEL .fl{font:700 28px 'Be Vietnam Pro';color:#e3b0b0;letter-spacing:5px;line-height:1.3}
SEL .fv{font:800 66px 'Be Vietnam Pro';color:#fff;line-height:1.25;margin-top:4px} SEL .fv span{color:#FF5A5A}""",
     [rise("#c04-k", t_c4_s + 0.03), rise("#c04-r1", T("VN-Index") - 0.1, 0.4, 30),
      fromto("#c04-f1", {"width": 0}, {"width": "22%", "duration": .7, "ease": "power3.out"}, T("VN-Index")),
      rise("#c04-r2", T("trong khi") - 0.1, 0.4, 30),
      fromto("#c04-f2", {"width": 0}, {"width": "100%", "duration": .8, "ease": "power3.out"}, T("trong khi")),
      rise("#c04-fx", T("Khối ngoại") - 0.1, 0.5, 50), count("#c04-n", T("36") - 0.1, 36, 0.8, wrap="#c04-fx .fv")], full=True, bg=DARKBG, dy=60)

# ── 5) PYN Elite ──
t_c5_s, t_c5_e = T("PYN") - 0.1, E("danh mục", off=0.45)
card("c05-pyn", t_c5_s, t_c5_e, """<div class="k" id="c05-k">QUỸ PYN ELITE · BÁN BỚT STB</div>
<div class="why" id="c05-w">Lý do công bố: đưa tỷ trọng <b>về dưới 20%</b></div>
<div class="bar" id="c05-b"><div class="trk"><div class="fl" id="c05-f"></div><div class="mk" id="c05-m"><span>20%</span></div></div>
<div class="lg" id="c05-l">Sau bán, STB vẫn chiếm <b>≈ <span id="c05-n">0</span>%</b> danh mục</div></div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .why{position:absolute;left:60px;width:880px;top:290px;font:700 42px 'Be Vietnam Pro';color:#fff;line-height:1.25;padding:20px 26px;border-radius:22px;background:#1b1b1b;border:2px solid #333} SEL .why b{color:@GOLD@}
SEL .bar{position:absolute;left:60px;width:880px;top:560px}
SEL .trk{position:relative;height:110px;border-radius:20px;background:#202020;overflow:visible}
SEL .fl{height:100%;width:0;border-radius:20px;background:linear-gradient(90deg,#8B7CF6,#C4B5FD)}
SEL .mk{position:absolute;right:0;top:-24px;bottom:-24px;width:0;border-right:5px dashed @GOLD@} SEL .mk span{position:absolute;right:10px;top:-46px;font:800 34px 'Be Vietnam Pro';color:@GOLD@}
SEL .lg{margin-top:34px;text-align:center;font:700 46px 'Be Vietnam Pro';color:#fff} SEL .lg b{font:800 64px 'Be Vietnam Pro';color:@GOLD@}""",
     [rise("#c05-k", t_c5_s + 0.03), rise("#c05-w", T("lý do") - 0.1, 0.45, 40), rise("#c05-b", T("Sau bán") - 0.5, 0.45, 30),
      fromto("#c05-f", {"width": 0}, {"width": "90%", "duration": 1.0, "ease": "power3.out"}, T("Sau bán")),
      count("#c05-n", T("Sau bán") + 0.1, 18, 0.9, wrap="#c05-l")], full=True, bg=DARKBG, dy=60)

# ── Thẻ chương (cutaway nền kem, giữ ≥ 2s) ──
def chapter(cid, s, e, num, title, sub):
    card(cid, s, e, f"""<div class="bT" id="{cid}-bt"></div><div class="bB" id="{cid}-bb"></div>
<div class="lbl" id="{cid}-l"><div class="n">{num}</div><div class="tt" id="{cid}-tt">{title}</div><div class="sb">{sub}</div></div>""", """
SEL .bT{position:absolute;left:150px;top:0;width:130px;height:520px;background:#3a3a3a;border-radius:0 0 8px 8px}
SEL .bB{position:absolute;right:150px;bottom:0;width:130px;height:560px;background:#3a3a3a;border-radius:8px 8px 0 0}
SEL .lbl{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:30px 50px;border:3px dashed rgba(17,17,17,.45);border-radius:14px;background:rgba(255,255,255,.35);text-align:center;box-shadow:0 18px 40px rgba(0,0,0,.12);white-space:nowrap;max-width:860px}
SEL .n{font:800 40px 'Be Vietnam Pro';color:@DARK@;background:@GOLD@;display:inline-block;padding:4px 20px;border-radius:12px}
SEL .tt{font:italic 700 92px 'Playfair Display';color:@DARK@;line-height:1.2}
SEL .sb{font:400 40px 'Pacifico';color:#555}""",
         [fromto(f"#{cid}-bt", {"y": -560}, {"y": 0, "duration": .3, "ease": "power3.out"}, s),
          fromto(f"#{cid}-bb", {"y": 600}, {"y": 0, "duration": .3, "ease": "power3.out"}, s),
          fromto(f"#{cid}-l", {"opacity": 0, "scale": .85}, {"opacity": 1, "scale": 1, "duration": .3, "ease": "power3.out"}, s + 0.08),
          fromto(f"#{cid}-tt", {"clipPath": "inset(0 100% 0 0)"}, {"clipPath": "inset(0 0% 0 0)", "duration": .4, "ease": "power2.inOut"}, s + 0.1),
          f"tl.to('#{cid}-l',{{scale:1.05,duration:{max(0.5, e - s - 0.5):.2f},ease:'power1.inOut'}},{q(s + 0.4)});"],
         full=True, bg="radial-gradient(120% 80% at 50% 45%,#FFFBF1 0%,#F3EBDA 100%)")



# ── Ý 2: lợi nhuận & nợ xấu ──
t_ch2 = T("Câu chuyện thứ hai") - 0.05
chapter("c06-ch2", t_ch2, T("Sáu tháng") - 0.05, "02", "Lợi nhuận & nợ xấu", "6 tháng đầu năm")

t_c7_s, t_c7_e = T("Sáu tháng") - 0.05, E("một quý", off=0.4)
card("c07-h1", t_c7_s, t_c7_e, BRAND_HTML.replace('<div class="brand"', '<div class="brand" style="opacity:0"') % "c07-br" + """
<div class="k" id="c07-k">SACOMBANK · 6 THÁNG ĐẦU NĂM</div>
<div class="b1" id="c07-b1"><div class="bl">LÃI SAU THUẾ</div><div class="bv"><span id="c07-n1">0</span><small>tỷ</small></div><div class="bc g" id="c07-c1">−49,4% so với cùng kỳ</div></div>
<div class="b1" id="c07-b2"><div class="bl">NỢ XẤU</div><div class="bv">≈ <span id="c07-n2">0</span><small>tỷ</small></div><div class="bc r" id="c07-c2">+16% chỉ trong 1 quý</div></div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .b1{position:absolute;left:60px;width:880px;padding:20px 28px;border-radius:26px;background:#1b1b1b;border:2px solid #333}
SEL #c07-b1{top:290px} SEL #c07-b2{top:640px}
SEL .bl{font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .bv{font:800 130px 'Be Vietnam Pro';color:#fff;line-height:1.2} SEL .bv small{font:700 44px 'Be Vietnam Pro';color:#bbb;margin-left:14px}
SEL .bc{display:inline-block;font:800 40px 'Be Vietnam Pro';color:#111;padding:6px 20px;border-radius:12px}
SEL .bc.g{background:#FF5A5A} SEL .bc.r{background:#FF5A5A}""",
     [rise("#c07-k", t_c7_s + 0.03), rise("#c07-b1", T("lãi sau thuế") - 0.2, 0.5, 50),
      count("#c07-n1", T("2.931") - 0.1, 2931, 1.0, wrap="#c07-b1 .bv"), pop("#c07-c1", T("49,4%") - 0.1, 0.4),
      rise("#c07-b2", T("nợ xấu", 1) - 0.2, 0.5, 50), count("#c07-n2", T("48.000") - 0.1, 48000, 1.0, wrap="#c07-b2 .bv"), pop("#c07-c2", T("tăng khoảng") - 0.05, 0.4)],
     full=True, bg=DARKBG, dy=40)

t_c8_s, t_c8_e = T("SSI") - 0.15, E("điều đáng chú ý", 1, off=0.3)
card("c08-ssi", t_c8_s, t_c8_e, """<div class="p" id="c08-p"><div class="k">SSI DỰ BÁO · LỢI NHUẬN TRƯỚC THUẾ QUÝ 3</div>
<div class="big">≈ <span id="c08-n">0</span> <small>tỷ</small></div><div class="ch" id="c08-c">−45% so với cùng kỳ</div></div>
<div class="pt" id="c08-pt">Nhưng đây mới là điều đáng chú ý →</div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:20px 30px;PANEL}
SEL .k{font:700 24px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:3px}
SEL .big{font:800 112px 'Be Vietnam Pro';color:@WHITE@;line-height:1.2} SEL .big small{font:700 40px 'Be Vietnam Pro';color:#bbb}
SEL .ch{display:inline-block;font:800 38px 'Be Vietnam Pro';color:#111;background:#FF5A5A;padding:6px 18px;border-radius:12px}
SEL .pt{position:absolute;left:60px;top:560px;font:400 46px 'Pacifico';color:@GOLD@;transform:rotate(-3deg);text-shadow:0 3px 12px rgba(0,0,0,.8)}""",
     [rise("#c08-p", t_c8_s + 0.02, 0.4, -30), count("#c08-n", T("2.000") - 0.1, 2000, 0.9, wrap="#c08-p .big"), pop("#c08-c", T("45%") - 0.1, 0.4), pop("#c08-pt", T("Nhưng đây mới") - 0.05, 0.4)])

t_c9_s, t_c9_e = T("VCBS") - 0.15, E("1.500", off=0.6)
card("c09-gap", t_c9_s, t_c9_e, """<div class="k" id="c09-k">DỰ BÁO LỢI NHUẬN TRƯỚC THUẾ QUÝ 3 · STB</div>
<div class="row" id="c09-r1"><div class="nm">SSI</div><div class="track"><div class="fill a" id="c09-f1"></div></div><div class="v">2.000 <small>tỷ</small></div></div>
<div class="row" id="c09-r2"><div class="nm">VCBS</div><div class="track"><div class="fill b" id="c09-f2"></div></div><div class="v">3.542 <small>tỷ</small></div></div>
<div class="gap" id="c09-g">chênh nhau <b>&gt; 1.500 tỷ</b></div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 26px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:3px}
SEL .row{position:absolute;left:60px;width:880px;display:flex;align-items:center;gap:18px}
SEL #c09-r1{top:300px} SEL #c09-r2{top:470px}
SEL .nm{width:150px;font:800 46px 'Be Vietnam Pro';color:#fff}
SEL .track{flex:1;height:96px;border-radius:18px;background:#202020;overflow:hidden}
SEL .fill{height:100%;width:0;border-radius:18px} SEL .fill.a{background:#C9C9D6} SEL .fill.b{background:@GOLD@}
SEL .v{width:270px;text-align:right;font:800 50px 'Be Vietnam Pro';color:#fff} SEL .v small{font:700 28px 'Be Vietnam Pro';color:#bbb}
SEL .gap{position:absolute;left:60px;width:880px;top:700px;text-align:center;font:800 54px 'Be Vietnam Pro';color:#fff;padding:22px;border-radius:24px;background:#1b1b1b;border:2px dashed @GOLD@} SEL .gap b{color:@GOLD@}""",
     [rise("#c09-k", t_c9_s + 0.03), rise("#c09-r1", t_c9_s + 0.1, 0.4, 30), fromto("#c09-f1", {"width": 0}, {"width": "56%", "duration": .8, "ease": "power3.out"}, t_c9_s + 0.3),
      rise("#c09-r2", T("VCBS") + 0.05, 0.4, 30), fromto("#c09-f2", {"width": 0}, {"width": "100%", "duration": .9, "ease": "power3.out"}, T("VCBS") + 0.2),
      pop("#c09-g", T("hai bên") - 0.05, 0.45)], full=True, bg=DARKBG, dy=60)

t_c10_s, t_c10_e = T("Khác biệt") - 0.05, E("chấp thuận", off=0.4)
card("c10-why", t_c10_s, t_c10_e, """<div class="k" id="c10-k">KHÁC BIỆT NẰM Ở · KỲ VỌNG XỬ LÝ NỢ</div>
<div class="it" id="c10-i1"><div class="ic">1</div><div class="tx"><b>Khoản nợ Bamboo Airways</b><span>≈ 3 – 4 nghìn tỷ</span></div></div>
<div class="it" id="c10-i2"><div class="ic">2</div><div class="tx"><b>Đấu giá 32,5% cổ phần</b><span>nhóm ông Trầm Bê · đang chờ NHNN chấp thuận</span></div></div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 26px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:3px}
SEL .it{position:absolute;left:60px;width:880px;display:flex;gap:22px;align-items:center;padding:26px 28px;border-radius:26px;background:#1b1b1b;border:2px solid #333}
SEL #c10-i1{top:300px} SEL #c10-i2{top:560px}
SEL .ic{flex:none;width:86px;height:86px;border-radius:22px;background:@GOLD@;color:@DARK@;font:800 56px 'Be Vietnam Pro';display:flex;align-items:center;justify-content:center}
SEL .tx b{display:block;font:800 46px 'Be Vietnam Pro';color:#fff;line-height:1.2} SEL .tx span{font:700 34px 'Be Vietnam Pro';color:#C4B5FD;line-height:1.3}""",
     [rise("#c10-k", t_c10_s + 0.03), slide("#c10-i1", T("Bamboo") - 0.4, 0.45, -80), slide("#c10-i2", T("đấu giá") - 0.2, 0.45, -80)], full=True, bg=DARKBG, dy=60)

t_c11_s, t_c11_e = T("Nhưng nhớ") - 0.05, E("tăng tương ứng", off=0.4)
card("c11-caveat", t_c11_s, t_c11_e, """<div class="a" id="c11-a">KỲ VỌNG</div><div class="ne" id="c11-ne">≠</div><div class="a" id="c11-b">KẾT QUẢ THỰC TẾ</div>
<div class="bx" id="c11-x"><div class="t1">Nếu xử lý nợ xảy ra →</div><div class="t2">chủ yếu là <b>thu nhập một lần</b></div><div class="t3">≠ lợi nhuận cốt lõi tăng tương ứng</div></div>""", """
SEL .a{position:absolute;left:60px;width:880px;top:250px;text-align:center;font:800 84px 'Be Vietnam Pro';color:@WHITE@}
SEL #c11-b{top:520px;color:@GOLD@;font-size:76px}
SEL .ne{position:absolute;left:60px;width:880px;top:360px;text-align:center;font:800 100px 'Be Vietnam Pro';color:#FF5A5A;line-height:1.3}
SEL .bx{position:absolute;left:60px;width:880px;top:720px;padding:26px 30px;border-radius:26px;background:#1b1b1b;border:2px solid #333}
SEL .t1{font:700 36px 'Be Vietnam Pro';color:#cfcfcf} SEL .t2{font:800 48px 'Be Vietnam Pro';color:#fff;margin:6px 0} SEL .t2 b{color:@GOLD@} SEL .t3{font:700 36px 'Be Vietnam Pro';color:#FF5A5A}""",
     [rise("#c11-a", t_c11_s + 0.05, 0.4, 40), pop("#c11-ne", T("chưa phải") - 0.1, 0.4), rise("#c11-b", T("kết quả") - 0.1, 0.4, 40),
      rise("#c11-x", T("Nếu khoản") - 0.1, 0.5, 50)], full=True, bg=DARKBG, dy=40)

t_c12_s, t_c12_e = T("Vậy nên") - 0.05, E("chưa xảy ra", off=0.5)
card("c12-final", t_c12_s, t_c12_e, """<div class="k" id="c12-k">ĐIỀU ĐÁNG THEO DÕI Ở STB</div>
<div class="q" id="c12-q">Không chỉ là giá giảm <i>bao nhiêu</i>…</div>
<div class="q2" id="c12-q2">Mà là giá hiện tại đang phản ánh bao nhiêu phần của những thứ <b>CHƯA XẢY RA</b></div>""", """
SEL .k{position:absolute;left:60px;width:880px;top:250px;text-align:center;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .q{position:absolute;left:60px;width:880px;top:350px;text-align:center;font:800 60px 'Be Vietnam Pro';color:@WHITE@;line-height:1.2} SEL .q i{font:italic 700 74px 'Playfair Display';color:@GOLD@}
SEL .q2{position:absolute;left:60px;width:880px;top:560px;text-align:center;font:800 56px 'Be Vietnam Pro';color:@WHITE@;line-height:1.3} SEL .q2 b{color:#FF5A5A}""",
     [rise("#c12-k", t_c12_s + 0.05), rise("#c12-q", T("Không") - 0.1 if False else t_c12_s + 0.25, 0.5, 40), rise("#c12-q2", T("mà là") - 0.1, 0.5, 40)], full=True, bg=DARKBG, dy=60)

t_cta_s = T("Lưu video") - 0.05
t_disc = DUR - 3.6
card("c13-cta", t_cta_s, DUR, """<div class="p" id="c13-p"><div class="q">🔖 Lưu video này lại</div>
<div class="sb" id="c13-s">Báo cáo quý 3 → đối chiếu 2 dự báo:</div>
<div class="two"><span class="c1" id="c13-a">SSI ≈ 2.000 tỷ</span><span class="c2" id="c13-b">VCBS ≈ 3.542 tỷ</span></div></div>
<div class="lock" id="c13-l"><img src="img/icon.png"/><div><span>Biểu đồ &amp; dữ liệu tại</span><b>cloudstock.id.vn</b></div></div>
<div class="disc" id="c13-d">Nội dung chia sẻ thông tin, không phải khuyến nghị mua/bán.<br>Dự báo là quan điểm của SSI và VCBS. Số liệu theo báo chí/BCTC, cần đối chiếu. Giá: DNSE.</div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:22px 30px;PANEL}
SEL .q{font:800 54px 'Be Vietnam Pro';color:#fff}
SEL .sb{font:700 32px 'Be Vietnam Pro';color:#cfcfcf;margin:6px 0 10px}
SEL .two{display:flex;gap:14px} SEL .two span{font:800 34px 'Be Vietnam Pro';padding:8px 18px;border-radius:12px}
SEL .c1{background:#C9C9D6;color:#111} SEL .c2{background:@GOLD@;color:#111}
SEL .lock{position:absolute;left:60px;width:880px;top:1100px;display:flex;align-items:center;gap:22px;padding:12px 22px;border-radius:26px;background:rgba(17,17,17,.88);border:2px solid rgba(167,139,250,.55)}
SEL .lock img{width:100px;height:100px;border-radius:22px}
SEL .lock span{display:block;font:700 28px 'Be Vietnam Pro';color:#cfcfcf} SEL .lock b{display:block;font:800 50px 'Be Vietnam Pro';color:#C4B5FD}
SEL .disc{position:absolute;left:60px;width:880px;top:1250px;padding:12px 16px;border-radius:16px;background:rgba(17,17,17,.78);text-align:center;font:400 26px 'Be Vietnam Pro';color:rgba(255,255,255,.95);line-height:1.4}""",
     [rise("#c13-p", t_cta_s + 0.02, 0.4, -30), pop("#c13-a", T("2.000", 1) - 0.1, 0.4), pop("#c13-b", T("3.542", 1) - 0.1, 0.4), rise("#c13-l", t_disc - 0.2, 0.5, 40),
      fromto("#c13-d", {"opacity": 0}, {"opacity": 1, "duration": .4}, t_disc + 0.05)])

# ───────────────────────── ZOOM & SFX ─────────────────────────
CUTS = [round(o[1], 3) for o in OFFS[1:]]
PUSH = [(T("Nhưng câu hỏi"), 0.05), (T("PYN"), 0.04), (T("Vì vậy"), 0.04), (T("Nhưng nhớ"), 0.05), (T("Lưu video"), 0.05)]

SFX = []
for cid, c in CARDS.items():
    SFX.append((c["s"], "whoosh" if c["full"] else "pop", 0.3 if c["full"] else 0.25))
    if c["full"] and c["e"] < DUR - 0.1:
        SFX.append((c["e"] - 0.15, "whoosh", 0.22))
for t in [t_h1, t_h2, t_h3, T("VN-Index"), T("trong khi"), T("Khối ngoại"), T("Bamboo") - 0.3, T("đấu giá") - 0.1]:
    SFX.append((t, "click", 0.3))
for t in [T("2.931") - 0.1, T("48.000") - 0.1, T("2.000") - 0.1, T("VCBS"), T("Sau bán") + 0.1]:
    SFX.append((t, "ding", 0.22))
SFX.sort()

# ───────────────────────── CAPTION TỰ ĐỘNG TỪ TOKENS ─────────────────────────
GOOD = {"lai"}
BAD = {"giam", "ban", "xau", "mat", "chenh"}
KEYS = {"stb", "ssi", "vcbs", "vn index", "khoi ngoai", "pyn", "no xau", "bamboo", "sacombank", "ky vong", "thu nhap", "ty"}


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
