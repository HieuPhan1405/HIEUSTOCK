// NGHIEN CUU "FREE FLOAT TRONG 1 VUNG GIA" (Hieu 26/10/2026): khoi luong da giao dich trong 250 phien gan nhat TAI MOT VUNG GIA / so co phieu tu do chuyen nhuong
// = so lan luong co phieu troi noi da "doi tay" o vung gia do. Gia thuyet: vung phia TREN gia hien tai co F cao = co phieu ket o tren da duoc chuyen tay (ap luc ban ke); vung phia DUOI co F cao = day da duoc gom ky.
// Khoi luong moi nen chia DEU theo khoang low-high cua nen (uoc luong - khong co du lieu khop tung muc gia, giong Volume Profile cua web). Vao lenh = mo cua phien sau.
// Chay: node engine/dich-vu/nghienCuuFreeFloatVungGia.mjs (can nen_dai.json + free_float.json: taiFreeFloat.mjs)
import { readFileSync } from "node:fs";

const nen = JSON.parse(readFileSync(new URL("../output/nen_dai.json", import.meta.url), "utf8"));
const ff = JSON.parse(readFileSync(new URL("../output/free_float.json", import.meta.url), "utf8"));
const TU = "2023-02-01";
const L = 250;

function troiTai(ma, ngay) {
  let kq = null;
  for (const x of ff[ma] ?? []) {
    if (x.d <= ngay) kq = x;
    else break;
  }
  kq ??= (ff[ma] ?? [])[0];
  if (!kq || !(Number(kq.sh) > 0)) return null;
  return Math.min(1, Math.max(0.03, Number(kq.ff))) * Number(kq.sh);
}
// khoi luong cua cac nen [a..b] roi vao khoang gia [lo, hi]
function klTrongVung(ds, a, b, lo, hi) {
  let s = 0;
  for (let j = a; j <= b; j++) {
    const { l, h, v } = ds[j];
    if (h <= lo || l >= hi) continue;
    if (h === l) {
      if (l >= lo && l < hi) s += v;
      continue;
    }
    s += (v * (Math.min(h, hi) - Math.max(l, lo))) / (h - l);
  }
  return s;
}
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const p = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");

// lai 20 phien TB cua tat ca ma theo ngay vao lenh
const tt = new Map();
for (const ds of Object.values(nen)) for (let i = 1; i < ds.length - 21; i++) if (ds[i].t >= TU && ds[i].o > 0) { const a = tt.get(ds[i].t) ?? [0, 0]; a[0] += (ds[i + 20].c / ds[i].o - 1) * 100; a[1]++; tt.set(ds[i].t, a); }

const ev = [];
for (const [ma, ds] of Object.entries(nen)) {
  for (let i = L; i < ds.length - 22; i += 10) {
    if (ds[i].t < TU) continue;
    let tb20 = 0;
    for (let j = i - 19; j <= i; j++) tb20 += ds[j].v;
    if (tb20 / 20 < 100000) continue;
    const troi = troiTai(ma, ds[i].t);
    if (!troi) continue;
    const c = ds[i].c;
    const a = i - L + 1;
    const Fa = klTrongVung(ds, a, i, c, c * 1.1) / troi; // vung 0..+10% phia tren
    const Fb = klTrongVung(ds, a, i, c * 0.9, c) / troi; // vung 0..-10% phia duoi
    const Fm = klTrongVung(ds, a, i, c * 0.95, c * 1.05) / troi; // +-5% quanh gia
    const vao = ds[i + 1].o;
    if (!(vao > 0)) continue;
    const r20 = (ds[i + 21].c / vao - 1) * 100;
    let cao = -Infinity, thap = Infinity;
    for (let j = i + 1; j <= i + 20; j++) { cao = Math.max(cao, ds[j].h); thap = Math.min(thap, ds[j].l); }
    const m = tt.get(ds[i + 1].t);
    let hh250 = 0; for (let j = a; j <= i; j++) if (ds[j].h > hh250) hh250 = ds[j].h;
    ev.push({ ma, ngay: ds[i].t, gan: c / hh250, Fa, Fb, Fm, r20, vuot: m ? r20 - m[0] / m[1] : NaN, len10: (cao / vao - 1) * 100 >= 10, xuong10: (thap / vao - 1) * 100 <= -10 });
  }
}
console.log(`${ev.length} mau (moi ma lay 1 diem / 10 phien, tu ${TU}, KL TB20 >= 100.000)`);

function nhomNguyenVi(khoa, ten) {
  const s = [...ev].sort((x, y) => x[khoa] - y[khoa]);
  const q = 5;
  console.log(`\n${ten}: chia ${q} nhom bang nhau theo ${khoa}`);
  console.log("nhom".padEnd(6), "F tu..den".padEnd(14), "n".padStart(6), "TB20".padStart(7), "vuotTT".padStart(8), "thang20".padStart(8), "len>=10%".padStart(9), "xuong<=-10%".padStart(12));
  for (let k = 0; k < q; k++) {
    const a = s.slice(Math.floor((k * s.length) / q), Math.floor(((k + 1) * s.length) / q));
    console.log(String(k + 1).padEnd(6), `${p(a[0][khoa])}-${p(a.at(-1)[khoa])}`.padEnd(14), String(a.length).padStart(6), p(tb(a.map((x) => x.r20))).padStart(7), p(tb(a.filter((x) => Number.isFinite(x.vuot)).map((x) => x.vuot))).padStart(8), p((a.filter((x) => x.r20 > 0).length / a.length) * 100, 1).padStart(8), p((a.filter((x) => x.len10).length / a.length) * 100, 1).padStart(9), p((a.filter((x) => x.xuong10).length / a.length) * 100, 1).padStart(12));
  }
}
nhomNguyenVi("Fa", "Co phieu da doi tay o vung +0..+10% PHIA TREN gia");
nhomNguyenVi("Fb", "Co phieu da doi tay o vung -10..0% PHIA DUOI gia");
nhomNguyenVi("Fm", "Co phieu da doi tay o vung +-5% QUANH gia");

// tuong quan hang
const rank = (a) => { const idx = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = new Array(a.length); idx.forEach(([, i], k) => (r[i] = k)); return r; };
const sp = (x, y) => { const rx = rank(x), ry = rank(y), mx = tb(rx), my = tb(ry); let a = 0, b = 0, c = 0; for (let i = 0; i < x.length; i++) { a += (rx[i] - mx) * (ry[i] - my); b += (rx[i] - mx) ** 2; c += (ry[i] - my) ** 2; } return a / Math.sqrt(b * c); };
const ok = ev.filter((x) => Number.isFinite(x.vuot));
console.log("\nTuong quan hang (Spearman) voi lai 20 phien VUOT thi truong:");
for (const k of ["Fa", "Fb", "Fm"]) console.log(" ", k, p(sp(ok.map((x) => x[k]), ok.map((x) => x.vuot)), 3));
for (const nam of ["2023", "2024", "2025", "2026"]) {
  const a = ok.filter((x) => x.ngay.startsWith(nam));
  console.log(" ", nam, `n=${a.length}`, "Fa", p(sp(a.map((x) => x.Fa), a.map((x) => x.vuot)), 3), "Fb", p(sp(a.map((x) => x.Fb), a.map((x) => x.vuot)), 3), "Fm", p(sp(a.map((x) => x.Fm), a.map((x) => x.vuot)), 3));
}
// ket hop: nhieu cung tren (Fa cao) + it duoi
const ft = [...ev].sort((x, y) => x.Fa - y.Fa);
const caoA = ev.filter((x) => x.Fa >= ft[Math.floor(ev.length * 0.8)].Fa);
const thapA = ev.filter((x) => x.Fa <= ft[Math.floor(ev.length * 0.2)].Fa);
console.log(`\nFa top 20% (nhieu co phieu ket phia tren): TB20 ${p(tb(caoA.map((x) => x.r20)))}, len>=10% ${p((caoA.filter((x) => x.len10).length / caoA.length) * 100, 1)}%`);
console.log(`Fa bottom 20% (it vat can phia tren):       TB20 ${p(tb(thapA.map((x) => x.r20)))}, len>=10% ${p((thapA.filter((x) => x.len10).length / thapA.length) * 100, 1)}%`);

// KIEM CHUNG: Fa thap co phai chi la "gia dang sat dinh 250 phien" (hieu ung da biet)? Chia theo khoang cach toi dinh roi xet Fa BEN TRONG tung khoang.
console.log("KIEM CHUNG: tuong quan hang Fa ~ lai vuot TT BEN TRONG tung khoang cach toi dinh 250 phien");
const sg = [...ok].sort((x, y) => x.gan - y.gan);
for (let k = 0; k < 5; k++) {
  const a = sg.slice(Math.floor((k * sg.length) / 5), Math.floor(((k + 1) * sg.length) / 5));
  const sa = [...a].sort((x, y) => x.Fa - y.Fa);
  const t = sa.slice(0, Math.floor(a.length / 3)), c = sa.slice(-Math.floor(a.length / 3));
  console.log(`gia/dinh250 ${p(a[0].gan)}-${p(a.at(-1).gan)}  n=${a.length}  tuong quan Fa~vuot ${p(sp(a.map((x) => x.Fa), a.map((x) => x.vuot)), 3)}  | Fa thap vuot ${p(tb(t.map((x) => x.vuot)))}  Fa cao vuot ${p(tb(c.map((x) => x.vuot)))}`);
}
