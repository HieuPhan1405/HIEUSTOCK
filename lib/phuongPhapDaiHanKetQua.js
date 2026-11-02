// KET QUA BACKTEST CAC PHUONG PHAP DAI HAN (hien tren /dai-han) - hang so ghi tay tu cac script nghien cuu (03/11/2026), KHONG tu cap nhat.
// Nguon: engine/dich-vu/nghienCuuNhaDauTuNoiTieng.mjs (bang theo nam, do nhay, bat dau tu 2026, loc xu huong), nghienCuuChoVungGia.mjs (cho vung gia), nghienCuuDinhGiaRaGia.mjs (dinh gia),
//        nghienCuuNamGiuDaiHan.mjs (cam vai ma), nghienCuuDiemBDaiHan.mjs (cach ban), nghienCuuNganhCotLoiVeTinh.mjs (loi - ve tinh), nghienCuuTichSanNganHang.mjs (ngan hang).
// Khung: K = 15 ma chia deu, kiem tra moi quy (sau BCTC), phi 0,2%/chieu, BCTC co hieu luc quy + 50 ngay, chi ma DANG niem yet (thien lech nguoi song sot), von hoa theo so CP hien tai.

export const GIAI_DOAN = "01/2022 – 21/10/2026";

// Loi suat tung nam lich (%), cot cuoi = 2026 den 21/10. cagr = %/nam ca giai doan, sut = sut giam toi da (%).
export const BANG_NAM = {
  nam: ["2022", "2023", "2024", "2025", "2026*"],
  dong: [
    { khoa: "vni", ten: "VN-Index", nam: [-28, 9, 7, 44, -3], cagr: 3.4, sut: -32 },
    { khoa: "buffett", ten: "Buffett — doanh nghiệp tốt, giá hợp lý", nam: [9, 25, 30, 23, -16], cagr: 13.8, sut: -16 },
    { khoa: "graham", ten: "Graham — nhà đầu tư phòng thủ", nam: [-6, 20, 9, 43, -10], cagr: 10.2, sut: -20 },
    { khoa: "coTuc", ten: "Cổ tức tiền mặt cao", nam: [-3, 24, 13, 31, -14], cagr: 9.6, sut: -25 },
    { khoa: "itBienDong", ten: "Ít biến động (Haugen)", nam: [-13, 3, 12, 25, -9], cagr: 2.9, sut: -21 },
  ],
};

// Neu bat dau tu dau nam 2026 (tin hieu 31/12/2025, mua 05/01/2026, den 21/10/2026): lai/lo cong don (%).
export const BAT_DAU_2026 = {
  vni: -2.8,
  dong: [
    { ten: "Cổ tức tiền mặt cao", lai: 1.9 },
    { ten: "Graham — nhà đầu tư phòng thủ", lai: -5.2 },
    { ten: "Ít biến động (Haugen)", lai: -8.0 },
    { ten: "Buffett — doanh nghiệp tốt, giá hợp lý", lai: -12.3 },
  ],
  ghiChu: "Buffett lỗ nặng chủ yếu vì PNJ (−69%), DGC (−37%), FPT (−32%). Nếu loại hai mã dính pháp lý, kết quả là −5,7% — nhưng đó là kết quả nhìn lại, hệ thống không tự phát hiện được rủi ro này.",
};

export const KET_LUAN = [
  { tieu: "Lợi thế chủ yếu là phòng thủ", noi: "Các phương pháp này giảm sụt giảm so với VN-Index (Buffett −16% so với −32%), thắng rõ năm 2022 và thua khi thị trường tăng mạnh (2025). Từ giữa 2024 không còn phương pháp nào vượt VN-Index đáng kể." },
  { tieu: "Mẫu ngắn, một chu kỳ", noi: "Chỉ khoảng 4,75 năm dữ liệu báo cáo tài chính, chỉ gồm mã còn niêm yết. Mức vượt VN-Index chưa đủ độ tin cậy thống kê." },
  { tieu: "Một nửa là ngân hàng", noi: "Buffett và Graham dựa nhiều vào ngân hàng (46–57% danh mục). Bỏ ngân hàng ra, Buffett chỉ còn 3,9%/năm và Graham 0,7%/năm. Cổ tức là phương pháp duy nhất không phụ thuộc ngân hàng." },
  { tieu: "Không phát hiện được rủi ro pháp lý", noi: "Bộ lọc chỉ nhìn báo cáo tài chính và giá. PNJ, DGC đều qua bộ lọc trước khi giá sập — nên web có danh sách mã bị đánh dấu rủi ro do quản trị cập nhật." },
];

export const KHONG_DUNG = [
  { ten: "Greenblatt — công thức kỳ diệu", ketQua: "−0,6%/năm, sụt giảm −55%" },
  { ten: "Piotroski — rẻ + điểm F cao", ketQua: "−3,0%/năm, sụt giảm −38%" },
  { ten: "Faber — VN-Index trên trung bình 10 tháng", ketQua: "2,3%/năm (2022–2026), mất lợi nhuận" },
  { ten: "Cổ phiếu chứng khoán (CTCK)", ketQua: "sụt giảm −57% đến −65%, kết quả phụ thuộc hoàn toàn vào mốc bắt đầu" },
  { ten: "Mua theo mức giảm / chờ rẻ", ketQua: "không hơn mua đều; chờ chỉ giúp giá vốn tốt hơn khi khớp lệnh, nhưng bỏ lỡ mã tăng" },
];

// Cach ban dai han (ro moi ma von hoa hien nay >= 2.000 ty, vao cuoi moi thang, giu toi da 36 thang, tien mat sau khi ban 0%): lai TB sau 36 thang, ty le vi the bi ban som, ma xau nhat.
export const CACH_BAN = {
  ghiChu: "Mẫu gồm các mã còn niêm yết và có vốn hóa lớn hiện nay nên thiên lệch về phía giữ; tiền mặt 0% sau khi bán làm các quy tắc bán thiệt thòi hơn.",
  dong: [
    { ten: "Giữ không bán", lai: 53.0, ban: 0, xau: -91 },
    { ten: "Chốt hết khi lãi 100%", lai: 43.5, ban: 41, xau: -91 },
    { ten: "Trailing stop 35% từ đỉnh", lai: 25.0, ban: 85, xau: -43 },
    { ten: "Cắt lỗ −25%", lai: 24.7, ban: 59, xau: -36 },
    { ten: "Bán sau 12 tháng", lai: 20.6, ban: 100, xau: -87 },
    { ten: "Cắt lỗ −15%", lai: 18.6, ban: 73, xau: -27 },
    { ten: "Thủng SMA200", lai: 12.0, ban: 100, xau: -80 },
    { ten: "Thủng đường cân bằng dài hạn", lai: 9.0, ban: 100, xau: -78 },
  ],
};

// Mo hinh loi - ve tinh (65% FPT + ngan hang / 35% ban le, BDS KCN) tu cac moc bat dau 2014..2025, chi dung gia, danh sach CHON SAU nen thien lech nhin lai.
export const LOI_VE_TINH = {
  cagrTB: 13.8,
  vniTB: 10,
  homVni: "9/12 mốc bắt đầu",
  gayDay: "Cầm từ cuối 2024: −0,8%/năm (VN-Index +19,6%); năm 2025 +10% so với +41%.",
  canhBao: "Luận điểm tăng trưởng của FPT đúng (lợi nhuận +15%/năm) nhưng giá vẫn giảm 26% (2025) và 33% (2026) vì định giá bị nén: lợi nhuận tăng không đảm bảo giá tăng.",
};

export const DINH_GIA = {
  moTa: "Giá hợp lý là trung vị của bốn cách: PB hợp lý theo ROE, lợi nhuận có tăng trưởng, số Graham và P/E trung vị ngành.",
  nhom: [
    { nhan: "r ≤ 0,5", ghiChu: "rất rẻ — thường do lợi nhuận bất thường" },
    { nhan: "0,5–0,7", ghiChu: "vùng chiết khấu tốt nhất (doanh nghiệp ngoài ngân hàng: 12% sau 12 tháng)" },
    { nhan: "0,7–0,9", ghiChu: "rẻ" },
    { nhan: "0,9–1,1", ghiChu: "hợp lý" },
    { nhan: "> 1,1", ghiChu: "đắt (sau 12 tháng chỉ +4%)" },
  ],
  ghiChu: "Cứ rẻ hơn định giá thì tốt hơn, nhưng quy luật gãy ở vùng rẻ nhất với doanh nghiệp ngoài ngân hàng. Nên coi mức chiết khấu 30–50% là vùng quan tâm, rẻ hơn nữa cần kiểm tra lợi nhuận bất thường.",
};
