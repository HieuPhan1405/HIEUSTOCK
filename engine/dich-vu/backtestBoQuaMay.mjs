// BACKTEST VAO LENH KHI BO QUA MAY (Hieu 2026-10-21: "test thu vao lenh khi bo qua may, nhu gia tren Tenkan va Tenkan tren Kijun").
// Cac kich ban (engine that, nhan chung 4 ban sao cua he thong; cong tac nghien cuu mac dinh TAT trong engine/tinhTinHieuChoMa.js):
//   S0 HIEN TAI                         : diem xu huong co thanh phan "gia so voi may" (+1 tren may / -1 duoi may / 0 trong may)
//   S1 BO QUA MAY (boQuaMay)            : diem xu huong KHONG tinh vi tri gia so voi may; cac dieu kien khac giu nguyen
//   S2 BO MAY + GIA > TENKAN > KIJUN    : nhu S1 va bat buoc dong cua > Tenkan va Tenkan > Kijun
//   S3 HIEN TAI + GIA > TENKAN > KIJUN  : he thong hien tai them dieu kien Tenkan / Kijun (khong doi diem)
// Do lenh Mua thuong: cach quan ly nhu he thong (30% TP1 + 30% TP2 + 40% giu den BAN / cat lo / hoa von sau TP2), vao o MOC va vao ATC + T+2 (thuc te hon), phi 0,4%; danh muc K vi the (xep ngau nhien 40 lan).
// Phan tich phu: lenh o S1 NHUNG KHONG co o S0 ("lenh moi do bo may") chia theo vi tri gia so voi may luc vao; lenh S0 chia theo co / khong gia > Tenkan > Kijun.
// CACH CHAY: node engine/dich-vu/backtestBoQuaMay.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf, TEN_KY } from "./backtestChung.mjs";
import { mo } from "./moBaoVeLai.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const KICH_BAN = [
  ["S0 HIEN TAI", {}],
  ["S1 BO QUA MAY", { boQuaMay: true }],
  ["S2 BO MAY + gia>Tenkan>Kijun", { boQuaMay: true, yeuCauGiaTenkanKijun: true }],
  ["S3 HIEN TAI + gia>Tenkan>Kijun", { yeuCauGiaTenkanKijun: true }],
];
const SO_LAN = 40;
const KQ = {};
console.log(`${"Kich ban".padEnd(32)} ${"n".padStart(5)} | ${"MOC: laiTB".padStart(10)} ${"PF".padStart(5)} ${"thang%".padStart(6)} | ${"ATC: laiTB".padStart(10)} ${"PF".padStart(5)} ${"thang%".padStart(6)} ${"phien".padStart(5)} | ATC theo giai doan ${TEN_KY.join(" | ")} | DM ATC K10 CAGR/sut | K20`);
for (const [ten, tham] of KICH_BAN) {
  const { lenh } = chayEngine({ cache, vni, thamSoThem: tham });
  const ds = lenh.filter((t) => t.loai === 1);
  const moc = ds.map((t) => mo(t, { atc: false }));
  const atc = ds.map((t) => mo(t, { atc: true }));
  KQ[ten] = { ds, atc };
  const ok = (a) => a.filter((x) => x);
  const kM = thongKe(ok(moc)), kA = thongKe(ok(atc));
  const ky = [0, 1, 2].map((j) => f(tb(ds.map((t, i) => (atc[i] && kyOf(t.ngay) === j ? atc[i].ret : null)).filter((x) => x != null))));
  const d10 = danhMucNhieuLan(atc, ds, 10, SO_LAN), d20 = danhMucNhieuLan(atc, ds, 20, SO_LAN);
  console.log(`${ten.padEnd(32)} ${String(kA.n).padStart(5)} | ${f(kM.tb).padStart(10)} ${f(kM.pf).padStart(5)} ${f(kM.thang, 1).padStart(6)} | ${f(kA.tb).padStart(10)} ${f(kA.pf).padStart(5)} ${f(kA.thang, 1).padStart(6)} ${f(kA.phienTB, 1).padStart(5)} | ${ky.map((v) => v.padStart(12)).join(" ")} | ${f(d10.cagr, 1)}%/${f(d10.sut, 0)}% | ${f(d20.cagr, 1)}%/${f(d20.sut, 0)}%`);
}

// ---- phan tich phu ----
const vt = (t) => {
  const c = t.close[t.iv];
  const top = t.cloudTop[t.iv], bot = t.cloudBot[t.iv];
  if (top == null || bot == null) return "khong co may";
  return c > top ? "tren may" : c < bot ? "duoi may" : "trong may";
};
const tkKj = (t) => t.tenkan[t.iv] != null && t.kijun[t.iv] != null && t.close[t.iv] > t.tenkan[t.iv] && t.tenkan[t.iv] > t.kijun[t.iv];
const tom = (ten, arr) => {
  const r = arr.filter((x) => x.r).map((x) => x.r.ret);
  const k = thongKe(r.map((x) => ({ ret: x, phien: 1 })));
  console.log(`  ${ten.padEnd(52)} n=${String(r.length).padStart(5)}  laiTB ${f(k.tb).padStart(6)}  thang ${f(k.thang, 0).padStart(3)}%  PF ${f(k.pf).padStart(5)}`);
};
const khoa = (t) => `${t.ma}|${t.ngay}`;
const s0 = KQ["S0 HIEN TAI"], s1 = KQ["S1 BO QUA MAY"];
const tap0 = new Set(s0.ds.map(khoa));
console.log("\n=== S0: lenh hien tai chia theo vi tri gia so voi may luc vao (ATC + T+2) ===");
for (const v of ["tren may", "trong may", "duoi may", "khong co may"]) tom(v, s0.ds.map((t, i) => ({ t, r: s0.atc[i] })).filter((x) => vt(x.t) === v));
console.log("\n=== S0: chia theo gia > Tenkan > Kijun luc vao ===");
tom("CO gia > Tenkan > Kijun", s0.ds.map((t, i) => ({ t, r: s0.atc[i] })).filter((x) => tkKj(x.t)));
tom("KHONG (Tenkan <= Kijun hoac gia <= Tenkan)", s0.ds.map((t, i) => ({ t, r: s0.atc[i] })).filter((x) => !tkKj(x.t)));
console.log("\n=== S1: LENH MOI do bo may (khong co o S0), chia theo vi tri gia so voi may ===");
const moi = s1.ds.map((t, i) => ({ t, r: s1.atc[i] })).filter((x) => !tap0.has(khoa(x.t)));
tom("tat ca lenh moi", moi);
for (const v of ["tren may", "trong may", "duoi may"]) tom(`  ${v}`, moi.filter((x) => vt(x.t) === v));
tom("  trong do co gia > Tenkan > Kijun", moi.filter((x) => tkKj(x.t)));
tom("  trong do KHONG gia > Tenkan > Kijun", moi.filter((x) => !tkKj(x.t)));
const chung = s1.ds.map((t, i) => ({ t, r: s1.atc[i] })).filter((x) => tap0.has(khoa(x.t)));
tom("lenh S1 trung voi S0 (chung)", chung);
const tap1 = new Set(s1.ds.map(khoa));
tom("lenh S0 bi mat o S1 (S1 khong con tin hieu)", s0.ds.map((t, i) => ({ t, r: s0.atc[i] })).filter((x) => !tap1.has(khoa(x.t))));
