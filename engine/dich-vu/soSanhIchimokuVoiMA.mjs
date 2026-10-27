// SO SANH ICHIMOKU CUA HIEU VOI PHIEN BAN THAY BANG CAC DUONG MA (Hieu 27/10/2026: "so sanh ichimoku cua toi va thay = cac duong ma, xem co hieu qua bang khong").
// Ichimoku hien tai (engine/loi/ichimoku.js): Tenkan 9 / Kijun 17 = trung diem Donchian; Senkou B 33; may = max/min(Senkou A,B) ve truoc 26; can bang dai han 65 / 129 = trung diem Donchian. Moi bien the giu NGUYEN do dai, chi doi cach tinh duong:
//   G  = goc Ichimoku                       A = TAT CA bang SMA gia dong cua (SMA9, SMA17, Senkou A = (SMA9+SMA17)/2, Senkou B = SMA33 ve truoc 26, can bang SMA65/SMA129)     B = TAT CA bang EMA
//   C  = chi Tenkan/Kijun -> SMA (may + can bang giu goc)      D = chi may + can bang -> SMA (Tenkan/Kijun giu goc)      E = chi Tenkan/Kijun -> EMA      F = chi may + can bang -> EMA
// LUU Y CONG BANG: toan bo he thong (nguong diem vao, TP, cat lo, sanyaku...) duoc chinh cho Ichimoku; bien the MA KHONG duoc chinh lai nguong -> neu kem co the do nguong chua khop. Cung vi vay so lenh moi bien the khac nhau (in ra).
// Moi bien the: lenh Mua thuong cua engine, cach ra HT (30/30 + BAN) va KIJ (thung duong "Kijun" ban het; o bien the MA la MA17), quy uoc THUC TE (mua mo cua phien sau, ban tu T+2) va LY TUONG, co / khong loc d5 > 1%. Phi 0,4%.
// Chay: node engine/dich-vu/soSanhIchimokuVoiMA.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const chiSo = new Map(vni.map((b, i) => [b.t, i]));
const vc = vni.map((b) => b.c);
const BIEN_THE = [
  ["G Ichimoku goc", {}],
  ["A tat ca -> SMA", { kieuTenkanKijun: "sma", kieuMay: "sma", kieuCanBang: "sma" }],
  ["B tat ca -> EMA", { kieuTenkanKijun: "ema", kieuMay: "ema", kieuCanBang: "ema" }],
  ["C chi Tenkan/Kijun -> SMA", { kieuTenkanKijun: "sma" }],
  ["D chi may + can bang -> SMA", { kieuMay: "sma", kieuCanBang: "sma" }],
  ["E chi Tenkan/Kijun -> EMA", { kieuTenkanKijun: "ema" }],
  ["F chi may + can bang -> EMA", { kieuMay: "ema", kieuCanBang: "ema" }],
];
const CACH = [
  ["HT  (30/30 + BAN)", { moc: HAI_TP, baoVe: true, theoSell: true }],
  ["KIJ (thung duong Kijun ban het)", { moc: [], baoVe: false, theoSell: false, tk: "kijun" }],
];
const QUY_UOC = [["THUC TE", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })], ["LY TUONG", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })]];
const LOC = [["khong loc", () => true], ["d5 > 1%", (t) => t.d5 > 1]];
const SO_LAN = 20;
const KQ = [];
for (const [ten, tham] of BIEN_THE) {
  const t0 = Date.now();
  const { lenh } = chayEngine({ cache, vni, thamSoThem: tham });
  const ds = lenh.filter((t) => t.loai === 1);
  for (const t of ds) { const i = chiSo.get(t.ngay); t.d5 = i != null && i >= 5 ? (vc[i] / vc[i - 5] - 1) * 100 : null; }
  console.log(`[${ten}] ${ds.length} lenh Mua thuong (${Math.round((Date.now() - t0) / 1000)}s)`);
  KQ.push({ ten, ds });
}
for (const [tenQU, cvao] of QUY_UOC) {
  for (const [tenCach, cfg] of CACH) {
    for (const [tenLoc, loc] of LOC) {
      console.log(`\n=========== ${tenQU} | ${tenCach} | ${tenLoc} ===========`);
      console.log("Bien the".padEnd(30), "n".padStart(5), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "| giai doan (<2019, 19-22.4, 22.5+) | 2026 (n, lai) | DM K=10 / K=20");
      for (const { ten, ds: toanBo } of KQ) {
        const ds = [], kqs = [];
        for (const t of toanBo) { if (!loc(t)) continue; const r = mp(t, { ...cfg, ...cvao(t) }); if (r) { ds.push(t); kqs.push(r); } }
        const k = thongKe(kqs);
        const ky = [[], [], []];
        ds.forEach((t, i) => ky[kyOf(t.ngay)].push(kqs[i].ret));
        const r26 = ds.map((t, i) => (t.ngay >= "2026-01-01" ? kqs[i].ret : null)).filter((x) => x != null);
        const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {}), d20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, {});
        console.log(ten.padEnd(30), String(k.n).padStart(5), f(k.tb).padStart(7), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), "|", ky.map((a) => (a.length ? f(tb(a)) : "-").padStart(7)).join(" "), "|", `${String(r26.length).padStart(3)} ${f(tb(r26)).padStart(6)}`, `| ${f(d10.cagr, 1).padStart(5)}%/${f(d10.sut, 0).padStart(2)}% ${f(d20.cagr, 1).padStart(5)}%/${f(d20.sut, 0)}%`);
      }
    }
  }
}
