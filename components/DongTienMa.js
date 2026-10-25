"use client";

import { useEffect, useMemo, useState } from "react";
import { soVN } from "@/lib/soVN";
import { ThanhMuaBan, ty } from "@/components/DongTienThiTruong";

// KHOI "DONG TIEN TRONG PHIEN" o trang tung ma (du lieu DNSE qua /api/dong-tien?ma=): mua / ban chu dong, theo co lenh, khoi ngoai, delta tich luy theo phut, volume profile hom nay, 6 phien truoc.
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const sans = { fontFamily: "var(--font-chu)" };
const CHU_KY_MS = 20_000;

const dau = (trieu, chuSo = 1) => (trieu == null ? "—" : `${trieu > 0 ? "+" : ""}${ty(trieu, chuSo)}`);
const mau = (v) => (v == null || v === 0 ? MUTED : v > 0 ? XANH : DO);
const gio = (iso) => (iso ? new Date(iso).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "");
const ngayVN = (s) => (s ? s.split("-").reverse().join("/") : "");
const ngayNgan = (s) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : "");

// Vung gia tri 70% (value area) quanh POC: mo rong dan sang muc ke ben co KL lon hon cho toi khi du 70% tong KL. rows da sap theo gia TANG.
export function vungGiaTri(rows, tiLe = 0.7) {
  if (!rows.length) return null;
  const tong = rows.reduce((s, r) => s + r.t, 0);
  let poc = 0;
  rows.forEach((r, i) => {
    if (r.t > rows[poc].t) poc = i;
  });
  let lo = poc, hi = poc, tich = rows[poc].t;
  while (tich < tong * tiLe && (lo > 0 || hi < rows.length - 1)) {
    const duoi = lo > 0 ? rows[lo - 1].t : -1, tren = hi < rows.length - 1 ? rows[hi + 1].t : -1;
    if (tren >= duoi) tich += rows[++hi].t;
    else tich += rows[--lo].t;
  }
  return { poc, lo, hi };
}

function BieuDoDelta({ phut }) {
  const d = useMemo(() => phut.reduce((kq, [k, m, b]) => [...kq, { k, lk: (kq.length ? kq[kq.length - 1].lk : 0) + m - b }], []), [phut]);
  if (d.length < 2) return <p className="text-xs" style={{ color: MUTED }}>Chưa đủ dữ liệu theo phút.</p>;
  const W = 640, H = 150, L = 8, R = 56, T = 10, B = 20;
  const lo = Math.min(0, ...d.map((x) => x.lk)), hi = Math.max(0, ...d.map((x) => x.lk));
  const bien = hi - lo || 1;
  const x = (i) => L + (i / (d.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / bien) * (H - T - B);
  const cuoi = d[d.length - 1].lk;
  const duong = d.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.lk).toFixed(1)}`).join(" ");
  const nhan = d.filter((p) => ["09:15", "10:00", "11:00", "13:30", "14:00", "14:30"].includes(p.k));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Delta tích lũy mua trừ bán chủ động theo phút">
      <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke={VIEN} strokeDasharray="3 3" />
      <path d={`${duong} L${x(d.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={cuoi >= 0 ? XANH : DO} opacity="0.15" />
      <path d={duong} fill="none" stroke={cuoi >= 0 ? XANH : DO} strokeWidth="1.8" />
      <text x={W - R + 4} y={y(cuoi) + 4} fontSize="11" fill={cuoi >= 0 ? XANH : DO} fontWeight="700">{dau(cuoi, 1)} tỷ</text>
      {nhan.map((p) => {
        const i = d.indexOf(p);
        return (
          <text key={p.k} x={x(i)} y={H - 5} fontSize="9" fill={MUTED} textAnchor="middle">{p.k}</text>
        );
      })}
    </svg>
  );
}

function VolumeProfile({ profile, gia }) {
  // t = KL khop lien tuc (mua + ban chu dong): ATO / ATC (k) thuong don ve 1 muc gia rat lon nen KHONG dung de chia ti le thanh, chi ghi chu ben phai
  const rows = useMemo(() => profile.map(([g, m, b, k]) => ({ g, m, b, k, t: m + b })).sort((a, b) => a.g - b.g), [profile]);
  const va = useMemo(() => vungGiaTri(rows), [rows]);
  if (!rows.length) return <p className="text-xs" style={{ color: MUTED }}>Chưa có dữ liệu khớp.</p>;
  const maxT = Math.max(...rows.map((r) => r.t)) || 1;
  const gioiHan = [...rows].reverse(); // gia cao o tren
  const idxCuaGia = (r) => rows.indexOf(r);
  const gan = gia != null ? rows.reduce((p, r) => (Math.abs(r.g - gia) < Math.abs(p.g - gia) ? r : p), rows[0]) : null;
  const RH = 14, LBL = 46, W = 460;
  return (
    <svg viewBox={`0 0 ${W} ${gioiHan.length * RH + 4}`} className="w-full h-auto" role="img" aria-label="Volume profile trong ngày">
      {gioiHan.map((r, vi) => {
        const i = idxCuaGia(r);
        const trongVA = va && i >= va.lo && i <= va.hi;
        const y0 = vi * RH + 2;
        const dai = (v) => (v / maxT) * (W - LBL - 6);
        const xm = LBL;
        return (
          <g key={r.g}>
            {trongVA && <rect x={0} y={y0 - 1} width={W} height={RH} fill={VANG} opacity="0.08" />}
            <text x={LBL - 4} y={y0 + 10} fontSize="9.5" textAnchor="end" fill={r === gan ? TEXT : MUTED} fontWeight={r === gan ? 700 : 400}>{soVN(r.g, 2)}</text>
            <rect x={xm} y={y0} width={dai(r.m)} height={RH - 3} fill={XANH} opacity="0.85" />
            <rect x={xm + dai(r.m)} y={y0} width={dai(r.b)} height={RH - 3} fill={DO} opacity="0.85" />
            {va && i === va.poc && <text x={xm + dai(r.t) + 4} y={y0 + 10} fontSize="9" fill={VANG} fontWeight="700">POC</text>}
            {r.k > 0 && <text x={W - 2} y={y0 + 10} fontSize="8.5" textAnchor="end" fill={MUTED}>ATO/ATC {soVN(r.k, 0)}</text>}
            {r === gan && <text x={xm + dai(r.t) + (va && i === va.poc ? 30 : 4)} y={y0 + 10} fontSize="9" fill={TEXT}>◀ giá hiện tại</text>}
          </g>
        );
      })}
    </svg>
  );
}

function CoLenh({ ten, g, mo }) {
  const ron = (g?.mua ?? 0) - (g?.ban ?? 0);
  return (
    <tr className="border-t" style={{ borderColor: "var(--vien-nhe)" }}>
      <td className="py-1.5 pr-2">{ten}<span className="block text-[10px]" style={{ color: MUTED }}>{mo}</span></td>
      <td className="py-1.5 px-2 text-right" style={{ color: XANH }}>{ty(g?.mua)}</td>
      <td className="py-1.5 px-2 text-right" style={{ color: DO }}>{ty(g?.ban)}</td>
      <td className="py-1.5 px-2 text-right" style={{ color: mau(ron), fontWeight: 700 }}>{dau(ron)}</td>
      <td className="py-1.5 pl-2 text-right" style={{ color: MUTED }}>{g?.soLenh ?? 0}</td>
    </tr>
  );
}

export default function DongTienMa({ ma }) {
  const [d, setD] = useState({ trangThai: "tai", du: null });
  useEffect(() => {
    let dung = false;
    const tai = async () => {
      try {
        const r = await fetch(`/api/dong-tien?ma=${encodeURIComponent(ma)}`, { cache: "no-store" });
        if (dung) return;
        if (r.status === 401) return setD({ trangThai: "khoa", du: null });
        const j = await r.json();
        setD({ trangThai: j.du ? "co" : "rong", du: j.du ?? null });
      } catch {
        /* giu du lieu cu */
      }
    };
    tai();
    const t = setInterval(() => document.visibilityState === "visible" && tai(), CHU_KY_MS);
    return () => {
      dung = true;
      clearInterval(t);
    };
  }, [ma]);

  if (d.trangThai === "tai") return null;
  const du = d.du;
  const t = du?.tomTat;
  const lon = t?.lon, vua = t?.vua, nho = t?.nho;
  return (
    <section className="rounded-2xl border p-5 mb-4" style={{ borderColor: VIEN, background: NEN_CARD, color: TEXT }} aria-label={`Dòng tiền trong phiên của ${ma}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-lg" style={{ ...sans, fontWeight: 700 }}>Dòng tiền trong phiên</h2>
        {du && <span className="text-xs" style={{ color: MUTED }}>Phiên {ngayVN(du.ngay)} · cập nhật {gio(du.capNhat)}</span>}
      </div>
      {d.trangThai === "khoa" && <p className="text-sm" style={{ color: MUTED }}>Đăng nhập tài khoản đã được duyệt để xem dòng tiền thời gian thực của mã này.</p>}
      {d.trangThai === "rong" && <p className="text-sm" style={{ color: MUTED }}>Chưa có dữ liệu dòng tiền cho {ma} (dịch vụ chạy trong giờ giao dịch, thứ 2–6).</p>}
      {du && t && (
        <>
          <p className="text-xs mb-3" style={{ color: MUTED }}>
            Mua chủ động = lệnh MUA đặt giá chào bán (kéo giá lên). Không tính khớp ATO/ATC. Cỡ lệnh gộp các lần khớp liên tiếp của cùng một lệnh; ước lượng, không phải dữ liệu nhóm nhà đầu tư.
          </p>
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <div>
              <ThanhMuaBan mua={t.mua} ban={t.ban} cao={12} />
              <div className="flex justify-between text-sm mt-2">
                <span>Mua chủ động <b style={{ color: XANH }}>{ty(t.mua)} tỷ</b></span>
                <span>Bán chủ động <b style={{ color: DO }}>{ty(t.ban)} tỷ</b></span>
              </div>
              <p className="mt-2 text-2xl" style={{ fontWeight: 800, color: mau(t.rong) }}>
                {dau(t.rong)} tỷ <span className="text-xs" style={{ color: MUTED, fontWeight: 400 }}>ròng chủ động · KL khớp {soVN(t.kl, 0)} cp</span>
              </p>
              {(t.ato > 0 || t.atc > 0) && (
                <p className="text-xs mt-1" style={{ color: MUTED }}>
                  Khớp định kỳ (không tính ở trên): ATO {soVN(t.ato, 0)} cp · ATC {soVN(t.atc, 0)} cp
                </p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-right" style={{ color: MUTED }}>
                    <th className="py-1 pr-2 font-normal text-left">Cỡ lệnh</th>
                    <th className="py-1 px-2 font-normal">Mua (tỷ)</th>
                    <th className="py-1 px-2 font-normal">Bán (tỷ)</th>
                    <th className="py-1 px-2 font-normal">Ròng</th>
                    <th className="py-1 pl-2 font-normal">Số lệnh</th>
                  </tr>
                </thead>
                <tbody>
                  <CoLenh ten="Lớn" mo={`≥ ${du.nguong?.lonTrieu ?? 500} triệu`} g={lon} />
                  <CoLenh ten="Vừa" mo={`${du.nguong?.vuaTrieu ?? 100}–${du.nguong?.lonTrieu ?? 500} triệu`} g={vua} />
                  <CoLenh ten="Nhỏ" mo={`< ${du.nguong?.vuaTrieu ?? 100} triệu`} g={nho} />
                </tbody>
              </table>
              {t.nn && (
                <p className="text-sm mt-2">
                  Khối ngoại: mua <b style={{ color: XANH }}>{ty(t.nn.mua)}</b> · bán <b style={{ color: DO }}>{ty(t.nn.ban)}</b> · ròng <b style={{ color: mau(t.nn.rong) }}>{dau(t.nn.rong)} tỷ</b>
                  {t.nn.conRoom != null && <span className="text-xs" style={{ color: MUTED }}> · còn room {soVN(t.nn.conRoom, 0)} cp</span>}
                </p>
              )}
            </div>
          </div>

          {du.chiTiet && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm mb-1" style={{ ...sans, fontWeight: 700 }}>Delta tích lũy theo phút <span className="text-xs" style={{ color: MUTED, fontWeight: 400 }}>(mua − bán chủ động)</span></h3>
                <BieuDoDelta phut={du.chiTiet.phut ?? []} />
              </div>
              <div>
                <h3 className="text-sm mb-1" style={{ ...sans, fontWeight: 700 }}>Volume profile hôm nay <span className="text-xs" style={{ color: MUTED, fontWeight: 400 }}>(khớp liên tục: xanh mua · đỏ bán; nền vàng = vùng 70% KL; chữ xám = KL ATO/ATC)</span></h3>
                <div className="max-h-[420px] overflow-y-auto">
                  <VolumeProfile profile={du.chiTiet.profile ?? []} gia={t.gia} />
                </div>
              </div>
            </div>
          )}

          {du.lichSu?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm mb-1" style={{ ...sans, fontWeight: 700 }}>Ròng chủ động các phiên trước (tỷ)</h3>
              <div className="flex flex-wrap gap-3 text-xs">
                {du.lichSu.map((h) => (
                  <span key={h.ngay} className="rounded-lg border px-2 py-1" style={{ borderColor: VIEN }}>
                    {ngayNgan(h.ngay)} <b style={{ color: mau(h.tomTat?.rong) }}>{dau(h.tomTat?.rong)}</b>
                    <span style={{ color: MUTED }}> · lớn {dau((h.tomTat?.lon?.mua ?? 0) - (h.tomTat?.lon?.ban ?? 0))}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
