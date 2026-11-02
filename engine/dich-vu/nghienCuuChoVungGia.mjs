// TEST "CHO VE VUNG GIA DE GIAI NGAN" (Hieu 03/11/2026: "cac nddt hay doi co phieu ve 1 vung gia de giai ngan") tren ro TICH SAN.
// Moi cuoi thang, voi moi ma trong ro (chat = 15 ma von hoa lon nhat dat bo loc tich san; rong = moi ma dat bo loc, von hoa >= 5.000 ty; doi chung = 30 ma von hoa lon nhat KHONG loc),
// so sanh MUA NGAY (dong cua phien sau) voi DAT LENH CHO o vung gia Z, hieu luc W thang; gia tri tai thoi diem H thang sau (cung moc cho moi cach), von moi ma = 1:
//   - khop khi gia THAP NHAT cham Z (khop o min(gia mo cua, Z)); chua khop het W thang thi: "bo" (giu tien mat, lai 0%) hoac "tran" (mua theo thi truong luc het W thang).
//   - Z: gia cuoi thang x (1 - 5% / 10% / 15% / 20%), hoac ve SMA50 / SMA200 (neu gia dang tren duong do), hoac ve day 120 phien.
//   - "nua-nua" = 1/2 von mua ngay, 1/2 dat lenh cho (bo neu khong khop).
// Gia: nen_dai.json (gia dieu chinh). Phi giao dich bo qua (cung ap dung cho moi cach; lenh cho chi mua 1 lan). Chi gom ma DANG niem yet; von hoa tinh theo so CP hien tai.
// Chay: node engine/dich-vu/nghienCuuChoVungGia.mjs
import { docJson, tb, f } from "./backtestChung.mjs";
import { SO_CP_LUU_HANH } from "../../lib/soCoPhieuLuuHanh.js";

const nen = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const bctc = docJson("bctc_dai.json");
const ngay = vni.map((b) => b.t);
const N = ngay.length;
const idx = new Map(ngay.map((t, i) => [t, i]));
const ma = [], C = [], O = [], L = [], G = [];
for (const [k, bars] of Object.entries(nen)) {
  if (bars.length < 300 || !SO_CP_LUU_HANH[k] || !bctc[k]) continue;
  const c = new Array(N).fill(null), o = new Array(N).fill(null), l = new Array(N).fill(null), g = new Array(N).fill(0);
  for (const b of bars) { const i = idx.get(b.t); if (i != null) { c[i] = b.c; o[i] = b.o ?? b.c; l[i] = b.l ?? b.c; g[i] = b.c * b.v; } }
  let last = null;
  for (let i = 0; i < N; i++) { if (c[i] != null) last = c[i]; else if (last != null) { c[i] = last; o[i] = last; l[i] = last; } }
  ma.push(k); C.push(c); O.push(o); L.push(l); G.push(g);
}
const M = ma.length;
const cong = (d, n) => new Date(Date.parse(d) + n * 86400e3).toISOString().slice(0, 10);
const qsAll = [...new Set(ma.flatMap((k) => Object.keys(bctc[k].q)))].sort();
const lui = (q, k) => qsAll[qsAll.indexOf(q) - k];
const gtv = (b, q, it) => b.q[q]?.[it];
const ttm = (b, q, it) => { let s = 0; for (let k = 0; k < 4; k++) { const x = gtv(b, lui(q, k), it); if (!Number.isFinite(x)) return NaN; s += x; } return s; };
const quyHieuLuc = (t) => { let q = null; for (const x of qsAll) { if (cong(x, 50) <= t) q = x; else break; } return q; };
const cacheCB = new Map();
function coBan(j, q) {
  const key = j + "|" + q;
  if (cacheCB.has(key)) return cacheCB.get(key);
  const b = bctc[ma[j]];
  const ln = ttm(b, q, 23003);
  const vcsh = (gtv(b, q, 14000) ?? NaN) + (gtv(b, q, 15000) ?? 0);
  const no = Number.isFinite(gtv(b, q, 13000)) ? gtv(b, q, 13000) : NaN;
  const lq = gtv(b, q, 23003), q4 = lui(q, 4), lq0 = q4 ? gtv(b, q4, 23003) : NaN;
  const o = { ln, roe: (ln / vcsh) * 100, donBay: no / vcsh, quyKhongGiam: Number.isFinite(lq) && Number.isFinite(lq0) ? lq >= lq0 : null, cfo: ttm(b, q, 32000), tsnh: gtv(b, q, 11000), nnh: gtv(b, q, 13100) };
  cacheCB.set(key, o);
  return o;
}
const tb20 = (j, i) => { let s = 0; for (let k = i - 19; k <= i; k++) s += G[j][k]; return s / 20; };
const thanhKhoan = (j, i) => C[j][i] != null && C[j][i - 130] != null && tb20(j, i) >= 5e6;
const vonHoa = (j, i) => C[j][i] * 1000 * SO_CP_LUU_HANH[ma[j]];
const cuoiThang = [];
for (let i = 0; i < N; i++) if (i === N - 1 || ngay[i].slice(0, 7) !== ngay[i + 1].slice(0, 7)) cuoiThang.push(i);
const R = cuoiThang.filter((i) => ngay[i] >= "2022-01-01" && i + 2 < N);
const viTri = new Map(cuoiThang.map((i, p) => [i, p]));
const cuoiH = (i0, h) => { const p = viTri.get(i0) + h; return p < cuoiThang.length ? Math.min(N - 1, cuoiThang[p] + 1) : null; };

function loc(i0, tuyChon) {
  const q = quyHieuLuc(ngay[i0]);
  if (!q || i0 < 260) return [];
  const kq = [];
  for (let j = 0; j < M; j++) {
    if (!thanhKhoan(j, i0)) continue;
    const von = vonHoa(j, i0);
    if (tuyChon.khongLoc) { kq.push({ j, von }); continue; }
    const b = bctc[ma[j]], cb = coBan(j, q);
    if (!(cb.ln > 0) || von < tuyChon.gioiHan || cb.roe < 12) continue;
    const ln0 = lui(q, 4) ? ttm(b, lui(q, 4), 23003) : NaN;
    const tang = Number.isFinite(ln0) && ln0 > 0 ? cb.ln / ln0 - 1 : cb.quyKhongGiam ? 0.05 : -1;
    if (tang < 0.05) continue;
    if (b.loai === "pi" && (!(cb.cfo > 0) || cb.donBay > 2.5 || !(cb.tsnh / cb.nnh >= 1))) continue;
    kq.push({ j, von });
  }
  kq.sort((a, b) => b.von - a.von);
  return tuyChon.top ? kq.slice(0, tuyChon.top) : kq;
}
const sma = (j, i, n) => { let s = 0; for (let k = i - n + 1; k <= i; k++) s += C[j][k]; return s / n; };
const minC = (j, i, n) => { let m = Infinity; for (let k = i - n + 1; k <= i; k++) m = Math.min(m, C[j][k]); return m; };

// gia dat cho Z (hoac null neu khong ap dung: gia da o duoi vung)
function giaCho(j, i0, loai) {
  const g = C[j][i0];
  if (loai.startsWith("-")) return g * (1 + Number(loai) / 100);
  if (loai === "SMA50") { const z = sma(j, i0, 50); return z < g ? z : null; }
  if (loai === "SMA200") { const z = sma(j, i0, 200); return z < g ? z : null; }
  if (loai === "day120") { const z = minC(j, i0, 120); return z < g ? z : null; }
  return null;
}
// ket qua 1 ma: gia tri cuoi / von, von = 1
function mo(j, i0, H, W, loai, cachKhongKhop) {
  const e = cuoiH(i0, H), hetHan = cuoiH(i0, W);
  if (e == null || hetHan == null) return null;
  const Z = giaCho(j, i0, loai);
  const ngay0 = i0 + 1;
  const mua = C[j][ngay0];
  const now = C[j][e] / mua;
  if (Z == null) return { now, lenh: now, khop: null, chuaKhop: false }; // khong co vung ben duoi: mua ngay
  for (let i = ngay0; i < Math.min(hetHan, e); i++) {
    if (L[j][i] <= Z) {
      const gia = Math.min(O[j][i], Z);
      return { now, lenh: C[j][e] / gia, khop: true };
    }
  }
  return { now, lenh: cachKhongKhop === "tran" ? C[j][e] / C[j][Math.min(hetHan, e)] : 1, khop: false };
}

const UNIVERSE = [
  ["Ro tich san CHAT (15 ma lon nhat dat bo loc)", { gioiHan: 2e13, top: 15 }],
  ["Ro tich san RONG (moi ma dat bo loc, von hoa >= 5.000 ty)", { gioiHan: 5e12 }],
  ["Doi chung: 30 ma von hoa lon nhat KHONG loc", { khongLoc: true, top: 30 }],
];
const VUNG = ["-5", "-10", "-15", "-20", "SMA50", "SMA200", "day120"];
const TEN = { "-5": "gia -5%", "-10": "gia -10%", "-15": "gia -15%", "-20": "gia -20%", SMA50: "ve SMA50", SMA200: "ve SMA200", day120: "ve day 120 phien" };
const W = 3;
for (const H of [6, 12]) {
  for (const [ten, tuyChon] of UNIVERSE) {
    console.log(`\n=============== ${ten} | giu den ${H} thang sau, lenh cho hieu luc ${W} thang ===============`);
    console.log("Vung gia".padEnd(20), "khop%".padStart(6), "| BO neu khong khop: TB x".padStart(26), "hon ngay".padStart(9), "| TRAN (mua cuoi han): TB x".padStart(29), "| mua ngay x".padStart(13), "| nua-nua x".padStart(11), "| lai ma da khop: ngay vs cho".padStart(30));
    for (const loai of VUNG) {
      const bo = [], tran = [], ngayA = [], nuaNua = [], dsK = [], dsKn = [];
      let tong = 0, khop = 0, thangBo = 0, thangTong = 0;
      for (const i0 of R) {
        const ds = loc(i0, tuyChon);
        if (ds.length < 5) continue;
        const a = ds.map((x) => ({ x, b: mo(x.j, i0, H, W, loai, "bo"), t: mo(x.j, i0, H, W, loai, "tran") })).filter((o) => o.b && o.t);
        if (a.length < 5) continue;
        const nowT = tb(a.map((o) => o.b.now));
        bo.push(tb(a.map((o) => o.b.lenh))); tran.push(tb(a.map((o) => o.t.lenh))); ngayA.push(nowT);
        nuaNua.push(tb(a.map((o) => 0.5 * o.b.now + 0.5 * o.b.lenh)));
        thangTong++; if (tb(a.map((o) => o.b.lenh)) > nowT) thangBo++;
        for (const o of a) { if (o.b.khop === null) continue; tong++; if (o.b.khop) { khop++; dsK.push(o.b.now); dsKn.push(o.b.lenh); } }
      }
      if (!ngayA.length) { console.log(TEN[loai].padEnd(20), "khong du du lieu"); continue; }
      console.log(
        TEN[loai].padEnd(20), f((khop / Math.max(1, tong)) * 100, 0).padStart(5) + "%", "|", f(tb(bo), 3).padStart(24), `${thangBo}/${thangTong}`.padStart(9), "|", f(tb(tran), 3).padStart(26), "|", f(tb(ngayA), 3).padStart(11), "|", f(tb(nuaNua), 3).padStart(9), "|",
        `${f((tb(dsK) - 1) * 100, 1)}% -> ${f((tb(dsKn) - 1) * 100, 1)}%`.padStart(28)
      );
    }
  }
}
