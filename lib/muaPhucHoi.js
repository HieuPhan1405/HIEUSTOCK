// O "MUA PHUC HOI (diem B)" o trang dau (Hieu 2026-10-21): ma vua co diem B trong vai phien gan nhat (engine/loi/diemMuaPhucHoi.js, cot pb_* cua bang chi_bao_ky_thuat),
// kem SL / TP "binh thuong" tinh san luc co diem B. Ham THUAN (khong import "@/") de test tay.
// Loai: ma he thong da bao MUA / dang giu (da nam o o Mua va Sổ lệnh đang mở), lenh da cat lo (pb_cat = 1 hoac gia hien tai <= cat lo), ma gia da chay qua xa diem B (khong duoi gia).
export const SO_PHIEN_HIEN_B = 3; // hien diem B xuat hien hom nay hoac trong 2 phien truoc
export const BIEN_DUOI_GIA_PCT = 5; // gia hien tai khong cao hon gia B qua 5%

const coSo = (v) => typeof v === "number" && Number.isFinite(v);

// NHAN "CO DIEM B TRUOC DO" cho ma dang o o Mua (Hieu 2026-10-22: danh dau diem MUA co so da co diem mua phuc hoi truoc do).
// diemB: dong diem_b_su_kien moi nhat cua ma ({ ngay 'YYYY-MM-DD', gia_b, gia_vao, giam, ngay_cat_lo }); ngayPhien 'YYYY-MM-DD'; gia = gia hien tai. Tra ve null neu diem B sau ngay phien.
export function nhanDiemBTruoc(diemB, ngayPhien, gia) {
  if (!diemB || !diemB.ngay || !ngayPhien || diemB.ngay > ngayPhien) return null;
  const soNgay = Math.round((Date.parse(ngayPhien) - Date.parse(diemB.ngay)) / 86400000);
  const giaVao = coSo(Number(diemB.gia_vao)) && Number(diemB.gia_vao) > 0 ? Number(diemB.gia_vao) : Number(diemB.gia_b);
  return {
    ngay: diemB.ngay,
    soNgay,
    giaB: Number(diemB.gia_b),
    giam: coSo(Number(diemB.giam)) ? Number(diemB.giam) : null,
    daCatLo: !!diemB.ngay_cat_lo,
    laiPct: coSo(gia) && coSo(giaVao) && giaVao > 0 ? (gia / giaVao - 1) * 100 : null,
  };
}

// hang: dong chi_bao_ky_thuat ({ ma, pb_cach, pb_gia, pb_day, pb_sl, pb_tp1, pb_tp2, pb_tp3 }); tatCa: dong tin_hieu ({ ma, tin, gia, doi }).
export function dungMuaPhucHoi({ hang = [], tatCa = [] }) {
  const tin = new Map(tatCa.map((r) => [r.ma, r]));
  const ds = [];
  for (const h of hang) {
    if (!coSo(h.pb_cach) || h.pb_cach > SO_PHIEN_HIEN_B - 1 || !coSo(h.pb_gia) || !coSo(h.pb_sl)) continue;
    if (h.pb_cat === 1) continue; // lenh da cham cat lo ke tu khi vao: khong con "dang giu" (Hieu 2026-10-22)
    const t = tin.get(h.ma);
    if (!t) continue; // ma khong con trong danh sach theo doi
    if (t.tin === "MUA" || t.tin === "NAM GIU") continue;
    const gia = coSo(t.gia) ? t.gia : h.pb_gia;
    if (gia <= h.pb_sl) continue;
    const vsB = (gia / h.pb_gia - 1) * 100;
    if (vsB > BIEN_DUOI_GIA_PCT) continue;
    ds.push({
      ma: h.ma,
      cach: h.pb_cach,
      giaB: h.pb_gia,
      giam: coSo(h.pb_giam) ? h.pb_giam : null,
      klDay: coSo(h.pb_kl_day) ? h.pb_kl_day : null,
      day: h.pb_day,
      sl: h.pb_sl,
      tp1: h.pb_tp1,
      tp2: h.pb_tp2,
      tp3: h.pb_tp3,
      gia,
      giaVao: coSo(h.pb_vao) ? h.pb_vao : h.pb_gia,
      // lai / lo HIEN TAI cua lenh dang giu: gia hien tai so voi gia vao (mo cua phien ke tiep; chua co thi lay gia B)
      laiPct: (gia / (coSo(h.pb_vao) ? h.pb_vao : h.pb_gia) - 1) * 100,
      doi: coSo(t.doi) ? t.doi : null,
      vsBPct: vsB,
      bDayPct: coSo(h.pb_day) && h.pb_day > 0 ? (h.pb_gia / h.pb_day - 1) * 100 : null,
    });
  }
  // ma ban thao co KL (KL quanh day >= 2x) len truoc - yeu to kiem chung tot nhat; sau do diem B moi nhat
  const coKL = (x) => (x.klDay != null && x.klDay >= 2 ? 1 : 0);
  return ds.sort((a, b) => coKL(b) - coKL(a) || a.cach - b.cach || (a.bDayPct ?? 99) - (b.bDayPct ?? 99));
}
