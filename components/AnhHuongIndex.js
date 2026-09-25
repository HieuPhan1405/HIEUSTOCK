"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { dangTrongPhienGiaoDich } from "@/lib/khungGioVaoLenh";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const XANH = "#22C55E";
const DO = "#EF4444";

const so = (v, dp = 2) => (v == null || !Number.isFinite(v) ? "—" : v.toLocaleString("vi-VN", { minimumFractionDigits: dp, maximumFractionDigits: dp }));
const dau = (v, dp = 2) => (v == null || !Number.isFinite(v) ? "—" : `${v > 0 ? "+" : ""}${so(v, dp)}`);
const ngayVN = (s) => (s ? s.split("-").reverse().join("/") : "");

// Mot dong: ma nam ben CON LAI cua thanh (ma tang o trai, ma giam o phai) giong bang "Anh huong Index" cac trang chung khoan - thanh xanh keo sang phai,
// thanh do keo sang trai tu truc giua.
function Dong({ ma, diem, pct, toiDa }) {
  const tang = diem >= 0;
  const rong = `${Math.max((Math.abs(diem) / toiDa) * 100, 1.5)}%`;
  return (
    <div className="flex items-center h-7 text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }} title={`${ma}: ${dau(diem)} điểm${pct != null ? ` · giá ${dau(pct, 2)}%` : ""}`}>
      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
        {tang ? (
          <Link href={`/ma/${ma}`} className="hover:underline" style={{ fontFamily: "'Inter', sans-serif", color: TEXT }}>
            {ma}
          </Link>
        ) : (
          <>
            <span className="text-xs" style={{ color: MUTED }}>
              {dau(diem)}
            </span>
            <div className="h-4 rounded-l-full" style={{ width: rong, maxWidth: "70%", background: DO }} />
          </>
        )}
      </div>
      <div className="w-px self-stretch" style={{ background: "#3A3A47" }} />
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {tang ? (
          <>
            <div className="h-4 rounded-r-full" style={{ width: rong, maxWidth: "70%", background: XANH }} />
            <span className="text-xs" style={{ color: MUTED }}>
              {dau(diem)}
            </span>
          </>
        ) : (
          <Link href={`/ma/${ma}`} className="hover:underline" style={{ fontFamily: "'Inter', sans-serif", color: TEXT }}>
            {ma}
          </Link>
        )}
      </div>
    </div>
  );
}

// Anh huong cua tung ma toi VN-Index (so diem dong gop) trong phien moi nhat: 10 ma keo len nhieu nhat + 10 ma keo xuong nhieu nhat.
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
      if (dangTrongPhienGiaoDich()) tai();
    }, 30_000);
    return () => {
      huy = true;
      clearInterval(hen);
    };
  }, []);

  const pctIndex = du ? (du.thayDoiDiem / du.vniTruoc) * 100 : null;
  const mau = du ? (du.thayDoiDiem >= 0 ? XANH : DO) : MUTED;
  const toiDa = du ? Math.max(...du.tang.map((d) => d.diem), ...du.giam.map((d) => Math.abs(d.diem)), 0.01) : 1;
  // Ma tang xep tu nhieu -> it, ma giam xep tu it -> nhieu (giong bang tham khao: keo xuong nhieu nhat nam CUOI danh sach).
  const giamTuItDenNhieu = du ? [...du.giam].sort((a, b) => b.diem - a.diem) : [];

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <p className="text-xs uppercase tracking-wide" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
          Ảnh hưởng tới VN-Index {du ? (du.laHomNay ? "hôm nay" : `phiên ${ngayVN(du.ngay).slice(0, 5)}`) : ""}
        </p>
        {du && (
          <p style={{ fontFamily: "'JetBrains Mono', monospace" }}>
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
          <p className="text-xs mb-3" style={{ color: MUTED }}>
            Số điểm mỗi mã làm VN-Index tăng (xanh) hoặc giảm (đỏ). {du.soMaTang} mã tăng · {du.soMaGiam} mã giảm.
          </p>
          <div className="max-w-xl">
            {du.tang.map((d) => (
              <Dong key={d.ma} ma={d.ma} diem={d.diem} pct={d.pct} toiDa={toiDa} />
            ))}
            <div className="my-1 border-t" style={{ borderColor: "#1D1D26" }} />
            {giamTuItDenNhieu.map((d) => (
              <Dong key={d.ma} ma={d.ma} diem={d.diem} pct={d.pct} toiDa={toiDa} />
            ))}
          </div>
          <p className="text-[11px] mt-3" style={{ color: MUTED }}>
            Tính theo vốn hoá: điểm đóng góp = (thay đổi vốn hoá của mã ÷ tổng vốn hoá phiên trước) × VN-Index phiên trước (giá và vốn hoá từ VNDirect). Tổng ước tính {dau(du.tongUocTinh)} điểm so với thực tế{" "}
            {dau(du.thayDoiDiem)} —{" "}
            {du.laHomNay
              ? "trong phiên hai số lấy ở hai thời điểm hơi khác nhau nên có thể lệch vài điểm khi chỉ số biến động nhanh; tự cập nhật mỗi 30 giây."
              : "chênh nhẹ do làm tròn giá và điều chỉnh chỉ số."}
          </p>
        </>
      )}
    </div>
  );
}
