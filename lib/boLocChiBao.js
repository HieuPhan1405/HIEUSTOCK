// BO LOC CHI BAO KY THUAT kieu TradingView (ham THUAN, khong import "@/" de test tay: engine/test/boLocChiBao.test.mjs).
// Moi CHI BAO co: cac DIEU KIEN dat san (vd RSI qua ban < 30) va/hoac che do "Trong khoang tu - den" tren 1 truong so. Nguoi dung xep chong nhieu bo loc (AND).
// Du lieu 1 ma (r) la dong tin_hieu tron cot cua bang chi_bao_ky_thuat (engine/loi/chiBaoLoc.js, ten cot: lib/cotChiBaoKyThuat.js). Ma chua co chi bao (null) khong khop bo loc nao.
// Cot "_cat_cach" ma hoa lan cat gan nhat: cat LEN k phien truoc = +k (0 = hom nay), cat XUONG = -(k + 1) - xem giaiMaCat().

export const KHOANG = "khoang"; // dieuKien dac biet: nhap khoang tu - den tren truong `truong` cua chi bao

const so = (r, k) => {
  const x = r?.[k];
  return typeof x === "number" && Number.isFinite(x) ? x : null;
};

// Giai ma cot _cat_cach -> { huong: 1 (cat len) | -1 (cat xuong), cach: so phien truoc (0 = hom nay) } hoac null.
export function giaiMaCat(v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v >= 0 ? { huong: 1, cach: v } : { huong: -1, cach: -v - 1 };
}

// Dieu kien tren 1 truong so: nho("rsi14", (x) => x < 30).
const nho = (khoa, f) => (r) => {
  const x = so(r, khoa);
  return x != null && f(x);
};
// Dieu kien tren 2 truong so.
const nho2 = (k1, k2, f) => (r) => {
  const a = so(r, k1);
  const b = so(r, k2);
  return a != null && b != null && f(a, b);
};
// Cat len / xuong trong `n` phien gan nhat (gom hom nay): catTrong("macd_cat_cach", 3, 1).
const catTrong = (khoa, n, huong) => (r) => {
  const c = giaiMaCat(r?.[khoa]);
  return c != null && c.huong === huong && c.cach <= n - 1;
};

const dk = (khoa, nhan, dat) => ({ khoa, nhan, dat });

// ADX > 25 va phe mua (huong = 1) hoac phe ban (huong = -1) ap dao: can du 3 gia tri (khong so sanh voi null).
const adxManh = (huong) => (r) => {
  const a = so(r, "adx14");
  const p = so(r, "di_plus");
  const m = so(r, "di_tru");
  return a != null && p != null && m != null && a > 25 && (huong > 0 ? p > m : m > p);
};

// Ba bo loc "Gia so voi MA n" giong nhau ve cau truc.
function boMA(n) {
  const truong = `cach_ma${n}_pct`;
  return {
    khoa: `ma${n}`,
    nhan: `Giá so với MA${n}`,
    nhom: "Xu hướng",
    truong,
    donVi: "%",
    goiYKhoang: `% giá cách MA${n} (dương = giá trên MA)`,
    dieuKien: [
      dk("tren", `Giá trên MA${n}`, nho(truong, (x) => x > 0)),
      dk("duoi", `Giá dưới MA${n}`, nho(truong, (x) => x < 0)),
      dk("sat", `Giá sát MA${n} (trong ±2%)`, nho(truong, (x) => Math.abs(x) <= 2)),
    ],
    cot: [truong],
  };
}

// Hieu suat theo ky: nguong "manh" khac nhau theo do dai ky.
function hieuSuat(khoa, nhan, truong, nguongManh) {
  return {
    khoa,
    nhan: `Hiệu suất ${nhan}`,
    nhom: "Hiệu suất & vùng giá",
    truong,
    donVi: "%",
    goiYKhoang: `% thay đổi giá trong ${nhan}`,
    dieuKien: [
      dk("tang", `Tăng (> 0%)`, nho(truong, (x) => x > 0)),
      dk("giam", `Giảm (< 0%)`, nho(truong, (x) => x < 0)),
      dk("tang_manh", `Tăng mạnh (> ${nguongManh}%)`, nho(truong, (x) => x > nguongManh)),
      dk("giam_manh", `Giảm mạnh (< -${nguongManh}%)`, nho(truong, (x) => x < -nguongManh)),
    ],
    cot: [truong],
  };
}

export const NHOM_CHI_BAO_LOC = ["Động lượng (Oscillators)", "Xu hướng", "Biến động & khối lượng", "Hiệu suất & vùng giá"];
const DL = NHOM_CHI_BAO_LOC[0];

// Danh sach dinh nghia (thu tu = thu tu trong o chon).
export const DS_CHI_BAO_LOC = [
  // ---------- Dong luong ----------
  {
    khoa: "rsi",
    nhan: "RSI (14)",
    nhom: DL,
    truong: "rsi14",
    goiYKhoang: "RSI từ 0 đến 100",
    dieuKien: [
      dk("qua_ban", "Quá bán (< 30)", nho("rsi14", (x) => x < 30)),
      dk("thap", "Vùng thấp (30 – 50)", nho("rsi14", (x) => x >= 30 && x < 50)),
      dk("cao", "Vùng cao (50 – 70)", nho("rsi14", (x) => x >= 50 && x <= 70)),
      dk("qua_mua", "Quá mua (> 70)", nho("rsi14", (x) => x > 70)),
    ],
    cot: ["rsi14"],
  },
  {
    khoa: "macd",
    nhan: "MACD (12, 26, 9)",
    nhom: DL,
    truong: null,
    dieuKien: [
      dk("tren_signal", "MACD trên đường Signal (tích cực)", nho("macd_hist", (x) => x > 0)),
      dk("duoi_signal", "MACD dưới đường Signal (tiêu cực)", nho("macd_hist", (x) => x < 0)),
      dk("cat_len_1", "Cắt lên Signal hôm nay", catTrong("macd_cat_cach", 1, 1)),
      dk("cat_len_3", "Cắt lên Signal trong 3 phiên", catTrong("macd_cat_cach", 3, 1)),
      dk("cat_len_5", "Cắt lên Signal trong 5 phiên", catTrong("macd_cat_cach", 5, 1)),
      dk("cat_xuong_1", "Cắt xuống Signal hôm nay", catTrong("macd_cat_cach", 1, -1)),
      dk("cat_xuong_3", "Cắt xuống Signal trong 3 phiên", catTrong("macd_cat_cach", 3, -1)),
      dk("tren_0", "MACD trên 0", nho("macd", (x) => x > 0)),
      dk("duoi_0", "MACD dưới 0", nho("macd", (x) => x < 0)),
    ],
    cot: ["macd", "macd_hist", "macd_cat_cach"],
  },
  {
    khoa: "stoch",
    nhan: "Stochastic (14, 1, 3)",
    nhom: DL,
    truong: "stoch_k",
    goiYKhoang: "%K từ 0 đến 100",
    dieuKien: [
      dk("qua_ban", "Quá bán (%K < 20)", nho("stoch_k", (x) => x < 20)),
      dk("qua_mua", "Quá mua (%K > 80)", nho("stoch_k", (x) => x > 80)),
      dk("k_tren_d", "%K trên %D", nho2("stoch_k", "stoch_d", (k, d) => k > d)),
      dk("cat_len_1", "%K cắt lên %D hôm nay", catTrong("stoch_cat_cach", 1, 1)),
      dk("cat_len_3", "%K cắt lên %D trong 3 phiên", catTrong("stoch_cat_cach", 3, 1)),
      dk("cat_xuong_3", "%K cắt xuống %D trong 3 phiên", catTrong("stoch_cat_cach", 3, -1)),
    ],
    cot: ["stoch_k", "stoch_d", "stoch_cat_cach"],
  },
  {
    khoa: "cci",
    nhan: "CCI (20)",
    nhom: DL,
    truong: "cci20",
    goiYKhoang: "CCI (thường từ -200 đến 200)",
    dieuKien: [
      dk("qua_ban", "Quá bán (< -100)", nho("cci20", (x) => x < -100)),
      dk("qua_mua", "Quá mua (> 100)", nho("cci20", (x) => x > 100)),
      dk("tren_0", "Trên 0", nho("cci20", (x) => x > 0)),
      dk("duoi_0", "Dưới 0", nho("cci20", (x) => x < 0)),
    ],
    cot: ["cci20"],
  },
  {
    khoa: "will",
    nhan: "Williams %R (14)",
    nhom: DL,
    truong: "will_r14",
    goiYKhoang: "%R từ -100 đến 0",
    dieuKien: [
      dk("qua_ban", "Quá bán (< -80)", nho("will_r14", (x) => x < -80)),
      dk("qua_mua", "Quá mua (> -20)", nho("will_r14", (x) => x > -20)),
    ],
    cot: ["will_r14"],
  },
  {
    khoa: "mfi",
    nhan: "MFI (14)",
    nhom: DL,
    truong: "mfi14",
    goiYKhoang: "MFI từ 0 đến 100",
    dieuKien: [
      dk("qua_ban", "Quá bán (< 20)", nho("mfi14", (x) => x < 20)),
      dk("qua_mua", "Quá mua (> 80)", nho("mfi14", (x) => x > 80)),
    ],
    cot: ["mfi14"],
  },

  // ---------- Xu huong ----------
  {
    khoa: "adx",
    nhan: "ADX / DI (14)",
    nhom: "Xu hướng",
    truong: "adx14",
    goiYKhoang: "ADX từ 0 đến 100",
    dieuKien: [
      dk("manh", "Xu hướng mạnh (ADX > 25)", nho("adx14", (x) => x > 25)),
      dk("yeu", "Xu hướng yếu / đi ngang (ADX < 20)", nho("adx14", (x) => x < 20)),
      dk("di_tren", "+DI trên -DI (phe mua áp đảo)", nho2("di_plus", "di_tru", (a, b) => a > b)),
      dk("di_duoi", "-DI trên +DI (phe bán áp đảo)", nho2("di_plus", "di_tru", (a, b) => a < b)),
      dk("tang_manh", "Tăng mạnh (ADX > 25 và +DI > -DI)", adxManh(1)),
      dk("giam_manh", "Giảm mạnh (ADX > 25 và -DI > +DI)", adxManh(-1)),
    ],
    cot: ["adx14", "di_plus", "di_tru"],
  },
  boMA(20),
  boMA(50),
  boMA(200),
  {
    khoa: "ma_cat",
    nhan: "Cắt nhau giữa các MA",
    nhom: "Xu hướng",
    truong: null,
    dieuKien: [
      dk("golden_10", "Golden Cross: MA50 cắt lên MA200 (10 phiên)", catTrong("ma50_200_cat_cach", 10, 1)),
      dk("death_10", "Death Cross: MA50 cắt xuống MA200 (10 phiên)", catTrong("ma50_200_cat_cach", 10, -1)),
      dk("ma20_len_ma50", "MA20 cắt lên MA50 (5 phiên)", catTrong("ma20_50_cat_cach", 5, 1)),
      dk("ma20_xuong_ma50", "MA20 cắt xuống MA50 (5 phiên)", catTrong("ma20_50_cat_cach", 5, -1)),
      dk("ma50_tren_ma200", "MA50 trên MA200 (xu hướng dài hạn tăng)", nho("ma50_ma200_pct", (x) => x > 0)),
      dk("ma50_duoi_ma200", "MA50 dưới MA200 (xu hướng dài hạn giảm)", nho("ma50_ma200_pct", (x) => x < 0)),
      dk("ma20_tren_ma50", "MA20 trên MA50", nho("ma20_ma50_pct", (x) => x > 0)),
    ],
    cot: ["ma20_50_cat_cach", "ma50_200_cat_cach"],
  },
  {
    khoa: "may",
    nhan: "Mây Ichimoku / Kijun",
    nhom: "Xu hướng",
    truong: "cach_kijun_pct",
    donVi: "%",
    goiYKhoang: "% giá cách Kijun (dương = giá trên Kijun)",
    dieuKien: [
      dk("tren_may", "Giá trên mây", nho("gia_so_may", (x) => x === 1)),
      dk("trong_may", "Giá trong mây", nho("gia_so_may", (x) => x === 0)),
      dk("duoi_may", "Giá dưới mây", nho("gia_so_may", (x) => x === -1)),
      dk("tenkan_tren", "Tenkan trên Kijun", nho("tenkan_tren_kijun", (x) => x === 1)),
      dk("tenkan_duoi", "Tenkan dưới Kijun", nho("tenkan_tren_kijun", (x) => x === 0)),
      dk("tren_kijun", "Giá trên Kijun", nho("cach_kijun_pct", (x) => x > 0)),
      dk("duoi_kijun", "Giá dưới Kijun", nho("cach_kijun_pct", (x) => x < 0)),
    ],
    cot: ["gia_so_may", "cach_kijun_pct"],
  },
  {
    khoa: "boll",
    nhan: "Bollinger Bands (20, 2)",
    nhom: "Xu hướng",
    truong: "boll_pct_b",
    goiYKhoang: "%B: 0 = dải dưới, 0,5 = đường giữa, 1 = dải trên",
    dieuKien: [
      dk("sat_duoi", "Chạm / thủng dải dưới (%B ≤ 0,05)", nho("boll_pct_b", (x) => x <= 0.05)),
      dk("gan_duoi", "Gần dải dưới (%B ≤ 0,2)", nho("boll_pct_b", (x) => x <= 0.2)),
      dk("duoi_giua", "Dưới đường giữa (%B < 0,5)", nho("boll_pct_b", (x) => x < 0.5)),
      dk("tren_giua", "Trên đường giữa (%B > 0,5)", nho("boll_pct_b", (x) => x > 0.5)),
      dk("gan_tren", "Gần dải trên (%B ≥ 0,8)", nho("boll_pct_b", (x) => x >= 0.8)),
      dk("sat_tren", "Chạm / vượt dải trên (%B ≥ 0,95)", nho("boll_pct_b", (x) => x >= 0.95)),
    ],
    cot: ["boll_pct_b"],
  },

  // ---------- Bien dong & khoi luong ----------
  {
    khoa: "boll_rong",
    nhan: "Độ rộng Bollinger (%)",
    nhom: "Biến động & khối lượng",
    truong: "boll_rong_pct",
    donVi: "%",
    goiYKhoang: "Độ rộng dải = (dải trên - dải dưới) / đường giữa",
    dieuKien: [
      dk("thit", "Dải thắt chặt (< 5%): dễ có nhịp bứt phá", nho("boll_rong_pct", (x) => x < 5)),
      dk("rong", "Dải mở rộng (> 12%): biến động mạnh", nho("boll_rong_pct", (x) => x > 12)),
    ],
    cot: ["boll_rong_pct"],
  },
  {
    khoa: "atr",
    nhan: "ATR (14) so với giá",
    nhom: "Biến động & khối lượng",
    truong: "atr_pct",
    donVi: "%",
    goiYKhoang: "ATR / giá (%): biên độ dao động trung bình mỗi phiên",
    dieuKien: [
      dk("thap", "Biến động thấp (< 2%)", nho("atr_pct", (x) => x < 2)),
      dk("vua", "Biến động vừa (2% – 4%)", nho("atr_pct", (x) => x >= 2 && x <= 4)),
      dk("cao", "Biến động cao (> 4%)", nho("atr_pct", (x) => x > 4)),
    ],
    cot: ["atr_pct"],
  },
  {
    khoa: "kl",
    nhan: "Khối lượng so với TB20",
    nhom: "Biến động & khối lượng",
    truong: "kl_ty_le",
    donVi: "×",
    goiYKhoang: "Khối lượng hôm nay / trung bình 20 phiên trước (giữa phiên mới chạy được một phần)",
    dieuKien: [
      dk("tang", "Nhiều hơn bình thường (≥ 1,5 lần)", nho("kl_ty_le", (x) => x >= 1.5)),
      dk("dot_bien", "Đột biến (≥ 2 lần)", nho("kl_ty_le", (x) => x >= 2)),
      dk("cuc_manh", "Đột biến mạnh (≥ 3 lần)", nho("kl_ty_le", (x) => x >= 3)),
      dk("can", "Cạn kiệt (< 0,5 lần)", nho("kl_ty_le", (x) => x < 0.5)),
    ],
    cot: ["kl_ty_le"],
  },

  // ---------- Hieu suat & vung gia ----------
  hieuSuat("hs_1t", "1 tuần", "doi_1t_pct", 5),
  hieuSuat("hs_1th", "1 tháng", "doi_1th_pct", 10),
  hieuSuat("hs_3th", "3 tháng", "doi_3th_pct", 20),
  hieuSuat("hs_6th", "6 tháng", "doi_6th_pct", 30),
  {
    khoa: "dinh52",
    nhan: "Khoảng cách tới đỉnh 52 tuần",
    nhom: "Hiệu suất & vùng giá",
    truong: "cach_dinh_52t_pct",
    donVi: "%",
    goiYKhoang: "% giá cách đỉnh 52 tuần (âm = giá dưới đỉnh, ví dụ -10 là thấp hơn đỉnh 10%)",
    dieuKien: [
      dk("sat", "Sát đỉnh 52 tuần (cách ≤ 5%)", nho("cach_dinh_52t_pct", (x) => x >= -5)),
      dk("gan", "Gần đỉnh 52 tuần (cách ≤ 10%)", nho("cach_dinh_52t_pct", (x) => x >= -10)),
      dk("xa", "Xa đỉnh 52 tuần (thấp hơn đỉnh > 30%)", nho("cach_dinh_52t_pct", (x) => x < -30)),
    ],
    cot: ["cach_dinh_52t_pct"],
  },
  {
    khoa: "day52",
    nhan: "Khoảng cách tới đáy 52 tuần",
    nhom: "Hiệu suất & vùng giá",
    truong: "cach_day_52t_pct",
    donVi: "%",
    goiYKhoang: "% giá cao hơn đáy 52 tuần",
    dieuKien: [
      dk("sat", "Sát đáy 52 tuần (cao hơn đáy ≤ 10%)", nho("cach_day_52t_pct", (x) => x <= 10)),
      dk("xa", "Đã hồi xa khỏi đáy (> 50%)", nho("cach_day_52t_pct", (x) => x > 50)),
    ],
    cot: ["cach_day_52t_pct"],
  },
];

export const CHI_BAO_LOC = Object.fromEntries(DS_CHI_BAO_LOC.map((d) => [d.khoa, d]));

// Chip goi y nhanh (bam 1 cai la them bo loc voi dieu kien do).
export const GOI_Y_NHANH = [
  { nhan: "RSI quá bán", chiBao: "rsi", dieuKien: "qua_ban" },
  { nhan: "MACD cắt lên (3 phiên)", chiBao: "macd", dieuKien: "cat_len_3" },
  { nhan: "Stochastic quá bán", chiBao: "stoch", dieuKien: "qua_ban" },
  { nhan: "Golden Cross", chiBao: "ma_cat", dieuKien: "golden_10" },
  { nhan: "Giá trên MA200", chiBao: "ma200", dieuKien: "tren" },
  { nhan: "Giá trên mây", chiBao: "may", dieuKien: "tren_may" },
  { nhan: "Chạm dải Bollinger dưới", chiBao: "boll", dieuKien: "sat_duoi" },
  { nhan: "Khối lượng đột biến", chiBao: "kl", dieuKien: "dot_bien" },
  { nhan: "Sát đỉnh 52 tuần", chiBao: "dinh52", dieuKien: "sat" },
  { nhan: "Xu hướng tăng mạnh (ADX)", chiBao: "adx", dieuKien: "tang_manh" },
];

let boDemId = 0;
// 1 bo loc moi cho chi bao `khoa` voi dieu kien `dieuKien` (mac dinh: dieu kien dat san dau tien, hoac khoang neu chi bao chi co khoang).
export function taoBoLocChiBao(khoa, dieuKien) {
  const d = CHI_BAO_LOC[khoa];
  if (!d) return null;
  const dk0 = dieuKien ?? d.dieuKien[0]?.khoa ?? KHOANG;
  return { id: `cb${++boDemId}`, chiBao: khoa, dieuKien: dk0, tu: "", den: "" };
}

// Chuoi nguoi dung go ("1,5" hoac "1.5") -> so; rong/khong hop le -> null.
export function soNhap(v) {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(String(v).trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// 1 ma co khop 1 bo loc khong. Bo loc khong ro (chi bao khong ton tai) -> bo qua (coi la khop).
export function khopChiBao(r, loc) {
  const d = CHI_BAO_LOC[loc.chiBao];
  if (!d) return true;
  if (loc.dieuKien === KHOANG) {
    const x = d.truong ? so(r, d.truong) : null;
    if (x == null) return false;
    const tu = soNhap(loc.tu);
    const den = soNhap(loc.den);
    return (tu == null || x >= tu) && (den == null || x <= den);
  }
  const k = d.dieuKien.find((c) => c.khoa === loc.dieuKien);
  return k ? k.dat(r) === true : true;
}

// Loc theo TAT CA bo loc (AND).
export function locTheoChiBao(ds, dsLoc) {
  if (!dsLoc || dsLoc.length === 0) return ds;
  return ds.filter((r) => dsLoc.every((l) => khopChiBao(r, l)));
}

// Cac cot chi bao nen tu hien khi dang loc (de nguoi dung thay gia tri dang loc).
export function cotChoBoLoc(dsLoc) {
  const kq = [];
  for (const l of dsLoc ?? []) for (const k of CHI_BAO_LOC[l.chiBao]?.cot ?? []) if (!kq.includes(k)) kq.push(k);
  return kq;
}

// Ma nay da co du lieu chi bao chua (engine da day len).
export const coDuLieuChiBao = (r) => so(r, "rsi14") != null || so(r, "macd") != null;
