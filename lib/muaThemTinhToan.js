// TINH TOAN THUAN (khong dung DB/React) cho DANH SACH LENH DANG MO: moi lenh la 1 dong RIENG (gia mua, Stop-loss, TP, lai/lo tinh rieng). Lenh dau cua ma + cac lenh "MUA MOI" ve sau
// (khi bo qua dot dau co the doi dot sau: gia hoi ve ho tro..., hoac lenh moi sau TP3) deu la lenh doc lap - KHONG co "mua them" / gia von trung binh. Ma co nhieu lenh mo thi danh so
// theo ngay mua: "VPB (1)", "VPB (2)"... Dung o component client va test tay (engine/test/muaThemTinhToan.test.mjs). Import tuong doi (khong dung alias "@/") de node chay test truc tiep duoc.

// ngay (Date tu Postgres DATE hoac chuoi) -> "yyyy-mm-dd". Cong 12 gio truoc khi cat chuoi de dung ngay o moi mui gio may chu.
export function ngayChuoi(v) {
  if (!v) return null;
  if (typeof v === "string") return v.slice(0, 10);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getTime() + 12 * 3600e3).toISOString().slice(0, 10);
}

import { demSoPhien } from "./soPhienGiu.js";

// vong "moi" = mua moi sau khi lenh goc cham TP3 (cach cu, mac dinh tat); vong "giua" = mua moi dot sau trong luc lenh goc con giu (gia hoi ve ho tro Kijun roi bat len).
export const LOAI_DIEM_MUA = {
  moi: { nhan: "Mua mới sau khi lệnh đầu chạm TP3", ngan: "Mua mới" },
  giua: { nhan: "Mua mới đợt sau (giá hồi về hỗ trợ rồi bật lên)", ngan: "Mua mới" },
};

// Cac DIEM MUA MOI cua 1 dong tin hieu (toi da 2: sau TP3 + dot sau) - chi khi AFL/engine thuc su bao co (dang giu hoac vua kich hoat) va co gia mua rieng.
// Moi diem: { khoa, ma, vong, ngay, homNay, giaMua, stop, tp1, tp2, tp3, gia, giaMuaGoc, mucTPGoc }.
export function cacDiemMuaMoi(row) {
  const ra = [];
  for (const vong of ["moi", "giua"]) {
    const homNay = row[`mua_${vong}`] === true;
    const dangGiu = row[`dang_giu_${vong}`] === true;
    const giaMua = Number(row[`gia_mua_${vong}`]);
    const ngay = ngayChuoi(row[`ngay_mua_${vong}`]);
    if (!(homNay || dangGiu) || !(giaMua > 0) || !ngay) continue;
    const duong = (v) => (Number(v) > 0 ? Number(v) : null);
    ra.push({
      khoa: `${row.ma}|${vong}|${ngay}`,
      ma: row.ma,
      vong,
      ngay,
      homNay,
      giaMua,
      stop: duong(row[`stop_${vong}`]),
      tp1: duong(row[`tp1_${vong}`]),
      tp2: duong(row[`tp2_${vong}`]),
      tp3: duong(row[`tp3_${vong}`]),
      gia: duong(row.gia),
      giaMuaGoc: duong(row.gia_mua),
      mucTPGoc: row.tp_da_cham || null,
    });
  }
  return ra;
}

// 1 DIEM MUA MOI thanh 1 "dong lenh": dung lai dung cac cot cua bang (gia mua, vung mua/cat lo/chot loi, lai/lo...) nen dong nay la ban sao cua dong tin hieu cua ma, thay cac truong
// vi the bang so cua RIENG lenh do (gia mua / Stop-loss / TP / ngay mua rieng, lai/lo theo gia mua rieng). Cac co bao vi the cua lenh dau (mua them, bao ve lai, ban bot...) bo di
// de khong nhan doi.
// lich (tuy chon): lich phien giao dich de dem so phien giu cua lenh nay (xem lib/soPhienGiu.js) - khong co lich thi so_phien_giu = null.
export function dongTuDiemMua(row, d, lich = null) {
  return {
    ...row,
    khoa_lenh: d.khoa,
    la_lenh_moi: true,
    loai_lenh_moi: d.vong,
    mua_moi_hom_nay: d.homNay,
    gia_mua_goc: d.giaMuaGoc,
    ngay_mua_goc: ngayChuoi(row.ngay_mua),
    tin: d.homNay ? "MUA" : "NAM GIU",
    ngay_mua: d.ngay,
    gia_mua: d.giaMua,
    gia_mua_ghi_nhan: false,
    lai_lo_pct: d.gia > 0 ? (d.gia / d.giaMua - 1) * 100 : null,
    stop_loss: d.stop,
    tp1: d.tp1,
    tp2: d.tp2,
    tp3: d.tp3,
    tp_da_cham: null,
    gia_kich_hoat: null,
    moc_kich_hoat: null,
    moc_gia: null,
    moc_loai: null,
    moc_cach_pct: null,
    so_phien_giu: demSoPhien(lich, d.ngay),
    ban_bot: false,
    dang_bao_ve_lai: false,
    bao_ve_lai_kich_hoat: false,
    giai_ngan: null,
    loai_vao: null,
    che_do_vao: null,
    ket_thuc_tp3: false,
    ket_thuc_tp3_moi: false,
    mua_moi: null,
    dang_giu_moi: null,
    mua_giua: null,
    dang_giu_giua: null,
  };
}

// DANH SACH LENH DANG MO (So lenh dang mo / Danh muc theo doi / trang tung ma) tu cac dong tin hieu da chuan hoa: lenh dau cua ma dang MUA/NAM GIU + cac lenh mua moi dang giu. Ma da ve
// TRUNG LAP khong con lenh dau nhung van giu lai lenh mua moi cua no neu con dang giu. Moi lenh 1 dong: { ...row, khoa_lenh, la_lenh_moi, so_lenh, tong_lenh, ten_lenh }; ma co tu 2 lenh
// tro len thi danh so theo ngay mua tang dan (lenh dau truoc): ten_lenh = "VPB (1)", "VPB (2)". Thu tu tra ve: nhom theo ma (giu thu tu cua ds), trong ma theo so lenh.
export function lenhDangMo(ds, lich = null) {
  const giu = (r) => r.tin === "MUA" || r.tin === "NAM GIU";
  const theoMa = new Map();
  for (const r of ds) {
    const diem = cacDiemMuaMoi(r);
    const cacLenh = [];
    if (giu(r)) cacLenh.push({ ...r, khoa_lenh: r.ma, la_lenh_moi: false });
    for (const d of diem) cacLenh.push(dongTuDiemMua(r, d, lich));
    if (!cacLenh.length) continue;
    if (!theoMa.has(r.ma)) theoMa.set(r.ma, []);
    theoMa.get(r.ma).push(...cacLenh);
  }
  const ra = [];
  for (const [ma, ls] of theoMa) {
    ls.sort((a, b) => {
      const na = ngayChuoi(a.ngay_mua) ?? "";
      const nb = ngayChuoi(b.ngay_mua) ?? "";
      return na < nb ? -1 : na > nb ? 1 : Number(a.la_lenh_moi) - Number(b.la_lenh_moi);
    });
    ls.forEach((l, i) => {
      l.so_lenh = i + 1;
      l.tong_lenh = ls.length;
      l.ten_lenh = ls.length > 1 ? `${ma} (${i + 1})` : ma;
      ra.push(l);
    });
  }
  return ra;
}

// BO LOC VI THE cua 1 ma (Danh muc theo doi): tu cac lenh dang mo cua ma (lenhDangMo) chon cac vi the can hien. loai: "tatca" (het) | "tot" (VI THE TOT NHAT = lai/lo cao nhat, bang nhau lay lenh mo sau)
// | "sau" (VI THE SAU = lenh mo gan nhat, ngay mua muon nhat, cung ngay lay lenh xep sau). Ma chi co 1 vi the thi loai nao cung ra vi the do. Tra ve mang (rong neu ma khong co vi the).
export function chonViThe(cacLenh, loai) {
  if (!cacLenh?.length || !loai || loai === "tatca") return cacLenh ?? [];
  const diem =
    loai === "tot"
      ? (l) => (Number.isFinite(Number(l.lai_lo_pct)) && l.lai_lo_pct !== null ? Number(l.lai_lo_pct) : -Infinity)
      : (l) => new Date(`${ngayChuoi(l.ngay_mua) ?? "1970-01-01"}T00:00:00Z`).getTime();
  let tot = cacLenh[0];
  for (const l of cacLenh) if (diem(l) >= diem(tot)) tot = l;
  return [tot];
}
