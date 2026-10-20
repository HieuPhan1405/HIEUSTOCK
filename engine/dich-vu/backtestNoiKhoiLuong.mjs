// BACKTEST NOI CONG KHOI LUONG NGAY DAU (Hieu hoi 2026-10-20): "co cach nao noi bot cai KL ra, nhieu lan vao muon, hoac tran roi khong mua duoc".
// Cong KL ngay dau (engine/loi/volumeGate.js) = 3 dieu kien AND: (1) KL >= (1 + volMinPctTB20%) TB20 hom qua, (2) KL >= (1 + volMinPctHomTruoc%) KL hom qua, (3) KL > KL cao nhat cac phien GIAM gan day (Pocket Pivot).
// Backtest dung KL CA NGAY (dong cua). Luc 14h KL moi chay duoc ~70-85% nen cong chi dat muon; noi nguong ~ giong viec dat som hon trong phien (mo phong bang cac cau hinh "nhe").
// Do voi moi cau hinh: so lenh Mua thuong, lai TB (vao ATC + T+2 va vao o moc + T+2, 30% TP1 + 30% TP2 + 40% chay, phi 0,4%), theo giai doan, ty le lenh co dong cua > moc +1% (da vuot vung mua) va ty le dong cua tang >= 6,9% so hom truoc (gan tran HOSE).
// Chi DOC cache (nen_dai.json + vnindex_dai.json). CACH CHAY: node engine/dich-vu/backtestNoiKhoiLuong.mjs
import { docJson, chayEngine, moPhongThucTe, thongKe, tb, f, kyOf, TEN_KY } from "./backtestChung.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const CAU_HINH = [
  ["HIEN TAI 50/30/pocket10", {}],
  ["Nhe 1: 30/20/pocket10", { volMinPctTB20: 30, volMinPctHomTruoc: 20 }],
  ["Nhe 2: 20/0/pocket10", { volMinPctTB20: 20, volMinPctHomTruoc: 0 }],
  ["Chi TB20 >= +50% (bo 2 dk con lai)", { volMinPctHomTruoc: -100, pocketPivotNhinLai: 1 }],
  ["Chi TB20 >= +20%", { volMinPctTB20: 20, volMinPctHomTruoc: -100, pocketPivotNhinLai: 1 }],
  ["Chi TB20 >= +0%", { volMinPctTB20: 0, volMinPctHomTruoc: -100, pocketPivotNhinLai: 1 }],
  ["Bo han cong KL ngay dau", { tatCongKhoiLuongNgayDau: true }],
];

const DAU = `${"Cau hinh".padEnd(38)} ${"n".padStart(5)} | ${"ATC lai".padStart(7)} ${"PF".padStart(5)} ${"thang%".padStart(6)} | ${"moc lai".padStart(7)} ${"PF".padStart(5)} | ${TEN_KY.map((k) => ("ATC " + k).padStart(15)).join(" ")} | ${">moc+1%".padStart(7)} ${"~tran".padStart(6)}`;
console.log(DAU);
for (const [ten, thamSoThem] of CAU_HINH) {
  const { lenh } = chayEngine({ cache, vni, thamSoThem });
  const ds = lenh.filter((t) => t.loai === 1);
  const atc = ds.map((t) => ({ t, r: moPhongThucTe(t, { E: t.close[t.iv], vao: t.iv, banTu: t.iv + 2 }) })).filter((x) => x.r != null && Number.isFinite(x.r));
  const moc = ds.map((t) => ({ t, r: moPhongThucTe(t, { E: t.E, vao: t.iv, banTu: t.iv + 2 }) })).filter((x) => x.r != null && Number.isFinite(x.r));
  const kA = thongKe(atc.map((x) => ({ ret: x.r, phien: 1 })));
  const kM = thongKe(moc.map((x) => ({ ret: x.r, phien: 1 })));
  const ky = [0, 1, 2].map((j) => {
    const a = atc.filter((x) => kyOf(x.t.ngay) === j).map((x) => x.r);
    return a.length ? `${f(tb(a))} (${a.length})` : "-";
  });
  const quaMoc = ds.filter((t) => t.close[t.iv] > t.E * 1.01).length / ds.length;
  const gan = ds.filter((t) => t.iv > 0 && t.close[t.iv] / t.close[t.iv - 1] - 1 >= 0.069).length / ds.length;
  console.log(
    `${ten.padEnd(38)} ${String(ds.length).padStart(5)} | ${f(kA.tb).padStart(7)} ${f(kA.pf).padStart(5)} ${f(kA.thang, 1).padStart(6)} | ${f(kM.tb).padStart(7)} ${f(kM.pf).padStart(5)} | ${ky.map((v) => v.padStart(15)).join(" ")} | ${(quaMoc * 100).toFixed(0).padStart(6)}% ${(gan * 100).toFixed(0).padStart(5)}%`
  );
}

// ---------- THOI DIEM TRONG PHIEN: can bao nhieu % KL ca ngay thi cong KL moi dat (cua cac lenh cua cau hinh HIEN TAI) ----------
// f* = ty le KL ca ngay can co moi qua cong. f* thap = tin hieu hien som trong phien. (Chua tinh dieu kien gia vuot moc - chi phan KL.)
const { lenh: base } = chayEngine({ cache, vni });
const dsB = base.filter((t) => t.loai === 1);
const fStar = (t, cfg) => {
  const { iv, vol, close, relVol } = t;
  const V = vol[iv];
  if (!(V > 0)) return Infinity;
  let fs = 0;
  const p = cfg.tb20, q = cfg.homTruoc, pk = cfg.pocket;
  if (p != null) fs = Math.max(fs, (1 + p / 100) / relVol[iv]);
  if (q != null) fs = Math.max(fs, ((1 + q / 100) * vol[iv - 1]) / V);
  if (pk) {
    let m = 0;
    for (let j = Math.max(1, iv - 10); j <= iv - 1; j++) if (close[j] < close[j - 1]) m = Math.max(m, vol[j]);
    fs = Math.max(fs, m / V);
  }
  return fs;
};
const BANG = [
  ["HIEN TAI 50/30/pocket", { tb20: 50, homTruoc: 30, pocket: true }],
  ["Nhe 1: 30/20/pocket", { tb20: 30, homTruoc: 20, pocket: true }],
  ["Nhe 2: 20/0/pocket", { tb20: 20, homTruoc: 0, pocket: true }],
  ["Chi TB20 +50%", { tb20: 50 }],
  ["Chi TB20 +20%", { tb20: 20 }],
  ["Chi TB20 +0%", { tb20: 0 }],
];
const MOC = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
console.log(`\nTHOI DIEM QUA CONG KL (ty le lenh da qua cong KL khi KL tich luy dat X% KL ca ngay; ${dsB.length} lenh Mua thuong cua cau hinh hien tai)`);
console.log(`${"Cau hinh".padEnd(26)} ${MOC.map((m) => (m * 100 + "%").padStart(7)).join(" ")}   trung vi f*`);
for (const [ten, cfg] of BANG) {
  const fs = dsB.map((t) => fStar(t, cfg)).sort((a, b) => a - b);
  console.log(`${ten.padEnd(26)} ${MOC.map((m) => ((fs.filter((x) => x <= m).length / fs.length) * 100).toFixed(0).padStart(6) + "%").join(" ")}   ${fs[Math.floor(fs.length / 2)].toFixed(2)}`);
}
