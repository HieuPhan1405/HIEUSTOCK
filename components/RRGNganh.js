"use client";

import { useEffect, useMemo, useState } from "react";
import { soVN } from "@/lib/soVN";

// RRG (Relative Rotation Graph) NGANH tren Dashboard: engine/dich-vu/tinhRRG.mjs tinh tu nen tuan ~390 ma so voi chi so trung binh deu, dua len qua /api/upload-phan-tich-co-ban.
// Cot "Rong chu dong hom nay" lay them tu /api/dong-tien (DNSE thoi gian thuc, chi thanh vien da duyet) - khong co thi an cot.
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const sans = { fontFamily: "var(--font-chu)" };
const MAU_GOC = { Leading: "var(--xanh)", Improving: "#5BA8FF", Weakening: "var(--vang)", Lagging: "var(--do)" };
const NHAN_GOC = { Leading: "Dẫn dắt", Improving: "Cải thiện", Weakening: "Yếu dần", Lagging: "Tụt hậu" };
const W = 640;
const H = 560;
const LE = 46;

const f1 = (x, d = 1) => (x == null || !Number.isFinite(x) ? "—" : soVN(x, d, true));
const dau = (x, d = 1) => (x == null || !Number.isFinite(x) ? "—" : `${x > 0 ? "+" : ""}${f1(x, d)}`);
const mau = (v, nguong = 0) => (v == null ? MUTED : v > nguong ? XANH : v < -nguong ? DO : "var(--chu)");

function BieuDo({ ds, chon, datChon }) {
  const { X, Y, dx, dy } = useMemo(() => {
    // khung theo vi tri HIEN TAI cua cac nganh (duoi di xa hon thi bi cat o vien, khong keo gian ca bieu do)
    const xs = ds.map((r) => r.duoi.at(-1).ratio);
    const ys = ds.map((r) => r.duoi.at(-1).mom);
    const dx = Math.max(3, Math.max(...xs.map((x) => Math.abs(x - 100))) + 1);
    const dy = Math.max(3, Math.max(...ys.map((y) => Math.abs(y - 100))) + 1);
    const kep = (v, d) => Math.min(100 + d, Math.max(100 - d, v));
    return {
      dx,
      dy,
      X: (v) => LE + ((kep(v, dx) - (100 - dx)) / (2 * dx)) * (W - 2 * LE),
      Y: (v) => H - LE - ((kep(v, dy) - (100 - dy)) / (2 * dy)) * (H - 2 * LE),
    };
  }, [ds]);
  // dat nhan ten nganh tranh de len nhau: xep theo y, nhan nao cham nhan da dat thi day xuong den khi het cham
  const viTriNhan = useMemo(() => {
    const dat = [];
    const kq = {};
    [...ds]
      .map((r) => ({ r, x: X(r.duoi.at(-1).ratio) + 9, y: Y(r.duoi.at(-1).mom) + 4, w: r.nhan.length * 6 }))
      .sort((a, b) => a.y - b.y)
      .forEach((n) => {
        let y = n.y;
        for (let lan = 0; lan < 40; lan++) {
          const va = dat.find((d) => Math.abs(d.y - y) < 12 && d.x < n.x + n.w && n.x < d.x + d.w);
          if (!va) break;
          y = va.y + 12;
        }
        dat.push({ x: n.x, y, w: n.w });
        kq[n.r.nganh] = y;
      });
    return kq;
  }, [ds, X, Y]);
  const nhanGoc = (x, y, t, anchor, goc) => (
    <text x={x} y={y} textAnchor={anchor} fontSize="12" fill={MAU_GOC[goc]} opacity="0.75" style={sans} fontWeight="700">
      {t}
    </text>
  );
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }} role="img" aria-label="Biểu đồ RRG các ngành">
      <rect x={LE} y={LE} width={W - 2 * LE} height={H - 2 * LE} fill="none" stroke="var(--vien)" />
      <rect x={X(100)} y={LE} width={W - LE - X(100)} height={Y(100) - LE} fill="var(--xanh)" opacity="0.05" />
      <rect x={LE} y={Y(100)} width={X(100) - LE} height={H - LE - Y(100)} fill="var(--do)" opacity="0.05" />
      <line x1={X(100)} x2={X(100)} y1={LE} y2={H - LE} stroke="var(--mo)" opacity="0.5" />
      <line y1={Y(100)} y2={Y(100)} x1={LE} x2={W - LE} stroke="var(--mo)" opacity="0.5" />
      {nhanGoc(W - LE - 8, LE + 18, "DẪN DẮT", "end", "Leading")}
      {nhanGoc(W - LE - 8, H - LE - 10, "YẾU DẦN", "end", "Weakening")}
      {nhanGoc(LE + 8, H - LE - 10, "TỤT HẬU", "start", "Lagging")}
      {nhanGoc(LE + 8, LE + 18, "CẢI THIỆN", "start", "Improving")}
      <text x={W / 2} y={H - 10} textAnchor="middle" fontSize="11" fill={MUTED} style={sans}>
        RS-Ratio: sức mạnh so với thị trường (&gt; 100 = hơn) →
      </text>
      <text transform={`translate(13 ${H / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fill={MUTED} style={sans}>
        RS-Momentum: đang tăng tốc (&gt; 100) →
      </text>
      {ds.map((r) => {
        const c = MAU_GOC[r.goc];
        const l = r.duoi.at(-1);
        const sang = !chon || chon === r.nganh;
        return (
          <g key={r.nganh} opacity={sang ? 1 : 0.18} style={{ cursor: "pointer" }} onClick={() => datChon(chon === r.nganh ? null : r.nganh)}>
            <polyline points={r.duoi.map((d) => `${X(d.ratio)},${Y(d.mom)}`).join(" ")} fill="none" stroke={c} strokeWidth="1.8" opacity="0.6" />
            {r.duoi.slice(0, -1).map((d) => (
              <circle key={d.tuan} cx={X(d.ratio)} cy={Y(d.mom)} r="2.2" fill={c} opacity="0.55" />
            ))}
            <circle cx={X(l.ratio)} cy={Y(l.mom)} r="6" fill={c} />
            <text x={X(l.ratio) + 9} y={viTriNhan[r.nganh]} fontSize="11.5" fill="var(--chu)" style={sans} fontWeight={chon === r.nganh ? 700 : 500}>
              {r.nhan}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function RRGNganh({ du }) {
  const [chon, datChon] = useState(null);
  const [dongTien, setDongTien] = useState(null); // { ten -> rong (trieu dong) } hoac null
  const ds = du?.rrg?.ketQua ?? [];
  useEffect(() => {
    let dung = false;
    fetch("/api/dong-tien", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (dung || !j?.du?.nganh?.length) return;
        setDongTien(Object.fromEntries(j.du.nganh.map((g) => [g.ten, g.rong])));
      })
      .catch(() => {});
    return () => {
      dung = true;
    };
  }, []);
  if (!ds.length) return null;
  const rongCua = (r) => (dongTien ? dongTien[r.nhan] ?? dongTien[r.nganh] ?? null : null);
  const sx = [...ds].sort((a, b) => b.ratio - a.ratio);
  const dan = ds.filter((r) => r.goc === "Leading").length;
  const ngayVN = du.rrg.ngay ? du.rrg.ngay.split("-").reverse().join("/") : "";
  return (
    <section className="rounded-2xl border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }} aria-label="RRG ngành">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-lg" style={{ ...sans, fontWeight: 700 }} data-may="rrg-nganh">
          RRG ngành — ngành nào đang dẫn dắt
        </h2>
        <span className="text-xs" style={{ color: MUTED }}>
          Dữ liệu đến {ngayVN} · {dan} ngành đang dẫn dắt
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: MUTED }}>
        Mỗi ngành là một chấm: càng sang phải càng mạnh hơn thị trường chung, càng lên cao càng đang tăng tốc. Đuôi là 8 tuần gần nhất — ngành thường quay vòng Cải thiện → Dẫn dắt → Yếu dần → Tụt hậu. Bấm vào chấm để làm nổi bật ngành.
      </p>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div>
          <BieuDo ds={ds} chon={chon} datChon={datChon} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs" style={{ color: MUTED }}>
                <th className="py-1.5 pr-2 font-normal">Ngành</th>
                <th className="py-1.5 px-2 font-normal">Góc</th>
                <th className="py-1.5 px-2 font-normal text-right">RS-Ratio</th>
                <th className="py-1.5 px-2 font-normal text-right" data-may="rrg-nong">Nóng</th>
                <th className="py-1.5 px-2 font-normal text-right" data-may="rrg-tien-rong">Tiền ròng ước tính</th>
                {dongTien && <th className="py-1.5 pl-2 font-normal text-right">Ròng chủ động hôm nay</th>}
              </tr>
            </thead>
            <tbody>
              {sx.map((r) => {
                const rong = rongCua(r);
                return (
                  <tr key={r.nganh} className="border-t cursor-pointer" style={{ borderColor: "var(--vien-nhe)", opacity: !chon || chon === r.nganh ? 1 : 0.4 }} onClick={() => datChon(chon === r.nganh ? null : r.nganh)}>
                    <td className="py-1.5 pr-2">
                      {r.nhan} <span className="text-[11px]" style={{ color: MUTED }}>({r.soMa})</span>
                    </td>
                    <td className="py-1.5 px-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap" style={{ color: MAU_GOC[r.goc], borderColor: MAU_GOC[r.goc] }}>
                        {NHAN_GOC[r.goc]}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-right" style={{ fontWeight: 600 }}>{f1(r.ratio)}</td>
                    <td className="py-1.5 px-2 text-right" style={{ color: r.nongDongTien >= 1.1 ? XANH : r.nongDongTien < 0.8 ? DO : "var(--chu)" }}>{f1(r.nongDongTien, 2)}×</td>
                    <td className="py-1.5 px-2 text-right" style={{ color: mau(r.tienRong5p, 5) }}>{dau(r.tienRong5p)}%</td>
                    {dongTien && (
                      <td className="py-1.5 pl-2 text-right" style={{ color: mau(rong) }}>
                        {rong == null ? "—" : `${dau(rong / 1000, 0)} tỷ`}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[11px] mt-3" style={{ color: MUTED }}>
        Mốc so sánh là chỉ số trung bình đều các mã thanh khoản ≥ 2 tỷ/phiên (VN-Index tính theo vốn hoá nên VIC, VHM, ngân hàng kéo, ngành nào cũng “thắng” nó). <b>Nóng</b> = giá trị giao dịch 5 phiên / mức thường lệ 10 tuần trước.{" "}
        <b>Tiền ròng ước tính</b> chỉ đo giá đóng cửa nghiêng về đầu cao hay đầu thấp của nến theo giá trị giao dịch, không phải mua/bán chủ động thật. Ngành dưới 3 mã đủ thanh khoản không được vẽ. Không phải khuyến nghị đầu tư.
      </p>
    </section>
  );
}
