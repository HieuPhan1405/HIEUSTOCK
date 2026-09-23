// PIPELINE DAY DU - CHAY 1 LAN (Giai doan 4 cua ke hoach): lay lich su gia toan bo vu tru quet
// (VN30+Midcap+Smallcap, ~389 ma) + VNINDEX tu DNSE OpenAPI, tinh breadth toan thi truong, roi goi
// tinhTinHieuChoMa() cho tung ma de ra CSV dung dinh dang app/api/upload-signals/route.js mong doi.
//
// Muon chay LIEN TUC, tu dong tinh lai khi co nen moi (real-time qua WebSocket) thay vi phai tu
// chay lai file nay - xem engine/dich-vu/chayEngineRealTime.mjs (dung chung logic voi file nay
// qua engine/loi/quetToanBo.js).
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
import { taoOpenApiClient } from "../dnse/openApiClient.js";
import { taiLichSuToanBo, tinhTinHieuToanBo } from "../loi/quetToanBo.js";
import { xayDungCSV } from "../loi/csvDauRa.js";

const apiKey = process.env.DNSE_API_KEY;
const apiSecret = process.env.DNSE_API_SECRET;
if (!apiKey || !apiSecret) {
  console.error("Thieu DNSE_API_KEY/DNSE_API_SECRET trong .env.dnse.local. Xem huong dan o chayThuOpenApi.mjs.");
  process.exit(1);
}

async function main() {
  const client = taoOpenApiClient({ apiKey, apiSecret });
  const { dsMa, vniNen, sanTheoMa, nenTheoMa, loiTheoMa } = await taiLichSuToanBo(client, {
    onTienDo: (chuoi) => console.log(chuoi),
  });

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

  console.log("\nDang tinh breadth + tin hieu tung ma...");
  const { ketQuaBreadth, hang, loiTinhToan } = tinhTinHieuToanBo({ nenTheoMa, vniNen, sanTheoMa });
  console.log(`Breadth trung binh thi truong: ${ketQuaBreadth.trungBinh.toFixed(1)}%`);

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
  // MAC DINH tat Zalo khi thu nghiem engine - CHI gui that neu chu dong dat CS_CHO_PHEP_ZALO=DONG_Y.
  const choPhepZalo = process.env.CS_CHO_PHEP_ZALO === "DONG_Y";
  const gocWeb = process.env.CS_GOC_WEB || "https://www.cloudstock.id.vn";
  console.log(`\nCANH BAO: dang POST THAT len ${gocWeb}/api/upload-signals - se GHI DE du lieu that. Zalo: ${choPhepZalo ? "CO GUI THAT" : "DA TAT (mac dinh)"}.`);
  const res = await fetch(`${gocWeb}/api/upload-signals`, {
    method: "POST",
    headers: { "Content-Type": "text/csv", "x-api-key": uploadKey, "x-skip-zalo": choPhepZalo ? "0" : "1" },
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
