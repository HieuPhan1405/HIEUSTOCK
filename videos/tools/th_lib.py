#!/usr/bin/env python3
"""Thư viện dựng talking head 9:16 (HyperFrames + GSAP) cho Phan Hiếu Stock.

Rút từ videos/2026-10-04-gdp-q3/build.py (động cơ giữ nguyên, chỉ tách phần nội dung từng video ra build.py riêng).
Mỗi video có thư mục riêng: script.txt, tokens.json (align), offs.json (mốc nối đoạn), public/ (input-video.mp4, img/, fonts/, sfx/, vendor/).
build.py của video chỉ khai báo thẻ bằng `B.card(...)` / `B.chapter(...)`, mốc thời gian lấy từ lời nói bằng `B.T("cụm từ")` / `B.E("cụm từ")`,
rồi gọi `B.write()` → public/index.html + public/cards/*.html + storyboard.json.
VÙNG AN TOÀN TIKTOK (1080x1920): trên ≥170px, dưới ≤1430px, trái ≥60px, phải ≤940px.
"""
import json
import re
import unicodedata
from pathlib import Path

FPS, W, H = 30, 1080, 1920
GOLD, GREEN, RED, WHITE, DARK = "#F5C542", "#22C55E", "#EF4444", "#FAFAFA", "#111111"
COLORS = {"@GOLD@": GOLD, "@GREEN@": GREEN, "@RED@": RED, "@WHITE@": WHITE, "@DARK@": DARK}

# Vùng an toàn
SX, SW = 60, 880      # x từ 60, rộng 880 (biên phải 940)
TOP, BOT = 170, 1430  # y an toàn
CAP_TOP = 1170        # caption nằm trong 1170–1430

PANEL = "background:rgba(17,17,17,.86);border-radius:28px;box-shadow:0 18px 50px rgba(0,0,0,.35)"
PILL = "background:rgba(20,20,22,.93);border:2px solid #2f2f35;border-radius:24px;box-shadow:0 14px 34px rgba(0,0,0,.4)"   # khối riêng từng dòng (không có khung chung → không bị khung trống khi dòng chưa hiện)
DARKBG = "radial-gradient(110% 70% at 50% 30%,#1d1d1f 0%,#111111 70%)"
CREAMBG = "radial-gradient(120% 80% at 50% 45%,#FFFBF1 0%,#F3EBDA 100%)"

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

SFX_DUR = {"ding": 1.0, "whoosh": 1.0, "thump": 0.7}   # độ dài (giây) của từng file sfx/*.wav; mặc định 0.3

FONT_RANGES = {
    "latin": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    "latin-ext": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    "vietnamese": "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB",
}


def norm(w):
    w = unicodedata.normalize("NFD", w.lower().replace("đ", "d"))
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", w)


def q(t):
    return f"{round(t * FPS) / FPS:.4f}"


def qd(s, e):
    return f"{round(e * FPS) / FPS - round(s * FPS) / FPS:.4f}"


def fmt_pct(v):
    return ("+" if v > 0 else "−" if v < 0 else "") + f"{abs(v):.2f}".replace(".", ",") + "%"


# ───────────────────────── HELPER JS (GSAP) ─────────────────────────
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


def slam(sel, t, d=0.35, frm=1.6, dy=-30):
    """Chữ hook đập vào từ lớn xuống (scale 1.6 → 1)."""
    return fromto(sel, {"opacity": 0, "scale": frm, "y": dy}, {"opacity": 1, "scale": 1, "y": 0, "duration": d, "ease": "back.out(2)"}, t)


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


class Builder:
    def __init__(self, root, keys=(), good=("lai", "tang"), bad=("giam", "lo", "chua", "ap", "lan"),
                 origin="48% 30%", fonts_pubdir="fonts"):
        self.ROOT = Path(root)
        self.PUB = self.ROOT / "public"
        self.TOK = json.loads((self.ROOT / "tokens.json").read_text())
        self.OFFS = json.loads((self.ROOT / "offs.json").read_text())
        self.DUR = round(self.OFFS[-1][1] + self.OFFS[-1][2], 2)
        self.NT = [norm(t["w"]) for t in self.TOK]
        self.CARDS = {}
        self.SFX = []
        self.PUSH = []
        self.KEYS, self.GOOD, self.BAD = set(keys), set(good), set(bad)
        self.origin = origin
        self.t_disc = self.DUR - 3.6   # 3,6 s cuối dành cho disclaimer
        self.CUTS = [round(o[1], 3) for o in self.OFFS[1:]]

    # ── mốc thời gian từ lời nói ──
    def _find(self, phrase, nth=0):
        ws = [norm(x) for x in phrase.split()]
        hits = [i for i in range(len(self.NT) - len(ws) + 1) if self.NT[i:i + len(ws)] == ws]
        if len(hits) <= nth:
            raise KeyError(f"không thấy cụm: {phrase!r} (lần {nth}); có {len(hits)} lần")
        return hits[nth], len(ws)

    def T(self, phrase, nth=0, off=0.0):
        """Thời điểm bắt đầu cụm từ."""
        i, _ = self._find(phrase, nth)
        return self.TOK[i]["s"] + off

    def E(self, phrase, nth=0, off=0.0):
        """Thời điểm kết thúc cụm từ."""
        i, n = self._find(phrase, nth)
        return self.TOK[i + n - 1]["e"] + off

    # ── thẻ đồ hoạ ──
    def card(self, cid, s, e, body, css, js, full=False, bg=None, dy=0):
        css = css.replace("SEL", f'.card[data-card-id="{cid}"]').replace("PANEL", PANEL).replace("PILL", PILL)
        for k, v in COLORS.items():
            css = css.replace(k, v)
        root_bg = f"background:{bg};" if bg else ""
        if dy:
            body = f'<div style="position:absolute;inset:0;transform:translateY({dy}px)">{body}</div>'
        html = (f'<div class="card" data-card-id="{cid}"><style>'
                f'.card[data-card-id="{cid}"] .root{{position:absolute;inset:0;{root_bg}}}{css}'
                f'</style><div class="root">{body}</div></div>')
        self.CARDS[cid] = dict(s=s, e=e, track=4 if full else 3, full=full, html=html, js=js)

    def chapter(self, cid, s, e, num, title, sub):
        """Thẻ chương nền kem: hai thanh xám trượt vào, nhãn khung nét đứt, chữ gõ dần (giữ ≥ 2 s)."""
        self.card(cid, s, e, f"""<div class="bT" id="{cid}-bt"></div><div class="bB" id="{cid}-bb"></div>
<div class="lbl" id="{cid}-l"><div class="n">{num}</div><div class="tt" id="{cid}-tt">{title}</div><div class="sb">{sub}</div></div>""", """
SEL .bT{position:absolute;left:150px;top:0;width:130px;height:520px;background:#3a3a3a;border-radius:0 0 8px 8px}
SEL .bB{position:absolute;right:150px;bottom:0;width:130px;height:560px;background:#3a3a3a;border-radius:8px 8px 0 0}
SEL .lbl{position:absolute;left:500px;top:50%;transform:translate(-50%,-50%);padding:30px 50px;border:3px dashed rgba(17,17,17,.45);border-radius:14px;background:rgba(255,255,255,.35);text-align:center;box-shadow:0 18px 40px rgba(0,0,0,.12);white-space:nowrap;max-width:840px}
SEL .n{font:800 40px 'Be Vietnam Pro';color:@DARK@;background:@GOLD@;display:inline-block;padding:4px 20px;border-radius:12px}
SEL .tt{font:italic 700 92px 'Playfair Display';color:@DARK@;line-height:1.2}
SEL .sb{font:400 40px 'Pacifico';color:#555}""",
                  [fromto(f"#{cid}-bt", {"y": -560}, {"y": 0, "duration": .3, "ease": "power3.out"}, s),
                   fromto(f"#{cid}-bb", {"y": 600}, {"y": 0, "duration": .3, "ease": "power3.out"}, s),
                   fromto(f"#{cid}-l", {"opacity": 0, "scale": .85}, {"opacity": 1, "scale": 1, "duration": .3, "ease": "power3.out"}, s + 0.08),
                   fromto(f"#{cid}-tt", {"clipPath": "inset(0 100% 0 0)"}, {"clipPath": "inset(0 0% 0 0)", "duration": .4, "ease": "power2.inOut"}, s + 0.1),
                   f"tl.to('#{cid}-l',{{scale:1.05,duration:{max(0.5, e - s - 0.5):.2f},ease:'power1.inOut'}},{q(s + 0.4)});"],
                  full=True, bg=CREAMBG)

    # ── zoom / SFX ──
    def push(self, t, v=0.05):
        """Đẩy zoom nhẹ ở câu nhấn."""
        self.PUSH.append((t, v))

    def sfx(self, t, name, vol=0.3):
        self.SFX.append((t, name, vol))

    def auto_sfx(self):
        """whoosh khi thẻ toàn màn hình vào/ra, pop khi thẻ phủ một phần vào."""
        for cid, c in self.CARDS.items():
            self.SFX.append((c["s"], "whoosh" if c["full"] else "pop", 0.3 if c["full"] else 0.25))
            if c["full"] and c["e"] < self.DUR - 0.1:
                self.SFX.append((c["e"] - 0.15, "whoosh", 0.22))

    # ── caption tự động từ tokens ──
    def chunk_tokens(self):
        """Chia lời nói thành cụm 1–4 từ theo dấu câu / khoảng ngắt."""
        TOK = self.TOK
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

    def caption_list(self):
        out = []
        for ch in self.chunk_tokens():
            words = [re.sub(r"[.,:?!]+$", "", x["w"]) for x in ch]
            text = " ".join(words)
            nt = norm(text)
            n = len(words)
            if n <= 2:
                small, key = "", text
            elif n == 3:
                small, key = words[0], " ".join(words[1:])
            else:
                small, key = " ".join(words[:2]), " ".join(words[2:])
            bad = any(norm(w) in self.BAD for w in words)
            good = any(norm(w) in self.GOOD for w in words)
            has_key = any(k in nt for k in self.KEYS) or bool(re.search(r"\d", text))
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

    @staticmethod
    def key_size(text, kind):
        """Cỡ chữ từ khoá: ngắn → to; dài → nhỏ để vừa 880px, tối đa 2 dòng."""
        n = len(text)
        base = 92 if kind == "k" else 80
        if n <= 12:
            return base
        if n <= 17:
            return int(base * 0.86)
        return int(base * 0.72)

    # ── xuất file ──
    def write(self, caption_skip=()):
        """Sinh public/index.html, public/cards/*.html, storyboard.json.
        caption_skip: danh sách (s, e) khoảng thời gian không hiện caption (ngoài thẻ chương và 3,6 s cuối)."""
        PUB, DUR, CARDS, t_disc = self.PUB, self.DUR, self.CARDS, self.t_disc
        (PUB / "cards").mkdir(parents=True, exist_ok=True)
        hosts, js = [], []
        chapters = [(c["s"], c["e"]) for cid, c in CARDS.items() if "-ch" in cid] + list(caption_skip)

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
        for i, (s, small, key, kind, e) in enumerate(self.caption_list()):
            if any(a - 0.05 <= s < b for a, b in chapters) or s >= t_disc - 0.05:
                continue
            for a, b in chapters:
                if s < a < e:
                    e = a
            e = min(e, t_disc) if s < t_disc else e
            if e - s < 0.2:
                continue
            cls = {"k": "kk", "b": "kb", "g": "kg", "r": "kr"}[kind]
            fs = self.key_size(key, kind)
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
        events = sorted([(t, None) for t in self.CUTS] + [(t, v) for t, v in self.PUSH], key=lambda x: x[0])
        for t, v in events:
            if v is None:
                lvl = 1.1 if lvl < 1.05 else 1.0
                js.append(f"tl.set('#video-inner',{{scale:{lvl}}},{q(t)});")
            else:
                js.append(f"tl.to('#video-inner',{{scale:{lvl + v:.2f},duration:.45,ease:'power3.inOut'}},{q(t)});")

        sfx_list = sorted(self.SFX)
        sfx = "\n".join(
            f'<audio id="sfx-{i}" src="sfx/{f}.wav" data-start="{q(t)}" data-duration="{SFX_DUR.get(f, 0.3)}" data-track-index="{11 + i % 4}" data-volume="{v}"></audio>'
            for i, (t, f, v) in enumerate(sfx_list))

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
#video-inner{{position:absolute;inset:0;transform-origin:{self.origin}}}
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
        (self.ROOT / "storyboard.json").write_text(json.dumps({
            "schemaVersion": 3,
            "composition": {"fps": FPS, "width": W, "height": H, "durationSeconds": DUR, "layout": "portrait", "themeId": "noir", "seed": 42},
            "videoTrack": {"sourcePath": "input-video.mp4", "startSec": 0, "endSec": DUR},
            "subtitles": {"enabled": True, "style": "kinetic 2 dòng, trong vùng an toàn TikTok"},
            "cards": [{"id": k, "startSec": round(v["s"], 2), "endSec": round(v["e"], 2), "zone": "fullscreen" if v["full"] else "video-overlay"} for k, v in CARDS.items()],
        }, ensure_ascii=False, indent=2))
        print(f"{len(CARDS)} thẻ, {len(caps)} caption, {len(sfx_list)} sfx, dài {DUR:.2f}s")
