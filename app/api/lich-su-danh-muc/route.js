import { layLichSuGia, MA_HOP_LE } from "@/lib/lichSuGia";
import { canhTheoNgay, PHIEN_NAM } from "@/lib/ruiRoDanhMuc";
import { tinhIchimoku, tinhCanBang } from "@/lib/chiBaoKyThuat";
import { layBangCoBan } from "@/lib/phanTichCoBanDb";
import { trungViThiTruong } from "@/lib/coBanDanhMuc";
import { layTinTucThiTruong } from "@/lib/tinTuc";
import { layTatCaTinHieu } from "@/lib/tinHieu";

// LICH SU GIA CHO DANH GIA DANH MUC: GET /api/lich-su-danh-muc?ma=HPG,VCB,...  (toi da 30 ma; du lieu thi truong cong khai - khong can dang nhap)
// Tra ve gia dong cua ~1 nam da canh theo lich phien VN-Index (null truoc ngay co gia), GTGD binh quan 20 phien (dong/phien), Tenkan / Kijun / duong can bang dai han tinh tu nen
// (dung cho ma ngoai danh sach web quet). Gia DNSE da dieu chinh co tuc; moi ma toi da 8 giay, chay 6 ma cung luc - ma loi nam trong `thieu`.
// Them (deu la du lieu cong khai): coBan = BCTC quy moi nhat tung ma + trung vi toan thi truong; boiCanh = VN-Index so voi cac duong + tin CafeF nhac toi ma trong danh muc + tin vi mo moi nhat.
export const dynamic = "force-dynamic";
const TOI_DA_MA = 30;

const voiHan = (p, ms) => Promise.race([Promise.resolve(p).catch(() => null), new Promise((r) => setTimeout(() => r(null), ms))]);
const boDau = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

// Muc RSS "vi mo" cua CafeF lan ca tin xa hoi (phat nguoi, cu tru...) -> chi lay tieu de co tu khoa kinh te / thi truong (so khop khong dau)
const TU_VI_MO = /lai suat|ty gia|lam phat|\bcpi\b|\bgdp\b|tang truong|xuat khau|nhap khau|tin dung|\bfdi\b|\bfed\b|nhnn|ngan hang nha nuoc|trai phieu|thue|gia vang|gia dau|xang dau|gia dien|chung khoan|vn-index|dau tu cong|giai ngan|bat dong san|ngan sach|tien te|\busd\b|thuong mai|kinh te|ngan hang|doanh nghiep|von ngoai|khoi ngoai|nang hang|thanh khoan/;
const laTinViMo = (t) => TU_VI_MO.test(boDau(t.tieuDe));

// Tin CafeF nhac toi ma: theo MA (tu nguyen ven, viet hoa) hoac ten ngan cong ty (>= 5 ky tu, khong dau)
function locTin(tin, dsMa, tenTheoMa) {
  const ra = [];
  for (const t of tin) {
    const tieuDe = t.tieuDe || "";
    const td = boDau(tieuDe);
    const trung = dsMa.filter((m) => new RegExp(`(^|[^A-Z0-9])${m}([^A-Z0-9]|$)`).test(tieuDe) || (tenTheoMa[m] && tenTheoMa[m].length >= 5 && td.includes(tenTheoMa[m])));
    if (trung.length) ra.push({ tieuDe, link: t.link, ngayISO: t.ngayISO, nhanDanhMuc: t.nhanDanhMuc, ma: trung });
  }
  return ra.slice(0, 8);
}

export async function GET(request) {
  const raw = new URL(request.url).searchParams.get("ma") || "";
  const dsMa = [...new Set(raw.toUpperCase().split(",").map((x) => x.trim()).filter((x) => MA_HOP_LE.test(x)))].slice(0, TOI_DA_MA);
  if (!dsMa.length) return Response.json({ trangThai: "loi", thongBao: "Chưa có mã hợp lệ" }, { status: 400 });
  // nguon phu chay song song voi nen, loi / cham thi bo qua
  const phu = Promise.all([voiHan(layBangCoBan(), 5000), voiHan(layTinTucThiTruong(), 4000), voiHan(layTatCaTinHieu(), 5000)]);
  const vniNen = await voiHan(layLichSuGia("VNINDEX", 300), 10000);
  if (!vniNen?.length) return Response.json({ trangThai: "loi", thongBao: "Không lấy được dữ liệu VN-Index" }, { status: 502 });
  const ngay = vniNen.slice(-(PHIEN_NAM + 1)).map((b) => b.t);
  const vni = canhTheoNgay(ngay, vniNen);
  const ma = {};
  const thieu = [];
  let i = 0;
  const chay = async () => {
    while (i < dsMa.length) {
      const m = dsMa[i++];
      const nen = await voiHan(layLichSuGia(m, 300), 8000);
      if (!nen?.length) {
        thieu.push(m);
        continue;
      }
      const cuoi = nen.length - 1;
      const n20 = nen.slice(-20);
      const ich = tinhIchimoku(nen);
      const cb = tinhCanBang(nen);
      ma[m] = {
        c: canhTheoNgay(ngay, nen),
        gia: nen[cuoi].c,
        doi: cuoi > 0 && nen[cuoi - 1].c > 0 ? (nen[cuoi].c / nen[cuoi - 1].c - 1) * 100 : null,
        gtgd20: n20.reduce((s, b) => s + b.c * b.v, 0) / n20.length * 1000,
        tenkan: ich.tenkan[cuoi],
        kijun: ich.kijun[cuoi],
        gg_bot: cb.bot[cuoi],
        gg_top: cb.top[cuoi],
        ngayCuoi: nen[cuoi].t,
      };
    }
  };
  await Promise.all(Array.from({ length: Math.min(6, dsMa.length) }, chay));
  const [bangCb, tinTuc, tatCa] = await phu;

  const coBan = {};
  for (const h of bangCb?.hang ?? []) if (dsMa.includes(h.ma)) coBan[h.ma] = h;
  const vIch = tinhIchimoku(vniNen);
  const vCb = tinhCanBang(vniNen);
  const k = vniNen.length - 1;
  const tenTheoMa = Object.fromEntries((tatCa ?? []).filter((r) => dsMa.includes(r.ma) && r.ten_ngan).map((r) => [r.ma, boDau(r.ten_ngan)]));
  const tinTatCa = tinTuc?.tatCa ?? [];
  const boiCanh = {
    vni: { gia: vniNen[k].c, ngay: vniNen[k].t, tenkan: vIch.tenkan[k], kijun: vIch.kijun[k], gg_bot: vCb.bot[k], gg_top: vCb.top[k], lai20: k >= 20 ? (vniNen[k].c / vniNen[k - 20].c - 1) * 100 : null },
    tinMa: locTin(tinTatCa, dsMa, tenTheoMa),
    viMo: (tinTuc?.theoDanhMuc?.vi_mo_trong_nuoc ?? []).filter(laTinViMo).slice(0, 4).map((t) => ({ tieuDe: t.tieuDe, link: t.link, ngayISO: t.ngayISO })),
    quocTe: (tinTuc?.theoDanhMuc?.vi_mo_quoc_te ?? []).filter(laTinViMo).slice(0, 3).map((t) => ({ tieuDe: t.tieuDe, link: t.link, ngayISO: t.ngayISO })),
  };
  return Response.json(
    { trangThai: "ok", ngay, vni, ma, thieu, coBan, thiTruong: bangCb?.hang?.length ? { ...trungViThiTruong(bangCb.hang), capNhat: bangCb.capNhat } : null, boiCanh },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
