// Test tay cho lib/boLocChiBao.js (bo loc chi bao ky thuat). Chay: node engine/test/boLocChiBao.test.mjs
import { DS_CHI_BAO_LOC, CHI_BAO_LOC, NHOM_CHI_BAO_LOC, GOI_Y_NHANH, KHOANG, giaiMaCat, taoBoLocChiBao, soNhap, khopChiBao, locTheoChiBao, cotChoBoLoc, coDuLieuChiBao } from "../../lib/boLocChiBao.js";
import { COT_CHI_BAO } from "../../lib/cotChiBaoKyThuat.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

// ---- Cau truc dinh nghia ----
{
  const khoaTrung = DS_CHI_BAO_LOC.length !== new Set(DS_CHI_BAO_LOC.map((d) => d.khoa)).size;
  ok("khoa chi bao khong trung", !khoaTrung);
  ok("moi chi bao thuoc 1 nhom hop le", DS_CHI_BAO_LOC.every((d) => NHOM_CHI_BAO_LOC.includes(d.nhom)));
  ok("moi dieu kien co khoa khong trung + ham dat", DS_CHI_BAO_LOC.every((d) => d.dieuKien.length > 0 && new Set(d.dieuKien.map((c) => c.khoa)).size === d.dieuKien.length && d.dieuKien.every((c) => typeof c.dat === "function")));
  const tatCaTruong = DS_CHI_BAO_LOC.flatMap((d) => [d.truong, ...d.cot].filter(Boolean));
  ok("moi truong / cot tham chieu deu la cot that cua bang chi bao", tatCaTruong.every((t) => COT_CHI_BAO.includes(t)), tatCaTruong.filter((t) => !COT_CHI_BAO.includes(t)).join(","));
  ok("chip goi y tro dung chi bao + dieu kien", GOI_Y_NHANH.every((g) => CHI_BAO_LOC[g.chiBao]?.dieuKien.some((c) => c.khoa === g.dieuKien)));
  ok("khong nhom nao rong", NHOM_CHI_BAO_LOC.every((n) => DS_CHI_BAO_LOC.some((d) => d.nhom === n)));
}

// ---- giaiMaCat / soNhap ----
{
  ok("giaiMaCat: 0 = cat len hom nay", JSON.stringify(giaiMaCat(0)) === '{"huong":1,"cach":0}');
  ok("giaiMaCat: 4 = cat len 4 phien truoc", JSON.stringify(giaiMaCat(4)) === '{"huong":1,"cach":4}');
  ok("giaiMaCat: -1 = cat xuong hom nay", JSON.stringify(giaiMaCat(-1)) === '{"huong":-1,"cach":0}');
  ok("giaiMaCat: -4 = cat xuong 3 phien truoc", JSON.stringify(giaiMaCat(-4)) === '{"huong":-1,"cach":3}');
  ok("giaiMaCat: null / khong phai so -> null", giaiMaCat(null) === null && giaiMaCat("x") === null);
  ok("soNhap: dau phay VN", soNhap("1,5") === 1.5 && soNhap(" 30 ") === 30 && soNhap("-2.5") === -2.5);
  ok("soNhap: rong / rac -> null", soNhap("") === null && soNhap("abc") === null && soNhap(null) === null);
}

const bo = (chiBao, dieuKien, them = {}) => ({ ...taoBoLocChiBao(chiBao, dieuKien), ...them });

// ---- RSI ----
{
  const rsi = (v) => ({ rsi14: v });
  ok("RSI 25 qua ban", khopChiBao(rsi(25), bo("rsi", "qua_ban")));
  ok("RSI 30 KHONG qua ban (nguong < 30), thuoc vung thap", !khopChiBao(rsi(30), bo("rsi", "qua_ban")) && khopChiBao(rsi(30), bo("rsi", "thap")));
  ok("RSI 70 chua qua mua (> 70), thuoc vung cao", !khopChiBao(rsi(70), bo("rsi", "qua_mua")) && khopChiBao(rsi(70), bo("rsi", "cao")));
  ok("RSI 85 qua mua", khopChiBao(rsi(85), bo("rsi", "qua_mua")));
  ok("thieu du lieu RSI: khong khop bo loc nao", !khopChiBao({}, bo("rsi", "qua_ban")) && !khopChiBao(rsi(null), bo("rsi", "cao")));
}

// ---- Khoang tuy chinh ----
{
  const r = { rsi14: 42 };
  ok("khoang 40 - 50 khop 42", khopChiBao(r, bo("rsi", KHOANG, { tu: "40", den: "50" })));
  ok("khoang 45 - 50 khong khop 42", !khopChiBao(r, bo("rsi", KHOANG, { tu: "45", den: "50" })));
  ok("chi co can duoi", khopChiBao(r, bo("rsi", KHOANG, { tu: "40" })) && !khopChiBao(r, bo("rsi", KHOANG, { tu: "43" })));
  ok("chi co can tren", khopChiBao(r, bo("rsi", KHOANG, { den: "42" })) && !khopChiBao(r, bo("rsi", KHOANG, { den: "41,9" })));
  ok("bo trong ca hai: khop moi ma CO du lieu, loai ma thieu", khopChiBao(r, bo("rsi", KHOANG)) && !khopChiBao({}, bo("rsi", KHOANG)));
  ok("chi bao khong co truong so (MACD) chon khoang -> khong khop", !khopChiBao({ macd_hist: 1 }, bo("macd", KHOANG, { tu: "0" })));
  ok("so am trong khoang (Williams %R)", khopChiBao({ will_r14: -85 }, bo("will", KHOANG, { tu: "-100", den: "-80" })));
}

// ---- MACD & cat ----
{
  ok("MACD cat len hom nay (ma hoa 0)", khopChiBao({ macd_cat_cach: 0, macd_hist: 0.001 }, bo("macd", "cat_len_1")));
  ok("cat len 2 phien truoc thuoc 'trong 3 phien' nhung khong phai 'hom nay'", khopChiBao({ macd_cat_cach: 2 }, bo("macd", "cat_len_3")) && !khopChiBao({ macd_cat_cach: 2 }, bo("macd", "cat_len_1")));
  ok("cat len 3 phien truoc: ngoai 'trong 3 phien', trong 'trong 5 phien'", !khopChiBao({ macd_cat_cach: 3 }, bo("macd", "cat_len_3")) && khopChiBao({ macd_cat_cach: 3 }, bo("macd", "cat_len_5")));
  ok("cat XUONG khong bi tinh la cat LEN", !khopChiBao({ macd_cat_cach: -1 }, bo("macd", "cat_len_3")) && khopChiBao({ macd_cat_cach: -1 }, bo("macd", "cat_xuong_1")));
  ok("cat xuong 2 phien truoc (-3) trong 3 phien", khopChiBao({ macd_cat_cach: -3 }, bo("macd", "cat_xuong_3")));
  ok("khong co lan cat (null): khong khop dieu kien cat", !khopChiBao({ macd_cat_cach: null }, bo("macd", "cat_len_5")));
  ok("MACD tren / duoi Signal theo histogram", khopChiBao({ macd_hist: 0.2 }, bo("macd", "tren_signal")) && khopChiBao({ macd_hist: -0.2 }, bo("macd", "duoi_signal")) && !khopChiBao({ macd_hist: 0 }, bo("macd", "tren_signal")));
}

// ---- Stochastic ----
{
  ok("Stoch qua ban / qua mua", khopChiBao({ stoch_k: 10 }, bo("stoch", "qua_ban")) && khopChiBao({ stoch_k: 90 }, bo("stoch", "qua_mua")));
  ok("%K tren %D can du 2 gia tri", khopChiBao({ stoch_k: 60, stoch_d: 50 }, bo("stoch", "k_tren_d")) && !khopChiBao({ stoch_k: 60 }, bo("stoch", "k_tren_d")));
}

// ---- MA ----
{
  ok("gia tren MA50 / duoi MA50", khopChiBao({ cach_ma50_pct: 3 }, bo("ma50", "tren")) && khopChiBao({ cach_ma50_pct: -3 }, bo("ma50", "duoi")));
  ok("sat MA200 trong +-2%", khopChiBao({ cach_ma200_pct: -1.9 }, bo("ma200", "sat")) && !khopChiBao({ cach_ma200_pct: 2.1 }, bo("ma200", "sat")));
  ok("MA200 chua du du lieu (null): khong khop 'gia duoi MA200'", !khopChiBao({ cach_ma200_pct: null }, bo("ma200", "duoi")));
  ok("Golden Cross: cat len <= 10 phien", khopChiBao({ ma50_200_cat_cach: 9 }, bo("ma_cat", "golden_10")) && !khopChiBao({ ma50_200_cat_cach: 10 }, bo("ma_cat", "golden_10")));
  ok("Death Cross khong lan voi Golden", khopChiBao({ ma50_200_cat_cach: -6 }, bo("ma_cat", "death_10")) && !khopChiBao({ ma50_200_cat_cach: -6 }, bo("ma_cat", "golden_10")));
  ok("MA50 tren MA200", khopChiBao({ ma50_ma200_pct: 4 }, bo("ma_cat", "ma50_tren_ma200")));
}

// ---- May Ichimoku ----
{
  ok("gia tren / trong / duoi may", khopChiBao({ gia_so_may: 1 }, bo("may", "tren_may")) && khopChiBao({ gia_so_may: 0 }, bo("may", "trong_may")) && khopChiBao({ gia_so_may: -1 }, bo("may", "duoi_may")));
  ok("'trong may' (0) khong bi lan voi thieu du lieu (null)", !khopChiBao({ gia_so_may: null }, bo("may", "trong_may")));
  ok("Tenkan duoi Kijun (0) khop, thieu du lieu khong khop", khopChiBao({ tenkan_tren_kijun: 0 }, bo("may", "tenkan_duoi")) && !khopChiBao({}, bo("may", "tenkan_duoi")));
}

// ---- ADX ----
{
  ok("tang manh: ADX > 25 va +DI > -DI", khopChiBao({ adx14: 30, di_plus: 25, di_tru: 10 }, bo("adx", "tang_manh")));
  ok("ADX cao nhung phe ban: khong phai tang manh, la giam manh", !khopChiBao({ adx14: 30, di_plus: 10, di_tru: 25 }, bo("adx", "tang_manh")) && khopChiBao({ adx14: 30, di_plus: 10, di_tru: 25 }, bo("adx", "giam_manh")));
  ok("thieu DI khong khop 'tang manh' (khong so sanh voi null)", !khopChiBao({ adx14: 30, di_plus: 25 }, bo("adx", "tang_manh")));
}

// ---- Hieu suat, dinh 52 tuan, khoi luong ----
{
  ok("hieu suat 1 thang: tang manh > 10%", khopChiBao({ doi_1th_pct: 12 }, bo("hs_1th", "tang_manh")) && !khopChiBao({ doi_1th_pct: 10 }, bo("hs_1th", "tang_manh")));
  ok("hieu suat 3 thang: giam manh < -20%", khopChiBao({ doi_3th_pct: -25 }, bo("hs_3th", "giam_manh")));
  ok("sat dinh 52 tuan cach <= 5%", khopChiBao({ cach_dinh_52t_pct: -4 }, bo("dinh52", "sat")) && !khopChiBao({ cach_dinh_52t_pct: -6 }, bo("dinh52", "sat")));
  ok("xa dinh: thap hon dinh > 30%", khopChiBao({ cach_dinh_52t_pct: -35 }, bo("dinh52", "xa")));
  ok("sat day 52 tuan: cao hon day <= 10%", khopChiBao({ cach_day_52t_pct: 8 }, bo("day52", "sat")) && !khopChiBao({ cach_day_52t_pct: 12 }, bo("day52", "sat")));
  ok("khoi luong dot bien >= 2 lan", khopChiBao({ kl_ty_le: 2.4 }, bo("kl", "dot_bien")) && !khopChiBao({ kl_ty_le: 1.9 }, bo("kl", "dot_bien")));
  ok("khoi luong can kiet < 0,5 lan", khopChiBao({ kl_ty_le: 0.4 }, bo("kl", "can")));
  ok("Bollinger: cham dai duoi, cham dai tren", khopChiBao({ boll_pct_b: 0.02 }, bo("boll", "sat_duoi")) && khopChiBao({ boll_pct_b: 1.1 }, bo("boll", "sat_tren")));
  ok("ATR: bien dong thap / vua / cao", khopChiBao({ atr_pct: 1.5 }, bo("atr", "thap")) && khopChiBao({ atr_pct: 3 }, bo("atr", "vua")) && khopChiBao({ atr_pct: 5 }, bo("atr", "cao")));
}

// ---- Loc nhieu bo loc (AND) ----
{
  const ds = [
    { ma: "A", rsi14: 25, macd_cat_cach: 1, cach_ma200_pct: 5 },
    { ma: "B", rsi14: 25, macd_cat_cach: -2, cach_ma200_pct: 5 },
    { ma: "C", rsi14: 55, macd_cat_cach: 0, cach_ma200_pct: -3 },
    { ma: "D" },
  ];
  const ten = (x) => x.map((r) => r.ma).join("");
  ok("khong co bo loc: giu nguyen ca ma chua co chi bao", ten(locTheoChiBao(ds, [])) === "ABCD");
  ok("1 bo loc: RSI qua ban -> A, B", ten(locTheoChiBao(ds, [bo("rsi", "qua_ban")])) === "AB");
  ok("2 bo loc AND: RSI qua ban + MACD cat len 3 phien -> A", ten(locTheoChiBao(ds, [bo("rsi", "qua_ban"), bo("macd", "cat_len_3")])) === "A");
  ok("3 bo loc AND khong con ma nao", ten(locTheoChiBao(ds, [bo("rsi", "qua_ban"), bo("macd", "cat_len_3"), bo("ma200", "duoi")])) === "");
  ok("bo loc khong ro chi bao bi bo qua (khong lam mat het ma)", ten(locTheoChiBao(ds, [{ id: "x", chiBao: "khong_co", dieuKien: "a" }])) === "ABCD");
  ok("taoBoLocChiBao: id khong trung, dieu kien mac dinh la dieu kien dau", (() => { const a = taoBoLocChiBao("rsi"); const b = taoBoLocChiBao("rsi"); return a.id !== b.id && a.dieuKien === "qua_ban"; })());
  ok("taoBoLocChiBao: chi bao khong ton tai -> null", taoBoLocChiBao("khong_co") === null);
}

// ---- Cot tu hien + du lieu ----
{
  const cot = cotChoBoLoc([bo("rsi", "qua_ban"), bo("macd", "cat_len_3"), bo("rsi", "cao")]);
  ok("cot cua bo loc, khong lap", cot.join() === "rsi14,macd,macd_hist,macd_cat_cach", cot.join());
  ok("coDuLieuChiBao", coDuLieuChiBao({ rsi14: 50 }) && !coDuLieuChiBao({}) && !coDuLieuChiBao({ rsi14: null, macd: null }));
}

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
