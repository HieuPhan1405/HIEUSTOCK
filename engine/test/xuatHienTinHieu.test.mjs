// Test tay cho lib/xuatHienTinHieu.js (ghi gia/gio luc tin hieu hien lan dau + tin hieu mat trong ngay). Chay: node engine/test/xuatHienTinHieu.test.mjs
import { phatHienXuatHien, thongKeXuatHien } from "../../lib/xuatHienTinHieu.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => a != null && Math.abs(a - b) <= e;

const HOM_NAY = "2026-09-28";
const LUC = "2026-09-28T03:15:00.000Z";
const chay = (dsMoi, cu = {}) => phatHienXuatHien({ dsMoi, banGhiCuTheoMa: cu, bayGio: LUC, ngayHomNay: HOM_NAY, trongPhien: true });

// 1. Tin hieu MUA moi xuat hien trong phien
let r = chay([{ ma: "AAA", tin: "MUA", gia: 25.3, ngay_mua: HOM_NAY, gia_mua: 25 }], { AAA: { tin: "TRUNG LAP" } });
ok("hien: 1 dong lenh dau, gia luc hien + gia moc", r.hien.length === 1 && r.hien[0].loai === "goc" && r.hien[0].gia_luc_hien === 25.3 && r.hien[0].gia_moc === 25 && r.hien[0].trong_phien === true && r.hien[0].ngay_hien === HOM_NAY);
ok("hien: ngay tin hieu = hom nay -> cap nhat gia cuoi ngay", r.cuoi.length === 1 && r.cuoi[0].gia === 25.3);
ok("hien: khong mat", r.mat.length === 0);

// 2. Lan upload sau, van MUA cung ngay mua -> khong ghi hien lai, chi cap nhat gia cuoi
r = chay([{ ma: "AAA", tin: "MUA", gia: 25.8, ngay_mua: HOM_NAY, gia_mua: 25 }], { AAA: { tin: "MUA", ngay_mua_txt: HOM_NAY } });
ok("dang giu cung ngay: khong hien lai, cap nhat gia cuoi 25.8", r.hien.length === 0 && r.cuoi.length === 1 && r.cuoi[0].gia === 25.8 && r.mat.length === 0);

// 3. Tin hieu mat trong ngay (vuot gia)
r = chay([{ ma: "AAA", tin: "TRUNG LAP", gia: 24.7, ngay_mua: null }], { AAA: { tin: "MUA", ngay_mua_txt: HOM_NAY } });
ok("mat trong ngay: ghi mat, gia luc mat", r.mat.length === 1 && r.mat[0].ngay_mua === HOM_NAY && r.mat[0].gia === 24.7 && r.hien.length === 0);

// 4. Ngay hom sau ban binh thuong -> KHONG phai vuot gia
r = chay([{ ma: "AAA", tin: "BAN", gia: 24, ngay_mua: null }], { AAA: { tin: "NAM GIU", ngay_mua_txt: "2026-09-20" } });
ok("ban ngay khac: khong tinh la mat", r.mat.length === 0 && r.hien.length === 0 && r.cuoi.length === 0);

// 5. Hien tre (bo lo upload ngay tin hieu): ngay_mua < hom nay, khong cap nhat gia cuoi
r = chay([{ ma: "BBB", tin: "NAM GIU", gia: 30, ngay_mua: "2026-09-25", gia_mua: 29 }], {});
ok("hien tre: ghi hien voi ngay_hien = hom nay, khong cuoi ngay", r.hien.length === 1 && r.hien[0].ngay_mua === "2026-09-25" && r.hien[0].ngay_hien === HOM_NAY && r.cuoi.length === 0);

// 6. Mua moi (giua) xuat hien + lenh dau van giu
r = chay(
  [{ ma: "CCC", tin: "NAM GIU", gia: 40, ngay_mua: "2026-09-10", gia_mua: 36, dang_giu_giua: true, ngay_mua_giua: HOM_NAY, gia_mua_giua: 40 }],
  { CCC: { tin: "NAM GIU", ngay_mua_txt: "2026-09-10", dang_giu_giua: false } }
);
ok("mua moi: chi ghi lenh giua, lenh dau khong ghi lai", r.hien.length === 1 && r.hien[0].loai === "giua" && r.hien[0].gia_moc === 40);
// Mua moi mat trong ngay, lenh dau van giu
r = chay(
  [{ ma: "CCC", tin: "NAM GIU", gia: 39.5, ngay_mua: "2026-09-10", gia_mua: 36, dang_giu_giua: false }],
  { CCC: { tin: "NAM GIU", ngay_mua_txt: "2026-09-10", dang_giu_giua: true, ngay_mua_giua_txt: HOM_NAY } }
);
ok("mua moi mat trong ngay: chi mat lenh giua", r.mat.length === 1 && r.mat[0].loai === "giua" && r.hien.length === 0);

// 7. Mat roi hien lai cung ngay mua -> ghi "hien" (DB se bo co mat)
r = chay([{ ma: "AAA", tin: "MUA", gia: 25.2, ngay_mua: HOM_NAY, gia_mua: 25 }], { AAA: { tin: "TRUNG LAP", ngay_mua_txt: HOM_NAY } });
ok("hien lai sau khi mat: co dong hien", r.hien.length === 1 && r.hien[0].ngay_mua === HOM_NAY);
ok("bo qua VNINDEX", chay([{ ma: "VNINDEX", tin: "MUA", gia: 1, ngay_mua: HOM_NAY }]).hien.length === 0);

// ---- Thong ke
const d = (o) => ({ ma: "X", loai: "goc", ngay_mua: "2026-09-25", ngay_hien: "2026-09-25", gia_moc: 20, gia_luc_hien: 20.2, trong_phien: true, gia_cuoi_ngay: 20.4, mat_tin_hieu: false, so_lan_mat: 0, ...o });
const rows = [
  d({}),
  d({ ma: "Y", gia_luc_hien: 20.6, gia_cuoi_ngay: 20.2 }),
  d({ ma: "Z", mat_tin_hieu: true, so_lan_mat: 1, gia_cuoi_ngay: 19.8 }), // vuot gia
  d({ ma: "W", so_lan_mat: 2 }), // chap chon nhung giu duoc den cuoi ngay
  d({ ma: "V", ngay_hien: "2026-09-26", gia_luc_hien: 22 }), // hien tre
  d({ ma: "U", ngay_mua: HOM_NAY, ngay_hien: HOM_NAY, mat_tin_hieu: true, so_lan_mat: 1 }), // hom nay dang mat, chua chot
  d({ ma: "T", loai: "giua", gia_moc: 30, gia_luc_hien: 30, trong_phien: false, gia_cuoi_ngay: 30 }),
];
const tk = thongKeXuatHien(rows, HOM_NAY);
ok("thong ke goc: 6 tin hieu, 1 hien tre", tk.goc.soTinHieu === 6 && tk.goc.soHienTre === 1);
// chenh luc hien: X 1%, Y 3%, Z 1%, W 1%, U 1% (khong tinh V hien tre) -> TB 1.4%, trung vi 1%
ok("chenh luc hien TB 1.4%, trung vi 1% (bo hien tre)", gan(tk.goc.chenhLucHienTB, 1.4, 1e-6) && gan(tk.goc.chenhLucHienTrungVi, 1, 1e-6) && tk.goc.soDoChenh === 5, JSON.stringify(tk.goc));
ok("vuot gia: 1/5 tin hieu da chot (bo hom nay)", tk.goc.soDaChot === 5 && tk.goc.soVuotGia === 1 && gan(tk.goc.tyLeVuotGia, 20));
ok("chap chon nhung giu duoc: 1; hom nay dang mat: 1", tk.goc.soTungChapChon === 1 && tk.goc.dangMat === 1);
ok("thong ke giua tach rieng", tk.giua.soTinHieu === 1 && tk.giua.soTrongPhien === 0 && gan(tk.giua.chenhLucHienTB, 0));
ok("rong -> {}", Object.keys(thongKeXuatHien([], HOM_NAY)).length === 0);

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
