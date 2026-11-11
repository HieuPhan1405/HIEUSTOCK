import { Suspense } from "react";
import { layTatCaTinHieu } from "@/lib/tinHieu";
import { TUONG_QUAN } from "@/lib/tuongQuanDuLieu";
import GiaiThichBeta from "@/components/GiaiThichBeta";
import BangBetaMa from "@/components/BangBetaMa";
import BangBetaNganh from "@/components/BangBetaNganh";
import MaTranNganh from "@/components/MaTranNganh";
import MaTranMa from "@/components/MaTranMa";
import ThanhMucTrang from "@/components/ThanhMucTrang";
import { taoMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = taoMeta({
  tieuDe: "Tương quan và Beta",
  moTa: "Beta cao là gì? Bảng beta từng mã và từng ngành so với VN-Index, ma trận tương quan giữa các ngành và giữa các mã để đa dạng hoá danh mục.",
  duongDan: "/tuong-quan",
});

const MUTED = "var(--mo)";

export default async function TrangTuongQuan() {
  // Chi lay vai truong cong khai (ten, von hoa) tu bang tin hieu; KHONG gui nguyen dong tin hieu xuong trinh duyet (khach khong duoc thay gia mua / cat lo / tin hieu). Loi / chua co DB thi van hien beta.
  const nhan = new Map();
  try {
    for (const r of await layTatCaTinHieu()) nhan.set(r.ma, { ten: r.ten_ngan ?? null, vh: Number.isFinite(r.von_hoa_ty) ? r.von_hoa_ty : null });
  } catch {}
  const hang = Object.entries(TUONG_QUAN.ma).map(([ma, [betaVni, betaGiam, tqVni, vol, beta3n, nganh, betaTT]]) => ({
    ma,
    ten: nhan.get(ma)?.ten ?? null,
    nganh,
    vh: nhan.get(ma)?.vh ?? null,
    betaVni,
    betaGiam,
    tqVni,
    vol,
    beta3n,
    betaTT,
  }));
  const danhSach = hang.map((h) => ({ ma: h.ma, ten: h.ten, nganh: h.nganh, vh: h.vh })).sort((a, b) => (b.vh ?? -1) - (a.vh ?? -1));
  const mucLuc = [
    { id: "beta-la-gi", nhan: "Beta cao là gì" },
    { id: "beta-ma", nhan: "Beta từng mã" },
    { id: "beta-nganh", nhan: "Beta ngành" },
    { id: "tq-nganh", nhan: "Tương quan ngành" },
    { id: "tq-ma", nhan: "Tương quan giữa các mã" },
  ];
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8" style={{ color: "var(--chu)" }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
        Tương quan và Beta
      </h1>
      <p className="text-sm mb-3" style={{ color: MUTED }}>
        Mã nào biến động mạnh hơn thị trường, ngành nào và mã nào đi cùng chiều nhau — để biết danh mục thật sự đa dạng hoá hay chỉ đang giữ cùng một cược. Số liệu {TUONG_QUAN.soPhien} phiên gần nhất, đến {TUONG_QUAN.capNhat.split("-").reverse().join("/")}.
      </p>
      <ThanhMucTrang muc={mucLuc} />
      <section id="beta-la-gi" className="scroll-mt-28">
        <GiaiThichBeta />
      </section>
      <section id="beta-ma" className="scroll-mt-28">
        <BangBetaMa hang={hang} capNhat={TUONG_QUAN.capNhat} soPhien={TUONG_QUAN.soPhien} />
      </section>
      <section id="beta-nganh" className="scroll-mt-28">
        <BangBetaNganh />
      </section>
      <section id="tq-nganh" className="scroll-mt-28">
        <MaTranNganh />
      </section>
      <section id="tq-ma" className="scroll-mt-28">
        <Suspense fallback={null}>
          <MaTranMa danhSach={danhSach} />
        </Suspense>
      </section>
      <p className="text-xs" style={{ color: MUTED }}>
        Beta và tương quan là thống kê quá khứ, sẽ đổi theo thời gian; chỉ để tham khảo, không phải khuyến nghị mua bán.
      </p>
    </div>
  );
}
