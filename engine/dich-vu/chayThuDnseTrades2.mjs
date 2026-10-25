// CHAN DOAN (CHI DOC) 3: kiem tra TINH DUNG cua du lieu trades: trung lap, phan trang, tong KL so voi totalVolumeTraded, chieu khop trong phien lien tuc vs ATO/ATC.
// CACH CHAY: node --env-file=.env.dnse.local engine/dich-vu/chayThuDnseTrades2.mjs [MA] [yyyy-mm-dd]
import { taoMarketData } from "../dnse/marketDataRest.js";
const md = taoMarketData({ apiKey: process.env.DNSE_API_KEY, apiSecret: process.env.DNSE_API_SECRET });
const ma = (process.argv[2] || "VPB").toUpperCase();
const ngay = process.argv[3] || "2026-10-23";
const gio = (iso) => Math.floor(new Date(iso).getTime() / 1000);
const tu = gio(`${ngay}T08:30:00+07:00`), den = gio(`${ngay}T15:10:00+07:00`);
let token = null, trang = 0;
const tong = [];
const tokens = new Set();
const t0 = Date.now();
do {
  const r = await md.trades(ma, tu, den, { limit: 1000, ...(token ? { nextPageToken: token } : {}) });
  if (r.status !== 200) { console.log("loi", r.status, String(r.text).slice(0, 200)); break; }
  tong.push(...r.json.trades);
  token = r.json.nextPageToken || null;
  if (token && tokens.has(token)) { console.log("TOKEN LAP LAI -> dung"); break; }
  if (token) tokens.add(token);
  trang++;
} while (token && trang < 400);
console.log(`${ma} ${ngay}: ${tong.length} ban ghi / ${trang} trang / ${Date.now() - t0}ms; dau ${tong[0]?.time}  cuoi ${tong[tong.length - 1]?.time}`);
const duy = new Map();
for (const x of tong) duy.set(`${x.time}|${x.matchPrice}|${x.matchQtty}|${x.totalVolumeTraded}`, x);
console.log(`ban ghi duy nhat: ${duy.size} (trung lap ${tong.length - duy.size})`);
const ds = [...duy.values()].sort((a, b) => (a.totalVolumeTraded - b.totalVolumeTraded) || (a.time < b.time ? -1 : 1));
const tongKL = ds.reduce((s, x) => s + x.matchQtty, 0);
console.log(`tong matchQtty = ${tongKL}; totalVolumeTraded cuoi = ${ds[ds.length - 1]?.totalVolumeTraded}; chenh = ${tongKL - ds[ds.length - 1]?.totalVolumeTraded}`);
const hm = (x) => x.time.slice(11, 19);
const cat = (ten, f) => {
  const g = ds.filter(f);
  const b = g.filter((x) => x.side === "BUY").reduce((s, x) => s + x.matchQtty, 0), s = g.filter((x) => x.side === "SELL").reduce((a, x) => a + x.matchQtty, 0);
  console.log(`  ${ten.padEnd(22)} n=${String(g.length).padStart(6)} | KL BUY ${b} / SELL ${s} / khac ${g.reduce((a, x) => a + x.matchQtty, 0) - b - s} | side: ${[...new Set(g.map((x) => x.side))].join(",")}`);
};
cat("ATO (<09:15)", (x) => hm(x) < "09:15:00");
cat("lien tuc 09:15-14:30", (x) => hm(x) >= "09:15:00" && hm(x) < "14:30:00");
cat("ATC (>=14:30)", (x) => hm(x) >= "14:30:00");
// vai ban ghi dau tien trong phien lien tuc
console.log("mau lien tuc:", JSON.stringify(ds.filter((x) => hm(x) >= "09:15:00" && hm(x) < "14:30:00").slice(0, 6).map((x) => [x.time.slice(11, 23), x.matchPrice, x.matchQtty, x.side, x.totalVolumeTraded])));
