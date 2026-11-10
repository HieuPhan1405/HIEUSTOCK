"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { dangTrongPhienGiaoDich } from "@/lib/khungGioVaoLenh";
import GiaiThichThem from "@/components/GiaiThichThem";

const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";

const so = (v, dp = 2) => (v == null || !Number.isFinite(v) ? "—" : v.toLocaleString("vi-VN", { minimumFractionDigits: dp, maximumFractionDigits: dp }));
const dau = (v, dp = 2) => (v == null || !Number.isFinite(v) ? "—" : `${v > 0 ? "+" : ""}${so(v, dp)}`);
const ngayVN = (s) => (s ? s.split("-").reverse().join("/") : "");

// 1 COT (10/11/2026, kieu bieu do "Tac dong" cua FireAnt): thanh doc dung tren / duoi duong goc chung - xanh len (keo chi so tang), do xuong (keo giam);
// so diem ghi o dau thanh, ben duoi la ma + % gia. tren / duoi: % chieu cao vung ve danh cho phan duong / am (theo ma dong gop lon nhat moi phia).
function Cot({ ma, diem, pct, tren, duoi }) {
  const tang = diem >= 0;
  const h = Math.max((Math.abs(diem) / Math.max(tren + duoi, 1e-9)) * 100, 1.5);
  const goc = (tren / Math.max(tren + duoi, 1e-9)) * 100;
  return (
    <Link href={`/ma/${ma}`} className="flex-1 min-w-[38px] flex flex-col items-center group" title={`${ma}: ${dau(diem)} điểm${pct != null ? ` · giá ${dau(pct, 2)}%` : ""}`}>
      <div className="relative w-full h-[150px]">
        <div className="absolute inset-x-0 top-4 bottom-4">
          <div className="absolute inset-x-0 h-px" style={{ top: `${goc}%`, background: "var(--vien-dam)" }} aria-hidden="true" />
          <div
            className="absolute left-1/2 -translate-x-1/2 w-[58%] max-w-[26px] group-hover:brightness-125"
            style={tang ? { bottom: `${100 - goc}%`, height: `${h}%`, background: XANH, borderRadius: "4px 4px 0 0" } : { top: `${goc}%`, height: `${h}%`, background: DO, borderRadius: "0 0 4px 4px" }}
          />
          <span className="absolute left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap" style={{ ...(tang ? { bottom: `calc(${100 - goc + h}% + 2px)` } : { top: `calc(${goc + h}% + 2px)` }), color: MUTED, fontFamily: "var(--font-chu)" }}>
            {dau(diem)}
          </span>
        </div>
      </div>
      <b className="text-[11px] mt-1" style={{ fontFamily: "var(--font-chu)", color: TEXT }}>
        {ma}
      </b>
      <span className="text-[10px]" style={{ color: pct == null ? MUTED : pct >= 0 ? XANH : DO, fontFamily: "var(--font-chu)" }}>
        {pct == null ? "" : `${dau(pct, 1)}%`}
      </span>
    </Link>
  );
}

// Anh huong cua tung ma toi VN-Index (so diem dong gop) trong phien moi nhat: 10 ma keo len nhieu nhat + 10 ma keo xuong nhieu nhat - bieu do cot doc (10/11/2026, truoc la 20 dong thanh ngang ~700px).
export default function AnhHuongIndex() {
  const [du, setDu] = useState(null);
  const [loi, setLoi] = useState(null);
  const coDuLieuRef = useRef(false);

  useEffect(() => {
    let huy = false;
    function tai() {
      fetch("/api/anh-huong-index")
        .then((r) => r.json())
        .then((j) => {
          if (huy) return;
          if (j.trangThai === "ok") {
            coDuLieuRef.current = true;
            setDu(j);
            setLoi(null);
          } else if (!coDuLieuRef.current) setLoi(j.thongBao || "Chưa có dữ liệu ảnh hưởng.");
        })
        .catch(() => {
          if (!huy && !coDuLieuRef.current) setLoi("Không kết nối được máy chủ.");
        });
    }
    tai();
    const hen = setInterval(() => {
      if (dangTrongPhienGiaoDich() && document.visibilityState === "visible") tai();
    }, 30_000);
    return () => {
      huy = true;
      clearInterval(hen);
    };
  }, []);

  const pctIndex = du ? (du.thayDoiDiem / du.vniTruoc) * 100 : null;
  const mau = du ? (du.thayDoiDiem >= 0 ? XANH : DO) : MUTED;
  // Thu tu cot (giong FireAnt): trai = keo giam nhieu nhat -> it nhat, phai = keo tang it nhat -> nhieu nhat.
  const cot = du ? [...[...du.giam].sort((a, b) => a.diem - b.diem), ...[...du.tang].sort((a, b) => a.diem - b.diem)] : [];
  const tren = du ? Math.max(...du.tang.map((d) => d.diem), 0) : 0;
  const duoi = du ? Math.max(...du.giam.map((d) => -d.diem), 0) : 0;

  return (
    <div className="rounded-2xl border p-4 sm:p-5 mb-6 h-full" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-[15px]" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
          Tác động tới VN-Index
          <span className="text-xs" style={{ color: MUTED, fontWeight: 400 }}>
            {" "}
            · {du ? (du.laHomNay ? "hôm nay" : `phiên ${ngayVN(du.ngay).slice(0, 5)}`) : ""}
          </span>
        </h2>
        {du && (
          <p style={{ fontFamily: "var(--font-chu)" }}>
            <span className="text-lg font-bold" style={{ color: TEXT }}>
              {so(du.vniHienTai)}
            </span>{" "}
            <span className="text-sm" style={{ color: mau }}>
              {du.thayDoiDiem >= 0 ? "▲" : "▼"} {dau(du.thayDoiDiem)} ({dau(pctIndex)}%)
            </span>
          </p>
        )}
      </div>

      {!du ? (
        <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: MUTED }}>
          {loi || "Đang tải dữ liệu…"}
        </div>
      ) : (
        <>
          <p className="text-xs mb-2" style={{ color: MUTED }}>
            Số điểm mỗi mã kéo VN-Index lên (xanh) hoặc xuống (đỏ). {du.soMaTang} mã tăng · {du.soMaGiam} mã giảm.
          </p>
          {/* Dien thoai: 20 cot qua hep -> cuon ngang trong khung */}
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="relative flex min-w-[600px]">
              {cot.map((d) => (
                <Cot key={d.ma} ma={d.ma} diem={d.diem} pct={d.pct} tren={tren} duoi={duoi} />
              ))}
            </div>
          </div>
          <GiaiThichThem nhanMo="Cách tính" className="mt-3">
            <p>
              Tính theo vốn hoá: điểm đóng góp = (thay đổi vốn hoá của mã ÷ tổng vốn hoá phiên trước) × VN-Index phiên trước (giá và vốn hoá từ VNDirect). Tổng ước tính {dau(du.tongUocTinh)} điểm so với thực tế{" "}
              {dau(du.thayDoiDiem)} —{" "}
              {du.laHomNay
                ? "trong phiên hai số lấy ở hai thời điểm hơi khác nhau nên có thể lệch vài điểm khi chỉ số biến động nhanh; tự cập nhật mỗi 30 giây."
                : "chênh nhẹ do làm tròn giá và điều chỉnh chỉ số."}
            </p>
          </GiaiThichThem>
        </>
      )}
    </div>
  );
}
