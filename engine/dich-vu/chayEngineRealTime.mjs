// DICH VU CHINH REAL-TIME (Giai doan 4 hoan tat): chay NEN lien tuc, tu dong tinh lai tin hieu
// ngay khi co nen moi ve tu WebSocket DNSE OpenAPI - khong can tu tay chay lai
// chayPipelineDayDu.mjs moi lan muon tin hieu moi.
//
// Luong hoat dong:
//   1. Luc khoi dong: lay TOAN BO lich su gia qua REST (giong chayPipelineDayDu.mjs) 1 LAN.
//   2. Ket noi WebSocket, subscribe nen "1D" cho toan bo vu tru quet + VNINDEX.
//   3. Moi khi co nen moi ve (bat ky ma nao) -> cap nhat vao bo nho, danh dau "co thay doi".
//   4. Cu moi CHU_KY_TINH_LAI_MS (mac dinh 30 giay) - NEU co thay doi tu lan truoc - TINH LAI TOAN
//      BO (giong AmiBroker, an toan hon tinh tang dan - xem plan) roi ghi de 1 file CSV cuc bo.
//
// AN TOAN - giong het chayPipelineDayDu.mjs: MAC DINH CHI ghi CSV cuc bo, KHONG tu POST len web.
// Muon POST that (SAU KHI da doi chieu on dinh voi AmiBroker - xem Giai doan 5) thi chay voi flag
// --mot-lan: day MOT LAN roi thoat (xem DAY_LEN_WEB_ENGINE.bat).
// --upload + 2 bien moi truong CS_UPLOAD_API_KEY + CS_XAC_NHAN_UPLOAD=DONG_Y.
//
// CACH CHAY (can DNSE_API_KEY/DNSE_API_SECRET trong .env.dnse.local):
//   node --env-file=.env.dnse.local engine/dich-vu/chayEngineRealTime.mjs
// Dung Ctrl+C de dung. De chay lien tuc trong 1 cua so terminal rieng trong gio giao dich (9h-15h).
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { taoOpenApiClient } from "../dnse/openApiClient.js";
import { ketNoiWebSocketDNSE } from "../dnse/wsClient.js";
import { taiLichSuToanBo, tinhTinHieuToanBo, capNhatNenMoiNhat, chiaNhoMang } from "../loi/quetToanBo.js";
import { xayDungCSV } from "../loi/csvDauRa.js";
import { ghepNenHomNay } from "../loi/nenHomNay.js";
import { tinhTiLeMua } from "../loi/topGia.js";
import { tinhChecklistBatDayToanBo, xayDungCsvBatDay } from "../loi/checklistBatDay.js";
import { tinhLichSuDiemBToanBo, xayDungCsvDiemB } from "../loi/lichSuDiemB.js";
import { tinhChiBaoLocToanBo, xayDungCsvChiBao } from "../loi/chiBaoLoc.js";
import { dangTrongPhienDinhKyMoCua } from "../../lib/khungGioVaoLenh.js";
import { khoiDongDongTien } from "./dongTienRealTime.mjs";

const apiKey = process.env.DNSE_API_KEY;
const apiSecret = process.env.DNSE_API_SECRET;
if (!apiKey || !apiSecret) {
  console.error("Thieu DNSE_API_KEY/DNSE_API_SECRET trong .env.dnse.local. Xem huong dan o chayThuOpenApi.mjs.");
  process.exit(1);
}

// 30s (14/10/2026, doi tu 10s): moi lan upload web doc lai ~0,3 MB tu DB + xoa bo nho dem -> 10s lam het han muc truyen du lieu mang cua Neon (5,55 GB / 14 ngay). 30s giam ~3 lan.
const CHU_KY_TINH_LAI_MS = 30000; // 30s - tranh tinh lai qua day (~389 ma tinh lai TOAN BO moi lan)
// Checklist bat day (VN100) chi phu thuoc du lieu NGAY (HHV252/MA200/RSI...), khong can do tuoi
// nhu tin hieu MUA/BAN chinh - tinh lai/upload rieng theo chu ky THUA hon (15 phut) de tranh ghi DB
// (upload-bat-day) qua day trong khi tin hieu chinh van tinh lai moi 10s nhu binh thuong.
const CHU_KY_BAT_DAY_MS = 15 * 60 * 1000;
// Chi bao ky thuat cho bo loc (RSI, MACD, MA...): tinh ~0,3 giay cho ca 389 ma nhung ghi DB 389 dong, nen gui moi 1 phut NEU co nen moi (khong can moi 10 giay nhu tin hieu).
// Chay bang bo hen RIENG, loi o day khong bao gio duoc anh huong toi luong tin hieu chinh.
const CHU_KY_CHI_BAO_MS = 60 * 1000;
const CHU_KY_RSI_H1_MS = 10 * 60 * 1000; // RSI khung 1 gio cho bo loc (dayRsiH1.mjs, tien trinh con)
const CHU_KY_KICH_BAN_MS = 15 * 60 * 1000; // kich ban mua (trang /kich-ban-mua): ~340 ma x ~60 lan tinh -> chay TIEN TRINH CON rieng de khong chan engine

const ngayIsoTuGiay = (giay) => new Date(giay * 1000).toISOString().slice(0, 10);
function chuyenDoiNenTuWS(doi) {
  return { t: ngayIsoTuGiay(doi.time), o: doi.open, h: doi.high, l: doi.low, c: doi.close, v: doi.volume ?? 0 };
}

async function main() {
  const client = taoOpenApiClient({ apiKey, apiSecret });
  const { dsMa, vniNen, sanTheoMa, nenTheoMa, loiTheoMa } = await taiLichSuToanBo(client, {
    onTienDo: (chuoi) => console.log(chuoi),
  });

  // Khoi dong giua phien / nghi trua: ghep nen hom nay tu nen phut DNSE de tin hieu khong nam o du lieu hom qua (xem loi/nenHomNay.js)
  const gh = await ghepNenHomNay(nenTheoMa, vniNen).catch(() => ({ ghep: 0, loi: -1 }));
  console.log(`Nen hom nay tu nen phut: ghep ${gh.ghep} ma, loi ${gh.loi}.`);

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
  const duongDanCsvChiBao = thuMucOutput + "chi_bao_realtime_moi_nhat.csv";

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

  async function guiDiemBLenWebNeuDuocPhep(csv) {
    if (!uploadDuocPhep) return;
    try {
      const gocWeb = process.env.CS_GOC_WEB || "https://www.cloudstock.id.vn";
      const res = await fetch(`${gocWeb}/api/upload-diem-b`, {
        method: "POST",
        headers: { "Content-Type": "text/csv", "x-api-key": uploadKey },
        body: csv,
        signal: AbortSignal.timeout(120000),
      });
      console.log(`[upload diem-b] HTTP ${res.status}`);
    } catch (loi) {
      console.log(`[upload diem-b] LOI: ${loi.message}`);
    }
  }

  async function guiChiBaoLenWebNeuDuocPhep(csv) {
    if (!uploadDuocPhep) return;
    try {
      const gocWeb = process.env.CS_GOC_WEB || "https://www.cloudstock.id.vn";
      const res = await fetch(`${gocWeb}/api/upload-chi-bao`, {
        method: "POST",
        headers: { "Content-Type": "text/csv", "x-api-key": uploadKey },
        body: csv,
        signal: AbortSignal.timeout(120000),
      });
      console.log(`[upload chi-bao] HTTP ${res.status}`);
    } catch (loi) {
      console.log(`[upload chi-bao] LOI: ${loi.message}`);
    }
  }

  let coThayDoi = true; // tinh lan dau ngay sau khi tai xong lich su, khong doi tick WebSocket
  let chiBaoCu = true; // co nen moi ke tu lan gui chi bao gan nhat
  let dangTinhChiBao = false;

  async function tinhVaGuiChiBao() {
    if (!chiBaoCu || dangTinhChiBao) return;
    chiBaoCu = false;
    dangTinhChiBao = true;
    try {
      const { ds, loi } = tinhChiBaoLocToanBo(nenTheoMa);
      if (loi.length > 0) console.log(`[canh bao] ${loi.length} ma loi khi tinh chi bao ky thuat: ${loi.slice(0, 5).map((l) => l.ma).join(", ")}`);
      const csv = xayDungCsvChiBao(ds);
      writeFileSync(duongDanCsvChiBao, csv, "utf-8");
      console.log(`[${new Date().toLocaleTimeString("vi-VN")}] Chi bao ky thuat (bo loc): ${ds.length} ma.`);
      await guiChiBaoLenWebNeuDuocPhep(csv);
    } catch (loi) {
      chiBaoCu = true; // thu lai o chu ky sau
      console.log(`[chi bao] LOI: ${loi.message}`);
    } finally {
      dangTinhChiBao = false;
    }
  }
  // KICH BAN MUA: chay engine/dich-vu/kichBanMua.mjs --upload o tien trinh con (tu tai nen VNDirect, ~1-2 phut/lan), moi 15 phut. Tien trinh con ke thua CS_UPLOAD_API_KEY.
  let dangChayKichBan = false;
  function chayKichBanMua() {
    if (!uploadDuocPhep || dangChayKichBan) return;
    dangChayKichBan = true;
    const con = spawn(process.execPath, [fileURLToPath(new URL("./kichBanMua.mjs", import.meta.url)), "--upload"], { stdio: ["ignore", "pipe", "pipe"] });
    let cuoi = "";
    const nho = (b) => (cuoi = (cuoi + b.toString()).split(String.fromCharCode(10)).filter(Boolean).slice(-3).join(" | "));
    con.stdout.on("data", nho);
    con.stderr.on("data", nho);
    con.on("error", (loi) => console.log(`[kich ban mua] LOI: ${loi.message}`));
    con.on("close", (ma) => {
      dangChayKichBan = false;
      console.log(`[${new Date().toLocaleTimeString("vi-VN")}] Kich ban mua (tien trinh con) xong, ma thoat ${ma}: ${cuoi.slice(0, 200)}`);
    });
  }

  // RSI KHUNG 1 GIO cho bo loc: engine/dich-vu/dayRsiH1.mjs --upload o tien trinh con (tai nen 1 gio ~390 ma, ~1 phut/lan), moi 10 phut.
  let dangChayRsiH1 = false;
  function chayRsiH1() {
    if (!uploadDuocPhep || dangChayRsiH1) return;
    dangChayRsiH1 = true;
    const con = spawn(process.execPath, [fileURLToPath(new URL("./dayRsiH1.mjs", import.meta.url)), "--upload"], { stdio: ["ignore", "pipe", "pipe"] });
    let cuoi = "";
    const nho = (b) => (cuoi = (cuoi + b.toString()).split(String.fromCharCode(10)).filter(Boolean).slice(-3).join(" | "));
    con.stdout.on("data", nho);
    con.stderr.on("data", nho);
    con.on("error", (loi) => console.log(`[rsi h1] LOI: ${loi.message}`));
    con.on("close", (ma) => {
      dangChayRsiH1 = false;
      console.log(`[${new Date().toLocaleTimeString("vi-VN")}] RSI 1H (tien trinh con) xong, ma thoat ${ma}: ${cuoi.slice(0, 200)}`);
    });
  }

  const topGiaTheoMa = new Map(); // ma -> { mua3, ban3, tiLe } (so lenh moi nhat, xem engine/loi/topGia.js)
  let dangTinh = false;
  let lanCuoiTinhBatDay = 0;

  let daBaoChoMoCua = false;
  async function tinhLaiVaGhi() {
    if (!coThayDoi || dangTinh) return;
    // TIN HIEU CHI TU 9H15: 9:00-9:15 la phien ATO (gia chua on dinh) - khong tinh/upload, giu co coThayDoi de tinh ngay khi het khoang nay (xem lib/khungGioVaoLenh.js).
    if (dangTrongPhienDinhKyMoCua()) {
      if (!daBaoChoMoCua) {
        daBaoChoMoCua = true;
        console.log(`[${new Date().toLocaleTimeString("vi-VN")}] Dang phien khop lenh dinh ky mo cua (09:00-09:15) - tam dung tinh/dang tin hieu, tiep tuc luc 09:15.`);
      }
      return;
    }
    daBaoChoMoCua = false;
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

      // Ti le mua/ban cua so lenh (kenh top_price): ghi nhan cho nghien cuu lenh web giu, khong tham gia tin hieu.
      for (const h of hang) { const t = topGiaTheoMa.get(h.ma); if (t) { h.ti_le_mua = t.tiLe; h.kl_mua3 = t.mua3; h.kl_ban3 = t.ban3; } }
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
        // Lich su DIEM MUA PHUC HOI (diem B) tu dau 2026 cho trang /mua-phuc-hoi - cung chu ky voi checklist (loi o day khong lam hong tin hieu chinh).
        try {
          const dsDiemB = tinhLichSuDiemBToanBo(nenTheoMa, vniNen);
          console.log(`[${new Date().toLocaleTimeString("vi-VN")}] Lich su diem B (tu 2026): ${dsDiemB.length} su kien.`);
          await guiDiemBLenWebNeuDuocPhep(xayDungCsvDiemB(dsDiemB));
        } catch (loiB) {
          console.log(`[lich su diem B] LOI: ${loiB.message}`);
        }
      }
    } finally {
      dangTinh = false;
    }
  }

  // DNSE OpenAPI gioi han so "streams"/ket noi theo tier tai khoan (tier "normalUser" toi da 200 -
  // xac nhan qua loi that SUBSCRIBE_FAILED/MAX_CHANNELS_EXCEEDED khi thu nhet het ~390 ma vao 1 ket
  // noi duy nhat) - chia nho danh sach ma, moi lo mo 1 ket noi WebSocket rieng (tai lieu cho phep
  // toi da 10 ket noi/tai khoan, du du cho vai lo).
  const KICH_THUOC_KENH_TOI_DA = 196; // 196 (truoc 190): 392 ma vao 2 ket noi thay vi 3 -> nhuong cho 5 ket noi dong tien (dongTienRealTime.mjs), tong 9 / 10
  const toanBoMaCanTheoDoi = [...dsMa, "VNINDEX"];
  const nhomMa = chiaNhoMang(toanBoMaCanTheoDoi, KICH_THUOC_KENH_TOI_DA);
  console.log(`\nDang ket noi WebSocket (${nhomMa.length} ket noi, toi da ${KICH_THUOC_KENH_TOI_DA} ma/ket noi do gioi han tier tai khoan)...`);

  const onDataChung = (_loaiDuLieu, doi) => {
    if (!doi.symbol || doi.open == null) return; // khong phai nen OHLC hop le - bo qua an toan
    const mang = doi.symbol === "VNINDEX" ? vniNen : nenTheoMa.get(doi.symbol);
    if (!mang) return; // ma khong nam trong vu tru dang theo doi (khong nen xay ra, phong thu)
    capNhatNenMoiNhat(mang, chuyenDoiNenTuWS(doi));
    coThayDoi = true;
    chiBaoCu = true;
  };

  // SO LENH (top_price.G1.json): moi ma 1 dong moi nhat {mua3, ban3, tiLe}. Dung cac ket noi RIENG (moi ket noi toi da 190 ma) de khong vuot gioi han stream cua kenh ohlc.
  const onDataTopGia = (_loai, doi) => {
    if (!doi?.symbol) return;
    const r = tinhTiLeMua(doi);
    if (r) topGiaTheoMa.set(doi.symbol, r);
  };
  const dsKetNoiTopGia = nhomMa.map((nhom, idx) =>
    ketNoiWebSocketDNSE(
      { apiKey, apiSecret },
      {
        kenh: [{ name: "top_price.G1.json", symbols: nhom.filter((m) => m !== "VNINDEX") }],
        onTrangThai: (chuoi) => console.log(`[ws-sol#${idx + 1}] ${chuoi}`),
        onLoi: (loi) => console.error(`[ws-sol#${idx + 1} loi] ${loi.message}`),
        onData: onDataTopGia,
      }
    )
  );

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

  // DONG TIEN THOI GIAN THUC (tick co chieu, khoi ngoai, do rong chi so -> /api/upload-dong-tien): loi o day khong anh huong tin hieu chinh; tat bang --khong-dong-tien.
  let dongTien = null;
  if (!process.argv.includes("--khong-dong-tien") && !process.argv.includes("--mot-lan")) {
    try {
      dongTien = khoiDongDongTien({ apiKey, apiSecret, dsMa, upload: uploadDuocPhep ? { goc: process.env.CS_GOC_WEB || "https://www.cloudstock.id.vn", key: uploadKey } : null });
    } catch (loiDt) {
      console.log(`[dong-tien] KHONG khoi dong duoc: ${loiDt.message}`);
    }
  }

  await tinhLaiVaGhi(); // tinh ngay lan dau voi du lieu REST vua tai, khong doi tick WebSocket
  const henGio = setInterval(tinhLaiVaGhi, CHU_KY_TINH_LAI_MS);
  await tinhVaGuiChiBao();
  const henGioChiBao = setInterval(tinhVaGuiChiBao, CHU_KY_CHI_BAO_MS);
  chayKichBanMua();
  const henGioKichBan = setInterval(chayKichBanMua, CHU_KY_KICH_BAN_MS);
  chayRsiH1();
  const henGioRsiH1 = setInterval(chayRsiH1, CHU_KY_RSI_H1_MS);

  // --mot-lan (28/10/2026): DAY MOT LAN roi thoat (nut bam 1 cai tren Desktop - DAY_LEN_WEB_ENGINE.bat): tin hieu + checklist bat day + diem B + chi bao + kich ban mua + RSI 1H da duoc tinh/day o tren,
  // doi cac tien trinh con (kich ban mua, RSI 1H) xong roi dong ket noi va thoat (ma 0). Khong chay dong tien thoi gian thuc / khong tu dung 15h30.
  if (process.argv.includes("--mot-lan")) {
    clearInterval(henGio);
    clearInterval(henGioChiBao);
    clearInterval(henGioKichBan);
    clearInterval(henGioRsiH1);
    console.log("[mot lan] Da tinh + day tin hieu, checklist, diem B, chi bao. Doi kich ban mua / RSI 1H (neu dang chay) roi thoat...");
    for (let i = 0; i < 360 && (dangChayKichBan || dangChayRsiH1); i++) await new Promise((r) => setTimeout(r, 1000));
    dsKetNoi.forEach((k) => k.dong());
    dsKetNoiTopGia.forEach((k) => k.dong());
    console.log("[mot lan] XONG.");
    process.exit(0);
  }

  // TU DUNG 15h30 (2026-10-12): engine khoi dong TRUOC 15h30 vao ngay lam viec (T2-T6, gio VN) thi tinh + day lan cuoi luc 15h30 roi tu thoat voi ma 3 -
  // CHAY_REALTIME_UPLOAD.bat thay ma 3 thi KHONG khoi dong lai. Khoi dong sau 15h30 (chay tay buoi toi / cuoi tuan) thi chay den khi dong cua so.
  // Doi gio: tham so --dung-luc=HH:MM (mac dinh 15:30); --khong-tu-dung de tat han.
  const phutVN = (d = new Date()) => {
    const v = new Date(d.getTime() + 7 * 3600e3);
    return { thu: v.getUTCDay(), phut: v.getUTCHours() * 60 + v.getUTCMinutes() };
  };
  const thamSoDung = process.argv.find((x) => x.startsWith("--dung-luc="))?.slice(11) ?? "15:30";
  const [gDung, pDung] = thamSoDung.split(":").map(Number);
  const phutDung = (Number.isFinite(gDung) ? gDung : 15) * 60 + (Number.isFinite(pDung) ? pDung : 30);
  const luc0 = phutVN();
  const tuDungHomNay = !process.argv.includes("--khong-tu-dung") && luc0.thu >= 1 && luc0.thu <= 5 && luc0.phut < phutDung;
  let henGioDung = null;
  if (tuDungHomNay) {
    console.log(`[tu dung] Engine se tinh + day lan cuoi roi TU DUNG luc ${thamSoDung} (gio VN).`);
    henGioDung = setInterval(async () => {
      if (phutVN().phut < phutDung) return;
      clearInterval(henGioDung);
      console.log(`[${new Date().toLocaleTimeString("vi-VN")}] [tu dung] Den ${thamSoDung}: tinh + day lan cuoi roi thoat.`);
      try {
        coThayDoi = true;
        chiBaoCu = true;
        await tinhLaiVaGhi();
        await tinhVaGuiChiBao();
      } catch (loi) {
        console.log(`[tu dung] LOI lan cuoi: ${loi.message}`);
      }
      // Kich ban mua theo trang thai CUOI NGAY (tien trinh con ~1-2 phut): doi xong roi moi thoat de tien trinh con khong bi dut giua chung.
      chayKichBanMua();
      for (let i = 0; i < 240 && dangChayKichBan; i++) await new Promise((r) => setTimeout(r, 1000));
      clearInterval(henGio);
      clearInterval(henGioChiBao);
      clearInterval(henGioKichBan);
      clearInterval(henGioRsiH1);
      try {
        await dongTien?.chotCuoiNgay();
      } catch {}
      dongTien?.dong();
      dsKetNoi.forEach((k) => k.dong());
      dsKetNoiTopGia.forEach((k) => k.dong());
      process.exit(3);
    }, 20_000);
  }

  process.on("SIGINT", () => {
    console.log("\nDang dung dich vu...");
    clearInterval(henGio);
    clearInterval(henGioChiBao);
    clearInterval(henGioKichBan);
    clearInterval(henGioRsiH1);
    dongTien?.dong();
    dsKetNoi.forEach((k) => k.dong());
      dsKetNoiTopGia.forEach((k) => k.dong());
    process.exit(0);
  });
}

main().catch((loi) => {
  console.error("LOI DICH VU REAL-TIME:", loi);
  process.exit(1);
});
