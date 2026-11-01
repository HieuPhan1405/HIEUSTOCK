// SUC KHOE DOANH NGHIEP CUA DANH MUC (BCTC quy - layBangCoBan) - ham THUAN (test tay: engine/test/phongCachDauTu.test.mjs).
// hang = pb.hang (lib/danhGiaDanhMuc.js: ma, giaTri, tyTrong...), cbTheoMa = { MA: dong layBangCoBan }, thiTruong = trung vi toan thi truong { pe, pb, roe, coTuc, lnYoY }.
// P/E, P/B danh muc = trung binh dieu hoa theo ty trong (= von hoa / loi nhuan cua "1 cong ty gop"), ROE / tang truong / co tuc = trung binh theo ty trong.
import { diemDoanhNghiepMa } from "./phongCachDauTu.js";

const so = (v) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
const p0 = (x) => `${Math.round(x)}`;
const p1 = (x) => x.toFixed(1).replace(".", ",");

// Co tuc tien mat 4 quy / von hoa, chan tren boi loi suat loi nhuan 100/PE (chi tra vuot loi nhuan thuong la khoan 1 lan). vuotLN = dang bi chan.
export function coTucBenVung(c) {
  const ct = so(c?.coTuc);
  const pe = so(c?.pe);
  if (ct == null) return 0;
  return pe > 0 ? Math.min(ct, 100 / pe) : ct;
}
export const coTucVuotLoiNhuan = (c) => so(c?.coTuc) != null && so(c?.pe) > 0 && so(c.coTuc) > 100 / so(c.pe);

// Trung vi toan thi truong tu bang co ban (chi gia tri hop le)
export function trungViThiTruong(hang = []) {
  const tv = (lay, dk = () => true) => {
    const a = hang.map(lay).map(so).filter((x) => x != null && dk(x)).sort((x, y) => x - y);
    return a.length >= 5 ? a[a.length >> 1] : null;
  };
  return { pe: tv((h) => h.pe, (x) => x > 0), pb: tv((h) => h.pb, (x) => x > 0), roe: tv((h) => h.roe), coTuc: tv((h) => h.coTuc), lnYoY: tv((h) => h.lnYoY), soMa: hang.length };
}

export function tomTatCoBan(hang = [], cbTheoMa = {}, { phongCach, thiTruong = null } = {}) {
  const co = hang.filter((h) => h.tyTrong > 0);
  const tong = co.reduce((s, h) => s + h.tyTrong, 0);
  const coCb = co.filter((h) => cbTheoMa[h.ma]);
  const phu = tong > 0 ? coCb.reduce((s, h) => s + h.tyTrong, 0) / tong : 0;
  const tb = (lay) => {
    let s = 0;
    let w = 0;
    for (const h of coCb) {
      const v = so(lay(cbTheoMa[h.ma]));
      if (v == null) continue;
      s += h.tyTrong * v;
      w += h.tyTrong;
    }
    return w > 0 ? { v: s / w, phu: w / tong } : null;
  };
  const dieuHoa = (lay) => {
    // ma lo (P/E am / khong co) tinh loi suat = 0 -> keo P/E danh muc len, dung y nghia "1 cong ty gop"
    let s = 0;
    let w = 0;
    for (const h of coCb) {
      const cb = cbTheoMa[h.ma];
      const v = so(lay(cb));
      if (v == null && !(so(cb.lnTTM) <= 0)) continue;
      s += h.tyTrong * (v > 0 ? 1 / v : 0);
      w += h.tyTrong;
    }
    return w > 0 && s > 0 ? { v: w / s, phu: w / tong } : null;
  };
  const ma = {};
  let sDiem = 0;
  let wDiem = 0;
  const coDo = [];
  for (const h of coCb) {
    const cb = cbTheoMa[h.ma];
    const d = diemDoanhNghiepMa(cb, phongCach);
    ma[h.ma] = { diem: d };
    if (d != null) {
      sDiem += h.tyTrong * d;
      wDiem += h.tyTrong;
    }
    const lnTTM = so(cb.lnTTM);
    const lnYoY = so(cb.lnYoY);
    const taiChinh = cb.loai && cb.loai !== "pi";
    const cacCo = [];
    if (cb.vungZ2 === "nguy cơ") cacCo.push("điểm Z vùng nguy cơ");
    if (lnTTM != null && lnTTM <= 0) cacCo.push("lỗ 4 quý gần nhất");
    else if (lnYoY != null && lnYoY <= -30) cacCo.push(`lợi nhuận 4 quý giảm ${p0(Math.abs(lnYoY))}%`);
    if (!taiChinh && so(cb.f) != null && so(cb.f) <= 3) cacCo.push(`điểm F ${cb.f}/9`);
    if (!taiChinh && so(cb.cfoLN) != null && so(cb.cfoLN) < 0 && !(lnTTM <= 0)) cacCo.push("lãi nhưng dòng tiền kinh doanh âm");
    if (cacCo.length) coDo.push({ ma: h.ma, tyTrong: h.tyTrong / tong, cacCo });
  }
  const tyLeCoDo = coDo.reduce((s, x) => s + x.tyTrong, 0);
  const diem = wDiem > 0 ? sDiem / wDiem : null;
  const kq = {
    phuGiaTri: phu,
    soMaCo: coCb.length,
    thieu: co.filter((h) => !cbTheoMa[h.ma]).map((h) => h.ma),
    pe: dieuHoa((c) => c.pe),
    pb: dieuHoa((c) => c.pb),
    roe: tb((c) => c.roe),
    lnYoY: tb((c) => c.lnYoY),
    dtYoY: tb((c) => c.dtYoY),
    // ty suat co tuc ben vung khong vuot loi suat loi nhuan (1/PE): khoan chi tra 1 lan lon hon ca nam loi nhuan (vd DGC 4 quy chi 2,1 lan LN) khong keo ca danh muc
    coTuc: tb((c) => (c.loai && c.loai !== "pi" ? null : coTucBenVung(c))),
    diem,
    ma,
    coDo: coDo.sort((a, b) => b.tyTrong - a.tyTrong),
    tyLeCoDo,
    quy: [...new Set(coCb.map((h) => cbTheoMa[h.ma].quy).filter(Boolean))].sort().at(-1) ?? null,
    thiTruong,
  };
  kq.nhanXet = nhanXetCoBan(kq);
  return kq;
}

// Nhan xet bang loi { muc 0 nang / 1 chu y / 2 tot, uuTien, tieuDe, noiDung } - cung dang nhanXetRuiRo de gop vao "Dieu quan trong nhat".
export function nhanXetCoBan(t) {
  const o = [];
  if (!t || t.soMaCo === 0) return o;
  const tt = t.thiTruong ?? {};
  if (t.coDo.length) {
    const nang = t.coDo.some((x) => x.cacCo.some((c) => /nguy cơ|lỗ 4 quý/.test(c)));
    o.push({
      muc: nang && t.tyLeCoDo > 0.15 ? 0 : 1,
      uuTien: 2.5,
      tieuDe: "Cờ đỏ doanh nghiệp",
      noiDung: `${p0(t.tyLeCoDo * 100)}% giá trị nằm ở mã có cờ đỏ trong BCTC: ${t.coDo.slice(0, 3).map((x) => `${x.ma} (${x.cacCo.join(", ")})`).join("; ")}${t.coDo.length > 3 ? "…" : ""}.`,
    });
  }
  const phan = [];
  if (t.pe) phan.push(`P/E ${p1(t.pe.v)}${tt.pe ? ` (thị trường ${p1(tt.pe)})` : ""}`);
  if (t.roe) phan.push(`ROE ${p1(t.roe.v)}%${tt.roe != null ? ` (thị trường ${p1(tt.roe)}%)` : ""}`);
  if (t.lnYoY) phan.push(`lợi nhuận 4 quý ${t.lnYoY.v >= 0 ? "+" : ""}${p0(t.lnYoY.v)}%`);
  if (phan.length) {
    const re = t.pe && tt.pe ? t.pe.v < tt.pe * 0.85 : null;
    const tot = t.roe && tt.roe != null ? t.roe.v > tt.roe : null;
    o.push({
      muc: (tot === false && re === false) || (t.lnYoY && t.lnYoY.v < 0) ? 1 : 2,
      uuTien: 6.5,
      tieuDe: "Chất lượng doanh nghiệp",
      noiDung: `Danh mục gộp lại như một công ty có ${phan.join(", ")}${t.quy ? ` — BCTC quý ${t.quy.slice(5, 7) === "03" ? 1 : t.quy.slice(5, 7) === "06" ? 2 : t.quy.slice(5, 7) === "09" ? 3 : 4}/${t.quy.slice(0, 4)}` : ""}.${tot && re ? " Sinh lời cao hơn và định giá rẻ hơn mặt bằng thị trường." : tot ? " Sinh lời cao hơn mặt bằng thị trường." : re ? " Định giá rẻ hơn mặt bằng thị trường." : ""}`,
    });
  }
  if (t.phuGiaTri < 0.6 && t.thieu.length) o.push({ muc: 1, uuTien: 9.5, tieuDe: "Thiếu BCTC", noiDung: `Chỉ ${p0(t.phuGiaTri * 100)}% giá trị có BCTC trong hệ thống (thiếu ${t.thieu.slice(0, 4).join(", ")}${t.thieu.length > 4 ? "…" : ""}) — phần doanh nghiệp chỉ tính trên các mã có dữ liệu.` });
  return o;
}
