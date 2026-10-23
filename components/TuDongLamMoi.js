"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { dangTrongPhienGiaoDich } from "@/lib/khungGioVaoLenh";

// 60s: engine day du lieu moi ~1 phut / lan nen lam moi nhanh hon khong co them du lieu, chi them tai cho may chu va trinh duyet (truoc day 30s -> trang lon nhu Bo loc tai lai ~1 MB moi 30 giay).
const KHOANG_CACH_MS = 60000;
// Nguoi dung vua cuon / go / bam trong vai giay gan day thi HOAN lam moi sang nhip sau, de trang khong giat dung luc dang thao tac.
const NHUONG_THAO_TAC_MS = 5000;
// CHI lam moi khi tab DANG HIEN (nguoi dung dang nhin) - tab bi an/thu nho khong goi may chu nua, giam tai khi dong nguoi;
// khi quay lai tab thi lam moi ngay 1 lan de khong phai cho toi nhip 60s.

// Dat 1 LAN duy nhat o layout.js (ap dung moi trang) - router.refresh() chay lai cac Server
// Component cua trang HIEN TAI (lay du lieu moi tu DB) MA KHONG reload ca trang / KHONG mat vi
// tri cuon, khac han window.location.reload(). CHI lam moi khi dang trong phien giao dich (9h-15h
// T2-T6) - ngoai gio do tin hieu chac chan khong doi, goi lai server la vo ich.
export default function TuDongLamMoi() {
  const router = useRouter();

  useEffect(() => {
    let thaoTacCuoi = 0;
    const ghiThaoTac = () => {
      thaoTacCuoi = Date.now();
    };
    const sk = ["scroll", "wheel", "touchmove", "keydown", "pointerdown"];
    for (const s of sk) window.addEventListener(s, ghiThaoTac, { passive: true, capture: true });

    const lamMoi = () => {
      if (!dangTrongPhienGiaoDich() || document.visibilityState !== "visible") return;
      const dangGo = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
      if (dangGo || Date.now() - thaoTacCuoi < NHUONG_THAO_TAC_MS) return;
      router.refresh();
    };
    const t = setInterval(lamMoi, KHOANG_CACH_MS);
    // quay lai tab: lam moi ngay (bo qua nhuong thao tac vi vua quay lai)
    const khiHien = () => {
      if (dangTrongPhienGiaoDich() && document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", khiHien);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", khiHien);
      for (const s of sk) window.removeEventListener(s, ghiThaoTac, { capture: true });
    };
  }, [router]);

  return null;
}
