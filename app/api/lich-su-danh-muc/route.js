import { layLichSuGia, MA_HOP_LE } from "@/lib/lichSuGia";
import { canhTheoNgay, PHIEN_NAM } from "@/lib/ruiRoDanhMuc";
import { tinhIchimoku, tinhCanBang } from "@/lib/chiBaoKyThuat";

// LICH SU GIA CHO DANH GIA DANH MUC: GET /api/lich-su-danh-muc?ma=HPG,VCB,...  (toi da 30 ma; du lieu thi truong cong khai - khong can dang nhap)
// Tra ve gia dong cua ~1 nam da canh theo lich phien VN-Index (null truoc ngay co gia), GTGD binh quan 20 phien (dong/phien), va Kijun / duong can bang dai han tinh tu nen
// (dung cho ma ngoai danh sach web quet). Gia DNSE da dieu chinh co tuc; moi ma toi da 8 giay, chay 6 ma cung luc - ma loi nam trong `thieu`.
export const dynamic = "force-dynamic";
const TOI_DA_MA = 30;

export async function GET(request) {
  const raw = new URL(request.url).searchParams.get("ma") || "";
  const dsMa = [...new Set(raw.toUpperCase().split(",").map((x) => x.trim()).filter((x) => MA_HOP_LE.test(x)))].slice(0, TOI_DA_MA);
  if (!dsMa.length) return Response.json({ trangThai: "loi", thongBao: "Chưa có mã hợp lệ" }, { status: 400 });
  const voiHan = (p, ms) => Promise.race([p.catch(() => null), new Promise((r) => setTimeout(() => r(null), ms))]);
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
        kijun: ich.kijun[cuoi],
        gg_bot: cb.bot[cuoi],
        gg_top: cb.top[cuoi],
        ngayCuoi: nen[cuoi].t,
      };
    }
  };
  await Promise.all(Array.from({ length: Math.min(6, dsMa.length) }, chay));
  return Response.json({ trangThai: "ok", ngay, vni, ma, thieu }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
