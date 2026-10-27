// KIEM CHUNG NGOAI MAU ung vien T+ "bat nhip hoi sau ban thao co ngoai gom" (project-danh-t-cong, quetTPlus.mjs): VN-Index giam > 3% / 5 phien + ma dong cua vua THUNG bien duoi Bollinger 20,2 (phien dau)
// + khoi ngoai mua rong 5 phien >= 3,6% khoi luong 5 phien; thanh khoan TB20 >= 5 ty. Mua mo cua i+1, ban dong cua i+3 / i+5 / i+10, phi 0,4%. Gop theo DOT (cac ngay lien nhau cach <= 5 phien).
// Dung TU=2026-01-01 de chi xem 2026 (ngoai.json den 13/10/2026). Chay: TU=2026-01-01 node engine/dich-vu/nghienCuuUngVienBanThao.mjs
import { readFileSync } from "node:fs";
import { docNenMoiNhat } from "./docNenMoiNhat.mjs";

const doc = (f) => JSON.parse(readFileSync(new URL(`../output/${f}`, import.meta.url), "utf8"));
const nen = docNenMoiNhat();
const ngoai = doc("ngoai.json");
const vni = doc("vnindex_dai.json");
const TU = process.env.TU ?? "2018-09-01";
const DEN = process.env.DEN ?? "9999";
const PHI = 0.4;
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const p = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");
const vi = new Map(vni.map((x, i) => [x.t, i > 5 ? (x.c / vni[i - 5].c - 1) * 100 : NaN]));

const ev = [];
for (const [ma, ds] of Object.entries(nen)) {
  const ng = ngoai[ma];
  if (!ng) continue;
  const nm = new Map(ng.t.map((t, i) => [t, i]));
  const n = ds.length;
  const c = ds.map((x) => x.c);
  for (let i = 25; i < n - 11; i++) {
    const t = ds[i].t;
    if (t < TU || t > DEN) continue;
    if (!(vi.get(t) < -3)) continue;
    let s = 0, s2 = 0, gt = 0;
    for (let j = i - 19; j <= i; j++) { s += c[j]; gt += c[j] * ds[j].v; }
    if (gt / 20 / 1e6 < 5) continue;
    const m = s / 20;
    for (let j = i - 19; j <= i; j++) s2 += (c[j] - m) ** 2;
    const lo = m - 2 * Math.sqrt(s2 / 20);
    // phien truoc chua thung
    let s0 = 0, s02 = 0;
    for (let j = i - 20; j <= i - 1; j++) s0 += c[j];
    const m0 = s0 / 20;
    for (let j = i - 20; j <= i - 1; j++) s02 += (c[j] - m0) ** 2;
    const lo0 = m0 - 2 * Math.sqrt(s02 / 20);
    if (!(c[i] < lo && c[i - 1] >= lo0)) continue;
    // ngoai 5 phien
    let nv = 0, kl5 = 0, co = 0;
    for (let k = 0; k < 5; k++) {
      const idx = nm.get(ds[i - k].t);
      if (idx == null) continue;
      nv += ng.bv[idx] - ng.sv[idx];
      kl5 += ds[i - k].v;
      co++;
    }
    if (co < 4 || !(kl5 > 0)) continue;
    const ngoaiRatio = nv / kl5;
    const vao = ds[i + 1].o;
    const r = (h) => (c[i + h] / vao - 1) * 100 - PHI;
    ev.push({ ma, t, ngoai: ngoaiRatio, r3: r(3), r5: r(5), r10: r(10) });
  }
}
const dong = (ten, a) => console.log("  ", ten.padEnd(52), String(a.length).padStart(5), "lenh | T+3", p(tb(a.map((e) => e.r3))).padStart(6), (p((a.filter((e) => e.r3 > 0).length / Math.max(a.length, 1)) * 100, 0) + "%").padStart(4), "| T+5", p(tb(a.map((e) => e.r5))).padStart(6), (p((a.filter((e) => e.r5 > 0).length / Math.max(a.length, 1)) * 100, 0) + "%").padStart(4), "| T+10", p(tb(a.map((e) => e.r10))).padStart(6));
console.log(`Giai doan ${TU} -> ${DEN === "9999" ? "nay" : DEN}: VN-Index giam >3%/5 phien + thung Bollinger duoi lan dau. Phi ${PHI}%.`);
dong("Tat ca (khong xet ngoai)", ev);
dong("Ngoai mua rong 5p >= 3,6% KL (ung vien)", ev.filter((e) => e.ngoai >= 0.036));
dong("Ngoai mua rong duong nhung < 3,6%", ev.filter((e) => e.ngoai > 0 && e.ngoai < 0.036));
dong("Ngoai ban rong", ev.filter((e) => e.ngoai <= 0));
console.log("\nTung ngay (ung vien):");
const uv = ev.filter((e) => e.ngoai >= 0.036);
const theo = new Map();
for (const e of uv) (theo.get(e.t) ?? theo.set(e.t, []).get(e.t)).push(e);
for (const [t, a] of [...theo.entries()].sort()) console.log("  ", t, String(a.length).padStart(3), "ma | T+3", p(tb(a.map((e) => e.r3))).padStart(6), "| T+5", p(tb(a.map((e) => e.r5))).padStart(6), "| T+10", p(tb(a.map((e) => e.r10))).padStart(6), "|", a.slice(0, 6).map((e) => e.ma).join(","));
