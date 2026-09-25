// BACKTEST "3 MOC TP KET THUC LENH": chot het 100% vi the bang 3 moc TP1/TP2/TP3 cua engine (KHONG con phan 15% chay), chi khac nhau o TY LE chia va viec co them
// bao ve bang Kijun (phan con lai thoat neu dong cua < Kijun truoc khi toi TP3) hay keo TP3 xa hon. So voi cach hien tai 30/30/25 + 15% chay va cach "sau TP1 bam Kijun".
// Cac moc TP la moc cua engine (dua tren may / duong can bang dai han / san % - van la kien thuc Ichimoku dang dung). Lenh chua toi TP3 van thoat khi cham cat lo /
// tin hieu BAN / bao ve hoa von sau TP2 nhu cu. Tren cac lenh "Mua thuong" (~11 nam: nen_dai.json + vnindex_dai.json); tap A = tat ca, tap B = gia <= 6% tren Kijun luc vao.
// Chi phi 0,4%/lenh da tru. Chi DOC cache, khong dung mang. Xem han che o dau backtestChotLoi.mjs / backtestLocThiTruong.mjs.
// CACH CHAY: node engine/dich-vu/backtestBaMocKetThuc.mjs [tenTepCache=nen_dai.json]
import { docJson, chayEngine, moPhong, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";

const cache = docJson(process.argv[2] || "nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, soMa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
const KIJ = "Gia so voi Kijun (% tren Kijun)";
const SO_LAN = 40;
const ba = (w1, w2, w3, tp3x) => [{ w: w1, muc: "tp1" }, { w: w2, muc: "tp2" }, { w: w3, muc: tp3x ? { tp3x } : "tp3" }];

const CACH = [
  { ten: "Hien tai 30/30/25 + 15% chay", moc: [{ w: 0.3, muc: "tp1" }, { w: 0.3, muc: "tp2" }, { w: 0.25, muc: "tp3" }] },
  { ten: "Sau TP1: bam Kijun (khong chia)", moc: [{ w: 0, muc: "tp1" }], theoKijunSau: 0, chay: { duong: "kijun", soNen: 1 } },
  // --- 3 moc, ket thuc lenh o TP3 ---
  { ten: "3 moc 30/30/40 (het o TP3)", moc: ba(0.3, 0.3, 0.4) },
  { ten: "3 moc 33/33/34", moc: ba(1 / 3, 1 / 3, 1 / 3) },
  { ten: "3 moc 25/25/50", moc: ba(0.25, 0.25, 0.5) },
  { ten: "3 moc 20/30/50", moc: ba(0.2, 0.3, 0.5) },
  { ten: "3 moc 40/30/30", moc: ba(0.4, 0.3, 0.3) },
  { ten: "3 moc 50/25/25", moc: ba(0.5, 0.25, 0.25) },
  // --- them bao ve Kijun cho phan chua ban ---
  { ten: "3 moc 30/30/40 + thoat Kijun sau TP1", moc: ba(0.3, 0.3, 0.4), theoKijunSau: 0, chay: { duong: "kijun", soNen: 1 } },
  { ten: "3 moc 33/33/34 + thoat Kijun sau TP1", moc: ba(1 / 3, 1 / 3, 1 / 3), theoKijunSau: 0, chay: { duong: "kijun", soNen: 1 } },
  { ten: "3 moc 25/25/50 + thoat Kijun sau TP1", moc: ba(0.25, 0.25, 0.5), theoKijunSau: 0, chay: { duong: "kijun", soNen: 1 } },
  { ten: "3 moc 30/30/40 + thoat Kijun sau TP2", moc: ba(0.3, 0.3, 0.4), theoKijunSau: 1, chay: { duong: "kijun", soNen: 1 } },
  // --- keo TP3 xa hon ---
  { ten: "3 moc 30/30/40, TP3 x1,5 xa hon", moc: ba(0.3, 0.3, 0.4, 1.5) },
  { ten: "3 moc 30/30/40, TP3 x2 xa hon", moc: ba(0.3, 0.3, 0.4, 2) },
  { ten: "3 moc 30/30/40, TP3 x1,5 + Kijun sau TP1", moc: ba(0.3, 0.3, 0.4, 1.5), theoKijunSau: 0, chay: { duong: "kijun", soNen: 1 } },
  { ten: "3 moc 30/30/40, TP3 x2 + Kijun sau TP1", moc: ba(0.3, 0.3, 0.4, 2), theoKijunSau: 0, chay: { duong: "kijun", soNen: 1 } },
];

const TAP = [
  ["A. Tat ca lenh Mua thuong", () => true],
  ["B. Gia <= 6% tren Kijun luc vao", (t) => t.dacTrung[KIJ] <= 6],
];

for (const [tenTap, fn] of TAP) {
  const ds = lenh.filter(fn);
  console.log(`\n=========== Tap ${tenTap}: n = ${ds.length} (${soMa} ma) ===========`);
  console.log("Cach chot loi".padEnd(44), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "lai/phien".padStart(9), ">+20%".padStart(6), "| lai TB theo giai doan".padStart(37), "| DM K=10".padStart(12), "K=20".padStart(9));
  for (const c of CACH) {
    const kqs = ds.map((t) => moPhong(t, c));
    const ok = kqs.filter(Boolean);
    const k = thongKe(ok);
    const ky = [[], [], []];
    let tren20 = 0;
    ds.forEach((t, i) => {
      if (!kqs[i]) return;
      ky[kyOf(t.ngay)].push(kqs[i].ret);
      if (kqs[i].ret > 20) tren20++;
    });
    const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {});
    const d20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, {});
    console.log(
      c.ten.padEnd(44), f(k.tb).padStart(7), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), f(k.laiMoiPhien, 3).padStart(9), `${((tren20 / ok.length) * 100).toFixed(1)}`.padStart(6), "|",
      ky.map((a) => `${f(tb(a)).padStart(5)}(${a.length})`).join(" "), `| ${f(d10.cagr, 1)}%/${f(d10.sut, 0)}%`, `${f(d20.cagr, 1)}%/${f(d20.sut, 0)}%`
    );
  }
}
