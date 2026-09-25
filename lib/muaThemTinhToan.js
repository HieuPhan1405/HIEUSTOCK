// TINH TOAN THUAN (khong dung DB/React) cho cac diem MUA THEM / MUA MOI: gop vao danh sach So lenh dang mo (gopLenhMo) va the "Gia von cua ban" trong trang tung ma - dung o component client va test tay
// (engine/test/muaThemTinhToan.test.mjs). Import tuong doi (khong dung alias "@/") de node chay test truc tiep duoc.
import { TY_LE_CHOT, TY_LE_CHOT_CU } from "./tyLeChot.js";

// % vi the cua LENH GOC con nam giu tuy theo muc TP cao nhat da cham (theo ty le chot 30/30/25/15).
export function phanConLaiLenhGoc(tpDaCham) {
  // Cach moi: cham TP3 la DONG lenh nen khong con "mua them" tren lenh goc da qua TP3; van tra 15% (cach cu) de doc dung cac lo mua them cu con dang giu.
  if (tpDaCham === "TP3") return TY_LE_CHOT_CU.giu;
  if (tpDaCham === "TP2") return 100 - TY_LE_CHOT.tp1 - TY_LE_CHOT.tp2;
  if (tpDaCham === "TP1") return 100 - TY_LE_CHOT.tp1;
  return 100;
}

// Gia von trung binh gia quyen khi MUA THEM: phan lenh goc con lai (conLaiPct, gia goc) + khoi luong mua them
// (khoiLuongMoiPct, mac dinh = bang 1 lenh goc day du = 100). Tra null neu thieu so lieu hop le.
export function giaVonTrungBinh({ conLaiPct, giaMuaGoc, giaMuaMoi, khoiLuongMoiPct = 100 }) {
  const a = Number(conLaiPct);
  const b = Number(khoiLuongMoiPct);
  const g0 = Number(giaMuaGoc);
  const g1 = Number(giaMuaMoi);
  if (!(a > 0) || !(b > 0) || !(g0 > 0) || !(g1 > 0)) return null;
  return (a * g0 + b * g1) / (a + b);
}

// ngay (Date tu Postgres DATE hoac chuoi) -> "yyyy-mm-dd". Cong 12 gio truoc khi cat chuoi de dung ngay o moi mui gio may chu.
export function ngayChuoi(v) {
  if (!v) return null;
  if (typeof v === "string") return v.slice(0, 10);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getTime() + 12 * 3600e3).toISOString().slice(0, 10);
}

export const LOAI_DIEM_MUA = {
  moi: { nhan: "Sau khi chốt đủ TP3 (lệnh cũ giữ phần chạy)", ngan: "Mua thêm sau TP3" },
  giua: { nhan: "Giữa chừng (trước TP3)", ngan: "Mua thêm giữa chừng" },
};

// Nhan ngan hien tren dong mua them trong bang lenh: "Mua thêm giữa chừng" / "Mua thêm sau TP3".
export const nhanDongMuaThem = (row) => (row?.la_mua_them ? LOAI_DIEM_MUA[row.loai_mua_them]?.ngan ?? "Mua thêm" : null);

// Cac DIEM MUA MOI cua 1 dong tin hieu (toi da 2: sau TP3 + giua chung) - chi khi AFL/engine thuc su bao co (dang giu hoac vua kich hoat)
// va co gia mua rieng. Moi diem: { khoa, ma, vong, ngay, homNay, giaMua, stop, tp1, tp2, tp3, gia, conLaiGocPct, giaMuaGoc }.
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
      conLaiGocPct: phanConLaiLenhGoc(row.tp_da_cham),
      giaMuaGoc: duong(row.gia_mua),
      mucTPGoc: row.tp_da_cham || null,
    });
  }
  return ra;
}

// 1 DIEM MUA THEM thanh 1 "dong lenh" cua So lenh dang mo: dung lai dung cac cot cua bang (gia mua, vung mua/cat lo/chot loi, lai/lo...) nen dong nay la ban sao
// cua dong tin hieu cua ma, thay cac truong vi the bang so cua RIENG diem mua them (gia mua/Stop-loss/TP/ngay mua rieng, lai/lo theo gia mua them - GIA VON
// TRUNG BINH khong tinh o day ma tinh trong trang tung ma). Cac co bao vi the khac (mua them sau TP3, giua chung, bao ve lai, ban bot...) bo di de khong nhan doi.
export function dongTuDiemMua(row, d) {
  return {
    ...row,
    khoa_lenh: d.khoa,
    la_mua_them: true,
    loai_mua_them: d.vong,
    mua_them_hom_nay: d.homNay,
    gia_mua_goc: d.giaMuaGoc,
    ngay_mua_goc: ngayChuoi(row.ngay_mua),
    co_mua_them: 0,
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
    so_phien_giu: null,
    ban_bot: false,
    dang_bao_ve_lai: false,
    bao_ve_lai_kich_hoat: false,
    giai_ngan: null,
    loai_vao: null,
    che_do_vao: null,
    mua_moi: null,
    dang_giu_moi: null,
    mua_giua: null,
    dang_giu_giua: null,
  };
}

// GOP lenh goc + cac diem mua them thanh 1 DANH SACH duy nhat cho So lenh dang mo / Danh muc theo doi: 1 ma co the co 2 dong (lenh goc + lenh mua them, hoac ca 3),
// cac dong mua them dung ngay sau lenh goc cua ma do. dangMo: cac dong tin hieu dang MUA/NAM GIU.
export function gopLenhMo(dangMo) {
  return dangMo.flatMap((r) => {
    const diem = cacDiemMuaMoi(r);
    return [{ ...r, khoa_lenh: r.ma, la_mua_them: false, co_mua_them: diem.length }, ...diem.map((d) => dongTuDiemMua(r, d))];
  });
}

// Ket qua theo lua chon cua nguoi dung: daMuaDotDau=true -> "MUA THEM" (gia von trung binh voi phan lenh goc con lai);
// false/chua chon -> "MUA MOI" (gia von = gia mua moi, SL/TP nhu thuong).
export function ketQuaDiemMua(diem, daMuaDotDau) {
  const muaThem = daMuaDotDau === true;
  const giaVon = muaThem ? giaVonTrungBinh({ conLaiPct: diem.conLaiGocPct, giaMuaGoc: diem.giaMuaGoc, giaMuaMoi: diem.giaMua }) : diem.giaMua;
  const giaVonDung = giaVon ?? diem.giaMua; // thieu gia mua goc -> khong tinh duoc trung binh, lui ve gia mua moi
  return {
    muaThem,
    giaVon: giaVonDung,
    tinhDuocTrungBinh: !muaThem || giaVon != null,
    laiLoPct: diem.gia > 0 ? (diem.gia / giaVonDung - 1) * 100 : null,
  };
}
