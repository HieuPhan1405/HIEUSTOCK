// RADAR TIN HIEU o trang chu (ham THUAN, import tuong doi de test tay: engine/test/radarSuKien.test.mjs).
// Gom cac "su kien dang chu y" cua PHIEN NAY tu du lieu ma web da co: moi su kien = (ma, loai). Moi ma co the co nhieu su kien; o sang mac dinh dung su kien QUAN TRONG NHAT cua ma, moi loai toi da
// MOI_LOAI_TOI_DA ma noi bat (co `top`), tong toi da SO_NOI_BAT_TOI_DA. Chon 1 loai (chip) thi hien TAT CA ma cua loai do. `dem` = so ma that cua tung loai.
// Lenh (mua / mua moi / chot TP / ban / giam bot) lay tu `coHoi` = dungCoHoiHomNay (lib/coHoiHomNay.js) nen chi gom viec XAY RA TRONG PHIEN, khong phai trang thai cu (vd ma da cham TP3 tu lau).
// Khach chua dang nhap chi thay loai "thi truong" (gia, dinh / day 52 tuan, khoi ngoai, dong tien: du lieu cong khai); tin hieu he thong (mua / ban / diem B / bat day / Mat Than...) chi cho thanh vien
// da duyet (lib/khoaTrangChu.js). Chu mo ta TRUNG TINH: diem B / bat day chi "co dau hieu", khong phai diem mua chinh.
import { soVN } from "./soVN.js";

export const SO_NOI_BAT_TOI_DA = 30;
export const MOI_LOAI_TOI_DA = 6;
export const SO_SU_KIEN_TOI_DA = 400;
const NGUONG_GIA_PCT = 2; // gia doi it nhat 2% moi tinh la bat thuong
const NGUONG_GIA_GAP = 2; // va gap it nhat 2 lan bien do thuong ngay (ATR%) cua chinh ma
const NGUONG_GIA_TUYET_DOI = 4; // ma thieu ATR: chi can doi >= 4%
const GTGD_TOI_THIEU_TY = 3; // loai ma qua it thanh khoan khoi cac tin hieu dong tien / khoi ngoai (so lieu nhieu)
const NGOAI_TOI_THIEU_TY = 10; // khoi ngoai: rong it nhat 10 ty...
const NGOAI_TY_LE_GTGD = 0.1; // ...va bang it nhat 10% GTGD TB20 cua chinh ma
const KL_GAP = 2; // khoi luong >= 2 lan TB20 = dong tien dot bien
const KL_GIA_DOI_PCT = 1; // kem gia doi it nhat 1% de co chieu (vao / ra)
const SAT_DAY_PCT = 0.5; // gia dong cua cach day 52 tuan <= 0,5%

// thuTu: so nho = quan trong hon (quyet dinh su kien noi bat cua ma + thu tu danh sach). thanhVien: chi hien cho tai khoan da duyet.
export const LOAI_RADAR = {
  mua: { nhan: "Tín hiệu mua", mau: "var(--tim-nhat)", thuTu: 1, thanhVien: true },
  mua_moi: { nhan: "Mua mới", mau: "color-mix(in srgb, var(--cyan) 50%, var(--tim-nhat))", thuTu: 2, thanhVien: true },
  diem_b: { nhan: "Hồi phục", mau: "var(--diem-b)", thuTu: 3, thanhVien: true },
  bat_day: { nhan: "Tạo đáy", mau: "var(--diem-day)", thuTu: 4, thanhVien: true },
  chot_loi: { nhan: "Chốt lời", mau: "var(--vang-2)", thuTu: 5, thanhVien: true },
  ban: { nhan: "Bán", mau: "var(--do-nhat)", thuTu: 6, thanhVien: true },
  ban_bot: { nhan: "Giảm bớt", mau: "var(--cam)", thuTu: 7, thanhVien: true },
  mat_than: { nhan: "Mắt Thần", mau: "color-mix(in srgb, var(--do) 55%, var(--vang))", thuTu: 8, thanhVien: true },
  ngoai_mua: { nhan: "Ngoại mua", mau: "var(--xanh-nhat)", thuTu: 9, thanhVien: false },
  ngoai_ban: { nhan: "Ngoại bán", mau: "color-mix(in srgb, var(--do) 55%, var(--tim-nhat))", thuTu: 10, thanhVien: false },
  tien_vao: { nhan: "Tiền vào", mau: "var(--cyan)", thuTu: 11, thanhVien: false },
  tien_ra: { nhan: "Tiền ra", mau: "color-mix(in srgb, var(--cam) 60%, var(--do))", thuTu: 12, thanhVien: false },
  dinh: { nhan: "Vượt đỉnh", mau: "var(--chanh)", thuTu: 13, thanhVien: false },
  day: { nhan: "Phá đáy", mau: "var(--bd-2)", thuTu: 14, thanhVien: false },
  tang_manh: { nhan: "Tăng mạnh", mau: "var(--xanh)", thuTu: 15, thanhVien: false },
  giam_manh: { nhan: "Giảm mạnh", mau: "var(--do)", thuTu: 16, thanhVien: false },
};

const co = (v) => typeof v === "number" && Number.isFinite(v);
const gap = (x) => soVN(x, 1, true);

// Moi ung vien: { ma, loai, moTa, diemXep } - diemXep lon hon = noi bat hon trong cung loai.
function ungVien({ tatCa, coHoi, muaPhucHoi, batDay, chiBao, khoiNgoai, xemTinHieu }) {
  const ds = [];
  const bao = new Map((chiBao ?? []).filter((h) => h?.ma).map((h) => [h.ma, h]));
  const ngoai = khoiNgoai?.theoMa ?? {};
  for (const r of tatCa) {
    if (!r?.ma) continue;
    const gtgd = co(r.gtgd_tb20) ? r.gtgd_tb20 : 0;
    const doi = co(r.doi) ? r.doi : null;
    // Gia tang / giam manh so voi bien do thuong ngay (ATR%) cua CHINH ma.
    if (doi != null && Math.abs(doi) >= NGUONG_GIA_PCT) {
      const k = co(r.atr_pct) && r.atr_pct > 0 ? Math.abs(doi) / r.atr_pct : null;
      const bat = k != null ? k >= NGUONG_GIA_GAP : Math.abs(doi) >= NGUONG_GIA_TUYET_DOI;
      if (bat) ds.push({ ma: r.ma, loai: doi > 0 ? "tang_manh" : "giam_manh", diemXep: k ?? Math.abs(doi) / 2, moTa: `${doi > 0 ? "tăng" : "giảm"} ${gap(Math.abs(doi))}%${k != null ? `, gấp ${gap(k)} lần biên độ thường ngày của mã` : ""}` });
    }
    if (co(r.gia) && co(r.dinh_52t) && r.dinh_52t > 0 && r.gia >= r.dinh_52t) ds.push({ ma: r.ma, loai: "dinh", diemXep: doi ?? 0, moTa: "vượt đỉnh 52 tuần" });
    const b = bao.get(r.ma);
    if (b && co(b.cach_day_52t_pct) && b.cach_day_52t_pct <= SAT_DAY_PCT) {
      ds.push({ ma: r.ma, loai: "day", diemXep: -b.cach_day_52t_pct, moTa: b.cach_day_52t_pct <= 0.05 ? "đóng cửa ở đáy 52 tuần" : `đóng cửa sát đáy 52 tuần (cách ${gap(b.cach_day_52t_pct)}%)` });
    }
    // Dong tien: khoi luong dot bien (>= 2 lan TB20) kem huong gia. Giua phien khoi luong moi chay duoc 1 phan nen so nay chi tang len khi gan het phien.
    if (b && co(b.kl_ty_le) && b.kl_ty_le >= KL_GAP && gtgd >= GTGD_TOI_THIEU_TY && doi != null && Math.abs(doi) >= KL_GIA_DOI_PCT) {
      ds.push({ ma: r.ma, loai: doi > 0 ? "tien_vao" : "tien_ra", diemXep: b.kl_ty_le, moTa: `khối lượng gấp ${gap(b.kl_ty_le)} lần TB20, giá ${doi > 0 ? "tăng" : "giảm"} ${gap(Math.abs(doi))}%` });
    }
    // Khoi ngoai: mua / ban rong (ty dong) lon so voi thanh khoan thuong ngay cua chinh ma.
    const net = ngoai[r.ma];
    if (co(net) && Math.abs(net) >= NGOAI_TOI_THIEU_TY && gtgd >= GTGD_TOI_THIEU_TY && Math.abs(net) >= NGOAI_TY_LE_GTGD * gtgd) {
      ds.push({ ma: r.ma, loai: net > 0 ? "ngoai_mua" : "ngoai_ban", diemXep: Math.abs(net) / gtgd, moTa: `ngoại ${net > 0 ? "mua" : "bán"} ròng ${soVN(Math.abs(net), Math.abs(net) >= 100 ? 0 : 1, true)} tỷ, bằng ${soVN((Math.abs(net) / gtgd) * 100, 0)}% GTGD TB20` });
    }
    // Mat Than la TRANG THAI (nhieu ma cung luc, khong co moc "vua moi"): xep ma dang giam manh nhat trong phien len truoc.
    if (xemTinHieu && r.mat_than) ds.push({ ma: r.ma, loai: "mat_than", diemXep: doi != null ? -doi : 0, moTa: "cảnh báo rủi ro đảo chiều" });
  }
  if (!xemTinHieu) return ds;
  for (const m of coHoi?.mua ?? []) if (m?.ma) ds.push({ ma: m.ma, loai: "mua", diemXep: co(m.diem) ? m.diem : 0, moTa: co(m.diem) && m.diem > 0 ? `có tín hiệu MUA, điểm hợp lưu ${soVN(m.diem, 2, true)}` : "có tín hiệu MUA" });
  for (const m of coHoi?.muaMoi ?? []) if (m?.ma) ds.push({ ma: m.ma, loai: "mua_moi", diemXep: 0, moTa: "mở thêm lệnh mua mới" });
  for (const b of coHoi?.ban ?? []) if (b?.ma) ds.push({ ma: b.ma, loai: "ban", diemXep: co(b.ketQuaPct) ? -b.ketQuaPct : 0, moTa: b.lyDo ? b.lyDo.charAt(0).toLowerCase() + b.lyDo.slice(1) : "đóng lệnh" });
  for (const b of coHoi?.banBot ?? []) {
    if (!b?.ma) continue;
    if (b.loai === "chot") ds.push({ ma: b.ma, loai: "chot_loi", diemXep: co(b.laiPct) ? b.laiPct : 0, moTa: `chạm ${b.tp}, chốt lời từng phần` });
    else ds.push({ ma: b.ma, loai: "ban_bot", diemXep: co(b.laiPct) ? -b.laiPct : 0, moTa: "cảnh báo giảm bớt vị thế" });
  }
  for (const b of muaPhucHoi ?? []) {
    if (!b?.ma) continue;
    ds.push({ ma: b.ma, loai: "diem_b", diemXep: (b.klDay != null && b.klDay >= 2 ? 100 : 0) - (b.cach ?? 0), moTa: `có dấu hiệu hồi phục${co(b.giam) ? ` sau khi giảm ${gap(b.giam)}%` : ""}` });
  }
  for (const b of batDay ?? []) {
    if (!b?.ma) continue;
    ds.push({ ma: b.ma, loai: "bat_day", diemXep: co(Number(b.diem)) ? Number(b.diem) : 0, moTa: "có dấu hiệu tạo đáy (đủ điều kiện checklist)" });
  }
  return ds;
}

// Tra ve { suKien: [{ma, loai, moTa, top}] (moi (ma, loai) 1 dong, xep theo loai roi diem), dem: {loai: so ma that} }.
export function dungSuKienRadar({ tatCa = [], coHoi = null, muaPhucHoi = [], batDay = [], chiBao = [], khoiNgoai = null, xemTinHieu = false } = {}) {
  const uv = ungVien({ tatCa, coHoi, muaPhucHoi, batDay, chiBao, khoiNgoai, xemTinHieu });
  const daCo = new Set();
  const duy = [];
  for (const u of uv) {
    const khoa = `${u.loai}:${u.ma}`;
    if (daCo.has(khoa)) continue;
    daCo.add(khoa);
    duy.push(u);
  }
  const dem = {};
  for (const loai of Object.keys(LOAI_RADAR)) dem[loai] = 0;
  for (const u of duy) dem[u.loai]++;

  duy.sort((a, b) => LOAI_RADAR[a.loai].thuTu - LOAI_RADAR[b.loai].thuTu || b.diemXep - a.diemXep || a.ma.localeCompare(b.ma));

  // Noi bat: moi ma lay su kien quan trong nhat (da xep: gap truoc), roi moi loai toi da MOI_LOAI_TOI_DA, tong toi da SO_NOI_BAT_TOI_DA.
  const daLay = new Set();
  const daDem = {};
  let tong = 0;
  const top = new Set();
  for (const u of duy) {
    if (daLay.has(u.ma)) continue;
    daLay.add(u.ma); // ma nay da "dung" cho su kien quan trong nhat, du loai do co bi cat hay khong
    daDem[u.loai] = (daDem[u.loai] ?? 0) + 1;
    if (daDem[u.loai] <= MOI_LOAI_TOI_DA && tong < SO_NOI_BAT_TOI_DA) {
      top.add(`${u.loai}:${u.ma}`);
      tong++;
    }
  }
  const suKien = duy.slice(0, SO_SU_KIEN_TOI_DA).map((u) => ({ ma: u.ma, loai: u.loai, moTa: u.moTa, ...(top.has(`${u.loai}:${u.ma}`) && { top: true }) }));
  return { suKien, dem };
}
