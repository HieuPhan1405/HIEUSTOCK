// NOI DUNG CHI DAN CUA "MAY" (nhan vat huong dan - components/MayHuongDan.js). Ham THUAN, import tuong doi de test tay: engine/test/noiDungMay.test.mjs.
// Moi loi giai thich dat o DAY (1 cho duy nhat) - doi quy tac thi sua o day cho khop trang Huong dan (app/huong-dan/page.js).
//  - GIOI_THIEU_TRANG: loi gioi thieu + meo cho tung trang (khop theo duong dan, tien to dai nhat thang).
//  - GIAI_THICH: giai thich cho tung cho duoc danh dau data-may="<khoa>" tren giao dien.

export const GIOI_THIEU_TRANG = [
  {
    duongDan: "/",
    chinhXac: true,
    ten: "Tổng quan thị trường",
    gioiThieu:
      "Đây là trang đầu. Phần quan trọng nhất là “Top cơ hội đáng chú ý”: 4 ô lệnh của phiên gần nhất — Mua, Bán, Mua mới, Bán bớt. Chỉ có việc của phiên đó; lệnh đang giữ từ trước xem ở Sổ lệnh đang mở.",
    meo: [
      "Ô Mua ghi rõ giá đang trong vùng mua hay đã vượt vùng — đã vượt thì chờ hồi, đừng đuổi giá.",
      "Ô Bán ghi kết quả CẢ LỆNH (gộp các lần đã chốt TP1/TP2 trước đó).",
      "Dữ liệu cập nhật sau mỗi lần hệ thống quét, không phải thời gian thực.",
    ],
  },
  {
    duongDan: "/dashboard",
    ten: "Dashboard thị trường",
    gioiThieu: "Bức tranh chung của thị trường: bản đồ nhiệt theo ngành, thanh khoản, mã ảnh hưởng tới VN-Index, định giá PE/PB. Trang này để hiểu thị trường, không phải danh sách lệnh.",
    meo: ["Thị trường nghiêng xấu (nhiều ngành đỏ, thanh khoản thấp) thì nên chọn lọc tín hiệu Mua kỹ hơn.", "Di chuột (hoặc chạm) vào đồng hồ tâm lý, bản đồ nhiệt, bảng RS ngành, dòng tiền để Mây giải thích.", "Nút Chụp ảnh dashboard tạo thẻ tổng quan thị trường để gửi Zalo."],
  },
  {
    duongDan: "/bo-loc",
    ten: "Bộ lọc cổ phiếu",
    gioiThieu: "Toàn bộ các mã hệ thống đang quét. Lọc theo tín hiệu, sàn, ngành, xu hướng, thanh khoản, vốn hoá và sắp xếp theo bất kỳ cột nào.",
    meo: [
      "Bấm vào tên cột để sắp xếp; nút “Cột hiển thị” để bật/tắt cột.",
      "Nút hình người cạnh mã = tham gia theo dõi, mã sẽ vào Danh mục theo dõi của bạn.",
      "Có thể lọc thêm theo thanh khoản (GTGD TB20) và sức mạnh so với VN-Index (RS) để chọn lọc tín hiệu.",
    ],
  },
  {
    duongDan: "/bieu-do",
    ten: "Biểu đồ kỹ thuật",
    gioiThieu: "Biểu đồ nến kèm Ichimoku, đường cân bằng dài hạn, MA và khối lượng — cùng cách tính với hệ thống tín hiệu. Mã đang có lệnh thì có thể bật vùng lệnh (vùng mua, cắt lỗ, chốt lời).",
    meo: ["Nút Toàn màn hình phóng biểu đồ kiểu TradingView (Esc để thoát).", "Gõ mã vào ô tìm kiếm ở đầu trang để mở biểu đồ mã khác, kể cả VN-Index."],
  },
  {
    duongDan: "/lenh-mo",
    ten: "Sổ lệnh đang mở",
    gioiThieu:
      "Mỗi dòng là MỘT LỆNH đang mở, có giá mua, cắt lỗ, chốt lời và lãi/lỗ riêng. Mã có nhiều lệnh được đánh số (1), (2)… theo ngày mua; nhãn “Mua mới” là lệnh vào đợt sau.",
    meo: [
      "Cách chốt: 30% ở TP1, 30% ở TP2, 40% còn lại giữ đến khi hệ thống báo BÁN. Sau TP2, cắt lỗ phần còn lại dời về giá mua.",
      "Dòng nền đỏ = cảnh báo Mắt Thần, dòng nền cam = cảnh báo bán bớt.",
      "Bấm vào mã để xem chi tiết từng lệnh.",
    ],
  },
  {
    duongDan: "/danh-muc",
    ten: "Danh mục theo dõi",
    gioiThieu: "Các mã bạn đã bấm tham gia. Mỗi mã một dòng; mã đang có vị thế có mũi tên ở đầu dòng — bấm để xổ ra từng vị thế (lệnh) của mã đó.",
    meo: [
      "Bộ lọc “Vị thế tốt nhất” / “Vị thế sau” cho mỗi mã chỉ hiện 1 vị thế, các thẻ thống kê tính theo bộ lọc đó.",
      "Mỗi vị thế ghi rõ mở trước hay sau khi bạn bắt đầu theo dõi mã.",
    ],
  },
  {
    duongDan: "/lenh-da-dong",
    ten: "Lệnh đã đóng",
    gioiThieu:
      "Kết quả các lệnh đã kết thúc, tính THEO TỪNG LỆNH: các lần chốt TP1, TP2 và phần còn lại của cùng một lệnh được gộp lại. Lãi/lỗ chưa trừ phí và thuế (khoảng 0,4%/lệnh).",
    meo: [
      "Tỷ lệ thắng tính cả lệnh đang giữ đã chạm TP2 (đã khoá lãi, không thể lỗ); lệnh mới chạm TP1 chưa tính.",
      "Cuối trang là “Giá thực tế lúc tín hiệu hiện”: giá lúc tín hiệu hiện lần đầu so với mốc, và các tín hiệu vượt giả.",
    ],
  },
  {
    duongDan: "/bat-day",
    ten: "Checklist bắt đáy",
    gioiThieu: "Danh sách kiểm tra các điều kiện bắt đáy cho từng cổ phiếu — dùng để theo dõi khi thị trường giảm sâu, không phải tín hiệu Mua của hệ thống.",
    meo: ["Checklist chỉ để tham khảo, hãy kết hợp với tín hiệu và cắt lỗ."],
  },
  {
    duongDan: "/thi-truong",
    ten: "Thông tin thị trường",
    gioiThieu: "Tin tức vĩ mô, quốc tế và doanh nghiệp để bạn nắm bối cảnh. Tín hiệu và lệnh nằm ở trang đầu và Sổ lệnh.",
    meo: [],
  },
  {
    duongDan: "/huong-dan",
    ten: "Hướng dẫn & nguyên tắc",
    gioiThieu: "Giải thích đầy đủ cách hệ thống chấm điểm, vào lệnh, chốt lời, cắt lỗ và ý nghĩa các ký hiệu. Mây chỉ tóm tắt — chi tiết nằm ở đây.",
    meo: [],
  },
  {
    duongDan: "/mua-phuc-hoi",
    ten: "Điểm mua phục hồi",
    gioiThieu: "Lịch sử các điểm mua phục hồi (điểm B) từ đầu 2026: cổ phiếu đã giảm 20–30% rồi lấy lại Tenkan và Kijun. Có bộ lọc nhanh và bảng kết quả từng lần B.",
    meo: ["Ưu tiên B có KL đáy từ 2 lần trở lên và thị trường đang yếu.", "Chia khoảng 1/2 vốn dự định ở B, 1/2 còn lại khi hệ thống báo MUA, và luôn đặt cắt lỗ.", "Di chuột vào tiêu đề từng cột để Mây giải thích."],
  },
  {
    duongDan: "/ma/",
    ten: "Chi tiết mã",
    gioiThieu:
      "Mọi thứ về một mã: điểm hợp lưu và lý do, biểu đồ, vùng giá, cắt lỗ, chốt lời và nhật ký giao dịch. Mã có nhiều lệnh thì có thanh ngang để chọn lệnh — chọn lệnh nào thì các con số hiện theo lệnh đó.",
    meo: [
      "Nhật ký giao dịch: chọn ngày mua để xem riêng từng lệnh, lãi/lỗ quy ra 100 đơn vị vốn.",
      "“Đã chạm” ở chốt lời nghĩa là giá đã TỪNG lên tới mốc đó, kể cả khi sau đó giảm lại.",
    ],
  },
  {
    duongDan: "/lien-he",
    ten: "Liên hệ",
    gioiThieu: "Gửi câu hỏi hoặc góp ý cho CloudStock.",
    meo: [],
  },
];

const MAC_DINH = {
  ten: "CloudStock",
  gioiThieu: "Mình là Mây. Bấm vào các chữ có viền chấm tím để mình giải thích nhé.",
  meo: [],
};

// Duong dan hien tai -> muc gioi thieu (khop chinh xac cho "/", con lai tien to dai nhat).
export function layGioiThieu(duongDan) {
  const p = duongDan || "/";
  let tot = null;
  for (const m of GIOI_THIEU_TRANG) {
    const d = m.duongDan;
    const khop = m.chinhXac ? p === d : d.endsWith("/") ? p.startsWith(d) : p === d || p.startsWith(`${d}/`);
    if (khop && (!tot || m.duongDan.length > tot.duongDan.length)) tot = m;
  }
  return tot ?? MAC_DINH;
}

export const GIAI_THICH = {
  // --- Trang thai tin hieu (nhan mau)
  "tin-MUA": { ten: "MUA", noiDung: "Mã vừa có tín hiệu MUA trong phiên: điểm hợp lưu vượt ngưỡng mua cùng các điều kiện khối lượng, xu hướng, thanh khoản. Chỉ nên mua trong vùng mua." },
  "tin-NAM GIU": { ten: "NẮM GIỮ", noiDung: "Đang giữ lệnh đã mua từ các phiên trước, chưa có tín hiệu bán. Theo dõi cắt lỗ và các mốc chốt lời." },
  "tin-BAN": { ten: "BÁN", noiDung: "Lệnh đóng trong phiên: bán theo tín hiệu (điểm tụt), chạm cắt lỗ, hoặc về hoà vốn sau TP2." },
  "tin-THEO DOI MUA": {
    ten: "THEO DÕI (xanh)",
    noiDung: "Có tín hiệu MUA nhưng đang ngoài khung giờ vào lệnh (10:30–11:30, 14:00–14:45). Chỉ theo dõi, vào khung giờ mà tín hiệu vẫn còn và giá trong vùng mua thì mới mua.",
  },
  "tin-THEO DOI BAN": {
    ten: "THEO DÕI (đỏ)",
    noiDung:
      "Tín hiệu bán hoặc cắt lỗ xuất hiện ngoài khung giờ vào lệnh nên chưa chốt. Đến giờ mở khung kế tiếp mà tín hiệu vẫn còn thì chốt bán ở giá lúc đó; nếu tín hiệu quay lại nắm giữ thì lệnh được giữ tiếp.",
  },
  "tin-TRUNG LAP": { ten: "TRUNG LẬP", noiDung: "Không có lệnh: chưa đủ điều kiện mua hoặc lệnh trước đã kết thúc." },

  // --- 4 o lenh trang dau
  mua: { ten: "Mua", noiDung: "Tín hiệu MUA mới trong phiên. Giá mua của hệ thống là mốc chuyển mua (mức giá vừa vượt mây / đường cân bằng dài hạn). Mua trong vùng mua; đã vượt vùng thì chờ hồi." },
  ban: { ten: "Bán", noiDung: "Các lệnh đóng trong phiên: bán theo tín hiệu, cắt lỗ, hoà vốn sau TP2, thoát lệnh. Con số bên phải là kết quả của cả lệnh." },
  "mua-moi": {
    ten: "Mua mới",
    noiDung:
      "Lệnh vào đợt sau cho người đã lỡ lệnh đầu: giá hồi về hỗ trợ (Kijun) rồi bật lên. Là một lệnh riêng — giá mua, cắt lỗ, chốt lời riêng — và chốt giống lệnh Mua. Không phải mua thêm.",
  },
  "ban-bot": {
    ten: "Bán bớt",
    noiDung: "Chạm TP1 → chốt 30%. Chạm TP2 → chốt thêm 30% và dời cắt lỗ phần còn lại về giá mua. 40% còn lại giữ đến tín hiệu BÁN. Cảnh báo giảm bớt: điểm tụt dưới ngưỡng nhưng chưa đủ điều kiện bán hẳn.",
  },
  "canh-bao-giam-bot": { ten: "Cảnh báo giảm bớt", noiDung: "Điểm hôm nay đã tụt dưới ngưỡng bán nhưng chưa đủ điều kiện BÁN hẳn — gợi ý giảm bớt vị thế sớm để bớt rủi ro." },
  "ket-qua-ca-lenh": { ten: "Kết quả cả lệnh", noiDung: "Gộp mọi lần chốt của lệnh theo tỷ trọng (ví dụ 30% chốt +10%, 70% bán +5% → cả lệnh +6,5%). Chưa trừ phí." },

  // --- Vung lenh
  "vung-mua": {
    ten: "Vùng mua",
    noiDung: "Từ mốc chuyển mua đến cao hơn tối đa 1%. Backtest 11 năm: mua cao hơn mốc quá 1% thì trung bình lỗ — giá đã vượt vùng thì chờ hồi về, không đuổi giá.",
  },
  "cat-lo": {
    ten: "Cắt lỗ",
    noiDung: "Đáy vùng là mức cắt dứt khoát; đỉnh vùng là hỗ trợ gần nhất phía trên — giá vào vùng này cần theo dõi sát. Sau khi chạm TP2, cắt lỗ phần còn lại dời về giá mua (hoà vốn).",
  },
  tp: { ten: "Chốt lời TP1 / TP2", noiDung: "2 mốc chốt lời, mỗi mốc chốt 30%. TP3 chỉ là mốc tham khảo. 40% còn lại giữ đến khi hệ thống báo BÁN." },
  "gia-mua": { ten: "Giá mua", noiDung: "Giá vào lệnh của hệ thống — với lệnh Mua là mốc chuyển mua. Lãi/lỗ tính từ giá này." },
  "lai-lo": { ten: "Lãi/lỗ", noiDung: "Tính theo giá mua của lệnh so với giá hiện tại, chưa trừ phí và thuế (khoảng 0,4% cho cả mua lẫn bán)." },
  "so-phien": { ten: "Số phiên", noiDung: "Số phiên giao dịch đã giữ lệnh, tính từ ngày mua (ngày mua = 0)." },
  "chot-loi": { ten: "Chốt lời", noiDung: "Mốc TP cao nhất giá đã từng chạm trong lúc giữ lệnh (TP1 = đã chốt 30%, TP2 = đã chốt 60%)." },
  diem: {
    ten: "Điểm hợp lưu",
    noiDung: "Tổng hợp 3 nhóm: Xu hướng, Động lượng và Dòng tiền. Vượt ngưỡng mua cùng các điều kiện khác thì có tín hiệu MUA; tụt sâu dưới ngưỡng bán thì BÁN.",
  },
  "trang-thai": { ten: "Trạng thái", noiDung: "MUA = vừa có tín hiệu trong phiên · NẮM GIỮ = đang giữ · BÁN = lệnh đóng trong phiên · TRUNG LẬP = không có lệnh." },
  "thanh-khoan": { ten: "Thanh khoản (GTGD TB20)", noiDung: "Giá trị giao dịch trung bình 20 phiên (tỷ đồng/phiên). Thanh khoản quá thấp thì khó mua bán đúng giá." },
  rs: { ten: "RS so với VN-Index", noiDung: "Mã mạnh hơn hay yếu hơn VN-Index trong 20 phiên (%). Dương là mạnh hơn thị trường." },
  "mat-than": { ten: "Mắt Thần", noiDung: "Cảnh báo rủi ro đảo chiều: giá tạo đỉnh trên mây rồi hồi vào mây mà không bật lại qua Tenkan. Chỉ là cảnh báo, không tự bán." },

  // --- Lenh / vi the
  "danh-so": { ten: "Đánh số (1), (2)", noiDung: "Mã có nhiều lệnh đang mở được đánh số theo ngày mua. Mỗi lệnh có giá mua, cắt lỗ, chốt lời và lãi/lỗ riêng." },
  "lenh-dau": { ten: "Lệnh đầu", noiDung: "Lệnh Mua đầu tiên của đợt tăng. Nếu bạn lỡ lệnh này, có thể đợi lệnh Mua mới ở đợt sau." },
  "chon-lenh": { ten: "Thanh chọn lệnh", noiDung: "Mã có từ 2 lệnh: chọn lệnh nào thì giá mua, cắt lỗ, chốt lời, lãi/lỗ và biểu đồ hiện theo đúng lệnh đó." },
  "xo-vi-the": { ten: "Xổ vị thế", noiDung: "Bấm mũi tên để xem từng vị thế (lệnh) của mã: lệnh đầu hay Mua mới, ngày mua, giá mua, cắt lỗ, chốt lời, số phiên." },
  "loc-vi-the": {
    ten: "Lọc vị thế",
    noiDung: "Tất cả vị thế · Vị thế tốt nhất (đang lãi nhiều nhất) · Vị thế sau (mở gần nhất). Hai lựa chọn sau cho mỗi mã chỉ hiện 1 vị thế, các thẻ thống kê đổi theo.",
  },
  "vi-the-tot": { ten: "Tốt nhất", noiDung: "Vị thế đang lãi nhiều nhất (lỗ ít nhất) trong các vị thế của mã." },
  "vi-the-sau": { ten: "Vị thế sau", noiDung: "Vị thế mở gần nhất (ngày mua muộn nhất) của mã." },
  "lenh-web": {
    ten: "Web giữ lệnh",
    noiDung:
      "Lệnh đã mua trong khung giờ nhưng tín hiệu mất trong phiên (hệ thống không xác nhận khi giá tụt lại). Bạn đã cầm cổ phiếu nên web tự giữ lệnh: chốt 30% ở TP1, 30% ở TP2, cắt lỗ khi chạm mức cắt lỗ (sau TP2 là giá mua), bán khi điểm ≤ −1,5 đủ 3 phiên.",
  },
  "thong-bao": {
    ten: "Chuông thông báo",
    noiDung:
      "Tín hiệu Mua, Bán, Mua mới, Bán bớt của các phiên gần đây, số đỏ là số chưa xem. Đăng nhập rồi bấm “Bật thông báo” để nhận ngay trên điện thoại / máy tính, kể cả khi đã đóng web. Có thể chọn chỉ nhận mã bạn theo dõi.",
  },
  "tham-gia": { ten: "Tham gia theo dõi", noiDung: "Bấm để thêm mã vào Danh mục theo dõi của bạn (bấm lại để bỏ). Số bên cạnh là số người đang theo dõi mã." },
  "nhat-ky": { ten: "Nhật ký giao dịch", noiDung: "Chọn ngày mua để xem riêng từng lệnh: mua, chạm/chốt TP, đóng, số phiên giữ. Mỗi lệnh giả định 100 đơn vị vốn để dễ so sánh." },

  // --- Lenh da dong
  "lenh-da-dong": { ten: "Lệnh đã đóng", noiDung: "Số lệnh đã kết thúc hẳn. Các lần chốt TP1/TP2 của cùng một lệnh được gộp, chỉ tính 1 lần khi lệnh đóng." },
  "ty-le-thang": {
    ten: "Tỷ lệ thắng",
    noiDung: "Lệnh đã đóng có lãi + lệnh đang giữ đã chạm TP2 (đã chốt 60%, phần còn lại cắt lỗ ở giá mua nên không thể lỗ). Lệnh mới chạm TP1 chưa tính vì vẫn có thể thành lỗ.",
  },
  "lai-tb": { ten: "Lãi/lỗ trung bình", noiDung: "Trung bình kết quả cả lệnh của các lệnh đã đóng, chưa trừ phí; dòng nhỏ bên dưới là ước tính sau phí + thuế." },
  "chua-co-diem-mua": { ten: "Đủ điểm nhưng chưa có điểm mua", noiDung: "Điểm hợp lưu đã đạt ngưỡng mua (1,25) nhưng hệ thống chưa báo MUA. Khung này nêu lý do cụ thể của mã: chờ phiên sau để xác nhận khối lượng, giá dưới 10 nghìn, thanh khoản thấp, ADX dưới 18, lệnh trước đã chạm TP3, hoặc đợt điểm này đã báo MUA rồi (mỗi đợt chỉ báo một lần). Không phải khuyến nghị mua." },
  "xuat-anh": { ten: "Xuất / chụp ảnh để gửi", noiDung: "Tạo ảnh đẹp đã gồm đủ thông tin để gửi Zalo hay Messenger: ở trang mã là giá, tín hiệu, lệnh đang mở, lãi/lỗ, điểm mua – bán gần đây; ở Dashboard là thẻ tổng quan thị trường. Có thể chọn PNG sắc nét hoặc JPG nhẹ, rồi Tải, Sao chép hoặc Chia sẻ. Ảnh có ghi giờ chụp và lưu ý không phải khuyến nghị." },
  "tam-ly": { ten: "Tâm lý thị trường (0–100)", noiDung: "Trung bình 4 tỷ lệ: mã tăng giá, mã trên Kijun, mã trên đường cân bằng dài hạn, mã đạt điểm MUA. Kim càng sang phải thì thị trường càng hưng phấn; dưới 40 là lo ngại, trên 60 là lạc quan. Màu cung đồng hồ đổi theo mức tâm lý. Tự tính từ các mã hệ thống theo dõi, không phải chỉ báo chuẩn." },
  "muc-giu-lenh": { ten: "Mức giữ lệnh của hệ thống", noiDung: "Số mã đang MUA hoặc NẮM GIỮ trên tổng số mã hệ thống theo dõi. Thấp nghĩa là hệ thống đang đứng ngoài nhiều, cao nghĩa là đang giữ nhiều. Chỉ là thống kê, không phải khuyến nghị tỷ trọng." },
  "xu-huong-tt": { ten: "Xu hướng thị trường", noiDung: "Xu hướng của chính VN-Index theo điểm Trend (Ichimoku + đường cân bằng dài hạn): Tăng, Giảm hoặc Đi ngang." },
  "ban-do-nhiet": { ten: "Bản đồ nhiệt theo ngành", noiDung: "Mỗi ô là một mã, nhóm theo ngành. Diện tích ô theo thanh khoản trung bình 20 phiên (ô to = tiền chảy nhiều), màu theo % thay đổi giá hôm nay: xanh tăng, đỏ giảm, càng đậm càng mạnh." },
  "rs-nganh": { ten: "Xếp hạng sức mạnh ngành (RS)", noiDung: "So lợi suất 20 và 60 phiên của ngành với VN-Index (điểm %). Dương là ngành mạnh hơn thị trường. Bấm tiêu đề cột để sắp xếp, bấm tên ngành để xem xếp hạng các mã bên trong." },
  "dong-tien-tt": { ten: "Dòng tiền thời gian thực", noiDung: "Giá trị lệnh khớp do bên mua chủ động (đặt giá chào bán, kéo giá lên) trừ bên bán chủ động, tính từ dữ liệu tick trong phiên. Dương là tiền đang vào. Chỉ tính khớp liên tục, không tính ATO/ATC. Cần đăng nhập tài khoản đã được duyệt." },
  "toan-man-hinh": { ten: "Biểu đồ toàn màn hình", noiDung: "Phóng biểu đồ ra kín màn hình kiểu TradingView, có cột thông tin bên phải và thanh công cụ vẽ một hàng. Bấm Esc hoặc nút Thu nhỏ để thoát." },
  // --- Diem mua phuc hoi (diem B)
  "mua-phuc-hoi": {
    ten: "Mua phục hồi (điểm B)",
    noiDung:
      "Cổ phiếu đã giảm sâu 20–30% (so với đỉnh 20 nến) rồi đóng cửa lấy lại cả Tenkan và Kijun, đáy đã qua ít nhất 3 nến, thanh khoản trung bình 20 phiên từ 3 tỷ. Đây là điểm giải ngân đợt đầu theo nghiên cứu của hệ thống. Nên chia khoảng 1/2 vốn dự định, phần còn lại khi hệ thống báo MUA. Cắt lỗ = giá vào trừ 2,5 lần ATR (kẹp 3–10%). Chỉ là điểm vào tham khảo, không tính vào tín hiệu MUA/BÁN. Lịch sử cho thấy giá vẫn có thể sụt từ 5% trở lên trong 10 phiên (khoảng một nửa số lần), nên luôn đặt cắt lỗ.",
  },
  "co-diem-b-truoc": {
    ten: "Huy hiệu B vàng",
    noiDung: "Mã này đang có tín hiệu MUA cơ sở và trước đó (trong khoảng 45 ngày) đã có điểm mua phục hồi (điểm B). Rê vào huy hiệu để xem ngày B, giá B và mức đã giảm. Nghĩa là nhịp mua hiện tại nằm sau một nhịp hồi từ đáy; lệnh B cũ có thể đã cắt lỗ hoặc đang lãi.",
  },
  "diemb-ngay": { ten: "Ngày B", noiDung: "Ngày xuất hiện điểm mua phục hồi (nến đóng cửa lấy lại Tenkan và Kijun)." },
  "diemb-gia_vao": { ten: "Giá vào (điểm B)", noiDung: "Giá đóng cửa của nến B, dùng làm giá vào tham khảo để tính cắt lỗ, chốt lời và lãi hiện tại." },
  "diemb-giam": { ten: "Mức giảm trước B", noiDung: "Phần trăm giá đã giảm từ đỉnh 20 nến xuống nến B. Nhóm giảm 20–30% cho kết quả tốt nhất trong nghiên cứu; giảm nhẹ hơn thường không hơn mua bừa." },
  "diemb-kl_day": { ten: "KL đáy", noiDung: "Khối lượng quanh đáy so với bình thường (lần). Từ 2 lần trở lên là bán tháo có khối lượng: dấu hiệu lực bán đã cạn, nên được ưu tiên." },
  "diemb-sl": { ten: "Cắt lỗ (điểm B)", noiDung: "Giá vào trừ 2,5 lần ATR14, kẹp trong khoảng 3–10% dưới giá vào. Chạm mức này là thoát lệnh, không chờ." },
  "diemb-tp": { ten: "TP1 / TP2 (điểm B)", noiDung: "Hai mốc chốt lời theo công thức bình thường của hệ thống (cách giá vào ít nhất 5% và 10%). Mỗi mốc chốt khoảng 30%." },
  "diemb-gia_hien_tai": { ten: "Lãi hiện tại", noiDung: "Lãi/lỗ của giá hiện tại so với giá vào của điểm B, chưa trừ phí và thuế." },
  "diemb-pct_sau_5": { ten: "+5 phiên", noiDung: "Giá thay đổi bao nhiêu % sau 5 phiên kể từ điểm B (để biết các lần B trước diễn ra thế nào). Trống nếu chưa đủ 5 phiên." },
  "diemb-vni": { ten: "Thị trường lúc B", noiDung: "Đánh dấu lúc xuất hiện B thị trường chung đang yếu. Lịch sử cho thấy B kèm thị trường yếu và bán tháo có khối lượng thường tốt hơn." },
  "diemb-ket_qua": { ten: "Kết quả", noiDung: "Đang lãi / Đang lỗ theo giá hiện tại, hoặc Đã cắt lỗ nếu giá đã chạm mức cắt lỗ của điểm B." },
  "canh-bao-vao-lenh": { ten: "Cảnh báo khi vào lệnh", noiDung: "Hai loại: Vào sát cắt lỗ (mức cắt lỗ rất gần giá vào nên dễ bị quét sớm) và Biến động mạnh (biên độ dao động lớn so với giá). Theo thống kê lịch sử các lệnh như vậy dễ bị cắt lỗ sớm; chỉ để tham khảo, cân nhắc giảm tỷ trọng." },

  // --- Bieu do: cac chi bao / cong cu
  "chip-ichimoku": { ten: "Ichimoku", noiDung: "Tenkan (9) và Kijun (17) là hai đường nhanh/chậm, đám mây Kumo là vùng hỗ trợ – kháng cự. Giá trên mây và Tenkan cắt lên Kijun là xu hướng tốt. Hệ thống tính cùng cách này." },
  "chip-canBang": { ten: "Đường cân bằng dài hạn", noiDung: "Hai đường cân bằng dài hạn (65/129) làm nền xu hướng lớn. Giá trên đường trên là thế mạnh; dưới đường dưới là thế yếu." },
  "chip-ma": { ten: "MA 20/50/200", noiDung: "Trung bình động giản đơn 20, 50 và 200 phiên: ngắn, trung và dài hạn." },
  "chip-ema": { ten: "EMA 9/21", noiDung: "Trung bình động luỹ thừa 9 và 21 phiên, phản ứng nhanh hơn MA. EMA9 cắt lên EMA21 thường báo đà tăng ngắn hạn." },
  "chip-boll": { ten: "Bollinger", noiDung: "Dải 20 phiên ± 2 độ lệch chuẩn. Giá chạm dải dưới thường là bán quá đà ngắn hạn, chạm dải trên là mua quá đà." },
  "chip-vp": { ten: "Volume Profile", noiDung: "Phân bố khối lượng theo mức giá. Đây là ước lượng: khối lượng mỗi nến chia đều trong khoảng giá của nến đó, không phải khớp từng mức giá. Vùng nhiều khối lượng (POC) hay đóng vai trò hỗ trợ / kháng cự. Nghiên cứu cho thấy ở cấp cổ phiếu chưa có lợi thế riêng, chỉ để tham khảo bối cảnh." },
  "chip-htkc": { ten: "Hỗ trợ / Kháng cự (KL)", noiDung: "Các vùng giá có khối lượng giao dịch lớn gần giá hiện tại, vẽ thành vùng hỗ trợ (dưới giá) và kháng cự (trên giá). Chỉ để tham khảo." },
  "chip-rsi": { ten: "RSI 14", noiDung: "Chỉ báo sức mạnh giá 0–100. Trên 70 là mua nóng, dưới 30 là bán quá đà." },
  "chip-macd": { ten: "MACD", noiDung: "Chênh lệch hai đường trung bình và đường tín hiệu. Cột histogram đổi từ âm sang dương là động lượng chuyển tốt." },
  "chip-stoch": { ten: "Stochastic", noiDung: "Vị trí giá đóng cửa trong biên độ gần đây (0–100). Trên 80 là vùng nóng, dưới 20 là vùng quá bán." },
  "chip-phanKy": { ten: "RSI phân kỳ", noiDung: "Giá tạo đáy mới thấp hơn nhưng RSI tạo đáy cao hơn (phân kỳ dương), hoặc ngược lại ở đỉnh. Kiểm tra trên toàn bộ mã cho thấy phân kỳ riêng lẻ không có lợi thế rõ rệt, nên chỉ coi là gợi ý." },
  "chip-vung": { ten: "Vùng lệnh", noiDung: "Vẽ lên biểu đồ vùng mua, vùng cắt lỗ và các mốc TP1/TP2/TP3 của lệnh đang mở của mã này." },
  "mau-hinh": { ten: "Mẫu hình giá", noiDung: "Hệ thống tự nhận diện các mẫu hình giá trên nến ngày và tuần (tam giác, cờ, hai đỉnh – hai đáy...) và vẽ lên biểu đồ. Mẫu hình chỉ cho biết cấu trúc giá, không phải tín hiệu mua bán; kiểm tra lịch sử cho thấy từng mẫu hình riêng lẻ chưa có lợi thế ổn định." },
  "mau-hinh-nen": { ten: "Mẫu hình nến Nhật", noiDung: "Tự đánh dấu các mẫu nến đảo chiều / tiếp diễn (búa, nhấn chìm, sao...) ngay trên nến. Tham khảo thêm cùng vùng giá và khối lượng, không dùng một mình." },
  "cong-cu-ve": { ten: "Công cụ vẽ", noiDung: "Chọn công cụ rồi bấm lên biểu đồ (đường cần hai điểm thì bấm hai lần). Bấm vào hình để chọn, kéo điểm đầu mút để sửa, Delete để xoá, Ctrl+Z để hoàn tác, Esc để huỷ. Có Fibonacci, thước đo, kênh song song và Volume Profile cho vùng bạn chọn." },

  // --- Trang xem ma
  "ket-luan": { ten: "Kết luận của mã", noiDung: "Tóm tắt tự động bằng lời từ điểm hợp lưu, xu hướng, dòng tiền và vùng giá hiện tại. Đây là cách đọc nhanh, không phải khuyến nghị." },
  "vi-sao-diem": { ten: "Vì sao có điểm này", noiDung: "Điểm hợp lưu là tổng các thành phần: Xu hướng (Trend), Động lượng (Momentum), Dòng tiền, cộng RS so với VN-Index và Breadth ngành. Thanh đỏ là bị trừ, thanh xanh là được cộng; thanh càng dài càng gần mức tối đa của thành phần đó." },
  "bd-trend": { ten: "Xu hướng (Trend)", noiDung: "Thành phần xu hướng của điểm hợp lưu (tính từ Ichimoku và đường cân bằng dài hạn). Dương là xu hướng tăng, âm là xu hướng giảm; thanh càng dài càng rõ." },
  "bd-mom": { ten: "Động lượng (Momentum)", noiDung: "Thành phần động lượng của điểm hợp lưu: đà tăng/giảm gần đây của giá. Dương là đà đang tốt lên." },
  "bd-dt": { ten: "Dòng tiền", noiDung: "Thành phần dòng tiền của điểm hợp lưu: tiền đang vào hay rút ra khỏi mã theo khối lượng và giá. Dương là dòng tiền vào." },
  "bd-adx": { ten: "ADX (sức mạnh xu hướng)", noiDung: "Đo xu hướng mạnh hay yếu (không cho biết lên hay xuống). Từ 20 là xu hướng trung bình, từ 40 là mạnh." },
  "bd-breadth": { ten: "Breadth ngành", noiDung: "Tỷ lệ mã trong cùng ngành đang ở trạng thái tốt. Cao nghĩa là cả ngành đang khoẻ chứ không chỉ riêng mã này." },
  "vung-gia-qt": { ten: "Vùng giá quan trọng", noiDung: "Hỗ trợ và kháng cự gần nhất quanh giá hiện tại, cùng mức cắt lỗ nếu đang giữ. Khoảng cách tới hỗ trợ và kháng cự cho biết còn bao nhiêu dư địa lên và rủi ro xuống." },
  "tag-Vùng": { ten: "Vùng giá", noiDung: "Vị trí giá so với hai đường cân bằng dài hạn: Xanh là giá nằm trên đường cân bằng trên (thế mạnh), Đỏ là giá nằm dưới đường cân bằng dưới (thế yếu), Trung tính là giá ở giữa hai đường." },
  "tag-Xu hướng": { ten: "Xu hướng", noiDung: "Tăng, Giảm hoặc Sideway (đi ngang) theo điểm Trend: trên +0,5 là Tăng, dưới −0,5 là Giảm." },
  "tag-Dòng tiền": { ten: "Dòng tiền", noiDung: "Ủng hộ (tiền vào), Rút ra hoặc Trung tính theo điểm dòng tiền." },
  "tag-Sức mạnh ADX": { ten: "Sức mạnh ADX", noiDung: "Xu hướng mạnh hay yếu theo ADX: từ 40 là Mạnh, từ 20 là Trung bình, dưới 20 là Yếu." },
  "tag-Vốn hoá": { ten: "Nhóm vốn hoá", noiDung: "VN30, Midcap hay Smallcap. Nhóm nhỏ biến động mạnh hơn và thanh khoản thấp hơn." },
  "tag-Mây tương lai": { ten: "Mây tương lai", noiDung: "Đám mây Ichimoku phía trước sắp đổi chiều (twist): báo xu hướng trung hạn có thể đổi." },
  "tag-Time Theory": { ten: "Ngày biến đổi (Time Theory)", noiDung: "Ngày theo lý thuyết thời gian của Ichimoku (9, 17, 26, 33...) mà xu hướng hay đổi pha. Chỉ để chú ý, không phải tín hiệu." },
  "xem-diem-phu": { ten: "Điểm phụ", noiDung: "Chuẩn ưu tiên, độ tin cậy, Rank, Confidence. Backtest 11 năm cho thấy chúng không phân biệt rõ lệnh tốt và xấu nên không dùng ra lệnh, chỉ để tham khảo." },
  "giai-ngan": { ten: "Giải ngân từng phần", noiDung: "Giải ngân 1 phần: sức mạnh so với thị trường còn yếu nên chỉ mua khoảng 1/3–1/2 tỷ trọng; Bổ sung: đủ điều kiện mua nốt phần còn lại; Giữ 1 phần: hết thời hạn chờ, giữ nguyên tỷ trọng nhỏ." },
  "khuyen-nghi-ck": { ten: "Khuyến nghị công ty chứng khoán", noiDung: "Giá mục tiêu và khuyến nghị do các công ty chứng khoán công bố (nguồn công khai), kèm ngày. Là ý kiến bên thứ ba, không phải của CloudStock." },
  "cau-chuyen": { ten: "Câu chuyện kỳ vọng", noiDung: "Tóm tắt từ báo cáo phân tích: động lực tăng giá, điều cần theo dõi và rủi ro. Dùng để hiểu bối cảnh doanh nghiệp, không phải tín hiệu." },
  "gia-thuc-te": { ten: "Giá thực tế lúc tín hiệu hiện", noiDung: "Ghi giá lúc tín hiệu hiện lần đầu trên web so với mốc, và các tín hiệu hiện trong phiên rồi mất trước khi đóng cửa (vượt giả)." },
};

// Cot bang (data-may="cot-<khoa cot>") dung chung loi giai thich.
const BI_DANH = {
  "cot-vung_mua": "vung-mua",
  "cot-vung_sl": "cat-lo",
  "cot-stop_loss": "cat-lo",
  "cot-vung_tp": "tp",
  "cot-tp1": "tp",
  "cot-tp2": "tp",
  "cot-tp3": "tp",
  "cot-gia_mua": "gia-mua",
  "cot-lai_lo_pct": "lai-lo",
  "cot-so_phien_giu": "so-phien",
  "cot-chot_loi": "chot-loi",
  "cot-diem": "diem",
  "cot-tin": "trang-thai",
  "cot-gtgd_tb20": "thanh-khoan",
  "cot-rs_vni": "rs",
  "cot-rs_vni_60": "rs",
};

// Khoa data-may -> { ten, noiDung } hoac null (khoa khong co loi giai thich thi Mây bo qua).
export function layGiaiThich(khoa) {
  if (!khoa) return null;
  return GIAI_THICH[khoa] ?? GIAI_THICH[BI_DANH[khoa]] ?? null;
}

// ---------- LOI CHAO: thinh thoang Mây tho ra chao + hoi "can giup gi khong" (bong bong nho canh Mây, bam vao thi mo khung chi dan) ----------
// Khong lam phien: chi chao sau khi o trang choLanDauMs, tu an sau hienMs, moi lan chao cach nhau it nhat cachNhauMs, nguoi dung tat bong bong tatSauSoLanDong lan
// trong ngay thi im den het ngay (nho trong localStorage cua trinh duyet).
export const CHAO = { choLanDauMs: 8000, hienMs: 7000, cachNhauMs: 10 * 60 * 1000, tatSauSoLanDong: 2 };

// luu: { lan (ms lan chao gan nhat), tatNgay ("yyyy-mm-dd" da tat chao ca ngay) } | null; bayGio: ms; homNay: "yyyy-mm-dd".
export function duocChao(luu, bayGio, homNay) {
  if (luu?.tatNgay === homNay) return false;
  if (Number.isFinite(luu?.lan) && bayGio - luu.lan < CHAO.cachNhauMs) return false;
  return true;
}

const CHAO_THEO_TRANG = [
  ["/lenh-mo", "Có cột nào khó hiểu không? Bấm vào Mây để xem giải thích nhé!"],
  ["/lenh-da-dong", "Muốn biết tỷ lệ thắng được tính thế nào không? Hỏi Mây nhé!"],
  ["/danh-muc", "Bấm mũi tên cạnh mã để xem từng vị thế — cần Mây chỉ không?"],
  ["/bo-loc", "Cần Mây giải thích cột nào trong Bộ lọc không?"],
  ["/ma/", "Mây giải thích vùng mua, cắt lỗ, chốt lời của mã này cho bạn nhé?"],
];

// Loi chao theo trang dang xem (neu co) hoac theo buoi trong ngay (gio / thu theo gio Viet Nam; thu 0 = Chu nhat). ngauNhien trong [0, 1) de chon - truyen vao de test duoc.
export function chonLoiChao({ duongDan = "/", gio, thu, ngauNhien = 0 }) {
  const theoTrang = CHAO_THEO_TRANG.find(([d]) => (d.endsWith("/") ? duongDan.startsWith(d) : duongDan === d || duongDan.startsWith(`${d}/`)));
  let theoGio;
  if (thu === 0 || thu === 6) theoGio = "Cuối tuần thị trường nghỉ — xem lại Nhật ký giao dịch cùng Mây nhé?";
  else if (gio < 9) theoGio = "Chào buổi sáng! Trước giờ mở cửa, cần Mây giải thích gì không?";
  else if (gio < 11.5) theoGio = "Phiên sáng đang chạy — cần Mây giúp gì không?";
  else if (gio < 13) theoGio = "Nghỉ trưa rồi, xem lại Top cơ hội cùng Mây nhé?";
  else if (gio < 15) theoGio = "Phiên chiều đang chạy — cần Mây giải thích gì không?";
  else theoGio = "Chào bạn! Xem lại lệnh hôm nay cùng Mây nhé?";
  if (duongDan === "/" && !(thu === 0 || thu === 6)) return ngauNhien < 0.5 ? "Chào bạn! Xem Top cơ hội hôm nay cùng Mây nhé?" : theoGio;
  if (theoTrang && ngauNhien < 0.6) return theoTrang[1];
  return theoGio;
}
