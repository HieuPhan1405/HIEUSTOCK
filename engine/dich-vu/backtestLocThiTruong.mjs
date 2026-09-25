// BACKTEST 1) BO LOC THI TRUONG (chi vao lenh khi VN-Index / do rong thi truong tot?) va 2) CHON LENH THEO XEP HANG khi co nhieu tin hieu cung ngay va
// chi co vai vi the (danh muc gioi han K). Dung cac lan vao lenh "Mua thuong" cua engine (chuoi theo tung nen, xem backtestChung.mjs) tren lich su ~11 nam
// (engine/output/nen_dai.json + vnindex_dai.json - tao boi taiDuLieuDai.mjs va taiVniDai.mjs). Chi DOC cache, khong dung mang.
//
// 2 cach thoat duoc thu: "Hien tai 30/30/25/15" va "Khong chot, sau TP1 thoat khi dong cua < Kijun" (cach tot nhat o backtestChotLoi.mjs). Chi phi 0,4%/lenh da tru.
// Trang thai thi truong lay TAI NGAY VAO LENH (chi dung du lieu den het ngay do). Do rong = % ma trong ~387 ma co dong cua > SMA50 (hoac > Kijun) cung ngay.
// HAN CHE: ma hien tai (thien lech nguoi song sot, anh huong nhu nhau len moi cau hinh); thu nhieu bo loc/tieu chi nen coi chung ket qua "dep tinh co" - chi
// tin cai khi CUNG HUONG o ca 3 giai doan; danh muc gioi han la MO PHONG THO (xem danhMuc trong backtestChung.mjs).
// CACH CHAY: node engine/dich-vu/backtestLocThiTruong.mjs [tenTepCache=nen_dai.json]
import { docJson, chayEngine, moPhong, thongKe, danhMucNhieuLan, CACH_HIEN_TAI, CACH_KIJUN, tb, f, kyOf, TEN_KY } from "./backtestChung.mjs";

const cache = docJson(process.argv[2] || "nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCaLenh, soMa, thiTruong } = chayEngine({ cache, vni });
const lenh = tatCaLenh.filter((t) => t.loai === 1); // chi "Mua thuong"
for (const t of lenh) t.tt = thiTruong(t.ngay);
const CACH = [CACH_HIEN_TAI, CACH_KIJUN];
const KQ = CACH.map((c) => lenh.map((t) => moPhong(t, c)));
const SO_LAN = 40;

console.log(`Du lieu: ${soMa} ma, ${lenh.length} lenh "Mua thuong" da dong, vao lenh ${lenh.reduce((m, t) => (t.ngay < m ? t.ngay : m), "9999")} -> ${lenh.reduce((m, t) => (t.ngay > m ? t.ngay : m), "0000")}`);
{
  const b = (t) => t.tt;
  const conTT = lenh.filter(b).length;
  console.log(`Co trang thai thi truong: ${conTT}/${lenh.length} lenh (VNINDEX ${vni[0].t} -> ${vni[vni.length - 1].t}; VNINDEX CAGR gia ${f((Math.pow(vni[vni.length - 1].c / vni[0].c, 365.25 / ((Date.parse(vni[vni.length - 1].t) - Date.parse(vni[0].t)) / 86400e3)) - 1) * 100, 1)}%/nam)\n`);
}

// =================== 1. BO LOC THI TRUONG ===================
const LOC = [
  ["Khong loc", () => true],
  ["VN-Index > Kijun", (t) => t.tt && t.tt.vni > t.tt.kijun],
  ["VN-Index > Tenkan", (t) => t.tt && t.tt.vni > t.tt.tenkan],
  ["VN-Index > dinh may Ichimoku", (t) => t.tt && t.tt.vni > t.tt.cloudTop],
  ["VN-Index > SMA50", (t) => t.tt && t.tt.vni > t.tt.sma50],
  ["VN-Index > SMA200", (t) => t.tt && t.tt.vni > t.tt.sma200],
  ["VN-Index: SMA50 > SMA200 (xu huong len)", (t) => t.tt && t.tt.sma50 > t.tt.sma200],
  ["Do rong (ma > SMA50) >= 40%", (t) => t.tt && t.tt.doRong50 != null && t.tt.doRong50 >= 40],
  ["Do rong (ma > SMA50) >= 50%", (t) => t.tt && t.tt.doRong50 != null && t.tt.doRong50 >= 50],
  ["Do rong (ma > SMA50) >= 60%", (t) => t.tt && t.tt.doRong50 != null && t.tt.doRong50 >= 60],
  ["Do rong (ma > Kijun) >= 50%", (t) => t.tt && t.tt.doRongKijun != null && t.tt.doRongKijun >= 50],
  ["VN-Index > Kijun VA do rong SMA50 >= 50%", (t) => t.tt && t.tt.vni > t.tt.kijun && t.tt.doRong50 != null && t.tt.doRong50 >= 50],
];

console.log("############ 1. BO LOC THI TRUONG ############");
for (let s = 0; s < CACH.length; s++) {
  console.log(`\n--- Cach thoat: ${CACH[s].ten} ---`);
  console.log("Bo loc".padEnd(44), "giu".padStart(5), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "| BI LOAI: n".padStart(13), "lai TB".padStart(7), "| lai TB theo giai doan (giu)".padStart(31), "| DM K=10".padStart(10), "K=20".padStart(6));
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
    const dm10 = danhMucNhieuLan(KQ[s], lenh, 10, SO_LAN, { loc: fn });
    const dm20 = danhMucNhieuLan(KQ[s], lenh, 20, SO_LAN, { loc: fn });
    console.log(
      ten.padEnd(44), `${((kg.n / (kg.n + kl.n)) * 100).toFixed(0)}%`.padStart(5), f(kg.tb).padStart(7), f(kg.thang, 0).padStart(7), f(kg.pf).padStart(5),
      `| ${String(kl.n).padStart(5)}`, f(kl.tb).padStart(7), "|", ky.map((a) => `${f(tb(a)).padStart(5)}(${a.length})`).join(" "),
      `| ${f(dm10.cagr, 1)}%/${f(dm10.sut, 0)}%`, `${f(dm20.cagr, 1)}%/${f(dm20.sut, 0)}%`
    );
  }
}
console.log("\n(DM K=... = lai gop %/nam / sut giam toi da % cua danh muc gioi han K vi the, lay chon ngau nhien khi nhieu tin hieu cung ngay; khi bo loc TAT, tien nam yen khong sinh loi)");

// =================== 2. XEP HANG LENH ===================
const TIEU_CHI = Object.keys(lenh[0].dacTrung);
const rho = (xs, ys) => {
  const rank = (a) => {
    const idx = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]);
    const r = new Array(a.length);
    idx.forEach(([, i], k) => (r[i] = k));
    return r;
  };
  const rx = rank(xs);
  const ry = rank(ys);
  const n = xs.length;
  const mx = tb(rx);
  const my = tb(ry);
  let tu = 0;
  let a = 0;
  let b = 0;
  for (let i = 0; i < n; i++) {
    tu += (rx[i] - mx) * (ry[i] - my);
    a += (rx[i] - mx) ** 2;
    b += (ry[i] - my) ** 2;
  }
  return tu / Math.sqrt(a * b);
};

console.log("\n############ 2. XEP HANG LENH ############");
for (let s = 0; s < CACH.length; s++) {
  console.log(`\n--- Cach thoat: ${CACH[s].ten} --- (Q1 = 20% lenh co gia tri THAP nhat cua tieu chi ... Q5 = CAO nhat; lai TB moi nhom; rho = tuong quan hang Spearman voi lai/lo lenh)`);
  console.log("Tieu chi".padEnd(46), "Q1".padStart(6), "Q2".padStart(6), "Q3".padStart(6), "Q4".padStart(6), "Q5".padStart(6), "| rho".padStart(8), "theo 3 giai doan".padStart(26));
  for (const tc of TIEU_CHI) {
    const muc = [];
    lenh.forEach((t, i) => {
      const r = KQ[s][i];
      const v = t.dacTrung[tc];
      if (r && Number.isFinite(v)) muc.push({ v, ret: r.ret, ky: kyOf(t.ngay) });
    });
    muc.sort((a, b) => a.v - b.v);
    const q = [0, 1, 2, 3, 4].map((k) => muc.slice(Math.floor((muc.length * k) / 5), Math.floor((muc.length * (k + 1)) / 5)));
    const r0 = rho(muc.map((x) => x.v), muc.map((x) => x.ret));
    const rk = [0, 1, 2].map((k) => {
      const m = muc.filter((x) => x.ky === k);
      return m.length > 50 ? rho(m.map((x) => x.v), m.map((x) => x.ret)) : NaN;
    });
    console.log(tc.padEnd(46), ...q.map((g) => f(tb(g.map((x) => x.ret))).padStart(6)), `| ${f(r0, 3).padStart(6)}`, rk.map((v) => f(v, 3).padStart(7)).join(" "));
  }
}

console.log("\n--- Danh muc gioi han K vi the: chon lenh theo tieu chi (cao truoc / thap truoc) so voi chon NGAU NHIEN (lai gop %/nam / sut giam toi da %) ---");
for (let s = 0; s < CACH.length; s++) {
  console.log(`\nCach thoat: ${CACH[s].ten}`);
  for (const K of [10, 20]) {
    const ngauNhien = danhMucNhieuLan(KQ[s], lenh, K, SO_LAN, {});
    console.log(`  K = ${K}: NGAU NHIEN ${f(ngauNhien.cagr, 1)}%/nam (10-90%: ${f(ngauNhien.p10, 1)}..${f(ngauNhien.p90, 1)}) sut ${f(ngauNhien.sut, 0)}% lai TB lenh lay ${f(ngauNhien.laiTB)}%`);
    for (const tc of TIEU_CHI)
      for (const huong of [1, -1]) {
        const d = danhMucNhieuLan(KQ[s], lenh, K, SO_LAN, { xepHang: (t) => huong * t.dacTrung[tc] });
        console.log(`     ${(huong === 1 ? "CAO truoc: " : "THAP truoc: ") + tc}`.padEnd(66), `${f(d.cagr, 1).padStart(5)}%/nam (10-90%: ${f(d.p10, 1)}..${f(d.p90, 1)}) sut ${f(d.sut, 0)}% lai TB lenh lay ${f(d.laiTB)}%`);
      }
  }
}
