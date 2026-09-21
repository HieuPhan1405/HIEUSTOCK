"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, createSeriesMarkers, CandlestickSeries, HistogramSeries, LineSeries, CrosshairMode, LineStyle } from "lightweight-charts";
import { tinhIchimoku, tinhCanBang, trungBinhDon, THAM_SO_MAC_DINH } from "@/lib/chiBaoKyThuat";
import { DaiMay, DaiGia } from "@/components/bieuDoPlugin";
import { fmt } from "@/components/dungChung";

const VIEN = "#26262F";
const NEN_CARD = "#15151F";
const TEXT = "#F5F5F7";
const MUTED = "#8B8B99";
const PRIMARY = "#6C5CE7";
const XANH = "#22C55E";
const DO = "#EF4444";

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
  ma200: "#E5E7EB",
};

const KHOANG = [
  { nhan: "3T", nen: 63 },
  { nhan: "6T", nen: 126 },
  { nhan: "1N", nen: 252 },
  { nhan: "3N", nen: 756 },
  { nhan: "Tất cả", nen: 0 },
];

const CONG_TAT = [
  { khoa: "ichimoku", nhan: "Ichimoku", mau: MAU.kijun },
  { khoa: "canBang", nhan: "Cân bằng dài hạn", mau: MAU.cb1 },
  { khoa: "ma", nhan: "MA 20/50/200", mau: MAU.ma20 },
];

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

function tinhChiBao(nen, tuan) {
  const n = nen.length;
  const bars = nen.map((b) => ({ h: b.h, l: b.l, c: b.c }));
  const dich = THAM_SO_MAC_DINH.dichMay;
  const thoiGian = nen.map((b) => b.t);
  for (let k = 1; k <= dich; k++) thoiGian.push(ngayTuongLai(nen[n - 1].t, k, tuan));

  const ich = tinhIchimoku(bars);
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
    may: dai(ich.spanA, ich.spanB),
    cb1: dong(cb.cb1),
    cb2: dong(cb.cb2),
    cbBand: dai(cb.cb1, cb.cb2),
    ma20: dongMA(20),
    ma50: dongMA(50),
    ma200: dongMA(200),
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

const chuoiThoiGian = (t) => (typeof t === "object" && t ? `${t.year}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}` : String(t));
const chuoiKL = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(2)}tr` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}k` : String(v ?? 0));

function Chip({ bat, onClick, children, mau }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={bat}
      className="px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors flex items-center gap-1.5"
      style={{
        background: bat ? "rgba(108,92,231,0.18)" : "transparent",
        border: `1px solid ${bat ? PRIMARY : VIEN}`,
        color: bat ? TEXT : MUTED,
        fontFamily: "'Inter', sans-serif",
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
// Gia = gia THUC (khong dieu chinh co tuc) de khop tin hieu; nguon du lieu qua /api/gia-lich-su.
export default function BieuDoKyThuat({ ma, vung = null, ngayMua = null, chieuCao = 540 }) {
  const khungRef = useRef(null);
  const veRef = useRef(null);
  const [khungTG, setKhungTG] = useState("D");
  const [bat, setBat] = useState({ ichimoku: true, canBang: true, ma: false, vung: true });
  const [ketQua, setKetQua] = useState({ khoa: "", nen: null, loi: null });
  const [lanThu, setLanThu] = useState(0);
  const [chuThich, setChuThich] = useState(null);

  const khoa = `${ma}|${khungTG}|${lanThu}`;
  const nen = ketQua.khoa === khoa ? ketQua.nen : null;
  const dangTai = ketQua.khoa !== khoa;
  const loi = ketQua.khoa === khoa ? ketQua.loi : null;
  const chiBao = useMemo(() => (nen && nen.length >= 2 ? tinhChiBao(nen, khungTG === "W") : null), [nen, khungTG]);

  // 1. Tao bieu do 1 lan.
  useEffect(() => {
    const chart = createChart(khungRef.current, {
      autoSize: true,
      layout: { background: { type: "solid", color: NEN_CARD }, textColor: MUTED, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 },
      grid: { vertLines: { color: "#1D1D26" }, horzLines: { color: "#1D1D26" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: VIEN, scaleMargins: { top: 0.06, bottom: 0.22 } },
      timeScale: { borderColor: VIEN, rightOffset: 4, minBarSpacing: 2 },
      localization: { locale: "vi-VN" },
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
      ma200: dong(MAU.ma200),
      spanA: dong(MAU.spanA),
      spanB: dong(MAU.spanB),
      chikou: dong(MAU.chikou, 1, { lineStyle: LineStyle.Dotted }),
      tenkan: dong(MAU.tenkan),
      kijun: dong(MAU.kijun, 2),
      vol: chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "vol", lastValueVisible: false, priceLineVisible: false }),
      candle: chart.addSeries(CandlestickSeries, {
        upColor: XANH,
        downColor: DO,
        borderVisible: false,
        wickUpColor: XANH,
        wickDownColor: DO,
        priceFormat: dinhDang,
      }),
    };
    s.vol.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    s.spanA.attachPrimitive(may);
    s.cb1.attachPrimitive(canBang);
    s.candle.attachPrimitive(daiGia);
    s.markers = createSeriesMarkers(s.candle, []);
    veRef.current = s;

    chart.subscribeCrosshairMove((p) => {
      if (!p.time) return setChuThich(null);
      const c = p.seriesData.get(s.candle);
      const v = p.seriesData.get(s.vol);
      setChuThich(c ? { t: chuoiThoiGian(p.time), o: c.open, h: c.high, l: c.low, c: c.close, v: v?.value ?? 0 } : null);
    });

    return () => {
      veRef.current = null;
      chart.remove();
    };
  }, []);

  // 2. Tai gia lich su khi doi ma / khung thoi gian.
  useEffect(() => {
    let huy = false;
    fetch(`/api/gia-lich-su?ma=${encodeURIComponent(ma)}&kt=${khungTG}`)
      .then((r) => r.json())
      .then((j) => {
        if (huy) return;
        if (j.trangThai === "ok" && Array.isArray(j.nen) && j.nen.length >= 2) setKetQua({ khoa, nen: j.nen, loi: null });
        else setKetQua({ khoa, nen: null, loi: j.thongBao || "Chưa có dữ liệu giá cho mã này." });
      })
      .catch(() => {
        if (!huy) setKetQua({ khoa, nen: null, loi: "Không kết nối được máy chủ." });
      });
    return () => {
      huy = true;
    };
  }, [ma, khungTG, khoa]);

  // 3. Do du lieu + chi bao len bieu do.
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    if (!chiBao) {
      for (const k of ["candle", "vol", "tenkan", "kijun", "spanA", "spanB", "chikou", "cb1", "cb2", "ma20", "ma50", "ma200"]) s[k].setData([]);
      s.may.datDuLieu([]);
      s.canBang.datDuLieu([]);
      return;
    }
    s.candle.setData(nen.map((b) => ({ time: b.t, open: b.o, high: b.h, low: b.l, close: b.c })));
    s.vol.setData(nen.map((b) => ({ time: b.t, value: b.v, color: b.c >= b.o ? "rgba(34,197,94,0.45)" : "rgba(239,68,68,0.45)" })));
    for (const k of ["tenkan", "kijun", "spanA", "spanB", "chikou", "cb1", "cb2", "ma20", "ma50", "ma200"]) s[k].setData(chiBao[k]);
    s.may.datDuLieu(chiBao.may);
    s.canBang.datDuLieu(chiBao.cbBand);
    s.chart.timeScale().setVisibleLogicalRange({ from: Math.max(-2, chiBao.n - 150), to: chiBao.n + THAM_SO_MAC_DINH.dichMay + 2 });
  }, [chiBao, nen]);

  // 4. Vung lenh + diem MUA.
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    s.daiGia.datDuLieu(daiTuVung(vung), nen ? nen[nen.length - 1].c : null);
    const ngay = ngayMua ? new Date(ngayMua).toISOString().slice(0, 10) : null;
    const nenMua = nen && ngay ? timNenTruoc(nen, ngay) : null;
    s.markers.setMarkers(nenMua ? [{ time: nenMua, position: "belowBar", color: XANH, shape: "arrowUp", text: "MUA" }] : []);
  }, [vung, ngayMua, nen]);

  // 5. Bat/tat chi bao.
  useEffect(() => {
    const s = veRef.current;
    if (!s) return;
    for (const k of ["tenkan", "kijun", "spanA", "spanB", "chikou"]) s[k].applyOptions({ visible: bat.ichimoku });
    s.may.datHien(bat.ichimoku);
    for (const k of ["cb1", "cb2"]) s[k].applyOptions({ visible: bat.canBang });
    s.canBang.datHien(bat.canBang);
    for (const k of ["ma20", "ma50", "ma200"]) s[k].applyOptions({ visible: bat.ma });
    s.daiGia.datHien(bat.vung);
  }, [bat]);

  function datKhoang(soNen) {
    const s = veRef.current;
    if (!s || !chiBao) return;
    const from = soNen ? chiBao.n - soNen : -2;
    s.chart.timeScale().setVisibleLogicalRange({ from, to: chiBao.n + THAM_SO_MAC_DINH.dichMay + 2 });
  }

  const conVung = vung && (vung.mua || vung.sl || vung.tp);
  const idx = nen && chuThich ? nen.findIndex((b) => b.t === chuThich.t) : (nen?.length ?? 0) - 1;
  const hienTai = chuThich ?? (nen && nen.length ? { t: nen[nen.length - 1].t, o: nen[nen.length - 1].o, h: nen[nen.length - 1].h, l: nen[nen.length - 1].l, c: nen[nen.length - 1].c, v: nen[nen.length - 1].v } : null);
  const truoc = nen && idx > 0 ? nen[idx - 1].c : null;
  const doiPct = hienTai && truoc ? ((hienTai.c - truoc) / truoc) * 100 : null;
  const mauDoi = doiPct == null ? MUTED : doiPct >= 0 ? XANH : DO;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 border-b" style={{ borderColor: VIEN }}>
        <div className="flex items-center gap-1.5">
          <Chip bat={khungTG === "D"} onClick={() => setKhungTG("D")}>
            Ngày
          </Chip>
          <Chip bat={khungTG === "W"} onClick={() => setKhungTG("W")}>
            Tuần
          </Chip>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {CONG_TAT.map((c) => (
            <Chip key={c.khoa} bat={bat[c.khoa]} mau={c.mau} onClick={() => setBat((b) => ({ ...b, [c.khoa]: !b[c.khoa] }))}>
              {c.nhan}
            </Chip>
          ))}
          {conVung && (
            <Chip bat={bat.vung} mau={XANH} onClick={() => setBat((b) => ({ ...b, vung: !b.vung }))}>
              Vùng lệnh
            </Chip>
          )}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {KHOANG.map((k) => (
            <button
              key={k.nhan}
              type="button"
              onClick={() => datKhoang(k.nen)}
              className="px-2 py-1 rounded text-xs cursor-pointer hover:text-white"
              style={{ color: MUTED, fontFamily: "'Inter', sans-serif" }}
            >
              {k.nhan}
            </button>
          ))}
        </div>
      </div>

      <div className="relative" style={{ height: chieuCao }}>
        <div ref={khungRef} className="absolute inset-0" />
        {hienTai && (
          <div
            className="absolute left-3 top-2 z-10 pointer-events-none text-[11px] leading-5 flex flex-wrap gap-x-3"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: MUTED, textShadow: `0 0 4px ${NEN_CARD}, 0 0 4px ${NEN_CARD}` }}
          >
            <b style={{ color: TEXT, fontFamily: "'Inter', sans-serif" }}>{ma}</b>
            <span>{hienTai.t.split("-").reverse().join("/")}</span>
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
            {doiPct != null && <b style={{ color: mauDoi }}>{`${doiPct > 0 ? "+" : ""}${doiPct.toFixed(2)}%`}</b>}
            <span>
              KL <b style={{ color: TEXT }}>{chuoiKL(hienTai.v)}</b>
            </span>
          </div>
        )}
        {(dangTai || loi) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 text-sm" style={{ background: "rgba(21,21,31,0.85)", color: MUTED }}>
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

      <p className="px-3 py-2 text-[11px] border-t" style={{ borderColor: VIEN, color: MUTED }}>
        Giá thực (không điều chỉnh cổ tức/thưởng cổ phiếu), khối lượng khớp lệnh; chỉ báo tính giống hệ thống tín hiệu (Ichimoku 9-17-33, mây dịch 26 phiên, đường
        cân bằng dài hạn 65/129). Không phải dữ liệu thời gian thực: nến cuối là phiên gần nhất mà nguồn đã cập nhật, và web làm mới tối đa 10 phút một lần.
      </p>
    </div>
  );
}
