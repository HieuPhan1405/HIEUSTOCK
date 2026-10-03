"use client";

import SignalPill from "@/components/SignalPill";
import { fmt, pct } from "@/components/dungChung";
import { soVN } from "@/lib/soVN";

const VIEN = "var(--vien)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const XANH = "var(--xanh)";
const DO = "var(--do)";

function O({ nhan, children }) {
  return (
    <div
      className="rounded-lg border px-3 py-2 text-center flex flex-col items-center justify-between min-w-[78px]"
      style={{ borderColor: VIEN, background: "color-mix(in srgb, var(--card) 90%, transparent)", backdropFilter: "blur(6px)" }}
    >
      <p className="text-[10px] mb-1.5 whitespace-nowrap" style={{ color: MUTED, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
        {nhan}
      </p>
      <div className="text-sm font-bold whitespace-nowrap leading-5" style={{ fontFamily: "'JetBrains Mono', monospace", color: TEXT }}>
        {children}
      </div>
    </div>
  );
}

const KHONG_CO = <span style={{ color: MUTED }}>--</span>;

// Bang 5 o gon tren goc bieu do (de chup man hinh): Diem · Trang thai · Gia mua · So phien · Lai/lo. Lay dung so cua cac trang khac (dong tin hieu da chuan hoa o lib/tinHieu.js):
// gia mua = gia web ghi nhan luc ma lan dau hien MUA, lai/lo tinh tu gia do. Ma khong giu lenh (BAN / TRUNG LAP) thi 3 o vi the hien "--".
// tt: { diem, tin, banTheoDoiTu, webGiu, muaTheoDoiTu, daChotMua, giaMua, soPhien, laiLo }.
export default function BangThongTinBieuDo({ tt }) {
  if (!tt) return null;
  const dangGiu = tt.tin === "MUA" || tt.tin === "NAM GIU";
  const coGiaMua = dangGiu && tt.giaMua != null && Number.isFinite(Number(tt.giaMua)) && Number(tt.giaMua) > 0;
  const coLai = dangGiu && tt.laiLo != null && Number.isFinite(Number(tt.laiLo));
  const coPhien = dangGiu && tt.soPhien != null && Number.isFinite(Number(tt.soPhien));
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Thông tin tín hiệu của mã">
      <O nhan="Điểm">
        {tt.diem != null && Number.isFinite(Number(tt.diem)) ? <span style={{ color: tt.diem >= 0 ? XANH : DO }}>{soVN(tt.diem, 2, true)}</span> : KHONG_CO}
      </O>
      <O nhan="Trạng thái">
        <SignalPill
          tin={tt.tin}
          banTheoDoiTu={tt.banTheoDoiTu ?? null}
          webGiu={tt.webGiu === true}
          muaTheoDoiTu={tt.muaTheoDoiTu ?? null}
          daChotMua={tt.daChotMua === true}
        />
      </O>
      <O nhan="Giá mua">
        {coGiaMua ? fmt(tt.giaMua) : KHONG_CO}
      </O>
      <O nhan="Số phiên">
        {coPhien ? (tt.soPhien === 0 ? "Hôm nay" : `${tt.soPhien} phiên`) : KHONG_CO}
      </O>
      <O nhan="Lãi / lỗ">
        {coLai ? <span style={{ color: tt.laiLo >= 0 ? XANH : DO }}>{pct(tt.laiLo, 2)}</span> : KHONG_CO}
      </O>
    </div>
  );
}
