// LICH SU DAI cua luat web (lib/phaVoPhaiSinh.js: pha vo bien dong 0,3 + cat lo toi thieu 7 + khoa lai +2 + vao lai sau cat lo) tu ngay DAU TIEN co du lieu (13/08/2018) den nay.
// Chay DUNG ham cua web cho tung phien tren nen 1 phut engine/output/vn30f1m_1p.json (taiDuLieuPhaiSinh.mjs). KHONG ghi vao lib/. In bao cao theo nam / thang / giai doan, co va khong co lenh vao lai, co va khong co truot gia.
// Chay: node engine/dich-vu/lichSuPhaiSinhDay.mjs   (TRUOT=0,4 doi truot gia moi vong; mac dinh 0,4)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { tachPhien, bienDoPhien, tinhBienDong, laPhienDauHopDong } from "../../lib/phaVoPhaiSinh.js";

const GOC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TRUOT = Number(process.env.TRUOT ?? 0.4);
const j = JSON.parse(readFileSync(path.join(GOC, "output", "vn30f1m_1p.json"), "utf8"));
const nen = j.t.map((t, i) => [t, j.o[i], j.h[i], j.l[i], j.c[i], j.v?.[i] ?? 0]).filter((r) => r.slice(1, 5).every((x) => Number.isFinite(x) && x > 0) && r[2] >= r[3]).sort((a, b) => a[0] - b[0]);
const P = tachPhien(nen);
const ds = [...P.keys()].sort();
const MOC = "2022-07-01";

const ngay = []; // { ngay, dau: diemSauPhi (khong truot) | null, hai: diemSauPhi | null, dauHD }
let thieu = 0, khongDu = 0;
for (let i = 1; i < ds.length; i++) {
  const p = P.get(ds[i]);
  if (!p || p.kCuoi < 200) { khongDu++; continue; }
  const bd = bienDoPhien(P.get(ds[i - 1]));
  const dauHD = laPhienDauHopDong(ds[i - 1], ds[i]);
  const x = bd ? tinhBienDong(p, bd.bienDo) : null;
  ngay.push({ ngay: ds[i], dauHD, dau: x && x.phia ? x.diemSauPhi : null, hai: x && x.lenhHai ? x.lenhHai.diemSauPhi : null, lyDo: x?.trangThai });
}
const tinh = ngay.filter((r) => !r.dauHD); // bo phien dau hop dong moi (giong web)
console.log(`Nen 1 phut tu ${ds[0]} den ${ds[ds.length - 1]}: ${ds.length} phien (${khongDu} phien thieu du lieu bi bo), ${tinh.length} phien duoc tinh (bo ${ngay.length - tinh.length} phien dau hop dong moi), truot gia ${TRUOT} diem / vong\n`);

// danh sach lenh cua 1 ngay theo che do (vaoLai: tinh lenh 2 hay khong)
const lenh = (r, vaoLai) => [r.dau, ...(vaoLai ? [r.hai] : [])].filter((d) => d != null).map((d) => d - TRUOT);
const ngayDiem = (r, vaoLai) => lenh(r, vaoLai).reduce((s, d) => s + d, 0);
function thongKe(ds, vaoLai) {
  const L = ds.flatMap((r) => lenh(r, vaoLai));
  const y = ds.map((r) => ngayDiem(r, vaoLai));
  let cd = 0, dinh = 0, sut = 0;
  for (const d of y) { cd += d; dinh = Math.max(dinh, cd); sut = Math.min(sut, cd - dinh); }
  const tb = y.reduce((s, d) => s + d, 0) / (y.length || 1);
  const sd = Math.sqrt(y.reduce((s, d) => s + (d - tb) ** 2, 0) / (y.length || 1));
  const w = L.filter((d) => d > 0).reduce((s, d) => s + d, 0), l = -L.filter((d) => d <= 0).reduce((s, d) => s + d, 0);
  return { n: L.length, thang: L.filter((d) => d > 0).length, tong: y.reduce((s, d) => s + d, 0), sut, sharpe: sd ? (tb / sd) * Math.sqrt(250) : NaN, pf: l ? w / l : NaN, nam: ds.length / 250, ngayTe: Math.min(0, ...y) };
}
const f1 = (v) => (Math.abs(v) < 0.05 ? "0,0" : (v > 0 ? "+" : "") + v.toFixed(1).replace(".", ","));
const dong = (ten, a, b) => `${ten.padEnd(10)} | ${String(a.n).padStart(4)} lenh thang ${String(Math.round((a.thang / a.n) * 100)).padStart(2)}% ${f1(a.tong).padStart(8)} d (${f1(a.tong / a.nam).padStart(6)}/nam) sut ${a.sut.toFixed(0).padStart(5)} Sh ${a.sharpe.toFixed(2)} PF ${a.pf.toFixed(2)}` +
  ` || +vao lai: ${String(b.n).padStart(4)} lenh thang ${String(Math.round((b.thang / b.n) * 100)).padStart(2)}% ${f1(b.tong).padStart(8)} d (${f1(b.tong / b.nam).padStart(6)}/nam) sut ${b.sut.toFixed(0).padStart(5)} Sh ${b.sharpe.toFixed(2)} PF ${b.pf.toFixed(2)}  chenh ${f1(b.tong - a.tong)}`;

console.log("=== THEO NAM (sau phi MBS + truot, 1 hop dong; trai: chi lenh dau | phai: + lenh vao lai) ===");
const nam = [...new Set(tinh.map((r) => r.ngay.slice(0, 4)))];
for (const y of nam) {
  const g = tinh.filter((r) => r.ngay.startsWith(y));
  console.log(dong(y + (y === "2018" ? "*" : ""), thongKe(g, false), thongKe(g, true)));
}
console.log("(* 2018 chi tu 13/08)\n");
console.log("=== THEO GIAI DOAN ===");
const kp = tinh.filter((r) => r.ngay < MOC), kc = tinh.filter((r) => r.ngay >= MOC);
console.log(dong("den 06/22", thongKe(kp, false), thongKe(kp, true)));
console.log(dong("tu 07/22", thongKe(kc, false), thongKe(kc, true)));
console.log(dong("CA KY", thongKe(tinh, false), thongKe(tinh, true)));

// thang
for (const [ten, vl] of [["chi lenh dau", false], ["co vao lai", true]]) {
  const m = {};
  for (const r of tinh) (m[r.ngay.slice(0, 7)] ||= []).push(ngayDiem(r, vl));
  const ks = Object.keys(m).sort(), v = ks.map((k) => m[k].reduce((s, d) => s + d, 0));
  const lo = v.filter((d) => d < 0).length;
  const te = ks.map((k, i) => [k, v[i]]).sort((a, b) => a[1] - b[1]).slice(0, 5);
  console.log(`\n--- THANG (${ten}): ${ks.length} thang, lai ${ks.length - lo} (${Math.round(((ks.length - lo) / ks.length) * 100)}%), lo ${lo}; TB ${f1(v.reduce((s, d) => s + d, 0) / ks.length)} d/thang; 5 thang te nhat: ${te.map(([k, d]) => `${k} ${f1(d)}`).join(" | ")}`);
}
// lenh vao lai rieng
const hai = tinh.filter((r) => r.hai != null);
console.log(`\n--- LENH VAO LAI RIENG: ${hai.length} lenh (${((hai.length / tinh.filter((r) => r.dau != null).length) * 100).toFixed(0)}% so ngay co lenh), thang ${hai.filter((r) => r.hai - TRUOT > 0).length} (${Math.round((hai.filter((r) => r.hai - TRUOT > 0).length / hai.length) * 100)}%), TB ${f1(hai.reduce((s, r) => s + r.hai - TRUOT, 0) / hai.length)} d/lenh`);
console.log("   theo nam (lenh / diem): " + nam.map((y) => { const g = hai.filter((r) => r.ngay.startsWith(y)); return `${y}: ${g.length} / ${f1(g.reduce((s, r) => s + r.hai - TRUOT, 0))}`; }).join("  "));
console.log("\n--- Nam am (chi lenh dau | co vao lai): " + nam.map((y) => { const g = tinh.filter((r) => r.ngay.startsWith(y)); return `${y} ${f1(thongKe(g, false).tong)}|${f1(thongKe(g, true).tong)}`; }).join("  "));
