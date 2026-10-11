#!/usr/bin/env python3
"""Dựng carousel Facebook (3 ảnh 1080x1350, 4:5) từ một file thông số JSON, hoàn toàn từ số liệu.

Chạy:  python3 videos/covers/make_post.py videos/posts/<ngày>-<mã>/spec.json
Ra:    type "carousel" (mặc định): post_1.png, post_2.png, post_3.png; type "card": post.png (ảnh đơn nhiều khối) — cùng thư mục với spec.json
Không cần cài thêm gì: dùng headless_shell của Chromium có sẵn trong /opt/pw-browsers.
Ví dụ thông số đầy đủ: videos/posts/2026-10-11-fpt/spec.json.

Màu: nền tối, vàng #F5C542 (nhận diện kênh, luôn dành cho mã chính); xanh #5BA8F5 cho đường tham chiếu (VN-Index);
đỏ/xanh lá chỉ dùng cho tăng/giảm và luôn đi kèm ▲/▼ và dấu +/− (không chỉ dựa vào màu).
Cột (slide 3) chỉ nhận giá trị ≥ 0. Mọi chữ trong thông số được escape HTML.
Sau khi chạy PHẢI mở từng ảnh xem: chữ không bị tràn/đè, biểu đồ đúng số liệu."""
import glob
import html
import json
import math
import subprocess
import sys
import tempfile
from pathlib import Path

R = Path(__file__).resolve().parent
FD = (R / "fonts").as_uri()
FONTS = "".join(
    f"@font-face{{font-family:'{f}';src:url('{FD}/{s}-{sub}-{w}-{st}.woff2') format('woff2');font-weight:{w};font-style:{st};unicode-range:{r}}}"
    for f, s, w, st in [("Be Vietnam Pro", "be-vietnam-pro", 800, "normal"), ("Be Vietnam Pro", "be-vietnam-pro", 700, "normal"), ("Be Vietnam Pro", "be-vietnam-pro", 400, "normal"), ("Playfair Display", "playfair-display", 700, "italic")]
    for sub, r in [("latin", "U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20AC,U+2212"), ("latin-ext", "U+0100-02BA,U+1E00-1EFF"), ("vietnamese", "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0309,U+0323,U+1EA0-1EF9,U+20AB")])

GOLD, RED, GREEN, BLUE = "#F5C542", "#FF5A5A", "#22C55E", "#5BA8F5"
INK, MUTED, BG, BAR = "#FAFAFA", "#9AA4B2", "#0B0F17", "#4B5870"
COLORS = {"gold": GOLD, "blue": BLUE, "red": RED, "green": GREEN}

CSS = FONTS + f"""
*{{box-sizing:border-box;margin:0}}html,body{{width:1080px;height:1350px;overflow:hidden}}
body{{background:radial-gradient(1200px 700px at 80% -10%,#1A2233 0%,{BG} 60%);font-family:'Be Vietnam Pro';color:{INK};position:relative}}
.tag{{position:absolute;left:60px;top:56px;font:800 28px 'Be Vietnam Pro';letter-spacing:5px;color:#111;background:{GOLD};padding:8px 22px;border-radius:12px}}
.stamp{{position:absolute;right:60px;top:64px;font:700 24px 'Be Vietnam Pro';color:{MUTED};letter-spacing:1px}}
.foot{{position:absolute;left:60px;right:60px;bottom:30px;font:400 22px/1.4 'Be Vietnam Pro';color:{MUTED}}}
.foot b{{color:{INK};font-weight:700}}
.card{{position:absolute;left:60px;width:960px;background:rgba(255,255,255,.045);border:2px solid rgba(255,255,255,.09);border-radius:28px}}
.lab{{font:800 26px 'Be Vietnam Pro';letter-spacing:4px;color:{GOLD}}}
.chip{{display:inline-block;margin-top:14px;font:700 23px 'Be Vietnam Pro';color:{INK};background:rgba(255,255,255,.1);border-radius:999px;padding:6px 20px;margin-right:10px}}
"""


def e(x):
    t = html.escape(str(x), quote=False)
    for sym in ("÷", "×", "=", "→", "+"):
        t = t.replace(f" {sym} ", f"\u00a0{sym}\u00a0")
    return t


def vi(x, d=1):
    return f"{x:.{d}f}".replace(".", ",")


def sgn(x, d=1):
    return ("+" if x > 0 else "−" if x < 0 else "") + vi(abs(x), d)


def page(body, extra_css=""):
    return f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}{extra_css}</style></head><body>{body}</body></html>"


def foot(spec, sources):
    return f'<div class="foot"><b>Nguồn:</b> {e(sources)} {e(spec["disclaimer"])}</div>'


# ---------------- slide 1: tiêu đề + biểu đồ đường quy về 100 ----------------
def slide1(spec):
    s = spec["slide1"]
    ch = s["chart"]
    series = ch["series"]
    n = len(series[0]["values"])
    norm = [[v / se["values"][0] * 100 for v in se["values"]] for se in series]
    allv = [v for sr in norm for v in sr]
    t_lo, t_hi = 5 * math.floor(min(allv) / 5), 5 * math.ceil(max(allv) / 5)
    t_lo, t_hi = min(t_lo, 95), max(t_hi, 100)
    lo, hi = t_lo - 1, t_hi + 1
    W, H, ml, mr, mt, mb = 900, 480, 56, 190, 24, 46
    pw, ph = W - ml - mr, H - mt - mb
    X = lambda i: ml + i / (n - 1) * pw
    Y = lambda v: mt + (hi - v) / (hi - lo) * ph
    dash = 'stroke-dasharray="4 6"'
    grid = ""
    for g in range(t_lo, t_hi + 1, 5):
        base = g == 100
        grid += (f'<line x1="{ml}" x2="{ml+pw}" y1="{Y(g):.1f}" y2="{Y(g):.1f}" stroke="{MUTED if base else "#2A3345"}" stroke-width="{2 if base else 1}" {"" if base else dash}/>'
                 f'<text x="{ml-12}" y="{Y(g)+7:.1f}" text-anchor="end" font-size="22" fill="{MUTED}">{g}</text>')
    xt = ""
    for i, t in ch["xticks"]:
        a = "start" if i == 0 else "end" if i == n - 1 else "middle"
        xt += f'<text x="{X(i):.1f}" y="{H-12}" text-anchor="{a}" font-size="22" fill="{MUTED}">{e(t)}</text>'
    band = ""
    if ch.get("band"):
        b = ch["band"]
        band = (f'<rect x="{X(b["from"]):.1f}" y="{mt}" width="{X(b["to"])-X(b["from"]):.1f}" height="{ph}" fill="{RED}" fill-opacity=".09"/>'
                f'<text x="{(X(b["from"])+X(b["to"]))/2:.1f}" y="{Y(t_lo)-14:.1f}" text-anchor="middle" font-size="22" font-weight="700" fill="{INK}">{e(b["label"])}</text>')
    lines, ends, legend = "", "", ""
    order = sorted(range(len(series)), key=lambda k: series[k]["color"] == "gold")  # vàng vẽ sau cùng (nằm trên)
    for k in order:
        col = COLORS[series[k]["color"]]
        pts = " ".join(f"{X(i):.1f},{Y(v):.1f}" for i, v in enumerate(norm[k]))
        w = 6 if series[k]["color"] == "gold" else 5
        lines += f'<polyline points="{pts}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"/>'
    for k in range(len(series)):
        col = COLORS[series[k]["color"]]
        x, y, last = X(n - 1), Y(norm[k][-1]), norm[k][-1]
        ends += (f'<circle cx="{x:.1f}" cy="{y:.1f}" r="9" fill="{col}" stroke="{BG}" stroke-width="3"/>'
                 f'<text x="{x+22:.1f}" y="{y-4:.1f}" font-size="28" font-weight="800" fill="{INK}">{vi(last)}</text>'
                 f'<text x="{x+22:.1f}" y="{y+26:.1f}" font-size="24" font-weight="700" fill="{INK}">{sgn(last-100)}%</text>')
        legend += f'<span><i style="background:{col}"></i>{e(series[k]["name"])}</span>'
    svg = f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="font-family:\'Be Vietnam Pro\'">{band}{grid}{lines}{ends}{xt}</svg>'
    tone = COLORS.get(s.get("l2_tone", "red"), RED)
    pill_border = {"red": "rgba(255,90,90,.35)", "green": "rgba(34,197,94,.35)", "gold": "rgba(245,197,66,.35)"}.get(s.get("l2_tone", "red"))
    css = f"""
.t{{position:absolute;left:60px;width:960px;top:122px;line-height:1.02;font-weight:800}}
.pre{{font:700 25px 'Be Vietnam Pro';letter-spacing:2px;color:{MUTED};margin-bottom:18px}}
.l1{{font-size:{s.get("l1_size", 80)}px;color:{GOLD};text-shadow:0 6px 0 rgba(0,0,0,.45);white-space:nowrap}}
.l2{{display:inline-block;font-size:70px;color:{tone};background:rgba(8,10,14,.85);padding:2px 26px 10px;border-radius:22px;margin-top:10px;border:2px solid {pill_border}}}
.l3{{margin-top:22px;font:italic 700 44px/1.15 'Playfair Display';color:{INK}}}
.leg{{position:absolute;left:30px;top:20px;display:flex;gap:34px;font:700 26px 'Be Vietnam Pro'}}
.leg i{{display:inline-block;width:38px;height:6px;border-radius:3px;margin-right:12px;vertical-align:middle}}
.cap{{position:absolute;left:30px;top:66px;font:400 24px 'Be Vietnam Pro';color:{MUTED}}}
.sw{{position:absolute;right:60px;bottom:124px;font:800 30px 'Be Vietnam Pro';color:{GOLD}}}
"""
    body = (f'<div class="tag">PHAN HIẾU STOCK</div><div class="stamp">{e(spec["stamp"])}</div>'
            f'<div class="t"><div class="pre">{e(s["pre"])}</div><div class="l1">{e(s["l1"])}</div><div class="l2">{e(s["l2"])}</div><div class="l3">{e(s["l3"])}</div></div>'
            f'<div class="card" style="top:500px;height:680px"><div class="leg">{legend}</div><div class="cap">{e(ch["caption"])}</div>'
            f'<div style="position:absolute;left:30px;top:104px">{svg}</div>'
            f'<div style="position:absolute;left:30px;bottom:22px;right:30px;font:700 27px/1.3 \'Be Vietnam Pro\';color:{INK}">{e(ch["takeaway"])}</div></div>'
            f'<div class="sw">Vuốt → 3 điều</div>' + foot(spec, s["sources"]))
    return page(body, css)


# ---------------- slide 2: các thẻ lớn + ghi chú ----------------
def slide2(spec):
    s = spec["slide2"]
    cards = ""
    for c in s["cards"]:
        big = f'<div class="big" style="font-size:{c.get("big_size", 104)}px">{e(c["big"])}' + (f'<span> {e(c["unit"])}</span>' if c.get("unit") else "") + "</div>"
        chips = "".join(f'<span class="chip">{e(x)}</span>' for x in c.get("chips", []))
        cards += f'<div class="card"><div class="lab">{e(c["label"])}</div>{big}<div class="p">{e(c["text"])}</div>{chips}</div>'
    title = "<br>".join(e(x) for x in s["title"])
    css = f"""
.h{{position:absolute;left:60px;top:128px;width:960px;font-weight:800;line-height:1.05}}
.h small{{display:block;font:800 30px 'Be Vietnam Pro';letter-spacing:4px;color:{GOLD};margin-bottom:12px}}
.h div{{font-size:60px}}
.stack{{position:absolute;left:60px;top:352px;width:960px;display:flex;flex-direction:column;gap:20px}}
.stack .card{{position:static;padding:30px 40px}}
.big{{font-weight:800;line-height:1;color:{INK};margin:10px 0 8px}}
.big span{{font-size:48px;color:{MUTED}}}
.p{{font:400 31px/1.35 'Be Vietnam Pro';color:{INK}}}
.note{{border:3px solid {GOLD};border-radius:22px;padding:20px 28px;font:700 31px/1.3 'Be Vietnam Pro';color:{INK};background:rgba(245,197,66,.08)}}
"""
    body = (f'<div class="tag">PHAN HIẾU STOCK</div><div class="stamp">ĐIỀU 2 / 3</div>'
            f'<div class="h"><small>{e(s["kicker"])}</small><div>{title}</div></div>'
            f'<div class="stack">{cards}<div class="note">{e(s["note"])}</div></div>' + foot(spec, s["sources"]))
    return page(body, css)


def bars_svg(b, H=262):
    labels, vals = b["labels"], b["values"]
    n = len(vals)
    W, ml, mt, mb = 900, 56, 36, 44
    pw, ph = W - ml - 10, H - mt - mb
    mx = float(b["ymax"])
    bw = 62
    gap = (pw - n * bw) / (n - 1)
    k0 = n - b.get("highlight_last", 2)
    bars, lbl = "", ""
    for i, (a, v) in enumerate(zip(labels, vals)):
        x = ml + i * (bw + gap)
        h = v / mx * ph
        y = mt + ph - h
        col = GOLD if i >= k0 else BAR
        bars += f'<path d="M{x:.1f},{mt+ph} V{y+4:.1f} a4,4 0 0 1 4,-4 h{bw-8} a4,4 0 0 1 4,4 V{mt+ph} Z" fill="{col}"/>'
        if i in b.get("label_idx", []):
            bars += f'<text x="{x+bw/2:.1f}" y="{y-10:.1f}" text-anchor="middle" font-size="26" font-weight="800" fill="{INK}">{vi(v)}</text>'
        lbl += f'<text x="{x+bw/2:.1f}" y="{H-14}" text-anchor="middle" font-size="21" fill="{MUTED}">{e(a)}</text>'
    dash = 'stroke-dasharray="4 6"'
    grid = "".join(f'<line x1="{ml}" x2="{W-10}" y1="{mt+ph-g/mx*ph:.1f}" y2="{mt+ph-g/mx*ph:.1f}" stroke="#2A3345" stroke-width="1" {dash}/><text x="{ml-12}" y="{mt+ph-g/mx*ph+7:.1f}" text-anchor="end" font-size="22" fill="{MUTED}">{g}</text>' for g in b["yticks"])
    svg = f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="font-family:\'Be Vietnam Pro\'">{grid}<line x1="{ml}" x2="{W-10}" y1="{mt+ph}" y2="{mt+ph}" stroke="{MUTED}" stroke-width="2"/>{bars}{lbl}</svg>'
    return svg


# ---------------- slide 3: hai ô số + giải thích + biểu đồ cột ----------------
def slide3(spec):
    s = spec["slide3"]
    tiles = ""
    for k, t in enumerate(s["tiles"]):
        tone = COLORS[t["tone"]]
        bord = "rgba(255,90,90,.45)" if t["tone"] == "red" else "rgba(34,197,94,.45)"
        tiles += (f'<div class="card tile" style="left:{60 if k == 0 else 558}px;border-color:{bord}"><div class="lab2">{e(t["label"])}</div>'
                  f'<div class="v"><i style="color:{tone}">{e(t["arrow"])}</i>{e(t["value"])}</div><div class="s">{e(t["sub"])}</div></div>')
    b = s["bars"]
    svg = bars_svg(b)
    title = "<br>".join(e(x) for x in s["title"])
    css = f"""
.h{{position:absolute;left:60px;top:124px;width:960px;font-weight:800;line-height:1.05}}
.h small{{display:block;font:800 30px 'Be Vietnam Pro';letter-spacing:4px;color:{GOLD};margin-bottom:12px}}
.h div{{font-size:56px}}
.tile{{top:340px;width:462px;height:290px;padding:26px 30px}}
.lab2{{font:700 25px/1.25 'Be Vietnam Pro';color:{INK}}}
.tile .v{{font:800 88px/1 'Be Vietnam Pro';margin-top:16px;color:{INK};white-space:nowrap}}
.tile .v i{{font-style:normal;font-size:44px;vertical-align:10px;margin-right:10px}}
.tile .s{{font:400 24px/1.3 'Be Vietnam Pro';color:{MUTED};margin-top:10px}}
.why{{position:absolute;left:60px;top:654px;width:960px;font:700 30px/1.35 'Be Vietnam Pro';color:{INK}}}
.why b{{color:{GOLD}}}
.ct{{position:absolute;left:30px;top:20px;font:700 27px/1.3 'Be Vietnam Pro';color:{INK}}}
.ct span{{display:block;font:400 22px 'Be Vietnam Pro';color:{MUTED}}}
"""
    body = (f'<div class="tag">PHAN HIẾU STOCK</div><div class="stamp">ĐIỀU 3 / 3</div>'
            f'<div class="h"><small>{e(s["kicker"])}</small><div>{title}</div></div>{tiles}'
            f'<div class="why"><b>{e(s["why_bold"])}</b> {e(s["why"])}</div>'
            f'<div class="card" style="top:846px;height:350px"><div class="ct">{e(b["title"])}<span>{e(b["subtitle"])}</span></div>'
            f'<div style="position:absolute;left:30px;top:72px">{svg}</div></div>' + foot(spec, s["sources"]))
    return page(body, css)


# ---------------- ảnh đơn: tiêu đề + các khối (stats / list / table / claim / bars / note) ----------------
def card(spec):
    parts = ""
    for blk in spec["blocks"]:
        t = blk["type"]
        if t == "stats":
            items = blk["items"]
            big = 88 if len(items) == 2 else 50
            tiles = ""
            for it in items:
                tone = it.get("tone", "plain")
                bord = {"red": "rgba(255,90,90,.45)", "green": "rgba(34,197,94,.45)", "gold": "rgba(245,197,66,.45)"}.get(tone, "rgba(255,255,255,.09)")
                arrow = f'<i style="color:{COLORS[tone]}">{e(it["arrow"])}</i>' if it.get("arrow") and tone in COLORS else ""
                sub = f'<div class="s">{e(it["sub"])}</div>' if it.get("sub") else ""
                tiles += f'<div class="tl" style="border-color:{bord}"><div class="lab2">{e(it["label"])}</div><div class="v" style="font-size:{big}px">{arrow}{e(it["value"])}</div>{sub}</div>'
            parts += f'<div class="row">{tiles}</div>'
        elif t == "list":
            li = "".join(f'<div class="li"><div class="n">{k}</div><div><div class="hd">{e(x["head"])}</div><div class="tx">{e(x["text"])}</div></div></div>' for k, x in enumerate(blk["items"], 1))
            parts += f'<div class="lst">{li}</div>'
        elif t == "table":
            ac = blk.get("arrow_col", 1)
            th = "".join(f"<th>{e(x)}</th>" for x in blk["head"])
            tr = ""
            for r_ in blk["rows"]:
                tr += "<tr>"
                for ci, cv in enumerate(r_["cells"]):
                    ar = f'<i style="color:{COLORS[r_["tone"]]}">{e(r_["arrow"])}</i> ' if ci == ac and r_.get("arrow") and r_.get("tone") in COLORS else ""
                    cls = "c0" if ci == 0 else "c1" if ci == ac or ci == 1 else "c2"
                    tr += f"<td class='{cls}'>{ar}{e(cv)}</td>"
                tr += "</tr>"
            parts += f'<table class="tb"><tr>{th}</tr>{tr}</table>'
        elif t == "claim":
            parts += f'<div class="claim">{e(blk["text"])}</div>'
        elif t == "bars":
            parts += f'<div class="card bx"><div class="ct">{e(blk["title"])}<span>{e(blk["subtitle"])}</span></div><div style="margin-top:14px">{bars_svg(blk, 230)}</div></div>'
        elif t == "note":
            parts += f'<div class="note">{e(blk["text"])}</div>'
        else:
            sys.exit(f"Khối không hỗ trợ: {t}")
    title = "<br>".join(e(x) for x in spec["title"])
    css = f"""
.wrap{{position:absolute;left:60px;top:122px;width:960px;display:flex;flex-direction:column;gap:22px}}
.h small{{display:block;font:800 30px 'Be Vietnam Pro';letter-spacing:4px;color:{GOLD};margin-bottom:12px}}
.h div{{font:800 {spec.get("title_size", 60)}px/1.05 'Be Vietnam Pro'}}
.row{{display:flex;gap:20px}}
.tl{{flex:1;min-width:0;background:rgba(255,255,255,.045);border:2px solid rgba(255,255,255,.09);border-radius:28px;padding:24px 26px}}
.lab2{{font:700 25px/1.25 'Be Vietnam Pro';color:{INK}}}
.tl .lab2{{font-size:{25 if len(spec["blocks"][0].get("items", [])) == 2 else 22}px}}
.tl .v{{font-weight:800;line-height:1;margin-top:14px;color:{INK};white-space:nowrap}}
.tl .v i{{font-style:normal;font-size:.5em;vertical-align:.18em;margin-right:8px}}
.tl .s{{font:400 23px/1.3 'Be Vietnam Pro';color:{MUTED};margin-top:10px}}
.lst{{display:flex;flex-direction:column;gap:18px}}
.li{{display:flex;gap:22px;align-items:flex-start;background:rgba(255,255,255,.045);border:2px solid rgba(255,255,255,.09);border-radius:24px;padding:22px 26px}}
.n{{flex:none;width:54px;height:54px;border-radius:50%;background:{GOLD};color:#111;font:800 30px/54px 'Be Vietnam Pro';text-align:center}}
.hd{{font:800 33px/1.2 'Be Vietnam Pro';color:{INK}}}
.tx{{font:400 28px/1.35 'Be Vietnam Pro';color:{INK};margin-top:6px}}
.tb{{width:100%;border-collapse:separate;border-spacing:0;background:rgba(255,255,255,.045);border:2px solid rgba(255,255,255,.09);border-radius:24px;overflow:hidden;font:400 28px 'Be Vietnam Pro'}}
.tb th{{text-align:left;font:700 22px 'Be Vietnam Pro';letter-spacing:2px;color:{MUTED};padding:16px 24px;border-bottom:2px solid rgba(255,255,255,.09)}}
.tb td{{padding:14px 24px;border-bottom:1px solid rgba(255,255,255,.06);color:{INK}}}
.tb tr:last-child td{{border-bottom:none}}
.tb .c0{{font-weight:800;white-space:nowrap}}.tb .c1{{font-weight:700;white-space:nowrap}}.tb .c2{{color:{MUTED};font-size:25px}}
.tb i{{font-style:normal;font-size:.8em}}
.claim{{font:italic 700 {spec.get("claim_size", 50)}px/1.2 'Playfair Display';color:{INK};padding:6px 4px}}
.bx{{position:static;padding:22px 26px;height:auto}}
.ct{{font:700 27px/1.3 'Be Vietnam Pro';color:{INK}}}.ct span{{display:block;font:400 22px 'Be Vietnam Pro';color:{MUTED}}}
.note{{border:3px solid {GOLD};border-radius:22px;padding:20px 28px;font:700 30px/1.3 'Be Vietnam Pro';color:{INK};background:rgba(245,197,66,.08)}}
"""
    body = (f'<div class="tag">PHAN HIẾU STOCK</div><div class="stamp">{e(spec["stamp"])}</div>'
            f'<div class="wrap"><div class="h"><small>{e(spec["kicker"])}</small><div>{title}</div></div>{parts}</div>' + foot(spec, spec["sources"]))
    return page(body, css)


def shell():
    for p in sorted(glob.glob("/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell")):
        return p
    sys.exit("Không tìm thấy headless_shell trong /opt/pw-browsers (Chromium của Playwright).")


def main(spec_path):
    sp = Path(spec_path).resolve()
    spec = json.loads(sp.read_text(encoding="utf-8"))
    out = sp.parent
    tmp = Path(tempfile.mkdtemp(prefix="post_"))
    kind = spec.get("type", "carousel")
    jobs = [(slide1, "post_1.png"), (slide2, "post_2.png"), (slide3, "post_3.png")] if kind == "carousel" else [(card, spec.get("out", "post.png"))]
    for i, (fn, name) in enumerate(jobs, 1):
        h = tmp / f"post_{i}.html"
        h.write_text(fn(spec), encoding="utf-8")
        png = out / name
        r = subprocess.run([shell(), "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", "--virtual-time-budget=4000",
                            "--window-size=1080,1350", f"--screenshot={png}", h.as_uri()], capture_output=True, text=True, timeout=120)
        if not png.exists():
            sys.exit(f"Chụp ảnh {name} lỗi: {r.stderr[-400:]}")
        print(png)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
