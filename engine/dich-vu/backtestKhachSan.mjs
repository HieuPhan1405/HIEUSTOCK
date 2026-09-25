// BACKTEST "KHACH SAN ICHIMOKU" dung LUAT trong video ITP Club (Thai Le, "Kinh doanh co phieu theo khach san"):
//  - Bo 9-17 (Tenkan 9, Kijun 17). Khach san = vung giua Tenkan va Kijun. CHI 2 truong hop:
//    TH1 (xu huong tang): Kijun di ngang + Tenkan di LEN + gia nam TREN  -> gia bi hut ve khach san roi TIEP TUC TANG.
//    TH2 (xu huong giam): Kijun di ngang + Tenkan di XUONG + gia nam DUOI -> gia bi hut LEN khach san roi TIEP TUC GIAM.
//  - "Pha khach san" = gia DONG CUA cat qua Kijun (TH1: dong cua < Kijun) -> quay lai da cu. Diem mua tot nhat:
//    gia ve khach san, KHONG pha, roi bat len nam tren Tenkan va Kijun. Ket hop voi duong can bang dai han = "cap manh".
//  - Cung ap dung tren do thi TUAN.
// Tham so chua qua chinh: Kijun phang = khong doi 5 phien (nhay cam 3/10), Tenkan "di len/xuong" = so voi 3 phien truoc, gia
// cach Tenkan >= 2% (co "mat can bang" that). Vao gia dong cua, tru 0.4% phi+thue, "vuot TT" tru TB thi truong cung ngay/tuan.
// CACH CHAY: node engine/dich-vu/backtestKhachSan.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tinhIchimoku, tinhDuongCanBangDaiHan } from "../loi/ichimoku.js";
import { hhv, llv, sma } from "../loi/mang.js";

const cache = JSON.parse(readFileSync(fileURLToPath(new URL("../output/" + (process.argv[2] || "nen_backtest.json"), import.meta.url)), "utf-8"));
const CHI_CB = process.argv[3] === "cb"; // chi chay phan ket hop khach san + duong can bang dai han
const CHI_PHI = 0.4;
const GTGD_TOI_THIEU_TY = 5;
const NAM_OOS = "2025";
const CACH_TENKAN = 0.02;

const phangArr = (m, w) => {
  const c = hhv(m, w), t = llv(m, w);
  return m.map((v, i) => v != null && c[i] != null && t[i] != null && c[i] - t[i] === 0);
};
const mondayKey = (t) => {
  const d = new Date(t + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
function gopTuan(nen) {
  const kq = [];
  for (const b of nen) {
    const k = mondayKey(b.t);
    const cuoi = kq[kq.length - 1];
    if (cuoi && cuoi.t === k) {
      cuoi.h = Math.max(cuoi.h, b.h);
      cuoi.l = Math.min(cuoi.l, b.l);
      cuoi.c = b.c;
      cuoi.v += b.v;
    } else kq.push({ t: k, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v });
  }
  return kq;
}
function chuanBi(ma, nen, chiaNgay) {
  const high = nen.map((b) => b.h), low = nen.map((b) => b.l), close = nen.map((b) => b.c), open = nen.map((b) => b.o), vol = nen.map((b) => b.v);
  const ich = tinhIchimoku({ high, low });
  const cb = tinhDuongCanBangDaiHan({ high, low });
  const gtgd = sma(close.map((c, i) => (c * vol[i]) / 1e6 / chiaNgay), chiaNgay === 1 ? 20 : 4);
  return { ma, nen, n: nen.length, high, low, close, open, ich, cb, gtgd };
}
const ngay = Object.entries(cache).map(([ma, nen]) => chuanBi(ma, nen, 1));
const tuan = Object.entries(cache).map(([ma, nen]) => chuanBi(ma, gopTuan(nen), 5));

function thiTruong(khung, hz, batDau) {
  const m = hz.map(() => new Map());
  for (const d of khung)
    for (let i = batDau; i < d.n; i++) {
      if (!(d.gtgd[i] >= GTGD_TOI_THIEU_TY)) continue;
      hz.forEach((h, k) => {
        if (i + h >= d.n) return;
        const x = m[k].get(d.nen[i].t) ?? { tong: 0, dem: 0 };
        x.tong += d.close[i + h] / d.close[i] - 1;
        x.dem += 1;
        m[k].set(d.nen[i].t, x);
      });
    }
  return (k, key) => {
    const x = m[k].get(key);
    return x && x.dem >= 30 ? x.tong / x.dem : null;
  };
}

const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (v, dp = 2) => (Number.isFinite(v) ? v.toFixed(dp) : "  -  ");
const pc = (a) => (a.length ? (a.filter(Boolean).length / a.length) * 100 : NaN);

// ---------- Khach san: TH1 (mua khi ve khach san) va TH2 (hut len) ----------
function chayKhachSan(khung, { hz, hutMax, batDau, kPhangW, tuanKhung, dedup }) {
  const tbTT = thiTruong(khung, hz, batDau);
  const ketQua = { th1Setup: [], th1E1: [], th1E2: [], th2Setup: [], th2Cham: [] };
  for (const d of khung) {
    const kPhang = kPhangW == null ? null : phangArr(d.ich.kijun, kPhangW);
    const { kijun, tenkan } = d.ich;
    const hopLe = (i) => kijun[i] != null && tenkan[i] != null && tenkan[i - 3] != null && d.gtgd[i] >= GTGD_TOI_THIEU_TY && d.high[i] !== d.low[i];
    const kp5 = kPhangW == null ? phangArr(d.ich.kijun, 5) : null;
    const isPhang = (i) => (kPhangW == null ? !kp5[i] : kPhang[i]);
    const s1 = (i) => hopLe(i) && isPhang(i) && tenkan[i] > tenkan[i - 3] && tenkan[i] > kijun[i] && d.close[i] >= tenkan[i] * (1 + CACH_TENKAN);
    const s2 = (i) => hopLe(i) && isPhang(i) && tenkan[i] < tenkan[i - 3] && tenkan[i] < kijun[i] && d.close[i] <= tenkan[i] * (1 - CACH_TENKAN);
    const ret = (e, h) => (d.close[e + h] / d.close[e] - 1) * 100;
    const vuot = (e, k) => {
      const t = tbTT(k, d.nen[e].t);
      return t == null ? null : ret(e, hz[k]) - t * 100;
    };
    const tao = (e, extra = {}) => {
      const sk = { ma: d.ma, nam: d.nen[e].t.slice(0, 4), ret: [], vuot: [], ...extra };
      hz.forEach((h, k) => {
        sk.ret.push(ret(e, h));
        sk.vuot.push(vuot(e, k));
      });
      // Phien ban CAT LO: thoat khi dong cua < Kijun (pha khach san), muon nhat o horizon cuoi.
      const H = hz[hz.length - 1];
      let gia = d.close[e + H];
      for (let j = e + (tuanKhung ? 1 : 2); j <= e + H; j++) if (d.close[j] < kijun[j]) { gia = d.close[j]; break; }
      sk.stop = (gia / d.close[e] - 1) * 100;
      return sk;
    };
    let luc = -100;
    for (let s = batDau; s < d.n - hz[hz.length - 1] - hutMax - 1; s++) {
      // ---- TH1 ----
      if (s1(s) && !s1(s - 1) && s - luc >= dedup) {
        let vao = -1;
        let pha = false;
        for (let t = s + 1; t <= s + hutMax; t++) {
          if (d.close[t] < kijun[t]) { pha = true; break; }
          if (d.low[t] <= tenkan[t]) { vao = t; break; }
        }
        ketQua.th1Setup.push({ ma: d.ma, vao: vao >= 0, pha });
        if (vao >= 0) {
          luc = s;
          ketQua.th1E1.push(tao(vao));
          for (let u = vao + 1; u <= vao + 5 && u < d.n - hz[hz.length - 1]; u++) {
            if (d.close[u] < kijun[u]) break;
            if (d.close[u] > Math.max(tenkan[u], kijun[u]) && d.close[u] > d.close[u - 1]) {
              ketQua.th1E2.push(tao(u));
              break;
            }
          }
        }
      }
      // ---- TH2 ----
      if (s2(s) && !s2(s - 1)) {
        let cham = -1;
        let phaLen = false;
        for (let t = s + 1; t <= s + hutMax; t++) {
          if (d.close[t] > kijun[t]) { phaLen = true; break; }
          if (d.high[t] >= tenkan[t]) { cham = t; break; }
        }
        ketQua.th2Setup.push({ ma: d.ma, cham: cham >= 0, phaLen });
        if (cham >= 0) ketQua.th2Cham.push(tao(cham));
      }
    }
  }
  return ketQua;
}

function inNhom(ten, ds, hz, tuanKhung, coStop = true) {
  if (!ds.length) return console.log(`${ten}: khong co su kien`);
  const oosH = hz.length - 1;
  const cot = hz.map((h, k) => `${tuanKhung ? "T+" + h + "t" : "T+" + h} ${f(tb(ds.map((s) => s.ret[k] - CHI_PHI)))} [${f(tb(ds.map((s) => s.vuot[k]).filter((v) => v != null)))}]`).join(" | ");
  const oos = ds.filter((s) => s.nam >= NAM_OOS);
  console.log(
    `${ten.padEnd(58)} n=${ds.length} (${new Set(ds.map((s) => s.ma)).size} ma) | ${cot} | thang ${f(pc(ds.map((s) => s.ret[oosH] - CHI_PHI > 0)), 0)}% | ` +
      `${coStop ? `CAT LO khi dong<Kijun: ${f(tb(ds.map((s) => s.stop - CHI_PHI)))}% thang ${f(pc(ds.map((s) => s.stop - CHI_PHI > 0)), 0)}% | ` : ""}2025+ n=${oos.length} ${f(tb(oos.map((s) => s.ret[oosH] - CHI_PHI)))} [${f(tb(oos.map((s) => s.vuot[oosH]).filter((v) => v != null)))}]`
  );
}
function inSetup(ten, st, khungTen) {
  const n = st.length;
  if (!n) return;
  console.log(`   ${ten}: ${n} setup | ve toi khach san trong ${khungTen}: ${f(pc(st.map((s) => s.vao ?? s.cham)), 0)}% | pha truoc/khi cham: ${f(pc(st.map((s) => s.pha ?? s.phaLen)), 0)}%`);
}

const HZ_N = [5, 10, 20];
const HZ_T = [4, 8];
console.log("=================== KHACH SAN NGAY (Tenkan 9 / Kijun 17) ===================");
for (const w of CHI_CB ? [] : [5, 3, 10, null]) {
  const ten = w == null ? "DOI CHUNG (Kijun KHONG phang)" : `Kijun phang ${w} phien`;
  const r = chayKhachSan(ngay, { hz: HZ_N, hutMax: 10, batDau: 60, kPhangW: w, tuanKhung: false, dedup: 5 });
  console.log(`\n--- ${ten} ---`);
  inSetup("TH1 (tang, gia tren)", r.th1Setup, "10 phien");
  inNhom("TH1 mua khi VAO khach san (cham Tenkan, chua pha Kijun)", r.th1E1, HZ_N, false);
  inNhom("TH1 mua khi BAT LEN tren Tenkan+Kijun (diem mua tot nhat)", r.th1E2, HZ_N, false);
  inSetup("TH2 (giam, gia duoi)", r.th2Setup, "10 phien");
  inNhom("TH2: SAU khi hut len cham Tenkan (mua o day de biet co giam tiep khong)", r.th2Cham, HZ_N, false);
}
console.log("\n=================== KHACH SAN TUAN (9/17 tuan) ===================");
for (const w of CHI_CB ? [] : [3, null]) {
  const ten = w == null ? "DOI CHUNG (Kijun KHONG phang 5 tuan)" : `Kijun phang ${w} tuan`;
  const r = chayKhachSan(tuan, { hz: HZ_T, hutMax: 6, batDau: 30, kPhangW: w, tuanKhung: true, dedup: 3 });
  console.log(`\n--- ${ten} ---`);
  inSetup("TH1 (tang, gia tren)", r.th1Setup, "6 tuan");
  inNhom("TH1 mua khi VAO khach san tuan", r.th1E1, HZ_T, true);
  inNhom("TH1 mua khi BAT LEN tren Tenkan+Kijun (tuan)", r.th1E2, HZ_T, true);
  inSetup("TH2 (giam, gia duoi)", r.th2Setup, "6 tuan");
  inNhom("TH2: SAU khi hut len cham Tenkan (tuan)", r.th2Cham, HZ_T, true);
}

// ---------- Ket hop KHACH SAN TH2 + gia cham DUONG CAN BANG DAI HAN (video goi la "cap manh") ----------
console.log("\n=================== KET HOP: khach san giam (TH2) + gia cham duong can bang dai han, nen xanh ===================");
{
  const HZ = [3, 5, 10];
  const tbTT = thiTruong(ngay, HZ, 140);
  const nhom = {
    "TH2 (Kijun phang, Tenkan xuong, gia duoi) + cham CB + nen xanh": { ks: true, phangCB: false },
    "TH2 + cham CB PHANG 10 phien + nen xanh": { ks: true, phangCB: true },
    "(doi chung) cham CB + nen xanh, KHONG can khach san": { ks: false, phangCB: false },
    "(doi chung) cham CB PHANG 10 phien + nen xanh, khong khach san": { ks: false, phangCB: true },
  };
  const ds = Object.fromEntries(Object.keys(nhom).map((k) => [k, []]));
  for (const d of ngay) {
    const kp = phangArr(d.ich.kijun, 5);
    const c1p = phangArr(d.cb.canBang1, 10), c2p = phangArr(d.cb.canBang2, 10);
    const { kijun, tenkan } = d.ich;
    const luc = Object.fromEntries(Object.keys(nhom).map((k) => [k, -100]));
    for (let i = 140; i < d.n - 10; i++) {
      if (!(d.gtgd[i] >= GTGD_TOI_THIEU_TY) || d.high[i] === d.low[i] || !(d.close[i] > d.open[i])) continue;
      const cham = (l) => l != null && d.low[i] <= l * 1.01 && d.close[i] >= l * 0.99;
      const c1 = cham(d.cb.canBang1[i]), c2 = cham(d.cb.canBang2[i]);
      if (!c1 && !c2) continue;
      const cbPhang = (c1 && c1p[i]) || (c2 && c2p[i]);
      const ks2 = kp[i] && tenkan[i] < tenkan[i - 3] && tenkan[i] < kijun[i] && d.close[i] <= tenkan[i] * (1 - CACH_TENKAN);
      for (const [ten, c] of Object.entries(nhom)) {
        if (c.ks && !ks2) continue;
        if (!c.ks && ks2) continue;
        if (c.phangCB && !cbPhang) continue;
        if (i - luc[ten] < 5) continue;
        luc[ten] = i;
        const sk = { ma: d.ma, ngay: d.nen[i].t, nam: d.nen[i].t.slice(0, 4), ret: [], vuot: [], stop: 0 };
        HZ.forEach((h, k) => {
          const r = (d.close[i + h] / d.close[i] - 1) * 100;
          const t = tbTT(k, d.nen[i].t);
          sk.ret.push(r);
          sk.vuot.push(t == null ? null : r - t * 100);
        });
        sk.stop = sk.ret[HZ.length - 1];
        ds[ten].push(sk);
      }
    }
  }
  for (const [ten, x] of Object.entries(ds)) {
    inNhom(ten, x, HZ, false, false);
    // Chia theo giai doan: truoc 2022-05 la du lieu MOI (khong nam trong lan test dau tren 4.4 nam DNSE), tu do la du lieu da thay.
    for (const [nhan, lo, hi] of [["  <2019", "0000", "2019"], ["  2019-2022.04", "2019", "2022-05"], ["  tu 2022.05 (da thay)", "2022-05", "9999"]]) {
      const y = x.filter((s) => s.ngay >= lo && s.ngay < hi);
      if (y.length) {
        const r5 = tb(y.map((s) => s.ret[1] - CHI_PHI)), v5 = tb(y.map((s) => s.vuot[1]).filter((v) => v != null));
        const r10 = tb(y.map((s) => s.ret[2] - CHI_PHI)), v10 = tb(y.map((s) => s.vuot[2]).filter((v) => v != null));
        const thang10 = pc(y.map((s) => s.ret[2] - CHI_PHI > 0));
        console.log(`${nhan.padEnd(24)} n=${y.length} | T+5 ${f(r5)} [${f(v5)}] | T+10 ${f(r10)} [${f(v10)}] | thang T+10 ${f(thang10, 0)}%`);
      }
    }
  }
}
