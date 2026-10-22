// VAO MO CUA T+1 va CAT LO THEO ATR (Hieu 2026-10-22: "test vao mo cua T+1 va cat lo theo ATR di") - de giam lenh lo lon (nghienCuuLenhLoLon.mjs: 87% lenh lo lon la cat lo, ATC + T+2 khien cat lo 3,5-6% thanh lo TB -8,8%).
// Mau: tin hieu MUA thuong (loai 1) cua engine, 2014-2026 (chayEngine). Dung moPhongThucTe() (backtestChung.mjs): 30% TP1 + 30% TP2 (muc chot cua engine, khong doi), phan con lai chay; cham cat lo / co tin hieu BAN truoc ngay ban duoc thi ban o MO CUA ngay ban duoc dau tien (T+2 ke tu ngay mua); phi 0,4%.
// VAO: ATC = dong cua phien tin hieu (co so, ban tu T+2) | T1 = MO CUA phien ke tiep (ban tu T+3 vi mua o T+1) co bo loc gap: T1 tat ca (chi bo neu gia mo cua <= cat lo) | T1 gap > -2% (bo neu gap xuong >= 2%) | T1 gap -2%..+3% (bo ca gap len > 3%, tranh duoi gia).
// CAT LO: ENGINE = cat lo cau truc cua engine (3,5-6%) | ATR k = gia vao - k x ATR14 (tai ngay tin hieu), k = 1,5 / 2 / 3 | KHOA 3-10% = ATR k=2 nhung kep cat lo trong 3% .. 10% gia vao | RONG = min(cat lo engine, gia vao - 2 ATR) (rong hon trong hai).
// Do: lai TB / lenh DA VAO, ty le lo >= 7%, lo trung binh khi lo, ty le thang, he so loi nhuan (PF), so lenh vao / tong tin hieu, VA lai TB tren MOI TIN HIEU (lenh bi bo tinh 0) - de so cong bang khi bo loc loai bot lenh. Truoc 2022-05 / tu 2022-05. CHI DOC cache.
// CACH CHAY: node engine/dich-vu/nghienCuuVaoT1CatLoATR.mjs
import { docJson, chayEngine, moPhongThucTe } from "./backtestChung.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const LO = -7;
const { lenh } = chayEngine({ cache, vni });
const ds = lenh.filter((t) => t.loai === 1 && t.iv >= 260 && t.iv + 5 < t.n).sort((a, b) => (a.ngay < b.ngay ? -1 : 1));

const VAO = {
  "ATC (co so)": (t) => ({ E: t.close[t.iv], vao: t.iv, banTu: t.iv + 2 }),
  "T1 tat ca": (t) => dauT1(t, -Infinity, Infinity),
  "T1 bo gap xuong >= 2%": (t) => dauT1(t, -2, Infinity),
  "T1 gap -2%..+3%": (t) => dauT1(t, -2, 3),
};
function dauT1(t, gapMin, gapMax) {
  const E = t.open[t.iv + 1], gap = (E / t.close[t.iv] - 1) * 100;
  if (gap < gapMin || gap > gapMax) return null;
  return { E, vao: t.iv + 1, banTu: t.iv + 3 };
}
const atrTai = (t) => (t.atr[t.iv] > 0 ? t.atr[t.iv] : t.close[t.iv] * 0.03);
const STOP = {
  "cat lo ENGINE": (t, E) => t.S,
  "ATR 1,5": (t, E) => E - 1.5 * atrTai(t),
  "ATR 2": (t, E) => E - 2 * atrTai(t),
  "ATR 3": (t, E) => E - 3 * atrTai(t),
  "ATR 2 kep 3-10%": (t, E) => Math.min(E * 0.97, Math.max(E * 0.9, E - 2 * atrTai(t))),
  "RONG (min engine, ATR 2)": (t, E) => Math.min(t.S, E - 2 * atrTai(t)),
};
function chay(t, vaoFn, stopFn) {
  const v = vaoFn(t); if (!v) return { boQua: true };
  const S = stopFn(t, v.E);
  if (!(S > 0) || !(S < v.E) || !(v.E > t.S * 0.995 && stopFn === STOP["cat lo ENGINE"] ? v.E > t.S : true)) return { boQua: true };
  const r = moPhongThucTe({ ...t, S }, { E: v.E, vao: v.vao, banTu: v.banTu });
  return r == null ? { boQua: true } : { ret: r };
}
const pf = (a) => { const w = a.filter((x) => x > 0).reduce((s, x) => s + x, 0), l = -a.filter((x) => x <= 0).reduce((s, x) => s + x, 0); return l ? w / l : NaN; };
const dong = (ten, kq, tong) => {
  const r = kq.filter((x) => !x.boQua).map((x) => x.ret);
  if (r.length < 30) { console.log(`   ${ten.padEnd(46)} (it mau: ${r.length})`); return; }
  const lo = r.filter((x) => x <= LO), thua = r.filter((x) => x < 0);
  console.log(`   ${ten.padEnd(46)} vao ${String(r.length).padStart(4)}/${tong} | lai TB ${f(tb(r)).padStart(5)}% | tren moi tin hieu ${f((r.reduce((s, x) => s + x, 0) / tong), 3).padStart(6)}% | lo >= 7%: ${f((lo.length / r.length) * 100, 1).padStart(4)}% | lo TB khi thua ${f(tb(thua)).padStart(6)}% | thang ${f((r.filter((x) => x > 0).length / r.length) * 100, 0)}% | PF ${f(pf(r))} | lo nang nhat ${f(Math.min(...r), 1)}%`);
};
const nhom = [["TRUOC 2022-05", ds.filter((t) => t.ngay < "2022-05-01")], ["TU 2022-05", ds.filter((t) => t.ngay >= "2022-05-01")]];
for (const [tk, a] of nhom) {
  console.log(`\n######## ${tk}: ${a.length} tin hieu ########`);
  for (const [tv, vf] of Object.entries(VAO)) {
    console.log(` -- vao: ${tv}`);
    for (const [ts, sf] of Object.entries(STOP)) dong(ts, a.map((t) => chay(t, vf, sf)), a.length);
  }
}
