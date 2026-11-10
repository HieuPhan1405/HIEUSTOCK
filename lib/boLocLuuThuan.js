// BO LOC CA NHAN (luu bo loc, nhan thong bao ve may khi co ma moi khop) - phan THUAN dung chung cho trinh duyet (components/BangBoLoc.js) va may chu (lib/boLocLuuDb.js).
// 1 bo loc luu = { loc, locChiBao, sapXep }: loc = cac o loc nhanh / tim ma / san / nganh / von hoa..., locChiBao = cac bo loc chi bao ky thuat (lib/boLocChiBao.js).
import { phanLoaiXuHuong, chamTPCaoNhat, laDangGiu, datChuanUuTien, lyDoChuaCoDiemMua, sapChamMoc, laChoPhienSau, NGUONG_DIEM_MUA } from "@/components/dungChung";
import { coCanhBaoBanBot } from "@/lib/ghiChuTuDong";
import { locTheoChiBao, CHI_BAO_LOC, KHOANG } from "@/lib/boLocChiBao";

export const GIOI_HAN_BO_LOC = { soBoLoc: 10, doDaiTen: 40, soChiBao: 12 };

// ---- cac ham loc (chuyen tu components/boLocChung.js + BangBoLoc.js de may chu dung duoc) ----
export function locChung(ds, loc) {
  const tuKhoa = (loc.timKiem || "").trim().toUpperCase();
  return ds.filter(
    (r) =>
      (!tuKhoa || r.ma.includes(tuKhoa)) &&
      (!loc.vonHoa || r.von_hoa === loc.vonHoa) &&
      (!loc.xuHuong || phanLoaiXuHuong(r) === loc.xuHuong) &&
      (!loc.san || (r.san || "HOSE") === loc.san) &&
      (!loc.nganh || (r.nganh || "Khac") === loc.nganh) &&
      (!loc.chiMatThan || r.mat_than) &&
      // tp_da_cham cua ma KHONG con giu chi la lich su lan mua gan nhat - chi tinh ma dang giu.
      (!loc.chiChotLoi || (laDangGiu(r) && chamTPCaoNhat(r))) &&
      (!loc.chiBanBot || coCanhBaoBanBot(r)) &&
      (!loc.chiUuTien || datChuanUuTien(r))
  );
}
export function coLocChung(loc) {
  return !!(loc.timKiem || loc.vonHoa || loc.xuHuong || loc.san || loc.nganh || loc.chiMatThan || loc.chiChotLoi || loc.chiBanBot || loc.chiUuTien);
}

// Bo loc "MA THEO DOI": da dat diem MUA nhung doi phien sau, hoac gia sat 1 moc (xem ghi chu o BangBoLoc).
export const BIEN_DO_GAN_MUA = 0.5;
export function laMaTheoDoi(r, coDuLieuMoc, bienMoc) {
  if (laChoPhienSau(r)) return true;
  if (coDuLieuMoc) return sapChamMoc(r, bienMoc);
  return r.tin === "TRUNG LAP" && r.diem >= NGUONG_DIEM_MUA - BIEN_DO_GAN_MUA && r.diem < NGUONG_DIEM_MUA;
}

export const LOC_MAC_DINH = { timKiem: "", vonHoa: "", xuHuong: "", san: "", nganh: "", chiMatThan: false, chiChotLoi: false, chiBanBot: false, chiUuTien: false, tin: "", chiGanDiemMua: false, chiDuDiemChuaMua: false, bienMoc: 3 };

// Loc `ds` (cac dong tin hieu da gop cot chi bao) theo 1 bo loc luu. coNguoiDung = false (khach): bo qua dieu kien tin hieu - giong bang tren web.
export function locTheoDinhNghia(ds, dn, { coNguoiDung = true } = {}) {
  const loc = { ...LOC_MAC_DINH, ...(dn?.loc ?? {}) };
  const coDuLieuMoc = ds.some((r) => r.moc_cach_pct != null);
  let kq = locChung(ds, loc);
  if (loc.tin && coNguoiDung) kq = kq.filter((r) => r.tin === loc.tin);
  if (loc.chiGanDiemMua) kq = kq.filter((r) => laMaTheoDoi(r, coDuLieuMoc, loc.bienMoc));
  if (loc.chiDuDiemChuaMua) kq = kq.filter((r) => lyDoChuaCoDiemMua(r));
  return locTheoChiBao(kq, dn?.locChiBao ?? []);
}

export function coDieuKienLoc(dn) {
  const l = dn?.loc ?? {};
  return !!(coLocChung(l) || l.tin || l.chiGanDiemMua || l.chiDuDiemChuaMua || (dn?.locChiBao?.length ?? 0) > 0);
}

// ---- chuan hoa du lieu tu client (may chu KHONG tin client): chi giu khoa hop le, kieu dung, do dai gioi han ----
const chuoi = (v, max = 40) => (typeof v === "string" ? v.slice(0, max) : "");
const co = (v) => v === true;
export function chuanHoaDinhNghia(raw) {
  const l = raw?.loc ?? {};
  const bienMoc = [1, 2, 3, 5].includes(Number(l.bienMoc)) ? Number(l.bienMoc) : 3;
  const loc = {
    timKiem: chuoi(l.timKiem, 20),
    vonHoa: chuoi(l.vonHoa),
    xuHuong: chuoi(l.xuHuong),
    san: chuoi(l.san),
    nganh: chuoi(l.nganh),
    chiMatThan: co(l.chiMatThan),
    chiChotLoi: co(l.chiChotLoi),
    chiBanBot: co(l.chiBanBot),
    chiUuTien: co(l.chiUuTien),
    tin: ["MUA", "NAM GIU", "BAN", "TRUNG LAP"].includes(l.tin) ? l.tin : "",
    chiGanDiemMua: co(l.chiGanDiemMua),
    chiDuDiemChuaMua: co(l.chiDuDiemChuaMua),
    bienMoc,
  };
  const locChiBao = (Array.isArray(raw?.locChiBao) ? raw.locChiBao : [])
    .filter((b) => b && CHI_BAO_LOC[b.chiBao])
    .slice(0, GIOI_HAN_BO_LOC.soChiBao)
    .map((b, i) => {
      const d = CHI_BAO_LOC[b.chiBao];
      const hopLe = b.dieuKien === KHOANG || d.dieuKien.some((c) => c.khoa === b.dieuKien);
      return { id: `cb${i + 1}`, chiBao: b.chiBao, dieuKien: hopLe ? b.dieuKien : (d.dieuKien[0]?.khoa ?? KHOANG), tu: chuoi(String(b.tu ?? ""), 12), den: chuoi(String(b.den ?? ""), 12) };
    });
  const sx = raw?.sapXep;
  const sapXep = sx && typeof sx.khoa === "string" && /^[a-z0-9_]{1,40}$/.test(sx.khoa) ? { khoa: sx.khoa, chieu: sx.chieu === "asc" ? "asc" : "desc" } : { khoa: "diem", chieu: "desc" };
  return { loc, locChiBao, sapXep };
}

export const chuanHoaTenBoLoc = (v) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, GIOI_HAN_BO_LOC.doDaiTen);

// 2 dinh nghia co giong nhau khong (de to sang bo loc dang ap dung) - bo qua sap xep.
export const cungDinhNghia = (a, b) => JSON.stringify([chuanHoaDinhNghia(a).loc, chuanHoaDinhNghia(a).locChiBao.map(({ id, ...x }) => x)]) === JSON.stringify([chuanHoaDinhNghia(b).loc, chuanHoaDinhNghia(b).locChiBao.map(({ id, ...x }) => x)]);
