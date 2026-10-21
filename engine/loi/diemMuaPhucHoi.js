// DIEM MUA PHUC HOI (diem B, 21/10/2026): co phieu DA GIAM SAU roi dong cua LAY LAI ca Tenkan va Kijun - diem GIAI NGAN DOT DAU gan day (nghien cuu: engine/dich-vu/nghienCuuGiaiNganThepBds.mjs, nghienCuuGiaiNganHaiDot.mjs).
// Dieu kien tai nen i (NHAN QUA, chi dung du lieu den het nen i):
//   - boi canh: trong 11 nen gan nhat (i-10..i) co nen dong cua <= 85% dinh (cao nhat) 20 nen truoc/den nen do (da giam >= 15%);
//   - dong cua > Tenkan (9) va > Kijun (17), day thap nhat 20 nen cach nen i it nhat 3 nen (da qua day, khong phai dang roi);
//   - GTGD TB 20 phien >= 3 ty (gia x KL / 1 trieu, gia nghin dong);
//   - cach diem B truoc do >= 15 nen (moi nhip hoi chi bao 1 lan).
// Muc cat lo va chot loi theo cong thuc "binh thuong" cua he thong (engine/loi/vaoLenh.js) voi gia vao = dong cua nen B: SL cau truc theo Kijun (Kijun - 0,5 ATR, cach gia >= 3,5%, khong qua 6%), TP1 / TP2 / TP3 = 3 moc (dinh 60 nen / may + can bang dai han / dinh 252 nen,
// moi moc cach gia vao it nhat 5% / 10% / 15%). Chi la DIEM VAO THAM KHAO (khong tinh vao tin hieu MUA/BAN). Ket qua lich su: day goc 18-19% (B), thung day 23% trong 20 phien, sut >= 5% trong 10 phien ~ 50% - nen chia 1/2 von va co cat lo.
import { hhv } from "./mang.js";
import { tinhBaMocChotLoi } from "./vaoLenh.js";

export const CAU_HINH_B = { giamPct: 15, trongNen: 10, dayCachToiThieu: 3, giuaHaiLan: 15, gtgdToiThieuTy: 3, demSLtheoATR: 0.5, slToiThieuPct: 3.5, hardStopPct: 6 };
export const SO_NEN_B_GAN_DAY = 10;

// {high, low, close, volume, atr, tenkan, kijun, cloudTop, cbTop}: cac mang cung do dai (null cho nen chua du du lieu).
// Tra ve { laB: bool[], gan: { i, cach, gia, day, sl, tp1, tp2, tp3 } | null } - `gan` = diem B gan nhat trong SO_NEN_B_GAN_DAY nen cuoi.
export function tinhDiemMuaPhucHoi({ high, low, close, volume, atr, tenkan, kijun, cloudTop, cbTop }, cauHinh = CAU_HINH_B) {
  const c = { ...CAU_HINH_B, ...cauHinh };
  const n = close.length;
  const laB = new Array(n).fill(false);
  const dinh20 = hhv(high, 20);
  const giamSau = close.map((x, i) => dinh20[i] != null && x <= (1 - c.giamPct / 100) * dinh20[i]);
  let ultB = -Infinity;
  let tongGt = 0;
  const gt = close.map((x, i) => x * (volume[i] ?? 0) / 1e6);
  for (let i = 0; i < n; i++) {
    tongGt += gt[i];
    if (i >= 20) tongGt -= gt[i - 20];
    if (i < 30 || tenkan[i] == null || kijun[i] == null) continue;
    if (tongGt / 20 < c.gtgdToiThieuTy) continue;
    let boiCanh = false;
    for (let k = 0; k <= c.trongNen && !boiCanh; k++) if (giamSau[i - k]) boiCanh = true;
    if (!boiCanh) continue;
    if (!(close[i] > tenkan[i] && close[i] > kijun[i])) continue;
    let day = Infinity, kDay = i;
    for (let j = i - 19; j <= i; j++) if (low[j] <= day) { day = low[j]; kDay = j; }
    if (i - kDay < c.dayCachToiThieu) continue;
    if (i - ultB < c.giuaHaiLan) continue;
    laB[i] = true;
    ultB = i;
  }
  let gan = null;
  for (let i = n - 1; i >= Math.max(0, n - SO_NEN_B_GAN_DAY); i--) {
    if (!laB[i]) continue;
    const E = close[i];
    let day = Infinity;
    for (let j = i - 19; j <= i; j++) if (low[j] < day) day = low[j];
    const a = atr[i] ?? E * 0.03;
    let sl = Math.min(kijun[i] - c.demSLtheoATR * a, E * (1 - c.slToiThieuPct / 100));
    sl = Math.max(sl, E * (1 - c.hardStopPct / 100));
    const giaVaoBar = new Array(n).fill(E);
    const tp = tinhBaMocChotLoi({ high, giaVaoBar, cloudTop, cbTop });
    gan = { i, cach: n - 1 - i, gia: E, day, sl, tp1: tp.tp1Vong[i], tp2: tp.tp2Vong[i], tp3: tp.tp3Vong[i] };
    break;
  }
  return { laB, gan };
}
