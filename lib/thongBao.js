// THONG BAO (chuong tren thanh dau + thong bao day ve may) - ham THUAN, khong dung DB (import tuong doi de test tay: engine/test/thongBao.test.mjs).
//  - Tin hieu: dung DUNG 4 o "Top co hoi dang chu y" cua trang dau (lib/coHoiHomNay.js) - Mua, Ban, Mua moi, Ban bot (chot TP1/TP2 + canh bao giam bot). Moi su kien co 1 KHOA
//    chong trung (ma + phien + moc) nen upload nhieu lan trong phien chi bao 1 lan.
//  - Nguoi dang ky moi: chi quan tri (la_admin) thay.
// Ai nhan thong bao day ve may: xem locChoNguoiDung.
import { soVN, pctVN } from "./soVN.js";
import { ngayChuoi } from "./muaThemTinhToan.js";
import { nhanKhungKeTiep } from "./khungGioVaoLenh.js";

export const LOAI_THONG_BAO = {
  mua: { nhan: "Mua", mau: "var(--xanh)" },
  mua_theo_doi: { nhan: "Theo dõi mua", mau: "var(--xanh)" },
  ban_theo_doi: { nhan: "Theo dõi bán", mau: "var(--do)" },
  ban: { nhan: "Bán", mau: "var(--do)" },
  mua_moi: { nhan: "Mua mới", mau: "var(--cyan)" },
  ban_bot: { nhan: "Bán bớt", mau: "var(--cam)" },
  giam_bot: { nhan: "Giảm bớt", mau: "var(--cam)" },
  dang_ky: { nhan: "Đăng ký mới", mau: "var(--tim-nhat)" },
  danh_muc: { nhan: "Danh mục", mau: "var(--cam)" },
  bo_loc: { nhan: "Bộ lọc của tôi", mau: "var(--tim-nhat)" },
  goi_y_mua: { nhan: "Gợi ý mua", mau: "var(--xanh)" },
  diem_b: { nhan: "Dấu hiệu hồi phục", mau: "var(--tim-nhat)" },
  bat_day: { nhan: "Dấu hiệu tạo đáy", mau: "var(--cyan)" },
  phai_sinh: { nhan: "Phái sinh", mau: "var(--vang)" },
};

// LOAI THONG BAO TAI KHOAN CHON NHAN VE MAY (trang ca nhan /tai-khoan): tich nhom nao thi gui nhom do. nguoi_dung.thong_bao_nhom = mang khoa nhom da tich; NULL = chua chon bao gio = nhan het (nhu truoc).
// Thong bao khong thuoc nhom nao (vd "thu" - nut Gui thu) luon duoc gui.
export const NHOM_THONG_BAO = [
  { khoa: "mua", nhan: "Tín hiệu MUA", moTa: "Mã vừa có tín hiệu MUA hoặc MUA MỚI trong khung giờ vào lệnh.", loai: ["mua", "mua_moi"] },
  { khoa: "theo_doi", nhan: "Theo dõi ngoài khung giờ", moTa: "MUA / BÁN còn đang theo dõi, chưa đến khung giờ chốt lệnh (có thể đổi trước khi chốt).", loai: ["mua_theo_doi", "ban_theo_doi"] },
  { khoa: "ban", nhan: "Tín hiệu BÁN", moTa: "Mã trong lệnh của hệ thống chuyển sang BÁN hoặc cắt lỗ.", loai: ["ban"] },
  { khoa: "ban_bot", nhan: "Bán bớt khi chạm TP", moTa: "Chốt 30% khi giá chạm TP1 hoặc TP2.", loai: ["ban_bot"] },
  { khoa: "giam_bot", nhan: "Cảnh báo giảm bớt", moTa: "Điểm tụt dưới ngưỡng nhưng chưa đủ điều kiện BÁN.", loai: ["giam_bot"] },
  { khoa: "goi_y_mua", nhan: "Gợi ý mua mới", moTa: "Mã đạt bộ điều kiện mua đã kiểm chứng (trang Đánh giá danh mục).", loai: ["goi_y_mua"] },
  { khoa: "diem_b", nhan: "Dấu hiệu hồi phục (điểm B)", moTa: "Mã giảm 20–30% rồi lấy lại Tenkan + Kijun. Chỉ là dấu hiệu để theo dõi, không phải điểm mua chính.", loai: ["diem_b"] },
  { khoa: "bat_day", nhan: "Dấu hiệu tạo đáy (bắt đáy)", moTa: "Mã đủ điều kiện trong checklist bắt đáy. Chỉ là dấu hiệu để theo dõi, không phải điểm mua chính.", loai: ["bat_day"] },
  { khoa: "phai_sinh", nhan: "Phái sinh VN30F1M", moTa: "Báo lệnh trong ngày của hợp đồng VN30F1M: vào lệnh, cắt lỗ, thoát lệnh.", loai: ["phai_sinh"] },
  { khoa: "danh_muc", nhan: "Danh mục đã lưu", moTa: "Mã trong danh mục bạn lưu chuyển sang Giảm / Thoát hoặc có điểm mua.", loai: ["danh_muc"] },
  { khoa: "dang_ky", nhan: "Người mới đăng ký", moTa: "Chỉ quản trị: có người vừa đăng ký, chờ duyệt.", loai: ["dang_ky"], chiAdmin: true },
];
export const KHOA_NHOM = NHOM_THONG_BAO.map((n) => n.khoa);
// nhomChon: mang khoa da tich | null (nhan het). Loai khong thuoc nhom nao -> luon duoc gui.
export function loaiDuocPhep(loai, nhomChon) {
  if (nhomChon == null) return true;
  const nhom = NHOM_THONG_BAO.find((n) => n.loai.includes(loai));
  return nhom ? nhomChon.includes(nhom.khoa) : true;
}
// Chuan hoa danh sach nhom client gui len: bo trung / khoa la; mang rong hop le (= tat het).
export function chuanHoaNhom(ds) {
  if (!Array.isArray(ds)) return null;
  return [...new Set(ds.map(String))].filter((k) => KHOA_NHOM.includes(k));
}

// Pham vi nhan thong bao TIN HIEU ve may (moi tai khoan tu chon o chuong thong bao).
export const PHAM_VI = {
  tat_ca: "Tất cả mã",
  danh_muc: "Chỉ mã tôi theo dõi",
  khong: "Không nhận tín hiệu",
};

const noi = (...phan) => phan.filter(Boolean).join(" · ");
const coSo = (v) => v != null && Number.isFinite(Number(v)) && Number(v) > 0;

// Su kien tin hieu cua phien tu ket qua dungCoHoiHomNay ({ mua, ban, muaMoi, banBot }) -> danh sach thong bao { khoa, loai, ma, tieu_de, noi_dung, duong_dan, ngay }.
// KHUNG GIO VAO LENH (lib/khungGioVaoLenh.js): trongKhung = false -> Mua / Mua moi bao "THEO DOI MUA" (khoa rieng - vao khung ma tin hieu con thi bao them "MUA");
// lenh ban / cat lo dang THEO DOI (b.theoDoi, chua chot) bao "THEO DOI BAN" kem khung chot ke tiep; chot xong bao "BAN".
export function dungThongBaoTinHieu({ mua = [], ban = [], muaMoi = [], banBot = [], ngay, trongKhung = true, bayGio = new Date() }) {
  if (!ngay) return [];
  const ra = [];
  for (const r of mua) {
    const muaTheoDoi = !trongKhung && r.da_chot_mua !== true && !r.lenh_web;
    ra.push({
      // Khoa theo NGAY TIN HIEU (khong theo ngay upload): upload lai du lieu cu (vd sang thu 2 truoc gio mo cua) khong bao lai.
      khoa: `${muaTheoDoi ? "mua_theo_doi" : "mua"}:${r.ma}:${ngayChuoi(r.ngay_mua) ?? ngay}`,
      loai: muaTheoDoi ? "mua_theo_doi" : "mua",
      ma: r.ma,
      tieu_de: `${muaTheoDoi ? "THEO DÕI " : ""}${r.loai_vao === "MUA LAI" ? "MUA LẠI" : "MUA"} ${r.ma}`,
      noi_dung: noi(
        `Giá ${soVN(r.gia)}`,
        coSo(r.stop_loss) && `cắt lỗ ${soVN(r.stop_loss)}`,
        coSo(r.tp1) && `TP1 ${soVN(r.tp1)}${coSo(r.tp2) ? ` / TP2 ${soVN(r.tp2)}` : ""}`,
        r.giai_ngan === "MOT PHAN" && "giải ngân 1 phần",
        muaTheoDoi && "ngoài khung giờ, chỉ mua trong khung"
      ),
      duong_dan: `/ma/${r.ma}`,
      ngay,
    });
  }
  for (const b of ban) {
    const theoDoi = b.theoDoi === true;
    ra.push({
      // Dang THEO DOI: 1 lan cho moi lenh; chot trong khung: 1 lan theo phien chot.
      khoa: theoDoi ? `ban_theo_doi:${b.khoa}` : `ban:${b.khoa}:${ngay}`,
      loai: theoDoi ? "ban_theo_doi" : "ban",
      ma: b.ma,
      tieu_de: `${theoDoi ? "THEO DÕI " : ""}BÁN ${b.ma}${b.laMuaMoi ? " (lệnh mua mới)" : ""}`,
      noi_dung: theoDoi
        ? noi(b.lyDo, coSo(b.giaBan) && `giá hiện ${soVN(b.giaBan)}`, `chốt ở khung ${nhanKhungKeTiep(b.theoDoiTu ?? bayGio, bayGio)} nếu tín hiệu còn`)
        : noi(b.lyDo, coSo(b.giaBan) && `giá ${soVN(b.giaBan)}`, b.ketQuaPct != null && `cả lệnh ${pctVN(b.ketQuaPct, 2)}`),
      duong_dan: `/ma/${b.ma}`,
      ngay,
    });
  }
  for (const l of muaMoi) {
    ra.push({
      khoa: `${trongKhung ? "mua_moi" : "mua_theo_doi"}:${l.khoa_lenh ?? `${l.ma}:${ngay}`}`,
      loai: trongKhung ? "mua_moi" : "mua_theo_doi",
      ma: l.ma,
      tieu_de: `${trongKhung ? "" : "THEO DÕI "}MUA MỚI ${l.ma}`,
      noi_dung: noi(
        `Giá ${soVN(l.gia_mua ?? l.gia)}`,
        coSo(l.stop_loss) && `cắt lỗ ${soVN(l.stop_loss)}`,
        coSo(l.tp1) && `TP1 ${soVN(l.tp1)}`,
        !trongKhung && "ngoài khung giờ, chỉ mua trong khung"
      ),
      duong_dan: `/ma/${l.ma}`,
      ngay,
    });
  }
  for (const x of banBot) {
    if (x.loai === "chot") {
      // Moi moc TP 1 thong bao (TP1 luc 10h, TP2 luc 14h cung phien -> 2 lan bao, khong bao lai TP1).
      for (const m of x.moc ?? []) {
        ra.push({
          khoa: `ban_bot:${x.khoa}:${m.tp}`,
          loai: "ban_bot",
          ma: x.ma,
          tieu_de: `BÁN BỚT ${x.ma} — chạm ${m.tp}${x.laMuaMoi ? " (lệnh mua mới)" : ""}`,
          noi_dung: noi(`Chốt 30% giá ${soVN(m.gia)}`, x.moc.length === 1 && x.laiPct != null && `lãi phần chốt ${pctVN(x.laiPct, 2)}`),
          duong_dan: `/ma/${x.ma}`,
          ngay,
        });
      }
    } else {
      ra.push({
        // 1 lan cho moi lenh dang giu (canh bao co the keo dai nhieu phien lien tiep - khong bao lai moi ngay).
        khoa: `giam_bot:${x.ma}:${x.ngayMua ?? ngay}`,
        loai: "giam_bot",
        ma: x.ma,
        tieu_de: `GIẢM BỚT ${x.ma}`,
        noi_dung: noi(`Điểm ${soVN(x.diem)} dưới ngưỡng, chưa đủ điều kiện BÁN`, x.laiPct != null && `đang ${pctVN(x.laiPct, 2)}`),
        duong_dan: `/ma/${x.ma}`,
        ngay,
      });
    }
  }
  return ra;
}

// GOI Y MUA MOI (bo dieu kien da backtest, lib/goiYMua.js + lib/goiYMuaDb.js): moi ma DAT dieu kien 1 thong bao / ngay tin hieu (khoa goi_y_mua:MA:ngay).
// Chi bao khi lenh MUA da "that": trong khung gio vao lenh (trongKhung) hoac da chot mua / web giu lenh - ngoai khung chua chot thi cho, lan upload trong khung moi bao.
// dat = [{ ma, nganh, moc, stop_loss, tp1, rsi14, sma50Pct, ngayMua, daChot }] (cac ma da qua kiemTraDieuKien).
export function dungThongBaoGoiYMua({ dat = [], ngay, trongKhung = true }) {
  if (!ngay) return [];
  const g2 = (x) => String(Math.round(x * 100) / 100).replace(".", ",");
  return dat
    .filter((u) => trongKhung || u.daChot)
    .map((u) => {
      const catLo = Math.max(Number(u.stop_loss) || 0, u.moc * 0.94);
      return {
        khoa: `goi_y_mua:${u.ma}:${u.ngayMua ?? ngay}`,
        loai: "goi_y_mua",
        ma: u.ma,
        tieu_de: `GỢI Ý MUA ${u.ma}`,
        noi_dung: noi(`Vùng mua ${g2(u.moc)}–${g2(u.moc * 1.01)}`, `cắt lỗ ${g2(catLo)}`, coSo(u.tp1) && `TP1 ${g2(u.tp1)}`, u.nganh && u.nganh !== "Khác" && u.nganh, "đạt bộ điều kiện đã kiểm chứng"),
        duong_dan: "/danh-gia-danh-muc?tab=goi_y",
        ngay,
      };
    });
}

// DAU HIEU HOI PHUC (DIEM B, mua phuc hoi - lib/muaPhucHoi.js) va DAU HIEU TAO DAY (checklist bat day): CHI la nhac theo doi, KHONG phai diem mua chinh -> tieu de "co dau hieu ...", noi dung nhac ro.
// rows: cac su kien MOI (ma, ngay, ...) lay tu bang diem_b_su_kien / bat_day_su_kien. Khoa chong trung theo (ma + ngay).
const g1 = (v) => soVN(v, 1, true);
export function dungThongBaoDiemB(rows = []) {
  return rows
    .filter((r) => r.ma && r.ngay && Number(r.giam) >= 20 && Number(r.giam) < 30) // dung nhom 20-30% (xem project diem B)
    .map((r) => ({
      khoa: `diem_b:${r.ma}:${r.ngay}`,
      loai: "diem_b",
      ma: r.ma,
      tieu_de: `${r.ma}: có dấu hiệu hồi phục`,
      noi_dung: noi(
        `Giảm ${g1(r.giam)}% từ đỉnh 20 phiên rồi lấy lại Tenkan + Kijun`,
        coSo(r.gia_b) && `giá ${soVN(r.gia_b)}`,
        r.dong_tien != null && (Number(r.dong_tien) === 1 ? "dòng tiền đã quay lên" : "dòng tiền còn yếu"),
        "chỉ là dấu hiệu để theo dõi, chưa phải điểm mua chính"
      ),
      duong_dan: `/ma/${r.ma}`,
      ngay: r.ngay,
    }));
}
export function dungThongBaoBatDay(rows = []) {
  return rows
    .filter((r) => r.ma && r.ngay && r.vn100 !== false)
    .map((r) => ({
      khoa: `bat_day:${r.ma}:${r.ngay}`,
      loai: "bat_day",
      ma: r.ma,
      tieu_de: `${r.ma}: có dấu hiệu tạo đáy`,
      noi_dung: noi(
        r.diem != null && `Đạt ${g1(r.diem)} điểm checklist bắt đáy`,
        r.chiet_khau != null && `giá chiết khấu ${g1(r.chiet_khau)}% so với đỉnh`,
        r.capitulation === true && "có phiên bán tháo",
        r.ftd === true && "có phiên xác nhận",
        "chỉ là dấu hiệu để theo dõi, chưa phải điểm mua chính"
      ),
      duong_dan: `/ma/${r.ma}`,
      ngay: r.ngay,
    }));
}

// PHAI SINH VN30F1M (trang /phai-sinh, lib/phaVoPhaiSinh.js): moi buoc cua 1 ngay 1 thong bao, khoa theo ngay + buoc nen trang thai khong doi thi khong bao lai.
// bienDong = ket qua tinhBienDong (lenh dau + lenhHai vao lai sau cat lo). Phien dau hop dong moi: he thong bo qua kieu pha vo nen khong bao.
// 14/11/2026: quaDem (xetGiuQuaDem cua hom nay) -> lenh con giu den 14:29 + dong tien ngay cung chieu thi bao "GIU QUA DEM" thay cho "dong cuoi phien" (kCuoi >= 231 = tu 14:20 bao truoc);
// quaDemHomQua -> bao dong lenh qua dem luc 9:30 (khoa theo ngay cua phien da giu).
export function dungThongBaoPhaiSinh({ ngay, bienDong, phienDauHopDong = false, quaDem = null, quaDemHomQua = null, kCuoi = -1 }) {
  const ra = [];
  const diem = (v) => `${v > 0 ? "+" : ""}${g1(v)} điểm sau phí`;
  const hq = quaDemHomQua;
  if (ngay && hq && hq.ketQua && hq.ketQua.xong) {
    ra.push({
      khoa: `phai_sinh:${hq.ngay}:demRa`,
      loai: "phai_sinh",
      ma: null,
      tieu_de: `PHÁI SINH: đóng lệnh giữ qua đêm VN30F1M ${g1(hq.ketQua.ra.gia)}`,
      noi_dung: noi(`lúc ${hq.ketQua.ra.gio}`, `${hq.phia > 0 ? "MUA" : "BÁN KHỐNG"} từ ${g1(hq.vao.gia)}`, diem(hq.ketQua.diemSauPhi)),
      duong_dan: "/phai-sinh",
      ngay,
    });
  }
  const b = bienDong;
  if (!ngay || !b || phienDauHopDong) return ra;
  const giuDem = !!(quaDem && quaDem.giu);
  const lenh = (x, buoc, tien) => {
    if (!x || !x.phia) return;
    const huong = x.phia > 0 ? "MUA" : "BÁN KHỐNG";
    ra.push({
      khoa: `phai_sinh:${ngay}:vao${buoc}`,
      loai: "phai_sinh",
      ma: null,
      tieu_de: `PHÁI SINH: ${tien}${huong} VN30F1M ${g1(x.vao.gia)}`,
      noi_dung: noi(`lúc ${x.vao.gio}`, `cắt lỗ ${g1(x.catLo)}`),
      duong_dan: "/phai-sinh",
      ngay,
    });
    if (x.ra) {
      const dem = giuDem && x.trangThai === "cuoiPhien";
      const ten = x.trangThai === "catLo" ? "CẮT LỖ" : x.trangThai === "khoaLai" ? "THOÁT CÓ LÃI" : dem ? "GIỮ QUA ĐÊM" : "ĐÓNG CUỐI PHIÊN";
      ra.push({
        khoa: `phai_sinh:${ngay}:ra${buoc}`,
        loai: "phai_sinh",
        ma: null,
        tieu_de: `PHÁI SINH: ${tien ? "Vào lại — " : ""}${ten} VN30F1M ${g1(x.ra.gia)}`,
        noi_dung: dem ? noi(`14:29`, "dòng tiền ngày cùng chiều", "không đóng, đóng 9:30 phiên sau") : noi(`lúc ${x.ra.gio}`, diem(x.diemSauPhi)),
        duong_dan: "/phai-sinh",
        ngay,
      });
    }
  };
  // bao truoc tu 14:20: lenh dang giu + dong tien ngay cung chieu
  if (giuDem && quaDem.dangGiu && kCuoi >= 231) {
    ra.push({
      khoa: `phai_sinh:${ngay}:dem`,
      loai: "phai_sinh",
      ma: null,
      tieu_de: `PHÁI SINH: có thể GIỮ QUA ĐÊM lệnh ${quaDem.phia > 0 ? "MUA" : "BÁN KHỐNG"} VN30F1M`,
      noi_dung: noi("dòng tiền ngày cùng chiều lệnh", "nếu đến 14:29 vẫn cùng chiều: không đóng, đóng 9:30 phiên sau"),
      duong_dan: "/phai-sinh",
      ngay,
    });
  }
  lenh(b, 1, "");
  if (b.vaoLai === "cho") {
    ra.push({
      khoa: `phai_sinh:${ngay}:cho2`,
      loai: "phai_sinh",
      ma: null,
      tieu_de: "PHÁI SINH: đã cắt lỗ, chờ vào lại",
      noi_dung: noi(`mua nếu giá chạm lại ≥ ${g1(b.mucMua)}`, `bán khống nếu ≤ ${g1(b.mucBan)}`, "trước 13:29"),
      duong_dan: "/phai-sinh",
      ngay,
    });
  }
  lenh(b.lenhHai, 2, "Vào lại — ");
  return ra;
}

// Che bot so dien thoai tren man hinh khoa (0912345678 -> 0912***678).
export const cheSdt = (sdt) => (sdt && String(sdt).length >= 7 ? `${String(sdt).slice(0, 4)}***${String(sdt).slice(-3)}` : sdt || "");

// Thong bao cho QUAN TRI khi co nguoi dang ky moi (tai khoan moi mac dinh cho duyet).
export function thongBaoDangKy(nd) {
  return {
    khoa: `dang_ky:${nd.id}`,
    loai: "dang_ky",
    chi_admin: true,
    ma: null,
    tieu_de: "Người mới đăng ký",
    noi_dung: `${nd.ten || "Chưa đặt tên"} · ${nd.sdt}${nd.email ? ` · ${nd.email}` : ""} — đang chờ duyệt`,
    duong_dan: "/quan-tri",
    ngay: null,
  };
}

// Loc cac thong bao 1 tai khoan duoc nhan VE MAY: dang ky moi -> chi quan tri; tin hieu -> tai khoan da duyet (hoac quan tri), theo pham vi da chon.
export function locChoNguoiDung(ds, { laAdmin = false, daDuyet = false, phamVi = "tat_ca", maTheoDoi = [], nhom = null } = {}) {
  const theoDoi = new Set(maTheoDoi);
  return ds.filter((t) => {
    if (!loaiDuocPhep(t.loai, nhom)) return false; // tai khoan khong tich loai nay
    if (t.chi_admin || t.loai === "dang_ky") return laAdmin;
    if (!daDuyet && !laAdmin) return false;
    if (t.loai === "phai_sinh") return true; // khong gan voi ma co phieu -> khong bi pham vi tin hieu chan; chi phu thuoc nhom da tich
    if (phamVi === "khong") return false;
    // goi y mua la ma MOI (chua cam) - nguoi chon "chi ma toi theo doi" van nhan, nguoi tat tin hieu thi khong
    if (t.loai === "goi_y_mua") return true;
    if (phamVi === "danh_muc") return theoDoi.has(t.ma);
    return true;
  });
}

const THU_TU = ["dang_ky", "phai_sinh", "ban", "ban_theo_doi", "ban_bot", "giam_bot", "goi_y_mua", "diem_b", "bat_day", "mua", "mua_moi", "mua_theo_doi", "danh_muc"];

// Noi dung 1 thong bao day (gom nhieu su kien cua 1 lan upload thanh 1 thong bao): { title, body, url, tag }. trongPhien: du lieu trong gio giao dich -> nhac tin hieu con co the doi.
export function tomTatDay(ds, { trongPhien = false } = {}) {
  if (!ds.length) return null;
  if (ds.length === 1) {
    const t = ds[0];
    // So dien thoai nguoi dang ky hien tren man hinh khoa -> che bot (xem day du o chuong thong bao / trang quan tri).
    const noiDung = t.loai === "dang_ky" ? String(t.noi_dung ?? "").replace(/\b0\d{9}\b/g, cheSdt) : t.noi_dung;
    return {
      title: t.tieu_de,
      body: [noiDung, trongPhien && t.loai !== "dang_ky" ? "Tín hiệu trong phiên — có thể đổi trước khi đóng cửa." : null].filter(Boolean).join("\n"),
      url: t.duong_dan || "/",
      tag: t.khoa,
    };
  }
  const nhom = new Map();
  for (const t of ds) {
    if (!nhom.has(t.loai)) nhom.set(t.loai, []);
    const ten = t.loai === "dang_ky" ? t.noi_dung.split(" · ")[0] : t.ma;
    if (!nhom.get(t.loai).includes(ten)) nhom.get(t.loai).push(ten);
  }
  const dong = [...nhom.keys()]
    .sort((a, b) => THU_TU.indexOf(a) - THU_TU.indexOf(b))
    .map((loai) => {
      const ten = nhom.get(loai);
      const hien = ten.length > 6 ? `${ten.slice(0, 6).join(", ")} +${ten.length - 6}` : ten.join(", ");
      return `${LOAI_THONG_BAO[loai]?.nhan ?? loai}: ${hien}`;
    });
  const chiDangKy = ds.every((t) => t.loai === "dang_ky");
  return {
    title: chiDangKy ? `${ds.length} người mới đăng ký` : `${ds.length} tín hiệu mới`,
    body: [...dong, trongPhien && !chiDangKy ? "Tín hiệu trong phiên — có thể đổi trước khi đóng cửa." : null].filter(Boolean).join("\n"),
    url: chiDangKy ? "/quan-tri" : "/",
    tag: `gop:${ds[0].khoa}`,
  };
}

// So thong bao CHUA XEM: moi hon lan mo chuong gan nhat (null = chua mo lan nao -> tat ca la chua xem).
export function demChuaXem(ds, xemLuc) {
  const moc = xemLuc ? new Date(xemLuc).getTime() : 0;
  return ds.filter((t) => new Date(t.tao_luc).getTime() > moc).length;
}
