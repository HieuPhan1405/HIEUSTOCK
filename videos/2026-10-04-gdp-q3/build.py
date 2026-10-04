#!/usr/bin/env python3
"""Video 4/10/2026 — "GDP quý 3 +9,95% mà VN-Index vẫn giảm 5 phiên" (talking head 9:16, ~2:50).

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
# ── 1) HOOK ──
t_h1, t_h2, t_h3 = max(T("GDP") - 0.1, 0.05), T("tăng 10%") - 0.15, T("giảm 5 phiên") - 0.3
t_hook_end = E("liền", off=0.1)
card("c01-hook", 0.0, t_hook_end, '<div class="s"><div id="h1">GDP QUÝ 3</div><div id="h2">+9,95%</div><div id="h3">VN-Index vẫn giảm 5 phiên</div></div>', """
SEL .s{position:absolute;left:60px;width:880px;top:185px;text-align:center;line-height:1}
SEL .s div{font-family:'Be Vietnam Pro';font-weight:800;text-shadow:0 5px 0 rgba(0,0,0,.55),0 12px 34px rgba(0,0,0,.65);opacity:0}
SEL #h1{font-size:120px;color:@GOLD@}
SEL #h2{display:inline-block;font-size:130px;color:#22C55E;margin:6px 0;padding:0 28px 6px;background:rgba(10,10,10,.8);border-radius:22px;text-shadow:none}
SEL #h3{font:italic 700 66px 'Playfair Display';color:#FF5A5A;margin-top:12px}""",
     [fromto("#c01-hook #h1", {"opacity": 0, "scale": 1.6, "y": -30}, {"opacity": 1, "scale": 1, "y": 0, "duration": .35, "ease": "back.out(2)"}, t_h1),
      fromto("#c01-hook #h2", {"opacity": 0, "scale": 1.6, "y": -30}, {"opacity": 1, "scale": 1, "y": 0, "duration": .35, "ease": "back.out(2)"}, t_h2),
      fromto("#c01-hook #h3", {"opacity": 0, "scale": 1.5, "y": -30}, {"opacity": 1, "scale": 1, "y": 0, "duration": .35, "ease": "back.out(2)"}, t_h3)])

# ── 2) GDP 3 quý ──
t_g_s, t_g_e = t_hook_end - 0.05, E("quý 2", off=0.5)
card("c02-gdp", t_g_s, t_g_e, """<div class="k" id="c02-k">GDP TĂNG SO VỚI CÙNG KỲ · CỤC THỐNG KÊ</div>
<div class="row" id="c02-r1"><div class="nm">Quý 1</div><div class="track"><div class="fill a" id="c02-f1"></div></div><div class="v">8,15%</div></div>
<div class="row" id="c02-r2"><div class="nm">Quý 2</div><div class="track"><div class="fill a" id="c02-f2"></div></div><div class="v">8,81%</div></div>
<div class="row" id="c02-r3"><div class="nm">Quý 3</div><div class="track"><div class="fill b" id="c02-f3"></div></div><div class="v g">9,95%</div></div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 26px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:3px}
SEL .row{position:absolute;left:60px;width:880px;display:flex;align-items:center;gap:16px}
SEL #c02-r1{top:290px} SEL #c02-r2{top:430px} SEL #c02-r3{top:570px}
SEL .nm{width:150px;font:800 42px 'Be Vietnam Pro';color:#fff}
SEL .track{flex:1;height:96px;border-radius:18px;background:#202020;overflow:hidden}
SEL .fill{height:100%;width:0;border-radius:18px} SEL .fill.a{background:#8B8BA8} SEL .fill.b{background:#22C55E}
SEL .v{width:190px;text-align:right;font:800 52px 'Be Vietnam Pro';color:#fff} SEL .v.g{color:#22C55E}""",
     [rise("#c02-k", t_g_s + 0.05), rise("#c02-r1", T("cao hơn cả") - 0.1, 0.4, 30), fromto("#c02-f1", {"width": 0}, {"width": "82%", "duration": .8, "ease": "power3.out"}, T("cao hơn cả")),
      rise("#c02-r2", T("lẫn quý 2") - 0.1, 0.4, 30), fromto("#c02-f2", {"width": 0}, {"width": "88.5%", "duration": .8, "ease": "power3.out"}, T("lẫn quý 2")),
      rise("#c02-r3", T("9,95%") - 0.2, 0.4, 30), fromto("#c02-f3", {"width": 0}, {"width": "100%", "duration": .9, "ease": "power3.out"}, T("9,95%") - 0.1)], full=True, bg=DARKBG, dy=-20)

# ── 3) VN-Index tuần qua ──
t_v_s, t_v_e = T("Cùng lúc đó") - 0.05, E("Sao lại vậy", off=0.45)
card("c03-vni", t_v_s, t_v_e, BR % "c03-br" + """
<div class="chips">
 <div class="chip" id="c03-a" style="--c:#EF4444"><span>VN-Index tuần qua</span><b>−47 điểm</b></div>
 <div class="chip" id="c03-b" style="--c:#EF4444"><span>giảm liên tiếp</span><b>5 phiên</b></div></div>
<div class="frame chart" id="c03-f" style="top:520px;height:700px"><img src="img/chart_VNINDEX.jpg" style="object-position:50% 12%"/></div>
<div class="src" style="top:1232px">VN-Index · biểu đồ ngày · khung 3 tháng · đóng cửa 2/10: 1.737,71</div>""", BRAND_CSS + FRAME_CSS + """
SEL .chips{position:absolute;left:60px;width:880px;top:310px;display:flex;gap:14px}
SEL .chip{flex:1;text-align:center;padding:12px 6px;border-radius:20px;background:color-mix(in srgb,var(--c) 16%,#161616);border:2px solid color-mix(in srgb,var(--c) 60%,transparent)}
SEL .chip span{display:block;font:700 26px 'Be Vietnam Pro';color:#bbb} SEL .chip b{font:800 50px 'Be Vietnam Pro';color:var(--c);white-space:nowrap}""",
     [pop("#c03-br", t_v_s + 0.05, 0.4), rise("#c03-f", t_v_s + 0.15, 0.5, 60), pop("#c03-a", T("mất 47") - 0.1, 0.4), pop("#c03-b", T("Kinh tế") - 0.1, 0.4)], full=True, bg=DARKBG)

# ── 4) 3 điều ──
t_l_s, t_l_e = T("Clip này") - 0.05, E("không tăng theo", off=0.4)
items = [("1", "Tăng trưởng thật đến đâu"), ("2", "Con số làm nhà đầu tư lo"), ("3", "Vì sao GDP tăng, chỉ số không")]
lst = "".join(f'<div class="it" id="c04-i{i}"><b>{n}</b><span>{t}</span></div>' for i, (n, t) in enumerate(items))
card("c04-three", t_l_s, t_l_e, f'<div class="p" id="c04-p"><div class="kk">3 ĐIỀU · <i>mình sẽ nói</i></div>{lst}</div>', """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:20px 30px 16px;PANEL}
SEL .kk{font:800 30px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px;margin-bottom:6px} SEL .kk i{font:italic 700 44px 'Playfair Display';color:@GOLD@;letter-spacing:0}
SEL .it{display:flex;align-items:center;gap:18px;padding:7px 0}
SEL .it b{font:800 30px 'Be Vietnam Pro';color:@DARK@;background:@GOLD@;border-radius:10px;padding:2px 14px}
SEL .it span{font:700 36px 'Be Vietnam Pro';color:#fff}""",
     [rise("#c04-p", t_l_s + 0.02, 0.4, -30), slide("#c04-i0", T("tăng trưởng này") - 0.1, 0.4, -60), slide("#c04-i1", T("một con số") - 0.1, 0.4, -60), slide("#c04-i2", T("quan trọng nhất") - 0.1, 0.4, -60)])

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



# ── Điều 1 ──
t_ch1 = T("Điều thứ nhất") - 0.05
chapter("c05-ch1", t_ch1, t_ch1 + 2.1, "01", "Thật đến đâu?", "tăng trưởng GDP")

t_e_s, t_e_e = max(T("Công nghiệp") - 0.15, t_ch1 + 2.15), E("đều khỏe", off=0.5)
card("c06-eng", t_e_s, t_e_e, """<div class="k" id="c06-k">9 THÁNG · ĐỘNG LỰC TĂNG TRƯỞNG</div>
<div class="b" id="c06-b1"><div class="l">CÔNG NGHIỆP &amp; XÂY DỰNG</div><div class="v">&gt; 11<small>%</small></div></div>
<div class="b" id="c06-b2"><div class="l">XUẤT KHẨU HÀNG HÓA</div><div class="v">&gt; <span id="c06-n">0</span><small>tỷ USD</small> <i>+24,5%</i></div></div>
<div class="b" id="c06-b3"><div class="l">BÁN LẺ</div><div class="v">+13,4<small>%</small></div></div>
<div class="s" id="c06-s">Sức mua nước ngoài lẫn trong nước <b>đều khỏe</b></div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 26px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:3px}
SEL .b{position:absolute;left:60px;width:880px;padding:12px 28px;border-radius:24px;background:#1b1b1b;border:2px solid #333}
SEL #c06-b1{top:270px} SEL #c06-b2{top:440px} SEL #c06-b3{top:610px}
SEL .l{font:700 24px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .v{font:800 86px 'Be Vietnam Pro';color:#22C55E;line-height:1.2} SEL .v small{font:700 34px 'Be Vietnam Pro';color:#bbb;margin-left:10px} SEL .v i{font:800 44px 'Be Vietnam Pro';font-style:normal;color:#F5C542;margin-left:12px}
SEL .s{position:absolute;left:60px;width:880px;top:800px;text-align:center;font:700 40px 'Be Vietnam Pro';color:#fff} SEL .s b{color:#22C55E}""",
     [rise("#c06-k", t_e_s + 0.05), rise("#c06-b1", T("Công nghiệp") - 0.1, 0.45, 40), rise("#c06-b2", T("Xuất khẩu") - 0.1, 0.45, 40),
      count("#c06-n", T("434") - 0.1, 434, 0.9, wrap="#c06-b2 .v"), rise("#c06-b3", T("bán lẻ") - 0.1, 0.45, 40), rise("#c06-s", T("tức là") - 0.1, 0.45, 30)], full=True, bg=DARKBG, dy=-20)

t_9_s, t_9_e = T("Tính cả 9 tháng") - 0.1, E("bức tranh", off=0.5)
card("c07-9m", t_9_s, t_9_e, """<div class="p" id="c07-p"><div class="k">GDP 9 THÁNG</div><div class="big">+9,01<small>%</small></div>
<div class="s">Phát biểu họp báo của Chính phủ: <b>mức cao nhất 15 năm</b></div></div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:20px 30px;PANEL}
SEL .k{font:700 26px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .big{font:800 120px 'Be Vietnam Pro';color:#22C55E;line-height:1.2} SEL .big small{font:700 44px 'Be Vietnam Pro';color:#bbb}
SEL .s{font:700 32px 'Be Vietnam Pro';color:#cfcfcf;line-height:1.3} SEL .s b{color:@GOLD@}""",
     [rise("#c07-p", t_9_s + 0.02, 0.4, -30)])

# ── Điều 2: giá cả ──
t_ch2 = T("Điều thứ 2") - 0.05
chapter("c08-ch2", t_ch2, t_ch2 + 2.1, "02", "Giá cả", "con số làm nhà đầu tư lo")

t_c_s, t_c_e = max(T("CPI tháng 9") - 0.15, t_ch2 + 2.15), E("đúng 1 tháng", off=0.5)
card("c09-cpi", t_c_s, t_c_e, """<div class="k" id="c09-k">THÁNG 9 · SO VỚI THÁNG TRƯỚC</div>
<div class="b" id="c09-b1"><div class="l">CPI</div><div class="v">+<span id="c09-n1">0</span><small>%</small></div><div class="s">chủ yếu vì <b>xăng dầu</b></div></div>
<div class="b" id="c09-b2"><div class="l">GIÁ XĂNG</div><div class="v">&gt; +9<small>%</small></div><div class="s">trong đúng <b>1 tháng</b></div></div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .b{position:absolute;left:60px;width:880px;padding:18px 30px;border-radius:26px;background:color-mix(in srgb,#EF4444 12%,#141414);border:2px solid #EF4444}
SEL #c09-b1{top:280px} SEL #c09-b2{top:560px}
SEL .l{font:700 26px 'Be Vietnam Pro';color:#e3b0b0;letter-spacing:5px}
SEL .v{font:800 130px 'Be Vietnam Pro';color:#FF5A5A;line-height:1.2} SEL .v small{font:700 44px 'Be Vietnam Pro';color:#bbb}
SEL .s{font:700 36px 'Be Vietnam Pro';color:#e0e0e0} SEL .s b{color:@GOLD@}""",
     [rise("#c09-k", t_c_s + 0.05), rise("#c09-b1", T("CPI tháng 9") - 0.1, 0.45, 40), count("#c09-n1", T("0,62%") - 0.1, 0.62, 0.8, dec=2, wrap="#c09-b1 .v"),
      rise("#c09-b2", T("giá xăng") - 0.1, 0.45, 40)], full=True, bg=DARKBG, dy=-20)

t_a_s, t_a_e = T("Giờ nhìn") - 0.05, E("khoảng 4,5%", off=0.5)
card("c10-avg", t_a_s, t_a_e, """<div class="k" id="c10-k">CPI SO VỚI CÙNG KỲ</div>
<div class="row" id="c10-r1"><div class="nm">9 tháng (BQ)</div><div class="track"><div class="fill a" id="c10-f1"></div><div class="tg"></div></div><div class="v">4,52%</div></div>
<div class="row" id="c10-r2"><div class="nm">Quý 3</div><div class="track"><div class="fill a" id="c10-f2"></div><div class="tg"></div></div><div class="v">4,8%</div></div>
<div class="row" id="c10-r3"><div class="nm">Tháng 9</div><div class="track"><div class="fill b" id="c10-f3"></div><div class="tg"></div></div><div class="v r">5,08%</div></div>
<div class="gl" id="c10-g">┆ mục tiêu cả năm (bình quân) <b>≈ 4,5%</b></div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:5px}
SEL .row{position:absolute;left:60px;width:880px;display:flex;align-items:center;gap:14px}
SEL #c10-r1{top:290px} SEL #c10-r2{top:430px} SEL #c10-r3{top:570px}
SEL .nm{width:230px;font:800 34px 'Be Vietnam Pro';color:#fff}
SEL .track{position:relative;flex:1;height:90px;border-radius:18px;background:#202020;overflow:hidden}
SEL .fill{height:100%;width:0;border-radius:18px} SEL .fill.a{background:#C9C9D6} SEL .fill.b{background:#FF5A5A}
SEL .tg{position:absolute;top:0;bottom:0;left:81%;border-left:5px dashed #F5C542}
SEL .v{width:170px;text-align:right;font:800 46px 'Be Vietnam Pro';color:#fff} SEL .v.r{color:#FF5A5A}
SEL .gl{position:absolute;left:60px;width:880px;top:720px;font:700 34px 'Be Vietnam Pro';color:#cfcfcf} SEL .gl b{color:#F5C542}""",
     [rise("#c10-k", t_a_s + 0.05), rise("#c10-r1", T("bình quân 9 tháng") - 0.1, 0.4, 30), fromto("#c10-f1", {"width": 0}, {"width": "84%", "duration": .8, "ease": "power3.out"}, T("bình quân 9 tháng")),
      rise("#c10-r2", T("quý 3", 2) - 0.1, 0.4, 30), fromto("#c10-f2", {"width": 0}, {"width": "89%", "duration": .8, "ease": "power3.out"}, T("quý 3", 2)),
      rise("#c10-r3", T("tháng 9", 1) - 0.1, 0.4, 30), fromto("#c10-f3", {"width": 0}, {"width": "94%", "duration": .8, "ease": "power3.out"}, T("tháng 9", 1)),
      rise("#c10-g", T("mục tiêu cả năm") - 0.1, 0.45, 20)], full=True, bg=DARKBG, dy=-20)

# ── Điều 3: hai mặt của đồng xu ──
t_ch3 = T("Điều thứ 3") - 0.05
chapter("c11-ch3", t_ch3, t_ch3 + 2.1, "03", "Hai mặt một đồng xu", "tăng trưởng nhanh · lãi suất cao")

t_d_s, t_d_e = max(T("Muốn tăng") - 0.1, t_ch3 + 2.15), E("tiền rẻ", off=0.5)
card("c12-cap", t_d_s, t_d_e, """<div class="k" id="c12-k">TĂNG GẦN 10% → CẦN RẤT NHIỀU VỐN</div>
<div class="st" id="c12-s1" style="--c:#F5C542"><b>Tín dụng tăng nhanh</b><span>nhu cầu vốn cao</span></div>
<div class="ar" id="c12-a">↓</div>
<div class="st" id="c12-s2" style="--c:#FF5A5A"><b>Lãi suất huy động</b><span>chịu áp lực tăng · khó trở lại thời tiền rẻ</span></div>
<div class="src" id="c12-src">Theo VnExpress, 3/10</div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .st{position:absolute;left:60px;width:880px;padding:22px 28px;border-radius:26px;background:color-mix(in srgb,var(--c) 12%,#151515);border:2px solid color-mix(in srgb,var(--c) 60%,transparent)}
SEL #c12-s1{top:290px} SEL #c12-s2{top:560px}
SEL .st b{display:block;font:800 58px 'Be Vietnam Pro';color:var(--c)} SEL .st span{font:700 36px 'Be Vietnam Pro';color:#fff}
SEL .ar{position:absolute;left:60px;width:880px;top:440px;text-align:center;font:800 80px 'Be Vietnam Pro';color:#777}
SEL .src{position:absolute;left:60px;top:820px;font:700 28px 'Be Vietnam Pro';color:#8b8bff}""",
     [rise("#c12-k", t_d_s + 0.05), slide("#c12-s1", T("Báo VnExpress") - 0.1, 0.45, -80), rise("#c12-a", T("nên lãi suất") - 0.3, 0.3, -20), slide("#c12-s2", T("nên lãi suất") - 0.1, 0.45, -80), rise("#c12-src", T("viết") + 0.1, 0.3, 10)],
     full=True, bg=DARKBG, dy=-20)

t_r_s, t_r_e = T("Mà lãi suất cao") - 0.05, E("hấp dẫn hơn", off=0.5)
card("c13-rate", t_r_s, t_r_e, """<div class="k" id="c13-k">LÃI SUẤT CAO</div>
<div class="two"><div class="col dn" id="c13-a"><div class="n">DOANH NGHIỆP</div><div class="t">tốn tiền vay <b>hơn</b></div></div>
<div class="col up" id="c13-b"><div class="n">NGƯỜI GỬI</div><div class="t">tiết kiệm <b>hấp dẫn hơn</b></div></div></div>""", """
SEL .k{position:absolute;left:60px;top:200px;font:800 30px 'Be Vietnam Pro';color:#F5C542;letter-spacing:6px}
SEL .two{position:absolute;left:60px;width:880px;top:290px;display:grid;grid-template-columns:1fr 1fr;gap:18px}
SEL .col{padding:30px 22px;border-radius:26px;background:color-mix(in srgb,var(--c) 12%,#141414);border:3px solid var(--c)}
SEL .up{--c:#22C55E} SEL .dn{--c:#FF5A5A}
SEL .n{font:800 28px 'Be Vietnam Pro';color:var(--c);letter-spacing:3px;margin-bottom:10px}
SEL .t{font:800 48px 'Be Vietnam Pro';color:#fff;line-height:1.25} SEL .t b{color:var(--c)}""",
     [rise("#c13-k", t_r_s + 0.05), slide("#c13-a", T("doanh nghiệp") - 0.1, 0.45, -80), slide("#c13-b", T("gửi tiết kiệm") - 0.1, 0.45, 80)], full=True, bg=DARKBG, dy=-20)

t_q4_s, t_q4_e = T("Ông Nguyễn") - 0.05, E("rất thách thức", off=0.5)
card("c14-q4", t_q4_s, t_q4_e, """<div class="who" id="c14-w"><b>Ông Nguyễn Anh Khoa · Agriseco</b><span>nhắc tới giá năng lượng và chi phí vốn khi nhận định rủi ro</span></div>
<div class="k" id="c14-k">ĐỂ CHẠM MỤC TIÊU 10% CẢ NĂM</div>
<div class="big" id="c14-b">QUÝ 4 PHẢI TĂNG <span id="c14-n">0</span>%</div>
<div class="tag" id="c14-t">Cục Thống kê: nhiệm vụ <b>rất thách thức</b></div>""", """
SEL .who{position:absolute;left:60px;width:880px;top:200px;padding:16px 24px;border-radius:20px;background:#1b1b1b;border:2px solid #333}
SEL .who b{display:block;font:800 36px 'Be Vietnam Pro';color:#C4B5FD} SEL .who span{font:700 30px 'Be Vietnam Pro';color:#e0e0e0}
SEL .k{position:absolute;left:60px;top:430px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .big{position:absolute;left:60px;width:880px;top:490px;font:800 74px 'Be Vietnam Pro';color:#fff;line-height:1.2} SEL .big span{color:#FF5A5A;font-size:150px}
SEL .tag{position:absolute;left:60px;width:880px;top:760px;font:700 38px 'Be Vietnam Pro';color:#cfcfcf} SEL .tag b{color:#F5C542}""",
     [rise("#c14-w", t_q4_s + 0.05, 0.45, 30), rise("#c14-k", T("để chạm") - 0.1, 0.4, 20), rise("#c14-b", T("quý 4") - 0.1, 0.5, 40), count("#c14-n", T("12,5%") - 0.1, 12.5, 0.8, dec=1, wrap="#c14-b"),
      rise("#c14-t", T("theo Cục") - 0.1, 0.45, 20)], full=True, bg=DARKBG, dy=-20)

# ── Kết luận ──
t_w_s, t_w_e = T("Vậy vì sao") - 0.05, E("ẩn số", off=0.5)
card("c15-why", t_w_s, t_w_e, """<div class="k" id="c15-k">VÌ SAO GDP GẦN 10% MÀ CHỈ SỐ VẪN GIẢM?</div>
<div class="two">
 <div class="col up" id="c15-a"><div class="n">GDP</div><div class="t">Ảnh chụp <b>quý 3</b></div></div>
 <div class="col dn" id="c15-b"><div class="n">GIÁ CỔ PHIẾU</div><div class="t">Định giá <b>quý 4</b> và những quý sau</div></div></div>
<div class="u" id="c15-u">Ẩn số: <b>lạm phát</b> &amp; <b>lãi suất</b></div>""", """
SEL .k{position:absolute;left:60px;top:200px;width:880px;font:700 26px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:2px;line-height:1.3}
SEL .two{position:absolute;left:60px;width:880px;top:290px;display:grid;grid-template-columns:1fr 1fr;gap:18px}
SEL .col{padding:26px 22px;border-radius:26px;background:color-mix(in srgb,var(--c) 12%,#141414);border:3px solid var(--c)}
SEL .up{--c:#22C55E} SEL .dn{--c:#FF5A5A}
SEL .n{font:800 28px 'Be Vietnam Pro';color:var(--c);letter-spacing:3px;margin-bottom:10px}
SEL .t{font:700 44px 'Be Vietnam Pro';color:#e0e0e0;line-height:1.25} SEL .t b{color:#fff}
SEL .u{position:absolute;left:60px;width:880px;top:640px;text-align:center;font:700 46px 'Be Vietnam Pro';color:#fff} SEL .u b{color:#F5C542}""",
     [rise("#c15-k", t_w_s + 0.05), slide("#c15-a", T("Vì GDP") - 0.1, 0.45, -80), slide("#c15-b", T("còn giá") - 0.1, 0.45, 80), rise("#c15-u", T("ẩn số") - 0.3, 0.45, 20)], full=True, bg=DARKBG, dy=-20)

t_o_s, t_o_e = T("Nếu dầu") - 0.05, E("lực cản", off=0.5)
card("c16-oil", t_o_s, t_o_e, """<div class="a" id="c16-a" style="--c:#22C55E"><div class="n">NẾU DẦU HẠ NHIỆT &amp; LÃI SUẤT KHÔNG NHÍCH THÊM</div><div class="t">Áp lực <b>nhẹ đi</b></div></div>
<div class="a" id="c16-b" style="--c:#FF5A5A"><div class="n">NẾU DẦU VẪN TRÊN 100 USD</div><div class="t">Chi phí vốn còn là <b>lực cản</b></div></div>""", """
SEL .a{position:absolute;left:60px;width:880px;padding:24px 28px;border-radius:26px;background:color-mix(in srgb,var(--c) 12%,#141414);border:3px solid var(--c)}
SEL #c16-a{top:260px} SEL #c16-b{top:520px}
SEL .n{font:800 28px 'Be Vietnam Pro';color:var(--c);letter-spacing:2px;margin-bottom:8px;line-height:1.3}
SEL .t{font:800 56px 'Be Vietnam Pro';color:#fff} SEL .t b{color:var(--c)}""",
     [slide("#c16-a", t_o_s + 0.1, 0.5, -80), slide("#c16-b", T("còn dầu") - 0.1, 0.5, -80)], full=True, bg=DARKBG, dy=-20)

t_x_s, t_x_e = T("Nhớ một câu") - 0.05, E("đắt đến đâu", off=0.6)
card("c17-quote", t_x_s, t_x_e, """<div class="k" id="c17-k">NHỚ MỘT CÂU</div>
<div class="q1" id="c17-q1"><b>GDP</b> cho biết xe chạy <i>nhanh đến đâu</i></div>
<div class="q2" id="c17-q2"><b>Lãi suất</b> cho biết xăng <i>đắt đến đâu</i></div>""", """
SEL .k{position:absolute;left:60px;width:880px;top:260px;text-align:center;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:6px}
SEL .q1,SEL .q2{position:absolute;left:60px;width:880px;text-align:center;font:700 52px 'Be Vietnam Pro';color:#fff;line-height:1.3}
SEL .q1{top:360px} SEL .q2{top:560px}
SEL b{font-weight:800;color:#F5C542} SEL i{font:italic 700 54px 'Playfair Display';color:#22C55E} SEL .q2 i{color:#FF5A5A}""",
     [rise("#c17-k", t_x_s + 0.05), rise("#c17-q1", T("GDP cho") - 0.1, 0.5, 40), rise("#c17-q2", T("còn lãi suất") - 0.1, 0.5, 40)], full=True, bg=DARKBG, dy=-20)

t_cta_s = T("Anh chị muốn") - 0.05
t_disc = DUR - 3.6
card("c18-cta", t_cta_s, DUR, """<div class="p" id="c18-p"><div class="q">Bạn quan tâm <i>nhóm nào?</i></div>
<div class="bub" id="c18-b">Ngân hàng · Bán lẻ — comment ↓</div></div>
<div class="lock" id="c18-l"><img src="img/icon.png"/><div><span>Biểu đồ &amp; dữ liệu tại</span><b>cloudstock.id.vn</b></div></div>
<div class="disc" id="c18-d">Thông tin tổng hợp từ Cục Thống kê và báo chí. Không phải khuyến nghị mua/bán.<br>Ý kiến cá nhân, không đại diện công ty. Giá: DNSE, đóng cửa 2/10/2026.</div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:22px 30px;PANEL}
SEL .q{font:800 54px 'Be Vietnam Pro';color:#fff} SEL .q i{font:italic 700 64px 'Playfair Display';color:@GOLD@}
SEL .bub{display:inline-block;margin-top:12px;font:800 34px 'Be Vietnam Pro';color:@DARK@;background:@WHITE@;padding:10px 24px;border-radius:40px 40px 40px 8px}
SEL .lock{position:absolute;left:60px;width:880px;top:1100px;display:flex;align-items:center;gap:22px;padding:12px 22px;border-radius:26px;background:rgba(17,17,17,.88);border:2px solid rgba(167,139,250,.55)}
SEL .lock img{width:100px;height:100px;border-radius:22px}
SEL .lock span{display:block;font:700 28px 'Be Vietnam Pro';color:#cfcfcf} SEL .lock b{display:block;font:800 50px 'Be Vietnam Pro';color:#C4B5FD}
SEL .disc{position:absolute;left:60px;width:880px;top:1250px;padding:12px 16px;border-radius:16px;background:rgba(17,17,17,.78);text-align:center;font:400 26px 'Be Vietnam Pro';color:rgba(255,255,255,.95);line-height:1.4}""",
     [rise("#c18-p", t_cta_s + 0.02, 0.4, -30), pop("#c18-b", T("Comment") - 0.05, 0.4), rise("#c18-l", t_disc - 0.2, 0.5, 40), fromto("#c18-d", {"opacity": 0}, {"opacity": 1, "duration": .4}, t_disc + 0.05)])

# ───────────────────────── ZOOM & SFX ─────────────────────────
CUTS = [round(o[1], 3) for o in OFFS[1:]]
PUSH = [(T("Clip này"), 0.05), (T("Giờ nhìn"), 0.04), (T("Muốn tăng"), 0.05), (T("Vậy vì sao"), 0.05), (T("Nhớ một câu"), 0.05), (T("Anh chị muốn"), 0.05)]

SFX = []
for cid, c in CARDS.items():
    SFX.append((c["s"], "whoosh" if c["full"] else "pop", 0.3 if c["full"] else 0.25))
    if c["full"] and c["e"] < DUR - 0.1:
        SFX.append((c["e"] - 0.15, "whoosh", 0.22))
for t in [t_h1, t_h2, t_h3, T("9,95%"), T("lẫn quý 2"), T("mất 47"), T("Kinh tế")]:
    SFX.append((t, "click", 0.3))
for t in [T("434") - 0.1, T("0,62%") - 0.1, T("12,5%") - 0.1]:
    SFX.append((t, "ding", 0.22))
SFX.sort()

# ───────────────────────── CAPTION TỰ ĐỘNG TỪ TOKENS ─────────────────────────
GOOD = {"lai", "tang"}
BAD = {"giam", "lo", "chua", "ap", "lan"}
KEYS = {"gdp", "vn index", "cpi", "lai suat", "lam phat", "quy 3", "quy 4", "xang", "tin dung", "gia ca"}


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
