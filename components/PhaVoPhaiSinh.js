"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, createSeriesMarkers, CandlestickSeries, LineStyle } from "lightweight-charts";
import { Bell, BellOff, RotateCcw } from "lucide-react";
import { soVN } from "@/lib/soVN";
import { laIOSChuaCaiDat, quyenHienTai } from "@/lib/dayTrinhDuyet";

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
const KHOA_VON = "cs-phai-sinh-von"; // von / so hop dong / ty le ky quy nguoi dung nhap (luu o trinh duyet nay)
const NGUON_LO_NGAY_XAU = 41.1; // diem / 1 HD: lo lon nhat trong 1 NGAY tu 2018 (21/10/2025), tinh theo tung phut (engine/dich-vu/phaisinh_margin.py)
const KHOA_BAO = "cs-phai-sinh-bao"; // nho lua chon "Bat bao" qua cac lan tai lai trang (localStorage cua trinh duyet nay)
// Hien thong bao: uu tien service worker (chay duoc tren Android / dien thoai, khi tab o nen), roi moi den new Notification (may tinh). Tra ve true neu da gui.
async function hienThongBao(tieuDe, noiDung) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
  const tuyChon = { body: noiDung, icon: "/icon-192.png", badge: "/badge-96.png", tag: `phai-sinh-${Date.now()}`, lang: "vi", vibrate: [200, 100, 200], data: { url: "/phai-sinh" } };
  try {
    if ("serviceWorker" in navigator) {
      if (!(await navigator.serviceWorker.getRegistration("/"))) await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      const reg = await navigator.serviceWorker.ready; // dang ky service worker (public/sw.js) neu chua co roi doi no san sang
      await reg.showNotification(tieuDe, tuyChon);
      return true;
    }
  } catch {
    /* thu cach 2 */
  }
  try {
    new Notification(tieuDe, { body: noiDung, icon: "/icon-192.png" });
    return true;
  } catch {
    return false;
  }
}
// Tieng bip 0,35 giay. Trinh duyet chi cho phat am thanh sau khi nguoi dung da cham vao trang it nhat 1 lan -> ctxRef giu AudioContext da "mo khoa". Tra ve true neu am thanh dang chay.
function bip(ctxRef) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    if (!ctxRef.current) ctxRef.current = new Ctx();
    const a = ctxRef.current;
    if (a.state === "suspended") a.resume().catch(() => {});
    const o = a.createOscillator();
    const g = a.createGain();
    o.frequency.value = 880;
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + 0.35);
    return a.state === "running";
  } catch {
    return false;
  }
}
const luuBao = (bat) => {
  try {
    if (bat) localStorage.setItem(KHOA_BAO, "1");
    else localStorage.removeItem(KHOA_BAO);
  } catch {
    /* trinh duyet chan localStorage: van dung duoc, chi la khong nho */
  }
};
const d1 = (v) => soVN(v, 1, true);
const diemCoDau = (v) => `${v > 0 ? "+" : ""}${soVN(v, 1, true)}`;
const trieu = (diem) => `${diem > 0 ? "+" : ""}${soVN(diem * 0.1, 2, true)} triệu`;
const ngayHien = (s) => (s ? s.split("-").reverse().join("/") : "");
// 1 ngay co toi da 2 lenh: lenh dau (o) va lenh VAO LAI sau cat lo (o.hai). co = false -> bo qua lenh vao lai.
const dsLenh = (o, co = true) => (o && o.phia ? [o, ...(co && o.hai ? [o.hai] : [])] : []);
const diemNgay = (o, co = true) => dsLenh(o, co).reduce((t, x) => t + x.diemSauPhi, 0);

const NHAN_TRANG_THAI = {
  chuaMoCua: { chu: "Chờ mở cửa", mau: MUTED },
  dangDo: { chu: "Đang đo khoảng", mau: VANG },
  cho: { chu: "Chờ tín hiệu", mau: VANG },
  khongKhop: { chu: "Hôm nay không có lệnh", mau: MUTED },
  dangGiu: { chu: "Đang giữ lệnh", mau: XANH },
  catLo: { chu: "Đã cắt lỗ", mau: DO },
  choVaoLai: { chu: "Đã cắt lỗ · chờ vào lại", mau: VANG },
  khoaLai: { chu: "Đã thoát có lãi", mau: XANH },
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

function LenhDangCo({ x, nhan }) {
  if (!x || !x.phia) return null;
  const mua = x.phia > 0;
  const mau = x.diemSauPhi > 0 ? XANH : DO;
  return (
    <div className="mt-3 rounded-xl p-3" style={{ background: "var(--nen-2, rgba(127,127,127,0.08))", border: `1px solid ${VIEN}` }}>
      {nhan && (
        <p className="text-xs mb-1" style={{ color: VANG }}>
          {nhan}
        </p>
      )}
      <p className="text-sm font-bold mb-1" style={{ color: mua ? XANH : DO }}>
        {mua ? "MUA" : "BÁN KHỐNG"} lúc {x.vao.gio} giá <span style={mono}>{d1(x.vao.gia)}</span>
      </p>
      {x.ra ? (
        <p className="text-sm" style={{ color: TEXT }}>
          {x.trangThai === "catLo" ? "Cắt lỗ" : x.trangThai === "khoaLai" ? "Thoát có lãi" : "Đóng cuối phiên"} lúc {x.ra.gio} giá <span style={mono}>{d1(x.ra.gia)}</span>
        </p>
      ) : (
        <>
          <p className="text-sm" style={{ color: TEXT }}>
            Đang giữ · cắt lỗ tại <span style={mono}>{d1(x.catLoHienTai ?? x.catLo)}</span>
          </p>
        </>
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
      if (b.daKhoa) them(b.mucKhoa, "#F6C544", "Cắt lỗ hiện tại", LineStyle.Dashed);
    }
    const h2 = b.lenhHai; // lenh VAO LAI sau cat lo
    if (h2) {
      them(h2.catLo, s.mau.do, "Cắt lỗ (lệnh 2)", LineStyle.Dotted);
      if (h2.daKhoa) them(h2.mucKhoa, "#F6C544", "Cắt lỗ hiện tại (lệnh 2)", LineStyle.Dashed);
    }
    const dd = [];
    for (const [x, lai] of [[b, false], [b.lenhHai, true]]) {
      if (x && x.phia) {
        dd.push({ time: giayTruc(du.ngay, x.vao.k), position: x.phia > 0 ? "belowBar" : "aboveBar", color: x.phia > 0 ? s.mau.xanh : s.mau.do, shape: x.phia > 0 ? "arrowUp" : "arrowDown", text: `${lai ? "Vào lại " : ""}${x.phia > 0 ? "mua" : "bán khống"}` });
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
    </span>
  );
}

// LICH SU DAI tu 2024: tom tat theo nam + theo thang (luy ke) + danh sach tung lenh (loc theo nam, "Hien them"). Diem sau phi + thue MBS, chua tru truot gia; bo phien dau hop dong moi va phien dang chay.
// DON BAY: von (trieu dong) x don bay / gia tri 1 hop dong (~1.870 diem x 100.000d = 187 trieu) = so hop dong (lam tron xuong, toi thieu 1). Lai / lo = diem x 100.000d x so hop dong; % = tren VON cua ban.
// Ky quy toi thieu ~17-18% gia tri hop dong -> don bay toi da ~5,5 lan; tren muc do thi dang lo lon se bi ep ban (margin call).
// KHUNG VON VA KY QUY: nguoi dung nhap von (trieu dong), so hop dong va ty le ky quy cua cong ty chung khoan -> ky quy ban dau, don bay, ty le su dung tai san ky quy theo quy dinh VSDC
// (80% an toan, 90% phai bo sung = call margin, 100% bi xu ly / ep dong), con bao nhieu diem nua thi cham tung nguong, ty le khi gap ngay xau nhat lich su, va muc dang co neu hom nay dang giu lenh.
const SO_NGUONG = [80, 90, 100];
function KhungKyQuy({ kq, doi, gia, b }) {
  const p = gia || 1850;
  const von = Math.max(0, Number(kq.von) || 0);
  const soHD = Math.max(0, Math.floor(Number(kq.soHD) || 0));
  const im = Math.min(60, Math.max(5, Number(kq.im) || 17));
  const giaTri = soHD * p * 0.1; // trieu dong
  const kyQuy = (giaTri * im) / 100;
  const donBay = von > 0 ? giaTri / von : 0;
  const tyLe = (loTrieu) => (von > 0 ? ((kyQuy + loTrieu) / von) * 100 : 0);
  const dung0 = tyLe(0);
  // lenh dang giu hom nay (lenh 2 neu co) + lo da chot cua lenh 1: chi LO moi tinh vao ky quy duy tri, lai khong
  const giu = b?.lenhHai && !b.lenhHai.ra ? b.lenhHai : b?.phia && !b.ra ? b : null;
  const daChot = giu && giu === b?.lenhHai ? b.diem ?? 0 : 0; // diem da chot cua lenh 1 (truoc phi) khi dang giu lenh 2
  const loDiem = giu ? Math.max(0, -(daChot + (giu.diem ?? 0))) : 0; // diem / 1 HD
  const dungNay = tyLe(loDiem * soHD * 0.1);
  const loXau = NGUON_LO_NGAY_XAU * soHD * 0.1;
  const dungXau = tyLe(loXau);
  const trang = (v) => (v >= 100 ? { chu: "Bị xử lý (ép đóng)", mau: DO } : v >= 90 ? { chu: "Phải bổ sung ký quỹ", mau: DO } : v >= 80 ? { chu: "Cảnh báo", mau: VANG } : { chu: "An toàn", mau: XANH });
  const t0 = trang(dung0);
  const toiDa3 = p > 0 ? Math.floor((3 * von) / (p * 0.1)) : 0;
  const diemToiNguong = (nguong) => (soHD > 0 ? (((nguong / 100) * von - kyQuy) / (soHD * 0.1)) - loDiem : 0);
  const o = (nhan, key, buoc, toiThieu = 0) => (
    <label className="flex items-center gap-1.5 text-sm" style={{ color: MUTED }}>
      {nhan}
      <input
        type="number"
        inputMode="decimal"
        min={toiThieu}
        step={buoc}
        value={kq[key]}
        onChange={(e) => doi({ [key]: e.target.value === "" ? "" : Math.max(toiThieu, Number(e.target.value) || 0) })}
        aria-label={nhan}
        className="w-24 px-2 py-1 rounded-md text-sm text-right"
        style={{ background: "var(--nen-phu)", border: `1px solid ${VIEN}`, color: TEXT, ...mono }}
      />
    </label>
  );
  return (
    <div className="rounded-2xl border p-4 mb-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="text-base font-bold" style={{ color: TEXT, fontFamily: "var(--font-chu)" }}>
          Vốn và ký quỹ của bạn
        </h2>
        {soHD > 0 && von > 0 && (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold" style={{ color: t0.mau, border: `1px solid ${t0.mau}` }}>
            {t0.chu} · {soVN(dung0, 0, true)}% ký quỹ
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {o("Vốn (triệu)", "von", 10, 0)}
        {o("Số hợp đồng", "soHD", 1, 0)}
        {o("Ký quỹ công ty (%)", "im", 1, 5)}
      </div>
      {soHD > 0 && von > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mt-3 rounded-lg overflow-hidden" style={{ background: "var(--vien-nhe)" }}>
            {[
              ["Giá trị hợp đồng", `${soVN(giaTri, 0, true)} triệu`, `${soHD} HĐ × ${soVN(p, 1, true)} điểm`],
              ["Ký quỹ ban đầu", `${soVN(kyQuy, 1, true)} triệu`, `${soVN((kyQuy / von) * 100, 0, true)}% vốn`],
              ["Đòn bẩy", `${soVN(donBay, 2, true)}x`, donBay > 3 ? "cao hơn mức khuyến nghị 3x" : "trong mức khuyến nghị (≤ 3x)"],
              ["Vốn còn lại", `${soVN(von - kyQuy, 0, true)} triệu`, "đệm chịu lỗ"],
            ].map(([n, v, ghi]) => (
              <div key={n} className="px-3 py-2" style={{ background: NEN_CARD }}>
                <p className="text-xs" style={{ color: MUTED }}>{n}</p>
                <p className="text-lg" style={{ ...mono, fontWeight: 700, color: n === "Đòn bẩy" && donBay > 3 ? VANG : TEXT }}>{v}</p>
                <p className="text-[11px]" style={{ color: MUTED }}>{ghi}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm">
            <p className="text-xs mb-1.5" style={{ color: MUTED }}>
              Giá đi ngược thêm bao nhiêu điểm thì chạm ngưỡng sử dụng ký quỹ{giu ? " (đã trừ lỗ đang có hôm nay)" : ""}:
            </p>
            <div className="flex flex-wrap gap-2">
              {SO_NGUONG.map((n) => {
                const d = diemToiNguong(n);
                return (
                  <span key={n} className="px-2.5 py-1 rounded-lg text-xs" style={{ border: `1px solid ${VIEN}`, color: d <= 0 ? DO : TEXT }}>
                    {n}% {n === 80 ? "cảnh báo" : n === 90 ? "bổ sung ký quỹ" : "ép đóng"}:{" "}
                    <b style={mono}>{d <= 0 ? "đã vượt" : `${soVN(d, 0, true)} điểm`}</b>
                  </span>
                );
              })}
            </div>
          </div>
          <p className="text-xs mt-2" style={{ color: MUTED }}>
            Nếu gặp ngày xấu nhất lịch sử (lỗ {soVN(NGUON_LO_NGAY_XAU, 0, true)} điểm / hợp đồng trong một phiên): sử dụng ký quỹ{" "}
            <b style={{ color: trang(dungXau).mau }}>{soVN(dungXau, 0, true)}% — {trang(dungXau).chu.toLowerCase()}</b>.
            {donBay > 3 && <span style={{ color: VANG }}> Đòn bẩy trên 3x: với vốn này nên giữ tối đa khoảng {toiDa3} hợp đồng.</span>}
            {donBay <= 3 && toiDa3 > soHD && <span> Với vốn này tối đa khoảng {toiDa3} hợp đồng (đòn bẩy ≤ 3x).</span>}
          </p>
          {giu && (
            <p className="text-xs mt-1" style={{ color: loDiem > 0 ? VANG : MUTED }}>
              Đang giữ lệnh hôm nay: {loDiem > 0 ? `lỗ ${soVN(loDiem, 1, true)} điểm → sử dụng ký quỹ ${soVN(dungNay, 0, true)}%` : "đang lãi / hòa, sử dụng ký quỹ bằng mức ban đầu (lãi không được tính vào ký quỹ duy trì trong ngày)"}.
            </p>
          )}
        </>
      ) : (
        <p className="text-xs mt-2" style={{ color: MUTED }}>
          Nhập vốn và số hợp đồng để xem ký quỹ, đòn bẩy và mức an toàn.
        </p>
      )}
      <p className="text-[11px] mt-3" style={{ color: MUTED }}>
        Ký quỹ ban đầu = 100.000đ × số hợp đồng × giá × tỷ lệ (VSDC hiện là 17%; công ty chứng khoán có thể đặt cao hơn, xem trên app của bạn). Tỷ lệ sử dụng = (ký quỹ + lỗ đang có) ÷ vốn; từ 80% cảnh báo, 90% phải bổ sung ký quỹ, 100% bị xử lý.
        Số liệu tính theo giá hiện tại, chưa gồm phí, vốn lấy là toàn bộ tiền ký quỹ nộp. Chỉ là ước tính, không phải khuyến nghị.
      </p>
    </div>
  );
}

function LichSuDai({ moDai, setMoDai, dai, namLoc, setNamLoc, soHien, setSoHien, setNgayXem, von, soHD }) {
  const [gomVaoLai, setGomVaoLai] = useState(true); // tinh ca lenh VAO LAI sau cat lo (lenh thu 2 trong ngay)
  const hang = dai?.hang || [];
  const lenhNgay = hang.filter((r) => r.phia && !r.dauHD && !r.dangChay); // moi phan tu = 1 ngay co lenh
  const lenh = lenhNgay.flatMap((r) => dsLenh(r, gomVaoLai).map((o) => ({ ...o, ngay: r.ngay }))); // moi phan tu = 1 LENH
  const lenhLai = lenhNgay.filter((r) => r.hai).map((r) => r.hai);
  const thang = (ds) => ds.filter((r) => r.diemSauPhi > 0).length;
  const tongDiem = (ds) => ds.reduce((s, r) => s + r.diemSauPhi, 0);
  const nam = [...new Set(lenh.map((r) => r.ngay.slice(0, 4)))].sort();
  const thangTheo = {};
  for (const r of lenh) (thangTheo[r.ngay.slice(0, 7)] ||= []).push(r);
  const dsThang = Object.keys(thangTheo)
    .sort()
    .map((t, i, ks) => ({ t, lenh: thangTheo[t].length, thang: thang(thangTheo[t]), diem: tongDiem(thangTheo[t]), luyKe: ks.slice(0, i + 1).reduce((x, k) => x + tongDiem(thangTheo[k]) * 0.1, 0) }));
  const loc = (namLoc ? hang.filter((r) => r.ngay.startsWith(namLoc)) : hang).slice().reverse();
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
  const ngayTe = lenhNgay.reduce((m, r) => Math.min(m, diemNgay(r, gomVaoLai)), 0);
  const thangTe = dsThang.reduce((m, x) => Math.min(m, x.diem), 0);
  const nhanThang = (t) => `${t.slice(5)}/${t.slice(2, 4)}`;
  return (
    <div className="rounded-2xl border overflow-hidden mb-4" style={{ borderColor: VIEN, background: NEN_CARD }}>
      <button type="button" onClick={() => setMoDai(!moDai)} aria-expanded={moDai} className="w-full flex items-center justify-between gap-3 px-3 py-3 text-left" style={{ color: TEXT }}>
        <span>
          <b style={{ fontFamily: "var(--font-chu)" }}>Lịch sử từ 2024</b>
          <span className="text-xs ml-2" style={{ color: MUTED }}>
            từng lệnh, theo tháng, theo năm
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
              <div className="px-3 pb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: MUTED }}>
                <label className="flex items-center gap-1.5 cursor-pointer" style={{ color: TEXT }}>
                  <input type="checkbox" checked={gomVaoLai} onChange={(e) => setGomVaoLai(e.target.checked)} />
                  Tính cả lệnh thứ 2 trong ngày
                </label>
                <span>
                  Riêng lệnh thứ 2: {lenhLai.length} lệnh · thắng {lenhLai.length ? Math.round((thang(lenhLai) / lenhLai.length) * 100) : 0}% ·{" "}
                  <b style={{ color: tongDiem(lenhLai) > 0 ? XANH : DO }}>{diemCoDau(tongDiem(lenhLai))} điểm</b>
                </span>
              </div>
              <div className="mx-3 mb-3 rounded-xl p-3" style={{ border: `1px solid ${VIEN}` }}>
                <p className="text-sm" style={{ fontWeight: 700 }}>Theo vốn và số hợp đồng của bạn</p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>
                  {soHD} hợp đồng trên vốn {soVN(von, 0, true)} triệu (nhập ở khung &ldquo;Vốn và ký quỹ của bạn&rdquo; phía trên): lãi/lỗ cả kỳ{" "}
                  <b style={{ color: tongDiem(lenh) > 0 ? XANH : DO }}>
                    {trieu(tongDiem(lenh) * soHD)} ({tongDiem(lenh) > 0 ? "+" : ""}
                    {soVN(pctVon(tongDiem(lenh)), 0, true)}% vốn)
                  </b>
                  . Sụt vốn lớn nhất <b style={{ color: DO }}>{soVN(pctVon(sut), 0, true)}%</b> · phiên tệ nhất <b style={{ color: DO }}>{trieu(ngayTe * soHD)} ({soVN(pctVon(ngayTe), 1, true)}%)</b> · tháng tệ nhất{" "}
                  <b style={{ color: DO }}>{trieu(thangTe * soHD)} ({soVN(pctVon(thangTe), 0, true)}%)</b>.
                </p>
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
                    style={{ border: `1px solid ${namLoc === y ? "#6C5CE7" : VIEN}`, color: namLoc === y ? TEXT : MUTED, fontWeight: namLoc === y ? 700 : 400 }}
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
                      <th className="text-left font-normal px-3 py-2">Lệnh</th>
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
                          {gomVaoLai && r.hai && (
                            <div className="text-xs mt-0.5">
                              <span style={{ color: VANG }}>↳ vào lại </span>
                              <OKetQua x={r.hai} />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-right whitespace-nowrap" style={{ ...mono, color: !r.phia ? MUTED : diemNgay(r, gomVaoLai) > 0 ? XANH : DO }}>
                          {r.phia ? diemCoDau(diemNgay(r, gomVaoLai)) : ""}
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
  const [kq, setKq] = useState({ von: 200, soHD: 1, im: 17 }); // von (trieu), so hop dong, ty le ky quy cong ty (%) - nho o trinh duyet nay
  const doiKq = (patch) => {
    const moi = { ...kq, ...patch };
    setKq(moi);
    try {
      localStorage.setItem(KHOA_VON, JSON.stringify(moi));
    } catch {
      /* trinh duyet chan luu tru */
    }
  };
  const amThanh = useRef(null);
  const daKhoiPhucBao = useRef(false);
  const [quyen, setQuyen] = useState(""); // quyen thong bao cua trinh duyet: granted | denied | default
  const [ketQuaThu, setKetQuaThu] = useState("");
  // Giu man hinh sang khi dang bat bao (dien thoai khoa man hinh la trinh duyet dung trang -> khong con bao)
  useEffect(() => {
    if (!bao || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let khoa = null;
    let huy = false;
    const xin = async () => {
      try {
        khoa = await navigator.wakeLock.request("screen");
      } catch {
        /* khong xin duoc (pin yeu / trinh duyet chan): bo qua */
      }
    };
    const khiHien = () => {
      if (document.visibilityState === "visible" && !huy) xin();
    };
    xin();
    document.addEventListener("visibilitychange", khiHien);
    return () => {
      huy = true;
      document.removeEventListener("visibilitychange", khiHien);
      khoa?.release().catch(() => {});
    };
  }, [bao]);
  // Sau khi tai lai trang, am thanh bi trinh duyet chan cho den khi nguoi dung cham vao trang 1 lan: mo khoa o lan cham dau tien
  useEffect(() => {
    if (!bao) return;
    const moKhoa = () => {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!amThanh.current && Ctx) amThanh.current = new Ctx();
        amThanh.current?.resume?.().catch(() => {});
      } catch {
        /* bo qua */
      }
    };
    window.addEventListener("pointerdown", moKhoa, { once: true });
    return () => window.removeEventListener("pointerdown", moKhoa);
  }, [bao]);
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
          if (!daKhoiPhucBao.current) {
            // khoi phuc lua chon "Dang bat bao" cua lan truoc (localStorage); doc sau khi trang da hien de khong lech noi dung may chu / trinh duyet
            daKhoiPhucBao.current = true;
            try {
              if (localStorage.getItem(KHOA_BAO) === "1") setBao(true);
            } catch {
              /* khong doc duoc localStorage: de mac dinh tat */
            }
            setQuyen(quyenHienTai());
            try {
              const luu = JSON.parse(localStorage.getItem(KHOA_VON) || "null");
              if (luu && typeof luu === "object") setKq((c) => ({ von: Number(luu.von) >= 0 ? Number(luu.von) : c.von, soHD: Number(luu.soHD) >= 0 ? Number(luu.soHD) : c.soHD, im: Number(luu.im) >= 5 ? Number(luu.im) : c.im }));
            } catch {
              /* khong doc duoc: giu mac dinh */
            }
          }
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
    const moi = { bd: j.bienDong?.trangThai, ngay: j.ngay, hai: j.bienDong?.lenhHai?.trangThai ?? (j.bienDong?.vaoLai === "cho" ? "cho" : null) };
    const cu = truoc.current;
    truoc.current = moi;
    if (!cu || cu.ngay !== moi.ngay) return;
    const tin = [];
    for (const [khoa, ten, x] of [["bd", "Phái sinh", j.bienDong]]) {
      if (cu[khoa] === moi[khoa]) continue;
      if (moi[khoa] === "dangGiu") tin.push(`${ten}: ${x.phia > 0 ? "MUA" : "BÁN KHỐNG"} ${d1(x.vao.gia)} lúc ${x.vao.gio}, cắt lỗ ${d1(x.catLo)}`);
      else if (moi[khoa] === "khoaLai") tin.push(`${ten}: THOÁT CÓ LÃI ${d1(x.ra.gia)} lúc ${x.ra.gio} (${diemCoDau(x.diemSauPhi)} điểm)`);
      else if (moi[khoa] === "catLo") tin.push(`${ten}: CẮT LỖ ${d1(x.ra.gia)} lúc ${x.ra.gio} (${diemCoDau(x.diemSauPhi)} điểm)`);
      else if (moi[khoa] === "cuoiPhien") tin.push(`${ten}: đóng cuối phiên ${d1(x.ra.gia)} (${diemCoDau(x.diemSauPhi)} điểm)`);
    }
    // lenh VAO LAI sau cat lo (lenh 2)
    if (cu.hai !== moi.hai) {
      const h = j.bienDong?.lenhHai;
      if (moi.hai === "cho") tin.push(`Phái sinh: đã cắt lỗ, CHỜ VÀO LẠI (mua ≥ ${d1(j.bienDong.mucMua)} hoặc bán khống ≤ ${d1(j.bienDong.mucBan)}, trước 13:29)`);
      else if (moi.hai === "dangGiu") tin.push(`Vào lại: ${h.phia > 0 ? "MUA" : "BÁN KHỐNG"} ${d1(h.vao.gia)} lúc ${h.vao.gio}, cắt lỗ ${d1(h.catLo)}`);
      else if (moi.hai === "khoaLai") tin.push(`Vào lại: THOÁT CÓ LÃI ${d1(h.ra.gia)} lúc ${h.ra.gio} (${diemCoDau(h.diemSauPhi)} điểm)`);
      else if (moi.hai === "catLo") tin.push(`Vào lại: CẮT LỖ ${d1(h.ra.gia)} lúc ${h.ra.gio} (${diemCoDau(h.diemSauPhi)} điểm)`);
      else if (moi.hai === "cuoiPhien") tin.push(`Vào lại: đóng cuối phiên ${d1(h.ra.gia)} (${diemCoDau(h.diemSauPhi)} điểm)`);
    }
    if (!tin.length) return;
    const gio = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    setSuKien((ds) => [...tin.map((t) => `${gio} · ${t}`), ...ds].slice(0, 8));
    if (!baoRef.current) return;
    // thong bao va am thanh tach rieng: loi cai nay khong lam mat cai kia; dong su kien tren trang van luon co
    for (const t of tin) hienThongBao("VN30F1M · tín hiệu", t);
    bip(amThanh);
  }
  async function batTatBao() {
    if (bao) {
      setBao(false);
      luuBao(false);
      return;
    }
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") await Notification.requestPermission();
    } catch {
      /* bo qua */
    }
    setQuyen(quyenHienTai());
    bip(amThanh); // bam nut = lan cham dau tien -> mo khoa am thanh
    setBao(true);
    luuBao(true);
  }
  // Gui thu 1 thong bao + 1 tieng bip de kiem tra may nay co nhan duoc khong
  async function guiThuBao() {
    setKetQuaThu("Đang gửi thử…");
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") await Notification.requestPermission();
    } catch {
      /* bo qua */
    }
    const q = quyenHienTai();
    setQuyen(q);
    const hien = await hienThongBao("VN30F1M · thử báo", "Nếu bạn thấy thông báo này thì báo lệnh đã hoạt động.");
    const am = bip(amThanh);
    if (hien) setKetQuaThu(am ? "Đã gửi thông báo và phát bíp." : "Đã gửi thông báo; âm thanh đang bị trình duyệt chặn (chạm vào trang một lần rồi thử lại).");
    else setKetQuaThu(typeof Notification === "undefined" ? "Trình duyệt này không hỗ trợ thông báo." : q === "denied" ? "Trình duyệt đang chặn thông báo của web này." : q === "default" ? "Bạn chưa cho phép thông báo." : "Không hiện được thông báo (trình duyệt từ chối).");
  }

  const b = du?.bienDong || {};
  // Phien dau hop dong moi: ban kiem chung bo qua kieu bien dong (bien do hom truoc la cua hop dong cu) -> khong cong vao tong
  const boQua = (x, khoa) => khoa === "bienDong" && x.phienDauHopDong;
  // moi phan tu = 1 LENH (lenh dau va lenh vao lai sau cat lo tinh rieng)
  const duocTinh = (khoa) =>
    (lichSu || [])
      .filter((x) => !x.dangChay && x[khoa].phia && !boQua(x, khoa))
      .flatMap((x) => dsLenh(x[khoa]));
  const tong = (khoa) => duocTinh(khoa).reduce((s, x) => s + x.diemSauPhi, 0);
  const soLenh = (khoa) => duocTinh(khoa).length;
  const soThang = (khoa) => duocTinh(khoa).filter((x) => x.diemSauPhi > 0).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8" style={{ color: TEXT }}>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl mb-1" style={{ fontFamily: "var(--font-chu)", fontWeight: 700 }}>
            Phái sinh · VN30F1M
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

      {bao && (
        <div className="rounded-xl p-3 mb-4 text-xs" style={{ border: `1px solid ${quyen === "granted" ? VIEN : VANG}`, background: NEN_CARD, color: MUTED }}>
          <p>
            <b style={{ color: TEXT }}>Đang bật báo.</b>{" "}
            {typeof Notification === "undefined" || (laIOSChuaCaiDat() && quyen !== "granted")
              ? "Trình duyệt này chưa nhận được thông báo: iPhone / iPad chỉ nhận khi mở web từ biểu tượng trên Màn hình chính. Vẫn có bíp và dòng diễn biến trên trang."
              : quyen === "denied"
                ? "Trình duyệt đang CHẶN thông báo của web này: mở cài đặt trang web (biểu tượng ổ khóa cạnh địa chỉ), cho phép Thông báo, rồi bấm Gửi thử."
                : quyen === "default"
                  ? "Chưa cho phép thông báo: bấm Gửi thử để trình duyệt hỏi quyền."
                  : "Báo chỉ chạy khi trang này đang mở (đừng đóng tab, đừng khóa máy lâu): trình duyệt tạm dừng trang chạy nền nên có thể trễ hoặc không báo. Trang tự giữ màn hình sáng khi bật báo."}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <button type="button" onClick={guiThuBao} className="px-2.5 py-1 rounded-md cursor-pointer" style={{ border: `1px solid ${VIEN}`, color: TEXT }}>
              Gửi thử thông báo
            </button>
            {ketQuaThu && <span style={{ color: TEXT }}>{ketQuaThu}</span>}
          </div>
        </div>
      )}
      {loi && (
        <p className="text-sm mb-4" style={{ color: DO }}>
          {loi}
        </p>
      )}
      {du?.phienDauHopDong && (
        <p className="text-sm mb-4 rounded-xl p-3" style={{ border: `1px solid ${VANG}`, color: VANG }}>
          Hôm nay là phiên đầu của hợp đồng mới (sau ngày đáo hạn): hệ thống không đưa tín hiệu trong ngày này.
        </p>
      )}

      <div className="grid gap-4 mb-4">
        <The tieuDe="Tín hiệu trong ngày" moTa="Mức mua, bán khống và cắt lỗ của hôm nay." trangThai={b.trangThaiNgay || b.trangThai}>
          {b.giaMoCua != null && (
            <>
              <Dong nhan="MUA khi giá chạm" gia={`≥ ${d1(b.mucMua)}`} mau={XANH} />
              <Dong nhan="BÁN KHỐNG khi giá chạm" gia={`≤ ${d1(b.mucBan)}`} mau={DO} />
              {b.phia ? (
                <Dong nhan="Cắt lỗ" gia={d1(b.catLo)} />
              ) : (
                <>
                  <Dong nhan="Cắt lỗ nếu MUA" gia={d1(b.catLoMua)} />
                  <Dong nhan="Cắt lỗ nếu BÁN KHỐNG" gia={d1(b.catLoBan)} />
                </>
              )}
            </>
          )}
          <LenhDangCo x={b} nhan={b.lenhHai || b.vaoLai ? "Lệnh 1" : null} />
          {b.vaoLai === "cho" && (
            <p className="mt-3 rounded-xl p-3 text-sm" style={{ border: `1px solid ${VANG}`, color: VANG }}>
              Đã cắt lỗ. <b>Chờ vào lại:</b> trước 13:29, mua nếu giá chạm lại <b style={mono}>≥ {d1(b.mucMua)}</b>, bán khống nếu <b style={mono}>≤ {d1(b.mucBan)}</b>.
            </p>
          )}
          {b.vaoLai === "khongKhop" && (
            <p className="mt-3 text-xs" style={{ color: MUTED }}>
              Đã cắt lỗ; hết giờ vào lệnh nên không có lệnh vào lại.
            </p>
          )}
          {b.lenhHai && (
            <>
              <LenhDangCo x={b.lenhHai} nhan="Lệnh 2 · vào lại" />
              <p className="text-sm mt-2" style={{ color: MUTED }}>
                Cả ngày{b.lenhHai.ra ? "" : " (tạm tính)"}:{" "}
                <b style={{ color: b.tongDiemSauPhi > 0 ? XANH : DO, ...mono }}>
                  {diemCoDau(b.tongDiemSauPhi)} điểm ({trieu(b.tongDiemSauPhi)} / hợp đồng)
                </b>
              </p>
            </>
          )}
        </The>
      </div>

      <KhungKyQuy kq={kq} doi={doiKq} gia={du?.giaHienTai} b={b} />

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
                <th className="text-left font-normal px-3 py-2">Lệnh</th>
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
                    {x.bienDong.hai && (
                      <div className="text-xs mt-0.5">
                        <span style={{ color: VANG }}>↳ vào lại </span>
                        <OKetQua x={x.bienDong.hai} />
                      </div>
                    )}
                    {x.bienDong.vaoLai === "cho" && (
                      <div className="text-xs mt-0.5" style={{ color: VANG }}>
                        ↳ chờ vào lại
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-right whitespace-nowrap" style={{ ...mono, color: !x.bienDong.phia ? MUTED : diemNgay(x.bienDong) > 0 ? XANH : DO, opacity: boQua(x, "bienDong") ? 0.45 : 1 }}>
                    {x.bienDong.phia ? diemCoDau(diemNgay(x.bienDong)) : ""}
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
      </div>

      <LichSuDai moDai={moDai} setMoDai={setMoDai} dai={dai} namLoc={namLoc} setNamLoc={setNamLoc} soHien={soHien} setSoHien={setSoHien} setNgayXem={setNgayXem} von={Number(kq.von) || 0} soHD={Math.max(1, Math.floor(Number(kq.soHD) || 1))} />

      <p className="text-[11px]" style={{ color: MUTED }}>
        Phái sinh có đòn bẩy cao, có thể mất nhiều hơn số tiền ký quỹ ban đầu. Công cụ thống kê, không phải khuyến nghị đầu tư và không tự đặt lệnh. Giá lấy từ nến 1 phút nên chậm hơn bảng giá vài giây đến một phút.
        Điểm sau phí theo biểu phí MBS (3.000đ + 2.700đ + 2.550đ mỗi lượt và thuế), 1 điểm = 100.000đ mỗi hợp đồng. Quá khứ không đảm bảo tương lai.
      </p>
    </div>
  );
}
