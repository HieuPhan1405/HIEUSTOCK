"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, createSeriesMarkers, CandlestickSeries, HistogramSeries, LineSeries, CrosshairMode, LineStyle } from "lightweight-charts";
import { MousePointer2, TrendingUp, MoveUpRight, Minus, SeparatorVertical, Square, Ruler, Trash2, Magnet, PenLine, Undo2, Redo2, ArrowUpRight, Type, Equal, Lock, LockOpen, Spline, BarChartHorizontal, Maximize2, Minimize2 } from "lucide-react";
import { tinhIchimoku, tinhIchimokuTuongLai, SO_BUOC_TUONG_LAI, tinhCanBangTuongLai, tinhCanBang, trungBinhDon, THAM_SO_MAC_DINH } from "@/lib/chiBaoKyThuat";
import { ema, rsi, macd, bollinger, stochastic } from "@/lib/chiBaoPhu";
import { phanKyRSI } from "@/lib/phanKyRSI";
import { nhanDienMauHinh, nhanDienDangHinhThanh, THONG_KE_MAU_HINH } from "@/lib/mauHinh";
import { nhanDienMauHinhNen, THONG_KE_MAU_HINH_NEN } from "@/lib/mauHinhNen";
import { LopVe } from "@/components/veBieuDoLop";
import { tinhHoSoKhoiLuong, chonNenChoHoSo, chuanBiNenGio, timDinhKhoiLuong, chonHoTroKhangCu } from "@/lib/volumeProfile";
import { DaiMay, DaiGia } from "@/components/bieuDoPlugin";
import { fmt } from "@/components/dungChung";
import BangThongTinBieuDo from "@/components/BangThongTinBieuDo";
import { dangTrongPhienGiaoDich } from "@/lib/khungGioVaoLenh";
import { soVN, pctVN } from "@/lib/soVN";

// Mau cho phan GIAO DIEN (React) dung bien CSS de doi sang/toi; rieng bieu do ve bang canvas khong doc duoc bien CSS nen lay gia tri that qua mauTheoGiaoDien().
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const PRIMARY = "#4A8AD6";
const XANH = "var(--xanh)";
const DO = "var(--do)";

function mauTheoGiaoDien() {
  const cs = getComputedStyle(document.documentElement);
  const l = (ten) => cs.getPropertyValue(`--${ten}`).trim();
  return { nen: l("card"), mo: l("mo"), vien: l("vien"), luoi: l("vien-nhe"), xanh: l("xanh"), do: l("do"), ma200: l("chu-2") };
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
  s.candle.applyOptions({ upColor: m.xanh, downColor: m.do, wickUpColor: m.xanh, wickDownColor: m.do });
  s.ma200.applyOptions({ color: m.ma200 });
  s.lopVe?.datMauGiaoDien({ mo: m.mo, nen: m.nen });
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
  { khoa: "H", nhan: "1 giờ" },
  { khoa: "M30", nhan: "30 phút" },
  { khoa: "M15", nhan: "15 phút" },
  { khoa: "M5", nhan: "5 phút" },
];
const NEN_MOI_NGAY = { H: 5, M30: 9, M15: 16, M5: 48 };
const BUOC_PHUT = { H: 60, M30: 30, M15: 15, M5: 5 };
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

const CONG_TAT = [
  { khoa: "ichimoku", nhan: "Ichimoku", mau: MAU.kijun },
  { khoa: "canBang", nhan: "Cân bằng dài hạn", mau: MAU.cb1 },
  { khoa: "ma", nhan: "MA 20/50/200", mau: MAU.ma20 },
  { khoa: "ema", nhan: "EMA 9/21", mau: "#22D3EE" },
  { khoa: "boll", nhan: "Bollinger", mau: "#94A3B8" },
  { khoa: "vp", nhan: "Volume Profile", mau: "#F6C544" },
  { khoa: "htkc", nhan: "Hỗ trợ / Kháng cự (KL)", mau: "#38BDF8" },
];
// Ho tro / khang cu THAM KHAO theo khoi luong: dinh khoi luong cua SO_NEN_HTKC nen gan nhat (khung ngay ~6 thang; khung tuan lay 26 tuan)
const SO_NEN_HTKC = { D: 120, W: 26 };
const MAU_HO_TRO = "#22C55E";
const MAU_KHANG_CU = "#EF4444";
// Chi bao PHU o cua so rieng phia duoi (moi chi bao 1 khung): bat / tat bang chip.
const CHI_BAO_PHU = [
  { khoa: "rsi", nhan: "RSI 14", mau: "#A78BFA" },
  { khoa: "macd", nhan: "MACD", mau: "#60A5FA" },
  { khoa: "stoch", nhan: "Stochastic", mau: "#FBBF24" },
];
// RSI phan ky (lib/phanKyRSI.js): 2 day / dinh gia lien tiep nguoc chieu RSI - chi la DIEU KIEN THAM KHAO, nghien cuu 2026-10-16 tren 390 ma cho thay KHONG co loi the thong ke rieng le.
const CHI_BAO_PK = { khoa: "phanKy", nhan: "RSI phân kỳ", mau: "#34D399" };
const SO_PK_HIEN = 8; // chi ve SO_PK_HIEN phan ky gan nhat moi loai (tranh roi bieu do)
const CHIEU_CAO_PHU = 140;

// Cong cu ke ve (components/veBieuDoLop.js)
const CONG_CU_VE = [
  { khoa: "xuHuong", nhan: "Xu hướng", Icon: TrendingUp },
  { khoa: "tia", nhan: "Tia", Icon: MoveUpRight },
  { khoa: "ngang", nhan: "Ngang", Icon: Minus },
  { khoa: "doc", nhan: "Dọc", Icon: SeparatorVertical },
  { khoa: "chuNhat", nhan: "Chữ nhật", Icon: Square },
  { khoa: "fib", nhan: "Fibonacci", Icon: null },
  { khoa: "thuoc", nhan: "Thước đo", Icon: Ruler },
  { khoa: "gapKhuc", nhan: "Đường dẫn", Icon: Spline },
  { khoa: "frvp", nhan: "Volume Profile vùng chọn", Icon: BarChartHorizontal },
  { khoa: "kenh", nhan: "Kênh song song", Icon: Equal },
  { khoa: "mui", nhan: "Mũi tên", Icon: ArrowUpRight },
  { khoa: "chu", nhan: "Ghi chú", Icon: Type },
];
const MAU_VE = ["#F6C544", "#3B9EFF", "#22C55E", "#EF4444", "#E879F9", "#E5E7EB"];
const khoaLuu = (ma, kt) => `cs-ve|${ma}|${kt}`;

// Ngay giao dich ke tiep (bo qua T7/CN; khong biet ngay le) dung de ve "may tuong lai" - chi mang tinh hien thi.
function ngayTuongLai(ngayCuoi, k, tuan) {
  const d = new Date(`${ngayCuoi}T00:00:00Z`);
  if (tuan) {
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

function tinhChiBao(nen, khung) {
  const tuan = khung === "W";
  const n = nen.length;
  const bars = nen.map((b) => ({ h: b.h, l: b.l, c: b.c }));
  const dich = THAM_SO_MAC_DINH.dichMay;
  const thoiGian = nen.map((b) => b.t);
  for (let k = 1; k <= dich + SO_BUOC_TUONG_LAI.spanB; k++) thoiGian.push(laNoiNgay(khung) ? nenNoiNgayKeTiep(thoiGian[thoiGian.length - 1], khung) : ngayTuongLai(nen[n - 1].t, k, tuan)); // dich: may goc; them spanB buoc de ve cham Senkou B tuong lai

  const ich = tinhIchimoku(bars);
  const tl = tinhIchimokuTuongLai(bars);
  const tlCb = tinhCanBangTuongLai(bars);
  const chamTL = (ds, dichThem) => ds.map(({ k, value }) => ({ time: thoiGian[n - 1 + k + dichThem], value })).filter((x) => x.time);
  const cb = tinhCanBang(bars);
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
    ma20: dongMA(20),
    ma50: dongMA(50),
    ma200: dongMA(200),
  };
}

// Chi bao phu (EMA / Bollinger / RSI / MACD / Stochastic) theo dung nen dang hien (khung Ngay hoac Tuan) - cong thuc o lib/chiBaoPhu.js.
function tinhChiBaoPhu(nen) {
  const dong = (mang) => {
    const kq = [];
    mang.forEach((v, i) => {
      if (v != null) kq.push({ time: nen[i].t, value: v });
    });
    return kq;
  };
  const close = nen.map((b) => b.c);
  const bars = nen.map((b) => ({ h: b.h, l: b.l, c: b.c }));
  const bb = bollinger(close, 20, 2);
  const mc = macd(close);
  const st = stochastic(bars);
  return {
    ema9: dong(ema(close, 9)),
    ema21: dong(ema(close, 21)),
    bbTren: dong(bb.tren),
    bbMid: dong(bb.mid),
    bbDuoi: dong(bb.duoi),
    rsi: dong(rsi(close, 14)),
    macd: dong(mc.macd),
    signal: dong(mc.signal),
    hist: mc.hist.map((v, i) => (v == null ? null : { time: nen[i].t, value: v, color: v >= 0 ? "rgba(34,197,94,0.6)" : "rgba(239,68,68,0.6)" })).filter(Boolean),
    stochK: dong(st.k),
    stochD: dong(st.d),
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

function Chip({ bat, onClick, children, mau }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={bat}
      className="px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors flex items-center gap-1.5"
      style={{
        background: bat ? "rgba(74,138,214,0.18)" : "transparent",
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
export default function BieuDoKyThuat({ ma, vung = null, ngayMua = null, chieuCao = 540, thongTin = null, layDayManHinh = false }) {
  const khungRef = useRef(null);
  const veRef = useRef(null);
  const [khungTG, setKhungTG] = useState("D");
  const [bat, setBat] = useState({ ichimoku: true, canBang: true, ma: false, vung: true, ema: false, boll: false, vp: false, htkc: false, rsi: false, macd: false, stoch: false, phanKy: false, mauHinh: false, nenNhat: false });
  const [congCu, setCongCuState] = useState(null); // cong cu ke ve dang chon (null = con tro)
  const [mauVe, setMauVe] = useState(MAU_VE[0]);
  const [hitGia, setHitGia] = useState(false);
  const [giuCongCu, setGiuCongCu] = useState(false);
  const [lichSuVe, setLichSuVe] = useState({ coHoanTac: false, coLamLai: false });
  const rootRef = useRef(null);
  // CHE DO TOAN MAN HINH (kieu TradingView): bieu do chiem het cua so, thanh cong cu gon 1 hang cuon ngang, bang thong tin o cot phai. Esc (khi khong dang chon cong cu ve) de thoat.
  const [toanMH, setToanMH] = useState(false);
  const [caoManHinh, setCaoManHinh] = useState(900);
  // Volume Profile: nen 1 gio (tai khi can), co hinh "frvp" hay khong, va cac tham chieu de ham tinh ho so luon doc du lieu moi nhat
  const [nenGio, setNenGio] = useState({ ma: "", nen: null });
  const [coFrvp, setCoFrvp] = useState(false);
  const duLieuHoSoRef = useRef({ nen: null, nenGio: null, khungTG: "D" });
  const [chonVe, setChonVe] = useState(null);
  const [soHinhVe, setSoHinhVe] = useState(0);
  const khoaVeRef = useRef(null);
  const [ketQua, setKetQua] = useState({ khoa: "", nen: null, loi: null });
  const [lanThu, setLanThu] = useState(0);
  const [chuThich, setChuThich] = useState(null);
  const [kieuMau, setKieuMau] = useState(0); // tang moi khi doi che do sang/toi de ve lai cac phan tu co mau rieng (vd mui ten MUA)

  const khoa = `${ma}|${khungTG}`;
  const noiNgay = laNoiNgay(khungTG);
  const nen = ketQua.khoa === khoa ? ketQua.nen : null;
  const dangTai = ketQua.khoa !== khoa;
  const loi = ketQua.khoa === khoa ? ketQua.loi : null;
  const chiBao = useMemo(() => (nen && nen.length >= 2 ? tinhChiBao(nen, khungTG) : null), [nen, khungTG]);
  const chiBaoPhu = useMemo(() => (nen && nen.length >= 30 ? tinhChiBaoPhu(nen) : null), [nen]);
  const phanKy = useMemo(() => {
    if (!nen || nen.length < 60) return [];
    return phanKyRSI(nen.map((b) => ({ h: b.h, l: b.l, c: b.c })), rsi(nen.map((b) => b.c), 14), { k: 3 });
  }, [nen]);
  // MAU HINH GIA (lib/mauHinh.js): nhan dien tren nen dang hien (ngay / tuan); bam chip "Mẫu hình" de tu ve len bieu do, bam tung mau hinh de xem hinh khac.
  const dsMauHinh = useMemo(() => {
    if (!nen || nen.length < 40) return [];
    const khungMH = khungTG === "W" ? "tuan" : "ngay";
    return [...nhanDienDangHinhThanh(nen, { khung: khungMH }).slice(0, 6), ...nhanDienMauHinh(nen, { khung: khungMH }).slice(0, 12)];
  }, [nen, khungTG]);
  // MAU HINH NEN NHAT (lib/mauHinhNen.js): chip "Mẫu hình nến" danh dau cac nen tren 120 nen gan nhat (bo doji thuong cho do roi).
  const dsNenNhat = useMemo(() => (bat.nenNhat && nen && nen.length >= 25 ? nhanDienMauHinhNen(nen, { tuoiToiDa: 120 }).filter((m) => m.khoa !== "doji") : []), [bat.nenNhat, nen]);
  const [chonMH, setChonMH] = useState({ khoa: "", idx: 0 });
  const idxMH = chonMH.khoa === khoa ? chonMH.idx : 0; // doi ma / khung -> ve lai mau hinh moi nhat
  const mauHinhVe = bat.mauHinh && idxMH >= 0 && idxMH < dsMauHinh.length ? dsMauHinh[idxMH] : null;
  const soPhu = (bat.rsi ? 1 : 0) + (bat.macd ? 1 : 0) + (bat.stoch ? 1 : 0);
  khoaVeRef.current = khoaLuu(ma, khungTG);
  const caoGoc = layDayManHinh ? Math.max(chieuCao, caoManHinh - 330) : chieuCao; // trang Bieu do: bieu do cao toi sat day man hinh thay vi co dinh
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
      localization: { locale: "vi-VN", priceFormatter: (p) => soVN(p, 2, true) },
    });
    const dong = (mau, rong = 1, them = {}) =>
      chart.addSeries(LineSeries, { color: mau, lineWidth: rong, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false, ...them });

    const may = new DaiMay();
    const canBang = new DaiMay({ mauTren: "rgba(167,139,250,0.10)", mauDuoi: "rgba(167,139,250,0.10)" });
    const daiGia = new DaiGia();
    const dinhDang = { type: "price", precision: 2, minMove: 0.01 };

    const s = {
      chart,
      may,
      canBang,
      daiGia,
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
      bbTren: dong("#94A3B8", 1, { lineStyle: LineStyle.Dashed, visible: false }),
      bbMid: dong("#94A3B8", 1, { lineStyle: LineStyle.Dotted, visible: false }),
      bbDuoi: dong("#94A3B8", 1, { lineStyle: LineStyle.Dashed, visible: false }),
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
    s.candle.attachPrimitive(daiGia);
    s.markers = createSeriesMarkers(s.candle, []);
    s.markersPK = createSeriesMarkers(s.candle, []);
    s.markersMH = createSeriesMarkers(s.candle, []); // diem chinh cua mau hinh gia dang ve
    s.markersNen = createSeriesMarkers(s.candle, []); // mau hinh NEN NHAT (chip "Mẫu hình nến")
    s.mh = { series: [], vach: [] }; // cac duong / vach gia cua mau hinh gia dang ve (xoa khi doi mau hinh)
    // Lop ke ve (canvas phu len bieu do): hinh luu o localStorage theo ma + khung thoi gian.
    s.lopVe = new LopVe({
      khung: khungRef.current,
      goc: rootRef.current,
      chart,
      series: s.candle,
      onThayDoi: (ds) => {
        setSoHinhVe(ds.length);
        setCoFrvp(ds.some((h) => h.loai === "frvp"));
        try {
          if (khoaVeRef.current) localStorage.setItem(khoaVeRef.current, JSON.stringify(ds));
        } catch {
          /* tren trinh duyet an danh / chan luu tru: hinh ve chi ton tai trong phien */
        }
      },
      onCongCu: (c) => setCongCuState(c),
      onChon: (id) => setChonVe(id),
      onLichSu: (t) => setLichSuVe(t),
    });
    s.lopVe.datMauGiaoDien({ mo: m.mo, nen: m.nen });
    veRef.current = s;

    chart.subscribeCrosshairMove((p) => {
      if (!p.time) return setChuThich(null);
      const c = p.seriesData.get(s.candle);
      const v = p.seriesData.get(s.vol);
      setChuThich(c ? { t: chuoiThoiGian(p.time), o: c.open, h: c.high, l: c.low, c: c.close, v: v?.value ?? 0 } : null);
    });

    const theoDoiMau = new MutationObserver(() => {
      apDungMau(s);
      setKieuMau((x) => x + 1);
    });
    theoDoiMau.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      theoDoiMau.disconnect();
      veRef.current = null;
      s.lopVe.huyLop();
      chart.remove();
    };
  }, []);

  // 1b. Doi ma / khung thoi gian: nap hinh ve da luu cua ma + khung do.
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    let ds = [];
    try {
      const t = localStorage.getItem(khoaLuu(ma, khungTG));
      if (t) ds = JSON.parse(t);
    } catch {
      ds = [];
    }
    s.lopVe.datHinh(Array.isArray(ds) ? ds : []);
    setSoHinhVe(Array.isArray(ds) ? ds.length : 0);
    setCoFrvp(Array.isArray(ds) && ds.some((h) => h.loai === "frvp"));
    setChonVe(null);
  }, [ma, khungTG]);

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
      const denNgay = tuan ? new Date(Date.parse(`${d.nen[b].t}T00:00:00Z`) + 6 * 86400e3).toISOString().slice(0, 10) : d.nen[b].t;
      const chon = chonNenChoHoSo({ nenBieuDo: d.nen, nenGio: d.nenGio, tuNgay: d.nen[a].t, denNgay, soNgayMoiNen: tuan ? 7 : 1 });
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

  // 2b. Trong phien giao dich: tu dong lam moi nen "hom nay" moi 30 giay (khung Ngay - nguon
  // DNSE tra ve nen hom nay dang chay, khong phai da chot) - khung Tuan khong can vi khong doi trong ngay.
  useEffect(() => {
    if (khungTG === "W") return;
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
      for (const k of ["candle", "vol", "tenkan", "kijun", "spanA", "spanB", "chikou", "ttTenkan", "ttKijun", "ttSpanA", "ttSpanB", "ttCb1", "ttCb2", "cb1", "cb2", "ma20", "ma50", "ma200"]) s[k].setData([]);
      s.may.datDuLieu([]);
      s.canBang.datDuLieu([]);
      return;
    }
    s.candle.setData(nen.map((b) => ({ time: b.t, open: b.o, high: b.h, low: b.l, close: b.c })));
    s.vol.setData(nen.map((b) => ({ time: b.t, value: b.v, color: b.c >= b.o ? "rgba(34,197,94,0.45)" : "rgba(239,68,68,0.45)" })));
    for (const k of ["tenkan", "kijun", "spanA", "spanB", "chikou", "ttTenkan", "ttKijun", "ttSpanA", "ttSpanB", "ttCb1", "ttCb2", "cb1", "cb2", "ma20", "ma50", "ma200"]) s[k].setData(chiBao[k]);
    s.may.datDuLieu(chiBao.may);
    s.canBang.datDuLieu(chiBao.cbBand);
    s.lopVe.datNen(nen);
    s.chart.timeScale().setVisibleLogicalRange({ from: Math.max(-2, chiBao.n - 150), to: chiBao.n + THAM_SO_MAC_DINH.dichMay + SO_BUOC_TUONG_LAI.spanB + 2 });
  }, [chiBao, nen]);

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
  }, [chiBaoPhu]);
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    for (const k of ["ema9", "ema21"]) s[k].applyOptions({ visible: bat.ema });
    for (const k of ["bbTren", "bbMid", "bbDuoi"]) s[k].applyOptions({ visible: bat.boll });
  }, [bat.ema, bat.boll]);

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
      const sr = dong("#A78BFA", cp.rsi, o, { title: "RSI 14", ...khoang0_100 });
      vach(sr, 70, "rgba(239,68,68,0.6)");
      vach(sr, 30, "rgba(34,197,94,0.6)");
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
      const h = s.chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false, title: "MACD 12·26·9" }, o);
      h.setData(cp.hist);
      s.phu.push(h);
      dong("#60A5FA", cp.macd, o);
      dong("#FB923C", cp.signal, o);
    }
    if (bat.stoch) {
      const o = cuaSo++;
      const sr = dong("#FBBF24", cp.stochK, o, { title: "Stoch 14·3·3", ...khoang0_100 });
      dong("#38BDF8", cp.stochD, o, khoang0_100);
      vach(sr, 80, "rgba(239,68,68,0.6)");
      vach(sr, 20, "rgba(34,197,94,0.6)");
    }
    // cua so gia lon hon cac cua so chi bao
    const panes = s.chart.panes();
    panes.forEach((p, i) => p.setStretchFactor(i === 0 ? 3.2 : 1));
  }, [bat.rsi, bat.macd, bat.stoch, bat.phanKy, chiBaoPhu, phanKy, nen]);

  // 4. Vung lenh + diem MUA.
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    s.daiGia.datDuLieu(daiTuVung(vung), nen ? nen[nen.length - 1].c : null);
    const ngay = ngayMua ? new Date(ngayMua).toISOString().slice(0, 10) : null;
    const nenMua = nen && ngay && !noiNgay ? timNenTruoc(nen, ngay) : null;
    s.markers.setMarkers(nenMua ? [{ time: nenMua, position: "belowBar", color: mauTheoGiaoDien().xanh, shape: "arrowUp", text: "MUA" }] : []);
  }, [vung, ngayMua, nen, kieuMau, noiNgay]);

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
    for (const k of ["tenkan", "kijun", "spanA", "spanB", "chikou", "ttTenkan", "ttKijun", "ttSpanA", "ttSpanB"]) s[k].applyOptions({ visible: bat.ichimoku });
    s.may.datHien(bat.ichimoku);
    for (const k of ["cb1", "cb2", "ttCb1", "ttCb2"]) s[k].applyOptions({ visible: bat.canBang });
    s.canBang.datHien(bat.canBang);
    for (const k of ["ma20", "ma50", "ma200"]) s[k].applyOptions({ visible: bat.ma });
    s.daiGia.datHien(bat.vung);
  }, [bat]);

  function datKhoang(soNen) {
    const s = veRef.current;
    if (!s || !chiBao) return;
    const from = soNen ? chiBao.n - soNen : -2;
    s.chart.timeScale().setVisibleLogicalRange({ from, to: chiBao.n + THAM_SO_MAC_DINH.dichMay + SO_BUOC_TUONG_LAI.spanB + 2 });
  }

  const conVung = vung && (vung.mua || vung.sl || vung.tp);
  const idx = nen && chuThich ? nen.findIndex((b) => b.t === chuThich.t) : (nen?.length ?? 0) - 1;
  const hienTai = chuThich ?? (nen && nen.length ? { t: nen[nen.length - 1].t, o: nen[nen.length - 1].o, h: nen[nen.length - 1].h, l: nen[nen.length - 1].l, c: nen[nen.length - 1].c, v: nen[nen.length - 1].v } : null);
  const truoc = nen && idx > 0 ? nen[idx - 1].c : null;
  const doiPct = hienTai && truoc ? ((hienTai.c - truoc) / truoc) * 100 : null;
  const mauDoi = doiPct == null ? MUTED : doiPct >= 0 ? XANH : DO;

  return (
    <div ref={rootRef} className={toanMH ? "fixed inset-0 z-[300] flex flex-col overflow-hidden" : "rounded-2xl border overflow-hidden"} style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className={`flex items-center gap-x-4 gap-y-2 px-3 py-2.5 border-b ${toanMH ? "shrink-0 overflow-x-auto flex-nowrap [&>*]:shrink-0" : "flex-wrap"}`} style={{ borderColor: VIEN }}>
        <div className="flex items-center gap-1.5">
          {KHUNG_CHON.map((k) => (
            <Chip key={k.khoa} bat={khungTG === k.khoa} onClick={() => setKhungTG(k.khoa)}>
              {k.nhan}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {CONG_TAT.filter((c) => !(noiNgay && (c.khoa === "vp" || c.khoa === "htkc"))).map((c) => (
            <Chip key={c.khoa} bat={bat[c.khoa]} mau={c.mau} onClick={() => setBat((b) => ({ ...b, [c.khoa]: !b[c.khoa] }))}>
              {c.nhan}
            </Chip>
          ))}
          {conVung && (
            <Chip bat={bat.vung} mau={XANH} onClick={() => setBat((b) => ({ ...b, vung: !b.vung }))}>
              Vùng lệnh
            </Chip>
          )}
          <span className="w-px h-4 mx-1" style={{ background: VIEN }} aria-hidden="true" />
          {CHI_BAO_PHU.map((c) => (
            <Chip key={c.khoa} bat={bat[c.khoa]} mau={c.mau} onClick={() => setBat((b) => ({ ...b, [c.khoa]: !b[c.khoa] }))}>
              {c.nhan}
            </Chip>
          ))}
          <span className="w-px h-4 mx-1" style={{ background: VIEN }} aria-hidden="true" />
          <Chip bat={bat.mauHinh} mau="#F6C544" onClick={() => setBat((b) => ({ ...b, mauHinh: !b.mauHinh }))}>
            Mẫu hình
          </Chip>
          <Chip bat={bat.nenNhat} mau="#38BDF8" onClick={() => setBat((b) => ({ ...b, nenNhat: !b.nenNhat }))}>
            Mẫu hình nến
          </Chip>
          <Chip bat={bat.phanKy} mau={CHI_BAO_PK.mau} onClick={() => setBat((b) => ({ ...b, phanKy: !b.phanKy, rsi: !b.phanKy ? true : b.rsi }))}>
            {CHI_BAO_PK.nhan}
          </Chip>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => setToanMH((v) => !v)}
            aria-pressed={toanMH}
            title={toanMH ? "Thu nhỏ (Esc)" : "Xem biểu đồ toàn màn hình"}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs cursor-pointer"
            style={{ border: `1px solid ${toanMH ? PRIMARY : VIEN}`, background: toanMH ? "rgba(74,138,214,0.18)" : "transparent", color: toanMH ? TEXT : MUTED, fontFamily: "var(--font-chu)" }}
          >
            {toanMH ? <Minimize2 size={13} strokeWidth={2} /> : <Maximize2 size={13} strokeWidth={2} />}
            {toanMH ? "Thu nhỏ" : "Toàn màn hình"}
          </button>
          {(noiNgay ? khoangNoiNgay(khungTG) : KHOANG).map((k) => (
            <button
              key={k.nhan}
              type="button"
              onClick={() => datKhoang(k.nen)}
              className="px-2 py-1 rounded text-xs cursor-pointer hover:text-[color:var(--chu)]"
              style={{ color: MUTED, fontFamily: "'Open Sans', sans-serif" }}
            >
              {k.nhan}
            </button>
          ))}
        </div>
      </div>

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
              Mẫu hình ({khungTG === "W" ? "khung tuần" : noiNgay ? `khung ${KHUNG_CHON.find((k) => k.khoa === khungTG).nhan.toLowerCase()}` : "khung ngày"}) — ⏳ đang hình thành · ▲▼ đã phá vỡ. Bấm để vẽ lên hình:
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
                  {dangHT ? `cách mức phá vỡ ${soVN(m.cachPhaVoPct, 1)}%` : m.cach === 0 ? (khungTG === "W" ? "tuần này" : noiNgay ? "nến này" : "hôm nay") : `${m.cach} ${khungTG === "W" ? "tuần" : noiNgay ? "nến" : "phiên"} trước`}
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

      {/* THANH CONG CU KE VE: chon cong cu roi bam / bam hai lan len bieu do; bam vao hinh de chon, keo diem dau mut de sua, Delete de xoa; Esc huy. */}
      <div className={`flex items-center gap-x-1.5 gap-y-1.5 px-3 py-2 border-b ${toanMH ? "shrink-0 overflow-x-auto flex-nowrap [&>*]:shrink-0" : "flex-wrap"}`} style={{ borderColor: VIEN }} data-may="cong-cu-ve">
        <span className="text-[11px] mr-1 hidden sm:inline" style={{ color: MUTED, fontFamily: "'Open Sans', sans-serif" }}>
          Công cụ vẽ
        </span>
        <button
          type="button"
          onClick={() => setCongCuState(null)}
          aria-pressed={congCu === null}
          title="Con trỏ: kéo, thu phóng biểu đồ; bấm vào hình vẽ để chọn"
          className="px-2.5 py-1 rounded-md text-xs cursor-pointer flex items-center gap-1.5"
          style={{ background: congCu === null ? "rgba(74,138,214,0.18)" : "transparent", border: `1px solid ${congCu === null ? PRIMARY : VIEN}`, color: congCu === null ? TEXT : MUTED, fontFamily: "'Open Sans', sans-serif" }}
        >
          <MousePointer2 size={13} strokeWidth={2} />
          Con trỏ
        </button>
        {CONG_CU_VE.map(({ khoa: k, nhan, Icon }) => (
          <button
            key={k}
            type="button"
            onClick={() => setCongCuState((c) => (c === k ? null : k))}
            aria-pressed={congCu === k}
            title={`${nhan}: bấm 2 lần (hoặc bấm - kéo - thả) lên biểu đồ để vẽ`}
            className="px-2.5 py-1 rounded-md text-xs cursor-pointer flex items-center gap-1.5"
            style={{ background: congCu === k ? "rgba(74,138,214,0.18)" : "transparent", border: `1px solid ${congCu === k ? PRIMARY : VIEN}`, color: congCu === k ? TEXT : MUTED, fontFamily: "'Open Sans', sans-serif" }}
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
          style={{ background: giuCongCu ? "rgba(74,138,214,0.18)" : "transparent", border: `1px solid ${giuCongCu ? PRIMARY : VIEN}`, color: giuCongCu ? TEXT : MUTED, fontFamily: "'Open Sans', sans-serif" }}
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
          style={{ background: hitGia ? "rgba(74,138,214,0.18)" : "transparent", border: `1px solid ${hitGia ? PRIMARY : VIEN}`, color: hitGia ? TEXT : MUTED, fontFamily: "'Open Sans', sans-serif" }}
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
            if (soHinhVe > 0 && window.confirm(`Xóa tất cả ${soHinhVe} hình vẽ của ${ma}?`)) veRef.current?.lopVe.xoaHet();
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
      <div className="px-3 h-7 flex items-center text-[11px] border-b truncate" style={{ borderColor: VIEN, color: congCu ? TEXT : MUTED, fontFamily: "'Open Sans', sans-serif" }}>
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
      {thongTin && !toanMH && (
        <div className="min-[1340px]:hidden px-3 py-2 border-b" style={{ borderColor: VIEN }}>
          <BangThongTinBieuDo tt={thongTin} />
        </div>
      )}
      <div className={toanMH ? "flex flex-1 min-h-0" : ""}>
      <div className={toanMH ? "relative flex-1 min-w-0" : "relative"} style={toanMH ? undefined : { height: chieuCaoTong }}>
        <div ref={khungRef} className="absolute inset-0" />
        {thongTin && !toanMH && (
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
                  style={{ background: PRIMARY, color: "#FFFFFF" }}
                >
                  Thử lại
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {toanMH && (
        <aside className="hidden md:flex w-[300px] shrink-0 flex-col gap-3 overflow-y-auto border-l p-3" style={{ borderColor: VIEN }} aria-label="Thông tin mã">
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
          {thongTin && (
            <div>
              <p className="text-[11px] mb-1.5 " style={{ color: MUTED }}>Tín hiệu hệ thống</p>
              <BangThongTinBieuDo tt={thongTin} />
            </div>
          )}
          {conVung && (
            <div className="text-xs" style={{ fontFamily: "var(--font-chu)" }}>
              <p className="text-[11px] mb-1.5 " style={{ color: MUTED }}>Vùng lệnh</p>
              {daiTuVung(vung).map((d) => (
                <div key={d.nhan} className="flex justify-between py-0.5"><span style={{ color: `rgb(${d.mau})` }}>{d.nhan}</span><b>{d.tu === d.den ? fmt(d.tu) : `${fmt(d.tu)} – ${fmt(d.den)}`}</b></div>
              ))}
            </div>
          )}
          <p className="text-[11px] leading-relaxed" style={{ color: MUTED }}>Esc: thu nhỏ. Chỉ để tham khảo, không phải khuyến nghị mua bán.</p>
        </aside>
      )}
      </div>

      {!toanMH && (
      <p className="px-3 py-2 text-[11px] border-t" style={{ borderColor: VIEN, color: MUTED }}>
        Giá đã điều chỉnh cổ tức/thưởng cổ phiếu (giống dữ liệu AmiBroker), khối lượng khớp lệnh; chỉ báo tính giống hệ thống tín hiệu (Ichimoku 9-17-33, mây dịch 26
        phiên, đường cân bằng dài hạn 65/129); EMA, Bollinger, RSI, MACD, Stochastic là chỉ báo tham khảo thông dụng. RSI phân kỳ (PK↑ đáy sau thấp hơn nhưng RSI cao hơn; PK↓ đỉnh sau cao hơn nhưng RSI thấp hơn) chỉ xác nhận sau 3 nến và chỉ là điều kiện tham khảo, không phải tín hiệu mua bán: thống kê 390 mã cho thấy không có lợi thế riêng lẻ. Volume Profile là ước lượng: khối lượng mỗi nến chia đều theo khoảng giá của nến đó (dùng nến 1 giờ khi có, từ khoảng 10/2023; trước đó dùng nến của biểu đồ), không phải dữ liệu khớp lệnh theo từng mức giá. Hỗ trợ / Kháng cự (KL) là các vùng giá có khối lượng giao dịch lớn trong khoảng 6 tháng gần nhất (nét đậm = vùng lớn), chỉ để tham khảo: kiểm tra lịch sử cho thấy giá giữ được ở các mức này khoảng một nửa số lần. Hình vẽ lưu trên trình duyệt này theo từng mã và khung thời gian. Trong phiên, nến hôm nay cập nhật theo giá khớp thực tế, web tự làm mới mỗi 30 giây, không dùng để đặt lệnh khớp từng giây.
      </p>
      )}
    </div>
  );
}
