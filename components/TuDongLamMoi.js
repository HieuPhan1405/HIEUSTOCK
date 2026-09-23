"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { dangTrongPhienGiaoDich } from "@/lib/khungGioVaoLenh";

const KHOANG_CACH_MS = 30000; // 30s - khop voi han bo nho server 30s cua lib/tinHieu.js, du "gan real-time"

// Dat 1 LAN duy nhat o layout.js (ap dung moi trang) - router.refresh() chay lai cac Server
// Component cua trang HIEN TAI (lay du lieu moi tu DB) MA KHONG reload ca trang / KHONG mat vi
// tri cuon, khac han window.location.reload(). CHI lam moi khi dang trong phien giao dich (9h-15h
// T2-T6) - ngoai gio do tin hieu chac chan khong doi, goi lai server la vo ich.
export default function TuDongLamMoi() {
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => {
      if (dangTrongPhienGiaoDich()) router.refresh();
    }, KHOANG_CACH_MS);
    return () => clearInterval(t);
  }, [router]);

  return null;
}
