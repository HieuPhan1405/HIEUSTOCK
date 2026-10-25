// CONG CU CHAN DOAN (CHI DOC) - goi thu cac endpoint Market Data cua DNSE OpenAPI de xem truong du lieu THAT: trades (chieu khop), quotes, foreign-trading, market-index, instruments.
// CACH CHAY: node --env-file=.env.dnse.local engine/dich-vu/chayThuDnseRest.mjs [MA] [yyyy-mm-dd]   (mac dinh VPB, phien gan nhat). Khong in khoa API.
import { taoMarketData } from "../dnse/marketDataRest.js";

const apiKey = process.env.DNSE_API_KEY, apiSecret = process.env.DNSE_API_SECRET;
if (!apiKey || !apiSecret) { console.error("Thieu DNSE_API_KEY / DNSE_API_SECRET trong .env.dnse.local"); process.exit(1); }
const ma = (process.argv[2] || "VPB").toUpperCase();
const ngay = process.argv[3] || null;
const md = taoMarketData({ apiKey, apiSecret });
const cat = (o, n = 700) => JSON.stringify(o).slice(0, n);

const thu = async (ten, fn) => {
  const t0 = Date.now();
  try {
    const r = await fn();
    console.log(`\n### ${ten} -> HTTP ${r.status} (${Date.now() - t0}ms)\n${r.json ? cat(r.json) : String(r.text).slice(0, 300)}`);
    return r;
  } catch (e) {
    console.log(`\n### ${ten} -> LOI ${e.message}`);
    return null;
  }
};

await thu("trades/latest", () => md.tradesGanNhat(ma));
await thu("quotes/latest", () => md.quotesGanNhat(ma));
// phien: lay cua ngay chi dinh (mac dinh 2 ngay truoc de chac chan co phien) theo gio VN 09:00-15:00
const homNay = new Date();
const d = ngay ? new Date(`${ngay}T00:00:00+07:00`) : new Date(homNay.getTime() - 2 * 86400e3);
const batDau = Math.floor(new Date(`${d.toISOString().slice(0, 10)}T09:00:00+07:00`).getTime() / 1000);
const ketThuc = batDau + 6 * 3600;
const tr = await thu(`trades ${ma} ${d.toISOString().slice(0, 10)} 09-15h (limit 5)`, () => md.trades(ma, batDau, ketThuc, { limit: 5 }));
await thu("foreign-trading (limit 3)", () => md.nuocNgoai(ma, batDau, ketThuc, { limit: 3 }));
await thu("market-index VNINDEX (limit 2)", () => md.chiSo("VNINDEX", { from: batDau, to: ketThuc, limit: 2 }));
await thu("instruments VN30 (limit 3)", () => md.danhSachMa({ indexName: "VN30", limit: 3, page: 1 }));
if (tr?.json?.trades?.length) console.log("\nCac gia tri side thay duoc:", [...new Set(tr.json.trades.map((x) => x.side))].join(","));
