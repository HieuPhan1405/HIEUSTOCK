// DIEM MUA CUA HE THONG SO VOI DAY (Hieu 2026-10-21: "con diem mua he thong hien tai nam o dau" - so voi cac diem A / B / D cua nghienCuuGiaiNganThepBds.mjs).
// (1) LICH SU: lenh Mua thuong cua engine (vao ATC ngay tin hieu): gia cach DAY 20 phien truoc do bao nhieu %, ty le thung day 20 phien sau, sut >= 5% trong 10 phien, lai 10 phien - toan bo va rieng cac lenh co boi canh "da giam >= 15% tu dinh 20 phien trong 10 phien gan nhat".
// (2) HIEN TAI: cac ma THEP / BDS dang co lenh tren web (/api/signals): ngay mua, gia mua, gia hien tai, DAY nhip hoi vua qua (45 phien) va gia mua cach day bao nhieu %.
// CHI DOC cache + API cong khai (can CS_UPLOAD_API_KEY hoac mac dinh khoa doc). CACH CHAY: node engine/dich-vu/diemMuaHeThongSoVoiDay.mjs
import { docJson, chayEngine } from "./backtestChung.mjs";
import { NGANH } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");

const { lenh } = chayEngine({ cache, vni });
const ds = lenh.filter((t) => t.loai === 1 && t.iv >= 130 && t.iv + 21 < t.n);
const danhGia = (t) => {
  const { iv, close, low, high } = t;
  const dayTruoc = ll(low, iv, 20), E = close[iv];
  let m10 = Infinity, m20 = Infinity;
  for (let j = iv + 1; j <= iv + 10; j++) m10 = Math.min(m10, low[j]);
  for (let j = iv + 1; j <= iv + 20; j++) m20 = Math.min(m20, low[j]);
  let boiCanh = false;
  for (let k = 0; k <= 10 && !boiCanh; k++) if (close[iv - k] <= 0.85 * hh(high, iv - k, 20)) boiCanh = true;
  return { cachDay: (E / dayTruoc - 1) * 100, thung: m20 < dayTruoc, sut: m10 <= E * 0.95, r10: (close[iv + 10] / E - 1) * 100 - 0.4, boiCanh, ma: t.ma, ngay: t.ngay };
};
const kq = ds.map(danhGia);
const nhom = (ten, a) => {
  const cd = a.map((x) => x.cachDay).sort((p, q) => p - q);
  console.log(`  ${ten.padEnd(56)} n=${String(a.length).padStart(5)} | cach day TB ${f(tb(cd)).padStart(5)}% trung vi ${f(cd[Math.floor(cd.length / 2)]).padStart(5)}% | thung day ${f((a.filter((x) => x.thung).length / a.length) * 100, 0).padStart(3)}% | sut>=5% ${f((a.filter((x) => x.sut).length / a.length) * 100, 0).padStart(3)}% | lai10 ${f(tb(a.map((x) => x.r10)), 2).padStart(6)}%`);
};
console.log("=== (1) LICH SU: DIEM MUA CUA HE THONG (lenh Mua thuong, vao ATC) ===");
nhom("Tat ca lenh", kq);
nhom("Co boi canh 'da giam >= 15% tu dinh 20 phien' (vung gan day)", kq.filter((x) => x.boiCanh));
nhom("Khong co boi canh (mua giua xu huong / gan dinh)", kq.filter((x) => !x.boiCanh));
const tepNganh = (ten) => new Set(NGANH.get(ten) ?? []);
const thep = tepNganh("Thep"), bds = new Set([...tepNganh("Bat dong san"), ...tepNganh("BDS Khu cong nghiep")]);
nhom("Thep (tat ca lenh)", kq.filter((x) => thep.has(x.ma)));
nhom("BDS + BDS KCN (tat ca lenh)", kq.filter((x) => bds.has(x.ma)));
nhom("BDS + BDS KCN co boi canh gan day", kq.filter((x) => bds.has(x.ma) && x.boiCanh));
const pc = (a, x) => (a.filter((v) => v.cachDay <= x).length / a.length) * 100;
const bc = kq.filter((x) => x.boiCanh);
console.log(`\n  Phan bo khoang cach so voi day (lenh co boi canh gan day, n=${bc.length}): <= 10% ${f(pc(bc, 10), 0)}% | <= 15% ${f(pc(bc, 15), 0)}% | <= 20% ${f(pc(bc, 20), 0)}% | <= 30% ${f(pc(bc, 30), 0)}%`);

// ---- (2) HIEN TAI ----
const goc = process.env.CS_GOC_WEB || "https://www.cloudstock.id.vn";
const khoa = process.env.CS_UPLOAD_API_KEY || "CLOUD";
const sig = (await (await fetch(`${goc}/api/signals`, { headers: { "x-api-key": khoa }, signal: AbortSignal.timeout(30000) })).json()).tinHieu;
console.log(`\n=== (2) HIEN TAI: lenh tren web cua cac ma THEP / BDS (du lieu web luc ${new Date().toLocaleTimeString("vi-VN")}) ===`);
console.log(`${"Ma".padEnd(5)} ${"Tin".padEnd(8)} ${"Ngay mua".padEnd(10)} ${"Gia mua".padStart(8)} ${"Day 45p (ngay, gia)".padEnd(20)} ${"Mua cach day".padStart(12)} ${"Hien".padStart(7)} ${"hien vs mua".padStart(11)}`);
for (const [ten, tap] of [["THEP", thep], ["BDS", bds]]) {
  console.log(`--- ${ten} ---`);
  const dong = [];
  for (const r of sig) {
    if (!tap.has(r.ma) || !["MUA", "NAM GIU"].includes(r.tin)) continue;
    const b = cache[r.ma]; if (!b) continue;
    const n = b.length, l = b.map((x) => x.l);
    let day = n - 1, mn = Infinity;
    for (let j = n - 45; j < n; j++) if (l[j] < mn) { mn = l[j]; day = j; }
    const ngayMua = String(r.ngay_mua).slice(0, 10);
    const giaMua = r.gia_vao_web || r.gia_mua;
    dong.push({ ma: r.ma, txt: `${r.ma.padEnd(5)} ${r.tin.padEnd(8)} ${ngayMua.slice(5).padEnd(10)} ${f(giaMua, 2).padStart(8)} ${(b[day].t.slice(5) + " " + f(mn, 2)).padEnd(20)} ${("+" + f((giaMua / mn - 1) * 100) + "%").padStart(12)} ${f(r.gia, 2).padStart(7)} ${((r.gia / giaMua - 1) * 100 >= 0 ? "+" : "") + f((r.gia / giaMua - 1) * 100) + "%"}`.replace(/\s+$/, ""), ord: ngayMua });
  }
  dong.sort((p, q) => (p.ord < q.ord ? 1 : -1)).forEach((d) => console.log(d.txt));
  if (!dong.length) console.log("  (khong co ma nao dang co lenh)");
}
