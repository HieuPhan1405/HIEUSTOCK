// GOP TOAN BO DANH GIA 1 DANH MUC (dung cho trang + "sau khi lam theo ke hoach" + bao cao) - ham THUAN.
// vitri = vitriTuNhap(...), theoMa = { MA: dong tin hieu rut gon (+ du lieu tinh tu nen cho ma ngoai danh sach) }, du = ket qua /api/lich-su-danh-muc (co the null khi chua tai).
import { danhGiaDanhMuc } from "./danhGiaDanhMuc.js";
import { phanTichRuiRo, chamDiemSucKhoe, nhanXetRuiRo, toiUuTyTrong, tinhRuiRoMo } from "./ruiRoDanhMuc.js";

const pct1 = (x) => x.toFixed(1).replace(".", ",");
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
  // ty trong toi uu theo rui ro tren cac ma CON GIU (bo ma bi nhan "Thoat"), tran = tran tung ma cua phong cach
  if (rr?.dsMa?.length) rr.toiUu = toiUuTyTrong(rr, { tran: pc.tyTrongToiDa, boQua: hangMa.filter((h) => nhan[h.ma]?.nhan === "thoat").map((h) => h.ma) });
  // rui ro mo: chi phong cach co cat lo theo gia (xu huong). Moc thoat = cat lo he thong (thanh vien, ma dang MUA / NAM GIU), duong can bang dai han, gia von x (1 + (catLo - 5)%) - cac muc gan nhan "Thoat"
  let ruiRoMo = null;
  if (pc.catLo != null) {
    const ds = hangMa.filter((h) => h.coDuLieu).map((h) => {
      const x = dauVaoNhan(h, { r: theoMa[h.ma], ls: du?.ma?.[h.ma], coTinHieu });
      return { ma: h.ma, gia: h.gia, giaTri: h.giaTri, moc: [x.stopLoss, x.ggBot, h.giaVon > 0 ? h.giaVon * (1 + (pc.catLo - 5) / 100) : null] };
    });
    ruiRoMo = tinhRuiRoMo(ds, pb.taiSan.nav);
  }
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
  if (ruiRoMo?.navPct != null && ruiRoMo.ds.some((x) => x.trangThai === "mo")) {
    const lon = ruiRoMo.ds.filter((x) => x.trangThai === "mo").slice(0, 2);
    nx.push({
      muc: ruiRoMo.navPct > 15 ? 0 : ruiRoMo.navPct > 10 ? 1 : 2,
      uuTien: 2.2,
      tieuDe: "Rủi ro mở nếu chạm mốc thoát",
      noiDung: `Nếu các mã giảm về mốc thoát gần nhất (cắt lỗ, đường cân bằng dài hạn hoặc lỗ ${Math.abs(pc.catLo - 5)}% so với giá vốn) rồi bán, tài sản ròng mất khoảng ${pct1(ruiRoMo.navPct)}% — lớn nhất ở ${lon.map((x) => `${x.ma} ${pct1(x.navPct)}%`).join(", ")}. Nhiều nhà giao dịch chuyên nghiệp tự giới hạn tổng mức này khoảng 6–10% tài sản; đây là quy tắc phổ biến, không phải kết quả kiểm chứng của web.${ruiRoMo.daCham.length ? ` ${ruiRoMo.daCham.join(", ")} đã ở dưới mốc thoát.` : ""}`,
    });
  }
  nx.sort((a, b) => a.muc - b.muc || a.uuTien - b.uuTien);
  return { pb, rr, suc, nhan, hangMa, dn, nhanXet: nx, tyLeThoat: tyLeTheoNhan("thoat"), tyLeGiam: tyLeTheoNhan("giam"), phongCach: pc, ruiRoMo };
}
