// DAY FOOTPRINT PHAI SINH VN30F1M len web (chip "Footprint" tren bieu do khung trong ngay, /api/footprint).
// B1: tai tick con thieu (goi taiTickPhaiSinh.mjs, chi den hom qua - hoac hom nay neu da qua 15:10 gio VN, de khong luu file do dang giua phien).
// B2: gop tick -> nen 1 phut theo muc gia (lib/footprint.js tickThanhM1) va day tung goi 10 ngay len /api/upload-footprint (gzip).
// CACH CHAY (sau phien, moi ngay 1 lan):
//   node --env-file=.env.dnse.local engine/dich-vu/dayFootprintPhaiSinh.mjs [soNgay=N (mac dinh: TAT CA ngay da co, tu cu den moi)] [--khong-tai] --upload
// Upload can CS_UPLOAD_API_KEY + CS_XAC_NHAN_UPLOAD=DONG_Y (giong cac dich vu khac); thieu thi chi in so lieu.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tickThanhM1 } from "../../lib/footprint.js";

const DAY = path.dirname(fileURLToPath(import.meta.url));
const GOC_TICK = path.join(DAY, "..", "output", "tick_phaisinh");
const arg = (k, d) => process.argv.find((a) => a.startsWith(k + "="))?.split("=")[1] ?? d;
const soNgay = Math.max(0, Number(arg("soNgay", 0)) || 0); // 0 = tat ca
const goc = process.env.CS_GOC_WEB || "https://www.cloudstock.id.vn";
const upload = process.argv.includes("--upload") && process.env.CS_UPLOAD_API_KEY && process.env.CS_XAC_NHAN_UPLOAD === "DONG_Y" ? process.env.CS_UPLOAD_API_KEY : null;
if (process.argv.includes("--upload") && !upload) console.log("Khong du dieu kien upload (thieu CS_UPLOAD_API_KEY / CS_XAC_NHAN_UPLOAD=DONG_Y) - chi in so lieu.");

// ngay VN hien tai
const bayGio = new Date(Date.now() + 7 * 3600e3);
const homNay = bayGio.toISOString().slice(0, 10);
const quaPhien = bayGio.getUTCHours() * 60 + bayGio.getUTCMinutes() >= 15 * 60 + 10;
const den = quaPhien ? homNay : new Date(Date.parse(homNay + "T00:00:00Z") - 86400e3).toISOString().slice(0, 10);
// chi tai tu ngay SAU file tick moi nhat da co (lich su tick DNSE chi co tu ~25/03/2026)
const daCo = existsSync(GOC_TICK) ? readdirSync(GOC_TICK).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort() : [];
const tu = daCo.length ? new Date(Date.parse(daCo.at(-1).slice(0, 10) + "T00:00:00Z") + 86400e3).toISOString().slice(0, 10) : "2026-03-25";

if (!process.argv.includes("--khong-tai")) {
  if (!process.env.DNSE_API_KEY) console.log("Thieu DNSE_API_KEY - bo qua buoc tai tick (chi dung file da co).");
  else {
    console.log(`Tai tick con thieu ${tu} -> ${den} ...`);
    const r = spawnSync(process.execPath, [path.join(DAY, "taiTickPhaiSinh.mjs"), `tu=${tu}`, `den=${den}`], { stdio: "inherit", env: process.env });
    if (r.status !== 0) console.log("taiTickPhaiSinh ket thuc voi ma", r.status, "- van day cac ngay da co.");
  }
}

const ds = existsSync(GOC_TICK) ? readdirSync(GOC_TICK).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f.slice(0, 10) <= den).sort().slice(soNgay > 0 ? -soNgay : 0) : [];
if (!ds.length) { console.log("Khong co file tick nao."); process.exit(0); }
console.log(`${ds.length} ngay: ${ds[0].slice(0, 10)} -> ${ds.at(-1).slice(0, 10)}`);
for (let i = 0; i < ds.length; i += 10) {
  const ngay = {};
  for (const f of ds.slice(i, i + 10)) ngay[f.slice(0, 10)] = tickThanhM1(JSON.parse(readFileSync(path.join(GOC_TICK, f), "utf8")), f.slice(0, 10));
  const than = gzipSync(JSON.stringify({ ma: "VN30F1M", ngay }));
  const ten = Object.keys(ngay);
  if (!upload) { console.log(`  goi ${ten[0]}..${ten.at(-1)}: ${(than.length / 1024).toFixed(0)} KB (gzip) - khong upload`); continue; }
  const res = await fetch(`${goc}/api/upload-footprint`, { method: "POST", headers: { "Content-Type": "application/json", "Content-Encoding": "gzip", "x-api-key": upload }, body: than, signal: AbortSignal.timeout(60000) });
  console.log(`  goi ${ten[0]}..${ten.at(-1)}: ${(than.length / 1024).toFixed(0)} KB -> ${res.status} ${(await res.text()).slice(0, 120)}`);
}
process.exit(0);
