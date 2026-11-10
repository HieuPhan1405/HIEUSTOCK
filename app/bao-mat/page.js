import TrangVanBan from "@/components/TrangVanBan";
import { taoMeta } from "@/lib/seo";

export const metadata = taoMeta({
  tieuDe: "Chính sách bảo mật",
  moTa: "CloudStock thu thập dữ liệu gì, dùng để làm gì, lưu ở đâu và bạn có quyền gì với dữ liệu của mình.",
  duongDan: "/bao-mat",
});

// CHINH SACH BAO MAT (11/11/2026): liet ke DUNG du lieu web dang luu (bang nguoi_dung, phien_dang_nhap, danh_sach_theo_doi, danh_muc_luu, dang_ky_day,
// lien_he, gioi_han_truy_cap) va du lieu luu tren trinh duyet (localStorage). Doi cach luu du lieu thi sua trang nay.
const MUC = [
  {
    tieuDe: "Dữ liệu chúng tôi thu thập",
    doan: [
      [
        "Khi đăng ký: họ tên, số điện thoại, Gmail và mật khẩu. Mật khẩu chỉ được lưu dưới dạng mã băm (bcrypt) — không ai, kể cả quản trị viên, đọc được mật khẩu gốc.",
        "Khi dùng web: danh sách cổ phiếu bạn theo dõi, danh mục bạn lưu để đánh giá, cài đặt thông báo và thông tin thiết bị nhận thông báo đẩy (nếu bạn bật).",
        "Khi gửi tin ở trang Liên hệ: họ tên, cách liên lạc và nội dung bạn nhập.",
        "Để chống dò mật khẩu và spam: địa chỉ IP và số lần thử, chỉ giữ trong thời gian ngắn rồi tự xóa.",
      ],
    ],
  },
  {
    tieuDe: "Cookie và lưu trên trình duyệt",
    doan: [
      [
        "Một cookie đăng nhập (HttpOnly, chỉ gửi qua HTTPS) giữ phiên đăng nhập tối đa 30 ngày; đăng xuất là xóa ngay.",
        "Trình duyệt của bạn tự lưu một số lựa chọn giao diện: chế độ sáng / tối, thu gọn menu, cột hiển thị ở bảng, tab mã ở trang Biểu đồ, hình vẽ trên biểu đồ. Các lựa chọn này chỉ nằm trên máy bạn.",
        "CloudStock không dùng cookie quảng cáo và không cài công cụ theo dõi của bên thứ ba.",
      ],
    ],
  },
  {
    tieuDe: "Chúng tôi dùng dữ liệu để làm gì",
    doan: [
      [
        "Tạo và giữ tài khoản, hiển thị nội dung dành cho thành viên, gửi thông báo tín hiệu bạn đã đăng ký nhận.",
        "Hỗ trợ khi bạn cần (quên mật khẩu, hỏi cách dùng) và liên hệ về tài khoản qua số điện thoại hoặc Gmail bạn cung cấp.",
        "Bảo vệ hệ thống khỏi truy cập trái phép và lạm dụng.",
      ],
      "CloudStock không bán, không cho thuê và không chia sẻ dữ liệu cá nhân của bạn cho bên thứ ba vì mục đích quảng cáo.",
    ],
  },
  {
    tieuDe: "Dữ liệu được lưu ở đâu",
    doan: [
      "Web chạy trên hạ tầng đám mây Vercel; dữ liệu tài khoản lưu trong cơ sở dữ liệu Postgres của nhà cung cấp đám mây. Kết nối tới web luôn được mã hóa (HTTPS).",
    ],
  },
  {
    tieuDe: "Quyền của bạn",
    doan: [
      [
        "Xem thông tin tài khoản, đổi tên hiển thị và đổi mật khẩu trong Trang cá nhân.",
        "Yêu cầu sửa hoặc xóa tài khoản cùng dữ liệu liên quan bằng cách gửi tin ở trang Liên hệ (ghi số điện thoại đã đăng ký).",
        "Tắt thông báo đẩy bất cứ lúc nào trong phần thông báo.",
      ],
      "CloudStock xử lý dữ liệu cá nhân theo quy định pháp luật Việt Nam về bảo vệ dữ liệu cá nhân.",
    ],
  },
  {
    tieuDe: "Liên hệ",
    doan: ["Câu hỏi về dữ liệu cá nhân, gửi qua trang Liên hệ của CloudStock."],
  },
];

export default function TrangBaoMat() {
  return <TrangVanBan tieuDe="Chính sách bảo mật" capNhat="11/11/2026" gioiThieu="Trang này nói rõ CloudStock lưu những dữ liệu gì của bạn, dùng để làm gì và bạn có thể yêu cầu xóa như thế nào." muc={MUC} />;
}
