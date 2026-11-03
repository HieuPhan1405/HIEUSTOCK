// GOI Y MUA THEO PHONG CACH DAI HAN (trang /danh-gia-danh-muc, tab "Goi y mua") - ham THUAN, test tay: engine/test/goiYDaiHan.test.mjs.
// KHAC goi y mua xu huong (lib/goiYMua.js, dua tren tin hieu MUA ngan han da backtest): o day chi dung danh sach doanh nghiep cua trang /dai-han (Buffett / Co tuc / Graham / It bien dong, tu BCTC quy),
// khong dung tin hieu MUA / BAN, RSI hay SMA. Ma bi gan co rui ro (lib/coRuiRoDaiHan.js) da duoc loai o nguon.
// Cach xep: khac nganh voi danh muc dang cam -> truoc; r < 0,5 (rat re, thuong do loi nhuan bat thuong - phai kiem tra) -> sau; nhieu phuong phap cung chon -> truoc; r thap -> truoc. KHONG co backtest xep hang rieng cho thu tu nay
// (xem lib/phuongPhapDaiHanKetQua.js cho ket qua tung phuong phap); so mã muc tieu / ty trong la ngưỡng web tu dat.
// Chi goi y mua khi gia <= 1,1 x gia tri hop ly (nhan "Hop ly" tro xuong - lib/phuongPhapDaiHan.js nhanDinhGia); mã dat hon dua vao danh sach "cho gia ve" kem muc gia can cho.
import { lichGiaiNgan, DOT_GIAI_NGAN } from "./phuongPhapDaiHan.js";

export const DAI_HAN_GOI_Y = { soMaMucTieu: 8, tranTyTrong: 0.25, nguongDat: 1.1 };
const LO = 100;
const TEN_NGAN = { buffett: "Buffett", coTuc: "Cổ tức", graham: "Graham", itBienDong: "Ít biến động" };
const so = (v) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

// phuongPhap = { buffett: { meta, ds }, coTuc, graham, itBienDong } (layDuLieuDaiHan().phuongPhap, da tinh lai gia moi nhat). dangCam = [{ ma, nganh }] (nganh theo nhan hien thi).
// taiSan = { tienMat, no, nav }. Tra { conCho, soMaHienCo, moiMa, tienMoiMa, mua: [...], cho: [...], ghiChu }.
export function goiYDaiHan(phuongPhap = {}, { dangCam = [], taiSan = {}, soMaMucTieu = DAI_HAN_GOI_Y.soMaMucTieu, tran = DAI_HAN_GOI_Y.tranTyTrong, nguongDat = DAI_HAN_GOI_Y.nguongDat } = {}) {
  const maCam = new Set(dangCam.map((x) => x.ma));
  const nganhCam = new Map();
  for (const x of dangCam) if (x.nganh && x.nganh !== "Khác") nganhCam.set(x.nganh, (nganhCam.get(x.nganh) ?? []).concat(x.ma));
  const soMaHienCo = maCam.size;
  const conCho = Math.max(0, soMaMucTieu - soMaHienCo);
  const tienMat = so(taiSan.tienMat);
  const no = so(taiSan.no) ?? 0;
  const nav = so(taiSan.nav) > 0 ? so(taiSan.nav) : tienMat > 0 ? tienMat : null;
  const moiMa = nav ? nav * Math.min(tran, 1 / soMaMucTieu) : null; // vi the muc tieu moi ma (chia 5 dot)
  const ghiChu = [];
  if (no > 0) ghiChu.push("Đang dùng margin — đầu tư dài hạn không nên dùng tiền vay; giảm nợ trước, số lượng gợi ý để 0.");
  if (conCho === 0) ghiChu.push(`Danh mục đã có ${soMaHienCo} mã (mục tiêu tối đa ${soMaMucTieu}) — muốn thêm mã mới cần giảm bớt mã yếu trước (xem tab "Nên làm gì").`);

  // gop theo ma: cac phuong phap chon ma do
  const gop = new Map();
  for (const [khoa, p] of Object.entries(phuongPhap)) {
    for (const m of p?.ds ?? []) {
      const c = gop.get(m.ma);
      const ph = { khoa, ten: TEN_NGAN[khoa] ?? khoa };
      if (c) c.phuongPhap.push(ph);
      else gop.set(m.ma, { ...m, phuongPhap: [ph] });
    }
  }
  const ung = [...gop.values()]
    .filter((m) => !maCam.has(m.ma) && so(m.gia) > 0 && so(m.giaHopLy) > 0)
    .map((m) => {
      const r = m.gia / m.giaHopLy;
      const nganh = m.nganhNhan ?? m.nganh;
      return { ...m, r, nganh, trungNganh: nganh && nganh !== "Khác" && nganhCam.has(nganh) ? nganhCam.get(nganh) : null, canhBaoGia: r < 0.5 };
    });
  const xep = (a, b) => Number(!!a.trungNganh) - Number(!!b.trungNganh) || Number(a.canhBaoGia) - Number(b.canhBaoGia) || b.phuongPhap.length - a.phuongPhap.length || a.r - b.r;
  const re = ung.filter((m) => m.r <= nguongDat).sort(xep);
  const dat = ung.filter((m) => m.r > nguongDat).sort((a, b) => a.r - b.r);

  const soDung = Math.min(conCho, re.length);
  const dot1Ty = DOT_GIAI_NGAN[0].ty / 100;
  // tien dot dau moi ma: 20% vi the muc tieu, khong vuot tien mat chia deu cho cac ma se mua
  const tienDot1Chung = moiMa == null ? null : tienMat != null && soDung > 0 ? Math.min(moiMa * dot1Ty, Math.max(0, tienMat) / soDung) : moiMa * dot1Ty;
  const muaDay = re.map((m, k) => {
    const lich = lichGiaiNgan({ gia: m.gia, sma50: m.sma50, sma200: m.sma200, ggTop: m.ggTop, locXuHuong: false });
    const tienDot1 = tienDot1Chung;
    const trongCho = k < conCho;
    const kl = trongCho && no <= 0 && tienDot1 > 0 && m.gia > 0 ? Math.floor(tienDot1 / (m.gia * 1000) / LO) * LO : 0;
    return { ...m, trongCho, lich, tienMucTieu: moiMa, tienDot1, kl, tien: kl * m.gia * 1000, giaMua: m.gia, giaHopLy: m.giaHopLy };
  });
  const mua = muaDay.slice(0, conCho + 8); // chi hien so cho + 8 mã du phong
  const cho = dat.slice(0, 12).map((m) => ({ ...m, giaCan: Math.round(m.giaHopLy * nguongDat * 100) / 100, canGiam: (m.giaHopLy * nguongDat / m.gia - 1) * 100 }));
  if (!nav) ghiChu.push("Nhập tiền mặt ở “Vốn & margin” để tính số lượng đợt đầu theo tỷ trọng mục tiêu.");
  else if (tienMat == null) ghiChu.push("Chưa nhập tiền mặt — số lượng đang tính theo tài sản ròng và giả định đủ tiền; nhập tiền mặt ở “Vốn & margin” để tính đúng.");
  return { conCho, soMaHienCo, moiMa, tienDot1: tienDot1Chung, soMaDat: muaDay.length, mua, cho, ghiChu, soMaTrongCho: mua.filter((x) => x.trongCho).length };
}
