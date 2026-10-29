// CANH BAO DONG TIEN / KHOI LUONG / RSI cho Danh muc theo doi (Hieu 29/10/2026: "ngoai ban nhieu, ban chu dong nhieu de chu y") - ham THUAN, import tuong doi de test tay: engine/test/canhBaoDongTien.test.mjs.
// Dau vao (moi nguon co the thieu -> bo qua phan do):
//   tomTat   : dong tien thoi gian thuc cua ma (DNSE, lib/dongTien.js): { mua, ban, rong, kl, nn: { mua, ban, rong } } - DON VI TRIEU DONG; ngayDuLieu phai la phien hien tai (ngayPhien), cu thi bo qua.
//   nnLichSu : khoi ngoai theo phien [{ ngay, rongTy }] tang dan (VNDirect, lib/khoiNgoaiMa.js) - dem so phien lien tiep mua / ban rong.
//   klTyLe   : khoi luong phien hom nay / trung binh 20 phien (chi bao ky thuat); doiPhienPct: % doi gia dong cua so voi phien truoc; rsi: RSI14.
//   giu      : ma dang giu (canh bao ban nang hon).
// Chi la NHAN THONG TIN tren web, khong doi tin hieu cua engine. Cau chu viet de nguoi xem hieu ngay.
import { soVN } from "./soVN.js";

const XAU = "var(--do)";
const CAM = "var(--cam)";
const VANG = "var(--vang)";
const TOT = "var(--xanh)";

export const NGUONG = {
  chuDongToiThieuTy: 3, // tong mua + ban chu dong toi thieu (ty) moi xet ty le (dau phien so lieu con it)
  chuDongTyLe: 0.6, // ben nao chiem >= 60% tong chu dong thi coi la ap dao
  ngoaiToiThieuTy: 5, // khoi ngoai mua / ban rong toi thieu (ty) trong phien
  ngoaiTyLe: 0.65, // ben nao >= 65% tong mua + ban cua khoi ngoai
  ngoaiLienTiepPhien: 3, // so phien lien tiep mua / ban rong
  ngoaiLienTiepToiThieuTy: 10, // tong rong cua chuoi phien toi thieu (ty)
  klDotBien: 1.8, // khoi luong gap bao nhieu lan trung binh 20 phien
  rsiNong: 75,
  rsiQuaBan: 25,
};

const so = (v) => (v == null || v === "" ? NaN : Number(v));
const ty = (trieu) => soVN(Math.abs(trieu) / 1000, Math.abs(trieu) >= 100_000 ? 0 : 1);

// Tra ve mang canh bao { khoa, nhan, mau, muc } (muc 0 = nang, 1 = can nhac, 2 = tich cuc) - gop vao canhBaoDangCo bang gopCanhBao.
export function canhBaoDongTien({ tomTat = null, ngayDuLieu = null, ngayPhien = null, nnLichSu = null, klTyLe = null, doiPhienPct = null, rsi = null, giu = false } = {}) {
  const ds = [];
  const them = (khoa, nhan, mau, muc) => ds.push({ khoa, nhan, mau, muc });

  // 1) Mua / ban CHU DONG trong phien (lenh khop chieu mua hay chieu ban)
  const homNay = tomTat && (!ngayPhien || ngayDuLieu === ngayPhien);
  if (homNay) {
    const mua = so(tomTat.mua);
    const ban = so(tomTat.ban);
    if (Number.isFinite(mua) && Number.isFinite(ban) && (mua + ban) / 1000 >= NGUONG.chuDongToiThieuTy) {
      const tong = mua + ban;
      if (ban / tong >= NGUONG.chuDongTyLe) them("ban_chu_dong", `Bán chủ động đang áp đảo: bán ${ty(ban)} tỷ, mua ${ty(mua)} tỷ (bán chiếm ${soVN((ban / tong) * 100, 0)}%) — lực bán mạnh, cần chú ý`, giu ? XAU : CAM, giu ? 0 : 1);
      else if (mua / tong >= NGUONG.chuDongTyLe) them("mua_chu_dong", `Mua chủ động đang chiếm ưu thế: mua ${ty(mua)} tỷ, bán ${ty(ban)} tỷ (mua chiếm ${soVN((mua / tong) * 100, 0)}%) — dòng tiền vào tốt`, TOT, 2);
    }
    // 2) Khoi ngoai TRONG phien
    const nn = tomTat.nn;
    if (nn) {
      const nm = so(nn.mua);
      const nb = so(nn.ban);
      const rong = Number.isFinite(nm) && Number.isFinite(nb) ? nm - nb : NaN;
      if (Number.isFinite(rong) && Math.abs(rong) / 1000 >= NGUONG.ngoaiToiThieuTy && nm + nb > 0) {
        if (rong < 0 && nb / (nm + nb) >= NGUONG.ngoaiTyLe) them("ngoai_ban_phien", `Khối ngoại đang bán ròng ${ty(rong)} tỷ trong phiên — nên chú ý`, giu ? XAU : CAM, giu ? 0 : 1);
        else if (rong > 0 && nm / (nm + nb) >= NGUONG.ngoaiTyLe) them("ngoai_mua_phien", `Khối ngoại đang mua ròng ${ty(rong)} tỷ trong phiên`, TOT, 2);
      }
    }
  }

  // 3) Khoi ngoai nhieu phien lien tiep
  if (Array.isArray(nnLichSu) && nnLichSu.length) {
    const dau = Math.sign(nnLichSu[nnLichSu.length - 1].rongTy);
    let dem = 0;
    let tong = 0;
    for (let i = nnLichSu.length - 1; i >= 0 && dau !== 0 && Math.sign(nnLichSu[i].rongTy) === dau; i--) {
      dem++;
      tong += nnLichSu[i].rongTy;
    }
    if (dem >= NGUONG.ngoaiLienTiepPhien && Math.abs(tong) >= NGUONG.ngoaiLienTiepToiThieuTy) {
      if (dau < 0) them("ngoai_ban_lien_tiep", `Khối ngoại bán ròng ${dem} phiên liên tiếp, tổng ${soVN(Math.abs(tong), 0)} tỷ — áp lực bán kéo dài`, giu ? XAU : CAM, giu ? 0 : 1);
      else them("ngoai_mua_lien_tiep", `Khối ngoại mua ròng ${dem} phiên liên tiếp, tổng ${soVN(tong, 0)} tỷ — dòng tiền ngoại ủng hộ`, TOT, 2);
    }
  }

  // 4) Khoi luong dot bien
  const kl = so(klTyLe);
  const doi = so(doiPhienPct);
  if (Number.isFinite(kl) && kl >= NGUONG.klDotBien && Number.isFinite(doi)) {
    if (doi <= -1) them("kl_giam", `Khối lượng gấp ${soVN(kl, 1)} lần bình thường kèm giá giảm ${soVN(Math.abs(doi), 1)}% — có dấu hiệu bán mạnh`, giu ? XAU : CAM, giu ? 0 : 1);
    else if (doi >= 1) them("kl_tang", `Khối lượng gấp ${soVN(kl, 1)} lần bình thường kèm giá tăng ${soVN(doi, 1)}% — dòng tiền vào mạnh`, TOT, 2);
  }

  // 5) RSI qua nong / qua ban
  const r = so(rsi);
  if (Number.isFinite(r)) {
    if (r >= NGUONG.rsiNong) them("rsi_nong", `RSI ${soVN(r, 0)} đang rất cao — giá đã tăng nóng, dễ bị điều chỉnh`, CAM, 1);
    else if (r <= NGUONG.rsiQuaBan) them("rsi_qua_ban", `RSI ${soVN(r, 0)} đang rất thấp — giá đã bị bán quá đà, có thể có nhịp hồi`, VANG, 1);
  }
  return ds;
}

// Gop 2 danh sach canh bao: nang len truoc, cat toi da `toiDa`. Tra ve { cacCanhBao, them }.
export function gopCanhBao(...cacDanhSach) {
  const toiDa = typeof cacDanhSach[cacDanhSach.length - 1] === "number" ? cacDanhSach.pop() : 5;
  const tatCa = cacDanhSach.flat().sort((a, b) => a.muc - b.muc);
  return { cacCanhBao: tatCa.slice(0, toiDa), them: Math.max(0, tatCa.length - toiDa) };
}
