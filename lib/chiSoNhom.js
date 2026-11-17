// CHI SO NHOM CO PHIEU + NGANH cho bieu do ky thuat (17/11/2026, Hieu: "chi so nhom nganh, nhom co phieu kieu VNMIDCAP, Dau khi de phan tich nen").
//   1) Chi so CHINH THUC cua HOSE / HNX (nguon VNDirect dchart - DNSE chi co VNINDEX, VN30, VN100, HNX, HNX30, UPCOM): nhom von hoa + 10 nganh HOSE.
//   2) Chi so NGANH CLOUDSTOCK (tu tinh): TINH NHU VN30 - trong so = von hoa tu do cua phien truoc, tran 15%/ma (truoc 17/11 chieu la trung binh deu) - cac ma trong nganh (engine/danh-sach/nganh.js - cung cach chia nganh cua web),
//      noi chuoi tu 100. Nen: mo / cao / thap / dong = chi so hom truoc x trung binh (gia / gia dong cua hom truoc) cua cac ma; khoi luong = tong khoi luong cac ma.
// Dung chung server (lib/lichSuGia.js) + client (o chon chi so tren /bieu-do) - KHONG import gi cua server.
import { NGANH } from "../engine/danh-sach/nganh.js";
import { NGANH_NHAN } from "./nganh.js";

// ma -> [ten ngan, mo ta]
export const CHI_SO_CHINH_THUC = {
  VN30: ["VN30", "30 cổ phiếu vốn hoá lớn, thanh khoản cao nhất HOSE"],
  VN100: ["VN100", "100 cổ phiếu lớn nhất HOSE (VN30 + Midcap)"],
  VNMID: ["VN Midcap", "70 cổ phiếu vốn hoá vừa HOSE"],
  VNSML: ["VN Smallcap", "Cổ phiếu vốn hoá nhỏ HOSE"],
  VNX50: ["VNX50", "50 cổ phiếu lớn nhất 2 sàn HOSE + HNX"],
  VNALL: ["VNAllshare", "Toàn bộ cổ phiếu HOSE đủ điều kiện"],
  VNDIAMOND: ["VN Diamond", "Cổ phiếu kín room ngoại"],
  VNFINLEAD: ["VN Fin Lead", "Ngân hàng, chứng khoán, bảo hiểm dẫn dắt"],
  VNFINSELECT: ["VN Fin Select", "Tài chính chọn lọc"],
  VNSI: ["VN Sustainability", "Phát triển bền vững"],
  HNX30: ["HNX30", "30 cổ phiếu lớn nhất HNX"],
  VNENE: ["VN Năng lượng", "Ngành năng lượng HOSE (dầu khí: PLX, PVD, PVT…)"],
  VNFIN: ["VN Tài chính", "Ngân hàng, chứng khoán, bảo hiểm HOSE"],
  VNREAL: ["VN Bất động sản", "Ngành bất động sản HOSE"],
  VNMAT: ["VN Nguyên vật liệu", "Thép, hoá chất, vật liệu HOSE"],
  VNIND: ["VN Công nghiệp", "Xây dựng, vận tải, cơ khí HOSE"],
  VNIT: ["VN Công nghệ", "Công nghệ thông tin HOSE"],
  VNCONS: ["VN Tiêu dùng thiết yếu", "Thực phẩm, đồ uống, nông nghiệp HOSE"],
  VNCOND: ["VN Tiêu dùng không thiết yếu", "Bán lẻ, ô tô, dệt may HOSE"],
  VNHEAL: ["VN Y tế", "Y tế, dược phẩm HOSE"],
  VNUTI: ["VN Tiện ích", "Điện, nước, khí đốt HOSE (có GAS, POW)"],
};
// Chi so DNSE co san (giu nguon DNSE vi co ca nen dang chay trong phien); con lai lay VNDirect.
export const CHI_SO_DNSE_CO = new Set(["VNINDEX", "VN30", "VN100", "HNXINDEX", "HNX30", "UPCOMINDEX"]);

// Chi so nganh tu tinh: ma "NG" + ten viet tat (<= 12 ky tu de qua MA_HOP_LE).
const MA_NGANH = {
  "Ngan hang": "NGNGANHANG",
  "Chung khoan": "NGCHUNGKHOAN",
  "Bao hiem": "NGBAOHIEM",
  "Bat dong san": "NGBDS",
  "BDS Khu cong nghiep": "NGBDSKCN",
  "Xay dung - Ha tang": "NGXAYDUNG",
  "Vat lieu xay dung": "NGVLXD",
  Thep: "NGTHEP",
  "Khoang san": "NGKHOANGSAN",
  "Dau khi": "NGDAUKHI",
  "Dien - Nuoc": "NGDIENNUOC",
  "Hoa chat - Cao su": "NGHOACHAT",
  "Thuc pham - Do uong": "NGTHUCPHAM",
  "Thuy san": "NGTHUYSAN",
  "Nong nghiep - Chan nuoi": "NGNONGNGHIEP",
  "Ban le - O to": "NGBANLE",
  "Det may - Go": "NGDETMAY",
  "Logistics - Van tai": "NGLOGISTICS",
  "Cong nghe - Vien thong": "NGCONGNGHE",
  "Y te - Duoc": "NGYTE",
  "Thiet bi dien - Co khi": "NGCOKHI",
  "Du lich - Giai tri - Truyen thong": "NGDULICH",
};
// ma -> { ten (co dau), ds: [cac ma] }
export const CHI_SO_NGANH = Object.fromEntries(
  [...NGANH.entries()].filter(([k]) => MA_NGANH[k]).map(([k, ds]) => [MA_NGANH[k], { ten: NGANH_NHAN[k] || k, ds: [...ds] }])
);

// BDS tach 2 (Hieu 17/11/2026): Vingroup (VIC, VHM, VRE - di cung nhau, tuong quan 0,64) va BDS nha o con lai; ma NGBDS giu nguyen la ca nganh.
const VINGROUP = ["VIC", "VHM", "VRE"];
{
  const bds = CHI_SO_NGANH.NGBDS;
  if (bds) {
    CHI_SO_NGANH.NGBDSVIN = { ten: "BĐS Vingroup", ds: VINGROUP.filter((m) => bds.ds.includes(m)) };
    CHI_SO_NGANH.NGBDSNHAO = { ten: "BĐS nhà ở (không Vingroup)", ds: bds.ds.filter((m) => !VINGROUP.includes(m)) };
  }
}

export const laChiSoNganh = (ma) => Object.prototype.hasOwnProperty.call(CHI_SO_NGANH, ma);

// Ten hien thi cho bieu do / tieu de trang: { ten, ngan, san } giong tenCongTy(); null neu khong phai chi so nhom.
export function tenChiSoNhom(ma) {
  const c = CHI_SO_CHINH_THUC[ma];
  if (c) return { ten: `Chỉ số ${c[0]} – ${c[1]}`, ngan: c[0], san: ma === "HNX30" ? "HNX" : "HOSE" };
  const n = CHI_SO_NGANH[ma];
  if (n) return { ten: `Chỉ số ngành ${n.ten} (CloudStock, ${n.ds.length} mã, tính theo vốn hóa tự do như VN30)`, ngan: `Ngành ${n.ten}`, san: "CloudStock" };
  return null;
}

// Danh sach cho o chon chi so: [{ nhom, muc: [{ ma, nhan, moTa }] }]
export const DS_CHON_CHI_SO = [
  { nhom: "Chỉ số thị trường", muc: [["VNINDEX", "VN-Index"], ["HNXINDEX", "HNX-Index"], ["UPCOMINDEX", "UPCoM"]].map(([ma, nhan]) => ({ ma, nhan, moTa: "" })) },
  { nhom: "Nhóm cổ phiếu", muc: ["VN30", "VN100", "VNMID", "VNSML", "VNX50", "VNALL", "HNX30", "VNDIAMOND", "VNFINLEAD", "VNFINSELECT", "VNSI"].map((ma) => ({ ma, nhan: CHI_SO_CHINH_THUC[ma][0], moTa: CHI_SO_CHINH_THUC[ma][1] })) },
  { nhom: "Ngành CloudStock (tự tính)", muc: Object.entries(CHI_SO_NGANH).map(([ma, n]) => ({ ma, nhan: n.ten, moTa: `${n.ds.length} mã: ${n.ds.slice(0, 6).join(", ")}${n.ds.length > 6 ? "…" : ""}` })) },
  { nhom: "Ngành HOSE (chính thức)", muc: ["VNENE", "VNFIN", "VNREAL", "VNMAT", "VNIND", "VNIT", "VNCONS", "VNCOND", "VNHEAL", "VNUTI"].map((ma) => ({ ma, nhan: CHI_SO_CHINH_THUC[ma][0], moTa: CHI_SO_CHINH_THUC[ma][1] })) },
];

// Ghep chuoi nen cua cac ma thanh 1 chi so, noi chuoi tu 100 - TINH NHU VN-INDEX / VN30 (Hieu 17/11/2026): trong so tung ma = von hoa (tu do chuyen nhuong) cua PHIEN TRUOC
// = so co phieu tinh * gia dong cua hom truoc; loi suat chi so = tong (trong so x loi suat tung ma). Tran ty trong `tran` (vd 0,15) / ma, phan vuot chia lai cho ma con lai (nhu quy tac tran cua chi so HOSE).
// dsNen: mang (moi ma) cac nen { t, o, h, l, c, v } tang dan theo t (t la chuoi ngay hoac so giay). trongSo[i]: so co phieu tinh cua ma i (bo trong = trung binh deu).
// Phien chi tinh khi >= 1/3 so ma co nen va co gia dong cua truoc.
function chuanHoaTrongSo(a, tran) {
  const s = a.reduce((p, x) => p + x.w, 0);
  const w = a.map((x) => x.w / s);
  if (!tran || a.length * tran <= 1) return w;
  const kep = new Array(a.length).fill(false);
  for (let lan = 0; lan < 12; lan++) {
    let vuot = false;
    for (let i = 0; i < w.length; i++) if (!kep[i] && w[i] > tran + 1e-12) { kep[i] = true; vuot = true; }
    if (!vuot) break;
    const conLai = 1 - kep.reduce((p, k) => p + (k ? tran : 0), 0);
    const tongCon = w.reduce((p, x, i) => p + (kep[i] ? 0 : a[i].w), 0);
    for (let i = 0; i < w.length; i++) w[i] = kep[i] ? tran : (a[i].w / tongCon) * conLai;
  }
  return w;
}
export function ghepChiSo(dsNen, trongSo = null, tran = 0) {
  const theoT = new Map(); // t -> [{ o, h, l, c, v, w }]
  let soMaCo = 0;
  dsNen.forEach((nen, idx) => {
    if (!Array.isArray(nen) || nen.length < 2) return;
    soMaCo++;
    const sl = trongSo ? trongSo[idx] : 1;
    for (let i = 1; i < nen.length; i++) {
      const b = nen[i], pc = nen[i - 1].c;
      if (!(pc > 0 && b.c > 0 && b.h >= b.l)) continue;
      // bo phien nhay gia bat thuong (du lieu chua dieu chinh / loi nguon) de 1 ma khong keo ca nganh
      const r = b.c / pc;
      if (r > 1.5 || r < 0.5) continue;
      if (!theoT.has(b.t)) theoT.set(b.t, []);
      theoT.get(b.t).push({ o: (b.o > 0 ? b.o : pc) / pc, h: b.h / pc, l: b.l / pc, c: r, v: b.v || 0, w: trongSo ? sl * pc : 1 });
    }
  });
  const nguong = Math.max(1, Math.ceil(soMaCo / 3));
  const ts = [...theoT.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const kq = [];
  let I = 100;
  const lam = (x) => Math.round(x * 100) / 100;
  for (const t of ts) {
    const a = theoT.get(t);
    if (a.length < nguong) continue;
    const w = chuanHoaTrongSo(a, tran);
    const tb = (k) => a.reduce((s, x, i) => s + w[i] * x[k], 0);
    const o = I * tb("o"), h = I * tb("h"), l = I * tb("l"), c = I * tb("c");
    kq.push({ t, o: lam(o), h: lam(Math.max(h, o, c)), l: lam(Math.min(l, o, c)), c: lam(c), v: a.reduce((s, x) => s + x.v, 0) });
    I = c;
  }
  return kq;
}
export const ghepChiSoDeu = (dsNen) => ghepChiSo(dsNen);
// Tran ty trong 1 ma trong chi so nganh tu tinh
export const TRAN_TRONG_SO = 0.15;
