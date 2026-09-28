// DAY RIENG CHI BAO KY THUAT CHO BO LOC (RSI, MACD, Stochastic, Bollinger, MA, ...): tai lich su gia, tinh chi bao roi POST vao /api/upload-chi-bao.
// CHI dung de nap/lam moi bang chi_bao_ky_thuat - KHONG dung toi tin hieu MUA/BAN, lenh, thong bao (khac chayPipelineDayDu.mjs --upload). Chay 1 lan la xong (~2-4 phut vi phai tai lich su tung ma).
// Khi engine real-time (chayEngineRealTime.mjs --upload) dang chay thi no tu day chi bao moi 1 phut, khong can chay file nay.
//
// CACH CHAY (can DNSE_API_KEY/DNSE_API_SECRET trong .env.dnse.local):
//   node --env-file=.env.dnse.local engine/dich-vu/dayChiBaoLoc.mjs            (chi ghi file CSV, khong upload)
//   CS_UPLOAD_API_KEY=... node --env-file=.env.dnse.local engine/dich-vu/dayChiBaoLoc.mjs --upload
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { taoOpenApiClient } from "../dnse/openApiClient.js";
import { taiLichSuToanBo } from "../loi/quetToanBo.js";
import { tinhChiBaoLocToanBo, xayDungCsvChiBao } from "../loi/chiBaoLoc.js";

const apiKey = process.env.DNSE_API_KEY;
const apiSecret = process.env.DNSE_API_SECRET;
if (!apiKey || !apiSecret) {
  console.error("Thieu DNSE_API_KEY/DNSE_API_SECRET trong .env.dnse.local. Xem huong dan o chayThuOpenApi.mjs.");
  process.exit(1);
}

async function main() {
  const client = taoOpenApiClient({ apiKey, apiSecret });
  const { dsMa, nenTheoMa, loiTheoMa } = await taiLichSuToanBo(client, { onTienDo: (chuoi) => console.log(chuoi) });
  if (loiTheoMa.length > 0) console.log(`\nCANH BAO: ${loiTheoMa.length} ma khong lay duoc lich su: ${loiTheoMa.slice(0, 20).map((l) => l.ma).join(", ")}`);
  if (nenTheoMa.size < Math.floor(dsMa.length * 0.9)) {
    console.error(`\nDUNG: chi lay duoc ${nenTheoMa.size}/${dsMa.length} ma (< 90%). Kiem tra loi o tren roi chay lai.`);
    process.exit(1);
  }

  const { ds, loi } = tinhChiBaoLocToanBo(nenTheoMa);
  console.log(`\nChi bao ky thuat: ${ds.length} ma${loi.length ? `, ${loi.length} ma loi` : ""}.`);
  const csv = xayDungCsvChiBao(ds);
  const thuMuc = fileURLToPath(new URL("../output/", import.meta.url));
  mkdirSync(thuMuc, { recursive: true });
  const duongDan = thuMuc + "chi_bao_moi_nhat.csv";
  writeFileSync(duongDan, csv, "utf-8");
  console.log(`Da ghi file: ${duongDan}`);

  if (!process.argv.includes("--upload")) return;
  const uploadKey = process.env.CS_UPLOAD_API_KEY;
  if (!uploadKey) {
    console.log("\n--upload duoc yeu cau nhung THIEU CS_UPLOAD_API_KEY - BO QUA upload (chi ghi file).");
    return;
  }
  const gocWeb = process.env.CS_GOC_WEB || "https://www.cloudstock.id.vn";
  const res = await fetch(`${gocWeb}/api/upload-chi-bao`, {
    method: "POST",
    headers: { "Content-Type": "text/csv", "x-api-key": uploadKey },
    body: csv,
    signal: AbortSignal.timeout(120000),
  });
  console.log(`\nHTTP ${res.status}:`, (await res.text()).slice(0, 500));
}

main().catch((loi) => {
  console.error("LOI:", loi);
  process.exit(1);
});
