// HMM TUNG MA DE VAO LENH / CHOT LOI (Hieu 27/10/2026: "xac suat cua tung ma, su dung de chot loi xem, hay vao lenh xem"). HMM Gauss 2 / 3 trang thai tren loi suat ngay cua MA (hmm.mjs; fit walk-forward, cua so 750 phien, toi thieu 300, refit moi 126 phien; xac suat LOC tai dong cua, KHONG nhin truoc).
// Trang thai xep theo ky vong loi suat: K=2: S1 = tang; K=3: S2 = tang, S0 = xau. Er = ky vong loi suat % phien ke tiep = sum_k P(trang thai k phien ke) x mu_k.
//  (E) VAO LENH: loc lenh Mua thuong theo P(tang) tai ngay tin hieu (nguong 0,3/0,5/0,7/0,9, Er > 0, ...) + bang theo nhom (ngu phan vi) cua P(tang): lai TB, MFE, P(MFE >= 10%).
//  (X) CHOT LOI: khi dang lai >= nguong va xac suat tang cua ma TUT (P(tang) < x, P(xau) > y, Er < 0) thi ban het / 1/2 phan con lai tai dong cua; con lai theo cach ra co so (HT = 30/30 + BAN, KIJ, TK3 = 30/30 + Tenkan 1/2 + Kijun not; da sua loi ban > 100%).
// Quy uoc THUC TE (mua mo cua phien sau, ban tu T+2) va LY TUONG; phi 0,4%. Cache HMM: engine/output/hmm_ma.json. Chay: node engine/dich-vu/nghienCuuHMMChotLoi.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";
import { locWalkForward } from "./hmm.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
const rets = (c) => c.map((v, i) => (i === 0 ? 0 : Math.log(v / c[i - 1]) * 100));
const r3 = (a) => (a == null ? null : a.map((v) => Math.round(v * 1000) / 1000));

const FILE = fileURLToPath(new URL("../output/hmm_ma.json", import.meta.url));
let H = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf-8")) : null;
if (!H) {
  H = { 2: {}, 3: {} };
  const dsMa = [...new Set(lenh.map((t) => t.ma))];
  for (const K of [2, 3]) {
    for (const ma of dsMa) {
      const bars = cache[ma];
      if (!bars || bars.length < 400) continue;
      const w = locWalkForward(rets(bars.map((b) => b.c)), K, { minTrain: 300, refitEvery: 126, win: 750 });
      H[K][ma] = { P: w.P.map(r3), Er: w.Er.map((v) => (v == null ? null : Math.round(v * 1000) / 1000)) };
    }
  }
  writeFileSync(FILE, JSON.stringify(H));
}
const P = (K, t, i) => H[K][t.ma]?.P[i] ?? null;
const Er = (K, t, i) => H[K][t.ma]?.Er[i] ?? null;
console.log(`${lenh.length} lenh Mua thuong; HMM co cho ${Object.keys(H[2]).length} ma`);
for (const t of lenh) {
  const i = t.iv;
  t.p2 = P(2, t, i); t.p3 = P(3, t, i); t.er2 = Er(2, t, i); t.er3 = Er(3, t, i);
  let mx = t.E;
  for (let j = t.iv + 1; j < Math.min(t.n, t.iv + 21); j++) { if (t.low[j] <= t.S) break; mx = Math.max(mx, t.high[j]); }
  t.mfe = (mx / t.E - 1) * 100;
}

const CACH = [
  ["HT  (30/30 + BAN)", { moc: HAI_TP, baoVe: true, theoSell: true }],
  ["KIJ (thung Kijun ban het)", { moc: [], baoVe: false, theoSell: false, tk: "kijun" }],
  ["TK3 (30/30 + Tenkan 1/2 + Kijun not)", { moc: HAI_TP, baoVe: true, theoSell: true, tk: "nua" }],
];
const QUY_UOC = [["THUC TE", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })], ["LY TUONG", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })]];
const SO_LAN = 20;
const arg = (p) => p.indexOf(Math.max(...p));
const dong = (ten, ds, kqs, tenW) => {
  const k = thongKe(kqs);
  const ky = [[], [], []];
  ds.forEach((t, i) => ky[kyOf(t.ngay)].push(kqs[i].ret));
  const r26 = ds.map((t, i) => (t.ngay >= "2026-01-01" ? kqs[i].ret : null)).filter((x) => x != null);
  const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {}), d20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, {});
  console.log(ten.padEnd(50), String(k.n).padStart(5), f(k.tb).padStart(7), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), "|", ky.map((a) => (a.length ? f(tb(a)) : "-").padStart(7)).join(" "), "|", `${String(r26.length).padStart(3)} ${f(tb(r26)).padStart(6)}`, `| ${f(d10.cagr, 1).padStart(5)}%/${f(d10.sut, 0).padStart(2)}% ${f(d20.cagr, 1).padStart(5)}%/${f(d20.sut, 0)}%`);
};
const TIEU_DE = ["".padEnd(50), "n".padStart(5), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "| giai doan (<2019, 19-22.4, 22.5+)", "| 2026 (n, lai) | DM K=10 / K=20"];

// ---------- (E) vao lenh ----------
const LOC = [
  ["Khong loc", () => true],
  ...[0.3, 0.5, 0.7, 0.9].map((x) => [`MA-HMM2: P(tang) > ${x}`, (t) => t.p2 && t.p2[1] > x]),
  ["MA-HMM2: P(tang) <= 0,5 (nguoc)", (t) => t.p2 && t.p2[1] <= 0.5],
  ["MA-HMM2: ky vong phien ke Er > 0", (t) => t.er2 != null && t.er2 > 0],
  ["MA-HMM3: o trang thai tang (S2)", (t) => t.p3 && arg(t.p3) === 2],
  ["MA-HMM3: P(S2) > 0,5", (t) => t.p3 && t.p3[2] > 0.5],
  ["MA-HMM3: P(xau S0) < 0,2", (t) => t.p3 && t.p3[0] < 0.2],
  ["MA-HMM3: o trang thai xau (S0) (nguoc)", (t) => t.p3 && arg(t.p3) === 0],
  ["MA-HMM3: Er > 0", (t) => t.er3 != null && t.er3 > 0],
];
for (const [tenQU, cvao] of QUY_UOC) {
  for (const [tenCach, cfg] of CACH) {
    const kq = lenh.map((t) => mp(t, { ...cfg, ...cvao(t) }));
    console.log(`\n=========== (E) VAO LENH | ${tenQU} | ${tenCach} ===========`);
    console.log(...TIEU_DE);
    for (const [ten, fn] of LOC) {
      const gi = lenh.map((_, i) => i).filter((i) => kq[i] && fn(lenh[i]));
      dong(ten, gi.map((i) => lenh[i]), gi.map((i) => kq[i]));
    }
    if (tenQU === "THUC TE" && tenCach.startsWith("HT")) {
      console.log("\n  Theo ngu phan vi P(tang) cua ma (HMM2) tai ngay tin hieu: n | lai TB HT thuc te | MFE TB | P(MFE>=10%) | 22.5+ | 2026");
      const ok = lenh.map((_, i) => i).filter((i) => kq[i] && lenh[i].p2);
      ok.sort((a, b) => lenh[a].p2[1] - lenh[b].p2[1]);
      const q = Math.floor(ok.length / 5);
      for (let g = 0; g < 5; g++) {
        const idx = ok.slice(g * q, g === 4 ? ok.length : (g + 1) * q);
        const lo = lenh[idx[0]].p2[1], hi = lenh[idx[idx.length - 1]].p2[1];
        console.log(`   nhom ${g + 1} (P ${f(lo, 2)}..${f(hi, 2)}) n ${String(idx.length).padStart(4)} | ${f(tb(idx.map((i) => kq[i].ret))).padStart(6)}% | MFE ${f(tb(idx.map((i) => lenh[i].mfe))).padStart(5)}% | ${f(100 * idx.filter((i) => lenh[i].mfe >= 10).length / idx.length, 0).padStart(2)}% | ${f(tb(idx.filter((i) => lenh[i].ngay >= "2022-05-01").map((i) => kq[i].ret))).padStart(6)} | ${f(tb(idx.filter((i) => lenh[i].ngay >= "2026-01-01").map((i) => kq[i].ret))).padStart(6)}`);
      }
    }
  }
}

// ---------- (X) chot loi ----------
const stkP = (K, t, i) => P(K, t, i);
const MAU = [
  ["Khong mau (co so)", null, 0, 1],
  ...[0.5, 0.3, 0.15].flatMap((x) => [0, 3].map((ng) => [`HMM2: P(tang) < ${x}, dang lai >= ${ng}%`, (t, i) => { const p = stkP(2, t, i); return p && p[1] < x; }, ng, 1])),
  ["HMM2: P(tang) < 0,3, lai >= 3%, ban 1/2 con lai", (t, i) => { const p = stkP(2, t, i); return p && p[1] < 0.3; }, 3, 0.5],
  ["HMM3: P(xau S0) > 0,5, lai >= 3%", (t, i) => { const p = stkP(3, t, i); return p && p[0] > 0.5; }, 3, 1],
  ["HMM3: o trang thai xau (S0), lai >= 3%", (t, i) => { const p = stkP(3, t, i); return p && arg(p) === 0; }, 3, 1],
  ["HMM3: P(tang S2) < 0,2, lai >= 3%", (t, i) => { const p = stkP(3, t, i); return p && p[2] < 0.2; }, 3, 1],
  ["HMM2: Er phien ke < 0, lai >= 3%", (t, i) => { const e = Er(2, t, i); return e != null && e < 0; }, 3, 1],
  ["HMM2: Er phien ke < 0, lai >= 5%", (t, i) => { const e = Er(2, t, i); return e != null && e < 0; }, 5, 1],
  ["HMM3: Er phien ke < 0, lai >= 3%", (t, i) => { const e = Er(3, t, i); return e != null && e < 0; }, 3, 1],
];
for (const [tenQU, cvao] of QUY_UOC) {
  for (const [tenCach, cfg] of CACH) {
    console.log(`\n=========== (X) CHOT LOI | ${tenQU} | co so ${tenCach} ===========`);
    console.log(...TIEU_DE);
    for (const [ten, fn, ng, tyle] of MAU) {
      const c = { ...cfg, ...(fn ? { mau: fn, mauNguong: ng, mauTyLe: tyle } : {}) };
      const kq = lenh.map((t) => mp(t, { ...c, ...cvao(t) }));
      const gi = lenh.map((_, i) => i).filter((i) => kq[i]);
      dong(ten, gi.map((i) => lenh[i]), gi.map((i) => kq[i]));
    }
  }
}
