#!/usr/bin/env python3
"""Video 2/10/2026 — "MSN: 2 tổ chức đưa giá mục tiêu >110k, nhưng bất đồng ở vonfram" (talking head 9:16, ~2:40).

Sinh public/index.html + public/cards/*.html. Phong cách: .claude/skills/hieu-talking-head-style.
Mốc thời gian lấy từ tokens.json (align.py gióng script.txt với whisper) nên thẻ luôn bám đúng lời nói.
Giá: DNSE (đóng cửa 1/10/2026); số liệu khác theo báo chí/báo cáo phân tích. Chạy: python3 build.py
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



BR = BRAND_HTML
# ── 1) HOOK: MSN / GIÁ MỤC TIÊU / >110.000 ──
t_h1, t_h2, t_h3 = max(T("MSN") - 0.1, 0.05), T("giá mục tiêu") - 0.05, T("lên tới") - 0.05
t_hook_end = E("nghìn đồng", off=0.1)
card("c01-hook", 0.0, t_hook_end, '<div class="s"><div id="h1">MSN</div><div id="h2">GIÁ MỤC TIÊU</div><div id="h3">&gt; 110.000đ</div></div>', """
SEL .s{position:absolute;left:60px;width:880px;top:185px;text-align:center;line-height:1}
SEL .s div{font-family:'Be Vietnam Pro';font-weight:800;text-shadow:0 5px 0 rgba(0,0,0,.55),0 12px 34px rgba(0,0,0,.65);opacity:0}
SEL #h1{font-size:170px;color:@GOLD@}
SEL #h2{display:inline-block;font-size:84px;color:#22C55E;margin:6px 0;padding:0 28px 6px;background:rgba(10,10,10,.78);border-radius:22px;text-shadow:none}
SEL #h3{font-size:120px;color:#FF5A5A;margin-top:6px}""",
     [fromto("#c01-hook #h1", {"opacity": 0, "scale": 1.6, "y": -30}, {"opacity": 1, "scale": 1, "y": 0, "duration": .35, "ease": "back.out(2)"}, t_h1),
      fromto("#c01-hook #h2", {"opacity": 0, "scale": 1.6, "y": -30}, {"opacity": 1, "scale": 1, "y": 0, "duration": .35, "ease": "back.out(2)"}, t_h2),
      fromto("#c01-hook #h3", {"opacity": 0, "scale": 1.5, "y": -30}, {"opacity": 1, "scale": 1, "y": 0, "duration": .35, "ease": "back.out(2)"}, t_h3)])

# ── 2) Giá mục tiêu HSBC / J.P. Morgan + biểu đồ MSN ──
t_t_s, t_t_e = t_hook_end - 0.05, E("lý do", off=0.4)
card("c02-target", t_t_s, t_t_e, BR % "c02-br" + """
<div class="chips">
 <div class="chip" id="c02-a"><span>HSBC</span><b>111.100</b></div>
 <div class="chip" id="c02-b"><span>J.P. Morgan</span><b>110.000</b></div>
 <div class="chip g" id="c02-c"><span>đóng cửa 1/10</span><b>70.900</b></div></div>
<div class="frame chart" id="c02-f" style="top:520px;height:720px"><img src="img/chart_MSN.jpg" style="object-position:50% 20%"/></div>
<div class="src" style="top:1250px">MSN · biểu đồ ngày · khung 3 tháng · cập nhật trong phiên 2/10</div>""", BRAND_CSS + FRAME_CSS + """
SEL .chips{position:absolute;left:60px;width:880px;top:310px;display:flex;gap:14px}
SEL .chip{flex:1;text-align:center;padding:14px 8px;border-radius:20px;background:#1b1b1b;border:2px solid #3a3a3a}
SEL .chip span{display:block;font:700 26px 'Be Vietnam Pro';color:#bbb} SEL .chip b{font:800 50px 'Be Vietnam Pro';color:#F5C542}
SEL .chip.g b{color:#22C55E}""",
     [pop("#c02-br", t_t_s + 0.05, 0.4), rise("#c02-f", t_t_s + 0.15, 0.5, 60), pop("#c02-a", t_t_s + 0.3, 0.4), pop("#c02-b", t_t_s + 0.55, 0.4),
      pop("#c02-c", T("Sao họ") + 0.1, 0.4)], full=True, bg=DARKBG)

# ── 3) 3 điều ──
t_l_s, t_l_e = T("Mình sẽ đi qua") - 0.05, E("một mảng", off=0.4)
items = [("1", "Lợi nhuận tăng từ đâu"), ("2", "Tin 1/10 về nhà đầu tư Mỹ"), ("3", "Vì sao 2 tổ chức bất đồng")]
lst = "".join(f'<div class="it" id="c03-i{i}"><b>{n}</b><span>{t}</span></div>' for i, (n, t) in enumerate(items))
card("c03-three", t_l_s, t_l_e, f'<div class="p" id="c03-p"><div class="kk">3 ĐIỀU · <i>mình sẽ đi qua</i></div>{lst}</div>', """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:20px 30px 16px;PANEL}
SEL .kk{font:800 30px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px;margin-bottom:6px} SEL .kk i{font:italic 700 44px 'Playfair Display';color:@GOLD@;letter-spacing:0}
SEL .it{display:flex;align-items:center;gap:18px;padding:7px 0}
SEL .it b{font:800 30px 'Be Vietnam Pro';color:@DARK@;background:@GOLD@;border-radius:10px;padding:2px 14px}
SEL .it span{font:700 36px 'Be Vietnam Pro';color:#fff}""",
     [rise("#c03-p", t_l_s + 0.02, 0.4, -30), slide("#c03-i0", T("lợi nhuận") - 0.1, 0.4, -60), slide("#c03-i1", T("nhà đầu tư") - 0.5, 0.4, -60), slide("#c03-i2", T("quan trọng nhất") - 0.1, 0.4, -60)])

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



# ── Điều 1: lợi nhuận từ vonfram ──
t_ch1 = T("Điều thứ nhất") - 0.05
chapter("c04-ch1", t_ch1, t_ch1 + 2.1, "01", "Lợi nhuận từ đâu?", "từ vonfram")

t_m_s, t_m_e = max(T("Công ty con") - 0.1, t_ch1 + 2.15), E("6 tỷ", off=0.4)
card("c05-msr", t_m_s, t_m_e, BR % "c05-br" + """
<div class="hd" id="c05-hd"><b>MSR</b><span>Masan High-Tech Materials</span></div>
<div class="frame chart" id="c05-f" style="top:480px;height:560px"><img src="img/chart_MSR.jpg" style="object-position:50% 25%"/></div>
<div class="res" id="c05-res"><div class="rk">QUÝ 2 · LÃI SAU THUẾ</div><div class="rv">≈ <span id="c05-n">0</span><small>tỷ</small></div></div>
<div class="was" id="c05-w">cùng kỳ năm ngoái: <b>6 tỷ</b></div>
<div class="src" style="top:1050px">MSR · biểu đồ ngày · 3 tháng · cập nhật trong phiên 2/10</div>""", BRAND_CSS + FRAME_CSS + """
SEL .hd{position:absolute;left:60px;top:305px;display:flex;align-items:baseline;gap:18px}
SEL .hd b{font:800 70px 'Be Vietnam Pro';color:#fff} SEL .hd span{font:400 32px 'Be Vietnam Pro';color:#a8a8a8}
SEL .res{position:absolute;left:60px;width:880px;top:1110px}
SEL .rk{font:700 26px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px;line-height:1.3}
SEL .rv{font:800 100px 'Be Vietnam Pro';color:#22C55E;line-height:1.2} SEL .rv small{font:700 36px 'Be Vietnam Pro';color:#bbb;margin-left:12px}
SEL .was{position:absolute;right:60px;top:1150px;font:700 34px 'Be Vietnam Pro';color:#fff;background:rgba(17,17,17,.86);padding:8px 20px;border-radius:14px} SEL .was b{color:@GOLD@}""",
     [pop("#c05-br", t_m_s + 0.05, 0.4), rise("#c05-hd", t_m_s + 0.1), rise("#c05-f", t_m_s + 0.15, 0.5, 60),
      rise("#c05-res", T("quý 2") - 0.1, 0.45, 40), count("#c05-n", T("1.700") - 0.1, 1700, 1.0, wrap="#c05-res .rv"), pop("#c05-w", T("Cùng kỳ") + 0.2, 0.4)], full=True, bg=DARKBG, dy=-40)

t_w_s, t_w_e = T("Giá vonfram") - 0.1, E("một mtu", off=0.5)
card("c06-w", t_w_s, t_w_e, """<div class="k" id="c06-k">GIÁ VONFRAM · QUÝ 2 · TRUNG BÌNH</div>
<div class="big" id="c06-b">≈ <span id="c06-n">0</span></div><div class="un" id="c06-u">USD / mtu</div>
<div class="nt" id="c06-t">mtu: đơn vị giá của vonfram trên thị trường quốc tế</div>""", """
SEL .k{position:absolute;left:60px;width:880px;top:300px;text-align:center;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .big{position:absolute;left:60px;width:880px;top:380px;text-align:center;font:800 190px 'Be Vietnam Pro';color:@GOLD@;line-height:1.2}
SEL .un{position:absolute;left:60px;width:880px;top:620px;text-align:center;font:italic 700 80px 'Playfair Display';color:@WHITE@}
SEL .nt{position:absolute;left:60px;width:880px;top:780px;text-align:center;font:700 34px 'Be Vietnam Pro';color:#C4B5FD;padding:14px;border-radius:16px;background:#1b1b1b}""",
     [rise("#c06-k", t_w_s + 0.05), count("#c06-n", T("3.200") - 0.15, 3200, 0.9, wrap="#c06-b"), rise("#c06-u", T("đô") - 0.1, 0.4, 30), rise("#c06-t", T("đô") + 0.4, 0.45, 30)], full=True, bg=DARKBG, dy=-60)

t_g_s, t_g_e = T("Nhờ vậy") - 0.1, E("4.100 tỷ", off=0.45)
card("c07-fc", t_g_s, t_g_e, """<div class="k" id="c07-k">CẢ TẬP ĐOÀN MASAN</div>
<div class="g1" id="c07-g1"><span>Quý 2</span><b>×2,3</b><small>lần cùng kỳ</small></div>
<div class="k2" id="c07-k2">DỰ BÁO LỢI NHUẬN QUÝ 3</div>
<div class="row" id="c07-r1"><div class="nm">SSI</div><div class="track"><div class="fill a" id="c07-f1"></div></div><div class="v">4.200 <small>tỷ</small></div></div>
<div class="row" id="c07-r2"><div class="nm">VCBS</div><div class="track"><div class="fill b" id="c07-f2"></div></div><div class="v">4.100 <small>tỷ</small></div></div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .g1{position:absolute;left:60px;width:880px;top:270px;padding:18px 28px;border-radius:24px;background:#1b1b1b;border:2px solid #333;display:flex;align-items:baseline;gap:18px}
SEL .g1 span{font:700 38px 'Be Vietnam Pro';color:#cfcfcf} SEL .g1 b{font:800 110px 'Be Vietnam Pro';color:#22C55E;line-height:1.1} SEL .g1 small{font:700 36px 'Be Vietnam Pro';color:#bbb}
SEL .k2{position:absolute;left:60px;top:560px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .row{position:absolute;left:60px;width:880px;display:flex;align-items:center;gap:18px}
SEL #c07-r1{top:640px} SEL #c07-r2{top:790px}
SEL .nm{width:150px;font:800 46px 'Be Vietnam Pro';color:#fff}
SEL .track{flex:1;height:90px;border-radius:18px;background:#202020;overflow:hidden}
SEL .fill{height:100%;width:0;border-radius:18px} SEL .fill.a{background:#C9C9D6} SEL .fill.b{background:@GOLD@}
SEL .v{width:250px;text-align:right;font:800 46px 'Be Vietnam Pro';color:#fff} SEL .v small{font:700 26px 'Be Vietnam Pro';color:#bbb}""",
     [rise("#c07-k", t_g_s + 0.05), rise("#c07-g1", T("quý 2", 2) - 0.1, 0.45, 40), rise("#c07-k2", T("sang quý") - 0.1, 0.4, 20),
      rise("#c07-r1", T("SSI") - 0.1, 0.4, 30), fromto("#c07-f1", {"width": 0}, {"width": "100%", "duration": .8, "ease": "power3.out"}, T("SSI")),
      rise("#c07-r2", T("VCBS") - 0.1, 0.4, 30), fromto("#c07-f2", {"width": 0}, {"width": "97.6%", "duration": .8, "ease": "power3.out"}, T("VCBS"))], full=True, bg=DARKBG, dy=-40)

t_wc_s, t_wc_e = T("Còn mảng") - 0.05, E("cửa hàng", off=0.4)
card("c08-wcm", t_wc_s, t_wc_e, """<div class="p" id="c08-p"><div class="k">BÁN LẺ</div><div class="q">WinCommerce</div><div class="s">vẫn đang <b>mở thêm cửa hàng</b></div></div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:20px 30px;PANEL}
SEL .k{font:800 26px 'Be Vietnam Pro';color:@GOLD@;letter-spacing:6px}
SEL .q{font:800 66px 'Be Vietnam Pro';color:@WHITE@;line-height:1.2} SEL .s{font:700 38px 'Be Vietnam Pro';color:#cfcfcf} SEL .s b{color:#22C55E}""",
     [rise("#c08-p", t_wc_s + 0.02, 0.4, -30)])

# ── Điều 2: Elmet ──
t_ch2 = T("Điều thứ hai") - 0.05
chapter("c09-ch2", t_ch2, t_ch2 + 2.1, "02", "Nhà đầu tư Mỹ", "Elmet · 1/10")

t_e_s, t_e_e = max(T("mua xong") - 0.5, t_ch2 + 2.15), E("Bắc Mỹ", off=0.4)
card("c10-elmet", t_e_s, t_e_e, """<div class="k" id="c10-k">ELMET (MỸ) · NGÀY 1/10 · MUA XONG</div>
<div class="b" id="c10-b1"><div class="l">CỔ PHẦN MSR</div><div class="v">≈ 5<small>%</small></div></div>
<div class="b" id="c10-b2"><div class="l">GIÁ TRỊ</div><div class="v">≈ <span id="c10-n2">0</span><small>tỷ</small></div></div>
<div class="b" id="c10-b3"><div class="l">GIÁ</div><div class="v">≈ <span id="c10-n3">0</span><small>đ / cp</small></div></div>
<div class="pt" id="c10-t">nhà sản xuất Bắc Mỹ</div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 26px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:3px}
SEL .b{position:absolute;left:60px;width:880px;padding:12px 28px;border-radius:24px;background:#1b1b1b;border:2px solid #333}
SEL #c10-b1{top:270px} SEL #c10-b2{top:470px} SEL #c10-b3{top:670px}
SEL .l{font:700 24px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .v{font:800 90px 'Be Vietnam Pro';color:#F5C542;line-height:1.2} SEL .v small{font:700 34px 'Be Vietnam Pro';color:#bbb;margin-left:10px}
SEL .pt{position:absolute;left:60px;top:880px;font:400 46px 'Pacifico';color:#F5C542;transform:rotate(-3deg)}""",
     [rise("#c10-k", t_e_s + 0.05), rise("#c10-b1", T("gần 5%") - 0.2, 0.45, 40), rise("#c10-b2", T("khoảng 3.200", 1) - 0.2, 0.45, 40), count("#c10-n2", T("3.200", 1) - 0.1, 3200, 0.9, wrap="#c10-b2 .v"),
      rise("#c10-b3", T("giá gần") - 0.2, 0.45, 40), count("#c10-n3", T("58.800") - 0.1, 58800, 0.9, wrap="#c10-b3 .v"), pop("#c10-t", T("Bắc Mỹ") - 0.4, 0.4)], full=True, bg=DARKBG, dy=-20)

t_r_s, t_r_e = T("giờ vừa") - 0.05, E("dài hạn", off=0.3)
card("c11-role", t_r_s, t_r_e, """<div class="p" id="c11-p"><div class="k">ELMET</div><div class="a" id="c11-a"><b>✓</b> vừa là <i>cổ đông</i></div><div class="a" id="c11-b"><b>✓</b> vừa ký mua <i>vonfram dài hạn</i></div></div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:20px 30px;PANEL}
SEL .k{font:800 26px 'Be Vietnam Pro';color:@GOLD@;letter-spacing:6px}
SEL .a{font:800 44px 'Be Vietnam Pro';color:#fff;padding:4px 0} SEL .a b{color:#22C55E} SEL .a i{font:italic 700 52px 'Playfair Display';color:@GOLD@}""",
     [rise("#c11-p", t_r_s + 0.02, 0.4, -30), slide("#c11-a", T("vừa là") - 0.1, 0.4, -60), slide("#c11-b", T("ký thỏa") - 0.1, 0.4, -60)])

t_rg_s, t_rg_e = T("Masan còn đăng ký") - 0.1, E("giúp mình", off=0.5)
card("c12-reg", t_rg_s, t_rg_e, """<div class="a" id="c12-a"><div class="l">MASAN CÒN ĐĂNG KÝ BÁN THÊM</div><div class="v">≈ 5<small>% · tháng 10</small></div></div>
<div class="st" id="c12-s">CHỈ MỚI LÀ <i>ĐĂNG KÝ</i></div><div class="st2" id="c12-s2">chưa hoàn tất — anh chị nhớ phân biệt</div>""", """
SEL .a{position:absolute;left:60px;width:880px;top:300px;padding:22px 30px;border-radius:26px;background:#1b1b1b;border:2px solid #333}
SEL .l{font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:3px}
SEL .v{font:800 120px 'Be Vietnam Pro';color:#fff;line-height:1.2} SEL .v small{font:700 40px 'Be Vietnam Pro';color:#bbb;margin-left:10px}
SEL .st{position:absolute;left:150px;width:780px;top:640px;text-align:center;font:800 54px 'Be Vietnam Pro';color:#FF5A5A;border:6px solid #FF5A5A;border-radius:18px;padding:10px 0;transform:rotate(-3deg)} SEL .st i{font:italic 700 62px 'Playfair Display'}
SEL .st2{position:absolute;left:60px;width:880px;top:820px;text-align:center;font:700 36px 'Be Vietnam Pro';color:#cfcfcf}""",
     [rise("#c12-a", t_rg_s + 0.05, 0.45, 40), pop("#c12-s", T("mới là") - 0.1, 0.45), rise("#c12-s2", T("chưa hoàn tất") - 0.1, 0.4, 20)], full=True, bg=DARKBG, dy=-20)

# ── Điều 3: bất đồng ──
t_ch3 = T("Điều thứ 3") - 0.05
chapter("c13-ch3", t_ch3, t_ch3 + 2.1, "03", "Hai cách nhìn", "cùng giá mục tiêu · khác giả định")

t_d_s, t_d_e = max(T("HSBC") - 0.4, t_ch3 + 2.15), E("khác hẳn", off=0.45)
card("c14-diff", t_d_s, t_d_e, """<div class="k" id="c14-k">GIÁ MỤC TIÊU MSN</div>
<div class="row"><div class="c" id="c14-a"><span>HSBC</span><b>111.100</b></div><div class="c" id="c14-b"><span>J.P. Morgan</span><b>110.000</b></div></div>
<div class="ch" id="c14-c">chênh nhau chỉ khoảng <b>1%</b></div>
<div class="bt" id="c14-t">nhưng bên trong thì khác hẳn…</div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:5px}
SEL .row{position:absolute;left:60px;width:880px;top:290px;display:flex;gap:16px}
SEL .c{flex:1;text-align:center;padding:20px 8px;border-radius:24px;background:#1b1b1b;border:2px solid #3a3a3a}
SEL .c span{display:block;font:700 32px 'Be Vietnam Pro';color:#bbb} SEL .c b{font:800 74px 'Be Vietnam Pro';color:#F5C542}
SEL .ch{position:absolute;left:60px;width:880px;top:560px;text-align:center;font:800 46px 'Be Vietnam Pro';color:#fff} SEL .ch b{color:#F5C542;font-size:64px}
SEL .bt{position:absolute;left:60px;width:880px;top:700px;text-align:center;font:italic 700 66px 'Playfair Display';color:#FF5A5A}""",
     [rise("#c14-k", t_d_s + 0.05), pop("#c14-a", T("HSBC") - 0.1, 0.4), pop("#c14-b", T("J.P.") - 0.1, 0.4), rise("#c14-c", T("chênh") - 0.1, 0.45, 30), rise("#c14-t", T("Nhưng bên") - 0.1, 0.5, 30)], full=True, bg=DARKBG, dy=-20)

t_v_s, t_v_e = T("Với MSR") - 0.05, E("năm 2027", off=0.5)
card("c15-view", t_v_s, t_v_e, """<div class="k" id="c15-k">MSR · J.P. MORGAN ĐỊNH GIÁ THẤP HƠN HSBC KHÁ XA</div>
<div class="two">
 <div class="col up" id="c15-h"><div class="n">HSBC</div><div class="tag">NỀN MỚI</div><div class="t">Doanh thu vonfram tăng vọt năm nay → <b>giữ nền đó</b></div></div>
 <div class="col dn" id="c15-j"><div class="n">J.P. Morgan</div><div class="tag">ĐỈNH CHU KỲ</div><div class="t">Lợi nhuận 2026 là <b>đột biến</b> → định giá theo chu kỳ bình thường <b>2027</b></div></div>
</div>""", """
SEL .k{position:absolute;left:60px;top:200px;width:880px;font:700 26px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:2px;line-height:1.3}
SEL .two{position:absolute;left:60px;width:880px;top:300px;display:grid;grid-template-columns:1fr 1fr;gap:18px}
SEL .col{padding:26px 22px;border-radius:26px;background:color-mix(in srgb,var(--c) 12%,#141414);border:3px solid var(--c)}
SEL .up{--c:#22C55E} SEL .dn{--c:#FF5A5A}
SEL .n{font:800 52px 'Be Vietnam Pro';color:#fff} SEL .tag{display:inline-block;margin:8px 0 14px;font:800 30px 'Be Vietnam Pro';color:#111;background:var(--c);padding:4px 16px;border-radius:10px}
SEL .t{font:700 32px 'Be Vietnam Pro';color:#e0e0e0;line-height:1.3} SEL .t b{color:#fff}""",
     [rise("#c15-k", t_v_s + 0.05), slide("#c15-h", T("HSBC", 2) - 0.1, 0.5, -80), slide("#c15-j", T("J.P.", 2) - 0.1, 0.5, 80)], full=True, bg=DARKBG, dy=-20)

t_bs_s, t_bs_e = T("Trong nước") - 0.05, E("gần gấp đôi", off=0.45)
card("c16-bsc", t_bs_s, t_bs_e, """<div class="k" id="c16-k">TRONG NƯỚC CŨNG VẬY · THÁNG 8</div>
<div class="row"><div class="c" id="c16-a"><span>BSC</span><b>dự phóng</b></div><div class="vs" id="c16-vs">≠</div><div class="c" id="c16-b"><span>TCBS</span><b>dự phóng</b></div></div>
<div class="tx" id="c16-t">lợi nhuận cả năm của MSR<br><b>lệch nhau gần gấp đôi</b></div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .row{position:absolute;left:60px;width:880px;top:290px;display:flex;gap:16px;align-items:center}
SEL .c{flex:1;text-align:center;padding:24px 8px;border-radius:24px;background:#1b1b1b;border:2px solid #3a3a3a}
SEL .c span{display:block;font:800 66px 'Be Vietnam Pro';color:#F5C542} SEL .c b{font:700 34px 'Be Vietnam Pro';color:#bbb}
SEL .vs{font:800 80px 'Be Vietnam Pro';color:#FF5A5A}
SEL .tx{position:absolute;left:60px;width:880px;top:560px;text-align:center;font:700 44px 'Be Vietnam Pro';color:#fff;line-height:1.35} SEL .tx b{color:#FF5A5A;font-size:56px}""",
     [rise("#c16-k", t_bs_s + 0.05), pop("#c16-a", T("BSC") - 0.1, 0.4), pop("#c16-vs", T("TCBS") - 0.1, 0.4), pop("#c16-b", T("TCBS") - 0.05, 0.4), rise("#c16-t", T("lệch") - 0.3, 0.5, 30)], full=True, bg=DARKBG, dy=-20)

t_tg_s, t_tg_e = T("giá vonfram tháng") - 0.1, E("kéo theo giảm", off=0.5)
card("c17-risk", t_tg_s, t_tg_e, """<div class="k" id="c17-k">GIÁ VONFRAM (USD / mtu)</div>
<div class="row" id="c17-r1"><div class="nm">TB quý 2</div><div class="track"><div class="fill a" id="c17-f1"></div></div><div class="v">≈ 3.200</div></div>
<div class="row" id="c17-r2"><div class="nm">Tháng 7</div><div class="track"><div class="fill b" id="c17-f2"></div></div><div class="v">≈ 3.050</div></div>
<div class="rk" id="c17-x"><div class="rl">RỦI RO</div><div class="rt">Vonfram là <b>hàng hóa chu kỳ</b> — giá giảm thì lợi nhuận <b>giảm theo</b></div></div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .row{position:absolute;left:60px;width:880px;display:flex;align-items:center;gap:18px}
SEL #c17-r1{top:280px} SEL #c17-r2{top:430px}
SEL .nm{width:210px;font:800 38px 'Be Vietnam Pro';color:#fff}
SEL .track{flex:1;height:84px;border-radius:18px;background:#202020;overflow:hidden}
SEL .fill{height:100%;width:0;border-radius:18px} SEL .fill.a{background:#F5C542} SEL .fill.b{background:#FF5A5A}
SEL .v{width:190px;text-align:right;font:800 44px 'Be Vietnam Pro';color:#fff}
SEL .rk{position:absolute;left:60px;width:880px;top:640px;padding:24px 28px;border-radius:26px;background:color-mix(in srgb,#EF4444 14%,#141414);border:2px solid #EF4444}
SEL .rl{font:800 28px 'Be Vietnam Pro';color:#FF5A5A;letter-spacing:6px} SEL .rt{font:700 44px 'Be Vietnam Pro';color:#fff;line-height:1.3;margin-top:4px} SEL .rt b{color:#F5C542}""",
     [rise("#c17-k", t_tg_s + 0.05), rise("#c17-r1", t_tg_s + 0.15, 0.4, 30), fromto("#c17-f1", {"width": 0}, {"width": "100%", "duration": .8, "ease": "power3.out"}, t_tg_s + 0.3),
      rise("#c17-r2", T("3.050") - 0.5, 0.4, 30), fromto("#c17-f2", {"width": 0}, {"width": "95.3%", "duration": .8, "ease": "power3.out"}, T("3.050") - 0.4),
      rise("#c17-x", T("Nên rủi ro") - 0.1, 0.5, 40)], full=True, bg=DARKBG, dy=-20)

# ── Kết luận ──
t_f1_s, t_f1_e = T("Vậy vì sao") - 0.05, E("đỉnh chu kỳ", 1, off=0.5)
card("c18-why", t_f1_s, t_f1_e, """<div class="k" id="c18-k">VÌ SAO TRÊN 110.000?</div>
<div class="a" id="c18-a">Tin <i>vonfram</i> + <i>bán lẻ</i> đủ lớn<br>để nâng giá trị cả tập đoàn</div>
<div class="b" id="c18-b">NHƯNG chính họ bất đồng:</div>
<div class="r"><span class="x1" id="c18-x1">NỀN MỚI</span><span class="o" id="c18-o">hay</span><span class="x2" id="c18-x2">ĐỈNH CHU KỲ?</span></div>""", """
SEL .k{position:absolute;left:60px;width:880px;top:220px;text-align:center;font:700 30px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:5px}
SEL .a{position:absolute;left:60px;width:880px;top:300px;text-align:center;font:800 48px 'Be Vietnam Pro';color:#fff;line-height:1.3} SEL .a i{font:italic 700 58px 'Playfair Display';color:#F5C542}
SEL .b{position:absolute;left:60px;width:880px;top:560px;text-align:center;font:700 40px 'Be Vietnam Pro';color:#cfcfcf}
SEL .r{position:absolute;left:60px;width:880px;top:650px;text-align:center;display:flex;justify-content:center;align-items:center;gap:16px;flex-wrap:wrap}
SEL .x1{font:800 64px 'Be Vietnam Pro';color:#22C55E} SEL .x2{font:800 64px 'Be Vietnam Pro';color:#FF5A5A} SEL .o{font:400 44px 'Pacifico';color:#cfcfcf}""",
     [rise("#c18-k", t_f1_s + 0.05), rise("#c18-a", T("Vì họ") - 0.1, 0.5, 40), rise("#c18-b", T("Nhưng chính") - 0.1, 0.4, 30), pop("#c18-x1", T("nền mới", 1) - 0.1, 0.4), pop("#c18-o", T("nền mới", 1) + 0.4, 0.3), pop("#c18-x2", T("đỉnh chu kỳ", 1) - 0.1, 0.45)], full=True, bg=DARKBG, dy=-20)

t_f2_s, t_f2_e = T("chỉ trả lời") - 0.3, E("giả định điều gì", off=0.5)
card("c19-ask", t_f2_s, t_f2_e, """<div class="k" id="c19-k">GIÁ MỤC TIÊU CHỈ TRẢ LỜI</div>
<div class="q1" id="c19-q1">“Bao nhiêu?”</div>
<div class="k2" id="c19-k2">ĐIỀU ĐÁNG THEO DÕI</div>
<div class="q2" id="c19-q2">Họ <i>giả định</i> điều gì?</div>""", """
SEL .k{position:absolute;left:60px;width:880px;top:250px;text-align:center;font:700 30px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:5px}
SEL .q1{position:absolute;left:60px;width:880px;top:330px;text-align:center;font:italic 700 110px 'Playfair Display';color:#cfcfcf}
SEL .k2{position:absolute;left:60px;width:880px;top:570px;text-align:center;font:700 30px 'Be Vietnam Pro';color:#F5C542;letter-spacing:5px}
SEL .q2{position:absolute;left:60px;width:880px;top:650px;text-align:center;font:800 80px 'Be Vietnam Pro';color:#fff} SEL .q2 i{font:italic 700 96px 'Playfair Display';color:#F5C542}""",
     [rise("#c19-k", t_f2_s + 0.05), pop("#c19-q1", T("câu hỏi") - 0.1, 0.45), rise("#c19-k2", T("Còn điều") - 0.1, 0.4, 20), rise("#c19-q2", T("theo dõi") - 0.1, 0.5, 40)], full=True, bg=DARKBG, dy=-20)

t_cta_s = T("Lưu video") - 0.05
t_disc = DUR - 3.6
card("c20-cta", t_cta_s, DUR, """<div class="p" id="c20-p"><div class="q">🔖 Lưu video này lại</div>
<div class="sb" id="c20-s">Khi Masan công bố báo cáo quý 3 → đối chiếu lại các dự báo</div></div>
<div class="lock" id="c20-l"><img src="img/icon.png"/><div><span>Biểu đồ &amp; dữ liệu tại</span><b>cloudstock.id.vn</b></div></div>
<div class="disc" id="c20-d">Không phải khuyến nghị đầu tư. Ý kiến cá nhân, không đại diện công ty.<br>Giá mục tiêu là dự phóng của HSBC và J.P. Morgan. Số liệu theo báo chí, cần đối chiếu. Giá: DNSE.</div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:22px 30px;PANEL}
SEL .q{font:800 54px 'Be Vietnam Pro';color:#fff}
SEL .sb{font:700 32px 'Be Vietnam Pro';color:#cfcfcf;margin-top:6px;line-height:1.3}
SEL .lock{position:absolute;left:60px;width:880px;top:1100px;display:flex;align-items:center;gap:22px;padding:12px 22px;border-radius:26px;background:rgba(17,17,17,.88);border:2px solid rgba(167,139,250,.55)}
SEL .lock img{width:100px;height:100px;border-radius:22px}
SEL .lock span{display:block;font:700 28px 'Be Vietnam Pro';color:#cfcfcf} SEL .lock b{display:block;font:800 50px 'Be Vietnam Pro';color:#C4B5FD}
SEL .disc{position:absolute;left:60px;width:880px;top:1250px;padding:12px 16px;border-radius:16px;background:rgba(17,17,17,.78);text-align:center;font:400 26px 'Be Vietnam Pro';color:rgba(255,255,255,.95);line-height:1.4}""",
     [rise("#c20-p", t_cta_s + 0.02, 0.4, -30), rise("#c20-l", t_disc - 0.2, 0.5, 40), fromto("#c20-d", {"opacity": 0}, {"opacity": 1, "duration": .4}, t_disc + 0.05)])

# ───────────────────────── ZOOM & SFX ─────────────────────────
CUTS = [round(o[1], 3) for o in OFFS[1:]]
PUSH = [(T("Mình sẽ đi qua"), 0.05), (T("Công ty con"), 0.04), (T("Nhờ vậy"), 0.05), (T("Với MSR"), 0.05), (T("Vậy vì sao"), 0.05), (T("Lưu video"), 0.05)]

SFX = []
for cid, c in CARDS.items():
    SFX.append((c["s"], "whoosh" if c["full"] else "pop", 0.3 if c["full"] else 0.25))
    if c["full"] and c["e"] < DUR - 0.1:
        SFX.append((c["e"] - 0.15, "whoosh", 0.22))
for t in [t_h1, t_h2, t_h3, T("SSI"), T("VCBS"), T("HSBC", 2), T("J.P.", 2), T("BSC")]:
    SFX.append((t, "click", 0.3))
for t in [T("1.700") - 0.1, T("3.200") - 0.15, T("58.800") - 0.1]:
    SFX.append((t, "ding", 0.22))
SFX.sort()

# ───────────────────────── CAPTION TỰ ĐỘNG TỪ TOKENS ─────────────────────────
GOOD = {"lai", "tang"}
BAD = {"giam", "bat", "dong", "rui"}
KEYS = {"msn", "msr", "hsbc", "jp", "morgan", "vonfram", "elmet", "ssi", "vcbs", "bsc", "tcbs", "gia muc tieu", "wincommerce", "ty", "110"}


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
