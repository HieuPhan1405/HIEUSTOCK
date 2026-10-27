// KIEM TRA NHIN TRUOC cua kieu "tang >= 5% + KL cao -> mua ATC" (nghienCuuTPlusDemGio.mjs, kieu H): tin hieu that chi biet duoc luc ~14h30 (truoc khi dat lenh ATC), khong phai gia dong cua cuoi cung.
// Dung nen 15 phut (engine/output/nen_15p.json, taiDuLieu15p.mjs, tu 31/03/2026 ~ 6,5 thang): gia luc 14h30 = dong cua nen 14h15; gia ATC = dong cua nen 14h30. KL luy ke den 14h30 so voi TB20 ngay.
// Chay: node engine/dich-vu/nghienCuu15pTuongLai.mjs
import { readFileSync } from "node:fs";

const n15 = JSON.parse(readFileSync(new URL("../output/nen_15p.json", import.meta.url), "utf8"));
const nen = JSON.parse(readFileSync(new URL("../output/nen_gan.json", import.meta.url), "utf8"));
const PHI = 0.4;
const gio = (s) => { const d = new Date((s + 7 * 3600) * 1000); return { ngay: d.toISOString().slice(0, 10), hm: d.getUTCHours() * 100 + d.getUTCMinutes() }; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const p = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");

const lenh = [];
let soNgay = new Set();
let demThuNghiem = 0, demGiongNhau = 0;
for (const [ma, x] of Object.entries(n15)) {
  const ds = nen[ma];
  if (!ds || ds.length < 40) continue;
  const chiSo = new Map(ds.map((b, i) => [b.t, i]));
  // gom nen 15 phut theo ngay
  const ngay = new Map();
  for (let k = 0; k < x.t.length; k++) {
    const g = gio(x.t[k]);
    (ngay.get(g.ngay) ?? ngay.set(g.ngay, []).get(g.ngay)).push({ hm: g.hm, o: x.o[k], c: x.c[k], v: x.v[k] });
  }
  for (const [d, bars] of ngay) {
    const i = chiSo.get(d);
    if (i == null || i < 25 || i + 3 >= ds.length) continue;
    const truoc1430 = bars.filter((b) => b.hm <= 1430);
    const atc = bars.find((b) => b.hm === 1445);
    if (!atc || truoc1430.length < 10) continue;
    const prev = ds[i - 1].c;
    let tbv = 0, gt = 0;
    for (let j = i - 20; j < i; j++) { tbv += ds[j].v; gt += ds[j].c * ds[j].v; }
    tbv /= 20;
    if (gt / 20 / 1e6 < 5) continue;
    const p1430 = truoc1430[truoc1430.length - 1].c;
    const kl1430 = truoc1430.reduce((s, b) => s + b.v, 0);
    const dong = ds[i].c;
    const chg1430 = (p1430 / prev - 1) * 100, chgDong = (dong / prev - 1) * 100;
    soNgay.add(d);
    const sdung14 = chg1430 >= 5 && kl1430 >= 1.3 * tbv; // tin hieu luc 14h30
    const sdungDong = chgDong >= 5 && ds[i].v >= 1.5 * tbv; // tin hieu theo dong cua cuoi cung (kieu H goc)
    if (sdung14 || sdungDong) {
      demThuNghiem++;
      if (sdung14 && sdungDong) demGiongNhau++;
    }
    const ra2 = ds[i + 2].c; // ban chieu T+2 (xap xi gia dong cua)
    const ra3 = ds[i + 3].c;
    lenh.push({ ma, d, sdung14, sdungDong, mua1430: p1430, mua: dong, gapDem: ds[i + 1].o / dong - 1, r2_atc: (ra2 / dong - 1) * 100 - PHI, r2_1430: (ra2 / (p1430 * 1.001) - 1) * 100 - PHI, r3_atc: (ra3 / dong - 1) * 100 - PHI, atcLech: (dong / p1430 - 1) * 100 });
  }
}
console.log(`${soNgay.size} phien co nen 15 phut, ${lenh.length} (ma x ngay) hop le (thanh khoan >= 5 ty).`);
const A = lenh.filter((e) => e.sdungDong);
const B = lenh.filter((e) => e.sdung14);
const C = lenh.filter((e) => e.sdung14 && e.sdungDong);
console.log(`Tin hieu theo DONG CUA cuoi cung (kieu H goc): ${A.length} | tin hieu thay duoc luc 14h30 (>=5% & KL luy ke >= 1,3x TB20): ${B.length} | trung nhau: ${C.length}`);
console.log(`Trong ${A.length} ma "tang >=5% + KL>=1,5x" theo dong cua, ${p((A.filter((e) => e.atcLech >= 1).length / A.length) * 100, 0)}% da tang them >= 1% o phien ATC (chenh lech TB gia 14h30 -> dong cua: ${p(tb(A.map((e) => e.atcLech)))}%)`);
const bao = (ten, a) => a.length < 5 ? console.log(ten, "n", a.length, "(it)") : console.log(ten.padEnd(58), "n", String(a.length).padStart(4), "| gap qua dem", p(tb(a.map((e) => e.gapDem * 100))).padStart(5), "| ban T+2 sau phi: mua ATC", p(tb(a.map((e) => e.r2_atc))).padStart(6), " mua luc 14h30 (+0,1% truot)", p(tb(a.map((e) => e.r2_1430))).padStart(6), "| ban T+3 (mua ATC)", p(tb(a.map((e) => e.r3_atc))).padStart(6));
bao("Tin hieu theo dong cua cuoi (can nhin truoc ATC)", A);
bao("Tin hieu thay duoc luc 14h30 (thuc te)", B);
bao("Co ca hai", C);
bao("Chi luc 14h30 thay, dong cua khong du dieu kien", B.filter((e) => !e.sdungDong));
bao("Chi dong cua cuoi du dieu kien (14h30 chua thay)", A.filter((e) => !e.sdung14));
const tatca = lenh.filter((e) => true);
console.log("Doi chung - moi (ma x ngay) thanh khoan >= 5 ty:", "gap qua dem", p(tb(tatca.map((e) => e.gapDem * 100))), "| ban T+2 mua ATC", p(tb(tatca.map((e) => e.r2_atc))));
