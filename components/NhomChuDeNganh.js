import BangNhomChuDe from "@/components/BangNhomChuDe";
import { NHOM_CHU_DE, DS_CHU_DE } from "@/lib/nhomChuDe";
import { tinhBangNhom } from "@/lib/bangNhomChuDe";
import { layNenNhom } from "@/lib/nhomChuDeDuLieu";

// Cac bang NHOM CHU DE (lib/nhomChuDe.js) o trang Nganh - server component, dat trong <Suspense>.
export default async function NhomChuDeNganh() {
  const bang = await Promise.all(
    DS_CHU_DE.map(async (k) => {
      const g = NHOM_CHU_DE[k];
      const r = tinhBangNhom(g.ma, await layNenNhom(k, g.ma));
      return { khoa: k, nhan: g.nhan, moTa: g.moTa, ...r };
    })
  );
  return (
    <section className="mb-8" aria-label="Nhóm chủ đề">
      <h2 className="text-lg mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>Nhóm chủ đề</h2>
      <p className="text-xs mb-3" style={{ color: "var(--mo)" }}>
        Các nhóm cổ phiếu theo chủ đề (không phụ thuộc ngành). Bấm tiêu đề cột để sắp xếp; ô tô xanh khi tăng, đỏ khi giảm, vàng khi đứng giá.
      </p>
      <div className="flex flex-wrap gap-4 items-start">
        {bang.map((b) => (
          <BangNhomChuDe key={b.khoa} nhan={b.nhan} moTa={b.moTa} hang={b.hang} trungBinhPct={b.trungBinhPct} ngayPhien={b.ngayPhien} />
        ))}
      </div>
    </section>
  );
}
