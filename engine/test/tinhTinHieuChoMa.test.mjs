// Test TICH HOP cho engine/tinhTinHieuChoMa.js - chay toan bo pipeline voi 1 chuoi gia tong hop
// de bat loi KHI RAP (crash, thieu truong, gia tri vo ly) - KHONG thay the buoc doi chieu that
// voi AmiBroker (Giai doan 5), chi la luoi an toan truoc khi toi buoc do.
import { tinhTinHieuChoMa } from "../tinhTinHieuChoMa.js";
import { tinhTatCaBreadth } from "../loi/breadth.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

// Chuoi gia tong hop DETERMINISTIC (sin + xu huong tang dan) - khong phai du lieu that, chi de
// co du 300+ nen "hop ly" (H>=L, O/C nam trong [L,H]) chay qua duoc toan bo pipeline.
function taoNenGiaTongHop(soNen, hatGiong = 1, xuHuongCoBan = 0.02) {
  const nen = [];
  let gia = 50;
  let hat = hatGiong;
  const ngauNhien = () => {
    hat = (hat * 9301 + 49297) % 233280;
    return hat / 233280;
  };
  const ngayGoc = new Date("2024-01-01T00:00:00Z");
  for (let i = 0; i < soNen; i++) {
    const xuHuong = xuHuongCoBan + 0.02 * Math.sin(i / 40);
    const doOn = (ngauNhien() - 0.5) * 1.5;
    gia = Math.max(5, gia * (1 + xuHuong / 100 + doOn / 100));
    const bienDo = gia * (0.005 + ngauNhien() * 0.01);
    const o = gia * (1 + (ngauNhien() - 0.5) * 0.005);
    const c = gia;
    const h = Math.max(o, c) + bienDo * ngauNhien();
    const l = Math.min(o, c) - bienDo * ngauNhien();
    const v = Math.round(500000 + ngauNhien() * 500000);
    const ngay = new Date(ngayGoc.getTime() + i * 86400000).toISOString().slice(0, 10);
    nen.push({ t: ngay, o, h, l, c, v });
  }
  return nen;
}

// Xu huong tang manh & ben (0.15%/ngay) de mã chac chan roi vao trang thai NAM GIU (kem Mua them
// sau TP3) - qua do kiem tra duoc CA cac nhanh "dang giu lenh" cua ham, khong chi nhanh trung lap.
const soLuongNen = 400;
const nen = taoNenGiaTongHop(soLuongNen, 7, 0.15);
const vniClose = taoNenGiaTongHop(soLuongNen, 99, 0.03).map((b) => b.c * 20); // ty le VNINDEX gia dinh
const ketQuaBreadth = tinhTatCaBreadth(() => undefined); // khong co du lieu thi truong khac -> tat ca 0%, trungBinh 0

let ketQua;
try {
  ketQua = tinhTinHieuChoMa({ ma: "TESTMA", nen, vniClose, san: "HOSE", ketQuaBreadth });
  ok("chay het toan bo pipeline khong crash", true);
} catch (e) {
  ok("chay het toan bo pipeline khong crash", false, e.stack);
}

if (ketQua) {
  const CAC_TRUONG_BAT_BUOC = [
    "ma", "tin", "diem", "trend", "mom", "dt", "adx", "gia", "doi", "rs_vni", "breadth_nganh",
    "kijun", "gg_top", "gg_bot", "dinh_52t", "stop_loss", "mat_than", "tp1", "tp2", "tp3",
    "gtgd_tb20", "fvg_ok", "so_phien_giu", "lai_lo_pct", "sanyaku", "kumo_twist", "ngay_bien_doi",
    "von_hoa", "gia_mua", "ngay_mua", "ban_bot", "san", "nganh", "tp_da_cham", "diem_rank",
    "diem_confidence", "khoi_luong_tb20", "giai_ngan", "gia_kich_hoat", "moc_kich_hoat", "moc_gia",
    "moc_loai", "moc_cach_pct", "diem_neu_vuot", "che_do_vao", "loai_vao", "cho_phien_sau",
    "mua_moi", "dang_giu_moi", "cat_moi", "gia_mua_moi", "stop_moi", "tp1_moi", "tp2_moi",
    "tp3_moi", "ngay_mua_moi", "ly_do_ban", "dang_bao_ve_lai", "stop_bao_ve",
    "mua_giua", "dang_giu_giua", "cat_giua", "gia_mua_giua", "stop_giua", "tp1_giua", "tp2_giua",
    "tp3_giua", "ngay_mua_giua",
  ];
  const thieu = CAC_TRUONG_BAT_BUOC.filter((k) => !(k in ketQua));
  ok(`co du ca 66 truong can thiet (chua tinh cap_nhat_luc do server tu dien)`, thieu.length === 0, JSON.stringify(thieu));

  ok("tin la 1 trong 4 gia tri hop le", ["MUA", "NAM GIU", "BAN", "TRUNG LAP"].includes(ketQua.tin), ketQua.tin);
  ok("gia > 0", ketQua.gia > 0, ketQua.gia);
  ok("diem (TotalScore) la so huu han", Number.isFinite(ketQua.diem), ketQua.diem);
  ok("Rank trong khoang [0,100]", ketQua.diem_rank >= 0 && ketQua.diem_rank <= 100, ketQua.diem_rank);
  ok("Confidence trong khoang [0,100]", ketQua.diem_confidence >= 0 && ketQua.diem_confidence <= 100, ketQua.diem_confidence);

  if (ketQua.tin === "MUA" || ketQua.tin === "NAM GIU") {
    ok("dang giu -> co gia mua > 0", ketQua.gia_mua > 0, ketQua.gia_mua);
    ok("dang giu -> co Stop-loss > 0 va THAP HON gia mua", ketQua.stop_loss > 0 && ketQua.stop_loss < ketQua.gia_mua, ketQua.stop_loss);
    ok("dang giu -> co ngay mua (dang d/m/yyyy)", /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(ketQua.ngay_mua ?? ""), ketQua.ngay_mua);
    ok("dang giu -> co TP1<=TP2<=TP3, deu tren gia mua", ketQua.tp1 <= ketQua.tp2 && ketQua.tp2 <= ketQua.tp3 && ketQua.tp1 > ketQua.gia_mua, [ketQua.tp1, ketQua.tp2, ketQua.tp3]);
  } else {
    // Chuoi gia luon tang manh nen kich ban nay khong roi vao day trong thuc te - test rieng ben
    // duoi (kich ban Ban sau khi Mua) moi thuc su kiem tra nhanh TRUNG LAP/BAN.
    ok("(khong roi vao nhanh nay voi chuoi gia luon tang - bo qua)", true);
  }

  if (ketQua.dang_giu_moi) {
    ok("dang giu Mua them -> gia_mua_moi/stop_moi hop le", ketQua.gia_mua_moi > 0 && ketQua.stop_moi > 0 && ketQua.stop_moi < ketQua.gia_mua_moi);
  }

  // 2 tin hieu moi (Mua muon/Mua them giua chung) mac dinh TAT - bat thu qua thamSo tren CUNG
  // chuoi gia de kiem tra khong crash khi bat, va neu co kich hoat thi du lieu phai hop le.
  let ketQuaBatThem;
  try {
    ketQuaBatThem = tinhTinHieuChoMa({ ma: "TESTMA3", nen, vniClose, san: "HOSE", ketQuaBreadth, thamSo: { batMuaMuon: true, batMuaThemGiuaChung: true } });
    ok("bat Mua muon + Mua them giua chung: chay khong crash", true);
  } catch (e) {
    ok("bat Mua muon + Mua them giua chung: chay khong crash", false, e.stack);
  }
  if (ketQuaBatThem?.dang_giu_giua) {
    ok(
      "dang giu Mua them giua chung -> gia_mua_giua/stop_giua/tp1-3_giua hop le",
      ketQuaBatThem.gia_mua_giua > 0 &&
        ketQuaBatThem.stop_giua > 0 &&
        ketQuaBatThem.stop_giua < ketQuaBatThem.gia_mua_giua &&
        ketQuaBatThem.tp1_giua <= ketQuaBatThem.tp2_giua &&
        ketQuaBatThem.tp2_giua <= ketQuaBatThem.tp3_giua
    );
    ok("dang giu Mua them giua chung -> co ngay mua giua (dang d/m/yyyy)", /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(ketQuaBatThem.ngay_mua_giua ?? ""));
  }
  if (ketQuaBatThem?.loai_vao === "MUA MUON") {
    ok("loai_vao MUA MUON -> van co gia_mua/stop_loss hop le nhu 1 lenh Mua binh thuong", ketQuaBatThem.gia_mua > 0 && ketQuaBatThem.stop_loss > 0);
  }
}

// ---- Kich ban 2: TANG MANH roi SAP MANH (chac chan MUA roi BAN) - kiem tra dung bug da sua
// 2026-09-23: AFL xuat gia_mua/stop_loss/tp1-3/ngay_mua/lai_lo_pct la ValueWhen(Buy,X,1), CARRY
// FORWARD MAI MAI ke ca sau khi da Ban (KHONG reset ve null/rong khi het dang giu) - doi chieu CSV
// that voi AmiBroker 2026-09-22 phat hien engine truoc do gate nham theo dangGiuCuoi lam cac cot
// nay rong sai cho hau het ma dang o trang thai TRUNG LAP/BAN.
function taoNenSauKhiBan() {
  const tang = taoNenGiaTongHop(400, 7, 0.15);
  const ngayGocSap = new Date(tang[tang.length - 1].t + "T00:00:00Z").getTime() + 86400000;
  const sap = [];
  let gia = tang[tang.length - 1].c;
  for (let i = 0; i < 100; i++) {
    gia *= 0.95; // giam 5%/phien - chac chan xuyen thung moi stop-loss hop ly, kich hoat Ban
    const ngay = new Date(ngayGocSap + i * 86400000).toISOString().slice(0, 10);
    sap.push({ t: ngay, o: gia * 1.02, h: gia * 1.03, l: gia * 0.99, c: gia, v: 500000 });
  }
  return [...tang, ...sap];
}

const nenSauBan = taoNenSauKhiBan();
const vniCloseSauBan = taoNenGiaTongHop(nenSauBan.length, 99, 0.03).map((b) => b.c * 20);
let ketQua2;
try {
  ketQua2 = tinhTinHieuChoMa({ ma: "TESTMA2", nen: nenSauBan, vniClose: vniCloseSauBan, san: "HOSE", ketQuaBreadth: tinhTatCaBreadth(() => undefined) });
  ok("kich ban Mua roi Ban: chay khong crash", true);
} catch (e) {
  ok("kich ban Mua roi Ban: chay khong crash", false, e.stack);
}
if (ketQua2) {
  ok("kich ban Mua roi Ban: tin la BAN hoac TRUNG LAP (da tung mua truoc, gia sau do sap manh)", ["BAN", "TRUNG LAP"].includes(ketQua2.tin), ketQua2.tin);
  ok("da tung MUA -> gia_mua VAN con gia tri (khong reset ve null khi het giu)", ketQua2.gia_mua > 0, ketQua2.gia_mua);
  ok("da tung MUA -> stop_loss VAN con gia tri", ketQua2.stop_loss > 0, ketQua2.stop_loss);
  ok("da tung MUA -> tp1/tp2/tp3 VAN con gia tri", ketQua2.tp1 > 0 && ketQua2.tp2 > 0 && ketQua2.tp3 > 0, [ketQua2.tp1, ketQua2.tp2, ketQua2.tp3]);
  ok("da tung MUA -> ngay_mua VAN con gia tri (dang d/m/yyyy)", /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(ketQua2.ngay_mua ?? ""), ketQua2.ngay_mua);
  ok("da tung MUA, gia da sap manh -> lai_lo_pct < 0", ketQua2.lai_lo_pct < 0, ketQua2.lai_lo_pct);
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
