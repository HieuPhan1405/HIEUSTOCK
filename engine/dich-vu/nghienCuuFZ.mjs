// Diem F (Piotroski), Z2 (Altman), ROE co du doan loi suat 40 phien sau khi bao cao duoc cong bo khong? (engine/output/phan_tich_co_ban.json + nen_dai.json)
// Vao lenh = mo cua phien dau tien sau (ngay cuoi quy + do tre cong bo: quy 1-3 la 50 ngay, quy 4 la 90 ngay), do lai 40 phien sau so voi TRUNG BINH DEU cac ma phi tai chinh cung ngay.
// CHI co 3 moc quy (31/12/2025, 31/3/2026, 30/6/2026) vi can du 8 quy lich su -> mau nho, chi mang tinh tham khao.
import { readFileSync } from "node:fs";
const doc = (f) => JSON.parse(readFileSync(new URL(`../output/${f}`, import.meta.url), "utf8"));
const pt = doc("phan_tich_co_ban.json");
const nen = doc("nen_dai.json");
const TRE = { "2025-12-31": 90, "2026-03-31": 50, "2026-06-30": 50 };
const HOR = 40;
const cong = (q, n) => { const d = new Date(q + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const p = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");
const ev = [];
for (const [ma, o] of Object.entries(pt)) {
  if (o.loai !== "pi" || !nen[ma]) continue;
  for (const [q, x] of Object.entries(o.q)) {
    if (!TRE[q]) continue;
    const ngay = cong(q, TRE[q]);
    const ds = nen[ma];
    const i = ds.findIndex((b) => b.t >= ngay);
    if (i < 0 || i + HOR >= ds.length) continue;
    let tb20 = 0;
    for (let j = Math.max(0, i - 20); j < i; j++) tb20 += ds[j].v * ds[j].c;
    if (tb20 / 20 / 1e6 < 2) continue; // thanh khoan >= 2 ty/phien
    ev.push({ ma, q, f: x.f, z2: x.z2, vungZ2: x.vungZ2, roe: x.roe, lnYoY: x.lnTTMYoY, r: (ds[i + HOR].c / ds[i].o - 1) * 100, ngay: ds[i].t });
  }
}
const tbQ = {};
for (const e of ev) (tbQ[e.q] ??= []).push(e.r);
for (const e of ev) e.v = e.r - tb(tbQ[e.q]);
console.log(`${ev.length} mau (ma x quy), vuot TB deu cung moc ${HOR} phien`);
const dong = (ten, a) => console.log(ten.padEnd(26), String(a.length).padStart(5), "lai", p(tb(a.map((x) => x.r))).padStart(7), "vuot", p(tb(a.map((x) => x.v))).padStart(7), " theo moc:", Object.keys(TRE).map((q) => p(tb(a.filter((x) => x.q === q).map((x) => x.v)), 1)).join(" / "));
console.log("\nDiem F");
dong("F >= 8", ev.filter((e) => e.f >= 8));
dong("F 6-7", ev.filter((e) => e.f >= 6 && e.f <= 7));
dong("F 4-5", ev.filter((e) => e.f >= 4 && e.f <= 5));
dong("F <= 3", ev.filter((e) => e.f <= 3));
console.log("\nZ2 (Altman)");
for (const z of ["an toàn", "xám", "nguy cơ"]) dong(z, ev.filter((e) => e.vungZ2 === z));
console.log("\nROE TTM");
dong("ROE >= 20%", ev.filter((e) => e.roe >= 20));
dong("ROE 10-20%", ev.filter((e) => e.roe >= 10 && e.roe < 20));
dong("ROE 0-10%", ev.filter((e) => e.roe >= 0 && e.roe < 10));
dong("ROE < 0", ev.filter((e) => e.roe < 0));
console.log("\nTang truong LNST TTM so voi cung ky");
dong("> +30%", ev.filter((e) => e.lnYoY > 30));
dong("0..30%", ev.filter((e) => e.lnYoY >= 0 && e.lnYoY <= 30));
dong("< 0", ev.filter((e) => e.lnYoY < 0));
