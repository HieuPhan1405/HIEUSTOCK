// CANH GIA / THOI DIEM MUA 1 MA: voi nen hom nay gia dinh dong cua o cac muc gia khac nhau (trong bien do +-7% HOSE) -> gia nao ra MUA / dang cho phien sau / mat diem,
// va neu giu 1 muc gia thi cac phien sau (khong doi gia, khoi luong gia dinh) diem + tin hieu thay doi the nao (vd Tenkan cat len Kijun khi day cu roi khoi cua so).
// Nen (da dieu chinh) lay giong engine, VN-Index tu dchart; chi de THAM KHAO, khong co breadth nganh nen co the lech nhe so voi web.
// Chay: node engine/dich-vu/canhGiaMua.mjs ANV [--kl=1.0] [--giu=18.5] [--phien=5]
//   --kl   : khoi luong CA PHIEN hom nay (va cac phien gia dinh sau do) = kl x TB20 (mac dinh 1.0; trong phien khoi luong moi chay mot phan nen diem dong tien thap hon cuoi phien)
//   --giu  : muc gia giu nguyen cho cac phien sau (mac dinh = gia hien tai)
//   --phien: so phien gia dinh phia sau (mac dinh 5)
import { tinhTinHieuChoMa } from "../tinhTinHieuChoMa.js";
import { layNenDieuChinh } from "../loi/nenDieuChinh.js";

const args = process.argv.slice(2);
const ma = (args.find((x) => !x.startsWith("--")) || "ANV").toUpperCase();
const opt = (ten, mac) => {
  const a = args.find((x) => x.startsWith(`--${ten}=`));
  return a ? Number(a.split("=")[1]) : mac;
};
const den = Math.floor(Date.now() / 1000);
const ngayVN = (giay) => new Date(giay * 1000 + 7 * 3600e3).toISOString().slice(0, 10);
const d = await (await fetch(`https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol=VNINDEX&from=${den - 5 * 365 * 86400}&to=${den}`)).json();
const vni = new Map(d.t.map((t, i) => [ngayVN(t), d.c[i]]));
const nen = await layNenDieuChinh(ma);
const cuoi = nen[nen.length - 1];
const truoc = nen[nen.length - 2];
const tb20 = nen.slice(-21, -1).reduce((s, b) => s + b.v, 0) / 20;
const klGiaDinh = Math.round(opt("kl", 1.0) * tb20);
const vniCuoi = vni.get(cuoi.t) ?? [...vni.values()].at(-1);

const tick = (g) => (g < 10 ? 0.01 : g < 50 ? 0.05 : 0.1);
const lam = (g) => Math.round(g / tick(g)) * tick(g);
const tinhVoi = (nenThu) =>
  tinhTinHieuChoMa({ ma, nen: nenThu, vniClose: nenThu.map((b) => vni.get(b.t) ?? vniCuoi), san: "HOSE", ketQuaBreadth: { theoNganh: new Map(), trungBinh: 50 } });
const thuHomNay = (g) => nen.map((b, i) => (i === nen.length - 1 ? { ...b, c: g, h: Math.max(b.h, g), l: Math.min(b.l, g), v: Math.max(b.v, klGiaDinh) } : b));

console.log(`${ma}: nen cuoi ${cuoi.t} C ${cuoi.c} (hom qua ${truoc.c}) KL hien ${cuoi.v} | TB20 ${Math.round(tb20)} | gia dinh KL ca phien = ${klGiaDinh} (${(klGiaDinh / tb20).toFixed(2)} x TB20)`);

// ---------- A. quet gia dong cua hom nay ----------
const san = lam(truoc.c * 0.93);
const tran = lam(truoc.c * 1.07);
const dong = [];
for (let g = san; g <= tran + 1e-9; g = lam(g + tick(g))) {
  const r = tinhVoi(thuHomNay(Number(g.toFixed(2))));
  dong.push({ g: Number(g.toFixed(2)), tin: r.tin, diem: r.diem, trend: r.trend, mom: r.mom, dt: r.dt, cho: r.cho_phien_sau, mua: r.tin === "MUA", ml: !!r.mua_moi, gc: !!r.mua_giua, adx: r.adx });
}
const nhan = (x) => `${x.tin}${x.cho ? " (doi phien sau)" : ""}${x.ml ? " +MUA MOI" : ""}${x.gc ? " +MUA GIUA" : ""}`;
console.log(`\n=== A. Gia dong cua hom nay (${san} - ${tran}) -> tin hieu ===`);
let dau = 0;
for (let i = 1; i <= dong.length; i++) {
  const a = dong[i - 1];
  const b = dong[i];
  if (b && nhan(a) === nhan(b) && a.trend === b.trend && a.mom === b.mom && a.dt === b.dt) continue;
  const x0 = dong[dau];
  console.log(`  ${String(x0.g).padStart(6)} - ${String(a.g).padStart(6)} : ${nhan(a).padEnd(34)} diem ${Number(a.diem).toFixed(2)}${x0.diem !== a.diem ? ` .. ${Number(x0.diem).toFixed(2)}` : ""} | xu huong ${a.trend} dong dong luong ${a.mom} dong tien ${a.dt} | ADX ${Number(a.adx).toFixed(1)}`);
  dau = i;
}

// ---------- B. giu gia, di tiep cac phien sau ----------
const giu = opt("giu", cuoi.c);
const soPhien = opt("phien", 5);
console.log(`\n=== B. Giu gia ${giu} (khong doi) trong ${soPhien} phien sau, KL moi phien = ${klGiaDinh} ===`);
let thu = thuHomNay(giu);
const ngay = new Date(cuoi.t + "T00:00:00Z");
for (let k = 1; k <= soPhien; k++) {
  do ngay.setUTCDate(ngay.getUTCDate() + 1);
  while ([0, 6].includes(ngay.getUTCDay()));
  thu = [...thu, { t: ngay.toISOString().slice(0, 10), o: giu, h: giu, l: giu, c: giu, v: klGiaDinh }];
  const r = tinhVoi(thu);
  console.log(`  +${k} ${thu.at(-1).t}: ${nhan({ tin: r.tin, cho: r.cho_phien_sau, ml: !!r.mua_moi, gc: !!r.mua_giua }).padEnd(34)} diem ${Number(r.diem).toFixed(2)} | xu huong ${r.trend} dong luong ${r.mom} dong tien ${r.dt} | ADX ${Number(r.adx).toFixed(1)} kijun ${Number(r.kijun).toFixed(2)}`);
}
process.exit(0);
