"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { soVN, pctVN } from "@/lib/soVN";

// O BIEU DO VN-INDEX dau Dashboard (10/11/2026, kieu FireAnt): duong gia + vung to, 4 khung Trong ngay / 1 thang / 3 thang / 1 nam, re chuot (cham) hien gia tung diem.
// Ve bang SVG tu tinh (khong tai thu vien bieu do cho 1 duong). du: lib/chiSoThiTruong.js layBieuDoVNIndex().
// Khung Trong ngay: truc ngang theo THU TU phut (bo khoang nghi trua nhu cac bang dien), duong ke ngang = gia dong cua phien truoc (tham chieu).
const KHUNG = [
  { k: "1D", nhan: "Trong ngày" },
  { k: "1M", nhan: "1 tháng", n: 22 },
  { k: "3M", nhan: "3 tháng", n: 66 },
  { k: "1Y", nhan: "1 năm", n: 250 },
];
const CAO_TOI_THIEU = 250;
const LE_PHAI = 54;
const LE_DUOI = 22;
const LE_TREN = 10;

const gioVN = (t) => new Date(t * 1000).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" });
const ngayNgan = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}`;
const thangNam = (s) => `${s.slice(5, 7)}/${s.slice(2, 4)}`;

// Buoc chia truc doc "dep" (1, 2, 5 x 10^k) cho khoang gia tri.
function buocDep(khoang, soVach = 4) {
  const tho = khoang / soVach;
  const mu = 10 ** Math.floor(Math.log10(tho || 1));
  const r = tho / mu;
  return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * mu;
}

export default function BieuDoVNIndex({ du }) {
  const coPhut = (du?.phut?.length ?? 0) > 5;
  const [khung, setKhung] = useState(coPhut ? "1D" : "3M");
  const khungRef = useRef(null);
  const [kt, setKt] = useState({ rong: 640, cao: CAO_TOI_THIEU });
  const [chon, setChon] = useState(null); // chi so diem dang re chuot

  useEffect(() => {
    const el = khungRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    // Do CA rong lan cao: o dung canh o Thong ke phien (cao hon) thi bieu do gian theo, khong de khoang trong duoi.
    const ro = new ResizeObserver(([e]) => setKt({ rong: Math.max(260, Math.round(e.contentRect.width)), cao: Math.max(CAO_TOI_THIEU, Math.round(e.contentRect.height)) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const diem = useMemo(() => {
    if (!du) return [];
    if (khung === "1D") return du.phut.map(([t, v]) => ({ v, nhan: gioVN(t) }));
    const n = KHUNG.find((x) => x.k === khung).n;
    return du.nenNgay.slice(-n).map(([ngay, v]) => ({ v, nhan: khung === "1Y" ? thangNam(ngay) : ngayNgan(ngay), nhanDu: `${ngayNgan(ngay)}/${ngay.slice(0, 4)}` }));
  }, [khung, du]);

  if (!du) return null;
  const thamChieu = khung === "1D" ? du.thamChieu : diem[0]?.v;
  const n = diem.length;
  const W = kt.rong;
  const CAO = kt.cao;
  const rongVe = W - LE_PHAI;
  const caoVe = CAO - LE_DUOI - LE_TREN;
  const gt = diem.map((d) => d.v);
  let min = Math.min(...gt, thamChieu ?? Infinity);
  let max = Math.max(...gt, thamChieu ?? -Infinity);
  const dem = (max - min) * 0.06 || 1;
  min -= dem;
  max += dem;
  const x = (i) => (n <= 1 ? 0 : (i / (n - 1)) * rongVe);
  const y = (v) => LE_TREN + caoVe - ((v - min) / (max - min)) * caoVe;
  const cuoi = gt[n - 1];
  const mau = cuoi >= (thamChieu ?? cuoi) ? "var(--xanh)" : "var(--do)";
  const duong = gt.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const buoc = buocDep(max - min);
  const vach = [];
  for (let v = Math.ceil(min / buoc) * buoc; v <= max; v += buoc) vach.push(v);
  const soNhanNgang = Math.max(2, Math.min(6, Math.floor(rongVe / 110)));
  const nhanNgang = n > 1 ? Array.from({ length: soNhanNgang }, (_, k) => Math.round((k / (soNhanNgang - 1)) * (n - 1))) : [];
  const d = chon != null ? diem[chon] : null;

  const reChuot = (e) => {
    if (n < 2) return;
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / rongVe) * (n - 1));
    setChon(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <div className="rounded-2xl border p-4 sm:p-5 h-full flex flex-col" style={{ borderColor: "var(--vien)", background: "var(--card)" }}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <h2 className="text-[15px]" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
            VN-Index{" "}
            <span style={{ color: du.doi >= 0 ? "var(--xanh)" : "var(--do)", fontWeight: 600 }}>
              {soVN(du.gia, 2, true)} · {du.doiDiem > 0 ? "+" : ""}
              {soVN(du.doiDiem, 2, true)} ({pctVN(du.doi, 2)})
            </span>
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--mo)" }}>
            {khung === "1D" ? `Phiên ${ngayNgan(du.ngay)}/${du.ngay.slice(0, 4)} · nét đứt = tham chiếu ${soVN(du.thamChieu, 2, true)}` : `So với đầu kỳ: ${pctVN((cuoi / thamChieu - 1) * 100, 2)}`}
          </p>
        </div>
        <div className="flex gap-1" role="tablist" aria-label="Khung thời gian">
          {KHUNG.filter((k) => k.k !== "1D" || coPhut).map((k) => (
            <button
              key={k.k}
              type="button"
              role="tab"
              aria-selected={khung === k.k}
              onClick={() => {
                setKhung(k.k);
                setChon(null);
              }}
              className="px-2.5 py-1 rounded-md text-xs"
              style={{ background: khung === k.k ? "var(--vien)" : "transparent", color: khung === k.k ? "var(--chu)" : "var(--mo)", fontFamily: "var(--font-chu)", fontWeight: khung === k.k ? 700 : 500 }}
            >
              {k.nhan}
            </button>
          ))}
        </div>
      </div>

      <div ref={khungRef} className="relative flex-1 min-h-[250px] overflow-hidden">
        {/* SVG dat tuyet doi: chieu cao khung do luoi quyet dinh, SVG khong day khung cao them (tranh vong lap do - ve). */}
        {n > 1 && (
          <svg width={W} height={CAO} role="img" aria-label={`Biểu đồ VN-Index ${KHUNG.find((k) => k.k === khung).nhan}: từ ${soVN(gt[0], 2, true)} đến ${soVN(cuoi, 2, true)}`} className="absolute inset-0 block select-none" style={{ touchAction: "pan-y" }}>
            <defs>
              <linearGradient id="cs-vni-to" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={mau} stopOpacity="0.28" />
                <stop offset="100%" stopColor={mau} stopOpacity="0" />
              </linearGradient>
            </defs>
            {vach.map((v) => (
              <g key={v}>
                <line x1={0} x2={rongVe} y1={y(v)} y2={y(v)} stroke="var(--vien-nhe)" strokeWidth="1" />
                <text x={rongVe + 6} y={y(v) + 4} fontSize="11" fill="var(--mo)" style={{ fontFamily: "var(--font-chu)" }}>
                  {soVN(v, buoc < 1 ? 1 : 0)}
                </text>
              </g>
            ))}
            {thamChieu != null && khung === "1D" && <line x1={0} x2={rongVe} y1={y(thamChieu)} y2={y(thamChieu)} stroke="var(--vang)" strokeWidth="1" strokeDasharray="4 4" />}
            <path d={`${duong} L${x(n - 1).toFixed(1)},${LE_TREN + caoVe} L0,${LE_TREN + caoVe} Z`} fill="url(#cs-vni-to)" />
            <path d={duong} fill="none" stroke={mau} strokeWidth="2" strokeLinejoin="round" />
            {nhanNgang.map((i, k) => (
              <text key={`${i}-${k}`} x={x(i)} y={CAO - 5} fontSize="11" fill="var(--mo)" textAnchor={k === 0 ? "start" : k === nhanNgang.length - 1 ? "end" : "middle"} style={{ fontFamily: "var(--font-chu)" }}>
                {diem[i].nhan}
              </text>
            ))}
            {d && (
              <g pointerEvents="none">
                <line x1={x(chon)} x2={x(chon)} y1={LE_TREN} y2={LE_TREN + caoVe} stroke="var(--mo-3)" strokeDasharray="3 3" />
                <circle cx={x(chon)} cy={y(d.v)} r="4.5" fill={mau} stroke="var(--card)" strokeWidth="2" />
              </g>
            )}
            {/* Vung bat chuot rong hon net ve (re chuot / cham o bat ky dau trong khung) */}
            <rect x={0} y={0} width={rongVe} height={CAO - LE_DUOI} fill="transparent" onPointerMove={reChuot} onPointerDown={reChuot} onPointerLeave={() => setChon(null)} />
          </svg>
        )}
        {d && (
          <div
            className="absolute top-1 pointer-events-none rounded-lg border px-2.5 py-1.5 text-xs shadow-lg"
            style={{ left: Math.min(Math.max(x(chon) - 70, 0), rongVe - 140), width: 140, background: "var(--card)", borderColor: "var(--vien)", fontFamily: "var(--font-chu)" }}
          >
            <span className="block" style={{ color: "var(--mo)" }}>
              {d.nhanDu ?? d.nhan}
            </span>
            <b className="text-sm">{soVN(d.v, 2, true)}</b>{" "}
            {thamChieu != null && <span style={{ color: d.v >= thamChieu ? "var(--xanh)" : "var(--do)" }}>{pctVN((d.v / thamChieu - 1) * 100, 2)}</span>}
          </div>
        )}
        {n <= 1 && (
          <p className="h-[250px] flex items-center justify-center text-sm" style={{ color: "var(--mo)" }}>
            Chưa có dữ liệu giá cho khung này.
          </p>
        )}
      </div>
      <Link href="/bieu-do?ma=VNINDEX" className="text-xs mt-2 self-end" style={{ color: "var(--tim-chu)" }}>
        Biểu đồ kỹ thuật đầy đủ →
      </Link>
    </div>
  );
}
