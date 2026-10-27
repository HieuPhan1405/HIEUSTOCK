// BACKTEST MUA KHONG CAN QUA MAY (Hieu 27/10/2026: "chi can gia tren Tenkan, Kijun mua, ko can qua may xem (hoac mua 1 nua)"). Lenh Mua thuong cua engine that, nen_dai.json (~2018 -> 21/10/2026), phi 0,4%/vong.
// Cac kich ban (cong tac nghien cuu trong engine/tinhTinHieuChoMa.js, mac dinh TAT):
//   B0 HIEN TAI                      : he thong nhu dang chay
//   B1 HIEN TAI + gia > Tenkan va > Kijun : them dieu kien dong cua tren CA Tenkan va Kijun (khong can Tenkan > Kijun)
//   B2 BO MAY + gia > Tenkan va > Kijun   : diem xu huong khong tinh vi tri so voi may (boQuaMay) + bat buoc dong cua tren ca Tenkan va Kijun  <- "chi can gia tren Tenkan, Kijun, ko can qua may"
//   B3 BO MAY thuan (boQuaMay)            : chi bo thanh phan may khoi diem
// Cach ra: HT (30% TP1 + 30% TP2 + 40% theo BAN) va TK3 (30/30 + phan con Tenkan 1/2 + Kijun not); 2 quy uoc gia vao: THUC TE (mua mo cua phien sau, ban tu chieu T+2) va LY TUONG (gia engine E, ban tu phien sau).
// "MUA 1 NUA": lenh MOI (co o B2 nhung khong co o B0) chi dung 1/2 von cua 1 vi the (B0 + 0,5 x lenh moi), so voi B0 dung von day du.
// Chay: node engine/dich-vu/backtestMuaKhongCanMay.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const KICH_BAN = [
  ["B0 HIEN TAI", {}],
  ["B1 HIEN TAI + gia>Tenkan va >Kijun", { yeuCauGiaTrenTenkanKijun: true }],
  ["B2 BO MAY + gia>Tenkan va >Kijun", { boQuaMay: true, yeuCauGiaTrenTenkanKijun: true }],
  ["B3 BO MAY thuan", { boQuaMay: true }],
];
const CACH = [
  ["HT ", { moc: HAI_TP, baoVe: true, theoSell: true }],
  ["TK3", { moc: HAI_TP, baoVe: true, theoSell: true, tk: "nua" }],
];
const QUY_UOC = [
  ["THUC TE", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })],
  ["LY TUONG", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })],
];
const SO_LAN = 30;
const khoa = (t) => `${t.ma}|${t.ngay}`;
const TAP = [["Toan bo", () => true], ["Tu 2022.5", (t) => t.ngay >= "2022-05-01"], ["Rieng 2026", (t) => t.ngay >= "2026-01-01"]];
const vtMay = (t) => {
  const c = t.close[t.iv], top = t.cloudTop[t.iv], bot = t.cloudBot[t.iv];
  if (top == null || bot == null) return "khong co may";
  return c > top ? "TREN may" : c < bot ? "DUOI may" : "TRONG may";
};

const KB = {};
for (const [ten, tham] of KICH_BAN) {
  const { lenh } = chayEngine({ cache, vni, thamSoThem: tham });
  KB[ten] = lenh.filter((t) => t.loai === 1);
  console.log(`${ten}: ${KB[ten].length} lenh Mua thuong`);
}
const tapGoc = new Set(KB["B0 HIEN TAI"].map(khoa));

for (const [tenQU, cfgVao] of QUY_UOC) {
  for (const [tenCach, cfgCach] of CACH) {
    for (const [tenTap, loc] of TAP) {
      console.log(`\n=========== ${tenQU} | cach ra ${tenCach.trim()} | ${tenTap} ===========`);
      console.log("Kich ban".padEnd(40), "n".padStart(5), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "| DM K=10 lai/nam, sut | DM K=20");
      for (const [ten] of KICH_BAN) {
        const ds = KB[ten].filter(loc);
        const kqs = ds.map((t) => mp(t, { ...cfgCach, ...cfgVao(t) }));
        const k = thongKe(kqs.filter(Boolean));
        const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {});
        const d20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, {});
        console.log(ten.padEnd(40), String(k.n).padStart(5), f(k.tb).padStart(7), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), `| ${f(d10.cagr, 1).padStart(6)}%/${f(d10.sut, 0).padStart(2)}% | ${f(d20.cagr, 1).padStart(6)}%/${f(d20.sut, 0)}%`);
      }
      // MUA 1 NUA: B0 day du + lenh moi cua B2 voi 1/2 von
      const dsB2 = KB["B2 BO MAY + gia>Tenkan va >Kijun"].filter(loc);
      const kq2 = dsB2.map((t) => mp(t, { ...cfgCach, ...cfgVao(t) }));
      for (const w of [0.5, 1]) {
        const d10 = danhMucNhieuLan(kq2, dsB2, 10, SO_LAN, { trongSo: (t) => (tapGoc.has(khoa(t)) ? 1 : w) });
        const d20 = danhMucNhieuLan(kq2, dsB2, 20, SO_LAN, { trongSo: (t) => (tapGoc.has(khoa(t)) ? 1 : w) });
        console.log(`B2: lenh moi mua ${w === 1 ? "DAY DU von" : "1/2 von"}`.padEnd(40), " ".repeat(33), `| ${f(d10.cagr, 1).padStart(6)}%/${f(d10.sut, 0).padStart(2)}% | ${f(d20.cagr, 1).padStart(6)}%/${f(d20.sut, 0)}%`);
      }
    }
  }
}

// ---------- CHI LENH MOI (co o B2, khong co o B0): chat luong va vi tri so voi may ----------
console.log("\n=========== LENH MOI cua B2 (khong co o he thong hien tai): theo vi tri gia so voi may luc vao ===========");
for (const [tenQU, cfgVao] of QUY_UOC) {
  for (const [tenCach, cfgCach] of CACH) {
    console.log(`\n${tenQU} | cach ra ${tenCach.trim()}`);
    const moi = KB["B2 BO MAY + gia>Tenkan va >Kijun"].filter((t) => !tapGoc.has(khoa(t)));
    const gop = [["Tat ca lenh moi", () => true], ["TREN may", (t) => vtMay(t) === "TREN may"], ["TRONG may", (t) => vtMay(t) === "TRONG may"], ["DUOI may", (t) => vtMay(t) === "DUOI may"]];
    for (const [ten, loc] of gop) {
      const ds = moi.filter(loc);
      const kqs = ds.map((t) => mp(t, { ...cfgCach, ...cfgVao(t) })).filter(Boolean);
      const k = thongKe(kqs);
      const ky = [0, 1, 2].map((j) => { const r = ds.map((t, i) => (kyOf(t.ngay) === j ? mp(t, { ...cfgCach, ...cfgVao(t) })?.ret : null)).filter((x) => x != null); return `${f(tb(r)).padStart(5)}(${r.length})`; });
      const n26 = ds.filter((t) => t.ngay >= "2026-01-01").map((t) => mp(t, { ...cfgCach, ...cfgVao(t) })).filter(Boolean);
      console.log("  ", ten.padEnd(18), "n", String(k.n).padStart(5), "lai TB", f(k.tb).padStart(6), "thang", f(k.thang, 0).padStart(3) + "%", "PF", f(k.pf).padStart(5), "| theo giai doan", ky.join(" "), `| 2026: n ${n26.length} lai ${f(tb(n26.map((x) => x.ret)))}`);
    }
  }
}
