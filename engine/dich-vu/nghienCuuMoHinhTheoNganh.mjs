// MO HINH TOT NHAT CHO TUNG NGANH + KIEM CHUNG NGOAI MAU (Hieu 2026-10-21: "tim mo hinh tot nhat cho tung nganh va test").
// Boi canh: co phieu DAI HAN GIAM (dong cua <= 65% dinh 250 phien, dinh cach >= 100 phien, GTGD TB20 >= 3 ty), cam het nhip hoi (nghienCuuCamHetNhipHoi.mjs). 25 MO HINH = 5 dieu kien VAO x 5 quy tac THOAT:
//  VAO: T1 diem B ngay | T2 vuot MA50 lan dau | T3 pha vung tich luy 40 phien co KL | T4 day sau cao hon + tren Tenkan/Kijun | T5 MA20 cat len MA50
//  THOAT: K17 dong cua duoi Kijun 17 | TK9 duoi Tenkan 9 | MA50 duoi MA50 | CH3 / CH4 duoi (dinh - 3 / 4 x ATR14); cat lo cung -10%; vao / thoat MO CUA phien sau; phi 0,4%.
// CHONG KHOP MAU (de khong chon nham may man): chon mo hinh tot nhat cua tung nganh CHI tren giai doan HUAN LUYEN (diem = lai TB sau khi cat lai/lo o +/-50% de bot anh huong lenh cuc lon, can n >= 25), roi do TREN GIAI DOAN KIEM TRA chua nhin thay.
//  Gap 1: huan luyen truoc 2022-05, kiem tra tu 2022-05.  Gap 2: huan luyen truoc 2024-01, kiem tra tu 2024-01.
// Doi chieu: 1 mo hinh chung cho moi nganh (T4 + MA50) tren cung giai doan kiem tra. Ket luan: chon theo nganh co hon mo hinh chung khong. CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuMoHinhTheoNganh.mjs
import { docJson } from "./backtestChung.mjs";
import { NGANH } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const CP = 0.4, SL = 0.1, CAP = 50;
const winz = (x) => Math.max(-CAP, Math.min(CAP, x));
const VAO = ["T1", "T2", "T3", "T4", "T5"], THOAT = ["K17", "TK9", "MA50", "CH3", "CH4"];
const NGANH_CUA = new Map(); for (const [ten, ds] of NGANH) for (const m of ds) if (!NGANH_CUA.has(m)) NGANH_CUA.set(m, ten);

const trades = []; // { ma, nganh, t, vao, thoat, ret }
for (const ma of Object.keys(cache)) {
  const b = cache[ma]; if (!b || b.length < 500) continue;
  const n = b.length, o = b.map((x) => x.o), c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v);
  const pre = [0]; for (let i = 0; i < n; i++) pre.push(pre[i] + c[i]);
  const sma = (i, k) => (i + 1 >= k ? (pre[i + 1] - pre[i + 1 - k]) / k : null);
  const ma50 = c.map((_, i) => sma(i, 50)), ma20 = c.map((_, i) => sma(i, 20));
  const tk = c.map((_, i) => (i >= 8 ? (hh(h, i, 9) + ll(l, i, 9)) / 2 : null)), kj = c.map((_, i) => (i >= 16 ? (hh(h, i, 17) + ll(l, i, 17)) / 2 : null));
  const atr = new Array(n).fill(null);
  { let a = null; for (let i = 1; i < n; i++) { const tr = Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1])); if (i === 14) { let s = 0; for (let j = 1; j <= 14; j++) s += Math.max(h[j] - l[j], Math.abs(h[j] - c[j - 1]), Math.abs(l[j] - c[j - 1])); a = s / 14; } else if (i > 14) a = (a * 13 + tr) / 14; if (i >= 14) atr[i] = a; } }
  const nganh = NGANH_CUA.get(ma) ?? "Khac";
  const ultVao = {}, dongDen = {};
  for (let i = 260; i < n - 2; i++) {
    const d250 = hh(h, i, 250); if (!(c[i] <= 0.65 * d250)) continue;
    let iP = i; for (let j = i - 249; j <= i; j++) if (h[j] === d250) iP = j;
    if (i - iP < 100) continue;
    let gt = 0; for (let j = i - 19; j <= i; j++) gt += (c[j] * v[j]) / 1e6; if (gt / 20 < 3) continue;
    const ok = {};
    const day20 = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day20) kDay = j;
    if (c[i] > tk[i] && c[i] > kj[i] && i - kDay >= 3) ok.T1 = true;
    if (ma50[i] != null && c[i] > ma50[i] && c[i - 1] <= ma50[i - 1]) { let duoi = 0; for (let j = i - 40; j < i; j++) if (c[j] < ma50[j]) duoi++; if (duoi >= 30) ok.T2 = true; }
    { const d40 = hh(h, i - 1, 40), t40 = ll(l, i - 1, 40); let s = 0; for (let j = i - 20; j < i; j++) s += v[j]; s /= 20; if (c[i] > d40 && (d40 - t40) / d40 <= 0.35 && s > 0 && v[i] >= 1.5 * s) ok.T3 = true; }
    if (ll(l, i, 30) > ll(l, i - 30, 30) && c[i] > tk[i] && c[i] > kj[i]) ok.T4 = true;
    if (ma20[i] != null && ma50[i] != null && ma20[i] > ma50[i] && ma20[i - 1] <= ma50[i - 1]) ok.T5 = true;
    for (const vao of VAO) {
      if (!ok[vao] || i - (ultVao[vao] ?? -99) < 20) continue;
      ultVao[vao] = i;
      const E = o[i + 1];
      for (const th of THOAT) {
        const key = `${vao}|${th}`;
        if (i + 1 <= (dongDen[key] ?? -1)) continue;
        let gia = c[n - 1], jt = n - 1, hi = -Infinity;
        for (let j = i + 1; j < n; j++) {
          if (l[j] <= E * (1 - SL)) { gia = Math.min(o[j], E * (1 - SL)); jt = j; break; }
          hi = Math.max(hi, h[j]);
          let ra = false;
          if (th === "K17") ra = kj[j] != null && c[j] < kj[j];
          else if (th === "TK9") ra = tk[j] != null && c[j] < tk[j];
          else if (th === "MA50") ra = ma50[j] != null && c[j] < ma50[j];
          else if (th === "CH3") ra = atr[j] != null && c[j] < hi - 3 * atr[j];
          else ra = atr[j] != null && c[j] < hi - 4 * atr[j];
          if (ra && j + 1 < n) { gia = o[j + 1]; jt = j + 1; break; }
        }
        dongDen[key] = jt;
        trades.push({ ma, nganh, t: b[i].t, mh: key, ret: (gia / E - 1) * 100 - CP, giu: jt - i });
      }
    }
  }
}
const pf = (a) => { const w = a.filter((x) => x > 0).reduce((s, x) => s + x, 0), l = -a.filter((x) => x <= 0).reduce((s, x) => s + x, 0); return l ? w / l : NaN; };
const stat = (a) => ({ n: a.length, tb: tb(a.map((x) => x.ret)), tbz: tb(a.map((x) => winz(x.ret))), win: (a.filter((x) => x.ret > 0).length / (a.length || 1)) * 100, pf: pf(a.map((x) => x.ret)), giu: tb(a.map((x) => x.giu)) });
const MH = VAO.flatMap((v) => THOAT.map((t) => `${v}|${t}`));
const CHUNG = "T4|MA50";
const NG = [...new Set(trades.map((x) => x.nganh))].sort();
console.log(`${trades.length} lenh mo phong, ${NG.length} nganh\n`);

for (const [ten, cat] of [["GAP 1: huan luyen < 2022-05, kiem tra >= 2022-05", "2022-05-01"], ["GAP 2: huan luyen < 2024-01, kiem tra >= 2024-01", "2024-01-01"]]) {
  console.log(`######## ${ten} ########`);
  console.log(`${"Nganh".padEnd(26)} | mo hinh chon (tren huan luyen)  train n/lai(cat) | KIEM TRA: n  lai TB  lai(cat)  thang  PF  giu | MO HINH CHUNG ${CHUNG}: n  lai TB  lai(cat) PF`);
  let tongChon = [], tongChung = [], nChon = 0;
  for (const ng of NG) {
    const tr = trades.filter((x) => x.nganh === ng && x.t < cat), te = trades.filter((x) => x.nganh === ng && x.t >= cat);
    let best = null;
    for (const mh of MH) { const a = tr.filter((x) => x.mh === mh); if (a.length < 25) continue; const s = stat(a); if (!best || s.tbz > best.s.tbz) best = { mh, s }; }
    const chung = stat(te.filter((x) => x.mh === CHUNG));
    if (!best) { console.log(`${ng.padEnd(26)} | (khong du mau huan luyen)                               | ${"-".padEnd(46)} | ${chung.n} ${f(chung.tb, 2)} ${f(chung.tbz, 2)} ${f(chung.pf, 2)}`); continue; }
    const kt = stat(te.filter((x) => x.mh === best.mh));
    tongChon.push(...te.filter((x) => x.mh === best.mh)); tongChung.push(...te.filter((x) => x.mh === CHUNG)); nChon++;
    console.log(`${ng.padEnd(26)} | ${best.mh.padEnd(8)} ${String(best.s.n).padStart(4)}/${f(best.s.tbz, 2).padStart(6)}%             | ${String(kt.n).padStart(4)} ${f(kt.tb, 2).padStart(6)} ${f(kt.tbz, 2).padStart(6)} ${f(kt.win, 0).padStart(3)}% ${f(kt.pf, 2).padStart(5)} ${f(kt.giu, 0).padStart(3)}p | ${String(chung.n).padStart(4)} ${f(chung.tb, 2).padStart(6)} ${f(chung.tbz, 2).padStart(6)} ${f(chung.pf, 2).padStart(5)}`);
  }
  const sc = stat(tongChon), sg = stat(tongChung);
  console.log(`>> TONG HOP ${nChon} nganh (kiem tra): CHON THEO NGANH n=${sc.n} lai TB ${f(sc.tb, 2)}% (cat ${f(sc.tbz, 2)}%) thang ${f(sc.win, 0)}% PF ${f(sc.pf, 2)}  |  MO HINH CHUNG (cung nganh) n=${sg.n} lai TB ${f(sg.tb, 2)}% (cat ${f(sg.tbz, 2)}%) thang ${f(sg.win, 0)}% PF ${f(sg.pf, 2)}\n`);
}
// Bang tham khao: toan bo giai doan (KHONG dung de chon - chi de xem mo hinh nao nhin chung manh)
console.log("######## THAM KHAO (toan giai doan, chi de xem, de bi khop mau): top 3 mo hinh moi nganh theo lai(cat), n >= 40 ########");
for (const ng of NG) {
  const r = MH.map((mh) => ({ mh, s: stat(trades.filter((x) => x.nganh === ng && x.mh === mh)) })).filter((x) => x.s.n >= 40).sort((p, q) => q.s.tbz - p.s.tbz).slice(0, 3);
  console.log(`${ng.padEnd(26)} ${r.map((x) => `${x.mh} n${x.s.n} ${f(x.s.tbz, 1)}% PF${f(x.s.pf, 1)}`).join(" | ") || "(it mau)"}`);
}
