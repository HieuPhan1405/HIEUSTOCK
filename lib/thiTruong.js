// Tong hop "Ra soat nhanh thi truong" tu du lieu quet cua he thong (~390 ma) + dong tien khoi ngoai tu VNDirect.
// Tat ca tinh tren cac ma he thong dang theo doi (khong phai toan bo thi truong), nen o giao dien phai ghi ro pham vi.
import { NGANH_NHAN } from "@/lib/nganh";
import { laChoPhienSau, NGUONG_DIEM_MUA } from "@/components/dungChung";
import { cacDiemMuaMoi } from "@/lib/muaThemTinhToan";

const GTGD_TOI_THIEU_TY = 5; // bo cac ma thanh khoan mong khi xep top tang/giam
const trungBinh = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);

export function nhanTamLy(diem) {
  if (diem == null) return { nhan: "Chưa đủ dữ liệu", mau: "#8B8B99" };
  if (diem < 20) return { nhan: "Hoảng loạn", mau: "#EF4444" };
  if (diem < 40) return { nhan: "Lo ngại & thận trọng", mau: "#F97316" };
  if (diem < 60) return { nhan: "Trung lập", mau: "#FBBF24" };
  if (diem < 80) return { nhan: "Lạc quan", mau: "#84CC16" };
  return { nhan: "Hưng phấn", mau: "#22C55E" };
}

// ds: cac dong tin hieu (da chuan hoa), vnindex: dong VNINDEX hoac null.
export function tinhTongQuanThiTruong(ds, vnindex) {
  const dsGia = ds.filter((r) => r.doi != null);
  const dem = (f) => dsGia.filter(f).length;
  const doRong = {
    tong: dsGia.length,
    tangManh: dem((r) => r.doi > 3),
    tangNhe: dem((r) => r.doi > 0 && r.doi <= 3),
    dung: dem((r) => r.doi === 0),
    giamNhe: dem((r) => r.doi < 0 && r.doi >= -3),
    giamManh: dem((r) => r.doi < -3),
  };
  doRong.tang = doRong.tangManh + doRong.tangNhe;
  doRong.giam = doRong.giamNhe + doRong.giamManh;

  const thanhKhoan = (r) => (r.gtgd_tb20 ?? 0) >= GTGD_TOI_THIEU_TY;
  const topTang = dsGia.filter(thanhKhoan).sort((a, b) => b.doi - a.doi).slice(0, 10);
  const topGiam = dsGia.filter(thanhKhoan).sort((a, b) => a.doi - b.doi).slice(0, 10);
  const vuotDinh = ds
    .filter((r) => r.dinh_52t > 0 && r.gia >= r.dinh_52t)
    .sort((a, b) => (b.gtgd_tb20 ?? 0) - (a.gtgd_tb20 ?? 0))
    .slice(0, 10);
  const soVuotDinh = ds.filter((r) => r.dinh_52t > 0 && r.gia >= r.dinh_52t).length;

  const theoNganh = {};
  for (const r of dsGia) if (r.nganh) (theoNganh[r.nganh] ||= []).push(r.doi);
  const nganh = Object.entries(theoNganh)
    .filter(([, v]) => v.length >= 3)
    .map(([k, v]) => ({ khoa: k, nhan: NGANH_NHAN[k] || k, tb: trungBinh(v), n: v.length }))
    .sort((a, b) => b.tb - a.tb);
  const nganhTot = nganh.slice(0, 4);
  const nganhXau = nganh.slice(-4).reverse();

  const mua = ds.filter((r) => r.tin === "MUA");
  const ban = ds.filter((r) => r.tin === "BAN");
  const choPhienSau = ds.filter(laChoPhienSau);
  const dangGiu = ds.filter((r) => r.tin === "MUA" || r.tin === "NAM GIU").length;
  const daChotTP3 = ds.filter((r) => (r.tin === "MUA" || r.tin === "NAM GIU") && r.tp_da_cham === "TP3");
  // LENH MUA-BAN cua he thong: mua, mua them / mua moi (diem mua giua chung + diem mua sau TP3 cua lenh cu), ban, ban bot, chot loi theo moc TP da cham
  // (dang giu lenh), va cac lenh KET THUC (cach quan ly moi tu 2026-09-25: cham TP3 = dong lenh, hoac thoat theo Kijun sau TP2).
  const dangGiuLenh = (r) => r.tin === "MUA" || r.tin === "NAM GIU";
  // ly_do_ban chi co nghia o phien BAN that su: 4 = thoat Kijun sau TP2, 5 = chot du TP3 (ket thuc lenh); 1-3 = ban thuong / cat lo / bao ve lai.
  const lyDoBan = (r) => Number(r.ly_do_ban) || 0;
  const banThuong = ban.filter((r) => lyDoBan(r) !== 4 && lyDoBan(r) !== 5);
  // Moi diem mua = 1 dong { ma, vong: "giua" | "moi", giaMua, gia (hien tai), homNay,... } - 1 ma co the co ca 2 (xem lib/muaThemTinhToan.js).
  const diemMua = ds.flatMap(cacDiemMuaMoi);
  const lenh = {
    mua,
    muaThemHomNay: diemMua.filter((d) => d.homNay),
    dangMuaThem: diemMua.filter((d) => !d.homNay),
    ban: banThuong,
    ketThucTP3: ban.filter((r) => lyDoBan(r) === 5),
    thoatKijun: ban.filter((r) => lyDoBan(r) === 4),
    banBot: ds.filter((r) => dangGiuLenh(r) && r.ban_bot),
    // Vi the CU con phan giu chay sau TP3 (cach 30/30/25/15 truoc 2026-09-25) - lenh moi khong bao gio dung o TP3.
    chotTP3: ds.filter((r) => dangGiuLenh(r) && r.tp_da_cham === "TP3"),
    chotTP2: ds.filter((r) => dangGiuLenh(r) && r.tp_da_cham === "TP2"),
    chotTP1: ds.filter((r) => dangGiuLenh(r) && r.tp_da_cham === "TP1"),
    coDuLieuMuaThem: ds.some((r) => r.dang_giu_moi != null || r.dang_giu_giua != null),
  };

  const ti = (dk, mau) => {
    const co = ds.filter(mau);
    return co.length ? (co.filter(dk).length / co.length) * 100 : null;
  };
  const tren = {
    kijun: ti((r) => r.gia > r.kijun, (r) => r.kijun > 0 && r.gia > 0),
    canBang: ti((r) => r.gia > r.gg_top, (r) => r.gg_top > 0 && r.gia > 0),
    datDiem: ti((r) => r.diem >= NGUONG_DIEM_MUA, (r) => r.diem != null),
  };
  const tyTang = doRong.tong ? (doRong.tang / doRong.tong) * 100 : null;
  // Thang tam ly 0-100 = trung binh 4 ty le (% ma tang gia, % tren Kijun, % tren duong can bang dai han, % ma dat diem MUA).
  const thanhPhan = [tyTang, tren.kijun, tren.canBang, tren.datDiem].filter((x) => x != null);
  const tamLy = thanhPhan.length ? Math.round(trungBinh(thanhPhan)) : null;

  let xuHuong = null;
  if (vnindex) {
    const t = vnindex.trend;
    xuHuong = t == null || (t <= 0.5 && t >= -0.5) ? { nhan: "Đi ngang", mau: "#FBBF24" } : t > 0.5 ? { nhan: "Tăng", mau: "#22C55E" } : { nhan: "Giảm", mau: "#EF4444" };
  }

  return {
    doRong,
    topTang,
    topGiam,
    vuotDinh,
    soVuotDinh,
    nganhTot,
    nganhXau,
    mua,
    ban,
    choPhienSau,
    daChotTP3,
    lenh,
    dangGiu,
    tong: ds.length,
    tyLeDangGiu: ds.length ? (dangGiu / ds.length) * 100 : null,
    tren,
    tamLy,
    xuHuong,
  };
}

// Dong tien khoi ngoai phien gan nhat co du lieu (VNDirect finfo /foreigns). Tra null neu nguon loi.
export async function layDongTienNuocNgoai() {
  const tz = "Asia/Ho_Chi_Minh";
  const homNay = new Date();
  for (let lui = 0; lui < 7; lui++) {
    const d = new Date(homNay.getTime() - lui * 86400e3);
    const thu = d.toLocaleDateString("en-US", { weekday: "short", timeZone: tz });
    if (thu === "Sat" || thu === "Sun") continue;
    const ngay = d.toLocaleDateString("en-CA", { timeZone: tz });
    try {
      const res = await fetch(
        `https://api-finfo.vndirect.com.vn/v4/foreigns?q=type:STOCK~tradingDate:${ngay}&size=2000&fields=code,floor,netVal,tradingDate`,
        { next: { revalidate: 300 }, signal: AbortSignal.timeout(12000) }
      );
      if (!res.ok) continue;
      const j = await res.json();
      const data = (j.data || []).filter((x) => Number.isFinite(x.netVal));
      if (data.length < 200) continue;
      const tyDong = (v) => v / 1e9;
      const hose = data.filter((x) => x.floor === "HOSE");
      return {
        ngay,
        rongHose: tyDong(hose.reduce((s, x) => s + x.netVal, 0)),
        topMua: data.filter((x) => x.netVal > 0).sort((a, b) => b.netVal - a.netVal).slice(0, 10).map((x) => ({ ma: x.code, tyDong: tyDong(x.netVal) })),
        topBan: data.filter((x) => x.netVal < 0).sort((a, b) => a.netVal - b.netVal).slice(0, 10).map((x) => ({ ma: x.code, tyDong: tyDong(x.netVal) })),
      };
    } catch {
      /* thu ngay truoc do */
    }
  }
  return null;
}

// Chuoi GTGD toan san HOSE (tong khop lenh + thoa thuan) - chuyen sang lib/thiTruongHOSE.js cung cac ham HOSE khac; giu re-export cho noi cu.
export { layChuoiThanhKhoanHOSE } from "@/lib/thiTruongHOSE";
