// BACKTEST TIEP THEO cua backtestLocThiTruong.mjs: cac tieu chi nhat quan CUNG HUONG o ca 3 giai doan (khong dung tin hieu "diem xep hang" cua web vi khong co gia tri du bao) la
// "gia da xa Kijun / da tang manh" luc vao lenh -> thu lam BO LOC (bo lenh vao khi gia da chay xa) va so voi bo loc thi truong VN-Index > Tenkan. Dung cac lenh "Mua thuong"
// cua engine tren ~11 nam (nen_dai.json + vnindex_dai.json). Cot "t" = thong ke t (Welch) cua chenh lech lai TB giua nhom GIU va nhom BI LOAI (|t| > 2 moi dang chu y;
// da thu nhieu bo loc nen can it nhat |t| > 3 va cung huong o ca 3 giai doan). Chi phi 0,4%/lenh da tru. Chi DOC cache, khong dung mang.
// CACH CHAY: node engine/dich-vu/backtestGianXaKijun.mjs [tenTepCache=nen_dai.json]
import { docJson, chayEngine, moPhong, thongKe, danhMucNhieuLan, CACH_HIEN_TAI, CACH_KIJUN, CACH_30_KIJUN, tb, f, kyOf } from "./backtestChung.mjs";

const cache = docJson(process.argv[2] || "nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, soMa, thiTruong } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
for (const t of lenh) t.tt = thiTruong(t.ngay);
const CACH = [CACH_HIEN_TAI, CACH_30_KIJUN, CACH_KIJUN];
const KQ = CACH.map((c) => lenh.map((t) => moPhong(t, c)));
const SO_LAN = 40;
const KIJ = "Gia so voi Kijun (% tren Kijun)";
const TANG20 = "Tang 20 phien truoc do (dong luc)";
const dt = (t, k) => t.dacTrung[k];

const doLechChuan = (a) => {
  const m = tb(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1));
};

const LOC = [
  ["Khong loc", () => true],
  ["Gia <= 4% tren Kijun", (t) => dt(t, KIJ) <= 4],
  ["Gia <= 6% tren Kijun", (t) => dt(t, KIJ) <= 6],
  ["Gia <= 8% tren Kijun", (t) => dt(t, KIJ) <= 8],
  ["Gia <= 10% tren Kijun", (t) => dt(t, KIJ) <= 10],
  ["Gia <= 12% tren Kijun", (t) => dt(t, KIJ) <= 12],
  ["Gia <= 15% tren Kijun", (t) => dt(t, KIJ) <= 15],
  ["Tang 20 phien <= 10%", (t) => dt(t, TANG20) <= 10],
  ["Tang 20 phien <= 15%", (t) => dt(t, TANG20) <= 15],
  ["Tang 20 phien <= 20%", (t) => dt(t, TANG20) <= 20],
  ["Gia <= 8% tren Kijun VA tang 20 phien <= 15%", (t) => dt(t, KIJ) <= 8 && dt(t, TANG20) <= 15],
  ["VN-Index > Tenkan (bo loc thi truong)", (t) => t.tt && t.tt.vni > t.tt.tenkan],
  ["Gia <= 8% tren Kijun VA VN-Index > Tenkan", (t) => dt(t, KIJ) <= 8 && t.tt && t.tt.vni > t.tt.tenkan],
];

const phanVi = (k) => {
  const v = lenh.map((t) => dt(t, k)).filter(Number.isFinite).sort((a, b) => a - b);
  return [0.2, 0.4, 0.6, 0.8].map((p) => v[Math.floor(v.length * p)]);
};
console.log(`Du lieu: ${soMa} ma, ${lenh.length} lenh "Mua thuong" (${lenh[0].ngay}..)`);
console.log(`Phan vi 20/40/60/80% cua "% tren Kijun" luc vao lenh: ${phanVi(KIJ).map((v) => f(v, 1)).join(" / ")} | cua "tang 20 phien": ${phanVi(TANG20).map((v) => f(v, 1)).join(" / ")}\n`);

for (let s = 0; s < CACH.length; s++) {
  console.log(`--- Cach thoat: ${CACH[s].ten} ---`);
  console.log("Bo loc".padEnd(46), "giu".padStart(4), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "| BI LOAI n".padStart(12), "lai TB".padStart(7), "t".padStart(6), "| lai TB giu theo giai doan".padStart(33), "| DM K=10".padStart(11), "K=20".padStart(8));
  for (const [ten, fn] of LOC) {
    const giu = [];
    const loai = [];
    const ky = [[], [], []];
    lenh.forEach((t, i) => {
      const r = KQ[s][i];
      if (!r) return;
      if (fn(t)) {
        giu.push(r);
        ky[kyOf(t.ngay)].push(r.ret);
      } else loai.push(r);
    });
    const kg = thongKe(giu);
    const kl = thongKe(loai);
    const t = loai.length > 30 ? (kg.tb - kl.tb) / Math.sqrt(doLechChuan(giu.map((x) => x.ret)) ** 2 / giu.length + doLechChuan(loai.map((x) => x.ret)) ** 2 / loai.length) : NaN;
    const dm10 = danhMucNhieuLan(KQ[s], lenh, 10, SO_LAN, { loc: fn });
    const dm20 = danhMucNhieuLan(KQ[s], lenh, 20, SO_LAN, { loc: fn });
    console.log(
      ten.padEnd(46), `${((kg.n / (kg.n + kl.n)) * 100).toFixed(0)}%`.padStart(4), f(kg.tb).padStart(7), f(kg.thang, 0).padStart(7), f(kg.pf).padStart(5),
      `| ${String(kl.n).padStart(5)}`, f(kl.tb).padStart(7), f(t, 1).padStart(6), "|", ky.map((a) => `${f(tb(a)).padStart(5)}(${a.length})`).join(" "),
      `| ${f(dm10.cagr, 1)}%/${f(dm10.sut, 0)}%`, `${f(dm20.cagr, 1)}%/${f(dm20.sut, 0)}%`
    );
  }
  console.log();
}
