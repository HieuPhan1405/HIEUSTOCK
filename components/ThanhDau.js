import Link from "next/link";
import Image from "next/image";
import TimMaToanCuc from "@/components/TimMaToanCuc";
import TaiKhoanNut from "@/components/TaiKhoanNut";
import DongHoGiaoDich from "@/components/DongHoGiaoDich";
import ChuongThongBao from "@/components/ChuongThongBao";
import NutGiaoDien from "@/components/NutGiaoDien";

const BG = "color-mix(in srgb, var(--nen-sau) 92%, transparent)";
const VIEN = "var(--vien)";

// Thanh dau trang co dinh o MOI trang: logo (bam vao ve trang gioi thieu) + o tim ma co phieu + dong ho khung vao lenh + chuong thong bao + tai khoan.
// Ban "-toi" cua logo (sang hon) dung tren nen toi. Dien thoai: logo chi con bieu tuong, dong ho / tai khoan chi con bieu tuong (moi nut 36px) de o tim kiem du rong.
export default function ThanhDau() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur" style={{ background: BG, borderBottom: `1px solid ${VIEN}` }}>
      <div className="h-14 px-3 md:px-6 flex items-center gap-2 md:gap-3">
        <Link href="/gioi-thieu" aria-label="CloudStock - về trang giới thiệu" className="flex items-center gap-2 shrink-0 md:mr-3">
          <Image src="/logo-bieu-tuong-toi.png" alt="" width={260} height={176} priority className="chi-toi h-7 md:h-9 w-auto" />
          <Image src="/logo-bieu-tuong.png" alt="" width={260} height={176} priority className="chi-sang h-7 md:h-9 w-auto" />
          <Image src="/logo-chu-toi.png" alt="CloudStock" width={420} height={64} priority className="chi-toi hidden sm:block h-[18px] md:h-5 w-auto" />
          <Image src="/logo-chu.png" alt="CloudStock" width={420} height={64} priority className="chi-sang hidden sm:block h-[18px] md:h-5 w-auto" />
        </Link>
        <TimMaToanCuc className="flex-1 min-w-0 md:max-w-xl" />
        <DongHoGiaoDich className="ml-auto shrink-0" />
        <div className="shrink-0">
          <NutGiaoDien />
        </div>
        <div className="shrink-0">
          <ChuongThongBao />
        </div>
        <div className="shrink-0">
          <TaiKhoanNut thanhDau />
        </div>
      </div>
    </header>
  );
}
