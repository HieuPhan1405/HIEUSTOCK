"use client";

import { useEffect, useRef, useState } from "react";
import { dangTrongPhienGiaoDich } from "@/lib/khungGioVaoLenh";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";
const CHIEU_CAO = 200;

function chuoiGio(giay) {
  const d = new Date(giay * 1000);
  return d.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" });
}

// Thanh khoan trong phien: duong tich luy khoi luong khop lenh cua VNINDEX (dai dien thanh khoan
// toan thi truong - khong co GTGD tong hop tu nguon cong khai nay nen dung khoi luong, khong quy
// ra tien). Tu lam moi moi 30s trong phien, giong BieuDoKyThuat.js.
export default function ThanhKhoanThiTruong({ ma = "VNINDEX" }) {
  const [nen, setNen] = useState(null);
  const [loi, setLoi] = useState(null);
  const hopRef = useRef(null);
  const [rong, setRong] = useState(800);

  useEffect(() => {
    if (!hopRef.current) return;
    const quanSat = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr && cr.width > 0) setRong(Math.floor(cr.width));
    });
    quanSat.observe(hopRef.current);
    return () => quanSat.disconnect();
  }, []);

  const coDuLieuRef = useRef(false);

  useEffect(() => {
    let huy = false;
    coDuLieuRef.current = false;
    function tai() {
      fetch(`/api/thanh-khoan?ma=${encodeURIComponent(ma)}`)
        .then((r) => r.json())
        .then((j) => {
          if (huy) return;
          if (j.trangThai === "ok" && Array.isArray(j.nen) && j.nen.length > 0) {
            coDuLieuRef.current = true;
            setNen(j.nen);
            setLoi(null);
          } else if (!coDuLieuRef.current) {
            // Chi bao loi khi CHUA tung co du lieu - lam moi ngam that bai thi giu nguyen bieu do dang hien.
            setLoi(j.thongBao || "Chưa có dữ liệu phiên hôm nay.");
          }
        })
        .catch(() => {
          if (!huy && !coDuLieuRef.current) setLoi("Không kết nối được máy chủ.");
        });
    }
    tai();
    const hen = setInterval(() => {
      if (dangTrongPhienGiaoDich()) tai();
    }, 30_000);
    return () => {
      huy = true;
      clearInterval(hen);
    };
  }, [ma]);

  const tichLuy = [];
  let tong = 0;
  if (nen) {
    for (const b of nen) {
      tong += b.v;
      tichLuy.push({ t: b.t, cum: tong });
    }
  }

  const rongVe = Math.max(280, rong - 40);
  const caoVe = CHIEU_CAO - 30;
  const maxCum = Math.max(1, ...tichLuy.map((p) => p.cum));
  const toaDo = tichLuy.map((p, i) => {
    const x = tichLuy.length > 1 ? (i / (tichLuy.length - 1)) * rongVe : 0;
    const y = caoVe - (p.cum / maxCum) * caoVe;
    return [x, y];
  });
  const duongPath = toaDo.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const vungPath = toaDo.length ? `${duongPath} L ${toaDo[toaDo.length - 1][0].toFixed(1)} ${caoVe} L 0 ${caoVe} Z` : "";

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <p className="text-xs uppercase tracking-wide" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
          Thanh khoản trong phiên ({ma})
        </p>
        {tichLuy.length > 0 && (
          <p className="text-sm" style={{ fontFamily: "'JetBrains Mono', monospace", color: PRIMARY, fontWeight: 700 }}>
            {(tong / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} triệu cp
          </p>
        )}
      </div>
      <p className="text-[11px] mb-3" style={{ color: MUTED }}>
        Khối lượng khớp lệnh tích luỹ của VN-Index — đại diện thanh khoản toàn thị trường, không quy ra giá trị (tỷ đồng).
      </p>
      <div ref={hopRef} className="w-full" style={{ height: CHIEU_CAO }}>
        {loi && !tichLuy.length ? (
          <div className="h-full flex items-center justify-center text-sm" style={{ color: MUTED }}>
            {loi}
          </div>
        ) : tichLuy.length > 0 ? (
          <svg width={rongVe + 40} height={CHIEU_CAO} style={{ display: "block" }}>
            <g transform="translate(20,10)">
              <defs>
                <linearGradient id="tkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PRIMARY} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={PRIMARY} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d={vungPath} fill="url(#tkGradient)" />
              <path d={duongPath} fill="none" stroke={PRIMARY} strokeWidth="2" />
              <text x="0" y={caoVe + 16} fontSize="10" fill={MUTED} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {chuoiGio(tichLuy[0].t)}
              </text>
              <text x={rongVe} y={caoVe + 16} textAnchor="end" fontSize="10" fill={MUTED} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {chuoiGio(tichLuy[tichLuy.length - 1].t)}
              </text>
            </g>
          </svg>
        ) : (
          <div className="h-full flex items-center justify-center text-sm" style={{ color: MUTED }}>
            Đang tải dữ liệu phiên…
          </div>
        )}
      </div>
    </div>
  );
}
