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
  ];
  const thieu = CAC_TRUONG_BAT_BUOC.filter((k) => !(k in ketQua));
  ok(`co du ca 57 truong can thiet (chua tinh cap_nhat_luc do server tu dien)`, thieu.length === 0, JSON.stringify(thieu));

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
    ok("khong giu lenh -> gia_mua = null", ketQua.gia_mua == null, ketQua.gia_mua);
    ok("khong giu lenh -> stop_loss = null", ketQua.stop_loss == null, ketQua.stop_loss);
  }

  if (ketQua.dang_giu_moi) {
    ok("dang giu Mua them -> gia_mua_moi/stop_moi hop le", ketQua.gia_mua_moi > 0 && ketQua.stop_moi > 0 && ketQua.stop_moi < ketQua.gia_mua_moi);
  }
}

console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
