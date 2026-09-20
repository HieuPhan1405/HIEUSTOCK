const GOC = "https://www.cloudstock.id.vn";

// Chi liet ke cac trang tinh; trang /ma/[ma] thay doi moi phien nen de cong cu tim kiem tu kham pha qua lien ket.
export default function sitemap() {
  const trang = ["", "/bo-loc", "/bieu-do", "/lenh-mo", "/lenh-da-dong", "/bat-day", "/thi-truong", "/huong-dan", "/lien-he"];
  return trang.map((p) => ({ url: `${GOC}${p}`, changeFrequency: p === "/huong-dan" || p === "/lien-he" ? "monthly" : "daily", priority: p === "" ? 1 : 0.7 }));
}
