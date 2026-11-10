import TrangVanBan from "@/components/TrangVanBan";
import { taoMeta } from "@/lib/seo";

export const metadata = taoMeta({
  tieuDe: "Điều khoản sử dụng",
  moTa: "Điều khoản sử dụng CloudStock: phạm vi dịch vụ, tài khoản và dùng thử, giới hạn trách nhiệm, quyền sở hữu nội dung.",
  duongDan: "/dieu-khoan",
});

// DIEU KHOAN SU DUNG (11/11/2026): noi dung chi mo ta dung cach web dang van hanh (khong hua hen loi nhuan, khong nhan uy thac, khong dat lenh ho).
const MUC = [
  {
    tieuDe: "CloudStock là gì",
    doan: [
      "CloudStock là công cụ phân tích dữ liệu chứng khoán: quét cổ phiếu HOSE, HNX, UPCOM, tính điểm kỹ thuật, phát tín hiệu tự động và hiển thị số liệu thị trường.",
      "CloudStock không phải công ty chứng khoán, không tư vấn đầu tư cho từng cá nhân, không nhận ủy thác, không giữ tiền hay đặt lệnh hộ người dùng.",
    ],
  },
  {
    tieuDe: "Thông tin chỉ để tham khảo",
    doan: [
      [
        "Tín hiệu, điểm số, vùng giá, mức cắt lỗ và chốt lời là kết quả tính toán tự động theo quy tắc cố định, không phải khuyến nghị mua bán.",
        "Kết quả kiểm tra trên dữ liệu quá khứ (backtest) không bảo đảm kết quả trong tương lai.",
        "Dữ liệu giá, khối ngoại, tin tức lấy từ nguồn bên thứ ba (DNSE, VNDirect, CafeF) và có thể trễ, thiếu hoặc sai. Tín hiệu trên web cập nhật theo từng lần dữ liệu được đẩy lên, không phải thời gian thực.",
        "Bạn tự quyết định và tự chịu trách nhiệm với mọi giao dịch của mình.",
      ],
    ],
  },
  {
    tieuDe: "Tài khoản và dùng thử",
    doan: [
      [
        "Tài khoản đăng ký bằng số điện thoại và Gmail của chính bạn; mỗi người dùng một tài khoản, không chia sẻ tài khoản cho người khác.",
        "Tài khoản mới được dùng thử miễn phí tuần đầu với đầy đủ nội dung dành cho thành viên. Sau thời gian dùng thử, quyền xem nội dung thành viên do CloudStock xét duyệt; bạn có thể liên hệ qua trang Liên hệ.",
        "Bạn có trách nhiệm giữ bí mật mật khẩu. CloudStock không bao giờ hỏi mật khẩu của bạn qua điện thoại hay tin nhắn.",
      ],
    ],
  },
  {
    tieuDe: "Những việc không được làm",
    doan: [
      [
        "Sao chép, bán lại hoặc phát tán có hệ thống tín hiệu và dữ liệu dành cho thành viên.",
        "Dùng công cụ tự động để thu thập dữ liệu hàng loạt hoặc làm quá tải hệ thống.",
        "Dò mật khẩu, truy cập trái phép hoặc can thiệp vào hệ thống.",
      ],
      "CloudStock có thể tạm khóa hoặc chấm dứt tài khoản vi phạm các điều trên.",
    ],
  },
  {
    tieuDe: "Thay đổi dịch vụ",
    doan: [
      "CloudStock có thể thêm, sửa hoặc ngừng một tính năng, thay đổi cách tính tín hiệu hoặc tạm dừng web để bảo trì. Thay đổi quan trọng về điều khoản sẽ được cập nhật trên trang này kèm ngày cập nhật.",
    ],
  },
  {
    tieuDe: "Giới hạn trách nhiệm",
    doan: [
      "CloudStock không chịu trách nhiệm về thua lỗ, lợi nhuận bị mất hoặc thiệt hại phát sinh từ việc sử dụng hay dựa vào thông tin trên web, kể cả khi dữ liệu bị trễ, sai hoặc web tạm ngừng hoạt động.",
    ],
  },
  {
    tieuDe: "Liên hệ",
    doan: ["Mọi câu hỏi về điều khoản, gửi qua trang Liên hệ của CloudStock."],
  },
];

export default function TrangDieuKhoan() {
  return <TrangVanBan tieuDe="Điều khoản sử dụng" capNhat="11/11/2026" gioiThieu="Khi dùng CloudStock, bạn đồng ý với các điều khoản dưới đây." muc={MUC} />;
}
