// Test tay cho lib/mauHinhNen.js (mau hinh nen nhat). Chay: node engine/test/mauHinhNen.test.mjs
import { nhanDienMauHinhNen, cachMauHinhNenGanNhat, MAU_HINH_NEN, KHOA_MAU_HINH_NEN, COT_MAU_HINH_NEN } from "../../lib/mauHinhNen.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const ngay = (i) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
const nen = (i, o, h, l, c) => ({ t: ngay(i), o, h, l, c, v: 1_000_000 });
// nen nen giam deu 100 -> 71 (30 nen, bien do 2, than 0,5), nen nen tang deu 100 -> 129
function nenGiam(n = 30) { const r = []; let c = 100; for (let i = 0; i < n; i++) { const o = c; c -= 1; r.push(nen(i, o, o + 0.5, c - 0.5, c)); } return r; }
function nenTang(n = 30) { const r = []; let c = 100; for (let i = 0; i < n; i++) { const o = c; c += 1; r.push(nen(i, o, c + 0.5, o - 0.5, c)); } return r; }
const them = (base, ...cac) => { const r = [...base]; for (const [o, h, l, c] of cac) r.push(nen(r.length, o, h, l, c)); return r; };
const co = (bars, khoa, cach = 0) => nhanDienMauHinhNen(bars).some((m) => m.khoa === khoa && m.cach === cach);
const G = nenGiam(); // nen cuoi dong cua 70
const T = nenTang(); // nen cuoi dong cua 129

ok("danh sach: 19 mau hinh, khoa khong trung, cot nen_<khoa>", MAU_HINH_NEN.length === 19 && new Set(KHOA_MAU_HINH_NEN).size === 19 && COT_MAU_HINH_NEN[0] === "nen_bua");
// --- 1 nen ---
ok("bua sau nhip giam", co(them(G, [69.6, 70.1, 67, 70]), "bua"));
ok("bua KHONG co khi khong co nhip giam (sau nhip tang)", !co(them(T, [128.6, 129.1, 126, 129]), "bua"));
ok("nguoi treo co sau nhip tang (cung dang bua)", co(them(T, [128.6, 129.1, 126, 129]), "nguoi_treo"));
ok("bua nguoc sau nhip giam", co(them(G, [67.5, 70.5, 67.3, 67.4]), "bua_nguoc"), JSON.stringify(nhanDienMauHinhNen(them(G, [67.5, 70.5, 67.3, 67.4])).map((m) => m.khoa)));
ok("sao bang sau nhip tang", co(them(T, [130, 133.5, 129.8, 130.3]), "sao_bang"));
ok("doji chuon chuon sau nhip giam", co(them(G, [70, 70.1, 66.5, 70.05]), "doji_chuon_chuon"));
ok("doji bia mo sau nhip tang", co(them(T, [129, 132.5, 128.95, 129.05]), "doji_bia_mo"));
ok("doji (than ~ 0, bien do du lon)", co(them(G, [70, 71.2, 68.8, 70.05]), "doji"));
ok("nen binh thuong (than dai) khong phai doji / bua", !co(them(G, [70, 71, 69, 71]), "doji") && !co(them(G, [70, 71, 69, 71]), "bua"));
// --- 2 nen ---
ok("nhan chim tang: do nho roi xanh bao tron", co(them(G, [70.4, 70.5, 69.5, 69.6], [69.3, 72.2, 69.1, 72]), "nhan_chim_tang"));
ok("nhan chim giam: xanh nho roi do bao tron", co(them(T, [129.6, 130.5, 129.5, 130.4], [130.7, 130.9, 128, 128.2]), "nhan_chim_giam"));
ok("xuyen thau: do dai, xanh mo thap dong qua nua than", co(them(G, [71.5, 71.6, 68.9, 69.0], [68.6, 70.8, 68.4, 70.5]), "xuyen_thau"));
ok("may den che phu", co(them(T, [127.9, 130.6, 127.8, 130.5], [131, 131.2, 128.9, 129]), "may_den"));
ok("harami tang: do dai roi xanh nho nam trong than", co(them(G, [73, 73.1, 69.9, 70], [70.5, 71.6, 70.4, 71.3]), "harami_tang"));
ok("harami giam", co(them(T, [127, 130.1, 126.9, 130], [129.5, 129.7, 128.4, 128.6]), "harami_giam"));
ok("day nhip: do dai roi xanh cung dau day", co(them(G, [71.5, 71.6, 69, 69.2], [69.1, 71, 69, 70.8]), "day_nhip"));
ok("dinh nhip", co(them(T, [127.4, 130, 127.3, 129.8], [129.9, 130, 127.8, 128]), "dinh_nhip"));
// --- 3 nen ---
ok("sao mai: do dai, than nho, xanh dong qua nua nen dau", co(them(G, [72.5, 72.6, 69.4, 69.5], [69.4, 69.9, 69, 69.6], [69.6, 72.8, 69.5, 72.6]), "sao_mai"));
ok("sao hom", co(them(T, [127.4, 130.6, 127.3, 130.5], [130.6, 131, 130.2, 130.7], [130.5, 130.6, 127.4, 127.7]), "sao_hom"));
ok("ba chang linh: 3 nen xanh tang, than dai, bong tren ngan", co(them(G, [70, 72.1, 69.9, 72], [71.5, 74.1, 71.4, 74], [73.5, 76.1, 73.4, 76]), "ba_linh_tang"));
ok("ba con qua den", co(them(T, [130, 130.1, 127.9, 128], [128.5, 128.6, 126.4, 126.5], [127, 127.1, 124.9, 125]), "ba_qua_den"));
// --- tuoi / cach ---
{
  const b = them(G, [69.6, 70.1, 67, 70], [70, 70.5, 69.5, 70.2], [70.2, 70.6, 69.8, 70.4]);
  ok("mau hinh cach nen cuoi 2 nen: cach = 2", co(b, "bua", 2));
  const c = cachMauHinhNenGanNhat(b, { tuoiToiDa: 5 });
  ok("cachMauHinhNenGanNhat: bua = 2, mau hinh khac = null", c.bua === 2 && c.sao_bang === null, JSON.stringify(c));
  ok("tuoiToiDa nho (2 nen) loai mau hinh cu", nhanDienMauHinhNen(b, { tuoiToiDa: 2 }).every((m) => m.cach <= 1));
}
ok("it nen -> rong, khong loi", nhanDienMauHinhNen(G.slice(0, 10)).length === 0 && nhanDienMauHinhNen(null).length === 0);

if (loi) {
  console.log(`\n${loi} LOI`);
  process.exit(1);
}
console.log("\nTAT CA DAT");
