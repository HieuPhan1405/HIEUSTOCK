// BACKTEST VOI GIA VAO THUC TE (2026-09-27): cac backtest khac vao lenh goc o MOC CHUYEN MUA (gia chi dat duoc neu mua dung luc gia vuot moc trong phien tin hieu) va cho ban
// tu phien ngay sau. O day do lai voi cach nguoi that mua duoc: ATC gia dong cua phien tin hieu, mo cua phien sau, dat lenh cho quanh moc; va quy tac T+2 (co phieu ve chieu T+2).
// Gom 3 phan, cung cach chot 30% TP1 + 30% TP2 + 40% giu den tin hieu BAN / cat lo / hoa von sau TP2, chi phi 0,4%/lenh:
//  A. Lenh MUA (Mua thuong / Mua lai / Mua muon) theo tung cach vao.
//  B. Lenh MUA MOI (dot sau: gia hoi ve Kijun roi bat len - danh cho nguoi lo lenh dau): so voi viec duoi mua lenh dau o phien sau.
//  C. Bo loc thanh khoan (GTGD TB20) + suc manh so voi VN-Index (RS 20 phien) - cach Hieu hay loc tin hieu.
// Cache ~11 nam: nen_dai.json + vnindex_dai.json (387 ma dang niem yet - co thien lech song sot: ma da huy niem yet khong co). Chi DOC cache, khong dung mang.
// CACH CHAY: node engine/dich-vu/backtestVaoThucTe.mjs [tenTepCache=nen_dai.json]
import { docJson, chayEngine, moPhong, moPhongThucTe, lenhChoThucTe, thongKe, tb, f, kyOf, TEN_KY } from "./backtestChung.mjs";

const cache = docJson(process.argv[2] || "nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, lenhMuaMoi, soMa } = chayEngine({ cache, vni });
const HAI_TP = { ten: "30/30 + chay", moc: [{ w: 0.3, muc: "tp1" }, { w: 0.3, muc: "tp2" }] };
const GTGD = "GTGD TB20 (ty/phien)";
const RS = "Suc manh so voi VN-Index (RS 20 phien)";

// ---------- in bang ----------
const DAU = `${"".padEnd(52)} ${"n".padStart(5)} ${"laiTB".padStart(6)} ${"trungVi".padStart(7)} ${"thang%".padStart(6)} ${"PF".padStart(5)} | ${TEN_KY.map((k) => k.padStart(11)).join(" ")}`;
function dong(ten, ds, fn) {
  const kq = ds.map((t) => ({ t, r: fn(t) })).filter((x) => x.r != null && Number.isFinite(x.r));
  const k = thongKe(kq.map((x) => ({ ret: x.r, phien: 1 })));
  const ky = [0, 1, 2].map((j) => {
    const a = kq.filter((x) => kyOf(x.t.ngay) === j).map((x) => x.r);
    return a.length ? `${f(tb(a))} (${a.length})` : "-";
  });
  console.log(`${ten.padEnd(52)} ${String(k.n).padStart(5)} ${f(k.tb).padStart(6)} ${f(k.trungVi).padStart(7)} ${f(k.thang, 1).padStart(6)} ${f(k.pf).padStart(5)} | ${ky.map((v) => v.padStart(11)).join(" ")}`);
  return k;
}

// ---------- cac cach vao lenh ----------
const coPhienSau = (t) => t.iv + 1 < t.n;
const VAO = {
  moc: (t, o = {}) => moPhongThucTe(t, { ...o, E: t.E, vao: t.iv, banTu: t.iv + 2 }),
  atc: (t, o = {}) => moPhongThucTe(t, { ...o, E: t.close[t.iv], vao: t.iv, banTu: t.iv + 2 }),
  moCua: (t, o = {}) => (coPhienSau(t) ? moPhongThucTe(t, { ...o, E: t.open[t.iv + 1], vao: t.iv + 1, banTu: t.iv + 3 }) : null),
  // Chi mua mo cua phien sau khi gia mo cua con trong VUNG MUA (khong cao hon gia vao cua he thong qua x%) - cao hon thi bo lenh (khong duoi gia).
  moCuaTrongVung: (x) => (t, o = {}) => (coPhienSau(t) && t.open[t.iv + 1] <= t.E * (1 + x / 100) ? moPhongThucTe(t, { ...o, E: t.open[t.iv + 1], vao: t.iv + 1, banTu: t.iv + 3 }) : null),
  cho: (x, N) => (t, o = {}) => lenhChoThucTe(t, x, N, o),
};

// ================= A. LENH MUA =================
const TEN_LOAI = { 1: "Mua thuong", 2: "Mua lai", 3: "Mua muon" };
console.log(`\n${soMa} ma, ${tatCa.length} lenh Mua (${Object.entries(TEN_LOAI).map(([k, v]) => `${v} ${tatCa.filter((t) => t.loai === Number(k)).length}`).join(", ")}), ${lenhMuaMoi.length} lenh Mua moi.`);
console.log("Cach chot: 30% TP1 + 30% TP2 + 40% giu den BAN / cat lo / hoa von sau TP2. Chi phi 0,4%. Cot giai doan: lai TB (so lenh).");
const muaThuong = tatCa.filter((t) => t.loai === 1);
console.log(`\n=== A. LENH MUA THUONG (vao o moc chuyen mua) ===\n${DAU}`);
dong("Backtest cu: vao o moc, ban tu T+1", muaThuong, (t) => moPhong(t, HAI_TP)?.ret);
dong("Vao o moc (mua dung luc vuot moc) + T+2", muaThuong, VAO.moc);
dong("Mua ATC gia dong cua phien tin hieu + T+2", muaThuong, VAO.atc);
dong("Mua mo cua phien sau + T+2", muaThuong, VAO.moCua);
dong("Mua mo cua phien sau neu <= moc +1% (khong thi bo)", muaThuong, VAO.moCuaTrongVung(1));
dong("Mua mo cua phien sau neu <= moc +2% (khong thi bo)", muaThuong, VAO.moCuaTrongVung(2));
dong("Dat lenh cho o moc +1%, hieu luc 3 phien", muaThuong, VAO.cho(1, 3));
for (const loai of [2, 3]) {
  const ds = tatCa.filter((t) => t.loai === loai);
  console.log(`\n=== A${loai}. LENH ${TEN_LOAI[loai].toUpperCase()} (gia vao he thong = dong cua phien tin hieu) ===\n${DAU}`);
  dong("Mua ATC gia dong cua phien tin hieu + T+2", ds, VAO.atc);
  dong("Mua mo cua phien sau + T+2", ds, VAO.moCua);
  dong("Mua mo cua phien sau neu <= gia he thong +1%", ds, VAO.moCuaTrongVung(1));
}

// ================= B. LENH MUA MOI =================
// Lenh mua moi dong CUNG lenh dau (dongTai = jGoc) hoac cham cat lo rieng; khong theo tin hieu BAN rieng (tin hieu BAN da lam lenh dau dong).
const MM = { dongTai: null, theoTinHieuBan: false };
const mm = (fn, them = {}) => (t) => fn(t, { ...MM, dongTai: t.jGoc, ...them });
console.log(`\n=== B. LENH MUA MOI (dot sau, danh cho nguoi lo lenh dau) ===\n${DAU}`);
dong("Kieu engine: giu den cat lo rieng / lenh dau dong, ATC", lenhMuaMoi, mm(VAO.atc, { moc: [], baoVe: false }));
dong("30/30 + chay (TP rieng), mua ATC + T+2", lenhMuaMoi, mm(VAO.atc));
dong("30/30 + chay (TP rieng), mua mo cua phien sau + T+2", lenhMuaMoi, mm(VAO.moCua));
dong("30/30 + chay, mo cua phien sau neu <= gia he thong +1%", lenhMuaMoi, mm(VAO.moCuaTrongVung(1)));
console.log("  So sanh: nguoi lo lenh dau ma DUOI mua lenh Mua thuong o phien sau (dong 'Mua mo cua phien sau + T+2' o phan A).");

// ================= C. BO LOC THANH KHOAN + RS =================
const LOC = [
  ["Khong loc", () => true],
  ["GTGD TB20 >= 5 ty", (t) => t.dacTrung[GTGD] >= 5],
  ["GTGD TB20 >= 10 ty", (t) => t.dacTrung[GTGD] >= 10],
  ["GTGD TB20 >= 20 ty", (t) => t.dacTrung[GTGD] >= 20],
  ["RS > 0 (manh hon VN-Index 20 phien)", (t) => t.dacTrung[RS] > 0],
  ["RS 0..10 (manh hon nhung chua chay qua xa)", (t) => t.dacTrung[RS] > 0 && t.dacTrung[RS] <= 10],
  ["RS > 10", (t) => t.dacTrung[RS] > 10],
  ["GTGD >= 10 ty va RS > 0", (t) => t.dacTrung[GTGD] >= 10 && t.dacTrung[RS] > 0],
  ["GTGD >= 10 ty va RS 0..10", (t) => t.dacTrung[GTGD] >= 10 && t.dacTrung[RS] > 0 && t.dacTrung[RS] <= 10],
  ["GTGD 5..60 ty va RS 0..10", (t) => t.dacTrung[GTGD] >= 5 && t.dacTrung[GTGD] <= 60 && t.dacTrung[RS] > 0 && t.dacTrung[RS] <= 10],
];
for (const [tenCach, ds, fn] of [
  ["Mua thuong, mo cua phien sau neu <= moc +1%", muaThuong, VAO.moCuaTrongVung(1)],
  ["Mua thuong, mua ATC", muaThuong, VAO.atc],
  ["Mua moi, 30/30 + chay, mua ATC", lenhMuaMoi, mm(VAO.atc)],
]) {
  console.log(`\n=== C. BO LOC THANH KHOAN + RS - ${tenCach} ===\n${DAU}`);
  for (const [tenLoc, loc] of LOC) dong(tenLoc, ds.filter(loc), fn);
}
