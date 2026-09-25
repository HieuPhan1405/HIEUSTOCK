// BACKTEST CACH CHOT LOI: giu NGUYEN cac lan vao lenh + tin hieu BAN + cat lo ban dau cua engine (tinhTinHieuChoMa, chuoi theo tung nen), chi doi
// CACH CHOT LOI (30/30/25/15 hien tai so voi giu het / gop mot moc / theo R / bam Kijun...) de xem cach nao cho ky vong tot hon.
// Doc cache engine/output/nen_dai.json (tao boi taiDuLieuDai.mjs; gia DA DIEU CHINH, ~11 nam). Khong dung mang, khong ghi gi ngoai man hinh.
//
// QUY UOC MO PHONG (giong nhau cho moi cach, chi khac cach chia vi the):
//  - Vao lenh tai gia engine (giaVaoLuc), cat lo ban dau = stopVaoLuc, tin hieu BAN = sellTinHieu (diem so), bao ve hoa von sau khi cham TP2 cua ENGINE
//    (bvHoaVon: stop len gia vao) - dung logic engine/loi/mayTrangThai.js. Mo phong lai roi doi chieu ngay thoat voi engine (in ra o dau bao cao).
//  - Cat lo: khop tai min(gia mo cua, stop); tin hieu BAN: khop gia dong cua; chot loi: khop tai muc (hoac gia mo cua neu gap len tren muc).
//    Cung 1 nen vua cham stop vua cham muc chot loi: coi nhu cham stop truoc (than trong).
//  - Chi phi 0,4% ca vong (phi mua 0,15% + phi ban 0,15% + thue 0,1% tren phan ban) - tong bang nhau du chia bao nhieu lan chot nen tru thang 0,4% moi lenh.
//  - Chi xet LENH GOC (Buy thuong / Mua lai / Mua muon); khong tinh cac lo "mua them". Lenh chua dong o cuoi du lieu bi bo.
// HAN CHE: danh sach ma la CAC MA HIEN TAI (thien lech nguoi song sot - anh huong nhu nhau len moi cach nen so SANH cac cach van dung,
// con muc lai tuyet doi bi cao hon thuc te); khong tinh truot gia/thanh khoan; nhieu cach duoc thu nen coi chung ket qua "dep tinh co".
// CACH CHAY: node engine/dich-vu/backtestChotLoi.mjs [tenTepCache=nen_dai.json]
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tinhTinHieuChoMa } from "../tinhTinHieuChoMa.js";

const tepCache = process.argv[2] || "nen_dai.json";
const cache = JSON.parse(readFileSync(fileURLToPath(new URL(`../output/${tepCache}`, import.meta.url)), "utf-8"));
const CHI_PHI = 0.4; // %
const SO_NEN_TOI_THIEU = 300;

// ---------- 1. Chi so thi truong (trung binh deu cac ma) lam VNINDEX thay the cho engine (chi dung cho cot RS, khong anh huong vao/ra lenh) ----------
const homNay = new Map(); // ngay -> { tong, dem }
for (const nen of Object.values(cache))
  for (let i = 1; i < nen.length; i++) {
    const r = nen[i].c / nen[i - 1].c - 1;
    if (!Number.isFinite(r) || Math.abs(r) > 0.5) continue;
    const m = homNay.get(nen[i].t) ?? { tong: 0, dem: 0 };
    m.tong += r;
    m.dem += 1;
    homNay.set(nen[i].t, m);
  }
const ngayTang = [...homNay.keys()].sort();
const chiSoTB = new Map();
{
  let v = 1000;
  for (const d of ngayTang) {
    const m = homNay.get(d);
    if (m.dem >= 30) v *= 1 + m.tong / m.dem;
    chiSoTB.set(d, v);
  }
}

// ---------- 2. Chay engine tung ma, gom cac lenh goc ----------
const ketQuaBreadth = { theoNganh: new Map(), trungBinh: 50 };
const lenh = [];
const loMuaThem = []; // { loai, ngay, ret } - lo phu (mua them sau TP3 / giua chung), thoat khi cham stop rieng hoac lenh goc bi ban
let soMa = 0;
for (const [ma, nen] of Object.entries(cache)) {
  if (nen.length < SO_NEN_TOI_THIEU) continue;
  let vniLast = 1000;
  const vniClose = nen.map((b) => {
    vniLast = chiSoTB.get(b.t) ?? vniLast;
    return vniLast;
  });
  let hang;
  try {
    hang = tinhTinHieuChoMa({ ma, nen, vniClose, san: "HOSE", ketQuaBreadth, thamSo: { traChuoi: true, ketThucTaiTP3: false, thoatKijunSauTP2: false, batMuaMoi: true } });
  } catch (e) {
    console.log("Loi", ma, String(e.message || e).slice(0, 80));
    continue;
  }
  soMa++;
  const { close, open, high, low, kijun, tenkan, sellTinHieu, kq } = hang._chuoi;
  const n = nen.length;
  const ngayArr = nen.map((b) => b.t);
  for (const [ten, suKien, giu, gia, stop, cat] of [
    ["Mua them SAU TP3", kq.mua2SuKien, kq.mua2Giu, kq.mua2Gia, kq.mua2Stop, kq.mua2Cat],
    ["Mua them GIUA CHUNG", kq.muaGiuaSuKien, kq.muaGiuaGiu, kq.muaGiuaGia, kq.muaGiuaStop, kq.muaGiuaCat],
  ]) {
    for (let i = 1; i < n - 1; i++) {
      if (!suKien[i] || !(gia[i] > 0)) continue;
      let j = -1;
      for (let k = i + 1; k < n; k++)
        if (giu[k] !== true) {
          j = k;
          break;
        }
      if (j < 0) continue;
      const giaThoat = cat[j] === 1 ? Math.min(open[j], stop[i]) : close[j];
      loMuaThem.push({ loai: ten, ngay: nen[i].t, ret: (giaThoat / gia[i] - 1) * 100 - CHI_PHI, phien: j - i });
    }
  }
  for (let iv = 1; iv < n - 1; iv++) {
    if (!kq.buy[iv]) continue;
    const E = kq.giaVaoLuc[iv];
    const S = kq.stopVaoLuc[iv];
    const tp = [kq.tp1VaoVong[iv], kq.tp2VaoVong[iv], kq.tp3VaoVong[iv]];
    if (!(E > 0) || !(S > 0) || !(S < E) || tp.some((x) => !(x > E)) || !(tp[0] <= tp[1] && tp[1] <= tp[2])) continue;
    let jEng = -1;
    for (let j = iv + 1; j < n; j++)
      if (kq.giuTrongVongLap[j] !== 1) {
        jEng = j;
        break;
      }
    if (jEng < 0) continue; // chua dong cuoi du lieu
    lenh.push({
      ma, ngay: nen[iv].t, iv, jEng, E, S, tp, loai: kq.loaiVaoLenh[iv], lyDoEng: kq.lyDoBanBar[jEng],
      open, high, low, close, kijun, tenkan, sell: sellTinHieu, n, ngayArr,
    });
  }
}

// ---------- 3. Mo phong 1 lenh theo 1 cach chot loi ----------
// cach: { ten, moc: [{ w, muc }], theoKijunSau: chi so moc (0-based) SAU KHI khop thi phan con lai thoat khi dong cua < Kijun }
// khongBaoVe: true = bo bao ve hoa von sau TP2 (stop KHONG len gia vao)\n// muc: "tp1"|"tp2"|"tp3" (muc cua engine) | { r: x } (x lan khoang cach cat lo) | { pct: x } (x% tren gia vao)
const mucGia = (t, muc) => (typeof muc === "string" ? t.tp[Number(muc.slice(2)) - 1] : muc.r != null ? t.E + muc.r * (t.E - t.S) : t.E * (1 + muc.pct / 100));

function moPhong(t, cach) {
  const { E, S, iv, open, high, low, close, sell, n } = t;
  const duongTheo = cach.duongTheo === "tenkan" ? t.tenkan : t.kijun;
  const moc = cach.moc.map((m) => ({ w: m.w, gia: mucGia(t, m.muc), xong: false }));
  let conLai = 1;
  let thu = 0; // tong tien thu ve tren 1 don vi von (nhan trong so)
  let phienTrongso = 0; // sum(trong so x so phien giu) - de tinh thoi gian von nam trong lenh
  let daTP2 = false;
  let lyDo = 0;
  let jThoat = -1;
  const ban = (w, gia, i) => {
    thu += w * (gia / E);
    phienTrongso += w * (i - iv);
    conLai -= w;
  };
  for (let i = iv + 1; i < n; i++) {
    if (!cach.khongBaoVe && i - 1 > iv && high[i - 1] >= t.tp[1]) daTP2 = true;
    const stopBV = daTP2 ? E : 0;
    // Gap len tren muc chot loi: khop tai gia mo cua
    for (const m of moc) if (!m.xong && open[i] >= m.gia) {
      ban(m.w, open[i], i);
      m.xong = true;
    }
    const chamStop = low[i] <= S;
    const chamBV = stopBV > 0 && low[i] <= stopBV;
    const kichHoatKijun = cach.theoKijunSau != null && moc[cach.theoKijunSau].xong && duongTheo[i] != null && close[i] < duongTheo[i];
    let giaThoat = null;
    if (chamStop) {
      giaThoat = Math.min(open[i], S);
      lyDo = 2;
    } else if (sell[i] || kichHoatKijun) {
      giaThoat = close[i];
      lyDo = sell[i] ? 1 : 4;
    } else if (chamBV) {
      giaThoat = Math.min(open[i], stopBV);
      lyDo = 3;
    }
    if (giaThoat != null) {
      if (conLai > 1e-12) ban(conLai, giaThoat, i);
      jThoat = i;
      break;
    }
    for (const m of moc) if (!m.xong && high[i] >= m.gia) {
      ban(m.w, m.gia, i);
      m.xong = true;
    }
    if (conLai <= 1e-12) {
      jThoat = i;
      lyDo = 5; // chot het bang cac moc
      break;
    }
  }
  if (jThoat < 0) return null; // khong dong duoc trong du lieu
  return { ret: (thu - 1) * 100 - CHI_PHI, phien: phienTrongso, jThoat, lyDo };
}

// ---------- 4. Cac cach chot loi ----------
const CACH = [
  { ten: "Hien tai: 30/30/25 + 15% chay (TP1/TP2/TP3)", moc: [{ w: 0.3, muc: "tp1" }, { w: 0.3, muc: "tp2" }, { w: 0.25, muc: "tp3" }] },
  { ten: "Giu het, khong chot tung phan (chi cat lo/BAN)", moc: [] },
  { ten: "30/30 roi giu 40% chay (bo TP3)", moc: [{ w: 0.3, muc: "tp1" }, { w: 0.3, muc: "tp2" }] },
  { ten: "50% o TP2, 50% chay", moc: [{ w: 0.5, muc: "tp2" }] },
  { ten: "20/20/20 + 40% chay (TP1/TP2/TP3)", moc: [{ w: 0.2, muc: "tp1" }, { w: 0.2, muc: "tp2" }, { w: 0.2, muc: "tp3" }] },
  { ten: "1/3 o 1,5R, 1/3 o 3R, 1/3 chay", moc: [{ w: 1 / 3, muc: { r: 1.5 } }, { w: 1 / 3, muc: { r: 3 } }] },
  { ten: "50% o TP2, con lai thoat khi dong cua < Kijun", moc: [{ w: 0.5, muc: "tp2" }], theoKijunSau: 0 },
  { ten: "30% o TP1, con lai thoat khi dong cua < Kijun", moc: [{ w: 0.3, muc: "tp1" }], theoKijunSau: 0 },
  { ten: "Khong chot, nhung sau khi cham TP1 thoat khi dong cua < Kijun", moc: [{ w: 0, muc: "tp1" }], theoKijunSau: 0 },
  { ten: "Khong chot, nhung sau khi cham TP2 thoat khi dong cua < Kijun", moc: [{ w: 0, muc: "tp2" }], theoKijunSau: 0 },
  { ten: "20% o TP1, con lai thoat khi dong cua < Kijun", moc: [{ w: 0.2, muc: "tp1" }], theoKijunSau: 0 },
  { ten: "50% o TP1, con lai thoat khi dong cua < Kijun", moc: [{ w: 0.5, muc: "tp1" }], theoKijunSau: 0 },
  { ten: "30% o TP1, con lai thoat khi dong cua < Tenkan", moc: [{ w: 0.3, muc: "tp1" }], theoKijunSau: 0, duongTheo: "tenkan" },
  { ten: "30% o TP1 + 30% o TP2, con lai thoat khi < Kijun", moc: [{ w: 0.3, muc: "tp1" }, { w: 0.3, muc: "tp2" }], theoKijunSau: 0 },
  { ten: "Hien tai NHUNG bo bao ve hoa von sau TP2", moc: [{ w: 0.3, muc: "tp1" }, { w: 0.3, muc: "tp2" }, { w: 0.25, muc: "tp3" }], khongBaoVe: true },
  { ten: "Giu het NHUNG bo bao ve hoa von sau TP2", moc: [], khongBaoVe: true },
  { ten: "Chot HET 100% o TP2 (~+10%)", moc: [{ w: 1, muc: "tp2" }] },
  { ten: "Chot HET 100% o TP1", moc: [{ w: 1, muc: "tp1" }] },
];

// ---------- 5. Kiem tra: mo phong co dung ngay thoat cua engine khong (cach "Giu het" chi dung logic thoat cua engine) ----------
{
  let khop = 0;
  let tong = 0;
  for (const t of lenh) {
    const r = moPhong(t, { moc: [] });
    if (!r) continue;
    tong++;
    if (r.jThoat === t.jEng) khop++;
  }
  console.log(`Kiem tra mo phong: ${khop}/${tong} lenh thoat DUNG nen nhu engine (${((khop / tong) * 100).toFixed(2)}%)\n`);
}

// ---------- 6. Thong ke ----------
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const md = (a) => {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const f = (v, dp = 2) => (Number.isFinite(v) ? v.toFixed(dp) : "-");
const kyOf = (ngay) => (ngay < "2019-01-01" ? 0 : ngay < "2022-05-01" ? 1 : 2);
const TEN_KY = ["<2019", "2019-2022.4", "2022.5+"];

function thongKe(kqs) {
  const r = kqs.map((x) => x.ret);
  const thang = r.filter((x) => x > 0);
  const thua = r.filter((x) => x <= 0);
  const loiNhuanThang = thang.reduce((s, x) => s + x, 0);
  const loThua = -thua.reduce((s, x) => s + x, 0);
  const sapGiam = [...r].sort((a, b) => b - a);
  const tongDuong = sapGiam.filter((x) => x > 0).reduce((s, x) => s + x, 0);
  const dinh5 = sapGiam.slice(0, Math.max(1, Math.floor(r.length * 0.05))).filter((x) => x > 0).reduce((s, x) => s + x, 0);
  const phien = kqs.map((x) => x.phien);
  const mean = tb(r);
  return {
    n: r.length,
    tb: mean,
    trungVi: md(r),
    thang: (thang.length / r.length) * 100,
    tbThang: tb(thang),
    tbThua: tb(thua),
    pf: loThua > 0 ? loiNhuanThang / loThua : Infinity,
    phienTB: tb(phien),
    laiMoiPhien: tb(phien) > 0 ? mean / tb(phien) : NaN,
    tren20: (r.filter((x) => x > 20).length / r.length) * 100,
    doLech: Math.sqrt(r.reduce((s, x) => s + (x - mean) ** 2, 0) / r.length),
    dinh5Pct: tongDuong > 0 ? (dinh5 / tongDuong) * 100 : NaN,
  };
}

const bang = CACH.map((c) => {
  const kqs = [];
  const ky = [[], [], []];
  for (const t of lenh) {
    const r = moPhong(t, c);
    if (!r) continue;
    kqs.push(r);
    ky[kyOf(t.ngay)].push(r);
  }
  return { c, tk: thongKe(kqs), ky: ky.map((k) => tb(k.map((x) => x.ret))), soKy: ky.map((k) => k.length), kqs };
});

console.log(`Du lieu: ${soMa} ma, ${lenh.length} lenh goc da dong (Buy/Mua lai/Mua muon), nam vao lenh ${lenh.reduce((m, t) => (t.ngay < m ? t.ngay : m), "9999")} -> ${lenh.reduce((m, t) => (t.ngay > m ? t.ngay : m), "0000")}`);
console.log(`Chi phi ${CHI_PHI}%/lenh da tru. "Lai/phien" = lai TB / so phien von nam trong lenh (tinh theo trong so vi the).\n`);
console.log("Cach chot loi".padEnd(50), "lai TB".padStart(7), "do lech".padStart(8), "trung vi".padStart(8), "thang%".padStart(7), "lai thang".padStart(9), "lo thua".padStart(8), "PF".padStart(5), "phien".padStart(6), "lai/phien".padStart(9), ">+20%".padStart(6), "top5%".padStart(6));
for (const b of bang) {
  const k = b.tk;
  console.log(
    b.c.ten.padEnd(50), f(k.tb).padStart(7), f(k.doLech, 1).padStart(8), f(k.trungVi).padStart(8), f(k.thang, 1).padStart(7), f(k.tbThang).padStart(9), f(k.tbThua).padStart(8), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), f(k.laiMoiPhien, 3).padStart(9), f(k.tren20, 1).padStart(6), f(k.dinh5Pct, 0).padStart(6)
  );
}
console.log("\nLai TB theo giai doan (nam vao lenh):", TEN_KY.map((t, i) => `${t} (n=${bang[0].soKy[i]})`).join(" | "));
for (const b of bang) console.log("  " + b.c.ten.padEnd(50), b.ky.map((v) => f(v).padStart(7)).join(" | "));

// ---------- 7. Phan tich them ----------
// Danh muc gia dinh toi da K vi the cung luc, moi vi the = 1/K von hien co luc vao, lenh moi luc het cho bi BO (cung thu tu vao lenh cho moi cach).
// Lai/lo cua lenh tinh 1 lan luc thoat cuoi cung (theo so phien trung binh co trong so) - xap xi de so sanh cac cach, khong phai duong von theo ngay.
function taoNgauNhien(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function danhMuc(kqs, ds, K, seed = 1) {
  const rng = taoNgauNhien(seed);
  const muc = [];
  ds.forEach((t, i) => {
    const r = kqs[i];
    if (!r) return;
    const jRa = Math.min(t.n - 1, t.iv + Math.max(1, Math.round(r.phien)));
    muc.push({ ma: t.ma, ngayVao: t.ngay, ngayRa: t.ngayArr[jRa], ret: r.ret, khoa: rng() });
  });
  muc.sort((a, b) => (a.ngayVao < b.ngayVao ? -1 : a.ngayVao > b.ngayVao ? 1 : a.khoa - b.khoa));
  let von = 1;
  let dinh = 1;
  let sut = 0;
  const dangGiu = [];
  const dongDen = (d) => {
    dangGiu.sort((a, b) => (a.ngayRa < b.ngayRa ? -1 : 1));
    while (dangGiu.length && dangGiu[0].ngayRa <= d) {
      const a = dangGiu.shift();
      von += a.size * (a.ret / 100);
      dinh = Math.max(dinh, von);
      sut = Math.max(sut, 1 - von / dinh);
    }
  };
  let lay = 0;
  let bo = 0;
  for (const m of muc) {
    dongDen(m.ngayVao);
    if (dangGiu.length >= K) {
      bo++;
      continue;
    }
    dangGiu.push({ ngayRa: m.ngayRa, size: von / K, ret: m.ret });
    lay++;
  }
  dongDen("9999");
  const nam = (Date.parse(muc[muc.length - 1].ngayRa) - Date.parse(muc[0].ngayVao)) / (365.25 * 86400e3);
  return { boi: von, cagr: (Math.pow(von, 1 / nam) - 1) * 100, sut: sut * 100, lay, bo };
}
const SO_LAN_XAO = 100;
console.log("\n=== Danh muc GIOI HAN SO VI THE (von chia deu 1/K, lenh moi luc het cho bi bo) - lai gop/nam, TB va khoang 10%-90% qua " + SO_LAN_XAO + " lan xao tron thu tu lenh cung ngay ===");
for (const K of [10, 20, 40]) {
  console.log(`  K = ${K} vi the:`);
  for (const b of bang) {
    const kqs = lenh.map((t) => moPhong(t, b.c));
    const cg = [];
    const st = [];
    let lay = 0;
    for (let s = 1; s <= SO_LAN_XAO; s++) {
      const d = danhMuc(kqs, lenh, K, s);
      cg.push(d.cagr);
      st.push(d.sut);
      lay += d.lay;
    }
    cg.sort((x, y) => x - y);
    console.log("    " + b.c.ten.padEnd(50), `${f(tb(cg), 1).padStart(5)}%/nam (10-90%: ${f(cg[Math.floor(SO_LAN_XAO * 0.1)], 1)} .. ${f(cg[Math.floor(SO_LAN_XAO * 0.9)], 1)}) | sut TB ${f(tb(st), 0).padStart(3)}% | lenh lay TB ${String(Math.round(lay / SO_LAN_XAO)).padStart(4)}`);
  }
}

console.log("\n=== Ly do thoat (theo engine) va lai TB cach hien tai ===");
{
  const hienTai = bang[0].kqs;
  const nhom = { 1: [], 2: [], 3: [], 5: [] };
  hienTai.forEach((r, i) => nhom[r.lyDo]?.push(r.ret));
  const ten = { 1: "Tin hieu BAN (diem so)", 2: "Cham cat lo ban dau", 3: "Bao ve hoa von (sau TP2)", 5: "Chot het bang cac moc" };
  for (const k of [1, 2, 3, 5]) console.log(`  ${ten[k].padEnd(28)} n=${String(nhom[k].length).padStart(5)} (${((nhom[k].length / hienTai.length) * 100).toFixed(0)}%)  lai TB ${f(tb(nhom[k]))}%`);
}

console.log("\n=== Khoang cach muc cat lo / TP cua CAC LAN VAO LENH LICH SU (% so voi gia vao) ===");
{
  const pc = (t, x) => (x / t.E - 1) * 100;
  const cot = { "Cat lo": lenh.map((t) => pc(t, t.S)), TP1: lenh.map((t) => pc(t, t.tp[0])), TP2: lenh.map((t) => pc(t, t.tp[1])), TP3: lenh.map((t) => pc(t, t.tp[2])) };
  for (const [k, a] of Object.entries(cot)) console.log(`  ${k.padEnd(7)} trung vi ${f(md(a), 1)}% | TB ${f(tb(a), 1)}%`);
  console.log(`  TP1 dung san +5%: ${((lenh.filter((t) => Math.abs(pc(t, t.tp[0]) - 5) < 0.15).length / lenh.length) * 100).toFixed(0)}% lenh | TP2 dung san +10%: ${((lenh.filter((t) => Math.abs(pc(t, t.tp[1]) - 10) < 0.15).length / lenh.length) * 100).toFixed(0)}% lenh`);
  const mfe = lenh.map((t) => {
    let cao = 0;
    for (let i = t.iv + 1; i <= t.jEng; i++) cao = Math.max(cao, t.high[i]);
    return (cao / t.E - 1) * 100;
  });
  console.log(`  Lai toi da tung dat duoc trong lenh (MFE): trung vi ${f(md(mfe), 1)}% | TB ${f(tb(mfe), 1)}% | cham TP1 ${((lenh.filter((t, i) => mfe[i] >= pc(t, t.tp[0])).length / lenh.length) * 100).toFixed(0)}% | TP2 ${((lenh.filter((t, i) => mfe[i] >= pc(t, t.tp[1])).length / lenh.length) * 100).toFixed(0)}% | TP3 ${((lenh.filter((t, i) => mfe[i] >= pc(t, t.tp[2])).length / lenh.length) * 100).toFixed(0)}%`);
}

console.log("\n=== Theo LOAI VAO LENH goc (cach hien tai / cach 'khong chot, sau TP1 thoat khi dong cua < Kijun') ===");
{
  const ten = { 1: "Mua thuong (tin hieu chinh)", 2: "Mua LAI (sau khi bi ban)", 3: "Mua MUON (bo lo dot mua)" };
  const kijunTP1 = CACH.find((c) => c.ten.startsWith("Khong chot, nhung sau khi cham TP1"));
  for (const loai of [1, 2, 3]) {
    const ds = lenh.filter((t) => t.loai === loai);
    if (!ds.length) continue;
    const a = ds.map((t) => moPhong(t, CACH[0])).filter(Boolean);
    const b = ds.map((t) => moPhong(t, kijunTP1)).filter(Boolean);
    const ka = thongKe(a);
    const kb = thongKe(b);
    console.log(`  ${ten[loai].padEnd(30)} n=${String(ds.length).padStart(4)} | hien tai: lai TB ${f(ka.tb).padStart(5)}% thang ${f(ka.thang, 0)}% PF ${f(ka.pf)} | Kijun sau TP1: lai TB ${f(kb.tb).padStart(5)}% thang ${f(kb.thang, 0)}% PF ${f(kb.pf)}`);
  }
}
console.log("\n=== Cac lo MUA THEM (lo phu, thoat khi cham stop rieng hoac lenh goc bi ban; chua tinh chot loi rieng) ===");
for (const loai of ["Mua them SAU TP3", "Mua them GIUA CHUNG"]) {
  const ds = loMuaThem.filter((x) => x.loai === loai);
  if (!ds.length) continue;
  const r = ds.map((x) => x.ret);
  const ky = [0, 1, 2].map((k) => tb(ds.filter((x) => kyOf(x.ngay) === k).map((x) => x.ret)));
  console.log(`  ${loai.padEnd(22)} n=${String(ds.length).padStart(4)} | lai TB ${f(tb(r)).padStart(5)}% | trung vi ${f(md(r))}% | thang ${f((r.filter((x) => x > 0).length / r.length) * 100, 0)}% | phien TB ${f(tb(ds.map((x) => x.phien)), 1)} | theo giai doan ${ky.map((v) => f(v)).join(" / ")}`);
}

console.log("\n=== Cat lo roi gia QUAY LAI? (lenh thoat vi cham cat lo ban dau, cach hien tai) ===");
{
  const dsCatLo = [];
  bang[0].kqs.forEach((r, i) => {
    if (r.lyDo !== 2) return;
  });
  let n = 0;
  let veGiaVao = 0;
  let cao10 = 0;
  let tren10 = 0;
  for (const t of lenh) {
    const r = moPhong(t, CACH[0]);
    if (!r || r.lyDo !== 2) continue;
    const gia = Math.min(t.open[r.jThoat], t.S);
    if (r.jThoat + 10 >= t.n) continue;
    n++;
    let cao = 0;
    for (let i = r.jThoat + 1; i <= r.jThoat + 10; i++) cao = Math.max(cao, t.high[i]);
    if (cao >= t.E) veGiaVao++;
    if (cao >= gia * 1.05) cao10++;
    if (t.close[r.jThoat + 10] > gia) tren10++;
    dsCatLo.push((gia / t.E - 1) * 100);
  }
  console.log(`  ${n} lenh bi cat lo | lo TB theo gia khop ${f(tb(dsCatLo))}% | trong 10 phien sau: gia quay lai >= gia vao ${((veGiaVao / n) * 100).toFixed(0)}% | len >= +5% so voi gia cat ${((cao10 / n) * 100).toFixed(0)}% | dong cua T+10 cao hon gia cat ${((tren10 / n) * 100).toFixed(0)}%`);
}
