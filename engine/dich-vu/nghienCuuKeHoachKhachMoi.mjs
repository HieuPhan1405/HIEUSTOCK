// KE HOACH CHO KHACH CHUA CO MA (Hieu 02/11/2026: "test toan thoi gian, tim ke hoach hieu qua nhat", danh muc <= 6 ma).
// Lenh Mua thuong cua engine, vao THUC TE (mua mo cua phien sau, ban tu T+2), cat lo toi da 6% tu gia vao, 30/30 + chay, phi 0,4%, lenh dang mo tinh theo gia cuoi.
// Luoi phuong an: K (so ma toi da) x loc vung mua (mo cua <= moc +1%) x loc thi truong (VNI duoi duong can bang dai han: bo lenh / giam con 30%) x cach chia von (deu 1/K / theo rui ro 1% von) x loc chat luong (d5>1% & pos>=0,6).
// Bao cao CAGR / sut giam toi da theo 3 giai doan (<2019, 2019-2022.4, 2022.5+) so voi mua giu VN-Index cung giai doan. KHONG chon phuong an chi vi dep o 1 giai doan: xep theo giai doan KEM NHAT.
// Chay: node engine/dich-vu/nghienCuuKeHoachKhachMoi.mjs
import { docJson, chayEngine, danhMucNhieuLan, tb, f, kyOf, TEN_KY } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";
import { tinhCanBang } from "../../lib/chiBaoKyThuat.js";

const vni = docJson("vnindex_dai.json");
const chiSo = new Map(vni.map((b, i) => [b.t, i]));
const vc = vni.map((b) => b.c);
const canBang = tinhCanBang(vni.map((b) => ({ t: b.t, o: b.o ?? b.c, h: b.h ?? b.c, l: b.l ?? b.c, c: b.c, v: b.v ?? 0 })));
const yeu = (ngay) => {
  const i = chiSo.get(ngay);
  return i != null && canBang.bot[i] != null && vc[i] < canBang.bot[i];
};
const { lenh: tatCa } = chayEngine({ cache: docJson("nen_dai.json"), vni, giuLenhDangMo: true });
const lenh = tatCa.filter((t) => t.loai === 1 && t.iv >= 120);
const HT = { moc: HAI_TP, baoVe: true, theoSell: true, danhGiaCuoi: true, catLoToiDaPct: 6 };
const ds = [];
const kqs = [];
for (const t of lenh) {
  const i = chiSo.get(t.ngay);
  t.d5 = i != null && i >= 5 ? (vc[i] / vc[i - 5] - 1) * 100 : null;
  let mn = Infinity, mx = -Infinity;
  for (let k = t.iv - 119; k <= t.iv; k++) { mn = Math.min(mn, t.low[k]); mx = Math.max(mx, t.high[k]); }
  t.pos = (t.close[t.iv] - mn) / (mx - mn);
  t.yeu = yeu(t.ngay);
  const r = mp(t, { ...HT, vao: t.iv + 1, banTu: t.iv + 3 });
  if (!r) continue;
  const E = t.open[t.iv + 1];
  t.trongVung = E <= t.E * 1.01; // mo cua phien sau khong cao hon moc qua 1% (vung mua cua web)
  t.cachSL = Math.min(6, Math.max(0.5, ((E - t.S) / E) * 100)); // cat lo thuc (da chan 6%)
  ds.push(t);
  kqs.push(r);
}
{ const th = ds.map((t, i) => ({ t, r: kqs[i] })).sort((a, b) => (a.t.ngay < b.t.ngay ? -1 : 1)); th.forEach((x, i) => { ds[i] = x.t; kqs[i] = x.r; }); } // sap theo ngay (moc doi chieu VN-Index can thu tu)
console.log(`Lenh Mua thuong dung duoc: ${ds.length}; ngay ${ds[0].ngay} -> ${ds.at(-1).ngay}; trong do yeu thi truong ${ds.filter((t) => t.yeu).length}`);

const gd = (t) => kyOf(t.ngay);
const vniKy = [0, 1, 2].map((k) => {
  const x = ds.filter((t) => gd(t) === k);
  if (!x.length) return null;
  const a = chiSo.get(x[0].ngay), b = chiSo.get(x.at(-1).ngay);
  const nam = (Date.parse(x.at(-1).ngay) - Date.parse(x[0].ngay)) / (365.25 * 86400e3);
  let dinh = vc[a], sut = 0;
  for (let i = a; i <= b; i++) { dinh = Math.max(dinh, vc[i]); sut = Math.max(sut, 1 - vc[i] / dinh); }
  return { cagr: (Math.pow(vc[b] / vc[a], 1 / nam) - 1) * 100, sut: sut * 100 };
});
console.log("VN-Index mua giu:", vniKy.map((v, k) => (v ? `${TEN_KY[k]} ${f(v.cagr, 1)}%/${f(v.sut, 0)}%` : "-")).join(" | "));

const PA = [];
for (const K of [3, 4, 5, 6])
  for (const vung of [false, true])
    for (const tt of ["khong", "bo", "giam30"])
      for (const chia of ["deu", "rui_ro"])
        for (const cl of [false, true]) PA.push({ K, vung, tt, chia, cl });
const ten = (p) => `K${p.K} ${p.vung ? "vung+1%" : "moi gia"} | TT:${p.tt} | ${p.chia} | ${p.cl ? "d5&pos" : "khong loc"}`;
const kq = [];
for (const p of PA) {
  const loc = (t) => (!p.vung || t.trongVung) && (!p.cl || (t.d5 > 1 && t.pos >= 0.6)) && !(p.tt === "bo" && t.yeu);
  const trongSo = (t) => {
    let w = p.chia === "rui_ro" ? Math.min(1, (1 / t.cachSL) * p.K) : 1; // 1% von / cat lo% = ty trong; slot = 1/K
    if (p.tt === "giam30" && t.yeu) w *= 0.3;
    return w;
  };
  const ra = [0, 1, 2].map((k) => {
    const idx = ds.map((t, i) => (gd(t) === k ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) return null;
    return danhMucNhieuLan(idx.map((i) => kqs[i]), idx.map((i) => ds[i]), p.K, 20, { loc, trongSo });
  });
  kq.push({ p, ra });
}
const so = (r) => (r ? r.cagr : -999);
const xep = (a) => [...a].sort((x, y) => Math.min(...y.ra.map(so)) - Math.min(...x.ra.map(so)));
const in1 = (x) => x.ra.map((r, k) => (r ? `${f(r.cagr, 1).padStart(6)}%/${f(r.sut, 0).padStart(2)}% (n${f(r.lay, 0)})` : "-")).join(" | ");
console.log(`\nPhuong an xep theo giai doan KEM NHAT (CAGR/sut giam toi da, n lenh lay) -- cot: ${TEN_KY.join(" | ")}`);
for (const x of xep(kq).slice(0, 15)) console.log(ten(x.p).padEnd(52), in1(x));
console.log("\nCo so (K6, moi gia, khong loc thi truong, chia deu, khong loc) va bien the 1 yeu to:");
const co = (K, vung, tt, chia, cl) => kq.find((x) => x.p.K === K && x.p.vung === vung && x.p.tt === tt && x.p.chia === chia && x.p.cl === cl);
for (const [m, x] of [["co so K6", co(6, false, "khong", "deu", false)], ["+vung mua", co(6, true, "khong", "deu", false)], ["+bo khi TT yeu", co(6, false, "bo", "deu", false)], ["+giam30 khi TT yeu", co(6, false, "giam30", "deu", false)], ["+rui ro 1%", co(6, false, "khong", "rui_ro", false)], ["+d5&pos", co(6, false, "khong", "deu", true)], ["tat ca: vung+bo+rui_ro", co(6, true, "bo", "rui_ro", false)], ["K3 co so", co(3, false, "khong", "deu", false)]]) console.log(m.padEnd(26), in1(x));

// ---- DO NHAY NGUONG d5 / pos (K6, bo khi TT yeu): ket qua co on dinh khi doi nguong khong?
console.log("\nDo nhay nguong loc chat luong (K6, TT:bo, chia deu) -- CAGR/sut theo 3 giai doan:");
const chay = (K, loc, trongSo = () => 1) => [0, 1, 2].map((k) => { const idx = ds.map((t, i) => (gd(t) === k ? i : -1)).filter((i) => i >= 0); return danhMucNhieuLan(idx.map((i) => kqs[i]), idx.map((i) => ds[i]), K, 20, { loc, trongSo }); });
const ra1 = (ra) => ra.map((r) => `${f(r.cagr, 1).padStart(6)}%/${f(r.sut, 0).padStart(2)}% (n${f(r.lay, 0)})`).join(" | ");
for (const d5 of [-99, 0, 1, 2]) for (const pos of [0, 0.4, 0.6, 0.8]) console.log(`d5>${d5 === -99 ? "bat ky" : d5 + "%"} pos>=${pos}`.padEnd(28), ra1(chay(6, (t) => !t.yeu && (d5 === -99 || t.d5 > d5) && t.pos >= pos)));
// ---- TUNG NAM: ke hoach K6 + bo khi TT yeu + d5>1% & pos>=0,6 (dung vi loc nay chon SAU khi xem ket qua -> giu y la gia thuyet)
console.log("\nTung nam (lai trung binh 1 lenh %, so lenh) cua tung lop loc, tinh tren tung lenh rieng le:");
const nam = (t) => t.ngay.slice(0, 4);
const tnam = new Map();
for (let i = 0; i < ds.length; i++) { const t = ds[i], r = kqs[i], n = nam(t); if (!tnam.has(n)) tnam.set(n, { all: [], tt: [], q: [] }); const o = tnam.get(n); o.all.push(r.ret); if (!t.yeu) o.tt.push(r.ret); if (!t.yeu && t.d5 > 1 && t.pos >= 0.6) o.q.push(r.ret); }
console.log("nam".padEnd(6), "moi lenh".padEnd(18), "TT khong yeu".padEnd(18), "TT khong yeu + d5&pos");
for (const [n, o] of [...tnam].sort()) console.log(n.padEnd(6), `${f(tb(o.all), 2).padStart(6)} (n${o.all.length})`.padEnd(18), `${f(tb(o.tt), 2).padStart(6)} (n${o.tt.length})`.padEnd(18), `${f(tb(o.q), 2).padStart(6)} (n${o.q.length})`);

// ================= VAO LENH TAI DIEM MUA (moc E cua he thong, Hieu 02/11: "lenh mua o diem mua co ma") =================
// Mua dung moc E ngay bar tin hieu (iv), ban tu iv+2 (T+2) [THUC] hoac iv+1 [LY TUONG: bo qua T+2,5]. Dac trung loc (d5, pos, thi truong yeu) lay cua phien TRUOC iv de khong dung thong tin dong cua ngay tin hieu
// (tin hieu chi xac nhan luc dong cua nen: lenh cho mua o moc se khop ca nhung ngay dong cua khong du dieu kien -> day la phan KHONG co trong backtest nay, nen ket qua o day la can tren).
console.log("\n=== VAO TAI DIEM MUA (moc E), dac trung loc dung du lieu phien truoc ===");
const dsM = [], kqM = { thuc: [], lt: [] };
for (const t of ds) {
  const i = chiSo.get(t.ngay);
  if (i == null || i < 6) continue;
  t.d5m = (vc[i - 1] / vc[i - 6] - 1) * 100;
  t.yeuM = canBang.bot[i - 1] != null && vc[i - 1] < canBang.bot[i - 1];
  let mn = Infinity, mx = -Infinity;
  for (let k = t.iv - 120; k <= t.iv - 1; k++) { mn = Math.min(mn, t.low[k]); mx = Math.max(mx, t.high[k]); }
  t.posM = (t.close[t.iv - 1] - mn) / (mx - mn);
  const a = mp(t, { ...HT, E: t.E, vao: t.iv, banTu: t.iv + 2 });
  const b = mp(t, { ...HT, E: t.E, vao: t.iv, banTu: t.iv + 1 });
  if (!a || !b) continue;
  dsM.push(t); kqM.thuc.push(a); kqM.lt.push(b);
}
const chayM = (kk, K, loc) => [0, 1, 2].map((k) => { const idx = dsM.map((t, i) => (gd(t) === k ? i : -1)).filter((i) => i >= 0); return danhMucNhieuLan(idx.map((i) => kk[i]), idx.map((i) => dsM[i]), K, 20, { loc }); });
const CAC = [["co so K6", 6, () => true], ["+bo khi TT yeu", 6, (t) => !t.yeuM], ["+d5&pos (phien truoc)", 6, (t) => t.d5m > 1 && t.posM >= 0.6], ["+bo khi TT yeu + d5&pos", 6, (t) => !t.yeuM && t.d5m > 1 && t.posM >= 0.6], ["K4 bo TT yeu + d5&pos", 4, (t) => !t.yeuM && t.d5m > 1 && t.posM >= 0.6]];
for (const [ten2, kk] of [["BAN TU T+2 (thuc)", kqM.thuc], ["BAN TU T+1 (ly tuong)", kqM.lt]]) {
  console.log(`-- ${ten2}: lai TB 1 lenh ${f(tb(kk.map((r) => r.ret)))}% / n ${kk.length}`);
  for (const [m, K, loc] of CAC) console.log(m.padEnd(30), ra1(chayM(kk, K, loc)));
}

// ---- Gia vao = moc + x% (x do tu bang tin_hieu_xuat_hien tren web: gia luc tin hieu hien TB moc +0,61% (lenh goc, 150 tin hieu 27/9-2/11), dong cua ngay tin hieu moc +1,18%); chan tren = cao nhat bar tin hieu.
console.log("\n=== GIA VAO = MOC + x% (ban tu T+2) ===");
for (const x of [0.6, 1.2]) {
  const kk = [], dd = [];
  for (const t of dsM) {
    const Ev = Math.min(t.E * (1 + x / 100), t.high[t.iv]);
    const r = mp(t, { ...HT, E: Ev, vao: t.iv, banTu: t.iv + 2 });
    if (r) { kk.push(r); dd.push(t); }
  }
  const chayX = (K, loc) => [0, 1, 2].map((k) => { const idx = dd.map((t, i) => (gd(t) === k ? i : -1)).filter((i) => i >= 0); return danhMucNhieuLan(idx.map((i) => kk[i]), idx.map((i) => dd[i]), K, 20, { loc }); });
  console.log(`-- moc +${x}%: lai TB 1 lenh ${f(tb(kk.map((r) => r.ret)))}% / n ${kk.length}`);
  for (const [m, K, loc] of CAC.slice(0, 4)) console.log(m.padEnd(30), ra1(chayX(K, loc)));
}

// ================= NGANH: co nen loc / xep hang theo suc manh nganh khong? (Hieu 02/11: "co ke hoach ve nganh khong, hay ngau nhien") =================
// Chi so nganh = TB cong loi suat ngay cac ma cung nganh (nganh_map.json, nen_dai.json), RS60 = tang nganh 60 phien - tang VN-Index 60 phien tinh den phien TRUOC ngay tin hieu. Nganh co >= 5 ma.
console.log("\n=== NGANH ===");
const nganhMap = docJson("nganh_map.json");
const nenDai = docJson("nen_dai.json");
const homNay = vni.map((b) => b.t);
const theoNganh = new Map();
for (const [ma, bars] of Object.entries(nenDai)) { const ng = nganhMap[ma]; if (!ng) continue; if (!theoNganh.has(ng)) theoNganh.set(ng, []); theoNganh.get(ng).push(bars); }
const chiSoNganh = new Map();
for (const [ng, dsBars] of theoNganh) {
  if (dsBars.length < 5) continue;
  const maps = dsBars.map((bars) => new Map(bars.map((b) => [b.t, b.c])));
  const idx = [100];
  for (let i = 1; i < homNay.length; i++) {
    let s = 0, n = 0;
    for (const m of maps) { const a = m.get(homNay[i - 1]), b = m.get(homNay[i]); if (a > 0 && b > 0) { s += b / a - 1; n++; } }
    idx.push(idx[i - 1] * (1 + (n >= 3 ? s / n : 0)));
  }
  chiSoNganh.set(ng, idx);
}
const rs60 = (ng, i) => { const x = chiSoNganh.get(ng); return x && i >= 61 ? (x[i] / x[i - 60] - 1) * 100 - (vc[i] / vc[i - 60] - 1) * 100 : null; };
for (const t of dsM) {
  const i = chiSo.get(t.ngay) - 1; // phien truoc
  t.ng = nganhMap[t.ma] ?? null;
  t.rsN = t.ng ? rs60(t.ng, i) : null;
  // hang cua nganh trong cac nganh cung ngay
  const tatCa2 = [...chiSoNganh.keys()].map((g) => rs60(g, i)).filter((x) => x != null).sort((a, b) => b - a);
  t.hangN = t.rsN != null && tatCa2.length ? tatCa2.findIndex((x) => x <= t.rsN) / tatCa2.length : null; // 0 = nganh manh nhat
}
console.log(`lenh co du lieu nganh: ${dsM.filter((t) => t.rsN != null).length}/${dsM.length}`);
const PHI = [["mua dung moc", 0], ["moc +0,6% (thuc te)", 0.6]];
const CAC2 = [
  ["K6 khong loc", 6, () => true],
  ["K6 nganh manh hon VNI (RS60>0)", 6, (t) => t.rsN > 0],
  ["K6 nganh top 1/3", 6, (t) => t.hangN != null && t.hangN <= 1 / 3],
  ["K6 d5&pos", 6, (t) => t.d5m > 1 && t.posM >= 0.6],
  ["K6 d5&pos + nganh RS60>0", 6, (t) => t.d5m > 1 && t.posM >= 0.6 && t.rsN > 0],
  ["K6 d5&pos + nganh top 1/3", 6, (t) => t.d5m > 1 && t.posM >= 0.6 && t.hangN != null && t.hangN <= 1 / 3],
  ["K6 d5&pos, xep hang theo RS nganh", 6, (t) => t.d5m > 1 && t.posM >= 0.6, (t) => t.rsN ?? -99],
  ["K6 khong loc, xep hang theo RS nganh", 6, () => true, (t) => t.rsN ?? -99],
];
for (const [tenP, x] of PHI) {
  const kk = [], dd = [];
  for (const t of dsM) { const Ev = Math.min(t.E * (1 + x / 100), t.high[t.iv]); const r = mp(t, { ...HT, E: Ev, vao: t.iv, banTu: t.iv + 2 }); if (r) { kk.push(r); dd.push(t); } }
  console.log(`-- ${tenP}`);
  for (const [m, K, loc, xh] of CAC2) {
    const ra = [0, 1, 2].map((k) => { const idx = dd.map((t, i) => (gd(t) === k ? i : -1)).filter((i) => i >= 0); return danhMucNhieuLan(idx.map((i) => kk[i]), idx.map((i) => dd[i]), K, 20, { loc, xepHang: xh }); });
    console.log(m.padEnd(38), ra1(ra));
  }
}
// lai TB 1 lenh theo nhom nganh manh / yeu (moc +0,6%, khong gioi han K)
{
  const g = { manh: [], yeu: [] };
  for (const t of dsM) { if (t.rsN == null) continue; const r = mp(t, { ...HT, E: Math.min(t.E * 1.006, t.high[t.iv]), vao: t.iv, banTu: t.iv + 2 }); if (r) (t.rsN > 0 ? g.manh : g.yeu).push(r.ret); }
  console.log(`lai TB 1 lenh (moc +0,6%): nganh RS60>0 ${f(tb(g.manh))}% (n${g.manh.length}) | nganh RS60<=0 ${f(tb(g.yeu))}% (n${g.yeu.length})`);
}
