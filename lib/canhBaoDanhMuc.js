// CANH BAO cho Danh muc theo doi (Hieu 29/10/2026) - ham THUAN, import tuong doi de test tay: engine/test/canhBaoDanhMuc.test.mjs.
// Cot "Canh bao" = nhung dieu DANG / SAP xay ra, viet bang loi de hieu cho nguoi xem: sap toi moc chot loi, sap toi vung can (khang cu), sat vung do (ho tro), sap cat lo,
// gia duoi Tenkan / Kijun / may (nen can nhac ban bot), he thong bao Ban bot, Mat Than. Nhung gi DA xay ra trong phien nam o cot ben canh (lib/chuYTrongPhien.js).
// Dau vao: 1 dong tin hieu da gop cot chi bao (cach_tenkan_pct, cach_kijun_pct, gia_so_may) + gia, kijun, gg_top, gg_bot, dinh_52t, stop_loss, tp1..tp3, tp_da_cham, ban_bot, mat_than.
// Chi la NHAN THONG TIN tren web, khong doi tin hieu MUA / BAN cua engine.
import { soVN } from "./soVN.js";
import { laDangGiu, cacMucThamChieu } from "./ghiChuTuDong.js";

const XAU = "var(--do)";
const CAM = "var(--cam)";
const VANG = "var(--vang)";
const TOT = "var(--xanh)";

export const GAN_PCT = 3; // cach muc trong khoang nay thi coi la "sap toi" / "sat"

const so = (v) => (v == null || v === "" ? NaN : Number(v));
const hopLe = (v) => Number.isFinite(v) && v > 0;
const g = (v) => soVN(v, v >= 100 ? 1 : 2, true);
const x = (v) => soVN(Math.abs(v), 1);
const TEN_DUONG = { Kijun: "Kijun", "cân bằng dài hạn": "đường cân bằng dài hạn", "đỉnh 52 tuần": "đỉnh 52 tuần" };

// Tra ve { cacCanhBao: [{ khoa, nhan, mau, muc }], them, canGanNhat: { tren, duoi } } - muc 0 = nang (do), 1 = can nhac (cam / vang), 2 = tich cuc (xanh).
export function canhBaoDangCo(r, toiDa = 4) {
  const ds = [];
  const them = (khoa, nhan, mau, muc) => ds.push({ khoa, nhan, mau, muc });
  const gia = so(r?.gia);
  if (!hopLe(gia)) return { cacCanhBao: [], them: 0, canGanNhat: { tren: null, duoi: null } };
  const giu = laDangGiu(r);

  // 1) Sat / cham muc cat lo (chi lenh dang giu)
  const sl = so(r.stop_loss);
  if (giu && hopLe(sl)) {
    if (gia <= sl) them("cat_lo", `Giá đã xuống mức cắt lỗ ${g(sl)} — theo kế hoạch cần cắt lỗ`, XAU, 0);
    else if (gia <= sl * (1 + GAN_PCT / 100)) them("sap_cat_lo", `Giá sắp chạm mức cắt lỗ ${g(sl)} — còn cách ${x((sl / gia - 1) * 100)}%, cần theo dõi sát`, XAU, 0);
  }
  // 2) Canh bao cua he thong
  if (r.mat_than) them("mat_than", "Mắt Thần cảnh báo: có rủi ro giá đảo chiều", XAU, 0);
  if (giu && r.ban_bot) them("ban_bot", "Hệ thống báo Bán bớt: điểm tín hiệu đã yếu đi", CAM, 1);

  // 3) Gia so voi Tenkan / Kijun / may
  const tk = so(r.cach_tenkan_pct);
  const kj = so(r.cach_kijun_pct);
  const duoiTk = Number.isFinite(tk) && tk < 0;
  const duoiKj = Number.isFinite(kj) && kj < 0;
  const may = so(r.gia_so_may);
  if (duoiTk && duoiKj) them("duoi_tk_kj", giu ? "Giá đang dưới cả Tenkan và Kijun — xu hướng yếu, nên cân nhắc bán bớt" : "Giá đang dưới cả Tenkan và Kijun — xu hướng đang yếu", giu ? XAU : CAM, giu ? 0 : 1);
  else if (duoiKj) them("duoi_kj", giu ? "Giá đang dưới Kijun — xu hướng yếu đi, nên cân nhắc bán bớt" : "Giá đang dưới Kijun — xu hướng chưa tốt", giu ? XAU : CAM, giu ? 0 : 1);
  else if (duoiTk) them("duoi_tk", giu ? "Giá đang dưới Tenkan — đà tăng ngắn hạn yếu, nên cân nhắc bán bớt" : "Giá đang dưới Tenkan — đà tăng ngắn hạn yếu", CAM, 1);
  if (may === -1) them("duoi_may", giu ? "Giá đang dưới mây — xu hướng giảm, nên cân nhắc bán bớt" : "Giá đang dưới mây — xu hướng giảm", XAU, giu ? 0 : 1);
  else if (may === 0) them("trong_may", "Giá đang nằm trong mây — chưa rõ xu hướng", VANG, 1);

  // 4) Sap toi moc chot loi tiep theo (chi lenh dang giu)
  if (giu) {
    const daCham = Number(/(\d)/.exec(String(r.tp_da_cham ?? ""))?.[1] ?? 0);
    const tiep = [1, 2, 3].map((k) => ({ k, v: so(r[`tp${k}`]) })).find(({ k, v }) => k > daCham && hopLe(v) && v > gia);
    if (tiep) {
      const cach = (tiep.v / gia - 1) * 100;
      if (cach <= GAN_PCT) them("sap_tp", `Sắp tới mốc chốt lời TP${tiep.k} ${g(tiep.v)} — còn cách ${x(cach)}%`, TOT, 2);
    }
  }

  // 5) Vung can (khang cu) / vung do (ho tro) gan nhat
  const muc = cacMucThamChieu(r);
  const tren = muc.filter((m) => m.gia > gia).sort((a, b) => a.gia - b.gia)[0] ?? null;
  const duoi = muc.filter((m) => m.gia <= gia).sort((a, b) => b.gia - a.gia)[0] ?? null;
  const cachTren = tren ? (tren.gia / gia - 1) * 100 : null;
  const cachDuoi = duoi ? (1 - duoi.gia / gia) * 100 : null;
  if (tren && cachTren <= GAN_PCT) them("sap_can", `Giá sắp tới vùng cản ${g(tren.gia)} (${TEN_DUONG[tren.ten] ?? tren.ten}) — còn cách ${x(cachTren)}%, dễ bị chững lại`, CAM, 1);
  if (duoi && cachDuoi <= GAN_PCT) them("sat_do", `Giá đang sát vùng đỡ ${g(duoi.gia)} (${TEN_DUONG[duoi.ten] ?? duoi.ten}) — nếu thủng thì yếu đi`, VANG, 1);

  ds.sort((a, b) => a.muc - b.muc);
  return {
    cacCanhBao: ds.slice(0, toiDa),
    them: Math.max(0, ds.length - toiDa),
    canGanNhat: {
      tren: tren ? { gia: tren.gia, ten: TEN_DUONG[tren.ten] ?? tren.ten, cachPct: cachTren } : null,
      duoi: duoi ? { gia: duoi.gia, ten: TEN_DUONG[duoi.ten] ?? duoi.ten, cachPct: cachDuoi } : null,
    },
  };
}
