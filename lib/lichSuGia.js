// Lich su gia OHLCV cho bieu do ky thuat - lay tu API cong khai cua VNDirect (chinh la nguon trang web VNDirect dung).
//   Co phieu: finfo stock_prices, dung gia THUC (open/high/low/close, KHONG dieu chinh co tuc/thuong CP) de khop voi
//             du lieu AmiBroker va cac chi bao AFL; khoi luong = nmVolume (khop lenh, khong tinh thoa thuan).
//   Chi so (VNINDEX, VN30...): dchart-api (chi so khong bi dieu chinh).
// Gia don vi nghin dong, giong AmiBroker/web. Du lieu do ben thu ba nen phai chiu loi (goi ham nay trong try/catch).

const FINFO = "https://api-finfo.vndirect.com.vn/v4/stock_prices";
const DCHART = "https://dchart-api.vndirect.com.vn/dchart/history";
const CHI_SO = new Set(["VNINDEX", "VN30", "HNXINDEX", "HNX30", "UPCOMINDEX", "VNMIDCAP", "VNSMALLCAP"]);

export const MA_HOP_LE = /^[A-Z0-9]{2,12}$/;
export const SO_NEN_TOI_DA = 1000;

export function laChiSo(ma) {
  return CHI_SO.has(ma);
}

async function layJson(url) {
  // Khong gui header Accept: dchart-api tra 406 neu Accept la application/json.
  const res = await fetch(url, { next: { revalidate: 600 }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Nguồn giá trả về lỗi (HTTP ${res.status}).`);
  return res.json();
}

const ngayIso = (giay) => new Date(giay * 1000).toISOString().slice(0, 10);
const nenHopLe = (b) => [b.o, b.h, b.l, b.c].every((x) => Number.isFinite(x) && x > 0) && b.h >= b.l;

// Tra ve mang nen tang dan theo ngay: [{ t: "YYYY-MM-DD", o, h, l, c, v }]
export async function layLichSuGia(ma, soNen = SO_NEN_TOI_DA) {
  if (!MA_HOP_LE.test(ma)) throw new Error("Mã không hợp lệ.");
  const n = Math.min(Math.max(Number(soNen) || SO_NEN_TOI_DA, 50), SO_NEN_TOI_DA);
  let nen;
  if (laChiSo(ma)) {
    const den = Math.floor(Date.now() / 1000);
    const j = await layJson(`${DCHART}?symbol=${ma}&resolution=D&from=${den - 86400 * Math.ceil(n * 1.6)}&to=${den}`);
    if (j.s !== "ok" || !Array.isArray(j.t)) throw new Error("Chưa có dữ liệu cho chỉ số này.");
    nen = j.t.map((t, i) => ({ t: ngayIso(t), o: j.o[i], h: j.h[i], l: j.l[i], c: j.c[i], v: j.v?.[i] ?? 0 }));
  } else {
    const j = await layJson(`${FINFO}?sort=date:desc&q=code:${ma}&size=${n}`);
    if (!Array.isArray(j.data) || j.data.length === 0) throw new Error("Chưa có dữ liệu giá cho mã này.");
    nen = j.data.map((d) => ({ t: d.date, o: d.open, h: d.high, l: d.low, c: d.close, v: d.nmVolume ?? 0 })).reverse();
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
