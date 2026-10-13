"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, createSeriesMarkers, CandlestickSeries, LineStyle } from "lightweight-charts";
import { Bell, BellOff, RotateCcw } from "lucide-react";
import { soVN } from "@/lib/soVN";

// TRANG /phai-sinh: tin hieu pha vo trong ngay cho VN30F1M (cong cu ca nhan cua quan tri). Du lieu + logic: /api/phai-sinh (lib/phaVoPhaiSinh.js).
// Tu lam moi 15 giay trong phien. Thong bao trinh duyet + tieng bip khi trang thai lenh doi (chi khi trang dang mo).
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "#F6C544";
const mono = { fontFamily: "'JetBrains Mono', monospace" };
const d1 = (v) => soVN(v, 1, true);
const diemCoDau = (v) => `${v > 0 ? "+" : ""}${soVN(v, 1, true)}`;
const trieu = (diem) => `${diem > 0 ? "+" : ""}${soVN(diem * 0.1, 2, true)} triệu`;
const ngayHien = (s) => (s ? s.split("-").reverse().join("/") : "");

const NHAN_TRANG_THAI = {
  chuaMoCua: { chu: "Chờ mở cửa", mau: MUTED },
  dangDo: { chu: "Đang đo khoảng", mau: VANG },
  cho: { chu: "Chờ tín hiệu", mau: VANG },
  khongKhop: { chu: "Hôm nay không có lệnh", mau: MUTED },
  dangGiu: { chu: "Đang giữ lệnh", mau: XANH },
  catLo: { chu: "Đã cắt lỗ", mau: DO },
  cuoiPhien: { chu: "Đã đóng cuối phiên", mau: MUTED },
};
const NHAN_PHA = { truocPhien: "Chưa mở cửa", trongPhien: "Đang trong phiên", nghiTrua: "Nghỉ trưa", sauPhien: "Đã hết phiên", ngayCu: "Xem lại ngày cũ" };

function Dong({ nhan, gia, mau, ghiChu }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b last:border-b-0" style={{ borderColor: "var(--vien-nhe)" }}>
      <span className="text-sm" style={{ color: MUTED }}>
        {nhan}
        {ghiChu && <span className="block text-[11px]">{ghiChu}</span>}
      </span>
      <span className="text-lg font-bold whitespace-nowrap" style={{ color: mau || TEXT, ...mono }}>
        {gia}
      </span>
    </div>
  );
}

function LenhDangCo({ x }) {
  if (!x || !x.phia) return null;
  const mua = x.phia > 0;
  const mau = x.diemSauPhi > 0 ? XANH : DO;
  return (
    <div className="mt-3 rounded-xl p-3" style={{ background: "var(--nen-2, rgba(127,127,127,0.08))", border: `1px solid ${VIEN}` }}>
      <p className="text-sm font-bold mb-1" style={{ color: mua ? XANH : DO }}>
        {mua ? "MUA" : "BÁN KHỐNG"} lúc {x.vao.gio} giá <span style={mono}>{d1(x.vao.gia)}</span>
      </p>
      {x.ra ? (
        <p className="text-sm" style={{ color: TEXT }}>
          {x.trangThai === "catLo" ? "Cắt lỗ" : "Đóng cuối phiên"} lúc {x.ra.gio} giá <span style={mono}>{d1(x.ra.gia)}</span>
        </p>
      ) : (
        <p className="text-sm" style={{ color: TEXT }}>
          Đang giữ · cắt lỗ tại <span style={mono}>{d1(x.catLo)}</span> · đóng lúc 14:29
        </p>
      )}
      <p className="text-sm mt-1" style={{ color: MUTED }}>
        {x.ra ? "Kết quả" : "Tạm tính"}:{" "}
        <b style={{ color: mau, ...mono }}>
          {diemCoDau(x.diemSauPhi)} điểm ({trieu(x.diemSauPhi)} / hợp đồng)
        </b>{" "}
        sau phí và thuế {d1(x.phi)} điểm, chưa trừ trượt giá
      </p>
    </div>
  );
}

function The({ tieuDe, moTa, trangThai, children }) {
  const tt = NHAN_TRANG_THAI[trangThai] || NHAN_TRANG_THAI.chuaMoCua;
  return (
    <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h2 className="text-base font-bold" style={{ color: TEXT, fontFamily: "'Inter', sans-serif" }}>
          {tieuDe}
        </h2>
        <span className="px-2.5 py-1 rounded-md text-xs font-bold" style={{ color: tt.mau, border: `1px solid ${tt.mau}` }}>
          {tt.chu}
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: MUTED }}>
        {moTa}
      </p>
      {children}
    </div>
  );
}

function mauBieuDo() {
  const cs = getComputedStyle(document.documentElement);
  const l = (t) => cs.getPropertyValue(`--${t}`).trim();
  return { nen: l("card"), mo: l("mo"), vien: l("vien"), luoi: l("vien-nhe"), xanh: l("xanh"), do: l("do") };
}
// Gio Viet Nam cua phut k trong ngay -> "giay" de ve len truc thoi gian (coi gio VN nhu UTC de truc hien dung gio)
function giayTruc(ngay, k) {
  const [y, m, d] = ngay.split("-").map(Number);
  const ph = k <= 150 ? 540 + k : 780 + k - 151;
  return Date.UTC(y, m - 1, d, 0, ph) / 1000;
}

function BieuDoTrongNgay({ du }) {
  const khung = useRef(null);
  const ref = useRef(null);
  useEffect(() => {
    const m = mauBieuDo();
    const chart = createChart(khung.current, {
      autoSize: true,
      layout: { background: { type: "solid", color: m.nen }, textColor: m.mo, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 },
      grid: { vertLines: { color: m.luoi }, horzLines: { color: m.luoi } },
      rightPriceScale: { borderColor: m.vien },
      timeScale: { borderColor: m.vien, timeVisible: true, secondsVisible: false, rightOffset: 3 },
      localization: { priceFormatter: (p) => soVN(p, 1, true) },
    });
    const nen = chart.addSeries(CandlestickSeries, { upColor: m.xanh, downColor: m.do, borderVisible: false, wickUpColor: m.xanh, wickDownColor: m.do, priceFormat: { type: "price", precision: 1, minMove: 0.1 } });
    ref.current = { chart, nen, duong: [], danhDau: createSeriesMarkers(nen, []), ngay: null, soNen: 0, mau: m };
    return () => {
      ref.current = null;
      chart.remove();
    };
  }, []);
  useEffect(() => {
    const s = ref.current;
    if (!s || !du) return;
    s.nen.setData((du.nen || []).map(([k, o, h, l, c]) => ({ time: giayTruc(du.ngay, k), open: o, high: h, low: l, close: c })));
    for (const d of s.duong) s.nen.removePriceLine(d);
    s.duong = [];
    const them = (gia, mau, nhan, net = LineStyle.Dashed) => {
      if (gia == null || !Number.isFinite(gia)) return;
      s.duong.push(s.nen.createPriceLine({ price: gia, color: mau, lineWidth: 1, lineStyle: net, axisLabelVisible: true, title: nhan }));
    };
    const b = du.bienDong || {};
    const k = du.khoangMoCua || {};
    them(b.mucMua, s.mau.xanh, "Mua (BĐ)");
    them(b.mucBan, s.mau.do, "Bán (BĐ)");
    them(b.giaMoCua, s.mau.mo, "Mở cửa", LineStyle.Dotted);
    if (k.trangThai && k.trangThai !== "chuaMoCua") {
      them(k.dinh, "#38BDF8", k.trangThai === "dangDo" ? "Đỉnh (tạm)" : "Đỉnh 15'", LineStyle.SparseDotted);
      them(k.day, "#38BDF8", k.trangThai === "dangDo" ? "Đáy (tạm)" : "Đáy 15'", LineStyle.SparseDotted);
    }
    const dd = [];
    for (const [x, ten] of [[b, "BĐ"], [k, "KM"]]) {
      if (!x.phia) continue;
      dd.push({ time: giayTruc(du.ngay, x.vao.k), position: x.phia > 0 ? "belowBar" : "aboveBar", color: x.phia > 0 ? s.mau.xanh : s.mau.do, shape: x.phia > 0 ? "arrowUp" : "arrowDown", text: `${ten} ${x.phia > 0 ? "mua" : "bán"}` });
      if (x.ra) dd.push({ time: giayTruc(du.ngay, x.ra.k), position: x.phia > 0 ? "aboveBar" : "belowBar", color: s.mau.mo, shape: "circle", text: `${ten} ${x.trangThai === "catLo" ? "cắt lỗ" : "đóng"}` });
    }
    dd.sort((a, c) => a.time - c.time);
    s.danhDau.setMarkers(dd);
    // chi can lai khung nhin khi doi ngay hoac lan dau co du lieu (khong lam mat thao tac keo / thu phong cua nguoi xem moi lan lam moi)
    if (s.ngay !== du.ngay || (s.soNen === 0 && du.nen?.length)) s.chart.timeScale().fitContent();
    s.ngay = du.ngay;
    s.soNen = du.nen?.length || 0;
  }, [du]);
  return <div ref={khung} style={{ height: 380 }} />;
}

function OKetQua({ x }) {
  if (!x || !x.phia) return <span style={{ color: MUTED }}>{x?.lyDo === "khongKhop" ? "không có lệnh" : "—"}</span>;
  return (
    <span style={mono}>
      <b style={{ color: x.phia > 0 ? XANH : DO }}>{x.phia > 0 ? "Mua" : "Bán"}</b> {d1(x.vao)} <span style={{ color: MUTED }}>{x.gioVao}</span> → {x.ra != null ? d1(x.ra) : "…"}{" "}
      <span style={{ color: MUTED }}>{x.lyDo === "catLo" ? "cắt lỗ" : x.lyDo === "cuoiPhien" ? "14:29" : "đang giữ"}</span>
    </span>
  );
}

export default function PhaVoPhaiSinh() {
  const [du, setDu] = useState(null);
  const [lichSu, setLichSu] = useState(null);
  const [loi, setLoi] = useState(null);
  const [ngayXem, setNgayXem] = useState("");
  const [bao, setBao] = useState(false);
  const [suKien, setSuKien] = useState([]);
  const truoc = useRef(null);
  const baoRef = useRef(false);
  baoRef.current = bao;

  // Tai trang thai: 15 giay / lan trong phien, 30 giay truoc phien va nghi trua, 5 phut sau phien; xem lai ngay cu thi chi tai 1 lan.
  useEffect(() => {
    let huy = false;
    let hen = null;
    truoc.current = null;
    const tai = async () => {
      let pha = null;
      try {
        const r = await fetch(`/api/phai-sinh${ngayXem ? `?ngay=${ngayXem}` : ""}`, { cache: "no-store" });
        const j = await r.json();
        if (huy) return;
        if (j.trangThai !== "ok") setLoi(j.thongBao || "Không lấy được dữ liệu.");
        else {
          setLoi(null);
          setDu(j);
          pha = j.pha;
          if (!ngayXem) xetThayDoi(j);
        }
      } catch {
        if (!huy) setLoi("Không kết nối được máy chủ.");
      }
      if (huy || ngayXem) return;
      hen = setTimeout(tai, pha === "trongPhien" ? 15000 : pha === "sauPhien" ? 300000 : 30000);
    };
    tai();
    return () => {
      huy = true;
      clearTimeout(hen);
    };
  }, [ngayXem]);

  useEffect(() => {
    let huy = false;
    const tai = () =>
      fetch("/api/phai-sinh?lichSu=1", { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => {
          if (!huy && j.trangThai === "ok") setLichSu(j.lichSu);
        })
        .catch(() => {});
    tai();
    const hen = setInterval(tai, 600000);
    return () => {
      huy = true;
      clearInterval(hen);
    };
  }, []);

  // Phat hien trang thai doi (vua co lenh / vua thoat) -> ghi su kien, thong bao trinh duyet, tieng bip
  function xetThayDoi(j) {
    const moi = { bd: j.bienDong?.trangThai, km: j.khoangMoCua?.trangThai, ngay: j.ngay };
    const cu = truoc.current;
    truoc.current = moi;
    if (!cu || cu.ngay !== moi.ngay) return;
    const tin = [];
    for (const [khoa, ten, x] of [["bd", "Biến động 0,3", j.bienDong], ["km", "Khoảng mở cửa 15'", j.khoangMoCua]]) {
      if (cu[khoa] === moi[khoa]) continue;
      if (moi[khoa] === "dangGiu") tin.push(`${ten}: ${x.phia > 0 ? "MUA" : "BÁN KHỐNG"} ${d1(x.vao.gia)} lúc ${x.vao.gio}, cắt lỗ ${d1(x.catLo)}`);
      else if (moi[khoa] === "catLo") tin.push(`${ten}: CẮT LỖ ${d1(x.ra.gia)} lúc ${x.ra.gio} (${diemCoDau(x.diemSauPhi)} điểm)`);
      else if (moi[khoa] === "cuoiPhien") tin.push(`${ten}: đóng cuối phiên ${d1(x.ra.gia)} (${diemCoDau(x.diemSauPhi)} điểm)`);
      else if (moi[khoa] === "cho" && cu[khoa] === "dangDo") tin.push(`${ten}: đã có khoảng mở cửa, đỉnh ${d1(x.dinh)} đáy ${d1(x.day)}`);
    }
    if (!tin.length) return;
    const gio = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    setSuKien((ds) => [...tin.map((t) => `${gio} · ${t}`), ...ds].slice(0, 8));
    if (!baoRef.current) return;
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") for (const t of tin) new Notification("VN30F1M · phá vỡ trong ngày", { body: t });
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        const a = new Ctx();
        const o = a.createOscillator();
        const g = a.createGain();
        o.frequency.value = 880;
        g.gain.value = 0.08;
        o.connect(g);
        g.connect(a.destination);
        o.start();
        o.stop(a.currentTime + 0.35);
      }
    } catch {
      /* trinh duyet chan thong bao / am thanh: van con dong su kien tren trang */
    }
  }
  async function batTatBao() {
    if (bao) return setBao(false);
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") await Notification.requestPermission();
    } catch {
      /* bo qua */
    }
    setBao(true);
  }

  const b = du?.bienDong || {};
  const k = du?.khoangMoCua || {};
  const pt = du?.phienTruoc;
  const cach = pt ? 0.3 * pt.bienDo : null;
  // Phien dau hop dong moi: ban kiem chung bo qua kieu bien dong (bien do hom truoc la cua hop dong cu) -> khong cong vao tong
  const boQua = (x, khoa) => khoa === "bienDong" && x.phienDauHopDong;
  const duocTinh = (khoa) => (lichSu || []).filter((x) => !x.dangChay && x[khoa].phia && !boQua(x, khoa));
  const tong = (khoa) => duocTinh(khoa).reduce((s, x) => s + x[khoa].diemSauPhi, 0);
  const soLenh = (khoa) => duocTinh(khoa).length;
  const soThang = (khoa) => duocTinh(khoa).filter((x) => x[khoa].diemSauPhi > 0).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8" style={{ color: TEXT }}>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
            Phá vỡ trong ngày · VN30F1M
          </h1>
          <p className="text-sm" style={{ color: MUTED }}>
            {du ? (
              <>
                Phiên {ngayHien(du.ngay)} · {NHAN_PHA[du.pha]}
                {du.giaHienTai != null && (
                  <>
                    {" "}
                    · giá <b style={{ color: TEXT, ...mono }}>{d1(du.giaHienTai)}</b>
                  </>
                )}{" "}
                · cập nhật {new Date(du.capNhatLuc).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </>
            ) : (
              "Đang tải…"
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={ngayXem}
            max={du?.homNay}
            onChange={(e) => setNgayXem(e.target.value)}
            aria-label="Xem lại ngày"
            className="px-2 py-1.5 rounded-md text-sm"
            style={{ background: NEN_CARD, border: `1px solid ${VIEN}`, color: TEXT }}
          />
          {ngayXem && (
            <button type="button" onClick={() => setNgayXem("")} className="px-3 py-1.5 rounded-md text-sm cursor-pointer flex items-center gap-1.5" style={{ border: `1px solid ${VIEN}`, color: TEXT }}>
              <RotateCcw size={14} /> Hôm nay
            </button>
          )}
          <button
            type="button"
            onClick={batTatBao}
            aria-pressed={bao}
            className="px-3 py-1.5 rounded-md text-sm cursor-pointer flex items-center gap-1.5"
            style={{ border: `1px solid ${bao ? XANH : VIEN}`, color: bao ? XANH : MUTED }}
            title="Báo bằng thông báo trình duyệt và tiếng bíp khi có lệnh mới hoặc lệnh thoát (chỉ khi trang này đang mở)"
          >
            {bao ? <Bell size={14} /> : <BellOff size={14} />} {bao ? "Đang bật báo" : "Bật báo"}
          </button>
        </div>
      </div>

      {loi && (
        <p className="text-sm mb-4" style={{ color: DO }}>
          {loi}
        </p>
      )}
      {du?.phienDauHopDong && (
        <p className="text-sm mb-4 rounded-xl p-3" style={{ border: `1px solid ${VANG}`, color: VANG }}>
          Hôm nay là phiên đầu của hợp đồng mới (sau ngày đáo hạn). Bản kiểm chứng bỏ qua kiểu phá vỡ biến động trong ngày này vì biên độ hôm trước là của hợp đồng cũ.
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <The tieuDe="Phá vỡ biến động 0,3" moTa="Đặt lệnh dừng hai phía quanh giá mở cửa. Giá chạm mức nào trước thì vào theo hướng đó, cắt lỗ tại giá mở cửa." trangThai={b.trangThai}>
          {pt && (
            <p className="text-xs mb-2" style={{ color: MUTED }}>
              Biên độ phiên {ngayHien(du.ngayTruoc)}: <b style={{ color: TEXT, ...mono }}>{d1(pt.bienDo)}</b> điểm ({d1(pt.thap)} – {d1(pt.cao)}) → khoảng cách đặt lệnh <b style={{ color: TEXT, ...mono }}>{d1(cach)}</b> điểm
            </p>
          )}
          {b.giaMoCua != null ? (
            <>
              <Dong nhan="MUA khi giá chạm" gia={`≥ ${d1(b.mucMua)}`} mau={XANH} />
              <Dong nhan="BÁN KHỐNG khi giá chạm" gia={`≤ ${d1(b.mucBan)}`} mau={DO} />
              <Dong nhan="Cắt lỗ" ghiChu="bằng giá mở cửa" gia={d1(b.catLo)} />
            </>
          ) : (
            cach != null && (
              <>
                <Dong nhan="MUA khi giá chạm" gia={`mở cửa + ${d1(cach)}`} mau={XANH} />
                <Dong nhan="BÁN KHỐNG khi giá chạm" gia={`mở cửa − ${d1(cach)}`} mau={DO} />
                <Dong nhan="Cắt lỗ" gia="giá mở cửa" />
              </>
            )
          )}
          <LenhDangCo x={b} />
        </The>

        <The tieuDe="Khoảng mở cửa 15 phút" moTa="Đỉnh và đáy của 9:00–9:15. Nến 1 phút đóng cửa vượt ra ngoài thì vào theo hướng đó, cắt lỗ ở biên đối diện." trangThai={k.trangThai}>
          {k.dinh != null && Number.isFinite(k.dinh) ? (
            <>
              <Dong nhan="MUA khi nến 1 phút đóng cửa" gia={`> ${d1(k.dinh)}`} mau={XANH} ghiChu={k.trangThai === "dangDo" ? "đỉnh tạm tính, chốt lúc 9:15" : "cắt lỗ tại đáy khoảng"} />
              <Dong nhan="BÁN KHỐNG khi nến 1 phút đóng cửa" gia={`< ${d1(k.day)}`} mau={DO} ghiChu={k.trangThai === "dangDo" ? "đáy tạm tính, chốt lúc 9:15" : "cắt lỗ tại đỉnh khoảng"} />
              <Dong nhan="Độ rộng khoảng" gia={`${d1(k.dinh - k.day)} điểm`} />
            </>
          ) : (
            <p className="text-sm" style={{ color: MUTED }}>
              Mức mua và bán có sau 9:15.
            </p>
          )}
          <LenhDangCo x={k} />
        </The>
      </div>

      <div className="rounded-2xl border p-3 mb-4 text-sm" style={{ borderColor: VIEN, background: NEN_CARD, color: MUTED }}>
        <b style={{ color: TEXT }}>Luật chung:</b> mỗi kiểu tối đa 1 lệnh mỗi ngày · chỉ vào lệnh trước 13:29 · không chốt lời sớm · chưa bị cắt lỗ thì đóng lúc 14:29, không giữ qua đêm.
      </div>

      {suKien.length > 0 && (
        <div className="rounded-2xl border p-3 mb-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: MUTED }}>
            Diễn biến từ lúc mở trang
          </p>
          {suKien.map((t, i) => (
            <p key={i} className="text-sm" style={{ color: TEXT }}>
              {t}
            </p>
          ))}
        </div>
      )}

      <div className="rounded-2xl border overflow-hidden mb-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <p className="px-3 py-2 text-xs border-b" style={{ borderColor: VIEN, color: MUTED }}>
          Nến 1 phút phiên {ngayHien(du?.ngay)} · BĐ = phá vỡ biến động, KM = khoảng mở cửa
        </p>
        <BieuDoTrongNgay du={du} />
      </div>

      <div className="rounded-2xl border overflow-hidden mb-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <p className="px-3 py-2 text-xs border-b" style={{ borderColor: VIEN, color: MUTED }}>
          {lichSu ? `${lichSu.length} phiên gần nhất · điểm sau phí và thuế, chưa trừ trượt giá · * phiên đầu hợp đồng mới, kiểu biến động không tính vào tổng` : "Đang tải lịch sử…"}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 760 }}>
            <thead>
              <tr style={{ color: MUTED }}>
                <th className="text-left font-normal px-3 py-2">Ngày</th>
                <th className="text-left font-normal px-3 py-2">Biến động 0,3</th>
                <th className="text-right font-normal px-3 py-2">Điểm</th>
                <th className="text-left font-normal px-3 py-2">Khoảng mở cửa 15&apos;</th>
                <th className="text-right font-normal px-3 py-2">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {(lichSu || []).map((x) => (
                <tr key={x.ngay} className="border-t cursor-pointer" style={{ borderColor: "var(--vien-nhe)" }} onClick={() => setNgayXem(x.dangChay ? "" : x.ngay)} title="Bấm để xem lại ngày này">
                  <td className="px-3 py-1.5 whitespace-nowrap" style={mono}>
                    {ngayHien(x.ngay).slice(0, 5)}
                    {x.dangChay && <span style={{ color: VANG }}> ●</span>}
                    {x.phienDauHopDong && <span style={{ color: VANG }} title="Phiên đầu hợp đồng mới"> *</span>}
                  </td>
                  <td className="px-3 py-1.5 whitespace-nowrap" style={boQua(x, "bienDong") ? { opacity: 0.45 } : undefined} title={boQua(x, "bienDong") ? "Phiên đầu hợp đồng mới: không tính vào tổng" : undefined}>
                    <OKetQua x={x.bienDong} />
                  </td>
                  <td className="px-3 py-1.5 text-right whitespace-nowrap" style={{ ...mono, color: !x.bienDong.phia ? MUTED : x.bienDong.diemSauPhi > 0 ? XANH : DO, opacity: boQua(x, "bienDong") ? 0.45 : 1 }}>
                    {x.bienDong.phia ? diemCoDau(x.bienDong.diemSauPhi) : ""}
                  </td>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    <OKetQua x={x.khoangMoCua} />
                  </td>
                  <td className="px-3 py-1.5 text-right whitespace-nowrap" style={{ ...mono, color: !x.khoangMoCua.phia ? MUTED : x.khoangMoCua.diemSauPhi > 0 ? XANH : DO }}>
                    {x.khoangMoCua.phia ? diemCoDau(x.khoangMoCua.diemSauPhi) : ""}
                  </td>
                </tr>
              ))}
              {lichSu && (
                <tr className="border-t" style={{ borderColor: VIEN }}>
                  <td className="px-3 py-2 font-bold">Tổng</td>
                  <td className="px-3 py-2" style={{ color: MUTED }}>
                    {soLenh("bienDong")} lệnh, thắng {soThang("bienDong")}
                  </td>
                  <td className="px-3 py-2 text-right font-bold" style={{ ...mono, color: tong("bienDong") > 0 ? XANH : DO }}>
                    {diemCoDau(tong("bienDong"))}
                  </td>
                  <td className="px-3 py-2" style={{ color: MUTED }}>
                    {soLenh("khoangMoCua")} lệnh, thắng {soThang("khoangMoCua")}
                  </td>
                  <td className="px-3 py-2 text-right font-bold" style={{ ...mono, color: tong("khoangMoCua") > 0 ? XANH : DO }}>
                    {diemCoDau(tong("khoangMoCua"))}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px]" style={{ color: MUTED }}>
        Công cụ thống kê cá nhân, không phải khuyến nghị đầu tư và không tự đặt lệnh. Giá lấy từ nến 1 phút nên chậm hơn bảng giá vài giây đến một phút; tín hiệu khoảng mở cửa chỉ tính khi nến 1 phút đã đóng xong. Điểm sau phí theo biểu phí MBS (3.000đ + 2.700đ + 2.550đ mỗi lượt và thuế),
        1 điểm = 100.000đ mỗi hợp đồng. Trong kiểm chứng 2018–2026, mỗi kiểu chỉ thắng khoảng một phần ba số lệnh và từng thua 10–13 phiên liên tiếp.
      </p>
    </div>
  );
}
