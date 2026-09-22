// Kiem tra so luong ma dung khop comment trong AFL goc (VN30=30, VNMidCap=71, VNSmallCap=209)
// - phat hien ngay neu copy thieu/du dau phay khi dong bo lai voi AFL sau nay.
import { VN30, VN_MIDCAP, VN_SMALLCAP, phanLoaiVonHoa, thuocVuTruQuet } from "../danh-sach/vonHoa.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

// So thuc te (khong dung so "71"/"209" trong comment AFL - da xac nhan comment do LOI THOI,
// khong duoc cap nhat sau cac lan bo sung ma sau nay; da doi chieu tung ma voi file AFL hien
// tai bang script rieng, khop tuyet doi 0 thieu/0 thua truoc khi chot con so nay vao test).
ok("VN30 co 30 ma", VN30.size === 30, VN30.size);
ok("VNMidCap co 89 ma (da doi chieu tung ma voi AFL hien tai, khop tuyet doi)", VN_MIDCAP.size === 89, VN_MIDCAP.size);
ok("VNSmallCap co 270 ma (da doi chieu tung ma voi AFL hien tai, khop tuyet doi)", VN_SMALLCAP.size === 270, VN_SMALLCAP.size);
ok("khong co ma nao trung giua VN30 va Midcap", ![...VN30].some((m) => VN_MIDCAP.has(m)));
ok("khong co ma nao trung giua VN30 va Smallcap", ![...VN30].some((m) => VN_SMALLCAP.has(m)));
ok("khong co ma nao trung giua Midcap va Smallcap", ![...VN_MIDCAP].some((m) => VN_SMALLCAP.has(m)));
ok("VJC thuoc VN30", phanLoaiVonHoa("VJC") === "VN30");
ok("DXG thuoc Midcap", phanLoaiVonHoa("DXG") === "Midcap");
ok("AAA thuoc Smallcap", phanLoaiVonHoa("AAA") === "Smallcap");
ok("ma la (khong ton tai) -> null, khong thuoc vu tru quet", phanLoaiVonHoa("ZZZZ") === null && !thuocVuTruQuet("ZZZZ"));

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
