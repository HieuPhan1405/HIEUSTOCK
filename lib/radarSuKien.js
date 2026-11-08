// RADAR TIN HIEU o trang chu (ham THUAN, import tuong doi de test tay: engine/test/radarSuKien.test.mjs).
// Gom cac "su kien dang chu y" cua PHIEN NAY tu du lieu ma web da co (khong them nguon): moi ma toi da 1 su kien (loai quan trong nhat), dem tung loai that, rut gon con toi da SO_SU_KIEN_TOI_DA o sang tren luoi.
// Lenh (mua / mua moi / chot TP / ban / giam bot) lay tu `coHoi` = dungCoHoiHomNay (lib/coHoiHomNay.js) nen chi gom viec XAY RA TRONG PHIEN, khong phai trang thai cu (vd ma da cham TP3 tu lau).
// Khach chua dang nhap chi thay loai "thi truong" (gia bat thuong so voi chinh ma, dinh 52 tuan); tin hieu MUA/BAN, Mat Than, chot loi, diem B, bat day chi danh cho thanh vien da duyet (lib/khoaTrangChu.js).
// Chu mo ta TRUNG TINH: diem B / bat day chi "co dau hieu", khong phai diem mua chinh.
import { soVN } from "./soVN.js";

export const SO_SU_KIEN_TOI_DA = 18;
export const SO_O_LUOI = 120;
const MOI_LOAI_TOI_DA = 6;
const NGUONG_GIA_PCT = 2; // gia doi it nhat 2% moi tinh la bat thuong
const NGUONG_GIA_GAP = 2; // va gap it nhat 2 lan bien do thuong ngay (ATR%) cua chinh ma
const NGUONG_GIA_TUYET_DOI = 4; // ma thieu ATR: chi can doi >= 4%

// thuTu: so nho = quan trong hon (quyet dinh loai nao thang khi 1 ma co nhieu su kien + thu tu o danh sach). thanhVien: chi hien cho tai khoan da duyet.
export const LOAI_RADAR = {
  mua: { nhan: "Tín hiệu mua", mau: "var(--tim-nhat)", thuTu: 1, thanhVien: true },
  mua_moi: { nhan: "Mua mới", mau: "var(--cyan)", thuTu: 2, thanhVien: true },
  diem_b: { nhan: "Hồi phục", mau: "var(--diem-b)", thuTu: 3, thanhVien: true },
  bat_day: { nhan: "Tạo đáy", mau: "var(--diem-day)", thuTu: 4, thanhVien: true },
  chot_loi: { nhan: "Chốt lời", mau: "var(--vang)", thuTu: 5, thanhVien: true },
  ban: { nhan: "Bán", mau: "var(--do)", thuTu: 6, thanhVien: true },
  ban_bot: { nhan: "Giảm bớt", mau: "var(--cam)", thuTu: 7, thanhVien: true },
  mat_than: { nhan: "Mắt Thần", mau: "var(--do-nhat)", thuTu: 8, thanhVien: true },
  gia: { nhan: "Giá", mau: "var(--xanh)", thuTu: 9, thanhVien: false },
  dinh: { nhan: "Đỉnh 52 tuần", mau: "var(--chanh)", thuTu: 10, thanhVien: false },
};

const co = (v) => typeof v === "number" && Number.isFinite(v);
const gap = (x) => soVN(x, 1, true);

// Moi ung vien: { ma, loai, moTa, diemXep } - diemXep lon hon = noi bat hon trong cung loai.
function ungVien({ tatCa, coHoi, muaPhucHoi, batDay, xemTinHieu }) {
  const ds = [];
  for (const r of tatCa) {
    if (!r?.ma) continue;
    if (co(r.doi) && Math.abs(r.doi) >= NGUONG_GIA_PCT) {
      const k = co(r.atr_pct) && r.atr_pct > 0 ? Math.abs(r.doi) / r.atr_pct : null;
      const bat = k != null ? k >= NGUONG_GIA_GAP : Math.abs(r.doi) >= NGUONG_GIA_TUYET_DOI;
      if (bat) {
        const huong = r.doi > 0 ? "tăng" : "giảm";
        ds.push({ ma: r.ma, loai: "gia", diemXep: k ?? Math.abs(r.doi) / 2, moTa: `${huong} ${gap(Math.abs(r.doi))}%${k != null ? `, gấp ${gap(k)} lần biên độ thường ngày của mã` : ""}` });
      }
    }
    if (co(r.gia) && co(r.dinh_52t) && r.dinh_52t > 0 && r.gia >= r.dinh_52t) {
      ds.push({ ma: r.ma, loai: "dinh", diemXep: co(r.doi) ? r.doi : 0, moTa: "đang ở đỉnh 52 tuần" });
    }
    // Mat Than la TRANG THAI (nhieu ma cung luc, khong co moc "vua moi"): xep ma dang giam manh nhat trong phien len truoc.
    if (xemTinHieu && r.mat_than) ds.push({ ma: r.ma, loai: "mat_than", diemXep: co(r.doi) ? -r.doi : 0, moTa: "cảnh báo rủi ro đảo chiều" });
  }
  if (!xemTinHieu) return ds;
  for (const m of coHoi?.mua ?? []) if (m?.ma) ds.push({ ma: m.ma, loai: "mua", diemXep: co(m.diem) ? m.diem : 0, moTa: co(m.diem) && m.diem > 0 ? `có tín hiệu MUA, điểm hợp lưu ${soVN(m.diem, 2, true)}` : "có tín hiệu MUA" });
  for (const m of coHoi?.muaMoi ?? []) if (m?.ma) ds.push({ ma: m.ma, loai: "mua_moi", diemXep: 0, moTa: "mở thêm lệnh mua mới" });
  for (const b of coHoi?.ban ?? []) if (b?.ma) ds.push({ ma: b.ma, loai: "ban", diemXep: co(b.ketQuaPct) ? -b.ketQuaPct : 0, moTa: `${b.lyDo ? b.lyDo.charAt(0).toLowerCase() + b.lyDo.slice(1) : "đóng lệnh"}` });
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

// Tra ve { suKien: [{ma, loai, moTa}] (da cat + xep), dem: {loai: so ma that} }.
export function dungSuKienRadar({ tatCa = [], coHoi = null, muaPhucHoi = [], batDay = [], xemTinHieu = false } = {}) {
  const tatCaUv = ungVien({ tatCa, coHoi, muaPhucHoi, batDay, xemTinHieu });
  // Moi ma giu su kien quan trong nhat (thuTu nho nhat); dem theo TUNG LOAI tinh tren moi ung vien (1 ma co the nam o nhieu loai).
  const dem = {};
  for (const loai of Object.keys(LOAI_RADAR)) dem[loai] = 0;
  const theoLoaiMa = new Set();
  for (const u of tatCaUv) {
    const khoa = `${u.loai}:${u.ma}`;
    if (theoLoaiMa.has(khoa)) continue;
    theoLoaiMa.add(khoa);
    dem[u.loai]++;
  }
  const tot = new Map();
  for (const u of tatCaUv) {
    const hienTai = tot.get(u.ma);
    if (!hienTai || LOAI_RADAR[u.loai].thuTu < LOAI_RADAR[hienTai.loai].thuTu) tot.set(u.ma, u);
  }
  const daDem = {};
  const suKien = [...tot.values()]
    .sort((a, b) => LOAI_RADAR[a.loai].thuTu - LOAI_RADAR[b.loai].thuTu || b.diemXep - a.diemXep || a.ma.localeCompare(b.ma))
    .filter((u) => {
      daDem[u.loai] = (daDem[u.loai] ?? 0) + 1;
      return daDem[u.loai] <= MOI_LOAI_TOI_DA;
    })
    .slice(0, SO_SU_KIEN_TOI_DA)
    .map(({ ma, loai, moTa }) => ({ ma, loai, moTa }));
  return { suKien, dem };
}

// Luoi ma: SO_O_LUOI ma lon nhat theo thanh khoan (GTGD TB20) + tat ca ma co su kien, xep A-Z. Tra mang ma.
export function chonLuoiMa(tatCa = [], suKien = [], soO = SO_O_LUOI) {
  const chon = new Set(suKien.map((s) => s.ma));
  const theoTK = [...tatCa].filter((r) => r?.ma).sort((a, b) => (co(b.gtgd_tb20) ? b.gtgd_tb20 : -1) - (co(a.gtgd_tb20) ? a.gtgd_tb20 : -1));
  for (const r of theoTK) {
    if (chon.size >= soO) break;
    chon.add(r.ma);
  }
  return [...chon].sort((a, b) => a.localeCompare(b));
}
