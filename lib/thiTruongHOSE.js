// Du lieu TOAN SAN HOSE tu VNDirect finfo (cong khai, khong can dang nhap) cho Dashboard: thanh khoan (GTGD tong = khop lenh + thoa thuan),
// top GTGD, ANH HUONG INDEX (so diem moi ma dong gop vao VN-Index) va DINH GIA PE/PB cua ca thi truong. Chi DOC, khong ghi gi.
// Nguon ben thu ba nen moi ham chiu loi (tra null / nem loi cho noi goi bat) - goi trong try/catch.
import { layLichSuGia } from "@/lib/lichSuGia";
import { gopTySo } from "@/lib/tinhDinhGia";

export { gopTySo };

const TZ = "Asia/Ho_Chi_Minh";
const FINFO = "https://api-finfo.vndirect.com.vn/v4";
const CAC_COT_GIA = "code,type,basicPrice,close,pctChange,nmValue,nmVolume,ptValue,ptVolume";
const GTGD_TOI_THIEU_TY = 100; // duoi muc nay coi nhu chua/khong co phien (truoc gio mo cua, ngay nghi)

export const ngayVNHomNay = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });

// Cac ngay lam viec (T2-T6) tu hom nay lui ve truoc, moi ngay 1 chuoi yyyy-mm-dd (chua tru ngay le - ngay le se khong co du lieu va bi bo qua).
export function cacNgayLamViec(soNgay, tuNgay = new Date()) {
  const kq = [];
  for (let lui = 0; kq.length < soNgay && lui < soNgay * 2 + 14; lui++) {
    const d = new Date(tuNgay.getTime() - lui * 86400e3);
    const thu = d.toLocaleDateString("en-US", { weekday: "short", timeZone: TZ });
    if (thu === "Sat" || thu === "Sun") continue;
    kq.push(d.toLocaleDateString("en-CA", { timeZone: TZ }));
  }
  return kq;
}

async function layJsonFinfo(url, giay) {
  const res = await fetch(url, { next: { revalidate: giay }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`VNDirect trả lỗi HTTP ${res.status}.`);
  return res.json();
}

// Bang gia + GTGD cua TAT CA ma tren HOSE 1 ngay (co phieu, ETF, chung chi...). Ngay hom nay la so CHAY (cache 20s), ngay cu doi thanh cache dai.
// Null neu ngay do khong co du lieu (ngay le/cuoi tuan/truoc gio mo cua) hoac nguon loi.
export async function layBangGiaHOSENgay(ngayISO) {
  try {
    const giay = ngayISO === ngayVNHomNay() ? 20 : 86400;
    const j = await layJsonFinfo(`${FINFO}/stock_prices?q=date:${ngayISO}~floor:HOSE&size=1000&fields=${CAC_COT_GIA}`, giay);
    const rows = (j.data || []).filter((x) => Number.isFinite(x.nmValue));
    return rows.length >= 200 ? rows : null;
  } catch {
    return null;
  }
}

// GTGD TONG cua ngay = khop lenh (nmValue) + thoa thuan (ptValue), ty dong - cach cac trang tin tuc bao "thanh khoan VN-Index" (da doi chieu
// 24/09/2026: 13.406 + 3.275 = 16.680 ty, khop so 16.681 tren trang tham chieu). Null neu chua co giao dich dang ke.
export function tongGiaoDich(rows, ngayISO) {
  if (!rows) return null;
  const khopTy = rows.reduce((s, x) => s + (x.nmValue || 0), 0) / 1e9;
  const thoaThuanTy = rows.reduce((s, x) => s + (x.ptValue || 0), 0) / 1e9;
  if (khopTy + thoaThuanTy < GTGD_TOI_THIEU_TY) return null;
  return { ngay: ngayISO, giaTriTy: khopTy + thoaThuanTy, khopTy, thoaThuanTy, klTrieu: rows.reduce((s, x) => s + (x.nmVolume || 0), 0) / 1e6 };
}

// Chuoi GTGD toan san HOSE (tang dan theo ngay) N phien gan nhat co du lieu. Phan tu CUOI la phien moi nhat (hom nay neu dang/da giao dich).
export async function layChuoiThanhKhoanHOSE(soPhien = 22) {
  const ngayList = cacNgayLamViec(soPhien).reverse();
  const ketQua = await Promise.all(ngayList.map(async (n) => tongGiaoDich(await layBangGiaHOSENgay(n), n)));
  return ketQua.filter(Boolean);
}

// Top N ma co GTGD (khop + thoa thuan) lon nhat trong 1 phien - chi co phieu (bo ETF/chung chi).
export function topGTGD(rows, n = 10) {
  return (rows || [])
    .filter((x) => x.type === "STOCK")
    .map((x) => ({ ma: x.code, giaTriTy: ((x.nmValue || 0) + (x.ptValue || 0)) / 1e9, pct: x.pctChange }))
    .sort((a, b) => b.giaTriTy - a.giaTriTy)
    .slice(0, n);
}

// ---------- ANH HUONG INDEX ----------
// VN-Index tinh theo VON HOA (so co phieu niem yet x gia) nen so diem 1 ma dong gop = (thay doi von hoa cua ma / tong von hoa hom truoc) x VN-Index hom truoc.
// So co phieu suy tu MARKETCAP (VNDirect ratios) chia gia dong cua cung ngay - khong dung so co phieu tinh (co the lech). Da doi chieu 24/09/2026:
// tong uoc tinh -26,50 diem (thuc te -26,56); VIC -9,60 (-9,62), VHM -4,78 (-4,68), GAS -1,40 (-1,39), CTG -0,89 (-0,89).
async function layVonHoaHOSE(ngayISO) {
  try {
    const j = await layJsonFinfo(`${FINFO}/ratios?q=ratioCode:MARKETCAP~reportDate:${ngayISO}&size=3000`, ngayISO === ngayVNHomNay() ? 300 : 86400);
    const rows = j.data || [];
    return rows.length >= 300 ? Object.fromEntries(rows.map((x) => [x.code, Number(x.value)])) : null;
  } catch {
    return null;
  }
}

export async function layAnhHuongIndex(soMa = 10) {
  const ngayList = cacNgayLamViec(6);
  let phien = null;
  let rows = null;
  for (const n of ngayList) {
    const r = await layBangGiaHOSENgay(n);
    if (tongGiaoDich(r, n)) {
      phien = n;
      rows = r;
      break;
    }
  }
  if (!phien) throw new Error("Chưa có dữ liệu phiên giao dịch gần nhất.");

  // Von hoa: uu tien ngay cua phien (co gia dong cua cung ngay -> so co phieu = MC / gia dong); chua co (dang trong phien) thi lay phien TRUOC
  // (MC cua phien lien truoc / gia tham chieu hom nay - la gia dong phien do; ngay le khong co du lieu nen bi bo qua).
  const vonHoaPhien = await layVonHoaHOSE(phien);
  let vonHoa = vonHoaPhien;
  for (const n of ngayList.filter((d) => d < phien).slice(0, 4)) {
    if (vonHoa) break;
    vonHoa = await layVonHoaHOSE(n);
  }
  if (!vonHoa) throw new Error("Chưa có dữ liệu vốn hoá để tính ảnh hưởng.");
  const giaGoc = vonHoaPhien ? "close" : "basicPrice";

  const nen = await layLichSuGia("VNINDEX", 60);
  const iPhien = nen.findIndex((b) => b.t === phien);
  if (iPhien < 1) throw new Error("Chưa có dữ liệu VN-Index của phiên này.");
  const vniTruoc = nen[iPhien - 1].c;
  const vniHienTai = nen[iPhien].c;

  const ds = [];
  let tongTruoc = 0;
  for (const x of rows) {
    const v = vonHoa[x.code];
    const gg = x[giaGoc];
    if (x.type !== "STOCK" || !(v > 0) || !(gg > 0) || !(x.close > 0) || !(x.basicPrice > 0)) continue;
    const coPhieu = v / (gg * 1000);
    const capTruoc = coPhieu * x.basicPrice * 1000;
    tongTruoc += capTruoc;
    ds.push({ ma: x.code, dCap: coPhieu * (x.close - x.basicPrice) * 1000, pct: x.pctChange, gia: x.close });
  }
  for (const d of ds) d.diem = (d.dCap / tongTruoc) * vniTruoc;
  ds.sort((a, b) => b.diem - a.diem);
  const tongUocTinh = ds.reduce((s, d) => s + d.diem, 0);
  const goc = (d) => ({ ma: d.ma, diem: d.diem, pct: d.pct, gia: d.gia });
  return {
    ngay: phien,
    laHomNay: phien === ngayVNHomNay(),
    vniTruoc,
    vniHienTai,
    thayDoiDiem: vniHienTai - vniTruoc,
    tongUocTinh,
    soMaTang: ds.filter((d) => d.diem > 0).length,
    soMaGiam: ds.filter((d) => d.diem < 0).length,
    tang: ds.filter((d) => d.diem > 0).slice(0, soMa).map(goc),
    giam: ds.filter((d) => d.diem < 0).slice(-soMa).reverse().map(goc),
  };
}

// ---------- DINH GIA PE / PB THI TRUONG ----------
// PE/PB "ca thi truong" = TONG von hoa / TONG loi nhuan (hoac von chu so huu) cua cac ma HOSE - loi nhuan cua tung ma = von hoa / PE (nguon VNDirect ratios).
// Loai ma co PE/PB <= 0 (lo/vo nghia) khoi ca tu so lan mau so. Cac moc "TB 1/3/5 nam" o giao dien lay tu chuoi hang thang (lib/lichSuDinhGiaThiTruong.js).

async function layTySoNgay(ngayISO, maTyLe, hose) {
  const j = await layJsonFinfo(`${FINFO}/ratios?q=ratioCode:${maTyLe}~reportDate:${ngayISO}&size=3000`, ngayISO === ngayVNHomNay() ? 1800 : 86400);
  const kq = {};
  for (const x of j.data || []) if (hose.has(x.code) && Number.isFinite(Number(x.value))) kq[x.code] = Number(x.value);
  return kq;
}

export async function layDinhGiaThiTruong() {
  const ngayList = cacNgayLamViec(6);
  let ngay = null;
  let rowsGia = null;
  for (const n of ngayList) {
    const r = await layBangGiaHOSENgay(n);
    if (r) {
      ngay = n;
      rowsGia = r;
      break;
    }
  }
  if (!ngay) throw new Error("Chưa lấy được danh sách cổ phiếu HOSE.");
  const hose = new Set(rowsGia.filter((x) => x.type === "STOCK").map((x) => x.code));

  // Ngay co du lieu ty so moi nhat (ty so cap nhat cuoi ngay nen hom nay co the chua co): thu tu ngay phien lui ve truoc.
  let ngayTySo = null;
  let mc = null;
  for (const n of [ngay, ...ngayList.filter((d) => d < ngay)].slice(0, 5)) {
    const thu = await layTySoNgay(n, "MARKETCAP", hose).catch(() => null);
    if (thu && Object.keys(thu).length >= 300) {
      ngayTySo = n;
      mc = thu;
      break;
    }
  }
  if (!ngayTySo) throw new Error("Chưa có dữ liệu định giá (PE/PB) gần nhất.");
  const [pe, pb] = await Promise.all([layTySoNgay(ngayTySo, "PRICE_TO_EARNINGS", hose), layTySoNgay(ngayTySo, "PRICE_TO_BOOK", hose)]);

  const goi = (tySo) => gopTySo(mc, tySo);
  const peHT = goi(pe);
  const pbHT = goi(pb);
  return {
    ngay: ngayTySo,
    soMaHose: hose.size,
    tongVonHoaTy: peHT.tongVonHoa / 1e9,
    pe: { hienTai: peHT.giaTri, soMa: peHT.soMa, phuVonHoaPct: peHT.phuVonHoaPct },
    pb: { hienTai: pbHT.giaTri, soMa: pbHT.soMa, phuVonHoaPct: pbHT.phuVonHoaPct },
    // Giu lai von hoa + ty so tung ma de tang nganh (API gop theo nganh cua he thong, xem app/api/dinh-gia-thi-truong/route.js).
    _chiTiet: { mc, pe, pb },
  };
}
