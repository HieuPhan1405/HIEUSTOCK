"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { NGANH_NHAN } from "@/lib/nganh";
import { soVN, pctVN } from "@/lib/soVN";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const NEN_SECTOR = "var(--vien-nhe)";
const MUTED = "var(--mo)";
const CHIEU_CAO = 460;
const GIA_TRI_TOI_THIEU = 0.1; // ma thanh khoan qua thap (gtgd_tb20 null/0) van co 1 o nho, khong bien mat hoan toan khoi ban do.

// TIEU CHI TO MAU (chuyen bang nut, khong doi bo cuc): moi tieu chi co truong du lieu, nguong bao hoa mau (quanh 0), cach hien so trong o va chu thich.
// Chi dung truong khach cung duoc thay (lib/lamSachChoKhach.js) - khong co tin hieu MUA/BAN.
const TIEU_CHI = [
  { khoa: "doi", nhan: "Trong ngày", truong: "doi", max: 4, hien: (v) => `${v >= 0 ? "+" : ""}${soVN(v, 1, true)}%`, tom: (v) => pctVN(v, 2), mota: "% thay đổi giá trong phiên" },
  { khoa: "rs20", nhan: "Mạnh/yếu 20 phiên", truong: "rs_vni", max: 15, hien: (v) => `${v >= 0 ? "+" : ""}${soVN(v, 1, true)}`, tom: (v) => `${v >= 0 ? "+" : ""}${soVN(v, 1, true)} điểm`, mota: "hơn/kém VN-Index bao nhiêu điểm % trong 20 phiên" },
  { khoa: "rs60", nhan: "Mạnh/yếu 60 phiên", truong: "rs_vni_60", max: 20, hien: (v) => `${v >= 0 ? "+" : ""}${soVN(v, 0)}`, tom: (v) => `${v >= 0 ? "+" : ""}${soVN(v, 1, true)} điểm`, mota: "hơn/kém VN-Index bao nhiêu điểm % trong 60 phiên" },
  { khoa: "diem", nhan: "Điểm hệ thống", truong: "diem", max: 5, hien: (v) => soVN(v, 1, true), tom: (v) => soVN(v, 2, true), mota: "điểm hợp lưu xu hướng · động lượng · dòng tiền" },
];
const KICH_THUOC = [
  { khoa: "gtgd", nhan: "Thanh khoản", truong: "gtgd_tb20", mota: "diện tích ô = giá trị giao dịch trung bình 20 phiên" },
  { khoa: "vonhoa", nhan: "Vốn hóa", truong: "von_hoa_ty", mota: "diện tích ô = vốn hóa" },
];

// Mau theo gia tri: tu trung tinh (0) toi xanh/do dam, bao hoa o +-max. Dung color-mix voi bien CSS (--nhiet-*, doi theo che do sang/toi) - KHONG tu doc ma hex, vi bien CSS la chuoi "var(...)"
// khong parse duoc (tung gay o tang bi den, o giam bi do dam sai).
const TRUNG_TINH = "var(--nhiet-trung)";
function mauTheoGiaTri(v, max) {
  if (v == null || !Number.isFinite(Number(v))) return TRUNG_TINH;
  const m = Math.max(-max, Math.min(max, Number(v)));
  const dam = m >= 0 ? "var(--nhiet-tang)" : "var(--nhiet-giam)";
  return `color-mix(in srgb, ${dam} ${Math.round((Math.abs(m) / max) * 100)}%, ${TRUNG_TINH})`;
}

const coSo = (v) => v != null && Number.isFinite(Number(v));

function NutChon({ ds, khoa, onChon, nhan }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label={nhan}>
      <span className="text-[11px] mr-0.5" style={{ color: MUTED }}>
        {nhan}
      </span>
      {ds.map((t) => (
        <button
          key={t.khoa}
          type="button"
          onClick={() => onChon(t.khoa)}
          aria-pressed={t.khoa === khoa}
          className="cs-radar-chip"
          style={{ "--c": "var(--tim-nhat)", padding: "3px 10px" }}
        >
          {t.nhan}
        </button>
      ))}
    </div>
  );
}

// Ban do nhiet toan thi truong: 1 o = 1 ma, dien tich theo thanh khoan hoac von hoa, mau theo tieu chi chon (trong ngay / manh-yeu 20, 60 phien / diem he thong), gom nhom theo nganh
// (giong cac cong cu heatmap pho bien - Finviz, Simplize...). Ten nganh kem gia tri TRUNG BINH cua tieu chi.
// tatCa: mang dong tin hieu da chuan hoa (can co ma, nganh + cac truong cua tieu chi: doi, rs_vni, rs_vni_60, diem, gtgd_tb20, von_hoa_ty).
export default function BanDoNhiet({ tatCa, chieuCao = CHIEU_CAO, tieuDe = "Bản đồ nhiệt theo ngành" }) {
  const hopRef = useRef(null);
  const [rong, setRong] = useState(900);
  const [tieuChi, setTieuChi] = useState("doi");
  const [kichThuoc, setKichThuoc] = useState("gtgd");
  const tc = TIEU_CHI.find((t) => t.khoa === tieuChi) ?? TIEU_CHI[0];
  const kt = KICH_THUOC.find((t) => t.khoa === kichThuoc) ?? KICH_THUOC[0];

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
      if (!r.nganh || !coSo(r.doi)) continue; // ma khong co gia trong phien / khong ro nganh: bo
      const cd = r[kt.truong];
      const giaTri = cd > 0 ? Number(cd) : GIA_TRI_TOI_THIEU;
      (theoNganh[r.nganh] ||= []).push({ ma: r.ma, v: coSo(r[tc.truong]) ? Number(r[tc.truong]) : null, doi: r.doi, gtgd_tb20: r.gtgd_tb20, von_hoa_ty: r.von_hoa_ty, value: giaTri });
    }
    const duLieu = {
      ten: "goc",
      children: Object.entries(theoNganh).map(([khoa, con]) => {
        const co = con.filter((c) => c.v != null);
        return { ten: NGANH_NHAN[khoa] || khoa, tb: co.length ? co.reduce((s, c) => s + c.v, 0) / co.length : null, children: con };
      }),
    };
    const g = hierarchy(duLieu)
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value);
    treemap()
      .tile(treemapSquarify)
      .size([rong, chieuCao])
      .paddingOuter(3)
      .paddingTop((d) => (d.depth === 1 ? 20 : 0))
      .paddingInner(2)
      .round(true)(g);
    return g;
  }, [tatCa, rong, tc.truong, kt.truong, chieuCao]);

  const soMa = goc.leaves().length;

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="text-[15px]" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }} data-may="ban-do-nhiet">
          {tieuDe}
        </h2>
        <p className="text-[11px]" style={{ color: MUTED }}>
          Màu: {tc.mota} · {kt.mota} · {soMa} mã
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-3">
        <NutChon ds={TIEU_CHI} khoa={tieuChi} onChon={setTieuChi} nhan="Tô màu theo" />
        <NutChon ds={KICH_THUOC} khoa={kichThuoc} onChon={setKichThuoc} nhan="Cỡ ô theo" />
      </div>
      <div ref={hopRef} className="w-full" style={{ height: chieuCao }}>
        {rong > 0 && soMa > 0 && (
          <svg width={rong} height={chieuCao} style={{ display: "block" }}>
            {goc.children?.map((nganh) => {
              const w = nganh.x1 - nganh.x0;
              const ten = nganh.data.ten.toUpperCase();
              const tb = nganh.data.tb;
              // ten nganh kem gia tri trung binh khi du rong (~7px/ky tu); khong du thi chi ten, qua hep thi bo
              const kem = tb != null && w > ten.length * 7 + 60 ? `  ${tc.hien(tb)}` : "";
              return (
                <g key={nganh.data.ten}>
                  <rect x={nganh.x0} y={nganh.y0} width={Math.max(0, w)} height={Math.max(0, nganh.y1 - nganh.y0)} fill={NEN_SECTOR} stroke={VIEN} />
                  {w > 40 && (
                    <text x={nganh.x0 + 6} y={nganh.y0 + 14} fontSize="11" fontWeight="700" fill={MUTED} style={{ fontFamily: "var(--font-chu)" }}>
                      {ten}
                      {kem && (
                        <tspan fill={tb >= 0 ? "var(--xanh)" : "var(--do)"} dx="2">
                          {kem}
                        </tspan>
                      )}
                    </text>
                  )}
                </g>
              );
            })}
            {goc.leaves().map((la) => {
              const w = la.x1 - la.x0;
              const h = la.y1 - la.y0;
              if (w <= 0 || h <= 0) return null;
              const hienCa2 = w >= 44 && h >= 30;
              const hienMa = !hienCa2 && w >= 24 && h >= 16;
              const v = la.data.v;
              const chuThich = `${la.data.ma} · ${tc.nhan}: ${v != null ? tc.tom(v) : "chưa có"}${tc.khoa === "doi" ? "" : ` · trong ngày ${pctVN(la.data.doi, 2)}`}${
                la.data.gtgd_tb20 ? ` · GTGD TB20 ${soVN(la.data.gtgd_tb20, 1, true)} tỷ` : ""
              }${la.data.von_hoa_ty ? ` · vốn hóa ${soVN(la.data.von_hoa_ty, 0)} tỷ` : ""}`;
              return (
                <a key={la.data.ma} href={`/ma/${la.data.ma}`}>
                  <title>{chuThich}</title>
                  <rect x={la.x0} y={la.y0} width={w} height={h} style={{ cursor: "pointer", fill: mauTheoGiaTri(v, tc.max) }} />
                  {hienCa2 && (
                    <>
                      <text x={la.x0 + w / 2} y={la.y0 + h / 2 - 3} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--nhiet-chu)" style={{ pointerEvents: "none", fontFamily: "var(--font-chu)" }}>
                        {la.data.ma}
                      </text>
                      <text x={la.x0 + w / 2} y={la.y0 + h / 2 + 11} textAnchor="middle" fontSize="11" fill="var(--nhiet-chu-2)" style={{ pointerEvents: "none", fontFamily: "var(--font-chu)" }}>
                        {v != null ? tc.hien(v) : "—"}
                      </text>
                    </>
                  )}
                  {hienMa && (
                    <text x={la.x0 + w / 2} y={la.y0 + h / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--nhiet-chu)" style={{ pointerEvents: "none", fontFamily: "var(--font-chu)" }}>
                      {la.data.ma}
                    </text>
                  )}
                </a>
              );
            })}
          </svg>
        )}
      </div>
      <div className="flex items-center justify-center gap-2 mt-3 text-[11px]" style={{ color: MUTED }} aria-hidden="true">
        <span>{tc.hien(-tc.max)}</span>
        <span className="h-2 w-40 rounded-full" style={{ background: `linear-gradient(90deg, ${mauTheoGiaTri(-tc.max, tc.max)}, ${TRUNG_TINH}, ${mauTheoGiaTri(tc.max, tc.max)})` }} />
        <span>{tc.hien(tc.max)}</span>
      </div>
    </div>
  );
}
