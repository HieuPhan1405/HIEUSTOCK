// BACKTEST CHOT LOI SAU KHI DA LOC DIEM VAO: khi chi vao lenh "Mua thuong" luc gia con gan Kijun (<= 6% tren Kijun) va/hoac VN-Index > Tenkan (xem
// backtestGianXaKijun.mjs), cach chot loi nao tot nhat? So sanh cac cach thoat tren cung tap lenh da loc (~11 nam: nen_dai.json + vnindex_dai.json). Chi phi 0,4%/lenh da tru.
// Cach "sau khi lai +X%" = khong chot tung phan, nhung KHI GIA DA TUNG LAI +X% (cao nhat trong ngay) thi thoat khi dong cua < Kijun - khong phu thuoc muc TP1 cua engine (5-14%).
// Chi DOC cache, khong dung mang. Xem chu thich han che o dau backtestChotLoi.mjs / backtestLocThiTruong.mjs.
// CACH CHAY: node engine/dich-vu/backtestChotLoiSauLoc.mjs [tenTepCache=nen_dai.json]
import { docJson, chayEngine, moPhong, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";

const cache = docJson(process.argv[2] || "nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, soMa, thiTruong } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
for (const t of lenh) t.tt = thiTruong(t.ngay);
const KIJ = "Gia so voi Kijun (% tren Kijun)";
const SO_LAN = 40;

const TAP = [
  ["A. Tat ca lenh Mua thuong", () => true],
  ["B. Gia <= 6% tren Kijun", (t) => t.dacTrung[KIJ] <= 6],
  ["C. Gia <= 6% tren Kijun VA VN-Index > Tenkan", (t) => t.dacTrung[KIJ] <= 6 && t.tt && t.tt.vni > t.tt.tenkan],
];

const CACH = [
  { ten: "Hien tai 30/30/25 + 15% chay", moc: [{ w: 0.3, muc: "tp1" }, { w: 0.3, muc: "tp2" }, { w: 0.25, muc: "tp3" }] },
  { ten: "Giu het (chi cat lo / BAN)", moc: [] },
  { ten: "Chot HET o TP2", moc: [{ w: 1, muc: "tp2" }] },
  { ten: "30% o TP1, con lai < Kijun", moc: [{ w: 0.3, muc: "tp1" }], theoKijunSau: 0 },
  { ten: "50% o TP1, con lai < Kijun", moc: [{ w: 0.5, muc: "tp1" }], theoKijunSau: 0 },
  { ten: "Khong chot, sau TP1 -> < Kijun", moc: [{ w: 0, muc: "tp1" }], theoKijunSau: 0 },
  { ten: "Khong chot, sau lai +5% -> < Kijun", moc: [{ w: 0, muc: { pct: 5 } }], theoKijunSau: 0 },
  { ten: "Khong chot, sau lai +8% -> < Kijun", moc: [{ w: 0, muc: { pct: 8 } }], theoKijunSau: 0 },
  { ten: "Khong chot, sau lai +10% -> < Kijun", moc: [{ w: 0, muc: { pct: 10 } }], theoKijunSau: 0 },
  { ten: "30% o +8%, con lai (sau +8%) < Kijun", moc: [{ w: 0.3, muc: { pct: 8 } }], theoKijunSau: 0 },
  { ten: "30% o +5%, con lai (sau +5%) < Kijun", moc: [{ w: 0.3, muc: { pct: 5 } }], theoKijunSau: 0 },
];

for (const [tenTap, fn] of TAP) {
  const ds = lenh.filter(fn);
  console.log(`\n=========== Tap lenh ${tenTap}: n = ${ds.length} ===========`);
  console.log("Cach chot loi".padEnd(40), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "lai/phien".padStart(9), "| lai TB theo giai doan".padStart(37), "| DM K=10".padStart(12), "K=20".padStart(9));
  for (const c of CACH) {
    const kqs = ds.map((t) => moPhong(t, c));
    const ok = kqs.filter(Boolean);
    const k = thongKe(ok);
    const ky = [[], [], []];
    ds.forEach((t, i) => kqs[i] && ky[kyOf(t.ngay)].push(kqs[i].ret));
    const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {});
    const d20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, {});
    console.log(
      c.ten.padEnd(40), f(k.tb).padStart(7), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), f(k.laiMoiPhien, 3).padStart(9), "|", ky.map((a) => `${f(tb(a)).padStart(5)}(${a.length})`).join(" "),
      `| ${f(d10.cagr, 1)}%/${f(d10.sut, 0)}%`, `${f(d20.cagr, 1)}%/${f(d20.sut, 0)}%`
    );
  }
}
