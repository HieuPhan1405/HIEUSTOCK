// MENU CHINH (8 muc) - ham THUAN, import tuong doi de test tay: engine/test/menu.test.mjs. Dung cho components/Sidebar.js va components/ThanhTabNhom.js.
// Muc co "tab" gop nhieu trang cung chu de: bam vao muc -> trang dau tien, trong trang co thanh tab de chuyen qua lai. Duong dan cac trang giu nguyen (lien ket cu van chay).
// 04/11/2026 sap lai theo MUC DICH nguoi dung (kieu Simplize / TradingView): tim co phieu (Bo loc: Ky thuat, Co ban) - lenh cua he thong (So lenh: Dang mo, Da dong, Sap co lenh)
// - dau tu dai han thanh muc rieng (truoc nam lan trong Bo loc) - "Kich ban mua" (ma sap ra tin hieu MUA) chuyen sang So lenh. 4 muc dau giu nguyen (thanh duoi dien thoai).
// 04/11/2026 (2): "So lenh" doi ten thanh "Dau tu theo xu huong" (nhan ngan "Tin hieu" o thanh duoi dien thoai), dung canh "Dau tu dai han" va "Bat day" = 3 cach dau tu lien nhau;
// Bo loc / Bieu do la cong cu dung chung. Khop 2 phong cach Xu huong / Dai han cua Danh gia danh muc (lib/phongCachDauTu.js).
export const MENU = [
  {
    href: "/",
    nhan: "Thị trường",
    nhanNgan: "Thị trường",
    tab: [
      { href: "/", nhan: "Tổng quan" },
      { href: "/dashboard", nhan: "Dashboard" },
      { href: "/nganh", nhan: "Ngành" },
      { href: "/thi-truong", nhan: "Tin tức" },
    ],
  },
  {
    href: "/bo-loc",
    nhan: "Bộ lọc cổ phiếu",
    nhanNgan: "Bộ lọc",
    tab: [
      { href: "/bo-loc", nhan: "Kỹ thuật" },
      { href: "/co-ban", nhan: "Cơ bản" },
    ],
  },
  { href: "/bieu-do", nhan: "Biểu đồ kỹ thuật", nhanNgan: "Biểu đồ" },
  {
    href: "/lenh-mo",
    nhan: "Đầu tư theo xu hướng",
    nhanNgan: "Tín hiệu",
    tab: [
      { href: "/lenh-mo", nhan: "Lệnh đang mở" },
      { href: "/kich-ban-mua", nhan: "Sắp có lệnh" },
      { href: "/lenh-da-dong", nhan: "Lệnh đã đóng" },
    ],
  },
  { href: "/dai-han", nhan: "Đầu tư dài hạn", nhanNgan: "Dài hạn" },
  {
    href: "/bat-day",
    nhan: "Bắt đáy",
    nhanNgan: "Bắt đáy",
    tab: [
      { href: "/bat-day", nhan: "Checklist bắt đáy" },
      { href: "/mua-phuc-hoi", nhan: "Điểm mua phục hồi" },
      { href: "/hoi-giam-dai", nhan: "Hồi sau giảm dài" },
    ],
  },
  {
    href: "/danh-muc",
    nhan: "Danh mục của tôi",
    nhanNgan: "Danh mục",
    tab: [
      { href: "/danh-muc", nhan: "Danh sách theo dõi" },
      { href: "/danh-gia-danh-muc", nhan: "Đánh giá danh mục" },
    ],
  },
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
