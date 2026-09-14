import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
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
  title: "CloudStock — Hệ thống hỗ trợ đầu tư",
  description: "Hệ thống hỗ trợ đầu tư chứng khoán, quét toàn bộ thị trường chứng khoán Việt Nam.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full" style={{ background: "#0B0B10" }}>
        <style>{FONT_IMPORT}</style>
        <Sidebar />
        <main className="md:pl-60">{children}</main>
      </body>
    </html>
  );
}
