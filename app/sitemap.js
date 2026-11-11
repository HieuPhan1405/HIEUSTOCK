import { NGANH } from "@/engine/danh-sach/nganh";

const GOC = "https://www.cloudstock.id.vn";

// 11/11/2026: them cac trang con thieu (/dashboard, /gioi-thieu, /phai-sinh, /kich-ban-mua, /danh-muc) va TRANG TUNG MA (/ma/XXX) cua cac ma he thong dang quet
// (engine/danh-sach/nganh.js) - truoc chi co 15 trang tinh, khong co trang ma nao trong khi day la trang nguoi dung tim tren Google nhieu nhat.
export default function sitemap() {
  const trang = ["", "/dashboard", "/nganh", "/tuong-quan", "/thi-truong", "/bo-loc", "/co-ban", "/bieu-do", "/lenh-mo", "/kich-ban-mua", "/lenh-da-dong", "/dai-han", "/phai-sinh", "/bat-day", "/mua-phuc-hoi", "/hoi-giam-dai", "/danh-muc", "/danh-gia-danh-muc", "/gioi-thieu", "/huong-dan", "/lien-he", "/dieu-khoan", "/bao-mat"];
  const it = (p) => ["/huong-dan", "/lien-he", "/gioi-thieu", "/dieu-khoan", "/bao-mat"].includes(p);
  const cacMa = [...new Set([...NGANH.values()].flatMap((s) => [...s]))].sort();
  return [
    ...trang.map((p) => ({ url: `${GOC}${p}`, changeFrequency: it(p) ? "monthly" : "daily", priority: p === "" ? 1 : 0.7 })),
    ...cacMa.map((ma) => ({ url: `${GOC}/ma/${ma}`, changeFrequency: "daily", priority: 0.6 })),
  ];
}
