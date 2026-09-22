// PIPELINE DAY DU (Giai doan 4 cua ke hoach): lay lich su gia toan bo vu tru quet
// (VN30+Midcap+Smallcap, ~389 ma) + VNINDEX tu DNSE OpenAPI, tinh breadth toan thi truong, roi goi
// tinhTinHieuChoMa() cho tung ma de ra CSV dung dinh dang app/api/upload-signals/route.js mong doi.
//
// AN TOAN - MAC DINH CHI GHI FILE CSV RA CUC BO (engine/output/), KHONG tu POST len web. Engine
// nay CHUA duoc doi chieu voi AmiBroker (xem ke hoach Giai doan 5) - upload that se GHI DE du lieu
// that va co the gui Zalo that cho nguoi theo doi, nen phai la hanh dong CO CHU DICH, KHONG mac
// dinh. Tu tay doi chieu file CSV nay voi CSV AmiBroker Explore xuat (7_Export_LenWeb.afl) it nhat
// vai ngay/vai chuc ma truoc khi nghi den upload that.
//
// Chi khi da doi chieu on dinh va MUON THU upload that, chay voi flag --upload VA ca 2 bien moi
// truong duoi day (thieu 1 trong 2 se KHONG upload, chi ghi file - an toan mac dinh):
//   CS_UPLOAD_API_KEY=<UPLOAD_API_KEY tren Vercel - dung key TEST rieng neu co, KHONG dung production
//                       key that cho toi khi qua Giai doan 5>
//   CS_XAC_NHAN_UPLOAD=DONG_Y
//
// CACH CHAY (can DNSE_API_KEY/DNSE_API_SECRET trong .env.dnse.local - xem chayThuOpenApi.mjs):
//   node --env-file=.env.dnse.local engine/dich-vu/chayPipelineDayDu.mjs
//   node --env-file=.env.dnse.local engine/dich-vu/chayPipelineDayDu.mjs --upload   (sau khi da doi chieu xong)
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { taoOpenApiClient, layNenOHLC } from "../dnse/openApiClient.js";
import { VN30, VN_MIDCAP, VN_SMALLCAP } from "../danh-sach/vonHoa.js";
import { laySanTheoDanhSachMa } from "../loi/vndirectSanNganh.js";
import { tinhTatCaBreadth } from "../loi/breadth.js";
import { tinhTinHieuChoMa } from "../tinhTinHieuChoMa.js";
import { sma } from "../loi/mang.js";
import { xayDungCSV } from "../loi/csvDauRa.js";

const apiKey = process.env.DNSE_API_KEY;
const apiSecret = process.env.DNSE_API_SECRET;
if (!apiKey || !apiSecret) {
  console.error("Thieu DNSE_API_KEY/DNSE_API_SECRET trong .env.dnse.local. Xem huong dan o chayThuOpenApi.mjs.");
  process.exit(1);
}

const SO_NGAY_LICH_SU = 1600; // ~4.4 nam lich, du cho HHV(H,252) + Ichimoku + on dinh Kijun/duong can bang
const CHO_GIUA_MOI_MA_MS = 200; // gian cach nhe giua cac request - tranh bi coi la spam API that

const client = taoOpenApiClient({ apiKey, apiSecret });
const cho = (ms) => new Promise((r) => setTimeout(r, ms));

async function layNenAnToan(symbol, type) {
  const den = Math.floor(Date.now() / 1000);
  const tu = den - SO_NGAY_LICH_SU * 86400;
  let loiCuoi;
  for (let lan = 1; lan <= 3; lan++) {
    try {
      return await layNenOHLC(client, { symbol, type, resolution: "1D", tu, den });
    } catch (loi) {
      loiCuoi = loi;
      if (lan < 3) await cho(500 * lan);
    }
  }
  throw loiCuoi;
}

async function main() {
  const dsMa = [...new Set([...VN30, ...VN_MIDCAP, ...VN_SMALLCAP])].sort();
  console.log(`Vu tru quet: ${dsMa.length} ma. Dang lay VNINDEX...`);

  const vniNen = await layNenAnToan("VNINDEX", "INDEX");
  const vniCloseByDate = new Map(vniNen.map((b) => [b.t, b.c]));
  console.log(`VNINDEX: ${vniNen.length} nen.`);

  console.log("Dang lay san niem yet (HOSE/HNX/UPCOM) tu VNDirect...");
  const sanTheoMa = await laySanTheoDanhSachMa(dsMa).catch((loi) => {
    console.log(`  CANH BAO: khong lay duoc san (${loi.message}) - cot 'san' se de trong, khong anh huong tin hieu MUA/BAN.`);
    return new Map();
  });

  const nenTheoMa = new Map();
  const loiTheoMa = [];
  console.log("Dang lay lich su gia tung ma (co the mat vai phut)...");
  for (let i = 0; i < dsMa.length; i++) {
    const ma = dsMa[i];
    try {
      const nen = await layNenAnToan(ma, "STOCK");
      if (!nen || nen.length < 60) throw new Error(`chi ${nen?.length ?? 0} nen - qua it de tinh chi bao`);
      nenTheoMa.set(ma, nen);
    } catch (loi) {
      loiTheoMa.push({ ma, loi: String(loi.message || loi) });
    }
    if ((i + 1) % 20 === 0 || i === dsMa.length - 1) console.log(`  ${i + 1}/${dsMa.length} ma (${loiTheoMa.length} loi)...`);
    await cho(CHO_GIUA_MOI_MA_MS);
  }

  if (loiTheoMa.length > 0) {
    console.log(`\nCANH BAO: ${loiTheoMa.length} ma khong lay duoc du lieu:`);
    for (const l of loiTheoMa.slice(0, 30)) console.log(`  ${l.ma}: ${l.loi}`);
  }

  const SO_MA_TOI_THIEU = Math.floor(dsMa.length * 0.9);
  if (nenTheoMa.size < SO_MA_TOI_THIEU) {
    console.error(
      `\nDUNG: chi lay duoc ${nenTheoMa.size}/${dsMa.length} ma (< ${SO_MA_TOI_THIEU} toi thieu). ` +
        `KHONG tinh tin hieu de tranh du lieu thieu lam sai breadth va tranh upload xoa nham ma con thieu. Kiem tra loi o tren roi chay lai.`
    );
    process.exit(1);
  }

  console.log("\nDang tinh breadth toan thi truong...");
  const ketQuaBreadth = tinhTatCaBreadth((ma) => {
    const nen = nenTheoMa.get(ma);
    if (!nen) return undefined;
    const close = nen.map((b) => b.c);
    const ma50 = sma(close, 50);
    return { gia: close[close.length - 1], ma50: ma50[ma50.length - 1] };
  });
  console.log(`Breadth trung binh thi truong: ${ketQuaBreadth.trungBinh.toFixed(1)}%`);

  console.log("\nDang tinh tin hieu tung ma...");
  const hang = [];
  const loiTinhToan = [];
  for (const [ma, nen] of nenTheoMa) {
    try {
      const vniClose = nen.map((b) => vniCloseByDate.get(b.t) ?? null);
      hang.push(tinhTinHieuChoMa({ ma, nen, vniClose, san: sanTheoMa.get(ma) ?? null, ketQuaBreadth }));
    } catch (loi) {
      loiTinhToan.push({ ma, loi: String(loi.message || loi) });
    }
  }
  // VNINDEX cung xuat 1 dong (hien thi nhu 1 chi so tren web - xem nhanh ma==="VNINDEX" trong tinhTinHieuChoMa).
  try {
    const vniCloseAligned = vniNen.map((b) => vniCloseByDate.get(b.t));
    hang.push(tinhTinHieuChoMa({ ma: "VNINDEX", nen: vniNen, vniClose: vniCloseAligned, san: "HOSE", ketQuaBreadth }));
  } catch (loi) {
    loiTinhToan.push({ ma: "VNINDEX", loi: String(loi.message || loi) });
  }

  if (loiTinhToan.length > 0) {
    console.log(`\nCANH BAO: ${loiTinhToan.length} ma loi khi tinh tin hieu (bo qua):`);
    for (const l of loiTinhToan.slice(0, 30)) console.log(`  ${l.ma}: ${l.loi}`);
  }

  const dem = {};
  for (const h of hang) dem[h.tin] = (dem[h.tin] || 0) + 1;
  console.log(
    `\nTong ket: ${hang.length} dong. MUA=${dem.MUA || 0} NAM GIU=${dem["NAM GIU"] || 0} BAN=${dem.BAN || 0} TRUNG LAP=${dem["TRUNG LAP"] || 0}`
  );

  const csv = xayDungCSV(hang);
  const thuMucOutput = fileURLToPath(new URL("../output/", import.meta.url));
  mkdirSync(thuMucOutput, { recursive: true });
  const duongDan = thuMucOutput + `tin_hieu_engine_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
  writeFileSync(duongDan, csv, "utf-8");
  console.log(`\nDa ghi file: ${duongDan}`);
  console.log("So sanh file nay voi CSV AmiBroker Explore xuat (7_Export_LenWeb.afl) truoc khi nghi den upload that.");

  if (!process.argv.includes("--upload")) return;

  const uploadKey = process.env.CS_UPLOAD_API_KEY;
  const xacNhan = process.env.CS_XAC_NHAN_UPLOAD;
  if (!uploadKey || xacNhan !== "DONG_Y") {
    console.log("\n--upload duoc yeu cau nhung THIEU CS_UPLOAD_API_KEY hoac CS_XAC_NHAN_UPLOAD=DONG_Y - BO QUA upload (chi ghi file, an toan).");
    return;
  }
  const gocWeb = process.env.CS_GOC_WEB || "https://www.cloudstock.id.vn";
  console.log(`\nCANH BAO: dang POST THAT len ${gocWeb}/api/upload-signals - se GHI DE du lieu that va co the gui Zalo that.`);
  const res = await fetch(`${gocWeb}/api/upload-signals`, {
    method: "POST",
    headers: { "Content-Type": "text/csv", "x-api-key": uploadKey },
    body: csv,
    signal: AbortSignal.timeout(120000),
  });
  const vanBan = await res.text();
  console.log(`HTTP ${res.status}:`, vanBan.slice(0, 1000));
}

main().catch((loi) => {
  console.error("LOI PIPELINE:", loi);
  process.exit(1);
});
