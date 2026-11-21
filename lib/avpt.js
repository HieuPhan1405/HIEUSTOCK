// ANCHORED VWAP PULLBACK & TARGET ZONES - viet lai bang JS tu logic cong khai cua "Anchored VWAP Pullback & Target Zones [PhenLabs]" (Pine v6, MPL 2.0, (c) PhenLabs).
// Y tuong: neo VWAP (theo khoi luong) tai swing pivot 10/10; sau mot xung luc >= 1,4 ATR gia hoi ve dai gia tri (AVWAP +- sigma); tin hieu khi nen dong cua lay lai AVWAP voi cac bo loc (Kaufman ER,
// chat luong nen, KL tuong doi, do sau nhip hoi 12-85%). Ke hoach lenh: vao gia dong cua, SL duoi day nhip hoi - 0,2 ATR (kep 0,35-3 ATR), TP1 / TP2 / TP3 = 1R / 2R / 3R (HYBRID: TP2 / TP3 hut ve dinh / day xung luc).
// KHONG ap dung "Auto-Optimize" (chon profile co ty le thang cao nhat SAU KHI biet ket qua): moi lan chi chay 1 profile, mac dinh Balanced.
// CHI LA CHI BAO HIEN THI / THAM KHAO: kiem dinh 21/11/2026 tren phai sinh VN30F1M (1.929 ngay, nen 5 / 15 phut, mua + ban khong, phi MBS + truot 0,4) cho ket qua AM o hau het cac cach (5 phut -0,5..-46%/nam),
// va TE HON vao ngau nhien cung so lenh. Khong dung de vao lenh. (Port Python tuong ung: engine/dich-vu/phaisinh_avwap.py)

export const AVPT_PROFILES = {
  Balanced: { band: 1.0, outer: 2.0, minEr: 26, minQual: 52, slScale: 1.0, minRisk: 0.35, minAct: 0 },
  Conservative: { band: 0.8, outer: 1.75, minEr: 35, minQual: 60, slScale: 1.15, minRisk: 0.35, minAct: 0 },
  Aggressive: { band: 1.25, outer: 2.3, minEr: 18, minQual: 44, slScale: 0.85, minRisk: 0.3, minAct: 0 },
  Shallow: { band: 0.65, outer: 1.6, minEr: 30, minQual: 55, slScale: 0.9, minRisk: 0.3, minAct: 0 },
  DeepValue: { band: 1.45, outer: 2.5, minEr: 22, minQual: 48, slScale: 1.25, minRisk: 0.4, minAct: 0 },
  VolClimax: { band: 1.0, outer: 2.0, minEr: 24, minQual: 58, slScale: 0.95, minRisk: 0.32, minAct: 1.25 },
};

function wilder(a, n) {
  const o = new Array(a.length);
  let e = a[0];
  for (let i = 0; i < a.length; i++) {
    e = e + (a[i] - e) / n;
    o[i] = e;
  }
  return o;
}
function smaN(a, n) {
  const o = new Array(a.length).fill(NaN);
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    s += a[i];
    if (i >= n) s -= a[i - n];
    if (i >= n - 1) o[i] = s / n;
  }
  return o;
}
const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);

// pivot (L trai, R phai): tam la cao / thap nhat DUY NHAT cua cua so; xac nhan sau R nen
function pivots(high, low, L, R) {
  const n = high.length;
  const ph = new Array(n).fill(NaN);
  const pl = new Array(n).fill(NaN);
  for (let i = L + R; i < n; i++) {
    const c = i - R;
    let maxH = -Infinity;
    let minL = Infinity;
    let nh = 0;
    let nl = 0;
    for (let q = c - L; q <= i; q++) {
      if (high[q] > maxH) { maxH = high[q]; nh = 1; } else if (high[q] === maxH) nh++;
      if (low[q] < minL) { minL = low[q]; nl = 1; } else if (low[q] === minL) nl++;
    }
    if (high[c] >= maxH && nh === 1) ph[i] = high[c];
    if (low[c] <= minL && nl === 1) pl[i] = low[c];
  }
  return { ph, pl };
}

// tra { avwap, bandTren, bandDuoi, bias, signals }
//  avwap / bandTren / bandDuoi: mang cung do dai dau vao (null khi chua co neo hoac vua doi neo - de duong dut quang nhu Pine); bias: 1 / -1 / 0
//  signals: [{ i, dir, entry, sl, tp1, tp2, tp3, risk, q (chat luong nen %), qpb (do sau nhip hoi), tp1Hit, tp2Hit, tp3Hit, slHit, iKetThuc }]
// nbNgay (tuy chon, chi de test doi chieu voi Python): dong ke hoach dang mo dau moi ngay (chuoi nen noi lien, moi ngay nbNgay nen).
export function avpt(open, high, low, close, volume, { profile = "Balanced", swing = 10, minImpulseAtr = 1.4, maxPbPerAnchor = 2, slBufferAtr = 0.2, hybrid = true, nbNgay = 0 } = {}) {
  const P = AVPT_PROFILES[profile] ?? AVPT_PROFILES.Balanced;
  const n = close.length;
  const TICK = 0.1;
  const at = wilder(close.map((c, i) => (i ? Math.max(high[i] - low[i], Math.abs(high[i] - close[i - 1]), Math.abs(low[i] - close[i - 1])) : high[i] - low[i])), 14);
  const safe = at.map((a) => Math.max(a, TICK * 10));
  const span = high.map((h, i) => Math.max(h - low[i], TICK));
  const volSma = smaN(volume, 20);
  const hasVol = volume.map((v, i) => v > 0 && !Number.isNaN(volSma[i]) && volSma[i] > 0);
  const rel = volume.map((v, i) => (hasVol[i] ? v / volSma[i] : span[i] / Math.max(safe[i], TICK)));
  const actN = rel.map((r) => clamp(r / 2, 0, 1));
  const wgt = volume.map((v, i) => (hasVol[i] ? Math.max(v, 1e-6) : Math.max(rel[i], 0.1)));
  const dc = close.map((c, i) => (i ? Math.abs(c - close[i - 1]) : 0));
  const pathSma = smaN(dc, 10);
  const er = close.map((c, i) => {
    const net = i >= 10 ? Math.abs(c - close[i - 10]) : 0;
    const path = Number.isNaN(pathSma[i]) ? 0 : pathSma[i] * 10;
    return path > 0 ? clamp((net / path) * 100, 0, 100) : 0;
  });
  const erN = er.map((e) => clamp(e / 55, 0, 1));
  const bQ = close.map((c, i) => Math.round(clamp((0.4 * clamp((c - low[i]) / span[i], 0, 1) + 0.35 * erN[i] + 0.25 * actN[i]) * 100 * (c > open[i] ? 1 : 0.85), 0, 100) * 10) / 10);
  const sQ = close.map((c, i) => Math.round(clamp((0.4 * clamp((high[i] - c) / span[i], 0, 1) + 0.35 * erN[i] + 0.25 * actN[i]) * 100 * (c < open[i] ? 1 : 0.85), 0, 100) * 10) / 10);
  const mv5 = close.map((c, i) => (i >= 5 ? (c - close[i - 5]) / Math.max(safe[i], TICK) : 0));
  const { ph, pl } = pivots(high, low, swing, swing);
  const hlc3 = close.map((c, i) => (high[i] + low[i] + c) / 3);

  const avwap = new Array(n).fill(null);
  const bandTren = new Array(n).fill(null);
  const bandDuoi = new Array(n).fill(null);
  const biasA = new Array(n).fill(0);
  const signals = [];
  // trang thai neo MUA / BAN
  let bA = false, bAp = NaN, bAbar = -1, bSW = 0, bSW2 = 0, bS = 0, bV = NaN, bSd = 0, bIH = NaN, bArm = false, bIn = false, bPL = NaN, bUsed = 0;
  let sA = false, sAp = NaN, sAbar = -1, sSW = 0, sSW2 = 0, sS = 0, sV = NaN, sSd = 0, sIL = NaN, sArm = false, sIn = false, sPH = NaN, sUsed = 0;
  let plan = null; // ke hoach dang mo (de chan tin hieu cung chieu va ghi ket thuc)
  let prevBias = 0, prevAnc = -1;

  for (let i = 0; i < n; i++) {
    // dong ke hoach dang mo
    if (plan) {
      const j = nbNgay ? i % nbNgay : 1;
      const hetHan = i - plan.i >= 60;
      let dong = false;
      if (i > plan.i) {
        if (plan.dir === 1) {
          if (low[i] <= plan.activeSl) { plan.slHit = !plan.tp1Hit; dong = true; }
          else {
            if (!plan.tp1Hit && high[i] >= plan.tp1) { plan.tp1Hit = true; plan.activeSl = plan.entry; }
            if (!plan.tp2Hit && high[i] >= plan.tp2) plan.tp2Hit = true;
            if (high[i] >= plan.tp3) { plan.tp3Hit = true; dong = true; }
          }
        } else if (high[i] >= plan.activeSl) { plan.slHit = !plan.tp1Hit; dong = true; }
        else {
          if (!plan.tp1Hit && low[i] <= plan.tp1) { plan.tp1Hit = true; plan.activeSl = plan.entry; }
          if (!plan.tp2Hit && low[i] <= plan.tp2) plan.tp2Hit = true;
          if (low[i] <= plan.tp3) { plan.tp3Hit = true; dong = true; }
        }
      }
      if (dong || hetHan || (nbNgay && j === 0)) { plan.iKetThuc = i; plan = null; }
    }
    // cap nhat AVWAP dang chay
    if (bA) {
      bSW += wgt[i] * hlc3[i]; bSW2 += wgt[i] * hlc3[i] * hlc3[i]; bS += wgt[i]; bV = bSW / Math.max(bS, 1e-9);
      bSd = Math.max(Math.sqrt(Math.max(0, bSW2 / Math.max(bS, 1e-9) - bV * bV)), safe[i] * 0.25);
      if (Number.isNaN(bIH) || high[i] >= bIH) bIH = high[i];
      if (!bArm && bIH - bAp >= minImpulseAtr * safe[i]) bArm = true;
      if (close[i] < bAp || close[i] < bV - 2.6 * bSd) { bA = false; bArm = false; bIn = false; }
    }
    if (sA) {
      sSW += wgt[i] * hlc3[i]; sSW2 += wgt[i] * hlc3[i] * hlc3[i]; sS += wgt[i]; sV = sSW / Math.max(sS, 1e-9);
      sSd = Math.max(Math.sqrt(Math.max(0, sSW2 / Math.max(sS, 1e-9) - sV * sV)), safe[i] * 0.25);
      if (Number.isNaN(sIL) || low[i] <= sIL) sIL = low[i];
      if (!sArm && sAp - sIL >= minImpulseAtr * safe[i]) sArm = true;
      if (close[i] > sAp || close[i] > sV + 2.6 * sSd) { sA = false; sArm = false; sIn = false; }
    }
    // dat neo moi tai swing pivot (dung lai tu nen goc, nen khong repaint)
    const pb = i - swing;
    if (!Number.isNaN(pl[i]) && pb >= 0) {
      const p = pl[i];
      if ((!bA || p < bAp || bUsed >= maxPbPerAnchor || (bArm && p > bAp && high[i] - p >= minImpulseAtr * safe[i])) && close[i] > p) {
        let w = 0, wp = 0, wp2 = 0, mx = -Infinity;
        for (let k = pb; k <= i; k++) { w += wgt[k]; wp += wgt[k] * hlc3[k]; wp2 += wgt[k] * hlc3[k] * hlc3[k]; if (high[k] > mx) mx = high[k]; }
        bSW = wp; bSW2 = wp2; bS = w; bV = bSW / Math.max(bS, 1e-9);
        bSd = Math.max(Math.sqrt(Math.max(0, bSW2 / Math.max(bS, 1e-9) - bV * bV)), safe[i] * 0.25);
        bA = true; bAp = p; bAbar = pb; bIH = mx; bArm = mx - p >= minImpulseAtr * safe[i]; bIn = false; bPL = NaN; bUsed = 0;
      }
    }
    if (!Number.isNaN(ph[i]) && pb >= 0) {
      const p = ph[i];
      if ((!sA || p > sAp || sUsed >= maxPbPerAnchor || (sArm && p < sAp && p - low[i] >= minImpulseAtr * safe[i])) && close[i] < p) {
        let w = 0, wp = 0, wp2 = 0, mn = Infinity;
        for (let k = pb; k <= i; k++) { w += wgt[k]; wp += wgt[k] * hlc3[k]; wp2 += wgt[k] * hlc3[k] * hlc3[k]; if (low[k] < mn) mn = low[k]; }
        sSW = wp; sSW2 = wp2; sS = w; sV = sSW / Math.max(sS, 1e-9);
        sSd = Math.max(Math.sqrt(Math.max(0, sSW2 / Math.max(sS, 1e-9) - sV * sV)), safe[i] * 0.25);
        sA = true; sAp = p; sAbar = pb; sIL = mn; sArm = p - mn >= minImpulseAtr * safe[i]; sIn = false; sPH = NaN; sUsed = 0;
      }
    }
    // xu huong chi dao (de ve)
    let bias = 0;
    if (bA && bArm && !(sA && sArm)) bias = 1;
    else if (sA && sArm && !(bA && bArm)) bias = -1;
    else if (bA && bArm && sA && sArm) bias = bAbar >= sAbar ? 1 : -1;
    else if (bA) bias = 1;
    else if (sA) bias = -1;
    biasA[i] = bias;
    // nhip hoi + lay lai
    let take = 0;
    const hi1 = i ? high[i - 1] : high[i];
    const lo1 = i ? low[i - 1] : low[i];
    if (bA && bArm && bUsed < maxPbPerAnchor && !Number.isNaN(bV)) {
      const up = bV + P.band * bSd;
      const lowDef = bV - P.outer * bSd;
      if (low[i] <= up && close[i] >= lowDef && close[i] > bAp && high[i] < bIH) {
        if (!bIn) { bIn = true; bPL = low[i]; } else if (low[i] < bPL) bPL = low[i];
      } else if (close[i] < lowDef) bIn = false;
      if (bIn && close[i] > bV && close[i] > open[i] && close[i] >= hi1 - 0.2 * safe[i] && !(plan && plan.dir === 1)) {
        const leg = Math.max(bIH - bAp, safe[i] * 0.5);
        const dep = (bIH - bPL) / leg;
        if (er[i] >= P.minEr && bQ[i] >= P.minQual && rel[i] >= P.minAct && dep >= 0.12 && dep <= 0.85 && !(mv5[i] < -3.6 && close[i] < open[i])) take = 1;
        else bIn = false;
      }
    }
    if (take === 0 && sA && sArm && sUsed < maxPbPerAnchor && !Number.isNaN(sV)) {
      const lowB = sV - P.band * sSd;
      const upDef = sV + P.outer * sSd;
      if (high[i] >= lowB && close[i] <= upDef && close[i] < sAp && low[i] > sIL) {
        if (!sIn) { sIn = true; sPH = high[i]; } else if (high[i] > sPH) sPH = high[i];
      } else if (close[i] > upDef) sIn = false;
      if (sIn && close[i] < sV && close[i] < open[i] && close[i] <= lo1 + 0.2 * safe[i] && !(plan && plan.dir === -1)) {
        const leg = Math.max(sAp - sIL, safe[i] * 0.5);
        const dep = (sPH - sIL) / leg;
        if (er[i] >= P.minEr && sQ[i] >= P.minQual && rel[i] >= P.minAct && dep >= 0.12 && dep <= 0.85 && !(mv5[i] > 3.6 && close[i] > open[i])) take = -1;
        else sIn = false;
      }
    }
    if (take !== 0) {
      const e = close[i];
      const raw = take === 1 ? Math.min(bPL, bV - P.band * bSd) - slBufferAtr * P.slScale * safe[i] : Math.max(sPH, sV + P.band * sSd) + slBufferAtr * P.slScale * safe[i];
      const r = clamp(Math.abs(e - raw), safe[i] * P.minRisk, safe[i] * 3);
      const sl = e - take * r;
      let t1 = e + take * r;
      let t2 = e + take * 2 * r;
      let t3 = e + take * 3 * r;
      if (hybrid) {
        const imp = take === 1 ? bIH : sIL;
        const dr = (take * (imp - e)) / r;
        if (dr >= 1.3 && dr <= 2.4) t2 = imp;
        else if (dr > 2.4 && dr <= 4.5) t3 = imp;
      }
      const q = take === 1 ? bQ[i] : sQ[i];
      if (plan) plan.iKetThuc = i;
      plan = { i, dir: take, entry: e, sl, activeSl: sl, tp1: t1, tp2: t2, tp3: t3, risk: r, q, tp1Hit: false, tp2Hit: false, tp3Hit: false, slHit: false, iKetThuc: null };
      signals.push(plan);
      if (take === 1) { bIn = false; bUsed++; } else { sIn = false; sUsed++; }
    }
    // duong AVWAP lien tuc cua neo dang chi dao (dut khi doi neo / doi chieu)
    const anc = bias === 1 ? bAbar : bias === -1 ? sAbar : -1;
    const doi = bias !== prevBias || anc !== prevAnc;
    prevBias = bias;
    prevAnc = anc;
    const live = bias === 1 ? bV : bias === -1 ? sV : NaN;
    const sd = bias === 1 ? bSd : bias === -1 ? sSd : NaN;
    if (!doi && !Number.isNaN(live)) {
      avwap[i] = live;
      if (!Number.isNaN(sd)) { bandTren[i] = live + P.band * sd; bandDuoi[i] = live - P.band * sd; }
    }
  }
  return { avwap, bandTren, bandDuoi, bias: biasA, signals };
}
