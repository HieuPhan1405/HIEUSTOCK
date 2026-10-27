// CAP NHAT HANG NGAY RRG + PHAN TICH CO BAN len web (lich Windows "CloudStock-PhanTich-18h", T2-T6 18:00 - xem CAP_NHAT_PHAN_TICH_HANG_NGAY.bat).
// Cac buoc chay lan luot, buoc nao loi thi DUNG (khong day du lieu thieu len web), ghi nhat ky engine/output/log_phan_tich_hang_ngay.txt:
//   nen 700 phien -> VN-Index -> co phieu luu hanh -> bao cao tai chinh (quy moi tu dong them) -> phan tich co ban -> RRG -> tao du lieu web -> day len web
// Chay tay: node engine/dich-vu/capNhatPhanTichHangNgay.mjs [--bo-qua-bctc]  (--bo-qua-bctc: chi cap nhat gia/RRG, ~2 phut)
import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const LOG = fileURLToPath(new URL("../output/log_phan_tich_hang_ngay.txt", import.meta.url));
const thuMuc = (f) => fileURLToPath(new URL(f, import.meta.url));
const boQuaBctc = process.argv.includes("--bo-qua-bctc");
const BUOC = [
  ["Nen 700 phien", "taiNenGanDay.mjs"],
  ["VN-Index", "taiVniDai.mjs"],
  ["Nganh map", "taoNganhMap.mjs"],
  ...(boQuaBctc ? [] : [["So co phieu luu hanh", "taiFreeFloat.mjs"], ["Bao cao tai chinh", "taiBaoCaoTaiChinh.mjs"]]),
  ["Phan tich co ban", "phanTichCoBan.mjs"],
  ["RRG nganh", "tinhRRG.mjs", "--json"],
  ["Tao du lieu web", "taoDuLieuPhanTichWeb.mjs"],
  ["Day len web", "dayPhanTichCoBan.mjs"],
];
const ghi = (s) => {
  const dong = `${new Date().toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })}  ${s}`;
  console.log(dong);
  try { appendFileSync(LOG, dong + "\n"); } catch {}
};
ghi("===== Bat dau cap nhat phan tich hang ngay =====");
for (const [ten, tep, ...doi] of BUOC) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [thuMuc(tep), ...doi], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 25 * 60 * 1000 });
  const tomTat = `${(r.stdout || "").trim().split("\n").filter((x) => !/Warning|Reparsing|eliminate|trace-warnings/i.test(x)).slice(-1)[0] ?? ""}`;
  if (r.status !== 0) {
    ghi(`LOI o buoc "${ten}" (ma ${r.status}): ${(r.stderr || r.stdout || "").trim().split("\n").slice(-3).join(" | ").slice(0, 400)}`);
    ghi("DUNG - khong day du lieu len web");
    process.exit(1);
  }
  ghi(`OK  ${ten} (${Math.round((Date.now() - t0) / 1000)}s) ${tomTat.slice(0, 160)}`);
}
ghi("Xong.");
