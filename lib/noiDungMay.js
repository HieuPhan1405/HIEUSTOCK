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
    meo: ["Thị trường nghiêng xấu (nhiều ngành đỏ, thanh khoản thấp) thì nên chọn lọc tín hiệu Mua kỹ hơn."],
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
    meo: ["Gõ mã vào ô tìm kiếm ở đầu trang để mở biểu đồ mã khác, kể cả VN-Index."],
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
    noiDung: "Tổng hợp Xu hướng (×1,5) + Động lượng + Dòng tiền (×1,2). Vượt ngưỡng mua (1,25) cùng các điều kiện khác thì có tín hiệu MUA; tụt sâu dưới ngưỡng bán thì BÁN.",
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
