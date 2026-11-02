// SINH lib/tamLyLichSuDuLieu.js: chuoi NGAY cua "tam ly thi truong" (xap xi 3 ty le breadth) + dong cua VN-Index tu 2013, cho bieu do lich su tren Dashboard.
// Chi so = TB cong cua: % ma tang gia, % ma tren Kijun, % ma tren duong can bang dai han (gg_top), tinh tren cac ma DANG niem yet trong nen_dai.json (thien lech nguoi song sot).
// Web dung them ty le thu 4 (% ma dat diem MUA) - khong dung lai duoc cho qua khu, nen gia tri hom nay tren dong ho co the lech vai diem so voi duong nay.
// Chay lai moi tuan / khi engine cap nhat nen_dai.json:  node scripts/capNhatTamLyLichSu.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { tinhIchimoku, tinhCanBang } from "../lib/chiBaoKyThuat.js";

const doc = (f) => JSON.parse(readFileSync(new URL(`../engine/output/${f}`, import.meta.url), "utf8"));
const vni = doc("vnindex_dai.json");
const nenDai = doc("nen_dai.json");
const ngay = vni.map((b) => b.t);
const idx = new Map(ngay.map((t, i) => [t, i]));
const N = ngay.length;
const z = () => new Float64Array(N);
const d = { tang: z(), tongTang: z(), kj: z(), tongKj: z(), cb: z(), tongCb: z() };
for (const bars of Object.values(nenDai)) {
  if (bars.length < 200) continue;
  const ich = tinhIchimoku(bars);
  const cb = tinhCanBang(bars);
  for (let k = 1; k < bars.length; k++) {
    const i = idx.get(bars[k].t);
    if (i == null) continue;
    d.tongTang[i]++;
    if (bars[k].c > bars[k - 1].c) d.tang[i]++;
    const kj = ich.kijun[k];
    if (kj > 0) { d.tongKj[i]++; if (bars[k].c > kj) d.kj[i]++; }
    const top = cb.top[k];
    if (top > 0) { d.tongCb[i]++; if (bars[k].c > top) d.cb[i]++; }
  }
}
const t = [], s = [], v = [];
for (let i = 0; i < N; i++) {
  if (d.tongTang[i] < 150 || d.tongKj[i] < 150 || d.tongCb[i] < 150) continue;
  t.push(ngay[i]);
  s.push(+(((d.tang[i] / d.tongTang[i] + d.kj[i] / d.tongKj[i] + d.cb[i] / d.tongCb[i]) * 100) / 3).toFixed(1));
  v.push(+vni[i].c.toFixed(1));
}
const out =
  `// FILE DUOC TAO TU DONG boi scripts/capNhatTamLyLichSu.mjs (khong sua tay). Tam ly thi truong (TB 3 ty le breadth) + VN-Index theo ngay, ${t[0]} -> ${t.at(-1)}.\n` +
  `export const TAM_LY_LICH_SU = ${JSON.stringify({ t, s, v })};\n`;
writeFileSync(new URL("../lib/tamLyLichSuDuLieu.js", import.meta.url), out);
console.log(`da ghi ${t.length} ngay, ${t[0]} -> ${t.at(-1)}; cuoi: S=${s.at(-1)}, VNI=${v.at(-1)}; ${(out.length / 1024).toFixed(0)}KB`);
