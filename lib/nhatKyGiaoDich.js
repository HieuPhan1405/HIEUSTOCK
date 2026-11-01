// NHAT KY GIAO DICH cua danh muc tu dien - ham THUAN (test tay: engine/test/xuLyDanhMuc.test.mjs).
// Moi lenh { id, ngay "YYYY-MM-DD", ma, loai "mua" | "ban", kl, gia (nghin dong), ghiChu } duoc AP vao vi the: mua -> cong so luong, gia von binh quan (gom phi mua);
// ban -> tru so luong, ghi lai LAI DA CHOT = tien ve (da tru phi + thue ban) - gia von * kl. Gia von KHONG doi khi ban (cach tinh binh quan cua CTCK Viet Nam).
// Thue ban chung khoan 0,1% gia tri ban (thue TNCN); phi giao dich do nguoi dung nhap (moi CTCK mot muc).
export const THUE_BAN_PCT = 0.1;

const so = (v) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

// ds = [{ ma, kl, giaVon }] (vi the hien tai), gd = lenh moi. Tra { ds, ghi } hoac { loi }.
export function apDungGiaoDich(ds = [], gd = {}, { phiPct = 0 } = {}) {
  const ma = String(gd.ma || "").toUpperCase();
  const kl = Math.round(so(gd.kl) ?? 0);
  const gia = so(gd.gia);
  if (!/^[A-Z0-9]{2,12}$/.test(ma)) return { loi: "Mã không hợp lệ." };
  if (!(kl > 0)) return { loi: "Số lượng phải lớn hơn 0." };
  if (!(gia > 0)) return { loi: "Giá phải lớn hơn 0." };
  if (gd.loai !== "mua" && gd.loai !== "ban") return { loi: "Loại lệnh không hợp lệ." };
  const phi = (so(phiPct) ?? 0) / 100;
  const cu = ds.filter((x) => x.ma === ma);
  const klCu = cu.reduce((s, x) => s + (so(x.kl) ?? 0), 0);
  const coVon = cu.filter((x) => so(x.giaVon) > 0);
  const gvCu = coVon.length ? coVon.reduce((s, x) => s + so(x.kl) * so(x.giaVon), 0) / coVon.reduce((s, x) => s + so(x.kl), 0) : null;
  const khac = ds.filter((x) => x.ma !== ma);
  const ghi = { id: gd.id ?? `g${Date.now()}`, ngay: gd.ngay, ma, loai: gd.loai, kl, gia, ghiChu: gd.ghiChu ? String(gd.ghiChu).slice(0, 120) : undefined, giaVonTruoc: gvCu };
  if (gd.loai === "mua") {
    const giaCoPhi = gia * (1 + phi);
    const gvMoi = gvCu != null ? (klCu * gvCu + kl * giaCoPhi) / (klCu + kl) : klCu > 0 ? null : giaCoPhi;
    return { ds: [...khac, { ma, kl: klCu + kl, giaVon: gvMoi }], ghi };
  }
  if (kl > klCu) return { loi: `Đang giữ ${klCu.toLocaleString("vi-VN")} cp ${ma}, không bán được ${kl.toLocaleString("vi-VN")} cp.` };
  const tienVe = kl * gia * 1000 * (1 - phi - THUE_BAN_PCT / 100);
  ghi.laiChot = gvCu != null ? tienVe - kl * gvCu * 1000 : null;
  ghi.laiChotPct = gvCu != null ? (ghi.laiChot / (kl * gvCu * 1000)) * 100 : null;
  const con = klCu - kl;
  return { ds: con > 0 ? [...khac, { ma, kl: con, giaVon: gvCu }] : khac, ghi };
}

// Thong ke cac lenh BAN da ghi (co gia von): lai da chot, ty le thang, lai TB lenh thang / lo TB lenh thua, lo lon nhat, so lenh lo qua muc cat lo.
export function thongKeNhatKy(nk = [], { catLo = null } = {}) {
  const ban = nk.filter((g) => g.loai === "ban" && g.laiChot != null);
  const thang = ban.filter((g) => g.laiChot > 0);
  const thua = ban.filter((g) => g.laiChot <= 0);
  const tb = (a, k) => (a.length ? a.reduce((s, g) => s + g[k], 0) / a.length : null);
  const theoMa = new Map();
  for (const g of ban) theoMa.set(g.ma, (theoMa.get(g.ma) ?? 0) + g.laiChot);
  return {
    soLenh: nk.length,
    soLenhBan: ban.length,
    laiDaChot: ban.reduce((s, g) => s + g.laiChot, 0),
    soThang: thang.length,
    soThua: thua.length,
    tyLeThang: ban.length ? thang.length / ban.length : null,
    laiTBThangPct: tb(thang, "laiChotPct"),
    loTBThuaPct: tb(thua, "laiChotPct"),
    loLonNhat: thua.length ? thua.reduce((m, g) => (g.laiChotPct < m.laiChotPct ? g : m)) : null,
    viPhamCatLo: catLo != null ? ban.filter((g) => g.laiChotPct < catLo).length : null,
    theoMa: [...theoMa.entries()].map(([ma, lai]) => ({ ma, lai })).sort((a, b) => b.lai - a.lai),
  };
}
