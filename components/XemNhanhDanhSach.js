"use client";

import Link from "next/link";
import { useDanhSachTheoDoi } from "@/lib/danhSachTheoDoiClient";

const MUTED = "var(--mo)";
const PRIMARY = "#6C5CE7";
const TOI_DA = 14;

// "Xem nhanh" cua trang Bieu do: cac ma trong danh sach theo doi cua ban (danh sach chinh truoc, roi cac danh sach khac, bo trung). Khach / danh sach trong thi dung goi y co dinh.
export default function XemNhanhDanhSach({ ma, goiY }) {
  const { danhSach } = useDanhSachTheoDoi();
  const cuaToi = [...new Set((danhSach ?? []).flatMap((d) => d.ma.map((x) => x.ma)))].slice(0, TOI_DA);
  const ds = cuaToi.length ? cuaToi : goiY;
  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs">
      <span style={{ color: MUTED }}>{cuaToi.length ? "Danh sách theo dõi:" : "Xem nhanh:"}</span>
      {ds.map((g) => (
        <Link
          key={g}
          href={`/bieu-do?ma=${g}`}
          className="px-2 py-1 rounded-md border hover:text-[color:var(--chu)]"
          style={{ borderColor: g === ma ? PRIMARY : "var(--vien)", color: g === ma ? "var(--chu)" : MUTED, fontFamily: "var(--font-chu)" }}
        >
          {g}
        </Link>
      ))}
      {cuaToi.length > 0 && ma !== "VNINDEX" && (
        <Link href="/bieu-do?ma=VNINDEX" className="px-2 py-1 rounded-md border" style={{ borderColor: "var(--vien)", color: MUTED, fontFamily: "var(--font-chu)" }}>
          VNINDEX
        </Link>
      )}
    </div>
  );
}
