// Test tay cho lib/homily.js. Chay: node engine/test/homily.test.mjs
import { existsSync, readFileSync } from "node:fs";
import { emaTdx, sma1, forcast, homilyDE, homilyTE, homilyKDJ, homilyThaoBan, diemCat, DE_KHOI_DAU } from "../../lib/homily.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => a != null && b != null && Math.abs(a - b) < e;

// EMA kieu Tongdaxin: nen dau = gia tri dau, he so 2/(n+1)
const e = emaTdx([1, 2, 3], 3);
ok("EMA Tongdaxin: nen dau = gia tri dau, nen 2 = 1 + 0.5*(2-1) = 1.5, nen 3 = 2.25", gan(e[0], 1) && gan(e[1], 1.5) && gan(e[2], 2.25), JSON.stringify(e));
ok("EMA chuoi hang so = hang so", emaTdx(new Array(20).fill(7), 5).every((v) => gan(v, 7)));

// SMA(X,N,1)
const s = sma1([10, 20], 3);
ok("SMA(X,3,1): (20 + 2*10)/3 = 13.333", gan(s[1], 40 / 3), s[1]);

// FORCAST = diem cuoi duong hoi quy: so voi cach tinh tay (binh phuong toi thieu)
function hoiQuyTay(y) {
  const n = y.length;
  const xs = y.map((_, i) => i);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  const b = xs.reduce((a, x, i) => a + (x - mx) * (y[i] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  return my + b * (n - 1 - mx);
}
const mau = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9];
const f = forcast(mau, 6);
ok("FORCAST: 5 nen dau null", f.slice(0, 5).every((v) => v === null) && f[5] != null);
ok("FORCAST khop hoi quy tinh tay (nhieu diem)", [5, 9, 14].every((i) => gan(f[i], hoiQuyTay(mau.slice(i - 5, i + 1)), 1e-9)), JSON.stringify([f[5], hoiQuyTay(mau.slice(0, 6))]));
ok("FORCAST duong thang tang deu = chinh no", gan(forcast([1, 2, 3, 4, 5, 6, 7], 6)[6], 7));

// DE
const gia = Array.from({ length: 120 }, (_, i) => 100 + Math.sin(i / 5) * 8 + i * 0.1);
const de = homilyDE(gia);
ok("DE: do dai bang dau vao, nhung nen khoi dau null", de.tw.length === gia.length && de.tw.slice(0, DE_KHOI_DAU).every((v) => v === null) && de.tw[DE_KHOI_DAU] != null);
ok("DE: nen do <=> towerc >= phien truoc", de.len.every((u, i) => i === 0 || de.tw[i] == null || de.tw[i - 1] == null || u === (de.tw[i] >= de.tw[i - 1])));
ok("DE chuoi hang so = 0 (khong co dong tien)", homilyDE(new Array(80).fill(10)).tw.slice(DE_KHOI_DAU).every((v) => gan(v, 0, 1e-9)));
const giam = homilyDE(Array.from({ length: 100 }, (_, i) => 100 - i * 0.5)).tw;
const tang = homilyDE(Array.from({ length: 100 }, (_, i) => 100 + i * 0.5)).tw;
ok("DE dac biet: he so b cong lai bang 0 nen khong phu thuoc muc gia, chuoi doi xung -> gia tri doi dau (tang +7,5 / giam -7,5)", gan(tang[99], -giam[99], 1e-6) && gan(tang[99], 7.5, 1e-3), `${tang[99]} ${giam[99]}`);
ok("DE dich len/xuong 1 hang so khong doi", gan(homilyDE(gia.map((v) => v + 50)).tw[100], de.tw[100], 1e-6));

// DOI CHIEU VOI PHAN MEM HOMILY: PLX 20/11/2026 hien -2,987 (anh livestream)
const duongNen = new URL("../output/nen_gan.json", import.meta.url);
if (existsSync(duongNen)) {
  const plx = JSON.parse(readFileSync(duongNen, "utf8")).PLX;
  if (plx && plx.at(-1)?.t === "2026-11-20") {
    const d = homilyDE(plx.map((b) => b.c));
    ok("DE cua PLX 20/11/2026 = -2,987 (dung so tren phan mem Homily)", Math.abs(d.tw.at(-1) - -2.987) < 0.0006, d.tw.at(-1));
  } else console.log("bo qua: nen_gan.json khong con PLX 20/11/2026");
}

// TE
const o = gia.map((v) => v - 0.5);
const h = gia.map((v) => v + 1);
const l = gia.map((v) => v - 1);
const te = homilyTE(o, h, l, gia);
ok("TE: 7 duong + nen thap, cung do dai", te.duong.length === 7 && te.duong.every((d) => d.length === gia.length) && te.thap.length === gia.length);
ok("TE: chuoi hang so -> thap = hang so", gan(homilyTE(new Array(60).fill(5), new Array(60).fill(5), new Array(60).fill(5), new Array(60).fill(5)).thap[59], 5));

// KDJ
const kdj = homilyKDJ(h, l, gia);
ok("KDJ: J = 3K - 2D", kdj.j.every((v, i) => gan(v, 3 * kdj.k[i] - 2 * kdj.d[i])));
ok("KDJ: gia dong cua = cao nhat 9 phien -> RSV 100 -> K tien gan 100", homilyKDJ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).k[11] > 90);

// Thao ban
const tb = homilyThaoBan(o, h, l, gia);
ok("操盘王: hai duong cung do dai", tb.b.length === gia.length && tb.d.length === gia.length);

// diemCat
const c = diemCat([1, 2, 3, 2, 1], 2);
ok("diemCat: cat len 2 o index 2, cat xuong 2 o index 4", c.len.join() === "2" && c.xuong.join() === "4", JSON.stringify(c));
const c2 = diemCat([1, 3, 3, 1], [2, 2, 2, 2]);
ok("diemCat hai mang: len index 1, xuong index 3", c2.len.join() === "1" && c2.xuong.join() === "3", JSON.stringify(c2));
ok("diemCat bo qua null", diemCat([null, 1, 3], 2).len.join() === "2");

console.log(loi ? `\n${loi} LOI` : "\nTAT CA DAT");
process.exit(loi ? 1 : 0);
