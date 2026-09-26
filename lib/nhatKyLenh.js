// NHAT KY GIAO DICH THEO TUNG LENH (ham THUAN, khong dung DB/React - import tuong doi de test tay bang node: engine/test/nhatKyLenh.test.mjs).
//
// Moi LENH (= ngay mua + loai: lenh dau / mua moi) co dong thoi gian RIENG: Mua -> (cham TP) -> cac lan chot tung phan / dong -> "Dang giu" neu con phan chua dong. Nguon:
//  - lichSuDaDong: cac dong bang lenh_da_dong cua ma (moi dong = 1 lan chot / dong 1 PHAN cua 1 lenh, cung cach gom voi lib/thongKeLenh.js);
//  - cacLenhMo: cac lenh DANG MO cua ma (lenhDangMo trong lib/muaThemTinhToan.js) - lenh dang giu co the co ca dong TP1/TP2 da chot (van con phan giu den tin hieu BAN);
//  - nen: nen ngay [{ t: "yyyy-mm-dd", h }] (neu da tai) de tim NGAY CHAM cac moc TP chua ghi thanh dong rieng.
// Moi lenh gia dinh 100 don vi von: moi dong chot ghi "phan von -> gia tri phan do" (vd 30 -> 32.4), cong lai ra ket qua ca lenh.
import { ngayChuoi } from "./muaThemTinhToan.js";
import { ngayChamTP } from "./ngayChamMoc.js";
import { loaiLenh, trongSo, dongGop } from "./thongKeLenh.js";
import { TY_LE_CHOT_KET_THUC } from "./tyLeChot.js";

const THU_TU_TP = { TP1: 1, TP2: 2, TP3: 3 };

// Muc TP cao nhat da cham cua 1 lenh dang mo - giong chamTPCaoNhat trong components/dungChung.js (co bao AFL, khong co thi so gia hien tai voi moc).
function mucDaCham(l) {
  if (l.tp_da_cham) return l.tp_da_cham;
  if (l.gia == null) return null;
  if (l.tp3 != null && l.gia >= l.tp3) return "TP3";
  if (l.tp2 != null && l.gia >= l.tp2) return "TP2";
  if (l.tp1 != null && l.gia >= l.tp1) return "TP1";
  return null;
}

// Tieu de 1 dong chot / dong (ly_do trong bang lenh_da_dong). Lenh MUA MOI khong co TP rieng: dong theo Stop-loss RIENG hoac dong CUNG lenh dau.
function nhanChot(d, laMuaMoi) {
  if (laMuaMoi) return d.ly_do === "CAT_LO" ? "Cắt lỗ (chạm Stop-loss của lệnh này)" : "Đóng cùng lệnh đầu";
  const pc = Number(d.phan_chot_pct);
  const goc = {
    TP1: () => `Chốt lời TP1 (${d.phan_chot_pct ?? 30}% vị thế)`,
    TP2: () => `Chốt lời TP2 (${d.phan_chot_pct ?? 30}% vị thế)`,
    // Cach "ket thuc o TP3" (40% cuoi / gop 100%) ket thuc lenh; lenh cu (30/30/25/15): dong 25% (tung phan) hoac 1 dong gop 85%, con 15% giu chay.
    TP3: () => {
      if (pc === TY_LE_CHOT_KET_THUC.tp3 || pc >= 100) return `Chốt TP3 (${pc}% vị thế) · kết thúc lệnh`;
      return d.phan_chot_pct != null && pc < 50 ? `Chốt lời TP3 (${d.phan_chot_pct}% vị thế)` : `Chốt đủ TP3 (${d.phan_chot_pct ?? 85}% vị thế)`;
    },
    CHOT_TP3: () => "Chốt đủ TP3 (kết thúc lệnh)",
    THOAT_KIJUN: () => "Thoát theo Kijun (đóng cửa dưới Kijun sau TP2)",
    CAT_LO: () => "Cắt lỗ (chạm Stop-loss)",
    BAO_VE_LAI: () => "Bảo vệ lãi (SL đã dời lên cao hơn)",
    BAN: () => "Bán theo tín hiệu",
    THOAT: () => "Thoát vị thế",
  };
  const tieuDe = (goc[d.ly_do] ?? (() => "Đóng vị thế"))();
  if (d.vong === 3) return `${tieuDe} · phần còn lại sau TP3 (lệnh cũ)`;
  if (d.vong === 1 && !/^(CHOT_)?TP[123]$/.test(d.ly_do ?? "") && d.phan_chot_pct != null && pc < 100) return `${tieuDe} · phần còn lại ${d.phan_chot_pct}%`;
  return tieuDe;
}

const kieuChot = (ly) => (THU_TU_TP[ly] ? "chot_tp" : ly === "CAT_LO" ? "cat_lo" : ly === "BAO_VE_LAI" ? "bao_ve" : "dong");

const soSanhSuKien = (a, b) => {
  if (a.ngay == null && b.ngay == null) return a.uuTien - b.uuTien;
  if (a.ngay == null) return 1;
  if (b.ngay == null) return -1;
  if (a.ngay !== b.ngay) return a.ngay < b.ngay ? -1 : 1;
  return a.uuTien - b.uuTien; // cung ngay: Mua truoc, roi cham TP, roi chot / dong, roi dang giu
};

function taoLenh(o, nen) {
  const dong = [...o.dong].sort((a, b) => {
    const na = ngayChuoi(a.ngay_ban) ?? "";
    const nb = ngayChuoi(b.ngay_ban) ?? "";
    return na < nb ? -1 : na > nb ? 1 : Number(a.vong) - Number(b.vong);
  });
  const l = o.lenhMo;
  const suKien = [{ ngay: o.ngayMua, uuTien: 0, kieu: o.laMuaMoi ? "mua_moi" : "mua", chinh: o.laMuaMoi ? "Mua mới" : "Mua", gia: o.giaMua }];

  // Cac lan chot / dong DA GHI (lenh_da_dong).
  let daChotPct = 0;
  let tongGop = 0;
  let tongW = 0;
  let soPhien = null;
  for (const d of dong) {
    const w = trongSo(d);
    const gop = dongGop(d); // dong gop vao ket qua CA lenh (don vi % cua ca vi the)
    daChotPct += 100 * w;
    if (gop != null) {
      tongGop += gop;
      tongW += w;
    }
    if (d.so_phien != null && Number.isFinite(Number(d.so_phien))) soPhien = Math.max(soPhien ?? 0, Number(d.so_phien));
    suKien.push({
      ngay: ngayChuoi(d.ngay_ban),
      uuTien: 2,
      kieu: kieuChot(d.ly_do),
      chinh: nhanChot(d, o.laMuaMoi),
      gia: Number(d.gia_ban),
      soPhien: d.so_phien != null ? Number(d.so_phien) : null,
      laiLoPct: Number(d.lai_lo_pct),
      phanVon: 100 * w,
      giaTriPhan: gop != null ? 100 * w + gop : null,
    });
  }

  const conLai = Math.max(0, 100 - daChotPct); // % vi the CHUA dong (chi co y nghia khi lenh dang mo)
  const dangGiu = !!l && conLai > 0;
  // So phien giu: lenh dang mo = so phien tu ngay mua den nay (lenh dau: AFL xuat; lenh mua moi: dem tu lich phien - xem lib/soPhienGiu.js); lenh da dong = so phien lon nhat trong cac dong da ghi.
  const soPhienGiu = l && l.so_phien_giu != null && Number.isFinite(Number(l.so_phien_giu)) ? Number(l.so_phien_giu) : null;

  // Ngay CHAM cac moc TP tu nen gia (chi lenh dang mo, moc CHUA co dong chot rieng - dong da ghi da co ngay roi). Lenh dau: chi den muc AFL bao da cham; lenh mua moi khong co co bao
  // nen tinh tu nen gia theo TP rieng cua lenh do (chi de tham khao - lenh mua moi khong chot tung phan).
  if (l && Array.isArray(nen) && nen.length) {
    const gioiHan = o.laMuaMoi ? 3 : (THU_TU_TP[mucDaCham(l)] ?? 0);
    for (const ky of ["TP1", "TP2", "TP3"]) {
      const gia = Number(l[ky.toLowerCase()]);
      if (!(gia > 0) || THU_TU_TP[ky] > gioiHan || dong.some((d) => d.ly_do === ky)) continue;
      const cham = ngayChamTP(nen, o.ngayMua, gia);
      if (cham) suKien.push({ ngay: cham.ngay, uuTien: 1, kieu: "cham_tp", chinh: o.laMuaMoi ? `Giá chạm ${ky}` : `Chạm ${ky}`, moc: gia, soPhien: cham.soPhien });
    }
  }

  // Phan CON DANG GIU (tinh theo gia hien tai) + ket qua ca lenh: da dong -> tong dong gop / tong trong so (giong thongKeLenhDaDong); dang giu -> tam tinh = phan da chot + phan giu theo gia hien tai.
  const laiHienTai = l && Number.isFinite(Number(l.lai_lo_pct)) && l.lai_lo_pct !== null ? Number(l.lai_lo_pct) : null;
  let ketQuaPct = null;
  if (dangGiu) {
    if (laiHienTai != null) ketQuaPct = tongGop + (laiHienTai * conLai) / 100;
    suKien.push({
      ngay: null,
      uuTien: 3,
      kieu: "dang_giu",
      chinh: conLai < 100 ? `Đang giữ ${Math.round(conLai * 10) / 10}% vị thế` : "Đang giữ",
      soPhien: soPhienGiu,
      laiLoPct: laiHienTai,
      phanVon: conLai,
      giaTriPhan: laiHienTai != null ? conLai * (1 + laiHienTai / 100) : null,
    });
  } else if (tongW > 0) {
    ketQuaPct = tongGop / tongW;
  }

  suKien.sort(soSanhSuKien);
  return {
    khoa: o.khoa,
    loai: o.loai,
    laMuaMoi: o.laMuaMoi,
    ngayMua: o.ngayMua,
    giaMua: o.giaMua,
    tenLenh: l && l.tong_lenh > 1 ? l.ten_lenh : null,
    dangGiu,
    conLaiPct: dangGiu ? conLai : 0,
    daChotPct: Math.min(100, daChotPct),
    ketQuaPct,
    tamTinh: dangGiu,
    laiHienTai,
    soPhien: dangGiu ? soPhienGiu : soPhien,
    suKien,
  };
}

// Tra ve { lenh: [...cac lenh theo ngay mua tang dan, lenh dau truoc lenh mua moi cung ngay], tatCa: [...moi su kien cua moi lenh xep theo thoi gian, kem khoaLenh] }.
export function dungNhatKyLenh({ lichSuDaDong = [], cacLenhMo = [], nen = null } = {}) {
  const theoKhoa = new Map();
  const lay = (ngayMua, loai) => {
    const khoa = `${ngayMua}|${loai}`;
    if (!theoKhoa.has(khoa)) theoKhoa.set(khoa, { khoa, loai, laMuaMoi: loai !== "goc", ngayMua, giaMua: null, dong: [], lenhMo: null });
    return theoKhoa.get(khoa);
  };
  for (const d of lichSuDaDong) {
    const ngayMua = ngayChuoi(d.ngay_mua);
    if (!ngayMua) continue;
    const o = lay(ngayMua, loaiLenh(d));
    o.dong.push(d);
    if (!(o.giaMua > 0) && Number(d.gia_mua) > 0) o.giaMua = Number(d.gia_mua);
  }
  for (const l of cacLenhMo) {
    const ngayMua = ngayChuoi(l.ngay_mua);
    if (!ngayMua) continue;
    const o = lay(ngayMua, l.la_lenh_moi ? (l.loai_lenh_moi ?? "moi") : "goc");
    o.lenhMo = l;
    if (Number(l.gia_mua) > 0) o.giaMua = Number(l.gia_mua);
  }
  const lenh = [...theoKhoa.values()]
    .sort((a, b) => (a.ngayMua < b.ngayMua ? -1 : a.ngayMua > b.ngayMua ? 1 : Number(a.laMuaMoi) - Number(b.laMuaMoi)))
    .map((o) => taoLenh(o, nen));
  const tatCa = lenh.flatMap((l) => l.suKien.map((s) => ({ ...s, khoaLenh: l.khoa }))).sort(soSanhSuKien);
  return { lenh, tatCa };
}
