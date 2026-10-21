// RSI KHUNG 1 GIO cho BO LOC: tai nen 1 gio ~60 ngay gan nhat cua TOAN BO ma quet (DNSE chart-api cong khai, 6 luong song song), tinh RSI 14 + RSI phan ky 1 gio (engine/loi/rsiH1.js) va day len
// /api/upload-chi-bao (CSV chi 3 cot ma, rsi_h1, rsi_h1_pk_cach - route chi ghi cac cot co trong header nen khong dong den chi bao khac).
// Chay tay: node engine/dich-vu/dayRsiH1.mjs [--upload]   (CS_UPLOAD_API_KEY, goc web CS_GOC_WEB mac dinh https://www.cloudstock.id.vn). Engine real-time (--upload) tu goi file nay o tien trinh con moi 10 phut.
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { danhSachMaQuet } from "../loi/quetToanBo.js";
import { tinhRsiH1ChoMa, xayDungCsvRsiH1 } from "../loi/rsiH1.js";

const SO_NGAY = 60;
const DNSE = "https://services.entrade.com.vn/chart-api/v2/ohlcs/stock";
const cho = (ms) => new Promise((r) => setTimeout(r, ms));
async function lay(ma) {
  const den = Math.floor(Date.now() / 1000);
  const tu = den - 86400 * SO_NGAY;
  for (let lan = 1; lan <= 3; lan++) {
    try {
      const r = await fetch(`${DNSE}?symbol=${ma}&resolution=1H&from=${tu}&to=${den}`, { signal: AbortSignal.timeout(30000) });
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j.t)) return j.t.map((t, i) => ({ t, h: j.h[i], l: j.l[i], c: j.c[i] })).filter((b) => [b.h, b.l, b.c].every((x) => Number.isFinite(x) && x > 0));
      }
    } catch {}
    await cho(400 * lan);
  }
  return null;
}

const dsMa = danhSachMaQuet();
const ds = [];
let loi = 0, k = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (k < dsMa.length) {
      const ma = dsMa[k++];
      const nen = await lay(ma);
      const kq = nen ? tinhRsiH1ChoMa(nen) : null;
      if (kq) ds.push({ ma, ...kq });
      else loi++;
    }
  })
);
const csv = xayDungCsvRsiH1(ds);
const thuMuc = fileURLToPath(new URL("../output/", import.meta.url));
mkdirSync(thuMuc, { recursive: true });
writeFileSync(thuMuc + "rsi_h1_moi_nhat.csv", csv, "utf-8");
console.log(`RSI 1H: ${ds.length}/${dsMa.length} ma (${loi} ma khong lay duoc / thieu nen)`);
if (process.argv.includes("--upload")) {
  const key = process.env.CS_UPLOAD_API_KEY;
  if (!key) {
    console.log("Thieu CS_UPLOAD_API_KEY - khong upload.");
    process.exit(1);
  }
  const goc = process.env.CS_GOC_WEB || "https://www.cloudstock.id.vn";
  const res = await fetch(`${goc}/api/upload-chi-bao`, { method: "POST", headers: { "Content-Type": "text/csv", "x-api-key": key }, body: csv, signal: AbortSignal.timeout(120000) });
  console.log(`[upload rsi h1] HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
}
process.exit(0);
