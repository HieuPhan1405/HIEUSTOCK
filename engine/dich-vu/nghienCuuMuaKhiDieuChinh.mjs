// "MUA KHI DIEU CHINH" (Buy the Dip) vs MUA DEU - Hieu 02/11/2026. Moi thang co 1 don vi ngan sach (ngay giao dich dau thang). Mua deu: dua vao ngay. Mua khi dieu chinh: tien cho o dang tien mat;
// khi gia dong cua <= (1 - x) dinh 250 phien (hoac tam ly < 20) thi DUA HET tien dang co vao (cooldown 20 phien). Bien the co "tran cho": tien cho qua 6 thang thi dua vao luon. Cuoi ky: gia tri = don vi * gia + tien mat.
// So sanh gia tri cuoi cung tong ngan sach (so lan mua deu = 1,00). Thu o nhieu nam bat dau, tren VN-Index va tren 30 ma von hoa lon (nhin lai hien tai -> thien lech nguoi song sot / nhin truoc).
// Chay: node engine/dich-vu/nghienCuuMuaKhiDieuChinh.mjs
import { docJson, f } from "./backtestChung.mjs";
import { SO_CP_LUU_HANH } from "../../lib/soCoPhieuLuuHanh.js";
import { TAM_LY_LICH_SU } from "../../lib/tamLyLichSuDuLieu.js";

const vni = docJson("vnindex_dai.json");
const nen = docJson("nen_dai.json");
const tamLy = new Map(TAM_LY_LICH_SU.t.map((t, i) => [t, TAM_LY_LICH_SU.s[i]]));

// chuoi {t, c} -> mo phong
function chay(bars, { tuNam, x = 0.2, kieu, cuaSo = 250, tran = Infinity, laiTM = 0, xacNhan = false }) {
  const ds = bars.filter((b) => b.t >= `${tuNam}-01-01`);
  const lam = Math.pow(1 + laiTM, 1 / 252);
  let don = 0, tm = 0, nap = 0, cho = 0, lanMua = 0, cuoiMua = -1e9, thangTruoc = "";
  let tongThangCho = 0;
  for (let i = 0; i < ds.length; i++) {
    const g = ds[i].c;
    tm *= lam;
    const thang = ds[i].t.slice(0, 7);
    if (thang !== thangTruoc) { thangTruoc = thang; nap++; tm += 1; if (kieu === "deu") { don += tm / g; tm = 0; lanMua++; continue; } }
    if (kieu === "deu" || tm <= 0) continue;
    // dinh 250 phien tinh tren du lieu day du (ca truoc ngay bat dau)
    const iGoc = bars.indexOf(ds[0]) + i;
    let dinh = -Infinity; for (let k = Math.max(0, iGoc - cuaSo + 1); k <= iGoc; k++) dinh = Math.max(dinh, bars[k].c);
    let kich = false;
    if (kieu === "dip") kich = g <= dinh * (1 - x);
    else if (kieu === "tamLy") kich = (tamLy.get(ds[i].t) ?? 99) < 20;
    if (kich && xacNhan) { let d5 = -Infinity; for (let k = Math.max(0, iGoc - 5); k < iGoc; k++) d5 = Math.max(d5, bars[k].c); kich = g > d5; }
    cho++;
    if (!kich && tran < Infinity) { // tien nam lau nhat qua tran thang thi dua vao
      if (cho > tran * 21) kich = true;
    }
    if (kich && i - cuoiMua >= 20) { don += tm / g; tm = 0; lanMua++; cuoiMua = i; cho = 0; }
  }
  return { gt: don * ds.at(-1).c + tm, nap, tm, lanMua, tmTyLe: (tm * 1) / (don * ds.at(-1).c + tm) };
}

const bangVni = vni.map((b) => ({ t: b.t, c: b.c }));
const bien = [
  ["Mua deu (chuan)", { kieu: "deu" }],
  ["Dip 10% (dinh 1 nam)", { kieu: "dip", x: 0.1 }],
  ["Dip 15%", { kieu: "dip", x: 0.15 }],
  ["Dip 20%", { kieu: "dip", x: 0.2 }],
  ["Dip 10% + tran cho 6 thang", { kieu: "dip", x: 0.1, tran: 6 }],
  ["Dip 15% + tran cho 6 thang", { kieu: "dip", x: 0.15, tran: 6 }],
  ["Dip 10% + cho xac nhan (vuot dinh 5p)", { kieu: "dip", x: 0.1, xacNhan: true }],
  ["Tam ly < 20 (so hai) + tran 6 thang", { kieu: "tamLy", tran: 6 }],
];
for (const laiTM of [0, 0.04]) {
  console.log(`\n=== VN-INDEX | tien mat lai ${laiTM * 100}%/nam | gia tri cuoi / gia tri mua deu (1,00 = bang mua deu); [tien mat con lai % tai san] ===`);
  const nams = [2013, 2016, 2019, 2022];
  console.log("bat dau:".padEnd(42) + nams.join("      "));
  const co = nams.map((n) => chay(bangVni, { tuNam: n, kieu: "deu", laiTM }));
  for (const [ten, o] of bien) {
    const dong = nams.map((n, q) => { if (o.kieu === "tamLy" && n < 2014) return "  -     "; const r = chay(bangVni, { tuNam: n, ...o, laiTM }); return `${f(r.gt / co[q].gt, 3)}[${f(r.tmTyLe * 100, 0)}%]`.padEnd(11); });
    console.log(ten.padEnd(42) + dong.join(" "));
  }
}

// ---- 30 ma von hoa lon (nhin lai hien tai)
const ma = Object.keys(nen).filter((k) => SO_CP_LUU_HANH[k] && nen[k].length > 1500).map((k) => [k, nen[k].at(-1).c * SO_CP_LUU_HANH[k]]).sort((a, b) => b[1] - a[1]).slice(0, 30).map((x) => x[0]);
console.log(`\n=== 30 MA VON HOA LON NHAT HIEN TAI (${ma.slice(0, 10).join(",")}...) - mua tung ma, tong hop TB so voi mua deu | tien mat 0% | nhin lai hien tai: thien lech ===`);
for (const nam of [2016, 2019]) {
  const kqs = {};
  for (const [ten, o] of bien.filter((b) => b[1].kieu !== "tamLy")) kqs[ten] = [];
  for (const k of ma) {
    const bars = nen[k].map((b) => ({ t: b.t, c: b.c }));
    if (bars[0].t > `${nam}-03-01`) continue;
    const co2 = chay(bars, { tuNam: nam, kieu: "deu" });
    for (const [ten, o] of bien.filter((b) => b[1].kieu !== "tamLy")) kqs[ten].push(chay(bars, { tuNam: nam, ...o }).gt / co2.gt);
  }
  console.log(`bat dau ${nam}:`);
  for (const [ten, a] of Object.entries(kqs)) { const tb2 = a.reduce((s, x) => s + x, 0) / a.length; console.log("  " + ten.padEnd(42) + `TB ${f(tb2, 3)}  thang mua deu ${a.filter((x) => x > 1).length}/${a.length}`); }
}
