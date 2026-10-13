// Tai nen 1 PHUT cua hop dong tuong lai VN30F1M (DNSE chart-api, co tu 13/08/2018) va chi so VN30 (tu 05/2020) -> engine/output/vn30f1m_1p.json, vn30_1p.json
// dang { t: [giay Unix], o, h, l, c, v }. Chi DOC. VN30F1M la chuoi "thang gan nhat" noi lien: ngay dao han (thu Nam tuan 3) gia nhay sang hop dong moi.
// Chay: node engine/dich-vu/taiDuLieuPhaiSinh.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const GOC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "output");
const den = Math.floor(Date.now() / 1000), tu = Math.floor(Date.parse("2018-01-01") / 1000);
const lay = async (u) => { for (let i = 0; i < 4; i++) { try { const r = await fetch(u, { signal: AbortSignal.timeout(180000) }); if (r.ok) return await r.json(); } catch {} await new Promise((r) => setTimeout(r, 1500 * (i + 1))); } return null; };
for (const [ten, u] of [["vn30f1m_1p", `https://services.entrade.com.vn/chart-api/v2/ohlcs/derivative?symbol=VN30F1M&resolution=1&from=${tu}&to=${den}`], ["vn30_1p", `https://services.entrade.com.vn/chart-api/v2/ohlcs/index?symbol=VN30&resolution=1&from=${tu}&to=${den}`]]) {
  const j = await lay(u);
  if (!j?.t?.length) { console.log(ten, "KHONG lay duoc"); continue; }
  writeFileSync(path.join(GOC, ten + ".json"), JSON.stringify({ t: j.t, o: j.o, h: j.h, l: j.l, c: j.c, v: j.v }));
  console.log(ten, "so nen", j.t.length, new Date(j.t[0] * 1000).toISOString().slice(0, 16), "->", new Date(j.t[j.t.length - 1] * 1000).toISOString().slice(0, 16));
}
process.exit(0);
