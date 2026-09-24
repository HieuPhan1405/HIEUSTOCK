// DICH VU CHINH REAL-TIME (Giai doan 4 hoan tat): chay NEN lien tuc, tu dong tinh lai tin hieu
// ngay khi co nen moi ve tu WebSocket DNSE OpenAPI - khong can tu tay chay lai
// chayPipelineDayDu.mjs moi lan muon tin hieu moi.
//
// Luong hoat dong:
//   1. Luc khoi dong: lay TOAN BO lich su gia qua REST (giong chayPipelineDayDu.mjs) 1 LAN.
//   2. Ket noi WebSocket, subscribe nen "1D" cho toan bo vu tru quet + VNINDEX.
//   3. Moi khi co nen moi ve (bat ky ma nao) -> cap nhat vao bo nho, danh dau "co thay doi".
//   4. Cu moi CHU_KY_TINH_LAI_MS (mac dinh 10 giay) - NEU co thay doi tu lan truoc - TINH LAI TOAN
//      BO (giong AmiBroker, an toan hon tinh tang dan - xem plan) roi ghi de 1 file CSV cuc bo.
//
// AN TOAN - giong het chayPipelineDayDu.mjs: MAC DINH CHI ghi CSV cuc bo, KHONG tu POST len web.
// Muon POST that (SAU KHI da doi chieu on dinh voi AmiBroker - xem Giai doan 5) thi chay voi flag
// --upload + 2 bien moi truong CS_UPLOAD_API_KEY + CS_XAC_NHAN_UPLOAD=DONG_Y.
//
// CACH CHAY (can DNSE_API_KEY/DNSE_API_SECRET trong .env.dnse.local):
//   node --env-file=.env.dnse.local engine/dich-vu/chayEngineRealTime.mjs
// Dung Ctrl+C de dung. De chay lien tuc trong 1 cua so terminal rieng trong gio giao dich (9h-15h).
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { taoOpenApiClient } from "../dnse/openApiClient.js";
import { ketNoiWebSocketDNSE } from "../dnse/wsClient.js";
import { taiLichSuToanBo, tinhTinHieuToanBo, capNhatNenMoiNhat, chiaNhoMang } from "../loi/quetToanBo.js";
import { xayDungCSV } from "../loi/csvDauRa.js";
import { tinhChecklistBatDayToanBo, xayDungCsvBatDay } from "../loi/checklistBatDay.js";

const apiKey = process.env.DNSE_API_KEY;
const apiSecret = process.env.DNSE_API_SECRET;
if (!apiKey || !apiSecret) {
  console.error("Thieu DNSE_API_KEY/DNSE_API_SECRET trong .env.dnse.local. Xem huong dan o chayThuOpenApi.mjs.");
  process.exit(1);
}

const CHU_KY_TINH_LAI_MS = 10000; // 10s - du "gan real-time", tranh tinh lai qua day (~389 ma tinh lai TOAN BO moi lan)
// Checklist bat day (VN100) chi phu thuoc du lieu NGAY (HHV252/MA200/RSI...), khong can do tuoi
// nhu tin hieu MUA/BAN chinh - tinh lai/upload rieng theo chu ky THUA hon (15 phut) de tranh ghi DB
// (upload-bat-day) qua day trong khi tin hieu chinh van tinh lai moi 10s nhu binh thuong.
const CHU_KY_BAT_DAY_MS = 15 * 60 * 1000;

const ngayIsoTuGiay = (giay) => new Date(giay * 1000).toISOString().slice(0, 10);
function chuyenDoiNenTuWS(doi) {
  return { t: ngayIsoTuGiay(doi.time), o: doi.open, h: doi.high, l: doi.low, c: doi.close, v: doi.volume ?? 0 };
}

async function main() {
  const client = taoOpenApiClient({ apiKey, apiSecret });
  const { dsMa, vniNen, sanTheoMa, nenTheoMa, loiTheoMa } = await taiLichSuToanBo(client, {
    onTienDo: (chuoi) => console.log(chuoi),
  });

  if (loiTheoMa.length > 0) {
    console.log(`\nCANH BAO: ${loiTheoMa.length} ma khong lay duoc lich su luc khoi dong:`);
    for (const l of loiTheoMa.slice(0, 30)) console.log(`  ${l.ma}: ${l.loi}`);
  }
  const SO_MA_TOI_THIEU = Math.floor(dsMa.length * 0.9);
  if (nenTheoMa.size < SO_MA_TOI_THIEU) {
    console.error(`\nDUNG: chi lay duoc ${nenTheoMa.size}/${dsMa.length} ma luc khoi dong (< ${SO_MA_TOI_THIEU} toi thieu). Kiem tra loi roi chay lai.`);
    process.exit(1);
  }

  const thuMucOutput = fileURLToPath(new URL("../output/", import.meta.url));
  mkdirSync(thuMucOutput, { recursive: true });
  const duongDanCsv = thuMucOutput + "tin_hieu_realtime_moi_nhat.csv";
  const duongDanCsvBatDay = thuMucOutput + "bat_day_realtime_moi_nhat.csv";

  const uploadBat = process.argv.includes("--upload");
  const uploadKey = process.env.CS_UPLOAD_API_KEY;
  const uploadDuocPhep = uploadBat && !!uploadKey && process.env.CS_XAC_NHAN_UPLOAD === "DONG_Y";
  // MAC DINH tat Zalo khi dang thu nghiem engine (--upload) - CHI gui Zalo that neu chu dong dat
  // CS_CHO_PHEP_ZALO=DONG_Y (bat theo kieu "opt-in", an toan hon la mac dinh bat).
  const choPhepZalo = process.env.CS_CHO_PHEP_ZALO === "DONG_Y";
  if (uploadBat) {
    console.log(
      uploadDuocPhep
        ? `\nCANH BAO: --upload dang BAT - se tu dong POST THAT len web moi lan tinh lai co thay doi. Zalo: ${choPhepZalo ? "CO GUI THAT" : "DA TAT (mac dinh)"}.`
        : "\n--upload duoc yeu cau nhung THIEU CS_UPLOAD_API_KEY hoac CS_XAC_NHAN_UPLOAD=DONG_Y - se CHI ghi file, khong upload (an toan)."
    );
  }

  async function guiLenWebNeuDuocPhep(csv) {
    if (!uploadDuocPhep) return;
    try {
      const gocWeb = process.env.CS_GOC_WEB || "https://www.cloudstock.id.vn";
      const res = await fetch(`${gocWeb}/api/upload-signals`, {
        method: "POST",
        headers: { "Content-Type": "text/csv", "x-api-key": uploadKey, "x-skip-zalo": choPhepZalo ? "0" : "1" },
        body: csv,
        signal: AbortSignal.timeout(120000),
      });
      console.log(`[upload] HTTP ${res.status}`);
    } catch (loi) {
      console.log(`[upload] LOI: ${loi.message}`);
    }
  }

  async function guiBatDayLenWebNeuDuocPhep(csv) {
    if (!uploadDuocPhep) return;
    try {
      const gocWeb = process.env.CS_GOC_WEB || "https://www.cloudstock.id.vn";
      const res = await fetch(`${gocWeb}/api/upload-bat-day`, {
        method: "POST",
        headers: { "Content-Type": "text/csv", "x-api-key": uploadKey },
        body: csv,
        signal: AbortSignal.timeout(120000),
      });
      console.log(`[upload bat-day] HTTP ${res.status}`);
    } catch (loi) {
      console.log(`[upload bat-day] LOI: ${loi.message}`);
    }
  }

  let coThayDoi = true; // tinh lan dau ngay sau khi tai xong lich su, khong doi tick WebSocket
  let dangTinh = false;
  let lanCuoiTinhBatDay = 0;

  async function tinhLaiVaGhi() {
    if (!coThayDoi || dangTinh) return;
    coThayDoi = false;
    dangTinh = true;
    try {
      const { hang, loiTinhToan } = tinhTinHieuToanBo({ nenTheoMa, vniNen, sanTheoMa });
      if (loiTinhToan.length > 0) {
        console.log(`[canh bao] ${loiTinhToan.length} ma loi khi tinh tin hieu, da bo qua: ${loiTinhToan.slice(0, 5).map((l) => l.ma).join(", ")}${loiTinhToan.length > 5 ? "..." : ""}`);
      }
      const dem = {};
      for (const h of hang) dem[h.tin] = (dem[h.tin] || 0) + 1;
      console.log(
        `[${new Date().toLocaleTimeString("vi-VN")}] Tinh lai xong (${hang.length} dong): MUA=${dem.MUA || 0} NAM GIU=${dem["NAM GIU"] || 0} BAN=${dem.BAN || 0} TRUNG LAP=${dem["TRUNG LAP"] || 0}`
      );

      const csv = xayDungCSV(hang);
      writeFileSync(duongDanCsv, csv, "utf-8");
      await guiLenWebNeuDuocPhep(csv);

      // Checklist bat day: chi tinh lai/upload moi CHU_KY_BAT_DAY_MS (khong can moi 10s nhu tin hieu
      // chinh - xem chu thich tai khai bao hang so o dau file).
      if (Date.now() - lanCuoiTinhBatDay > CHU_KY_BAT_DAY_MS) {
        lanCuoiTinhBatDay = Date.now();
        const dsBatDay = tinhChecklistBatDayToanBo(nenTheoMa);
        console.log(`[${new Date().toLocaleTimeString("vi-VN")}] Checklist bat day (VN100): ${dsBatDay.length} su kien.`);
        const csvBatDay = xayDungCsvBatDay(dsBatDay);
        writeFileSync(duongDanCsvBatDay, csvBatDay, "utf-8");
        await guiBatDayLenWebNeuDuocPhep(csvBatDay);
      }
    } finally {
      dangTinh = false;
    }
  }

  // DNSE OpenAPI gioi han so "streams"/ket noi theo tier tai khoan (tier "normalUser" toi da 200 -
  // xac nhan qua loi that SUBSCRIBE_FAILED/MAX_CHANNELS_EXCEEDED khi thu nhet het ~390 ma vao 1 ket
  // noi duy nhat) - chia nho danh sach ma, moi lo mo 1 ket noi WebSocket rieng (tai lieu cho phep
  // toi da 10 ket noi/tai khoan, du du cho vai lo).
  const KICH_THUOC_KENH_TOI_DA = 190;
  const toanBoMaCanTheoDoi = [...dsMa, "VNINDEX"];
  const nhomMa = chiaNhoMang(toanBoMaCanTheoDoi, KICH_THUOC_KENH_TOI_DA);
  console.log(`\nDang ket noi WebSocket (${nhomMa.length} ket noi, toi da ${KICH_THUOC_KENH_TOI_DA} ma/ket noi do gioi han tier tai khoan)...`);

  const onDataChung = (_loaiDuLieu, doi) => {
    if (!doi.symbol || doi.open == null) return; // khong phai nen OHLC hop le - bo qua an toan
    const mang = doi.symbol === "VNINDEX" ? vniNen : nenTheoMa.get(doi.symbol);
    if (!mang) return; // ma khong nam trong vu tru dang theo doi (khong nen xay ra, phong thu)
    capNhatNenMoiNhat(mang, chuyenDoiNenTuWS(doi));
    coThayDoi = true;
  };

  const dsKetNoi = nhomMa.map((nhom, idx) =>
    ketNoiWebSocketDNSE(
      { apiKey, apiSecret },
      {
        kenh: [{ name: "ohlc.1D.json", symbols: nhom }],
        onTrangThai: (chuoi) => console.log(`[ws#${idx + 1}] ${chuoi}`),
        onLoi: (loi) => console.error(`[ws#${idx + 1} loi] ${loi.message}`),
        onData: onDataChung,
      }
    )
  );

  await tinhLaiVaGhi(); // tinh ngay lan dau voi du lieu REST vua tai, khong doi tick WebSocket
  const henGio = setInterval(tinhLaiVaGhi, CHU_KY_TINH_LAI_MS);

  process.on("SIGINT", () => {
    console.log("\nDang dung dich vu...");
    clearInterval(henGio);
    dsKetNoi.forEach((k) => k.dong());
    process.exit(0);
  });
}

main().catch((loi) => {
  console.error("LOI DICH VU REAL-TIME:", loi);
  process.exit(1);
});
