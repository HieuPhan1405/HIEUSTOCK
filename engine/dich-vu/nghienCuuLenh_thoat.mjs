// NGHIEN CUU NANG CAP RA LENH (2026-10-12) - doc het ket qua o DesktopPhan-Hieu-Stock-Nang-Cap-Ra-Lenh-v2.md. Chay: node engine/dich-vu/nghienCuuLenh_catLo.mjs | _dacTrung.mjs | _thoat.mjs
import { taiLenh, vaoMo, tb, f } from "./nghienCuuLenh.mjs";
const { lenh } = taiLenh();
const swing5 = (t) => Math.min(...t.low.slice(Math.max(0, t.iv - 4), t.iv + 1)) * 0.995;
const CACH = {
  "Hien tai: 30% TP1 + 30% TP2 + giu": {},
  "Dua stop ve gia vao sau TP1": { beSauTP1: true },
  "Cat theo thoi gian 20 phien (neu chua chot gi)": { thoiGian: 20 },
  "Cat theo thoi gian 12 phien": { thoiGian: 12 },
  "50% TP1 + 25% TP2 + giu": { moc: [{ w: 0.5, i: 0 }, { w: 0.25, i: 1 }] },
  "25% TP1 + 25% TP2 + 25% TP3 + giu": { moc: [{ w: 0.25, i: 0 }, { w: 0.25, i: 1 }, { w: 0.25, i: 2 }] },
  "30% TP1 + 30% TP2 + giu, stop ve vao sau TP1 + 20 phien": { beSauTP1: true, thoiGian: 20 },
  "Khong chot tung phan, chi theo tin hieu BAN/stop": { moc: [] },
};
const TU = "2022-05-01";
for (const [tenStop, fnStop] of [["CAT LO ENGINE (toi da 6%)", null], ["CAT LO DAY 5 PHIEN - 0,5%", swing5]]) {
  console.log(`\n=========== ${tenStop} ===========`);
  console.log("Cach thoat".padEnd(62), "TRAIN: TB lai%  TB R  thang% | TEST: TB lai%  TB R  thang%");
  for (const [ten, op] of Object.entries(CACH)) {
    const kq = [];
    for (const t of lenh) { const E = t.open[t.iv + 1]; const S = fnStop ? fnStop(t) : t.S; if (!(S < E * 0.995)) continue; const r = vaoMo(t, { ...(fnStop ? { S } : {}), ...op }); if (r) kq.push({ r, ngay: t.ngay }); }
    const a = kq.filter((x) => x.ngay < TU), b = kq.filter((x) => x.ngay >= TU);
    const R = (x) => x.r.ret / x.r.rSize;
    console.log(ten.padEnd(62), `${f(tb(a.map((x) => x.r.ret))).padStart(14)} ${f(tb(a.map(R)), 3).padStart(6)} ${f(a.filter((x) => x.r.ret > 0).length / a.length * 100, 1).padStart(7)} | ${f(tb(b.map((x) => x.r.ret))).padStart(14)} ${f(tb(b.map(R)), 3).padStart(6)} ${f(b.filter((x) => x.r.ret > 0).length / b.length * 100, 1).padStart(7)}`);
  }
}
process.exit(0);
