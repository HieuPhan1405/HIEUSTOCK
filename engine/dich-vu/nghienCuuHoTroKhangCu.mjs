// NGHIEN CUU (2026-10-14): cac muc theo KHOI LUONG (dinh khoi luong HVN / POC, bien vung gia tri VAL / VAH) co THAT SU la ho tro / khang cu khong?
// Cach kiem: quet moi ma, moi 5 phien. Tai phien t dung ho so khoi luong W phien truoc do (lib/volumeProfile.js - dung CHINH ham cua web), lay:
//   - muc "KL"      : dinh khoi luong gan nhat phia duoi (ho tro) / phia tren (khang cu), cach gia 2..12%
//   - muc "BIEN"    : VAL (duoi) / VAH (tren) neu nam trong 2..12% va khong trung dinh khoi luong
//   - muc "DOI CHUNG": muc gia co khoi luong THAP NHAT (LVN) trong cung dai 2..12%, cach moi dinh >= 1,5%  -> day la "muc gia bat ky" de so sanh
//   - muc "PIVOT"   : day / dinh pivot (+-5 nen, da xac nhan) gan nhat trong cung dai -> ho tro / khang cu kieu co dien
// Sau do nhin 20 phien toi: lan DAU gia cham muc (thap <= muc voi ho tro; cao >= muc voi khang cu). Tu phien cham, theo gia DONG CUA trong 15 phien:
//   ho tro  : "BAT LEN" neu dong cua >= muc +3% truoc; "THUNG" neu dong cua <= muc -3% truoc.   khang cu: "BI DAY XUONG" neu <= muc -3% truoc; "VUOT" neu >= muc +3% truoc.
// Muc nao la ho tro / khang cu that thi ty le GIU phai cao hon muc doi chung o CUNG khoang cach. CI: bootstrap theo cum MA.
// Chay: node engine/dich-vu/nghienCuuHoTroKhangCu.mjs
import { docJson } from "./backtestChung.mjs";
import { tinhHoSoKhoiLuong, timDinhKhoiLuong } from "../../lib/volumeProfile.js";
import { tinhIchimoku, tinhDuongCanBangDaiHan } from "../loi/ichimoku.js";
import { hhv } from "../loi/mang.js";
// SO SANH VOI HO TRO / KHANG CU CU CUA HE THONG (trang chi tiet ma, components/ChiTietMa.js tinhVungGia): Kijun, 2 duong can bang dai han, dinh 52 tuan.
//   "CU"       : muc gan gia nhat trong 4 duong do, GIU NGUYEN gia tri tai phien t (dung nhu con so nguoi dung thay tren web hom do)
//   "CU_DONG"  : cung duong do nhung di theo gia tri MOI moi phien (nguoi dung mo web xem lai moi ngay)
//   "KIJUN" / "KIJUN_DONG", "CB" (duong can bang dai han), "DINH52" (dinh 52 tuan, chi la khang cu)

const cache = docJson("nen_dai.json");
const BIEN = 3, CHO = 20, THEO = 15, K = 5;
const f = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : "-");

function pivotGanNhat(nen, t, W, kieu, lo, hi) {
  for (let j = t - K; j >= t - W + K; j--) {
    const g = kieu === "day" ? nen[j].l : nen[j].h; if (g < lo || g > hi) continue;
    let ok = true;
    for (let k = j - K; k <= j + K; k++) { if (k === j) continue; if (kieu === "day" ? nen[k].l <= g : nen[k].h >= g) { ok = false; break; } }
    if (ok) return g;
  }
  return null;
}
// ket qua sau khi cham: 1 = GIU (ho tro bat len / khang cu day xuong), 0 = MAT (thung / vuot), null = chua ro trong THEO phien
function theoDoi(nen, t, muc, phia) {
  let d = -1;
  for (let k = t + 1; k <= Math.min(nen.length - 1, t + CHO); k++) if (phia === "duoi" ? nen[k].l <= muc : nen[k].h >= muc) { d = k; break; }
  if (d < 0) return undefined; // khong cham
  for (let k = d; k <= Math.min(nen.length - 1, d + THEO); k++) {
    const c = nen[k].c;
    if (phia === "duoi") { if (c <= muc * (1 - BIEN / 100)) return 0; if (c >= muc * (1 + BIEN / 100)) return 1; }
    else { if (c >= muc * (1 + BIEN / 100)) return 0; if (c <= muc * (1 - BIEN / 100)) return 1; }
  }
  return null;
}

// nhu theoDoi nhung muc di theo mang (gia tri moi moi phien); ket qua tinh theo gia tri cua muc tai phien cham
function theoDoiDong(nen, t, arr, phia) {
  let d = -1, muc = null;
  for (let k = t + 1; k <= Math.min(nen.length - 1, t + CHO); k++) { const m = arr[k]; if (m == null) continue; if (phia === "duoi" ? nen[k].l <= m : nen[k].h >= m) { d = k; muc = m; break; } }
  if (d < 0) return undefined;
  for (let k = d; k <= Math.min(nen.length - 1, d + THEO); k++) {
    const c = nen[k].c;
    if (phia === "duoi") { if (c <= muc * (1 - BIEN / 100)) return 0; if (c >= muc * (1 + BIEN / 100)) return 1; }
    else { if (c >= muc * (1 + BIEN / 100)) return 0; if (c <= muc * (1 - BIEN / 100)) return 1; }
  }
  return null;
}

function chay(W) {
  const sk = []; // { ma, nam, phia, loai, cach, kq }
  for (const [ma, nen] of Object.entries(cache)) {
    if (ma === "VNINDEX" || nen.length < W + 60) continue;
    const high = nen.map((b) => b.h), low = nen.map((b) => b.l);
    const { kijun } = tinhIchimoku({ high, low });
    const { cbTop, cbBot } = tinhDuongCanBangDaiHan({ high, low });
    const d52 = hhv(high, 252);
    for (let t = W; t + CHO + THEO < nen.length; t += 5) {
      const cs = nen.slice(t - W + 1, t + 1);
      let gt = 0; for (const b of cs) gt += b.c * b.v; if (gt / W < 3e6) continue; // thanh khoan TB < 3 ty / phien: bo
      const hs = tinhHoSoKhoiLuong(cs, { soHang: 100 }); if (!hs) continue;
      const dinh = timDinhKhoiLuong(hs); const c = nen[t].c; const nam = nen[t].t.slice(0, 4);
      const klMin = (lo, hi) => { let tot = null; for (const r of hs.hang) { const g = (r.tu + r.den) / 2; if (g < lo || g > hi) continue; if (dinh.some((x) => Math.abs(g / x.gia - 1) < 0.015)) continue; if (!tot || r.kl < tot.kl) tot = { g, kl: r.kl }; } return tot ? tot.g : null; };
      for (const phia of ["duoi", "tren"]) {
        const lo = phia === "duoi" ? c * 0.88 : c * 1.02, hi = phia === "duoi" ? c * 0.98 : c * 1.12;
        const trong = dinh.filter((x) => x.gia >= lo && x.gia <= hi);
        const muc = {};
        if (trong.length) muc.KL = phia === "duoi" ? trong[trong.length - 1].gia : trong[0].gia;
        if (trong.length) { const manh = trong.filter((x) => x.doManh >= 0.6); if (manh.length) muc.KL_MANH = phia === "duoi" ? manh[manh.length - 1].gia : manh[0].gia; }
        const bien = phia === "duoi" ? hs.val : hs.vah; if (bien >= lo && bien <= hi && !dinh.some((x) => Math.abs(bien / x.gia - 1) < 0.01)) muc.BIEN = bien;
        const dc = klMin(lo, hi); if (dc != null) muc.DOI_CHUNG = dc;
        const pv = pivotGanNhat(nen, t, W, phia === "duoi" ? "day" : "dinh", lo, hi); if (pv != null) muc.PIVOT = pv;
        // ---- ho tro / khang cu CU cua he thong ----
        const trongDai = (v) => v != null && v >= lo && v <= hi;
        const dong = {}; // loai -> mang de di theo
        if (trongDai(kijun[t])) { muc.KIJUN = kijun[t]; dong.KIJUN_DONG = kijun; }
        // GIA DUOC: cung trang thai (Kijun / duong can bang nam trong dai) nhung dat muc LECH 2% ra xa gia hon. Neu ty le giu van cao nhu muc that thi loi the la do XU HUONG, khong phai do dung duong do.
        if (trongDai(kijun[t])) { const g = kijun[t] * (phia === "duoi" ? 0.98 : 1.02); if (trongDai(g)) muc.KIJUN_LECH = g; }
        { const cb = [cbTop, cbBot].filter((a) => trongDai(a[t])); if (cb.length) { const a = cb.reduce((x, y) => ((phia === "duoi" ? x[t] > y[t] : x[t] < y[t]) ? x : y)); muc.CB = a[t]; const g = a[t] * (phia === "duoi" ? 0.98 : 1.02); if (trongDai(g)) muc.CB_LECH = g; } }
        if (phia === "tren" && trongDai(d52[t])) muc.DINH52 = d52[t];
        { const tat = [kijun, cbTop, cbBot, ...(phia === "tren" ? [d52] : [])].filter((a) => trongDai(a[t]));
          if (tat.length) { const a = tat.reduce((x, y) => ((phia === "duoi" ? x[t] > y[t] : x[t] < y[t]) ? x : y)); muc.CU = a[t]; if (a !== d52) dong.CU_DONG = a; } }
        // co de so sanh TRONG CUNG TRANG THAI: phien nay Kijun / duong can bang co nam trong dai khong (gan vao moi su kien, ke ca muc doi chung)
        const kj = trongDai(kijun[t]), cbx = [cbTop, cbBot].some((a) => trongDai(a[t]));
        for (const [loai, g] of Object.entries(muc)) { const kq = theoDoi(nen, t, g, phia); if (kq === undefined) continue; sk.push({ ma, nam, phia, loai, cach: Math.abs(g / c - 1) * 100, kq, kj, cbx }); }
        for (const [loai, a] of Object.entries(dong)) { const kq = theoDoiDong(nen, t, a, phia); if (kq === undefined) continue; sk.push({ ma, nam, phia, loai, cach: Math.abs(a[t] / c - 1) * 100, kq }); }
      }
    }
  }
  return sk;
}
const tyLe = (g) => { const r = g.filter((x) => x.kq != null); return r.length ? (r.filter((x) => x.kq === 1).length / r.length) * 100 : NaN; };
// chenh ty le GIU giua 2 nhom, CI bootstrap theo cum ma
function chenh(a, b) {
  const ms = [...new Set([...a, ...b].map((x) => x.ma))];
  const G = new Map(ms.map((m) => [m, [0, 0, 0, 0]])); for (const x of a) if (x.kq != null) { const g = G.get(x.ma); g[0] += x.kq; g[1]++; } for (const x of b) if (x.kq != null) { const g = G.get(x.ma); g[2] += x.kq; g[3]++; }
  let seed = 31337; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const kq = []; for (let k = 0; k < 2000; k++) { let s1 = 0, n1 = 0, s2 = 0, n2 = 0; for (let i = 0; i < ms.length; i++) { const g = G.get(ms[Math.floor(rnd() * ms.length)]); s1 += g[0]; n1 += g[1]; s2 += g[2]; n2 += g[3]; } if (n1 && n2) kq.push((s1 / n1 - s2 / n2) * 100); }
  kq.sort((x, y) => x - y); return [tyLe(a) - tyLe(b), kq[Math.floor(kq.length * 0.025)], kq[Math.floor(kq.length * 0.975)]];
}
const NHAN = { KL: "Dinh khoi luong (HVN / POC)", KL_MANH: "Dinh khoi luong MANH (>= 60% dinh lon nhat)", BIEN: "Bien vung gia tri (VAL / VAH)", PIVOT: "Day / dinh pivot (co dien)", DOI_CHUNG: "DOI CHUNG: muc khoi luong thap nhat",
  CU: "HE THONG CU: muc gan nhat (nhu hien tren web)", CU_DONG: "HE THONG CU: muc gan nhat, di theo moi phien", KIJUN: "  rieng Kijun (giu nguyen)", KIJUN_DONG: "  rieng Kijun (di theo moi phien)", CB: "  rieng duong can bang dai han", DINH52: "  rieng dinh 52 tuan",
  KIJUN_LECH: "  GIA DUOC: Kijun lech 2% ra xa gia", CB_LECH: "  GIA DUOC: duong can bang lech 2% ra xa gia" };
// node ... [W]  -> chi chay 1 cua so (vd 120 = cua so dang dung tren web)
for (const W of process.argv[2] ? [Number(process.argv[2])] : [60, 120, 250]) {
  const sk = chay(W);
  console.log(`\n================ CUA SO ${W} PHIEN: ${sk.length} lan cham ================`);
  for (const [phia, ten, giu] of [["duoi", "HO TRO (muc phia duoi gia)", "bat len +3% truoc khi thung -3%"], ["tren", "KHANG CU (muc phia tren gia)", "bi day xuong -3% truoc khi vuot +3%"]]) {
    console.log(`\n--- ${ten}: ty le GIU = ${giu} ---`);
    const g0 = sk.filter((x) => x.phia === phia), dc = g0.filter((x) => x.loai === "DOI_CHUNG");
    for (const loai of ["KL", "KL_MANH", "BIEN", "PIVOT", "CU", "CU_DONG", "KIJUN", "KIJUN_LECH", "KIJUN_DONG", "CB", "CB_LECH", "DINH52", "DOI_CHUNG"]) {
      const g = g0.filter((x) => x.loai === loai); if (!g.length) continue; const [d, lo, hi] = loai === "DOI_CHUNG" ? [0, 0, 0] : chenh(g, dc);
      const theoKC = [[2, 5], [5, 8], [8, 12.5]].map(([a, b]) => { const h = g.filter((x) => x.cach >= a && x.cach < b), h2 = dc.filter((x) => x.cach >= a && x.cach < b); return `${a}-${b}%: ${f(tyLe(h))} (dc ${f(tyLe(h2))})`; }).join(" | ");
      const theoGD = [["2000", "2020"], ["2020", "2023"], ["2023", "2099"]].map(([a, b]) => f(tyLe(g.filter((x) => x.nam >= a && x.nam < b)) - tyLe(dc.filter((x) => x.nam >= a && x.nam < b)))).join(" / ");
      console.log(`   ${NHAN[loai].padEnd(46)} n=${String(g.length).padStart(6)} | GIU ${f(tyLe(g)).padStart(5)}% | chua ro ${f((g.filter((x) => x.kq == null).length / (g.length || 1)) * 100, 0)}%${loai === "DOI_CHUNG" ? "" : ` | so voi doi chung ${d >= 0 ? "+" : ""}${f(d)} diem [CI ${f(lo)} .. ${f(hi)}] | theo giai doan (<=19 / 20-22 / 23+): ${theoGD}`}`);
      console.log(`        theo khoang cach: ${theoKC}`);
    }
    // So sanh TRONG CUNG TRANG THAI (cung cac phien co Kijun / duong can bang nam trong dai): muc that so voi 1 muc gia bat ky cua chinh nhung phien do
    for (const [loai, co, ten] of [["KIJUN", "kj", "Kijun"], ["CB", "cbx", "duong can bang dai han"], ["KL", "kj", "dinh khoi luong (cac phien co Kijun trong dai)"]]) {
      const g = g0.filter((x) => x.loai === loai && x[co]), d2 = dc.filter((x) => x[co]); if (!g.length || !d2.length) continue;
      const [d, lo, hi] = chenh(g, d2);
      const gd = [["2000", "2020"], ["2020", "2023"], ["2023", "2099"]].map(([a, b]) => f(tyLe(g.filter((x) => x.nam >= a && x.nam < b)) - tyLe(d2.filter((x) => x.nam >= a && x.nam < b)))).join(" / ");
      console.log(`   CUNG TRANG THAI - ${ten}: muc that GIU ${f(tyLe(g))}% (n=${g.length}) | muc bat ky GIU ${f(tyLe(d2))}% (n=${d2.length}) | chenh ${d >= 0 ? "+" : ""}${f(d)} diem [CI ${f(lo)} .. ${f(hi)}] | giai doan: ${gd}`);
    }
  }
}
process.exit(0);
