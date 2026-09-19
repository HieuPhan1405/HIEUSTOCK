// Cap nhat so co phieu luu hanh (VNDirect finfo, muc 51004) cho TOAN BO ma dang
// hien tren web -> ghi ra lib/soCoPhieuLuuHanh.js. Web dung so nay x gia hien
// tai de tinh von hoa (ty dong) cho bo loc "Von hoa >= 3.000 ty".
//
// Chay:  node scripts/capNhatSoCoPhieu.mjs
// (chay lai bat cu luc nao - vd sau khi co ma moi len san hoac cong ty phat hanh
// them co phieu). Nguon danh sach ma: https://cloudstock.id.vn/api/signals
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const THU_MUC = dirname(fileURLToPath(import.meta.url));
const DICH = join(THU_MUC, "..", "lib", "soCoPhieuLuuHanh.js");
const KICH_CO_LO = 40;

async function layJson(url) {
  const kq = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(30000) });
  if (!kq.ok) throw new Error(`${url} -> HTTP ${kq.status}`);
  return kq.json();
}

const dsTinHieu = await layJson("https://cloudstock.id.vn/api/signals");
const dsMa = (Array.isArray(dsTinHieu) ? dsTinHieu : dsTinHieu.data || Object.values(dsTinHieu).find(Array.isArray))
  .map((r) => r.ma)
  .filter((m) => m && m !== "VNINDEX");

const soCP = {};
for (let i = 0; i < dsMa.length; i += KICH_CO_LO) {
  const lo = dsMa.slice(i, i + KICH_CO_LO);
  const url =
    "https://api-finfo.vndirect.com.vn/v4/ratios/latest?order=reportDate&where=itemCode:51004" +
    `&filter=code:${lo.join(",")}&size=${lo.length * 2}`;
  const { data } = await layJson(url);
  for (const d of data) {
    if (d.itemCode === "51004" && d.value > 0) soCP[d.code] = Math.round(d.value);
  }
  process.stdout.write(`\r${Math.min(i + KICH_CO_LO, dsMa.length)}/${dsMa.length}`);
}
process.stdout.write("\n");

const thieu = dsMa.filter((m) => !soCP[m]);
const dong = Object.keys(soCP)
  .sort()
  .map((m) => `  ${m}: ${soCP[m]},`)
  .join("\n");
const homNay = new Date().toISOString().slice(0, 10);
writeFileSync(
  DICH,
  `// TU DONG SINH boi scripts/capNhatSoCoPhieu.mjs - KHONG sua tay.
// Nguon: VNDirect finfo (ratios/latest, itemCode 51004 = so co phieu luu hanh).
// Von hoa (ty dong) = gia (nghin dong) x so co phieu / 1.000.000.
export const NGAY_CAP_NHAT_SO_CP = "${homNay}";
export const SO_CP_LUU_HANH = {
${dong}
};
`
);
console.log(`Da ghi ${Object.keys(soCP).length}/${dsMa.length} ma -> ${DICH}`);
if (thieu.length) console.log(`Chua co du lieu (${thieu.length}): ${thieu.join(", ")}`);
