// PHONG CACH DAU TU cho trang Danh gia danh muc - ham THUAN (test tay: engine/test/phongCachDauTu.test.mjs).
// KHONG phai he thong tin hieu rieng: cung 1 bo du lieu (gia, Tenkan / Kijun, duong can bang dai han, tin hieu he thong, BCTC quy), moi phong cach la 1 "lang kinh":
//   - trong so 5 tru diem suc khoe (Da dang / Rui ro / Xu huong / Thanh khoan / Doanh nghiep),
//   - quy tac gan NHAN TRANG THAI tung ma (Giu / Theo doi / Giam ty trong / Thoat),
//   - quy tac mua them / trung binh gia va muc cat lo theo gia von (lib/xuLyDanhMuc.js).
// CHI CON 2 PHONG CACH (Hieu 03/11/2026, sau backtest engine/dich-vu/nghienCuuPhongCachDauTu.mjs): "Xu huong trung han" = cach cua he thong CloudStock (tin hieu, cat lo, Kijun, duong can bang dai han)
// va "Dai han" (ban khi doanh nghiep xau di, khong cat lo theo gia - xem trang /dai-han). Luot song (thung Kijun / cat lo -7% khong hon he thong) va Tang truong (dong luc / LN tang khong hon VN-Index) da bi bo.
// Danh muc da luu voi phong cach cu (ngan_han / tang_truong) tu chuyen ve phong cach mac dinh (layPhongCach, lib/danhMucLuuDb.js).

export const PHONG_CACH = {
  trung_han: {
    ten: "Theo xu hướng trung hạn",
    ngan: "Xu hướng",
    moTa: "Cách của hệ thống CloudStock: giữ khi giá trên Kijun và đường cân bằng dài hạn, thoát theo tín hiệu bán và mốc cắt lỗ.",
    // trong so 04/11/2026 (nghienCuuDanhGiaDanhMucNangCao.mjs muc F): xu huong (tren Kijun) gan nhu khong bao truoc sut giam, bien dong / da dang thi co -> doi tu 20/25/30/15/10
    trongSo: { daDang: 30, ruiRo: 35, xuHuong: 15, thanhKhoan: 10, doanhNghiep: 10 },
    tyTrongToiDa: 0.3,
    catLo: -10, // cham la GIAM, qua them 5% la THOAT
    xuHuongDaiHan: false,
  },
  dai_han: {
    ten: "Dài hạn giá trị & cổ tức",
    ngan: "Dài hạn",
    moTa: "Doanh nghiệp khỏe, định giá hợp lý, cổ tức đều. Giá giảm không phải lý do bán nếu doanh nghiệp vẫn tốt — lý do bán là doanh nghiệp xấu đi.",
    trongSo: { daDang: 25, ruiRo: 30, xuHuong: 5, thanhKhoan: 5, doanhNghiep: 35 }, // 04/11/2026: tu 25/20/10/10/35 (xem trung_han)
    tyTrongToiDa: 0.25,
    catLo: null, // khong cat lo theo gia
    xuHuongDaiHan: true,
  },
};
export const PHONG_CACH_MAC_DINH = "trung_han";
export const layPhongCach = (k) => PHONG_CACH[k] ?? PHONG_CACH[PHONG_CACH_MAC_DINH];

export const NHAN = {
  giu: { ten: "Giữ", muc: 0 },
  theo_doi: { ten: "Theo dõi", muc: 1 },
  giam: { ten: "Giảm tỷ trọng", muc: 2 },
  thoat: { ten: "Thoát", muc: 3 },
};
const THEO_MUC = ["giu", "theo_doi", "giam", "thoat"];

const so = (v) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
const p0 = (x) => `${Math.round(x)}`;
const p1 = (x) => x.toFixed(1).replace(".", ",");
const gia2 = (x) => String(Math.round(x * 100) / 100).replace(".", ","); // gia nghin dong, toi da 2 so le
const coGia = (x) => so(x) != null && so(x) > 0;

// DIEM DOANH NGHIEP 1 MA (0..1) tu "Danh gia 360" (moi tru 0-10 = thu hang phan tram so voi ma cung loai, xem engine/dich-vu/taoDuLieuPhanTichWeb.mjs) theo phong cach.
// cb = 1 dong cua layBangCoBan (lib/phanTichCoBanDb.js). Z vung nguy co / dang lo 4 quy -> chan tren.
const TRONG_SO_DN = {
  trung_han: { sucKhoe: 0.5, hieuQua: 0.5 },
  dai_han: { sucKhoe: 0.3, dinhGia: 0.3, hieuQua: 0.2, coTuc360: 0.2 },
};
export function diemDoanhNghiepMa(cb, phongCach = PHONG_CACH_MAC_DINH) {
  if (!cb) return null;
  const w = TRONG_SO_DN[phongCach] ?? TRONG_SO_DN[PHONG_CACH_MAC_DINH];
  let tong = 0;
  let tw = 0;
  for (const [k, t] of Object.entries(w)) {
    const v = so(cb[k]);
    if (v == null) continue;
    tong += t * v;
    tw += t;
  }
  if (!tw) return null;
  let s = tong / tw / 10;
  if (cb.vungZ2 === "nguy cơ") s = Math.min(s, 0.2);
  if (so(cb.lnTTM) != null && so(cb.lnTTM) <= 0) s = Math.min(s, 0.3);
  return Math.max(0, Math.min(1, s));
}

// NHAN TRANG THAI 1 MA theo phong cach. x = { gia, tenkan, kijun, ggBot, tin, banBot, stopLoss, tp1, tyTrong, rc, laiLoPct, cb, coTinHieu }
// (coTinHieu = co du lieu tin hieu he thong - thanh vien; khach chi co gia / duong ky thuat / BCTC). Tra { nhan, muc, lyDo: [cac ly do o muc cao nhat], phu: [ly do muc thap hon], canCu }.
export function nhanTrangThai(x, phongCach = PHONG_CACH_MAC_DINH) {
  const pc = layPhongCach(phongCach);
  const k = PHONG_CACH[phongCach] ? phongCach : PHONG_CACH_MAC_DINH;
  const gia = so(x.gia);
  const tenkan = so(x.tenkan);
  const kijun = so(x.kijun);
  const ggBot = so(x.ggBot);
  const sl = so(x.stopLoss);
  const tp1 = so(x.tp1);
  const lai = so(x.laiLoPct);
  const cb = x.cb ?? null;
  const ds = [];
  const them = (muc, lyDo) => ds.push({ muc, lyDo });
  if (gia == null) return { nhan: "theo_doi", muc: 1, lyDo: ["Chưa có giá của mã này."], phu: [], canCu: "thieu" };
  const duoiTenkan = coGia(tenkan) && gia < tenkan;
  const duoiKijun = coGia(kijun) && gia < kijun;
  const duoiCanBang = coGia(ggBot) && gia < ggBot;
  const banHeThong = x.tin === "BAN";
  const chamCatLo = coGia(sl) && gia <= sl;
  const satCatLo = coGia(sl) && !chamCatLo && (gia / sl - 1) * 100 <= 3;
  const ganTP = coGia(tp1) && tp1 > gia && (tp1 / gia - 1) * 100 <= 3;

  // chung cho moi phong cach: ty trong / rui ro qua lon
  const tt = so(x.tyTrong);
  const rc = so(x.rc);
  if (tt != null && tt > pc.tyTrongToiDa + 0.1) them(2, `Chiếm ${p0(tt * 100)}% danh mục — vượt xa mức tối đa ${p0(pc.tyTrongToiDa * 100)}%/mã của phong cách này`);
  else if (tt != null && tt > pc.tyTrongToiDa) them(1, `Chiếm ${p0(tt * 100)}% danh mục, trên mức ${p0(pc.tyTrongToiDa * 100)}%/mã`);
  if (rc != null && rc > 0.45 && (tt == null || rc - tt > 0.08)) them(2, `Gánh ${p0(rc * 100)}% rủi ro của cả danh mục`);

  if (k === "trung_han") {
    if (banHeThong) them(3, "Hệ thống đang báo BÁN");
    if (chamCatLo) them(3, `Giá đã chạm mốc cắt lỗ của hệ thống (${gia2(sl)})`);
    else if (satCatLo) them(1, `Giá chỉ cách mốc cắt lỗ ${p1((gia / sl - 1) * 100)}%`);
    if (x.banBot) them(2, "Điểm hệ thống yếu đi (bán bớt)");
    if (ganTP) them(1, `Gần mốc chốt lời TP1 (${gia2(tp1)}) — chuẩn bị chốt một phần`);
    if (duoiCanBang) them(3, "Giá dưới đường cân bằng dài hạn — xu hướng dài hạn đã gãy");
    else if (duoiKijun) them(2, "Giá dưới Kijun — xu hướng trung hạn yếu");
    else if (duoiTenkan) them(1, "Giá dưới Tenkan — đà ngắn hạn chậm lại");
    if (lai != null && lai <= pc.catLo - 5) them(3, `Lỗ ${p1(Math.abs(lai))}% so với giá vốn của bạn`);
    else if (lai != null && lai <= pc.catLo) them(2, `Lỗ ${p1(Math.abs(lai))}% so với giá vốn — quá mức ${Math.abs(pc.catLo)}% thường chấp nhận`);
    if (!ds.some((d) => d.muc > 0)) them(0, x.coTinHieu && (x.tin === "MUA" || x.tin === "NAM GIU") ? "Hệ thống đang " + (x.tin === "MUA" ? "MUA" : "NẮM GIỮ") + ", giá trên Kijun và đường cân bằng dài hạn" : "Giá trên Kijun và đường cân bằng dài hạn — xu hướng còn giữ");
    return gom(ds, x.coTinHieu ? "he_thong" : "xu_huong");
  }

  // DAI HAN: can BCTC; thieu thi cham tam theo xu huong dai han
  if (!cb) {
    if (duoiCanBang) them(2, "Giá dưới đường cân bằng dài hạn (chưa có BCTC để đánh giá doanh nghiệp)");
    else them(1, "Chưa có BCTC của mã này trong hệ thống — chỉ đánh giá được theo giá");
    return gom(ds, "thieu");
  }
  const lnYoY = so(cb.lnYoY);
  const lnTTM = so(cb.lnTTM);
  const f = so(cb.f);
  const sinhLoi = so(cb.sinhLoi);
  const taiChinh = cb.loai && cb.loai !== "pi";
  const zNguy = cb.vungZ2 === "nguy cơ";
  const dangLo = lnTTM != null && lnTTM <= 0;

  // dai_han
  if (zNguy) them(3, "Điểm Z vùng nguy cơ tài chính — rủi ro doanh nghiệp, không còn hợp đầu tư dài hạn");
  if (dangLo) them(2, "Đang lỗ lũy kế 4 quý gần nhất");
  if (!taiChinh && f != null && f <= 3) them(2, `Điểm F ${f}/9 — sức khỏe tài chính yếu`);
  if (taiChinh && sinhLoi != null && sinhLoi <= 1) them(2, `Điểm sinh lời ${sinhLoi}/5 — hiệu quả kém`);
  if (lnYoY != null && lnYoY <= -30 && !dangLo) them(1, `Lợi nhuận 4 quý giảm ${p0(Math.abs(lnYoY))}%`);
  if (!taiChinh && so(cb.cfoLN) != null && so(cb.cfoLN) < 0 && !dangLo) them(1, "Có lãi nhưng dòng tiền kinh doanh âm — lợi nhuận chưa ra tiền");
  const pe = so(cb.pe);
  const peNganh = so(cb.peNganh);
  if (pe != null && peNganh > 0 && pe > 2 * peNganh && pe > 20) them(1, `P/E ${p1(pe)} gấp hơn 2 lần trung vị ngành (${p1(peNganh)}) — định giá đắt, cân nhắc chốt bớt nếu đã lãi nhiều`);
  if (duoiCanBang) them(1, "Giá dưới đường cân bằng dài hạn — chưa nên mua thêm, chờ thị trường ủng hộ");
  if (!ds.some((d) => d.muc > 0)) {
    const ycf = !taiChinh && f != null ? `điểm F ${f}/9` : taiChinh && sinhLoi != null ? `sinh lời ${sinhLoi}/5` : null;
    them(0, `Doanh nghiệp ổn${ycf ? ` (${ycf}${cb.vungZ2 === "an toàn" ? ", Z an toàn" : ""})` : ""}${pe != null ? `, P/E ${p1(pe)}${peNganh ? ` vs ngành ${p1(peNganh)}` : ""}` : ""}`);
  }
  return gom(ds, "co_ban");
}

function gom(ds, canCu) {
  const muc = ds.reduce((m, d) => Math.max(m, d.muc), 0);
  return { nhan: THEO_MUC[muc], muc, lyDo: ds.filter((d) => d.muc === muc).map((d) => d.lyDo), phu: ds.filter((d) => d.muc < muc && d.muc > 0).map((d) => d.lyDo), canCu };
}

// Gop du lieu 1 ma tu cac nguon trang dang co (dong tin hieu rut gon + nen tu API + BCTC) thanh dau vao cua nhanTrangThai.
// Moc cat lo / TP1 / ban bot CHI co nghia khi he thong dang cam ma (MUA / NAM GIU) - ma TRUNG LAP / BAN van con so cu cua lenh truoc.
export function dauVaoNhan(h, { r = null, ls = null, cb = null, rc = null, coTinHieu = false } = {}) {
  const dangCam = coTinHieu && (r?.tin === "MUA" || r?.tin === "NAM GIU");
  return {
    gia: h.gia ?? r?.gia ?? ls?.gia,
    tenkan: ls?.tenkan ?? null,
    kijun: r?.kijun ?? ls?.kijun ?? null,
    ggBot: r?.gg_bot ?? ls?.gg_bot ?? null,
    tin: coTinHieu ? r?.tin ?? null : null,
    banBot: dangCam ? !!r?.ban_bot : false,
    stopLoss: dangCam ? r?.stop_loss ?? null : null,
    tp1: dangCam ? r?.tp1 ?? null : null,
    tyTrong: h.tyTrong ?? null,
    rc,
    laiLoPct: h.laiLoPct ?? null,
    cb,
    coTinHieu: coTinHieu && !!r?.tin,
  };
}
