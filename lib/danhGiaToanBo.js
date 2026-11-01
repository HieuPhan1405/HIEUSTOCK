// GOP TOAN BO DANH GIA 1 DANH MUC (dung cho trang + "sau khi lam theo ke hoach" + bao cao) - ham THUAN.
// vitri = vitriTuNhap(...), theoMa = { MA: dong tin hieu rut gon (+ du lieu tinh tu nen cho ma ngoai danh sach) }, du = ket qua /api/lich-su-danh-muc (co the null khi chua tai).
import { danhGiaDanhMuc } from "./danhGiaDanhMuc.js";
import { phanTichRuiRo, chamDiemSucKhoe, nhanXetRuiRo } from "./ruiRoDanhMuc.js";
import { layPhongCach, nhanTrangThai, dauVaoNhan, NHAN } from "./phongCachDauTu.js";
import { tomTatCoBan } from "./coBanDanhMuc.js";

// Gop cac dong pb.hang cung ma thanh 1 dong / ma (ty trong, gia tri cong lai; gia von binh quan)
export function hangTheoMa(hang = []) {
  const m = new Map();
  for (const h of hang) {
    const c = m.get(h.ma);
    if (!c) {
      m.set(h.ma, { ...h });
      continue;
    }
    const kl = c.kl + h.kl;
    const von = c.von != null && h.von != null ? c.von + h.von : null;
    const giaTri = c.giaTri != null && h.giaTri != null ? c.giaTri + h.giaTri : c.giaTri ?? h.giaTri;
    m.set(h.ma, { ...c, kl, von, giaVon: von != null ? von / kl / 1000 : c.giaVon ?? h.giaVon, giaTri, tyTrong: (c.tyTrong ?? 0) + (h.tyTrong ?? 0) || null, laiLo: von != null && giaTri != null ? giaTri - von : null, laiLoPct: von > 0 && giaTri != null ? ((giaTri - von) / von) * 100 : null });
  }
  return [...m.values()];
}

export function danhGiaToanBo({ vitri = [], theoMa = {}, du = null, von = {}, gocNganh = {}, phongCach, coTinHieu = false } = {}) {
  if (!vitri.length) return null;
  const pc = layPhongCach(phongCach);
  const pb = danhGiaDanhMuc(vitri, theoMa, { ...von, gocNganh });
  let rr = null;
  if (du?.ngay?.length) {
    const giaTri = {};
    for (const h of pb.hang) if (h.giaTri > 0 && du.ma?.[h.ma]) giaTri[h.ma] = (giaTri[h.ma] ?? 0) + h.giaTri;
    const gia = Object.fromEntries(Object.entries(du.ma ?? {}).map(([m, x]) => [m, x.c]));
    const gtgd = Object.fromEntries(Object.entries(du.ma ?? {}).map(([m, x]) => [m, x.gtgd20]));
    rr = phanTichRuiRo({ ngay: du.ngay, vni: du.vni, gia, giaTri, gtgd, tienMat: pb.taiSan.tienMat, no: pb.taiSan.no, nguongCB: pb.nguong.canhBao, nguongGC: pb.nguong.giaiChap });
  }
  const cbTheoMa = du?.coBan ?? {};
  const rcTheoMa = Object.fromEntries((rr?.ma ?? []).map((x) => [x.ma, x.rc]));
  const hangMa = hangTheoMa(pb.hang);
  const nhan = {};
  for (const h of hangMa) {
    if (!h.coDuLieu) continue;
    nhan[h.ma] = nhanTrangThai(dauVaoNhan(h, { r: theoMa[h.ma], ls: du?.ma?.[h.ma], cb: cbTheoMa[h.ma] ?? null, rc: rcTheoMa[h.ma] ?? null, coTinHieu }), phongCach);
  }
  const tyLeTheoNhan = (k) => hangMa.filter((h) => nhan[h.ma]?.nhan === k).reduce((s, h) => s + (h.tyTrong ?? 0), 0);
  const dn = Object.keys(cbTheoMa).length ? tomTatCoBan(hangMa, cbTheoMa, { phongCach, thiTruong: du?.thiTruong ?? null }) : null;
  const suc = chamDiemSucKhoe(pb, rr, { trongSo: pc.trongSo, doanhNghiep: dn && dn.phuGiaTri >= 0.5 ? dn.diem : null, xuHuongDaiHan: pc.xuHuongDaiHan, tyLeThoat: tyLeTheoNhan("thoat") });
  // NHAN XET gop: rui ro (1 nam gia) + doanh nghiep + danh muc (phan bo, margin, tung ma) + tong ket trang thai THEO PHONG CACH
  // (thay cho cac nhan xet goc nhin xu huong cua pb - "N ma canh bao nang", "duoi Kijun" - de nhan xet khong mau thuan voi phong cach dang chon).
  const nx = [...nhanXetRuiRo(rr, pb), ...(dn?.nhanXet ?? []), ...pb.nhanXet.filter((x) => x.loai !== "xu_huong" && !(x.loai === "cat_lo" && pc.catLo == null)).map((x, k) => ({ muc: x.muc, uuTien: 3 + k * 0.1, tieuDe: null, noiDung: x.nhan }))];
  const canXuLy = hangMa.filter((h) => NHAN[nhan[h.ma]?.nhan]?.muc >= 2);
  const tyLeCan = Math.round(canXuLy.reduce((s, h) => s + (h.tyTrong ?? 0), 0) * 100);
  const tieuDePc = `Theo phong cách ${pc.ngan.toLowerCase()}`;
  if (canXuLy.length)
    nx.push({
      muc: canXuLy.some((h) => nhan[h.ma].nhan === "thoat") ? 0 : 1,
      uuTien: 0.5,
      tieuDe: tieuDePc,
      // khach: chi so luong + ty trong (khong ten ma) - chi tiet tung ma la phan cua thanh vien
      noiDung: coTinHieu
        ? `${canXuLy.length} mã cần xử lý: ${canXuLy.slice(0, 4).map((h) => `${h.ma} (${NHAN[nhan[h.ma].nhan].ten.toLowerCase()})`).join(", ")}${canXuLy.length > 4 ? "…" : ""} — chiếm ${tyLeCan}% giá trị. Xem kế hoạch xử lý.`
        : `${canXuLy.length} mã (chiếm ${tyLeCan}% giá trị) cần giảm tỷ trọng hoặc thoát. Thành viên xem từng mã và kế hoạch xử lý.`,
    });
  else if (hangMa.some((h) => nhan[h.ma])) nx.push({ muc: 2, uuTien: 6, tieuDe: tieuDePc, noiDung: "Chưa mã nào cần giảm tỷ trọng hay thoát — tiếp tục giữ và theo dõi." });
  nx.sort((a, b) => a.muc - b.muc || a.uuTien - b.uuTien);
  return { pb, rr, suc, nhan, hangMa, dn, nhanXet: nx, tyLeThoat: tyLeTheoNhan("thoat"), tyLeGiam: tyLeTheoNhan("giam"), phongCach: pc };
}
