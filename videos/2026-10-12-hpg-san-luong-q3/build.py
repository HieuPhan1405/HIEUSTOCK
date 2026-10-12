#!/usr/bin/env python3
"""Video 12/10/2026 — HPG: "Bán 3,8 triệu tấn, tăng 54%: hơn một nửa mức tăng đến từ một loại thép" (talking head 9:16, ~1:40).

Sinh public/index.html + public/cards/*.html. Phong cách: .claude/skills/hieu-talking-head-style (khuôn video GDP 4/10).
Mốc thời gian thẻ lấy từ tokens.json (th_align.py gióng lời Hiếu nói với whisper), nên thẻ bám đúng lời.
Kịch bản gốc: videos/scripts/2026-10-12-hpg-san-luong-q3-9t26.md (Hiếu bỏ câu "giá cổ phiếu sắp tới… ba thứ mình theo dõi" khi quay; thẻ chỉ hiện những gì anh đã nói).
Số liệu trên hình (đã kiểm 12/10/2026 với bản công bố của Hòa Phát trên hoaphat.com.vn + CafeF + Công Luận):
  · Quý 3/2026: bán hàng 3,8 triệu tấn (+54% cùng kỳ); 9 tháng 10,3 triệu tấn (+39%) · HRC > 2 triệu tấn (+64%) · thép xây dựng + cuộn chất lượng cao > 1,3 triệu tấn (+26%)
  · HRC xuất khẩu 24,6% sản lượng HRC quý 3 · quý 2/2026 Hòa Phát công bố 29/7 · HPG đóng cửa 12/10: 20,7 (+2,99%) (CloudStock/DNSE)
  · HRC chiếm hơn một nửa và đóng góp hơn một nửa mức tăng: TỰ TÍNH từ các số công bố.
Lưu ý: hook trong bản quay nói "tăng 25%" (kịch bản và số công bố là 54%) → th_cut.py vá bằng "54%" lấy từ câu "tăng 54% so với cùng kỳ năm ngoái" (xem plan.json).
Chạy: python3 build.py     VÙNG AN TOÀN TIKTOK (1080x1920): trên ≥170px, dưới ≤1430px, trái ≥60px, phải ≤940px.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from th_lib import (BRAND_CSS, BRAND_HTML, DARKBG, Builder, count, fromto, pop, rise, slam, slide)  # noqa: E402

ROOT = Path(__file__).resolve().parent
B = Builder(ROOT, origin="48% 40%",
            keys={"hpg", "hoa phat", "hrc", "trieu tan", "san luong", "quy 3", "9 thang", "bao cao", "gia ban", "chi phi", "thep",
                  "xuat khau", "nhieu"})
T, E, DUR = B.T, B.E, B.DUR
t_disc = B.t_disc

ARROW_UP = ('<svg viewBox="0 0 24 24" width="50" height="50"><path d="M12 20V5M5 12l7-7 7 7" fill="none" stroke="#22C55E" stroke-width="3.4" '
            'stroke-linecap="round" stroke-linejoin="round"/></svg>')
ARROW_DN = ('<svg viewBox="0 0 24 24" width="50" height="50"><path d="M12 4v15M5 12l7 7 7-7" fill="none" stroke="#FF6B6B" stroke-width="3.4" '
            'stroke-linecap="round" stroke-linejoin="round"/></svg>')
CHECK = ('<svg viewBox="0 0 24 24" width="40" height="40"><path d="M5 12.5l4.6 4.6L19 7" fill="none" stroke="#111" stroke-width="3.8" '
         'stroke-linecap="round" stroke-linejoin="round"/></svg>')
SHADOW = "text-shadow:0 5px 0 rgba(0,0,0,.55),0 12px 34px rgba(0,0,0,.65)"

# ── 1) HOOK ──
t_ha, t_hb, t_hc, t_hd = T("bán") - 0.1, T("54%") - 0.12, T("hơn một nửa") - 0.1, T("cùng một loại thép") - 0.1
t_hook_end = min(E("loại thép", 0, 0.5), T("Mình sẽ đi qua") - 0.08)
B.card("c01-hook", 0.0, t_hook_end, """<div class="s">
<div id="tag">HÒA PHÁT · SẢN LƯỢNG QUÝ 3</div>
<div id="a">BÁN 3,8 TRIỆU TẤN THÉP</div>
<div id="b">+54%</div>
<div id="c">HƠN MỘT NỬA MỨC TĂNG</div>
<div id="d">TỪ MỘT LOẠI THÉP</div></div>""", f"""
SEL .s{{position:absolute;left:60px;width:880px;top:178px;text-align:center;line-height:1}}
SEL .s div{{font-family:'Be Vietnam Pro';font-weight:800;opacity:0;{SHADOW}}}
SEL #tag{{display:inline-block;font-size:26px;letter-spacing:5px;color:@DARK@;background:@GOLD@;padding:8px 22px;border-radius:12px;text-shadow:none;margin-bottom:14px}}
SEL #a{{font-size:44px;color:#fff;letter-spacing:1px}}
SEL #b{{display:inline-block;font-size:150px;color:@GREEN@;margin:8px 0 8px;padding:0 34px 8px;background:rgba(10,10,10,.82);border-radius:24px;text-shadow:none}}
SEL #c{{font-size:44px;color:#fff;letter-spacing:1px;margin-bottom:8px}}
SEL #d{{font-size:84px;line-height:1.1;color:@GOLD@;white-space:nowrap}}""",
       [fromto("#c01-hook #tag", {"opacity": 0, "y": -20}, {"opacity": 1, "y": 0, "duration": .35, "ease": "power2.out"}, 0.08),
        fromto("#c01-hook #a", {"opacity": 0, "y": 20}, {"opacity": 1, "y": 0, "duration": .4, "ease": "power3.out"}, t_ha),
        slam("#c01-hook #b", t_hb, .36, 1.7),
        fromto("#c01-hook #c", {"opacity": 0, "y": 20}, {"opacity": 1, "y": 0, "duration": .4, "ease": "power3.out"}, t_hc),
        slam("#c01-hook #d", t_hd, .38, 1.5)])

# ── 2) Lộ trình: 3 điều ──
t2_s, t2_e = T("Mình sẽ đi qua") - 0.05, min(E("cần để ý", 0, 0.55), T("Điều thứ nhất") - 0.1)
B.card("c02-lotrinh", t2_s, t2_e, """<div class="w"><div class="k" id="c02-k">3 ĐIỀU MÌNH SẼ NÓI</div>
<div class="it" id="c02-i1"><b>1</b><span>Con số Hòa Phát công bố</span></div>
<div class="it" id="c02-i2"><b>2</b><span>Loại thép nào đang kéo</span></div>
<div class="it hot" id="c02-i3"><b>3</b><span>Bán nhiều, lãi chưa chắc nhiều</span><em id="c02-e">CẦN ĐỂ Ý</em></div></div>""", """
SEL .w{position:absolute;left:60px;width:880px;top:186px;display:flex;flex-direction:column;gap:10px}
SEL .k{align-self:flex-start;PILL;padding:8px 20px;font:800 26px 'Be Vietnam Pro';color:#a8a8a8;letter-spacing:5px}
SEL .it{position:relative;display:flex;align-items:center;gap:20px;PILL;padding:12px 24px}
SEL .it b{font:800 36px 'Be Vietnam Pro';color:@DARK@;background:@GOLD@;border-radius:12px;padding:2px 16px}
SEL .it span{font:800 38px 'Be Vietnam Pro';color:#fff}
SEL .hot{border-color:rgba(245,197,66,.8)}
SEL .it em{position:absolute;right:16px;top:-16px;font:800 24px 'Be Vietnam Pro';font-style:normal;letter-spacing:3px;color:@DARK@;background:@GOLD@;padding:4px 14px;border-radius:10px}""",
       [rise("#c02-k", t2_s + 0.02, 0.35, -20), slide("#c02-i1", T("con số Hòa Phát") - 0.1, 0.4, -60),
        slide("#c02-i2", T("loại thép nào") - 0.1, 0.4, -60), slide("#c02-i3", T("bán nhiều chưa chắc") - 0.1, 0.4, -60),
        pop("#c02-e", T("cần để ý") - 0.1, 0.35)])

# ── 3) Điều 1: con số ──
t_ch1 = T("Điều thứ nhất") - 0.05
B.chapter("c03-ch1", t_ch1, t_ch1 + 2.1, "01", "Con số", "Hòa Phát công bố sáng 12/10")

t4a_s, t4a_e = max(T("Sáng nay") - 0.1, t_ch1 + 2.15), min(E("năm ngoái", 0, 0.6), T("Bán hàng ở đây") - 0.15)
B.card("c04a-q3", t4a_s, t4a_e, """<div class="w"><div class="k" id="c04a-k">HÒA PHÁT · SẢN LƯỢNG BÁN HÀNG · CÔNG BỐ 12/10</div>
<div class="row" id="c04a-r"><div class="lb">QUÝ 3/2026</div><div class="v"><span id="c04a-n">0</span><small>triệu tấn</small></div><div class="ch" id="c04a-c">+54%<small>so cùng kỳ</small></div></div></div>""", """
SEL .w{position:absolute;left:60px;width:880px;top:186px;display:flex;flex-direction:column;gap:10px}
SEL .k{align-self:flex-start;PILL;padding:8px 20px;font:800 24px 'Be Vietnam Pro';color:#a8a8a8;letter-spacing:3px}
SEL .row{display:flex;align-items:center;gap:20px;PILL;padding:12px 26px}
SEL .lb{width:190px;font:800 28px 'Be Vietnam Pro';color:#bdbdbd;letter-spacing:3px}
SEL .v{flex:1;font:800 112px 'Be Vietnam Pro';color:#fff;line-height:1.1} SEL .v small{font:700 34px 'Be Vietnam Pro';color:#9a9a9a;margin-left:10px}
SEL .ch{font:800 56px 'Be Vietnam Pro';color:@GREEN@;text-align:right;line-height:1} SEL .ch small{display:block;font:700 24px 'Be Vietnam Pro';color:#9a9a9a;margin-top:6px}""",
       [rise("#c04a-k", t4a_s + 0.02, 0.35, -20), rise("#c04a-r", T("Quý 3 sản lượng") - 0.15, 0.45, 30), count("#c04a-n", T("3,8", 1) - 0.1, 3.8, 0.8, dec=1),
        pop("#c04a-c", T("54%", 1) - 0.1, 0.4)])

t4_s, t4_e = T("Bán hàng ở đây") - 0.1, E("gần 40%", 0, 0.6)
B.card("c04-so", t4_s, t4_e, BRAND_HTML % "c04-br" + """
<div class="k" id="c04-k">BÁN HÀNG QUÝ 3 GỒM</div>
<div class="tags" id="c04-tg"><span id="c04-t1">Thép xây dựng</span><span id="c04-t2">Thép cuộn chất lượng cao</span><span id="c04-t3">HRC <small>thép cuộn cán nóng</small></span><span id="c04-t4">Phôi thép</span></div>
<div class="row" id="c04-r2"><div class="lb">9 THÁNG</div><div class="v"><span id="c04-n2">0</span><small>triệu tấn</small></div><div class="ch" id="c04-c2">+39%<small>so cùng kỳ</small></div></div>
<div class="src" id="c04-src">Nguồn: Hòa Phát, công bố 12/10/2026</div>""", BRAND_CSS + """
SEL .k{position:absolute;left:60px;top:316px;font:800 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .row{position:absolute;left:60px;width:880px;display:flex;align-items:center;gap:20px;padding:14px 26px;border-radius:26px;background:#171719;border:2px solid #2d2d31}
SEL #c04-r2{top:700px}
SEL .lb{width:170px;font:800 28px 'Be Vietnam Pro';color:#bdbdbd;letter-spacing:3px}
SEL .v{flex:1;white-space:nowrap;font:800 112px 'Be Vietnam Pro';color:#fff;line-height:1.1} SEL .v small{font:700 32px 'Be Vietnam Pro';color:#9a9a9a;margin-left:10px}
SEL .ch{font:800 56px 'Be Vietnam Pro';color:@GREEN@;text-align:right;line-height:1} SEL .ch small{display:block;font:700 24px 'Be Vietnam Pro';color:#9a9a9a;margin-top:6px}
SEL .tags{position:absolute;left:60px;width:880px;top:370px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
SEL .tags span{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:130px;text-align:center;font:800 38px 'Be Vietnam Pro';color:#fff;padding:14px 10px;border-radius:20px;background:#1c1c1f;border:2px solid #3a3a40}
SEL .tags small{font:700 24px 'Be Vietnam Pro';color:#9a9a9a;margin-top:4px}
SEL #c04-t3{border-color:rgba(245,197,66,.8);color:@GOLD@}
SEL .src{position:absolute;left:60px;top:930px;font:700 26px 'Be Vietnam Pro';color:#8b8bff}""",
       [pop("#c04-br", t4_s + 0.05, 0.4), rise("#c04-k", t4_s + 0.1, 0.4, 10),
        rise("#c04-t1", T("thép xây dựng") - 0.1, 0.35, 20), rise("#c04-t2", T("thép cuộn chất lượng cao") - 0.1, 0.35, 20),
        rise("#c04-t3", T("HRC") - 0.15, 0.35, 20), rise("#c04-t4", T("phôi thép") - 0.1, 0.35, 20),
        rise("#c04-r2", T("Cộng cả 9 tháng") - 0.1, 0.45, 40), count("#c04-n2", T("Cộng cả 9 tháng") + 0.2, 10.3, 0.8, dec=1),
        pop("#c04-c2", T("gần 40%") - 0.1, 0.4), rise("#c04-src", T("Cộng cả 9 tháng") + 0.4, 0.4, 10)], full=True, bg=DARKBG, dy=-20)

# ── 4) Điều 2: loại thép nào kéo ──
t_ch2 = T("Điều thứ hai") - 0.05
B.chapter("c05-ch2", t_ch2, t_ch2 + 2.1, "02", "Thép nào kéo?", "HRC và thép xây dựng")

t6_s, t6_e = max(T("HRC đạt") - 0.15, t_ch2 + 2.15), min(E("gấp 2 lần", 0, 0.6), T("Theo phép tính") - 0.13)
B.card("c06-bars", t6_s, t6_e, """<div class="k" id="c06-k">SẢN LƯỢNG QUÝ 3 · SO VỚI CÙNG KỲ</div>
<div class="bar" id="c06-b1"><div class="top"><b>HRC</b><em class="g" id="c06-v1">+64%</em></div><div class="sub">thép cuộn cán nóng · trên 2 triệu tấn</div><div class="track"><div class="fill g" id="c06-f1"></div></div></div>
<div class="bar" id="c06-b2"><div class="top"><b>Thép xây dựng + cuộn CLC</b><em id="c06-v2">+26%</em></div><div class="sub">hơn 1,3 triệu tấn</div><div class="track"><div class="fill w" id="c06-f2"></div></div></div>
<div class="x" id="c06-x">HRC tăng nhanh hơn <b>~2,5 lần</b><small>tự tính: 64 ÷ 26</small></div>""", """
SEL .k{position:absolute;left:60px;top:205px;font:800 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:4px}
SEL .bar{position:absolute;left:60px;width:880px;padding:14px 26px 22px;border-radius:26px;background:#171719;border:2px solid #2d2d31}
SEL #c06-b1{top:270px} SEL #c06-b2{top:560px}
SEL .top{display:flex;justify-content:space-between;align-items:baseline;gap:16px} SEL .top b{font:800 42px 'Be Vietnam Pro';color:#fff;white-space:nowrap} SEL .top em{font:800 84px 'Be Vietnam Pro';font-style:normal;color:#fff;line-height:1.1} SEL .top em.g{color:@GREEN@}
SEL .sub{font:700 27px 'Be Vietnam Pro';color:#9a9a9a;margin:0 0 12px}
SEL .track{height:64px;border-radius:16px;background:#242428;overflow:hidden}
SEL .fill{height:100%;width:0;border-radius:16px} SEL .fill.g{background:linear-gradient(90deg,#16a34a,#22C55E)} SEL .fill.w{background:#9d9da8}
SEL .x{position:absolute;left:60px;width:880px;top:850px;text-align:center;font:800 46px 'Be Vietnam Pro';color:#fff} SEL .x b{color:@GOLD@;font-size:64px}
SEL .x small{display:block;font:700 26px 'Be Vietnam Pro';color:#8b8bff;margin-top:4px}""",
       [rise("#c06-k", t6_s + 0.05, 0.4, 10),
        rise("#c06-b1", T("HRC đạt") - 0.1, 0.45, 40), fromto("#c06-f1", {"width": 0}, {"width": "100%", "duration": .9, "ease": "power3.out"}, T("64%") - 0.2),
        rise("#c06-b2", T("thép xây dựng và") - 0.1, 0.45, 40), fromto("#c06-f2", {"width": 0}, {"width": "40.6%", "duration": .8, "ease": "power3.out"}, T("26%") - 0.2),
        rise("#c06-x", T("nhanh hơn gấp") - 0.15, 0.5, 30)], full=True, bg=DARKBG, dy=-20)

t7_s, t7_e = T("Theo phép tính") - 0.1, E("xuất khẩu", 0, 0.7)
B.card("c07-half", t7_s, t7_e, """<div class="k" id="c07-k">THEO PHÉP TÍNH CỦA MÌNH · <i>tự tính</i></div>
<div class="d d1" id="c07-d1"><div class="ring" id="c07-g1"><b>HƠN 1/2</b></div><span>SẢN LƯỢNG BÁN HÀNG<br><i>là HRC</i></span></div>
<div class="d d2" id="c07-d2"><div class="ring" id="c07-g2"><b>HƠN 1/2</b></div><span>MỨC TĂNG QUÝ 3<br><i>đến từ HRC</i></span></div>
<div class="ex" id="c07-ex"><b>~1/4</b><span>sản lượng HRC quý 3 được xuất khẩu<small>24,6% · theo Hòa Phát</small></span></div>
<div class="nt" id="c07-nt">Làm tròn từ số công bố: "trên 2 triệu tấn" HRC trên "3,8 triệu tấn" bán hàng</div>""", """
SEL .k{position:absolute;left:60px;top:205px;font:800 28px 'Be Vietnam Pro';color:#9a9a9a;letter-spacing:3px} SEL .k i{font:italic 700 34px 'Playfair Display';color:@GOLD@;letter-spacing:0}
SEL .d{position:absolute;top:290px;width:420px;text-align:center} SEL .d1{left:60px} SEL .d2{left:520px}
SEL .ring{position:relative;width:330px;height:330px;margin:0 auto 14px;border-radius:50%;--p:0%;
 background:radial-gradient(closest-side,#131315 70%,transparent 71% 100%),conic-gradient(@GOLD@ 0 var(--p),#2c2c31 0)}
SEL .ring b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:800 54px 'Be Vietnam Pro';color:#fff}
SEL .d span{font:800 30px/1.3 'Be Vietnam Pro';color:#bdbdbd;letter-spacing:2px} SEL .d span i{font:italic 700 44px 'Playfair Display';color:@GOLD@;letter-spacing:0}
SEL .ex{position:absolute;left:60px;width:880px;top:790px;display:flex;align-items:center;gap:22px;padding:18px 26px;border-radius:26px;background:#171719;border:2px solid #2d2d31}
SEL .ex b{font:800 84px 'Be Vietnam Pro';color:@GOLD@} SEL .ex span{font:700 34px/1.25 'Be Vietnam Pro';color:#fff} SEL .ex small{display:block;font:700 26px 'Be Vietnam Pro';color:#8b8bff;margin-top:4px}
SEL .nt{position:absolute;left:60px;width:880px;top:960px;font:700 24px/1.3 'Be Vietnam Pro';color:#8b8bff}""",
       [rise("#c07-k", t7_s + 0.05, 0.4, 10),
        rise("#c07-d1", T("hơn một nửa sản lượng") - 0.2, 0.45, 40), fromto("#c07-g1", {"--p": "0%"}, {"--p": "53%", "duration": .9, "ease": "power2.out"}, T("hơn một nửa sản lượng")),
        rise("#c07-d2", T("hơn một nửa mức tăng", 1) - 0.2, 0.45, 40), fromto("#c07-g2", {"--p": "0%"}, {"--p": "59%", "duration": .9, "ease": "power2.out"}, T("hơn một nửa mức tăng", 1)),
        rise("#c07-ex", T("khoảng 1/4") - 0.25, 0.5, 40), rise("#c07-nt", T("Theo phép tính") + 3.0, 0.4, 10)], full=True, bg=DARKBG, dy=-20)

# ── 5) Điều 3: bán nhiều chưa chắc lãi nhiều ──
t_ch3 = T("Điều thứ 3", 1) - 0.05
B.chapter("c08-ch3", t_ch3, t_ch3 + 2.1, "03", "Chỗ dễ đọc nhầm", "bán nhiều chưa chắc lãi nhiều")

t9_s, t9_e = max(T("Thấy bán hơn") - 0.1, t_ch3 + 2.15), T("Nhưng lãi") - 0.08
B.card("c09-nghi", t9_s, t9_e, """<div class="w"><div class="a" id="c09-a"><span>BÁN</span><b>+54%</b></div>
<div class="a q" id="c09-b"><span>LÃI</span><b>+54%?</b></div></div>""", """
SEL .w{position:absolute;left:60px;width:880px;top:186px;display:flex;flex-direction:column;gap:12px;align-items:flex-start}
SEL .a{display:flex;align-items:baseline;gap:22px;PILL;padding:10px 30px 14px}
SEL .a span{font:800 44px 'Be Vietnam Pro';color:#bdbdbd;letter-spacing:4px} SEL .a b{font:800 90px 'Be Vietnam Pro';color:@GREEN@}
SEL .q{border-color:rgba(245,197,66,.7)} SEL .q b{color:@GOLD@}""",
       [slide("#c09-a", t9_s + 0.05, 0.4, -60), slide("#c09-b", T("anh chị sẽ nghĩ") - 0.05, 0.4, -60)])

t9b_s, t9b_e = T("Nhưng lãi") - 0.05, min(E("số tấn", 0, 0.6), T("Giả sử") - 0.1)
B.card("c09b-ct", t9b_s, t9b_e, """<div class="k" id="c09b-k">LÃI LÀ GÌ?</div>
<div class="eq"><div class="l1" id="c09b-l">LÃI =</div>
<div class="l2" id="c09b-p"><i>(</i><u id="c09b-a">GIÁ BÁN</u> <em id="c09b-m">− CHI PHÍ</em><i>)</i></div>
<div class="l3" id="c09b-x">× SỐ TẤN</div></div>""", """
SEL .k{position:absolute;left:60px;top:215px;font:800 30px 'Be Vietnam Pro';color:@DARK@;background:@GOLD@;padding:8px 22px;border-radius:12px;letter-spacing:5px}
SEL .eq{position:absolute;left:60px;width:880px;top:340px;text-align:center;font-family:'Be Vietnam Pro';font-weight:800;line-height:1.25}
SEL .l1{font-size:128px;color:@GOLD@} SEL .l2{font-size:82px;color:#fff} SEL .l3{font-size:110px;color:#a78bfa;margin-top:6px}
SEL .eq u,SEL .eq em{display:inline-block;text-decoration:none;font-style:normal} SEL .eq i{font-style:normal;color:#8a8a8a}
SEL #c09b-a{color:@GREEN@} SEL #c09b-m{color:#FF6B6B}""",
       [rise("#c09b-k", t9b_s + 0.05, 0.4, 10), pop("#c09b-l", T("lãi là") - 0.05, 0.4),
        pop("#c09b-a", T("giá bán") - 0.05, 0.4), pop("#c09b-m", T("trừ chi phí") - 0.05, 0.4), pop("#c09b-x", T("nhân với số tấn") - 0.05, 0.4)],
       full=True, bg=DARKBG, dy=-20)

t10_s, t10_e = T("Giả sử") - 0.05, min(E("lên theo", 0, 0.6), T("Hòa Phát cũng vậy") - 0.1)
B.card("c10-cuahang", t10_s, t10_e, """<div class="w"><div class="k" id="c10-k">VÍ DỤ GIẢ ĐỊNH · CỬA HÀNG</div>
<div class="r up" id="c10-r1"><span>Bán gấp rưỡi số hàng</span><b>"""+ARROW_UP+"""</b></div>
<div class="r dn" id="c10-r2"><span>Mỗi món giảm giá · tiền nhập hàng tăng</span><b>"""+ARROW_DN+"""</b></div>
<div class="r gd" id="c10-r3"><span>Doanh số đẹp, <i>tiền lãi: ?</i></span></div></div>""", """
SEL .w{position:absolute;left:60px;width:880px;top:186px;display:flex;flex-direction:column;gap:10px}
SEL .k{align-self:flex-start;PILL;padding:8px 20px;font:800 26px 'Be Vietnam Pro';color:#a8a8a8;letter-spacing:4px}
SEL .r{display:flex;justify-content:space-between;align-items:center;padding:14px 26px;border-radius:22px;box-shadow:0 14px 34px rgba(0,0,0,.4)}
SEL .r span{font:800 40px/1.2 'Be Vietnam Pro';color:#fff} SEL .r b{font:800 56px 'Be Vietnam Pro'}
SEL .up{background:color-mix(in srgb,#22C55E 16%,#151517);border:2px solid rgba(34,197,94,.6)} SEL .up b{color:@GREEN@}
SEL .dn{background:color-mix(in srgb,#EF4444 22%,#151517);border:2px solid rgba(239,68,68,.7)} SEL .dn b{color:#FF6B6B}
SEL .gd{background:color-mix(in srgb,#F5C542 14%,#151517);border:2px solid rgba(245,197,66,.7)} SEL .gd i{font:italic 700 56px 'Playfair Display';color:@GOLD@}""",
       [rise("#c10-k", t10_s + 0.02, 0.35, -20), slide("#c10-r1", T("bán gấp rưỡi") - 0.1, 0.4, -60),
        slide("#c10-r2", T("mỗi món hàng") - 0.1, 0.4, -60), slide("#c10-r3", T("doanh số") - 0.1, 0.4, -60)])

t11_s, t11_e = T("Hòa Phát cũng vậy") - 0.05, min(E("29/7", 0, 0.6), T("Cũng trong hôm nay") - 0.14)
B.card("c11-status", t11_s, t11_e, """<div class="eq" id="c11-eq">LÃI = (GIÁ BÁN − CHI PHÍ) × SỐ TẤN</div>
<div class="bx ok" id="c11-b1"><small>SỐ TẤN</small><b>ĐÃ CÔNG BỐ</b><u>""" + CHECK + """</u></div>
<div class="bx no" id="c11-b2"><small>GIÁ BÁN</small><b>CHƯA</b></div>
<div class="bx no" id="c11-b3"><small>CHI PHÍ</small><b>CHƯA</b></div>
<div class="ch" id="c11-c1"><span>Báo cáo quý 3</span><b>CHƯA CÓ</b></div>
<div class="ch ok2" id="c11-c2"><span>Quý 2</span><b>công bố 29/7</b></div>""", """
SEL .eq{position:absolute;left:60px;width:880px;top:215px;text-align:center;font:800 44px 'Be Vietnam Pro';color:#bdbdbd}
SEL .bx{position:absolute;left:60px;width:880px;display:flex;align-items:center;justify-content:space-between;padding:22px 30px;border-radius:26px}
SEL .bx small{font:800 36px 'Be Vietnam Pro';letter-spacing:4px;color:#d0d0d0} SEL .bx b{font:800 58px 'Be Vietnam Pro'}
SEL #c11-b1{top:320px} SEL #c11-b2{top:480px} SEL #c11-b3{top:640px}
SEL .ok{background:color-mix(in srgb,#22C55E 16%,#131315);border:3px solid @GREEN@} SEL .ok b{color:@GREEN@}
SEL .bx u{display:flex;align-items:center;justify-content:center;width:62px;height:62px;border-radius:50%;background:@GREEN@;margin-left:16px}
SEL .no{background:#1a1a1c;border:3px dashed #7a7a82} SEL .no b{color:#9d9da8}
SEL .ch{position:absolute;top:840px;display:flex;flex-direction:column;gap:2px;padding:14px 22px;border-radius:20px;background:#171719;border:2px solid #34343a}
SEL #c11-c1{left:60px;width:430px} SEL #c11-c2{left:510px;width:430px}
SEL .ch span{font:700 28px 'Be Vietnam Pro';color:#9a9a9a} SEL .ch b{font:800 40px 'Be Vietnam Pro';color:#fff} SEL .ok2 b{color:@GOLD@}""",
       [rise("#c11-eq", t11_s + 0.05, 0.4, 10), slide("#c11-b1", T("bản công bố hôm nay") - 0.1, 0.45, -80),
        slide("#c11-b2", T("giá bán hay chi phí") - 0.1, 0.45, -80), slide("#c11-b3", T("chi phí", 1) - 0.2, 0.45, -80),
        rise("#c11-c1", T("Báo cáo quý 3") - 0.1, 0.4, 30), rise("#c11-c2", T("còn quý 2") - 0.1, 0.4, 30)], full=True, bg=DARKBG, dy=-20)

# ── 6) HPG +2,99% (ảnh chụp CloudStock) ──
t12_s, t12_e = T("Cũng trong hôm nay") - 0.1, E("liên quan", 0, 0.7)
B.card("c12-hpg", t12_s, t12_e, BRAND_HTML % "c12-br" + """
<div class="px" id="c12-p"><img src="img/price_HPG.png"/></div>
<div class="frame ch" id="c12-f"><img src="img/chart_HPG.png"/></div>
<div class="src" id="c12-src">HPG · biểu đồ ngày · khung 3 tháng · phiên 12/10/2026</div>
<div class="st" id="c12-st">Mình <b>không nói</b> hai việc <i>có liên quan</i></div>""", BRAND_CSS + """
SEL .px{position:absolute;left:60px;width:880px;top:314px;padding:10px 26px 0;border-radius:24px;background:#131318;border:2px solid #2a2a2e;overflow:hidden}
SEL .px img{display:block;width:100%}
SEL .frame{position:absolute;left:60px;width:880px;top:640px;height:380px;border-radius:28px;overflow:hidden;border:3px solid #2a2a2e;box-shadow:0 30px 80px rgba(0,0,0,.6);background:#131318}
SEL .frame img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 52%}
SEL .src{position:absolute;left:60px;top:1030px;font:700 24px 'Be Vietnam Pro';color:#8b8bff;letter-spacing:1px}
SEL .st{position:absolute;left:60px;width:880px;top:1074px;text-align:center;font:800 44px 'Be Vietnam Pro';color:#fff} SEL .st b{color:@GOLD@} SEL .st i{font:italic 700 52px 'Playfair Display';color:#FF7A7A}""",
       [pop("#c12-br", t12_s + 0.05, 0.4), rise("#c12-p", t12_s + 0.15, 0.45, 40), rise("#c12-f", T("HPG") + 0.0, 0.5, 60),
        rise("#c12-src", T("HPG") + 0.4, 0.4, 10), rise("#c12-st", T("không nói hai việc") - 0.1, 0.45, 20)], full=True, bg=DARKBG, dy=-20)

# ── 7) Đóng vòng lặp + CTA + disclaimer ──
t13_s = T("Quay lại câu đầu") - 0.05
B.card("c13-end", t13_s, DUR, """<div class="w"><div class="a" id="c13-a">Bán nhiều hơn <b>54%</b></div>
<div class="a g" id="c13-b">hơn một nửa mức tăng: <i>một loại thép</i></div>
<div class="a" id="c13-c">Lãi bao nhiêu? <b>chờ báo cáo quý 3</b></div>
<div class="bub" id="c13-u">Lưu video để đối chiếu</div></div>
<div class="lock" id="c13-l"><img src="img/icon.png"/><div><span>Biểu đồ &amp; dữ liệu tại</span><b>cloudstock.id.vn</b></div></div>
<div class="disc" id="c13-d">Nội dung tổng hợp thông tin, không phải khuyến nghị đầu tư. Ý kiến cá nhân, không đại diện công ty.<br>Sản lượng: Hòa Phát công bố 12/10/2026; giá: đến hết phiên 12/10/2026. Đầu tư luôn có rủi ro mất vốn.</div>""", """
SEL .w{position:absolute;left:60px;width:880px;top:186px;display:flex;flex-direction:column;align-items:flex-start;gap:10px}
SEL .a{PILL;padding:10px 26px 12px;font:800 44px 'Be Vietnam Pro';color:#fff} SEL .a b{color:@GREEN@}
SEL .g{border-color:rgba(245,197,66,.7);font-size:40px} SEL .g i{font:italic 700 50px 'Playfair Display';color:@GOLD@}
SEL .a:nth-child(3) b{color:@GOLD@}
SEL .bub{font:800 36px 'Be Vietnam Pro';color:@DARK@;background:@WHITE@;padding:12px 28px;border-radius:40px 40px 40px 8px;box-shadow:0 14px 34px rgba(0,0,0,.4)}
SEL .lock{position:absolute;left:60px;width:880px;top:1090px;display:flex;align-items:center;gap:22px;padding:12px 22px;border-radius:26px;background:rgba(17,17,17,.88);border:2px solid rgba(167,139,250,.55)}
SEL .lock img{width:100px;height:100px;border-radius:22px}
SEL .lock span{display:block;font:700 28px 'Be Vietnam Pro';color:#cfcfcf} SEL .lock b{display:block;font:800 50px 'Be Vietnam Pro';color:#C4B5FD}
SEL .disc{position:absolute;left:60px;width:880px;top:1250px;padding:12px 16px;border-radius:16px;background:rgba(17,17,17,.78);text-align:center;font:400 26px 'Be Vietnam Pro';color:rgba(255,255,255,.95);line-height:1.4}""",
       [slide("#c13-a", t13_s + 0.1, 0.4, -60), slide("#c13-b", T("mà hơn một nửa") - 0.1, 0.4, -60), slide("#c13-c", T("Còn lãi bao nhiêu") - 0.1, 0.4, -60),
        pop("#c13-u", T("Lưu video") - 0.05, 0.4),
        rise("#c13-l", t_disc - 0.2, 0.5, 40), fromto("#c13-d", {"opacity": 0}, {"opacity": 1, "duration": .4}, t_disc + 0.05)])

# ───────────────────────── ZOOM & SFX ─────────────────────────
for t, v in [(T("54%"), 0.06), (T("Mình sẽ đi qua"), 0.05), (T("Sáng nay"), 0.05), (T("HRC đạt"), 0.05), (T("Giả sử"), 0.05), (T("Quay lại câu đầu"), 0.05)]:
    B.push(t, v)

B.auto_sfx()
for t in [t_hb, t_hd]:
    B.sfx(t, "thump", 0.5)
for t in [t_ha, t_hc, T("con số Hòa Phát") - 0.1, T("loại thép nào") - 0.1, T("bán nhiều chưa chắc") - 0.1,
          T("thép xây dựng") - 0.1, T("thép cuộn chất lượng cao") - 0.1, T("HRC") - 0.15, T("phôi thép") - 0.1,
          T("giá bán") - 0.05, T("trừ chi phí") - 0.05, T("nhân với số tấn") - 0.05]:
    B.sfx(t, "click", 0.28)
for t in [T("3,8", 1) - 0.1, T("Cộng cả 9 tháng") + 0.2, T("54%", 1) - 0.1, T("gần 40%") - 0.1, T("64%") - 0.2, T("26%") - 0.2, T("cần để ý") - 0.1,
          T("bản công bố hôm nay") - 0.1]:
    B.sfx(t, "ding", 0.2)
for t in [T("giá bán hay chi phí") - 0.1, T("Báo cáo quý 3") - 0.1]:
    B.sfx(t, "pop", 0.2)

B.write()
