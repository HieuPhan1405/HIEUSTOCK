// SO SANH DIEM B (+ KL DAY) vs CHECKLIST DO DAY vs DIEM MUA HE THONG (Hieu 2026-10-21: "diem B + KL la mua phuc hoi tu day dung ko, se co diem mua som hon diem mua he thong; cac phien 27/7 den 1/8 co bao ma nao ko va so sanh voi checklist bat day").
// (A) Cua so 27/7 - 31/7/2026 (1/8 la thu bay): liet ke moi DIEM B (giam >= 15% tu dinh 20 phien, dong cua tren Tenkan + Kijun, day cach >= 3 phien, GTGD >= 3 ty; co KL day = KL lon nhat 5 phien quanh day >= 2x TB20) va moi SU KIEN CHECKLIST (>= 5 diem, mo rong ra moi ma GTGD >= 3 ty),
//     kem: lai tu mo cua phien sau toi +5 / +10 / +20 phien, gia hien tai, va TIN HIEU MUA THUONG cua he thong (engine): ngay, gia, cao hon gia luc bao bao nhieu %.
// (B) Thong ke chung tu 2022-05: voi su kien B (giam >= 20%) co / khong KL day va su kien checklist, ty le duoc he thong bao MUA trong 20 phien sau, so phien den khi he thong mua (trung vi), he thong mua cao hon gia luc bao bao nhieu % (trung vi),
//     va lai neu mua o diem bao (mo cua phien sau) / neu mua cho he thong bao (mo cua phien sau tin hieu he thong), tinh den 20 phien sau diem vao.
// CHI DOC cache. CACH CHAY: node engine/dich-vu/soSanhDiemBChecklistHeThong.mjs
import { docJson, chayEngine } from "./backtestChung.mjs";
import { tinhChecklistBatDayToanBo } from "../loi/checklistBatDay.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const CP = 0.4;
const DEN = "2026-07-27", TU = "2026-07-31";
const idx = {}; for (const [ma, b] of Object.entries(cache)) idx[ma] = new Map(b.map((x, i) => [x.t, i]));

// ---- tin hieu MUA thuong cua he thong ----
const { lenh } = chayEngine({ cache, vni });
const heThong = {}; for (const t of lenh) if (t.loai === 1) (heThong[t.ma] ||= []).push({ iv: t.iv, ngay: t.ngay, E: t.close[t.iv] });
for (const k of Object.keys(heThong)) heThong[k].sort((p, q) => p.iv - q.iv);
const muaHeThongSau = (ma, i, toiDa = 30) => (heThong[ma] ?? []).find((x) => x.iv > i && x.iv <= i + toiDa) ?? null;

// ---- diem B ----
const evB = [];
for (const [ma, b] of Object.entries(cache)) {
  const n = b.length; if (n < 300) continue;
  const c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v), o = b.map((x) => x.o);
  let ult = -99;
  for (let i = 130; i < n; i++) {
    let gt = 0; for (let j = i - 19; j <= i; j++) gt += (c[j] * v[j]) / 1e6; if (gt / 20 < 3) continue;
    let giam = 0; for (let k = 0; k <= 10; k++) giam = Math.max(giam, (1 - c[i - k] / hh(h, i - k, 20)) * 100);
    if (giam < 15) continue;
    const tk = (hh(h, i, 9) + ll(l, i, 9)) / 2, kj = (hh(h, i, 17) + ll(l, i, 17)) / 2;
    if (!(c[i] > tk && c[i] > kj)) continue;
    const day = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day) kDay = j;
    if (i - kDay < 3 || i - ult < 15) continue;
    ult = i;
    let tb20 = 0; for (let j = kDay - 20; j < kDay; j++) tb20 += v[j]; tb20 /= 20;
    let vMax = 0; for (let j = kDay - 2; j <= Math.min(kDay + 2, i); j++) vMax = Math.max(vMax, v[j]);
    evB.push({ loai: "B", ma, i, t: b[i].t, gia: c[i], giam, kl: tb20 > 0 ? vMax / tb20 : 0, day });
  }
}
// ---- checklist ----
const evCK = [];
for (const s of tinhChecklistBatDayToanBo(new Map(Object.entries(cache)), { namBatDauTheoDoi: 2014 })) {
  const i = idx[s.ma]?.get(s.ngay); if (i == null) continue;
  evCK.push({ loai: "CK", ma: s.ma, i, t: s.ngay, gia: s.gia_luc_tin_hieu, diem: s.diem, kl: s.kl_day ?? 0, giam: s.chiet_khau });
}
function ketQua(e) {
  const b = cache[e.ma], n = b.length, E = b[e.i + 1]?.o; if (!E) return null;
  const r = (k) => (b[e.i + 1 + k] ? (b[e.i + 1 + k].c / E - 1) * 100 - CP : null);
  let mx = -Infinity; for (let j = e.i + 1; j <= Math.min(e.i + 21, n - 1); j++) mx = Math.max(mx, (b[j].h / E - 1) * 100);
  const hts = muaHeThongSau(e.ma, e.i);
  return { E, r5: r(5), r10: r(10), r20: r(20), mx, nay: (b[n - 1].c / E - 1) * 100, hts, htsPremium: hts ? (hts.E / e.gia - 1) * 100 : null, htsSauPhien: hts ? hts.iv - e.i : null };
}

// ---- (A) cua so ----
console.log(`######## (A) CUA SO ${DEN} .. ${TU} ########`);
const inRange = (e) => e.t >= DEN && e.t <= TU;
for (const [ten, ds] of [["DIEM B (giam >= 15%), xep theo KL day", evB.filter(inRange).sort((a, b) => b.kl - a.kl)], ["CHECKLIST DO DAY (>= 5 diem), xep theo diem", evCK.filter(inRange).sort((a, b) => b.diem - a.diem)]]) {
  console.log(`\n== ${ten}: ${ds.length} su kien`);
  console.log(`${"Ma".padEnd(5)} ${"Ngay".padEnd(6)} ${"Gia".padStart(7)} ${"giam%".padStart(5)} ${"KL day".padStart(6)} | ${"+5p".padStart(6)} ${"+10p".padStart(6)} ${"+20p".padStart(6)} ${"max20".padStart(6)} ${"nay".padStart(6)} | He thong bao MUA`);
  for (const e of ds) {
    const k = ketQua(e); if (!k) continue;
    console.log(`${e.ma.padEnd(5)} ${e.t.slice(5).padEnd(6)} ${f(e.gia, 2).padStart(7)} ${f(e.giam).padStart(5)} ${(f(e.kl) + "x").padStart(6)} | ${f(k.r5).padStart(6)} ${f(k.r10).padStart(6)} ${f(k.r20).padStart(6)} ${f(k.mx).padStart(6)} ${f(k.nay).padStart(6)} | ${k.hts ? `${k.hts.ngay.slice(5)} gia ${f(k.hts.E, 2)} (+${f(k.htsPremium)}% so voi gia bao, sau ${k.htsSauPhien} phien)` : "chua / khong bao MUA"}`);
  }
}
// B va checklist cung ma trong cua so
const maB = new Set(evB.filter(inRange).map((e) => e.ma)), maCK = new Set(evCK.filter(inRange).map((e) => e.ma));
console.log(`\nMa co ca DIEM B va CHECKLIST trong cua so: ${[...maB].filter((m) => maCK.has(m)).join(", ") || "-"}; chi B: ${[...maB].filter((m) => !maCK.has(m)).length} ma; chi checklist: ${[...maCK].filter((m) => !maB.has(m)).length} ma`);

// ---- (B) thong ke chung ----
console.log("\n######## (B) THONG KE CHUNG TU 2022-05: tin hieu bao SOM HON he thong khong? ########");
const stat = (ten, ds) => {
  const kq = ds.map((e) => ({ e, k: ketQua(e) })).filter((x) => x.k && x.k.r20 != null);
  if (kq.length < 25) { console.log(`   ${ten.padEnd(34)} n=${kq.length} (it mau)`); return; }
  const coHt = kq.filter((x) => x.k.hts);
  // lai neu mua cho he thong bao (mo cua phien sau tin hieu he thong), giu toi cung moc +20 phien tinh tu diem bao
  const lai20HT = coHt.map((x) => { const b = cache[x.e.ma], j = x.k.hts.iv + 1, jEnd = x.e.i + 21; return b[j] && b[jEnd] && jEnd > j ? (b[jEnd].c / b[j].o - 1) * 100 - CP : null; }).filter((v) => v != null);
  console.log(`   ${ten.padEnd(34)} n=${String(kq.length).padStart(5)} | he thong bao MUA trong 30 phien: ${f((coHt.length / kq.length) * 100, 0)}% (sau ${f(med(coHt.map((x) => x.k.htsSauPhien)), 0)} phien, gia cao hon ${f(med(coHt.map((x) => x.k.htsPremium)))}% - trung vi) | lai 20p mua o diem bao ${f(tb(kq.map((x) => x.k.r20)), 2)}% vs mua cho he thong ${f(tb(lai20HT), 2)}% (n ${lai20HT.length}; mua o diem bao cung nhom: ${f(tb(coHt.map((x) => x.k.r20)), 2)}%)`);
};
const sau = (e) => e.t >= "2022-05-01";
stat("B giam >= 20%, co KL day >= 2x", evB.filter((e) => sau(e) && e.giam >= 20 && e.kl >= 2));
stat("B giam >= 20%, KHONG co KL day", evB.filter((e) => sau(e) && e.giam >= 20 && e.kl < 2));
stat("B giam 15-20%", evB.filter((e) => sau(e) && e.giam < 20));
stat("Checklist >= 5, co KL day >= 2x", evCK.filter((e) => sau(e) && e.kl >= 2));
stat("Checklist >= 5, khong KL day", evCK.filter((e) => sau(e) && e.kl < 2));

// ---- tong hop cua so ----
console.log("\n######## TONG HOP CUA SO ########");
const tongHop = (ten, ds) => {
  const kq = ds.map((e) => ketQua(e)).filter((k) => k && k.r20 != null);
  console.log(`   ${ten.padEnd(40)} n=${String(kq.length).padStart(3)} | +5p ${f(tb(kq.map((k) => k.r5)))} | +10p ${f(tb(kq.map((k) => k.r10)))} | +20p ${f(tb(kq.map((k) => k.r20)))} (thang ${f((kq.filter((k) => k.r20 > 0).length / kq.length) * 100, 0)}%) | max20 TB ${f(tb(kq.map((k) => k.mx)))} | he thong bao MUA ${f((kq.filter((k) => k.hts).length / kq.length) * 100, 0)}%`);
};
const wB = evB.filter(inRange), wC = evCK.filter(inRange);
tongHop("DIEM B tat ca", wB);
tongHop("DIEM B giam >= 20%", wB.filter((e) => e.giam >= 20));
tongHop("DIEM B co KL day >= 2x", wB.filter((e) => e.kl >= 2));
tongHop("DIEM B 15-20% khong KL", wB.filter((e) => e.giam < 20 && e.kl < 2));
tongHop("CHECKLIST tat ca", wC);
tongHop("CHECKLIST co KL day >= 2x", wC.filter((e) => e.kl >= 2));
tongHop("CHECKLIST khong KL day", wC.filter((e) => e.kl < 2));
tongHop("CHECKLIST ngay 28/7 (ngay bao nhieu nhat)", wC.filter((e) => e.t === "2026-07-28"));
console.log(`   So su kien checklist theo ngay: ${["07-27", "07-28", "07-29", "07-30", "07-31"].map((d) => `${d}:${wC.filter((e) => e.t.slice(5) === d).length}`).join(" ")} | diem B theo ngay: ${["07-27", "07-28", "07-29", "07-30", "07-31"].map((d) => `${d}:${wB.filter((e) => e.t.slice(5) === d).length}`).join(" ")}`);
const vi = (d) => { const j = vni.findIndex((x) => x.t === d); return vni[j] ? `${d.slice(5)} ${vni[j].c.toFixed(0)}` : d; };
console.log(`   VN-Index: ${["2026-07-24", "2026-07-27", "2026-07-28", "2026-07-29", "2026-07-30", "2026-07-31", "2026-08-03"].map(vi).join(" | ")}`);

// ---- CUM CHECKLIST: nhieu ma cung bao trong 1 ngay (day cua ca thi truong?) ----
console.log("\n######## CUM CHECKLIST: so ma cung bao checklist trong 1 phien -> lai cac su kien do ########");
{
  const dem = new Map(); for (const e of evCK) dem.set(e.t, (dem.get(e.t) ?? 0) + 1);
  const nhom = (c) => (c >= 25 ? "25+ ma" : c >= 12 ? "12-24 ma" : c >= 5 ? "5-11 ma" : "1-4 ma");
  const out = {};
  for (const e of evCK) {
    if (e.t < "2016-01-01") continue;
    const k = ketQua(e); if (!k || k.r20 == null) continue;
    const key = `${e.t >= "2022-05-01" ? "tu 2022-05" : "truoc 2022-05"} | ${nhom(dem.get(e.t))}`;
    (out[key] ||= []).push(k);
  }
  for (const key of Object.keys(out).sort()) { const a = out[key]; console.log(`   ${key.padEnd(26)} n=${String(a.length).padStart(5)} | 5p ${f(tb(a.map((k) => k.r5)))} | 10p ${f(tb(a.map((k) => k.r10)))} | 20p ${f(tb(a.map((k) => k.r20)))} (thang ${f((a.filter((k) => k.r20 > 0).length / a.length) * 100, 0)}%)`); }
  // VN-Index sau cac ngay cum lon (>= 25 ma): lai 10 / 20 phien
  const ngayLon = [...dem.entries()].filter(([, c]) => c >= 25).map(([d]) => d).sort();
  const cum = []; for (const d of ngayLon) { if (cum.length && (new Date(d) - new Date(cum[cum.length - 1])) / 86400000 < 15) continue; cum.push(d); }
  console.log(`   Cac dot cum >= 25 ma (cach nhau >= 15 ngay), VN-Index sau 10 / 20 phien: ${cum.map((d) => { const j = vni.findIndex((x) => x.t === d); return vni[j + 20] ? `${d} ${((vni[j + 10].c / vni[j].c - 1) * 100).toFixed(1)}%/${((vni[j + 20].c / vni[j].c - 1) * 100).toFixed(1)}%` : `${d} (chua du)`; }).join(" | ")}`);
}
