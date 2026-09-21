// Danh muc CAC COT CHI SO dung chung cho bang Bo loc co phieu va bang So lenh
// dang mo - moi chi so dinh nghia 1 lan (nhan, cach sap xep, cach hien thi).
// Hai bang tu chon thu tu + cot mac dinh (xem BangBoLoc.js / BangLenhMo.js) va
// cho nguoi dung bat/tat cot qua ChonCotHienThi.
//
// Cot co "nhom" se xuat hien trong hop "Cot hien thi". Cot "ma" va "tin" (co
// logic rieng: nut Tham gia, khoa Tin hieu...) do tung bang tu dinh nghia.
import {
  fmt,
  fmtTy,
  pct,
  so1So,
  soAn,
  chuoiKhoiLuong,
  chamTPCaoNhat,
  laDangGiu,
  mocKichHoat,
  mocTiepTheo,
  gioGhiNhan,
  tinhVungLenh,
  chuoiVung,
  VUNG,
  kiemTraChuanUuTien,
  NGUONG_DIEM_MUA,
  tinhSauTP3,
} from "@/components/dungChung";

const MUTED = "#8B8B99";
const XANH = "#22C55E";
const DO = "#EF4444";
const VANG = "#FBBF24";

export const NHOM_COT = ["Cơ bản", "Điểm & chỉ báo", "Thanh khoản & vốn hoá", "Vị thế đang giữ", "Giá mục tiêu & hỗ trợ"];

const Trong = <span style={{ color: MUTED }}>—</span>;

function formatNgay(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("vi-VN");
}

// Chot loi - muc TP CAO NHAT tung cham toi TRONG SUOT qua trinh giu (dung
// chamTPCaoNhat() dung chung, KHONG chi so gia hien tai - gia co the da
// cham TP roi tut xuong lai, van phai tinh la "da cham").
export function tinhChotLoi(row) {
  if (row.gia == null && !row.tp_da_cham) return { nhan: "—", mau: MUTED, hang: -1 };
  const tp = chamTPCaoNhat(row);
  if (tp === "TP3") return { nhan: "Đã chạm TP3", mau: XANH, hang: 3 };
  if (tp === "TP2") return { nhan: "Đã chạm TP2", mau: XANH, hang: 2 };
  if (tp === "TP1") return { nhan: "Đã chạm TP1", mau: VANG, hang: 1 };
  return { nhan: "Chưa chạm", mau: MUTED, hang: 0 };
}

const mauCap = (v) => (v >= 70 ? XANH : v >= 40 ? VANG : "#A6A6B3");

// Cot chi co nghia voi lenh dang giu: ma khac -> "—" va sap xep xuong cuoi.
const chiKhiGiu = (khoa) => (r) => (laDangGiu(r) ? r[khoa] : null);

function cotGiaMucTieu(khoa, nhan, hangTP) {
  return {
    nhan,
    nhom: "Giá mục tiêu & hỗ trợ",
    canPhai: true,
    lay: chiKhiGiu(khoa),
    hien: (r) => {
      if (!laDangGiu(r) || r[khoa] == null) return Trong;
      const daCham = hangTP && (tinhChotLoi(r).hang ?? 0) >= hangTP;
      return (
        <span style={{ color: daCham ? XANH : undefined }} title={daCham ? "Giá đã chạm mức này trong lúc giữ" : undefined}>
          {daCham ? "✓ " : ""}
          {fmt(r[khoa])}
        </span>
      );
    },
  };
}

function cotMucGia(khoa, nhan) {
  return { nhan, nhom: "Giá mục tiêu & hỗ trợ", canPhai: true, lay: (r) => r[khoa], hien: (r) => fmt(r[khoa]) };
}

export const CAC_COT = {
  // --- Co ban
  san: {
    nhan: "Sàn",
    nhom: "Cơ bản",
    canPhai: false,
    lay: (r) => r.san || "HOSE",
    hien: (r) => (
      <span className="text-xs" style={{ color: MUTED }}>
        {r.san || "HOSE"}
      </span>
    ),
  },
  von_hoa: {
    nhan: "Nhóm vốn hoá",
    nhom: "Cơ bản",
    canPhai: false,
    lay: (r) => r.von_hoa,
    hien: (r) => (
      <span className="text-xs" style={{ color: MUTED }}>
        {r.von_hoa || "—"}
      </span>
    ),
  },
  nganh: {
    nhan: "Ngành",
    nhom: "Cơ bản",
    canPhai: false,
    lay: (r) => r.nganh,
    // Nhan co dau do tung bang tu map (NGANH_NHAN) - o day hien nguyen gia tri.
    hien: (r, ctx) => (
      <span className="text-xs whitespace-nowrap" style={{ color: MUTED }}>
        {ctx?.nhanNganh?.[r.nganh] || r.nganh || "—"}
      </span>
    ),
  },
  gia: { nhan: "Giá", nhom: "Cơ bản", canPhai: true, lay: (r) => r.gia, hien: (r) => fmt(r.gia) },
  doi: {
    nhan: "%Hôm nay",
    nhom: "Cơ bản",
    canPhai: true,
    lay: (r) => r.doi,
    hien: (r) => <span style={{ color: r.doi >= 0 ? XANH : DO }}>{pct(r.doi, 2)}</span>,
  },

  // --- Diem & chi bao
  diem: {
    nhan: "Điểm",
    nhom: "Điểm & chỉ báo",
    canPhai: true,
    lay: (r) => r.diem,
    hien: (r) => (
      <span className="font-bold" style={{ color: r.diem >= 0 ? XANH : DO }}>
        {r.diem?.toFixed(2) ?? "—"}
      </span>
    ),
  },
  diem_rank: {
    nhan: "Rank",
    nhom: "Điểm & chỉ báo",
    canPhai: true,
    lay: (r) => r.diem_rank,
    hien: (r) => (r.diem_rank == null ? Trong : <span style={{ color: mauCap(r.diem_rank) }}>{soAn(r.diem_rank, 0)}</span>),
  },
  diem_confidence: {
    nhan: "Confidence",
    nhom: "Điểm & chỉ báo",
    canPhai: true,
    lay: (r) => r.diem_confidence,
    hien: (r) => (r.diem_confidence == null ? Trong : <span style={{ color: mauCap(r.diem_confidence) }}>{soAn(r.diem_confidence, 0)}</span>),
  },
  moc_tiep_theo: {
    nhan: "Mốc cần vượt",
    nhom: "Điểm & chỉ báo",
    canPhai: true,
    lay: (r) => r.moc_cach_pct,
    hien: (r) => {
      const m = mocTiepTheo(r);
      if (!m) return Trong;
      return (
        <div className="flex flex-col items-end leading-tight" title={`Vượt ${m.loai} thì được cộng điểm Xu hướng`}>
          <span>{fmt(m.gia)}</span>
          <span className="text-[10px]" style={{ color: m.cachPct <= 3 ? VANG : MUTED }}>
            {m.loai} · cách {soAn(m.cachPct, 1)}%
          </span>
        </div>
      );
    },
  },
  diem_neu_vuot: {
    nhan: "Điểm nếu vượt",
    nhom: "Điểm & chỉ báo",
    canPhai: true,
    lay: (r) => r.diem_neu_vuot,
    hien: (r) =>
      r.diem_neu_vuot == null ? (
        Trong
      ) : (
        <span style={{ color: r.diem_neu_vuot >= NGUONG_DIEM_MUA ? XANH : undefined }} title="Ước tính: mỗi mốc vượt được cộng khoảng +1.5 điểm">
          {soAn(r.diem_neu_vuot, 2)}
        </span>
      ),
  },
  trend: { nhan: "Xu hướng", nhom: "Điểm & chỉ báo", canPhai: true, lay: (r) => r.trend, hien: (r) => so1So(r.trend) },
  dt: { nhan: "Dòng tiền", nhom: "Điểm & chỉ báo", canPhai: true, lay: (r) => r.dt, hien: (r) => soAn(r.dt, 1) },
  mom: { nhan: "Động lượng", nhom: "Điểm & chỉ báo", canPhai: true, lay: (r) => r.mom, hien: (r) => soAn(r.mom, 1) },
  adx: { nhan: "ADX", nhom: "Điểm & chỉ báo", canPhai: true, lay: (r) => r.adx, hien: (r) => so1So(r.adx) },
  rs_vni: { nhan: "RS/VNI", nhom: "Điểm & chỉ báo", canPhai: true, lay: (r) => r.rs_vni, hien: (r) => pct(r.rs_vni, 1) },
  sanyaku: {
    nhan: "Độ tin cậy",
    nhom: "Điểm & chỉ báo",
    canPhai: true,
    lay: (r) => r.sanyaku,
    hien: (r) => (r.sanyaku == null ? Trong : <span style={{ color: r.sanyaku >= 2 ? XANH : undefined }}>{soAn(r.sanyaku, 0)}/3</span>),
  },
  breadth_nganh: {
    nhan: "Độ rộng ngành",
    nhom: "Điểm & chỉ báo",
    canPhai: true,
    lay: (r) => r.breadth_nganh,
    hien: (r) => (r.breadth_nganh == null ? Trong : `${soAn(r.breadth_nganh, 0)}%`),
  },

  // --- Thanh khoan & von hoa
  von_hoa_ty: {
    nhan: "Vốn hoá (tỷ)",
    nhom: "Thanh khoản & vốn hoá",
    canPhai: true,
    lay: (r) => r.von_hoa_ty,
    hien: (r) => fmtTy(r.von_hoa_ty),
  },
  khoi_luong_tb20: {
    nhan: "KL TB20",
    nhom: "Thanh khoản & vốn hoá",
    canPhai: true,
    lay: (r) => r.khoi_luong_tb20,
    hien: (r) => (
      <span className="text-xs" style={{ color: MUTED }}>
        {chuoiKhoiLuong(r.khoi_luong_tb20)}
      </span>
    ),
  },
  gtgd_tb20: {
    nhan: "GTGD TB20 (tỷ)",
    nhom: "Thanh khoản & vốn hoá",
    canPhai: true,
    lay: (r) => r.gtgd_tb20,
    hien: (r) => fmtTy(r.gtgd_tb20),
  },
  uu_tien: {
    nhan: "Chuẩn ưu tiên",
    nhom: "Thanh khoản & vốn hoá",
    canPhai: true,
    lay: (r) => kiemTraChuanUuTien(r).tieuChi.filter((t) => t.dat).length,
    hien: (r) => {
      const kq = kiemTraChuanUuTien(r);
      if (kq.dat) {
        return (
          <span className="font-bold" style={{ color: XANH }} title="Đạt cả 4 tiêu chí ưu tiên">
            ✓ Đạt
          </span>
        );
      }
      const chuaDat = kq.tieuChi.filter((t) => !t.dat).map((t) => t.nhan).join(" · ");
      return (
        <span style={{ color: MUTED }} title={`Chưa đạt: ${chuaDat}`}>
          {kq.tieuChi.filter((t) => t.dat).length}/4
        </span>
      );
    },
  },

  // --- Vi the dang giu
  ngay_mua: {
    nhan: "Ngày mua",
    nhom: "Vị thế đang giữ",
    canPhai: false,
    lay: (r) => (laDangGiu(r) && r.ngay_mua ? new Date(r.ngay_mua).getTime() : null),
    hien: (r) => <span style={{ color: MUTED }}>{laDangGiu(r) ? formatNgay(r.ngay_mua) : "—"}</span>,
  },
  gia_mua: {
    nhan: "Giá mua",
    nhom: "Vị thế đang giữ",
    canPhai: true,
    lay: chiKhiGiu("gia_mua"),
    hien: (r) => {
      if (!laDangGiu(r)) return Trong;
      if (!r.gia_mua_ghi_nhan) return fmt(r.gia_mua);
      return (
        <span title={`Giá ghi nhận lúc mã lần đầu chuyển sang MUA (${gioGhiNhan(r)}), không đổi theo các lần cập nhật sau. Giá AmiBroker: ${fmt(r.gia_mua_amibroker)}`}>
          {fmt(r.gia_mua)}
          <span style={{ color: XANH }}> •</span>
        </span>
      );
    },
  },
  gia_kich_hoat: {
    nhan: "Mốc chuyển mua",
    nhom: "Vị thế đang giữ",
    canPhai: true,
    lay: chiKhiGiu("gia_kich_hoat"),
    hien: (r) => {
      const m = mocKichHoat(r);
      if (!m) return Trong;
      return (
        <div className="flex flex-col items-end leading-tight" title={`${m.nhan}. Giá mua trên hệ thống là giá đóng cửa phiên có tín hiệu.`}>
          <span>{fmt(m.gia)}</span>
          {m.chenhPct != null && (
            <span className="text-[10px]" style={{ color: m.chenhPct > 3 ? VANG : MUTED }}>
              mua {m.chenhPct >= 0 ? "cao" : "thấp"} hơn {soAn(Math.abs(m.chenhPct), 1)}%
            </span>
          )}
        </div>
      );
    },
  },
  // --- VUNG (thay cho tung diem don le) - xem tinhVungLenh() trong dungChung.js
  vung_mua: {
    nhan: "Vùng mua",
    nhom: "Vị thế đang giữ",
    canPhai: true,
    lay: (r) => (tinhSauTP3(r)?.muaMoi?.tu ?? tinhVungLenh(r)?.mua.tu) ?? null,
    hien: (r) => {
      const v = tinhVungLenh(r);
      if (!v) return Trong;
      // Da chot du TP3: tach ro VUNG MUA MOI (tham khao) va GIA MUA CU cua phan con giu.
      const s = tinhSauTP3(r);
      if (s) {
        return (
          <div
            className="flex flex-col items-end leading-tight"
            title={`Đã chốt đủ TP3: tìm điểm mua mới. Vùng mua mới là gợi ý tham khảo (từ hỗ trợ gần nhất bên dưới giá), chưa phải tín hiệu MUA. Phần ${s.viTheCu.tyLeConLai}% còn giữ có giá mua cũ ${fmt(s.viTheCu.giaMua)}.`}
          >
            <span>
              <span className="text-[10px]" style={{ color: XANH }}>
                mới{" "}
              </span>
              {s.muaMoi ? chuoiVung(s.muaMoi.tu, s.muaMoi.den) : "chờ hỗ trợ"}
            </span>
            <span className="text-[10px]" style={{ color: MUTED }}>
              cũ {fmt(s.viTheCu.giaMua)} · giữ {s.viTheCu.tyLeConLai}%
            </span>
          </div>
        );
      }
      const tt = { trong: ["trong vùng", XANH], tren: ["trên vùng", VANG], duoi: ["dưới vùng", DO] }[v.mua.trangThai];
      return (
        <div
          className="flex flex-col items-end leading-tight"
          title={v.mua.coMoc ? "Từ mốc chuyển mua đến giá mua cao hơn tối đa 2% (cao hơn nữa là đuổi giá)" : "Từ giá mua đến cao hơn tối đa 2% (cao hơn nữa là đuổi giá)"}
        >
          <span>{chuoiVung(v.mua.tu, v.mua.den)}</span>
          <span className="text-[10px]" style={{ color: tt[1] }}>
            giá {tt[0]}
          </span>
        </div>
      );
    },
  },
  vung_sl: {
    nhan: "Vùng cắt lỗ",
    nhom: "Vị thế đang giữ",
    canPhai: true,
    lay: (r) => tinhVungLenh(r)?.sl?.tu ?? null,
    hien: (r) => {
      const v = tinhVungLenh(r)?.sl;
      if (!v) return Trong;
      const tt = { cham: ["đã chạm Stop-loss", DO], trong: ["giá trong vùng", VANG], tren: ["giá còn an toàn", MUTED] }[v.trangThai];
      const hoaVon = tinhVungLenh(r)?.hoaVon;
      return (
        <div
          className="flex flex-col items-end leading-tight"
          title={
            v.xa
              ? "Stop-loss lúc mua đã cách giá hiện tại rất xa nên chỉ còn mang tính tham khảo; thoát thật theo tín hiệu BÁN"
              : "Từ Stop-loss (đáy vùng, cắt dứt khoát) lên tới đường hỗ trợ gần nhất phía trên"
          }
        >
          <span style={{ color: v.xa ? MUTED : DO }}>{chuoiVung(v.tu, v.den)}</span>
          <span className="text-[10px]" style={{ color: hoaVon ? VANG : v.xa ? MUTED : tt[1] }}>
            {hoaVon ? `nên dời về hòa vốn ${fmt(hoaVon)}` : v.xa ? "chỉ tham khảo (đã cách xa)" : tt[0]}
          </span>
        </div>
      );
    },
  },
  vung_tp: {
    nhan: "Vùng chốt lời",
    nhom: "Vị thế đang giữ",
    canPhai: true,
    lay: (r) => tinhVungLenh(r)?.tp?.tu ?? null,
    hien: (r) => {
      const v = tinhVungLenh(r)?.tp;
      if (!v) return Trong;
      const c = VUNG.tyLeChot;
      return (
        <div
          className="flex flex-col items-end leading-tight"
          title={`Tỷ lệ chốt ${c.tp1}/${c.tp2}/${c.tp3}/${c.giu}: ${c.tp1}% ở TP1, ${c.tp2}% ở TP2, ${c.tp3}% ở TP3; ${c.giu}% cuối nếu giá còn tăng thì nắm giữ lấy vị thế, thoát theo tín hiệu BÁN`}
        >
          <span style={{ color: v.daCham >= 2 ? XANH : undefined }}>
            <span className="text-[10px]" style={{ color: MUTED }}>
              gần{" "}
            </span>
            {chuoiVung(v.gan.tu, v.gan.den)}
          </span>
          <span style={{ color: v.daCham >= 3 ? XANH : undefined }}>
            <span className="text-[10px]" style={{ color: MUTED }}>
              xa{" "}
            </span>
            {fmt(v.xa)}
          </span>
        </div>
      );
    },
  },
  // Lenh dang mo chua co ngay/gia BAN - giu cot de dung bo cuc cu cua So lenh.
  ngay_ban: { nhan: "Ngày bán", nhom: "Vị thế đang giữ", canPhai: false, lay: null, hien: () => Trong },
  gia_ban: { nhan: "Giá bán", nhom: "Vị thế đang giữ", canPhai: true, lay: null, hien: () => Trong },
  so_phien_giu: {
    nhan: "Số phiên",
    nhom: "Vị thế đang giữ",
    canPhai: true,
    lay: chiKhiGiu("so_phien_giu"),
    hien: (r) => (laDangGiu(r) ? `${r.so_phien_giu ?? "—"} phiên` : Trong),
  },
  lai_lo_pct: {
    nhan: "Lãi/Lỗ",
    nhom: "Vị thế đang giữ",
    canPhai: true,
    lay: chiKhiGiu("lai_lo_pct"),
    hien: (r) =>
      laDangGiu(r) ? (
        <span className="font-bold" style={{ color: r.lai_lo_pct >= 0 ? XANH : DO }}>
          {pct(r.lai_lo_pct, 2)}
        </span>
      ) : (
        Trong
      ),
  },
  chot_loi: {
    nhan: "Chốt lời",
    nhom: "Vị thế đang giữ",
    canPhai: true,
    lay: (r) => (laDangGiu(r) ? tinhChotLoi(r).hang : null),
    hien: (r) =>
      laDangGiu(r) ? (
        <span className="font-bold" style={{ color: tinhChotLoi(r).mau }}>
          {tinhChotLoi(r).nhan}
        </span>
      ) : (
        Trong
      ),
  },

  // --- Gia muc tieu & ho tro
  stop_loss: cotGiaMucTieu("stop_loss", "Stop-loss", 0),
  tp1: cotGiaMucTieu("tp1", "TP1", 1),
  tp2: cotGiaMucTieu("tp2", "TP2", 2),
  tp3: cotGiaMucTieu("tp3", "TP3", 3),
  kijun: cotMucGia("kijun", "Kijun"),
  gg_top: cotMucGia("gg_top", "Cân bằng dài hạn trên"),
  gg_bot: cotMucGia("gg_bot", "Cân bằng dài hạn dưới"),
  dinh_52t: cotMucGia("dinh_52t", "Đỉnh 52 tuần"),
};
