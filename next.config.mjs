// HEADER BAO MAT cho moi trang (them 2026-10-01): chong nhung web vao khung gia mao (clickjacking), chong trinh duyet doan sai kieu file, han che thong tin gui kem khi bam link ra ngoai,
// tat quyen thiet bi khong dung toi. CSP o day CHI gom cac chi thi "an toan, khong chan script/anh/font" (frame-ancestors, base-uri, form-action, object-src) - CSP chan script can do lai
// ky voi Next/bieu do/thong bao day truoc khi bat, chua lam.
// Trang /khung-live/chinh-noi-dung.html nhung chinh web nay trong khung xem truoc nen dung 'self' / SAMEORIGIN (khong phai 'none').
const HEADER_BAO_MAT = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Khong khoe "X-Powered-By: Next.js" (giup ke xet web kho biet dung cong nghe gi).
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: HEADER_BAO_MAT },
      // Service worker nhan thong bao ve may (public/sw.js): khong cho trinh duyet giu ban cu, sua xong la may nguoi dung dung ban moi.
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
