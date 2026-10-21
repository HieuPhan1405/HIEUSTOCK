import { soAn, so1So, pct } from "@/components/dungChung";
import { giaiMaCat } from "@/lib/boLocChiBao";
import { MAU_HINH, THONG_KE_MAU_HINH } from "@/lib/mauHinh";

// Cot CHI BAO KY THUAT cho bang Bo loc co phieu (khoa cot = ten truong trong bang chi_bao_ky_thuat, xem lib/cotChiBaoKyThuat.js).
// Chi hien khi nguoi dung bat trong "Cot hien thi" hoac dang loc theo chi bao do (BangBoLoc tu hien cot cua bo loc dang dung).
const MUTED = "var(--mo)";
const XANH = "var(--xanh)";
const DO = "var(--do)";
const VANG = "var(--vang)";
const NHOM = "Chỉ báo kỹ thuật";

const Trong = <span style={{ color: MUTED }}>—</span>;
const coSo = (v) => typeof v === "number" && Number.isFinite(v);
const mauDau = (v) => (v > 0 ? XANH : v < 0 ? DO : undefined);

// Cot so don gian: dinh dang `dinhDang(v)`, tuy chon mau theo gia tri.
function cotSo(khoa, nhan, dinhDang, mau, tieuDe) {
  return {
    nhan,
    nhom: NHOM,
    canPhai: true,
    lay: (r) => (coSo(r[khoa]) ? r[khoa] : null),
    hien: (r) =>
      coSo(r[khoa]) ? (
        <span style={{ color: mau ? mau(r[khoa]) : undefined }} title={tieuDe}>
          {dinhDang(r[khoa])}
        </span>
      ) : (
        Trong
      ),
  };
}

// Cot "lan cat gan nhat" (macd_cat_cach...): "↑ hôm nay" / "↑ 3 phiên trước" (cắt lên, xanh) / "↓ ..." (cắt xuống, đỏ). Sap xep: cat len gan day nhat len dau.
function cotCat(khoa, nhan, moTa) {
  return {
    nhan,
    nhom: NHOM,
    canPhai: true,
    lay: (r) => {
      const c = giaiMaCat(r[khoa]);
      return c ? c.huong * (1000 - c.cach) : null;
    },
    hien: (r) => {
      const c = giaiMaCat(r[khoa]);
      if (!c) return Trong;
      return (
        <span style={{ color: c.huong > 0 ? XANH : DO }} title={`${moTa}: cắt ${c.huong > 0 ? "lên" : "xuống"} ${c.cach === 0 ? "hôm nay" : `${c.cach} phiên trước`}`}>
          {c.huong > 0 ? "↑" : "↓"} {c.cach === 0 ? "hôm nay" : `${c.cach} phiên`}
        </span>
      );
    },
  };
}

// Cot RSI phan ky (khung ngay / tuan): "↑ hom nay" = phan ky TANG vua xac nhan (canh dao chieu), "↓ ..." = phan ky GIAM. donVi: "phiên" hoặc "tuần".
function cotPhanKy(khoa, nhan, donVi, moTa) {
  return {
    nhan,
    nhom: NHOM,
    canPhai: true,
    lay: (r) => {
      const c = giaiMaCat(r[khoa]);
      return c ? c.huong * (1000 - c.cach) : null;
    },
    hien: (r) => {
      const c = giaiMaCat(r[khoa]);
      if (!c) return Trong;
      const khi = c.cach === 0 ? (donVi === "tuần" ? "tuần này" : donVi.startsWith("nến") ? "nến này" : "hôm nay") : `${c.cach} ${donVi}`;
      return (
        <span style={{ color: c.huong > 0 ? XANH : DO }} title={`${moTa}: phân kỳ ${c.huong > 0 ? "tăng (đáy sau thấp hơn, RSI cao hơn)" : "giảm (đỉnh sau cao hơn, RSI thấp hơn)"} xác nhận ${khi === "hôm nay" || khi === "tuần này" ? khi : khi + " trước"}. Chỉ là điều kiện tham khảo.`}>
          {c.huong > 0 ? "↑ PK tăng" : "↓ PK giảm"} · {khi}
        </span>
      );
    },
  };
}

const pct1 = (v) => pct(v, 1);

// Cot DIEM MUA PHUC HOI (diem B): "hôm nay · B 10,5 · SL 9,9 · TP 11,4 / 11,6". Sap xep: diem B moi nhat (gan day nhat) len dau.
const cotDiemMuaPhucHoi = {
  nhan: "Điểm mua phục hồi",
  nhom: NHOM,
  canPhai: false,
  lay: (r) => (coSo(r.pb_cach) ? -r.pb_cach : null),
  hien: (r) => {
    if (!coSo(r.pb_cach) || !coSo(r.pb_gia)) return Trong;
    const khi = r.pb_cach === 0 ? "hôm nay" : `${r.pb_cach} phiên`;
    const cachDay = coSo(r.pb_day) && r.pb_day > 0 ? (r.pb_gia / r.pb_day - 1) * 100 : null;
    return (
      <span title={`Điểm B: đã giảm 20–30% (từ đỉnh 20 phiên) rồi đóng cửa lấy lại Tenkan và Kijun, đáy cách ≥ 3 phiên. Giải ngân 1/2 phần dự định, cắt lỗ theo SL. SL / TP theo công thức bình thường của hệ thống. Chỉ để tham khảo.${cachDay != null ? ` Giá B cách đáy 20 phiên ${soAn(cachDay, 1)}%.` : ""}`}>
        <span style={{ color: XANH, fontWeight: 600 }}>{khi}</span>{coSo(r.pb_giam) ? ` · giảm ${soAn(r.pb_giam, 0)}%` : ""} · B {soAn(r.pb_gia, 2)} · <span style={{ color: DO }}>SL {soAn(r.pb_sl, 2)}</span> · <span style={{ color: XANH }}>TP {soAn(r.pb_tp1, 2)} / {soAn(r.pb_tp2, 2)}</span>
      </span>
    );
  },
};

// Cot MAU HINH GIA tom tat (khung ngay / tuan): liet ke cac mau hinh da pha vo gan day, ▲ tang (xanh) / ▼ giam (do) + so nen truoc. Sap xep: nhieu mau hinh TANG / pha vo gan nhat len dau.
function cotMauHinh(hau, nhan, donVi, moTa) {
  const ds = (r) =>
    MAU_HINH.map((m) => ({ m, cach: r[`mh_${m.khoa}${hau}`] }))
      .filter((x) => coSo(x.cach))
      .sort((a, b) => a.cach - b.cach);
  return {
    nhan,
    nhom: NHOM,
    canPhai: false,
    lay: (r) => {
      const l = ds(r);
      return l.length ? l.reduce((s, x) => s + x.m.huong * (100 - x.cach), 0) : null;
    },
    hien: (r) => {
      const l = ds(r);
      if (!l.length) return Trong;
      return (
        <span className="flex flex-wrap gap-x-2 gap-y-0.5" title={moTa}>
          {l.slice(0, 3).map((x) => {
            const tk = THONG_KE_MAU_HINH[x.m.khoa];
            return (
              <span key={x.m.khoa} style={{ color: x.m.huong > 0 ? XANH : DO }} title={`${x.m.ten}: phá vỡ ${x.cach === 0 ? (donVi === "tuần" ? "tuần này" : "hôm nay") : `${x.cach} ${donVi} trước`}. Lịch sử: giá ${x.m.huong > 0 ? "tăng" : "giảm"} TB ${tk.r10.toFixed(1).replace(".", ",")}% sau 10 phiên (thị trường chung +0,7%), tham khảo.`}>
                {x.m.huong > 0 ? "▲" : "▼"} {x.m.ten} · {x.cach === 0 ? (donVi === "tuần" ? "tuần này" : "nay") : `${x.cach}${donVi === "tuần" ? "t" : "p"}`}
              </span>
            );
          })}
          {l.length > 3 && <span style={{ color: MUTED }}>+{l.length - 3}</span>}
        </span>
      );
    },
  };
}

export const COT_CHI_BAO_HIEN = {
  pb: cotDiemMuaPhucHoi,
  mh_ngay: cotMauHinh("", "Mẫu hình giá (ngày)", "phiên", "Mẫu hình đã phá vỡ đường cổ / biên trong 10 phiên gần nhất (khung ngày) — tham khảo, bấm vào mã rồi vào Biểu đồ kỹ thuật → Mẫu hình để xem vẽ trên hình"),
  mh_tuan: cotMauHinh("_tuan", "Mẫu hình giá (tuần)", "tuần", "Mẫu hình đã phá vỡ trong 6 tuần gần nhất (khung tuần) — tham khảo"),
  rsi14: cotSo("rsi14", "RSI (14)", so1So, (v) => (v < 30 ? XANH : v > 70 ? DO : undefined), "Dưới 30: quá bán (xanh) · trên 70: quá mua (đỏ)"),
  rsi_h1: cotSo("rsi_h1", "RSI 1H (14)", so1So, (v) => (v < 30 ? XANH : v > 70 ? DO : undefined), "RSI 14 trên nến 1 giờ - dưới 30: quá bán (xanh) · trên 70: quá mua (đỏ); cập nhật ~10 phút/lần trong phiên"),
  rsi_h1_pk_cach: cotPhanKy("rsi_h1_pk_cach", "RSI phân kỳ (1H)", "nến 1H", "Khung 1 giờ, ~12 phiên gần nhất"),
  rsi_pk_cach: cotPhanKy("rsi_pk_cach", "RSI phân kỳ (ngày)", "phiên", "Khung ngày, 3 tháng gần nhất"),
  rsi_pk_tuan_cach: cotPhanKy("rsi_pk_tuan_cach", "RSI phân kỳ (tuần)", "tuần", "Khung tuần, 6 tháng gần nhất"),
  macd: cotSo("macd", "MACD", (v) => soAn(v, 3), mauDau, "Đường MACD (12, 26)"),
  macd_hist: cotSo("macd_hist", "MACD Hist", (v) => soAn(v, 3), mauDau, "MACD trừ Signal (9): dương = MACD trên Signal"),
  macd_cat_cach: cotCat("macd_cat_cach", "MACD cắt Signal", "MACD và Signal"),
  stoch_k: cotSo("stoch_k", "Stoch %K", so1So, (v) => (v < 20 ? XANH : v > 80 ? DO : undefined), "Stochastic (14, 1, 3) - dưới 20 quá bán · trên 80 quá mua"),
  stoch_d: cotSo("stoch_d", "Stoch %D", so1So),
  stoch_cat_cach: cotCat("stoch_cat_cach", "Stoch %K cắt %D", "%K và %D"),
  adx14: cotSo("adx14", "ADX (14)", so1So, (v) => (v > 25 ? XANH : undefined), "Trên 25: xu hướng mạnh"),
  di_plus: cotSo("di_plus", "+DI", so1So),
  di_tru: cotSo("di_tru", "-DI", so1So),
  cach_ma20_pct: cotSo("cach_ma20_pct", "Giá vs MA20", pct1, mauDau, "% giá cách MA20"),
  cach_ma50_pct: cotSo("cach_ma50_pct", "Giá vs MA50", pct1, mauDau, "% giá cách MA50"),
  cach_ma200_pct: cotSo("cach_ma200_pct", "Giá vs MA200", pct1, mauDau, "% giá cách MA200"),
  ma20_50_cat_cach: cotCat("ma20_50_cat_cach", "MA20 cắt MA50", "MA20 và MA50"),
  ma50_200_cat_cach: cotCat("ma50_200_cat_cach", "MA50 cắt MA200", "MA50 và MA200 (Golden / Death Cross)"),
  gia_so_may: {
    nhan: "Giá vs mây",
    nhom: NHOM,
    canPhai: false,
    lay: (r) => (coSo(r.gia_so_may) ? r.gia_so_may : null),
    hien: (r) => {
      if (!coSo(r.gia_so_may)) return Trong;
      const [chu, mau] = r.gia_so_may > 0 ? ["Trên mây", XANH] : r.gia_so_may < 0 ? ["Dưới mây", DO] : ["Trong mây", VANG];
      return <span style={{ color: mau }}>{chu}</span>;
    },
  },
  cach_kijun_pct: cotSo("cach_kijun_pct", "Giá vs Kijun", pct1, mauDau, "% giá cách Kijun"),
  boll_pct_b: cotSo("boll_pct_b", "Bollinger %B", (v) => soAn(v, 2), (v) => (v <= 0.05 ? XANH : v >= 0.95 ? DO : undefined), "0 = dải dưới · 0,5 = đường giữa · 1 = dải trên"),
  boll_rong_pct: cotSo("boll_rong_pct", "Độ rộng Bollinger", (v) => `${soAn(v, 1)}%`, null, "(dải trên - dải dưới) / đường giữa"),
  cci20: cotSo("cci20", "CCI (20)", so1So, (v) => (v < -100 ? XANH : v > 100 ? DO : undefined), "Dưới -100 quá bán · trên 100 quá mua"),
  will_r14: cotSo("will_r14", "Williams %R", so1So, (v) => (v < -80 ? XANH : v > -20 ? DO : undefined), "Dưới -80 quá bán · trên -20 quá mua"),
  mfi14: cotSo("mfi14", "MFI (14)", so1So, (v) => (v < 20 ? XANH : v > 80 ? DO : undefined), "Dưới 20 quá bán · trên 80 quá mua"),
  atr_pct: cotSo("atr_pct", "ATR / giá", (v) => `${soAn(v, 2)}%`, null, "Biên độ dao động trung bình mỗi phiên (ATR 14) so với giá"),
  kl_ty_le: cotSo("kl_ty_le", "KL / TB20", (v) => `${soAn(v, 2)}×`, (v) => (v >= 2 ? XANH : undefined), "Khối lượng hôm nay so với trung bình 20 phiên trước (giữa phiên mới chạy được một phần)"),
  doi_1t_pct: cotSo("doi_1t_pct", "% 1 tuần", pct1, mauDau),
  doi_1th_pct: cotSo("doi_1th_pct", "% 1 tháng", pct1, mauDau),
  doi_3th_pct: cotSo("doi_3th_pct", "% 3 tháng", pct1, mauDau),
  doi_6th_pct: cotSo("doi_6th_pct", "% 6 tháng", pct1, mauDau),
  cach_dinh_52t_pct: cotSo("cach_dinh_52t_pct", "Cách đỉnh 52T", pct1, null, "% giá thấp hơn đỉnh 52 tuần"),
  cach_day_52t_pct: cotSo("cach_day_52t_pct", "Cách đáy 52T", pct1, null, "% giá cao hơn đáy 52 tuần"),
};

// Thu tu cot tren bang.
export const THU_TU_COT_CHI_BAO = Object.keys(COT_CHI_BAO_HIEN);
