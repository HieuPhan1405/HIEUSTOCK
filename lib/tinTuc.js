// Doc tin tuc tu RSS cong khai cua CafeF va gop lai theo 3 danh muc: Vi mo
// trong nuoc, Tai chinh quoc te, Doanh nghiep. Day la RSS CONG KHAI (dung de
// chia se) nen viec doc tieu de + tom tat + link goc ve nguon la binh thuong,
// khong phai crawl/scrape trai phep - luon dan link ve bai goc tren cafef.vn.

// 11/11/2026: them muc "Chung khoan" (thi-truong-chung-khoan.rss); trang /thi-truong chi hien cac nguon co hien: true. Vi mo quoc te van doc cho API danh gia danh muc.
const NGUON = [
  { khoa: "chung_khoan", nhan: "Chứng khoán", url: "https://cafef.vn/thi-truong-chung-khoan.rss", hien: true },
  { khoa: "vi_mo_trong_nuoc", nhan: "Vĩ mô trong nước", url: "https://cafef.vn/vi-mo-dau-tu.rss", hien: true, chiTinKinhTe: true },
  { khoa: "vi_mo_quoc_te", nhan: "Vĩ mô quốc tế", url: "https://cafef.vn/tai-chinh-quoc-te.rss" },
  { khoa: "doanh_nghiep", nhan: "Doanh nghiệp", url: "https://cafef.vn/doanh-nghiep.rss", hien: true },
];

// Muc RSS "vi mo" cua CafeF lan ca tin xa hoi (lao dong, ha tang dia phuong, chien su...) -> chi giu tieu de co tu khoa kinh te / thi truong (so khop khong dau).
const boDau = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
const TU_KINH_TE = /lai suat|ty gia|lam phat|\bcpi\b|\bgdp\b|tang truong|xuat khau|nhap khau|tin dung|\bfdi\b|\bfed\b|nhnn|ngan hang|trai phieu|thue|gia vang|gia dau|xang dau|gia dien|chung khoan|vn-index|dau tu cong|giai ngan|bat dong san|ngan sach|tien te|\busd\b|thuong mai|kinh te|doanh nghiep|von ngoai|khoi ngoai|nang hang|thanh khoan|co phieu|loi nhuan|doanh thu|du an|dau tu/;
export const laTinKinhTe = (t) => TU_KINH_TE.test(boDau(t.tieuDe));

function layTagDauTien(taiKhoi, tenThe) {
  const m = new RegExp(`<${tenThe}[^>]*>([\\s\\S]*?)</${tenThe}>`).exec(taiKhoi);
  if (!m) return "";
  return m[1].replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "").trim();
}

// Phan tich 1 feed RSS 2.0 don gian (dung cho cau truc CafeF: title/link/
// description/pubDate/guid trong tung <item>). Khong dung thu vien XML ngoai
// de tranh them dependency cho 1 viec don gian, on dinh.
function phanTichRSS(xml) {
  const cacKhoi = xml.split("<item>").slice(1);
  return cacKhoi.map((khoiTho) => {
    const khoi = khoiTho.split("</item>")[0];
    const tieuDe = layTagDauTien(khoi, "title");
    const link = layTagDauTien(khoi, "link");
    const pubDate = layTagDauTien(khoi, "pubDate");
    const moTaTho = layTagDauTien(khoi, "description");
    const anhMatch = /<img[^>]*src="([^"]+)"/.exec(moTaTho);
    const moTa = moTaTho.replace(/<a[^>]*>[\s\S]*?<\/a>/, "").replace(/<[^>]+>/g, "").trim();
    const ngayISO = pubDate ? new Date(pubDate).toISOString() : null;
    return { tieuDe, link, ngayISO, moTa, anh: anhMatch ? anhMatch[1] : null };
  });
}

async function docMotNguon(nguon) {
  try {
    const res = await fetch(nguon.url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 600 }, // cache 10 phut - tranh goi CafeF lien tuc moi lan tai trang
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return phanTichRSS(xml)
      .filter((tin) => tin.tieuDe && tin.link && (!nguon.chiTinKinhTe || laTinKinhTe(tin)))
      .slice(0, 12)
      .map((tin) => ({ ...tin, danhMuc: nguon.khoa, nhanDanhMuc: nguon.nhan }));
  } catch {
    return [];
  }
}

// Tra ve { theoDanhMuc: { vi_mo_trong_nuoc: [...], ... }, tatCa: [...] (gop
// het, sap xep moi nhat truoc) }. Loi 1 nguon khong lam hong cac nguon con lai.
export async function layTinTucThiTruong() {
  const ketQua = await Promise.all(NGUON.map(docMotNguon));
  const theoDanhMuc = {};
  NGUON.forEach((n, i) => (theoDanhMuc[n.khoa] = ketQua[i]));
  const tatCa = ketQua.flat().sort((a, b) => new Date(b.ngayISO || 0) - new Date(a.ngayISO || 0));
  return { theoDanhMuc, tatCa, danhSachDanhMuc: NGUON };
}
