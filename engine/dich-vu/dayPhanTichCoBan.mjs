// Day engine/output/phan_tich_web.json (taoDuLieuPhanTichWeb.mjs) len web: RRG + tung ma (moi lan 80 ma). Chay: CS_UPLOAD_API_KEY=... node engine/dich-vu/dayPhanTichCoBan.mjs [--local] [--chi-rrg]
// Mac dinh day len https://www.cloudstock.id.vn (dung host www vi ten mien tran 308-redirect). --local = http://localhost:3000.
import { readFileSync } from "node:fs";

const du = JSON.parse(readFileSync(new URL("../output/phan_tich_web.json", import.meta.url), "utf8"));
const goc = process.argv.includes("--local") ? "http://localhost:3000" : "https://www.cloudstock.id.vn";
const key = process.env.CS_UPLOAD_API_KEY || "CLOUD";
async function gui(body) {
  const r = await fetch(`${goc}/api/upload-phan-tich-co-ban`, { method: "POST", headers: { "x-api-key": key, "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(body) });
  const t = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${t.slice(0, 200)}`);
  return t;
}
console.log("RRG:", await gui({ rrg: du.rrg }));
if (!process.argv.includes("--chi-rrg")) {
  const ds = Object.entries(du.ma);
  for (let i = 0; i < ds.length; i += 80) console.log(`ma ${i + 1}-${Math.min(i + 80, ds.length)}:`, await gui({ ma: Object.fromEntries(ds.slice(i, i + 80)) }));
}
