#!/usr/bin/env python3
"""Video 30/9/2026 — "Giá cao su đỉnh 13 năm… nhưng?" (talking head 9:16, ~2:35 sau khi cắt khoảng lặng).

Sinh public/index.html + public/cards/*.html. Phong cách: .claude/skills/hieu-talking-head-style.
Mốc thời gian lấy từ tokens.json (align.py gióng script.txt với whisper) nên thẻ luôn bám đúng lời nói.
Giá: DNSE, đóng cửa phiên 29/9/2026. Chạy: python3 build.py
VÙNG AN TOÀN TIKTOK (1080x1920): trên ≥170px, dưới ≤1430px, trái ≥60px, phải ≤940px.
"""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).parent
PUB = ROOT / "public"
FPS, W, H = 30, 1080, 1920
DUR = 146.85

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

# ── 1) HOOK: "ĐỈNH 13 NĂM" ──
t_hook_a_end = T("cổ phiếu cao su xanh")
card("c01-hook", 0.0, t_hook_a_end, '<div class="t" id="c01-t"><span>ĐỈNH</span> <i>13 năm</i></div>', """
SEL .t{position:absolute;left:60px;width:880px;top:190px;padding:26px 30px;PANEL;text-align:center;font:800 88px 'Be Vietnam Pro';color:@WHITE@}
SEL .t i{font:italic 700 104px 'Playfair Display';color:@GOLD@}""", [rise("#c01-t", 0.08, 0.4, -40)])

# ── 2) Ảnh ghép biểu đồ 4 mã (cutaway) ──
t_mosaic_end = T("Nhưng có một chuyện") - 0.05
mos = "".join(f'<div class="m" id="c02-{s}"><img src="img/chart_{s}.jpg"/><b>{s}</b></div>' for s in ["TRC", "GVR", "DPR", "PHR"])
card("c02-mosaic", t_hook_a_end, t_mosaic_end, BRAND_HTML % "c02-br" + f"""
<div class="grid">{mos}</div>""", BRAND_CSS + """
SEL .grid{position:absolute;left:60px;top:330px;width:880px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
SEL .m{position:relative;height:380px;border-radius:22px;overflow:hidden;border:3px solid #2a2a2e;background:#131318}
SEL .m img{width:100%;height:100%;object-fit:cover;object-position:50% 25%}
SEL .m b{position:absolute;left:16px;bottom:14px;font:800 44px 'Be Vietnam Pro';color:#fff;background:rgba(17,17,17,.8);padding:2px 14px;border-radius:12px}""",
     [pop("#c02-br", t_hook_a_end + 0.05, 0.4), rise("#c02-TRC", t_hook_a_end + 0.15, 0.4, 50), rise("#c02-GVR", t_hook_a_end + 0.3, 0.4, 50),
      rise("#c02-DPR", t_hook_a_end + 0.45, 0.4, 50), rise("#c02-PHR", t_hook_a_end + 0.6, 0.4, 50)],
     full=True, bg=DARKBG)

# ── 3) "NHƯNG…?" ──
t_hook_c_end = T("Trên sàn Singapore") - 0.05
card("c03-but", t_mosaic_end, t_hook_c_end, '<div class="t" id="c03-t"><i>nhưng…</i> <span id="c03-q">?</span></div>', """
SEL .t{position:absolute;left:60px;width:880px;top:190px;padding:22px 30px;PANEL;text-align:center;font:italic 700 110px 'Playfair Display';color:@GOLD@}
SEL .t span{font:800 120px 'Be Vietnam Pro';color:@RED@}""", [rise("#c03-t", t_mosaic_end + 0.02, 0.4, -40), pop("#c03-q", E("để ý") - 0.7, 0.4)])

# ── 4) SGX > 250 cent ──
t_sgx_s, t_sgx_e = T("Trên sàn Singapore"), E("năm 2013", off=0.25)
card("c04-sgx", t_sgx_s, t_sgx_e, """<div class="p" id="c04-p"><div class="k">SÀN SINGAPORE (SGX) · CAO SU TSR20</div>
<div class="big"><span class="gt">&gt;</span><span id="c04-n">0</span><small>US cent/kg</small></div>
<div class="stamp" id="c04-st">CAO NHẤT TỪ ĐẦU 2013</div></div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:22px 34px 30px;PANEL}
SEL .k{font:700 26px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .big{font:800 150px 'Be Vietnam Pro';color:@WHITE@;line-height:1.1;margin-top:10px}
SEL .big .gt{color:@GREEN@;margin-right:8px}
SEL .big small{font:700 38px 'Be Vietnam Pro';color:#bbb;margin-left:14px}
SEL .stamp{display:inline-block;margin-top:6px;font:800 34px 'Be Vietnam Pro';color:@DARK@;background:@GOLD@;padding:6px 20px;border-radius:12px;transform:rotate(-2deg)}""",
     [rise("#c04-p", t_sgx_s + 0.02, 0.4, -30), count("#c04-n", T("250") - 0.15, 250, 1.0, wrap="#c04-p .big"), pop("#c04-st", T("cao nhất kể") + 0.1, 0.4)])

# ── 5) Bảng 4 mã cao su (cutaway) ──
t_bd_s, t_bd_e = T("Phiên vừa rồi") - 0.05, E("xanh theo", off=0.35)
rows, jsb = "", []
for i, s in enumerate(["TRC", "GVR", "DPR", "PHR"]):
    c = GREEN
    rows += (f'<div class="cell" id="c05-{s}" style="--c:{c}"><div class="l"><b>{s}</b><span>{NAMES[s]}</span></div>'
             f'<div class="r">{fmt_pct(PRICES[s][1])}</div></div>')
    jsb.append(pop(f"#c05-{s}", T(s) - 0.1, 0.4))
card("c05-board", t_bd_s, t_bd_e, f"""<div class="hd" id="c05-hd">PHIÊN <i>29/9</i></div><div class="list">{rows}</div>
<div class="src2">Giá đóng cửa · nguồn DNSE</div>""", """
SEL .hd{position:absolute;left:60px;top:190px;font:800 64px 'Be Vietnam Pro';color:@WHITE@}
SEL .hd i{font:italic 700 76px 'Playfair Display';color:@GOLD@}
SEL .list{position:absolute;left:60px;top:320px;width:880px;display:grid;gap:16px}
SEL .src2{position:absolute;left:60px;top:1130px;font:400 24px 'Be Vietnam Pro';color:#777}""" + CELL_CSS,
     [rise("#c05-hd", t_bd_s + 0.05, 0.4)] + jsb, full=True, bg=DARKBG)

# ── 6) Giá hàng lên thì cổ phiếu lên → mua nhầm câu chuyện ──
t_c6_s, t_c6_e = T("Nghe thì dễ hiểu") - 0.05, E("nhầm câu chuyện", off=0.3)
card("c06-story", t_c6_s, t_c6_e, """<div class="p" id="c06-p"><div class="row" id="c06-r"><span class="a">Giá mủ <b>↑</b></span><span class="ar">→</span><span class="a">Cổ phiếu <b>↑</b></span></div>
<div class="wrong" id="c06-w">MUA NHẦM CÂU CHUYỆN?</div></div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:26px 30px;PANEL;text-align:center}
SEL .row{display:flex;justify-content:center;align-items:center;gap:22px}
SEL .a{font:800 56px 'Be Vietnam Pro';color:@WHITE@} SEL .a b{color:@GREEN@}
SEL .ar{font:800 56px 'Be Vietnam Pro';color:@GOLD@}
SEL .wrong{display:none;font:800 62px 'Be Vietnam Pro';color:@RED@;letter-spacing:1px}""",
     [rise("#c06-p", t_c6_s + 0.02, 0.4, -30), pop("#c06-r", T("Giá hàng lên") - 0.1, 0.4),
      f"tl.set('#c06-r',{{display:'none'}},{q(T('Nhưng nếu anh') - 0.05)});tl.set('#c06-w',{{display:'block'}},{q(T('Nhưng nếu anh') - 0.05)});",
      pop("#c06-w", T("Nhưng nếu anh") - 0.05, 0.4)])

# ── 7) 3 chuyện ──
t_c7_s, t_c7_e = T("Hai phút tới") - 0.05, E("nhờ mủ", off=0.25)
items = [("01", "Vì sao giá cao su lên đỉnh"), ("02", "Công ty nào ăn giá mủ thật"), ("03", "Ai kiếm nhiều nhất — không nhờ mủ")]
lst = "".join(f'<div class="it" id="c07-i{i}"><b>{n}</b><span>{t}</span></div>' for i, (n, t) in enumerate(items))
card("c07-three", t_c7_s, t_c7_e, f'<div class="p" id="c07-p"><div class="kk" id="c07-k">2 PHÚT · <i>3 chuyện</i></div>{lst}</div>', """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:22px 30px 16px;PANEL}
SEL .kk{font:800 32px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px;margin-bottom:6px}
SEL .kk i{font:italic 700 46px 'Playfair Display';color:@GOLD@;letter-spacing:0}
SEL .it{display:flex;align-items:center;gap:18px;padding:7px 0}
SEL .it b{font:800 30px 'Be Vietnam Pro';color:@DARK@;background:@GOLD@;border-radius:10px;padding:2px 12px}
SEL .it span{font:700 36px 'Be Vietnam Pro';color:#fff}""",
     [rise("#c07-p", t_c7_s + 0.02, 0.4, -30), pop("#c07-k", t_c7_s + 0.25), slide("#c07-i0", T("Vì sao") - 0.1, 0.4, -60),
      slide("#c07-i1", T("Công ty nào") - 0.1, 0.4, -60), slide("#c07-i2", T("Và chuyện thứ ba") - 0.1, 0.4, -60)])


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


# ── Ý 1 ──
t_ch1 = T("Chuyện thứ nhất") - 0.05
chapter("c08-ch1", t_ch1, t_ch1 + 2.0, "01", "Vì sao giá lên đỉnh?", "cung thiếu · dầu đắt")

t_sh_s, t_sh_e = max(T("dự báo") - 0.15, t_ch1 + 2.05), T("Ba nước") - 0.02
card("c09-short", t_sh_s, t_sh_e, """<div class="k" id="c09-k">THẾ GIỚI 2026 · DỰ BÁO CỦA ANRPC</div>
<div class="bar" id="c09-b1"><div class="lb">Sản xuất</div><div class="track"><div class="fill" id="c09-f1" style="background:#A3A3A3"></div></div><div class="val">15,32 triệu tấn</div></div>
<div class="bar" id="c09-b2"><div class="lb">Tiêu thụ</div><div class="track"><div class="fill" id="c09-f2" style="background:@GOLD@"></div></div><div class="val">15,60 triệu tấn</div></div>
<div class="res" id="c09-res"><div class="rk">THIẾU</div><div class="rv">~<span id="c09-n">0</span></div><div class="ru">nghìn tấn cao su</div></div>""", """
SEL .k{position:absolute;left:60px;top:190px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .bar{position:absolute;left:60px;width:880px} SEL #c09-b1{top:270px} SEL #c09-b2{top:450px}
SEL .lb{font:700 36px 'Be Vietnam Pro';color:#fff}
SEL .track{margin-top:10px;height:50px;border-radius:14px;background:#222;overflow:hidden}
SEL .fill{height:100%;width:0;border-radius:14px}
SEL .val{margin-top:6px;font:800 46px 'Be Vietnam Pro';color:#fff}
SEL .res{position:absolute;left:60px;width:880px;top:690px;padding:24px 30px;border-radius:26px;background:color-mix(in srgb,@RED@ 14%,#141414);border:2px solid @RED@;text-align:center}
SEL .rk{font:800 40px 'Be Vietnam Pro';color:@RED@;letter-spacing:8px;line-height:1.3}
SEL .rv{font:800 170px 'Be Vietnam Pro';color:@WHITE@;line-height:1.3;margin:6px 0}
SEL .ru{font:700 40px 'Be Vietnam Pro';color:#cfcfcf}""",
     [rise("#c09-k", t_sh_s + 0.03), rise("#c09-b1", t_sh_s + 0.1, 0.4),
      fromto("#c09-f1", {"width": 0}, {"width": "98%", "duration": 1, "ease": "power3.out"}, t_sh_s + 0.4),
      rise("#c09-b2", t_sh_s + 0.9, 0.4),
      fromto("#c09-f2", {"width": 0}, {"width": "100%", "duration": 1, "ease": "power3.out"}, t_sh_s + 1.2),
      rise("#c09-res", T("thiếu khoảng") - 0.1, 0.5, 60), count("#c09-n", T("280") - 0.05, 280, 1.0, wrap="#c09-res .rv")],
     full=True, bg=DARKBG, dy=110)

t_ex_s, t_ex_e = T("Ba nước"), E("quá xấu", off=0.2)
card("c10-export", t_ex_s, t_ex_e, """<div class="k" id="c10-k">3 NƯỚC SẢN XUẤT LỚN</div>
<div class="chips"><div class="chip" id="c10-th">Thái Lan</div><div class="chip" id="c10-vn">Việt Nam</div><div class="chip" id="c10-id">Indonesia</div></div>
<div class="res" id="c10-res"><div class="rk">XUẤT KHẨU · 7 THÁNG ĐẦU NĂM</div><div class="rv">−<span id="c10-n">0</span>%</div></div>
<div class="wx" id="c10-wx"><svg width="90" height="70" viewBox="0 0 90 70"><path d="M22 44a16 16 0 0 1 4-31 22 22 0 0 1 42 6 14 14 0 0 1-2 25z" fill="#9aa3b2"/><path d="M28 54l-6 12M46 54l-6 12M64 54l-6 12" stroke="#5aa0ff" stroke-width="5" stroke-linecap="round"/></svg><span>thời tiết vùng trồng quá xấu</span></div>""", """
SEL .k{position:absolute;left:60px;top:190px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:6px}
SEL .chips{position:absolute;left:60px;width:880px;top:260px;display:flex;gap:14px}
SEL .chip{flex:1;text-align:center;padding:22px 8px;border-radius:20px;background:#1e1e1e;border:2px solid #3a3a3a;font:800 40px 'Be Vietnam Pro';color:#fff}
SEL .res{position:absolute;left:60px;width:880px;top:430px;padding:22px 30px;border-radius:26px;background:color-mix(in srgb,@RED@ 14%,#141414);border:2px solid @RED@;text-align:center}
SEL .rk{font:700 30px 'Be Vietnam Pro';color:#e3b0b0;letter-spacing:4px;line-height:1.3}
SEL .rv{font:800 190px 'Be Vietnam Pro';color:@RED@;line-height:1.3;margin-top:6px}
SEL .wx{position:absolute;left:60px;top:850px;display:flex;align-items:center;gap:20px;padding:14px 28px;border-radius:22px;background:#1e1e1e}
SEL .wx span{font:700 40px 'Be Vietnam Pro';color:#fff}""",
     [rise("#c10-k", t_ex_s + 0.02), pop("#c10-th", T("Thái Lan") - 0.1), pop("#c10-vn", T("Việt Nam") - 0.1), pop("#c10-id", T("Indonesia") - 0.1),
      rise("#c10-res", T("xuất khẩu giảm") - 0.1, 0.5, 60), count("#c10-n", T("15%") - 0.1, 15, 0.8, wrap="#c10-res .rv"),
      slide("#c10-wx", T("thời tiết") - 0.1, 0.45, -80)], full=True, bg=DARKBG, dy=120)

t_oil_s, t_oil_e = T("nghe quen") - 0.25, E("đẩy lên", off=0.3)
card("c11-oil", t_oil_s, t_oil_e, """<div class="k" id="c11-k">LÝ DO THỨ HAI</div>
<div class="st" id="c11-s1"><b>Giá dầu</b><span style="color:@GREEN@">tăng</span></div>
<svg class="ar" id="c11-a1" width="60" height="70" viewBox="0 0 60 70"><path d="M30 5 L30 60 M30 60 L14 44 M30 60 L46 44" stroke="#777" stroke-width="7" fill="none" stroke-linecap="round"/></svg>
<div class="st" id="c11-s2"><b>Cao su tổng hợp</b><span style="color:@GREEN@">đắt theo</span></div>
<svg class="ar" id="c11-a2" width="60" height="70" viewBox="0 0 60 70"><path d="M30 5 L30 60 M30 60 L14 44 M30 60 L46 44" stroke="#777" stroke-width="7" fill="none" stroke-linecap="round"/></svg>
<div class="st" id="c11-s3"><b>Nhà máy lốp xe</b><span style="color:@GOLD@">quay sang cao su tự nhiên</span></div>
<div class="note" id="c11-note">giá cao su tự nhiên bị đẩy lên!</div>""", """
SEL .k{position:absolute;left:60px;top:190px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:6px}
SEL #c11-s1{margin-top:270px}
SEL .st{position:relative;left:60px;width:880px;padding:16px 26px;border-radius:20px;background:#1e1e1e;border:2px solid #333;display:flex;justify-content:space-between;align-items:center;gap:12px}
SEL .st b{font:800 40px 'Be Vietnam Pro';color:#fff} SEL .st span{font:800 34px 'Be Vietnam Pro';text-align:right}
SEL .ar{position:relative;left:480px;margin:6px 0}
SEL .note{position:absolute;left:60px;top:960px;font:400 44px 'Pacifico';color:@GOLD@;transform:rotate(-3deg);text-shadow:0 3px 12px rgba(0,0,0,.8)}""",
     [rise("#c11-k", t_oil_s + 0.03), slide("#c11-s1", T("giá dầu") - 0.1, 0.4, -80), rise("#c11-a1", T("Cao su tổng hợp") - 0.2, 0.3, -20),
      slide("#c11-s2", T("Cao su tổng hợp") - 0.05, 0.4, -80), rise("#c11-a2", T("nhà máy lốp xe") - 0.2, 0.3, -20),
      slide("#c11-s3", T("nhà máy lốp xe") - 0.05, 0.4, -80), pop("#c11-note", T("giá càng") - 0.05, 0.4)], full=True, bg=DARKBG, dy=100)

# ── Ý 2 ──
t_ch2 = T("Chuyện thứ hai") - 0.05
chapter("c12-ch2", t_ch2, t_ch2 + 2.0, "02", "Ai ăn giá mủ thật?", "tiền vào thật")


def web_price(cid, sym, top=330, h=345):
    return (f'<div class="frame price" id="{cid}-pf" style="top:{top}px;height:{h}px"><img src="img/price_{sym}.jpg"/></div>')


t_dpr_s, t_dpr_e = max(T("Đồng Phú") - 0.45, t_ch2 + 2.05), E("khoảng 11%", off=0.3)
card("c13-dpr", t_dpr_s, t_dpr_e, BRAND_HTML % "c13-br" + """
<div class="hd" id="c13-hd"><b>DPR</b><span>Cao su Đồng Phú</span></div>""" + web_price("c13", "DPR", 400) + """
<div class="res" id="c13-res"><div class="rk">LÃI SAU THUẾ QUÝ 2</div><div class="rv"><span id="c13-n">0</span><small>tỷ đồng</small></div><div class="chip" id="c13-ch">+60% so với cùng kỳ</div></div>
<div class="why" id="c13-why">giá bán mủ bình quân <b>+11%</b></div>""", BRAND_CSS + FRAME_CSS + """
SEL .hd{position:absolute;left:60px;top:296px;display:flex;align-items:baseline;gap:18px}
SEL .hd b{font:800 70px 'Be Vietnam Pro';color:#fff} SEL .hd span{font:400 34px 'Be Vietnam Pro';color:#a8a8a8}
SEL .res{position:absolute;left:60px;width:880px;top:770px;padding:0}
SEL .rk{font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px;line-height:1.3}
SEL .rv{font:800 110px 'Be Vietnam Pro';color:@GREEN@;line-height:1.25;margin-top:4px} SEL .rv small{font:700 36px 'Be Vietnam Pro';color:#bbb;margin-left:14px}
SEL .chip{position:absolute;right:0;top:20px;font:800 38px 'Be Vietnam Pro';color:@DARK@;background:@GREEN@;padding:6px 18px;border-radius:12px}
SEL .why{position:absolute;left:60px;top:1000px;font:700 36px 'Be Vietnam Pro';color:#fff;background:rgba(17,17,17,.86);padding:8px 22px;border-radius:14px}
SEL .why b{color:@GREEN@}""",
     [pop("#c13-br", t_dpr_s + 0.03, 0.4), rise("#c13-hd", t_dpr_s + 0.1), rise("#c13-pf", t_dpr_s + 0.15, 0.5, 60),
      count("#c13-n", T("gần 100") - 0.1, 99.7, 1.0, dec=1, wrap="#c13-res .rv"), pop("#c13-ch", T("gần 60%") - 0.05, 0.4), pop("#c13-why", T("Lý do chính") - 0.05, 0.4)],
     full=True, bg=DARKBG)

t_gvr_s, t_gvr_e = T("Ông lớn GVR") - 0.1, E("68%", off=0.35)
card("c14-gvr", t_gvr_s, t_gvr_e, BRAND_HTML % "c14-br" + """
<div class="hd" id="c14-hd"><b>GVR</b><span>Tập đoàn Cao su VN · 6 tháng đầu năm</span></div>""" + web_price("c14", "GVR", 400) + """
<div class="two"><div class="box" id="c14-b1"><div class="rk">DOANH THU BÁN MỦ</div><div class="rv">+<span id="c14-n1">0</span>%</div></div>
<div class="box" id="c14-b2"><div class="rk">LÃI RÒNG</div><div class="rv">+<span id="c14-n2">0</span>%</div></div></div>""", BRAND_CSS + FRAME_CSS + """
SEL .hd{position:absolute;left:60px;top:296px;display:flex;align-items:baseline;gap:18px}
SEL .hd b{font:800 70px 'Be Vietnam Pro';color:#fff} SEL .hd span{font:400 30px 'Be Vietnam Pro';color:#a8a8a8}
SEL .two{position:absolute;left:60px;width:880px;top:790px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
SEL .box{padding:18px 22px;border-radius:24px;background:color-mix(in srgb,@GREEN@ 14%,#141414);border:2px solid @GREEN@}
SEL .rk{font:700 26px 'Be Vietnam Pro';color:#cfcfcf;letter-spacing:2px;line-height:1.3}
SEL .rv{font:800 108px 'Be Vietnam Pro';color:@GREEN@;line-height:1.25;margin-top:4px}""",
     [pop("#c14-br", t_gvr_s + 0.03, 0.4), rise("#c14-hd", t_gvr_s + 0.1), rise("#c14-pf", t_gvr_s + 0.15, 0.5, 60),
      count("#c14-n1", T("doanh thu bán mủ") + 0.4, 44, 0.8, wrap="#c14-b1"), count("#c14-n2", T("lãi ròng") + 0.1, 68, 0.9, wrap="#c14-b2")],
     full=True, bg=DARKBG)

t_kh_s, t_kh_e = T("Tới đây thì") - 0.05, E("thú vị nhất", off=0.25)
card("c15-fit", t_kh_s, t_kh_e, """<div class="p" id="c15-p"><div class="a">Khớp với câu chuyện giá cao su <b>✓</b></div>
<div class="b" id="c15-b">nhưng chưa phải chỗ thú vị nhất →</div></div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:22px 30px;PANEL}
SEL .a{font:800 42px 'Be Vietnam Pro';color:@WHITE@} SEL .a b{color:@GREEN@}
SEL .b{font:400 46px 'Pacifico';color:@GOLD@;margin-top:8px}""",
     [rise("#c15-p", t_kh_s + 0.02, 0.4, -30), pop("#c15-b", T("Nhưng chưa") - 0.05, 0.4)])

# ── Ý 3: twist ──
t_ch3 = T("Chuyện thứ ba", 1) - 0.05
chapter("c16-ch3", t_ch3, t_ch3 + 2.3, "03", "Không nhờ mủ?", "cũng là lý do làm video này")

t_phr_s, t_phr_e = max(T("Phước Hòa") - 0.5, t_ch3 + 2.35), E("nhóm", off=0.3)
card("c17-phr", t_phr_s, t_phr_e, BRAND_HTML % "c17-br" + """
<div class="hd" id="c17-hd"><b>PHR</b><span>Cao su Phước Hòa</span></div>""" + web_price("c17", "PHR", 390) + """
<div class="frame chart" id="c17-cf" style="top:750px;height:240px"><img src="img/chart_PHR.jpg"/></div>
<div class="stat" id="c17-st"><span>Lãi quý 2 ≈</span><b><span id="c17-n">0</span> tỷ</b><i id="c17-x">gấp ~4 lần</i></div>""", BRAND_CSS + FRAME_CSS + """
SEL .hd{position:absolute;left:60px;top:290px;display:flex;align-items:baseline;gap:18px}
SEL .hd b{font:800 70px 'Be Vietnam Pro';color:#fff} SEL .hd span{font:400 34px 'Be Vietnam Pro';color:#a8a8a8}
SEL .stat{position:absolute;left:60px;width:880px;top:1020px;display:flex;align-items:baseline;gap:16px}
SEL .stat span{font:700 40px 'Be Vietnam Pro';color:#cfcfcf} SEL .stat b{font:800 84px 'Be Vietnam Pro';color:@GREEN@}
SEL .stat i{font:italic 700 56px 'Playfair Display';color:@GOLD@}""",
     [pop("#c17-br", t_phr_s + 0.03, 0.4), rise("#c17-hd", t_phr_s + 0.1), rise("#c17-pf", t_phr_s + 0.15, 0.5, 60), rise("#c17-cf", t_phr_s + 0.4, 0.5, 60),
      count("#c17-n", T("370") - 0.1, 370, 0.9, wrap="#c17-st"), pop("#c17-x", T("gấp 4") - 0.05, 0.4)],
     full=True, bg=DARKBG)

t_58_s, t_58_e = T("Nhưng khoảng 58%") - 0.1, E("VSIP 3", off=0.35)
card("c18-58", t_58_s, t_58_e, """<div class="k" id="c18-k">LỢI NHUẬN TRƯỚC THUẾ QUÝ 2 · PHR</div>
<div class="donut" id="c18-d"><svg width="420" height="420" viewBox="0 0 420 420"><circle cx="210" cy="210" r="170" stroke="#2a2a2e" stroke-width="44" fill="none"/>
<circle id="c18-arc" cx="210" cy="210" r="170" stroke="@GOLD@" stroke-width="44" fill="none" stroke-linecap="butt" transform="rotate(-90 210 210)"/></svg>
<div class="pc"><span id="c18-n">0</span>%</div></div>
<div class="lg" id="c18-lg"><b>~58%</b> đến từ <i>thu nhập khác</i></div>
<div class="chip2" id="c18-vs">chủ yếu: đền bù đất KCN <b>VSIP 3</b></div>
<div class="src2">Theo BCTC quý 2/2026 của PHR (số liệu báo chí, cần đối chiếu)</div>""", """
SEL .k{position:absolute;left:60px;top:190px;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .donut{position:absolute;left:330px;top:270px;width:420px;height:420px}
SEL .pc{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:800 120px 'Be Vietnam Pro';color:@WHITE@}
SEL .lg{position:absolute;left:60px;width:880px;top:730px;text-align:center;font:700 52px 'Be Vietnam Pro';color:#fff}
SEL .lg b{color:@GOLD@} SEL .lg i{font:italic 700 66px 'Playfair Display';color:@GOLD@}
SEL .chip2{position:absolute;left:60px;width:880px;top:850px;text-align:center;font:800 44px 'Be Vietnam Pro';color:@DARK@;background:@GOLD@;padding:14px 10px;border-radius:18px}
SEL .src2{position:absolute;left:60px;top:1010px;font:400 26px 'Be Vietnam Pro';color:#8a8a8a}""",
     [rise("#c18-k", t_58_s + 0.03), pop("#c18-d", T("58%") - 0.2, 0.5),
      "(function(){const el=document.querySelector('#c18-arc');const L=2*Math.PI*170;tl.set('#c18-arc',{strokeDasharray:L,strokeDashoffset:L},0);"
      f"tl.to('#c18-arc',{{strokeDashoffset:L*(1-0.583),duration:1.0,ease:'power2.inOut'}},{q(T('58%') - 0.1)});}})();",
      count("#c18-n", T("58%") - 0.1, 58, 1.0, wrap="#c18-d .pc"),
      rise("#c18-lg", T("thu nhập khác") - 0.5, 0.45), pop("#c18-vs", T("VSIP") - 0.5, 0.4)], full=True, bg=DARKBG, dy=60)

t_cd_s, t_cd_e = T("kiếm tiền từ mủ") - 0.1, E("đang đứng", off=0.3)
card("c19-treeland", t_cd_s, t_cd_e, """<div class="two"><div class="side g" id="c19-a"><div class="w">Cây</div><div class="d">kiếm tiền từ<br><b>mủ cao su</b></div></div>
<div class="side y" id="c19-b"><div class="w">Đất</div><div class="d">kiếm tiền từ<br><b>đền bù mặt bằng</b></div></div></div>""", """
SEL .two{position:absolute;left:60px;width:880px;top:340px;display:grid;grid-template-columns:1fr 1fr;gap:20px}
SEL .side{padding:40px 20px 34px;border-radius:30px;text-align:center;border:3px solid var(--c);background:color-mix(in srgb,var(--c) 12%,#141414)}
SEL .g{--c:@GREEN@} SEL .y{--c:@GOLD@}
SEL .w{font:italic 700 150px 'Playfair Display';color:var(--c);line-height:1.1}
SEL .d{font:700 38px 'Be Vietnam Pro';color:#cfcfcf;margin-top:14px;line-height:1.35} SEL .d b{color:#fff;font-weight:800;font-size:42px}""",
     [pop("#c19-a", T("kiếm tiền từ mủ") - 0.05, 0.45), pop("#c19-b", T("kiếm tiền từ chính") - 0.05, 0.45)], full=True, bg=DARKBG, dy=150)

t_rk_s, t_rk_e = T("Rủi ro ở đây") - 0.05, E("quay đầu nhanh", off=0.3)
card("c20-risk", t_rk_s, t_rk_e, """<div class="p" id="c20-p"><div class="k">RỦI RO</div>
<div class="it" id="c20-i0"><b>1</b><span>Tiền đền bù đến <i>theo từng đợt</i></span></div>
<div class="it" id="c20-i1"><b>2</b><span>Giá mủ đã tăng ~30% từ đầu năm</span></div>
<div class="it" id="c20-i2"><b>3</b><span>Thời tiết thuận lợi → giá <i>quay đầu nhanh</i></span></div></div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:20px 28px 14px;PANEL}
SEL .k{font:800 28px 'Be Vietnam Pro';color:@RED@;letter-spacing:6px;margin-bottom:4px}
SEL .it{display:flex;align-items:center;gap:16px;padding:8px 0}
SEL .it b{font:800 30px 'Be Vietnam Pro';color:@DARK@;background:@RED@;border-radius:10px;padding:0 12px}
SEL .it span{font:700 34px 'Be Vietnam Pro';color:#fff;line-height:1.2} SEL .it i{font:italic 700 40px 'Playfair Display';color:@GOLD@}""",
     [rise("#c20-p", t_rk_s + 0.02, 0.4, -30), slide("#c20-i0", T("tiền đền bù") - 0.1, 0.4, -60), slide("#c20-i1", T("giá mủ đã tăng") - 0.1, 0.4, -60),
      slide("#c20-i2", T("Thời tiết thuận lợi") - 0.1, 0.4, -60)])

t_lp_s, t_lp_e = T("Vậy quay lại") - 0.05, E("đến theo đợt", off=0.3)
card("c21-loop", t_lp_s, t_lp_e, """<div class="p" id="c21-p"><div class="q">Tiền thật chảy vào từ <i>đâu?</i></div>
<div class="src" id="c21-s1"><b>MỦ</b><span>theo giá thế giới · lên nhanh, xuống cũng nhanh</span></div>
<div class="src" id="c21-s2"><b>ĐẤT</b><span>tiền lớn · nhưng đến theo đợt</span></div></div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:20px 28px 14px;PANEL}
SEL .q{font:800 46px 'Be Vietnam Pro';color:#fff;margin-bottom:8px} SEL .q i{font:italic 700 58px 'Playfair Display';color:@GOLD@}
SEL .src{display:flex;align-items:center;gap:16px;padding:7px 0}
SEL .src b{font:800 32px 'Be Vietnam Pro';color:@DARK@;background:@GOLD@;border-radius:10px;padding:2px 14px;min-width:88px;text-align:center}
SEL #c21-s1 b{background:@GREEN@}
SEL .src span{font:700 32px 'Be Vietnam Pro';color:#fff;line-height:1.2}""",
     [rise("#c21-p", t_lp_s + 0.02, 0.4, -30), slide("#c21-s1", T("Mủ đi theo") - 0.1, 0.4, -60), slide("#c21-s2", T("Đất thì") - 0.1, 0.4, -60)])

t_fn_s, t_fn_e = T("Nên trước khi") - 0.05, E("từ đất", off=0.5)
card("c22-final", t_fn_s, t_fn_e, """<div class="k" id="c22-k">TRƯỚC KHI NHÌN BẤT KỲ MÃ CAO SU NÀO</div>
<div class="q" id="c22-q">Lãi của nó đến từ</div>
<div class="or"><span class="cay" id="c22-cay">CÂY</span><span class="h" id="c22-h">hay</span><span class="dat" id="c22-dat">ĐẤT</span><span class="qm" id="c22-qm">?</span></div>""", """
SEL .k{position:absolute;left:60px;top:250px;width:880px;text-align:center;font:700 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .q{position:absolute;left:60px;width:880px;top:420px;text-align:center;font:800 76px 'Be Vietnam Pro';color:@WHITE@}
SEL .or{position:absolute;left:60px;width:880px;top:600px;display:flex;justify-content:center;align-items:baseline;gap:22px}
SEL .cay{font:italic 700 170px 'Playfair Display';color:@GREEN@} SEL .dat{font:italic 700 170px 'Playfair Display';color:@GOLD@}
SEL .h{font:400 60px 'Pacifico';color:#cfcfcf} SEL .qm{font:800 150px 'Be Vietnam Pro';color:@WHITE@}""",
     [rise("#c22-k", t_fn_s + 0.05), rise("#c22-q", t_fn_s + 0.2, 0.5, 50), pop("#c22-cay", T("từ cây") - 0.05, 0.5), pop("#c22-h", T("từ cây") + 0.45, 0.4),
      pop("#c22-dat", T("từ đất") - 0.05, 0.5), pop("#c22-qm", T("từ đất") + 0.3, 0.4)], full=True, bg=DARKBG, dy=80)

t_cta_s = T("Anh chị đang để ý") - 0.05
t_disc = DUR - 3.6
card("c23-cta", t_cta_s, DUR, """<div class="p" id="c23-p"><div class="q">Bạn để ý mã cao su <i>nào?</i></div>
<div class="bub" id="c23-b">Comment tên mã ↓</div></div>
<div class="lock" id="c23-l"><img src="img/icon.png"/><div><span>Biểu đồ &amp; dữ liệu tại</span><b>cloudstock.id.vn</b></div></div>
<div class="disc" id="c23-d">Nội dung chia sẻ thông tin, không phải khuyến nghị mua/bán.<br>Số liệu theo BCTC và báo chí, cần đối chiếu trước khi đầu tư. Giá: DNSE, đóng cửa 29/9/2026.</div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;padding:22px 30px;PANEL}
SEL .q{font:800 54px 'Be Vietnam Pro';color:#fff} SEL .q i{font:italic 700 64px 'Playfair Display';color:@GOLD@}
SEL .bub{display:inline-block;margin-top:12px;font:800 38px 'Be Vietnam Pro';color:@DARK@;background:@WHITE@;padding:10px 24px;border-radius:40px 40px 40px 8px}
SEL .lock{position:absolute;left:60px;width:880px;top:1150px;display:flex;align-items:center;gap:22px;padding:12px 22px;border-radius:26px;background:rgba(17,17,17,.88);border:2px solid rgba(167,139,250,.55)}
SEL .lock img{width:100px;height:100px;border-radius:22px}
SEL .lock span{display:block;font:700 28px 'Be Vietnam Pro';color:#cfcfcf} SEL .lock b{display:block;font:800 50px 'Be Vietnam Pro';color:#C4B5FD}
SEL .disc{position:absolute;left:60px;width:880px;top:1290px;padding:12px 16px;border-radius:16px;background:rgba(17,17,17,.78);text-align:center;font:400 25px 'Be Vietnam Pro';color:rgba(255,255,255,.95);line-height:1.4}""",
     [rise("#c23-p", t_cta_s + 0.02, 0.4, -30), pop("#c23-b", T("Comment tên mã") - 0.05, 0.4), rise("#c23-l", t_disc - 0.1, 0.5, 40),
      fromto("#c23-d", {"opacity": 0}, {"opacity": 1, "duration": .4}, t_disc + 0.05)])

# ───────────────────────── ZOOM & SFX ─────────────────────────
CUTS = [round(o[1], 3) for o in OFFS[1:]]
PUSH = [(T("Nhưng có một chuyện"), 0.05), (T("Nhưng nếu anh"), 0.05), (T("Chuyện thứ ba", 1) + 2.4, 0.06), (T("Nhưng khoảng 58%") - 0.3, 0.06),
        (T("Rủi ro ở đây"), 0.05), (T("Vậy quay lại"), 0.05)]

SFX = []
for cid, c in CARDS.items():
    SFX.append((c["s"], "whoosh" if c["full"] else "pop", 0.3 if c["full"] else 0.25))
    if c["full"] and c["e"] < DUR - 0.1:
        SFX.append((c["e"] - 0.15, "whoosh", 0.22))
for t in [T("TRC") - 0.1, T("GVR") - 0.1, T("DPR") - 0.1, T("PHR") - 0.1, T("Thái Lan"), T("Việt Nam"), T("Indonesia"), T("kiếm tiền từ mủ"), T("kiếm tiền từ chính")]:
    SFX.append((t, "click", 0.3))
for t in [T("250") - 0.15, T("280") - 0.05, T("15%") - 0.1, T("58%") - 0.1, T("370") - 0.1, T("gần 100") - 0.1]:
    SFX.append((t, "ding", 0.22))
SFX.sort()

# ───────────────────────── CAPTION TỰ ĐỘNG TỪ TOKENS ─────────────────────────
GOOD = {"tang", "xanh", "lai", "that", "dinh", "lon"}
BAD = {"giam", "thieu", "nham", "xau", "quay"}
KEYS = {"cao su", "dinh", "mu", "dat", "cay", "thu nhap khac", "boi thuong", "vsip", "trc", "gvr", "dpr", "phr", "singapore", "gia dau", "nham"}


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
