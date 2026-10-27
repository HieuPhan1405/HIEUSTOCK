// KIEM TRA NHIN TRUOC cua kieu "nen cuoi (14h-14h45) giam >= 2% -> mua dong cua, ban T+2" (nghienCuuTPlus1H.mjs, kieu 7): nen 1 gio 14h bao gom ATC (14h30-14h45) nen tin hieu co the chi lo ra o ATC.
// Dung nen 15 phut (nen_15p.json, 31/03/2026 -> nay): p1400 = gia luc 14h00, p1430 = gia luc 14h30 (truoc ATC), pATC = dong cua nen ATC (nhan 14h45).
//   Kieu A (nhin truoc): nen 1 gio 14h giam >= 2% theo gia dong cua cuoi (pATC / p1400) - mua pATC.
//   Kieu B (thuc te 14h30): gia giam >= 2% tu 14h00 den 14h30 (p1430 / p1400) - mua tai p1430 (+0,1% truot), ban dong cua T+2.
//   Kieu C: giam >= 2% tu 14h00 den 14h30 VA phien ATC khong giam them (de thay ro phan ATC).
// Chay: node engine/dich-vu/nghienCuu15pCuoiPhien.mjs
import { readFileSync } from "node:fs";

const n15 = JSON.parse(readFileSync(new URL("../output/nen_15p.json", import.meta.url), "utf8"));
const nen = JSON.parse(readFileSync(new URL("../output/nen_gan.json", import.meta.url), "utf8"));
const PHI = 0.4;
const gio = (s) => { const d = new Date((s + 7 * 3600) * 1000); return { ngay: d.toISOString().slice(0, 10), hm: d.getUTCHours() * 100 + d.getUTCMinutes() }; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const p = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");

const lenh = [];
const bt = new Map();
for (const [ma, x] of Object.entries(n15)) {
  const ds = nen[ma];
  if (!ds || ds.length < 40) continue;
  const chiSo = new Map(ds.map((b, i) => [b.t, i]));
  const ngay = new Map();
  for (let k = 0; k < x.t.length; k++) {
    const g = gio(x.t[k]);
    (ngay.get(g.ngay) ?? ngay.set(g.ngay, []).get(g.ngay)).push({ hm: g.hm, c: x.c[k] });
  }
  for (const [d, bars] of ngay) {
    const i = chiSo.get(d);
    if (i == null || i < 25 || i + 2 >= ds.length) continue;
    // nen 15 phut cua VNDirect gan nhan theo GIO KET THUC nen (9h15 = nen 9h00-9h15; ATC 14h30-14h45 = nen "14h45"); nen khong co giao dich thi khong xuat hien -> lay nen cuoi cung <= moc gio
    const cuoiDen = (hm) => { let r = null; for (const b of bars) if (b.hm <= hm) r = b; return r; };
    const b1345 = cuoiDen(1400), b1415 = cuoiDen(1430), b1430 = bars.find((b) => b.hm === 1445);
    if (!b1345 || !b1415 || !b1430 || b1345.hm < 1330) continue;
    let gt = 0;
    for (let k = i - 20; k < i; k++) gt += ds[k].c * ds[k].v;
    if (gt / 20 / 1e6 < 5) continue;
    const p1400 = b1345.c, p1430 = b1415.c, pAtc = b1430.c;
    const ra = ds[i + 2].c;
    const rA = (ra / pAtc - 1) * 100 - PHI;
    const rB = (ra / (p1430 * 1.001) - 1) * 100 - PHI;
    const sA = (pAtc / p1400 - 1) * 100, sB = (p1430 / p1400 - 1) * 100, atc = (pAtc / p1430 - 1) * 100;
    const key = d;
    const a = bt.get(key) ?? [0, 0, 0, 0];
    a[0] += rA; a[1]++; a[2] += rB;
    bt.set(key, a);
    lenh.push({ ma, d, sA, sB, atc, rA, rB });
  }
}
const vuot = (e, k) => { const a = bt.get(e.d); return k === "A" ? e.rA - a[0] / a[1] : e.rB - a[2] / a[1]; };
const dong = (ten, a, k) => {
  if (a.length < 20) return console.log("  ", ten.padEnd(66), String(a.length).padStart(5), "(it mau)");
  const r = a.map((e) => (k === "A" ? e.rA : e.rB));
  console.log("  ", ten.padEnd(66), String(a.length).padStart(5), "| lai ban T+2", p(tb(r)).padStart(6), "vuot", p(tb(a.map((e) => vuot(e, k)))).padStart(6), "thang", (p((r.filter((x) => x > 0).length / r.length) * 100, 0) + "%").padStart(4));
};
const soNgay = bt.size;
console.log(`${soNgay} phien, ${lenh.length} (ma x ngay) thanh khoan >= 5 ty. Phi+truot ${PHI}% (kieu B them 0,1% truot vao).`);
console.log("Doi chung - moi (ma x ngay): lai ban T+2 mua pATC", p(tb(lenh.map((e) => e.rA))), "| mua 14h30", p(tb(lenh.map((e) => e.rB))));
const giamA = lenh.filter((e) => e.sA <= -2);
console.log(`\nNen cuoi giam >= 2% theo dong cua (kieu A): ${giamA.length} lan; trong do phan giam xay ra o ATC (14h30-14h45) TB: ${p(tb(giamA.map((e) => e.atc)))}% tren tong ${p(tb(giamA.map((e) => e.sA)))}%; ${p((giamA.filter((e) => e.sB > -1).length / giamA.length) * 100, 0)}% truong hop truoc ATC giam chua toi 1% (tin hieu CHI lo ra o ATC).`);
dong("A nhin truoc: giam >=2% (14h00->dong cua), mua pATC", giamA, "A");
dong("B thuc te: giam >=2% (14h00 -> 14h30), mua 14h30", lenh.filter((e) => e.sB <= -2), "B");
dong("B2: giam >=3% (14h00 -> 14h30), mua 14h30", lenh.filter((e) => e.sB <= -3), "B");
dong("C: giam >=2% truoc ATC, ATC khong giam them (>= -0,3%), mua pATC", lenh.filter((e) => e.sB <= -2 && e.atc >= -0.3), "A");
dong("D: giam >=2% truoc ATC va ATC giam them (< -0,3%), mua pATC", lenh.filter((e) => e.sB <= -2 && e.atc < -0.3), "A");
dong("E: chi ATC giam >= 2% (truoc ATC chua giam), mua pATC (khong thay truoc duoc)", lenh.filter((e) => e.atc <= -2 && e.sB > -1), "A");
dong("F (doi chung) giam 14h00->14h30 nhung >= -2%..-1%, mua 14h30", lenh.filter((e) => e.sB <= -1 && e.sB > -2), "B");
