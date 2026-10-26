// Tai BAO CAO TAI CHINH THEO QUY (VNDirect finfo financial_statements, cong khai) cua cac ma trong nganh_map -> engine/output/bctc.json
// { MA: { loai: "pi" | "nh" | "ck" | "bh", q: { "2026-06-30": { "<itemCode>": gia tri (dong) } } } }
// Quy tu 2024-03-31 (de co 8 quy tinh TTM va so sanh cung ky nam truoc cho F-score). KQKD va luu chuyen tien te VNDirect da tach theo tung quy (khong cong don).
// Ma chi tieu: BCDKT 11000 TS ngan han, 11100 tien, 11300 phai thu NH, 11400 hang ton kho, 12000 TS dai han, 12200 TSCD, 12700 TONG TS, 13000 no phai tra, 13100 no NH, 13300 no DH, 13110 vay NH, 13340 vay DH, 14000 von CSH, 15000 loi ich CDTS, 14110 von gop, 14200 LNST chua phan phoi;
//   KQKD 21001 DT thuan, 22100 gia von, 23100 LN gop, 22510 lai vay, 23800 LNTT, 22070 thue, 23003 LNST, 23000 LNST cong ty me, 22200 CP QLDN, 22110 CP ban hang; LCTT 32000 CFO, 22230 khau hao, 33600 co tuc + loi nhuan da tra (LCTT);
//   ngan hang 421701 tong thu nhap hoat dong; chung khoan 21000 tong doanh thu hoat dong.
// Chay: node engine/dich-vu/taiBaoCaoTaiChinh.mjs
import { readFileSync, writeFileSync } from "node:fs";

const nganh = JSON.parse(readFileSync(new URL("../output/nganh_map.json", import.meta.url), "utf8"));
const MA_CHI_TIEU = [11000, 11100, 11300, 11400, 12000, 12200, 12700, 13000, 13100, 13300, 13110, 13340, 14000, 15000, 14110, 14200, 21001, 22100, 23100, 22510, 23800, 22070, 23003, 23000, 22200, 22110, 32000, 22230, 33600, 421701, 21000];
const MODEL = { pi: [1, 2, 3], nh: [101, 102, 103], ck: [89, 90, 91], bh: [411, 412, 413] };
const loaiCua = (ma) => {
  const n = nganh[ma];
  return n === "Ngan hang" ? "nh" : n === "Chung khoan" ? "ck" : n === "Bao hiem" ? "bh" : "pi";
};
async function lay(ma) {
  const url = `https://api-finfo.vndirect.com.vn/v4/financial_statements?q=code:${ma}~reportType:QUARTER~itemCode:${MA_CHI_TIEU.join(",")}~fiscalDate:gte:2024-03-31&sort=fiscalDate:desc&size=2000`;
  for (let lan = 0; lan < 3; lan++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(25000) });
      if (r.ok) return (await r.json()).data ?? [];
    } catch {}
  }
  return null;
}
const kq = {};
const hang = Object.keys(nganh);
let xong = 0, loi = 0;
async function tho() {
  while (hang.length) {
    const ma = hang.shift();
    const d = await lay(ma);
    if (!d) { loi++; continue; }
    const loai = loaiCua(ma);
    const cho = new Set(MODEL[loai]);
    const q = {};
    for (const x of d) {
      if (!cho.has(Number(x.modelType))) continue;
      (q[x.fiscalDate] ??= {})[String(Math.round(x.itemCode))] = x.numericValue;
    }
    kq[ma] = { loai, q };
    if (++xong % 50 === 0) console.log(`${xong}/${Object.keys(nganh).length}`);
  }
}
await Promise.all(Array.from({ length: 6 }, tho));
writeFileSync(new URL("../output/bctc.json", import.meta.url), JSON.stringify(kq));
const co = Object.values(kq).filter((x) => Object.keys(x.q).length).length;
console.log(`Xong: ${Object.keys(kq).length} ma (${co} co du lieu), loi ${loi}`);
