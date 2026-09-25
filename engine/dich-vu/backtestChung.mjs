// PHAN DUNG CHUNG cho cac backtest ngoai engine tren cache lich su dai (engine/output/nen_dai.json + vnindex_dai.json): chay engine cho tung ma de gom cac lan
// vao lenh GOC, mo phong 1 lenh theo 1 cach chot loi, thong ke va danh muc gioi han so vi the (co the xep hang/loc lenh). Xem chi tiet quy uoc o dau
// backtestChotLoi.mjs (script dau tien - giu nguyen, khong dung file nay). Chi DOC cache, khong dung mang, khong ghi gi ngoai man hinh.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tinhTinHieuChoMa } from "../tinhTinHieuChoMa.js";
import { tinhIchimoku } from "../loi/ichimoku.js";
import { sma } from "../loi/mang.js";
import { NGANH } from "../danh-sach/nganh.js";

export const CHI_PHI = 0.4; // % ca vong
export const docJson = (ten) => JSON.parse(readFileSync(fileURLToPath(new URL(`../output/${ten}`, import.meta.url)), "utf-8"));

// ---------- thong ke nho ----------
export const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
export const md = (a) => {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
export const f = (v, dp = 2) => (Number.isFinite(v) ? v.toFixed(dp) : "-");
export const kyOf = (ngay) => (ngay < "2019-01-01" ? 0 : ngay < "2022-05-01" ? 1 : 2);
export const TEN_KY = ["<2019", "2019-2022.4", "2022.5+"];

export function thongKe(kqs) {
  const r = kqs.map((x) => x.ret);
  if (!r.length) return { n: 0, tb: NaN, thang: NaN, pf: NaN, phienTB: NaN };
  const thang = r.filter((x) => x > 0);
  const thua = r.filter((x) => x <= 0);
  const loThua = -thua.reduce((s, x) => s + x, 0);
  const phien = kqs.map((x) => x.phien);
  return {
    n: r.length,
    tb: tb(r),
    trungVi: md(r),
    thang: (thang.length / r.length) * 100,
    pf: loThua > 0 ? thang.reduce((s, x) => s + x, 0) / loThua : Infinity,
    phienTB: tb(phien),
    laiMoiPhien: tb(phien) > 0 ? tb(r) / tb(phien) : NaN,
  };
}

// ---------- chay engine tung ma ----------
// cache: { MA: [{t,o,h,l,c,v}] }; vni: [{t,c,h,l}] VNINDEX tang dan. Tra ve { lenh, soMa, thiTruong(ngay) }.
export function chayEngine({ cache, vni, soNenToiThieu = 300 }) {
  const vniMap = new Map(vni.map((b) => [b.t, b.c]));
  const ketQuaBreadth = { theoNganh: new Map([...NGANH.keys()].map((k) => [k, 50])), trungBinh: 50 };
  const breadth50 = new Map(); // ngay -> { tren, tong } (ma co dong cua > SMA50)
  const breadthKijun = new Map();
  const cong = (m, d, tren) => {
    const x = m.get(d) ?? { tren: 0, tong: 0 };
    x.tong++;
    if (tren) x.tren++;
    m.set(d, x);
  };
  const lenh = [];
  let soMa = 0;
  for (const [ma, nen] of Object.entries(cache)) {
    if (nen.length < soNenToiThieu) continue;
    let vniLast = vni[0].c;
    const vniClose = nen.map((b) => {
      vniLast = vniMap.get(b.t) ?? vniLast;
      return vniLast;
    });
    let hang;
    try {
      hang = tinhTinHieuChoMa({ ma, nen, vniClose, san: "HOSE", ketQuaBreadth, thamSo: { traChuoi: true, ketThucTaiTP3: false, thoatKijunSauTP2: false, batMuaMoi: true } });
    } catch (e) {
      console.log("Loi", ma, String(e.message || e).slice(0, 80));
      continue;
    }
    soMa++;
    const { close, open, high, low, kijun, tenkan, sellTinHieu, kq, diemRank, diemConfidence, totalScore, adx, rsVsVni, relVol, atr, cloudTop, cloudBot, cbTop, cbBot } = hang._chuoi;
    const n = nen.length;
    const ngayArr = nen.map((b) => b.t);
    const sma50 = sma(close, 50);
    const sma20 = sma(close, 20);
    const gtgd = sma(nen.map((b) => (b.c * b.v) / 1e6), 20);
    for (let i = 50; i < n; i++) {
      cong(breadth50, ngayArr[i], close[i] > sma50[i]);
      if (kijun[i] != null) cong(breadthKijun, ngayArr[i], close[i] > kijun[i]);
    }
    for (let iv = 1; iv < n - 1; iv++) {
      if (!kq.buy[iv]) continue;
      const E = kq.giaVaoLuc[iv];
      const S = kq.stopVaoLuc[iv];
      const tp = [kq.tp1VaoVong[iv], kq.tp2VaoVong[iv], kq.tp3VaoVong[iv]];
      if (!(E > 0) || !(S > 0) || !(S < E) || tp.some((x) => !(x > E)) || !(tp[0] <= tp[1] && tp[1] <= tp[2])) continue;
      let jEng = -1;
      for (let j = iv + 1; j < n; j++)
        if (kq.giuTrongVongLap[j] !== 1) {
          jEng = j;
          break;
        }
      if (jEng < 0) continue;
      lenh.push({
        ma, ngay: ngayArr[iv], iv, jEng, E, S, tp, loai: kq.loaiVaoLenh[iv], open, high, low, close, kijun, tenkan, sma20, sma50, atr, cloudTop, cloudBot, cbTop, cbBot, sell: sellTinHieu, n, ngayArr,
        // Dac trung TAI NEN VAO LENH (chi dung du lieu den het nen do) de xep hang lenh
        dacTrung: {
          "Diem xep hang engine (diem_rank)": diemRank[iv],
          "Diem tin cay (diem_confidence)": diemConfidence[iv],
          "Tong diem luc vao (diem)": totalScore[iv],
          "ADX": adx[iv],
          "Suc manh so voi VN-Index (RS 20 phien)": rsVsVni[iv],
          "Khoi luong tuong doi (RelVol)": relVol[iv],
          "GTGD TB20 (ty/phien)": gtgd[iv],
          "Cat lo CHAT (cat lo % nho hon = tot hon)": -((E - S) / E) * 100,
          "TP1 / cat lo (ty le thuong/rui ro)": (tp[0] - E) / (E - S),
          "Tang 20 phien truoc do (dong luc)": iv >= 20 ? (close[iv] / close[iv - 20] - 1) * 100 : NaN,
          "Gia so voi Kijun (% tren Kijun)": kijun[iv] > 0 ? (E / kijun[iv] - 1) * 100 : NaN,
        },
      });
    }
  }

  // Trang thai VNINDEX + do rong theo ngay
  const vh = vni.map((b) => b.h ?? b.c);
  const vl = vni.map((b) => b.l ?? b.c);
  const vc = vni.map((b) => b.c);
  const ich = tinhIchimoku({ high: vh, low: vl });
  const v50 = sma(vc, 50);
  const v200 = sma(vc, 200);
  const chiSoNgay = new Map(vni.map((b, i) => [b.t, i]));
  const thiTruong = (ngay) => {
    const i = chiSoNgay.get(ngay);
    if (i == null) return null;
    const b50 = breadth50.get(ngay);
    const bk = breadthKijun.get(ngay);
    return {
      vni: vc[i],
      kijun: ich.kijun[i],
      tenkan: ich.tenkan[i],
      cloudTop: ich.cloudTop[i],
      sma50: v50[i],
      sma200: v200[i],
      doRong50: b50 && b50.tong >= 150 ? (b50.tren / b50.tong) * 100 : null,
      doRongKijun: bk && bk.tong >= 150 ? (bk.tren / bk.tong) * 100 : null,
    };
  };
  return { lenh, soMa, thiTruong };
}

// ---------- mo phong 1 lenh theo 1 cach chot loi (xem chu thich backtestChotLoi.mjs) ----------
// muc: "tp1"|"tp2"|"tp3" | { r: x } (x lan khoang cach cat lo) | { pct: x } (x% tren gia vao) | { tp3x: k } (gia vao + k x khoang cach tu gia vao toi TP3 cua engine - keo TP3 xa hon)
const mucGia = (t, muc) =>
  typeof muc === "string" ? t.tp[Number(muc.slice(2)) - 1] : muc.r != null ? t.E + muc.r * (t.E - t.S) : muc.tp3x != null ? t.E + muc.tp3x * (t.tp[2] - t.E) : t.E * (1 + muc.pct / 100);

export function moPhong(t, cach) {
  const { E, S, iv, open, high, low, close, sell, n } = t;
  const duongTheo = cach.duongTheo === "tenkan" ? t.tenkan : t.kijun;
  const chay = cach.chay ?? null; // { duong: "kijun"|"tenkan"|"sma20"|"sma50", soNen: so dong cua lien tiep duoi duong, atrMult: k (bam gia cao nhat - k x ATR), chuyenSauLai: { pct, duong } }
  const mangDuong = (ten) => ({ kijun: t.kijun, tenkan: t.tenkan, sma20: t.sma20, sma50: t.sma50, cloudTop: t.cloudTop, cloudBot: t.cloudBot, cbTop: t.cbTop, cbBot: t.cbBot })[ten];
  let demDuoi = 0;
  let dinhClose = t.close[iv];
  let daLoLon = false; // da tung lai >= chuyenSauLai.pct (tinh theo dinh cao nhat cac nen truoc)
  let dinhCao = E;
  const moc = cach.moc.map((m) => ({ w: m.w, gia: mucGia(t, m.muc), xong: false }));
  let conLai = 1;
  let thu = 0;
  let phienTrongso = 0;
  let daTP2 = false;
  let lyDo = 0;
  let jThoat = -1;
  const ban = (w, gia, i) => {
    thu += w * (gia / E);
    phienTrongso += w * (i - iv);
    conLai -= w;
  };
  for (let i = iv + 1; i < n; i++) {
    if (!cach.khongBaoVe && i - 1 > iv && high[i - 1] >= t.tp[1]) daTP2 = true;
    const stopBV = daTP2 ? E : 0;
    for (const m of moc)
      if (!m.xong && open[i] >= m.gia) {
        ban(m.w, open[i], i);
        m.xong = true;
      }
    const chamStop = low[i] <= S;
    const chamBV = stopBV > 0 && low[i] <= stopBV;
    if (i - 1 > iv) dinhCao = Math.max(dinhCao, high[i - 1]);
    if (chay?.chuyenSauLai && dinhCao >= E * (1 + chay.chuyenSauLai.pct / 100)) daLoLon = true;
    dinhClose = Math.max(dinhClose, close[i - 1]);
    const armed = cach.theoKijunSau != null && moc[cach.theoKijunSau].xong;
    let kichHoatDuong = false;
    if (armed) {
      if (!chay) kichHoatDuong = duongTheo[i] != null && close[i] < duongTheo[i];
      else if (chay.tenkanDuoiKijun) kichHoatDuong = t.tenkan[i] != null && t.kijun[i] != null && t.tenkan[i] < t.kijun[i];
      else if (chay.atrMult != null) kichHoatDuong = t.atr[i] > 0 && close[i] < dinhClose - chay.atrMult * t.atr[i];
      else {
        const d = mangDuong(daLoLon && chay.chuyenSauLai ? chay.chuyenSauLai.duong : chay.duong);
        if (d[i] != null && close[i] < d[i]) demDuoi++;
        else demDuoi = 0;
        kichHoatDuong = demDuoi >= (chay.soNen ?? 1);
      }
    }
    let giaThoat = null;
    if (chamStop) {
      giaThoat = Math.min(open[i], S);
      lyDo = 2;
    } else if (sell[i] || kichHoatDuong) {
      giaThoat = close[i];
      lyDo = sell[i] ? 1 : 4;
    } else if (chamBV) {
      giaThoat = Math.min(open[i], stopBV);
      lyDo = 3;
    }
    if (giaThoat != null) {
      if (conLai > 1e-12) ban(conLai, giaThoat, i);
      jThoat = i;
      break;
    }
    for (const m of moc)
      if (!m.xong && high[i] >= m.gia) {
        ban(m.w, m.gia, i);
        m.xong = true;
      }
    if (conLai <= 1e-12) {
      jThoat = i;
      lyDo = 5;
      break;
    }
  }
  if (jThoat < 0) return null;
  return { ret: (thu - 1) * 100 - CHI_PHI, phien: phienTrongso, jThoat, lyDo };
}

export const CACH_HIEN_TAI = { ten: "Hien tai 30/30/25/15", moc: [{ w: 0.3, muc: "tp1" }, { w: 0.3, muc: "tp2" }, { w: 0.25, muc: "tp3" }] };
export const CACH_KIJUN = { ten: "Khong chot, sau TP1 thoat khi dong cua < Kijun", moc: [{ w: 0, muc: "tp1" }], theoKijunSau: 0 };
export const CACH_30_KIJUN = { ten: "30% o TP1, con lai thoat khi dong cua < Kijun", moc: [{ w: 0.3, muc: "tp1" }], theoKijunSau: 0 };

// ---------- danh muc gioi han K vi the ----------
export function taoNgauNhien(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// kqs[i] = ket qua mo phong cua ds[i] (hoac null). tuyChon: { loc: (t) => bool (lenh bi loai thi bo), xepHang: (t) => so (cao hon = uu tien truoc khi nhieu lenh cung ngay) }
// Von chia deu 1/K luc vao; lenh moi luc het cho bi bo; lai/lo tinh 1 lan luc thoat cuoi (theo so phien TB co trong so) - xap xi de so sanh.
export function danhMuc(kqs, ds, K, seed = 1, tuyChon = {}) {
  const rng = taoNgauNhien(seed);
  const muc = [];
  let dau = "9999";
  let cuoi = "0000";
  ds.forEach((t, i) => {
    const r = kqs[i];
    if (!r) return;
    const jRa = Math.min(t.n - 1, t.iv + Math.max(1, Math.round(r.phien)));
    const ngayRa = t.ngayArr[jRa];
    // Cua so thoi gian tinh CAGR = tu lenh dau tien den lenh ket thuc cuoi cung cua TOAN BO tap lenh (khong doi theo bo loc) de cac cau hinh so sanh duoc voi nhau.
    if (t.ngay < dau) dau = t.ngay;
    if (ngayRa > cuoi) cuoi = ngayRa;
    if (tuyChon.loc && !tuyChon.loc(t)) return;
    const diem = tuyChon.xepHang ? tuyChon.xepHang(t) : 0;
    muc.push({ ma: t.ma, ngayVao: t.ngay, ngayRa, ret: r.ret, diem: Number.isFinite(diem) ? diem : -Infinity, khoa: rng() });
  });
  muc.sort((a, b) => (a.ngayVao < b.ngayVao ? -1 : a.ngayVao > b.ngayVao ? 1 : b.diem - a.diem || a.khoa - b.khoa));
  let von = 1;
  let dinh = 1;
  let sut = 0;
  const dangGiu = [];
  const dongDen = (d) => {
    dangGiu.sort((a, b) => (a.ngayRa < b.ngayRa ? -1 : 1));
    while (dangGiu.length && dangGiu[0].ngayRa <= d) {
      const a = dangGiu.shift();
      von += a.size * (a.ret / 100);
      dinh = Math.max(dinh, von);
      sut = Math.max(sut, 1 - von / dinh);
    }
  };
  let lay = 0;
  const layRet = [];
  for (const m of muc) {
    dongDen(m.ngayVao);
    if (dangGiu.length >= K) continue;
    dangGiu.push({ ngayRa: m.ngayRa, size: von / K, ret: m.ret });
    layRet.push(m.ret);
    lay++;
  }
  dongDen("9999");
  const nam = (Date.parse(cuoi) - Date.parse(dau)) / (365.25 * 86400e3);
  return { boi: von, cagr: nam > 0 ? (Math.pow(von, 1 / nam) - 1) * 100 : NaN, sut: sut * 100, lay, laiTBLenhLay: tb(layRet) };
}

// Chay danhMuc nhieu lan (xao tron thu tu / hoa) -> { cagr, sut, lay, laiTB } trung binh + 10%..90% cua cagr.
export function danhMucNhieuLan(kqs, ds, K, soLan, tuyChon) {
  const cg = [];
  let sut = 0;
  let lay = 0;
  let lai = 0;
  for (let s = 1; s <= soLan; s++) {
    const d = danhMuc(kqs, ds, K, s, tuyChon);
    cg.push(d.cagr);
    sut += d.sut;
    lay += d.lay;
    lai += d.laiTBLenhLay;
  }
  cg.sort((a, b) => a - b);
  return { cagr: tb(cg), p10: cg[Math.floor(soLan * 0.1)], p90: cg[Math.floor(soLan * 0.9)], sut: sut / soLan, lay: lay / soLan, laiTB: lai / soLan };
}
