// Test tay cho lib/lamSachChoKhach.js. Chay: node engine/test/lamSachChoKhach.test.mjs
import { lamSachMotDong, lamSachChoKhach, TRUONG_KHACH_THAY } from "../../lib/lamSachChoKhach.js";

let loi = 0;
const ok = (ten, dk, them = "") => { if (!dk) { loi++; console.log("SAI:", ten, them); } else console.log("ok:", ten); };

const row = {
  ma: "GVR", tin: "NAM GIU", diem: 4.85, trend: 2, mom: 0.5, dt: 0.5, gia: 32.85, doi: -2.9, adx: 30, rs_vni: 5, kijun: 33.35, gg_top: 31, gg_bot: 29, dinh_52t: 46.5,
  gia_mua: 32.2, ngay_mua: "2026-09-17", stop_loss: 30.27, tp1: 34.95, tp2: 35.42, tp3: 46.5, tp_da_cham: "TP1", lai_lo_pct: 2, so_phien_giu: 15, ban_bot: true,
  gia_vao_web: 32.3, vao_tp1: 34, gia_mua_giua: 33, dang_giu_giua: true, mua_giua: true, stop_giua: 31, tp1_giua: 35, ly_do_ban: 2, cho_phien_sau: true, giai_ngan: "MOT PHAN",
  moc_gia: 34, moc_loai: "MAY", moc_cach_pct: 2, diem_neu_vuot: 6, gia_kich_hoat: 32, che_do_vao: "MOI", loai_vao: "MUA LAI", da_chot_mua: true, mua_theo_doi_tu: "x", ban_theo_doi: true,
  lenh_web: [{ ma: "GVR", gia_mua: 32.9 }], ten_cong_ty: "Tap doan GVR", san: "HOSE", nganh: "Hoa chat", von_hoa_ty: 100000, gtgd_tb20: 12, khoi_luong_tb20: 1e6, cap_nhat_luc: "2026-10-09",
};
const s = lamSachMotDong(row);
const cam = ["tin", "gia_mua", "ngay_mua", "stop_loss", "tp1", "tp2", "tp3", "tp_da_cham", "lai_lo_pct", "so_phien_giu", "ban_bot", "gia_vao_web", "vao_tp1", "gia_mua_giua", "dang_giu_giua", "mua_giua", "stop_giua", "tp1_giua",
  "ly_do_ban", "cho_phien_sau", "giai_ngan", "moc_gia", "moc_loai", "moc_cach_pct", "diem_neu_vuot", "gia_kich_hoat", "che_do_vao", "loai_vao", "da_chot_mua", "mua_theo_doi_tu", "ban_theo_doi", "lenh_web"];
ok("khach khong thay bat ky truong tin hieu / vi the nao", cam.every((k) => !(k in s)), JSON.stringify(Object.keys(s)));
ok("khach van thay du lieu cong khai (gia, diem, ma, ten, von hoa, chi bao)", ["ma", "gia", "doi", "diem", "trend", "kijun", "gg_top", "ten_cong_ty", "von_hoa_ty", "gtgd_tb20"].every((k) => k in s));
ok("khong sua dong goc", row.tin === "NAM GIU" && row.gia_mua === 32.2);
ok("tinGiaDinh: gan gia tri tin de ve cot, khong ro gi that", lamSachMotDong(row, { tinGiaDinh: "TRUNG LAP" }).tin === "TRUNG LAP");
ok("truong moi them vao row mac dinh bi AN (allowlist)", !("truong_moi_chua_biet" in lamSachMotDong({ ...row, truong_moi_chua_biet: 1 })));
ok("lamSachChoKhach: mang", lamSachChoKhach([row, row]).length === 2 && TRUONG_KHACH_THAY.includes("gia"));
console.log(loi ? `${loi} LOI` : "TAT CA DAT");
process.exit(loi ? 1 : 0);
