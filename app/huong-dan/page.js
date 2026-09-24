import { Lock } from "lucide-react";
import { layNguoiDungHienTai } from "@/lib/nguoiDung";
import TaiKhoanNut from "@/components/TaiKhoanNut";
import SignalPill from "@/components/SignalPill";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Hướng dẫn & nguyên tắc",
  description: "Cách đọc tín hiệu, vùng mua, cắt lỗ, chốt lời và nguyên tắc quản trị vốn của hệ thống CloudStock.",
};

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";
const NHAT = "#A6A6B3";
const XANH = "#22C55E";

// Phan "phuong phap" viet theo kieu NGUYEN TAC KY LUAT (quan tri von, rui ro,
// chon co phieu, thoi diem dat lenh) - CO Y KHONG neu cong thuc cham diem,
// nguong tin hieu hay dieu kien Mua/Ban chi tiet cua he thong.
function Muc({ so, tieuDe, children }) {
  return (
    <div className="rounded-2xl border p-5 mb-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex gap-4">
        {so != null && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm"
            style={{ background: "rgba(34,197,94,0.14)", color: XANH, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}
          >
            {so}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm mb-2" style={{ color: TEXT, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
            {tieuDe}
          </p>
          <div className="text-sm leading-relaxed" style={{ color: NHAT, fontFamily: "'Inter', sans-serif" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function Luu({ children }) {
  return (
    <p className="text-xs mt-2 italic" style={{ color: MUTED }}>
      {children}
    </p>
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

// 1 dong trong bang "Giai thich ky hieu": bieu tuong/nhan mau + loi giai thich ngan.
function KyHieu({ ky, mau, chu }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span
        className="shrink-0 min-w-[34px] text-center text-sm px-1"
        style={{ color: mau, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}
      >
        {ky}
      </span>
      <span className="text-sm">{chu}</span>
    </div>
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

function NguyenTac() {
  return (
    <>
      <Muc so={1} tieuDe="Mua thăm dò — giải ngân 1 phần">
        <p>
          Khi hệ thống báo <b style={{ color: XANH }}>MUA</b> kèm nhãn <b style={{ color: "#FBBF24" }}>&quot;Giải ngân 1 phần&quot;</b>{" "}
          (sức mạnh của mã so với thị trường còn yếu), chỉ mua khoảng <b style={{ color: XANH }}>1/3 – 1/2 tỷ trọng dự kiến</b> của mã đó.
          Ví dụ dự định dành 100 triệu cho một mã thì lần đầu chỉ giải ngân 30–50 triệu.
        </p>
        <Luu>* Vùng mua lấy mốc giá đóng cửa phiên báo MUA. Giá chưa đi xa mốc này thì vẫn xem xét vào lệnh; chạy quá xa thì không đuổi.</Luu>
      </Muc>

      <Muc so={2} tieuDe="Bổ sung & mua đủ tỷ trọng">
        <p>
          Chỉ <b style={{ color: XANH }}>bổ sung / mua đủ tỷ trọng</b> khi hệ thống báo nhãn <b style={{ color: "#22D3EE" }}>&quot;Bổ sung&quot;</b>{" "}
          — tức là lệnh trước đã <b style={{ color: XANH }}>có lãi</b> và mã đã chứng tỏ sức mạnh (đúng thì nhồi). Chỉ có vài phiên đầu để bổ sung;
          hết thời hạn mà chưa đủ điều kiện thì giữ nguyên tỷ trọng nhỏ. <b style={{ color: XANH }}>Không tăng tỷ trọng khi đang lỗ.</b>
        </p>
      </Muc>

      <Muc so={3} tieuDe="Giới hạn tỷ trọng">
        <p>
          Mỗi mã tối đa khoảng <b style={{ color: XANH }}>12,5% vốn</b> và không quá <b style={{ color: XANH }}>8 vị thế</b> cùng lúc. Ngành đang
          mạnh giải ngân đủ mức chuẩn; ngành trung bình giảm một nửa; ngành yếu chỉ giải ngân rất nhỏ.
        </p>
        <Luu>* Ví dụ vốn 800 triệu → mỗi vị thế chuẩn khoảng 100 triệu.</Luu>
      </Muc>

      <Muc so={4} tieuDe="Cắt lỗ kịp thời">
        <p>
          Mỗi lệnh có mức <b style={{ color: XANH }}>stop-loss tính sẵn</b> (hiện ở trang chi tiết mã, thường thấp hơn giá mua tối đa khoảng 6%). Khi giá
          chạm stop-loss → <b style={{ color: XANH }}>cắt lỗ ngay</b>, không chờ điểm âm, sai thì cắt sớm. Backtest 2006–2026 cho thấy giữ tiếp qua mức này thường lỗ nặng hơn cắt. Hệ thống sẽ báo BÁN (web, Zalo) ngay khi giá thấp nhất phiên chạm stop-loss; nhớ tín hiệu trong phiên có thể đổi chiều trước khi đóng cửa, và lệnh bán vẫn phải tuân thủ T+2,5.
        </p>
        <Luu>* Tỷ trọng mỗi lệnh vừa phải nên cắt lỗ chỉ gây thiệt hại nhỏ, các lệnh lãi sẽ bù đắp dư.</Luu>
      </Muc>

      <Muc so={5} tieuDe="Tín hiệu BÁN và cảnh báo Bán bớt">
        <p>
          Hệ thống báo <b style={{ color: XANH }}>BÁN</b> thì bán dứt khoát, không giữ cầu may. Khi xuất hiện cảnh báo{" "}
          <b style={{ color: "#F97316" }}>&quot;Bán bớt&quot;</b> thì giảm bớt vị thế trước, không đợi tới tín hiệu Bán toàn bộ. Nhớ quy tắc T+2,5:
          lệnh bán phải cách lệnh mua tối thiểu 2 phiên.
        </p>
      </Muc>

      <Muc so={6} tieuDe="Chốt lời từng phần">
        <p>
          Mỗi mã có <b style={{ color: XANH }}>vùng chốt lời gần (TP1–TP2)</b> và <b style={{ color: XANH }}>mốc xa (TP3)</b> cố định từ lúc mua. Nhãn{" "}
          <b style={{ color: XANH }}>&quot;Đã chạm&quot;</b> nghĩa là giá đã từng lên tới mốc đó trong quá trình giữ (kể cả sau đó giá tụt lại).
          Tỷ lệ chốt <b style={{ color: XANH }}>30/30/25/15</b>: chốt 30% ở TP1, 30% ở TP2, 25% ở TP3; <b style={{ color: XANH }}>15% cuối, nếu giá còn tăng thì nắm giữ lấy vị thế</b>
          và thoát theo tín hiệu BÁN để lệnh thắng lớn chạy tiếp. Lệnh đã chạm TP3 được ghi vào trang Lệnh đã đóng (phần 85% đã chốt). Sau TP3 mã coi như cần tìm điểm mua mới: khi giá hồi về hỗ trợ (Kijun), nến xanh và điểm còn đạt ngưỡng, hệ thống báo <b style={{ color: XANH }}>MUA THÊM</b> (tối đa 1 lần mỗi lệnh gốc) với giá mua, cắt lỗ và chốt lời riêng, tách khỏi vị thế cũ còn giữ (xem thêm phần &quot;Mua lại &amp; Bảo vệ lãi&quot; bên dưới — sau khi chạm TP2, Stop-loss của phần còn lại tự động dời về giá mua). Hệ thống chỉ
          gợi ý, không tự bán.
        </p>
      </Muc>

      <Muc so={7} tieuDe="Mua lại & Bảo vệ lãi (tự động)">
        <p>
          <b style={{ color: XANH }}>Mua lại:</b> sau khi một lệnh đã bán không lỗ, nếu xu hướng còn tăng và giá hồi về đúng hỗ trợ (Kijun) rồi bật lên lại
          (đủ điểm, giá trên mây), hệ thống tự mở lệnh mới, có Stop-loss riêng dưới hỗ trợ. Nhãn <b style={{ color: XANH }}>&quot;↺ Mua lại&quot;</b>. Giới
          hạn tối đa 2 lần liên tiếp kể từ lần mua thường gần nhất, tránh mua đi bán lại liên tục quanh một mức hỗ trợ.
        </p>
        <p className="mt-2">
          <b style={{ color: XANH }}>Bảo vệ lãi:</b> sau khi giá đã từng chạm TP2 trong lúc giữ lệnh, Stop-loss của phần đang giữ tự động dời lên{" "}
          <b style={{ color: XANH }}>đúng bằng giá mua</b> (hòa vốn). Giá quay về đúng mức đó thì bán ngay, chạm là bán, không chờ điểm âm — khóa lại phần
          lãi đã có, không để biến thành lỗ. Nhãn <b style={{ color: "#A78BFA" }}>&quot;🛡 Bảo vệ lãi&quot;</b>.
        </p>
      </Muc>

      <Muc so={8} tieuDe="Đa dạng danh mục">
        <p>
          <b style={{ color: XANH }}>Không tất tay</b> vào một mã. Nên nắm 1–2 mã mỗi ngành và trải đều nhiều ngành hấp dẫn; nhưng cũng{" "}
          <b style={{ color: XANH }}>không nên nắm quá nhiều mã</b> ngoài khả năng theo dõi của bản thân.
        </p>
      </Muc>

      <Muc so={9} tieuDe="Tiêu chí chọn cổ phiếu (bộ lọc an toàn)">
        <p>
          Ưu tiên mã có <b style={{ color: XANH }}>thị giá trên 10.000 đồng</b>, <b style={{ color: XANH }}>vốn hoá từ 3.000 tỷ</b>,{" "}
          <b style={{ color: XANH }}>khối lượng từ 500.000 cổ phiếu/phiên</b> và <b style={{ color: XANH }}>giá trị giao dịch trên 10 tỷ/phiên</b>{" "}
          (khối lượng và giá trị giao dịch tính trung bình 20 phiên). Mã kém thanh khoản khó vào/ra lệnh, dễ trượt giá. Hệ thống cũng tự loại các mã quá
          kém thanh khoản khỏi tín hiệu MUA.
        </p>
        <Luu>* Ở trang Bộ lọc và Sổ lệnh có ô &quot;Chỉ mã ưu tiên&quot; để lọc nhanh theo 4 tiêu chí trên, và ô &quot;Mã theo dõi: sắp chạm mốc tính điểm +&quot; (Bộ lọc) để theo dõi trong phiên.</Luu>
      </Muc>

      <Muc so={10} tieuDe="Thời điểm đặt lệnh (Mua/Bán)">
        <p>
          Nên đặt lệnh trong 2 khung: <b style={{ color: XANH }}>10h30 – 11h30</b> và <b style={{ color: XANH }}>14h00 – 14h45</b>. Đồng hồ ở đầu
          trang Tổng quan, Bộ lọc và Sổ lệnh cho biết đang trong hay ngoài khung, còn bao lâu tới khung tiếp theo và mốc reset lúc 09h00 mỗi phiên.
          Ngoài khung: chỉ theo dõi, tránh vội vàng lúc giá biến động mạnh đầu phiên.
        </p>
      </Muc>

      <Muc so={11} tieuDe="Các chỉ số tham khảo thêm">
        <DanhSach
          muc={[
            "Rank (chất lượng setup) và Confidence (độ tự tin), thang 0–100: càng cao càng tốt, chỉ mang tính tham khảo, không thay tín hiệu chính.",
            "Cảnh báo Mắt Thần: rủi ro đảo chiều cần chú ý, không tự động là lệnh bán.",
            "Checklist bắt đáy: hệ thống riêng dò các nhịp giảm sâu; hãy xem kết quả lịch sử sau 5 / 10 / 20 phiên để đánh giá độ tin cậy trước khi cân nhắc.",
          ]}
        />
      </Muc>

      <Muc tieuDe="Giải thích ký hiệu">
        <p className="mb-3">
          Các biểu tượng và nhãn nhỏ xuất hiện cạnh mã trong Bộ lọc, Sổ lệnh, Danh mục cá nhân và trang chi tiết mã:
        </p>
        <div className="grid sm:grid-cols-2 gap-x-6">
          <KyHieu ky="⚠" mau="#EF4444" chu={<><b style={{ color: XANH }}>Mắt Thần</b> — cảnh báo rủi ro đảo chiều, cần xem lại ngay.</>} />
          <KyHieu ky="⚠" mau="#F97316" chu={<><b style={{ color: XANH }}>Bán bớt</b> — nên giảm bớt vị thế trước khi có tín hiệu Bán toàn bộ.</>} />
          <KyHieu ky="◐" mau="#FBBF24" chu={<><b style={{ color: XANH }}>Giải ngân 1 phần</b> — RS còn yếu nên chỉ mua một phần tỷ trọng.</>} />
          <KyHieu ky="➕" mau="#22D3EE" chu={<><b style={{ color: XANH }}>Bổ sung</b> — đủ điều kiện mua nốt phần tỷ trọng còn lại.</>} />
          <KyHieu ky="↺" mau={XANH} chu={<><b style={{ color: XANH }}>Mua lại</b> — mua lại sau khi bán không lỗ, giá hồi về hỗ trợ trong xu hướng tăng.</>} />
          <KyHieu ky="➕" mau="#22D3EE" chu={<><b style={{ color: XANH }}>Mua thêm sau TP3</b> — lệnh mới sau khi lệnh gốc đã chốt đủ TP3.</>} />
          <KyHieu ky="🛡" mau="#A78BFA" chu={<><b style={{ color: XANH }}>Bảo vệ lãi</b> — Stop-loss đã dời lên cao hơn (hòa vốn) sau khi chạm TP2.</>} />
          <KyHieu ky="⏳" mau="#FBBF24" chu={<><b style={{ color: XANH }}>Đạt điểm, chờ phiên sau</b> — đủ điểm MUA nhưng phiên đầu chưa đủ khối lượng xác nhận.</>} />
          <KyHieu ky="✓" mau={XANH} chu={<><b style={{ color: XANH }}>Đã chạm</b> (TP1/TP2/TP3) — giá đã từng lên tới mốc đó, kể cả nếu sau đó tụt lại.</>} />
          <KyHieu ky="★" mau={XANH} chu={<>Đánh dấu phần kết luận hoặc nội dung chính của một thẻ thông tin.</>} />
        </div>
        <p className="mt-3">Bốn màu trạng thái tín hiệu dùng xuyên suốt trang:</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <SignalPill tin="MUA" />
          <SignalPill tin="NAM GIU" />
          <SignalPill tin="BAN" />
          <SignalPill tin="TRUNG LAP" />
        </div>
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
        Hướng dẫn &amp; nguyên tắc giao dịch
      </h1>
      <p className="text-sm" style={{ color: MUTED }}>
        Cách đọc từng trang trên CloudStock và những nguyên tắc kỷ luật khi giao dịch theo tín hiệu.
      </p>

      <TieuDeLon chu="Cách sử dụng web" />

      <Muc tieuDe="Tổng quan thị trường">
        <p>
          Đồng hồ giao dịch ở đầu trang cho biết đang trong hay ngoài khung giờ vào lệnh. Các thẻ bên dưới đếm nhanh: mã đang theo dõi, tỷ lệ xu
          hướng tăng, tín hiệu MUA hôm nay, cảnh báo Mắt Thần, cơ hội chốt lời và cảnh báo bán bớt — <b>bấm vào thẻ</b> để mở Bộ lọc đã lọc sẵn đúng
          nhóm đó. Tiếp theo là nhận định thị trường tự động, độ rộng theo vốn hoá và danh sách tín hiệu MUA / BÁN mới phát sinh (tín hiệu MUA kèm
          Rank, Confidence và nhãn &quot;Giải ngân 1 phần&quot; nếu có).
        </p>
      </Muc>

      <Muc tieuDe="Bộ lọc cổ phiếu">
        <DanhSach
          muc={[
            "Lọc theo tín hiệu, vốn hoá, xu hướng, sàn (HOSE / HNX / UPCOM), ngành và các cảnh báo (Mắt Thần, đã chạm chốt lời, Bán bớt).",
            "Tích \"Mã theo dõi\" để xem 2 nhóm mã chưa có lệnh: (1) mã đã đạt điểm MUA nhưng đang đợi phiên sau (phiên đầu tiên trên ngưỡng điểm chưa đủ khối lượng xác nhận, phiên sau vẫn trên ngưỡng thì sẽ MUA; hiện nhãn ⏳); (2) mã có giá đang sát một mốc (mây, đường cân bằng dài hạn) — vượt qua mốc đó sẽ được cộng điểm và đủ điểm MUA. Bảng hiện giá mốc cần vượt, giá đang cách mốc bao nhiêu % (chọn 1–5%) và điểm ước tính nếu vượt; dùng để canh trong phiên xem mã nào sắp kích hoạt.",
            "Tích \"Chỉ mã ưu tiên\" để chỉ giữ lại các mã đạt đủ 4 tiêu chí: giá trên 10.000đ, vốn hoá từ 3.000 tỷ, khối lượng từ 500.000 cp/phiên, giá trị giao dịch trên 10 tỷ/phiên.",
            "Nút \"Cột hiển thị\" cho bật/tắt từng chỉ số (vốn hoá, GTGD, Rank, Confidence, Stop-loss, TP...) hoặc \"Hiện tất cả\". Lựa chọn được nhớ lại cho lần sau.",
            "Bấm vào tiêu đề cột để sắp xếp. KL TB20 và GTGD TB20 là trung bình 20 phiên. Cột Tín hiệu và các cột vị thế (giá mua, lãi/lỗ, Stop-loss, TP) chỉ hiện đầy đủ sau khi đăng ký / đăng nhập.",
          ]}
        />
      </Muc>

      <Muc tieuDe="Biểu đồ kỹ thuật">
        <p>
          Biểu đồ nến Nhật kèm khối lượng, Ichimoku (Tenkan 9, Kijun 17, mây Senkou 33 dịch 26 phiên), đường cân bằng dài hạn (65 và 129 phiên) và MA 20/50/200. Bật/tắt từng chỉ báo ở thanh
          phía trên, đổi khung Ngày/Tuần và chọn khoảng thời gian (3T, 6T, 1N, 3N, Tất cả). Với mã bạn đang có lệnh (đăng nhập), biểu đồ vẽ thêm vùng mua, cắt lỗ, chốt lời gần/xa,
          mức hòa vốn và mũi tên MUA đúng ngày mua. Giá đã điều chỉnh cổ tức/thưởng cổ phiếu (giống dữ liệu AmiBroker) nên chỉ báo khớp với tín hiệu; trong phiên, nến hôm nay chạy theo giá khớp thực tế, web tự
          làm mới mỗi 30 giây. Nguồn dữ liệu là bên thứ ba nên có thể trễ hoặc tạm thời không tải được.
        </p>
      </Muc>

      <Muc tieuDe="Sổ lệnh đang mở">
        <p>
          Toàn bộ mã đang MUA hoặc NẮM GIỮ: ngày mua, giá mua, số phiên đã giữ, lãi/lỗ hiện tại, mốc chốt lời cao nhất đã chạm, cảnh báo (Mắt Thần, Bán
          bớt) và nhãn giải ngân (Giải ngân 1 phần / Bổ sung). Nhãn ↺ Mua lại nghĩa là lệnh mua lại khi giá hồi về hỗ trợ trong xu hướng tăng (sau khi lệnh trước đã đóng không lỗ), có Stop-loss riêng; nhãn 🛡 Bảo vệ lãi nghĩa là Stop-loss đã được dời lên cao hơn (hòa vốn) sau khi giá từng chạm TP2 (xem mục &quot;Giải thích ký hiệu&quot; bên dưới). Giá mua, cắt lỗ và chốt lời được hiển thị dạng vùng: vùng mua (từ mốc chuyển mua đến cao hơn giá mua tối đa khoảng 2%, cao hơn nữa là đuổi giá), vùng cắt lỗ (từ Stop-loss lên tới đường hỗ trợ gần nhất phía trên) và vùng chốt lời (TP1 đến TP3). Bảng có bộ lọc (sàn, ngành, xu hướng, đang lãi/lỗ, mã ưu tiên...) và hiện đầy đủ các chỉ
          số: điểm, Rank, Confidence, vốn hoá, GTGD, Stop-loss, TP1–3... (dùng nút &quot;Cột hiển thị&quot; để bật/tắt). Nếu dữ liệu được cập nhật giữa phiên, giá mua là giá lúc mã lần đầu hiện MUA (dấu chấm xanh cạnh giá) và không đổi ở các lần cập nhật sau; lãi/lỗ, Stop-loss và TP đều giữ theo lúc đó. Cột &quot;Mốc chuyển mua&quot; là mức
          giá chính vừa bị vượt lúc điểm chuyển sang vùng mua, để so với giá mua thực tế xem mình đang mua cao hơn bao nhiêu. Các thẻ thống kê phía trên cho
          biết tỷ lệ lãi, tỷ lệ lỗ, lãi/lỗ trung bình và tỷ lệ lệnh đã chạm chốt lời (ví dụ 10 lệnh có 7 lệnh đã chạm TP thì là 70%).
        </p>
      </Muc>

      <Muc tieuDe="Danh mục cá nhân">
        <p>
          Bấm nút tham gia (biểu tượng người cạnh mã ở Bộ lọc hoặc Sổ lệnh) để thêm mã vào danh mục. Danh mục tự hiện lệnh hiện tại của từng mã bạn tham gia (giá mua, vùng mua, cắt
          lỗ, chốt lời, lãi/lỗ) và tự chuyển sang &quot;Lệnh đã đóng của tôi&quot; khi lệnh bán/thoát hoặc chốt đủ TP3 — chỉ tính từ ngày bạn tham gia mã đó. Số liệu theo lệnh của hệ
          thống, không phải giá khớp thật trong tài khoản chứng khoán của bạn.
        </p>
      </Muc>

      <Muc tieuDe="Lệnh đã đóng">
        <p>
          Kết quả các lệnh đã kết thúc (mã đang NẮM GIỮ chuyển sang BÁN hoặc thoát vị thế, hoặc chốt đủ TP3 theo tỷ lệ 30/30/25/15 với 15% cuối giữ chạy), tính từ khi web bắt đầu ghi nhận: giá mua, giá bán, lãi/lỗ, số phiên đã
          giữ, tỷ lệ thắng, lãi trung bình lệnh thắng và lỗ trung bình lệnh thua. Ngày bán và giá bán lấy theo lần cập nhật dữ liệu lúc lệnh đổi trạng thái nên
          chỉ xấp xỉ giá đóng cửa phiên đó, không phải giá khớp thật; lệnh đã đóng trước khi web bắt đầu ghi nhận sẽ không có trong danh sách.
        </p>
      </Muc>

      <Muc tieuDe="Checklist bắt đáy">
        <p>
          Lịch sử các lần checklist bắt đáy kích hoạt, kèm giá lúc đó, giá hiện tại và kết quả sau 5 / 10 / 20 phiên. &quot;Đang theo dõi&quot; nghĩa là
          tín hiệu còn quá mới, chưa đủ 20 phiên để đánh giá.
        </p>
      </Muc>

      <Muc tieuDe="Trang chi tiết từng mã">
        <p>
          Bấm vào một mã để xem điểm hợp lưu, kết luận, vùng giá quan trọng (hỗ trợ / kháng cự / stop-loss), ba mốc chốt lời (kèm nhãn &quot;✓ Đã
          chạm&quot;), định giá tham khảo của các công ty chứng khoán và câu chuyện kỳ vọng.
        </p>
      </Muc>

      <Muc tieuDe="Đăng ký, Tham gia và một vài lưu ý">
        <DanhSach
          muc={[
            "Đăng ký bằng số điện thoại + mật khẩu (miễn phí) để mở khoá Checklist bắt đáy, Sổ lệnh đang mở, Lệnh đã đóng, cột Tín hiệu ở Bộ lọc và phần nguyên tắc giao dịch bên dưới.",
            "Biểu tượng người kèm số cạnh mã là nút Tham gia: bấm để theo dõi mã đó (cần đăng nhập), con số là tổng người đang quan tâm.",
            "Giá hiển thị theo đơn vị nghìn đồng (134.5 nghĩa là 134.500đ).",
            "Tín hiệu tính theo nến ngày và được cập nhật mỗi lần hệ thống quét thị trường; thời điểm cập nhật hiển thị ở đầu trang chi tiết mã.",
          ]}
        />
      </Muc>

      <TieuDeLon chu="Nguyên tắc giao dịch" phu="Kỷ luật quản trị vốn và rủi ro khi giao dịch theo tín hiệu." />

      {nguoiDung ? (
        <NguyenTac />
      ) : (
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(108,92,231,0.16)" }}>
            <Lock size={22} color={PRIMARY} strokeWidth={2} />
          </div>
          <p className="text-base mb-2" style={{ color: TEXT, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
            Nguyên tắc giao dịch dành cho thành viên
          </p>
          <p className="text-sm mb-6" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
            Đăng ký hoặc đăng nhập miễn phí để xem đầy đủ 11 nguyên tắc: giải ngân 1 phần, bổ sung, giới hạn tỷ trọng, cắt lỗ, chốt lời, mua lại, bảo vệ
            lãi, tiêu chí chọn cổ phiếu, thời điểm đặt lệnh và giải thích ký hiệu.
          </p>
          <div className="flex justify-center">
            <TaiKhoanNut nhan="Đăng ký / Đăng nhập để xem" />
          </div>
        </div>
      )}

      <p className="text-[11px] mt-8" style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}>
        Đây là công cụ hỗ trợ đọc biểu đồ, không phải khuyến nghị đầu tư. Hiệu suất quá khứ không đảm bảo kết quả tương lai; quyết định giao dịch và
        rủi ro thuộc về nhà đầu tư.
      </p>
    </div>
  );
}
