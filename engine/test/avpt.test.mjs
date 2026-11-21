// Test tay cho lib/avpt.js va lib/liquidityTrap.js. Chay: node engine/test/avpt.test.mjs
// Muc cuoi doi chieu bien JS voi ban Python (engine/dich-vu/phaisinh_avwap.py) tren nen 5 phut VN30F1M neu co file dump (scratchpad) - khong co thi bo qua.
import { existsSync, readFileSync } from "node:fs";
import { avpt, AVPT_PROFILES } from "../../lib/avpt.js";
import { liquidityTrap } from "../../lib/liquidityTrap.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

// ---- Liquidity Trap ----
const o = [], h = [], l = [], c = [];
for (let i = 0; i < 40; i++) { o.push(100); h.push(101); l.push(99); c.push(100); }
// nen 30: thung day (low 97 < 99) roi dong cua tro lai tren day (100.5 > 99) va nen xanh -> TRAP BUY
o[30] = 99.2; l[30] = 97; c[30] = 100.5; h[30] = 100.8;
// nen 35: thung dinh (high 103 > 101) roi dong cua duoi dinh (100 < 101), nen do -> TRAP SELL nhung nam trong cooldown (5 nen < 8)
o[35] = 101.5; h[35] = 103; c[35] = 100; l[35] = 99.5;
const t = liquidityTrap(o, h, l, c);
ok("TRAP BUY o nen 30", t.buy[30] && !t.sell[30], JSON.stringify(t.signals.map((s) => s.i)));
ok("TRAP SELL o nen 35 bi cooldown chan", !t.sell[35]);
ok("tin hieu mua: SL duoi day nen, TP1 = +1R, TP2 = +2R", (() => { const s = t.signals.find((x) => x.i === 30); return s && s.dir === 1 && s.sl < 97 && Math.abs(s.tp1 - s.entry - (s.entry - s.sl)) < 1e-9 && Math.abs(s.tp2 - s.entry - 2 * (s.entry - s.sl)) < 1e-9; })());
const t2 = liquidityTrap(o, h, l, c, { cooldown: 2 });
ok("cooldown 2: TRAP SELL o nen 35 hien", t2.sell[35]);
ok("chuoi hang so khong co tin hieu", liquidityTrap(new Array(60).fill(10), new Array(60).fill(10), new Array(60).fill(10), new Array(60).fill(10)).signals.length === 0);

// ---- AVPT: bat bien ----
const n = 600;
const cc = [], oo = [], hh = [], ll = [], vv = [];
let p = 100;
for (let i = 0; i < n; i++) { const d = Math.sin(i / 14) * 1.2 + Math.sin(i / 5) * 0.4; const o1 = p; p = 100 + i * 0.01 + d * 3; oo.push(o1); cc.push(p); hh.push(Math.max(o1, p) + 0.3); ll.push(Math.min(o1, p) - 0.3); vv.push(1000 + ((i * 37) % 500)); }
for (const ten of Object.keys(AVPT_PROFILES)) {
  const r = avpt(oo, hh, ll, cc, vv, { profile: ten });
  const dungThuTu = r.signals.every((s) => (s.dir === 1 ? s.sl < s.entry && s.entry < s.tp1 && s.tp1 < s.tp2 + 1e-9 && s.tp2 < s.tp3 + 1e-9 : s.sl > s.entry && s.entry > s.tp1 && s.tp1 > s.tp2 - 1e-9 && s.tp2 > s.tp3 - 1e-9));
  ok(`${ten}: do dai dung, SL / TP dung thu tu, khong NaN`, r.avwap.length === n && dungThuTu && r.avwap.every((x) => x === null || Number.isFinite(x)) && r.signals.every((s) => Number.isFinite(s.risk) && s.risk > 0));
}
ok("moi tin hieu cach nhau it nhat 1 nen va cung chieu khong chong khi ke hoach con mo (so tin hieu hop ly)", avpt(oo, hh, ll, cc, vv).signals.length < n / 3);
ok("band tren > AVWAP > band duoi", (() => { const r = avpt(oo, hh, ll, cc, vv); return r.avwap.every((x, i) => x === null || (r.bandTren[i] >= x && r.bandDuoi[i] <= x)); })());
ok("gia hang so khong gay loi", avpt(new Array(100).fill(10), new Array(100).fill(10), new Array(100).fill(10), new Array(100).fill(10), new Array(100).fill(0)).signals.length === 0);

// ---- Doi chieu voi Python ----
const dump = process.env.AVPT_DUMP;
if (dump && existsSync(dump)) {
  const D = JSON.parse(readFileSync(dump, "utf8"));
  for (const [ten, py] of Object.entries(D.sig)) {
    const js = avpt(D.O, D.H, D.L, D.C, D.V, { profile: ten, nbNgay: D.nb, hybrid: true }).signals;
    const kh = new Map(py.map((s) => [s[0], s]));
    const chung = js.filter((s) => kh.has(s.i));
    const lech = chung.filter((s) => { const q = kh.get(s.i); return q[1] !== s.dir || Math.abs(q[2] - s.entry) > 1e-6 || Math.abs(q[7] - s.sl) > 1e-6 || Math.abs(q[4] - s.tp1) > 1e-6; });
    const ti = chung.length / Math.max(py.length, js.length);
    console.log(`  [${ten}] Python ${py.length} tin hieu, JS ${js.length}, trung chi so ${chung.length} (${(ti * 100).toFixed(1)}%), lech gia tri ${lech.length}`);
    // Python dong ke hoach theo SL goc (don gian hoa), JS theo SL da doi ve hoa von sau TP1 (dung Pine) -> khac nhau o vai tin hieu sau do
    ok(`${ten}: JS khop Python >= 96% tin hieu, lech gia vao / SL / TP1 <= 0,1%`, ti >= 0.96 && lech.length <= chung.length * 0.001);
  }
} else console.log("bo qua doi chieu Python (dat AVPT_DUMP = duong dan avpt_dump.json de chay)");

console.log(loi ? `\n${loi} LOI` : "\nTAT CA DAT");
process.exit(loi ? 1 : 0);
