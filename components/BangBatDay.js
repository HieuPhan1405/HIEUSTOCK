"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { fmt, pct } from "@/components/dungChung";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const MUTED = "#8B8B99";
const TEXT = "#F5F5F7";
const XANH = "#22C55E";
const DO = "#EF4444";
const VANG = "#FBBF24";
const PRIMARY = "#6C5CE7";

// Ket qua bat day - CHI xet dc khi da co du du lieu gia sau 20 phien (con
// qua moi, chua du 20 phien thi la "Dang theo doi", KHONG tinh la that bai.
function ketQuaBatDay(row) {
  if (row.pct_sau_20 == null) return { nhan: "Đang theo dõi", mau: VANG, hang: 0 };
  return row.pct_sau_20 > 0 ? { nhan: "Thành công", mau: XANH, hang: 2 } : { nhan: "Thất bại", mau: DO, hang: 1 };
}

function formatNgay(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("vi-VN");
}

const COT = [
  { khoa: "ma", nhan: "Mã", canPhai: false, lay: (r) => r.ma },
  { khoa: "ngay_tin_hieu", nhan: "Ngày tín hiệu", canPhai: false, lay: (r) => new Date(r.ngay_tin_hieu).getTime() },
  { khoa: "diem", nhan: "Điểm", canPhai: true, lay: (r) => r.diem },
  { khoa: "gia_luc_tin_hieu", nhan: "Giá lúc đó", canPhai: true, lay: (r) => r.gia_luc_tin_hieu },
  { khoa: "pct_sau_5", nhan: "%Sau 5 phiên", canPhai: true, lay: (r) => r.pct_sau_5 },
  { khoa: "pct_sau_10", nhan: "%Sau 10 phiên", canPhai: true, lay: (r) => r.pct_sau_10 },
  { khoa: "pct_sau_20", nhan: "%Sau 20 phiên", canPhai: true, lay: (r) => r.pct_sau_20 },
  { khoa: "chiet_khau", nhan: "Chiết khấu", canPhai: true, lay: (r) => r.chiet_khau },
  { khoa: "ket_qua", nhan: "Kết quả", canPhai: false, lay: (r) => ketQuaBatDay(r).hang },
];

export default function BangBatDay({ duLieu }) {
  const [timKiem, setTimKiem] = useState("");
  const [sapXep, setSapXep] = useState({ khoa: "ngay_tin_hieu", chieu: "desc" });
  const [chiThanhCong, setChiThanhCong] = useState(false);

  const daLoc = useMemo(() => {
    const tuKhoa = timKiem.trim().toUpperCase();
    let ds = tuKhoa ? duLieu.filter((r) => r.ma.includes(tuKhoa)) : duLieu;
    if (chiThanhCong) ds = ds.filter((r) => ketQuaBatDay(r).nhan === "Thành công");
    const cot = COT.find((c) => c.khoa === sapXep.khoa);
    ds = [...ds].sort((a, b) => {
      const va = cot.lay(a);
      const vb = cot.lay(b);
      let so;
      if (typeof va === "string" || typeof vb === "string") {
        so = String(va ?? "").localeCompare(String(vb ?? ""));
      } else {
        so = (va ?? -Infinity) - (vb ?? -Infinity);
      }
      return sapXep.chieu === "asc" ? so : -so;
    });
    return ds;
  }, [duLieu, timKiem, sapXep, chiThanhCong]);

  function doiSapXep(khoa) {
    setSapXep((s) => (s.khoa === khoa ? { khoa, chieu: s.chieu === "desc" ? "asc" : "desc" } : { khoa, chieu: "desc" }));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative max-w-sm flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={MUTED} />
          <input
            value={timKiem}
            onChange={(e) => setTimKiem(e.target.value)}
            placeholder="Tìm mã cổ phiếu..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none"
            style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "'JetBrains Mono', monospace" }}
          />
        </div>
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: MUTED }}>
          <input type="checkbox" checked={chiThanhCong} onChange={(e) => setChiThanhCong(e.target.checked)} />
          Chỉ hiện lệnh bắt thành công
        </label>
      </div>

      <p className="text-xs mb-2" style={{ color: MUTED }}>
        Hiển thị {daLoc.length} / {duLieu.length} lần bắt đáy.
      </p>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <thead>
              <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                {COT.map((c) => (
                  <th
                    key={c.khoa}
                    className={`py-3 px-3 font-normal cursor-pointer select-none whitespace-nowrap ${c.canPhai ? "text-right" : "text-left"}`}
                    onClick={() => doiSapXep(c.khoa)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.nhan}
                      {sapXep.khoa === c.khoa ? (
                        sapXep.chieu === "desc" ? (
                          <ArrowDown size={12} color={PRIMARY} />
                        ) : (
                          <ArrowUp size={12} color={PRIMARY} />
                        )
                      ) : (
                        <ArrowUpDown size={12} opacity={0.4} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daLoc.map((row, i) => {
                const kq = ketQuaBatDay(row);
                return (
                  <tr key={row.id} className={i > 0 ? "border-t" : ""} style={{ borderColor: "#1D1D26" }}>
                    <td className="py-2.5 px-3">
                      <Link href={`/ma/${row.ma}`} className="hover:underline" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                        {row.ma}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3" style={{ color: MUTED }}>
                      {formatNgay(row.ngay_tin_hieu)}
                    </td>
                    <td className="py-2.5 px-3 text-right">{row.diem?.toFixed(2) ?? "—"}</td>
                    <td className="py-2.5 px-3 text-right">{fmt(row.gia_luc_tin_hieu)}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: row.pct_sau_5 >= 0 ? XANH : DO }}>
                      {pct(row.pct_sau_5, 2)}
                    </td>
                    <td className="py-2.5 px-3 text-right" style={{ color: row.pct_sau_10 >= 0 ? XANH : DO }}>
                      {pct(row.pct_sau_10, 2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: row.pct_sau_20 >= 0 ? XANH : DO }}>
                      {pct(row.pct_sau_20, 2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs" style={{ color: MUTED }}>
                      {row.chiet_khau != null ? `${row.chiet_khau.toFixed(1)}%` : "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className="px-2 py-0.5 text-xs font-bold tracking-wide rounded-sm"
                        style={{ background: `${kq.mau}22`, color: kq.mau }}
                      >
                        {kq.nhan}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {daLoc.length === 0 && (
                <tr>
                  <td colSpan={COT.length} className="py-6 text-center text-sm" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                    Chưa có dữ liệu phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
