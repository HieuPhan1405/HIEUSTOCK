import { layTatCaTinHieu } from "@/lib/tinHieu";
import { layChiBaoKyThuat } from "@/lib/chiBaoLocDb";
import { dungHoiSauGiamDai } from "@/lib/hoiSauGiamDai";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import BangHoiGiamDai from "@/components/BangHoiGiamDai";
import KhoaTrangNoiDung from "@/components/KhoaTrangNoiDung";
import { thongBaoLoi } from "@/lib/loiAnToan";
import GiaiThichThem from "@/components/GiaiThichThem";
import DaiThongKe, { OThongKe } from "@/components/DaiThongKe";
import { NhanMuc } from "@/components/LienKetPhongCach";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Hồi sau giảm dài",
  description: "Checklist bắt nhịp hồi của cổ phiếu đã giảm rất lâu, cầm hết nhịp hồi thay vì cố định số phiên.",
};

const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const DO = "var(--do)";
const sans = { fontFamily: "var(--font-chu)" };

export default async function TrangHoiGiamDai() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung || !nguoiDung.da_duyet) {
    return (
      <KhoaTrangNoiDung
        tieuDe="Checklist hồi sau giảm dài"
        moTa="Đăng ký hoặc đăng nhập miễn phí để xem danh sách cổ phiếu đang hồi sau giai đoạn giảm dài."
        choDuyet={!!nguoiDung}
      />
    );
  }

  let ket = { dangCam: [], gan: [], soGiamDai: 0 };
  let loi = null;
  let capNhatLuc = null;
  try {
    const [chiBao, tatCa] = await Promise.all([layChiBaoKyThuat(), layTatCaTinHieu()]);
    ket = dungHoiSauGiamDai({ hang: chiBao.hang, tatCa });
    capNhatLuc = chiBao.capNhatLuc;
  } catch (e) {
    loi = thongBaoLoi(e);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8" style={{ color: TEXT }}>
      <NhanMuc chu="Bắt đáy" />
      <h1 className="text-2xl mb-1" style={{ ...sans, fontWeight: 700 }}>Hồi sau giảm dài</h1>
      <p className="text-sm mb-1" style={{ color: MUTED }}>
        Bắt nhịp hồi của cổ phiếu đã giảm rất lâu (BĐS, chứng khoán, thép...). Vào khi đủ 4 điều kiện, <b>cầm hết nhịp hồi</b>: bán khi đóng cửa dưới MA50 hoặc thủng cắt lỗ −10%.
        {capNhatLuc && <span> Cập nhật lúc {new Date(capNhatLuc).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}.</span>}
      </p>
      <p className="text-sm mb-1" style={{ color: "var(--vang)" }}>
        Kiểm chứng lịch sử: chỉ khoảng 1/3 lệnh thắng và danh mục mô phỏng thấp hơn mua giữ VN-Index — chỉ nên dùng phần vốn nhỏ.
      </p>
      <GiaiThichThem nhanMo="4 điều kiện vào lệnh" className="mb-4">
        <ol className="list-decimal pl-5 space-y-0.5">
          <li><b>Giảm dài</b>: đóng cửa ≤ 65% đỉnh 250 phiên, đỉnh cách đây ≥ 100 phiên.</li>
          <li><b>Thanh khoản</b>: giá trị giao dịch trung bình 20 phiên ≥ 3 tỷ.</li>
          <li><b>Đáy sau cao hơn</b>: đáy 30 phiên gần nhất cao hơn đáy 30 phiên trước đó.</li>
          <li><b>Trên Tenkan và Kijun</b>: đóng cửa cao hơn cả hai.</li>
        </ol>
      </GiaiThichThem>

      {loi && <p className="text-sm mb-6" style={{ color: DO }}>Lỗi tải dữ liệu: {loi}</p>}

      <DaiThongKe cot={3}>
        <OThongKe nhan="Đang cầm nhịp hồi" so={ket.dangCam.length} mau={ket.dangCam.length ? "var(--xanh)" : undefined} />
        <OThongKe nhan="Gần đủ điều kiện (3/4)" so={ket.gan.length} mau={ket.gan.length ? "var(--vang)" : undefined} />
        <OThongKe nhan="Mã đang giảm dài" so={ket.soGiamDai} />
      </DaiThongKe>

      <BangHoiGiamDai dangCam={ket.dangCam} gan={ket.gan} />

      <GiaiThichThem nhanMo="Bằng chứng lịch sử 2014–2026 (đọc kỹ trước khi dùng)">
        <ul className="list-disc pl-5 space-y-0.5">
          <li>Vào bằng điều kiện này, thoát dưới MA50: lãi trung bình khoảng +2,5% mỗi lệnh (từ 2022.5), nhưng chỉ ~34% lệnh thắng, lệnh trung vị lỗ khoảng −2%. Lãi đến từ ít lệnh thắng rất lớn.</li>
          <li>Mô phỏng danh mục giới hạn vị thế (mọi ngành, cùng quy tắc) cho 1–5%/năm, thấp hơn mua giữ VN-Index (9,3%/năm) và âm từ 2022.5 — không nên dùng như hệ thống độc lập, chia vốn nhỏ.</li>
          <li>Khá hơn ở chứng khoán, thép, hóa chất – cao su, dệt may; gần như không có lợi thế ở ngân hàng, công nghệ, nông nghiệp, thực phẩm, du lịch; BĐS hợp &quot;phá vùng tích lũy có khối lượng&quot; hơn.</li>
          <li>Dữ liệu kiểm tra chưa gồm cổ phiếu đã hủy niêm yết nên kết quả thực tế có thể kém hơn. Chỉ là công cụ tham khảo, không phải khuyến nghị đầu tư.</li>
        </ul>
      </GiaiThichThem>
    </div>
  );
}
