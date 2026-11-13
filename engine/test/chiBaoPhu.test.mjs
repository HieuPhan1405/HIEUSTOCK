// Test tay cho lib/chiBaoPhu.js. Chay: node engine/test/chiBaoPhu.test.mjs
import { ema, rsi, macd, bollinger, stochastic, mfi, adx, vwapTrongNgay } from "../../lib/chiBaoPhu.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => a != null && b != null && Math.abs(a - b) < e;

// EMA
const e = ema([1, 2, 3, 4, 5], 3);
ok("EMA3: 2 nen dau null, nen 3 = trung binh don 2", e[0] === null && e[1] === null && gan(e[2], 2));
ok("EMA3 nen 4 = 4*0.5 + 2*0.5 = 3", gan(e[3], 3), e[3]);
ok("EMA chuoi hang so = hang so", ema(new Array(30).fill(7), 12).slice(11).every((v) => gan(v, 7)));
ok("EMA thieu du lieu -> toan null", ema([1, 2], 5).every((v) => v === null));

// RSI Wilder: vi du kinh dien 14 phien (nguon: StockCharts RSI worksheet) - kiem tra RSI dau tien ~70.46
const gia = [44.3389, 44.0902, 44.1497, 43.6124, 44.3278, 44.8264, 45.0955, 45.4245, 45.8433, 46.0826, 45.8931, 46.0328, 45.614, 46.282, 46.2820 + 0, 46.0328, 45.9, 46.0];
const r = rsi(gia.slice(0, 15), 14);
ok("RSI(14) phien 15 cua vi du StockCharts ~ 70,53", Math.abs(r[14] - 70.53) < 0.1, r[14]);
ok("RSI toan phien tang = 100", gan(rsi([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], 14)[15], 100));
ok("RSI toan phien giam = 0", gan(rsi([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], 14)[15], 0));
ok("RSI hang so = 50", gan(rsi(new Array(20).fill(5), 14)[15], 50));
ok("RSI luon trong [0,100]", rsi(Array.from({ length: 200 }, (_, i) => 100 + Math.sin(i / 3) * 10 + i * 0.05), 14).filter((v) => v != null).every((v) => v >= 0 && v <= 100));

// MACD
const m0 = macd(new Array(60).fill(10));
ok("MACD chuoi hang so = 0 (macd, signal, hist)", m0.macd[59] === 0 && gan(m0.signal[59], 0) && gan(m0.hist[59], 0));
const tang = Array.from({ length: 80 }, (_, i) => 100 + i);
const m1 = macd(tang);
ok("MACD chuoi tang deu: macd > 0 va hist hop le", m1.macd[79] > 0 && m1.hist[79] != null);
ok("MACD: macd bat dau nen 26 (index 25), signal sau 8 nen nua (index 33)", m1.macd[24] === null && m1.macd[25] != null && m1.signal[32] === null && m1.signal[33] != null);

// Bollinger
const b = bollinger(new Array(25).fill(10));
ok("Bollinger hang so: 3 duong trung nhau", gan(b.mid[24], 10) && gan(b.tren[24], 10) && gan(b.duoi[24], 10));
const b2 = bollinger([1, 2, 3, 4, 5], 5, 2);
ok("Bollinger [1..5]: mid 3, sd tong the = sqrt(2) -> tren = 3 + 2*sqrt(2)", gan(b2.mid[4], 3) && gan(b2.tren[4], 3 + 2 * Math.sqrt(2)) && gan(b2.duoi[4], 3 - 2 * Math.sqrt(2)));

// Stochastic
const tangBars = Array.from({ length: 30 }, (_, i) => ({ h: 11 + i, l: 9 + i, c: 11 + i })); // dong cua = cao nhat
const st = stochastic(tangBars);
ok("Stochastic chuoi tang, dong cua = cao: K, D tien ve gan 100", st.k[29] > 85 && st.d[29] > 85, `${st.k[29]} ${st.d[29]}`);
const phang = Array.from({ length: 30 }, () => ({ h: 10, l: 10, c: 10 }));
ok("Stochastic HHV = LLV -> 50", gan(stochastic(phang).k[29], 50));
ok("Stochastic: null truoc du nen", st.k[12] === null && st.d[14] === null);

// MFI
const mfTang = Array.from({ length: 30 }, (_, i) => ({ h: 11 + i, l: 9 + i, c: 10 + i, v: 100 }));
ok("MFI chuoi tang = 100", gan(mfi(mfTang)[29], 100) && mfi(mfTang)[13] === null && mfi(mfTang)[14] != null);
const mfGiam = Array.from({ length: 30 }, (_, i) => ({ h: 51 - i, l: 49 - i, c: 50 - i, v: 100 }));
ok("MFI chuoi giam = 0", gan(mfi(mfGiam)[29], 0));
const mfXen = Array.from({ length: 31 }, (_, i) => ({ h: 11 + (i % 2), l: 9 + (i % 2), c: 10 + (i % 2), v: 100 }));
ok("MFI xen ke len/xuong cung KL ~ 50", Math.abs(mfi(mfXen)[30] - 50) < 5, mfi(mfXen)[30]);
ok("MFI luon trong [0,100]", mfi(Array.from({ length: 200 }, (_, i) => { const c = 100 + Math.sin(i / 4) * 5; return { h: c + 1, l: c - 1, c, v: 50 + (i % 7) * 10 }; })).filter((v) => v != null).every((v) => v >= 0 && v <= 100));

// ADX
const ax = adx(Array.from({ length: 60 }, (_, i) => ({ h: 11 + i, l: 9 + i, c: 10.5 + i })));
ok("ADX xu huong tang deu: DI+ > DI-, ADX cao (> 50)", ax.pdi[59] > ax.mdi[59] && ax.adx[59] > 50, `${ax.pdi[59]} ${ax.mdi[59]} ${ax.adx[59]}`);
ok("ADX: null truoc 2n-1 nen, co gia tri tu nen 2n-1", ax.adx[26] === null && ax.adx[27] != null);
const axG = adx(Array.from({ length: 60 }, (_, i) => ({ h: 71 - i, l: 69 - i, c: 69.5 - i })));
ok("ADX xu huong giam: DI- > DI+", axG.mdi[59] > axG.pdi[59]);

// VWAP trong ngay
const N0 = 20000 * 86400;
const vw = vwapTrongNgay([
  { t: N0 + 9 * 3600, h: 12, l: 8, c: 10, v: 100 },
  { t: N0 + 9 * 3600 + 60, h: 22, l: 18, c: 20, v: 300 },
  { t: N0 + 86400 + 9 * 3600, h: 31, l: 29, c: 30, v: 10 },
]);
ok("VWAP: (10*100 + 20*300)/400 = 17,5; sang phien moi bat dau lai = 30", gan(vw[0], 10) && gan(vw[1], 17.5) && gan(vw[2], 30), vw.join(","));
ok("VWAP: nen chua co KL -> null", vwapTrongNgay([{ t: N0, h: 1, l: 1, c: 1, v: 0 }])[0] === null);

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
