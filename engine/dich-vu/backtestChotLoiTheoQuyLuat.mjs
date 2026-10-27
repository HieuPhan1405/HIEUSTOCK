// CHOT LOI THEO QUY LUAT thay cho moc % co dinh (Hieu 27/10/2026: "vay dung moc co dinh ko theo quy luat nao a?"): so bac thang % co dinh voi
//   R  = boi so khoang cach cat lo (E - S) cua engine (thuong / rui ro co dinh), ATR = boi so ATR14 luc tin hieu (theo bien dong tung ma), TP cau truc cua engine (TP1/TP2 tu dinh 60 phien / may / duong can bang / dinh 252 phien, toi thieu +5% / +10% / +15%).
// Phan con lai: Tenkan ban 1/2 + Kijun not (+ BAN, cat lo S, hoa von sau TP2 engine). Lenh Mua thuong, nen_dai.json, phi 0,4%. Cuoi cung: chia theo BIEN DONG (ATR/gia luc vao, 3 nhom) xem moc % co dinh hay moc theo ATR hop ly hon.
// Chay: node engine/dich-vu/backtestChotLoiTheoQuyLuat.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, soMa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
const pctCatLo = lenh.map((t) => ((t.E - t.S) / t.E) * 100).sort((a, b) => a - b);
const atrPct = lenh.map((t) => (t.atr[t.iv] / t.E) * 100).sort((a, b) => a - b);
const md = (a) => a[a.length >> 1];
console.log(`${lenh.length} lenh Mua thuong (${soMa} ma). Khoang cach cat lo (1R): trung vi ${f(md(pctCatLo))}% (10%-90%: ${f(pctCatLo[Math.floor(pctCatLo.length * 0.1)])}..${f(pctCatLo[Math.floor(pctCatLo.length * 0.9)])}%); ATR14: trung vi ${f(md(atrPct))}% gia (10%-90%: ${f(atrPct[Math.floor(atrPct.length * 0.1)])}..${f(atrPct[Math.floor(atrPct.length * 0.9)])}%)`);
console.log(`TP1 engine: trung vi +${f(md(lenh.map((t) => (t.tp[0] / t.E - 1) * 100).sort((a, b) => a - b)))}%, TP2 engine: +${f(md(lenh.map((t) => (t.tp[1] / t.E - 1) * 100).sort((a, b) => a - b)))}%`);
const R = (...a) => a.map(([w, r]) => ({ w, r }));
const A = (...a) => a.map(([w, atr]) => ({ w, atr }));
const P = (...a) => a.map(([w, pct]) => ({ w, pct }));
const CACH = [
  ["TK3 hien tai: 30% TP1 + 30% TP2 (cau truc engine)", { moc: HAI_TP }],
  ["Engine TP1/TP2 40% + 40%", { moc: [{ w: 0.4, i: 0 }, { w: 0.4, i: 1 }] }],
  ["CO DINH 40% @+5%, 40% @+10%", { moc: P([0.4, 5], [0.4, 10]) }],
  ["R:   40% @1R, 40% @2R", { moc: R([0.4, 1], [0.4, 2]) }],
  ["R:   40% @0,75R, 40% @1,5R", { moc: R([0.4, 0.75], [0.4, 1.5]) }],
  ["R:   40% @1,5R, 40% @3R", { moc: R([0.4, 1.5], [0.4, 3]) }],
  ["ATR: 40% @1 ATR, 40% @2 ATR", { moc: A([0.4, 1], [0.4, 2]) }],
  ["ATR: 40% @1,5 ATR, 40% @3 ATR", { moc: A([0.4, 1.5], [0.4, 3]) }],
  ["ATR: 40% @2 ATR, 40% @4 ATR", { moc: A([0.4, 2], [0.4, 4]) }],
  ["Engine TP1/TP2 30/30 + 50% con lai @+5% (co dinh)", { moc: HAI_TP, mau: () => true, mauNguong: 5, mauTyLe: 0.5 }],
  ["Engine TP1/TP2 30/30 + 50% con lai @+1R", { moc: [...HAI_TP, { w: 0.2, r: 1 }] }],
  ["Engine TP1/TP2 30/30 + 20% @+1,5 ATR", { moc: [...HAI_TP, { w: 0.2, atr: 1.5 }] }],
];
const QUY_UOC = [
  ["THUC TE", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })],
  ["LY TUONG", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })],
];
const TAP = [["Toan bo", () => true], ["Tu 2022.5", (t) => t.ngay >= "2022-05-01"], ["Rieng 2026", (t) => t.ngay >= "2026-01-01"]];
const SO_LAN = 20;
const co = { baoVe: true, theoSell: true, tk: "nua" };
for (const [tenQU, cfgVao] of QUY_UOC) {
  for (const [tenTap, loc] of TAP) {
    const ds = lenh.filter(loc);
    console.log(`\n=========== ${tenQU} | ${tenTap}: n = ${ds.length} ===========`);
    console.log("Mau chot loi".padEnd(54), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "| DM K=10 lai/nam, sut | DM K=20");
    for (const [ten, c] of CACH) {
      const kqs = ds.map((t) => mp(t, { ...co, ...c, ...cfgVao(t) }));
      const k = thongKe(kqs.filter(Boolean));
      const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {});
      const d20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, {});
      console.log(ten.padEnd(54), f(k.tb).padStart(7), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), `| ${f(d10.cagr, 1).padStart(6)}%/${f(d10.sut, 0).padStart(2)}% | ${f(d20.cagr, 1).padStart(6)}%/${f(d20.sut, 0)}%`);
    }
  }
}

// ---------- THEO BIEN DONG: co dinh % hay theo ATR hop ly hon? ----------
console.log("\n=========== THEO BIEN DONG (ATR14 / gia luc vao, chia 3 nhom bang nhau): lai TB lenh, quy uoc LY TUONG va THUC TE, toan bo giai doan ===========");
const sx = [...lenh].sort((a, b) => a.atr[a.iv] / a.E - b.atr[b.iv] / b.E);
const nhom = [sx.slice(0, Math.floor(sx.length / 3)), sx.slice(Math.floor(sx.length / 3), Math.floor((2 * sx.length) / 3)), sx.slice(Math.floor((2 * sx.length) / 3))];
for (const [tenQU, cfgVao] of QUY_UOC) {
  console.log(`\n${tenQU}`);
  console.log("Nhom bien dong (ATR%)".padEnd(28), ["TK3 engine", "CO DINH +5/+10", "ATR 1,5/3", "R 1/2", "Engine+50%@+5%"].map((x) => x.padStart(16)).join(""));
  const cac = [HAI_TP, P([0.4, 5], [0.4, 10]), A([0.4, 1.5], [0.4, 3]), R([0.4, 1], [0.4, 2]), null];
  nhom.forEach((ds, k) => {
    const lo = (ds[0].atr[ds[0].iv] / ds[0].E) * 100, hi = (ds.at(-1).atr[ds.at(-1).iv] / ds.at(-1).E) * 100;
    const cells = cac.map((m) => {
      const cfg = (t) => ({ ...co, ...(m ? { moc: m } : { moc: HAI_TP, mau: () => true, mauNguong: 5, mauTyLe: 0.5 }), ...cfgVao(t) });
      const r = ds.map((t) => mp(t, cfg(t))).filter(Boolean).map((x) => x.ret);
      return f(tb(r)).padStart(16);
    });
    console.log(`${["thap", "vua", "cao"][k]} (${f(lo, 1)}-${f(hi, 1)}%)`.padEnd(28), cells.join(""));
  });
}
