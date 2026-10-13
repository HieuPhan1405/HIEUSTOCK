// QUET T+ (2026-10-14): kiem tra HOM NAY co tin hieu "bat nhip hoi sau ban thao co khoi ngoai gom" khong (phuong phap rut ra tu nghienCuuTPlus*.mjs). Chi DOC du lieu, khong dat lenh.
//   Dieu kien thi truong : VN-Index giam > 3% trong 5 phien (dong cua phien moi nhat so voi 5 phien truoc)
//   Dieu kien ma         : thanh khoan TB 20 phien >= 5 ty; gia DONG CUA vua thung bien duoi Bollinger 20,2 (phien truoc chua thung);
//                          khoi ngoai mua rong 5 phien >= 3,6% khoi luong khop 5 phien (nguong = phan vi 85 giai doan 09/2018 - 06/2022)
//   Cach danh trong kiem chung: mua mo cua phien sau, ban tu chieu T+2 den T+5. KHONG phai khuyen nghi - chi la ket qua thong ke.
// Nguon: nen ngay DNSE (gia dieu chinh), khoi ngoai VNDirect finfo. Danh sach ma: engine/output/nen_dai.json.
// Chay: node engine/dich-vu/quetTPlus.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { bollinger } from "../../lib/chiBaoPhu.js";

const NGUONG_NGOAI = 0.036, GIAM_TT = -3, TK_TOI_THIEU = 5;
const GOC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "output");
const dsMa = Object.keys(JSON.parse(readFileSync(path.join(GOC, "nen_dai.json"), "utf-8"))).filter((m) => m !== "VNINDEX");
const lay = async (u) => { for (let i = 0; i < 3; i++) { try { const r = await fetch(u, { signal: AbortSignal.timeout(30000) }); if (r.ok) return await r.json(); } catch {} await new Promise((r) => setTimeout(r, 600 * (i + 1))); } return null; };
const den = Math.floor(Date.now() / 1000), tu = den - 86400 * 90;
const ngayIso = (t) => new Date(t * 1000).toISOString().slice(0, 10);
const f = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "-");

const jv = await lay(`https://services.entrade.com.vn/chart-api/v2/ohlcs/index?symbol=VNINDEX&resolution=1D&from=${tu}&to=${den}`);
if (!jv?.t?.length) { console.log("Khong lay duoc VN-Index."); process.exit(1); }
const vn = jv.t.map((t, i) => ({ t: ngayIso(t), c: jv.c[i] })); const n = vn.length;
const g5 = (vn[n - 1].c / vn[n - 6].c - 1) * 100;
console.log(`VN-Index ${vn[n - 1].t}: ${f(vn[n - 1].c)} | 5 phien truoc (${vn[n - 6].t}): ${f(vn[n - 6].c)} | thay doi 5 phien: ${f(g5)}%`);
console.log(g5 < GIAM_TT ? `=> DIEU KIEN THI TRUONG: BAT (giam hon ${-GIAM_TT}% / 5 phien)` : `=> DIEU KIEN THI TRUONG: CHUA BAT (can giam hon ${-GIAM_TT}% / 5 phien). Theo kiem chung, ngoai trang thai nay thi ma thung bien duoi co ngoai mua van LO trung binh.`);

// khoi ngoai 5 phien gan nhat (moi ngay 1 lan goi cho tat ca ma)
const ngay5 = vn.slice(-5).map((b) => b.t); const ngoai = new Map();
for (const d of ngay5) { const j = await lay(`https://api-finfo.vndirect.com.vn/v4/foreigns?q=type:STOCK~tradingDate:${d}&size=3000&fields=code,buyVol,sellVol`); for (const r of j?.data || []) { const a = ngoai.get(r.code) || { s: 0, n: 0 }; a.s += (r.buyVol || 0) - (r.sellVol || 0); a.n++; ngoai.set(r.code, a); } }
console.log(`Khoi ngoai: co du lieu ${ngoai.size} ma cho ${ngay5[0]} -> ${ngay5[4]}`);

const kq = []; let k = 0, coDL = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (k < dsMa.length) {
    const ma = dsMa[k++];
    const j = await lay(`https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?symbol=${ma}&resolution=1D&from=${tu}&to=${den}`);
    if (!j?.t || j.t.length < 30) continue;
    const m = j.t.length; if (ngayIso(j.t[m - 1]) !== vn[n - 1].t) continue; coDL++;
    const c = j.c, v = j.v; const bb = bollinger(c, 20, 2);
    let gt = 0, kl5 = 0; for (let i = m - 20; i < m; i++) gt += (c[i] * v[i]) / 1e6; gt /= 20; for (let i = m - 5; i < m; i++) kl5 += v[i];
    const thung = c[m - 1] < bb.duoi[m - 1], thungTruoc = c[m - 2] < bb.duoi[m - 2];
    const ng = ngoai.get(ma); const tyLe = ng && ng.n >= 4 && kl5 > 0 ? ng.s / kl5 : null;
    kq.push({ ma, gia: c[m - 1], bienDuoi: bb.duoi[m - 1], cach: (c[m - 1] / bb.duoi[m - 1] - 1) * 100, thung, dau: thung && !thungTruoc, gt, tyLe });
  }
}));
const duTK = kq.filter((x) => x.gt >= TK_TOI_THIEU);
const dat = duTK.filter((x) => x.dau && x.tyLe != null && x.tyLe >= NGUONG_NGOAI).sort((a, b) => b.tyLe - a.tyLe);
console.log(`Da quet ${coDL} ma co nen phien ${vn[n - 1].t}; du thanh khoan: ${duTK.length}; dang dong cua duoi bien duoi: ${duTK.filter((x) => x.thung).length} (vua thung phien nay: ${duTK.filter((x) => x.dau).length}); ngoai mua rong >= ${f(NGUONG_NGOAI * 100, 1)}% KL 5 phien: ${duTK.filter((x) => x.tyLe != null && x.tyLe >= NGUONG_NGOAI).length}`);
console.log(`\nMA DAT DU 2 DIEU KIEN CUA MA (${dat.length}):`);
for (const x of dat) console.log(`   ${x.ma.padEnd(5)} gia ${f(x.gia)} | bien duoi ${f(x.bienDuoi)} (${f(x.cach, 1)}%) | ngoai mua rong 5 phien = ${f(x.tyLe * 100, 1)}% KL | thanh khoan ${f(x.gt, 0)} ty/phien`);
if (!dat.length) console.log("   (khong co)");
const gan = duTK.filter((x) => !x.thung && x.cach < 2 && x.tyLe != null && x.tyLe >= NGUONG_NGOAI).sort((a, b) => a.cach - b.cach).slice(0, 15);
console.log(`\nMa co ngoai mua nhieu va gia con cach bien duoi < 2% (de theo doi, chua phai tin hieu): ${gan.map((x) => `${x.ma} (${f(x.cach, 1)}%, ngoai ${f(x.tyLe * 100, 1)}%)`).join(", ") || "(khong co)"}`);
process.exit(0);
