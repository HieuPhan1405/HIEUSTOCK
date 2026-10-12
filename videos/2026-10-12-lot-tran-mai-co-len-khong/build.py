#!/usr/bin/env python3
"""Video 12/10/2026 — LỘT TRẦN NGHỀ MÔI GIỚI: "Môi giới trả lời được mọi câu, trừ câu mã nào mai sẽ lên" (talking head 9:16, ~1:46).

Sinh public/index.html + public/cards/*.html. Phong cách: .claude/skills/hieu-talking-head-style (khuôn video GDP 4/10).
Mốc thời gian thẻ lấy từ tokens.json (th_align.py gióng lời Hiếu nói với whisper), nên thẻ bám đúng lời.
Kịch bản gốc: videos/scripts/series-lot-tran-nghe-moi-gioi-tap-mai-co-len-khong.md (Hiếu bỏ vài câu khi quay; thẻ chỉ hiện những gì anh đã nói).
Số liệu trên hình (đã kiểm 12/10/2026):
  · VN-Index 28/9–2/10 đóng cửa 1.780,68 / 1.777,73 / 1.768,62 / 1.749,30 / 1.737,71 (25/9: 1.785,11) — DNSE + Finhay/Tiền Phong (giảm 5 phiên liền, tổng 47,4 điểm).
  · GDP quý 3/2026 +9,95% (số ước tính, họp báo Cục Thống kê 3/10) — nhiều báo.
  · Công văn 3760/UBCK-QLKD ngày 7/5/2026 — trích nguyên văn từ Dân trí 13/05/2026 (Công văn gốc chưa đọc trực tiếp).
Chạy: python3 build.py     VÙNG AN TOÀN TIKTOK (1080x1920): trên ≥170px, dưới ≤1430px, trái ≥60px, phải ≤940px.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from th_lib import (BRAND_CSS, BRAND_HTML, DARKBG, Builder, count, fromto, pop, rise, slam, slide)  # noqa: E402

ROOT = Path(__file__).resolve().parent
B = Builder(ROOT, origin="48% 36%",
            keys={"vnindex", "gdp", "cong van", "ma nao", "mai ma", "rui ro", "khong ai", "chung khoan", "mua het", "moi gioi",
                  "khong biet", "ngay mai", "dat lenh", "thang 5", "yen tam"})
T, E, DUR = B.T, B.E, B.DUR
t_disc = B.t_disc

CHECK = ('<svg viewBox="0 0 24 24" width="38" height="38"><path d="M5 12.5l4.6 4.6L19 7" fill="none" stroke="#111" stroke-width="3.8" '
         'stroke-linecap="round" stroke-linejoin="round"/></svg>')
CROSS = ('<svg viewBox="0 0 24 24" width="38" height="38"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#fff" stroke-width="3.8" '
         'stroke-linecap="round"/></svg>')
SHADOW = "text-shadow:0 5px 0 rgba(0,0,0,.55),0 12px 34px rgba(0,0,0,.65)"

# ── 1) HOOK ──
t_ha, t_hb, t_hc = max(T("Mình") - 0.1, 0.05), T("không") - 0.12, T("mai") - 0.1
t_hook_end = min(E("sẽ lên", 0, 0.45), T("Hả") - 0.05)
B.card("c01-hook", 0.0, t_hook_end, """<div class="s">
<div id="tag">LỘT TRẦN NGHỀ MÔI GIỚI</div>
<div id="a">MÌNH LÀM TRONG NGÀNH CHỨNG KHOÁN</div>
<div id="b">KHÔNG BIẾT</div>
<div id="c">MAI MÃ NÀO LÊN</div></div>""", f"""
SEL .s{{position:absolute;left:60px;width:880px;top:178px;text-align:center;line-height:1}}
SEL .s div{{font-family:'Be Vietnam Pro';font-weight:800;opacity:0;{SHADOW}}}
SEL #tag{{display:inline-block;font-size:27px;letter-spacing:6px;color:@DARK@;background:@GOLD@;padding:8px 22px;border-radius:12px;text-shadow:none;margin-bottom:16px}}
SEL #a{{font-size:37px;color:#fff;letter-spacing:1px}}
SEL #b{{display:inline-block;white-space:nowrap;font-size:112px;color:#FF5A5A;margin:12px 0 8px;padding:0 30px 8px;background:rgba(10,10,10,.82);border-radius:24px;text-shadow:none}}
SEL #c{{font-size:96px;color:@GOLD@;white-space:nowrap}}""",
       [fromto("#c01-hook #tag", {"opacity": 0, "y": -20}, {"opacity": 1, "y": 0, "duration": .35, "ease": "power2.out"}, 0.08),
        fromto("#c01-hook #a", {"opacity": 0, "y": 20}, {"opacity": 1, "y": 0, "duration": .4, "ease": "power3.out"}, t_ha),
        slam("#c01-hook #b", t_hb, .36, 1.7),
        slam("#c01-hook #c", t_hc, .36, 1.5)])

# ── 2) "HẢ?" ──
t_q_s, t_q_e = T("Hả") - 0.05, E("sao", 0, 0.25)
B.card("c02-ha", t_q_s, t_q_e, '<div class="q" id="c02-q">HẢ?</div>', f"""
SEL .q{{position:absolute;left:60px;width:880px;top:215px;text-align:center;font:800 250px 'Be Vietnam Pro';color:@GOLD@;line-height:1;{SHADOW};opacity:0}}""",
       [fromto("#c02-q", {"opacity": 0, "scale": .4, "rotate": -8}, {"opacity": 1, "scale": 1, "rotate": 0, "duration": .45, "ease": "back.out(2.4)"}, t_q_s + 0.02)])

# ── 3) 3 câu hỏi trả lời được + 1 câu không ──
t3_s, t3_e = T("Hỏi mình") - 0.15, min(E("sẽ lên", 1, 0.7), T("Và nếu có ai") - 0.08)
B.card("c03-ticks", t3_s, t3_e, f"""<div class="w"><div class="k" id="c03-k">HỎI MÌNH VỀ MỘT MÃ…</div>
<div class="r ok" id="c03-r1"><span>Kinh doanh ra sao</span><b>{CHECK}</b></div>
<div class="r ok" id="c03-r2"><span>Rủi ro nằm ở đâu</span><b>{CHECK}</b></div>
<div class="r ok" id="c03-r3"><span>Đặt lệnh kiểu nào</span><b>{CHECK}</b></div>
<div class="r no" id="c03-r4"><span>Mai mã nào sẽ lên?</span><b>{CROSS}</b></div></div>""", """
SEL .w{position:absolute;left:60px;width:880px;top:186px;display:flex;flex-direction:column;gap:10px}
SEL .k{align-self:flex-start;PILL;padding:8px 20px;font:800 26px 'Be Vietnam Pro';color:#a8a8a8;letter-spacing:4px}
SEL .r{display:flex;justify-content:space-between;align-items:center;height:96px;padding:0 24px;border-radius:22px;box-shadow:0 14px 34px rgba(0,0,0,.4)}
SEL .r span{font:800 48px 'Be Vietnam Pro';color:#fff}
SEL .r b{display:flex;align-items:center;justify-content:center;width:62px;height:62px;border-radius:50%}
SEL .ok{background:color-mix(in srgb,#22C55E 16%,#151517);border:2px solid rgba(34,197,94,.6)} SEL .ok b{background:@GREEN@}
SEL .no{background:color-mix(in srgb,#EF4444 24%,#151517);border:3px solid @RED@} SEL .no span{color:#FF8A8A} SEL .no b{background:@RED@}""",
       [rise("#c03-k", t3_s + 0.02, 0.35, -20),
        slide("#c03-r1", T("kinh doanh") - 0.15, 0.4, -60), pop("#c03-r1 b", E("kinh doanh ra sao") - 0.05, 0.3),
        slide("#c03-r2", T("rủi ro") - 0.15, 0.4, -60), pop("#c03-r2 b", E("rủi ro nằm ở đâu") - 0.05, 0.3),
        slide("#c03-r3", T("đặt lệnh") - 0.15, 0.4, -60), pop("#c03-r3 b", E("đặt lệnh kiểu nào") - 0.05, 0.3),
        slam("#c03-r4", T("mai mã nào sẽ lên", 1) - 0.12, 0.4, 1.25, 0)])

# ── 4) nên lo, đừng mừng ──
t4_s, t4_e = T("Và nếu có ai") - 0.05, E("đừng mừng", 0, 0.5)
B.card("c04-lo", t4_s, t4_e, """<div class="w"><div class="k" id="c04-k">AI TRẢ LỜI CHẮC CHẮN CÂU ĐÓ…</div>
<div class="big" id="c04-b">NÊN LO</div><div class="sub" id="c04-s">chứ <i>đừng mừng</i></div></div>""", f"""
SEL .w{{position:absolute;left:60px;width:880px;top:186px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px}}
SEL .k{{PILL;padding:10px 22px;font:800 28px 'Be Vietnam Pro';color:#bdbdbd;letter-spacing:3px}}
SEL .big{{font:800 150px/1.05 'Be Vietnam Pro';color:#FF5A5A;padding:0 34px 8px;background:rgba(10,10,10,.82);border-radius:26px}}
SEL .sub{{font:700 58px 'Be Vietnam Pro';color:#fff;{SHADOW}}} SEL .sub i{{font:italic 700 74px 'Playfair Display';color:@GOLD@}}""",
       [rise("#c04-k", t4_s + 0.02, 0.35, -20), slam("#c04-b", T("nên lo") - 0.1, 0.4, 1.5, 0), rise("#c04-s", T("chứ đừng") - 0.1, 0.4, 20)])

# ── 5) Tại sao thế? — thẻ chương + 1 người vs hàng triệu người ──
t_ch1 = T("Tại sao thế") - 0.05
B.chapter("c05-ch1", t_ch1, t_ch1 + 2.1, "LÝ DO", "Tại sao thế?", "giá ngày mai do ai quyết định")

dots = "".join(f'<i class="d{1 if i % 3 == 0 else 0}" id="c06-d{i}"></i>' for i in range(36))
t6_s, t6_e = max(T("không có do") - 0.1, t_ch1 + 2.15), min(E("một lúc", 0, 0.55), T("Quý 3") - 0.15)
B.card("c06-crowd", t6_s, t6_e, f"""<div class="p" id="c06-p">
<div class="col" id="c06-l"><div class="ic"><div class="hd"></div><div class="bd"></div><u id="c06-x">{CROSS}</u></div><b>MỘT NGƯỜI</b><span>quyết định?</span></div>
<div class="col big" id="c06-rr"><div class="grid">{dots}</div><b>HÀNG TRIỆU NGƯỜI</b><span>cùng đặt lệnh một lúc</span></div></div>""", """
SEL .p{position:absolute;left:60px;width:880px;top:190px;height:430px;padding:26px 26px;PANEL;display:flex;gap:22px}
SEL .col{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;text-align:center}
SEL #c06-l{width:250px} SEL .big{flex:1}
SEL .ic{position:relative;width:170px;height:200px;margin-bottom:16px;opacity:.95}
SEL .hd{position:absolute;left:55px;top:0;width:60px;height:60px;border-radius:50%;background:#e8e8e8}
SEL .bd{position:absolute;left:25px;top:72px;width:120px;height:120px;border-radius:60px 60px 18px 18px;background:#e8e8e8}
SEL u{position:absolute;right:-8px;top:-10px;width:70px;height:70px;border-radius:50%;background:@RED@;display:flex;align-items:center;justify-content:center;text-decoration:none}
SEL .col b{font:800 36px 'Be Vietnam Pro';color:#fff} SEL .big b{color:@GOLD@;font-size:44px}
SEL .col span{font:700 28px 'Be Vietnam Pro';color:#aaa}
SEL .grid{display:grid;grid-template-columns:repeat(9,1fr);gap:12px;width:100%;margin:0 0 20px}
SEL .grid i{display:block;aspect-ratio:1;border-radius:50%;background:#d9d9d9} SEL .grid i.d1{background:@GOLD@}""",
       [rise("#c06-p", t6_s + 0.02, 0.4, -30), slide("#c06-l", T("một người") - 0.2, 0.4, -60), pop("#c06-x", E("quyết định") - 0.15, 0.35),
        rise("#c06-rr b", T("hàng triệu") - 0.1, 0.4, 20), rise("#c06-rr span", T("cùng đặt lệnh") - 0.1, 0.4, 20),
        fromto("#c06-rr .grid i", {"opacity": 0, "scale": .2}, {"opacity": 1, "scale": 1, "duration": .3, "ease": "back.out(2)", "stagger": 0.022}, T("hàng triệu") - 0.05)])

# ── 6) GDP gần 10% mà VN-Index giảm 5 phiên (thẻ dữ liệu toàn màn hình) ──
DROPS = [("28/9", 4.43), ("29/9", 2.95), ("30/9", 9.11), ("1/10", 19.32), ("2/10", 11.59)]   # DNSE: điểm giảm mỗi phiên
HMAX = 240
cols = "".join(
    f'<div class="c" id="c07-c{i}"><span class="v">−{str(d).replace(".", ",")}</span><div class="bw"><div class="b" style="height:{max(int(HMAX * d / 19.32), 22)}px"></div></div><span class="dt">{day}</span></div>'
    for i, (day, d) in enumerate(DROPS))
t7_s, t7_e = T("Quý 3") - 0.1, E("đi ngược", 0, 0.7)
t_bars = T("giảm") - 0.2
B.card("c07-vni", t7_s, t7_e, BRAND_HTML % "c07-br" + f"""
<div class="g" id="c07-g"><div class="l">GDP QUÝ 3</div><div class="v">+<span id="c07-n">0</span><small>%</small></div><div class="s">so với cùng kỳ · Cục Thống kê (số ước tính)</div></div>
<div class="m" id="c07-m">vậy mà…</div>
<div class="vn" id="c07-vn"><div class="h"><span>VN-INDEX · 28/9 → 2/10</span><b id="c07-tot">−47,4 điểm</b></div>
<div class="bars">{cols}</div><div class="ft">5 phiên liền giảm · dữ liệu DNSE, đóng cửa</div></div>
<div class="st" id="c07-st"><b>Kinh tế tốt</b> · chỉ số <i>vẫn đi ngược</i></div>""", BRAND_CSS + """
SEL .g{position:absolute;left:60px;width:880px;top:306px;display:flex;align-items:baseline;gap:22px;flex-wrap:wrap}
SEL .g .l{font:800 36px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .g .v{font:800 150px 'Be Vietnam Pro';color:@GREEN@;line-height:1} SEL .g .v small{font:700 60px 'Be Vietnam Pro';color:#bbb}
SEL .g .s{flex-basis:100%;font:700 27px 'Be Vietnam Pro';color:#8b8bff;margin-top:-4px}
SEL .m{position:absolute;left:60px;width:880px;top:506px;text-align:center;font:italic 700 54px 'Playfair Display';color:@GOLD@}
SEL .vn{position:absolute;left:60px;width:880px;top:578px;padding:20px 26px 14px;border-radius:28px;background:#171719;border:2px solid #2d2d31}
SEL .vn .h{display:flex;justify-content:space-between;align-items:baseline}
SEL .vn .h span{font:800 28px 'Be Vietnam Pro';color:#bdbdbd;letter-spacing:3px} SEL .vn .h b{font:800 54px 'Be Vietnam Pro';color:#FF5A5A}
SEL .bars{display:flex;gap:16px;align-items:flex-start;margin-top:10px}
SEL .c{flex:1;display:flex;flex-direction:column;align-items:center}
SEL .c .v{font:800 34px 'Be Vietnam Pro';color:#FF7A7A;margin-bottom:6px} SEL .c .dt{font:700 28px 'Be Vietnam Pro';color:#cfcfcf;margin-top:8px}
SEL .bw{height:250px;width:100%;display:flex;align-items:flex-start;justify-content:center}
SEL .b{width:100%;max-width:120px;border-radius:12px;background:linear-gradient(to bottom,#FF6B6B,#C42B2B);transform-origin:50% 0}
SEL .ft{font:700 25px 'Be Vietnam Pro';color:#8b8bff;margin-top:6px;text-align:center}
SEL .st{position:absolute;left:60px;width:880px;top:1066px;text-align:center;font:800 44px 'Be Vietnam Pro';color:#fff}
SEL .st b{color:@GREEN@} SEL .st i{font:italic 700 52px 'Playfair Display';color:#FF5A5A}""",
       [pop("#c07-br", t7_s + 0.05, 0.4),
        rise("#c07-g", T("gần 10%") - 0.4, 0.45, 30), count("#c07-n", T("gần 10%") - 0.25, 9.95, 1.0, dec=2),
        rise("#c07-m", T("vậy mà") - 0.1, 0.4, 20), rise("#c07-vn", T("VN-Index") - 0.15, 0.5, 60)]
       + [fromto(f"#c07-c{i} .b", {"scaleY": 0}, {"scaleY": 1, "duration": .28, "ease": "power3.out"}, t_bars + 0.2 * i) for i in range(5)]
       + [fromto(f"#c07-c{i} .v,#c07-c{i} .dt", {"opacity": 0}, {"opacity": 1, "duration": .2}, t_bars + 0.2 * i + 0.1) for i in range(5)]
       + [pop("#c07-tot", E("5 phiên") - 0.2, 0.4), rise("#c07-st", T("Kinh tế tốt") - 0.1, 0.45, 20)],
       full=True, bg=DARKBG, dy=-20)

# ── 7) người biết chắc → mua hết → không rảnh nói ──
t8_s, t8_e = T("Và nghĩ thêm") - 0.05, E("nói cho anh chị", 0, 0.5)
B.card("c08-biet", t8_s, t8_e, """<div class="w">
<div class="st a" id="c08-a">Người <b>nghĩ chắc</b> mai mã nào lên</div>
<div class="ar" id="c08-r1">↓</div>
<div class="st b" id="c08-b">MUA HẾT</div>
<div class="ar" id="c08-r2">↓</div>
<div class="st c" id="c08-c">đâu rảnh <i>nói cho ai</i></div></div>""", f"""
SEL .w{{position:absolute;left:60px;width:880px;top:186px;text-align:center;display:flex;flex-direction:column;gap:4px}}
SEL .st{{display:block;border-radius:22px;padding:12px 18px;box-shadow:0 14px 34px rgba(0,0,0,.4)}}
SEL .a{{font:700 44px 'Be Vietnam Pro';color:#fff;background:color-mix(in srgb,#F5C542 16%,#151517);border:2px solid rgba(245,197,66,.6)}} SEL .a b{{color:@GOLD@;font-weight:800}}
SEL .b{{font:800 96px/1.1 'Be Vietnam Pro';color:@GREEN@;background:color-mix(in srgb,#22C55E 16%,#151517);border:3px solid @GREEN@}}
SEL .c{{font:700 46px 'Be Vietnam Pro';color:#e8e8e8;background:#1a1a1c;border:2px dashed #8a8a8a}} SEL .c i{{font:italic 700 56px 'Playfair Display';color:#FF7A7A}}
SEL .ar{{font:800 40px 'Be Vietnam Pro';color:#e0e0e0;height:40px;line-height:40px;{SHADOW}}}""",
       [slide("#c08-a", T("nghĩ chắc") - 0.25, 0.4, -60),
        rise("#c08-r1", T("họ sẽ làm gì") + 0.2, 0.25, -10), slam("#c08-b", T("mua hết") - 0.1, 0.36, 1.3, 0),
        rise("#c08-r2", T("mua hết") + 0.45, 0.25, -10), slide("#c08-c", T("đâu rảnh") - 0.1, 0.4, 60)])

# ── 8) hỏi ngược một câu ──
t9_s, t9_e = T("Nếu anh chị không tin") - 0.05, min(E("mua hết đi", 0, 0.8), T("Tháng 5") - 0.2)
t9_b = T("Nếu anh chị chắc")
B.card("c09-hoi", t9_s, t9_e, """<div class="w"><div class="k" id="c09-k">HỎI NGƯỢC <i>một câu</i></div>
<div class="bub" id="c09-b"><span id="c09-t">Nếu anh chắc như vậy, sao anh không tự mua hết đi?</span></div>
<div class="who" id="c09-w">bạn hỏi người nói chắc ↑</div></div>""", f"""
SEL .w{{position:absolute;left:60px;width:880px;top:186px;display:flex;flex-direction:column;gap:12px}}
SEL .k{{align-self:flex-start;PILL;padding:10px 24px;font:800 30px 'Be Vietnam Pro';color:#bdbdbd;letter-spacing:5px}} SEL .k i{{font:italic 700 48px 'Playfair Display';color:@GOLD@;letter-spacing:0}}
SEL .bub{{background:@WHITE@;border-radius:36px 36px 36px 10px;padding:22px 30px;box-shadow:0 14px 34px rgba(0,0,0,.4)}}
SEL .bub span{{display:block;font:800 52px/1.22 'Be Vietnam Pro';color:@DARK@}}
SEL .who{{font:700 28px 'Be Vietnam Pro';color:#f0f0f0;text-align:right;{SHADOW}}}""",
       [rise("#c09-k", t9_s + 0.02, 0.35, -20),
        fromto("#c09-b", {"opacity": 0, "scale": .85, "y": 20}, {"opacity": 1, "scale": 1, "y": 0, "duration": .35, "ease": "back.out(1.6)"}, t9_b - 0.1),
        fromto("#c09-t", {"clipPath": "inset(0 100% 0 0)"}, {"clipPath": "inset(0 0% 0 0)", "duration": max(E("mua hết đi") - t9_b - 0.2, .8), "ease": "power1.inOut"}, t9_b),
        rise("#c09-w", E("mua hết đi") - 0.3, 0.4, 10)])

# ── 9) Công văn 3760 ──
t10_s, t10_e = T("Tháng 5") - 0.05, min(E("trên mạng", 0, 0.7), T("Điều đó") - 0.1)
B.card("c10-cv", t10_s, t10_e, """<div class="src" id="c10-src">DÂN TRÍ · 13/05/2026</div>
<div class="ttl" id="c10-t"><b>Công văn 3760/UBCK-QLKD</b><span>Ủy ban Chứng khoán Nhà nước · ngày 7/5/2026</span></div>
<div class="qq" id="c10-q1"><i>“</i>UBCKNN <mark id="c10-m1">đề nghị</mark> các công ty chứng khoán <u>rà soát hoạt động của người hành nghề và nhân viên</u>…</div>
<div class="qq" id="c10-q2"><i>“</i>…có trường hợp cá nhân <mark id="c10-m2">giới thiệu nơi làm việc, chức danh</mark> hoặc quá trình công tác tại công ty chứng khoán <u>khi thực hiện các nội dung nhận định và khuyến nghị đầu tư</u></div>
<div class="nt" id="c10-nt">Trích theo báo Dân trí</div>""", """
SEL .src{position:absolute;left:60px;top:200px;font:800 28px 'Be Vietnam Pro';color:#8b8bff;letter-spacing:4px;padding:8px 18px;border:2px solid rgba(139,139,255,.5);border-radius:12px}
SEL .ttl{position:absolute;left:60px;width:880px;top:290px} SEL .ttl b{display:block;white-space:nowrap;font:800 55px 'Be Vietnam Pro';color:#fff;line-height:1.15} SEL .ttl span{font:700 32px 'Be Vietnam Pro';color:@GOLD@}
SEL .qq{position:absolute;left:60px;width:880px;padding:18px 26px 18px 34px;border-left:8px solid @GOLD@;background:rgba(255,255,255,.06);border-radius:0 22px 22px 0;font:700 40px/1.3 'Be Vietnam Pro';color:#f2f2f2}
SEL #c10-q1{top:470px} SEL #c10-q2{top:700px}
SEL .qq i{font:italic 700 80px 'Playfair Display';color:@GOLD@;line-height:0;vertical-align:-24px;margin-right:6px}
SEL mark{background:linear-gradient(@GOLD@,@GOLD@) no-repeat 0 100%/0% 100%;color:@DARK@;padding:0 6px;border-radius:6px;font-weight:800}
SEL u{text-decoration:none;border-bottom:3px solid rgba(245,197,66,.55)}
SEL .nt{position:absolute;left:60px;width:880px;top:1020px;font:700 26px 'Be Vietnam Pro';color:#8b8bff}""",
       [rise("#c10-src", t10_s + 0.05, 0.4, 10), rise("#c10-t", t10_s + 0.2, 0.5, 30),
        rise("#c10-q1", T("đề nghị") - 0.2, 0.5, 40), fromto("#c10-m1", {"backgroundSize": "0% 100%"}, {"backgroundSize": "100% 100%", "duration": .4, "ease": "power2.out"}, T("đề nghị") + 0.1),
        rise("#c10-q2", T("vì có người") - 0.2, 0.5, 40), fromto("#c10-m2", {"backgroundSize": "0% 100%"}, {"backgroundSize": "100% 100%", "duration": .5, "ease": "power2.out"}, T("giới thiệu") - 0.05),
        rise("#c10-nt", T("rồi khuyến nghị") - 0.1, 0.4, 10)], full=True, bg=DARKBG, dy=-20)

# ── 10) Điều đó không có nghĩa là… (thẻ chương) + môi giới nói được ba điều ──
t_ch2 = T("Điều đó") - 0.05
B.chapter("c11-ch2", t_ch2, t_ch2 + 2.1, "LƯU Ý", "Không có nghĩa là", "môi giới chỉ biết nói “không biết”")

t12_s, t12_e = max(T("Họ nói được") - 0.1, t_ch2 + 2.15), min(E("tính trước chưa", 0, 0.55), T("Công thức") - 0.1)
B.card("c12-three", t12_s, t12_e, """<div class="w"><div class="k" id="c12-k">MÔI GIỚI NÓI ĐƯỢC</div>
<div class="it" id="c12-i1"><b>1</b><span>Mã này đang làm gì</span></div>
<div class="it" id="c12-i2"><b>2</b><span>Rủi ro nằm ở đâu</span></div>
<div class="it" id="c12-i3"><b>3</b><span>Giá đi ngược thì sao?</span></div></div>""", """
SEL .w{position:absolute;left:60px;width:880px;top:186px;display:flex;flex-direction:column;gap:10px}
SEL .k{align-self:flex-start;PILL;padding:8px 20px;font:800 26px 'Be Vietnam Pro';color:#a8a8a8;letter-spacing:5px}
SEL .it{display:flex;align-items:center;gap:20px;PILL;padding:12px 24px}
SEL .it b{font:800 36px 'Be Vietnam Pro';color:@DARK@;background:@GOLD@;border-radius:12px;padding:2px 16px}
SEL .it span{font:800 50px 'Be Vietnam Pro';color:#fff}""",
       [rise("#c12-k", t12_s + 0.02, 0.35, -20), slide("#c12-i1", T("mã này đang làm gì") - 0.1, 0.4, -60),
        slide("#c12-i2", T("rủi ro nằm ở đâu", 1) - 0.1, 0.4, -60), slide("#c12-i3", T("nếu giá đi ngược") - 0.1, 0.4, -60)])

# ── 11) Công thức một câu ──
t13_s, t13_e = T("Công thức") - 0.05, E("yên tâm", 0, 0.6)
B.card("c13-ct", t13_s, t13_e, """<div class="k" id="c13-k">CÔNG THỨC MỘT CÂU</div>
<div class="w">
<div class="p g1" id="c13-a1">Ngày mai không ai biết</div>
<div class="ar" id="c13-ar1">↓</div>
<div class="p g2" id="c13-a2">Người đáng tin <b>nói thẳng họ không biết</b> và chỉ ra rủi ro</div>
<div class="gap"></div>
<div class="p r1" id="c13-b1">Người nói chắc</div>
<div class="ar" id="c13-ar2">↓</div>
<div class="p r2" id="c13-b2">đang bán <b>cảm giác yên tâm</b></div></div>""", """
SEL .k{position:absolute;left:60px;top:215px;font:800 32px 'Be Vietnam Pro';color:@DARK@;background:@GOLD@;padding:8px 22px;border-radius:12px;letter-spacing:5px}
SEL .w{position:absolute;left:60px;width:880px;top:296px;display:flex;flex-direction:column;gap:10px}
SEL .p{padding:20px 26px 22px;border-radius:26px;text-align:center;box-shadow:0 14px 34px rgba(0,0,0,.4)}
SEL .g1,SEL .g2{border:3px solid @GREEN@} SEL .r1,SEL .r2{border:3px solid @RED@}
SEL .g1{background:#131315;font:800 58px 'Be Vietnam Pro';color:#fff} SEL .g2{background:color-mix(in srgb,#22C55E 14%,#131315);font:700 48px/1.25 'Be Vietnam Pro';color:#e8e8e8}
SEL .r1{background:#131315;font:800 58px 'Be Vietnam Pro';color:#fff} SEL .r2{background:color-mix(in srgb,#EF4444 14%,#131315);font:700 52px/1.25 'Be Vietnam Pro';color:#e8e8e8}
SEL .g2 b{color:@GREEN@;font-weight:800} SEL .r2 b{color:#FF6B6B;font-weight:800}
SEL .ar{font:800 48px 'Be Vietnam Pro';color:#9a9a9a;text-align:center;line-height:1}
SEL .gap{height:30px}""",
       [rise("#c13-k", t13_s + 0.05, 0.4, 10),
        slide("#c13-a1", T("ngày mai không ai biết") - 0.15, 0.45, -80), rise("#c13-ar1", E("ngày mai không ai biết") - 0.1, 0.25, -10),
        slide("#c13-a2", T("nên người đáng tin") - 0.1, 0.45, -80),
        slide("#c13-b1", T("Người nói chắc đang") - 0.15, 0.45, 80), rise("#c13-ar2", T("Người nói chắc đang") + 0.35, 0.25, -10),
        slide("#c13-b2", T("đang bán") - 0.1, 0.45, 80)],
       full=True, bg=DARKBG, dy=-20)

# ── 12) Đừng hỏi … Hãy hỏi … ──
t14_s, t14_e = T("Nên lần sau") - 0.05, E("mình sẽ làm gì", 0, 0.6)
B.card("c14-hoi", t14_s, t14_e, """<div class="w"><div class="blk n" id="c14-n"><div class="l">ĐỪNG HỎI</div><div class="t" id="c14-nt">Mã này mai có lên không?<i id="c14-st"></i></div></div>
<div class="blk y" id="c14-y"><div class="l">HÃY HỎI</div><div class="t">Nếu nó giảm mạnh thì mình <b>lỗ bao nhiêu</b>, và mình <b>sẽ làm gì?</b></div></div></div>""", """
SEL .w{position:absolute;left:60px;width:880px;top:186px;display:flex;flex-direction:column;gap:12px}
SEL .blk{padding:14px 24px 18px;border-radius:24px;box-shadow:0 14px 34px rgba(0,0,0,.4)}
SEL .n{background:color-mix(in srgb,#EF4444 20%,#151517);border:3px solid @RED@} SEL .y{background:color-mix(in srgb,#22C55E 16%,#151517);border:3px solid @GREEN@}
SEL .l{font:800 26px 'Be Vietnam Pro';letter-spacing:6px;margin-bottom:6px} SEL .n .l{color:#FF7A7A} SEL .y .l{color:@GREEN@}
SEL .t{position:relative;display:inline-block;font:800 54px/1.2 'Be Vietnam Pro';color:#fff} SEL .y .t{font-size:48px;display:block} SEL .y b{color:@GREEN@}
SEL .t i{position:absolute;left:-6px;top:54%;height:7px;width:0;background:@RED@;border-radius:4px}""",
       [slide("#c14-n", T("mã này mai có lên không") - 0.3, 0.45, -80),
        fromto("#c14-st", {"width": 0}, {"width": "calc(100% + 12px)", "duration": .35, "ease": "power2.out"}, E("có lên không") - 0.05),
        slide("#c14-y", T("Hỏi nếu nó") - 0.1, 0.45, 80)])

# ── 13) Không ai ──
t_c16 = T("Còn muốn") - 0.05
t15_s, t15_e = T("Nếu anh chị chỉ muốn") - 0.05, min(E("không có ai", 0, 0.9), t_c16 - 0.03)
B.card("c15-ai", t15_s, t15_e, """<div class="s"><div class="q" id="c15-q">Có ai biết ngày mai?</div><div class="big" id="c15-b">KHÔNG AI</div><div class="n" id="c15-n">đọc đến đây là đủ</div></div>""", f"""
SEL .s{{position:absolute;left:60px;width:880px;top:190px;text-align:center;line-height:1}}
SEL .s div{{font-family:'Be Vietnam Pro';font-weight:800;opacity:0;{SHADOW}}}
SEL .q{{display:inline-block;PILL;padding:8px 24px 12px;font-size:48px;color:#fff;margin-bottom:12px;text-shadow:none}}
SEL .big{{display:inline-block;font-size:170px;color:#FF5A5A;padding:0 30px 10px;background:rgba(10,10,10,.82);border-radius:26px;text-shadow:none}}
SEL .n{{display:inline-block;PILL;padding:6px 24px 10px;font:italic 700 54px 'Playfair Display';color:@GOLD@;margin-top:14px;text-shadow:none}}""",
       [rise("#c15-q", t15_s + 0.05, 0.4, 20), slam("#c15-b", T("không có ai") - 0.1, 0.4, 1.6), rise("#c15-n", T("đọc đến đây") - 0.1, 0.4, 20)])

# ── 14) Khỏi bị lùa: đừng tin lời mình, hãy hỏi ──
t16_s, t16_e = t_c16, E("câu kia", 0, 0.5)
B.card("c16-lua", t16_s, t16_e, """<div class="w"><div class="a" id="c16-a">Muốn khỏi bị <i>lùa?</i></div>
<div class="b" id="c16-b">ĐỪNG TIN LỜI MÌNH</div>
<div class="k" id="c16-k">cứ hỏi người nói chắc:</div>
<div class="bub" id="c16-u">Nếu anh chắc, sao anh không tự mua hết đi?</div></div>""", f"""
SEL .w{{position:absolute;left:60px;width:880px;top:186px;display:flex;flex-direction:column;align-items:flex-start;gap:10px}}
SEL .a{{PILL;padding:10px 26px;font:700 46px 'Be Vietnam Pro';color:#fff}} SEL .a i{{font:italic 700 64px 'Playfair Display';color:@GOLD@}}
SEL .b{{PILL;border-color:rgba(245,197,66,.7);padding:6px 26px 10px;font:800 66px 'Be Vietnam Pro';color:@WHITE@}}
SEL .k{{font:700 30px 'Be Vietnam Pro';color:#f0f0f0;letter-spacing:2px;{SHADOW};margin-top:4px}}
SEL .bub{{font:800 40px/1.25 'Be Vietnam Pro';color:@DARK@;background:@WHITE@;padding:14px 26px;border-radius:30px 30px 30px 8px;box-shadow:0 14px 34px rgba(0,0,0,.4)}}""",
       [rise("#c16-a", t16_s + 0.05, 0.4, 14), rise("#c16-b", T("đừng tin lời mình") - 0.1, 0.4, 20),
        rise("#c16-k", T("cứ hỏi") - 0.1, 0.35, 14), pop("#c16-u", T("cứ hỏi") + 0.25, 0.4)])

# ── 15) CTA + disclaimer ──
t_cta_s = T("Anh chị còn câu hỏi") - 0.05
B.card("c17-cta", t_cta_s, DUR, """<div class="w"><div class="q" id="c17-q">Câu hỏi nào <i>môi giới hay ngại trả lời?</i></div>
<div class="bub" id="c17-b">Comment cho mình biết ↓</div></div>
<div class="lock" id="c17-l"><img src="img/icon.png"/><div><span>Biểu đồ &amp; dữ liệu tại</span><b>cloudstock.id.vn</b></div></div>
<div class="disc" id="c17-d">Nội dung giải thích, không phải khuyến nghị đầu tư. Ý kiến cá nhân, không đại diện công ty.<br>Đầu tư luôn có rủi ro mất vốn. Dữ liệu: DNSE (đóng cửa), Cục Thống kê (GDP ước tính), Dân trí 13/5/2026.</div>""", """
SEL .w{position:absolute;left:60px;width:880px;top:186px;display:flex;flex-direction:column;align-items:flex-start;gap:12px}
SEL .q{PILL;padding:14px 28px;font:800 50px/1.2 'Be Vietnam Pro';color:#fff} SEL .q i{font:italic 700 58px 'Playfair Display';color:@GOLD@}
SEL .bub{font:800 34px 'Be Vietnam Pro';color:@DARK@;background:@WHITE@;padding:10px 24px;border-radius:40px 40px 40px 8px;box-shadow:0 14px 34px rgba(0,0,0,.4)}
SEL .lock{position:absolute;left:60px;width:880px;top:1090px;display:flex;align-items:center;gap:22px;padding:12px 22px;border-radius:26px;background:rgba(17,17,17,.88);border:2px solid rgba(167,139,250,.55)}
SEL .lock img{width:100px;height:100px;border-radius:22px}
SEL .lock span{display:block;font:700 28px 'Be Vietnam Pro';color:#cfcfcf} SEL .lock b{display:block;font:800 50px 'Be Vietnam Pro';color:#C4B5FD}
SEL .disc{position:absolute;left:60px;width:880px;top:1250px;padding:12px 16px;border-radius:16px;background:rgba(17,17,17,.78);text-align:center;font:400 26px 'Be Vietnam Pro';color:rgba(255,255,255,.95);line-height:1.4}""",
       [rise("#c17-q", t_cta_s + 0.02, 0.4, -30), pop("#c17-b", T("comment") - 0.05, 0.4),
        rise("#c17-l", t_disc - 0.2, 0.5, 40), fromto("#c17-d", {"opacity": 0}, {"opacity": 1, "duration": .4}, t_disc + 0.05)])

# ───────────────────────── ZOOM & SFX ─────────────────────────
for t, v in [(T("Hả"), 0.06), (T("Chỉ có một"), 0.05), (T("Tại sao thế"), 0.05), (T("Công thức"), 0.05), (T("không có ai"), 0.06), (T("Anh chị còn câu hỏi"), 0.05)]:
    B.push(t, v)

B.auto_sfx()
for t in [t_hb, t_hc, T("mai mã nào sẽ lên", 1) - 0.14, T("không có ai") - 0.1]:
    B.sfx(t, "thump", 0.5)
for t in [T("kinh doanh") - 0.05, T("rủi ro") - 0.05, T("đặt lệnh") - 0.05, T("nên lo") - 0.1, T("mua hết") - 0.1]:
    B.sfx(t, "click", 0.28)
for t in [T("gần 10%") - 0.25, E("5 phiên") - 0.2, E("quyết định") - 0.15, E("kinh doanh ra sao"), E("rủi ro nằm ở đâu"), E("đặt lệnh kiểu nào")]:
    B.sfx(t, "ding", 0.2)
for i in range(5):
    B.sfx(t_bars + 0.2 * i + 0.1, "pop", 0.2)

B.write()
