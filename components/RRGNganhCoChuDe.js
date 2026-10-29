import RRGNganh from "@/components/RRGNganh";
import { NHOM_CHU_DE, DS_CHU_DE } from "@/lib/nhomChuDe";
import { chiSoNhomTheoNgay } from "@/lib/bangNhomChuDe";
import { layNenNhom } from "@/lib/nhomChuDeDuLieu";

// RRG ngành + các NHÓM CHỦ ĐỀ như thêm một chấm (chỉ số nhóm = trung bình đều lợi suất ngày của các mã, thẳng theo mảng ngày của RRG). Server component, đặt trong <Suspense>.
export default async function RRGNganhCoChuDe({ rrg }) {
  const ngay = rrg?.chuoi?.ngay ?? [];
  const chuDe = [];
  for (const k of DS_CHU_DE) {
    const g = NHOM_CHU_DE[k];
    const chiSo = chiSoNhomTheoNgay(ngay, g.ma, await layNenNhom(k, g.ma));
    if (chiSo) chuDe.push({ id: `cd:${k}`, nhan: g.nhan, soMa: g.ma.length, chiSo });
  }
  return <RRGNganh du={{ rrg, chuDe }} />;
}
