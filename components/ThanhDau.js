import Link from "next/link";
import Image from "next/image";
import TimMaToanCuc from "@/components/TimMaToanCuc";
import TaiKhoanNut from "@/components/TaiKhoanNut";
import DongHoGiaoDich from "@/components/DongHoGiaoDich";

const BG = "rgba(8,8,11,0.92)";
const VIEN = "#26262F";

// Thanh dau trang co dinh o MOI trang: logo (bam vao ve trang chinh) + o tim ma co phieu + tai khoan.
// Ban "-toi" cua logo (sang hon) dung tren nen toi; tren dien thoai chi hien bieu tuong de nhuong cho o tim kiem.
export default function ThanhDau() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur" style={{ background: BG, borderBottom: `1px solid ${VIEN}` }}>
      <div className="h-14 px-3 md:px-6 flex items-center gap-3 md:gap-6">
        <Link href="/gioi-thieu" aria-label="CloudStock - về trang giới thiệu" className="flex items-center gap-2 shrink-0">
          <Image src="/logo-bieu-tuong-toi.png" alt="" width={260} height={176} priority className="h-8 md:h-9 w-auto" />
          <Image src="/logo-chu-toi.png" alt="CloudStock" width={420} height={64} priority className="hidden sm:block h-[18px] md:h-5 w-auto" />
        </Link>
        <TimMaToanCuc className="flex-1 min-w-0 md:max-w-xl" />
        <DongHoGiaoDich className="ml-auto shrink-0" />
        <div className="shrink-0">
          <TaiKhoanNut compact />
        </div>
      </div>
    </header>
  );
}
