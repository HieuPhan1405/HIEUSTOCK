// TAM LY THI TRUONG < 20 CO BAO DAY KHONG? (Hieu 02/11/2026: bieu do "Tam ly thi truong & Ty trong", vung < 20 = "qua ban / hoang loan - co hoi gom hang tao day").
// Dung lai chi so tam ly bang BREADTH 3 ty le tu nen_dai.json (391 ma dang niem yet, TB cong cua: % ma tang, % ma tren Kijun, % ma tren duong can bang dai han (gg_top)); web dung them ty le thu 4
// (% ma dat diem MUA) - khong dung lai duoc cho qua khu nen day la CHI SO XAP XI. Kiem chung: su kien (lan dau < nguong sau >= 20 phien khong < nguong) -> loi suat VN-Index 5..60 phien sau,
// muc sut them (min close 20 / 60 phien sau), so voi MOI NGAY; ghep voi day that cua VN-Index; thu cac cach "timing" khac. HOC 2014-2021 | KIEM TRA 2022-2026.
// Chay: node engine/dich-vu/nghienCuuTamLyDay.mjs
import { docJson, tb, f } from "./backtestChung.mjs";
import { tinhIchimoku, tinhCanBang } from "../../lib/chiBaoKyThuat.js";

const vni = docJson("vnindex_dai.json");
const nenDai = docJson("nen_dai.json");
const ngay = vni.map((b) => b.t);
const idx = new Map(ngay.map((t, i) => [t, i]));
const vc = vni.map((b) => b.c);
const N = ngay.length;
const dem = { tang: new Float64Array(N), tongTang: new Float64Array(N), kj: new Float64Array(N), tongKj: new Float64Array(N), cb: new Float64Array(N), tongCb: new Float64Array(N), moi20: new Float64Array(N), tongMoi: new Float64Array(N) };
for (const bars of Object.values(nenDai)) {
  if (bars.length < 200) continue;
  const ich = tinhIchimoku(bars);
  const cb = tinhCanBang(bars);
  for (let k = 1; k < bars.length; k++) {
    const i = idx.get(bars[k].t);
    if (i == null) continue;
    dem.tongTang[i]++;
    if (bars[k].c > bars[k - 1].c) dem.tang[i]++;
    const kj = ich.kijun[k];
    if (kj > 0) { dem.tongKj[i]++; if (bars[k].c > kj) dem.kj[i]++; }
    const top = cb.top[k];
    if (top > 0) { dem.tongCb[i]++; if (bars[k].c > top) dem.cb[i]++; }
    if (k >= 20) { dem.tongMoi[i]++; let mn = Infinity; for (let q = k - 19; q <= k; q++) mn = Math.min(mn, bars[q].l); if (bars[k].l <= mn) dem.moi20[i]++; }
  }
}
const S = new Array(N).fill(null);
const moiThap = new Array(N).fill(null); // % ma cham day 20 phien (do "hoang loan" truc tiep)
for (let i = 0; i < N; i++) {
  if (dem.tongTang[i] >= 150 && dem.tongKj[i] >= 150 && dem.tongCb[i] >= 150) S[i] = (dem.tang[i] / dem.tongTang[i] + dem.kj[i] / dem.tongKj[i] + dem.cb[i] / dem.tongCb[i]) * (100 / 3);
  if (dem.tongMoi[i] >= 150) moiThap[i] = (dem.moi20[i] / dem.tongMoi[i]) * 100;
}
const bat = S.findIndex((x) => x != null);
console.log(`Chi so tam ly (3 ty le) co tu ${ngay[bat]}; hom nay (${ngay.at(-1)}): ${f(S.at(-1), 1)} | % ma tang ${f((dem.tang[N - 1] / dem.tongTang[N - 1]) * 100, 1)}, tren Kijun ${f((dem.kj[N - 1] / dem.tongKj[N - 1]) * 100, 1)}, tren can bang ${f((dem.cb[N - 1] / dem.tongCb[N - 1]) * 100, 1)}`);
const dsS = S.filter((x) => x != null);
console.log(`Phan bo: TB ${f(tb(dsS), 1)}; ngay < 20: ${dsS.filter((x) => x < 20).length}/${dsS.length} (${f((dsS.filter((x) => x < 20).length / dsS.length) * 100, 1)}%); < 10: ${dsS.filter((x) => x < 10).length}; < 15: ${dsS.filter((x) => x < 15).length}`);

// ---- RSI VN-Index 14
const rsi = new Array(N).fill(null);
{ let g = 0, l = 0; for (let i = 1; i < N; i++) { const d = vc[i] - vc[i - 1]; if (i <= 14) { if (d > 0) g += d; else l -= d; if (i === 14) { g /= 14; l /= 14; rsi[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); } } else { g = (g * 13 + Math.max(d, 0)) / 14; l = (l * 13 + Math.max(-d, 0)) / 14; rsi[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); } } }
const cbVni = tinhCanBang(vni.map((b) => ({ t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v ?? 0 })));

const HOR = [5, 10, 20, 40, 60];
const fwd = (i, h) => (i + h < N ? (vc[i + h] / vc[i] - 1) * 100 : null);
const sutThem = (i, h) => { if (i + 1 >= N) return null; let mn = Infinity; for (let k = i + 1; k <= Math.min(N - 1, i + h); k++) mn = Math.min(mn, vc[k]); return (mn / vc[i] - 1) * 100; };
const KY = (i) => (ngay[i] < "2022-01-01" ? "HOC" : "KT");
function thongKe(dsI, ten) {
  const o = {};
  for (const h of HOR) { const a = dsI.map((i) => fwd(i, h)).filter((x) => x != null); o[h] = { tb: tb(a), thang: a.length ? (a.filter((x) => x > 0).length / a.length) * 100 : NaN, n: a.length }; }
  const s20 = dsI.map((i) => sutThem(i, 20)).filter((x) => x != null), s60 = dsI.map((i) => sutThem(i, 60)).filter((x) => x != null);
  return { ten, n: dsI.length, o, s20: tb(s20), s60: tb(s60), s20xau: s20.filter((x) => x < -5).length / (s20.length || 1) * 100 };
}
const inDong = (r) => `${r.ten.padEnd(34)} n=${String(r.n).padStart(4)} | ` + HOR.map((h) => `${f(r.o[h].tb, 1).padStart(5)}%(${f(r.o[h].thang, 0)})`.padEnd(11)).join("") + `| sut them 20p ${f(r.s20, 1).padStart(5)}% 60p ${f(r.s60, 1).padStart(5)}% | >5% xau them(20p) ${f(r.s20xau, 0)}%`;
const hop = HOR.map((h) => `+${h}p TB(thang%)`.padEnd(11)).join("");
const tatCaNgay = []; for (let i = bat; i < N; i++) tatCaNgay.push(i);

// ---- su kien: lan dau S < nguong sau >= 20 phien khong < nguong
function suKien(dk, cooldown = 20) { const r = []; let cuoi = -1e9; for (let i = bat; i < N; i++) if (dk(i)) { if (i - cuoi >= cooldown) r.push(i); cuoi = i; } return r; }
console.log("\n=== (1) SU KIEN tam ly < nguong (lan dau sau 20 phien) vs MOI NGAY - loi suat VN-Index sau, % (thang%) ===");
console.log(" ".repeat(34) + "      | " + hop);
console.log(inDong(thongKe(tatCaNgay, "MOI NGAY (nen)")));
for (const nguong of [30, 25, 20, 15, 10]) {
  const ev = suKien((i) => S[i] != null && S[i] < nguong);
  console.log(inDong(thongKe(ev, `S < ${nguong} (lan dau)`)));
  console.log("   HOC:", inDong(thongKe(ev.filter((i) => KY(i) === "HOC"), "")).slice(34), "\n   KT: ", inDong(thongKe(ev.filter((i) => KY(i) === "KT"), "")).slice(34));
}
const moiNgayS20 = tatCaNgay.filter((i) => S[i] < 20);
console.log(inDong(thongKe(moiNgayS20, "MOI ngay co S < 20 (gop cum)")));

// ---- day that cua VN-Index
const dayThat = [];
for (let i = 60; i < N - 40; i++) {
  let ok = true;
  for (let k = i - 40; k <= i + 40; k++) if (k !== i && vc[k] < vc[i]) { ok = false; break; }
  if (!ok) continue;
  let dinh = -Infinity; for (let k = i - 60; k < i; k++) dinh = Math.max(dinh, vc[k]);
  const giam = (vc[i] / dinh - 1) * 100;
  if (giam <= -8) dayThat.push({ i, giam });
}
console.log(`\n=== (2) DAY THAT cua VN-Index (thap nhat +-40 phien, giam >= 8% tu dinh 60 phien): ${dayThat.length} day ===`);
console.log("ngay day       giam   S luc day | S nho nhat +-5p | lan dau S<20 truoc day (so phien) | S<20 vao luc day?");
let trung = 0;
for (const d of dayThat) {
  const a = Math.max(bat, d.i - 5), b = Math.min(N - 1, d.i + 5);
  let mn = Infinity; for (let k = a; k <= b; k++) if (S[k] != null) mn = Math.min(mn, S[k]);
  let truoc = null; for (let k = d.i; k >= Math.max(bat, d.i - 60); k--) if (S[k] != null && S[k] < 20) truoc = k;
  const sat = truoc != null ? d.i - truoc : null;
  if (mn < 20) trung++;
  console.log(`${ngay[d.i]}  ${f(d.giam, 1).padStart(6)}%  ${f(S[d.i], 1).padStart(6)}   |   ${f(mn, 1).padStart(6)}      | ${truoc != null ? `${ngay[truoc]} (${sat} phien truoc day)` : "khong co (S chua xuong < 20 trong 60p truoc)"}`);
}
const dayCoS = dayThat.filter((d) => d.i >= bat);
console.log(`Day that co S < 20 trong +-5 phien: ${trung}/${dayCoS.length}`);
const ev20 = suKien((i) => S[i] != null && S[i] < 20);
const gan = (i) => dayThat.some((d) => i >= d.i - 15 && i <= d.i + 5);
const hay = ev20.filter(gan).length;
console.log(`Su kien S<20: ${ev20.length}; trong do co day that trong [-15..+5 phien] quanh: ${hay} (${f((hay / ev20.length) * 100, 0)}%); sut them > 5% trong 20p sau: ${ev20.filter((i) => sutThem(i, 20) < -5).length}`);

// ---- (3) cac cach timing day
console.log("\n=== (3) CACH TIMING DAY (su kien, cooldown 20p) - HOC 2014-2021 | KT 2022-2026 ===");
const cua = [
  ["A. S < 20 (cach tren web)", (i) => S[i] != null && S[i] < 20],
  ["B. S < 15", (i) => S[i] != null && S[i] < 15],
  ["C. S < 10", (i) => S[i] != null && S[i] < 10],
  ["D. S bat len: tung < 15 trong 10p, nay cat len tren 20", (i) => { if (S[i] == null || S[i] < 20 || S[i - 1] == null || S[i - 1] >= 20) return false; for (let k = i - 10; k < i; k++) if (S[k] != null && S[k] < 15) return true; return false; }],
  ["E. S < 20 va VNI RSI14 < 35", (i) => S[i] != null && S[i] < 20 && rsi[i] < 35],
  ["F. S < 20 va VNI dong cua > dong cua 3p truoc", (i) => S[i] != null && S[i] < 20 && vc[i] > vc[i - 3]],
  ["G. S < 20 va >= 15% ma cham day 20 phien", (i) => S[i] != null && S[i] < 20 && moiThap[i] >= 15],
  ["H. >= 25% ma cham day 20 phien (hoang loan truc tiep)", (i) => moiThap[i] != null && moiThap[i] >= 25],
  ["I. S < 20 va VNI duoi can bang dai han", (i) => S[i] != null && S[i] < 20 && cbVni.bot[i] > 0 && vc[i] < cbVni.bot[i]],
  ["J. S < 20 va VNI TREN can bang dai han", (i) => S[i] != null && S[i] < 20 && cbVni.bot[i] > 0 && vc[i] >= cbVni.bot[i]],
];
console.log(" ".repeat(34) + "      | " + hop);
for (const [ten, dk] of cua) {
  const ev = suKien(dk);
  const t = ten.slice(0, 33);
  console.log(inDong(thongKe(ev, t)));
  console.log("   HOC:", inDong(thongKe(ev.filter((i) => KY(i) === "HOC"), "")).slice(34), "\n   KT: ", inDong(thongKe(ev.filter((i) => KY(i) === "KT"), "")).slice(34));
}
console.log("\nHom nay:", ngay.at(-1), "S =", f(S.at(-1), 1), "| ma cham day 20p", f(moiThap.at(-1), 1), "% | VNI RSI14", f(rsi.at(-1), 1), "| VNI vs can bang dai han", f((vc.at(-1) / cbVni.bot.at(-1) - 1) * 100, 1), "%");

// ---- (4) NEN theo giai doan + hom nay (ngay cuoi co du >=150 ma) + CHO XAC NHAN sau khi S < 20
const cuoiHopLe = (() => { for (let i = N - 1; i >= 0; i--) if (S[i] != null) return i; return -1; })();
console.log(`\nChi so tam ly xap xi moi nhat (${ngay[cuoiHopLe]}): ${f(S[cuoiHopLe], 1)}; ma cham day 20p ${f(moiThap[cuoiHopLe], 1)}%`);
console.log("\n=== (4a) NEN (moi ngay) theo giai doan: loi suat VN-Index sau, % ===");
for (const [ten, loc] of [["HOC 2014-2021", (i) => KY(i) === "HOC"], ["KT 2022-2026", (i) => KY(i) === "KT"]]) console.log(inDong(thongKe(tatCaNgay.filter(loc), `MOI NGAY ${ten}`)));

console.log("\n=== (4b) CHO XAC NHAN: sau khi S < 20 (su kien), trong 15 phien tiep theo, ngay dau tien thoa dieu kien -> mua o dong cua ngay do ===");
console.log("(so sanh voi mua ngay luc S < 20; 'cach day' = VN-Index luc mua cao hon day thap nhat 30 phien quanh do bao nhieu %)");
const xacNhan = [
  ["0. Mua NGAY khi S < 20", null],
  ["a. VNI dong cua > dinh dong cua 5 phien truoc", (i) => vc[i] > Math.max(...vc.slice(i - 5, i))],
  ["b. S tang 3 phien lien tiep", (i) => S[i] > S[i - 1] && S[i - 1] > S[i - 2] && S[i - 2] > S[i - 3]],
  ["c. S >= 25 (thoat vung hoang loan)", (i) => S[i] >= 25],
  ["d. VNI dong cua > MA10", (i) => { let s = 0; for (let k = i - 9; k <= i; k++) s += vc[k]; return vc[i] > s / 10; }],
];
for (const [ten, dk] of xacNhan) {
  const mua = [];
  for (const e of ev20) {
    if (!dk) { mua.push(e); continue; }
    for (let i = e + 1; i <= Math.min(N - 1, e + 15); i++) if (S[i] != null && dk(i)) { mua.push(i); break; }
  }
  const cach = mua.map((i) => { let mn = Infinity; for (let k = Math.max(0, i - 30); k <= Math.min(N - 1, i + 30); k++) mn = Math.min(mn, vc[k]); return (vc[i] / mn - 1) * 100; });
  const r = thongKe(mua, ten.slice(0, 33));
  console.log(inDong(r) + ` | cach day ${f(tb(cach), 1)}% | co xac nhan ${mua.length}/${ev20.length}`);
  const h = mua.filter((i) => KY(i) === "HOC"), k = mua.filter((i) => KY(i) === "KT");
  console.log("   HOC:", inDong(thongKe(h, "")).slice(34), "\n   KT: ", inDong(thongKe(k, "")).slice(34));
}
