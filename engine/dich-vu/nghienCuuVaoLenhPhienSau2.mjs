// Kiem tra them (2026-10-13): mua DONG CUA phien sau (ATC) vs MO CUA (ATO) theo tung nam; loc "xac nhan" (dong cua phien sau > dong cua tin hieu) co on dinh khong.
import { taiLenh, mo, tb, f, boot } from "./nghienCuuLenh.mjs";
const { lenh } = taiLenh();
const L = lenh.filter((t) => t.iv + 8 < t.n);
const ato = (t) => mo(t, { E: t.open[t.iv + 1], vao: t.iv + 1, banTu: t.iv + 3, S: t.S });
const atc = (t) => mo(t, { E: t.close[t.iv + 1], vao: t.iv + 1, banTu: t.iv + 3, S: t.S });
const xn = (t) => t.close[t.iv + 1] > t.close[t.iv];
const rows = L.map((t) => ({ ngay: t.ngay, nam: +t.ngay.slice(0, 4), a: ato(t), c: atc(t), xn: xn(t) })).filter((x) => x.a && x.c);
console.log("tin hieu co du ca 2 cach:", rows.length);
console.log("\nTheo nam | n | ATO TB% | ATC TB% | ATC-ATO | XAC NHAN (n, TB%, thang%) | KHONG xac nhan (n, TB%, thang%)");
for (const y of [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]) {
  const g = rows.filter((x) => x.nam === y); if (g.length < 20) continue;
  const a = tb(g.map((x) => x.a.ret)), c = tb(g.map((x) => x.c.ret));
  const X = g.filter((x) => x.xn), N = g.filter((x) => !x.xn);
  const w = (k) => (k.filter((x) => x.c.ret > 0).length / (k.length || 1)) * 100;
  console.log(`${y} | ${String(g.length).padStart(4)} | ${f(a).padStart(6)} | ${f(c).padStart(6)} | ${f(c - a).padStart(6)} | ${String(X.length).padStart(4)} ${f(tb(X.map((x) => x.c.ret))).padStart(6)} ${f(w(X), 0).padStart(3)}% | ${String(N.length).padStart(4)} ${f(tb(N.map((x) => x.c.ret))).padStart(6)} ${f(w(N), 0).padStart(3)}%`);
}
const T = rows.filter((x) => x.ngay >= "2022-05-01");
const [l1, h1] = boot(T.map((x) => x.c.ret), T.map((x) => x.a.ret));
console.log(`\nTu 2022.5: ATC - ATO = ${f(tb(T.map((x) => x.c.ret)) - tb(T.map((x) => x.a.ret)))} diem %/lenh [95% CI ${f(l1)} .. ${f(h1)}] (cung tap tin hieu)`);
const X = T.filter((x) => x.xn), N = T.filter((x) => !x.xn);
const [l2, h2] = boot(X.map((x) => x.c.ret), N.map((x) => x.c.ret));
console.log(`Tu 2022.5: nhom xac nhan (${X.length}) - nhom khong xac nhan (${N.length}) khi mua ATC: ${f(tb(X.map((x) => x.c.ret)) - tb(N.map((x) => x.c.ret)))} diem %/lenh [95% CI ${f(l2)} .. ${f(h2)}]`);
const all = rows; const Xa = all.filter((x) => x.xn), Na = all.filter((x) => !x.xn); const [l3, h3] = boot(Xa.map((x) => x.c.ret), Na.map((x) => x.c.ret));
console.log(`Toan bo: nhom xac nhan (${Xa.length}) - khong xac nhan (${Na.length}): ${f(tb(Xa.map((x) => x.c.ret)) - tb(Na.map((x) => x.c.ret)))} [95% CI ${f(l3)} .. ${f(h3)}]`);
process.exit(0);
