"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import GiaiThichThem from "@/components/GiaiThichThem";
import { createChart, createTextWatermark, createSeriesMarkers, BaselineSeries, CandlestickSeries, HistogramSeries, LineSeries, CrosshairMode, LineStyle, PriceScaleMode } from "lightweight-charts";
import { MousePointer2, TrendingUp, MoveUpRight, Minus, SeparatorVertical, Square, Ruler, Trash2, Magnet, PenLine, Undo2, Redo2, ArrowUpRight, Type, Equal, Lock, LockOpen, Spline, BarChartHorizontal, Maximize2, Minimize2, Eraser, Waypoints, Activity, Check, ChevronRight, ChevronDown, Info, Slash, Compass, ArrowRight, Crosshair, ChartLine, Layers, Frame, Network, Radar, AlignJustify, Columns3, CircleDot, Orbit, Rainbow, Clock, Grid3x3, ChartSpline, Triangle, AudioWaveform, Mountain, Waves, TrendingDown, Target, ChartCandlestick, CornerUpRight, Anchor, RectangleHorizontal, CalendarRange, Scaling, Brush, Highlighter, Rotate3d, Circle, Pentagon, LineSquiggle, StickyNote, Tag, Pin, MessageSquare, MessageCircle, Signpost, Flag, ArrowBigUp, ArrowBigDown, Smile, Eye, EyeOff, LockKeyhole, Repeat, History, Play, Pause, StepForward, X, Bell, BellPlus, Settings } from "lucide-react";
import { tinhIchimoku, tinhIchimokuTuongLai, SO_BUOC_TUONG_LAI, tinhCanBangTuongLai, tinhCanBang, trungBinhDon, THAM_SO_MAC_DINH } from "@/lib/chiBaoKyThuat";
import { ema, rsi, macd, bollinger, stochastic, mfi, adx, vwapTrongNgay, mcdx } from "@/lib/chiBaoPhu";
import { homilyDE, homilyTE, homilyKDJ, homilyThaoBan, diemCat, CAI_HONG } from "@/lib/homily";
import { bankerRhythm } from "@/lib/bankerRhythm";
import { thamSo, kieuNet, hexRgba, nhanDong, docLuuTru, ghiLuuTru, CO_CAI_DAT } from "@/lib/caiDatChiBao";
import CaiDatChiBao from "@/components/CaiDatChiBao";
import { liquidityTrap } from "@/lib/liquidityTrap";
import { avpt } from "@/lib/avpt";
import { phanKyRSI, phanKyRSISom } from "@/lib/phanKyRSI";
import { autoFibExt } from "@/lib/autoFib";
import { vungCungCau, chonVungDeVe } from "@/lib/vungCungCau";
import { adaptiveSuperTrend } from "@/lib/adaptiveSuperTrend";
import { tinhBankerHienThi, MAU_BANKER } from "@/lib/dongTienBanker";
import { nhanDienMauHinh, nhanDienDangHinhThanh, THONG_KE_MAU_HINH } from "@/lib/mauHinh";
import { nhanDienMauHinhNen, THONG_KE_MAU_HINH_NEN } from "@/lib/mauHinhNen";
import { LopVe } from "@/components/veBieuDoLop";
import { CONG_CU_MOI, NHOM_CONG_CU, DS_BIEU_TUONG } from "@/components/veCongCuTV";
import { tinhHoSoKhoiLuong, chonNenChoHoSo, chuanBiNenGio, timDinhKhoiLuong, chonHoTroKhangCu } from "@/lib/volumeProfile";
import { DaiMay, DaiGia, VachNgay, NhanSo, Footprint } from "@/components/bieuDoPlugin";
import { fmt } from "@/components/dungChung";
import BangThongTinBieuDo from "@/components/BangThongTinBieuDo";
import ThongTinMaBieuDo from "@/components/ThongTinMaBieuDo";
import PanelBenPhaiBieuDo from "@/components/PanelBenPhaiBieuDo";
import { dangTrongPhienGiaoDich } from "@/lib/khungGioVaoLenh";
import { docCanhBao, luuCanhBao, taoCanhBao, kiemTraCanhBao, hienThongBaoGia, KHOA_CANH_BAO, SU_KIEN_CANH_BAO } from "@/lib/canhBaoGia";
import { soVN, pctVN } from "@/lib/soVN";

// Mau cho phan GIAO DIEN (React) dung bien CSS de doi sang/toi; rieng bieu do ve bang canvas khong doc duoc bien CSS nen lay gia tri that qua mauTheoGiaoDien().
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const PRIMARY = "#6C5CE7";
const XANH = "var(--xanh)";
const DO = "var(--do)";

function mauTheoGiaoDien() {
  const cs = getComputedStyle(document.documentElement);
  const l = (ten) => cs.getPropertyValue(`--${ten}`).trim();
  return { nen: l("card"), chu: l("chu"), mo: l("mo"), vien: l("vien"), luoi: l("vien-nhe"), xanh: l("xanh"), do: l("do"), ma200: l("chu-2"), diemB: l("diem-b") || "#A78BFA", diemDay: l("diem-day") || "#E8DCC4" };
}
// Doi mau bieu do ngay khi nguoi dung doi che do sang/toi (khong can tai lai trang).
function apDungMau(s) {
  const m = mauTheoGiaoDien();
  s.chart.applyOptions({
    layout: { background: { type: "solid", color: m.nen }, textColor: m.mo },
    grid: { vertLines: { color: m.luoi }, horzLines: { color: m.luoi } },
    rightPriceScale: { borderColor: m.vien },
    timeScale: { borderColor: m.vien },
  });
  mauNen(s, m);
  s.ma200.applyOptions({ color: m.ma200 });
  s.lopVe?.datMauGiaoDien({ mo: m.mo, nen: m.nen });
  s.footprint?.datMauChu(m.chu);
}

// Mau nen: binh thuong to dac; khi bat FOOTPRINT chi giu VIEN than + rau de thay cac muc gia ben trong.
function mauNen(s, m = mauTheoGiaoDien()) {
  const fp = !!s.footprintBat;
  s.candle.applyOptions({ upColor: fp ? "rgba(0,0,0,0)" : m.xanh, downColor: fp ? "rgba(0,0,0,0)" : m.do, borderVisible: fp, borderUpColor: m.xanh, borderDownColor: m.do, wickUpColor: m.xanh, wickDownColor: m.do });
}

// Kieu "cham tron" cho duong tuong lai: tat duong noi, chi hien diem.
const CHAM = { lineVisible: false, pointMarkersVisible: true, pointMarkersRadius: 1.5 };

const MAU = {
  tenkan: "#3B9EFF",
  kijun: "#FF8C00",
  spanA: "rgba(34,197,94,0.75)",
  spanB: "rgba(239,68,68,0.75)",
  chikou: "#EAB308",
  cb1: "#A78BFA",
  cb2: "#E879F9",
  ma20: "#F472B6",
  ma50: "#2DD4BF",
  ma200: "#E5E7EB", // chi la gia tri du phong - mau that cua duong MA200 lay theo che do sang/toi (mauTheoGiaoDien().ma200)
};

const KHOANG = [
  { nhan: "3T", nen: 63 },
  { nhan: "6T", nen: 126 },
  { nhan: "1N", nen: 252 },
  { nhan: "3N", nen: 756 },
  { nhan: "Tất cả", nen: 0 },
];
// Khung nho trong ngay (nen 1 gio / 30 / 15 / 5 phut): thoi gian nen la giay Unix da cong 7 gio (xem lib/lichSuGia.js layNenNoiNgay) - hien dung GIO VIET NAM. So nen moi ngay giao dich: 1H = 5, 30P = 9, 15P = 16, 5P = 48.
const KHUNG_CHON = [
  { khoa: "D", nhan: "Ngày" },
  { khoa: "W", nhan: "Tuần" },
  { khoa: "MO", nhan: "Tháng" },
  { khoa: "H", nhan: "1 giờ" },
  { khoa: "M30", nhan: "30 phút" },
  { khoa: "M15", nhan: "15 phút" },
  { khoa: "M5", nhan: "5 phút" },
  { khoa: "M1", nhan: "1 phút" },
];
// Thanh khung thoi gian kieu TradingView (1 hang chu ngan): 1p 5p 15p 30p 1G Ngay Tuan
const KHUNG_NHANH = [
  { khoa: "M1", nhan: "1p", ten: "1 phút" },
  { khoa: "M5", nhan: "5p", ten: "5 phút" },
  { khoa: "M15", nhan: "15p", ten: "15 phút" },
  { khoa: "M30", nhan: "30p", ten: "30 phút" },
  { khoa: "H", nhan: "1G", ten: "1 giờ" },
  { khoa: "D", nhan: "Ngày", ten: "Khung ngày" },
  { khoa: "W", nhan: "Tuần", ten: "Khung tuần" },
  { khoa: "MO", nhan: "Tháng", ten: "Khung tháng" },
];
const NEN_MOI_NGAY = { H: 5, M30: 9, M15: 16, M5: 48, M1: 241 };
const BUOC_PHUT = { H: 60, M30: 30, M15: 15, M5: 5, M1: 1 };
const laNoiNgay = (kt) => kt in BUOC_PHUT;
const khoangNoiNgay = (kt) => [{ nhan: "1T", nen: 5 * NEN_MOI_NGAY[kt] }, { nhan: "2T", nen: 10 * NEN_MOI_NGAY[kt] }, { nhan: "1th", nen: 21 * NEN_MOI_NGAY[kt] }, { nhan: "Tất cả", nen: 0 }];
// Nen ke tiep (giay, da cong 7 gio) theo cac phien 9:00-11:30 va 13:00-14:45, bo qua T7 / CN - dung ve "may tuong lai" o khung nho.
function nenNoiNgayKeTiep(t, kt) {
  const s = BUOC_PHUT[kt];
  const d = new Date(t * 1000);
  const ph = d.getUTCHours() * 60 + d.getUTCMinutes();
  const moc = [];
  for (let m = 540; m < 690; m += s) moc.push(m);
  for (let m = 780; m < 885; m += s) moc.push(m);
  const nx = moc.find((m) => m > ph);
  if (nx != null) return t + (nx - ph) * 60;
  const e = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  do e.setUTCDate(e.getUTCDate() + 1);
  while ([0, 6].includes(e.getUTCDay()));
  return e.getTime() / 1000 + moc[0] * 60;
}
// Nhan thoi gian cua 1 nen: nen ngay / tuan = "yyyy-mm-dd" -> "dd/mm/yyyy"; nen khung nho = giay -> "dd/mm/yyyy hh:mm" (gio Viet Nam).
const nhanThoiGian = (t) => {
  if (typeof t !== "number") return String(t).split("-").reverse().join("/");
  const d = new Date(t * 1000);
  const p = (x) => String(x).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
};

// Bollinger: mau CAM (de thay tren ca nen toi lan sang, khac hang Ichimoku / MA / EMA), dai tren + duoi net 2px, duong giua net dut, vung giua to nhe.
const MAU_BB = "#F59E0B";
const MAU_BB_NEN = "rgba(245,158,11,0.13)";
const MAU_VWAP = "#E879F9";
const MLST_LEN = "#22C55E"; // ML Adaptive SuperTrend: mau duong tang / giam (hex 6 so de ghep do trong suot)
const MLST_XUONG = "#EF4444";
const CONG_TAT = [
  { khoa: "ichimoku", nhan: "Ichimoku", mau: MAU.kijun },
  { khoa: "canBang", nhan: "Cân bằng dài hạn", mau: MAU.cb1 },
  { khoa: "ma", nhan: "MA 20/50/200", mau: MAU.ma20 },
  { khoa: "ema", nhan: "EMA 9/21", mau: "#22D3EE" },
  { khoa: "boll", nhan: "Bollinger", mau: MAU_BB },
  { khoa: "vwap", nhan: "VWAP", mau: MAU_VWAP }, // chi khung trong ngay (bat dau lai moi phien)
  { khoa: "footprint", nhan: "Footprint (mua / bán chủ động)", mau: "#22C55E" }, // chi VN30F1M o khung trong ngay (tick that DNSE, lib/footprint.js)
  { khoa: "chiaNgay", nhan: "Chia ngày", mau: "#94A3B8" }, // chi khung trong ngay: vach doc net dut giua cac phien + nhan ngay
  { khoa: "vp", nhan: "Volume Profile", mau: "#F6C544" },
  { khoa: "htkc", nhan: "Hỗ trợ / Kháng cự (KL)", mau: "#38BDF8" },
  { khoa: "mlst", nhan: "ML Adaptive SuperTrend", mau: "#00C9A7" }, // lib/adaptiveSuperTrend.js - so 1/2/3 = muc bien dong (kiem dinh 17/11/2026: tin hieu doi chieu khong hon SuperTrend thuong)
  { khoa: "cungCau", nhan: "Vùng cung cầu", mau: "#F59E0B" }, // lib/vungCungCau.js - tu video VT Markets 18/11/2026, chi la cong cu ve tham khao (chua kiem dinh)
  { khoa: "autoFib", nhan: "Auto Fib Extension", mau: "#14B8A6" }, // lib/autoFib.js - chi la cong cu ve tham khao (kiem dinh 16/11/2026: khong du doan duoc dinh)
];
// Ho tro / khang cu THAM KHAO theo khoi luong: dinh khoi luong cua SO_NEN_HTKC nen gan nhat (khung ngay ~6 thang; khung tuan lay 26 tuan)
const SO_NEN_HTKC = { D: 120, W: 26, MO: 12 };
const MAU_HO_TRO = "#22C55E";
const MAU_KHANG_CU = "#EF4444";
// Chi bao PHU o cua so rieng phia duoi (moi chi bao 1 khung): bat / tat bang chip.
const CHI_BAO_PHU = [
  { khoa: "rsi", nhan: "RSI 14", mau: "#A78BFA" },
  { khoa: "macd", nhan: "MACD", mau: "#60A5FA" },
  { khoa: "stoch", nhan: "Stochastic", mau: "#FBBF24" },
  { khoa: "mfi", nhan: "MFI 14", mau: "#2DD4BF" },
  { khoa: "adx", nhan: "ADX 14", mau: "#F472B6" },
  { khoa: "mcdx", nhan: "MCDX", mau: "#EF4444" }, // Banker (do) / Hot Money (vang) / Retailer (xanh) - lib/chiBaoPhu.js mcdx
  { khoa: "bkr", nhan: "Banker Rhythm", mau: "#3B82F6" }, // lib/bankerRhythm.js: "2 rau" chi do vi tri gia trong bien do 15 phien (KHONG phai dong tien that); kiem dinh 21/11/2026: khong co loi the rieng
  { khoa: "dongTien", nhan: "Dòng tiền", mau: "#22C55E" }, // Banker Fund Flow (lib/dongTienBanker.js): chi la chi bao hien thi, KHONG phai tin hieu mua / ban
];
// HOMILY CHART (21/11/2026): bo chi bao phong theo ma cong khai cua phan mem Homily (lib/homily.js, nguon o Desktop/Homily-Code). Chi la chi bao HIEN THI / THAM KHAO:
// kiem dinh 389 ma cho thay mau nen DE / TE, giao cat, J cat 50, Taichi... khong co loi the thong ke rieng le (xem memory project_homily_kiem_dinh). Mau theo quy uoc Homily: DO = tien vao / tang, XANH LA = tien ra / giam.
const NHOM_HOMILY = "Homily Chart (tham khảo, chưa có lợi thế)";
const HOMILY_GIA = [
  { khoa: "hmTE", nhan: "TE 趋势王 (xu hướng)", mau: "#D946EF" },
  { khoa: "hmJinChu", nhan: "进出 (EMA 8 · 20)", mau: "#EAB308" },
  { khoa: "hmCaiHong", nhan: "彩虹 (16 đường EMA)", mau: "#F97316" },
  { khoa: "hmTongDao", nhan: "通道 (Bollinger 10)", mau: "#38BDF8" },
  { khoa: "hmStrong", nhan: "强势信号 (J cắt 50)", mau: "#3B82F6" },
  { khoa: "hmYeuThe", nhan: "弱势抄底", mau: "#06B6D4" },
  { khoa: "hmThaoBan", nhan: "操盘王 (买 / 卖)", mau: "#FB923C" },
  { khoa: "hmTaichi", nhan: "Taichi (RSI 9: 20 / 80)", mau: "#FACC15" },
];
const HOMILY_PHU = [
  { khoa: "hmDE", nhan: "DE 背离王 (dòng tiền)", mau: "#EF4444" }, // Deviation Expert: nen do = tien vao, xanh = tien ra; da doi chieu so voi phan mem Homily (PLX 20/11/2026 = -2,987)
  { khoa: "hmKDJ", nhan: "KDJ 9·3·3 (强势信号)", mau: "#3B82F6" },
];
// CHI BAO TRADINGVIEW DA KIEM DINH (21/11/2026): viet lai bang JS tu logic cong khai (MPL 2.0), chi la chi bao HIEN THI / THAM KHAO - ca hai KHONG co loi the khi dung de vao lenh (xem memory project_pine_liquidity_fibo_flip, project_he_thong_danh_ngan).
// Khong dua "Fibonacci Swing Flip [MarkitTick]" len vi giay phep CC BY-NC-SA 4.0 (phi thuong mai) khong hop voi trang co thu phi.
const NHOM_TV = "Chỉ báo TradingView đã kiểm định (tham khảo)";
const TV_GIA = [
  { khoa: "tvTrap", nhan: "Liquidity Trap Radar (quét thanh khoản)", mau: "#A3E635" },
  { khoa: "tvAvpt", nhan: "Anchored VWAP Pullback (AVPT)", mau: "#00E6A8" },
];
const TV_XANH = "#00E6A8";
const TV_DO = "#FF3B69";
const HM_DO = "#EF4444";
const HM_XANH = "#22C55E";
const SO_NEN_DANH_DAU_HM = 300; // chi gan nhan tren ~300 nen cuoi cho do roi
// RSI phan ky (lib/phanKyRSI.js): 2 day / dinh gia lien tiep nguoc chieu RSI - chi la DIEU KIEN THAM KHAO, nghien cuu 2026-10-16 tren 390 ma cho thay KHONG co loi the thong ke rieng le.
const CHI_BAO_PK = { khoa: "phanKy", nhan: "RSI phân kỳ", mau: "#34D399" };
const SO_PK_HIEN = 8; // chi ve SO_PK_HIEN phan ky gan nhat moi loai (tranh roi bieu do)
const SO_PK_SOM_HIEN = 3; // phan ky SOM (mau vang): chi ve 3 cai gan nhat moi loai
const MAU_PK_SOM = "#FBBF24";
const CHIEU_CAO_PHU = 140;

// Bieu tuong Fibonacci thoai lui (4 vach ngang + duong cheo net dut) - lucide khong co
function IconFib({ size = 16, strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 5h18M3 10h18M3 15h18M3 20h18" />
      <path d="M6 20 18 5" strokeDasharray="2 2.5" />
    </svg>
  );
}

// Cong cu ke ve (components/veBieuDoLop.js)
const CONG_CU_VE_GOC = [
  { khoa: "xuHuong", nhan: "Xu hướng", Icon: TrendingUp },
  { khoa: "tia", nhan: "Tia", Icon: MoveUpRight },
  { khoa: "ngang", nhan: "Ngang", Icon: Minus },
  { khoa: "doc", nhan: "Dọc", Icon: SeparatorVertical },
  { khoa: "chuNhat", nhan: "Chữ nhật", Icon: Square },
  { khoa: "fib", nhan: "Fibonacci thoái lui", Icon: IconFib },
  { khoa: "thuoc", nhan: "Thước đo", Icon: Ruler },
  { khoa: "gapKhuc", nhan: "Đường dẫn", Icon: Spline },
  { khoa: "frvp", nhan: "Volume Profile vùng chọn", Icon: BarChartHorizontal },
  { khoa: "kenh", nhan: "Kênh song song", Icon: Equal, goiY: "bấm 3 điểm để vẽ" },
  { khoa: "fibMoRong", nhan: "Fibonacci mở rộng dựa trên xu hướng", Icon: Waypoints, goiY: "bấm 3 điểm A (đầu nhịp), B (cuối nhịp), C (điểm hồi); mục tiêu = C + m × (B − A)" },
  { khoa: "mui", nhan: "Mũi tên", Icon: ArrowUpRight },
  { khoa: "chu", nhan: "Ghi chú", Icon: Type },
];
// Nhom cong cu o thanh ben trai (kieu TradingView): bam bieu tuong = dung cong cu vua dung cua nhom, bam mui ten nho = mo danh sach
const NHOM_VE = NHOM_CONG_CU; // bo tri nhom + tieu muc: components/veCongCuTV.js
// Bieu tuong cho cac cong cu thuoc bo TradingView (veCongCuTV.js)
const ICON_MOI = {
  thongTinDuong: Info, duongKeoDai: Slash, gocXuHuong: Compass, tiaNgang: ArrowRight, duongCat: Crosshair, hoiQuy: ChartLine, dinhDayPhang: Layers, kenhRoi: Frame,
  cayChia: Network, cayChiaSchiff: Network, cayChiaSchiffSua: Network, quatCayChia: Radar,
  kenhFib: AlignJustify, vungThoiGianFib: Columns3, quatFib: Radar, thoiGianFibXuHuong: Clock, vongFib: CircleDot, xoanOcFib: Orbit, cungFib: Rainbow, hopGann: Grid3x3, oVuongGann: Grid3x3, quatGann: Radar,
  xabcd: ChartSpline, cypher: ChartSpline, abcd: Waypoints, tamGiacMH: Triangle, baLucDay: AudioWaveform, vaiDauVai: Mountain,
  elliottXungLuc: Waves, elliottDieuChinh: Waves, elliottTamGiac: Waves, elliottKepDoi: Waves, elliottBaPhuc: Waves, chuKy: Repeat, chuKyThoiGian: Waves, duongSin: AudioWaveform,
  viTheMua: TrendingUp, viTheBan: TrendingDown, duBao: Target, mauThanhNen: ChartCandlestick, phepChieu: CornerUpRight, vwapNeo: Anchor, vungGia: RectangleHorizontal, vungNgay: CalendarRange, vungGiaNgay: Scaling,
  co: Brush, butDanhDau: Highlighter, chuNhatXoay: Rotate3d, tronTron: Circle, elip: Circle, tamGiacHinh: Triangle, daGiac: Pentagon, cung: Spline, duongCong: LineSquiggle, duongCongKep: LineSquiggle,
  chuNeo: Type, ghiChu: StickyNote, ghiChuGia: Tag, ghim: Pin, chuThichBong: MessageSquare, binhLuan: MessageCircle, nhanGia: Tag, bienBao: Signpost, coHieu: Flag, muiKhoi: ArrowUpRight, muiLenCT: ArrowBigUp, muiXuongCT: ArrowBigDown,
};
const CONG_CU_VE = [
  ...CONG_CU_VE_GOC,
  ...Object.entries(CONG_CU_MOI).map(([khoa, d]) => ({ khoa, nhan: d.nhan, Icon: ICON_MOI[khoa] ?? Smile, goiY: d.goiY, bieuTuong: DS_BIEU_TUONG.find((b) => b[0] === khoa)?.[1] })),
];
const MAU_VE = ["#F6C544", "#3B9EFF", "#22C55E", "#EF4444", "#E879F9", "#E5E7EB"];
// SO SANH NHIEU MA (20/11/2026): duong gia dong cua cua ma khac, quy ve CUNG DIEM XUAT PHAT voi ma chinh tai nen dau khung nhin (doi khung nhin thi quy lai) -> nhin do doc la thay manh / yeu hon.
const MAU_SO_SANH = ["#F59E0B", "#22D3EE", "#E879F9", "#A3E635"];
const THANG_GIA = [
  { khoa: "thuong", nhan: "Thường" },
  { khoa: "log", nhan: "Log" },
  { khoa: "pct", nhan: "%" },
];
// Gia cham muc canh bao: thong bao he thong (neu da cho phep) + dong chu tren bieu do.
function baoChamGia(vuaBao, setThongBao) {
  const chu = vuaBao.map((c) => `${c.ma} ${c.huong === "len" ? "≥" : "≤"} ${soVN(c.gia, 2, true)} (giá ${soVN(c.giaKhiBao, 2, true)})`).join(" · ");
  setThongBao(chu);
  for (const c of vuaBao) hienThongBaoGia(`${c.ma} chạm mức cảnh báo`, `Giá ${soVN(c.giaKhiBao, 2, true)} ${c.huong === "len" ? "≥" : "≤"} ${soVN(c.gia, 2, true)}`, `/bieu-do?ma=${c.ma}`);
}
const khoaLuu = (ma, kt) => `cs-ve|${ma}|${kt}`; // kieu cu (truoc 20/11/2026): moi khung 1 bo hinh, diem theo chi so nen cua khung do
// HINH VE DUNG CHUNG MOI KHUNG (20/11/2026): 1 bo hinh / ma, moi diem { i, p } luu them ms (thoi diem cua diem) -> mo khung khac thi doi ms ra chi so nen cua khung do.
const khoaLuuChung = (ma) => `cs-ve|${ma}|*`;
const laDiemVe = (v) => v != null && typeof v === "object" && typeof v.i === "number" && typeof v.p === "number";
function doiDiemHinh(ds, f) {
  return ds.map((h) => {
    const o = { ...h };
    for (const [k, v] of Object.entries(h)) {
      if (laDiemVe(v)) o[k] = f(v);
      else if (Array.isArray(v) && v.length > 0 && v.every(laDiemVe)) o[k] = v.map(f);
    }
    return o;
  });
}
function docLuu(k) {
  try {
    const t = localStorage.getItem(k);
    const v = t ? JSON.parse(t) : null;
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

// NUT VUONG cua THANH CONG CU VE DOC ben trai (bo cuc kieu FireAnt Charts, chi trang /bieu-do): chi bieu tuong, ten o title.
function NutDoc({ chon = false, onClick, title, disabled = false, mau, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={chon}
      className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center hover:bg-[color:var(--hover-nhe)]"
      style={{ background: chon ? "rgba(108,92,231,0.22)" : undefined, color: chon ? "var(--chu)" : mau ?? "var(--mo)", opacity: disabled ? 0.4 : 1, cursor: disabled ? "default" : "pointer" }}
    >
      {children}
    </button>
  );
}

const VachDoc = () => <span className="w-6 h-px my-1 shrink-0" style={{ background: VIEN }} aria-hidden="true" />;
// THANH CONG CU VE BEN TRAI kieu TradingView: bieu tuong rieng tung nhom (Duong / Fibonacci / Hinh / Do), mui ten nho mo danh sach; ben duoi hit gia, giu cong cu, mau, xoa.
function ThanhVeTrai({ congCu, chonCongCu, giuCongCu, setGiuCongCu, hitGia, setHitGia, chonVe, xoaChon, soHinhVe, xoaHet, mauVe, setMauVe, cao, anHet, setAnHet, khoaHet, setKhoaHet, veMoiKhung, doiVeMoiKhung, chonVeMoiKhung, doiKhungHinhChon }) {
  const [mo, setMo] = useState(null); // { khoa, top, left }; khoa = "mau" cho bang mau
  const [cuoi, setCuoi] = useState({});
  useEffect(() => {
    if (!mo) return;
    const dong = (e) => {
      if (e.target.closest?.("[data-flyout]")) return;
      setMo(null);
    };
    const esc = (e) => e.key === "Escape" && setMo(null);
    document.addEventListener("mousedown", dong);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", dong);
      document.removeEventListener("keydown", esc);
    };
  }, [mo]);
  const dsCC = Object.fromEntries(CONG_CU_VE.map((c) => [c.khoa, c]));
  const moDs = (khoa, el) => {
    const r = el.getBoundingClientRect();
    setMo((c) => (c?.khoa === khoa ? null : { khoa, top: r.top, left: r.right + 8 }));
  };
  const nhomMo = mo && NHOM_VE.find((n) => n.khoa === mo.khoa);
  return (
    <div className="hidden md:flex flex-col items-center gap-0.5 py-2 px-1.5 border-r overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ borderColor: VIEN, ...(cao ? { height: cao } : {}) }} role="toolbar" aria-label="Công cụ vẽ" data-may="cong-cu-ve">
      <NutDoc chon={congCu === null} onClick={() => chonCongCu(null)} title="Con trỏ: kéo, thu phóng biểu đồ; bấm vào hình vẽ để chọn">
        <MousePointer2 size={18} strokeWidth={2} />
      </NutDoc>
      <VachDoc />
      {NHOM_VE.map((n) => {
        const dsTen = n.ds.filter((k) => !k.startsWith("#"));
        const dangDung = dsTen.includes(congCu);
        const khoaHien = dangDung ? congCu : cuoi[n.khoa] ?? dsTen[0];
        const cc = dsCC[khoaHien];
        const Icon = cc.Icon;
        return (
          <div key={n.khoa} className="relative flex items-center" data-flyout>
            <NutDoc chon={dangDung} onClick={() => chonCongCu(khoaHien)} title={`${cc.nhan}${cc.goiY ? ": " + cc.goiY : ""}`}>
              {cc.bieuTuong ? <span className="text-[16px] leading-none">{cc.bieuTuong}</span> : <Icon size={18} strokeWidth={2} />}
            </NutDoc>
            <button type="button" onClick={(e) => moDs(n.khoa, e.currentTarget.parentElement)} aria-label={`Danh sách: ${n.nhan}`} aria-expanded={mo?.khoa === n.khoa} className="absolute -right-1 top-1/2 -translate-y-1/2 w-3.5 h-6 rounded-sm flex items-center justify-center cursor-pointer hover:bg-[color:var(--hover-nhe)]" style={{ color: "var(--mo)" }}>
              <ChevronRight size={11} strokeWidth={2.5} />
            </button>
          </div>
        );
      })}
      <VachDoc />
      <NutDoc chon={hitGia} onClick={() => setHitGia((v) => !v)} title="Hít giá: điểm vẽ tự bám vào Mở / Cao / Thấp / Đóng của nến gần nhất">
        <Magnet size={17} strokeWidth={2} />
      </NutDoc>
      <NutDoc chon={giuCongCu} onClick={() => setGiuCongCu((v) => !v)} title="Giữ công cụ: vẽ xong vẫn giữ công cụ đang chọn để vẽ tiếp (Esc để thoát)">
        {giuCongCu ? <Lock size={17} strokeWidth={2} /> : <LockOpen size={17} strokeWidth={2} />}
      </NutDoc>
      <NutDoc chon={khoaHet} onClick={() => setKhoaHet((v) => !v)} title="Khóa tất cả hình vẽ: không chọn / kéo được khi đang khóa">
        <LockKeyhole size={17} strokeWidth={2} />
      </NutDoc>
      <NutDoc chon={anHet} onClick={() => setAnHet((v) => !v)} title={anHet ? "Hiện lại tất cả hình vẽ" : "Ẩn tất cả hình vẽ"}>
        {anHet ? <EyeOff size={17} strokeWidth={2} /> : <Eye size={17} strokeWidth={2} />}
      </NutDoc>
      <NutDoc chon={veMoiKhung} onClick={doiVeMoiKhung} title={veMoiKhung ? "Hình vẽ mới đang hiện ở MỌI khung thời gian. Bấm để hình mới chỉ hiện ở khung đang vẽ" : "Hình vẽ mới chỉ hiện ở khung đang vẽ. Bấm để hình mới hiện ở mọi khung thời gian"}>
        <Layers size={17} strokeWidth={2} />
      </NutDoc>
      <div className="relative" data-flyout>
        <NutDoc onClick={(e) => moDs("mau", e.currentTarget.parentElement)} title="Màu nét vẽ">
          <span className="w-4 h-4 rounded-full" style={{ background: mauVe, outline: `2px solid ${VIEN}`, outlineOffset: 1 }} />
        </NutDoc>
      </div>
      <VachDoc />
      <NutDoc disabled={!chonVe} chon={!!chonVe && chonVeMoiKhung} onClick={doiKhungHinhChon} title={!chonVe ? "Chọn 1 hình vẽ để đổi: chỉ hiện ở khung này / hiện ở mọi khung" : chonVeMoiKhung ? "Hình đang chọn hiện ở mọi khung. Bấm để chỉ hiện ở khung này" : "Hình đang chọn chỉ hiện ở khung này. Bấm để hiện ở mọi khung"}>
        <Frame size={17} strokeWidth={2} />
      </NutDoc>
      <NutDoc disabled={!chonVe} mau={chonVe ? DO : undefined} onClick={xoaChon} title="Xóa hình đang chọn (phím Delete)">
        <Trash2 size={17} strokeWidth={2} />
      </NutDoc>
      <NutDoc disabled={soHinhVe === 0} onClick={xoaHet} title={`Xóa tất cả hình vẽ của mã này${soHinhVe > 0 ? ` (${soHinhVe})` : ""}`}>
        <Eraser size={17} strokeWidth={2} />
      </NutDoc>
      {nhomMo && createPortal(
        <div data-flyout className="fixed z-[400] w-[290px] rounded-lg border shadow-xl py-1 overflow-y-auto" style={{ top: Math.max(8, Math.min(mo.top, (typeof window !== "undefined" ? window.innerHeight : 800) - 440)), left: mo.left, maxHeight: "min(430px, calc(100vh - 16px))", background: NEN_CARD, borderColor: VIEN }} role="menu" aria-label={nhomMo.nhan}>
          {nhomMo.ds.map((k) => {
            if (k.startsWith("#")) return <p key={k} className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide" style={{ color: MUTED, fontFamily: "'Open Sans', sans-serif" }}>{k.slice(1)}</p>;
            const c = dsCC[k], Icon = c.Icon, dang = congCu === k;
            return (
              <button key={k} type="button" role="menuitem" onClick={() => { setCuoi((x) => ({ ...x, [nhomMo.khoa]: k })); chonCongCu(k); setMo(null); }} title={c.goiY} className="w-full flex items-center gap-3 px-3 h-9 text-[13px] cursor-pointer hover:bg-[color:var(--hover-nhe)] text-left" style={{ color: dang ? TEXT : "var(--chu)", background: dang ? "rgba(108,92,231,0.18)" : undefined, fontFamily: "'Open Sans', sans-serif" }}>
                {c.bieuTuong ? <span className="text-[17px] leading-none w-[17px] text-center">{c.bieuTuong}</span> : <Icon size={17} strokeWidth={2} />}
                <span className="flex-1">{c.nhan}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
      {mo?.khoa === "mau" && createPortal(
        <div data-flyout className="fixed z-[400] rounded-lg border shadow-xl p-2 flex gap-2" style={{ top: mo.top, left: mo.left, background: NEN_CARD, borderColor: VIEN }} role="menu" aria-label="Màu nét vẽ">
          {MAU_VE.map((m) => (
            <button key={m} type="button" onClick={() => { setMauVe(m); setMo(null); }} aria-label={`Màu ${m}`} aria-pressed={mauVe === m} className="w-6 h-6 rounded-full cursor-pointer" style={{ background: m, outline: mauVe === m ? `2px solid ${TEXT}` : "none", outlineOffset: 2 }} />
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// Ngay giao dich ke tiep (bo qua T7/CN; khong biet ngay le) dung de ve "may tuong lai" - chi mang tinh hien thi.
function ngayTuongLai(ngayCuoi, k, tuan) {
  const d = new Date(`${ngayCuoi}T00:00:00Z`);
  if (tuan === "MO") {
    d.setUTCDate(1); // nen thang gan nhan = ngay giao dich dau thang -> nen tuong lai k = ngay 1 cua thang thu k ke tiep
    d.setUTCMonth(d.getUTCMonth() + k);
  } else if (tuan) {
    d.setUTCDate(d.getUTCDate() + 7 * k);
  } else {
    let con = k;
    while (con > 0) {
      d.setUTCDate(d.getUTCDate() + 1);
      const thu = d.getUTCDay();
      if (thu !== 0 && thu !== 6) con--;
    }
  }
  return d.toISOString().slice(0, 10);
}

function tinhChiBao(nen, khung, cd) {
  const tuan = khung === "W" ? true : khung === "MO" ? "MO" : false;
  const n = nen.length;
  const bars = nen.map((b) => ({ h: b.h, l: b.l, c: b.c }));
  const tIch = thamSo(cd, "ichimoku"), tCb = thamSo(cd, "canBang"), tMa = thamSo(cd, "ma");
  const dich = tIch.dichMay;
  const thoiGian = nen.map((b) => b.t);
  for (let k = 1; k <= dich + SO_BUOC_TUONG_LAI.spanB; k++) thoiGian.push(laNoiNgay(khung) ? nenNoiNgayKeTiep(thoiGian[thoiGian.length - 1], khung) : ngayTuongLai(nen[n - 1].t, k, tuan)); // dich: may goc; them spanB buoc de ve cham Senkou B tuong lai

  const ich = tinhIchimoku(bars, tIch);
  const tl = tinhIchimokuTuongLai(bars, tIch);
  const tlCb = tinhCanBangTuongLai(bars, tCb);
  const chamTL = (ds, dichThem) => ds.map(({ k, value }) => ({ time: thoiGian[n - 1 + k + dichThem], value })).filter((x) => x.time);
  const cb = tinhCanBang(bars, tCb);
  const dong = (mang) => {
    const kq = [];
    mang.forEach((v, i) => {
      if (v != null) kq.push({ time: thoiGian[i], value: v });
    });
    return kq;
  };
  const dai = (a, b) => {
    const kq = [];
    for (let i = 0; i < a.length; i++) if (a[i] != null && b[i] != null) kq.push({ time: thoiGian[i], a: a[i], b: b[i] });
    return kq;
  };
  const dongMA = (len) => dong(trungBinhDon(bars, len));

  return {
    n,
    tenkan: dong(ich.tenkan),
    kijun: dong(ich.kijun),
    spanA: dong(ich.spanA),
    spanB: dong(ich.spanB),
    chikou: dong(ich.chikou),
    ttTenkan: chamTL(tl.tenkan, 0),
    ttKijun: chamTL(tl.kijun, 0),
    ttSpanA: chamTL(tl.spanA, dich),
    ttSpanB: chamTL(tl.spanB, dich),
    ttCb1: chamTL(tlCb.cb1, 0),
    ttCb2: chamTL(tlCb.cb2, 0),
    may: dai(ich.spanA, ich.spanB),
    cb1: dong(cb.cb1),
    cb2: dong(cb.cb2),
    cbBand: dai(cb.cb1, cb.cb2),
    ma20: dongMA(tMa.ma1),
    ma50: dongMA(tMa.ma2),
    ma200: dongMA(tMa.ma3),
    dich,
  };
}

// Chi bao phu (EMA / Bollinger / RSI / MACD / Stochastic) theo dung nen dang hien (khung Ngay hoac Tuan) - cong thuc o lib/chiBaoPhu.js.
function tinhChiBaoPhu(nen, cd) {
  const T = (k) => thamSo(cd, k); // thong so nguoi dung da chinh (lib/caiDatChiBao.js), chua chinh = mac dinh
  const tE = T("ema"), tB = T("boll"), tM = T("macd"), tS = T("stoch"), tA = T("adx"), tR = T("rsi"), tF = T("mfi"), tX = T("mcdx");
  const dong = (mang) => {
    const kq = [];
    mang.forEach((v, i) => {
      if (v != null) kq.push({ time: nen[i].t, value: v });
    });
    return kq;
  };
  const close = nen.map((b) => b.c);
  const bars = nen.map((b) => ({ h: b.h, l: b.l, c: b.c }));
  const bb = bollinger(close, tB.n, tB.k);
  const mc = macd(close, tM.nhanh, tM.cham, tM.tinHieu);
  const st = stochastic(bars, tS.n, tS.k, tS.d);
  const barsV = nen.map((b) => ({ h: b.h, l: b.l, c: b.c, v: b.v ?? 0 }));
  const ad = adx(bars, tA.n);
  const noiNgay = typeof nen[0]?.t === "number"; // VWAP chi co nghia o khung trong ngay (bat dau lai moi phien)
  // HOMILY CHART (lib/homily.js)
  const mo = nen.map((b) => b.o ?? b.c);
  const cao = nen.map((b) => b.h);
  const thap = nen.map((b) => b.l);
  const hmDE = homilyDE(close, { forcastN: T("hmDE").forcastN });
  const hmTE = homilyTE(mo, cao, thap, close);
  const hmKDJ = homilyKDJ(cao, thap, close, T("hmKDJ").n);
  const hmTB = homilyThaoBan(mo, cao, thap, close);
  const tK = T("bkr"), tL = T("tvTrap"), tV = T("tvAvpt"), tJ = T("hmJinChu"), tD = T("hmTongDao"), tT = T("hmTaichi");
  const bkr = bankerRhythm(mo, cao, thap, close, { bienDo: tK.bienDo, bridge: tK.bridge, trend: tK.trend });
  const ltr = liquidityTrap(mo, cao, thap, close, { lookback: tL.lookback, cooldown: tL.cooldown, atrBuffer: tL.atrBuffer });
  const avp = avpt(mo, cao, thap, close, nen.map((b) => b.v ?? 0), { profile: tV.profile, swing: tV.swing, minImpulseAtr: tV.minImpulse });
  const cuoiT = nen[nen.length - 1].t;
  // muc lenh cua tin hieu CUOI: [{ gia, mau, nhan, kieu }] + khoang thoi gian (tu nen tin hieu den nen ket thuc / nen cuoi)
  const mucLenh = (s, iKet, kieuTP) => {
    if (!s) return null;
    const den = iKet != null ? nen[Math.min(iKet, nen.length - 1)].t : cuoiT;
    if (den === nen[s.i].t) return null;
    const ds = [{ gia: s.entry, mau: "#60A5FA", ten: "Entry" }, { gia: s.sl, mau: TV_DO, ten: "SL" }, { gia: s.tp1, mau: TV_XANH, ten: "TP1" }, { gia: s.tp2, mau: TV_XANH, ten: "TP2" }];
    if (kieuTP === 3) ds.push({ gia: s.tp3, mau: TV_XANH, ten: "TP3" });
    return { tu: nen[s.i].t, den, ds };
  };
  const tuTv = nen.length - SO_NEN_DANH_DAU_HM;
  const ltrCuoi = ltr.signals.length ? ltr.signals[ltr.signals.length - 1] : null;
  const avpCuoi = avp.signals.length ? avp.signals[avp.signals.length - 1] : null;
  const hmE8 = ema(close, tJ.nhanh);
  const hmE20 = ema(close, tJ.cham);
  const hmBB10 = bollinger(close, tD.n, tD.k);
  const hmR9 = rsi(close, tT.n);
  const tuNen = nen.length - SO_NEN_DANH_DAU_HM;
  const danhDau = (chiSo, position, shape, color, text) => chiSo.filter((i) => i >= tuNen).map((i) => ({ time: nen[i].t, position, shape, color, text }));
  const kdCat = diemCat(hmKDJ.j, 50);
  const yeuThe = [];
  for (let i = 1; i < nen.length; i++) if (hmKDJ.k[i] > hmKDJ.d[i] && hmKDJ.k[i - 1] < hmKDJ.d[i - 1] && hmKDJ.d[i - 1] < hmKDJ.d[i] && hmKDJ.d[i] < 50) yeuThe.push(i);
  const tbCat = diemCat(hmTB.b, hmTB.d);
  const jcCat = diemCat(hmE8, hmE20);
  const r20 = [];
  const r80 = [];
  for (let i = 1; i < nen.length; i++) {
    if (hmR9[i] == null || hmR9[i - 1] == null) continue;
    if (hmR9[i - 1] <= tT.duoi && hmR9[i] > tT.duoi) r20.push(i);
    if (hmR9[i - 1] >= tT.tren && hmR9[i] < tT.tren) r80.push(i);
  }
  // Dong tien (Banker Fund Flow) hien thi giong Pine: nen giua trend va bull/bear (mau theo trang thai), nen vang "Banker In", nen mo theo trang thai, duong trend doi mau, nhan IN / OUT / ...
  const bk = tinhBankerHienThi({ open: nen.map((b) => b.o ?? b.c), high: nen.map((b) => b.h), low: nen.map((b) => b.l), close, volume: nen.map((b) => b.v ?? 0) });
  const soNenNhan = 300; // chi gan nhan tren ~300 nen cuoi cho do roi
  const nhanBk = bk.nhan.filter((l) => l.i >= nen.length - soNenNhan).map((l) => ({ time: nen[l.i].t, loai: l.loai, text: l.text }));
  // ML Adaptive SuperTrend: duong tang (xanh) / giam (do) ngat quang khi doi chieu, to mau giua than nen va duong, mui ten doi chieu, so 1/2/3 canh duong.
  const ml = adaptiveSuperTrend(nen.map((b) => b.h), nen.map((b) => b.l), close);
  const MAU_SO = { 1: [MLST_LEN, MLST_XUONG].map((m) => m + "44"), 2: [MLST_LEN, MLST_XUONG].map((m) => m + "88"), 3: [MLST_LEN, MLST_XUONG].map((m) => m + "DD") };
  const mlCuoi = ml.st.length - 1;
  return {
    // 1 duong, mau theo tung diem; thu vien noi lien cac diem nen doan nhay luc doi chieu (i - 1 -> i) phai trong suot: doan do lay mau cua diem i - 1.
    mlstDuong: nen.map((b, i) => (ml.st[i] == null ? { time: b.t } : { time: b.t, value: ml.st[i], color: ml.huong[i + 1] != null && ml.huong[i + 1] !== ml.huong[i] ? "rgba(0,0,0,0)" : ml.huong[i] === 1 ? MLST_LEN : MLST_XUONG })),
    mlstDai: nen.map((b, i) => (ml.st[i] == null ? null : { time: b.t, a: ((b.o ?? b.c) + b.c) / 2, b: ml.st[i] })).filter(Boolean),
    mlstSo: nen.map((b, i) => (ml.st[i] == null || ml.so[i] == null ? null : { time: b.t, gia: ml.st[i] - ml.huong[i] * 0.7 * (ml.atr[i] ?? 0), text: String(ml.so[i]), mau: MAU_SO[ml.so[i]][ml.huong[i] === 1 ? 0 : 1] })).filter(Boolean),
    mlstMui: nen.map((b, i) => (i > 0 && ml.huong[i] != null && ml.huong[i - 1] != null && ml.huong[i] !== ml.huong[i - 1] ? { time: b.t, position: ml.huong[i] === 1 ? "belowBar" : "aboveBar", shape: ml.huong[i] === 1 ? "arrowUp" : "arrowDown", color: ml.huong[i] === 1 ? MLST_LEN : MLST_XUONG, text: "" } : null)).filter(Boolean),
    mlstTT: mlCuoi >= 0 && ml.huong[mlCuoi] != null ? { huong: ml.huong[mlCuoi], so: ml.so[mlCuoi] } : null,
    bankerNen: bk.trend.map((v, i) => (v == null || bk.bb[i] == null || bk.mauNen[i] == null ? null : { time: nen[i].t, open: v, high: Math.max(v, bk.bb[i]), low: Math.min(v, bk.bb[i]), close: bk.bb[i], color: MAU_BANKER[bk.mauNen[i]], borderColor: MAU_BANKER[bk.mauNen[i]], wickColor: MAU_BANKER[bk.mauNen[i]] })).filter(Boolean),
    bankerVang: bk.nenVang.map((v, i) => (v ? { time: nen[i].t, open: 0, high: 50, low: 0, close: 50, color: MAU_BANKER.vang, borderColor: MAU_BANKER.vang, wickColor: MAU_BANKER.vang } : null)).filter(Boolean),
    bankerDuong: bk.trend.map((v, i) => (v == null ? null : { time: nen[i].t, value: v, color: MAU_BANKER[bk.mauDuong[i]] })).filter(Boolean),
    bankerNenTrang: bk.trend.map((v, i) => (v == null || bk.bb[i] == null ? null : { time: nen[i].t, value: 100, color: v > bk.bb[i] ? "rgba(34,197,94,0.08)" : v < bk.bb[i] ? "rgba(239,68,68,0.08)" : "rgba(0,0,0,0)" })).filter(Boolean),
    bankerThoi: nen.map((b) => b.t),
    bankerNhan: nhanBk,
    bankerNhanGia: nhanBk.filter((l) => l.loai === "TP" || l.loai === "SL"),
    bankerNhanDao: nhanBk.filter((l) => l.loai !== "TP" && l.loai !== "SL"),
    ema9: dong(ema(close, tE.e1)),
    ema21: dong(ema(close, tE.e2)),
    bbTren: dong(bb.tren),
    bbMid: dong(bb.mid),
    bbDuoi: dong(bb.duoi),
    bbBand: nen.map((b, i) => (bb.tren[i] == null ? null : { time: b.t, a: bb.tren[i], b: bb.duoi[i] })).filter(Boolean),
    rsi: dong(rsi(close, tR.n)),
    macd: dong(mc.macd),
    signal: dong(mc.signal),
    hist: mc.hist.map((v, i) => (v == null ? null : { time: nen[i].t, value: v, color: v >= 0 ? "rgba(34,197,94,0.6)" : "rgba(239,68,68,0.6)" })).filter(Boolean),
    stochK: dong(st.k),
    stochD: dong(st.d),
    mfi: dong(mfi(barsV, tF.n)),
    adx: dong(ad.adx),
    pdi: dong(ad.pdi),
    mdi: dong(ad.mdi),
    mcdxB: dong(mcdx(close, { chuKy: tX.bankerChuKy, goc: tX.bankerGoc, nhay: tX.bankerNhay })),
    mcdxH: dong(mcdx(close, { chuKy: tX.hotChuKy, goc: tX.hotGoc, nhay: tX.hotNhay })),
    // HOMILY: DE (nen khong rau tu towerc phien truoc den towerc phien nay, do = tien vao), KDJ, TE (7 duong + nen thap), 进出, 彩虹, 通道 BB10, cac nhan
    hmDE: hmDE.tw.map((v, i) => (v == null || i === 0 || hmDE.tw[i - 1] == null ? null : { time: nen[i].t, open: hmDE.tw[i - 1], high: Math.max(v, hmDE.tw[i - 1]), low: Math.min(v, hmDE.tw[i - 1]), close: v, color: hmDE.len[i] ? HM_DO : HM_XANH, borderColor: hmDE.len[i] ? HM_DO : HM_XANH, wickColor: hmDE.len[i] ? HM_DO : HM_XANH })).filter(Boolean),
    // BANKER RHYTHM: 2 rau doi xung (b / bot1), BridgeT +/- (mau theo tang / giam), cot Buy2 +/-30, nhan Buy1
    bkrTren: dong(bkr.rauTren),
    bkrDuoi: dong(bkr.rauDuoi),
    bkrCauTren: bkr.bridge.map((v, i) => (v == null ? null : { time: nen[i].t, value: v, color: bkr.bridgeTang[i] ? "#F59E0B" : "#60A5FA" })).filter(Boolean),
    bkrCauDuoi: bkr.bridge.map((v, i) => (v == null ? null : { time: nen[i].t, value: -v, color: bkr.bridgeTang[i] ? "#F59E0B" : "#60A5FA" })).filter(Boolean),
    bkrA: bkr.buyA.map((v, i) => (v > 0 ? { time: nen[i].t, value: 30, color: "rgba(34,197,94,0.6)" } : null)).filter(Boolean),
    bkrAAm: bkr.buyA.map((v, i) => (v > 0 ? { time: nen[i].t, value: -30, color: "rgba(34,197,94,0.6)" } : null)).filter(Boolean),
    bkrB: bkr.buyB.map((v, i) => (v ? { time: nen[i].t, position: "belowBar", shape: "square", color: "#22C55E", text: "" } : null)).filter(Boolean),
    // LIQUIDITY TRAP RADAR + AVPT (lib/liquidityTrap.js, lib/avpt.js)
    tvTrapMui: ltr.signals.filter((s) => s.i >= tuTv).map((s) => ({ time: nen[s.i].t, position: s.dir === 1 ? "belowBar" : "aboveBar", shape: s.dir === 1 ? "arrowUp" : "arrowDown", color: s.dir === 1 ? "#A3E635" : TV_DO, text: s.dir === 1 ? "TRAP BUY" : "TRAP SELL" })),
    tvTrapMuc: mucLenh(ltrCuoi, null, 2),
    tvAvwap: avp.avwap.map((v, i) => (v == null ? null : { time: nen[i].t, value: v, color: avp.bias[i] === -1 ? TV_DO : TV_XANH })).filter(Boolean),
    tvBandTren: dong(avp.bandTren),
    tvBandDuoi: dong(avp.bandDuoi),
    tvBandDai: nen.map((b, i) => (avp.bandTren[i] == null ? null : { time: b.t, a: avp.bandTren[i], b: avp.bandDuoi[i] })).filter(Boolean),
    tvAvptMui: avp.signals.filter((s) => s.i >= tuTv).map((s) => ({ time: nen[s.i].t, position: s.dir === 1 ? "belowBar" : "aboveBar", shape: s.dir === 1 ? "arrowUp" : "arrowDown", color: s.dir === 1 ? TV_XANH : TV_DO, text: `${s.dir === 1 ? "BUY" : "SELL"} ${Math.round(s.q)}%` })),
    tvAvptMuc: mucLenh(avpCuoi, avpCuoi?.iKetThuc ?? null, 3),
    hmK: dong(hmKDJ.k),
    hmD: dong(hmKDJ.d),
    hmJ: dong(hmKDJ.j),
    hmTEDuong: hmTE.duong.map((d) => d.map((v, i) => (v == null ? null : { time: nen[i].t, value: v, color: i > 0 && d[i - 1] != null && v < d[i - 1] ? HM_XANH : "#D946EF" })).filter(Boolean)),
    hmTEThap: hmTE.thap.map((v, i) => (v == null || i === 0 || hmTE.thap[i - 1] == null ? null : { time: nen[i].t, open: hmTE.thap[i - 1], high: Math.max(v, hmTE.thap[i - 1]), low: Math.min(v, hmTE.thap[i - 1]), close: v, color: hmTE.len[i] ? "rgba(239,68,68,0.45)" : "rgba(34,197,94,0.45)", borderColor: hmTE.len[i] ? "rgba(239,68,68,0.45)" : "rgba(34,197,94,0.45)", wickColor: hmTE.len[i] ? "rgba(239,68,68,0.45)" : "rgba(34,197,94,0.45)" })).filter(Boolean),
    hmE8: dong(hmE8),
    hmE20: dong(hmE20),
    hmJinChuDai: nen.map((b, i) => (hmE8[i] == null || hmE20[i] == null ? null : { time: b.t, a: hmE8[i], b: hmE20[i] })).filter(Boolean),
    hmJinChuMui: [...danhDau(jcCat.len, "belowBar", "arrowUp", HM_DO, "Thêm"), ...danhDau(jcCat.xuong, "aboveBar", "arrowDown", HM_XANH, "Thoát")],
    hmCaiHong: CAI_HONG.flatMap((nhom) => nhom.chuKy.map((n) => ({ mau: nhom.mau, du: dong(ema(close, n)) }))),
    hmBBTren: dong(hmBB10.tren),
    hmBBMid: dong(hmBB10.mid),
    hmBBDuoi: dong(hmBB10.duoi),
    hmStrongMui: [...danhDau(kdCat.len, "belowBar", "arrowUp", "#3B82F6", "J50"), ...danhDau(kdCat.xuong, "aboveBar", "arrowDown", "#94A3B8", "J50")],
    hmYeuTheMui: danhDau(yeuThe, "belowBar", "circle", "#06B6D4", "抄底"),
    hmThaoBanMui: [...danhDau(tbCat.len, "belowBar", "arrowUp", "#FB923C", "买"), ...danhDau(tbCat.xuong, "aboveBar", "arrowDown", "#94A3B8", "卖")],
    hmTaichiMui: [...danhDau(r20, "belowBar", "circle", "#3B82F6", "T20"), ...danhDau(r80, "aboveBar", "circle", "#FACC15", "T80")],
    vwap: noiNgay ? dong(vwapTrongNgay(nen.map((b) => ({ t: b.t, h: b.h, l: b.l, c: b.c, v: b.v ?? 0 })))) : [],
  };
}

// Vung lenh (tinhVungLenh) -> cac dai gia ve len bieu do.
function daiTuVung(vung) {
  if (!vung) return [];
  const dai = [];
  if (vung.mua) dai.push({ tu: vung.mua.tu, den: vung.mua.den, mau: "34,197,94", nhan: "Vùng mua" });
  if (vung.sl) dai.push({ tu: vung.sl.tu, den: vung.sl.den, mau: "239,68,68", nhan: "Cắt lỗ" });
  if (vung.tp) {
    dai.push({ tu: vung.tp.gan.tu, den: vung.tp.gan.den, mau: "96,165,250", nhan: "Chốt lời gần" });
    dai.push({ tu: vung.tp.xa, den: vung.tp.xa, mau: "250,204,21", nhan: "Chốt lời xa", netDut: true });
  }
  if (vung.hoaVon) dai.push({ tu: vung.hoaVon, den: vung.hoaVon, mau: "148,163,184", nhan: "Hòa vốn", netDut: true });
  return dai;
}

function timNenTruoc(nen, ngay) {
  let kq = null;
  for (const b of nen) {
    if (b.t <= ngay) kq = b.t;
    else break;
  }
  return kq;
}

const chuoiThoiGian = (t) => (typeof t === "object" && t ? `${t.year}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}` : typeof t === "number" ? t : String(t));
const chuoiKL = (v) => (v >= 1e6 ? `${soVN(v / 1e6, 2, true)} tr` : v >= 1e3 ? `${soVN(v / 1e3, 0)} nghìn` : soVN(v ?? 0, 0));

function Chip({ bat, onClick, children, mau, may }) {
  return (
    <button
      type="button"
      data-may={may}
      onClick={onClick}
      aria-pressed={bat}
      className="px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors flex items-center gap-1.5"
      style={{
        background: bat ? "rgba(108,92,231,0.18)" : "transparent",
        border: `1px solid ${bat ? PRIMARY : VIEN}`,
        color: bat ? TEXT : MUTED,
        fontFamily: "'Open Sans', sans-serif",
        fontWeight: 500,
      }}
    >
      {mau && <span className="inline-block w-2 h-2 rounded-full" style={{ background: mau, opacity: bat ? 1 : 0.4 }} />}
      {children}
    </button>
  );
}

// Bieu do ky thuat kieu FireAnt/TradingView: nen Nhat + khoi luong + Ichimoku (9-17-33, may) + duong can bang dai han (65/129) + MA,
// ve them vung mua / cat lo / chot loi cua he thong (neu ma dang giu lenh). Cong thuc chi bao giong het AFL.
// Gia = gia DA DIEU CHINH co tuc/thuong CP (giong du lieu AmiBroker) de chi bao khop tin hieu; nguon qua /api/gia-lich-su.
// boCucRong (trang /bieu-do, 10/11/2026 kieu FireAnt Charts): cong cu ve thanh DOC ben trai luon hien (may tinh), o THONG TIN MA ben phai (man >= 1280px). thongTinMa: xem components/ThongTinMaBieuDo.js (app/bieu-do/page.js tao) - chi truong cong khai.
// Rut gon ten cong ty cho watermark (kieu TradingView "CTCP FPT").
const tenRutGon = (t) =>
  String(t || "")
    .replace(/^Ngân hàng Thương mại Cổ phần\s+/i, "NHTMCP ")
    .replace(/^Tổng Công ty Cổ phần\s+/i, "TCT CP ")
    .replace(/^Công ty Cổ phần\s+/i, "CTCP ");
const NHAN_KHUNG_MO = { D: "1D", W: "1W", MO: "1M", H: "1H", M30: "30m", M15: "15m", M5: "5m", M1: "1m" };

// DONG BO CON TRO giua cac o cua trang Da khung (17/11/2026): cac o cung nhom (prop dongBo) phat / nhan su kien window "cs-dong-bo-con" { nhom, nguon, ms, gran }.
// ms = thoi diem dang tro (nen ngay / tuan / thang: 0h cua ngay nhan nen, gran "ngay"; nen trong ngay: giay x 1000, gran "gio"). O nhan tim nen CUOI CUNG co thoi gian <= moc roi dat con tro vao do.
const msNen = (t) => (typeof t === "number" ? t * 1000 : Date.parse(`${t}T00:00:00Z`));
function timNenTheoMoc(nen, ms, gran) {
  if (!nen || nen.length === 0) return null;
  const soGio = typeof nen[0].t === "number";
  const dich = soGio ? (gran === "ngay" ? ms + 86399000 : ms) : Math.floor(ms / 86400000) * 86400000;
  let lo = 0, hi = nen.length - 1, kq = -1;
  while (lo <= hi) {
    const g = (lo + hi) >> 1;
    if (msNen(nen[g].t) <= dich) { kq = g; lo = g + 1; } else hi = g - 1;
  }
  return kq >= 0 ? nen[kq] : null;
}
// DONG BO ZOOM (17/11/2026): cac o cung nhom (prop dongBoZoom) phat / nhan su kien window "cs-dong-bo-zoom" { nhom, nguon, msTu, msDen, gran } khi NGUOI DUNG keo / cuon / bam nut khoang (khong phat khi bieu do tu dat khung hinh luc tai du lieu).
// Chi so logic <-> thoi gian: noi suy tuyen tinh giua cac nen; ngoai dau / cuoi (may tuong lai, khoang trong) ngoai suy theo buoc nen trung binh 10 nen gan nhat.
function buocNen(nen, cuoi) {
  const n = nen.length;
  const k = Math.min(10, n - 1);
  if (k < 1) return 86400000;
  return cuoi ? (msNen(nen[n - 1].t) - msNen(nen[n - 1 - k].t)) / k : (msNen(nen[k].t) - msNen(nen[0].t)) / k;
}
function msTuChiSo(nen, idx) {
  const n = nen.length;
  if (idx >= n - 1) return msNen(nen[n - 1].t) + (idx - (n - 1)) * buocNen(nen, true);
  if (idx <= 0) return msNen(nen[0].t) + idx * buocNen(nen, false);
  const k = Math.floor(idx), a = msNen(nen[k].t), b = msNen(nen[k + 1].t);
  return a + (b - a) * (idx - k);
}
function chiSoTuMs(nen, ms) {
  const n = nen.length;
  let lo = 0, hi = n - 1, k = -1;
  while (lo <= hi) {
    const g = (lo + hi) >> 1;
    if (msNen(nen[g].t) <= ms) { k = g; lo = g + 1; } else hi = g - 1;
  }
  if (k < 0) return (ms - msNen(nen[0].t)) / buocNen(nen, false);
  if (k >= n - 1) return n - 1 + (ms - msNen(nen[n - 1].t)) / buocNen(nen, true);
  const a = msNen(nen[k].t), b = msNen(nen[k + 1].t);
  return k + (ms - a) / (b - a);
}
let demODongBo = 0;
function danhDauTuongTac(ref) {
  ref.current = Date.now() + 500;
}

// khungMacDinh / batMacDinh (14/11/2026, trang /phai-sinh): khung thoi gian va bo chi bao bat san khi mo (vd VN30F1M mo khung 5 phut + EMA / Bollinger / VWAP / RSI / MFI).
export default function BieuDoKyThuat({ tenMa = null, ma, vung = null, ngayMua = null, chieuCao = 540, thongTin = null, layDayManHinh = false, truCao = 330, boCucRong = false, thongTinMa = null, khungMacDinh = "D", batMacDinh = null, dongBo = null, dongBoZoom = null, veTrai = false }) {
  const khungRef = useRef(null);
  const nenHienRef = useRef(null);
  const idDongBoRef = useRef(++demODongBo);
  const dangDatConTroRef = useRef(false);
  const dongBoRef = useRef(dongBo);
  const dongBoZoomRef = useRef(dongBoZoom);
  const tuongTacDenRef = useRef(0); // ms: den luc nay moi coi la NGUOI DUNG dang thao tac tren bieu do (keo / cuon / bam nut khoang)
  const boQuaDenRef = useRef(0); // ms: den luc nay khong phat zoom (vua nhan tu o khac)
  const veRef = useRef(null);
  const [khungTG, setKhungTG] = useState(khungMacDinh);
  const [batGoc, setBat] = useState(() => ({ ichimoku: true, canBang: true, ma: false, vung: true, ema: false, boll: false, vwap: false, footprint: false, chiaNgay: true, vp: false, htkc: false, mlst: false, cungCau: false, autoFib: false, rsi: false, macd: false, stoch: false, mfi: false, adx: false, mcdx: false, dongTien: false, phanKy: false, mauHinh: false, nenNhat: false, diemB: true, batDay: true, ...(batMacDinh || {}) }));
  // AN / HIEN chi bao (con mat trong chu thich, kieu TradingView): chi bao bi an van con trong danh sach nhung khong ve; `bat` = bat va khong bi an
  const [an, setAn] = useState({});
  const bat = useMemo(() => {
    const o = { ...batGoc };
    for (const k of Object.keys(an)) if (an[k]) o[k] = false;
    return o;
  }, [batGoc, an]);
  // CAI DAT CHI BAO (thong so + kieu net, luu o trinh duyet - lib/caiDatChiBao.js)
  const [caiDat, setCaiDat] = useState({ thamSo: {}, kieu: {} });
  const [moCaiDat, setMoCaiDat] = useState(null); // khoa chi bao dang mo hop cai dat
  useEffect(() => {
    // doc localStorage sau khi gan vao trang (tranh lech HTML may chu / trinh duyet)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCaiDat(docLuuTru());
    try {
      setAn(JSON.parse(localStorage.getItem("cs-chi-bao-an") ?? "{}") || {});
    } catch {
      /* khong doc duoc: giu mac dinh */
    }
  }, []);
  const luuCaiDat = (cd) => {
    setCaiDat(cd);
    ghiLuuTru(cd);
  };
  const doiAn = (k) =>
    setAn((a) => {
      const moi = { ...a, [k]: !a[k] };
      try {
        localStorage.setItem("cs-chi-bao-an", JSON.stringify(moi));
      } catch {
        /* bo qua */
      }
      return moi;
    });
  const khoaThamSo = useMemo(() => JSON.stringify(caiDat.thamSo), [caiDat.thamSo]);
  // DIEM B (mua phuc hoi) + DIEM BAT DAY cua ma nay (chi thanh vien da duyet - xem /api/diem-bieu-do), ve thanh mui ten tren nen gia (khung Ngay / Tuan).
  const [diemSK, setDiemSK] = useState({ ma: "", b: [], batDay: [] });
  const [congCu, setCongCuState] = useState(null); // cong cu ke ve dang chon (null = con tro)
  const [mauVe, setMauVe] = useState(MAU_VE[0]);
  const [hitGia, setHitGia] = useState(false);
  const [giuCongCu, setGiuCongCu] = useState(false);
  const [lichSuVe, setLichSuVe] = useState({ coHoanTac: false, coLamLai: false });
  const rootRef = useRef(null);
  // CHE DO TOAN MAN HINH (kieu TradingView): bieu do chiem het cua so, thanh cong cu gon 1 hang cuon ngang, bang thong tin o cot phai. Esc (khi khong dang chon cong cu ve) de thoat.
  const [toanMH, setToanMH] = useState(false);
  // GON MAC DINH (04/11/2026): chi hien khung Ngay / Tuan + 2 lop chinh cua he thong; chi bao khac va cong cu ve mo khi can (toan man hinh thi hien het).
  const [moChiBao, setMoChiBao] = useState(false);
  const [moVe, setMoVe] = useState(false);
  const [anHet, setAnHet] = useState(false);
  const [khoaHet, setKhoaHet] = useState(false);
  // HINH VE THEO KHUNG (20/11/2026, Hieu: "ve hinh ca 2 khung deu co, tat duoc ko"): moi hinh co truong khung = "*" (hien o moi khung) hoac ma khung luc ve (chi hien o khung do).
  // veMoiKhung = cach ap cho hinh MOI ve (luu o trinh duyet, mac dinh TAT = chi khung dang ve). Hinh dang chon doi duoc rieng bang nut o thanh cong cu.
  const [veMoiKhung, setVeMoiKhung] = useState(false);
  const veMoiKhungRef = useRef(false);
  const khungVeRef = useRef("D");
  const hinhKhungKhacRef = useRef([]); // hinh cua ma nay nhung khong hien o khung hien tai (giu nguyen khi luu)
  const [chonVeMoiKhung, setChonVeMoiKhung] = useState(false); // hinh dang chon co hien o moi khung khong
  const [nhomDong, setNhomDong] = useState({});
  const [timCB, setTimCB] = useState("");
  const [viTriCB, setViTriCB] = useState({ top: 0, left: 0 });
  const nutCBRef = useRef(null);
  const popCBRef = useRef(null);
  useEffect(() => {
    if (!moChiBao) return;
    const dong = (e) => {
      if (popCBRef.current?.contains(e.target) || nutCBRef.current?.contains(e.target)) return;
      setMoChiBao(false);
    };
    const esc = (e) => e.key === "Escape" && setMoChiBao(false);
    document.addEventListener("mousedown", dong);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", dong);
      document.removeEventListener("keydown", esc);
    };
  }, [moChiBao]);
  const [caoManHinh, setCaoManHinh] = useState(900);
  // Volume Profile: nen 1 gio (tai khi can), co hinh "frvp" hay khong, va cac tham chieu de ham tinh ho so luon doc du lieu moi nhat
  const [nenGio, setNenGio] = useState({ ma: "", nen: null });
  const [coFrvp, setCoFrvp] = useState(false);
  const duLieuHoSoRef = useRef({ nen: null, nenGio: null, khungTG: "D" });
  const [chonVe, setChonVe] = useState(null);
  const [soHinhVe, setSoHinhVe] = useState(0);
  const khoaVeRef = useRef(null);
  const daNapVeRef = useRef(""); // "ma|khung" da nap hinh ve (sau khi co nen cua khung do)
  const [lanNapVe, setLanNapVe] = useState(0);
  const [ketQua, setKetQua] = useState({ khoa: "", nen: null, loi: null });
  const [tua, setTua] = useState(null); // { khoa, cut, chay, tocDo }
  const [chonTua, setChonTua] = useState(false); // dang cho bam chon nen bat dau tua lai
  const [thangGia, setThangGia] = useState("thuong"); // thuong | log | pct
  const [ssMa, setSsMa] = useState([]); // cac ma dang so sanh (toi da 4)
  const [ssDuLieu, setSsDuLieu] = useState({}); // "MA|KHUNG" -> nen
  const [ssPct, setSsPct] = useState({}); // % thay doi trong khung nhin: "" = ma chinh, MA = ma so sanh
  const [moSoSanh, setMoSoSanh] = useState(false);
  const [oSoSanh, setOSoSanh] = useState("");
  const [canhBao, setCanhBao] = useState([]); // CANH BAO GIA (lib/canhBaoGia.js) - moi ma, luu o trinh duyet
  const [datCB, setDatCB] = useState(false); // dang cho bam len bieu do de dat muc canh bao
  const [moCB, setMoCB] = useState(false); // mo bang danh sach canh bao
  const [thongBaoCB, setThongBaoCB] = useState(null); // dong chu bao tren bieu do khi gia cham
  const congCuRef = useRef(null);
  const tuaRef = useRef({ moi: false }); // moi = vua chon diem bat dau -> dua khung nhin ve quanh diem do
  const nenDuRef = useRef(null);
  const [lanThu, setLanThu] = useState(0);
  const [chuThich, setChuThich] = useState(null);
  const [kieuMau, setKieuMau] = useState(0); // tang moi khi doi che do sang/toi de ve lai cac phan tu co mau rieng (vd mui ten MUA)

  const khoa = `${ma}|${khungTG}`;
  const noiNgay = laNoiNgay(khungTG);
  const nenDu = ketQua.khoa === khoa ? ketQua.nen : null;
  // TUA LAI NEN (replay, 20/11/2026): cat du lieu tai nen "cut" roi phat tung nen - moi chi bao tinh lai CHI tu du lieu qua khu; tin hieu he thong sau moc bi an.
  const tuaHien = tua && tua.khoa === khoa && nenDu ? tua : null;
  const catTua = tuaHien ? Math.min(tuaHien.cut, nenDu.length - 1) : null;
  const nen = useMemo(() => (nenDu && catTua != null ? nenDu.slice(0, catTua + 1) : nenDu), [nenDu, catTua]);
  // Cap nhat cac ref doc boi su kien (khong ghi ref luc render)
  useEffect(() => {
    dongBoRef.current = dongBo;
    dongBoZoomRef.current = dongBoZoom;
    nenHienRef.current = nen;
    nenDuRef.current = nenDu;
    congCuRef.current = congCu;
  });

  // Nhan khung hinh (zoom / keo) tu cac o khac cung nhom: doi thoi gian -> chi so nen cua o nay.
  useEffect(() => {
    if (!dongBoZoom) return;
    const nhan = (e) => {
      const d = e.detail;
      const s = veRef.current;
      const nen = nenHienRef.current;
      if (!d || d.nhom !== dongBoZoom || d.nguon === idDongBoRef.current || !s || !nen || nen.length < 3) return;
      const soGio = typeof nen[0].t === "number";
      const den = d.gran === "ngay" && soGio ? d.msDen + 86399000 : d.msDen;
      let tu = chiSoTuMs(nen, d.msTu), toi = chiSoTuMs(nen, den);
      if (toi - tu < 8) { const g = (tu + toi) / 2; tu = g - 4; toi = g + 4; } // o khung lon (thang / tuan) khong thu qua it nen
      boQuaDenRef.current = Date.now() + 400;
      try { s.chart.timeScale().setVisibleLogicalRange({ from: tu, to: toi }); } catch {}
    };
    window.addEventListener("cs-dong-bo-zoom", nhan);
    return () => window.removeEventListener("cs-dong-bo-zoom", nhan);
  }, [dongBoZoom]);

  // Nhan con tro tu cac o khac cung nhom (trang Da khung) - xem timNenTheoMoc.
  useEffect(() => {
    if (!dongBo) return;
    const nhan = (e) => {
      const d = e.detail;
      const s = veRef.current;
      if (!d || d.nhom !== dongBo || d.nguon === idDongBoRef.current || !s) return;
      dangDatConTroRef.current = true;
      try {
        const b = d.ms == null ? null : timNenTheoMoc(nenHienRef.current, d.ms, d.gran);
        if (b) {
          s.chart.setCrosshairPosition(b.c, b.t, s.candle);
          setChuThich({ t: chuoiThoiGian(b.t), o: b.o, h: b.h, l: b.l, c: b.c, v: b.v ?? 0 });
        } else {
          s.chart.clearCrosshairPosition();
          setChuThich(null);
        }
      } catch {}
      dangDatConTroRef.current = false;
    };
    window.addEventListener("cs-dong-bo-con", nhan);
    return () => window.removeEventListener("cs-dong-bo-con", nhan);
  }, [dongBo]);
  const dangTai = ketQua.khoa !== khoa;
  const loi = ketQua.khoa === khoa ? ketQua.loi : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- caiDat.thamSo chi doi qua khoaThamSo
  const chiBao = useMemo(() => (nen && nen.length >= 2 ? tinhChiBao(nen, khungTG, caiDat) : null), [nen, khungTG, khoaThamSo]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- caiDat.thamSo chi doi qua khoaThamSo
  const chiBaoPhu = useMemo(() => (nen && nen.length >= 30 ? tinhChiBaoPhu(nen, caiDat) : null), [nen, khoaThamSo]);
  const phanKy = useMemo(() => {
    if (!nen || nen.length < 60) return [];
    return phanKyRSI(nen.map((b) => ({ h: b.h, l: b.l, c: b.c })), rsi(nen.map((b) => b.c), 14), { k: 2 });
  }, [nen]);
  // Phan ky SOM (it dieu kien, co the CHUA du nen xac nhan): ve mau vang, nhan "PK↑?" / "PK↓?" (xem lib/phanKyRSI.js phanKyRSISom)
  const phanKySom = useMemo(() => {
    if (!nen || nen.length < 60) return [];
    return phanKyRSISom(nen.map((b) => ({ h: b.h, l: b.l, c: b.c })), rsi(nen.map((b) => b.c), 14), { k: 2 });
  }, [nen]);
  // MAU HINH GIA (lib/mauHinh.js): nhan dien tren nen dang hien (ngay / tuan); bam chip "Mẫu hình" de tu ve len bieu do, bam tung mau hinh de xem hinh khac.
  const dsMauHinh = useMemo(() => {
    if (!nen || nen.length < 40) return [];
    const khungMH = khungTG === "W" || khungTG === "MO" ? "tuan" : "ngay";
    return [...nhanDienDangHinhThanh(nen, { khung: khungMH }).slice(0, 6), ...nhanDienMauHinh(nen, { khung: khungMH }).slice(0, 12)];
  }, [nen, khungTG]);
  // MAU HINH NEN NHAT (lib/mauHinhNen.js): chip "Mẫu hình nến" danh dau cac nen tren 120 nen gan nhat (bo doji thuong cho do roi).
  const dsNenNhat = useMemo(() => (bat.nenNhat && nen && nen.length >= 25 ? nhanDienMauHinhNen(nen, { tuoiToiDa: 120 }).filter((m) => m.khoa !== "doji") : []), [bat.nenNhat, nen]);
  const [chonMH, setChonMH] = useState({ khoa: "", idx: 0 });
  const idxMH = chonMH.khoa === khoa ? chonMH.idx : 0; // doi ma / khung -> ve lai mau hinh moi nhat
  const mauHinhVe = bat.mauHinh && idxMH >= 0 && idxMH < dsMauHinh.length ? dsMauHinh[idxMH] : null;
  const soPhu = (bat.rsi ? 1 : 0) + (bat.macd ? 1 : 0) + (bat.stoch ? 1 : 0) + (bat.mfi ? 1 : 0) + (bat.adx ? 1 : 0) + (bat.mcdx ? 1 : 0) + (bat.bkr ? 1 : 0) + (bat.hmDE ? 1 : 0) + (bat.hmKDJ ? 1 : 0) + (bat.dongTien ? 1 : 0);
  // Khoa luu hinh ve cua ma + khung hien tai: cap nhat trong effect (khong ghi ref luc render). Dat TRUOC cac effect khoi tao / nap hinh ve nen chay truoc chung trong cung 1 lan cap nhat.
  useEffect(() => {
    khoaVeRef.current = { ma, khoa: `${ma}|${khungTG}` };
    khungVeRef.current = khungTG;
  }, [ma, khungTG]);
  // Che do "hinh moi hien o moi khung": nap tu trinh duyet + luu khi doi
  useEffect(() => {
    queueMicrotask(() => {
      try {
        setVeMoiKhung(localStorage.getItem("cs-ve-moi-khung") === "1");
      } catch {
        /* chan luu tru: giu mac dinh */
      }
    });
  }, []);
  useEffect(() => {
    veMoiKhungRef.current = veMoiKhung;
  }, [veMoiKhung]);
  const doiVeMoiKhung = () =>
    setVeMoiKhung((v) => {
      try {
        localStorage.setItem("cs-ve-moi-khung", v ? "0" : "1");
      } catch {
        /* khong luu duoc: chi doi trong phien */
      }
      return !v;
    });
  // Doi hinh dang chon: chi khung nay <-> moi khung
  const doiKhungHinhChon = () => {
    const lop = veRef.current?.lopVe;
    const h = lop?.hinh.find((x) => x.id === lop.chon);
    if (!h) return;
    h.khung = h.khung === "*" ? khungTG : "*";
    setChonVeMoiKhung(h.khung === "*");
    lop._xong();
  };
  const caoGoc = layDayManHinh ? Math.max(chieuCao, caoManHinh - truCao) : chieuCao; // trang Bieu do: bieu do cao toi sat day man hinh thay vi co dinh (truCao = phan dau trang + thanh cong cu phia tren bieu do)
  const chieuCaoTong = caoGoc + soPhu * CHIEU_CAO_PHU;

  useEffect(() => {
    const doi = () => setCaoManHinh(window.innerHeight);
    doi();
    window.addEventListener("resize", doi);
    return () => window.removeEventListener("resize", doi);
  }, []);
  useEffect(() => {
    if (!toanMH) return;
    const truoc = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const phim = (e) => {
      if (e.key === "Escape" && congCu === null) setToanMH(false);
    };
    window.addEventListener("keydown", phim);
    return () => {
      document.body.style.overflow = truoc;
      window.removeEventListener("keydown", phim);
    };
  }, [toanMH, congCu]);

  // 1. Tao bieu do 1 lan.
  useEffect(() => {
    const m = mauTheoGiaoDien();
    const chart = createChart(khungRef.current, {
      autoSize: true,
      layout: { background: { type: "solid", color: m.nen }, textColor: m.mo, fontFamily: "'Open Sans', sans-serif", fontSize: 11 },
      grid: { vertLines: { color: m.luoi }, horzLines: { color: m.luoi } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: m.vien, scaleMargins: { top: 0.06, bottom: 0.22 } },
      timeScale: { borderColor: m.vien, rightOffset: 4, minBarSpacing: 2 },
      // Gia kieu Viet Nam tren truc gia / nhan gia (25,50 thay vi 25.50).
      localization: { locale: "vi-VN", priceFormatter: (p) => soVN(p, 2, true), percentageFormatter: (p) => `${p > 0 ? "+" : ""}${soVN(p, 2, true)}%` },
    });
    // Series AN (gia dong cua) tao DAU TIEN: lam goc cho thang % (xem effect THANG GIA).
    const goc = chart.addSeries(LineSeries, { visible: false, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false });
    // WATERMARK (10/11/2026, kieu TradingView): "FPT, 1D" to + ten cong ty nho ben duoi, giua bieu do, mo; doi chu theo ma / khung o effect rieng ben duoi. Mau trung tinh trong suot de hop ca sang / toi.
    const thuyVan = createTextWatermark(chart.panes()[0], {
      horzAlign: "center",
      vertAlign: "center",
      lines: [{ text: "", color: "rgba(140,140,160,0.14)", fontSize: 96, fontStyle: "bold" }],
    });
    const dong = (mau, rong = 1, them = {}) =>
      chart.addSeries(LineSeries, { color: mau, lineWidth: rong, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false, ...them });

    const may = new DaiMay();
    const canBang = new DaiMay({ mauTren: "rgba(167,139,250,0.10)", mauDuoi: "rgba(167,139,250,0.10)" });
    const bbBand = new DaiMay({ mauTren: MAU_BB_NEN, mauDuoi: MAU_BB_NEN }); // to mau vung giua dai tren / dai duoi Bollinger (kieu TradingView)
    const daiGia = new DaiGia();
    const vachNgay = new VachNgay();
    const dinhDang = { type: "price", precision: 2, minMove: 0.01 };

    const s = {
      chart,
      goc,
      thuyVan,
      may,
      canBang,
      bbBand,
      daiGia,
      vachNgay,
      cb1: dong(MAU.cb1, 1, { lineStyle: LineStyle.Dashed }),
      cb2: dong(MAU.cb2, 1, { lineStyle: LineStyle.Dashed }),
      ma20: dong(MAU.ma20),
      ma50: dong(MAU.ma50),
      ma200: dong(m.ma200),
      spanA: dong(MAU.spanA),
      spanB: dong(MAU.spanB),
      chikou: dong(MAU.chikou, 1, { lineStyle: LineStyle.Dotted }),
      tenkan: dong(MAU.tenkan),
      kijun: dong(MAU.kijun, 2),
      // Duong Ichimoku TUONG LAI dang cham tron (kieu chi bao Future Ichimoku Lines): chi cham, khong noi duong
      ttTenkan: dong(MAU.tenkan, 1, CHAM),
      ttKijun: dong(MAU.kijun, 1, CHAM),
      ttSpanA: dong(MAU.spanA, 1, CHAM),
      ttSpanB: dong(MAU.spanB, 1, CHAM),
      ttCb1: dong(MAU.cb1, 1, CHAM),
      ttCb2: dong(MAU.cb2, 1, CHAM),
      ema9: dong("#22D3EE", 1, { visible: false }),
      ema21: dong("#0EA5E9", 1, { visible: false }),
      bbTren: dong(MAU_BB, 2, { visible: false }),
      bbMid: dong(MAU_BB, 1, { lineStyle: LineStyle.Dashed, visible: false }),
      bbDuoi: dong(MAU_BB, 2, { visible: false }),
      vwap: dong(MAU_VWAP, 2, { visible: false }),
      mlstDuong: dong(MLST_LEN, 2, { visible: false }),
      phu: [], // series cua cac chi bao phu (RSI / MACD / Stochastic) dang ve o cua so rieng - tao lai moi khi bat / tat
      vol: chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "vol", lastValueVisible: false, priceLineVisible: false }),
      candle: chart.addSeries(CandlestickSeries, {
        upColor: m.xanh,
        downColor: m.do,
        borderVisible: false,
        wickUpColor: m.xanh,
        wickDownColor: m.do,
        priceFormat: dinhDang,
      }),
    };
    s.vol.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    s.spanA.attachPrimitive(may);
    s.cb1.attachPrimitive(canBang);
    s.bbTren.attachPrimitive(bbBand);
    s.candle.attachPrimitive(daiGia);
    s.candle.attachPrimitive(vachNgay);
    s.markers = createSeriesMarkers(s.candle, []);
    s.markersPK = createSeriesMarkers(s.candle, []);
    s.markersMH = createSeriesMarkers(s.candle, []); // diem chinh cua mau hinh gia dang ve
    s.markersNen = createSeriesMarkers(s.candle, []); // mau hinh NEN NHAT (chip "Mẫu hình nến")
    s.markersBanker = createSeriesMarkers(s.candle, []); // nhan TP / SL cua chi bao Dong tien (Banker Fund Flow) tren bieu do gia
    s.markersSK = createSeriesMarkers(s.candle, []); // diem B (mua phuc hoi) + diem bat day
    s.markersST = createSeriesMarkers(s.candle, []); // mui ten doi chieu ML Adaptive SuperTrend
    s.markersHM = createSeriesMarkers(s.candle, []); // nhan cua bo chi bao Homily (强势信号, 弱势抄底, 操盘王, Taichi, 进出)
    s.markersTV = createSeriesMarkers(s.candle, []); // nhan Liquidity Trap Radar + AVPT
    s.tv = []; // series cua Liquidity Trap / AVPT tren cua so gia (duong AVWAP, dai, muc lenh) - tao lai moi khi bat / tat
    s.tvDai = new DaiMay({ mauTren: "rgba(167,139,250,0.12)", mauDuoi: "rgba(167,139,250,0.12)" }); // dai gia tri AVWAP +- sigma
    s.tvDai.datHien(false);
    s.candle.attachPrimitive(s.tvDai);
    s.homily = []; // series cua cac chi bao Homily tren cua so gia (TE, 进出, 彩虹, 通道) - tao lai moi khi bat / tat
    s.homilyDai = new DaiMay({ mauTren: "rgba(239,68,68,0.14)", mauDuoi: "rgba(34,197,94,0.14)" }); // dai 进出: do khi EMA8 > EMA20 (lam mua), xanh khi nguoc lai
    s.homilyDai.datHien(false);
    s.candle.attachPrimitive(s.homilyDai);
    s.mlstDai = new DaiMay({ mauTren: "rgba(34,197,94,0.10)", mauDuoi: "rgba(239,68,68,0.10)" });
    s.mlstDai.datHien(false);
    s.mlstSo = new NhanSo();
    s.mlstSo.datHien(false);
    s.candle.attachPrimitive(s.mlstDai);
    s.candle.attachPrimitive(s.mlstSo);
    s.footprint = new Footprint();
    s.footprint.datMauChu(m.chu);
    s.candle.attachPrimitive(s.footprint);
    s.mh = { series: [], vach: [] }; // cac duong / vach gia cua mau hinh gia dang ve (xoa khi doi mau hinh)
    // Lop ke ve (canvas phu len bieu do): hinh luu o localStorage theo ma + khung thoi gian.
    s.lopVe = new LopVe({
      khung: khungRef.current,
      goc: rootRef.current,
      chart,
      series: s.candle,
      onThayDoi: (ds0) => {
        // Hinh moi ve chua co truong khung -> gan theo che do hien tai (ghi ca vao lop ve de lan luu sau giu nguyen)
        const khungMoi = veMoiKhungRef.current ? "*" : khungVeRef.current;
        for (const h of s.lopVe?.hinh ?? []) if (!h.khung) h.khung = khungMoi;
        const ds = ds0.map((h) => (h.khung ? h : { ...h, khung: khungMoi }));
        setSoHinhVe(ds.length);
        setCoFrvp(ds.some((h) => h.loai === "frvp"));
        const nenH = nenDuRef.current; // nen DAY DU (khong bi cat khi dang tua lai)
        const k = khoaVeRef.current;
        if (!k || daNapVeRef.current !== k.khoa || !nenH?.length) return;
        try {
          localStorage.setItem(khoaLuuChung(k.ma), JSON.stringify([...hinhKhungKhacRef.current, ...doiDiemHinh(ds, (d) => ({ ...d, ms: Math.round(msTuChiSo(nenH, d.i)) }))]));
          window.dispatchEvent(new CustomEvent("cs-ve-doi", { detail: { ma: k.ma, nguon: idDongBoRef.current } })); // o khac (trang Da khung) cung ma nap lai
        } catch {
          /* tren trinh duyet an danh / chan luu tru: hinh ve chi ton tai trong phien */
        }
      },
      onCongCu: (c) => setCongCuState(c),
      onChon: (id) => {
        setChonVe(id);
        const h = id ? s.lopVe?.hinh.find((x) => x.id === id) : null;
        setChonVeMoiKhung(!!h && (h.khung ?? (veMoiKhungRef.current ? "*" : "")) === "*");
      },
      onLichSu: (t) => setLichSuVe(t),
    });
    s.lopVe.datMauGiaoDien({ mo: m.mo, nen: m.nen });
    veRef.current = s;

    chart.subscribeCrosshairMove((p) => {
      if (dongBoRef.current && !dangDatConTroRef.current) {
        const ct = p.time && p.point ? { ms: msNen(p.time), gran: typeof p.time === "number" ? "gio" : "ngay" } : !p.point ? { ms: null, gran: "ngay" } : null;
        if (ct) window.dispatchEvent(new CustomEvent("cs-dong-bo-con", { detail: { nhom: dongBoRef.current, nguon: idDongBoRef.current, ...ct } }));
      }
      if (!p.time) return setChuThich(null);
      const c = p.seriesData.get(s.candle);
      const v = p.seriesData.get(s.vol);
      setChuThich(c ? { t: chuoiThoiGian(p.time), o: c.open, h: c.high, l: c.low, c: c.close, v: v?.value ?? 0 } : null);
    });

    const khungVe = khungRef.current;
    const batTT = () => { tuongTacDenRef.current = Infinity; };
    const tatTT = () => { if (tuongTacDenRef.current === Infinity) tuongTacDenRef.current = Date.now() + 400; };
    const cuonTT = () => { if (tuongTacDenRef.current !== Infinity) tuongTacDenRef.current = Date.now() + 500; };
    khungVe.addEventListener("pointerdown", batTT, true);
    khungVe.addEventListener("wheel", cuonTT, { passive: true, capture: true });
    khungVe.addEventListener("touchmove", cuonTT, { passive: true, capture: true });
    window.addEventListener("pointerup", tatTT);
    window.addEventListener("pointercancel", tatTT);
    const khiDoiKhung = (r) => {
      if (!dongBoZoomRef.current || !r || Date.now() > tuongTacDenRef.current || Date.now() < boQuaDenRef.current) return;
      const nen = nenHienRef.current;
      if (!nen || nen.length < 3) return;
      window.dispatchEvent(new CustomEvent("cs-dong-bo-zoom", { detail: { nhom: dongBoZoomRef.current, nguon: idDongBoRef.current, msTu: msTuChiSo(nen, r.from), msDen: msTuChiSo(nen, r.to), gran: typeof nen[0].t === "number" ? "gio" : "ngay" } }));
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(khiDoiKhung);

    const theoDoiMau = new MutationObserver(() => {
      apDungMau(s);
      setKieuMau((x) => x + 1);
    });
    theoDoiMau.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      khungVe.removeEventListener("pointerdown", batTT, true);
      khungVe.removeEventListener("wheel", cuonTT, true);
      khungVe.removeEventListener("touchmove", cuonTT, true);
      window.removeEventListener("pointerup", tatTT);
      window.removeEventListener("pointercancel", tatTT);
      theoDoiMau.disconnect();
      veRef.current = null;
      s.lopVe.huyLop();
      chart.remove();
    };
  }, []);

  // 1a. Watermark: doi chu khi doi ma / khung / ten. Dong 1 = "MA, khung" (co tren man hinh nho thi nho hon), dong 2 = ten cong ty rut gon.
  const tenWm = tenRutGon(tenMa);
  useEffect(() => {
    const s = veRef.current;
    if (!s?.thuyVan) return;
    const nho = (khungRef.current?.clientWidth ?? 800) < 560;
    s.thuyVan.applyOptions({
      lines: [
        { text: `${ma}, ${NHAN_KHUNG_MO[khungTG] ?? "1D"}`, color: "rgba(140,140,160,0.14)", fontSize: nho ? 48 : 96, fontStyle: "bold" },
        ...(tenWm ? [{ text: tenWm, color: "rgba(140,140,160,0.14)", fontSize: nho ? 20 : 40 }] : []),
      ],
    });
  }, [ma, khungTG, tenWm]);

  // 1b. Nap hinh ve cua ma (dung chung moi khung) khi da co nen cua khung hien tai: doi ms -> chi so nen. Hinh kieu cu cua khung nay chuyen sang kho chung roi xoa.
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    if (!nenDu?.length) {
      if (daNapVeRef.current !== khoa) {
        daNapVeRef.current = "";
        s.lopVe.datHinh([]);
        setSoHinhVe(0);
        setCoFrvp(false);
        setChonVe(null);
      }
      return;
    }
    if (daNapVeRef.current === khoa) return;
    let chung = docLuu(khoaLuuChung(ma)) ?? [];
    const cu = docLuu(khoaLuu(ma, khungTG));
    if (cu?.length) {
      chung = [...chung, ...doiDiemHinh(cu, (d) => ({ ...d, ms: Math.round(msTuChiSo(nenDu, d.i)) }))];
      try {
        localStorage.setItem(khoaLuuChung(ma), JSON.stringify(chung));
        localStorage.removeItem(khoaLuu(ma, khungTG));
      } catch {
        /* khong luu duoc: van hien */
      }
    }
    // Hinh cu (truoc khi co che do theo khung) khong co truong khung -> coi la "moi khung" nhu truoc. Hinh cua khung khac giu rieng, khong ve.
    chung = chung.map((h) => (h.khung ? h : { ...h, khung: "*" }));
    hinhKhungKhacRef.current = chung.filter((h) => h.khung !== "*" && h.khung !== khungTG);
    const ds = doiDiemHinh(chung.filter((h) => h.khung === "*" || h.khung === khungTG), (d) => (typeof d.ms === "number" ? { ...d, i: chiSoTuMs(nenDu, d.ms) } : d));
    daNapVeRef.current = khoa;
    s.lopVe.datHinh(ds);
    setSoHinhVe(ds.length);
    setCoFrvp(ds.some((h) => h.loai === "frvp"));
    setChonVe(null);
  }, [ma, khungTG, khoa, nenDu, lanNapVe]);
  // O khac cung ma vua sua hinh (trang Da khung) -> nap lai
  useEffect(() => {
    const nghe = (e) => {
      if (e.detail?.ma !== ma || e.detail?.nguon === idDongBoRef.current) return;
      daNapVeRef.current = "";
      setLanNapVe((x) => x + 1);
    };
    window.addEventListener("cs-ve-doi", nghe);
    return () => window.removeEventListener("cs-ve-doi", nghe);
  }, [ma]);

  // 1c. Dong bo cong cu / mau / hit gia voi lop ve.
  useEffect(() => {
    veRef.current?.lopVe.datCongCu(congCu);
  }, [congCu]);
  useEffect(() => {
    veRef.current?.lopVe.datMau(mauVe);
  }, [mauVe]);
  useEffect(() => {
    veRef.current?.lopVe.datHitGia(hitGia);
  }, [hitGia]);
  useEffect(() => {
    veRef.current?.lopVe.datGiu(giuCongCu);
  }, [giuCongCu]);

  // 1d. VOLUME PROFILE. Nen 1 gio chi tai khi can (bat chi bao, dang chon cong cu, hoac ma nay da co hinh vung chon); loi / khong co thi dung nen cua bieu do.
  const canNenGio = !noiNgay && (bat.vp || bat.htkc || congCu === "frvp" || coFrvp);
  useEffect(() => {
    if (!canNenGio || nenGio.ma === ma) return;
    let huy = false;
    fetch(`/api/gia-gio?ma=${encodeURIComponent(ma)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!huy) setNenGio({ ma, nen: j.trangThai === "ok" ? chuanBiNenGio(j.nen) : [] });
      })
      .catch(() => {
        if (!huy) setNenGio({ ma, nen: [] });
      });
    return () => {
      huy = true;
    };
  }, [canNenGio, ma, nenGio.ma]);
  // Ham tinh ho so cho khoang nen [i1, i2] cua bieu do (chi so logic): doi ra khoang ngay roi chon nen 1 gio neu co.
  const nenGioCuaMa = nenGio.ma === ma ? nenGio.nen : null;
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    duLieuHoSoRef.current = { nen, nenGio: nenGioCuaMa, khungTG };
    const tinh = (i1, i2, soHang = 48) => {
      const d = duLieuHoSoRef.current;
      if (!d.nen || !d.nen.length || typeof d.nen[0].t === "number") return null; // Volume Profile chi cho khung ngay / tuan
      const a = Math.max(0, Math.ceil(Math.min(i1, i2))), b = Math.min(d.nen.length - 1, Math.floor(Math.max(i1, i2)));
      if (b < a) return null;
      const tuan = d.khungTG === "W";
      const thang = d.khungTG === "MO";
      const denNgay = thang
        ? new Date(Date.UTC(Number(d.nen[b].t.slice(0, 4)), Number(d.nen[b].t.slice(5, 7)), 0)).toISOString().slice(0, 10)
        : tuan ? new Date(Date.parse(`${d.nen[b].t}T00:00:00Z`) + 6 * 86400e3).toISOString().slice(0, 10) : d.nen[b].t;
      const chon = chonNenChoHoSo({ nenBieuDo: d.nen, nenGio: d.nenGio, tuNgay: d.nen[a].t, denNgay, soNgayMoiNen: thang ? 22 : tuan ? 7 : 1 });
      const hs = tinhHoSoKhoiLuong(chon.nen, { soHang });
      return hs ? { ...hs, nguon: chon.nguon } : null;
    };
    s.tinhHoSo = tinh;
    s.lopVe.datNguonHoSo((i1, i2) => tinh(i1, i2, 48));
    if (!bat.vp || noiNgay) {
      s.lopVe.datHoSo(null);
      return;
    }
    // Ho so cua VUNG DANG XEM: tinh lai (co tre 120 ms) moi khi keo / thu phong
    let hen = null;
    const capNhat = () => {
      const r = s.chart.timeScale().getVisibleLogicalRange();
      if (!r) return;
      const cao = s.chart.paneSize ? s.chart.paneSize(0).height : 400;
      s.lopVe.datHoSo(tinh(r.from, r.to, Math.max(30, Math.min(120, Math.round(cao / 5)))));
    };
    const khiDoi = () => {
      clearTimeout(hen);
      hen = setTimeout(capNhat, 120);
    };
    capNhat();
    s.chart.timeScale().subscribeVisibleLogicalRangeChange(khiDoi);
    return () => {
      clearTimeout(hen);
      s.chart.timeScale().unsubscribeVisibleLogicalRangeChange(khiDoi);
    };
  }, [bat.vp, nen, nenGioCuaMa, khungTG, noiNgay]);

  // 1e. HO TRO / KHANG CU THAM KHAO theo khoi luong: toi da 2 dinh khoi luong gan gia nhat o moi phia, ve thanh duong gia co nhan tren truc.
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    for (const d of s.duongHTKC || []) {
      try {
        s.candle.removePriceLine(d);
      } catch {
        /* da bi go cung bieu do */
      }
    }
    s.duongHTKC = [];
    if (!bat.htkc || noiNgay || !nen || nen.length < 30 || !s.tinhHoSo) return;
    const n = nen.length;
    const hs = s.tinhHoSo(Math.max(0, n - (SO_NEN_HTKC[khungTG] ?? 120)), n - 1, 100);
    if (!hs) return;
    const { hoTro, khangCu } = chonHoTroKhangCu(timDinhKhoiLuong(hs), nen[n - 1].c);
    const ve = (ds, mau, nhan) => {
      for (const d of ds) s.duongHTKC.push(s.candle.createPriceLine({ price: d.gia, color: mau, lineWidth: d.doManh >= 0.6 ? 2 : 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: nhan }));
    };
    ve(hoTro, MAU_HO_TRO, "Hỗ trợ KL");
    ve(khangCu, MAU_KHANG_CU, "Kháng cự KL");
  }, [bat.htkc, nen, nenGioCuaMa, khungTG, noiNgay]);

  // 2. Tai gia lich su khi doi ma / khung thoi gian, hoac lam moi (lanThu, xem 2b) - khoa KHONG
  // gom lanThu de lam moi trong luc da co du lieu cu khong lam bieu do nhap nhay ve trang thai "dang tai".
  useEffect(() => {
    let huy = false;
    const khoaLucGoi = `${ma}|${khungTG}`;
    fetch(`/api/gia-lich-su?ma=${encodeURIComponent(ma)}&kt=${khungTG}`)
      .then((r) => r.json())
      .then((j) => {
        if (huy) return;
        if (j.trangThai === "ok" && Array.isArray(j.nen) && j.nen.length >= 2) setKetQua({ khoa: khoaLucGoi, nen: j.nen, loi: null });
        // Lam moi ngam (lanThu > 0) that bai nhung da co du lieu cu cung ma/khung -> giu nguyen bieu
        // do dang hien, khong thay bang thong bao loi (chi 1 lan lam moi bi lo, se tu thu lai sau 30s).
        else
          setKetQua((cu) => (cu.khoa === khoaLucGoi && cu.nen ? cu : { khoa: khoaLucGoi, nen: null, loi: j.thongBao || "Chưa có dữ liệu giá cho mã này." }));
      })
      .catch(() => {
        if (huy) return;
        setKetQua((cu) => (cu.khoa === khoaLucGoi && cu.nen ? cu : { khoa: khoaLucGoi, nen: null, loi: "Không kết nối được máy chủ." }));
      });
    return () => {
      huy = true;
    };
  }, [ma, khungTG, lanThu]);

  // 2a. Tai diem B + diem bat day cua ma (1 lan moi ma; khach / chua duyet nhan danh sach rong).
  useEffect(() => {
    let huy = false;
    fetch(`/api/diem-bieu-do?ma=${encodeURIComponent(ma)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!huy) setDiemSK({ ma, b: Array.isArray(j.b) ? j.b : [], batDay: Array.isArray(j.batDay) ? j.batDay : [] });
      })
      .catch(() => {
        if (!huy) setDiemSK({ ma, b: [], batDay: [] });
      });
    return () => {
      huy = true;
    };
  }, [ma]);

  // 2b. Trong phien giao dich: tu dong lam moi nen "hom nay" moi 30 giay (khung Ngay - nguon
  // DNSE tra ve nen hom nay dang chay, khong phai da chot) - khung Tuan khong can vi khong doi trong ngay.
  useEffect(() => {
    if (khungTG === "W" || khungTG === "MO") return;
    const hen = setInterval(() => {
      if (dangTrongPhienGiaoDich() && document.visibilityState === "visible") setLanThu((x) => x + 1);
    }, 30_000);
    return () => clearInterval(hen);
  }, [khungTG]);

  // 3. Do du lieu + chi bao len bieu do.
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    if (!chiBao) {
      for (const k of ["goc", "candle", "vol", "tenkan", "kijun", "spanA", "spanB", "chikou", "ttTenkan", "ttKijun", "ttSpanA", "ttSpanB", "ttCb1", "ttCb2", "cb1", "cb2", "ma20", "ma50", "ma200"]) s[k].setData([]);
      s.may.datDuLieu([]);
      s.canBang.datDuLieu([]);
      s.vachNgay.datDuLieu([]);
      return;
    }
    s.goc.setData(nen.map((b) => ({ time: b.t, value: b.c })));
    s.candle.setData(nen.map((b) => ({ time: b.t, open: b.o, high: b.h, low: b.l, close: b.c })));
    s.vol.setData(nen.map((b) => ({ time: b.t, value: b.v, color: b.c >= b.o ? "rgba(34,197,94,0.45)" : "rgba(239,68,68,0.45)" })));
    for (const k of ["tenkan", "kijun", "spanA", "spanB", "chikou", "ttTenkan", "ttKijun", "ttSpanA", "ttSpanB", "ttCb1", "ttCb2", "cb1", "cb2", "ma20", "ma50", "ma200"]) s[k].setData(chiBao[k]);
    s.may.datDuLieu(chiBao.may);
    s.canBang.datDuLieu(chiBao.cbBand);
    // vach chia phien (khung trong ngay): nen dau moi ngay + nhan "T2 10/11"
    const moc = [];
    if (typeof nen[0].t === "number") {
      const p = (x) => String(x).padStart(2, "0");
      for (let i = 1; i < nen.length; i++) {
        if (Math.floor(nen[i].t / 86400) === Math.floor(nen[i - 1].t / 86400)) continue;
        const d = new Date(nen[i].t * 1000);
        const thu = d.getUTCDay();
        moc.push({ time: nen[i].t, truoc: nen[i - 1].t, nhan: `${thu === 0 ? "CN" : "T" + (thu + 1)} ${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}` });
      }
    }
    s.vachNgay.datDuLieu(moc);
    s.lopVe.datNen(nen);
    const ts = s.chart.timeScale();
    if (catTua != null && tuaRef.current.moi) {
      tuaRef.current.moi = false;
      ts.setVisibleLogicalRange({ from: chiBao.n - 110, to: chiBao.n + 40 });
    } else if (catTua != null) {
      // dang phat: nen moi vuot 3/4 khung nhin thi truot theo 1 nen
      const r = ts.getVisibleLogicalRange();
      if (r && chiBao.n - 1 > r.from + 0.75 * (r.to - r.from)) ts.setVisibleLogicalRange({ from: r.from + 1, to: r.to + 1 });
    } else ts.setVisibleLogicalRange({ from: Math.max(-2, chiBao.n - 150), to: chiBao.n + (chiBao.dich ?? THAM_SO_MAC_DINH.dichMay) + SO_BUOC_TUONG_LAI.spanB + 2 });
  }, [chiBao, nen, catTua]);

  // 3a'. TUA LAI: bam chon nen bat dau (che do chonTua) + tu phat theo toc do.
  useEffect(() => {
    const s = veRef.current;
    if (!s || !chonTua) return;
    const bam = (p) => {
      if (p.logical == null) return;
      const max = (nenDuRef.current?.length ?? 0) - 1;
      if (max < 40) return;
      tuaRef.current.moi = true;
      setTua({ khoa, cut: Math.max(30, Math.min(max - 1, Math.round(p.logical))), chay: false, tocDo: 2 });
      setChonTua(false);
    };
    s.chart.subscribeClick(bam);
    return () => s.chart.unsubscribeClick(bam);
  }, [chonTua, khoa]);
  const tuaChay = !!tuaHien?.chay;
  const tocDoTua = tuaHien?.tocDo ?? 2;
  useEffect(() => {
    if (!tuaChay) return;
    const id = setInterval(() => {
      setTua((t) => {
        if (!t) return t;
        const max = (nenDuRef.current?.length ?? 0) - 1;
        return t.cut >= max ? { ...t, chay: false } : { ...t, cut: t.cut + 1 };
      });
    }, 1000 / tocDoTua);
    return () => clearInterval(id);
  }, [tuaChay, tocDoTua]);

  // 3a''. SO SANH NHIEU MA: tai nen cac ma so sanh theo khung hien tai.
  useEffect(() => {
    const thieu = ssMa.filter((m) => !ssDuLieu[`${m}|${khungTG}`]);
    if (!thieu.length) return;
    let huy = false;
    Promise.all(
      thieu.map((m) =>
        fetch(`/api/gia-lich-su?ma=${encodeURIComponent(m)}&kt=${khungTG}`)
          .then((r) => r.json())
          .then((j) => [m, j.trangThai === "ok" && Array.isArray(j.nen) ? j.nen : []])
          .catch(() => [m, []])
      )
    ).then((ds) => {
      if (huy) return;
      setSsDuLieu((cu) => {
        const o = { ...cu };
        for (const [m, n] of ds) o[`${m}|${khungTG}`] = n;
        return o;
      });
    });
    return () => {
      huy = true;
    };
  }, [ssMa, khungTG, ssDuLieu]);
  // Ve duong so sanh: chi lay nen co CUNG thoi gian voi ma chinh (khong chen them moc thoi gian -> khong lech chi so nen cua hinh ve / dong bo), quy ve gia dong cua ma chinh o nen dau khung nhin.
  useEffect(() => {
    const s = veRef.current;
    if (!s || !nen?.length || !ssMa.length) return;
    const coThoiGian = new Set(nen.map((b) => b.t));
    const ds = ssMa.map((m, k) => ({
      m,
      n: (ssDuLieu[`${m}|${khungTG}`] || []).filter((b) => coThoiGian.has(b.t) && b.c > 0),
      se: s.chart.addSeries(LineSeries, { color: MAU_SO_SANH[k % MAU_SO_SANH.length], lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }),
    }));
    s.ssSeries = ds;
    const ts = s.chart.timeScale();
    let hen = null;
    const capNhat = () => {
      const r = ts.getVisibleLogicalRange();
      const i0 = Math.max(0, Math.min(nen.length - 1, Math.ceil(r?.from ?? 0)));
      const i1 = Math.max(i0, Math.min(nen.length - 1, Math.floor(r?.to ?? nen.length - 1)));
      const t0 = msNen(nen[i0].t), t1 = msNen(nen[i1].t), goc = nen[i0].c;
      const pct = { "": (nen[i1].c / goc - 1) * 100 };
      for (const x of ds) {
        let j0 = -1, j1 = -1;
        for (let j = 0; j < x.n.length; j++) {
          const t = msNen(x.n[j].t);
          if (t > t1) break;
          if (t <= t0) j0 = j;
          j1 = j;
        }
        if (j0 < 0) j0 = 0;
        const hs = x.n.length ? goc / x.n[j0].c : 1;
        x.se.setData(x.n.map((b) => ({ time: b.t, value: b.c * hs })));
        pct[x.m] = x.n.length && j1 >= 0 ? (x.n[j1].c / x.n[j0].c - 1) * 100 : null;
      }
      setSsPct(pct);
    };
    const khiDoi = () => {
      clearTimeout(hen);
      hen = setTimeout(capNhat, 120);
    };
    hen = setTimeout(capNhat, 0);
    ts.subscribeVisibleLogicalRangeChange(khiDoi);
    return () => {
      clearTimeout(hen);
      ts.unsubscribeVisibleLogicalRangeChange(khiDoi);
      for (const x of ds) s.chart.removeSeries(x.se);
      s.ssSeries = [];
    };
  }, [ssMa, ssDuLieu, nen, khungTG]);
  // THANG GIA: Log / % dung che do co san cua thu vien cho truc gia chinh (cua so RSI / MACD... giu so that). Che do % lay 1 GOC CHUNG cho ca truc = gia tri dau khung nhin
  // cua series duoc them DAU TIEN -> s.goc (series an, gia dong cua) duoc tao truoc moi series khac nen goc = gia dong cua nen dau khung nhin; Ichimoku / MA / duong so sanh khop nhau.
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    s.chart.priceScale("right").applyOptions({ mode: thangGia === "log" ? PriceScaleMode.Logarithmic : thangGia === "pct" ? PriceScaleMode.Percentage : PriceScaleMode.Normal });
  }, [thangGia]);

  // 3d. CANH BAO GIA: nap danh sach (trinh duyet nay) + nghe thay doi tu o / tab khac.
  useEffect(() => {
    const nap = () => setCanhBao(docCanhBao());
    queueMicrotask(nap);
    const nghe = (e) => {
      if (!e.key || e.key === KHOA_CANH_BAO) nap();
    };
    window.addEventListener(SU_KIEN_CANH_BAO, nap);
    window.addEventListener("storage", nghe);
    return () => {
      window.removeEventListener(SU_KIEN_CANH_BAO, nap);
      window.removeEventListener("storage", nghe);
    };
  }, []);
  // Ve duong canh bao cua ma dang xem (duong ngang net dut vang + nhan tren truc gia; da bao = xam).
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    const dong = canhBao
      .filter((c) => c.ma === ma)
      .map((c) => ({ id: c.id, line: s.candle.createPriceLine({ price: c.gia, color: c.daBao ? "#94A3B8" : "#F59E0B", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: c.daBao ? "đã báo" : c.huong === "len" ? "báo khi ≥" : "báo khi ≤" }) }));
    s.dongCB = dong;
    return () => {
      for (const d of dong) {
        try {
          s.candle.removePriceLine(d.line);
        } catch {
          /* bieu do da huy */
        }
      }
      s.dongCB = [];
    };
  }, [canhBao, ma]);
  // KEO THA duong canh bao: bam trong 6 px quanh duong (khong dang dung cong cu ve) -> keo len / xuong, tha thi luu gia moi (huong tinh lai theo gia hien tai, bo trang thai da bao).
  useEffect(() => {
    const el = khungRef.current;
    const s = veRef.current;
    if (!el || !s) return;
    let keo = null;
    const yCua = (e) => e.clientY - el.getBoundingClientRect().top;
    const gan = (y) => {
      for (const d of s.dongCB ?? []) {
        const yy = s.candle.priceToCoordinate(d.line.options().price);
        if (yy != null && Math.abs(yy - y) <= 6) return d;
      }
      return null;
    };
    const xuong = (e) => {
      if (congCuRef.current || e.button > 0) return;
      const d = gan(yCua(e));
      if (!d) return;
      keo = d;
      e.preventDefault();
      e.stopPropagation();
    };
    const di = (e) => {
      if (!keo) return;
      e.preventDefault();
      e.stopPropagation();
      const p = s.candle.coordinateToPrice(yCua(e));
      if (p != null) keo.line.applyOptions({ price: Math.round(p * 100) / 100 });
    };
    const len = (e) => {
      if (!keo) return;
      e.stopPropagation();
      const gia = keo.line.options().price;
      const id = keo.id;
      keo = null;
      const giaHT = nenDuRef.current?.at(-1)?.c;
      luuCanhBao(docCanhBao().map((c) => (c.id === id ? { ...c, gia, huong: giaHT != null && gia < giaHT ? "xuong" : "len", daBao: false, luc: null } : c)));
    };
    el.addEventListener("pointerdown", xuong, true);
    el.addEventListener("pointermove", di, true);
    window.addEventListener("pointerup", len, true);
    return () => {
      el.removeEventListener("pointerdown", xuong, true);
      el.removeEventListener("pointermove", di, true);
      window.removeEventListener("pointerup", len, true);
    };
  }, []);
  // Dat canh bao: bam len bieu do tai muc gia muon bao.
  useEffect(() => {
    const s = veRef.current;
    if (!s || !datCB) return;
    const bam = (p) => {
      if (!p.point) return;
      const g = s.candle.coordinateToPrice(p.point.y);
      if (g == null) return;
      luuCanhBao([...docCanhBao(), taoCanhBao(ma, Math.round(g * 100) / 100, nenDuRef.current?.at(-1)?.c)]);
      setDatCB(false);
      if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission().catch(() => {});
    };
    s.chart.subscribeClick(bam);
    return () => s.chart.unsubscribeClick(bam);
  }, [datCB, ma]);
  // Kiem tra: ma dang xem theo gia moi nhat cua bieu do (lam moi ~30 giay trong phien); cac ma KHAC co canh bao theo /api/bang-gia moi 60 giay trong phien.
  useEffect(() => {
    const g = nenDu?.at(-1)?.c;
    if (g == null || !canhBao.some((c) => c.ma === ma && !c.daBao)) return;
    const { moi, vuaBao } = kiemTraCanhBao(docCanhBao(), { [ma]: g });
    if (!vuaBao.length) return;
    queueMicrotask(() => {
      luuCanhBao(moi);
      baoChamGia(vuaBao, setThongBaoCB);
    });
  }, [nenDu, canhBao, ma]);
  useEffect(() => {
    const kiem = async () => {
      const ds = [...new Set(docCanhBao().filter((c) => !c.daBao && c.ma !== ma).map((c) => c.ma))];
      if (!ds.length || !dangTrongPhienGiaoDich()) return;
      try {
        const j = await fetch(`/api/bang-gia?ma=${ds.slice(0, 80).join(",")}`).then((r) => r.json());
        const gia = Object.fromEntries((j.ds ?? []).filter((x) => x.gia != null).map((x) => [x.ma, x.gia]));
        const { moi, vuaBao } = kiemTraCanhBao(docCanhBao(), gia);
        if (vuaBao.length) {
          luuCanhBao(moi);
          baoChamGia(vuaBao, setThongBaoCB);
        }
      } catch {
        /* mat mang: lan sau thu lai */
      }
    };
    const dau = setTimeout(kiem, 3000);
    const id = setInterval(kiem, 60000);
    return () => {
      clearTimeout(dau);
      clearInterval(id);
    };
  }, [ma]);
  useEffect(() => {
    if (!datCB) return;
    const esc = (e) => e.key === "Escape" && setDatCB(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [datCB]);
  useEffect(() => {
    if (!thongBaoCB) return;
    const t = setTimeout(() => setThongBaoCB(null), 12000);
    return () => clearTimeout(t);
  }, [thongBaoCB]);

  // 3b. Chi bao phu tren cung cua so gia: EMA 9/21, Bollinger.
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    const cp = chiBaoPhu;
    s.ema9.setData(cp ? cp.ema9 : []);
    s.ema21.setData(cp ? cp.ema21 : []);
    s.bbTren.setData(cp ? cp.bbTren : []);
    s.bbMid.setData(cp ? cp.bbMid : []);
    s.bbDuoi.setData(cp ? cp.bbDuoi : []);
    s.bbBand.datDuLieu(cp ? cp.bbBand : []);
    s.vwap.setData(cp ? cp.vwap : []);
    s.mlstDuong.setData(cp ? cp.mlstDuong : []);
    s.mlstDai.datDuLieu(cp ? cp.mlstDai : []);
    s.mlstSo.datDuLieu(cp ? cp.mlstSo : []);
  }, [chiBaoPhu]);
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    s.mlstDuong.applyOptions({ visible: bat.mlst });
    s.mlstDai.datHien(bat.mlst);
    s.mlstSo.datHien(bat.mlst);
    s.markersST.setMarkers(bat.mlst && chiBaoPhu ? chiBaoPhu.mlstMui : []);
  }, [bat.mlst, chiBaoPhu]);
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    // mau / do day / hien-an tung net theo cai dat nguoi dung (lib/caiDatChiBao.js)
    const nk = (khoa, k, bang, id, them = {}) => {
      const x = kieuNet(caiDat, khoa, k);
      s[id].applyOptions({ visible: !!bang && x.hien, color: x.mau, lineWidth: x.day, ...them });
    };
    nk("ema", "e1", bat.ema, "ema9");
    nk("ema", "e2", bat.ema, "ema21");
    nk("boll", "tren", bat.boll, "bbTren");
    nk("boll", "giua", bat.boll, "bbMid", { lineWidth: kieuNet(caiDat, "boll", "giua").day });
    nk("boll", "duoi", bat.boll, "bbDuoi");
    s.bbBand.datHien(bat.boll);
    nk("vwap", "vwap", bat.vwap && noiNgay, "vwap");
    s.vachNgay.datHien(bat.chiaNgay && noiNgay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bat.ema, bat.boll, bat.vwap, bat.chiaNgay, noiNgay, caiDat.kieu]);
  // 3b''. HOMILY tren cua so gia (TE, 进出, 彩虹, 通道 + cac nhan): tao lai series moi khi bat / tat hoac doi du lieu.
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    for (const x of s.homily) {
      try {
        s.chart.removeSeries(x);
      } catch {
        /* da bi go cung bieu do */
      }
    }
    s.homily = [];
    const cp = chiBaoPhu;
    s.homilyDai.datDuLieu(bat.hmJinChu && cp ? cp.hmJinChuDai : []);
    s.homilyDai.datHien(!!bat.hmJinChu);
    if (!cp) {
      s.markersHM.setMarkers([]);
      return;
    }
    const khongVe = { lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false };
    const duong = (du, mau, rong = 1, them = {}) => {
      const sr = s.chart.addSeries(LineSeries, { color: mau, lineWidth: rong, ...khongVe, ...them });
      sr.setData(du);
      s.homily.push(sr);
      return sr;
    };
    if (bat.hmCaiHong) for (const x of cp.hmCaiHong) duong(x.du, x.mau);
    if (bat.hmTongDao) {
      const kDai = kieuNet(caiDat, "hmTongDao", "dai");
      duong(cp.hmBBTren, kDai.mau, kDai.day, { visible: kDai.hien });
      duong(cp.hmBBMid, kDai.mau, 1, { lineStyle: LineStyle.Dashed, visible: kDai.hien });
      duong(cp.hmBBDuoi, kDai.mau, kDai.day, { visible: kDai.hien });
    }
    if (bat.hmJinChu) {
      const kN = kieuNet(caiDat, "hmJinChu", "nhanh"), kC = kieuNet(caiDat, "hmJinChu", "cham");
      duong(cp.hmE8, kN.mau, kN.day, { visible: kN.hien });
      duong(cp.hmE20, kC.mau, kC.day, { visible: kC.hien });
    }
    if (bat.hmTE) {
      const thap = s.chart.addSeries(CandlestickSeries, { borderVisible: true, wickVisible: true, ...khongVe });
      thap.setData(cp.hmTEThap);
      s.homily.push(thap);
      cp.hmTEDuong.forEach((d, k) => duong(d, "#D946EF", k === cp.hmTEDuong.length - 1 ? 2 : 1, { lineStyle: k === cp.hmTEDuong.length - 1 ? LineStyle.Solid : LineStyle.Dotted }));
    }
    const dau = [];
    if (bat.hmJinChu) dau.push(...cp.hmJinChuMui);
    if (bat.hmStrong) dau.push(...cp.hmStrongMui);
    if (bat.hmYeuThe) dau.push(...cp.hmYeuTheMui);
    if (bat.hmThaoBan) dau.push(...cp.hmThaoBanMui);
    if (bat.hmTaichi) dau.push(...cp.hmTaichiMui);
    dau.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    s.markersHM.setMarkers(dau);
  }, [chiBaoPhu, bat.hmTE, bat.hmJinChu, bat.hmCaiHong, bat.hmTongDao, bat.hmStrong, bat.hmYeuThe, bat.hmThaoBan, bat.hmTaichi, caiDat]);
  // 3b'''. LIQUIDITY TRAP RADAR + AVPT tren cua so gia: tao lai series moi khi bat / tat hoac doi du lieu.
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    for (const x of s.tv) {
      try {
        s.chart.removeSeries(x);
      } catch {
        /* da bi go cung bieu do */
      }
    }
    s.tv = [];
    const cp = chiBaoPhu;
    s.tvDai.datDuLieu(bat.tvAvpt && cp ? cp.tvBandDai : []);
    s.tvDai.datHien(!!bat.tvAvpt);
    if (!cp) {
      s.markersTV.setMarkers([]);
      return;
    }
    const khongVe = { lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false };
    const duong = (du, mau, rong = 1, them = {}) => {
      const sr = s.chart.addSeries(LineSeries, { color: mau, lineWidth: rong, ...khongVe, ...them });
      sr.setData(du);
      s.tv.push(sr);
      return sr;
    };
    // muc lenh cua tin hieu cuoi: moi muc 1 doan ngang tu nen tin hieu den nen ket thuc / nen cuoi
    const muc = (m) => {
      if (!m) return;
      for (const d of m.ds) duong([{ time: m.tu, value: d.gia }, { time: m.den, value: d.gia }], d.mau, d.ten === "Entry" ? 1 : 1, { lineStyle: d.ten === "SL" ? LineStyle.Solid : LineStyle.Dashed, lastValueVisible: true, title: d.ten });
    };
    const dau = [];
    if (bat.tvTrap) {
      dau.push(...cp.tvTrapMui);
      muc(cp.tvTrapMuc);
    }
    if (bat.tvAvpt) {
      const kAv = kieuNet(caiDat, "tvAvpt", "avwap");
      duong(cp.tvAvwap.map((d) => (d.color === TV_XANH ? { ...d, color: kAv.mau } : d)), kAv.mau, kAv.day, { title: "AVWAP", visible: kAv.hien });
      duong(cp.tvBandTren, "rgba(167,139,250,0.55)");
      duong(cp.tvBandDuoi, "rgba(167,139,250,0.55)");
      dau.push(...cp.tvAvptMui);
      muc(cp.tvAvptMuc);
    }
    dau.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    s.markersTV.setMarkers(dau);
  }, [chiBaoPhu, bat.tvTrap, bat.tvAvpt, caiDat]);
  // 3b'. FOOTPRINT (chi VN30F1M, khung trong ngay): tai /api/footprint khi bat chip, gian nen ra >= 64 px de doc duoc tung muc gia.
  const coFootprint = !!bat.footprint && noiNgay && ma === "VN30F1M";
  useEffect(() => {
    const s = veRef.current;
    if (!s?.footprint) return;
    s.footprint.datHien(coFootprint);
    s.footprint.datDuLieu(null);
    s.footprintBat = coFootprint;
    mauNen(s);
    if (!coFootprint) return;
    let huy = false;
    fetch(`/api/footprint?ma=${encodeURIComponent(ma)}&kt=${khungTG}`)
      .then((r) => r.json())
      .then((j) => {
        if (huy) return;
        if (j.trangThai !== "ok") return s.footprint.datDuLieu(null, `Footprint: ${j.loi || "chưa có dữ liệu"}`);
        s.footprint.datDuLieu(j, j.nen?.length ? "" : "Footprint: chưa có dữ liệu");
        // gian nen ~64 px (du cho so) va dua cac nen CUOI vao giua man hinh (bo vung may tuong lai ben phai)
        const ts = s.chart.timeScale();
        if (ts.options().barSpacing < 64) {
          const n = s.candle.data().length;
          const rong = s.chart.paneSize?.(0)?.width ?? 800;
          if (n > 0) ts.setVisibleLogicalRange({ from: n - rong / 64, to: n + 2 });
        }
      })
      .catch(() => !huy && s.footprint.datDuLieu(null, "Footprint: lỗi tải dữ liệu"));
    return () => {
      huy = true;
    };
  }, [coFootprint, ma, khungTG]);

  // 3c. Chi bao phu o CUA SO RIENG (RSI / MACD / Stochastic): tao lai cac series moi khi bat / tat hoac doi du lieu.
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    for (const x of s.phu) {
      try {
        s.chart.removeSeries(x);
      } catch {
        /* da bi go cung bieu do */
      }
    }
    s.phu = [];
    const cp = chiBaoPhu;
    if (!cp) return;
    let cuaSo = 1;
    const dong = (mau, du, o, them = {}) => {
      const sr = s.chart.addSeries(LineSeries, { color: mau, lineWidth: 1, lastValueVisible: true, priceLineVisible: false, crosshairMarkerVisible: false, ...them }, o);
      sr.setData(du);
      s.phu.push(sr);
      return sr;
    };
    const khoang0_100 = { autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }) };
    const vach = (sr, gia, mau) => sr.createPriceLine({ price: gia, color: mau, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false, title: "" });
    if (bat.rsi) {
      const o = cuaSo++;
      const kR = kieuNet(caiDat, "rsi", "rsi"), tR = thamSo(caiDat, "rsi");
      const sr = dong(kR.mau, cp.rsi, o, { title: nhanDong("rsi", caiDat, "RSI 14"), lineWidth: kR.day, visible: kR.hien, ...khoang0_100 });
      vach(sr, tR.mua, "rgba(239,68,68,0.6)");
      vach(sr, tR.ban, "rgba(34,197,94,0.6)");
      // RSI phan ky: noi 2 day (hoac 2 dinh) tren gia va tren RSI, danh dau nen dinh / day thu hai
      if (bat.phanKy && nen) {
        const mauTang = "#22C55E", mauGiam = "#EF4444";
        const gan = [...phanKy.filter((e) => e.loai === "tang").slice(-SO_PK_HIEN), ...phanKy.filter((e) => e.loai === "giam").slice(-SO_PK_HIEN)];
        const nhan = [];
        for (const e of gan) {
          const mau = e.loai === "tang" ? mauTang : mauGiam;
          const doan = (o2, y1, y2) => {
            const dg = s.chart.addSeries(LineSeries, { color: mau, lineWidth: 2, lineStyle: LineStyle.Solid, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false }, o2);
            dg.setData([{ time: nen[e.i1].t, value: y1 }, { time: nen[e.i2].t, value: y2 }]);
            s.phu.push(dg);
          };
          doan(0, e.gia1, e.gia2);
          doan(o, e.rsi1, e.rsi2);
          nhan.push({ time: nen[e.i2].t, position: e.loai === "tang" ? "belowBar" : "aboveBar", color: mau, shape: e.loai === "tang" ? "arrowUp" : "arrowDown", text: e.loai === "tang" ? "PK↑" : "PK↓" });
        }
        // PK SOM (vang, net dut): it dieu kien hon, co the chua xac nhan
        const somGan = [...phanKySom.filter((e) => e.loai === "tang").slice(-SO_PK_SOM_HIEN), ...phanKySom.filter((e) => e.loai === "giam").slice(-SO_PK_SOM_HIEN)];
        for (const e of somGan) {
          const doanSom = (o2, y1, y2) => {
            const dg = s.chart.addSeries(LineSeries, { color: MAU_PK_SOM, lineWidth: 2, lineStyle: LineStyle.Dashed, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false }, o2);
            dg.setData([{ time: nen[e.i1].t, value: y1 }, { time: nen[e.i2].t, value: y2 }]);
            s.phu.push(dg);
          };
          doanSom(0, e.gia1, e.gia2);
          doanSom(o, e.rsi1, e.rsi2);
          if (!nhan.some((m) => m.time === nen[e.i2].t)) nhan.push({ time: nen[e.i2].t, position: e.loai === "tang" ? "belowBar" : "aboveBar", color: MAU_PK_SOM, shape: e.loai === "tang" ? "arrowUp" : "arrowDown", text: e.loai === "tang" ? "PK↑?" : "PK↓?" });
        }
        nhan.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
        s.markersPK.setMarkers(nhan);
      } else {
        s.markersPK.setMarkers([]);
      }
    } else {
      s.markersPK.setMarkers([]);
    }
    if (bat.macd) {
      const o = cuaSo++;
      const h = s.chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false, title: nhanDong("macd", caiDat, "MACD 12·26·9") }, o);
      h.setData(cp.hist);
      s.phu.push(h);
      const kM = kieuNet(caiDat, "macd", "macd"), kS = kieuNet(caiDat, "macd", "signal");
      dong(kM.mau, cp.macd, o, { lineWidth: kM.day, visible: kM.hien });
      dong(kS.mau, cp.signal, o, { lineWidth: kS.day, visible: kS.hien });
    }
    if (bat.stoch) {
      const o = cuaSo++;
      const kK = kieuNet(caiDat, "stoch", "k"), kD = kieuNet(caiDat, "stoch", "d");
      const sr = dong(kK.mau, cp.stochK, o, { title: nhanDong("stoch", caiDat, "Stoch 14·3·3"), lineWidth: kK.day, visible: kK.hien, ...khoang0_100 });
      dong(kD.mau, cp.stochD, o, { lineWidth: kD.day, visible: kD.hien, ...khoang0_100 });
      vach(sr, 80, "rgba(239,68,68,0.6)");
      vach(sr, 20, "rgba(34,197,94,0.6)");
    }
    if (bat.mfi) {
      const o = cuaSo++;
      const kF = kieuNet(caiDat, "mfi", "mfi"), tF = thamSo(caiDat, "mfi");
      const sr = dong(kF.mau, cp.mfi, o, { title: nhanDong("mfi", caiDat, "MFI 14"), lineWidth: kF.day, visible: kF.hien, ...khoang0_100 });
      vach(sr, tF.mua, "rgba(239,68,68,0.6)");
      vach(sr, tF.ban, "rgba(34,197,94,0.6)");
    }
    if (bat.adx) {
      // ADX (do manh xu huong, hong dam) + DI+ (xanh) / DI- (do); vach 20 / 25 = nguong xu huong thuong dung
      const o = cuaSo++;
      const kA = kieuNet(caiDat, "adx", "adx"), kP = kieuNet(caiDat, "adx", "pdi"), kN = kieuNet(caiDat, "adx", "mdi"), tA = thamSo(caiDat, "adx");
      const sr = dong(kA.mau, cp.adx, o, { title: nhanDong("adx", caiDat, "ADX 14"), lineWidth: kA.day, visible: kA.hien });
      dong(kP.mau, cp.pdi, o, { title: "DI+", lineWidth: kP.day, visible: kP.hien });
      dong(kN.mau, cp.mdi, o, { title: "DI−", lineWidth: kN.day, visible: kN.hien });
      vach(sr, tA.nguong1, "rgba(148,163,184,0.6)");
      vach(sr, tA.nguong2, "rgba(148,163,184,0.35)");
    }
    if (bat.mcdx) {
      // MCDX (FireAnt): 3 cot chong len nhau tren thang 0-20: Retailer xanh (hang so 20) o duoi cung, Hot Money vang, Banker do o tren; vach 5 / 10 / 15 = 25% / 50% / 75%
      const o = cuaSo++;
      const rangCot = { priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false };
      const cot = (mau, du, them = {}) => {
        const sr = s.chart.addSeries(HistogramSeries, { color: mau, ...rangCot, ...them }, o);
        sr.setData(du);
        s.phu.push(sr);
        return sr;
      };
      const xanh = cp.mcdxB.map((d) => ({ time: d.time, value: 20 }));
      cot("rgba(34,197,94,0.75)", xanh, { autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 20 } }) });
      cot("rgba(250,204,21,0.95)", cp.mcdxH);
      const sr = cot("rgba(239,68,68,0.95)", cp.mcdxB, { title: "MCDX", lastValueVisible: true });
      for (const [g, n] of [[5, "25%"], [10, "50%"], [15, "75%"]]) sr.createPriceLine({ price: g, color: "rgba(148,163,184,0.55)", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false, title: n });
    }
    if (bat.bkr) {
      // BANKER RHYTHM (lib/bankerRhythm.js, ma cong khai "bkr"): 2 rau xanh doi xung quanh 0 (tach ra = gia gan dinh bien do 15 phien, thu vao = gan day), BridgeT +/- (cam khi tang, xanh nhat khi giam),
      // cot xanh +/-30 = BuySignal-A, o vuong xanh = BuySignal-B (trend cat len 5). Chi la chi bao hien thi: kiem dinh 21/11/2026 khong co loi the rieng le.
      const o = cuaSo++;
      const cot = s.chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }, o);
      cot.setData(cp.bkrA);
      s.phu.push(cot);
      const cotAm = s.chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }, o);
      cotAm.setData(cp.bkrAAm);
      s.phu.push(cotAm);
      const kRau = kieuNet(caiDat, "bkr", "rau"), kCau = kieuNet(caiDat, "bkr", "bridge");
      // BridgeT: nhan cam = dang tang (mau theo cai dat), xanh nhat = dang giam
      const mauCau = (d) => (d.color === "#F59E0B" ? { ...d, color: kCau.mau } : d);
      dong(kCau.mau, cp.bkrCauTren.map(mauCau), o, { lineWidth: kCau.day, visible: kCau.hien });
      dong(kCau.mau, cp.bkrCauDuoi.map(mauCau), o, { lineWidth: kCau.day, visible: kCau.hien });
      const sr = dong(kRau.mau, cp.bkrTren, o, { title: "Banker Rhythm", lineWidth: kRau.day, visible: kRau.hien });
      dong(kRau.mau, cp.bkrDuoi, o, { lineWidth: kRau.day, visible: kRau.hien });
      vach(sr, 0, "rgba(148,163,184,0.5)");
      createSeriesMarkers(sr, cp.bkrB);
    }
    if (bat.hmDE) {
      // HOMILY DE 背离王 (lib/homily.js): nen khong rau tu towerc phien truoc den towerc phien nay; DO = tien vao (towerc >= phien truoc), XANH LA = tien ra; vach 0.
      const o = cuaSo++;
      const kUp = kieuNet(caiDat, "hmDE", "len"), kDown = kieuNet(caiDat, "hmDE", "xuong");
      const sr = s.chart.addSeries(CandlestickSeries, { upColor: kUp.mau, downColor: kDown.mau, borderVisible: false, priceLineVisible: false, lastValueVisible: true, crosshairMarkerVisible: false, title: "DE (đỏ = tiền vào)" }, o);
      sr.setData(cp.hmDE.map((d) => { const m = d.color === HM_DO ? kUp.mau : kDown.mau; return { ...d, color: m, borderColor: m, wickColor: m }; }));
      s.phu.push(sr);
      sr.createPriceLine({ price: 0, color: "rgba(148,163,184,0.7)", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false, title: "" });
    }
    if (bat.hmKDJ) {
      // KDJ 9,3,3 cua Tongdaxin: J cat len 50 = "强势信号" cua Homily; vach 50 (manh / yeu), 20 / 80.
      const o = cuaSo++;
      const kJ = kieuNet(caiDat, "hmKDJ", "j"), kKk = kieuNet(caiDat, "hmKDJ", "k"), kDd = kieuNet(caiDat, "hmKDJ", "d");
      const sr = dong(kJ.mau, cp.hmJ, o, { title: `J (KDJ ${thamSo(caiDat, "hmKDJ").n}·3·3)`, lineWidth: kJ.day, visible: kJ.hien });
      dong(kKk.mau, cp.hmK, o, { title: "K", lineWidth: kKk.day, visible: kKk.hien });
      dong(kDd.mau, cp.hmD, o, { title: "D", lineWidth: kDd.day, visible: kDd.hien });
      vach(sr, 50, "rgba(148,163,184,0.7)");
      vach(sr, 80, "rgba(239,68,68,0.45)");
      vach(sr, 20, "rgba(34,197,94,0.45)");
    }
    if (bat.dongTien) {
      // GIONG PINE ([blackcat] L3 Banker Fund Flow): nen mo theo trang thai (xanh / do), vung 10-20 va 80-90 to mau, nen vang "Banker In", nen giua trend va bull/bear,
      // duong trend doi mau, vach cham 80 / 20 / 10 / 90, nhan Banker In / IN / OUT / SI / SO / RL / RS tren cua so nay, nhan TP / SL tren bieu do gia.
      const o = cuaSo++;
      const khongVe = { priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false };
      const nenMo = s.chart.addSeries(HistogramSeries, { ...khongVe }, o);
      nenMo.setData(cp.bankerNenTrang);
      s.phu.push(nenMo);
      const vung = (day, dinh, rgba) => {
        const sr = s.chart.addSeries(BaselineSeries, { baseValue: { type: "price", price: day }, topLineColor: "rgba(0,0,0,0)", topFillColor1: rgba, topFillColor2: rgba, bottomLineColor: "rgba(0,0,0,0)", bottomFillColor1: "rgba(0,0,0,0)", bottomFillColor2: "rgba(0,0,0,0)", lineWidth: 1, ...khongVe }, o);
        sr.setData(cp.bankerThoi.map((t) => ({ time: t, value: dinh })));
        s.phu.push(sr);
      };
      vung(10, 20, "rgba(250,204,21,0.3)");
      vung(80, 90, "rgba(217,70,239,0.3)");
      const nenCfg = { upColor: "rgba(0,0,0,0)", downColor: "rgba(0,0,0,0)", borderVisible: false, wickVisible: false, ...khongVe };
      const nenVang = s.chart.addSeries(CandlestickSeries, nenCfg, o);
      nenVang.setData(cp.bankerVang);
      s.phu.push(nenVang);
      const nenThan = s.chart.addSeries(CandlestickSeries, nenCfg, o);
      nenThan.setData(cp.bankerNen);
      s.phu.push(nenThan);
      const sr = dong("#22C55E", cp.bankerDuong, o, { title: "Dòng tiền", lineWidth: 2, autoscaleInfoProvider: () => ({ priceRange: { minValue: -5, maxValue: 105 } }) });
      const vachCham = (gia, mau) => sr.createPriceLine({ price: gia, color: mau, lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: false, title: "" });
      vachCham(80, "rgba(239,68,68,0.8)");
      vachCham(20, "rgba(250,204,21,0.8)");
      vachCham(10, "rgba(132,204,22,0.8)");
      vachCham(90, "rgba(217,70,239,0.8)");
      const kieuNhan = {
        bankerIn: ["belowBar", "arrowUp", MAU_BANKER.vang],
        IN: ["belowBar", "arrowUp", "#84CC16"],
        OUT: ["aboveBar", "arrowDown", "#FB923C"],
        SI: ["aboveBar", "arrowDown", "#D946EF"],
        SO: ["belowBar", "arrowUp", "#3B82F6"],
        RL: ["belowBar", "arrowUp", "#14B8A6"],
        RS: ["aboveBar", "arrowDown", "#A855F7"],
      };
      createSeriesMarkers(sr, cp.bankerNhanDao.map((l) => ({ time: l.time, position: kieuNhan[l.loai][0], shape: kieuNhan[l.loai][1], color: kieuNhan[l.loai][2], text: l.text })));
      s.markersBanker.setMarkers(cp.bankerNhanGia.map((l) => ({ time: l.time, position: l.loai === "TP" ? "aboveBar" : "belowBar", shape: l.loai === "TP" ? "arrowDown" : "arrowUp", color: l.loai === "TP" ? "#14B8A6" : "#9F1239", text: l.text })));
    } else {
      s.markersBanker.setMarkers([]);
    }
    // cua so gia lon hon cac cua so chi bao
    const panes = s.chart.panes();
    panes.forEach((p, i) => p.setStretchFactor(i === 0 ? 3.2 : 1));
  }, [bat.rsi, bat.macd, bat.stoch, bat.mfi, bat.adx, bat.mcdx, bat.bkr, bat.hmDE, bat.hmKDJ, bat.dongTien, bat.phanKy, chiBaoPhu, phanKy, phanKySom, nen, caiDat]);

  // 4. Vung lenh + diem MUA.
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    s.daiGia.datDuLieu(catTua != null ? [] : daiTuVung(vung), nen ? nen[nen.length - 1].c : null);
    const ngay = ngayMua ? new Date(ngayMua).toISOString().slice(0, 10) : null;
    const nenMua = nen && ngay && !noiNgay && !(catTua != null && ngay > nen[nen.length - 1].t) ? timNenTruoc(nen, ngay) : null;
    s.markers.setMarkers(nenMua ? [{ time: nenMua, position: "belowBar", color: mauTheoGiaoDien().xanh, shape: "arrowUp", text: "MUA" }] : []);
  }, [vung, ngayMua, nen, kieuMau, noiNgay, catTua]);

  // 4a. Diem B (mui ten tim "B") + diem bat day (cham be "Đáy") tren nen gia: moi su kien dat vao nen cung ngay (hoac nen tuan chua ngay do); chi khung Ngay / Tuan.
  const sk = diemSK.ma === ma ? diemSK : null;
  useEffect(() => {
    const s = veRef.current;
    if (!s || !s.markersSK) return;
    if (!nen || !sk || noiNgay) return s.markersSK.setMarkers([]);
    const m = mauTheoGiaoDien();
    const ds = [];
    const cuoiTua = catTua != null ? nen[nen.length - 1].t : null;
    const them = (ngay, kieu) => {
      if (cuoiTua != null && ngay > cuoiTua) return; // dang tua lai: chua "biet" tin hieu sau moc
      const t = ngay ? timNenTruoc(nen, ngay) : null;
      if (t) ds.push({ time: t, kieu });
    };
    if (bat.diemB) for (const x of sk.b) them(x.ngay, "B");
    if (bat.batDay) for (const x of sk.batDay) them(x.ngay, "day");
    const thuTu = (t) => (typeof t === "number" ? t : Date.parse(`${t}T00:00:00Z`));
    ds.sort((a, c) => thuTu(a.time) - thuTu(c.time) || (a.kieu < c.kieu ? -1 : 1));
    const daCo = new Set();
    const nhan = [];
    for (const d of ds) {
      const k = `${d.time}|${d.kieu}`;
      if (daCo.has(k)) continue;
      daCo.add(k);
      nhan.push(d.kieu === "B" ? { time: d.time, position: "belowBar", color: m.diemB, shape: "arrowUp", text: "B" } : { time: d.time, position: "belowBar", color: m.diemDay, shape: "circle", text: "Đáy" });
    }
    s.markersSK.setMarkers(nhan);
  }, [sk, nen, bat.diemB, bat.batDay, noiNgay, kieuMau, ma, catTua]);

  // An / khoa tat ca hinh ve (nut mat / o khoa o thanh ben trai)
  useEffect(() => {
    veRef.current?.lopVe?.datAn(anHet);
  }, [anHet]);
  useEffect(() => {
    veRef.current?.lopVe?.datKhoaHet(khoaHet);
  }, [khoaHet]);

  // 4a2. AUTO FIB EXTENSION (chip "Auto Fib Extension"): ve bang lop ve nhu cong cu Fibonacci mo rong cua TradingView (hop to mau tung muc, nhan ben trai, doan A-B-C net dut), keo dai den het truc gia, chi doc. Chi la cong cu tham khao.
  useEffect(() => {
    const s = veRef.current;
    if (!s || !s.lopVe) return;
    // Hinh ve ngoai gom: Auto Fib Extension + VUNG CUNG CAU (datHinhNgoai thay ca danh sach nen phai gop 1 lan).
    // Truc gia KEO RONG de chua du cac muc fib (17/11/2026, Hieu: "fibo van thieu diem" - muc 1,272 / 1,618 nam ngoai vung gia dang thay nen bi cat mat): provider autoscale cong them khoang [thap, cao] cua cac muc.
    const giaFibRef = (s.giaFib = s.giaFib || { khoang: null });
    const apKhoang = (kh) => {
      giaFibRef.khoang = kh;
      s.candle.applyOptions({
        autoscaleInfoProvider: (goc) => {
          const res = goc();
          const e = giaFibRef.khoang;
          if (!res || !e) return res;
          return { ...res, priceRange: { minValue: Math.min(res.priceRange.minValue, e[0]), maxValue: Math.max(res.priceRange.maxValue, e[1]) } };
        },
      });
    };
    const ds = [];
    let khoangFib = null;
    if (nen && nen.length >= 40 && bat.autoFib) {
      const r = autoFibExt(nen.map((b) => b.h), nen.map((b) => b.l), { depth: 10 });
      if (r && nen[r.A.i] && nen[r.B.i] && nen[r.C.i]) {
        const giaMuc = [1, 1.272, 1.618].map((m) => r.C.v + r.huong * m * r.doAB);
        khoangFib = [Math.min(r.C.v, ...giaMuc), Math.max(r.C.v, ...giaMuc)];
        ds.push({ id: "_autoFib", loai: "fibMoRong", p1: { i: r.A.i, p: r.A.v }, p2: { i: r.B.i, p: r.B.v }, p3: { i: r.C.i, p: r.C.v }, mau: "#787B86", keoDai: true, mucChon: [1, 1.272, 1.618] });
      }
    }
    if (nen && nen.length >= 40 && bat.cungCau) {
      const vung = chonVungDeVe(vungCungCau(nen.map((b) => b.o), nen.map((b) => b.h), nen.map((b) => b.l), nen.map((b) => b.c)));
      for (const z of vung) {
        const cau = z.loai === "cau";
        const nhan = `${cau ? "Cầu" : "Cung"}${z.fvg ? " · FVG" : ""}${z.soCham === 0 ? " · mới" : ` · chạm ${z.soCham} lần${z.soCham >= 2 ? " (yếu)" : ""}`}`;
        ds.push({ id: `_cc${z.loai}${z.i}`, loai: "vungCC", p1: { i: z.i, p: z.top }, p2: { i: z.i, p: z.bot }, mau: cau ? "#22C55E" : "#EF4444", alpha: z.soCham === 0 ? 0.2 : z.soCham === 1 ? 0.14 : 0.08, nhan });
      }
    }
    apKhoang(khoangFib);
    s.lopVe.datHinhNgoai(ds);
  }, [bat.autoFib, bat.cungCau, nen, khungTG, kieuMau]);

  // 4b. Tu ve MAU HINH GIA len bieu do: duong co / canh (LineSeries), diem chinh (marker), muc tieu + cat lo (vach gia); cuon bieu do toi mau hinh.
  useEffect(() => {
    const s = veRef.current;
    if (!s || !s.mh) return;
    try {
      for (const sr of s.mh.series) s.chart.removeSeries(sr);
      for (const pl of s.mh.vach) s.candle.removePriceLine(pl);
    } catch {}
    s.mh = { series: [], vach: [] };
    s.markersMH.setMarkers([]);
    if (!mauHinhVe || !nen) return;
    const m = mauHinhVe;
    const dangHT = m.trangThai === "dang_hinh_thanh";
    const mauChinh = m.huong > 0 ? "#22C55E" : m.huong < 0 ? "#EF4444" : "#F6C544";
    const dg = (d) => {
      if (d.i2 <= d.i1 || !nen[d.i1] || !nen[d.i2]) return;
      const phu = d.loai === "phu";
      const sr = s.chart.addSeries(LineSeries, { color: d.loai === "co" ? "#F6C544" : phu ? "rgba(148,163,184,0.9)" : mauChinh, lineWidth: d.loai === "co" ? 2 : 1, lineStyle: phu || dangHT ? LineStyle.Dotted : LineStyle.Solid, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false });
      sr.setData([{ time: nen[d.i1].t, value: d.g1 }, { time: nen[d.i2].t, value: d.g2 }]);
      s.mh.series.push(sr);
    };
    m.duong.forEach(dg);
    const vach = (gia, mau, tieuDe) => s.mh.vach.push(s.candle.createPriceLine({ price: gia, color: mau, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: tieuDe }));
    if (dangHT) {
      for (const k of m.kichBan) {
        vach(k.mucPhaVo, k.huong > 0 ? "#22C55E" : "#EF4444", k.huong > 0 ? "Phá vỡ lên" : "Phá vỡ xuống");
        if (m.kichBan.length === 1) {
          vach(k.mucTieu, "#22C55E", "Mục tiêu");
          vach(k.catLo, "#EF4444", "Cắt lỗ");
        }
      }
    } else {
      vach(m.mucTieu, "#22C55E", "Mục tiêu");
      vach(m.catLo, "#EF4444", "Cắt lỗ");
    }
    const nhan = m.diem
      .filter((d) => nen[d.i])
      .map((d) => {
        const b = nen[d.i];
        const day = Math.abs(d.gia - b.l) <= Math.abs(d.gia - b.h);
        return { time: b.t, position: day ? "belowBar" : "aboveBar", color: "#F6C544", shape: "circle", text: d.nhan || "" };
      });
    if (!dangHT) nhan.push({ time: nen[m.i].t, position: m.huong > 0 ? "belowBar" : "aboveBar", color: mauChinh, shape: m.huong > 0 ? "arrowUp" : "arrowDown", text: m.huong > 0 ? "Phá vỡ lên" : "Phá vỡ xuống" });
    nhan.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    s.markersMH.setMarkers(nhan);
    const dau = Math.min(m.i, ...m.diem.map((d) => d.i), ...m.duong.map((d) => d.i1));
    s.chart.timeScale().setVisibleLogicalRange({ from: Math.max(-2, dau - 12), to: Math.min(nen.length + 12, m.i + (dangHT ? 12 : 30)) });
  }, [mauHinhVe, nen]);

  // 4b'. Mau hinh NEN NHAT: mui ten tren / duoi nen cuoi cua mau hinh (tang: duoi nen, xanh; giam: tren nen, do).
  useEffect(() => {
    const s = veRef.current;
    if (!s || !s.markersNen) return;
    const nhan = dsNenNhat
      .filter((m) => nen && nen[m.i])
      .map((m) => ({ time: nen[m.i].t, position: m.huong >= 0 ? "belowBar" : "aboveBar", color: m.huong > 0 ? "#22C55E" : m.huong < 0 ? "#EF4444" : "#94A3B8", shape: m.huong >= 0 ? "arrowUp" : "arrowDown", text: m.ten }));
    nhan.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    s.markersNen.setMarkers(nhan);
  }, [dsNenNhat, nen]);

  // 4c. Khung nho: truc thoi gian hien gio (HH:MM).
  useEffect(() => {
    veRef.current?.chart.applyOptions({ timeScale: { timeVisible: noiNgay, secondsVisible: false } });
  }, [noiNgay]);

  // 5. Bat/tat chi bao.
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    // Ichimoku / can bang / MA: hien-an, mau, do day theo cai dat nguoi dung
    const dat = (khoa, k, bang, ids, goc = {}, alpha = 1) => {
      const x = kieuNet(caiDat, khoa, k);
      const mau = alpha < 1 ? hexRgba(x.mau, alpha) : x.mau;
      for (const [id, chiMau] of ids) s[id].applyOptions({ visible: !!bang && x.hien, color: x.daSua || khoa !== "ma" || k !== "ma3" ? mau : mauTheoGiaoDien().ma200, ...(chiMau ? {} : { lineWidth: x.day }), ...goc });
    };
    dat("ichimoku", "tenkan", bat.ichimoku, [["tenkan"], ["ttTenkan", 1]]);
    dat("ichimoku", "kijun", bat.ichimoku, [["kijun"], ["ttKijun", 1]]);
    dat("ichimoku", "chikou", bat.ichimoku, [["chikou"]]);
    dat("ichimoku", "spanA", bat.ichimoku, [["spanA"], ["ttSpanA", 1]], {}, 0.75);
    dat("ichimoku", "spanB", bat.ichimoku, [["spanB"], ["ttSpanB", 1]], {}, 0.75);
    s.may.datHien(bat.ichimoku);
    dat("canBang", "cb1", bat.canBang, [["cb1"], ["ttCb1", 1]]);
    dat("canBang", "cb2", bat.canBang, [["cb2"], ["ttCb2", 1]]);
    s.canBang.datHien(bat.canBang);
    dat("ma", "ma1", bat.ma, [["ma20"]]);
    dat("ma", "ma2", bat.ma, [["ma50"]]);
    dat("ma", "ma3", bat.ma, [["ma200"]]);
    s.daiGia.datHien(bat.vung);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bat, caiDat.kieu]);

  function datKhoang(soNen) {
    const s = veRef.current;
    if (!s || !chiBao) return;
    const from = soNen ? chiBao.n - soNen : -2;
    danhDauTuongTac(tuongTacDenRef); // bam nut khoang = thao tac cua nguoi dung -> dong bo sang cac o khac
    s.chart.timeScale().setVisibleLogicalRange({ from, to: chiBao.n + (chiBao.dich ?? THAM_SO_MAC_DINH.dichMay) + SO_BUOC_TUONG_LAI.spanB + 2 });
  }

  const conVung = vung && (vung.mua || vung.sl || vung.tp);
  const idx = nen && chuThich ? nen.findIndex((b) => b.t === chuThich.t) : (nen?.length ?? 0) - 1;
  const hienTai = chuThich ?? (nen && nen.length ? { t: nen[nen.length - 1].t, o: nen[nen.length - 1].o, h: nen[nen.length - 1].h, l: nen[nen.length - 1].l, c: nen[nen.length - 1].c, v: nen[nen.length - 1].v } : null);
  const truoc = nen && idx > 0 ? nen[idx - 1].c : null;
  const doiPct = hienTai && truoc ? ((hienTai.c - truoc) / truoc) * 100 : null;
  const mauDoi = doiPct == null ? MUTED : doiPct >= 0 ? XANH : DO;
  const veDoc = boCucRong || toanMH || veTrai; // veTrai: thanh cong cu ve doc cho o nho (trang Da khung) ma khong can o thong tin ben phai
  const chieuNgang = boCucRong || veTrai; // than bieu do chiem het chieu ngang con lai ben canh thanh ve // thanh cong cu ve doc ben trai (may tinh; ca khi xem toan man hinh)
  const benPhai = boCucRong && !toanMH; // o thong tin ma ben phai (man >= 1280px)
  // Noi dung O THONG TIN MA: dung chung cho o ben phai (boCucRong) va khung ben phai khi xem toan man hinh.
  const noiDungThongTin = (
    <>
      {hienTai && (
        <div>
          <p className="text-lg" style={{ fontFamily: "var(--font-chu)", fontWeight: 800 }}>{ma}</p>
          <p className="text-3xl" style={{ fontFamily: "var(--font-chu)", fontWeight: 800, color: mauDoi }}>{fmt(hienTai.c)}</p>
          {doiPct != null && <p className="text-sm font-bold" style={{ color: mauDoi }}>{pctVN(doiPct, 2)}</p>}
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs" style={{ fontFamily: "var(--font-chu)" }}>
            {[["Mở", hienTai.o], ["Cao", hienTai.h], ["Thấp", hienTai.l], ["Tham chiếu", truoc]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><dt style={{ color: MUTED }}>{k}</dt><dd style={{ color: TEXT, fontWeight: 600 }}>{v != null ? fmt(v) : "—"}</dd></div>
            ))}
            <div className="flex justify-between col-span-2"><dt style={{ color: MUTED }}>KL</dt><dd style={{ color: TEXT, fontWeight: 600 }}>{chuoiKL(hienTai.v)}</dd></div>
            <div className="flex justify-between col-span-2"><dt style={{ color: MUTED }}>Nến</dt><dd style={{ color: TEXT, fontWeight: 600 }}>{nhanThoiGian(hienTai.t)}</dd></div>
          </dl>
        </div>
      )}
      {thongTinMa && <ThongTinMaBieuDo ma={ma} du={thongTinMa} />}
      {thongTin && (
        <div className="border-t pt-3" style={{ borderColor: VIEN }}>
          <p className="text-[11px] mb-1.5" style={{ color: MUTED }}>Tín hiệu hệ thống</p>
          <BangThongTinBieuDo tt={thongTin} />
        </div>
      )}
      {conVung && (
        <div className="text-xs border-t pt-3" style={{ borderColor: VIEN, fontFamily: "var(--font-chu)" }}>
          <p className="text-[11px] mb-1.5" style={{ color: MUTED }}>Vùng lệnh</p>
          {daiTuVung(vung).map((d) => (
            <div key={d.nhan} className="flex justify-between py-0.5"><span style={{ color: `rgb(${d.mau})` }}>{d.nhan}</span><b>{d.tu === d.den ? fmt(d.tu) : `${fmt(d.tu)} – ${fmt(d.den)}`}</b></div>
          ))}
        </div>
      )}
    </>
  );
  const cbMa = canhBao.filter((c) => c.ma === ma);
  // Danh sach chi bao cho MENU "Chi bao" (kieu TradingView) va chu thich tren bieu do: moi muc co khoa, nhan, mau, nhom, ma "data-may" (huong dan cua May) va ham bam.
  const bamBat = (k) => () => setBat((b) => ({ ...b, [k]: !b[k] }));
  const dsMenu = [
    ...CONG_TAT.filter((c) => !(noiNgay && (c.khoa === "vp" || c.khoa === "htkc")) && !(!noiNgay && (c.khoa === "vwap" || c.khoa === "chiaNgay")) && !(c.khoa === "footprint" && !(noiNgay && ma === "VN30F1M"))).map((c) => ({ khoa: c.khoa, nhan: c.nhan, mau: c.mau, nhom: "Lớp trên biểu đồ giá", may: `chip-${c.khoa}`, bam: c.khoa === "footprint" ? () => setBat((b) => ({ ...b, footprint: !b.footprint, ...(!b.footprint ? { ichimoku: false, canBang: false } : {}) })) : bamBat(c.khoa) })),
    conVung && { khoa: "vung", nhan: "Vùng lệnh", mau: XANH, nhom: "Tín hiệu hệ thống", may: "chip-vung", bam: bamBat("vung") },
    !noiNgay && sk && sk.b.length > 0 && { khoa: "diemB", nhan: `Điểm B (${sk.b.length})`, mau: "var(--diem-b)", nhom: "Tín hiệu hệ thống", may: "chip-diemB", bam: bamBat("diemB") },
    !noiNgay && sk && sk.batDay.length > 0 && { khoa: "batDay", nhan: `Bắt đáy (${sk.batDay.length})`, mau: "var(--diem-day)", nhom: "Tín hiệu hệ thống", may: "chip-batDay", bam: bamBat("batDay") },
    ...CHI_BAO_PHU.map((c) => ({ khoa: c.khoa, nhan: c.nhan, mau: c.mau, nhom: "Chỉ báo phụ (cửa sổ riêng)", may: `chip-${c.khoa}`, bam: bamBat(c.khoa) })),
    ...[...HOMILY_PHU, ...HOMILY_GIA].map((c) => ({ khoa: c.khoa, nhan: c.nhan, mau: c.mau, nhom: NHOM_HOMILY, may: `chip-${c.khoa}`, bam: bamBat(c.khoa) })),
    ...TV_GIA.map((c) => ({ khoa: c.khoa, nhan: c.nhan, mau: c.mau, nhom: NHOM_TV, may: `chip-${c.khoa}`, bam: bamBat(c.khoa) })),
    { khoa: "mauHinh", nhan: "Mẫu hình giá", mau: "#F6C544", nhom: "Nhận diện tự động", may: "mau-hinh", bam: bamBat("mauHinh") },
    { khoa: "nenNhat", nhan: "Mẫu hình nến", mau: "#38BDF8", nhom: "Nhận diện tự động", may: "mau-hinh-nen", bam: bamBat("nenNhat") },
    { khoa: "phanKy", nhan: CHI_BAO_PK.nhan, mau: CHI_BAO_PK.mau, nhom: "Nhận diện tự động", may: "chip-phanKy", bam: () => setBat((b) => ({ ...b, phanKy: !b.phanKy, rsi: !b.phanKy ? true : b.rsi })) },
  ]
    .filter(Boolean)
    .map((x) => ({ ...x, nhan: nhanDong(x.khoa, caiDat, x.nhan), bat: !!batGoc[x.khoa], an: !!an[x.khoa] }));
  const dsDangBat = dsMenu.filter((x) => x.bat && x.khoa !== "chiaNgay");
  const moMenuChiBao = () => {
    const r = nutCBRef.current?.getBoundingClientRect();
    if (r) setViTriCB({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - 336)) });
    setTimCB("");
    setMoChiBao((v) => !v);
  };
  const nhomMenu = [...new Set(dsMenu.map((x) => x.nhom))];
  const hienVe = toanMH || moVe || congCu != null;

  return (
    <div ref={rootRef} className={toanMH ? "fixed inset-0 z-[300] flex flex-col overflow-hidden" : "rounded-2xl border overflow-hidden"} style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex items-center gap-0.5 px-2 py-1 border-b overflow-x-auto flex-nowrap [&>*]:shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ borderColor: VIEN }}>
        <div className="flex items-center" role="tablist" aria-label="Khung thời gian">
          {KHUNG_NHANH.map((k) => {
            const dang = khungTG === k.khoa;
            return (
              <button key={k.khoa} type="button" role="tab" aria-selected={dang} onClick={() => setKhungTG(k.khoa)} title={k.ten} className="h-8 px-2.5 rounded-md text-[13px] cursor-pointer hover:bg-[color:var(--hover-nhe)]" style={{ background: dang ? "rgba(108,92,231,0.22)" : undefined, color: dang ? TEXT : MUTED, fontWeight: dang ? 700 : 500, fontFamily: "'Open Sans', sans-serif" }}>
                {k.nhan}
              </button>
            );
          })}
        </div>
        <span className="w-px h-5 mx-1.5" style={{ background: VIEN }} aria-hidden="true" />
        <button ref={nutCBRef} type="button" onClick={moMenuChiBao} aria-expanded={moChiBao} aria-haspopup="dialog" data-may="chip-menu" title="Chỉ báo và lớp hiển thị" className="h-8 px-2.5 rounded-md text-[13px] cursor-pointer inline-flex items-center gap-1.5 hover:bg-[color:var(--hover-nhe)]" style={{ background: moChiBao ? "rgba(108,92,231,0.22)" : undefined, color: moChiBao ? TEXT : "var(--chu)", fontWeight: 500, fontFamily: "'Open Sans', sans-serif" }}>
          <Activity size={16} strokeWidth={2} />
          Chỉ báo
          <span className="text-[11px] min-w-[18px] h-[18px] px-1 rounded-full inline-flex items-center justify-center" style={{ background: "rgba(108,92,231,0.28)", color: TEXT }}>{dsDangBat.length}</span>
        </button>
        <button type="button" onClick={() => (tuaHien ? setTua(null) : setChonTua((v) => !v))} aria-pressed={!!tuaHien || chonTua} data-may="tua-lai" title="Tua lại nến (replay): bấm chọn 1 nến trong quá khứ rồi phát từng nến để tập đọc biểu đồ" className="h-8 px-2.5 rounded-md text-[13px] cursor-pointer inline-flex items-center gap-1.5 hover:bg-[color:var(--hover-nhe)]" style={{ background: tuaHien || chonTua ? "rgba(108,92,231,0.22)" : undefined, color: "var(--chu)", fontWeight: 500, fontFamily: "'Open Sans', sans-serif" }}>
          <History size={16} strokeWidth={2} />
          <span className="hidden sm:inline">{tuaHien ? "Thoát tua lại" : "Tua lại"}</span>
        </button>
        <button type="button" onClick={() => setMoSoSanh((v) => !v)} aria-expanded={moSoSanh} data-may="so-sanh" title="So sánh với mã khác / chỉ số (tối đa 4) - các đường quy về cùng điểm xuất phát ở nến đầu khung nhìn" className="h-8 px-2.5 rounded-md text-[13px] cursor-pointer inline-flex items-center gap-1.5 hover:bg-[color:var(--hover-nhe)]" style={{ background: moSoSanh || ssMa.length ? "rgba(108,92,231,0.22)" : undefined, color: "var(--chu)", fontWeight: 500, fontFamily: "'Open Sans', sans-serif" }}>
          <Layers size={16} strokeWidth={2} />
          <span className="hidden sm:inline">So sánh</span>
        </button>
        <button type="button" onClick={() => (datCB ? setDatCB(false) : setMoCB((v) => !v))} aria-expanded={moCB} data-may="canh-bao-gia" title="Cảnh báo giá: đặt đường giá trên biểu đồ (kéo để đổi), giá chạm thì báo" className="h-8 px-2.5 rounded-md text-[13px] cursor-pointer inline-flex items-center gap-1.5 hover:bg-[color:var(--hover-nhe)]" style={{ background: moCB || datCB ? "rgba(108,92,231,0.22)" : undefined, color: "var(--chu)", fontWeight: 500, fontFamily: "'Open Sans', sans-serif" }}>
          <Bell size={16} strokeWidth={2} />
          <span className="hidden sm:inline">Cảnh báo</span>
          {cbMa.some((c) => !c.daBao) && <span className="text-[11px] min-w-[18px] h-[18px] px-1 rounded-full inline-flex items-center justify-center" style={{ background: "rgba(245,158,11,0.3)", color: TEXT }}>{cbMa.filter((c) => !c.daBao).length}</span>}
        </button>
        {moSoSanh && ssMa.length < 4 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const m = oSoSanh.trim().toUpperCase();
              if (/^[A-Z0-9]{2,12}$/.test(m) && m !== ma && !ssMa.includes(m)) setSsMa((d) => [...d, m].slice(0, 4));
              setOSoSanh("");
              setMoSoSanh(false);
            }}
            className="inline-flex items-center gap-1"
          >
            <input autoFocus value={oSoSanh} onChange={(e) => setOSoSanh(e.target.value)} placeholder="Mã / VNINDEX…" aria-label="Mã cần so sánh" className="h-8 w-28 rounded-md px-2 text-[12px] uppercase" style={{ background: NEN_CARD, color: TEXT, border: `1px solid ${VIEN}`, fontFamily: "'Open Sans', sans-serif" }} />
            {["VNINDEX", "VN30"].filter((m) => m !== ma && !ssMa.includes(m)).map((m) => (
              <button key={m} type="button" onClick={() => { setSsMa((d) => [...d, m].slice(0, 4)); setMoSoSanh(false); }} className="h-8 px-2 rounded-md text-[11px] cursor-pointer hover:bg-[color:var(--hover-nhe)]" style={{ color: MUTED, border: `1px solid ${VIEN}` }}>
                + {m}
              </button>
            ))}
          </form>
        )}
        {!toanMH && !boCucRong && (
          <button type="button" onClick={() => setMoVe((v) => !v)} aria-expanded={moVe || congCu != null} className="md:hidden h-8 px-2.5 rounded-md text-[13px] cursor-pointer inline-flex items-center gap-1.5" style={{ background: moVe || congCu != null ? "rgba(108,92,231,0.22)" : undefined, color: moVe || congCu != null ? TEXT : "var(--chu)", fontWeight: 500, fontFamily: "'Open Sans', sans-serif" }}>
            <PenLine size={15} strokeWidth={2} /> Công cụ vẽ
          </button>
        )}
        {!toanMH && boCucRong && (
          <button type="button" onClick={() => setMoVe((v) => !v)} aria-expanded={moVe || congCu != null} className="md:hidden h-8 px-2.5 rounded-md text-[13px] cursor-pointer inline-flex items-center gap-1.5" style={{ background: moVe || congCu != null ? "rgba(108,92,231,0.22)" : undefined, color: moVe || congCu != null ? TEXT : "var(--chu)", fontWeight: 500, fontFamily: "'Open Sans', sans-serif" }}>
            <PenLine size={15} strokeWidth={2} /> Công cụ vẽ
          </button>
        )}
        {veDoc && (
          <div className="hidden md:flex items-center ml-0.5">
            <span className="w-px h-5 mx-1.5" style={{ background: VIEN }} aria-hidden="true" />
            <NutDoc disabled={!lichSuVe.coHoanTac} onClick={() => veRef.current?.lopVe.hoanTac()} title="Hoàn tác (Ctrl+Z)">
              <Undo2 size={17} strokeWidth={2} />
            </NutDoc>
            <NutDoc disabled={!lichSuVe.coLamLai} onClick={() => veRef.current?.lopVe.lamLai()} title="Làm lại (Ctrl+Y)">
              <Redo2 size={17} strokeWidth={2} />
            </NutDoc>
          </div>
        )}
        <div className="flex items-center gap-0.5 ml-auto">
          <div className="flex items-center rounded-md mr-1" role="radiogroup" aria-label="Thang giá" style={{ border: `1px solid ${VIEN}` }}>
            {THANG_GIA.map((t) => (
              <button key={t.khoa} type="button" role="radio" aria-checked={thangGia === t.khoa} onClick={() => setThangGia(t.khoa)} title={t.khoa === "log" ? "Thang logarit: cùng % tăng / giảm thì cùng độ cao" : t.khoa === "pct" ? "Trục giá hiện % so với nến đầu khung nhìn" : "Thang giá thường"} className="h-7 px-2 text-[11px] cursor-pointer" style={{ background: thangGia === t.khoa ? "rgba(108,92,231,0.22)" : undefined, color: thangGia === t.khoa ? TEXT : MUTED, fontWeight: thangGia === t.khoa ? 700 : 500, fontFamily: "'Open Sans', sans-serif" }}>
                {t.nhan}
              </button>
            ))}
          </div>
          {(noiNgay ? khoangNoiNgay(khungTG) : KHOANG).map((k) => (
            <button key={k.nhan} type="button" onClick={() => datKhoang(k.nen)} className="h-8 px-2 rounded-md text-xs cursor-pointer hover:bg-[color:var(--hover-nhe)] hover:text-[color:var(--chu)]" style={{ color: MUTED, fontFamily: "'Open Sans', sans-serif" }}>
              {k.nhan}
            </button>
          ))}
          <span className="w-px h-5 mx-1.5" style={{ background: VIEN }} aria-hidden="true" />
          <button type="button" onClick={() => setToanMH((v) => !v)} aria-pressed={toanMH} data-may="toan-man-hinh" title={toanMH ? "Thu nhỏ (Esc)" : "Xem biểu đồ toàn màn hình"} aria-label={toanMH ? "Thu nhỏ" : "Toàn màn hình"} className="w-9 h-8 rounded-md cursor-pointer inline-flex items-center justify-center hover:bg-[color:var(--hover-nhe)]" style={{ background: toanMH ? "rgba(108,92,231,0.22)" : undefined, color: toanMH ? TEXT : "var(--chu)" }}>
            {toanMH ? <Minimize2 size={17} strokeWidth={2} /> : <Maximize2 size={17} strokeWidth={2} />}
          </button>
        </div>
      </div>
      {moChiBao && createPortal(
        <div ref={popCBRef} className="fixed z-[400] w-[320px] max-w-[calc(100vw-16px)] rounded-xl border shadow-2xl flex flex-col" style={{ top: viTriCB.top, left: viTriCB.left, background: NEN_CARD, borderColor: VIEN, maxHeight: "min(72vh, 560px)" }} role="dialog" aria-label="Chỉ báo">
          <div className="p-2 border-b" style={{ borderColor: VIEN }}>
            <input value={timCB} onChange={(e) => setTimCB(e.target.value)} placeholder="Tìm chỉ báo…" autoFocus className="w-full h-9 px-3 rounded-lg text-[13px] outline-none" style={{ background: "var(--hover-nhe)", color: "var(--chu)", border: `1px solid ${VIEN}`, fontFamily: "'Open Sans', sans-serif" }} />
          </div>
          <div className="overflow-y-auto py-1">
            {nhomMenu.map((nhom) => {
              const ds = dsMenu.filter((x) => x.nhom === nhom && x.nhan.toLowerCase().includes(timCB.trim().toLowerCase()));
              if (!ds.length) return null;
              const dong = !!nhomDong[nhom] && !timCB.trim();
              const soBat = ds.filter((x) => x.bat).length;
              return (
                <div key={nhom}>
                  <button type="button" onClick={() => setNhomDong((c) => ({ ...c, [nhom]: !c[nhom] }))} aria-expanded={!dong} className="w-full flex items-center gap-2 px-3 h-8 text-[12px] cursor-pointer hover:bg-[color:var(--hover-nhe)] text-left" style={{ color: MUTED, fontFamily: "'Open Sans', sans-serif", fontWeight: 600 }}>
                    <ChevronDown size={14} strokeWidth={2.5} style={{ transform: dong ? "rotate(-90deg)" : undefined, transition: "transform .15s" }} />
                    <span className="flex-1">{nhom}</span>
                    {soBat > 0 && <span className="text-[10px] px-1.5 rounded-full" style={{ background: "rgba(108,92,231,0.28)", color: TEXT }}>{soBat}</span>}
                  </button>
                  {!dong && ds.map((x) => (
                    <button key={x.khoa} type="button" data-may={x.may} onClick={x.bam} aria-pressed={x.bat} className="w-full flex items-center gap-3 px-3 h-9 text-[13px] cursor-pointer hover:bg-[color:var(--hover-nhe)] text-left" style={{ color: x.bat ? TEXT : "var(--chu)", fontFamily: "'Open Sans', sans-serif", fontWeight: x.bat ? 600 : 400 }}>
                      <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: x.mau, opacity: x.bat ? 1 : 0.45 }} />
                      <span className="flex-1 truncate">{x.nhan}</span>
                      {x.bat && <Check size={16} strokeWidth={2.5} style={{ color: PRIMARY }} />}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}

      {bat.nenNhat && (
        <div className="px-3 py-2 border-b" style={{ borderColor: VIEN }} data-may="mau-hinh-nen" aria-label="Mẫu hình nến Nhật">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ fontFamily: "'Open Sans', sans-serif", color: MUTED }}>
            <span style={{ color: TEXT, fontWeight: 600 }}>Mẫu hình nến ({dsNenNhat.length} trên 120 nến gần nhất)</span>
            <span style={{ color: XANH }}>▲ đảo chiều tăng</span>
            <span style={{ color: DO }}>▼ đảo chiều giảm</span>
            {dsNenNhat.slice(-6).reverse().map((m) => {
              const tk = THONG_KE_MAU_HINH_NEN[m.khoa];
              return (
                <span key={`${m.khoa}-${m.i}`} style={{ color: m.huong > 0 ? XANH : m.huong < 0 ? DO : MUTED }} title={tk ? `Lịch sử: sau 10 phiên lãi TB ${tk.r10.toFixed(1).replace(".", ",")}% theo hướng mẫu hình (cơ sở ${tk.cs10.toFixed(1).replace(".", ",")}%, ${tk.n} lần)` : undefined}>
                  {nhanThoiGian(m.t)} {m.ten}
                </span>
              );
            })}
          </div>
          <p className="text-[11px] mt-1" style={{ color: MUTED, fontFamily: "'Open Sans', sans-serif" }}>
            Mẫu hình đảo chiều chỉ tính sau nhịp giảm (tăng) hoặc nhịp tăng (giảm). Thống kê 11 năm trên ~390 mã: hầu hết mẫu hình nến <b>không hơn</b> việc mua / bán ngẫu nhiên (chỉ &quot;Búa ngược&quot; và &quot;Ba chàng lính&quot; nhỉnh hơn) — dùng để xác nhận cùng các tín hiệu khác, không phải tín hiệu mua bán riêng.
          </p>
        </div>
      )}

      {bat.mauHinh && (
        <div className="px-3 py-2 border-b" style={{ borderColor: VIEN }} data-may="mau-hinh" aria-label="Nhận diện mẫu hình giá">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] mr-1" style={{ color: MUTED, fontFamily: "'Open Sans', sans-serif" }}>
              Mẫu hình ({khungTG === "W" ? "khung tuần" : khungTG === "MO" ? "khung tháng" : noiNgay ? `khung ${KHUNG_CHON.find((k) => k.khoa === khungTG).nhan.toLowerCase()}` : "khung ngày"}) — ⏳ đang hình thành · ▲▼ đã phá vỡ. Bấm để vẽ lên hình:
            </span>
            {dsMauHinh.length === 0 && (
              <span className="text-xs" style={{ color: MUTED }}>
                {dangTai ? "Đang tải…" : "Không thấy mẫu hình nào trong dữ liệu này."}
              </span>
            )}
            {dsMauHinh.map((m, k) => {
              const chon = k === idxMH;
              const dangHT = m.trangThai === "dang_hinh_thanh";
              const mau = m.huong > 0 ? XANH : m.huong < 0 ? DO : "#F6C544";
              return (
                <button
                  key={`${m.khoa}|${m.trangThai ?? "xong"}|${m.i}`}
                  type="button"
                  onClick={() => setChonMH({ khoa, idx: chon ? -1 : k })}
                  aria-pressed={chon}
                  className="px-2.5 py-1 rounded-md text-xs cursor-pointer"
                  style={{ background: chon ? "rgba(246,197,68,0.16)" : "transparent", border: `1px ${dangHT ? "dashed" : "solid"} ${chon ? "#F6C544" : VIEN}`, color: chon ? TEXT : MUTED, fontFamily: "'Open Sans', sans-serif" }}
                >
                  {dangHT ? <span>⏳</span> : <span style={{ color: mau }}>{m.huong > 0 ? "▲" : "▼"}</span>} {m.ten} ·{" "}
                  {dangHT ? `cách mức phá vỡ ${soVN(m.cachPhaVoPct, 1)}%` : m.cach === 0 ? (khungTG === "W" ? "tuần này" : khungTG === "MO" ? "tháng này" : noiNgay ? "nến này" : "hôm nay") : `${m.cach} ${khungTG === "W" ? "tuần" : khungTG === "MO" ? "tháng" : noiNgay ? "nến" : "phiên"} trước`}
                </button>
              );
            })}
          </div>
          {mauHinhVe && mauHinhVe.trangThai === "dang_hinh_thanh" && (
            <div className="mt-2 text-xs leading-relaxed" style={{ color: MUTED, fontFamily: "'Open Sans', sans-serif" }}>
              <span style={{ color: TEXT, fontWeight: 600 }}>⏳ {mauHinhVe.ten} (đang hình thành, chưa phá vỡ)</span> — {mauHinhVe.ghiChu}. Giá hiện tại {soVN(mauHinhVe.gia, 2, true)}.{" "}
              {mauHinhVe.kichBan.map((k) => (
                <span key={k.huong} className="mr-2">
                  Nếu phá vỡ <span style={{ color: k.huong > 0 ? XANH : DO }}>{k.huong > 0 ? "lên" : "xuống"}</span> (đóng cửa {k.huong > 0 ? "trên" : "dưới"} {soVN(k.mucPhaVo, 2, true)}): mục tiêu <span style={{ color: XANH }}>{soVN(k.mucTieu, 2, true)}</span>, cắt lỗ{" "}
                  <span style={{ color: DO }}>{soVN(k.catLo, 2, true)}</span>.
                </span>
              ))}
              <br />
              Thống kê lịch sử (khung ngày, 390 mã): các mẫu hình ở trạng thái đang hình thành chỉ phá vỡ đúng hướng trong 20 phiên tiếp theo khoảng 40–50% trường hợp, và khoảng 30–55% chạm cắt lỗ trước (gần ngang ngửa tung đồng xu). Chưa phá vỡ thì chưa phải tín hiệu. Chỉ để tham khảo, không phải khuyến nghị mua bán.{noiNgay ? " Thống kê trên là của khung ngày; khung nhỏ chưa được kiểm chứng và nhiễu hơn." : ""}
            </div>
          )}
          {mauHinhVe && mauHinhVe.trangThai !== "dang_hinh_thanh" && (
            <div className="mt-2 text-xs leading-relaxed" style={{ color: MUTED, fontFamily: "'Open Sans', sans-serif" }}>
              <span style={{ color: TEXT, fontWeight: 600 }}>{mauHinhVe.ten}</span> — phá vỡ {nhanThoiGian(mauHinhVe.t)} tại {soVN(mauHinhVe.gia, 2, true)}; mục tiêu đo từ mẫu hình{" "}
              <span style={{ color: XANH }}>{soVN(mauHinhVe.mucTieu, 2, true)}</span>, cắt lỗ theo mẫu hình <span style={{ color: DO }}>{soVN(mauHinhVe.catLo, 2, true)}</span> (lãi/lỗ tiềm năng{" "}
              {(((mauHinhVe.huong > 0 ? mauHinhVe.mucTieu - mauHinhVe.gia : mauHinhVe.gia - mauHinhVe.mucTieu) / Math.abs(mauHinhVe.gia - mauHinhVe.catLo)) || 0).toFixed(1).replace(".", ",")}R).{" "}
              {(() => {
                const tk = THONG_KE_MAU_HINH[mauHinhVe.khoa];
                return tk ? (
                  <>
                    Thống kê lịch sử (390 mã, 11 năm, khung ngày): chạm mục tiêu trước cắt lỗ {String(tk.tc).replace(".", ",")}% (đường ngẫu nhiên {String(tk.nn).replace(".", ",")}%); sau 10 phiên giá {mauHinhVe.huong > 0 ? "tăng" : "giảm"} TB{" "}
                    {String(tk.r10).replace(".", ",")}% (thị trường chung +0,7%).{" "}
                  </>
                ) : null;
              })()}
              Chỉ để tham khảo, không phải khuyến nghị mua bán.
            </div>
          )}
        </div>
      )}

      {hienVe && (
        <>
        {/* THANH CONG CU KE VE: chon cong cu roi bam / bam hai lan len bieu do; bam vao hinh de chon, keo diem dau mut de sua, Delete de xoa; Esc huy. */}
        <div className={`flex items-center gap-x-1.5 gap-y-1.5 px-3 py-2 border-b ${toanMH ? "shrink-0 overflow-x-auto flex-nowrap [&>*]:shrink-0" : "flex-wrap max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:[&>*]:shrink-0 max-sm:[scrollbar-width:none]"}${veDoc ? " md:hidden" : ""}`} style={{ borderColor: VIEN }} data-may="cong-cu-ve">
          <span className="text-[11px] mr-1 hidden sm:inline" style={{ color: MUTED, fontFamily: "'Open Sans', sans-serif" }}>
            Công cụ vẽ
          </span>
          <button
            type="button"
            onClick={() => setCongCuState(null)}
            aria-pressed={congCu === null}
            title="Con trỏ: kéo, thu phóng biểu đồ; bấm vào hình vẽ để chọn"
            className="px-2.5 py-1 rounded-md text-xs cursor-pointer flex items-center gap-1.5"
            style={{ background: congCu === null ? "rgba(108,92,231,0.18)" : "transparent", border: `1px solid ${congCu === null ? PRIMARY : VIEN}`, color: congCu === null ? TEXT : MUTED, fontFamily: "'Open Sans', sans-serif" }}
          >
            <MousePointer2 size={13} strokeWidth={2} />
            Con trỏ
          </button>
          {CONG_CU_VE_GOC.map(({ khoa: k, nhan, Icon, goiY }) => (
            <button
              key={k}
              type="button"
              onClick={() => setCongCuState((c) => (c === k ? null : k))}
              aria-pressed={congCu === k}
              title={`${nhan}: ${goiY || "bấm 2 lần (hoặc bấm - kéo - thả) lên biểu đồ để vẽ"}`}
              className="px-2.5 py-1 rounded-md text-xs cursor-pointer flex items-center gap-1.5"
              style={{ background: congCu === k ? "rgba(108,92,231,0.18)" : "transparent", border: `1px solid ${congCu === k ? PRIMARY : VIEN}`, color: congCu === k ? TEXT : MUTED, fontFamily: "'Open Sans', sans-serif" }}
            >
              {Icon ? <Icon size={13} strokeWidth={2} /> : <span className="text-[11px] font-bold leading-none">Fib</span>}
              {nhan}
            </button>
          ))}
          <span className="w-px h-4 mx-1" style={{ background: VIEN }} aria-hidden="true" />
          <div className="flex items-center gap-1" aria-label="Màu nét vẽ">
            {MAU_VE.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMauVe(m)}
                aria-label={`Màu ${m}`}
                aria-pressed={mauVe === m}
                className="w-4 h-4 rounded-full cursor-pointer"
                style={{ background: m, outline: mauVe === m ? `2px solid ${TEXT}` : "none", outlineOffset: 1 }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setGiuCongCu((v) => !v)}
            aria-pressed={giuCongCu}
            title="Giữ công cụ: vẽ xong vẫn giữ công cụ đang chọn để vẽ tiếp (Esc để thoát)"
            className="px-2.5 py-1 rounded-md text-xs cursor-pointer flex items-center gap-1.5"
            style={{ background: giuCongCu ? "rgba(108,92,231,0.18)" : "transparent", border: `1px solid ${giuCongCu ? PRIMARY : VIEN}`, color: giuCongCu ? TEXT : MUTED, fontFamily: "'Open Sans', sans-serif" }}
          >
            {giuCongCu ? <Lock size={13} strokeWidth={2} /> : <LockOpen size={13} strokeWidth={2} />}
            Giữ công cụ
          </button>
          <button
            type="button"
            onClick={() => setHitGia((v) => !v)}
            aria-pressed={hitGia}
            title="Hít giá: điểm vẽ tự bám vào Mở / Cao / Thấp / Đóng của nến gần nhất"
            className="px-2.5 py-1 rounded-md text-xs cursor-pointer flex items-center gap-1.5"
            style={{ background: hitGia ? "rgba(108,92,231,0.18)" : "transparent", border: `1px solid ${hitGia ? PRIMARY : VIEN}`, color: hitGia ? TEXT : MUTED, fontFamily: "'Open Sans', sans-serif" }}
          >
            <Magnet size={13} strokeWidth={2} />
            Hít giá
          </button>
          <button
            type="button"
            disabled={!lichSuVe.coHoanTac}
            onClick={() => veRef.current?.lopVe.hoanTac()}
            title="Hoàn tác (Ctrl+Z)"
            className="px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5"
            style={{ border: `1px solid ${VIEN}`, color: MUTED, opacity: lichSuVe.coHoanTac ? 1 : 0.45, cursor: lichSuVe.coHoanTac ? "pointer" : "default", fontFamily: "'Open Sans', sans-serif" }}
          >
            <Undo2 size={13} strokeWidth={2} />
            Hoàn tác
          </button>
          <button
            type="button"
            disabled={!lichSuVe.coLamLai}
            onClick={() => veRef.current?.lopVe.lamLai()}
            title="Làm lại (Ctrl+Y hoặc Ctrl+Shift+Z)"
            className="px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5"
            style={{ border: `1px solid ${VIEN}`, color: MUTED, opacity: lichSuVe.coLamLai ? 1 : 0.45, cursor: lichSuVe.coLamLai ? "pointer" : "default", fontFamily: "'Open Sans', sans-serif" }}
          >
            <Redo2 size={13} strokeWidth={2} />
            Làm lại
          </button>
          <button
            type="button"
            onClick={doiVeMoiKhung}
            aria-pressed={veMoiKhung}
            title={veMoiKhung ? "Hình vẽ mới đang hiện ở mọi khung thời gian. Bấm để hình mới chỉ hiện ở khung đang vẽ" : "Hình vẽ mới chỉ hiện ở khung đang vẽ. Bấm để hình mới hiện ở mọi khung thời gian"}
            className="px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 cursor-pointer"
            style={{ border: `1px solid ${VIEN}`, color: veMoiKhung ? TEXT : MUTED, background: veMoiKhung ? "rgba(108,92,231,0.18)" : undefined, fontFamily: "'Open Sans', sans-serif" }}
          >
            <Layers size={13} strokeWidth={2} />
            Hình mới: {veMoiKhung ? "mọi khung" : "khung này"}
          </button>
          <button
            type="button"
            disabled={!chonVe}
            onClick={doiKhungHinhChon}
            title="Hình đang chọn: chỉ hiện ở khung này hoặc hiện ở mọi khung"
            className="px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5"
            style={{ border: `1px solid ${VIEN}`, color: chonVe ? TEXT : MUTED, opacity: chonVe ? 1 : 0.45, cursor: chonVe ? "pointer" : "default", fontFamily: "'Open Sans', sans-serif" }}
          >
            <Frame size={13} strokeWidth={2} />
            {chonVe && chonVeMoiKhung ? "Chỉ hiện khung này" : "Hiện mọi khung"}
          </button>
          <button
            type="button"
            disabled={!chonVe}
            onClick={() => veRef.current?.lopVe.xoaChon()}
            title="Xóa hình đang chọn (phím Delete)"
            className="px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5"
            style={{ border: `1px solid ${VIEN}`, color: chonVe ? DO : MUTED, opacity: chonVe ? 1 : 0.45, cursor: chonVe ? "pointer" : "default", fontFamily: "'Open Sans', sans-serif" }}
          >
            <Trash2 size={13} strokeWidth={2} />
            Xóa hình
          </button>
          <button
            type="button"
            disabled={soHinhVe === 0}
            onClick={() => {
              if (soHinhVe > 0 && window.confirm(`Xóa tất cả ${soHinhVe} hình vẽ đang hiện của ${ma} ở khung này?`)) veRef.current?.lopVe.xoaHet();
            }}
            title="Xóa tất cả hình vẽ của mã này"
            className="px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5"
            style={{ border: `1px solid ${VIEN}`, color: MUTED, opacity: soHinhVe > 0 ? 1 : 0.45, cursor: soHinhVe > 0 ? "pointer" : "default", fontFamily: "'Open Sans', sans-serif" }}
          >
            <PenLine size={13} strokeWidth={2} />
            Xóa hết{soHinhVe > 0 ? ` (${soHinhVe})` : ""}
          </button>
        </div>

        {/* Dong goi y luon hien, cao co dinh: neu chi hien khi chon cong cu thi bieu do bi day xuong, lech vi tri con tro */}
        <div className={`px-3 h-7 flex items-center text-[11px] border-b truncate${veDoc ? " md:hidden" : ""}`} style={{ borderColor: VIEN, color: congCu ? TEXT : MUTED, fontFamily: "'Open Sans', sans-serif" }}>
          {congCu ? (
            <span>
              {congCu === "gapKhuc" ? (
                <>Đường dẫn: bấm <b>chuột trái</b> để thêm từng đoạn, <b>chuột phải</b> (hoặc bấm đúp / Enter) để kết thúc. </>
              ) : congCu === "frvp" ? (
                <>Volume Profile vùng chọn: bấm nến <b>bắt đầu</b> rồi bấm nến <b>kết thúc</b> (hoặc bấm - kéo - thả). </>
              ) : (
                <>Đang vẽ: bấm 2 lần hoặc bấm - kéo - thả. </>
              )}
              Giữ <b>Space</b> để kéo biểu đồ, <b>Esc</b> để thoát.
            </span>
          ) : (
            <span>
              Chọn công cụ để vẽ. Bấm vào hình để chọn (chuột phải cũng được), kéo để di chuyển; <b>Ctrl+Z</b> hoàn tác, <b>Delete</b> xóa.
            </span>
          )}
        </div>
        </>
      )}
      {thongTin && !toanMH && (
        <div className={`${boCucRong ? "xl:hidden" : "min-[1340px]:hidden"} px-3 py-2 border-b`} style={{ borderColor: VIEN }}>
          <BangThongTinBieuDo tt={thongTin} />
        </div>
      )}
      <div className={toanMH ? "flex flex-1 min-h-0" : chieuNgang ? "flex" : ""}>
      {veDoc && (
        <ThanhVeTrai
          congCu={congCu}
          chonCongCu={(k) => setCongCuState((c) => (k === null ? null : c === k ? null : k))}
          giuCongCu={giuCongCu}
          setGiuCongCu={setGiuCongCu}
          hitGia={hitGia}
          setHitGia={setHitGia}
          chonVe={chonVe}
          xoaChon={() => veRef.current?.lopVe.xoaChon()}
          soHinhVe={soHinhVe}
          xoaHet={() => {
            if (soHinhVe > 0 && window.confirm(`Xóa tất cả ${soHinhVe} hình vẽ đang hiện của ${ma} ở khung này?`)) veRef.current?.lopVe.xoaHet();
          }}
          mauVe={mauVe}
          setMauVe={setMauVe}
          cao={toanMH ? undefined : chieuCaoTong}
          anHet={anHet}
          setAnHet={setAnHet}
          khoaHet={khoaHet}
          setKhoaHet={setKhoaHet}
          veMoiKhung={veMoiKhung}
          doiVeMoiKhung={doiVeMoiKhung}
          chonVeMoiKhung={chonVeMoiKhung}
          doiKhungHinhChon={doiKhungHinhChon}
        />
      )}
      <div className={toanMH || chieuNgang ? "relative flex-1 min-w-0" : "relative"} style={toanMH ? undefined : { height: chieuCaoTong }}>
        <div ref={khungRef} className="absolute inset-0" />
        {datCB && (
          <div className="absolute left-1/2 -translate-x-1/2 top-10 z-10 text-[12px] rounded-md px-3 py-1.5 pointer-events-none" style={{ background: "rgba(245,158,11,0.95)", color: "#111", fontFamily: "'Open Sans', sans-serif" }}>
            Bấm lên biểu đồ tại mức giá muốn được báo (Esc / bấm lại nút để huỷ)
          </div>
        )}
        {thongBaoCB && (
          <div role="status" className="absolute left-1/2 -translate-x-1/2 top-10 z-20 text-[13px] rounded-md pl-3 pr-1 py-1 flex items-center gap-2 shadow-lg" style={{ background: "#F59E0B", color: "#111", fontFamily: "'Open Sans', sans-serif", fontWeight: 600 }}>
            <Bell size={15} /> Chạm mức cảnh báo: {thongBaoCB}
            <button type="button" onClick={() => setThongBaoCB(null)} aria-label="Đóng" className="w-6 h-6 rounded inline-flex items-center justify-center cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}
        {moCB && (
          <div className="absolute top-2 left-14 z-20 w-[300px] max-w-[calc(100%-24px)] rounded-lg border shadow-xl p-3 text-[12px]" style={{ background: NEN_CARD, borderColor: VIEN, color: TEXT, fontFamily: "'Open Sans', sans-serif" }}>
            <div className="flex items-center justify-between mb-2">
              <b className="text-[13px]">Cảnh báo giá</b>
              <button type="button" onClick={() => setMoCB(false)} aria-label="Đóng" className="w-6 h-6 rounded inline-flex items-center justify-center cursor-pointer hover:bg-[color:var(--hover-nhe)]" style={{ color: MUTED }}>
                <X size={14} />
              </button>
            </div>
            <button type="button" onClick={() => { setDatCB(true); setMoCB(false); }} className="w-full h-8 rounded-md inline-flex items-center justify-center gap-1.5 cursor-pointer font-semibold" style={{ background: PRIMARY, color: "#fff" }}>
              <BellPlus size={15} /> Đặt cảnh báo cho {ma} (bấm lên biểu đồ)
            </button>
            {canhBao.length > 0 ? (
              <ul className="mt-2 max-h-56 overflow-y-auto divide-y" style={{ borderColor: VIEN }}>
                {[...canhBao].sort((a, b) => (a.ma === ma ? -1 : 0) - (b.ma === ma ? -1 : 0) || a.ma.localeCompare(b.ma) || b.gia - a.gia).map((c) => (
                  <li key={c.id} className="flex items-center gap-2 py-1.5" style={{ borderColor: VIEN }}>
                    <b className="w-14 shrink-0" style={{ color: c.ma === ma ? TEXT : MUTED }}>{c.ma}</b>
                    <span className="tabular-nums flex-1">{c.huong === "len" ? "≥" : "≤"} {soVN(c.gia, 2, true)}</span>
                    <span className="text-[11px]" style={{ color: c.daBao ? MUTED : "#F59E0B" }}>{c.daBao ? "đã báo" : "đang chờ"}</span>
                    <button type="button" onClick={() => luuCanhBao(docCanhBao().filter((x) => x.id !== c.id))} aria-label={`Xoá cảnh báo ${c.ma} ${c.gia}`} className="w-6 h-6 rounded inline-flex items-center justify-center cursor-pointer hover:bg-[color:var(--hover-nhe)]" style={{ color: MUTED }}>
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2" style={{ color: MUTED }}>Chưa có cảnh báo nào.</p>
            )}
            {canhBao.some((c) => c.daBao) && (
              <button type="button" onClick={() => luuCanhBao(docCanhBao().filter((x) => !x.daBao))} className="mt-1 text-[11px] underline cursor-pointer" style={{ color: MUTED }}>
                Xoá các cảnh báo đã báo
              </button>
            )}
            <p className="mt-2 text-[11px] leading-snug" style={{ color: MUTED }}>
              Kéo đường vàng trên biểu đồ để đổi mức giá. Cảnh báo lưu trên trình duyệt này và chỉ báo khi có một trang Biểu đồ đang mở (kiểm tra khoảng mỗi phút trong phiên). Cho phép thông báo để nhận cả khi đang ở tab khác.
            </p>
          </div>
        )}
        {ssMa.length > 0 && (
          <div className="absolute top-1.5 right-[72px] z-10 flex items-center gap-1 flex-wrap justify-end max-w-[70%] pointer-events-auto" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            {ssPct[""] != null && (
              <span className="text-[11px] px-1.5 h-7 inline-flex items-center gap-1 rounded-md tabular-nums" style={{ color: TEXT, background: `color-mix(in srgb, ${NEN_CARD} 85%, transparent)` }} title="Thay đổi trong khung nhìn">
                {ma} <b style={{ color: ssPct[""] >= 0 ? XANH : DO }}>{pctVN(ssPct[""], 1)}</b>
              </span>
            )}
            {ssMa.map((m, k) => (
              <span key={m} className="inline-flex items-center gap-1 h-7 pl-2 pr-1 rounded-md text-[11px] tabular-nums" style={{ border: `1px solid ${MAU_SO_SANH[k % MAU_SO_SANH.length]}`, color: TEXT, background: `color-mix(in srgb, ${NEN_CARD} 85%, transparent)` }}>
                <span style={{ color: MAU_SO_SANH[k % MAU_SO_SANH.length], fontWeight: 700 }}>{m}</span>
                {ssPct[m] != null ? <b style={{ color: ssPct[m] >= 0 ? XANH : DO }}>{pctVN(ssPct[m], 1)}</b> : ssDuLieu[`${m}|${khungTG}`]?.length === 0 ? <span style={{ color: MUTED }}>không có dữ liệu</span> : null}
                <button type="button" onClick={() => setSsMa((d) => d.filter((x) => x !== m))} aria-label={`Bỏ so sánh ${m}`} className="w-5 h-5 rounded inline-flex items-center justify-center cursor-pointer hover:bg-[color:var(--hover-nhe)]" style={{ color: MUTED }}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        {chonTua && !tuaHien && (
          <div className="absolute left-1/2 -translate-x-1/2 top-10 z-10 text-[12px] rounded-md px-3 py-1.5 pointer-events-none" style={{ background: "rgba(108,92,231,0.92)", color: "#fff", fontFamily: "'Open Sans', sans-serif" }}>
            Bấm vào nến muốn bắt đầu tua lại (các nến sau đó sẽ bị ẩn)
          </div>
        )}
        {tuaHien && nen && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-9 z-10 flex items-center gap-1 rounded-lg border px-1.5 py-1 shadow-lg whitespace-nowrap max-w-[calc(100%-16px)] overflow-x-auto" style={{ background: NEN_CARD, borderColor: VIEN, fontFamily: "'Open Sans', sans-serif" }}>
            <button type="button" onClick={() => setTua((t) => ({ ...t, chay: !t.chay }))} title={tuaHien.chay ? "Tạm dừng" : "Phát"} aria-label={tuaHien.chay ? "Tạm dừng" : "Phát"} className="w-8 h-8 rounded-md inline-flex items-center justify-center cursor-pointer hover:bg-[color:var(--hover-nhe)]" style={{ color: TEXT }}>
              {tuaHien.chay ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button type="button" onClick={() => setTua((t) => ({ ...t, chay: false, cut: Math.min(t.cut + 1, (nenDu?.length ?? 1) - 1) }))} title="Tiến 1 nến" aria-label="Tiến 1 nến" className="w-8 h-8 rounded-md inline-flex items-center justify-center cursor-pointer hover:bg-[color:var(--hover-nhe)]" style={{ color: TEXT }}>
              <StepForward size={16} />
            </button>
            <select value={tuaHien.tocDo} onChange={(e) => setTua((t) => ({ ...t, tocDo: Number(e.target.value) }))} aria-label="Tốc độ phát" className="h-8 rounded-md px-1 text-[12px] cursor-pointer" style={{ background: NEN_CARD, color: TEXT, border: `1px solid ${VIEN}` }}>
              {[1, 2, 5, 10].map((v) => (
                <option key={v} value={v}>
                  {v} nến/giây
                </option>
              ))}
            </select>
            <button type="button" onClick={() => setChonTua(true)} title="Chọn lại điểm bắt đầu" className="h-8 px-2 rounded-md text-[12px] cursor-pointer hover:bg-[color:var(--hover-nhe)]" style={{ color: MUTED }}>
              Chọn lại
            </button>
            <span className="text-[12px] px-1.5 tabular-nums" style={{ color: MUTED }}>
              {nhanThoiGian(nen[nen.length - 1].t)} · còn {(nenDu?.length ?? 0) - nen.length} nến
            </span>
            <button type="button" onClick={() => setTua(null)} title="Thoát tua lại" aria-label="Thoát tua lại" className="w-8 h-8 rounded-md inline-flex items-center justify-center cursor-pointer hover:bg-[color:var(--hover-nhe)]" style={{ color: MUTED }}>
              <X size={16} />
            </button>
          </div>
        )}
        {veDoc && congCu && (
          <div className="hidden md:block absolute left-3 bottom-8 z-10 pointer-events-none text-[11px] rounded px-2 py-1" style={{ background: `color-mix(in srgb, ${NEN_CARD} 85%, transparent)`, color: TEXT, fontFamily: "'Open Sans', sans-serif" }}>
            {congCu === "gapKhuc" ? "Đường dẫn: chuột trái thêm đoạn, chuột phải / bấm đúp để kết thúc." : congCu === "frvp" ? "Bấm nến bắt đầu rồi nến kết thúc (hoặc kéo - thả)." : congCu === "fibMoRong" ? "Bấm 3 điểm: A (đầu nhịp), B (cuối nhịp), C (điểm hồi)." : congCu === "kenh" ? "Bấm 3 điểm để vẽ kênh." : "Bấm 2 lần hoặc bấm - kéo - thả để vẽ."} Esc để thoát.
          </div>
        )}
        {thongTin && !toanMH && !boCucRong && (
          <div className="hidden min-[1340px]:block absolute right-[76px] top-2 z-10 pointer-events-none">
            <BangThongTinBieuDo tt={thongTin} />
          </div>
        )}
        {hienTai && (
          <div
            className="absolute left-3 top-2 z-10 pointer-events-none text-[11px] leading-5 flex flex-wrap gap-x-3 rounded px-1.5"
            style={{ fontFamily: "'Open Sans', sans-serif", color: MUTED, background: `color-mix(in srgb, ${NEN_CARD} 78%, transparent)` }}
          >
            <b style={{ color: TEXT, fontFamily: "'Open Sans', sans-serif" }}>{ma}</b>
            <span>{nhanThoiGian(hienTai.t)}</span>
            <span>
              M <b style={{ color: TEXT }}>{fmt(hienTai.o)}</b>
            </span>
            <span>
              C <b style={{ color: TEXT }}>{fmt(hienTai.h)}</b>
            </span>
            <span>
              T <b style={{ color: TEXT }}>{fmt(hienTai.l)}</b>
            </span>
            <span>
              Đ <b style={{ color: mauDoi }}>{fmt(hienTai.c)}</b>
            </span>
            {doiPct != null && <b style={{ color: mauDoi }}>{pctVN(doiPct, 2)}</b>}
            <span>
              KL <b style={{ color: TEXT }}>{chuoiKL(hienTai.v)}</b>
            </span>
          </div>
        )}
        {dsDangBat.length > 0 && (
          <div className="hidden sm:flex absolute left-3 top-[34px] z-10 flex-col items-start gap-0.5 text-[11px]" style={{ fontFamily: "'Open Sans', sans-serif" }} aria-label="Chỉ báo đang bật">
            {dsDangBat.map((x) => (
              <span key={x.khoa} className="group inline-flex items-center gap-1.5 rounded px-1.5 h-5" style={{ color: MUTED, background: `color-mix(in srgb, ${NEN_CARD} 78%, transparent)`, opacity: x.an ? 0.55 : 1 }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: x.mau }} />
                {x.nhan}
                {x.khoa === "mlst" && chiBaoPhu?.mlstTT && (
                  <b style={{ color: chiBaoPhu.mlstTT.huong === 1 ? MLST_LEN : MLST_XUONG }}>
                    {chiBaoPhu.mlstTT.huong === 1 ? "Tăng" : "Giảm"} · biến động {chiBaoPhu.mlstTT.so} ({["", "thấp", "vừa", "cao"][chiBaoPhu.mlstTT.so]})
                  </b>
                )}
                <button type="button" onClick={() => doiAn(x.khoa)} aria-label={x.an ? `Hiện ${x.nhan}` : `Ẩn ${x.nhan}`} title={x.an ? `Hiện ${x.nhan}` : `Ẩn ${x.nhan} (vẫn giữ trong danh sách)`} className={`${x.an ? "inline-flex" : "hidden group-hover:inline-flex"} items-center justify-center w-3.5 h-3.5 rounded cursor-pointer hover:text-[color:var(--chu)]`}>
                  {x.an ? <EyeOff size={12} strokeWidth={2} /> : <Eye size={12} strokeWidth={2} />}
                </button>
                {CO_CAI_DAT(x.khoa) && (
                  <button type="button" onClick={() => setMoCaiDat(x.khoa)} aria-label={`Cài đặt ${x.nhan}`} title={`Cài đặt ${x.nhan}`} className="hidden group-hover:inline-flex items-center justify-center w-3.5 h-3.5 rounded cursor-pointer hover:text-[color:var(--chu)]">
                    <Settings size={12} strokeWidth={2} />
                  </button>
                )}
                <button type="button" onClick={x.bam} aria-label={`Tắt ${x.nhan}`} title={`Tắt ${x.nhan}`} className="hidden group-hover:inline-flex items-center justify-center w-3.5 h-3.5 rounded cursor-pointer hover:text-[color:var(--chu)]">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {moCaiDat && <CaiDatChiBao key={moCaiDat} khoa={moCaiDat} cd={caiDat} nhan={dsMenu.find((x) => x.khoa === moCaiDat)?.nhan ?? moCaiDat} onLuu={luuCaiDat} onDong={() => setMoCaiDat(null)} />}
        {(dangTai || loi) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 text-sm" style={{ background: "color-mix(in srgb, var(--card) 85%, transparent)", color: MUTED }}>
            {dangTai && <span>Đang tải biểu đồ…</span>}
            {loi && (
              <>
                <span style={{ color: DO }}>{loi}</span>
                <button
                  type="button"
                  onClick={() => setLanThu((x) => x + 1)}
                  className="px-3 py-1.5 rounded-md text-xs cursor-pointer"
                  style={{ background: "#6C5CE7", color: "#FFFFFF" }}
                >
                  Thử lại
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {benPhai && (
        <aside className="hidden xl:flex w-[300px] shrink-0 flex-col gap-3 overflow-y-auto border-l p-3" style={{ borderColor: VIEN, height: chieuCaoTong }} aria-label="Thông tin mã">
          <PanelBenPhaiBieuDo ma={ma}>{noiDungThongTin}</PanelBenPhaiBieuDo>
        </aside>
      )}
      {toanMH && (
        <aside className="hidden md:flex w-[300px] shrink-0 flex-col gap-3 overflow-y-auto border-l p-3" style={{ borderColor: VIEN }} aria-label="Thông tin mã">
          <PanelBenPhaiBieuDo ma={ma}>{noiDungThongTin}</PanelBenPhaiBieuDo>
          <p className="text-[11px] leading-relaxed" style={{ color: MUTED }}>Esc: thu nhỏ. Chỉ để tham khảo, không phải khuyến nghị mua bán.</p>
        </aside>
      )}
      </div>

      {/* 10/11/2026: doan ghi chu dai (cach tinh chi bao, phan ky, Volume Profile...) thu vao 1 dong mo / dong - bieu do kieu FireAnt khong co khoi chu duoi bieu do. */}
      {!toanMH && (
      <div className="px-3 py-2 border-t" style={{ borderColor: VIEN }}>
      <GiaiThichThem nhanMo="Ghi chú dữ liệu và chỉ báo">
        <p style={{ color: MUTED }}>
        Giá đã điều chỉnh cổ tức/thưởng cổ phiếu (giống dữ liệu AmiBroker), khối lượng khớp lệnh; chỉ báo tính giống hệ thống tín hiệu (Ichimoku 9-17-33, mây dịch 26
        phiên, đường cân bằng dài hạn 65/129); EMA, Bollinger, RSI, MACD, Stochastic là chỉ báo tham khảo thông dụng. RSI phân kỳ (PK↑ đáy sau thấp hơn nhưng RSI cao hơn; PK↓ đỉnh sau cao hơn nhưng RSI thấp hơn) chỉ xác nhận sau 2 nến (màu xanh / đỏ); nét đứt MÀU VÀNG PK↑? / PK↓? là phân kỳ SỚM: ít điều kiện hơn (RSI chỉ cần cao hơn đáy trước, không cần ≤ 40) hoặc đáy / đỉnh mới chưa đủ 2 nến xác nhận, dễ báo sai hơn. Cả hai chỉ là điều kiện tham khảo, không phải tín hiệu mua bán: thống kê 390 mã cho thấy không có lợi thế riêng lẻ. Volume Profile là ước lượng: khối lượng mỗi nến chia đều theo khoảng giá của nến đó (dùng nến 1 giờ khi có, từ khoảng 10/2023; trước đó dùng nến của biểu đồ), không phải dữ liệu khớp lệnh theo từng mức giá. Hỗ trợ / Kháng cự (KL) là các vùng giá có khối lượng giao dịch lớn trong khoảng 6 tháng gần nhất (nét đậm = vùng lớn), chỉ để tham khảo: kiểm tra lịch sử cho thấy giá giữ được ở các mức này khoảng một nửa số lần. Hình vẽ lưu trên trình duyệt này theo từng mã và khung thời gian. Trong phiên, nến hôm nay cập nhật theo giá khớp thực tế, web tự làm mới mỗi 30 giây, không dùng để đặt lệnh khớp từng giây.
        </p>
      </GiaiThichThem>
      </div>
      )}
    </div>
  );
}
