// BACKTEST "SAU KHI CHAM TP2, GIA PHA XUONG TENKAN / KIJUN THI BAN HET" (Hieu hoi 2026-10-19: cho ve gia von - bao ve hoa von - hoi sau):
// luat hien tai: TP1 30% + TP2 30%, 40% con lai giu den tin hieu BAN, sau TP2 cat lo phan con lai ve GIA VAO (hoa von). O day them dieu kien: da cham TP2 roi,
// neu dong cua < Tenkan (hoac < Kijun, hoac < ca hai duong) thi ban not phan con lai o gia dong cua nen do. Cac cach thoat con lai (Stop-loss, tin hieu BAN, hoa von) giu nguyen.
// Tren cac lenh "Mua thuong" (loai 1, ~11 nam: nen_dai.json + vnindex_dai.json), chi phi 0,4%/lenh da tru. Chi DOC cache, khong dung mang.
// "Pha" o day = DONG CUA nen duoi duong (khong phai cham trong phien) - cung quy uoc moPhong() trong backtestChung.mjs va cach web ra lenh (cua so 10:30-11:30 / 14:00-14:45).
// CACH CHAY: node engine/dich-vu/backtestThoatSauTP2.mjs [tenTepCache=nen_dai.json]
import { docJson, chayEngine, moPhong, thongKe, danhMucNhieuLan, tb, f, kyOf, TEN_KY } from "./backtestChung.mjs";

const cache = docJson(process.argv[2] || "nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, soMa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
for (const t of lenh) {
  t.tkMax = t.tenkan.map((x, i) => (x == null || t.kijun[i] == null ? null : Math.max(x, t.kijun[i])));
  t.tkMin = t.tenkan.map((x, i) => (x == null || t.kijun[i] == null ? null : Math.min(x, t.kijun[i])));
}
const SO_LAN = 40;
const HAI = [{ w: 0.3, muc: "tp1" }, { w: 0.3, muc: "tp2" }];
const sauTP2 = (duong, soNen = 1) => ({ theoKijunSau: 1, chay: { duong, soNen } });

const CACH = [
  { ten: "HIEN TAI: 30/30 + 40% chay, hoa von sau TP2", moc: HAI },
  { ten: "Sau TP2: dong cua < Tenkan -> ban het", moc: HAI, ...sauTP2("tenkan") },
  { ten: "Sau TP2: dong cua < Kijun -> ban het", moc: HAI, ...sauTP2("kijun") },
  { ten: "Sau TP2: dong cua < Tenkan HOAC Kijun (duong cao hon)", moc: HAI, ...sauTP2("tkMax") },
  { ten: "Sau TP2: dong cua < CA Tenkan VA Kijun (duong thap hon)", moc: HAI, ...sauTP2("tkMin") },
  { ten: "Sau TP2: 2 nen dong < Tenkan", moc: HAI, ...sauTP2("tenkan", 2) },
  { ten: "Sau TP2: 2 nen dong < Kijun", moc: HAI, ...sauTP2("kijun", 2) },
  { ten: "Sau TP2: 2 nen dong < Tenkan HOAC Kijun", moc: HAI, ...sauTP2("tkMax", 2) },
];

const TAP = [
  ["A. Tat ca lenh Mua thuong", () => true],
  ["B. Chi lenh DA CHAM TP2 (noi dieu kien moi co tac dung)", null],
];

// lenh da cham TP2 = ket qua baseline co phan nao ban o TP2 -> xac dinh bang moPhong voi cach hien tai: dung cach "tp2 xong" bang cach chay lai voi moc TP2 w=1 (khong can) - don gian: lay cac lenh co high >= TP2 truoc khi thoat.
const chamTP2 = (t) => {
  const kq = moPhong(t, CACH[0]);
  if (!kq) return false;
  for (let i = t.iv + 1; i <= kq.jThoat; i++) if (t.high[i] >= t.tp[1]) return true;
  return false;
};

for (const [tenTap, fn] of TAP) {
  const ds = lenh.filter(fn ?? chamTP2);
  console.log(`\n=========== Tap ${tenTap}: n = ${ds.length} (${soMa} ma) ===========`);
  console.log("Cach thoat".padEnd(58), "lai TB".padStart(7), "midian".padStart(7), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "lai/phien".padStart(9), "| lai TB theo giai doan".padStart(36), "| DM K=10".padStart(12), "K=20".padStart(9), "| doi thoat (%)");
  for (const c of CACH) {
    const kqs = ds.map((t) => moPhong(t, c));
    const ok = kqs.filter(Boolean);
    const k = thongKe(ok);
    const ky = [[], [], []];
    ds.forEach((t, i) => {
      if (kqs[i]) ky[kyOf(t.ngay)].push(kqs[i].ret);
    });
    const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {});
    const d20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, {});
    const doiThoat = ok.filter((x) => x.lyDo === 4).length;
    console.log(
      c.ten.padEnd(58), f(k.tb).padStart(7), f(k.trungVi).padStart(7), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), f(k.laiMoiPhien, 3).padStart(9), "|",
      ky.map((a) => `${f(tb(a)).padStart(5)}(${a.length})`).join(" "), `| ${f(d10.cagr, 1)}%/${f(d10.sut, 0)}%`, `${f(d20.cagr, 1)}%/${f(d20.sut, 0)}%`, `| ${((doiThoat / ok.length) * 100).toFixed(0)}`
    );
  }
  console.log(`(giai doan: ${TEN_KY.join(" | ")})`);
}
