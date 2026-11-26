// Test tay cho phan sua nen 1 gio / 30 phut trong lib/lichSuGia.js. Chay: node engine/test/nenNoiNgay.test.mjs
// Them "--that" de doi chieu voi nguon gia that (can mang): nen 1 gio / 30 phut dung phai khop nen 1 phut.
import { canGopTu15Phut, gopNenTheoBuoc, layNenNoiNgay, layNenPhutNgay } from "../../lib/lichSuGia.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

ok("chi so: gop ca khung 1 gio va 30 phut", canGopTu15Phut("VNINDEX", "H") && canGopTu15Phut("VNINDEX", "M30") && canGopTu15Phut("VN30", "H"));
ok("co phieu: chi gop khung 30 phut", canGopTu15Phut("FPT", "M30") && !canGopTu15Phut("FPT", "H"));
ok("phai sinh va khung khac: khong gop", !canGopTu15Phut("VN30F1M", "H") && !canGopTu15Phut("VN30F1M", "M30") && !canGopTu15Phut("VNINDEX", "M15") && !canGopTu15Phut("FPT", "M5"));

const t = (gio, phut) => Date.UTC(2026, 10, 26, gio, phut) / 1000; // gio Viet Nam (da cong 7 gio)
const n15 = [
  { t: t(9, 15), o: 10, h: 12, l: 9, c: 11, v: 100 },
  { t: t(9, 30), o: 11, h: 15, l: 10, c: 14, v: 200 },
  { t: t(9, 45), o: 14, h: 14, l: 8, c: 13, v: 300 },
  { t: t(10, 0), o: 13, h: 13.5, l: 12, c: 12.5, v: 50 },
];
const g = gopNenTheoBuoc(n15, 3600);
ok("gop 1 gio: nen 9h giu du mo / cao / thap / dong / khoi luong", g.length === 2 && g[0].t === t(9, 0) && g[0].o === 10 && g[0].h === 15 && g[0].l === 8 && g[0].c === 13 && g[0].v === 600 && g[1].t === t(10, 0));
const g30 = gopNenTheoBuoc(n15, 1800);
ok("gop 30 phut: 9:00 (chi co 9:15), 9:30, 10:00", g30.length === 3 && g30[0].t === t(9, 0) && g30[1].t === t(9, 30) && g30[1].v === 500 && g30[1].l === 8);
ok("khong sua mang dau vao", n15[0].t === t(9, 15) && n15[0].v === 100);

if (process.argv.includes("--that")) {
  for (const [ma, khung, buoc] of [["VNINDEX", "H", 3600], ["VN30", "H", 3600], ["VNINDEX", "M30", 1800], ["FPT", "M30", 1800], ["FPT", "H", 3600]]) {
    const nen = await layNenNoiNgay(ma, khung);
    const ngay = [...new Set(nen.map((b) => new Date(b.t * 1000).toISOString().slice(0, 10)))].slice(-4, -1);
    let tong = 0, lech = 0;
    for (const d of ngay) {
      const m1 = (await layNenPhutNgay(ma, d)).map((b) => ({ ...b, t: b.t + 7 * 3600 }));
      const dung = gopNenTheoBuoc(m1, buoc);
      for (const x of dung) {
        const y = nen.find((b) => b.t === x.t);
        tong++;
        if (!y || Math.abs(y.h - x.h) > 0.011 || Math.abs(y.l - x.l) > 0.011 || Math.abs(y.o - x.o) > 0.011 || Math.abs(y.c - x.c) > 0.011) lech++;
      }
    }
    ok(`du lieu that ${ma} ${khung}: khop nen 1 phut (${ngay.join(", ")})`, tong > 0 && lech === 0, `lech ${lech}/${tong}`);
  }
}

console.log(loi ? `\n${loi} LOI` : "\nTat ca dat.");
process.exit(loi ? 1 : 0);
