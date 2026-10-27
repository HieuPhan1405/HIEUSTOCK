// QUA DEM vs TRONG NGAY theo bien dong phien truoc (27/10/2026): voi co phieu thanh khoan >= 5 ty (2022-04 -> nay), phien i tang/giam bao nhieu thi mo cua i+1 chenh bao nhieu (qua dem) va tu mo cua den dong cua i+1 (trong ngay)?
// Y nghia cho nguoi DA CO HANG (T+ ban): ban luc mo cua hay dong cua phien sau? Khong tinh phi (chi so sanh 2 chan).
// Chay: node engine/dich-vu/nghienCuuDemVaTrongNgay.mjs
import { readFileSync } from "node:fs";
import { docNenMoiNhat } from "./docNenMoiNhat.mjs";

const nen = docNenMoiNhat();
const TU = process.env.TU ?? "2022-04-01"; // dat TU=2026-01-01 de chi xem tu 2026
const nhom = [["<= -5%", -1e9, -5], ["-5..-2%", -5, -2], ["-2..0%", -2, 0], ["0..2%", 0, 2], ["2..5%", 2, 5], [">= 5%", 5, 1e9]];
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const p = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");
const goc = nhom.map(() => []);
const gocKL = nhom.map(() => []); // co them KL >= 1,5x
for (const ds of Object.values(nen)) {
  for (let i = 25; i < ds.length - 1; i++) {
    if (ds[i].t < TU) continue;
    let gt = 0, kl = 0;
    for (let j = i - 19; j <= i; j++) { gt += ds[j].c * ds[j].v; kl += ds[j].v; }
    if (gt / 20 / 1e6 < 5) continue;
    const chg = (ds[i].c / ds[i - 1].c - 1) * 100;
    const dem = (ds[i + 1].o / ds[i].c - 1) * 100, tn = (ds[i + 1].c / ds[i + 1].o - 1) * 100;
    nhom.forEach(([, lo, hi], k) => {
      if (chg >= lo && chg < hi) {
        goc[k].push({ dem, tn, t: ds[i].t });
        if (ds[i].v >= 1.5 * (kl / 20)) gocKL[k].push({ dem, tn, t: ds[i].t });
      }
    });
  }
}
const inBang = (ten, g) => {
  console.log(ten);
  nhom.forEach(([ten2], k) => {
    const a = g[k];
    const nam = ["2022", "2023", "2024", "2025", "2026"].map((y) => { const b = a.filter((e) => e.t.startsWith(y)); return b.length >= 30 ? p(tb(b.map((e) => e.dem)), 1) + "/" + p(tb(b.map((e) => e.tn)), 1) : "·"; }).join("  ");
    console.log("  phien i", ten2.padEnd(9), "n", String(a.length).padStart(7), "| qua dem (dong cua i -> mo cua i+1)", p(tb(a.map((e) => e.dem))).padStart(6), "| trong ngay i+1 (mo -> dong)", p(tb(a.map((e) => e.tn))).padStart(6), "| theo nam qua dem/trong ngay:", nam);
  });
};
inBang("TAT CA phien:", goc);
inBang("Phien i co khoi luong >= 1,5x TB20:", gocKL);
