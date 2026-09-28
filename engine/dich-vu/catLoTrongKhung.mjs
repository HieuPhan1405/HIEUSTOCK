// CAT LO TRONG KHUNG GIO: voi 1 lenh da biet gia mua / muc cat lo / TP, tu 1 ngay cho truoc, xem nen 5 phut (DNSE chart-api) tung phien:
//  - Chot 30% o TP1 / TP2 khi gia CHAM (bat ke gio - lenh cho san o gia TP); sau TP2 muc cat lo doi ve gia mua.
//  - Cat lo CHI khi gia <= muc cat lo TRONG khung gio vao lenh (10:30-11:30, 14:00-14:45); gia khop = gia mo nen 5 phut neu da mo duoi muc cat lo, con lai = muc cat lo.
// In ra ket qua (cat ngay nao / con giu). Dung de sua so lenh cu theo luat khung gio (28/09/2026).
// Chay: node engine/dich-vu/catLoTrongKhung.mjs GMD 2026-09-14 78.2 73.508 82.11 86.02 [daChamTP1]
import { KHUNG_VAO_LENH } from "../../lib/khungGioVaoLenh.js";

const [ma, tuNgay, giaMuaS, stopS, tp1S, tp2S, daTP1S] = process.argv.slice(2);
const giaMua = Number(giaMuaS);
let stop = Number(stopS);
const tp1 = Number(tp1S);
const tp2 = Number(tp2S);
let daTP1 = daTP1S === "TP1" || daTP1S === "TP2";
let daTP2 = daTP1S === "TP2";
if (daTP2) stop = giaMua;

const gioVN = (t) => new Date(t * 1000 + 7 * 3600e3).toISOString();
const from = Math.floor(Date.parse(`${tuNgay}T00:00:00+07:00`) / 1000);
const to = Math.floor(Date.now() / 1000);
const r = await (await fetch(`https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=${from}&to=${to}&symbol=${ma}&resolution=5`)).json();
const nen = r.t.map((t, i) => ({ luc: gioVN(t), o: r.o[i], h: r.h[i], l: r.l[i], c: r.c[i] }));
const trongKhung = (luc) => {
  const phut = Number(luc.slice(11, 13)) * 60 + Number(luc.slice(14, 16));
  return KHUNG_VAO_LENH.some((k) => phut >= k.tu && phut < k.den);
};

const suKien = [];
let dong = null;
for (const b of nen) {
  if (!daTP1 && tp1 > 0 && b.h >= tp1) {
    daTP1 = true;
    suKien.push(`${b.luc.slice(0, 16)} cham TP1 ${tp1} -> chot 30%`);
  }
  if (!daTP2 && tp2 > 0 && b.h >= tp2) {
    daTP1 = daTP2 = true;
    stop = giaMua;
    suKien.push(`${b.luc.slice(0, 16)} cham TP2 ${tp2} -> chot 30%, cat lo doi ve gia mua ${giaMua}`);
  }
  if (b.l <= stop) {
    if (trongKhung(b.luc)) {
      const gia = b.o <= stop ? b.o : stop;
      dong = { luc: b.luc.slice(0, 16), gia, lyDo: daTP2 ? "BAO_VE_LAI" : "CAT_LO" };
      break;
    }
    suKien.push(`${b.luc.slice(0, 16)} cham ${b.l} <= cat lo ${stop} NGOAI khung -> khong cat`);
  }
}
const phanConLai = 100 - (daTP1 ? 30 : 0) - (daTP2 ? 30 : 0);
console.log(`=== ${ma} mua ${giaMua} cat lo ${Number(stopS)} TP1 ${tp1} TP2 ${tp2} (tu ${tuNgay}, ${nen.length} nen 5 phut, den ${nen.at(-1)?.luc.slice(0, 16)})`);
for (const s of suKien.slice(0, 12)) console.log("   ", s);
if (suKien.length > 12) console.log(`    ... (${suKien.length - 12} dong nua)`);
if (dong) {
  const laiPhan = (dong.gia / giaMua - 1) * 100;
  const caLenh = (daTP1 ? 30 * (tp1 / giaMua - 1) * 100 : 0) / 100 + (daTP2 ? 30 * (tp2 / giaMua - 1) * 100 : 0) / 100 + (phanConLai / 100) * laiPhan;
  console.log(`  => ${dong.lyDo} TRONG KHUNG ${dong.luc} gia ${dong.gia} | phan con lai ${phanConLai}% ${laiPhan.toFixed(2)}% | ca lenh ${caLenh.toFixed(2)}%`);
} else console.log(`  => CHUA CAT (van giu) | da cham ${daTP2 ? "TP2" : daTP1 ? "TP1" : "-"} | cat lo hien tai ${stop} | gia gan nhat ${nen.at(-1)?.c}`);
