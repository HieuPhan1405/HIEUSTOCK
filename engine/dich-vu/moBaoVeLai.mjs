// MO PHONG 1 LENH (Mua thuong) voi cac cach BAO VE LAI / THOAT tu sau TP1 - dung chung cho backtestGopHaiLuat.mjs (khong chay gi khi import).
// Cung logic voi mo() trong backtestBaoVeLaiTuDinh.mjs (30% TP1 + 30% TP2, Stop-loss goc, tin hieu BAN, chi phi 0,4%), them cfg.atc: vao o gia DONG CUA phien tin hieu (ATC), chi duoc ban tu T+2
// (stop / tin hieu / thoat gap trong T+1 thi ban o gia MO CUA T+2; cham TP truoc T+2 thi bo lo vi chua co hang). cfg: xem chu thich trong backtestBaoVeLaiTuDinh.mjs.
import { CHI_PHI } from "./backtestChung.mjs";

export function mo(t, cfg = {}) {
  const { S, iv, open, high, low, close, sell, n, atr, kijun, tenkan, relVol } = t;
  const E = cfg.atc ? close[iv] : t.E;
  if (cfg.atc && !(E > S)) return null;
  const banTu = cfg.atc ? iv + 2 : iv + 1;
  const moc = [{ w: 0.3, gia: t.tp[0], xong: false }, { w: 0.3, gia: t.tp[1], xong: false }];
  let conLai = 1, thu = 0, phienTS = 0, choBan = false;
  let daTP1 = false, daTP2 = false;
  let dinh = -Infinity, dinhIdx = iv;
  let jThoat = -1, lyDo = 0;
  const ban = (w, g, i) => { thu += w * (g / E); phienTS += w * (i - iv); conLai -= w; };
  for (let i = iv + 1; i < n; i++) {
    if (i - 1 > iv) {
      if (high[i - 1] > dinh) { dinh = high[i - 1]; dinhIdx = i - 1; }
      if (high[i - 1] >= t.tp[0]) daTP1 = true;
      if (high[i - 1] >= t.tp[1]) daTP2 = true;
    }
    if (i === banTu && choBan) { ban(conLai, open[i], i); jThoat = i; lyDo = 8; break; }
    const duocBan = i >= banTu;
    if (duocBan) for (const m of moc) if (!m.xong && open[i] >= m.gia) { ban(m.w, open[i], i); m.xong = true; }
    const armed = cfg.batDau === "tp1" ? daTP1 : daTP2;
    let muc = daTP2 && !cfg.khongSan ? E : 0;
    if (armed && Number.isFinite(dinh)) {
      if (cfg.pct != null) muc = Math.max(muc, dinh * (1 - cfg.pct / 100));
      if (cfg.giu != null) muc = Math.max(muc, E + cfg.giu * (dinh - E));
      if (cfg.atr != null && atr[i - 1] > 0) muc = Math.max(muc, dinh - cfg.atr * atr[i - 1]);
    }
    const dongDuoiKijun = cfg.kijun && armed && kijun[i] != null && close[i] < kijun[i];
    let chinhBan = false;
    if (cfg.chinh && daTP1 && Number.isFinite(dinh)) {
      const duong = cfg.chinh.duong === "kijun" ? kijun : tenkan;
      if (duong[i] != null && close[i] < duong[i]) {
        let tong = 0, dem = 0;
        for (let j = dinhIdx + 1; j <= i; j++) { tong += relVol[j]; dem++; }
        if (dem > 0 && tong / dem >= cfg.chinh.k) chinhBan = true;
      }
    }
    let g = null;
    if (low[i] <= S) { g = Math.min(open[i], S); lyDo = 2; }
    else if (sell[i] || dongDuoiKijun || chinhBan) { g = close[i]; lyDo = sell[i] ? 1 : chinhBan ? 7 : 4; }
    else if (muc > 0 && low[i] <= muc) { g = Math.min(open[i], muc); lyDo = 3; }
    if (g != null) {
      if (!duocBan) { choBan = true; continue; } // T+1: chua duoc ban, ban o mo cua T+2
      if (conLai > 1e-12) ban(conLai, g, i);
      jThoat = i;
      break;
    }
    if (duocBan) for (const m of moc) if (!m.xong && high[i] >= m.gia) { ban(m.w, m.gia, i); m.xong = true; }
    if (conLai <= 1e-12) { jThoat = i; lyDo = 5; break; }
  }
  if (jThoat < 0) return null;
  return { ret: (thu - 1) * 100 - CHI_PHI, phien: phienTS, jThoat, lyDo };
}

// vol TB (relVol) cua NHIP CHINH truoc phien tin hieu: tu dinh cao nhat soNen nen truoc toi truoc phien tin hieu. null neu thieu du lieu.
export function nhipChinh(t, soNen = 20) {
  const { iv, high, relVol, close } = t;
  if (iv < soNen + 2) return null;
  let dIdx = iv - 1;
  for (let j = iv - 1; j >= iv - soNen; j--) if (high[j] > high[dIdx]) dIdx = j;
  if (dIdx >= iv - 1) return { vol: relVol[iv - 1], soPhien: 1, depth: (1 - close[iv - 1] / high[dIdx]) * 100 };
  let tong = 0, dem = 0;
  for (let j = dIdx + 1; j <= iv - 1; j++) { tong += relVol[j]; dem++; }
  return { vol: tong / dem, soPhien: dem, depth: (1 - close[iv - 1] / high[dIdx]) * 100 };
}
