// BAT DAY: THU HA NGUONG DIEM CHECKLIST (Hieu 05/11/2026: "giam diem bat day xuong 4, test"). Checklist (engine/loi/checklistBatDay.js, port 1:1 cua AFL 8) bao 1 lan khi TONG DIEM vuot nguong (mac dinh 5).
// So sanh nguong 4 / 4,5 / 5 / 6 tren toan bo ma (nen_dai.json, ~13 nam): VN100 khong loc thanh khoan, ma khac GTGD TB20 >= 3 ty. Vao lenh THAT TE: MO CUA phien sau tin hieu (dong cua + 1) - tru sai lech "vao tai moc" - giu 5 / 10 / 20 phien den DONG CUA; phi + truot 0,4%/vong.
// Cung do ca ket qua theo cach cua AFL (dong cua ngay tin hieu) de doi chieu. KP = den 2022-06-30, KC = tu 2022-07-01. Chay: node engine/dich-vu/nghienCuuBatDayNguong.mjs   (NGUONG=4,5,6 doi muc)
import { readFileSync } from "node:fs";
import { tinhChecklistBatDay } from "../loi/checklistBatDay.js";
import { VN100 } from "../danh-sach/vn100.js";

const nen = JSON.parse(readFileSync(new URL("../output/nen_dai.json", import.meta.url), "utf8"));
const vn100 = new Set(VN100);
const NGUONG = (process.env.NGUONG ?? "4,4.5,5,6").split(",").map(Number);
const PHI = 0.4;
const MOC = "2022-07-01";
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const med = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : NaN);
const p = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");
const HOLD = [5, 10, 20];

function chay(nguong) {
  const kq = [];
  for (const [ma, ds] of Object.entries(nen)) {
    if (!ds || ds.length < 300) continue;
    const idx = new Map(ds.map((b, i) => [b.t, i]));
    for (const e of tinhChecklistBatDay(ds, { namBatDauTheoDoi: 0, gtgdToiThieuTy: vn100.has(ma) ? null : 3, nguong })) {
      const i = idx.get(e.ngay);
      if (i == null || i + 1 >= ds.length) continue;
      const vao = ds[i + 1].o;
      if (!(vao > 0)) continue;
      const r = {};
      for (const h of HOLD) r[h] = i + 1 + h < ds.length ? (ds[i + 1 + h].c / vao - 1) * 100 - PHI : null; // mo cua phien sau -> dong cua sau h phien
      kq.push({ ma, ngay: e.ngay, diem: e.diem, r, afl: { 5: e.pct_sau_5, 10: e.pct_sau_10, 20: e.pct_sau_20 } });
    }
  }
  return kq;
}
const dong = (a, nhan, kieu = "r") => {
  const out = HOLD.map((h) => {
    const x = a.map((e) => (kieu === "r" ? e.r[h] : e.afl[h])).filter((v) => v != null);
    return `${h}p ${p(tb(x)).padStart(6)}% (${String(Math.round((x.filter((v) => v > 0).length / (x.length || 1)) * 100)).padStart(2)}%, TV ${p(med(x), 1).padStart(5)})`;
  });
  console.log(`   ${nhan.padEnd(40)} n ${String(a.length).padStart(5)} | ${out.join(" | ")}`);
};
const kqTheo = {};
for (const ng of NGUONG) {
  const ds = chay(ng);
  kqTheo[ng] = ds;
  console.log(`\n=== NGUONG DIEM >= ${ng}: ${ds.length} su kien, ${new Set(ds.map((e) => e.ma)).size} ma ===`);
  dong(ds, "TAT CA (vao mo cua phien sau, sau phi)");
  dong(ds.filter((e) => e.ngay < MOC), "  KP (den 06/2022)");
  dong(ds.filter((e) => e.ngay >= MOC), "  KC (tu 07/2022)");
  dong(ds.filter((e) => e.ngay >= "2025-01-01"), "  tu 2025");
  dong(ds, "doi chieu: AFL (dong cua ngay tin hieu, chua phi)", "afl");
  for (const [a, b, nhan] of [[0, 4.5, "diem < 4,5"], [4.5, 5.5, "4,5 <= diem < 5,5"], [5.5, 6.5, "5,5 <= diem < 6,5"], [6.5, 99, "diem >= 6,5"]]) dong(ds.filter((e) => e.diem >= a && e.diem < b), `  ${nhan}`);
}
// bo sung: nhung su kien CHI co o nguong thap (khong trung ma + ngay voi su kien nguong 5)
if (kqTheo[4] && kqTheo[5]) {
  const k5 = new Set(kqTheo[5].map((e) => e.ma + e.ngay));
  // su kien nguong 4 ma 10 phien tiep theo khong co su kien nguong 5 cung ma (rieng cho nguong 4)
  const g5 = new Map();
  for (const e of kqTheo[5]) (g5.get(e.ma) ?? g5.set(e.ma, []).get(e.ma)).push(e.ngay);
  const rieng = kqTheo[4].filter((e) => !(g5.get(e.ma) ?? []).some((d) => d >= e.ngay && (new Date(d) - new Date(e.ngay)) / 864e5 <= 14));
  console.log(`\n=== CHI CO O NGUONG 4 (khong co su kien nguong 5 cung ma trong 14 ngay tiep theo): ${rieng.length} su kien ===`);
  dong(rieng, "TAT CA"); dong(rieng.filter((e) => e.ngay < MOC), "  KP"); dong(rieng.filter((e) => e.ngay >= MOC), "  KC"); dong(rieng.filter((e) => e.ngay >= "2025-01-01"), "  tu 2025");
}
// theo nam cho nguong 4 va 5 (20 phien)
console.log("\nTheo nam (vao mo cua phien sau, giu 20 phien, sau phi): TB % (n)");
for (const ng of NGUONG.filter((x) => x === 4 || x === 5)) {
  const by = {};
  for (const e of kqTheo[ng]) if (e.r[20] != null) (by[e.ngay.slice(0, 4)] ??= []).push(e.r[20]);
  console.log(`   nguong ${ng}: ` + Object.keys(by).sort().map((y) => `${y} ${p(tb(by[y]), 1)}(${by[y].length})`).join("  "));
}
