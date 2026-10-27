// LENH LAI MANH TU 2026: co dac diem gi? (Hieu 27/10/2026: "cac lenh lai manh nam nay nhu BSR, MSR, PVP... co gi dac biet khong"). HT (30/30 + BAN) thuc te (mua mo cua phien sau, ban tu T+2), phi 0,4%.
// In: top lenh lai, cac lenh BSR/MSR/PVP..., va so sanh dac trung (luc tin hieu) cua 10% lenh lai nhat voi phan con lai: pos 120 phien, d5, tang 20 phien, RelVol, ATR%, ngay vuot may, nganh, do rong, giu bao nhieu phien.
// Chay: node engine/dich-vu/phanTichLenhLaiManh2026.mjs  (TU=2026-01-01 MA=BSR,MSR,PVP)
import { docJson, chayEngine, tb, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";
import { nganhCuaMa } from "../danh-sach/nganh.js";
const TU = process.env.TU ?? "2026-01-01", MA = (process.env.MA ?? "BSR,MSR,PVP,PVD,PVS,PVC").split(",");
const vni = docJson("vnindex_dai.json");
const chiSo = new Map(vni.map((b, i) => [b.t, i])), vc = vni.map((b) => b.c);
const { lenh, thiTruong } = chayEngine({ cache: docJson("nen_dai.json"), vni });
const HT = { moc: HAI_TP, baoVe: true, theoSell: true };
const D = [];
for (const t of lenh.filter((x) => x.loai === 1 && x.ngay >= TU && x.iv >= 120)) {
  const r = mp(t, { ...HT, vao: t.iv + 1, banTu: t.iv + 3 });
  if (!r) continue;
  let mn = Infinity, mx = -Infinity;
  for (let k = t.iv - 119; k <= t.iv; k++) { mn = Math.min(mn, t.low[k]); mx = Math.max(mx, t.high[k]); }
  const i = chiSo.get(t.ngay), tt = thiTruong(t.ngay), c = t.close, iv = t.iv;
  D.push({ t, ma: t.ma, ngay: t.ngay, ret: r.ret, phien: r.phien, nganh: nganhCuaMa(t.ma) ?? "Khac",
    pos: (c[iv] - mn) / (mx - mn), d5: (vc[i] / vc[i - 5] - 1) * 100, tang20: (c[iv] / c[iv - 20] - 1) * 100, tang5: (c[iv] / c[iv - 5] - 1) * 100,
    relVol: t.dacTrung["Khoi luong tuong doi (RelVol)"], atrPct: (t.atr[iv] / c[iv]) * 100, catLo: ((t.E - t.S) / t.E) * 100, gapVao: (t.open[iv + 1] / t.E - 1) * 100,
    doRong: tt?.doRong50 ?? null, rs: t.dacTrung["Suc manh so voi VN-Index (RS 20 phien)"], diem: t.dacTrung["Tong diem luc vao (diem)"], gtgd: t.dacTrung["GTGD TB20 (ty/phien)"] });
}
console.log(`Tu ${TU}: ${D.length} lenh, lai TB ${f(tb(D.map((x) => x.ret)))}% | lai >= 10%: ${D.filter((x) => x.ret >= 10).length} | lai >= 20%: ${D.filter((x) => x.ret >= 20).length}`);
const dong = (x) => `${x.ngay} ${x.ma.padEnd(4)} lai ${f(x.ret).padStart(6)}% (${f(x.phien, 0).padStart(3)} phien) pos ${f(x.pos, 2)} d5 ${f(x.d5, 1).padStart(5)}% tang20 ${f(x.tang20, 0).padStart(4)}% relVol ${f(x.relVol, 1)} ATR ${f(x.atrPct, 1)}% gtgd ${f(x.gtgd, 0)}ty ${x.nganh}`;
console.log("\nTOP 25 LENH LAI NHAT:"); [...D].sort((a, b) => b.ret - a.ret).slice(0, 25).forEach((x) => console.log("  " + dong(x)));
console.log(`\nCAC LENH ${MA.join("/")}:`); D.filter((x) => MA.includes(x.ma)).sort((a, b) => a.ngay.localeCompare(b.ngay)).forEach((x) => console.log("  " + dong(x)));
const top = [...D].sort((a, b) => b.ret - a.ret).slice(0, Math.ceil(D.length * 0.1)), rest = D.filter((x) => !top.includes(x));
console.log(`\nSO SANH 10% lenh lai nhat (n ${top.length}, lai TB ${f(tb(top.map((x) => x.ret)))}%) vs con lai (n ${rest.length}):`);
for (const [k, ten] of [["pos", "pos 120 phien"], ["d5", "d5 VN-Index %"], ["tang5", "tang 5 phien %"], ["tang20", "tang 20 phien %"], ["relVol", "RelVol"], ["atrPct", "ATR % gia"], ["catLo", "cat lo %"], ["gapVao", "gia mua thuc so voi moc %"], ["doRong", "do rong thi truong %"], ["rs", "RS 20 phien"], ["diem", "diem luc vao"], ["gtgd", "GTGD ty/phien"], ["phien", "so phien giu"]]) {
  const a = top.map((x) => x[k]).filter((v) => v != null && Number.isFinite(v)), b = rest.map((x) => x[k]).filter((v) => v != null && Number.isFinite(v));
  const med = (z) => [...z].sort((p, q) => p - q)[Math.floor(z.length / 2)];
  console.log(`  ${ten.padEnd(28)} top: TB ${f(tb(a)).padStart(7)} TV ${f(med(a)).padStart(7)} | con lai: TB ${f(tb(b)).padStart(7)} TV ${f(med(b)).padStart(7)}`);
}
const dem = (arr) => { const m = new Map(); for (const x of arr) m.set(x.nganh, (m.get(x.nganh) ?? 0) + 1); return [...m].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${v}`).join(", "); };
console.log(`  Nganh top: ${dem(top)}\n  Nganh toan bo: ${dem(D)}`);
const mw = (arr) => arr.length ? `${f(tb(arr.map((x) => x.ret)))}% (n ${arr.length})` : "-";
console.log(`\nTheo pos: <0,5 ${mw(D.filter((x) => x.pos < 0.5))} | 0,5-0,8 ${mw(D.filter((x) => x.pos >= 0.5 && x.pos < 0.8))} | >=0,8 ${mw(D.filter((x) => x.pos >= 0.8))}`);
console.log(`Theo nganh Dau khi (BSR, PVD, PVS, PVC, PVB, PVP, PLX...): ${mw(D.filter((x) => x.nganh === "Dau khi"))} | cac nganh khac ${mw(D.filter((x) => x.nganh !== "Dau khi"))}`);
