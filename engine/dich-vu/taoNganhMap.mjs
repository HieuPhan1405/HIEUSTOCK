// TAO engine/output/nganh_map.json { MA: "Ten nganh" } TU engine/danh-sach/nganh.js (nguon su that cua nganh) cho cac ma dang theo doi (nen_gan.json / nen_dai.json) - dung cho bao cao tai chinh, phan tich co ban, RRG.
// Truoc 28/10/2026 file nay lam tay nen ma moi (vd DDV) khong co nganh -> bi bo khoi phan tich co ban; nay tao lai moi lan chay cap nhat hang ngay. Ma khong thuoc nganh nao trong nganh.js -> khong ghi (giu dung nhu cu).
// Chay: node engine/dich-vu/taoNganhMap.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { nganhCuaMa } from "../danh-sach/nganh.js";

const doc = (ten) => { const f = new URL(`../output/${ten}`, import.meta.url); return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : {}; };
const ma = new Set([...Object.keys(doc("nen_gan.json")), ...Object.keys(doc("nen_dai.json"))].filter((m) => m !== "VNINDEX"));
const cu = doc("nganh_map.json");
const moi = {};
for (const m of [...ma].sort()) {
  const n = nganhCuaMa(m);
  if (n) moi[m] = n;
}
if (Object.keys(moi).length < 300) {
  console.error(`Chi ${Object.keys(moi).length} ma co nganh (< 300) - bo qua, giu nguyen nganh_map.json cu`);
  process.exit(1);
}
const them = Object.keys(moi).filter((m) => !(m in cu));
const doi = Object.keys(moi).filter((m) => m in cu && cu[m] !== moi[m]);
writeFileSync(new URL("../output/nganh_map.json", import.meta.url), JSON.stringify(moi));
console.log(`Xong: ${Object.keys(moi).length} ma co nganh | them moi ${them.length}${them.length ? ` (${them.join(",")})` : ""} | doi nganh ${doi.length}${doi.length ? ` (${doi.map((m) => `${m}: ${cu[m]} -> ${moi[m]}`).join("; ")})` : ""}`);
