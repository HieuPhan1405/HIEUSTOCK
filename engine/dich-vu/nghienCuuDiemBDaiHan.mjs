// DIEM B / BAT DAY DE DAU TU DAI HAN, VA BAN THE NAO CHO DUNG (Hieu 03/11/2026).
// Chi dung gia (nen_dai.json), 2014 -> nay. Von hoa = gia x so CP HIEN TAI (xap xi, thien lech nhin truoc + nguoi song sot). Mua o gia MO CUA phien sau tin hieu, phi 0,4%/vong.
// PHAN 1: diem B (giam 20-30% tu dinh 20 phien roi dong cua tren Tenkan + Kijun, day cach >= 3 phien, GTGD TB20 >= 3 ty, moi nhip 1 lan - nhu engine/loi/diemMuaPhucHoi.js)
//   lam DIEM VAO DAI HAN: loi suat 3 / 6 / 12 / 24 thang sau diem B so voi MUA BAT KY NGAY (moi 5 phien cung ro, cung dieu kien thanh khoan / von hoa).
//   Hai ro: von hoa >= 2.000 ty va von hoa >= 10.000 ty (bluechip hien nay).
// PHAN 2: CACH BAN dai han. Diem vao: (a) cuoi moi thang, (b) diem B; ro: 30 ma von hoa lon nhat hien nay. Giu toi da 36 thang. Cach ban:
//   HOLD (khong ban) | TIME12 (ban sau 12 thang) | TARGET50 / TARGET100 (ban het khi lai >= 50% / 100%) | STOP15 / STOP25 (cat lo so voi gia von, khong dat lai)
//   | TRAIL25 / TRAIL35 (ban het khi dong cua giam 25% / 35% tu dinh dong cua ke tu luc mua) | SMA200 / CANBANG (ban khi dong cua THUNG SMA200 / duong can bang dai han duoi, chi sau khi gia tung o tren no ke tu luc mua)
//   | KET HOP = TRAIL35 + TARGET100.
//   Do: loi suat TB luc ban (tien mat sau do 0%, tinh den het 36 thang), thoi gian giu TB, ty le lo > 20%, xau nhat, va CHENH LECH so voi HOLD cung diem vao (ghep cap).
// Chay: node engine/dich-vu/nghienCuuDiemBDaiHan.mjs
import { docJson, tb, md, f } from "./backtestChung.mjs";
import { SO_CP_LUU_HANH } from "../../lib/soCoPhieuLuuHanh.js";
import { tinhCanBang } from "../../lib/chiBaoKyThuat.js";

const nen = docJson("nen_dai.json");
const CP = 0.4;
const hh = (a, i, n) => { let m = -Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const sma = (a, n) => { const o = new Array(a.length).fill(null); let s = 0; for (let i = 0; i < a.length; i++) { s += a[i]; if (i >= n) s -= a[i - n]; if (i >= n - 1) o[i] = s / n; } return o; };

// ---------- chuan bi du lieu tung ma ----------
const D = [];
for (const [ma, b] of Object.entries(nen)) {
  if (b.length < 400 || !SO_CP_LUU_HANH[ma]) continue;
  const n = b.length, o = b.map((x) => x.o), c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v);
  const cb = tinhCanBang(b);
  const gt20 = new Array(n).fill(0); let s = 0;
  for (let i = 0; i < n; i++) { s += (c[i] * v[i]) / 1e6; if (i >= 20) s -= (c[i - 20] * v[i - 20]) / 1e6; gt20[i] = s / 20; }
  D.push({ ma, b, n, o, c, h, l, t: b.map((x) => x.t), sma200: sma(c, 200), gb: cb.bot, gt20, von: c[n - 1] * 1000 * SO_CP_LUU_HANH[ma] });
}
console.log(`${D.length} ma`);
const HOR = [63, 126, 252, 504]; // phien ~ 3 / 6 / 12 / 24 thang

// ---------- PHAN 1: diem B lam diem vao dai han ----------
const evB = []; // {d, i, von, ky}
const ctl = [];
for (const d of D) {
  let ult = -99;
  for (let i = 130; i < d.n - 2; i++) {
    if (d.gt20[i] < 3) continue;
    const ky = d.t[i] < "2022-05-01" ? 0 : 1;
    if (i % 5 === 0) ctl.push({ d, i, ky });
    let giam = 0; for (let k = 0; k <= 10; k++) giam = Math.max(giam, (1 - d.c[i - k] / hh(d.h, i - k, 20)) * 100);
    if (giam < 10) continue;
    const tk = (hh(d.h, i, 9) + ll(d.l, i, 9)) / 2, kj = (hh(d.h, i, 17) + ll(d.l, i, 17)) / 2;
    const day = ll(d.l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (d.l[j] <= day) kDay = j;
    if (!(d.c[i] > tk && d.c[i] > kj && i - kDay >= 3 && i - ult >= 15)) continue;
    ult = i;
    if (giam >= 20 && giam < 30) evB.push({ d, i, ky });
  }
}
const ret = (e, H) => (e.i + 1 + H < e.d.n ? (e.d.c[e.i + 1 + H] / e.d.o[e.i + 1] - 1) * 100 - CP : null);
function dong(ten, ds, H, doiChung) {
  const r = ds.map((e) => ret(e, H)).filter((x) => x != null);
  const rc = doiChung.map((e) => ret(e, H)).filter((x) => x != null);
  if (r.length < 5) return `${ten}: n/a`;
  return `${ten.padEnd(28)} n=${String(r.length).padStart(5)} | TB ${f(tb(r), 1).padStart(6)}% | trung vi ${f(md(r), 1).padStart(6)}% | thang ${f((r.filter((x) => x > 0).length / r.length) * 100, 0).padStart(3)}% | lo>20% ${f((r.filter((x) => x < -20).length / r.length) * 100, 0).padStart(3)}% | doi chung (moi ngay) TB ${f(tb(rc), 1).padStart(6)}% | chenh ${f(tb(r) - tb(rc), 1).padStart(5)}`;
}
console.log("\n################ PHAN 1 - DIEM B (giam 20-30%) LAM DIEM VAO DAI HAN, so voi mua bat ky ngay cung ro ################");
for (const [tenRo, dkVon] of [["von hoa >= 2.000 ty", 2e12], ["von hoa >= 10.000 ty (bluechip nay)", 1e13]]) {
  console.log(`\n=== ${tenRo} ===`);
  const E = evB.filter((e) => e.d.von >= dkVon), K = ctl.filter((e) => e.d.von >= dkVon);
  for (const H of HOR) {
    console.log(`-- Giu ${Math.round(H / 21)} thang --`);
    console.log("  " + dong("Toan bo 2014 -> nay", E, H, K));
    console.log("  " + dong("Truoc 2022.5", E.filter((e) => e.ky === 0), H, K.filter((e) => e.ky === 0)));
    console.log("  " + dong("Tu 2022.5", E.filter((e) => e.ky === 1), H, K.filter((e) => e.ky === 1)));
  }
}

// ---------- PHAN 2: cach ban ----------
const H36 = 756;
function sim(d, i0, luat) {
  const E = d.o[i0 + 1];
  if (!(E > 0) || i0 + 1 + H36 >= d.n) return null;
  let dinh = E, daTrenSma = false, daTrenGb = false;
  const lap = (j, rr) => ({ ret: (d.c[j] / E - 1) * 100 - CP, thang: (j - (i0 + 1)) / 21, thoat: rr });
  for (let j = i0 + 2; j <= i0 + 1 + H36; j++) {
    const c = d.c[j];
    dinh = Math.max(dinh, c);
    if (d.sma200[j] != null && c > d.sma200[j]) daTrenSma = true;
    if (d.gb[j] != null && c > d.gb[j]) daTrenGb = true;
    const lai = c / E - 1;
    if (luat === "TIME12" && j - (i0 + 1) >= 252) return lap(j, 1);
    if (luat === "TARGET50" && lai >= 0.5) return lap(j, 1);
    if (luat === "TARGET100" && lai >= 1.0) return lap(j, 1);
    if (luat === "STOP15" && lai <= -0.15) return lap(j, 1);
    if (luat === "STOP25" && lai <= -0.25) return lap(j, 1);
    if (luat === "TRAIL25" && c <= dinh * 0.75) return lap(j, 1);
    if (luat === "TRAIL35" && c <= dinh * 0.65) return lap(j, 1);
    if (luat === "SMA200" && daTrenSma && d.sma200[j] != null && c < d.sma200[j]) return lap(j, 1);
    if (luat === "CANBANG" && daTrenGb && d.gb[j] != null && c < d.gb[j]) return lap(j, 1);
    if (luat === "KET HOP (TRAIL35 + TARGET100)" && (c <= dinh * 0.65 || lai >= 1.0)) return lap(j, 1);
  }
  return { ...lap(i0 + 1 + H36, 0) };
}
const LUAT = ["HOLD", "TIME12", "TARGET50", "TARGET100", "STOP15", "STOP25", "TRAIL25", "TRAIL35", "SMA200", "CANBANG", "KET HOP (TRAIL35 + TARGET100)"];
const RONG = process.argv[2] === "rong"; // rong: moi ma von hoa hien nay >= 2.000 ty (it thien lech chon theo von hoa nay hon top 30)
const top30 = RONG ? D.filter((d) => d.von >= 2e12) : [...D].sort((a, b) => b.von - a.von).slice(0, 30);
console.log(`\n\n################ PHAN 2 - CACH BAN DAI HAN (${RONG ? "moi ma von hoa hien nay >= 2.000 ty: " + top30.length + " ma" : "ro 30 ma von hoa lon nhat hien nay: " + top30.slice(0, 12).map((d) => d.ma).join(" ") + "..."}; giu toi da 36 thang, tien mat sau khi ban 0%) ################`);
const diemVao = {
  "Vao cuoi MOI THANG": [],
  "Vao tai DIEM B": [],
};
for (const d of top30) {
  for (let i = 260; i < d.n - 1; i++) {
    if (d.gt20[i] < 5) continue;
    if (d.t[i].slice(0, 7) !== d.t[i + 1].slice(0, 7)) diemVao["Vao cuoi MOI THANG"].push({ d, i, ky: d.t[i] < "2022-05-01" ? 0 : 1 });
  }
}
for (const e of evB) if (top30.includes(e.d)) diemVao["Vao tai DIEM B"].push(e);
for (const [ten, ds] of Object.entries(diemVao)) {
  for (const [kyTen, loc] of [["toan bo", () => true], ["tu 2022.5", (e) => e.ky === 1]]) {
    const sel = ds.filter(loc);
    const base = sel.map((e) => sim(e.d, e.i, "HOLD"));
    const ok = sel.map((e, k) => (base[k] ? k : -1)).filter((k) => k >= 0);
    console.log(`\n=== ${ten} | ${kyTen} | n = ${ok.length} diem vao (du 36 thang du lieu) ===`);
    console.log("Cach ban".padEnd(32), "TB luc ban".padStart(11), "trung vi".padStart(9), "giu TB (thang)".padStart(15), "ban som%".padStart(9), "lo>20%".padStart(7), "xau nhat".padStart(9), "chenh vs HOLD".padStart(14), "thang hon HOLD".padStart(15));
    for (const luat of LUAT) {
      const kq = ok.map((k) => sim(sel[k].d, sel[k].i, luat));
      const r = kq.map((x) => x.ret), r0 = ok.map((k) => base[k].ret);
      console.log(luat.padEnd(32), (f(tb(r), 1) + "%").padStart(11), (f(md(r), 1) + "%").padStart(9), f(tb(kq.map((x) => x.thang)), 1).padStart(15), (f((kq.filter((x) => x.thoat).length / kq.length) * 100, 0) + "%").padStart(9), (f((r.filter((x) => x < -20).length / r.length) * 100, 0) + "%").padStart(7), (f(Math.min(...r), 0) + "%").padStart(9), f(tb(r.map((x, k) => x - r0[k])), 1).padStart(14), `${f((r.filter((x, k) => x > r0[k] + 1e-9).length / r.length) * 100, 0)}%`.padStart(15));
    }
  }
}
