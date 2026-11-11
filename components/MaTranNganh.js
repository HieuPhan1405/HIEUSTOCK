"use client";

import { useMemo } from "react";
import { TUONG_QUAN } from "@/lib/tuongQuanDuLieu";
import { Khoi, TEXT, MUTED, sans } from "@/components/DanhGiaChung";
import LuoiTuongQuan from "@/components/LuoiTuongQuan";

const ngan = (t) => t.split(" - ")[0];
const so2 = (x) => x.toFixed(2).replace(".", ",");

// MA TRAN TUONG QUAN GIUA CAC NGANH (loi suat ngay trung binh cong cac ma cung nganh, 250 phien): hang / cot xep theo beta so voi VN-Index giam dan.
export default function MaTranNganh() {
  const { thuTu, cap } = useMemo(() => {
    const thuTu = TUONG_QUAN.nganh.map((g, i) => i).sort((a, b) => TUONG_QUAN.nganh[b].beta - TUONG_QUAN.nganh[a].beta);
    const cap = [];
    for (let a = 0; a < TUONG_QUAN.nganh.length; a++) for (let b = a + 1; b < TUONG_QUAN.nganh.length; b++) cap.push({ a: TUONG_QUAN.nganh[a].ten, b: TUONG_QUAN.nganh[b].ten, r: TUONG_QUAN.tranNganh[a][b] });
    cap.sort((p, q) => q.r - p.r);
    return { thuTu, cap };
  }, []);
  const nhan = thuTu.map((i) => TUONG_QUAN.nganh[i].ten);
  const cum = (c) => (
    <li key={c.a + c.b}>
      {c.a} – {c.b}: <b style={{ color: TEXT }}>{so2(c.r)}</b>
    </li>
  );
  return (
    <Khoi tieuDe="Tương quan giữa các ngành" phu="Hai ngành đi cùng chiều mạnh (số lớn, ô tím đậm) thì giữ cả hai không giúp đa dạng hoá. Số trong ô là hệ số tương quan ×100 của lợi suất ngày.">
      <LuoiTuongQuan nhan={nhan} nhanNgan={nhan.map(ngan)} gt={(i, j) => TUONG_QUAN.tranNganh[thuTu[i]][thuTu[j]]} rongO={32} cao={26} />
      <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm" style={sans}>
        <div>
          <p className="text-xs mb-1" style={{ color: MUTED }}>
            Cặp ngành đi cùng chiều nhất
          </p>
          <ul className="space-y-0.5" style={{ color: MUTED }}>
            {cap.slice(0, 5).map(cum)}
          </ul>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: MUTED }}>
            Cặp ngành ít liên quan nhất
          </p>
          <ul className="space-y-0.5" style={{ color: MUTED }}>
            {cap.slice(-5).reverse().map(cum)}
          </ul>
        </div>
      </div>
    </Khoi>
  );
}
