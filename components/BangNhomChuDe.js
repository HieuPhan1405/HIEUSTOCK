"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import { mauNenTheoDoi, dinhDangKL } from "@/lib/bangNhomChuDe";
import { fmt } from "@/components/dungChung";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";

const pctChuoi = (v) => (v == null ? "—" : `${Math.abs(v) < 0.005 ? "" : v > 0 ? "+" : ""}${v.toLocaleString("vi-VN", { minimumFractionDigits: v === 0 ? 0 : 2, maximumFractionDigits: 2 })}%`);

// BANG NHOM CHU DE (vd "Dau tu cong") theo mau tham khao cua Hieu: ten nhom + % trung binh, moi ma 1 dong to nen theo % tang / giam (xanh / do / vang khi 0), cot Ma / Gia / +/- / KL bam de sap xep.
export default function BangNhomChuDe({ nhan, moTa, hang, trungBinhPct, ngayPhien }) {
  const [khoa, setKhoa] = useState("kl");
  const [giam, setGiam] = useState(true);
  const [mo, setMo] = useState(false); // mac dinh GON: chi tieu de + % trung binh, bam de xem tung ma
  const doiKhoa = (k) => {
    if (k === khoa) setGiam((g) => !g);
    else {
      setKhoa(k);
      setGiam(k !== "ma");
    }
  };
  const ds = useMemo(() => {
    const gt = (h) => (khoa === "ma" ? h.ma : khoa === "gia" ? h.gia : khoa === "doi" ? h.doiPct : h.kl);
    return [...hang].sort((a, b) => {
      const x = gt(a);
      const y = gt(b);
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      const c = typeof x === "string" ? x.localeCompare(y) : x - y;
      return giam ? -c : c;
    });
  }, [hang, khoa, giam]);

  const Tieu = ({ k, ten, phai }) => (
    <th className={`px-2 py-2 font-normal ${phai ? "text-right" : "text-left"}`}>
      <button type="button" onClick={() => doiKhoa(k)} className="inline-flex items-center gap-0.5 select-none" style={{ color: khoa === k ? TEXT : MUTED, fontWeight: khoa === k ? 700 : 400 }}>
        {ten}
        {khoa === k && (giam ? <ArrowDown size={12} aria-hidden="true" /> : <ArrowUp size={12} aria-hidden="true" />)}
      </button>
    </th>
  );

  return (
    <section className="rounded-2xl border overflow-hidden w-full max-w-[340px]" style={{ borderColor: VIEN, background: NEN_CARD, color: TEXT }} aria-label={`Nhóm ${nhan}`}>
      <button type="button" onClick={() => setMo((v) => !v)} aria-expanded={mo} title={moTa} className="w-full px-3 py-3 flex items-center justify-center gap-2">
        <span className="text-base" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>{nhan}</span>
        <span className="text-sm" style={{ color: trungBinhPct == null ? MUTED : trungBinhPct >= 0 ? XANH : DO, fontWeight: 700 }}>{pctChuoi(trungBinhPct)}</span>
        <span className="text-[11px]" style={{ color: MUTED }}>{mo ? "Thu gọn" : `Xem ${hang.length} mã`}</span>
        <ChevronDown size={14} aria-hidden="true" style={{ color: MUTED, transform: mo ? "rotate(180deg)" : "none" }} />
      </button>
      {mo && (<>
      <table className="w-full text-sm" style={{ fontFamily: "var(--font-chu)" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${VIEN}` }}>
            <Tieu k="ma" ten="Mã" />
            <Tieu k="gia" ten="Giá" phai />
            <Tieu k="doi" ten="+/-" phai />
            <Tieu k="kl" ten="KL" phai />
          </tr>
        </thead>
        <tbody>
          {ds.map((h) => (
            <tr key={h.ma} style={{ background: mauNenTheoDoi(h.doiPct) }}>
              <td className="px-2 py-1.5 font-bold">
                <Link href={`/ma/${h.ma}`} className="hover:underline">{h.ma}</Link>
              </td>
              <td className="px-2 py-1.5 text-right">{h.gia == null ? "—" : fmt(h.gia)}</td>
              <td className="px-2 py-1.5 text-right">{pctChuoi(h.doiPct)}</td>
              <td className="px-2 py-1.5 text-right">{dinhDangKL(h.kl)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-2 text-[11px]" style={{ color: MUTED }}>
        {ngayPhien ? `Phiên ${ngayPhien.split("-").reverse().join("/")}` : ""} · giá nghìn đồng, KL cổ phiếu; % trung bình đều các mã trong nhóm (mã không giao dịch tính 0%). Nguồn giá DNSE.
      </p>
      </>)}
    </section>
  );
}
