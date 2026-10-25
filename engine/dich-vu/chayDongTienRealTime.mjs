// CHAY RIENG dich vu dong tien thoi gian thuc (khi KHONG chay chayEngineRealTime.mjs - neu chay chung thi dich vu da duoc khoi dong ben trong engine, dung chay them: se vuot so ket noi cua tai khoan).
// CACH CHAY:
//   node --env-file=.env.dnse.local engine/dich-vu/chayDongTienRealTime.mjs            # chi in ra man hinh (khong upload)
//   node --env-file=.env.dnse.local engine/dich-vu/chayDongTienRealTime.mjs --upload   # day len web (can CS_UPLOAD_API_KEY + CS_XAC_NHAN_UPLOAD=DONG_Y)
//   them --thu=N de chay N giay roi thoat (kiem tra ket noi / ten kenh; ngoai gio giao dich se khong co khop)
import { khoiDongDongTien } from "./dongTienRealTime.mjs";

const apiKey = process.env.DNSE_API_KEY, apiSecret = process.env.DNSE_API_SECRET;
if (!apiKey || !apiSecret) { console.error("Thieu DNSE_API_KEY / DNSE_API_SECRET trong .env.dnse.local"); process.exit(1); }
const goc = process.env.CS_GOC_WEB || "https://www.cloudstock.id.vn";
const upload = process.argv.includes("--upload") && process.env.CS_UPLOAD_API_KEY && process.env.CS_XAC_NHAN_UPLOAD === "DONG_Y" ? { goc, key: process.env.CS_UPLOAD_API_KEY } : null;
if (process.argv.includes("--upload") && !upload) console.log("Khong du dieu kien upload (thieu CS_UPLOAD_API_KEY / CS_XAC_NHAN_UPLOAD=DONG_Y) - chi chay in man hinh.");

// danh sach ma: tu danh sach cong khai cua web (cung vu tru ma engine quet)
const res = await fetch(`${goc}/api/signals`, { signal: AbortSignal.timeout(30000) });
const j = await res.json();
const ds = (Array.isArray(j) ? j : j.tinHieu ?? j.data ?? []).map((x) => x.ma).filter(Boolean);
if (ds.length < 100) { console.error(`Chi lay duoc ${ds.length} ma tu ${goc}/api/signals - dung.`); process.exit(1); }
console.log(`${ds.length} ma; upload: ${upload ? "BAT" : "tat"}`);

const dv = khoiDongDongTien({ apiKey, apiSecret, dsMa: ds, upload, chiTrongGio: !process.argv.some((x) => x.startsWith("--thu=")) });
const thu = Number(process.argv.find((x) => x.startsWith("--thu="))?.slice(6)) || 0;
const dung = async () => {
  await dv.chotCuoiNgay();
  console.log("ban tin nhan duoc:", JSON.stringify(dv.demLoai), "| ngay:", dv.bo.ngay, "| ma:", dv.bo.ma.size, "| chieu la:", dv.bo.demChieuLa);
  dv.dong();
  process.exit(0);
};
if (thu) setTimeout(dung, thu * 1000);
process.on("SIGINT", dung);
