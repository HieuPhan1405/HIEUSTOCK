// BACKTEST GOP 2 LUAT (Hieu hoi 2026-10-19): (1) LUAT VAO: bo lenh Mua thuong khi vol nhip chinh truoc phien tin hieu >= 1,2 (nhip chinh = tu dinh 20 nen toi truoc phien tin hieu, relVol TB);
// (2) LUAT THOAT "B": sau TP1, dong cua < Kijun VA vol TB nhip chinh tu dinh toi hom nay >= 1,0 -> ban het o gia dong cua; vol be thi giu, chi con san trailing 25% tu dinh (thay hoa von).
// Do DANH MUC (K vi the, xep ngau nhien 40 lan, von chia deu 1/K) va thong ke tung lenh. Hai kieu vao: "o moc" (nhu cac backtest truoc - gia vao = moc chuyen mua cua engine, thien lech lac quan)
// va "ATC + T+2" (mua gia dong cua phien tin hieu, chi ban tu T+2 - sat thuc te hon). Chi phi 0,4%/lenh. Chi DOC cache (nen_dai.json + vnindex_dai.json).
// CACH CHAY: node engine/dich-vu/backtestGopHaiLuat.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf, TEN_KY } from "./backtestChung.mjs";
import { mo, nhipChinh } from "./moBaoVeLai.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, soMa } = chayEngine({ cache, vni });
const ds = tatCa.filter((t) => t.loai === 1);
const SO_LAN = 40;
const NGUONG_VAO = 1.2;
const locVao = (t) => { const nc = nhipChinh(t, 20); return !nc || nc.vol < NGUONG_VAO; }; // thieu du lieu thi giu lenh
const giuVao = ds.filter(locVao).length;

const B = { chinh: { duong: "kijun", k: 1.0 }, batDau: "tp1", pct: 25, khongSan: true };
const BV15 = { batDau: "tp1", pct: 15, khongSan: true };
const CACH = [
  ["HIEN TAI (hoa von sau TP2)", {}, false],
  ["Chi loc vao (bo khi vol chinh >= 1.2)", {}, true],
  ["Chi thoat B (Kijun + vol chinh >= 1.0, san 25%)", B, false],
  ["GOP: loc vao + thoat B", B, true],
  ["Tham chieu: bvRong 15% tu dinh (cong tac co san)", BV15, false],
  ["Tham chieu: loc vao + bvRong 15%", BV15, true],
];

for (const [tenKieu, atc] of [["VAO O MOC CHUYEN MUA (nhu cac backtest truoc)", false], ["VAO ATC (gia dong cua phien tin hieu) + T+2", true]]) {
  console.log(`\n=========== ${tenKieu}: ${ds.length} lenh Mua thuong (${soMa} ma), loc vao giu ${giuVao} (${((giuVao / ds.length) * 100).toFixed(0)}%) ===========`);
  console.log("Cach".padEnd(52), "n".padStart(5), "laiTB".padStart(6), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "l/phien".padStart(8), "| giai doan (<2019 | 19-22.4 | 22.5+)".padStart(36), "| DM K=10".padStart(13), "K=20".padStart(10), "K=30".padStart(10));
  for (const [ten, cfg, loc] of CACH) {
    const kqs = ds.map((t) => mo(t, { ...cfg, atc }));
    const giu = ds.map((t, i) => ({ t, r: kqs[i] })).filter((x) => x.r && (!loc || locVao(x.t)));
    const k = thongKe(giu.map((x) => x.r));
    const ky = [0, 1, 2].map((j) => tb(giu.filter((x) => kyOf(x.t.ngay) === j).map((x) => x.r.ret)));
    const dm = (K) => danhMucNhieuLan(kqs, ds, K, SO_LAN, loc ? { loc: locVao } : {});
    const d10 = dm(10), d20 = dm(20), d30 = dm(30);
    console.log(ten.padEnd(52), String(k.n).padStart(5), f(k.tb).padStart(6), f(k.thang, 1).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), f(k.laiMoiPhien, 3).padStart(8), "|", ky.map((x) => f(x).padStart(6)).join(" "), `| ${f(d10.cagr, 1)}%/${f(d10.sut, 0)}%`.padStart(13), `${f(d20.cagr, 1)}%/${f(d20.sut, 0)}%`.padStart(10), `${f(d30.cagr, 1)}%/${f(d30.sut, 0)}%`.padStart(10));
  }
}
console.log(`\n(danh muc: CAGR/sut von toi da; ${TEN_KY.join(" | ")}; "loc vao" bo lenh luc DANG GIU danh muc thi bo luon, von dung cho lenh khac)`);
