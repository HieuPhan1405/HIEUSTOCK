// CHAN DOAN (CHI DOC): "phat lai" 1 phien that cua NHIEU ma tu REST trades qua BoGopDongTien + tongHopThiTruong, ghi goi du lieu giong het goi engine day len web ra file JSON (de xem thu giao dien khi thi truong dong cua).
// CACH CHAY: node --env-file=.env.dnse.local engine/dich-vu/chayThuDnseReplayNhieuMa.mjs VPB,HPG,FPT,... yyyy-mm-dd [duong/dan/ra.json]
//   Dung ALL thay danh sach ma = toan bo ~390 ma (lay tu /api/signals cua web). Them --upload de DAY goi len web (can CS_UPLOAD_API_KEY + CS_XAC_NHAN_UPLOAD=DONG_Y) - dung de nap du lieu 1 phien da qua khi web moi co tinh nang.
import { writeFileSync } from "node:fs";
import { taoMarketData } from "../dnse/marketDataRest.js";
import { BoGopDongTien, phanTichThoiGian, tongHopThiTruong } from "../loi/dongTienChuDong.js";
import { VN30 } from "../danh-sach/vonHoa.js";
import { nganhCuaMa } from "../danh-sach/nganh.js";

const md = taoMarketData({ apiKey: process.env.DNSE_API_KEY, apiSecret: process.env.DNSE_API_SECRET });
const goc = process.env.CS_GOC_WEB || "https://www.cloudstock.id.vn";
let dsMa = (process.argv[2] || "VPB,HPG,FPT").toUpperCase().split(",");
if (dsMa[0] === "ALL") {
  const j = await (await fetch(`${goc}/api/signals`, { signal: AbortSignal.timeout(30000) })).json();
  dsMa = (j.tinHieu ?? []).map((x) => x.ma).filter(Boolean);
}
const ngay = process.argv[3] || "2026-10-23";
const ra = process.argv[4] && !process.argv[4].startsWith("--") ? process.argv[4] : null;
const gio = (iso) => Math.floor(new Date(iso).getTime() / 1000);
const tu = gio(`${ngay}T08:55:00+07:00`);

async function layPhien(ma) {
  let den = gio(`${ngay}T15:05:00+07:00`);
  const duy = new Map();
  let khong = 0;
  for (let goi = 0; den > tu && goi < 400; goi++) {
    const r = await md.trades(ma, tu, den, { limit: 1000 });
    if (r.status !== 200) break;
    const ds = r.json.trades ?? [];
    if (!ds.length) break;
    const truoc = duy.size;
    for (const x of ds) duy.set(`${x.time}|${x.matchPrice}|${x.matchQtty}|${x.totalVolumeTraded}`, x);
    const tp = phanTichThoiGian(ds[ds.length - 1].time);
    const giay = gio(`${tp.ngay}T${tp.gio}+07:00`);
    if (duy.size === truoc) { if (++khong > 3) break; den = giay - 1; continue; }
    khong = 0;
    den = giay === den ? giay - 1 : giay;
  }
  return [...duy.values()].sort((a, b) => (a.totalVolumeTraded - b.totalVolumeTraded) || (a.time < b.time ? -1 : 1));
}

const bo = new BoGopDongTien({ vn30: VN30 });
async function xuLy(ma) {
  const ds = await layPhien(ma);
  for (const x of ds) bo.nhanTick(x);
  const fr = await md.nuocNgoai(ma, tu, gio(`${ngay}T15:05:00+07:00`), { limit: 1 });
  const f = fr.json?.foreigners?.[0];
  if (f) bo.nhanNuocNgoai({ ...f, symbol: ma });
  return ds.length;
}
let xong = 0;
const hangDoi = [...dsMa];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (hangDoi.length) {
    const ma = hangDoi.shift();
    try {
      await xuLy(ma);
    } catch (e) {
      console.log(ma, "LOI", e.message);
    }
    if (++xong % 25 === 0) console.log(`${xong}/${dsMa.length}`);
  }
}));
for (const ten of ["VNINDEX", "VN30", "VN100", "HNX", "UPCOM"]) {
  const r = await md.chiSo(ten, { from: gio(`${ngay}T14:40:00+07:00`), to: gio(`${ngay}T15:10:00+07:00`), limit: 1 });
  const x = r.json?.marketIndices?.[0];
  if (x) bo.nhanChiSo(x);
}
const anh = bo.chupAnh({ chiTiet: true });
const goi = { ngay: anh.ngay, luc: new Date().toISOString(), nguong: anh.nguong, chiTiet: true, thiTruong: { ...anh.thiTruong, ...tongHopThiTruong(anh, { nganhCuaMa }) }, ma: anh.ma };
const json = JSON.stringify(goi);
console.log(`goi: ${(json.length / 1024).toFixed(0)} KB, ${Object.keys(anh.ma).length} ma, thiTruong.tong=${JSON.stringify(anh.thiTruong.tong)}`);
if (ra) writeFileSync(ra, json);
if (process.argv.includes("--upload")) {
  if (!process.env.CS_UPLOAD_API_KEY || process.env.CS_XAC_NHAN_UPLOAD !== "DONG_Y") {
    console.log("Thieu CS_UPLOAD_API_KEY / CS_XAC_NHAN_UPLOAD=DONG_Y - khong upload.");
  } else {
    const { gzipSync } = await import("node:zlib");
    const body = gzipSync(json);
    const res = await fetch(`${goc}/api/upload-dong-tien`, { method: "POST", headers: { "Content-Type": "application/json", "Content-Encoding": "gzip", "x-api-key": process.env.CS_UPLOAD_API_KEY }, body, signal: AbortSignal.timeout(120000) });
    console.log(`UPLOAD ${goc}: HTTP ${res.status} (${(body.length / 1024).toFixed(0)} KB nen) ${(await res.text()).slice(0, 200)}`);
  }
}
