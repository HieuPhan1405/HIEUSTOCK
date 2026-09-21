// Cap nhat TEN DAY DU cong ty cho tat ca ma niem yet (VNDirect finfo /stocks) -> ghi ra lib/tenCongTy.js.
// Web dung de: hien ten cong ty canh ma (Bo loc, So lenh, Chi tiet ma...) va thanh tim kiem ma o dau trang.
//
// Chay:  node scripts/capNhatTenCongTy.mjs   (chay lai khi co ma moi len san / doi ten cong ty)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const THU_MUC = dirname(fileURLToPath(import.meta.url));
const DICH = join(THU_MUC, "..", "lib", "tenCongTy.js");

const url =
  "https://api-finfo.vndirect.com.vn/v4/stocks?q=type:STOCK~status:LISTED&fields=code,companyName,shortName,floor&size=3000";
const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(60000) });
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const j = await res.json();
if (!Array.isArray(j.data) || j.data.length < 500) throw new Error("Danh sach ma bat thuong: " + j.data?.length);

const gon = (s) => String(s || "").replace(/\s+/g, " ").trim();
const dong = j.data
  .filter((x) => /^[A-Z0-9]{3,4}$/.test(x.code) && x.companyName)
  .sort((a, b) => a.code.localeCompare(b.code))
  .map((x) => `  ${JSON.stringify(x.code)}: [${JSON.stringify(gon(x.companyName))}, ${JSON.stringify(gon(x.shortName))}, ${JSON.stringify(x.floor || "")}],`);

// Chi so thi truong (khong co trong danh sach co phieu) - de tim kiem duoc.
const CHI_SO = {
  VNINDEX: ["Chỉ số VN-Index (HOSE)", "VN-Index", "HOSE"],
  VN30: ["Chỉ số VN30 (30 cổ phiếu vốn hóa lớn, thanh khoản cao nhất HOSE)", "VN30", "HOSE"],
  HNXINDEX: ["Chỉ số HNX-Index (sàn Hà Nội)", "HNX-Index", "HNX"],
  UPCOMINDEX: ["Chỉ số UPCoM-Index", "UPCoM-Index", "UPCOM"],
};
const dongChiSo = Object.entries(CHI_SO).map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`);

const noi = `// TU DONG SINH boi scripts/capNhatTenCongTy.mjs - KHONG sua tay.
// Nguon: VNDirect finfo /stocks. Moi ma: [ten day du, ten ngan, san].
export const NGAY_CAP_NHAT_TEN = ${JSON.stringify(new Date().toISOString().slice(0, 10))};
export const TEN_CONG_TY = {
${dongChiSo.join("\n")}
${dong.join("\n")}
};
`;
writeFileSync(DICH, noi, "utf8");
console.log(`Da ghi ${dong.length} ma + ${dongChiSo.length} chi so -> ${DICH}`);
