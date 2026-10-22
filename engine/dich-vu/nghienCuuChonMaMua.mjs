// CACH CHON MA MUA (Hieu 2026-10-22: "chon ma nhu nao vay, ngau nhien a" - danh muc goi y xep ma theo diem tong cua he thong, chua kiem chung).
// Mau: tin hieu MUA thuong (loai 1) cua engine, 2014-2026 (chayEngine). Moi NGAY co >= 4 tin hieu MUA: xep hang cac ma trong ngay theo tung tieu chi (dacTrung tai nen tin hieu), lay 2 ma DAU va 2 ma CUOI,
// so voi TRUNG BINH CA NGAY (= ky vong khi chon ngau nhien). Lai moi lenh: vao MO CUA phien ke tiep (T+1), cat lo engine, 2 moc chot + phan con lai theo he thong, ban tu T+3, phi 0,4% (moPhongThucTe).
// Do: lai TB 2 ma dau, 2 ma cuoi, trung binh ca ngay; CHENH LECH dau - ngay (TB theo ngay) va thong ke t (chenh lech / sai so chuan) - |t| < 2 coi nhu khong khac ngau nhien. Truoc 2022-05 / tu 2022-05.
// CACH CHAY: node engine/dich-vu/nghienCuuChonMaMua.mjs
import { docJson, chayEngine, moPhongThucTe } from "./backtestChung.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const sd = (a) => { const m = tb(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
const K = 2, TOI_THIEU = 4;

const { lenh } = chayEngine({ cache, vni });
const ds = lenh.filter((t) => t.loai === 1 && t.iv >= 260 && t.iv + 5 < t.n);
for (const t of ds) {
  const E = t.open[t.iv + 1];
  t.ret = E > 0 && E > t.S ? moPhongThucTe(t, { E, vao: t.iv + 1, banTu: t.iv + 3 }) : null;
}
const coRet = ds.filter((t) => t.ret != null && Number.isFinite(t.ret));
console.log(`${coRet.length} lenh MUA thuong co ket qua (vao T+1), lai TB ${f(tb(coRet.map((t) => t.ret)))}%\n`);

const theoNgay = new Map();
for (const t of coRet) { if (!theoNgay.has(t.ngay)) theoNgay.set(t.ngay, []); theoNgay.get(t.ngay).push(t); }
const ngayDu = [...theoNgay.entries()].filter(([, a]) => a.length >= TOI_THIEU).sort((a, b) => (a[0] < b[0] ? -1 : 1));
console.log(`${ngayDu.length} ngay co >= ${TOI_THIEU} tin hieu MUA\n`);

const TIEU_CHI = Object.keys(coRet[0].dacTrung);
const NHOM = [["TRUOC 2022-05", (n) => n < "2022-05-01"], ["TU 2022-05", (n) => n >= "2022-05-01"]];
for (const [tk, loc] of NHOM) {
  const nd = ngayDu.filter(([n]) => loc(n));
  console.log(`######## ${tk}: ${nd.length} ngay ########`);
  console.log(`   ${"tieu chi".padEnd(44)} | top${K} lai | cuoi${K} lai | ca ngay | dau - ngay (t)    | cuoi - ngay (t)`);
  for (const tc of TIEU_CHI) {
    const dDau = [], dCuoi = [], tDau = [], tCuoi = [], tNgay = [];
    for (const [, a] of nd) {
      const x = a.filter((t) => Number.isFinite(t.dacTrung[tc]));
      if (x.length < TOI_THIEU) continue;
      const s = [...x].sort((p, q) => q.dacTrung[tc] - p.dacTrung[tc]);
      const tbNgay = tb(x.map((t) => t.ret));
      const dau = tb(s.slice(0, K).map((t) => t.ret)), cuoi = tb(s.slice(-K).map((t) => t.ret));
      dDau.push(dau - tbNgay); dCuoi.push(cuoi - tbNgay); tDau.push(dau); tCuoi.push(cuoi); tNgay.push(tbNgay);
    }
    if (dDau.length < 30) { console.log(`   ${tc.padEnd(44)} | (it mau: ${dDau.length})`); continue; }
    const t1 = tb(dDau) / (sd(dDau) / Math.sqrt(dDau.length)), t2 = tb(dCuoi) / (sd(dCuoi) / Math.sqrt(dCuoi.length));
    console.log(`   ${tc.padEnd(44)} | ${f(tb(tDau)).padStart(7)} | ${f(tb(tCuoi)).padStart(8)} | ${f(tb(tNgay)).padStart(7)} | ${f(tb(dDau)).padStart(6)} (${f(t1, 1).padStart(5)}) | ${f(tb(dCuoi)).padStart(6)} (${f(t2, 1).padStart(5)})`);
  }
  console.log();
}
