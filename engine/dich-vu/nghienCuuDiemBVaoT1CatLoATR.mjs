// DIEM B: VAO MO CUA T+1 va CAT LO THEO ATR (Hieu 2026-10-22: "test cai diem B co" - cung cau hoi nghienCuuVaoT1CatLoATR.mjs nhung cho diem mua phuc hoi).
// Diem B (giam >= 15% tu dinh 20 phien, dong cua tren Tenkan 9 + Kijun 17, day cach >= 3 phien, GTGD >= 3 ty, 1 lan / 15 phien; engine/loi/diemMuaPhucHoi.js) co SL cau truc (Kijun - 0,5 ATR, 3,5-6%) va TP1 / TP2 / TP3 rieng.
// Quan ly lenh GIONG he thong: 30% TP1 + 30% TP2 + 40% o TP3 hoac het han 15 phien (dong cua), cat lo; sau khi cham TP2 thi cat lo phan con lai ve gia vao; co phieu ve chieu T+2: truoc ngay ban duoc dau tien (vao + 2), cham cat lo thi ban o MO CUA ngay do, cham TP bo lo; phi 0,4%.
// VAO: ATC = dong cua nen B (chi la mo phong neu tin hieu hien trong phien) | T1 = MO CUA phien ke tiep (thuc te nhat: B chi chac chan sau khi dong cua) | T1 gap -2%..+3% | CHO GIA B = lenh mua cho o gia dong cua nen B trong 3 phien ke tiep (khop = min(mo cua, gia B) neu gia thap nhat cham gia B; huy neu da thung SL).
// CAT LO: B engine | ATR k (gia vao - k x ATR14 tai ngay B, kep 3-10%), k = 1,5 / 2 / 3 | co dinh -7%. NHOM: giam 20-30% (dung quy tac engine) | KHUYEN NGHI (giam >= 20% + KL day >= 2x + VN-Index <= -7% so dinh 60 phien) | MOI DIEM B (giam >= 15%).
// Do: lai TB / lenh da vao, ty le lo >= 7%, thang, PF, lai tren moi tin hieu (lenh khong vao = 0). Truoc 2022-05 / tu 2022-05 / 2026. CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuDiemBVaoT1CatLoATR.mjs
import { docJson } from "./backtestChung.mjs";
import { atr as atrFn } from "../loi/taChiBao.js";
import { tinhIchimoku, tinhDuongCanBangDaiHan } from "../loi/ichimoku.js";
import { tinhDiemMuaPhucHoi } from "../loi/diemMuaPhucHoi.js";
import { tinhVniYeuTheoNgay } from "../loi/lichSuDiemB.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const vniYeu = tinhVniYeuTheoNgay(vni);
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const CP = 0.4, HAN = 15, LO = -7;

const ev = [];
for (const [ma, b0] of Object.entries(cache)) {
  const b = b0.length > 1500 ? b0.slice(-1500) : b0; if (b.length < 300) continue;
  const n = b.length, high = b.map((x) => x.h), low = b.map((x) => x.l), close = b.map((x) => x.c), open = b.map((x) => x.o), volume = b.map((x) => x.v);
  const ich = tinhIchimoku({ high, low }), cb = tinhDuongCanBangDaiHan({ high, low }), a = atrFn({ high, low, close }, 14);
  const { laB, moTa } = tinhDiemMuaPhucHoi({ high, low, close, volume, atr: a, tenkan: ich.tenkan, kijun: ich.kijun, cloudTop: ich.cloudTop, cbTop: cb.cbTop }, { giamTuPct: 15, giamDenPct: 999 });
  for (let i = 40; i < n - HAN - 5; i++) {
    if (!laB[i]) continue;
    const m = moTa(i); if (!(m.tp1 > 0 && m.tp2 > 0 && m.tp3 > 0)) continue;
    ev.push({ ma, t: b[i].t, ky: b[i].t < "2022-05-01" ? 0 : 1, nam: Number(b[i].t.slice(0, 4)), giam: m.giam, kl: m.klDay ?? 0, vniYeu: vniYeu.get(b[i].t) === true, i, n, o: open, h: high, l: low, c: close, atr: a[i] ?? close[i] * 0.03, SB: m.sl, tp: [m.tp1, m.tp2, m.tp3] });
  }
}
console.log(`${ev.length} diem B (giam >= 15%) 2014-2026\n`);

function mo(e, { E, vao, banTu, S }) {
  const { o, h, l, c, n, tp } = e;
  if (!(E > 0) || !(S > 0) || !(S < E)) return null;
  const moc = [{ w: 0.3, g: tp[0], xong: false }, { w: 0.3, g: tp[1], xong: false }, { w: 0.4, g: tp[2], xong: false }];
  let conLai = 1, thu = 0, daTP2 = false, choBan = false, dinhTruoc = -Infinity;
  const ban = (w, g) => { thu += w * (g / E); conLai -= w; };
  const kq = () => (thu - 1) * 100 - CP;
  const het = vao + HAN;
  for (let i = vao; i < n; i++) {
    if (i === e.i && vao === e.i) continue;
    if (i < banTu) { if (l[i] <= S) choBan = true; dinhTruoc = Math.max(dinhTruoc, h[i]); continue; }
    if (i === banTu && choBan) { ban(conLai, o[i]); return kq(); }
    if ((i === banTu ? dinhTruoc : h[i - 1]) >= tp[1]) daTP2 = true;
    for (const m of moc) if (!m.xong && o[i] >= m.g) { ban(m.w, o[i]); m.xong = true; }
    let g = null;
    if (l[i] <= S) g = Math.min(o[i], S);
    else if (daTP2 && l[i] <= E) g = Math.min(o[i], E);
    else if (i >= het) g = c[i];
    if (g != null) { if (conLai > 1e-12) ban(conLai, g); return kq(); }
    for (const m of moc) if (!m.xong && h[i] >= m.g) { ban(m.w, m.g); m.xong = true; }
    if (conLai <= 1e-12) return kq();
  }
  return null;
}
const VAO = {
  "ATC (dong cua nen B)": (e) => ({ E: e.c[e.i], vao: e.i, banTu: e.i + 2 }),
  "T1 mo cua": (e) => ({ E: e.o[e.i + 1], vao: e.i + 1, banTu: e.i + 3 }),
  "T1 mo cua gap -2%..+3%": (e) => { const E = e.o[e.i + 1], g = (E / e.c[e.i] - 1) * 100; return g < -2 || g > 3 ? null : { E, vao: e.i + 1, banTu: e.i + 3 }; },
  "CHO GIA B (3 phien)": (e) => { const gia = e.c[e.i]; for (let j = e.i + 1; j <= e.i + 3; j++) { if (e.l[j] <= e.SB) return null; if (e.l[j] <= gia) return { E: Math.min(e.o[j], gia), vao: j, banTu: j + 2 }; } return null; },
};
const STOP = {
  "SL cua B": (e, E) => e.SB,
  "ATR 1,5": (e, E) => Math.min(E * 0.97, Math.max(E * 0.9, E - 1.5 * e.atr)),
  "ATR 2": (e, E) => Math.min(E * 0.97, Math.max(E * 0.9, E - 2 * e.atr)),
  "ATR 3": (e, E) => Math.min(E * 0.97, Math.max(E * 0.9, E - 3 * e.atr)),
  "co dinh -7%": (e, E) => E * 0.93,
};
const pf = (a) => { const w = a.filter((x) => x > 0).reduce((s, x) => s + x, 0), l = -a.filter((x) => x <= 0).reduce((s, x) => s + x, 0); return l ? w / l : NaN; };
function chay(a, vf, sf) {
  const r = [];
  for (const e of a) { const v = vf(e); if (!v) continue; const x = mo(e, { ...v, S: sf(e, v.E) }); if (x != null) r.push(x); }
  return r;
}
const hien = (ten, r, tong) => {
  if (r.length < 25) { console.log(`   ${ten.padEnd(34)} vao ${String(r.length).padStart(4)}/${tong} (it mau)`); return; }
  console.log(`   ${ten.padEnd(34)} vao ${String(r.length).padStart(4)}/${String(tong).padStart(4)} | lai TB ${f(tb(r)).padStart(5)}% | tren moi tin hieu ${f(r.reduce((s, x) => s + x, 0) / tong).padStart(5)}% | lo >= 7% ${f((r.filter((x) => x <= LO).length / r.length) * 100, 1).padStart(4)}% | thang ${f((r.filter((x) => x > 0).length / r.length) * 100, 0)}% | PF ${f(pf(r))}`);
};
const NHOM = [
  ["GIAM 20-30% (quy tac engine)", (e) => e.giam >= 20 && e.giam < 30],
  ["KHUYEN NGHI (giam >= 20% + KL day >= 2x + VNI yeu)", (e) => e.giam >= 20 && e.kl >= 2 && e.vniYeu],
];
for (const [tn, bl] of NHOM) {
  for (const [tk, kl] of [["TRUOC 2022-05 (2017+)", (e) => e.ky === 0 && e.t >= "2017-01-01"], ["TU 2022-05", (e) => e.ky === 1], ["2026", (e) => e.nam === 2026]]) {
    const a = ev.filter((e) => bl(e) && kl(e));
    console.log(`\n######## ${tn} | ${tk}: ${a.length} diem B ########`);
    if (a.length < 40) { console.log("   (it mau)"); continue; }
    for (const [tv, vf] of Object.entries(VAO)) { console.log(` -- vao: ${tv}`); for (const [ts, sf] of Object.entries(STOP)) hien(ts, chay(a, vf, sf), a.length); }
  }
}
