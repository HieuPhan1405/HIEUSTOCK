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

async function layJson(url) {
  // Khong gui header Accept: dchart-api (VNDirect) tra 406 neu Accept la application/json.
  const res = await fetch(url, { next: { revalidate: 120 }, signal: AbortSignal.timeout(15000) });
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

async function tuDNSE(ma, n) {
  const maDNSE = CHI_SO_DNSE[ma] ?? ma;
  const duong = laChiSo(ma) ? DNSE_INDEX : DNSE_STOCK;
  const den = Math.floor(Date.now() / 1000);
  const tu = den - 86400 * Math.ceil(n * 1.6);
  const j = await layJson(`${duong}?symbol=${maDNSE}&resolution=1D&from=${tu}&to=${den}`);
  if (!Array.isArray(j.t) || j.t.length === 0) throw new Error("DNSE không có dữ liệu.");
  return j.t.map((t, i) => ({ t: ngayIso(t), o: j.o[i], h: j.h[i], l: j.l[i], c: j.c[i], v: j.v?.[i] ?? 0 }));
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
  return nen.filter(nenHopLe);
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
