import { Lock } from "lucide-react";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import TaiKhoanNut from "@/components/TaiKhoanNut";

export const dynamic = "force-dynamic";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";
const NHAT = "#A6A6B3";

function Muc({ tieuDe, children }) {
  return (
    <div className="rounded-2xl border p-5 mb-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <p className="text-sm mb-3" style={{ color: TEXT, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        {tieuDe}
      </p>
      <div className="text-sm leading-relaxed" style={{ color: NHAT, fontFamily: "'Inter', sans-serif" }}>
        {children}
      </div>
    </div>
  );
}

function DanhSach({ muc }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {muc.map((m, i) => (
        <li key={i}>{m}</li>
      ))}
    </ul>
  );
}

function TieuDeLon({ chu, phu }) {
  return (
    <div className="mt-10 mb-4">
      <h2 className="text-xl" style={{ color: TEXT, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        {chu}
      </h2>
      {phu && (
        <p className="text-sm mt-1" style={{ color: MUTED }}>
          {phu}
        </p>
      )}
    </div>
  );
}

function PhuongPhap() {
  return (
    <>
      <Muc tieuDe="Nguyên tắc chung">
        <p>
          Hệ thống giao dịch <b>theo xu hướng</b>, kết hợp ba nhóm tín hiệu: cấu trúc xu hướng kiểu Ichimoku (Mây, các đường trung
          bình dài hạn), động lượng (RSI) và dòng tiền (MFI, khối lượng). Mỗi mã được chấm một <b>điểm hợp lưu</b>; chỉ khi điểm
          đủ cao <b>và</b> qua đủ các bộ lọc an toàn bên dưới thì mới phát tín hiệu MUA. Rủi ro được cố định ngay lúc vào lệnh
          bằng stop-loss.
        </p>
      </Muc>

      <Muc tieuDe="1. Điểm hợp lưu">
        <p className="mb-2">
          <b>Điểm = Trend × 1.5 + Dòng tiền × 1.2 + Momentum × 1.0</b>
        </p>
        <DanhSach
          muc={[
            "Trend (−3 đến +3): giá so với Mây (±1), giá so với dải dài hạn 65/129 phiên (±1), Tenkan so với Kijun (±0.5), và ADX > 25 thì cộng/trừ 0.5 theo hướng DI.",
            "Momentum (±0.5): dựa trên RSI (trên 50 là dương, quá mua > 70 bị trừ, quá bán < 30 được cộng).",
            "Dòng tiền: MFI (±0.5) cộng thêm khối lượng so với trung bình 20 phiên (+0.5 nếu > 1.5 lần, −0.3 nếu < 0.5 lần).",
          ]}
        />
      </Muc>

      <Muc tieuDe="2. Điều kiện MUA (phải thoả tất cả)">
        <DanhSach
          muc={[
            "Điểm hợp lưu ≥ 1.25.",
            "Sức mạnh xu hướng: ADX ≥ 18 (nếu điểm ≥ 2.0 thì được bỏ qua điều kiện ADX).",
            "Vùng vào lệnh đẹp: giá đang hồi về vùng khoảng trống giá (FVG) đủ lớn (≥ 0.6 ATR, hiệu lực 15 phiên). Ngoại lệ: breakout mạnh (điểm ≥ 2.25 kèm khối lượng xác nhận) thì không cần chờ hồi.",
            "Phiên đầu tiên điểm vượt ngưỡng cần khối lượng xác nhận: ≥ 150% trung bình 20 phiên, ≥ 130% hôm trước, và lớn hơn khối lượng ngày giảm mạnh nhất 10 phiên gần nhất. Nếu chưa đạt, vẫn có thể mua ở các phiên sau trong cùng đợt (mỗi đợt chỉ mua 1 lần).",
            "Mạnh hơn thị trường: RS so với VN-Index 20 phiên > 0.",
            "An toàn thanh khoản: khối lượng trung bình 20 phiên ≥ 100.000 cổ phiếu và giá ≥ 10.000đ.",
          ]}
        />
        <p className="mt-3">
          <b>Độ rộng ngành</b> không chặn lệnh mà điều chỉnh tỷ trọng: ngành mạnh (≥ 60% mã trên đường MA50) dùng 100% mức chuẩn,
          ngành trung bình 50%, ngành yếu (&lt; 30%) chỉ 20%. Mức chuẩn gợi ý là 12.5% vốn/vị thế, tối đa 8 vị thế cùng lúc.
        </p>
      </Muc>

      <Muc tieuDe="3. Stop-loss">
        <p>
          Đặt ngay khi vào lệnh và <b>giữ cố định</b>: giá vào − mức nhỏ hơn giữa <b>2.2 × ATR(14)</b> và <b>6% giá vào</b>. Lệnh
          chỉ bị bán thật khi giá chạm stop <b>và</b> điểm hợp lưu phiên đó đang âm (&lt; 0) — tránh cắt lỗ oan chỉ vì một cây râu
          nến tạm thời trong khi cấu trúc kỹ thuật vẫn còn ổn.
        </p>
      </Muc>

      <Muc tieuDe="4. Điều kiện BÁN và cảnh báo Bán bớt">
        <DanhSach
          muc={[
            "BÁN: điểm ≤ −1.5 trong 3 phiên liên tiếp (xác nhận), hoặc chạm stop-loss kèm điểm < 0.",
            "Quy tắc T+2.5: lệnh bán phải cách lệnh mua tối thiểu 2 phiên.",
            "Bán bớt (cảnh báo): điểm đã ≤ −1.5 nhưng chưa đủ 3 phiên xác nhận — gợi ý giảm bớt vị thế sớm, không đợi tín hiệu Bán toàn bộ.",
          ]}
        />
      </Muc>

      <Muc tieuDe="5. Chốt lời từng phần (TP1 / TP2 / TP3)">
        <p>
          Ba mốc được <b>đóng băng tại lúc mua</b> từ ba nguồn kháng cự: đỉnh gần 60 phiên (TP1 ngắn hạn), dải Mây / đường dài
          hạn (TP2 trung hạn) và đỉnh 52 tuần (TP3 dài hạn), sắp xếp từ thấp đến cao; mỗi mốc luôn cao hơn giá vào tối thiểu
          5% / 10% / 15%. Nhãn <b>&quot;Đã chạm&quot;</b> nghĩa là giá đã từng lên tới mốc đó vào bất kỳ thời điểm nào trong quá
          trình giữ (kể cả khi sau đó giá tụt xuống lại). Hệ thống chỉ gợi ý chốt lời, không tự bán.
        </p>
      </Muc>

      <Muc tieuDe="6. Chỉ báo tham khảo (không quyết định mua/bán)">
        <DanhSach
          muc={[
            "Cảnh báo Mắt Thần: giá phá đỉnh trên Mây rồi quay lại kiểm định mà không bật lên được qua Tenkan — rủi ro đảo chiều, chỉ để chú ý.",
            "Độ tin cậy 0–3 (Sanyaku): số điều kiện đạt trong 3 điều kiện kinh điển của Ichimoku (Tenkan cắt lên Kijun, Chikou thoát khỏi vùng giá, giá phá lên trên Mây).",
            "Rank (chất lượng setup, 0–100) = Sanyaku 25 + FVG 20 + ADX 20 + độ rộng ngành 20 + RS so với VN-Index 15.",
            "Confidence (độ tự tin, 0–100) = mức đồng thuận giữa Trend / Momentum / Dòng tiền (60) + số phiên điểm đã giữ vững một hướng (40, đầy khi ≥ 10 phiên).",
          ]}
        />
      </Muc>

      <Muc tieuDe="7. Checklist dò bắt đáy (hệ thống riêng)">
        <p>
          Dành cho tình huống mã đã giảm sâu. Cộng điểm khi: chiết khấu ≥ 20% so với đỉnh 52 tuần, RSI &lt; 35 / MFI &lt; 30,
          Williams %R &lt; −80, giá lệch ≤ −12% so với MA200, có phiên capitulation (bán tháo khối lượng lớn), phân kỳ đáy, đáy sau
          cao hơn đáy trước và ngày follow-through (tăng mạnh kèm khối lượng). Khi tổng điểm vượt ngưỡng 5 lần đầu tiên, ghi nhận
          một &quot;lần bắt đáy&quot; và theo dõi kết quả sau 5 / 10 / 20 phiên; coi là thành công nếu sau 20 phiên giá cao hơn lúc
          kích hoạt.
        </p>
      </Muc>
    </>
  );
}

export default async function TrangHuongDan() {
  let nguoiDung = null;
  try {
    nguoiDung = await layNguoiDungHienTai();
  } catch {
    nguoiDung = null;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10" style={{ color: TEXT }}>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
        Hướng dẫn &amp; phương pháp giao dịch
      </h1>
      <p className="text-sm" style={{ color: MUTED }}>
        Cách đọc từng trang trên CloudStock và nguyên tắc đằng sau các tín hiệu MUA / BÁN.
      </p>

      <TieuDeLon chu="Cách sử dụng web" />

      <Muc tieuDe="Tổng quan thị trường">
        <p>
          Các thẻ trên cùng đếm nhanh: mã đang theo dõi, tỷ lệ xu hướng tăng, tín hiệu MUA hôm nay, cảnh báo Mắt Thần, cơ hội chốt
          lời và cảnh báo bán bớt — <b>bấm vào thẻ</b> để mở Bộ lọc đã lọc sẵn đúng nhóm đó. Bên dưới là nhận định thị trường tự
          động, độ rộng theo vốn hoá (VN30 / Midcap / Smallcap) và danh sách tín hiệu MUA / BÁN mới phát sinh (tín hiệu MUA kèm
          Rank và Confidence).
        </p>
      </Muc>

      <Muc tieuDe="Bộ lọc cổ phiếu">
        <DanhSach
          muc={[
            "Lọc theo tín hiệu, vốn hoá, xu hướng, sàn (HOSE / HNX / UPCOM), ngành và các cảnh báo (Mắt Thần, đã chạm chốt lời, Bán bớt).",
            "Tích \"Chỉ mã sắp đến điểm MUA\" để xem các mã đang trung lập nhưng điểm đã sát ngưỡng mua — dùng theo dõi trong phiên xem mã nào sắp kích hoạt.",
            "Bấm vào tiêu đề cột để sắp xếp cao → thấp / thấp → cao. Cột KL TB20 là khối lượng trung bình 20 phiên (cổ phiếu): trên 100.000 là qua bộ lọc thanh khoản an toàn.",
            "Cột Tín hiệu chỉ hiện đầy đủ sau khi đăng ký / đăng nhập.",
          ]}
        />
      </Muc>

      <Muc tieuDe="Sổ lệnh đang mở">
        <p>
          Toàn bộ mã đang MUA hoặc NẮM GIỮ: ngày mua, giá mua, số phiên đã giữ, lãi/lỗ hiện tại, mốc chốt lời cao nhất đã chạm và
          cảnh báo (Mắt Thần, Bán bớt). Các thẻ thống kê phía trên cho biết tỷ lệ lãi, tỷ lệ lỗ, lãi/lỗ trung bình và tỷ lệ lệnh đã
          chạm chốt lời (ví dụ 10 lệnh có 7 lệnh đã chạm TP thì là 70%).
        </p>
      </Muc>

      <Muc tieuDe="Checklist bắt đáy">
        <p>
          Lịch sử các lần checklist bắt đáy kích hoạt, kèm giá lúc đó, giá hiện tại và kết quả sau 5 / 10 / 20 phiên.
          &quot;Đang theo dõi&quot; nghĩa là tín hiệu còn quá mới, chưa đủ 20 phiên để đánh giá.
        </p>
      </Muc>

      <Muc tieuDe="Trang chi tiết từng mã">
        <p>
          Bấm vào một mã để xem điểm hợp lưu, kết luận, phân tích vì sao mã được số điểm đó, vùng giá quan trọng (hỗ trợ / kháng cự /
          stop-loss), ba mốc chốt lời (kèm nhãn &quot;✓ Đã chạm&quot;), định giá tham khảo của các công ty chứng khoán và câu chuyện
          kỳ vọng.
        </p>
      </Muc>

      <Muc tieuDe="Đăng ký, Tham gia và một vài lưu ý">
        <DanhSach
          muc={[
            "Đăng ký bằng số điện thoại + mật khẩu (miễn phí) để mở khoá Checklist bắt đáy, Sổ lệnh đang mở và cột Tín hiệu ở Bộ lọc.",
            "Biểu tượng người kèm số cạnh mã là nút Tham gia: bấm để theo dõi mã đó (cần đăng nhập), con số là tổng người đang quan tâm.",
            "Giá hiển thị theo đơn vị nghìn đồng (134.5 nghĩa là 134.500đ).",
            "Tín hiệu tính theo nến ngày và được cập nhật mỗi lần hệ thống quét thị trường; thời điểm cập nhật hiển thị ở đầu trang chi tiết mã.",
          ]}
        />
      </Muc>

      <TieuDeLon chu="Phương pháp giao dịch" phu="Các quy tắc cụ thể mà hệ thống đang dùng để phát tín hiệu." />

      {nguoiDung ? (
        <PhuongPhap />
      ) : (
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(108,92,231,0.16)" }}
          >
            <Lock size={22} color={PRIMARY} strokeWidth={2} />
          </div>
          <p className="text-base mb-2" style={{ color: TEXT, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
            Phương pháp giao dịch chi tiết dành cho thành viên
          </p>
          <p className="text-sm mb-6" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
            Đăng ký hoặc đăng nhập miễn phí để xem đầy đủ điều kiện MUA / BÁN, cách đặt stop-loss và các mốc chốt lời.
          </p>
          <div className="flex justify-center">
            <TaiKhoanNut nhan="Đăng ký / Đăng nhập để xem" />
          </div>
        </div>
      )}

      <p className="text-[11px] mt-8" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
        Đây là công cụ hỗ trợ đọc biểu đồ, không phải khuyến nghị đầu tư. Hiệu suất quá khứ không đảm bảo kết quả tương lai; quyết
        định giao dịch và rủi ro thuộc về nhà đầu tư.
      </p>
    </div>
  );
}
