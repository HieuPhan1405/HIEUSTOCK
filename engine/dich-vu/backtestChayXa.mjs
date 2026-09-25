// BACKTEST "CHO LENH THANG CHAY XA HON": sau khi cham TP1, cach BAM THEO nao giu duoc nhieu phan lon cua nhung lenh chay dai (tranh thoat som khi gia chi rung lac)?
// So sanh: dong cua < Kijun (1/2/3 phien lien tiep), < SMA20, < SMA50, bam theo ATR (gia dong cua cao nhat - k x ATR) va kieu 2 GIAI DOAN (Kijun, khi da lai +X% chuyen sang duong long hon).
// Tren cung cac lenh "Mua thuong" cua engine (~11 nam: nen_dai.json + vnindex_dai.json), tap A = tat ca va tap B = chi vao khi gia <= 6% tren Kijun. Chi phi 0,4%/lenh da tru.
// "Lai lenh dai" = lai TB trong nhom lenh TUNG lai >= +25% (dinh cao nhat trong luc giu), "giu duoc" = lai TB thuc nhan / muc lai dinh TB cua nhom do.
// Chi DOC cache, khong dung mang. Xem han che o dau backtestChotLoi.mjs / backtestLocThiTruong.mjs.
// CACH CHAY: node engine/dich-vu/backtestChayXa.mjs [tenTepCache=nen_dai.json]
import { docJson, chayEngine, moPhong, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";

const cache = docJson(process.argv[2] || "nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, soMa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
const KIJ = "Gia so voi Kijun (% tren Kijun)";
const SO_LAN = 40;
const ARM = { moc: [{ w: 0, muc: "tp1" }], theoKijunSau: 0 };

const CACH = [
  { ten: "Hien tai 30/30/25 + 15% chay", moc: [{ w: 0.3, muc: "tp1" }, { w: 0.3, muc: "tp2" }, { w: 0.25, muc: "tp3" }] },
  { ten: "Giu het (chi cat lo / BAN)", moc: [] },
  { ten: "Sau TP1: dong cua < Kijun (1 phien)", ...ARM, chay: { duong: "kijun", soNen: 1 } },
  { ten: "Sau TP1: dong cua < Kijun 2 phien lien tiep", ...ARM, chay: { duong: "kijun", soNen: 2 } },
  { ten: "Sau TP1: dong cua < Kijun 3 phien lien tiep", ...ARM, chay: { duong: "kijun", soNen: 3 } },
  // --- CHI DUNG CAC DUONG ICHIMOKU ---
  { ten: "Sau TP1: Tenkan cat xuong duoi Kijun", ...ARM, chay: { tenkanDuoiKijun: true } },
  { ten: "Sau TP1: dong cua < Tenkan", ...ARM, chay: { duong: "tenkan", soNen: 1 } },
  { ten: "Sau TP1: dong cua < dinh may", ...ARM, chay: { duong: "cloudTop", soNen: 1 } },
  { ten: "Sau TP1: dong cua < day may", ...ARM, chay: { duong: "cloudBot", soNen: 1 } },
  { ten: "Sau TP1: dong cua < duong can bang dai han (tren)", ...ARM, chay: { duong: "cbTop", soNen: 1 } },
  { ten: "Sau TP1: dong cua < duong can bang dai han (duoi)", ...ARM, chay: { duong: "cbBot", soNen: 1 } },
  { ten: "Kijun; khi lai +15% doi sang dinh may", ...ARM, chay: { duong: "kijun", soNen: 1, chuyenSauLai: { pct: 15, duong: "cloudTop" } } },
  { ten: "Kijun; khi lai +20% doi sang dinh may", ...ARM, chay: { duong: "kijun", soNen: 1, chuyenSauLai: { pct: 20, duong: "cloudTop" } } },
  { ten: "Kijun; khi lai +30% doi sang dinh may", ...ARM, chay: { duong: "kijun", soNen: 1, chuyenSauLai: { pct: 30, duong: "cloudTop" } } },
  { ten: "Kijun; khi lai +20% doi sang day may", ...ARM, chay: { duong: "kijun", soNen: 1, chuyenSauLai: { pct: 20, duong: "cloudBot" } } },
  { ten: "Kijun; khi lai +30% doi sang day may", ...ARM, chay: { duong: "kijun", soNen: 1, chuyenSauLai: { pct: 30, duong: "cloudBot" } } },
  { ten: "Kijun 3 phien; khi lai +20% doi sang dinh may", ...ARM, chay: { duong: "kijun", soNen: 3, chuyenSauLai: { pct: 20, duong: "cloudTop" } } },
  { ten: "Kijun 2 phien; khi lai +20% doi sang dinh may", ...ARM, chay: { duong: "kijun", soNen: 2, chuyenSauLai: { pct: 20, duong: "cloudTop" } } },
  // --- THAM CHIEU (khong phai Ichimoku, chi de so) ---
  { ten: "[tham chieu] dong cua < SMA50", ...ARM, chay: { duong: "sma50", soNen: 1 } },
];

const TAP = [
  ["A. Tat ca lenh Mua thuong", () => true],
  ["B. Gia <= 6% tren Kijun luc vao", (t) => t.dacTrung[KIJ] <= 6],
];

for (const [tenTap, fn] of TAP) {
  const ds = lenh.filter(fn);
  console.log(`\n=========== Tap ${tenTap}: n = ${ds.length} (${soMa} ma) ===========`);
  console.log(
    "Cach bam theo".padEnd(46), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "lai/phien".padStart(9), ">+20%".padStart(6), ">+30%".padStart(6),
    "| lenh dai: n".padStart(13), "lai".padStart(6), "giu dc".padStart(7), "| lai TB theo giai doan".padStart(36), "| DM K=10".padStart(11), "K=20".padStart(9)
  );
  for (const c of CACH) {
    const kqs = ds.map((t) => moPhong(t, c));
    const ok = kqs.filter(Boolean);
    const k = thongKe(ok);
    const ky = [[], [], []];
    const dai = [];
    let tren20 = 0;
    let tren30 = 0;
    ds.forEach((t, i) => {
      const r = kqs[i];
      if (!r) return;
      ky[kyOf(t.ngay)].push(r.ret);
      if (r.ret > 20) tren20++;
      if (r.ret > 30) tren30++;
      let cao = 0;
      for (let j = t.iv + 1; j <= r.jThoat; j++) cao = Math.max(cao, t.high[j]);
      const mfe = (cao / t.E - 1) * 100;
      if (mfe >= 25) dai.push({ ret: r.ret, mfe });
    });
    const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {});
    const d20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, {});
    const giuDuoc = dai.length ? (tb(dai.map((x) => x.ret)) / tb(dai.map((x) => x.mfe))) * 100 : NaN;
    console.log(
      c.ten.padEnd(46), f(k.tb).padStart(7), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), f(k.laiMoiPhien, 3).padStart(9),
      `${((tren20 / ok.length) * 100).toFixed(1)}`.padStart(6), `${((tren30 / ok.length) * 100).toFixed(1)}`.padStart(6),
      `| ${String(dai.length).padStart(5)}`, f(tb(dai.map((x) => x.ret)), 1).padStart(6), `${f(giuDuoc, 0)}%`.padStart(7), "|", ky.map((a) => `${f(tb(a)).padStart(5)}(${a.length})`).join(" "),
      `| ${f(d10.cagr, 1)}%/${f(d10.sut, 0)}%`, `${f(d20.cagr, 1)}%/${f(d20.sut, 0)}%`
    );
  }
}
