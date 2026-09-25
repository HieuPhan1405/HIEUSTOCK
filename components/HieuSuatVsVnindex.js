"use client";

import { useMemo, useState } from "react";
import { pct } from "@/components/dungChung";
import { ngayChuoi } from "@/lib/muaThemTinhToan";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const XANH = "#22C55E";
const DO = "#EF4444";

const ngayVN = (s) => (s ? s.split("-").reverse().join("/") : "—");

// So sanh lai/lo tung lenh dang mo voi VNINDEX CUNG KY (tu ngay mua den nay): vuot/thua thi truong bao nhieu.
// ds: cac lenh dang hien (da loc); vnindex: { nen: [{ t, c }] } lich su dong cua VNINDEX (tang dan) hoac null.
// Lenh mua vao hom nay (khong con phien nao de so) va lenh mua truoc cua so du lieu VNINDEX khong duoc tinh.
export function tinhSoSanhVnindex(ds, vnindex) {
  const nen = vnindex?.nen ?? [];
  if (nen.length < 2) return { dong: [], boQua: ds.length };
  const cuoi = nen[nen.length - 1];
  const dong = [];
  let boQua = 0;
  for (const r of ds) {
    const ngay = ngayChuoi(r.ngay_mua);
    const lai = Number(r.lai_lo_pct);
    if (!ngay || !Number.isFinite(lai) || ngay < nen[0].t || ngay >= cuoi.t) {
      boQua++;
      continue;
    }
    let goc = null;
    for (let i = nen.length - 1; i >= 0; i--) {
      if (nen[i].t <= ngay) {
        goc = nen[i];
        break;
      }
    }
    if (!goc || !(goc.c > 0)) {
      boQua++;
      continue;
    }
    const vn = (cuoi.c / goc.c - 1) * 100;
    // khoa: 1 ma co the co nhieu lenh (lenh goc + lenh mua them) nen khong dung rieng ma lam khoa.
    dong.push({ khoa: r.khoa_lenh ?? r.ma, ma: r.ma, ten: r.ten_lenh ?? r.ma, ngay, lai, vn, chenh: lai - vn });
  }
  dong.sort((a, b) => b.chenh - a.chenh);
  return { dong, boQua };
}

const mau = (v) => (v >= 0 ? XANH : DO);

export default function HieuSuatVsVnindex({ ds, vnindex }) {
  const { dong, boQua } = useMemo(() => tinhSoSanhVnindex(ds, vnindex), [ds, vnindex]);
  const [chon, setChon] = useState(null);

  const tk = useMemo(() => {
    const n = dong.length;
    if (!n) return null;
    const tb = (k) => dong.reduce((s, x) => s + x[k], 0) / n;
    return { n, lai: tb("lai"), vn: tb("vn"), chenh: tb("chenh"), vuot: dong.filter((x) => x.chenh > 0).length };
  }, [dong]);

  if (!vnindex?.nen?.length) return null;

  // Hinh hoc bieu do: cot = chenh lech (lai/lo cua ma tru VNINDEX cung ky), sap giam dan.
  const H = 220;
  const TREN = 14;
  const DUOI = 44;
  const TRAI = 44;
  const RONG_COT = 26;
  const W = Math.max(520, TRAI + dong.length * RONG_COT + 12);
  const cao = Math.max(0, ...dong.map((x) => x.chenh)) * 1.1;
  const thap = Math.min(0, ...dong.map((x) => x.chenh)) * 1.1;
  const bien = Math.max(cao - thap, 1);
  const y = (v) => TREN + ((cao - v) / bien) * (H - TREN - DUOI);
  const dongChon = dong.find((x) => x.khoa === chon) ?? null;

  return (
    <div className="mb-8 rounded-2xl border p-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: MUTED }}>
        So sánh với VNINDEX (cùng kỳ, tính từ ngày mua)
      </p>
      {!tk ? (
        <p className="text-sm py-6" style={{ color: MUTED }}>
          Chưa có lệnh nào đủ điều kiện so sánh (lệnh mới mua hôm nay hoặc mua trước cửa sổ dữ liệu VNINDEX không được tính).
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <span className="text-sm" style={{ color: MUTED }}>
              Lệnh đang mở TB <b style={{ color: mau(tk.lai), fontSize: 18 }}>{pct(tk.lai, 2)}</b>
            </span>
            <span className="text-sm" style={{ color: MUTED }}>
              VNINDEX cùng kỳ TB <b style={{ color: mau(tk.vn), fontSize: 18 }}>{pct(tk.vn, 2)}</b>
            </span>
            <span className="text-sm" style={{ color: MUTED }}>
              {tk.chenh >= 0 ? "Vượt" : "Thua"} thị trường <b style={{ color: mau(tk.chenh), fontSize: 18 }}>{pct(tk.chenh, 2)}</b>
            </span>
            <span className="text-sm" style={{ color: MUTED }}>
              <b style={{ color: TEXT }}>{tk.vuot}</b>/{tk.n} mã vượt VNINDEX
            </span>
          </div>

          <p className="text-xs mb-2 min-h-[16px]" style={{ color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>
            {dongChon ? (
              <>
                <b style={{ color: TEXT }}>{dongChon.ten}</b> · mua {ngayVN(dongChon.ngay)} · mã <b style={{ color: mau(dongChon.lai) }}>{pct(dongChon.lai, 2)}</b> · VNINDEX{" "}
                <b style={{ color: mau(dongChon.vn) }}>{pct(dongChon.vn, 2)}</b> · chênh <b style={{ color: mau(dongChon.chenh) }}>{pct(dongChon.chenh, 2)}</b>
              </>
            ) : (
              "Di chuột (hoặc chạm) vào 1 cột để xem chi tiết. Cột xanh = mã đang hơn VNINDEX cùng kỳ, đỏ = kém hơn."
            )}
          </p>

          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Chênh lệch lãi/lỗ từng mã so với VNINDEX cùng kỳ" style={{ display: "block", minWidth: W }}>
              {[cao, 0, thap].map((v, i) => (
                <g key={i}>
                  <line x1={TRAI} x2={W - 6} y1={y(v)} y2={y(v)} stroke={v === 0 ? "#3A3A47" : VIEN} strokeDasharray={v === 0 ? undefined : "3 4"} />
                  <text x={TRAI - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill={MUTED}>
                    {v === 0 ? "0" : `${v > 0 ? "+" : ""}${v.toFixed(0)}%`}
                  </text>
                </g>
              ))}
              {dong.map((x, i) => {
                const x0 = TRAI + i * RONG_COT + 4;
                const w = RONG_COT - 8;
                const yTren = y(Math.max(x.chenh, 0));
                const yDuoi = y(Math.min(x.chenh, 0));
                const laChon = chon === x.khoa;
                return (
                  <g key={x.khoa} onMouseEnter={() => setChon(x.khoa)} onMouseLeave={() => setChon(null)} onClick={() => setChon((c) => (c === x.khoa ? null : x.khoa))} style={{ cursor: "pointer" }}>
                    <rect x={TRAI + i * RONG_COT} y={TREN} width={RONG_COT} height={H - TREN - DUOI} fill="transparent" />
                    <rect x={x0} y={yTren} width={w} height={Math.max(yDuoi - yTren, 1)} rx="2" fill={mau(x.chenh)} opacity={laChon ? 1 : 0.8} />
                    <text
                      x={x0 + w / 2}
                      y={H - DUOI + 10}
                      textAnchor="end"
                      fontSize="9"
                      fill={laChon ? TEXT : MUTED}
                      transform={`rotate(-60 ${x0 + w / 2} ${H - DUOI + 10})`}
                      style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: laChon ? 700 : 400 }}
                    >
                      {x.ten}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </>
      )}
      <p className="text-[11px] mt-2" style={{ color: MUTED }}>
        Chênh lệch = lãi/lỗ của mã (theo giá mua ghi nhận) trừ mức tăng/giảm VNINDEX từ ngày mua đến hiện tại. VNINDEX lấy theo giá đóng cửa ngày mua nên chỉ mang tính tương đối
        {boQua > 0 ? ` (${boQua} lệnh chưa tính: mới mua hôm nay hoặc mua trước cửa sổ dữ liệu)` : ""}. Mỗi cột là một lệnh (mã có nhiều lệnh được đánh số, tính theo giá mua riêng của lệnh đó). Bộ lọc ở tab Lệnh đang mở áp dụng cho biểu đồ này.
      </p>
    </div>
  );
}
