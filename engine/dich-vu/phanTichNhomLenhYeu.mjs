// PHAN TICH NHOM LENH YEU CUA DIEM VAO (Hieu 27/10/2026: "test nhom lenh yeu"). Lenh Mua thuong cua engine (4.436), cach ra HT (30/30 + BAN) va KIJ (thung Kijun ban het), quy uoc THUC TE (mua mo cua phien sau, ban tu T+2), phi 0,4%.
// Moi lenh gan ~30 dac trung CO TAI DONG CUA NGAY TIN HIEU (khong nhin truoc): chat luong tin hieu (diem, RS, KL tuong doi, ADX, GTGD), rui ro (cat lo %, ATR%, TP1/cat lo), vi tri gia (so voi Kijun, dinh may, bien do 120 phien, tang 5/20 phien, than nen),
// thi truong (d5 VN-Index, do rong % ma > SMA50, VN-Index so voi Kijun), nganh, kieu vuot (may / can bang dai han / ca hai), thu trong tuan, thang.
// (1) MO TA: chia ngu phan vi (so) / theo nhom (chu): lai TB cua HT va KIJ tung nhom + nhom yeu nhat theo 3 giai doan va 2026.
// (2) NHOM YEU CO TONG QUAT HOA KHONG? Chi dung TRAIN (< 2022-05-01) de tim nhom yeu (n >= 100, lai TB <= -0,5% o CA 2 giai doan <2019 va 2019-22.4; so: nguong cat lay tu phan vi TRAIN), roi xem cung nhom do tren TEST (>= 2022-05) co yeu hon lenh con lai khong.
//     Tong hop: bao nhieu nhom duoc co, trong do bao nhieu nhom van yeu tren TEST, chenh lech TB; va bo loc gop (bo MOI nhom yeu cua TRAIN) -> hieu qua tren TEST (bootstrap theo ngay).
// Chay: node engine/dich-vu/phanTichNhomLenhYeu.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";
import { nganhCuaMa } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, thiTruong } = chayEngine({ cache, vni });
const lenhGoc = tatCa.filter((t) => t.loai === 1);
const chiSo = new Map(vni.map((b, i) => [b.t, i]));
const vc = vni.map((b) => b.c);
const HT = { moc: HAI_TP, baoVe: true, theoSell: true };
const KIJ = { moc: [], baoVe: false, theoSell: false, tk: "kijun" };
const D = [];
for (const t of lenhGoc) {
  const i = chiSo.get(t.ngay);
  const a = mp(t, { ...HT, vao: t.iv + 1, banTu: t.iv + 3 }), b = mp(t, { ...KIJ, vao: t.iv + 1, banTu: t.iv + 3 });
  if (!a || !b || i == null || i < 20) continue;
  const { close, open, high, low, kijun, tenkan, atr, cloudTop, cbTop, iv, E, S, tp } = t;
  const tt = thiTruong(t.ngay);
  let mn = Infinity, mx = -Infinity;
  for (let k = Math.max(0, iv - 119); k <= iv; k++) { mn = Math.min(mn, low[k]); mx = Math.max(mx, high[k]); }
  const vuotMay = cloudTop[iv] != null && close[iv] > cloudTop[iv] && cloudTop[iv - 1] != null && close[iv - 1] <= cloudTop[iv - 1];
  const vuotCB = cbTop[iv] != null && close[iv] > cbTop[iv] && cbTop[iv - 1] != null && close[iv - 1] <= cbTop[iv - 1];
  const dt = t.dacTrung;
  const so = {
    "Diem xep hang (diem_rank)": dt["Diem xep hang engine (diem_rank)"],
    "Diem tin cay": dt["Diem tin cay (diem_confidence)"],
    "Tong diem luc vao": dt["Tong diem luc vao (diem)"],
    "ADX": dt["ADX"],
    "RS 20 phien so voi VN-Index": dt["Suc manh so voi VN-Index (RS 20 phien)"],
    "Khoi luong tuong doi (RelVol)": dt["Khoi luong tuong doi (RelVol)"],
    "GTGD TB20 (ty/phien)": dt["GTGD TB20 (ty/phien)"],
    "Cat lo % (E-S)/E": ((E - S) / E) * 100,
    "ATR14 % gia": (atr[iv] / close[iv]) * 100,
    "TP1 / cat lo": dt["TP1 / cat lo (ty le thuong/rui ro)"],
    "TP1 % so voi gia vao": (tp[0] / E - 1) * 100,
    "Tang 5 phien %": (close[iv] / close[iv - 5] - 1) * 100,
    "Tang 20 phien %": dt["Tang 20 phien truoc do (dong luc)"],
    "Gia so voi Kijun %": dt["Gia so voi Kijun (% tren Kijun)"],
    "Gia so voi dinh may %": cloudTop[iv] > 0 ? (close[iv] / cloudTop[iv] - 1) * 100 : null,
    "Vi tri trong bien do 120 phien (0-1)": mx > mn ? (close[iv] - mn) / (mx - mn) : null,
    "Than nen % (close/open)": (close[iv] / open[iv] - 1) * 100,
    "Vi tri dong cua trong nen (0-1)": high[iv] > low[iv] ? (close[iv] - low[iv]) / (high[iv] - low[iv]) : null,
    "Khoang trong gap mo cua %": (open[iv] / close[iv - 1] - 1) * 100,
    "VN-Index d5 %": (vc[i] / vc[i - 5] - 1) * 100,
    "Do rong % ma > SMA50": tt?.doRong50 ?? null,
    "VN-Index so voi Kijun %": tt ? (tt.vni / tt.kijun - 1) * 100 : null,
  };
  const chu = {
    "Nganh": nganhCuaMa(t.ma) ?? "Khac",
    "Kieu vuot": vuotMay && vuotCB ? "may + can bang" : vuotMay ? "may" : vuotCB ? "can bang dai han" : "khac",
    "Thu trong tuan": ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][new Date(t.ngay).getUTCDay()],
    "Thang": t.ngay.slice(5, 7),
  };
  D.push({ t, ngay: t.ngay, ky: kyOf(t.ngay), ret: a.ret, retK: b.ret, so, chu });
}
console.log(`${D.length} lenh | HT thuc te lai TB ${f(tb(D.map((x) => x.ret)))}% | KIJ ${f(tb(D.map((x) => x.retK)))}%`);
const tbF = (a, k = "ret") => tb(a.map((x) => x[k]));
const phanViTu = (vals, q) => { const s = [...vals].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const KEY_SO = Object.keys(D[0].so), KEY_CHU = Object.keys(D[0].chu);

// ---------- (1) mo ta ----------
console.log("\n===== (1) MO TA: lai TB (HT thuc te | KIJ thuc te) theo ngu phan vi Q1 (thap) .. Q5 (cao) =====");
console.log("Dac trung".padEnd(38), "HT: Q1     Q2     Q3     Q4     Q5".padEnd(36), "| KIJ: Q1    Q2     Q3     Q4     Q5");
for (const k of KEY_SO) {
  const ok = D.filter((x) => x.so[k] != null && Number.isFinite(x.so[k]));
  const cat = [1, 2, 3, 4].map((q) => phanViTu(ok.map((x) => x.so[k]), q / 5));
  const nhom = (x) => { const v = x.so[k]; let g = 0; while (g < 4 && v >= cat[g]) g++; return g; };
  const g = [0, 1, 2, 3, 4].map((q) => ok.filter((x) => nhom(x) === q));
  console.log(k.padEnd(38), g.map((a) => f(tbF(a)).padStart(6)).join(" "), "".padEnd(4), "|", g.map((a) => f(tbF(a, "retK")).padStart(6)).join(" "));
}
for (const k of KEY_CHU) {
  const ten = [...new Set(D.map((x) => x.chu[k]))];
  const gs = ten.map((n) => ({ n, a: D.filter((x) => x.chu[k] === n) })).filter((g) => g.a.length >= 60).sort((u, v) => tbF(u.a) - tbF(v.a));
  console.log(`\n${k}: nhom (n, HT, KIJ) tu yeu den manh:`);
  console.log("  " + gs.map((g) => `${g.n} (${g.a.length}; ${f(tbF(g.a))}; ${f(tbF(g.a, "retK"))})`).join(" | "));
}

// ---------- (2) tong quat hoa: tim tren TRAIN, kiem tren TEST ----------
const MOC = "2022-05-01";
const train = D.filter((x) => x.ngay < MOC), test = D.filter((x) => x.ngay >= MOC);
console.log(`\n===== (2) NHOM YEU TIM TREN TRAIN (< ${MOC}, n ${train.length}, lai TB HT ${f(tbF(train))}) -> KIEM TREN TEST (n ${test.length}, lai TB HT ${f(tbF(test))}) =====`);
const rule = []; // { ten, fn }
for (const k of KEY_SO) {
  const ok = train.filter((x) => x.so[k] != null && Number.isFinite(x.so[k]));
  const cat = [1, 2, 3, 4].map((q) => phanViTu(ok.map((x) => x.so[k]), q / 5));
  for (let g = 0; g < 5; g++) {
    const fn = (x) => { const v = x.so[k]; if (v == null || !Number.isFinite(v)) return false; let h = 0; while (h < 4 && v >= cat[h]) h++; return h === g; };
    rule.push({ ten: `${k} Q${g + 1}`, fn });
  }
}
for (const k of KEY_CHU) for (const n of new Set(D.map((x) => x.chu[k]))) rule.push({ ten: `${k} = ${n}`, fn: (x) => x.chu[k] === n });
const co = [];
for (const r of rule) {
  const a = train.filter(r.fn);
  if (a.length < 100) continue;
  const m0 = tbF(a.filter((x) => x.ky === 0)), m1 = tbF(a.filter((x) => x.ky === 1));
  if (a.filter((x) => x.ky === 0).length < 30 || a.filter((x) => x.ky === 1).length < 30) continue;
  if (tbF(a) <= -0.5 && m0 < 0 && m1 < 0) co.push({ ...r, nTrain: a.length, mTrain: tbF(a) });
}
console.log("Nhom yeu ung vien tren TRAIN: n (train), lai TB train | TEST: n, lai TB, chenh voi lenh con lai cung TEST (HT) | KIJ test:");
let yeuTiep = 0, tongCh = 0;
for (const r of co) {
  const a = test.filter(r.fn), b = test.filter((x) => !r.fn(x));
  if (a.length < 30) { console.log(`  ${r.ten.padEnd(48)} train ${String(r.nTrain).padStart(4)} ${f(r.mTrain).padStart(6)} | test n ${a.length} (it)`); continue; }
  const ch = tbF(a) - tbF(b);
  if (ch < 0) yeuTiep++;
  tongCh += ch;
  console.log(`  ${r.ten.padEnd(48)} train ${String(r.nTrain).padStart(4)} ${f(r.mTrain).padStart(6)} | test n ${String(a.length).padStart(4)} ${f(tbF(a)).padStart(6)} chenh ${f(ch).padStart(6)} | KIJ ${f(tbF(a, "retK")).padStart(6)}`);
}
const dem = co.filter((r) => test.filter(r.fn).length >= 30).length;
console.log(`=> ${co.length} nhom yeu ung vien; ${dem} nhom du mau tren TEST; con yeu hon lenh khac tren TEST: ${yeuTiep}/${dem}; chenh TB ${f(tongCh / Math.max(dem, 1))}`);
console.log(`   (neu khong co tong quat hoa, ky vong ~50% va chenh TB ~0; tim 1 nhom trong ~${rule.length} ung vien nen co so nhom yeu gia tao tu ngau nhien)`);

// bo loc gop
const loaiGop = (x) => co.some((r) => r.fn(x));
const giuTest = test.filter((x) => !loaiGop(x)), bo = test.filter(loaiGop);
console.log(`\nBo loc gop (bo MOI nhom yeu cua TRAIN): TEST bo ${bo.length}/${test.length} lenh; lai TB bo ${f(tbF(bo))} | giu ${f(tbF(giuTest))} | tat ca ${f(tbF(test))}; KIJ: giu ${f(tbF(giuTest, "retK"))} vs tat ca ${f(tbF(test, "retK"))}`);
const rngS = (() => { let s = 777; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; })();
{
  const theoNgay = new Map();
  for (const x of test) { if (!theoNgay.has(x.ngay)) theoNgay.set(x.ngay, []); theoNgay.get(x.ngay).push(x); }
  const ng = [...theoNgay.keys()], giuSet = new Set(giuTest), res = [];
  for (let b = 0; b < 2000; b++) {
    let sA = 0, nA = 0, sG = 0, nG = 0;
    for (let k = 0; k < ng.length; k++) for (const x of theoNgay.get(ng[Math.floor(rngS() * ng.length)])) { sA += x.ret; nA++; if (giuSet.has(x)) { sG += x.ret; nG++; } }
    if (nG) res.push(sG / nG - sA / nA);
  }
  res.sort((a, b) => a - b);
  console.log(`  chenh (giu - tat ca) HT: ${f(tbF(giuTest) - tbF(test))} [CI95 ${f(res[Math.floor(0.025 * res.length)])}..${f(res[Math.floor(0.975 * res.length)])}]`);
  const ds = giuTest.map((x) => x.t), kq = giuTest.map((x) => mp(x.t, { ...HT, vao: x.t.iv + 1, banTu: x.t.iv + 3 }));
  const ds0 = test.map((x) => x.t), kq0 = test.map((x) => mp(x.t, { ...HT, vao: x.t.iv + 1, banTu: x.t.iv + 3 }));
  const a10 = danhMucNhieuLan(kq0, ds0, 10, 20, {}), g10 = danhMucNhieuLan(kq, ds, 10, 20, {});
  console.log(`  DM K=10 TEST: ${f(a10.cagr, 1)}%/${f(a10.sut, 0)}% -> ${f(g10.cagr, 1)}%/${f(g10.sut, 0)}%`);
}
