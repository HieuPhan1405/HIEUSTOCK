// NGHIEN CUU QUANT (2026-10-12): dac trung THEO NGANH tai ngay tin hieu (suc manh nganh, do rong nganh, thu hang nganh, ma so voi nganh).
// Chay: node engine/dich-vu/nghienCuuQuant_nganh.mjs <lenh.csv> <ra.csv>
import { readFileSync, writeFileSync } from "node:fs";
import { docJson } from "./backtestChung.mjs";
import { NGANH } from "../danh-sach/nganh.js";
const [vao, ra] = process.argv.slice(2);
const cache = docJson("nen_dai.json"); const vni = docJson("vnindex_dai.json");
const ngay = vni.map((b) => b.t); const D = ngay.length; const chiSo = new Map(ngay.map((t, i) => [t, i]));
const maNganh = new Map(); for (const [ten, ds] of NGANH) for (const m of ds) if (!maNganh.has(m)) maNganh.set(m, ten);
const gia = new Map(); const sma50 = new Map();
for (const [ma, nen] of Object.entries(cache)) {
  const c = new Array(D).fill(NaN); for (const b of nen) { const i = chiSo.get(b.t); if (i != null) c[i] = b.c; }
  let l = NaN; for (let i = 0; i < D; i++) { if (Number.isFinite(c[i])) l = c[i]; else if (Number.isFinite(l) && i - 1 >= 0) c[i] = NaN; } // khong dien: chi dung ngay co du lieu
  gia.set(ma, c);
  const s = new Array(D).fill(NaN); let tong = 0, dem = 0; const q = [];
  for (let i = 0; i < D; i++) { if (Number.isFinite(c[i])) { q.push(c[i]); tong += c[i]; if (q.length > 50) tong -= q.shift(); if (q.length === 50) s[i] = tong / 50; } }
  sma50.set(ma, s);
}
const ten = [...NGANH.keys()];
const chiSoNganh = {}, doRong = {}, nganhRet20 = {};
for (const tn of ten) {
  const ds = [...NGANH.get(tn)].filter((m) => gia.has(m) && maNganh.get(m) === tn);
  const idx = new Array(D).fill(NaN); idx[0] = 100; const rg = new Array(D).fill(NaN);
  for (let i = 1; i < D; i++) {
    let s = 0, n = 0, tren = 0, nb = 0;
    for (const m of ds) { const c = gia.get(m); if (Number.isFinite(c[i]) && Number.isFinite(c[i - 1])) { s += c[i] / c[i - 1] - 1; n++; } const sm = sma50.get(m)[i]; if (Number.isFinite(c[i]) && Number.isFinite(sm)) { nb++; if (c[i] > sm) tren++; } }
    idx[i] = idx[i - 1] * (1 + (n >= 3 ? Math.max(-0.12, Math.min(0.12, s / n)) : 0));
    rg[i] = nb >= 3 ? (tren / nb) * 100 : NaN;
  }
  chiSoNganh[tn] = idx; doRong[tn] = rg;
}
const ret = (a, i, k) => (i - k >= 0 && a[i - k] > 0 ? (a[i] / a[i - k] - 1) * 100 : NaN);
// thu hang suc manh 20 phien giua cac nganh moi ngay (0 = yeu nhat, 1 = manh nhat)
const hang20 = {}, hang60 = {};
for (const tn of ten) { hang20[tn] = new Array(D).fill(NaN); hang60[tn] = new Array(D).fill(NaN); }
for (let i = 60; i < D; i++) {
  for (const [k, h] of [[20, hang20], [60, hang60]]) {
    const v = ten.map((tn) => [tn, ret(chiSoNganh[tn], i, k)]).filter((x) => Number.isFinite(x[1])).sort((a, b) => a[1] - b[1]);
    v.forEach(([tn], r) => { h[tn][i] = v.length > 1 ? r / (v.length - 1) : NaN; });
  }
}
const dong = readFileSync(vao, "utf-8").trim().split("\n"); const cot = dong[0].split(",");
const iMa = cot.indexOf("ma"), iNg = cot.indexOf("ngay"), iTang20 = cot.indexOf("tang20");
const them = ["nganh", "nganhRet5", "nganhRet20", "nganhRet60", "nganhHang20", "nganhHang60", "nganhRong", "nganhTrenMa50", "maSoNganh20", "nganhSoMa", "nhNganHang20", "nhBDS20", "nhCK20", "soNganhTang20", "phanTanNganh20"];
const out = [[...cot, ...them].join(",")];
let khongNganh = 0;
for (const r of dong.slice(1)) {
  const a = r.split(","); const ma = a[iMa], tn = maNganh.get(ma), i = chiSo.get(a[iNg]);
  if (!tn || i == null) { khongNganh++; out.push([...a, "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""].join(",")); continue; }
  const idx = chiSoNganh[tn]; const r20 = ret(idx, i, 20);
  const sma = (() => { let s = 0; for (let k = 0; k < 50; k++) s += idx[i - k]; return s / 50; })();
  const rr = (k) => ret(chiSoNganh[k], i, 20); const tat = ten.map((k) => rr(k)).filter(Number.isFinite); const tbn = tat.reduce((x, y) => x + y, 0) / tat.length;
  out.push([...a, tn.replace(/ /g, "_"), ret(idx, i, 5).toFixed(3), r20.toFixed(3), ret(idx, i, 60).toFixed(3), hang20[tn][i].toFixed(3), hang60[tn][i].toFixed(3), (doRong[tn][i] ?? NaN).toFixed(2), idx[i] > sma ? 1 : 0, (Number(a[iTang20]) - r20).toFixed(3), [...NGANH.get(tn)].length, rr("Ngan hang").toFixed(3), rr("Bat dong san").toFixed(3), rr("Chung khoan").toFixed(3), tat.filter((x) => x > 0).length, Math.sqrt(tat.reduce((x, y) => x + (y - tbn) ** 2, 0) / tat.length).toFixed(3)].map((x) => (x === "NaN" ? "" : x)).join(","));
}
writeFileSync(ra, out.join("\n"));
console.log("xong", out.length - 1, "lenh | khong co nganh:", khongNganh);
process.exit(0);
