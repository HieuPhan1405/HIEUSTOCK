// LICH SU DIEM MUA PHUC HOI (diem B) cho trang /mua-phuc-hoi (Hieu 2026-10-21: "viet ca lich su tu dau 2026"). Moi dong = 1 diem B cua 1 ma (giam >= 15% tu dinh 20 phien roi dong cua lay lai Tenkan + Kijun, xem diemMuaPhucHoi.js),
// kem muc giam, KL quanh day, day 20 phien, cat lo / TP1-2-3 theo cong thuc binh thuong, GIA VAO = MO CUA PHIEN KE TIEP va ket qua THUC TE sau 5 / 10 / 20 phien (dong cua phien thu k ke tu phien vao, CHUA tru phi 0,4%; null neu chua du phien),
// va che do thi truong luc do (vni_yeu = VN-Index <= -7% so dinh 60 phien: nghien cuu cho thay diem B + thi truong yeu hoi tot hon tu 2022.5 nhung khong on dinh theo giai doan).
// Tinh lai TOAN BO tu `tuNgay` moi lan chay (upsert idempotent o /api/upload-diem-b).
import { atr } from "./taChiBao.js";
import { tinhIchimoku, tinhDuongCanBangDaiHan } from "./ichimoku.js";
import { tinhDiemMuaPhucHoi } from "./diemMuaPhucHoi.js";
import { laNganhTrongTam } from "../danh-sach/nganh.js";

export const SO_NEN_TINH_B = 800;
export const NGAY_BAT_DAU_MAC_DINH = "2026-01-01";
export const NGUONG_VNI_YEU_PCT = -7;

// vniNen: [{ t, c }] tang dan. Tra ve Map(ngay -> true neu VN-Index <= -7% so voi dinh dong cua 60 phien).
export function tinhVniYeuTheoNgay(vniNen) {
  const kq = new Map();
  const c = (vniNen ?? []).map((x) => x.c);
  for (let i = 59; i < c.length; i++) {
    let hi = -Infinity;
    for (let j = i - 59; j <= i; j++) if (c[j] > hi) hi = c[j];
    kq.set(vniNen[i].t, (c[i] / hi - 1) * 100 <= NGUONG_VNI_YEU_PCT);
  }
  return kq;
}

const so = (v, d = 4) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);

// nen: [{ t, o, h, l, c, v }] 1 ma. Tra ve mang su kien (cu -> moi).
export function tinhLichSuDiemBChoMa(ma, nen, { tuNgay = NGAY_BAT_DAU_MAC_DINH, vniYeu = new Map(), chiNganhTrongTam = true } = {}) {
  if (!Array.isArray(nen) || nen.length < 120) return [];
  if (chiNganhTrongTam && !laNganhTrongTam(ma)) return []; // bo 10 nganh nho + ma chua gan nganh (Hieu 2026-10-22)
  const b = nen.slice(-SO_NEN_TINH_B);
  const n = b.length;
  const high = b.map((x) => x.h), low = b.map((x) => x.l), close = b.map((x) => x.c), volume = b.map((x) => x.v ?? 0);
  const ich = tinhIchimoku({ high, low });
  const cb = tinhDuongCanBangDaiHan({ high, low });
  const { laB, moTa } = tinhDiemMuaPhucHoi(
    { high, low, close, volume, atr: atr({ high, low, close }, 14), tenkan: ich.tenkan, kijun: ich.kijun, cloudTop: ich.cloudTop, cbTop: cb.cbTop },
    { giamTuPct: 15, giamDenPct: 999 }
  );
  const gtgd = (i) => { let s = 0; for (let j = Math.max(0, i - 19); j <= i; j++) s += (close[j] * volume[j]) / 1e6; return s / Math.min(20, i + 1); };
  const ketQua = [];
  for (let i = 0; i < n; i++) {
    if (!laB[i] || b[i].t < tuNgay) continue;
    const m = moTa(i);
    const E2 = i + 1 < n ? (b[i + 1].o ?? b[i + 1].c) : null;
    const sau = (k) => (E2 && i + 1 + k < n ? (close[i + 1 + k] / E2 - 1) * 100 : null);
    ketQua.push({
      ma, ngay: b[i].t, gia_b: m.gia, giam: so(m.giam, 2), kl_day: so(m.klDay, 2), day_20: m.day, sl: so(m.sl, 3), tp1: so(m.tp1, 3), tp2: so(m.tp2, 3), tp3: so(m.tp3, 3),
      gia_vao: E2, pct_sau_5: so(sau(5), 2), pct_sau_10: so(sau(10), 2), pct_sau_20: so(sau(20), 2), vni_yeu: vniYeu.has(b[i].t) ? vniYeu.get(b[i].t) : null, gtgd: so(gtgd(i), 1),
    });
  }
  return ketQua;
}

export function tinhLichSuDiemBToanBo(nenTheoMa, vniNen, opts = {}) {
  const vniYeu = tinhVniYeuTheoNgay(vniNen);
  const ds = [];
  for (const [ma, nen] of nenTheoMa) {
    try {
      ds.push(...tinhLichSuDiemBChoMa(ma, nen, { ...opts, vniYeu }));
    } catch {
      // bo qua ma loi, khong lam hong ca lo
    }
  }
  return ds;
}

const COT_CSV = ["ma", "ngay", "gia_b", "giam", "kl_day", "day_20", "sl", "tp1", "tp2", "tp3", "gia_vao", "pct_sau_5", "pct_sau_10", "pct_sau_20", "vni_yeu", "gtgd"];
export function xayDungCsvDiemB(ds) {
  const dong = [COT_CSV.join(",")];
  for (const s of ds) dong.push(COT_CSV.map((c) => (s[c] == null ? "" : c === "vni_yeu" ? (s[c] ? "1" : "0") : String(s[c]))).join(","));
  return dong.join("\n") + "\n";
}
