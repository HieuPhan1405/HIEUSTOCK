// MO PHONG DANH MUC CO GIOI HAN SO VI THE cho chien luoc "bat hoi sau giam dai han, cam het nhip hoi" (Hieu 2026-10-21: "ok" - chay buoc mo phong danh muc).
// Nhom co phieu DAI HAN GIAM (dong cua <= 65% dinh 250 phien, dinh cach >= 100 phien, GTGD TB20 >= 3 ty). Tin hieu vao: T1 diem B ngay | T3 pha vung tich luy 40 phien co KL | T4 day sau cao hon + tren Tenkan/Kijun.
// Thoat: MA50 = dong cua duoi MA50 | CH3 / CH4 = dong cua duoi (dinh - 3 / 4 x ATR14), cat lo cung -10%; vao / thoat MO CUA phien sau; phi 0,2% moi chieu.
// DANH MUC: toi da K vi the (5 / 10 / 20), moi vi the = von hien co / K (lai nhap goc), moi ma 1 vi the, nhieu tin hieu cung ngay -> uu tien GTGD lon hon. Cac chien luoc:
//   S1 T4 + MA50 cho moi nganh | S2 T4 + CH4 cho moi nganh | S3 T4 + CH3 cho moi nganh |
//   S4 THEO NGANH: Chung khoan T4+CH4, Thep T4+MA50, Hoa chat T4+CH4, Dau khi diem B+CH4, BDS T3+MA50, Ban le diem B+CH4, nganh khac T4+MA50; BO Ngan hang / CN-Vien thong / Nong nghiep / Thuc pham / Du lich (nghienCuuMoHinhTheoNganh.mjs;
//   LUU Y: S4 chon nganh sau khi da xem du lieu nen la ket qua trong mau, thien cao).
// Do: von cuoi, CAGR, sut giam toi da (theo gia dong cua hang ngay), so lenh, ty le thang, so vi the TB, doi chieu mua giu VN-Index. Toan bo (tu khi du du lieu) va tu 2022-05. CHI DOC cache. CACH CHAY: node engine/dich-vu/moPhongDanhMucHoiSauGiamDai.mjs
import { docJson } from "./backtestChung.mjs";
import { NGANH } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const SL = 0.1, PHI = 0.002;
const NGANH_CUA = new Map(); for (const [ten, ds] of NGANH) for (const m of ds) if (!NGANH_CUA.has(m)) NGANH_CUA.set(m, ten);
const MH = ["T1|CH4", "T3|MA50", "T4|MA50", "T4|CH3", "T4|CH4"];

// ---- tin hieu / lenh doc lap (1 vi the / ma / mo hinh) ----
const lenh = []; // { ma, nganh, mh, tVao, giaVao, tRa, giaRa, gt }
const seri = {}; // ma -> { t: [], c: [], map: Map(t -> idx) }
for (const ma of Object.keys(cache)) {
  const b = cache[ma]; if (!b || b.length < 500) continue;
  const n = b.length, o = b.map((x) => x.o), c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v), t = b.map((x) => x.t);
  seri[ma] = { t, c, map: new Map(t.map((d, i) => [d, i])) };
  const pre = [0]; for (let i = 0; i < n; i++) pre.push(pre[i] + c[i]);
  const sma = (i, k) => (i + 1 >= k ? (pre[i + 1] - pre[i + 1 - k]) / k : null);
  const ma50 = c.map((_, i) => sma(i, 50));
  const tk = c.map((_, i) => (i >= 8 ? (hh(h, i, 9) + ll(l, i, 9)) / 2 : null)), kj = c.map((_, i) => (i >= 16 ? (hh(h, i, 17) + ll(l, i, 17)) / 2 : null));
  const atr = new Array(n).fill(null);
  { let a = null; for (let i = 1; i < n; i++) { const tr = Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1])); if (i === 14) { let s = 0; for (let j = 1; j <= 14; j++) s += Math.max(h[j] - l[j], Math.abs(h[j] - c[j - 1]), Math.abs(l[j] - c[j - 1])); a = s / 14; } else if (i > 14) a = (a * 13 + tr) / 14; if (i >= 14) atr[i] = a; } }
  const nganh = NGANH_CUA.get(ma) ?? "Khac";
  const ultVao = {}, dongDen = {};
  for (let i = 260; i < n - 2; i++) {
    const d250 = hh(h, i, 250); if (!(c[i] <= 0.65 * d250)) continue;
    let iP = i; for (let j = i - 249; j <= i; j++) if (h[j] === d250) iP = j;
    if (i - iP < 100) continue;
    let gt = 0; for (let j = i - 19; j <= i; j++) gt += (c[j] * v[j]) / 1e6; gt /= 20; if (gt < 3) continue;
    const ok = {};
    const day20 = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day20) kDay = j;
    if (c[i] > tk[i] && c[i] > kj[i] && i - kDay >= 3) ok.T1 = true;
    { const d40 = hh(h, i - 1, 40), t40 = ll(l, i - 1, 40); let s = 0; for (let j = i - 20; j < i; j++) s += v[j]; s /= 20; if (c[i] > d40 && (d40 - t40) / d40 <= 0.35 && s > 0 && v[i] >= 1.5 * s) ok.T3 = true; }
    if (ll(l, i, 30) > ll(l, i - 30, 30) && c[i] > tk[i] && c[i] > kj[i]) ok.T4 = true;
    for (const vao of ["T1", "T3", "T4"]) {
      if (!ok[vao] || i - (ultVao[vao] ?? -99) < 20) continue;
      ultVao[vao] = i;
      const E = o[i + 1];
      for (const th of ["MA50", "CH3", "CH4"]) {
        const key = `${vao}|${th}`; if (!MH.includes(key)) continue;
        if (i + 1 <= (dongDen[key] ?? -1)) continue;
        let gia = c[n - 1], jt = n - 1, hi = -Infinity;
        for (let j = i + 1; j < n; j++) {
          if (l[j] <= E * (1 - SL)) { gia = Math.min(o[j], E * (1 - SL)); jt = j; break; }
          hi = Math.max(hi, h[j]);
          const ra = th === "MA50" ? ma50[j] != null && c[j] < ma50[j] : th === "CH3" ? atr[j] != null && c[j] < hi - 3 * atr[j] : atr[j] != null && c[j] < hi - 4 * atr[j];
          if (ra && j + 1 < n) { gia = o[j + 1]; jt = j + 1; break; }
        }
        dongDen[key] = jt;
        lenh.push({ ma, nganh, mh: key, tVao: t[i + 1], giaVao: E, tRa: t[jt], giaRa: gia, gt });
      }
    }
  }
}

// ---- mo phong danh muc ----
const lich = vni.map((x) => x.t);
function moPhong(chonMH, K) {
  const ds = lenh.filter((x) => chonMH(x.nganh) === x.mh).sort((p, q) => (p.tVao < q.tVao ? -1 : p.tVao > q.tVao ? 1 : q.gt - p.gt));
  const vaoTheoNgay = new Map(); for (const x of ds) (vaoTheoNgay.get(x.tVao) ?? vaoTheoNgay.set(x.tVao, []).get(x.tVao)).push(x);
  let tien = 1, vt = []; const eq = []; const lenhDong = [];
  for (const d of lich) {
    if (d < ds[0]?.tVao) continue;
    // thoat
    vt = vt.filter((p) => { if (p.tRa <= d) { tien += p.soCP * p.giaRa * (1 - PHI); lenhDong.push((p.giaRa * (1 - PHI)) / (p.giaVao / (1 - PHI)) - 1); return false; } return true; });
    // vao
    for (const x of vaoTheoNgay.get(d) ?? []) {
      if (vt.length >= K || vt.some((p) => p.ma === x.ma)) continue;
      let giaTri = tien; for (const p of vt) { const i = seri[p.ma].map.get(d); giaTri += p.soCP * (i != null ? seri[p.ma].c[i] : p.giaVao); }
      const von = Math.min(tien, giaTri / K); if (von < 0.5 * giaTri / K) continue;
      tien -= von; vt.push({ ma: x.ma, tRa: x.tRa, giaRa: x.giaRa, giaVao: x.giaVao, soCP: (von * (1 - PHI)) / x.giaVao });
    }
    let giaTri = tien; for (const p of vt) { const s = seri[p.ma], i = s.map.get(d); giaTri += p.soCP * (i != null ? s.c[i] : p.giaVao); }
    eq.push({ d, v: giaTri, n: vt.length });
  }
  return { eq, lenhDong };
}
function thongKe(eq, tu) {
  const a = eq.filter((x) => x.d >= tu); if (a.length < 50) return null;
  const v0 = a[0].v, v1 = a[a.length - 1].v, nam = (new Date(a[a.length - 1].d) - new Date(a[0].d)) / (365.25 * 86400000);
  let pk = -Infinity, dd = 0; for (const x of a) { pk = Math.max(pk, x.v); dd = Math.min(dd, x.v / pk - 1); }
  return { tong: (v1 / v0 - 1) * 100, cagr: (Math.pow(v1 / v0, 1 / nam) - 1) * 100, dd: dd * 100, ptb: a.reduce((s, x) => s + x.n, 0) / a.length };
}
const bhVNI = (tu) => { const a = vni.filter((x) => x.t >= tu); let pk = -Infinity, dd = 0; for (const x of a) { pk = Math.max(pk, x.c); dd = Math.min(dd, x.c / pk - 1); } const nam = (new Date(a[a.length - 1].t) - new Date(a[0].t)) / (365.25 * 86400000); return { tong: (a[a.length - 1].c / a[0].c - 1) * 100, cagr: (Math.pow(a[a.length - 1].c / a[0].c, 1 / nam) - 1) * 100, dd: dd * 100 }; };

const LOAI_BO = new Set(["Ngan hang", "Cong nghe - Vien thong", "Nong nghiep - Chan nuoi", "Thuc pham - Do uong", "Du lich - Giai tri - Truyen thong"]);
const S4 = (ng) => LOAI_BO.has(ng) ? null : ({ "Chung khoan": "T4|CH4", Thep: "T4|MA50", "Hoa chat - Cao su": "T4|CH4", "Dau khi": "T1|CH4", "Bat dong san": "T3|MA50", "Ban le - O to": "T1|CH4" }[ng] ?? "T4|MA50");
const CHIEN_LUOC = { "S1 T4+MA50 moi nganh": () => "T4|MA50", "S2 T4+CH4 moi nganh": () => "T4|CH4", "S3 T4+CH3 moi nganh": () => "T4|CH3", "S4 theo nganh (trong mau)": S4 };
const tuDau = lenh.reduce((m, x) => (x.tVao < m ? x.tVao : m), "9999");
console.log(`${lenh.length} lenh doc lap, tin hieu dau tien ${tuDau}\n`);
for (const tu of [tuDau, "2022-05-01"]) {
  const bh = bhVNI(tu);
  console.log(`######## TU ${tu} ######## (mua giu VN-Index: tong ${f(bh.tong, 0)}%, CAGR ${f(bh.cagr, 1)}%/nam, sut toi da ${f(bh.dd, 0)}%)`);
  for (const [ten, chon] of Object.entries(CHIEN_LUOC)) {
    for (const K of [5, 10, 20]) {
      const { eq, lenhDong } = moPhong(chon, K);
      const s = thongKe(eq, tu); if (!s) continue;
      const thang = (lenhDong.filter((x) => x > 0).length / (lenhDong.length || 1)) * 100;
      console.log(`  ${ten.padEnd(28)} K=${String(K).padStart(2)} | tong ${f(s.tong, 0).padStart(5)}% CAGR ${f(s.cagr, 1).padStart(5)}%/nam | sut toi da ${f(s.dd, 0).padStart(4)}% | vi the TB ${f(s.ptb, 1).padStart(4)} | ${String(lenhDong.length).padStart(4)} lenh thang ${f(thang, 0)}%`);
    }
  }
  console.log("");
}
