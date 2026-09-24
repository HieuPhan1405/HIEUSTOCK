"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { NGANH_NHAN } from "@/lib/nganh";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const NEN_SECTOR = "#1D1D26";
const MUTED = "#8B8B99";
const TEXT = "#F5F5F7";
const CHIEU_CAO = 460;
const GIA_TRI_TOI_THIEU = 0.1; // ma thanh khoan qua thap (gtgd_tb20 null/0) van co 1 o nho, khong bien mat hoan toan khoi ban do.

function hexSangRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function tronMau(a, b, t) {
  const [r1, g1, b1] = hexSangRgb(a);
  const [r2, g2, b2] = hexSangRgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}
const TRUNG_TINH = "#3A3A44";
const DO_DAM = "#7F1D1D";
const XANH_DAM = "#16A34A";
// Mau theo % thay doi gia, noi tu trung tinh (0%) ra do/xanh dam - bao hoa o +-4% (giong da so cong cu
// heatmap: bien dong manh hon 4% khong can toi mau dam hon nua, tranh ca bang do/xanh chot het o vai ma).
function mauTheoDoi(doi) {
  if (doi == null) return TRUNG_TINH;
  const m = Math.max(-4, Math.min(4, doi));
  return m >= 0 ? tronMau(TRUNG_TINH, XANH_DAM, m / 4) : tronMau(TRUNG_TINH, DO_DAM, -m / 4);
}

// Ban do nhiet toan thi truong: 1 o = 1 ma, dien tich theo GTGD TB20 (thanh khoan), mau theo % thay
// doi gia trong phien, gom nhom theo nganh (giong cac cong cu heatmap pho bien - Finviz, Simplize...).
// tatCa: mang dong tin hieu da chuan hoa (can co ma, nganh, doi, gtgd_tb20).
export default function BanDoNhiet({ tatCa }) {
  const hopRef = useRef(null);
  const [rong, setRong] = useState(900);

  useEffect(() => {
    if (!hopRef.current) return;
    const quanSat = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr && cr.width > 0) setRong(Math.floor(cr.width));
    });
    quanSat.observe(hopRef.current);
    return () => quanSat.disconnect();
  }, []);

  const goc = useMemo(() => {
    const theoNganh = {};
    for (const r of tatCa) {
      if (r.doi == null || !r.nganh) continue;
      const giaTri = r.gtgd_tb20 > 0 ? r.gtgd_tb20 : GIA_TRI_TOI_THIEU;
      (theoNganh[r.nganh] ||= []).push({ ma: r.ma, doi: r.doi, gtgd_tb20: r.gtgd_tb20, value: giaTri });
    }
    const duLieu = {
      ten: "goc",
      children: Object.entries(theoNganh).map(([khoa, con]) => ({ ten: NGANH_NHAN[khoa] || khoa, children: con })),
    };
    const g = hierarchy(duLieu)
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value);
    treemap()
      .tile(treemapSquarify)
      .size([rong, CHIEU_CAO])
      .paddingOuter(3)
      .paddingTop((d) => (d.depth === 1 ? 20 : 0))
      .paddingInner(2)
      .round(true)(g);
    return g;
  }, [tatCa, rong]);

  const soMa = goc.leaves().length;

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-xs uppercase tracking-wide" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
          Bản đồ nhiệt theo ngành
        </p>
        <p className="text-[11px]" style={{ color: MUTED }}>
          Màu: % thay đổi giá · Diện tích: thanh khoản TB20 · {soMa} mã
        </p>
      </div>
      <div ref={hopRef} className="w-full" style={{ height: CHIEU_CAO }}>
        {rong > 0 && soMa > 0 && (
          <svg width={rong} height={CHIEU_CAO} style={{ display: "block" }}>
            {goc.children?.map((nganh) => (
              <g key={nganh.data.ten}>
                <rect
                  x={nganh.x0}
                  y={nganh.y0}
                  width={Math.max(0, nganh.x1 - nganh.x0)}
                  height={Math.max(0, nganh.y1 - nganh.y0)}
                  fill={NEN_SECTOR}
                  stroke={VIEN}
                />
                {nganh.x1 - nganh.x0 > 40 && (
                  <text x={nganh.x0 + 6} y={nganh.y0 + 14} fontSize="11" fontWeight="700" fill={MUTED} style={{ fontFamily: "'Inter', sans-serif" }}>
                    {nganh.data.ten.toUpperCase()}
                  </text>
                )}
              </g>
            ))}
            {goc.leaves().map((la) => {
              const w = la.x1 - la.x0;
              const h = la.y1 - la.y0;
              if (w <= 0 || h <= 0) return null;
              const hienCa2 = w >= 44 && h >= 30;
              const hienMa = !hienCa2 && w >= 24 && h >= 16;
              const chuThich = `${la.data.ma} ${la.data.doi >= 0 ? "+" : ""}${la.data.doi?.toFixed(2)}%${
                la.data.gtgd_tb20 ? ` · GTGD TB20 ${la.data.gtgd_tb20.toFixed(1)} tỷ` : ""
              }`;
              return (
                <a key={la.data.ma} href={`/ma/${la.data.ma}`} title={chuThich}>
                  <rect x={la.x0} y={la.y0} width={w} height={h} fill={mauTheoDoi(la.data.doi)} style={{ cursor: "pointer" }} />
                  {hienCa2 && (
                    <>
                      <text x={la.x0 + w / 2} y={la.y0 + h / 2 - 3} textAnchor="middle" fontSize="11" fontWeight="700" fill={TEXT} style={{ pointerEvents: "none", fontFamily: "'JetBrains Mono', monospace" }}>
                        {la.data.ma}
                      </text>
                      <text x={la.x0 + w / 2} y={la.y0 + h / 2 + 11} textAnchor="middle" fontSize="10" fill="#E5E5EA" style={{ pointerEvents: "none", fontFamily: "'JetBrains Mono', monospace" }}>
                        {la.data.doi >= 0 ? "+" : ""}
                        {la.data.doi?.toFixed(1)}%
                      </text>
                    </>
                  )}
                  {hienMa && (
                    <text x={la.x0 + w / 2} y={la.y0 + h / 2 + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill={TEXT} style={{ pointerEvents: "none", fontFamily: "'JetBrains Mono', monospace" }}>
                      {la.data.ma}
                    </text>
                  )}
                </a>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
