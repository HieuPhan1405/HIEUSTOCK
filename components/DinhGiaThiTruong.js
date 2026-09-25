"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { thongKeMang } from "@/lib/tinhDinhGia";

const VIEN = "#26262F";
const MUTED = "#8B8B99";
const TEXT = "#F5F5F7";
const PRIMARY = "#6C5CE7";
const XANH = "#22C55E";
const DO = "#EF4444";
const VANG = "#FBBF24";
const CHIEU_CAO = 250;

const so = (v, dp = 1) => (v == null || !Number.isFinite(v) ? "—" : v.toLocaleString("vi-VN", { minimumFractionDigits: dp, maximumFractionDigits: dp }));
const ngayVN = (s) => (s ? s.split("-").reverse().join("/") : "");
const thangNam = (s) => `${s.slice(5, 7)}/${s.slice(0, 4)}`;

// Nhan dinh theo vi tri so voi lich su (do lech chuan tu trung binh): gia tri cang thap so voi lich su cang "re".
function nhanDinh(z) {
  if (z == null) return null;
  if (z <= -1) return { nhan: "Rẻ", mau: XANH };
  if (z <= -0.4) return { nhan: "Khá rẻ", mau: XANH };
  if (z < 0.4) return { nhan: "Hợp lý", mau: VANG };
  if (z < 1) return { nhan: "Khá đắt", mau: DO };
  return { nhan: "Đắt", mau: DO };
}

// Trung binh cua N diem thang gan nhat (lichSu tang dan theo thang).
const tbGanNhat = (lichSu, n) => (lichSu.length >= Math.min(n, 6) ? lichSu.slice(-n).reduce((s, v) => s + v, 0) / Math.min(n, lichSu.length) : null);

function TheChiSo({ ten, hienTai, lichSu, doLech, tbLichSu, tuNgay }) {
  const z = doLech > 0 && tbLichSu != null ? (hienTai - tbLichSu) / doLech : null;
  const nd = nhanDinh(z);
  const tb = { tb1n: tbGanNhat(lichSu, 12), tb3n: tbGanNhat(lichSu, 36), tb5n: tbGanNhat(lichSu, 60) };
  const caoHon = lichSu.length ? (lichSu.filter((v) => v > hienTai).length / lichSu.length) * 100 : null;
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: VIEN }}>
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-wide" style={{ color: MUTED }}>
          {ten} thị trường (HOSE)
        </p>
        {nd && (
          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: nd.mau, border: `1px solid ${nd.mau}` }}>
            {nd.nhan}
          </span>
        )}
      </div>
      <p className="text-3xl mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: PRIMARY }}>
        {so(hienTai, 2)}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {[
          ["TB 1 năm", tb.tb1n],
          ["TB 3 năm", tb.tb3n],
          ["TB 5 năm", tb.tb5n],
        ].map(([nhan, v]) => (
          <div key={nhan}>
            <p style={{ color: MUTED }}>{nhan}</p>
            <p style={{ color: TEXT }}>{so(v, 2)}</p>
            {v > 0 && (
              <p style={{ color: hienTai >= v ? DO : XANH }}>
                {hienTai >= v ? "+" : ""}
                {so((hienTai / v - 1) * 100, 1)}%
              </p>
            )}
          </div>
        ))}
      </div>
      {caoHon != null && (
        <p className="text-[11px] mt-2" style={{ color: MUTED }}>
          {ten} hiện tại thấp hơn {so(caoHon, 0)}% số tháng kể từ {thangNam(tuNgay ?? "2018-01-01")}.
        </p>
      )}
    </div>
  );
}

export default function DinhGiaThiTruong() {
  const [du, setDu] = useState(null);
  const [loi, setLoi] = useState(null);
  const [chiSo, setChiSo] = useState("pe");
  const [hover, setHover] = useState(null);
  const hopRef = useRef(null);
  const [rong, setRong] = useState(720);

  useEffect(() => {
    let huy = false;
    fetch("/api/dinh-gia-thi-truong")
      .then((r) => r.json())
      .then((j) => {
        if (huy) return;
        if (j.trangThai === "ok") setDu(j);
        else setLoi(j.thongBao || "Chưa có dữ liệu định giá.");
      })
      .catch(() => {
        if (!huy) setLoi("Không kết nối được máy chủ.");
      });
    return () => {
      huy = true;
    };
  }, []);

  useEffect(() => {
    if (!hopRef.current) return;
    const quanSat = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr && cr.width > 0) setRong(Math.floor(cr.width));
    });
    quanSat.observe(hopRef.current);
    return () => quanSat.disconnect();
  }, [du]);

  // Chuoi diem: lich su hang thang + diem HIEN TAI (tinh truc tiep tu du lieu moi nhat).
  const diem = useMemo(() => {
    if (!du) return [];
    const ds = du.lichSu.filter((p) => p[chiSo] > 0).map((p) => ({ ngay: p.ngay, v: p[chiSo] }));
    const hienTai = du[chiSo].hienTai;
    if (hienTai > 0) ds.push({ ngay: du.ngay, v: hienTai, hienTai: true });
    return ds;
  }, [du, chiSo]);

  const tk = useMemo(() => thongKeMang(diem.map((d) => d.v)), [diem]);
  // Thong ke LICH SU (khong gom diem hien tai) - lam moc "re/dat" cho the PE/PB.
  const tkPE = useMemo(() => thongKeMang(du ? du.lichSu.map((p) => p.pe) : []), [du]);
  const tkPB = useMemo(() => thongKeMang(du ? du.lichSu.map((p) => p.pb) : []), [du]);

  if (!du) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm" style={{ color: MUTED }}>
        {loi || "Đang tải dữ liệu định giá…"}
      </div>
    );
  }

  const LE_TRAI = 40;
  const LE_DUOI = 22;
  const LE_TREN = 12;
  const rongVe = Math.max(240, rong - LE_TRAI - 12);
  const caoVe = CHIEU_CAO - LE_DUOI - LE_TREN;
  const cao = Math.max(...diem.map((d) => d.v), (tk.tb ?? 0) + (tk.doLech ?? 0)) * 1.06;
  const thap = Math.min(...diem.map((d) => d.v), (tk.tb ?? 0) - (tk.doLech ?? 0)) * 0.94;
  const x = (i) => (diem.length > 1 ? (i / (diem.length - 1)) * rongVe : 0);
  const y = (v) => caoVe - ((v - thap) / (cao - thap)) * caoVe;
  const duong = diem.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.v).toFixed(1)}`).join(" ");
  const cuoi = diem[diem.length - 1];
  const dp = chiSo === "pe" ? 1 : 2;
  const chiTiet = du[chiSo];

  function diChuot(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    setHover(Math.max(0, Math.min(diem.length - 1, Math.round((px / rongVe) * (diem.length - 1)))));
  }

  const nam = [...new Set(diem.map((d) => d.ngay.slice(0, 4)))];
  const nhan = chiSo === "pe" ? "PE" : "PB";

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 mb-4">
        <TheChiSo ten="PE" hienTai={du.pe.hienTai} lichSu={du.lichSu.map((p) => p.pe).filter((v) => v > 0)} doLech={tkPE.doLech} tbLichSu={tkPE.tb} tuNgay={du.lichSu[0]?.ngay} />
        <TheChiSo ten="PB" hienTai={du.pb.hienTai} lichSu={du.lichSu.map((p) => p.pb).filter((v) => v > 0)} doLech={tkPB.doLech} tbLichSu={tkPB.tb} tuNgay={du.lichSu[0]?.ngay} />
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wide" style={{ color: MUTED }}>
          {nhan} thị trường theo tháng (từ {thangNam(diem[0].ngay)})
        </p>
        <div className="flex gap-1 text-xs">
          {[
            ["pe", "PE"],
            ["pb", "PB"],
          ].map(([k, n]) => (
            <button key={k} onClick={() => setChiSo(k)} className="px-2.5 py-1 rounded-lg" style={chiSo === k ? { background: PRIMARY, color: "#fff", fontWeight: 700 } : { color: MUTED, border: `1px solid ${VIEN}` }}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div ref={hopRef} className="w-full relative" style={{ height: CHIEU_CAO }}>
        <svg width={rongVe + LE_TRAI + 12} height={CHIEU_CAO} style={{ display: "block" }} role="img" aria-label={`${nhan} thị trường theo tháng so với trung bình lịch sử`}>
          <g transform={`translate(${LE_TRAI},${LE_TREN})`}>
            {/* Vung trung binh +- 1 do lech chuan */}
            <rect x={0} y={y(tk.tb + tk.doLech)} width={rongVe} height={Math.max(y(tk.tb - tk.doLech) - y(tk.tb + tk.doLech), 0)} fill={PRIMARY} opacity="0.1" />
            {[tk.tb + tk.doLech, tk.tb, tk.tb - tk.doLech].map((v, i) => (
              <g key={i}>
                <line x1={0} x2={rongVe} y1={y(v)} y2={y(v)} stroke={i === 1 ? VANG : MUTED} strokeDasharray={i === 1 ? "5,4" : "2,4"} opacity={i === 1 ? 0.8 : 0.45} />
                <text x={-6} y={y(v) + 3} textAnchor="end" fontSize="9" fill={i === 1 ? VANG : MUTED} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {so(v, dp)}
                </text>
              </g>
            ))}
            <text x={rongVe} y={y(tk.tb) - 4} textAnchor="end" fontSize="10" fill={VANG} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              TB {so(tk.tb, dp)} (±1 độ lệch chuẩn: {so(tk.tb - tk.doLech, dp)} – {so(tk.tb + tk.doLech, dp)})
            </text>
            <path d={duong} fill="none" stroke={PRIMARY} strokeWidth="2" />
            {nam.map((n) => {
              const i = diem.findIndex((d) => d.ngay.startsWith(n));
              return i >= 0 ? (
                <text key={n} x={x(i)} y={caoVe + 16} fontSize="10" fill={MUTED} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {n}
                </text>
              ) : null;
            })}
            <circle cx={x(diem.length - 1)} cy={y(cuoi.v)} r="4" fill={PRIMARY} stroke="#fff" strokeWidth="1.2" />
            <text x={x(diem.length - 1) - 8} y={y(cuoi.v) - 8} textAnchor="end" fontSize="11" fontWeight="700" fill={PRIMARY} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {so(cuoi.v, 2)}
            </text>
            {hover != null && (
              <>
                <line x1={x(hover)} x2={x(hover)} y1={0} y2={caoVe} stroke={MUTED} strokeDasharray="2,2" />
                <circle cx={x(hover)} cy={y(diem[hover].v)} r="3.5" fill={PRIMARY} stroke="#fff" strokeWidth="1" />
              </>
            )}
            <rect x={0} y={0} width={rongVe} height={caoVe} fill="transparent" onMouseMove={diChuot} onMouseLeave={() => setHover(null)} />
          </g>
        </svg>
        {hover != null && (
          <div
            className="absolute rounded-lg border px-2.5 py-1.5 text-xs"
            style={{ left: Math.min(LE_TRAI + x(hover) + 10, rong - 130), top: 6, width: 120, pointerEvents: "none", borderColor: VIEN, background: "#0B0B10", fontFamily: "'JetBrains Mono', monospace" }}
          >
            <p style={{ color: MUTED }}>{diem[hover].hienTai ? `Hiện tại (${ngayVN(diem[hover].ngay)})` : thangNam(diem[hover].ngay)}</p>
            <p style={{ color: PRIMARY, fontWeight: 700 }}>
              {nhan}: {so(diem[hover].v, 2)}
            </p>
          </div>
        )}
      </div>

      {du.theoNganh?.length > 0 && (
        <div className="mt-5">
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: MUTED }}>
            PE / PB theo ngành (so với toàn thị trường: PE {so(du.pe.hienTai, 1)} · PB {so(du.pb.hienTai, 2)})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <thead>
                <tr className="text-left border-b" style={{ borderColor: VIEN, color: MUTED, fontFamily: "'Inter', sans-serif" }}>
                  <th className="py-2 pr-3 font-normal">Ngành</th>
                  <th className="py-2 px-3 font-normal text-right">PE</th>
                  <th className="py-2 px-3 font-normal text-right">PB</th>
                  <th className="py-2 px-3 font-normal text-right">Số mã</th>
                  <th className="py-2 pl-3 font-normal text-right">Vốn hoá (nghìn tỷ)</th>
                </tr>
              </thead>
              <tbody>
                {du.theoNganh.map((n, i) => (
                  <tr key={n.nganh} className={i > 0 ? "border-t" : ""} style={{ borderColor: "#1D1D26" }}>
                    <td className="py-2 pr-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {n.nhan}
                    </td>
                    <td className="py-2 px-3 text-right" style={{ color: n.pe == null ? MUTED : n.pe <= du.pe.hienTai ? XANH : DO }}>
                      {so(n.pe, 1)}
                    </td>
                    <td className="py-2 px-3 text-right" style={{ color: n.pb == null ? MUTED : n.pb <= du.pb.hienTai ? XANH : DO }}>
                      {so(n.pb, 2)}
                    </td>
                    <td className="py-2 px-3 text-right" style={{ color: MUTED }}>
                      {n.soMa}
                    </td>
                    <td className="py-2 pl-3 text-right">{so(n.vonHoaTy / 1000, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[11px] mt-3" style={{ color: MUTED }}>
        PE/PB thị trường = tổng vốn hoá chia tổng lợi nhuận (hoặc vốn chủ sở hữu) của {chiTiet.soMa} mã HOSE có PE/PB dương (phủ {so(chiTiet.phuVonHoaPct, 0)}% vốn hoá, nguồn VNDirect, cập nhật {ngayVN(du.ngay)}).
        Các mốc &quot;TB 1/3/5 năm&quot; là trung bình 12/36/60 điểm cuối tháng gần nhất của chính chuỗi biểu đồ, không phải chuỗi chính thức của VN-Index. Biểu đồ tháng tính theo cách trên với danh sách mã theo hiện tại
        (thiếu các mã đã huỷ niêm yết) và dừng ở cuối tháng trước. Nhãn Rẻ/Đắt chỉ so với chính lịch sử từ {thangNam(du.lichSu[0]?.ngay ?? "2018-01-01")} của thị trường, không phải khuyến nghị đầu tư.
      </p>
    </div>
  );
}
