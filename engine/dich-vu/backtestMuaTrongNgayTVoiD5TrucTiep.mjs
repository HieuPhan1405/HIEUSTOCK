// BACKTEST MUA NGAY TRONG PHIEN T, D5 TINH TRUC TIEP (Hieu 27/10/2026: "xet luon trong ngay T duoc ma, thu xem"). He thong that: tin hieu hien TRONG phien khi gia vuot moc E, mua trong khung gio -> o day mo phong
// mua NGAY NGAY T (khong cho T+1), thoi diem tin hieu = cuoi nen 1 gio dau tien cua ngay T co high >= E (nen_1h.json, 10/2023 -> nay). VN-Index 1H (vnindex_1h.json, DNSE index chart-api) cho d5 truc tiep.
// 3 cach tinh d5 (deu chi dung thong tin CO TAI THOI DIEM QUYET DINH): "truoc phien" = dong cua T-1 so voi dong cua T-6 | "truc tiep" = VN-Index cuoi cung nen 1H cung nen tin hieu so voi dong cua T-5 | "dong cua T" = dong cua T so voi T-5 (chi biet cuoi ngay - de doi chieu, KHONG dung duoc trong phien).
// 3 mo hinh gia vao: DUNG MOC E (ly tuong) | MOC + 0,5% | GIA DONG CUA NEN VUOT va chi mua neu cuoi nen van >= moc (loai vuot gia ngay trong nen). Cung tap lenh giua cac bo loc de so sanh cong bang.
// Quan ly lenh: vao = iv+1 (khong mo phong ngay T), ban duoc tu T+2 (chieu), phi 0,4%; cach ra T40 (40/40 engine + Tenkan 1/2 + Kijun not) va HT (30/30 + BAN). Chay: node engine/dich-vu/backtestMuaTrongNgayTVoiD5TrucTiep.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const doc = (ten) => JSON.parse(readFileSync(fileURLToPath(new URL(`../output/${ten}`, import.meta.url)), "utf-8"));
const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const h1 = doc("nen_1h.json");
const v1 = doc("vnindex_1h.json");
const ngayVN = (t) => new Date((t + 7 * 3600) * 1000).toISOString().slice(0, 10);
const chiSo = new Map(vni.map((b, i) => [b.t, i]));
const vc = vni.map((b) => b.c);
const v1Theo = new Map(); // "ngay|t" -> close VN-Index 1H
v1.t.forEach((t, i) => v1Theo.set(t, v1.c[i]));

const NGAY = new Map();
function nen1h(ma) {
  if (NGAY.has(ma)) return NGAY.get(ma);
  const x = h1[ma], m = new Map();
  if (x) {
    const daily = new Map(cache[ma].map((b) => [b.t, b]));
    const theoNgay = new Map();
    for (let i = 0; i < x.t.length; i++) {
      const d = ngayVN(x.t[i]);
      if (!theoNgay.has(d)) theoNgay.set(d, []);
      theoNgay.get(d).push({ t: x.t[i], h: x.h[i], l: x.l[i], c: x.c[i] });
    }
    for (const [d, bars] of theoNgay) {
      const dl = daily.get(d);
      if (!dl) continue;
      const k = dl.c / bars[bars.length - 1].c;
      if (!(k > 0.85 && k < 1.18)) continue;
      m.set(d, bars.map((b) => ({ ...b, h: b.h * k, l: b.l * k, c: b.c * k })));
    }
  }
  NGAY.set(ma, m);
  return m;
}

const { lenh: tatCa } = chayEngine({ cache, vni });
const goc = tatCa.filter((t) => t.loai === 1 && t.ngay >= "2023-10-18");
const lenh = [];
for (const t of goc) {
  const bars = nen1h(t.ma).get(t.ngay);
  const i = chiSo.get(t.ngay);
  if (!bars || i == null || i < 6) continue;
  const b = bars.findIndex((x) => x.h >= t.E);
  if (b < 0) continue;
  const vb = v1Theo.get(bars[b].t);
  if (vb == null) continue;
  t.baoNen = bars[b]; // nen vuot
  t.gioVuot = new Date((bars[b].t + 7 * 3600) * 1000).toISOString().slice(11, 16);
  t.d5Dong = (vc[i] / vc[i - 5] - 1) * 100;
  t.d5Truoc = (vc[i - 1] / vc[i - 6] - 1) * 100;
  t.d5TT = (vb / vc[i - 5] - 1) * 100;
  lenh.push(t);
}
console.log(`${goc.length} lenh Mua thuong tu 2023-10-18; co nen 1H + VN-Index 1H + nen vuot moc: ${lenh.length}`);
const gio = {};
for (const t of lenh) gio[t.gioVuot] = (gio[t.gioVuot] ?? 0) + 1;
console.log("Gio (dau nen) tin hieu vuot moc trong ngay T:", Object.entries(gio).sort().map(([k, v]) => `${k}: ${v}`).join(" | "));
const tuongQuan = (a, b) => { const n = a.length, ma = tb(a), mb = tb(b); let s = 0, sa = 0, sb = 0; for (let i = 0; i < n; i++) { s += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; } return s / Math.sqrt(sa * sb); };
console.log("Tuong quan d5 truc tiep voi d5 dong cua T:", f(tuongQuan(lenh.map((t) => t.d5TT), lenh.map((t) => t.d5Dong)), 2), "| d5 truoc phien voi d5 dong cua T:", f(tuongQuan(lenh.map((t) => t.d5Truoc), lenh.map((t) => t.d5Dong)), 2));

const MH = [
  ["Mua DUNG MOC E (ly tuong)", (t) => ({ E: t.E })],
  ["Mua MOC + 0,5%", (t) => ({ E: t.E * 1.005 })],
  ["Mua GIA DONG CUA NEN VUOT (chi neu cuoi nen >= moc)", (t) => (t.baoNen.c >= t.E ? { E: t.baoNen.c } : null)],
];
const BL = [
  ["Khong loc", () => true],
  ["d5 truoc phien > 0%", (t) => t.d5Truoc > 0],
  ["d5 truoc phien > 1%", (t) => t.d5Truoc > 1],
  ["d5 TRUC TIEP > 0%", (t) => t.d5TT > 0],
  ["d5 TRUC TIEP > 1%", (t) => t.d5TT > 1],
  ["d5 dong cua T > 1% (khong dung duoc trong phien)", (t) => t.d5Dong > 1],
];
const CACH = [
  ["T40 (40/40 + Tenkan 1/2 + Kijun not)", { moc: [{ w: 0.4, i: 0 }, { w: 0.4, i: 1 }], baoVe: true, theoSell: true, tk: "nua" }],
  ["HT  (30/30 + BAN)", { moc: HAI_TP, baoVe: true, theoSell: true }],
];
const SO_LAN = 20;
for (const [tenCach, cfgCach] of CACH) {
  for (const [tenMH, mh] of MH) {
    const cap = lenh.map((t) => { const c = mh(t); if (!c) return null; const r = mp(t, { ...cfgCach, vao: t.iv + 1, banTu: t.iv + 2, ...c }); return r ? { t, r } : null; }).filter(Boolean);
    console.log(`\n=========== ${tenCach} | ${tenMH} (${cap.length} lenh) ===========`);
    console.log("Bo loc".padEnd(50), "giu".padStart(5), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "| loai: n".padStart(10), "lai TB".padStart(7), "| 2023.10-25 | 2026 (n, lai) | DM K=10 / K=20");
    for (const [tenBL, fn] of BL) {
      const giu = cap.filter((x) => fn(x.t)), loai = cap.filter((x) => !fn(x.t));
      const kg = thongKe(giu.map((x) => x.r)), kl = thongKe(loai.map((x) => x.r));
      const ds = giu.map((x) => x.t), kqs = giu.map((x) => x.r);
      const a = giu.filter((x) => x.t.ngay < "2026-01-01").map((x) => x.r.ret), b = giu.filter((x) => x.t.ngay >= "2026-01-01").map((x) => x.r.ret);
      const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {}), d20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, {});
      console.log(tenBL.padEnd(50), String(kg.n).padStart(5), f(kg.tb).padStart(7), f(kg.thang, 0).padStart(7), f(kg.pf).padStart(5), "|", String(kl.n).padStart(6), f(kl.tb).padStart(7), "|", `${f(tb(a)).padStart(6)} (${a.length})`.padEnd(12), "|", `${String(b.length).padStart(3)} ${f(tb(b)).padStart(6)}`, `| ${f(d10.cagr, 1).padStart(5)}%/${f(d10.sut, 0).padStart(2)}% ${f(d20.cagr, 1).padStart(5)}%/${f(d20.sut, 0)}%`);
    }
  }
}
