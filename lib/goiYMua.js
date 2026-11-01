// GOI Y MUA cho trang Danh gia danh muc - ham THUAN (test tay: engine/test/goiYMua.test.mjs).
// Bo dieu kien DA BACKTEST (engine/dich-vu/nghienCuuDieuKienMua.mjs, 02/11/2026; lenh Mua thuong 2014-10/2026, vao moc +0,6%, cat lo <= 6%, 30/30 + chay, phi 0,4%):
//   tin hieu MUA cua he thong + gia con trong VUNG MUA (<= moc +1%) + gia KHONG cao hon SMA50 qua 3% + RSI14 <= 59 + VN-Index 20 phien tang <= 5%
//   (cac chi bao lay o phien TRUOC ngay tin hieu, dung nhu luc backtest); danh muc toi da 6 ma, chia DEU 1/6 tai san rong, khong vay.
// Ket qua (danh muc 6 ma, moi nam bat dau lai bang tien mat): tich luy x3,61 vs VN-Index x3,45; 2022 -7,7% vs -32,8%; 2018 -22,8% vs -9,3%; 2017 +17,3% vs +48%.
// Nguong chon SAU khi xem du lieu den 2023 -> 2024-2026 moi la kiem tra that (+21,4%, +27,7%, -1,1%). Chi de tham khao, khong phai khuyen nghi.
export const DIEU_KIEN = { vungMuaPct: 1, sma50ToiDa: 3, rsiToiDa: 59, vni20ToiDa: 5, catLoToiDaPct: 6, soMaToiDa: 6 };
const LO = 100;
const so = (v) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

// RSI Wilder 14 phien tai chi so i cua mang gia dong cua (can >= 15 phien truoc i)
export function rsiTai(c, i, n = 14) {
  if (!Array.isArray(c) || i < n) return null;
  let g = 0;
  let l = 0;
  for (let k = 1; k <= n; k++) {
    const d = c[k] - c[k - 1];
    if (d > 0) g += d;
    else l -= d;
  }
  g /= n;
  l /= n;
  for (let k = n + 1; k <= i; k++) {
    const d = c[k] - c[k - 1];
    g = (g * (n - 1) + Math.max(d, 0)) / n;
    l = (l * (n - 1) + Math.max(-d, 0)) / n;
  }
  return l === 0 ? 100 : 100 - 100 / (1 + g / l);
}
// Gia dong cua tai i cao hon SMA n bao nhieu %
export function cachSmaTai(c, i, n = 50) {
  if (!Array.isArray(c) || i < n - 1) return null;
  let s = 0;
  for (let k = i - n + 1; k <= i; k++) s += c[k];
  return (c[i] / (s / n) - 1) * 100;
}

// Kiem tra 1 ung vien. u = { gia, moc (gia_mua he thong; null voi ma dang CHO), sma50Pct, rsi14 }, vni20 = % VN-Index 20 phien.
export function kiemTraDieuKien(u, { vni20 = null } = {}) {
  const dk = DIEU_KIEN;
  const cac = [];
  if (so(u.moc) > 0) cac.push({ ten: `Giá trong vùng mua (≤ mốc +${dk.vungMuaPct}%)`, dat: so(u.gia) <= so(u.moc) * (1 + dk.vungMuaPct / 100), giaTri: (so(u.gia) / so(u.moc) - 1) * 100 });
  cac.push({ ten: `Không cao hơn SMA50 quá ${dk.sma50ToiDa}%`, dat: so(u.sma50Pct) != null && so(u.sma50Pct) <= dk.sma50ToiDa, giaTri: so(u.sma50Pct) });
  cac.push({ ten: `RSI14 ≤ ${dk.rsiToiDa}`, dat: so(u.rsi14) != null && so(u.rsi14) <= dk.rsiToiDa, giaTri: so(u.rsi14) });
  cac.push({ ten: `VN-Index 20 phiên tăng ≤ ${dk.vni20ToiDa}%`, dat: so(vni20) != null && so(vni20) <= dk.vni20ToiDa, giaTri: so(vni20) });
  return { dat: cac.every((x) => x.dat), cac };
}

// GOI Y THEO DANH MUC KHACH: bo ma dang cam, so cho con lai (toi da 6 ma), ma TRUNG NGANH voi danh muc xep sau, chia deu 1/6 tai san rong (gioi han boi tien mat), cat lo <= 6%.
// ungVien = [{ ma, nganh, gia, moc, stop_loss, tp1, tp2, diem, ... }] (da dat dieu kien); dangCam = [{ ma, nganh }]; taiSan = { tienMat (null = chua nhap), no, nav }.
export function goiYTheoDanhMuc(ungVien = [], { dangCam = [], taiSan = {}, soMaToiDa = DIEU_KIEN.soMaToiDa } = {}) {
  const maCam = new Set(dangCam.map((x) => x.ma));
  const nganhCam = new Map();
  for (const x of dangCam) if (x.nganh && x.nganh !== "Khác") nganhCam.set(x.nganh, (nganhCam.get(x.nganh) ?? []).concat(x.ma));
  const soMaHienCo = maCam.size;
  const conCho = Math.max(0, soMaToiDa - soMaHienCo);
  const tienMat = so(taiSan.tienMat);
  const no = so(taiSan.no) ?? 0;
  const nav = so(taiSan.nav) > 0 ? so(taiSan.nav) : tienMat > 0 ? tienMat : null;
  const moiMa = nav ? nav / soMaToiDa : null;
  const ghiChu = [];
  if (no > 0) ghiChu.push("Đang dùng margin — kế hoạch không mua mới bằng tiền vay; giảm nợ trước, số lượng gợi ý để 0.");
  if (conCho === 0) ghiChu.push(`Danh mục đã có ${soMaHienCo} mã (tối đa ${soMaToiDa}) — muốn mua mã mới cần bán bớt mã yếu trước (xem tab "Nên làm gì").`);
  const ds = ungVien
    .filter((u) => !maCam.has(u.ma))
    .map((u) => ({ ...u, trungNganh: u.nganh && nganhCam.has(u.nganh) ? nganhCam.get(u.nganh) : null }))
    .sort((a, b) => Number(!!a.trungNganh) - Number(!!b.trungNganh) || (so(a.cachMoc) ?? 0) - (so(b.cachMoc) ?? 0) || (so(b.diem) ?? 0) - (so(a.diem) ?? 0));
  const soDung = Math.min(conCho, ds.length);
  const tienMoiMa = moiMa == null ? null : tienMat != null && soDung > 0 ? Math.min(moiMa, Math.max(0, tienMat) / soDung) : moiMa;
  const goiY = ds.map((u, k) => {
    const giaVao = so(u.moc) > 0 ? Math.min(so(u.gia), so(u.moc) * (1 + DIEU_KIEN.vungMuaPct / 100)) : so(u.gia);
    const catLo = Math.max(so(u.stop_loss) ?? 0, giaVao * (1 - DIEU_KIEN.catLoToiDaPct / 100));
    const trongCho = k < conCho;
    const kl = trongCho && no <= 0 && tienMoiMa > 0 && giaVao > 0 ? Math.floor(tienMoiMa / (giaVao * 1000) / LO) * LO : 0;
    return {
      ...u,
      giaVao,
      catLo,
      catLoPct: giaVao > 0 ? (1 - catLo / giaVao) * 100 : null,
      trongCho,
      kl,
      tien: kl * giaVao * 1000,
      ruiRo: kl * (giaVao - catLo) * 1000,
      ruiRoPctNav: nav && kl ? ((kl * (giaVao - catLo) * 1000) / nav) * 100 : null,
    };
  });
  if (!nav) ghiChu.push("Nhập tiền mặt ở “Vốn & margin” để tính số lượng mua theo tỷ trọng 1/6 tài sản.");
  else if (tienMat == null) ghiChu.push("Chưa nhập tiền mặt — số lượng đang tính theo 1/6 tài sản và giả định đủ tiền; nhập tiền mặt ở “Vốn & margin” để tính đúng.");
  else if (tienMat != null && tienMoiMa != null && tienMoiMa < moiMa) ghiChu.push(`Tiền mặt chỉ đủ khoảng ${Math.round((tienMoiMa / moiMa) * 100)}% tỷ trọng chuẩn cho mỗi mã gợi ý.`);
  return { conCho, soMaHienCo, moiMa, tienMoiMa, goiY, ghiChu };
}
