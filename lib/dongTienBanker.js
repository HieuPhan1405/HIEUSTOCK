// DONG TIEN "BANKER FUND FLOW" (Pine: [blackcat] L3 Banker Fund Flow Trend Oscillator, tham so mac dinh) - ham THUAN, dung chung cho engine (nhan diem B) va bieu do web. Test tay: engine/test/dongTienBanker.test.mjs.
// trend  = (3 x fast - 2 x slow - 50) x 1,032 + 50, fast / slow = trung binh gia quyen (kieu SMA(X, N, M) cua TDX, N = 5 / 3, M = 1) cua stochastic tho 27 phien;
// bb     = EMA 13 cua vi tri gia dien hinh (2C + H + L + O) / 5 trong bien do 34 phien (duong "bull/bear").
// Trang thai dung cho nhan diem B: trend > bb = "dong tien da quay len" (green); nguoc lai = "con yeu". Ket qua kiem chung (engine/dich-vu/nghienCuuChiBaoVoiDiemAB.mjs, 04/11/2026): diem B (giam 20-30%) khi green lai 20 phien +2,5% so voi +1,1% khi khong green
// (tu 2022.5: +1,7% so voi -1,5%), green tot hon o 12 / 14 nam. KHONG phai tin hieu mua / ban - chi la thong tin tham khao.
// Mang vao: { open, high, low, close } cung do dai; ra: { trend, bb } cung do dai, null cho nen chua du du lieu.

const hhv = (a, n) => a.map((_, i) => { if (i < n - 1) return null; let m = -Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] > m) m = a[j]; return m; });
const llv = (a, n) => a.map((_, i) => { if (i < n - 1) return null; let m = Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] < m) m = a[j]; return m; });

// ta.ema cua Pine: gia tri dau = SMA cua n gia tri hop le dau tien, sau do de quy
function ema(a, n) {
  const o = new Array(a.length).fill(null);
  const k = 2 / (n + 1);
  let dem = 0, tong = 0, truoc = null;
  for (let i = 0; i < a.length; i++) {
    if (a[i] == null) { truoc = null; dem = 0; tong = 0; continue; }
    if (truoc == null) {
      dem++;
      tong += a[i];
      if (dem === n) { truoc = tong / n; o[i] = truoc; }
      continue;
    }
    truoc = k * a[i] + (1 - k) * truoc;
    o[i] = truoc;
  }
  return o;
}

// calculate_weighted_simple_average cua blackcat: tong truot `length` gia tri; gia tri dau = trung binh, sau do (src x w + truoc x (length - w)) / length
function tbGiaQuyen(src, length, trongSo) {
  const n = src.length;
  const tong = new Array(n).fill(null);
  const ra = new Array(n).fill(null);
  for (let t = 0; t < n; t++) {
    const truoc = t > 0 && tong[t - 1] != null ? tong[t - 1] : 0;
    const tru = t - length >= 0 && src[t - length] != null ? src[t - length] : 0;
    tong[t] = src[t] == null ? null : truoc - tru + src[t];
    const tbDau = t - length < 0 || src[t - length] == null || tong[t] == null ? null : tong[t] / length;
    const raTruoc = t > 0 ? ra[t - 1] : null;
    ra[t] = raTruoc == null ? tbDau : src[t] == null ? null : (src[t] * trongSo + raTruoc * (length - trongSo)) / length;
  }
  return ra;
}

export function tinhDongTienBanker({ open, high, low, close }) {
  const n = close.length;
  if (!n) return { trend: [], bb: [] };
  const lo27 = llv(low, 27), hi27 = hhv(high, 27), lo34 = llv(low, 34), hi34 = hhv(high, 34);
  const tho = close.map((c, i) => (lo27[i] == null || hi27[i] === lo27[i] ? null : ((c - lo27[i]) / (hi27[i] - lo27[i])) * 100));
  const nhanh = tbGiaQuyen(tho, 5, 1);
  const cham = tbGiaQuyen(nhanh, 3, 1);
  const trend = nhanh.map((x, i) => (x == null || cham[i] == null ? null : (3 * x - 2 * cham[i] - 50) * 1.032 + 50));
  const dienHinh = close.map((c, i) => ((2 * c + high[i] + low[i] + (open?.[i] ?? c)) / 5));
  const bb = ema(dienHinh.map((tp, i) => (lo34[i] == null || hi34[i] === lo34[i] ? null : ((tp - lo34[i]) / (hi34[i] - lo34[i])) * 100)), 13);
  return { trend, bb };
}

// 1 = dong tien da quay len (trend > bull/bear), 0 = con yeu, null = chua du du lieu
export function trangThaiDongTien(trend, bb, i) {
  const t = trend?.[i];
  const b = bb?.[i];
  return t != null && b != null ? (t > b ? 1 : 0) : null;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
// HIEN THI GIONG PINE (components/BieuDoKyThuat.js, chip "Dong tien"): mau nen theo trang thai + nhan tin hieu Banker In / IN / OUT / SI / SO / RL / RS / TP / SL (cua [blackcat] L3 Banker Fund Flow V2, tham so MAC DINH).
// CHI LA HIEN THI - kiem chung (engine/dich-vu/nghienCuuChiBaoPine.mjs, 04/11/2026) cho thay tin hieu vao / ra cua chi bao nay KHONG co loi the tren co phieu VN; web chi dung trang thai dong tien lam nhan cho diem B.
const crossO = (a, b, i) => i > 0 && a[i] != null && b[i] != null && a[i - 1] != null && b[i - 1] != null && a[i] > b[i] && a[i - 1] <= b[i - 1]; // ta.crossover
const crossU = (a, b, i) => i > 0 && a[i] != null && b[i] != null && a[i - 1] != null && b[i - 1] != null && a[i] < b[i] && a[i - 1] >= b[i - 1]; // ta.crossunder
const lvl = (n, v) => new Array(n).fill(v);

// ta.atr (RMA cua True Range)
function atrWilder(high, low, close, len = 14) {
  const n = close.length;
  const tr = close.map((c, i) => (i === 0 ? high[i] - low[i] : Math.max(high[i] - low[i], Math.abs(high[i] - close[i - 1]), Math.abs(low[i] - close[i - 1]))));
  const o = new Array(n).fill(null);
  let truoc = null, tong = 0, dem = 0;
  for (let i = 0; i < n; i++) {
    if (truoc == null) {
      dem++;
      tong += tr[i];
      if (dem === len) { truoc = tong / len; o[i] = truoc; }
      continue;
    }
    truoc = (truoc * (len - 1) + tr[i]) / len;
    o[i] = truoc;
  }
  return o;
}
const smaMang = (a, n) => a.map((_, i) => { if (i < n - 1) return null; let s = 0; for (let j = i - n + 1; j <= i; j++) s += a[j] ?? 0; return s / n; });

// Mau nen / duong trend theo trang thai (nhu cac plotcandle cua Pine, ve theo thu tu xanh la, trang, do, xanh duong - cai ve sau de len cai ve truoc):
//   trend < bull/bear: xanh duong (yeu hoi: trend van tren 95% trend phien truoc) hoac do; trend > bull/bear: trang (trend giam tu 5% tro len so phien truoc) hoac xanh la; nen vang = tin hieu "Banker In" V1.
export const MAU_BANKER = { vang: "#FACC15", xanhLa: "#22C55E", trang: "#CBD5E1", do: "#EF4444", xanhDuong: "#3B82F6" };

export function tinhBankerHienThi({ open, high, low, close, volume }, tuyChon = {}) {
  const c = { cooldown: 3, ...tuyChon };
  const n = close.length;
  const { trend, bb } = tinhDongTienBanker({ open, high, low, close });
  const atr = atrWilder(high, low, close, 14);
  const vsma = smaMang(volume ?? close.map(() => 0), 20);
  const os = lvl(n, 20), ez = lvl(n, 25), ob = lvl(n, 80), xz = lvl(n, 75);
  const mauNen = new Array(n).fill(null), mauDuong = new Array(n).fill(null), nenVang = new Array(n).fill(false);
  const nhan = [];
  // trang thai vi the (state machine cua Pine, mac dinh: loc khoi luong + trend cung chieu, cooldown 3, SAR bat, ATR TP 3 / SL 1,5, kenh zone / oversold / overbought, khong flip)
  let posState = 0, lastSignalBar = -1, tpGia = null, slGia = null;
  for (let i = 0; i < n; i++) {
    const t = trend[i], b = bb[i];
    if (t == null || b == null) continue;
    const pr = i > 0 && trend[i - 1] != null ? trend[i - 1] * 0.95 : t * 0.95;
    const laXanh = t > b, laTrang = t < pr, laDo = t < b, laXanhDuong = t < b && t > pr;
    const vang = crossO(trend, bb, i) && b < 25;
    nenVang[i] = vang;
    mauNen[i] = laXanhDuong ? "xanhDuong" : laDo ? "do" : laTrang && laXanh ? "trang" : laXanh ? "xanhLa" : null;
    mauDuong[i] = vang ? "vang" : laXanh ? "xanhLa" : laTrang ? "trang" : laDo ? "do" : "xanhDuong";
    if (vang) nhan.push({ i, loai: "bankerIn", text: "Banker In" });
    // kenh tin hieu
    const crossEntry = crossO(trend, bb, i) && b < 25;
    const zoneEntry = crossO(bb, ez, i);
    const osRecover = crossO(trend, os, i);
    const anyEntry = crossEntry || zoneEntry || osRecover;
    const mirrorCross = crossU(trend, bb, i), obRollCross = crossU(trend, ob, i), zoneShortCross = crossU(bb, xz, i);
    const mirrorExit = mirrorCross && b > 75, obRollExit = obRollCross;
    const anyExit = mirrorExit || obRollExit;
    const shortCross = mirrorCross && b > 75, shortZone = zoneShortCross, shortObRoll = obRollCross;
    const anyShortEntry = shortCross || shortZone || shortObRoll;
    const volOK = (volume?.[i] ?? 0) > (vsma[i] ?? Infinity);
    const tang = trend[i - 1] != null && t > trend[i - 1];
    const giam = trend[i - 1] != null && t < trend[i - 1];
    const cooldownOK = lastSignalBar < 0 || i - lastSignalBar > c.cooldown;
    const longEntryOK = anyEntry && volOK && tang;
    const shortEntryOK = anyShortEntry && volOK && giam;
    const longEvt = longEntryOK && cooldownOK, shortEvt = shortEntryOK && cooldownOK;
    const longExitEvt = anyEntry && cooldownOK, shortExitEvt = (anyExit || anyShortEntry) && cooldownOK;
    const kenhVao = (crossEntry ? " ·XB" : "") + (zoneEntry ? " ·ZB" : "") + (osRecover ? " ·OSR" : "");
    const kenhRa = (mirrorExit ? " ·MX" : "") + (obRollExit ? " ·OBR" : "");
    const kenhShort = (shortCross ? " ·MX" : "") + (shortZone ? " ·ZD" : "") + (shortObRoll ? " ·OBR" : "");
    let govEntry = false, govExit = false, govShortEntry = false, govShortExit = false, govReLong = false, govReShort = false, daoLong = false, daoShort = false;
    if (cooldownOK) {
      if (posState === 0) {
        if (longEvt) govEntry = true;
        else if (shortEvt) govShortEntry = true;
      } else if (posState === 1) {
        if (longEvt) govReLong = true;
        else if (shortExitEvt) {
          if (shortEntryOK) { govShortEntry = true; daoShort = true; } else govExit = true;
        }
      } else if (shortEvt) govReShort = true;
      else if (longExitEvt) {
        if (longEntryOK) { govEntry = true; daoLong = true; } else govShortExit = true;
      }
    }
    const a = atr[i];
    const datMuc = (huong) => { if (a != null) { tpGia = close[i] + huong * a * 3; slGia = close[i] - huong * a * 1.5; } };
    if (govEntry) { posState = 1; lastSignalBar = i; datMuc(1); nhan.push({ i, loai: "IN", text: (daoLong ? "IN ·R" : "IN") + kenhVao }); }
    if (govShortEntry) { posState = -1; lastSignalBar = i; datMuc(-1); nhan.push({ i, loai: "SI", text: (daoShort ? "SI ·R" : "SI") + kenhShort }); }
    if (govReLong) { lastSignalBar = i; datMuc(1); nhan.push({ i, loai: "RL", text: "RL" + kenhVao }); }
    if (govReShort) { lastSignalBar = i; datMuc(-1); nhan.push({ i, loai: "RS", text: "RS" + kenhShort }); }
    if (govExit) { posState = 0; lastSignalBar = i; tpGia = null; slGia = null; nhan.push({ i, loai: "OUT", text: "OUT" + kenhRa }); }
    if (govShortExit) { posState = 0; lastSignalBar = i; tpGia = null; slGia = null; nhan.push({ i, loai: "SO", text: "SO" + kenhVao }); }
    // cham TP / SL trong phien (theo gia cao nhat / thap nhat)
    if (tpGia != null && slGia != null) {
      const tp = (posState === 1 && high[i] >= tpGia) || (posState === -1 && low[i] <= tpGia);
      const sl = (posState === 1 && low[i] <= slGia) || (posState === -1 && high[i] >= slGia);
      if (tp) nhan.push({ i, loai: "TP", text: "TP" });
      if (sl) nhan.push({ i, loai: "SL", text: "SL" });
      if (tp || sl) { posState = 0; lastSignalBar = i; tpGia = null; slGia = null; }
    }
  }
  return { trend, bb, mauNen, mauDuong, nenVang, nhan };
}
