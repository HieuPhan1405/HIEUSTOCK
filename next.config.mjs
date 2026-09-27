/** @type {import('next').NextConfig} */
const nextConfig = {
  // Service worker nhan thong bao ve may (public/sw.js): khong cho trinh duyet giu ban cu, sua xong la may nguoi dung dung ban moi.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
