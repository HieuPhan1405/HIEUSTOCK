"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { TriangleAlert, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import SignalPill from "@/components/SignalPill";
import NutThamGia from "@/components/NutThamGia";
import { fmt, pct, chamTPCaoNhat } from "@/components/dungChung";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const MUTED = "#8B8B99";
const DO = "#EF4444";
const XANH = "#22C55E";
const PRIMARY = "#6C5CE7";
const CAM = "#F97316";

function formatNgay(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("vi-VN");
}

// Chot loi - muc TP CAO NHAT tung cham toi TRONG SUOT qua trinh giu (dung
// chamTPCaoNhat() dung chung, KHONG chi so gia hien tai - gia co the da
// cham TP roi tut xuong lai, van phai tinh la "da cham").
function tinhChotLoi(row) {
  if (row.gia == null && !row.tp_da_cham) return { nhan: "—", mau: MUTED, hang: -1 };
  const tp = chamTPCaoNhat(row);
  if (tp === "TP3") return { nhan: "Đã chạm TP3", mau: "#22C55E", hang: 3 };
  if (tp === "TP2") return { nhan: "Đã chạm TP2", mau: "#22C55E", hang: 2 };
  if (tp === "TP1") return { nhan: "Đã chạm TP1", mau: "#FBBF24", hang: 1 };
  return { nhan: "Chưa chạm", mau: MUTED, hang: 0 };
}

// Cot nao co "khoa" thi bam duoc de sap xep (lay() tra ve gia tri so sanh);
// Ngay ban/Gia ban luon la "—" (trang nay chi hien vi the DANG mo) nen khong
// can sap xep, giu nguyen vi tri cho khop bo cuc cu.
const COT = [
  { khoa: "ma", nhan: "Mã CP", canPhai: false, lay: (r) => r.ma },
  { khoa: "gia", nhan: "Giá hiện tại", canPhai: true, lay: (r) => r.gia },
  { khoa: "doi", nhan: "%Hôm nay", canPhai: true, lay: (r) => r.doi },
  { khoa: "ngay_mua", nhan: "Ngày mua", canPhai: false, lay: (r) => (r.ngay_mua ? new Date(r.ngay_mua).getTime() : -Infinity) },
  { khoa: "gia_mua", nhan: "Giá mua", canPhai: true, lay: (r) => r.gia_mua },
  { khoa: null, nhan: "Ngày bán", canPhai: false },
  { khoa: null, nhan: "Giá bán", canPhai: true },
  { khoa: "so_phien_giu", nhan: "Số phiên", canPhai: true, lay: (r) => r.so_phien_giu },
  { khoa: "lai_lo_pct", nhan: "Lãi/Lỗ", canPhai: true, lay: (r) => r.lai_lo_pct },
  { khoa: "chot_loi", nhan: "Chốt lời", canPhai: true, lay: (r) => tinhChotLoi(r).hang },
  { khoa: "tin", nhan: "Trạng thái", canPhai: true, lay: (r) => r.tin },
];

export default function BangLenhMo({ duLieu }) {
  // Mac dinh: canh bao Mat Than len dau (rui ro can chu y truoc), giu nguyen
  // hanh vi cu cho toi khi nguoi dung tu bam sap xep cot khac.
  const [sapXep, setSapXep] = useState(null);
  // Trang nay da bat buoc dang nhap tu server (xem app/lenh-mo/page.js) nen
  // luon coi la da dang nhap - chi can nap ban do Tham gia, khong can kiem
  // tra lai phien dang nhap.
  const [banDoThamGia, setBanDoThamGia] = useState({});

  useEffect(() => {
    fetch("/api/tham-gia")
      .then((r) => r.json())
      .then((d) => {
        const maCuaToi = new Set(d.maCuaToi || []);
        const ban = {};
        for (const [ma, dem] of Object.entries(d.demTatCa || {})) {
          ban[ma] = { soNguoiThamGia: dem, daThamGia: maCuaToi.has(ma) };
        }
        for (const ma of maCuaToi) {
          if (!ban[ma]) ban[ma] = { soNguoiThamGia: 0, daThamGia: true };
        }
        setBanDoThamGia(ban);
      })
      .catch(() => {});
  }, []);

  function doiTrangThaiThamGia(ma, trangThaiMoi) {
    setBanDoThamGia((cu) => ({ ...cu, [ma]: trangThaiMoi }));
  }

  const daSapXep = useMemo(() => {
    if (!sapXep) {
      return [...duLieu].sort((a, b) => (b.mat_than ? 1 : 0) - (a.mat_than ? 1 : 0));
    }
    const cot = COT.find((c) => c.khoa === sapXep.khoa);
    return [...duLieu].sort((a, b) => {
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
  }, [duLieu, sapXep]);

  function doiSapXep(khoa) {
    if (!khoa) return;
    setSapXep((s) => (s?.khoa === khoa ? { khoa, chieu: s.chieu === "desc" ? "asc" : "desc" } : { khoa, chieu: "desc" }));
  }

  if (duLieu.length === 0) {
    return (
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <p className="py-6 px-4 text-sm" style={{ color: MUTED }}>
          Chưa có mã nào đang MUA/NẮM GIỮ trong lần quét gần nhất.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <thead>
            <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: "'Inter', sans-serif" }}>
              {COT.map((c, i) => (
                <th
                  key={c.nhan}
                  className={`py-3 font-normal whitespace-nowrap ${c.canPhai ? "text-right" : "text-left"} ${
                    i === 0 ? "pl-4 pr-3" : i === COT.length - 1 ? "pr-4 pl-3" : "px-3"
                  } ${c.khoa ? "cursor-pointer select-none" : ""}`}
                  onClick={() => doiSapXep(c.khoa)}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.nhan}
                    {c.khoa &&
                      (sapXep?.khoa === c.khoa ? (
                        sapXep.chieu === "desc" ? (
                          <ArrowDown size={12} color={PRIMARY} />
                        ) : (
                          <ArrowUp size={12} color={PRIMARY} />
                        )
                      ) : (
                        <ArrowUpDown size={12} opacity={0.4} />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daSapXep.map((row, i) => (
              <tr
                key={row.ma}
                className={i > 0 ? "border-t" : ""}
                style={{
                  borderColor: row.mat_than ? "#4A2230" : row.ban_bot ? "#4A3218" : "#1D1D26",
                  background: row.mat_than ? "#241419" : row.ban_bot ? "#241C10" : "transparent",
                }}
              >
                <td className="py-3 pl-4 pr-3">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/ma/${row.ma}`} className="flex items-center gap-1 hover:underline" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                      {row.mat_than && <TriangleAlert size={13} color={DO} strokeWidth={2} aria-hidden="true" className="shrink-0" />}
                      {row.ma}
                    </Link>
                    <NutThamGia
                      ma={row.ma}
                      soNguoiThamGia={banDoThamGia[row.ma]?.soNguoiThamGia ?? 0}
                      daThamGia={banDoThamGia[row.ma]?.daThamGia ?? false}
                      onDoiTrangThai={doiTrangThaiThamGia}
                    />
                  </div>
                </td>
                <td className="py-3 px-3 text-right">{fmt(row.gia)}</td>
                <td className="py-3 px-3 text-right" style={{ color: row.doi >= 0 ? XANH : DO }}>
                  {pct(row.doi, 2)}
                </td>
                <td className="py-3 px-3" style={{ color: MUTED }}>
                  {formatNgay(row.ngay_mua)}
                </td>
                <td className="py-3 px-3 text-right">{fmt(row.gia_mua)}</td>
                <td className="py-3 px-3" style={{ color: MUTED }}>
                  —
                </td>
                <td className="py-3 px-3 text-right" style={{ color: MUTED }}>
                  —
                </td>
                <td className="py-3 px-3 text-right">{row.so_phien_giu ?? "—"} phiên</td>
                <td className="py-3 px-3 text-right font-bold" style={{ color: row.lai_lo_pct >= 0 ? XANH : DO }}>
                  {pct(row.lai_lo_pct, 2)}
                </td>
                <td className="py-3 px-3 text-right font-bold" style={{ color: tinhChotLoi(row).mau }}>
                  {tinhChotLoi(row).nhan}
                </td>
                <td className="py-3 pr-4 pl-3 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <SignalPill tin={row.tin} />
                    {row.ban_bot && (
                      <span className="text-[10px] font-bold tracking-wide" style={{ color: CAM }}>
                        ⚠ Bán bớt
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
