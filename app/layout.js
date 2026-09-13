import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThanhDieuHuong from "@/components/ThanhDieuHuong";
import { FONT_IMPORT } from "@/components/dungChung";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CloudStock — Tín hiệu Dao Găm",
  description: "Tín hiệu kỹ thuật Ichimoku 9-17-33 + Giao Găm 65-129, quét toàn bộ thị trường chứng khoán Việt Nam.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ background: "#0B0B10" }}>
        <style>{FONT_IMPORT}</style>
        <ThanhDieuHuong />
        {children}
      </body>
    </html>
  );
}
