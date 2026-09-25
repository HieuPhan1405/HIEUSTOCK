// TINH TOAN THUAN (khong dung DB/React) cho bang "Diem mua moi" o So lenh dang mo - dung o component client va test tay
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
