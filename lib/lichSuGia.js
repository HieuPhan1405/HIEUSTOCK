// Lich su gia OHLCV cho bieu do ky thuat.
//   Nguon CHINH: DNSE (services.entrade.com.vn - API cong khai dung boi app EntradeX cua DNSE,
//   khong can dang nhap). Da doi chieu 2026-09-22: gia da la gia DA DIEU CHINH co tuc/thuong CP
//   (vd HHP truoc ngay chot quyen 2026-08-18: DNSE tra 15.4/15.49/14.41... khop CHINH XAC voi
//   adClose cua VNDirect, khac han gia tho 16.4/16.5/15.35...) - khop voi du lieu AmiBroker xuat
//   len web (cung la gia dieu chinh) nen Kijun/duong can bang dai han tinh o web se dung.
//   1 API duy nhat cho ca co phieu (/stock) va chi so (/index), khong phan biet san HOSE/HNX/UPCOM.
//   Nguon DU PHONG: VNDirect (finfo + dchart, nhu truoc) - dung khi DNSE loi/khong nhan dien duoc
//   ma (vd VNMIDCAP/VNSMALLCAP la chi so tu tinh, DNSE khong co).
// Gia don vi nghin dong, giong AmiBroker/web. Du lieu do ben thu ba nen phai chiu loi (goi ham nay trong try/catch).

const DNSE_STOCK = "https://services.entrade.com.vn/chart-api/v2/ohlcs/stock";
const DNSE_INDEX = "https://services.entrade.com.vn/chart-api/v2/ohlcs/index";
const FINFO = "https://api-finfo.vndirect.com.vn/v4/stock_prices";
const DCHART = "https://dchart-api.vndirect.com.vn/dchart/history";
// Ten chi so tren DNSE khac VNDirect o vai ma (vd HNXINDEX -> HNX) - anh xa rieng cho nhanh DNSE;
// nhanh du phong VNDirect van dung dung ten goc (khoa cua map).
const CHI_SO_DNSE = { VNINDEX: "VNINDEX", VN30: "VN30", HNXINDEX: "HNX", HNX30: "HNX30", UPCOMINDEX: "UPCOM" };
const CHI_SO = new Set(["VNINDEX", "VN30", "HNXINDEX", "HNX30", "UPCOMINDEX", "VNMIDCAP", "VNSMALLCAP"]);

export const MA_HOP_LE = /^[A-Z0-9]{2,12}$/;
export const SO_NEN_TOI_DA = 1000;

export function laChiSo(ma) {
  return CHI_SO.has(ma);
}

async function layJson(url, hanCacheGiay = 120) {
  // Khong gui header Accept: dchart-api (VNDirect) tra 406 neu Accept la application/json.
  const res = await fetch(url, { next: { revalidate: hanCacheGiay }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Nguồn giá trả về lỗi (HTTP ${res.status}).`);
  try {
    return await res.json();
  } catch {
    // Vai chi so tu tinh (vd VNMIDCAP/VNSMALLCAP) khong duoc nguon nao theo doi -> body rong, khong phai JSON.
    throw new Error("Nguồn giá trả về dữ liệu không hợp lệ.");
  }
}

const ngayIso = (giay) => new Date(giay * 1000).toISOString().slice(0, 10);
const nenHopLe = (b) => [b.o, b.h, b.l, b.c].every((x) => Number.isFinite(x) && x > 0) && b.h >= b.l;

// lightweight-charts (thu vien ve bieu do) bat buoc du lieu tang dan NGHIEM NGAT theo thoi gian,
// khong duoc trung - nguon DNSE thinh thoang tra ve 2 dong TRUNG NGAY (da doi chieu truc tiep, vd
// VGI 2022-12-27) hoac khong dung thu tu, neu de nguyen se lam vo ca bieu do (setData nem loi).
// Sap lai + gop cac ngay trung (nhu gopNenTuan) de an toan truoc kieu loi nguon nay.
function chuanHoaTangDan(nen) {
  const sap = [...nen].sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
  const kq = [];
  for (const b of sap) {
    const cuoi = kq[kq.length - 1];
    if (cuoi && cuoi.t === b.t) {
      cuoi.h = Math.max(cuoi.h, b.h);
      cuoi.l = Math.min(cuoi.l, b.l);
      cuoi.c = b.c;
      cuoi.v += b.v;
    } else kq.push({ ...b });
  }
  return kq;
}

async function tuDNSE(ma, n) {
  const maDNSE = CHI_SO_DNSE[ma] ?? ma;
  const duong = laChiSo(ma) ? DNSE_INDEX : DNSE_STOCK;
  const den = Math.floor(Date.now() / 1000);
  const tu = den - 86400 * Math.ceil(n * 1.6);
  const j = await layJson(`${duong}?symbol=${maDNSE}&resolution=1D&from=${tu}&to=${den}`);
  if (!Array.isArray(j.t) || j.t.length === 0) throw new Error("DNSE không có dữ liệu.");
  return j.t.map((t, i) => ({ t: ngayIso(t), o: j.o[i], h: j.h[i], l: j.l[i], c: j.c[i], v: j.v?.[i] ?? 0 }));
}

// Mang nen PHUT (resolution=1) THO cua hom nay, sap tang dan theo t - dung chung cho ca viec ghep
// nen ngay dang chay (gop lai thanh 1 nen, ben duoi) lan bieu do thanh khoan trong phien (dashboard,
// xem app/api/thanh-khoan/route.js) can tung nen phut de ve duong tich luy khoi luong ca phien.
export async function layNenPhutHomNay(ma) {
  const maDNSE = CHI_SO_DNSE[ma] ?? ma;
  const duong = laChiSo(ma) ? DNSE_INDEX : DNSE_STOCK;
  const den = Math.floor(Date.now() / 1000);
  const tu = den - 3600 * 20; // du trum phien sang (9h-11h30) de khong lo nen dau tien khi vua mo cua.
  // Han cache ngan (20s): nen hom nay dang chay, khong duoc cu 2 phut nhu lich su ngay.
  const j = await layJson(`${duong}?symbol=${maDNSE}&resolution=1&from=${tu}&to=${den}`, 20);
  if (!Array.isArray(j.t) || j.t.length === 0) return [];
  const homNay = ngayIso(den);
  return j.t
    .map((t, i) => ({ t, o: j.o[i], h: j.h[i], l: j.l[i], c: j.c[i], v: j.v?.[i] ?? 0 }))
    .filter((b) => nenHopLe(b) && ngayIso(b.t) === homNay)
    .sort((a, b) => a.t - b.t);
}

// KHUNG NHO trong ngay cho bieu do ky thuat (DNSE chart-api): "H" = 1 gio (~13 thang+), "M30" / "M15" / "M5" = 30 / 15 / 5 phut (nguon chi giu ~3 thang). Thoi gian tra ve la giay Unix CONG 7 GIO
// (de bieu do - hien gio theo UTC - hien dung GIO VIET NAM). Tra ve [{ t, o, h, l, c, v }] tang dan; mang rong neu nguon khong co du lieu.
export const KHUNG_NOI_NGAY = { H: { res: "1H", ngay: 420 }, M30: { res: "30", ngay: 110 }, M15: { res: "15", ngay: 110 }, M5: { res: "5", ngay: 100 } };
export async function layNenNoiNgay(ma, khung) {
  if (!MA_HOP_LE.test(ma)) throw new Error("Mã không hợp lệ.");
  const cfg = KHUNG_NOI_NGAY[khung];
  if (!cfg) throw new Error("Khung thời gian không hợp lệ.");
  const maDNSE = CHI_SO_DNSE[ma] ?? ma;
  const duong = laChiSo(ma) ? DNSE_INDEX : DNSE_STOCK;
  const den = Math.ceil(Date.now() / 1000 / 20) * 20;
  const tu = Math.floor((den - 86400 * cfg.ngay) / 86400) * 86400;
  const j = await layJson(`${duong}?symbol=${maDNSE}&resolution=${cfg.res}&from=${tu}&to=${den}`, 20);
  if (!Array.isArray(j.t) || j.t.length === 0) return [];
  const nen = j.t
    .map((t, i) => ({ t: t + 7 * 3600, o: j.o[i], h: j.h[i], l: j.l[i], c: j.c[i], v: j.v?.[i] ?? 0 }))
    .filter(nenHopLe);
  return chuanHoaTangDan(nen);
}

// Nen PHUT cua 1 NGAY BAT KY (yyyy-mm-dd, gio Viet Nam) - dung ve duong thanh khoan tich luy cua PHIEN TRUOC de so voi hom nay
// (dashboard). Ngay da qua khong doi nen cache dai (1 ngay); ngay hom nay cache ngan nhu layNenPhutHomNay. Mang rong neu ngay do khong co du lieu.
export async function layNenPhutNgay(ma, ngayISO) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngayISO)) return [];
  const maDNSE = CHI_SO_DNSE[ma] ?? ma;
  const duong = laChiSo(ma) ? DNSE_INDEX : DNSE_STOCK;
  const tu = Math.floor(Date.parse(`${ngayISO}T00:00:00+07:00`) / 1000);
  const bayGio = Math.floor(Date.now() / 1000);
  const den = Math.min(tu + 86399, bayGio);
  if (!(tu < den)) return [];
  const laHomNay = bayGio < tu + 86400;
  const j = await layJson(`${duong}?symbol=${maDNSE}&resolution=1&from=${tu}&to=${den}`, laHomNay ? 20 : 86400);
  if (!Array.isArray(j.t) || j.t.length === 0) return [];
  return j.t
    .map((t, i) => ({ t, o: j.o[i], h: j.h[i], l: j.l[i], c: j.c[i], v: j.v?.[i] ?? 0 }))
    .filter((b) => nenHopLe(b) && b.t >= tu && b.t <= tu + 86399)
    .sort((a, b) => a.t - b.t);
}

// Nen 1 GIO (DNSE, co tu khoang 10/2023) - dung de dung Volume Profile tren bieu do sat hon so voi chia khoi luong theo nen ngay (lib/volumeProfile.js).
// Tra ve mang gon [[t (giay Unix), o, h, l, c, v], ...] tang dan theo thoi gian; mang rong neu nguon khong co du lieu (bieu do khi do tu dung nen ngay).
// Moc thoi gian duoc lam tron (10 phut / 1 ngay) de dia chi goi nguon on dinh -> bo nho dem cua fetch co tac dung.
export async function layNenGio(ma) {
  if (!MA_HOP_LE.test(ma)) throw new Error("Mã không hợp lệ.");
  const maDNSE = CHI_SO_DNSE[ma] ?? ma;
  const duong = laChiSo(ma) ? DNSE_INDEX : DNSE_STOCK;
  const den = Math.ceil(Date.now() / 1000 / 600) * 600;
  const tu = Math.floor((den - 86400 * 365 * 4) / 86400) * 86400;
  const j = await layJson(`${duong}?symbol=${maDNSE}&resolution=1H&from=${tu}&to=${den}`, 600);
  if (!Array.isArray(j.t) || j.t.length === 0) return [];
  const lam = (x) => Math.round(x * 1000) / 1000;
  return j.t
    .map((t, i) => [t, lam(j.o[i]), lam(j.h[i]), lam(j.l[i]), lam(j.c[i]), j.v?.[i] ?? 0])
    .filter((r) => r.slice(1, 5).every((x) => Number.isFinite(x) && x > 0) && r[2] >= r[3] && r[5] > 0)
    .sort((x, y) => x[0] - y[0]);
}

// Nen 1 PHUT cua hop dong tuong lai VN30F1M (DNSE chart-api, co tu 08/2018) cho cong cu tin hieu pha vo trong ngay (lib/phaVoPhaiSinh.js, trang /phai-sinh).
// Tra ve [[t (giay Unix), o, h, l, c, v], ...] tang dan. denGiay bo trong = den hien tai (lam tron 15 giay de bo nho dem cua fetch co tac dung, han cache 10 giay).
const DNSE_PHAI_SINH = "https://services.entrade.com.vn/chart-api/v2/ohlcs/derivative";
export async function layNenPhutPhaiSinh({ soNgay = 6, denGiay = null, ma = "VN30F1M" } = {}) {
  if (!/^[A-Z0-9]{4,12}$/.test(ma)) throw new Error("Mã hợp đồng không hợp lệ.");
  const hienTai = denGiay == null;
  const den = hienTai ? Math.ceil(Date.now() / 1000 / 15) * 15 : Math.floor(denGiay);
  const tu = Math.floor((den - 86400 * Math.min(Math.max(soNgay, 1), 60)) / 86400) * 86400;
  const j = await layJson(`${DNSE_PHAI_SINH}?symbol=${ma}&resolution=1&from=${tu}&to=${den}`, hienTai ? 10 : 3600);
  if (!Array.isArray(j.t) || j.t.length === 0) return [];
  return j.t
    .map((t, i) => [t, j.o[i], j.h[i], j.l[i], j.c[i], j.v?.[i] ?? 0])
    .filter((r) => r.slice(1, 5).every((x) => Number.isFinite(x) && x > 0) && r[2] >= r[3])
    .sort((x, y) => x[0] - y[0]);
}

// Nen "hom nay" dang chay, ghep tu du lieu PHUT (resolution=1) - nguon NGAY (1D) o tren chi tra ve
// cac phien DA CHOT, khong co nen dang giao dich (da doi chieu truc tiep 2026-09-24: goi 1D luc
// giua phien van chi thay den het hom qua). Tra ve null neu chua co giao dich nao hom nay (vd truoc
// gio mo cua) hoac nguon loi - khi do chart van hien binh thuong voi du lieu da chot, chi thieu nen
// hom nay cho toi lan lam moi ke tiep.
async function tuNenHomNayDangChay(ma) {
  const nenPhut = await layNenPhutHomNay(ma);
  if (nenPhut.length === 0) return null;
  const homNay = ngayIso(Math.floor(Date.now() / 1000));
  return {
    t: homNay,
    o: nenPhut[0].o,
    h: Math.max(...nenPhut.map((b) => b.h)),
    l: Math.min(...nenPhut.map((b) => b.l)),
    c: nenPhut[nenPhut.length - 1].c,
    v: nenPhut.reduce((tong, b) => tong + b.v, 0),
  };
}

async function tuVNDirect(ma, n) {
  if (laChiSo(ma)) {
    const den = Math.floor(Date.now() / 1000);
    const j = await layJson(`${DCHART}?symbol=${ma}&resolution=D&from=${den - 86400 * Math.ceil(n * 1.6)}&to=${den}`);
    if (j.s !== "ok" || !Array.isArray(j.t)) throw new Error("Chưa có dữ liệu cho chỉ số này.");
    return j.t.map((t, i) => ({ t: ngayIso(t), o: j.o[i], h: j.h[i], l: j.l[i], c: j.c[i], v: j.v?.[i] ?? 0 }));
  }
  const j = await layJson(`${FINFO}?sort=date:desc&q=code:${ma}&size=${n}&fields=date,open,high,low,close,adOpen,adHigh,adLow,adClose,nmVolume`);
  if (!Array.isArray(j.data) || j.data.length === 0) throw new Error("Chưa có dữ liệu giá cho mã này.");
  return j.data
    .map((d) => ({ t: d.date, o: d.adOpen ?? d.open, h: d.adHigh ?? d.high, l: d.adLow ?? d.low, c: d.adClose ?? d.close, v: d.nmVolume ?? 0 }))
    .reverse();
}

// Tra ve mang nen tang dan theo ngay: [{ t: "YYYY-MM-DD", o, h, l, c, v }]
export async function layLichSuGia(ma, soNen = SO_NEN_TOI_DA) {
  if (!MA_HOP_LE.test(ma)) throw new Error("Mã không hợp lệ.");
  const n = Math.min(Math.max(Number(soNen) || SO_NEN_TOI_DA, 50), SO_NEN_TOI_DA);
  let nen;
  try {
    nen = await tuDNSE(ma, n);
  } catch {
    nen = await tuVNDirect(ma, n); // DNSE loi hoac khong nhan dien ma (vd VNMIDCAP/VNSMALLCAP) -> du phong VNDirect.
  }
  nen = nen.filter(nenHopLe);
  // Ghep nen hom nay dang chay (neu co) - xem tuNenHomNayDangChay(). Loi/khong co du lieu o day KHONG
  // duoc de vo ca ham nay - chart van hien binh thuong voi cac phien da chot, chi thieu nen hom nay.
  try {
    const homNay = await tuNenHomNayDangChay(ma);
    if (homNay) {
      const cuoi = nen[nen.length - 1];
      if (cuoi && cuoi.t === homNay.t) nen[nen.length - 1] = homNay;
      else if (!cuoi || homNay.t > cuoi.t) nen.push(homNay);
    }
  } catch {
    // bo qua, giu nguyen nen da chot.
  }
  return chuanHoaTangDan(nen);
}

// LICH PHIEN GIAO DICH (cac ngay co nen cua VNINDEX, tang dan, dang "yyyy-mm-dd") - de dem so phien giu cua cac lenh khong co san so phien (lenh mua moi, xem lib/soPhienGiu.js).
// Loi nguon gia thi tra mang rong (khi do so phien hien "—", khong doan bua) - khong duoc lam hong trang goi no.
export async function layLichPhien(soNen = 400) {
  try {
    const nen = await layLichSuGia("VNINDEX", soNen);
    return nen.map((b) => b.t);
  } catch {
    return [];
  }
}

// Gop nen ngay thanh nen tuan (tuan bat dau thu Hai). Nhan thoi gian = ngay giao dich DAU TIEN cua tuan.
export function gopNenTuan(nen) {
  const kq = [];
  let khoaCu = null;
  for (const b of nen) {
    const d = new Date(`${b.t}T00:00:00Z`);
    const thu = (d.getUTCDay() + 6) % 7; // 0 = thu Hai
    const dauTuan = new Date(d.getTime() - thu * 86400e3).toISOString().slice(0, 10);
    if (dauTuan !== khoaCu) {
      kq.push({ ...b });
      khoaCu = dauTuan;
    } else {
      const cuoi = kq[kq.length - 1];
      cuoi.h = Math.max(cuoi.h, b.h);
      cuoi.l = Math.min(cuoi.l, b.l);
      cuoi.c = b.c;
      cuoi.v += b.v;
    }
  }
  return kq;
}
