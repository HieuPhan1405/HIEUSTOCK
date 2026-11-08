"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, createSeriesMarkers, CandlestickSeries, LineStyle } from "lightweight-charts";
import { Bell, BellOff, RotateCcw } from "lucide-react";
import { soVN } from "@/lib/soVN";
import GiaiThichThem from "@/components/GiaiThichThem";

// TRANG /phai-sinh: tin hieu PHA VO BIEN DONG 0,3 trong ngay cho VN30F1M (thanh vien da duyet). Cat lo doi len gia vao + 2 diem khi lai 7 diem. Du lieu + logic: /api/phai-sinh (lib/phaVoPhaiSinh.js).
// Tu lam moi 15 giay trong phien. Thong bao trinh duyet + tieng bip khi trang thai lenh doi (chi khi trang dang mo).
const VIEN = "var(--vien)";
const NEN_CARD = "var(--card)";
const TEXT = "var(--chu)";
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "#F6C544";
const mono = { fontFamily: "var(--font-chu)" };
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
  khoaLai: { chu: "Đã thoát có lãi (cắt lỗ đã dời)", mau: XANH },
  cuoiPhien: { chu: "Đã đóng cuối phiên", mau: MUTED },
};
// Vi tri gia vao so voi vung gia tri phien truoc - chi de THEO DOI (xem ghi chu cuoi trang), khong phai bo loc
const NHAN_VUNG = { trong: { chu: "trong vùng giá trị hôm trước", gon: "trong", mau: VANG }, ra: { chu: "đã ra khỏi vùng giá trị hôm trước", gon: "ngoài", mau: MUTED }, vao: { chu: "ngoài vùng giá trị, hướng vào vùng", gon: "vào", mau: MUTED } };
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
          {x.trangThai === "catLo" ? "Cắt lỗ" : x.trangThai === "khoaLai" ? "Thoát khi giá quay lại mức cắt lỗ đã dời" : "Đóng cuối phiên"} lúc {x.ra.gio} giá <span style={mono}>{d1(x.ra.gia)}</span>
        </p>
      ) : (
        <>
          <p className="text-sm" style={{ color: TEXT }}>
            Đang giữ · cắt lỗ tại <span style={mono}>{d1(x.catLoHienTai ?? x.catLo)}</span>
            {x.daKhoa ? " (đã dời lên giá vào + 2 điểm)" : ""} · đóng lúc 14:29
          </p>
          {!x.daKhoa && x.mucKich != null && (
            <p className="text-xs mt-1" style={{ color: VANG }}>
              Khi giá chạm <b style={mono}>{d1(x.mucKich)}</b> (lãi 7 điểm): dời cắt lỗ lên <b style={mono}>{d1(x.mucKhoa)}</b>
            </p>
          )}
        </>
      )}
      {NHAN_VUNG[x.viTriVao] && (
        <p className="text-xs mt-1" style={{ color: NHAN_VUNG[x.viTriVao].mau }}>
          Giá vào {NHAN_VUNG[x.viTriVao].chu}
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
        <h2 className="text-base font-bold" style={{ color: TEXT, fontFamily: "var(--font-chu)" }}>
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
      layout: { background: { type: "solid", color: m.nen }, textColor: m.mo, fontFamily: "var(--font-chu)", fontSize: 11 },
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
    them(b.mucMua, s.mau.xanh, "Mua");
    them(b.mucBan, s.mau.do, "Bán khống");
    them(b.giaMoCua, s.mau.mo, "Mở cửa", LineStyle.Dotted);
    // cat lo ban dau: chua vao lenh thi ve ca 2 muc du kien (mua / ban khong), da vao thi ve muc cua lenh dang co
    if (b.phia) them(b.catLo, s.mau.do, "Cắt lỗ", LineStyle.Dotted);
    else {
      if (b.catLoMua != null) them(b.catLoMua, s.mau.do, "Cắt lỗ nếu mua", LineStyle.SparseDotted);
      if (b.catLoBan != null) them(b.catLoBan, s.mau.do, "Cắt lỗ nếu bán", LineStyle.SparseDotted);
    }
    if (b.phia) {
      // moc doi cat lo (lai 7 diem) va cat lo da doi
      if (b.daKhoa) them(b.mucKhoa, "#F6C544", "Cắt lỗ đã dời", LineStyle.Dashed);
      else them(b.mucKich, "#F6C544", "Lãi 7đ → dời cắt lỗ", LineStyle.SparseDotted);
    }
    const vg = du.vungGiaTriTruoc;
    if (vg) {
      them(vg.vah, "#A78BFA", "VAH", LineStyle.LargeDashed);
      them(vg.val, "#A78BFA", "VAL", LineStyle.LargeDashed);
      them(vg.poc, "#A78BFA", "POC", LineStyle.Dotted);
    }
    const dd = [];
    {
      const x = b;
      if (x.phia) {
        dd.push({ time: giayTruc(du.ngay, x.vao.k), position: x.phia > 0 ? "belowBar" : "aboveBar", color: x.phia > 0 ? s.mau.xanh : s.mau.do, shape: x.phia > 0 ? "arrowUp" : "arrowDown", text: x.phia > 0 ? "Mua" : "Bán khống" });
        if (x.ra) dd.push({ time: giayTruc(du.ngay, x.ra.k), position: x.phia > 0 ? "aboveBar" : "belowBar", color: s.mau.mo, shape: "circle", text: x.trangThai === "catLo" ? "cắt lỗ" : x.trangThai === "khoaLai" ? "thoát lãi" : "đóng" });
      }
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
      <span style={{ color: MUTED }}>{x.lyDo === "catLo" ? "cắt lỗ" : x.lyDo === "khoaLai" ? "thoát lãi" : x.lyDo === "cuoiPhien" ? "14:29" : "đang giữ"}</span>
      {NHAN_VUNG[x.viTri] && (
        <span className="ml-2 text-[11px]" style={{ color: NHAN_VUNG[x.viTri].mau }} title={`Giá vào ${NHAN_VUNG[x.viTri].chu}`}>
          {NHAN_VUNG[x.viTri].gon}
        </span>
      )}
    </span>
  );
}

// LICH SU DAI tu 2024: tom tat theo nam + theo thang (luy ke) + danh sach tung lenh (loc theo nam, "Hien them"). Diem sau phi + thue MBS, chua tru truot gia; bo phien dau hop dong moi va phien dang chay.
// DON BAY: von (trieu dong) x don bay / gia tri 1 hop dong (~1.870 diem x 100.000d = 187 trieu) = so hop dong (lam tron xuong, toi thieu 1). Lai / lo = diem x 100.000d x so hop dong; % = tren VON cua ban.
// Ky quy toi thieu ~17-18% gia tri hop dong -> don bay toi da ~5,5 lan; tren muc do thi dang lo lon se bi ep ban (margin call).
const GIA_TRI_HD = 187; // trieu dong, 1 hop dong ~ 1.870 diem
const DON_BAY = [1, 2, 3, 4, 5];
function LichSuDai({ moDai, setMoDai, dai, namLoc, setNamLoc, soHien, setSoHien, setNgayXem }) {
  const [donBay, setDonBay] = useState(1);
  const [von, setVon] = useState(200); // trieu dong
  const hang = dai?.hang || [];
  const lenh = hang.filter((r) => r.phia && !r.dauHD && !r.dangChay);
  const thang = (ds) => ds.filter((r) => r.diemSauPhi > 0).length;
  const tongDiem = (ds) => ds.reduce((s, r) => s + r.diemSauPhi, 0);
  const nam = [...new Set(lenh.map((r) => r.ngay.slice(0, 4)))].sort();
  const thangTheo = {};
  for (const r of lenh) (thangTheo[r.ngay.slice(0, 7)] ||= []).push(r);
  const dsThang = Object.keys(thangTheo)
    .sort()
    .map((t, i, ks) => ({ t, lenh: thangTheo[t].length, thang: thang(thangTheo[t]), diem: tongDiem(thangTheo[t]), luyKe: ks.slice(0, i + 1).reduce((x, k) => x + tongDiem(thangTheo[k]) * 0.1, 0) }));
  const loc = (namLoc ? hang.filter((r) => r.ngay.startsWith(namLoc)) : hang).slice().reverse();
  const soHD = Math.max(1, Math.floor((von * donBay) / GIA_TRI_HD));
  const thieuVon = von * donBay < GIA_TRI_HD;
  const tr = (diem) => diem * 0.1 * soHD; // diem -> trieu dong voi soHD hop dong
  const pctVon = (diem) => (von > 0 ? (tr(diem) / von) * 100 : 0);
  // sut von lon nhat (theo lenh, cong don) va ngay / thang te nhat, tinh theo % von
  let dinh = 0;
  let cd = 0;
  let sut = 0;
  for (const r of lenh) {
    cd += r.diemSauPhi;
    dinh = Math.max(dinh, cd);
    sut = Math.min(sut, cd - dinh);
  }
  const ngayTe = lenh.reduce((m, r) => Math.min(m, r.diemSauPhi), 0);
  const thangTe = dsThang.reduce((m, x) => Math.min(m, x.diem), 0);
  const nhanThang = (t) => `${t.slice(5)}/${t.slice(2, 4)}`;
  return (
    <div className="rounded-2xl border overflow-hidden mb-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <button type="button" onClick={() => setMoDai(!moDai)} aria-expanded={moDai} className="w-full flex items-center justify-between gap-3 px-3 py-3 text-left" style={{ color: TEXT }}>
        <span>
          <b style={{ fontFamily: "var(--font-chu)" }}>Lịch sử từ 2024</b>
          <span className="text-xs ml-2" style={{ color: MUTED }}>
            từng lệnh, theo tháng, theo năm · cách biến động 0,3
          </span>
        </span>
        <span className="text-sm" style={{ color: MUTED }}>{moDai ? "Thu gọn" : "Xem"}</span>
      </button>
      {moDai && (
        <div className="border-t" style={{ borderColor: VIEN }}>
          {!dai ? (
            <p className="px-3 py-4 text-sm" style={{ color: MUTED }}>Đang tải lịch sử…</p>
          ) : (
            <>
              <div className="px-3 py-3 grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: "var(--vien-nhe)" }}>
                {[
                  ["Số lệnh", lenh.length, null],
                  ["Thắng", `${thang(lenh)} (${lenh.length ? Math.round((thang(lenh) / lenh.length) * 100) : 0}%)`, null],
                  ["Tổng điểm sau phí", diemCoDau(tongDiem(lenh)), tongDiem(lenh) > 0 ? XANH : DO],
                  [`Lãi/lỗ với ${soHD} hợp đồng`, trieu(tongDiem(lenh) * soHD), tongDiem(lenh) > 0 ? XANH : DO],
                ].map(([n, v, m]) => (
                  <div key={n} className="px-3 py-2" style={{ background: NEN_CARD }}>
                    <p className="text-xs" style={{ color: MUTED }}>{n}</p>
                    <p className="text-lg" style={{ ...mono, fontWeight: 700, color: m || TEXT }}>{v}</p>
                  </div>
                ))}
              </div>
              <div className="mx-3 mb-3 rounded-xl p-3" style={{ border: `1px solid ${VIEN}` }}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="text-sm" style={{ fontWeight: 700 }}>Tính theo đòn bẩy</span>
                  <label className="flex items-center gap-1.5 text-sm" style={{ color: MUTED }}>
                    Vốn của bạn
                    <input
                      type="number"
                      inputMode="numeric"
                      min={10}
                      step={10}
                      value={von}
                      onChange={(e) => setVon(Math.max(0, Number(e.target.value) || 0))}
                      aria-label="Vốn (triệu đồng)"
                      className="w-24 px-2 py-1 rounded-md text-sm text-right"
                      style={{ background: "var(--nen-phu)", border: `1px solid ${VIEN}`, color: TEXT, ...mono }}
                    />
                    triệu
                  </label>
                  <div role="radiogroup" aria-label="Đòn bẩy" className="flex items-center gap-1.5">
                    <span className="text-sm" style={{ color: MUTED }}>Đòn bẩy</span>
                    {DON_BAY.map((x) => (
                      <button
                        key={x}
                        type="button"
                        role="radio"
                        aria-checked={donBay === x}
                        onClick={() => setDonBay(x)}
                        className="px-2.5 py-1 rounded-full text-xs"
                        style={{ border: `1px solid ${donBay === x ? "#8B5CF6" : VIEN}`, background: donBay === x ? "rgba(139,92,246,0.18)" : "transparent", color: donBay === x ? TEXT : MUTED, fontWeight: donBay === x ? 700 : 400 }}
                      >
                        {x === 1 ? "Không" : `${x}x`}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs mt-2" style={{ color: MUTED }}>
                  {thieuVon ? (
                    <b style={{ color: DO }}>Vốn × đòn bẩy chưa đủ cho 1 hợp đồng (≈ {GIA_TRI_HD} triệu). Tăng vốn hoặc đòn bẩy; bên dưới tạm tính 1 hợp đồng.</b>
                  ) : (
                    <>
                      {soHD} hợp đồng (≈ {soVN(soHD * GIA_TRI_HD, 0, true)} triệu giá trị) trên vốn {soVN(von, 0, true)} triệu: lãi/lỗ cả kỳ{" "}
                      <b style={{ color: tongDiem(lenh) > 0 ? XANH : DO }}>
                        {trieu(tongDiem(lenh) * soHD)} ({tongDiem(lenh) > 0 ? "+" : ""}
                        {soVN(pctVon(tongDiem(lenh)), 0, true)}% vốn)
                      </b>
                      . Sụt vốn lớn nhất <b style={{ color: DO }}>{soVN(pctVon(sut), 0, true)}%</b> · phiên tệ nhất <b style={{ color: DO }}>{trieu(ngayTe * soHD)} ({soVN(pctVon(ngayTe), 1, true)}%)</b> · tháng tệ nhất{" "}
                      <b style={{ color: DO }}>{trieu(thangTe * soHD)} ({soVN(pctVon(thangTe), 0, true)}%)</b>.
                    </>
                  )}
                </p>
                {donBay >= 4 && (
                  <p className="text-xs mt-1" style={{ color: VANG }}>
                    Đòn bẩy {donBay}x: ký quỹ chỉ còn {soVN(100 / donBay, 0, true)}% giá trị hợp đồng. Lỗ vài phiên liền có thể chạm mức ký quỹ tối thiểu (khoảng 17–18%) và bị ép bán; từ {Math.floor(100 / 18)}x trở lên rất dễ mất gần hết vốn.
                  </p>
                )}
                <p className="text-[11px] mt-1" style={{ color: MUTED }}>
                  Giả định giá trị 1 hợp đồng ≈ 187 triệu (1.870 điểm). Chưa tính lãi vay, chưa nhập lãi vào vốn, chưa trừ trượt giá. Số liệu quá khứ, không phải khuyến nghị.
                </p>
              </div>
              {dai.thieu && (
                <p className="px-3 pb-2 text-xs" style={{ color: VANG }}>
                  Chưa cập nhật các phiên từ {ngayHien(dai.thieu.tu)} đến {ngayHien(dai.thieu.den)} (bản chụp cũ), nên tổng ở trên có thể thiếu vài phiên.
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: 480 }}>
                  <thead>
                    <tr style={{ color: MUTED }}>
                      <th className="text-left font-normal px-3 py-2">Năm</th>
                      <th className="text-right font-normal px-3 py-2">Lệnh</th>
                      <th className="text-right font-normal px-3 py-2">Thắng</th>
                      <th className="text-right font-normal px-3 py-2">Điểm sau phí</th>
                      <th className="text-right font-normal px-3 py-2">Triệu đồng ({soHD} HĐ)</th>
                      <th className="text-right font-normal px-3 py-2">% vốn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nam.map((y) => {
                      const g = lenh.filter((r) => r.ngay.startsWith(y));
                      return (
                        <tr key={y} className="border-t" style={{ borderColor: "var(--vien-nhe)" }}>
                          <td className="px-3 py-1.5" style={mono}>{y}</td>
                          <td className="px-3 py-1.5 text-right" style={mono}>{g.length}</td>
                          <td className="px-3 py-1.5 text-right" style={mono}>{thang(g)} ({Math.round((thang(g) / g.length) * 100)}%)</td>
                          <td className="px-3 py-1.5 text-right" style={{ ...mono, color: tongDiem(g) > 0 ? XANH : DO }}>{diemCoDau(tongDiem(g))}</td>
                          <td className="px-3 py-1.5 text-right" style={{ ...mono, color: tongDiem(g) > 0 ? XANH : DO }}>{trieu(tongDiem(g) * soHD).replace(" triệu", "")}</td>
                          <td className="px-3 py-1.5 text-right" style={{ ...mono, color: tongDiem(g) > 0 ? XANH : DO }}>
                            {tongDiem(g) > 0 ? "+" : ""}
                            {soVN(pctVon(tongDiem(g)), 0, true)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="px-3 py-2 text-xs border-t" style={{ borderColor: VIEN, color: MUTED }}>Theo tháng (điểm sau phí · lũy kế triệu đồng · % vốn của tháng)</p>
              <div className="px-3 pb-3 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {dsThang.map((m) => (
                  <div key={m.t} className="rounded-lg px-2 py-1.5" style={{ border: `1px solid ${VIEN}` }} title={`${m.lenh} lệnh, thắng ${m.thang}`}>
                    <p className="text-[11px]" style={{ color: MUTED }}>{nhanThang(m.t)}</p>
                    <p className="text-sm" style={{ ...mono, fontWeight: 700, color: m.diem > 0 ? XANH : DO }}>{diemCoDau(m.diem)}</p>
                    <p className="text-[11px]" style={{ ...mono, color: MUTED }}>{soVN(m.luyKe * soHD, 1, true)} tr · {m.diem > 0 ? "+" : ""}{soVN(pctVon(m.diem), 0, true)}%</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-t" style={{ borderColor: VIEN }}>
                <span className="text-xs" style={{ color: MUTED }}>Từng lệnh:</span>
                {["", ...nam].map((y) => (
                  <button
                    key={y || "tat"}
                    type="button"
                    onClick={() => {
                      setNamLoc(y);
                      setSoHien(40);
                    }}
                    className="px-2.5 py-1 rounded-full text-xs"
                    style={{ border: `1px solid ${namLoc === y ? "#8B5CF6" : VIEN}`, color: namLoc === y ? TEXT : MUTED, fontWeight: namLoc === y ? 700 : 400 }}
                  >
                    {y || "Tất cả"}
                  </button>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: 440 }}>
                  <thead>
                    <tr style={{ color: MUTED }}>
                      <th className="text-left font-normal px-3 py-2">Ngày</th>
                      <th className="text-left font-normal px-3 py-2">Biến động 0,3</th>
                      <th className="text-right font-normal px-3 py-2">Điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loc.slice(0, soHien).map((r) => (
                      <tr key={r.ngay} className="border-t cursor-pointer" style={{ borderColor: "var(--vien-nhe)", opacity: r.dauHD ? 0.45 : 1 }} onClick={() => !r.dangChay && setNgayXem(r.ngay)} title="Bấm để xem lại ngày này (biểu đồ nến 1 phút ở trên)">
                        <td className="px-3 py-1.5 whitespace-nowrap" style={mono}>
                          {ngayHien(r.ngay).slice(0, 5)}/{r.ngay.slice(2, 4)}
                          {r.dangChay && <span style={{ color: VANG }}> ●</span>}
                          {r.dauHD && <span style={{ color: VANG }} title="Phiên đầu hợp đồng mới: không tính vào tổng"> *</span>}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          <OKetQua x={r.phia ? r : { phia: 0, lyDo: "khongKhop" }} />
                        </td>
                        <td className="px-3 py-1.5 text-right whitespace-nowrap" style={{ ...mono, color: !r.phia ? MUTED : r.diemSauPhi > 0 ? XANH : DO }}>
                          {r.phia ? diemCoDau(r.diemSauPhi) : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {loc.length > soHien && (
                <div className="px-3 py-3 text-center border-t" style={{ borderColor: "var(--vien-nhe)" }}>
                  <button type="button" onClick={() => setSoHien(soHien + 60)} className="text-sm px-3 py-1.5 rounded-lg" style={{ border: `1px solid ${VIEN}`, color: TEXT }}>
                    Hiện thêm ({loc.length - soHien} phiên)
                  </button>
                </div>
              )}
              <p className="px-3 py-2 text-[11px] border-t" style={{ borderColor: VIEN, color: MUTED }}>
                Mô phỏng trên nến 1 phút, khớp lý tưởng tại mức chạm; điểm sau phí và thuế MBS, chưa trừ trượt giá (mỗi 0,4 điểm trượt/vòng trừ thêm khoảng 0,4 điểm mỗi lệnh). Bản chụp đến {ngayHien(dai.capNhatTinh)}, các phiên gần nhất lấy trực tiếp. Quá khứ không đảm bảo tương lai.
              </p>
            </>
          )}
        </div>
      )}
    </div>
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
  // LICH SU DAI tu 2024 (chi cach bien dong 0,3): tai khi bam mo
  const [moDai, setMoDai] = useState(false);
  const [dai, setDai] = useState(null);
  const [namLoc, setNamLoc] = useState("");
  const [soHien, setSoHien] = useState(40);
  useEffect(() => {
    if (!moDai || dai) return;
    let huy = false;
    fetch("/api/phai-sinh?lichSuDai=1")
      .then((r) => r.json())
      .then((j) => !huy && j.trangThai === "ok" && setDai(j))
      .catch(() => {});
    return () => {
      huy = true;
    };
  }, [moDai, dai]);

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
    const moi = { bd: j.bienDong?.trangThai, ngay: j.ngay };
    const cu = truoc.current;
    truoc.current = moi;
    if (!cu || cu.ngay !== moi.ngay) return;
    const tin = [];
    for (const [khoa, ten, x] of [["bd", "Biến động 0,3", j.bienDong]]) {
      if (cu[khoa] === moi[khoa]) continue;
      if (moi[khoa] === "dangGiu") tin.push(`${ten}: ${x.phia > 0 ? "MUA" : "BÁN KHỐNG"} ${d1(x.vao.gia)} lúc ${x.vao.gio}, cắt lỗ ${d1(x.catLo)}`);
      else if (moi[khoa] === "khoaLai") tin.push(`${ten}: THOÁT CÓ LÃI ${d1(x.ra.gia)} lúc ${x.ra.gio} (${diemCoDau(x.diemSauPhi)} điểm, cắt lỗ đã dời)`);
      else if (moi[khoa] === "catLo") tin.push(`${ten}: CẮT LỖ ${d1(x.ra.gia)} lúc ${x.ra.gio} (${diemCoDau(x.diemSauPhi)} điểm)`);
      else if (moi[khoa] === "cuoiPhien") tin.push(`${ten}: đóng cuối phiên ${d1(x.ra.gia)} (${diemCoDau(x.diemSauPhi)} điểm)`);
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
  const pt = du?.phienTruoc;
  const cach = pt ? 0.3 * pt.bienDo : null;
  // Phien dau hop dong moi: ban kiem chung bo qua kieu bien dong (bien do hom truoc la cua hop dong cu) -> khong cong vao tong
  const boQua = (x, khoa) => khoa === "bienDong" && x.phienDauHopDong;
  const duocTinh = (khoa) => (lichSu || []).filter((x) => !x.dangChay && x[khoa].phia && !boQua(x, khoa));
  const tong = (khoa) => duocTinh(khoa).reduce((s, x) => s + x[khoa].diemSauPhi, 0);
  const soLenh = (khoa) => duocTinh(khoa).length;
  const soThang = (khoa) => duocTinh(khoa).filter((x) => x[khoa].diemSauPhi > 0).length;
  const theoVung = (khoa) =>
    ["ra", "trong", "vao"]
      .map((v) => {
        const g = duocTinh(khoa).filter((x) => x[khoa].viTri === v);
        return g.length ? `${NHAN_VUNG[v].gon} ${g.length} lệnh ${diemCoDau(g.reduce((s, x) => s + x[khoa].diemSauPhi, 0))}` : null;
      })
      .filter(Boolean)
      .join(" · ");
  const vg = du?.vungGiaTriTruoc;
  const ghiChuVung = (vt) => (NHAN_VUNG[vt] ? (vt === "trong" ? "mức này nằm trong vùng giá trị hôm trước" : vt === "ra" ? "mức này nằm ngoài vùng giá trị hôm trước" : "mức này hướng vào vùng giá trị hôm trước") : undefined);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8" style={{ color: TEXT }}>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
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

      <div className="grid gap-4 mb-4">
        <The tieuDe="Phá vỡ biến động 0,3" moTa="Đặt lệnh dừng hai phía quanh giá mở cửa. Giá chạm mức nào trước thì vào theo hướng đó, cắt lỗ tại giá mở cửa nhưng cách giá vào ít nhất 7 điểm; khi lãi 7 điểm thì dời cắt lỗ lên giá vào + 2 điểm." trangThai={b.trangThai}>
          {pt && (
            <p className="text-xs mb-2" style={{ color: MUTED }}>
              Biên độ phiên {ngayHien(du.ngayTruoc)}: <b style={{ color: TEXT, ...mono }}>{d1(pt.bienDo)}</b> điểm ({d1(pt.thap)} – {d1(pt.cao)}) → khoảng cách đặt lệnh <b style={{ color: TEXT, ...mono }}>{d1(cach)}</b> điểm
            </p>
          )}
          {b.giaMoCua != null ? (
            <>
              <Dong nhan="MUA khi giá chạm" gia={`≥ ${d1(b.mucMua)}`} mau={XANH} ghiChu={ghiChuVung(b.viTriMua)} />
              <Dong nhan="BÁN KHỐNG khi giá chạm" gia={`≤ ${d1(b.mucBan)}`} mau={DO} ghiChu={ghiChuVung(b.viTriBan)} />
              {b.phia ? (
                <Dong nhan="Cắt lỗ" ghiChu="giá mở cửa, hoặc cách giá vào 7 điểm nếu xa hơn" gia={d1(b.catLo)} />
              ) : (
                <>
                  <Dong nhan="Cắt lỗ nếu MUA" ghiChu="giá mở cửa, hoặc thấp hơn giá vào 7 điểm nếu xa hơn" gia={d1(b.catLoMua)} />
                  <Dong nhan="Cắt lỗ nếu BÁN KHỐNG" ghiChu="giá mở cửa, hoặc cao hơn giá vào 7 điểm nếu xa hơn" gia={d1(b.catLoBan)} />
                </>
              )}
              <Dong nhan="Khi lãi 7 điểm" ghiChu="dời cắt lỗ lên giá vào + 2 điểm (mua) / − 2 điểm (bán khống)" gia="khóa +2" mau={VANG} />
            </>
          ) : (
            cach != null && (
              <>
                <Dong nhan="MUA khi giá chạm" gia={`mở cửa + ${d1(cach)}`} mau={XANH} />
                <Dong nhan="BÁN KHỐNG khi giá chạm" gia={`mở cửa − ${d1(cach)}`} mau={DO} />
                <Dong nhan="Cắt lỗ" ghiChu="giá mở cửa, hoặc cách giá vào ít nhất 7 điểm" gia="≥ 7 điểm" />
                <Dong nhan="Khi lãi 7 điểm" ghiChu="dời cắt lỗ lên giá vào ± 2 điểm" gia="khóa +2" mau={VANG} />
              </>
            )
          )}
          <LenhDangCo x={b} />
        </The>
      </div>

      <div className="rounded-2xl border p-3 mb-4 text-sm" style={{ borderColor: VIEN, background: NEN_CARD, color: MUTED }}>
        <b style={{ color: TEXT }}>Luật chung:</b> tối đa 1 lệnh mỗi ngày · chỉ vào lệnh trước 13:29 · không chốt lời sớm · khi lãi 7 điểm dời cắt lỗ lên giá vào + 2 điểm · chưa bị cắt lỗ thì đóng lúc 14:29, không giữ qua đêm.
        {vg && (
          <span className="block mt-1">
            <b style={{ color: TEXT }}>Vùng giá trị phiên {ngayHien(du.ngayTruoc)}:</b> <span style={mono}>{d1(vg.val)} – {d1(vg.vah)}</span> · POC <span style={mono}>{d1(vg.poc)}</span> (chỉ để theo dõi, không phải bộ lọc)
          </span>
        )}
      </div>

      {suKien.length > 0 && (
        <div className="rounded-2xl border p-3 mb-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
          <p className="text-xs  mb-1.5" style={{ color: MUTED }}>
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
          Nến 1 phút phiên {ngayHien(du?.ngay)}
        </p>
        <BieuDoTrongNgay du={du} />
      </div>

      <div className="rounded-2xl border overflow-hidden mb-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
        <p className="px-3 py-2 text-xs border-b" style={{ borderColor: VIEN, color: MUTED }}>
          {lichSu ? `${lichSu.length} phiên gần nhất · điểm sau phí và thuế, chưa trừ trượt giá · * phiên đầu hợp đồng mới (không tính vào tổng)` : "Đang tải lịch sử…"}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 440 }}>
            <thead>
              <tr style={{ color: MUTED }}>
                <th className="text-left font-normal px-3 py-2">Ngày</th>
                <th className="text-left font-normal px-3 py-2">Biến động 0,3</th>
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
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {lichSu && theoVung("bienDong") && (
          <p className="px-3 py-2 text-xs border-t" style={{ borderColor: VIEN, color: MUTED }}>
            Theo vị trí giá vào so với vùng giá trị hôm trước: {theoVung("bienDong")}
          </p>
        )}
      </div>

      <LichSuDai moDai={moDai} setMoDai={setMoDai} dai={dai} namLoc={namLoc} setNamLoc={setNamLoc} soHien={soHien} setSoHien={setSoHien} setNgayXem={setNgayXem} />

      <GiaiThichThem className="mb-3" nhanMo="Cách làm, kiểm chứng và rủi ro" tomTat="Phái sinh có đòn bẩy cao, có thể mất nhiều hơn số tiền ký quỹ ban đầu. Đây là số liệu thống kê, không phải khuyến nghị.">
        <p>
          <b>Cách làm:</b> mỗi sáng, lấy biên độ phiên trước (cao nhất − thấp nhất) nhân 0,3 để ra khoảng cách. Đặt lệnh dừng mua ở giá mở cửa cộng khoảng cách, bán khống ở giá mở cửa trừ khoảng cách; giá chạm mức nào trước thì vào theo hướng đó.
          Cắt lỗ ban đầu tại giá mở cửa, <b>nhưng luôn cách giá vào ít nhất 7 điểm</b> (hôm trước biên độ nhỏ thì giá mở cửa chỉ cách mức vào 3–4 điểm, dễ bị quét bởi nhiễu rồi giá vẫn đi đúng hướng). <b>Khi lãi đạt 7 điểm thì dời cắt lỗ lên giá vào + 2 điểm</b> (bán khống: giá vào − 2 điểm) rồi để chạy; không chốt lời sớm, chưa bị cắt lỗ thì đóng lúc 14:29. Mỗi ngày tối đa 1 lệnh, không giữ qua đêm.
        </p>
        <p className="mt-2">
          <b>Vì sao cắt lỗ tối thiểu 7 điểm:</b> kiểm chứng 2018–2026 cho thấy cắt lỗ quá gần bị quét nhiều (tỷ lệ thắng thấp), còn cắt xa hơn 10 điểm làm lãi giảm lại. Mức 6–9 điểm đều tốt hơn cắt ở giá mở cửa; chọn 7 điểm. Tổng điểm sau phí và trượt giá tăng khoảng 12% (1.900 → 2.134 điểm), tỷ lệ lệnh thắng từ 50% lên 57%, tốt hơn ở cả giai đoạn trước và sau 07/2022. Nâng mức vào lệnh hoặc bỏ ngày biên độ nhỏ đều kém hơn nên không áp dụng.
        </p>
        <p className="mt-2">
          <b>Vì sao dời cắt lỗ:</b> nhiều lệnh chạy lãi vài điểm rồi quay đầu về cắt lỗ. Kiểm chứng cho thấy dời cắt lỗ sau khi lãi 7 điểm tốt hơn cắt lỗ cố định, còn chốt lời cố định hoặc cắt lỗ theo đuôi đều làm lãi giảm vì cắt mất các lệnh chạy xa.
        </p>
        <p className="mt-2">
          <b>Kiểm chứng trên dữ liệu 2018–2026</b> (nến 1 phút VN30F1M, đã trừ phí MBS và trượt giá 0,4 điểm mỗi vòng): lãi khoảng 18–26% mỗi năm trên giá trị hợp đồng (Sharpe 1,6–1,9), sụt vốn lớn nhất khoảng 6–9%, lãi ở hầu hết các năm nhưng năm 2026 gần như hòa vốn.
          Khoảng một nửa số lệnh thắng, lãi đến từ vài lệnh chạy xa; từng thua 10–13 phiên liên tiếp. Nếu khớp lệnh thực tế kém hơn dự kiến thì lãi giảm nhanh, và gần như hòa vốn khi trượt giá khoảng 1,5 điểm mỗi vòng.
        </p>
        <p className="mt-2">
          <b>Vốn:</b> một hợp đồng có giá trị khoảng 187 triệu đồng (1.870 điểm × 100.000đ). Kết quả trên tính theo giá trị hợp đồng chưa đòn bẩy, không nên chỉ nạp ký quỹ tối thiểu; vốn từ khoảng 90 triệu đồng cho mỗi hợp đồng giúp chịu được các chuỗi thua.
          Quá khứ không đảm bảo tương lai.
        </p>
      </GiaiThichThem>
      <p className="text-[11px]" style={{ color: MUTED }}>
        Công cụ thống kê, không phải khuyến nghị đầu tư và không tự đặt lệnh. Giá lấy từ nến 1 phút nên chậm hơn bảng giá vài giây đến một phút. Điểm sau phí theo biểu phí MBS (3.000đ + 2.700đ + 2.550đ mỗi lượt và thuế),
        1 điểm = 100.000đ mỗi hợp đồng. Vùng giá trị hôm trước là vùng giá chứa 70% khối lượng của phiên trước (VAL – VAH, POC là mức nhiều khối lượng nhất); trong kiểm chứng, lệnh có giá vào còn nằm trong vùng này gần hoà vốn,
        lệnh đã ra khỏi vùng lãi trung bình cao hơn, nhưng chênh lệch chưa đủ chắc để dùng làm bộ lọc nên chỉ ghi lại để theo dõi.
      </p>
    </div>
  );
}
