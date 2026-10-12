// RA SOAT + CHIA LAI NGANH (2026-10-12): dung phan loai ICB (VNDirect industry_classification) + ghi de thu cong cho cac truong hop ICB khong hop thuc te thi truong VN.
// Chay: node engine/dich-vu/chiaLaiNganh.mjs <icb.json> [--ghi]  (khong --ghi: chi in de xuat; --ghi: sinh lai engine/danh-sach/nganh.js)
import fs from "node:fs";
import { NGANH } from "../danh-sach/nganh.js";
const [icbFile, co] = process.argv.slice(2);
const icb = JSON.parse(fs.readFileSync(icbFile, "utf-8")).data;
const cache = JSON.parse(fs.readFileSync(new URL("../output/nen_dai.json", import.meta.url), "utf-8"));
const maICB = new Map();
for (const d of icb) for (const m of (d.codeList || "").split(",")) { if (!m) continue; const o = maICB.get(m) || {}; o["l" + d.industryLevel] = d.vietnameseName.trim(); maICB.set(m, o); }

// ---------- 1) Quy tac theo ICB cap 4 (roi cap 3/2) ----------
const THEO_L4 = {
  "Xây dựng công trình": "Xay dung - Ha tang", "Vật liệu xây dựng": "Vat lieu xay dung", "Xây dựng, chế tạo nhà ở": "Xay dung - Ha tang",
  "Đầu tư và phát triển bất động sản": "Bat dong san", "Dịch vụ bất động sản": "Bat dong san", "Quỹ tín thác bất động sản đa dạng": "Bat dong san",
  "Thép": "Thep", "Khai khoáng nói chung": "Khoang san", "Than đá": "Khoang san", "Kim loại màu": "Khoang san", "Nhôm": "Khoang san", "Bạch kim & Kim loại quý hiếm khác": "Khoang san",
  "Gas": "Dau khi", "Dầu khí tổng hợp": "Dau khi", "Dịch vụ và Thiết bị dầu khí": "Dau khi", "Khai thác và sản xuất dầu khí": "Dau khi",
  "Điện": "Dien - Nuoc", "Nước": "Dien - Nuoc", "Dịch vụ tiện ích tổng hợp": "Dien - Nuoc",
  "Hóa chất cơ bản": "Hoa chat - Cao su", "Hóa chất đặc biệt": "Hoa chat - Cao su", "Săm lốp": "Hoa chat - Cao su", "Bao bì & đóng gói": "Hoa chat - Cao su", "Giấy": "Hoa chat - Cao su",
  "Sản xuất thực phẩm": "Thuc pham - Do uong", "Nước ngọt": "Thuc pham - Do uong", "Sản xuất bia": "Thuc pham - Do uong", "Rượu, đồ uống có cồn": "Thuc pham - Do uong", "Thuốc lá": "Thuc pham - Do uong",
  "Nông sản và thủy hải sản": "Nong nghiep - Chan nuoi",
  "Cửa hàng chuyên dụng": "Ban le - O to", "Bán lẻ tổng hợp": "Ban le - O to", "Ôtô": "Ban le - O to", "Phụ tùng ô tô": "Ban le - O to", "Bán lẻ dụng cụ gia đình": "Ban le - O to",
  "Đồ may mặc, trang sức, phụ kiện": "Det may - Go", "Giầy dép": "Det may - Go", "Đồ đạc, nội thất": "Det may - Go", "Chế phẩm từ gỗ": "Det may - Go", "Vật dụng cá nhân": "Det may - Go",
  "Dịch vụ vận tải": "Logistics - Van tai", "Vận tải biển": "Logistics - Van tai", "Hàng không": "Logistics - Van tai", "Dịch vụ giao nhận": "Logistics - Van tai", "Đường sắt": "Logistics - Van tai", "Vận tải xe tải": "Logistics - Van tai",
  "Thiết bị điện": "Thiet bi dien - Co khi", "Máy công nghiệp": "Thiet bi dien - Co khi", "Các sản phẩm gia dụng lâu bền": "Thiet bi dien - Co khi", "Xe tải và phương tiện vận chuyển thương mại": "Thiet bi dien - Co khi", "Điện tái tạo": "Dien - Nuoc", "Bán lẻ dược phẩm": "Y te - Duoc",
  "Khách sạn": "Du lich - Giai tri - Truyen thong", "Dịch vụ vui chơi giải trí": "Du lich - Giai tri - Truyen thong", "Sòng bạc": "Du lich - Giai tri - Truyen thong", "Các hãng truyền thông": "Du lich - Giai tri - Truyen thong", "Hoạt động xuất bản": "Du lich - Giai tri - Truyen thong",
};
const THEO_L2 = { "Ngân hàng": "Ngan hang", "Bảo hiểm": "Bao hiem", "Dịch vụ tài chính": "Chung khoan", "Y tế": "Y te - Duoc", "Công nghệ": "Cong nghe - Vien thong", "Viễn thông": "Cong nghe - Vien thong", "Dầu khí": "Dau khi", "Du lịch & Giải trí": "Du lich - Giai tri - Truyen thong", "Phương tiện truyền thông": "Du lich - Giai tri - Truyen thong" };

// ---------- 2) Ghi de thu cong (ICB khong hop thuc te VN) ----------
const GHI_DE = {
  // Thuy san tach rieng khoi nong nghiep (dong luc khac: xuat khau/thue quan My)
  ...Object.fromEntries("ANV,VHC,IDI,ACL,FMC,CMX,ABT,AAM,MPC,TS4,HVG,NGC,ATA,AGF,BLF,CAT,FBT,SEA".split(",").map((m) => [m, "Thuy san"])),
  // Khu cong nghiep tach khoi BDS nha o
  ...Object.fromEntries("KBC,IDC,SZC,BCM,SIP,NTC,LHG,SNZ,D2D,TIP,ITA,SZL,IJC,VGC,PHR_KCN".split(",").map((m) => [m, "BDS Khu cong nghiep"])),
  // Cao su
  ...Object.fromEntries("GVR,PHR,DPR,TRC,BRC,DRC,CSM,HRC,SRC,TNC,VHG".split(",").map((m) => [m, "Hoa chat - Cao su"])),
  HAG: "Nong nghiep - Chan nuoi", BAF: "Nong nghiep - Chan nuoi", LAF: "Nong nghiep - Chan nuoi", GSP: "Logistics - Van tai", ACV: "Logistics - Van tai", SAS: "Logistics - Van tai", HHV: "Xay dung - Ha tang", VCG: "Xay dung - Ha tang", CIG: "Xay dung - Ha tang", TV1: "Xay dung - Ha tang", TV2: "Xay dung - Ha tang",
  PC1: "Dien - Nuoc", REE: "Dien - Nuoc", PLC: "Dau khi", SFC: "Dau khi", PIT: "Dau khi", GDA: "Thep", PLP: "Hoa chat - Cao su", ABS: "Nong nghiep - Chan nuoi", LTG: "Nong nghiep - Chan nuoi",
  HLD: "Bat dong san", NHA: "Bat dong san", EVG: "Bat dong san", PTL: "Bat dong san", TDC: "Bat dong san", THG: "Bat dong san", LIX: "Hoa chat - Cao su", NET: "Hoa chat - Cao su",
  TLG: "Ban le - O to", PSD: "Ban le - O to", ST8: "Ban le - O to", ADP: "Vat lieu xay dung", PTB: "Vat lieu xay dung", HAP: "Hoa chat - Cao su", MCP: "Hoa chat - Cao su", AAA: "Hoa chat - Cao su", DHC: "Hoa chat - Cao su", HHP: "Hoa chat - Cao su",
  AST: "Du lich - Giai tri - Truyen thong", OGC: "Bat dong san", EVF: "Chung khoan", TVC: "Chung khoan", SAM: "Cong nghe - Vien thong", SGT: "Cong nghe - Vien thong", VTB: "Cong nghe - Vien thong", ICT: "Cong nghe - Vien thong", PSD2: "Ban le - O to",
  MSR: "Khoang san", TNI: "Khoang san", FCM: "Khoang san", KSB: "Khoang san", RYG: "Vat lieu xay dung", SBG: "Xay dung - Ha tang", UIC: "Xay dung - Ha tang", TEG: "Dien - Nuoc", FIT: "Bat dong san", DTA: "Xay dung - Ha tang", HVH: "Cong nghe - Vien thong", VNA: "Logistics - Van tai", TN1: "Bat dong san",
};
const HT = new Map(); for (const [t, ds] of NGANH) for (const m of ds) if (!HT.has(m)) HT.set(m, t);
const nhom = (m) => GHI_DE[m] || (() => { const o = maICB.get(m) || {}; return THEO_L4[o.l4] || THEO_L2[o.l2] || null; })();

const tatCa = new Set([...HT.keys(), ...Object.keys(cache)]);
const moi = new Map(); const chuaXep = [];
for (const m of tatCa) { const g = nhom(m); if (g) moi.set(m, g); else chuaXep.push(m); }
const dem = {}; for (const [m, g] of moi) { (dem[g] ||= { co: [], khong: [] })[cache[m] ? "co" : "khong"].push(m); }
console.log("=== NHOM MOI (ma co du lieu / ma khong co du lieu) ===");
for (const [g, v] of Object.entries(dem).sort((a, b) => b[1].co.length - a[1].co.length)) console.log(`${g.padEnd(24)} ${String(v.co.length).padStart(3)} / ${String(v.khong.length).padStart(3)}`);
console.log("\nKHONG XEP DUOC:", chuaXep.map((m) => `${m}(${maICB.get(m)?.l4 || "?"})${cache[m] ? "*" : ""}`).join(" "));
const doi = []; for (const [m, g] of moi) { if (!cache[m]) continue; const c = HT.get(m) || "(chua co)"; const tuongDuong = { "Ngan hang": "Ngan hang", "Thuc pham - Nong san": ["Thuc pham - Do uong", "Nong nghiep - Chan nuoi", "Thuy san"], "Bat bong san": "Bat dong san" }; if (c !== g) doi.push([m, c, g]); }
console.log("\nSO MA DOI NHOM:", doi.length, "/", Object.keys(cache).length);
const theoCap = {}; for (const [m, c, g] of doi) (theoCap[c + " -> " + g] ||= []).push(m);
for (const [k, l] of Object.entries(theoCap).sort((a, b) => b[1].length - a[1].length)) console.log(`  ${String(l.length).padStart(3)}  ${k}: ${l.join(",")}`);
if (co === "--ghi") {
  const thuTu = ["Ngan hang", "Chung khoan", "Bao hiem", "Bat dong san", "BDS Khu cong nghiep", "Xay dung - Ha tang", "Vat lieu xay dung", "Thep", "Khoang san", "Dau khi", "Dien - Nuoc", "Hoa chat - Cao su", "Thuc pham - Do uong", "Thuy san", "Nong nghiep - Chan nuoi", "Ban le - O to", "Det may - Go", "Logistics - Van tai", "Cong nghe - Vien thong", "Y te - Duoc", "Thiet bi dien - Co khi", "Du lich - Giai tri - Truyen thong"];
  const dong = thuTu.map((g) => '  "' + g + '": "' + [...moi].filter(([m, x]) => x === g && cache[m]).map(([m]) => m).sort().join(",") + '",');
  const nd = fs.readFileSync(new URL("../danh-sach/nganh.js", import.meta.url), "utf-8");
  const dau = `// PHAN LOAI NGANH (rà soát lại 2026-10-12): dựa trên ICB (VNDirect industry_classification, cấp 4) + ghi đè thủ công cho các mã mà ICB không hợp thực tế thị trường VN
// (thuỷ sản tách khỏi nông nghiệp, khu công nghiệp tách khỏi BĐS nhà ở, cao su gom cùng hoá chất, dầu khí tách khỏi điện-nước...). Sinh bằng engine/dich-vu/chiaLaiNganh.mjs.
// CHỈ liệt kê mã CÓ dữ liệu giá trong engine (389 mã): mẫu số breadth là số mã thật, không bị kéo xuống bởi mã đã hết niêm yết.
// Mã mới chưa có trong danh sách => nhóm "Khac" (breadth = trung bình các ngành). Thêm mã mới: chạy lại chiaLaiNganh.mjs hoặc thêm tay vào nhóm phù hợp.
// LƯU Ý: nganh chỉ ảnh hưởng nhãn ngành + diem_rank (breadth ngành); KHÔNG ảnh hưởng tín hiệu MUA/BÁN. Không còn khớp danh sách ngành trong AFL (AFL giữ nguyên danh sách cũ).
// TÊN NGÀNH (khoá của map) là chuỗi KHÔNG DẤU; web đổi sang có dấu ở lib/nganh.js (NGANH_NHAN).
const raw = {
`;
  const cuoi = nd.slice(nd.indexOf("// Mang co thu tu"));
  fs.writeFileSync(new URL("../danh-sach/nganh.js", import.meta.url), dau + dong.join("\n") + "\n};\n\n" + cuoi);
  console.log("da ghi engine/danh-sach/nganh.js");
}
process.exit(0);
