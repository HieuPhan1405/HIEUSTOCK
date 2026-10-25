import { Open_Sans } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ThanhDau from "@/components/ThanhDau";
import ChanTrang from "@/components/ChanTrang";
import { KhungGioProvider } from "@/components/KhungGioContext";
import TuDongLamMoi from "@/components/TuDongLamMoi";
import MayHuongDan from "@/components/MayHuongDan";
import ThanhTabNhom from "@/components/ThanhTabNhom";

// Open Sans (co dau tieng Viet, so deu hang nho font-variant-numeric: tabular-nums o globals.css; Hieu chon 2026-10-26). Phan biet --font-chu-tai (next/font) voi --font-chu (ngan xep du phong).
const phongChu = Open_Sans({
  variable: "--font-chu-tai",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

// Chan trang doc thong tin lien he tu DB o moi request - khong de Next dong cung luc build (vd /quan-tri, 404).
export const dynamic = "force-dynamic";

export const metadata = {
  metadataBase: new URL("https://www.cloudstock.id.vn"),
  title: { default: "CloudStock — Hệ thống hỗ trợ đầu tư", template: "%s | CloudStock" },
  description: "Hệ thống hỗ trợ đầu tư chứng khoán, quét toàn bộ thị trường chứng khoán Việt Nam.",
  openGraph: {
    siteName: "CloudStock",
    locale: "vi_VN",
    type: "website",
    title: "CloudStock — Hệ thống hỗ trợ đầu tư",
    description: "Quét toàn bộ cổ phiếu HOSE, HNX, UPCOM: tín hiệu mua/bán, vùng giá mua, cắt lỗ, chốt lời.",
  },
};

// Dat che do sang/toi TRUOC khi ve trang (script nho chay ngay trong <head>) de khong bi nhay tu toi sang sang. Mac dinh TOI; nguoi dung doi bang nut o thanh dau (components/NutGiaoDien.js).
const SCRIPT_GIAO_DIEN = `(function(){try{var t=localStorage.getItem("cs-giao-dien");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark")}catch(e){}})()`;

export default function RootLayout({ children }) {
  return (
    <html lang="vi" data-theme="dark" suppressHydrationWarning className={`${phongChu.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_GIAO_DIEN }} />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: "var(--nen)" }}>
        <KhungGioProvider>
          <TuDongLamMoi />
          <ThanhDau />
          <Sidebar />
          <MayHuongDan />
          <div className="md:pl-60 flex flex-col flex-1">
            <ThanhTabNhom />
            <main className="flex-1">{children}</main>
            <ChanTrang />
          </div>
        </KhungGioProvider>
      </body>
    </html>
  );
}
