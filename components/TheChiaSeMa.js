// THE CHIA SE 1 MA (ve ngoai man hinh roi chup thanh anh PNG de gui khach - xem components/XuatAnh.js). Mau co dinh (nen toi) de anh nhu nhau du nguoi xuat dang dung giao dien sang hay toi.
// Gom: gia / tin hieu / diem, LENH DANG MO (gia mua, lai-lo, vung mua, cat lo, TP1-3), cac lenh DA DONG gan nhat (diem mua, diem ban, lai-lo), chi bao tom tat va ket luan.
import { fmt, pct, fmtTy, chuoiVung, chamTPCaoNhat, nhanLyDoBan, tinhVungLenh } from "@/components/dungChung";
import { gomTheoLenh, thongKeLenhDaDong } from "@/lib/thongKeLenh";
import { gioChupVN } from "@/lib/xuatAnh";

const C = { nen: "#0E0F1C", card: "#181A2E", vien: "#2A2D48", chu: "#F4F5FB", mo: "#9A9DBB", xanh: "#4ADE80", do: "#F87171", vang: "#FBBF24", tim: "#8B7CF6", cyan: "#5EEAD4" };
const FONT = "var(--font-chu), 'Plus Jakarta Sans', system-ui, sans-serif";

const mauLai = (v) => (v == null ? C.mo : v >= 0 ? C.xanh : C.do);
const ngayVN = (s) => (s ? String(s).slice(0, 10).split("-").reverse().join("/") : "—");
const ngayNgan = (s) => (s ? `${String(s).slice(8, 10)}/${String(s).slice(5, 7)}` : "—");
const TIN = {
  MUA: { nhan: "MUA", mau: C.xanh },
  "NAM GIU": { nhan: "NẮM GIỮ", mau: C.cyan },
  BAN: { nhan: "BÁN", mau: C.do },
  "TRUNG LAP": { nhan: "TRUNG LẬP", mau: C.mo },
};
const LY_DO_DONG = { CAT_LO: "Cắt lỗ", BAO_VE_LAI: "Bảo vệ lãi", BAN: "Bán theo tín hiệu", THOAT: "Thoát lệnh", TP3: "Chạm TP3", CHOT_TP3: "Chạm TP3", TP1: "Chốt lời TP1", TP2: "Chốt lời TP2" };

function Khoi({ tieuDe, children, phu }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.vien}`, borderRadius: 18, padding: "22px 26px", marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: C.tim }}>{tieuDe}</span>
        {phu && <span style={{ fontSize: 13, color: C.mo }}>{phu}</span>}
      </div>
      {children}
    </div>
  );
}

function O({ nhan, giaTri, mau, phu, to = false }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13, color: C.mo, marginBottom: 3 }}>{nhan}</div>
      <div style={{ fontSize: to ? 30 : 22, fontWeight: 800, color: mau ?? C.chu, lineHeight: 1.1 }}>{giaTri}</div>
      {phu && <div style={{ fontSize: 12, color: C.mo, marginTop: 3 }}>{phu}</div>}
    </div>
  );
}

function LenhMo({ l, gia }) {
  const v = tinhVungLenh(l);
  const daCham = v?.tp?.daCham ?? 0;
  const tp = (ten, g, i) => (
    <span key={ten} style={{ marginRight: 14, color: daCham >= i ? C.xanh : C.chu, fontWeight: 700 }}>
      {daCham >= i ? "✔ " : ""}
      {ten} {fmt(g)}
    </span>
  );
  return (
    <div style={{ borderTop: `1px solid ${C.vien}`, paddingTop: 14, marginTop: 14 }}>
      {l.ten_lenh && <div style={{ fontSize: 13, fontWeight: 800, color: C.cyan, marginBottom: 8 }}>{l.ten_lenh}{l.la_lenh_moi ? " · Mua mới" : ""}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 18 }}>
        <O nhan="Giá mua" giaTri={fmt(l.gia_mua)} phu={`ngày ${ngayVN(l.ngay_mua)}`} />
        <O nhan="Lãi / lỗ hiện tại" giaTri={pct(l.lai_lo_pct, 2)} mau={mauLai(l.lai_lo_pct)} phu={l.so_phien_giu === 0 ? "mua hôm nay" : l.so_phien_giu != null ? `giữ ${l.so_phien_giu} phiên` : null} />
        <O nhan="Vùng mua" giaTri={v ? chuoiVung(v.mua.tu, v.mua.den) : "—"} phu={v ? { trong: "giá đang trong vùng", tren: "giá đã vượt vùng", duoi: "giá dưới vùng" }[v.mua.trangThai] : null} />
        <O nhan="Cắt lỗ" giaTri={v?.sl ? chuoiVung(v.sl.tu, v.sl.den) : fmt(l.stop_loss)} mau={C.do} phu={v?.hoaVon ? `đã dời về hòa vốn ${fmt(v.hoaVon)}` : null} />
      </div>
      <div style={{ marginTop: 12, fontSize: 15 }}>
        <span style={{ color: C.mo, marginRight: 10 }}>Chốt lời:</span>
        {tp("TP1", l.tp1, 1)}
        {tp("TP2", l.tp2, 2)}
        {tp("TP3", l.tp3, 3)}
      </div>
      {gia != null && l.gia_mua > 0 && <div style={{ fontSize: 12, color: C.mo, marginTop: 6 }}>Lãi/lỗ tính từ giá mua đến giá hiện tại {fmt(gia)}, chưa trừ phí.</div>}
    </div>
  );
}

// props: row (dong tin hieu cua ma), cacLenh (lenh dang mo da chuan hoa, lenhDangMo), lichSuDaDong (dong lenh_da_dong cua ma), ketLuan (cau ket luan tu dong), vungGia ({ hoTro1, khangCu1 ... }), tag ({ xuHuong, dongTien, adxSucManh, vung })
export default function TheChiaSeMa({ row, cacLenh = [], lichSuDaDong = [], ketLuan = "", vungGia = {}, tag = {} }) {
  const tin = TIN[row.tin] ?? TIN["TRUNG LAP"];
  const lyDoBan = nhanLyDoBan(row);
  const daDong = (lichSuDaDong ?? []).filter((x) => !x.theo_doi);
  const nhom = gomTheoLenh(daDong);
  const tk = thongKeLenhDaDong(daDong);
  // cac lenh da dong GAN NHAT (toi da 5): ngay mua, gia mua, ngay ban + gia ban cua dong cuoi, ket qua ca lenh
  const gan = nhom
    .filter((n) => n.daDong && n.ketQuaPct != null)
    .sort((a, b) => (a.ngayMua < b.ngayMua ? 1 : -1))
    .slice(0, 5)
    .map((n) => {
      const dongLenh = daDong.filter((x) => `${x.ma}|${x.ngay_mua}|${x.vong === 2 ? "moi" : x.vong === 4 || x.vong === 7 || x.vong === 8 ? "giua" : "goc"}` === n.khoa).sort((a, b) => (a.ngay_ban < b.ngay_ban ? -1 : 1));
      const cuoi = dongLenh[dongLenh.length - 1];
      return { ...n, giaMua: dongLenh[0]?.gia_mua, ngayBan: cuoi?.ngay_ban, giaBan: cuoi?.gia_ban, lyDo: LY_DO_DONG[cuoi?.ly_do] ?? "Đóng lệnh" };
    });
  const tpCao = chamTPCaoNhat(row);

  return (
    <div style={{ width: 1080, background: C.nen, color: C.chu, fontFamily: FONT, padding: "34px 40px 28px", boxSizing: "border-box" }}>
      {/* DAU */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-day-du-toi.png" alt="CloudStock" style={{ height: 40, width: "auto" }} />
        <span style={{ fontSize: 13, color: C.mo }}>Dữ liệu cập nhật {row.cap_nhat_luc ? gioChupVN(new Date(row.cap_nhat_luc)) : gioChupVN()}</span>
      </div>

      {/* MA + GIA + TIN HIEU */}
      <div style={{ background: `linear-gradient(135deg, ${C.card}, #20213A)`, border: `1px solid ${C.vien}`, borderRadius: 20, padding: "26px 30px", marginBottom: 18, display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>{row.ma}</div>
          <div style={{ fontSize: 17, color: C.chu, marginTop: 8 }}>{row.ten_cong_ty ?? ""}</div>
          <div style={{ fontSize: 14, color: C.mo, marginTop: 4 }}>{[row.san ? `Sàn ${row.san}` : null, row.nganh, row.von_hoa].filter(Boolean).join(" · ")}</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}>
            <span style={{ background: tin.mau, color: "#0E0F1C", fontWeight: 800, fontSize: 18, padding: "6px 18px", borderRadius: 999 }}>{tin.nhan}</span>
            {lyDoBan && <span style={{ color: C.vang, fontWeight: 700, fontSize: 14 }}>{lyDoBan.nhan}</span>}
            {tpCao && <span style={{ color: C.xanh, fontWeight: 700, fontSize: 14 }}>Đã chạm {tpCao}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1 }}>{fmt(row.gia)}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: mauLai(row.doi), marginTop: 6 }}>{pct(row.doi, 2)}</div>
          <div style={{ fontSize: 14, color: C.mo, marginTop: 12 }}>Điểm hợp lưu</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: row.diem >= 0 ? C.xanh : C.do, lineHeight: 1.1 }}>{fmt(row.diem)}</div>
        </div>
      </div>

      {/* LENH DANG MO */}
      <Khoi tieuDe="Lệnh đang mở" phu={cacLenh.length ? `${cacLenh.length} lệnh` : null}>
        {cacLenh.length ? (
          cacLenh.slice(0, 3).map((l, i) => <div key={l.khoa_lenh ?? i} style={i === 0 ? { marginTop: -14 } : undefined}><LenhMo l={l} gia={row.gia} /></div>)
        ) : (
          <div style={{ fontSize: 16, color: C.mo, lineHeight: 1.5 }}>
            Hiện không có lệnh nào đang mở với mã này. {ketLuan}
          </div>
        )}
      </Khoi>

      {/* DIEM MUA - DIEM BAN DA QUA */}
      <Khoi tieuDe="Điểm mua – bán gần đây" phu={tk.soLenh ? `${tk.soLenh} lệnh đã đóng · thắng ${fmt(tk.tyLeThang)}% · lãi TB ${pct(tk.laiTB, 2)}/lệnh` : null}>
        {gan.length ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.1fr 0.7fr 1.2fr 0.9fr", gap: 10, fontSize: 12, color: C.mo, paddingBottom: 8, borderBottom: `1px solid ${C.vien}` }}>
              <span>Điểm mua</span><span>Điểm bán</span><span>Giữ</span><span>Lý do đóng</span><span style={{ textAlign: "right" }}>Lãi / lỗ</span>
            </div>
            {gan.map((n) => (
              <div key={n.khoa} style={{ display: "grid", gridTemplateColumns: "1.1fr 1.1fr 0.7fr 1.2fr 0.9fr", gap: 10, fontSize: 15, padding: "10px 0", borderBottom: `1px solid ${C.vien}` }}>
                <span>{ngayNgan(n.ngayMua)} · <b>{fmt(n.giaMua)}</b></span>
                <span>{ngayNgan(n.ngayBan)} · <b>{fmt(n.giaBan)}</b></span>
                <span style={{ color: C.mo }}>{n.soPhien != null ? `${n.soPhien} phiên` : "—"}</span>
                <span style={{ color: C.mo }}>{n.lyDo}</span>
                <span style={{ textAlign: "right", fontWeight: 800, color: mauLai(n.ketQuaPct) }}>{pct(n.ketQuaPct, 2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 15, color: C.mo }}>Chưa có lệnh nào của mã này được hệ thống đóng.</div>
        )}
      </Khoi>

      {/* CHI BAO */}
      <Khoi tieuDe="Chỉ báo tóm tắt">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
          <O nhan="Xu hướng" giaTri={tag.xuHuong?.nhan ?? "—"} mau={tag.xuHuong?.mau && tinhMau(tag.xuHuong.mau)} />
          <O nhan="Dòng tiền" giaTri={tag.dongTien?.nhan ?? "—"} mau={tag.dongTien?.mau && tinhMau(tag.dongTien.mau)} />
          <O nhan="Sức mạnh xu hướng (ADX)" giaTri={tag.adxSucManh?.nhan ?? "—"} phu={row.adx != null ? `ADX ${fmt(row.adx)}` : null} mau={tag.adxSucManh?.mau && tinhMau(tag.adxSucManh.mau)} />
          <O nhan="Vùng giá" giaTri={tag.vung?.nhan ?? "—"} mau={tag.vung?.mau && tinhMau(tag.vung.mau)} />
          <O nhan="Hỗ trợ gần nhất" giaTri={fmt(vungGia.hoTro1)} />
          <O nhan="Kháng cự gần nhất" giaTri={fmt(vungGia.khangCu1)} />
          <O nhan="Đỉnh 52 tuần" giaTri={fmt(row.dinh_52t)} />
          <O nhan="GTGD TB20" giaTri={row.gtgd_tb20 != null ? `${fmtTy(row.gtgd_tb20)} tỷ` : "—"} phu={row.von_hoa_ty != null ? `Vốn hóa ${fmtTy(row.von_hoa_ty)} tỷ` : null} />
        </div>
      </Khoi>

      {/* KET LUAN + MIEN TRU */}
      {ketLuan && cacLenh.length > 0 && (
        <div style={{ fontSize: 16, lineHeight: 1.55, color: C.chu, marginBottom: 14 }}>
          <b style={{ color: C.tim }}>Nhận định: </b>
          {ketLuan}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 20, fontSize: 12, color: C.mo, borderTop: `1px solid ${C.vien}`, paddingTop: 12 }}>
        <span><b style={{ color: C.chu }}>CloudStock</b> · cloudstock.id.vn</span>
        <span>Chụp lúc {gioChupVN()} · Không phải khuyến nghị đầu tư. Tín hiệu có thể thay đổi theo từng phiên.</span>
      </div>
    </div>
  );
}

// Mau trong ChiTietMa la bien CSS (var(--xanh)...) - the chia se dung bang mau co dinh.
function tinhMau(v) {
  if (v.includes("xanh")) return C.xanh;
  if (v.includes("do")) return C.do;
  if (v.includes("vang")) return C.vang;
  return C.mo;
}
