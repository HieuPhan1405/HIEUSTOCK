"use client";

import { ThanhGocNhin, useLuaChonLuu } from "@/components/boLocChung";

// Chuyen qua lai 2 phan cua trang Bat day: "Diem hien tai" (tung ma dang bao nhieu diem, con thieu dieu kien nao) va "Lich su cac lan bat day" (ket qua 5/10/20 phien sau). Hai noi dung do trang server ve san.
export default function BatDayTabs({ hienTai, lichSu }) {
  const [tab, datTab] = useLuaChonLuu("cs_tab_batday", "hienTai", ["hienTai", "lichSu"]);
  return (
    <div>
      <ThanhGocNhin
        ds={[
          { khoa: "hienTai", nhan: "Điểm hiện tại" },
          { khoa: "lichSu", nhan: "Lịch sử các lần bắt đáy" },
        ]}
        dang={tab}
        onChon={datTab}
      />
      <div className="mt-3" hidden={tab !== "hienTai"}>
        {hienTai}
      </div>
      <div className="mt-3" hidden={tab !== "lichSu"}>
        {lichSu}
      </div>
    </div>
  );
}
