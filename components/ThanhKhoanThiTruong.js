"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { dangTrongPhienGiaoDich } from "@/lib/khungGioVaoLenh";
import DinhGiaThiTruong from "@/components/DinhGiaThiTruong";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";
const XANH = "#22C55E";
const DO = "#EF4444";
const VANG = "#FBBF24";
const XAM = "#8B8B99";
const CHIEU_CAO = 300;
const PHUT_MO = 9 * 60; // 09:00
const PHUT_DONG = 15 * 60; // 15:00
const PHUT_ATC = 14 * 60 + 44; // nen ATC 14:45 xuat hien = phien da ket thuc

const so = (v, dp = 0) => (v == null || !Number.isFinite(v) ? "—" : v.toLocaleString("vi-VN", { maximumFractionDigits: dp }));
const chuoiPct = (v) => (v == null ? null : `${v >= 0 ? "+" : ""}${so(v, 1)}%`);
const gioPhut = (phut) => `${String(Math.floor(phut / 60)).padStart(2, "0")}:${String(phut % 60).padStart(2, "0")}`;
const ngayVN = (s) => (s ? s.split("-").reverse().join("/") : "");

// Phut trong ngay (gio Viet Nam, 0-1439) cua moc thoi gian epoch giay.
const phutTrongNgay = (t) => Math.floor(((t + 7 * 3600) % 86400) / 60);

// Duong TICH LUY cua 1 phien: nen phut [{ t, v }] -> [{ phut, giaTri (ty dong) }], quy doi de diem cuoi = tongTy (tong GTGD ngay do, khop + thoa thuan).
// Hinh dang lay tu KHOI LUONG khop tung phut cua VN-Index (DNSE); nguon cong khai khong co GTGD tung phut nen day la UOC LUONG (gia binh quan deu trong phien).
function duongTichLuy(nen, tongTy) {
  if (!nen?.length || !(tongTy > 0)) return [];
  const tongKL = nen.reduce((s, b) => s + b.v, 0);
  if (!(tongKL > 0)) return [];
  let cum = 0;
  const kq = [];
  for (const b of nen) {
    cum += b.v;
    const phut = phutTrongNgay(b.t);
    const giaTri = (cum / tongKL) * tongTy;
    const cuoi = kq[kq.length - 1];
    if (cuoi && cuoi.phut === phut) cuoi.giaTri = giaTri;
    else kq.push({ phut, giaTri });
  }
  return kq;
}

// Gia tri tich luy tai 1 phut bat ky (giu nguyen gia tri gan nhat truoc do; truoc phien dau = 0, sau phien cuoi = gia tri cuoi).
function giaTriTai(duong, phut) {
  if (!duong.length || phut < duong[0].phut) return 0;
  let v = duong[0].giaTri;
  for (const p of duong) {
    if (p.phut > phut) break;
    v = p.giaTri;
  }
  return v;
}

// Thanh khoan trong phien (VN-Index), quy ra TIEN (ty dong), so voi phien lien truoc va TB20 - kieu bieu do 2 vung chong nhau (hom nay / hom qua).
// Widget co 2 tab: Thanh khoan | Dinh gia (PE/PB thi truong).
export default function ThanhKhoanThiTruong({ ma = "VNINDEX" }) {
  const [tab, setTab] = useState("tk");
  const [du, setDu] = useState(null);
  const [loi, setLoi] = useState(null);
  const [hoverPhut, setHoverPhut] = useState(null);
  const [capNhat, setCapNhat] = useState(null);
  const hopRef = useRef(null);
  const [rong, setRong] = useState(720);
  const coDuLieuRef = useRef(false);

  useEffect(() => {
    if (tab !== "tk" || !hopRef.current) return;
    const quanSat = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr && cr.width > 0) setRong(Math.floor(cr.width));
    });
    quanSat.observe(hopRef.current);
    return () => quanSat.disconnect();
  }, [tab]);

  useEffect(() => {
    let huy = false;
    coDuLieuRef.current = false;
    function tai() {
      fetch(`/api/thanh-khoan?ma=${encodeURIComponent(ma)}`)
        .then((r) => r.json())
        .then((j) => {
          if (huy) return;
          if (j.trangThai === "ok" && Array.isArray(j.ngay) && j.ngay.length >= 2) {
            coDuLieuRef.current = true;
            setDu(j);
            setCapNhat(new Date());
            setLoi(null);
          } else if (!coDuLieuRef.current) {
            setLoi(j.thongBao || "Chưa có dữ liệu thanh khoản.");
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

  const m = useMemo(() => {
    if (!du) return null;
    const a = du.ngay[du.ngay.length - 1];
    const b = du.ngay[du.ngay.length - 2];
    const truoc = du.ngay.slice(0, -1).slice(-20); // 20 phien DA CHOT truoc phien moi nhat
    const tb20 = truoc.length >= 5 ? truoc.reduce((s, x) => s + x.giaTriTy, 0) / truoc.length : null;
    const duongA = duongTichLuy(du.nenA, a.giaTriTy);
    const duongB = duongTichLuy(du.nenB, b.giaTriTy);
    const phutCuoiA = duongA.length ? duongA[duongA.length - 1].phut : null;
    const daKetThuc = !du.laHomNay || (phutCuoiA != null && phutCuoiA >= PHUT_ATC);
    const giaTriA = duongA.length ? duongA[duongA.length - 1].giaTri : a.giaTriTy;
    // Dang chay: so voi CUNG THOI DIEM phien truoc (so ca phien voi nua phien la vo nghia). Da ket thuc: so ca phien.
    const gocB = daKetThuc ? b.giaTriTy : phutCuoiA != null && duongB.length ? giaTriTai(duongB, phutCuoiA) : null;
    return {
      a,
      b,
      tb20,
      duongA,
      duongB,
      daKetThuc,
      giaTriA,
      gocB,
      soHomQua: gocB > 0 ? (giaTriA / gocB - 1) * 100 : null,
      soTB20: tb20 && daKetThuc ? (giaTriA / tb20 - 1) * 100 : null,
      datTB20: tb20 && !daKetThuc ? (giaTriA / tb20) * 100 : null,
    };
  }, [du]);

  const LE_TRAI = 52;
  const LE_DUOI = 24;
  const LE_TREN = 14;
  const rongVe = Math.max(240, rong - LE_TRAI - 12);
  const caoVe = CHIEU_CAO - LE_DUOI - LE_TREN;
  const maxY = m ? Math.max(1, ...m.duongA.map((p) => p.giaTri), ...m.duongB.map((p) => p.giaTri), m.tb20 ?? 0) * 1.08 : 1;
  const x = (phut) => ((phut - PHUT_MO) / (PHUT_DONG - PHUT_MO)) * rongVe;
  const y = (v) => caoVe - (v / maxY) * caoVe;

  // Duong dang bac thang: cac khoang trong (nghi trua 11:30-13:00) giu nguyen gia tri roi nhay len khi phien chieu bat dau.
  const veDuong = (duong) => {
    let d = "";
    duong.forEach((p, i) => {
      if (i === 0) d += `M ${x(p.phut).toFixed(1)} ${caoVe} L ${x(p.phut).toFixed(1)} ${y(p.giaTri).toFixed(1)}`;
      else {
        if (p.phut - duong[i - 1].phut > 1) d += ` L ${x(p.phut).toFixed(1)} ${y(duong[i - 1].giaTri).toFixed(1)}`;
        d += ` L ${x(p.phut).toFixed(1)} ${y(p.giaTri).toFixed(1)}`;
      }
    });
    return d;
  };
  const dongVung = (duong) => (duong.length ? `${veDuong(duong)} L ${x(duong[duong.length - 1].phut).toFixed(1)} ${caoVe} Z` : "");
  const chiDuong = (duong) => veDuong(duong).replace(/^M [\d.]+ [\d.]+ L /, "M ");

  function diChuot(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    setHoverPhut(Math.max(PHUT_MO, Math.min(PHUT_DONG, Math.round(PHUT_MO + (px / rongVe) * (PHUT_DONG - PHUT_MO)))));
  }

  const trucX = [9 * 60, 10 * 60, 11 * 60, 12 * 60, 13 * 60, 14 * 60, 15 * 60];
  const trucY = m ? [0, 0.25, 0.5, 0.75, 1].map((f) => f * (maxY / 1.08)) : [];
  const hoverA = m && hoverPhut != null && m.duongA.length && hoverPhut >= m.duongA[0].phut && hoverPhut <= m.duongA[m.duongA.length - 1].phut ? giaTriTai(m.duongA, hoverPhut) : null;
  const hoverB = m && hoverPhut != null && m.duongB.length ? giaTriTai(m.duongB, hoverPhut) : null;
  const nhanA = du?.laHomNay ? "Hôm nay" : `Phiên ${ngayVN(m?.a.ngay).slice(0, 5)}`;
  const nhanB = du?.laHomNay ? "Hôm qua" : `Phiên ${ngayVN(m?.b.ngay).slice(0, 5)}`;
  const chuoiCapNhat = capNhat ? capNhat.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) : "";

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex items-center gap-1 mb-4 text-sm" style={{ fontFamily: "'Inter', sans-serif" }} role="tablist">
        {[
          ["tk", "Thanh khoản"],
          ["dg", "Định giá PE/PB"],
        ].map(([k, nhan]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className="px-3 py-1.5 rounded-lg"
            style={tab === k ? { background: PRIMARY, color: "#fff", fontWeight: 700 } : { color: MUTED }}
          >
            {nhan}
          </button>
        ))}
      </div>

      {tab === "dg" ? (
        <DinhGiaThiTruong />
      ) : !m ? (
        <div className="h-[300px] flex items-center justify-center text-sm" style={{ color: MUTED }}>
          {loi || "Đang tải dữ liệu thanh khoản…"}
        </div>
      ) : (
        <>
          <p className="text-center text-sm sm:text-base mb-1" style={{ color: TEXT, fontFamily: "'Inter', sans-serif" }}>
            Thanh khoản VN-Index {m.daKetThuc ? "đạt" : "hiện"} <b style={{ color: PRIMARY }}>{so(m.giaTriA)} tỷ đồng</b>
            {m.soHomQua != null && (
              <>
                , <b style={{ color: m.soHomQua >= 0 ? XANH : DO }}>{m.soHomQua >= 0 ? "tăng" : "giảm"} {so(Math.abs(m.soHomQua), 1)}%</b> so với{" "}
                {m.daKetThuc ? `${nhanB.toLowerCase()} (${so(m.b.giaTriTy)} tỷ)` : `cùng thời điểm ${nhanB.toLowerCase()} (${so(m.gocB)} tỷ)`}
              </>
            )}
          </p>
          <p className="text-center text-xs mb-3" style={{ color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>
            {m.tb20 != null && (
              <>
                TB20 phiên: <b style={{ color: VANG }}>{so(m.tb20)} tỷ</b>
                {m.soTB20 != null && (
                  <>
                    {" "}
                    · {m.soTB20 >= 0 ? "cao" : "thấp"} hơn TB20 <b style={{ color: m.soTB20 >= 0 ? XANH : DO }}>{so(Math.abs(m.soTB20), 1)}%</b>
                  </>
                )}
                {m.datTB20 != null && (
                  <>
                    {" "}
                    · đã đạt <b style={{ color: TEXT }}>{so(m.datTB20)}%</b> mức TB20 cả phiên
                  </>
                )}
              </>
            )}
            {m.a.thoaThuanTy > 0 && <> · trong đó thoả thuận {so(m.a.thoaThuanTy)} tỷ</>}
          </p>

          <div className="grid gap-4 lg:grid-cols-[1fr_210px]">
            <div>
              <div ref={hopRef} className="w-full relative" style={{ height: CHIEU_CAO }}>
                <svg width={rongVe + LE_TRAI + 12} height={CHIEU_CAO} style={{ display: "block" }} role="img" aria-label="Thanh khoản tích luỹ trong phiên: hôm nay so với hôm qua và TB20">
                  <g transform={`translate(${LE_TRAI},${LE_TREN})`}>
                    <defs>
                      <linearGradient id="tkHomNay" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={PRIMARY} stopOpacity="0.45" />
                        <stop offset="100%" stopColor={PRIMARY} stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    {trucY.map((v) => (
                      <g key={v}>
                        <line x1={0} x2={rongVe} y1={y(v)} y2={y(v)} stroke={VIEN} />
                        <text x={-8} y={y(v) + 3} textAnchor="end" fontSize="10" fill={MUTED} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {so(v)}
                        </text>
                      </g>
                    ))}
                    {trucX.map((p) => (
                      <text key={p} x={x(p)} y={caoVe + 16} textAnchor="middle" fontSize="10" fill={MUTED} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {gioPhut(p)}
                      </text>
                    ))}

                    {/* Phien truoc: vung xam */}
                    <path d={dongVung(m.duongB)} fill={XAM} opacity="0.22" />
                    <path d={chiDuong(m.duongB)} fill="none" stroke={XAM} strokeWidth="1.2" opacity="0.7" />
                    {/* Phien moi nhat: vung tim */}
                    <path d={dongVung(m.duongA)} fill="url(#tkHomNay)" />
                    <path d={chiDuong(m.duongA)} fill="none" stroke={PRIMARY} strokeWidth="2" />

                    {m.tb20 != null && (
                      <>
                        <line x1={0} y1={y(m.tb20)} x2={rongVe} y2={y(m.tb20)} stroke={VANG} strokeWidth="1.2" strokeDasharray="5,4" opacity={0.85} />
                        <text x={4} y={y(m.tb20) - 4} textAnchor="start" fontSize="10" fill={VANG} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          TB20 phiên: {so(m.tb20)} tỷ
                        </text>
                      </>
                    )}

                    {m.duongA.length > 0 && (
                      <>
                        <circle cx={x(m.duongA[m.duongA.length - 1].phut)} cy={y(m.giaTriA)} r="3.5" fill={PRIMARY} stroke="#fff" strokeWidth="1" />
                        <text
                          x={Math.min(x(m.duongA[m.duongA.length - 1].phut), rongVe - 2)}
                          y={Math.max(y(m.giaTriA) - 8, 10)}
                          textAnchor="end"
                          fontSize="11"
                          fontWeight="700"
                          fill={PRIMARY}
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {so(m.giaTriA)}
                        </text>
                      </>
                    )}

                    {hoverPhut != null && <line x1={x(hoverPhut)} y1={0} x2={x(hoverPhut)} y2={caoVe} stroke={MUTED} strokeWidth="1" strokeDasharray="2,2" />}
                    <rect x={0} y={0} width={rongVe} height={caoVe} fill="transparent" onMouseMove={diChuot} onMouseLeave={() => setHoverPhut(null)} />
                  </g>
                </svg>

                {hoverPhut != null && (
                  <div
                    className="absolute rounded-lg border px-2.5 py-1.5 text-xs"
                    style={{ left: Math.min(LE_TRAI + x(hoverPhut) + 10, rong - 150), top: 6, width: 140, pointerEvents: "none", borderColor: VIEN, background: "#0B0B10", fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <p style={{ color: MUTED }}>{gioPhut(hoverPhut)}</p>
                    <p style={{ color: PRIMARY, fontWeight: 700 }}>
                      {nhanA}: {hoverA != null ? `${so(hoverA)} tỷ` : "—"}
                    </p>
                    <p style={{ color: XAM }}>
                      {nhanB}: {hoverB != null ? `${so(hoverB)} tỷ` : "—"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-[11px]" style={{ color: MUTED }}>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: PRIMARY }} />
                    {nhanA}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: XAM, opacity: 0.6 }} />
                    {nhanB}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-4 border-t border-dashed" style={{ borderColor: VANG }} />
                    TB20 phiên
                  </span>
                </div>
                {chuoiCapNhat && <span>Cập nhật {chuoiCapNhat}</span>}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                Top GTGD {du.laHomNay ? "hôm nay" : `phiên ${ngayVN(m.a.ngay).slice(0, 5)}`}
              </p>
              <ul className="text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {(du.top ?? []).map((t, i) => (
                  <li key={t.ma} className={`flex items-center justify-between py-1.5 ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "#1D1D26" }}>
                    <Link href={`/ma/${t.ma}`} className="hover:underline" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                      {t.ma}
                    </Link>
                    <span className="text-xs" style={{ color: MUTED }}>
                      {so(t.giaTriTy)} tỷ
                    </span>
                    <span className="text-xs w-14 text-right" style={{ color: t.pct >= 0 ? XANH : DO }}>
                      {chuoiPct(t.pct)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-[11px] mt-3" style={{ color: MUTED }}>
            GTGD tổng = khớp lệnh + thoả thuận toàn sàn HOSE (nguồn VNDirect). Hình dạng đường trong phiên lấy từ khối lượng khớp lệnh từng phút của VN-Index (DNSE) rồi quy đổi ra tiền cho khớp tổng GTGD từng
            ngày — số ước tính, không phải đếm chính xác từng giao dịch. {m.daKetThuc ? "" : "Phiên đang chạy: so với cùng thời điểm của phiên trước. "}Rê chuột để xem số tại từng thời điểm.
          </p>
        </>
      )}
    </div>
  );
}
