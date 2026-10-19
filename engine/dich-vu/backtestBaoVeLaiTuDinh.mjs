// BACKTEST "BAO VE LAI TU DINH" (Hieu hoi 2026-10-19: nhieu ma giam thoc tu dinh - BVH, NVB - ma cho ve hoa von thi mat nhieu lai): sau khi cham TP1/TP2, phan con lai (40%)
// khong cho ve GIA VAO (hoa von) ma thoat theo mot duong DOI THEO DINH: (a) trailing % tu dinh cao nhat, (b) giu lai k% lai dang mo (dinh - gia vao), (c) dinh - m x ATR,
// (d) dong cua < Kijun, va ket hop. Quy uoc nhu backtestChung.moPhong: 30% TP1 + 30% TP2, Stop-loss goc, tin hieu BAN, chi phi 0,4%/lenh; muc dung la muc cua phien TRUOC
// (dinh = cao nhat cac nen truoc hom nay - khong nhin truoc), cham trong phien = ban o min(mo cua, muc dung), "dong cua < Kijun" = ban o gia dong cua.
// Chi DOC cache (nen_dai.json + vnindex_dai.json). CACH CHAY: node engine/dich-vu/backtestBaoVeLaiTuDinh.mjs
import { docJson, chayEngine, moPhong, thongKe, danhMucNhieuLan, tb, f, kyOf, TEN_KY, CHI_PHI } from "./backtestChung.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, soMa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
const SO_LAN = 40;

// cfg: { batDau: "tp1"|"tp2", pct?: % trailing tu dinh, giu?: giu lai k lai dang mo, atr?: m x ATR duoi dinh, kijun?: true (dong cua < Kijun), sauHoaVon: true (san = gia vao sau TP2) }
export function mo(t, cfg = {}) {
  const { E, S, iv, open, high, low, close, sell, n, atr, kijun, tenkan, relVol } = t;
  const moc = [{ w: 0.3, gia: t.tp[0], xong: false }, { w: 0.3, gia: t.tp[1], xong: false }];
  let conLai = 1, thu = 0, phienTS = 0;
  let daTP1 = false, daTP2 = false;
  let dinh = -Infinity;
  let jThoat = -1, lyDo = 0;
  const ban = (w, g, i) => { thu += w * (g / E); phienTS += w * (i - iv); conLai -= w; };
  for (let i = iv + 1; i < n; i++) {
    if (i - 1 > iv) {
      dinh = Math.max(dinh, high[i - 1]);
      if (high[i - 1] >= t.tp[0]) daTP1 = true;
      if (high[i - 1] >= t.tp[1]) daTP2 = true;
    }
    for (const m of moc) if (!m.xong && open[i] >= m.gia) { ban(m.w, open[i], i); m.xong = true; }
    const armed = cfg.batDau === "tp1" ? daTP1 : daTP2;
    let muc = daTP2 && !cfg.khongSan ? E : 0; // hoa von sau TP2 (luat hien tai); khongSan = nhu bvRong cua engine/AFL: CHI trailing tu dinh, khong co san hoa von
    if (armed && Number.isFinite(dinh)) {
      if (cfg.pct != null) muc = Math.max(muc, dinh * (1 - cfg.pct / 100));
      if (cfg.giu != null) muc = Math.max(muc, E + cfg.giu * (dinh - E));
      if (cfg.atr != null && atr[i - 1] > 0) muc = Math.max(muc, dinh - cfg.atr * atr[i - 1]);
    }
    const dongDuoiKijun = cfg.kijun && armed && kijun[i] != null && close[i] < kijun[i];
    // VOL BAN TO + DUOI TENKAN (Hieu 2026-10-19, VPB tao dinh): relVol (KL hom nay / TB20) >= k, nen giam (dong cua < mo cua), dong cua < Tenkan -> ban het o gia dong cua.
    // volBatDau: "vao" (tu luc vao) | "tp1" | "tp2" (mac dinh tp1) - dung du lieu den het nen hom nay (quyet dinh luc dong cua, khop cua so 14:00-14:45 xap xi).
    let volBan = false;
    if (cfg.vol) {
      const batVol = cfg.volBatDau === "vao" ? true : cfg.volBatDau === "tp2" ? daTP2 : daTP1;
      volBan = batVol && relVol[i] >= cfg.vol && (!cfg.nenGiam || close[i] < open[i]) && (!cfg.duoiTenkan || (tenkan[i] != null && close[i] < tenkan[i])) && (!cfg.duoiKijun || (kijun[i] != null && close[i] < kijun[i]));
    }
    let g = null;
    if (low[i] <= S) { g = Math.min(open[i], S); lyDo = 2; }
    else if (sell[i] || dongDuoiKijun || volBan) { g = close[i]; lyDo = sell[i] ? 1 : volBan ? 6 : 4; }
    else if (muc > 0 && low[i] <= muc) { g = Math.min(open[i], muc); lyDo = 3; }
    if (g != null) { if (conLai > 1e-12) ban(conLai, g, i); jThoat = i; break; }
    for (const m of moc) if (!m.xong && high[i] >= m.gia) { ban(m.w, m.gia, i); m.xong = true; }
    if (conLai <= 1e-12) { jThoat = i; lyDo = 5; break; }
  }
  if (jThoat < 0) return null;
  // dinh thuc te trong thoi gian giu (de do "tra lai bao nhieu")
  let dinhThat = E;
  for (let i = iv + 1; i <= jThoat; i++) dinhThat = Math.max(dinhThat, high[i]);
  return { ret: (thu - 1) * 100 - CHI_PHI, phien: phienTS, jThoat, lyDo, dinhPct: (dinhThat / E - 1) * 100 };
}

const CACH = [
  { ten: "HIEN TAI: hoa von sau TP2", cfg: {} },
  { ten: "Kijun sau TP2 (da co cong tac)", cfg: { batDau: "tp2", kijun: true } },
  { ten: "Trailing 8% tu dinh, sau TP2", cfg: { batDau: "tp2", pct: 8 } },
  { ten: "Trailing 10% tu dinh, sau TP2", cfg: { batDau: "tp2", pct: 10 } },
  { ten: "Trailing 12% tu dinh, sau TP2", cfg: { batDau: "tp2", pct: 12 } },
  { ten: "Trailing 15% tu dinh, sau TP2", cfg: { batDau: "tp2", pct: 15 } },
  { ten: "Trailing 20% tu dinh, sau TP2", cfg: { batDau: "tp2", pct: 20 } },
  { ten: "Trailing 10% tu dinh, sau TP1", cfg: { batDau: "tp1", pct: 10 } },
  { ten: "Trailing 15% tu dinh, sau TP1", cfg: { batDau: "tp1", pct: 15 } },
  { ten: "Trailing 20% tu dinh, sau TP1 (= bvRong cu)", cfg: { batDau: "tp1", pct: 20 } },
  { ten: "Giu lai 30% lai dang mo (dinh-E), sau TP2", cfg: { batDau: "tp2", giu: 0.3 } },
  { ten: "Giu lai 40% lai dang mo, sau TP2", cfg: { batDau: "tp2", giu: 0.4 } },
  { ten: "Giu lai 50% lai dang mo, sau TP2", cfg: { batDau: "tp2", giu: 0.5 } },
  { ten: "Giu lai 60% lai dang mo, sau TP2", cfg: { batDau: "tp2", giu: 0.6 } },
  { ten: "Giu lai 30% lai dang mo, sau TP1", cfg: { batDau: "tp1", giu: 0.3 } },
  { ten: "Giu lai 50% lai dang mo, sau TP1", cfg: { batDau: "tp1", giu: 0.5 } },
  { ten: "Dinh - 2 ATR, sau TP2", cfg: { batDau: "tp2", atr: 2 } },
  { ten: "Dinh - 3 ATR, sau TP2", cfg: { batDau: "tp2", atr: 3 } },
  { ten: "Dinh - 4 ATR, sau TP2", cfg: { batDau: "tp2", atr: 4 } },
  { ten: "Dinh - 3 ATR, sau TP1", cfg: { batDau: "tp1", atr: 3 } },
  { ten: "[bvRong that] 10% tu dinh sau TP1, khong san HV", cfg: { batDau: "tp1", pct: 10, khongSan: true } },
  { ten: "[bvRong that] 12% tu dinh sau TP1, khong san HV", cfg: { batDau: "tp1", pct: 12, khongSan: true } },
  { ten: "[bvRong that] 15% tu dinh sau TP1, khong san HV", cfg: { batDau: "tp1", pct: 15, khongSan: true } },
  { ten: "[bvRong that] 20% tu dinh sau TP1, khong san HV", cfg: { batDau: "tp1", pct: 20, khongSan: true } },
  { ten: "[bvRong that] 25% tu dinh sau TP1, khong san HV", cfg: { batDau: "tp1", pct: 25, khongSan: true } },
  { ten: "Trailing 12% + dong cua < Kijun, sau TP2", cfg: { batDau: "tp2", pct: 12, kijun: true } },
  { ten: "Trailing 15% + dong cua < Kijun, sau TP2", cfg: { batDau: "tp2", pct: 15, kijun: true } },
  { ten: "Giu lai 40% + dong cua < Kijun, sau TP2", cfg: { batDau: "tp2", giu: 0.4, kijun: true } },
];

const BV15 = { batDau: "tp1", pct: 15, khongSan: true };
const CACH_VOL = [
  { ten: "HIEN TAI: hoa von sau TP2", cfg: {} },
  { ten: "[bvRong that] 15% tu dinh sau TP1", cfg: BV15 },
  { ten: "Vol>=1.5 + nen giam + dong < Tenkan (sau TP1)", cfg: { vol: 1.5, nenGiam: true, duoiTenkan: true } },
  { ten: "Vol>=2.0 + nen giam + dong < Tenkan (sau TP1)", cfg: { vol: 2, nenGiam: true, duoiTenkan: true } },
  { ten: "Vol>=2.5 + nen giam + dong < Tenkan (sau TP1)", cfg: { vol: 2.5, nenGiam: true, duoiTenkan: true } },
  { ten: "Vol>=3.0 + nen giam + dong < Tenkan (sau TP1)", cfg: { vol: 3, nenGiam: true, duoiTenkan: true } },
  { ten: "Vol>=2.0 + dong < Tenkan, khong can nen giam (sau TP1)", cfg: { vol: 2, duoiTenkan: true } },
  { ten: "Vol>=2.0 + nen giam, khong can Tenkan (sau TP1)", cfg: { vol: 2, nenGiam: true } },
  { ten: "Vol>=1.5 + nen giam + dong < Kijun (sau TP1)", cfg: { vol: 1.5, nenGiam: true, duoiKijun: true } },
  { ten: "Vol>=1.5 + nen giam + dong < Tenkan (sau TP2)", cfg: { vol: 1.5, nenGiam: true, duoiTenkan: true, volBatDau: "tp2" } },
  { ten: "Vol>=2.0 + nen giam + dong < Tenkan (sau TP2)", cfg: { vol: 2, nenGiam: true, duoiTenkan: true, volBatDau: "tp2" } },
  { ten: "Vol>=2.0 + nen giam + dong < Tenkan (tu luc vao)", cfg: { vol: 2, nenGiam: true, duoiTenkan: true, volBatDau: "vao" } },
  { ten: "bvRong 15% + Vol>=1.5 + giam + < Tenkan (sau TP1)", cfg: { ...BV15, vol: 1.5, nenGiam: true, duoiTenkan: true } },
  { ten: "bvRong 15% + Vol>=2.0 + giam + < Tenkan (sau TP1)", cfg: { ...BV15, vol: 2, nenGiam: true, duoiTenkan: true } },
  { ten: "Hoa von + Vol>=2.0 + giam + < Tenkan (sau TP1)", cfg: { vol: 2, nenGiam: true, duoiTenkan: true } },
];
const CACH_CHAY = process.argv.includes("--chi=vol") ? CACH_VOL : CACH;
// kiem tra: cach hien tai phai khop moPhong() cua backtestChung
{
  const a = tb(lenh.map((t) => moPhong(t, { moc: [{ w: 0.3, muc: "tp1" }, { w: 0.3, muc: "tp2" }] })).filter(Boolean).map((x) => x.ret));
  const b = tb(lenh.map((t) => mo(t, {})).filter(Boolean).map((x) => x.ret));
  console.log(`Kiem tra khop moPhong: ${f(a, 3)} vs ${f(b, 3)}`);
}

const chamTP2 = (t) => {
  const kq = mo(t, {});
  if (!kq) return false;
  for (let i = t.iv + 1; i <= kq.jThoat; i++) if (t.high[i] >= t.tp[1]) return true;
  return false;
};
const TAP = [["A. Tat ca lenh Mua thuong", () => true], ["B. Lenh DA CHAM TP2 (phan dung bao ve lai)", chamTP2]];
for (const [tenTap, fn] of TAP) {
  const ds = lenh.filter(fn);
  console.log(`\n=========== Tap ${tenTap}: n = ${ds.length} (${soMa} ma) ===========`);
  console.log("Cach".padEnd(46), "lai TB".padStart(7), "med".padStart(6), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "l/phien".padStart(8), "tra lai".padStart(8), "| giai doan (<2019 | 19-22.4 | 22.5+)".padStart(38), "| DM K=10".padStart(12), "K=20".padStart(10));
  for (const c of CACH_CHAY) {
    const kqs = ds.map((t) => mo(t, c.cfg));
    const ok = kqs.filter(Boolean);
    const k = thongKe(ok);
    const ky = [[], [], []];
    ds.forEach((t, i) => { if (kqs[i]) ky[kyOf(t.ngay)].push(kqs[i].ret); });
    const traLai = tb(ok.map((x) => x.dinhPct - x.ret)); // dinh dat duoc - ket qua thuc nhan (diem %): cang nho cang it tra lai
    const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {});
    const d20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, {});
    console.log(c.ten.padEnd(46), f(k.tb).padStart(7), f(k.trungVi).padStart(6), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), f(k.laiMoiPhien, 3).padStart(8), f(traLai, 1).padStart(8), "|", ky.map((a) => `${f(tb(a)).padStart(5)}`).join(" "), `| ${f(d10.cagr, 1)}%/${f(d10.sut, 0)}%`, `${f(d20.cagr, 1)}%/${f(d20.sut, 0)}%`, `| vol ${((ok.filter((x) => x.lyDo === 6).length / ok.length) * 100).toFixed(0)}%`);
  }
}
console.log(`(chi phi ${CHI_PHI}%/lenh da tru; "tra lai" = dinh dat duoc tru ket qua nhan, diem %, cang nho cang it tra lai cho thi truong; giai doan ${TEN_KY.join(" | ")})`);

// Xem tung lenh cua vai ma: node engine/dich-vu/backtestBaoVeLaiTuDinh.mjs --ma=NVB,BVH [--tu=2025-01-01]
const thamMa = process.argv.find((a) => a.startsWith("--ma="));
if (thamMa) {
  const dsMa = thamMa.slice(5).split(",");
  const tu = (process.argv.find((a) => a.startsWith("--tu=")) || "--tu=2025-01-01").slice(5);
  const XEM = [["Hien tai", {}], ["bvRong 15%", { batDau: "tp1", pct: 15, khongSan: true }], ["Trailing 15% + HV", { batDau: "tp2", pct: 15 }], ["Giu 50% lai", { batDau: "tp2", giu: 0.5 }], ["Kijun", { batDau: "tp2", kijun: true }]];
  console.log(`\n--- Tung lenh ${dsMa.join(", ")} tu ${tu} (lai % sau chi phi; dinh = % tu gia vao toi dinh trong luc giu) ---`);
  for (const t of lenh.filter((x) => dsMa.includes(x.ma) && x.ngay >= tu)) {
    const kqs = XEM.map(([, c]) => mo(t, c));
    if (!kqs[0]) { console.log(t.ma, t.ngay, "chua dong"); continue; }
    console.log(t.ma, t.ngay, `E ${t.E.toFixed(2)}`, `dinh +${kqs[0].dinhPct.toFixed(1)}%`, "|", XEM.map(([ten], i) => `${ten}: ${kqs[i] ? kqs[i].ret.toFixed(1) + "% (" + t.ngayArr[kqs[i].jThoat].slice(5) + ")" : "-"}`).join(" | "));
  }
}

// KIEM TRA "VOL BAN TO = TAO DINH?": voi moi lenh, tu sau TP1 den luc lenh dong (theo cach hien tai), lay LAN DAU dong cua < Tenkan co vol >= k + nen giam -> xem 5/10/20 phien sau gia doi % ra sao
// so voi (a) lan dau dong cua < Tenkan nhung vol thap (< 1.0) + nen giam, (b) moi phien sau TP1 (nen). Gia tri am nhieu = tin hieu bao dinh dung.
if (process.argv.includes("--chi=vol")) {
  const NN = [5, 10, 20];
  const gom = (dieuKien) => {
    const kq = NN.map(() => []);
    let nTin = 0;
    for (const t of lenh) {
      const r = mo(t, {});
      if (!r) continue;
      let daTP1 = false;
      for (let i = t.iv + 1; i <= r.jThoat; i++) {
        if (i - 1 > t.iv && t.high[i - 1] >= t.tp[0]) daTP1 = true;
        if (!daTP1) continue;
        if (dieuKien(t, i)) {
          nTin++;
          NN.forEach((N, k) => { if (i + N < t.n) kq[k].push((t.close[i + N] / t.close[i] - 1) * 100); });
          break;
        }
      }
    }
    return { nTin, tbs: kq.map((a) => tb(a)), thang: kq.map((a) => (a.filter((x) => x < 0).length / (a.length || 1)) * 100) };
  };
  const dong = (t, i) => t.tenkan[i] != null && t.close[i] < t.tenkan[i] && t.close[i] < t.open[i];
  const DK = [
    ["Vol>=3.0 + giam + < Tenkan", (t, i) => dong(t, i) && t.relVol[i] >= 3],
    ["Vol>=2.0 + giam + < Tenkan", (t, i) => dong(t, i) && t.relVol[i] >= 2],
    ["Vol>=1.5 + giam + < Tenkan", (t, i) => dong(t, i) && t.relVol[i] >= 1.5],
    ["Vol thap (<1.0) + giam + < Tenkan (doi chung)", (t, i) => dong(t, i) && t.relVol[i] < 1],
    ["Moi nen sau TP1 (nen)", () => true],
  ];
  console.log("\n=== Gia sau tin hieu (lan dau moi lenh, sau TP1, trong luc dang giu): TB % va ty le phien GIAM ===");
  console.log("Tin hieu".padEnd(46), "n".padStart(5), "+5 phien".padStart(10), "+10".padStart(8), "+20".padStart(8), "| ty le giam 5/10/20 (%)");
  for (const [ten, fn] of DK) {
    const g = gom(fn);
    console.log(ten.padEnd(46), String(g.nTin).padStart(5), g.tbs.map((x) => f(x, 2).padStart(8)).join("  "), "|", g.thang.map((x) => f(x, 0)).join(" / "));
  }
}
