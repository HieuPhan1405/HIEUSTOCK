"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cuaSoLuyKe, chiSoBatDauCuaSo } from "@/lib/tinhHieuQua";
import { dangTrongPhienGiaoDich } from "@/lib/khungGioVaoLenh";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const PRIMARY = "#6C5CE7";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const MAU_TSSL = "var(--vang-2)"; // vang - Ty suat sinh loi cua he thong
const MAU_VN = "#5B6EF5"; // xanh duong - VN-Index
const CHIEU_CAO = 300;
const TABS = ["1M", "3M", "6M", "1Y", "YTD"];

const so = (v, dp = 2) => (v == null || !Number.isFinite(v) ? "—" : v.toLocaleString("vi-VN", { minimumFractionDigits: dp, maximumFractionDigits: dp }));
const dau = (v, dp = 2) => (v == null || !Number.isFinite(v) ? "—" : `${v > 0 ? "+" : ""}${so(v, dp)}%`);
const mauSo = (v) => (v == null ? MUTED : v >= 0 ? XANH : DO);
const ngayVN = (s) => (s ? s.split("-").reverse().join("/") : "");

// Cac moc tren truc Y "tron" (1/2/5 x 10^n) phu khoang [min, max].
function mocTron(min, max, soMoc = 5) {
  const nhip = max - min || 1;
  const tho = nhip / soMoc;
  const luyThua = 10 ** Math.floor(Math.log10(tho));
  const f = tho / luyThua;
  const buoc = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * luyThua;
  const thap = Math.floor(min / buoc) * buoc;
  const cao = Math.ceil(max / buoc) * buoc;
  const moc = [];
  for (let v = thap; v <= cao + buoc / 2; v += buoc) moc.push(Math.round(v * 1e6) / 1e6);
  return moc;
}

// "Hieu qua dau tu": ty suat sinh loi (TSSL) cua he thong (cac lenh da dong + dang mo tu khi web ghi nhan) so voi VN-Index, theo tab 1M/3M/6M/1Y/YTD.
// Du lieu tinh o may chu (/api/hieu-qua-he-thong) dang luy ke tu moc goc; o day chi doi moc ve 0% theo tab dang chon.
export default function HieuQuaDauTu() {
  const [du, setDu] = useState(null);
  const [loi, setLoi] = useState(null);
  const [tab, setTab] = useState("1M");
  const [cach, setCach] = useState("tssl"); // "tssl" = theo thoi gian (can bang lai moi ngay) | "lenh" = lai trung binh moi lenh (dong + mo)
  const [hover, setHover] = useState(null);
  const hopRef = useRef(null);
  const [rong, setRong] = useState(720);
  const coDuLieuRef = useRef(false);

  useEffect(() => {
    let huy = false;
    function tai() {
      fetch("/api/hieu-qua-he-thong")
        .then((r) => r.json())
        .then((j) => {
          if (huy) return;
          if (j.trangThai === "ok") {
            coDuLieuRef.current = true;
            setDu(j);
            setLoi(null);
          } else if (!coDuLieuRef.current) setLoi(j.thongBao || "Chưa có dữ liệu hiệu quả đầu tư.");
        })
        .catch(() => {
          if (!huy && !coDuLieuRef.current) setLoi("Không kết nối được máy chủ.");
        });
    }
    tai();
    // Trong phien: lam moi moi 5 phut (khong can sat nhu gia), chi khi tab dang hien.
    const hen = setInterval(() => {
      if (dangTrongPhienGiaoDich() && document.visibilityState === "visible") tai();
    }, 300_000);
    return () => {
      huy = true;
      clearInterval(hen);
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

  const cuaSo = useMemo(() => {
    if (!du?.coDuLieu) return null;
    const s = chiSoBatDauCuaSo(du.ngay, tab);
    const tssl = cuaSoLuyKe(du.tssl, s);
    const vn = cuaSoLuyKe(du.vn, s);
    const lai = cach === "lenh" ? du.laiLenh?.[tab] : null; // lai trung binh moi lenh cua tab (da tinh san o may chu, 0% = dau cua so)
    const diem = [];
    for (let k = s; k < du.ngay.length; k++) diem.push({ ngay: du.ngay[k], tssl: lai ? lai[k] ?? 0 : tssl[k], vn: vn[k] });
    // Cua so dai hon du lieu dang co (vd chon 6M nhung moi ghi nhan 2 tuan) -> hien toan bo tu ngay bat dau va ghi chu.
    const can = { "1M": 21, "3M": 63, "6M": 126, "1Y": 252 }[tab];
    const ngan = s === 0 && (can ? du.ngay.length - 1 < can : du.ngay[0].slice(5) > "01-10");
    return { diem, ngan };
  }, [du, tab, cach]);

  const LE_TRAI = 46;
  const LE_DUOI = 24;
  const LE_TREN = 10;
  const rongVe = Math.max(240, rong - LE_TRAI - 12);
  const caoVe = CHIEU_CAO - LE_DUOI - LE_TREN;

  const hinhHoc = useMemo(() => {
    if (!cuaSo) return null;
    const gt = cuaSo.diem.flatMap((d) => [d.tssl, d.vn]).filter(Number.isFinite);
    const moc = mocTron(Math.min(0, ...gt), Math.max(0, ...gt));
    return { moc, thap: moc[0], cao: moc[moc.length - 1] };
  }, [cuaSo]);

  if (!du) {
    return (
      <div className="mb-8 rounded-2xl border p-5" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <p className="text-base mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
          Hiệu quả đầu tư
        </p>
        <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: MUTED }}>
          {loi || "Đang tính hiệu quả đầu tư…"}
        </div>
      </div>
    );
  }
  if (!du.coDuLieu) {
    return (
      <div className="mb-8 rounded-2xl border p-5" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <p className="text-base mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
          Hiệu quả đầu tư
        </p>
        <p className="text-sm py-6" style={{ color: MUTED }}>
          {du.lyDo}
        </p>
      </div>
    );
  }

  const { diem } = cuaSo;
  const cuoi = diem[diem.length - 1];
  const chenh = cuoi.tssl - cuoi.vn;
  const x = (i) => (diem.length > 1 ? (i / (diem.length - 1)) * rongVe : rongVe / 2);
  const y = (v) => caoVe - ((v - hinhHoc.thap) / (hinhHoc.cao - hinhHoc.thap)) * caoVe;
  const duongVe = (khoa) => diem.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d[khoa]).toFixed(1)}`).join(" ");
  const nhanTrucX = [0, Math.floor((diem.length - 1) / 2), diem.length - 1].filter((v, i, a) => a.indexOf(v) === i);
  const dHover = hover != null ? diem[hover] : null;

  function diChuot(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    setHover(Math.max(0, Math.min(diem.length - 1, Math.round((px / rongVe) * (diem.length - 1)))));
  }

  return (
    <div className="mb-8 rounded-2xl border p-5" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-base mb-2" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
        Hiệu quả đầu tư
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mb-3 text-xs" style={{ color: MUTED, fontFamily: "var(--font-chu)" }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: MAU_VN }} />
          VN-Index <b style={{ color: mauSo(cuoi.vn), fontFamily: "var(--font-chu)" }}>{dau(cuoi.vn)}</b>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: MAU_TSSL }} />
          {cach === "lenh" ? "Lãi trung bình mỗi lệnh" : "Tỷ suất sinh lời (TSSL)"} <b style={{ color: mauSo(cuoi.tssl), fontFamily: "var(--font-chu)" }}>{dau(cuoi.tssl)}</b>
        </span>
        {cach === "tssl" && (
          <span>
            {chenh >= 0 ? "Vượt" : "Thua"} VN-Index <b style={{ color: mauSo(chenh), fontFamily: "var(--font-chu)" }}>{dau(chenh)}</b>
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-2" role="group" aria-label="Cách tính">
        {[["tssl", "Theo thời gian (cân bằng lại mỗi ngày)"], ["lenh", "Lãi trung bình mỗi lệnh (đã chốt + đang giữ)"]].map(([k, ten]) => (
          <button key={k} type="button" aria-pressed={cach === k} onClick={() => { setCach(k); setHover(null); }} className="text-xs rounded-full px-3 py-1.5" style={cach === k ? { background: "#6C5CE7", color: "#fff", fontWeight: 700 } : { color: MUTED, border: `1px solid ${VIEN}` }}>
            {ten}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1 rounded-xl p-1 mb-3" style={{ background: "var(--nen-phu)" }} role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => {
              setTab(t);
              setHover(null);
            }}
            className="py-2 rounded-lg text-sm"
            style={tab === t ? { background: "#6C5CE7", color: "#fff", fontWeight: 700 } : { color: MUTED }}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="text-xs mb-1 min-h-[16px]" style={{ color: MUTED, fontFamily: "var(--font-chu)" }}>
        {dHover ? (
          <>
            {ngayVN(dHover.ngay)} · TSSL <b style={{ color: mauSo(dHover.tssl) }}>{dau(dHover.tssl)}</b> · VN-Index <b style={{ color: mauSo(dHover.vn) }}>{dau(dHover.vn)}</b> · chênh{" "}
            <b style={{ color: mauSo(dHover.tssl - dHover.vn) }}>{dau(dHover.tssl - dHover.vn)}</b>
          </>
        ) : (
          `Từ ${ngayVN(diem[0].ngay)} đến ${ngayVN(cuoi.ngay)} · rê chuột (hoặc chạm) vào biểu đồ để xem từng ngày`
        )}
      </p>

      <div ref={hopRef} className="w-full">
        <svg width={rongVe + LE_TRAI + 12} height={CHIEU_CAO} style={{ display: "block" }} role="img" aria-label="Tỷ suất sinh lời của hệ thống so với VN-Index">
          <g transform={`translate(${LE_TRAI},${LE_TREN})`}>
            {hinhHoc.moc.map((v) => (
              <g key={v}>
                <line x1={0} x2={rongVe} y1={y(v)} y2={y(v)} stroke={v === 0 ? "var(--vien-dam)" : VIEN} />
                <text x={-8} y={y(v) + 3} textAnchor="end" fontSize="11" fill={MUTED} style={{ fontFamily: "var(--font-chu)" }}>
                  {v.toLocaleString("vi-VN")} %
                </text>
              </g>
            ))}
            {nhanTrucX.map((i) => (
              <text key={i} x={x(i)} y={caoVe + 16} textAnchor={i === 0 ? "start" : i === diem.length - 1 ? "end" : "middle"} fontSize="11" fill={MUTED} style={{ fontFamily: "var(--font-chu)" }}>
                {ngayVN(diem[i].ngay).slice(0, 5)}
              </text>
            ))}
            <path d={duongVe("vn")} fill="none" stroke={MAU_VN} strokeWidth="2" strokeLinejoin="round" />
            <path d={duongVe("tssl")} fill="none" stroke={MAU_TSSL} strokeWidth="2" strokeLinejoin="round" />
            {hover != null && (
              <>
                <line x1={x(hover)} x2={x(hover)} y1={0} y2={caoVe} stroke={MUTED} strokeDasharray="2,2" />
                <circle cx={x(hover)} cy={y(diem[hover].vn)} r="3.5" fill={MAU_VN} stroke="#fff" strokeWidth="1" />
                <circle cx={x(hover)} cy={y(diem[hover].tssl)} r="3.5" fill={MAU_TSSL} stroke="#fff" strokeWidth="1" />
              </>
            )}
            <rect x={0} y={0} width={rongVe} height={caoVe} fill="transparent" onMouseMove={diChuot} onMouseLeave={() => setHover(null)} />
          </g>
        </svg>
      </div>

      {cach === "lenh" && (
        <p className="text-[11px] mt-2" style={{ color: MUTED }}>
          <b>Lãi trung bình mỗi lệnh</b> = trung bình (theo tỷ trọng) lãi/lỗ của <b>mọi lệnh đã vào</b>: lệnh đã đóng tính theo giá ra (đã chốt), lệnh đang mở tính theo giá hiện tại (lãi/lỗ tạm tính). Không cân bằng lại mỗi ngày và không quy theo thời gian nắm giữ nên <b>không so trực tiếp với VN-Index</b>; đường VN-Index chỉ để tham chiếu. Lãi tạm tính của lệnh đang mở có thể mất đi nếu giá quay đầu.
        </p>
      )}
      <p className="text-[11px] mt-2" style={{ color: MUTED }}>
        TSSL = tỷ suất sinh lời theo thời gian của các lệnh do hệ thống phát (đã đóng + đang mở, mỗi lệnh một phần vốn như nhau, phần chốt lời từng phần tính theo tỷ lệ chốt), tính từ{" "}
        <b>{ngayVN(du.batDau)}</b> — ngày web bắt đầu ghi nhận lệnh đã đóng; trước ngày này chỉ biết các lệnh còn sống sót nên không đưa vào để tránh thổi phồng.
        {cuaSo.ngan ? " Tab dài hơn thời gian đã ghi nhận nên hiện toàn bộ dữ liệu có." : ""} Tiền chưa vào lệnh coi như 0%. Giá vào/ra lấy theo lần cập nhật dữ liệu (xấp xỉ giá đóng cửa), chưa trừ phí và thuế;
        VN-Index là chỉ số, không phải một danh mục đầu tư được. Kết quả quá khứ không đảm bảo tương lai, chỉ mang tính tham khảo.
      </p>
    </div>
  );
}
