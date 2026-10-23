// MCDX / BANKER CO LAM LENH DUNG HON KHONG? (Hieu 2026-10-23: "test them luc dung mcdx, co banker thi lenh dung hon ko").
// MCDX goc la script TradingView DONG (invite-only) nen KHONG co cong thuc chinh thuc - day la BAN TAI TAO theo cac cong thuc luu hanh (RSI 50, do nhay 1,5, goc 30):
//   Banker = 1,5 x (chi bao - 50), khong kep; chi bao = RSI(dong cua, 50) [bien the "RSI"] hoac MFI(50) co khoi luong [bien the "MFI"]; "co banker" = Banker > 0 (chi bao > 50); "cao" = Banker > 7,5 (chi bao > 55).
// Do tren (1) lenh MUA thuong cua he thong (2014-2026, vao MO CUA phien ke tiep, cat lo engine, ban tu T+3, phi 0,4%) va (2) diem B (mua phuc hoi, giam >= 15%, lai sau 10 / 20 phien ke tu mo cua phien ke tiep, tru phi 0,4%).
// Nhom theo gia tri Banker tai nen tin hieu: am (<= -7,5) | yeu (-7,5-0] | kha (0-7,5] | cao (> 7,5); them: Banker TANG so voi 5 phien truoc. Truoc 2022-05 / tu 2022-05. CHI DOC cache.
// CACH CHAY: node engine/dich-vu/nghienCuuMcdxBanker.mjs
import { docJson, chayEngine, moPhongThucTe } from "./backtestChung.mjs";
import { rsi, mfi, atr as atrFn } from "../loi/taChiBao.js";
import { tinhIchimoku, tinhDuongCanBangDaiHan } from "../loi/ichimoku.js";
import { tinhDiemMuaPhucHoi } from "../loi/diemMuaPhucHoi.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const CP = 0.4;
// Lan chay dau dung goc 30 + kep 0-20 -> RSI(50) >= 43 la ra tran (gan nhu moi lenh deu "banker cao") nen KHONG phan biet duoc gi. Dung goc 50, KHONG kep: 1,5 x (chi bao - 50), am = luc ban chi phoi.
const banker = (v) => (v == null || !Number.isFinite(v) ? null : 1.5 * (v - 50));

const chuoi = new Map(); // ma -> { rsi: [], mfi: [] }
const layChuoi = (ma) => {
  if (chuoi.has(ma)) return chuoi.get(ma);
  const nen = cache[ma];
  const close = nen.map((x) => x.c), high = nen.map((x) => x.h), low = nen.map((x) => x.l), volume = nen.map((x) => x.v ?? 0);
  const kq = { rsi: rsi({ close }, 50).map(banker), mfi: mfi({ high, low, close, volume }, 50).map(banker), t: nen.map((x) => x.t) };
  chuoi.set(ma, kq);
  return kq;
};
const NHOM = [["am (<= -7,5)", (b) => b <= -7.5], ["yeu (-7,5-0]", (b) => b > -7.5 && b <= 0], ["kha (0-7,5]", (b) => b > 0 && b <= 7.5], ["cao (> 7,5)", (b) => b > 7.5]];
const BIEN_THE = ["rsi", "mfi"];
const TEN_BT = { rsi: "RSI(50)", mfi: "MFI(50)" };

function bang(ten, a, cacCot) {
  // a: [{ ky, ret (hoac r10/r20), rsi: {b, tang}, mfi: {...} }]
  for (const [tk, loc] of [["TRUOC 2022-05", (x) => x.ky === 0], ["TU 2022-05", (x) => x.ky === 1]]) {
    const d = a.filter(loc);
    console.log(`\n######## ${ten} | ${tk}: ${d.length} lenh | TB chung ${cacCot.map((c) => `${c} ${f(tb(d.map((x) => x[c]).filter(Number.isFinite)))}`).join(" | ")} ########`);
    for (const bt of BIEN_THE) {
      console.log(` -- Banker ${TEN_BT[bt]}`);
      for (const [tn, cond] of [...NHOM.map(([n, c]) => [n, (x) => x[bt].b != null && c(x[bt].b)]), ["CAO (> 7,5) va dang TANG", (x) => x[bt].b != null && x[bt].b > 7.5 && x[bt].tang === true], ["CO banker (> 0)", (x) => x[bt].b != null && x[bt].b > 0], ["KHONG banker (<= 0)", (x) => x[bt].b != null && x[bt].b <= 0]]) {
        const g = d.filter(cond);
        if (g.length < 25) { console.log(`   ${tn.padEnd(26)} n=${String(g.length).padStart(4)} (it mau)`); continue; }
        const dong = cacCot.map((c) => { const r = g.map((x) => x[c]).filter(Number.isFinite); return `${c} ${f(tb(r)).padStart(6)} [thang ${f((r.filter((v) => v > 0).length / r.length) * 100, 0)}%]`; }).join(" | ");
        console.log(`   ${tn.padEnd(26)} n=${String(g.length).padStart(4)} | ${dong}`);
      }
    }
  }
}

// ---------- (1) lenh MUA thuong ----------
const { lenh } = chayEngine({ cache, vni });
const mua = [];
for (const t of lenh) {
  if (t.loai !== 1 || t.iv < 260 || t.iv + 5 >= t.n) continue;
  const E = t.open[t.iv + 1];
  if (!(E > 0) || !(E > t.S)) continue;
  const ret = moPhongThucTe(t, { E, vao: t.iv + 1, banTu: t.iv + 3 });
  if (ret == null || !Number.isFinite(ret)) continue;
  const c = layChuoi(t.ma);
  const o = { ky: t.ngay < "2022-05-01" ? 0 : 1, ret };
  for (const bt of BIEN_THE) { const b = c[bt][t.iv], b5 = c[bt][t.iv - 5]; o[bt] = { b, tang: b != null && b5 != null ? b > b5 : null }; }
  mua.push(o);
}
console.log(`${mua.length} lenh MUA thuong`);
bang("LENH MUA THUONG (lai/lenh sau cat lo-TP-ban cua he thong)", mua, ["ret"]);

// ---------- (2) diem B ----------
const dB = [];
for (const [ma, b0] of Object.entries(cache)) {
  const b = b0.length > 1500 ? b0.slice(-1500) : b0;
  if (b.length < 300) continue;
  const n = b.length, high = b.map((x) => x.h), low = b.map((x) => x.l), close = b.map((x) => x.c), volume = b.map((x) => x.v), open = b.map((x) => x.o);
  const ich = tinhIchimoku({ high, low }), cb = tinhDuongCanBangDaiHan({ high, low }), a = atrFn({ high, low, close }, 14);
  const { laB, moTa } = tinhDiemMuaPhucHoi({ high, low, close, volume, atr: a, tenkan: ich.tenkan, kijun: ich.kijun, cloudTop: ich.cloudTop, cbTop: cb.cbTop }, { giamTuPct: 20, giamDenPct: 30 });
  const rs = rsi({ close }, 50).map(banker), mf = mfi({ high, low, close, volume: volume.map((v) => v ?? 0) }, 50).map(banker);
  for (let i = 60; i < n - 21; i++) {
    if (!laB[i]) continue;
    const E = open[i + 1];
    if (!(E > 0)) continue;
    const o = { ky: b[i].t < "2022-05-01" ? 0 : 1, r10: (close[i + 10] / E - 1) * 100 - CP, r20: (close[i + 20] / E - 1) * 100 - CP };
    o.rsi = { b: rs[i], tang: rs[i] != null && rs[i - 5] != null ? rs[i] > rs[i - 5] : null };
    o.mfi = { b: mf[i], tang: mf[i] != null && mf[i - 5] != null ? mf[i] > mf[i - 5] : null };
    dB.push(o);
  }
}
console.log(`\n\n${dB.length} diem B (giam 20-30%)`);
bang("DIEM B (giam 20-30%, mua mo cua phien ke tiep, khong cat lo)", dB, ["r10", "r20"]);
