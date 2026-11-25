// CAI DAT CHI BAO (21/11/2026, kieu hop "Settings" cua TradingView: tab Thong so / Kieu dang): moi chi bao co danh sach THONG SO (so / lua chon) va cac NET (mau, do day, hien / an).
// Luu o trinh duyet (localStorage "cs-cai-dat-chi-bao") dang { thamSo: { khoa: { k: gia tri } }, kieu: { khoa: { net: { mau, day, hien } } } } - chi luu cac gia tri DA SUA, con lai lay mac dinh o day.
// HAM THUAN (khong phu thuoc React / trinh duyet, tru docLuuTru / ghiLuuTru) de test tay: engine/test/caiDatChiBao.test.mjs.
// Mau mac dinh o day PHAI khop cac hang mau trong components/BieuDoKyThuat.js (MAU, MAU_BB...). Net co mauMacDinhTheoGiaoDien = true (MA3) thi mau that theo che do sang / toi neu chua sua.

export const KHOA_LUU = "cs-cai-dat-chi-bao";

const so = (k, nhan, mac, min, max, buoc = 1, ghiChu = "") => ({ k, nhan, loai: "so", mac, min, max, buoc, nguyen: Number.isInteger(buoc) && Number.isInteger(mac), ghiChu });
const chon = (k, nhan, mac, ds, ghiChu = "") => ({ k, nhan, loai: "chon", mac, ds, ghiChu });
const net = (k, nhan, mau, day = 1, o = {}) => ({ k, nhan, mau, day, ...o });

export const DINH_NGHIA = {
  ichimoku: {
    nhan: "Ichimoku",
    thamSo: [so("tenkan", "Tenkan (chu kỳ)", 9, 1, 500), so("kijun", "Kijun (chu kỳ)", 17, 1, 500), so("senkouB", "Senkou B (chu kỳ)", 26, 1, 500), so("dichMay", "Độ dịch mây / Chikou", 26, 1, 100)],
    kieu: [net("tenkan", "Tenkan", "#3B9EFF"), net("kijun", "Kijun", "#FF8C00", 2), net("chikou", "Chikou", "#EAB308"), net("spanA", "Senkou A", "#22C55E", 1, { alpha: 0.75 }), net("spanB", "Senkou B", "#EF4444", 1, { alpha: 0.75 })],
  },
  canBang: {
    nhan: "Cân bằng dài hạn",
    thamSo: [so("canBang1", "Đường 1 (chu kỳ)", 65, 2, 1000), so("canBang2", "Đường 2 (chu kỳ)", 129, 2, 1000)],
    kieu: [net("cb1", "Đường 1", "#A78BFA"), net("cb2", "Đường 2", "#E879F9")],
  },
  ma: {
    nhan: "MA",
    thamSo: [so("ma1", "MA 1", 20, 1, 1000), so("ma2", "MA 2", 50, 1, 1000), so("ma3", "MA 3", 200, 1, 1000)],
    kieu: [net("ma1", "MA 1", "#F472B6"), net("ma2", "MA 2", "#2DD4BF"), net("ma3", "MA 3", "#E5E7EB", 1, { mauMacDinhTheoGiaoDien: true })],
  },
  ema: {
    nhan: "EMA",
    thamSo: [so("e1", "EMA 1", 9, 1, 500), so("e2", "EMA 2", 21, 1, 500)],
    kieu: [net("e1", "EMA 1", "#22D3EE"), net("e2", "EMA 2", "#0EA5E9")],
  },
  boll: {
    nhan: "Bollinger",
    thamSo: [so("n", "Chu kỳ", 20, 2, 500), so("k", "Độ lệch chuẩn (nhân)", 2, 0.1, 10, 0.1)],
    kieu: [net("tren", "Dải trên", "#F59E0B", 2), net("giua", "Đường giữa", "#F59E0B"), net("duoi", "Dải dưới", "#F59E0B", 2)],
  },
  vwap: { nhan: "VWAP", thamSo: [], kieu: [net("vwap", "VWAP", "#E879F9", 2)] },
  rsi: {
    nhan: "RSI",
    thamSo: [so("n", "Chu kỳ", 14, 2, 200), so("mua", "Ngưỡng quá mua", 70, 50, 99), so("ban", "Ngưỡng quá bán", 30, 1, 50)],
    kieu: [net("rsi", "RSI", "#A78BFA")],
  },
  macd: {
    nhan: "MACD",
    thamSo: [so("nhanh", "EMA nhanh", 12, 1, 200), so("cham", "EMA chậm", 26, 2, 400), so("tinHieu", "Đường tín hiệu", 9, 1, 100)],
    kieu: [net("macd", "MACD", "#60A5FA"), net("signal", "Tín hiệu", "#FB923C")],
  },
  stoch: {
    nhan: "Stochastic",
    thamSo: [so("n", "Chu kỳ %K", 14, 1, 200), so("k", "Làm mượt %K", 3, 1, 50), so("d", "Làm mượt %D", 3, 1, 50)],
    kieu: [net("k", "%K", "#FBBF24"), net("d", "%D", "#38BDF8")],
  },
  mfi: {
    nhan: "MFI",
    thamSo: [so("n", "Chu kỳ", 14, 2, 200), so("mua", "Ngưỡng quá mua", 80, 50, 99), so("ban", "Ngưỡng quá bán", 20, 1, 50)],
    kieu: [net("mfi", "MFI", "#2DD4BF")],
  },
  cvd: {
    nhan: "CVD",
    thamSo: [so("datLai", "Đặt lại mỗi phiên ở khung trong ngày (1 = có, 0 = không)", 1, 0, 1), so("n", "Chu kỳ đường trung bình", 20, 1, 500)],
    kieu: [net("cvd", "CVD", "#F97316", 2), net("tb", "Trung bình", "#38BDF8")],
  },
  adx: {
    nhan: "ADX",
    thamSo: [so("n", "Chu kỳ", 14, 2, 200), so("nguong1", "Vạch 1", 20, 1, 99), so("nguong2", "Vạch 2", 25, 1, 99)],
    kieu: [net("adx", "ADX", "#F472B6", 2), net("pdi", "DI+", "#22C55E"), net("mdi", "DI−", "#EF4444")],
  },
  mcdx: {
    nhan: "MCDX",
    thamSo: [
      so("bankerChuKy", "Banker: chu kỳ RSI", 50, 2, 300), so("bankerGoc", "Banker: gốc", 50, 0, 100), so("bankerNhay", "Banker: độ nhạy", 1.5, 0.1, 10, 0.1),
      so("hotChuKy", "Hot Money: chu kỳ RSI", 40, 2, 300), so("hotGoc", "Hot Money: gốc", 30, 0, 100), so("hotNhay", "Hot Money: độ nhạy", 0.7, 0.1, 10, 0.1),
    ],
    kieu: [],
  },
  bkr: {
    nhan: "Banker Rhythm",
    thamSo: [so("bienDo", "Biên độ giá (2 râu), số nến", 15, 2, 200), so("bridge", "BridgeT: chu kỳ", 10, 2, 200), so("trend", "Trend (BuySignal-B): chu kỳ", 27, 2, 200)],
    kieu: [net("rau", "2 râu", "#3B82F6", 2), net("bridge", "BridgeT", "#F59E0B", 2)],
  },
  hmDE: {
    nhan: "DE 背离王",
    thamSo: [so("forcastN", "Chu kỳ FORCAST (hồi quy)", 6, 2, 30)],
    kieu: [net("len", "Nến đỏ (tiền vào)", "#EF4444"), net("xuong", "Nến xanh (tiền ra)", "#22C55E")],
  },
  hmKDJ: {
    nhan: "KDJ",
    thamSo: [so("n", "Chu kỳ RSV", 9, 2, 100)],
    kieu: [net("j", "J", "#EF4444"), net("k", "K", "#FBBF24"), net("d", "D", "#38BDF8")],
  },
  hmJinChu: {
    nhan: "进出",
    thamSo: [so("nhanh", "EMA nhanh", 8, 1, 200), so("cham", "EMA chậm", 20, 2, 400)],
    kieu: [net("nhanh", "EMA nhanh", "#94A3B8"), net("cham", "EMA chậm", "#EAB308", 2)],
  },
  hmTongDao: {
    nhan: "通道",
    thamSo: [so("n", "Chu kỳ", 10, 2, 300), so("k", "Độ lệch chuẩn (nhân)", 2, 0.1, 10, 0.1)],
    kieu: [net("dai", "Dải", "#38BDF8", 2)],
  },
  hmTaichi: {
    nhan: "Taichi",
    thamSo: [so("n", "Chu kỳ RSI", 9, 2, 100), so("duoi", "Ngưỡng dưới", 20, 1, 50), so("tren", "Ngưỡng trên", 80, 50, 99)],
    kieu: [],
  },
  tvTrap: {
    nhan: "Liquidity Trap Radar",
    thamSo: [so("lookback", "Số nến nhìn lại", 20, 5, 300), so("cooldown", "Nghỉ giữa 2 tín hiệu (nến)", 8, 0, 100), so("atrBuffer", "Đệm cắt lỗ (ATR)", 0.25, 0, 5, 0.05)],
    kieu: [],
  },
  tvAvpt: {
    nhan: "Anchored VWAP Pullback",
    thamSo: [chon("profile", "Bộ lọc", "Balanced", ["Balanced", "Conservative", "Aggressive", "Shallow", "DeepValue", "VolClimax"], "Không dùng chế độ tự tối ưu (chọn theo kết quả đã biết)"), so("swing", "Độ dài swing", 10, 3, 40), so("minImpulse", "Xung lực tối thiểu (ATR)", 1.4, 0.6, 3.5, 0.1)],
    kieu: [net("avwap", "Đường AVWAP", "#00E6A8", 2)],
  },
};

export const CO_CAI_DAT = (khoa) => !!DINH_NGHIA[khoa] && (DINH_NGHIA[khoa].thamSo.length > 0 || DINH_NGHIA[khoa].kieu.length > 0);

const laSo = (v) => typeof v === "number" && Number.isFinite(v);

// lam sach 1 gia tri thong so theo dinh nghia (ngoai khoang / sai loai -> mac dinh)
export function lamSachThamSo(d, v) {
  if (d.loai === "chon") return d.ds.includes(v) ? v : d.mac;
  const x = typeof v === "string" && v.trim() !== "" ? Number(v.replace(",", ".")) : v;
  if (!laSo(x)) return d.mac;
  const g = Math.min(Math.max(x, d.min), d.max);
  if (d.nguyen) return Math.round(g);
  return Math.round(g / d.buoc) * d.buoc > d.max ? d.max : Number((Math.round(g / d.buoc) * d.buoc).toFixed(6));
}

// tat ca thong so cua 1 chi bao (da them mac dinh + lam sach); cd co the null
export function thamSo(cd, khoa) {
  const dn = DINH_NGHIA[khoa];
  const kq = {};
  if (!dn) return kq;
  for (const d of dn.thamSo) kq[d.k] = lamSachThamSo(d, cd?.thamSo?.[khoa]?.[d.k] ?? d.mac);
  return kq;
}

const MAU_HEX = /^#[0-9a-fA-F]{6}$/;
export function kieuNet(cd, khoa, k) {
  const n = DINH_NGHIA[khoa]?.kieu.find((x) => x.k === k);
  if (!n) return { mau: "#888888", day: 1, hien: true, daSua: false };
  const s = cd?.kieu?.[khoa]?.[k] ?? {};
  const day = laSo(s.day) ? Math.min(Math.max(Math.round(s.day), 1), 5) : n.day;
  return { mau: typeof s.mau === "string" && MAU_HEX.test(s.mau) ? s.mau : n.mau, day, hien: s.hien === false ? false : true, daSua: typeof s.mau === "string" && MAU_HEX.test(s.mau) };
}

// #RRGGBB -> rgba(r,g,b,a)
export function hexRgba(hex, a = 1) {
  const m = /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex ?? "");
  if (!m) return hex;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
}

// cd moi (khong sua cd cu): dat 1 thong so / 1 thuoc tinh net
export function datThamSo(cd, khoa, k, v) {
  const d = DINH_NGHIA[khoa]?.thamSo.find((x) => x.k === k);
  if (!d) return cd ?? { thamSo: {}, kieu: {} };
  const goc = cd ?? { thamSo: {}, kieu: {} };
  return { ...goc, thamSo: { ...goc.thamSo, [khoa]: { ...goc.thamSo?.[khoa], [k]: lamSachThamSo(d, v) } } };
}
export function datKieu(cd, khoa, k, thuocTinh) {
  const goc = cd ?? { thamSo: {}, kieu: {} };
  const cu = goc.kieu?.[khoa]?.[k] ?? {};
  return { ...goc, kieu: { ...goc.kieu, [khoa]: { ...goc.kieu?.[khoa], [k]: { ...cu, ...thuocTinh } } } };
}
export function macDinhLai(cd, khoa) {
  const goc = cd ?? { thamSo: {}, kieu: {} };
  const { [khoa]: _a, ...thamSoConLai } = goc.thamSo ?? {};
  const { [khoa]: _b, ...kieuConLai } = goc.kieu ?? {};
  return { ...goc, thamSo: thamSoConLai, kieu: kieuConLai };
}

// nhan hien thi theo thong so hien tai (RSI 14 -> RSI 21)
export function nhanDong(khoa, cd, nhanGoc) {
  const t = thamSo(cd, khoa);
  switch (khoa) {
    case "rsi": return `RSI ${t.n}`;
    case "macd": return `MACD ${t.nhanh}·${t.cham}·${t.tinHieu}`;
    case "stoch": return `Stochastic ${t.n}·${t.k}·${t.d}`;
    case "mfi": return `MFI ${t.n}`;
    case "cvd": return "CVD (ước lượng)";
    case "adx": return `ADX ${t.n}`;
    case "ma": return `MA ${t.ma1}/${t.ma2}/${t.ma3}`;
    case "ema": return `EMA ${t.e1}/${t.e2}`;
    case "boll": return `Bollinger ${t.n}, ${String(t.k).replace(".", ",")}`;
    default: return nhanGoc;
  }
}

// du lieu doc tu localStorage: bo moi thu khong dung dinh dang
export function lamSach(raw) {
  const kq = { thamSo: {}, kieu: {} };
  if (!raw || typeof raw !== "object") return kq;
  for (const [khoa, dn] of Object.entries(DINH_NGHIA)) {
    const ts = raw.thamSo?.[khoa];
    if (ts && typeof ts === "object") for (const d of dn.thamSo) if (ts[d.k] !== undefined) (kq.thamSo[khoa] ??= {})[d.k] = lamSachThamSo(d, ts[d.k]);
    const ks = raw.kieu?.[khoa];
    if (ks && typeof ks === "object") {
      for (const n of dn.kieu) {
        const s = ks[n.k];
        if (!s || typeof s !== "object") continue;
        const o = {};
        if (typeof s.mau === "string" && MAU_HEX.test(s.mau)) o.mau = s.mau;
        if (laSo(s.day)) o.day = Math.min(Math.max(Math.round(s.day), 1), 5);
        if (s.hien === false) o.hien = false;
        if (Object.keys(o).length) (kq.kieu[khoa] ??= {})[n.k] = o;
      }
    }
  }
  return kq;
}

export function docLuuTru() {
  try {
    return lamSach(JSON.parse(localStorage.getItem(KHOA_LUU) ?? "null"));
  } catch {
    return { thamSo: {}, kieu: {} };
  }
}
export function ghiLuuTru(cd) {
  try {
    localStorage.setItem(KHOA_LUU, JSON.stringify(cd));
  } catch {
    /* che do rieng tu / het cho: bo qua, van dung duoc trong phien */
  }
}
