// MO PHONG 1 LENH he thong voi cac cach ra TP1/TP2 + Tenkan/Kijun (dung chung cho backtestThoatTenkanKijunHeThong.mjs va backtestMuaKhongCanMay.mjs).
// Quy uoc nhu moPhongThucTe (backtestChung.mjs): vao = chi so nen mua (mo cua), banTu = nen dau tien duoc ban (vao + 2 = chieu T+2); truoc banTu cham cat lo S / co tin hieu BAN thi ban o gia mo cua banTu.
// cfg: { vao, banTu, E?, moc: [{ w, i }] (TP theo t.tp[i]), baoVe (hoa von sau khi cham muc TP2), theoSell, tk: "nua" (Tenkan ban 1/2 phan con, Kijun ban not) | "tenkan" | "kijun" }.
// "Thung" = DONG CUA duoi duong, chi tinh sau khi gia tung dong cua tren duong do ke tu luc mua.
import { CHI_PHI } from "./backtestChung.mjs";

export const HAI_TP = [{ w: 0.3, i: 0 }, { w: 0.3, i: 1 }];
export function mp(t, cfg) {
  const { S, tp, open, high, low, close, sell, n, tenkan, kijun } = t;
  const { vao, banTu } = cfg;
  const E = cfg.E ?? open[vao];
  if (!(E > 0) || !(S < E) || vao >= n) return null;
  const cacMoc = (cfg.moc ?? []).map((m) => ({ w: m.w, gia: m.pct != null ? E * (1 + m.pct / 100) : m.r != null ? E + m.r * (E - S) : m.atr != null ? E + m.atr * t.atr[t.iv] : tp[m.i], xong: false })); // moc: { w, i } = TP thu i cua engine | { w, pct } = chot o gia vao + pct% | { w, r } = gia vao + r x khoang cach cat lo (E - S) | { w, atr } = gia vao + k x ATR14 luc tin hieu
  let conLai = 1, thu = 0, phienW = 0, choBan = false, dinhTruoc = -Infinity, daTP2 = false, lenT = false, lenK = false, daNua = false, daMau = false;
  const ban = (w, g, i) => { w = Math.min(w, conLai); if (!(w > 0)) return; thu += w * (g / E); phienW += w * (i - t.iv); conLai -= w; }; // khong ban qua phan con lai (truoc 27/10: mau ban 1/2 + TP1 + TP2 co the ban > 100% vi the -> thoi phong lai)
  const ketQua = (jThoat) => ({ ret: (thu - 1) * 100 - CHI_PHI, phien: phienW, jThoat });
  const coSell = (i) => cfg.theoSell && sell[i];
  for (let i = vao; i < n; i++) {
    if (i < banTu) {
      if (low[i] <= S || coSell(i)) choBan = true;
      dinhTruoc = Math.max(dinhTruoc, high[i]);
      if (tenkan[i] != null && close[i] > tenkan[i]) lenT = true;
      if (kijun[i] != null && close[i] > kijun[i]) lenK = true;
      continue;
    }
    if (i === banTu && choBan) { ban(conLai, open[i], i); return ketQua(i); }
    if (cfg.baoVe && (i === banTu ? dinhTruoc : high[i - 1]) >= tp[1]) daTP2 = true;
    const stopBV = daTP2 ? E : 0;
    for (const m of cacMoc) if (!m.xong && open[i] >= m.gia) { ban(m.w, open[i], i); m.xong = true; }
    let g = null;
    if (low[i] <= S) g = Math.min(open[i], S);
    else if (coSell(i)) g = close[i];
    else if (stopBV > 0 && low[i] <= stopBV) g = Math.min(open[i], stopBV);
    if (g != null) { if (conLai > 1e-12) ban(conLai, g, i); return ketQua(i); }
    for (const m of cacMoc) if (!m.xong && high[i] >= m.gia) { ban(m.w, m.gia, i); m.xong = true; }
    if (conLai <= 1e-12) return ketQua(i);
    // MAU CHOT LOI: ham cfg.mau(t, i) bao nen i co mau (vd nen dao chieu giam); chi xet khi dang lai >= cfg.mauNguong % so voi gia vao; ban cfg.mauTyLe (mac dinh het) phan con lai o gia dong cua, 1 lan
    if (cfg.mau && !daMau && close[i] >= E * (1 + (cfg.mauNguong ?? 0) / 100) && cfg.mau(t, i)) {
      ban(conLai * (cfg.mauTyLe ?? 1), close[i], i);
      daMau = true;
      if (conLai <= 1e-9) return ketQua(i);
    }
    if (cfg.tk === "nua") {
      if (!daNua && lenT && tenkan[i] != null && close[i] < tenkan[i]) { ban(conLai * 0.5, close[i], i); daNua = true; }
      if (lenK && kijun[i] != null && close[i] < kijun[i]) { ban(conLai, close[i], i); return ketQua(i); }
    } else if (cfg.tk === "tenkan") {
      if (lenT && tenkan[i] != null && close[i] < tenkan[i]) { ban(conLai, close[i], i); return ketQua(i); }
    } else if (cfg.tk === "kijun") {
      if (lenK && kijun[i] != null && close[i] < kijun[i]) { ban(conLai, close[i], i); return ketQua(i); }
    }
    if (tenkan[i] != null && close[i] > tenkan[i]) lenT = true;
    if (kijun[i] != null && close[i] > kijun[i]) lenK = true;
  }
  return null;
}
