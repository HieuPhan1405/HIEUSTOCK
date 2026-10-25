// Test tay cho engine/dich-vu/dongTienRealTime.mjs bang ket noi GIA (khong mang that) + may chu HTTP gia nhan upload. Chay: node engine/test/dongTienRealTime.test.mjs
import http from "node:http";
import { gunzipSync } from "node:zlib";
import { khoiDongDongTien } from "../dich-vu/dongTienRealTime.mjs";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

const nhan = [];
const may = http.createServer((req, res) => {
  const bufs = [];
  req.on("data", (d) => bufs.push(d));
  req.on("end", () => {
    const raw = Buffer.concat(bufs);
    const goi = JSON.parse((req.headers["content-encoding"] === "gzip" ? gunzipSync(raw) : raw).toString());
    nhan.push({ headers: req.headers, goi });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"trangThai":"ok"}');
  });
});
await new Promise((r) => may.listen(0, r));
const port = may.address().port;

// ket noi gia: ghi lai kenh + cho phep ban du lieu vao onData
const kenhDangKy = [];
const onDataTheoKetNoi = [];
const ketNoiGia = (_cred, { kenh = [], onData }) => {
  kenhDangKy.push(...kenh);
  onDataTheoKetNoi.push(onData);
  return { subscribe() {}, dong() {} };
};

const dsMa = Array.from({ length: 391 }, (_, i) => `M${String(i).padStart(3, "0")}`);
const logs = [];
const dv = khoiDongDongTien({ apiKey: "k", apiSecret: "s", dsMa, upload: { goc: `http://localhost:${port}`, key: "khoa-thu" }, ketNoi: ketNoiGia, chiTrongGio: false, log: (s) => logs.push(s) });

const soKetNoi = onDataTheoKetNoi.length;
ok("so ket noi: 391 ma / 196 = 2 nhom x (tick + khoi ngoai) + 1 chi so = 5", soKetNoi === 5, soKetNoi);
ok("kenh: tick_extra.G1.json, foreign.G1.json va 6 kenh market_index", kenhDangKy.filter((k) => k.name === "tick_extra.G1.json").length === 2 && kenhDangKy.filter((k) => k.name === "foreign.G1.json").length === 2 && kenhDangKy.filter((k) => k.name.startsWith("market_index.")).length === 6);
ok("moi ket noi <= 196 ma + chi so rieng", kenhDangKy.every((k) => k.symbols.length <= 196));
const tongTick = kenhDangKy.filter((k) => k.name === "tick_extra.G1.json").reduce((s, k) => s + k.symbols.length, 0);
ok("tick_extra phu du 391 ma", tongTick === 391);

const phat = (loai, doi) => onDataTheoKetNoi[0](loai, doi);
phat("te", { symbol: "M001", boardId: "G1", matchPrice: 24, matchQtty: 30000, side: "BUY", time: "2026-10-23 10:00:00.100" });
phat("te", { symbol: "M001", boardId: "G1", matchPrice: 24, matchQtty: 1000, side: "SELL", time: "2026-10-23 10:00:05.000" });
phat("f", { symbol: "M001", boardId: "G1", totalBuyTradedAmount: 5e9, totalSellTradedAmount: 2e9, totalBuyVolume: 200000, totalSellVolume: 80000, transactTime: "2026-10-23 10:00:06.000" });
phat("mi", { indexName: "VNINDEX", valueIndexes: 1774.15, changedValue: 13.5, changedRatio: 0.77, fluctuationUpIssueCount: 137, fluctuationDownIssueCount: 153, transactTime: "2026-10-23 10:00:06.000" });
ok("dem ban tin theo loai", dv.demLoai.te === 2 && dv.demLoai.f === 1 && dv.demLoai.mi === 1);

await dv.chotCuoiNgay();
ok("da upload 1 goi", nhan.length === 1);
const g = nhan[0].goi;
ok("header: x-api-key va gzip", nhan[0].headers["x-api-key"] === "khoa-thu" && nhan[0].headers["content-encoding"] === "gzip");
ok("goi: ngay, chiTiet = true, nguong, thiTruong, ma", g.ngay === "2026-10-23" && g.chiTiet === true && g.nguong.lonTrieu === 500 && g.thiTruong.tong && g.ma.M001);
ok("ma M001: mua 720 tr (lon, 1 lenh), ban 24 tr, khoi ngoai ron 3 ty = 3.000 tr", Math.abs(g.ma.M001.mua - 720) < 0.1 && Math.abs(g.ma.M001.ban - 24) < 0.1 && g.ma.M001.lon.soLenh === 1 && Math.abs(g.ma.M001.nn.rong - 3000) < 0.1, JSON.stringify(g.ma.M001));
ok("chi tiet: chuoi theo phut + volume profile", g.ma.M001.chiTiet.phut.length === 1 && g.ma.M001.chiTiet.profile.length === 1);
ok("thiTruong co top mua, theo nganh (mang) va chi so", Array.isArray(g.thiTruong.topMua) && g.thiTruong.topMua[0].ma === "M001" && Array.isArray(g.thiTruong.nganh) && g.thiTruong.chiSo.VNINDEX.tang === 137);

dv.dong();
may.close();
if (loi) {
  console.log(`\n${loi} loi`);
  process.exit(1);
}
console.log("\nTat ca dat");
process.exit(0);
