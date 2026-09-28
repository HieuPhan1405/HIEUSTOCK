// TOP CO HOI DANG CHU Y (trang dau) - 4 O LENH CUA PHIEN HOM NAY (ham THUAN, khong dung DB - import tuong doi de test tay: engine/test/coHoiHomNay.test.mjs):
//  - Mua:     ma phat tin hieu MUA trong phien nay (diem cao truoc).
//  - Ban:     lenh DONG trong phien nay (lenh dau ban / cat lo / hoa von / thoat, lenh mua moi cat lo rieng / dong cung lenh dau) - lay tu nhat ky lenh da dong (ngay_ban = phien),
//             ket qua CA LENH (gom cac lan chot tung phan); ma BAN chua co dong nhat ky (vd loi ghi) thi lay tu tin hieu.
//  - Mua moi: lenh mua moi (dot sau) vua mo trong phien nay.
//  - Ban bot: cac lan chot 30% o TP1 / TP2 xay ra trong phien nay (lenh dau + lenh mua moi) + canh bao giam bot (diem hom nay tut duoi nguong nhung chua BAN).
// Chi cac su kien cua PHIEN nay - lenh da cham TP tu nhung ngay truoc khong hien lai (xem Sổ lệnh đang mở).
import { lenhDangMo, ngayChuoi } from "./muaThemTinhToan.js";
import { gomTheoLenh, loaiLenh } from "./thongKeLenh.js";

const LY_DO_DONG = {
  BAN: "Bán theo tín hiệu",
  THOAT: "Thoát lệnh",
  CAT_LO: "Cắt lỗ",
  BAO_VE_LAI: "Hòa vốn (sau TP2)",
  THOAT_KIJUN: "Thoát theo Kijun sau TP2",
  CHOT_TP3: "Chốt đủ TP3",
};
// ly_do_ban cua dong tin hieu BAN (AFL): 1 = diem so, 2 = Stop-loss, 3 = bao ve lai, 4 = thoat Kijun sau TP2, 5 = chot du TP3.
const LY_DO_BAN_AFL = { 1: "Bán theo tín hiệu", 2: "Cắt lỗ", 3: "Hòa vốn (sau TP2)", 4: "Thoát theo Kijun sau TP2", 5: "Chốt đủ TP3" };
const laDongTP = (ly) => /^TP[123]$/.test(ly ?? "");
const so = (v) => (v != null && Number.isFinite(Number(v)) ? Number(v) : null);

// tatCa: cac dong tin hieu da chuan hoa (lib/tinHieu.js); dongLenh: cac dong lenh_da_dong cua nhung lenh CO SU KIEN trong phien (layLenhCoSuKienNgay - gom ca dong cu cua lenh do
// de tinh ket qua ca lenh); ngay: "yyyy-mm-dd" phien giao dich cua du lieu moi nhat.
export function dungCoHoiHomNay({ tatCa = [], dongLenh = [], ngay }) {
  // Lenh da mua trong khung gio phien nay ma tin hieu mat trong phien (web giu, lib/lenhMuaChot.js) van hien - nguoi dung da mua that.
  const webHomNay = lenhDangMo(tatCa).filter((l) => l.lenh_web === true && ngay && ngayChuoi(l.ngay_mua) === ngay);
  const mua = [...tatCa.filter((r) => r.tin === "MUA"), ...webHomNay.filter((l) => !l.la_lenh_moi)].sort((a, b) => (b.diem ?? 0) - (a.diem ?? 0));
  const muaMoi = [...lenhDangMo(tatCa).filter((l) => l.la_lenh_moi && l.mua_moi_hom_nay), ...webHomNay.filter((l) => l.la_lenh_moi)];

  const dong = dongLenh.map((d) => ({ ...d, ngay_mua: ngayChuoi(d.ngay_mua), ngay_ban: ngayChuoi(d.ngay_ban) }));
  const ketQuaLenh = new Map(gomTheoLenh(dong).map((n) => [n.khoa, n]));
  const khoaLenh = (d) => `${d.ma}|${d.ngay_mua}|${loaiLenh(d)}`;
  // Su kien cua phien + lenh ban dang THEO DOI (ghi ngoai khung gio, chua chot - co the tu phien truoc, xem lib/khungGioVaoLenh.js).
  const suKien = ngay ? dong.filter((d) => d.ngay_ban === ngay || d.theo_doi === true) : [];

  const ban = [];
  const banBot = [];
  for (const d of suKien) {
    const laMuaMoi = loaiLenh(d) !== "goc";
    // TP3 chi la moc tham khao (cach chot 30/30 + 40% giu den BAN) - dong TP3 chi con o lenh cu (30/30/25 hoac gop 85%), khong phai viec can lam -> khong hien.
    if (d.ly_do === "TP3") continue;
    if (laDongTP(d.ly_do)) {
      // Cung 1 lenh cham nhieu moc trong phien (vd TP1 + TP2) -> gop 1 dong: phan chot cong lai, lai/lo = trung binh theo ty trong cac phan.
      const khoa = `${khoaLenh(d)}|chot`;
      const phan = so(d.phan_chot_pct) ?? 30;
      const cu = banBot.find((x) => x.khoa === khoa);
      const moc = { tp: d.ly_do, gia: so(d.gia_ban) };
      if (cu) {
        cu.laiPct = cu.laiPct != null && so(d.lai_lo_pct) != null ? (cu.laiPct * cu.phanPct + so(d.lai_lo_pct) * phan) / (cu.phanPct + phan) : cu.laiPct;
        cu.phanPct += phan;
        cu.moc.push(moc);
        cu.moc.sort((a, b) => a.tp.localeCompare(b.tp));
        cu.tp = cu.moc.map((m) => m.tp).join(" + ");
      } else {
        banBot.push({ khoa, ma: d.ma, laMuaMoi, loai: "chot", tp: d.ly_do, moc: [moc], phanPct: phan, gia: so(d.gia_ban), laiPct: so(d.lai_lo_pct) });
      }
      continue;
    }
    const n = ketQuaLenh.get(khoaLenh(d));
    ban.push({
      khoa: khoaLenh(d),
      ma: d.ma,
      laMuaMoi,
      lyDo: LY_DO_DONG[d.ly_do] ?? "Đóng lệnh",
      ngayMua: d.ngay_mua,
      giaMua: so(d.gia_mua),
      giaBan: so(d.gia_ban),
      phanConLaiPct: so(d.phan_chot_pct) != null && so(d.phan_chot_pct) < 100 ? so(d.phan_chot_pct) : null,
      ketQuaPct: n?.ketQuaPct ?? so(d.lai_lo_pct),
      // THEO DOI: tin hieu ban / cat lo ngoai khung gio - chua chot, gia ban la gia tam tinh; theoDoiTu = luc ghi (tinh khung chot ke tiep).
      theoDoi: d.theo_doi === true,
      theoDoiTu: d.theo_doi === true ? d.tao_luc ?? null : null,
    });
  }
  // Ma BAN trong tin hieu nhung chua co dong nhat ky phien nay (vd upload cu / loi ghi) - van hien de khong sot lenh ban.
  const daCo = new Set(ban.filter((b) => !b.laMuaMoi).map((b) => b.ma));
  for (const r of tatCa) {
    if (r.tin !== "BAN" || daCo.has(r.ma)) continue;
    ban.push({ khoa: r.ma, ma: r.ma, laMuaMoi: false, lyDo: LY_DO_BAN_AFL[Number(r.ly_do_ban)] ?? "Bán theo tín hiệu", ngayMua: null, giaMua: null, giaBan: so(r.gia), phanConLaiPct: null, ketQuaPct: so(r.lai_lo_pct) });
  }
  ban.sort((a, b) => (a.ketQuaPct ?? 0) - (b.ketQuaPct ?? 0));

  // Canh bao giam bot: dang giu, diem hom nay tut duoi nguong ban nhung chua du dieu kien BAN (ban_bot do AFL tinh cho phien nay).
  for (const r of tatCa) {
    if ((r.tin === "MUA" || r.tin === "NAM GIU") && r.ban_bot)
      banBot.push({ khoa: `${r.ma}|canhBao`, ma: r.ma, laMuaMoi: false, loai: "canhBao", ngayMua: ngayChuoi(r.ngay_mua), diem: so(r.diem), laiPct: so(r.lai_lo_pct) });
  }
  // Lan chot truoc (moc cao nhat truoc: TP2 roi TP1), canh bao giam bot sau (lo nhieu nhat truoc).
  const bac = (x) => Math.max(...x.moc.map((m) => ({ TP1: 1, TP2: 2, TP3: 3 })[m.tp] ?? 0));
  banBot.sort((a, b) => (a.loai === b.loai ? (a.loai === "chot" ? bac(b) - bac(a) || (b.laiPct ?? 0) - (a.laiPct ?? 0) : (a.laiPct ?? 0) - (b.laiPct ?? 0)) : a.loai === "chot" ? -1 : 1));

  return { ngay, mua, ban, muaMoi, banBot };
}
