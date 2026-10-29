// DA DIEN RA TRONG PHIEN (cot ben canh Canh bao cua Danh muc theo doi, 29/10/2026) - ham THUAN, import tuong doi de test tay: engine/test/chuYTrongPhien.test.mjs.
// Ghi lai nhung gi DA XAY RA trong phien gan nhat cua 1 ma (xay ra roi thi note ra, chua xay ra thi de trong):
//  - GIA vuot / thung cac duong cua he thong: Tenkan, Kijun, day / dinh may, duong can bang dai han (tren / duoi), dinh 52 tuan; cham duong roi bat lai / bi tu choi; bien dong manh.
//  - HE THONG: cham TP / cat lo / dong lenh trong phien (tu nhat ky lenh da dong), tin hieu MUA moi hom nay, tin hieu BAN. (Canh bao dang co - Ban bot, Mat Than, sap toi moc - nam o cot Canh bao: lib/canhBaoDanhMuc.js.)
// Cau chu viet de nguoi xem hieu ngay.
// So gia: dong cua phien hien tai (nen cuoi, ke ca nen dang chay giua phien) so voi dong cua phien truoc, cung cong thuc Ichimoku 9-17-33 / can bang 65-129 nhu bieu do (lib/chiBaoKyThuat.js).
// Chi la NHAN THONG TIN, khong doi tin hieu cua engine.
import { tinhIchimoku, tinhCanBang } from "./chiBaoKyThuat.js";
import { soVN } from "./soVN.js";

const XAU = "var(--do)";
const TOT = "var(--xanh)";
const LUU_Y = "var(--cam)";
const TRUNG = "var(--vang)";

export const BIEN_DONG_MANH_PCT = 4; // |thay doi trong phien| >= muc nay thi ghi "Tang / Giam manh"

const g = (v) => soVN(v, v >= 100 ? 1 : 2, true);
const p = (v) => `${v >= 0 ? "+" : "−"}${soVN(Math.abs(v), 1)}%`;
const so = (v) => (v == null || v === "" ? NaN : Number(v));
const hopLe = (v) => Number.isFinite(v) && v > 0;

// bars: [{ t, h, l, c }] tang dan (nen cuoi = phien hien tai). Tra ve [{ khoa, nhan, mau, loai }] cac su kien GIA.
export function suKienGia(bars) {
  const n = Array.isArray(bars) ? bars.length : 0;
  if (n < 3) return [];
  const i = n - 1;
  const j = n - 2;
  const nen = bars[i];
  const truoc = bars[j];
  if (![nen.h, nen.l, nen.c, truoc.c].every((x) => Number.isFinite(x) && x > 0)) return [];
  const ich = tinhIchimoku(bars);
  const cb = tinhCanBang(bars);
  const ds = [];
  const them = (khoa, nhan, mau, loai) => ds.push({ khoa, nhan, mau, loai });
  const c = nen.c;
  const pc = truoc.c;

  // Duong don (Tenkan, Kijun, can bang tren / duoi): dong cua vuot / thung; chua vuot / thung ma cham duong trong phien thi ghi "cham roi bat lai" / "bi tu choi".
  const duong = (khoa, ten, mangDuong) => {
    const lt = mangDuong[i];
    const lp = mangDuong[j];
    if (!hopLe(lt) || !hopLe(lp)) return;
    if (c < lt && pc >= lp) return them(`thung_${khoa}`, `Giá vừa thủng xuống dưới ${ten} (${g(lt)})`, XAU, "xau");
    if (c > lt && pc <= lp) return them(`vuot_${khoa}`, `Giá vừa vượt lên trên ${ten} (${g(lt)})`, TOT, "tot");
    if (c >= lt && nen.l <= lt) return them(`bat_${khoa}`, `Giá chạm ${ten} (${g(lt)}) rồi bật lên lại`, TOT, "tot");
    if (c < lt && nen.h >= lt) return them(`choi_${khoa}`, `Giá lên chạm ${ten} (${g(lt)}) nhưng bị đẩy xuống`, LUU_Y, "luuy");
  };
  duong("tenkan", "Tenkan", ich.tenkan);
  duong("kijun", "Kijun", ich.kijun);
  duong("cb_tren", "đỉnh vùng cân bằng dài hạn", cb.top);
  duong("cb_duoi", "đáy vùng cân bằng dài hạn", cb.bot);

  // May: day / dinh may tai nen hien tai va nen truoc (spanA / spanB da dich 26 phien nen index khop nen).
  const topMay = (k) => (ich.spanA[k] != null && ich.spanB[k] != null ? Math.max(ich.spanA[k], ich.spanB[k]) : null);
  const botMay = (k) => (ich.spanA[k] != null && ich.spanB[k] != null ? Math.min(ich.spanA[k], ich.spanB[k]) : null);
  const tt = topMay(i);
  const tp = topMay(j);
  const bt = botMay(i);
  const bp = botMay(j);
  if (hopLe(tt) && hopLe(tp) && hopLe(bt) && hopLe(bp)) {
    if (c < bt && pc >= bp) them("thung_may", `Giá vừa thủng xuống dưới mây (${g(bt)})`, XAU, "xau");
    else if (c > tt && pc <= tp) them("vuot_may", `Giá vừa vượt lên trên mây (${g(tt)})`, TOT, "tot");
    else if (c >= bt && c <= tt && (pc > tp || pc < bp)) them("vao_may", pc > tp ? "Giá vừa rơi vào trong mây" : "Giá vừa đi lên vào trong mây", TRUNG, "luuy");
  }

  // Dinh 52 tuan (250 phien): gia cao hom nay vuot dinh cac phien truoc.
  if (n > 60) {
    let dinh = -Infinity;
    for (let k = Math.max(0, i - 250); k < i; k++) if (bars[k].h > dinh) dinh = bars[k].h;
    if (Number.isFinite(dinh) && nen.h > dinh) them("dinh_52t", `Giá vừa vượt đỉnh 52 tuần (${g(dinh)})`, TOT, "tot");
  }

  const doi = (c / pc - 1) * 100;
  if (doi >= BIEN_DONG_MANH_PCT) them("tang_manh", `Giá tăng mạnh ${p(doi)} trong phiên`, TOT, "tot");
  else if (doi <= -BIEN_DONG_MANH_PCT) them("giam_manh", `Giá giảm mạnh ${p(doi)} trong phiên`, XAU, "xau");
  return ds;
}

const LY_DO = {
  TP1: ["Đã chạm mốc chốt lời TP1", "tot"],
  TP2: ["Đã chạm mốc chốt lời TP2", "tot"],
  TP3: ["Đã chạm mốc chốt lời TP3", "tot"],
  CAT_LO: ["Đã chạm mức cắt lỗ", "xau"],
  BAN: ["Đã bán theo tín hiệu", "xau"],
  BAO_VE_LAI: ["Giá quay về mức hòa vốn (sau TP2) — đã thoát lệnh", "luuy"],
  THOAT: ["Đã thoát lệnh", "luuy"],
  THOAT_SOM: ["Đã thoát sớm vì tín hiệu mất", "luuy"],
  THOAT_KIJUN: ["Đã thoát vì giá thủng Kijun (sau TP2)", "xau"],
  CHOT_TP3: ["Đã chốt đủ ở mốc TP3", "tot"],
};
const MAU = { tot: TOT, xau: XAU, luuy: LUU_Y };

// row: dong tin hieu cua ma; dongLenhNgay: cac dong lenh_da_dong CUA MA do co ngay_ban = phien hien tai; ngay: "yyyy-mm-dd" phien hien tai.
export function suKienHeThong(row, dongLenhNgay = [], ngay = null) {
  const ds = [];
  const them = (khoa, nhan, loai) => ds.push({ khoa, nhan, mau: MAU[loai] ?? LUU_Y, loai });
  for (const d of dongLenhNgay) {
    const [nhan, loai] = LY_DO[d.ly_do] ?? [`Đã đóng lệnh (${d.ly_do ?? "?"})`, "luuy"];
    const chot = /^TP[123]$/.test(d.ly_do ?? "") && so(d.phan_chot_pct) > 0 ? `, nên chốt ${soVN(so(d.phan_chot_pct), 0)}% lệnh` : "";
    const gia = hopLe(so(d.gia_ban)) ? ` ở ${g(so(d.gia_ban))}` : "";
    them(`lenh_${d.ly_do}_${d.vong ?? ""}`, `${nhan}${gia}${chot}`, loai);
  }
  if (row?.tin === "MUA" && ngay && String(row.ngay_mua ?? "").slice(0, 10) === ngay) them("mua_moi", "Hôm nay có tín hiệu MUA mới", "tot");
  if (row?.tin === "BAN" && !dongLenhNgay.length) them("tin_ban", "Hôm nay có tín hiệu BÁN", "xau");
  return ds;
}

const UU_TIEN = { xau: 0, luuy: 1, tot: 2 };
// Gop: canh bao xau len truoc, tot sau; toi da `toiDa` dong (con lai tinh vao `them`).
export function chuYTrongPhien({ bars, row, dongLenhNgay = [], ngay = null, toiDa = 5 } = {}) {
  const tatCa = [...suKienHeThong(row, dongLenhNgay, ngay), ...suKienGia(bars)];
  tatCa.sort((a, b) => (UU_TIEN[a.loai] ?? 1) - (UU_TIEN[b.loai] ?? 1));
  return { cacSuKien: tatCa.slice(0, toiDa), them: Math.max(0, tatCa.length - toiDa) };
}
