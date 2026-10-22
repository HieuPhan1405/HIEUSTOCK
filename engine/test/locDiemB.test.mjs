// Test tay cho lib/locDiemB.js (loc lich su diem B). Chay: node engine/test/locDiemB.test.mjs
import { ganDacTrungNganh, nganhGop, locDiemB, thongKeDiemB, ketQuaDiemB, laiHienTai, ngayBatDauKhoang, danhSachNganh, laKhuyenNghi, LOC_MAC_DINH, LOC_KHUYEN_NGHI } from "../../lib/locDiemB.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

const ds = [
  { ma: "AAA", ngay: "2026-10-21", giam: 22, kl_day: 2.5, vni_yeu: true, co_mua_thuong_truoc: false, gia_vao: 10, gia_hien_tai: 10.2, sl: 9.4, pct_sau_10: null, pct_sau_20: null, nganh: "Chứng khoán" },
  { ma: "BBB", ngay: "2026-10-20", giam: 16, kl_day: 1.2, vni_yeu: true, co_mua_thuong_truoc: true, gia_vao: 20, gia_hien_tai: 22, sl: 18.6, pct_sau_10: null, pct_sau_20: null, nganh: "Bất động sản" },
  { ma: "CCC", ngay: "2026-10-15", giam: 25, kl_day: 3, vni_yeu: false, co_mua_thuong_truoc: false, gia_vao: 15, gia_hien_tai: 14, sl: 14.4, pct_sau_10: 4, pct_sau_20: null, nganh: "Thép" },
  { ma: "DDD", ngay: "2026-09-01", giam: 30.5, kl_day: 1.9, vni_yeu: false, co_mua_thuong_truoc: false, gia_vao: 8, gia_hien_tai: 7.9, sl: 7.5, pct_sau_10: -3, pct_sau_20: -6, nganh: "Chứng khoán" },
  { ma: "EEE", ngay: "2026-03-10", giam: 21, kl_day: null, vni_yeu: null, co_mua_thuong_truoc: false, gia_vao: 5, gia_hien_tai: 5.1, sl: 4.7, pct_sau_10: 7, pct_sau_20: 9, nganh: "Thép" },
];
const ma = (a) => a.map((x) => x.ma).join(",");
ok("mac dinh: tat ca (tu dau nam)", ma(locDiemB(ds)) === "AAA,BBB,CCC,DDD,EEE");
ok("khoang 'phien moi nhat': chi ngay moi nhat", ma(locDiemB(ds, { khoang: "hom_nay" })) === "AAA");
ok("khoang 3 phien: 3 ngay gan nhat co du lieu (21/10, 20/10, 15/10)", ma(locDiemB(ds, { khoang: "3" })) === "AAA,BBB,CCC");
ok("giam 20-30%: AAA, CCC, EEE (DDD 30,5% va BBB 16% bi loai)", ma(locDiemB(ds, { dai: "20_30" })) === "AAA,CCC,EEE");
ok("giam tu 20%: gom ca DDD", ma(locDiemB(ds, { dai: "tu_20" })) === "AAA,CCC,DDD,EEE");
ok("giam 15-20%: chi BBB", ma(locDiemB(ds, { dai: "15_20" })) === "BBB");
ok("KL day >= 2x: AAA, CCC", ma(locDiemB(ds, { klDay: true })) === "AAA,CCC");
ok("thi truong yeu: AAA, BBB", ma(locDiemB(ds, { vniYeu: true })) === "AAA,BBB");
ok("chua co lenh MUA thuong truoc: loai BBB", ma(locDiemB(ds, { chuaMuaThuong: true })) === "AAA,CCC,DDD,EEE");
ok("con gan gia B: AAA (ngay trong 5%), EEE; BBB +10% va CCC thung SL bi loai", ma(locDiemB(ds, { ganGiaB: true })) === "AAA,DDD,EEE", ma(locDiemB(ds, { ganGiaB: true })));
ok("nganh: khong phan biet dau / hoa thuong", ma(locDiemB(ds, { nganh: "chung khoan" })) === "AAA,DDD");
ok("tim ma", ma(locDiemB(ds, { tuKhoa: " cc " })) === "CCC");
ok("chi dang lai (gia hien tai > gia vao): AAA, BBB, EEE", ma(locDiemB(ds, { chiThanhCong: true })) === "AAA,BBB,EEE", ma(locDiemB(ds, { chiThanhCong: true })));
ok("ket qua theo lai hien tai: AAA dang lai, CCC va DDD dang lo, khong co gia -> cho", ketQuaDiemB(ds[0]).loai === "tot" && ketQuaDiemB(ds[2]).loai === "xau" && ketQuaDiemB(ds[3]).loai === "xau" && ketQuaDiemB({ gia_vao: 10 }).loai === "cho");
ok("laiHienTai: AAA +2%, thieu gia vao lay gia B, thieu gia hien tai -> null", Math.abs(laiHienTai(ds[0]) - 2) < 1e-9 && Math.abs(laiHienTai({ gia_b: 10, gia_hien_tai: 11 }) - 10) < 1e-9 && laiHienTai({ gia_vao: 10 }) === null && laiHienTai(null) === null);
const tk = thongKeDiemB(ds);
const laiMau = [2, 10, (14 / 15 - 1) * 100, (7.9 / 8 - 1) * 100, 2].sort((x, y) => x - y);
ok("thong ke lai hien tai: n=5, TB, trung vi, ty le dang lai 3/5", tk.n === 5 && tk.nGia === 5 && Math.abs(tk.tbLai - laiMau.reduce((s, x) => s + x, 0) / 5) < 1e-9 && Math.abs(tk.trungVi - laiMau[2]) < 1e-9 && Math.abs(tk.tyLeLai - 60) < 1e-9, JSON.stringify(tk));
ok("thong ke rong -> null", thongKeDiemB([]).tbLai === null && thongKeDiemB([]).tyLeLai === null && thongKeDiemB([]).n === 0);
ok("ngayBatDauKhoang: Infinity -> null; 1 -> ngay moi nhat", ngayBatDauKhoang(ds, Infinity) === null && ngayBatDauKhoang(ds, 1) === "2026-10-21");
ok("danh sach nganh khong trung, sap xep", danhSachNganh(ds).join("|") === ["Bất động sản", "Chứng khoán", "Thép"].join("|"), danhSachNganh(ds).join("|"));
ok("bo loc khuyen nghi: giam >= 20 + KL >= 2x + thi truong yeu -> chi AAA", ma(locDiemB(ds, LOC_KHUYEN_NGHI)) === "AAA", ma(locDiemB(ds, LOC_KHUYEN_NGHI)));
ok("laKhuyenNghi khop bo loc: CCC (VNI khong yeu) khong, AAA co, null an toan", laKhuyenNghi(ds[0]) === true && laKhuyenNghi(ds[2]) === false && laKhuyenNghi(null) === false && laKhuyenNghi({}) === false);
{
  // nganh cung hoi: cua so 7 NGAY LICH (~5 phien), khong dem theo so ngay co du lieu. BDS KCN gop vao BDS.
  const mk = (ma, ngay, giam, nganh) => ({ ma, ngay, giam, nganh, kl_day: 1 });
  const d = [
    mk("B1", "2026-10-12", 18, "Bất động sản"), mk("B2", "2026-10-15", 22, "Bất động sản"), mk("B3", "2026-10-19", 12, "BĐS khu công nghiệp"), mk("B4", "2026-10-20", 30, "Bất động sản"),
    mk("T1", "2026-10-20", 25, "Thép"), mk("B5", "2026-10-05", 40, "Bất động sản"),
  ];
  const g = ganDacTrungNganh(d); const m = Object.fromEntries(g.map((r) => [r.ma, r]));
  ok("nganhGop: BDS khu cong nghiep -> bat dong san", nganhGop("BĐS khu công nghiệp") === "bat dong san" && nganhGop("Bất động sản") === "bat dong san");
  ok("B4 (20/10): cua so 13/10..20/10 co B2 (15/10), B3 (19/10 BDS KCN); B1 (12/10) ngoai cua so; B5 (5/10) ngoai -> 2 ma khac", m.B4.ng_so_ma === 2, String(m.B4.ng_so_ma));
  ok("B2 (15/10): cua so 8/10..15/10 co B1 (12/10) -> 1 ma khac; B1 (12/10): cua so 5/10..12/10 co B5 -> 1", m.B2.ng_so_ma === 1 && m.B1.ng_so_ma === 1, `${m.B2.ng_so_ma} ${m.B1.ng_so_ma}`);
  ok("B5 (5/10) la diem dau: 0 ma khac; T1 (Thep) khong co ma cung nganh: 0", m.B5.ng_so_ma === 0 && m.T1.ng_so_ma === 0 && m.T1.ng_manh === false);
  ok("loc cungNganh = 2: B3 (B1, B2) va B4 (B2, B3); = 1: them B1 (B5 dung moc 5/10) va B2", ma(locDiemB(g, { cungNganh: 2 })) === "B3,B4" && ma(locDiemB(g, { cungNganh: 1 })) === "B1,B2,B3,B4", ma(locDiemB(g, { cungNganh: 2 })) + " / " + ma(locDiemB(g, { cungNganh: 1 })));
  ok("cungNganh = 0: khong loc", locDiemB(g, { cungNganh: 0 }).length === g.length);
  ok("manhNganh: B4 giam 30% > trung vi cua so (>= 3 diem, trung vi >= 10%)", typeof m.B4.ng_manh === "boolean" && m.B1.ng_manh === false, `${m.B4.ng_manh}`);
}
ok("LOC_MAC_DINH khong dong vao du lieu", locDiemB(ds, LOC_MAC_DINH).length === 5);

if (loi) {
  console.log(`\n${loi} LOI`);
  process.exit(1);
}
console.log("\nTAT CA DAT");
