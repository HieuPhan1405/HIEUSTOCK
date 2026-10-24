// DO BEN CUA SOS (lenh MUA) va SPRING (diem B) - Hieu 2026-10-24 "test". Cau hoi: ket qua cua nghienCuuWyckoff.mjs la that hay do chon nguong may man?
// Quet nhieu bo tham so: SOS = dong cua vuot dinh khung W nen (truoc do 'nhin lai' L nen) kem KL >= k x TB20; SPRING = thung day khung W nen truoc roi dong cua lai tren day trong <= b nen, trong L nen gan nhat.
// W 40 / 60 / 80, k 1,3 / 1,5 / 2, b 2 / 3 / 5, L 5 / 10. Do: so lenh, lai TB (co / khong co su kien), chenh lech, thong ke t, ty le thang - truoc 2022-05 / tu 2022-05 - va TUNG NAM cua bo goc (W 60, k 1,5 / b 3, L 10).
// Lenh MUA = lai/lenh he thong (vao mo cua phien ke tiep, T+2, phi 0,4%); diem B = giam 20-30%, mua mo cua phien ke tiep, lai 10 phien tru phi 0,4%. CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuWyckoffDoBen.mjs
import { docJson, chayEngine, moPhongThucTe } from "./backtestChung.mjs";
import { atr as atrFn } from "../loi/taChiBao.js";
import { tinhIchimoku, tinhDuongCanBangDaiHan } from "../loi/ichimoku.js";
import { tinhDiemMuaPhucHoi } from "../loi/diemMuaPhucHoi.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const sd = (a) => { const m = tb(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const CP = 0.4;
const THAM_SO_SOS = []; for (const W of [40, 60, 80]) for (const k of [1.3, 1.5, 2]) for (const L of [5, 10]) THAM_SO_SOS.push({ W, k, L });
const THAM_SO_SPRING = []; for (const W of [40, 60, 80]) for (const b of [2, 3, 5]) for (const L of [5, 10]) THAM_SO_SPRING.push({ W, b, L });

function sos(d, i, { W, k, L }) {
  const { close, high, vol } = d;
  let H = -Infinity;
  for (let j = i - L - W + 1; j <= i - L; j++) if (high[j] > H) H = high[j];
  for (let j = i - L + 1; j <= i; j++) {
    let tbv = 0; for (let m = j - 20; m < j; m++) tbv += vol[m]; tbv /= 20;
    if (close[j] > H && close[j - 1] <= H && vol[j] >= k * tbv) return true;
  }
  return false;
}
function spring(d, i, { W, b, L }) {
  const { close, low } = d;
  let Lk = Infinity;
  for (let j = i - L - W + 1; j <= i - L; j++) if (low[j] < Lk) Lk = low[j];
  for (let j = i - L + 1; j <= i; j++) if (low[j] < Lk) for (let m = j; m <= Math.min(i, j + b); m++) if (close[m] > Lk) return true;
  return false;
}
const cacheD = new Map();
const lay = (ma) => {
  if (!cacheD.has(ma)) { const n = cache[ma]; cacheD.set(ma, { close: n.map((x) => x.c), high: n.map((x) => x.h), low: n.map((x) => x.l), vol: n.map((x) => x.v ?? 0) }); }
  return cacheD.get(ma);
};

function soSanh(ten, a, hamSK, thamSo, cot) {
  console.log(`\n=== ${ten} ===`);
  console.log(`   ${"tham so".padEnd(18)} | ky      | n co / khong     | lai co | lai khong | chenh (t)       | thang co`);
  for (const ts of thamSo) {
    const nhan = Object.entries(ts).map(([k, v]) => `${k}=${v}`).join(" ");
    for (const [tk, loc] of [["<2022.5", (x) => x.ky === 0], [">=2022.5", (x) => x.ky === 1]]) {
      const d = a.filter(loc);
      const co = d.filter((x) => hamSK(x, ts)).map((x) => x[cot]), khong = d.filter((x) => !hamSK(x, ts)).map((x) => x[cot]);
      if (co.length < 15) { console.log(`   ${nhan.padEnd(18)} | ${tk.padEnd(8)}| ${String(co.length).padStart(4)} / ${String(khong.length).padStart(5)} (it mau)`); continue; }
      const ch = tb(co) - tb(khong), se = Math.sqrt(sd(co) ** 2 / co.length + sd(khong) ** 2 / khong.length);
      console.log(`   ${nhan.padEnd(18)} | ${tk.padEnd(8)}| ${String(co.length).padStart(4)} / ${String(khong.length).padStart(5)}    | ${f(tb(co)).padStart(6)} | ${f(tb(khong)).padStart(9)} | ${f(ch).padStart(5)} (${f(ch / se, 1).padStart(4)}) | ${f((co.filter((v) => v > 0).length / co.length) * 100, 0)}%`);
    }
  }
}
function theoNam(ten, a, hamSK, ts, cot) {
  console.log(`\n--- ${ten}: tung nam (bo goc ${JSON.stringify(ts)}) ---`);
  const nam = [...new Set(a.map((x) => x.nam))].sort();
  for (const n of nam) {
    const d = a.filter((x) => x.nam === n);
    const co = d.filter((x) => hamSK(x, ts)).map((x) => x[cot]), khong = d.filter((x) => !hamSK(x, ts)).map((x) => x[cot]);
    console.log(`   ${n} | co ${String(co.length).padStart(3)}: ${co.length >= 5 ? f(tb(co)).padStart(6) : "  -   "} | khong ${String(khong.length).padStart(4)}: ${f(tb(khong)).padStart(6)} | chenh ${co.length >= 5 ? f(tb(co) - tb(khong)).padStart(6) : "  -   "}`);
  }
}

// (1) lenh MUA thuong -> SOS
const { lenh } = chayEngine({ cache, vni });
const mua = [];
for (const t of lenh) {
  if (t.loai !== 1 || t.iv < 260 || t.iv + 5 >= t.n) continue;
  const E = t.open[t.iv + 1];
  if (!(E > 0) || !(E > t.S)) continue;
  const ret = moPhongThucTe(t, { E, vao: t.iv + 1, banTu: t.iv + 3 });
  if (ret == null || !Number.isFinite(ret)) continue;
  mua.push({ ma: t.ma, i: t.iv, ky: t.ngay < "2022-05-01" ? 0 : 1, nam: t.ngay.slice(0, 4), ret });
}
const sosSK = (x, ts) => sos(lay(x.ma), x.i, ts);
soSanh("LENH MUA THUONG: SOS", mua, sosSK, THAM_SO_SOS, "ret");
theoNam("LENH MUA THUONG: SOS", mua, sosSK, { W: 60, k: 1.5, L: 10 }, "ret");

// (2) diem B -> SPRING
const dB = [];
for (const [ma, b0] of Object.entries(cache)) {
  const b = b0.length > 1500 ? b0.slice(-1500) : b0;
  if (b.length < 400) continue;
  const n = b.length, high = b.map((x) => x.h), low = b.map((x) => x.l), close = b.map((x) => x.c), volume = b.map((x) => x.v), open = b.map((x) => x.o);
  const ich = tinhIchimoku({ high, low }), cb = tinhDuongCanBangDaiHan({ high, low }), a = atrFn({ high, low, close }, 14);
  const { laB } = tinhDiemMuaPhucHoi({ high, low, close, volume, atr: a, tenkan: ich.tenkan, kijun: ich.kijun, cloudTop: ich.cloudTop, cbTop: cb.cbTop }, { giamTuPct: 20, giamDenPct: 30 });
  const d = { close, high, low, vol: volume.map((v) => v ?? 0) };
  for (let i = 120; i < n - 11; i++) {
    if (!laB[i]) continue;
    const E = open[i + 1];
    if (!(E > 0)) continue;
    dB.push({ d, i, ky: b[i].t < "2022-05-01" ? 0 : 1, nam: b[i].t.slice(0, 4), r10: (close[i + 10] / E - 1) * 100 - CP });
  }
}
const sprSK = (x, ts) => spring(x.d, x.i, ts);
soSanh("DIEM B (giam 20-30%): SPRING", dB, sprSK, THAM_SO_SPRING, "r10");
theoNam("DIEM B: SPRING", dB, sprSK, { W: 60, b: 3, L: 10 }, "r10");
