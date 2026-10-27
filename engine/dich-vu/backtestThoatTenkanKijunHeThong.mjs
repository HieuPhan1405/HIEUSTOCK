// BACKTEST CACH RA "THUNG TENKAN BAN NUA, THUNG KIJUN BAN NOT" TAI DIEM MUA CUA HE THONG (Hieu 27/10/2026: "ko test o diem mua he thong co") + thu MUA THEM khi gia cham Tenkan bat len trong luc dang giu lenh he thong.
// Diem mua = cac lenh MUA THUONG (loai 1) cua engine tren cache lich su dai (backtestChung.mjs chayEngine, ~11 nam). Quy uoc THUC TE nhu moPhongThucTe: mua o gia MO CUA phien sau tin hieu, duoc ban tu chieu T+2 (vao + 2); truoc do cham cat lo / co tin hieu BAN thi ban o gia mo cua phien dau duoc ban;
// phi 0,4%/vong. Cat lo S va cac moc TP1/TP2 la cua engine (khong tinh lai theo gia vao thuc te) - nhu nguoi di sau thay tren web. "Thung" = DONG CUA nen duoi duong, chi tinh sau khi gia tung dong cua tren duong do ke tu luc mua.
// Cac cach ra:
//   HT   = hien tai: 30% TP1 + 30% TP2, 40% con lai giu den tin hieu BAN, cat lo S, sau TP2 cat lo ve gia vao
//   TK1  = khong TP, khong tin hieu BAN: thung Tenkan ban 1/2, thung Kijun ban not, cat lo S
//   TK2  = nhu TK1 + van thoat het khi co tin hieu BAN cua engine
//   TK3  = 30% TP1 + 30% TP2 nhu hien tai, nhung phan con lai: thung Tenkan ban 1/2 phan con, thung Kijun ban not (van thoat het khi co tin hieu BAN, cat lo S, hoa von sau TP2)
//   TEN  = thung Tenkan ban het (cat lo S)     KIJ = thung Kijun ban het (cat lo S)
// Chay: node engine/dich-vu/backtestThoatTenkanKijunHeThong.mjs [nen_dai.json]
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf, TEN_KY, CHI_PHI } from "./backtestChung.mjs";

const cache = docJson(process.argv[2] || "nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, soMa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
console.log(`${lenh.length} lenh Mua thuong (${soMa} ma), ${lenh[0]?.ngay} -> ${lenh.at(-1)?.ngay}`);

const HAI_TP = [{ w: 0.3, i: 0 }, { w: 0.3, i: 1 }];
function mp(t, cfg) {
  const { S, tp, open, high, low, close, sell, n, tenkan, kijun } = t;
  const { vao, banTu } = cfg;
  const E = cfg.E ?? open[vao];
  if (!(E > 0) || !(S < E) || vao >= n) return null;
  const cacMoc = (cfg.moc ?? []).map((m) => ({ w: m.w, gia: tp[m.i], xong: false }));
  let conLai = 1, thu = 0, phienW = 0, choBan = false, dinhTruoc = -Infinity, daTP2 = false, lenT = false, lenK = false, daNua = false;
  const ban = (w, g, i) => { thu += w * (g / E); phienW += w * (i - t.iv); conLai -= w; };
  const ketQua = (jThoat) => ({ ret: (thu - 1) * 100 - CHI_PHI, phien: phienW, jThoat });
  const coSell = (i) => cfg.theoSell && sell[i];
  for (let i = vao; i < n; i++) {
    if (i < banTu) {
      if (low[i] <= S || coSell(i)) choBan = true;
      dinhTruoc = Math.max(dinhTruoc, high[i]);
      if (tenkan[i] != null && close[i] > tenkan[i]) lenT = true;
      if (kijun[i] != null && close[i] > kijun[i]) lenK = true;
      continue;
    }
    if (i === banTu && choBan) { ban(conLai, open[i], i); return ketQua(i); }
    if (cfg.baoVe && (i === banTu ? dinhTruoc : high[i - 1]) >= tp[1]) daTP2 = true;
    const stopBV = daTP2 ? E : 0;
    for (const m of cacMoc) if (!m.xong && open[i] >= m.gia) { ban(m.w, open[i], i); m.xong = true; }
    let g = null;
    if (low[i] <= S) g = Math.min(open[i], S);
    else if (coSell(i)) g = close[i];
    else if (stopBV > 0 && low[i] <= stopBV) g = Math.min(open[i], stopBV);
    if (g != null) { if (conLai > 1e-12) ban(conLai, g, i); return ketQua(i); }
    for (const m of cacMoc) if (!m.xong && high[i] >= m.gia) { ban(m.w, m.gia, i); m.xong = true; }
    if (conLai <= 1e-12) return ketQua(i);
    // thung Tenkan / Kijun theo gia DONG CUA
    if (cfg.tk === "nua") {
      if (!daNua && lenT && tenkan[i] != null && close[i] < tenkan[i]) { ban(conLai * 0.5, close[i], i); daNua = true; }
      if (lenK && kijun[i] != null && close[i] < kijun[i]) { ban(conLai, close[i], i); return ketQua(i); }
    } else if (cfg.tk === "tenkan") {
      if (lenT && tenkan[i] != null && close[i] < tenkan[i]) { ban(conLai, close[i], i); return ketQua(i); }
    } else if (cfg.tk === "kijun") {
      if (lenK && kijun[i] != null && close[i] < kijun[i]) { ban(conLai, close[i], i); return ketQua(i); }
    }
    if (tenkan[i] != null && close[i] > tenkan[i]) lenT = true;
    if (kijun[i] != null && close[i] > kijun[i]) lenK = true;
  }
  return null;
}

const CACH = [
  { ten: "HT   hien tai: 30% TP1 + 30% TP2, con lai theo tin hieu BAN", cfg: { moc: HAI_TP, baoVe: true, theoSell: true } },
  { ten: "TK1  chi Tenkan ban 1/2 + Kijun ban not (cat lo S)", cfg: { moc: [], baoVe: false, theoSell: false, tk: "nua" } },
  { ten: "TK2  TK1 + thoat het khi co tin hieu BAN", cfg: { moc: [], baoVe: false, theoSell: true, tk: "nua" } },
  { ten: "TK3  30% TP1 + 30% TP2, con lai: Tenkan 1/2 + Kijun not (+ BAN)", cfg: { moc: HAI_TP, baoVe: true, theoSell: true, tk: "nua" } },
  { ten: "TEN  thung Tenkan ban het (cat lo S)", cfg: { moc: [], baoVe: false, theoSell: false, tk: "tenkan" } },
  { ten: "KIJ  thung Kijun ban het (cat lo S)", cfg: { moc: [], baoVe: false, theoSell: false, tk: "kijun" } },
];
const SO_LAN = 30;
const TAP = [
  ["Toan bo giai doan", () => true],
  ["Tu 2022.5 (giai doan gan nhat)", (t) => t.ngay >= "2022-05-01"],
  ["Rieng 2026", (t) => t.ngay >= "2026-01-01"],
];
for (const [tenTap, loc] of TAP) {
  const ds = lenh.filter(loc);
  console.log(`\n=========== ${tenTap}: n = ${ds.length} lenh ===========`);
  console.log("Cach ra".padEnd(66), "n".padStart(5), "lai TB".padStart(7), "trung vi".padStart(8), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "| lai TB theo giai doan <2019 | 2019-22.4 | 22.5+".padStart(50), "| DM K=10 CAGR/sut");
  for (const c of CACH) {
    const kqs = ds.map((t) => (t.vao_ok === false ? null : mp(t, { ...c.cfg, vao: t.iv + 1, banTu: t.iv + 3 })));
    const ok = kqs.filter(Boolean);
    const k = thongKe(ok);
    const ky = [[], [], []];
    ds.forEach((t, i) => kqs[i] && ky[kyOf(t.ngay)].push(kqs[i].ret));
    const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {});
    console.log(c.ten.padEnd(66), String(ok.length).padStart(5), f(k.tb).padStart(7), f(k.trungVi).padStart(8), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), "|", ky.map((a) => `${f(tb(a)).padStart(5)}(${a.length})`).join(" "), `| ${f(d10.cagr, 1)}%/${f(d10.sut, 0)}%`);
  }
  console.log(`(giai doan: ${TEN_KY.join(" | ")})`);
}

// ---------- MUA THEM khi gia cham Tenkan bat len trong luc dang giu lenh he thong (cach hien tai) ----------
console.log("\n=========== MUA THEM khi cham Tenkan bat len (lenh he thong dang giu, cach HT) ===========");
console.log("Dieu kien (nen j sau T+2 cua lenh goc, van con giu): thap nhat <= Tenkan x 1,003, dong cua > Tenkan va > Kijun, nen xanh, Tenkan > Kijun, hom truoc dong cua > Tenkan -> mua o mo cua j+1, quan ly theo cach HT (cat lo S, TP cua engine).");
const them = [];
const goc = [];
for (const t of lenh) {
  const hg = mp(t, { ...CACH[0].cfg, vao: t.iv + 1, banTu: t.iv + 3 });
  if (!hg) continue;
  goc.push({ ngay: t.ngay, ret: hg.ret });
  const jHet = Math.round(t.iv + hg.phien); // xap xi nen thoat (phien tinh co trong so) - chi de gioi han vung tim
  for (let j = t.iv + 3; j < Math.min(t.n - 2, jHet); j++) {
    const { open, high, low, close, tenkan, kijun } = t;
    if (tenkan[j] == null || kijun[j] == null || tenkan[j - 1] == null) continue;
    if (!(tenkan[j] > kijun[j] && close[j] > kijun[j] && close[j] > tenkan[j] && close[j] > open[j] && low[j] <= tenkan[j] * 1.003 && close[j - 1] > tenkan[j - 1])) continue;
    const E2 = open[j + 1];
    if (!(E2 > t.S)) break;
    const r = mp(t, { ...CACH[0].cfg, E: E2, vao: j + 1, banTu: j + 3 });
    if (r) them.push({ ngay: t.ngay, ret: r.ret, phien: r.phien, ky: kyOf(t.ngay) });
    break; // moi lenh mua them toi da 1 lan
  }
}
const thGoc = thongKe(goc.map((x) => ({ ret: x.ret, phien: 0 })));
const thThem = thongKe(them);
console.log(`Lenh goc: n ${goc.length}, lai TB ${f(thGoc.tb)}%, thang ${f(thGoc.thang, 0)}%`);
console.log(`Mua them: n ${them.length} (${f((them.length / goc.length) * 100, 0)}% so lenh goc), lai TB ${f(thThem.tb)}%, trung vi ${f(thThem.trungVi)}%, thang ${f(thThem.thang, 0)}%, PF ${f(thThem.pf)}`);
for (const [ten, a, b] of [["<2019", "0000", "2019-01-01"], ["2019-22.4", "2019-01-01", "2022-05-01"], ["22.5+", "2022-05-01", "9999"], ["2026", "2026-01-01", "9999"]]) {
  const x = them.filter((e) => e.ngay >= a && e.ngay < b);
  console.log(`   ${ten.padEnd(10)} n ${String(x.length).padStart(4)} | lai TB ${f(tb(x.map((e) => e.ret))).padStart(6)}% | thang ${f((x.filter((e) => e.ret > 0).length / Math.max(x.length, 1)) * 100, 0)}%`);
}

// ---------- THAM CHIEU: quy uoc LY TUONG (mua dung gia engine E luc tin hieu, ban tu phien sau - cach cac backtest cu / so tren web thuong tinh) ----------
console.log("\n=========== THAM CHIEU quy uoc ly tuong (gia vao = E cua engine, ban tu phien sau; thuong cao hon thuc te) ===========");
for (const [tenTap, loc] of [["Toan bo giai doan", () => true], ["Tu 2022.5", (t) => t.ngay >= "2022-05-01"], ["Rieng 2026", (t) => t.ngay >= "2026-01-01"]]) {
  const ds = lenh.filter(loc);
  console.log(`\n${tenTap} (n ${ds.length})`);
  for (const c of CACH) {
    const kqs = ds.map((t) => mp(t, { ...c.cfg, E: t.E, vao: t.iv + 1, banTu: t.iv + 1 }));
    const ok = kqs.filter(Boolean);
    const k = thongKe(ok);
    const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {});
    console.log("  ", c.ten.padEnd(66), "lai TB", f(k.tb).padStart(6), "thang", f(k.thang, 0).padStart(3) + "%", "PF", f(k.pf).padStart(5), "phien", f(k.phienTB, 1).padStart(5), `| DM K=10 ${f(d10.cagr, 1)}%/${f(d10.sut, 0)}%`);
  }
}
