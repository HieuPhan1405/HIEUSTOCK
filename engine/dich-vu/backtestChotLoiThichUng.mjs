// CHOT LOI THICH UNG THEO MFE (quy luat thay cho % co dinh): moc chot = phan vi cua MFE (muc lai lon nhat trong 20 phien) cua cac lenh he thong DA KET THUC truoc ngay vao lenh nay (khong nhin truoc):
//   moc 1 = trung vi MFE (nua so lenh tung cham), moc 2 = phan vi 70 (~30% lenh tung cham); ban 40% o moc 1, 40% o moc 2, con lai Tenkan 1/2 + Kijun not (+ BAN, cat lo S).
// So voi: co dinh +5/+10, TP1/TP2 engine 40/40, TK3 hien tai. Cua so = N lenh gan nhat da ket thuc (mac dinh 400 ~ 1 nam). Lenh Mua thuong, nen_dai.json, phi 0,4%.
// Chay: node engine/dich-vu/backtestChotLoiThichUng.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1).sort((a, b) => (a.ngay < b.ngay ? -1 : a.ngay > b.ngay ? 1 : 0));
// MFE moi lenh (vao mo cua phien sau, den cat lo / 20 phien)
for (const t of lenh) {
  const vao = t.iv + 1, E = t.open[vao];
  let mfe = 0;
  if (E > 0 && t.S < E) for (let j = vao; j < Math.min(t.n, vao + 20); j++) { if (j > vao && t.low[j] <= t.S) break; mfe = Math.max(mfe, t.high[j] / E - 1); if (t.low[j] <= t.S) break; }
  t.mfe = mfe * 100;
  t.ngayXong = t.ngayArr[Math.min(t.n - 1, vao + 20)];
}
const pc = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * q))]; };
const N = Number(process.env.CUA_SO || 400);
// moc thich ung cho tung lenh: tu cac lenh da xong (ngayXong < ngay lenh nay), N gan nhat
let con = 0;
const daXong = [];
const hang = [...lenh].sort((a, b) => (a.ngayXong < b.ngayXong ? -1 : 1));
for (const t of lenh) {
  while (con < hang.length && hang[con].ngayXong < t.ngay) daXong.push(hang[con++]);
  const gan = daXong.slice(-N);
  if (gan.length >= 100) {
    const m = gan.map((x) => x.mfe);
    t.q50 = Math.max(2, pc(m, 0.5));
    t.q70 = Math.max(t.q50 + 2, pc(m, 0.7 > 0 ? 0.7 : 0.7)); // phan vi 70 (~30% lenh tung cham)
  }
}
const ds0 = lenh.filter((t) => t.q50 != null);
console.log(`${ds0.length}/${lenh.length} lenh co moc thich ung (cua so ${N} lenh da xong). Trung vi moc 1: ${f(pc(ds0.map((t) => t.q50), 0.5))}%, moc 2: ${f(pc(ds0.map((t) => t.q70), 0.5))}% (range moc1 ${f(pc(ds0.map((t) => t.q50), 0.05))}..${f(pc(ds0.map((t) => t.q50), 0.95))}%)`);
const QUY_UOC = [["THUC TE", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })], ["LY TUONG", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })]];
const TAP = [["Toan bo (co moc)", () => true], ["Tu 2022.5", (t) => t.ngay >= "2022-05-01"], ["Rieng 2026", (t) => t.ngay >= "2026-01-01"]];
const co = { baoVe: true, theoSell: true, tk: "nua" };
const CACH = [
  ["TK3 hien tai (TP1/TP2 engine 30/30)", () => ({ moc: HAI_TP })],
  ["Engine TP1/TP2 40/40", () => ({ moc: [{ w: 0.4, i: 0 }, { w: 0.4, i: 1 }] })],
  ["CO DINH 40% @+5%, 40% @+10%", () => ({ moc: [{ w: 0.4, pct: 5 }, { w: 0.4, pct: 10 }] })],
  ["THICH UNG 40% @trung vi MFE, 40% @phan vi 70", (t) => ({ moc: [{ w: 0.4, pct: t.q50 }, { w: 0.4, pct: t.q70 }] })],
  ["THICH UNG 30% @trung vi, 30% @p70 (con lai 40%)", (t) => ({ moc: [{ w: 0.3, pct: t.q50 }, { w: 0.3, pct: t.q70 }] })],
  ["THICH UNG 50% @trung vi, 30% @p70", (t) => ({ moc: [{ w: 0.5, pct: t.q50 }, { w: 0.3, pct: t.q70 }] })],
];
for (const [tenQU, cfgVao] of QUY_UOC) {
  for (const [tenTap, loc] of TAP) {
    const ds = ds0.filter(loc);
    console.log(`\n=========== ${tenQU} | ${tenTap}: n = ${ds.length} ===========`);
    console.log("Mau chot loi".padEnd(52), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "| DM K=10 lai/nam, sut | DM K=20");
    for (const [ten, fc] of CACH) {
      const kqs = ds.map((t) => mp(t, { ...co, ...fc(t), ...cfgVao(t) }));
      const k = thongKe(kqs.filter(Boolean));
      const d10 = danhMucNhieuLan(kqs, ds, 10, 20, {});
      const d20 = danhMucNhieuLan(kqs, ds, 20, 20, {});
      console.log(ten.padEnd(52), f(k.tb).padStart(7), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), `| ${f(d10.cagr, 1).padStart(6)}%/${f(d10.sut, 0).padStart(2)}% | ${f(d20.cagr, 1).padStart(6)}%/${f(d20.sut, 0)}%`);
    }
  }
}
