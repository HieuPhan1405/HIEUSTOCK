// CHAN DOAN (CHI DOC) 2: do SAU lich su lenh khop (trades), so ban ghi / lan goi, phan trang, nhom lenh theo ms (de uoc luong co lenh), foreign-trading theo ngay.
// CACH CHAY: node --env-file=.env.dnse.local engine/dich-vu/chayThuDnseTrades.mjs [MA]
import { taoMarketData } from "../dnse/marketDataRest.js";
const md = taoMarketData({ apiKey: process.env.DNSE_API_KEY, apiSecret: process.env.DNSE_API_SECRET });
const ma = (process.argv[2] || "VPB").toUpperCase();
const gio = (iso) => Math.floor(new Date(iso).getTime() / 1000);

// 1) sau lich su: moi moc 1 lan limit=2 trong 09:00-09:30
for (const ngay of ["2026-05-04", "2026-04-15", "2026-04-01", "2026-03-16", "2026-03-04", "2026-02-10"]) {
  const r = await md.trades(ma, gio(`${ngay}T09:00:00+07:00`), gio(`${ngay}T09:30:00+07:00`), { limit: 2 });
  console.log(`trades ${ngay}: HTTP ${r.status} n=${r.json?.trades?.length ?? "-"} ${r.json?.trades?.[0]?.time ?? String(r.text).slice(0, 80)}`);
}

// 2) 1 phien day du: keo het qua nextPageToken
const ngayTest = "2026-10-23";
const tu = gio(`${ngayTest}T09:00:00+07:00`), den = gio(`${ngayTest}T15:00:00+07:00`);
let token = null, soTrang = 0, tong = [];
const t0 = Date.now();
do {
  const q = token ? { nextPageToken: token } : {};
  const r = await md.trades(ma, tu, den, { limit: 1000, ...q });
  if (r.status !== 200) { console.log("loi trang", soTrang, r.status, String(r.text).slice(0, 200)); break; }
  tong.push(...r.json.trades);
  token = r.json.nextPageToken || null;
  soTrang++;
} while (token && soTrang < 40);
console.log(`\n${ma} ${ngayTest}: ${tong.length} ban ghi, ${soTrang} trang, ${Date.now() - t0}ms; trang dau ${tong[0]?.time} ... cuoi ${tong[tong.length - 1]?.time}`);
const vol = tong.reduce((s, x) => s + x.matchQtty, 0);
const buy = tong.filter((x) => x.side === "BUY").reduce((s, x) => s + x.matchQtty, 0), sell = tong.filter((x) => x.side === "SELL").reduce((s, x) => s + x.matchQtty, 0);
console.log(`tong KL tu trades=${vol} (BUY ${buy} / SELL ${sell} / khac ${vol - buy - sell}); totalVolumeTraded cuoi = ${Math.max(...tong.map((x) => x.totalVolumeTraded))}`);
console.log("side distinct:", [...new Set(tong.map((x) => x.side))].join(","), "| boardId:", [...new Set(tong.map((x) => x.boardId))].join(","));
// nhom theo (thoi diem ms + chieu) = 1 lenh chu dong
const nhom = new Map();
for (const x of tong) { const k = `${x.time}|${x.side}`; nhom.set(k, (nhom.get(k) ?? 0) + x.matchQtty * x.matchPrice); }
const gt = [...nhom.values()].map((v) => v * 1000 / 1e6).sort((a, b) => b - a); // trieu dong
console.log(`so lenh chu dong (nhom theo ms+chieu) = ${nhom.size}; lon nhat ${gt[0]?.toFixed(0)} tr, trung vi ${gt[Math.floor(gt.length / 2)]?.toFixed(1)} tr, so lenh >= 500tr: ${gt.filter((v) => v >= 500).length}, >= 1 ty: ${gt.filter((v) => v >= 1000).length}`);
console.log("mau 3 ban ghi giua phien:", JSON.stringify(tong.slice(Math.floor(tong.length / 2), Math.floor(tong.length / 2) + 3).map((x) => [x.time, x.matchPrice, x.matchQtty, x.side])));

// 3) foreign-trading: bao nhieu ban ghi / phien
const fr = await md.nuocNgoai(ma, tu, den, { limit: 1000 });
console.log(`\nforeign-trading ${ngayTest}: HTTP ${fr.status} n=${fr.json?.foreigners?.length} next=${!!fr.json?.nextPageToken}; cuoi: ${JSON.stringify(fr.json?.foreigners?.[0] ?? fr.text).slice(0, 300)}`);
