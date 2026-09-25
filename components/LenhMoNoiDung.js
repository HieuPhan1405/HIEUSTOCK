"use client";

import { useMemo, useState } from "react";
import TraCuuMa from "@/components/TraCuuMa";
import BangLenhMo, { LOC_LENH_MO_TRONG, locLenhMo } from "@/components/BangLenhMo";
import HieuSuatVsVnindex from "@/components/HieuSuatVsVnindex";
import HieuQuaDauTu from "@/components/HieuQuaDauTu";
import BangDiemMuaMoi from "@/components/BangDiemMuaMoi";
import { pct, chamTPCaoNhat, pctChotLoi } from "@/components/dungChung";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const MUTED = "#8B8B99";
const DO = "#EF4444";
const XANH = "#22C55E";

function The({ so, mau, nhan, phu, mauPhu }) {
  return (
    <div className="rounded-2xl border p-4 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: mau }}>
        {so}
      </p>
      <p className="text-xs mt-1" style={{ color: MUTED }}>
        {nhan}
      </p>
      {phu && (
        <p className="text-[11px]" style={{ color: mauPhu ?? MUTED }}>
          {phu}
        </p>
      )}
    </div>
  );
}

// Phan than trang So lenh dang mo: the thong ke + bieu do so sanh VNINDEX + bang. Bo loc nam O DAY (khong o trong bang) de
// bam loc (vd "chi ma dat chuan") thi CA thong ke lan bieu do doi theo, khong chi bang.
export default function LenhMoNoiDung({ dangMo, vnindex, daChonMuaThem }) {
  const [loc, datLoc] = useState(LOC_LENH_MO_TRONG);
  const daLoc = useMemo(() => locLenhMo(dangMo, loc), [dangMo, loc]);

  // Thong ke nhanh hieu qua cac lenh DANG HIEN (sau loc) - khong tinh lenh da dong, vi trang nay chi hien vi the mo.
  const tk = useMemo(() => {
    const soLenh = daLoc.length;
    const soLai = daLoc.filter((r) => r.lai_lo_pct > 0).length;
    const soLo = daLoc.filter((r) => r.lai_lo_pct < 0).length;
    // Ty le chot loi = % SO LENH da cham it nhat 1 muc TP tren tong so lenh dang hien (giong Ty le lai/Ty le lo, khong phai lai TB).
    const daChotLoi = daLoc.filter((r) => chamTPCaoNhat(r) != null);
    return {
      soLenh,
      soLai,
      soLo,
      tyLeLai: soLenh ? (soLai / soLenh) * 100 : 0,
      tyLeLo: soLenh ? (soLo / soLenh) * 100 : 0,
      laiLoTB: soLenh ? daLoc.reduce((tong, r) => tong + (r.lai_lo_pct ?? 0), 0) / soLenh : 0,
      soDaChotLoi: daChotLoi.length,
      tyLeChotLoi: soLenh ? (daChotLoi.length / soLenh) * 100 : 0,
      chotLoiTB: daChotLoi.length ? daChotLoi.reduce((tong, r) => tong + (pctChotLoi(r) ?? 0), 0) / daChotLoi.length : 0,
    };
  }, [daLoc]);

  const dangLoc = daLoc.length !== dangMo.length;

  return (
    <>
      {dangLoc && (
        <p className="text-xs mb-2" style={{ color: MUTED }}>
          Thống kê và biểu đồ bên dưới đang tính trên <b>{daLoc.length}</b> / {dangMo.length} lệnh khớp bộ lọc.
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <The so={tk.soLenh} nhan="Lệnh đang mở" phu={dangLoc ? `trên tổng ${dangMo.length}` : undefined} />
        <The so={`${tk.tyLeLai.toFixed(0)}%`} mau={XANH} nhan={`Tỷ lệ lãi (${tk.soLai} lệnh)`} />
        <The so={`${tk.tyLeLo.toFixed(0)}%`} mau={DO} nhan={`Tỷ lệ lỗ (${tk.soLo} lệnh)`} />
        <The so={pct(tk.laiLoTB, 2)} mau={tk.laiLoTB >= 0 ? XANH : DO} nhan="Lãi/lỗ trung bình" />
        <The
          so={`${tk.tyLeChotLoi.toFixed(0)}%`}
          mau="#FBBF24"
          nhan={`Tỷ lệ chốt lời (${tk.soDaChotLoi} lệnh)`}
          phu={tk.soDaChotLoi > 0 ? `TB ${pct(tk.chotLoiTB, 2)}/lệnh` : undefined}
          mauPhu={tk.chotLoiTB >= 0 ? XANH : DO}
        />
      </div>

      <HieuQuaDauTu />

      <HieuSuatVsVnindex ds={daLoc} vnindex={vnindex} />

      <BangDiemMuaMoi dangMo={dangMo} daChonBanDau={daChonMuaThem} />

      <div className="mb-8 max-w-md rounded-2xl border p-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: MUTED }}>
          Tra cứu mã khác
        </p>
        <TraCuuMa />
      </div>

      <BangLenhMo duLieu={dangMo} loc={loc} datLoc={datLoc} />
    </>
  );
}
