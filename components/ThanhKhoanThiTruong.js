"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { dangTrongPhienGiaoDich } from "@/lib/khungGioVaoLenh";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";
const XANH = "#22C55E";
const DO = "#EF4444";
const VANG = "#FBBF24";
const CHIEU_CAO = 220;

function chuoiGio(giay) {
  return new Date(giay * 1000).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" });
}
function tyDong(v) {
  return v == null ? "—" : v.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}
function chuoiPct(v) {
  if (v == null) return null;
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

// Thanh khoan trong phien, quy ra TIEN (ty dong): duong hinh dang lay tu khoi luong khop lenh TUNG
// PHUT cua VN-Index (nguon DNSE, chinh xac theo phut nhung chi la khoi luong CUA RIENG chi so), sau
// do QUY DOI ra tien bang ty le "gia tri/khoi luong" tinh tren TOAN SAN HOSE hom nay (nguon VNDirect,
// tong tat ca ma - xem lib/thiTruong.js) - vi nguon cong khai KHONG co san GTGD tung phut cho ca thi
// truong. Day la UOC LUONG (gia dinh gia binh quan/co phieu deu trong phien), khong phai so dem chinh
// xac tung giao dich.
export default function ThanhKhoanThiTruong({ ma = "VNINDEX" }) {
  const [nen, setNen] = useState(null);
  const [chuoiNgay, setChuoiNgay] = useState(null);
  const [loi, setLoi] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
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
            if (Array.isArray(j.ngay) && j.ngay.length > 0) setChuoiNgay(j.ngay);
            setLoi(null);
          } else if (!coDuLieuRef.current) {
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

  // Ngay cuoi cung trong chuoi la hom nay (xem layChuoiThanhKhoanHOSE) - so dang chay, cap nhat trong phien.
  const homNay = chuoiNgay?.length ? chuoiNgay[chuoiNgay.length - 1] : null;
  const cacNgayDaChot = chuoiNgay?.slice(0, -1) ?? []; // cac phien da xong (khong tinh hom nay dang chay)
  const homQua = cacNgayDaChot.length ? cacNgayDaChot[cacNgayDaChot.length - 1] : null;
  const tb20 =
    cacNgayDaChot.length >= 5 // it nhat vai phien moi tinh TB cho co y nghia
      ? cacNgayDaChot.slice(-20).reduce((s, x) => s + x.giaTriTy, 0) / cacNgayDaChot.slice(-20).length
      : null;

  const { diem, tyLeQuyDoi } = useMemo(() => {
    let tong = 0;
    const ds = [];
    for (const b of nen ?? []) {
      tong += b.v;
      ds.push({ t: b.t, cumKL: tong });
    }
    const ty = homNay?.giaTriTy > 0 && homNay?.klTrieu > 0 ? homNay.giaTriTy / homNay.klTrieu : null;
    return { diem: ds, tyLeQuyDoi: ty };
  }, [nen, homNay]);

  // Quy doi cum khoi luong (co phieu, tho) -> ty dong: (cumKL / 1e6 = trieu cp) * (ty dong / trieu cp).
  const diemTien = tyLeQuyDoi ? diem.map((p) => ({ t: p.t, giaTri: (p.cumKL / 1e6) * tyLeQuyDoi })) : [];
  const giaTriHienTai = diemTien.length ? diemTien[diemTien.length - 1].giaTri : homNay?.giaTriTy ?? null;

  const soSanhTB20 = giaTriHienTai != null && tb20 ? (giaTriHienTai / tb20 - 1) * 100 : null;
  const soSanhHomQua = giaTriHienTai != null && homQua ? (giaTriHienTai / homQua.giaTriTy - 1) * 100 : null;

  const LE_TRAI = 56;
  const LE_DUOI = 22;
  const rongVe = Math.max(240, rong - LE_TRAI - 12);
  const caoVe = CHIEU_CAO - LE_DUOI - 10;
  const maxY = Math.max(1, ...diemTien.map((p) => p.giaTri), tb20 ?? 0) * 1.08;
  const toaDo = diemTien.map((p, i) => {
    const x = diemTien.length > 1 ? (i / (diemTien.length - 1)) * rongVe : 0;
    const y = caoVe - (p.giaTri / maxY) * caoVe;
    return [x, y];
  });
  const duongPath = toaDo.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const vungPath = toaDo.length ? `${duongPath} L ${toaDo[toaDo.length - 1][0].toFixed(1)} ${caoVe} L 0 ${caoVe} Z` : "";
  const yTB20 = tb20 ? caoVe - (tb20 / maxY) * caoVe : null;

  function diChuot(e) {
    if (!toaDo.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let gan = 0;
    let khoangCachNhoNhat = Infinity;
    for (let i = 0; i < toaDo.length; i++) {
      const kc = Math.abs(toaDo[i][0] - x);
      if (kc < khoangCachNhoNhat) {
        khoangCachNhoNhat = kc;
        gan = i;
      }
    }
    setHoverIdx(gan);
  }

  const diemHover = hoverIdx != null ? diemTien[hoverIdx] : null;
  const toaDoHover = hoverIdx != null ? toaDo[hoverIdx] : null;

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <p className="text-xs uppercase tracking-wide" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
          Thanh khoản trong phiên (ước tính toàn sàn HOSE)
        </p>
        {giaTriHienTai != null && (
          <p className="text-lg" style={{ fontFamily: "'JetBrains Mono', monospace", color: PRIMARY, fontWeight: 700 }}>
            {tyDong(giaTriHienTai)} tỷ
          </p>
        )}
      </div>

      {(soSanhTB20 != null || soSanhHomQua != null) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {soSanhHomQua != null && (
            <span style={{ color: MUTED }}>
              So hôm qua ({tyDong(homQua.giaTriTy)} tỷ):{" "}
              <b style={{ color: soSanhHomQua >= 0 ? XANH : DO }}>{chuoiPct(soSanhHomQua)}</b>
            </span>
          )}
          {soSanhTB20 != null && (
            <span style={{ color: MUTED }}>
              So TB20 phiên ({tyDong(tb20)} tỷ):{" "}
              <b style={{ color: soSanhTB20 >= 0 ? XANH : DO }}>{chuoiPct(soSanhTB20)}</b>
            </span>
          )}
        </div>
      )}

      <p className="text-[11px] mb-3" style={{ color: MUTED }}>
        Ước tính từ hình dạng khối lượng khớp lệnh VN-Index trong phiên, quy đổi ra tiền theo tỷ lệ giá trị/khối lượng bình quân toàn sàn HOSE hôm nay
        (nguồn VNDirect) — số gần đúng, không phải đếm chính xác từng giao dịch. Rê chuột để xem số tại từng thời điểm.
      </p>

      <div ref={hopRef} className="w-full relative" style={{ height: CHIEU_CAO }}>
        {loi && !toaDo.length ? (
          <div className="h-full flex items-center justify-center text-sm" style={{ color: MUTED }}>
            {loi}
          </div>
        ) : toaDo.length > 0 ? (
          <svg width={rongVe + LE_TRAI + 12} height={CHIEU_CAO} style={{ display: "block" }}>
            <g transform={`translate(${LE_TRAI},10)`}>
              <defs>
                <linearGradient id="tkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PRIMARY} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={PRIMARY} stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Truc Y: 0 va gia tri cao nhat */}
              <text x={-8} y={caoVe} textAnchor="end" fontSize="10" fill={MUTED} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                0
              </text>
              <text x={-8} y={8} textAnchor="end" fontSize="10" fill={MUTED} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {tyDong(maxY)}
              </text>

              {yTB20 != null && (
                <>
                  <line x1={0} y1={yTB20} x2={rongVe} y2={yTB20} stroke={VANG} strokeWidth="1" strokeDasharray="4,3" opacity={0.7} />
                  <text x={rongVe} y={yTB20 - 3} textAnchor="end" fontSize="9" fill={VANG} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    TB20: {tyDong(tb20)} tỷ (cả phiên)
                  </text>
                </>
              )}

              <path d={vungPath} fill="url(#tkGradient)" />
              <path d={duongPath} fill="none" stroke={PRIMARY} strokeWidth="2" />

              {toaDoHover && (
                <>
                  <line x1={toaDoHover[0]} y1={0} x2={toaDoHover[0]} y2={caoVe} stroke={MUTED} strokeWidth="1" strokeDasharray="2,2" />
                  <circle cx={toaDoHover[0]} cy={toaDoHover[1]} r="3.5" fill={PRIMARY} stroke="#fff" strokeWidth="1" />
                </>
              )}

              <text x="0" y={caoVe + 16} fontSize="10" fill={MUTED} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {chuoiGio(diemTien[0].t)}
              </text>
              <text x={rongVe} y={caoVe + 16} textAnchor="end" fontSize="10" fill={MUTED} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {chuoiGio(diemTien[diemTien.length - 1].t)}
              </text>

              {/* Lop trong suot bat su kien di chuot tren toan vung ve */}
              <rect x={0} y={0} width={rongVe} height={caoVe} fill="transparent" onMouseMove={diChuot} onMouseLeave={() => setHoverIdx(null)} />
            </g>
          </svg>
        ) : (
          <div className="h-full flex items-center justify-center text-sm" style={{ color: MUTED }}>
            Đang tải dữ liệu phiên…
          </div>
        )}

        {diemHover && (
          <div
            className="absolute rounded-lg border px-2.5 py-1.5 text-xs"
            style={{
              left: Math.min(LE_TRAI + toaDoHover[0] + 8, rong - 140),
              top: 10,
              width: 130,
              pointerEvents: "none",
              borderColor: VIEN,
              background: "#0B0B10",
            }}
          >
            <p style={{ color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>{chuoiGio(diemHover.t)}</p>
            <p style={{ color: PRIMARY, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{tyDong(diemHover.giaTri)} tỷ</p>
          </div>
        )}
      </div>
    </div>
  );
}
