// SINH lib/phuongPhapDaiHanDuLieu.js: danh sach ma theo cac PHUONG PHAP DAU TU DAI HAN (trang /dai-han) tinh tu BCTC quy moi nhat + nen gia (engine/output/).
// Quy tac lay tu engine/dich-vu/nghienCuuNhaDauTuNoiTieng.mjs (da backtest 2022 -> 2026, xem lib/phuongPhapDaiHanKetQua.js) - GIU DONG BO neu doi nguong o day.
//   BUFFETT : von hoa >= 5.000 ty; ROE >= 15% ca hien tai lan 1 nam truoc; LN 12 thang khong giam; PE <= 20; (phi tai chinh) vay / VCSH <= 0,8 va CFO > 0. Sap xep ROE cao nhat.
//   CO TUC  : von hoa >= 5.000 ty, LN duong, co tuc tien mat 12 thang > 0 va khong vuot LN (loai ty suat > 15% - thuong la khoan mot lan). Sap xep ty suat cao nhat.
//   GRAHAM  : von hoa >= 5.000 ty; (phi tai chinh) thanh toan hien hanh >= 1,5 va vay dai han <= von luu dong; LN duong moi quy (8 quy gan nhat co du lieu); co tuc tien mat 12 thang > 0; LN khong giam; PE <= 15 va PE x PB <= 22,5. Sap xep PE x PB thap nhat.
//   IT BIEN DONG (Haugen): 15 ma von hoa >= 5.000 ty co do lech chuan loi suat ngay 250 phien thap nhat.
// Gia tri hop ly = TRUNG VI 4 cach (PB hop ly theo ROE; LN x (1 + g) / (k - g); so Graham; PE trung vi nganh) - xem nghienCuuDinhGiaRaGia.mjs. Chi la thong tin tham khao.
// Moi ma kem canh bao tu dong (LN tang > 100% co the do khoan bat thuong; gia < 50% gia tri hop ly; ROE > 30%). Rui ro phap ly / tin xau KHONG tu phat hien duoc - xem lib/coRuiRoDaiHan.js.
// Chay lai khi co BCTC quy moi (hoac moi tuan cung nen_dai.json):  node scripts/capNhatPhuongPhapDaiHan.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { tinhCanBang } from "../lib/chiBaoKyThuat.js";
import { SO_CP_LUU_HANH } from "../lib/soCoPhieuLuuHanh.js";
import { TEN_CONG_TY } from "../lib/tenCongTy.js";

const doc = (f) => JSON.parse(readFileSync(new URL(`../engine/output/${f}`, import.meta.url), "utf8"));
const nen = doc("nen_dai.json");
const bctc = doc("bctc_dai.json");
const nganh = doc("nganh_map.json");

const dem = {};
for (const b of Object.values(bctc)) for (const q of Object.keys(b.q)) dem[q] = (dem[q] ?? 0) + 1;
const qsAll = Object.keys(dem).sort();
const maxDem = Math.max(...Object.values(dem));
const quy = [...qsAll].reverse().find((q) => dem[q] >= 0.8 * maxDem); // quy moi nhat co BCTC cua da so cac ma
const lui = (q, k) => qsAll[qsAll.indexOf(q) - k];
const gtv = (b, q, it) => (q ? b.q[q]?.[it] : undefined);
const ttm = (b, q, it) => { let s = 0; for (let k = 0; k < 4; k++) { const x = gtv(b, lui(q, k), it); if (!Number.isFinite(x)) return NaN; s += x; } return s; };
const ttm0 = (b, q, it) => { let s = 0, co = 0; for (let k = 0; k < 4; k++) { const x = gtv(b, lui(q, k), it); if (Number.isFinite(x)) { s += x; co++; } } return co ? s : NaN; };
const so = (x) => (Number.isFinite(x) ? x : 0);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN; };
const lam = (x, d = 2) => (Number.isFinite(x) ? Math.round(x * 10 ** d) / 10 ** d : null);

function coBan(ma) {
  const b = bctc[ma];
  if (!b) return null;
  const q = quy, q4 = lui(q, 4);
  const g = (it, qq = q) => gtv(b, qq, it);
  const ln = ttm(b, q, 23003), ln0 = q4 ? ttm(b, q4, 23003) : NaN;
  const vcsh = so(g(14000)) + so(g(15000)), vcsh4 = q4 ? so(g(14000, q4)) + so(g(15000, q4)) : NaN;
  const lq = g(23003), lq4 = q4 ? g(23003, q4) : NaN;
  const tang = Number.isFinite(ln0) && ln0 > 0 && ln > 0 ? ln / ln0 - 1 : Number.isFinite(lq) && Number.isFinite(lq4) && lq4 > 0 ? lq / lq4 - 1 : NaN;
  let quyDuong = 0, quyCo = 0;
  for (let k = 0; k < 8; k++) { const x = g(23003, lui(q, k)); if (Number.isFinite(x)) { quyCo++; if (x > 0) quyDuong++; } }
  return {
    tc: b.loai !== "pi", loai: b.loai, ln, vcsh, roe: (ln / vcsh) * 100, roe4: (ln0 / vcsh4) * 100, tang,
    vay: so(g(13110)) + so(g(13340)), vayDH: so(g(13340)), tsnh: g(11000), nnh: g(13100), cfo: ttm(b, q, 32000),
    coTuc: -so(ttm0(b, q, 33600)), quyCo, quyDuong,
  };
}

// ---------- du lieu moi ma tai phien cuoi ----------
const D = [];
for (const [ma, bars] of Object.entries(nen)) {
  if (bars.length < 300 || !SO_CP_LUU_HANH[ma] || !bctc[ma]) continue;
  const n = bars.length, c = bars.map((x) => x.c);
  let gt = 0;
  for (let i = n - 20; i < n; i++) gt += (c[i] * bars[i].v) / 1e6;
  gt /= 20;
  const gia = c[n - 1];
  const cb = coBan(ma);
  if (!cb) continue;
  const ich = tinhCanBang(bars);
  const sma = (k) => c.slice(n - k).reduce((s, x) => s + x, 0) / k;
  let doLech = NaN;
  { const r = []; for (let i = n - 250; i < n; i++) r.push(Math.log(c[i] / c[i - 1])); const m = r.reduce((s, x) => s + x, 0) / r.length; doLech = Math.sqrt(r.reduce((s, x) => s + (x - m) ** 2, 0) / r.length) * Math.sqrt(250) * 100; }
  const dinh252 = Math.max(...c.slice(n - 252));
  D.push({ ma, ngayCuoi: bars[n - 1].t, gia, von: gia * 1000 * SO_CP_LUU_HANH[ma], gt, cb, ggTop: ich.top[n - 1], ggBot: ich.bot[n - 1], sma50: sma(50), sma200: sma(200), doLech, cachDinh: (gia / dinh252 - 1) * 100, nganh: nganh[ma] ?? "Khac" });
}
const ngayDuLieu = D.filter((d) => d.ma === "FPT")[0]?.ngayCuoi ?? D.map((d) => d.ngayCuoi).sort().at(-1);
const hoatDong = D.filter((d) => d.ngayCuoi >= ngayDuLieu.slice(0, 8) + "01" || d.ngayCuoi === ngayDuLieu).filter((d) => d.gt >= 5); // con giao dich, GTGD TB20 >= 5 ty

// ---------- gia tri hop ly ----------
const peTheoNganh = new Map();
for (const d of hoatDong) { const pe = d.cb.ln > 0 ? d.von / d.cb.ln : NaN; if (pe > 0 && pe < 100) { const a = peTheoNganh.get(d.nganh) ?? []; a.push(pe); peTheoNganh.set(d.nganh, a); } }
const peMed = new Map([...peTheoNganh].filter(([, a]) => a.length >= 5).map(([k, a]) => [k, med(a)]));
function giaHopLy(d) {
  const { ln, vcsh, roe, tang } = d.cb;
  if (!(ln > 0 && vcsh > 0)) return null;
  const K = 0.12, G = 0.06, fv = [];
  const roeC = Math.min(roe, 25) / 100;
  if (roeC > G) fv.push((vcsh * (roeC - G)) / (K - G));
  const g = Math.max(0, Math.min(0.05, Number.isFinite(tang) ? tang / 2 : 0));
  fv.push((ln * (1 + g)) / (K - g));
  fv.push(Math.sqrt(22.5 * ln * vcsh));
  const m = peMed.get(d.nganh);
  if (m > 0) fv.push(ln * m);
  if (fv.length < 3) return null;
  return med(fv) / SO_CP_LUU_HANH[d.ma] / 1000;
}

// ---------- bo loc cac phuong phap ----------
const pe = (d) => (d.cb.ln > 0 ? d.von / d.cb.ln : NaN);
const pb = (d) => (d.cb.vcsh > 0 ? d.von / d.cb.vcsh : NaN);
const buffett = (d) => { const c = d.cb; if (d.von < 5e12 || !(c.ln > 0) || !(c.roe >= 15) || !(c.roe4 >= 15) || !(c.tang >= 0) || !(pe(d) <= 20)) return false; return c.tc || (c.vay / c.vcsh <= 0.8 && c.cfo > 0); };
const graham = (d) => { const c = d.cb; if (d.von < 5e12 || !(c.ln > 0) || !(pe(d) <= 15) || !(pe(d) * pb(d) <= 22.5)) return false; if (!c.tc && (!(c.tsnh / c.nnh >= 1.5) || c.vayDH > c.tsnh - c.nnh)) return false; if (c.quyCo < 4 || c.quyDuong < c.quyCo || !(c.coTuc > 0)) return false; return c.tang >= 0; };
const coTuc = (d) => { const c = d.cb; return d.von >= 5e12 && c.ln > 0 && c.coTuc > 0 && c.coTuc <= c.ln && c.coTuc / d.von <= 0.15; };

function mo(d, them = {}) {
  const gh = giaHopLy(d), r = gh ? d.gia / gh : null, tang = d.cb.tang * 100;
  const canhBao = [];
  if (Number.isFinite(tang) && tang > 100) canhBao.push("Lợi nhuận 12 tháng tăng trên 100%: có thể do khoản bất thường, giá hợp lý có thể bị thổi phồng.");
  if (r != null && r < 0.5) canhBao.push("Giá chưa bằng một nửa giá hợp lý: kiểm tra lợi nhuận bất thường hoặc vấn đề của doanh nghiệp.");
  if (d.cb.roe > 30) canhBao.push("ROE trên 30%: khó duy trì lâu dài.");
  return {
    ma: d.ma, ten: TEN_CONG_TY[d.ma]?.[1] ?? d.ma, nganh: d.nganh, loai: d.cb.loai, vonHoaTy: Math.round(d.von / 1e9), gia: lam(d.gia), roe: lam(d.cb.roe, 1), lnTang: lam(tang, 0),
    pe: lam(pe(d), 1), pb: lam(pb(d), 2), vayVcsh: d.cb.tc ? null : lam(d.cb.vay / d.cb.vcsh, 2), giaHopLy: lam(gh), r: lam(r, 2),
    ggTop: lam(d.ggTop), ggBot: lam(d.ggBot), sma50: lam(d.sma50), sma200: lam(d.sma200), cachDinh: lam(d.cachDinh, 0), canhBao, ...them,
  };
}
const top = (arr, key, desc, n) => [...arr].sort((a, b) => (desc ? key(b) - key(a) : key(a) - key(b))).slice(0, n);
const dsBuffett = top(hoatDong.filter(buffett), (d) => d.cb.roe, true, 25).map((d) => mo(d));
const dsGraham = top(hoatDong.filter(graham), (d) => pe(d) * pb(d), false, 25).map((d) => mo(d, { peXpb: lam(pe(d) * pb(d), 1) }));
const dsCoTuc = top(hoatDong.filter(coTuc), (d) => d.cb.coTuc / d.von, true, 25).map((d) => mo(d, { tySuatCoTuc: lam((d.cb.coTuc / d.von) * 100, 1) }));
const dsItBD = top(hoatDong.filter((d) => d.von >= 5e12 && d.cb.ln > 0), (d) => d.doLech, false, 15).map((d) => mo(d, { doLech: lam(d.doLech, 1) }));

// ---------- khung loi (core) + ve tinh (satellite) ----------
const NGANH_LOI = ["Ngan hang", "Cong nghe - Vien thong"];
const loiPool = dsBuffett.filter((m) => NGANH_LOI.includes(m.nganh));
const loi = [...loiPool.filter((m) => m.nganh === "Ngan hang").slice(0, 5), ...loiPool.filter((m) => m.nganh !== "Ngan hang").slice(0, 3)];
const daLay = new Set(loi.map((m) => m.ma));
const theoNganh = new Map();
const veTinh = [];
for (const m of [...dsBuffett.map((x) => ({ ...x, nguon: "Buffett" })), ...dsCoTuc.map((x) => ({ ...x, nguon: "Cổ tức" }))]) {
  if (daLay.has(m.ma) || NGANH_LOI.includes(m.nganh) || m.loai === "ck" || m.loai === "bh") continue;
  if ((theoNganh.get(m.nganh) ?? 0) >= 2) continue;
  theoNganh.set(m.nganh, (theoNganh.get(m.nganh) ?? 0) + 1);
  daLay.add(m.ma);
  veTinh.push(m);
  if (veTinh.length >= 7) break;
}
const khung = {
  loi: loi.map((m) => ({ ma: m.ma, ty: lam(65 / loi.length, 1) })),
  veTinh: veTinh.map((m) => ({ ma: m.ma, ty: lam(35 / veTinh.length, 1), nguon: m.nguon })),
};

const du = {
  capNhat: new Date().toISOString().slice(0, 10),
  giaDen: ngayDuLieu,
  quyBaoCao: quy,
  buffett: dsBuffett,
  coTuc: dsCoTuc,
  graham: dsGraham,
  itBienDong: dsItBD,
  khung,
};
const out =
  `// FILE DUOC TAO TU DONG boi scripts/capNhatPhuongPhapDaiHan.mjs (khong sua tay). Danh sach ma theo phuong phap dai han, gia den ${ngayDuLieu}, BCTC quy ${quy}.\n` +
  `// Gia / vung gia tren web duoc tinh LAI theo gia hien tai (app/dai-han/page.js); file nay chi giu chi so co ban + gia tri hop ly tai thoi diem chay script.\n` +
  `export const DAI_HAN = ${JSON.stringify(du, null, 1)};\n`;
writeFileSync(new URL("../lib/phuongPhapDaiHanDuLieu.js", import.meta.url), out);
console.log(`da ghi lib/phuongPhapDaiHanDuLieu.js: gia den ${ngayDuLieu}, BCTC quy ${quy}; Buffett ${dsBuffett.length}, Co tuc ${dsCoTuc.length}, Graham ${dsGraham.length}, It bien dong ${dsItBD.length}; loi ${khung.loi.map((x) => x.ma).join(" ")}; ve tinh ${khung.veTinh.map((x) => x.ma).join(" ")}; ${(out.length / 1024).toFixed(0)}KB`);
