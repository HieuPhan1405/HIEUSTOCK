// NHAT KY TIN HIEU XUAT HIEN (ham THUAN, khong dung DB - import tuong doi de test tay: engine/test/xuatHienTinHieu.test.mjs). Bang tin_hieu_xuat_hien xem lib/db.js.
//
// Muc dich: biet nguoi that MUA DUOC o gia nao so voi gia vao cua he thong. Backtest vao lenh o MOC CHUYEN MUA (gia chi dat duoc neu mua dung luc vuot moc) - con tren thuc te
// tin hieu hien len web o lan upload nao do trong phien (hoac sau dong cua), va co tin hieu hien trong phien roi MAT truoc khi dong cua (vuot gia) - loai nay backtest khong he tinh.
// Moi lan upload so dong tin_hieu CU (truoc khi ghi de) voi dong MOI:
//  - hien:  lenh vua xuat hien (truoc do chua giu lenh cung ngay mua) -> ghi gia luc do, gio, trong phien hay khong. Hien lai sau khi mat (cung ngay mua) -> bo co "mat".
//  - cuoi:  lenh dang giu ma hom nay CHINH LA ngay tin hieu -> cap nhat gia cuoi cung thay trong ngay (lan upload sau ATC ~ gia dong cua).
//  - mat:   lan truoc dang giu, lan nay khong con, ma hom nay la ngay tin hieu -> tin hieu mat trong ngay (vuot gia / chap chon).
const dangGiuTin = (t) => t === "MUA" || t === "NAM GIU";

// Cach doc tung loai lenh tu dong tin hieu MOI (dsMoi, ngay dang "yyyy-mm-dd") va dong CU trong DB (banGhiCuTheoMa, ngay dang *_txt).
export const LOAI_XUAT_HIEN = [
  {
    loai: "goc",
    dangGiu: (h) => dangGiuTin(h.tin),
    ngay: (h) => h.ngay_mua,
    giaMoc: (h) => h.gia_mua,
    cuDangGiu: (c) => dangGiuTin(c.tin),
    cuNgay: (c) => c.ngay_mua_txt,
  },
  {
    loai: "giua",
    dangGiu: (h) => h.dang_giu_giua === true,
    ngay: (h) => h.ngay_mua_giua,
    giaMoc: (h) => h.gia_mua_giua,
    cuDangGiu: (c) => c.dang_giu_giua === true,
    cuNgay: (c) => c.ngay_mua_giua_txt,
  },
  {
    loai: "moi",
    dangGiu: (h) => h.dang_giu_moi === true,
    ngay: (h) => h.ngay_mua_moi,
    giaMoc: (h) => h.gia_mua_moi,
    cuDangGiu: (c) => c.dang_giu_moi === true,
    cuNgay: (c) => c.ngay_mua_moi_txt,
  },
];

const duong = (v) => (Number(v) > 0 ? Number(v) : null);

// dsMoi: [{ ma, tin, gia, ngay_mua, gia_mua, dang_giu_giua, ngay_mua_giua, gia_mua_giua, dang_giu_moi, ngay_mua_moi, gia_mua_moi }] (so da chuyen kieu); banGhiCuTheoMa: { ma: dong DB cu };
// bayGio: ISO; ngayHomNay: "yyyy-mm-dd" (ngay giao dich VN); trongPhien: upload luc dang giao dich. Tra ve { hien, cuoi, mat }.
export function phatHienXuatHien({ dsMoi, banGhiCuTheoMa, bayGio, ngayHomNay, trongPhien }) {
  const hien = [];
  const cuoi = [];
  const mat = [];
  for (const h of dsMoi) {
    if (!h.ma || h.ma === "VNINDEX") continue;
    const c = banGhiCuTheoMa[h.ma];
    const gia = duong(h.gia);
    for (const L of LOAI_XUAT_HIEN) {
      const giuMoi = L.dangGiu(h);
      const ngayMoi = giuMoi ? L.ngay(h) : null;
      const giuCu = !!c && L.cuDangGiu(c);
      const ngayCu = giuCu ? L.cuNgay(c) : null;
      if (giuMoi && ngayMoi) {
        if (!(giuCu && ngayCu === ngayMoi)) {
          hien.push({ ma: h.ma, loai: L.loai, ngay_mua: ngayMoi, ngay_hien: ngayHomNay, gia_moc: duong(L.giaMoc(h)), gia_luc_hien: gia, luc_hien: bayGio, trong_phien: !!trongPhien });
        }
        if (ngayMoi === ngayHomNay && gia != null) cuoi.push({ ma: h.ma, loai: L.loai, ngay_mua: ngayMoi, gia, luc: bayGio });
      }
      // Lan truoc dang giu lenh co ngay tin hieu = hom nay, lan nay khong con (hoac da la lenh khac) -> tin hieu mat trong ngay.
      if (giuCu && ngayCu && ngayCu === ngayHomNay && !(giuMoi && ngayMoi === ngayCu)) {
        mat.push({ ma: h.ma, loai: L.loai, ngay_mua: ngayCu, gia, luc: bayGio });
      }
    }
  }
  return { hien, cuoi, mat };
}

const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const trungVi = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const chenh = (gia, moc) => (Number(gia) > 0 && Number(moc) > 0 ? (Number(gia) / Number(moc) - 1) * 100 : null);

// Thong ke tu cac dong bang tin_hieu_xuat_hien (ngay dang "yyyy-mm-dd"): theo tung loai lenh. ngayHomNay: tin hieu CUA HOM NAY dang mat co the con hien lai nen dem rieng (dangMat).
// chenhLucHien: gia luc web thay lan dau so voi gia vao he thong - CHI tinh tin hieu hien DUNG ngay tin hieu (hien tre vi bo lo lan upload thi khong so duoc).
export function thongKeXuatHien(rows, ngayHomNay) {
  const ra = {};
  for (const L of LOAI_XUAT_HIEN) {
    const ds = rows.filter((r) => r.loai === L.loai);
    if (!ds.length) continue;
    const dungNgay = ds.filter((r) => r.ngay_hien === r.ngay_mua);
    const lucHien = dungNgay.map((r) => chenh(r.gia_luc_hien, r.gia_moc)).filter((x) => x != null);
    const cuoiNgay = ds.filter((r) => !r.mat_tin_hieu).map((r) => chenh(r.gia_cuoi_ngay, r.gia_moc)).filter((x) => x != null);
    const daChot = ds.filter((r) => r.ngay_mua < ngayHomNay); // ngay tin hieu da qua: ket qua mat / khong mat la chac chan
    const vuotGia = daChot.filter((r) => r.mat_tin_hieu);
    ra[L.loai] = {
      soTinHieu: ds.length,
      soTrongPhien: ds.filter((r) => r.trong_phien).length,
      soHienTre: ds.length - dungNgay.length,
      chenhLucHienTB: tb(lucHien),
      chenhLucHienTrungVi: trungVi(lucHien),
      soDoChenh: lucHien.length,
      chenhCuoiNgayTB: tb(cuoiNgay),
      soDaChot: daChot.length,
      soVuotGia: vuotGia.length,
      tyLeVuotGia: daChot.length ? (vuotGia.length / daChot.length) * 100 : null,
      soTungChapChon: daChot.filter((r) => Number(r.so_lan_mat) > 0 && !r.mat_tin_hieu).length,
      dangMat: ds.filter((r) => r.ngay_mua >= ngayHomNay && r.mat_tin_hieu).length,
    };
  }
  return ra;
}

export const chenhLech = chenh;
