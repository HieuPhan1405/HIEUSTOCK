// TAI TICK THAT (co CHIEU khop mua / ban chu dong) cua hop dong VN30F1M tu DNSE REST /price/{ma}/trades -> engine/output/tick_phaisinh/YYYY-MM-DD.json (CHI DOC).
// Moi ngay lay ma hop dong thang gan nhat (xem hopDongGanNhat). Lich su tick con tu ~04-05/2026 - dung de KIEM TRA CVD xap xi tu nen 1 phut va thu footprint that.
// Moi file: { t: [mili-giay trong ngay], p: [gia], q: [KL], s: [+1 mua chu dong | -1 ban chu dong | 0 khong ro] }, tang dan theo thoi gian khop.
// Chay: node --env-file=.env.dnse.local engine/dich-vu/taiTickPhaiSinh.mjs [tu=2026-09-16] [den=2026-11-06]
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { taoMarketData } from "../dnse/marketDataRest.js";
import { phanTichThoiGian } from "../loi/dongTienChuDong.js";

const GOC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "output", "tick_phaisinh");
mkdirSync(GOC, { recursive: true });
const arg = (k, d) => process.argv.find((a) => a.startsWith(k + "="))?.split("=")[1] ?? d;
const tu = arg("tu", "2026-09-16"), den = arg("den", "2026-11-06");
// Hop dong gan nhat (F1M) cua tung ngay: thang co thu Nam tuan 3 >= ngay do (ngay dao han van la hop dong cu, phien SAU la hop dong moi - giong phaisinh_chung.sauDao).
// Ma = "41I1" + chu nam (2026 = G, 2025 = F) + thang (1-9, A, B, C) + "000".
const thuNamTuan3 = (y, m) => { const d = new Date(Date.UTC(y, m - 1, 1)); let dem = 0; for (; ; d.setUTCDate(d.getUTCDate() + 1)) if (d.getUTCDay() === 4 && ++dem === 3) return d.toISOString().slice(0, 10); };
const maThang = (y, m) => "41I1" + String.fromCharCode(70 + (y - 2025)) + "123456789ABC"[m - 1] + "000";
function hopDongGanNhat(ngay) {
  let y = Number(ngay.slice(0, 4)), m = Number(ngay.slice(5, 7));
  if (ngay > thuNamTuan3(y, m)) { m++; if (m > 12) { m = 1; y++; } }
  return maThang(y, m);
}
const md = taoMarketData({ apiKey: process.env.DNSE_API_KEY, apiSecret: process.env.DNSE_API_SECRET });
const gio = (iso) => Math.floor(new Date(iso).getTime() / 1000);

async function mot(ngay, MA) {
  const dau = gio(`${ngay}T08:40:00+07:00`);
  let toi = gio(`${ngay}T15:05:00+07:00`);
  const duy = new Map();
  let goi = 0, dung = 0;
  while (toi > dau && goi < 900) {
    let r = await md.trades(MA, dau, toi, { limit: 1000 });
    for (let lan = 0; r.status === 429 && lan < 12; lan++) { await new Promise((o) => setTimeout(o, 20000)); r = await md.trades(MA, dau, toi, { limit: 1000 }); } // bi gioi han toc do: cho roi thu lai
    goi++;
    if (r.status !== 200) { console.log(ngay, "loi", r.status, "- bo ngay nay (khong luu do dang)"); return { a: [], goi }; }
    await new Promise((o) => setTimeout(o, 120));
    const ds = r.json.trades ?? [];
    if (!ds.length) break;
    const truoc = duy.size;
    for (const x of ds) duy.set(`${x.time}|${x.matchPrice}|${x.matchQtty}|${x.totalVolumeTraded}`, x);
    const tp = phanTichThoiGian(ds[ds.length - 1].time);
    const giay = gio(`${tp.ngay}T${tp.gio}+07:00`);
    if (duy.size === truoc) { dung++; toi = giay - 1; if (dung > 3) break; continue; }
    dung = 0;
    toi = giay === toi ? giay - 1 : giay;
  }
  const a = [...duy.values()].sort((x, y) => (x.totalVolumeTraded - y.totalVolumeTraded) || (x.time < y.time ? -1 : 1));
  return { a, goi };
}

for (let d = new Date(tu + "T00:00:00Z"); d <= new Date(den + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)) {
  const ngay = d.toISOString().slice(0, 10);
  if ([0, 6].includes(d.getUTCDay())) continue;
  const file = path.join(GOC, ngay + ".json");
  if (existsSync(file)) { console.log(ngay, "da co"); continue; }
  const t0 = Date.now();
  const MA = hopDongGanNhat(ngay);
  const { a, goi } = await mot(ngay, MA);
  if (!a.length) { console.log(ngay, "khong co tick"); continue; }
  const o = { t: [], p: [], q: [], s: [] };
  for (const x of a) {
    const tp = phanTichThoiGian(x.time);
    o.t.push(tp.ms); o.p.push(x.matchPrice); o.q.push(x.matchQtty); o.s.push(x.side === "BUY" ? 1 : x.side === "SELL" ? -1 : 0);
  }
  writeFileSync(file, JSON.stringify(o));
  const tong = o.q.reduce((s, v) => s + v, 0), kl = a.at(-1).totalVolumeTraded;
  console.log(ngay, MA, a.length, "tick,", goi, "goi,", ((Date.now() - t0) / 1000).toFixed(0) + "s | tong matchQtty", tong, "| totalVolumeTraded cuoi", kl);
}
process.exit(0);
