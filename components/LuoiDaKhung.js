"use client";

import { useEffect, useState } from "react";
import BieuDoKyThuat from "@/components/BieuDoKyThuat";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const KHOA_LUU = "cs-da-khung-bo-cuc";

// DA KHUNG TREN 1 MAN HINH (17/11/2026, Hieu: "xem da khung tren 1 man hinh" + "them khung thang"): cung 1 ma, nhieu bieu do o cac khung thoi gian khac nhau xep luoi.
// Moi o la 1 bieu do day du (BieuDoKyThuat) - van doi duoc khung rieng bang thanh khung cua o do; doi ma / bo cuc thi dat lai ve khung mac dinh.
const BO_CUC = [
  { khoa: "2", nhan: "2 ô", khung: ["W", "D"], cot: "grid-cols-1 lg:grid-cols-2", hang: 1 },
  { khoa: "4", nhan: "4 ô", khung: ["MO", "W", "D", "H"], cot: "grid-cols-1 lg:grid-cols-2", hang: 2 },
  { khoa: "6", nhan: "6 ô", khung: ["MO", "W", "D", "H", "M15", "M5"], cot: "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3", hang: 2 },
];
const TEN_KHUNG = { MO: "Tháng", W: "Tuần", D: "Ngày", H: "1 giờ", M30: "30 phút", M15: "15 phút", M5: "5 phút", M1: "1 phút" };

export default function LuoiDaKhung({ ma, tenMa = null, vung = null, ngayMua = null }) {
  const [boCuc, setBoCuc] = useState("4");
  const [dongBo, setDongBo] = useState(true);
  const [dongBoZoom, setDongBoZoom] = useState(true);
  const [caoMH, setCaoMH] = useState(800);
  const [rong, setRong] = useState(1400);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KHOA_LUU);
      if (BO_CUC.some((b) => b.khoa === v)) setBoCuc(v);
    } catch {}
    const doi = () => {
      setCaoMH(window.innerHeight);
      setRong(window.innerWidth);
    };
    doi();
    window.addEventListener("resize", doi);
    return () => window.removeEventListener("resize", doi);
  }, []);

  const chon = (k) => {
    setBoCuc(k);
    try {
      localStorage.setItem(KHOA_LUU, k);
    } catch {}
  };

  const bc = BO_CUC.find((b) => b.khoa === boCuc) ?? BO_CUC[1];
  // Man hinh rong (>= 1024px): chia deu chieu cao con lai cho cac hang; man nho: moi o cao co dinh va xep doc.
  const nhieuCot = rong >= 1024;
  const cao = nhieuCot ? Math.max(230, Math.floor((caoMH - 190) / bc.hang) - 100) : 300;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs" style={{ color: MUTED }}>
          Bố cục:
        </span>
        {BO_CUC.map((b) => (
          <button
            key={b.khoa}
            type="button"
            onClick={() => chon(b.khoa)}
            aria-pressed={boCuc === b.khoa}
            title={b.khung.map((k) => TEN_KHUNG[k]).join(" · ")}
            className="h-7 px-2.5 rounded-md text-xs cursor-pointer"
            style={{
              background: boCuc === b.khoa ? "rgba(108,92,231,0.22)" : NEN_CARD,
              border: `1px solid ${boCuc === b.khoa ? "var(--tim-chu)" : VIEN}`,
              color: TEXT,
              fontWeight: 600,
            }}
          >
            {b.nhan}
          </button>
        ))}
        <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer ml-1" style={{ color: TEXT, fontWeight: 600 }} title="Rê chuột ở một ô, con trỏ ở các ô còn lại chạy theo cùng thời điểm">
          <input type="checkbox" checked={dongBo} onChange={(e) => setDongBo(e.target.checked)} style={{ accentColor: "#6C5CE7" }} />
          Đồng bộ con trỏ
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: TEXT, fontWeight: 600 }} title="Kéo hoặc cuộn ở một ô, các ô còn lại đổi theo cùng khoảng thời gian">
          <input type="checkbox" checked={dongBoZoom} onChange={(e) => setDongBoZoom(e.target.checked)} style={{ accentColor: "#6C5CE7" }} />
          Đồng bộ zoom
        </label>
        <span className="text-xs" style={{ color: MUTED }}>
          {bc.khung.map((k) => TEN_KHUNG[k]).join(" · ")} — mỗi ô vẫn đổi được khung riêng
        </span>
      </div>
      <div className={`grid gap-2 ${bc.cot}`}>
        {bc.khung.map((k) => (
          <div key={`${ma}-${bc.khoa}-${k}`} className="min-w-0">
            <BieuDoKyThuat tenMa={tenMa} ma={ma} vung={vung} ngayMua={ngayMua} chieuCao={cao} khungMacDinh={k} dongBo={dongBo ? `dk-${ma}` : null} dongBoZoom={dongBoZoom ? `dkz-${ma}` : null} />
          </div>
        ))}
      </div>
    </div>
  );
}
