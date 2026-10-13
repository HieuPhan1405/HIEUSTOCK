// NGHIEN CUU "LENH WEB GIU" (2026-10-13): lenh ma engine THOI giu som (tin hieu bien mat sau vai phien) nhung nguoi dung da mua -> web phai tu giu.
// Xuat: so phien engine giu, co cham cat lo khong, ket qua neu engine tu thoat / neu web giu tiep (bo qua tin BAN), do quay dau 3 phien sau khi vao, va "ap luc mua" tu OHLCV ngay.
// Chay: node engine/dich-vu/nghienCuuWebGiu_xuat.mjs <ra.csv>
import { writeFileSync } from "node:fs";
import { taiLenh, mo } from "./nghienCuuLenh.mjs";
const dich = process.argv[2];
const { lenh } = taiLenh();

// "Ap luc mua" tu OHLCV ngay (KHONG co so lenh mua/ban that cua tung ma): ap = trung binh gia quyen theo khoi luong cua vi tri dong cua trong nen
// (1 = dong sat cao nhat = ben mua thang; 0 = dong sat thap nhat = ben ban thang); up = ty trong khoi luong cac phien tang (dong >= dong hom truoc) trong k phien.
function aps(t, i, k) {
  let a = 0, w = 0;
  for (let j = i - k + 1; j <= i; j++) { const r = t.high[j] - t.low[j] || 1e-9; a += ((t.close[j] - t.low[j]) / r) * t.vol[j]; w += t.vol[j]; }
  return w ? a / w : NaN;
}
function upShare(t, i, k) {
  let u = 0, w = 0;
  for (let j = i - k + 1; j <= i; j++) { if (t.close[j] >= t.close[j - 1]) u += t.vol[j]; w += t.vol[j]; }
  return w ? u / w : NaN;
}

const ra = ["ma,ngay,engPhien,chamStop,retEng,retWeb,phienWeb,lyWeb,d3,mn3,ap3,ap5,up3,up5"];
for (const t of lenh) {
  const i = t.iv; if (i < 210 || i + 3 >= t.n || !t.vol) continue;
  const base = { E: t.open[i + 1], vao: i + 1, banTu: i + 3, S: t.S };
  const rE = mo(t, base);
  const tw = { ...t, sell: new Array(t.n).fill(false) };
  const rW = mo(tw, { ...base, thoiGian: 40 });
  if (!rE || !rW) continue;
  let cs = 0; for (let k = i + 1; k <= Math.min(t.jEng, t.n - 1); k++) if (t.low[k] <= t.S) { cs = 1; break; }
  const E0 = t.open[i + 1]; let mn = Infinity; for (let k = i + 1; k <= i + 3; k++) mn = Math.min(mn, t.low[k]);
  ra.push([
    t.ma, t.ngayArr[i], t.jEng - i, cs, rE.ret.toFixed(3), rW.ret.toFixed(3), rW.phien, rW.ly,
    ((t.close[i + 3] / E0 - 1) * 100).toFixed(3), ((mn / E0 - 1) * 100).toFixed(3),
    aps(t, i, 3).toFixed(3), aps(t, i, 5).toFixed(3), upShare(t, i, 3).toFixed(3), upShare(t, i, 5).toFixed(3),
  ].join(","));
}
writeFileSync(dich, ra.join("\n"));
console.log("xuat", ra.length - 1, "lenh ->", dich);
process.exit(0);
