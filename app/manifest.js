// Thong tin "ung dung" cua web: cho phep them CloudStock vao Man hinh chinh (dien thoai) - iPhone/iPad BAT BUOC them vao Man hinh chinh moi nhan duoc thong bao ve may.
export default function manifest() {
  return {
    name: "CloudStock — Hệ thống hỗ trợ đầu tư",
    short_name: "CloudStock",
    description: "Tín hiệu mua / bán cổ phiếu HOSE, HNX, UPCOM, vùng mua, cắt lỗ, chốt lời.",
    lang: "vi",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0B10",
    theme_color: "#0B0B10",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
