// Tai LICH SU ty le co phieu chuyen nhuong tu do (FREEFLOAT, itemCode 57066) va so co phieu luu hanh (OUTSTANDING_SHARES, 51004) cua tung ma tu VNDirect finfo (cong khai, theo quy, tu 2022-12).
// Ghi engine/output/free_float.json: { MA: [{ d: "yyyy-mm-dd", ff: 0.877, sh: 1885727648 }, ...tang dan theo ngay] }. Chay: node engine/dich-vu/taiFreeFloat.mjs
import { readFileSync, writeFileSync } from "node:fs";

const nen = JSON.parse(readFileSync(new URL("../output/nen_dai.json", import.meta.url), "utf8"));
const dsMa = Object.keys(nen);
const GOC = "https://api-finfo.vndirect.com.vn/v4/ratios";
async function lay(ma, itemCode) {
  for (let lan = 0; lan < 3; lan++) {
    try {
      const r = await fetch(`${GOC}?q=code:${ma}~itemCode:${itemCode}&sort=reportDate:desc&size=40`, { signal: AbortSignal.timeout(20000) });
      if (!r.ok) continue;
      return (await r.json()).data ?? [];
    } catch {}
  }
  return null;
}
const kq = {};
let xong = 0;
let loi = 0;
const hangDoi = [...dsMa];
async function tho() {
  while (hangDoi.length) {
    const ma = hangDoi.shift();
    const [ff, sh] = await Promise.all([lay(ma, 57066), lay(ma, 51004)]);
    if (!ff || !sh) {
      loi++;
      continue;
    }
    const theoNgay = new Map();
    for (const x of ff) theoNgay.set(x.reportDate, { d: x.reportDate, ff: x.value });
    for (const x of sh) theoNgay.set(x.reportDate, { ...(theoNgay.get(x.reportDate) ?? { d: x.reportDate }), sh: x.value });
    kq[ma] = [...theoNgay.values()].sort((a, b) => (a.d < b.d ? -1 : 1));
    if (++xong % 50 === 0) console.log(`${xong}/${dsMa.length}`);
  }
}
await Promise.all(Array.from({ length: 6 }, tho));
writeFileSync(new URL("../output/free_float.json", import.meta.url), JSON.stringify(kq));
console.log(`Xong: ${Object.keys(kq).length} ma, loi ${loi}`);
