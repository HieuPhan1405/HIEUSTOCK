// BACKTEST "2 MOC TP, PHAN CON LAI GIU DEN TIN HIEU BAN": chot mot phan o 2 moc TP roi phan con lai (40-70%) chay cho toi khi he thong bao BAN (diem so tut / Stop-loss / bao ve hoa von
// sau TP2 - dung cach thoat cua engine cu, khong co TP3). So voi cach hien tai 30/30/25 + 15% chay va cach "3 moc ket thuc o TP3 30/30/40", va them vai bien the bao ve phan chay
// bang Kijun (van dung kien thuc Ichimoku). Cac moc TP la moc cua engine (may / duong can bang dai han / san %). Tren cac lenh "Mua thuong" (~11 nam: nen_dai.json +
// vnindex_dai.json); tap A = tat ca, tap B = gia <= 6% tren Kijun luc vao. Chi phi 0,4%/lenh da tru. Chi DOC cache, khong dung mang.
// CACH CHAY: node engine/dich-vu/backtestHaiMocChayDenBan.mjs [tenTepCache=nen_dai.json]
import { docJson, chayEngine, moPhong, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";

const cache = docJson(process.argv[2] || "nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, soMa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
const KIJ = "Gia so voi Kijun (% tren Kijun)";
const SO_LAN = 40;
const hai = (w1, w2, m1 = "tp1", m2 = "tp2") => [{ w: w1, muc: m1 }, { w: w2, muc: m2 }];
const KIJUN_SAU_TP2 = { theoKijunSau: 1, chay: { duong: "kijun", soNen: 1 } };
const KIJUN_SAU_TP1 = { theoKijunSau: 0, chay: { duong: "kijun", soNen: 1 } };

const CACH = [
  { ten: "Hien tai 30/30/25 + 15% chay", moc: [{ w: 0.3, muc: "tp1" }, { w: 0.3, muc: "tp2" }, { w: 0.25, muc: "tp3" }] },
  { ten: "3 moc 30/30/40 (het o TP3)", moc: [{ w: 0.3, muc: "tp1" }, { w: 0.3, muc: "tp2" }, { w: 0.4, muc: "tp3" }] },
  // --- 2 moc gan (TP1, TP2), con lai chay den tin hieu BAN ---
  { ten: "2 moc TP1/TP2: 30/30 + 40% chay", moc: hai(0.3, 0.3) },
  { ten: "2 moc TP1/TP2: 40/30 + 30% chay", moc: hai(0.4, 0.3) },
  { ten: "2 moc TP1/TP2: 50/25 + 25% chay", moc: hai(0.5, 0.25) },
  { ten: "2 moc TP1/TP2: 25/25 + 50% chay", moc: hai(0.25, 0.25) },
  { ten: "2 moc TP1/TP2: 20/20 + 60% chay", moc: hai(0.2, 0.2) },
  { ten: "2 moc TP1/TP2: 30/20 + 50% chay", moc: hai(0.3, 0.2) },
  { ten: "2 moc TP1/TP2: 50/50 (khong chay)", moc: hai(0.5, 0.5) },
  // --- 2 moc xa hon (TP2, TP3) ---
  { ten: "2 moc TP2/TP3: 30/30 + 40% chay", moc: hai(0.3, 0.3, "tp2", "tp3") },
  { ten: "2 moc TP1/TP3: 30/30 + 40% chay", moc: hai(0.3, 0.3, "tp1", "tp3") },
  // --- 1 moc ---
  { ten: "1 moc TP1: 30% + 70% chay", moc: [{ w: 0.3, muc: "tp1" }] },
  { ten: "1 moc TP1: 50% + 50% chay", moc: [{ w: 0.5, muc: "tp1" }] },
  { ten: "Khong chot (chi thoat theo tin hieu BAN)", moc: [] },
  // --- bao ve phan chay bang Kijun (Ichimoku) ---
  { ten: "2 moc 30/30 + chay, Kijun sau TP2", moc: hai(0.3, 0.3), ...KIJUN_SAU_TP2 },
  { ten: "2 moc 30/30 + chay, Kijun sau TP1", moc: hai(0.3, 0.3), ...KIJUN_SAU_TP1 },
  { ten: "2 moc 40/30 + chay, Kijun sau TP2", moc: hai(0.4, 0.3), ...KIJUN_SAU_TP2 },
  { ten: "2 moc 25/25 + 50% chay, Kijun sau TP2", moc: hai(0.25, 0.25), ...KIJUN_SAU_TP2 },
  { ten: "2 moc 30/30 + chay, 2 nen dong < Kijun sau TP2", moc: hai(0.3, 0.3), theoKijunSau: 1, chay: { duong: "kijun", soNen: 2 } },
  { ten: "2 moc 30/30 + chay, Kijun -> may khi lai +30%", moc: hai(0.3, 0.3), theoKijunSau: 1, chay: { duong: "kijun", soNen: 1, chuyenSauLai: { pct: 30, duong: "cloudTop" } } },
];

const TAP = [
  ["A. Tat ca lenh Mua thuong", () => true],
  ["B. Gia <= 6% tren Kijun luc vao", (t) => t.dacTrung[KIJ] <= 6],
];

for (const [tenTap, fn] of TAP) {
  const ds = lenh.filter(fn);
  console.log(`\n=========== Tap ${tenTap}: n = ${ds.length} (${soMa} ma) ===========`);
  console.log("Cach chot loi".padEnd(50), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "lai/phien".padStart(9), ">+20%".padStart(6), "| lai TB theo giai doan".padStart(37), "| DM K=10".padStart(12), "K=20".padStart(9));
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
      c.ten.padEnd(50), f(k.tb).padStart(7), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), f(k.laiMoiPhien, 3).padStart(9), `${((tren20 / ok.length) * 100).toFixed(1)}`.padStart(6), "|",
      ky.map((a) => `${f(tb(a)).padStart(5)}(${a.length})`).join(" "), `| ${f(d10.cagr, 1)}%/${f(d10.sut, 0)}%`, `${f(d20.cagr, 1)}%/${f(d20.sut, 0)}%`
    );
  }
}
