"use client";

import { useEffect, useState } from "react";
import BieuDoKyThuat from "@/components/BieuDoKyThuat";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const KHOA_LUU = "cs-da-khung-ds";

// DA KHUNG TREN 1 MAN HINH (17/11/2026, Hieu: "xem da khung tren 1 man hinh", "them khung thang", "them bao nhieu khung deu duoc, chi can 3 hoac 2 khung thoi"):
// cung 1 ma, nhieu bieu do o cac khung thoi gian tu chon (1-8 khung) xep luoi. Moi o la 1 bieu do day du (BieuDoKyThuat) - van doi duoc khung rieng bang thanh khung cua o do.
const KHUNG = [
  { khoa: "MO", nhan: "Tháng" },
  { khoa: "W", nhan: "Tuần" },
  { khoa: "D", nhan: "Ngày" },
  { khoa: "H", nhan: "1 giờ" },
  { khoa: "M30", nhan: "30 phút" },
  { khoa: "M15", nhan: "15 phút" },
  { khoa: "M5", nhan: "5 phút" },
  { khoa: "M1", nhan: "1 phút" },
];
const THU_TU = KHUNG.map((k) => k.khoa);
const MAC_DINH = ["MO", "W", "D", "H"];
const MAU_NHANH = [
  { nhan: "Dài hạn", ds: ["MO", "W", "D"] },
  { nhan: "Giao dịch", ds: ["W", "D", "H"] },
  { nhan: "Trong ngày", ds: ["D", "H", "M15", "M5"] },
];
const sapXep = (ds) => THU_TU.filter((k) => ds.includes(k));

export default function LuoiDaKhung({ ma, tenMa = null, vung = null, ngayMua = null }) {
  const [dsKhung, setDsKhung] = useState(MAC_DINH);
  const [dongBo, setDongBo] = useState(true);
  const [dongBoZoom, setDongBoZoom] = useState(true);
  const [caoMH, setCaoMH] = useState(800);
  const [rong, setRong] = useState(1400);

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KHOA_LUU) || "null");
      if (Array.isArray(v)) {
        const ds = sapXep(v);
        if (ds.length >= 1) setDsKhung(ds);
      }
    } catch {}
    const doi = () => {
      setCaoMH(window.innerHeight);
      setRong(window.innerWidth);
    };
    doi();
    window.addEventListener("resize", doi);
    return () => window.removeEventListener("resize", doi);
  }, []);

  const datDs = (ds) => {
    const m = sapXep(ds);
    if (m.length < 1) return; // luon giu it nhat 1 khung
    setDsKhung(m);
    try {
      localStorage.setItem(KHOA_LUU, JSON.stringify(m));
    } catch {}
  };
  const bam = (k) => datDs(dsKhung.includes(k) ? dsKhung.filter((x) => x !== k) : [...dsKhung, k]);

  const n = dsKhung.length;
  // Chia cot theo so khung va chieu rong man hinh: 1 -> 1 cot; 2-4 -> 2 cot; 3 va 5+ khung o man rat rong -> 3 cot; man nho -> 1 cot.
  const cot = rong < 1024 ? 1 : n === 1 ? 1 : n === 2 ? 2 : n === 3 ? (rong >= 1536 ? 3 : 2) : n <= 4 ? 2 : rong >= 1536 ? 3 : 2;
  const hang = Math.ceil(n / cot);
  const cao = cot === 1 && rong < 1024 ? 300 : Math.max(230, Math.floor((caoMH - 190) / hang) - 100);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <span className="text-xs" style={{ color: MUTED }}>
          Khung hiển thị:
        </span>
        {KHUNG.map((k) => {
          const dang = dsKhung.includes(k.khoa);
          return (
            <button
              key={k.khoa}
              type="button"
              onClick={() => bam(k.khoa)}
              aria-pressed={dang}
              title={dang ? (n === 1 ? "Phải giữ ít nhất 1 khung" : `Bỏ khung ${k.nhan.toLowerCase()}`) : `Thêm khung ${k.nhan.toLowerCase()}`}
              className="h-7 px-2.5 rounded-md text-xs cursor-pointer"
              style={{
                background: dang ? "rgba(108,92,231,0.22)" : NEN_CARD,
                border: `1px solid ${dang ? "var(--tim-chu)" : VIEN}`,
                color: dang ? TEXT : MUTED,
                fontWeight: 600,
              }}
            >
              {k.nhan}
            </button>
          );
        })}
        <span className="text-xs ml-1" style={{ color: MUTED }}>
          Nhanh:
        </span>
        {MAU_NHANH.map((p) => (
          <button
            key={p.nhan}
            type="button"
            onClick={() => datDs(p.ds)}
            title={p.ds.map((k) => KHUNG.find((x) => x.khoa === k).nhan).join(" · ")}
            className="h-7 px-2.5 rounded-md text-xs cursor-pointer"
            style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontWeight: 600 }}
          >
            {p.nhan}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
        <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: TEXT, fontWeight: 600 }} title="Rê chuột ở một ô, con trỏ ở các ô còn lại chạy theo cùng thời điểm">
          <input type="checkbox" checked={dongBo} onChange={(e) => setDongBo(e.target.checked)} style={{ accentColor: "#6C5CE7" }} />
          Đồng bộ con trỏ
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: TEXT, fontWeight: 600 }} title="Kéo hoặc cuộn ở một ô, các ô còn lại đổi theo cùng khoảng thời gian">
          <input type="checkbox" checked={dongBoZoom} onChange={(e) => setDongBoZoom(e.target.checked)} style={{ accentColor: "#6C5CE7" }} />
          Đồng bộ zoom
        </label>
        <span className="text-xs" style={{ color: MUTED }}>
          Mỗi ô vẫn đổi được khung riêng
        </span>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cot}, minmax(0, 1fr))` }}>
        {dsKhung.map((k, i) => (
          <div key={k} className="min-w-0" style={cot > 1 && n % cot === 1 && i === n - 1 ? { gridColumn: "1 / -1" } : undefined}>
            <BieuDoKyThuat tenMa={tenMa} ma={ma} vung={vung} ngayMua={ngayMua} chieuCao={cao} khungMacDinh={k} dongBo={dongBo ? "dk" : null} dongBoZoom={dongBoZoom ? "dkz" : null} veTrai />
          </div>
        ))}
      </div>
    </div>
  );
}
