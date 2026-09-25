"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { dangTrongPhienGiaoDich } from "@/lib/khungGioVaoLenh";

const KHOANG_CACH_MS = 30000; // 30s - khop voi han bo nho server 30s cua lib/tinHieu.js, du "gan real-time"
// CHI lam moi khi tab DANG HIEN (nguoi dung dang nhin) - tab bi an/thu nho khong goi may chu nua, giam tai khi dong nguoi (moi tab mo ca phien = 720 luot/ngay);
// khi quay lai tab thi lam moi ngay 1 lan de khong phai cho toi nhip 30s.

// Dat 1 LAN duy nhat o layout.js (ap dung moi trang) - router.refresh() chay lai cac Server
// Component cua trang HIEN TAI (lay du lieu moi tu DB) MA KHONG reload ca trang / KHONG mat vi
// tri cuon, khac han window.location.reload(). CHI lam moi khi dang trong phien giao dich (9h-15h
// T2-T6) - ngoai gio do tin hieu chac chan khong doi, goi lai server la vo ich.
export default function TuDongLamMoi() {
  const router = useRouter();

  useEffect(() => {
    const lamMoi = () => {
      if (dangTrongPhienGiaoDich() && document.visibilityState === "visible") router.refresh();
    };
    const t = setInterval(lamMoi, KHOANG_CACH_MS);
    document.addEventListener("visibilitychange", lamMoi);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", lamMoi);
    };
  }, [router]);

  return null;
}
