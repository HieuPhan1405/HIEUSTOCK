// NGHIEN CUU "LENH WEB GIU" (2026-10-13): lenh ma engine THOI giu som (tin hieu bien mat sau vai phien) nhung nguoi dung da mua -> web phai tu giu. Xuat: so phien engine giu + ket qua neu web giu tiep (bo qua tin BAN cua engine).
import { writeFileSync } from "node:fs";
import { taiLenh, mo } from "./nghienCuuLenh.mjs";
const dich = process.argv[2];
const { lenh } = taiLenh();
const ra = ["ma,ngay,engPhien,chamStop,retEng,retWeb,phienWeb,lyWeb,d3,mn3"];
for (const t of lenh) {
  const i = t.iv; if (i < 210 || i + 3 >= t.n) continue;
  const base = { E: t.open[i + 1], vao: i + 1, banTu: i + 3, S: t.S };
  const rE = mo(t, base);
  const tw = { ...t, sell: new Array(t.n).fill(false) };
  const rW = mo(tw, { ...base, thoiGian: 40 });
  if (!rE || !rW) continue;
  let cs = 0; for (let k = i + 1; k <= Math.min(t.jEng, t.n - 1); k++) if (t.low[k] <= t.S) { cs = 1; break; }
  const E0 = t.open[i + 1]; let mn = Infinity; for (let k = i + 1; k <= i + 3; k++) mn = Math.min(mn, t.low[k]);
  ra.push([t.ma, t.ngayArr[i], t.jEng - i, cs, rE.ret.toFixed(3), rW.ret.toFixed(3), rW.phien, rW.ly, ((t.close[i + 3] / E0 - 1) * 100).toFixed(3), ((mn / E0 - 1) * 100).toFixed(3)].join(","));
}
writeFileSync(dich, ra.join("\n"));
console.log("xuat", ra.length - 1, "lenh ->", dich);
process.exit(0);
