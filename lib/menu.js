// MENU CHINH (7 muc) - ham THUAN, import tuong doi de test tay: engine/test/menu.test.mjs. Dung cho components/Sidebar.js va components/ThanhTabNhom.js.
// Muc co "tab" gop nhieu trang cung chu de: bam vao muc -> trang dau tien, trong trang co thanh tab de chuyen qua lai. Duong dan cac trang giu nguyen (lien ket cu van chay).
export const MENU = [
  {
    href: "/",
    nhan: "Thị trường",
    nhanNgan: "Thị trường",
    tab: [
      { href: "/", nhan: "Tổng quan" },
      { href: "/dashboard", nhan: "Dashboard" },
      { href: "/thi-truong", nhan: "Tin tức" },
    ],
  },
  {
    href: "/bo-loc",
    nhan: "Bộ lọc cổ phiếu",
    nhanNgan: "Bộ lọc",
    tab: [
      { href: "/bo-loc", nhan: "Bộ lọc" },
      { href: "/kich-ban-mua", nhan: "Kịch bản mua" },
    ],
  },
  { href: "/bieu-do", nhan: "Biểu đồ kỹ thuật", nhanNgan: "Biểu đồ" },
  {
    href: "/lenh-mo",
    nhan: "Sổ lệnh",
    nhanNgan: "Sổ lệnh",
    tab: [
      { href: "/lenh-mo", nhan: "Đang mở" },
      { href: "/lenh-da-dong", nhan: "Đã đóng" },
    ],
  },
  { href: "/danh-muc", nhan: "Danh mục theo dõi", nhanNgan: "Danh mục" },
  { href: "/bat-day", nhan: "Checklist bắt đáy", nhanNgan: "Bắt đáy" },
  { href: "/huong-dan", nhan: "Hướng dẫn", nhanNgan: "Hướng dẫn" },
];

const khop = (duongDan, href) => (href === "/" ? duongDan === "/" : duongDan === href || duongDan.startsWith(`${href}/`));

// Muc menu dang mo cho duong dan hien tai (tinh ca cac trang trong tab cua muc) - null neu trang khong thuoc menu (vd /ma/VPB, /lien-he).
export function mucDangMo(duongDan) {
  const p = duongDan || "/";
  return MENU.find((m) => khop(p, m.href) || m.tab?.some((t) => khop(p, t.href))) ?? null;
}

// Thanh tab cua trang hien tai (neu trang thuoc 1 muc co tab): { tab: [...], dangChon: href } hoac null.
export function tabCuaTrang(duongDan) {
  const m = mucDangMo(duongDan);
  if (!m?.tab) return null;
  const dangChon = m.tab.find((t) => khop(duongDan || "/", t.href));
  return dangChon ? { tab: m.tab, dangChon: dangChon.href } : null;
}
