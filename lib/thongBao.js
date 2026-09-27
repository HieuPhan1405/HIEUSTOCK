// THONG BAO (chuong tren thanh dau + thong bao day ve may) - ham THUAN, khong dung DB (import tuong doi de test tay: engine/test/thongBao.test.mjs).
//  - Tin hieu: dung DUNG 4 o "Top co hoi dang chu y" cua trang dau (lib/coHoiHomNay.js) - Mua, Ban, Mua moi, Ban bot (chot TP1/TP2 + canh bao giam bot). Moi su kien co 1 KHOA
//    chong trung (ma + phien + moc) nen upload nhieu lan trong phien chi bao 1 lan.
//  - Nguoi dang ky moi: chi quan tri (la_admin) thay.
// Ai nhan thong bao day ve may: xem locChoNguoiDung.
import { soVN, pctVN } from "./soVN.js";
import { ngayChuoi } from "./muaThemTinhToan.js";

export const LOAI_THONG_BAO = {
  mua: { nhan: "Mua", mau: "#22C55E" },
  ban: { nhan: "Bán", mau: "#EF4444" },
  mua_moi: { nhan: "Mua mới", mau: "#22D3EE" },
  ban_bot: { nhan: "Bán bớt", mau: "#F97316" },
  giam_bot: { nhan: "Giảm bớt", mau: "#F97316" },
  dang_ky: { nhan: "Đăng ký mới", mau: "#A78BFA" },
};

// Pham vi nhan thong bao TIN HIEU ve may (moi tai khoan tu chon o chuong thong bao).
export const PHAM_VI = {
  tat_ca: "Tất cả mã",
  danh_muc: "Chỉ mã tôi theo dõi",
  khong: "Không nhận tín hiệu",
};

const noi = (...phan) => phan.filter(Boolean).join(" · ");
const coSo = (v) => v != null && Number.isFinite(Number(v)) && Number(v) > 0;

// Su kien tin hieu cua phien tu ket qua dungCoHoiHomNay ({ mua, ban, muaMoi, banBot }) -> danh sach thong bao { khoa, loai, ma, tieu_de, noi_dung, duong_dan, ngay }.
export function dungThongBaoTinHieu({ mua = [], ban = [], muaMoi = [], banBot = [], ngay }) {
  if (!ngay) return [];
  const ra = [];
  for (const r of mua) {
    ra.push({
      // Khoa theo NGAY TIN HIEU (khong theo ngay upload): upload lai du lieu cu (vd sang thu 2 truoc gio mo cua) khong bao lai.
      khoa: `mua:${r.ma}:${ngayChuoi(r.ngay_mua) ?? ngay}`,
      loai: "mua",
      ma: r.ma,
      tieu_de: `${r.loai_vao === "MUA LAI" ? "MUA LẠI" : "MUA"} ${r.ma}`,
      noi_dung: noi(
        `Giá ${soVN(r.gia)}`,
        coSo(r.stop_loss) && `cắt lỗ ${soVN(r.stop_loss)}`,
        coSo(r.tp1) && `TP1 ${soVN(r.tp1)}${coSo(r.tp2) ? ` / TP2 ${soVN(r.tp2)}` : ""}`,
        r.giai_ngan === "MOT PHAN" && "giải ngân 1 phần"
      ),
      duong_dan: `/ma/${r.ma}`,
      ngay,
    });
  }
  for (const b of ban) {
    ra.push({
      khoa: `ban:${b.khoa}:${ngay}`,
      loai: "ban",
      ma: b.ma,
      tieu_de: `BÁN ${b.ma}${b.laMuaMoi ? " (lệnh mua mới)" : ""}`,
      noi_dung: noi(b.lyDo, coSo(b.giaBan) && `giá ${soVN(b.giaBan)}`, b.ketQuaPct != null && `cả lệnh ${pctVN(b.ketQuaPct, 2)}`),
      duong_dan: `/ma/${b.ma}`,
      ngay,
    });
  }
  for (const l of muaMoi) {
    ra.push({
      khoa: `mua_moi:${l.khoa_lenh ?? `${l.ma}:${ngay}`}`,
      loai: "mua_moi",
      ma: l.ma,
      tieu_de: `MUA MỚI ${l.ma}`,
      noi_dung: noi(`Giá ${soVN(l.gia_mua ?? l.gia)}`, coSo(l.stop_loss) && `cắt lỗ ${soVN(l.stop_loss)}`, coSo(l.tp1) && `TP1 ${soVN(l.tp1)}`),
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
        khoa: `giam_bot:${x.ma}:${ngay}`,
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
    noi_dung: `${nd.ten || "Chưa đặt tên"} · ${nd.sdt} — đang chờ duyệt`,
    duong_dan: "/quan-tri",
    ngay: null,
  };
}

// Loc cac thong bao 1 tai khoan duoc nhan VE MAY: dang ky moi -> chi quan tri; tin hieu -> tai khoan da duyet (hoac quan tri), theo pham vi da chon.
export function locChoNguoiDung(ds, { laAdmin = false, daDuyet = false, phamVi = "tat_ca", maTheoDoi = [] } = {}) {
  const theoDoi = new Set(maTheoDoi);
  return ds.filter((t) => {
    if (t.chi_admin || t.loai === "dang_ky") return laAdmin;
    if (!daDuyet && !laAdmin) return false;
    if (phamVi === "khong") return false;
    if (phamVi === "danh_muc") return theoDoi.has(t.ma);
    return true;
  });
}

const THU_TU = ["dang_ky", "ban", "ban_bot", "giam_bot", "mua", "mua_moi"];

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
