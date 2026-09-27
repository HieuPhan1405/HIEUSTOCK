// Test tay cho lib/thongBao.js (noi dung thong bao tin hieu / dang ky moi, ai duoc nhan). Chay: node engine/test/thongBao.test.mjs
import { dungThongBaoTinHieu, thongBaoDangKy, locChoNguoiDung, tomTatDay, demChuaXem, cheSdt } from "../../lib/thongBao.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

const ngay = "2026-09-28";
const coHoi = {
  ngay,
  mua: [{ ma: "VPB", gia: 25.5, stop_loss: 24.1, tp1: 27.2, tp2: 28, loai_vao: null }],
  ban: [{ khoa: "NAB|2026-09-10|goc", ma: "NAB", laMuaMoi: false, lyDo: "Cắt lỗ", giaBan: 14.2, ketQuaPct: -3.1 }],
  muaMoi: [{ ma: "FPT", khoa_lenh: "FPT|giua|2026-09-28", gia_mua: 120.5, stop_loss: 115 }],
  banBot: [
    { khoa: "HPG|2026-09-01|goc|chot", ma: "HPG", laMuaMoi: false, loai: "chot", moc: [{ tp: "TP1", gia: 30 }, { tp: "TP2", gia: 31.5 }], laiPct: 6 },
    { khoa: "MWG|canhBao", ma: "MWG", loai: "canhBao", diem: 0.4, laiPct: 2.3 },
  ],
};

const ds = dungThongBaoTinHieu(coHoi);
ok("6 su kien (TP1 + TP2 tach rieng)", ds.length === 6, JSON.stringify(ds.map((t) => t.khoa)));
ok("khoa mua theo ma + phien", ds[0].khoa === "mua:VPB:2026-09-28");
ok("noi dung mua kieu VN", ds[0].noi_dung === "Giá 25,5 · cắt lỗ 24,1 · TP1 27,2 / TP2 28", ds[0].noi_dung);
ok("ban co ket qua ca lenh", ds[1].noi_dung.includes("cả lệnh -3,1%"), ds[1].noi_dung);
ok("mua moi dung khoa lenh", ds[2].khoa === "mua_moi:FPT|giua|2026-09-28");
ok("ban bot TP1, TP2 khoa rieng", ds[3].khoa.endsWith(":TP1") && ds[4].khoa.endsWith(":TP2"));
ok("giam bot", ds[5].loai === "giam_bot" && ds[5].tieu_de === "GIẢM BỚT MWG");
ok("khong co ngay -> rong", dungThongBaoTinHieu({ ...coHoi, ngay: null }).length === 0);
ok(
  "mua: khoa theo ngay tin hieu (upload du lieu cu sang phien sau khong bao lai)",
  dungThongBaoTinHieu({ ngay: "2026-09-29", mua: [{ ma: "VPB", gia: 25.5, ngay_mua: "2026-09-28" }] })[0].khoa === "mua:VPB:2026-09-28"
);
ok("upload lai cung phien -> cung khoa", JSON.stringify(dungThongBaoTinHieu(coHoi).map((t) => t.khoa)) === JSON.stringify(ds.map((t) => t.khoa)));

const dk = thongBaoDangKy({ id: 7, ten: "Lan", sdt: "0912345678" });
ok("dang ky chi admin", dk.chi_admin === true && dk.duong_dan === "/quan-tri" && dk.khoa === "dang_ky:7");
ok("che sdt", cheSdt("0912345678") === "0912***678");

const tatCa = [...ds, dk];
ok("khach chua duyet: khong nhan gi", locChoNguoiDung(tatCa, { daDuyet: false }).length === 0);
ok("da duyet: nhan tin hieu, khong nhan dang ky", locChoNguoiDung(tatCa, { daDuyet: true }).length === 6);
ok("admin: nhan het", locChoNguoiDung(tatCa, { laAdmin: true }).length === 7);
ok("admin tat tin hieu: chi dang ky", locChoNguoiDung(tatCa, { laAdmin: true, phamVi: "khong" }).length === 1);
ok("chi ma theo doi", locChoNguoiDung(tatCa, { daDuyet: true, phamVi: "danh_muc", maTheoDoi: ["HPG", "VPB"] }).length === 3);

const mot = tomTatDay([ds[0]], { trongPhien: true });
ok("1 su kien: tieu de + nhac trong phien", mot.title === "MUA VPB" && mot.body.includes("trong phiên") && mot.url === "/ma/VPB");
const nhieu = tomTatDay(ds);
ok("nhieu su kien: gom theo loai", nhieu.title === "6 tín hiệu mới" && nhieu.body.split("\n")[0] === "Bán: NAB" && nhieu.body.includes("Bán bớt: HPG") && nhieu.url === "/", nhieu.body);
ok("gom: ma trung chi 1 lan", !nhieu.body.includes("HPG, HPG"));
const chiDk = tomTatDay([dk, { ...dk, khoa: "dang_ky:8", noi_dung: "Minh · 0987654321 — đang chờ duyệt" }]);
ok("2 dang ky -> mo quan tri", chiDk.title === "2 người mới đăng ký" && chiDk.url === "/quan-tri" && chiDk.body === "Đăng ký mới: Lan, Minh", chiDk.body);
ok("rong -> null", tomTatDay([]) === null);
ok("1 dang ky: che so dien thoai tren man hinh khoa", tomTatDay([dk]).body === "Lan · 0912***678 — đang chờ duyệt", tomTatDay([dk]).body);

const coGio = [{ tao_luc: "2026-09-28T03:00:00Z" }, { tao_luc: "2026-09-28T05:00:00Z" }];
ok("chua xem: moi hon lan mo", demChuaXem(coGio, "2026-09-28T04:00:00Z") === 1 && demChuaXem(coGio, null) === 2);

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
