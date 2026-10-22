// LENH LO LON CUA HE THONG - DIEM CHUNG DE CAI THIEN (Hieu 2026-10-22: "xem cac lenh lo lon, tim ra diem chung de cai thien").
// Mau: tin hieu MUA thuong (loai 1) cua engine, 2014-2026 (backtest chayEngine), vao o gia DONG CUA phien tin hieu, ban tu T+2 (mo() atc: true, 30% TP1 + 30% TP2 + giu phan con lai, phi 0,4%) - cach giong luc thuc te nhat da dung.
// "LO LON" = lai/lo <= -7% cua ca lenh (gan nhu cham cat lo hoac gap xuong qua cat lo). Gom cac dac trung TAI NGAY TIN HIEU (khong nhin truoc): do gian ra so voi Kijun / MA50, tang 5 / 20 phien truoc, vi tri so voi dinh 252 phien, ATR %, hinh nen tin hieu, gap hom do,
// khoi luong tuong doi, diem engine, ADX, RS, cat lo %, TP1 / cat lo, boi canh thi truong (VN-Index so dinh 60 phien, tren / duoi MA50), nhom von hoa, nganh, thang, lenh truoc cua cung ma lo.
// In: (1) phan bo ket qua + top lenh lo; (2) co che lo (cat lo gap hay cham dung, thoi gian den luc lo); (3) tung dac trung: ty le lo lon theo ngu phan vi; (4) bo loc ung vien (loai bo lenh co dac trung) - lai TB, ty le lo lon, so lenh con lai, truoc / sau 2022-05. CHI DOC cache.
// CACH CHAY: node engine/dich-vu/nghienCuuLenhLoLon.mjs
import { docJson, chayEngine } from "./backtestChung.mjs";
import { mo } from "./moBaoVeLai.mjs";
import { phanLoaiVonHoa } from "../danh-sach/vonHoa.js";
import { nganhCuaMa } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const LO = -7;
const vIdx = new Map(vni.map((x, i) => [x.t, i])), vc = vni.map((x) => x.c);
const vSua = vni.map((_, i) => (i >= 59 ? (vc[i] / hh(vc, i, 60) - 1) * 100 : 0));
const vMa50 = vni.map((_, i) => (i >= 49 ? vc.slice(i - 49, i + 1).reduce((s, x) => s + x, 0) / 50 : null));

const { lenh } = chayEngine({ cache, vni });
const ds0 = lenh.filter((t) => t.loai === 1 && t.iv >= 260).sort((a, b) => (a.ngay < b.ngay ? -1 : 1));
const truocCuaMa = {}; // ma -> { ngayRa, ret } cua lenh truoc
const ds = [];
for (const t of ds0) {
  const r = mo(t, { atc: true }); if (!r) continue;
  const { iv, close, open, high, low, kijun, sma50, atr, relVol } = t, d = t.dacTrung;
  const vi = vIdx.get(t.ngay); if (vi == null || vi < 60) continue;
  const dc = (k) => d[k];
  const truoc = truocCuaMa[t.ma];
  const x = {
    ma: t.ma, ngay: t.ngay, ky: t.ngay < "2022-05-01" ? 0 : 1, ret: r.ret, phien: r.phien, lyDo: r.lyDo, jThoat: r.jThoat, nam: Number(t.ngay.slice(0, 4)), thang: Number(t.ngay.slice(5, 7)),
    gapT1: (open[iv + 1] / close[iv] - 1) * 100, // gap mo cua phien sau - CHI de giai thich (khong dung loc)
    daThungCatLoSomT1: low[iv + 1] <= t.S, // trong T+1 da cham cat lo (chua duoc ban)
    // ---- dac trung tai ngay tin hieu ----
    dgKijun: dc("Gia so voi Kijun (% tren Kijun)"), dgMa50: (close[iv] / sma50[iv] - 1) * 100, tang5: (close[iv] / close[iv - 5] - 1) * 100, tang20: dc("Tang 20 phien truoc do (dong luc)"),
    vsDinh252: (close[iv] / hh(high, iv, 252) - 1) * 100, atrPct: (atr[iv] / close[iv]) * 100, vitriNen: high[iv] > low[iv] ? (close[iv] - low[iv]) / (high[iv] - low[iv]) : 0.5,
    bongTren: high[iv] > low[iv] ? (high[iv] - Math.max(open[iv], close[iv])) / (high[iv] - low[iv]) : 0, tangNgay: (close[iv] / close[iv - 1] - 1) * 100, gapNgay: (open[iv] / close[iv - 1] - 1) * 100,
    relVol: dc("Khoi luong tuong doi (RelVol)"), rank: dc("Diem xep hang engine (diem_rank)"), conf: dc("Diem tin cay (diem_confidence)"), diem: dc("Tong diem luc vao (diem)"), adx: dc("ADX"), rs: dc("Suc manh so voi VN-Index (RS 20 phien)"),
    slPct: dc("Cat lo CHAT (cat lo % nho hon = tot hon)") * -1, tpSl: dc("TP1 / cat lo (ty le thuong/rui ro)"), gtgd: dc("GTGD TB20 (ty/phien)"),
    vniSua: vSua[vi], vniDuoiMa50: vMa50[vi] != null && vc[vi] < vMa50[vi], vni20: (vc[vi] / vc[vi - 20] - 1) * 100,
    nhom: phanLoaiVonHoa(t.ma) || "Khac", nganh: nganhCuaMa(t.ma) || "Khac",
    truocLo: truoc && truoc.ret <= -3 && (new Date(t.ngay) - new Date(truoc.ngayRa)) / 86400000 <= 60,
  };
  truocCuaMa[t.ma] = { ret: r.ret, ngayRa: t.ngayArr[r.jThoat] };
  ds.push(x);
}
const loLon = (x) => x.ret <= LO;
const tongLo = ds.filter((x) => x.ret < 0).reduce((s, x) => s + x.ret, 0);
console.log(`${ds.length} lenh Mua thuong (ATC + T+2). Lai TB ${f(tb(ds.map((x) => x.ret)))}%, trung vi ${f(med(ds.map((x) => x.ret)))}%, ty le thang ${f((ds.filter((x) => x.ret > 0).length / ds.length) * 100, 0)}%`);
const nLo = ds.filter(loLon);
console.log(`LO LON (<= ${LO}%): ${nLo.length} lenh (${f((nLo.length / ds.length) * 100, 1)}%), lo TB ${f(tb(nLo.map((x) => x.ret)))}%; chiem ${f((nLo.reduce((s, x) => s + x.ret, 0) / tongLo) * 100, 0)}% tong so lo; lai TB neu BO HET lenh lo lon: ${f(tb(ds.filter((x) => !loLon(x)).map((x) => x.ret)))}%`);
for (const [ten, a] of [["truoc 2022-05", ds.filter((x) => x.ky === 0)], ["tu 2022-05", ds.filter((x) => x.ky === 1)]]) console.log(`   ${ten}: ${a.length} lenh, lai TB ${f(tb(a.map((x) => x.ret)))}%, lo lon ${f((a.filter(loLon).length / a.length) * 100, 1)}%`);
const TEN_LY = { 1: "tin hieu BAN", 2: "cat lo", 3: "bao ve lai", 4: "duoi Kijun", 5: "het hang", 7: "chinh", 8: "cho ban T+2" };
console.log("\n== CO CHE LO LON ==");
for (const ly of [...new Set(nLo.map((x) => x.lyDo))]) console.log(`   ly do thoat '${TEN_LY[ly] ?? ly}': ${nLo.filter((x) => x.lyDo === ly).length} lenh`);
console.log(`   trong T+1 gia da thung cat lo (chua ban duoc): ${f((nLo.filter((x) => x.daThungCatLoSomT1).length / nLo.length) * 100, 0)}% lenh lo lon (so voi ${f((ds.filter((x) => x.daThungCatLoSomT1).length / ds.length) * 100, 0)}% tat ca lenh)`);
console.log(`   gap mo cua T+1 TB: lo lon ${f(tb(nLo.map((x) => x.gapT1)))}% | tat ca ${f(tb(ds.map((x) => x.gapT1)))}% | gap <= -2%: lo lon ${f((nLo.filter((x) => x.gapT1 <= -2).length / nLo.length) * 100, 0)}% vs tat ca ${f((ds.filter((x) => x.gapT1 <= -2).length / ds.length) * 100, 0)}%`);
console.log(`   so phien giu TB (lo lon): ${f(tb(nLo.map((x) => x.phien)), 1)} | trung vi ${f(med(nLo.map((x) => x.phien)), 1)}`);
console.log("\n== 15 LENH LO NANG NHAT ==");
for (const x of [...ds].sort((a, b) => a.ret - b.ret).slice(0, 15)) console.log(`   ${x.ngay} ${x.ma.padEnd(5)} ${f(x.ret, 1).padStart(6)}% | ly do ${TEN_LY[x.lyDo]} | gap T+1 ${f(x.gapT1, 1)}% | gian Kijun ${f(x.dgKijun, 1)}% | tang20 ${f(x.tang20, 0)}% | cat lo ${f(x.slPct, 1)}% | ${x.nganh}`);

// ---- tung dac trung: ty le lo lon theo ngu phan vi ----
const SO = ["dgKijun", "dgMa50", "tang5", "tang20", "vsDinh252", "atrPct", "vitriNen", "bongTren", "tangNgay", "gapNgay", "relVol", "rank", "conf", "diem", "adx", "rs", "slPct", "tpSl", "gtgd", "vniSua", "vni20"];
const base = (nLo.length / ds.length) * 100;
console.log(`\n== TY LE LO LON THEO NGU PHAN VI (co so ${f(base, 1)}%); cot: Q1(thap) .. Q5(cao) | lai TB moi ngu phan vi ==`);
const luu = [];
for (const k of SO) {
  const a = ds.filter((x) => Number.isFinite(x[k])).sort((p, q) => p[k] - q[k]); const m = Math.floor(a.length / 5);
  const q = [0, 1, 2, 3, 4].map((j) => a.slice(j * m, j === 4 ? a.length : (j + 1) * m));
  const tl = q.map((z) => (z.filter(loLon).length / z.length) * 100), lai = q.map((z) => tb(z.map((x) => x.ret)));
  const cut = [0, 1, 2, 3, 4].map((j) => f(q[j][0][k], 1)).join(" / ");
  luu.push({ k, tl, lai, cut, chenh: Math.max(...tl) - Math.min(...tl) });
}
for (const x of luu.sort((a, b) => b.chenh - a.chenh)) console.log(`   ${x.k.padEnd(10)} lo lon: ${x.tl.map((v) => f(v, 1).padStart(5)).join(" ")}% | lai: ${x.lai.map((v) => f(v, 2).padStart(6)).join(" ")} | cat ${x.cut}`);
// ---- co / khong ----
console.log("\n== DAC TRUNG PHAN LOAI ==");
const nhomKey = (ten, fn) => { const m = new Map(); for (const x of ds) { const k = fn(x); (m.get(k) ?? m.set(k, []).get(k)).push(x); } console.log(`   ${ten}`); for (const [k, a] of [...m.entries()].sort((p, q) => String(p[0]).localeCompare(String(q[0])))) if (a.length >= 80) console.log(`      ${String(k).padEnd(24)} n=${String(a.length).padStart(5)} lo lon ${f((a.filter(loLon).length / a.length) * 100, 1).padStart(5)}% | lai TB ${f(tb(a.map((x) => x.ret)))}%`); };
nhomKey("Thi truong: VN-Index duoi MA50", (x) => (x.vniDuoiMa50 ? "VNI duoi MA50" : "VNI tren MA50"));
nhomKey("Nhom von hoa", (x) => x.nhom); nhomKey("Thang", (x) => String(x.thang).padStart(2, "0")); nhomKey("Lenh truoc cua ma lo (<= -3% trong 60 ngay)", (x) => (x.truocLo ? "co" : "khong"));
nhomKey("Nganh", (x) => x.nganh);

// ---- bo loc ung vien ----
console.log("\n== BO LOC UNG VIEN (loai bo lenh co dac trung): lai TB / ty le lo lon / so lenh con lai - toan bo | truoc 2022-05 | tu 2022-05 ==");
const q80 = (k) => { const a = ds.map((x) => x[k]).filter(Number.isFinite).sort((p, q) => p - q); return a[Math.floor(a.length * 0.8)]; };
const q20 = (k) => { const a = ds.map((x) => x[k]).filter(Number.isFinite).sort((p, q) => p - q); return a[Math.floor(a.length * 0.2)]; };
const UNG = [
  ["bo lenh dang gian Kijun > P80", (x) => x.dgKijun > q80("dgKijun")],
  ["bo lenh tang 20p > P80", (x) => x.tang20 > q80("tang20")],
  ["bo lenh tang 5p > P80", (x) => x.tang5 > q80("tang5")],
  ["bo lenh ATR% > P80", (x) => x.atrPct > q80("atrPct")],
  ["bo lenh cat lo % > P80", (x) => x.slPct > q80("slPct")],
  ["bo lenh bong tren > P80", (x) => x.bongTren > q80("bongTren")],
  ["bo lenh gap len hom do > P80", (x) => x.gapNgay > q80("gapNgay")],
  ["bo lenh RS < P20", (x) => x.rs < q20("rs")],
  ["bo lenh KL tuong doi < P20", (x) => x.relVol < q20("relVol")],
  ["bo lenh VN-Index <= -7% so dinh 60p", (x) => x.vniSua <= -7],
  ["bo lenh co lenh truoc lo (<= -3% / 60 ngay)", (x) => x.truocLo],
  ["bo lenh sat dinh 252p (>= -3%)", (x) => x.vsDinh252 >= -3],
  ["bo lenh vitri nen cuoi ngay < 0,5", (x) => x.vitriNen < 0.5],
];
const hienKQ = (ten, giu) => {
  const kq = (a) => (a.length ? `${f(tb(a.map((x) => x.ret)))}% / ${f((a.filter(loLon).length / a.length) * 100, 1)}% / ${a.length}` : "-");
  console.log(`   ${ten.padEnd(44)} ${kq(giu).padEnd(26)} | ${kq(giu.filter((x) => x.ky === 0)).padEnd(26)} | ${kq(giu.filter((x) => x.ky === 1))}`);
};
hienKQ("(khong loc)", ds);
for (const [ten, loai] of UNG) hienKQ(ten, ds.filter((x) => !loai(x)));

// ---- GIAM LENH LO LON BANG QUY MO VI THE (khong loai lenh): ty trong ~ 1 / rui ro ----
console.log("\n== QUY MO VI THE THEO RUI RO (khong loai lenh; w chuan hoa de TB(w) = 1): lai TB co trong so / do lech chuan lai moi lenh / lai TB / do lech chuan, ty le lo lon (w x lo >= 7%) ==");
const sd = (a) => { const m = tb(a); return Math.sqrt(tb(a.map((x) => (x - m) ** 2))); };
const chuanHoa = (a, fn) => { const w = a.map(fn); const m = tb(w); return w.map((x) => x / m); };
const CACH = [
  ["deu (w = 1)", () => 1],
  ["w ~ 1 / cat lo %", (x) => 1 / Math.max(x.slPct, 1.5)],
  ["w ~ 1 / ATR%", (x) => 1 / Math.max(x.atrPct, 1)],
  ["w ~ 1 / ATR% (toi da 2 lan, toi thieu 0,5)", (x) => Math.min(2, Math.max(0.5, 3 / Math.max(x.atrPct, 1)))],
];
for (const [tenKy, a] of [["toan bo", ds], ["truoc 2022-05", ds.filter((x) => x.ky === 0)], ["tu 2022-05", ds.filter((x) => x.ky === 1)]]) {
  console.log(`  ${tenKy}`);
  for (const [ten, fn] of CACH) {
    const w = chuanHoa(a, fn); const pl = a.map((x, i) => w[i] * x.ret);
    console.log(`     ${ten.padEnd(44)} lai TB ${f(tb(pl), 3).padStart(6)}% | do lech chuan ${f(sd(pl), 2).padStart(5)} | lai/do lech ${f(tb(pl) / sd(pl), 3)} | lenh lo >= 7% von: ${f((pl.filter((v) => v <= LO).length / pl.length) * 100, 1)}% | lo lon nhat ${f(Math.min(...pl), 1)}%`);
  }
}
