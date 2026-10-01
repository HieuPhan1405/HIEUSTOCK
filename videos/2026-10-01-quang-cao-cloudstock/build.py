#!/usr/bin/env python3
"""Quảng cáo web CloudStock (cloudstock.id.vn) — 9:16, ~26s. 100% hình lấy từ web (ảnh chụp trang + logo).
Ảnh chụp: node ../tools/capture_pages.mjs. Vùng an toàn TikTok: y 170–1430, x 60–940.
Chạy: python3 build.py"""
import json
from pathlib import Path

ROOT = Path(__file__).parent
PUB = ROOT / "public"
FPS, W, H = 30, 1080, 1920
DUR = 26.0
GOLD, WHITE, DARK, PURPLE, LAV = "#F5C542", "#FAFAFA", "#0E0E12", "#6C5CE7", "#C4B5FD"


def q(t):
    return f"{round(t * FPS) / FPS:.4f}"


def qd(s, e):
    return f"{round(e * FPS) / FPS - round(s * FPS) / FPS:.4f}"


def ft(sel, a, b, t):
    return f"tl.fromTo({json.dumps(sel)},{json.dumps(a)},{json.dumps(b)},{q(t)});"


def pop(sel, t, d=.4):
    return ft(sel, {"opacity": 0, "scale": .6}, {"opacity": 1, "scale": 1, "duration": d, "ease": "back.out(1.8)"}, t)


def rise(sel, t, d=.5, y=40):
    return ft(sel, {"opacity": 0, "y": y}, {"opacity": 1, "y": 0, "duration": d, "ease": "power3.out"}, t)


def to(sel, props, t):
    return f"tl.to({json.dumps(sel)},{json.dumps(props)},{q(t)});"


SC = []  # (id, start, end, html, css, js)


def scene(sid, s, e, html, css, js):
    SC.append((sid, s, e, html, css.replace("SEL", f"#{sid}"), js))


PHONE_CSS = """
SEL .phone{position:absolute;left:220px;width:640px;height:1500px;border-radius:64px;border:10px solid #2a2a33;background:#000;box-shadow:0 40px 120px rgba(0,0,0,.65),0 0 0 2px #3d3d4a;overflow:hidden}
SEL .phone img{display:block;width:100%;transform-origin:50% 0}
SEL .lab{position:absolute;left:60px;top:190px;display:inline-block;font:800 28px 'Be Vietnam Pro';color:#0E0E12;background:#F5C542;padding:6px 20px;border-radius:12px;letter-spacing:2px}
SEL .ttl{position:absolute;left:60px;width:880px;top:262px;font:800 70px 'Be Vietnam Pro';color:#FAFAFA;line-height:1.12}
SEL .ttl i{font:italic 700 82px 'Playfair Display';color:#F5C542}
"""

# A) Hook 0–3.6
scene("sA", 0, 3.6, """<div class="a1" id="a1">Đọc cả thị trường</div><div class="a2" id="a2">mất bao lâu?</div>
<div class="five" id="a3"><span id="a3n">30</span><small>giây</small></div><div class="a4" id="a4">Tổng quan thị trường — với <b>CloudStock</b></div>""", """
SEL .a1{position:absolute;left:60px;width:880px;top:470px;text-align:center;font:700 66px 'Be Vietnam Pro';color:#FAFAFA}
SEL .a2{position:absolute;left:60px;width:880px;top:560px;text-align:center;font:italic 700 130px 'Playfair Display';color:#F5C542}
SEL .five{position:absolute;left:60px;width:880px;top:520px;text-align:center;font:800 330px 'Be Vietnam Pro';color:#F5C542;line-height:1;opacity:0}
SEL .five small{font:800 90px 'Be Vietnam Pro';color:#FAFAFA;margin-left:16px}
SEL .a4{position:absolute;left:60px;width:880px;top:900px;text-align:center;font:700 56px 'Be Vietnam Pro';color:#cfcfd8;opacity:0}
SEL .a4 b{color:#F5C542}""", [
    rise("#a1", .25), ft("#a2", {"opacity": 0, "scale": .7}, {"opacity": 1, "scale": 1, "duration": .5, "ease": "back.out(1.6)"}, .75),
    to("#a1", {"opacity": 0, "y": -30, "duration": .25}, 1.9), to("#a2", {"opacity": 0, "y": -30, "duration": .25}, 1.9),
    ft("#a3", {"opacity": 0, "scale": 1.4}, {"opacity": 1, "scale": 1, "duration": .4, "ease": "back.out(1.7)"}, 2.0),
    "(function(){const o={v:30};tl.to(o,{v:5,duration:.8,ease:'power3.out',onUpdate:function(){const el=document.querySelector('#a3n');if(el)el.textContent=Math.round(o.v);}},%s);})();" % q(2.0),
    rise("#a4", 2.7, .45, 30)])

# B) Logo + trang Tổng quan 3.4–7.6
scene("sB", 3.4, 7.6, """<img class="ic" id="b1" src="img/icon.png"/><div class="bn" id="b2">CloudStock</div>
<div class="bt" id="b3">Tổng quan thị trường,<br><i>đọc trong 5 giây</i></div>
<div class="phone" id="b4" style="top:760px"><img id="b4i" src="img/home.jpg"/></div>""", """
SEL .ic{position:absolute;left:60px;top:190px;width:130px;height:130px;border-radius:30px}
SEL .bn{position:absolute;left:215px;top:205px;font:800 76px 'Be Vietnam Pro';color:#FAFAFA}
SEL .bt{position:absolute;left:60px;width:880px;top:360px;font:800 60px 'Be Vietnam Pro';color:#FAFAFA;line-height:1.15}
SEL .bt i{font:italic 700 74px 'Playfair Display';color:#F5C542}""" + PHONE_CSS, [
    pop("#b1", 3.5), rise("#b2", 3.65), rise("#b3", 4.0),
    ft("#b4", {"y": 1200, "opacity": 0}, {"y": 0, "opacity": 1, "duration": .8, "ease": "power3.out"}, 4.2),
    ft("#b4i", {"y": 0}, {"y": -230, "duration": 2.8, "ease": "power2.inOut"}, 4.8)])

# C) Bộ lọc 7.4–11.8
pills = "".join(f'<div class="pl" id="c-p{i}" style="top:{y}px;{side}">{t}</div>' for i, (t, y, side) in enumerate(
    [("Ngành", 760, "left:60px"), ("Vốn hoá", 900, "right:140px"), ("Xu hướng", 1040, "left:60px"), ("Sàn", 1180, "right:140px")]))
scene("sC", 7.4, 11.8, f"""<div class="lab">01 · BỘ LỌC</div><div class="ttl">Quét <i>~390 mã</i><br>HOSE · HNX · UPCOM</div>
<div class="phone" id="c1" style="top:560px"><img id="c1i" src="img/boloc.jpg"/></div>{pills}""", PHONE_CSS + """
SEL .pl{position:absolute;z-index:5;font:800 40px 'Be Vietnam Pro';color:#0E0E12;background:#F5C542;padding:10px 28px;border-radius:40px;box-shadow:0 12px 30px rgba(0,0,0,.5)}""", [
    rise("#sC .lab", 7.5, .4, 20), rise("#sC .ttl", 7.6, .5),
    ft("#c1", {"x": 700, "opacity": 0}, {"x": 0, "opacity": 1, "duration": .7, "ease": "power3.out"}, 7.55),
    ft("#c1i", {"y": 0}, {"y": -260, "duration": 3.0, "ease": "power2.inOut"}, 8.2),
    pop("#c-p0", 8.5), pop("#c-p1", 8.85), pop("#c-p2", 9.2), pop("#c-p3", 9.55)])

# D) Biểu đồ 11.6–15.8
scene("sD", 11.6, 15.8, """<div class="lab">02 · BIỂU ĐỒ KỸ THUẬT</div><div class="ttl"><i>Nến</i> · Ichimoku · MA<br>xem giá từng phiên</div>
<div class="phone" id="d1" style="top:560px"><img id="d1i" src="img/bieudo.jpg"/></div>""", PHONE_CSS, [
    rise("#sD .lab", 11.7, .4, 20), rise("#sD .ttl", 11.8, .5),
    ft("#d1", {"x": 700, "opacity": 0}, {"x": 0, "opacity": 1, "duration": .7, "ease": "power3.out"}, 11.75),
    ft("#d1i", {"y": 0, "scale": 1}, {"y": -330, "scale": 1.04, "duration": 3.2, "ease": "power2.inOut"}, 12.4)])

# E) Dashboard 15.6–19.8
scene("sE", 15.6, 19.8, """<div class="lab">03 · DASHBOARD</div><div class="ttl">Tâm lý · <i>Độ rộng</i><br>Thanh khoản thị trường</div>
<div class="phone" id="e1" style="top:560px"><img id="e1i" src="img/dashboard.jpg"/></div>""", PHONE_CSS, [
    rise("#sE .lab", 15.7, .4, 20), rise("#sE .ttl", 15.8, .5),
    ft("#e1", {"x": 700, "opacity": 0}, {"x": 0, "opacity": 1, "duration": .7, "ease": "power3.out"}, 15.75),
    ft("#e1i", {"y": 0}, {"y": -420, "duration": 3.2, "ease": "power2.inOut"}, 16.4)])

# F) Và nhiều hơn thế 19.6–23.0
cards = [("c_danhmuc", "Danh mục theo dõi"), ("c_batday", "Checklist dò bắt đáy"), ("c_lenhmo", "Sổ lệnh")]
ch = "".join(f'<div class="cd" id="f{i}"><img src="img/{n}.jpg"/><div class="cl">{t}</div></div>' for i, (n, t) in enumerate(cards))
fjs = [rise("#sF .ttl", 19.7, .5)]
for i in range(3):
    s0 = 20.0 + i * 1.0
    fjs.append(ft(f"#f{i}", {"x": 900, "opacity": 0}, {"x": 0, "opacity": 1, "duration": .5, "ease": "power3.out"}, s0))
    if i < 2:
        fjs.append(to(f"#f{i}", {"x": -900, "opacity": 0, "duration": .45, "ease": "power3.in"}, s0 + 0.9))
scene("sF", 19.6, 23.0, f"""<div class="lab">VÀ NHIỀU HƠN THẾ</div><div class="ttl">Theo dõi <i>danh mục</i><br>của riêng bạn</div>{ch}""", PHONE_CSS + """
SEL .cd{position:absolute;left:60px;width:880px;top:560px;opacity:0}
SEL .cd img{display:block;width:100%;border-radius:28px;border:3px solid #2a2a33;box-shadow:0 30px 90px rgba(0,0,0,.6)}
SEL .cl{margin-top:22px;text-align:center;font:800 56px 'Be Vietnam Pro';color:#F5C542}""", fjs)

# G) CTA 22.8–26
scene("sG", 22.8, DUR, """<img class="ic" id="g1" src="img/icon.png"/><div class="dm" id="g2">cloudstock<span>.id.vn</span></div>
<div class="btn" id="g3">Đăng ký miễn phí</div><div class="sub" id="g4">Miễn phí trong tuần đầu sử dụng</div>
<div class="disc" id="g5">Công cụ hỗ trợ đọc biểu đồ, không phải khuyến nghị đầu tư.<br>Dữ liệu cập nhật sau mỗi phiên, không phải thời gian thực.</div>""", """
SEL .ic{position:absolute;left:340px;top:330px;width:400px;height:400px;border-radius:90px;box-shadow:0 30px 100px rgba(108,92,231,.55)}
SEL .dm{position:absolute;left:60px;width:880px;top:790px;text-align:center;font:800 100px 'Be Vietnam Pro';color:#FAFAFA}
SEL .dm span{color:#C4B5FD}
SEL .btn{position:absolute;left:210px;width:660px;top:960px;text-align:center;font:800 56px 'Be Vietnam Pro';color:#0E0E12;background:#F5C542;padding:22px 0;border-radius:60px;box-shadow:0 18px 50px rgba(245,197,66,.35)}
SEL .sub{position:absolute;left:60px;width:880px;top:1110px;text-align:center;font:700 38px 'Be Vietnam Pro';color:#cfcfd8}
SEL .disc{position:absolute;left:60px;width:880px;top:1290px;padding:14px 16px;border-radius:16px;background:rgba(255,255,255,.07);text-align:center;font:400 27px 'Be Vietnam Pro';color:rgba(255,255,255,.92);line-height:1.4}""", [
    pop("#g1", 22.95, .5), rise("#g2", 23.3, .5), pop("#g3", 23.8, .45), rise("#g4", 24.1, .4, 20), ft("#g5", {"opacity": 0}, {"opacity": 1, "duration": .5}, 24.4),
    ft("#g3", {"scale": 1}, {"scale": 1.05, "duration": .5, "repeat": 3, "yoyo": True, "ease": "sine.inOut"}, 24.4)])

SFX = [(3.4, "whoosh", .3), (7.4, "whoosh", .3), (11.6, "whoosh", .3), (15.6, "whoosh", .3), (19.6, "whoosh", .3), (22.8, "whoosh", .3),
       (2.0, "ding", .3), (3.5, "pop", .3), (8.5, "click", .3), (8.85, "click", .3), (9.2, "click", .3), (9.55, "click", .3),
       (20.0, "pop", .25), (21.0, "pop", .25), (22.0, "pop", .25), (23.8, "ding", .3)]
FONT_RANGES = {
    "latin": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    "latin-ext": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    "vietnamese": "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB",
}


def main():
    hosts, js, styles = [], [], []
    for sid, s, e, html, css, sj in SC:
        hosts.append(f'<div class="scn clip" id="{sid}" data-start="{q(s)}" data-duration="{qd(s, e)}" data-track-index="3"><div class="in" id="{sid}in" style="position:absolute;inset:0;opacity:0">{html}</div></div>')
        styles.append(css)
        js.append(f"tl.fromTo('#{sid}in',{{opacity:0}},{{opacity:1,duration:.25,ease:'power2.out'}},{q(s)});")
        js.extend(sj)
        if e < DUR - 0.05:
            js.append(f"tl.to('#{sid}in',{{opacity:0,duration:.25,ease:'power2.in'}},{q(e - 0.25)});")
    # nền: quầng tím trôi chậm
    js.append(f"tl.fromTo('#glow',{{x:-120,y:0}},{{x:120,y:160,duration:{DUR},ease:'sine.inOut'}},0);")
    sfx = "\n".join(f'<audio id="sfx-{i}" src="sfx/{f}.wav" data-start="{q(t)}" data-duration="{1.0 if f in ("ding", "whoosh") else 0.3}" data-track-index="{11 + i % 4}" data-volume="{v}"></audio>' for i, (t, f, v) in enumerate(SFX))
    ff = []
    for fam, slug, wt, st in [("Be Vietnam Pro", "be-vietnam-pro", 400, "normal"), ("Be Vietnam Pro", "be-vietnam-pro", 700, "normal"), ("Be Vietnam Pro", "be-vietnam-pro", 800, "normal"),
                              ("Playfair Display", "playfair-display", 700, "italic"), ("Pacifico", "pacifico", 400, "normal")]:
        for sub, r in FONT_RANGES.items():
            ff.append(f"@font-face{{font-family:'{fam}';src:url('fonts/{slug}-{sub}-{wt}-{st}.woff2') format('woff2');font-weight:{wt};font-style:{st};font-display:block;unicode-range:{r}}}")
    index = f"""<!doctype html>
<html lang="vi"><head><meta charset="utf-8"/>
<style>
{chr(10).join(ff)}
*{{box-sizing:border-box}}
html,body{{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000;font-family:'Be Vietnam Pro',sans-serif}}
#stage{{position:relative;width:1080px;height:1920px;overflow:hidden;background:{DARK}}}
#glow{{position:absolute;left:-200px;top:200px;width:1000px;height:1000px;border-radius:50%;background:radial-gradient(circle,rgba(108,92,231,.38) 0%,rgba(108,92,231,0) 68%)}}
.scn{{position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:hidden}}
{chr(10).join(styles)}
</style></head>
<body>
<div id="stage" data-composition-id="talking-head-recut" data-start="0" data-duration="{q(DUR)}" data-fps="{FPS}" data-width="{W}" data-height="{H}">
<div id="glow"></div>
<audio id="bed" src="sfx/bed.wav" data-start="0" data-duration="{q(DUR)}" data-track-index="10" data-volume="0.22"></audio>
{sfx}
{chr(10).join(hosts)}
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
    (ROOT / "storyboard.json").write_text(json.dumps({"schemaVersion": 3, "composition": {"fps": FPS, "width": W, "height": H, "durationSeconds": DUR, "layout": "portrait", "themeId": "noir", "seed": 7},
                                                      "cards": [{"id": s[0], "startSec": s[1], "endSec": s[2], "zone": "fullscreen"} for s in SC]}, ensure_ascii=False, indent=2))
    print(len(SC), "cảnh")


if __name__ == "__main__":
    main()
