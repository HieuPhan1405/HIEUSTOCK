// Hang so + ham dinh dang dung chung cho ca 3 trang (tong quan, lenh mo, chi
// tiet ma). Du lieu that tu AmiBroker co the thieu (ma moi len san, chua du
// du lieu lich su de tinh chi bao) - moi ham phai an toan voi null/undefined/NaN.

import { TY_LE_CHOT, TY_LE_CHOT_CU, CHUOI_TY_LE_CHOT } from "@/lib/tyLeChot";

export const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
`;

export function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  // Gia CP VN co buoc gia le (0.01-0.1 nghin dong) - lam tron ve so nguyen
  // (Math.round) xoa mat phan thap phan, khien Gia mua/Gia hien tai gan nhau
  // (vd 14.05 va 14.6) hien ra giong het nhau la "14"/"15". Giu toi da 2 chu
  // so thap phan, bo so 0 thua (243 -> "243", khong phai "243.00").
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(n));
}

// Khoi luong TB20 (co phieu) - dung SO CO PHIEU truc tiep (khop dung cach
// he thong xet "an toan thanh khoan" trong AFL: MA(V,20) >= 100.000 cp),
// thay vi gia tri giao dich quy doi ra tien (de nham lan don vi truoc day).
export function chuoiKhoiLuong(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K cp`;
  return `${n.toFixed(0)} cp`;
}

// Trang thai GIAI NGAN cua lenh dang mo (cot giai_ngan tu AFL): khi RS so voi
// VN-Index <= 0 van bao MUA nhung chi giai ngan 1 phan, cho phien sau bo sung.
// Tra null neu khong can hien gi (giai ngan du / khong giu lenh).
export function nhanGiaiNgan(row) {
  switch (row?.giai_ngan) {
    case "MOT PHAN":
      return {
        nhan: "Giải ngân 1 phần",
        mau: "#FBBF24",
        moTa: "Sức mạnh so với thị trường còn yếu nên chỉ giải ngân khoảng 1/3–1/2 tỷ trọng dự kiến. Chờ các phiên sau: khi sức mạnh so với VN-Index chuyển dương, lệnh đang có lãi và điểm vẫn trong vùng mua thì bổ sung nốt phần còn lại.",
      };
    case "BO SUNG":
      return { nhan: "Bổ sung", mau: "#22D3EE", moTa: "Đủ điều kiện giải ngân nốt phần còn lại của lệnh đã mua thăm dò." };
    case "GIU 1 PHAN":
      return { nhan: "Giữ 1 phần", mau: "#8B8B99", moTa: "Đã hết thời hạn chờ bổ sung — giữ nguyên tỷ trọng nhỏ, không mua thêm." };
    default:
      return null;
  }
}

// Ty dong (von hoa, GTGD): >= 100 lam tron ve so nguyen, nho hon giu 1 chu so
// thap phan (GTGD 10.4 ty khac 10 ty khi so voi nguong "tren 10 ty").
export function fmtTy(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: v >= 100 ? 0 : 1 }).format(v);
}

// TIEU CHI CHON CO PHIEU UU TIEN (bo loc "Chi ma uu tien"): gia tren 10.000d,
// von hoa tu 3.000 ty, khoi luong tu 500.000 cp/phien va GTGD tren 10 ty/phien.
// Khoi luong/GTGD do bang TRUNG BINH 20 PHIEN (on dinh hon 1 phien le). Chi la
// bo loc hien thi tren web - khong anh huong tin hieu MUA/BAN trong AFL.
export const CHUAN_UU_TIEN = {
  giaToiThieu: 10, // nghin dong, nghiem ngat: gia > 10
  vonHoaTyToiThieu: 3000,
  klTB20ToiThieu: 500000,
  gtgdTyToiThieu: 10, // nghiem ngat: GTGD > 10
};

export function kiemTraChuanUuTien(row) {
  const c = CHUAN_UU_TIEN;
  const tieuChi = [
    { khoa: "gia", nhan: "Giá > 10.000đ", dat: row.gia != null && row.gia > c.giaToiThieu },
    { khoa: "von_hoa", nhan: "Vốn hoá ≥ 3.000 tỷ", dat: row.von_hoa_ty != null && row.von_hoa_ty >= c.vonHoaTyToiThieu },
    { khoa: "kl", nhan: "KL ≥ 500.000 cp/phiên", dat: row.khoi_luong_tb20 != null && row.khoi_luong_tb20 >= c.klTB20ToiThieu },
    { khoa: "gtgd", nhan: "GTGD > 10 tỷ/phiên", dat: row.gtgd_tb20 != null && row.gtgd_tb20 > c.gtgdTyToiThieu },
  ];
  return { dat: tieuChi.every((t) => t.dat), tieuChi };
}

export function datChuanUuTien(row) {
  return kiemTraChuanUuTien(row).dat;
}

// Lenh dang mo = ma vua bao MUA hoac dang NAM GIU. Cac cot lien quan vi the
// (gia mua, Stop-loss, TP...) chi co nghia voi cac ma nay - ma khac AFL van
// xuat gia tri cua lan mua GAN NHAT, hien ra se gay hieu nham.
// Nhan "Mua lại": lenh MUA phat sinh tu cong tac MUA LAI trong AFL (gia hoi ve ho tro trong
// xu huong tang, sau khi lenh truoc da dong khong lo) - khac Buy thuong (cot loai_vao).
export function nhanLoaiVao(row) {
  if (row?.loai_vao !== "MUA LAI") return null;
  return {
    nhan: "Mua lại",
    mau: "#22D3EE",
    moTa: "Lệnh mua lại: giá hồi về hỗ trợ trong xu hướng tăng, sau khi lệnh trước đã đóng không lỗ. Có Stop-loss riêng dưới hỗ trợ.",
  };
}

export function laDangGiu(row) {
  return row?.tin === "MUA" || row?.tin === "NAM GIU";
}

// Thoi diem web ghi nhan gia mua (lan dau ma chuyen sang MUA), dang "10:45 19/09"
// theo gio Viet Nam. Chuoi rong neu chua co ghi nhan.
export function gioGhiNhan(row) {
  if (!row?.thoi_diem_vao_web) return "";
  return new Date(row.thoi_diem_vao_web).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

// MOC KICH HOAT (cot gia_kich_hoat/moc_kich_hoat tu AFL): muc gia chinh vua bi
// vuot o phien diem chuyen sang vung MUA (may / duong can bang dai han; neu phien do diem
// tang nho dong tien-dong luong thi = gia dong cua). Gia mua that tren he
// thong la GIA DONG CUA phien co tin hieu, nen thuong cao hon moc nay - phan
// chenh chinh la "muc do da doi gia chay" so voi luc chuyen mua.
const NHAN_MOC = {
  MAY: "Vượt mây",
  "CAN BANG": "Vượt đường cân bằng dài hạn",
  "MAY+CAN BANG": "Vượt mây + đường cân bằng dài hạn",
  GIA: "Điểm tăng nhờ dòng tiền/động lượng (mốc = giá đóng cửa)",
};

export function mocKichHoat(row) {
  if (!laDangGiu(row) || row.gia_kich_hoat == null || !(row.gia_kich_hoat > 0)) return null;
  const chenhPct = row.gia_mua > 0 ? (row.gia_mua / row.gia_kich_hoat - 1) * 100 : null;
  return { gia: row.gia_kich_hoat, nhan: NHAN_MOC[row.moc_kich_hoat] || "Mốc chuyển mua", chenhPct };
}

// Nguong diem VAO lenh (Mua) - dung DUNG EntryTh trong AFL (Param "Nguong diem
// VAO lenh (Mua)", mac dinh 1.25). Doi thong so trong AmiBroker thi bao lai de
// cap nhat cho khop.
export const NGUONG_DIEM_MUA = 1.25;

// MOC TINH DIEM (+) KE TIEP (cot moc_gia/moc_loai/moc_cach_pct/diem_neu_vuot tu
// AFL): muc gia GAN NHAT phia tren gia hien tai ma neu gia VUOT QUA thi duoc
// cong diem (day/dinh may, duong can bang dai han), khoang cach toi moc (%) va diem uoc tinh
// sau khi vuot. Dung cho bo loc "ma theo doi" (sap cham moc).
const NHAN_LOAI_MOC = { MAY: "Mây", "CAN BANG": "Đường cân bằng dài hạn" };

export function mocTiepTheo(row) {
  if (!(row?.moc_gia > 0) || row.moc_cach_pct == null || !row.moc_loai) return null;
  return {
    gia: row.moc_gia,
    loai: NHAN_LOAI_MOC[row.moc_loai] || row.moc_loai,
    cachPct: row.moc_cach_pct,
    diemNeuVuot: row.diem_neu_vuot,
  };
}

// Ma THEO DOI = chua co lenh (TRUNG LAP), gia dang cach 1 moc tinh diem (+)
// khong qua bienPct %, va NEU vuot moc do thi diem uoc tinh dat nguong MUA.
// Ma da DAT DIEM MUA nhung dang DOI PHIEN SAU (phien dau tren nguong chua du volume xac nhan - AFL cot cho_phien_sau).
// null/undefined khi chua Explore lai voi AFL moi (chua co cot).
export function laChoPhienSau(row) {
  return row?.tin === "TRUNG LAP" && row?.cho_phien_sau === true;
}

export function sapChamMoc(row, bienPct) {
  const m = mocTiepTheo(row);
  if (!m || row.tin !== "TRUNG LAP") return false;
  return m.cachPct <= bienPct && m.diemNeuVuot != null && m.diemNeuVuot >= NGUONG_DIEM_MUA;
}

// VUNG MUA / VUNG CAT LO / VUNG CHOT LOI cua lenh dang giu - thay cho tung diem don le:
//  - Vung mua: tu MOC CHUYEN MUA (neu co, khong cao hon gia mua) den gia mua + tranDuoiPct%
//    (mua cao hon nua la dui gia). Chua co moc thi bat dau tu chinh gia mua.
//  - Vung cat lo: tu Stop-loss len toi duong ho tro GAN NHAT nam giua Stop-loss va gia mua
//    (Kijun / duong can bang dai han), rong toi thieu rongSLToiThieuPct%. Cham day vung = cat.
//  - Vung chot loi: GOM TP1-TP2 thanh "vung gan" (2 moc nay thuong sat nhau, gia di qua trong
//    vai phien) + TP3 la "moc xa"; ty le chot 30/30/40 (TP1/TP2/TP3 - xem lib/tyLeChot.js): cham TP3 la KET THUC lenh (khong con
//    phan giu chay); sau TP2 neu dong cua < Kijun truoc khi toi TP3 thi ban not phan con lai.
//    Sau khi cham TP2, goi y doi Stop-loss phan con lai ve gia mua (hoa von).
//  - Khi Stop-loss luc mua da cach gia hien tai qua xa (lenh lai lon) thi chi con mang tinh
//    tham khao - thoat that van theo tin hieu BAN cua he thong.
// Tra null neu ma khong dang giu. Hang so o day chinh duoc neu can doi.
export const VUNG = { tranDuoiPct: 2, rongSLToiThieuPct: 1, slXaPct: 15, tyLeChot: TY_LE_CHOT };

export function tinhVungLenh(row) {
  if (!laDangGiu(row) || !(row.gia_mua > 0)) return null;
  const giaMua = Number(row.gia_mua);
  const gia = Number(row.gia);

  const moc = row.gia_kich_hoat > 0 && row.gia_kich_hoat <= giaMua ? Number(row.gia_kich_hoat) : null;
  const mua = { tu: moc ?? giaMua, den: giaMua * (1 + VUNG.tranDuoiPct / 100), coMoc: moc != null };
  mua.trangThai = gia < mua.tu ? "duoi" : gia > mua.den ? "tren" : "trong";

  let sl = null;
  const stop = Number(row.stop_loss);
  if (stop > 0 && stop < giaMua) {
    const hoTro = [row.kijun, row.gg_top, row.gg_bot].map(Number).filter((v) => Number.isFinite(v) && v > stop && v < giaMua);
    const gan = hoTro.length ? Math.min(...hoTro) : null;
    const den = Math.min(giaMua, Math.max(gan ?? 0, stop * (1 + VUNG.rongSLToiThieuPct / 100)));
    sl = {
      tu: stop,
      den,
      hoTro: gan,
      trangThai: gia <= stop ? "cham" : gia <= den ? "trong" : "tren",
      // Stop-loss luc mua cach gia hien tai qua xa -> khong con y nghia bao ve lai.
      xa: gia > 0 && (gia - den) / gia > VUNG.slXaPct / 100,
      canhBao: row.kijun > 0 && row.kijun < gia ? Number(row.kijun) : null,
    };
  }

  let tp = null;
  if (row.tp1 > 0 && row.tp3 > 0) {
    const daCham = { TP1: 1, TP2: 2, TP3: 3 }[chamTPCaoNhat(row)] ?? 0;
    const tp2 = row.tp2 > 0 ? Number(row.tp2) : Number(row.tp1);
    tp = {
      tu: Number(row.tp1),
      den: Number(row.tp3),
      giua: row.tp2 > 0 ? Number(row.tp2) : null,
      gan: { tu: Number(row.tp1), den: tp2 },
      xa: Number(row.tp3),
      daCham,
    };
  }
  // Sau khi cham TP2: goi y doi Stop-loss phan con lai ve gia mua (chi hien thi, khong doi tin hieu).
  const hoaVon = tp && tp.daCham >= 2 ? giaMua : null;
  return { mua, sl, tp, hoaVon };
}

// LENH CU (cach 30/30/25/15 truoc 2026-09-25) SAU KHI CHOT DU TP3 (chot 85%, con 15% giu chay): ma coi nhu can TIM DIEM MUA MOI. Cach quan ly moi
// khong con trang thai nay (cham TP3 la dong lenh) - ham chi con tra ve du lieu cho cac lenh cu dang giu phan chay. Tach ro 2 thu:
//  - viTheCu: phan con giu (gia mua CU, lai/lo tu gia do);
//  - muaMoi: vung mua moi THAM KHAO = tu ho tro gan nhat BEN DUOI gia (Kijun / duong can bang dai han) den ho tro + tranDuoiPct%.
// Day chi la goi y hien thi tu du lieu web, CHUA phai tin hieu MUA cua he thong (AFL chua phat lenh mua thu 2 khi dang giu).
// Tra null neu ma khong dang giu hoac chua cham TP3.
export function tinhSauTP3(row) {
  if (!laDangGiu(row) || row.tp_da_cham !== "TP3" || !(row.gia_mua > 0)) return null;
  const gia = Number(row.gia);
  const cacHoTro = [
    [row.kijun, "Kijun"],
    [row.gg_top, "đường cân bằng dài hạn (trên)"],
    [row.gg_bot, "đường cân bằng dài hạn (dưới)"],
  ]
    .map(([v, ten]) => [Number(v), ten])
    .filter(([v]) => Number.isFinite(v) && v > 0 && v < gia);
  const ht = cacHoTro.length ? cacHoTro.reduce((a, b) => (b[0] > a[0] ? b : a)) : null;
  const muaMoi = ht
    ? {
        tu: ht[0],
        den: ht[0] * (1 + VUNG.tranDuoiPct / 100),
        hoTro: ht[1],
        cachPct: (gia / ht[0] - 1) * 100,
        trangThai: gia <= ht[0] * (1 + VUNG.tranDuoiPct / 100) ? "trong" : "cho",
      }
    : null;
  // Lenh MUA MOI (vong 2) da duoc AFL bao: co gia mua / Stop-loss / TP RIENG, tach khoi vi the cu.
  const daVao = row.dang_giu_moi === true && row.gia_mua_moi > 0;
  const lenhMoi = daVao
    ? {
        giaMua: Number(row.gia_mua_moi),
        stop: row.stop_moi > 0 ? Number(row.stop_moi) : null,
        tp1: row.tp1_moi > 0 ? Number(row.tp1_moi) : null,
        tp2: row.tp2_moi > 0 ? Number(row.tp2_moi) : null,
        tp3: row.tp3_moi > 0 ? Number(row.tp3_moi) : null,
        laiLoPct: gia > 0 ? (gia / Number(row.gia_mua_moi) - 1) * 100 : null,
        ngay: row.ngay_mua_moi ?? null,
      }
    : null;
  const daDongMoi = !daVao && row.gia_mua_moi > 0; // da mua moi roi va da dong (cham Stop-loss rieng), khong mua them nua tren lenh goc nay
  return {
    viTheCu: { giaMua: Number(row.gia_mua), laiLoPct: row.lai_lo_pct, tyLeConLai: TY_LE_CHOT_CU.giu },
    muaMoi,
    diemDu: row.diem >= NGUONG_DIEM_MUA,
    lenhMoi,
    daDongMoi,
  };
}

// MUA THEM GIUA CHUNG (vi the doc lap voi vong 2, mo TRUOC khi cham du TP3) - bo sung 2026-09-23.
// CHI hien khi CO DU LIEU THAT (dang giu vi the phu nay) - KHONG doan "goi y vung mua" nhu
// tinhSauTP3().muaMoi, vi tinh nang nay MAC DINH TAT trong engine (batMuaThemGiuaChung=false):
// hien goi y cho ma chua thuc su duoc tinh se gay hieu lam. Tra null neu khong dang giu.
export function tinhMuaGiuaChung(row) {
  if (!laDangGiu(row) || row.dang_giu_giua !== true || !(row.gia_mua_giua > 0)) return null;
  const gia = Number(row.gia);
  return {
    giaMua: Number(row.gia_mua_giua),
    stop: row.stop_giua > 0 ? Number(row.stop_giua) : null,
    tp1: row.tp1_giua > 0 ? Number(row.tp1_giua) : null,
    tp2: row.tp2_giua > 0 ? Number(row.tp2_giua) : null,
    tp3: row.tp3_giua > 0 ? Number(row.tp3_giua) : null,
    laiLoPct: gia > 0 ? (gia / Number(row.gia_mua_giua) - 1) * 100 : null,
    ngay: row.ngay_mua_giua ?? null,
  };
}

// LY DO BAN o phien BAN that su (cot ly_do_ban do AFL/engine xuat, chi co nghia khi tin = BAN): 5 = cham TP3 (chot du 30/30/40 = KET THUC lenh),
// 4 = thoat theo Kijun sau TP2, 3 = bao ve lai, 2 = cat lo (Stop-loss), 1 = diem so tut duoi nguong (tin hieu BAN thuong). Tra null neu khong phai ma dang BAN
// hoac chua co du lieu (CSV cu).
export function nhanLyDoBan(row) {
  if (row?.tin !== "BAN") return null;
  return (
    {
      5: { nhan: "Chạm TP3 · kết thúc lệnh", mau: "#B7A4FF", moTa: `Giá chạm TP3: chốt nốt phần cuối, đủ ${CHUOI_TY_LE_CHOT} (TP1/TP2/TP3) — lệnh kết thúc.` },
      4: { nhan: "Thoát theo Kijun (sau TP2)", mau: "#F97316", moTa: "Đã chốt TP1, TP2 rồi giá đóng cửa xuống dưới Kijun trước khi tới TP3 nên bán nốt phần còn lại." },
      3: { nhan: "Bảo vệ lãi", mau: "#A78BFA", moTa: "Giá quay về mức Stop-loss đã dời lên (hòa vốn) sau khi chạm mốc chốt lời nên bán ngay." },
      2: { nhan: "Cắt lỗ (chạm Stop-loss)", mau: "#EF4444", moTa: "Giá chạm Stop-loss của lệnh." },
      1: { nhan: "Điểm số tụt dưới ngưỡng bán", mau: "#EF4444", moTa: "Tín hiệu BÁN theo điểm hợp lưu (3 phiên xác nhận)." },
    }[Number(row.ly_do_ban)] ?? null
  );
}

// Nhan "Mua thêm (giữa chừng)" khi AFL dang giu vi the phu nay.
export function nhanMuaGiuaChung(row) {
  if (row?.dang_giu_giua !== true) return null;
  return {
    nhan: "Mua thêm giữa chừng",
    mau: "#A78BFA",
    moTa: "Lệnh mua thêm khi giá hồi về hỗ trợ trong lúc đang giữ lệnh gốc (lệnh gốc chưa chạm TP3), có giá mua, Stop-loss và chốt lời riêng, tách khỏi lệnh gốc.",
  };
}

// Nhan "Mua thêm" khi AFL dang giu lenh MUA MOI sau TP3.
export function nhanMuaThem(row) {
  if (row?.dang_giu_moi !== true) return null;
  return {
    nhan: "Mua thêm sau TP3",
    mau: "#22D3EE",
    moTa: "Lệnh mua mới sau khi lệnh gốc đã chốt đủ TP3, có giá mua, Stop-loss và chốt lời riêng, tách khỏi vị thế cũ.",
  };
}

// Nhan "Bảo vệ lãi" khi AFL da doi Stop-loss len cao hon (hoa von sau TP2, hoac rong tu dinh sau TP1).
export function nhanBaoVeLai(row) {
  if (!row?.bao_ve_lai_kich_hoat) return null;
  return {
    nhan: "Bảo vệ lãi",
    mau: "#A78BFA",
    moTa: `Đã từng chạm mốc chốt lời nên Stop-loss được dời lên ${fmt(row.stop_loss)} (cao hơn Stop-loss ban đầu) — chạm là bán ngay, không chờ điểm âm.`,
  };
}

// "25 – 25.5" (hoac 1 so neu 2 dau bang nhau sau khi lam tron).
export function chuoiVung(tu, den) {
  if (tu == null || den == null) return "—";
  return fmt(tu) === fmt(den) ? fmt(tu) : `${fmt(tu)} – ${fmt(den)}`;
}

export function pct(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  const v = Number(Number(n).toFixed(digits));
  return `${v > 0 ? "+" : ""}${v}%`;
}

export function so1So(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(1);
}

export function soAn(n, chuSo = 2) {
  return n === null || n === undefined || Number.isNaN(Number(n)) ? "—" : Number(n).toFixed(chuSo);
}

// Phan loai xu huong theo TrendScore (da tinh san trong AFL) - dung chung
// cho trang chu (do rong thi truong) va Bo loc co phieu.
export function phanLoaiXuHuong(row) {
  if (row.trend === null || row.trend === undefined) return "sideway";
  if (row.trend > 0.5) return "xanh";
  if (row.trend < -0.5) return "do";
  return "sideway";
}

// Muc TP CAO NHAT tung cham toi trong SUOT qua trinh giu (khong chi gia
// HIEN TAI) - uu tien doc thang cot tp_da_cham (AFL tinh bang HighestSince,
// nho ca nhung lan da cham roi tut xuong lai). Neu ma chua duoc Explore lai
// voi ban AFL moi (tp_da_cham con null/thieu) thi tam thoi fallback ve cach
// cu (so gia HIEN TAI voi TP) de khong mat trang tinh nang trong luc cho
// nguoi dung upload lai - se tu dong het fallback khi du lieu duoc cap nhat.
export function chamTPCaoNhat(row) {
  if (row.tp_da_cham) return row.tp_da_cham;
  if (row.gia == null) return null;
  if (row.tp3 != null && row.gia >= row.tp3) return "TP3";
  if (row.tp2 != null && row.gia >= row.tp2) return "TP2";
  if (row.tp1 != null && row.gia >= row.tp1) return "TP1";
  return null;
}

// % lai da THUC SU co the chot duoc tai muc TP CAO NHAT da cham (so voi gia
// mua) - KHAC lai_lo_pct (tinh theo gia HIEN TAI, co the da doi tiep sau khi
// cham TP). Null neu chua cham TP nao hoac thieu du lieu gia mua.
export function pctChotLoi(row) {
  const tp = chamTPCaoNhat(row);
  if (!tp || row.gia_mua == null) return null;
  const giaTP = row[tp.toLowerCase()];
  if (giaTP == null) return null;
  return (giaTP / row.gia_mua - 1) * 100;
}

// Muc max ly thuyet cua tung thanh phan diem, lay dung theo cong thuc trong
// amibroker/7_Export_LenWeb.afl.
export const TREND_MAX = 3.0; // IIf(...,1) + IIf(...,1) + IIf(...,0.5) + IIf(...,0.5)
export const MOM_MAX = 0.5;
export const DT_MAX = 1.0; // gan dung, MFScore toi da ly thuyet la 1.0 (min -0.8)
export const RS_MAX = 20; // % so voi VNI trong 20 phien, dung lam thang tham khao

// Thoi diem cap nhat MOI NHAT trong danh sach ma (max cap_nhat_luc) - dung cho nhan "Du lieu cap nhat luc ...".
export function capNhatMoiNhat(ds) {
  let max = null;
  for (const r of ds || []) {
    if (!r?.cap_nhat_luc) continue;
    const t = new Date(r.cap_nhat_luc).getTime();
    if (!Number.isNaN(t) && (max === null || t > max)) max = t;
  }
  return max === null ? null : new Date(max).toISOString();
}

// Du lieu cu hon ~36 gio (qua 1 ngay giao dich) thi nhan cap nhat chuyen sang canh bao mau vang.
export function duLieuDaCu(luc, gioToiDa = 36) {
  const t = new Date(luc).getTime();
  return !Number.isNaN(t) && (Date.now() - t) / 3600e3 > gioToiDa;
}
