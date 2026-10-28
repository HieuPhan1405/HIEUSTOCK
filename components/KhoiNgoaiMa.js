"use client";

import { useEffect, useMemo, useState } from "react";
import { soVN } from "@/lib/soVN";

// KHOI NGOAI MUA / BAN RONG 10 PHIEN o trang tung ma (VNDirect qua /api/khoi-ngoai-ma?ma=, du lieu cong khai, ke ca phien dang chay): cot xanh = mua rong, cot do = ban rong; doi giua KL (cp) va gia tri (ty dong).
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const sans = { fontFamily: "var(--font-chu)" };
const CHU_KY_MS = 60_000;

const mau = (v) => (v > 0 ? XANH : v < 0 ? DO : MUTED);
const ngayNgan = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}`;
// 262300 -> "262,3K" · -4600000 -> "-4,6M" (kieu app chung khoan)
const klNgan = (v) => {
  const a = Math.abs(v), d = v < 0 ? "-" : "";
  return a >= 1e6 ? `${d}${soVN(a / 1e6, 1)}M` : a >= 1e3 ? `${d}${soVN(a / 1e3, 1)}K` : `${d}${soVN(a, 0)}`;
};
const tyNgan = (v) => `${v < 0 ? "-" : ""}${soVN(Math.abs(v), Math.abs(v) >= 100 ? 0 : 1)}`;

function BieuDo({ phien, kieu }) {
  const gt = (p) => (kieu === "kl" ? p.rongKL : p.rongTy);
  const nhan = kieu === "kl" ? klNgan : tyNgan;
  const lon = Math.max(...phien.map((p) => Math.max(gt(p), 0)), 0);
  const nho = Math.min(...phien.map((p) => Math.min(gt(p), 0)), 0);
  const W = 640, H = 250, TREN = 36, DUOI = 24, CAO = H - TREN - DUOI;
  const bien = lon - nho || 1;
  const y0 = TREN + (lon / bien) * CAO; // duong 0
  const o = W / phien.length, rong = Math.min(o * 0.62, 44);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Khối ngoại mua bán ròng 10 phiên gần nhất">
      <line x1="0" x2={W} y1={y0} y2={y0} stroke={VIEN} strokeWidth="1" />
      {phien.map((p, i) => {
        const v = gt(p), x = i * o + o / 2, h = Math.max((Math.abs(v) / bien) * CAO, v === 0 ? 0 : 1.5);
        const duong = v >= 0;
        return (
          <g key={p.ngay}>
            <line x1={x} x2={x} y1={TREN - 14} y2={H - DUOI + 4} stroke={VIEN} strokeDasharray="3 4" opacity="0.5" />
            <text x={x} y={14} fontSize="15" textAnchor="middle" fill={MUTED}>{ngayNgan(p.ngay)}</text>
            <rect x={x - rong / 2} y={duong ? y0 - h : y0} width={rong} height={h} rx="2" fill={mau(v)} opacity="0.9" />
            <text x={x} y={duong ? y0 - h - 4 : y0 + h + 15} fontSize="15" textAnchor="middle" fill={TEXT} fontWeight="600">{nhan(v)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function KhoiNgoaiMa({ ma }) {
  const [d, setD] = useState({ trangThai: "tai" });
  const [kieu, datKieu] = useState("kl");

  useEffect(() => {
    let dung = false;
    const tai = () =>
      fetch(`/api/khoi-ngoai-ma?ma=${encodeURIComponent(ma)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => { if (!dung) setD(j.trangThai === "ok" && j.phien?.length ? { trangThai: "ok", phien: j.phien } : { trangThai: "rong" }); })
        .catch(() => { if (!dung) setD((c) => (c.trangThai === "ok" ? c : { trangThai: "loi" })); });
    tai();
    const h = setInterval(tai, CHU_KY_MS);
    return () => { dung = true; clearInterval(h); };
  }, [ma]);

  const phien = d.trangThai === "ok" ? d.phien : null;
  const tom = useMemo(() => {
    if (!phien) return null;
    const rongKL = phien.reduce((s, p) => s + p.rongKL, 0), rongTy = phien.reduce((s, p) => s + p.rongTy, 0);
    const dau = Math.sign(phien[phien.length - 1].rongKL);
    let chuoi = 0;
    for (let i = phien.length - 1; i >= 0 && dau !== 0 && Math.sign(phien[i].rongKL) === dau; i--) chuoi++;
    return { rongKL, rongTy, chuoi, dau };
  }, [phien]);

  return (
    <section className="rounded-2xl border p-5 mb-4" style={{ borderColor: VIEN, background: NEN_CARD, color: TEXT }} aria-label={`Khối ngoại mua bán ròng của ${ma}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-lg" style={{ ...sans, fontWeight: 700 }}>Khối ngoại mua ròng 10 phiên</h2>
        <div className="flex gap-1 text-xs" role="group" aria-label="Đơn vị">
          {[["kl", "Khối lượng"], ["gt", "Giá trị (tỷ)"]].map(([k, ten]) => (
            <button key={k} type="button" onClick={() => datKieu(k)} aria-pressed={kieu === k} className="rounded-full border px-3 py-1" style={{ borderColor: VIEN, background: kieu === k ? "var(--tim-nhat)" : "transparent", color: kieu === k ? "#fff" : MUTED }}>
              {ten}
            </button>
          ))}
        </div>
      </div>
      {d.trangThai === "tai" && <p className="text-sm" style={{ color: MUTED }}>Đang tải…</p>}
      {(d.trangThai === "rong" || d.trangThai === "loi") && <p className="text-sm" style={{ color: MUTED }}>{d.trangThai === "loi" ? "Chưa tải được dữ liệu khối ngoại, thử lại sau ít phút." : `Chưa có dữ liệu khối ngoại cho ${ma}.`}</p>}
      {phien && tom && (
        <>
          <p className="text-sm mb-3" style={{ color: MUTED }}>
            Cộng 10 phiên: <b style={{ color: mau(tom.rongKL) }}>{tom.rongKL > 0 ? "Mua" : tom.rongKL < 0 ? "Bán" : "Cân bằng"} ròng {klNgan(Math.abs(tom.rongKL))} cp ({tyNgan(Math.abs(tom.rongTy))} tỷ)</b>
            {tom.chuoi >= 2 && <> · <b style={{ color: mau(tom.dau) }}>{tom.chuoi} phiên liên tiếp {tom.dau > 0 ? "mua" : "bán"} ròng</b></>}
          </p>
          <BieuDo phien={phien} kieu={kieu} />
          <p className="text-xs mt-2" style={{ color: MUTED }}>
            Nguồn VNDirect, gồm cả giao dịch thỏa thuận; phiên cuối cùng có thể đang chạy trong ngày. Chỉ để tham khảo, không phải khuyến nghị.
          </p>
        </>
      )}
    </section>
  );
}
