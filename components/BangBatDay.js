"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { fmt, pct, nhe } from "@/components/dungChung";
import { soVN } from "@/lib/soVN";
import { ngayBatDauKhoang, danhSachNganh } from "@/lib/locDiemB";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const TEXT = "var(--chu)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
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

// Khoang thoi gian loc nhanh theo SO PHIEN co su kien gan nhat (null = khong gioi han; "nam" = tu dau 2026).
const KHOANG = [
  { k: "tat_ca", nhan: "Tất cả", phien: null },
  { k: "nam", nhan: "Từ đầu 2026", nam: "2026-01-01" },
  { k: "30", nhan: "30 phiên", phien: 30 },
  { k: "10", nhan: "10 phiên", phien: 10 },
  { k: "5", nhan: "5 phiên", phien: 5 },
  { k: "1", nhan: "Phiên mới nhất", phien: 1 },
];

const COT = [
  { khoa: "ma", nhan: "Mã", canPhai: false, lay: (r) => r.ma },
  { khoa: "ngay_tin_hieu", nhan: "Ngày tín hiệu", canPhai: false, lay: (r) => new Date(r.ngay_tin_hieu).getTime() },
  { khoa: "diem", nhan: "Điểm", canPhai: true, lay: (r) => r.diem },
  { khoa: "gia_luc_tin_hieu", nhan: "Giá lúc đó", canPhai: true, lay: (r) => r.gia_luc_tin_hieu },
  { khoa: "gia_hien_tai", nhan: "Giá hiện tại", canPhai: true, lay: (r) => r.gia_hien_tai },
  { khoa: "pct_sau_5", nhan: "%Sau 5 phiên", canPhai: true, lay: (r) => r.pct_sau_5 },
  { khoa: "pct_sau_10", nhan: "%Sau 10 phiên", canPhai: true, lay: (r) => r.pct_sau_10 },
  { khoa: "pct_sau_20", nhan: "%Sau 20 phiên", canPhai: true, lay: (r) => r.pct_sau_20 },
  { khoa: "chiet_khau", nhan: "Chiết khấu", canPhai: true, lay: (r) => r.chiet_khau },
  { khoa: "kl_day", nhan: "KL đáy", canPhai: true, lay: (r) => r.kl_day },
  { khoa: "ngay_diem_b", nhan: "Điểm B sau", canPhai: false, lay: (r) => r.ngay_diem_b ?? "" },
  { khoa: "ket_qua", nhan: "Kết quả", canPhai: false, lay: (r) => ketQuaBatDay(r).hang },
];

export default function BangBatDay({ duLieu }) {
  const [timKiem, setTimKiem] = useState("");
  const [sapXep, setSapXep] = useState({ khoa: "ngay_tin_hieu", chieu: "desc" });
  const [chiThanhCong, setChiThanhCong] = useState(false);
  const [chiVn100, setChiVn100] = useState(false);
  const [chiCoKL, setChiCoKL] = useState(false);
  const [khoang, setKhoang] = useState("tat_ca");
  const [nganh, setNganh] = useState("");
  const [chiDiemCao, setChiDiemCao] = useState(false);
  const [chiCoDiemB, setChiCoDiemB] = useState(false);
  const nganhs = useMemo(() => danhSachNganh(duLieu), [duLieu]);

  const daLoc = useMemo(() => {
    const tuKhoa = timKiem.trim().toUpperCase();
    let ds = tuKhoa ? duLieu.filter((r) => r.ma.includes(tuKhoa)) : duLieu;
    if (chiThanhCong) ds = ds.filter((r) => ketQuaBatDay(r).nhan === "Thành công");
    if (chiVn100) ds = ds.filter((r) => r.vn100 !== false);
    if (chiCoKL) ds = ds.filter((r) => r.kl_day != null && r.kl_day >= 2);
    if (chiDiemCao) ds = ds.filter((r) => r.diem >= 6);
    if (chiCoDiemB) ds = ds.filter((r) => r.ngay_diem_b != null);
    if (nganh) ds = ds.filter((r) => r.nganh === nganh);
    const kh = KHOANG.find((x) => x.k === khoang);
    const tu = kh?.nam ?? (kh?.phien ? ngayBatDauKhoang(duLieu.map((r) => ({ ngay: r.ngay_iso })), kh.phien) : null);
    if (tu) ds = ds.filter((r) => (r.ngay_iso ?? "") >= tu);
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
  }, [duLieu, timKiem, sapXep, chiThanhCong, chiVn100, chiCoKL, chiDiemCao, chiCoDiemB, nganh, khoang]);

  function doiSapXep(khoa) {
    setSapXep((s) => (s.khoa === khoa ? { khoa, chieu: s.chieu === "desc" ? "asc" : "desc" } : { khoa, chieu: "desc" }));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {KHOANG.map((x) => (
          <button key={x.k} onClick={() => setKhoang(x.k)} className="px-3 py-1.5 text-xs rounded-full border" style={{ borderColor: khoang === x.k ? PRIMARY : VIEN, background: khoang === x.k ? nhe(PRIMARY, 13) : "transparent", color: khoang === x.k ? PRIMARY : MUTED, fontFamily: "var(--font-chu)" }}>
            {x.nhan}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative max-w-sm flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={MUTED} />
          <input
            value={timKiem}
            onChange={(e) => setTimKiem(e.target.value)}
            placeholder="Tìm mã cổ phiếu..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none"
            style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT, fontFamily: "var(--font-chu)" }}
          />
        </div>
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: MUTED }}>
          <input type="checkbox" checked={chiThanhCong} onChange={(e) => setChiThanhCong(e.target.checked)} />
          Chỉ hiện lệnh bắt thành công
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: MUTED }} title="Mã ngoài VN100 có kết quả lịch sử kém hơn (từ 2022.5: 20 phiên −0,06% so với VN100 +1,86%)">
          <input type="checkbox" checked={chiVn100} onChange={(e) => setChiVn100(e.target.checked)} />
          Chỉ VN100
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: MUTED }} title="KL lớn nhất 5 phiên quanh tín hiệu ≥ 2× KL trung bình 20 phiên trước đó: bán tháo có khối lượng. Lịch sử tốt hơn trong 2022 và 2025 nhưng không ổn định mọi năm.">
          <input type="checkbox" checked={chiCoKL} onChange={(e) => setChiCoKL(e.target.checked)} />
          Chỉ bán tháo có KL (≥ 2×)
        </label>
        <select value={nganh} onChange={(e) => setNganh(e.target.value)} className="text-xs rounded-lg px-2 py-2 outline-none" style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT }}>
          <option value="">Mọi ngành</option>
          {nganhs.map((x) => (
            <option key={x} value={x}>{x}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: MUTED }} title="Điểm checklist từ 6 trở lên (ngưỡng 6 cho kết quả tốt hơn ngưỡng 5 từ 2022.5 nhưng không ổn định mọi năm)">
          <input type="checkbox" checked={chiDiemCao} onChange={(e) => setChiDiemCao(e.target.checked)} />
          Điểm ≥ 6
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: MUTED }} title="Mã đã có điểm mua phục hồi (điểm B) trong 30 ngày sau tín hiệu checklist: cảnh báo đáy + xác nhận quay đầu. Dữ liệu điểm B chỉ có từ đầu 2026.">
          <input type="checkbox" checked={chiCoDiemB} onChange={(e) => setChiCoDiemB(e.target.checked)} />
          Đã có điểm B sau
        </label>
      </div>

      <p className="text-xs mb-2" style={{ color: MUTED }}>
        Hiển thị {daLoc.length} / {duLieu.length} lần bắt đáy.
      </p>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <div className="overflow-x-auto bang-cuon">
          <table className="w-full text-sm" style={{ fontFamily: "var(--font-chu)" }}>
            <thead>
              <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: "var(--font-chu)" }}>
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
                  <tr key={row.id} className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--vien-nhe)" }}>
                    <td className="py-2.5 px-3">
                      <Link href={`/ma/${row.ma}`} className="hover:underline" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
                        {row.ma}
                      </Link>
                      {row.vn100 === false && (
                        <span className="ml-1.5 px-1 text-[11px] rounded-sm" style={{ background: nhe(MUTED, 15), color: MUTED, fontFamily: "var(--font-chu)" }} title="Ngoài VN100 (GTGD TB20 ≥ 3 tỷ)">
                          khác
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3" style={{ color: MUTED }}>
                      {formatNgay(row.ngay_tin_hieu)}
                    </td>
                    <td className="py-2.5 px-3 text-right">{soVN(row.diem, 2, true)}</td>
                    <td className="py-2.5 px-3 text-right">{fmt(row.gia_luc_tin_hieu)}</td>
                    <td className="py-2.5 px-3 text-right">
                      {fmt(row.gia_hien_tai)}
                      {row.gia_hien_tai != null && row.gia_luc_tin_hieu > 0 && (
                        <span
                          className="text-[11px] ml-1"
                          style={{ color: row.gia_hien_tai >= row.gia_luc_tin_hieu ? XANH : DO }}
                        >
                          ({pct((row.gia_hien_tai / row.gia_luc_tin_hieu - 1) * 100, 1)})
                        </span>
                      )}
                    </td>
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
                      {row.chiet_khau != null ? `${soVN(row.chiet_khau, 1, true)}%` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs" style={{ color: row.kl_day != null && row.kl_day >= 2 ? XANH : MUTED, fontWeight: row.kl_day != null && row.kl_day >= 2 ? 700 : 400 }}>
                      {row.kl_day != null ? `${soVN(row.kl_day, 1, true)}×` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: row.ngay_diem_b ? XANH : MUTED }}>
                      {row.ngay_diem_b ? formatNgay(row.ngay_diem_b) : "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className="px-2 py-0.5 text-xs font-bold tracking-wide rounded-sm"
                        style={{ background: nhe(kq.mau, 13), color: kq.mau }}
                      >
                        {kq.nhan}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {daLoc.length === 0 && (
                <tr>
                  <td colSpan={COT.length} className="py-6 text-center text-sm" style={{ color: MUTED, fontFamily: "var(--font-chu)" }}>
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
