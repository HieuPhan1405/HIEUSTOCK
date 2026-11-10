// SEO DUNG CHUNG (11/11/2026): moi trang tu dat title / description nhung truoc day og:title / og:description cua MOI trang deu la cua trang chu, khong co og:image, khong co canonical
// (Next gop metadata kieu "nong": trang con khong khai openGraph thi thua nguyen openGraph cua layout). taoMeta() tra du 1 bo: title, description, canonical, openGraph, twitter.
// Anh chia se: public/og-cloudstock.png (1200x630, tao bang scripts/taoAnhChiaSe.mjs). URL tuong doi duoc ghep voi metadataBase o app/layout.js.
export const TEN_WEB = "CloudStock";
export const GOC_WEB = "https://www.cloudstock.id.vn";
export const ANH_CHIA_SE = { url: "/og-cloudstock.png", width: 1200, height: 630, alt: "CloudStock — Hệ thống hỗ trợ đầu tư chứng khoán" };

// tieuDe: tieu de trang (khong kem "| CloudStock" - layout tu them); tieuDeDayDu: dung nguyen van (trang chu); duongDan: duong dan chuan cua trang (vd "/bo-loc", "/ma/HPG").
// khongLapChiMuc: trang chi danh cho quan tri / ca nhan -> noindex.
export function taoMeta({ tieuDe, tieuDeDayDu, moTa, duongDan, khongLapChiMuc = false }) {
  const tieuDeOg = tieuDeDayDu ?? (tieuDe ? `${tieuDe} | ${TEN_WEB}` : `${TEN_WEB} — Hệ thống hỗ trợ đầu tư`);
  return {
    ...(tieuDeDayDu ? { title: { absolute: tieuDeDayDu } } : tieuDe ? { title: tieuDe } : {}),
    ...(moTa ? { description: moTa } : {}),
    ...(duongDan ? { alternates: { canonical: duongDan } } : {}),
    ...(khongLapChiMuc ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      siteName: TEN_WEB,
      locale: "vi_VN",
      type: "website",
      title: tieuDeOg,
      ...(moTa ? { description: moTa } : {}),
      ...(duongDan ? { url: duongDan } : {}),
      images: [ANH_CHIA_SE],
    },
    twitter: { card: "summary_large_image", title: tieuDeOg, ...(moTa ? { description: moTa } : {}), images: [ANH_CHIA_SE.url] },
  };
}
