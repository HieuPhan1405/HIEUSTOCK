// Sinh BAO CAO HTML: RRG nganh + dong tien + diem Z / F / DuPont tung ma theo quy 2026 (tu rrg_nganh.json + phan_tich_co_ban.json). Ra Desktop\Phan-Tich-Co-Ban\bao-cao-co-ban.html
// Chay (sau tinhRRG.mjs --json va phanTichCoBan.mjs): node engine/dich-vu/baoCaoCoBan.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { NGANH_NHAN } from "../../lib/nganh.js";

const doc = (f) => JSON.parse(readFileSync(new URL(`../output/${f}`, import.meta.url), "utf8"));
const rrg = doc("rrg_nganh.json");
const pt = doc("phan_tich_co_ban.json");
const nen = doc("nen_dai.json");
const QUY = ["2026-03-31", "2026-06-30", "2026-09-30"];
const nhan = (k) => NGANH_NHAN[k] || k;

const dsMa = Object.entries(pt)
  .filter(([, o]) => QUY.some((q) => o.q[q]))
  .map(([ma, o]) => {
    const n = nen[ma];
    const gia = n?.at(-1)?.c ?? null;
    let gt = 0;
    if (n) for (let j = n.length - 20; j < n.length; j++) gt += (n[j].c * n[j].v) / 1e6;
    const q = {};
    for (const k of QUY) if (o.q[k]) q[k] = o.q[k];
    return { ma, nganh: o.nganh, nhanNganh: nhan(o.nganh), loai: o.loai, gia, gtgd: Math.round(gt / 20), q };
  });
const du = { ngay: rrg.ngay, tuanCuoi: rrg.tuanCuoi, rrg: rrg.ketQua.map((k) => ({ ...k, nhan: nhan(k.nganh) })), ma: dsMa };

const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Phân tích cơ bản theo quý 2026 · RRG ngành, Z · F · DuPont</title>
<style>
:root{--nen:#0f0f1a;--the:#181828;--vien:#2c2c44;--chu:#ecebf5;--mo:#9a98b4;--tim:#7c6cf0;--xanh:#2ecc8f;--do:#ff6b7a;--vang:#f2b84b}
*{box-sizing:border-box}body{margin:0;background:var(--nen);color:var(--chu);font:14px/1.5 "Open Sans",system-ui,sans-serif}
.w{max-width:1280px;margin:0 auto;padding:20px 16px 60px}h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:34px 0 10px}
.mo{color:var(--mo)}.the{background:var(--the);border:1px solid var(--vien);border-radius:14px;padding:14px}
table{border-collapse:collapse;width:100%}th,td{padding:6px 8px;border-bottom:1px solid var(--vien);text-align:right;white-space:nowrap}
th{color:var(--mo);font-weight:600;font-size:12px;cursor:pointer;position:sticky;top:0;background:var(--the)}th:first-child,td:first-child,th.l,td.l{text-align:left}
.x{color:var(--xanh)}.d{color:var(--do)}.v{color:var(--vang)}.tag{display:inline-block;padding:1px 8px;border-radius:99px;font-size:11px;border:1px solid var(--vien)}
.Leading{color:var(--xanh);border-color:var(--xanh)}.Improving{color:#6fb7ff;border-color:#6fb7ff}.Weakening{color:var(--vang);border-color:var(--vang)}.Lagging{color:var(--do);border-color:var(--do)}
.ct{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.ct input,.ct select,.ct button{background:var(--the);border:1px solid var(--vien);color:var(--chu);border-radius:10px;padding:7px 10px;font:inherit}
.ct button.on{background:var(--tim);border-color:var(--tim)}.cuon{overflow:auto;max-height:70vh;border-radius:12px}
.luoi{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:14px}@media(max-width:900px){.luoi{grid-template-columns:1fr}}
.ghi{font-size:12px;color:var(--mo);margin-top:8px}.ct2{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:6px 18px;margin-top:8px}
tr.ct-dong{cursor:pointer}tr.ct-dong:hover td{background:#1f1f33}.chi td{background:#14141f;text-align:left;white-space:normal}
.b{display:inline-block;min-width:22px;text-align:center;border-radius:6px;padding:0 5px;font-weight:700}
</style></head><body><div class="w">
<h1>Phân tích cơ bản theo quý 2026</h1>
<div class="mo">RRG ngành · dòng tiền · điểm Z (Altman) · điểm F (Piotroski) · DuPont — dữ liệu giá đến ${rrg.ngay}, báo cáo tài chính VNDirect (cập nhật đến Q2/2026, ${dsMa.filter((m) => m.q["2026-09-30"]).length} mã đã có Q3/2026).</div>

<h2>1. RRG ngành — ngành nào đang dẫn dắt và có dòng tiền</h2>
<div class="luoi"><div class="the"><svg id="rrg" viewBox="0 0 640 520" style="width:100%;height:auto"></svg>
<div class="ghi">Trục ngang RS-Ratio (sức mạnh tương đối, &gt;100 = hơn thị trường), trục dọc RS-Momentum (&gt;100 = đang tăng tốc). Đuôi = 8 tuần gần nhất, chấm to = tuần này. Benchmark = chỉ số trung bình đều các mã thanh khoản ≥ 2 tỷ/phiên (VN-Index tính theo vốn hoá nên VIC/VHM/ngân hàng kéo, gần như ngành nào cũng “thắng” nó). Ngành có &lt; 3 mã đủ thanh khoản (Bảo hiểm, Y tế - Dược, Du lịch - Giải trí) không vẽ.</div></div>
<div class="the"><div class="cuon" style="max-height:520px"><table id="bangRrg"></table></div>
<div class="ghi"><b>Nóng</b> = GTGD 5 phiên gần nhất / TB các đợt 5 phiên trong 10 tuần trước (&gt;1 = tiền vào nhiều hơn thường lệ). <b>Tiền ròng ước tính</b> = Σ(GTGD × vị trí giá đóng cửa trong nến) / Σ GTGD 5 phiên — đo mức đóng cửa nghiêng về đầu cao hay thấp của nến, KHÔNG phải mua/bán chủ động thật (số thật nằm ở trang Thị trường của web, dữ liệu DNSE theo thời gian thực).</div></div></div>

<h2>2. Điểm Z · F · DuPont từng mã</h2>
<div class="the"><div class="ct">
<input id="tim" placeholder="Tìm mã…" style="width:120px">
<select id="nganhLoc"></select>
<button data-g="tot" class="on">Ngành Leading + Improving</button><button data-g="tatca">Tất cả ngành</button>
<button data-l="pi" class="on">Phi tài chính (Z, F)</button><button data-l="tc">Ngân hàng / CK / BH (DuPont)</button>
<select id="quy"><option value="2026-06-30">Quý 2/2026</option><option value="2026-03-31">Quý 1/2026</option><option value="2026-09-30">Quý 3/2026 (mã đã công bố)</option></select>
<button id="chon">Chỉ ứng viên chất lượng</button></div>
<div class="ghi" id="mota"></div>
<div class="cuon"><table id="bang"></table></div>
<div class="ghi">Bấm một dòng để xem chi tiết 9 tiêu chí F, Z, DuPont 5 bước và 3 quý.</div></div>

<h2>3. Cách đọc & giới hạn</h2>
<div class="the" style="font-size:13px">
<p><b>Z″ (Altman, thị trường mới nổi)</b> = 6,56·X1 + 3,26·X2 + 6,72·X3 + 1,05·X4 + 3,25. X1 = (TS ngắn hạn − Nợ ngắn hạn)/Tổng TS; X2 = LNST chưa phân phối/Tổng TS; X3 = EBIT 4 quý/Tổng TS; X4 = Vốn CSH/Tổng nợ. &gt;5,85 an toàn · 4,15–5,85 vùng xám · &lt;4,15 nguy cơ. Z gốc có thêm vốn hoá thị trường (&gt;2,99 / 1,81–2,99 / &lt;1,81) nhưng với doanh nghiệp VN thường rơi nhiều vào “nguy cơ” vì BĐS/xây dựng có hàng tồn kho lớn — dùng Z″ làm chính.</p>
<p><b>F (Piotroski) 9 điểm</b>, tính trên 4 quý gần nhất so với cùng kỳ năm trước: ROA&gt;0 · CFO&gt;0 · ROA tăng · CFO&gt;LNST · đòn bẩy giảm · thanh toán hiện hành tăng · không phát hành thêm CP · biên LN gộp tăng · vòng quay TS tăng. 8–9 = rất tốt, ≤3 = yếu.</p>
<p><b>DuPont</b>: ROE = biên LNST × vòng quay tài sản × đòn bẩy vốn (TTM); 5 bước tách thêm gánh nặng thuế, gánh nặng lãi vay, biên EBIT. “Chủ đạo” = nhân tố làm ROE đổi nhiều nhất so với cùng kỳ năm trước.</p>
<p><b>Giới hạn</b>: Z và F chỉ có nghĩa với doanh nghiệp phi tài chính; ngân hàng/chứng khoán/bảo hiểm chỉ có DuPont và “điểm sinh lời” 0–5 (ROA&gt;0, ROA tăng, ROE≥10%, LNST tăng, không phát hành thêm CP). Số liệu là báo cáo hợp nhất theo VNDirect; mã có biến động tài sản đột ngột (tái cơ cấu, thoái vốn công ty con, vd FPT quý 1/2026) sẽ cho điểm bị nhiễu — đọc cùng báo cáo gốc. Bảng được tách quý nên Q3/2026 mới có ${dsMa.filter((m) => m.q["2026-09-30"]).length} mã.</p>
</div>
</div>
<script>
const D=${JSON.stringify(du)};
const f1=(x,d=1)=>x==null||!isFinite(x)?"—":x.toFixed(d).replace(".",",");
const $=s=>document.querySelector(s);
// ---- RRG
(function(){
 const svg=$("#rrg"),W=640,H=520,m=44;const R=D.rrg;
 const xs=R.flatMap(r=>r.duoi.map(d=>d.ratio)),ys=R.flatMap(r=>r.duoi.map(d=>d.mom));
 const dx=Math.max(4,Math.max(...xs.map(x=>Math.abs(x-100)))+1),dy=Math.max(3,Math.max(...ys.map(y=>Math.abs(y-100)))+1);
 const X=v=>m+(v-(100-dx))/(2*dx)*(W-2*m),Y=v=>H-m-(v-(100-dy))/(2*dy)*(H-2*m);
 const mau={Leading:"#2ecc8f",Improving:"#6fb7ff",Weakening:"#f2b84b",Lagging:"#ff6b7a"};
 let s='<rect x="'+m+'" y="'+m+'" width="'+(W-2*m)+'" height="'+(H-2*m)+'" fill="none" stroke="#2c2c44"/>';
 s+='<line x1="'+X(100)+'" x2="'+X(100)+'" y1="'+m+'" y2="'+(H-m)+'" stroke="#4a4a6a"/><line y1="'+Y(100)+'" y2="'+Y(100)+'" x1="'+m+'" x2="'+(W-m)+'" stroke="#4a4a6a"/>';
 s+='<text x="'+(W-m-6)+'" y="'+(m+16)+'" text-anchor="end" fill="#2ecc8f" font-size="12" opacity=".7">LEADING – dẫn dắt</text><text x="'+(W-m-6)+'" y="'+(H-m-8)+'" text-anchor="end" fill="#f2b84b" font-size="12" opacity=".7">WEAKENING – yếu đi</text><text x="'+(m+6)+'" y="'+(H-m-8)+'" fill="#ff6b7a" font-size="12" opacity=".7">LAGGING – tụt hậu</text><text x="'+(m+6)+'" y="'+(m+16)+'" fill="#6fb7ff" font-size="12" opacity=".7">IMPROVING – cải thiện</text>';
 s+='<text x="'+(W/2)+'" y="'+(H-8)+'" text-anchor="middle" fill="#9a98b4" font-size="11">RS-Ratio →</text><text transform="translate(12,'+(H/2)+') rotate(-90)" text-anchor="middle" fill="#9a98b4" font-size="11">RS-Momentum →</text>';
 for(const r of R){const c=mau[r.goc],p=r.duoi.map(d=>X(d.ratio)+","+Y(d.mom));
  s+='<polyline points="'+p.join(" ")+'" fill="none" stroke="'+c+'" stroke-width="1.6" opacity=".55"/>';
  r.duoi.slice(0,-1).forEach((d,i)=>{s+='<circle cx="'+X(d.ratio)+'" cy="'+Y(d.mom)+'" r="2" fill="'+c+'" opacity=".5"/>'});
  const l=r.duoi.at(-1);s+='<circle cx="'+X(l.ratio)+'" cy="'+Y(l.mom)+'" r="5.5" fill="'+c+'"/><text x="'+(X(l.ratio)+8)+'" y="'+(Y(l.mom)+4)+'" fill="#ecebf5" font-size="11">'+r.nhan+'</text>';}
 svg.innerHTML=s;
 const t=$("#bangRrg");let h='<tr><th class="l">Ngành</th><th>Góc</th><th>RS-Ratio</th><th>Momentum</th><th>RS 20p</th><th>GTGD 5p (tỷ)</th><th>Nóng</th><th>Tiền ròng ước tính</th></tr>';
 for(const r of D.rrg.slice().sort((a,b)=>b.ratio-a.ratio)){h+='<tr><td class="l">'+r.nhan+' <span class="mo">('+r.soMa+')</span></td><td><span class="tag '+r.goc+'">'+r.goc+'</span></td><td>'+f1(r.ratio)+'</td><td>'+f1(r.mom)+'</td><td class="'+(r.rs20>0?"x":"d")+'">'+(r.rs20>0?"+":"")+f1(r.rs20)+'</td><td>'+Math.round(r.gtTuan).toLocaleString("vi-VN")+'</td><td class="'+(r.nongDongTien>=1.1?"x":r.nongDongTien<0.8?"d":"")+'">'+f1(r.nongDongTien,2)+'</td><td class="'+(r.tienRong5p>5?"x":r.tienRong5p<-5?"d":"")+'">'+(r.tienRong5p>0?"+":"")+f1(r.tienRong5p)+'%</td></tr>'}
 t.innerHTML=h;
})();
// ---- bang ma
const gocNganh=Object.fromEntries(D.rrg.map(r=>[r.nhan,r.goc]));
const st={g:"tot",l:"pi",chon:false,sap:"mac",hd:-1};
const ds=[...new Set(D.ma.map(m=>m.nhanNganh))].sort();
$("#nganhLoc").innerHTML='<option value="">Mọi ngành</option>'+ds.map(n=>'<option>'+n+'</option>').join("");
document.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{st.g=b.dataset.g;document.querySelectorAll("[data-g]").forEach(x=>x.classList.toggle("on",x===b));ve()});
document.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>{st.l=b.dataset.l;document.querySelectorAll("[data-l]").forEach(x=>x.classList.toggle("on",x===b));ve()});
$("#chon").onclick=e=>{st.chon=!st.chon;e.target.classList.toggle("on",st.chon);ve()};
for(const i of ["#tim","#nganhLoc","#quy"])$(i).oninput=ve;
const mauZ=v=>v==="an toàn"?"x":v==="xám"?"v":"d";
const mauF=f=>f>=7?"x":f<=3?"d":"v";
const tot=(m,q)=>{const x=m.q[q];return m.loai==="pi"&&x&&x.f>=7&&x.vungZ2==="an toàn"&&x.roe>=12&&(x.lnTTMYoY??-1)>0&&(x.cfoLNST??0)>0.5};
function ve(){
 const q=$("#quy").value,tu=$("#tim").value.trim().toUpperCase(),ng=$("#nganhLoc").value;
 let a=D.ma.filter(m=>m.q[q]);
 a=a.filter(m=>st.l==="pi"?m.loai==="pi":m.loai!=="pi");
 if(st.g==="tot")a=a.filter(m=>["Leading","Improving"].includes(gocNganh[m.nhanNganh]));
 if(ng)a=a.filter(m=>m.nhanNganh===ng);
 if(tu)a=a.filter(m=>m.ma.includes(tu));
 if(st.chon)a=a.filter(m=>tot(m,q));
 const key={mac:m=>-(m.gtgd||0),ma:m=>m.ma,f:m=>-(m.q[q].f??m.q[q].sinhLoi??0),z:m=>-(m.q[q].z2??-99),roe:m=>-(m.q[q].roe??-99),tang:m=>-(m.q[q].lnTTMYoY??-999),gtgd:m=>-(m.gtgd||0)}[st.sap];
 a.sort((x,y)=>{const p=key(x),r=key(y);return (p>r?1:p<r?-1:0)*st.hd*-1});
 $("#mota").textContent=a.length+" mã · "+(st.l==="pi"?"phi tài chính: có điểm Z″, F và DuPont":"ngân hàng/chứng khoán/bảo hiểm: DuPont + điểm sinh lời 0–5")+(st.chon?" · lọc: F≥7, Z″ an toàn, ROE≥12%, LNST TTM tăng, CFO>50% LNST":"");
 const th=(k,t,c)=>'<th class="'+(c||"")+'" onclick="sap(\\''+k+'\\')">'+t+'</th>';
 let h='<tr>'+th("ma","Mã","l")+th("ma","Ngành","l")+(st.l==="pi"?th("z","Z″")+th("z","Vùng Z″")+th("f","F (0–9)"):th("f","Điểm sinh lời"))+th("roe","ROE TTM")+'<th>Biên LN</th><th>Vòng quay</th><th>Đòn bẩy</th>'+th("tang","LNST TTM so cùng kỳ")+'<th>LN quý (tỷ)</th><th>LN quý so cùng kỳ</th><th>Chủ đạo</th>'+th("gtgd","GTGD (tỷ)")+'</tr>';
 for(const m of a.slice(0,400)){const x=m.q[q];
  h+='<tr class="ct-dong" onclick="mo(this,\\''+m.ma+'\\')"><td class="l"><b>'+m.ma+'</b></td><td class="l mo">'+m.nhanNganh+'</td>'+
   (st.l==="pi"?'<td class="'+mauZ(x.vungZ2)+'">'+f1(x.z2)+'</td><td class="'+mauZ(x.vungZ2)+'">'+x.vungZ2+'</td><td><span class="b '+mauF(x.f)+'">'+x.f+'</span></td>':'<td><span class="b '+(x.sinhLoi>=4?"x":x.sinhLoi<=2?"d":"v")+'">'+x.sinhLoi+'/5</span></td>')+
   '<td>'+f1(x.roe)+'%</td><td>'+f1(x.bienLN)+'%</td><td>'+f1(x.vongQuay,2)+'</td><td>'+f1(x.donBay,2)+'</td><td class="'+(x.lnTTMYoY>0?"x":"d")+'">'+(x.lnTTMYoY==null?"—":(x.lnTTMYoY>0?"+":"")+x.lnTTMYoY+"%")+'</td><td>'+(x.lnQuy==null?"—":x.lnQuy.toLocaleString("vi-VN"))+'</td><td class="'+(x.lnQuyYoY>0?"x":"d")+'">'+(x.lnQuyYoY==null?"—":(x.lnQuyYoY>0?"+":"")+x.lnQuyYoY+"%")+'</td><td class="l mo">'+(x.chuDao||"")+'</td><td>'+(m.gtgd||0).toLocaleString("vi-VN")+'</td></tr>'}
 $("#bang").innerHTML=h;
}
function sap(k){if(st.sap===k)st.hd*=-1;else{st.sap=k;st.hd=-1}ve()}
function mo(tr,ma){
 const n=tr.nextElementSibling;if(n&&n.classList.contains("chi")){n.remove();return}
 const m=D.ma.find(x=>x.ma===ma);let h='<tr class="chi"><td colspan="14"><b>'+ma+'</b> · '+m.nhanNganh+' · giá '+f1(m.gia)+'<div style="display:flex;flex-wrap:wrap;gap:24px;margin-top:6px">';
 for(const q of Object.keys(m.q)){const x=m.q[q];h+='<div style="min-width:250px"><b>'+({"2026-03-31":"Q1/2026","2026-06-30":"Q2/2026","2026-09-30":"Q3/2026"})[q]+'</b><br>';
  if(m.loai==="pi"){h+='Z″ '+f1(x.z2)+' ('+x.vungZ2+') · Z gốc '+f1(x.z)+' ('+x.vungZ+')<br><span class="mo">X1 vốn lưu động '+f1(x.x.x1,2)+' · X2 LN giữ lại '+f1(x.x.x2,2)+' · X3 EBIT/TS '+f1(x.x.x3,2)+' · X4 vốn CSH/nợ '+f1(x.x.x4,2)+'</span><br>F = <b>'+x.f+'</b>/9: ';
   h+=x.fChiTiet.map(c=>'<span class="'+(c[1]===true?"x":c[1]===false?"d":"mo")+'">'+(c[1]===true?"✓":c[1]===false?"✗":"?")+' '+c[0]+'</span>').join(" · ")+'<br>';}
  h+='DuPont: ROE '+f1(x.roe)+'% (cùng kỳ năm trước '+f1(x.roe0)+'%) = biên LN '+f1(x.bienLN)+'% × vòng quay '+f1(x.vongQuay,2)+' × đòn bẩy '+f1(x.donBay,2);
  if(m.loai==="pi")h+='<br><span class="mo">5 bước: gánh nặng thuế '+f1(x.gachThue,2)+' × gánh nặng lãi '+f1(x.gachLai,2)+' × biên EBIT '+f1(x.bienEBIT)+'% × vòng quay × đòn bẩy · CFO/LNST '+f1(x.cfoLNST,2)+'</span>';
  h+='<br>Doanh thu quý '+(x.dtQuyYoY==null?"—":(x.dtQuyYoY>0?"+":"")+x.dtQuyYoY+"%")+' · LN quý '+(x.lnQuyYoY==null?"—":(x.lnQuyYoY>0?"+":"")+x.lnQuyYoY+"%")+' so cùng kỳ'+(x.chuDao?' · ROE đổi chủ yếu do <b>'+x.chuDao+'</b>':'')+'</div>'}
 h+='</div></td></tr>';tr.insertAdjacentHTML("afterend",h);
}
ve();
</script></body></html>`;

const dir = "C:/Users/hieu/Desktop/Phan-Tich-Co-Ban";
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/bao-cao-co-ban.html`, html);
console.log("Da ghi", `${dir}/bao-cao-co-ban.html`, Math.round(html.length / 1024), "KB;", dsMa.length, "ma");
