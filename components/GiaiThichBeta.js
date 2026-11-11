import { TUONG_QUAN } from "@/lib/tuongQuanDuLieu";
import { Khoi, TEXT, MUTED, VIEN, CAM, sans } from "@/components/DanhGiaChung";
import GiaiThichThem from "@/components/GiaiThichThem";

const so2 = (x) => x.toFixed(2).replace(".", ",");

// "BETA CAO LA GI?" - giai thich cho nguoi moi + so lieu that cua trang. Nhom beta (so voi thi truong chung): Cao >= 1,2 · Trung binh 0,8 - 1,2 · Thap < 0,8.
export default function GiaiThichBeta() {
  const t = TUONG_QUAN.thongKeBeta;
  const the = [
    { nhan: "Beta cao", dk: "≥ 1,2", mau: CAM, so: t.ttTren12, noi: "Thị trường tăng 1% thì mã thường tăng khoảng 1,2% trở lên; thị trường giảm 1% thì cũng giảm mạnh hơn. Lên nhanh, xuống cũng nhanh — hợp người chịu được biến động lớn." },
    { nhan: "Beta trung bình", dk: "0,8 – 1,2", mau: TEXT, so: t.tong - t.ttTren12 - t.ttDuoi08, noi: "Đi gần giống thị trường chung." },
    { nhan: "Beta thấp", dk: "< 0,8", mau: "var(--cyan)", so: t.ttDuoi08, noi: "Dao động nhẹ hơn thị trường, thường là mã phòng thủ (điện nước, dược, tiêu dùng…). Lên chậm hơn khi thị trường bùng nổ, nhưng cũng ít sụt hơn khi thị trường giảm." },
  ];
  return (
    <Khoi tieuDe="Beta cao là gì?" phu="Beta đo độ nhạy của cổ phiếu với thị trường: beta 1,5 nghĩa là trung bình khi thị trường tăng hoặc giảm 1% thì mã tăng hoặc giảm khoảng 1,5% (tính trên các phiên gần đây). Beta cao = biến động mạnh hơn thị trường; không có nghĩa là tốt hay xấu.">
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        {the.map((x) => (
          <div key={x.nhan} className="rounded-xl border p-3" style={{ borderColor: VIEN }}>
            <p className="flex items-baseline justify-between gap-2" style={sans}>
              <span style={{ color: x.mau, fontWeight: 800 }}>{x.nhan}</span>
              <span className="text-xs" style={{ color: MUTED }}>
                {x.dk}
              </span>
            </p>
            <p className="text-2xl my-1" style={{ ...sans, fontWeight: 800 }}>
              {x.so}{" "}
              <span className="text-xs font-normal" style={{ color: MUTED }}>
                mã
              </span>
            </p>
            <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
              {x.noi}
            </p>
          </div>
        ))}
      </div>
      <ul className="text-sm space-y-2 mb-3" style={{ color: MUTED, ...sans }}>
        <li>
          <b style={{ color: TEXT }}>Vì sao có hai cột beta?</b> VN-Index bị nhóm Vingroup (VIC, VHM, VRE…) chi phối, nên beta so với VN-Index của đa số mã chỉ khoảng {so2(t.trungVi)} (trung vị {t.tong} mã), chỉ {t.tren1} mã trên 1. Vì vậy trang còn tính <b style={{ color: TEXT }}>beta so với thị trường chung</b> (trung bình cộng lợi suất mọi mã, trung vị {so2(t.ttTrungVi)}) để so sánh các mã với nhau dễ hơn; nhóm Cao / Trung bình / Thấp tính theo cột này.
        </li>
        <li>
          <b style={{ color: TEXT }}>Beta khi VN-Index giảm</b> chỉ tính các phiên VN-Index giảm: cho biết mã “ngã” mạnh cỡ nào khi thị trường xấu. Mã có beta này cao hơn hẳn beta thường là mã giảm sâu hơn nó tăng.
        </li>
        <li>
          <b style={{ color: TEXT }}>Tương quan</b> (từ −1 đến 1) cho biết hai chuỗi lợi suất đi cùng chiều đến đâu. Tương quan cao nhưng beta thấp = đi cùng chiều thị trường nhưng biên độ nhỏ; tương quan thấp = mã có “câu chuyện riêng”.
        </li>
      </ul>
      <GiaiThichThem tomTat="Cách dùng và giới hạn." nhanMo="Xem cách dùng và giới hạn">
        <p className="mb-1.5">
          <b style={{ color: TEXT }}>Cách dùng:</b> giữ nhiều mã beta cao cùng lúc nghĩa là danh mục sẽ rung lắc mạnh khi thị trường đảo chiều; muốn giảm rủi ro thì phối hợp mã beta thấp hoặc các mã/ngành tương quan thấp với nhau (xem ma trận bên dưới). Khi thị trường đang tăng mạnh, mã beta cao thường tăng nhanh hơn; khi giảm thì ngược lại.
        </p>
        <p className="mb-1.5">
          <b style={{ color: TEXT }}>Giới hạn:</b> beta và tương quan là thống kê của {TUONG_QUAN.soPhien} phiên gần nhất, sẽ đổi theo thời gian và không bảo đảm đúng trong tương lai. Chỉ gồm các mã đang niêm yết trong dữ liệu. Mã ít thanh khoản thường có beta thấp giả vì ngày không giao dịch lợi suất bằng 0. Tương quan không phải quan hệ nhân quả.
        </p>
        <p>Thông tin chỉ để tham khảo, không phải khuyến nghị mua bán.</p>
      </GiaiThichThem>
    </Khoi>
  );
}
