#!/usr/bin/env python3
"""Sinh public/cards/*.html + public/index.html cho video VPB (IMG_1565).

Phong cách: .claude/skills/hieu-talking-head-style. Chạy: python3 build.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent
PUB = ROOT / "public"
FPS = 30
DUR = 23.0333
W, H = 1080, 1920

GOLD, GREEN, RED, WHITE, DARK = "#F5C542", "#22C55E", "#EF4444", "#FAFAFA", "#111111"


def q(t):
    return f"{round(t * FPS) / FPS:.4f}"


# ── Caption: tối đa 2 dòng, ngang vai. (start, end, dòng nhỏ, từ khoá, kiểu từ khoá)
# kiểu: "k" = serif nghiêng vàng, "b" = sans đậm trắng, "g" = xanh (tăng), "r" = đỏ (giảm)
CAPS = [
    (0.00, 1.20, "có một", "ngân hàng", "k"),
    (1.20, 3.30, "đang được", "cổ đông nhà nước", "b"),
    (3.30, 4.89, "chia", "cổ tức khủng", "k"),
    (4.89, 8.28, "vừa được một", "tập đoàn Nhật", "b"),
    (8.28, 10.00, "đàm phán", "mua thêm cổ phần", "k"),
    (10.00, 10.97, "mà giá", "vẫn chưa phản ánh hết", "b"),
    (10.97, 11.54, "", "đó là", "b"),
    (12.80, 14.78, "trong thị trường", "chung", "b"),
    (14.78, 15.62, "", "giảm điểm", "r"),
    (15.62, 17.21, "VPB là", "một trong", "b"),
    (17.21, 18.52, "", "số ít mã", "k"),
    (18.52, 19.01, "", "tăng giá", "g"),
    (19.01, 20.38, "không phải", "ngẫu nhiên", "k"),
    (20.38, 21.59, "mà có", "hai câu chuyện", "k"),
    (21.59, DUR, "đến cùng", "một lúc", "b"),
]

# ── Punch-in (zoom mượt, easing inOut — không linear)
ZOOMS = [(3.30, 1.12, 0.45), (4.89, 1.0, 0.5), (10.0, 1.06, 1.4), (12.80, 1.0, 0.01),
         (19.01, 1.10, 0.45), (20.38, 1.0, 0.5), (21.59, 1.08, 0.4)]

# ── SFX (thời điểm, file, âm lượng)
SFX = [(0.15, "pop", 0.35), (0.35, "whoosh", 0.3), (6.68, "click", 0.4), (6.72, "whoosh", 0.25),
       (11.54, "whoosh", 0.35), (11.75, "click", 0.3), (12.80, "whoosh", 0.35), (14.85, "pop", 0.3),
       (17.30, "pop", 0.3), (18.52, "ding", 0.3), (19.01, "whoosh", 0.3), (21.62, "pop", 0.3),
       (21.85, "pop", 0.3)]

# ── Dữ liệu biểu đồ (DNSE, giá đóng cửa, đơn vị nghìn đồng / điểm). Mốc = 18/9/2026.
DAYS = ["18/9", "21/9", "22/9", "23/9", "24/9", "25/9"]
VPB = [21.78, 22.57, 22.21, 22.06, 22.10, 23.00]
VNI = [1815.66, 1799.67, 1816.93, 1801.65, 1775.09, 1785.11]


def pct(s):
    return [(v / s[0] - 1) * 100 for v in s]


CARDS = {}

CARDS["card-hook"] = (0.0, 3.30, 3, "left:0;top:0;width:1080px;height:640px", f"""
<div class="card" data-card-id="card-hook"><style>
.card[data-card-id="card-hook"] .root{{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding-top:120px}}
.card[data-card-id="card-hook"] .kick{{font:800 56px 'Be Vietnam Pro';color:{DARK};letter-spacing:4px;text-shadow:0 2px 10px rgba(255,255,255,.6)}}
.card[data-card-id="card-hook"] .kick .w{{display:inline-block;margin:0 8px}}
.card[data-card-id="card-hook"] .big{{position:relative;margin-top:-6px}}
.card[data-card-id="card-hook"] .bar{{position:absolute;left:10px;bottom:34px;height:46px;width:0;background:{GOLD};border-radius:6px}}
.card[data-card-id="card-hook"] .vpb{{position:relative;font:italic 700 176px 'Playfair Display';color:{DARK};line-height:1.05;text-shadow:0 6px 24px rgba(0,0,0,.18)}}
</style><div class="root">
<div class="kick" id="hook-kick"><span class="w">AI</span><span class="w">ĐANG</span><span class="w">ĐỂ</span><span class="w">Ý</span></div>
<div class="big"><div class="bar" id="hook-bar"></div><div class="vpb" id="hook-vpb">VPB?</div></div>
</div></div>""")

CARDS["card-japan"] = (6.68, 10.00, 3, "left:0;top:0;width:1080px;height:640px", f"""
<div class="card" data-card-id="card-japan"><style>
.card[data-card-id="card-japan"] .root{{position:absolute;inset:0}}
.card[data-card-id="card-japan"] .box{{position:absolute;left:56px;top:150px;display:flex;align-items:center;gap:26px;padding:26px 34px 26px 26px;background:rgba(255,255,255,.92);border:2px dashed rgba(17,17,17,.35);border-radius:22px;box-shadow:0 14px 40px rgba(0,0,0,.18)}}
.card[data-card-id="card-japan"] .flag{{width:150px;height:100px;background:#fff;border:2px solid #e5e5e5;border-radius:10px;display:flex;align-items:center;justify-content:center}}
.card[data-card-id="card-japan"] .sun{{width:58px;height:58px;border-radius:50%;background:#BC002D}}
.card[data-card-id="card-japan"] .t1{{font:800 46px 'Be Vietnam Pro';color:{DARK}}}
.card[data-card-id="card-japan"] .t2{{font:400 22px 'Be Vietnam Pro';color:#555;letter-spacing:3px;margin-top:4px}}
.card[data-card-id="card-japan"] .note{{position:absolute;left:520px;top:338px;font:400 46px 'Pacifico';color:{RED};transform:rotate(-5deg);text-shadow:0 3px 12px rgba(255,255,255,.8)}}
.card[data-card-id="card-japan"] svg{{position:absolute;left:430px;top:300px}}
</style><div class="root">
<div class="box" id="jp-box"><div class="flag"><div class="sun" id="jp-sun"></div></div>
<div><div class="t2">NHÀ ĐẦU TƯ CHIẾN LƯỢC</div><div class="t1">Tập đoàn Nhật</div></div></div>
<svg width="100" height="80" viewBox="0 0 100 80"><path id="jp-arrow" d="M90 70 C 60 70, 30 55, 14 12 M14 12 L 8 32 M14 12 L 32 22" fill="none" stroke="{RED}" stroke-width="5" stroke-linecap="round"/></svg>
<div class="note" id="jp-note">đàm phán mua thêm!</div>
</div></div>""")

CARDS["card-vpbank"] = (11.54, 12.80, 4, "left:0;top:0;width:1080px;height:1920px", f"""
<div class="card" data-card-id="card-vpbank"><style>
.card[data-card-id="card-vpbank"] .root{{position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 45%,#FFFBF1 0%,#F3EBDA 100%)}}
.card[data-card-id="card-vpbank"] .barT{{position:absolute;left:150px;top:0;width:130px;height:520px;background:#3a3a3a;border-radius:0 0 8px 8px}}
.card[data-card-id="card-vpbank"] .barB{{position:absolute;right:150px;bottom:0;width:130px;height:560px;background:#3a3a3a;border-radius:8px 8px 0 0}}
.card[data-card-id="card-vpbank"] .lbl{{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:30px 70px;border:3px dashed rgba(17,17,17,.45);border-radius:14px;box-shadow:0 18px 40px rgba(0,0,0,.12);background:rgba(255,255,255,.35)}}
.card[data-card-id="card-vpbank"] .name{{font:italic 700 150px 'Playfair Display';color:{DARK};white-space:nowrap}}
.card[data-card-id="card-vpbank"] .tick{{position:absolute;right:-40px;bottom:-34px;font:800 40px 'Be Vietnam Pro';color:{DARK};background:{GOLD};padding:8px 22px;border-radius:12px;transform:rotate(-4deg)}}
</style><div class="root">
<div class="barT" id="vb-t"></div><div class="barB" id="vb-b"></div>
<div class="lbl" id="vb-lbl"><div class="name" id="vb-name">VPBank</div><div class="tick" id="vb-tick">VPB</div></div>
</div></div>""")

# Biểu đồ
cx0, cy0, cw, ch = 110, 520, 860, 560
ymin, ymax = -3.0, 7.0


def pts(series):
    p = pct(series)
    out = []
    for i, v in enumerate(p):
        x = cx0 + cw * i / (len(p) - 1)
        y = cy0 + ch * (ymax - v) / (ymax - ymin)
        out.append((x, y))
    return out


def path(pp):
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pp)


pv, pn = pts(VPB), pts(VNI)
y0 = cy0 + ch * ymax / (ymax - ymin)
grid = "".join(
    f'<line x1="{cx0}" x2="{cx0 + cw}" y1="{cy0 + ch * (ymax - g) / (ymax - ymin):.1f}" y2="{cy0 + ch * (ymax - g) / (ymax - ymin):.1f}" stroke="rgba(255,255,255,.08)" stroke-width="2"/>'
    f'<text x="{cx0 - 16}" y="{cy0 + ch * (ymax - g) / (ymax - ymin) + 9:.1f}" text-anchor="end">{g:+d}%</text>'
    for g in (-2, 2, 4, 6))
xl = "".join(f'<text x="{x:.1f}" y="{cy0 + ch + 50}" text-anchor="middle">{d}</text>' for (x, _), d in zip(pv, DAYS))
vpb_end, vni_end = pct(VPB)[-1], pct(VNI)[-1]
vni_lbl = f"{vni_end:.1f}".replace("-", "−").replace(".", ",")
CARDS["card-chart"] = (12.80, 19.01, 4, "left:0;top:0;width:1080px;height:1920px", f"""
<div class="card" data-card-id="card-chart"><style>
.card[data-card-id="card-chart"] .root{{position:absolute;inset:0;background:radial-gradient(110% 70% at 50% 30%,#1d1d1f 0%,{DARK} 70%)}}
.card[data-card-id="card-chart"] .k{{position:absolute;left:110px;top:170px;font:700 30px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:5px}}
.card[data-card-id="card-chart"] .h{{position:absolute;left:110px;top:220px;font:800 76px 'Be Vietnam Pro';color:{WHITE}}}
.card[data-card-id="card-chart"] .h i{{font:italic 700 84px 'Playfair Display';color:{GOLD}}}
.card[data-card-id="card-chart"] svg{{position:absolute;left:0;top:0}}
.card[data-card-id="card-chart"] svg text{{font:400 28px 'Be Vietnam Pro';fill:#8a8a8a}}
.card[data-card-id="card-chart"] .tag{{position:absolute;white-space:nowrap;font:800 54px 'Be Vietnam Pro';padding:6px 22px;border-radius:14px;color:{DARK}}}
.card[data-card-id="card-chart"] .lg{{position:absolute;left:110px;top:345px;font:700 32px 'Be Vietnam Pro';color:{WHITE};display:flex;gap:40px}}
.card[data-card-id="card-chart"] .lg span::before{{content:'';display:inline-block;width:34px;height:8px;border-radius:4px;margin-right:12px;vertical-align:middle;background:currentColor}}
.card[data-card-id="card-chart"] .src{{position:absolute;left:110px;top:1150px;font:400 24px 'Be Vietnam Pro';color:#7a7a7a}}
</style><div class="root">
<div class="k" id="ch-k">TUẦN 21 – 25/9/2026</div>
<div class="h" id="ch-h">VPB <i>ngược dòng</i></div>
<svg width="1080" height="1300" viewBox="0 0 1080 1300">{grid}
<line x1="{cx0}" x2="{cx0 + cw}" y1="{y0:.1f}" y2="{y0:.1f}" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-dasharray="10 10"/>
<text x="{cx0 - 16}" y="{y0 + 9:.1f}" text-anchor="end">0%</text>{xl}
<path id="ch-vni" d="{path(pn)}" fill="none" stroke="{RED}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
<path id="ch-vpb" d="{path(pv)}" fill="none" stroke="{GREEN}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
<circle id="ch-dot" cx="{pv[-1][0]:.1f}" cy="{pv[-1][1]:.1f}" r="16" fill="{GREEN}"/>
</svg>
<div class="tag" id="ch-tvni" style="left:540px;top:360px;background:{RED};color:#fff">VN-Index {vni_lbl}%</div>
<div class="tag" id="ch-tvpb" style="left:110px;top:360px;background:{GREEN}">VPB +<span id="ch-num">0,0</span>%</div>
<div class="src">Nguồn: DNSE · giá đóng cửa 18/9 – 25/9/2026</div>
</div></div>""")

CARDS["card-two"] = (20.38, DUR, 3, "left:0;top:0;width:1080px;height:1920px", f"""
<div class="card" data-card-id="card-two"><style>
.card[data-card-id="card-two"] .root{{position:absolute;inset:0}}
.card[data-card-id="card-two"] .t{{position:absolute;left:0;right:0;top:140px;text-align:center;font:800 60px 'Be Vietnam Pro';color:{DARK};letter-spacing:2px}}
.card[data-card-id="card-two"] .t i{{font:italic 700 110px 'Playfair Display';color:{DARK};margin-right:10px}}
.card[data-card-id="card-two"] .chips{{position:absolute;left:0;right:0;top:300px;display:flex;justify-content:center;gap:28px}}
.card[data-card-id="card-two"] .chip{{font:800 44px 'Be Vietnam Pro';color:{WHITE};background:{DARK};padding:12px 30px;border-radius:16px;box-shadow:0 10px 28px rgba(0,0,0,.25)}}
.card[data-card-id="card-two"] .chip b{{color:{GOLD};margin-left:12px}}
.card[data-card-id="card-two"] .disc{{position:absolute;left:0;right:0;top:1640px;text-align:center;font:400 24px 'Be Vietnam Pro';color:rgba(255,255,255,.85);text-shadow:0 2px 8px rgba(0,0,0,.7)}}
</style><div class="root">
<div class="t" id="two-t"><i>2</i>câu chuyện lớn</div>
<div class="chips"><div class="chip" id="two-c1">01<b>?</b></div><div class="chip" id="two-c2">02<b>?</b></div></div>
<div class="disc" id="two-d">Thông tin tham khảo, không phải khuyến nghị đầu tư</div>
</div></div>""")

# ── Timeline JS cho card
card_js = {
    "card-hook": """
tl.from('#hook-kick .w',{opacity:0,y:14,scale:.8,duration:.35,ease:'back.out(1.8)',stagger:.06},%(a0)s);
tl.fromTo('#hook-vpb',{opacity:0,scale:.7,filter:'blur(12px)'},{opacity:1,scale:1,filter:'blur(0px)',duration:.5,ease:'power3.out'},%(a1)s);
tl.fromTo('#hook-bar',{width:0},{width:330,duration:.45,ease:'power3.inOut'},%(a2)s);""",
    "card-japan": """
tl.fromTo('#jp-box',{opacity:0,x:-120},{opacity:1,x:0,duration:.5,ease:'power3.out'},%(a0)s);
tl.fromTo('#jp-sun',{scale:0},{scale:1,duration:.4,ease:'back.out(2)'},%(a1)s);
(function(){const el=document.querySelector('#jp-arrow');if(el){const L=el.getTotalLength();tl.set('#jp-arrow',{strokeDasharray:L,strokeDashoffset:L},%(a0)s);tl.to('#jp-arrow',{strokeDashoffset:0,duration:.45,ease:'power2.inOut'},%(a2)s);}})();
tl.fromTo('#jp-note',{opacity:0,scale:.6},{opacity:1,scale:1,duration:.4,ease:'back.out(1.8)'},%(a3)s);""",
    "card-vpbank": """
tl.fromTo('#vb-t',{y:-560},{y:0,duration:.35,ease:'power3.out'},%(a0)s);
tl.fromTo('#vb-b',{y:600},{y:0,duration:.35,ease:'power3.out'},%(a0)s);
tl.fromTo('#vb-lbl',{opacity:0,scale:.85},{opacity:1,scale:1,duration:.35,ease:'power3.out'},%(a1)s);
tl.fromTo('#vb-name',{clipPath:'inset(0 100%% 0 0)'},{clipPath:'inset(0 0%% 0 0)',duration:.45,ease:'power2.inOut'},%(a1)s);
tl.fromTo('#vb-tick',{opacity:0,scale:.5},{opacity:1,scale:1,duration:.3,ease:'back.out(2)'},%(a2)s);""",
    "card-chart": """
tl.fromTo('#ch-k,#ch-h',{opacity:0,y:30},{opacity:1,y:0,duration:.45,ease:'power3.out',stagger:.08},%(a0)s);
(function(){['#ch-vni','#ch-vpb'].forEach(function(s,i){const el=document.querySelector(s);if(!el)return;const L=el.getTotalLength();tl.set(s,{strokeDasharray:L,strokeDashoffset:L},%(a0)s);tl.to(s,{strokeDashoffset:0,duration:1.6,ease:'power2.inOut'},i?%(a3)s:%(a1)s);});})();
tl.fromTo('#ch-tvni',{opacity:0,scale:.6},{opacity:1,scale:1,duration:.35,ease:'back.out(2)'},%(a2)s);
tl.fromTo('#ch-dot',{scale:0,transformOrigin:'50%% 50%%'},{scale:1,duration:.3,ease:'back.out(2)'},%(a4)s);
tl.fromTo('#ch-tvpb',{opacity:0,scale:.6},{opacity:1,scale:1,duration:.35,ease:'back.out(2)'},%(a4)s);
(function(){const o={v:0};tl.to(o,{v:%(vpb)s,duration:.9,ease:'power2.out',onUpdate:function(){const el=document.querySelector('#ch-num');if(el)el.textContent=o.v.toFixed(1).replace('.',',');}},%(a4)s);})();
tl.to('#ch-tvpb',{scale:1.12,duration:.18,ease:'power2.out',yoyo:true,repeat:1},%(a5)s);""",
    "card-two": """
tl.fromTo('#two-t',{opacity:0,y:-30},{opacity:1,y:0,duration:.45,ease:'power3.out'},%(a0)s);
tl.fromTo('#two-c1',{opacity:0,scale:.5},{opacity:1,scale:1,duration:.35,ease:'back.out(2)'},%(a1)s);
tl.fromTo('#two-c2',{opacity:0,scale:.5},{opacity:1,scale:1,duration:.35,ease:'back.out(2)'},%(a2)s);
tl.fromTo('#two-d',{opacity:0},{opacity:1,duration:.4,ease:'power2.out'},%(a0)s);""",
}
# thời điểm tuyệt đối cho animation trong card
card_at = {
    "card-hook": dict(a0=0.15, a1=0.35, a2=0.6),
    "card-japan": dict(a0=6.72, a1=6.95, a2=7.96, a3=8.28),
    "card-vpbank": dict(a0=11.56, a1=11.70, a2=11.95),
    "card-chart": dict(a0=12.85, a1=13.2, a2=14.80, a3=15.62, a4=17.25, a5=18.52),
    "card-two": dict(a0=20.40, a1=21.62, a2=21.85),
}


def cap_html(i, s, e, small, key, kind):
    cls = {"k": "kk", "b": "kb", "g": "kg", "r": "kr"}[kind]
    words = "".join(f'<span class="w">{w}</span> ' for w in key.split())
    sm = f'<div class="sm">{small}</div>' if small else ""
    return (f'<div class="cap clip" id="cap-{i}" data-start="{q(s)}" data-duration="{q(e - s)}" data-track-index="5">'
            f'{sm}<div class="{cls}">{words}</div></div>')


def main():
    (PUB / "cards").mkdir(parents=True, exist_ok=True)
    hosts, js = [], []
    for cid, (s, e, tr, box, html) in CARDS.items():
        (PUB / "cards" / f"{cid}.html").write_text(html.strip() + "\n")
        hosts.append(f'<div class="card-host clip" data-card-id="{cid}" data-start="{q(s)}" data-duration="{q(e - s)}" '
                     f'data-track-index="{tr}" style="{box};visibility:hidden;opacity:0;">{html}</div>')
        sel = f'.card-host[data-card-id="{cid}"]'
        full = tr == 4
        js.append(f"tl.set('{sel}',{{visibility:'visible'}},{q(s)});")
        js.append(f"tl.fromTo('{sel}',{{opacity:0}},{{opacity:1,duration:{0.12 if full else 0.3},ease:'power2.out'}},{q(s)});")
        at = {k: q(v) for k, v in card_at[cid].items()}
        at["vpb"] = f"{vpb_end:.2f}"
        js.append(card_js[cid] % at)
        if e < DUR - 0.05:
            js.append(f"tl.to('{sel}',{{opacity:0,duration:{0.12 if full else 0.3},ease:'power2.in'}},{q(e - (0.12 if full else 0.3))});")
            js.append(f"tl.set('{sel}',{{visibility:'hidden'}},{q(e)});")

    caps = [cap_html(i, *c) for i, c in enumerate(CAPS)]
    for i, (s, e, small, key, kind) in enumerate(CAPS):
        c = f"#cap-{i}"
        if small:
            js.append(f"tl.fromTo('{c} .sm',{{opacity:0,y:16}},{{opacity:1,y:0,duration:.22,ease:'power2.out'}},{q(s)});")
        js.append(f"tl.fromTo('{c} .w',{{opacity:0,y:20,scale:.85}},{{opacity:1,y:0,scale:1,duration:.28,ease:'back.out(1.7)',stagger:.07}},{q(s + (0.08 if small else 0))});")
        if e < DUR - 0.05:
            js.append(f"tl.to('{c}',{{opacity:0,duration:.1,ease:'power1.in'}},{q(e - 0.1)});")

    # zoom mượt
    for t, sc, d in ZOOMS:
        js.append(f"tl.to('#video-inner',{{scale:{sc},duration:{d},ease:'power3.inOut'}},{q(t)});")
    # PiP trong lúc biểu đồ
    js.append(f"tl.set('#video-wrap',{{className:'video-wrapper pip'}},{q(12.80)});")
    js.append(f"tl.fromTo('#video-wrap',{{x:0,y:0,scale:1}},{{x:810,y:1470,scale:.22,duration:.45,ease:'power3.inOut'}},{q(12.80)});")
    js.append(f"tl.to('#video-wrap',{{x:0,y:0,scale:1,duration:.45,ease:'power3.inOut'}},{q(18.70)});")
    js.append(f"tl.set('#video-wrap',{{className:'video-wrapper'}},{q(19.15)});")

    sfx = "\n".join(
        f'<audio id="sfx-{i}" src="sfx/{f}.wav" data-start="{q(t)}" data-duration="{1.0 if f in ("ding","whoosh") else 0.3}" data-track-index="{11 + i % 4}" data-volume="{v}"></audio>'
        for i, (t, f, v) in enumerate(SFX))

    ff = []
    ranges = {
        "latin": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
        "latin-ext": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
        "vietnamese": "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB",
    }
    for fam, slug, wt, st in [("Be Vietnam Pro", "be-vietnam-pro", 400, "normal"), ("Be Vietnam Pro", "be-vietnam-pro", 700, "normal"),
                              ("Be Vietnam Pro", "be-vietnam-pro", 800, "normal"), ("Playfair Display", "playfair-display", 700, "italic"),
                              ("Pacifico", "pacifico", 400, "normal")]:
        for sub, r in ranges.items():
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
#video-inner{{position:absolute;inset:0;transform-origin:50% 36%}}
#video-inner video{{width:100%;height:100%;object-fit:cover}}
.shade{{position:absolute;left:0;right:0;bottom:0;height:900px;background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.35) 40%,rgba(0,0,0,.62) 100%);pointer-events:none}}
.card-host{{position:absolute;pointer-events:none;overflow:hidden}}
.card-host .card{{position:relative;width:100%;height:100%;overflow:hidden}}
.cap{{position:absolute;z-index:10;left:40px;right:40px;top:1210px;text-align:center;text-shadow:0 4px 18px rgba(0,0,0,.6)}}
.cap .sm{{font:700 46px 'Be Vietnam Pro';color:{WHITE};margin-bottom:2px}}
.cap .w{{display:inline-block}}
.cap .kk{{font:italic 700 96px 'Playfair Display';color:{GOLD};line-height:1.1}}
.cap .kb{{font:800 76px 'Be Vietnam Pro';color:{WHITE};line-height:1.15}}
.cap .kg{{font:800 96px 'Be Vietnam Pro';color:{GREEN};line-height:1.1}}
.cap .kr{{font:800 96px 'Be Vietnam Pro';color:{RED};line-height:1.1}}
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
    storyboard = {
        "schemaVersion": 3,
        "composition": {"fps": FPS, "width": W, "height": H, "durationSeconds": DUR, "layout": "portrait", "themeId": "noir", "seed": 42},
        "videoTrack": {"sourcePath": "input-video.mp4", "startSec": 0, "endSec": DUR, "bounds": {"x": 0, "y": 0, "width": W, "height": H}},
        "subtitles": {"enabled": True, "style": "kinetic 2 dòng, ngang vai"},
        "cards": [{"id": k, "startSec": v[0], "endSec": v[1]} for k, v in CARDS.items()],
    }
    (ROOT / "storyboard.json").write_text(json.dumps(storyboard, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
