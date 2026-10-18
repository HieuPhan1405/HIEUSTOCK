#!/usr/bin/env python3
"""Video ghim giới thiệu Hiếu (18/10/2026) — "Mình là Hiếu: người đứng sau kênh và CloudStock" (talking head 9:16, ~59 giây).

Sinh public/index.html + public/cards/*.html. Phong cách: .claude/skills/hieu-talking-head-style (khuôn video HPG 12/10).
Kịch bản: videos/scripts/2026-10-18-video-ghim-1-hieu-la-ai-v3.md. Hiếu quay bản tự đọc (khác kịch bản: nói thêm tên công ty MBS, bỏ câu
"tốt nghiệp Tài chính – Ngân hàng", đổi CTA thành "Follow kênh TikTok để xem clip và buổi livestream mới nhất", không đọc miễn trừ).
Thẻ chỉ hiện những gì anh đã nói; KHÔNG hiện tên công ty, KHÔNG hiện tín hiệu MUA/BÁN. Miễn trừ thể hiện bằng chữ ở thẻ kết (3,2 s cuối).
Số liệu trên hình: VN-Index 16/10 +0,45% (Thời báo Tài chính VN; Nhân Dân; Vietstock; Cộng Luận) · độ rộng 26% mã xu hướng tăng (101/390),
nguồn CloudStock cập nhật 15:30 16/10/2026 (ảnh chụp public/img/ketluan.png).
Chạy: python3 build.py     VÙNG AN TOÀN TIKTOK (1080x1920): trên ≥170px, dưới ≤1430px, trái ≥60px, phải ≤940px.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from th_lib import (BRAND_CSS, BRAND_HTML, DARKBG, Builder, count, fromto, pop, rise, slam, slide)  # noqa: E402

ROOT = Path(__file__).resolve().parent
B = Builder(ROOT, origin="50% 40%", keys={"cloudstock", "tiktok", "follow", "hieu", "binhthuong", "vnindex", "binh"},
            good=("xanh", "tang"), bad=("do", "chua", "trach"))
T, E, DUR = B.T, B.E, B.DUR
TK = B.TOK
tk = lambda i: TK[i]["s"]   # noqa: E731  (mốc theo chỉ số từ trong tokens.json)
B.t_disc = 55.65            # thẻ kết + miễn trừ từ đây (sau chữ "nhé")
t_disc = B.t_disc
SHADOW = "text-shadow:0 5px 0 rgba(0,0,0,.55),0 12px 34px rgba(0,0,0,.65)"

# ── 1) HOOK: "KHÔNG BIẾT NHÌN VÀO ĐÂU TRƯỚC?" ──
t1_e = tk(26) - 0.1
B.card("c01-hook", 0.0, t1_e, """<div class="s">
<div id="tag">BẢNG GIÁ · CẢ TRĂM MÃ NHẢY MÀU</div>
<div id="a">KHÔNG BIẾT</div>
<div id="b">NHÌN VÀO ĐÂU</div>
<div id="c">TRƯỚC?</div></div>""", f"""
SEL .s{{position:absolute;left:60px;width:880px;top:178px;text-align:center;line-height:1}}
SEL .s div{{font-family:'Be Vietnam Pro';font-weight:800;opacity:0;{SHADOW}}}
SEL #tag{{display:inline-block;font-size:26px;letter-spacing:4px;color:@DARK@;background:@GOLD@;padding:8px 22px;border-radius:12px;text-shadow:none;margin-bottom:16px}}
SEL #a{{font-size:104px;color:#fff;letter-spacing:1px}}
SEL #b{{font-size:104px;color:@GOLD@;margin-top:6px}}
SEL #c{{font-size:150px;color:@GOLD@;margin-top:4px}}""",
       [fromto("#c01-hook #tag", {"opacity": 0, "y": -20}, {"opacity": 1, "y": 0, "duration": .35, "ease": "power2.out"}, 0.12),
        slam("#c01-hook #a", T("không biết") - 0.08, .36, 1.6),
        slam("#c01-hook #b", T("nhìn vào đâu") - 0.08, .36, 1.6),
        slam("#c01-hook #c", T("trước?") - 0.08, .4, 1.7)])

# ── 2) MÌNH LÀ AI ──
t2_s, t2_e = tk(26) - 0.1, tk(64) - 0.1
B.card("c02-ai", t2_s, t2_e, """<div class="nm" id="c02-n">HIẾU</div>
<div class="ch" id="c02-1">TƯ VẤN ĐẦU TƯ</div>
<div class="ch" id="c02-2">ĐỌC SỐ LIỆU</div>
<div class="ch sm" id="c02-3">TRÒ CHUYỆN VỚI NHÀ ĐẦU TƯ CÁ NHÂN</div>""", """
SEL .nm{position:absolute;left:60px;top:190px;font:800 130px 'Be Vietnam Pro';line-height:1;color:@DARK@;background:@GOLD@;padding:6px 44px 16px;border-radius:26px;box-shadow:0 14px 34px rgba(0,0,0,.4)}
SEL .ch{position:absolute;left:60px;PILL;padding:12px 30px 14px;font:800 54px 'Be Vietnam Pro';color:#fff}
SEL #c02-1{top:380px;border-color:rgba(245,197,66,.8);color:@GOLD@} SEL #c02-2{top:490px}
SEL #c02-3{top:600px;font-size:35px}""",
       [slam("#c02-n", tk(28) - 0.2, .38, 1.5), slide("#c02-1", T("tư vấn đầu tư") - 0.08, .4, -70),
        slide("#c02-2", T("đọc số liệu") - 0.08, .4, -70), slide("#c02-3", T("trò chuyện với những") - 0.08, .4, -70)])

# ── 3) KHÔNG THIẾU THÔNG TIN · THIẾU CÁCH NHÌN GỌN ──
t3_s, t3_e = tk(64) - 0.1, tk(104) - 0.5
B.card("c03-nhin", t3_s, t3_e, """<div class="p" id="c03-1">KHÔNG THIẾU THÔNG TIN</div>
<div class="p g" id="c03-2">THIẾU MỘT CÁCH NHÌN GỌN</div>
<div class="bx up" id="c03-u"><small>CHỈ SỐ</small><b>XANH</b></div>
<div class="bx dn" id="c03-d"><small>DANH MỤC</small><b>VẪN ĐỎ</b></div>
<div class="st" id="c03-s">TỰ TRÁCH MÌNH?</div>
<div class="st ok" id="c03-o">RẤT BÌNH THƯỜNG</div>""", """
SEL .p{position:absolute;left:60px;PILL;padding:12px 30px 14px;font:800 54px 'Be Vietnam Pro';color:#fff}
SEL #c03-1{top:190px} SEL #c03-2{top:305px;border-color:rgba(245,197,66,.8);color:@GOLD@}
SEL .bx{position:absolute;top:450px;width:430px;padding:14px 26px 16px;border-radius:24px;display:flex;flex-direction:column;gap:2px}
SEL .bx small{font:800 28px 'Be Vietnam Pro';letter-spacing:4px;color:#d0d0d0} SEL .bx b{font:800 66px 'Be Vietnam Pro';line-height:1.05}
SEL #c03-u{left:60px;background:color-mix(in srgb,#22C55E 16%,#131315);border:3px solid @GREEN@} SEL #c03-u b{color:@GREEN@}
SEL #c03-d{left:510px;background:color-mix(in srgb,#EF4444 16%,#131315);border:3px solid @RED@} SEL #c03-d b{color:#FF5A5A}
SEL .st{position:absolute;left:60px;top:600px;PILL;padding:10px 30px 12px;font:800 54px 'Be Vietnam Pro';color:#FF7A7A;border-color:rgba(239,68,68,.7)}
SEL .st.ok{color:@DARK@;background:@GOLD@;border-color:@GOLD@}""",
       [rise("#c03-1", T("không thiếu thông tin") - 0.1, .4, 30), rise("#c03-2", T("một cách nhìn gọn") - 0.1, .4, 30),
        slide("#c03-u", T("Chỉ số xanh") - 0.08, .4, -70), slide("#c03-d", T("danh mục vẫn đỏ") - 0.1, .4, 70),
        pop("#c03-s", T("tự trách mình") - 0.05, .35), fade_o := f"tl.to('#c03-s',{{opacity:0,duration:.15}},{T('rất là bình thường') - 0.12:.3f});",
        pop("#c03-o", T("rất là bình thường") - 0.05, .38)])

# ── 4) TỰ XÂY CLOUDSTOCK + KÊNH TIKTOK ──
t4_s, t4_e = tk(104) - 0.1, tk(145) - 0.55
B.card("c04-web", t4_s, t4_e, BRAND_HTML % "c04-br" + """
<div class="frame" id="c04-f"><img src="img/hero_title.png"/></div>
<div class="tag" id="c04-t">TRONG VÀI GIÂY</div>
<div class="tk" id="c04-k"><b>KÊNH TIKTOK</b><span>@phanhieustock</span></div>
<div class="pl" id="c04-1">SỐ LIỆU DỄ HIỂU</div>
<div class="pl g" id="c04-2">KÈM NGUỒN · TỰ KIỂM LẠI</div>""", BRAND_CSS + """
SEL .brand{top:190px;background:rgba(17,17,17,.92)}
SEL .frame{position:absolute;left:60px;top:325px;width:880px;border-radius:28px;overflow:hidden;border:3px solid #2a2a2e;box-shadow:0 30px 80px rgba(0,0,0,.6);background:#131318}
SEL .frame img{display:block;width:100%}
SEL .tag{position:absolute;left:60px;top:585px;font:800 38px 'Be Vietnam Pro';color:@DARK@;background:@GOLD@;padding:8px 24px 10px;border-radius:16px;box-shadow:0 12px 30px rgba(0,0,0,.45)}
SEL .tk{position:absolute;left:60px;top:325px;PILL;padding:14px 30px 16px;display:flex;flex-direction:column;gap:2px}
SEL .tk b{font:800 30px 'Be Vietnam Pro';letter-spacing:5px;color:#a8a8a8} SEL .tk span{font:800 76px 'Be Vietnam Pro';color:#fff}
SEL .pl{position:absolute;left:60px;top:492px;PILL;padding:12px 30px 14px;font:800 54px 'Be Vietnam Pro';color:#fff}
SEL .pl.g{top:600px;border-color:rgba(245,197,66,.8);color:@GOLD@}""",
       [pop("#c04-br", T("CloudStock,") - 0.05, .4), rise("#c04-f", T("một trang web") - 0.1, .5, 50),
        pop("#c04-t", T("trong vài giây") + 0.1, .35),
        f"tl.to('#c04-f',{{opacity:0,duration:.2}},{T('xây một kênh') - 0.12:.3f});", f"tl.to('#c04-t',{{opacity:0,duration:.2}},{T('xây một kênh') - 0.12:.3f});",
        rise("#c04-k", T("xây một kênh") - 0.05, .45, 40),
        slide("#c04-1", T("số liệu một cách") - 0.08, .4, -70), slide("#c04-2", T("kèm nguồn") - 0.08, .4, -70)])

# ── 5) VÍ DỤ: VN-INDEX +0,45% · 26% MÃ XU HƯỚNG TĂNG ──
t5_s, t5_e = tk(145) - 0.05, T("thì chưa chắc") - 0.05
B.card("c05-vd", t5_s, t5_e, """<div class="stat" id="c05-s"><small>VN-INDEX · PHIÊN 16/10</small><b id="c05-v">+0,45%</b></div>
<div class="bw" id="c05-b"><img src="img/logo.png"/><div><b>CloudStock</b><span>cloudstock.id.vn</span></div></div>
<div class="frame" id="c05-f"><img src="img/ketluan.png"/></div>
<div class="src" id="c05-src">DỮ LIỆU CLOUDSTOCK · 15:30 16/10/2026</div>""", """
SEL .stat{position:absolute;left:60px;top:190px;width:880px;PILL;padding:14px 34px 16px;display:flex;align-items:baseline;justify-content:space-between}
SEL .stat small{font:800 30px 'Be Vietnam Pro';letter-spacing:2px;color:#cfcfcf;white-space:nowrap} SEL .stat b{font:800 100px 'Be Vietnam Pro';color:@GREEN@;line-height:1.05}
SEL .bw{position:absolute;left:60px;top:190px;display:flex;align-items:center;gap:16px;padding:8px 24px 8px 14px;border-radius:20px;background:rgba(17,17,17,.92);border:2px solid rgba(167,139,250,.6)}
SEL .bw img{height:70px;width:auto} SEL .bw b{display:block;font:800 40px 'Be Vietnam Pro';color:#fff;line-height:1.05} SEL .bw span{display:block;font:700 24px 'Be Vietnam Pro';color:#C4B5FD}
SEL .frame{position:absolute;left:190px;top:292px;width:700px;border-radius:24px;overflow:hidden;border:3px solid #2a2a2e;box-shadow:0 30px 80px rgba(0,0,0,.6)}
SEL .frame img{display:block;width:100%}
SEL .src{position:absolute;left:190px;top:632px;font:700 24px 'Be Vietnam Pro';color:#C4B5FD;letter-spacing:1px;background:rgba(17,17,17,.92);padding:6px 16px 8px;border-radius:12px;white-space:nowrap}""",
       [rise("#c05-s", T("VN-Index") - 0.1, .45, 30), slam("#c05-v", T("tăng 0,45%") - 0.02, .38, 1.5, -10),
        f"tl.to('#c05-s',{{opacity:0,duration:.2}},{T('chỉ khoảng một phần tư') - 0.12:.3f});",
        pop("#c05-b", T("chỉ khoảng một phần tư") - 0.05, .4), rise("#c05-f", T("chỉ khoảng một phần tư") + 0.0, .5, 50),
        rise("#c05-src", T("mã trong hệ thống") - 0.05, .4, 10)])

t6_s, t6_e = T("thì chưa chắc") - 0.05, tk(184) - 0.1
B.card("c06-khong", t6_s, t6_e, """<div class="bg" id="c06-a">CHƯA CHẮC LÀ</div><div class="bg g" id="c06-b">LỖI CỦA BẠN</div>""", f"""
SEL .bg{{position:absolute;left:60px;width:880px;text-align:center;font:800 100px 'Be Vietnam Pro';color:#fff;line-height:1;opacity:0;{SHADOW}}}
SEL #c06-a{{top:200px;font-size:84px}} SEL #c06-b{{top:310px;color:@GOLD@}}""",
       [slam("#c06-a", T("chưa chắc") - 0.05, .36, 1.5), slam("#c06-b", T("phải lỗi của bạn") - 0.15, .38, 1.5)])

# ── 6) TÔN TRỌNG + FOLLOW ──
t7_s, t7_e = tk(184) - 0.1, t_disc
B.card("c07-cta", t7_s, t7_e, """<div class="p" id="c07-1">QUYẾT ĐỊNH LÀ CỦA BẠN</div>
<div class="p g" id="c07-2">NHÌN THỊ TRƯỜNG BÌNH TĨNH HƠN</div>
<div class="btn" id="c07-f">FOLLOW</div><div class="hd" id="c07-h">@phanhieustock</div>
<div class="c1" id="c07-c1">CLIP MỚI</div><div class="c1 c2" id="c07-c2">LIVESTREAM</div>""", """
SEL .p{position:absolute;left:60px;PILL;padding:12px 30px 14px;font:800 52px 'Be Vietnam Pro';color:#fff}
SEL #c07-1{top:190px} SEL #c07-2{top:300px;border-color:rgba(245,197,66,.8);color:@GOLD@;font-size:44px}
SEL .btn{position:absolute;left:60px;top:430px;font:800 58px 'Be Vietnam Pro';color:@DARK@;background:@GOLD@;padding:12px 36px 16px;border-radius:30px;box-shadow:0 14px 34px rgba(0,0,0,.45)}
SEL .hd{position:absolute;left:410px;top:438px;PILL;padding:12px 24px 14px;font:800 48px 'Be Vietnam Pro';color:#fff}
SEL .c1{position:absolute;left:60px;top:575px;width:430px;text-align:center;PILL;padding:10px 20px 12px;font:800 46px 'Be Vietnam Pro';color:#fff}
SEL .c2{left:510px;border-color:rgba(239,68,68,.75)}""",
       [rise("#c07-1", T("vì đó là quyết định") - 0.1, .4, 30), rise("#c07-2", T("một cách bình tĩnh hơn") - 0.45, .4, 30),
        slam("#c07-f", T("Follow") - 0.08, .38, 1.4), rise("#c07-h", T("kênh TikTok", 1) - 0.1, .4, 30),
        pop("#c07-c1", T("clip") - 0.08, .35), pop("#c07-c2", T("livestream") - 0.1, .35)])

# ── 7) Thẻ kết: thanh tìm kiếm TikTok + miễn trừ ──
B.card("c08-end", t_disc, DUR, """<div class="w">
<div class="sb" id="c08-sb"><svg viewBox="0 0 24 24" width="54" height="54"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#888" stroke-width="2.6"/><path d="M15.5 15.5L21 21" stroke="#888" stroke-width="2.6" stroke-linecap="round"/></svg>
<span id="c08-t">phanhieustock</span><div class="go">Tìm kiếm</div></div>
<div class="hd" id="c08-h">@phanhieustock</div><div class="sub" id="c08-s">Phan Hiếu Stock</div></div>
<div class="disc" id="c08-d">Nội dung tổng hợp thông tin, không phải khuyến nghị đầu tư. Ý kiến cá nhân, không đại diện công ty.<br>VN-Index: đến hết phiên 16/10/2026 (nguồn báo chí). Độ rộng thị trường: CloudStock, 15:30 16/10/2026. Đầu tư luôn có rủi ro mất vốn.</div>""", """
SEL .w{position:absolute;left:60px;width:880px;top:560px;display:flex;flex-direction:column;align-items:center;gap:26px}
SEL .sb{display:flex;align-items:center;gap:18px;width:880px;background:#fff;border-radius:60px;padding:22px 26px 22px 34px;box-shadow:0 18px 50px rgba(0,0,0,.5)}
SEL .sb span{flex:1;font:600 56px 'Be Vietnam Pro';color:#111;white-space:nowrap}
SEL .go{font:800 38px 'Be Vietnam Pro';color:#fff;background:#FE2C55;padding:14px 30px;border-radius:40px}
SEL .hd{font:800 78px 'Be Vietnam Pro';color:@GOLD@} SEL .sub{font:700 38px 'Be Vietnam Pro';color:#bbb;letter-spacing:3px}
SEL .disc{position:absolute;left:60px;width:880px;top:1180px;padding:14px 18px;border-radius:16px;background:rgba(255,255,255,.07);text-align:center;font:400 26px 'Be Vietnam Pro';color:rgba(255,255,255,.95);line-height:1.45}""",
       [rise("#c08-sb", t_disc + 0.08, .45, 40),
        fromto("#c08-t", {"clipPath": "inset(0 100% 0 0)"}, {"clipPath": "inset(0 0% 0 0)", "duration": .9, "ease": "steps(13)"}, t_disc + 0.45),
        pop("#c08-h", t_disc + 1.45, .4), rise("#c08-s", t_disc + 1.6, .4, 20),
        fromto("#c08-d", {"opacity": 0}, {"opacity": 1, "duration": .4}, t_disc + 0.1)], full=True, bg=DARKBG)

# ───────────────────────── ZOOM & SFX ─────────────────────────
for t in [T("không biết"), tk(64), tk(104), tk(145), tk(184), T("Follow")]:
    B.push(t, 0.05)

B.auto_sfx()
for t in [T("không biết") - 0.08, T("nhìn vào đâu") - 0.08, T("trước?") - 0.08, tk(28) - 0.2, T("chưa chắc") - 0.05, T("Follow") - 0.08]:
    B.sfx(t, "thump", 0.5)
for t in [T("tư vấn đầu tư") - 0.08, T("đọc số liệu") - 0.08, T("trò chuyện với những") - 0.08, T("không thiếu thông tin") - 0.1,
          T("một cách nhìn gọn") - 0.1, T("Chỉ số xanh") - 0.08, T("danh mục vẫn đỏ") - 0.1, T("số liệu một cách") - 0.08, T("kèm nguồn") - 0.08,
          T("vì đó là quyết định") - 0.1, T("một cách bình tĩnh hơn") - 0.45, T("clip") - 0.08, T("livestream") - 0.1]:
    B.sfx(t, "click", 0.28)
for t in [T("tăng 0,45%") + 0.05, T("chỉ khoảng một phần tư") + 0.1, t_disc + 1.45]:
    B.sfx(t, "ding", 0.22)
for t in [T("tự trách mình") - 0.05, T("rất là bình thường") - 0.05, T("CloudStock,") - 0.05, T("xây một kênh") - 0.05]:
    B.sfx(t, "pop", 0.2)
for k in range(13):
    B.sfx(t_disc + 0.45 + k * 0.069, "click", 0.12)

B.write()
