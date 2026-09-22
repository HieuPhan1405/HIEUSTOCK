// CONG CU DOI CHIEU (Giai doan 1-3 va 5 cua ke hoach): so sanh 2 file CSV (1 file AmiBroker
// Explore xuat tu 7_Export_LenWeb.afl, 1 file engine JS moi ghi ra tu chayPipelineDayDu.mjs) -
// bao ra ma nao LECH va lech cot nao, de khong phai tu mat doi tung dong.
//
// LUU Y: 2 file nen lay o CUNG 1 THOI DIEM (ly tuong la SAU khi dong cua, ca 2 cung la du lieu EOD)
// - so sanh giua phien se lech do gia dang chay lien tuc, KHONG phai loi tinh toan.
//
// CACH CHAY:
//   node engine/dich-vu/soSanhCSV.mjs <file_ami_broker.csv> <file_engine.csv>
import { readFileSync } from "node:fs";

const [, , duongDanA, duongDanB] = process.argv;
if (!duongDanA || !duongDanB) {
  console.error("Dung: node engine/dich-vu/soSanhCSV.mjs <file_amibroker.csv> <file_engine.csv>");
  process.exit(1);
}

// Cac cot dang so (so sanh co dung sai), phan con lai (khong liet ke o day) coi la van ban/boolean.
const COT_SO = new Set([
  "diem", "trend", "mom", "dt", "adx", "gia", "doi", "rs_vni", "breadth_nganh", "kijun", "gg_top",
  "gg_bot", "dinh_52t", "stop_loss", "tp1", "tp2", "tp3", "gtgd_tb20", "so_phien_giu", "lai_lo_pct",
  "sanyaku", "gia_mua", "diem_rank", "diem_confidence", "khoi_luong_tb20", "gia_kich_hoat",
  "moc_gia", "moc_cach_pct", "diem_neu_vuot", "gia_mua_moi", "stop_moi", "tp1_moi", "tp2_moi",
  "tp3_moi", "stop_bao_ve", "cat_moi", "ly_do_ban",
]);
const COT_BOOL = new Set(["mat_than", "fvg_ok", "ban_bot", "ngay_bien_doi", "cho_phien_sau", "mua_moi", "dang_giu_moi", "dang_bao_ve_lai"]);

function docCSV(duongDan) {
  const noiDung = readFileSync(duongDan, "utf-8");
  const dong = noiDung.trim().split(/\r?\n/);
  const header = dong[0].split(",").map((h) => h.trim());
  const theoMa = new Map();
  for (let i = 1; i < dong.length; i++) {
    if (!dong[i].trim()) continue;
    const cot = dong[i].split(",");
    if (cot.length !== header.length) continue; // dong hong (dinh dong) - bo qua, giong route.js
    const hang = {};
    header.forEach((ten, idx) => (hang[ten] = cot[idx]));
    if (hang.ma) theoMa.set(hang.ma, hang);
  }
  return { header, theoMa };
}

function chuanHoaSo(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function chuanHoaBool(v) {
  if (v === undefined || v === null || v === "") return null;
  return v === "1" || v === "true" || v === "True" || v === "TRUE";
}

function chuanHoaText(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

function soKhac(a, b) {
  if (a == null && b == null) return false;
  if (a == null || b == null) return true;
  const nguong = Math.max(0.01 * Math.max(Math.abs(a), Math.abs(b)), 0.05);
  return Math.abs(a - b) > nguong;
}

const { header: headerA, theoMa: maA } = docCSV(duongDanA);
const { header: headerB, theoMa: maB } = docCSV(duongDanB);
const cotChung = headerA.filter((c) => c !== "ma" && headerB.includes(c));

const dsMaA = new Set(maA.keys());
const dsMaB = new Set(maB.keys());
const chiA = [...dsMaA].filter((m) => !dsMaB.has(m)).sort();
const chiB = [...dsMaB].filter((m) => !dsMaA.has(m)).sort();
const caHai = [...dsMaA].filter((m) => dsMaB.has(m)).sort();

console.log(`File A (${duongDanA}): ${dsMaA.size} ma.`);
console.log(`File B (${duongDanB}): ${dsMaB.size} ma.`);
console.log(`Cot chung de so sanh: ${cotChung.length} (${cotChung.join(", ")})`);

if (chiA.length) console.log(`\nCHI CO O FILE A (thieu o B): ${chiA.join(", ")}`);
if (chiB.length) console.log(`\nCHI CO O FILE B (thieu o A): ${chiB.join(", ")}`);

const lechTin = [];
const lechKhac = [];
let soKhopHoanToan = 0;

for (const ma of caHai) {
  const hA = maA.get(ma);
  const hB = maB.get(ma);
  const lechCot = [];
  for (const cot of cotChung) {
    const vA = hA[cot];
    const vB = hB[cot];
    let khac;
    if (COT_SO.has(cot)) khac = soKhac(chuanHoaSo(vA), chuanHoaSo(vB));
    else if (COT_BOOL.has(cot)) khac = chuanHoaBool(vA) !== chuanHoaBool(vB);
    else khac = chuanHoaText(vA) !== chuanHoaText(vB);
    if (khac) lechCot.push({ cot, a: vA, b: vB });
  }
  if (lechCot.length === 0) {
    soKhopHoanToan++;
    continue;
  }
  const lechTinField = lechCot.find((l) => l.cot === "tin");
  if (lechTinField) lechTin.push({ ma, a: lechTinField.a, b: lechTinField.b, tongSoCotLech: lechCot.length });
  else lechKhac.push({ ma, lechCot });
}

console.log(`\n===== TONG KET (${caHai.length} ma co o ca 2 file) =====`);
console.log(`Khop HOAN TOAN: ${soKhopHoanToan}`);
console.log(`Lech cot 'tin' (MUA/BAN/NAM GIU/TRUNG LAP) - QUAN TRONG NHAT: ${lechTin.length}`);
console.log(`Lech cot khac (khong dung 'tin'): ${lechKhac.length}`);

if (lechTin.length) {
  console.log("\n--- LECH TIN (uu tien xem truoc) ---");
  for (const l of lechTin) console.log(`  ${l.ma}: A=${l.a} B=${l.b} (con ${l.tongSoCotLech - 1} cot khac cung lech)`);
}
if (lechKhac.length) {
  console.log("\n--- LECH COT KHAC (toi da 20 ma dau) ---");
  for (const l of lechKhac.slice(0, 20)) {
    console.log(`  ${l.ma}: ${l.lechCot.map((x) => `${x.cot}(A=${x.a}|B=${x.b})`).join(", ")}`);
  }
}
