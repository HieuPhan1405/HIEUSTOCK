import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ChanTrang from "@/components/ChanTrang";
import { FONT_IMPORT } from "@/components/dungChung";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ background: "#0B0B10" }}>
        <style>{FONT_IMPORT}</style>
        <Sidebar />
        <div className="md:pl-60 flex flex-col flex-1">
          <main className="flex-1">{children}</main>
          <ChanTrang />
        </div>
      </body>
    </html>
  );
}
