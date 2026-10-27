// BACKTEST CAC MAU CHOT LOI (Hieu 27/10/2026: "test cac mau chot loi"): khi dang giu lenh he thong (lenh Mua thuong, nen_dai.json ~2018 -> 21/10/2026, phi 0,4%/vong), nen xuat hien MAU DAO CHIEU GIAM / DINH thi chot (het hoac 1/2).
// Co so: TK3 = 30% TP1 + 30% TP2, phan con lai Tenkan ban 1/2 + Kijun not (+ BAN, cat lo S, hoa von sau TP2). Moi mau them 1 lan chot (1/2 hoac het phan con lai) o gia DONG CUA nen co mau, chi khi dang lai >= nguong (0% hoac 5%) so voi gia vao.
// Hai phan: (A) GIA TRI DU BAO: sau khi mau xuat hien (khi dang lai >= 5%), gia 5 phien sau thay doi bao nhieu so voi cac nen khac cung trang thai; (B) GIA TRI KHI DUNG LAM LENH CHOT: do doi lai TB / danh muc K=10 so voi co so TK3, 2 quy uoc (THUC TE / LY TUONG) x 3 giai doan.
// Mau: SAO BANG / BUA NGUOC (rau tren dai, dong cua thap), NHAN CHIM GIAM, MAY DEN PHU, SAO HOM, DOJI o dinh, NEN DO DAI + KL lon (>= -4% va KL >= 1,5x), CLIMAX (cao nhat 20 phien, KL >= 2x, dong cua nua duoi), GAP GIAM >= 2%, DONG CUA < THAP NHAT HOM TRUOC sau ngay ky luc,
//   3 NEN DO LIEN TIEP, BOLLINGER (dong cua tung tren dai tren roi quay vao), RSI14 TU >= 75 xuong < 70, DINH DOI (pha day giua 2 dinh trong 40 phien).
// Chay: node engine/dich-vu/backtestMauChotLoi.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, soMa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
console.log(`${lenh.length} lenh Mua thuong (${soMa} ma)`);

// ---- chi bao phu (tinh 1 lan / lenh, luu tren t) ----
function phu(t) {
  if (t._phu) return t._phu;
  const { close, high, n, vol } = t;
  const rsi = new Array(n).fill(NaN);
  let g = 0, l = 0;
  for (let i = 1; i < n; i++) {
    const d = close[i] - close[i - 1], up = Math.max(d, 0), dn = Math.max(-d, 0);
    if (i <= 14) { g += up / 14; l += dn / 14; } else { g = (g * 13 + up) / 14; l = (l * 13 + dn) / 14; }
    if (i >= 14) rsi[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
  }
  const bbUp = new Array(n).fill(NaN), hh20 = new Array(n).fill(NaN), vTB = new Array(n).fill(NaN);
  for (let i = 19; i < n; i++) {
    let s = 0, sv = 0, h = -Infinity;
    for (let j = i - 19; j <= i; j++) { s += close[j]; sv += vol[j]; if (high[j] > h) h = high[j]; }
    const m = s / 20;
    let q = 0;
    for (let j = i - 19; j <= i; j++) q += (close[j] - m) ** 2;
    bbUp[i] = m + 2 * Math.sqrt(q / 20);
    hh20[i] = h;
    vTB[i] = sv / 20;
  }
  t._phu = { rsi, bbUp, hh20, vTB };
  return t._phu;
}
const hinh = (t, i) => {
  const o = t.open[i], h = t.high[i], l = t.low[i], c = t.close[i];
  const range = h - l, body = Math.abs(c - o), tren = h - Math.max(o, c), duoi = Math.min(o, c) - l;
  return { o, h, l, c, range, body, tren, duoi };
};
const MAU = {
  "Sao bang (rau tren dai, dong cua thap)": (t, i) => { const x = hinh(t, i); return x.range > 0 && x.tren >= 2 * x.body && x.tren >= 0.6 * x.range && (x.c - x.l) / x.range <= 0.4 && x.duoi <= 0.15 * x.range; },
  "Nhan chim giam (do bao trum nen xanh truoc)": (t, i) => { if (i < 1) return false; const a = hinh(t, i - 1), b = hinh(t, i); return a.c > a.o && b.c < b.o && b.o >= a.c && b.c <= a.o && b.body > a.body; },
  "May den phu (mo gap len, dong duoi giua than nen xanh truoc)": (t, i) => { if (i < 1) return false; const a = hinh(t, i - 1), b = hinh(t, i); return a.c > a.o && a.range > 0 && a.body >= 0.6 * a.range && b.c < b.o && b.o > a.h && b.c < (a.o + a.c) / 2 && b.c > a.o; },
  "Sao hom (xanh dai - than nho gap len - do dong duoi giua)": (t, i) => { if (i < 2) return false; const a = hinh(t, i - 2), m = hinh(t, i - 1), b = hinh(t, i); return a.c > a.o && a.body >= 0.6 * a.range && m.body <= 0.3 * a.body && Math.min(m.o, m.c) >= a.c * 0.999 && b.c < b.o && b.c < (a.o + a.c) / 2; },
  "Doji o dinh (than <= 10% bien do, gan dinh 20 phien)": (t, i) => { const x = hinh(t, i); return x.range > 0 && x.body <= 0.1 * x.range && t.high[i] >= phu(t).hh20[i] * 0.99; },
  "Nen do dai >= -4% + KL >= 1,5x": (t, i) => i > 0 && t.close[i] / t.close[i - 1] - 1 <= -0.04 && t.vol[i] >= 1.5 * phu(t).vTB[i],
  "Climax (cao nhat 20 phien, KL >= 2x, dong cua nua duoi)": (t, i) => { const x = hinh(t, i); const p = phu(t); return x.range > 0 && x.h >= p.hh20[i] && t.vol[i] >= 2 * p.vTB[i] && (x.c - x.l) / x.range <= 0.5; },
  "Gap giam >= 2%": (t, i) => i > 0 && t.open[i] <= t.close[i - 1] * 0.98,
  "Dong cua < thap nhat hom truoc sau ngay ky luc (cao nhat 20 phien)": (t, i) => i > 1 && t.high[i - 1] >= phu(t).hh20[i - 1] && t.close[i] < t.low[i - 1],
  "3 nen do lien tiep": (t, i) => i > 2 && t.close[i] < t.open[i] && t.close[i - 1] < t.open[i - 1] && t.close[i - 2] < t.open[i - 2],
  "Bollinger: tung dong cua tren dai tren, nay quay vao": (t, i) => { const p = phu(t); return i > 0 && t.close[i - 1] > p.bbUp[i - 1] && t.close[i] < p.bbUp[i] && t.close[i] < t.close[i - 1]; },
  "RSI14 tu >= 75 xuong < 70": (t, i) => { const p = phu(t); return i > 0 && p.rsi[i - 1] >= 75 && p.rsi[i] < 70; },
  "DOI CHUNG: bat ky nen nao (ban ngay khi lai >= 5%, khong can mau)": () => true,
  "Dinh doi (pha day giua 2 dinh trong 40 phien)": (t, i) => {
    if (i < 15) return false;
    const { high, low, close } = t;
    for (let j = i - 6; j >= Math.max(3, i - 40); j--) {
      let dinh = true;
      for (let k = j - 3; k <= j + 3; k++) if (k !== j && high[k] > high[j]) { dinh = false; break; }
      if (!dinh) continue;
      for (let k = j + 5; k <= i - 1; k++) {
        let dinh2 = true;
        for (let m = Math.max(0, k - 3); m <= Math.min(i - 1, k + 3); m++) if (m !== k && high[m] > high[k]) { dinh2 = false; break; }
        if (!dinh2 || Math.abs(high[k] / high[j] - 1) > 0.03) continue;
        let day = Infinity;
        for (let m = j; m <= k; m++) day = Math.min(day, low[m]);
        if (close[i] < day && close[i - 1] >= day) return true;
      }
    }
    return false;
  },
};

// ---------- (A) GIA TRI DU BAO: khi dang lai >= 5% so voi gia vao, nen co mau -> gia 5 phien sau ----------
console.log("\n=========== (A) DU BAO: gia 5 phien sau khi mau xuat hien (dang giu lenh he thong, dong cua >= +5% so voi gia vao engine E, tu nen vao + 2) ===========");
const goc = [];
for (const t of lenh) {
  for (let j = t.iv + 3; j < Math.min(t.n - 6, t.iv + 80); j++) {
    if (t.close[j] < t.E * 1.05) continue;
    goc.push({ t, j, f5: (t.close[j + 5] / t.close[j] - 1) * 100 });
  }
}
const nenCo = tb(goc.map((x) => x.f5));
console.log(`Cac nen dang lai >= 5%: ${goc.length} nen-lenh; gia 5 phien sau trung binh ${f(nenCo)}%`);
console.log("Mau".padEnd(70), "n".padStart(6), "f5 TB".padStart(7), "chenh so voi co so".padStart(19), "thang%".padStart(7));
for (const [ten, fn] of Object.entries(MAU)) {
  const a = goc.filter((x) => fn(x.t, x.j));
  if (a.length < 30) { console.log(ten.padEnd(70), String(a.length).padStart(6), "(it mau)"); continue; }
  console.log(ten.padEnd(70), String(a.length).padStart(6), f(tb(a.map((x) => x.f5))).padStart(7), f(tb(a.map((x) => x.f5)) - nenCo).padStart(19), f((a.filter((x) => x.f5 > 0).length / a.length) * 100, 0).padStart(7));
}

// ---------- (B) DUNG LAM LENH CHOT ----------
const QUY_UOC = [
  ["THUC TE", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })],
  ["LY TUONG", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })],
];
const TAP = [["Toan bo", () => true], ["Tu 2022.5", (t) => t.ngay >= "2022-05-01"], ["Rieng 2026", (t) => t.ngay >= "2026-01-01"]];
const CO_SO = { moc: HAI_TP, baoVe: true, theoSell: true, tk: "nua" };
const SO_LAN = 20;
console.log("\n=========== (B) DUNG MAU LAM LENH CHOT tren co so TK3: doi lai TB / danh muc K=10 (lai-nam/sut) so voi co so ===========");
for (const [tenQU, cfgVao] of QUY_UOC) {
  for (const [tenTap, loc] of TAP) {
    const ds = lenh.filter(loc);
    const co = ds.map((t) => mp(t, { ...CO_SO, ...cfgVao(t) }));
    const kCo = thongKe(co.filter(Boolean));
    const dCo = danhMucNhieuLan(co, ds, 10, SO_LAN, {});
    console.log(`\n--- ${tenQU} | ${tenTap} (n ${ds.length}) --- co so TK3: lai TB ${f(kCo.tb)}% PF ${f(kCo.pf)} thang ${f(kCo.thang, 0)}%, DM K=10 ${f(dCo.cagr, 1)}%/${f(dCo.sut, 0)}%`);
    console.log("Mau (ban het phan con khi lai >= 5%)".padEnd(70), "ty le lenh co mau".padStart(17), "lai TB".padStart(7), "doi".padStart(6), "DM K=10".padStart(14), "| ban 1/2: lai TB / doi / DM");
    for (const [ten, fn] of Object.entries(MAU)) {
      const cfgHet = (t) => ({ ...CO_SO, mau: fn, mauNguong: 5, mauTyLe: 1, ...cfgVao(t) });
      const cfgNua = (t) => ({ ...CO_SO, mau: fn, mauNguong: 5, mauTyLe: 0.5, ...cfgVao(t) });
      const kqH = ds.map((t) => mp(t, cfgHet(t)));
      const kqN = ds.map((t) => mp(t, cfgNua(t)));
      const kH = thongKe(kqH.filter(Boolean)), kN = thongKe(kqN.filter(Boolean));
      const dH = danhMucNhieuLan(kqH, ds, 10, SO_LAN, {}), dN = danhMucNhieuLan(kqN, ds, 10, SO_LAN, {});
      let khac = 0;
      co.forEach((r, i) => { if (r && kqH[i] && Math.abs(r.ret - kqH[i].ret) > 1e-9) khac++; });
      console.log(ten.padEnd(70), `${f((khac / ds.length) * 100, 0)}%`.padStart(17), f(kH.tb).padStart(7), f(kH.tb - kCo.tb).padStart(6), `${f(dH.cagr, 1)}%/${f(dH.sut, 0)}%`.padStart(14), `| ${f(kN.tb)} / ${f(kN.tb - kCo.tb)} / ${f(dN.cagr, 1)}%/${f(dN.sut, 0)}%`);
    }
  }
}
